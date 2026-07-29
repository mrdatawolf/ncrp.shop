import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CustomerProfileForm } from "@/components/staff/customer-profile-form";
import { ResetPasswordButton } from "@/components/staff/reset-password-button";
import { AddPullListItemForm, PullListItemRow } from "@/components/staff/pull-list-editor";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      user: true,
      pullListItems: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-3xl tracking-wide">{customer.displayName}</h1>
        <p className="text-muted-foreground text-sm">{customer.user?.email ?? "No login"}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerProfileForm
                customerId={customer.id}
                displayName={customer.displayName}
                phone={customer.phone}
                staffNotes={customer.staffNotes}
              />
            </CardContent>
          </Card>

          {customer.userId && (
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent>
                <ResetPasswordButton customerId={customer.id} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-xl tracking-wide">Pull List</h2>
          <AddPullListItemForm customerId={customer.id} />
          <Separator />
          <div className="flex flex-col gap-3">
            {customer.pullListItems.map((item) => (
              <PullListItemRow
                key={`${item.id}-${item.status}`}
                item={item}
                customerId={customer.id}
              />
            ))}
            {customer.pullListItems.length === 0 && (
              <p className="text-muted-foreground text-sm">No pull list items yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
