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

# The 13 script sections, in script order. The model occasionally drifts a
# name (credit_qualifier) — alias it back rather than drop the event.
SECTIONS = [
    "intro_legitimacy", "interest_question", "address_homeowner", "co_owner", "roof",
    "utility_company", "bill_amount", "tax_credit_qualifier", "military", "prior_design",
    "bill_collection", "appointment_set", "button_up",
]
SECTION_ALIAS = {"credit_qualifier": "tax_credit_qualifier", "credit_score_qualifier": "tax_credit_qualifier"}
SECTION_LABEL = {
    "intro_legitimacy": "Intro", "interest_question": "Interest question", "address_homeowner": "Address / homeowner",
    "co_owner": "Co-owner", "roof": "Roof", "utility_company": "Utility", "bill_amount": "Bill amount",
    "tax_credit_qualifier": "Tax-credit qualifier", "military": "Military", "prior_design": "Prior design",
    "bill_collection": "Bill collection", "appointment_set": "Appointment", "button_up": "Button-up",
}
# Exemplar tiers — what a manager should have a rep listen to, best first:
#   3  the customer pushed back, the rep stayed with it, and got it
#   2  a clean run of the section on a call that set
#   1  a clean run
EXEMPLAR_FOLLOWUP = ("persisted", "alternative_offered")
MIN_REACHED_FOR_BEST = 8

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


def norm_section(name: str | None) -> str | None:
    return SECTION_ALIAS.get(name or "", name)


def ts_sec(ts: str | None) -> int | None:
    if not ts or ":" not in str(ts):
        return None
    m, s = str(ts).split(":", 1)
    try:
        return int(m) * 60 + int(s)
    except ValueError:
        return None


def event_exemplar(ev: dict, brief: dict, cid: str, slug: str, is_set: bool) -> dict | None:
    """Score one script event as a training clip; None if it isn't one."""
    if ev.get("status") != "asked":
        return None
    start = ts_sec(ev.get("ts"))
    if start is None:
        return None
    resisted = ev.get("customer_response") == "resistant"
    # Button-up is a checklist; the model marks it partial on almost every
    # call. A partial button-up on a set call is still the thing to hear.
    completed = ev.get("result") == "completed" or (ev.get("_section") == "button_up" and ev.get("result") == "partial")
    if resisted and completed and ev.get("rep_followup") in EXEMPLAR_FOLLOWUP:
        tier = 3
    elif completed and is_set:
        tier = 2
    elif completed:
        tier = 1
    else:
        return None
    quote = (ev.get("quote") or "").strip()
    cq = (ev.get("customer_quote") or "").strip()
    score = tier * 10 + (2 if is_set else 0) + (1 if 25 <= len(quote) <= 220 else 0) + (1 if cq else 0)
    end = ts_sec(ev.get("end_ts"))
    end = max(end or 0, start + 10)
    end = min(end, start + 45)
    return {
        "call_id": cid,
        "slug": slug,
        "rep": brief.get("rep_name"),
        "ts": ev.get("ts"),
        "start_sec": max(0, start - 2),
        "end_sec": end,
        "quote": quote,
        "customer_quote": cq,
        "customer_response": ev.get("customer_response"),
        "rep_followup": ev.get("rep_followup"),
        "set": is_set,
        "tier": tier,
        "score": score,
    }


