import { Suspense } from "react";
import { Listen } from "./Listen.client";

export const dynamic = "force-dynamic";

// /ion/listen — a shareable clip player. Point it at any call and any
// moments and it plays them, nothing else on the page.
//
//   /ion/listen?call=20000555055&m=64-80:Title%20question&m=130-150:Credit%20question
//
// call = the call id (audio key), m = start-end[:label] seconds, repeatable.
// Lives outside the (public) route group so it renders bare (no pitch chrome).

export default function IonListenPage() {
  return (
    <Suspense fallback={null}>
      <Listen />
    </Suspense>
  );
}
