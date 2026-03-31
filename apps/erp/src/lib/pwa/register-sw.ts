const SW_PATH = "/sw.js";

export async function registerServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: "/",
    });

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (
          newWorker.state === "activated" &&
          navigator.serviceWorker.controller
        ) {
          // New service worker activated, could show update prompt
        }
      });
    });
  } catch (error) {
    console.error("Service worker registration failed:", error);
  }
}

export function triggerOfflineSync(): void {
  if (!navigator.serviceWorker?.controller) return;
  navigator.serviceWorker.controller.postMessage({
    type: "SYNC_OFFLINE_QUEUE",
  });
}
