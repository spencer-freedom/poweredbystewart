import { renderCall } from "../call/render";
import { SHOWCASE_ORDER } from "../call/showcase";

export const dynamic = "force-dynamic";

// /ion/call3 — Call 3 of the three-call demo at its own path.
export default async function IonCall3Page() {
  return renderCall(SHOWCASE_ORDER[2]);
}
