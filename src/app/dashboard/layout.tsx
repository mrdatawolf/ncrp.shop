import Link from "next/link";
import { requireCustomer } from "@/lib/dal";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCustomer();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4 sm:px-10">
        <Link href="/" className="font-heading text-xl tracking-wide text-primary">
          North Coast Roleplaying
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-sm">{user.name}</span>
          <form action={logout}>
            <Button variant="outline" size="sm" type="submit">
              Sign Out
            </Button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
