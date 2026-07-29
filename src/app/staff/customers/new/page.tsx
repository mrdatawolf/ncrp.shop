"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createCustomer } from "@/lib/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewCustomerPage() {
  const [state, action, pending] = useActionState(createCustomer, undefined);

  if (state && "success" in state) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Customer Created</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm">
              Give this temporary password to the customer now &mdash; it will not be shown
              again. They&rsquo;ll be asked to set their own password on first login.
            </p>
            <div className="bg-muted flex flex-col gap-1 rounded-md p-4">
              <span className="text-muted-foreground text-xs">Email</span>
              <span className="font-mono text-sm">{state.email}</span>
              <span className="text-muted-foreground mt-2 text-xs">Temporary password</span>
              <span className="font-mono text-lg">{state.tempPassword}</span>
            </div>
            <Button render={<Link href="/staff/customers" />} nativeButton={false}>
              Back to Customers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-heading text-2xl tracking-wide">Add Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="displayName">Name</Label>
              <Input id="displayName" name="displayName" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
            {state?.error && <p className="text-destructive text-sm">{state.error}</p>}
            <Button type="submit" disabled={pending} className="mt-2">
              {pending ? "Creating..." : "Create Customer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
