-- AlterTable
ALTER TABLE `users` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `gurus` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `mapels` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `kelas` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `penugasan` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `rpp_pertemuan` ADD COLUMN `tanggal` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `jadwal` ADD COLUMN `deletedAt` DATETIME(3) NULL;

