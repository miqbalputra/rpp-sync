-- Add an explicit source marker while keeping existing RPP rows as manual.
ALTER TABLE `rpp`
    ADD COLUMN `metodeInput` ENUM('MANUAL', 'AI', 'UPLOAD') NOT NULL DEFAULT 'MANUAL';

-- Store uploaded PDF metadata separately from the structured RPP fields.
CREATE TABLE `rpp_file` (
    `id` VARCHAR(191) NOT NULL,
    `rppId` VARCHAR(191) NOT NULL,
    `namaFile` VARCHAR(191) NOT NULL,
    `pathFile` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL DEFAULT 'application/pdf',
    `ukuranByte` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `rpp_file_rppId_key`(`rppId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `rpp_file`
    ADD CONSTRAINT `rpp_file_rppId_fkey`
    FOREIGN KEY (`rppId`) REFERENCES `rpp`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
