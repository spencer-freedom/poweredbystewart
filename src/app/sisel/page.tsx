"use client";

import { useState } from "react";
import Link from "next/link";

type Tab = "overview" | "dashboard" | "email-studio" | "get-started";

// ─── Shared Data ────────────────────────────────────────────────

const CONTACT_BUCKETS = [
  { label: "Active", count: 18240, color: "text-green-400", bg: "bg-green-500/20" },
  { label: "Inactive", count: 6130, color: "text-yellow-400", bg: "bg-yellow-500/20" },
  { label: "Bounced", count: 4310, color: "text-red-400", bg: "bg-red-500/20" },
  { label: "Unsubscribed", count: 1320, color: "text-orange-400", bg: "bg-orange-500/20" },
];

const SAMPLE_SEGMENTS = [
  { name: "Bought in last 90 days", count: 4820, status: "active" },
  { name: "Hasn't ordered in 60+ days", count: 3190, status: "active" },
  { name: "Lifetime spend over $500", count: 1450, status: "active" },
  { name: "New customers this month", count: 312, status: "active" },
  { name: "VIP - Top 10% by spend", count: 680, status: "active" },
  { name: "International distributors", count: 2140, status: "draft" },
];

const SAMPLE_FLOWS = [
  { name: "New Customer Welcome Series", trigger: "First purchase", emails: 3, status: "active", sent: 1240, opened: "68%" },
  { name: "60-Day Win-Back", trigger: "No order in 60 days", emails: 2, status: "active", sent: 890, opened: "42%" },
  { name: "Cross-Sell: Personal Care", trigger: "Bought supplements", emails: 1, status: "draft", sent: 0, opened: "--" },
  { name: "Rank Advancement", trigger: "Rank change in Exigo", emails: 1, status: "active", sent: 156, opened: "74%" },
  { name: "Reorder Reminder", trigger: "30 days since last order", emails: 1, status: "active", sent: 2100, opened: "51%" },
];

const SAMPLE_CAMPAIGNS = [
  { name: "March Newsletter", status: "sent", sent: 18240, opened: "34%", clicked: "12%", date: "2026-03-10" },
  { name: "Spring Catalog Launch", status: "scheduled", sent: 0, opened: "--", clicked: "--", date: "2026-03-24" },
  { name: "New Product: Revive Serum", status: "draft", sent: 0, opened: "--", clicked: "--", date: "--" },
  { name: "February Newsletter", status: "sent", sent: 17890, opened: "31%", clicked: "9%", date: "2026-02-14" },
];

const COST_COMPARISON = [
  { feature: "Monthly cost", mailchimp: "$450/mo", platform: "$500/mo" },
  { feature: "Automation flows", mailchimp: "Not included", platform: "Included" },
  { feature: "Exigo integration", mailchimp: "66 hours quoted", platform: "Included" },
  { feature: "Purchase segments", mailchimp: "Manual CSV exports", platform: "Automatic from Exigo" },
  { feature: "Dead email charges", mailchimp: "You pay for all", platform: "Sorted + cleaned" },
  { feature: "List cleaning", mailchimp: "Manual", platform: "Automatic" },
  { feature: "Unsubscribe handling", mailchimp: "Manual sync needed", platform: "Auto + synced to Exigo" },
  { feature: "Email limit", mailchimp: "Tiered / capped", platform: "Unlimited" },
];

const TEMPLATES = [
  { id: 1, name: "Welcome Series - Email 1", type: "automation", subject: "Welcome to Sisel, {name}!", status: "active", variables: ["name", "products"] },
  { id: 2, name: "Monthly Newsletter", type: "campaign", subject: "Sisel Monthly: What's New", status: "active", variables: ["name"] },
  { id: 3, name: "Reorder Reminder", type: "automation", subject: "{name}, it's been 30 days", status: "active", variables: ["name", "products"] },
  { id: 4, name: "Win-Back Campaign", type: "automation", subject: "We miss you, {name}", status: "active", variables: ["name", "products"] },
  { id: 5, name: "Spring Catalog 2026", type: "campaign", subject: "Spring Collection is Here", status: "draft", variables: ["name", "products"] },
  { id: 6, name: "Rank Advancement", type: "automation", subject: "Congratulations on your new rank!", status: "active", variables: ["name"] },
];

