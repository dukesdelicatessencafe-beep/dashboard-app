const CACHE_NAME = "dashboard-v4";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.png"
];

/* INSTALL */
self.addEventListener("install", event => {
  self.skipWaiting(); // 🔥 activate immediately

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

/* ACTIVATE */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME){
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim(); // 🔥 take control instantly
});

/* FETCH — NETWORK FIRST (CRITICAL) */
self.addEventListener("fetch", event => {

  // ONLY handle GET requests
  if(event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(response => {

        // Don't cache bad responses
        if(!response || response.status !== 200) return response;

        const copy = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, copy);
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
