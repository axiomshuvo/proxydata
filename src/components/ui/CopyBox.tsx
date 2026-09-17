"use client";

import { Check, Copy } from "@gravity-ui/icons";
import { useState } from "react";

export interface CopyBoxProps {
  text: string;
  isPassword?: boolean;
}

export function CopyBox({ text, isPassword = false }: CopyBoxProps) {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 p-1 transition-colors hover:border-white/10 hover:bg-white/10">
      <div className="flex-1 overflow-x-auto px-3 py-1.5 scrollbar-none">
        <code className="whitespace-nowrap text-xs font-medium text-white font-mono">
          {isPassword && !showPassword ? "••••••••••••••••" : text}
        </code>
      </div>
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="flex h-8 items-center justify-center rounded-lg px-2 text-xs font-bold text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none"
        >
          {showPassword ? "HIDE" : "SHOW"}
        </button>
      )}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy to clipboard"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
      >
        {copied ? <Check width={16} className="text-emerald-400" /> : <Copy width={16} />}
      </button>
    </div>
  );
}
