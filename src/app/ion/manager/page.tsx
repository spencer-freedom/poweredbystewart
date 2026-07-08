import { ManagerBrief } from "./ManagerBrief.client";

export const dynamic = "force-dynamic";

// /ion/manager — the manager's Daily Morning View. Lives outside the
// (public) route group so it renders bare (no pitch chrome): it's
// embedded as an iframe inside the pitch scroll (SectionMorningView) and
// also stands alone on a phone for a live device demo. AppShell bypasses
// its sidebar for any /ion* path, so this is full-bleed under <body>.

export default function IonManagerPage() {
  return (
    <div className="min-h-screen bg-stewart-bg">
      <ManagerBrief />
    </div>
  );
}
