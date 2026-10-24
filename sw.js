'use strict';
const REVISION = 'e08a6971c8d8e17e';
const PREFIX = 'lara-android-'+new URL(self.registration.scope).pathname.replace(/[^a-z0-9]/gi,'_')+'-';
const CACHE = PREFIX+REVISION;
const CORE = ["index.html","android.js","android.css","manifest.webmanifest","assets/lara-prime-lar.webp","assets/prime-lar-logo.jpg","assets/village-por-do-sol.webp","assets/android/lara-192.png","assets/android/lara-512.png","assets/android/lara-maskable-512.png"].map(file => new URL(file,self.registration.scope).href);
const HOME = new URL('index.html',self.registration.scope).href;
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE.map(url => new Request(url,{cache:'reload'})))));
});
self.addEventListener('activate', event => {
 event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener('message', event => {
 if (event.data?.type === 'LARA_APPLY_UPDATE') self.skipWaiting();
});
self.addEventListener('fetch', event => {
 const request = event.request,url = new URL(request.url),base = new URL(self.registration.scope);
 // Nunca interceptar API, POST, áudio, terceiros ou outros projetos deste domínio.
 if (request.method !== 'GET' || url.origin !== base.origin) return;
 const home = url.pathname === base.pathname || url.pathname === new URL(HOME).pathname;
 if (request.mode === 'navigate' && home) {
  // O documento e os arquivos pertencem à mesma revisão. Checar atualizações é responsabilidade do navegador.
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(HOME)) || fetch(request)));
  return;
 }
 url.search = '';url.hash = '';
 if (!CORE.includes(url.href) || url.href === HOME) return;
 event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(url.href)) || fetch(request)));
});
