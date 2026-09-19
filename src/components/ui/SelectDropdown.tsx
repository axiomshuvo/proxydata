"use client";

import { Label, ListBox, Select } from "@heroui/react";
import type { ReactNode } from "react";

/*
  Phase 3 - Step 35: SelectDropdown (single select).
  HeroUI v3 compound pattern — no SelectItem (v2 API).
*/

interface SelectDropdownProps {
  label?: ReactNode;
  placeholder?: string;
  options: { label: string; value: string }[];
  defaultSelectedKey?: string;
  selectedKey?: string | number | null;
  onSelectionChange?: (key: string | number | null) => void;
  isDisabled?: boolean;
  className?: string;
}

export function SelectDropdown({
  label,
  placeholder,
  options,
  defaultSelectedKey,
  selectedKey,
  onSelectionChange,
  isDisabled,
  className,
}: SelectDropdownProps) {
  return (
    <Select
      variant="secondary"
      placeholder={placeholder}
      defaultSelectedKey={defaultSelectedKey}
      selectedKey={selectedKey}
      onSelectionChange={onSelectionChange}
      isDisabled={isDisabled}
      className={className}
    >
      {label && <Label className="font-medium text-zinc-400">{label}</Label>}
      <Select.Trigger>
        <Select.Value className="text-zinc-100" />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item
              key={option.value}
              id={option.value}
              textValue={option.label}
            >
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