const SAMPLE_PRODUCTS = [
  { id: 1, name: "SupraMax", price: "$54.95", image: "supplement", tag: "Best Seller" },
  { id: 2, name: "Revive Serum", price: "$89.00", image: "skincare", tag: "New" },
  { id: 3, name: "Triangle of Life", price: "$129.95", image: "supplement", tag: "Popular" },
  { id: 4, name: "SiselSafe Toothpaste", price: "$12.95", image: "personal", tag: "" },
  { id: 5, name: "Eternity Water Pitcher", price: "$349.00", image: "water", tag: "Premium" },
  { id: 6, name: "SiselRich Shampoo", price: "$24.95", image: "personal", tag: "" },
];

// ─── Shared Components ──────────────────────────────────────────

function statusBadge(s: string) {
  const colors: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    draft: "bg-blue-500/20 text-blue-400",
    scheduled: "bg-purple-500/20 text-purple-400",
    sent: "bg-green-500/20 text-green-400",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[s] || "bg-stewart-border text-stewart-muted"}`}>{s}</span>;
}

function StatCard({ label, value, sub, variant }: { label: string; value: string | number; sub?: string; variant?: string }) {
  const valueColor = variant === "success" ? "text-green-400" : variant === "danger" ? "text-red-400" : variant === "warning" ? "text-yellow-400" : "text-stewart-text";
  return (
    <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
      <p className="text-xs text-stewart-muted">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueColor}`}>{typeof value === "number" ? value.toLocaleString() : value}</p>
      {sub && <p className="text-xs text-stewart-muted mt-1">{sub}</p>}
    </div>
  );
}

function PitchCallout({ children, show }: { children: React.ReactNode; show: boolean }) {
  if (!show) return null;
  return (
    <div className="bg-stewart-accent/5 border border-stewart-accent/20 rounded-lg p-4 text-sm text-stewart-muted leading-relaxed">
      {children}
    </div>
  );
}

