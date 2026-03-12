import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type FieldProps = PropsWithChildren<{
  className?: string;
}>;

export function Field({ children, className }: FieldProps) {
  return <div className={cn("grid gap-2", className)}>{children}</div>;
}

export function FieldLabel({ children }: PropsWithChildren) {
  return <label className="text-sm font-medium">{children}</label>;
}

export function FieldError({ children }: PropsWithChildren) {
  if (!children) {
    return null;
  }

  return <p className="text-sm text-red-600">{children}</p>;
}
