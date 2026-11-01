const V='scan-v5',F=['./','index.html','app.js','core.js','style.css','manifest.json','icon-180.png','icon-192.png','icon-512.png','vendor/jspdf.umd.min.js','vendor/mediapipe/vision_bundle.mjs','vendor/mediapipe/vision_wasm_internal.js','vendor/mediapipe/vision_wasm_internal.wasm','vendor/mediapipe/hand_landmarker.task'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(F)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
 e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r;}).catch(()=>caches.match(e.request,{ignoreSearch:true})));});
