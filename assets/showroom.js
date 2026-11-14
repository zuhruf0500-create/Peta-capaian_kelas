/* showroom.js — etalase 3D (Three.js) untuk produk di assets/katalog.js.
 * Ruang pamer gelap: plafon lampu segi enam, lantai mengilap bernomor, tiap produk berdiri di podium
 * dalam wujud 3D sesuai field `bentuk`. Geser (panah, seret, keyboard), klik produk = lihat dekat.
 * Gagal memuat (WebGL/CDN) → etalase tetap tersembunyi dan daftar kartu biasa (toko.js) yang tampil. */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Reflector } from "three/addons/objects/Reflector.js";

const akar = document.querySelector("[data-showroom]");
const daftarEl = document.querySelector("[data-daftar-produk]");
const produk = (window.KATALOG || []).filter((p) => !p.sembunyi && p.jenis !== "afiliasi");
const T = window.TOKO;

if (akar && T && produk.length) {
  if (document.fonts) await document.fonts.ready; // teks di tekstur kanvas memakai font situs
  try { mulai(); } catch (e) { console.warn("Etalase 3D dimatikan:", e); }
}

function mulai() {
  const kanvas = akar.querySelector("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas: kanvas, antialias: true, powerPreference: "high-performance" });
  const hp = matchMedia("(max-width: 700px)").matches;
  const tenang = matchMedia("(prefers-reduced-motion: reduce)").matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, hp ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050506);
  scene.fog = new THREE.Fog(0x050506, 9, 22);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  const JARAK = 3.4; // jarak antarproduk
  const n = produk.length;
  const lebar = (n - 1) * JARAK;
  let perluRender = true;

  /* ---------- ruang ---------- */
  scene.add(new THREE.HemisphereLight(0x8890a0, 0x050505, 0.35));

  // lantai: cermin di bawah + lapisan gelap tembus pandang agar pantulannya samar (HP: tanpa cermin)
  const lantaiW = lebar + 24, lantaiD = 16;
  if (!hp) {
    const pr = renderer.getPixelRatio();
    const cermin = new Reflector(new THREE.PlaneGeometry(lantaiW, lantaiD), {
      textureWidth: Math.min(innerWidth, 1400) * pr, textureHeight: 560 * pr, color: 0x777777,
    });
    cermin.rotation.x = -Math.PI / 2;
    cermin.position.set(lebar / 2, -0.002, -2);
    scene.add(cermin);
  }
  const lapis = new THREE.Mesh(new THREE.PlaneGeometry(lantaiW, lantaiD),
    new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.55, metalness: 0.2, transparent: !hp, opacity: hp ? 1 : 0.82 }));
  lapis.rotation.x = -Math.PI / 2;
  lapis.position.set(lebar / 2, 0, -2);
  scene.add(lapis);

  // dinding belakang + bilah lampu vertikal di antara produk
  const dinding = new THREE.Mesh(new THREE.PlaneGeometry(lantaiW, 9), new THREE.MeshStandardMaterial({ color: 0x0e0e11, roughness: 0.9 }));
  dinding.position.set(lebar / 2, 4.5, -4.2);
  scene.add(dinding);
  const bilahMat = new THREE.MeshBasicMaterial({ color: 0xdfe3ea });
  for (let i = -1; i <= n; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.6, 0.02), bilahMat);
    b.position.set(i * JARAK + JARAK / 2, 2.1, -4.18);
    scene.add(b);
  }

  // plafon: lampu tabung segi enam (InstancedMesh, sisi kembar dibuang)
  {
    const r = 0.95, celah = 0.86, sisi = [], kunci = new Set();
    for (let q = -4; q * 1.5 * r < lebar + 6; q++) {
      for (let k = -6; k < 4; k++) {
        const cx = q * 1.5 * r, cz = k * Math.sqrt(3) * r + (q & 1 ? (Math.sqrt(3) / 2) * r : 0);
        for (let s = 0; s < 6; s++) {
          const a1 = (Math.PI / 3) * s, a2 = a1 + Math.PI / 3;
          const mx = cx + (r * (Math.cos(a1) + Math.cos(a2))) / 2, mz = cz + (r * (Math.sin(a1) + Math.sin(a2))) / 2;
          const id = Math.round(mx * 20) + ":" + Math.round(mz * 20);
          if (kunci.has(id)) continue;
          kunci.add(id);
          sisi.push([mx, mz, (a1 + a2) / 2 + Math.PI / 2]);
        }
      }
    }
    const tabung = new THREE.InstancedMesh(new THREE.BoxGeometry(r * celah, 0.035, 0.05), new THREE.MeshBasicMaterial({ color: 0xffffff }), sisi.length);
    const m = new THREE.Object3D();
    sisi.forEach(([x, z, rot], i) => { m.position.set(x, 4.3, z); m.rotation.set(0, -rot, 0); m.updateMatrix(); tabung.setMatrixAt(i, m.matrix); });
    scene.add(tabung);
  }

  // garis parkir + nomor di lantai
  const garisMat = new THREE.MeshBasicMaterial({ color: 0x9a9ca3 });
  for (let i = 0; i <= n; i++) {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 3.4), garisMat);
    g.rotation.x = -Math.PI / 2;
    g.position.set(i * JARAK - JARAK / 2, 0.003, -0.6);
    scene.add(g);
  }
  const depanG = new THREE.Mesh(new THREE.PlaneGeometry(lebar + JARAK, 0.04), garisMat);
  depanG.rotation.x = -Math.PI / 2;
  depanG.position.set(lebar / 2, 0.003, 1.1);
  scene.add(depanG);

  /* ---------- bahan bersama ---------- */
  const loader = new THREE.TextureLoader();
  const tekstur = (url) => {
    const t = loader.load(url, () => (perluRender = true));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  const kanvasTekstur = (w, h, gambar) => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    gambar(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  const logam = (warna, kasar = 0.35) => new THREE.MeshStandardMaterial({ color: warna, roughness: kasar, metalness: 0.6 });
  const plastik = (warna, kasar = 0.45) => new THREE.MeshStandardMaterial({ color: warna, roughness: kasar, metalness: 0.05 });
  const layarMat = (map) => new THREE.MeshBasicMaterial({ map, toneMapped: false });
  const kotakBulat = (w, h, d, rad = 0.03) => new RoundedBoxGeometry(w, h, d, 3, rad);
  const LIME = 0xd7f26b, LAVENDER = 0xe9c6d6, TINTA = 0x1d1e1b;

  const nomorTekstur = (i) => kanvasTekstur(256, 128, (x, w, h) => {
    x.fillStyle = "#c9cbd1";
    x.font = "500 92px 'IBM Plex Mono', monospace";
    x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(String(i + 1).padStart(2, "0"), w / 2, h / 2);
  });

  function layarDasbor() { // Peta Capaian belum punya tangkapan layar: gambar dasbor capaian sederhana
    return kanvasTekstur(1024, 620, (x, w, h) => {
      x.fillStyle = "#f6f8f1"; x.fillRect(0, 0, w, h);
      x.fillStyle = "#1d1e1b"; x.font = "600 44px 'Inter Tight', sans-serif"; x.fillText("Peta Capaian Kelas 8B", 48, 82);
      x.fillStyle = "#6b6e66"; x.font = "400 26px 'Inter Tight', sans-serif"; x.fillText("Rata-rata per tujuan pembelajaran", 48, 124);
      [82, 64, 91, 47, 73, 88, 58].forEach((v, i) => {
        const bw = 90, bx = 60 + i * 130, bh = v * 3.6;
        x.fillStyle = v < 60 ? "#f08a8a" : v < 75 ? "#f2d36b" : "#b9e05a";
        x.fillRect(bx, h - 70 - bh, bw, bh);
        x.fillStyle = "#1d1e1b"; x.font = "500 24px 'IBM Plex Mono', monospace"; x.fillText(String(v), bx + 24, h - 82 - bh);
        x.fillStyle = "#6b6e66"; x.fillText("TP" + (i + 1), bx + 22, h - 30);
      });
    });
  }

  function sampulBuku(p) { // sampul: blok warna + judul serif + halaman isi (gambar produk) miring di bawah
    const t = kanvasTekstur(520, 720, (x, w, h) => {
      x.fillStyle = "#1f2b45"; x.fillRect(0, 0, w, h);
      x.fillStyle = "#d7f26b"; x.fillRect(0, 0, 16, h);
      const [judul, sub] = String(p.nama).split(/\s+[—-]\s+/);
      x.fillStyle = "#d7f26b"; x.font = "500 26px 'Inter Tight', sans-serif"; x.fillText((p.kategori || "").toUpperCase(), 52, 78);
      x.fillStyle = "#f4f5ee"; x.font = "300 64px 'Source Serif 4', serif";
      judul.split(" ").reduce((baris, kata) => { const c = baris.at(-1); (c + " " + kata).length > 12 ? baris.push(kata) : (baris[baris.length - 1] = (c + " " + kata).trim()); return baris; }, [""])
        .forEach((b, i) => x.fillText(b, 52, 160 + i * 70));
      if (sub) { x.fillStyle = "#e9c6d6"; x.font = "italic 300 48px 'Source Serif 4', serif"; x.fillText(sub, 52, 380); }
    });
    const img = new Image();
    img.onload = () => {
      const x = t.image.getContext("2d");
      x.save(); x.translate(300, 440); x.rotate(-0.08);
      x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(10, 12, 240, 310);
      x.drawImage(img, 0, 0, 240, 310); x.restore();
      t.needsUpdate = true; perluRender = true;
    };
    img.src = p.gambar;
    return t;
  }

  /* ---------- wujud 3D tiap bentuk (tinggi ±1, alas di y=0) ---------- */
  const BENTUK = {
    buku(p) {
      const g = new THREE.Group();
      const halaman = kanvasTekstur(64, 256, (x, w, h) => {
        x.fillStyle = "#efe9da"; x.fillRect(0, 0, w, h);
        for (let i = 0; i < w; i += 2) { x.fillStyle = i % 4 ? "#e3dccb" : "#f6f1e4"; x.fillRect(i, 0, 1, h); }
      });
      const kertas = plastik(0xffffff, 0.8); kertas.map = halaman;
      const sampul = new THREE.MeshStandardMaterial({ map: sampulBuku(p), roughness: 0.4 });
      const punggung = plastik(0x23324a, 0.5);
      // urutan sisi BoxGeometry: +x, -x, +y, -y, +z (depan), -z
      const buku = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.08, 0.16), [kertas, punggung, kertas, kertas, sampul, punggung]);
      buku.position.y = 0.54; buku.rotation.x = -0.08;
      const hijau = plastik(LIME);
      const buku2 = new THREE.Mesh(new THREE.BoxGeometry(0.74, 1.02, 0.12), [kertas, hijau, kertas, kertas, hijau, hijau]);
      buku2.position.set(0.32, 0.06, -0.3); buku2.rotation.set(-Math.PI / 2, 0, 0.35);
      g.add(buku, buku2);
      return g;
    },
    tablet(p) {
      const g = new THREE.Group();
      const badan = new THREE.Mesh(kotakBulat(1.3, 0.82, 0.05, 0.024), logam(0x2b2d33));
      const layar = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 0.74), layarMat(tekstur(p.gambar)));
      layar.position.z = 0.0255;
      badan.add(layar);
      badan.position.set(0, 0.62, 0); badan.rotation.x = -0.22;
      const kaki = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.03), logam(0xb9bcc4, 0.3));
      kaki.position.set(0, 0.25, -0.2); kaki.rotation.x = 0.45;
      g.add(badan, kaki);
      return g;
    },
    laptop(p) {
      const g = new THREE.Group();
      const alu = logam(0xc4c7ce, 0.3);
      const alas = new THREE.Mesh(kotakBulat(1.5, 0.05, 1.0, 0.02), alu);
      alas.position.y = 0.025;
      const papan = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.5), plastik(0x2a2c31, 0.7));
      papan.rotation.x = -Math.PI / 2; papan.position.set(0, 0.051, -0.1);
      const engsel = new THREE.Group();
      engsel.position.set(0, 0.05, -0.48); engsel.rotation.x = -0.28;
      const tutup = new THREE.Mesh(kotakBulat(1.5, 0.96, 0.035, 0.016), alu);
      tutup.position.y = 0.48;
      const layar = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.84), layarMat(tekstur(p.gambar)));
      layar.position.set(0, 0.49, 0.018);
      engsel.add(tutup, layar);
      g.add(alas, papan, engsel);
      if (p.layar2) { // mis. CBT: HP siswa berdiri di samping laptop guru
        const ponsel = BENTUK.hp({ gambar: p.layar2 });
        ponsel.scale.setScalar(0.62); ponsel.position.set(0.95, 0, 0.25); ponsel.rotation.y = -0.4;
        g.add(ponsel); g.position.x = -0.25;
      }
      return g;
    },
    monitor(p) {
      const g = new THREE.Group();
      const layar = new THREE.Mesh(kotakBulat(1.6, 0.98, 0.05, 0.02), plastik(0x18191c, 0.4));
      const kaca = new THREE.Mesh(new THREE.PlaneGeometry(1.52, 0.9), layarMat(p.gambar ? tekstur(p.gambar) : layarDasbor()));
      kaca.position.z = 0.026;
      layar.add(kaca);
      layar.position.y = 0.95;
      const leher = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.06), logam(0xb9bcc4));
      leher.position.set(0, 0.3, -0.06);
      const kaki = new THREE.Mesh(kotakBulat(0.6, 0.03, 0.36, 0.012), logam(0xb9bcc4));
      kaki.position.y = 0.015;
      g.add(layar, leher, kaki);
      return g;
    },
    konsol(p) {
      const g = new THREE.Group();
      const badan = new THREE.Mesh(kotakBulat(1.45, 0.78, 0.14, 0.06), plastik(LAVENDER, 0.5));
      const bingkai = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.54), plastik(TINTA, 0.6));
      bingkai.position.z = 0.0703;
      const layar = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.46), layarMat(tekstur(p.gambar)));
      layar.position.z = 0.0706;
      badan.add(bingkai, layar);
      const tombolMat = plastik(TINTA, 0.35);
      [[0.16, 0.05], [0.05, 0.16]].forEach(([w, h]) => { const d = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), tombolMat); d.position.set(-0.52, 0.02, 0.08); badan.add(d); });
      [[0.5, 0.07, LIME], [0.6, -0.04, 0xf2a3b8]].forEach(([x, y, c]) => {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 24), plastik(c, 0.3));
        b.rotation.x = Math.PI / 2; b.position.set(x, y, 0.08); badan.add(b);
      });
      badan.position.y = 0.5; badan.rotation.x = -0.2;
      g.add(badan);
      return g;
    },
    hp(p) {
      const g = new THREE.Group();
      const badan = new THREE.Mesh(kotakBulat(0.52, 1.08, 0.06, 0.028), logam(0x1e1f23, 0.25));
      const layar = new THREE.Mesh(new THREE.PlaneGeometry(0.47, 1.0), layarMat(tekstur(p.gambar)));
      layar.position.z = 0.031;
      badan.add(layar);
      badan.position.y = 0.56; badan.rotation.x = -0.12;
      g.add(badan);
      return g;
    },
    kotak(p) { // bawaan: kotak kemasan bergambar (cocok untuk barang fisik)
      const g = new THREE.Group();
      const sisi = plastik(LIME, 0.6);
      const depan = p.gambar ? new THREE.MeshStandardMaterial({ map: tekstur(p.gambar), roughness: 0.5 }) : sisi;
      const k = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.5), [sisi, sisi, sisi, sisi, depan, sisi]);
      k.position.y = 0.45;
      g.add(k);
      return g;
    },
  };

  /* ---------- tata letak: podium + produk + lampu sorot ---------- */
  const podiumMat = logam(0x1a1b1f, 0.3);
  const cincinMat = new THREE.MeshBasicMaterial({ color: LIME, toneMapped: false });
  const bayangan = kanvasTekstur(128, 128, (x, w) => {
    const gr = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    gr.addColorStop(0, "rgba(0,0,0,.75)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = gr; x.fillRect(0, 0, w, w);
  });
  const slot = produk.map((p, i) => {
    const x = i * JARAK;
    const podium = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.05, 0.14, 64), podiumMat);
    podium.position.set(x, 0.07, 0);
    const cincin = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.012, 8, 96), cincinMat);
    cincin.rotation.x = Math.PI / 2; cincin.position.set(x, 0.142, 0);
    const nomor = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshBasicMaterial({ map: nomorTekstur(i), transparent: true }));
    nomor.rotation.x = -Math.PI / 2; nomor.position.set(x, 0.004, 1.55);
    scene.add(podium, cincin, nomor);

    const putar = new THREE.Group();
    putar.position.set(x, 0.14, 0);
    const bayang = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ map: bayangan, transparent: true, depthWrite: false }));
    bayang.rotation.x = -Math.PI / 2; bayang.position.y = 0.002;
    const benda = (BENTUK[p.bentuk] || BENTUK.kotak)(p);
    benda.scale.setScalar(1.55);
    putar.add(benda, bayang);
    putar.traverse((o) => (o.userData.slot = i));
    scene.add(putar);

    const sorot = new THREE.SpotLight(0xfff4e6, 28, 9, 0.42, 0.55, 1.6);
    sorot.position.set(x, 4.2, 1.4);
    sorot.target.position.set(x, 0.4, 0);
    scene.add(sorot, sorot.target);
    return { putar, cincin, x };
  });

  /* ---------- panel info + navigasi ---------- */
  const info = akar.querySelector("[data-info]");
  const hitung = akar.querySelector("[data-hitung]");
  let pilih = 0, dekat = false;

  function tampilInfo() {
    const p = produk[pilih];
    const detail = T.amanUrl(p.halaman);
    info.innerHTML =
      '<p class="showroom__label">' + T.esc(p.kategori || "") + "</p>" +
      "<h3>" + T.esc(p.nama) + "</h3>" +
      "<p>" + T.esc(p.ringkas) + "</p>" +
      '<div class="showroom__kaki"><span class="showroom__harga">' + T.esc(T.rupiah(p.harga)) + "</span>" + T.tombol(p) +
      (detail ? '<a class="btn btn--sm btn--ghost" href="' + T.esc(detail) + '">Detail</a>' : "") + "</div>";
    hitung.textContent = String(pilih + 1).padStart(2, "0") + " / " + String(n).padStart(2, "0");
    slot.forEach((s, i) => (s.cincin.visible = i === pilih));
    perluRender = true;
  }
  const ke = (i) => { pilih = (i + n) % n; dekat = false; tampilInfo(); };
  const dekatkan = (v) => { dekat = v; perluRender = true; };
  akar.querySelectorAll("[data-ke]").forEach((b) => b.addEventListener("click", () => ke(pilih + Number(b.dataset.ke))));
  kanvas.addEventListener("keydown", (e) => {
    const aksi = { ArrowRight: () => ke(pilih + 1), ArrowLeft: () => ke(pilih - 1), Enter: () => dekatkan(!dekat), " ": () => dekatkan(!dekat), Escape: () => dekatkan(false) }[e.key];
    if (aksi) { aksi(); e.preventDefault(); }
  });

  // seret/geser = pindah produk; ketuk tanpa geser = pilih/dekatkan produk yang diketuk
  const ray = new THREE.Raycaster(), titik = new THREE.Vector2(), arah = { x: 0, y: 0 };
  let tekan = null;
  kanvas.addEventListener("pointerdown", (e) => { tekan = { x: e.clientX, y: e.clientY }; });
  kanvas.addEventListener("pointerup", (e) => {
    if (!tekan) return;
    const dx = e.clientX - tekan.x, dy = e.clientY - tekan.y;
    tekan = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) return ke(pilih + (dx < 0 ? 1 : -1));
    if (Math.hypot(dx, dy) > 8) return;
    const r = kanvas.getBoundingClientRect();
    titik.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(titik, camera);
    const kena = ray.intersectObjects(slot.map((s) => s.putar), true)[0];
    if (!kena) return dekatkan(false);
    const i = kena.object.userData.slot;
    i === pilih ? dekatkan(!dekat) : ke(i);
  });
  kanvas.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = kanvas.getBoundingClientRect();
    arah.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    arah.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  kanvas.addEventListener("pointerleave", () => { arah.x = arah.y = 0; });

  /* ---------- kamera + putaran ---------- */
  const posKam = new THREE.Vector3(), lihat = new THREE.Vector3(), tujuanPos = new THREE.Vector3(), tujuanLihat = new THREE.Vector3();
  let jarakDasar = 6, geserX = 0;
  function ukur() {
    const w = kanvas.clientWidth, h = kanvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const tanSetengah = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    jarakDasar = Math.max(5.6, 1.7 / (tanSetengah * camera.aspect)); // layar sempit: mundur agar satu produk utuh
    geserX = camera.aspect > 1.3 ? -1.1 : 0; // layar lebar: produk di kanan, teks info di kiri
    perluRender = true;
  }
  function hitungTujuan() {
    const s = slot[pilih];
    const gx = dekat ? geserX * 0.45 : geserX;
    tujuanLihat.set(s.x + gx, dekat ? 0.9 : 1.15, 0);
    tujuanPos.set(s.x + gx + arah.x * 0.4, (dekat ? 1.25 : 1.7) - arah.y * 0.2, dekat ? Math.max(3.1, jarakDasar * 0.55) : jarakDasar);
  }

  const jam = new THREE.Clock();
  let tampak = false, jalan = false;
  function bingkai() {
    if (!tampak || document.hidden) { jalan = false; return; }
    requestAnimationFrame(bingkai);
    const dt = Math.min(jam.getDelta(), 0.05), t = jam.elapsedTime;
    hitungTujuan();
    const k = tenang ? 1 : 1 - Math.exp(-dt * 4);
    const gerak = posKam.distanceTo(tujuanPos) + lihat.distanceTo(tujuanLihat);
    posKam.lerp(tujuanPos, k); lihat.lerp(tujuanLihat, k);
    slot.forEach((s, i) => {
      const sasaran = i === pilih && !tenang ? Math.sin(t * 0.6) * 0.5 : (s.x - posKam.x) * -0.08; // produk lain menghadap kamera
      s.putar.rotation.y += (sasaran - s.putar.rotation.y) * (tenang ? 1 : Math.min(1, dt * 3));
    });
    if (tenang && !perluRender && gerak < 1e-3) return; // gerak dikurangi: gambar hanya saat ada perubahan
    perluRender = false;
    camera.position.copy(posKam);
    camera.lookAt(lihat);
    renderer.render(scene, camera);
  }
  const hidupkan = () => { if (tampak && !jalan && !document.hidden) { jalan = true; jam.getDelta(); requestAnimationFrame(bingkai); } };

  tampilInfo();
  akar.hidden = false;
  if (daftarEl) daftarEl.open = false;
  new ResizeObserver(ukur).observe(kanvas);
  ukur();
  hitungTujuan();
  posKam.copy(tujuanPos); lihat.copy(tujuanLihat);
  new IntersectionObserver(([e]) => { tampak = e.isIntersecting; hidupkan(); }).observe(akar);
  document.addEventListener("visibilitychange", hidupkan);
}
