const C = self.ScanCore, $ = s => document.querySelector(s);
const FPS = 6, MAXSIDE = 3840, BACKUP = 1600;
let pages = [], mode = 'enhanced', url = null, frames = [], meta = {}, cache = new Map();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
const v = $('#v'), sleep = ms => new Promise(r => setTimeout(r, ms));
const once = (el, ev, ms) => new Promise(res => { const t = setTimeout(() => { el.removeEventListener(ev, f); res(false); }, ms);
  function f() { clearTimeout(t); el.removeEventListener(ev, f); res(true); } el.addEventListener(ev, f); });

async function loadVideo(video, src) {
  video.muted = true; video.playsInline = true; video.src = src; video.load();
  const ok = await Promise.race([once(video, 'loadeddata', 15000), new Promise((_, r) => video.onerror = () => r(new Error('Could not decode this video (format not supported?)')))]);
  if (!ok && video.readyState < 2) { try { await video.play(); video.pause(); } catch (e) {} await once(video, 'loadeddata', 5000); }
  if (!isFinite(video.duration) || !video.duration) { video.currentTime = 1e7; await once(video, 'durationchange', 3000); video.currentTime = 0; await once(video, 'seeked', 3000); }
  if (!video.videoWidth) throw new Error('Video has no picture (still loading?)');
}
async function seek(video, t) { if (Math.abs(video.currentTime - t) < 0.001) t += 0.001; video.currentTime = t; await once(video, 'seeked', 4000);
  if (video.requestVideoFrameCallback) await Promise.race([new Promise(r => video.requestVideoFrameCallback(() => r())), sleep(250)]); else await sleep(30); }
function grab(video, maxSide) { const s = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight));
  const c = document.createElement('canvas'); c.width = Math.round(video.videoWidth * s); c.height = Math.round(video.videoHeight * s);
  c.getContext('2d', { willReadFrequently: true }).drawImage(video, 0, 0, c.width, c.height); return c; }
const small = document.createElement('canvas'), sx = small.getContext('2d', { willReadFrequently: true });
function sample(video, t) { // compute stats for current frame
  sx.drawImage(video, 0, 0, small.width, small.height); const id = sx.getImageData(0, 0, small.width, small.height);
  const g = C.gray(id, small.width, small.height), o = C.occlusion(id);
  const f = { t, sharp: C.sharpness(g, small.width, small.height), g: C.thumb(g, small.width, small.height, C.SW, C.SH), skin: o.skin, dark: o.dark, blob: null };
  const bc = grab(video, BACKUP); bc.toBlob(b => f.blob = b, 'image/jpeg', 0.92); return f; }

async function decodePlay(onp) { // play-and-sample via requestVideoFrameCallback (reliable on iOS)
  const out = []; let next = 0; v.currentTime = 0; await once(v, 'seeked', 2000);
  return new Promise(async (res, rej) => {
    let last = performance.now();
    const cb = (now, m) => { last = performance.now(); const t = m.mediaTime;
      if (t + 1e-3 >= next) { out.push(sample(v, t)); next = t + 1 / FPS; onp(t / meta.dur, out.length); }
      if (!v.ended) v.requestVideoFrameCallback(cb); };
    v.requestVideoFrameCallback(cb); v.playbackRate = 1;
    try { await v.play(); } catch (e) { return rej(e); }
    const watch = setInterval(() => { if (v.ended || performance.now() - last > 4000) { clearInterval(watch); v.pause(); res(out); } }, 300);
  }); }
async function decodeSeek(onp) { const out = [], n = Math.max(1, Math.floor(meta.dur * FPS)); let stuck = 0;
  for (let i = 0; i < n; i++) { const t = Math.min(meta.dur - 0.05, i / FPS); await seek(v, t); const f = sample(v, t);
    if (out.length && C.diff(f.g, out[out.length - 1].g) === 0) stuck++; out.push(f); onp((i + 1) / n, out.length); }
  meta.stuck = stuck; return out; }

