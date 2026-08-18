-- Store one active Program Semester link per Mapel + Kelas pair.
CREATE TABLE "promes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mapelId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "promes_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "mapels" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "promes_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "kelas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "promes_mapelId_kelasId_key" ON "promes"("mapelId", "kelasId");
CREATE INDEX "promes_kelasId_mapelId_idx" ON "promes"("kelasId", "mapelId");
