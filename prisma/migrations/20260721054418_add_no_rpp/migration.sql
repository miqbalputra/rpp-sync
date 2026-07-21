-- AlterTable
ALTER TABLE "rpp" ADD COLUMN "noRpp" TEXT;

-- CreateIndex
CREATE INDEX "rpp_guruId_noRpp_idx" ON "rpp"("guruId", "noRpp");
