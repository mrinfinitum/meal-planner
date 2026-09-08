"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";

import type { AuthActionState } from "../sign-in/actions";

export async function signUpWithEmail(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) return { error: "Complete each field to create your account." };
  if (password.length < 8) return { error: "Use at least 8 characters for your password." };

  const { error } = await auth.signUp.email({ name, email, password });
  if (error) return { error: error.message || "We couldn't create your account." };

  redirect("/");
}
