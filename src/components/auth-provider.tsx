"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    // Token accessor available for future API calls if needed
    void getToken;
  }, [getToken]);

  return <>{children}</>;
}
