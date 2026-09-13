import { ManagerBrief } from "./ManagerBrief.client";

export const dynamic = "force-dynamic";

// /ion/manager/brief — the four-call Daily Morning View exactly as the
// pitch shows it (embedded in the phone frame on /ion/present, and
// standalone on a real phone). The interactive manager surface — every
// call, ranked, with the weights exposed — lives one level up at
// /ion/manager.

export default function IonManagerBriefPage() {
  return (
    <div className="min-h-screen bg-stewart-bg">
      <ManagerBrief />
    </div>
  );
}
