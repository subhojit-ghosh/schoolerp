import { useEffect } from "react";
import { ThemeProviderContext } from "@/components/theme/theme-context";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
  }, []);

  return (
    <ThemeProviderContext.Provider
      value={{
        theme: "light",
        setTheme: () => null,
      }}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}
