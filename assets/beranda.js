/* beranda.js — gerak khusus beranda, tanpa dependensi.
 *   <canvas data-balok="gundukan|pita">  balok isometrik lime/pink yang naik-turun pelan (pengganti foto)
 *   [data-panggung]                       kartu produk melayang, satu per satu maju ke depan + judul berganti
 *   .muncul                               naik pelan saat masuk layar
 * prefers-reduced-motion: semua digambar diam, judul panggung tidak berganti otomatis. */
(function () {
  const diam = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- balok isometrik ---------- */
  const WARNA = ["#d9f58a", "#c4ee7c", "#e9f8b4", "#a9e48c", "#f3bcd9", "#f8d6e8", "#dff2a6", "#b6ea96"];
  const gelap = (hex, f) => {
    const n = parseInt(hex.slice(1), 16);
    const k = (v) => Math.round(v * f);
    return "rgb(" + k(n >> 16) + "," + k((n >> 8) & 255) + "," + k(n & 255) + ")";
  };
  // angka acak yang sama tiap muat ulang, supaya bentuknya tidak berubah-ubah
  const acak = (i, j, s) => { const x = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453; return x - Math.floor(x); };

  function sel(mode) {
    const out = [];
    if (mode === "pita") {
      // pita berkelok: sumbu i memanjang, tengah j mengikuti gelombang sinus
      for (let i = 0; i < 64; i++) {
        const tengah = Math.round(Math.sin(i / 64 * Math.PI * 2.2) * 9);
        for (let d = -2; d <= 2; d++) out.push({ i, j: tengah + d, t: 0.35 + acak(i, d, 1) * 0.65 });
      }
    } else {
      // gundukan: makin ke tengah makin tinggi
      for (let i = -11; i <= 11; i++) for (let j = -11; j <= 11; j++) {
        const r = Math.hypot(i, j) / 11;
        if (r > 1 || acak(i, j, 2) < r * 0.55) continue;
        out.push({ i, j, t: (1 - r * r) * (0.45 + acak(i, j, 3) * 0.55) });
      }
    }
    for (const c of out) { c.w = WARNA[Math.floor(acak(c.i, c.j, 4) * WARNA.length)]; c.f = acak(c.i, c.j, 5) * 6.28; }
    return out.sort((a, b) => a.i + a.j - (b.i + b.j) || a.i - b.i); // urutan pelukis: belakang dulu
  }

  function balok(cv) {
    const mode = cv.dataset.balok, cells = sel(mode), ctx = cv.getContext("2d");
    let W = 0, H = 0, s = 0, ox = 0, oy = 0, jalan = false;
    const mulai = performance.now();
    const ukur = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2), r = cv.getBoundingClientRect();
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      let mi = Infinity, ma = -Infinity, mj = Infinity, mb = -Infinity;
      for (const c of cells) { const x = c.i - c.j, y = c.i + c.j; mi = Math.min(mi, x); ma = Math.max(ma, x); mj = Math.min(mj, y); mb = Math.max(mb, y); }
      s = Math.min(W / (ma - mi + 2), H / ((mb - mj) / 2 + (mode === "pita" ? 8 : 14))); // s = setengah lebar belah ketupat
      ox = W / 2 - (ma + mi) / 2 * s; oy = H - (mb / 2 + 1) * s;
    };
    const gambar = (now) => {
      const t = (now - mulai) / 1000, geser = mode === "pita" ? scrollY * 0.004 : 0;
      ctx.clearRect(0, 0, W, H);
      const tinggiMaks = (mode === "pita" ? 3.2 : 9) * s;
      for (const c of cells) {
        const gel = diam ? 1 : 0.82 + 0.18 * Math.sin(t * 0.9 + c.f + c.i * 0.18 + geser * 3);
        const h = Math.max(s * 0.3, c.t * tinggiMaks * gel);
        const x = ox + (c.i - c.j) * s, y = oy + (c.i + c.j) * s / 2;
        // sisi kiri, sisi kanan, lalu atap
        ctx.fillStyle = gelap(c.w, 0.86);
        ctx.beginPath(); ctx.moveTo(x - s, y - h); ctx.lineTo(x, y + s / 2 - h); ctx.lineTo(x, y + s / 2); ctx.lineTo(x - s, y); ctx.fill();
        ctx.fillStyle = gelap(c.w, 0.74);
        ctx.beginPath(); ctx.moveTo(x + s, y - h); ctx.lineTo(x, y + s / 2 - h); ctx.lineTo(x, y + s / 2); ctx.lineTo(x + s, y); ctx.fill();
        ctx.fillStyle = c.w;
        ctx.beginPath(); ctx.moveTo(x, y - s / 2 - h); ctx.lineTo(x + s, y - h); ctx.lineTo(x, y + s / 2 - h); ctx.lineTo(x - s, y - h); ctx.fill();
      }
      if (jalan) requestAnimationFrame(gambar);
    };
    ukur(); gambar(performance.now());
    new ResizeObserver(() => { ukur(); if (!jalan) gambar(performance.now()); }).observe(cv);
    if (diam) return;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !jalan) { jalan = true; requestAnimationFrame(gambar); } else if (!e.isIntersecting) jalan = false;
    }).observe(cv);
  }
  document.querySelectorAll("canvas[data-balok]").forEach(balok);

  /* ---------- panggung kartu melayang ---------- */
  document.querySelectorAll("[data-panggung]").forEach((p) => {
    const kartu = [...p.querySelectorAll(".layang")], judul = [...p.querySelectorAll(".panggung__teks")], bar = p.querySelector(".panggung__bar i");
    if (!kartu.length || !judul.length) return;
    let k = 0, pewaktu = 0;
    const tampil = (n) => {
      k = (n + judul.length) % judul.length;
      judul.forEach((el, i) => el.classList.toggle("is-aktif", i === k));
      const fokus = judul[k].dataset.kartu;
      kartu.forEach((el) => el.classList.toggle("is-fokus", el.dataset.kartu === fokus));
      if (bar) { bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; }
    };
    tampil(0);
    if (diam) return;
    const putar = () => { clearInterval(pewaktu); pewaktu = setInterval(() => tampil(k + 1), 4200); };
    new IntersectionObserver(([e]) => { if (e.isIntersecting) putar(); else clearInterval(pewaktu); }).observe(p);
    p.querySelectorAll("[data-ke]").forEach((b) => b.addEventListener("click", () => { tampil(k + Number(b.dataset.ke)); putar(); }));
  });

  /* ---------- muncul saat digulir ---------- */
  const muncul = document.querySelectorAll(".muncul");
  if (diam || !("IntersectionObserver" in window)) { muncul.forEach((el) => el.classList.add("is-tampak")); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-tampak"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  muncul.forEach((el) => io.observe(el));
})();
