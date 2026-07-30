"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/dal";
import { extractPdfText } from "@/lib/pdf";
import { parseVendorInvoice, InvoiceExtractionSchema, type InvoiceExtraction } from "@/lib/llm";
import { isLlmEnabled } from "@/lib/feature-flags";

const PULL_LIST_STATUSES = ["REQUESTED", "ORDERED", "ARRIVED", "PICKED_UP", "CANCELED"] as const;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const FEATURE_DISABLED_ERROR = "Vendor invoice import isn't enabled yet.";

export type ParseInvoiceState =
  | { error: string }
  | { success: true; rawText: string; draft: InvoiceExtraction }
  | undefined;

export async function parseVendorInvoiceUpload(
  _prevState: ParseInvoiceState,
  formData: FormData
): Promise<ParseInvoiceState> {
  await requireStaff();
  if (!isLlmEnabled()) return { error: FEATURE_DISABLED_ERROR };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a PDF file." };
  }
  if (file.type !== "application/pdf") {
    return { error: "Only PDF files are supported." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "File is too large (15MB max)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let rawText: string;
  try {
    rawText = await extractPdfText(buffer);
  } catch {
    return { error: "Couldn't read this PDF — it may be corrupted." };
  }

  if (rawText.trim().length < 20) {
    return {
      error:
        "Couldn't find any text in this PDF — it may be a scanned image without a text layer.",
    };
  }

  try {
    const draft = await parseVendorInvoice(rawText);
    return { success: true, rawText, draft };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to parse the invoice." };
  }
}

const SaveInvoiceFormSchema = z.object({
  payload: z.string().min(1),
  rawText: z.string().min(1),
});

export type SaveInvoiceState = { error?: string } | undefined;

export async function saveVendorInvoice(
  _prevState: SaveInvoiceState,
  formData: FormData
): Promise<SaveInvoiceState> {
  const staff = await requireStaff();
  if (!isLlmEnabled()) return { error: FEATURE_DISABLED_ERROR };

  const form = SaveInvoiceFormSchema.safeParse({
    payload: formData.get("payload"),
    rawText: formData.get("rawText"),
  });
  if (!form.success) {
    return { error: "Invalid submission." };
  }

  let json: unknown;
  try {
    json = JSON.parse(form.data.payload);
  } catch {
    return { error: "Invalid invoice data." };
  }

  const parsed = InvoiceExtractionSchema.safeParse(json);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid invoice data." };
  }

  const existing = await prisma.vendorInvoice.findUnique({
    where: {
      vendorName_invoiceNumber: {
        vendorName: parsed.data.vendorName,
        invoiceNumber: parsed.data.invoiceNumber,
      },
    },
  });
  if (existing) {
    return { error: "An invoice with this vendor and invoice number already exists." };
  }

  const invoice = await prisma.vendorInvoice.create({
    data: {
      vendorName: parsed.data.vendorName,
      invoiceNumber: parsed.data.invoiceNumber,
      invoiceDate: parsed.data.invoiceDate ? new Date(parsed.data.invoiceDate) : null,
      orderNumber: parsed.data.orderNumber,
      subtotal: parsed.data.subtotal,
      total: parsed.data.total,
      sourceText: form.data.rawText,
      uploadedByStaffId: staff.userId,
      lineItems: {
        create: parsed.data.lineItems.map((item) => ({
          sku: item.sku,
          description: item.description,
          gtin: item.gtin,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineAmount: item.lineAmount,
        })),
      },
    },
  });

  revalidatePath("/staff/invoices");
  redirect(`/staff/invoices/${invoice.id}`);
}

const ConfirmAllocationSchema = z.object({
  lineItemId: z.string().min(1),
  pullListItemId: z.string().min(1),
  customerId: z.string().min(1),
  invoiceId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  resultingStatus: z.enum(PULL_LIST_STATUSES),
});

export type ConfirmAllocationState = { error?: string } | undefined;

