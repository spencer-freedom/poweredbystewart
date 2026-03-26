const STATUS_COLORS: Record<string, string> = {
  draft: "bg-blue-500/20 text-blue-400",
  active: "bg-green-500/20 text-green-400",
  scheduled: "bg-purple-500/20 text-purple-400",
  sending: "bg-yellow-500/20 text-yellow-400",
  sent: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
  bounced: "bg-red-500/20 text-red-400",
  delivered: "bg-green-500/20 text-green-400",
  opened: "bg-cyan-500/20 text-cyan-400",
  clicked: "bg-stewart-accent/20 text-stewart-accent",
  custom: "bg-stewart-border text-stewart-muted",
  transactional: "bg-purple-500/20 text-purple-400",
  promotional: "bg-orange-500/20 text-orange-400",
  campaign: "bg-stewart-accent/20 text-stewart-accent",
  newsletter: "bg-blue-500/20 text-blue-400",
  announcement: "bg-cyan-500/20 text-cyan-400",
  onboarding: "bg-green-500/20 text-green-400",
  promotion: "bg-orange-500/20 text-orange-400",
  internal: "bg-stewart-border text-stewart-muted",
};

const SOURCE_COLORS: Record<string, string> = {
  link: "bg-blue-500/20 text-blue-400",
  manual: "bg-stewart-border text-stewart-muted",
  ses_bounce: "bg-red-500/20 text-red-400",
  ses_complaint: "bg-orange-500/20 text-orange-400",
};

const FALLBACK = "bg-stewart-border text-stewart-muted";

export function statusBadge(s: string) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[s] || FALLBACK}`}>
      {s.replace(/_/g, " ")}
    </span>
  );
}

export function sourceBadge(s: string) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${SOURCE_COLORS[s] || FALLBACK}`}>
      {s.replace(/_/g, " ")}
    </span>
  );
}
