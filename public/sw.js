const CACHE_NAME = 'age-of-artemis-v3-science-__BUILD_VERSION__';
const CORE_ASSETS = /* BUILD_ASSETS */;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('age-of-artemis-') && k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request=event.request;
  const url=new URL(request.url);
  // External science requests keep their own validated cache and historical fallback.
  if(request.method!=='GET' || url.origin!==self.location.origin || url.pathname.startsWith('/api/')) return;
  if(request.mode==='navigate') {
    event.respondWith(fetch(request).then(r=>r.ok?r:caches.match('/index.html')).catch(()=>caches.match('/index.html')));
    return;
  }
  // Vite static assets may use Vary: Origin. Module requests send Origin but
  // install-time addAll requests do not. These bundled files are identical for
  // every user, so ignoring Vary is safe and keeps modules available offline.
  event.respondWith(caches.match(request,{ignoreVary:true}).then(hit=>hit||fetch(request)));
});
