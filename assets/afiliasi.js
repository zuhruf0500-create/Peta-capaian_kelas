/* afiliasi.js — tombol daftar afiliator memakai MZ.daftarAfiliasi dari assets/config.js. */
(function () {
  const a = document.getElementById("daftar-afiliasi"), url = (window.MZ || {}).daftarAfiliasi;
  if (!a) return;
  if (/^https:\/\//.test(url || "")) { a.href = url; a.target = "_blank"; a.rel = "noopener"; return; }
  a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); a.textContent = "Pendaftaran segera dibuka";
})();
