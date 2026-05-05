// Role helpers. Frontend never decodes tokens — viewer info is the resolved
// payload from /api/ion/* response wrappers. See decision: 2026-05-04 token
// contract. Helpers below let pages and components gate on viewer.role.

import type { Role, Viewer } from "./ion-api";

export type { Role, Viewer };

export function hasRole(
  viewer: Viewer | undefined | null,
  allowed: ReadonlyArray<Role>
): boolean {
  if (!viewer) return false;
  return allowed.includes(viewer.role);
}

// Page-level guard: returns true if viewer can access the surface,
// false otherwise. Caller renders <ErrorPanel> on false.
export function canAccess(
  viewer: Viewer | undefined | null,
  allowed: ReadonlyArray<Role>
): boolean {
  return hasRole(viewer, allowed);
}

// Manager + leader + system_owner all see other reps' content. Reps see
// only their own. Convenience predicate used by the manager landing,
// coaching prep, and any cross-rep surface.
export function canViewOtherReps(viewer: Viewer | undefined | null): boolean {
  return hasRole(viewer, ["manager", "leader", "system_owner"]);
}

// Sanity check for rep-scoped surfaces: rep can see their OWN brief; a
// manager / leader / system_owner can see any rep on their tenant.
export function canViewRep(
  viewer: Viewer | undefined | null,
  rep_id: string
): boolean {
  if (!viewer) return false;
  if (viewer.role === "rep") return viewer.rep_id === rep_id;
  if (viewer.role === "manager") {
    return (viewer.team_rep_ids ?? []).includes(rep_id);
  }
  return hasRole(viewer, ["leader", "system_owner"]);
}
