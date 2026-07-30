"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/dal";

const PULL_LIST_STATUSES = ["REQUESTED", "ORDERED", "ARRIVED", "PICKED_UP", "CANCELED"] as const;

const AddItemSchema = z.object({
  customerId: z.string().min(1),
  title: z.string().min(1, "Title is required."),
  issueInfo: z.string().optional(),
});

export type AddItemState = { error: string } | { success: true } | undefined;

export async function addPullListItem(
  _prevState: AddItemState,
  formData: FormData
): Promise<AddItemState> {
  const staff = await requireStaff();

  const parsed = AddItemSchema.safeParse({
    customerId: formData.get("customerId"),
    title: formData.get("title"),
    issueInfo: formData.get("issueInfo") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await prisma.pullListItem.create({
    data: {
      customerId: parsed.data.customerId,
      title: parsed.data.title,
      issueInfo: parsed.data.issueInfo,
      createdByStaffId: staff.userId,
      updatedByStaffId: staff.userId,
    },
  });

  revalidatePath(`/staff/customers/${parsed.data.customerId}`);
  revalidatePath("/staff/pull-list");
  return { success: true };
}

const UpdateItemSchema = z.object({
  itemId: z.string().min(1),
  customerId: z.string().min(1),
  status: z.enum(PULL_LIST_STATUSES),
  internalNotes: z.string().optional(),
  customerNote: z.string().optional(),
});

export type UpdateItemState = { error?: string } | undefined;

export async function updatePullListItem(
  _prevState: UpdateItemState,
  formData: FormData
): Promise<UpdateItemState> {
  const staff = await requireStaff();

  const parsed = UpdateItemSchema.safeParse({
    itemId: formData.get("itemId"),
    customerId: formData.get("customerId"),
    status: formData.get("status"),
    internalNotes: formData.get("internalNotes") || undefined,
    customerNote: formData.get("customerNote") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await prisma.pullListItem.update({
    where: { id: parsed.data.itemId },
    data: {
      status: parsed.data.status,
      internalNotes: parsed.data.internalNotes,
      customerNote: parsed.data.customerNote,
      updatedByStaffId: staff.userId,
    },
  });

  revalidatePath(`/staff/customers/${parsed.data.customerId}`);
  revalidatePath("/staff/pull-list");
}
