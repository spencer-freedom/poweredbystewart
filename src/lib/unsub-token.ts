import crypto from "crypto";

const UNSUB_SECRET = process.env.UNSUB_SECRET || "sisel-unsub-secret-default";

export function generateUnsubToken(email: string, tenantId: string): string {
  return crypto.createHmac("sha256", UNSUB_SECRET).update(`${tenantId}:${email}`).digest("hex").slice(0, 32);
}
