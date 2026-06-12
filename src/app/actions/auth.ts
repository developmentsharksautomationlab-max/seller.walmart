"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import {
  SignupSchema,
  LoginSchema,
  fieldErrors,
  type FormState,
} from "@/lib/definitions";

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}

export async function signup(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  let userId: string;
  try {
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return {
        errors: { email: ["An account with this email already exists."] },
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email: normalizedEmail, passwordHash },
      select: { id: true },
    });
    userId = user.id;

    await createSession(userId);
  } catch (err) {
    // Race: a concurrent signup created the same email between our check and insert.
    if (isUniqueViolation(err)) {
      return {
        errors: { email: ["An account with this email already exists."] },
      };
    }
    console.error("[signup] failed:", err);
    return {
      message: "Something went wrong creating your account. Please try again.",
    };
  }

  // Outside try/catch: redirect throws a control-flow signal that must propagate.
  redirect("/");
}

export async function login(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  const { email, password } = parsed.data;
  // Same generic error for unknown email or wrong password — don't reveal which
  // emails have accounts.
  const invalid: FormState = { message: "Invalid email or password." };

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) return invalid;

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return invalid;

    await createSession(user.id);
  } catch (err) {
    console.error("[login] failed:", err);
    return { message: "Something went wrong signing in. Please try again." };
  }

  redirect("/");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
