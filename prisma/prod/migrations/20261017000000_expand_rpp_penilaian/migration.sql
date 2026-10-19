-- Widen assessment fields accepted by the form. Preserve every existing row.
ALTER TABLE `rpp_penilaian`
    MODIFY COLUMN `pengetahuan` TEXT NOT NULL,
    MODIFY COLUMN `keterampilan` TEXT NOT NULL,
    MODIFY COLUMN `sikap` TEXT NOT NULL;
