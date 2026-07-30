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
        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-4xl font-semibold">{customerCount}</p>
            <Link href="/staff/customers" className="text-sm hover:underline">
              View Customers &rarr;
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open Pull List Items</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-4xl font-semibold">{activeItemCount}</p>
            <Link href="/staff/pull-list?status=active" className="text-sm hover:underline">
              View Pull List &rarr;
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ready for Pickup</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-4xl font-semibold">{readyForPickupCount}</p>
            <Link href="/staff/pull-list?status=ready" className="text-sm hover:underline">
              View Ready for Pickup &rarr;
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
