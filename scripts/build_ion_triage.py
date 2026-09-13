#!/usr/bin/env python3
"""Build public/ion/triage-index.json — the manager surface's ranking input.

"Stewart surfaces only the calls worth a manager's time" needs an actual
selector. This is it: one row per processed call with the features a
manager would triage on, plus a default score. The score is DETERMINISTIC
— no model — and every weight is exposed in the UI so Ion's managers can
tune it against their own judgment (that calibration is week-two work in
the building; the first weights are Spencer's guess and are labeled so).

Inputs (all already in public/ion/):
  calls-index.json, calls/{id}-manager-brief.json, -cherrypicks.json,
  -handoff.json, -metadata.json, -critic-audit.json, -quote-check.json

Idempotent. Run after build_ion_demo_assets.py:
    python3 scripts/build_ion_triage.py
"""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUB = ROOT / "public" / "ion"
CALLS = PUB / "calls"

# Default weights — Spencer's first guess, tuned by Ion's managers later.
# Each component is 0..1; score = Σ weight × component.
DEFAULT_WEIGHTS = {
    "leak": 3.0,        # trajectory shape: energy leaked / stagnant
    "fragile": 2.5,     # booked, but the handoff lists unresolved concerns
    "protocol": 2.0,    # protocol violations + knowledge gaps
    "bill": 2.0,        # bill captured, never flipped
    "signals": 1.5,     # enthusiasm signals the rep walked past
}
SHAPE_LEAK = {"energy_leaked": 1.0, "stagnant": 0.7, "mixed": 0.4, "energy_built": 0.0}

FLIP_NEG = ("never", "not flipped", "no flip", "without", "doesn't flip", "does not flip",
            "fails to flip", "unused", "moves on", "moved on", "filed", "captured but", "capture alone")


def load(p: Path):
    return json.loads(p.read_text()) if p.exists() else None


def first_sentence(t: str, limit: int = 220) -> str:
    t = (t or "").strip()
    m = re.match(r"(.+?[.!?])(\s|$)", t)
    s = m.group(1) if m else t
    return s if len(s) <= limit else s[: limit - 1].rstrip() + "…"


def bill_flip_status(brief: dict | None, cps: list) -> str:
    """'flipped' | 'not_flipped' | 'no_bill' — measured field if present, else inferred from reads."""
    audit = (brief or {}).get("bill_anchor_audit")
    if audit:
        f = audit.get("flip_executed")
        return {"yes": "flipped", "no": "not_flipped"}.get(f, "no_bill")
    bills = [m for m in cps if m.get("classification") == "bill_anchor"]
    if not bills:
        return "no_bill"
    text = " ".join((m.get("stewart_read") or "") for m in bills).lower()
    return "not_flipped" if any(k in text for k in FLIP_NEG) else "unclear"


