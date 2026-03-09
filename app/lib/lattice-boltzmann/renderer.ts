import type { LBMGrid, VisualMode } from "./types";
import { computeCurl } from "./lbm";

// Precomputed color ramp: 256 entries, each [r, g, b]
const speedRamp = buildSpeedRamp();
const curlRamp = buildCurlRamp();
const densityRamp = buildDensityRamp();

// Speed: blue → cyan → green → yellow → red
function buildSpeedRamp(): Uint8Array {
  const ramp = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let r: number, g: number, b: number;
    if (t < 0.25) {
      const s = t / 0.25;
      r = 0; g = Math.round(s * 255); b = 255;
    } else if (t < 0.5) {
      const s = (t - 0.25) / 0.25;
      r = 0; g = 255; b = Math.round((1 - s) * 255);
    } else if (t < 0.75) {
      const s = (t - 0.5) / 0.25;
      r = Math.round(s * 255); g = 255; b = 0;
    } else {
      const s = (t - 0.75) / 0.25;
      r = 255; g = Math.round((1 - s) * 255); b = 0;
    }
    ramp[i * 3] = r;
    ramp[i * 3 + 1] = g;
    ramp[i * 3 + 2] = b;
  }
  return ramp;
}

// Curl: blue (negative) → white (zero) → red (positive)
function buildCurlRamp(): Uint8Array {
  const ramp = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255; // 0 = most negative, 0.5 = zero, 1 = most positive
    let r: number, g: number, b: number;
    if (t < 0.5) {
      const s = t / 0.5; // 0→1
      r = Math.round(s * 255);
      g = Math.round(s * 255);
      b = 255;
    } else {
      const s = (t - 0.5) / 0.5; // 0→1
      r = 255;
      g = Math.round((1 - s) * 255);
      b = Math.round((1 - s) * 255);
    }
    ramp[i * 3] = r;
    ramp[i * 3 + 1] = g;
    ramp[i * 3 + 2] = b;
  }
  return ramp;
}

// Density: blue (low) → white (1.0) → red (high)
function buildDensityRamp(): Uint8Array {
  // Same as curl ramp visually
  return buildCurlRamp();
}

const BARRIER_R = 0x2e;
const BARRIER_G = 0x28;
const BARRIER_B = 0x2a;

export function drawLBM(
  ctx: CanvasRenderingContext2D,
  grid: LBMGrid,
  visualMode: VisualMode,
  maxSpeed: number,
  w: number,
  h: number,
): void {
  const { rows, cols, barriers, ux, uy, density } = grid;

  // Create offscreen canvas at grid resolution
  const offscreen = new OffscreenCanvas(cols, rows);
  const offCtx = offscreen.getContext("2d")!;
  const imageData = offCtx.createImageData(cols, rows);
  const data = imageData.data;

  let curl: Float64Array | null = null;
  let maxCurl = 0.001;

  if (visualMode === "curl") {
    curl = computeCurl(grid);
    for (let idx = 0; idx < rows * cols; idx++) {
      const abs = Math.abs(curl[idx]);
      if (abs > maxCurl) maxCurl = abs;
    }
  }

  // Fixed density range: ±0.1 around 1.0  →  [0.9, 1.1]
  const densityScale = 0.1;

  // Use 1.5x max speed for normalization so the peak isn't at the ramp ceiling
  const speedScale = Math.max(maxSpeed * 1.5, 0.001);

  for (let idx = 0; idx < rows * cols; idx++) {
    const px = idx * 4;

    if (barriers[idx]) {
      data[px] = BARRIER_R;
      data[px + 1] = BARRIER_G;
      data[px + 2] = BARRIER_B;
      data[px + 3] = 255;
      continue;
    }

    let t: number;
    let ramp: Uint8Array;

    switch (visualMode) {
      case "speed": {
        const spd = Math.sqrt(ux[idx] * ux[idx] + uy[idx] * uy[idx]);
        t = Math.min(spd / speedScale, 1);
        ramp = speedRamp;
        break;
      }
      case "curl": {
        const c = curl![idx];
        t = (c / maxCurl + 1) * 0.5; // map [-maxCurl, maxCurl] → [0, 1]
        t = Math.max(0, Math.min(1, t));
        ramp = curlRamp;
        break;
      }
      case "density": {
        // Map density around 1.0 with adaptive range
        t = (density[idx] - 1.0) / (2 * densityScale) + 0.5;
        t = Math.max(0, Math.min(1, t));
        ramp = densityRamp;
        break;
      }
    }

    const ci = Math.round(t * 255);
    data[px] = ramp[ci * 3];
    data[px + 1] = ramp[ci * 3 + 1];
    data[px + 2] = ramp[ci * 3 + 2];
    data[px + 3] = 255;
  }

  offCtx.putImageData(imageData, 0, 0);

  // Scale up to canvas size
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(offscreen, 0, 0, w, h);
}
