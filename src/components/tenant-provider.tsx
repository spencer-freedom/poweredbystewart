"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Conditionally import Clerk — avoid crash when Clerk isn't configured
let useUser: (() => { user: { publicMetadata?: Record<string, unknown> } | null | undefined }) | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const clerk = require("@clerk/nextjs");
  useUser = clerk.useUser;
} catch {
  // Clerk not available
}

interface TenantContextValue {
  tenantId: string;
  setTenantId: (id: string) => void;
}

const TenantContext = createContext<TenantContextValue>({
  tenantId: "",
  setTenantId: () => {},
});

export function useTenant() {
  return useContext(TenantContext);
}

export function TenantProvider({ children }: { children: ReactNode }) {
  // Safe Clerk access — returns null when Clerk isn't configured
  let user: { publicMetadata?: Record<string, unknown> } | null = null;
  try {
    if (useUser) {
      const result = useUser();
      user = result.user ?? null;
    }
  } catch {
    // Clerk not in context — use defaults
  }

  const defaultTenant =
    (user?.publicMetadata?.tenantId as string) ||
    process.env.NEXT_PUBLIC_DEFAULT_TENANT ||
    "";

  const [tenantId, setTenantId] = useState(defaultTenant);

  useEffect(() => {
    if (defaultTenant && !tenantId) {
      setTenantId(defaultTenant);
    }
  }, [defaultTenant, tenantId]);

  return (
    <TenantContext.Provider value={{ tenantId, setTenantId }}>
      {children}
    </TenantContext.Provider>
  );
}