async function frameCanvas(f) { // native-res frame at f.t, validated against stored thumb; else backup jpeg
  try { await seek(v, f.t); const c = grab(v, MAXSIDE), sc = document.createElement('canvas'); sc.width = small.width; sc.height = small.height;
    sc.getContext('2d').drawImage(c, 0, 0, sc.width, sc.height); const id = sc.getContext('2d').getImageData(0, 0, sc.width, sc.height);
    const g = C.thumb(C.gray(id, sc.width, sc.height), sc.width, sc.height, C.SW, C.SH);
    if (C.diff(g, f.g) < 6) return c; } catch (e) {}
  for (let i = 0; i < 50 && !f.blob; i++) await sleep(50);
  if (!f.blob) return grab(v, MAXSIDE); const bm = await createImageBitmap(f.blob); const c = document.createElement('canvas');
  c.width = bm.width; c.height = bm.height; c.getContext('2d').drawImage(bm, 0, 0); return c; }
const imgData = c => c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height);
function toCanvas(img) { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  c.getContext('2d').putImageData(new ImageData(img.data, img.width, img.height), 0, 0); return c; }
function makePage(frame, t) { const q = C.detectQuad(frame); const flat = q ? C.warp(frame, q, MAXSIDE) : frame;
  return { t, cropped: !!q, flat, out: {} }; }
function render(p) { if (!p.out[mode]) p.out[mode] = toCanvas(C.enhance(p.flat, mode)).toDataURL('image/jpeg', 0.9); return p.out[mode]; }

const st = $('#status'), bar = $('#bar'), dbg = $('#dbg');
async function buildPages() { const r = C.segment(frames, { sensitivity: +$('#sens').value, fps: FPS }); const np = [];
  for (let k = 0; k < r.picks.length; k++) { st.textContent = `Cleaning page ${k + 1}/${r.picks.length}`; const f = frames[r.picks[k].idx];
    if (!cache.has(f)) { cache.set(f, makePage(imgData(await frameCanvas(f)), f.t)); } np.push(cache.get(f));
    render(np[k]); bar.value = 0.7 + 0.3 * (k + 1) / r.picks.length; await sleep(0); }
  pages = np; st.textContent = `Found ${pages.length} page${pages.length === 1 ? '' : 's'}.`; bar.value = 1;
  dbg.textContent = `${meta.dur.toFixed(1)}s ${meta.w}×${meta.h} · ${frames.length} frames sampled via ${meta.how}${meta.stuck ? ` (${meta.stuck} stuck)` : ''} · ${r.segs} segments · motion lo ${r.lo.toFixed(1)} / hi ${r.hi.toFixed(1)} / thr ${isFinite(r.thr) ? r.thr.toFixed(1) : '∞'} · picks @ ${r.picks.map(p => p.t.toFixed(1)).join(', ')}s`;
  $('#tools').classList.remove('hide'); draw(); }

async function handle(e) { const f = e.target.files[0]; if (!f) return; e.target.value = '';
  if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(f); cache = new Map();
  $('#prog').classList.remove('hide'); dbg.textContent = '';
  try { st.textContent = 'Loading video…'; await loadVideo(v, url);
    meta = { dur: v.duration, w: v.videoWidth, h: v.videoHeight, how: '', stuck: 0 };
    small.height = 360; small.width = Math.round(360 * meta.w / meta.h);
    const onp = (p, n) => { bar.value = Math.min(1, p) * 0.7; st.textContent = `Analyzing… ${n} frames`; };
    frames = [];
    if (v.requestVideoFrameCallback) { try { meta.how = 'playback'; frames = await decodePlay(onp); } catch (err) { frames = []; } }
    if (frames.length < Math.min(4, meta.dur * FPS * 0.5)) { meta.how = 'seeking'; frames = await decodeSeek(onp); }
    await buildPages();
  } catch (err) { st.textContent = 'Error: ' + err.message; dbg.textContent = `${f.type || '?'} ${(f.size / 1e6).toFixed(1)}MB`; } }
