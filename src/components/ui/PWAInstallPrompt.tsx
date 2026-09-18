"use client";

import { useEffect, useState } from "react";

/*
  Install prompt (workplan step 188): Android/Chrome fires
  `beforeinstallprompt` (we show a bottom sheet); iOS never prompts, so we
  show Share → "Add to Home Screen" instructions instead. Dismissal persists
  30 days. Hidden once running installed (standalone) already.
*/

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";

export function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Already installed → never show.
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    try {
      const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (until && Date.now() > until) localStorage.removeItem(DISMISS_KEY);
      else if (until) return; // dismissed (still fresh)
    } catch {
      // Private mode — carry on without persistence.
    }

    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    // iOS has no event — show the instructions after a beat, once per visitor.
    let t: ReturnType<typeof setTimeout> | undefined;
    if (ios) {
      t = setTimeout(() => setVisible(true), 4000);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      if (t) clearTimeout(t);
    };
  }, []);

  if (!visible) return null;

  const dismiss = (days = 30) => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 86400000));
    } catch {
      // Private mode — just hide for this visit.
    }
    setVisible(false);
  };

  // Expired dismissal handled in the main effect above.

  const install = async () => {
    if (!deferred) {
      dismiss();
      return;
    }
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") {
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch {
        // ignore
      }
      setVisible(false);
    } else {
      dismiss();
    }
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
            onClick={() => dismiss()}
            aria-label="Dismiss install prompt"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>
        </div>
        {!isIOS && (
          <button
            type="button"
            onClick={install}
            disabled={!deferred}
            className="mt-4 w-full min-h-12 rounded-xl bg-cyan-500 text-sm font-bold text-black hover:bg-cyan-400 disabled:opacity-40"
          >
            Install app
          </button>
        )}
      </div>
    </div>
  );
}
