-- CreateTable
CREATE TABLE "pengaturan_ai" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "endpoint" TEXT,
    "apiKeyEnc" TEXT,
    "model" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_rpp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guruId" TEXT NOT NULL,
    "mapelId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "noRpp" TEXT,
    "materi" TEXT NOT NULL,
    "alokasiWaktu" TEXT NOT NULL,
    "tujuanPembelajaran" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "tanggalPengesahan" DATETIME NOT NULL,
    "dibuatOleh" TEXT NOT NULL,
    "dibuatDenganAI" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rpp_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "gurus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rpp_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "mapels" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rpp_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "kelas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rpp_dibuatOleh_fkey" FOREIGN KEY ("dibuatOleh") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_rpp" ("alokasiWaktu", "createdAt", "deletedAt", "dibuatOleh", "guruId", "id", "kelasId", "mapelId", "materi", "noRpp", "status", "tanggalPengesahan", "tujuanPembelajaran", "updatedAt") SELECT "alokasiWaktu", "createdAt", "deletedAt", "dibuatOleh", "guruId", "id", "kelasId", "mapelId", "materi", "noRpp", "status", "tanggalPengesahan", "tujuanPembelajaran", "updatedAt" FROM "rpp";
DROP TABLE "rpp";
ALTER TABLE "new_rpp" RENAME TO "rpp";
CREATE INDEX "rpp_guruId_idx" ON "rpp"("guruId");
CREATE INDEX "rpp_guruId_noRpp_idx" ON "rpp"("guruId", "noRpp");
CREATE INDEX "rpp_mapelId_kelasId_idx" ON "rpp"("mapelId", "kelasId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
