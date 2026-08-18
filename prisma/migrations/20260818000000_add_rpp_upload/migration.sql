-- Add an explicit source marker while keeping existing RPP rows as manual.
ALTER TABLE "rpp" ADD COLUMN "metodeInput" TEXT NOT NULL DEFAULT 'MANUAL';

-- Store uploaded PDF metadata separately from the structured RPP fields.
CREATE TABLE "rpp_file" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rppId" TEXT NOT NULL,
    "namaFile" TEXT NOT NULL,
    "pathFile" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "ukuranByte" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rpp_file_rppId_fkey" FOREIGN KEY ("rppId") REFERENCES "rpp" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "rpp_file_rppId_key" ON "rpp_file"("rppId");
