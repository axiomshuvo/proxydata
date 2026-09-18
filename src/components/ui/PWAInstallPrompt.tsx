"use client";

import { useEffect, useState } from "react";
import { usePWAInstall } from "./usePWAInstall";

/*
  Bottom-sheet install prompt.
  Persistence model (per request): dismiss (X) hides it for THIS view only.
  No localStorage — a refresh / revisit shows it again until the app is
  installed (standalone). Shares one `beforeinstallprompt` via usePWAInstall
  so the after-navbar banner and this sheet never race each other.
*/

export function PWAInstallPrompt() {
  const { deferred, isInstalled, isIOS, install } = usePWAInstall();
  const [visible, setVisible] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // Show on `beforeinstallprompt`, otherwise teaser after a beat (iOS has no
  // event; desktop may delay the event). Never show when installed.
  useEffect(() => {
    if (isInstalled) {
      setVisible(false);
      return;
    }
    if (deferred) {
      setVisible(true);
      return;
    }
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, [deferred, isInstalled]);

  if (!visible || isInstalled) return null;

  // Session-only dismiss: refresh mounts fresh state → shows again.
  const dismiss = () => setVisible(false);

  const onInstall = async () => {
    if (!deferred) {
      // No native prompt available — show manual steps instead of a dead btn.
      setShowManual((v) => !v);
      return;
    }
    const outcome = await install();
    // Accepted → hook flips isInstalled and unmounts us.
    // Prompt-dismissed → hide for this view; refresh shows again.
    if (outcome !== "accepted") dismiss();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-zinc-950/95 p-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img src="/icon-192x192.png" alt="ProxyData" className="h-12 w-12 rounded-2xl" />
          <div className="flex-1">
            <p className="font-bold text-white text-sm">Install ProxyData</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isIOS && !deferred
                ? "Tap Share, then “Add to Home Screen” for the full app feel."
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
        {!isIOS || deferred ? (
          <button
            type="button"
            onClick={onInstall}
            className="mt-4 w-full min-h-12 rounded-xl bg-cyan-500 text-sm font-bold text-black hover:bg-cyan-400"
          >
            Install app
          </button>
        ) : null}
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
