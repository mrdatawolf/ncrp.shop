"use client";

import { useActionState, useState } from "react";
import { parseVendorInvoiceUpload, saveVendorInvoice } from "@/lib/actions/invoices";
import type { InvoiceExtraction } from "@/lib/llm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type LineItem = InvoiceExtraction["lineItems"][number];

function emptyLineItem(): LineItem {
  return { sku: "", description: "", gtin: "", quantity: 1, unitPrice: 0, lineAmount: 0 };
}

export function InvoiceUploadWizard() {
  const [uploadState, uploadAction, uploadPending] = useActionState(
    parseVendorInvoiceUpload,
    undefined
  );

  if (uploadState && "success" in uploadState) {
    return (
      <InvoiceReviewForm initialDraft={uploadState.draft} rawText={uploadState.rawText} />
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="font-heading text-2xl tracking-wide">Upload Invoice</CardTitle>
        <p className="text-muted-foreground text-sm">
          Upload a vendor invoice PDF. We&rsquo;ll read it and pull out the line items for you
          to review.
        </p>
      </CardHeader>
      <CardContent>
        <form action={uploadAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="file">Invoice PDF</Label>
            <Input id="file" name="file" type="file" accept="application/pdf" required />
          </div>
          {uploadState?.error && (
            <p className="text-destructive text-sm">{uploadState.error}</p>
          )}
          <Button type="submit" disabled={uploadPending} className="mt-2">
            {uploadPending ? "Reading invoice..." : "Upload & Parse"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function InvoiceReviewForm({
  initialDraft,
  rawText,
}: {
  initialDraft: InvoiceExtraction;
  rawText: string;
}) {
  const [draft, setDraft] = useState<InvoiceExtraction>(initialDraft);
  const [saveState, saveAction, savePending] = useActionState(saveVendorInvoice, undefined);

  function updateField<K extends keyof InvoiceExtraction>(key: K, value: InvoiceExtraction[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function updateLineItem(index: number, patch: Partial<LineItem>) {
    setDraft((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  function removeLineItem(index: number) {
    setDraft((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));
  }

  function addLineItem() {
    setDraft((prev) => ({ ...prev, lineItems: [...prev.lineItems, emptyLineItem()] }));
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="font-heading text-2xl tracking-wide">Review Invoice</CardTitle>
        <p className="text-muted-foreground text-sm">
          Check the extracted details against the PDF and correct anything that looks wrong
          before saving.
        </p>
      </CardHeader>
      <CardContent>
        <form action={saveAction} className="flex flex-col gap-6">
          <input type="hidden" name="payload" value={JSON.stringify(draft)} />
          <input type="hidden" name="rawText" value={rawText} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="vendorName">Vendor</Label>
              <Input
                id="vendorName"
                value={draft.vendorName}
                onChange={(e) => updateField("vendorName", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invoiceNumber">Invoice #</Label>
              <Input
                id="invoiceNumber"
                value={draft.invoiceNumber}
                onChange={(e) => updateField("invoiceNumber", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={draft.invoiceDate ?? ""}
                onChange={(e) => updateField("invoiceDate", e.target.value || null)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="orderNumber">Order #</Label>
              <Input
                id="orderNumber"
                value={draft.orderNumber ?? ""}
                onChange={(e) => updateField("orderNumber", e.target.value || null)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="subtotal">Subtotal</Label>
              <Input
                id="subtotal"
                type="number"
                step="0.01"
                value={draft.subtotal ?? ""}
                onChange={(e) =>
                  updateField("subtotal", e.target.value === "" ? null : Number(e.target.value))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="total">Total</Label>
              <Input
                id="total"
                type="number"
                step="0.01"
                value={draft.total ?? ""}
                onChange={(e) =>
                  updateField("total", e.target.value === "" ? null : Number(e.target.value))
                }
              />
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <h3 className="font-heading text-lg tracking-wide">Line Items</h3>
            {draft.lineItems.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-2 gap-3 rounded-md border p-3 sm:grid-cols-6"
              >
                <Input
                  placeholder="SKU"
                  value={item.sku ?? ""}
                  onChange={(e) => updateLineItem(index, { sku: e.target.value || null })}
                />
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateLineItem(index, { description: e.target.value })}
                  className="sm:col-span-2"
                />
                <Input
                  placeholder="GTIN"
                  value={item.gtin ?? ""}
                  onChange={(e) => updateLineItem(index, { gtin: e.target.value || null })}
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) =>
                    updateLineItem(index, { quantity: Number(e.target.value) || 0 })
                  }
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Unit price"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateLineItem(index, { unitPrice: Number(e.target.value) || 0 })
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeLineItem(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addLineItem} className="w-fit">
              Add Line Item
            </Button>
          </div>

          {saveState?.error && <p className="text-destructive text-sm">{saveState.error}</p>}
          <Button type="submit" disabled={savePending} className="w-fit">
            {savePending ? "Saving..." : "Save Invoice"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
