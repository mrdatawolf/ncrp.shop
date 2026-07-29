"use client";

import { useActionState } from "react";
import { updateCustomer } from "@/lib/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CustomerProfileForm({
  customerId,
  displayName,
  phone,
  staffNotes,
}: {
  customerId: string;
  displayName: string;
  phone: string | null;
  staffNotes: string | null;
}) {
  const [state, action, pending] = useActionState(updateCustomer, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="customerId" value={customerId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">Name</Label>
        <Input id="displayName" name="displayName" defaultValue={displayName} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={phone ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="staffNotes">Staff notes (internal only)</Label>
        <Textarea id="staffNotes" name="staffNotes" defaultValue={staffNotes ?? ""} rows={3} />
      </div>
      {state?.error && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}
