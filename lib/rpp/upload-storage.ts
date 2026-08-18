import { randomUUID } from "crypto";
import { existsSync } from "fs";
import { mkdir, rm, writeFile } from "fs/promises";
import { basename, isAbsolute, join, relative, resolve, sep } from "path";

export const RPP_UPLOAD_DIR = join(process.cwd(), "storage", "rpp-uploads");

function safeFileName(fileName: string): string {
  const name = basename(fileName).replace(/[^\p{L}\p{N}._ -]/gu, "_").trim();
  return name.slice(0, 191) || "rpp.pdf";
}

export function getOriginalPdfName(fileName: string): string {
  const name = safeFileName(fileName);
  return name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`;
}

export function getPdfTitle(fileName: string): string {
  const title = getOriginalPdfName(fileName).replace(/\.pdf$/i, "").trim();
  return title || "RPP Upload PDF";
}

export function isPdfBytes(bytes: Buffer): boolean {
  return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
}

export async function writeRppUpload(rppId: string, bytes: Buffer) {
  const directory = join(RPP_UPLOAD_DIR, rppId);
  await mkdir(directory, { recursive: true });

  const storedName = `${randomUUID()}.pdf`;
  const relativePath = join("storage", "rpp-uploads", rppId, storedName).replace(/\\/g, "/");
  const absolutePath = join(directory, storedName);
  await writeFile(absolutePath, bytes, { flag: "wx" });

  return { relativePath, absolutePath };
}

export function resolveRppUploadPath(rppId: string, relativePath: string): string | null {
  const root = resolve(join(RPP_UPLOAD_DIR, rppId));
  const candidate = resolve(process.cwd(), relativePath);
  const relativeToRoot = relative(root, candidate);
  if (!relativeToRoot || isAbsolute(relativeToRoot) || relativeToRoot.startsWith(`..${sep}`) || relativeToRoot === ".." || relativeToRoot.includes(`..${sep}`)) {
    return null;
  }
  return candidate;
}

export async function removeRppUpload(rppId: string, relativePath: string): Promise<void> {
  const absolutePath = resolveRppUploadPath(rppId, relativePath);
  if (absolutePath && existsSync(absolutePath)) {
    await rm(absolutePath, { force: true });
  }

  const directory = join(RPP_UPLOAD_DIR, rppId);
  if (existsSync(directory)) {
    await rm(directory, { recursive: true, force: true });
  }
}
