// Pure image-processing core. Works on {data:Uint8ClampedArray RGBA, width, height}. No DOM.
(function (root) {
  function gray(img, w, h) { // downscaled grayscale Float32Array
    const sw = img.width, sh = img.height, g = new Float32Array(w * h), d = img.data;
    for (let y = 0; y < h; y++) { const sy = Math.min(sh - 1, Math.floor((y + 0.5) * sh / h));
      for (let x = 0; x < w; x++) { const sx = Math.min(sw - 1, Math.floor((x + 0.5) * sw / w)), i = (sy * sw + sx) * 4;
        g[y * w + x] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; } }
    return g;
  }
  function sharpness(g, w, h) { // Laplacian variance
    let s = 0, s2 = 0, n = 0;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x, l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w];
      s += l; s2 += l * l; n++; }
    const m = s / n; return s2 / n - m * m;
  }
  function diff(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; }
  // frames: [{t, sharp, g}] with g = small grayscale (same size). Returns [{t, sharp, idx}]
  function segment(frames, opts = {}) {
    const n = frames.length; if (!n) return [];
    const d = [0]; for (let i = 1; i < n; i++) d.push(diff(frames[i].g, frames[i - 1].g));
    const sorted = d.slice(1).sort((a, b) => a - b), med = sorted[Math.floor(sorted.length / 2)] || 0;
    const thr = opts.motionThr || Math.max(2.5, med * 2.5);
    const minLen = opts.minLen || 2;
    const runs = []; let cur = null;
    for (let i = 0; i < n; i++) {
      const still = i === 0 ? (n > 1 ? d[1] < thr : true) : d[i] < thr;
      if (still) { if (!cur) cur = []; cur.push(i); } else { if (cur) runs.push(cur); cur = null; }
    }
    if (cur) runs.push(cur);
    let picks = runs.filter(r => r.length >= minLen).map(r => r.reduce((b, i) => frames[i].sharp > frames[b].sharp ? i : b, r[0]));
    // merge consecutive picks that show the same page (pause mid-turn)
    const same = opts.sameThr || Math.max(6, thr * 2), out = [];
    for (const p of picks) {
      const last = out[out.length - 1];
      if (last != null && diff(frames[p].g, frames[last].g) < same) { if (frames[p].sharp > frames[last].sharp) out[out.length - 1] = p; }
      else out.push(p);
    }
    return { picks: out.map(i => ({ idx: i, t: frames[i].t, sharp: frames[i].sharp })), diffs: d, thr };
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
  root.ScanCore = { gray, sharpness, diff, segment, detectQuad, warp, enhance, SW: 96, SH: 96 };
  if (typeof module !== 'undefined') module.exports = root.ScanCore;
})(typeof self !== 'undefined' ? self : globalThis);
