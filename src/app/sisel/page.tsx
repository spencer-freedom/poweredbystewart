"use client";

import { useState } from "react";
import Link from "next/link";

type Tab = "proposal" | "dashboard" | "email-studio";

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

function statusBadge(s: string) {
  const colors: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    draft: "bg-blue-500/20 text-blue-400",
    scheduled: "bg-purple-500/20 text-purple-400",
    sent: "bg-green-500/20 text-green-400",
    paused: "bg-yellow-500/20 text-yellow-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[s] || "bg-stewart-border text-stewart-muted"}`}>
      {s}
    </span>
  );
}

// ─── Proposal Tab ───────────────────────────────────────────────

function ProposalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-stewart-text border-b border-stewart-border pb-2">{title}</h2>
      {children}
    </div>
  );
}

function ProposalTab() {
  return (
    <div className="space-y-8 max-w-3xl">
      <ProposalSection title="The Opportunity">
        <p className="text-stewart-text text-sm leading-relaxed">
          Right now, your customer data lives inside Exigo, but it{"'"}s not being fully used to drive
          follow-up, retention, or repeat purchases.
        </p>
        <ul className="space-y-2 text-sm text-stewart-muted">
          <li className="flex items-start gap-2"><span className="text-stewart-accent mt-0.5">-</span>You{"'"}re paying ~$450/month for Mailchimp with limited automation tied to your actual customer data</li>
          <li className="flex items-start gap-2"><span className="text-stewart-accent mt-0.5">-</span>A portion of that cost goes toward inactive or unusable email addresses</li>
          <li className="flex items-start gap-2"><span className="text-stewart-accent mt-0.5">-</span>There{"'"}s no direct connection between purchase behavior and marketing</li>
          <li className="flex items-start gap-2"><span className="text-stewart-accent mt-0.5">-</span>Campaigns require manual work or exports</li>
          <li className="flex items-start gap-2"><span className="text-stewart-accent mt-0.5">-</span>Automated follow-up based on customer behavior doesn{"'"}t exist yet</li>
          <li className="flex items-start gap-2"><span className="text-stewart-accent mt-0.5">-</span>Exigo quoted <strong className="text-stewart-text">66 hours of development time</strong> just to connect to Mailchimp</li>
        </ul>
        <p className="text-stewart-text text-sm leading-relaxed">
          Exigo handles transactions well. But the marketing layer that drives retention
          and repeat revenue isn{"'"}t fully built out.
        </p>
      </ProposalSection>

      <ProposalSection title="Where This Fits">
        <p className="text-stewart-text text-sm leading-relaxed">
          I understand that a large portion of your distributor base doesn{"'"}t rely on email.
          This system isn{"'"}t designed to change how they operate.
        </p>
        <p className="text-sm text-stewart-muted">It{"'"}s designed for:</p>
        <ul className="space-y-1 text-sm text-stewart-muted ml-4">
          <li>- Customers</li>
          <li>- Distributors who operate digitally</li>
          <li>- International markets</li>
          <li>- The part of your business that already uses email, but isn{"'"}t being fully leveraged</li>
        </ul>
        <p className="text-stewart-text text-sm leading-relaxed">
          The goal is to capture more value from the segment that{"'"}s already there.
        </p>
      </ProposalSection>

      <ProposalSection title="Already Built, Not a Custom Project">
        <p className="text-stewart-text text-sm leading-relaxed">
          This system wasn{"'"}t built as a concept or a proposal for Sisel. I built it for my own business
          to solve the same problems: paying for dead contacts, no connection between purchase data and marketing,
          too much manual campaign work, no automated follow-up.
        </p>
        <p className="text-stewart-text text-sm leading-relaxed">
          It{"'"}s already running and being used. I can walk through a live demo if helpful,
          so you can see exactly how it works in practice.
        </p>
        <p className="text-stewart-text text-sm leading-relaxed">
          This isn{"'"}t a development project. It{"'"}s a deployment: setting you up on infrastructure
          that already exists, adapted to your data.
        </p>
        <div className="bg-stewart-accent/10 border border-stewart-accent/30 rounded-lg p-4">
          <p className="text-stewart-accent text-sm font-medium">
            It runs on Amazon Web Services (the same email infrastructure behind companies sending
            billions of emails per month), with full CAN-SPAM compliance, automated list hygiene,
            and a dashboard for campaign management.
          </p>
        </div>
      </ProposalSection>

      <ProposalSection title="What the System Does">
        <div className="space-y-4">
          {[
            { label: "Direct Exigo Sync", desc: "Your customer database and order history sync automatically. New contacts, new orders, rank changes, all pulled via Exigo's API. No manual exports, no CSV uploads, no 66-hour integration project." },
            { label: "Smart Contact Buckets", desc: "Every contact is automatically sorted: Active, Bounced, Unsubscribed, Complained, or Inactive. You see exactly how many people are in each bucket on your dashboard. Nothing is deleted. You choose when and who to reach out to." },
            { label: "Purchase-Based Targeting", desc: "Create segments based on real behavior. \"Bought Product X in the last 90 days.\" \"Spent over $500 lifetime.\" \"Hasn't ordered in 60 days.\" Segments save, reuse, and update automatically." },
            { label: "Automated Email Flows", desc: "Welcome series, reorder reminders, win-back sequences, cross-sell emails, rank advancement congratulations, VIP recognition, re-engagement campaigns. Set up once, run automatically." },
            { label: "Newsletters & Seasonal Catalogs", desc: "Send regular newsletters, product spotlights, seasonal promotions, and catalog launches to your full list or targeted segments. Design once, reuse templates, schedule sends." },
            { label: "Full Campaign Management", desc: "Pick a template, choose your audience, preview, and send. Track opens, clicks, and engagement. Covers the core campaign functionality you're currently using in Mailchimp." },
            { label: "Unlimited Sending", desc: "No per-email or per-contact charges." },
          ].map((item) => (
            <div key={item.label} className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-stewart-text mb-1">{item.label}</h3>
              <p className="text-xs text-stewart-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </ProposalSection>

      <ProposalSection title="What's Different">
        <p className="text-stewart-text text-sm leading-relaxed">
          Most email tools treat your contact list as a static spreadsheet. This system treats it
          as a live data stream. Every new order, every lapsed customer, every milestone can trigger
          the right email automatically.
        </p>
        <p className="text-stewart-text text-sm leading-relaxed font-medium">
          Your Exigo data stops being something you store and starts being something you use.
        </p>
        <p className="text-stewart-muted text-sm leading-relaxed italic">
          This isn{"'"}t a cheaper version of Mailchimp. It{"'"}s the missing layer between your
          customer data and your revenue.
        </p>
      </ProposalSection>

      <ProposalSection title="Cost Comparison">
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
      </ProposalSection>

      <ProposalSection title="Investment">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-stewart-accent/10 border border-stewart-accent/30 rounded-lg p-5 text-center">
            <p className="text-stewart-accent text-2xl font-bold">$1,000</p>
            <p className="text-stewart-accent text-sm font-medium mt-1">One-time setup</p>
            <p className="text-stewart-muted text-xs mt-2 leading-relaxed">
              Exigo integration, list cleanup, template migration, domain setup, first automation flows
            </p>
          </div>
          <div className="bg-stewart-accent/10 border border-stewart-accent/30 rounded-lg p-5 text-center">
            <p className="text-stewart-accent text-2xl font-bold">$500/mo</p>
            <p className="text-stewart-accent text-sm font-medium mt-1">Monthly</p>
            <p className="text-stewart-muted text-xs mt-2 leading-relaxed">
              Unlimited sending, ongoing sync, automation, list hygiene, campaign management, direct support
            </p>
          </div>
        </div>
      </ProposalSection>

      <ProposalSection title="What I Need to Get Started">
        <div className="space-y-3">
          {[
            { n: 1, title: "Exigo API access", desc: "Your IT team or Exigo account manager provides API credentials so I can sync your contact list and order history automatically." },
            { n: 2, title: "Existing Mailchimp templates", desc: "So I can migrate your current email designs to the new platform." },
            { n: 3, title: "Sending domain", desc: "A subdomain you'd like emails sent from (e.g., mail.sisel.com). I handle all the technical DNS setup." },
            { n: 4, title: "Your top automation priorities", desc: "Which auto-triggered flows matter most? I'll set up your top 2-3 as part of setup." },
          ].map((item) => (
            <div key={item.n} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stewart-accent/20 text-stewart-accent text-xs font-bold flex items-center justify-center">{item.n}</span>
              <div>
                <p className="text-sm font-medium text-stewart-text">{item.title}</p>
                <p className="text-xs text-stewart-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </ProposalSection>

      <ProposalSection title="Timeline">
        <div className="space-y-2">
          {[
            { week: "Week 1", desc: "Setup -- Exigo integration, list import, bulk verification, template migration" },
            { week: "Weeks 2-3", desc: "Warmup -- send to most engaged contacts first, gradually increase volume" },
            { week: "Weeks 3-4", desc: "Automation -- build and activate your first auto-triggered flows" },
            { week: "Week 4", desc: "Full launch -- campaigns and automations running through the new platform" },
            { week: "Ongoing", desc: "Automatic sync, list hygiene, automation monitoring, campaign support" },
          ].map((item) => (
            <div key={item.week} className="flex gap-4 text-sm">
              <span className="flex-shrink-0 w-20 font-semibold text-stewart-text">{item.week}</span>
              <span className="text-stewart-muted">{item.desc}</span>
            </div>
          ))}
        </div>
      </ProposalSection>

      <div className="bg-stewart-card border border-stewart-border rounded-lg p-6">
        <p className="text-stewart-text text-sm font-semibold leading-relaxed">
          Bottom line: You{"'"}re paying $450/month for Mailchimp with limited automation and no Exigo
          connection. You were quoted 66 hours just for the integration. This system gives you everything --
          email, automation, purchase targeting, list cleanup, and the Exigo integration -- for $500/month
          with a $1,000 setup. And it{"'"}s already built.
        </p>
        <p className="text-stewart-muted text-sm mt-3">
          Ready to get started? I{"'"}m happy to walk through it and show how it works.
        </p>
        <div className="mt-4 pt-4 border-t border-stewart-border">
          <p className="text-sm font-medium text-stewart-text">Spencer Colby</p>
          <p className="text-xs text-stewart-muted">stewart@poweredbystewart.com</p>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Tab ──────────────────────────────────────────────

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

function DashboardTab() {
  const totalContacts = CONTACT_BUCKETS.reduce((sum, b) => sum + b.count, 0);

  return (
    <div className="space-y-6">
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

      <div>
        <h2 className="text-sm font-semibold text-stewart-muted uppercase tracking-wide mb-3">Performance</h2>
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Emails Sent (30d)" value="42,680" sub="$4.27 SES cost" variant="success" />
          <StatCard label="Avg Open Rate" value="34%" sub="Industry avg: 21%" variant="success" />
          <StatCard label="Avg Click Rate" value="12%" sub="Industry avg: 3%" variant="success" />
          <StatCard label="Monthly Cost" value="$500" sub="vs $450 Mailchimp" />
        </div>
      </div>

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

// ─── Email Studio Tab ────────────────────────────────────────────

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

function ProductIcon({ type }: { type: string }) {
  const colors: Record<string, string> = { supplement: "bg-green-500/20 text-green-400", skincare: "bg-purple-500/20 text-purple-400", personal: "bg-blue-500/20 text-blue-400", water: "bg-cyan-500/20 text-cyan-400" };
  const icons: Record<string, string> = { supplement: "S", skincare: "R", personal: "P", water: "W" };
  return (
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold ${colors[type] || "bg-stewart-border text-stewart-muted"}`}>
      {icons[type] || "?"}
    </div>
  );
}

function EmailStudioTab() {
  const [step, setStep] = useState<"templates" | "compose" | "preview">("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([1, 2, 3]);
  const [selectedSegment, setSelectedSegment] = useState("Bought in last 90 days");

  const template = TEMPLATES.find(t => t.id === selectedTemplate);

  if (step === "templates") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
            <p className="text-xs text-stewart-muted">Templates</p>
            <p className="text-2xl font-bold text-stewart-text mt-1">{TEMPLATES.length}</p>
            <p className="text-xs text-stewart-muted mt-1">{TEMPLATES.filter(t => t.status === "active").length} active</p>
          </div>
          <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
            <p className="text-xs text-stewart-muted">Drafts</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">2</p>
            <p className="text-xs text-stewart-muted mt-1">Ready to finish</p>
          </div>
          <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
            <p className="text-xs text-stewart-muted">Sent This Month</p>
            <p className="text-2xl font-bold text-green-400 mt-1">36,130</p>
            <p className="text-xs text-stewart-muted mt-1">$3.61 SES cost</p>
          </div>
          <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
            <p className="text-xs text-stewart-muted">Send Rate</p>
            <p className="text-2xl font-bold text-stewart-text mt-1">14/sec</p>
            <p className="text-xs text-stewart-muted mt-1">AWS SES throughput</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stewart-muted uppercase tracking-wide">Email Templates</h2>
          <button
            onClick={() => { setSelectedTemplate(null); setStep("compose"); }}
            className="px-4 py-2 bg-stewart-accent text-white text-sm font-medium rounded-lg hover:bg-stewart-accent/80 transition-colors"
          >
            + New Campaign
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {TEMPLATES.map((t) => (
            <div
              key={t.id}
              className="bg-stewart-card border border-stewart-border rounded-lg p-5 hover:border-stewart-accent/50 transition-colors cursor-pointer group"
              onClick={() => { setSelectedTemplate(t.id); setStep("compose"); }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-stewart-accent/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-stewart-accent" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M2 8l10 6 10-6" />
                  </svg>
                </div>
                {statusBadge(t.status)}
              </div>
              <h3 className="text-sm font-semibold text-stewart-text mb-1">{t.name}</h3>
              <p className="text-xs text-stewart-muted mb-3">{t.subject}</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stewart-border text-stewart-muted">{t.type}</span>
                {t.variables.includes("products") && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-400">product grid</span>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-stewart-border">
                <span className="text-xs text-stewart-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  Use template &rarr;
                </span>
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

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-stewart-text">Campaign Details</h3>
              <div>
                <label className="text-xs text-stewart-muted block mb-1">Campaign Name</label>
                <div className="bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm text-stewart-text">
                  {template ? `${template.name} - March 2026` : "New Campaign"}
                </div>
              </div>
              <div>
                <label className="text-xs text-stewart-muted block mb-1">Subject Line</label>
                <div className="bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm text-stewart-text">
                  {template ? template.subject : "Enter subject line..."}
                </div>
                <p className="text-[10px] text-stewart-muted mt-1">Variables: {"{"} name {"}"} {"{"} products {"}"} auto-populate per recipient</p>
              </div>
              <div>
                <label className="text-xs text-stewart-muted block mb-1">Template</label>
                <div className="bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm text-stewart-text flex items-center justify-between">
                  <span>{template ? template.name : "Select a template..."}</span>
                  {template && statusBadge(template.type)}
                </div>
              </div>
            </div>

            <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-stewart-text">Product Grid</h3>
                <span className="text-xs text-stewart-muted">{selectedProducts.length} selected</span>
              </div>
              <p className="text-xs text-stewart-muted">Selected products render as email-safe HTML cards with image, price, and shop button. Synced from your product catalog.</p>
              <div className="grid grid-cols-3 gap-3">
                {SAMPLE_PRODUCTS.map((p) => {
                  const isSelected = selectedProducts.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`relative rounded-lg p-3 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-stewart-accent/10 border-2 border-stewart-accent"
                          : "bg-stewart-bg border border-stewart-border hover:border-stewart-accent/30"
                      }`}
                      onClick={() => setSelectedProducts(prev =>
                        prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                      )}
                    >
                      {p.tag && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-stewart-accent/20 text-stewart-accent">
                          {p.tag}
                        </span>
                      )}
                      <div className="flex items-center gap-3">
                        <ProductIcon type={p.image} />
                        <div>
                          <p className="text-sm font-medium text-stewart-text">{p.name}</p>
                          <p className="text-xs text-stewart-muted">{p.price}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-stewart-accent flex items-center justify-center">
                          <svg viewBox="0 0 16 16" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M3 8l3 3 7-7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-stewart-text">Email Body</h3>
              <div className="bg-white rounded-lg p-6 text-gray-800">
                <div className="text-center mb-6">
                  <div className="inline-block px-4 py-2 bg-green-50 rounded">
                    <span className="text-green-700 font-bold text-lg tracking-wider">SISEL</span>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {template?.subject.replace("{name}", "Karen") || "Your Email Subject"}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Hi Karen, we wanted to share some products we think you{"'"}ll love based on your recent purchases.
                  As a valued Sisel customer, you get early access to our newest arrivals.
                </p>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Featured Products</p>
                  <div className="space-y-3">
                    {SAMPLE_PRODUCTS.filter(p => selectedProducts.includes(p.id)).map((p) => (
                      <div key={p.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <ProductIcon type={p.image} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                          <p className="text-sm text-gray-500">{p.price}</p>
                        </div>
                        <div className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded">
                          Shop Now
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 mt-6 pt-4 text-center">
                  <p className="text-[10px] text-gray-400">
                    Sisel International | Pleasant Grove, UT<br />
                    <span className="underline">Unsubscribe</span> | <span className="underline">Manage Preferences</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-stewart-text">Audience</h3>
              <div>
                <label className="text-xs text-stewart-muted block mb-1">Segment</label>
                <select
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
                  className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-3 py-2.5 text-sm text-stewart-text appearance-none cursor-pointer"
                >
                  {SAMPLE_SEGMENTS.map(s => (
                    <option key={s.name} value={s.name}>{s.name} ({s.count.toLocaleString()})</option>
                  ))}
                  <option value="all">All Active Contacts (18,240)</option>
                </select>
              </div>
              <div className="bg-stewart-bg rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stewart-muted">Recipients</span>
                  <span className="font-bold text-stewart-text">
                    {selectedSegment === "all" ? "18,240" : SAMPLE_SEGMENTS.find(s => s.name === selectedSegment)?.count.toLocaleString() || "0"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-stewart-muted">Unsubscribed (filtered)</span>
                  <span className="text-red-400">-124</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-stewart-border">
                  <span className="text-stewart-muted">Will receive</span>
                  <span className="font-bold text-green-400">
                    {selectedSegment === "all" ? "18,116" : ((SAMPLE_SEGMENTS.find(s => s.name === selectedSegment)?.count || 0) - 124).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-stewart-text">Schedule</h3>
              <div>
                <label className="text-xs text-stewart-muted block mb-1">Send Date</label>
                <div className="bg-stewart-bg border border-stewart-border rounded-lg px-3 py-2.5 text-sm text-stewart-text">
                  March 24, 2026 at 9:00 AM MT
                </div>
              </div>
              <div className="bg-stewart-bg rounded-lg p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stewart-muted">Estimated SES cost</span>
                  <span className="text-stewart-text font-medium">
                    ${((selectedSegment === "all" ? 18116 : (SAMPLE_SEGMENTS.find(s => s.name === selectedSegment)?.count || 0) - 124) * 0.0001).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-stewart-muted">Est. send time</span>
                  <span className="text-stewart-text font-medium">
                    {Math.ceil((selectedSegment === "all" ? 18116 : (SAMPLE_SEGMENTS.find(s => s.name === selectedSegment)?.count || 0) - 124) / 14 / 60)} min
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setStep("preview")}
                className="w-full px-4 py-3 bg-stewart-accent text-white text-sm font-medium rounded-lg hover:bg-stewart-accent/80 transition-colors"
              >
                Preview & Send
              </button>
              <button className="w-full px-4 py-2.5 bg-stewart-card border border-stewart-border text-stewart-text text-sm font-medium rounded-lg hover:bg-stewart-border/50 transition-colors">
                Save as Draft
              </button>
              <button
                onClick={() => setStep("templates")}
                className="w-full px-4 py-2 text-stewart-muted text-sm hover:text-stewart-text transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="bg-stewart-accent/5 border border-stewart-accent/20 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-stewart-accent">How sending works</p>
              <ul className="space-y-1 text-[11px] text-stewart-muted">
                <li>- Emails sent via AWS SES at 14/sec</li>
                <li>- Unsubscribes auto-filtered</li>
                <li>- CAN-SPAM footer auto-injected</li>
                <li>- Bounce/complaint handling automatic</li>
                <li>- One-click unsubscribe header included</li>
              </ul>
            </div>
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
            <div className="bg-stewart-bg rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stewart-muted">From</span>
                <span className="text-stewart-text">Sisel International &lt;mail@sisel.com&gt;</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stewart-muted">Subject</span>
                <span className="text-stewart-text">{template?.subject.replace("{name}", "Karen") || "Your Email Subject"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stewart-muted">Recipients</span>
                <span className="text-stewart-text">
                  {selectedSegment === "all" ? "18,116" : ((SAMPLE_SEGMENTS.find(s => s.name === selectedSegment)?.count || 0) - 124).toLocaleString()} contacts
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stewart-muted">Products</span>
                <span className="text-stewart-text">{selectedProducts.length} product cards</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stewart-muted">Scheduled</span>
                <span className="text-stewart-text">March 24, 2026 at 9:00 AM MT</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stewart-muted">Estimated cost</span>
                <span className="text-green-400 font-medium">
                  ${((selectedSegment === "all" ? 18116 : (SAMPLE_SEGMENTS.find(s => s.name === selectedSegment)?.count || 0) - 124) * 0.0001).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setStep("templates")}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Confirm & Schedule
          </button>
          <button
            onClick={() => setStep("compose")}
            className="w-full px-4 py-2.5 bg-stewart-card border border-stewart-border text-stewart-text text-sm font-medium rounded-lg hover:bg-stewart-border/50 transition-colors"
          >
            Back to Editor
          </button>

          <div className="bg-stewart-card border border-stewart-border rounded-lg p-4 mt-4">
            <p className="text-xs font-semibold text-stewart-text mb-2">Dry Run</p>
            <p className="text-[11px] text-stewart-muted mb-3">
              Send a test to yourself without affecting recipients. Renders with real data from the first contact in your segment.
            </p>
            <div className="flex gap-2">
              <div className="flex-1 bg-stewart-bg border border-stewart-border rounded px-3 py-2 text-xs text-stewart-muted">
                karen@sisel.com
              </div>
              <button className="px-3 py-2 bg-stewart-border text-stewart-text text-xs font-medium rounded hover:bg-stewart-accent/20 transition-colors">
                Send Test
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function SiselPage() {
  const [tab, setTab] = useState<Tab>("proposal");

  return (
    <div className="min-h-screen bg-stewart-bg">
      {/* Header */}
      <div className="border-b border-stewart-border bg-stewart-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-stewart-muted hover:text-stewart-text text-sm transition-colors">
              &larr; Back
            </Link>
            <div className="w-px h-6 bg-stewart-border" />
            <div>
              <h1 className="text-xl font-bold text-stewart-text">Sisel International</h1>
              <p className="text-stewart-muted text-xs">Email Marketing & Automation Platform</p>
            </div>
          </div>
          <div className="bg-white rounded-lg px-3 py-1.5">
            <img src="/sisel-logo.png" alt="Sisel" className="h-8 w-auto" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-stewart-border">
          {([
            { key: "proposal" as Tab, label: "Proposal" },
            { key: "dashboard" as Tab, label: "Platform Preview" },
            { key: "email-studio" as Tab, label: "Email Studio" },
          ]).map((t) => (
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

        {tab === "proposal" && <ProposalTab />}
        {tab === "dashboard" && <DashboardTab />}
        {tab === "email-studio" && <EmailStudioTab />}
      </div>
    </div>
  );
}
