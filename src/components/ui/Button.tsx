"use client";

import {
  Button as HeroUIButton,
  type ButtonProps as HeroUIButtonProps,
} from "@heroui/react";
import type { ReactNode } from "react";

/*
  Phase 3 - Step 31: Button (Primary, Secondary, Danger, Ghost variants).
  Thin ProxyData wrapper mapping our locked vocabulary onto HeroUI v3 variants.

  USE THIS when the button's look comes from the variant itself
  (e.g. contact form submit). Do NOT wrap buttons whose background comes
  from custom bg-* classes — the wrapper defaults to Primary (accent bg)
  and its variant class can win over custom backgrounds in the cascade.
  Those stay as raw HeroUI Buttons (the dominant convention, ~24 call sites).
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
