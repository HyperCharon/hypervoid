"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";

type GraphNode = {
  slug: string;
  title: string;
  degree: number;
  category: string | null;
};

type GraphEdge = {
  source: string;
  target: string;
};

type SimNode = GraphNode & SimulationNodeDatum;
type SimLink = SimulationLinkDatum<SimNode> & { source: string | SimNode; target: string | SimNode };

const W = 920;
const H = 620;

export function KnowledgeGraphCanvas({
  nodes: rawNodes,
  edges: rawEdges,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [, setTick] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);

  const simNodes = useMemo<SimNode[]>(
    () => rawNodes.map((n) => ({ ...n })),
    [rawNodes],
  );
  const simLinks = useMemo<SimLink[]>(
    () => rawEdges.map((e) => ({ source: e.source, target: e.target })),
    [rawEdges],
  );

  useEffect(() => {
    if (simNodes.length === 0) return;
    const sim = forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.slug)
          .distance(70)
          .strength(0.4),
      )
      .force("charge", forceManyBody<SimNode>().strength(-220))
      .force("center", forceCenter(W / 2, H / 2))
      .force("x", forceX(W / 2).strength(0.04))
      .force("y", forceY(H / 2).strength(0.04));

    let raf = 0;
    let frames = 0;
    const tick = () => {
      frames++;
      // Throttle re-render: 1 every 2 ticks is plenty for a smooth feel.
      if (frames % 2 === 0) setTick((v) => v + 1);
      if (sim.alpha() > 0.005) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      sim.stop();
    };
  }, [simNodes, simLinks]);

  if (simNodes.length === 0) {
    return (
      <p className="hv-panel border-dashed p-12 text-center text-muted">
        还没有互相链接的文章。在两篇文章之间加上 <code>/posts/&lt;slug&gt;</code>{" "}
        或 <code>[[slug]]</code> 形式的链接，它们就会出现在这里。
      </p>
    );
  }

  return (
    <div className="hv-panel relative w-full overflow-hidden p-0">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label="知识图谱"
      >
        <g>
          {simLinks.map((l, i) => {
            const s = l.source as SimNode;
            const t = l.target as SimNode;
            if (
              typeof s !== "object" ||
              typeof t !== "object" ||
              !Number.isFinite(s.x) ||
              !Number.isFinite(t.x)
            )
              return null;
            const active =
              hovered && (s.slug === hovered || t.slug === hovered);
            return (
              <line
                key={i}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={active ? "var(--accent-soft)" : "var(--accent)"}
                strokeWidth={active ? 1.5 : 1}
                strokeOpacity={active ? 0.9 : 0.22}
              />
            );
          })}
        </g>
        <g>
          {simNodes.map((n) => {
            if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) return null;
            const r = 6 + Math.min(14, Math.sqrt(n.degree) * 3);
            const isHovered = hovered === n.slug;
            return (
              <g
                key={n.slug}
                transform={`translate(${n.x}, ${n.y})`}
                onMouseEnter={() => setHovered(n.slug)}
                onMouseLeave={() =>
                  setHovered((h) => (h === n.slug ? null : h))
                }
                onClick={() => router.push(`/posts/${n.slug}`)}
                className="cursor-pointer"
              >
                <circle
                  r={r}
                  fill={isHovered ? "var(--accent-glow)" : "var(--card)"}
                  stroke={isHovered ? "var(--accent-soft)" : "var(--accent)"}
                  strokeWidth={isHovered ? 2 : 1.5}
                />
                <text
                  textAnchor="middle"
                  y={r + 12}
                  className="select-none fill-current text-xs font-medium"
                  style={{
                    fill: isHovered ? "rgb(224 242 254)" : "rgba(240,249,255,0.76)",
                    paintOrder: "stroke",
                    stroke: "rgba(2,4,10,0.92)",
                    strokeWidth: 3,
                  }}
                >
                  {n.title.length > 18
                    ? n.title.slice(0, 17) + "…"
                    : n.title}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