function ProductIcon({ type }: { type: string }) {
  const colors: Record<string, string> = { supplement: "bg-green-500/20 text-green-400", skincare: "bg-purple-500/20 text-purple-400", personal: "bg-blue-500/20 text-blue-400", water: "bg-cyan-500/20 text-cyan-400" };
  const icons: Record<string, string> = { supplement: "S", skincare: "R", personal: "P", water: "W" };
  return <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold ${colors[type] || "bg-stewart-border text-stewart-muted"}`}>{icons[type] || "?"}</div>;
}

// ─── Tab 1: Overview ────────────────────────────────────────────

function OverviewTab({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  return (
    <div className="space-y-8 max-w-3xl">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-stewart-text">A smarter email layer for Sisel</h2>
        <p className="text-stewart-muted leading-relaxed">
          Your customer data lives inside Exigo, but it{"'"}s not being used to drive follow-up,
          retention, or repeat purchases. You{"'"}re paying $450/month for Mailchimp with limited
          automation, and Exigo quoted 66 hours just to connect the two.
        </p>
        <p className="text-stewart-muted leading-relaxed">
          This system replaces Mailchimp and connects directly to Exigo. It{"'"}s already built
          and running -- not a proposal or a development project. It{"'"}s a deployment.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 text-center">
          <p className="text-3xl font-bold text-stewart-accent">30K</p>
          <p className="text-xs text-stewart-muted mt-1">Contacts synced from Exigo</p>
        </div>
        <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 text-center">
          <p className="text-3xl font-bold text-green-400">42K</p>
          <p className="text-xs text-stewart-muted mt-1">Emails sent last month</p>
        </div>
        <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 text-center">
          <p className="text-3xl font-bold text-stewart-accent">34%</p>
          <p className="text-xs text-stewart-muted mt-1">Open rate (industry avg: 21%)</p>
        </div>
      </div>

      <div className="bg-stewart-accent/10 border border-stewart-accent/30 rounded-lg p-5">
        <p className="text-stewart-accent text-sm font-medium leading-relaxed">
          Built on Amazon Web Services -- the same email infrastructure behind companies sending
          billions of emails per month. Full CAN-SPAM compliance, automated list hygiene,
          and a dashboard for campaign management.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-stewart-text">What{"'"}s included</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            "Direct Exigo sync -- no CSV exports",
            "Smart contact buckets (active, bounced, inactive)",
            "Purchase-based audience segments",
            "Automated email flows (welcome, win-back, reorder)",
            "Newsletters & seasonal catalogs",
            "Unlimited sending included",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-stewart-muted">
              <span className="text-stewart-accent mt-0.5 flex-shrink-0">&#10003;</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => onNavigate("dashboard")}
          className="px-6 py-3 bg-stewart-accent text-white text-sm font-medium rounded-lg hover:bg-stewart-accent/80 transition-colors"
        >
          See the platform &rarr;
        </button>
        <button
          onClick={() => onNavigate("get-started")}
          className="px-6 py-3 bg-stewart-card border border-stewart-border text-stewart-text text-sm font-medium rounded-lg hover:bg-stewart-border/50 transition-colors"
        >
          View pricing
        </button>
      </div>
    </div>
  );
}

// ─── Tab 2: Platform Preview (Dashboard + pitch callouts) ───────

function DashboardTab({ showPitch }: { showPitch: boolean }) {
  const totalContacts = CONTACT_BUCKETS.reduce((sum, b) => sum + b.count, 0);

  return (
    <div className="space-y-6">
      {/* Contact Health */}
      <PitchCallout show={showPitch}>
        <strong className="text-stewart-accent">Contact Health:</strong> Every contact synced from Exigo is
        automatically sorted into buckets. You see exactly who{"'"}s active, who{"'"}s bounced, who{"'"}s unsubscribed.
        No more paying to email dead addresses.
      </PitchCallout>
      <div>
        <h2 className="text-sm font-semibold text-stewart-muted uppercase tracking-wide mb-3">Contact Health</h2>
        <div className="grid grid-cols-5 gap-3">
          <StatCard label="Total Contacts" value={totalContacts} sub="Synced from Exigo" />
          {CONTACT_BUCKETS.map((b) => (
            <StatCard key={b.label} label={b.label} value={b.count} variant={b.label === "Active" ? "success" : b.label === "Bounced" ? "danger" : b.label === "Inactive" ? "warning" : undefined} />
          ))}
        </div>
      </div>

      <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
        <p className="text-xs text-stewart-muted mb-2">List Health Distribution</p>
        <div className="flex h-6 rounded overflow-hidden">
          {CONTACT_BUCKETS.map((b) => {
            const pct = (b.count / totalContacts) * 100;
            const bgMap: Record<string, string> = { Active: "bg-green-500", Inactive: "bg-yellow-500", Bounced: "bg-red-500", Unsubscribed: "bg-orange-500" };
            return (
              <div key={b.label} className={`${bgMap[b.label]} relative group`} style={{ width: `${pct}%` }}>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {b.label} {pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-2">
          {CONTACT_BUCKETS.map((b) => (
            <div key={b.label} className="flex items-center gap-1.5 text-xs text-stewart-muted">
              <span className={`w-2.5 h-2.5 rounded-sm ${b.bg}`} />
              {b.label}: {((b.count / totalContacts) * 100).toFixed(0)}%
            </div>
          ))}
        </div>
      </div>

      {/* Performance */}
      <PitchCallout show={showPitch}>
        <strong className="text-stewart-accent">Performance:</strong> Real-time metrics across all campaigns.
        Real-time metrics across all campaigns so you always know what&apos;s working.
      </PitchCallout>
      <div>
        <h2 className="text-sm font-semibold text-stewart-muted uppercase tracking-wide mb-3">Performance</h2>
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Emails Sent (30d)" value="42,680" sub="All campaigns" variant="success" />
          <StatCard label="Avg Open Rate" value="34%" sub="Industry avg: 21%" variant="success" />
          <StatCard label="Avg Click Rate" value="12%" sub="Industry avg: 3%" variant="success" />
          <StatCard label="Monthly Cost" value="$500" sub="vs $450 Mailchimp" />
        </div>
      </div>

      {/* Automation Flows */}
      <PitchCallout show={showPitch}>
        <strong className="text-stewart-accent">Automation Flows:</strong> Set up once, run automatically.
        Welcome series for new customers, win-back emails for lapsed buyers, reorder reminders,
        rank advancement congratulations -- all triggered by real Exigo data.
      </PitchCallout>
      <div>
        <h2 className="text-sm font-semibold text-stewart-muted uppercase tracking-wide mb-3">Automation Flows</h2>
        <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stewart-border">
                <th className="text-left px-4 py-2.5 text-stewart-muted font-medium">Flow</th>
                <th className="text-left px-4 py-2.5 text-stewart-muted font-medium">Trigger</th>
                <th className="text-center px-4 py-2.5 text-stewart-muted font-medium">Emails</th>
                <th className="text-center px-4 py-2.5 text-stewart-muted font-medium">Status</th>
                <th className="text-right px-4 py-2.5 text-stewart-muted font-medium">Sent</th>
                <th className="text-right px-4 py-2.5 text-stewart-muted font-medium">Open Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stewart-border/30">
              {SAMPLE_FLOWS.map((flow) => (
                <tr key={flow.name}>
                  <td className="px-4 py-2.5 font-medium text-stewart-text">{flow.name}</td>
                  <td className="px-4 py-2.5 text-stewart-muted">{flow.trigger}</td>
                  <td className="px-4 py-2.5 text-center text-stewart-muted">{flow.emails}</td>
                  <td className="px-4 py-2.5 text-center">{statusBadge(flow.status)}</td>
                  <td className="px-4 py-2.5 text-right text-stewart-muted">{flow.sent.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-stewart-muted">{flow.opened}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audience Segments */}
      <PitchCallout show={showPitch}>
        <strong className="text-stewart-accent">Audience Segments:</strong> Create segments based on real
        purchase behavior from Exigo. No more manual CSV exports. Segments update automatically
        as new orders come in.
      </PitchCallout>
      <div>
        <h2 className="text-sm font-semibold text-stewart-muted uppercase tracking-wide mb-3">Audience Segments</h2>
        <div className="grid grid-cols-3 gap-3">
          {SAMPLE_SEGMENTS.map((seg) => (
            <div key={seg.name} className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-stewart-text">{seg.name}</p>
                {statusBadge(seg.status)}
              </div>
              <p className="text-2xl font-bold text-stewart-accent">{seg.count.toLocaleString()}</p>
              <p className="text-xs text-stewart-muted">contacts match</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Campaigns */}
      <PitchCallout show={showPitch}>
        <strong className="text-stewart-accent">Campaigns:</strong> Send newsletters, product launches,
        seasonal catalogs. Pick your audience, preview the email, schedule or send immediately.
        Everything you{"'"}re doing in Mailchimp today, plus automation.
      </PitchCallout>
      <div>
        <h2 className="text-sm font-semibold text-stewart-muted uppercase tracking-wide mb-3">Recent Campaigns</h2>
        <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stewart-border">
                <th className="text-left px-4 py-2.5 text-stewart-muted font-medium">Campaign</th>
                <th className="text-center px-4 py-2.5 text-stewart-muted font-medium">Status</th>
                <th className="text-right px-4 py-2.5 text-stewart-muted font-medium">Sent</th>
                <th className="text-right px-4 py-2.5 text-stewart-muted font-medium">Opened</th>
                <th className="text-right px-4 py-2.5 text-stewart-muted font-medium">Clicked</th>
                <th className="text-right px-4 py-2.5 text-stewart-muted font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stewart-border/30">
              {SAMPLE_CAMPAIGNS.map((c) => (
                <tr key={c.name}>
                  <td className="px-4 py-2.5 font-medium text-stewart-text">{c.name}</td>
                  <td className="px-4 py-2.5 text-center">{statusBadge(c.status)}</td>
                  <td className="px-4 py-2.5 text-right text-stewart-muted">{c.sent > 0 ? c.sent.toLocaleString() : "--"}</td>
                  <td className="px-4 py-2.5 text-right text-stewart-muted">{c.opened}</td>
                  <td className="px-4 py-2.5 text-right text-stewart-muted">{c.clicked}</td>
                  <td className="px-4 py-2.5 text-right text-stewart-muted">{c.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exigo Sync */}
      <PitchCallout show={showPitch}>
        <strong className="text-stewart-accent">Exigo Sync:</strong> Your customer database syncs
        automatically. New contacts, orders, rank changes -- all pulled via Exigo{"'"}s API.
        No 66-hour integration project. It{"'"}s already built.
      </PitchCallout>
      <div>
        <h2 className="text-sm font-semibold text-stewart-muted uppercase tracking-wide mb-3">Exigo Sync</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
            <p className="text-xs text-stewart-muted">Last Sync</p>
            <p className="text-lg font-bold text-green-400 mt-1">2 hours ago</p>
            <p className="text-xs text-stewart-muted mt-1">Next: in 58 minutes</p>
          </div>
          <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
            <p className="text-xs text-stewart-muted">Contacts Synced</p>
            <p className="text-lg font-bold text-stewart-text mt-1">30,000</p>
            <p className="text-xs text-stewart-muted mt-1">+42 new this week</p>
          </div>
          <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
            <p className="text-xs text-stewart-muted">Orders Synced</p>
            <p className="text-lg font-bold text-stewart-text mt-1">148,320</p>
            <p className="text-xs text-stewart-muted mt-1">Purchase history loaded</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 3: Email Studio (with pitch callouts) ──────────────────

function EmailStudioTab({ showPitch }: { showPitch: boolean }) {
  const [step, setStep] = useState<"templates" | "compose" | "preview">("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([1, 2, 3]);
  const [selectedSegment, setSelectedSegment] = useState("Bought in last 90 days");

  const template = TEMPLATES.find(t => t.id === selectedTemplate);

  if (step === "templates") {
    return (
      <div className="space-y-6">
        <PitchCallout show={showPitch}>
          <strong className="text-stewart-accent">Email Studio:</strong> This is where campaigns
          are created. Pick a template (or start from scratch), select products from your catalog,
          choose your audience segment, preview, and send. Everything Mailchimp does, plus
          automatic product injection from your catalog and Exigo-powered audience targeting.
        </PitchCallout>

        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Templates" value={TEMPLATES.length} sub={`${TEMPLATES.filter(t => t.status === "active").length} active`} />
          <StatCard label="Drafts" value={2} sub="Ready to finish" variant="warning" />
          <StatCard label="Sent This Month" value="36,130" sub="All campaigns" variant="success" />
          <StatCard label="Send Rate" value="14/sec" sub="High-speed delivery" />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stewart-muted uppercase tracking-wide">Email Templates</h2>
          <button onClick={() => { setSelectedTemplate(null); setStep("compose"); }} className="px-4 py-2 bg-stewart-accent text-white text-sm font-medium rounded-lg hover:bg-stewart-accent/80 transition-colors">
            + New Campaign
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="bg-stewart-card border border-stewart-border rounded-lg p-5 hover:border-stewart-accent/50 transition-colors cursor-pointer group" onClick={() => { setSelectedTemplate(t.id); setStep("compose"); }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-stewart-accent/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-stewart-accent" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 8l10 6 10-6" /></svg>
                </div>
                {statusBadge(t.status)}
              </div>
              <h3 className="text-sm font-semibold text-stewart-text mb-1">{t.name}</h3>
              <p className="text-xs text-stewart-muted mb-3">{t.subject}</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stewart-border text-stewart-muted">{t.type}</span>
                {t.variables.includes("products") && <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-400">product grid</span>}
              </div>
              <div className="mt-3 pt-3 border-t border-stewart-border">
                <span className="text-xs text-stewart-accent opacity-0 group-hover:opacity-100 transition-opacity">Use template &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === "compose") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setStep("templates")} className="text-stewart-accent hover:underline">Templates</button>
          <span className="text-stewart-muted">/</span>
          <span className="text-stewart-text">{template ? template.name : "New Campaign"}</span>
        </div>

        <PitchCallout show={showPitch}>
          <strong className="text-stewart-accent">Campaign Builder:</strong> Select products from
          your catalog and they automatically render as email-safe HTML cards. Choose an audience
          segment powered by Exigo purchase data. Schedule or send immediately. The preview shows
          exactly what the recipient will see.
        </PitchCallout>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-stewart-text">Campaign Details</h3>
              <div>
                <label className="text-xs text-stewart-muted block mb-1">Campaign Name</label>
                <div className="bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm text-stewart-text">{template ? `${template.name} - March 2026` : "New Campaign"}</div>
              </div>
              <div>
                <label className="text-xs text-stewart-muted block mb-1">Subject Line</label>
                <div className="bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm text-stewart-text">{template ? template.subject : "Enter subject line..."}</div>
                <p className="text-[10px] text-stewart-muted mt-1">Variables auto-populate per recipient</p>
              </div>
            </div>

            <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-stewart-text">Product Grid</h3>
                <span className="text-xs text-stewart-muted">{selectedProducts.length} selected</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {SAMPLE_PRODUCTS.map((p) => {
                  const isSelected = selectedProducts.includes(p.id);
                  return (
                    <div key={p.id} className={`relative rounded-lg p-3 cursor-pointer transition-all ${isSelected ? "bg-stewart-accent/10 border-2 border-stewart-accent" : "bg-stewart-bg border border-stewart-border hover:border-stewart-accent/30"}`} onClick={() => setSelectedProducts(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}>
                      {p.tag && <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-stewart-accent/20 text-stewart-accent">{p.tag}</span>}
                      <div className="flex items-center gap-3"><ProductIcon type={p.image} /><div><p className="text-sm font-medium text-stewart-text">{p.name}</p><p className="text-xs text-stewart-muted">{p.price}</p></div></div>
                      {isSelected && <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-stewart-accent flex items-center justify-center"><svg viewBox="0 0 16 16" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 8l3 3 7-7" /></svg></div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Email preview */}
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-stewart-text">Email Preview</h3>
              <div className="bg-white rounded-lg p-6 text-gray-800">
                <div className="text-center mb-6"><div className="inline-block px-4 py-2 bg-green-50 rounded"><span className="text-green-700 font-bold text-lg tracking-wider">SISEL</span></div></div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{template?.subject.replace("{name}", "Karen") || "Your Email Subject"}</h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">Hi Karen, we wanted to share some products we think you{"'"}ll love based on your recent purchases.</p>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Featured Products</p>
                  <div className="space-y-3">
                    {SAMPLE_PRODUCTS.filter(p => selectedProducts.includes(p.id)).map((p) => (
                      <div key={p.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center"><ProductIcon type={p.image} /></div>
                        <div className="flex-1"><p className="text-sm font-semibold text-gray-900">{p.name}</p><p className="text-sm text-gray-500">{p.price}</p></div>
                        <div className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded">Shop Now</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-gray-200 mt-6 pt-4 text-center"><p className="text-[10px] text-gray-400">Sisel International | Pleasant Grove, UT<br /><span className="underline">Unsubscribe</span> | <span className="underline">Manage Preferences</span></p></div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-stewart-text">Audience</h3>
              <select value={selectedSegment} onChange={(e) => setSelectedSegment(e.target.value)} className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-3 py-2.5 text-sm text-stewart-text appearance-none cursor-pointer">
                {SAMPLE_SEGMENTS.map(s => <option key={s.name} value={s.name}>{s.name} ({s.count.toLocaleString()})</option>)}
                <option value="all">All Active Contacts (18,240)</option>
              </select>
              <div className="bg-stewart-bg rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-stewart-muted">Recipients</span><span className="font-bold text-stewart-text">{selectedSegment === "all" ? "18,240" : SAMPLE_SEGMENTS.find(s => s.name === selectedSegment)?.count.toLocaleString() || "0"}</span></div>
                <div className="flex justify-between"><span className="text-stewart-muted">Unsubscribed</span><span className="text-red-400">-124</span></div>
                <div className="flex justify-between pt-2 border-t border-stewart-border"><span className="text-stewart-muted">Will receive</span><span className="font-bold text-green-400">{selectedSegment === "all" ? "18,116" : ((SAMPLE_SEGMENTS.find(s => s.name === selectedSegment)?.count || 0) - 124).toLocaleString()}</span></div>
              </div>
            </div>

            <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-stewart-text">Schedule</h3>
              <div className="bg-stewart-bg border border-stewart-border rounded-lg px-3 py-2.5 text-sm text-stewart-text">March 24, 2026 at 9:00 AM MT</div>
              <div className="bg-stewart-bg rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-stewart-muted">Est. delivery</span><span className="text-stewart-text font-medium">99.8%</span></div>
                <div className="flex justify-between"><span className="text-stewart-muted">Est. send time</span><span className="text-stewart-text font-medium">{Math.ceil((selectedSegment === "all" ? 18116 : (SAMPLE_SEGMENTS.find(s => s.name === selectedSegment)?.count || 0) - 124) / 14 / 60)} min</span></div>
              </div>
            </div>

            <button onClick={() => setStep("preview")} className="w-full px-4 py-3 bg-stewart-accent text-white text-sm font-medium rounded-lg hover:bg-stewart-accent/80 transition-colors">Preview & Send</button>
            <button className="w-full px-4 py-2.5 bg-stewart-card border border-stewart-border text-stewart-text text-sm font-medium rounded-lg hover:bg-stewart-border/50 transition-colors">Save as Draft</button>
            <button onClick={() => setStep("templates")} className="w-full px-4 py-2 text-stewart-muted text-sm hover:text-stewart-text transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // Preview step
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => setStep("templates")} className="text-stewart-accent hover:underline">Templates</button>
        <span className="text-stewart-muted">/</span>
        <button onClick={() => setStep("compose")} className="text-stewart-accent hover:underline">Compose</button>
        <span className="text-stewart-muted">/</span>
        <span className="text-stewart-text">Preview</span>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-stewart-card border border-stewart-border rounded-lg p-5">
            <h3 className="text-sm font-semibold text-stewart-text mb-4">Send Preview</h3>
            <div className="bg-stewart-bg rounded-lg p-4 space-y-3 text-sm">
              {[
                ["From", "Sisel International <mail@sisel.com>"],
                ["Subject", template?.subject.replace("{name}", "Karen") || "Your Email Subject"],
                ["Recipients", `${selectedSegment === "all" ? "18,116" : ((SAMPLE_SEGMENTS.find(s => s.name === selectedSegment)?.count || 0) - 124).toLocaleString()} contacts`],
                ["Products", `${selectedProducts.length} product cards`],
                ["Scheduled", "March 24, 2026 at 9:00 AM MT"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between"><span className="text-stewart-muted">{label}</span><span className="text-stewart-text">{value}</span></div>
              ))}
              <div className="flex justify-between"><span className="text-stewart-muted">Est. delivery</span><span className="text-green-400 font-medium">99.8%</span></div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <button onClick={() => setStep("templates")} className="w-full px-4 py-3 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors">Confirm & Schedule</button>
          <button onClick={() => setStep("compose")} className="w-full px-4 py-2.5 bg-stewart-card border border-stewart-border text-stewart-text text-sm font-medium rounded-lg hover:bg-stewart-border/50 transition-colors">Back to Editor</button>
          <div className="bg-stewart-card border border-stewart-border rounded-lg p-4 mt-4">
            <p className="text-xs font-semibold text-stewart-text mb-2">Dry Run</p>
            <p className="text-[11px] text-stewart-muted mb-3">Send a test to yourself. Renders with real data from the first contact in your segment.</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-stewart-bg border border-stewart-border rounded px-3 py-2 text-xs text-stewart-muted">karen@sisel.com</div>
              <button className="px-3 py-2 bg-stewart-border text-stewart-text text-xs font-medium rounded hover:bg-stewart-accent/20 transition-colors">Send Test</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 4: Get Started ─────────────────────────────────────────

function GetStartedTab() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-stewart-text">Ready to get started?</h2>
        <p className="text-stewart-muted leading-relaxed">
          You{"'"}re paying $450/month for Mailchimp with limited automation and no Exigo connection.
          You were quoted 66 hours just for the integration. This system gives you everything --
          email, automation, purchase targeting, list cleanup, and the Exigo integration --
          and it{"'"}s already built.
        </p>
      </div>

      {/* Cost Comparison */}
      <div>
        <h3 className="text-lg font-semibold text-stewart-text mb-3">Cost Comparison</h3>
        <div className="overflow-hidden rounded-lg border border-stewart-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stewart-border/50">
                <th className="text-left px-4 py-2.5 text-stewart-muted font-medium"></th>
                <th className="text-center px-4 py-2.5 text-stewart-muted font-medium">Mailchimp (Current)</th>
                <th className="text-center px-4 py-2.5 text-stewart-accent font-semibold">This System</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stewart-border/30">
              {COST_COMPARISON.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? "bg-stewart-card" : "bg-stewart-bg"}>
                  <td className="px-4 py-2.5 font-medium text-stewart-text">{row.feature}</td>
                  <td className="px-4 py-2.5 text-center text-stewart-muted">{row.mailchimp}</td>
                  <td className="px-4 py-2.5 text-center font-semibold text-stewart-accent">{row.platform}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investment */}
      <div>
        <h3 className="text-lg font-semibold text-stewart-text mb-3">Investment</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-stewart-accent/10 border border-stewart-accent/30 rounded-lg p-5 text-center">
            <p className="text-stewart-accent text-2xl font-bold">$1,000</p>
            <p className="text-stewart-accent text-sm font-medium mt-1">One-time setup</p>
            <p className="text-stewart-muted text-xs mt-2 leading-relaxed">Exigo integration, list cleanup, template migration, domain setup, first automation flows</p>
          </div>
          <div className="bg-stewart-accent/10 border border-stewart-accent/30 rounded-lg p-5 text-center">
            <p className="text-stewart-accent text-2xl font-bold">$500/mo</p>
            <p className="text-stewart-accent text-sm font-medium mt-1">Monthly</p>
            <p className="text-stewart-muted text-xs mt-2 leading-relaxed">Unlimited sending, ongoing sync, automation, list hygiene, campaign management, direct support</p>
          </div>
        </div>
      </div>

      {/* What I Need */}
      <div>
        <h3 className="text-lg font-semibold text-stewart-text mb-3">What I need to get started</h3>
        <div className="space-y-3">
          {[
            { n: 1, title: "Exigo API access", desc: "Your IT team or Exigo account manager provides API credentials." },
            { n: 2, title: "Existing Mailchimp templates", desc: "So I can migrate your current email designs." },
            { n: 3, title: "Sending domain", desc: "A subdomain for emails (e.g., mail.sisel.com). I handle DNS setup." },
            { n: 4, title: "Your top automation priorities", desc: "Which auto-triggered flows matter most? I'll set up your top 2-3." },
          ].map((item) => (
            <div key={item.n} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stewart-accent/20 text-stewart-accent text-xs font-bold flex items-center justify-center">{item.n}</span>
              <div><p className="text-sm font-medium text-stewart-text">{item.title}</p><p className="text-xs text-stewart-muted">{item.desc}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h3 className="text-lg font-semibold text-stewart-text mb-3">Timeline</h3>
        <div className="space-y-2">
          {[
            { week: "Week 1", desc: "Setup -- Exigo integration, list import, verification, template migration" },
            { week: "Weeks 2-3", desc: "Warmup -- send to most engaged contacts first, gradually increase" },
            { week: "Weeks 3-4", desc: "Automation -- build and activate your first auto-triggered flows" },
            { week: "Week 4", desc: "Full launch -- campaigns and automations running" },
            { week: "Ongoing", desc: "Automatic sync, list hygiene, automation monitoring, support" },
          ].map((item) => (
            <div key={item.week} className="flex gap-4 text-sm">
              <span className="flex-shrink-0 w-20 font-semibold text-stewart-text">{item.week}</span>
              <span className="text-stewart-muted">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-stewart-card border border-stewart-border rounded-lg p-6">
        <p className="text-stewart-text text-sm font-semibold leading-relaxed">
          I{"'"}m happy to walk through it live and show exactly how it works. The demo you{"'"}ve
          been looking at is the real system -- not a mockup.
        </p>
        <div className="mt-4 pt-4 border-t border-stewart-border">
          <p className="text-sm font-medium text-stewart-text">Spencer Colby</p>
          <p className="text-xs text-stewart-muted">stewart@poweredbystewart.com</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

const TAB_CONFIG: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "dashboard", label: "Platform Preview" },
  { key: "email-studio", label: "Email Studio" },
  { key: "get-started", label: "Get Started" },
];

export default function SiselPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [showPitch, setShowPitch] = useState(true);

  return (
    <div className="min-h-screen bg-stewart-bg">
      {/* Header */}
      <div className="border-b border-stewart-border bg-stewart-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-stewart-muted hover:text-stewart-text text-sm transition-colors">&larr; Back</Link>
            <div className="w-px h-6 bg-stewart-border" />
            <div>
              <h1 className="text-xl font-bold text-stewart-text">Sisel International</h1>
              <p className="text-stewart-muted text-xs">Email Marketing & Automation Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {(tab === "dashboard" || tab === "email-studio") && (
              <button
                onClick={() => setShowPitch(!showPitch)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  showPitch
                    ? "bg-stewart-accent/20 text-stewart-accent border border-stewart-accent/30"
                    : "bg-stewart-border text-stewart-muted"
                }`}
              >
                {showPitch ? "Pitch notes on" : "Pitch notes off"}
              </button>
            )}
            <div className="bg-white rounded-lg px-3 py-1.5">
              <img src="/sisel-logo.png" alt="Sisel" className="h-8 w-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div className="flex gap-1 border-b border-stewart-border">
          {TAB_CONFIG.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-stewart-accent text-stewart-accent"
                  : "border-transparent text-stewart-muted hover:text-stewart-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab onNavigate={setTab} />}
        {tab === "dashboard" && <DashboardTab showPitch={showPitch} />}
        {tab === "email-studio" && <EmailStudioTab showPitch={showPitch} />}
        {tab === "get-started" && <GetStartedTab />}
      </div>
    </div>
  );
}
