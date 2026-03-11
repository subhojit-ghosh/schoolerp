"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { THEMES, THEME_LABELS, THEME_TOGGLE, type ThemeMode } from "@/constants";
import { cn } from "@/lib/utils";

type ModeToggleProps = {
  className?: string;
};

export function ModeToggle({ className }: ModeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn("relative", className)}
            aria-label={THEME_TOGGLE.LABEL}
          />
        )}
      >
        <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        <span className="sr-only">{THEME_TOGGLE.LABEL}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="w-36">
        <DropdownMenuRadioGroup
          value={(theme ?? THEMES.SYSTEM) as ThemeMode}
          onValueChange={(value) => setTheme(value)}
        >
          <DropdownMenuRadioItem value={THEMES.LIGHT}>
            <Sun className="size-4" />
            {THEME_LABELS[THEMES.LIGHT]}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={THEMES.DARK}>
            <Moon className="size-4" />
            {THEME_LABELS[THEMES.DARK]}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={THEMES.SYSTEM}>
            <Monitor className="size-4" />
            {THEME_LABELS[THEMES.SYSTEM]}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
