const CACHE_NAME = "manga-images-v2";
const OFFLINE_CHAPTER_CACHE = "manga-offline-chapters-v1";

const IMAGE_PATH_PATTERN = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all([
        ...names
          .filter(
            (name) =>
              name.startsWith("manga-images-") &&
              name !== CACHE_NAME
          )
          .map((name) => caches.delete(name)),

        // Pastikan cache chapter offline tersedia.
        // Cache ini tidak dihapus ketika SW diperbarui.
        caches.open(OFFLINE_CHAPTER_CACHE),
      ])
    )
  );

  self.clients.claim();
});

function isImageRequest(request) {
  return (
    request.destination === "image" ||
    IMAGE_PATH_PATTERN.test(
      new URL(request.url).pathname
    )
  );
}

function isOfflineChapterRequest(request) {
  return new URL(request.url).pathname.startsWith(
    "/__offline__/chapter/"
  );
}

function canCache(response) {
  return (
    response &&
    (response.ok || response.type === "opaque")
  );
}

async function fetchAndCache(request, cache) {
  const response = await fetch(request);

  if (canCache(response)) {
    await cache.put(
      request,
      response.clone()
    );
  }

  return response;
}

/*
 * Menangani gambar chapter yang sudah
 * sengaja didownload oleh user.
 *
 * Contoh URL:
 *
 * /__offline__/chapter/abc/page/1
 */
async function serveOfflineChapter(request) {
  const cache = await caches.open(
    OFFLINE_CHAPTER_CACHE
  );

  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  return new Response(
    "Offline chapter page is not available.",
    {
      status: 404,
      statusText: "Offline page not found",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    }
  );
}

/*
 * Cache-first untuk gambar biasa.
 *
 * Kalau gambar sudah ada di cache:
 *   -> langsung tampilkan cache
 *   -> coba update cache dari network di background
 *
 * Kalau belum ada:
 *   -> ambil dari network
 *   -> simpan ke cache
 */
async function serveImage(request, event) {
  const cache = await caches.open(CACHE_NAME);

  const cached = await cache.match(request);

  if (cached) {
    event.waitUntil(
      fetchAndCache(
        request,
        cache
      ).catch(() => undefined)
    );

    return cached;
  }

  return fetchAndCache(
    request,
    cache
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Hanya intercept GET.
  if (request.method !== "GET") {
    return;
  }

  /*
   * PRIORITAS 1:
   * URL khusus chapter offline.
   *
   * Harus dicek sebelum image request biasa.
   */
  if (isOfflineChapterRequest(request)) {
    event.respondWith(
      serveOfflineChapter(request)
    );

    return;
  }

  /*
   * PRIORITAS 2:
   * Gambar biasa.
   */
  if (!isImageRequest(request)) {
    return;
  }

  event.respondWith(
    serveImage(request, event)
  );
});