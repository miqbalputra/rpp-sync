# Progress — Aplikasi Sinkronisasi RPP
**Griya Qur'an "Tunas Ilmu" — Purbalingga**

Terakhir diperbarui: 2026-07-21

## Status keseluruhan

**MVP 100% selesai — Tahap 0 sampai 11. Tahap 12 (deploy) artefak siap; tinggal eksekusi di Coolify.**

## Ringkasan tahap

| Tahap | Fokus | Status |
|---|---|---|
| 0 | Setup proyek (Next 16 + Prisma 6 + NextAuth v5) | ✅ |
| 1 | Skema DB & migrasi (sesuai PRD §6) | ✅ |
| 2 | Autentikasi & RBAC per role | ✅ |
| 3 | Master data Admin (User, Mapel, Kelas, Penugasan) | ✅ |
| 4 | Form RPP dinamis (RHF + Zod, multi-pertemuan) | ✅ |
| 5 | Soft delete & Recycle Bin | ✅ |
| 6 | Referensi antar guru + duplikat draft | ✅ |
| 7 | Export Gambar (PNG) & PDF (Puppeteer) | ✅ |
| 8 | Export Word (.docx) | ✅ |
| 9 | Share via WhatsApp | ✅ |
| 10 | Dashboard ringkas per role | ✅ |
| 11 | Uji menyeluruh & polish | ✅ |
| 12 | Deploy | 🟦 artefak siap (repo + Dockerfile + SQL), eksekusi di Coolify |

## Verifikasi yang sudah dilakukan

- `tsc --noEmit` → bersih, tanpa error tipe
- `next build` → sukses, semua route terbangun
- Smoke test HTTP 200: `/admin`, `/admin/users`, `/admin/penugasan`, `/admin/recycle-bin`, `/guru`, `/guru/rpp`, detail RPP, `/guru/referensi`
- RBAC: guru ke `/admin` → `/akses-ditolak`; export/detail RPP milik guru lain → 403/404; file export publik tetap bisa diakses tanpa login
- Edge cases: guru tanpa penugasan → pesan ramah; siklus hapus-restore berulang → OK; export 3 format → file valid
- Soft delete + restore + hapus permanen (dengan konfirmasi ganda) → OK
- Referensi filter + duplikat sebagai draft → OK
- Share WhatsApp → wa.me terbuka dengan pesan + link file publik

## Akun demo (database dev)

- **Admin** — `admin@gqtunasilmu.sch.id` / `admin123`
- **Guru** (Ustadz Ahmad) — `ahmad@gqtunasilmu.sch.id` / `rahasia123`
  - Penugasan: Al-Qur'an → 1 Ikhwan
  - 1 RPP contoh: "Surat Al-Fatihah & Basmalah"

## Deviasi & catatan dari PRD

1. **Database**: pakai **SQLite** untuk dev (keputusan user), bukan MariaDB (PRD §7).
   Skema portable — tinggal ganti provider ke `mysql` + sesuaikan `DATABASE_URL` saat deploy.
2. **Template gambar RPP**: layout export masih **placeholder** (sesuai rencana).
   Menunggu gambar template asli dari user; setelah itu sesuaikan `lib/rpp/template.ts` & `lib/rpp/docx.ts`.
3. **Role Kepala Sekolah & PJ Diniyyah**: skema + RBAC siap, UI/alur approval penuh
   ditangguhkan ke **v1.2** (sesuai PRD §10 Tahap 11 & Fase Lanjutan). Dashboard sementara menampilkan placeholder "fitur akan aktif penuh di v1.2".

## Stack teknis

- Next.js 16.2.10 (App Router, Turbopack), React 19, Tailwind CSS 4
- TypeScript strict, path alias `@/*` → root
- Prisma 6.19.3 (provider sqlite untuk dev) + `@prisma/client`
- NextAuth v5 (CredentialsProvider, JWT, session callback augmentasi role/id/gender)
- React Hook Form 7 + Zod 4 + `@hookform/resolvers`
- bcryptjs (hash password)
- Puppeteer 25 (export gambar/PDF), `docx` (export Word)
- Soft delete (`deletedAt`), RBAC via `proxy.ts` (Next 16 mengganti `middleware.ts`)
- Cache invalidasi export via tabel `RppExport` (content hash)

