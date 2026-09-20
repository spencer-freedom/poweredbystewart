import { NextRequest, NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase-server";
import { generateUnsubToken } from "@/lib/unsub-token";

function getSupabase() {
  return serviceClient();
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  const tenantId = searchParams.get("tenant") || "sisel";

  if (!token || !email) {
    return NextResponse.json({ error: "Missing token or email" }, { status: 400 });
  }

  // Verify token
  const expected = generateUnsubToken(email, tenantId);
  if (token !== expected) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  // Insert unsubscribe
  const { error } = await getSupabase()
    .from("email_unsubscribes")
    .upsert(
      {
        tenant_id: tenantId,
        email,
        reason: "Unsubscribed via email link",
        source: "link",
        created_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,email" }
    );

  if (error) {
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }

  return NextResponse.json({ success: true, email });
}
