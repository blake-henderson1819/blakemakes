// Pure image-processing core. Works on {data:Uint8ClampedArray RGBA, width, height}. No DOM.
(function (root) {
  function gray(img, w, h) { // downscaled grayscale Float32Array
    const sw = img.width, sh = img.height, g = new Float32Array(w * h), d = img.data;
    for (let y = 0; y < h; y++) { const sy = Math.min(sh - 1, Math.floor((y + 0.5) * sh / h));
      for (let x = 0; x < w; x++) { const sx = Math.min(sw - 1, Math.floor((x + 0.5) * sw / w)), i = (sy * sw + sx) * 4;
        g[y * w + x] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; } }
    return g;
  }
  function thumb(g, w, h, tw, th) { // area-average downsample of a gray buffer
    const o = new Float32Array(tw * th), c = new Float32Array(tw * th);
    for (let y = 0; y < h; y++) { const ty = Math.min(th - 1, (y * th / h) | 0);
      for (let x = 0; x < w; x++) { const k = ty * tw + Math.min(tw - 1, (x * tw / w) | 0); o[k] += g[y * w + x]; c[k]++; } }
    for (let i = 0; i < o.length; i++) o[i] /= c[i] || 1; return o; }
  function sharpness(g, w, h) { // Laplacian variance
    let s = 0, s2 = 0, n = 0;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x, l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w];
      s += l; s2 += l * l; n++; }
    const m = s / n; return s2 / n - m * m;
  }
  function diff(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; }
  // skin + dark-intrusion fractions on a small RGBA ImageData (central 80% region)
  function occlusion(img) {
    const w = img.width, h = img.height, d = img.data; let skin = 0, dark = 0, n = 0;
    for (let y = Math.floor(h * 0.1); y < h * 0.9; y++) for (let x = Math.floor(w * 0.1); x < w * 0.9; x++) {
      const i = (y * w + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2];
      const Y = 0.299 * r + 0.587 * g + 0.114 * b, cb = 128 - 0.1687 * r - 0.3313 * g + 0.5 * b, cr = 128 + 0.5 * r - 0.4187 * g - 0.0813 * b;
      if (cr > 138 && cr < 178 && cb > 77 && cb < 125 && Y > 50 && r > g && r > b) skin++;
      if (Y < 60) dark++; n++; }
    return { skin: skin / n, dark: dark / n };
  }
  function pct(arr, p) { const s = arr.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.max(0, Math.floor(p * (s.length - 1))))] || 0; }
  // frames: [{t, sharp, g, skin, dark}]. sensitivity 0..1 (higher = more pages)
  function segment(frames, opts = {}) {
    const n = frames.length; if (!n) return { picks: [], diffs: [], thr: 0, segs: 0 };
    const sens = opts.sensitivity == null ? 0.5 : opts.sensitivity;
    const raw = [0]; for (let i = 1; i < n; i++) raw.push(diff(frames[i].g, frames[i - 1].g));
    raw[0] = raw[1] || 0;
    const d = raw.map((_, i) => (raw[Math.max(0, i - 1)] + 2 * raw[i] + raw[Math.min(n - 1, i + 1)]) / 4); // smooth
    const lo = pct(d, 0.25), hi = pct(d, 0.95), mx = Math.max(...d);
    // adaptive threshold between the typical "hold" jitter and turn peaks
    const frac = 0.55 - 0.4 * sens; // sens 0 -> 0.55, 1 -> 0.15
    let thr = Math.max(lo * 1.5 + 0.5, lo + (hi - lo) * frac);
    if (hi - lo < 1.5) thr = Infinity; // no real motion: single page
    const fps = opts.fps || 6, minLen = Math.max(2, Math.round(fps * 0.3));
    let segs = []; let cur = [];
    for (let i = 0; i < n; i++) { if (d[i] < thr) cur.push(i); else { if (cur.length) segs.push(cur); cur = []; } }
    if (cur.length) segs.push(cur);
    segs = segs.filter(r => r.length >= minLen);
    // fallback: too few segments but clear peaks -> split by motion peaks
    const dur = (frames[n - 1].t - frames[0].t);
    if (segs.length <= 1 && dur > 3 && mx > lo * 2 + 1) {
      const pthr = lo + (mx - lo) * (0.5 - 0.35 * sens), gap = Math.round(fps * 0.8), peaks = [];
      for (let i = 1; i < n - 1; i++) if (d[i] >= pthr && d[i] >= d[i - 1] && d[i] >= d[i + 1]) {
        if (peaks.length && i - peaks[peaks.length - 1] < gap) { if (d[i] > d[peaks[peaks.length - 1]]) peaks[peaks.length - 1] = i; } else peaks.push(i); }
      if (peaks.length) { segs = []; let s0 = 0;
        for (const p of [...peaks, n]) { const seg = []; for (let i = s0; i < p; i++) if (Math.abs(i - p) > 1 && (s0 === 0 || i - s0 > 1)) seg.push(i);
          if (seg.length >= 1) segs.push(seg); s0 = p + 1; } }
    }
    const pickOf = seg => {
      const minOcc = Math.min(...seg.map(i => (frames[i].skin || 0) + 0.5 * (frames[i].dark || 0)));
      const maxS = Math.max(...seg.map(i => frames[i].sharp)) || 1;
      let best = seg[0], bs = -Infinity;
      seg.forEach((i, k) => { const occ = (frames[i].skin || 0) + 0.5 * (frames[i].dark || 0) - minOcc;
        const pos = seg.length > 1 ? k / (seg.length - 1) : 1;
        const s = frames[i].sharp / maxS + 0.25 * pos - 25 * occ; // occlusion dominates
        if (s > bs) { bs = s; best = i; } });
      return best; };
    let picks = segs.map(pickOf);
    // no image-similarity merge: different text pages look alike at thumbnail scale under handshake
    const out = picks.slice();
    if (!out.length) out.push(pickOf(frames.map((_, i) => i)));
    return { picks: out.map(i => ({ idx: i, t: frames[i].t, sharp: frames[i].sharp })), diffs: d, thr, segs: segs.length, lo, hi };
  }
  // ---- quad detection: largest bright blob, corners by extremes ----
  function detectQuad(img) {
    const W = img.width, H = img.height, sc = 300 / Math.max(W, H), w = Math.round(W * sc), h = Math.round(H * sc);
    const g = gray(img, w, h);
    // blur 3x3
    const b = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0, c = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < w && yy < h) { s += g[yy * w + xx]; c++; } } b[y * w + x] = s / c; }
    // Otsu
    const hist = new Array(256).fill(0); for (const v of b) hist[Math.min(255, v | 0)]++;
    let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sB = 0, wB = 0, best = 0, t = 128; const tot = b.length;
    for (let i = 0; i < 256; i++) { wB += hist[i]; if (!wB) continue; const wF = tot - wB; if (!wF) break; sB += i * hist[i];
      const mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) ** 2; if (v > best) { best = v; t = i; } }
    const m = new Uint8Array(w * h); for (let i = 0; i < m.length; i++) m[i] = b[i] > t ? 1 : 0;
    // largest component
    const lab = new Int32Array(w * h), st = []; let bestL = 0, bestN = 0, L = 0;
    for (let i = 0; i < m.length; i++) if (m[i] && !lab[i]) { L++; let cnt = 0; st.push(i); lab[i] = L;
      while (st.length) { const p = st.pop(); cnt++; const x = p % w, y = (p / w) | 0;
        for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1])
          if (q >= 0 && m[q] && !lab[q]) { lab[q] = L; st.push(q); } }
      if (cnt > bestN) { bestN = cnt; bestL = L; } }
    const area = bestN / (w * h);
    if (area < 0.15 || area > 0.97) return null;
    let tl, tr, br, bl, a = 1e9, bb = -1e9, c = -1e9, dd = 1e9;
    for (let i = 0; i < lab.length; i++) if (lab[i] === bestL) { const x = i % w, y = (i / w) | 0;
      if (x + y < a) { a = x + y; tl = [x, y]; } if (x + y > bb) { bb = x + y; br = [x, y]; }
      if (x - y > c) { c = x - y; tr = [x, y]; } if (x - y < dd) { dd = x - y; bl = [x, y]; } }
    const q = [tl, tr, br, bl].map(([x, y]) => [(x + 0.5) / sc, (y + 0.5) / sc]);
    // sanity: quad area vs blob area (blob should fill the quad, i.e. be roughly convex quad)
    let qa = 0; for (let i = 0; i < 4; i++) { const p = q[i], r = q[(i + 1) % 4]; qa += p[0] * r[1] - r[0] * p[1]; }
    qa = Math.abs(qa) / 2 / (W * H);
    if (qa < 0.12 || area / qa < 0.85) return null;
    return q;
  }
  function solve(A, bv) { const n = bv.length; for (let i = 0; i < n; i++) A[i].push(bv[i]);
    for (let i = 0; i < n; i++) { let mx = i; for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[mx][i])) mx = k;
      [A[i], A[mx]] = [A[mx], A[i]]; for (let k = 0; k < n; k++) if (k !== i) { const f = A[k][i] / A[i][i]; for (let j = i; j <= n; j++) A[k][j] -= f * A[i][j]; } }
    return A.map((r, i) => r[n] / r[i]); }
  function homography(src, dst) { const A = [], b = [];
    for (let i = 0; i < 4; i++) { const [x, y] = src[i], [u, v] = dst[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v); }
    return [...solve(A, b), 1]; }
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  function warp(img, q, maxSide = 2000) {
    let ow = Math.max(dist(q[0], q[1]), dist(q[3], q[2])), oh = Math.max(dist(q[0], q[3]), dist(q[1], q[2]));
    const s = Math.min(1, maxSide / Math.max(ow, oh)); ow = Math.round(ow * s); oh = Math.round(oh * s);
    const Hm = homography([[0, 0], [ow, 0], [ow, oh], [0, oh]], q), out = new Uint8ClampedArray(ow * oh * 4), d = img.data, W = img.width, H = img.height;
    for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
      const z = Hm[6] * x + Hm[7] * y + 1, sx = (Hm[0] * x + Hm[1] * y + Hm[2]) / z, sy = (Hm[3] * x + Hm[4] * y + Hm[5]) / z;
      const x0 = Math.max(0, Math.min(W - 2, sx | 0)), y0 = Math.max(0, Math.min(H - 2, sy | 0)), fx = sx - x0, fy = sy - y0, o = (y * ow + x) * 4;
      for (let c = 0; c < 3; c++) { const i = (y0 * W + x0) * 4 + c;
        out[o + c] = (d[i] * (1 - fx) + d[i + 4] * fx) * (1 - fy) + (d[i + W * 4] * (1 - fx) + d[i + W * 4 + 4] * fx) * fy; }
      out[o + 3] = 255; }
    return { data: out, width: ow, height: oh };
  }
  // mode: 'color' | 'enhanced' | 'bw'
  function enhance(img, mode) {
    if (mode === 'color') return img;
    const W = img.width, H = img.height, d = img.data, out = new Uint8ClampedArray(d.length);
    // background estimate: max-filter on coarse grid then bilinear upsample
    const cs = Math.max(8, Math.round(Math.max(W, H) / 40)), gw = Math.ceil(W / cs), gh = Math.ceil(H / cs), bg = new Float32Array(gw * gh * 3);
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) { const vals = [[], [], []];
      for (let y = gy * cs; y < Math.min(H, gy * cs + cs); y += 2) for (let x = gx * cs; x < Math.min(W, gx * cs + cs); x += 2) { const i = (y * W + x) * 4; for (let c = 0; c < 3; c++) vals[c].push(d[i + c]); }
      for (let c = 0; c < 3; c++) { const v = vals[c].sort((a, b) => a - b); bg[(gy * gw + gx) * 3 + c] = v[Math.floor(v.length * 0.9)] || 255; } }
    // smooth grid (3x3 max then mean) to ignore text blocks
    const bg2 = new Float32Array(bg.length);
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) for (let c = 0; c < 3; c++) { let mx = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = gy + dy, xx = gx + dx; if (yy >= 0 && xx >= 0 && yy < gh && xx < gw) mx = Math.max(mx, bg[(yy * gw + xx) * 3 + c]); }
      bg2[(gy * gw + gx) * 3 + c] = mx; }
    for (let y = 0; y < H; y++) { const fy = Math.min(gh - 1, Math.max(0, y / cs - 0.5)), y0 = fy | 0, y1 = Math.min(gh - 1, y0 + 1), ty = fy - y0;
      for (let x = 0; x < W; x++) { const fx = Math.min(gw - 1, Math.max(0, x / cs - 0.5)), x0 = fx | 0, x1 = Math.min(gw - 1, x0 + 1), tx = fx - x0, i = (y * W + x) * 4;
        let lum = 0; const v = [0, 0, 0];
        for (let c = 0; c < 3; c++) {
          const B = (bg2[(y0 * gw + x0) * 3 + c] * (1 - tx) + bg2[(y0 * gw + x1) * 3 + c] * tx) * (1 - ty) + (bg2[(y1 * gw + x0) * 3 + c] * (1 - tx) + bg2[(y1 * gw + x1) * 3 + c] * tx) * ty;
          let r = d[i + c] / Math.max(B, 30); r = Math.min(1, r); r = Math.pow(r, 2.0); // darken ink
          v[c] = r * 255; lum += [0.299, 0.587, 0.114][c] * v[c]; }
        if (mode === 'bw') { const b = lum > 170 ? 255 : 0; out[i] = out[i + 1] = out[i + 2] = b; }
        else { out[i] = v[0]; out[i + 1] = v[1]; out[i + 2] = v[2]; }
        out[i + 3] = 255; } }
    return { data: out, width: W, height: H };
  }
  root.ScanCore = { occlusion, thumb, gray, sharpness, diff, segment, detectQuad, warp, enhance, SW: 64, SH: 64 };
  if (typeof module !== 'undefined') module.exports = root.ScanCore;
})(typeof self !== 'undefined' ? self : globalThis);
