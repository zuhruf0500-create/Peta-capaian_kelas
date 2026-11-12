/* site.js — nav, tautan beli, bilah beli, dan simulasi soal di hero. Tanpa dependensi. */

/* Tautan beli per produk ada di assets/katalog.js (kolom beli). Kosong = tombol tampil "Segera dibuka". */
const BELI = Object.fromEntries((window.KATALOG || []).map((p) => [p.id, p.beli]));

(function nav() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  const root = document.documentElement;
  const tutup = () => { root.style.setProperty("--banner-h", "0px"); nav.classList.add("is-dismissed"); };
  try { if (localStorage.getItem("mz_banner") === "0") tutup(); } catch (e) {}
  document.getElementById("banner-x")?.addEventListener("click", () => {
    tutup();
    try { localStorage.setItem("mz_banner", "0"); } catch (e) {}
  });

  let lastY = scrollY, tunggu = false;
  addEventListener("scroll", () => {
    if (tunggu) return;
    tunggu = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      if (y < 48) nav.classList.remove("is-compact");
      else if (y > lastY + 4) nav.classList.add("is-compact");
      else if (y < lastY - 4) nav.classList.remove("is-compact");
      lastY = y; tunggu = false;
    });
  }, { passive: true });

  const toggle = document.getElementById("nav-toggle"), sheet = document.getElementById("nav-sheet");
  if (toggle && sheet) {
    const set = (buka) => { sheet.hidden = !buka; toggle.setAttribute("aria-expanded", String(buka)); toggle.textContent = buka ? "Tutup" : "Menu"; };
    toggle.addEventListener("click", () => set(sheet.hidden));
    sheet.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !sheet.hidden) { set(false); toggle.focus(); } });
  }
})();

(function beli() {
  document.querySelectorAll("[data-beli]").forEach((a) => {
    const url = BELI[a.dataset.beli];
    if (url) { a.href = url; return; }
    a.setAttribute("aria-disabled", "true");
    a.removeAttribute("href");
    a.textContent = "Segera dibuka";
  });
})();

(function buybar() {
  const bar = document.getElementById("buybar"), hero = document.querySelector(".hero"), harga = document.getElementById("harga");
  if (!bar || !hero || !harga || !("IntersectionObserver" in window)) return;
  const lihat = { hero: true, harga: false };
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { lihat[e.target === hero ? "hero" : "harga"] = e.isIntersecting; });
    bar.classList.toggle("is-on", !lihat.hero && !lihat.harga);
  });
  io.observe(hero); io.observe(harga);
})();

