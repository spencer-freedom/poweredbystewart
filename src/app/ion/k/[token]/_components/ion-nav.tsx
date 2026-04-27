"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { slug: "", label: "Methodology" },
  { slug: "tree", label: "Decision Tree" },
  { slug: "next-steps", label: "Next Steps" },
  { slug: "preview", label: "What's Coming" },
];

export function IonNav({ base }: { base: string }) {
  const pathname = usePathname();
  return (
    <nav className="max-w-6xl mx-auto px-6 flex gap-1 -mb-px">
      {TABS.map((tab) => {
        const href = tab.slug ? `${base}/${tab.slug}` : base;
        const isActive =
          tab.slug === ""
            ? pathname === base
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={tab.slug || "root"}
            href={href}
            className={cn(
              "px-4 py-3 text-sm border-b-2 transition-colors",
              isActive
                ? "border-stewart-accent text-stewart-accent"
                : "border-transparent text-stewart-muted hover:text-stewart-text"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
