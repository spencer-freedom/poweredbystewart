import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { TenantProvider } from "@/components/tenant-provider";
import "./globals.css";

// Conditionally import Clerk — avoid crash when Clerk isn't configured
let ClerkProvider: React.ComponentType<{ appearance?: Record<string, unknown>; children: React.ReactNode }> | null = null;
let dark: Record<string, unknown> | undefined;
let AuthProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const clerk = require("@clerk/nextjs");
  ClerkProvider = clerk.ClerkProvider;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const themes = require("@clerk/themes");
  dark = themes.dark;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AuthProvider = require("@/components/auth-provider").AuthProvider;
} catch {
  // Clerk not available
}

export const metadata: Metadata = {
  title: "Powered by Stewart",
  description: "Marketing intelligence dashboard",
};

export const dynamic = "force-dynamic";

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = (
    <AppShell>{children}</AppShell>
  );

  if (!clerkKey || !ClerkProvider) {
    return (
      <html lang="en">
        <body className="antialiased">
          <TenantProvider>{content}</TenantProvider>
        </body>
      </html>
    );
  }

  const wrappedContent = AuthProvider ? (
    <AuthProvider>
      <TenantProvider>{content}</TenantProvider>
    </AuthProvider>
  ) : (
    <TenantProvider>{content}</TenantProvider>
  );

  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en">
        <body className="antialiased">
          {wrappedContent}
        </body>
      </html>
    </ClerkProvider>
  );
}
