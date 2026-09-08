"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";

export type AuthActionState = { error: string } | null;

export async function signInWithEmail(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  const { error } = await auth.signIn.email({ email, password });
  if (error) return { error: error.message || "We couldn't sign you in." };

  redirect("/");
}
