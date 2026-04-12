 const CACHE = "dashboard-v2";

const ASSETS = [
  "/dashboard-app/",
  "/dashboard-app/index.html",
  "/dashboard-app/manifest.json",
  "/dashboard-app/icon.png",
  "https://cdn.jsdelivr.net/npm/chart.js"
];

// INSTALL
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
});

// FETCH (offline support)
self.addEventListener("fetch", e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
