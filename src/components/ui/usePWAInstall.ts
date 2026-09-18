"use client";

import { useCallback, useEffect, useState } from "react";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Module-level store so Banner + BottomSheet share one deferred prompt.
// `beforeinstallprompt` fires once per page load — without this, the second
// listener would never see it.
let globalDeferred: BeforeInstallPromptEvent | null = null;
const subscribers = new Set<(d: BeforeInstallPromptEvent | null) => void>();
let bound = false;

function notify() {
  subscribers.forEach((fn) => fn(globalDeferred));
}

function ensureBound() {
  if (bound || typeof window === "undefined") return;
  bound = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    globalDeferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    globalDeferred = null;
    notify();
  });
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS Safari legacy flag
  return (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

function isIOSDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

export function usePWAInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(globalDeferred);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    ensureBound();
    setDeferred(globalDeferred);
    setIsIOS(isIOSDevice());
    setIsInstalled(isStandalone());

    const sub = (d: BeforeInstallPromptEvent | null) => setDeferred(d);
    subscribers.add(sub);

    const onInstalled = () => {
      setIsInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      subscribers.delete(sub);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!globalDeferred) return "unavailable";
    const evt = globalDeferred;
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    globalDeferred = null;
    notify();
    setDeferred(null);
    if (outcome === "accepted") setIsInstalled(true);
    return outcome;
  }, []);

  return { deferred, isInstalled, isIOS, install };
}
