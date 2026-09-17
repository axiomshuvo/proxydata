"use client";

import { Toast, toast, type ToastVariants } from "@heroui/react";

/*
  Phase 3 - Step 44: ToastProvider for system notifications.
  Mount once near the root layout; fire via notify* helpers
  (HeroUI v3 native toast — no custom provider needed).
*/

type Placement = NonNullable<ToastVariants["placement"]>;

export function ToastProvider({ placement = "bottom" }: { placement?: Placement }) {
  return <Toast.Provider placement={placement} />;
}

export function notify(title: string, description?: string) {
  return toast(title, { description, variant: "default" });
}

export function notifySuccess(title: string, description?: string) {
  return toast.success(title, { description });
}

export function notifyWarning(title: string, description?: string) {
  return toast.warning(title, { description });
}

export function notifyError(title: string, description?: string) {
  return toast.danger(title, { description });
}
