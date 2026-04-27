/* 오프라인·PWA: 앱 셸 precache + 정적 파일 stale-while-revalidate + HTML 네트워크 우선 */
const VERSION = "lifecode-sw-2026-02-01";
const PRECACHE = `precache-${VERSION}`;
const RUNTIME = `runtime-${VERSION}`;

/** 설치 시 한 번 받아 두는 파일 (라이프코드 본체) */
const PRECACHE_URLS = [
    "/index.html",
    "/logic.js",
    "/data.js",
    "/manifest.json",
    "/icon-192.png",
    "/icon-512.png",
];

function isDynamicOrApi(pathname) {
    return (
        pathname === "/login" ||
        pathname === "/check-auth" ||
        pathname === "/create-invite" ||
        pathname === "/enter"
    );
}

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(PRECACHE)
            .then((cache) =>
                Promise.allSettled(
                    PRECACHE_URLS.map((url) =>
                        cache.add(new Request(url, { cache: "reload" })).catch(() => {})
                    )
                )
            )
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((k) => k !== PRECACHE && k !== RUNTIME)
                        .map((k) => caches.delete(k))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") {
        event.respondWith(fetch(req));
        return;
    }

    const url = new URL(req.url);
    if (url.origin !== self.location.origin) {
        event.respondWith(staleWhileRevalidateForeign(req));
        return;
    }

    if (isDynamicOrApi(url.pathname)) {
        event.respondWith(
            fetch(req).catch(async () => {
                if (req.mode === "navigate") {
                    const fallback = await caches.match("/index.html");
                    if (fallback) return fallback;
                }
                return new Response("오프라인입니다.", {
                    status: 503,
                    statusText: "Offline",
                    headers: { "Content-Type": "text/plain; charset=utf-8" },
                });
            })
        );
        return;
    }

    const accept = req.headers.get("accept") || "";
    if (req.mode === "navigate" || accept.includes("text/html")) {
        event.respondWith(networkFirstHtml(req));
        return;
    }

    event.respondWith(staleWhileRevalidateSameOrigin(req));
});

/** HTML: 네트워크 우선, 실패 시 precache index */
async function networkFirstHtml(request) {
    try {
        const res = await fetch(request);
        if (res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(request, copy));
        }
        return res;
    } catch {
        const cached = await caches.match("/index.html");
        if (cached) return cached;
        return caches.match(request);
    }
}

/** 같은 출처 정적: 캐시 먼저 쓰고 백그라운드로 갱신 */
async function staleWhileRevalidateSameOrigin(request) {
    const cache = await caches.open(RUNTIME);
    const precacheHit = await caches.match(request, { cacheName: PRECACHE });
    const runtimeHit = await cache.match(request);
    const fromCache = precacheHit || runtimeHit;

    const networkPromise = fetch(request)
        .then((response) => {
            if (response && response.status === 200) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => undefined);

    if (fromCache) {
        networkPromise.then(() => {});
        return fromCache;
    }
    const live = await networkPromise;
    if (live) return live;
    return Response.error();
}

/** CDN(폰트·스크립트): 있으면 캐시, 없으면 네트워크 후 저장 — PDF 등 보조 기능 오프라인 보조 */
async function staleWhileRevalidateForeign(request) {
    const cache = await caches.open(RUNTIME);
    const cached = await cache.match(request);
    try {
        const res = await fetch(request);
        if (res && res.status === 200) {
            cache.put(request, res.clone());
        }
        return res;
    } catch {
        if (cached) return cached;
        return new Response("", { status: 503, statusText: "Offline" });
    }
}