## Yang belum dilakukan / perlu keputusan user

1. **Tahap 12 (deploy)** — di luar rencana awal; butuh konfirmasi user.
2. **Template gambar RPP** — menunggu gambar asli untuk menyelaraskan layout export.
3. **Uji manual di browser** — form-submit via UI & tampilan responsif (HP) belum diklik-klik
   manual oleh user. Class responsif Tailwind sudah dipasang, tapi perlu verifikasi visual.

## Peningkatan UI (2026-07-21)

Redesign UI penuh: sistem desain tokenized ala shadcn/ui + palet emerald refined.

- **Foundation** — `globals.css` jadi design-token system (CSS vars: `--primary`,
  `--background`, `--card`, `--border`, `--ring`, dst.) satu titik re-color seluruh app.
  Hapus dark-mode `prefers-color-scheme` default Next yang memaksa hitam. Font Geist dipakai
  konsisten. Metadata root diperbaiki (bukan lagi "Create Next App").
- **Komponen dasar** (`components/ui/`): `button` (cva variants), `input`, `label`, `card`,
  `badge`, `table`, `dialog`, `alert-dialog`, `dropdown-menu`. `lib/utils.ts` `cn()`.
  Deps: `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`,
  `tw-animate-css`, `@radix-ui/*` (dialog/alert-dialog/dropdown/label/slot/avatar).
- **Chrome bersama** — `components/Sidebar.tsx` (client): sidebar desktop fixed + topbar
  mobile dengan dropdown menu, ikon Lucide, highlight link aktif via `usePathname`.
  Layout admin & guru disatukan. Ikon emoji diganti Lucide.
- **Halaman** — login split-layout (panel branding + show/hide password + loading),
  dashboard admin stat-card berikon + hover, semua tabel admin pakai `Table`+`Badge`,
  daftar RPP guru jadi card, form RPP di-tokenize, halaman detail dengan tombol export
  berikon, referensi, kepala/pj placeholder dipoles, akses-ditolak dipoles.
- **Interaktivitas** — konfirmasi hapus pakai `AlertDialog` (ganti `confirm()` native),
  transisi/hover pada card & tombol, sidebar responsif.

Catatan teknis penting:
- `components/ui/button.tsx` **tanpa** `"use client"` agar `buttonVariants` (cva) bisa
  dipanggil dari server component (dipakai di `admin/ui.tsx` & halaman guru). Build lolos
  tapi page dinamis error saat runtime kalau `buttonVariants` berada di modul client.
- Ikon Lucide **tidak boleh** dilewatkan sebagai prop dari server→client (Sidebar
  membangun nav array sendiri di modul client, di-key per `variant`).
- Server action logout diekstrak ke `lib/auth-actions.ts` (`"use server"`) supaya bisa
  dipakai dari komponen client tanpa ambiguitas bundler.

## Verifikasi pasca-redesign

- `tsc --noEmit` → bersih
- `next build` → sukses (22 route)
- Smoke HTTP: `/login` 200, `/akses-ditolak` 200, route terproteksi 307→login (belum sesi)
- Render runtime (sesi login): `/admin`, `/admin/users`, `/admin/recycle-bin`, `/guru`,
  `/guru/rpp`, `/guru/referensi` → semua **200** (sebelumnya sempat 500 akibat bug
  `buttonVariants`/ikon lintas batas server→client, sudah diperbaiki)

## Cara menjalankan

```bash
npm run dev          # dev server di http://localhost:3000
npx prisma studio    # lihat data DB
npx prisma db seed   # reseed data awal (jika perlu)
```

## Migrasi desain ke TailAdmin (2026-07-21)

Mengganti design system shadcn/emerald menjadi **TailAdmin** (free-react-tailwind-admin-dashboard):
brand indigo `#465fff`, gray scale (25→950) + `gray-dark #1a2231`, skala success/error/warning,
font **Outfit**, shadow token `theme-xs/sm/md/lg/xl`, dark mode via kelas `.dark`.