export async function confirmInvoiceAllocation(
  _prevState: ConfirmAllocationState,
  formData: FormData
): Promise<ConfirmAllocationState> {
  const staff = await requireStaff();
  if (!isLlmEnabled()) return { error: FEATURE_DISABLED_ERROR };

  const [pullListItemId, customerId] = String(formData.get("pullListItemAndCustomer") ?? "").split(
    "|"
  );

  const parsed = ConfirmAllocationSchema.safeParse({
    lineItemId: formData.get("lineItemId"),
    pullListItemId,
    customerId,
    invoiceId: formData.get("invoiceId"),
    quantity: formData.get("quantity"),
    resultingStatus: formData.get("resultingStatus"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const lineItem = await prisma.vendorInvoiceLineItem.findUnique({
    where: { id: parsed.data.lineItemId },
    include: { allocations: true },
  });
  if (!lineItem) {
    return { error: "Line item not found." };
  }

  const allocated = lineItem.allocations.reduce((sum, a) => sum + a.quantity, 0);
  const remaining = lineItem.quantity - allocated;
  if (parsed.data.quantity > remaining) {
    return { error: `Only ${remaining} unit(s) remaining on this line item.` };
  }

  await prisma.$transaction([
    prisma.invoiceLineItemAllocation.create({
      data: {
        lineItemId: parsed.data.lineItemId,
        pullListItemId: parsed.data.pullListItemId,
        quantity: parsed.data.quantity,
        resultingStatus: parsed.data.resultingStatus,
        confirmedByStaffId: staff.userId,
      },
    }),
    prisma.pullListItem.update({
      where: { id: parsed.data.pullListItemId },
      data: { status: parsed.data.resultingStatus, updatedByStaffId: staff.userId },
    }),
  ]);

  revalidatePath(`/staff/invoices/${parsed.data.invoiceId}`);
  revalidatePath(`/staff/customers/${parsed.data.customerId}`);
  revalidatePath("/staff/pull-list");
}

const CreateAndAllocateSchema = z.object({
  lineItemId: z.string().min(1),
  invoiceId: z.string().min(1),
  customerId: z.string().min(1),
  title: z.string().min(1, "Title is required."),
  issueInfo: z.string().optional(),
  quantity: z.coerce.number().int().positive(),
  resultingStatus: z.enum(PULL_LIST_STATUSES),
});

export type CreateAndAllocateState = { error?: string } | undefined;

export async function createPullListItemAndAllocate(
  _prevState: CreateAndAllocateState,
  formData: FormData
): Promise<CreateAndAllocateState> {
  const staff = await requireStaff();
  if (!isLlmEnabled()) return { error: FEATURE_DISABLED_ERROR };

  const parsed = CreateAndAllocateSchema.safeParse({
    lineItemId: formData.get("lineItemId"),
    invoiceId: formData.get("invoiceId"),
    customerId: formData.get("customerId"),
    title: formData.get("title"),
    issueInfo: formData.get("issueInfo") || undefined,
    quantity: formData.get("quantity"),
    resultingStatus: formData.get("resultingStatus"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const lineItem = await prisma.vendorInvoiceLineItem.findUnique({
    where: { id: parsed.data.lineItemId },
    include: { allocations: true },
  });
  if (!lineItem) {
    return { error: "Line item not found." };
  }

  const allocated = lineItem.allocations.reduce((sum, a) => sum + a.quantity, 0);
  const remaining = lineItem.quantity - allocated;
  if (parsed.data.quantity > remaining) {
    return { error: `Only ${remaining} unit(s) remaining on this line item.` };
  }

  await prisma.$transaction(async (tx) => {
    const pullListItem = await tx.pullListItem.create({
      data: {
        customerId: parsed.data.customerId,
        title: parsed.data.title,
        issueInfo: parsed.data.issueInfo,
        status: parsed.data.resultingStatus,
        createdByStaffId: staff.userId,
        updatedByStaffId: staff.userId,
      },
    });

    await tx.invoiceLineItemAllocation.create({
      data: {
        lineItemId: parsed.data.lineItemId,
        pullListItemId: pullListItem.id,
        quantity: parsed.data.quantity,
        resultingStatus: parsed.data.resultingStatus,
        confirmedByStaffId: staff.userId,
      },
    });
  });

  revalidatePath(`/staff/invoices/${parsed.data.invoiceId}`);
  revalidatePath(`/staff/customers/${parsed.data.customerId}`);
  revalidatePath("/staff/pull-list");
}

const RemoveAllocationSchema = z.object({
  allocationId: z.string().min(1),
  invoiceId: z.string().min(1),
});

export type RemoveAllocationState = { error?: string } | undefined;

export async function removeInvoiceAllocation(
  _prevState: RemoveAllocationState,
  formData: FormData
): Promise<RemoveAllocationState> {
  await requireStaff();
  if (!isLlmEnabled()) return { error: FEATURE_DISABLED_ERROR };

  const parsed = RemoveAllocationSchema.safeParse({
    allocationId: formData.get("allocationId"),
    invoiceId: formData.get("invoiceId"),
  });
  if (!parsed.success) {
    return { error: "Invalid request." };
  }

  await prisma.invoiceLineItemAllocation.delete({ where: { id: parsed.data.allocationId } });

  revalidatePath(`/staff/invoices/${parsed.data.invoiceId}`);
}
