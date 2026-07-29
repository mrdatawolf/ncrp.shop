"use client";

import { useActionState } from "react";
import { resetCustomerPassword } from "@/lib/actions/customers";
import { Button } from "@/components/ui/button";

export function ResetPasswordButton({ customerId }: { customerId: string }) {
  const [state, action, pending] = useActionState(resetCustomerPassword, undefined);

  if (state && "success" in state) {
    return (
      <div className="bg-muted flex flex-col gap-1 rounded-md p-4">
        <p className="text-sm">
          New temporary password &mdash; give this to the customer now, it will not be shown
          again:
        </p>
        <span className="font-mono text-lg">{state.tempPassword}</span>
      </div>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="customerId" value={customerId} />
      {state?.error && <p className="text-destructive mb-2 text-sm">{state.error}</p>}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  );
}
