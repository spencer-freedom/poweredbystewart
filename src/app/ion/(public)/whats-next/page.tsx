import { Hub } from "../_components/Hub";

export const dynamic = "force-dynamic";

// /ion/whats-next renders the same hub as /ion — Spencer named this
// URL as the share-anywhere landing. The prior Scope of Work content
// is preserved at /ion/sow (still rendering, not linked from public
// surfaces — Spencer polishes there).

export default function WhatsNextHubPage() {
  return <Hub />;
}
