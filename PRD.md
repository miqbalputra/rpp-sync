# PRD — Aplikasi Sinkronisasi RPP (Rencana Pelaksanaan Pembelajaran)
**Griya Qur'an "Tunas Ilmu" — Purbalingga**

Versi: 0.1 (Draft)
Tanggal: 20 Juli 2026

---

## 1. Latar Belakang

Saat ini RPP dibuat dan disimpan secara manual (form kertas/Word), sehingga:
- Sulit dipantau oleh Kepala Sekolah dan PJ Kurikulum (Diniyyah).
- Guru tidak punya referensi cepat dari RPP guru lain dengan mapel & kelas yang sama.
- Proses cetak/bagikan RPP (ke wali kelas, arsip, WA grup) memakan waktu.
- Data RPP mudah hilang saat dihapus secara tidak sengaja.

Aplikasi ini dibuat untuk mendigitalkan proses pembuatan, sinkronisasi, penilaian, dan distribusi RPP antar guru, PJ Kurikulum, dan Kepala Sekolah.

## 2. Tujuan

1. Guru dapat membuat RPP langsung dari form digital (mengikuti format template RPP yang sudah ada).
2. RPP dapat digenerate otomatis menjadi **gambar, PDF, dan Word**, serta langsung dibagikan via **WhatsApp**.
3. Kepala Sekolah dan PJ Kurikulum dapat memantau/menyetujui RPP dari seluruh guru.
4. Guru dengan mapel yang sama bisa saling melihat RPP (khusus kelas yang sama) sebagai referensi.
5. RPP yang dihapus tetap bisa dipulihkan (soft delete).

## 3. Konteks Organisasi

- Guru laki-laki mengajar kelas/siswa laki-laki; guru perempuan mengajar kelas/siswa perempuan (dipisah berdasarkan gender).
- Sistem harus menyimpan atribut gender pada guru dan kelas, dan menggunakannya untuk pengelompokan/filter, **bukan** untuk membatasi akses lintas gender secara ketat kecuali ditentukan lain (lihat §5.4).

## 4. Peran Pengguna (Roles)

| Role | Deskripsi | Hak Akses Utama |
|---|---|---|
| **Admin** | Mengelola sistem, akun, master data (mapel, kelas, guru) | Full CRUD semua data, kelola user & role, restore data terhapus |
| **Kepala Sekolah** | Pimpinan sekolah | Lihat semua RPP (read-only), approve/tanda tangan digital, lihat laporan rekap |
| **PJ Diniyyah (Kurikulum)** | Penanggung jawab kurikulum | Lihat & review semua RPP, beri catatan/revisi, approve sebelum ke Kepala Sekolah, kelola master mapel & kelas |
| **Guru Mapel** | Pengampu mata pelajaran | Buat/edit/hapus RPP miliknya sendiri, lihat RPP guru lain **dengan mapel & kelas yang sama** (read-only, sebagai referensi), export & share RPP miliknya |

### 4.1 Matriks Hak Akses (ringkas)

| Aksi | Admin | Kepala Sekolah | PJ Diniyyah | Guru |
|---|---|---|---|---|
| Buat RPP | ✔ | ✘ | ✘ | ✔ (miliknya) |
| Edit RPP | ✔ (semua) | ✘ | ✔ (beri catatan) | ✔ (miliknya) |
| Hapus RPP | ✔ | ✘ | ✘ | ✔ (miliknya) |
| Restore RPP terhapus | ✔ | ✘ | ✘ | ✘ |
| Lihat RPP milik sendiri | ✔ | ✔ | ✔ | ✔ |
| Lihat RPP guru lain (mapel & kelas sama) | ✔ | ✔ (semua) | ✔ (semua) | ✔ (read-only, filter mapel+kelas sama) |
| Approve/Tanda tangan | ✘ | ✔ | ✔ | ✘ |
| Export (gambar/PDF/Word) | ✔ | ✔ | ✔ | ✔ (miliknya) |
| Kelola master data (mapel, kelas, user) | ✔ | ✘ | ✔ (mapel & kelas) | ✘ |

## 5. Fitur Utama

### 5.1 Form Input RPP (mengikuti template existing)
Form digital mengikuti struktur template RPP yang sudah dipakai (lihat lampiran gambar), dengan field:

