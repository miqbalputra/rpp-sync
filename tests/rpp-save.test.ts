import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import type { Session } from "next-auth";
import type { RppFormValues } from "../lib/rpp/schema";

// Every write uses a fresh disposable database outside the workspace. Never load or seed production.
const directory = mkdtempSync(join(tmpdir(), "rpp-save-test-"));
process.env.DATABASE_URL = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
let db: typeof import("../lib/db").prisma;
let saveRpp: typeof import("../lib/rpp/save").saveRpp;
let values: RppFormValues;
const session: Session = { user: { id: "test-guru", name: "Guru Test", role: "GURU" }, expires: "2099-01-01T00:00:00.000Z" };

before(async () => {
  writeFileSync(join(directory, "test.db"), "");
  db = (await import("../lib/db")).prisma;
  const fixture = readFileSync("prisma/migrations/20260720035105_init/migration.sql", "utf8") + `
    ALTER TABLE users ADD COLUMN prefNotifOverdue BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE users ADD COLUMN deletedAt DATETIME;
    ALTER TABLE gurus ADD COLUMN deletedAt DATETIME;
    ALTER TABLE mapels ADD COLUMN deletedAt DATETIME;
    ALTER TABLE kelas ADD COLUMN deletedAt DATETIME;
    ALTER TABLE penugasan ADD COLUMN deletedAt DATETIME;
    ALTER TABLE rpp ADD COLUMN noRpp TEXT;
    ALTER TABLE rpp ADD COLUMN dibuatDenganAI BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE rpp ADD COLUMN metodeInput TEXT NOT NULL DEFAULT 'MANUAL';
    ALTER TABLE rpp_pertemuan ADD COLUMN tanggal DATETIME;
  `;
  for (const statement of fixture.split(";").filter((part) => part.trim())) await db.$executeRawUnsafe(statement);
  saveRpp = (await import("../lib/rpp/save")).saveRpp;
  await db.user.create({ data: { id: session.user.id, nama: "Guru Test", email: "test@example.invalid", username: "test", passwordHash: "unused", role: "GURU", guru: { create: { id: "test-profile", namaTampil: "Guru Test" } } } });
  await db.mapel.create({ data: { id: "test-mapel", namaMapel: "Mapel Test" } });
  await db.kelas.create({ data: { id: "test-kelas", namaKelas: "Kelas Test", semester: "1", gender: "AKHWAT", tahunAjaran: "2026/2027" } });
  await db.penugasan.create({ data: { guruId: "test-profile", mapelId: "test-mapel", kelasId: "test-kelas" } });
  values = { mapelId: "test-mapel", kelasId: "test-kelas", noRpp: "001", materi: "Kisah Bilal", alokasiWaktu: "2 x 35 menit", tujuanPembelajaran: "Tujuan pembelajaran", tanggalPengesahan: "2026-10-17",
    pertemuan: [{ isiKegiatan: "Kegiatan pertama", tanggal: "2026-10-17" }],
    penilaian: { pengetahuan: "Pengetahuan ".repeat(100), keterampilan: "Keterampilan ".repeat(100), sikap: "Sikap ".repeat(100) } };
});
after(async () => {
  if (db) await db.$disconnect();
  const root = resolve(tmpdir()) + sep;
  assert.ok(resolve(directory).startsWith(root) && basename(directory).startsWith("rpp-save-test-"));
  rmSync(directory, { recursive: true, force: true });
});

