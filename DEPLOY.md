# Panduan Deploy — Coolify + MariaDB

Aplikasi siap deploy self-hosted via **Coolify** di VPS Anda, dengan database
**MariaDB** sesuai PRD §7. Repo memakai pendekatan dual-schema:

- `prisma/schema.prisma` — **dev** (SQLite, `npm run dev` tetap jalan tanpa DB server).
- `prisma/prod/schema.prisma` — **produksi** (MySQL/MariaDB) + `prisma/prod/migrations/`.

Kode aplikasi identik; `@prisma/client` di-generate untuk provider yang sesuai
saat build (lihat `Dockerfile`).

## 1. Repo

Kode sudah di-push ke `https://github.com/miqbalputra/rpp-sync.git` (branch `main`).

## 2. Buat resource di Coolify

1. **New Resource → Database → MariaDB**. Catat user/password/host (Coolify
   menyediakan connection string `mysql://...`).
2. **New Resource → Application → Public repository (GitHub)**:
   `https://github.com/miqbalputra/rpp-sync.git`, branch `main`.
3. Coolify akan mendeteksi `Dockerfile` di root dan memakainya (pastikan
   **Build Pack = Dockerfile**).

## 3. Environment variables (Coolify → Application)

Set minimal:

| Variabel | Nilai |
|---|---|
| `DATABASE_URL` | `mysql://...` dari service MariaDB (atau klik "Connect" → inject otomatis) |
| `NEXTAUTH_URL` | domain/subdomain publik, mis. `https://rpp.sekolah.sch.id` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `ADMIN_PASSWORD` | password kuat untuk admin awal (WAJIB) |
| `SEED_DEMO` | kosongkan; set `true` hanya bila ingin data contoh |
| `SCHOOL_INTEGRATION_API_TOKEN` | token acak khusus aplikasi sekolah |
| `SCHOOL_INTEGRATION_WEBHOOK_URL` | `https://sekolah.example/api/integrations/rpp/webhook` |
| `SCHOOL_INTEGRATION_WEBHOOK_SECRET` | secret HMAC acak yang sama di aplikasi sekolah |

> Generate `NEXTAUTH_SECRET` di terminal VPS: `openssl rand -base64 32`.

## 4. Persistent storage (penting)

File export RPP (PNG/PDF/DOCX) dan PDF RPP yang di-upload ditulis ke folder
lokal di container (lihat `lib/rpp/export.ts` dan `lib/rpp/upload-storage.ts`).
Tanpa volume, file hilang tiap redeploy. Di Coolify:

- **Application → Persistent Storage → Add Volume**, mount path `/app/storage`
  untuk mempertahankan PDF upload antar-redeploy.
- Pertahankan volume export yang sudah ada pada mount path `/app/public/exports`
  agar hasil PNG/PDF/DOCX juga tidak hilang.

## 5. Domain & HTTPS

- **Application → Domains** tambahkan domain Anda; Coolify menerbitkan
  sertifikat Let's Encrypt otomatis. Set `NEXTAUTH_URL` sesuai domain ini.

## 6. Deploy

Klik **Deploy**. Build akan: `npm ci` → generate Prisma client MySQL →
`next build`. Saat container start (CMD Dockerfile) otomatis:

1. `prisma migrate deploy --schema=prisma/prod/schema.prisma` (buat/mutakhirkan skema MariaDB).
2. `npm run db:seed` (NODE_ENV=production → buat admin dari `ADMIN_PASSWORD`; data contoh dilewati kecuali `SEED_DEMO=true`).
3. `next start -p ${PORT}`.

Cek log pertama: pastikan baris `✔ Admin: ...` muncul, lalu akses domain.

## 6b. Alternatif: init DB manual (copy-paste SQL)

Bila Anda lebih nyaman menyiapkan database secara manual daripada andalkan
auto-migrate saat container start, gunakan **`mariadb-init.sql`** di root repo.

1. Buat database MariaDB service di Coolify, buka editor SQL-nya (atau `mysql` CLI).
2. Copy-paste seluruh isi `mariadb-init.sql` lalu jalankan pada database target.
   File berisi: seluruh `CREATE TABLE` + foreign key, tabel `_prisma_migrations`
   + penanda migrasi sudah diterapkan (checksum sha256), dan data seed
   (admin + mapel + kelas contoh).
3. Deploy aplikasi. Karena migrasi sudah ditandai applied, `prisma migrate deploy`
   dilewati (no-op) dan `db:seed` upsert admin (sudah ada → no-op). Tidak bentrok.

