-- Store one active Program Semester link per Mapel + Kelas pair.
CREATE TABLE `promes` (
    `id` VARCHAR(191) NOT NULL,
    `mapelId` VARCHAR(191) NOT NULL,
    `kelasId` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `promes_mapelId_kelasId_key`(`mapelId`, `kelasId`),
    INDEX `promes_kelasId_mapelId_idx`(`kelasId`, `mapelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `promes`
    ADD CONSTRAINT `promes_mapelId_fkey`
    FOREIGN KEY (`mapelId`) REFERENCES `mapels`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `promes`
    ADD CONSTRAINT `promes_kelasId_fkey`
    FOREIGN KEY (`kelasId`) REFERENCES `kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
