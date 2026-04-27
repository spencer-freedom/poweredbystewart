import { fetchUploadStatus } from "@/lib/ion-api";
import { UploadDropzone } from "../_components/upload-dropzone";

export const dynamic = "force-dynamic";

export default async function NextStepsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let initialUploaded = 0;
  let initialTranscribed = 0;
  try {
    const status = await fetchUploadStatus(token);
    initialUploaded = status.totals.uploaded;
    initialTranscribed = status.totals.transcribed;
  } catch {
    // Status read failure is non-fatal — the dropzone will refresh after the first upload.
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stewart-text">
          To productionize this for your full 35-setter floor, here's exactly
          what we need:
        </h1>
        <p className="text-stewart-muted mt-3 max-w-3xl">
          ~10 minutes of Salesforce admin work + a one-time audio export.
          Everything below is what flips this from a 47-call directional read
          into a per-rep daily training engine.
        </p>
      </div>

      <ol className="space-y-6">
        <Step n={1} title="Salesforce report A — winning calls">
          <ul className="list-disc list-inside space-y-1 text-stewart-text">
            <li>
              <strong>Filter:</strong> CallDuration &gt; 60 seconds
            </li>
            <li>
              <strong>Filter:</strong> Outcome = "Appointment Set"
            </li>
            <li>
              <strong>Date range:</strong> last 60–90 days
            </li>
            <li>
              <strong>Target volume:</strong> 100+ calls
            </li>
          </ul>
        </Step>

        <Step n={2} title="Salesforce report B — engaged losses">
          <ul className="list-disc list-inside space-y-1 text-stewart-text">
            <li>
              <strong>Filter:</strong> CallDuration &gt; 60 seconds
            </li>
            <li>
              <strong>Date range:</strong> last 60–90 days
            </li>
            <li>
              <strong>Target volume:</strong> 100+ calls
            </li>
          </ul>
          <p className="mt-3 text-sm text-stewart-muted">
            Engaged losses are where your rep got past gatekeeping but
            didn&apos;t close. The contrast between wins and engaged losses is
            what tells us what your top performers say right before the prospect
            books — and what your strugglers say right before the prospect
            walks.
          </p>
        </Step>

        <Step n={3} title="Required CSV columns on both reports">
          <div className="mt-2 grid sm:grid-cols-2 gap-2 font-mono text-xs">
            {[
              "Activity.Id",
              "Activity.OwnerId",
              "Activity.OwnerName",
              "CallDuration",
              "Outcome",
              "CallDate",
            ].map((c) => (
              <code
                key={c}
                className="bg-stewart-bg border border-stewart-border rounded px-3 py-2 text-stewart-text"
              >
                {c}
              </code>
            ))}
          </div>
          <p className="mt-3 text-sm text-stewart-muted">
            Activity.OwnerId and OwnerName are what enable per-rep coaching.
            Without them every winning track is anonymous and we can't tell
            Alex from Marcus.
          </p>
        </Step>

        <Step n={4} title="Drop the audio files here">
          <p className="text-sm text-stewart-muted mb-4">
            Tag each batch as wins or engaged losses. Re-uploading the same
            call twice is harmless — we&apos;ll catch it.
          </p>
          <UploadDropzone
            token={token}
            initialUploaded={initialUploaded}
            initialTranscribed={initialTranscribed}
          />
        </Step>
      </ol>

      <section className="border-t border-stewart-border pt-8">
        <h2 className="text-sm uppercase tracking-wider text-stewart-muted mb-2">
          What you get back
        </h2>
        <p className="text-stewart-text leading-relaxed max-w-3xl">
          A per-setter scorecard for every one of your 35 reps, their single
          biggest opportunity cluster, and a daily training brief built on
          their own previous-day calls. See the &ldquo;What&apos;s Coming&rdquo;
          tab for what each rep&apos;s view will look like. Turnaround once
          your batch lands: 24–48 hours.
        </p>
      </section>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="bg-stewart-card border border-stewart-border rounded-lg p-6 list-none">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-xs font-mono text-stewart-accent border border-stewart-accent/40 rounded px-2 py-1">
          STEP {n}
        </span>
        <h3 className="text-lg font-semibold text-stewart-text">{title}</h3>
      </div>
      {children}
    </li>
  );
}
