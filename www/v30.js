/* V30 — 3B küre görünümü (wc3d_globe_prototype entegrasyonu).
   2B harita aynen kalır; sağ üstteki "3B" düğmesi küre görünümünü açar/kapar.
   Küre oyunun kendi verisini kullanır: R (ülke geometrisi), ownerOf/col (renk), TG (saldırılabilir), G.sel (seçili), pickC (seçim).
   Oyun kuralları değişmez. Küre dosyaları (globe/) ilk açılışta yüklenir. */
(function () {
  'use strict';
  var DEFAULT_3D = true;                       // true yaparsan oyun küre görünümüyle açılır
  var DEG = Math.PI / 180, ON = false, READY = false, LOADING = false, BAD = false;
  var C = [], cMap = {}, THREE, TEX;
  var stage, renderer, scene, camera, globe, earth, cloudM, rafId = 0, last = 0, dirtyQ = 0, needPaint = true, lastSig = '';
  var OW = 2048, OH = 1024, LW = 1536, LH = 768, NW = 512, NH = 256, SCALE = 0.07;
  var ovC, ov, liftC, lift, reliefC, nsmall, nsx, nC, nx, nImg, topoH, ovTex, liftTex, normTex;
  var introStart = 0, introFrom = 3.4, introNext = false, vo = 0, vel = { x: 0, y: 0 }, focusQ = null, camZ = 3.4, zoomT = 3.4, ptrs = {}, down = null, pinch0 = 0, pinchA = null, pinchM = { x: 0, y: 0 };
  function X(tr, en) { return (typeof L !== 'undefined' && L == 'tr') ? tr : en; }
  function $$(i) { return document.getElementById(i); }

  /* ---------- Ülke verisi: oyunun R listesinden ---------- */
  function buildC() {
    if (C.length || !window.R || !R.length) return;
    R.forEach(function (r) {
      var g = r.f && r.f.geometry; if (!g) return;
      var polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates, bb = null, mx = 0;
      (r.parts || []).forEach(function (p) { if (p.a > mx) mx = p.a; });
      polys.forEach(function (p, k) {
        var a = r.parts && r.parts[k] ? r.parts[k].a : 1; if (r.parts && a < mx * .2) return;
        p[0].forEach(function (q) { if (!bb) bb = [q[0], q[1], q[0], q[1]]; if (q[0] < bb[0]) bb[0] = q[0]; if (q[1] < bb[1]) bb[1] = q[1]; if (q[0] > bb[2]) bb[2] = q[0]; if (q[1] > bb[3]) bb[3] = q[1]; });
      });
      var all = [180, 90, -180, -90];
      polys.forEach(function (p) { p[0].forEach(function (q) { if (q[0] < all[0]) all[0] = q[0]; if (q[1] < all[1]) all[1] = q[1]; if (q[0] > all[2]) all[2] = q[0]; if (q[1] > all[3]) all[3] = q[1]; }); });
      var c = { id: r.id, polys: polys, bb: bb || all, all: all, h: 0, t: 0 }; C.push(c); cMap[r.id] = c;
    });
  }
  function inRing(r, x, y) { var ins = false; for (var a = 0, b = r.length - 1; a < r.length; b = a++) { var xi = r[a][0], yi = r[a][1], xj = r[b][0], yj = r[b][1]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; }
  function countryAt(lon, lat) {
    for (var k = 0; k < C.length; k++) {
      var c = C[k], b = c.all; if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
      for (var p = 0; p < c.polys.length; p++) { var rings = c.polys[p], n = 0; for (var r = 0; r < rings.length; r++) if (inRing(rings[r], lon, lat)) n++; if (n % 2 === 1) return c; }
    }
    return null;
  }

  /* ---------- Oyun durumu -> küre ---------- */
  function sig() { try { return JSON.stringify([G && G.sel, Object.keys(TG || {}).join(','), G && G.cur, typeof BT !== 'undefined' && BT ? [BT.a, BT.d] : 0, typeof FLASH !== 'undefined' ? FLASH : 0, G && G.owner, G && G.pl, G && G.plCol]); } catch (e) { return Math.random() + ''; } }
  function recompute() {
    C.forEach(function (c) {
      var t = 0;
      if (G) { if (G.sel === c.id) t = 1; else if (TG && TG[c.id]) t = .45;  }
      c.t = t;
    });
  }
  function trace(ctx, c, W, H) {
    /* Tarih değişim çizgisini (±180°) aşan halkalar: boylamlar açılır, 3 kopya çizilir; kutbu saran halka kutuptan kapatılır.
       (Eski kod ±180 atlamasını düz çizgiyle birleştirip kutup çevresinde disk/halka çiziyordu.) */
    c.polys.forEach(function (rings) {
      rings.forEach(function (r) {
        var n = r.length; if (n < 2) return;
        var xs = new Array(n), ys = new Array(n), off = 0, k, prev = r[0][0];
        for (k = 0; k < n; k++) {
          var lo = r[k][0], d = lo - prev; if (d > 180) off -= 360; else if (d < -180) off += 360; prev = lo;
          xs[k] = (lo + off + 180) / 360 * W; ys[k] = (90 - r[k][1]) / 180 * H;
        }
        var mn = 1e9, mx = -1e9; for (k = 0; k < n; k++) { if (xs[k] < mn) mn = xs[k]; if (xs[k] > mx) mx = xs[k]; }
        var wind = Math.abs(xs[n - 1] - xs[0]) > W * 0.5, pole = 0;
        if (wind) { var sm = 0; for (k = 0; k < n; k++) sm += r[k][1]; pole = sm / n >= 0 ? 0 : H; }
        for (var sh = -2; sh <= 2; sh++) {
          var dx = sh * W; if (mx + dx < 0 || mn + dx > W) continue;
          for (k = 0; k < n; k++) { if (k) ctx.lineTo(xs[k] + dx, ys[k]); else ctx.moveTo(xs[k] + dx, ys[k]); }
          if (wind) { ctx.lineTo(xs[n - 1] + dx, pole); ctx.lineTo(xs[0] + dx, pole); }
          ctx.closePath();
        }
      });
    });
  }
  var baseC, base, baseSig = null;
  function ownSig() { try { var a = [G.pl || '', G.plCol || '']; for (var k in G.owner) a.push(ownerOf(k)); if (window.WCD && WCD.sig) a.push(WCD.sig()); return a.join('|'); } catch (e) { return Math.random() + ''; } }
  function ownCol(c) {
    var col = 'rgba(120,130,150,.18)';
    if (G) { try {
      var o = ownerOf(c.id), rt = null;
      try { if (G.v5 === 1 && G.pl) rt = G.pl; else if (G.P && G.P[0] && G.P[0].start) rt = G.P[0].start; else if (G.act && G.mode == 1) rt = G.act; } catch (e) { }
      if (rt && (o === rt || (typeof o === 'number' && G.P && G.P[o] && G.P[o].start === rt))) col = (G.v5 === 1 && G.plCol) ? G.plCol : window.col(rt);
      else col = window.col(o);
    } catch (e) { } }
    return col;
  }
  function style(c) {
    var bt = (typeof BT !== 'undefined' && BT) ? BT : null, fl = (typeof FLASH !== 'undefined') ? FLASH : null;
    if (G && G.sel === c.id) return { col: 'hsl(52,100%,74%)', a: .78 };
    if (bt && bt.a && bt.a.indexOf(c.id) >= 0) return { col: 'hsl(215,90%,58%)', a: .62 };
    if (bt && bt.d === c.id) return { col: 'hsl(2,85%,55%)', a: .62 };
    if (fl && fl === c.id) return { col: 'hsl(130,70%,50%)', a: .62 };
    /* v40: saldırılabilir ülkeler sarı boyanmaz; sadece yükselir (c.t = .45). Seçilince yukarıdaki G.sel sarısı geçerli. */
    return null;
  }
  function paintBase() {
    if (!baseC) { baseC = mk(OW, OH); base = baseC.getContext('2d'); }
    base.clearRect(0, 0, OW, OH); base.globalAlpha = .5;
    C.forEach(function (c) { base.beginPath(); trace(base, c, OW, OH); base.fillStyle = ownCol(c); base.fill('evenodd'); });
    base.globalAlpha = 1; base.lineWidth = 1.4; base.lineJoin = 'round'; base.strokeStyle = 'rgba(255,255,255,.38)';
    C.forEach(function (c) { base.beginPath(); trace(base, c, OW, OH); base.stroke(); });
  }
  function paintOverlay() {
    var sg = ownSig(); if (!baseC || sg !== baseSig) { baseSig = sg; paintBase(); try { C.forEach(colorEx); } catch (e) { } }   /* V50: 3B blok renkleri de sahiplik değişince yenilenir */
    ov.globalAlpha = 1; ov.clearRect(0, 0, OW, OH); ov.drawImage(baseC, 0, 0);
    C.forEach(function (c) {
      var st = style(c); if (!st) return;
      ov.save(); ov.beginPath(); trace(ov, c, OW, OH); ov.clip('evenodd'); ov.clearRect(0, 0, OW, OH);
      ov.globalAlpha = st.a; ov.fillStyle = st.col; ov.fillRect(0, 0, OW, OH); ov.restore();
      ov.globalAlpha = 1; ov.lineWidth = 1.6; ov.beginPath(); trace(ov, c, OW, OH); ov.strokeStyle = (G && G.sel === c.id) ? 'rgba(255,240,180,.95)' : 'rgba(255,255,255,.5)'; ov.stroke();
    });
    ovTex.needsUpdate = true;
  }
  /* ---------- Gerçek 3B blok: ülke çokgeni yüzey dikeyinde kaldırılır (keskin kenar, ışık hesabı yok) ---------- */
  var EX = {}, H0 = 0.055, DEN = 2, SUBD = 2.2;
  function sph(p, r) { var la = p[1] * DEG, lo = p[0] * DEG; return [r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo)]; }
  function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
  function dens(ring) {
    var n = ring.length, out = [], i, j; if (n > 1 && ring[0][0] === ring[n - 1][0] && ring[0][1] === ring[n - 1][1]) n--;
    for (i = 0; i < n; i++) { var a = ring[i], b = ring[(i + 1) % n], k = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) / DEN)); for (j = 0; j < k; j++) out.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]); }
    return out;
  }
  function tri(out, a, b, c) {
    // En uzun kenardan ikiye bölme (sliver üçgenlerde patlamaz); sert üçgen sınırı yok -> büyük ülkelerde küre altına kesen düz üçgen kalmaz
    var st = [a, b, c], guard = 0;
    function el(p, q) { return Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1])); }
    while (st.length && guard++ < 400000) {
      var C = st.pop(), B = st.pop(), A = st.pop();
      var ab = el(A, B), bc = el(B, C), ca = el(C, A), m = Math.max(ab, bc, ca);
      if (m <= SUBD) { out.push(A, B, C); continue; }
      if (ab === m) { var M1 = mid(A, B); st.push(A, M1, C, M1, B, C); }
      else if (bc === m) { var M2 = mid(B, C); st.push(A, B, M2, A, M2, C); }
      else { var M3 = mid(C, A); st.push(A, B, M3, M3, B, C); }
    }
    while (st.length) { var c2 = st.pop(), b2 = st.pop(), a2 = st.pop(); out.push(a2, b2, c2); }
  }
  function buildEx(c) {
    var e = EX[c.id] = { g: new THREE.Group(), cap: null, wall: null }; e.g.visible = false; globe.add(e.g);
    try {
      var R = 1 + H0, RB = 0.97, cp = [], wp = [], lp = [];
      c.polys.forEach(function (rings) {
        var wrap = false, r0 = rings[0], a0 = 999, b0 = -999; r0.forEach(function (q) { if (q[0] < a0) a0 = q[0]; if (q[0] > b0) b0 = q[0]; });
        if (b0 - a0 > 200) { wrap = true; rings = rings.map(function (rg) { return rg.map(function (q) { return [q[0] < 0 ? q[0] + 360 : q[0], q[1]]; }); }); } // 180° boylamını aşan parça (Rusya/Çukotka): boylamı sürekli hale getir
        var outer = dens(rings[0]); if (outer.length < 3) return;
        var mn = 999, mx = -999; outer.forEach(function (q) { if (q[0] < mn) mn = q[0]; if (q[0] > mx) mx = q[0]; }); if (mx - mn > 200) return;
        var holes = [], all = outer.slice(); for (var h = 1; h < rings.length; h++) { var hr = dens(rings[h]); if (hr.length >= 3) { holes.push(hr); all = all.concat(hr); } }
        var fc = THREE.ShapeUtils.triangulateShape(outer.map(function (q) { return new THREE.Vector2(q[0], q[1]); }), holes.map(function (hr) { return hr.map(function (q) { return new THREE.Vector2(q[0], q[1]); }); }));
        var T = []; fc.forEach(function (f) { tri(T, all[f[0]], all[f[1]], all[f[2]]); });
        T.forEach(function (q) { var v = sph(q, R); cp.push(v[0], v[1], v[2]); });
        [outer].concat(holes).forEach(function (rg) {
          for (var i = 0; i < rg.length; i++) {
            var A = rg[i], B = rg[(i + 1) % rg.length], At = sph(A, R), Bt = sph(B, R), Ab = sph(A, RB), Bb = sph(B, RB), Al = sph(A, R * 1.0006), Bl = sph(B, R * 1.0006);
            wp.push(At[0], At[1], At[2], Bt[0], Bt[1], Bt[2], Bb[0], Bb[1], Bb[2], At[0], At[1], At[2], Bb[0], Bb[1], Bb[2], Ab[0], Ab[1], Ab[2]);
            lp.push(Al[0], Al[1], Al[2], Bl[0], Bl[1], Bl[2]);
          }
        });
      });
      if (!cp.length) return e;
      var gc = new THREE.BufferGeometry(); gc.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
      var nn = new Float32Array(cp.length); for (var i = 0; i < cp.length; i += 3) { var l = Math.sqrt(cp[i] * cp[i] + cp[i + 1] * cp[i + 1] + cp[i + 2] * cp[i + 2]) || 1; nn[i] = cp[i] / l; nn[i + 1] = cp[i + 1] / l; nn[i + 2] = cp[i + 2] / l; }
      gc.setAttribute('normal', new THREE.BufferAttribute(nn, 3));
      var gw = new THREE.BufferGeometry(); gw.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); gw.computeVertexNormals();
      var gl = new THREE.BufferGeometry(); gl.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
      e.cap = new THREE.Mesh(gc, new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide, emissive: 0x000000, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
      e.wall = new THREE.Mesh(gw, new THREE.MeshLambertMaterial({ color: 0x888888, side: THREE.DoubleSide }));
      e.line = new THREE.LineSegments(gl, new THREE.LineBasicMaterial({ color: 0xfff0b4, transparent: true, opacity: .85 }));
      e.g.add(e.cap); e.g.add(e.wall); e.g.add(e.line); colorEx(c);
    } catch (x) { try { console.error(x); } catch (y) { } }
    return e;
  }
  function colorEx(c) {
    var e = EX[c.id]; if (!e || !e.cap) return; var st = style(c), col = st ? st.col : ownCol(c), k;
    try { k = new THREE.Color(); k.setStyle(col); } catch (x) { k = new THREE.Color(0xcccccc); }
    e.cap.material.color.copy(k); e.cap.material.emissive.copy(k).multiplyScalar(.35); e.wall.material.color.copy(k).multiplyScalar(.55); e.wall.material.emissive.copy(k).multiplyScalar(.12);
  }
  function applyEx(c) { var e = EX[c.id]; if (!e) return; e.g.scale.setScalar((1 + H0 * c.h) / (1 + H0)); e.g.visible = c.h > 0.004 && !!e.cap; }
  var ZERO = new Uint8ClampedArray(512 * 256 * 4);
  function updateNormals() {
    var d = ZERO, o = nImg.data, x, y, i, hl, hr, hu, hd, nxv, nyv, l;
    for (y = 0; y < NH; y++) {
      var ym = y > 0 ? y - 1 : 0, yp = y < NH - 1 ? y + 1 : NH - 1;
      for (x = 0; x < NW; x++) {
        var xm = x > 0 ? x - 1 : NW - 1, xp = x < NW - 1 ? x + 1 : 0;
        hl = d[(y * NW + xm) * 4] / 255 * 4 + topoH[y * NW + xm] * 1.5; hr = d[(y * NW + xp) * 4] / 255 * 4 + topoH[y * NW + xp] * 1.5;
        hu = d[(ym * NW + x) * 4] / 255 * 4 + topoH[ym * NW + x] * 1.5; hd = d[(yp * NW + x) * 4] / 255 * 4 + topoH[yp * NW + x] * 1.5;
        nxv = -(hr - hl) * 0.5; nyv = (hd - hu) * 0.5; l = Math.sqrt(nxv * nxv + nyv * nyv + 1); i = (y * NW + x) * 4;
        o[i] = (nxv / l * 0.5 + 0.5) * 255; o[i + 1] = (nyv / l * 0.5 + 0.5) * 255; o[i + 2] = (1 / l * 0.5 + 0.5) * 255; o[i + 3] = 255;
      }
    }
    nx.putImageData(nImg, 0, 0); normTex.needsUpdate = true;
  }
  function refresh() { recompute(); needPaint = true; }
  function dirty() { if (!ON || !READY || dirtyQ) return; dirtyQ = requestAnimationFrame(function () { dirtyQ = 0; var s = sig(); if (s !== lastSig) { lastSig = s; refresh(); } }); }

  /* ---------- Sahne kurulumu ---------- */
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function loadImg(src) { return new Promise(function (ok, no) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = no; im.src = src; }); }
  function loadScript(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { no(new Error(src)); }; document.head.appendChild(s); }); }
  function build() {
    THREE = window.THREE; TEX = window.WC_TEX;
    ovC = mk(OW, OH); ov = ovC.getContext('2d'); liftC = mk(LW, LH); lift = liftC.getContext('2d'); reliefC = mk(LW, LH);
    nsmall = mk(NW, NH); nsx = nsmall.getContext('2d', { willReadFrequently: true }); nC = mk(NW, NH); nx = nC.getContext('2d'); nImg = nx.createImageData(NW, NH); topoH = new Float32Array(NW * NH);
    var coarse = window.matchMedia && matchMedia('(pointer:coarse)').matches || document.body.classList.contains('fxlow');
    renderer = new THREE.WebGLRenderer({ antialias: !coarse, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
    stage.appendChild(renderer.domElement);
    scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200); camera.position.set(0, 0, camZ);
    var sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.position.set(3, 2, 4); scene.add(sun); scene.add(new THREE.AmbientLight(0x6b7fa8, 0.9));
    globe = new THREE.Group(); scene.add(globe);
    ovTex = new THREE.CanvasTexture(ovC); ovTex.colorSpace = THREE.SRGBColorSpace; ovTex.anisotropy = 4; liftTex = new THREE.CanvasTexture(liftC); normTex = new THREE.CanvasTexture(nC);
    return Promise.all([loadImg(TEX.marble), loadImg(TEX.topo), loadImg(TEX.water), loadImg(TEX.sky), loadImg(TEX.clouds)]).then(function (im) {
      var marble = new THREE.Texture(im[0]); marble.colorSpace = THREE.SRGBColorSpace; marble.anisotropy = 4; marble.needsUpdate = true;
      var water = new THREE.Texture(im[2]); water.needsUpdate = true; var sky = new THREE.Texture(im[3]); sky.colorSpace = THREE.SRGBColorSpace; sky.needsUpdate = true; var cmC = mk(im[4].width || 1024, im[4].height || 512), cmX = cmC.getContext('2d'); cmX.drawImage(im[4], 0, 0, cmC.width, cmC.height); cmX.globalCompositeOperation = 'destination-out'; var cg = cmX.createLinearGradient(0, 0, 0, cmC.height); cg.addColorStop(0, 'rgba(0,0,0,1)'); cg.addColorStop(0.24, 'rgba(0,0,0,1)'); cg.addColorStop(0.36, 'rgba(0,0,0,0.6)'); cg.addColorStop(0.5, 'rgba(0,0,0,0)'); cg.addColorStop(0.64, 'rgba(0,0,0,0.6)'); cg.addColorStop(0.76, 'rgba(0,0,0,1)'); cg.addColorStop(1, 'rgba(0,0,0,1)'); cmX.fillStyle = cg; cmX.fillRect(0, 0, cmC.width, cmC.height); var clouds = new THREE.CanvasTexture(cmC);
      nsx.drawImage(im[1], 0, 0, NW, NH); var td = nsx.getImageData(0, 0, NW, NH).data; for (var q = 0; q < NW * NH; q++) topoH[q] = td[q * 4] / 255;
      var rx = reliefC.getContext('2d'); rx.drawImage(im[1], 0, 0, LW, LH); var rd = rx.getImageData(0, 0, LW, LH), p;
      for (p = 0; p < LW * LH; p++) { var v = Math.round((0.55 + 0.45 * rd.data[p * 4] / 255) * 255); rd.data[p * 4] = rd.data[p * 4 + 1] = rd.data[p * 4 + 2] = v; rd.data[p * 4 + 3] = 255; } rx.putImageData(rd, 0, 0);
      updateNormals();
      var geo = coarse ? new THREE.SphereGeometry(1, 192, 96) : new THREE.SphereGeometry(1, 320, 160);
      earth = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ map: marble, specularMap: water, specular: new THREE.Color(0x445566), shininess: 28, normalMap: normTex, normalScale: new THREE.Vector2(1, 1) })); globe.add(earth);
      var cover = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: ovTex, transparent: true, depthWrite: false, emissive: new THREE.Color(0xffffff), emissiveMap: ovTex, emissiveIntensity: 0.35, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); cover.scale.setScalar(1.0015); globe.add(cover);
      cloudM = new THREE.Mesh(new THREE.SphereGeometry(1.012, 96, 48), new THREE.MeshLambertMaterial({ map: clouds, transparent: true, opacity: 0.55, depthWrite: false })); globe.add(cloudM);
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.14, 64, 32), new THREE.ShaderMaterial({ vertexShader: 'varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'varying vec3 vN;void main(){float i=pow(0.68-dot(vN,vec3(0.,0.,1.)),3.5);gl_FragColor=vec4(.35,.62,1.,1.)*clamp(i,0.,1.)*1.7;}', side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })));
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(80, 32, 16), new THREE.MeshBasicMaterial({ map: sky, side: THREE.BackSide })));
      bindInput(); resize(); READY = true;
    });
  }

  /* ---------- Kamera ve etkileşim ---------- */
  function resize() { if (!renderer) return; var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.fov = w < h ? 52 : 40; camera.updateProjectionMatrix(); }
  function rotateBy(dx, dy) { var k = 0.0042 * camZ / 3.4; globe.quaternion.premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(dy * k, dx * k, 0, 'XYZ'))); }
  function stepCamera(dt) {
    if (focusQ) { globe.quaternion.slerp(focusQ, Math.min(1, dt * 5)); if (globe.quaternion.angleTo(focusQ) < 0.002) focusQ = null; }
    else if (!down && (Math.abs(vel.x) > 0.05 || Math.abs(vel.y) > 0.05)) { rotateBy(vel.x, vel.y); vel.x *= 0.93; vel.y *= 0.93; }
    if (introStart) { var _k = Math.max(0, Math.min(1, (performance.now() - introStart) / 1800)); camZ = introFrom + (zoomT - introFrom) * (1 - Math.pow(1 - _k, 3)); if (_k >= 1) introStart = 0; } else camZ += (zoomT - camZ) * Math.min(1, dt * 8);   /* V56: yeni oyunda küre uzaktan yaklaşır */
     camera.position.z = camZ * (window.innerWidth > window.innerHeight ? 0.86 : 1);   /* V53: yatayda küre daha yakın */
    // savaş paneli açıkken görüntüyü panelin dışındaki alana kaydır (telefonda yukarı, geniş ekranda sola)
    var _pn = window.innerWidth > window.innerHeight && document.getElementById('panel'); vo += ((((typeof BSH !== 'undefined' && BSH) || (_pn && _pn.offsetWidth > 0)) ? 1 : 0) - vo) * Math.min(1, dt * 6);
    var w = stage.clientWidth, h = stage.clientHeight;
    if (vo < 0.01) { if (camera.view && camera.view.enabled) camera.clearViewOffset(); }
    else if (w && h) { var wide = window.innerWidth >= 900 || window.innerWidth > window.innerHeight; camera.setViewOffset(w, h, wide ? vo * (window.innerWidth > window.innerHeight && window.innerWidth < 900 ? -Math.min(205, w * 0.2) : 205) : 0, wide ? 0 : vo * h * .19, w, h); }
  }
  function focusOn(c, instant) {
    if (!c || !READY) return; var b = c.bb, lon = (b[0] + b[2]) / 2 * DEG, lat = (b[1] + b[3]) / 2 * DEG;
    var qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2 - lon), qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), lat - 0.3), q = qx.multiply(qy);
    if (instant) globe.quaternion.copy(q); else focusQ = q;
    var span = Math.max(b[2] - b[0], (b[3] - b[1]) * 1.6); zoomT = Math.max(2.2, Math.min(3.6, 2.2 + span / 25)); if (instant) camZ = zoomT;
  }
  function focusHome(instant) { var id = null; try { id = homeId(); } catch (e) { } if (id && cMap[id]) focusOn(cMap[id], instant); else { globe.quaternion.identity(); zoomT = 3.4; if (instant) camZ = zoomT; } }
  function bindInput() {
    var el = renderer.domElement, ray = new THREE.Raycaster(), m2 = new THREE.Vector2(); el.style.touchAction = 'none';
    el.addEventListener('pointerdown', function (e) {
      el.setPointerCapture(e.pointerId); ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; focusQ = null; vel.x = vel.y = 0;
      if (Object.keys(ptrs).length === 1) down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
      else { down = null; var a = Object.keys(ptrs).map(function (k) { return ptrs[k]; }); pinch0 = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); pinchA = Math.atan2(a[1].y - a[0].y, a[1].x - a[0].x); pinchM = { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 }; }
    });
    el.addEventListener('pointermove', function (e) {
      var p = ptrs[e.pointerId]; if (!p) return; var dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; var ids = Object.keys(ptrs);
      if (ids.length === 1 && down) { down.moved += Math.abs(dx) + Math.abs(dy); rotateBy(dx, dy); vel.x = dx; vel.y = dy; }
      else if (ids.length === 2) {
        var a = ptrs[ids[0]], b = ptrs[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y), ang = Math.atan2(b.y - a.y, b.x - a.x), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        if (pinch0) zoomT = Math.max(1.5, Math.min(6, zoomT * pinch0 / d));
        if (pinchA !== null) {
          var da = ang - pinchA; if (da > Math.PI) da -= 2 * Math.PI; else if (da < -Math.PI) da += 2 * Math.PI;
          globe.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -da)); // iki parmakla döndürme (twist)
          rotateBy(mx - pinchM.x, my - pinchM.y); // iki parmakla sürükleme
        }
        pinch0 = d; pinchA = ang; pinchM = { x: mx, y: my };
      }
    });
    function up(e) { var d = down; delete ptrs[e.pointerId]; if (Object.keys(ptrs).length < 2) { pinch0 = 0; pinchA = null; } if (d && d.moved < 8 && performance.now() - d.t < 400) pick(e.clientX, e.clientY); down = null; }
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', function (e) { e.preventDefault(); zoomT = Math.max(1.5, Math.min(6, zoomT * (1 + e.deltaY * 0.001))); }, { passive: false });
    function pick(cx, cy) {
      var r = el.getBoundingClientRect(); m2.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1); ray.setFromCamera(m2, camera);
      var hit = ray.intersectObject(earth, false)[0];
      if (!hit) { if (G && !BSH && G.sel) { G.sel = null; render(); } return; }
      var v = globe.worldToLocal(hit.point.clone()).normalize(), lat = Math.asin(v.y) / DEG, lon = Math.atan2(-v.z, v.x) / DEG, c = countryAt(lon, lat);
      if (c) pickC(c.id); else if (G && !BSH && G.sel) { G.sel = null; render(); }
    }
  }
  var fr = 0;
  function anyMoving() { for (var i = 0; i < C.length; i++) if (C[i].h !== C[i].t) return true; return false; }
  function loop(now) {
    if (!ON) { rafId = 0; return; } rafId = requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - last) / 1000); last = now; cloudM.rotation.y += dt * 0.004;
    if (needPaint) { needPaint = false; paintOverlay(); C.forEach(function (c) { if (EX[c.id]) colorEx(c); }); }
    for (var i = 0; i < C.length; i++) {
      var c = C[i]; if (c.h === c.t) continue;
      var d = c.t - c.h; if (c.t > 0 && !EX[c.id]) buildEx(c);
      if (Math.abs(d) > 0.002) { var st = Math.max(Math.abs(d) * (1 - Math.exp(-dt * 5.5)), dt * 0.06); c.h += Math.sign(d) * Math.min(Math.abs(d), st); } else c.h = c.t;
      applyEx(c);
    }
    stepCamera(dt); renderer.render(scene, camera);
  }

  /* ---------- Aç / kapat ---------- */
  function setBtn() { var b = $$('v30b'); if (b) { b.textContent = ON ? '2B' : '3B'; b.title = ON ? X('Düz harita', 'Flat map') : X('3B küre', '3D globe'); b.classList.toggle('on', ON); } }
  function doIntro() {   /* V56: yeni oyunda küre uzaktan yaklaşır ve belirir */
    try {
      introFrom = zoomT * 2.7; camZ = introFrom; introStart = performance.now() + 350;
      var cvs = renderer && renderer.domElement; if (!cvs) return;
      cvs.style.transition = 'none'; cvs.style.opacity = '0'; void cvs.offsetWidth;
      setTimeout(function () { cvs.style.transition = 'opacity 1.1s ease-out'; cvs.style.opacity = '1'; }, 350);
    } catch (e) { }
  }
  function show() {
    ON = true; setBtn(); $$('map').classList.add('v30on'); stage.style.display = 'block'; resize(); lastSig = ''; refresh(); focusHome(true);
    if (introNext) { introNext = false; doIntro(); }
    last = performance.now(); if (!rafId) rafId = requestAnimationFrame(loop);
  }
  function hide() { ON = false; setBtn(); $$('map').classList.remove('v30on'); stage.style.display = 'none'; if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }
  window.v30Toggle = function () {
    if (BAD || LOADING) return;
    if (ON) return;
    buildC();
    if (READY) return show();
    LOADING = true; var b = $$('v30b'); if (b) b.classList.add('ld');
    loadScript('globe/three.min.js').then(function () { return loadScript('globe/data.js'); }).then(build).then(function () { LOADING = false; if (b) b.classList.remove('ld'); show(); })
      .catch(function (e) { LOADING = false; BAD = true; if (b) { b.classList.remove('ld'); b.style.display = 'none'; } try { toast(X('3B küre açılamadı; düz harita kullanılıyor', '3D globe unavailable; using flat map')); } catch (x) { } try { console.error(e); } catch (x) { } });
  };

  /* ---------- Mevcut işlevlere ince bağlantılar (2B davranış aynen korunur) ---------- */
  var _paint = paint; paint = function () { var r = _paint.apply(this, arguments); dirty(); return r; };
  var _overlay = overlay; overlay = function () { var r = _overlay.apply(this, arguments); dirty(); return r; };
  var _focusSel = focusSel; focusSel = function () { if (ON && G && G.sel && cMap[G.sel]) focusOn(cMap[G.sel], false); return _focusSel.apply(this, arguments); };
  var _fitBattle = fitBattle; fitBattle = function (tg) { if (ON && cMap[tg]) focusOn(cMap[tg], false); return _fitBattle.apply(this, arguments); };
  var _zoomBy = zoomBy; zoomBy = function (f) { if (ON) { zoomT = Math.max(1.5, Math.min(6, zoomT / Math.pow(f, .5))); return; } return _zoomBy.apply(this, arguments); };
  var _worldView = worldView; worldView = function () { var r = _worldView.apply(this, arguments); if (ON) { zoomT = 3.4; focusHome(false); zoomT = 3.4; } return r; };

  function addBtn() {
    var ctl = $$('ctl'), map = $$('map'); if (!ctl || !map || $$('v30b')) return;
    var b = document.createElement('button'); b.id = 'v30b'; b.type = 'button'; b.textContent = '3B'; b.title = X('3B küre', '3D globe'); b.setAttribute('onclick', 'void 0'); b.style.display = 'none'; ctl.appendChild(b);
    stage = document.createElement('div'); stage.id = 'g3d'; stage.style.display = 'none'; map.insertBefore(stage, map.firstChild);
    if (window.ResizeObserver) new ResizeObserver(function () { if (ON) resize(); }).observe(stage); else window.addEventListener('resize', function () { if (ON) resize(); });
    if (DEFAULT_3D) setTimeout(window.v30Toggle, 600);
  }
  if (document.readyState === 'complete') setTimeout(addBtn, 0); else window.addEventListener('load', function () { setTimeout(addBtn, 0); });
  try { var _ngI = window.newGame || newGame; newGame = function () { var r = _ngI.apply(this, arguments); try { if (ON && stage) doIntro(); else introNext = true; } catch (e) { } return r; }; } catch (e) { }
})();
