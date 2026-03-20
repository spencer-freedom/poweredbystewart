// ─── Push lead changes back to Jamie's Google Sheet via Apps Script web app ──

interface LeadData {
  lead_date?: string;
  customer_name?: string;
  source?: string;
  interest?: string;
  segment?: string;
  past_actions?: string;
  appt?: number;
  show?: number;
  turn_over?: number;
  to_date?: string | null;
  to_salesperson?: string;
  status?: string;
  future_actions?: string;
}

export async function pushLeadToSheet(
  action: "create" | "update" | "delete",
  lead: LeadData
): Promise<void> {
  const webhookUrl = process.env.APPS_SCRIPT_WEBHOOK_URL;
  if (!webhookUrl) return; // Graceful degradation — not configured yet

  const apiKey = process.env.SHEETS_PUSH_API_KEY || process.env.SHEETS_SYNC_API_KEY || "";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, action, lead }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
  } catch (e) {
    // Best-effort — log but don't throw. Supabase is the source of truth.
    console.error("Sheet push failed:", e instanceof Error ? e.message : e);
  }
}
