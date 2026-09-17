import { Card, CardBody, CardHeader, type CardProps } from "@heroui/react";
import { ReactNode } from "react";

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
      className={`bg-zinc-900/40 backdrop-blur-md border border-zinc-800 shadow-xl ${className || ""}`}
      {...props}
    >
      {title && (
        <CardHeader className="px-6 pt-6 pb-2">
          <div className="text-lg font-semibold text-zinc-100">{title}</div>
        </CardHeader>
      )}
      <CardBody className="px-6 pb-6 pt-2">{children}</CardBody>
    </Card>
  );
}
