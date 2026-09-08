import { z } from "zod";

export const SendChatMessageSchema = z.object({
  recipientId: z.string().min(1, "Penerima tidak valid"),
  isi: z.string().trim().min(1, "Pesan tidak boleh kosong").max(2000, "Pesan maksimal 2.000 karakter"),
});

export const ChatConversationIdSchema = z.string().min(1, "Percakapan tidak valid");
