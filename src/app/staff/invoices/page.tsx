import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isLlmEnabled } from "@/lib/feature-flags";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function InvoicesPage() {
  if (!isLlmEnabled()) notFound();

  const invoices = await prisma.vendorInvoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lineItems: { include: { allocations: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl tracking-wide">Vendor Invoices</h1>
        <Button render={<Link href="/staff/invoices/new" />} nativeButton={false}>
          Upload Invoice
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor</TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Matched</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const totalUnits = invoice.lineItems.reduce((sum, li) => sum + li.quantity, 0);
            const matchedUnits = invoice.lineItems.reduce(
              (sum, li) => sum + li.allocations.reduce((s, a) => s + a.quantity, 0),
              0
            );
            return (
              <TableRow key={invoice.id}>
                <TableCell>
                  <Link
                    href={`/staff/invoices/${invoice.id}`}
                    className="font-medium hover:underline"
                  >
                    {invoice.vendorName}
                  </Link>
                </TableCell>
                <TableCell>{invoice.invoiceNumber}</TableCell>
                <TableCell>
                  {invoice.invoiceDate ? invoice.invoiceDate.toLocaleDateString() : "—"}
                </TableCell>
                <TableCell>{invoice.total ? `$${invoice.total.toFixed(2)}` : "—"}</TableCell>
                <TableCell>
                  {matchedUnits} of {totalUnits} units
                </TableCell>
                <TableCell>
                  <Link
                    href={`/staff/invoices/${invoice.id}/receive`}
                    className="text-sm hover:underline"
                  >
                    Receive &rarr;
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
          {invoices.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground text-center">
                No invoices uploaded yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