Akun admin dari SQL: `admin` / `admin123` — **wajib ganti** setelah login.
Untuk password lain sebelum tempel, generate hash:
`node -e "console.log(require('bcryptjs').hashSync('PASSWORD_ANDA',10))"`
lalu ganti string `$2b$...` di INSERT `users`.

> Jika `prisma migrate deploy` melaporkan drift (checksum beda, mis. karena
> line-ending), jalankan sekali di container:
> `npx prisma migrate resolve --schema=prisma/prod/schema.prisma --applied 20260721000000_init`
> lalu restart.

## 7. Pasca-deploy

- Login sebagai `admin` dengan `ADMIN_PASSWORD` yang Anda set.
- **Ganti password admin** lewat menu Akun → Pengaturan setelah login pertama
  (meski `ADMIN_PASSWORD` dipakai seed, password hash di DB bisa diubah via UI).
- Buat master data: Mapel, Kelas, User (Guru/Kepala/PJ), lalu Penugasan & Jadwal.

## 8. Catatan dev (tidak berubah)

```bash
npm install
npm run db:migrate   # SQLite, skema dev
npm run db:seed      # admin123 + data contoh
npm run dev
```

Dev tetap pakai SQLite (`prisma/schema.prisma`); produksi pakai MariaDB
(`prisma/prod/schema.prisma`). Saat mengubah model, ubah **kedua** file skema,
lalu regenerasi migrasi dev (`npm run db:migrate`) dan prod (lihat komentar
di atas `prisma/prod/schema.prisma`).

## 9. Known limitations (mengikuti progress.md)

- Template gambar/PDF/Word export masih **placeholder** menunggu template asli.
- Role Kepala Sekolah & PJ Diniyyah: skema + RBAC siap, alur approval penuh
  ditangguhkan ke v1.2.

## 10. Pembaruan penyimpanan RPP — Coolify + Cloudflare Tunnel

### Status MariaDB Degraded setelah migrasi

Jika `healthcheck.sh --connect --innodb_initialized` menampilkan
`World-writable config file '/var/lib/mysql/.my-healthcheck.cnf' is ignored`,
klien mengabaikan kredensial healthcheck karena izin file terlalu longgar.
Pada insiden migrasi ini, memperketat izin file tersebut memulihkan status
MariaDB menjadi Running.

Jalankan berikut di terminal **resource MariaDB**, hanya untuk pesan tersebut:

```sh
chmod 600 /var/lib/mysql/.my-healthcheck.cnf &&
healthcheck.sh --connect --innodb_initialized
printf 'HEALTHCHECK_EXIT=%s\n' "$?"
```

Nilai `0` berarti pemeriksaan berhasil; tunggu pemeriksaan berkala berikutnya
dan refresh Coolify. Perintah ini hanya mengubah izin satu file konfigurasi,
tanpa mengubah password, isi database, atau melakukan restart. Jangan tampilkan
isi file tersebut karena berisi kredensial. Jika hasilnya tetap gagal, periksa
pesan baru sebelum melakukan perubahan lain. Status Running belum memastikan
seluruh berkas unggahan tersedia atau masalah penyimpanan RPP sudah selesai.

### Lindungi database sebelum deploy

1. Buat backup MariaDB dari resource database yang **sedang dipakai aplikasi**.
   Pastikan backup berstatus berhasil dan simpan salinannya di luar home server.
   Verifikasi dengan restore ke database sementara yang terpisah bila tersedia.
2. Catat jumlah RPP dan contoh RPP terbaru sebelum pembaruan. Pemeriksaan berikut
   hanya membaca data; jalankan pada database aktif melalui terminal database:

   ```sql
   SELECT COUNT(*) AS total_rpp FROM rpp;
   SELECT id, materi, guruId, createdAt, updatedAt FROM rpp
   ORDER BY createdAt DESC LIMIT 20;
   SHOW COLUMNS FROM rpp_penilaian;
   SHOW GRANTS FOR CURRENT_USER();
   ```

3. Pertahankan database, user database, dan volume MariaDB `/var/lib/mysql` yang
   berisi data hasil migrasi. Pertahankan juga volume aplikasi `/app/storage` dan
   `/app/public/exports`. Jangan membuat database pengganti saat redeploy aplikasi.
4. Gunakan `NEXTAUTH_SECRET` yang sama dengan sebelum migrasi dan
   `NEXTAUTH_URL=https://rpp.griyaquran.web.id`. Bila `AUTH_SECRET`/`AUTH_URL` juga
   diset, pastikan nilainya konsisten dengan pasangan `NEXTAUTH_*`. Perubahan secret
   membuat sesi lama tidak berlaku; secret juga dipakai untuk konfigurasi AI terenkripsi.

### Pertahankan PDF unggahan saat migrasi

