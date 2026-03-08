"use client";

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { GpuLbmEngine } from "@/app/lib/lattice-boltzmann/gpu/engine";
import type { LBMGrid, VisualMode } from "@/app/lib/lattice-boltzmann/types";

interface WebGLCanvasProps {
  engine: GpuLbmEngine | null;
  grid: LBMGrid; // for rows/cols in mouse coordinate mapping
  visualMode: VisualMode;
  maxSpeed: number;
  maxCurl: number;
  densityScale: number;
  onBarrierPaint: (row: number, col: number, solid: boolean) => void;
}

export interface WebGLCanvasHandle {
  canvas: HTMLCanvasElement | null;
}

const visualModeMap: Record<VisualMode, number> = {
  speed: 0,
  curl: 1,
  density: 2,
};

export const WebGLCanvas = forwardRef<WebGLCanvasHandle, WebGLCanvasProps>(
  function WebGLCanvas(
    { engine, grid, visualMode, maxSpeed, maxCurl, densityScale, onBarrierPaint },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [size, setSize] = useState({ w: 800, h: 320 });
    const paintingRef = useRef<boolean | null>(null);

    // Refs for render loop
    const engineRef = useRef(engine);
    const visualModeRef = useRef(visualMode);
    const maxSpeedRef = useRef(maxSpeed);
    const maxCurlRef = useRef(maxCurl);
    const densityScaleRef = useRef(densityScale);
    const gridRef = useRef(grid);
    engineRef.current = engine;
    visualModeRef.current = visualMode;
    maxSpeedRef.current = maxSpeed;
    maxCurlRef.current = maxCurl;
    densityScaleRef.current = densityScale;
    gridRef.current = grid;

    // Expose canvas element to parent
    useImperativeHandle(ref, () => ({
      get canvas() {
        return canvasRef.current;
      },
    }));

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

    // Render loop
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(size.w * dpr);
      canvas.height = Math.round(size.h * dpr);

      let frameId: number;
      const loop = () => {
        const eng = engineRef.current;
        if (eng) {
          eng.render(
            visualModeMap[visualModeRef.current],
            maxSpeedRef.current,
            maxCurlRef.current,
            densityScaleRef.current,
            canvas.width,
            canvas.height,
          );
        }
        frameId = requestAnimationFrame(loop);
      };
      frameId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(frameId);
    }, [size.w, size.h]);

    // Mouse → cell coordinate mapping
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
        const solid = e.button !== 2;
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
  },
);
