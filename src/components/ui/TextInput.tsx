import { Input, type InputProps } from "@heroui/react";

/*
  Phase 3 - Step 33: TextInput
  Standardized text input field enforcing our dark theme styling and external label placement.
*/

export function TextInput(props: InputProps) {
  return (
    <Input
      variant="bordered"
      labelPlacement="outside"
      classNames={{
        inputWrapper:
          "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 focus-within:!border-cyan-500",
        label: "text-zinc-400 font-medium",
        input: "text-zinc-100",
        errorMessage: "text-red-500",
      }}
      {...props}
    />
  );
}
