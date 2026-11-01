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
  // skin fraction over the WHOLE frame plus a 6x6 grid of per-block skin fractions (hands enter from edges)
  function isSkin(r, g, b) { const Y = 0.299 * r + 0.587 * g + 0.114 * b, cb = 128 - 0.1687 * r - 0.3313 * g + 0.5 * b, cr = 128 + 0.5 * r - 0.4187 * g - 0.0813 * b;
    return cr > 135 && cr < 180 && cb > 75 && cb < 128 && Y > 45 && r > g && r > b && r - b > 15; }
  function pct(arr, p) { const s = arr.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.max(0, Math.floor(p * (s.length - 1))))] || 0; }
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
  // Relative, graded selection. Never returns empty when frames exist.
  // detect(i) -> Promise<number> hand score 0..1 on the page region (optional). Returns {pages:[{idx,hand,evidence}], stats}
  // ---- page fingerprint: corner keypoints + BRIEF descriptors (robust to shake, lighting, the page sliding/rotating/zooming,
  // and partial occlusion by hands); two frames are compared by how many keypoints agree on one similarity transform (RANSAC) ----
function blur(g,w,h){const o=new Float32Array(w*h),t=new Float32Array(w*h);const r=2;
 for(let y=0;y<h;y++){let s=0;for(let x=-r;x<=r;x++)s+=g[y*w+Math.min(w-1,Math.max(0,x))];for(let x=0;x<w;x++){t[y*w+x]=s/(2*r+1);s+=g[y*w+Math.min(w-1,x+r+1)]-g[y*w+Math.max(0,x-r)];}}
 for(let x=0;x<w;x++){let s=0;for(let y=-r;y<=r;y++)s+=t[Math.min(h-1,Math.max(0,y))*w+x];for(let y=0;y<h;y++){o[y*w+x]=s/(2*r+1);s+=t[Math.min(h-1,y+r+1)*w+x]-t[Math.max(0,y-r)*w+x];}}return o;}
let PAIRS=null;function pairs(){if(PAIRS)return PAIRS;let s=12345;const rnd=()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff};const P=new Int8Array(256*4);
 for(let i=0;i<256*4;i++){let v;do{v=Math.round((rnd()+rnd()+rnd()-1.5)*8)}while(Math.abs(v)>13);P[i]=v;}return PAIRS=P;}
function features(g,w,h,N=400){const b=blur(g,w,h),P=pairs(),R=new Float32Array(w*h);
 for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){let a=0,bb=0,c=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const i=(y+dy)*w+x+dx,ix=g[i+1]-g[i-1],iy=g[i+w]-g[i-w];a+=ix*ix;bb+=iy*iy;c+=ix*iy;}
  R[y*w+x]=(a+bb)/2-Math.sqrt(((a-bb)/2)**2+c*c);}
 const C=8,pts=[];for(let cy=16;cy<h-16;cy+=C)for(let cx=16;cx<w-16;cx+=C){let m=0,mi=-1;for(let y=cy;y<Math.min(h-16,cy+C);y++)for(let x=cx;x<Math.min(w-16,cx+C);x++)if(R[y*w+x]>m){m=R[y*w+x];mi=y*w+x;}if(mi>=0)pts.push([m,mi%w,(mi/w)|0]);}
 pts.sort((a,b)=>b[0]-a[0]);const sel=pts.slice(0,N).filter(p=>p[0]>pts[0][0]*0.01);
 const xy=new Float32Array(sel.length*2),d=new Uint32Array(sel.length*8);
 sel.forEach((p,k)=>{xy[2*k]=p[1];xy[2*k+1]=p[2];for(let i=0;i<256;i++){const a=b[(p[2]+P[4*i+1])*w+p[1]+P[4*i]],c=b[(p[2]+P[4*i+3])*w+p[1]+P[4*i+2]];if(a<c)d[k*8+(i>>5)]|=1<<(i&31);}});
 return {n:sel.length,xy,d};}
function pc(v){v=v-((v>>>1)&0x55555555);v=(v&0x33333333)+((v>>>2)&0x33333333);return(((v+(v>>>4))&0xF0F0F0F)*0x1010101)>>>24;}
function match(A,B){const m=[];for(let i=0;i<A.n;i++){let b1=999,b2=999,bj=-1;for(let j=0;j<B.n;j++){let s=0;for(let k=0;k<8;k++)s+=pc(A.d[i*8+k]^B.d[j*8+k]);if(s<b1){b2=b1;b1=s;bj=j}else if(s<b2)b2=s;}
 if(b1<64&&b1<0.8*b2)m.push([i,bj]);}return m;}
