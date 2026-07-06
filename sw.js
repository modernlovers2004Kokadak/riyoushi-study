const CACHE_NAME="riyoushi-9laws-final-v6-thumb-ok-bookmark";
const ASSETS=["./","./index.html","./style.css?v=6","./script.js?v=6","./data.js?v=6","./manifest.json"];
self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.map(k=>k===CACHE_NAME?null:caches.delete(k)))).then(()=>self.clients.claim())
  );
});
self.addEventListener("fetch",event=>{
  event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});
