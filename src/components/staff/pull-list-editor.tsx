"use client";

import { useActionState } from "react";
import { addPullListItem, updatePullListItem } from "@/lib/actions/pull-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = ["REQUESTED", "ORDERED", "ARRIVED", "PICKED_UP", "CANCELED"] as const;

type PullListItem = {
  id: string;
  title: string;
  issueInfo: string | null;
  status: (typeof STATUS_OPTIONS)[number];
  internalNotes: string | null;
  customerNote: string | null;
};

export function AddPullListItemForm({ customerId }: { customerId: string }) {
  const [state, action, pending] = useActionState(addPullListItem, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="customerId" value={customerId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required className="w-48" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="issueInfo">Issue / details</Label>
        <Input id="issueInfo" name="issueInfo" className="w-48" />
      </div>
      {state?.error && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add Item"}
      </Button>
    </form>
  );
}

export function PullListItemRow({
  item,
  customerId,
}: {
  item: PullListItem;
  customerId: string;
}) {
  const [state, action, pending] = useActionState(updatePullListItem, undefined);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium">{item.title}</p>
            {item.issueInfo && (
              <p className="text-muted-foreground text-sm">{item.issueInfo}</p>
            )}
          </div>
          <Badge variant="outline">{item.status.replace("_", " ")}</Badge>
        </div>

        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="customerId" value={customerId} />

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`status-${item.id}`}>Status</Label>
              <Select name="status" defaultValue={item.status}>
                <SelectTrigger id={`status-${item.id}`} className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`internalNotes-${item.id}`}>Internal notes (staff only)</Label>
              <Textarea
                id={`internalNotes-${item.id}`}
                name="internalNotes"
                defaultValue={item.internalNotes ?? ""}
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`customerNote-${item.id}`}>Note to customer</Label>
              <Textarea
                id={`customerNote-${item.id}`}
                name="customerNote"
                defaultValue={item.customerNote ?? ""}
                rows={2}
              />
            </div>
          </div>

          {state?.error && <p className="text-destructive text-sm">{state.error}</p>}
          <Button type="submit" disabled={pending} size="sm" className="w-fit">
            {pending ? "Saving..." : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
