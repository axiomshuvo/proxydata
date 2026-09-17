"use client";

"use client";

import {
  Button as HeroUIButton,
  type ButtonProps as HeroUIButtonProps,
} from "@heroui/react";
import type { ReactNode } from "react";

/*
  Phase 3 - Step 31: Button (Primary, Secondary, Danger, Ghost variants).
  Thin ProxyData wrapper mapping our locked vocabulary onto HeroUI v3 variants.
*/

export type AppButtonVariant = "Primary" | "Secondary" | "Danger" | "Ghost";

const variantMap: Record<AppButtonVariant, "primary" | "secondary" | "danger" | "ghost"> = {
  Primary: "primary",
  Secondary: "secondary",
  Danger: "danger",
  Ghost: "ghost",
};

interface AppButtonProps extends Omit<HeroUIButtonProps, "variant" | "children"> {
  variant?: AppButtonVariant;
  children: ReactNode;
}

export function Button({ variant = "Primary", ...props }: AppButtonProps) {
  return <HeroUIButton variant={variantMap[variant]} {...props} />;
}
