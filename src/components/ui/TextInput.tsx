import { FieldError, Input, Label, TextField, type InputProps } from "@heroui/react";
import type { ReactNode } from "react";

/*
  Phase 3 - Step 33: TextInput
  Standardized text input field enforcing our dark theme styling and external label placement.
*/

interface TextInputProps extends InputProps {
  label?: ReactNode;
  errorMessage?: ReactNode;
  name?: string;
}

export function TextInput({ label, errorMessage, ...props }: TextInputProps) {
  return (
    <TextField
      isInvalid={!!errorMessage}
      name={props.name}
      variant="secondary"
      className="w-full"
    >
      {label && <Label className="font-medium text-zinc-400">{label}</Label>}
      <Input
        variant="secondary"
        className="border-zinc-800 bg-zinc-900/50 text-zinc-100 placeholder:text-zinc-500"
        {...props}
      />
      {errorMessage && <FieldError className="text-red-500">{errorMessage}</FieldError>}
    </TextField>
  );
}
