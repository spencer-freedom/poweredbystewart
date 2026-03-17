// Auth temporarily disabled for demo — all routes public
// Re-enable Clerk middleware when ready for production auth

import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
