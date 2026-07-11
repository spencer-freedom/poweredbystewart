import type { UserRole } from "./types";

// Pages accessible by role
const ROLE_ACCESS: Record<UserRole, string[]> = {
  admin: ["/dashboard", "/leads", "/kpi", "/vendors", "/sources", "/vinsync", "/compass", "/gauge", "/sentry", "/service", "/lead-dedup", "/marketing"],
  rep: ["/dashboard", "/leads", "/compass", "/gauge", "/lead-dedup"],
};

export function canAccess(role: UserRole, path: string): boolean {
  return ROLE_ACCESS[role]?.includes(path) ?? false;
}

// Nav context = top-level tab. "kia" = dealership pages, "pvg" = Provo's
// Vintage Groove (record store) pages mirrored from UsefulWax.
export type NavContext = "kia" | "pvg";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  context: NavContext;
  adminOnly?: boolean;
};

export function getNavItems(role: UserRole): NavItem[] {
  const allItems: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: "O", context: "kia" },
    { href: "/leads", label: "Leads", icon: "L", context: "kia" },
    { href: "/kpi", label: "KPI", icon: "K", context: "kia" },
    { href: "/vendors", label: "Vendors", icon: "V", context: "kia", adminOnly: true },
    { href: "/sources", label: "Sources", icon: "S", context: "kia", adminOnly: true },
    { href: "/vinsync", label: "VinSync", icon: "VS", context: "kia", adminOnly: true },
    { href: "/compass", label: "Compass", icon: "C", context: "kia" },
    { href: "/gauge", label: "Gauge", icon: "G", context: "kia" },
    { href: "/sentry", label: "Sentry", icon: "SE", context: "kia", adminOnly: true },
    { href: "/service", label: "Service", icon: "SV", context: "kia", adminOnly: true },
    { href: "/lead-dedup", label: "Lead Dedup", icon: "DD", context: "kia" },
    // ── Provo's Vintage Groove (record store) ──
    { href: "/marketing", label: "Demand Signals", icon: "DS", context: "pvg", adminOnly: true },
  ];

  return allItems.filter((item) => canAccess(role, item.href));
}
