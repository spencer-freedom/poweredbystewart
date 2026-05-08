"use client";

import { useState, useCallback, useRef } from "react";
import {
  parseCSV,
  autoMapColumns,
  buildRecipients,
  substituteForRecipient,
  type CsvParseResult,
  type ColumnMapping,
  type CsvRecipient,
  type RecipientResult,
} from "./csvUtils";
import { t, type Lang } from "./i18n";

// ─── i18n additions (inline — these fall through to English if not in i18n.ts) ──

interface CsvImportProps {
  lang?: Lang;
  campaignHtml: string;
  campaignSubject: string;
  onRecipientsReady: (recipients: CsvRecipient[]) => void;
}

export function CsvImport({ lang = "en", campaignHtml, campaignSubject, onRecipientsReady }: CsvImportProps) {
  const [parsed, setParsed] = useState<CsvParseResult | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [result, setResult] = useState<RecipientResult | null>(null);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [pasteText, setPasteText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processCSV = useCallback((raw: string) => {
    const p = parseCSV(raw);
    if (p.headers.length === 0) return;
    const maps = autoMapColumns(p.headers);
    setParsed(p);
    setMappings(maps);
    const r = buildRecipients(p, maps);
    setResult(r);
    setPreviewIdx(0);
    onRecipientsReady(r.recipients);
  }, [onRecipientsReady]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) processCSV(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handlePaste = () => {
    if (pasteText.trim()) {
      processCSV(pasteText);
      setShowPaste(false);
    }
  };

  const updateMapping = (idx: number, updates: Partial<ColumnMapping>) => {
    const next = [...mappings];
    next[idx] = { ...next[idx], ...updates };
    setMappings(next);
    if (parsed) {
      const r = buildRecipients(parsed, next);
      setResult(r);
      onRecipientsReady(r.recipients);
    }
  };

  const clear = () => {
    setParsed(null);
    setMappings([]);
    setResult(null);
    setPasteText("");
    onRecipientsReady([]);
  };

  const ja = lang === "ja";

  // ─── Upload / Paste Zone ─────────────────────────────────────
  if (!parsed) {
    return (
      <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stewart-text">
            {ja ? "受信者をインポート（CSV）" : "Import Recipients (CSV)"}
          </h3>
          <span className="text-[10px] text-stewart-muted font-mono">
            {ja ? "SQLクエリの出力をドロップ" : "Drop your SQL query export"}
          </span>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-stewart-accent bg-stewart-accent/10"
              : "border-stewart-border hover:border-stewart-accent/50"
          }`}
        >
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <svg viewBox="0 0 24 24" className="w-8 h-8 mx-auto mb-3 text-stewart-muted" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          <p className="text-sm text-stewart-muted">
            {ja ? "CSVファイルをドラッグ＆ドロップ、またはクリックして選択" : "Drag & drop a CSV file, or click to browse"}
          </p>
          <p className="text-[10px] text-stewart-muted mt-1">.csv, .tsv, .txt</p>
        </div>

        {/* Paste Toggle */}
        <div className="flex items-center gap-3">
          <button onClick={() => setShowPaste(!showPaste)} className="text-xs text-stewart-accent hover:underline">
            {ja ? "テキストを貼り付け" : "Or paste CSV text"}
          </button>
          <button
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                if (text) processCSV(text);
              } catch { /* clipboard access denied */ }
            }}
            className="text-xs text-stewart-accent hover:underline"
          >
            {ja ? "クリップボードから" : "Paste from clipboard"}
          </button>
        </div>

        {showPaste && (
          <div className="space-y-2">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-xs font-mono text-stewart-text"
              rows={6}
              placeholder={ja ? "CSVデータをここに貼り付け..." : "Paste CSV data here..."}
            />
            <button
              onClick={handlePaste}
              disabled={!pasteText.trim()}
              className="px-4 py-2 bg-stewart-accent text-white text-xs font-medium rounded-lg hover:bg-stewart-accent/80 transition-colors disabled:opacity-50"
            >
              {ja ? "インポート" : "Import"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Data Loaded — Mapping + Preview ─────────────────────────
  const previewRecipient = result?.recipients[previewIdx];

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-stewart-text">
                {ja ? "CSVインポート完了" : "CSV Imported"}
              </p>
              <p className="text-[10px] text-stewart-muted">
                {parsed.rowCount} {ja ? "行" : "rows"} · {parsed.headers.length} {ja ? "列" : "columns"} · {result?.recipients.length || 0} {ja ? "有効な受信者" : "valid recipients"}
                {(result?.errors.length || 0) > 0 && <span className="text-orange-400 ml-1">· {result?.errors.length} {ja ? "エラー" : "errors"}</span>}
                {(result?.optedOut || 0) > 0 && <span className="text-red-400 ml-1">· {result?.optedOut} {ja ? "オプトアウト" : "opted out"}</span>}
              </p>
            </div>
          </div>
          <button onClick={clear} className="text-xs text-red-400 hover:text-red-300 transition-colors">
            {ja ? "クリア" : "Clear CSV"}
          </button>
        </div>
      </div>

      {/* Column Mapping */}
      <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stewart-text">{ja ? "列マッピング" : "Column Mapping"}</h3>
          <span className="text-[10px] text-stewart-muted">
            {ja ? "CSV列をテンプレート変数にマッピング" : "Map CSV columns to template variables"}
          </span>
        </div>

        <div className="space-y-2">
          {mappings.map((m, idx) => (
            <div key={m.csvColumn} className="flex items-center gap-3 bg-stewart-bg rounded-lg px-3 py-2">
              {/* Column name */}
              <div className="w-32 shrink-0">
                <p className="text-xs font-semibold text-stewart-text truncate">{m.csvColumn}</p>
                <p className="text-[10px] text-stewart-muted truncate">{parsed.rows[0]?.[idx] || "—"}</p>
              </div>

              {/* Arrow */}
              <span className="text-stewart-muted text-xs">→</span>

              {/* Role selector */}
              <select
                value={m.role}
                onChange={(e) => {
                  const role = e.target.value as ColumnMapping["role"];
                  updateMapping(idx, {
                    role,
                    variableName: role === "variable" ? (m.variableName || m.csvColumn.toLowerCase().replace(/[^a-z0-9]/g, "_")) : undefined,
                  });
                }}
                className="bg-stewart-card border border-stewart-border rounded px-2 py-1 text-xs text-stewart-text appearance-none cursor-pointer"
              >
                <option value="skip">{ja ? "スキップ" : "Skip"}</option>
                <option value="email">{ja ? "受信者メール" : "Recipient Email"}</option>
                <option value="name">{ja ? "受信者名" : "Recipient Name → {name}"}</option>
                <option value="variable">{ja ? "テンプレート変数" : "Template Variable"}</option>
              </select>

              {/* Variable name input */}
              {m.role === "variable" && (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-stewart-accent text-xs font-mono">{"{"}</span>
                  <input
                    value={m.variableName || ""}
                    onChange={(e) => updateMapping(idx, { variableName: e.target.value })}
                    className="flex-1 bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-xs font-mono text-stewart-accent min-w-0"
                    placeholder="variable_name"
                  />
                  <span className="text-stewart-accent text-xs font-mono">{"}"}</span>
                </div>
              )}

              {/* Role badge */}
              {m.role === "email" && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 shrink-0">{ja ? "メール" : "EMAIL"}</span>
              )}
              {m.role === "name" && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 shrink-0">{"{name}"}</span>
              )}
              {m.role === "skip" && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stewart-border text-stewart-muted shrink-0">{ja ? "スキップ" : "SKIP"}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data Preview Table */}
      <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-stewart-border flex items-center justify-between">
          <p className="text-xs font-semibold text-stewart-text">{ja ? "データプレビュー" : "Data Preview"}</p>
          <p className="text-[10px] text-stewart-muted">{ja ? "最初の5行を表示" : "Showing first 5 rows"}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-stewart-border">
                {parsed.headers.map((h, i) => {
                  const m = mappings[i];
                  return (
                    <th key={h} className={`text-left px-3 py-2 font-medium whitespace-nowrap ${m?.role === "skip" ? "text-stewart-muted/40" : "text-stewart-muted"}`}>
                      {h}
                      {m?.role === "variable" && <span className="ml-1 text-stewart-accent font-mono">{`{${m.variableName}}`}</span>}
                      {m?.role === "email" && <span className="ml-1 text-green-400">✉</span>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-stewart-border/30">
              {parsed.rows.slice(0, 5).map((row, ri) => (
                <tr key={ri} className="hover:bg-stewart-border/20">
                  {row.map((cell, ci) => {
                    const m = mappings[ci];
                    return (
                      <td key={ci} className={`px-3 py-2 max-w-[200px] truncate ${m?.role === "skip" ? "text-stewart-muted/30" : "text-stewart-text"}`}>
                        {cell || "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-Recipient Email Preview */}
      {result && result.recipients.length > 0 && campaignHtml && (
        <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stewart-text">{ja ? "パーソナライズプレビュー" : "Personalized Preview"}</h3>
            <span className="text-[10px] text-stewart-muted">
              {ja ? `${result.recipients.length}件のパーソナライズメール` : `${result.recipients.length} personalized emails`}
            </span>
          </div>

          {/* Recipient Picker */}
          <div className="flex gap-3">
            <div className="w-56 shrink-0 bg-stewart-bg rounded-lg border border-stewart-border overflow-hidden">
              <div className="px-3 py-2 border-b border-stewart-border">
                <p className="text-[10px] text-stewart-muted uppercase tracking-wide">{ja ? "受信者" : "Recipients"}</p>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-stewart-border/30">
                {result.recipients.slice(0, 20).map((r, i) => (
                  <button
                    key={r.email}
                    onClick={() => setPreviewIdx(i)}
                    className={`w-full text-left px-3 py-2 transition-colors ${
                      previewIdx === i ? "bg-stewart-accent/15 text-stewart-accent" : "text-stewart-text hover:bg-stewart-border/30"
                    }`}
                  >
                    <p className="text-xs font-medium truncate">{r.name || r.email.split("@")[0]}</p>
                    <p className="text-[10px] text-stewart-muted truncate">{r.email}</p>
                  </button>
                ))}
                {result.recipients.length > 20 && (
                  <div className="px-3 py-2 text-[10px] text-stewart-muted text-center">
                    +{result.recipients.length - 20} {ja ? "件以上" : "more"}
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1 space-y-2">
              {previewRecipient && (
                <>
                  <div className="bg-stewart-bg rounded-lg px-3 py-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-stewart-muted">{ja ? "宛先：" : "To:"}</span>
                      <span className="text-xs text-stewart-text">{previewRecipient.name} &lt;{previewRecipient.email}&gt;</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-stewart-muted">{ja ? "件名：" : "Subject:"}</span>
                      <span className="text-xs text-stewart-text">{substituteForRecipient(campaignSubject, previewRecipient)}</span>
                    </div>
                  </div>
                  <div className="border border-stewart-border rounded-lg overflow-hidden bg-white">
                    <iframe
                      srcDoc={substituteForRecipient(campaignHtml, previewRecipient)}
                      className="w-full border-0"
                      style={{ height: "300px" }}
                      sandbox="allow-same-origin"
                      title="Recipient Preview"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-4 py-2.5">
              <p className="text-xs font-semibold text-orange-400 mb-1">
                {result.errors.length} {ja ? "行にエラーがあります" : "rows with errors"}
              </p>
              <div className="text-[10px] text-orange-300 space-y-0.5 max-h-20 overflow-y-auto">
                {result.errors.slice(0, 5).map((e, i) => (
                  <p key={i}>{ja ? `行 ${e.row}：${e.reason}` : `Row ${e.row}: ${e.reason}`}</p>
                ))}
                {result.errors.length > 5 && <p>...{result.errors.length - 5} {ja ? "件以上" : "more"}</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
