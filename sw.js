const CACHE='astromappa-v49';
const ASSETS=['./','index.html','styles.css','app.js','manifest.webmanifest','icon.svg'];

self.addEventListener('install',function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS)}));
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(k){
    return Promise.all(k.filter(function(x){return x!==CACHE}).map(function(x){return caches.delete(x)}));
  }).then(function(){return self.clients.claim()}));
});

/* Rete prima: la copia nuova arriva sempre. La cache serve solo se la rete manca. */
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET') return;
  var url=new URL(e.request.url);
  if(url.origin!==location.origin){
    e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request)}));
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(n){
      if(n && n.ok && n.type==='basic'){
        var copy=n.clone();
        caches.open(CACHE).then(function(c){c.put(e.request,copy)});
      }
      return n;
    }).catch(function(){
      return caches.match(e.request).then(function(r){return r||caches.match('./')});
    })
  );
});
