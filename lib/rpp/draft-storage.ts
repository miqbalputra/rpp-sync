import { z } from "zod";
import type { RppFormValues } from "./schema";

// Drafts may be incomplete: required-field validation belongs to submission.
const draftValuesSchema = z.object({
  mapelId: z.string(), kelasId: z.string(), noRpp: z.string().optional(), materi: z.string(),
  alokasiWaktu: z.string(), tujuanPembelajaran: z.string(), tanggalPengesahan: z.string(),
  pertemuan: z.array(z.object({ id: z.string().optional(), isiKegiatan: z.string(), tanggal: z.string().optional() })),
  penilaian: z.object({ pengetahuan: z.string(), keterampilan: z.string(), sikap: z.string() }),
});
const draftSchema = z.object({
  version: z.literal(1), submissionId: z.string().uuid(), savedAt: z.string(),
  expectedUpdatedAt: z.string().optional(), values: draftValuesSchema,
});
export type RppLocalDraft = z.infer<typeof draftSchema>;
export type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type DraftEntry = { key: string; draft: RppLocalDraft };

export function listRppDrafts(storage: Storage, key: string, archived = false): DraftEntry[] {
  const drafts: DraftEntry[] = [];
  for (let i = 0; i < storage.length; i++) {
    const candidate = storage.key(i);
    if (!candidate || !(archived ? candidate.startsWith(`${key}:archive:`) : candidate === key || candidate.startsWith(`${key}:copy:`))) continue;
    try {
      const draft = readRppDraft(storage, candidate);
      if (draft) drafts.push({ key: candidate, draft });
    } catch { /* retain unreadable backups, never replace them */ }
  }
  return drafts.sort((a, b) => b.draft.savedAt.localeCompare(a.draft.savedAt));
}

export function rppDraftKey(userId: string, scope: string): string {
  return `rpp:draft:v1:${encodeURIComponent(userId)}:${encodeURIComponent(scope)}`;
}

export function readRppDraft(storage: DraftStorage, key: string): RppLocalDraft | null {
  const raw = storage.getItem(key);
  if (!raw) return null;
  const parsed = draftSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) throw new Error("Cadangan draf tidak dapat dibaca");
  return parsed.data;
}

export function writeRppDraft(storage: DraftStorage, key: string, draft: RppLocalDraft): void {
  storage.setItem(key, JSON.stringify(draft));
}

export function clearConfirmedRppDraft(storage: DraftStorage, key: string, submissionId: string, values: RppFormValues): void {
  const current = readRppDraft(storage, key);
  // Never delete a newer backup written by another open form.
  if (current?.submissionId === submissionId && JSON.stringify(current.values) === JSON.stringify(values)) storage.removeItem(key);
}

export function finishRppDraft(storage: Storage, key: string, submissionId: string, values: RppFormValues): void {
  for (const entry of listRppDrafts(storage, key)) {
    if (entry.draft.submissionId !== submissionId) continue;
    if (JSON.stringify(entry.draft.values) === JSON.stringify(values)) {
      clearConfirmedRppDraft(storage, entry.key, submissionId, values);
    } else {
      // Keep other versions available for download without restoring them as a new RPP.
      writeRppDraft(storage, `${key}:archive:${newSubmissionId()}`, entry.draft);
      if (storage.getItem(entry.key) === JSON.stringify(entry.draft)) storage.removeItem(entry.key);
    }
  }
}

export function newSubmissionId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
