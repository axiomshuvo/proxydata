"use client";

import { useEffect, useState } from "react";
import { usePWAInstall } from "./usePWAInstall";
import { authClient } from "@/lib/auth-client";
import {
  PWA_BANNER_KEY,
  isPwaSuppressed,
  pwaGapMs,
  suppressPwa,
} from "@/lib/pwa-prompt";

/*
  Slim after-navbar banner. Always mounted by <Navbar /> (so landing, plans,
  contact + authed shells all get it). Dismiss suppresses it for 20 min when
  logged in, 5 min on public pages — then it returns until installed.
*/

export function PWAInstallBanner() {
  const { deferred, isInstalled, isIOS, install } = usePWAInstall();
  const { data: session } = authClient.useSession();
  const authed = !!session?.user;
  const [dismissed, setDismissed] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // Honor the timed suppression from a previous dismiss.
  useEffect(() => {
    if (isPwaSuppressed(PWA_BANNER_KEY)) setDismissed(true);
  }, []);

  if (dismissed || isInstalled) return null;

  // iOS Safari has no programmatic install — the button can only reveal steps.
  const isIOSManual = isIOS && !deferred;

  const dismiss = () => {
    suppressPwa(PWA_BANNER_KEY, pwaGapMs(authed));
    setDismissed(true);
  };

  const onInstall = async () => {
    if (!deferred) {
      setShowManual((v) => !v);
      return;
    }
    const outcome = await install();
    // Prompt-dismissed → suppress (20 min authed / 5 min public), then return.
    if (outcome !== "accepted") dismiss();
  };

  return (
    <div className="border-b border-cyan-400/15 bg-gradient-to-r from-cyan-500/15 via-cyan-500/5 to-transparent">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <img
          src="/icon-192x192.png"
          alt=""
          aria-hidden
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 rounded-lg"
        />
        <p className="min-w-0 flex-1 truncate text-xs text-zinc-300 sm:text-sm">
          <span className="font-bold text-white">Install ProxyData</span>
          <span className="hidden sm:inline text-zinc-400">
            {" — "}
            {isIOS && !deferred
              ? "Share → “Add to Home Screen” for the full app feel."
              : "one tap from home, offline shell."}
          </span>
        </p>
        <button
          type="button"
          onClick={onInstall}
          aria-expanded={showManual}
          className="flex min-h-11 shrink-0 items-center rounded-xl bg-cyan-500 px-4 text-xs font-bold text-black hover:bg-cyan-400 sm:text-sm"
        >
          {isIOSManual ? (showManual ? "Hide steps" : "Steps") : "Install"}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install banner"
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/5 hover:text-white"
        >
          ✕
        </button>
      </div>
      {showManual && !deferred ? (
        <p className="mx-auto max-w-7xl px-4 pb-2.5 text-[11px] leading-5 text-zinc-400 sm:px-6">
          {isIOSManual ? (
            <>Tap <span className="font-bold text-white">Share ↑</span> → <span className="font-bold text-white">“Add to Home Screen”</span> → <span className="font-bold text-white">Add</span>. iPhones can’t auto-install — Apple requires these 3 taps.</>
          ) : (
            "Tap your browser menu ⋮ → “Install app” / “Add to Home Screen” to pin ProxyData."
          )}
        </p>
      ) : null}
    </div>
  );
}
