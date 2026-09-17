"use client";

import { Snippet } from "@heroui/react";

/*
  Phase 3 - Step 40: CopyBox
  Used for instantly copying Proxy Credentials and API Keys.
*/

interface CopyBoxProps {
  text: string;
  label?: string;
}

export function CopyBox({ text, label }: CopyBoxProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <span className="text-sm text-zinc-400">{label}</span>}
      <Snippet
        symbol=""
        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300"
        color="default"
        variant="flat"
      >
        {text}
      </Snippet>
    </div>
  );
}
