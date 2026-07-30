import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PullListQuickStatus } from "@/components/staff/pull-list-quick-status";

const TABS = [
  { key: "active", label: "Active" },
  { key: "ready", label: "Ready for Pickup" },
  { key: "all", label: "All" },
] as const;

const ACTIVE_STATUSES: ("REQUESTED" | "ORDERED" | "ARRIVED")[] = [
  "REQUESTED",
  "ORDERED",
  "ARRIVED",
];

export default async function PullListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "active", q } = await searchParams;

  const statusFilter =
    status === "ready"
      ? { status: "ARRIVED" as const }
      : status === "all"
        ? {}
        : { status: { in: ACTIVE_STATUSES } };

  const items = await prisma.pullListItem.findMany({
    where: {
      ...statusFilter,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { customer: { displayName: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { customer: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl tracking-wide">Pull List</h1>
        <Button render={<Link href="/staff/pull-list/new" />} nativeButton={false}>
          Add Item
        </Button>
      </div>

      <div className="flex items-center gap-4 border-b pb-2">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/staff/pull-list?status=${tab.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={
              status === tab.key
                ? "text-primary border-primary border-b-2 pb-2 text-sm font-medium"
                : "text-muted-foreground pb-2 text-sm font-medium hover:underline"
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <form className="max-w-sm">
        <input type="hidden" name="status" value={status} />
        <Input type="search" name="q" placeholder="Search by title or customer" defaultValue={q} />
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Link
                  href={`/staff/customers/${item.customerId}`}
                  className="font-medium hover:underline"
                >
                  {item.customer.displayName}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{item.title}</span>
                  {item.issueInfo && (
                    <span className="text-muted-foreground text-xs">{item.issueInfo}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.status.replace("_", " ")}</Badge>
                  <PullListQuickStatus
                    key={`${item.id}-${item.status}`}
                    itemId={item.id}
                    customerId={item.customerId}
                    status={item.status}
                  />
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {item.createdAt.toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground text-center">
                No pull list items found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
