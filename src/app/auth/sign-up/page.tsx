"use client";

import { ArrowRight, Leaf, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { signUpWithEmail } from "./actions";

export default function SignUpPage() {
  const [state, action, pending] = useActionState(signUpWithEmail, null);

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="Plenty meal planning">
        <Link className="auth-brand" href="/"><span><Leaf size={20} /></span>plenty.</Link>
        <div>
          <p className="auth-kicker">Less planning. More sharing.</p>
          <h1>Your family’s food life, all in one place.</h1>
          <p>Save recipes, plan dinners, track what’s in the fridge, and build a smarter shopping list.</p>
        </div>
        <p className="auth-footnote">One private workspace for your household</p>
      </section>
      <section className="auth-panel">
        <form action={action} className="auth-form">
          <div className="auth-mobile-brand"><span><Leaf size={18} /></span>plenty.</div>
          <p className="eyebrow">Start your household</p>
          <h2>Create your account</h2>
          <p className="auth-intro">We’ll set up your private family cookbook and first weekly plan.</p>
          <label htmlFor="name">Your name</label>
          <div className="auth-input"><UserRound size={18} /><input id="name" name="name" autoComplete="name" placeholder="Geoff Parker" required /></div>
          <label htmlFor="email">Email address</label>
          <div className="auth-input"><Mail size={18} /><input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></div>
          <label htmlFor="password">Password</label>
          <div className="auth-input"><LockKeyhole size={18} /><input id="password" name="password" type="password" minLength={8} autoComplete="new-password" placeholder="At least 8 characters" required /></div>
          {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
          <button className="auth-submit" type="submit" disabled={pending}>{pending ? "Creating your kitchen…" : <>Create account <ArrowRight size={18} /></>}</button>
          <p className="auth-switch">Already have an account? <Link href="/auth/sign-in">Sign in</Link></p>
        </form>
      </section>
    </main>
  );
}
