import { useSessionExpiryWarning } from "@/hooks/use-session-expiry-warning";

/**
 * Renders nothing visible. Mounts the session-expiry warning hook so that
 * idle users see a toast before their session times out.
 */
export function SessionExpiryWarning(): null {
  useSessionExpiryWarning();
  return null;
}
