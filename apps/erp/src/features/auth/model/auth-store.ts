import { create } from "zustand";
import type { AuthSession } from "./auth.types";

type AuthStatus = "unknown" | "authenticated" | "anonymous";

type AuthStore = {
  session: AuthSession | null;
  status: AuthStatus;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  status: "unknown",
  setSession: (session) => set({ session, status: "authenticated" }),
  clearSession: () => set({ session: null, status: "anonymous" }),
}));