Data `RppFile` di MariaDB menyimpan metadata dan lokasi berkas; PDF disimpan
terpisah di `/app/storage/rpp-uploads`. Volume `/app/public/exports` hanya
menyimpan hasil ekspor dan tidak mencakup PDF unggahan.

Sebelum redeploy, cocokkan lokasi berkas yang tercatat di database dengan
berkas di container aktif, volume lama, atau salinan VPS. Salin berkas yang
ditemukan sebelum memasang volume baru, karena mount baru dapat menutupi
isi direktori container yang sudah ada. Tambahkan volume persisten aplikasi
untuk `/app/storage` dan pertahankan struktur subdirektori saat memulihkan PDF.
Folder yang kosong atau tidak ada belum membuktikan salinan lain tidak tersedia;
jangan menghapus metadata `RppFile` saat mencari berkasnya.

### Terapkan pembaruan

Dockerfile menjalankan `prisma migrate deploy` saat startup. Migrasi
`20261017000000_expand_rpp_penilaian` hanya memperlebar tiga kolom penilaian dari
string menjadi `TEXT`; tidak menghapus tabel atau baris. Kolom ini sebelumnya dapat
menolak teks panjang yang sudah lolos validasi form. Jalankan pada salinan database
untuk verifikasi sebelum produksi bila akses tersebut tersedia. Rollback kode aplikasi
tetap kompatibel dengan kolom yang diperlebar.

Jika tiga kolom tersebut sudah diperlebar manual sebelum deploy, biarkan migrasi
ini tetap dijalankan oleh `prisma migrate deploy`. Mengulang definisi `TEXT NOT NULL`
tersebut kompatibel dengan perubahan manual; Prisma kemudian mencatat migrasi
sebagai diterapkan. Pada penerapan manual insiden ini, jumlah RPP sebelum dan
sesudah perubahan tetap 95 dan ketiga kolom terkonfirmasi bertipe `text`.

Jangan menjalankan `prisma migrate reset`, `db push --force-reset`, atau mengimpor
ulang `mariadb-init.sql` ke database produksi yang sudah berisi data untuk pembaruan ini.

Form manual, form edit, dan hasil AI menyimpan isian secara otomatis di browser,
dengan kunci berbeda per akun/form. Cadangan dihapus dari daftar draf aktif hanya
setelah server mengonfirmasi penyimpanan; versi berbeda tetap dapat diunduh.
Cadangan browser berlaku pada perangkat dan domain yang sama, dan tidak dapat
memulihkan isian yang hilang sebelum versi ini terpasang atau setelah penyimpanan
browser dihapus. Tombol **Unduh cadangan** menyimpan salinan teks di perangkat guru.

Penyimpanan form menggunakan endpoint JSON `/api/rpp` agar tidak bergantung pada ID
Server Action dari build lama. Pengiriman ulang memakai ID draf yang sama sehingga
respons yang terputus tidak membuat baris ganda. Edit dari versi lama ditolak bila
RPP sudah berubah; pertemuan dan penilaian lama tetap utuh bila transaksi gagal.

### Periksa Tunnel dan hasil deploy

- Arahkan hostname publik ke proxy Coolify yang melayani aplikasi ini. Jika log
  menyebut `x-forwarded-host ... does not match origin`, periksa penerusan Host dari
  Tunnel/Traefik. `next.config.ts` mengizinkan origin publik aplikasi secara eksplisit
  untuk Server Action yang masih dipakai fitur lain.
- Pastikan rule Cloudflare tidak meng-cache halaman akun atau respons `/api/rpp`.
  Endpoint penyimpanan mengirim `Cache-Control: no-store`.
- Setelah backup dan deploy, cocokkan jumlah/contoh RPP dengan hasil sebelumnya.
  Uji menggunakan akun uji: ketik draf, muat ulang, login ulang, lalu simpan. Periksa
  hanya ada satu RPP ketika tombol Simpan dicoba lagi setelah respons terputus.
- Cari log `[rpp.save]`, `P2000` (panjang kolom), `P1001` (koneksi database),
  `Access denied` (akses database), `JWTSessionError` (sesi/secret), dan
  `Invalid Server Actions request` (origin/proxy). Log penyimpanan baru mencatat
  jenis operasi dan kode kesalahan tanpa menyalin isian guru.

Pemeriksaan lokal: `npm run test:rpp`, `npm run lint`, dan `npm run build`.
Tes penyimpanan memakai database SQLite sementara di direktori temp, terpisah dari
database development maupun produksi; pengujian MariaDB/Tunnel tetap perlu dilakukan
di lingkungan server setelah akses tersedia.
