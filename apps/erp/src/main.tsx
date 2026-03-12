import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import "@repo/ui/styles.css";
import { Toaster } from "@repo/ui/components/ui/sonner";
import { App } from "@/app";
import { queryClient } from "@/lib/query-client";
import { applyTenantBranding, readCachedTenantBranding } from "@/lib/tenant-branding";
import { ThemeProvider } from "@/components/theme-provider";

const cachedBranding = readCachedTenantBranding();

if (cachedBranding) {
  applyTenantBranding(cachedBranding);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
