-- RPP content fields must accept long, multi-line teaching material.
ALTER TABLE `rpp`
    MODIFY COLUMN `materi` TEXT NOT NULL,
    MODIFY COLUMN `tujuanPembelajaran` TEXT NOT NULL;

ALTER TABLE `rpp_pertemuan`
    MODIFY COLUMN `isiKegiatan` TEXT NOT NULL;
