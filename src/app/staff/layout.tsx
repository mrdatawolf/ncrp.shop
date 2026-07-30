import Link from "next/link";
import { requireStaff } from "@/lib/dal";
import { logout } from "@/lib/actions/auth";
import { isLlmEnabled } from "@/lib/feature-flags";
import { Button } from "@/components/ui/button";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4 sm:px-10">
        <nav className="flex items-center gap-6">
          <Link href="/staff" className="font-heading text-xl tracking-wide text-primary">
            North Coast Roleplaying
          </Link>
          <Link href="/staff/customers" className="text-sm font-medium hover:underline">
            Customers
          </Link>
          <Link href="/staff/pull-list" className="text-sm font-medium hover:underline">
            Pull List
          </Link>
          {isLlmEnabled() && (
            <Link href="/staff/invoices" className="text-sm font-medium hover:underline">
              Invoices
            </Link>
          )}
          {user.role === "ADMIN" && (
            <Link href="/staff/staff-accounts" className="text-sm font-medium hover:underline">
              Staff Accounts
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-sm">
            {user.name} &middot; {user.role}
          </span>
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
