-- CreateTable
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

-- CreateTable
CREATE TABLE `gurus` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `namaTampil` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `gurus_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mapels` (
    `id` VARCHAR(191) NOT NULL,
    `namaMapel` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `mapels_namaMapel_key`(`namaMapel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kelas` (
    `id` VARCHAR(191) NOT NULL,
    `namaKelas` VARCHAR(191) NOT NULL,
    `semester` VARCHAR(191) NOT NULL,
    `gender` ENUM('IKHWAN', 'AKHWAT') NOT NULL,
    `tahunAjaran` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guru_mapel` (
    `guruId` VARCHAR(191) NOT NULL,
    `mapelId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`guruId`, `mapelId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penugasan` (
    `id` VARCHAR(191) NOT NULL,
    `guruId` VARCHAR(191) NOT NULL,
    `mapelId` VARCHAR(191) NOT NULL,
    `kelasId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `penugasan_guruId_mapelId_kelasId_key`(`guruId`, `mapelId`, `kelasId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rpp` (
    `id` VARCHAR(191) NOT NULL,
    `guruId` VARCHAR(191) NOT NULL,
    `mapelId` VARCHAR(191) NOT NULL,
    `kelasId` VARCHAR(191) NOT NULL,
    `materi` VARCHAR(191) NOT NULL,
    `alokasiWaktu` VARCHAR(191) NOT NULL,
    `tujuanPembelajaran` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'DIAJUKAN', 'DIREVIEW_PJ', 'DISETUJUI_KEPALA') NOT NULL DEFAULT 'DRAFT',
    `tanggalPengesahan` DATETIME(3) NOT NULL,
    `dibuatOleh` VARCHAR(191) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rpp_guruId_idx`(`guruId`),
    INDEX `rpp_mapelId_kelasId_idx`(`mapelId`, `kelasId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rpp_pertemuan` (
    `id` VARCHAR(191) NOT NULL,
    `rppId` VARCHAR(191) NOT NULL,
    `urutan` INTEGER NOT NULL,
    `isiKegiatan` VARCHAR(191) NOT NULL,

    INDEX `rpp_pertemuan_rppId_idx`(`rppId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rpp_penilaian` (
    `id` VARCHAR(191) NOT NULL,
    `rppId` VARCHAR(191) NOT NULL,
    `pengetahuan` VARCHAR(191) NOT NULL,
    `keterampilan` VARCHAR(191) NOT NULL,
    `sikap` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `rpp_penilaian_rppId_key`(`rppId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE `notifikasi_dibaca` (
    `userId` VARCHAR(191) NOT NULL,
    `notifikasiId` VARCHAR(191) NOT NULL,
    `readAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifikasi_dibaca_notifikasiId_idx`(`notifikasiId`),
    PRIMARY KEY (`userId`, `notifikasiId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `gurus` ADD CONSTRAINT `gurus_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guru_mapel` ADD CONSTRAINT `guru_mapel_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `gurus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guru_mapel` ADD CONSTRAINT `guru_mapel_mapelId_fkey` FOREIGN KEY (`mapelId`) REFERENCES `mapels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penugasan` ADD CONSTRAINT `penugasan_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `gurus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penugasan` ADD CONSTRAINT `penugasan_mapelId_fkey` FOREIGN KEY (`mapelId`) REFERENCES `mapels`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penugasan` ADD CONSTRAINT `penugasan_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rpp` ADD CONSTRAINT `rpp_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `gurus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rpp` ADD CONSTRAINT `rpp_mapelId_fkey` FOREIGN KEY (`mapelId`) REFERENCES `mapels`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rpp` ADD CONSTRAINT `rpp_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rpp` ADD CONSTRAINT `rpp_dibuatOleh_fkey` FOREIGN KEY (`dibuatOleh`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rpp_pertemuan` ADD CONSTRAINT `rpp_pertemuan_rppId_fkey` FOREIGN KEY (`rppId`) REFERENCES `rpp`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rpp_penilaian` ADD CONSTRAINT `rpp_penilaian_rppId_fkey` FOREIGN KEY (`rppId`) REFERENCES `rpp`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rpp_log_status` ADD CONSTRAINT `rpp_log_status_rppId_fkey` FOREIGN KEY (`rppId`) REFERENCES `rpp`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rpp_log_status` ADD CONSTRAINT `rpp_log_status_olehUserId_fkey` FOREIGN KEY (`olehUserId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rpp_export` ADD CONSTRAINT `rpp_export_rppId_fkey` FOREIGN KEY (`rppId`) REFERENCES `rpp`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jadwal` ADD CONSTRAINT `jadwal_penugasanId_fkey` FOREIGN KEY (`penugasanId`) REFERENCES `penugasan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_dariUserId_fkey` FOREIGN KEY (`dariUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_untukUserId_fkey` FOREIGN KEY (`untukUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifikasi_dibaca` ADD CONSTRAINT `notifikasi_dibaca_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifikasi_dibaca` ADD CONSTRAINT `notifikasi_dibaca_notifikasiId_fkey` FOREIGN KEY (`notifikasiId`) REFERENCES `notifikasi`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

