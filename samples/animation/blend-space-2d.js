// 2D 블렌드 스페이스: 가장 가까운 클립 하나만 재생 vs 가중치 블렌드(삼각분할 무게중심, 그레이디언트 밴드)
GTL.register({
  id: 'blend-space-2d',
  title: '2D 블렌드 스페이스 (Unreal Blend Space, Unity Blend Tree)',
  summary: '속도와 방향으로 이루어진 2D 공간에 클립을 배치하고 입력 지점에 맞는 포즈를 만듦. 가장 가까운 클립 하나만 고르면 경계에서 포즈가 튐. 가중치 블렌드는 이웃 클립을 섞어 포즈가 연속으로 바뀜.',
  views: { a: '가장 가까운 클립', b: '가중치 블렌드' },
  controls: '왼쪽 공간 위에서 마우스를 움직이면 입력 지점이 따라감. 마우스가 없으면 입력 지점이 자동으로 돌아다님.',
  info: `
    <p><b>2D 블렌드 스페이스</b>는 두 입력값(여기서는 좌우 속도와 앞뒤 속도)으로 이루어진 평면에 클립을 점으로 배치하는 방식. 원점에서의 거리가 속도, 각도가 이동 방향.
    Unreal의 Blend Space, Unity Blend Tree의 2D Freeform Directional이 같은 개념.</p>
    <p>입력 지점이 정해지면 클립마다 가중치(weight)를 계산하고 포즈를 가중 평균. 클립의 재생 위치는 정규화한 위상(0~1)으로 맞춤(sync). 그래서 걸음 주기가 다른 클립도 발이 맞음.</p>
    <p>가중치 계산 방식:</p>
    <ul>
      <li><b>가장 가까운 클립</b>: 거리가 가장 짧은 클립만 재생. 경계를 넘는 순간 포즈가 통째로 바뀜(popping).</li>
      <li><b>삼각분할 무게중심 (Unreal)</b>: 클립 점을 삼각형으로 나누고, 입력 지점이 든 삼각형의 세 꼭짓점을 무게중심 좌표(barycentric)로 섞음. 계산이 싸고 항상 최대 3개만 섞음.</li>
      <li><b>그레이디언트 밴드 (Unity Freeform Directional)</b>: 클립 쌍마다 극좌표(크기, 각도) 기준의 영향 띠를 만들고 가장 작은 값을 가중치로 씀. 방향 변화에 더 고르게 반응. 대신 클립 수의 제곱만큼 계산.</li>
    </ul>
    <p>Unity의 2D Simple Directional은 방향마다 클립이 하나씩만 있을 때 쓰는 단순한 방식. 이웃한 두 방향과 중앙 클립만 섞음.</p>
    <p>단점: 블렌드는 서로 다른 포즈를 평균하므로 클립 사이가 너무 다르면 발이 미끄러지거나 다리가 꼬임. 클립 배치와 위상 동기화가 품질을 좌우.</p>`,
  // 도식: 삼각형 안의 입력 지점과 무게중심 가중치, 가장 가까운 클립 방식의 경계 튐
  diagram: (L) => `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="16" class="t-b">${L('B: 삼각형 무게중심 가중치', 'B: barycentric weights in a triangle')}</text>
    <polygon points="40,175 250,175 120,35" class="f-dim"/>
    <polygon points="95,150 250,175 120,35" class="f-b" opacity="0.28"/>
    <line x1="95" y1="150" x2="40" y2="175" class="d-dim"/><line x1="95" y1="150" x2="250" y2="175" class="d-dim"/><line x1="95" y1="150" x2="120" y2="35" class="d-dim"/>
    <polygon points="40,175 250,175 120,35" class="d-line"/>
    <circle cx="40" cy="175" r="9" class="f-b"/><circle cx="250" cy="175" r="6" class="f-b"/><circle cx="120" cy="35" r="5" class="f-b"/>
    <text x="22" y="194" class="t-small">A 0.63</text><text x="236" y="194" class="t-small">B 0.19</text><text x="128" y="34" class="t-small">C 0.18</text>
    <circle cx="95" cy="150" r="4" class="f-accent"/><text x="84" y="146" class="t-small">P</text>
    <text x="140" y="125" class="t-small t-b">${L('넓이 PBC', 'area PBC')}</text>
    <text x="262" y="60" class="t-small t-mono">wA = PBC / ABC</text>
    <text x="262" y="74" class="t-small t-mono">wB = PCA / ABC</text>
    <text x="262" y="88" class="t-small t-mono">wC = PAB / ABC</text>
    <text x="262" y="104" class="t-small t-dim">${L('P가 가까운 꼭짓점일수록 큰 가중치', 'Closer corner, larger weight')}</text>
    <text x="262" y="118" class="t-small t-dim">${L('합계는 항상 1, 경계에서 0으로 수렴', 'Weights sum to 1 and reach 0 at the far edge')}</text>
    <text x="300" y="140" class="t-a">${L('A: 가장 가까운 클립', 'A: nearest clip')}</text>
    <line x1="300" y1="172" x2="520" y2="172" class="d-dim"/>
    <line x1="410" y1="155" x2="410" y2="190" class="d-a" stroke-dasharray="3 3"/>
    <path d="M300,162 L410,162 L410,182 L520,182" class="d-a"/>
    <path d="M300,182 L520,162" class="d-b"/>
    <text x="300" y="196" class="t-small t-dim">${L('입력 지점 이동, 가중치 1 에서 0', 'move input, weight 1 to 0')}</text>
    <text x="420" y="156" class="t-small t-a">${L('경계에서 튐', 'jumps at border')}</text>
  </svg>`,
  look: [
    '입력 지점이 걷기와 달리기 사이 경계를 지나는 순간 A의 포즈가 한 프레임에 바뀜. 아래 "관절 이동량" 그래프에 뾰족한 기둥이 생김. B는 그래프가 낮고 고름.',
    'B의 가중치 방식을 "그레이디언트 밴드"로 바꾸면 3개보다 많은 클립이 동시에 원을 키움. 삼각분할보다 방향 변화가 더 둥글게 이어짐.',
    '"입력 보간 시간"을 올리면 입력 지점이 늦게 따라감. A는 그래도 경계에서 튐. 입력을 부드럽게 해도 클립 선택이 바뀌는 순간은 남기 때문.',
    '마우스를 대각선 방향 바깥에 두면 입력 지점이 바깥 경계에 붙음(클램프). 블렌드 스페이스는 클립 범위 밖을 만들어 내지 못함.',
  ],
  refs: [
    { type: 'engine', title: 'Unreal Engine - Blend Spaces', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/blend-spaces-in-unreal-engine', note: '샘플 점 배치, 삼각분할 기반 보간, Smoothing Time' },
    { type: 'engine', title: 'Unity Manual - 2D Blending', url: 'https://docs.unity3d.com/Manual/BlendTree-2DBlending.html', note: '2D Simple Directional, 2D Freeform Directional, 2D Freeform Cartesian.' },
    { type: 'paper', title: 'Automated Semi-Procedural Animation for Character Locomotion (Rune Skovbo Johansen)', year: 2009, note: '석사 논문. 극좌표 그레이디언트 밴드 보간. Unity Freeform Directional의 바탕.' },
  ],
  params: [
    { key: 'method', label: '가중치 방식', type: 'select', group: '블렌드', options: [
      { value: 'nearest', label: '가장 가까운 클립' },
      { value: 'tri', label: '삼각분할 무게중심 (Unreal)' },
      { value: 'gband', label: '그레이디언트 밴드 (Unity)' },
    ], a: 'nearest', b: 'tri' },
    { key: 'smooth', label: '입력 보간 시간 (초)', type: 'range', min: 0, max: 0.6, step: 0.01, default: 0, help: 'Unreal의 Smoothing Time처럼 입력 지점을 지수 감쇠로 늦게 따라가게 함' },
    { key: 'auto', label: '자동 이동', type: 'bool', default: true, shared: true, group: '입력', help: '마우스가 공간 밖에 있을 때 입력 지점이 정해진 경로를 돎' },
    { key: 'orbit', label: '자동 이동 속도', type: 'range', min: 0.2, max: 2, step: 0.01, default: 1, shared: true, when: (p) => p.auto },
  ],
  en: {
    title: '2D Blend Space (Unreal Blend Space, Unity Blend Tree)',
    summary: 'Clips sit in a 2D space of speed and direction, and the input point picks the pose. Picking only the nearest clip makes the pose jump at borders. A weighted blend mixes neighbor clips, so the pose changes smoothly.',
    views: { a: 'Nearest clip', b: 'Weighted blend' },
    controls: 'Move the mouse over the space on the left and the input point follows. Without the mouse, the input point moves on its own.',
    info: `
    <p>A <b>2D blend space</b> places clips as points on a plane made of two inputs (here: sideways speed and forward speed). The distance from the origin is the speed, and the angle is the move direction.
    Unreal's Blend Space and the 2D Freeform Directional mode of Unity's Blend Tree are the same idea.</p>
    <p>Once the input point is known, each clip gets a weight, and the poses are averaged by weight. Clip playback is aligned by a normalized phase (0~1), called sync. So clips with different step cycles still keep the feet in step.</p>
    <p>Weight methods:</p>
    <ul>
      <li><b>Nearest clip</b>: only the closest clip plays. The whole pose changes the moment the input crosses a border (popping).</li>
      <li><b>Triangulation with barycentric weights (Unreal)</b>: the clip points are split into triangles. The three corners of the triangle that holds the input are mixed by barycentric coordinates. It is cheap and never mixes more than 3 clips.</li>
      <li><b>Gradient band (Unity Freeform Directional)</b>: each pair of clips gets an influence band in polar terms (magnitude and angle), and the smallest value becomes the weight. It reacts more evenly to direction changes, but the cost grows with the square of the clip count.</li>
    </ul>
    <p>Unity's 2D Simple Directional is a simpler mode for one clip per direction. It mixes only the two neighbor directions and the center clip.</p>
    <p>Downside: a blend averages different poses, so if neighbor clips are too different the feet slide or the legs cross. Clip placement and phase sync decide the quality.</p>`,
    look: [
      'When the input point crosses the border between walk and run, A changes pose in one frame. A tall spike appears in the "Joint movement" graph below. In B the graph stays low and even.',
      'Switch B to "Gradient band". More than 3 clips grow their circles at the same time. Direction changes flow more roundly than with triangulation.',
      'Raise "Input smoothing time". The input point follows with a delay. A still jumps at the border, because smoothing the input does not remove the moment the chosen clip changes.',
      'Put the mouse far out on a diagonal. The input point sticks to the outer edge (clamp). A blend space cannot create motion outside the range of its clips.',
    ],
    refs: [
      'Sample point placement, triangulation based interpolation, Smoothing Time.',
      '2D Simple Directional, 2D Freeform Directional, 2D Freeform Cartesian.',
      'Master thesis. Polar gradient band interpolation, the basis of Unity Freeform Directional.',
    ],
    params: {
      method: { label: 'Weight method', group: 'Blend', options: { nearest: 'Nearest clip', tri: 'Triangulation barycentric (Unreal)', gband: 'Gradient band (Unity)' } },
      smooth: { label: 'Input smoothing time (s)', help: 'Like Unreal Smoothing Time, the input point follows with exponential decay' },
      auto: { label: 'Auto move', group: 'Input', help: 'When the mouse is outside the space, the input point follows a fixed path' },
      orbit: 'Auto move speed',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params, TAU = U.TAU;
    const EXT = 2.35; // 공간 표시 범위 (단위: 걷기 속도 = 1)
    // 클립: 위치 (x 좌우 속도, y 앞뒤 속도), 주기(초)
    const CLIPS = [
      { x: 0, y: 0, T: 2.4, tag: 'I' },
      { x: 0, y: 1, T: 1.05, tag: 'W↑' }, { x: 1, y: 0, T: 1.05, tag: 'W→' }, { x: 0, y: -1, T: 1.05, tag: 'W↓' }, { x: -1, y: 0, T: 1.05, tag: 'W←' },
      { x: 0, y: 2, T: 0.68, tag: 'R↑' }, { x: 2, y: 0, T: 0.68, tag: 'R→' }, { x: 0, y: -2, T: 0.68, tag: 'R↓' }, { x: -2, y: 0, T: 0.68, tag: 'R←' },
    ];
    // 삼각분할: 사분면마다 안쪽 1개 + 바깥 띠 2개
    const TRIS = [];
    [[1, 2, 5, 6], [2, 3, 6, 7], [3, 4, 7, 8], [4, 1, 8, 5]].forEach(([wa, wb, ra, rb]) => {
      TRIS.push([0, wa, wb], [wa, ra, wb], [ra, rb, wb]);
    });

    let t = 0, phase = 0, target = { x: 0, y: 0.5 }, inp = { x: 0, y: 0.5 }, idleT = 99;
    let weights = new Array(CLIPS.length).fill(0), curTri = null, prevPose = null, jumpHist = [], jumpMax = [];

    const layout = () => {
      const W = ctx.width, H = ctx.height, pad = 12;
      const S = Math.max(80, Math.min(H - 120, W * 0.5 - pad * 2));
      return { W, H, pad, S, x0: pad, y0: pad + 18 };
    };
    const toPanel = (L, u, v) => ({ x: L.x0 + ((u + EXT) / (2 * EXT)) * L.S, y: L.y0 + ((EXT - v) / (2 * EXT)) * L.S });
    const fromPanel = (L, px, py) => ({ x: ((px - L.x0) / L.S) * 2 * EXT - EXT, y: EXT - ((py - L.y0) / L.S) * 2 * EXT });

    // 바깥 경계(마름모 |x|+|y| <= 2)로 클램프
    function clampHull(p) {
      const s = Math.abs(p.x) + Math.abs(p.y);
      if (s <= 2) return p;
      const sx = Math.sign(p.x) || 1, sy = Math.sign(p.y) || 1, e = (s - 2) / 2;
      let x = p.x - sx * e, y = p.y - sy * e;
      if (x * sx < 0) { x = 0; y = sy * 2; }
      if (y * sy < 0) { y = 0; x = sx * 2; }
      return { x, y };
    }

    function wNearest(p) {
      let bi = 0, bd = Infinity;
      CLIPS.forEach((c, i) => { const d = (c.x - p.x) ** 2 + (c.y - p.y) ** 2; if (d < bd - 1e-9) { bd = d; bi = i; } });
      return CLIPS.map((_, i) => (i === bi ? 1 : 0));
    }
    function wTri(p) {
      const w = new Array(CLIPS.length).fill(0);
      let best = null, bestMin = -Infinity;
      for (const tr of TRIS) {
        const [a, b, c] = tr.map((i) => CLIPS[i]);
        const den = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
        const l1 = ((b.y - c.y) * (p.x - c.x) + (c.x - b.x) * (p.y - c.y)) / den;
        const l2 = ((c.y - a.y) * (p.x - c.x) + (a.x - c.x) * (p.y - c.y)) / den;
        const l3 = 1 - l1 - l2, m = Math.min(l1, l2, l3);
        if (m > bestMin) { bestMin = m; best = { tr, l: [l1, l2, l3] }; }
      }
      const l = best.l.map((v) => Math.max(0, v)), s = l[0] + l[1] + l[2];
      best.tr.forEach((i, k) => { w[i] = l[k] / s; });
      curTri = best.tr;
      return w;
    }
    // Johansen의 극좌표 그레이디언트 밴드
    const sAngle = (a, b) => Math.atan2(a.x * b.y - a.y * b.x, a.x * b.x + a.y * b.y);
    function wGband(p) {
      const AF = 2, pm = Math.hypot(p.x, p.y);
      const h = CLIPS.map((ci) => {
        const mi = Math.hypot(ci.x, ci.y);
        let hmin = 1;
        for (const cj of CLIPS) {
          if (cj === ci) continue;
          const mj = Math.hypot(cj.x, cj.y), avg = (mi + mj) / 2;
          let aij, aip;
          if (mi === 0) { aij = pm > 0 ? sAngle(p, cj) : 0; aip = 0; }
          else if (mj === 0) { aij = pm > 0 ? sAngle(ci, p) : 0; aip = aij; }
          else { aij = sAngle(ci, cj); aip = pm > 0 ? sAngle(ci, p) : aij; }
          const ijx = (mj - mi) / avg, ijy = aij * AF, ipx = (pm - mi) / avg, ipy = aip * AF;
          const v = 1 - (ipx * ijx + ipy * ijy) / (ijx * ijx + ijy * ijy);
          if (v < hmin) hmin = v;
        }
        return Math.max(0, hmin);
      });
      const s = h.reduce((a, b) => a + b, 0) || 1;
      return h.map((v) => v / s);
    }

    // 클립 포즈 (모델 공간: x 오른쪽, y 위, z 앞). 13개 수치를 가중 평균
    function clipPose(c, q) {
      const s = Math.round(Math.hypot(c.x, c.y)), out = new Array(13).fill(0);
      if (s === 0) {
        out[0] = 86 + Math.sin(q * TAU) * 1.5;
        out[3] = -11; out[6] = 11;
        return out;
      }
      const dx = c.x / s, dz = c.y / s, L = s === 1 ? 52 : 92, lift = s === 1 ? 13 : 26, bob = s === 1 ? 3 : 6;
      const along = (qq) => (qq < 0.5 ? L / 2 - L * qq * 2 : -L / 2 + L * U.smoothstep(0, 1, (qq - 0.5) * 2));
      const up = (qq) => (qq < 0.5 ? 0 : Math.sin((qq - 0.5) * 2 * Math.PI) * lift);
      const qL = q % 1, qR = (q + 0.5) % 1, aL = along(qL), aR = along(qR);
      out[0] = (s === 1 ? 84 : 78) + bob * Math.cos(q * 2 * TAU);
      out[1] = dx * s * 5; out[2] = dz * s * 5;
      out[3] = -11 + dx * aL; out[4] = up(qL); out[5] = dz * aL;
      out[6] = 11 + dx * aR; out[7] = up(qR); out[8] = dz * aR;
      out[9] = dx * aR * 0.45; out[10] = dz * aR * 0.45; out[11] = dx * aL * 0.45; out[12] = dz * aL * 0.45;
      return out;
    }
    function blendedPose() {
      const out = new Array(13).fill(0);
      CLIPS.forEach((c, i) => { if (weights[i] > 1e-6) clipPose(c, phase).forEach((v, k) => { out[k] += v * weights[i]; }); });
      return out;
    }
    // 포즈 → 관절 위치 (모델 공간 3D)
    function joints(pz) {
      const pel = { x: 0, y: pz[0], z: 0 };
      const chest = { x: pz[1], y: pz[0] + 55, z: pz[2] };
      const head = { x: pz[1] * 1.3, y: pz[0] + 78, z: pz[2] * 1.3 };
      const leg = (side, fx, fy, fz) => {
        const hip = { x: side * 9, y: pel.y, z: 0 }, ft = { x: fx, y: fy, z: fz };
        const d = { x: ft.x - hip.x, y: ft.y - hip.y, z: ft.z - hip.z }, len = Math.min(Math.hypot(d.x, d.y, d.z), 89.9);
        const n = Math.hypot(d.x, d.y, d.z) || 1, u = { x: d.x / n, y: d.y / n, z: d.z / n };
        const a = len / 2, hgt = Math.sqrt(Math.max(0, 45 * 45 - a * a));
        let bx = -u.z * u.x, by = -u.z * u.y, bz = 1 - u.z * u.z; // 앞쪽(z)에서 다리 방향 성분 제거
        const bl = Math.hypot(bx, by, bz) || 1; bx /= bl; by /= bl; bz /= bl;
        const knee = { x: hip.x + u.x * a + bx * hgt, y: hip.y + u.y * a + by * hgt, z: hip.z + u.z * a + bz * hgt };
        return [hip, knee, { x: hip.x + u.x * len, y: hip.y + u.y * len, z: hip.z + u.z * len }];
      };
      const arm = (side, hx, hz) => {
        const sh = { x: chest.x + side * 14, y: chest.y - 2, z: chest.z };
        return [sh, { x: sh.x + side * 3 + hx, y: sh.y - 44, z: sh.z + hz }];
      };
      return { pel, chest, head, legL: leg(-1, pz[3], pz[4], pz[5]), legR: leg(1, pz[6], pz[7], pz[8]), armL: arm(-1, pz[9], pz[10]), armR: arm(1, pz[11], pz[12]) };
    }

    return {
      update(dt) {
        t += dt;
        const L = layout(), m = ctx.input.mouse;
        const over = m.inside && m.x >= L.x0 && m.x <= L.x0 + L.S && m.y >= L.y0 && m.y <= L.y0 + L.S;
        if (over) { target = clampHull(fromPanel(L, m.x, m.y)); idleT = 0; }
        else idleT += dt;
        if (P.auto && idleT > 1) {
          const k = t * P.orbit;
          target = clampHull({ x: 2.1 * Math.sin(k * 0.53), y: 0.4 + 1.8 * Math.sin(k * 0.37 + 0.6) });
        }
        if (P.smooth > 0) { const a = 1 - Math.exp(-dt / P.smooth); inp.x += (target.x - inp.x) * a; inp.y += (target.y - inp.y) * a; }
        else inp = { ...target };
        curTri = null;
        weights = P.method === 'nearest' ? wNearest(inp) : P.method === 'tri' ? wTri(inp) : wGband(inp);
        let rate = 0;
        CLIPS.forEach((c, i) => { rate += weights[i] / c.T; });
        phase = (phase + rate * dt) % 1;
        const pz = blendedPose(), J = joints(pz);
        const pts = [J.head, J.chest, ...J.legL, ...J.legR, ...J.armL, ...J.armR];
        let jump = 0;
        if (prevPose) pts.forEach((q, i) => { jump = Math.max(jump, Math.hypot(q.x - prevPose[i].x, q.y - prevPose[i].y, q.z - prevPose[i].z)); });
        prevPose = pts;
        jumpHist.push(jump); if (jumpHist.length > 240) jumpHist.shift();
        jumpMax.push(jump); if (jumpMax.length > 120) jumpMax.shift();
        this.pose = pz;
      },
      render() {
        const g = ctx.g, L = layout(), col = ctx.side === 'a' ? C.a : C.b;
        // 파라미터 공간
        D.text(g, GTL.L('파라미터 공간 (W 걷기, R 달리기, I 대기)', 'Parameter space (W walk, R run, I idle)'), L.x0, L.pad, { size: 11, color: C.dim });
        D.rect(g, L.x0, L.y0, L.S, L.S, 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.15)');
        const o = toPanel(L, 0, 0);
        D.line(g, L.x0, o.y, L.x0 + L.S, o.y, 'rgba(255,255,255,0.12)', 1);
        D.line(g, o.x, L.y0, o.x, L.y0 + L.S, 'rgba(255,255,255,0.12)', 1);
        D.poly(g, [[0, 2], [2, 0], [0, -2], [-2, 0]].map(([u, v]) => toPanel(L, u, v)), null, 'rgba(255,255,255,0.25)', 1, true);
        D.text(g, GTL.L('앞', 'Fwd'), o.x + 4, L.y0 + 4, { size: 10, color: C.dim });
        D.text(g, GTL.L('오른쪽', 'Right'), L.x0 + L.S - 4, o.y + 4, { size: 10, color: C.dim, align: 'right' });
        if (P.method === 'tri') {
          for (const tr of TRIS) D.poly(g, tr.map((i) => toPanel(L, CLIPS[i].x, CLIPS[i].y)), null, 'rgba(130,170,255,0.22)', 1, true);
          if (curTri) D.poly(g, curTri.map((i) => toPanel(L, CLIPS[i].x, CLIPS[i].y)), 'rgba(130,170,255,0.12)', col, 1.5, true);
        }
        const rMax = L.S * 0.07;
        CLIPS.forEach((c, i) => {
          const q = toPanel(L, c.x, c.y);
          if (weights[i] > 0.001) D.circle(g, q.x, q.y, 3 + Math.sqrt(weights[i]) * rMax, col + '55', col, 1.5);
          D.circle(g, q.x, q.y, 3, '#ffffff');
          D.text(g, c.tag, q.x + 6, q.y - 13, { size: 10, color: C.dim });
        });
        const ti = toPanel(L, target.x, target.y), pi = toPanel(L, inp.x, inp.y);
        if (P.smooth > 0) D.circle(g, ti.x, ti.y, 4, null, 'rgba(255,255,255,0.5)', 1);
        D.circle(g, pi.x, pi.y, 5, C.accent, '#000', 1);

        // 포즈 (비스듬한 3D 투영)
        const rx0 = L.x0 + L.S + L.pad, rw = L.W - rx0 - L.pad;
        const cx = rx0 + rw / 2, gy = L.y0 + L.S * 0.86, k = U.clamp(Math.min(rw, L.S) / 230, 0.4, 1.5);
        const cyw = Math.cos(-0.6), syw = Math.sin(-0.6), cp = Math.cos(0.35), sp = Math.sin(0.35);
        const pr = (p) => { const x = p.x * cyw + p.z * syw, z = -p.x * syw + p.z * cyw; return { x: cx + x * k, y: gy - (p.y * cp + z * sp) * k, d: z }; };
        for (let i = -3; i <= 3; i++) {
          const a = pr({ x: i * 25, y: 0, z: -75 }), b = pr({ x: i * 25, y: 0, z: 75 }), c2 = pr({ x: -75, y: 0, z: i * 25 }), d2 = pr({ x: 75, y: 0, z: i * 25 });
          D.line(g, a.x, a.y, b.x, b.y, 'rgba(255,255,255,0.07)', 1); D.line(g, c2.x, c2.y, d2.x, d2.y, 'rgba(255,255,255,0.07)', 1);
        }
        const v0 = pr({ x: 0, y: 0, z: 0 }), v1 = pr({ x: inp.x * 35, y: 0, z: inp.y * 35 });
        if (Math.hypot(inp.x, inp.y) > 0.05) D.arrow(g, v0.x, v0.y, v1.x, v1.y, C.accent, 2);
        const J = joints(this.pose || clipPose(CLIPS[0], 0));
        const seg = (ps, c, w) => { for (let i = 0; i + 1 < ps.length; i++) { const a = pr(ps[i]), b = pr(ps[i + 1]); D.line(g, a.x, a.y, b.x, b.y, c, w); } };
        const dim = 'rgba(255,255,255,0.35)';
        seg(J.legL, dim, 5); seg(J.armL, dim, 4);
        seg([J.legL[0], J.legR[0]], col, 5);
        seg([{ x: 0, y: J.pel.y, z: 0 }, J.chest], col, 6);
        seg(J.legR, col, 5); seg(J.armR, col, 4);
        seg([J.armL[0], J.armR[0]], col, 4);
        const hd = pr(J.head); D.circle(g, hd.x, hd.y, 12 * k, '#20242c', col, 3);
        for (const f of [J.legL[2], J.legR[2]]) { const q = pr(f); if (f.y < 1) D.circle(g, q.x, q.y, 3, C.warn); }

        // 관절 이동량 그래프
        D.plot(g, jumpHist.map((v) => Math.min(v, 30)), 12, L.H - 74, L.W - 24, 58, { min: 0, max: 30, color: col, label: GTL.L('프레임당 관절 이동량 (최대, 단위 px)', 'Joint movement per frame (max, px)') });
        const act = weights.filter((w) => w > 0.001).length;
        const top = weights.map((w, i) => [w, i]).sort((a, b) => b[0] - a[0]).slice(0, 3).filter((e) => e[0] > 0.001);
        ctx.stat(GTL.L('섞이는 클립 수', 'Clips mixed'), act);
        ctx.stat(GTL.L('가중치 상위', 'Top weights'), top.map(([w, i]) => CLIPS[i].tag + ' ' + w.toFixed(2)).join(', '));
        ctx.stat(GTL.L('최근 2초 최대 관절 이동', 'Max joint jump (2 s)'), Math.max(0, ...jumpMax).toFixed(1) + ' px');
      },
    };
  },
});
