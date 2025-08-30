/**
 * Service Worker para Blog - Optimización de Performance
 * Implementa estrategias de caching para mejorar Core Web Vitals
 */

const CACHE_NAME = "blog-cache-v1";
const RUNTIME_CACHE_NAME = "blog-runtime-cache-v1";
const IMAGE_CACHE_NAME = "blog-images-cache-v1";

// Recursos estáticos críticos para precargar
const STATIC_CACHE_URLS = [
  "/",
  "/blog",
  "/assets/css/critical.css",
  "/assets/fonts/main.woff2",
  "/assets/images/logo.png",
  "/assets/images/default-og-image.jpg",
  "/assets/images/image-placeholder.svg",
];

// Configuración de estrategias de cache
const CACHE_STRATEGIES = {
  // Cache First - Para assets estáticos
  CACHE_FIRST: "cache-first",
  // Network First - Para contenido dinámico
  NETWORK_FIRST: "network-first",
  // Stale While Revalidate - Para imágenes y contenido semi-estático
  STALE_WHILE_REVALIDATE: "stale-while-revalidate",
};

// Configuración de TTL por tipo de recurso
const CACHE_TTL = {
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 días
  API: 60 * 60 * 1000, // 1 hora
  IMAGES: 30 * 24 * 60 * 60 * 1000, // 30 días
  PAGES: 24 * 60 * 60 * 1000, // 1 día
};

/**
 * Evento de instalación del Service Worker
 */
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker for Blog");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Precaching static resources");
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        // Forzar activación inmediata
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[SW] Precaching failed:", error);
      })
  );
});

/**
 * Evento de activación del Service Worker
 */
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker for Blog");

  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      cleanupOldCaches(),
      // Tomar control inmediato de todas las pestañas
      self.clients.claim(),
    ])
  );
});

/**
 * Interceptor de peticiones fetch
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo cachear peticiones GET
  if (request.method !== "GET") {
    return;
  }

  // Determinar estrategia de cache basada en el tipo de recurso
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isImage(url)) {
    event.respondWith(handleImage(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isBlogPage(url)) {
    event.respondWith(handleBlogPage(request));
  } else {
    // Para otros recursos, usar strategy por defecto
    event.respondWith(handleDefault(request));
  }
});

/**
 * Maneja assets estáticos (CSS, JS, fonts)
 * Estrategia: Cache First con fallback a Network
 */
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);

    if (cachedResponse && !isExpired(cachedResponse, CACHE_TTL.STATIC)) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("[SW] Static asset fetch failed:", error);
    // Retornar desde cache aunque esté expirado
    return caches.match(request);
  }
}

/**
 * Maneja imágenes
 * Estrategia: Stale While Revalidate
 */
async function handleImage(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    // Retornar cached response inmediatamente si existe
    if (cachedResponse) {
      // Revalidar en background si está expirado
      if (isExpired(cachedResponse, CACHE_TTL.IMAGES)) {
        updateImageInBackground(request, cache);
      }
      return cachedResponse;
    }

    // Si no hay cache, buscar en red
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("[SW] Image fetch failed:", error);
    // Fallback a placeholder
    return caches.match("/assets/images/image-placeholder.svg");
  }
}

/**
 * Maneja peticiones a la API
 * Estrategia: Network First con cache de respaldo
 */
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("[SW] API request failed, trying cache:", error);

    const cachedResponse = await caches.match(request);

    if (cachedResponse && !isExpired(cachedResponse, CACHE_TTL.API)) {
      // Agregar header para indicar que viene del cache
      const headers = new Headers(cachedResponse.headers);
      headers.set("X-Cache-Status", "HIT");

      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers,
      });
    }

    // Si no hay cache válido, retornar error
    throw error;
  }
}

/**
 * Maneja páginas del blog
 * Estrategia: Network First con cache de respaldo
 */
async function handleBlogPage(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("[SW] Blog page fetch failed, trying cache:", error);

    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback a página offline si existe
    return (
      caches.match("/offline.html") ||
      new Response("Página no disponible offline", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      })
    );
  }
}

/**
 * Manejo por defecto para otros recursos
 */
async function handleDefault(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return caches.match(request);
  }
}

/**
 * Actualiza imagen en background
 */
async function updateImageInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    console.warn("[SW] Background image update failed:", error);
  }
}

/**
 * Limpia caches antiguos
 */
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE_NAME, IMAGE_CACHE_NAME];

  return Promise.all(
    cacheNames.map((cacheName) => {
      if (!currentCaches.includes(cacheName)) {
        console.log("[SW] Deleting old cache:", cacheName);
        return caches.delete(cacheName);
      }
    })
  );
}

/**
 * Verifica si un recurso está expirado
 */
function isExpired(response, ttl) {
  const cachedDate = response.headers.get("sw-cached-date");
  if (!cachedDate) return true;

  const cacheTime = new Date(cachedDate).getTime();
  const now = Date.now();

  return now - cacheTime > ttl;
}

/**
 * Predicados para identificar tipos de recursos
 */
function isStaticAsset(url) {
  return /\.(css|js|woff2?|ttf|eot)$/i.test(url.pathname);
}

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(url.pathname);
}

function isAPIRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isBlogPage(url) {
  return url.pathname.startsWith("/blog") || url.pathname === "/";
}

/**
 * Event listener para mensajes desde la aplicación
 */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_CACHE_INFO") {
    getCacheInfo().then((info) => {
      event.ports[0].postMessage(info);
    });
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

/**
 * Obtiene información sobre el estado del cache
 */
async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const info = {};

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    info[cacheName] = {
      size: keys.length,
      urls: keys.map((request) => request.url),
    };
  }

  return info;
}

/**
 * Limpia todos los caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(cacheNames.map((name) => caches.delete(name)));
}

/**
 * Preload de recursos críticos cuando hay conectividad
 */
async function preloadCriticalResources() {
  if (
    "connection" in navigator &&
    navigator.connection.effectiveType !== "4g"
  ) {
    // Solo precargar en conexiones rápidas
    return;
  }

  const criticalResources = [
    "/blog/categoria/tecnologia",
    "/blog/categoria/desarrollo",
    "/assets/images/blog-og-image.jpg",
  ];

  const cache = await caches.open(RUNTIME_CACHE_NAME);

  for (const url of criticalResources) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        cache.put(url, response);
      }
    } catch (error) {
      console.warn("[SW] Failed to preload:", url, error);
    }
  }
}

// Ejecutar preload después de la instalación
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      // ... existing installation logic
      preloadCriticalResources(),
    ])
  );
});
