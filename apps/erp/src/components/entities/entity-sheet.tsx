import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { cn } from "@repo/ui/lib/utils";

type EntitySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExitComplete?: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  contentClassName?: string;
};

export function EntitySheet({
  open,
  onOpenChange,
  onExitComplete,
  title,
  description,
  children,
  contentClassName,
}: EntitySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          "flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg",
          contentClassName,
        )}
        onExitComplete={onExitComplete}
      >
        <SheetHeader className="border-b px-6 pb-4 pt-6">
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>
        <div className="flex-1 px-6 py-5">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
