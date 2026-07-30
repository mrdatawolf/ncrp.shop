import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PullListExplorer } from "@/components/staff/pull-list-explorer";

export default async function PullListPage() {
  const items = await prisma.pullListItem.findMany({
    include: { customer: true },
    orderBy: { createdAt: "asc" },
  });

  const explorerItems = items.map((item) => ({
    id: item.id,
    customerId: item.customerId,
    customerName: item.customer.displayName,
    title: item.title,
    issueInfo: item.issueInfo,
    status: item.status,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl tracking-wide">Pull List</h1>
        <Button render={<Link href="/staff/pull-list/new" />} nativeButton={false}>
          Add Item
        </Button>
      </div>

      <PullListExplorer items={explorerItems} />
    </div>
  );
}
