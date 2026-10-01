const CACHE='astromappa-v34';
const ASSETS=['./','index.html','styles.css','app.js','manifest.webmanifest','icon.svg','catalogo-messier.txt'];

self.addEventListener('install',function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS)}));
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(k){
    return Promise.all(k.filter(function(x){return x!==CACHE}).map(function(x){return caches.delete(x)}));
  }).then(function(){return self.clients.claim()}));
});

/* Rete prima, cache solo se la rete non risponde: cosi' una versione nuova arriva subito. */
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET') return;
  var url=new URL(e.request.url);
  var isAppFile=url.origin===location.origin;
  if(!isAppFile){
    e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request)}));
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(n){
      var copy=n.clone();
      caches.open(CACHE).then(function(c){c.put(e.request,copy)});
      return n;
    }).catch(function(){
      return caches.match(e.request).then(function(r){return r||caches.match('./')});
    })
  );
});
