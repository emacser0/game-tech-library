// 데칼: 겹친 평면(Z-파이팅, 뜸, 파묻힘) vs 깊이 버퍼 기반 박스 투영 데칼
GTL.register({
  id: 'projected-decals',
  title: '데칼: 겹친 평면 vs 박스 투영',
  summary: '바닥에 표식을 붙이는 두 방법을 비교. 평면을 겹쳐 놓으면 평평한 곳은 Z-파이팅, 굴곡진 곳은 뜨거나 파묻힘. 박스 투영 데칼은 깊이 버퍼에서 표면 위치를 복원해 어떤 굴곡에도 정확히 붙음.',
  renderer: 'webgl2',
  views: { a: '겹친 평면', b: '박스 투영 데칼' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌',
  info: `
    <p><b>데칼(decal)</b>은 총탄 자국, 핏자국, 도로 표시처럼 기존 표면 위에 덧그리는 무늬</p>
    <p><b>겹친 평면</b>: 표면 바로 위에 사각형 메시를 놓는 가장 단순한 방법. 문제:</p>
    <ul>
      <li>표면과 같은 높이면 깊이 값이 거의 같아 픽셀마다 앞뒤가 바뀜(<b>Z-파이팅</b>). 멀수록 깊이 정밀도가 낮아 심해짐.</li>
      <li>띄우면 굴곡진 곳에서 공중에 뜨고, 볼록한 곳에서는 표면 속에 파묻힘</li>
      <li><code>glPolygonOffset</code>은 깊이만 조금 당겨 Z-파이팅을 줄임. 굴곡 문제는 그대로임.</li>
    </ul>
    <p><b>박스 투영 데칼(deferred decal)</b>: 장면을 먼저 그린 뒤 데칼 영역을 덮는 박스를 그림</p>
    <ol>
      <li>박스의 각 픽셀에서 깊이 버퍼를 읽어 월드 위치를 복원</li>
      <li>위치를 데칼 공간으로 옮김. 박스 밖이면 버림.</li>
      <li>데칼 공간 xz를 텍스처 UV로 씀. 표면 법선과 투영 방향 각도로 가장자리를 흐림(angle fade).</li>
    </ol>
    <p>단점: 깊이 버퍼 필요. 투영 방향과 평행한 면(벽 옆면 등)에서는 텍스처가 길게 늘어남. 다른 물체가 박스 안에 들어오면 그 물체에도 찍힘. 그래서 엔진은 레이어나 스텐실로 받을 물체를 고름.</p>`,
  // 도식: 굴곡진 표면 위의 평면 데칼과 박스 투영 데칼
  diagram: (L) => `<svg viewBox="0 0 540 182" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="16" class="t-a">${L('A: 표면 위에 평면을 놓음', 'A: a quad on top of the surface')}</text>
    <polyline points="10.0,116.5 14.0,117.9 18.0,119.3 22.0,120.7 26.0,122.1 30.0,123.5 34.0,124.8 38.0,126.1 42.0,127.3 46.0,128.5 50.0,129.5 54.0,130.5 58.0,131.4 62.0,132.1 66.0,132.8 70.0,133.3 74.0,133.7 78.0,133.9 82.0,134.0 86.0,134.0 90.0,133.8 94.0,133.5 98.0,133.0 102.0,132.4 106.0,131.7 110.0,130.9 114.0,130.0 118.0,128.9 122.0,127.8 126.0,126.6 130.0,125.3 134.0,124.0 138.0,122.7 142.0,121.3 146.0,119.9 150.0,118.5 154.0,117.1 158.0,115.8 162.0,114.4 166.0,113.2 170.0,112.0 174.0,110.9 178.0,109.9 182.0,109.0 186.0,108.2 190.0,107.5 194.0,106.9 198.0,106.5 202.0,106.2 206.0,106.0 210.0,106.0 214.0,106.1 218.0,106.4 222.0,106.8 226.0,107.3 230.0,108.0 234.0,108.8 238.0,109.6 242.0,110.6 246.0,111.7 250.0,112.9 254.0,114.1 258.0,115.4" class="d-line"/>
    <line x1="60" y1="118" x2="210" y2="118" class="d-a" stroke-width="3"/>
    <text x="10" y="160" class="t-small">${L('오목한 곳은 뜨고, 볼록한 곳은 묻힘', 'Floats over dips, sinks into bumps')}</text>
    <text x="10" y="174" class="t-small t-dim">${L('같은 높이면 Z-파이팅', 'Same height: z-fighting')}</text>
    <text x="290" y="16" class="t-b">${L('B: 박스 안의 깊이로 투영', 'B: project onto depth inside a box')}</text>
    <polyline points="290.0,116.5 294.0,117.9 298.0,119.3 302.0,120.7 306.0,122.1 310.0,123.5 314.0,124.8 318.0,126.1 322.0,127.3 326.0,128.5 330.0,129.5 334.0,130.5 338.0,131.4 342.0,132.1 346.0,132.8 350.0,133.3 354.0,133.7 358.0,133.9 362.0,134.0 366.0,134.0 370.0,133.8 374.0,133.5 378.0,133.0 382.0,132.4 386.0,131.7 390.0,130.9 394.0,130.0 398.0,128.9 402.0,127.8 406.0,126.6 410.0,125.3 414.0,124.0 418.0,122.7 422.0,121.3 426.0,119.9 430.0,118.5 434.0,117.1 438.0,115.8 442.0,114.4 446.0,113.2 450.0,112.0 454.0,110.9 458.0,109.9 462.0,109.0 466.0,108.2 470.0,107.5 474.0,106.9 478.0,106.5 482.0,106.2 486.0,106.0 490.0,106.0 494.0,106.1 498.0,106.4 502.0,106.8 506.0,107.3 510.0,108.0 514.0,108.8 518.0,109.6 522.0,110.6 526.0,111.7 530.0,112.9 534.0,114.1 538.0,115.4" class="d-line"/>
    <rect x="340" y="70" width="150" height="80" class="d-b" stroke-dasharray="4 3"/>
    <polyline points="340.0,131.8 343.0,132.3 346.0,132.8 349.0,133.2 352.0,133.5 355.0,133.7 358.0,133.9 361.0,134.0 364.0,134.0 367.0,133.9 370.0,133.8 373.0,133.6 376.0,133.2 379.0,132.9 382.0,132.4 385.0,131.9 388.0,131.3 391.0,130.7 394.0,130.0 397.0,129.2 400.0,128.4 403.0,127.5 406.0,126.6 409.0,125.7 412.0,124.7 415.0,123.7 418.0,122.7 421.0,121.6 424.0,120.6 427.0,119.5 430.0,118.5 433.0,117.4 436.0,116.4 439.0,115.4 442.0,114.4 445.0,113.5 448.0,112.6 451.0,111.7 454.0,110.9 457.0,110.1 460.0,109.4 463.0,108.7 466.0,108.2 469.0,107.6 472.0,107.2 475.0,106.8 478.0,106.5 481.0,106.2 484.0,106.1 487.0,106.0 490.0,106.0" class="d-b" stroke-width="4"/>
    <text x="346" y="84" class="t-small t-b">${L('데칼 박스', 'decal box')}</text>
    <text x="290" y="160" class="t-small">${L('깊이로 월드 위치 복원, 박스 공간 xz를 UV로', 'Rebuild position from depth, box xz is UV')}</text>
    <text x="290" y="174" class="t-small t-dim">${L('표면 굴곡을 그대로 따라감', 'Follows the surface exactly')}</text>
  </svg>`,
  look: [
    'A의 평평한 바닥에서 데칼이 줄무늬로 깜빡임(Z-파이팅). 카메라를 멀리 보내면 더 심해짐.',
    'A에서 오프셋을 0.05로 올리면 깜빡임은 사라짐. 대신 언덕을 지날 때 데칼 일부가 땅속에 묻히고 계단에서는 공중에 뜸.',
    'B는 데칼이 언덕, 구, 계단 모서리를 따라 휘어 붙음. "박스 보기"로 투영 영역이 보임.',
    'B에서 각도 페이드를 끄면 구와 계단 옆면에서 텍스처가 세로로 길게 늘어남',
  ],
  refs: [
    { type: 'talk', title: 'Screen Space Decals in Warhammer 40,000: Space Marine (Pope Kim)', year: 2012, note: 'SIGGRAPH 2012 Talks. 깊이 버퍼로 위치를 복원하는 박스 데칼.' },
    { type: 'engine', title: 'Unreal Engine Documentation: Decal Materials' },
    { type: 'engine', title: 'Unity HDRP Documentation: Decal Projector' },
    { type: 'article', title: 'Learning to Love your Z-buffer (Steve Baker)', url: 'https://www.sjbaker.org/steve/omniv/love_your_z_buffer.html', note: '원근 깊이 정밀도와 Z-파이팅' },
  ],
  params: [
    { key: 'method', label: '데칼 방식', type: 'select', group: '데칼', options: [
      { value: 0, label: '겹친 평면' },
      { value: 1, label: '박스 투영 (깊이 복원)' },
    ], a: 0, b: 1 },
    { key: 'offset', label: '평면 띄움 (m)', type: 'range', min: 0, max: 0.1, step: 0.001, default: 0, when: (p) => +p.method === 0 },
    { key: 'polyOffset', label: 'polygonOffset 사용', type: 'bool', default: false, when: (p) => +p.method === 0 },
    { key: 'angleFade', label: '각도 페이드', type: 'bool', default: true, when: (p) => +p.method === 1 },
    { key: 'boxH', label: '투영 깊이 (m)', type: 'range', min: 0.2, max: 3, step: 0.05, default: 1.6, when: (p) => +p.method === 1 },
    { key: 'showBox', label: '박스 보기', type: 'bool', default: false },
    { key: 'size', label: '데칼 크기 (m)', type: 'range', min: 0.5, max: 4, step: 0.1, default: 2.2, shared: true, group: '장면' },
    { key: 'move', label: '데칼 이동', type: 'bool', default: true, shared: true },
    { key: 'near', label: '카메라 near (m)', type: 'range', min: 0.01, max: 1, step: 0.01, default: 0.05, shared: true, help: '작을수록 먼 곳 깊이 정밀도가 떨어짐' },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: false, shared: true },
  ],
  en: {
    title: 'Decals: Stacked Quads vs Box Projection',
    summary: 'This compares two ways to put marks on the floor. Stacked quads z-fight on flat ground and float or sink on curved ground. Box projected decals rebuild the surface position from the depth buffer, so they stick exactly to any shape.',
    views: { a: 'Stacked quad', b: 'Box projected decal' },
    controls: 'Mouse drag: rotate camera, wheel: zoom',
    info: `
    <p>A <b>decal</b> is a pattern drawn on top of an existing surface, like bullet holes, blood stains, or road markings.</p>
    <p><b>Stacked quad</b>: the simplest method puts a quad mesh right on top of the surface. Problems:</p>
    <ul>
      <li>At the same height as the surface, the depth values are almost equal, so front and back swap per pixel (<b>z-fighting</b>). It gets worse with distance, because depth precision drops.</li>
      <li>If you raise it, it floats in the air over dips and sinks into the surface over bumps.</li>
      <li><code>glPolygonOffset</code> pulls only the depth a little and reduces z-fighting. The curve problem stays.</li>
    </ul>
    <p><b>Box projected decal (deferred decal)</b>: draw the scene first, then draw a box that covers the decal area.</p>
    <ul>
      <li>At each pixel of the box, read the depth buffer and rebuild the world position.</li>
      <li>Move the position into decal space. Discard it if it is outside the box.</li>
      <li>Use decal space xz as the texture UV. Fade the edges by the angle between the surface normal and the projection direction (angle fade).</li>
    </ul>
    <p>Downsides: it needs a depth buffer. On faces parallel to the projection direction (like wall sides), the texture stretches. If another object enters the box, the decal prints on it too. So engines use layers or stencils to pick which objects receive it.</p>`,
    look: [
      'On the flat floor in A, the decal flickers in stripes (z-fighting). Move the camera far away and it gets worse.',
      'In A, raise the offset to 0.05. The flicker goes away. But part of the decal sinks into the hill, and it floats over the stairs.',
      'In B, the decal bends to follow the hill, the sphere, and the stair edges. "Show box" shows the projection volume.',
      'In B, turn off angle fade. The texture stretches tall on the sides of the sphere and stairs.',
    ],
    refs: ['SIGGRAPH 2012 Talks. Box decals that rebuild position from the depth buffer.', null, null, 'Perspective depth precision and z-fighting.'],
    params: {
      method: { label: 'Decal method', group: 'Decal', options: { 0: 'Stacked quad', 1: 'Box projection (depth rebuild)' } },
      offset: 'Quad offset (m)',
      polyOffset: 'Use polygonOffset',
      angleFade: 'Angle fade',
      boxH: 'Projection depth (m)',
      showBox: 'Show box',
      size: { label: 'Decal size (m)', group: 'Scene' },
      move: 'Move decal',
      near: { label: 'Camera near (m)', help: 'Smaller values lower depth precision far away' },
      autoRotate: 'Auto rotate',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params, G = U.geometry;
    const T = M.translation, S = M.scaling;

    // ── 장면: 언덕 있는 바닥, 계단 상자, 구 ──
    const HILL = { x: -2.6, z: 0, h: 0.7, s: 0.9 };
    const BOX = { x: 2.6, z: 0, hx: 0.8, hz: 1.2, h: 0.35 };
    const SPH = { x: 0.6, z: 0.5, r: 0.45 };
    const hill = (x, z) => HILL.h * Math.exp(-((x - HILL.x) ** 2 + (z - HILL.z) ** 2) / (2 * HILL.s * HILL.s));
    const SIZE = 16, DIV = 128;
    const Pp = [], Nn = [], Tt = [], Ii = [];
    for (let j = 0; j <= DIV; j++) for (let i = 0; i <= DIV; i++) {
      const x = (i / DIV - 0.5) * SIZE, z = (j / DIV - 0.5) * SIZE, e = 0.01;
      const dx = (hill(x + e, z) - hill(x - e, z)) / (2 * e), dz = (hill(x, z + e) - hill(x, z - e)) / (2 * e), l = Math.hypot(dx, 1, dz);
      Pp.push(x, hill(x, z), z); Nn.push(-dx / l, 1 / l, -dz / l); Tt.push(x, z);
    }
    for (let j = 0; j < DIV; j++) for (let i = 0; i < DIV; i++) { const a = j * (DIV + 1) + i, b = a + DIV + 1; Ii.push(a, b, a + 1, b, b + 1, a + 1); }
    const ground = G.upload(gl, { positions: new Float32Array(Pp), normals: new Float32Array(Nn), uvs: new Float32Array(Tt), indices: new Uint16Array(Ii), count: Ii.length });
    const cubeM = G.upload(gl, G.cube(1)), sphM = G.upload(gl, G.sphere(1, 40, 20)), planeM = G.upload(gl, G.plane(1, 1, 1));
    const objs = [
      { m: ground, w: M.create(), c: [0.55, 0.57, 0.52], checker: 1 },
      { m: cubeM, w: M.mul(T(BOX.x, BOX.h / 2, BOX.z), S(BOX.hx * 2, BOX.h, BOX.hz * 2)), c: [0.6, 0.55, 0.5], checker: 0 },
      { m: sphM, w: M.mul(T(SPH.x, SPH.r, SPH.z), S(SPH.r)), c: [0.5, 0.6, 0.75], checker: 0 },
    ];
    for (const o of objs) o.n = M.normalMatrix(o.w);
    const surfaceY = (x, z) => {
      let y = hill(x, z);
      if (Math.abs(x - BOX.x) < BOX.hx && Math.abs(z - BOX.z) < BOX.hz) y = Math.max(y, BOX.h);
      const d2 = (x - SPH.x) ** 2 + (z - SPH.z) ** 2;
      if (d2 < SPH.r * SPH.r) y = Math.max(y, SPH.r + Math.sqrt(SPH.r * SPH.r - d2));
      return y;
    };

    // ── 데칼 텍스처 (알파 포함) ──
    const DS = 256, dc = ctx.createCanvas(DS, DS), g = dc.getContext('2d');
    g.clearRect(0, 0, DS, DS);
    g.strokeStyle = '#f0b020'; g.lineWidth = 18;
    g.beginPath(); g.arc(128, 128, 104, 0, U.TAU); g.stroke();
    g.fillStyle = '#f0b020';
    g.beginPath(); g.moveTo(128, 40); g.lineTo(196, 130); g.lineTo(150, 130); g.lineTo(150, 210); g.lineTo(106, 210); g.lineTo(106, 130); g.lineTo(60, 130); g.closePath(); g.fill();
    g.fillStyle = '#c03020';
    for (let i = 0; i < 8; i++) { const a = i / 8 * U.TAU; g.beginPath(); g.arc(128 + Math.cos(a) * 104, 128 + Math.sin(a) * 104, 9, 0, U.TAU); g.fill(); }
    const decalTex = U.gl.texture(gl, dc, { wrap: 'clamp', mipmap: true });

    // ── 셰이더 ──
    const LIGHT = 'const vec3 LDIR = vec3(0.4082, 0.8165, 0.4082);\n      vec3 shade(vec3 alb, vec3 N) { return alb * (vec3(0.25, 0.27, 0.33) + vec3(1.0, 0.95, 0.85) * 1.1 * max(dot(N, LDIR), 0.0)); }';
    const sceneProg = U.gl.program(gl, `#version 300 es
      in vec3 a_position; in vec3 a_normal; in vec2 a_uv;
      uniform mat4 u_vp; uniform mat4 u_world; uniform mat3 u_nmat;
      out vec3 v_n; out vec3 v_pos; out vec2 v_uv;
      void main(){ vec4 wp = u_world * vec4(a_position, 1.0); v_pos = wp.xyz; v_n = u_nmat * a_normal; v_uv = a_uv; gl_Position = u_vp * wp; }`, `#version 300 es
      precision highp float;
      uniform vec3 u_color; uniform float u_checker; uniform float u_isDecal; uniform sampler2D u_decal;
      in vec3 v_n; in vec3 v_pos; in vec2 v_uv; out vec4 o_color;
      ${LIGHT}
      void main(){
        vec3 N = normalize(v_n);
        if (u_isDecal > 0.5) {
          vec4 d = texture(u_decal, v_uv);
          o_color = vec4(pow(shade(pow(d.rgb, vec3(2.2)), N), vec3(1.0 / 2.2)), d.a);
          return;
        }
        vec3 alb = u_color;
        if (u_checker > 0.5) { vec2 q = floor(v_pos.xz * 2.0); alb *= mod(q.x + q.y, 2.0) < 0.5 ? 0.85 : 1.0; }
        o_color = vec4(pow(shade(pow(alb, vec3(2.2)), N), vec3(1.0 / 2.2)), 1.0);
      }`);
    const blit = U.gl.program(gl, `#version 300 es
      in vec2 a_pos; out vec2 v_uv; void main(){ v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`, `#version 300 es
      precision highp float; uniform sampler2D u_tex; in vec2 v_uv; out vec4 o_color;
      void main(){ o_color = texture(u_tex, v_uv); }`);
    const decalProg = U.gl.program(gl, `#version 300 es
      in vec3 a_position; uniform mat4 u_vp; uniform mat4 u_decal;
      void main(){ gl_Position = u_vp * u_decal * vec4(a_position, 1.0); }`, `#version 300 es
      precision highp float;
      uniform sampler2D u_depth; uniform sampler2D u_decalTex;
      uniform mat4 u_invVP; uniform mat4 u_decalInv; uniform vec2 u_res; uniform float u_fade; uniform vec3 u_up;
      out vec4 o_color;
      ${LIGHT}
      float depthAt(ivec2 p) { return texelFetch(u_depth, clamp(p, ivec2(0), ivec2(u_res) - 1), 0).r; }
      vec3 posAt(ivec2 p) {
        float d = depthAt(p);
        vec4 ndc = vec4((vec2(p) + 0.5) / u_res * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
        vec4 w = u_invVP * ndc;
        return w.xyz / w.w;
      }
      void main(){
        ivec2 ip = ivec2(gl_FragCoord.xy);
        float d = depthAt(ip);
        if (d >= 1.0) discard;
        vec3 wp = posAt(ip);
        vec3 lp = (u_decalInv * vec4(wp, 1.0)).xyz;
        if (any(greaterThan(abs(lp), vec3(0.5)))) discard;
        // normal from depth: pick the side with the smaller depth step to avoid edge errors
        ivec2 ex = ivec2(1, 0), ey = ivec2(0, 1);
        float dr = depthAt(ip + ex), dl = depthAt(ip - ex), du = depthAt(ip + ey), db = depthAt(ip - ey);
        vec3 tx = abs(dr - d) < abs(d - dl) ? posAt(ip + ex) - wp : wp - posAt(ip - ex);
        vec3 ty = abs(du - d) < abs(d - db) ? posAt(ip + ey) - wp : wp - posAt(ip - ey);
        vec3 N = normalize(cross(tx, ty));
        vec3 up = u_up;
        if (dot(N, up) < 0.0) N = -N;
        vec4 t = textureLod(u_decalTex, lp.xz + 0.5, 0.0);
        float a = t.a;
        if (u_fade > 0.5) a *= smoothstep(0.25, 0.6, dot(N, up)) * (1.0 - smoothstep(0.35, 0.5, abs(lp.y)));
        o_color = vec4(pow(shade(pow(t.rgb, vec3(2.2)), N), vec3(1.0 / 2.2)), a);
      }`);
    const lineProg = U.gl.program(gl, `#version 300 es
      in vec3 a_position; uniform mat4 u_vp; uniform mat4 u_decal;
      void main(){ gl_Position = u_vp * u_decal * vec4(a_position, 1.0); }`, `#version 300 es
      precision mediump float; uniform vec3 u_color; out vec4 o_color;
      void main(){ o_color = vec4(u_color, 1.0); }`);
    const boxLines = [];
    for (const a of [-0.5, 0.5]) for (const b of [-0.5, 0.5]) boxLines.push(-0.5, a, b, 0.5, a, b, a, -0.5, b, a, 0.5, b, a, b, -0.5, a, b, 0.5);
    const lineBuf = U.gl.buffer(gl, new Float32Array(boxLines));
    const quad = U.gl.quad(gl);
    const sideCol = U.hexToRgb01(ctx.side === 'a' ? U.colors.a : U.colors.b);

    // ── 렌더 타겟: 색 + 깊이 텍스처 ──
    let rt = null;
    function makeRT(w, h) {
      if (rt) { gl.deleteFramebuffer(rt.fb); gl.deleteTexture(rt.color); gl.deleteTexture(rt.depth); }
      const color = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, color);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      U.gl.textureParams(gl, color, { filter: 'nearest' });
      const depth = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, depth);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, w, h, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      U.gl.textureParams(gl, depth, { filter: 'nearest' });
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      rt = { fb, color, depth, w, h };
    }

    const cam = { yaw: 0.35, pitch: 0.5, dist: 9, drag: false, lx: 0, ly: 0 };
    let t = 1.2;
    const FAR = 200;

    return {
      update(dt) {
        if (P.move) t += dt * 0.35;
        if (P.autoRotate && !cam.drag) cam.yaw += dt * 0.12;
        if (ctx.input.mouse.wheel) cam.dist = U.clamp(cam.dist * Math.pow(1.12, ctx.input.mouse.wheel), 2, 60);
      },
      onPointer(type, m) {
        if (type === 'down') { cam.drag = true; cam.lx = m.x; cam.ly = m.y; }
        else if (type === 'up' || type === 'leave') cam.drag = false;
        else if (type === 'move' && cam.drag) {
          cam.yaw -= (m.x - cam.lx) * 0.008; cam.pitch = U.clamp(cam.pitch + (m.y - cam.ly) * 0.008, 0.05, 1.5);
          cam.lx = m.x; cam.ly = m.y;
        }
      },
      render() {
        const W = ctx.pixelWidth, H = ctx.pixelHeight;
        if (!rt || rt.w !== W || rt.h !== H) makeRT(W, H);
        const near = P.near;
        const tgt = [0, 0.3, 0];
        const eye = M.orbitEye(tgt, cam.yaw, cam.pitch, cam.dist);
        const proj = M.perspective(U.rad(50), ctx.width / ctx.height, near, FAR);
        const vp = M.multiply(proj, M.lookAt(eye, tgt));
        const method = +P.method;

        // 데칼 위치: x축을 따라 언덕, 구, 계단을 지나감
        const dx = Math.sin(t) * 3.6, dz = 0.25 * Math.sin(t * 1.7);
        const sy = surfaceY(dx, dz);
        const boxH = method === 1 ? P.boxH : 0.01;
        const decalW = M.mul(T(dx, method === 1 ? hill(dx, dz) + 0.3 : sy + P.offset, dz), M.rotationY(t * 0.4), S(P.size, boxH, P.size));
        const decalInv = M.invert(decalW);

        // ── 1패스: 장면을 색 + 깊이 텍스처에 ──
        gl.bindFramebuffer(gl.FRAMEBUFFER, rt.fb);
        gl.viewport(0, 0, W, H);
        gl.clearColor(0.1, 0.11, 0.14, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
        gl.enable(gl.CULL_FACE);
        sceneProg.use();
        gl.uniformMatrix4fv(sceneProg.u('u_vp'), false, vp);
        gl.uniform1f(sceneProg.u('u_isDecal'), 0);
        // 이전 프레임에 깊이 텍스처가 묶인 유닛을 그대로 두면 피드백 루프 오류가 남. 데칼 텍스처로 바꿔 묶음
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, decalTex); gl.uniform1i(sceneProg.u('u_decal'), 0);
        for (const o of objs) {
          gl.uniformMatrix4fv(sceneProg.u('u_world'), false, o.w);
          gl.uniformMatrix3fv(sceneProg.u('u_nmat'), false, o.n);
          gl.uniform3fv(sceneProg.u('u_color'), o.c);
          gl.uniform1f(sceneProg.u('u_checker'), o.checker);
          o.m.draw(sceneProg);
        }
        if (method === 0) {
          // 겹친 평면: plane(1)은 xz 평면. 데칼 행렬에서 y 스케일은 의미 없음
          const pw = M.mul(T(dx, sy + P.offset, dz), M.rotationY(t * 0.4), S(P.size, 1, P.size));
          gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
          gl.depthMask(false);
          if (P.polyOffset) { gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -4); }
          gl.uniformMatrix4fv(sceneProg.u('u_world'), false, pw);
          gl.uniformMatrix3fv(sceneProg.u('u_nmat'), false, M.normalMatrix(pw));
          gl.uniform1f(sceneProg.u('u_isDecal'), 1);
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, decalTex); gl.uniform1i(sceneProg.u('u_decal'), 0);
          planeM.draw(sceneProg);
          gl.disable(gl.POLYGON_OFFSET_FILL);
          gl.depthMask(true);
          gl.disable(gl.BLEND);
        }

        // ── 2패스: 화면에 복사 ──
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, W, H);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        blit.use();
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, rt.color); gl.uniform1i(blit.u('u_tex'), 0);
        quad.draw(blit);

        // ── 3패스: 박스 투영 데칼 (뒷면만 그려 카메라가 박스 안에 있어도 동작) ──
        if (method === 1) {
          gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT);
          gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
          decalProg.use();
          gl.uniformMatrix4fv(decalProg.u('u_vp'), false, vp);
          gl.uniformMatrix4fv(decalProg.u('u_decal'), false, decalW);
          gl.uniformMatrix4fv(decalProg.u('u_decalInv'), false, decalInv);
          gl.uniformMatrix4fv(decalProg.u('u_invVP'), false, M.invert(vp));
          gl.uniform2f(decalProg.u('u_res'), W, H);
          gl.uniform1f(decalProg.u('u_fade'), P.angleFade ? 1 : 0);
          const ul = Math.hypot(decalW[4], decalW[5], decalW[6]);
          gl.uniform3f(decalProg.u('u_up'), decalW[4] / ul, decalW[5] / ul, decalW[6] / ul);
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, rt.depth); gl.uniform1i(decalProg.u('u_depth'), 0);
          gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, decalTex); gl.uniform1i(decalProg.u('u_decalTex'), 1);
          cubeM.draw(decalProg);
          gl.activeTexture(gl.TEXTURE0);
          gl.cullFace(gl.BACK); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
        }
        if (P.showBox) {
          lineProg.use();
          gl.uniformMatrix4fv(lineProg.u('u_vp'), false, vp);
          gl.uniformMatrix4fv(lineProg.u('u_decal'), false, decalW);
          gl.uniform3fv(lineProg.u('u_color'), sideCol);
          U.gl.attrib(gl, lineProg, 'a_position', lineBuf, 3);
          gl.drawArrays(gl.LINES, 0, 24);
        }

        // 측정: 데칼 위치의 깊이 해상도 (24비트, 표준 원근 깊이)
        const dist = Math.hypot(eye[0] - dx, eye[1] - sy, eye[2] - dz);
        const dzWorld = dist * dist * (FAR - near) / (FAR * near) / 16777216;
        ctx.stat(GTL.L('방식', 'Method'), method ? GTL.L('박스 투영', 'Box projection') : GTL.L('겹친 평면', 'Stacked quad'));
        ctx.stat(GTL.L('데칼까지 거리 (m)', 'Distance to decal (m)'), dist.toFixed(1));
        ctx.stat(GTL.L('깊이 1단계 (mm)', 'One depth step (mm)'), (dzWorld * 1000).toFixed(3));
        if (method === 0) {
          ctx.stat(GTL.L('평면 띄움 / 깊이 단계', 'Quad offset / depth step'), P.offset > 0 ? (P.offset / dzWorld).toFixed(0) + GTL.L('배', 'x') : GTL.L('0 (Z-파이팅)', '0 (z-fighting)'));
          ctx.stat(GTL.L('표면 높이 편차 (m)', 'Surface height range (m)'), (Math.max(surfaceY(dx + P.size / 2, dz), surfaceY(dx - P.size / 2, dz), sy) - Math.min(surfaceY(dx + P.size / 2, dz), surfaceY(dx - P.size / 2, dz), sy)).toFixed(2));
        } else {
          ctx.stat(GTL.L('추가 드로', 'Extra draws'), GTL.L('박스 1개 (픽셀당 깊이 읽기 최대 8회)', '1 box (up to 8 depth reads per pixel)'));
        }
      },
    };
  },
});
