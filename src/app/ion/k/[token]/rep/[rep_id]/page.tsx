import { ComingSoon } from "../../_components/coming-soon";

export const dynamic = "force-dynamic";

export default async function RepDailyPage({
  params,
}: {
  params: Promise<{ token: string; rep_id: string }>;
}) {
  const { rep_id } = await params;
  return (
    <ComingSoon
      surface={`Rep Daily Brief · ${rep_id}`}
      blockedOn="GET /api/ion/training-brief"
    />
  );
}
