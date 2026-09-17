"use client";

import { Description, Switch } from "@heroui/react";
import type { ReactNode } from "react";

/*
  Phase 3 - Step 37: ToggleSwitch (Sticky IP / protocol toggles).
*/

interface ToggleSwitchProps {
  label?: ReactNode;
  description?: ReactNode;
  isSelected?: boolean;
  defaultSelected?: boolean;
  onChange?: (isSelected: boolean) => void;
  isDisabled?: boolean;
  name?: string;
  size?: "sm" | "md" | "lg";
}

export function ToggleSwitch({
  label,
  description,
  isSelected,
  defaultSelected,
  onChange,
  isDisabled,
  name,
  size = "md",
}: ToggleSwitchProps) {
  return (
    <Switch
      size={size}
      isSelected={isSelected}
      defaultSelected={defaultSelected}
      onChange={onChange}
      isDisabled={isDisabled}
      name={name}
    >
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        {label}
      </Switch.Content>
      {description && <Description>{description}</Description>}
    </Switch>
  );
}
