-- ============================================================================
-- mariadb-init.sql — Inisialisasi database MariaDB untuk Sinkronisasi RPP
-- ============================================================================
-- CARA PAKAI:
--   1. Di Coolify, buat database MariaDB sebagai service (dapat DB & user sendiri).
--   2. Buka editor SQL database itu (atau mysql CLI / phpMyAdmin) pada database target.
--   3. Copy-paste SELURUH isi file ini lalu jalankan.
--   4. Deploy aplikasi (Coolify). Saat start, `prisma migrate deploy` akan
--      melihat migrasi `20260721000000_init`, `20260722000000_add_no_rpp`, dan
--      `20260723000000_add_ai_config` sudah tercatat (baris _prisma_migrations
--      di bawah) → dilewati. `db:seed` upsert admin (sudah ada → no-op).
--
-- AKUN ADMIN AWAL:
--   username : admin
--   password : admin123   <-- GANTI SEGERA setelah login (menu Akun → Pengaturan).
--   Email    : admin@gqtunasilmu.sch.id
--   Untuk password lain SEBELUM tempel, generate hash baru:
--     node -e "console.log(require('bcryptjs').hashSync('PASSWORD_ANDA',10))"
--   lalu ganti string $2b$... di INSERT users bawah.
--
-- FALLBACK: jika `prisma migrate deploy` di Coolify melaporkan "drift" (checksum
--   beda), jalankan sekali di container:
--     npx prisma migrate resolve --schema=prisma/prod/schema.prisma --applied 20260721000000_init
--     npx prisma migrate resolve --schema=prisma/prod/schema.prisma --applied 20260722000000_add_no_rpp
--     npx prisma migrate resolve --schema=prisma/prod/schema.prisma --applied 20260723000000_add_ai_config
--   lalu restart. Ini menandai migrasi sebagai applied tanpa cek checksum.
--
-- Idempoten: semua INSERT memakai ON DUPLICATE KEY UPDATE, aman dijalankan ulang.
-- ============================================================================

-- ---------- Skema (init + add_no_rpp + add_ai_config) ----------

CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'KEPALA_SEKOLAH', 'PJ_DINIYYAH', 'GURU') NOT NULL DEFAULT 'GURU',
    `gender` ENUM('IKHWAN', 'AKHWAT') NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `prefNotifOverdue` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gurus` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `namaTampil` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `gurus_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `mapels` (
    `id` VARCHAR(191) NOT NULL,
    `namaMapel` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `mapels_namaMapel_key`(`namaMapel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `kelas` (
    `id` VARCHAR(191) NOT NULL,
    `namaKelas` VARCHAR(191) NOT NULL,
    `semester` VARCHAR(191) NOT NULL,
    `gender` ENUM('IKHWAN', 'AKHWAT') NOT NULL,
    `tahunAjaran` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `guru_mapel` (
    `guruId` VARCHAR(191) NOT NULL,
    `mapelId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`guruId`, `mapelId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `penugasan` (
    `id` VARCHAR(191) NOT NULL,
    `guruId` VARCHAR(191) NOT NULL,
    `mapelId` VARCHAR(191) NOT NULL,
    `kelasId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `penugasan_guruId_mapelId_kelasId_key`(`guruId`, `mapelId`, `kelasId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `rpp` (
    `id` VARCHAR(191) NOT NULL,
    `guruId` VARCHAR(191) NOT NULL,
    `mapelId` VARCHAR(191) NOT NULL,
    `kelasId` VARCHAR(191) NOT NULL,
    `noRpp` VARCHAR(191) NULL,
    `materi` VARCHAR(191) NOT NULL,
    `alokasiWaktu` VARCHAR(191) NOT NULL,
    `tujuanPembelajaran` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'DIAJUKAN', 'DIREVIEW_PJ', 'DISETUJUI_KEPALA') NOT NULL DEFAULT 'DRAFT',
    `tanggalPengesahan` DATETIME(3) NOT NULL,
    `dibuatOleh` VARCHAR(191) NOT NULL,
    `dibuatDenganAI` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rpp_guruId_idx`(`guruId`),
    INDEX `rpp_guruId_noRpp_idx`(`guruId`, `noRpp`),
    INDEX `rpp_mapelId_kelasId_idx`(`mapelId`, `kelasId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pengaturan_ai` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'singleton',
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `endpoint` VARCHAR(191) NULL,
    `apiKeyEnc` TEXT NULL,
    `model` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `rpp_pertemuan` (
    `id` VARCHAR(191) NOT NULL,
    `rppId` VARCHAR(191) NOT NULL,
    `urutan` INTEGER NOT NULL,
    `isiKegiatan` VARCHAR(191) NOT NULL,

    INDEX `rpp_pertemuan_rppId_idx`(`rppId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `rpp_penilaian` (
    `id` VARCHAR(191) NOT NULL,
    `rppId` VARCHAR(191) NOT NULL,
    `pengetahuan` VARCHAR(191) NOT NULL,
    `keterampilan` VARCHAR(191) NOT NULL,
    `sikap` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `rpp_penilaian_rppId_key`(`rppId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `rpp_log_status` (
    `id` VARCHAR(191) NOT NULL,
    `rppId` VARCHAR(191) NOT NULL,
    `statusLama` ENUM('DRAFT', 'DIAJUKAN', 'DIREVIEW_PJ', 'DISETUJUI_KEPALA') NULL,
    `statusBaru` ENUM('DRAFT', 'DIAJUKAN', 'DIREVIEW_PJ', 'DISETUJUI_KEPALA') NOT NULL,
    `olehUserId` VARCHAR(191) NOT NULL,
    `catatan` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `rpp_log_status_rppId_idx`(`rppId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `rpp_export` (
    `id` VARCHAR(191) NOT NULL,
    `rppId` VARCHAR(191) NOT NULL,
    `tipeFile` ENUM('IMAGE', 'PDF', 'DOCX') NOT NULL,
    `pathFile` VARCHAR(191) NOT NULL,
    `hash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `rpp_export_rppId_tipeFile_key`(`rppId`, `tipeFile`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `jadwal` (
    `id` VARCHAR(191) NOT NULL,
    `penugasanId` VARCHAR(191) NOT NULL,
    `hari` ENUM('SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'AHAD') NOT NULL,
    `jamMulai` VARCHAR(191) NOT NULL,
    `jamSelesai` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `jadwal_penugasanId_idx`(`penugasanId`),
    UNIQUE INDEX `jadwal_penugasanId_hari_jamMulai_key`(`penugasanId`, `hari`, `jamMulai`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `notifikasi` (
    `id` VARCHAR(191) NOT NULL,
    `tipe` ENUM('BROADCAST', 'HELP') NOT NULL,
    `dariUserId` VARCHAR(191) NULL,
    `untukRole` ENUM('SEMUA', 'ADMIN', 'KEPALA_SEKOLAH', 'PJ_DINIYYAH', 'GURU') NULL,
    `untukUserId` VARCHAR(191) NULL,
    `judul` VARCHAR(191) NOT NULL,
    `isi` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifikasi_untukRole_idx`(`untukRole`),
    INDEX `notifikasi_untukUserId_idx`(`untukUserId`),
    INDEX `notifikasi_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `notifikasi_dibaca` (
    `userId` VARCHAR(191) NOT NULL,
    `notifikasiId` VARCHAR(191) NOT NULL,
    `readAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifikasi_dibaca_notifikasiId_idx`(`notifikasiId`),
    PRIMARY KEY (`userId`, `notifikasiId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `gurus` ADD CONSTRAINT `gurus_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `guru_mapel` ADD CONSTRAINT `guru_mapel_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `gurus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `guru_mapel` ADD CONSTRAINT `guru_mapel_mapelId_fkey` FOREIGN KEY (`mapelId`) REFERENCES `mapels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `penugasan` ADD CONSTRAINT `penugasan_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `gurus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `penugasan` ADD CONSTRAINT `penugasan_mapelId_fkey` FOREIGN KEY (`mapelId`) REFERENCES `mapels`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `penugasan` ADD CONSTRAINT `penugasan_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `rpp` ADD CONSTRAINT `rpp_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `gurus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `rpp` ADD CONSTRAINT `rpp_mapelId_fkey` FOREIGN KEY (`mapelId`) REFERENCES `mapels`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `rpp` ADD CONSTRAINT `rpp_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `rpp` ADD CONSTRAINT `rpp_dibuatOleh_fkey` FOREIGN KEY (`dibuatOleh`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `rpp_pertemuan` ADD CONSTRAINT `rpp_pertemuan_rppId_fkey` FOREIGN KEY (`rppId`) REFERENCES `rpp`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `rpp_penilaian` ADD CONSTRAINT `rpp_penilaian_rppId_fkey` FOREIGN KEY (`rppId`) REFERENCES `rpp`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `rpp_log_status` ADD CONSTRAINT `rpp_log_status_rppId_fkey` FOREIGN KEY (`rppId`) REFERENCES `rpp`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `rpp_log_status` ADD CONSTRAINT `rpp_log_status_olehUserId_fkey` FOREIGN KEY (`olehUserId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `rpp_export` ADD CONSTRAINT `rpp_export_rppId_fkey` FOREIGN KEY (`rppId`) REFERENCES `rpp`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `jadwal` ADD CONSTRAINT `jadwal_penugasanId_fkey` FOREIGN KEY (`penugasanId`) REFERENCES `penugasan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_dariUserId_fkey` FOREIGN KEY (`dariUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_untukUserId_fkey` FOREIGN KEY (`untukUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `notifikasi_dibaca` ADD CONSTRAINT `notifikasi_dibaca_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `notifikasi_dibaca` ADD CONSTRAINT `notifikasi_dibaca_notifikasiId_fkey` FOREIGN KEY (`notifikasiId`) REFERENCES `notifikasi`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- Tabel internal Prisma + penanda migrasi sudah diterapkan ----------
-- Mencegah `prisma migrate deploy` di Coolify menjalankan ulang init (checksum
-- = sha256 isi prisma/prod/migrations/20260721000000_init/migration.sql).
CREATE TABLE `_prisma_migrations` (
    `id` VARCHAR(36) NOT NULL,
    `checksum` VARCHAR(64) NOT NULL,
    `finished_at` DATETIME(3) NOT NULL,
    `migration_name` VARCHAR(255) NOT NULL,
    `logs` TEXT,
    `rolled_back_at` DATETIME(3),
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `applied_steps_count` INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`)
VALUES (
    '6ed3c3bb-1bf6-4481-adcc-9869dfa34268',
    '6c8c0d9207430b1ef28b3e9caa5011b421c982fe80e7f009a641871b9fbc4d0a',
    NOW(3), '20260721000000_init', NULL, NULL, NOW(3), 1
)
ON DUPLICATE KEY UPDATE `checksum` = VALUES(`checksum`);

-- Penanda migrasi add_no_rpp sudah diterapkan (checksum = sha256 isi
-- prisma/prod/migrations/20260722000000_add_no_rpp/migration.sql).
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`)
VALUES (
    'afec453f-4386-4b3a-b56c-65f6864c6466',
    '0a7e451c90d11ce2a81641d9e0caed217a2f1771533f7fe2b7c3af52e1000b71',
    NOW(3), '20260722000000_add_no_rpp', NULL, NULL, NOW(3), 1
)
ON DUPLICATE KEY UPDATE `checksum` = VALUES(`checksum`);

-- Penanda migrasi add_ai_config sudah diterapkan (checksum = sha256 isi
-- prisma/prod/migrations/20260723000000_add_ai_config/migration.sql).
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`)
VALUES (
    '95c87d6d-6c5b-4998-9017-d8e78f30511d',
    'fad2a62f135c4569603446378c796c85c86eabd7c8c324f2bd6d17a50f9376c6',
    NOW(3), '20260723000000_add_ai_config', NULL, NULL, NOW(3), 1
)
ON DUPLICATE KEY UPDATE `checksum` = VALUES(`checksum`);

-- ---------- Data seed ----------
-- Admin (password default admin123 — GANTI setelah login).
-- Hash di bawah = bcrypt(admin123). Generate hash baru lihat komentar di atas.
INSERT INTO `users` (`id`, `nama`, `email`, `username`, `passwordHash`, `role`, `gender`, `aktif`, `prefNotifOverdue`, `updatedAt`)
VALUES (
    'admin-seed-0001',
    'Administrator',
    'admin@gqtunasilmu.sch.id',
    'admin',
    '$2b$10$phc14RVc/vqZdP3.H9xzTui3wjXidcWzm7xIvkPq3R7Md774QfEPG',
    'ADMIN', NULL, TRUE, TRUE, NOW(3)
)
ON DUPLICATE KEY UPDATE `username` = `username`;

-- Data contoh (boleh dihapus di produksi):
INSERT INTO `mapels` (`id`, `namaMapel`) VALUES ('mapel-alquran-0001', 'Al-Qur''an')
ON DUPLICATE KEY UPDATE `namaMapel` = `namaMapel`;

INSERT INTO `kelas` (`id`, `namaKelas`, `semester`, `gender`, `tahunAjaran`)
VALUES ('kelas-contoh-ikhwan-1', '1 Ikhwan', 'Ganjil', 'IKHWAN', '2026/2027')
ON DUPLICATE KEY UPDATE `namaKelas` = `namaKelas`;