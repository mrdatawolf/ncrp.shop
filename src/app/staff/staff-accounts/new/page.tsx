"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createStaffAccount } from "@/lib/actions/staff";
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

export default function NewStaffAccountPage() {
  const [state, action, pending] = useActionState(createStaffAccount, undefined);

  if (state && "success" in state) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Staff Account Created</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm">
              Give this temporary password to the new staff member now &mdash; it will not be
              shown again. They&rsquo;ll be asked to set their own password on first login.
            </p>
            <div className="bg-muted flex flex-col gap-1 rounded-md p-4">
              <span className="text-muted-foreground text-xs">Email</span>
              <span className="font-mono text-sm">{state.email}</span>
              <span className="text-muted-foreground mt-2 text-xs">Temporary password</span>
              <span className="font-mono text-lg">{state.tempPassword}</span>
            </div>
            <Button render={<Link href="/staff/staff-accounts" />} nativeButton={false}>
              Back to Staff Accounts
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
          <CardTitle className="font-heading text-2xl tracking-wide">
            Add Staff Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                name="role"
                defaultValue="STAFF"
                items={{ STAFF: "Staff", ADMIN: "Admin" }}
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {state?.error && <p className="text-destructive text-sm">{state.error}</p>}
            <Button type="submit" disabled={pending} className="mt-2">
              {pending ? "Creating..." : "Create Staff Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
