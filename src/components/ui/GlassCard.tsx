"use client";

import { Card, type CardProps } from "@heroui/react";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface GlassCardProps extends CardProps {
  title?: ReactNode;
  children: ReactNode;
}

export function GlassCard({
  title,
  children,
  className,
  ...props
}: GlassCardProps) {
  return (
    <Card
      className={twMerge(
        "bg-zinc-900/60 backdrop-blur-[12px] border border-white/10 shadow-xl rounded-3xl",
        className,
      )}
      {...props}
    >
      {title && (
        <Card.Header className="px-6 pt-6 pb-2">
          <div className="text-lg font-semibold text-zinc-100">{title}</div>
        </Card.Header>
      )}
      <Card.Content className="px-6 pb-6 pt-2">{children}</Card.Content>
    </Card>
  );
}
