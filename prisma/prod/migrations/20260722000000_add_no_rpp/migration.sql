-- Migrasi: tambah kolom noRpp (nomor RPP bebas, nullable) + index [guruId, noRpp]
-- di tabel rpp. Additive (aman untuk DB yang sudah ada data).

-- AlterTable
ALTER TABLE `rpp` ADD COLUMN `noRpp` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `rpp_guruId_noRpp_idx` ON `rpp`(`guruId`, `noRpp`);
