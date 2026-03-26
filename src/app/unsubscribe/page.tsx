"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function UnsubscribePage() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const email = params.get("email") || "";
  const [status, setStatus] = useState<"loading" | "success" | "error" | "invalid">("loading");

  useEffect(() => {
    if (!token || !email) {
      setStatus("invalid");
      return;
    }

    fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`, {
      method: "POST",
    })
      .then((res) => {
        setStatus(res.ok ? "success" : "error");
      })
      .catch(() => setStatus("error"));
  }, [token, email]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-sm border p-8 max-w-md w-full text-center">
        {status === "loading" && <p className="text-gray-500">Processing...</p>}
        {status === "success" && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Unsubscribed</h1>
            <p className="text-gray-600 text-sm">
              <strong>{email}</strong> has been removed from our mailing list. You will no longer receive marketing emails.
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 text-sm">We couldn&apos;t process your unsubscribe request. Please try again or contact support.</p>
          </>
        )}
        {status === "invalid" && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
            <p className="text-gray-600 text-sm">This unsubscribe link appears to be invalid or expired.</p>
          </>
        )}
      </div>
    </div>
  );
}
