// Enkripsi simetris untuk API key AI (tidak boleh disimpan plaintext di DB).
// Algoritma: AES-256-GCM. Key diturunkan dari NEXTAUTH_SECRET via SHA-256.
// Format ciphertext: "iv:authTag:data" (semua base64).
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;

function getKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET belum diset — diperlukan untuk menyimpan API key AI secara aman.");
  }
  return createHash("sha256").update(secret).digest(); // 32 byte
}

export function encrypt(plain: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":");
}

export function decrypt(payload: string): string {
  const [ivB, tagB, dataB] = payload.split(":");
  if (!ivB || !tagB || !dataB) throw new Error("Format ciphertext API key tidak valid.");
  const key = getKey();
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB, "base64"));
  decipher.setAuthTag(Buffer.from(tagB, "base64"));
  const dec = Buffer.concat([decipher.update(Buffer.from(dataB, "base64")), decipher.final()]);
  return dec.toString("utf8");
}