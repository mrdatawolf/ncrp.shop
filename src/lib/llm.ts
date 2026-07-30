import "server-only";
import OpenAI from "openai";
import { z } from "zod";

const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY || "not-needed",
});

const InvoiceLineItemExtractionSchema = z.object({
  sku: z.string().nullable(),
  description: z.string().min(1),
  gtin: z.string().nullable(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  lineAmount: z.number().nonnegative(),
});

// Local/small models frequently ignore the "YYYY-MM-DD" instruction (e.g.
// returning "August 14, 2025" instead) — normalize via Date parsing rather
// than rejecting anything that isn't already in the exact format.
const FlexibleDateSchema = z
  .string()
  .nullable()
  .transform((val, ctx) => {
    if (!val) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const parsedDate = new Date(val);
    if (Number.isNaN(parsedDate.getTime())) {
      ctx.addIssue({ code: "custom", message: `Could not parse invoice date "${val}"` });
      return z.NEVER;
    }
    return parsedDate.toISOString().slice(0, 10);
  });

export const InvoiceExtractionSchema = z.object({
  vendorName: z.string().min(1),
  invoiceNumber: z.string().min(1),
  invoiceDate: FlexibleDateSchema,
  orderNumber: z.string().nullable(),
  subtotal: z.number().nullable(),
  total: z.number().nullable(),
  lineItems: z.array(InvoiceLineItemExtractionSchema).min(1),
});

export type InvoiceExtraction = z.infer<typeof InvoiceExtractionSchema>;

const SYSTEM_PROMPT = `You extract structured data from vendor invoice text for a comic/tabletop game shop.
Return ONLY a single JSON object, no markdown code fences, no commentary, matching exactly this shape:
{
  "vendorName": string,
  "invoiceNumber": string,
  "invoiceDate": string in YYYY-MM-DD format, or null if not found,
  "orderNumber": string or null,
  "subtotal": number or null,
  "total": number or null,
  "lineItems": [
    { "sku": string or null, "description": string, "gtin": string or null,
      "quantity": number, "unitPrice": number, "lineAmount": number }
  ]
}
Use null for any field you cannot confidently find. Numbers must be plain numbers, not strings, with no currency symbols or commas.`;

function extractJsonObject(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}

export async function parseVendorInvoice(rawText: string): Promise<InvoiceExtraction> {
  const completion = await client.chat.completions.create({
    model: process.env.LLM_MODEL!,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: rawText },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "";

  let json: unknown;
  try {
    json = JSON.parse(extractJsonObject(content));
  } catch {
    throw new Error("The AI's response wasn't valid JSON. Try again, or enter the invoice manually.");
  }

  const parsed = InvoiceExtractionSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `The AI's response didn't match the expected invoice shape: ${parsed.error.issues[0]?.message ?? "unknown error"}`
    );
  }
  return parsed.data;
}
