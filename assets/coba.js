/* coba.js — mini tryout 10 soal contoh (gratis, tanpa akun). Semua berjalan di browser. */
(function () {
  const SOAL = window.CONTOH_SOAL || [];
  const $ = (id) => document.getElementById(id);
  const layar = { mulai: $("layar-mulai"), kuis: $("layar-kuis"), hasil: $("layar-hasil") };
  if (!SOAL.length || !layar.kuis) return;
  const MENIT = 10, POIN_MAKS = 5;
  let idx = 0, jawab = {}, sisa = MENIT * 60, detak = null;

  const tampil = (nama) => { for (const k in layar) layar[k].hidden = k !== nama; scrollTo(0, 0); };
  const mmss = (d) => String(Math.floor(d / 60)).padStart(2, "0") + ":" + String(d % 60).padStart(2, "0");

  /* Skor: TWK & TIU 5 poin per jawaban benar, TKP 1–5 sesuai opsi yang dipilih (0 bila kosong). */
  function nilai(q, h) {
    if (!h) return 0;
    return q.jenis === "TKP" ? q.opsi.find((o) => o.h === h).skor : (h === q.kunci ? POIN_MAKS : 0);
  }

  // teks soal/opsi sudah di-escape oleh tools/buat_contoh.py (atau SVG/HTML dari bank), jadi aman lewat innerHTML
  function gambarSoal() {
    const q = SOAL[idx];
    $("q-chip").textContent = q.jenis + " · " + q.tema;
    $("q-no").textContent = "Soal " + (idx + 1) + " dari " + SOAL.length;
    $("q-teks").innerHTML = q.soal;
    $("q-media").innerHTML = q.media || "";
    $("q-opsi").innerHTML = "<legend>Pilihan jawaban soal " + (idx + 1) + "</legend>" + q.opsi.map((o) =>
      '<label class="pick"><input type="radio" name="opsi" value="' + o.h + '"' + (jawab[q.id] === o.h ? " checked" : "") +
      "><span><b>" + o.h + ".</b> " + o.teks + "</span></label>").join("");
    $("btn-prev").disabled = idx === 0;
    $("btn-next").textContent = idx === SOAL.length - 1 ? "Lihat skor" : "Berikutnya";
  }

  function mulai() {
    idx = 0; jawab = {}; sisa = MENIT * 60;
    $("timer").textContent = mmss(sisa);
    clearInterval(detak);
    detak = setInterval(() => {
      sisa--; $("timer").textContent = mmss(Math.max(sisa, 0));
      if (sisa <= 0) selesai();
    }, 1000);
    gambarSoal(); tampil("kuis");
  }

  function selesai() {
    clearInterval(detak);
    const total = { TWK: [0, 0], TIU: [0, 0], TKP: [0, 0] };
    SOAL.forEach((q) => { total[q.jenis][0] += nilai(q, jawab[q.id]); total[q.jenis][1] += POIN_MAKS; });
    $("skor").innerHTML = ["TWK", "TIU", "TKP"].map((j) =>
      "<div><b>" + total[j][0] + "</b><span>" + j + ", dari " + total[j][1] + "</span></div>").join("");
    const terjawab = SOAL.filter((q) => jawab[q.id]).length;
    $("ringkas").textContent = terjawab + " dari " + SOAL.length + " soal terjawab dalam " + mmss(MENIT * 60 - Math.max(sisa, 0)) + ".";
    $("ulasan").innerHTML = SOAL.map((q, n) => {
      const h = jawab[q.id];
      const baris = q.opsi.map((o) => {
        const benar = o.h === q.kunci, pilih = o.h === h;
        const tanda = q.jenis === "TKP" ? "skor " + o.skor + (pilih ? " · pilihanmu" : "")
          : benar ? "kunci" + (pilih ? " · pilihanmu" : "") : pilih ? "pilihanmu" : "";
        return '<div class="pick' + (benar ? " is-right" : pilih ? " is-wrong" : "") + '"><b>' + o.h + ".</b><span>" + o.teks +
          '</span><span class="pick__mark">' + tanda + "</span></div>";
      }).join("");
      return '<article class="panel"><div class="quiz__top"><span class="chip">' + q.jenis + " · " + q.tema + "</span><span>Soal " + (n + 1) +
        (h ? "" : " · tidak dijawab") + '</span></div><p class="quiz__q">' + q.soal + '</p><div class="quiz__media">' + (q.media || "") +
        '</div><div class="quiz"><fieldset>' + baris + '</fieldset></div><p class="explain"><b>Pembahasan.</b> ' + q.pembahasan + "</p></article>";
    }).join("");
    tampil("hasil");
  }

  $("btn-mulai").addEventListener("click", mulai);
  $("btn-ulang").addEventListener("click", mulai);
  $("q-opsi").addEventListener("change", (e) => { jawab[SOAL[idx].id] = e.target.value; });
  $("btn-prev").addEventListener("click", () => { if (idx > 0) { idx--; gambarSoal(); } });
  $("btn-next").addEventListener("click", () => { if (idx < SOAL.length - 1) { idx++; gambarSoal(); } else selesai(); });

  // uji cepat logika skor: buka coba-gratis.html#uji lalu lihat konsol
  if (location.hash === "#uji") {
    const twk = SOAL.find((q) => q.jenis === "TWK"), tkp = SOAL.find((q) => q.jenis === "TKP");
    console.assert(nilai(twk, twk.kunci) === 5 && nilai(twk, twk.kunci === "A" ? "B" : "A") === 0 && nilai(twk, undefined) === 0, "skor TWK");
    console.assert(nilai(tkp, tkp.kunci) === 5 && tkp.opsi.every((o) => nilai(tkp, o.h) === o.skor), "skor TKP");
    console.log("uji skor selesai");
  }
})();
