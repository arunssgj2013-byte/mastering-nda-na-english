const CACHE_VERSION='mne-pwa-v1';
const STATIC_CACHE=CACHE_VERSION+'-static';
const RUNTIME_CACHE=CACHE_VERSION+'-runtime';
const APP_SHELL=[
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './assets/images/app-icon.svg',
  './assets/images/mce-mark.png',
  './assets/css/styles.css?v=52r1',
  './assets/js/site.js?v=116'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(STATIC_CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(key=>!key.startsWith(CACHE_VERSION)).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(RUNTIME_CACHE).then(cache=>cache.put(req,copy));
        return res;
      }).catch(async()=> (await caches.match(req)) || caches.match('./offline.html'))
    );
    return;
  }

  if(['style','script','image','font'].includes(req.destination)){
    event.respondWith(
      caches.match(req).then(cached=>{
        const network=fetch(req).then(res=>{
          if(res && res.ok){
            const copy=res.clone();
            caches.open(RUNTIME_CACHE).then(cache=>cache.put(req,copy));
          }
          return res;
        }).catch(()=>cached);
        return cached || network;
      })
    );
  }
});
