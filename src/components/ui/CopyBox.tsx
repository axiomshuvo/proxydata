"use client";

import { Button } from "@heroui/react";
import { useState } from "react";

/*
  Phase 3 - Step 40: CopyBox
  Used for instantly copying Proxy Credentials and API Keys.
*/

interface CopyBoxProps {
  text: string;
  label?: string;
}

export function CopyBox({ text, label }: CopyBoxProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-1">
      {label && <span className="text-sm text-zinc-400">{label}</span>}
      <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2">
        <code className="flex-1 truncate font-mono text-sm text-zinc-300">{text}</code>
        <Button size="sm" variant="secondary" onPress={onCopy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
