/*
  Timed suppression for the PWA install surfaces (banner + bottom sheet).
  Gap after dismiss: 20 min when logged in, 5 min on public pages.
  Expired entries are cleared on read, so the prompt returns on next visit.
*/

export const PWA_BANNER_KEY = "pwa-banner-dismissed-until";
export const PWA_SHEET_KEY = "pwa-sheet-dismissed-until";

export const PWA_GAP_AUTHED_MS = 20 * 60 * 1000;
export const PWA_GAP_PUBLIC_MS = 5 * 60 * 1000;

export function pwaGapMs(authed: boolean): number {
  return authed ? PWA_GAP_AUTHED_MS : PWA_GAP_PUBLIC_MS;
}

export function isPwaSuppressed(key: string): boolean {
  try {
    const until = Number(localStorage.getItem(key) || 0);
    if (!until) return false;
    if (Date.now() >= until) {
      localStorage.removeItem(key);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function suppressPwa(key: string, gapMs: number): void {
  try {
    localStorage.setItem(key, String(Date.now() + gapMs));
  } catch {
    // Private mode — suppression won't persist, prompt returns next view.
  }
}
