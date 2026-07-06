const CACHE_NAME="riyoushi-9laws-final-v5-kokka-icon";
const ASSETS=["./","./index.html","./style.css?v=5","./script.js?v=5","./data.js?v=5","./manifest.json","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];
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
