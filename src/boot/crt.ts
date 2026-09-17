/* ---------------------------------------------------------------
   CRT renderer.
   Takes a 2D canvas (the POST terminal) and pushes it through a tube:
   barrel distortion, phosphor bloom, RGB separation, scanlines, static,
   vertical hold slip, plus the power-on collapse and the dive-in.

   This canvas is never interactive, so the shader is free to be heavy.
   --------------------------------------------------------------- */

const VERT = `#version 100
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FRAG = `#version 100
precision highp float;

varying vec2 vUv;

uniform sampler2D uTex;
uniform vec2  uRes;
uniform float uTime;
uniform float uPower;   // 0..1  tube warming up
uniform float uDive;    // 0..1  pulled into the screen
uniform float uStatic;  // 0..1  extra interference

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Pincushion the plane so the image sits on a curved tube.
vec2 curve(vec2 uv) {
  uv = uv * 2.0 - 1.0;
  vec2 off = abs(uv.yx) / vec2(5.2, 4.0);
  uv += uv * off * off;
  return uv * 0.5 + 0.5;
}

void main() {
  vec2 uv = curve(vUv);

  // --- dive: the viewer is pulled through the glass ---
  float dive = uDive * uDive;
  uv = (uv - 0.5) * (1.0 - dive * 0.92) + 0.5;

  // --- power-on: the picture collapses out of a single scanline ---
  float open   = smoothstep(0.0, 0.42, uPower);          // vertical height
  float spread = smoothstep(0.12, 0.72, uPower);         // horizontal width
  uv.y = (uv.y - 0.5) / max(open, 0.0015) + 0.5;
  uv.x = (uv.x - 0.5) / max(spread, 0.0015) + 0.5;

  // --- vertical hold: the picture slips every few seconds ---
  float slipGate = step(0.965, hash(vec2(floor(uTime * 1.7), 3.0)));
  float slip = slipGate * fract(uTime * 0.9) * 0.6;
  uv.y = fract(uv.y + slip);

  // --- horizontal tearing on bad lines ---
  float tearBand = step(0.992, hash(vec2(floor(uv.y * 90.0), floor(uTime * 22.0))));
  uv.x += tearBand * (hash(vec2(uTime, uv.y)) - 0.5) * (0.06 + uStatic * 0.2);

  // --- RGB separation, widening under stress ---
  float sep = (0.0016 + uStatic * 0.006 + dive * 0.02) * (1.0 + slipGate);
  float r = texture2D(uTex, uv + vec2( sep, 0.0)).r;
  float g = texture2D(uTex, uv).g;
  float b = texture2D(uTex, uv - vec2( sep, 0.0)).b;
  vec3 col = vec3(r, g, b);

  // Off-screen sampling reads as black, not smear.
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) col = vec3(0.0);

  // --- cheap bloom: four taps of the neighbourhood ---
  vec2 px = 2.2 / uRes;
  vec3 bl = texture2D(uTex, uv + vec2( px.x, 0.0)).rgb
          + texture2D(uTex, uv - vec2( px.x, 0.0)).rgb
          + texture2D(uTex, uv + vec2(0.0,  px.y)).rgb
          + texture2D(uTex, uv - vec2(0.0,  px.y)).rgb;
  col += bl * 0.085;

  // --- scanlines + aperture grille ---
  float scan = 0.82 + 0.18 * sin(vUv.y * uRes.y * 1.55);
  col *= scan;
  float grille = 0.9 + 0.1 * sin(vUv.x * uRes.x * 2.4);
  col *= grille;

  // --- static ---
  float n = hash(vUv * uRes + uTime * 60.0);
  col += (n - 0.5) * (0.055 + uStatic * 0.45);

  // --- the turn-on flash: a bright bar as the tube fires ---
  float flash = exp(-pow((uPower - 0.06) * 22.0, 2.0));
  col += vec3(0.55, 0.85, 0.95) * flash;

  // --- whiteout at the end of the dive ---
  col = mix(col, vec3(1.0), smoothstep(0.78, 1.0, uDive));

  // --- vignette ---
  vec2 v = vUv * (1.0 - vUv.yx);
  col *= pow(v.x * v.y * 16.0, 0.22);

  // The tube is only lit once it has power.
  col *= smoothstep(0.0, 0.08, uPower);

  gl_FragColor = vec4(col, 1.0);
}`

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)
  if (!sh) throw new Error('shader alloc failed')
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh) ?? 'shader compile failed')
  }
  return sh
}

export type CrtUniforms = {
  power: number
  dive: number
  static: number
}

export class CrtRenderer {
  private gl: WebGLRenderingContext
  private prog: WebGLProgram
  private tex: WebGLTexture
  private loc: Record<string, WebGLUniformLocation | null>
  private start = performance.now()

  constructor(private canvas: HTMLCanvasElement, private source: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: false,
    })
    if (!gl) throw new Error('webgl unavailable')
    this.gl = gl

    const prog = gl.createProgram()
    if (!prog) throw new Error('program alloc failed')
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) ?? 'program link failed')
    }
    this.prog = prog
    gl.useProgram(prog)

    // One oversized triangle covers the viewport with no index buffer.
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const tex = gl.createTexture()
    if (!tex) throw new Error('texture alloc failed')
    this.tex = tex
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    this.loc = {
      uTex: gl.getUniformLocation(prog, 'uTex'),
      uRes: gl.getUniformLocation(prog, 'uRes'),
      uTime: gl.getUniformLocation(prog, 'uTime'),
      uPower: gl.getUniformLocation(prog, 'uPower'),
      uDive: gl.getUniformLocation(prog, 'uDive'),
      uStatic: gl.getUniformLocation(prog, 'uStatic'),
    }
    gl.uniform1i(this.loc.uTex, 0)
  }

  resize(w: number, h: number, dpr: number) {
    const cw = Math.max(1, Math.floor(w * dpr))
    const ch = Math.max(1, Math.floor(h * dpr))
    if (this.canvas.width === cw && this.canvas.height === ch) return
    this.canvas.width = cw
    this.canvas.height = ch
    this.gl.viewport(0, 0, cw, ch)
  }

  render(u: CrtUniforms) {
    const gl = this.gl
    gl.useProgram(this.prog)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.source)

    gl.uniform2f(this.loc.uRes, this.canvas.width, this.canvas.height)
    gl.uniform1f(this.loc.uTime, (performance.now() - this.start) / 1000)
    gl.uniform1f(this.loc.uPower, u.power)
    gl.uniform1f(this.loc.uDive, u.dive)
    gl.uniform1f(this.loc.uStatic, u.static)

    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  dispose() {
    const gl = this.gl
    gl.deleteTexture(this.tex)
    gl.deleteProgram(this.prog)
    const ext = gl.getExtension('WEBGL_lose_context')
    ext?.loseContext()
  }
}
