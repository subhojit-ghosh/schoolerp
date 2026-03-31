import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react";
import "@repo/ui/styles.css";
import { Toaster } from "@repo/ui/components/ui/sonner";
import { App } from "@/app";
import { queryClient } from "@/lib/query-client";
import {
  applyTenantBranding,
  readCachedTenantBranding,
} from "@/lib/tenant-branding";
import { registerServiceWorker } from "@/lib/pwa/register-sw";

const cachedBranding = readCachedTenantBranding();

if (cachedBranding) {
  applyTenantBranding(cachedBranding);
}

registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <App />
        <Toaster richColors position="bottom-center" />
      </NuqsAdapter>
    </QueryClientProvider>
  </StrictMode>,
);
