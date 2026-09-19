"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "@heroui/react";
import { GoogleAuthButton } from "@/components/ui/GoogleAuthButton";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { TextInput } from "@/components/ui/TextInput";
import Link from "next/link";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";
import { Check } from "@gravity-ui/icons";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(true);

  const handleGoogleSignUp = async () => {
    if (!agreed) {
      setError("Please agree to the Terms & Privacy Policy first.");
      return;
    }
    setGooglePending(true);
    try {
      sessionStorage.setItem("oauth_welcome", "1");
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/user/dashboard",
      });
    } catch (err) {
      setError("Failed to sign up with Google.");
      setGooglePending(false);
    }
  };

  const bindReferral = async () => {
    try {
      const refCode = localStorage.getItem("ref");
      if (refCode) {
        await fetch("/api/affiliate/bind", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refCode }),
        });
        localStorage.removeItem("ref");
      }
    } catch (err) {
      console.error("Failed to bind referral:", err);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("Please agree to the Terms & Privacy Policy first.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const { error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (signUpError) {
        setError(signUpError.message || "Failed to create account.");
        notifyError("Sign-up failed", signUpError.message || "An error occurred.");
        setIsLoading(false);
        return;
      }

      notifySuccess("Account created", "Welcome to ProxyData.");
      await bindReferral();
      router.push("/user/dashboard");
    } catch (err) {
      setError("An unexpected error occurred.");
      notifyError("Sign-up failed", "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-zinc-950">
      
      {/* LEFT SIDE - BRANDING (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900/30 border-r border-white/5 items-center justify-center overflow-hidden p-12">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none" />
        
        <div className="relative z-10 max-w-lg w-full">
          <Link href="/" className="flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity w-fit">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 font-bold text-2xl shadow-glow">
              P
            </div>
            <span className="font-bold text-3xl tracking-tight text-white">
              Proxy<span className="text-cyan-400">Data</span>
            </span>
          </Link>

          <h2 className="text-4xl xl:text-5xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
            Scale your <br/>infrastructure instantly.
          </h2>
          <p className="text-lg text-zinc-400 leading-relaxed mb-10 max-w-md">
            Access millions of ethical, rotating IPs globally. Built for developers, trusted by data-driven enterprises.
          </p>

          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shrink-0">
                <Check width={18} />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Instant Activation</h4>
                <p className="text-zinc-500 text-xs mt-0.5">Top-up via bKash/Nagad and get credentials immediately.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shrink-0">
                <Check width={18} />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Pay-As-You-Go</h4>
                <p className="text-zinc-500 text-xs mt-0.5">No hidden fees or expiring monthly subscriptions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative min-h-screen lg:min-h-0">
        
        {/* Mobile Background Glow (Visible only on small screens) */}
        <div className="absolute top-0 right-0 w-[60%] h-[60%] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none lg:hidden" />

        <div className="w-full max-w-[400px] relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Mobile Logo */}
          <Link href="/" className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 font-bold text-xl shadow-glow">
              P
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">
              Proxy<span className="text-cyan-400">Data</span>
            </span>
          </Link>

          <div className="text-center lg:text-left mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Create Account</h1>
            <p className="text-sm text-zinc-400 mt-2">Join ProxyData and get started.</p>
          </div>

          {/* Warning Box */}
          <div className="mb-6 p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-left">
            <div className="text-red-400 shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <p className="text-[11px] sm:text-xs text-red-300 font-medium leading-relaxed">
              <strong className="font-bold text-red-400">Zero Tolerance:</strong> ProxyData actively monitors for abuse. Carding, DDoS, spamming, and illegal activities will result in an immediate permanent ban and forfeiture of all balances.
            </p>
          </div>

          {error && (
            <div className="mb-6 text-red-400 text-sm font-semibold bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSignUp}>
            <TextInput
              label="Full Name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Elon Musk"
              isRequired
            />

            <TextInput
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              isRequired
            />

            <PasswordInput
              label="Password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              isRequired
              minLength={8}
            />

            {/* Checkbox */}
            <div className="flex items-start gap-3 py-1">
              <input 
                type="checkbox" 
                id="tos-agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-white/20 bg-zinc-900/50 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-zinc-950 shrink-0 cursor-pointer"
              />
              <label htmlFor="tos-agree" className="text-[12px] text-zinc-400 leading-tight cursor-pointer">
                I agree to the <Link href="/terms" target="_blank" className="text-cyan-400 hover:underline">Terms of Service</Link> and <Link href="/privacy-policy" target="_blank" className="text-cyan-400 hover:underline">Privacy Policy</Link>
              </label>
            </div>

            <Button
              type="submit"
              isDisabled={isLoading || googlePending}
              isPending={isLoading}
              className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
            >
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : null}
                  {isPending ? "Creating Account..." : "Create Account"}
                </>
              )}
            </Button>
          </form>

          <div className="flex items-center gap-4 py-5">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">or</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <GoogleAuthButton
            mode="signup"
            onPress={handleGoogleSignUp}
            isDisabled={isLoading || googlePending}
            isPending={googlePending}
          />

          <p className="text-center text-sm text-zinc-500 mt-8">
            Already have an account?{" "}
            <Link href="/user/sign-in" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
