"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getNavItems } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

// Conditionally import Clerk — avoid crash when Clerk isn't configured
let useUser: (() => { user: { fullName?: string | null; primaryEmailAddress?: { emailAddress: string } | null; publicMetadata?: Record<string, unknown> } | null | undefined }) | null = null;
let UserButton: React.ComponentType<{ appearance?: Record<string, unknown> }> | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const clerk = require("@clerk/nextjs");
  useUser = clerk.useUser;
  UserButton = clerk.UserButton;
} catch {
  // Clerk not available
}

export function Sidebar() {
  const pathname = usePathname();

  // Safe Clerk access — returns null when Clerk isn't configured
  let user: { fullName?: string | null; primaryEmailAddress?: { emailAddress: string } | null; publicMetadata?: Record<string, unknown> } | null = null;
  try {
    if (useUser) {
      const result = useUser();
      user = result.user ?? null;
    }
  } catch {
    // Clerk not in context — use defaults
  }

  const role = (user?.publicMetadata?.role as UserRole) || "admin";
  const navItems = getNavItems(role);

  return (
    <aside className="w-56 bg-stewart-card border-r border-stewart-border flex flex-col">
      {/* Brand */}
      <div className="p-4 border-b border-stewart-border">
        <h1 className="text-lg font-bold text-stewart-accent">Powered by Stewart</h1>
        <p className="text-xs text-stewart-muted">Marketing Intelligence</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
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
          {UserButton && user && (
            <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
          )}
          <div className="min-w-0">
            <p className="text-xs text-stewart-text truncate">
              {user?.fullName || user?.primaryEmailAddress?.emailAddress || "Local Dev"}
            </p>
            <p className="text-[10px] text-stewart-muted capitalize">{role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
