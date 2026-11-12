/* member.js — halaman Masuk, Area Member, dan pemutar tryout/game. Bicara ke apps-script/Code.gs lewat MZ.api. */
(function () {
  const MZ = window.MZ || {};
  const $ = (id) => document.getElementById(id);
  const halaman = document.body.dataset.halaman;
  const KUNCI_TOKEN = "mz_token";
  const token = () => { try { return localStorage.getItem(KUNCI_TOKEN) || ""; } catch (e) { return ""; } };
  const simpanToken = (t) => { try { t ? localStorage.setItem(KUNCI_TOKEN, t) : localStorage.removeItem(KUNCI_TOKEN); } catch (e) {} };

  /** Memanggil API. Melempar {galat, pesan} bila gagal; sesi berakhir -> kembali ke halaman Masuk. */
  async function api(aksi, data) {
    if (!MZ.api) throw { galat: "belum", pesan: "Area member belum dibuka." };
    let j;
    try {
      // tanpa header Content-Type: permintaan "sederhana", jadi browser tidak mengirim preflight yang ditolak Apps Script
      const r = await fetch(MZ.api, { method: "POST", body: JSON.stringify(Object.assign({ aksi: aksi, token: token() }, data)) });
      j = await r.json();
    } catch (e) {
      throw { galat: "jaringan", pesan: "Tidak bisa terhubung ke server. Periksa koneksi internet, lalu coba lagi." };
    }
    if (!j.ok) {
      if (j.galat === "sesi" && halaman !== "masuk") { simpanToken(""); location.replace("masuk.html"); }
      throw j;
    }
    return j;
  }

  function pesan(el, teks, nada) { el.textContent = teks || ""; if (nada) el.dataset.tone = nada; else delete el.dataset.tone; }
  function sibuk(btn, ya, label) {
    if (ya) { btn.dataset.label = btn.textContent; btn.textContent = label; btn.dataset.state = "loading"; btn.disabled = true; }
    else { btn.textContent = btn.dataset.label || btn.textContent; delete btn.dataset.state; btn.disabled = false; }
  }

  /* ------------------------------------------------------------ Masuk */
  if (halaman === "masuk") {
    const form = $("form-masuk"), msg = $("msg"), btn = $("btn-masuk");
    if (MZ.kontak) { $("lupa").hidden = false; $("lupa-tautan").href = MZ.kontak; }
    if (!MZ.api) {
      pesan(msg, "Area member belum dibuka. Akun dikirim setelah pembelian.");
      form.querySelectorAll("input, button").forEach((x) => { x.disabled = true; });
    } else if (token()) {
      location.replace("member.html");
    }
    $("lihat").addEventListener("change", (e) => { $("sandi").type = e.target.checked ? "text" : "password"; });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nama = $("nama").value.trim(), sandi = $("sandi").value;
      $("nama").setAttribute("aria-invalid", String(!nama)); $("sandi").setAttribute("aria-invalid", String(!sandi));
      if (!nama || !sandi) { pesan(msg, "Isi nama pengguna dan kata sandi.", "error"); return; }
      pesan(msg, ""); sibuk(btn, true, "Memeriksa…");
      try {
        const j = await api("masuk", { nama: nama, sandi: sandi });
        simpanToken(j.token);
        location.href = j.wajibGanti ? "member.html#sandi" : "member.html";
      } catch (err) {
        pesan(msg, err.pesan, "error"); sibuk(btn, false);
        if (err.galat === "masuk_gagal") { $("sandi").value = ""; $("sandi").focus(); }
      }
    });
  }

  /* ------------------------------------------------------------ Area member */
  if (halaman === "member") {
    if (!token()) { location.replace("masuk.html"); return; }
    const msg = $("msg");

    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const tombol = (x) => {
      if (!x.siap) return '<button class="btn btn--sm" disabled>Segera</button>';
      const label = x.jenis === "pdf" ? "Unduh" : x.jenis === "tautan" ? "Tonton" : "Buka";
      return '<button class="btn btn--sm" data-kunci="' + esc(x.kunci) + '" data-jenis="' + esc(x.jenis) + '">' + label + "</button>";
    };
    const item = (x) => '<div class="item"><h3>' + esc(x.judul) + "</h3><p>" + esc(x.keterangan) + "</p>" + tombol(x) + "</div>";

    api("saya").then((j) => {
      $("halo").textContent = "Halo, " + j.nama + ".";
      $("paket").textContent = j.produk.length ? j.produk.length + " produk" : "Belum ada produk";
      $("ganti-dulu").hidden = !j.wajibGanti;
      $("isi").innerHTML = j.produk.length
        ? j.produk.map((p) => '<h3 class="toko__kat">' + esc(p.nama) + '</h3><div class="items">' +
            (p.isi.length ? p.isi.map(item).join("") : '<p class="page__p">Isi produk ini sedang disiapkan.</p>') + "</div>").join("")
        : '<p class="page__p">Akun ini belum memiliki produk. <a href="./#produk">Lihat produk</a>.</p>';
      $("memuat").hidden = true; $("akun").hidden = false;
      if (location.hash === "#sandi") $("sandi").scrollIntoView();
    }).catch((err) => { pesan($("memuat"), err.pesan, "error"); $("memuat").className = "msg"; });

    $("isi").addEventListener("click", async (e) => {
      const b = e.target.closest("button[data-kunci]");
      if (!b) return;
      if (b.dataset.jenis === "html") { location.href = "buka.html?k=" + encodeURIComponent(b.dataset.kunci); return; }
      pesan(msg, ""); sibuk(b, true, "Menyiapkan…");
      try {
        const j = await api("ambil", { kunci: b.dataset.kunci });
        if (j.jenis === "tautan") { location.href = j.url; return; }
        const biner = atob(j.base64), bait = new Uint8Array(biner.length);
        for (let i = 0; i < biner.length; i++) bait[i] = biner.charCodeAt(i);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([bait], { type: j.mime }));
        a.download = j.nama;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      } catch (err) { pesan(msg, err.pesan, "error"); msg.scrollIntoView({ block: "center" }); }
      sibuk(b, false);
    });

    $("form-sandi").addEventListener("submit", async (e) => {
      e.preventDefault();
      const lama = $("lama").value, baru = $("baru").value, ulang = $("ulang").value, m = $("msg-sandi"), btn = $("btn-sandi");
      const salah = !lama ? "Isi kata sandi lama." : baru.length < 8 ? "Kata sandi baru minimal 8 karakter." : baru !== ulang ? "Ulangi kata sandi baru dengan sama persis." : "";
      $("baru").setAttribute("aria-invalid", String(!!salah && !!lama));
      if (salah) { pesan(m, salah, "error"); return; }
      pesan(m, ""); sibuk(btn, true, "Menyimpan…");
      try {
        await api("gantiSandi", { lama: lama, baru: baru });
        e.target.reset(); $("ganti-dulu").hidden = true;
        pesan(m, "Kata sandi diganti. Perangkat lain yang memakai akun ini sudah dikeluarkan.", "ok");
      } catch (err) { pesan(m, err.pesan, "error"); }
      sibuk(btn, false);
    });

    $("btn-keluar").addEventListener("click", async () => {
      try { await api("keluar"); } catch (e) {}
      simpanToken(""); location.href = "masuk.html";
    });
  }

  /* ------------------------------------------------------------ Pemutar tryout / game */
  if (halaman === "buka") {
    if (!token()) { location.replace("masuk.html"); return; }
    const kunci = new URLSearchParams(location.search).get("k") || "";
    // tautan antar-game di dalam berkas game -> kunci isi di area member (hub lama = area member)
    const PETA = { "index.html": "game-tembak", "ruang-nalar.html": "game-ruang", "fold-kubus.html": "game-kubus", "kuis-milyarder.html": "game-kuis", "hub.html": "" };
    const bingkai = $("bingkai"), status = $("status");
    api("ambil", { kunci: kunci }).then((j) => {
      if (j.jenis !== "html") throw { pesan: "Isi ini bukan halaman yang bisa dibuka di sini." };
      // game merujuk gambar & suara secara relatif -> arahkan ke folder aset publik; tautan antar-game ditangkap
      // oleh skrip kecil di dalam bingkai (dipasang sebelum isi lain, jadi tidak ada jeda tanpa penangkap)
      const penangkap = "<script>document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');" +
        "var p=" + JSON.stringify(PETA) + ";if(!a)return;var k=a.getAttribute('href');if(!(k in p))return;e.preventDefault();" +
        "top.location.href=" + JSON.stringify(new URL(".", location.href).href) + "+(p[k]?'buka.html?k='+p[k]:'member.html');},true);<\/script>";
      // aset = folder aset publik berkas ini (kolom aset di lembar Berkas); game CPNS juga butuh penangkap tautan antar-game
      const aset = /^[\w-]+\/$/.test(j.aset || "") ? '<base href="' + j.aset + '">' : "";
      const html = aset ? j.html.replace(/<head>/i, "<head>" + aset + (j.aset === "game/" ? penangkap : "")) : j.html;
      bingkai.srcdoc = html;
      status.hidden = true; bingkai.hidden = false;
    }).catch((err) => { status.className = "msg"; pesan(status, err.pesan, "error"); });
  }
})();
