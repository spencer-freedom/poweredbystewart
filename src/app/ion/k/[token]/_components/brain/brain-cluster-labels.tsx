"use client";

// Cluster floating labels — top-3 densest clusters get a billboard
// text label hovering at their cluster centroid. Format:
//   "Price · 141 · 61% wr"
//
// Implementation: HTML overlay rather than Three.js Sprite. Projects
// world coords through the camera each frame and positions absolute-
// positioned divs. Cheaper than texture-baked sprites and keeps the
// text crisp at any zoom; also matches the rest of our CSS palette.

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { BrainGraphPayload, OutcomeBucket } from "./brain-types";

type ClusterStat = {
  cluster_id: string;
  count: number;
  centroid: { x: number; y: number; z: number };
  winRate: number; // 0-1
};

type CameraRef = {
  camera: () => THREE.Camera;
  renderer: () => THREE.WebGLRenderer;
};

export function BrainClusterLabels({
  data,
  fgRef,
}: {
  data: BrainGraphPayload;
  fgRef: React.MutableRefObject<CameraRef | null>;
}) {
  const stats = useMemo<ClusterStat[]>(() => {
    const counts = new Map<
      string,
      { sum: { x: number; y: number; z: number }; n: number; wins: number; losses: number; partials: number }
    >();
    for (const n of data.nodes) {
      if (n.type === "call") continue;
      const cid = n.cluster_id;
      if (!cid || cid === "unknown") continue;
      const oc: OutcomeBucket = n.effective_outcome;
      const cur = counts.get(cid) ?? {
        sum: { x: 0, y: 0, z: 0 },
        n: 0,
        wins: 0,
        losses: 0,
        partials: 0,
      };
      cur.sum.x += n.x;
      cur.sum.y += n.y;
      cur.sum.z += n.z;
      cur.n++;
      if (oc === "worked") cur.wins++;
      else if (oc === "failed") cur.losses++;
      else if (oc === "partial") cur.partials++;
      counts.set(cid, cur);
    }
    const sorted = [...counts.entries()]
      .map(([cluster_id, v]) => {
        const total = v.wins + v.losses + v.partials;
        return {
          cluster_id,
          count: v.n,
          centroid: { x: v.sum.x / v.n, y: v.sum.y / v.n, z: v.sum.z / v.n },
          winRate: total > 0 ? v.wins / total : 0,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    return sorted;
  }, [data.nodes]);

  const labelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [, force] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let frameId: number;
    let opacity = 0.7;

    const tick = () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.hidden) {
        frameId = requestAnimationFrame(tick);
        return;
      }
      const fg = fgRef.current;
      const cam = fg?.camera?.();
      const renderer = fg?.renderer?.();
      if (!cam || !renderer) {
        frameId = requestAnimationFrame(tick);
        return;
      }
      const dom = renderer.domElement;
      const w = dom.clientWidth;
      const h = dom.clientHeight;

      // Camera distance for opacity attenuation: closer = lower opacity
      // so the labels recede when you fly into the brain.
      const camDist =
        cam instanceof THREE.PerspectiveCamera || cam instanceof THREE.OrthographicCamera
          ? cam.position.length()
          : 250;
      opacity = camDist > 280 ? 0.7 : Math.max(0.3, 0.7 - (280 - camDist) / 200);

      stats.forEach((s, i) => {
        const v = new THREE.Vector3(s.centroid.x, s.centroid.y, s.centroid.z);
        v.project(cam);
        const x = (v.x * 0.5 + 0.5) * w;
        const y = (-v.y * 0.5 + 0.5) * h;
        const visible = v.z < 1; // in front of camera
        const el = labelRefs.current[i];
        if (!el) return;
        el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        el.style.opacity = visible ? String(opacity) : "0";
      });

      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (frameId != null) cancelAnimationFrame(frameId);
    };
  }, [stats, fgRef]);

  // Force a re-render after mount to attach refs to spans (no-op
  // beyond ensuring labelRefs[i] is current — useState bumps once).
  useEffect(() => force(1), []);

  return (
    <div className="pointer-events-none absolute inset-0">
      {stats.map((s, i) => (
        <div
          key={s.cluster_id}
          ref={(el) => {
            labelRefs.current[i] = el;
          }}
          className="absolute top-0 left-0 transition-opacity duration-300"
          style={{
            color: "#94A3B8",
            fontSize: 13,
            fontWeight: 300,
            letterSpacing: "0.01em",
            textShadow: "0 1px 2px rgba(0,0,0,0.85)",
            whiteSpace: "nowrap",
          }}
        >
          {prettyClusterName(s.cluster_id)} · {s.count} ·{" "}
          {Math.round(s.winRate * 100)}% wr
        </div>
      ))}
    </div>
  );
}

function prettyClusterName(id: string): string {
  return id
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
