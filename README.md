# ✦ SOTERA — Satu Sumber untuk Segala Tools

<p align="center">
  <strong>Discover. Explore. Find the Right Tools.</strong>
</p>

<p align="center">
  Platform direktori dan pencarian tools digital yang membantu mahasiswa menemukan berbagai tools sesuai kebutuhan dalam satu tempat.
</p>

---

## 🌐 Tentang SOTERA

**SOTERA (Satu Sumber untuk Segala Tools)** merupakan aplikasi berbasis digital yang dirancang untuk mempermudah mahasiswa dalam menemukan, mengeksplorasi, dan memperoleh informasi mengenai berbagai tools yang tersedia di internet.

Beragam tools digital saat ini tersebar di berbagai platform dan kategori, seperti produktivitas, desain, pemrograman, kecerdasan buatan (AI), penulisan, hingga pengolahan data. Kondisi tersebut terkadang membuat pengguna harus mencari informasi dari banyak sumber sebelum menemukan tools yang sesuai.

SOTERA hadir sebagai platform direktori yang mengumpulkan informasi berbagai tools dalam satu tempat. Pengguna dapat mencari tools berdasarkan kebutuhan, melihat informasi dan karakteristiknya, serta mengakses sumber atau situs resmi penyedia tools tersebut.

> **SOTERA bukan pengganti tools yang tersedia di internet. SOTERA berperan sebagai jembatan yang membantu pengguna menemukan tools yang tepat dengan lebih mudah dan terarah.**

## 🎯 Tujuan Pengembangan

SOTERA dikembangkan dengan beberapa tujuan utama:

- Mempermudah mahasiswa menemukan tools digital sesuai kebutuhan.
- Mengumpulkan informasi tools dari berbagai platform dalam satu direktori.
- Menyediakan fitur pencarian dan penyaringan agar penemuan tools lebih terarah.
- Membantu pengguna memahami fungsi, kelebihan, kekurangan, dan informasi dasar suatu tools.
- Memberikan rekomendasi tools berdasarkan kebutuhan pengguna.
- Membangun pengalaman eksplorasi tools yang praktis dan mudah digunakan.

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🏠 **Beranda** | Menampilkan ringkasan, kategori populer, tools trending, dan rekomendasi. |
| 🔎 **Pencarian Tools** | Mencari tools berdasarkan kata kunci dan kebutuhan pengguna. |
| 🎛️ **Filter Pencarian** | Menyaring tools berdasarkan kategori, harga, platform, dan tingkat kesulitan. |
| 📌 **Detail Tools** | Menampilkan deskripsi, fitur, harga, platform, kelebihan, kekurangan, dan tautan resmi. |
| ⭐ **Koleksi Favorit** | Menyimpan dan mengelompokkan tools pilihan pengguna. |
| 💬 **Ulasan dan Rating** | Memberikan penilaian serta ulasan terhadap tools. |
| ➕ **Ajukan Tools Baru** | Mengusulkan tools yang belum tersedia dalam direktori. |
| 🤖 **AI Chatbot — Bantu Aku Cari** | Membantu pengguna menemukan tools melalui interaksi dan rekomendasi. |
| 🧭 **Pencarian Terpandu** | Memberikan rekomendasi berdasarkan kebutuhan, perangkat, anggaran, dan tingkat kemampuan. |
| 👤 **Profil dan Pengaturan** | Mengelola informasi akun serta preferensi aplikasi. |
| 🌙 **Tema dan Bahasa** | Menyesuaikan tampilan dan bahasa aplikasi. |
| 🛠️ **Panel Admin** | Menyediakan rancangan pengelolaan tools, kategori, pengguna, moderasi, dan statistik. |
| 📡 **Penanganan Offline** | Memberikan informasi ketika perangkat tidak memiliki koneksi internet. |

*Daftar tersebut menggambarkan ruang lingkup fitur yang dirancang dalam SOTERA. Tingkat implementasi dan pengujian setiap fitur dapat berbeda.*

## 🖥️ Platform

SOTERA dikembangkan dengan dua bentuk aplikasi untuk kebutuhan pengembangan dan pengujian:

- **Web Application** — aplikasi yang dapat diakses melalui browser.
- **Android Application** — versi konversi aplikasi web ke lingkungan Android untuk kebutuhan pengujian.

Saat ini, proyek masih berada dalam tahap pengembangan dan evaluasi. Aplikasi belum ditujukan sebagai layanan publik atau produk produksi.

## 🧰 Teknologi yang Digunakan

Teknologi yang digunakan dalam pengembangan proyek ini meliputi:

| Teknologi | Kegunaan |
|---|---|
| HTML5 | Struktur halaman aplikasi. |
| CSS3 | Pengaturan tampilan dan desain antarmuka. |
| JavaScript | Logika dan interaksi aplikasi. |
| JSON | Representasi dan pengelolaan data terstruktur. |
| Node.js | Lingkungan runtime JavaScript untuk sisi server. |
| Express.js | Framework backend untuk membangun endpoint API. |
| PostgreSQL | Sistem manajemen basis data pada bagian backend. |
| Capacitor | Penghubung aplikasi web dengan lingkungan native Android. |
| Android Studio | Pengembangan dan pengujian aplikasi Android. |
| Gradle | Sistem build untuk proyek Android. |

