"use client";

import { ArrowRight, Leaf, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { signInWithEmail } from "./actions";

export default function SignInPage() {
  const [state, action, pending] = useActionState(signInWithEmail, null);

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="Plenty meal planning">
        <Link className="auth-brand" href="/"><span><Leaf size={20} /></span>plenty.</Link>
        <div>
          <p className="auth-kicker">Your family kitchen, organized</p>
          <h1>Plan the week.<br />Shop once. Eat well.</h1>
          <p>Keep recipes, weekly menus, fridge inventory, and shopping lists together in one calm place.</p>
        </div>
        <p className="auth-footnote">Private by default · Built for the whole household</p>
      </section>
      <section className="auth-panel">
        <form action={action} className="auth-form">
          <div className="auth-mobile-brand"><span><Leaf size={18} /></span>plenty.</div>
          <p className="eyebrow">Welcome back</p>
          <h2>Sign in to your kitchen</h2>
          <p className="auth-intro">Your weekly plan and family cookbook are waiting.</p>
          <label htmlFor="email">Email address</label>
          <div className="auth-input"><Mail size={18} /><input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></div>
          <label htmlFor="password">Password</label>
          <div className="auth-input"><LockKeyhole size={18} /><input id="password" name="password" type="password" autoComplete="current-password" placeholder="Your password" required /></div>
          {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
          <button className="auth-submit" type="submit" disabled={pending}>{pending ? "Signing in…" : <>Sign in <ArrowRight size={18} /></>}</button>
          <p className="auth-switch">New to Plenty? <Link href="/auth/sign-up">Create an account</Link></p>
        </form>
      </section>
    </main>
  );
}
