import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-border bg-card p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
