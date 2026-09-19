"use client";

import { ToastProvider as HeroToastProvider, toast } from "@heroui/react";

/*
  Phase 3 - Step 44: ToastProvider for system notifications.
  Using HeroUI v3's built-in global toast provider and toast method.
*/

export function ToastProvider() {
  return <HeroToastProvider placement="top"  />;
}

export function notify(title: string, description?: string) {
  return toast(title, { description, variant: "default" });
}

export function notifySuccess(title: string, description?: string) {
  return toast(title, { description, variant: "success" });
}

export function notifyWarning(title: string, description?: string) {
  return toast(title, { description, variant: "warning" });
}

export function notifyError(title: string, description?: string) {
  return toast(title, { description, variant: "danger" });
}
