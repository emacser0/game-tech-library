// 캐스케이드 섀도 맵 (CSM): 단일 섀도 맵 vs 2~4단 캐스케이드, 분할 방식(uniform, log, PSSM λ), 텍셀 스냅 안정화
GTL.register({
  id: 'cascaded-shadow-maps',
  title: '캐스케이드 섀도 맵 (CSM)',
  summary: '섀도 맵 한 장으로 넓은 야외를 덮으면 카메라 근처 그림자가 뭉개짐. 시야를 거리별로 나눠 구간마다 섀도 맵을 따로 쓰면 가까운 곳은 촘촘하고 먼 곳은 넓게 덮음.',
  renderer: 'webgl2',
  views: { a: '단일 섀도 맵', b: '캐스케이드 4단' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌',
  info: `
    <p>방향광 섀도 맵은 직교 투영 한 장으로 그림자 거리 전체를 덮음. 거리 100m를 1024 텍셀로 덮으면 텍셀 하나가 10cm 이상이 됨. 카메라 앞 물체의 그림자가 계단처럼 뭉개짐.</p>
    <p><b>캐스케이드 섀도 맵(CSM)</b>은 카메라 시야(프러스텀)를 깊이 구간으로 나눔. 구간마다 그 구간만 감싸는 섀도 맵을 렌더함. 가까운 구간은 좁은 영역을 같은 해상도로 덮어서 선명함.</p>
    <p>분할 방식:</p>
    <ul>
      <li><b>uniform</b>: 같은 간격. 가까운 구간이 너무 넓어 효과가 적음.</li>
      <li><b>log</b>: 거리 비가 일정. 원근 왜곡과 맞지만 첫 구간이 너무 좁음.</li>
      <li><b>PSSM</b>(Zhang 2006): 두 방식을 λ로 섞음. 실무에서 λ 0.5~0.9를 많이 씀.</li>
    </ul>
    <p><b>안정화</b>: 카메라가 돌 때마다 섀도 맵 영역이 바뀌면 텍셀 경계가 움직여 그림자 가장자리가 지글거림(shimmering). 구간을 경계 구로 감싸 크기를 고정하고, 섀도 맵 원점을 텍셀 격자에 맞추면(texel snapping) 멈춤. 대신 영역이 커져 해상도가 조금 낮아짐.</p>
    <p>단점: 구간 수만큼 그림자 패스가 늘어남. 구간 경계에서 해상도가 갑자기 바뀌어 선이 보일 수 있음. 엔진은 경계에서 두 구간을 섞거나 디더링함.</p>`,
  // 도식: 위에서 본 카메라 프러스텀. 섀도 맵 1장과 깊이 구간별 캐스케이드의 텍셀 크기
  diagram: (L) => `<svg viewBox="0 0 540 202" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="14" class="t-a">${L('A: 섀도 맵 1장이 전체를 덮음', 'A: one shadow map covers all')}</text>
    <circle cx="20" cy="100" r="4" class="f-accent"/>
    <path d="M20,100 L250,20 L250,180 Z" class="d-line"/>
    <rect x="18" y="18" width="236" height="164" class="d-a"/>
    <line x1="47.5" y1="18" x2="47.5" y2="182" class="d-dim"/>
    <line x1="18" y1="38.5" x2="254" y2="38.5" class="d-dim"/>
    <line x1="77" y1="18" x2="77" y2="182" class="d-dim"/>
    <line x1="18" y1="59" x2="254" y2="59" class="d-dim"/>
    <line x1="106.5" y1="18" x2="106.5" y2="182" class="d-dim"/>
    <line x1="18" y1="79.5" x2="254" y2="79.5" class="d-dim"/>
    <line x1="136" y1="18" x2="136" y2="182" class="d-dim"/>
    <line x1="18" y1="100" x2="254" y2="100" class="d-dim"/>
    <line x1="165.5" y1="18" x2="165.5" y2="182" class="d-dim"/>
    <line x1="18" y1="120.5" x2="254" y2="120.5" class="d-dim"/>
    <line x1="195" y1="18" x2="195" y2="182" class="d-dim"/>
    <line x1="18" y1="141" x2="254" y2="141" class="d-dim"/>
    <line x1="224.5" y1="18" x2="224.5" y2="182" class="d-dim"/>
    <line x1="18" y1="161.5" x2="254" y2="161.5" class="d-dim"/>
    <text x="10" y="196" class="t-small">${L('카메라 앞도 텍셀이 큼', 'Big texels even near the camera')}</text>
    <text x="290" y="14" class="t-b">${L('B: 깊이 구간마다 섀도 맵', 'B: a shadow map per depth slice')}</text>
    <circle cx="290" cy="100" r="4" class="f-accent"/>
    <path d="M290,100 L520,20 L520,180 Z" class="d-line"/>
    <rect x="288" y="89" width="27" height="22" class="d-b"/>
    <line x1="291.4" y1="89" x2="291.4" y2="111" class="d-dim"/>
    <line x1="294.8" y1="89" x2="294.8" y2="111" class="d-dim"/>
    <line x1="298.1" y1="89" x2="298.1" y2="111" class="d-dim"/>
    <line x1="301.5" y1="89" x2="301.5" y2="111" class="d-dim"/>
    <line x1="304.9" y1="89" x2="304.9" y2="111" class="d-dim"/>
    <line x1="308.2" y1="89" x2="308.2" y2="111" class="d-dim"/>
    <line x1="311.6" y1="89" x2="311.6" y2="111" class="d-dim"/>
    <rect x="311" y="77" width="38.5" height="46" class="d-b"/>
    <rect x="345.5" y="57" width="61.5" height="86" class="d-b"/>
    <rect x="403" y="17" width="119" height="166" class="d-b"/>
    <text x="290" y="196" class="t-small">${L('가까운 구간은 같은 해상도로 좁은 영역', 'Near slice: same resolution, small area')}</text>
  </svg>`,
  look: [
    'A에서 카메라 앞 기둥과 울타리 그림자가 굵은 계단으로 뭉개짐. B는 같은 해상도인데 날카로움.',
    '"구간 색 보기"를 켜면 빨강, 초록, 파랑, 노랑 순으로 구간이 보임. 분할을 uniform으로 바꾸면 빨강 구간이 매우 넓어지고 근경이 다시 흐려짐.',
    '"안정화"를 끄면 B의 텍셀이 더 작아짐. 대신 카메라가 돌 때 그림자 가장자리가 지글거림.',
    '그림자 거리를 300으로 늘리면 A의 근경 그림자가 거의 사라짐. B는 첫 구간이 좁게 남아 덜 나빠짐.',
  ],
  refs: [
    { type: 'paper', title: 'Parallel-Split Shadow Maps for Large-scale Virtual Environments (Fan Zhang, Hanqiu Sun, Leilei Xu, Lee Kit Lun)', year: 2006, note: 'VRCIA 2006. PSSM 분할식 (log와 uniform을 λ로 섞음).' },
    { type: 'book', title: 'GPU Gems 3, Chapter 10: Parallel-Split Shadow Maps on Programmable GPUs (Fan Zhang, Hanqiu Sun, Oskari Nyman)', url: 'https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-10-parallel-split-shadow-maps-programmable-gpus', year: 2007 },
    { type: 'article', title: 'Cascaded Shadow Maps (Microsoft Docs)', url: 'https://learn.microsoft.com/en-us/windows/win32/dxtecharts/cascaded-shadow-maps', note: '구간 선택, 경계 구 맞춤, 텍셀 스냅으로 shimmering 제거.' },
    { type: 'book', title: 'ShaderX6: Stable Rendering of Cascaded Shadow Maps (Michal Valient)', year: 2008, note: 'Killzone 2의 경계 구 맞춤과 텍셀 스냅.' },
    { type: 'article', title: 'LearnOpenGL: CSM', url: 'https://learnopengl.com/Guest-Articles/2021/CSM' },
  ],
  params: [
    { key: 'count', label: '구간 수', type: 'select', group: '캐스케이드', options: [1, 2, 3, 4], a: 1, b: 4 },
    { key: 'split', label: '분할 방식', type: 'select', options: [
      { value: 'uniform', label: 'uniform (같은 간격)' },
      { value: 'log', label: 'log (같은 비율)' },
      { value: 'pssm', label: 'PSSM (λ로 섞음)' },
    ], default: 'pssm', when: (p) => +p.count > 1 },
    { key: 'lambda', label: 'PSSM λ', type: 'range', min: 0, max: 1, step: 0.05, default: 0.8, when: (p) => +p.count > 1 && p.split === 'pssm' },
    { key: 'stabilize', label: '안정화 (경계 구 + 텍셀 스냅)', type: 'bool', default: true },
    { key: 'showCasc', label: '구간 색 보기', type: 'bool', a: false, b: true },
    { key: 'res', label: '구간당 해상도', type: 'select', group: '섀도 맵', options: [512, 1024, 2048], default: 1024 },
    { key: 'maxDist', label: '그림자 거리 (m)', type: 'range', min: 20, max: 300, step: 5, default: 100 },
    { key: 'showAtlas', label: '섀도 맵 보기 (좌하단)', type: 'bool', default: false },
    { key: 'lightElev', label: '광원 고도 (°)', type: 'range', min: 10, max: 80, step: 1, default: 35, shared: true, group: '장면' },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Cascaded Shadow Maps (CSM)',
    summary: 'If one shadow map covers a wide outdoor area, shadows near the camera turn blurry. Split the view by distance and give each range its own shadow map. Near areas get dense coverage, and far areas get wide coverage.',
    views: { a: 'Single shadow map', b: '4 cascades' },
    controls: 'Mouse drag: rotate camera, wheel: zoom',
    info: `
    <p>A directional light shadow map covers the whole shadow distance with one orthographic projection. If 1024 texels cover 100 m, one texel is 10 cm or more. Shadows of objects in front of the camera turn into blurry stair steps.</p>
    <p><b>Cascaded shadow maps (CSM)</b> split the camera view (frustum) into depth ranges. Each range renders its own shadow map that wraps only that range. Near ranges cover a small area at the same resolution, so they stay sharp.</p>
    <p>Split methods:</p>
    <ul>
      <li><b>uniform</b>: equal spacing. The near range is too wide, so it helps little.</li>
      <li><b>log</b>: constant distance ratio. It matches perspective distortion, but the first range is too narrow.</li>
      <li><b>PSSM</b> (Zhang 2006): blends the two methods by λ. In practice, λ of 0.5~0.9 is common.</li>
    </ul>
    <p><b>Stabilization</b>: if the shadow map area changes every time the camera turns, texel edges move and shadow edges shimmer. Wrap each range in a bounding sphere to fix its size, and snap the shadow map origin to the texel grid (texel snapping). The shimmer stops. But the area grows, so resolution drops a little.</p>
    <p>Downsides: shadow passes grow with the number of cascades. Resolution changes suddenly at cascade borders, so a line can show. Engines blend or dither the two cascades at the border.</p>`,
    look: [
      'In A, the shadows of posts and fences in front of the camera turn into thick blurry steps. B has the same resolution but stays sharp.',
      'Turn on "Show cascade colors". Cascades show in red, green, blue, and yellow order. Change the split to uniform. The red cascade gets very wide, and near shadows blur again.',
      'Turn off "Stabilization". B\'s texels get smaller. But shadow edges shimmer as the camera turns.',
      'Raise shadow distance to 300. A\'s near shadows almost disappear. In B, the first cascade stays narrow, so it gets less bad.',
    ],
    refs: ['VRCIA 2006. The PSSM split formula (blends log and uniform by λ).', null, 'Cascade selection, bounding sphere fitting, and texel snapping to remove shimmering.', 'Bounding sphere fitting and texel snapping in Killzone 2.', null],
    params: {
      count: { label: 'Cascade count', group: 'Cascades' },
      split: { label: 'Split method', options: { uniform: 'uniform (equal spacing)', log: 'log (equal ratio)', pssm: 'PSSM (blend by λ)' } },
      stabilize: 'Stabilization (bounding sphere + texel snap)',
      showCasc: 'Show cascade colors',
      res: { label: 'Resolution per cascade', group: 'Shadow map' },
      maxDist: 'Shadow distance (m)',
      showAtlas: 'Show shadow map (bottom left)',
      lightElev: { label: 'Light elevation (°)', group: 'Scene' },
      autoRotate: 'Auto rotate',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params, G = U.geometry;
    const T = M.translation, S = M.scaling;
    const rng = ctx.rng;
    const cube = G.upload(gl, G.cube(1)), sph = G.upload(gl, G.sphere(1, 24, 12)), ground = G.upload(gl, G.plane(600, 1, 1));

    // ── 장면: 카메라 근처 정밀한 물체 + 멀리 흩어진 건물, 나무 ──
    const objs = [{ m: ground, w: M.create(), c: [0.6, 0.62, 0.55] }];
    for (let i = 0; i < 12; i++) objs.push({ m: cube, w: M.mul(T(-2.75 + i * 0.5, 0.5, 1.6), S(0.06, 1.0, 0.06)), c: [0.75, 0.65, 0.5] });
    objs.push({ m: cube, w: M.mul(T(0, 0.85, 1.6), S(6, 0.06, 0.06)), c: [0.75, 0.65, 0.5] });
    objs.push({ m: cube, w: M.mul(T(1.2, 0.4, -0.6), M.rotationY(0.5), S(0.8, 0.8, 0.8)), c: [0.8, 0.4, 0.3] });
    objs.push({ m: sph, w: M.mul(T(-1.4, 0.6, -0.8), S(0.6)), c: [0.4, 0.6, 0.85] });
    objs.push({ m: cube, w: M.mul(T(-0.3, 1.4, -2.2), S(0.12, 2.8, 0.12)), c: [0.7, 0.7, 0.72] });
    for (let i = 0; i < 180; i++) {
      const r = 6 + Math.pow(rng.range(0, 1), 0.7) * 140, a = rng.range(0, U.TAU);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (rng.chance(0.55)) {
        const h = rng.range(2, 14), wx = rng.range(1.5, 6), wz = rng.range(1.5, 6);
        objs.push({ m: cube, w: M.mul(T(x, h / 2, z), M.rotationY(rng.range(0, 3)), S(wx, h, wz)), c: [rng.range(0.6, 0.85), rng.range(0.55, 0.75), rng.range(0.5, 0.7)] });
      } else {
        const h = rng.range(1.5, 4);
        objs.push({ m: cube, w: M.mul(T(x, h / 2, z), S(0.25, h, 0.25)), c: [0.45, 0.35, 0.25] });
        objs.push({ m: sph, w: M.mul(T(x, h + 0.6, z), S(rng.range(0.9, 1.6))), c: [0.3, 0.55, 0.28] });
      }
    }
    for (const o of objs) o.n = M.normalMatrix(o.w);

    const depthProg = U.gl.program(gl, `#version 300 es
      in vec3 a_position; uniform mat4 u_lvp; uniform mat4 u_world;
      void main(){ gl_Position = u_lvp * u_world * vec4(a_position, 1.0); }`, `#version 300 es
      precision mediump float; out vec4 o_c; void main(){ o_c = vec4(1.0); }`);
    const prog = U.gl.program(gl, `#version 300 es
      in vec3 a_position; in vec3 a_normal;
      uniform mat4 u_vp; uniform mat4 u_view; uniform mat4 u_world; uniform mat3 u_nmat;
      out vec3 v_pos; out vec3 v_n; out float v_z;
      void main(){
        vec4 wp = u_world * vec4(a_position, 1.0);
        v_pos = wp.xyz; v_n = u_nmat * a_normal; v_z = -(u_view * wp).z;
        gl_Position = u_vp * wp;
      }`, `#version 300 es
      precision highp float;
      precision highp sampler2DShadow;
      uniform sampler2DShadow u_sm; uniform mat4 u_lvp[4]; uniform vec4 u_splits; uniform vec4 u_texel;
      uniform int u_count; uniform float u_cols; uniform vec2 u_tile; uniform vec2 u_atlasTexel;
      uniform vec3 u_L; uniform vec3 u_color; uniform float u_showCasc; uniform vec4 u_bias;
      in vec3 v_pos; in vec3 v_n; in float v_z;
      out vec4 o_color;
      const vec3 CC[4] = vec3[4](vec3(1.0, 0.3, 0.3), vec3(0.3, 1.0, 0.3), vec3(0.35, 0.5, 1.0), vec3(1.0, 0.9, 0.3));
      void main(){
        vec3 N = normalize(v_n);
        float NoL = max(dot(N, u_L), 0.0);
        float s = 1.0;
        int idx = -1;
        for (int i = 0; i < 4; i++) { if (i < u_count && v_z < u_splits[i]) { idx = i; break; } }
        if (idx >= 0 && NoL > 0.0) {
          float tx = u_texel[idx];
          vec4 lp = u_lvp[idx] * vec4(v_pos + N * tx * 1.5, 1.0);
          vec3 q = lp.xyz / lp.w * 0.5 + 0.5;
          vec2 cell = vec2(mod(float(idx), u_cols), floor(float(idx) / u_cols));
          vec2 lo = cell * u_tile + u_atlasTexel, hi = (cell + 1.0) * u_tile - u_atlasTexel;
          vec2 uv = (cell + q.xy) * u_tile;
          float sum = 0.0;
          for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++)
            sum += texture(u_sm, vec3(clamp(uv + vec2(float(x), float(y)) * u_atlasTexel, lo, hi), q.z - u_bias[idx]));
          s = q.z > 1.0 ? 1.0 : sum / 9.0;
        }
        vec3 alb = pow(u_color, vec3(2.2));
        vec2 ck = floor(v_pos.xz);
        if (N.y > 0.9 && v_pos.y < 0.01) alb *= mod(ck.x + ck.y, 2.0) < 0.5 ? 0.9 : 1.0;
        if (u_showCasc > 0.5 && idx >= 0) alb *= CC[idx];
        vec3 c = alb * (vec3(0.18, 0.21, 0.28) * (0.6 + 0.4 * N.y) + vec3(1.0, 0.94, 0.82) * 2.0 * NoL * s);
        float fog = 1.0 - exp(-v_z * 0.004);
        c = mix(c, vec3(0.55, 0.65, 0.8), fog);
        c = c / (1.0 + c);
        o_color = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
      }`);
    const atlasProg = U.gl.program(gl, `#version 300 es
      in vec2 a_pos; out vec2 v_uv; void main(){ v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`, `#version 300 es
      precision highp float; uniform highp sampler2D u_tex; in vec2 v_uv; out vec4 o_c;
      void main(){ float d = texture(u_tex, v_uv).r; o_c = vec4(vec3(pow(d, 4.0)), 1.0); }`);
    const quad = U.gl.quad(gl);

    // ── 섀도 아틀라스 (깊이 텍스처, 비교 모드 → 하드웨어 2x2 PCF) ──
    let atlas = null;
    function makeAtlas(count, res) {
      if (atlas) { gl.deleteTexture(atlas.tex); gl.deleteFramebuffer(atlas.fb); }
      const cols = count > 1 ? 2 : 1, rows = count > 2 ? 2 : 1;
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, cols * res, rows * res, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0);
      gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      atlas = { tex, fb, count, res, cols, rows };
    }

    // ── 캐스케이드 계산 ──
    const NEAR = 0.1, FOV = U.rad(50);
    function splits(n, far, mode, lambda) {
      const out = [NEAR];
      for (let i = 1; i <= n; i++) {
        const f = i / n, lin = NEAR + (far - NEAR) * f, lg = NEAR * Math.pow(far / NEAR, f);
        out.push(mode === 'uniform' ? lin : mode === 'log' ? lg : U.lerp(lin, lg, lambda));
      }
      return out;
    }
    function fitCascade(invView, aspect, zn, zf, L, res, stable) {
      const th = Math.tan(FOV / 2), pts = [];
      for (const z of [zn, zf]) for (const sx of [-1, 1]) for (const sy of [-1, 1]) pts.push(M.transformPoint(invView, [sx * z * th * aspect, sy * z * th, -z]));
      const up = Math.abs(L[1]) > 0.99 ? [0, 0, 1] : [0, 1, 0];
      const BACK = 100;
      let lv, ortho, texel, range;
      if (stable) {
        const c = [0, 1, 2].map((k) => pts.reduce((s, p) => s + p[k], 0) / 8);
        let r = 0; for (const p of pts) r = Math.max(r, Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]));
        r = Math.ceil(r * 16) / 16;
        lv = M.lookAt([c[0] + L[0] * (r + BACK), c[1] + L[1] * (r + BACK), c[2] + L[2] * (r + BACK)], c, up);
        range = 2 * r + BACK + 10;
        ortho = M.ortho(-r, r, -r, r, 0.1, range);
        texel = 2 * r / res;
        // 텍셀 스냅: 월드 원점이 항상 텍셀 격자에 오도록 투영을 평행 이동
        const o = M.transformPoint(M.multiply(ortho, lv), [0, 0, 0]);
        const sx = o[0] * res / 2, sy = o[1] * res / 2;
        ortho[12] += (Math.round(sx) - sx) * 2 / res;
        ortho[13] += (Math.round(sy) - sy) * 2 / res;
      } else {
        // 빠듯한 맞춤: 광원 공간 AABB. 카메라 회전마다 크기와 위치가 바뀜
        const c = [0, 1, 2].map((k) => pts.reduce((s, p) => s + p[k], 0) / 8);
        let r = 0; for (const p of pts) r = Math.max(r, Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]));
        const back = BACK + r;
        lv = M.lookAt([c[0] + L[0] * back, c[1] + L[1] * back, c[2] + L[2] * back], c, up);
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
        for (const p of pts) { const q = M.transformPoint(lv, p); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); z0 = Math.min(z0, q[2]); z1 = Math.max(z1, q[2]); }
        range = -z0 + 10;
        ortho = M.ortho(x0, x1, y0, y1, 0.1, range);
        texel = Math.max(x1 - x0, y1 - y0) / res;
      }
      return { vp: M.multiply(ortho, lv), texel, range };
    }

    const cam = { yaw: 0.6, pitch: 0.22, dist: 6, drag: false, lx: 0, ly: 0 };
    const lvpArr = new Float32Array(64);

    return {
      update(dt) {
        if (P.autoRotate && !cam.drag) cam.yaw += dt * 0.1;
        if (ctx.input.mouse.wheel) cam.dist = U.clamp(cam.dist * Math.pow(1.12, ctx.input.mouse.wheel), 2, 40);
      },
      onPointer(type, m) {
        if (type === 'down') { cam.drag = true; cam.lx = m.x; cam.ly = m.y; }
        else if (type === 'up' || type === 'leave') cam.drag = false;
        else if (type === 'move' && cam.drag) {
          cam.yaw -= (m.x - cam.lx) * 0.008; cam.pitch = U.clamp(cam.pitch + (m.y - cam.ly) * 0.008, 0.03, 1.4);
          cam.lx = m.x; cam.ly = m.y;
        }
      },
      render() {
        const n = +P.count, res = +P.res;
        if (!atlas || atlas.count !== n || atlas.res !== res) makeAtlas(n, res);
        const el = U.rad(P.lightElev), ly = 2.2;
        const L = [Math.cos(el) * Math.sin(ly), Math.sin(el), Math.cos(el) * Math.cos(ly)];
        const tgt = [0, 0.8, 0];
        const eye = M.orbitEye(tgt, cam.yaw, cam.pitch, cam.dist);
        const view = M.lookAt(eye, tgt), invView = M.invert(view);
        const aspect = ctx.width / ctx.height;
        const proj = M.perspective(FOV, aspect, NEAR, 600);
        const vp = M.multiply(proj, view);
        const sp = splits(n, P.maxDist, P.split, P.lambda);
        const casc = [];
        for (let i = 0; i < n; i++) casc.push(fitCascade(invView, aspect, sp[i], sp[i + 1], L, res, P.stabilize));

        // ── 그림자 패스: 구간마다 아틀라스 칸에 렌더 ──
        const t0 = ctx.now();
        gl.bindFramebuffer(gl.FRAMEBUFFER, atlas.fb);
        gl.viewport(0, 0, atlas.cols * res, atlas.rows * res);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.5, 3);
        depthProg.use();
        for (let i = 0; i < n; i++) {
          gl.viewport((i % atlas.cols) * res, Math.floor(i / atlas.cols) * res, res, res);
          gl.uniformMatrix4fv(depthProg.u('u_lvp'), false, casc[i].vp);
          for (const o of objs) { gl.uniformMatrix4fv(depthProg.u('u_world'), false, o.w); o.m.draw(depthProg); }
        }
        gl.disable(gl.POLYGON_OFFSET_FILL);

        // ── 카메라 패스 ──
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clearColor(0.55, 0.65, 0.8, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        prog.use();
        lvpArr.fill(0);
        for (let i = 0; i < n; i++) lvpArr.set(casc[i].vp, i * 16);
        const spl = [0, 0, 0, 0], tex = [0, 0, 0, 0], bias = [0, 0, 0, 0];
        for (let i = 0; i < n; i++) { spl[i] = sp[i + 1]; tex[i] = casc[i].texel; bias[i] = (0.02 + casc[i].texel) / casc[i].range; }
        gl.uniformMatrix4fv(prog.u('u_vp'), false, vp);
        gl.uniformMatrix4fv(prog.u('u_view'), false, view);
        gl.uniformMatrix4fv(prog.u('u_lvp[0]'), false, lvpArr);
        gl.uniform4fv(prog.u('u_splits'), spl);
        gl.uniform4fv(prog.u('u_texel'), tex);
        gl.uniform4fv(prog.u('u_bias'), bias);
        gl.uniform1i(prog.u('u_count'), n);
        gl.uniform1f(prog.u('u_cols'), atlas.cols);
        gl.uniform2f(prog.u('u_tile'), 1 / atlas.cols, 1 / atlas.rows);
        gl.uniform2f(prog.u('u_atlasTexel'), 1 / (atlas.cols * res), 1 / (atlas.rows * res));
        gl.uniform3fv(prog.u('u_L'), L);
        gl.uniform1f(prog.u('u_showCasc'), P.showCasc ? 1 : 0);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, atlas.tex); gl.uniform1i(prog.u('u_sm'), 0);
        for (const o of objs) {
          gl.uniformMatrix4fv(prog.u('u_world'), false, o.w);
          gl.uniformMatrix3fv(prog.u('u_nmat'), false, o.n);
          gl.uniform3fv(prog.u('u_color'), o.c);
          o.m.draw(prog);
        }
        if (P.showAtlas) {
          const s = Math.round(Math.min(ctx.pixelWidth, ctx.pixelHeight) * 0.3);
          gl.disable(gl.DEPTH_TEST);
          gl.viewport(8, 8, Math.round(s * atlas.cols / atlas.rows), s);
          // 비교 모드와 LINEAR 필터를 잠시 끄고 깊이 값을 그대로 읽음
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          atlasProg.use();
          gl.uniform1i(atlasProg.u('u_tex'), 0);
          quad.draw(atlasProg);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
        gl.disable(gl.DEPTH_TEST);

        ctx.stat(GTL.L('구간 경계 (m)', 'Cascade splits (m)'), sp.map((v) => (v < 10 ? v.toFixed(1) : v.toFixed(0))).join(' / '));
        ctx.stat(GTL.L('근경 텍셀 크기 (cm)', 'Near texel size (cm)'), (casc[0].texel * 100).toFixed(1));
        ctx.stat(GTL.L('원경 텍셀 크기 (cm)', 'Far texel size (cm)'), (casc[n - 1].texel * 100).toFixed(1));
        ctx.stat(GTL.L('그림자 드로 콜', 'Shadow draw calls'), n * objs.length);
        ctx.stat(GTL.L('섀도 맵 메모리 (MB)', 'Shadow map memory (MB)'), (atlas.cols * atlas.rows * res * res * 4 / 1048576).toFixed(0));
        ctx.stat(GTL.L('CPU 제출 ms', 'CPU submit ms'), (ctx.now() - t0).toFixed(2));
      },
    };
  },
});
