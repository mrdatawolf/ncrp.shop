"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { requireUser } from "@/lib/dal";

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginState = { error?: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { customer: true },
  });

  if (!user || !user.isActive) {
    return { error: "Invalid email or password." };
  }

  const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordsMatch) {
    return { error: "Invalid email or password." };
  }

  await createSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    mustChangePassword: user.mustChangePassword,
    customerId: user.customer?.id,
  });

  if (user.mustChangePassword) {
    redirect("/change-password");
  }
  redirect(user.role === "CUSTOMER" ? "/dashboard" : "/staff");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

const ChangePasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(1),
});

export type ChangePasswordState = { error?: string } | undefined;

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const user = await requireUser();

  const parsed = ChangePasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: user.userId },
    data: { passwordHash, mustChangePassword: false },
  });

  await createSession({ ...user, mustChangePassword: false });
  redirect(user.role === "CUSTOMER" ? "/dashboard" : "/staff");
}
