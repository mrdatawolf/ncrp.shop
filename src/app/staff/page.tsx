import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StaffOverviewPage() {
  const [customerCount, activeItemCount, readyForPickupCount] = await Promise.all([
    prisma.customer.count(),
    prisma.pullListItem.count({ where: { status: { notIn: ["PICKED_UP", "CANCELED"] } } }),
    prisma.pullListItem.count({ where: { status: "ARRIVED" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl tracking-wide">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/staff/customers" className="block rounded-xl transition-colors hover:bg-accent/50">
          <Card>
            <CardHeader>
              <CardTitle>Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold">{customerCount}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/staff/pull-list?status=active" className="block rounded-xl transition-colors hover:bg-accent/50">
          <Card>
            <CardHeader>
              <CardTitle>Open Pull List Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold">{activeItemCount}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/staff/pull-list?status=ready" className="block rounded-xl transition-colors hover:bg-accent/50">
          <Card>
            <CardHeader>
              <CardTitle>Ready for Pickup</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold">{readyForPickupCount}</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
