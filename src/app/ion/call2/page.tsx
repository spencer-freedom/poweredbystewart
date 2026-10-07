import { renderCall } from "../call/render";
import { SHOWCASE_ORDER } from "../call/showcase";

export const dynamic = "force-dynamic";

// /ion/call2 — Call 2 of the three-call demo at its own path.
export default async function IonCall2Page() {
  return renderCall(SHOWCASE_ORDER[1]);
}
