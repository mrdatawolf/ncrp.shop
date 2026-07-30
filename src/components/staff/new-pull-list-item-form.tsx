"use client";

import { useActionState } from "react";
import Link from "next/link";
import { addPullListItem } from "@/lib/actions/pull-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function NewPullListItemForm({
  customers,
}: {
  customers: { id: string; displayName: string }[];
}) {
  const [state, action, pending] = useActionState(addPullListItem, undefined);

  if (state && "success" in state) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Item Added</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm">The pull-list item has been added.</p>
          <div className="flex gap-3">
            <Button render={<Link href="/staff/pull-list/new" />} nativeButton={false}>
              Add Another
            </Button>
            <Button
              render={<Link href="/staff/pull-list" />}
              nativeButton={false}
              variant="outline"
            >
              Back to Pull List
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-heading text-2xl tracking-wide">
          Add Pull List Item
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="customerId">Customer</Label>
            <Select
              name="customerId"
              required
              items={Object.fromEntries(customers.map((c) => [c.id, c.displayName]))}
            >
              <SelectTrigger id="customerId" className="w-full">
                <SelectValue placeholder="Choose a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="issueInfo">Issue / details</Label>
            <Input id="issueInfo" name="issueInfo" />
          </div>
          {state && "error" in state && (
            <p className="text-destructive text-sm">{state.error}</p>
          )}
          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? "Adding..." : "Add Item"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