**Header**
- Mata Pelajaran (dropdown dari master mapel)
- Kelas/Semester (dropdown dari master kelas, otomatis mengikuti gender guru yang login jika relevan)
- Materi (teks)
- Alokasi Waktu (teks/angka)

**Tujuan Pembelajaran**
- Rich text / bullet list

**Kegiatan Pembelajaran**
- Pertemuan 1–4 (bisa ditambah/dikurangi jumlah pertemuan, tidak dihardcode 4)
- Masing-masing pertemuan: rich text

**Penilaian**
- Pengetahuan (teks)
- Keterampilan (teks)
- Sikap (teks)

**Pengesahan**
- Nama Kepala Sekolah (auto-fill dari master data)
- Nama Ustadz/ah Pengampu Mapel (auto-fill dari akun guru yang login)
- Tempat & tanggal — otomatis terisi tanggal sistem saat RPP dibuat, namun **bisa diedit manual** oleh guru bila perlu (misal tanggal pengesahan berbeda dari tanggal input)
- Status tanda tangan digital (opsional, lihat §5.5)

### 5.2 Auto-Generate Export
Setelah form disimpan, sistem otomatis menghasilkan RPP dalam 3 format, sesuai layout template asli:
- **Gambar (JPG/PNG)** — untuk dibagikan cepat via chat.
- **PDF** — untuk arsip & cetak resmi.
- **Word (.docx)** — agar bisa diedit ulang manual bila perlu.

Tombol **"Bagikan via WhatsApp"** langsung membuka WhatsApp (Web/App) dengan file/gambar RPP terlampir atau link download, tanpa perlu download manual dulu.

### 5.3 Sinkronisasi & Referensi Antar Guru
- Guru bisa membuka daftar RPP guru lain, **terfilter otomatis**: hanya mapel sama + kelas sama dengan guru yang login.
- Mode tampilan: read-only (tidak bisa edit RPP orang lain), ada tombol "Duplikat sebagai draft" agar guru bisa memakainya sebagai starting point RPP miliknya sendiri.

### 5.4 Pemisahan Gender
- Master data Kelas memiliki atribut gender (Ikhwan/Akhwat).
- Master data Guru memiliki atribut gender.
- Saat guru login, pilihan kelas pada form RPP difilter sesuai gender guru (guru laki-laki hanya bisa pilih kelas ikhwan, dst.), kecuali guru mengampu lebih dari satu kelas lintas gender (dikonfigurasi Admin/PJ Kurikulum per akun bila memang ada pengecualian).

### 5.5 Approval / Review (opsional untuk versi awal, disiapkan strukturnya)
- Status RPP: `Draft` → `Diajukan` → `Direview PJ Kurikulum` → `Disetujui Kepala Sekolah`.
- PJ Diniyyah bisa memberi catatan revisi per RPP.
- Riwayat status (siapa & kapan mengubah status) dicatat sebagai log.

### 5.6 CRUD & Soft Delete (Recycle Bin)
- Semua RPP menggunakan **soft delete** (kolom `deleted_at`), tidak pernah dihapus permanen dari database secara langsung.
- Guru yang menghapus RPP miliknya hanya menyembunyikan dari daftar utama.
- Admin punya halaman **"Sampah/Recycle Bin"** untuk melihat semua RPP terhapus dari semua guru, dan bisa **restore** atau **hapus permanen** (khusus admin, dengan konfirmasi ganda).
- Riwayat versi form (opsional lanjutan): setiap kali RPP diedit, simpan versi sebelumnya (audit trail sederhana).

### 5.7 Dashboard & Laporan
- **Guru**: daftar RPP miliknya (status, terakhir diubah), shortcut buat RPP baru.
- **PJ Kurikulum**: rekap jumlah RPP per guru/mapel/kelas, status approval, RPP yang belum dibuat.
- **Kepala Sekolah**: rekap tingkat sekolah, ringkasan kepatuhan (compliance) pembuatan RPP per periode.
- **Admin**: manajemen user, mapel, kelas, log aktivitas, recycle bin.

## 6. Model Data (Entitas Utama)

