"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { drawLBM } from "@/app/lib/lattice-boltzmann/renderer";
import type { LBMGrid, VisualMode } from "@/app/lib/lattice-boltzmann/types";

interface CanvasProps {
  grid: LBMGrid;
  visualMode: VisualMode;
  maxSpeed: number;
  onBarrierPaint: (row: number, col: number, solid: boolean) => void;
}

export function Canvas({
  grid,
  visualMode,
  maxSpeed,
  onBarrierPaint,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 800, h: 320 });
  const paintingRef = useRef<boolean | null>(null); // true = add barrier, false = erase, null = not painting

  const gridRef = useRef(grid);
  const visualModeRef = useRef(visualMode);
  const maxSpeedRef = useRef(maxSpeed);
  gridRef.current = grid;
  visualModeRef.current = visualMode;
  maxSpeedRef.current = maxSpeed;

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      const g = gridRef.current;
      const h = Math.min(700, Math.max(200, width * (g.rows / g.cols)));
      setSize({ w: width, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let frameId: number;
    const loop = () => {
      drawLBM(
        ctx,
        gridRef.current,
        visualModeRef.current,
        maxSpeedRef.current,
        size.w,
        size.h,
      );
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [size.w, size.h]);

  const getCellCoord = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const g = gridRef.current;
      const col = Math.floor(x / (size.w / g.cols));
      const row = Math.floor(y / (size.h / g.rows));
      if (row < 0 || row >= g.rows || col < 0 || col >= g.cols) return null;
      return { row, col };
    },
    [size.w, size.h],
  );

  // Paint a small brush (radius 2) around the target cell
  const paintBrush = useCallback(
    (row: number, col: number, solid: boolean) => {
      const g = gridRef.current;
      const r = 2;
      for (let dr = -r; dr <= r; dr++) {
        for (let dc = -r; dc <= r; dc++) {
          if (dr * dr + dc * dc > r * r) continue;
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < g.rows && nc >= 0 && nc < g.cols) {
            onBarrierPaint(nr, nc, solid);
          }
        }
      }
    },
    [onBarrierPaint],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const cell = getCellCoord(e);
      if (!cell) return;
      const solid = e.button !== 2; // left = add, right = erase
      paintingRef.current = solid;
      paintBrush(cell.row, cell.col, solid);
    },
    [getCellCoord, paintBrush],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (paintingRef.current === null) return;
      const cell = getCellCoord(e);
      if (cell) {
        paintBrush(cell.row, cell.col, paintingRef.current);
      }
    },
    [getCellCoord, paintBrush],
  );

  const handleMouseUp = useCallback(() => {
    paintingRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    paintingRef.current = null;
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const cell = getCellCoord(e);
      if (cell) {
        paintingRef.current = false;
        paintBrush(cell.row, cell.col, false);
      }
    },
    [getCellCoord, paintBrush],
  );

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        style={{ width: size.w, height: size.h, cursor: "crosshair" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
}
