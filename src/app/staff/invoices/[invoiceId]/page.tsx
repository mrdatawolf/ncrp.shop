import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { rankCandidates } from "@/lib/invoice-matching";
import { isLlmEnabled } from "@/lib/feature-flags";
import {
  InvoiceMatchingPanel,
  type LineItemView,
} from "@/components/staff/invoice-matching-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  if (!isLlmEnabled()) notFound();

  const { invoiceId } = await params;

  const invoice = await prisma.vendorInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      lineItems: {
        include: {
          allocations: {
            include: {
              pullListItem: { include: { customer: true } },
              confirmedBy: true,
            },
          },
        },
      },
    },
  });

  if (!invoice) notFound();

  const [openPullListItems, customers] = await Promise.all([
    prisma.pullListItem.findMany({
      where: { status: { in: ["REQUESTED", "ORDERED"] } },
      include: { customer: true },
    }),
    prisma.customer.findMany({
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true },
    }),
  ]);

  const candidatePool = openPullListItems.map((item) => ({
    id: item.id,
    title: item.title,
    issueInfo: item.issueInfo,
    customerId: item.customerId,
    customerName: item.customer.displayName,
  }));

  const lineItems: LineItemView[] = invoice.lineItems.map((li) => ({
    id: li.id,
    sku: li.sku,
    description: li.description,
    gtin: li.gtin,
    quantity: li.quantity,
    unitPrice: li.unitPrice.toNumber(),
    lineAmount: li.lineAmount.toNumber(),
    allocations: li.allocations.map((a) => ({
      id: a.id,
      quantity: a.quantity,
      resultingStatus: a.resultingStatus,
      customerId: a.pullListItem.customerId,
      customerName: a.pullListItem.customer.displayName,
      pullListTitle: a.pullListItem.title,
      pullListIssueInfo: a.pullListItem.issueInfo,
      confirmedByName: a.confirmedBy.name,
    })),
    candidates: rankCandidates(li.description, candidatePool).filter((c) => c.score > 0),
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-3xl tracking-wide">{invoice.vendorName}</h1>
        <p className="text-muted-foreground text-sm">
          Invoice {invoice.invoiceNumber}
          {invoice.invoiceDate && ` · ${invoice.invoiceDate.toLocaleDateString()}`}
          {invoice.orderNumber && ` · Order ${invoice.orderNumber}`}
        </p>
      </div>

      <Card className="w-fit">
        <CardHeader>
          <CardTitle>Totals</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-8 text-sm">
          <div>
            <span className="text-muted-foreground">Subtotal</span>
            <p className="font-medium">
              {invoice.subtotal ? `$${invoice.subtotal.toFixed(2)}` : "—"}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Total</span>
            <p className="font-medium">{invoice.total ? `$${invoice.total.toFixed(2)}` : "—"}</p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-heading mb-4 text-xl tracking-wide">Match to Pull List</h2>
        <InvoiceMatchingPanel invoiceId={invoice.id} lineItems={lineItems} customers={customers} />
      </div>
    </div>
  );
}
