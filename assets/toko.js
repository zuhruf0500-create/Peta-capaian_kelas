/* toko.js — menampilkan produk dari assets/katalog.js ke elemen [data-toko].
 *   data-toko="digital|afiliasi|fisik"  jenis produk yang ditampilkan
 *   data-kelompok                        beri subjudul per kategori
 *   data-batas="4"                       tampilkan paling banyak N produk
 * Bagian pembungkus [data-bagian] disembunyikan bila rak di dalamnya kosong. */
(function () {
  const KATALOG = (window.KATALOG || []).filter((p) => !p.sembunyi);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rupiah = (n) => (n === 0 ? "Gratis" : typeof n === "number" ? "Rp" + n.toLocaleString("id-ID") : "");
  const amanUrl = (u) => (/^(https?:\/\/|[\w./-]+(\.html)?(#[\w-]*)?$)/i.test(u || "") ? u : ""); // tolak javascript: dsb.

  function tombol(p) {
    const url = amanUrl(p.beli);
    if (!url) return '<a class="btn btn--sm" aria-disabled="true">Segera dibuka</a>';
    if (p.jenis === "afiliasi")
      return '<a class="btn btn--sm" href="' + esc(url) + '" target="_blank" rel="sponsored nofollow noopener">Lihat di ' + esc(p.platform || "toko") + " ↗</a>";
    return '<a class="btn btn--sm" href="' + esc(url) + '">' + (p.harga === 0 ? "Ambil" : "Beli") + "</a>";
  }

  function kartu(p) {
    const detail = amanUrl(p.halaman);
    const judul = detail ? '<a href="' + esc(detail) + '">' + esc(p.nama) + "</a>" : esc(p.nama);
    // Produk digital tampil sebagai kartu bergradasi tanpa foto; foto hanya untuk barang afiliasi/fisik.
    const gambar = p.gambar && p.jenis !== "digital" ? '<span class="kartu__gambar"><img src="' + esc(p.gambar) + '" alt="" loading="lazy" decoding="async"></span>' : "";
    const label = [p.kategori, p.jenis === "afiliasi" ? p.platform : p.jenis === "fisik" ? "Dikirim ke alamatmu" : ""].filter(Boolean).join(" · ");
    return '<article class="kartu">' + gambar +
      '<div class="kartu__atas"><p class="kartu__label">' + esc(label) + "</p><h3>" + judul + '</h3></div><p class="kartu__isi">' + esc(p.ringkas) + "</p>" +
      '<div class="kartu__kaki">' + tombol(p) + '<span class="kartu__harga">' + esc(rupiah(p.harga)) + "</span>" +
      (detail ? '<a class="tlink" href="' + esc(detail) + '">Detail →</a>' : "") + "</div></article>";
  }

  window.TOKO = { esc, rupiah, amanUrl, tombol }; // dipakai showroom.js

  document.querySelectorAll("[data-toko]").forEach((el) => {
    let daftar = KATALOG.filter((p) => p.jenis === el.dataset.toko);
    if (el.dataset.batas) daftar = daftar.slice(0, Number(el.dataset.batas));
    const bagian = el.closest("[data-bagian]");
    if (!daftar.length) {
      if (bagian) bagian.hidden = true;
      else el.innerHTML = '<p class="toko__kosong">Belum ada produk di sini. Mampir lagi nanti.</p>';
      return;
    }
    if (!("kelompok" in el.dataset)) { el.innerHTML = '<div class="rak">' + daftar.map(kartu).join("") + "</div>"; return; }
    const kat = [...new Set(daftar.map((p) => p.kategori || "Lainnya"))];
    el.innerHTML = kat.map((k) => '<h3 class="toko__kat">' + esc(k) + '</h3><div class="rak">' +
      daftar.filter((p) => (p.kategori || "Lainnya") === k).map(kartu).join("") + "</div>").join("");
  });
})();
