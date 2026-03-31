// Service Worker for School ERP
// Caches static assets and provides offline support with queue for attendance/marks

const CACHE_NAME = "school-erp-v1";
const STATIC_ASSETS = ["/dashboard", "/favicon.svg", "/manifest.json"];

const OFFLINE_QUEUE_DB = "erp-offline-queue";
const OFFLINE_QUEUE_STORE = "requests";
const OFFLINE_QUEUE_VERSION = 1;

// ── Install: cache static assets ────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      ),
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for static ───────────────────

const OFFLINE_QUEUE_PATTERNS = [
  /\/api\/.*\/attendance/,
  /\/api\/.*\/exams\/.*\/marks/,
];

function shouldQueueOffline(request) {
  if (request.method !== "POST") return false;
  return OFFLINE_QUEUE_PATTERNS.some((pattern) => pattern.test(request.url));
}

function isApiRequest(request) {
  return request.url.includes("/api/");
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return /\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf|eot)(\?|$)/.test(
    url.pathname,
  );
}

// IndexedDB helpers for offline queue
function openOfflineDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_QUEUE_DB, OFFLINE_QUEUE_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_STORE)) {
        db.createObjectStore(OFFLINE_QUEUE_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function addToOfflineQueue(url, method, headers, body) {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, "readwrite");
    const store = tx.objectStore(OFFLINE_QUEUE_STORE);
    store.add({
      url,
      method,
      headers: Object.fromEntries(headers.entries()),
      body,
      timestamp: Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET/POST for caching
  if (request.method !== "GET" && request.method !== "POST") return;

  // POST requests that should be queued offline
  if (shouldQueueOffline(request)) {
    event.respondWith(
      fetch(request.clone()).catch(async () => {
        const body = await request.clone().text();
        await addToOfflineQueue(
          request.url,
          request.method,
          request.headers,
          body,
        );
        return new Response(
          JSON.stringify({
            queued: true,
            message: "Saved offline. Will sync when reconnected.",
          }),
          {
            status: 202,
            headers: { "Content-Type": "application/json" },
          },
        );
      }),
    );
    return;
  }

  // API requests: network-first, fallback to cache
  if (isApiRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (request.method === "GET" && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Static assets: cache-first, fallback to network
  if (isStaticAsset(request)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(request, clone));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Everything else: network-first
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// ── Sync: replay queued requests when back online ──────────────────────────

self.addEventListener("message", async (event) => {
  if (event.data?.type === "SYNC_OFFLINE_QUEUE") {
    const db = await openOfflineDb();
    const tx = db.transaction(OFFLINE_QUEUE_STORE, "readwrite");
    const store = tx.objectStore(OFFLINE_QUEUE_STORE);

    const allRequests = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    let synced = 0;
    for (const entry of allRequests) {
      try {
        await fetch(entry.url, {
          method: entry.method,
          headers: entry.headers,
          body: entry.body,
        });
        store.delete(entry.id);
        synced++;
      } catch {
        // Will retry on next sync
      }
    }

    // Notify clients of sync result
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      client.postMessage({
        type: "OFFLINE_SYNC_COMPLETE",
        synced,
        remaining: allRequests.length - synced,
      });
    }
  }
});
