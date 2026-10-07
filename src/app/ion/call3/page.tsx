import { renderCall } from "../call/render";
import { SHOWCASE_ORDER } from "../call/showcase";

export const dynamic = "force-dynamic";
// Shown by link, never by search: the demo is for the people it is sent to.
export const metadata = { robots: { index: false, follow: false } };

// /ion/call3 — Call 3 of the three-call demo at its own path.
export default async function IonCall3Page() {
  return renderCall(SHOWCASE_ORDER[2]);
}
