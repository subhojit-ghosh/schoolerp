"use client";

import { createContext, useContext } from "react";
import type { OrgContext } from "@/server/auth/require-org-access";

const OrgCtx = createContext<OrgContext | null>(null);

export function OrgContextProvider({
  value,
  children,
}: {
  value: OrgContext;
  children: React.ReactNode;
}) {
  return <OrgCtx.Provider value={value}>{children}</OrgCtx.Provider>;
}

export function useOrgContext(): OrgContext {
  const ctx = useContext(OrgCtx);
  if (!ctx) throw new Error("useOrgContext must be used inside OrgContextProvider");
  return ctx;
}
