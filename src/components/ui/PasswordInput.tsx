"use client";

import { Eye, EyeSlash } from "@gravity-ui/icons";
import {
  FieldError,
  InputGroup,
  Label,
  TextField,
  type InputProps,
} from "@heroui/react";
import { useState, type ReactNode } from "react";

/*
  Phase 3 - Step 34: PasswordInput
  Standardized password input with a built-in eye toggle using Gravity UI icons.
*/

interface PasswordInputProps extends InputProps {
  label?: ReactNode;
  errorMessage?: ReactNode;
  name?: string;
  isRequired?: boolean;
}

export function PasswordInput({ label, errorMessage, isRequired, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <TextField
      isInvalid={!!errorMessage}
      isRequired={isRequired}
      name={props.name}
      variant="secondary"
      className="w-full"
    >
      {label && <Label className="font-medium text-zinc-400">{label}</Label>}
      <InputGroup className="border-zinc-800 bg-zinc-900/50">
        <InputGroup.Input
          type={isVisible ? "text" : "password"}
          required={isRequired}
          className="text-zinc-100 placeholder:text-zinc-500"
          {...props}
        />
        <InputGroup.Suffix>
          <button
            className="text-zinc-500 transition-colors hover:text-cyan-400 focus:outline-none"
            type="button"
            onClick={toggleVisibility}
            aria-label="toggle password visibility"
          >
            {isVisible ? <EyeSlash width={20} /> : <Eye width={20} />}
          </button>
        </InputGroup.Suffix>
      </InputGroup>
      {errorMessage && <FieldError className="text-red-500">{errorMessage}</FieldError>}
    </TextField>
  );
}