$('#pick').onchange = handle; $('#rec').onchange = handle;
$('#sens').onchange = () => frames.length && buildPages();

function draw() { const g = $('#grid'); g.innerHTML = '';
  $('#count').textContent = pages.length + ' page' + (pages.length === 1 ? '' : 's');
  pages.forEach((p, i) => { const d = document.createElement('div'); d.className = 'card';
    d.innerHTML = `<img src="${render(p)}" alt="Page ${i + 1}"><div class="n">Page ${i + 1}${p.cropped ? '' : ' · uncropped'}</div>
     <div class="acts"><button class="btn sm" data-a="up" aria-label="Move up">↑</button><button class="btn sm" data-a="dn" aria-label="Move down">↓</button>
     <button class="btn sm" data-a="sh" aria-label="Share">⤴</button><button class="btn sm" data-a="rm" aria-label="Delete">✕</button></div>`;
    d.querySelector('img').onclick = () => { $('#vimg').src = render(p); $('#viewer').dataset.i = i; $('#viewer').style.display = 'flex'; };
    d.querySelectorAll('button').forEach(b => b.onclick = () => { const a = b.dataset.a;
      if (a === 'rm') { if (confirm('Delete page ' + (i + 1) + '?')) pages.splice(i, 1); }
      else if (a === 'up' && i > 0) [pages[i - 1], pages[i]] = [pages[i], pages[i - 1]];
      else if (a === 'dn' && i < pages.length - 1) [pages[i + 1], pages[i]] = [pages[i], pages[i + 1]];
      else if (a === 'sh') return share([i]);
      draw(); });
    g.appendChild(d); }); }
$('#mode').onclick = e => { const m = e.target.dataset.m; if (!m) return; mode = m;
  $('#mode').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.m === m)); draw(); };
$('#vclose').onclick = () => $('#viewer').style.display = 'none';
$('#vshare').onclick = () => share([+$('#viewer').dataset.i]);
async function fileFor(i) { const b = await (await fetch(render(pages[i]))).blob(); return new File([b], `page-${String(i + 1).padStart(2, '0')}.jpg`, { type: 'image/jpeg' }); }
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
async function share(idx) { const files = await Promise.all(idx.map(fileFor));
  if (navigator.canShare && navigator.canShare({ files })) { try { await navigator.share({ files }); } catch (e) {} } else files.forEach(f => download(f, f.name)); }
$('#shareAll').onclick = () => share(pages.map((_, i) => i));
$('#pdf').onclick = async () => { if (!pages.length) return; const { jsPDF } = window.jspdf; let doc;
  for (const p of pages) { const src = render(p), im = new Image(); im.src = src; await im.decode();
    const w = im.naturalWidth, h = im.naturalHeight, o = w > h ? 'l' : 'p';
    if (!doc) doc = new jsPDF({ orientation: o, unit: 'px', format: [w, h], hotfixes: ['px_scaling'] }); else doc.addPage([w, h], o);
    doc.addImage(src, 'JPEG', 0, 0, w, h); }
  const blob = doc.output('blob'), f = new File([blob], 'scan.pdf', { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f] }); } catch (e) {} } else download(blob, 'scan.pdf'); };
const sv = $('#sv'), sr = $('#sr');
$('#addBtn').onclick = async () => { if (!url) return; $('#scrub').style.display = 'block'; await loadVideo(sv, url); sr.max = sv.duration; await seek(sv, +sr.value); };
let seeking = false; sr.oninput = async () => { if (seeking) return; seeking = true; await seek(sv, +sr.value); seeking = false; if (Math.abs(sv.currentTime - sr.value) > 0.05) sr.oninput(); };
$('#grab').onclick = async () => { await seek(sv, +sr.value); const p = makePage(imgData(grab(sv, MAXSIDE)), +sr.value);
  let at = pages.findIndex(q => q.t > p.t); if (at < 0) at = pages.length; pages.splice(at, 0, p); draw(); };
$('#scrubClose').onclick = () => $('#scrub').style.display = 'none';
