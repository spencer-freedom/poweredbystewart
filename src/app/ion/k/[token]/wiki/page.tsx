import { ComingSoon } from "../_components/coming-soon";

export const dynamic = "force-dynamic";

export default function WikiPage() {
  return (
    <ComingSoon
      surface="Pattern Wiki"
      blockedOn="GET /api/ion/wiki (graph traversal)"
    />
  );
}
