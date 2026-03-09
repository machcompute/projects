// Fullscreen triangle vertex shader (shared by step and render)
export const FULLSCREEN_VERT = `#version 300 es
precision highp float;
void main() {
  // 3 vertices covering clip space: (-1,-1), (3,-1), (-1,3)
  vec2 pos = vec2(
    float((gl_VertexID << 1) & 2) * 2.0 - 1.0,
    float(gl_VertexID & 2) * 2.0 - 1.0
  );
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

// LBM step: pull-streaming + collision + boundary conditions (single pass)
export const LBM_STEP_FRAG = `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D u_dist0; // f0, f1, f2, f3
uniform sampler2D u_dist1; // f4, f5, f6, f7
uniform sampler2D u_dist2; // f8, _, _, _
uniform sampler2D u_barriers; // barrier flag in R channel

uniform int u_rows;
uniform int u_cols;
uniform float u_omega;
uniform float u_inletSpeed;

layout(location = 0) out vec4 outDist0;
layout(location = 1) out vec4 outDist1;
layout(location = 2) out vec4 outDist2;

// D2Q9 constants
// Directions: 0=rest, 1=E, 2=N, 3=W, 4=S, 5=NE, 6=NW, 7=SW, 8=SE
// Screen coords: +x=right, +y=down (row index)
const int CX[9] = int[9](0, 1, 0, -1, 0, 1, -1, -1, 1);
const int CY[9] = int[9](0, 0, -1, 0, 1, -1, -1, 1, 1);
const float W[9] = float[9](
  0.444444444, 0.111111111, 0.111111111, 0.111111111, 0.111111111,
  0.027777778, 0.027777778, 0.027777778, 0.027777778
);

float readF(int i, ivec2 pos) {
  if (i < 4) {
    vec4 d = texelFetch(u_dist0, pos, 0);
    if (i == 0) return d.x;
    if (i == 1) return d.y;
    if (i == 2) return d.z;
    return d.w;
  }
  if (i < 8) {
    vec4 d = texelFetch(u_dist1, pos, 0);
    if (i == 4) return d.x;
    if (i == 5) return d.y;
    if (i == 6) return d.z;
    return d.w;
  }
  return texelFetch(u_dist2, pos, 0).x;
}

float feq(float rho, float vx, float vy, int i) {
  float eu = float(CX[i]) * vx + float(CY[i]) * vy;
  float uSq = vx * vx + vy * vy;
  return W[i] * rho * (1.0 + 3.0 * eu + 4.5 * eu * eu - 1.5 * uSq);
}

