import { ComingSoon } from "../_components/coming-soon";

export const dynamic = "force-dynamic";

export default function SalesLeaderPage() {
  return (
    <ComingSoon
      surface="Sales Leader · Floor Analytics"
      blockedOn="GET /api/ion/dashboard (aggregate view)"
    />
  );
}
