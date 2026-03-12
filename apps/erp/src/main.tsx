import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app";
import { applyTenantBranding, readCachedTenantBranding } from "@/lib/tenant-branding";
import "@/styles.css";

const cachedBranding = readCachedTenantBranding();

if (cachedBranding) {
  applyTenantBranding(cachedBranding);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
