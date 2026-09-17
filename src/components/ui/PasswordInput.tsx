"use client";

import { Eye, EyeSlash } from "@gravity-ui/icons";
import { Input, type InputProps } from "@heroui/react";
import { useState } from "react";

/*
  Phase 3 - Step 34: PasswordInput
  Standardized password input with a built-in eye toggle using Gravity UI icons.
*/

export function PasswordInput(props: InputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <Input
      variant="bordered"
      labelPlacement="outside"
      type={isVisible ? "text" : "password"}
      endContent={
        <button
          className="focus:outline-none text-zinc-500 hover:text-cyan-400 transition-colors"
          type="button"
          onClick={toggleVisibility}
          aria-label="toggle password visibility"
        >
          {isVisible ? <EyeSlash width={20} /> : <Eye width={20} />}
        </button>
      }
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
