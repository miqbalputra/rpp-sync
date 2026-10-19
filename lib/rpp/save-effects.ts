import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notifySchool } from "@/lib/integration/webhook";

export function completeRppSave(id: string): void {
  // The database has committed. A cache/webhook failure must never report that save as failed.
  try {
    revalidatePath("/guru/rpp");
    revalidatePath("/guru");
    revalidatePath(`/guru/rpp/${id}`);
    after(() => notifySchool("rpp.upsert", id));
  } catch {
    console.error("[rpp.save] post-save notification/cache refresh failed", { id });
  }
}