- **User** (id, nama, email/username, password_hash, role, gender, status, created_at)
- **Guru** (relasi 1-1 ke User; nama tampil, mapel yang diampu — many-to-many ke Mapel)
- **Mapel** (id, nama_mapel)
- **Kelas** (id, nama_kelas, semester, gender, tahun_ajaran)
- **RPP** (id, guru_id, mapel_id, kelas_id, materi, alokasi_waktu, tujuan_pembelajaran, status, tanggal_pengesahan [otomatis dari sistem, bisa diedit manual], dibuat_oleh, deleted_at, created_at, updated_at)
- **RPP_Pertemuan** (id, rpp_id, urutan, isi_kegiatan)
- **RPP_Penilaian** (id, rpp_id, pengetahuan, keterampilan, sikap)
- **RPP_Log_Status** (id, rpp_id, status_lama, status_baru, oleh_user_id, catatan, created_at)
- **RPP_Export** (id, rpp_id, tipe_file [image/pdf/docx], path_file, created_at) — cache hasil generate agar tidak generate ulang tiap kali

## 7. Tech Stack (Keputusan)

| Layer | Teknologi |
|---|---|
| Framework | **Next.js (App Router)** — full-stack: React untuk frontend, API Routes/Server Actions Next.js sebagai backend (tidak pakai Express terpisah) |
| Styling/Form | Tailwind CSS, React Hook Form |
| Database | MariaDB, diakses lewat ORM (Prisma dengan driver MySQL/MariaDB, atau Drizzle ORM) |
| Generate PDF/Word/Image | Puppeteer/HTML-to-PDF (dijalankan di Next.js API route/Server Action) untuk PDF & gambar dari template HTML sesuai layout RPP asli; `docx` (npm library) untuk Word |
| Share WhatsApp | Link `wa.me` (klik-share manual) — cukup untuk kebutuhan saat ini, tanpa integrasi WhatsApp Business API resmi |
| Autentikasi | NextAuth.js / session-based, role-based access control (RBAC) |
| Hosting | Self-hosted (VPS/shared hosting yang mendukung Node.js), sesuai preferensi hemat biaya |
| File Storage | Local storage server / bisa upgrade ke S3-compatible bila perlu |

## 8. Kebutuhan Non-Fungsional

- Responsif (bisa diakses dari HP guru, tidak hanya desktop).
- Waktu generate PDF/gambar < 5 detik untuk 1 RPP.
- Backup database otomatis harian.
- Log aktivitas (siapa ubah/hapus apa dan kapan) untuk audit.
- Hak akses ketat sesuai matriks di §4.1 — guru tidak bisa mengedit RPP guru lain dalam kondisi apa pun.

## 9. Di Luar Cakupan (Out of Scope) — v1

- Integrasi WhatsApp Business API resmi (v1 pakai `wa.me` link/share manual).
- Tanda tangan digital berbasis sertifikat elektronik resmi (v1 cukup nama + status approval).
- Aplikasi mobile native (v1 cukup web responsif).

## 10. Rencana Implementasi Bertahap (Step-by-Step untuk Vibe Coding)

Bagian ini dirancang agar bisa dieksekusi **satu tahap per satu tahap** bersama tools vibe coding (AI-assisted development). Setiap tahap punya **Tujuan**, **Yang Dikerjakan**, dan **Kriteria Selesai (Definition of Done)** — baru lanjut ke tahap berikutnya kalau kriteria selesai sudah terpenuhi & sudah dicoba langsung (klik-klik manual). Urutan ini mengikuti prinsip: fondasi dulu → data → fitur inti (CRUD RPP) → fitur pendukung → fitur lanjutan → polish & deploy.

---

### Tahap 0 — Setup Proyek
**Tujuan:** Kerangka proyek siap jalan sebelum fitur apa pun dibuat.
**Yang dikerjakan:**
- Init proyek Next.js (App Router, TypeScript, Tailwind CSS).
- Setup ESLint/Prettier dasar.
- Setup Prisma, koneksi ke database MariaDB lokal (`DATABASE_URL` di `.env`).
- Struktur folder awal (`app/`, `lib/`, `components/`, `prisma/`).
**Kriteria Selesai:** `npm run dev` jalan tanpa error, halaman default Next.js tampil di browser.

