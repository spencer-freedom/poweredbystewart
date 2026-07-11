"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { getNavItems } from "@/lib/roles";
import type { NavContext } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

const CONTEXT_LABEL: Record<NavContext, string> = { kia: "Kia", pvg: "PVG" };
const CONTEXT_BRAND: Record<NavContext, { name: string; sub: string }> = {
  kia: { name: "Powered by Stewart", sub: "Marketing Intelligence" },
  pvg: { name: "Provo's Vintage Groove", sub: "Demand Intelligence" },
};

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const role = (user?.publicMetadata?.role as UserRole) || "admin";
  const navItems = useMemo(() => getNavItems(role), [role]);

  // Which top-level contexts the user can see (kept in kia→pvg order).
  const contexts = useMemo(() => {
    const present = new Set(navItems.map((i) => i.context));
    return (["kia", "pvg"] as NavContext[]).filter((c) => present.has(c));
  }, [navItems]);

  const [context, setContext] = useState<NavContext>(
    () => navItems.find((i) => pathname.startsWith(i.href))?.context ?? "kia"
  );

  // On navigation, follow the route's context (but a manual toggle click, which
  // doesn't change the path, stays put).
  useEffect(() => {
    const routeCtx = navItems.find((i) => pathname.startsWith(i.href))?.context;
    if (routeCtx) setContext(routeCtx);
  }, [pathname, navItems]);

  const items = navItems.filter((i) => i.context === context);
  const brand = CONTEXT_BRAND[context];

  return (
    <aside className="w-56 bg-stewart-card border-r border-stewart-border flex flex-col">
      {/* Brand */}
      <div className="p-4 border-b border-stewart-border">
        <h1 className="text-lg font-bold text-stewart-accent">{brand.name}</h1>
        <p className="text-xs text-stewart-muted">{brand.sub}</p>
      </div>

      {/* Kia / PVG context toggle (only when the user has more than one) */}
      {contexts.length > 1 && (
        <div className="p-2 border-b border-stewart-border">
          <div className="flex gap-1 bg-stewart-bg rounded-md p-1">
            {contexts.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setContext(c)}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  context === c
                    ? "bg-stewart-accent/15 text-stewart-accent"
                    : "text-stewart-muted hover:text-stewart-text"
                )}
              >
                {CONTEXT_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-0.5">
          {items.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-stewart-accent/10 text-stewart-accent"
                    : "text-stewart-muted hover:text-stewart-text hover:bg-stewart-border/50"
                )}
              >
                <span className="w-6 h-6 rounded bg-stewart-border flex items-center justify-center text-[10px] font-mono flex-shrink-0">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-stewart-border space-y-2">
        <div className="flex items-center gap-2">
          {user && (
            <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
          )}
          <div className="min-w-0">
            <p className="text-xs text-stewart-text truncate">
              {user?.fullName || user?.primaryEmailAddress?.emailAddress || "Guest"}
            </p>
            <p className="text-[10px] text-stewart-muted capitalize">{role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
