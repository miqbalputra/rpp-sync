-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'GURU',
    "gender" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "gurus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "namaTampil" TEXT NOT NULL,
    CONSTRAINT "gurus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mapels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaMapel" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "kelas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaKelas" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "tahunAjaran" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "guru_mapel" (
    "guruId" TEXT NOT NULL,
    "mapelId" TEXT NOT NULL,

    PRIMARY KEY ("guruId", "mapelId"),
    CONSTRAINT "guru_mapel_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "gurus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guru_mapel_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "mapels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "penugasan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guruId" TEXT NOT NULL,
    "mapelId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    CONSTRAINT "penugasan_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "gurus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "penugasan_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "mapels" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "penugasan_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "kelas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rpp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guruId" TEXT NOT NULL,
    "mapelId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "materi" TEXT NOT NULL,
    "alokasiWaktu" TEXT NOT NULL,
    "tujuanPembelajaran" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "tanggalPengesahan" DATETIME NOT NULL,
    "dibuatOleh" TEXT NOT NULL,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rpp_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "gurus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rpp_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "mapels" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rpp_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "kelas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rpp_dibuatOleh_fkey" FOREIGN KEY ("dibuatOleh") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rpp_pertemuan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rppId" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL,
    "isiKegiatan" TEXT NOT NULL,
    CONSTRAINT "rpp_pertemuan_rppId_fkey" FOREIGN KEY ("rppId") REFERENCES "rpp" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rpp_penilaian" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rppId" TEXT NOT NULL,
    "pengetahuan" TEXT NOT NULL,
    "keterampilan" TEXT NOT NULL,
    "sikap" TEXT NOT NULL,
    CONSTRAINT "rpp_penilaian_rppId_fkey" FOREIGN KEY ("rppId") REFERENCES "rpp" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rpp_log_status" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rppId" TEXT NOT NULL,
    "statusLama" TEXT,
    "statusBaru" TEXT NOT NULL,
    "olehUserId" TEXT NOT NULL,
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rpp_log_status_rppId_fkey" FOREIGN KEY ("rppId") REFERENCES "rpp" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rpp_log_status_olehUserId_fkey" FOREIGN KEY ("olehUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rpp_export" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rppId" TEXT NOT NULL,
    "tipeFile" TEXT NOT NULL,
    "pathFile" TEXT NOT NULL,
    "hash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rpp_export_rppId_fkey" FOREIGN KEY ("rppId") REFERENCES "rpp" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "gurus_userId_key" ON "gurus"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "mapels_namaMapel_key" ON "mapels"("namaMapel");

-- CreateIndex
CREATE UNIQUE INDEX "penugasan_guruId_mapelId_kelasId_key" ON "penugasan"("guruId", "mapelId", "kelasId");

-- CreateIndex
CREATE INDEX "rpp_guruId_idx" ON "rpp"("guruId");

-- CreateIndex
CREATE INDEX "rpp_mapelId_kelasId_idx" ON "rpp"("mapelId", "kelasId");

-- CreateIndex
CREATE INDEX "rpp_pertemuan_rppId_idx" ON "rpp_pertemuan"("rppId");

-- CreateIndex
CREATE UNIQUE INDEX "rpp_penilaian_rppId_key" ON "rpp_penilaian"("rppId");

-- CreateIndex
CREATE INDEX "rpp_log_status_rppId_idx" ON "rpp_log_status"("rppId");

-- CreateIndex
CREATE UNIQUE INDEX "rpp_export_rppId_tipeFile_key" ON "rpp_export"("rppId", "tipeFile");