- **Fondasi (`app/globals.css` + `app/layout.tsx`)** — `@theme` penuh brand/gray/success/
  error/warning + `theme-*` shadow & radius; alias semantik `:root` & `.dark`
  (`--primary: brand-500`, `--background: gray-50`/`gray-dark`, `--card`, `--border`,
  `--muted-foreground`, dst.) dipetakan via `@theme inline`. `@utility` sidebar TailAdmin
  (`menu-item`, `menu-item-active/inactive`, `menu-item-icon-*`, `menu-dropdown-item-*`,
  `no-scrollbar`, `custom-scrollbar`). Font Outfit via `next/font/google` (var
  `--font-outfit-app`), inline no-FOUC theme script. Provider client baru:
  `context/ThemeContext.tsx` (toggle light/dark, sync `documentElement.classList`) &
  `context/SidebarContext.tsx` (collapse desktop + drawer mobile + hover-expand).
- **Komponen UI** — `button`, `input`, `card`, `badge`, `table`, `dialog`,
  `alert-dialog`, `dropdown-menu` di-reskin ke kelas TailAdmin (brand-500, gray-200/800,
  rounded-2xl, shadow-theme-*, dark variants). `button.tsx` tetap **tanpa** `"use client"`
  (agar `buttonVariants` callable dari server component — catatan teknis di atas masih berlaku).
- **Chrome TailAdmin** — `components/Sidebar.tsx` dirombak: collapsible desktop 290px↔90px
  + hover-expand (overlay z-40 + shadow), drawer mobile off-canvas, logo + label collapse,
  nav pakai `menu-item` utilities. Baru: `components/AppHeader.tsx` (sticky, hamburger
  toggle collapse/drawer, theme toggle sun/moon, user dropdown avatar + logout) dan
  `components/AppShell.tsx` (client orchestrator — atur `marginLeft` konten 290/90 + backdrop
  drawer). Layout admin & guru disederhanakan jadi `<AppShell variant user>{children}</AppShell>`.
- **Halaman** — dashboard admin stat-card pakai skala brand/success/warning/error + dark;
  login jadi auth-card berbingkai (rounded-2xl border shadow-theme-md) + panel branding indigo;
  akses-ditolak dipoles; banner error di seluruh app (`rose-*` → `error-*` + dark variants).

Catatan teknis tambahan:
- `SidebarContext` dipasang di **root layout** (`app/layout.tsx`) bersama `ThemeProvider`,
  sehingga `AppShell`/`Sidebar`/`AppHeader` (semua client) dapat membaca state collapse/drawer.
- Margin konten utama diatur via inline style di `AppShell` (290/90/0) karena lebar sidebar
  dinamis — tidak bisa pakai kelas statis Tailwind. Transisi `duration-300` di kedua sisi.
- `useTheme` dipasang di `AppHeader`; nilai awal disinkronkan dengan kelas `.dark` yang sudah
  dipasang inline script (anti-hydration-mismatch via `suppressHydrationWarning`).

## Verifikasi pasca-migrasi TailAdmin

- `tsc --noEmit` → bersih
- `next build` → sukses (22 route)
- Smoke HTTP: `/login` 200, `/akses-ditolak` 200, route terproteksi 307→login (belum sesi)
- Dev server compiles clean (no 500 / module errors) — sesi login driven by browser.

## Fitur baru: Menu Akun + Jadwal Mengajar + Notifikasi (2026-07-21)

Tiga fitur greenfield di atas chrome TailAdmin:

1. **Menu akun (pojok kanan atas, semua role)** — dropdown user diperluas:
   **Edit Profil** (`/akun/profil` — nama/email/username/gender), **Pengaturan Akun**
   (`/akun/pengaturan` — ubah password + preferensi notifikasi `prefNotifOverdue`),
   **Bantuan** (`/akun/bantuan` — compose pesan ke Admin / PJ Diniyyah / keduanya,
   2-way via tabel notifikasi). `lib/user.ts` baru (`ensureGuruProfile`) menyinkronkan
   `Guru.namaTampil` saat role=GURU; dipakai `app/akun/actions.ts` & `app/admin/users/actions.ts`.
2. **Jadwal Mengajar** (Admin & PJ) — menu baru di sidebar (`/jadwal`, `/jadwal/baru`):
   slot hari + jam per Penugasan (guru↔mapel↔kelas). `@@unique([penugasanId,hari,jamMulai])`.
   **Trigger overdue on-demand**: saat guru load app/buka notifikasi, `getOverdueAlertsForGuru`
   memetakan `Date.getDay()`→`Hari`, mencari jadwal hari ini `jamMulai <= now`, dan mengecek
   keberadaan Rpp (guru+mapel+kelas, `deletedAt null`) via batch indexed Set. Slot tanpa RPP
   → peringatan di lonceng notifikasi guru. Tidak ada scheduler/cron (SQLite self-hosted).
