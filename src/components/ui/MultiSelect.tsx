"use client";

import { Label, ListBox, Select } from "@heroui/react";
import type { ReactNode } from "react";

/*
  Phase 3 - Step 36: MultiSelect
  Crucial for the DataImpulse State/City/ASN targeting selection.
  Uncontrolled (mirrors the HeroUI v3 multiple-Select pattern):
  seed via defaultSelectedKeys, observe via onSelectionChange.
*/

interface MultiSelectProps {
  label?: ReactNode;
  placeholder?: string;
  options: { label: string; value: string }[];
  defaultSelectedKeys?: Iterable<string>;
  onSelectionChange?: (keys: Set<string | number> | "all") => void;
  isDisabled?: boolean;
  className?: string;
}

export function MultiSelect({
  label,
  placeholder,
  options,
  defaultSelectedKeys,
  onSelectionChange,
  isDisabled,
  className,
}: MultiSelectProps) {
  return (
    <Select
      selectionMode="multiple"
      variant="secondary"
      placeholder={placeholder}
      isDisabled={isDisabled}
      className={className}
    >
      {label && <Label className="font-medium text-zinc-400">{label}</Label>}
      <Select.Trigger>
        <Select.Value className="text-zinc-100" />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox
          selectionMode="multiple"
          defaultSelectedKeys={defaultSelectedKeys}
          onSelectionChange={onSelectionChange}
        >
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
