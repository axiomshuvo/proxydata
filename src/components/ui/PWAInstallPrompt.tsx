"use client";

import { useEffect, useRef, useState } from "react";
import { usePWAInstall } from "./usePWAInstall";
import { authClient } from "@/lib/auth-client";
import {
  PWA_SHEET_KEY,
  isPwaSuppressed,
  pwaGapMs,
  suppressPwa,
} from "@/lib/pwa-prompt";

/*
  Bottom-sheet install prompt. Dismiss (X / Got it / prompt-dismissed)
  suppresses it for 20 min when logged in, 5 min on public pages — then it
  returns until the app is installed (standalone). Shares one
  `beforeinstallprompt` via usePWAInstall so the banner and sheet never race.
*/

export function PWAInstallPrompt() {
  const { deferred, isInstalled, isIOS, install } = usePWAInstall();
  const { data: session } = authClient.useSession();
  const authed = !!session?.user;
  const [visible, setVisible] = useState(false);
  const [showManual, setShowManual] = useState(false);
  // Hooks must run before any early return (Rules of Hooks) — touchY lives
  // here even though it is only used by the rendered sheet below.
  const touchY = useRef<number | null>(null);

  // Show on `beforeinstallprompt`, otherwise teaser after a beat (iOS has no
  // event; desktop may delay the event). Skipped while a dismiss gap is
  // active (20 min authed / 5 min public), and never when installed.
  useEffect(() => {
    if (isInstalled) {
      setVisible(false);
      return;
    }
    if (isPwaSuppressed(PWA_SHEET_KEY)) {
      setVisible(false);
      return;
    }
    if (deferred) {
      setVisible(true);
      return;
    }
    const t = setTimeout(() => {
      if (!isPwaSuppressed(PWA_SHEET_KEY)) setVisible(true);
    }, 2500);
    return () => clearTimeout(t);
  }, [deferred, isInstalled]);

  if (!visible || isInstalled) return null;

  // Timed dismiss: prompt returns after the gap (20 min authed / 5 min public).
  const dismiss = () => {
    suppressPwa(PWA_SHEET_KEY, pwaGapMs(authed));
    setVisible(false);
  };

  // Swipe-down to dismiss (bottom sheet must never trap the mobile bottom nav).
  const onTouchStart = (e: React.TouchEvent) => {
    touchY.current = e.touches[0]?.clientY ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchY.current;
    touchY.current = null;
    const end = e.changedTouches[0]?.clientY;
    if (start !== null && end !== undefined && end - start > 64) dismiss();
  };

  const onInstall = async () => {
    if (!deferred) {
      // No native prompt available — show manual steps instead of a dead btn.
      setShowManual((v) => !v);
      return;
    }
    const outcome = await install();
    // Accepted → hook flips isInstalled and unmounts us.
    // Prompt-dismissed → timed suppress (20 min authed / 5 min public).
    if (outcome !== "accepted") dismiss();
  };

  // iOS Safari never fires `beforeinstallprompt` — Apple requires a manual
  // Share → Add to Home Screen. So there is no programmatic install to trigger.
  const isIOSManual = isIOS && !deferred;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="mx-auto max-w-md rounded-3xl border border-white/10 bg-zinc-950/95 p-5 shadow-2xl backdrop-blur-md"
      >
        {/* Swipe handle — signals the sheet can be pulled down to dismiss. */}
        <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15" />
        <div className="flex items-center gap-3">
          <img src="/icon-192x192.png" alt="ProxyData" className="h-12 w-12 rounded-2xl" />
          <div className="flex-1">
            <p className="font-bold text-white text-sm">Install ProxyData</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isIOSManual
                ? "iPhone needs a manual add — 3 taps, 10 seconds."
                : "App-like access, offline shell, one tap from home."}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>
        </div>
        {isIOSManual ? (
          <>
            <ol className="mt-4 space-y-1.5 text-xs leading-5 text-zinc-300">
              <li><span className="font-bold text-white">1.</span> Tap <span className="font-bold text-white">Share ↑</span> in the Safari toolbar below.</li>
              <li><span className="font-bold text-white">2.</span> Tap <span className="font-bold text-white">“Add to Home Screen”</span>.</li>
              <li><span className="font-bold text-white">3.</span> Tap <span className="font-bold text-white">Add</span> (top-right).</li>
            </ol>
            <button
              type="button"
              onClick={dismiss}
              className="mt-4 w-full min-h-12 rounded-xl bg-cyan-500 text-sm font-bold text-black hover:bg-cyan-400"
            >
              Got it
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onInstall}
            className="mt-4 w-full min-h-12 rounded-xl bg-cyan-500 text-sm font-bold text-black hover:bg-cyan-400"
          >
            Install app
          </button>
        )}
        {showManual && !deferred && !isIOS ? (
          <p className="mt-3 text-xs leading-5 text-zinc-400">
            Tap your browser menu <span className="text-white font-bold">⋮ → “Install app” / “Add to Home Screen”</span> to
            pin ProxyData.
          </p>
        ) : null}
      </div>
    </div>
  );
}
