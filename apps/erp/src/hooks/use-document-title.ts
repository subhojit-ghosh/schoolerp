import { useEffect } from "react";
import { useLocation } from "react-router";

import { ERP_ROUTES } from "@/constants/routes";
import { readCachedTenantBranding } from "@/lib/tenant-branding";

import { useRecentPages } from "./use-recent-pages";

const AUTH_PATHS = new Set<string>([
  ERP_ROUTES.SIGN_IN,
  ERP_ROUTES.FORGOT_PASSWORD,
  ERP_ROUTES.RESET_PASSWORD,
]);

/**
 * Set the browser tab title to "Page · School Name ERP".
 *
 * Restores the base title on unmount so navigating away
 * does not leave a stale page name in the tab.
 *
 * Also records the page in the recent-pages store
 * (skipping auth pages).
 */
export function useDocumentTitle(pageTitle: string) {
  const { pathname } = useLocation();
  const { addRecentPage } = useRecentPages();

  useEffect(() => {
    const branding = readCachedTenantBranding();
    const schoolName = branding?.shortName;
    const suffix = schoolName ? `${schoolName} ERP` : "ERP";
    document.title = `${pageTitle} · ${suffix}`;

    if (!AUTH_PATHS.has(pathname)) {
      addRecentPage(pathname, pageTitle);
    }

    return () => {
      document.title = suffix;
    };
  }, [pageTitle, pathname, addRecentPage]);
}
