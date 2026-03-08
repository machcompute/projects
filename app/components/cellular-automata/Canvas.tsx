"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { drawGrid } from "@/app/lib/cellular-automata/renderer";
import type { CAGrid, CellCoord } from "@/app/lib/cellular-automata/types";

interface CanvasProps {
  grid: CAGrid;
  hoverCell: CellCoord | null;
  onCellPaint: (row: number, col: number, value: 0 | 1) => void;
  onHoverChange: (cell: CellCoord | null) => void;
}

export function Canvas({
  grid,
  hoverCell,
  onCellPaint,
  onHoverChange,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const paintValueRef = useRef<0 | 1 | null>(null);

  const gridRef = useRef(grid);
  const hoverRef = useRef(hoverCell);
  gridRef.current = grid;
  hoverRef.current = hoverCell;

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      const h = Math.min(700, Math.max(450, width * 0.6));
      setSize({ w: width, h });
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
    const loop = () => {
      drawGrid(ctx, gridRef.current, hoverRef.current, size.w, size.h);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [size.w, size.h]);

  const getCellCoord = useCallback(
    (e: React.MouseEvent): CellCoord | null => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const g = gridRef.current;
      const col = Math.floor(x / (size.w / g.cols));
      const row = Math.floor(y / (size.h / g.rows));
      if (row < 0 || row >= g.rows || col < 0 || col >= g.cols) return null;
      return { row, col };
    },
    [size.w, size.h]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 2) return;
      const cell = getCellCoord(e);
      if (!cell) return;
      const g = gridRef.current;
      const idx = cell.row * g.cols + cell.col;
      const newValue: 0 | 1 = g.cells[idx] === 1 ? 0 : 1;
      paintValueRef.current = newValue;
      onCellPaint(cell.row, cell.col, newValue);
    },
    [getCellCoord, onCellPaint]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const cell = getCellCoord(e);
      onHoverChange(cell);
      if (paintValueRef.current !== null && cell) {
        onCellPaint(cell.row, cell.col, paintValueRef.current);
      }
    },
    [getCellCoord, onHoverChange, onCellPaint]
  );

  const handleMouseUp = useCallback(() => {
    paintValueRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    paintValueRef.current = null;
    onHoverChange(null);
  }, [onHoverChange]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const cell = getCellCoord(e);
      if (cell) onCellPaint(cell.row, cell.col, 0);
    },
    [getCellCoord, onCellPaint]
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
