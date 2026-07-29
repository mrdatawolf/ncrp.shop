"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import { generateTempPassword } from "@/lib/temp-password";

const CreateStaffSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.email("Enter a valid email."),
  role: z.enum(["STAFF", "ADMIN"]),
});

export type CreateStaffState =
  | { error: string }
  | { success: true; email: string; tempPassword: string }
  | undefined;

export async function createStaffAccount(
  _prevState: CreateStaffState,
  formData: FormData
): Promise<CreateStaffState> {
  await requireAdmin();

  const parsed = CreateStaffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      name: parsed.data.name,
      mustChangePassword: true,
    },
  });

  revalidatePath("/staff/staff-accounts");
  return { success: true, email: parsed.data.email, tempPassword };
}

const ToggleActiveSchema = z.object({
  userId: z.string().min(1),
  isActive: z.enum(["true", "false"]),
});

export type ToggleActiveState = { error?: string } | undefined;

export async function setStaffAccountActive(
  _prevState: ToggleActiveState,
  formData: FormData
): Promise<ToggleActiveState> {
  const admin = await requireAdmin();

  const parsed = ToggleActiveSchema.safeParse({
    userId: formData.get("userId"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  if (parsed.data.userId === admin.userId) {
    return { error: "You cannot deactivate your own account." };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { isActive: parsed.data.isActive === "true" },
  });

  revalidatePath("/staff/staff-accounts");
}
