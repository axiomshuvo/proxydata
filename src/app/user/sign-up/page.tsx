"use client";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button, Spinner } from "@heroui/react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignUp = async () => {
    setGooglePending(true);
    try {
      // Preserve referral across the OAuth round-trip for post-login binding.
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) sessionStorage.setItem("pending_ref", ref);
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/user/dashboard",
      });
    } finally {
      setGooglePending(false);
    }
  };

  const bindReferral = async () => {
    try {
      const ref =
        new URLSearchParams(window.location.search).get("ref") || sessionStorage.getItem("pending_ref");
      if (!ref) return;
      await fetch("/api/affiliate/attribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: ref }),
      });
      sessionStorage.removeItem("pending_ref");
    } catch {
      // Attribution is best-effort — never block signup on it.
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        setError(error.message || "Failed to create account.");
        notifyError("Sign-up failed", error.message || "Failed to create account.");
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-zinc-950">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
        
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 font-bold text-xl shadow-[0_0_15px_rgba(6,182,212,0.15)]">P</div>
          <span className="font-bold text-2xl tracking-tight text-white">Proxy<span className="text-cyan-400">Data</span></span>
        </Link>

        <GlassCard className="!bg-zinc-900/80 !border-white/10 p-8 sm:p-10 rounded-[2rem] shadow-2xl relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="text-center mb-8 relative z-10">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Create Account</h1>
            <p className="text-sm text-zinc-400 mt-2">Join ProxyData and get started</p>
          </div>

          <form className="space-y-4 relative z-10" onSubmit={handleSignUp}>

            <Button onPress={handleGoogleSignUp} isDisabled={isLoading || googlePending} isPending={googlePending} className="w-full bg-white hover:bg-zinc-100 text-zinc-900 font-bold py-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-md">
              {({ isPending }) => (
                <>
                  {isPending ? (
                    <Spinner color="current" size="sm" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                  )}
                  {isPending ? "Connecting…" : "Sign up with Google"}
                </>
              )}
            </Button>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">or create with email</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>

            {error && <div className="text-red-400 text-sm font-semibold bg-red-500/10 border border-red-500/20 p-3 rounded-lg">{error}</div>}

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 ml-1">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner" 
                placeholder="Axiom Shuvo"
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 ml-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner" 
                placeholder="you@example.com"
                required 
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 ml-1">Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner" 
                placeholder="Min. 8 characters" 
                required
                minLength={8}
              />
            </div>

            <Button type="submit" isDisabled={isLoading || googlePending} isPending={isLoading} className="w-full py-6 mt-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all">
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : null}
                  {isPending ? "Creating Account..." : "Create Account"}
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-zinc-500 mt-6 relative z-10">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-cyan-400 hover:underline">Terms</Link> and{" "}
            <Link href="/privacy-policy" className="text-cyan-400 hover:underline">Privacy Policy</Link>.
          </p>

          <p className="text-center text-xs text-zinc-500 mt-6 relative z-10 border-t border-white/5 pt-6">
            Already have an account?{" "}
            <Link href="/user/sign-in" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">
              Sign in
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