def build_row(summary: dict) -> dict:
    cid = summary["call_id"]
    slug = cid.lower() if cid.upper().startswith("SESSION") else cid
    brief = load(CALLS / f"{slug}-manager-brief.json") or {}
    cps = load(CALLS / f"{slug}-cherrypicks.json") or []
    handoff = load(CALLS / f"{slug}-handoff.json")
    critic = load(CALLS / f"{slug}-critic-audit.json") or {}
    qc = load(CALLS / f"{slug}-quote-check.json") or {}

    cls = Counter(m.get("classification", "other") for m in cps)
    shape = (brief.get("shape") or "").split(" ")[0]
    focus = brief.get("primary_coaching_focus") or {}
    unresolved = len((handoff or {}).get("unresolved_concerns") or [])
    observed = (brief.get("observed_outcome") or {}).get("outcome")
    booked = observed in ("booked", "tentative") if observed else bool(handoff and handoff.get("applicable"))
    flip = bill_flip_status(brief, cps)

    components = {
        "leak": SHAPE_LEAK.get(shape, 0.4),
        "fragile": 1.0 if (booked and unresolved >= 2) else (0.5 if (booked and unresolved == 1) else 0.0),
        "protocol": min(1.0, (cls["protocol_violation"] + cls["knowledge_gap"]) / 3),
        "bill": 1.0 if flip == "not_flipped" else 0.0,
        "signals": min(1.0, cls["enthusiasm_signal"] / 3),
    }
    # Grounded = every quoted line exists in the transcript. A quote at the
    # wrong timestamp is a precision slip, not a fabrication — not a flag.
    grounded = (qc.get("not_found", 0) == 0) if qc else None

    return {
        "call_id": cid,
        "slug": slug,
        "rep_id": summary.get("rep_id"),
        "duration_min": summary.get("duration_min") or None,
        "outcome": summary.get("outcome"),
        "booked": booked,
        "shape": shape or None,
        "is_hero": bool(summary.get("is_hero")),
        "tagline": summary.get("tagline"),
        "headline": summary.get("tagline") or (focus.get("topic") or "").strip() or None,
        "why": first_sentence(brief.get("trajectory_summary") or ""),
        "focus": {
            "topic": focus.get("topic"),
            "ts": focus.get("ts"),
            "quote": focus.get("quote"),
        } if focus else None,
        "unresolved_concerns": unresolved,
        "bill_flip": flip,
        # measured (pipeline v3.1) — None on any call still on the old contract
        "observed_outcome": (brief.get("observed_outcome") or {}).get("outcome"),
        "reason_asked": (brief.get("interest_reason_audit") or {}).get("asked"),
        "reason_used": (brief.get("interest_reason_audit") or {}).get("reason_used"),
        "coverage": {c["section"]: c["status"] for c in (brief.get("script_coverage") or []) if isinstance(c, dict) and c.get("section")},
        "counts": {
            "moments": len(cps),
            "protocol_violation": cls["protocol_violation"],
            "knowledge_gap": cls["knowledge_gap"],
            "enthusiasm_signal": cls["enthusiasm_signal"],
            "empathy_miss": cls["empathy_miss"],
            "bill_anchor": cls["bill_anchor"],
        },
        "critic": {
            "verdict": critic.get("verdict"),
            "flags": (critic.get("fabricated_quotes") or 0) + (critic.get("weak_reasoning") or 0),
        },
        "quotes": {
            "checked": qc.get("checked"),
            "verified": (qc.get("verified", 0) + qc.get("fuzzy", 0)) if qc else None,
            "grounded": grounded,
        },
        "components": components,
        "share": shape == "energy_built",
    }


def main() -> None:
    index = load(PUB / "calls-index.json")
    rows = [build_row(c) for c in index["calls"]]
    for r in rows:
        r["score"] = round(sum(DEFAULT_WEIGHTS[k] * v for k, v in r["components"].items()), 3)
    rows.sort(key=lambda r: -r["score"])

    reps = Counter(r["rep_id"] or "Unknown" for r in rows)
    out = {
        "version": "1.0",
        "generated_from": "public/ion/calls/* (Stewart reads) — deterministic, no model",
        "default_weights": DEFAULT_WEIGHTS,
        "weight_labels": {
            "leak": "Energy leaked (trajectory shape)",
            "fragile": "Booked but fragile (unresolved concerns in the handoff)",
            "protocol": "Protocol violations & knowledge gaps",
            "bill": "Bill captured, never flipped",
            "signals": "Buying signals walked past",
        },
        "total_calls": len(rows),
        "reps": [{"rep_id": k, "calls": v} for k, v in reps.most_common()],
        "flip_summary": Counter(r["bill_flip"] for r in rows),
        "calls": rows,
    }
    (PUB / "triage-index.json").write_text(json.dumps(out, indent=1))
    print(f"wrote {len(rows)} rows → public/ion/triage-index.json")
    print("flip:", dict(out["flip_summary"]))
    print("grounded:", Counter(r["quotes"]["grounded"] for r in rows))
    print("top 6:")
    for r in rows[:6]:
        print(f"  {r['score']:5.2f} {r['rep_id'] or '?':8} {r['call_id']:22} {r['shape'] or '?':14} {r['headline'] or ''}")


if __name__ == "__main__":
    main()
