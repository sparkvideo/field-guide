// Offline worker for Field Guide. (This file is filled in by scripts/build-sw.mjs at build time.)
// - Saves every page of the app on the phone, so it opens with no signal.
// - Saves the Bible in the background.
// - When a new version is deployed, replaces the saved copy with the new one.

const VERSION = "__VERSION__";
const BIBLE_VERSION = "__BIBLE_VERSION__";
const SHELL = __SHELL__;
const BIBLE = __BIBLE__;
const SHELL_CACHE = `fg-shell-${VERSION}`;
const BIBLE_CACHE = `fg-bible-${BIBLE_VERSION}`;

async function addAll(cacheName, urls) {
  const cache = await caches.open(cacheName);
  const todo = [];
  for (const url of urls) if (!(await cache.match(url))) todo.push(url);
  for (let i = 0; i < todo.length; i += 8) {
    await Promise.all(
      todo.slice(i, i + 8).map(async (url) => {
        let res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) throw new Error(`Could not save ${url}`);
        // Some hosts answer "/page.html" by redirecting to "/page". A redirected copy can't be
        // used to open a page later, so store a clean copy instead.
        if (res.redirected) res = new Response(await res.blob(), { status: 200, headers: res.headers });
        await cache.put(url, res);
      })
    );
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(addAll(SHELL_CACHE, SHELL).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith("fg-") && name !== SHELL_CACHE && name !== BIBLE_CACHE) await caches.delete(name);
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "cache-bible") {
    event.waitUntil(
      addAll(BIBLE_CACHE, BIBLE)
        .then(() => event.source && event.source.postMessage({ type: "bible-cached" }))
        .catch(() => {})
    );
  }
});

async function fromCache(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const tries = [path];
  if (!/\.[a-z0-9]+$/i.test(path)) {
    const clean = path.replace(/\/$/, "");
    tries.push(clean === "" ? "/index.html" : `${clean}.html`, `${clean}/index.html`);
  }
  for (const name of [SHELL_CACHE, BIBLE_CACHE]) {
    const cache = await caches.open(name);
    for (const t of tries) {
      const hit = await cache.match(t, { ignoreSearch: true });
      if (hit) return hit;
    }
  }
  return undefined;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname === "/sw.js") return;

  event.respondWith(
    (async () => {
      const cached = await fromCache(request);
      if (cached) return cached;
      try {
        const res = await fetch(request);
        if (res.ok && url.pathname.startsWith("/bible/")) {
          const cache = await caches.open(BIBLE_CACHE);
          cache.put(url.pathname, res.clone());
        }
        return res;
      } catch (err) {
        if (request.mode === "navigate") {
          const home = await fromCache(new Request("/index.html"));
          if (home) return home;
        }
        throw err;
      }
    })()
  );
});
