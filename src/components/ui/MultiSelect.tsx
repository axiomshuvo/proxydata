"use client";

import { Select, SelectItem, type SelectProps } from "@heroui/react";

/*
  Phase 3 - Step 36: MultiSelect
  Crucial for the DataImpulse State/City/ASN targeting selection.
*/

interface MultiSelectProps extends Omit<SelectProps, "children"> {
  options: { label: string; value: string }[];
}

export function MultiSelect({ options, ...props }: MultiSelectProps) {
  return (
    <Select
      selectionMode="multiple"
      variant="bordered"
      labelPlacement="outside"
      classNames={{
        trigger:
          "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 data-[focus=true]:!border-cyan-500",
        label: "text-zinc-400 font-medium",
        value: "text-zinc-100",
        popoverContent: "bg-zinc-900 border border-zinc-800",
      }}
      {...props}
    >
      {options.map((option) => (
        <SelectItem
          key={option.value}
          value={option.value}
          textValue={option.label}
          className="text-zinc-200 data-[hover=true]:bg-zinc-800 data-[hover=true]:text-cyan-400"
        >
          {option.label}
        </SelectItem>
      ))}
    </Select>
  );
}