test("expired sessions do not write anything", async () => {
  const before = await db.rpp.count();
  const result = await saveRpp(values, null, { ai: false, submissionId: randomUUID() });
  assert.equal(result.ok, false); if (!result.ok) assert.equal(result.code, "SESSION_EXPIRED");
  assert.equal(await db.rpp.count(), before);
});
test("a lost response retried with the same submission creates exactly one complete RPP", async () => {
  const options = { ai: false, submissionId: randomUUID() };
  const first = await saveRpp(values, session, options); assert.ok(first.ok);
  const retry = await saveRpp(values, session, options); assert.deepEqual(retry, first);
  const row = await db.rpp.findUniqueOrThrow({ where: { id: first.id }, include: { pertemuan: true, penilaian: true } });
  assert.equal(row.pertemuan.length, 1); assert.equal(row.penilaian?.pengetahuan, values.penilaian.pengetahuan);
  assert.equal(await db.rpp.count({ where: { id: first.id } }), 1);
  const changed = await saveRpp({ ...values, materi: "Edit setelah koneksi terputus" }, session, options);
  assert.equal(changed.ok, false); if (!changed.ok) assert.equal(changed.code, "CONFLICT");
  assert.equal((await db.rpp.findUniqueOrThrow({ where: { id: first.id } })).materi, values.materi);
});
test("simultaneous duplicate submissions cannot create two rows", async () => {
  const options = { ai: false, submissionId: randomUUID() };
  const [a, b] = await Promise.all([saveRpp(values, session, options), saveRpp(values, session, options)]);
  assert.ok(a.ok && b.ok); assert.equal(a.id, b.id);
});
test("a stale editor cannot overwrite a newer RPP; retry of the same successful update is safe", async () => {
  const original = await saveRpp(values, session, { ai: false, submissionId: randomUUID() }); assert.ok(original.ok);
  const newer = { ...values, materi: "Versi baru", pertemuan: [{ isiKegiatan: "Kegiatan terbaru", tanggal: "2026-10-18" }] };
  const options = { ai: false, id: original.id, expectedUpdatedAt: original.updatedAt };
  const edited = await saveRpp(newer, session, options); assert.ok(edited.ok);
  assert.deepEqual(await saveRpp(newer, session, options), edited);
  const stale = await saveRpp({ ...values, materi: "Versi usang" }, session, options);
  assert.equal(stale.ok, false); if (!stale.ok) assert.equal(stale.code, "CONFLICT");
  const row = await db.rpp.findUniqueOrThrow({ where: { id: original.id }, include: { pertemuan: true } });
  assert.equal(row.materi, newer.materi); assert.equal(row.pertemuan[0].isiKegiatan, "Kegiatan terbaru");
});
test("a failure while replacing meetings rolls back both the RPP and the old meetings", async () => {
  const original = await saveRpp(values, session, { ai: false, submissionId: randomUUID() }); assert.ok(original.ok);
  await db.$executeRawUnsafe("CREATE TRIGGER reject_test_meeting BEFORE INSERT ON rpp_pertemuan WHEN NEW.isiKegiatan = 'FAIL_FIXTURE' BEGIN SELECT RAISE(ABORT, 'fixture failure'); END");
  try {
    const result = await saveRpp({ ...values, materi: "Should roll back", pertemuan: [{ isiKegiatan: "FAIL_FIXTURE" }] }, session, { ai: false, id: original.id, expectedUpdatedAt: original.updatedAt });
    assert.equal(result.ok, false);
    const row = await db.rpp.findUniqueOrThrow({ where: { id: original.id }, include: { pertemuan: true } });
    assert.equal(row.materi, values.materi); assert.equal(row.pertemuan[0].isiKegiatan, values.pertemuan[0].isiKegiatan);
    assert.equal(row.updatedAt.toISOString(), original.updatedAt);
  } finally { await db.$executeRawUnsafe("DROP TRIGGER reject_test_meeting"); }
});
test("invalid input and unauthorized assignments preserve existing data", async () => {
  const count = await db.rpp.count();
  const invalid = await saveRpp({ ...values, materi: "" }, session, { ai: false }); assert.equal(invalid.ok, false);
  const forbidden = await saveRpp({ ...values, mapelId: "not-assigned" }, session, { ai: false }); assert.equal(forbidden.ok, false);
  assert.equal(await db.rpp.count(), count);
});
