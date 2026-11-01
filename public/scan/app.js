const C = self.ScanCore, $ = s => document.querySelector(s);
const FPS = 6, MAXSIDE = 2000;
let pages = [], mode = 'enhanced', url = null, videoDur = 0;
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

const v = $('#v');
function seek(video, t) { return new Promise((res, rej) => {
  const to = setTimeout(() => { video.removeEventListener('seeked', ok); res(); }, 4000);
  function ok() { clearTimeout(to); video.removeEventListener('seeked', ok); requestAnimationFrame(() => res()); }
  video.addEventListener('seeked', ok); video.currentTime = t; }); }
function loadVideo(video, src) { return new Promise((res, rej) => {
  video.onloadeddata = () => res(); video.onerror = () => rej(new Error('Could not decode this video'));
  video.src = src; video.load(); video.play().then(() => video.pause()).catch(() => {}); }); }
function grabFull(video) { // full-res (capped) frame as {canvas, img}
  const s = Math.min(1, MAXSIDE / Math.max(video.videoWidth, video.videoHeight));
  const c = document.createElement('canvas'); c.width = Math.round(video.videoWidth * s); c.height = Math.round(video.videoHeight * s);
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(video, 0, 0, c.width, c.height);
  return x.getImageData(0, 0, c.width, c.height); }
const small = document.createElement('canvas'), sx = small.getContext('2d', { willReadFrequently: true });

function toCanvas(img) { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  c.getContext('2d').putImageData(new ImageData(img.data, img.width, img.height), 0, 0); return c; }
function makePage(frame, t) { const q = C.detectQuad(frame); const flat = q ? C.warp(frame, q, MAXSIDE) : frame;
  const p = { t, cropped: !!q, flat, out: {} }; render(p); return p; }
function render(p) { if (!p.out[mode]) { const c = toCanvas(C.enhance(p.flat, mode)); p.out[mode] = c.toDataURL('image/jpeg', 0.9); } return p.out[mode]; }

$('#file').onchange = async e => {
  const f = e.target.files[0]; if (!f) return; e.target.value = '';
  if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(f);
  $('#prog').classList.remove('hide'); const st = $('#status'), bar = $('#bar');
  try {
    st.textContent = 'Loading video…'; await loadVideo(v, url); await seek(v, 0);
    videoDur = v.duration; if (!isFinite(videoDur)) throw new Error('Unknown video length');
    const vw = v.videoWidth, vh = v.videoHeight, sh = 360, sw = Math.round(360 * vw / vh); small.width = sw; small.height = sh;
    const frames = [], n = Math.max(1, Math.floor(videoDur * FPS));
    for (let i = 0; i < n; i++) { const t = Math.min(videoDur - 0.05, i / FPS); await seek(v, t);
      sx.drawImage(v, 0, 0, sw, sh); const id = sx.getImageData(0, 0, sw, sh);
      const g = C.gray(id, sw, sh); frames.push({ t, sharp: C.sharpness(g, sw, sh), g: C.gray(id, C.SW, C.SH) });
      bar.value = (i + 1) / n * 0.7; st.textContent = `Analyzing frames ${i + 1}/${n}`; }
    let picks = C.segment(frames).picks; if (!picks.length) picks = [{ t: frames.reduce((b, f) => f.sharp > b.sharp ? f : b).t }];
    const newPages = [];
    for (let k = 0; k < picks.length; k++) { st.textContent = `Cleaning page ${k + 1}/${picks.length}`;
      await seek(v, picks[k].t); newPages.push(makePage(grabFull(v), picks[k].t)); bar.value = 0.7 + 0.3 * (k + 1) / picks.length;
      await new Promise(r => setTimeout(r, 0)); }
    pages = newPages; st.textContent = `Found ${pages.length} page${pages.length === 1 ? '' : 's'}.`;
    $('#tools').classList.remove('hide'); draw();
  } catch (err) { st.textContent = 'Error: ' + err.message; }
};

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
  if (navigator.canShare && navigator.canShare({ files })) { try { await navigator.share({ files }); } catch (e) {} }
  else files.forEach(f => download(f, f.name)); }
$('#shareAll').onclick = () => share(pages.map((_, i) => i));

$('#pdf').onclick = async () => { if (!pages.length) return; const { jsPDF } = window.jspdf; let doc;
  for (const p of pages) { const src = render(p), im = new Image(); im.src = src; await im.decode();
    const w = im.naturalWidth, h = im.naturalHeight, o = w > h ? 'l' : 'p';
    if (!doc) doc = new jsPDF({ orientation: o, unit: 'px', format: [w, h], hotfixes: ['px_scaling'] }); else doc.addPage([w, h], o);
    doc.addImage(src, 'JPEG', 0, 0, w, h); }
  const blob = doc.output('blob'), f = new File([blob], 'scan.pdf', { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f] }); } catch (e) {} } else download(blob, 'scan.pdf'); };

// manual add via scrubber
const sv = $('#sv'), sr = $('#sr');
$('#addBtn').onclick = async () => { if (!url) return; $('#scrub').style.display = 'block'; await loadVideo(sv, url); sr.max = sv.duration; await seek(sv, +sr.value); };
let seeking = false; sr.oninput = async () => { if (seeking) return; seeking = true; await seek(sv, +sr.value); seeking = false; if (Math.abs(sv.currentTime - sr.value) > 0.05) sr.oninput(); };
$('#grab').onclick = async () => { await seek(sv, +sr.value); const p = makePage(grabFull(sv), +sr.value);
  let at = pages.findIndex(q => q.t > p.t); if (at < 0) at = pages.length; pages.splice(at, 0, p); draw(); };
$('#scrubClose').onclick = () => $('#scrub').style.display = 'none';
