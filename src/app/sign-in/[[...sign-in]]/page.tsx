"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stewart-bg">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-stewart-card border border-stewart-border shadow-xl",
          },
        }}
      />
    </div>
  );
}
