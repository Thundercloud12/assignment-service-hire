import React, { useRef, useEffect, useState } from 'react';
import { type IGraphNode, type IGraphEdge, type INetworkGraphData } from '../services/graph.service';

interface NetworkGraphProps {
  data: INetworkGraphData;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Graph state clones
  const [nodes, setNodes] = useState<IGraphNode[]>([]);
  const [edges, setEdges] = useState<IGraphEdge[]>([]);

  // Simulation parameters
  const kRepulsion = 1200;
  const kGravity = 0.015;
  const friction = 0.85;

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Dragging nodes state
  const draggedNode = useRef<IGraphNode | null>(null);

  // Hover state
  const [hoveredNode, setHoveredNode] = useState<IGraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Initialize nodes and position them in a circle
  useEffect(() => {
    if (!data || !data.nodes) return;

    const width = 800;
    const height = 500;

    // Clone data to avoid mutating props
    const clonedNodes: IGraphNode[] = data.nodes.map((n, i) => {
      const angle = (i / data.nodes.length) * Math.PI * 2;
      const radius = 100 + Math.random() * 80;
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
    });

    const clonedEdges: IGraphEdge[] = data.edges.map((e) => ({ ...e }));

    setNodes(clonedNodes);
    setEdges(clonedEdges);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [data]);

  // Main simulation loops
  useEffect(() => {
    if (nodes.length === 0) return;

    let animFrameId: number;
    const width = canvasRef.current?.width || 800;
    const height = canvasRef.current?.height || 500;
    const centerX = width / 2;
    const centerY = height / 2;

    const tick = () => {
      // 1. Force calculations
      // Repulsion (Push nodes apart)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x! - n1.x!;
          const dy = n2.y! - n1.y!;
          const distSq = dx * dx + dy * dy + 0.1;
          const dist = Math.sqrt(distSq);

          if (dist < 320) {
            const force = (kRepulsion / distSq) * (1 - dist / 320);
            const fx = dx * force;
            const fy = dy * force;

            n1.vx = (n1.vx || 0) - fx;
            n1.vy = (n1.vy || 0) - fy;
            n2.vx = (n2.vx || 0) + fx;
            n2.vy = (n2.vy || 0) + fy;
          }
        }
      }

      // Link Attraction (Pull connected nodes together)
      edges.forEach((edge) => {
        const sNode = nodes.find((n) => n.id === edge.from);
        const tNode = nodes.find((n) => n.id === edge.to);

        if (sNode && tNode) {
          const dx = tNode.x! - sNode.x!;
          const dy = tNode.y! - sNode.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
          const restLength = sNode.type === 'company' || tNode.type === 'company' ? 90 : 130;
          const kAttraction = 0.04 * edge.weight;

          const force = (dist - restLength) * kAttraction;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          sNode.vx = (sNode.vx || 0) + fx;
          sNode.vy = (sNode.vy || 0) + fy;
          tNode.vx = (tNode.vx || 0) - fx;
          tNode.vy = (tNode.vy || 0) - fy;
        }
      });

      // Gravity/Center pull
      nodes.forEach((n) => {
        const dx = centerX - n.x!;
        const dy = centerY - n.y!;
        n.vx = (n.vx || 0) + dx * kGravity;
        n.vy = (n.vy || 0) + dy * kGravity;
      });

      // Update positions
      nodes.forEach((n) => {
        if (n.fx !== undefined) {
          n.x = n.fx;
          n.y = n.fy;
          n.vx = 0;
          n.vy = 0;
        } else {
          n.vx = (n.vx || 0) * friction;
          n.vy = (n.vy || 0) * friction;
          n.x = (n.x || 0) + n.vx;
          n.y = (n.y || 0) + n.vy;
        }
      });

      // 2. Render Loop
      render();

      animFrameId = requestAnimationFrame(tick);
    };

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear with deep space canvas background
      ctx.fillStyle = '#06060c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Apply panning and zooming
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw Edges/Links first
      edges.forEach((edge) => {
        const sNode = nodes.find((n) => n.id === edge.from);
        const tNode = nodes.find((n) => n.id === edge.to);
        if (!sNode || !tNode) return;

        ctx.beginPath();
        ctx.moveTo(sNode.x!, sNode.y!);
        ctx.lineTo(tNode.x!, tNode.y!);

        // Edge style based on label/type
        if (edge.label === 'referred by') {
          ctx.strokeStyle = 'rgba(250, 255, 105, 0.25)'; // neon yellow
          ctx.lineWidth = 2.5;
          ctx.setLineDash([5, 5]);
        } else if (edge.label === 'works at') {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)'; // cyan
          ctx.lineWidth = 1.8;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = 'rgba(113, 113, 122, 0.15)'; // grey
          ctx.lineWidth = 1.2;
          ctx.setLineDash([]);
        }

        ctx.stroke();
        ctx.setLineDash([]); // Reset
      });

