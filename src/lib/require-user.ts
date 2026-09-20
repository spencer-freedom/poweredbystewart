import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/** A signed-in Clerk user, or the 401 to return.
 *
 *  The middleware lets Clerk set cookies but protects nothing server-side
 *  ("auth is handled client-side in the dashboard layout"), so every API
 *  route was reachable without a session — /api/dealeros?action=leads
 *  answered 200 rows of Kia customers to a bare curl on 2026-09-20. The
 *  browser calls these routes same-origin with the Clerk session cookie,
 *  so requiring a userId here costs the UI nothing and closes the door.
 *
 *  Usage, first line of a handler:
 *      const denied = await requireUser(); if (denied) return denied; */
export async function requireUser(): Promise<NextResponse | null> {
  const { userId } = await auth();
  if (userId) return null;
  return NextResponse.json({ error: "Sign in required" }, { status: 401 });
}
