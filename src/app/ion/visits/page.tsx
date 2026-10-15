// /ion/visits — who opened the demo and how deep they went. Gated (every /ion
// path is), read straight from ion_access_log, which the middleware fills.
// A visitor is one IP + browser. Depth is counted, not guessed: pages seen,
// clips and whole calls played, voices played, and probes — requests the
// page never makes (bad signatures, unsigned windows, other calls, other
// /ion paths), which is what a builder poking at the API looks like.

export const dynamic = "force-dynamic";

type Hit = { at: string; path: string; query: string | null; decision: string; ip: string | null; ua: string | null; referer: string | null; country: string | null; region: string | null; city: string | null; email: string | null; seconds: number | null };

function browser(ua: string | null): string {
  if (!ua) return "no browser header";
  const os = /iPhone|iPad/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "";
  const b = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : ua.slice(0, 40);
  return [b, os].filter(Boolean).join(" on ");
}
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: "America/Denver", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const span = (a: string, b: string) => { const m = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000); return m < 1 ? "under a minute" : m < 60 ? `${m} min` : `${(m / 60).toFixed(1)} h`; };

export default async function Visits({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days } = await searchParams;
  const since = new Date(Date.now() - (parseInt(days || "14", 10) || 14) * 86400000).toISOString();
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  let hits: Hit[] = [];
  let error: string | null = null;
  if (url && key) {
    try {
      const res = await fetch(`${url}/rest/v1/ion_access_log?select=at,path,query,decision,ip,ua,referer,country,region,city,email,seconds&at=gte.${since}&order=at.asc&limit=20000`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store",
      });
      if (!res.ok) error = `log read failed (${res.status})`;
      else hits = (await res.json()) as Hit[];
    } catch (e) { error = String(e); }
  } else error = "no database configured";

  // An address that signed in at any point is that person for every row it
  // sent, including the ones before sign-in; otherwise you chase yourself.
  const emailByIp: Record<string, string> = {};
  for (const h of hits) if (h.ip && h.email) emailByIp[h.ip] = h.email;
  for (const h of hits) if (h.ip && !h.email && emailByIp[h.ip]) h.email = emailByIp[h.ip];

  type Visitor = { key: string; ip: string; ua: string | null; where: string; email: string | null; first: string; last: string; hits: Hit[]; pages: Set<string>; n: Record<string, number>; probes: Hit[]; preview: boolean };
  const visitors = new Map<string, Visitor>();
  for (const h of hits) {
    const k = h.email ? `${h.email}|${h.ua ?? ""}` : `${h.ip ?? "?"}|${h.ua ?? ""}`;
    const v = visitors.get(k) ?? { key: k, ip: h.ip ?? "?", ua: h.ua, where: [h.city, h.region, h.country].filter(Boolean).join(", "), email: h.email, first: h.at, last: h.at, hits: [], pages: new Set<string>(), n: {}, probes: [], preview: false };
    v.last = h.at; v.hits.push(h); v.n[h.decision] = (v.n[h.decision] ?? 0) + 1; if (h.email) v.email = h.email;
    if (h.decision === "page" || h.decision === "allowed") v.pages.add(h.path);
    if (h.decision === "preview") v.preview = true;
    if (h.decision === "probe" || h.decision === "bot" || h.decision === "gated" || h.decision === "denied") v.probes.push(h);
    visitors.set(k, v);
  }
  const list = [...visitors.values()].sort((a, b) => b.last.localeCompare(a.last));
  // A visit: requests with no gap over thirty minutes. Time on the page is a
  // floor, first request to last; a visit with one request counts a minute.
  type Session = { first: string; last: string; minutes: number; played: number; hits: Hit[] };
  const sessions = (v: Visitor): Session[] => {
    const out: Session[] = [];
    for (const h of v.hits) {
      const cur = out[out.length - 1];
      if (cur && new Date(h.at).getTime() - new Date(cur.last).getTime() <= 30 * 60000) { cur.last = h.at; cur.hits.push(h); }
      else out.push({ first: h.at, last: h.at, minutes: 0, played: 0, hits: [h] });
    }
    for (const sn of out) {
      // Measured when the page pinged; otherwise first request to last.
      const pinged = sn.hits.filter((h) => h.decision === "ping").reduce((n, h) => n + (h.seconds ?? 0), 0);
      sn.minutes = pinged ? Math.max(1, Math.round(pinged / 60)) : Math.max(1, Math.round((new Date(sn.last).getTime() - new Date(sn.first).getTime()) / 60000));
      sn.played = Math.round(sn.hits.filter((h) => h.decision === "listen").reduce((n, h) => n + (h.seconds ?? 0), 0) / 60);
    }
    return out;
  };
  const fmt = (m: number) => (m < 60 ? `${m} min` : `${(m / 60).toFixed(1)} h`);
  const timeSpent = (v: Visitor) => { const ss = sessions(v); const m = ss.reduce((n, x) => n + x.minutes, 0); const pl = ss.reduce((n, x) => n + x.played, 0); return `${ss.length} ${ss.length === 1 ? "visit" : "visits"} · ${fmt(m)} on the page · ${fmt(pl)} of tape played`; };
  // A person reads one page at a time. Three page loads inside two seconds,
  // or a whole call fetched in the same second its page was, is a program.
  const automated = (v: Visitor) => {
    const t = v.hits.filter((h) => h.decision === "page" || h.decision === "full").map((h) => new Date(h.at).getTime()).sort((a, b) => a - b);
    for (let i = 2; i < t.length; i++) if (t[i] - t[i - 2] <= 2000) return true;
    return false;
  };
  const depth = (v: Visitor) => {
    if (v.preview) return "a messaging app drew the link card: the link was just sent to this phone, nobody read it yet";
    if (automated(v)) return `an automated browser, not a person: ${v.n.page ?? 0} page loads and ${v.n.full ?? 0} whole-call fetches in bursts of under two seconds (a crawler, a link scanner, or an AI agent fetching the site)`;
    const out: string[] = [];
    const pages = [...v.pages].filter((p) => p.startsWith("/ion/call")).length;
    if (pages) out.push(`${pages} of 3 calls`);
    if (v.n.full) out.push(`${v.n.full} whole call${v.n.full === 1 ? "" : "s"}`);
    if (v.n.clip) out.push(`${v.n.clip} clip${v.n.clip === 1 ? "" : "s"}`);
    if (v.n.voice) out.push(`${v.n.voice} voice line${v.n.voice === 1 ? "" : "s"}`);
    if (v.probes.length) out.push(`${v.probes.length} probe${v.probes.length === 1 ? "" : "s"}`);
    return out.join(" · ") || "opened nothing that counts";
  };

  return (
    <main className="min-h-screen bg-black text-stewart-text">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-xs uppercase tracking-[0.25em] text-stewart-accent font-semibold">Powered by Stewart</p>
        <h1 className="mt-2 text-3xl font-bold">Who opened the demo, and how deep they went</h1>
        <p className="mt-2 text-sm text-stewart-muted">Last {parseInt(days || "14", 10) || 14} days. A visitor is one address and one browser. Probes are requests the page never makes: a clip with a bad signature, a window on another call, a voice saying something else, any other /ion path. A link preview is a messaging app drawing the card for a text, which means the link was forwarded, not read. Phones on a carrier network show the carrier&apos;s hub city, not the person&apos;s. You are in here too, as your email.</p>
        {error ? <p className="mt-6 text-sm text-stewart-danger">{error}</p> : null}
        {!error && !list.length ? <p className="mt-6 text-sm text-stewart-muted">Nothing yet.</p> : null}
        <div className="mt-6 space-y-3">
          {list.map((v) => (
            <details key={v.key} className={"rounded-xl border p-4 " + (v.probes.length ? "border-stewart-warning/50 bg-stewart-warning/5" : "border-stewart-border bg-stewart-card")}>
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="font-semibold">{v.preview ? "Link preview" : automated(v) ? `Automated · ${v.ip}` : v.email ?? v.ip}</span>
                  <span className="text-sm text-stewart-muted">{browser(v.ua)}{v.where ? ` · ${v.where}` : ""}</span>
                  <span className="text-sm text-stewart-muted">{when(v.first)}{v.first !== v.last ? ` → ${when(v.last)} (${span(v.first, v.last)})` : ""}</span>
                </div>
                <p className={"mt-1 text-sm " + (v.probes.length ? "text-stewart-warning font-semibold" : "")}>{depth(v)}{v.n.bot ? " · turned away as a script" : ""}</p>
                {!v.preview ? <p className="mt-0.5 text-sm text-stewart-muted">{timeSpent(v)}</p> : null}
                {v.hits[0]?.referer ? <p className="mt-0.5 text-xs text-stewart-muted">came from {v.hits[0].referer}</p> : null}
              </summary>
              <div className="mt-3 space-y-3 max-h-[32rem] overflow-auto">
                {sessions(v).map((sn, si) => (
                  <div key={si}>
                    <p className="text-xs font-semibold text-stewart-text">Visit {si + 1} · {when(sn.first)} · {sn.minutes} min on the page · {sn.played} min of tape played · {sn.hits.filter((h) => h.decision === "page" || h.decision === "allowed").length} pages, {sn.hits.filter((h) => h.decision === "clip" || h.decision === "full").length} plays</p>
                    <ul className="mt-1 space-y-0.5 text-xs font-mono text-stewart-muted">
                      {sn.hits.map((h, i) => (
                        <li key={i} className={h.decision === "probe" || h.decision === "bot" || h.decision === "denied" ? "text-stewart-warning" : h.decision === "gated" ? "text-stewart-text" : ""}>
                          {when(h.at)} · {h.decision}{h.seconds ? ` ${h.seconds}s` : ""} · {h.path.replace(/[?&]sig=[0-9a-f]+/, "")}{h.query && h.decision !== "listen" ? h.query.replace(/&sig=[0-9a-f]+/, "").replace(/&t=[0-9a-f]+/, "").replace(/text=[^&]+/, "text=…") : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}