/* Simulasi: memutar 3 soal contoh seperti rekaman layar — timer jalan, opsi dipilih, kunci & pembahasan muncul. */
(function simulasi() {
  const root = document.querySelector("[data-sim]");
  if (!root || !window.CONTOH_SOAL) return;
  // id soal -> opsi yang "dipilih" di simulasi (soal kedua sengaja salah supaya pembahasan terlihat gunanya)
  const PILIH = { "TWK-121": "E", "TIU-9K-01": "B", "TKP-151": "A" };
  const adegan = Object.keys(PILIH).map((id) => window.CONTOH_SOAL.find((q) => q.id === id)).filter(Boolean);
  if (!adegan.length) return;
  const T_PILIH = 2600, T_KUNCI = 3900, T_AKHIR = 9500, WAKTU = 20;
  const diam = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s) => root.querySelector(s);
  const el = { tag: $(".stage__tag"), timer: $("[data-timer]"), skor: $("[data-skor]"), bar: $(".stage__bar i"),
               body: $(".stage__body"), jeda: $("[data-jeda]"), dots: [...root.querySelectorAll("[data-adegan]")] };
  let i = 0, skor = 0, timers = [], jedaUser = diam, terlihat = true;

  const stop = () => { timers.forEach(clearTimeout); timers = []; };
  const nanti = (ms, fn) => timers.push(setTimeout(fn, ms));
  const kalimatPertama = (s) => { const m = s.replace(/<[^>]+>/g, "").match(/^.*?[.!?](\s|$)/); return (m ? m[0] : s).trim(); };

  // Semua adegan dirender sekali dan ditumpuk di sel grid yang sama: tinggi layar = adegan tertinggi,
  // jadi tidak ada lompatan tata letak saat adegan berganti. Tanda & pembahasan sudah ada di DOM, hanya disembunyikan.
  const poinAdegan = (q) => q.jenis === "TKP" ? q.opsi.find((o) => o.h === PILIH[q.id]).skor : (PILIH[q.id] === q.kunci ? 5 : 0);
  function htmlAdegan(q) {
    const fig = q.opsi[0].teks.trim().startsWith("<svg"), pilih = PILIH[q.id], tkp = q.jenis === "TKP", poin = poinAdegan(q);
    const tanda = (o) => tkp ? "skor " + o.skor : o.h === q.kunci ? "✓" : o.h === pilih ? "✕" : "";
    const judul = tkp ? "Skor " + poin + " dari 5." : poin ? "Benar, +5." : "Belum tepat. Kuncinya " + q.kunci + ".";
    return '<div class="scene"><p class="stage__q">' + q.soal + "</p>" +
      (q.media ? '<div class="stage__media">' + q.media + "</div>" : "") +
      '<ol class="opts' + (fig ? " opts--fig" : "") + '">' +
      q.opsi.map((o) => '<li class="opt" data-h="' + o.h + '"><b>' + o.h + "</b>" + (fig ? o.teks : "<span>" + o.teks + "</span>") + '<i class="opt__mark">' + tanda(o) + "</i></li>").join("") +
      '</ol><p class="stage__verdict"><strong>' + judul + "</strong> " + kalimatPertama(q.pembahasan) + "</p></div>";
  }
  el.body.innerHTML = adegan.map(htmlAdegan).join("");
  const scenes = [...el.body.querySelectorAll(".scene")];
  const opt = (h) => scenes[i].querySelector('.opt[data-h="' + h + '"]');

  function kunci(q) {
    const pilih = PILIH[q.id];
    opt(pilih).classList.remove("is-picked");
    if (q.jenis !== "TKP" && pilih !== q.kunci) opt(pilih).classList.add("is-wrong");
    opt(q.kunci).classList.add("is-right");
    scenes[i].classList.add("is-revealed");
    return poinAdegan(q);
  }

  function waktu(dtk) { el.timer.textContent = "00:" + String(dtk).padStart(2, "0"); }

  function putar(n, langsungKunci) {
    stop();
    i = (n + adegan.length) % adegan.length;
    if (i === 0) skor = 0;
    const q = adegan[i];
    el.dots.forEach((d, k) => d.setAttribute("aria-pressed", String(k === i)));
    el.tag.textContent = q.jenis + " · " + q.tema;
    scenes.forEach((s, k) => {
      s.classList.toggle("is-on", k === i);
      s.classList.remove("is-revealed");
      s.querySelectorAll(".opt").forEach((o) => o.classList.remove("is-picked", "is-right", "is-wrong"));
    });
    el.skor.textContent = skor;
    el.bar.style.transition = "none"; el.bar.style.transform = "scaleX(1)";
    waktu(WAKTU);
    if (langsungKunci) { el.skor.textContent = skor + kunci(q); return; }
    void el.bar.offsetWidth; // paksa reflow supaya transisi bar mulai dari penuh
    el.bar.style.transition = "transform " + T_KUNCI + "ms linear";
    el.bar.style.transform = "scaleX(" + (1 - T_KUNCI / 1000 / WAKTU) + ")";
    for (let s = 1; s * 1000 < T_KUNCI; s++) nanti(s * 1000, () => waktu(WAKTU - s));
    nanti(T_PILIH, () => opt(PILIH[q.id]).classList.add("is-picked"));
    nanti(T_KUNCI, () => { skor += kunci(q); el.skor.textContent = skor; });
    nanti(T_AKHIR, () => putar(i + 1));
  }

  // ponytail: jeda menampilkan adegan dalam keadaan sudah terjawab; melanjutkan = mengulang adegan itu dari awal.
  const jalan = () => putar(i, jedaUser || !terlihat);
  el.jeda.addEventListener("click", () => {
    jedaUser = !jedaUser;
    el.jeda.textContent = jedaUser ? "Putar" : "Jeda";
    el.jeda.setAttribute("aria-pressed", String(jedaUser));
    jalan();
  });
  el.dots.forEach((d, k) => d.addEventListener("click", () => { i = k; jalan(); }));
  if (diam) { el.jeda.textContent = "Putar"; el.jeda.setAttribute("aria-pressed", "true"); }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting === terlihat) return;
      terlihat = e.isIntersecting;
      if (!jedaUser) jalan();
    }, { threshold: 0.15 }).observe(root);
  }
  jalan();
})();
