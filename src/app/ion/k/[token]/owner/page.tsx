import { ComingSoon } from "../_components/coming-soon";

export const dynamic = "force-dynamic";

export default function SystemOwnerPage() {
  return (
    <ComingSoon
      surface="System Owner · Cross-Tenant"
      blockedOn="token role=system_owner gating + cross-tenant aggregate API"
    />
  );
}
