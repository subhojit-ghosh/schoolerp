import { useCallback, useEffect, useState } from "react";
import { IconWifiOff } from "@tabler/icons-react";
import { triggerOfflineSync } from "@/lib/pwa/register-sw";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const handleOnline = useCallback(() => {
    setIsOffline(false);
    // Trigger sync of any queued requests
    triggerOfflineSync();
  }, []);

  const handleOffline = useCallback(() => {
    setIsOffline(true);
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-amber-950">
      <IconWifiOff className="h-4 w-4" />
      <span className="text-xs font-medium">
        You are offline. Changes will be synced when reconnected.
      </span>
    </div>
  );
}
