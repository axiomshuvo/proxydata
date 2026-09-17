"use client";

import { Chip } from "@heroui/react";

/*
  Phase 3 - Step 38: StatusBadge
  Strictly locks the vocabulary for all proxy and bKash transaction states.
  Never use "Banned" (use Suspended instead).
*/

export type BadgeStatus =
  | "Active"
  | "Pending"
  | "Rejected"
  | "Suspended"
  | "Expired";

const colorMap: Record<
  BadgeStatus,
  "success" | "warning" | "danger" | "default"
> = {
  Active: "success",
  Pending: "warning",
  Rejected: "danger",
  Suspended: "danger",
  Expired: "default",
};

export function StatusBadge({ status }: { status: BadgeStatus }) {
  return (
    <Chip color={colorMap[status]} variant="soft" size="sm" className="font-medium">
      <Chip.Label>{status}</Chip.Label>
    </Chip>
  );
}