3. **Lonceng notifikasi** (di samping toggle dark/light, semua role) — `NotificationBell`
   (client): badge jumlah belum dibaca + (untuk GURU) kartu overdue RPP; daftar pesan dari
   Admin/Kepala Sekolah/PJ; "Tandai semua dibaca" (`useTransition`→server action→
   `router.refresh`); "Tulis pesan" Dialog (hanya sender: ADMIN/KEPALA_SEKOLAH/PJ_DINIYYAH)
   compose broadcast `untukRole` SEMUA/GURU/ADMIN/KEPALA_SEKOLAH/PJ_DINIYYAH. Halaman penuh
   `/notifikasi`.

### Skema & RBAC
- Enum baru: `Hari`, `NotifikasiTipe` (BROADCAST, HELP), `NotifikasiAudience`
  (SEMUA, ADMIN, KEPALA_SEKOLAH, PJ_DINIYYAH, GURU). Model baru: `Jadwal`, `Notifikasi`,
  `NotifikasiDibaca` (composite `@@id([userId,notifikasiId])`). `User.prefNotifOverdue`.
  Migrasi `add_jadwal_notifikasi_akun`.
- `proxy.ts`: prefix `/jadwal` (ADMIN, PJ_DINIYYAH), `/akun` & `/notifikasi` (4 role).
- `lib/auth-guard.ts`: `requireKepala`, `requirePj`, `requireAdminOrPj`, `requireSender`.