**Catatan:** Teknologi backend dan database tercantum sebagai bagian dari kode proyek. Ketersediaan kode tersebut tidak dengan sendirinya berarti seluruh layanan backend telah terintegrasi dan berjalan pada aplikasi.

## 📁 Struktur Proyek

Secara umum, repositori ini memiliki dua bagian utama:

```text
Project-Aplikasi-Sotera/
│
├── sotera/
│   └── Main Web Application
│
├── sotera-android/
│   ├── Android Application
│   └── server/
│       └── Backend Source Code
│
└── README.md
```

Keterangan:

- `sotera/` berisi proyek utama aplikasi web.
- `sotera-android/` berisi proyek konversi aplikasi untuk Android.
- `server/` berisi kode sumber backend yang disertakan dalam proyek Android.

*Struktur di atas merupakan gambaran tingkat atas. Isi folder dapat berkembang mengikuti perubahan pengembangan.*

## ⚙️ Menjalankan Proyek

### 1. Menjalankan Aplikasi Web

Persiapkan terlebih dahulu:

- Node.js
- npm
- Visual Studio Code atau editor kode lainnya

Langkah umum:

```bash
git clone https://github.com/rielzy2006-ai/Project-Aplikasi-Sotera.git
```

Masuk ke direktori proyek web:

```bash
cd Project-Aplikasi-Sotera/sotera
```

Instal dependensi apabila proyek menyediakan `package.json`:

```bash
npm install
```

Jalankan aplikasi menggunakan perintah yang tersedia pada bagian `scripts` di `package.json`.

> Perintah menjalankan aplikasi dapat berbeda sesuai konfigurasi proyek.

### 2. Menjalankan Aplikasi Android

Untuk pengembangan dan pengujian Android, gunakan:

- Android Studio
- Android SDK
- JDK yang sesuai dengan konfigurasi Gradle proyek

Buka folder `sotera-android/` melalui Android Studio, kemudian tunggu proses sinkronisasi Gradle selesai.

Setelah itu, pilih perangkat emulator atau perangkat Android yang terhubung untuk menjalankan aplikasi.

## 🔐 Keamanan dan Pengelolaan Data

Pada proyek ini terdapat kode sumber backend yang mencakup mekanisme autentikasi, pengelolaan sesi, validasi permintaan, dan akses database.

Beberapa mekanisme yang terdapat dalam kode meliputi:

- Password hashing menggunakan bcrypt.
- Penggunaan parameterized query untuk interaksi database.
- Middleware keamanan dan konfigurasi HTTP security headers.
- Mekanisme perlindungan CSRF.
- Pengaturan hak akses berdasarkan peran pengguna.

Mekanisme tersebut merupakan bagian dari implementasi kode sumber. Pengujian keamanan, integrasi layanan, konfigurasi server, dan kesiapan penggunaan produksi tetap memerlukan verifikasi tersendiri.

## 🚧 Status Pengembangan

<em>Project Status: Development & Evaluation</em>

SOTERA merupakan proyek aplikasi yang dikembangkan sebagai bagian dari kegiatan akademik bidang Informatika.

Fokus pengembangan meliputi:

- Penyempurnaan antarmuka dan pengalaman pengguna (UI/UX).
- Pengembangan dan penyesuaian fitur aplikasi.
- Pengembangan versi web dan konversi Android.
- Penyesuaian fungsi aplikasi dengan dokumen Software Requirements Specification (SRS).
- Pengujian dan evaluasi aplikasi.

Beberapa fitur masih memerlukan penyempurnaan, integrasi, atau pengujian lebih lanjut. Oleh karena itu, proyek ini belum dinyatakan sebagai aplikasi produksi.

## 🎓 Konteks Proyek

Proyek ini dikembangkan dalam rangka tugas akademik **Perancangan Project Aplikasi**, Program Studi Teknik Informatika.

SOTERA menjadi bentuk penerapan proses perancangan dan pengembangan aplikasi, mulai dari identifikasi kebutuhan pengguna, perancangan UI/UX, implementasi, hingga pengujian.

## 👥 Tim Pengembang

**SOTERA — Satu Sumber untuk Segala Tools**

Dikembangkan oleh tim mahasiswa Program Studi Teknik Informatika.

## 📄 Lisensi dan Penggunaan

Repositori ini disediakan untuk kebutuhan pembelajaran, pengembangan, dan evaluasi proyek akademik.

Informasi lisensi penggunaan dan distribusi dapat ditambahkan setelah ditentukan oleh tim pengembang.

---

<p align="center">
  <strong>SOTERA</strong><br/>
  <em>One Place. Countless Possibilities.</em>
</p>

<p align="center">
  Discover the right tools for every need.
</p>
