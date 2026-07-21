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

> Generate `NEXTAUTH_SECRET` di terminal VPS: `openssl rand -base64 32`.

## 4. Persistent storage (penting)

File export RPP (PNG/PDF/DOCX) ditulis ke folder lokal di container
(lihat `lib/rpp/export.ts`, `EXPORT_DIR`). Tanpa volume, file hilang tiap
redeploy. Di Coolify:

- **Application → Persistent Storage → Add Volume**, mount path mis. `/app/public/exports`
  (sesuaikan dengan `EXPORT_DIR` di `lib/rpp/export.ts`).

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