void main() {
  ivec2 pos = ivec2(gl_FragCoord.xy);
  int col = pos.x;
  int row = pos.y;

  float barrier = texelFetch(u_barriers, pos, 0).r;

  // 1. Pull streaming: pull f[i] from neighbor (pos - c[i])
  float f[9];
  for (int i = 0; i < 9; i++) {
    ivec2 src = pos - ivec2(CX[i], CY[i]);
    if (src.x >= 0 && src.x < u_cols && src.y >= 0 && src.y < u_rows) {
      f[i] = readF(i, src);
    } else {
      f[i] = W[i]; // equilibrium at rest for out-of-bounds
    }
  }

  // 2. Barrier bounce-back: swap opposite pairs
  if (barrier > 0.5) {
    float tmp;
    tmp = f[1]; f[1] = f[3]; f[3] = tmp; // E <-> W
    tmp = f[2]; f[2] = f[4]; f[4] = tmp; // N <-> S
    tmp = f[5]; f[5] = f[7]; f[7] = tmp; // NE <-> SW
    tmp = f[6]; f[6] = f[8]; f[8] = tmp; // NW <-> SE

    outDist0 = vec4(f[0], f[1], f[2], f[3]);
    outDist1 = vec4(f[4], f[5], f[6], f[7]);
    outDist2 = vec4(f[8], 0.0, 0.0, 0.0);
    return;
  }

  // 3. Compute macroscopic
  float rho = 0.0;
  float mx = 0.0, my = 0.0;
  for (int i = 0; i < 9; i++) {
    rho += f[i];
    mx += float(CX[i]) * f[i];
    my += float(CY[i]) * f[i];
  }

  // 4. Density clamping
  if (rho < 0.5 || rho > 2.0 || isinf(rho) || isnan(rho)) {
    outDist0 = vec4(W[0], W[1], W[2], W[3]);
    outDist1 = vec4(W[4], W[5], W[6], W[7]);
    outDist2 = vec4(W[8], 0.0, 0.0, 0.0);
    return;
  }

  float vx = mx / rho;
  float vy = my / rho;

  // 5. Velocity clamping
  float spd = sqrt(vx * vx + vy * vy);
  if (spd > 0.3) {
    float scale = 0.3 / spd;
    vx *= scale;
    vy *= scale;
  }

  // 6. BGK collision
  for (int i = 0; i < 9; i++) {
    f[i] += u_omega * (feq(rho, vx, vy, i) - f[i]);
  }

  // 7. Boundary conditions

  // Zou-He inlet (col == 0)
  if (col == 0 && row > 0 && row < u_rows - 1) {
    // Skip if adjacent cell is a barrier
    float adjBarrier = texelFetch(u_barriers, ivec2(1, row), 0).r;
    if (adjBarrier < 0.5) {
      float u0 = u_inletSpeed;
      float rhoIn = (f[0] + f[2] + f[4] + 2.0 * (f[3] + f[6] + f[7])) / (1.0 - u0);
      f[1] = f[3] + (2.0 / 3.0) * rhoIn * u0;
      f[5] = f[7] + (1.0 / 6.0) * rhoIn * u0 - 0.5 * (f[2] - f[4]);
      f[8] = f[6] + (1.0 / 6.0) * rhoIn * u0 + 0.5 * (f[2] - f[4]);
    }
  }

  // Zero-gradient outlet (col == cols-1): copy from col-1
  if (col == u_cols - 1) {
    ivec2 src = ivec2(col - 1, row);
    for (int i = 0; i < 9; i++) {
      f[i] = readF(i, src);
    }
  }

  // Top wall (row == 0): bounce-back
  if (row == 0) {
    f[4] = f[2]; // S <- N
    f[7] = f[5]; // SW <- NE
    f[8] = f[6]; // SE <- NW
  }

  // Bottom wall (row == rows-1): bounce-back
  if (row == u_rows - 1) {
    f[2] = f[4]; // N <- S
    f[5] = f[7]; // NE <- SW
    f[6] = f[8]; // NW <- SE
  }

  // 8. Pack output
  outDist0 = vec4(f[0], f[1], f[2], f[3]);
  outDist1 = vec4(f[4], f[5], f[6], f[7]);
  outDist2 = vec4(f[8], 0.0, 0.0, 0.0);
}
`;

// Render shader: distribution textures -> color output
export const RENDER_FRAG = `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D u_dist0;
uniform sampler2D u_dist1;
uniform sampler2D u_dist2;
uniform sampler2D u_barriers;

uniform int u_rows;
uniform int u_cols;
uniform int u_visualMode; // 0=speed, 1=curl, 2=density
uniform float u_maxSpeed;
uniform float u_maxCurl;
uniform float u_densityScale;
uniform float u_canvasWidth;
uniform float u_canvasHeight;

out vec4 fragColor;

const int CX[9] = int[9](0, 1, 0, -1, 0, 1, -1, -1, 1);
const int CY[9] = int[9](0, 0, -1, 0, 1, -1, -1, 1, 1);

float readF(int i, ivec2 pos) {
  if (i < 4) {
    vec4 d = texelFetch(u_dist0, pos, 0);
    if (i == 0) return d.x;
    if (i == 1) return d.y;
    if (i == 2) return d.z;
    return d.w;
  }
  if (i < 8) {
    vec4 d = texelFetch(u_dist1, pos, 0);
    if (i == 4) return d.x;
    if (i == 5) return d.y;
    if (i == 6) return d.z;
    return d.w;
  }
  return texelFetch(u_dist2, pos, 0).x;
}

