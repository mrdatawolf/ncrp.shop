"use client";

import { useActionState } from "react";
import { updatePullListItem } from "@/lib/actions/pull-list";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = ["REQUESTED", "ORDERED", "ARRIVED", "PICKED_UP", "CANCELED"] as const;

export function PullListQuickStatus({
  itemId,
  customerId,
  status,
}: {
  itemId: string;
  customerId: string;
  status: (typeof STATUS_OPTIONS)[number];
}) {
  const [state, action, pending] = useActionState(updatePullListItem, undefined);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="customerId" value={customerId} />
      <Select name="status" defaultValue={status}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {s.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </Button>
      {state?.error && <p className="text-destructive text-xs">{state.error}</p>}
    </form>
  );
}
