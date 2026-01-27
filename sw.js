// Nombre de la caché (si cambias esto, se borrará la caché vieja)
const CACHE_NAME = "birracount-v2";

// Archivos que queremos guardar para que funcione offline
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/screenshot-mobile.png", // Si las has subido
  "/screenshot-desktop.png" // Si las has subido
];

// 1. INSTALACIÓN: Guardamos los archivos en la caché
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Instalando...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Cacheando archivos");
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); // Fuerza al SW a activarse de inmediato
});

// 2. ACTIVACIÓN: Borramos cachés viejas para limpiar basura
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activando...");
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Borrando caché antigua", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH: Interceptamos las peticiones (La magia Offline)
self.addEventListener("fetch", (event) => {
  // Estrategia: Cache First, falling back to Network
  // (Primero busca en caché, si no está, va a internet)
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si está en caché, lo devuelve
      if (response) {
        return response;
      }
      // Si no, lo pide a internet
      return fetch(event.request).catch(() => {
        // Si no hay internet y no está en caché (ej: una imagen nueva),
        // aquí podrías devolver una imagen de error, pero por ahora no hacemos nada.
      });
    })
  );
});