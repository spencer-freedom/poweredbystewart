"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { EmailUnsubscribe } from "@/lib/types";
import { sourceBadge } from "@/lib/ui/badges";

interface Props {
  tenantId: string;
}

export function UnsubscribesTab({ tenantId }: Props) {
  const [unsubscribes, setUnsubscribes] = useState<EmailUnsubscribe[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setUnsubscribes(await api.emailListUnsubscribes(tenantId, 100));
    } catch {
      setError("Failed to load unsubscribes");
    }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">
        {error}
        <button onClick={() => { setError(""); load(); }} className="ml-3 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stewart-border bg-stewart-bg/50">
              <th className="text-left px-3 py-2 text-xs text-stewart-muted">Email</th>
              <th className="text-left px-3 py-2 text-xs text-stewart-muted">Reason</th>
              <th className="text-center px-3 py-2 text-xs text-stewart-muted">Source</th>
              <th className="text-left px-3 py-2 text-xs text-stewart-muted">Date</th>
            </tr>
          </thead>
          <tbody>
            {unsubscribes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-stewart-muted">
                  No unsubscribes. CAN-SPAM compliance link is included in every email.
                </td>
              </tr>
            ) : (
              unsubscribes.map((u) => (
                <tr key={u.id} className="border-b border-stewart-border/50 hover:bg-stewart-border/20">
                  <td className="px-3 py-2 text-xs font-mono">{u.email}</td>
                  <td className="px-3 py-2 text-xs text-stewart-muted">{u.reason || "\u2014"}</td>
                  <td className="px-3 py-2 text-center">{sourceBadge(u.source)}</td>
                  <td className="px-3 py-2 text-xs text-stewart-muted">{u.created_at?.slice(0, 10)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
