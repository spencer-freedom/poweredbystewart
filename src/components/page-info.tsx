"use client";

import { useState, useEffect, ReactNode } from "react";

interface PageInfoProps {
  pageId: string;
  title: string;
  children: ReactNode;
}

export function PageInfo({ pageId, title, children }: PageInfoProps) {
  const storageKey = `pageInfo_${pageId}_collapsed`;
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    setCollapsed(stored === "true");
    setMounted(true);
  }, [storageKey]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(storageKey, String(next));
  };

  if (!mounted) return null;

  return (
    <div className="bg-stewart-card/50 border border-stewart-border/60 rounded-lg">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-stewart-border/20 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-stewart-accent/20 text-stewart-accent flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            i
          </span>
          <span className="text-xs font-medium text-stewart-muted">{title}</span>
        </div>
        <span className="text-stewart-muted text-xs select-none">{collapsed ? "+" : "\u2212"}</span>
      </button>
      {!collapsed && (
        <div className="px-4 pb-3 text-xs text-stewart-muted leading-relaxed border-t border-stewart-border/30 pt-2">
          {children}
        </div>
      )}
    </div>
  );
}
