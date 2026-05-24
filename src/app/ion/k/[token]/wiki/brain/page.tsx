import { decodeTokenRole } from "@/lib/viewer";
import { ErrorPanel } from "../../_components/error-panel";
import { loadBrainV2 } from "@/app/ion/(public)/brain/_brain-v2/load";
import { BrainPageShell } from "@/app/ion/(public)/brain/_brain-v2/BrainPageShell.client";

export const dynamic = "force-dynamic";

// Dev-only bypass for the role gate. Set NEXT_PUBLIC_BRAIN_DEV_BYPASS=1
// in .env.local. Production deploys don't have this var.
const DEV_BYPASS = process.env.NEXT_PUBLIC_BRAIN_DEV_BYPASS === "1";

// System-owner-gated mirror of /ion/brain. Same shell, same payload —
// the only difference is the upstream role gate. UX-only check via
// token base64 decode (HMAC stays backend-verified on every data
// fetch in the API layer).

export default async function WikiBrainPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const decoded = decodeTokenRole(token);
  const allowed = DEV_BYPASS || decoded.role === "system_owner";

  if (!allowed) {
    return <ErrorPanel error="This view isn't available on your account." />;
  }

  const payload = await loadBrainV2();
  return <BrainPageShell payload={payload} />;
}
