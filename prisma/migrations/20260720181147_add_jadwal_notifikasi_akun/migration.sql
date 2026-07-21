-- CreateTable
CREATE TABLE "jadwal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "penugasanId" TEXT NOT NULL,
    "hari" TEXT NOT NULL,
    "jamMulai" TEXT NOT NULL,
    "jamSelesai" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "jadwal_penugasanId_fkey" FOREIGN KEY ("penugasanId") REFERENCES "penugasan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifikasi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipe" TEXT NOT NULL,
    "dariUserId" TEXT,
    "untukRole" TEXT,
    "untukUserId" TEXT,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifikasi_dariUserId_fkey" FOREIGN KEY ("dariUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "notifikasi_untukUserId_fkey" FOREIGN KEY ("untukUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifikasi_dibaca" (
    "userId" TEXT NOT NULL,
    "notifikasiId" TEXT NOT NULL,
    "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "notifikasiId"),
    CONSTRAINT "notifikasi_dibaca_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notifikasi_dibaca_notifikasiId_fkey" FOREIGN KEY ("notifikasiId") REFERENCES "notifikasi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'GURU',
    "gender" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "prefNotifOverdue" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("aktif", "createdAt", "email", "gender", "id", "nama", "passwordHash", "role", "updatedAt", "username") SELECT "aktif", "createdAt", "email", "gender", "id", "nama", "passwordHash", "role", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "jadwal_penugasanId_idx" ON "jadwal"("penugasanId");

-- CreateIndex
CREATE UNIQUE INDEX "jadwal_penugasanId_hari_jamMulai_key" ON "jadwal"("penugasanId", "hari", "jamMulai");

-- CreateIndex
CREATE INDEX "notifikasi_untukRole_idx" ON "notifikasi"("untukRole");

-- CreateIndex
CREATE INDEX "notifikasi_untukUserId_idx" ON "notifikasi"("untukUserId");

-- CreateIndex
CREATE INDEX "notifikasi_createdAt_idx" ON "notifikasi"("createdAt");

-- CreateIndex
CREATE INDEX "notifikasi_dibaca_notifikasiId_idx" ON "notifikasi_dibaca"("notifikasiId");
