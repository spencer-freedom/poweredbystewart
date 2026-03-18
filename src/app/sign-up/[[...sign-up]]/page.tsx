"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stewart-bg">
      <SignUp
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
