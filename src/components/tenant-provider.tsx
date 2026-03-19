"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";

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
  const { user } = useUser();

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
