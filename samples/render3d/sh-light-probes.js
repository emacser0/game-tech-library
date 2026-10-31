// 구면 조화(SH) 라이트 프로브: 상수 앰비언트 vs 프로브 격자 보간
GTL.register({
  id: 'sh-light-probes',
  title: '구면 조화(SH) 라이트 프로브',
  summary: '움직이는 물체에 간접광을 주는 방법을 비교. 상수 앰비언트는 어디서나 같은 색이라 물체가 평평해 보임. 격자에 둔 SH 프로브를 물체 위치에서 보간하면 빨간 벽 쪽 면은 붉게, 하늘 쪽 면은 푸르게 물듦.',
  renderer: 'webgl',
  views: { a: '상수 앰비언트', b: 'SH 프로브 보간' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌',
  info: `
    <p><b>라이트 프로브(light probe)</b>는 공간의 한 점에 모든 방향에서 들어오는 빛을 저장한 것. 라이트맵을 쓸 수 없는 움직이는 물체에 간접광을 줄 때 씀.</p>
    <p>모든 방향의 빛을 그대로 저장하면 너무 큼. 그래서 <b>구면 조화 함수(spherical harmonics, SH)</b>로 압축. SH는 구 위의 함수를 대역(band)별 기저 함수의 합으로 나타냄:</p>
    <ul>
      <li>L0: 계수 1개. 모든 방향의 평균 색.</li>
      <li>L1: 계수 3개 추가. 빛이 한쪽에서 더 많이 오는 기울기.</li>
      <li>L2: 계수 5개 추가. 위아래와 좌우가 다른 세부 분포. 합쳐서 색마다 9개.</li>
    </ul>
    <p>Ramamoorthi와 Hanrahan(2001)은 확산 반사의 조도(irradiance)가 L2까지만으로 평균 오차 약 1% 안에 들어온다는 것을 보임. 그래서 게임은 프로브마다 RGB 계수 27개를 저장.</p>
    <p>동작:</p>
    <ol>
      <li>굽기: 격자의 각 프로브에서 주변을 보고 SH 계수로 투영(적분)</li>
      <li>실행: 물체 위치를 둘러싼 프로브 8개를 3중 선형(trilinear) 가중치로 섞음</li>
      <li>셰이더: 법선 방향으로 SH를 계산해 조도를 얻음</li>
    </ol>
    <p>Unity Light Probe Group은 프로브를 사면체로 나눠 4개를 보간. Unreal의 Volumetric Lightmap은 격자에 SH를 저장하고 3중 선형으로 보간.</p>
    <p>단점: 물체 하나에 보간값 하나라 큰 물체는 한쪽 끝과 반대쪽 끝의 빛 차이를 못 담음. 프로브 사이에 벽이 있으면 빛이 새어 들어옴(light leaking).</p>`,
  // 도식: 격자 셀 안 물체의 보간 가중치, SH 대역별 기저 함수 모양
  diagram: (L) => `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="14" class="t-small t-dim">${L('프로브 격자 (위에서 본 단면)', 'Probe grid (top-down slice)')}</text>
    ${[40, 130, 220].map((x) => [28, 98, 168].map((y) => `<circle cx="${x}" cy="${y}" r="5" class="f-dim"/>`).join('')).join('')}
    <path d="M40,28 H220 M40,98 H220 M40,168 H220 M40,28 V168 M130,28 V168 M220,28 V168" class="d-dim"/>
    <line x1="100" y1="72" x2="40" y2="28" class="d-b"/><line x1="100" y1="72" x2="130" y2="28" class="d-b"/>
    <line x1="100" y1="72" x2="40" y2="98" class="d-b"/><line x1="100" y1="72" x2="130" y2="98" class="d-b"/>
    <circle cx="100" cy="72" r="7" class="f-accent"/>
    <text x="44" y="44" class="t-small t-mono">0.13</text><text x="134" y="44" class="t-small t-mono">0.27</text>
    <text x="44" y="114" class="t-small t-mono">0.20</text><text x="134" y="114" class="t-small t-mono">0.40</text>
    <text x="10" y="190" class="t-small">${L('가까운 프로브일수록 큰 가중치 (합 1)', 'Closer probes get bigger weights (sum 1)')}</text>
    <text x="270" y="14" class="t-small t-dim">${L('SH 대역 (초록 +, 빨강 -)', 'SH bands (green +, red -)')}</text>
    <circle cx="300" cy="45" r="11" class="f-good"/>
    <text x="330" y="42">${L('L0: 1개', 'L0: 1 coeff')}</text>
    <text x="330" y="55" class="t-small t-dim">${L('평균 밝기', 'average light')}</text>
    ${[[300, 'v'], [330, 'v'], [360, 'h']].map(([x, o]) => o === 'v'
      ? `<circle cx="${x}" cy="94" r="7" class="f-good"/><circle cx="${x}" cy="110" r="7" class="f-bad"/>`
      : `<circle cx="${x - 8}" cy="102" r="7" class="f-bad"/><circle cx="${x + 8}" cy="102" r="7" class="f-good"/>`).join('')}
    <text x="385" y="99">${L('L1: 3개', 'L1: 3 coeffs')}</text>
    <text x="385" y="112" class="t-small t-dim">${L('한 방향으로 기운 빛', 'light leaning one way')}</text>
    ${[300, 330, 360, 390].map((x, i) => i === 2
      ? `<circle cx="${x}" cy="150" r="6" class="f-good"/><circle cx="${x}" cy="166" r="6" class="f-good"/><ellipse cx="${x}" cy="158" rx="9" ry="3" class="f-bad"/>`
      : `<circle cx="${x - 6}" cy="152" r="5" class="f-good"/><circle cx="${x + 6}" cy="164" r="5" class="f-good"/><circle cx="${x + 6}" cy="152" r="5" class="f-bad"/><circle cx="${x - 6}" cy="164" r="5" class="f-bad"/>`).join('')}
    <text x="410" y="155">${L('L2: 5개', 'L2: 5 coeffs')}</text>
    <text x="410" y="168" class="t-small t-dim">${L('세부 방향 (4개만 그림)', 'finer detail (4 drawn)')}</text>
    <text x="270" y="190" class="t-small">${L('L2까지 RGB 9개씩, 프로브당 27개', 'Up to L2: 9 per RGB, 27 per probe')}</text>
  </svg>`,
  look: [
    'A의 구와 상자는 어느 면이나 같은 회색이라 평평해 보임. B는 왼쪽 면이 붉고, 오른쪽 면이 초록, 윗면이 푸름.',
    'B에서 구가 빨간 벽에 가까워지면 전체가 더 붉어지고, 초록 벽 쪽으로 가면 초록이 강해짐. 위치마다 빛이 달라짐.',
    'SH 차수를 L0으로 낮추면 방향 정보가 사라져 A처럼 평평해짐(색만 위치에 따라 바뀜). L1에서 방향이 생기고 L2에서 위아래 차이가 또렷해짐.',
    '보간을 "가장 가까운 프로브"로 바꾸면 물체가 셀 경계를 지날 때 색이 툭 바뀜(popping)',
  ],
  refs: [
    { type: 'paper', title: 'An Efficient Representation for Irradiance Environment Maps (Ramamoorthi, Hanrahan)', url: 'https://graphics.stanford.edu/papers/envmap/', year: 2001, note: 'SIGGRAPH 2001. L2 SH 9개 계수로 조도를 근사하는 공식.' },
    { type: 'engine', title: 'Unity Manual: Light Probes', url: 'https://docs.unity3d.com/Manual/LightProbes.html', note: 'Light Probe Group. 사면체 보간으로 움직이는 물체에 간접광을 줌.' },
    { type: 'engine', title: 'Unreal Engine: Volumetric Lightmaps', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-lightmaps-in-unreal-engine', note: '격자에 SH를 저장해 동적 물체를 비춤. 이전 방식은 Indirect Lighting Cache.' },
    { type: 'article', title: 'Stupid Spherical Harmonics (SH) Tricks (Peter-Pike Sloan)', year: 2008, note: 'GDC 2008. SH 투영, 회전, 실시간 사용법 정리.' },
  ],
  params: [
    { key: 'mode', label: '간접광', type: 'select', group: '조명', options: [
      { value: 'ambient', label: '상수 앰비언트' },
      { value: 'sh', label: 'SH 프로브' },
    ], a: 'ambient', b: 'sh' },
    { key: 'order', label: 'SH 차수', type: 'select', options: [
      { value: 0, label: 'L0 (계수 1개)' },
      { value: 1, label: 'L1 (계수 4개)' },
      { value: 2, label: 'L2 (계수 9개)' },
    ], default: 2, when: (p) => p.mode === 'sh' },
    { key: 'interp', label: '보간', type: 'select', options: [
      { value: 'nearest', label: '가장 가까운 프로브' },
      { value: 'trilinear', label: '3중 선형 (8개)' },
    ], default: 'trilinear', when: (p) => p.mode === 'sh' },
    { key: 'showProbes', label: '프로브 표시', type: 'bool', default: true, help: '작은 구가 각 프로브의 SH로 칠해짐', when: (p) => p.mode === 'sh' },
    { key: 'grid', label: '프로브 격자 (한 축)', type: 'int', min: 2, max: 6, default: 4, shared: true, reset: true, group: '장면' },
    { key: 'move', label: '물체 이동', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Spherical Harmonics (SH) Light Probes',
    summary: 'Compare two ways to give indirect light to moving objects. Constant ambient is the same color everywhere, so objects look flat. Interpolating SH probes from a grid at the object position tints the side facing the red wall red and the side facing the sky blue.',
    views: { a: 'Constant ambient', b: 'SH probe interpolation' },
    controls: 'Mouse drag: rotate camera. Wheel: zoom.',
    info: `
    <p>A <b>light probe</b> stores the light arriving from every direction at one point in space. Games use probes to give indirect light to moving objects, which cannot use lightmaps.</p>
    <p>Storing every direction as is takes too much memory. So probes compress it with <b>spherical harmonics (SH)</b>. SH writes a function on the sphere as a sum of basis functions grouped in bands:</p>
    <ul>
      <li>L0: 1 coefficient. The average color from all directions.</li>
      <li>L1: 3 more coefficients. A tilt, when more light comes from one side.</li>
      <li>L2: 5 more coefficients. Finer detail, like top vs bottom and sides. 9 per color in total.</li>
    </ul>
    <p>Ramamoorthi and Hanrahan (2001) showed that diffuse irradiance needs only bands up to L2, with about 1% average error. So games store 27 RGB coefficients per probe.</p>
    <p>How it works:</p>
    <ol>
      <li>Bake: each probe in the grid looks around and projects the light onto SH coefficients (an integral).</li>
      <li>Runtime: blend the 8 probes around the object with trilinear weights.</li>
      <li>Shader: evaluate the SH along the normal to get irradiance.</li>
    </ol>
    <p>Unity Light Probe Groups split probes into tetrahedra and blend 4 of them. Unreal Volumetric Lightmaps store SH in a grid and blend trilinearly.</p>
    <p>Downsides: each object gets one blended value, so a big object cannot show different light at its two ends. If a wall sits between probes, light leaks through it.</p>`,
    look: [
      'In A, every side of the sphere and box is the same gray, so they look flat. In B the left side is red, the right side green, and the top blue.',
      'In B, as the sphere nears the red wall, it turns redder. Near the green wall, green gets stronger. Light changes with position.',
      'Lower the SH order to L0. Direction is lost and objects look flat like A (only the color changes with position). L1 adds direction, and L2 makes top vs bottom clear.',
      'Switch interpolation to "Nearest probe". The color jumps when the object crosses a cell border (popping).',
    ],
    refs: ['SIGGRAPH 2001. The formula that approximates irradiance with 9 L2 SH coefficients.', 'Light Probe Groups. Tetrahedral interpolation gives indirect light to moving objects.', 'Stores SH in a grid to light dynamic objects. The older system was the Indirect Lighting Cache.', 'GDC 2008. A guide to SH projection, rotation, and real-time use.'],
    params: {
      mode: { label: 'Indirect light', group: 'Lighting', options: { ambient: 'Constant ambient', sh: 'SH probes' } },
      order: { label: 'SH order', options: { 0: 'L0 (1 coeff)', 1: 'L1 (4 coeffs)', 2: 'L2 (9 coeffs)' } },
      interp: { label: 'Interpolation', options: { nearest: 'Nearest probe', trilinear: 'Trilinear (8 probes)' } },
      showProbes: { label: 'Show probes', help: 'Small spheres are shaded by each probe SH' },
      grid: { label: 'Probe grid (per axis)', group: 'Scene' },
      move: 'Move objects',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, G = U.geometry, P = ctx.params;
    const R = 4, H = 4;                        // 방: x, z는 -4~4, y는 0~4. 앞쪽은 열려 있음
    // 면별 방사 휘도 (빛을 내는 면으로 단순화)
    const FACE_COL = [
      [1.0, 0.15, 0.1],    // 0 왼쪽 벽 (빨강)
      [0.12, 0.85, 0.2],   // 1 오른쪽 벽 (초록)
      [0.3, 0.28, 0.26],   // 2 바닥
      [0.35, 0.55, 1.0],   // 3 천장 (하늘)
      [0.55, 0.55, 0.55],  // 4 뒤쪽 벽
      [0.05, 0.05, 0.06],  // 5 앞쪽 열린 면 (바깥)
    ];
    function radiance(p, d) {
      let t = Infinity, face = 5, tt;
      if (d[0] < -1e-6 && (tt = (-R - p[0]) / d[0]) < t) { t = tt; face = 0; }
      if (d[0] > 1e-6 && (tt = (R - p[0]) / d[0]) < t) { t = tt; face = 1; }
      if (d[1] < -1e-6 && (tt = -p[1] / d[1]) < t) { t = tt; face = 2; }
      if (d[1] > 1e-6 && (tt = (H - p[1]) / d[1]) < t) { t = tt; face = 3; }
      if (d[2] < -1e-6 && (tt = (-R - p[2]) / d[2]) < t) { t = tt; face = 4; }
      if (d[2] > 1e-6 && (tt = (R - p[2]) / d[2]) < t) { t = tt; face = 5; }
      return FACE_COL[face];
    }
    const shBasis = (x, y, z) => [
      0.282095, 0.488603 * y, 0.488603 * z, 0.488603 * x,
      1.092548 * x * y, 1.092548 * y * z, 0.315392 * (3 * z * z - 1), 1.092548 * x * z, 0.546274 * (x * x - y * y),
    ];
    // 굽기: 위경도 격자로 구 전체를 적분해 SH 9개 계수(RGB)로 투영
    const NT = 24, NP = 48;
    const DIRS = [];
    for (let i = 0; i < NT; i++) for (let j = 0; j < NP; j++) {
      const th = (i + 0.5) / NT * Math.PI, ph = (j + 0.5) / NP * U.TAU;
      const d = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
      DIRS.push({ d, y: shBasis(d[0], d[1], d[2]), w: Math.sin(th) * (Math.PI / NT) * (U.TAU / NP) });
    }
    function projectProbe(p) {
      const c = new Float32Array(27);
      for (const s of DIRS) {
        const L = radiance(p, s.d);
        for (let k = 0; k < 9; k++) {
          const f = s.y[k] * s.w;
          c[k * 3] += L[0] * f; c[k * 3 + 1] += L[1] * f; c[k * 3 + 2] += L[2] * f;
        }
      }
      return c;
    }

    const N = P.grid, NY = Math.max(2, N - 1);
    const LO = [-3.4, 0.4, -3.4], HI = [3.4, 3.6, 3.4], CNT = [N, NY, N];
    const probes = [];
    for (let k = 0; k < N; k++) for (let j = 0; j < NY; j++) for (let i = 0; i < N; i++) {
      const p = [0, 1, 2].map((a) => U.lerp(LO[a], HI[a], [i, j, k][a] / (CNT[a] - 1)));
      probes.push({ p, sh: projectProbe(p) });
    }
    const probeAt = (i, j, k) => probes[(k * NY + j) * N + i];
    // 상수 앰비언트: 모든 프로브 L0의 평균 (방 전체 평균 색)
    const ambientSh = new Float32Array(27);
    for (const pr of probes) for (let c = 0; c < 3; c++) ambientSh[c] += pr.sh[c] / probes.length;

    // 물체 위치에서 프로브 보간. 반환: SH 계수와 사용한 프로브, 가중치
    const tmpSh = new Float32Array(27);
    function sampleProbes(pos, nearest) {
      const f = [0, 1, 2].map((a) => U.clamp((pos[a] - LO[a]) / (HI[a] - LO[a]), 0, 1) * (CNT[a] - 1));
      const used = [];
      tmpSh.fill(0);
      if (nearest) {
        const pr = probeAt(Math.round(f[0]), Math.round(f[1]), Math.round(f[2]));
        tmpSh.set(pr.sh); used.push({ pr, w: 1 });
        return used;
      }
      const i0 = f.map((v, a) => Math.min(Math.floor(v), CNT[a] - 2)), t = f.map((v, a) => v - i0[a]);
      for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        const w = (dx ? t[0] : 1 - t[0]) * (dy ? t[1] : 1 - t[1]) * (dz ? t[2] : 1 - t[2]);
        const pr = probeAt(i0[0] + dx, i0[1] + dy, i0[2] + dz);
        for (let q = 0; q < 27; q++) tmpSh[q] += pr.sh[q] * w;
        used.push({ pr, w });
      }
      return used;
    }

    const vs = `
      attribute vec3 a_position; attribute vec3 a_normal;
      uniform mat4 u_vp; uniform mat4 u_model; uniform mat3 u_nmat;
      varying vec3 v_n;
      void main(){
        v_n = u_nmat * a_normal;
        gl_Position = u_vp * u_model * vec4(a_position, 1.0);
      }`;
    // SH 조도 계산 (Ramamoorthi & Hanrahan 2001의 A_l 상수를 곱한 형태)
    const fs = `
      precision highp float;
      uniform vec3 u_sh[9]; uniform float u_order; uniform float u_emissive; uniform vec3 u_color;
      varying vec3 v_n;
      vec3 irradiance(vec3 n){
        vec3 e = u_sh[0] * 0.886227;
        if (u_order > 0.5) e += 1.023328 * (u_sh[1] * n.y + u_sh[2] * n.z + u_sh[3] * n.x);
        if (u_order > 1.5) {
          e += 0.858086 * (u_sh[4] * n.x * n.y + u_sh[5] * n.y * n.z + u_sh[7] * n.x * n.z);
          e += 0.247708 * u_sh[6] * (3.0 * n.z * n.z - 1.0);
          e += 0.429043 * u_sh[8] * (n.x * n.x - n.y * n.y);
        }
        return max(e, vec3(0.0)) / 3.14159265;
      }
      void main(){
        vec3 c;
        if (u_emissive > 0.5) c = u_color;
        else c = u_color * irradiance(normalize(v_n)) * 2.2;  // 노출 보정
        c = c / (1.0 + c * 0.25);
        gl_FragColor = vec4(pow(c, vec3(1.0 / 1.6)), 1.0);
      }`;
    const prog = U.gl.program(gl, vs, fs);
    const lineVs = `attribute vec3 a_position; uniform mat4 u_vp; void main(){ gl_Position = u_vp * vec4(a_position, 1.0); }`;
    const lineFs = `precision mediump float; uniform vec4 u_color; void main(){ gl_FragColor = u_color; }`;
    const lineProg = U.gl.program(gl, lineVs, lineFs);
    const lineBuf = gl.createBuffer();

    const plane = G.upload(gl, G.plane(8, 1, 1));
    const sph = G.upload(gl, G.sphere(1, 40, 20));
    const box = G.upload(gl, G.cube(1));
    const T = M.translation, S = M.scaling;
    const WALLS = [
      { m: M.mul(T(-R, H / 2, 0), S(1, 0.5, 1), M.rotationZ(-Math.PI / 2)), c: FACE_COL[0] },
      { m: M.mul(T(R, H / 2, 0), S(1, 0.5, 1), M.rotationZ(Math.PI / 2)), c: FACE_COL[1] },
      { m: M.create(), c: FACE_COL[2] },
      { m: T(0, H, 0), c: FACE_COL[3] },
      { m: M.mul(T(0, H / 2, -R), S(1, 0.5, 1), M.rotationX(Math.PI / 2)), c: FACE_COL[4] },
    ];

    let yaw = 0.25, pitch = 0.12, dist = 9.5, dragging = false, lx = 0, ly = 0, t = 0;
    const objPos = () => [Math.sin(t * 0.45) * 2.8, 1.5 + Math.sin(t * 0.7) * 0.8, Math.sin(t * 0.31) * 1.8];
    const boxPos = () => [Math.cos(t * 0.25) * 1.6, 0.6, -1.5 + Math.sin(t * 0.25) * 1.2];

    function drawLit(model, mesh, sh, order) {
      gl.uniformMatrix4fv(prog.u('u_model'), false, model);
      gl.uniformMatrix3fv(prog.u('u_nmat'), false, M.normalMatrix(model));
      gl.uniform3fv(prog.u('u_sh[0]'), sh);
      gl.uniform1f(prog.u('u_order'), order);
      mesh.draw(prog);
    }

    return {
      update(dt) {
        if (P.move) t += dt;
        dist = U.clamp(dist - ctx.input.mouse.wheel * 0.6, 5, 18);
      },
      onPointer(type, m) {
        if (type === 'down') { dragging = true; lx = m.x; ly = m.y; }
        else if (type === 'up' || type === 'leave') dragging = false;
        else if (type === 'move' && dragging) {
          yaw = U.clamp(yaw - (m.x - lx) * 0.006, -0.55, 0.55);
          pitch = pitch + (m.y - ly) * 0.005;
          lx = m.x; ly = m.y;
        }
      },
      render() {
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clearColor(0.05, 0.05, 0.06, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        const target = [0, 1.7, 0];
        // 카메라가 천장 위로 올라가지 않게 제한 (앞쪽 열린 면으로 들여다봄)
        pitch = U.clamp(pitch, -0.12, Math.asin(Math.min(1, 2.1 / dist)));
        const eye = M.orbitEye(target, yaw, pitch, dist);
        const vp = M.multiply(M.perspective(U.rad(55), ctx.width / ctx.height, 0.1, 60), M.lookAt(eye, target));
        const useSh = P.mode === 'sh', order = useSh ? +P.order : 0;

        prog.use();
        gl.uniformMatrix4fv(prog.u('u_vp'), false, vp);
        gl.uniform1f(prog.u('u_emissive'), 1);
        for (const w of WALLS) {
          gl.uniformMatrix4fv(prog.u('u_model'), false, w.m);
          gl.uniformMatrix3fv(prog.u('u_nmat'), false, M.normalMatrix(w.m));
          gl.uniform3fv(prog.u('u_color'), w.c);
          plane.draw(prog);
        }

        gl.uniform1f(prog.u('u_emissive'), 0);
        gl.uniform3fv(prog.u('u_color'), [0.85, 0.85, 0.85]);
        const op = objPos(), bp = boxPos();
        let used = [];
        if (useSh) { used = sampleProbes(op, P.interp === 'nearest'); drawLit(M.multiply(T(...op), S(0.8)), sph, tmpSh, order); }
        else drawLit(M.multiply(T(...op), S(0.8)), sph, ambientSh, 0);
        if (useSh) { sampleProbes(bp, P.interp === 'nearest'); drawLit(M.mul(T(...bp), M.rotationY(t * 0.6), S(1.2)), box, tmpSh, order); }
        else drawLit(M.mul(T(...bp), M.rotationY(t * 0.6), S(1.2)), box, ambientSh, 0);

        if (useSh && P.showProbes) {
          gl.uniform3fv(prog.u('u_color'), [1, 1, 1]);
          for (const pr of probes) drawLit(M.multiply(T(...pr.p), S(0.14)), sph, pr.sh, order);
          // 구가 쓰는 프로브까지 선. 가중치가 클수록 진함
          lineProg.use();
          gl.uniformMatrix4fv(lineProg.u('u_vp'), false, vp);
          gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          const bc = U.hexToRgb01(U.colors.b);
          gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
          for (const u of used) {
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...op, ...u.pr.p]), gl.DYNAMIC_DRAW);
            U.gl.attrib(gl, lineProg, 'a_position', lineBuf, 3);
            gl.uniform4fv(lineProg.u('u_color'), [bc[0], bc[1], bc[2], 0.15 + 0.85 * u.w]);
            gl.drawArrays(gl.LINES, 0, 2);
          }
          gl.disable(gl.BLEND);
        }

        ctx.stat(GTL.L('프로브 수', 'Probes'), probes.length);
        ctx.stat(GTL.L('물체당 계수 (RGB)', 'Coefficients per object (RGB)'), useSh ? ((order + 1) * (order + 1)) + ' x 3' : '1 x 3');
        ctx.stat(GTL.L('구가 섞는 프로브', 'Probes blended for sphere'), useSh ? used.length : 0);
      },
    };
  },
});
