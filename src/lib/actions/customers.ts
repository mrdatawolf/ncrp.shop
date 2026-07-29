"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/dal";
import { generateTempPassword } from "@/lib/temp-password";

const CreateCustomerSchema = z.object({
  displayName: z.string().min(1, "Name is required."),
  email: z.email("Enter a valid email."),
  phone: z.string().optional(),
});

export type CreateCustomerState =
  | { error: string }
  | { success: true; email: string; tempPassword: string }
  | undefined;

export async function createCustomer(
  _prevState: CreateCustomerState,
  formData: FormData
): Promise<CreateCustomerState> {
  await requireStaff();

  const parsed = CreateCustomerSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
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
      role: "CUSTOMER",
      name: parsed.data.displayName,
      mustChangePassword: true,
      customer: {
        create: {
          displayName: parsed.data.displayName,
          phone: parsed.data.phone,
        },
      },
    },
  });

  revalidatePath("/staff/customers");
  return { success: true, email: parsed.data.email, tempPassword };
}

const UpdateCustomerSchema = z.object({
  customerId: z.string().min(1),
  displayName: z.string().min(1, "Name is required."),
  phone: z.string().optional(),
  staffNotes: z.string().optional(),
});

export type UpdateCustomerState = { error?: string } | undefined;

export async function updateCustomer(
  _prevState: UpdateCustomerState,
  formData: FormData
): Promise<UpdateCustomerState> {
  await requireStaff();

  const parsed = UpdateCustomerSchema.safeParse({
    customerId: formData.get("customerId"),
    displayName: formData.get("displayName"),
    phone: formData.get("phone") || undefined,
    staffNotes: formData.get("staffNotes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { customerId, ...data } = parsed.data;
  await prisma.customer.update({ where: { id: customerId }, data });

  revalidatePath(`/staff/customers/${customerId}`);
}

const ResetPasswordSchema = z.object({ customerId: z.string().min(1) });

export type ResetPasswordState = { error: string } | { success: true; tempPassword: string } | undefined;

export async function resetCustomerPassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  await requireStaff();

  const parsed = ResetPasswordSchema.safeParse({ customerId: formData.get("customerId") });
  if (!parsed.success) return { error: "Invalid request." };

  const customer = await prisma.customer.findUnique({ where: { id: parsed.data.customerId } });
  if (!customer?.userId) return { error: "This customer has no login to reset." };

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await prisma.user.update({
    where: { id: customer.userId },
    data: { passwordHash, mustChangePassword: true },
  });

  revalidatePath(`/staff/customers/${parsed.data.customerId}`);
  return { success: true, tempPassword };
}
