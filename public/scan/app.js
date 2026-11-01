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
  const f = { t, sharp: C.sharpness(g, small.width, small.height), g: C.thumb(g, small.width, small.height, C.SW, C.SH), skin: o.skin, dark: o.dark, blocks: o.blocks, blob: null };
  const bc = grab(video, BACKUP); bc.toBlob(b => f.blob = b, 'image/jpeg', 0.92); return f; }

async function decodePlay(onp) { // play-and-sample via requestVideoFrameCallback (reliable on iOS)
  const out = []; let next = 0; v.currentTime = 0; await once(v, 'seeked', 2000);
  return new Promise(async (res, rej) => {
    let last = performance.now();
    const cb = (now, m) => { last = performance.now(); const t = m.mediaTime;
      try { if (t + 1e-3 >= next) { out.push(sample(v, t)); next = t + 1 / FPS; onp(t / meta.dur, out.length); } } catch (e) { note("sample", e); }
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
// ---- on-device hand detector (MediaPipe HandLandmarker, vendored, CPU delegate) ----
let hl = null, hlTried = false, hlErr = ''; const errs = [];
const note = (where, e) => { const m = `${where}: ${String(e && e.message || e).slice(0, 100)}`; errs.push(m); console.warn(m); };
async function handModel() { if (hlTried) return hl; hlTried = true;
  try { const base = new URL('vendor/mediapipe/', location.href).href;
    const load = (async () => { const mp = await import(base + 'vision_bundle.mjs');
      return mp.HandLandmarker.createFromOptions({ wasmLoaderPath: base + 'vision_wasm_internal.js', wasmBinaryPath: base + 'vision_wasm_internal.wasm' },
        { baseOptions: { modelAssetPath: base + 'hand_landmarker.task', delegate: 'CPU' }, runningMode: 'IMAGE', numHands: 2,
          minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5 }); })();
    hl = await Promise.race([load, sleep(25000).then(() => { throw new Error('timeout loading model'); })]);
  } catch (e) { hl = null; hlErr = String(e && e.message || e).slice(0, 100); note('detector init', e); } return hl; }
async function frameBitmap(f) { for (let i = 0; i < 60 && !f.blob; i++) await sleep(50); return f.blob ? createImageBitmap(f.blob) : null; }
// hand score (0..1) counting only hands that overlap the page region
async function handScore(f) { if (f.det != null) return f.det; const m = await handModel(); if (!m) return (f.det = 0);
  const bm = await frameBitmap(f); if (!bm) return (f.det = 0);
  let region = [0.08, 0.08, 0.92, 0.92];
  try { const c = document.createElement('canvas'), s = 400 / Math.max(bm.width, bm.height); c.width = Math.round(bm.width * s); c.height = Math.round(bm.height * s);
    c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height); const q = C.detectQuad(imgData(c));
    if (q) { const xs = q.map(p => p[0] / c.width), ys = q.map(p => p[1] / c.height); region = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; } } catch (e) { note('page region', e); }
  const r = m.detect(bm); let best = 0;
  (r.landmarks || []).forEach((lm, h) => { const inside = lm.filter(p => p.x >= region[0] && p.x <= region[2] && p.y >= region[1] && p.y <= region[3]).length;
    const sc = (r.handedness && r.handedness[h] && r.handedness[h][0] && r.handedness[h][0].score) || (r.handednesses && r.handednesses[h] && r.handednesses[h][0].score) || 0.6;
    if (inside >= 3) best = Math.max(best, sc); });
  bm.close && bm.close(); return (f.det = best); }

let stats = {}, lastSeg = null;
function debugLine() { const s = stats;
  dbg.textContent = `${meta.dur ? meta.dur.toFixed(1) : '?'}s ${meta.w || '?'}×${meta.h || '?'} via ${meta.how || '?'}${meta.stuck ? ` (${meta.stuck} stuck)` : ''} · sampled ${s.sampled ?? frames.length} · still ${s.still ?? '?'} · segments ${s.segments ?? '?'}${s.fallback ? ' (' + s.fallback + ')' : ''} · skin-rejected ${s.skinRejected ?? '?'} · detector ${hl ? `checked ${s.detChecked ?? 0}, rejected ${s.detRejected ?? 0}` : 'off' + (hlErr ? ' (' + hlErr + ')' : '')} · kept ${s.kept ?? 0} clean + ${s.flagged ?? 0} hand?` + (errs.length ? ' · errors: ' + errs.slice(-3).join(' | ') : ''); }
async function buildPages() {
  let res = null;
  try { st.textContent = 'Loading hand detector…'; await handModel();
    st.textContent = 'Picking hand-free frames…';
    res = await C.choose(frames, { sensitivity: +$('#sens').value, fps: FPS, detThr: 0.5, detect: hl ? (i => handScore(frames[i])) : null });
    stats = res.stats; lastSeg = res.seg; (stats.errors || []).forEach(e => errs.push('detect: ' + e));
  } catch (e) { note('choose', e); }
  if (!res || !res.pages.length) { // last-resort: evenly spaced sharpest frames
    const per = Math.max(1, FPS * 2), pk = [];
    for (let i = 0; i < frames.length; i += per) { const sl = frames.slice(i, i + per); pk.push({ idx: frames.indexOf(sl.reduce((a, b) => b.sharp > a.sharp ? b : a)), hand: true }); }
    res = { pages: pk }; stats.fallback = 'last-resort'; stats.flagged = pk.length; }
  const np = [];
  for (let k = 0; k < res.pages.length; k++) { const f = frames[res.pages[k].idx]; st.textContent = `Cleaning page ${k + 1}/${res.pages.length}`;
    try { if (!cache.has(f)) cache.set(f, makePage(imgData(await frameCanvas(f)), f.t)); const p = cache.get(f); p.hand = res.pages[k].hand; render(p); np.push(p); }
    catch (e) { note('clean page', e); }
    bar.value = 0.85 + 0.15 * (k + 1) / res.pages.length; await sleep(0); }
  pages = np; bar.value = 1;
  st.textContent = `Found ${pages.length} page${pages.length === 1 ? '' : 's'}` + (stats.flagged ? ` (${stats.flagged} may show a hand)` : '') + '.';
  $('#tools').classList.remove('hide'); draw(); if ($('#allc').open) showCandidates(); }

// "Show all candidates": every sampled still frame, tap to add
function showCandidates() { const g = $('#candGrid'); g.innerHTML = ''; const d = lastSeg ? lastSeg.diffs : null, lim = lastSeg && isFinite(lastSeg.still) ? lastSeg.still : Infinity;
  let list = frames.map((f, i) => i).filter(i => !d || d[i] < lim); if (list.length < 4) list = frames.map((f, i) => i);
  $('#candN').textContent = list.length;
  list.slice(0, 200).forEach(i => { const f = frames[i]; if (!f.blob) return; f.thumb = f.thumb || URL.createObjectURL(f.blob);
    const el = document.createElement('div'); el.className = 'card';
    el.innerHTML = `<img src="${f.thumb}" alt=""><div class="n">${f.t.toFixed(1)}s</div><div class="acts"><button class="btn sm">Add</button></div>`;
    el.querySelector('button').onclick = async () => { try { if (!cache.has(f)) cache.set(f, makePage(imgData(await frameCanvas(f)), f.t)); const p = cache.get(f); p.hand = false;
      if (!pages.includes(p)) { let at = pages.findIndex(q => q.t > p.t); if (at < 0) at = pages.length; pages.splice(at, 0, p); } draw(); } catch (e) { note('add', e); debugLine(); } };
    g.appendChild(el); }); }

async function handle(e) { const f = e.target.files[0]; if (!f) return; e.target.value = '';
  if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(f); cache = new Map(); errs.length = 0; stats = {}; hlTried = hl ? true : false;
  $('#prog').classList.remove('hide'); dbg.textContent = '';
  try { st.textContent = 'Loading video…'; await loadVideo(v, url);
    meta = { dur: v.duration, w: v.videoWidth, h: v.videoHeight, how: '', stuck: 0 };
    small.height = 360; small.width = Math.round(360 * meta.w / meta.h);
    const onp = (p, n) => { bar.value = Math.min(1, p) * 0.7; st.textContent = `Analyzing… ${n} frames`; };
    frames = [];
    if (v.requestVideoFrameCallback) { try { meta.how = 'playback'; frames = await decodePlay(onp); } catch (err) { frames = []; } }
    if (frames.length < Math.min(4, meta.dur * FPS * 0.5)) { meta.how = 'seeking'; frames = await decodeSeek(onp); }
    await buildPages();
  } catch (err) { note('process', err); st.textContent = 'Error: ' + err.message; } finally { debugLine(); dbg.textContent += ` · file ${f.type || '?'} ${(f.size / 1e6).toFixed(1)}MB`; } }
$('#pick').onchange = handle; $('#rec').onchange = handle;
$('#sens').onchange = async () => { if (!frames.length) return; try { await buildPages(); } catch (e) { note('rebuild', e); } debugLine(); };
$('#allc').ontoggle = () => { if ($('#allc').open) showCandidates(); };
window.addEventListener('error', e => { note('js', e.message); debugLine(); }); window.addEventListener('unhandledrejection', e => { note('promise', e.reason); debugLine(); });

function draw() { const g = $('#grid'); g.innerHTML = '';
  $('#count').textContent = pages.length + ' page' + (pages.length === 1 ? '' : 's');
  pages.forEach((p, i) => { const d = document.createElement('div'); d.className = 'card';
    d.innerHTML = `<img src="${render(p)}" alt="Page ${i + 1}"><div class="n">Page ${i + 1}${p.cropped ? '' : ' · uncropped'}${p.hand ? ' <span class="badge">hand?</span>' : ''}</div>
     <div class="acts"><button class="btn sm" data-a="up" aria-label="Move up">↑</button><button class="btn sm" data-a="dn" aria-label="Move down">↓</button>
     <button class="btn sm" data-a="sh" aria-label="Share">⤴</button><button class="btn sm" data-a="rm" aria-label="Delete">✕</button></div>`;
    d.querySelector('img').onclick = () => { $('#vimg').src = render(p); $('#viewer').dataset.i = i; $('#viewer').style.display = 'flex'; };
    d.querySelectorAll('button').forEach(b => b.onclick = () => { const a = b.dataset.a;
      if (a === 'rm') { if (confirm('Delete page ' + (i + 1) + '?')) pages.splice(i, 1); }
      else if (a === 'up' && i > 0) [pages[i - 1], pages[i]] = [pages[i], pages[i - 1]];
      else if (a === 'dn' && i < pages.length - 1) [pages[i + 1], pages[i]] = [pages[i], pages[i + 1]];
      else if (a === 'sh') return share([i]);
      draw(); });
    g.appendChild(d); });
}
$('#mode').onclick = e => { const m = e.target.dataset.m; if (!m) return; mode = m;
  $('#mode').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.m === m)); draw(); };
$('#vclose').onclick = () => $('#viewer').style.display = 'none';
$('#vshare').onclick = () => share([+$('#viewer').dataset.i]);
async function fileFor(i) { const b = await (await fetch(render(pages[i]))).blob(); return new File([b], `page-${String(i + 1).padStart(2, '0')}.jpg`, { type: 'image/jpeg' }); }
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
async function share(idx) { const files = await Promise.all(idx.map(fileFor));
  if (navigator.canShare && navigator.canShare({ files })) { try { await navigator.share({ files }); } catch (e) {} } else files.forEach(f => download(f, f.name)); }
$('#shareAll').onclick = async () => { const files = await Promise.all(pages.map((_, i) => fileFor(i)));
  if (files.length && navigator.canShare && navigator.canShare({ files })) { try { await navigator.share({ files }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  zipDownload(files); };
$('#zip').onclick = async () => zipDownload(await Promise.all(pages.map((_, i) => fileFor(i))));
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
async function zipDownload(files) { if (!files.length) return; const parts = [], cen = []; let off = 0; const enc = new TextEncoder();
  for (const f of files) { const data = new Uint8Array(await f.arrayBuffer()), name = enc.encode(f.name), crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
    parts.push(h.buffer, name, data);
    const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
    cen.push(c.buffer, name); off += 30 + name.length + data.length; }
  const csize = cen.reduce((s, b) => s + (b.byteLength || b.length), 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
  download(new Blob([...parts, ...cen, e.buffer], { type: 'application/zip' }), 'scan-pages.zip'); }
if (typeof module !== 'undefined') module.exports = { zipDownload };
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
