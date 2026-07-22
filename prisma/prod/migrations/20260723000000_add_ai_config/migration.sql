-- AlterTable
ALTER TABLE `rpp` ADD COLUMN `dibuatDenganAI` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `pengaturan_ai` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'singleton',
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `endpoint` VARCHAR(191) NULL,
    `apiKeyEnc` TEXT NULL,
    `model` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

