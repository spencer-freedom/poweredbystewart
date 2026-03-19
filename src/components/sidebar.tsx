"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { getNavItems } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
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
