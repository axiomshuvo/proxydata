"use client";

import { ProgressCircle } from "@heroui/react";

/*
  Phase 3 - Step 39: ProgressRing (bandwidth visualization).
  value/maxValue default to a 0–100 percentage scale.
*/

interface ProgressRingProps {
  value: number;
  maxValue?: number;
  size?: "sm" | "md" | "lg";
  color?: "default" | "accent" | "success" | "warning" | "danger";
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function ProgressRing({
  value,
  maxValue = 100,
  size = "md",
  color = "accent",
  label = "Progress",
  showValue = true,
  className,
}: ProgressRingProps) {
  const pct = Math.max(0, Math.min(100, (value / maxValue) * 100));

  return (
    <div className="relative inline-flex items-center justify-center">
      <ProgressCircle
        aria-label={label}
        value={value}
        maxValue={maxValue}
        size={size}
        color={color}
        className={className}
      >
        <ProgressCircle.Track>
          <ProgressCircle.TrackCircle />
          <ProgressCircle.FillCircle />
        </ProgressCircle.Track>
      </ProgressCircle>
      {showValue && (
        <span className="pointer-events-none absolute text-sm font-bold text-white">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
