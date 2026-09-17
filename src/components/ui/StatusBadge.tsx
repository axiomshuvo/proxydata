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

export function StatusBadge({ status }: { status: BadgeStatus }) {
  const colorMap: Record<
    BadgeStatus,
    "success" | "warning" | "danger" | "danger" | "default"
  > = {
    Active: "success",
    Pending: "warning",
    Rejected: "danger",
    Suspended: "danger",
    Expired: "default",
  };

  return (
    <Chip
      color={colorMap[status]}
      variant="flat"
      size="sm"
      className="font-medium"
    >
      {status}
    </Chip>
  );
}
