import type { UserRole } from "./types";

// Pages accessible by role
const ROLE_ACCESS: Record<UserRole, string[]> = {
  admin: ["/dashboard", "/leads", "/kpi", "/vendors", "/sources", "/vinsync", "/compass", "/gauge", "/sentry", "/service", "/lead-dedup"],
  rep: ["/dashboard", "/leads", "/compass", "/gauge", "/lead-dedup"],
};

export function canAccess(role: UserRole, path: string): boolean {
  return ROLE_ACCESS[role]?.includes(path) ?? false;
}

export function getNavItems(role: UserRole) {
  const allItems = [
    { href: "/dashboard", label: "Overview", icon: "O" },
    { href: "/leads", label: "Leads", icon: "L" },
    { href: "/kpi", label: "KPI", icon: "K" },
    { href: "/vendors", label: "Vendors", icon: "V", adminOnly: true },
    { href: "/sources", label: "Sources", icon: "S", adminOnly: true },
    { href: "/vinsync", label: "VinSync", icon: "VS", adminOnly: true },
    { href: "/compass", label: "Compass", icon: "C" },
    { href: "/gauge", label: "Gauge", icon: "G" },
    { href: "/sentry", label: "Sentry", icon: "SE", adminOnly: true },
    { href: "/service", label: "Service", icon: "SV", adminOnly: true },
    { href: "/lead-dedup", label: "Lead Dedup", icon: "DD" },
  ];

  return allItems.filter((item) => canAccess(role, item.href));
}
