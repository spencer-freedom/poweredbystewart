import { decodeTokenRole } from "@/lib/viewer";
import { ErrorPanel } from "../../_components/error-panel";
import { loadBrainV1 } from "@/app/ion/(public)/brain/_brain-v1/load";
import { BrainRendererV1 } from "@/app/ion/(public)/brain/_brain-v1/BrainRendererV1.client";

export const dynamic = "force-dynamic";

// Dev-only bypass for the role gate, used for local prototyping with a
// non-system_owner token. Set NEXT_PUBLIC_BRAIN_DEV_BYPASS=1 in
// .env.local. Production deploys don't have this var.
const DEV_BYPASS = process.env.NEXT_PUBLIC_BRAIN_DEV_BYPASS === "1";

// System-owner-gated mirror of /ion/brain. Same renderer, same data —
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

  const payload = await loadBrainV1();
  return <BrainRendererV1 payload={payload} />;
}
