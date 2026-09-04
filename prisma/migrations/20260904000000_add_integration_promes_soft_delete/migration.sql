-- Reconciliation must be able to observe removals as well as active Promes.
ALTER TABLE "promes" ADD COLUMN "deletedAt" DATETIME;