      // Draw Nodes
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x!, n.y!, n.size, 0, Math.PI * 2);

        // Styling based on Node Type and Group
        let nodeColor = '#71717a';
        let strokeColor = '#3f3f46';
        let glowColor = 'rgba(0,0,0,0)';

        if (n.type === 'lead') {
          switch (n.group) {
            case 'qualified':
              nodeColor = '#10b981'; // emerald
              strokeColor = '#34d399';
              glowColor = 'rgba(16, 185, 129, 0.45)';
              break;
            case 'contacted':
              nodeColor = '#a855f7'; // purple
              strokeColor = '#c084fc';
              glowColor = 'rgba(168, 85, 247, 0.45)';
              break;
            case 'lost':
              nodeColor = '#ef4444'; // rose red
              strokeColor = '#f87171';
              glowColor = 'rgba(239, 68, 68, 0.4)';
              break;
            case 'new':
            default:
              nodeColor = '#38bdf8'; // blue/cyan
              strokeColor = '#7dd3fc';
              glowColor = 'rgba(56, 189, 248, 0.45)';
              break;
          }
        } else if (n.type === 'company') {
          nodeColor = '#18181b'; // dark card
          strokeColor = '#ffffff'; // white border
          glowColor = 'rgba(255, 255, 255, 0.2)';
        } else if (n.type === 'source') {
          nodeColor = '#09090b';
          strokeColor = '#faff69'; // clickhouse yellow
          glowColor = 'rgba(250, 255, 105, 0.25)';
        } else if (n.type === 'referrer') {
          nodeColor = '#faff69';
          strokeColor = '#ffffff';
          glowColor = 'rgba(250, 255, 105, 0.35)';
        }

        // Apply neon glow effects
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 12;
        ctx.fillStyle = nodeColor;
        ctx.fill();

        ctx.shadowBlur = 0; // Reset shadow for stroke
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node text label
        ctx.fillStyle = n.type === 'referrer' ? '#0d0d12' : '#ffffff';
        ctx.font = `bold ${n.type === 'company' ? '11px' : '9px'} JetBrains Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Truncate long labels
        let label = n.label;
        if (label.length > 12) {
          label = label.slice(0, 10) + '..';
        }
        ctx.fillText(label, n.x!, n.y!);

        // Draw small score badge for lead nodes
        if (n.type === 'lead' && n.score !== undefined) {
          ctx.fillStyle = '#06060c';
          ctx.beginPath();
          ctx.arc(n.x! + n.size - 4, n.y! - n.size + 4, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = strokeColor;
          ctx.font = '7px JetBrains Mono, monospace';
          ctx.fillText(String(n.score), n.x! + n.size - 4, n.y! - n.size + 4);
        }
      });

      ctx.restore();
    };

    // Trigger simulation tick
    animFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [nodes, edges, zoom, pan]);

  // Adjust canvas size to parent container
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = 500;
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Convert client cursor coordinate to canvas grid space (taking zoom & pan into account)
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  // Mouse Listeners
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    // 1. Check if user clicked a node to drag
    const clickedNode = nodes.find((n) => {
      const dx = n.x! - coords.x;
      const dy = n.y! - coords.y;
      return Math.sqrt(dx * dx + dy * dy) < n.size;
    });

    if (clickedNode) {
      draggedNode.current = clickedNode;
      clickedNode.fx = clickedNode.x;
      clickedNode.fy = clickedNode.y;
    } else {
      // 2. Start panning empty canvas space
      setIsPanning(true);
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    // 1. Node dragging update
    if (draggedNode.current) {
      const node = draggedNode.current;
      node.fx = coords.x;
      node.fy = coords.y;
      
      // Update nodes state to trigger re-paint
      setNodes([...nodes]);
      return;
    }

    // 2. Canvas panning update
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      });
      return;
    }

    // 3. Hover Tooltip checks
    const targetNode = nodes.find((n) => {
      const dx = n.x! - coords.x;
      const dy = n.y! - coords.y;
      return Math.sqrt(dx * dx + dy * dy) < n.size;
    });

    if (targetNode) {
      setHoveredNode(targetNode);
      // Position tooltip at client coordinates
      const rect = canvasRef.current!.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top + 15,
      });
    } else {
      setHoveredNode(null);
    }
  };

  const handleMouseUp = () => {
    if (draggedNode.current) {
      draggedNode.current.fx = undefined;
      draggedNode.current.fy = undefined;
      draggedNode.current = null;
    }
    setIsPanning(false);
  };

  // Scroll to Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = 1.05;
    let newZoom = zoom;

    if (e.deltaY < 0) {
      newZoom = Math.min(zoom * zoomFactor, 3);
    } else {
      newZoom = Math.max(zoom / zoomFactor, 0.4);
    }

    setZoom(newZoom);
  };

  const getGroupColorBadge = (group: string) => {
    switch (group) {
      case 'qualified':
        return 'text-accent-emerald bg-accent-emerald/10 border-accent-emerald/20';
      case 'contacted':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'lost':
        return 'text-accent-rose bg-accent-rose/10 border-accent-rose/20';
      case 'company':
        return 'text-white bg-zinc-800 border-zinc-700';
      case 'source':
      case 'referrer':
        return 'text-primary bg-primary/10 border-primary/20';
      case 'new':
      default:
        return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
    }
  };

  return (
    <div ref={containerRef} className="relative w-full border border-hairline rounded-xl overflow-hidden shadow-2xl bg-[#06060c]">
      
      {/* HUD Info bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-[#06060c]/80 backdrop-blur-md border border-hairline px-3 py-2 rounded-lg text-[10px] font-mono text-zinc-400 select-none">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> New</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Contacted</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Qualified</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Lost</span>
        <span className="text-zinc-600">|</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border border-white"></span> Account</span>
        <span className="text-zinc-600">|</span>
        <span>Scroll: Zoom ({Math.round(zoom * 100)}%)</span>
        <span>Drag canvas to Pan</span>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="block cursor-grab active:cursor-grabbing w-full"
      />

      {/* Hover Tooltip Box */}
      {hoveredNode && (
        <div
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
          className="absolute z-20 w-56 bg-surface-card/95 backdrop-blur-md border border-hairline p-3.5 rounded-lg shadow-2xl pointer-events-none font-mono text-xxs animate-fade-in"
        >
          <div className="flex justify-between items-start mb-2 gap-2">
            <p className="font-extrabold text-white text-[11px] truncate">{hoveredNode.label}</p>
            <span className={`px-1.5 py-0.5 border rounded uppercase text-[8px] font-extrabold tracking-wider ${getGroupColorBadge(hoveredNode.group)}`}>
              {hoveredNode.type}
            </span>
          </div>

          <div className="space-y-1.5 text-zinc-400 pt-1.5 border-t border-hairline">
            {hoveredNode.type === 'lead' && (
              <>
                <p><span className="text-zinc-500">EMAIL:</span> <span className="text-zinc-300 font-bold">{hoveredNode.email}</span></p>
                {hoveredNode.phone && hoveredNode.phone !== 'None' && (
                  <p><span className="text-zinc-500">PHONE:</span> <span className="text-zinc-300 font-bold">{hoveredNode.phone}</span></p>
                )}
                <div className="flex justify-between items-center bg-canvas p-1.5 rounded mt-2 border border-hairline">
                  <span className="text-primary font-bold">LEAD RATING:</span>
                  <span className="text-primary-active font-extrabold text-xs shadow-glow">{hoveredNode.score}/100</span>
                </div>
              </>
            )}
            {hoveredNode.type === 'company' && (
              <p className="text-zinc-300">Shared company domain mapping associated leads.</p>
            )}
            {hoveredNode.type === 'source' && (
              <p className="text-zinc-300">Acquisition marketing channel.</p>
            )}
            {hoveredNode.type === 'referrer' && (
              <p className="text-zinc-300">Referral advocate driving outbound growth.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
