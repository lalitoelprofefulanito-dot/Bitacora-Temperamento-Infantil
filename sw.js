/* Service Worker de CONOCIÉNDONOS.
   Objetivo: una vez que la familia abrió la app una vez con conexión,
   pueda registrar, revisar y reflexionar sin internet.
   No cachea el envío de feedback (POST): eso siempre necesita conexión
   y ya se marca así en la interfaz.

   IMPORTANTE al publicar una nueva versión de index.html:
   sube en 1 el número de CACHE_VERSION de la línea siguiente.
   Eso obliga a los teléfonos que ya tienen la app instalada a bajar
   los archivos nuevos en vez de seguir usando la copia guardada. */
const CACHE_VERSION = 1;
const CACHE_NAME = "conociendonos-v" + CACHE_VERSION;

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(nombres =>
      Promise.all(
        nombres
          .filter(n => n !== CACHE_NAME)
          .map(n => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;

  // Solo interceptamos GET. El envío de feedback (POST) y cualquier otra
  // escritura siempre pasan directo a la red, sin pasar por caché.
  if (req.method !== "GET") return;

  // Peticiones a otros orígenes (por ejemplo, el servicio de feedback)
  // no se cachean: se dejan pasar tal cual a la red.
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(cached => {
      const enRed = fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const copia = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copia));
          }
          return res;
        })
        .catch(() => cached); // sin conexión: usa lo que ya está guardado

      // Si ya hay una copia local, se muestra de inmediato (rápido y
      // funciona sin internet) y de paso se actualiza en segundo plano.
      return cached || enRed;
    })
  );
});
