import { ComingSoon } from "../../../_components/coming-soon";

export const dynamic = "force-dynamic";

export default async function ManagerCoachingPrepPage({
  params,
}: {
  params: Promise<{ token: string; rep_id: string; call_id: string }>;
}) {
  const { rep_id, call_id } = await params;
  return (
    <ComingSoon
      surface={`Coaching Prep · rep ${rep_id} · call ${call_id}`}
      blockedOn="GET /api/ion/coaching-prep"
    />
  );
}
