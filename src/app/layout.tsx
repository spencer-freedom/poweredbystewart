import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { AppShell } from "@/components/app-shell";
import { TenantProvider } from "@/components/tenant-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Powered by Stewart",
  description: "Marketing intelligence dashboard",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en">
        <body className="antialiased">
          <TenantProvider>
            <AppShell>{children}</AppShell>
          </TenantProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