### Tahap 1 — Skema Database & Migrasi
**Tujuan:** Struktur data sesuai `schema.prisma` benar-benar ada di database.
**Yang dikerjakan:**
- Terapkan `schema.prisma` (§6) ke database via `prisma migrate dev`.
- Buat seed data awal: 1 akun Admin, 1 Mapel contoh, 1 Kelas contoh.
**Kriteria Selesai:** Tabel-tabel muncul di MariaDB (bisa dicek lewat Prisma Studio), seed data berhasil masuk.

### Tahap 2 — Autentikasi & Role
**Tujuan:** User bisa login dan sistem tahu role-nya (Admin/Kepala Sekolah/PJ Diniyyah/Guru).
**Yang dikerjakan:**
- Halaman login.
- Autentikasi (NextAuth.js atau custom session + JWT).
- Middleware proteksi route berdasarkan role (guru tidak bisa akses halaman admin, dst — sesuai matriks §4.1).
- Halaman "akses ditolak" untuk role yang tidak berhak.
**Kriteria Selesai:** Login dengan akun Admin seed berhasil; user Guru (belum ada, buat manual dulu lewat Prisma Studio) tidak bisa buka halaman admin.

### Tahap 3 — Master Data (khusus Admin)
**Tujuan:** Admin bisa mengelola semua data dasar sebelum guru mulai pakai aplikasi.
**Yang dikerjakan:**
- CRUD **User** (buat akun guru/Kepala Sekolah/PJ Diniyyah, termasuk atribut gender).
- CRUD **Mapel**.
- CRUD **Kelas** (termasuk atribut gender & tahun ajaran).
- CRUD **Penugasan** (assign: guru X → mapel Y → kelas Z).
**Kriteria Selesai:** Admin bisa membuat 1 akun guru lengkap dengan penugasan mapel+kelas, tersimpan dan tampil di daftar.

### Tahap 4 — Form RPP (Inti — Buat & Edit)
**Tujuan:** Guru bisa membuat RPP sesuai template gambar awal.
**Yang dikerjakan:**
- Halaman daftar RPP milik guru yang login.
- Form buat RPP baru: dropdown Mapel & Kelas **otomatis terbatas** sesuai `Penugasan` guru tsb.
- Field Materi, Alokasi Waktu, Tujuan Pembelajaran.
- Bagian Kegiatan Pembelajaran: bisa tambah/hapus baris Pertemuan secara dinamis.
- Bagian Penilaian: Pengetahuan, Keterampilan, Sikap.
- Tanggal pengesahan otomatis terisi tanggal hari ini, bisa diedit manual.
- Simpan sebagai Draft.
- Form Edit RPP (pakai form yang sama, mode edit).
**Kriteria Selesai:** Guru bisa membuat 1 RPP lengkap dari form, tersimpan ke database, muncul di daftar RPP miliknya, dan bisa dibuka lagi untuk diedit.

### Tahap 5 — Hapus (Soft Delete) & Recycle Bin
**Tujuan:** RPP yang dihapus tidak hilang permanen.
**Yang dikerjakan:**
- Tombol hapus di daftar RPP guru → set `deletedAt`, RPP hilang dari daftar utama guru.
- Halaman Recycle Bin (khusus Admin): daftar semua RPP dengan `deletedAt` terisi, dari semua guru.
- Tombol **Restore** (set `deletedAt = null`) dan **Hapus Permanen** (dengan konfirmasi ganda) di halaman ini.
**Kriteria Selesai:** RPP yang dihapus guru muncul di Recycle Bin Admin, dan bisa direstore hingga muncul kembali di daftar guru pemiliknya.

### Tahap 6 — Referensi Antar Guru
**Tujuan:** Guru bisa melihat RPP guru lain dengan mapel & kelas yang sama.
**Yang dikerjakan:**
- Halaman/tab "Referensi": daftar RPP guru lain, terfilter otomatis (mapel sama + kelas sama + bukan miliknya + tidak terhapus).
- Tampilan read-only (tidak ada tombol edit/hapus).
- Tombol "Duplikat sebagai Draft" → menyalin isi RPP tersebut jadi draft baru milik guru yang login.
**Kriteria Selesai:** Dua akun guru dengan mapel+kelas sama bisa saling melihat RPP satu sama lain; duplikat berhasil membuat draft baru tanpa mengubah RPP asli.