def build_exemplars(rows: list[dict], events_by_call: dict[str, list[dict]]) -> dict:
    """Per section: the reps who run it most (and set when they do) + the clips to learn from.

    Deterministic. Diversity rules: one clip per call per section, at most two
    per rep per section, six per section.
    """
    per_sec_clips: dict[str, list[dict]] = {s: [] for s in SECTIONS}
    per_rep: dict[str, dict[str, dict]] = {}
    for r in rows:
        rep = r["rep_id"] or "Unknown"
        stats = per_rep.setdefault(rep, {s: {"ran": 0, "reached": 0, "set_when_ran": 0} for s in SECTIONS})
        for sec, st in r["coverage"].items():
            if sec not in stats or st == "not_reached":
                continue
            stats[sec]["reached"] += 1
            if st == "asked":
                stats[sec]["ran"] += 1
                if r["booked"]:
                    stats[sec]["set_when_ran"] += 1
        seen = set()
        for ev in events_by_call.get(r["call_id"], []):
            sec = ev.get("_section")
            if sec not in per_sec_clips or sec in seen:
                continue
            x = event_exemplar(ev, ev["_brief"], r["call_id"], r["slug"], r["booked"])
            if x:
                seen.add(sec)
                per_sec_clips[sec].append(x)

    out = {}
    for sec in SECTIONS:
        best = []
        for rep, stats in per_rep.items():
            st = stats[sec]
            if st["reached"] < MIN_REACHED_FOR_BEST or rep == "Unknown":
                continue
            best.append({
                "rep": rep,
                "rate": round(st["ran"] / st["reached"], 3),
                "ran": st["ran"],
                "reached": st["reached"],
                "set_rate_when_ran": round(st["set_when_ran"] / st["ran"], 3) if st["ran"] else None,
            })
        best.sort(key=lambda b: (-b["rate"], -(b["set_rate_when_ran"] or 0), -b["reached"]))
        # The reps who run the section best each bring their own best clip
        # (so "learn from Tyke" comes with Tyke's tape), then the floor's best.
        ranked = sorted(per_sec_clips[sec], key=lambda c: (-c["score"], c["call_id"]))
        clips, per_rep_n = [], Counter()
        for b in best[:3]:
            own = next((c for c in ranked if c["rep"] == b["rep"]), None)
            if own:
                clips.append(own)
                per_rep_n[own["rep"]] += 1
        for c in ranked:
            if c in clips or per_rep_n[c["rep"]] >= 2:
                continue
            per_rep_n[c["rep"]] += 1
            clips.append(c)
            if len(clips) >= 8:
                break
        out[sec] = {"label": SECTION_LABEL[sec], "best_reps": best[:5], "clips": clips,
                    "pool": len(per_sec_clips[sec])}
    return out


OBJ_CLIP_LEAD, OBJ_CLIP_LEN = 5, 25


def objection_row(o: dict) -> dict:
    t = ts_sec(o.get("ts"))
    return {
        "ts": o.get("ts"),
        "start_sec": max(0, t - OBJ_CLIP_LEAD) if t is not None else None,
        "end_sec": t + OBJ_CLIP_LEN if t is not None else None,
        "quote": o.get("quote") or "",
        "type": o.get("type") or "other",
        "blocked_section": norm_section(o.get("blocked_section")) if o.get("blocked_section") not in (None, "", "none") else None,
        "attempts": int(o.get("rep_attempts") or 0),
        "moves": [m for m in (o.get("attempt_moves") or []) if isinstance(m, str)],
        "attempt_quotes": [q for q in (o.get("attempt_quotes") or []) if isinstance(q, str)][:4],
        "resolved": bool(o.get("resolved")),
        "continued": o.get("resolved_by_tape"),
        "next_event": o.get("next_event"),
    }


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
        "coverage": {norm_section(c["section"]): c["status"] for c in (brief.get("script_coverage") or []) if isinstance(c, dict) and c.get("section")},
        # objections (layered pipeline): a no in any clothing, where it landed, what the rep tried,
        # whether the tape shows the script continuing. Older reads carry type/attempts only.
        "objections": [objection_row(o) for o in (brief.get("objections") or []) if isinstance(o, dict)],
        "_events": [dict(c, _section=norm_section(c.get("section")), _brief=brief)
                    for c in (brief.get("script_coverage") or []) if isinstance(c, dict) and c.get("section")],
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

    events_by_call = {r["call_id"]: r.pop("_events") for r in rows}
    exemplars = build_exemplars(rows, events_by_call)

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
        "sections": [{"key": k, "label": SECTION_LABEL[k]} for k in SECTIONS],
        "exemplars": exemplars,
        "calls": rows,
    }
    (PUB / "triage-index.json").write_text(json.dumps(out, indent=1))
    print(f"wrote {len(rows)} rows → public/ion/triage-index.json")
    print("flip:", dict(out["flip_summary"]))
    print("grounded:", Counter(r["quotes"]["grounded"] for r in rows))
    print("exemplars:", {k: (len(v["clips"]), v["pool"], v["best_reps"][0]["rep"] if v["best_reps"] else None) for k, v in exemplars.items()})
    print("top 6:")
    for r in rows[:6]:
        print(f"  {r['score']:5.2f} {r['rep_id'] or '?':8} {r['call_id']:22} {r['shape'] or '?':14} {r['headline'] or ''}")


if __name__ == "__main__":
    main()
