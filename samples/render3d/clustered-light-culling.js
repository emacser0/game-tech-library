// 타일드/클러스터드 라이트 컬링: 모든 라이트 계산 vs 화면 타일별 목록 vs 타일 × 깊이 클러스터 목록, 히트맵
GTL.register({
  id: 'clustered-light-culling',
  title: '타일드 & 클러스터드 라이트 컬링',
  summary: '점광원 수백 개를 모든 픽셀에서 다 계산하면 비용이 "픽셀 수 × 라이트 수"가 됨. 화면을 타일(과 깊이 구간)로 나누고 칸마다 닿는 라이트 목록만 계산하면 화면은 같고 계산량은 크게 줄어듦.',
  renderer: 'webgl2',
  pixelRatio: 1,
  views: { a: '모든 라이트 계산', b: '클러스터드 (타일 × 깊이)' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌',
  info: `
    <p>점광원은 반경 밖에 영향이 없음. 그래도 단순한 포워드 렌더링은 픽셀마다 모든 라이트를 반복함. 라이트 256개면 픽셀당 256번 계산함.</p>
    <p><b>타일드 컬링(tiled culling)</b>:</p>
    <ol>
      <li>화면을 32×32 픽셀 타일로 나눔.</li>
      <li>라이트의 경계 구를 화면에 투영해 덮는 타일 범위를 구함.</li>
      <li>타일마다 라이트 인덱스 목록을 만들어 GPU에 올림. 셰이더는 자기 타일 목록만 반복함.</li>
    </ol>
    <p>단점: 타일 하나에 가까운 물체와 먼 배경이 함께 있으면, 깊이 방향으로 멀리 떨어진 라이트도 목록에 들어감. 그래서 깊이가 크게 바뀌는 실루엣에서 목록이 길어짐.</p>
    <p><b>클러스터드 컬링(clustered culling)</b>(Olsson 2012): 타일을 다시 깊이 방향 로그 구간으로 나눠 3D 격자(클러스터)를 만듦. 라이트는 깊이 범위가 겹치는 클러스터에만 들어감. 깊이 버퍼 없이도 동작해 반투명 물체에도 씀.</p>
    <p>이 샘플은 목록을 CPU에서 만들고 정수 텍스처로 올림. 실제 엔진은 컴퓨트 셰이더로 만듦. 라이트 감쇠를 반경에서 정확히 0이 되게 만들어서 세 방식의 화면이 같음.</p>`,
  // 도식: 옆에서 본 화면 타일. 타일드는 깊이 전체의 라이트를, 클러스터드는 깊이 구간의 라이트만 목록에 넣음
  diagram: (L) => `<svg viewBox="0 0 540 210" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="14">${L('타일드: 타일 하나에 깊이 전체', 'Tiled: one tile spans all depths')}</text>
    <circle cx="20" cy="100" r="4" class="f-accent"/>
    <line x1="20" y1="100" x2="250" y2="20" class="d-dim"/>
    <line x1="20" y1="100" x2="250" y2="60" class="d-dim"/>
    <line x1="20" y1="100" x2="250" y2="100" class="d-dim"/>
    <line x1="20" y1="100" x2="250" y2="140" class="d-dim"/>
    <line x1="20" y1="100" x2="250" y2="180" class="d-dim"/>
    <path d="M20,100 L250,100 L250,140 Z" class="f-dim"/>
    <circle cx="70.6" cy="104.4" r="5" class="f-accent"/>
    <circle cx="123.5" cy="107.2" r="5" class="f-accent"/>
    <circle cx="181" cy="116.8" r="5" class="f-accent"/>
    <circle cx="231.6" cy="118.4" r="5" class="f-accent"/>
    <text x="10" y="170" class="t-small">${L('칠한 타일의 목록: 라이트 4개', 'Shaded tile list: 4 lights')}</text>
    <text x="10" y="184" class="t-small t-dim">${L('가까운 물체 픽셀도 4개를 모두 반복', 'Near pixels still loop over all 4')}</text>
    <text x="290" y="14" class="t-b">${L('B 클러스터드: 깊이도 로그 구간으로', 'B clustered: also split depth (log)')}</text>
    <circle cx="290" cy="100" r="4" class="f-accent"/>
    <line x1="290" y1="100" x2="520" y2="20" class="d-dim"/>
    <line x1="290" y1="100" x2="520" y2="60" class="d-dim"/>
    <line x1="290" y1="100" x2="520" y2="100" class="d-dim"/>
    <line x1="290" y1="100" x2="520" y2="140" class="d-dim"/>
    <line x1="290" y1="100" x2="520" y2="180" class="d-dim"/>
    <path d="M290,100 L520,100 L520,140 Z" class="f-dim"/>
    <line x1="317.6" y1="90.4" x2="317.6" y2="109.6" class="d-dim" stroke-dasharray="3 2"/>
    <line x1="347.5" y1="80" x2="347.5" y2="120" class="d-dim" stroke-dasharray="3 2"/>
    <line x1="405" y1="60" x2="405" y2="140" class="d-dim" stroke-dasharray="3 2"/>
    <line x1="520" y1="20" x2="520" y2="180" class="d-dim" stroke-dasharray="3 2"/>
    <circle cx="340.6" cy="104.4" r="5" class="f-b"/>
    <circle cx="393.5" cy="107.2" r="5" class="f-b"/>
    <circle cx="451" cy="116.8" r="5" class="f-b"/>
    <circle cx="501.6" cy="118.4" r="5" class="f-b"/>
    <text x="290" y="170" class="t-small">${L('클러스터마다 깊이가 겹치는 라이트만', 'Each cluster keeps lights in its depth')}</text>
    <text x="290" y="184" class="t-small t-dim">${L('한 픽셀이 보는 목록: 1~2개', 'List per pixel: 1~2 lights')}</text>
    <text x="10" y="204" class="t-small t-a">${L('A (컬링 없음)는 픽셀마다 라이트 전부를 반복함', 'A (no culling) loops over every light for every pixel')}</text>
  </svg>`,
  look: [
    '두 뷰의 조명은 같음. "평가 수 히트맵"을 켜면 A는 전체가 빨강(라이트 전부), B는 라이트가 모인 곳만 밝음.',
    'B를 "타일 2D"로 바꾸면 기둥 실루엣 주변처럼 깊이 차가 큰 타일이 밝아짐. 클러스터는 이 부분이 줄어듦.',
    '라이트 수를 512로 올리면 A의 프레임 비용(⏱, GPU ms)이 크게 늘어남. B는 덜 늘어남.',
    '라이트 반경을 8로 키우면 목록이 길어져 컬링 이득이 줄어듦.',
  ],
  refs: [
    { type: 'paper', title: 'Clustered Deferred and Forward Shading (Ola Olsson, Markus Billeter, Ulf Assarsson)', url: 'https://doi.org/10.2312/EGGH/HPG12/087-096', year: 2012, note: 'HPG 2012. 클러스터드 셰이딩 원 논문.' },
    { type: 'paper', title: 'Tiled Shading (Ola Olsson, Ulf Assarsson)', year: 2011, note: 'Journal of Graphics, GPU, and Game Tools. 타일드 디퍼드, 포워드 비교.' },
    { type: 'talk', title: 'Forward+: Bringing Deferred Lighting to the Next Level (Takahiro Harada, Jay McKee, Jason C. Yang)', year: 2012, note: 'Eurographics 2012 Short Papers. 타일드 포워드.' },
    { type: 'talk', title: 'Practical Clustered Shading (Emil Persson)', year: 2013, note: 'SIGGRAPH 2013 Advances in Real-Time Rendering. Just Cause 3의 CPU 클러스터 구성.' },
    { type: 'talk', title: 'DOOM (2016): The devil is in the details (Tiago Sousa, Jean Geffroy)', year: 2016, note: 'SIGGRAPH 2016 Advances. 클러스터드 포워드 렌더링.' },
  ],
  params: [
    { key: 'mode', label: '컬링', type: 'select', group: '컬링', options: [
      { value: 0, label: '없음 (모든 라이트)' },
      { value: 1, label: '타일 2D' },
      { value: 2, label: '클러스터 (타일 × 깊이 16)' },
    ], a: 0, b: 2 },
    { key: 'tile', label: '타일 크기 (px)', type: 'select', options: [16, 32, 64], default: 32, when: (p) => +p.mode > 0 },
    { key: 'showHeat', label: '평가 수 히트맵', type: 'bool', default: true },
    { key: 'heatMax', label: '히트맵 최대값', type: 'int', min: 8, max: 256, default: 48, when: (p) => p.showHeat },
    { key: 'count', label: '라이트 수', type: 'int', min: 16, max: 512, step: 16, default: 256, shared: true, group: '장면' },
    { key: 'radius', label: '라이트 반경 (m)', type: 'range', min: 1, max: 8, step: 0.1, default: 3, shared: true },
    { key: 'move', label: '라이트 이동', type: 'bool', default: true, shared: true },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Tiled & Clustered Light Culling',
    summary: 'If every pixel computes hundreds of point lights, the cost is "pixel count × light count". Split the screen into tiles (and depth ranges), and compute only the lights that reach each cell. The picture stays the same, and the work drops a lot.',
    views: { a: 'All lights', b: 'Clustered (tile × depth)' },
    controls: 'Mouse drag: rotate camera, wheel: zoom',
    info: `
    <p>A point light has no effect outside its radius. Still, simple forward rendering loops over every light for every pixel. With 256 lights, each pixel computes 256 times.</p>
    <p><b>Tiled culling</b>:</p>
    <ol>
      <li>Split the screen into 32×32 pixel tiles.</li>
      <li>Project each light's bounding sphere onto the screen and find the tiles it covers.</li>
      <li>Build a light index list per tile and upload it to the GPU. The shader loops only over its own tile's list.</li>
    </ol>
    <p>Downside: if one tile holds both a near object and a far background, lights far apart in depth still enter the list. So lists get long at silhouettes where depth changes a lot.</p>
    <p><b>Clustered culling</b> (Olsson 2012): split each tile again into log depth ranges to build a 3D grid (clusters). A light enters only the clusters whose depth range it overlaps. It works without a depth buffer, so it also works for transparent objects.</p>
    <p>This sample builds the lists on the CPU and uploads them as an integer texture. Real engines build them with compute shaders. Light falloff reaches exactly 0 at the radius, so all three methods give the same picture.</p>`,
    look: [
      'Both views have the same lighting. Turn on "Light count heatmap". A is red everywhere (all lights). B is bright only where lights gather.',
      'Switch B to "2D tiles". Tiles with large depth differences, like around pillar silhouettes, get brighter. Clusters reduce this.',
      'Raise light count to 512. A\'s frame cost (⏱, GPU ms) grows a lot. B grows less.',
      'Raise light radius to 8. Lists get longer, and the culling gain shrinks.',
    ],
    refs: ['HPG 2012. The original clustered shading paper.', 'Journal of Graphics, GPU, and Game Tools. Compares tiled deferred and forward.', 'Eurographics 2012 Short Papers. Tiled forward.', 'SIGGRAPH 2013 Advances in Real-Time Rendering. CPU cluster building in Just Cause 3.', 'SIGGRAPH 2016 Advances. Clustered forward rendering.'],
    params: {
      mode: { label: 'Culling', group: 'Culling', options: { 0: 'None (all lights)', 1: '2D tiles', 2: 'Clusters (tile × 16 depth)' } },
      tile: 'Tile size (px)',
      showHeat: 'Light count heatmap',
      heatMax: 'Heatmap max',
      count: { label: 'Light count', group: 'Scene' },
      radius: 'Light radius (m)',
      move: 'Move lights',
      autoRotate: 'Auto rotate',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params, G = U.geometry;
    const T = M.translation, S = M.scaling;
    const rng = ctx.rng;
    const MAXL = 512, SLICES = 16, CNEAR = 1, CFAR = 80, GRID_W = 256, IDX_W = 1024, IDX_MAX = IDX_W * 512;

    // ── 장면 ──
    const cube = G.upload(gl, G.cube(1)), sph = G.upload(gl, G.sphere(1, 24, 12)), floor = G.upload(gl, G.plane(44, 1, 1));
    const objs = [{ m: floor, w: M.create(), c: [0.7, 0.7, 0.7] }];
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
      const x = (i - 3) * 5.5, z = (j - 3) * 5.5;
      objs.push({ m: cube, w: M.mul(T(x, 1.75, z), S(0.8, 3.5, 0.8)), c: [0.75, 0.72, 0.68] });
      if ((i + j) % 2) objs.push({ m: sph, w: M.mul(T(x + 2.7, 0.7, z + 2.7), S(0.7)), c: [0.8, 0.8, 0.85] });
    }
    for (const o of objs) o.n = M.normalMatrix(o.w);

    // ── 라이트 (시드 고정) ──
    const lights = [];
    for (let i = 0; i < MAXL; i++) {
      const h = rng.range(0, 1), s = 0.9, l = 0.55;
      const k = (n) => (n + h * 12) % 12, a = s * Math.min(l, 1 - l);
      const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      lights.push({ bx: rng.range(-20, 20), bz: rng.range(-20, 20), y: rng.range(0.3, 2.2), or: rng.range(0.5, 3), sp: rng.range(-1, 1), ph: rng.range(0, U.TAU), c: [f(0), f(8), f(4)] });
    }
    const lightData = new Float32Array(MAXL * 2 * 4);
    const lightTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, lightTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, MAXL, 2, 0, gl.RGBA, gl.FLOAT, null);
    U.gl.textureParams(gl, lightTex, { filter: 'nearest' });
    const gridTex = gl.createTexture(), idxTex = gl.createTexture();
    // 정수 텍스처는 NEAREST만 가능. 컬링 없음 모드에서도 유효하도록 1x1로 초기화
    gl.bindTexture(gl.TEXTURE_2D, gridTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32UI, 1, 1, 0, gl.RG_INTEGER, gl.UNSIGNED_INT, new Uint32Array(2));
    gl.bindTexture(gl.TEXTURE_2D, idxTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32UI, 1, 1, 0, gl.RED_INTEGER, gl.UNSIGNED_INT, new Uint32Array(1));
    for (const t of [gridTex, idxTex]) U.gl.textureParams(gl, t, { filter: 'nearest' });
    const pointBuf = gl.createBuffer();
    const pointData = new Float32Array(MAXL * 6);

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
      precision highp int;
      precision highp usampler2D;
      uniform highp sampler2D u_lights; uniform usampler2D u_grid; uniform usampler2D u_idx;
      uniform int u_mode; uniform int u_count; uniform int u_tile; uniform int u_tilesX; uniform int u_tilesY; uniform int u_slices;
      uniform float u_cnear; uniform float u_logNF; uniform vec3 u_color; uniform vec3 u_eye;
      uniform float u_heat; uniform float u_heatMax;
      in vec3 v_pos; in vec3 v_n; in float v_z;
      out vec4 o_color;
      vec3 ramp(float t) {
        t = clamp(t, 0.0, 1.0);
        return clamp(vec3(1.5 * t * 2.0 - 1.0, sin(t * 3.14159), 1.0 - t * 2.0) + vec3(0.0, 0.0, 0.2), 0.0, 1.0);
      }
      void main(){
        vec3 N = normalize(v_n), V = normalize(u_eye - v_pos);
        vec3 alb = pow(u_color, vec3(2.2));
        int cnt = u_count, off = 0;
        if (u_mode > 0) {
          ivec2 t = ivec2(gl_FragCoord.xy) / u_tile;
          t = clamp(t, ivec2(0), ivec2(u_tilesX - 1, u_tilesY - 1));
          int s = 0;
          if (u_slices > 1) s = clamp(int(floor(log(max(v_z, u_cnear) / u_cnear) / u_logNF * float(u_slices))), 0, u_slices - 1);
          int cell = (s * u_tilesY + t.y) * u_tilesX + t.x;
          uvec2 g = texelFetch(u_grid, ivec2(cell % ${GRID_W}, cell / ${GRID_W}), 0).xy;
          off = int(g.x); cnt = int(g.y);
        }
        vec3 c = alb * vec3(0.02, 0.022, 0.03);
        for (int i = 0; i < ${MAXL}; i++) {
          if (i >= cnt) break;
          int li = i;
          if (u_mode > 0) { int k = off + i; li = int(texelFetch(u_idx, ivec2(k % ${IDX_W}, k / ${IDX_W}), 0).r); }
          vec4 lp = texelFetch(u_lights, ivec2(li, 0), 0);
          vec3 lc = texelFetch(u_lights, ivec2(li, 1), 0).rgb;
          vec3 L = lp.xyz - v_pos;
          float d2 = dot(L, L);
          float x = d2 / (lp.w * lp.w);
          float win = clamp(1.0 - x * x, 0.0, 1.0);
          float att = win * win / (d2 + 1.0);
          L *= inversesqrt(max(d2, 1e-6));
          vec3 H = normalize(L + V);
          float NoL = max(dot(N, L), 0.0);
          c += lc * att * (alb * NoL + 0.25 * pow(max(dot(N, H), 0.0), 32.0) * NoL) * 4.0;
        }
        c = c / (1.0 + c);
        c = pow(c, vec3(1.0 / 2.2));
        if (u_heat > 0.5) c = mix(c, ramp(float(cnt) / u_heatMax), 0.55);
        o_color = vec4(c, 1.0);
      }`);
    const pointProg = U.gl.program(gl, `#version 300 es
      in vec3 a_position; in vec3 a_color; uniform mat4 u_vp; uniform float u_size; out vec3 v_c;
      void main(){ gl_Position = u_vp * vec4(a_position, 1.0); gl_PointSize = clamp(u_size / gl_Position.w, 2.0, 12.0); v_c = a_color; }`, `#version 300 es
      precision mediump float; in vec3 v_c; out vec4 o_color;
      void main(){ vec2 p = gl_PointCoord * 2.0 - 1.0; if (dot(p, p) > 1.0) discard; o_color = vec4(mix(v_c, vec3(1.0), 0.5), 1.0); }`);

    // ── CPU 컬링 버퍼 ──
    let cellCount = 0, gridData = new Uint32Array(0), cellN = new Uint32Array(0);
    const idxData = new Uint32Array(IDX_MAX);
    const lightCells = new Int32Array(MAXL * 6); // tx0, tx1, ty0, ty1, s0, s1
    let stats = { avg: 0, max: 0, total: 0, overflow: false, ms: 0 };

    function cull(view, proj, W, H, n, tile, slices) {
      const tx = Math.ceil(W / tile), ty = Math.ceil(H / tile);
      const cells = tx * ty * slices;
      if (cells * 2 > gridData.length) { gridData = new Uint32Array(Math.ceil(cells / GRID_W) * GRID_W * 2); cellN = new Uint32Array(gridData.length / 2); }
      cellCount = cells;
      cellN.fill(0, 0, cells);
      const r = P.radius, logNF = Math.log(CFAR / CNEAR), near = 0.1;
      const sliceOf = (z) => U.clamp(Math.floor(Math.log(Math.max(z, CNEAR) / CNEAR) / logNF * slices), 0, slices - 1);
      for (let i = 0; i < n; i++) {
        const o = i * 4, x = lightData[o], y = lightData[o + 1], z = lightData[o + 2];
        const vx = view[0] * x + view[4] * y + view[8] * z + view[12];
        const vy = view[1] * x + view[5] * y + view[9] * z + view[13];
        const vz = view[2] * x + view[6] * y + view[10] * z + view[14];
        const b = i * 6;
        if (vz - r > -near) { lightCells[b] = 1; lightCells[b + 1] = 0; continue; } // near 평면 뒤
        let x0 = 0, x1 = tx - 1, y0 = 0, y1 = ty - 1;
        if (vz + r < -near) {
          // 경계 구의 AABB 8개 꼭짓점을 투영해 화면 사각형을 구함 (보수적)
          let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
          for (let k = 0; k < 8; k++) {
            const px = vx + (k & 1 ? r : -r), py = vy + (k & 2 ? r : -r), pz = vz + (k & 4 ? r : -r);
            const cw = -pz, sx = (proj[0] * px + proj[8] * pz) / cw, sy = (proj[5] * py + proj[9] * pz) / cw;
            mnx = Math.min(mnx, sx); mxx = Math.max(mxx, sx); mny = Math.min(mny, sy); mxy = Math.max(mxy, sy);
          }
          if (mxx < -1 || mnx > 1 || mxy < -1 || mny > 1) { lightCells[b] = 1; lightCells[b + 1] = 0; continue; }
          x0 = U.clamp(Math.floor((mnx * 0.5 + 0.5) * W / tile), 0, tx - 1); x1 = U.clamp(Math.floor((mxx * 0.5 + 0.5) * W / tile), 0, tx - 1);
          y0 = U.clamp(Math.floor((mny * 0.5 + 0.5) * H / tile), 0, ty - 1); y1 = U.clamp(Math.floor((mxy * 0.5 + 0.5) * H / tile), 0, ty - 1);
        }
        const s0 = slices > 1 ? sliceOf(-vz - r) : 0, s1 = slices > 1 ? sliceOf(-vz + r) : 0;
        lightCells[b] = x0; lightCells[b + 1] = x1; lightCells[b + 2] = y0; lightCells[b + 3] = y1; lightCells[b + 4] = s0; lightCells[b + 5] = s1;
        for (let s = s0; s <= s1; s++) for (let yy = y0; yy <= y1; yy++) { const row = (s * ty + yy) * tx; for (let xx = x0; xx <= x1; xx++) cellN[row + xx]++; }
      }
      // 접두 합으로 칸별 시작 위치를 정하고 인덱스를 채움
      let sum = 0, mx = 0, nonEmpty = 0, overflow = false;
      for (let c = 0; c < cells; c++) {
        let k = cellN[c];
        if (sum + k > IDX_MAX) { k = Math.max(0, IDX_MAX - sum); overflow = true; }
        gridData[c * 2] = sum; gridData[c * 2 + 1] = k; sum += k;
        if (k) { nonEmpty++; mx = Math.max(mx, k); }
        cellN[c] = 0;
      }
      for (let i = 0; i < n; i++) {
        const b = i * 6;
        if (lightCells[b] > lightCells[b + 1]) continue;
        for (let s = lightCells[b + 4]; s <= lightCells[b + 5]; s++) for (let yy = lightCells[b + 2]; yy <= lightCells[b + 3]; yy++) {
          const row = (s * ty + yy) * tx;
          for (let xx = lightCells[b]; xx <= lightCells[b + 1]; xx++) {
            const c = row + xx, k = cellN[c];
            if (k < gridData[c * 2 + 1]) { idxData[gridData[c * 2] + k] = i; cellN[c] = k + 1; }
          }
        }
      }
      stats = { avg: nonEmpty ? sum / nonEmpty : 0, max: mx, total: sum, overflow, cells, tx, ty };
      const gRows = Math.ceil(cells / GRID_W);
      gl.bindTexture(gl.TEXTURE_2D, gridTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32UI, GRID_W, gRows, 0, gl.RG_INTEGER, gl.UNSIGNED_INT, gridData.subarray(0, gRows * GRID_W * 2));
      const iRows = Math.max(1, Math.ceil(sum / IDX_W));
      gl.bindTexture(gl.TEXTURE_2D, idxTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32UI, IDX_W, iRows, 0, gl.RED_INTEGER, gl.UNSIGNED_INT, idxData.subarray(0, iRows * IDX_W));
      return { tx, ty };
    }

    // ── GPU 시간 측정 (확장이 있으면) ──
    const tq = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    const queries = [];
    let gpuMs = null;

    const cam = { yaw: 0.5, pitch: 0.55, dist: 26, drag: false, lx: 0, ly: 0 };
    let time = 0;

    return {
      update(dt) {
        if (P.move) time += dt;
        if (P.autoRotate && !cam.drag) cam.yaw += dt * 0.08;
        if (ctx.input.mouse.wheel) cam.dist = U.clamp(cam.dist * Math.pow(1.12, ctx.input.mouse.wheel), 4, 60);
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
        const W = ctx.pixelWidth, H = ctx.pixelHeight, n = Math.min(P.count | 0, MAXL), mode = +P.mode, tile = +P.tile;
        const tgt = [0, 0.5, 0], eye = M.orbitEye(tgt, cam.yaw, cam.pitch, cam.dist);
        const view = M.lookAt(eye, tgt), proj = M.perspective(U.rad(55), W / H, 0.1, 200), vp = M.multiply(proj, view);

        for (let i = 0; i < n; i++) {
          const L = lights[i], a = L.ph + time * L.sp, o = i * 4;
          lightData[o] = L.bx + Math.cos(a) * L.or; lightData[o + 1] = L.y; lightData[o + 2] = L.bz + Math.sin(a) * L.or; lightData[o + 3] = P.radius;
          lightData[MAXL * 4 + o] = L.c[0]; lightData[MAXL * 4 + o + 1] = L.c[1]; lightData[MAXL * 4 + o + 2] = L.c[2];
          pointData.set([lightData[o], lightData[o + 1], lightData[o + 2], L.c[0], L.c[1], L.c[2]], i * 6);
        }
        gl.bindTexture(gl.TEXTURE_2D, lightTex);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, MAXL, 2, gl.RGBA, gl.FLOAT, lightData);

        const t0 = ctx.now();
        let tiles = { tx: 1, ty: 1 };
        if (mode > 0) tiles = cull(view, proj, W, H, n, tile, mode === 2 ? SLICES : 1);
        const cullMs = ctx.now() - t0;

        if (tq) {
          while (queries.length) {
            const q = queries[0];
            if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
            if (!gl.getParameter(tq.GPU_DISJOINT_EXT)) gpuMs = gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6;
            gl.deleteQuery(q); queries.shift();
          }
        }
        let q = null;
        if (tq && queries.length < 4) { q = gl.createQuery(); gl.beginQuery(tq.TIME_ELAPSED_EXT, q); }

        gl.viewport(0, 0, W, H);
        gl.clearColor(0.02, 0.02, 0.03, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        prog.use();
        gl.uniformMatrix4fv(prog.u('u_vp'), false, vp);
        gl.uniformMatrix4fv(prog.u('u_view'), false, view);
        gl.uniform3fv(prog.u('u_eye'), eye);
        gl.uniform1i(prog.u('u_mode'), mode);
        gl.uniform1i(prog.u('u_count'), n);
        gl.uniform1i(prog.u('u_tile'), tile);
        gl.uniform1i(prog.u('u_tilesX'), tiles.tx);
        gl.uniform1i(prog.u('u_tilesY'), tiles.ty);
        gl.uniform1i(prog.u('u_slices'), mode === 2 ? SLICES : 1);
        gl.uniform1f(prog.u('u_cnear'), CNEAR);
        gl.uniform1f(prog.u('u_logNF'), Math.log(CFAR / CNEAR));
        gl.uniform1f(prog.u('u_heat'), P.showHeat ? 1 : 0);
        gl.uniform1f(prog.u('u_heatMax'), P.heatMax);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, lightTex); gl.uniform1i(prog.u('u_lights'), 0);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, gridTex); gl.uniform1i(prog.u('u_grid'), 1);
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, idxTex); gl.uniform1i(prog.u('u_idx'), 2);
        for (const o of objs) {
          gl.uniformMatrix4fv(prog.u('u_world'), false, o.w);
          gl.uniformMatrix3fv(prog.u('u_nmat'), false, o.n);
          gl.uniform3fv(prog.u('u_color'), o.c);
          o.m.draw(prog);
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.disable(gl.CULL_FACE);
        if (q) { gl.endQuery(tq.TIME_ELAPSED_EXT); queries.push(q); }

        // 라이트 위치 점
        gl.bindBuffer(gl.ARRAY_BUFFER, pointBuf);
        gl.bufferData(gl.ARRAY_BUFFER, pointData.subarray(0, n * 6), gl.DYNAMIC_DRAW);
        pointProg.use();
        gl.uniformMatrix4fv(pointProg.u('u_vp'), false, vp);
        gl.uniform1f(pointProg.u('u_size'), 60);
        U.gl.attrib(gl, pointProg, 'a_position', pointBuf, 3, gl.FLOAT, 24, 0);
        U.gl.attrib(gl, pointProg, 'a_color', pointBuf, 3, gl.FLOAT, 24, 12);
        gl.drawArrays(gl.POINTS, 0, n);
        gl.disable(gl.DEPTH_TEST);

        ctx.stat(GTL.L('라이트 수', 'Lights'), n);
        if (mode === 0) {
          ctx.stat(GTL.L('픽셀당 라이트 반복', 'Light loops per pixel'), n);
        } else {
          ctx.stat(GTL.L('셀 수', 'Cells'), mode === 2 ? `${stats.tx}x${stats.ty}x${SLICES}` : `${stats.tx}x${stats.ty}`);
          ctx.stat(GTL.L('목록 평균 / 최대 (빈 셀 제외)', 'List avg / max (non-empty cells)'), `${stats.avg.toFixed(1)} / ${stats.max}`);
          ctx.stat(GTL.L('인덱스 수', 'Indices'), stats.total + (stats.overflow ? GTL.L(' (넘침, 잘림)', ' (overflow, cut off)') : ''));
          ctx.stat(GTL.L('CPU 컬링 ms', 'CPU culling ms'), cullMs.toFixed(2));
        }
        ctx.stat('GPU ms', tq ? (gpuMs == null ? GTL.L('측정 중', 'Measuring') : gpuMs.toFixed(2)) : GTL.L('미지원', 'Not supported'));
      },
    };
  },
});
