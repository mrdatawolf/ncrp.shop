import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function StaffOverviewPage() {
  const [customerCount, openItemCount] = await Promise.all([
    prisma.customer.count(),
    prisma.pullListItem.count({ where: { status: { notIn: ["PICKED_UP", "CANCELED"] } } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl tracking-wide">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{customerCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open Pull List Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{openItemCount}</p>
          </CardContent>
        </Card>
      </div>
      <Button render={<Link href="/staff/customers" />} nativeButton={false} className="w-fit">
        View Customers
      </Button>
    </div>
  );
}
