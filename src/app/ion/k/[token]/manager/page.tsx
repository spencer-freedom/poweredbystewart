import { ComingSoon } from "../_components/coming-soon";

export const dynamic = "force-dynamic";

export default function ManagerLandingPage() {
  return (
    <ComingSoon
      surface="Manager Weekly Coaching"
      blockedOn="GET /api/ion/coaching-prep"
    />
  );
}
