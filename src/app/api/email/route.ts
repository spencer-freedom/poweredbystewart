import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

const ALLOWED_TENANTS = new Set(["sisel"]);

// Tenant config (mirrors config/email.yaml)
const TENANT_CONFIG: Record<string, { from_name: string; store_address: string; brand_color: string }> = {
  sisel: {
    from_name: "Sisel International",
    store_address: "Sisel International, Springville, UT",
    brand_color: "#1a5c3a",
  },
};

function tenantGuard(tenantId: string) {
  if (!ALLOWED_TENANTS.has(tenantId)) {
    return NextResponse.json({ error: "Unauthorized tenant" }, { status: 403 });
  }
  return null;
}

function errorResponse(error: { message: string }, status = 500) {
  return NextResponse.json({ error: error.message }, { status });
}

// ─── SES helpers ───────────────────────────────────────────────────────────────

let _ses: SESClient;
function getSesClient(): SESClient {
  if (!_ses) {
    _ses = new SESClient({
      region: process.env.AWS_SES_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return _ses;
}

async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string,
  fromName: string,
): Promise<{ success: boolean; error?: string }> {
  const fromEmail = process.env.AWS_SES_FROM_EMAIL || "";
  if (!fromEmail || !process.env.AWS_ACCESS_KEY_ID) {
    return { success: false, error: "AWS SES not configured" };
  }
  const source = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  try {
    const ses = getSesClient();
    await ses.send(
      new SendEmailCommand({
        Source: source,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: textBody || subject, Charset: "UTF-8" },
            ...(htmlBody ? { Html: { Data: htmlBody, Charset: "UTF-8" } } : {}),
          },
        },
      })
    );
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "SES send failed" };
  }
}

async function resolveEmailContent(
  campaign: { body_html?: string; body_text?: string; template_id?: string },
  tenantId: string,
): Promise<{ html: string; text: string }> {
  let html = campaign.body_html || "";
  let text = campaign.body_text || "";
  if (!html && campaign.template_id) {
    const { data: tpl } = await getSupabase()
      .from("email_templates")
      .select("html_content,text_content")
      .eq("id", campaign.template_id)
      .eq("tenant_id", tenantId)
      .single();
    if (tpl) {
      html = tpl.html_content || "";
      text = tpl.text_content || "";
    }
  }
  return { html, text };
}

