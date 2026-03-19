"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stewart-bg">
        <p className="text-stewart-muted text-sm">Loading...</p>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stewart-bg">
        <p className="text-stewart-muted text-sm">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stewart-bg">
      <SignIn
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[#1a1d27] border border-[#2a2d3a] shadow-xl",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-400",
            socialButtonsBlockButton: "border-[#2a2d3a] text-gray-300 hover:bg-[#2a2d3a]",
            dividerLine: "bg-[#2a2d3a]",
            dividerText: "text-gray-500",
            formFieldLabel: "text-gray-300",
            formFieldInput: "bg-[#0f1117] border-[#2a2d3a] text-white placeholder:text-gray-500",
            formButtonPrimary: "bg-[#3b82f6] hover:bg-[#2563eb] text-white",
            footerActionLink: "text-[#3b82f6] hover:text-[#60a5fa]",
            footerActionText: "text-gray-400",
            footer: "bg-[#1a1d27] border-t border-[#2a2d3a]",
            footerPagesLink: "text-gray-400",
          },
        }}
      />
    </div>
  );
}
