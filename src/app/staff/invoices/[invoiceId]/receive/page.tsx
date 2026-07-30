import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isLlmEnabled } from "@/lib/feature-flags";
import { ReceivingScanner, type ScanFeedEntry } from "@/components/staff/receiving-scanner";

export default async function InvoiceReceivePage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  if (!isLlmEnabled()) notFound();

  const { invoiceId } = await params;

  const invoice = await prisma.vendorInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      lineItems: { include: { _count: { select: { scans: true } } } },
      receivingScans: {
        orderBy: { scannedAt: "desc" },
        include: {
          lineItem: { select: { description: true } },
          scannedBy: { select: { name: true } },
        },
      },
    },
  });

  if (!invoice) notFound();

  const lineItems = invoice.lineItems.map((li) => ({
    id: li.id,
    sku: li.sku,
    description: li.description,
    gtin: li.gtin,
    quantity: li.quantity,
    receivedQuantity: li._count.scans,
  }));

  const scans: ScanFeedEntry[] = invoice.receivingScans.map((scan) => ({
    id: scan.id,
    code: scan.scannedCode,
    matched: scan.lineItemId !== null,
    description: scan.lineItem?.description ?? null,
    scannedByName: scan.scannedBy.name,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-3xl tracking-wide">Receive Shipment</h1>
        <p className="text-muted-foreground text-sm">
          {invoice.vendorName} · Invoice {invoice.invoiceNumber}
        </p>
      </div>

      <ReceivingScanner invoiceId={invoice.id} lineItems={lineItems} scans={scans} />
    </div>
  );
}