function injectUnsubscribeFooter(html: string, storeAddress: string): string {
  const footer = `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #ddd;font-size:12px;color:#888;text-align:center;"><p>${storeAddress}</p><p><a href="#" style="color:#888;">Unsubscribe</a></p></div>`;
  const idx = html.toLowerCase().indexOf("</body>");
  if (idx >= 0) return html.slice(0, idx) + footer + html.slice(idx);
  return html + footer;
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "";
  const tenantId = searchParams.get("tenant") || "sisel";

  const guard = tenantGuard(tenantId);
  if (guard) return guard;

  try {
    switch (action) {
      case "summary": {
        const [campaigns, sends, tpl, unsub] = await Promise.all([
          getSupabase()
            .from("email_campaigns")
            .select("status", { count: "exact" })
            .eq("tenant_id", tenantId),
          getSupabase()
            .from("email_sends")
            .select("send_type,status", { count: "exact" })
            .eq("tenant_id", tenantId),
          getSupabase()
            .from("email_templates")
            .select("id", { count: "exact" })
            .eq("tenant_id", tenantId),
          getSupabase()
            .from("email_unsubscribes")
            .select("id", { count: "exact" })
            .eq("tenant_id", tenantId),
        ]);

        const campaignRows = campaigns.data || [];
        const sendRows = sends.data || [];

        return NextResponse.json({
          campaigns: {
            total: campaignRows.length,
            sent: campaignRows.filter((r) => r.status === "sent").length,
            draft: campaignRows.filter((r) => r.status === "draft").length,
            scheduled: campaignRows.filter((r) => r.status === "scheduled").length,
            sending: campaignRows.filter((r) => r.status === "sending").length,
          },
          sends: {
            total: sendRows.length,
            campaign: sendRows.filter((r) => r.send_type === "campaign").length,
            transactional: sendRows.filter((r) => r.send_type === "transactional").length,
            sent: sendRows.filter((r) => r.status === "sent").length,
            failed: sendRows.filter((r) => r.status === "failed").length,
          },
          templates: tpl.count ?? 0,
          unsubscribes: unsub.count ?? 0,
        });
      }

      case "templates": {
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const templateType = searchParams.get("template_type") || "";
        const status = searchParams.get("status") || "";

        let query = getSupabase()
          .from("email_templates")
          .select("*")
          .eq("tenant_id", tenantId);
        if (templateType) query = query.eq("template_type", templateType);
        if (status) query = query.eq("status", status);
        query = query.order("created_at", { ascending: false }).limit(limit);

        const { data, error } = await query;
        if (error) return errorResponse(error);
        return NextResponse.json(data);
      }

      case "campaigns": {
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const status = searchParams.get("status") || "";

        let query = getSupabase()
          .from("email_campaigns")
          .select("*")
          .eq("tenant_id", tenantId);
        if (status) query = query.eq("status", status);
        query = query.order("created_at", { ascending: false }).limit(limit);

        const { data, error } = await query;
        if (error) return errorResponse(error);
        return NextResponse.json(data);
      }

      case "sends": {
        const limit = parseInt(searchParams.get("limit") || "100", 10);
        const campaignId = searchParams.get("campaign_id") || "";
        const sendType = searchParams.get("send_type") || "";
        const sendStatus = searchParams.get("status") || "";

        let query = getSupabase()
          .from("email_sends")
          .select("*")
          .eq("tenant_id", tenantId);
        if (campaignId) query = query.eq("campaign_id", campaignId);
        if (sendType) query = query.eq("send_type", sendType);
        if (sendStatus) query = query.eq("status", sendStatus);
        query = query.order("created_at", { ascending: false }).limit(limit);

        const { data, error } = await query;
        if (error) return errorResponse(error);
        return NextResponse.json(data);
      }

      case "unsubscribes": {
        const limit = parseInt(searchParams.get("limit") || "100", 10);
        const { data, error } = await getSupabase()
          .from("email_unsubscribes")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(limit);
        if (error) return errorResponse(error);
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "";
  const tenantId = searchParams.get("tenant") || "sisel";

  const guard = tenantGuard(tenantId);
  if (guard) return guard;

  const body = await req.json().catch(() => ({}));

  try {
    switch (action) {
      case "create_template": {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const { data, error } = await getSupabase()
          .from("email_templates")
          .insert({
            id,
            tenant_id: tenantId,
            template_name: body.template_name || "",
            template_type: body.template_type || "custom",
            subject_template: body.subject_template || "",
            html_content: body.html_content || "",
            text_content: body.text_content || "",
            variables: JSON.stringify(body.variables || []),
            status: body.status || "draft",
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();
        if (error) return errorResponse(error);
        return NextResponse.json(data);
      }

      case "create_campaign": {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const status = body.scheduled_at ? "scheduled" : "draft";
        const { data, error } = await getSupabase()
          .from("email_campaigns")
          .insert({
            id,
            tenant_id: tenantId,
            campaign_name: body.campaign_name || "",
            template_id: body.template_id || null,
            subject: body.subject || "",
            body_html: body.body_html || "",
            body_text: body.body_text || "",
            status,
            scheduled_at: body.scheduled_at || null,
            metadata: JSON.stringify(body.metadata || {}),
            audience_criteria: JSON.stringify({}),
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();
        if (error) return errorResponse(error);
        return NextResponse.json(data);
      }

      case "send_test": {
        // Send a single test email for a campaign
        const campaignId = searchParams.get("campaign_id") || "";
        const testEmail = body.email || "";
        if (!testEmail) {
          return NextResponse.json({ error: "email is required" }, { status: 400 });
        }

        // Fetch campaign
        const { data: campaign, error: campErr } = await getSupabase()
          .from("email_campaigns")
          .select("*")
          .eq("id", campaignId)
          .eq("tenant_id", tenantId)
          .single();
        if (campErr || !campaign) {
          return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        const { html: rawHtml, text } = await resolveEmailContent(campaign, tenantId);
        const cfg = TENANT_CONFIG[tenantId] || TENANT_CONFIG.sisel;
        const html = rawHtml ? injectUnsubscribeFooter(rawHtml, cfg.store_address) : "";

        const result = await sendEmail(testEmail, `[TEST] ${campaign.subject}`, html, text, cfg.from_name);

        // Log the test send
        if (result.success) {
          await getSupabase().from("email_sends").insert({
            tenant_id: tenantId,
            campaign_id: campaignId,
            customer_id: "test",
            email: testEmail,
            customer_name: "Test Send",
            send_type: "campaign",
            template_type: "test",
            subject: `[TEST] ${campaign.subject}`,
            status: "sent",
            sent_at: new Date().toISOString(),
            error: "",
            created_at: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          success: result.success,
          email: testEmail,
          error: result.error,
        });
      }

      case "send_campaign": {
        const campaignId = searchParams.get("campaign_id") || "";
        const dryRun = searchParams.get("dry_run") === "true";
        const recipients: { email: string; name: string }[] = body.recipients || [];

        // Fetch campaign
        const { data: campaign, error: campError } = await getSupabase()
          .from("email_campaigns")
          .select("*")
          .eq("id", campaignId)
          .eq("tenant_id", tenantId)
          .single();
        if (campError || !campaign) {
          return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }
        if (campaign.status !== "draft" && campaign.status !== "scheduled") {
          return NextResponse.json({ error: `Campaign already ${campaign.status}` }, { status: 400 });
        }

        const { html, text } = await resolveEmailContent(campaign, tenantId);

        if (!html && !text) {
          return NextResponse.json({ error: "Campaign has no email content" }, { status: 400 });
        }

        // Filter unsubscribes
        const { data: unsubs } = await getSupabase()
          .from("email_unsubscribes")
          .select("email")
          .eq("tenant_id", tenantId);
        const unsubSet = new Set((unsubs || []).map((u) => u.email));
        const filtered = recipients.filter((r) => !unsubSet.has(r.email));

        if (dryRun) {
          return NextResponse.json({
            dry_run: true,
            recipient_count: filtered.length,
            filtered_unsubscribes: recipients.length - filtered.length,
            sample_subject: campaign.subject,
            cost_estimate_usd: Math.round(filtered.length * 0.0001 * 10000) / 10000,
          });
        }

        if (filtered.length === 0) {
          return NextResponse.json({ error: "No recipients (all filtered or none provided)" }, { status: 400 });
        }

        const cfg = TENANT_CONFIG[tenantId] || TENANT_CONFIG.sisel;

        // Mark sending
        await getSupabase()
          .from("email_campaigns")
          .update({ status: "sending", total_recipients: filtered.length, updated_at: new Date().toISOString() })
          .eq("id", campaignId);

        // Send loop with try/finally to prevent stuck "sending" status
        let sent = 0;
        let failed = 0;
        try {
          for (const recipient of filtered) {
            const renderedHtml = html
              ? injectUnsubscribeFooter(html.replace(/\{name\}/g, recipient.name || ""), cfg.store_address)
              : "";
            const renderedSubject = campaign.subject.replace(/\{name\}/g, recipient.name || "");
            const renderedText = text.replace(/\{name\}/g, recipient.name || "");

            const result = await sendEmail(recipient.email, renderedSubject, renderedHtml, renderedText, cfg.from_name);

            const now = new Date().toISOString();
            await getSupabase().from("email_sends").insert({
              tenant_id: tenantId,
              campaign_id: campaignId,
              customer_id: crypto.randomUUID(),
              email: recipient.email,
              customer_name: recipient.name || "",
              send_type: "campaign",
              template_type: campaign.template_id ? "template" : "custom",
              subject: renderedSubject,
              status: result.success ? "sent" : "failed",
              sent_at: result.success ? now : null,
              error: result.error || "",
              created_at: now,
            });

            if (result.success) sent++;
            else failed++;
          }
        } finally {
          // Always update campaign status, even if loop crashes mid-way
          const finalNow = new Date().toISOString();
          await getSupabase()
            .from("email_campaigns")
            .update({
              status: "sent",
              sent_at: finalNow,
              sent_count: sent,
              bounced_count: failed,
              updated_at: finalNow,
            })
            .eq("id", campaignId);
        }

        return NextResponse.json({
          campaign_id: campaignId,
          status: "sent",
          total_recipients: filtered.length,
          sent,
          failed,
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "";
  const tenantId = searchParams.get("tenant") || "sisel";

  const guard = tenantGuard(tenantId);
  if (guard) return guard;

  const body = await req.json().catch(() => ({}));

  try {
    switch (action) {
      case "update_template": {
        const templateId = searchParams.get("id") || "";
        const allowed = [
          "template_name", "template_type", "subject_template",
          "html_content", "text_content", "variables", "status",
        ];
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        for (const key of allowed) {
          if (body[key] !== undefined) {
            updates[key] = key === "variables" && Array.isArray(body[key])
              ? JSON.stringify(body[key])
              : body[key];
          }
        }

        const { data, error } = await getSupabase()
          .from("email_templates")
          .update(updates)
          .eq("id", templateId)
          .eq("tenant_id", tenantId)
          .select()
          .single();
        if (error) return errorResponse(error);
        return NextResponse.json(data);
      }

      case "update_campaign": {
        const campId = searchParams.get("id") || "";
        const campaignAllowed = [
          "campaign_name", "subject", "body_html", "body_text",
          "template_id", "status", "scheduled_at",
        ];
        const campUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        for (const key of campaignAllowed) {
          if (body[key] !== undefined) campUpdates[key] = body[key];
        }

        const { data, error } = await getSupabase()
          .from("email_campaigns")
          .update(campUpdates)
          .eq("id", campId)
          .eq("tenant_id", tenantId)
          .select()
          .single();
        if (error) return errorResponse(error);
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