### Chrome diperluas ke 4 role
`AppShell`/`Sidebar`/`AppHeader` kini support variant `kepala` & `pj` (sebelumnya hanya
`admin` & `guru). Layout `app/kepala/layout.tsx` & `app/pj/layout.tsx` baru; semua layout
memuat `getNotifikasiDataForSession` → props serializable ke `NotificationBell` (`createdAt`
ISO string, tanpa instance Prisma).

### Catatan teknis
- `skipDuplicates` **tidak ada** di `CreateManyArgs` Prisma 6.19 client yang ter-generate —
  `tandaiSemuaDibaca` pakai `$transaction` + `upsert` per item (bukan `createMany`).
- `audienceWhere` di-tipe eksplisit `Prisma.NotifikasiWhereInput`; `user.role` (Role)
  di-cast ke `NotifikasiAudience` (enum berbeda walau nilai string sama) agar `OR` union
  tidak kolaps ke `never`.
- Server action notifikasi split: `kirimBroadcast` & `tandai*` return `{ok}` (Dialog UX);
  `kirimHelp` redirect-based (form native di halaman bantuan) — sesuai pola penugasan.

## Verifikasi pasca-fitur baru

- `tsc --noEmit` → bersih
- `next build` → sukses (36 route: +`/jadwal`, `/jadwal/baru`, `/akun/{profil,pengaturan,bantuan}`,
  `/notifikasi`, `/kepala`, `/pj`)
- RBAC smoke (server produksi, sesi login nyata):
  - ADMIN: `/jadwal`, `/jadwal/baru`, `/akun/*`, `/notifikasi` → **200**.
  - PJ: `/pj`, `/jadwal`, `/jadwal/baru`, `/notifikasi`, `/akun/bantuan` → **200**; `/admin`, `/kepala` → 307.
  - KEPALA: `/kepala`, `/notifikasi`, `/akun/profil` → **200**; `/jadwal`, `/admin` → 307.
  - GURU (Ustadz Ahmad): `/akun/*`, `/notifikasi` → **200**; `/jadwal` → 307.
  - Lonceng "Notifikasi" ter-render di dashboard keempat role.
- E2E overdue: soft-delete RPP + buat Jadwal (hari ini, `jamMulai<now`) → lonceng guru tampilkan
  peringatan (jamMulai/mapel/kelas muncul di payload RSC); restore RPP → peringatan hilang.
- E2E broadcast: Admin kirim `untukRole=SEMUA` → guru lihat unread=1; "Tandai semua dibaca"
  → unread=0 (NotifikasiDibaca tercatat).
- E2E help: guru kirim ke BOTH → 2 row (ADMIN + PJ_DINIYYAH); Admin & PJ sama-sama lihat;
  daftar "Pesan terkirim" guru menampilkan kedua baris.
- Test artifact (akun PJ/Kepala uji, broadcast, help, jadwal) dibersihkan; DB dev kembali
  ke kondisi awal (2 RPP aktif, tidak ada jadwal/notifikasi, hanya akun ADMIN+GURU).

## Fitur: form Penugasan & Jadwal ber-cascade (2026-07-21)

Form "tugas mengajar" kini saling terhubung (mapel → guru → kelas → jadwal), sumber
filter = data Penugasan yang sudah ada (sesuai pola form RPP).

- **Form Jadwal (`/jadwal/baru`)** — diganti dari dropdown penugasan datar menjadi
  cascade: pilih **Guru** → **Mapel** tersaring (mapel yang diajar guru itu) →
  **Kelas** tersaring (untuk guru+mapel itu) → `penugasanId` disimpulkan otomatis
  (hidden field) → baru atur Hari & Jam. Komponen client baru
  `app/jadwal/baru/JadwalForm.tsx`; query baru `getPenugasanTreeForJadwal`
  (`lib/jadwal/queries.ts`) mengembalikan node `{id, guruId, guruNama, guruGender,
  mapelId, mapelNama, kelasId, kelasNama, kelasGender}`. Tiap langkah disable sampai
  langkah sebelumnya dipilih.
- **Form Penugasan (`/admin/penugasan/baru`)** — cascade: pilih **Guru** → **Kelas**
  tersaring sesuai gender guru (PRD §5.4) + checkbox "Tampilkan kelas lintas gender"
  untuk pengecualian; **Mapel** aktif setelah guru dipilih. Deteksi duplikat
  (guru+mapel+kelas sudah ada) → peringatan inline + tombol Simpan dinonaktifkan
  (safety-net P2002 di server tetap ada). Komponen client baru
  `app/admin/penugasan/baru/PenugasanForm.tsx`.
- Server action tidak diubah — tetap baca `penugasanId` (Jadwal) /
  `guruId,mapelId,kelasId` (Penugasan) dari FormData; validasi Zod + RBAC tetap berlaku.

Verifikasi: `tsc --noEmit` bersih, `next build` sukses (36 route).

## Tahap 12 — Artefak deploy Coolify + MariaDB (2026-07-21)

Mempersiapkan deploy self-hosted via **Coolify** di VPS (PRD §7: VPS + Node + MariaDB),
tanpa mengubah pengalaman dev SQLite. Repo di-push ke
`https://github.com/miqbalputra/rpp-sync.git` (branch `main`, 3 commit).

### Pendekatan dual-schema (dev SQLite tetap, prod MariaDB)
- `prisma/schema.prisma` — **dev** (SQLite, `npm run dev` tidak berubah).
- `prisma/prod/schema.prisma` — **produksi** (provider `mysql`), mirror schema dev.
- `prisma/prod/migrations/20260721000000_init/migration.sql` — DDL MySQL digenerate
  via `prisma migrate diff --from-empty --to-schema-datamodel` (tanpa koneksi DB).
  `migration_lock.toml` provider=mysql.
- `@prisma/client` di-generate untuk provider sesuai environment: dev `prisma generate`
  (sqlite), Coolify build `prisma generate --schema=prisma/prod/schema.prisma` (mysql).
  Kode app identik (API Prisma sama, skema portabel tanpa `@db.*`).
- Catatan维护: saat ubah model, ubah **kedua** file skema + regenerasi migrasi dev
  (`npm run db:migrate`) dan prod (lihat komentar di `prisma/prod/schema.prisma`).

### Dockerfile (Coolify, build dari repo)
- Base `node:20-bookworm-slim` + **chromium sistem** (apt) untuk export Puppeteer
  (PDF/gambar) — `PUPPETEER_SKIP_DOWNLOAD=true`, `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`.
  `--no-sandbox` dsb. sudah dipasang di `lib/rpp/export.ts` `launchBrowser()`.
- Build: `npm ci` → `prisma generate --schema=prisma/prod/schema.prisma` → `next build`.
- CMD (tini): `NODE_ENV=production prisma migrate deploy --schema=prisma/prod/schema.prisma`
  → `NODE_ENV=production npm run db:seed` → `next start -H 0.0.0.0 -p ${PORT:-3000}`.
- `.dockerignore` mengecualikan `node_modules`, `.next`, `.git`, `.env*` (kecuali
  `.env.production.example`), `dev.db`, `.devlog.txt`.

### Seed prod-aware (`prisma/seed.ts`)
- `NODE_ENV=production`: password admin dari env `ADMIN_PASSWORD` (Wajib diset);
  data contoh (Mapel "Al-Qur'an" + Kelas "1 Ikhwan") hanya dibuat bila `SEED_DEMO=true`.
- Dev: perilaku lama (`admin123` + data contoh). Upsert → idempoten (aman dijalankan
  ulang tiap restart container).

### `mariadb-init.sql` — inisialisasi DB siap copy-paste
Alternatif init manual (selain auto-migrate saat container start). Satu file berisi:
- Seluruh `CREATE TABLE` + FK (identik `prisma/prod/migrations/.../migration.sql`).
- Tabel `_prisma_migrations` + 1 baris penanda migrasi `20260721000000_init` sudah
  applied, lengkap dengan **checksum = sha256 isi migration.sql**
  (`6c8c0d9207430b1ef28b3e9caa5011b421c982fe80e7f009a641871b9fbc4d0a`) — agar
  `prisma migrate deploy` di Coolify melihat migrasi sudah tercatat → no-op, tidak
  bentrok dengan init manual.
- Seed idempoten (`ON DUPLICATE KEY UPDATE`): admin (bcrypt `admin123`, hash
  diverifikasi via `bcryptjs.compareSync`), Mapel, Kelas contoh.
- Header: cara pakai, cara ganti password sebelum tempel (one-liner bcryptjs), dan
  fallback `prisma migrate resolve --applied 20260721000000_init` bila drift.

### Lain
- `.gitattributes`: `*.sql`/`*.prisma` paksa LF → checksum migrasi konsisten lintas
  platform (Windows dev vs Linux container).
- `.env.production.example`: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`,
  `ADMIN_PASSWORD`, `SEED_DEMO`.
- `DEPLOY.md`: panduan langkah-demi-langkah Coolify (MariaDB service, app dari repo,
  env vars, persistent volume untuk `EXPORT_DIR`, domain/HTTPS, pasca-deploy) +
  seksi 6b opsi init DB manual via `mariadb-init.sql`.
- `package.json`: script `db:generate:prod`, `db:migrate:prod`.
- Git di-init (sebelumnya bukan repo); `.env` & `dev.db` ter-ignore, tidak ter-commit.

### Verifikasi pasca-artefak deploy
- `tsc --noEmit` → bersih; `next build` → sukses (36 route).
- `prisma migrate diff` menghasilkan DDL MySQL valid; `sha256sum migration.sql` =
  checksum yang dicantumkan di `mariadb-init.sql`.
- bcrypt hash admin diverifikasi: `compareSync('admin123', hash)` → true.
- **Belum dilakukan**: build Docker lokal (env Windows tanpa Docker) — resep standar,
  verifikasi pada build pertama di Coolify; uji menyalurkan ke MariaDB sungguhan.

### Yang masih perlu tindakan user di Coolify
1. Buat database MariaDB service → dapat connection string.
2. Buat Application dari repo `miqbalputra/rpp-sync` (Dockerfile terdeteksi).
3. Set env: `DATABASE_URL` (dari service MariaDB), `NEXTAUTH_URL` (domain sekolah),
   `NEXTAUTH_SECRET` (`openssl rand -base64 32`), `ADMIN_PASSWORD` (wajib).
4. Tambah persistent volume ke `EXPORT_DIR` (lihat `lib/rpp/export.ts`) supaya file
   export tidak hilang tiap redeploy.
5. Deploy. (Opsi: jalankan `mariadb-init.sql` dulu untuk init manual.)
6. Login `admin` + `ADMIN_PASSWORD` (atau `admin123` bila pakai SQL) → ganti password.

### Known limitations (mengikuti catatan deviasi)
- Template gambar/PDF/Word export masih **placeholder** menunggu template asli
  (`lib/rpp/template.ts`, `lib/rpp/docx.ts`).
- Role Kepala Sekolah & PJ Diniyyah: skema + RBAC siap, alur approval penuh
  ditangguhkan ke v1.2.