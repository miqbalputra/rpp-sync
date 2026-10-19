import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { clearConfirmedRppDraft, finishRppDraft, listRppDrafts, readRppDraft, rppDraftKey, writeRppDraft, type RppLocalDraft } from "../lib/rpp/draft-storage";

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; }, clear: () => data.clear(), key: (i) => [...data.keys()][i] ?? null,
    getItem: (key) => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); }, removeItem: (key) => { data.delete(key); },
  };
}
function draft(): RppLocalDraft {
  return {
    version: 1, submissionId: randomUUID(), savedAt: "2026-10-17T01:00:00.000Z",
    values: { mapelId: "", kelasId: "", materi: "Kisah Bilal رضي الله عنه", alokasiWaktu: "", tujuanPembelajaran: "",
      tanggalPengesahan: "2026-10-17", pertemuan: [{ isiKegiatan: "", tanggal: "" }],
      penilaian: { pengetahuan: "teks panjang ".repeat(100), keterampilan: "", sikap: "" } },
  };
}

test("incomplete drafts and long Unicode text survive a browser reload", () => {
  const storage = memoryStorage(); const key = rppDraftKey("guru1", "new:manual"); const value = draft();
  writeRppDraft(storage, key, value);
  assert.deepEqual(readRppDraft(storage, key), value);
  assert.notEqual(key, rppDraftKey("guru2", "new:manual"));
  assert.notEqual(key, rppDraftKey("guru1", "edit:rpp1"));
});
test("corrupt backups remain untouched", () => {
  const storage = memoryStorage(); storage.setItem("draft", "{broken");
  assert.throws(() => readRppDraft(storage, "draft"));
  assert.equal(storage.getItem("draft"), "{broken");
});
test("a late save acknowledgement cannot delete newer edits or another submission", () => {
  const storage = memoryStorage(); const value = draft(); writeRppDraft(storage, "draft", value);
  clearConfirmedRppDraft(storage, "draft", randomUUID(), value.values);
  assert.ok(storage.getItem("draft"));
  clearConfirmedRppDraft(storage, "draft", value.submissionId, { ...value.values, materi: "versi lain" });
  assert.ok(storage.getItem("draft"));
  clearConfirmedRppDraft(storage, "draft", value.submissionId, value.values);
  assert.equal(storage.getItem("draft"), null);
});
test("another tab's backup can be recovered and older versions remain downloadable", () => {
  const storage = memoryStorage(); const key = rppDraftKey("guru1", "new:manual"); const old = draft();
  const newer = { ...old, savedAt: "2026-10-17T02:00:00.000Z", values: { ...old.values, materi: "versi baru" } };
  writeRppDraft(storage, key, old); writeRppDraft(storage, `${key}:copy:${randomUUID()}`, newer);
  assert.deepEqual(listRppDrafts(storage, key)[0].draft, newer);
  finishRppDraft(storage, key, newer.submissionId, newer.values);
  assert.equal(listRppDrafts(storage, key).length, 0);
  assert.deepEqual(listRppDrafts(storage, key, true)[0].draft, old);
});
