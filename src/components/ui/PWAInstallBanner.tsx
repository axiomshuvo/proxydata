"use client";

import { useState } from "react";
import { usePWAInstall } from "./usePWAInstall";

/*
  Slim after-navbar banner. Always mounted by <Navbar /> (so landing, plans,
  contact + authed shells all get it). Session-only dismiss — closing hides
  it for this view, refresh shows it again until installed (standalone).
*/

export function PWAInstallBanner() {
  const { deferred, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showManual, setShowManual] = useState(false);

  if (dismissed || isInstalled) return null;

  const onInstall = async () => {
    if (!deferred) {
      setShowManual((v) => !v);
      return;
    }
    const outcome = await install();
    // Prompt-dismissed → hide banner for this view; refresh brings it back.
    if (outcome !== "accepted") setDismissed(true);
  };

  return (
    <div className="border-b border-cyan-400/15 bg-gradient-to-r from-cyan-500/15 via-cyan-500/5 to-transparent">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <img
          src="/icon-192x192.png"
          alt=""
          aria-hidden
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
          className="flex min-h-11 shrink-0 items-center rounded-xl bg-cyan-500 px-4 text-xs font-bold text-black hover:bg-cyan-400 sm:text-sm"
        >
          Install
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss install banner"
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/5 hover:text-white"
        >
          ✕
        </button>
      </div>
      {showManual && !deferred ? (
        <p className="mx-auto max-w-7xl px-4 pb-2.5 text-[11px] leading-5 text-zinc-400 sm:px-6">
          {isIOS
            ? "Tap Share, then “Add to Home Screen” to pin ProxyData."
            : "Tap your browser menu ⋮ → “Install app” / “Add to Home Screen” to pin ProxyData."}
        </p>
      ) : null}
    </div>
  );
}
