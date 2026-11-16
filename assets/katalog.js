/* Katalog toko — satu-satunya tempat menambah, mengubah, atau menyembunyikan produk di situs.
 *
 * Tiap produk:
 *   id        unik, huruf kecil-tanda hubung. Produk digital: SAMA PERSIS dengan kolom id di lembar Produk (Google Sheet).
 *   jenis     "digital"  -> dijual lewat Mayar, akses di area member
 *             "afiliasi" -> produk orang lain, tombol ke link afiliasi Bos (Shopee, TikTok Shop, dll.)
 *             "fisik"    -> barang dropship, dijual lewat produk fisik Mayar (ongkir & resi di Mayar)
 *   kategori  judul kelompok di beranda, mis. "Tryout CPNS", "Game", "Ebook & Template", "Barang"
 *   nama, ringkas (satu kalimat), harga (angka rupiah, 0 = gratis, kosongkan untuk afiliasi bila harga sering berubah)
 *   gambar    path di folder situs, mis. "assets/img/x.webp" (boleh kosong)
 *   beli      tautan Mayar (digital/fisik) atau link afiliasi. Kosong = tombol "Segera dibuka".
 *   halaman   (opsional) halaman detail produk di situs ini, mis. "cpns.html"
 *   platform  (afiliasi) "Shopee", "TikTok Shop", "Tokopedia", "Lazada", ...
 *   sembunyi  true = tidak tampil (mis. produk yang belum siap)
 *   bentuk    wujud 3D di etalase (showroom.js): "buku" | "tablet" | "laptop" | "monitor" | "konsol" | "hp" | "kotak" (bawaan)
 *   layar2    (opsional) gambar kedua, mis. layar HP yang berdiri di samping laptop
 */
window.KATALOG = [
  { id: "cpns-dasar", bentuk: "buku", jenis: "digital", kategori: "Untuk Pejuang CPNS", nama: "Tryout CPNS 2027 — Dasar",
    ringkas: "Ebook, 5 paket soal PDF (550 soal SKD format resmi + pembahasan), dan materi per tema.", harga: 59000,
    gambar: "assets/img/pdf-paket.webp", beli: "https://mzakom-digital.myr.id/pl/tryout-cpns-2027-dasar", halaman: "cpns.html" },
  { id: "cpns-video", bentuk: "tablet", jenis: "digital", kategori: "Untuk Pejuang CPNS", nama: "Tryout CPNS 2027 — Video",
    ringkas: "Semua isi Dasar, ditambah video course pembahasan per tema.", harga: 89000,
    gambar: "assets/img/video-dek.webp", beli: "https://mzakom-digital.myr.id/pl/tryout-cpns-2027-video", halaman: "cpns.html" },
  { id: "cpns-tryout", bentuk: "laptop", jenis: "digital", kategori: "Untuk Pejuang CPNS", nama: "Tryout CPNS 2027 — Tryout",
    ringkas: "Semua isi Video, ditambah tryout web berwaktu dengan skor otomatis.", harga: 139000,
    gambar: "assets/img/tryout-web.webp", beli: "https://mzakom-digital.myr.id/pl/tryout-cpns-2027-tryout", halaman: "cpns.html" },
  { id: "cpns-lengkap", bentuk: "konsol", jenis: "digital", kategori: "Untuk Pejuang CPNS", nama: "Tryout CPNS 2027 — Lengkap",
    ringkas: "Semua isi Tryout, ditambah empat game latihan yang dimainkan langsung di situs.", harga: 189000,
    gambar: "assets/img/game-tembak.webp", beli: "https://mzakom-digital.myr.id/pl/tryout-cpns-2027-lengkap", halaman: "cpns.html" },

  { id: "peta-capaian", bentuk: "monitor", jenis: "digital", kategori: "Untuk Guru", nama: "Peta Capaian Kelas",
    ringkas: "Administrasi guru dalam satu aplikasi: CP–TP otomatis, minggu efektif, Prota, Promes, modul ajar, nilai, absensi, dan rapor.", harga: 99000, gambar: "assets/img/peta-capaian.webp",
    beli: "", halaman: "#guru" },
  { id: "cbt-sekolah", bentuk: "laptop", layar2: "assets/img/cbt-hp-masuk.webp", jenis: "digital", kategori: "Untuk Guru", nama: "CBT Sekolah",
    ringkas: "Aplikasi ujian online dengan nama dan logo sekolah sendiri: PG + esai, kartu peserta, alarm keluar layar, nilai otomatis.", harga: 149000,
    gambar: "assets/img/cbt-beranda.webp", beli: "", halaman: "cbt-sekolah.html" },
  { id: "cbt-sekolah-pasang", jenis: "digital", kategori: "Untuk Guru", nama: "CBT Sekolah + Jasa Pasang", sembunyi: true,
    ringkas: "Template CBT Sekolah, dipasangkan sampai situs sekolah online.", harga: 399000, gambar: "", beli: "", halaman: "cbt-sekolah.html" },
  { id: "modul-informatika", jenis: "digital", kategori: "Untuk Guru", nama: "Modul Ajar Informatika", sembunyi: true,
    ringkas: "Modul ajar Kurikulum Merdeka siap pakai per fase, lengkap LKPD dan asesmen.", harga: 0, gambar: "", beli: "" },
  { id: "game-informatika", jenis: "digital", kategori: "Untuk Guru", nama: "Informatika Party", sembunyi: true,
    ringkas: "33 mode latihan Informatika SMP, dimainkan di browser.", harga: 0, gambar: "", beli: "" },
  { id: "mindsprint", jenis: "digital", kategori: "Untuk Pelajar", nama: "MindSprint AI", sembunyi: true,
    ringkas: "Ubah catatan pelajaran jadi game aksi.", harga: 0, gambar: "", beli: "" },

  /* Contoh — hapus tanda komentar dan isi bila produknya sudah siap:
  { id: "game-informatika", jenis: "digital", kategori: "Game", nama: "Informatika Party",
    ringkas: "33 mode latihan Informatika SMP, dimainkan di browser.", harga: 49000, gambar: "", beli: "https://mayar.link/..." },
  { id: "aff-botol-1l", jenis: "afiliasi", kategori: "Rekomendasi", platform: "Shopee", nama: "Botol minum 1 liter",
    ringkas: "Yang dipakai sendiri untuk mengajar seharian.", harga: 45000, gambar: "", beli: "https://s.shopee.co.id/..." },
  { id: "rak-buku-lipat", jenis: "fisik", kategori: "Barang", nama: "Rak buku lipat",
    ringkas: "Dikirim langsung dari gudang mitra.", harga: 120000, gambar: "", beli: "https://mayar.link/..." },
  */
];
