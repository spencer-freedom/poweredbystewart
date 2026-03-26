import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const ALLOWED_TENANTS = new Set(["sisel"]);

function tenantGuard(tenantId: string) {
  if (!ALLOWED_TENANTS.has(tenantId)) {
    return NextResponse.json({ error: "Unauthorized tenant" }, { status: 403 });
  }
  return null;
}

function errorResponse(error: { message: string }, status = 500) {
  return NextResponse.json({ error: error.message }, { status });
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
          supabase
            .from("email_campaigns")
            .select("status", { count: "exact" })
            .eq("tenant_id", tenantId),
          supabase
            .from("email_sends")
            .select("send_type,status", { count: "exact" })
            .eq("tenant_id", tenantId),
          supabase
            .from("email_templates")
            .select("id", { count: "exact" })
            .eq("tenant_id", tenantId),
          supabase
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

        let query = supabase
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

        let query = supabase
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

        let query = supabase
          .from("email_sends")
          .select("*")
          .eq("tenant_id", tenantId);
        if (campaignId) query = query.eq("campaign_id", campaignId);
        if (sendType) query = query.eq("send_type", sendType);
        query = query.order("created_at", { ascending: false }).limit(limit);

        const { data, error } = await query;
        if (error) return errorResponse(error);
        return NextResponse.json(data);
      }

      case "unsubscribes": {
        const limit = parseInt(searchParams.get("limit") || "100", 10);
        const { data, error } = await supabase
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
        const { data, error } = await supabase
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
        const { data, error } = await supabase
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

      case "send_campaign": {
        const campaignId = searchParams.get("campaign_id") || "";
        const dryRun = searchParams.get("dry_run") === "true";

        // Fetch campaign
        const { data: campaign, error } = await supabase
          .from("email_campaigns")
          .select("*")
          .eq("id", campaignId)
          .eq("tenant_id", tenantId)
          .single();
        if (error || !campaign) {
          return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        if (dryRun) {
          return NextResponse.json({
            dry_run: true,
            recipient_count: 0,
            sample_subject: campaign.subject,
            cost_estimate_usd: 0,
          });
        }

        // Real sends would require backend SES integration
        return NextResponse.json(
          { error: "Email sending requires backend configuration. Use dry run for preview." },
          { status: 501 }
        );
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

        const { data, error } = await supabase
          .from("email_templates")
          .update(updates)
          .eq("id", templateId)
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
