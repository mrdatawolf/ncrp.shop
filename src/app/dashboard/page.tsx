import { requireCustomer } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Requested",
  ORDERED: "Ordered",
  ARRIVED: "Arrived — ready for pickup",
  PICKED_UP: "Picked up",
  CANCELED: "Canceled",
};

export default async function DashboardPage() {
  const user = await requireCustomer();

  if (!user.customerId) {
    return (
      <p className="text-muted-foreground">
        No pull list is set up on your account yet. Ask us in-store to get started.
      </p>
    );
  }

  const items = await prisma.pullListItem.findMany({
    where: { customerId: user.customerId },
    orderBy: { createdAt: "desc" },
  });

  const activeItems = items.filter((item) => !["PICKED_UP", "CANCELED"].includes(item.status));
  const historyItems = items.filter((item) => ["PICKED_UP", "CANCELED"].includes(item.status));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-3xl tracking-wide">Your Pull List</h1>
        <p className="text-muted-foreground text-sm">Welcome back, {user.name}.</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl tracking-wide">Active</h2>
        {activeItems.length === 0 && (
          <p className="text-muted-foreground text-sm">Nothing on hold right now.</p>
        )}
        {activeItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-col gap-2 pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.issueInfo && (
                    <p className="text-muted-foreground text-sm">{item.issueInfo}</p>
                  )}
                </div>
                <Badge variant="outline">{STATUS_LABELS[item.status]}</Badge>
              </div>
              {item.customerNote && (
                <p className="text-muted-foreground text-sm">{item.customerNote}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      {historyItems.length > 0 && (
        <details className="flex flex-col gap-3">
          <summary className="font-heading cursor-pointer text-xl tracking-wide">
            History
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {historyItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-start justify-between gap-4 pt-6">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    {item.issueInfo && (
                      <p className="text-muted-foreground text-sm">{item.issueInfo}</p>
                    )}
                  </div>
                  <Badge variant="outline">{STATUS_LABELS[item.status]}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
