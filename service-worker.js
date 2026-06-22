const PWA_CACHE = {
  appVersion: "1.0.0",
  cacheName: "ready-toddler-go-v1.0.0",
  assets: [
    "./",
    "./index.html",
    "./manifest.webmanifest",
    "./styles/tokens.css",
    "./styles/base.css",
    "./styles/components.css",
    "./styles/screens.css",
    "./src/app.js",
    "./src/config.js",
    "./src/state.js",
    "./src/storage.js",
    "./src/seedData.js",
    "./src/timerEngine.js",
    "./src/ui.js",
    "./src/i18n.js",
    "./src/assets.js",
    "./src/sounds.js",
    "./src/pwa.js",
    "./assets/icons/icon.svg",
    "./assets/icons/icon-maskable.svg",
    "./assets/illustrations/journeys/puppy-home.svg",
    "./assets/illustrations/journeys/airplane-airport.svg",
    "./assets/illustrations/journeys/car-finish.svg",
    "./assets/illustrations/journeys/rocket-moon.svg",
    "./assets/illustrations/journeys/train-station.svg",
    "./assets/illustrations/journeys/dinosaur-cave.svg",
    "./assets/illustrations/activities/activity-placeholder.svg"
  ]
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PWA_CACHE.cacheName).then((cache) => cache.addAll(PWA_CACHE.assets))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("ready-toddler-go-") && key !== PWA_CACHE.cacheName)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          if (response.ok && new URL(event.request.url).origin === self.location.origin) {
            caches.open(PWA_CACHE.cacheName).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
