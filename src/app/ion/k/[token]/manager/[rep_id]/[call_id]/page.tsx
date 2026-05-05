import Link from "next/link";
import { fetchCoachingPrep } from "@/lib/stewart-api";
import { ErrorPanel } from "../../../_components/error-panel";
import { ComposerOutput } from "../../../_components/composer-output";

export const dynamic = "force-dynamic";

export default async function ManagerCoachingPrepPage({
  params,
}: {
  params: Promise<{ token: string; rep_id: string; call_id: string }>;
}) {
  const { token, rep_id, call_id } = await params;
  try {
    const prep = await fetchCoachingPrep(token, call_id, rep_id);

    return (
      <div className="space-y-5 max-w-3xl">
        <div>
          <p className="text-xs uppercase tracking-wider text-stewart-muted mb-1">
            Coaching prep · rep <code className="text-stewart-text">{rep_id}</code> ·
            call <code className="text-stewart-text">{call_id}</code>
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-stewart-text">
            Session ready
          </h1>
        </div>

        <ComposerOutput data={prep} />

        <div className="pt-2 border-t border-stewart-border">
          <Link
            href={`/ion/k/${token}/wiki/brain`}
            className="inline-flex items-center gap-2 text-sm text-stewart-accent hover:underline"
          >
            See this call as a graph + similar successful examples →
          </Link>
        </div>
      </div>
    );
  } catch (e) {
    return <ErrorPanel error={e instanceof Error ? e.message : String(e)} />;
  }
}
