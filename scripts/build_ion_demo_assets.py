#!/usr/bin/env python3
"""Build static JSON assets for the Ion demo surface.

Reads the canonical SpencerOS dataset (~332 processed Ion calls + brain
aggregates + schema YAML) and produces the static files the Next.js demo
fetches at runtime:

  public/ion/
    calls-index.json                       (332-call summary for /ion/calls list)
    calls/{call_id}-manager-brief.json     (detail-drawer payloads)
    calls/{call_id}-cherrypicks.json
    calls/{call_id}-handoff.json           (if booked / has handoff)
    calls/{call_id}-metadata.json
    sessionN_hash-*.json                   (carousel-targeted copies for the
                                            7 hero calls — backward compatible
                                            with the prior §2 wiring)
    schema-payload.json                     (schema YAML parsed + brain stats
                                            merged + proposed-pending entries)

Idempotent. Safe to run multiple times. Designed to run as a one-shot:

    python3 scripts/build_ion_demo_assets.py

By default sources the canonical data from a SpencerOS checkout at
~/SpencerOS. Override via --spencer-os / SPENCER_OS_ROOT env if your
checkout lives elsewhere.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys
from pathlib import Path
from typing import Any

import yaml

# ─── Paths ──────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ION = REPO_ROOT / "public" / "ion"
PUBLIC_CALLS = PUBLIC_ION / "calls"

DEFAULT_SPENCER_OS = Path(
    os.environ.get(
        "SPENCER_OS_ROOT", str(Path.home() / "SpencerOS")
    )
)

# ─── Hero calls (these get carousel-targeted copies too) ────────────────

HERO_CALLS: list[dict[str, Any]] = [
    {
        "call_id": "SESSION10_eb080f7c",
        "tagline": "Larry was qualified. Jake lost him.",
        "gray_matter": None,
    },
    {
        "call_id": "SESSION18_fd078269",
        "tagline": "Spouse-protocol fast-book.",
        "gray_matter": "protocols.spouse_decision",
    },
    {
        "call_id": "SESSION18_fcbf33c1",
        "tagline": "Roof cross-sell bridge in 4 seconds.",
        "gray_matter": "cross_sell_signals.roof_replacement_planned",
    },
    {
        "call_id": "SESSION14_be5b61f0",
        "tagline": "Masterclass. Multi-angle resilience + bill anchor.",
        "gray_matter": "coaching_philosophy.bill_anchoring",
    },
    {
        "call_id": "SESSION20_2b61f758",
        "tagline": "Fragile win. Hostile → committed-with-conditions.",
        "gray_matter": None,
    },
    {
        "call_id": "SESSION6_72cebf8e",
        "tagline": "Vulnerable customer. Empathy gap.",
        "gray_matter": None,
    },
    {
        "call_id": "SESSION8_e0938fef",
        "tagline": "Credit threshold near-miss.",
        "gray_matter": None,
    },
]

# ─── Helpers ────────────────────────────────────────────────────────────


def read_json(p: Path) -> Any:
    return json.loads(p.read_text(encoding="utf-8"))


def write_json(p: Path, obj: Any) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, indent=2, ensure_ascii=False), encoding="utf-8")


def slugify_call_id(call_id: str) -> str:
    """SESSION18_fd078269 → session18_fd078269 (existing public/ion/ convention)."""
    return call_id.lower()


# ─── Step 1 — calls index + per-call detail copies ──────────────────────


def build_calls(spencer_os: Path) -> dict[str, Any]:
    calls_root = spencer_os / "data" / "ion_solar" / "calls"
    if not calls_root.exists():
        sys.exit(f"calls root not found: {calls_root}")

    hero_ids = {h["call_id"] for h in HERO_CALLS}
    hero_index = {h["call_id"]: h for h in HERO_CALLS}

    summaries: list[dict[str, Any]] = []
    copied_calls = 0
    copied_hero_sets = 0

    PUBLIC_CALLS.mkdir(parents=True, exist_ok=True)

    for call_dir in sorted(calls_root.iterdir()):
        if not call_dir.is_dir():
            continue
        meta_p = call_dir / "metadata.json"
        if not meta_p.exists():
            continue

        meta = read_json(meta_p)
        call_id = meta.get("call_id") or call_dir.name

        cherrypicks_p = call_dir / "cherrypicks.json"
        manager_brief_p = call_dir / "manager-brief.json"
        handoff_p = call_dir / "handoff.json"
        critic_audit_p = call_dir / "critic-audit.json"

        cherry = read_json(cherrypicks_p) if cherrypicks_p.exists() else []
        manager_brief = read_json(manager_brief_p) if manager_brief_p.exists() else None

        # Ensure every cherrypick has a duration_seconds field. Default is
        # 20 (the V1 fixed clip length); upstream pipeline can override
        # per moment when it has signal — e.g., shorter for one-liners,
        # longer for protracted exchanges. The renderer reads this field
        # to size each clip's <audio> request.
        if isinstance(cherry, list):
            for pick in cherry:
                if isinstance(pick, dict) and "duration_seconds" not in pick:
                    pick["duration_seconds"] = 20

        # Detail-drawer copies (for /ion/calls drawer + brain PlanetDetail)
        slug = slugify_call_id(call_id)
        write_json(PUBLIC_CALLS / f"{slug}-metadata.json", meta)
        if manager_brief is not None:
            write_json(PUBLIC_CALLS / f"{slug}-manager-brief.json", manager_brief)
        write_json(PUBLIC_CALLS / f"{slug}-cherrypicks.json", cherry)
        if handoff_p.exists():
            handoff = read_json(handoff_p)
            write_json(PUBLIC_CALLS / f"{slug}-handoff.json", handoff)
        if critic_audit_p.exists():
            critic = read_json(critic_audit_p)
            # Slim down — full audit objects are large; for the demo
            # we only need the count headlines + verdict + summary.
            slim = {
                "verdict": critic.get("verdict"),
                "fabricated_quotes": len(critic.get("fabricated_quotes") or [])
                if isinstance(critic.get("fabricated_quotes"), list)
                else critic.get("fabricated_quotes"),
                "weak_reasoning": len(critic.get("weak_reasoning") or [])
                if isinstance(critic.get("weak_reasoning"), list)
                else critic.get("weak_reasoning"),
                "revision_summary": critic.get("revision_summary"),
                "flags_count": (
                    critic.get("verification", {}).get("quotes_failed")
                    if isinstance(critic.get("verification"), dict)
                    else None
                ),
            }
            write_json(PUBLIC_CALLS / f"{slug}-critic-audit.json", slim)

        # Hero calls also land in public/ion/{slug}-*.json directly
        # so the existing §2 carousel paths keep working.
        if call_id in hero_ids:
            for filename in (
                f"{slug}-metadata.json",
                f"{slug}-manager-brief.json",
                f"{slug}-cherrypicks.json",
                f"{slug}-handoff.json",
            ):
                src = PUBLIC_CALLS / filename
                if src.exists():
                    shutil.copyfile(src, PUBLIC_ION / filename)
            copied_hero_sets += 1

        # Build index entry
        cherry_count = len(cherry) if isinstance(cherry, list) else 0
        classifications: dict[str, int] = {}
        schema_refs: set[str] = set()
        if isinstance(cherry, list):
            for c in cherry:
                k = (c.get("classification") or "").strip()
                if k:
                    classifications[k] = classifications.get(k, 0) + 1
                ref = c.get("schema_reference")
                if ref:
                    schema_refs.add(ref)

        top_classifications = sorted(
            classifications.items(), key=lambda kv: -kv[1]
        )[:2]

        hero = hero_index.get(call_id)

        summaries.append(
            {
                "call_id": call_id,
                "rep_id": meta.get("rep_id"),
                "outcome": meta.get("outcome"),
                "duration_min": round(meta.get("duration_min") or 0, 1),
                "demo_role": meta.get("demo_role"),
                "primary_objection": meta.get("primary_objection"),
                "cherrypick_count": cherry_count,
                "top_classifications": [k for k, _ in top_classifications],
                "schema_references": sorted(schema_refs),
                "aging_tier": (meta.get("aging") or {}).get("tier") or "unknown",
                "is_hero": hero is not None,
                "tagline": hero["tagline"] if hero else None,
                "is_gray_matter": bool(hero and hero["gray_matter"]),
                "gray_matter_section": hero["gray_matter"] if hero else None,
                "has_handoff": handoff_p.exists(),
            }
        )
        copied_calls += 1

    summaries.sort(
        key=lambda s: (
            not s["is_hero"],
            -s["cherrypick_count"],
            (s["call_id"] or ""),
        )
    )

    index = {
        "version": "1.0",
        "total_calls": copied_calls,
        "hero_count": copied_hero_sets,
        "calls": summaries,
    }
    write_json(PUBLIC_ION / "calls-index.json", index)

    print(
        f"calls: indexed {copied_calls} calls "
        f"({copied_hero_sets} hero · drawer payloads in public/ion/calls/)"
    )

    return index


# ─── Step 2 — schema payload ─────────────────────────────────────────────

SCHEMA_DOMAIN_ORDER = [
    "context",
    "intros",
    "verify",
    "qualifiers",
    "call_shape",
    "protocols",
    "rebuttals",
    "coaching_philosophy",
    "cross_sell_signals",
    "button_up",
    "outcomes",
    "dq_rules",
    "analysis_directives",
    "bill_collection",
    "ion_offerings_beyond_setter_call",
    "handoff_brief_discipline",
    "setter_compensation_model",
    "text_after_call",
    "orphaned_flow",
    "llm_context_injection",
]

TBD_PATTERN = re.compile(r"#\s*TBD\b", re.IGNORECASE)
# Match `# RESOLVED YYYY-MM-DD`, `# CONFIRMED YYYY-MM-DD`, or
# `kenny_resolved_YYYY_MM_DD:` key (the schema uses the last form for
# Tesla — see line 216 of schema_v1.0_solar_skeleton.yaml).
RESOLVED_PATTERN = re.compile(
    r"(?:#\s*(?:RESOLVED|CONFIRMED)\s+([0-9]{4}-[0-9]{2}-[0-9]{2}))"
    r"|(?:kenny_resolved_([0-9]{4})_([0-9]{2})_([0-9]{2}))",
    re.IGNORECASE,
)


def _resolved_date(match: re.Match[str]) -> str | None:
    if match.group(1):
        return match.group(1)
    if match.group(2):
        return f"{match.group(2)}-{match.group(3)}-{match.group(4)}"
    return None


def parse_schema_yaml(schema_path: Path, schema_text: str) -> dict[str, Any]:
    """Scan schema YAML text for section paths + status markers.
    Avoids yaml.safe_load — the canonical schema contains a few stylistic
    quirks (anchors mixed with lists) that don't round-trip cleanly, and
    we don't actually need the parsed object for the demo payload."""
    lines = schema_text.splitlines()

    # Walk all lines, accumulating an indent-stack of current section path.
    # When we hit a TBD or RESOLVED comment, attach it to the most recent
    # leaf path seen above it.
    indent_stack: list[tuple[int, str]] = []
    current_path: list[str] = []
    last_seen_section: list[str] = []
    statuses: dict[str, dict[str, Any]] = {}
    section_line_starts: dict[str, int] = {}

    key_re = re.compile(r"^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:")

    for i, line in enumerate(lines):
        stripped = line.lstrip()
        if not stripped.strip():
            continue
        m = key_re.match(line)
        if m:
            indent = len(m.group(1))
            key = m.group(2)
            # pop deeper-or-equal levels
            while indent_stack and indent_stack[-1][0] >= indent:
                indent_stack.pop()
                if current_path:
                    current_path.pop()
            indent_stack.append((indent, key))
            current_path = [k for _, k in indent_stack]
            path_str = ".".join(current_path)
            last_seen_section = current_path[:]
            section_line_starts.setdefault(path_str, i + 1)

        # Status markers — attach to the last_seen_section path
        if last_seen_section:
            path_str = ".".join(last_seen_section)
            if TBD_PATTERN.search(line):
                statuses.setdefault(path_str, {"tbd_items": []})
                statuses[path_str].setdefault("tbd_items", []).append(
                    line.strip().lstrip("#").strip()
                )
            res = RESOLVED_PATTERN.search(line)
            if res:
                statuses.setdefault(path_str, {})
                statuses[path_str]["resolved"] = True
                date = _resolved_date(res)
                if date:
                    statuses[path_str]["resolved_at"] = date

    return {"statuses": statuses, "line_starts": section_line_starts}


