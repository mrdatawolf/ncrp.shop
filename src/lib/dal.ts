import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/session";

export const getCurrentUser = cache(async (): Promise<SessionPayload | null> => {
  return getSession();
});

export async function requireUser(): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireStaff(): Promise<SessionPayload> {
  const user = await requireUser();
  if (user.role !== "STAFF" && user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const user = await requireStaff();
  if (user.role !== "ADMIN") redirect("/staff");
  return user;
}

export async function requireCustomer(): Promise<SessionPayload> {
  const user = await requireUser();
  if (user.role !== "CUSTOMER") redirect("/staff");
  return user;
}
