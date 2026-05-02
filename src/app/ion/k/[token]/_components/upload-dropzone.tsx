"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import {
  uploadCall,
  fetchUploadStatus,
  type CohortLabel,
  type UploadResult,
} from "@/lib/ion-api";
import { cn } from "@/lib/utils";

const MAX_BYTES = 100 * 1024 * 1024; // matches backend
const UPLOAD_CONCURRENCY = 4; // simultaneous in-flight uploads

type Item = {
  id: string;
  file: File;
  progress: number; // 0..1
  status: "queued" | "uploading" | "uploaded" | "duplicate" | "error";
  message?: string;
  callId?: string;
};

export function UploadDropzone({
  token,
  initialUploaded,
  initialTranscribed,
}: {
  token: string;
  initialUploaded: number;
  initialTranscribed: number;
}) {
  const [cohort, setCohort] = useState<CohortLabel>("wins");
  const [items, setItems] = useState<Item[]>([]);
  const [uploadedTotal, setUploadedTotal] = useState(initialUploaded);
  const [transcribedTotal, setTranscribedTotal] = useState(initialTranscribed);
  const [polling, setPolling] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await fetchUploadStatus(token);
      setUploadedTotal(s.totals.uploaded);
      setTranscribedTotal(s.totals.transcribed);
    } catch {
      // ignore
    }
  }, [token]);

  // Poll status while any item is uploading or recently finished — gives the
  // running count + dedup/transcribe feedback the user expects.
  useEffect(() => {
    if (!polling) return;
    const id = setInterval(refreshStatus, 5000);
    return () => clearInterval(id);
  }, [polling, refreshStatus]);

  const uploadOne = useCallback(
    async (item: Item) => {
      setItems((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "uploading", progress: 0.05 } : p
        )
      );
      try {
        const res: UploadResult = await uploadCall(token, item.file, cohort);
        setItems((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  progress: 1,
                  status: res.status === "duplicate" ? "duplicate" : "uploaded",
                  callId: res.call_id,
                  message:
                    res.status === "duplicate"
                      ? "Already received — skipping"
                      : "Received",
                }
              : p
          )
        );
      } catch (e) {
        setItems((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  progress: 1,
                  status: "error",
                  message: e instanceof Error ? e.message : String(e),
                }
              : p
          )
        );
      }
    },
    [token, cohort]
  );

  const drainQueue = useCallback(
    async (queued: Item[]) => {
      // Upload N at a time — completes a 480-file batch in ~2 minutes
      // instead of ~8. Backend handles concurrency + sha256 dedup fine.
      const queue = [...queued];
      const workers = Array(UPLOAD_CONCURRENCY)
        .fill(0)
        .map(async () => {
          while (queue.length) {
            const next = queue.shift();
            if (!next) break;
            await uploadOne(next);
          }
        });
      await Promise.all(workers);
      await refreshStatus();
    },
    [uploadOne, refreshStatus]
  );

  const onDrop = useCallback(
    async (accepted: File[], rejected: FileRejection[]) => {
      const stamp = Date.now();
      const rejectedItems: Item[] = rejected.map((r, i) => ({
        id: `rej-${stamp}-${i}`,
        file: r.file,
        progress: 0,
        status: "error",
        message:
          r.errors[0]?.message ||
          (r.file.size > MAX_BYTES ? "Exceeds 100 MB" : "Rejected"),
      }));
      const queued: Item[] = accepted.map((f, i) => ({
        id: `q-${stamp}-${i}`,
        file: f,
        progress: 0,
        status: "queued",
      }));
      setItems((prev) => [...prev, ...rejectedItems, ...queued]);
      setPolling(true);

      await drainQueue(queued);

      setTimeout(() => setPolling(false), 12000);
    },
    [drainQueue]
  );

  const retryErrored = useCallback(async () => {
    const errored = items.filter((it) => it.status === "error");
    if (errored.length === 0) return;
    setPolling(true);
    await drainQueue(errored);
    setTimeout(() => setPolling(false), 12000);
  }, [items, drainQueue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".webm"],
    },
    maxSize: MAX_BYTES,
  });

  const counts = items.reduce(
    (acc, it) => {
      acc[it.status] = (acc[it.status] || 0) + 1;
      return acc;
    },
    {} as Record<Item["status"], number>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-stewart-muted">These are…</span>
        <div className="inline-flex rounded border border-stewart-border overflow-hidden">
          {(
            [
              ["wins", "Wins"],
              ["engaged_losses", "Engaged Losses"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setCohort(k)}
              className={cn(
                "px-4 py-2 text-sm transition-colors",
                cohort === k
                  ? "bg-stewart-accent text-white"
                  : "bg-stewart-card text-stewart-muted hover:text-stewart-text"
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="text-xs text-stewart-muted">
          Per-file cap 100 MB · drop as many as you want, {UPLOAD_CONCURRENCY} upload in parallel
        </span>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-stewart-accent bg-stewart-accent/5"
            : "border-stewart-border bg-stewart-card hover:border-stewart-accent/50"
        )}
      >
        <input {...getInputProps()} />
        <p className="text-stewart-text font-medium">
          {isDragActive
            ? "Drop the call recordings here…"
            : "Drag-and-drop call recordings, or click to browse"}
        </p>
        <p className="text-xs text-stewart-muted mt-2">
          mp3, wav, m4a, aac, ogg, flac, webm — tagging as{" "}
          <span className="text-stewart-accent">
            {cohort === "wins" ? "Wins" : "Engaged Losses"}
          </span>
        </p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-stewart-muted">
          {counts.uploaded ? (
            <span className="text-stewart-success mr-3">
              ✓ {counts.uploaded} new
            </span>
          ) : null}
          {counts.duplicate ? (
            <span className="text-stewart-warning mr-3">
              ↻ {counts.duplicate} dedup
            </span>
          ) : null}
          {counts.error ? (
            <>
              <span className="text-stewart-danger mr-2">
                × {counts.error} errors
              </span>
              <button
                onClick={retryErrored}
                disabled={!!counts.uploading}
                className="text-xs underline text-stewart-danger hover:text-stewart-text disabled:opacity-50 mr-3"
              >
                retry
              </button>
            </>
          ) : null}
          {counts.uploading ? (
            <span className="text-stewart-accent mr-3">
              ↑ {counts.uploading} uploading…
            </span>
          ) : null}
        </div>
        <div className="text-xs text-stewart-muted font-mono">
          <span className="text-stewart-text">{uploadedTotal}</span> received ·{" "}
          <span className="text-stewart-text">{transcribedTotal}</span>{" "}
          processed
        </div>
      </div>

      {items.length > 0 && (
        <ul className="space-y-1.5 max-h-96 overflow-auto">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center gap-3 bg-stewart-card border border-stewart-border rounded px-3 py-2"
            >
              <span className="flex-1 truncate text-sm text-stewart-text">
                {it.file.name}
              </span>
              <span className="text-xs text-stewart-muted hidden sm:inline">
                {(it.file.size / (1024 * 1024)).toFixed(1)} MB
              </span>
              <span
                className={cn(
                  "text-xs font-mono px-2 py-0.5 rounded border whitespace-nowrap",
                  it.status === "uploaded" &&
                    "border-stewart-success/40 text-stewart-success bg-stewart-success/10",
                  it.status === "duplicate" &&
                    "border-stewart-warning/40 text-stewart-warning bg-stewart-warning/10",
                  it.status === "error" &&
                    "border-stewart-danger/40 text-stewart-danger bg-stewart-danger/10",
                  it.status === "uploading" &&
                    "border-stewart-accent/40 text-stewart-accent bg-stewart-accent/10",
                  it.status === "queued" &&
                    "border-stewart-border text-stewart-muted"
                )}
              >
                {it.message || it.status}
              </span>
              <div className="w-20 h-1.5 bg-stewart-border rounded overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    it.status === "error"
                      ? "bg-stewart-danger"
                      : "bg-stewart-accent"
                  )}
                  style={{ width: `${Math.round(it.progress * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