RAW_YAML_MAX_LINES = 60
RAW_YAML_MAX_CHARS = 1500


def extract_raw_yaml_block(text: str, start_line_1based: int) -> str:
    """Capture the YAML block starting at start_line. Stops at the first
    sibling or shallower key, or at the line/char caps — whichever first.
    Caps keep the schema payload tractable; full YAML viewer can fetch
    the raw file separately if a deeper view is ever needed."""
    lines = text.splitlines()
    if start_line_1based - 1 >= len(lines):
        return ""
    start = lines[start_line_1based - 1]
    base_indent = len(start) - len(start.lstrip())
    out = [start]
    char_count = len(start)
    for line in lines[start_line_1based:]:
        stripped = line.strip()
        if stripped and re.match(r"^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:", line):
            indent = len(line) - len(line.lstrip())
            if indent <= base_indent:
                break
        out.append(line)
        char_count += len(line) + 1
        if len(out) >= RAW_YAML_MAX_LINES or char_count >= RAW_YAML_MAX_CHARS:
            out.append(f"# … (truncated; see schema YAML for full block)")
            break
    return "\n".join(out)


def domain_of(path: str) -> str:
    return path.split(".")[0]


def build_schema(spencer_os: Path) -> None:
    schema_path = REPO_ROOT / "data" / "ion_solar" / "schema" / "schema_v1.0_solar_skeleton.yaml"
    if not schema_path.exists():
        sys.exit(f"schema not found: {schema_path}")
    schema_text = schema_path.read_text(encoding="utf-8")
    parsed = parse_schema_yaml(schema_path, schema_text)
    statuses = parsed["statuses"]
    line_starts = parsed["line_starts"]
    total_lines = len(schema_text.splitlines())

    # Brain aggregates per section
    nodes_dir = REPO_ROOT / "data" / "ion_solar" / "brain" / "nodes"
    brain_by_section: dict[str, dict[str, Any]] = {}
    for f in nodes_dir.glob("*.json"):
        try:
            j = read_json(f)
            path = j.get("schema_section") or f.stem
            brain_by_section[path] = {
                "call_count": len(j.get("call_ids") or []),
                "classifications": j.get("pattern_counts_by_classification") or {},
                "outcomes": j.get("outcomes") or {},
                "recent_examples": (j.get("recent_examples") or [])[:5],
                "gray_matter_exemplars": j.get("gray_matter_exemplars") or [],
            }
        except Exception as e:
            print(f"  ! couldn't parse {f.name}: {e}", file=sys.stderr)

    sections_lit = len(brain_by_section)

    # Build full section list — union of YAML-known paths + brain-known paths
    all_paths: set[str] = set(line_starts.keys()) | set(brain_by_section.keys())

    sections_out: list[dict[str, Any]] = []
    for path in sorted(all_paths):
        if "." not in path:
            continue  # top-level keys (like `protocols`) are domain headers, not sections
        status_meta = statuses.get(path, {}) or {}
        brain_meta = brain_by_section.get(path, {})
        raw_yaml = ""
        if path in line_starts:
            raw_yaml = extract_raw_yaml_block(schema_text, line_starts[path])

        # Drop super-shallow paths (parent + child) where the path's
        # last segment is something the YAML doesn't actually nest under.
        # Conservative: keep them — Strategy Claude wanted full visibility.

        # TODO(spencer/codex): expose `description` as a structured
        # field on the section dict here, parsed from raw_yaml. The
        # frontend currently regex-parses raw_yaml at render time
        # (see descriptionFromYaml in src/app/ion/(public)/schema/types.ts)
        # which is brittle to YAML formatting drift. Move that parse
        # here so the payload carries a stable string.
        sections_out.append(
            {
                "path": path,
                "domain": domain_of(path),
                "leaf": path.split(".")[-1],
                "status": (
                    "resolved"
                    if status_meta.get("resolved")
                    else "tbd"
                    if status_meta.get("tbd_items")
                    else "lit"
                    if brain_meta
                    else "stub"
                ),
                "resolved_at": status_meta.get("resolved_at"),
                "tbd_items": status_meta.get("tbd_items") or [],
                "corpus_stats": brain_meta,
                "raw_yaml": raw_yaml,
            }
        )

    # Proposed-pending categories
    pending_path = (
        REPO_ROOT / "data" / "ion_solar" / "proposed_schema_edits" / "schema_additions_pending.yaml"
    )
    proposed_categories: list[dict[str, Any]] = []
    if pending_path.exists():
        try:
            pending = yaml.safe_load(pending_path.read_text(encoding="utf-8"))
            classifs = (pending or {}).get("proposed_classifications") or {}
            # Also pull the nested verbal_discipline.softener_overuse
            # entry (Spencer's catch) — it lives under
            # coaching_philosophy_addition rather than the top-level
            # proposed_classifications block.
            cpa = (pending or {}).get("coaching_philosophy_addition") or {}
            verbal = (cpa.get("verbal_discipline") or {})
            if isinstance(verbal, dict):
                for k, v in verbal.items():
                    if isinstance(v, dict) and k != "description":
                        classifs.setdefault(k, v)

            for name, body in classifs.items():
                if not isinstance(body, dict):
                    continue
                proposed_categories.append(
                    {
                        "name": name,
                        "description": (body.get("description") or "").strip(),
                        "distinct_from": body.get("distinct_from"),
                        "distinction": (body.get("distinction") or "").strip(),
                        "fix": (body.get("fix") or "").strip(),
                        "coaching_drill": (body.get("coaching_drill") or "").strip(),
                        "coaching_priority": body.get("coaching_priority"),
                        "critical_finding": (body.get("critical_finding") or "").strip(),
                        "attribution": (body.get("attribution") or "").strip(),
                        "example_call_ids": body.get("example_call_ids") or [],
                        "sample_frequency_in_corpus": body.get("sample_frequency_in_corpus"),
                        "detected_in_corpus_actually_executed": body.get(
                            "detected_in_corpus_actually_executed"
                        ),
                        "corpus_data_2026_05_22": body.get("corpus_data_2026_05_22"),
                        "is_bombshell": name == "objection_inversion_miss",
                        "spencers_catch": name == "softener_overuse",
                    }
                )
        except Exception as e:
            print(f"  ! couldn't parse pending edits: {e}", file=sys.stderr)

    # Stat strip
    tbd_count = sum(1 for s in sections_out if s["status"] == "tbd")
    resolved_count = sum(1 for s in sections_out if s["status"] == "resolved")

    # Gray-matter from brain layer
    gray_matter_count = sum(
        len(b.get("gray_matter_exemplars") or []) for b in brain_by_section.values()
    )

    payload = {
        "version": "1.0",
        "total_lines": total_lines,
        "stats": {
            "total_lines": total_lines,
            "sections_lit": sections_lit,
            "tbds": tbd_count,
            "resolved": resolved_count,
            "presumptive_gray_matter": gray_matter_count,
            "proposed_pending": len(proposed_categories),
        },
        "sections": sections_out,
        "proposed_categories": proposed_categories,
        "domain_order": SCHEMA_DOMAIN_ORDER,
    }
    write_json(PUBLIC_ION / "schema-payload.json", payload)
    print(
        f"schema: {total_lines} lines · {len(sections_out)} sections "
        f"({sections_lit} lit · {tbd_count} TBD · {resolved_count} resolved · "
        f"{gray_matter_count} gray-matter · {len(proposed_categories)} proposed)"
    )


# ─── Main ───────────────────────────────────────────────────────────────


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--spencer-os",
        default=str(DEFAULT_SPENCER_OS),
        help="path to SpencerOS checkout (default: %(default)s)",
    )
    ap.add_argument(
        "--skip-calls",
        action="store_true",
        help="skip the 332-call walk (useful during schema iteration)",
    )
    ap.add_argument(
        "--skip-schema",
        action="store_true",
        help="skip schema payload regen",
    )
    args = ap.parse_args()

    spencer_os = Path(args.spencer_os)
    if not spencer_os.exists():
        sys.exit(
            f"--spencer-os path not found: {spencer_os}\n"
            "Pass --spencer-os <path> or set SPENCER_OS_ROOT."
        )

    PUBLIC_ION.mkdir(parents=True, exist_ok=True)

    if not args.skip_calls:
        build_calls(spencer_os)
    if not args.skip_schema:
        build_schema(spencer_os)

    print("done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
