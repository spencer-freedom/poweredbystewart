import { renderCall } from "./render";
import { SHOWCASE_ORDER } from "./showcase";

export const dynamic = "force-dynamic";

// /ion/call — Call 1 of the three-call demo (outputs only; public). Each call
// also has its own path, /ion/call2 and /ion/call3; ?id= still works here.
export default async function IonCallPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return renderCall((id || SHOWCASE_ORDER[0]).trim());
}
