import type { ImgHTMLAttributes } from "react";
import { cn } from "@repo/ui/lib/utils";

type LazyImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "loading" | "decoding"
>;

export function LazyImage({ className, ...props }: LazyImageProps) {
  return (
    <img
      loading="lazy"
      decoding="async"
      className={cn(className)}
      {...props}
    />
  );
}
