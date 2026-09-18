"use client";

import { Toast, ToastQueue } from "@heroui/react";

/*
  Phase 3 - Step 44: ToastProvider for system notifications.
  Mount once near the root layout; fire via notify* helpers.
  Uses ONE explicit shared queue (not the implicit global) so every
  helper call provably lands in the mounted provider's region.
*/

const toastQueue = new ToastQueue({ maxVisibleToasts: 3 });

export function ToastProvider() {
  return <Toast.Provider placement="bottom" queue={toastQueue} />;
}

export function notify(title: string, description?: string) {
  return toastQueue.add({ title, description, variant: "default" });
}

export function notifySuccess(title: string, description?: string) {
  return toastQueue.add({ title, description, variant: "success" });
}

export function notifyWarning(title: string, description?: string) {
  return toastQueue.add({ title, description, variant: "warning" });
}

export function notifyError(title: string, description?: string) {
  return toastQueue.add({ title, description, variant: "danger" });
}
