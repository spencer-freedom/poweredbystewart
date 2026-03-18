"use client";

import { useTenant } from "@/components/tenant-provider";
import { PageInfo } from "@/components/page-info";

export default function ServiceDashboardPage() {
  const { tenantId } = useTenant();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-stewart-text">Service Department</h2>
        <p className="text-sm text-stewart-muted">Service lead tracking, appointment volume, and BDC service metrics</p>
      </div>

      <PageInfo pageId="service" title="Service department lead tracking and BDC metrics">
        <p>This page will track service leads separately from sales leads, including appointment volume, source attribution, and BDC service performance.</p>
      </PageInfo>

      <div className="bg-stewart-card border border-stewart-border rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium text-stewart-text mb-2">Coming Soon</h3>
        <p className="text-sm text-stewart-muted max-w-md mx-auto">
          Service leads are being tracked separately from sales leads.
          This dashboard will show service appointment volume, source attribution,
          and BDC service performance once the internet department strategy is in place.
        </p>
        {tenantId && (
          <p className="text-xs text-stewart-muted mt-4">
            Tenant: <span className="text-stewart-accent">{tenantId}</span>
          </p>
        )}
      </div>
    </div>
  );
}
