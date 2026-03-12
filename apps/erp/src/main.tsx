import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { App } from "@/app";
import { queryClient } from "@/lib/query-client";
import { applyTenantBranding, readCachedTenantBranding } from "@/lib/tenant-branding";
import "@/styles.css";

const cachedBranding = readCachedTenantBranding();

if (cachedBranding) {
  applyTenantBranding(cachedBranding);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
