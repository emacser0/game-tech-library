// GTL.util: 모든 샘플이 공유하는 수학, 난수, 노이즈, 그리기, WebGL 헬퍼.
// 샘플에서 이 파일을 수정하지 않음. 필요한 기능이 없으면 샘플 파일 안에 구현.
(function (root) {
  const GTL = (root.GTL = root.GTL || {});
  const U = (GTL.util = {});

  // ───────────────────────── 수학 ─────────────────────────
  U.TAU = Math.PI * 2;
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
  U.remap = (v, a0, a1, b0, b1) => U.lerp(b0, b1, U.invLerp(a0, a1, v));
  U.smoothstep = (a, b, v) => {
    const t = U.clamp(U.invLerp(a, b, v), 0, 1);
    return t * t * (3 - 2 * t);
  };
  // 프레임레이트 독립 지수 감쇠: lambda가 클수록 빨리 수렴
  U.damp = (a, b, lambda, dt) => U.lerp(a, b, 1 - Math.exp(-lambda * dt));
  U.approach = (cur, target, maxDelta) =>
    cur < target ? Math.min(cur + maxDelta, target) : Math.max(cur - maxDelta, target);
  U.wrap = (v, min, max) => {
    const r = max - min;
    return ((((v - min) % r) + r) % r) + min;
  };
  U.angleDiff = (a, b) => U.wrap(b - a, -Math.PI, Math.PI);
  U.lerpAngle = (a, b, t) => a + U.angleDiff(a, b) * t;
  U.deg = (r) => (r * 180) / Math.PI;
  U.rad = (d) => (d * Math.PI) / 180;

  // ───────────────────────── 2D 벡터 (불변 스타일, {x,y}) ─────────────────────────
  const v2 = (U.v2 = (x = 0, y = 0) => ({ x, y }));
  v2.add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
  v2.sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
  v2.scale = (a, s) => ({ x: a.x * s, y: a.y * s });
  v2.dot = (a, b) => a.x * b.x + a.y * b.y;
  v2.cross = (a, b) => a.x * b.y - a.y * b.x;
  v2.len = (a) => Math.hypot(a.x, a.y);
  v2.lenSq = (a) => a.x * a.x + a.y * a.y;
  v2.dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  v2.distSq = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  v2.norm = (a) => {
    const l = Math.hypot(a.x, a.y);
    return l > 1e-9 ? { x: a.x / l, y: a.y / l } : { x: 0, y: 0 };
  };
  v2.perp = (a) => ({ x: -a.y, y: a.x });
  v2.rotate = (a, r) => {
    const c = Math.cos(r), s = Math.sin(r);
    return { x: a.x * c - a.y * s, y: a.x * s + a.y * c };
  };
  v2.lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  v2.fromAngle = (r, l = 1) => ({ x: Math.cos(r) * l, y: Math.sin(r) * l });
  v2.angle = (a) => Math.atan2(a.y, a.x);
  v2.limit = (a, max) => {
    const l = Math.hypot(a.x, a.y);
    return l > max ? { x: (a.x / l) * max, y: (a.y / l) * max } : { x: a.x, y: a.y };
  };

  // ───────────────────────── 시드 난수 ─────────────────────────
  // mulberry32. A, B 두 뷰가 같은 시드를 받으므로 같은 장면이 재현됨.
  U.rng = function (seed = 1) {
    let s = seed >>> 0 || 1;
    const next = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const r = {
      next,
      range: (a, b) => a + (b - a) * next(),
      int: (a, b) => a + Math.floor(next() * (b - a + 1)), // [a, b] 포함
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      chance: (p) => next() < p,
      gauss: () => {
        let u = 0, v = 0;
        while (u === 0) u = next();
        while (v === 0) v = next();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(U.TAU * v);
      },
      shuffle: (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      },
    };
    return r;
  };

  // ───────────────────────── 노이즈 ─────────────────────────
  // U.noise(seed) → { perlin2, perlin3, value2, fbm2(x,y,{octaves,lacunarity,gain,fn}) }
  // perlin 출력 범위 대략 [-1, 1], value2는 [0, 1]
  U.noise = function (seed = 1) {
    const r = U.rng(seed);
    const p = new Uint8Array(512);
    const perm = Array.from({ length: 256 }, (_, i) => i);
    r.shuffle(perm);
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const grad2 = (h, x, y) => {
      switch (h & 7) {
        case 0: return x + y;
        case 1: return -x + y;
        case 2: return x - y;
        case 3: return -x - y;
        case 4: return x;
        case 5: return -x;
        case 6: return y;
        default: return -y;
      }
    };
    const grad3 = (h, x, y, z) => {
      const hh = h & 15;
      const u = hh < 8 ? x : y;
      const v = hh < 4 ? y : hh === 12 || hh === 14 ? x : z;
      return ((hh & 1) === 0 ? u : -u) + ((hh & 2) === 0 ? v : -v);
    };
    const perlin2 = (x, y) => {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
      x -= Math.floor(x); y -= Math.floor(y);
      const u = fade(x), v = fade(y);
      const aa = p[p[X] + Y], ab = p[p[X] + Y + 1], ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
      return U.lerp(
        U.lerp(grad2(aa, x, y), grad2(ba, x - 1, y), u),
        U.lerp(grad2(ab, x, y - 1), grad2(bb, x - 1, y - 1), u),
        v
      ) * 0.7071;
    };
    const perlin3 = (x, y, z) => {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
      x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
      const u = fade(x), v = fade(y), w = fade(z);
      const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
      const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
      return U.lerp(
        U.lerp(
          U.lerp(grad3(p[AA], x, y, z), grad3(p[BA], x - 1, y, z), u),
          U.lerp(grad3(p[AB], x, y - 1, z), grad3(p[BB], x - 1, y - 1, z), u), v),
        U.lerp(
          U.lerp(grad3(p[AA + 1], x, y, z - 1), grad3(p[BA + 1], x - 1, y, z - 1), u),
          U.lerp(grad3(p[AB + 1], x, y - 1, z - 1), grad3(p[BB + 1], x - 1, y - 1, z - 1), u), v),
        w);
    };
    const hash2 = (ix, iy) => p[(p[ix & 255] + iy) & 511] / 255;
    const value2 = (x, y) => {
      const ix = Math.floor(x), iy = Math.floor(y);
      const fx = x - ix, fy = y - iy;
      const u = fade(fx), v = fade(fy);
      return U.lerp(
        U.lerp(hash2(ix, iy), hash2(ix + 1, iy), u),
        U.lerp(hash2(ix, iy + 1), hash2(ix + 1, iy + 1), u), v);
    };
    const fbm2 = (x, y, o = {}) => {
      const oct = o.octaves ?? 5, lac = o.lacunarity ?? 2, gain = o.gain ?? 0.5, fn = o.fn || perlin2;
      let amp = 1, freq = 1, sum = 0, norm = 0;
      for (let i = 0; i < oct; i++) {
        sum += fn(x * freq, y * freq) * amp;
        norm += amp; amp *= gain; freq *= lac;
      }
      return sum / norm;
    };
    return { perlin2, perlin3, value2, fbm2, hash2 };
  };

  // ───────────────────────── 이징 ─────────────────────────
  const E = (U.ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - (1 - t) ** 3,
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
    inQuart: (t) => t ** 4,
    outQuart: (t) => 1 - (1 - t) ** 4,
    inOutQuart: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2),
    inSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
    outSine: (t) => Math.sin((t * Math.PI) / 2),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    inExpo: (t) => (t === 0 ? 0 : 2 ** (10 * t - 10)),
    outExpo: (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)),
    inOutExpo: (t) => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2,
    inBack: (t) => 2.70158 * t ** 3 - 1.70158 * t * t,
    outBack: (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
    inOutBack: (t) => {
      const c2 = 1.70158 * 1.525;
      return t < 0.5
        ? ((2 * t) ** 2 * ((c2 + 1) * 2 * t - c2)) / 2
        : ((2 * t - 2) ** 2 * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    },
    outElastic: (t) => t === 0 ? 0 : t === 1 ? 1 : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * (U.TAU / 3)) + 1,
    inElastic: (t) => t === 0 ? 0 : t === 1 ? 1 : -(2 ** (10 * t - 10)) * Math.sin((t * 10 - 10.75) * (U.TAU / 3)),
    outBounce: (t) => {
      const n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t;
      if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
      if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
      return n * (t -= 2.625 / d) * t + 0.984375;
    },
  });
  E.inBounce = (t) => 1 - E.outBounce(1 - t);

  // ───────────────────────── 색 ─────────────────────────
  U.hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
  U.rgb = (r, g, b, a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
  U.hexToRgb = (hex) => {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  U.hexToRgb01 = (hex) => U.hexToRgb(hex).map((c) => c / 255);
  // 프로젝트 공통 팔레트 (어두운 배경 기준)
  U.colors = {
    bg: '#14161a',
    grid: 'rgba(255,255,255,0.06)',
    text: '#d8dde6',
    dim: '#7d8594',
    a: '#ff7a59',      // A 뷰 강조색
    b: '#4fc3f7',      // B 뷰 강조색
    good: '#66d17a',
    bad: '#ff5370',
    warn: '#ffcb6b',
    accent: '#c792ea',
    series: ['#4fc3f7', '#ff7a59', '#66d17a', '#ffcb6b', '#c792ea', '#f78c6c', '#89ddff', '#ff5370'],
  };

  // ───────────────────────── 캔버스 ─────────────────────────
  // 오프스크린 캔버스 생성 (테스트 환경에서도 동작하도록 플랫폼을 경유)
  U.createCanvas = (w, h) => GTL.platform.createCanvas(w, h);

  // ───────────────────────── 2D 그리기 ─────────────────────────
  const D = (U.draw = {});
  D.clear = (g, w, h, color = U.colors.bg) => { g.fillStyle = color; g.fillRect(0, 0, w, h); };
  D.circle = (g, x, y, r, fill, stroke, lineWidth = 1) => {
    g.beginPath();
    g.arc(x, y, Math.max(0, r), 0, U.TAU);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lineWidth; g.stroke(); }
  };
  D.rect = (g, x, y, w, h, fill, stroke, lineWidth = 1) => {
    if (fill) { g.fillStyle = fill; g.fillRect(x, y, w, h); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lineWidth; g.strokeRect(x, y, w, h); }
  };
  D.line = (g, x1, y1, x2, y2, color, lineWidth = 1) => {
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2);
    g.strokeStyle = color; g.lineWidth = lineWidth; g.stroke();
  };
  D.poly = (g, pts, fill, stroke, lineWidth = 1, closed = true) => {
    if (!pts.length) return;
    g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    if (closed) g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lineWidth; g.stroke(); }
  };
  D.arrow = (g, x1, y1, x2, y2, color, lineWidth = 1.5, head = 7) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    D.line(g, x1, y1, x2, y2, color, lineWidth);
    g.beginPath();
    g.moveTo(x2, y2);
    g.lineTo(x2 - head * Math.cos(a - 0.45), y2 - head * Math.sin(a - 0.45));
    g.lineTo(x2 - head * Math.cos(a + 0.45), y2 - head * Math.sin(a + 0.45));
    g.closePath(); g.fillStyle = color; g.fill();
  };
  D.grid = (g, w, h, step, color = U.colors.grid, ox = 0, oy = 0) => {
    g.beginPath();
    for (let x = (((ox % step) + step) % step); x <= w; x += step) { g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, h); }
    for (let y = (((oy % step) + step) % step); y <= h; y += step) { g.moveTo(0, y + 0.5); g.lineTo(w, y + 0.5); }
    g.strokeStyle = color; g.lineWidth = 1; g.stroke();
  };
  D.text = (g, str, x, y, o = {}) => {
    g.font = o.font || `${o.size || 12}px ui-monospace, Consolas, monospace`;
    g.textAlign = o.align || 'left';
    g.textBaseline = o.baseline || 'top';
    g.fillStyle = o.color || U.colors.text;
    g.fillText(str, x, y);
  };
  // 간단한 시계열 그래프: values 배열을 (x,y,w,h) 영역에 그린다
  D.plot = (g, values, x, y, w, h, o = {}) => {
    const n = values.length;
    if (n < 2) return;
    let min = o.min, max = o.max;
    if (min === undefined || max === undefined) {
      let lo = Infinity, hi = -Infinity;
      for (const v of values) { if (v < lo) lo = v; if (v > hi) hi = v; }
      if (min === undefined) min = lo;
      if (max === undefined) max = hi;
    }
    if (max - min < 1e-9) max = min + 1;
    if (o.background !== false) { g.fillStyle = o.background || 'rgba(0,0,0,0.35)'; g.fillRect(x, y, w, h); }
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const px = x + (i / (n - 1)) * w;
      const py = y + h - ((values[i] - min) / (max - min)) * h;
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.strokeStyle = o.color || U.colors.b; g.lineWidth = o.lineWidth || 1.5; g.stroke();
    if (o.label) D.text(g, o.label, x + 4, y + 3, { size: 10, color: U.colors.dim });
  };

  // ───────────────────────── WebGL 헬퍼 ─────────────────────────
  const G = (U.gl = {});
  G.shader = (gl, type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error((type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment') + GTL.L(' shader 컴파일 실패:\n', ' shader compile failed:\n') + log);
    }
    return s;
  };
  // 프로그램 생성. 반환 객체: { program, use(), u(name) → location (캐시), a(name) → attrib location }
  G.program = (gl, vsSrc, fsSrc) => {
    const p = gl.createProgram();
    gl.attachShader(p, G.shader(gl, gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(p, G.shader(gl, gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(GTL.L('Program 링크 실패:\n', 'Program link failed:\n') + gl.getProgramInfoLog(p));
    const uc = {}, ac = {};
    return {
      program: p,
      use() { gl.useProgram(p); return this; },
      u(name) { return name in uc ? uc[name] : (uc[name] = gl.getUniformLocation(p, name)); },
      a(name) { return name in ac ? ac[name] : (ac[name] = gl.getAttribLocation(p, name)); },
    };
  };
  G.buffer = (gl, data, target = gl.ARRAY_BUFFER, usage = gl.STATIC_DRAW) => {
    const b = gl.createBuffer();
    gl.bindBuffer(target, b);
    gl.bufferData(target, data, usage);
    return b;
  };
  // 버퍼를 attribute에 연결 (WebGL1/2 공통)
  G.attrib = (gl, prog, name, buffer, size, type = gl.FLOAT, stride = 0, offset = 0) => {
    const loc = typeof name === 'number' ? name : prog.a(name);
    if (loc < 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, type, false, stride, offset);
  };
  // 텍스처 생성. src: Canvas/Image 또는 { width, height, data(Uint8Array RGBA) }
  // opts: { filter: 'linear'|'nearest', mipmap: bool, wrap: 'repeat'|'clamp'|'mirror' }
  G.texture = (gl, src, opts = {}) => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    if (src && src.data !== undefined) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, src.width, src.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, src.data);
    } else if (src) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    }
    G.textureParams(gl, t, opts);
    return t;
  };
  G.textureParams = (gl, t, opts = {}) => {
    gl.bindTexture(gl.TEXTURE_2D, t);
    const wrap = { repeat: gl.REPEAT, clamp: gl.CLAMP_TO_EDGE, mirror: gl.MIRRORED_REPEAT }[opts.wrap || 'clamp'];
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    const near = opts.filter === 'nearest';
    if (opts.mipmap) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, near ? gl.NEAREST_MIPMAP_NEAREST : gl.LINEAR_MIPMAP_LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, near ? gl.NEAREST : gl.LINEAR);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, near ? gl.NEAREST : gl.LINEAR);
  };
  // 렌더 타겟. opts: { depth: bool, filter, float: bool (WebGL2: RGBA16F) }
  G.framebuffer = (gl, w, h, opts = {}) => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const isGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    if (opts.float && isGL2) {
      gl.getExtension('EXT_color_buffer_float');
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    G.textureParams(gl, tex, { filter: opts.filter || 'linear', wrap: 'clamp' });
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    let depth = null;
    if (opts.depth) {
      depth = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {
      fb, tex, depth, width: w, height: h,
      bind() { gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.viewport(0, 0, w, h); },
      dispose() { gl.deleteFramebuffer(fb); gl.deleteTexture(tex); if (depth) gl.deleteRenderbuffer(depth); },
    };
  };
  // 화면 전체 사각형. 버텍스 셰이더에서 attribute vec2 a_pos (-1..1) 사용.
  // const quad = U.gl.quad(gl); quad.draw(prog);
  G.quad = (gl) => {
    const buf = G.buffer(gl, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]));
    return {
      buffer: buf,
      draw(prog, attribName = 'a_pos') {
        G.attrib(gl, prog, attribName, buf, 2);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      },
    };
  };
  // 기본 풀스크린 버텍스 셰이더 (GLSL ES 1.0). v_uv: 0..1
  G.QUAD_VS = `attribute vec2 a_pos; varying vec2 v_uv;
void main(){ v_uv = a_pos*0.5+0.5; gl_Position = vec4(a_pos,0.0,1.0); }`;

  // ───────────────────────── mat4 (column-major Float32Array, WebGL 규약) ─────────────────────────
  const M = (U.mat4 = {});
  M.create = () => { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; };
  M.identity = M.create;
  M.multiply = (a, b) => { // a * b
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++)
      for (let r = 0; r < 4; r++) {
        let s = 0;
        for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
        o[c * 4 + r] = s;
      }
    return o;
  };
  M.mul = (...ms) => ms.reduce((acc, m) => M.multiply(acc, m));
  M.perspective = (fovy, aspect, near, far) => {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    const o = new Float32Array(16);
    o[0] = f / aspect; o[5] = f; o[10] = (far + near) * nf; o[11] = -1; o[14] = 2 * far * near * nf;
    return o;
  };
  M.ortho = (l, r, b, t, n, f) => {
    const o = new Float32Array(16);
    o[0] = 2 / (r - l); o[5] = 2 / (t - b); o[10] = -2 / (f - n);
    o[12] = -(r + l) / (r - l); o[13] = -(t + b) / (t - b); o[14] = -(f + n) / (f - n); o[15] = 1;
    return o;
  };
  M.lookAt = (eye, target, up = [0, 1, 0]) => {
    let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
    let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
    let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
    l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    const o = new Float32Array(16);
    o[0] = xx; o[1] = yx; o[2] = zx;
    o[4] = xy; o[5] = yy; o[6] = zy;
    o[8] = xz; o[9] = yz; o[10] = zz;
    o[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
    o[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
    o[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
    o[15] = 1;
    return o;
  };
  M.translation = (x, y, z) => { const m = M.create(); m[12] = x; m[13] = y; m[14] = z; return m; };
  M.scaling = (x, y = x, z = x) => { const m = M.create(); m[0] = x; m[5] = y; m[10] = z; return m; };
  M.rotationX = (a) => { const m = M.create(), c = Math.cos(a), s = Math.sin(a); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; };
  M.rotationY = (a) => { const m = M.create(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; };
  M.rotationZ = (a) => { const m = M.create(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; };
  M.transpose = (a) => {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r * 4 + c];
    return o;
  };
  M.invert = (a) => {
    const o = new Float32Array(16);
    const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = a;
    const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) return M.create();
    det = 1 / det;
    o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return o;
  };
  // 법선 행렬 (mat3, model의 역전치 상단 3x3)
  M.normalMatrix = (model) => {
    const it = M.transpose(M.invert(model));
    return new Float32Array([it[0], it[1], it[2], it[4], it[5], it[6], it[8], it[9], it[10]]);
  };
  M.transformPoint = (m, p) => {
    const x = p[0], y = p[1], z = p[2];
    const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;
    return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w];
  };
  // 궤도 카메라 위치 계산: yaw/pitch(라디안), 거리
  M.orbitEye = (target, yaw, pitch, dist) => [
    target[0] + dist * Math.cos(pitch) * Math.sin(yaw),
    target[1] + dist * Math.sin(pitch),
    target[2] + dist * Math.cos(pitch) * Math.cos(yaw),
  ];

  // ───────────────────────── 3D 지오메트리 ─────────────────────────
  // 반환: { positions, normals, uvs (Float32Array), indices (Uint16Array), count }
  const geo = (U.geometry = {});
  const pack = (P, N, T, I) => ({
    positions: new Float32Array(P), normals: new Float32Array(N), uvs: new Float32Array(T),
    indices: new Uint16Array(I), count: I.length,
  });
  geo.cube = (s = 1) => {
    const h = s / 2, P = [], N = [], T = [], I = [];
    const faces = [
      [[1, 0, 0], [0, 0, -1], [0, 1, 0]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
      [[0, 1, 0], [1, 0, 0], [0, 0, -1]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
      [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
    ];
    faces.forEach(([n, u, v], f) => {
      for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        P.push((n[0] + u[0] * a + v[0] * b) * h, (n[1] + u[1] * a + v[1] * b) * h, (n[2] + u[2] * a + v[2] * b) * h);
        N.push(...n); T.push((a + 1) / 2, (b + 1) / 2);
      }
      const o = f * 4; I.push(o, o + 1, o + 2, o, o + 2, o + 3);
    });
    return pack(P, N, T, I);
  };
  geo.sphere = (r = 1, seg = 32, rings = 16) => {
    const P = [], N = [], T = [], I = [];
    for (let y = 0; y <= rings; y++) {
      const v = y / rings, th = v * Math.PI;
      for (let x = 0; x <= seg; x++) {
        const u = x / seg, ph = u * U.TAU;
        const nx = Math.sin(th) * Math.sin(ph), ny = Math.cos(th), nz = Math.sin(th) * Math.cos(ph);
        P.push(nx * r, ny * r, nz * r); N.push(nx, ny, nz); T.push(u, 1 - v);
      }
    }
    for (let y = 0; y < rings; y++)
      for (let x = 0; x < seg; x++) {
        const a = y * (seg + 1) + x, b = a + seg + 1;
        I.push(a, b, a + 1, b, b + 1, a + 1);
      }
    return pack(P, N, T, I);
  };
  geo.plane = (size = 10, div = 1, uvScale = 1) => {
    const P = [], N = [], T = [], I = [];
    for (let z = 0; z <= div; z++)
      for (let x = 0; x <= div; x++) {
        P.push((x / div - 0.5) * size, 0, (z / div - 0.5) * size); N.push(0, 1, 0);
        T.push((x / div) * uvScale, (z / div) * uvScale);
      }
    for (let z = 0; z < div; z++)
      for (let x = 0; x < div; x++) {
        const a = z * (div + 1) + x, b = a + div + 1;
        I.push(a, b, a + 1, b, b + 1, a + 1);
      }
    return pack(P, N, T, I);
  };
  geo.torus = (R = 1, r = 0.35, seg = 48, sides = 24) => {
    const P = [], N = [], T = [], I = [];
    for (let i = 0; i <= seg; i++) {
      const u = (i / seg) * U.TAU;
      for (let j = 0; j <= sides; j++) {
        const v = (j / sides) * U.TAU;
        const cx = Math.cos(u), cz = Math.sin(u);
        const nx = Math.cos(v) * cx, ny = Math.sin(v), nz = Math.cos(v) * cz;
        P.push(cx * R + nx * r, ny * r, cz * R + nz * r); N.push(nx, ny, nz); T.push(i / seg, j / sides);
      }
    }
    for (let i = 0; i < seg; i++)
      for (let j = 0; j < sides; j++) {
        const a = i * (sides + 1) + j, b = a + sides + 1;
        I.push(a, a + 1, b, b, a + 1, b + 1);
      }
    return pack(P, N, T, I);
  };
  // 지오메트리를 GPU 버퍼로 업로드. mesh.draw(prog) 시 a_position/a_normal/a_uv 자동 연결
  geo.upload = (gl, g) => {
    const pb = G.buffer(gl, g.positions), nb = G.buffer(gl, g.normals), tb = G.buffer(gl, g.uvs);
    const ib = G.buffer(gl, g.indices, gl.ELEMENT_ARRAY_BUFFER);
    return {
      count: g.count,
      draw(prog, mode = gl.TRIANGLES) {
        G.attrib(gl, prog, 'a_position', pb, 3);
        G.attrib(gl, prog, 'a_normal', nb, 3);
        G.attrib(gl, prog, 'a_uv', tb, 2);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
        gl.drawElements(mode, g.count, gl.UNSIGNED_SHORT, 0);
      },
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