function inliers(A,B,m,tol=5,it=300){if(m.length<3)return 0;let best=0,s=7;const rnd=()=>{s=(s*1103515245+12345)&0x7fffffff;return s%m.length};
 for(let t=0;t<it;t++){const p=m[rnd()],q=m[rnd()];if(p===q)continue;const ax=A.xy[2*p[0]],ay=A.xy[2*p[0]+1],bx=A.xy[2*q[0]],by=A.xy[2*q[0]+1],ux=B.xy[2*p[1]],uy=B.xy[2*p[1]+1],vx=B.xy[2*q[1]],vy=B.xy[2*q[1]+1];
  const dx=bx-ax,dy=by-ay,ex=vx-ux,ey=vy-uy,dd=dx*dx+dy*dy;if(dd<100)continue;const a=(dx*ex+dy*ey)/dd,b=(dx*ey-dy*ex)/dd,sc=Math.hypot(a,b);if(sc<0.7||sc>1.4)continue;
  const tx=ux-(a*ax-b*ay),ty=uy-(b*ax+a*ay);let n=0;for(const r of m){const x=A.xy[2*r[0]],y=A.xy[2*r[0]+1];if(Math.abs(a*x-b*y+tx-B.xy[2*r[1]])<tol&&Math.abs(b*x+a*y+ty-B.xy[2*r[1]+1])<tol)n++;}if(n>best)best=n;}return best;}


  const signature = (g, w, h) => features(g, w, h);
  // distance 0 (same page) .. 1 (different): 1 - agreeing keypoints / 200
  function distance(A, B) { if (!A || !B || A.n < 3 || B.n < 3) return 1; const m = match(A, B); return 1 - Math.min(1, inliers(A, B, m) / 200); }
  // walk frames in order; keep sharp frames that differ from ALL kept pages; replace a kept page with a sharper near-duplicate
  function pickPages(frames, opts = {}) {
    const sens = opts.sensitivity ?? 0.5, thr = opts.thr ?? (0.7 - 0.4 * sens), sthr = thr, memo = opts.memo || new Map();
    const D = (i, j) => { const k = i < j ? i * 1e6 + j : j * 1e6 + i; let d = memo.get(k); if (d == null) { d = distance(frames[i].sig, frames[j].sig); memo.set(k, d); } return d; };
    const sh = frames.map(f => f.sharp), sMin = pct(sh, 0.9) * 0.3;
    const sharpOk = i => sh[i] >= sMin;
    // steady = looks like neighbour (not mid-turn)
    const steady = i => (i > 0 && D(i, i - 1) < sthr) || (i + 1 < frames.length && D(i, i + 1) < sthr);
    // each kept page tracks its latest matching frame (ref), so slow drift/hand movement on the same page isn't "new"
    const kept = []; let cand = 0;
    for (let i = 0; i < frames.length; i++) {
      if (!sharpOk(i) || !steady(i)) continue; cand++;
      let bj = -1, bd = 2;
      for (let k = 0; k < kept.length; k++) { const d = Math.min(D(i, kept[k].ref), D(i, kept[k].idx)); if (d < bd) { bd = d; bj = k; } }
      if (bj >= 0 && bd < thr) { const k = kept[bj]; k.ref = i; k.n++; if (sh[i] > sh[k.idx]) k.idx = i; continue; }
      // new page: require a following frame to agree (filters one-off transients mid-turn)
      let ok = i + 1 >= frames.length; for (let j = i + 1; j < Math.min(frames.length, i + 4); j++) if (D(i, j) < sthr) { ok = true; break; }
      if (!ok) continue;
      kept.push({ idx: i, ref: i, n: 1, d: bd > 1 ? null : bd }); }
    // a page must be seen for ~0.5s (minHits steady frames); shorter runs are mid-turn glimpses
    const minHits = opts.minHits ?? Math.max(2, Math.round((opts.fps || 6) * 0.5)), brief = kept.filter(k => k.n < minHits).length;
    if (kept.some(k => k.n >= minHits)) for (let k = kept.length - 1; k >= 0; k--) if (kept[k].n < minHits) kept.splice(k, 1);
    const dists = kept.map(k => k.d);
    if (!kept.length && frames.length) { let b = 0; sh.forEach((s, i) => { if (s > sh[b]) b = i; }); kept.push({ idx: b, d: null }); }
    kept.sort((a, b) => a.idx - b.idx);
    return { pages: kept.map(k => ({ idx: k.idx })), stats: { sampled: frames.length, candidates: cand, brief, kept: kept.length, thr, dists }, memo, candidates: frames.map((f, i) => i).filter(i => sharpOk(i) && steady(i)) };
  }
  root.ScanCore = { pickPages, distance, signature, pct, thumb, gray, sharpness, diff, detectQuad, warp, enhance, SW: 64, SH: 64 };
  if (typeof module !== 'undefined') module.exports = root.ScanCore;
})(typeof self !== 'undefined' ? self : globalThis);
