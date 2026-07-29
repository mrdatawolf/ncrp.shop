import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { displayName: { contains: q, mode: "insensitive" } },
            { user: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: { user: true, _count: { select: { pullListItems: true } } },
    orderBy: { displayName: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl tracking-wide">Customers</h1>
        <Button render={<Link href="/staff/customers/new" />} nativeButton={false}>
          Add Customer
        </Button>
      </div>

      <form className="max-w-sm">
        <Input type="search" name="q" placeholder="Search by name or email" defaultValue={q} />
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Pull List Items</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <Link
                  href={`/staff/customers/${customer.id}`}
                  className="font-medium hover:underline"
                >
                  {customer.displayName}
                </Link>
              </TableCell>
              <TableCell>{customer.user?.email ?? "—"}</TableCell>
              <TableCell>{customer.phone ?? "—"}</TableCell>
              <TableCell>{customer._count.pullListItems}</TableCell>
            </TableRow>
          ))}
          {customers.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground text-center">
                No customers found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
