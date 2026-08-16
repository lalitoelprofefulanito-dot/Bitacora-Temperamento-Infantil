/* Service Worker de la Bitácora Reflexiva del Temperamento.
   Sube este número (v1 -> v2 -> v3...) cada vez que subas una versión
   nueva de index.html a GitHub: es la única forma en que los
   teléfonos que ya instalaron la app se enteran de que hay cambios. */
const CACHE_NAME = "bitacora-temperamento-v1";

const ARCHIVOS_DE_LA_APP = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-192.png",
  "./icon-maskable-512.png"
];

/* Instalación: descarga y guarda una copia de cada archivo de la app. */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ARCHIVOS_DE_LA_APP))
  );
  self.skipWaiting();
});

/* Activación: borra copias de versiones anteriores para no acumular basura. */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(nombres =>
      Promise.all(nombres.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

/* Cada vez que la app pide un archivo:
   1) intenta traerlo de internet y actualiza la copia guardada (para que,
      si hay señal, la familia siempre vea la versión más reciente);
   2) si no hay internet, entrega la copia guardada sin fallar. */
self.addEventListener("fetch", event => {
  if(event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(respuesta => {
        const copia = respuesta.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia));
        return respuesta;
      })
      .catch(() => caches.match(event.request).then(r => r || caches.match("./index.html")))
  );
});