### Tahap 7 — Export Gambar & PDF
**Tujuan:** RPP bisa diunduh sesuai layout template asli.
**Yang dikerjakan:**
- Buat template HTML/CSS untuk render RPP persis seperti layout gambar awal.
- Generate gambar (JPG/PNG) dari template ini (Puppeteer screenshot).
- Generate PDF dari template yang sama (Puppeteer print-to-PDF).
- Simpan hasil generate ke tabel `RppExport` (cache), regenerate otomatis kalau RPP diedit ulang.
- Tombol download di halaman detail RPP.
**Kriteria Selesai:** Dari 1 RPP yang sudah dibuat, bisa didownload sebagai gambar dan PDF, tampilannya sesuai layout form kertas asli.

### Tahap 8 — Export Word
**Tujuan:** RPP bisa diunduh dalam format yang masih bisa diedit manual.
**Yang dikerjakan:**
- Generate file `.docx` (library `docx`) dengan struktur & data yang sama seperti export PDF.
- Tombol download Word di halaman detail RPP.
**Kriteria Selesai:** File `.docx` hasil download bisa dibuka & diedit normal di Microsoft Word/WPS.

### Tahap 9 — Share via WhatsApp
**Tujuan:** RPP bisa langsung dibagikan tanpa proses manual berlapis.
**Yang dikerjakan:**
- Tombol "Bagikan via WhatsApp" di halaman detail RPP.
- Klik tombol → buka link `wa.me` berisi pesan singkat + link download file (gambar/PDF) yang sudah digenerate.
**Kriteria Selesai:** Klik tombol share membuka WhatsApp (Web/App) dengan pesan & link file yang bisa langsung dikirim.

### Tahap 10 — Dashboard Ringkas
**Tujuan:** Setiap role melihat ringkasan yang relevan begitu login.
**Yang dikerjakan:**
- Dashboard Guru: daftar RPP miliknya + status + shortcut "Buat RPP Baru".
- Dashboard Admin: jumlah user/mapel/kelas, jumlah RPP terhapus di Recycle Bin.
**Kriteria Selesai:** Setelah login, tiap role langsung melihat ringkasan yang sesuai, bukan halaman kosong.

### Tahap 11 — Uji Menyeluruh & Polish (menuju 100% MVP)
**Tujuan:** Memastikan semua fitur di atas benar-benar berfungsi bersamaan, bukan cuma satu-satu.
**Yang dikerjakan:**
- Uji ulang matriks hak akses §4.1 untuk role Admin & Guru (role Kepala Sekolah/PJ Diniyyah baru diuji penuh di v1.2).
- Uji kasus tepi: guru tanpa penugasan sama sekali, RPP dengan 1 pertemuan vs banyak pertemuan, hapus lalu restore berkali-kali.
- Cek tampilan responsif di layar HP (guru kemungkinan besar akses dari HP).
- Perbaikan bug & UX kecil dari hasil uji coba.
**Kriteria Selesai:** MVP dianggap 100% selesai — Admin bisa setup penuh dari nol (buat user, mapel, kelas, penugasan), Guru bisa membuat RPP dari form sampai diunduh (gambar/PDF/Word) dan dibagikan via WhatsApp, tanpa error, di desktop maupun HP.

### Tahap 12 — Deploy
**Tujuan:** Aplikasi bisa diakses semua guru, bukan cuma di komputer development.
**Yang dikerjakan:**
- Siapkan VPS/hosting yang mendukung Node.js + MariaDB.
- Setup environment production (`.env` production, build `next build`).
- Migrasi database production.
- Setup backup database otomatis harian (§8).
**Kriteria Selesai:** Aplikasi bisa diakses via domain/subdomain sekolah, seluruh alur Tahap 0–11 berjalan normal di environment production.

---

### Fase Lanjutan (setelah MVP 100%, bukan bagian tahap di atas)
- **v1.2**: Role Kepala Sekolah & PJ Diniyyah aktif penuh + alur approval (§5.5) + dashboard rekap untuk kedua role ini.
- **v1.3**: Riwayat versi RPP, log aktivitas lengkap, laporan compliance per periode.

---
*Dokumen ini adalah draft awal dan bisa disesuaikan lebih lanjut sesuai kebutuhan lapangan.*
