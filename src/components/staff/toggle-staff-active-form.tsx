"use client";

import { useActionState } from "react";
import { setStaffAccountActive } from "@/lib/actions/staff";
import { Button } from "@/components/ui/button";

export function ToggleStaffActiveForm({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const [state, action, pending] = useActionState(setStaffAccountActive, undefined);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="isActive" value={(!isActive).toString()} />
      {state?.error && <p className="text-destructive text-xs">{state.error}</p>}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Saving..." : isActive ? "Deactivate" : "Reactivate"}
      </Button>
    </form>
  );
}