// Compute macroscopic at a given texel
vec3 macroscopic(ivec2 pos) {
  float rho = 0.0, mx = 0.0, my = 0.0;
  for (int i = 0; i < 9; i++) {
    float fi = readF(i, pos);
    rho += fi;
    mx += float(CX[i]) * fi;
    my += float(CY[i]) * fi;
  }
  float vx = rho > 0.0 ? mx / rho : 0.0;
  float vy = rho > 0.0 ? my / rho : 0.0;
  return vec3(rho, vx, vy);
}

// Speed color ramp: blue -> cyan -> green -> yellow -> red
vec3 speedColor(float t) {
  t = clamp(t, 0.0, 1.0);
  if (t < 0.25) {
    float s = t / 0.25;
    return vec3(0.0, s, 1.0);
  } else if (t < 0.5) {
    float s = (t - 0.25) / 0.25;
    return vec3(0.0, 1.0, 1.0 - s);
  } else if (t < 0.75) {
    float s = (t - 0.5) / 0.25;
    return vec3(s, 1.0, 0.0);
  } else {
    float s = (t - 0.75) / 0.25;
    return vec3(1.0, 1.0 - s, 0.0);
  }
}

// Curl/density color ramp: blue -> white -> red
vec3 divergingColor(float t) {
  t = clamp(t, 0.0, 1.0);
  if (t < 0.5) {
    float s = t / 0.5;
    return vec3(s, s, 1.0);
  } else {
    float s = (t - 0.5) / 0.5;
    return vec3(1.0, 1.0 - s, 1.0 - s);
  }
}

void main() {
  // Map canvas pixel to grid texel (nearest-neighbor upscaling)
  int gridCol = int(gl_FragCoord.x * float(u_cols) / u_canvasWidth);
  // Y-flip: WebGL y=0 is bottom, but row 0 is top of screen
  int gridRow = u_rows - 1 - int(gl_FragCoord.y * float(u_rows) / u_canvasHeight);
  gridCol = clamp(gridCol, 0, u_cols - 1);
  gridRow = clamp(gridRow, 0, u_rows - 1);
  ivec2 pos = ivec2(gridCol, gridRow);

  // Barrier check
  float barrier = texelFetch(u_barriers, pos, 0).r;
  if (barrier > 0.5) {
    fragColor = vec4(0.180, 0.157, 0.165, 1.0); // #2E282A
    return;
  }

  vec3 macro = macroscopic(pos);
  float rho = macro.x;
  float vx = macro.y;
  float vy = macro.z;

  vec3 color;

  if (u_visualMode == 0) {
    // Speed
    float spd = sqrt(vx * vx + vy * vy);
    float speedScale = max(u_maxSpeed * 1.5, 0.001);
    float t = clamp(spd / speedScale, 0.0, 1.0);
    color = speedColor(t);
  } else if (u_visualMode == 1) {
    // Curl (vorticity): duy/dx - dux/dy via central differences
    float curl = 0.0;
    if (gridCol > 0 && gridCol < u_cols - 1 && gridRow > 0 && gridRow < u_rows - 1) {
      vec3 macR = macroscopic(ivec2(gridCol + 1, gridRow));
      vec3 macL = macroscopic(ivec2(gridCol - 1, gridRow));
      vec3 macD = macroscopic(ivec2(gridCol, gridRow + 1));
      vec3 macU = macroscopic(ivec2(gridCol, gridRow - 1));
      float duy_dx = (macR.z - macL.z) * 0.5;
      float dux_dy = (macD.y - macU.y) * 0.5;
      curl = duy_dx - dux_dy;
    }
    float curlScale = max(u_maxCurl, 0.001);
    float t = clamp((curl / curlScale + 1.0) * 0.5, 0.0, 1.0);
    color = divergingColor(t);
  } else {
    // Density: fixed range ±0.1 around 1.0
    float t = clamp((rho - 1.0) / 0.2 + 0.5, 0.0, 1.0);
    color = divergingColor(t);
  }

  fragColor = vec4(color, 1.0);
}
`;
