"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@heroui/react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="min-h-screen text-slate-200 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-6 sm:p-8 rounded-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300 text-xl font-bold border border-cyan-400/30">
            P
          </div>
          <h1 className="mt-3 text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-slate-400">
            Sign in to manage your proxies
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <TextInput
            label="Email"
            placeholder="you@example.com"
            type="email"
            isRequired
          />

          <PasswordInput label="Password" placeholder="••••••••" isRequired />

          {/* Hidden error message state to match mockup */}
          <p className="hidden rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            Invalid email or password.
          </p>

          <Button
            color="primary"
            className="w-full rounded-xl bg-cyan-500 py-6 font-semibold text-black hover:bg-cyan-400"
          >
            Sign In
          </Button>
        </form>

        <Button
          variant="bordered"
          className="mt-3 w-full rounded-xl border-white/10 bg-white/5 py-6 text-sm font-medium text-white hover:bg-white/10"
        >
          Continue with Google
        </Button>

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link
            href="/user/password-reset"
            className="text-cyan-300 hover:underline"
          >
            Forgot password?
          </Link>
          <Link href="/user/sign-up" className="text-slate-300 hover:underline">
            Create account
          </Link>
        </div>
      </GlassCard>
    </main>
  );
}
