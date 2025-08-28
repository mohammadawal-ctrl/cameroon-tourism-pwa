
const CACHE = 'cm-explore-v1';
const ASSETS = [
  'index.html','explore.html','destination.html','packages.html','package.html','cart.html','checkout.html',
  'confirm.html','mytrips.html','culture.html','offline-map.html','admin.html','auth.html','terms.html','privacy.html',
  'offline.html','404.html',
  'css/style.css',
  'js/shared.js',
  'data/destinations.json', 'data/packages.json', 'data/culture.json',
  'assets/icon-192.png','assets/icon-512.png'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
});
self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  e.respondWith(
    caches.match(e.request).then(res=>{
      return res || fetch(e.request).then(r=>{
        if(r.ok && (url.origin===location.origin)){
          const copy = r.clone();
          caches.open(CACHE).then(c=>c.put(e.request, copy));
        }
        return r;
      }).catch(()=> caches.match('offline.html'));
    })
  );
});
