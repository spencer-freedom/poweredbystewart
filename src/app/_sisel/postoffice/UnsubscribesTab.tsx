"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { EmailUnsubscribe } from "@/lib/types";
import { sourceBadge } from "@/lib/ui/badges";
import { t, type Lang } from "./i18n";

interface Props {
  tenantId: string;
  lang?: Lang;
}

export function UnsubscribesTab({ tenantId, lang = "en" }: Props) {
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
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
        {error}
        <button onClick={() => { setError(""); load(); }} className="ml-3 underline">{t(lang, "Retry")}</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-semibold text-stewart-muted uppercase tracking-wide">{t(lang, "Unsubscribes")}</h2>

      <div className="bg-stewart-accent/5 border-l-2 border-stewart-accent rounded-r-lg px-4 py-2.5 text-sm text-stewart-muted">
        {t(lang, "CAN-SPAM compliant unsubscribe link is automatically included in every email footer.")}
      </div>

      <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stewart-border">
              <th className="text-left px-4 py-2.5 text-stewart-muted font-medium">{t(lang, "Email")}</th>
              <th className="text-left px-4 py-2.5 text-stewart-muted font-medium">{t(lang, "Reason")}</th>
              <th className="text-center px-4 py-2.5 text-stewart-muted font-medium">{t(lang, "Source")}</th>
              <th className="text-right px-4 py-2.5 text-stewart-muted font-medium">{t(lang, "Date")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stewart-border/30">
            {unsubscribes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-stewart-muted">
                  {t(lang, "No unsubscribes recorded.")}
                </td>
              </tr>
            ) : (
              unsubscribes.map((u) => (
                <tr key={u.id} className="hover:bg-stewart-border/20">
                  <td className="px-4 py-2.5 text-xs font-mono text-stewart-text">{u.email}</td>
                  <td className="px-4 py-2.5 text-xs text-stewart-muted">{u.reason || "\u2014"}</td>
                  <td className="px-4 py-2.5 text-center">{sourceBadge(u.source)}</td>
                  <td className="px-4 py-2.5 text-right text-xs text-stewart-muted">{u.created_at?.slice(0, 10)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
