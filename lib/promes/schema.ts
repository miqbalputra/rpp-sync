import { z } from "zod";

const HttpsUrlSchema = z
  .string()
  .trim()
  .url("Link Promes harus berupa URL yang valid")
  .refine((value) => value.startsWith("https://"), "Link Promes harus menggunakan HTTPS");

export const PromesSchema = z.object({
  mapelId: z.string().min(1, "Mapel wajib dipilih"),
  kelasId: z.string().min(1, "Kelas wajib dipilih"),
  url: HttpsUrlSchema,
});

export type PromesFormValues = z.infer<typeof PromesSchema>;
