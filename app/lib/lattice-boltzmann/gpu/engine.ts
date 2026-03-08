import type { LBMGrid } from "../types";
import { computeMacroscopic } from "../lbm";
import { FULLSCREEN_VERT, LBM_STEP_FRAG, RENDER_FRAG } from "./shaders";

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error:\n${log}`);
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertSrc: string,
  fragSrc: string,
): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(`Program link error:\n${log}`);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return prog;
}

function createFloat32Texture(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  data: Float32Array | null,
): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA32F,
    width,
    height,
    0,
    gl.RGBA,
    gl.FLOAT,
    data,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

function createR8Texture(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  data: Uint8Array | null,
): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.R8,
    width,
    height,
    0,
    gl.RED,
    gl.UNSIGNED_BYTE,
    data,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

export function checkWebGL2Support(): {
  supported: boolean;
  reason?: string;
} {
  if (typeof document === "undefined") {
    return { supported: false, reason: "No document (SSR)" };
  }
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    return { supported: false, reason: "WebGL2 not available" };
  }
  const ext = gl.getExtension("EXT_color_buffer_float");
  if (!ext) {
    return {
      supported: false,
      reason: "EXT_color_buffer_float not available",
    };
  }
  const loseCtx = gl.getExtension("WEBGL_lose_context");
  if (loseCtx) loseCtx.loseContext();
  return { supported: true };
}

interface StepUniforms {
  dist0: WebGLUniformLocation;
  dist1: WebGLUniformLocation;
  dist2: WebGLUniformLocation;
  barriers: WebGLUniformLocation;
  rows: WebGLUniformLocation;
  cols: WebGLUniformLocation;
  omega: WebGLUniformLocation;
  inletSpeed: WebGLUniformLocation;
}

interface RenderUniforms {
  dist0: WebGLUniformLocation;
  dist1: WebGLUniformLocation;
  dist2: WebGLUniformLocation;
  barriers: WebGLUniformLocation;
  rows: WebGLUniformLocation;
  cols: WebGLUniformLocation;
  visualMode: WebGLUniformLocation;
  maxSpeed: WebGLUniformLocation;
  maxCurl: WebGLUniformLocation;
  densityScale: WebGLUniformLocation;
  canvasWidth: WebGLUniformLocation;
  canvasHeight: WebGLUniformLocation;
}

export class GpuLbmEngine {
  private gl: WebGL2RenderingContext;
  private rows: number;
  private cols: number;

  private stepProgram: WebGLProgram;
  private renderProgram: WebGLProgram;

  // Ping-pong: [setA, setB], each has [dist0, dist1, dist2]
  private distTextures: [WebGLTexture[], WebGLTexture[]];
  private distFramebuffers: [WebGLFramebuffer, WebGLFramebuffer];
  private pingPong: 0 | 1 = 0;

  private barrierTexture: WebGLTexture;
  private emptyVAO: WebGLVertexArrayObject;

  private stepUniforms: StepUniforms;
  private renderUniforms: RenderUniforms;

  constructor(gl: WebGL2RenderingContext, rows: number, cols: number) {
    this.gl = gl;
    this.rows = rows;
    this.cols = cols;

    gl.getExtension("EXT_color_buffer_float");

    // Compile programs
    this.stepProgram = createProgram(gl, FULLSCREEN_VERT, LBM_STEP_FRAG);
    this.renderProgram = createProgram(gl, FULLSCREEN_VERT, RENDER_FRAG);

    // Cache uniform locations
    this.stepUniforms = {
      dist0: gl.getUniformLocation(this.stepProgram, "u_dist0")!,
      dist1: gl.getUniformLocation(this.stepProgram, "u_dist1")!,
      dist2: gl.getUniformLocation(this.stepProgram, "u_dist2")!,
      barriers: gl.getUniformLocation(this.stepProgram, "u_barriers")!,
      rows: gl.getUniformLocation(this.stepProgram, "u_rows")!,
      cols: gl.getUniformLocation(this.stepProgram, "u_cols")!,
      omega: gl.getUniformLocation(this.stepProgram, "u_omega")!,
      inletSpeed: gl.getUniformLocation(this.stepProgram, "u_inletSpeed")!,
    };

    this.renderUniforms = {
      dist0: gl.getUniformLocation(this.renderProgram, "u_dist0")!,
      dist1: gl.getUniformLocation(this.renderProgram, "u_dist1")!,
      dist2: gl.getUniformLocation(this.renderProgram, "u_dist2")!,
      barriers: gl.getUniformLocation(this.renderProgram, "u_barriers")!,
      rows: gl.getUniformLocation(this.renderProgram, "u_rows")!,
      cols: gl.getUniformLocation(this.renderProgram, "u_cols")!,
      visualMode: gl.getUniformLocation(this.renderProgram, "u_visualMode")!,
      maxSpeed: gl.getUniformLocation(this.renderProgram, "u_maxSpeed")!,
      maxCurl: gl.getUniformLocation(this.renderProgram, "u_maxCurl")!,
      densityScale: gl.getUniformLocation(
        this.renderProgram,
        "u_densityScale",
      )!,
      canvasWidth: gl.getUniformLocation(this.renderProgram, "u_canvasWidth")!,
      canvasHeight: gl.getUniformLocation(
        this.renderProgram,
        "u_canvasHeight",
      )!,
    };

    // Empty VAO for fullscreen triangle
    this.emptyVAO = gl.createVertexArray()!;

    // Create textures and framebuffers
    this.distTextures = [
      [
        createFloat32Texture(gl, cols, rows, null),
        createFloat32Texture(gl, cols, rows, null),
        createFloat32Texture(gl, cols, rows, null),
      ],
      [
        createFloat32Texture(gl, cols, rows, null),
        createFloat32Texture(gl, cols, rows, null),
        createFloat32Texture(gl, cols, rows, null),
      ],
    ];

    this.barrierTexture = createR8Texture(
      gl,
      cols,
      rows,
      new Uint8Array(cols * rows),
    );

    // Create framebuffers with MRT
    this.distFramebuffers = [
      this.createMRTFramebuffer(this.distTextures[0]),
      this.createMRTFramebuffer(this.distTextures[1]),
    ];
  }

  private createMRTFramebuffer(textures: WebGLTexture[]): WebGLFramebuffer {
    const gl = this.gl;
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    for (let i = 0; i < 3; i++) {
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0 + i,
        gl.TEXTURE_2D,
        textures[i],
        0,
      );
    }
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Framebuffer incomplete: ${status}`);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return fb;
  }

  step(count: number, viscosity: number, inletSpeed: number): void {
    const gl = this.gl;
    const omega = 1 / (3 * viscosity + 0.5);

    gl.useProgram(this.stepProgram);
    gl.viewport(0, 0, this.cols, this.rows);
    gl.bindVertexArray(this.emptyVAO);

    // Set constant uniforms
    gl.uniform1i(this.stepUniforms.rows, this.rows);
    gl.uniform1i(this.stepUniforms.cols, this.cols);
    gl.uniform1f(this.stepUniforms.omega, omega);
    gl.uniform1f(this.stepUniforms.inletSpeed, inletSpeed);

    // Texture unit assignments (constant)
    gl.uniform1i(this.stepUniforms.dist0, 0);
    gl.uniform1i(this.stepUniforms.dist1, 1);
    gl.uniform1i(this.stepUniforms.dist2, 2);
    gl.uniform1i(this.stepUniforms.barriers, 3);

    // Bind barrier texture (doesn't change between steps)
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.barrierTexture);

    for (let i = 0; i < count; i++) {
      const readIdx = this.pingPong;
      const writeIdx = (1 - readIdx) as 0 | 1;

      // Bind read textures
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.distTextures[readIdx][0]);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.distTextures[readIdx][1]);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.distTextures[readIdx][2]);

      // Bind write framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.distFramebuffers[writeIdx]);
      gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2,
      ]);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      this.pingPong = writeIdx;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  render(
    visualMode: number,
    maxSpeed: number,
    maxCurl: number,
    densityScale: number,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    const gl = this.gl;

    gl.useProgram(this.renderProgram);
    gl.viewport(0, 0, canvasWidth, canvasHeight);
    gl.bindVertexArray(this.emptyVAO);

    // Bind current distribution textures
    const readIdx = this.pingPong;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.distTextures[readIdx][0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.distTextures[readIdx][1]);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.distTextures[readIdx][2]);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.barrierTexture);

    // Set uniforms
    gl.uniform1i(this.renderUniforms.dist0, 0);
    gl.uniform1i(this.renderUniforms.dist1, 1);
    gl.uniform1i(this.renderUniforms.dist2, 2);
    gl.uniform1i(this.renderUniforms.barriers, 3);
    gl.uniform1i(this.renderUniforms.rows, this.rows);
    gl.uniform1i(this.renderUniforms.cols, this.cols);
    gl.uniform1i(this.renderUniforms.visualMode, visualMode);
    gl.uniform1f(this.renderUniforms.maxSpeed, maxSpeed);
    gl.uniform1f(this.renderUniforms.maxCurl, maxCurl);
    gl.uniform1f(this.renderUniforms.densityScale, densityScale);
    gl.uniform1f(this.renderUniforms.canvasWidth, canvasWidth);
    gl.uniform1f(this.renderUniforms.canvasHeight, canvasHeight);

    // Render to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  uploadGrid(grid: LBMGrid): void {
    const gl = this.gl;
    const n = grid.rows * grid.cols;

    // Pack distributions into RGBA Float32
    const d0 = new Float32Array(n * 4);
    const d1 = new Float32Array(n * 4);
    const d2 = new Float32Array(n * 4);

    for (let idx = 0; idx < n; idx++) {
      const base = idx * 4;
      d0[base] = grid.f[0][idx];
      d0[base + 1] = grid.f[1][idx];
      d0[base + 2] = grid.f[2][idx];
      d0[base + 3] = grid.f[3][idx];

      d1[base] = grid.f[4][idx];
      d1[base + 1] = grid.f[5][idx];
      d1[base + 2] = grid.f[6][idx];
      d1[base + 3] = grid.f[7][idx];

      d2[base] = grid.f[8][idx];
      d2[base + 1] = 0;
      d2[base + 2] = 0;
      d2[base + 3] = 0;
    }

    // Upload to current ping-pong set
    const texSet = this.distTextures[this.pingPong];

    gl.bindTexture(gl.TEXTURE_2D, texSet[0]);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      this.cols,
      this.rows,
      gl.RGBA,
      gl.FLOAT,
      d0,
    );

    gl.bindTexture(gl.TEXTURE_2D, texSet[1]);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      this.cols,
      this.rows,
      gl.RGBA,
      gl.FLOAT,
      d1,
    );

    gl.bindTexture(gl.TEXTURE_2D, texSet[2]);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      this.cols,
      this.rows,
      gl.RGBA,
      gl.FLOAT,
      d2,
    );

    // Upload barriers
    this.updateBarriers(grid.barriers);
  }

  downloadGrid(grid: LBMGrid): void {
    const gl = this.gl;
    const n = this.rows * this.cols;
    const buf = new Float32Array(n * 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.distFramebuffers[this.pingPong]);

    // Read dist0
    gl.readBuffer(gl.COLOR_ATTACHMENT0);
    gl.readPixels(0, 0, this.cols, this.rows, gl.RGBA, gl.FLOAT, buf);
    for (let idx = 0; idx < n; idx++) {
      const base = idx * 4;
      grid.f[0][idx] = buf[base];
      grid.f[1][idx] = buf[base + 1];
      grid.f[2][idx] = buf[base + 2];
      grid.f[3][idx] = buf[base + 3];
    }

    // Read dist1
    gl.readBuffer(gl.COLOR_ATTACHMENT1);
    gl.readPixels(0, 0, this.cols, this.rows, gl.RGBA, gl.FLOAT, buf);
    for (let idx = 0; idx < n; idx++) {
      const base = idx * 4;
      grid.f[4][idx] = buf[base];
      grid.f[5][idx] = buf[base + 1];
      grid.f[6][idx] = buf[base + 2];
      grid.f[7][idx] = buf[base + 3];
    }

    // Read dist2
    gl.readBuffer(gl.COLOR_ATTACHMENT2);
    gl.readPixels(0, 0, this.cols, this.rows, gl.RGBA, gl.FLOAT, buf);
    for (let idx = 0; idx < n; idx++) {
      grid.f[8][idx] = buf[idx * 4];
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Recompute macroscopic on CPU
    computeMacroscopic(grid);
  }

  updateBarriers(barriers: Uint8Array): void {
    const gl = this.gl;
    // Scale 0/1 Uint8 to 0/255 for R8 texture
    const scaled = new Uint8Array(barriers.length);
    for (let i = 0; i < barriers.length; i++) {
      scaled[i] = barriers[i] ? 255 : 0;
    }
    gl.bindTexture(gl.TEXTURE_2D, this.barrierTexture);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      this.cols,
      this.rows,
      gl.RED,
      gl.UNSIGNED_BYTE,
      scaled,
    );
  }

  resize(rows: number, cols: number): void {
    this.destroy();
    this.rows = rows;
    this.cols = cols;

    const gl = this.gl;

    this.distTextures = [
      [
        createFloat32Texture(gl, cols, rows, null),
        createFloat32Texture(gl, cols, rows, null),
        createFloat32Texture(gl, cols, rows, null),
      ],
      [
        createFloat32Texture(gl, cols, rows, null),
        createFloat32Texture(gl, cols, rows, null),
        createFloat32Texture(gl, cols, rows, null),
      ],
    ];

    this.barrierTexture = createR8Texture(
      gl,
      cols,
      rows,
      new Uint8Array(cols * rows),
    );

    this.distFramebuffers = [
      this.createMRTFramebuffer(this.distTextures[0]),
      this.createMRTFramebuffer(this.distTextures[1]),
    ];

    this.pingPong = 0;
  }

  destroy(): void {
    const gl = this.gl;
    for (const set of this.distTextures) {
      for (const tex of set) {
        gl.deleteTexture(tex);
      }
    }
    gl.deleteTexture(this.barrierTexture);
    for (const fb of this.distFramebuffers) {
      gl.deleteFramebuffer(fb);
    }
    // Keep programs and VAO alive — they're reused on resize
  }

  getGridSize(): { rows: number; cols: number } {
    return { rows: this.rows, cols: this.cols };
  }
}
