"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { drawGraph } from "@/app/lib/canvas-renderer";
import { forceLayoutTick } from "@/app/lib/force-layout";
import { findNodeAt } from "@/app/lib/hit-testing";
import type {
  GraphNode,
  GraphEdge,
  InteractionMode,
  EdgeDraft,
} from "@/app/lib/graph-types";

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  interactionMode: InteractionMode;
  onNodeDrag: (nodeId: string, x: number, y: number) => void;
  onNodeSelect: (nodeId: string | null) => void;
  onNodePin: (nodeId: string, pinned: boolean) => void;
  onAddNode: (x: number, y: number) => void;
  onAddEdge: (sourceId: string, targetId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onPositionsUpdate: (nodes: GraphNode[]) => void;
}

export function GraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  interactionMode,
  onNodeDrag,
  onNodeSelect,
  onNodePin,
  onAddNode,
  onAddEdge,
  onDeleteNode,
  onPositionsUpdate,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const draggingRef = useRef<string | null>(null);
  const [edgeDraft, setEdgeDraft] = useState<EdgeDraft | null>(null);

  // Stable refs for animation loop
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const selectedRef = useRef(selectedNodeId);
  const edgeDraftRef = useRef(edgeDraft);
  nodesRef.current = nodes;
  edgesRef.current = edges;
  selectedRef.current = selectedNodeId;
  edgeDraftRef.current = edgeDraft;

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setSize({ w: width, h: Math.min(700, Math.max(450, width * 0.6)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Canvas DPI + render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let frameId: number;
    let tick = 0;
    const loop = () => {
      // Run force layout every 3rd frame to save CPU
      tick++;
      if (tick % 3 === 0 && nodesRef.current.length > 0) {
        const updated = forceLayoutTick(
          nodesRef.current,
          edgesRef.current,
          size.w,
          size.h
        );
        onPositionsUpdate(updated);
      }

      drawGraph(
        ctx,
        nodesRef.current,
        edgesRef.current,
        selectedRef.current,
        edgeDraftRef.current,
        size.w,
        size.h
      );
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [size.w, size.h, onPositionsUpdate]);

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 2) return; // handled by context menu
      const { x, y } = getCanvasCoords(e);
      const hit = findNodeAt(x, y, nodesRef.current);

      if (interactionMode === "select") {
        if (hit) {
          onNodeSelect(hit.id);
          onNodePin(hit.id, true);
          draggingRef.current = hit.id;
        } else {
          onNodeSelect(null);
        }
      } else if (interactionMode === "add-node") {
        if (!hit) onAddNode(x, y);
      } else if (interactionMode === "add-edge") {
        if (hit) {
          setEdgeDraft({ sourceId: hit.id, currentX: x, currentY: y });
        }
      }
    },
    [interactionMode, getCanvasCoords, onNodeSelect, onNodePin, onAddNode]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const { x, y } = getCanvasCoords(e);

      if (draggingRef.current) {
        onNodeDrag(draggingRef.current, x, y);
      }

      if (edgeDraft) {
        setEdgeDraft({ ...edgeDraft, currentX: x, currentY: y });
      }
    },
    [getCanvasCoords, onNodeDrag, edgeDraft]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (draggingRef.current) {
        onNodePin(draggingRef.current, false);
        draggingRef.current = null;
      }

      if (edgeDraft) {
        const { x, y } = getCanvasCoords(e);
        const hit = findNodeAt(x, y, nodesRef.current);
        if (hit && hit.id !== edgeDraft.sourceId) {
          onAddEdge(edgeDraft.sourceId, hit.id);
        }
        setEdgeDraft(null);
      }
    },
    [edgeDraft, getCanvasCoords, onNodePin, onAddEdge]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const { x, y } = getCanvasCoords(e);
      const hit = findNodeAt(x, y, nodesRef.current);
      if (hit) onDeleteNode(hit.id);
    },
    [getCanvasCoords, onDeleteNode]
  );

  const cursor =
    interactionMode === "add-node"
      ? "crosshair"
      : interactionMode === "add-edge"
        ? "cell"
        : draggingRef.current
          ? "grabbing"
          : "default";

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        style={{ width: size.w, height: size.h, cursor }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
}
