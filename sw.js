const CACHE_NAME = "gantt-pro-v13";
const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(URLS_TO_CACHE).catch(() => cache.add("./")),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (
    request.url.includes("chart.js") ||
    request.url.endsWith(".html") ||
    request.url.endsWith(".json")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200) return response;
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
          .catch(() =>
            caches.match(request).then((fallback) => {
              if (fallback) return fallback;
              if (request.destination === "" || request.destination === "document") {
                return caches.match("./index.html");
              }
              return new Response("Офлайн режим. Ресурс недоступний.", {
                status: 503,
                statusText: "Service Unavailable",
                headers: new Headers({ "Content-Type": "text/plain; charset=utf-8" }),
              });
            }),
          );
      }),
    );
  } else {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).catch(() =>
            new Response("Ресурс недоступний у офлайн режимі", {
              status: 503,
              statusText: "Service Unavailable",
            }),
          ),
        ),
    );
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-data") {
    event.waitUntil(Promise.resolve());
  }
});
