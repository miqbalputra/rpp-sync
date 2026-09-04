import { createHmac, randomUUID } from "crypto";

export type SchoolWebhookEvent = "rpp.upsert" | "rpp.deleted" | "promes.upsert" | "promes.deleted";

/**
 * Delivers a compact hint to the school app. The receiving app always fetches
 * the canonical record through the authenticated integration API afterwards.
 */
export async function notifySchool(event: SchoolWebhookEvent, entityId: string): Promise<void> {
  const url = process.env.SCHOOL_INTEGRATION_WEBHOOK_URL?.trim();
  const secret = process.env.SCHOOL_INTEGRATION_WEBHOOK_SECRET?.trim();
  if (!url || !secret) return;

  const occurredAt = new Date().toISOString();
  const eventId = randomUUID();
  const body = JSON.stringify({ eventId, event, entityId, occurredAt });
  const signature = createHmac("sha256", secret).update(`${occurredAt}.${body}`).digest("hex");

  try {
    await fetch(url, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
      headers: {
        "Content-Type": "application/json",
        "X-Rpp-Event-Id": eventId,
        "X-Rpp-Event-Timestamp": occurredAt,
        "X-Rpp-Signature": `sha256=${signature}`,
      },
      body,
    });
  } catch {
    // Reconciliation in the school app is the delivery fallback. Do not make
    // authoring an RPP fail merely because the destination is temporarily down.
  }
}
