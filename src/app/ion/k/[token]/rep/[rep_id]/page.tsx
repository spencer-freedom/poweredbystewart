import { fetchTrainingBrief } from "@/lib/stewart-api";
import { ErrorPanel } from "../../_components/error-panel";
import { ComposerOutput } from "../../_components/composer-output";

export const dynamic = "force-dynamic";

export default async function RepDailyPage({
  params,
}: {
  params: Promise<{ token: string; rep_id: string }>;
}) {
  const { token, rep_id } = await params;
  try {
    const brief = await fetchTrainingBrief(token, rep_id);

    return (
      <div className="space-y-5 max-w-3xl">
        <div>
          <p className="text-xs uppercase tracking-wider text-stewart-muted mb-1">
            Daily training · {rep_id}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-stewart-text">
            Today&apos;s focus
          </h1>
        </div>

        <ComposerOutput data={brief} />
      </div>
    );
  } catch (e) {
    return <ErrorPanel error={e instanceof Error ? e.message : String(e)} />;
  }
}
