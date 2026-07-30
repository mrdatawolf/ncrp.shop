import { prisma } from "@/lib/prisma";
import { NewPullListItemForm } from "@/components/staff/new-pull-list-item-form";

export default async function NewPullListItemPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true },
  });

  return (
    <div className="flex flex-1 justify-center">
      <NewPullListItemForm customers={customers} />
    </div>
  );
}
