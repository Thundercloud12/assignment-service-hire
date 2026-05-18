import React, { useRef, useEffect, useState } from 'react';
import { type IGraphNode, type IGraphEdge, type IScoreInfluencerData } from '../services/graph.service';

interface ScoreInfluencerGraphProps {
  data: IScoreInfluencerData;
}

export const ScoreInfluencerGraph: React.FC<ScoreInfluencerGraphProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [nodes, setNodes] = useState<IGraphNode[]>([]);
  const [edges, setEdges] = useState<IGraphEdge[]>([]);
  
  // Animation variables
  const [hoveredNode, setHoveredNode] = useState<IGraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Initialize and lay out nodes in an orbit around the center lead node
  useEffect(() => {
    if (!data || !data.nodes) return;

    const width = 600;
    const height = 360;
    const centerX = width / 2;
    const centerY = height / 2;

    const clonedNodes: IGraphNode[] = [];
    const leadNode = data.nodes.find((n) => n.type === 'lead');
    const factorNodes = data.nodes.filter((n) => n.type !== 'lead');

    // 1. Position Lead Node exactly in the center
    if (leadNode) {
      clonedNodes.push({
        ...leadNode,
        x: centerX,
        y: centerY,
        vx: 0,
        vy: 0,
      });
    }

    // 2. Position Factor Nodes in an orbital ring
    const radius = 120;
    factorNodes.forEach((node, i) => {
      const angle = (i / factorNodes.length) * Math.PI * 2 - Math.PI / 2; // Start from top
      clonedNodes.push({
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      });
    });

    const clonedEdges: IGraphEdge[] = data.edges.map((e) => ({ ...e }));

    setNodes(clonedNodes);
    setEdges(clonedEdges);
  }, [data]);

  // Main rendering animation loop (paints and drives flow particles)
  useEffect(() => {
    if (nodes.length === 0) return;

    let animFrameId: number;

    const tick = () => {
      render();
      animFrameId = requestAnimationFrame(tick);
    };

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark canvas theme match
      ctx.fillStyle = '#09090b'; // bg-surface-card look
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Edges with animated flowing dashes flowing towards the center
      const dashOffset = (Date.now() / 25) % 40; // Dash sliding offset

      edges.forEach((edge) => {
        const sNode = nodes.find((n) => n.id === edge.from);
        const tNode = nodes.find((n) => n.id === edge.to);
        if (!sNode || !tNode) return;

        ctx.beginPath();
        ctx.moveTo(sNode.x!, sNode.y!);
        ctx.lineTo(tNode.x!, tNode.y!);

        // Edge styling: emerald green for positive contributions, red for negative
        let strokeStyle = 'rgba(113, 113, 122, 0.2)';
        let edgeGlow = 'rgba(0, 0, 0, 0)';

        if (edge.type === 'positive') {
          strokeStyle = 'rgba(16, 185, 129, 0.35)'; // emerald
          edgeGlow = 'rgba(16, 185, 129, 0.15)';
        } else if (edge.type === 'negative') {
          strokeStyle = 'rgba(244, 63, 94, 0.35)'; // rose red
          edgeGlow = 'rgba(244, 63, 94, 0.15)';
        }

        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = Math.min(2 + edge.weight * 0.7, 7); // Thickness scales with contribution weight
        
        ctx.save();
        ctx.shadowColor = edgeGlow;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();

        // Animated particles traveling along edge to central node
        ctx.save();
        ctx.strokeStyle = edge.type === 'positive' ? '#10b981' : '#f59e0b';
        ctx.lineWidth = Math.max(ctx.lineWidth - 1.5, 1.5);
        ctx.setLineDash([6, 14]);
        ctx.lineDashOffset = -dashOffset; // Move inwards towards target
        ctx.stroke();
        ctx.restore();
      });

      // 2. Draw Nodes
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x!, n.y!, n.size, 0, Math.PI * 2);

        let fillColor = '#18181b';
        let strokeColor = '#3f3f46';
        let glowColor = 'rgba(0,0,0,0)';

        if (n.type === 'lead') {
          fillColor = '#06060c';
          strokeColor = '#faff69'; // electric yellow
          glowColor = 'rgba(250, 255, 105, 0.4)';
        } else if (n.group === 'positive') {
          fillColor = '#0d1f14'; // dark emerald
          strokeColor = '#10b981';
          glowColor = 'rgba(16, 185, 129, 0.3)';
        } else if (n.group === 'negative') {
          fillColor = '#221013'; // dark rose
          strokeColor = '#ef4444';
          glowColor = 'rgba(239, 68, 68, 0.3)';
        } else {
          fillColor = '#18181b'; // grey neutral
          strokeColor = '#71717a';
          glowColor = 'rgba(113, 113, 122, 0.2)';
        }

        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = n.type === 'lead' ? 3.5 : 2;
        ctx.stroke();

        // Node Label
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${n.type === 'lead' ? '11px' : '9px'} JetBrains Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw multiple lines if text has spaces
        const words = n.label.split(' ');
        if (n.type === 'lead') {
          ctx.fillText(n.label, n.x!, n.y! - 5);
          ctx.fillStyle = '#faff69';
          ctx.font = 'bold 12px JetBrains Mono, monospace';
          ctx.fillText(`${n.score} PTS`, n.x!, n.y! + 9);
        } else {
          // Splitting label into two lines for readability inside circle
          if (words.length > 2) {
            const firstLine = words.slice(0, 2).join(' ');
            const secondLine = words.slice(2).join(' ');
            ctx.fillText(firstLine, n.x!, n.y! - 5);
            ctx.fillText(secondLine, n.x!, n.y! + 5);
          } else {
            ctx.fillText(n.label, n.x!, n.y!);
          }
        }
      });
    };

    animFrameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animFrameId);
  }, [nodes, edges]);

  // Adjust canvas size to parent container
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = 360;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hover popover coordinate mappings
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const hit = nodes.find((n) => {
      const dx = n.x! - cursorX;
      const dy = n.y! - cursorY;
      return Math.sqrt(dx * dx + dy * dy) < n.size;
    });

    if (hit) {
      setHoveredNode(hit);
      setTooltipPos({ x: cursorX + 15, y: cursorY + 15 });
    } else {
      setHoveredNode(null);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full border border-hairline rounded-xl overflow-hidden shadow-xl bg-[#09090b]">
      
      {/* Title HUD */}
      <div className="absolute top-3 left-3 z-10 bg-[#09090b]/80 border border-hairline px-2.5 py-1 rounded text-[9px] font-mono text-zinc-500 select-none">
        Dynamic Contributor Weights (Orbit visualizer)
      </div>

      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredNode(null)}
        className="block w-full"
      />

      {/* Floating Hover Tooltip */}
      {hoveredNode && (
        <div
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
          className="absolute z-20 w-52 bg-surface-card/95 border border-hairline p-3 rounded shadow-2xl pointer-events-none font-mono text-xxs animate-fade-in"
        >
          <p className="font-extrabold text-white text-[10px] mb-1.5">{hoveredNode.label}</p>
          <div className="pt-1.5 border-t border-hairline text-zinc-400 space-y-1">
            {hoveredNode.type === 'lead' ? (
              <p>Combined rating deconstruction representing active CRM touchpoints.</p>
            ) : (
              <>
                <p><span className="text-zinc-500">FACTOR:</span> <span className="text-white capitalize">{hoveredNode.type.replace('-factor', '')}</span></p>
                <p><span className="text-zinc-500">WEIGHT:</span> <span className="text-accent-emerald font-bold">+{hoveredNode.score || hoveredNode.size} points</span></p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
