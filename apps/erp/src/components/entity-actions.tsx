import type { ComponentProps } from "react";
import { Button } from "@repo/ui/components/ui/button";

type SharedButtonProps = ComponentProps<typeof Button>;

export function EntityPagePrimaryAction({
  className,
  ...props
}: SharedButtonProps) {
  return (
    <Button
      className={`h-11 rounded-lg px-5 text-sm font-semibold text-white shadow-sm [&_svg]:text-white ${className ?? ""}`.trim()}
      style={{ color: "#ffffff", ...(props.style ?? {}) }}
      {...props}
    />
  );
}

export function EntityEmptyStateAction({
  className,
  ...props
}: SharedButtonProps) {
  return (
    <Button
      className={`h-10 rounded-lg px-4 text-sm font-semibold text-white shadow-sm [&_svg]:text-white ${className ?? ""}`.trim()}
      style={{ color: "#ffffff", ...(props.style ?? {}) }}
      {...props}
    />
  );
}

export function EntityFormPrimaryAction({
  className,
  ...props
}: SharedButtonProps) {
  return (
    <Button
      className={`h-10 rounded-lg px-4 text-sm font-semibold ${className ?? ""}`.trim()}
      {...props}
    />
  );
}

export function EntityFormSecondaryAction({
  className,
  ...props
}: SharedButtonProps) {
  return (
    <Button
      className={`h-10 rounded-lg px-4 text-sm font-medium ${className ?? ""}`.trim()}
      variant="outline"
      {...props}
    />
  );
}

export function EntityToolbarSecondaryAction({
  className,
  ...props
}: SharedButtonProps) {
  return (
    <Button
      className={`h-8 rounded-lg px-3 text-xs font-medium ${className ?? ""}`.trim()}
      variant="outline"
      {...props}
    />
  );
}

export function EntityRowAction({ className, ...props }: SharedButtonProps) {
  return (
    <Button
      className={`h-8 rounded-md px-3 text-xs font-medium ${className ?? ""}`.trim()}
      size="sm"
      variant="ghost"
      {...props}
    />
  );
}
