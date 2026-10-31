// 3D 회전 보간: 오일러 각 성분별 lerp vs 쿼터니언 nlerp / slerp (Canvas2D 와이어프레임 투영)
GTL.register({
  id: 'quaternion-slerp',
  title: '회전 보간: 오일러 lerp vs 쿼터니언 slerp',
  summary: '두 자세 사이를 오일러 각(yaw, pitch, roll) 성분별로 lerp하면 엉뚱한 경로로 휘청임. 짐벌락 근처에서는 거의 같은 자세 사이에서도 크게 돎. 쿼터니언 slerp는 고정된 축 하나로 최단 각도를 일정한 각속도로 회전함.',
  views: { a: '오일러 각 lerp', b: '쿼터니언 slerp' },
  controls: '드래그: 카메라 회전. "새 무작위 자세" 버튼: 자세 다시 뽑기 (프리셋이 무작위일 때)',
  info: `
    <p><b>오일러 각</b>은 회전을 축 회전 세 번으로 표현함. 여기서는 <code>R = Ry(yaw) * Rx(pitch) * Rz(roll)</code>.</p>
    <p>각 성분을 따로 보간하면 생기는 문제:</p>
    <ul>
      <li>세 회전이 서로 다른 축에서 섞여 <b>경로가 휨</b>.</li>
      <li><b>각속도가 일정하지 않음</b>.</li>
      <li>같은 자세를 나타내는 각도 조합이 여러 개라 최단 경로를 보장하지 못함.</li>
      <li>pitch가 ±90°에 가까우면 yaw와 roll이 같은 축이 됨(<b>짐벌락</b>). 자세는 거의 같아도 숫자는 크게 다를 수 있음.</li>
    </ul>
    <p><b>쿼터니언</b>은 4차원 단위 구 위의 점. <b>slerp</b>는 두 점을 잇는 대원호를 따라 일정 속도로 이동함. 그래서 축 하나로 최단 각도를 등각속도로 회전함.</p>
    <p><b>nlerp</b>(선형 보간 후 정규화)는 경로는 같지만 가운데가 빨라짐. 대신 계산이 싸고 교환법칙이 성립해 블렌딩에 많이 씀.</p>
    <p><code>q</code>와 <code>-q</code>는 같은 회전. 그래서 <code>dot(q0, q1) &lt; 0</code>이면 한쪽 부호를 뒤집어야 짧은 쪽으로 돎.</p>
    <p>초록 점선은 기준인 slerp의 기수(nose) 궤적. 색 선은 현재 방식의 궤적.</p>`,
  // 도식: 회전 공간(단위 구) 위에서 오일러 lerp의 휜 경로와 고르지 않은 간격 vs slerp의 대원호와 같은 간격
  diagram: (L) => {
    const cx = 120, cy = 112, r = 80, pt = (deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];
    const q0 = pt(-130), q1 = pt(-50), nq1 = pt(130);
    const bz = (t) => {
      const c = [q0, [40, 175], [215, 165], q1], u = 1 - t;
      return [0, 1].map((k) => u * u * u * c[0][k] + 3 * u * u * t * c[1][k] + 3 * u * t * t * c[2][k] + t * t * t * c[3][k]);
    };
    const f = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
    return `<svg viewBox="0 0 540 214" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cy}" r="${r}" class="d-dim"/>
    <path d="M${f(q0)} C40,175 215,165 ${f(q1)}" class="d-a"/>
    ${[0.12, 0.3, 0.45, 0.56, 0.65, 0.74, 0.86].map((t) => `<circle cx="${bz(t)[0].toFixed(1)}" cy="${bz(t)[1].toFixed(1)}" r="3" class="f-a"/>`).join('')}
    <path d="M${f(q0)} A${r},${r} 0 0 1 ${f(q1)}" class="d-b"/>
    ${[-120, -110, -100, -90, -80, -70, -60].map((a) => `<circle cx="${pt(a)[0].toFixed(1)}" cy="${pt(a)[1].toFixed(1)}" r="3" class="f-b"/>`).join('')}
    <circle cx="${q0[0].toFixed(1)}" cy="${q0[1].toFixed(1)}" r="5" class="f-accent"/><circle cx="${q1[0].toFixed(1)}" cy="${q1[1].toFixed(1)}" r="5" class="f-accent"/>
    <text x="${(q0[0] - 8).toFixed(1)}" y="${(q0[1] - 6).toFixed(1)}" text-anchor="end" class="t-mono">q0</text>
    <text x="${(q1[0] + 8).toFixed(1)}" y="${(q1[1] - 6).toFixed(1)}" class="t-mono">q1</text>
    <circle cx="${nq1[0].toFixed(1)}" cy="${nq1[1].toFixed(1)}" r="4" class="f-dim"/>
    <text x="${(nq1[0] - 8).toFixed(1)}" y="${(nq1[1] + 12).toFixed(1)}" text-anchor="end" class="t-mono t-dim">−q1</text>
    <text x="${cx}" y="207" text-anchor="middle" class="t-small t-dim">${L('회전 공간 (단위 쿼터니언)', 'rotation space (unit quaternions)')}</text>
    <line x1="262" y1="36" x2="284" y2="36" class="d-a"/>
    <text x="292" y="40" class="t-a">${L('오일러 각 성분별 lerp', 'Euler angle lerp')}</text>
    <text x="292" y="55" class="t-small t-dim">${L('축이 섞여 경로가 휨, 간격 불균일', 'axes mix, path bends, uneven steps')}</text>
    <line x1="262" y1="80" x2="284" y2="80" class="d-b"/>
    <text x="292" y="84" class="t-b">${L('쿼터니언 slerp', 'Quaternion slerp')}</text>
    <text x="292" y="99" class="t-small t-dim">${L('대원호를 따라 같은 각도씩 이동', 'same angle per step on the great arc')}</text>
    <text x="262" y="130" class="t-mono">θ = acos(dot(q0, q1))</text>
    <text x="262" y="147" class="t-mono">q = (sin((1−t)θ) q0 + sin(tθ) q1) / sinθ</text>
    <text x="262" y="178" class="t-small t-dim">${L('q와 −q는 같은 회전', 'q and −q are the same rotation')}</text>
    <text x="262" y="192" class="t-small t-dim">${L('dot &lt; 0 이면 −q1을 써야 짧은 쪽으로 돎', 'If dot &lt; 0, use −q1 to turn the short way')}</text>
  </svg>`;
  },
  look: [
    '"짐벌락 근처" 프리셋을 고르면 두 자세 차이가 약 25°라 slerp(B)는 살짝만 돎. A는 그 15배 가까운 각도를 휘청이며 돎.',
    '"짐벌 → 일반 자세" 프리셋에서 각속도 그래프를 보면 slerp는 평평함(등각속도). 오일러는 한쪽으로 몰려 3배 가까이 변함. nlerp는 가운데가 살짝 볼록함.',
    'B에서 "최단 경로 (부호 보정)"를 끄고 무작위 자세를 몇 번 뽑으면 가끔 360°에 가까운 먼 길로 돎.',
    '"경로 총 회전각 / 최단" 값을 보면 slerp는 1.00, 오일러는 1보다 큼.',
  ],
  refs: [
    { type: 'paper', title: 'Animating Rotation with Quaternion Curves (Ken Shoemake)', year: 1985, url: 'https://dl.acm.org/doi/10.1145/325165.325242', note: 'SIGGRAPH \'85. 쿼터니언 slerp를 그래픽스에 도입.' },
    { type: 'article', title: 'Understanding Slerp, Then Not Using It (Jonathan Blow)', year: 2004, note: 'Game Developer 매거진. nlerp가 실용적인 이유.' },
    { type: 'engine', title: 'Unity - Quaternion.Slerp', url: 'https://docs.unity3d.com/ScriptReference/Quaternion.Slerp.html' },
    { type: 'article', title: 'Gimbal lock (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Gimbal_lock' },
  ],
  params: [
    { key: 'method', label: '보간 방식', type: 'select', group: '보간', options: [
      { value: 'euler', label: '오일러 각 성분별 lerp' },
      { value: 'nlerp', label: '쿼터니언 nlerp' },
      { value: 'slerp', label: '쿼터니언 slerp' },
    ], a: 'euler', b: 'slerp' },
    { key: 'shortest', label: '최단 경로 (부호 보정)', type: 'bool', default: true, when: (p) => p.method !== 'euler', help: 'dot(q0,q1) < 0 이면 q1 = -q1' },
    { key: 'preset', label: '자세 프리셋', type: 'select', group: '장면', options: [
      { value: 'gimbal', label: '짐벌락 근처 (pitch 79°)' },
      { value: 'large', label: '짐벌 → 일반 자세' },
      { value: 'random', label: '무작위' },
    ], default: 'gimbal', shared: true },
    { key: 'duration', label: '보간 시간 (초)', type: 'range', min: 0.5, max: 6, step: 0.1, default: 2.5, shared: true },
    { key: 'autoCam', label: '카메라 자동 회전', type: 'bool', default: true, shared: true },
    { key: 'reroll', label: '새 무작위 자세', type: 'button' },
  ],
  en: {
    title: 'Rotation Interpolation: Euler Lerp vs Quaternion Slerp',
    summary: 'If you lerp each Euler angle (yaw, pitch, roll) between two orientations, the object wobbles along a strange path. Near gimbal lock, it can spin a lot even between two almost equal orientations. Quaternion slerp turns around one fixed axis by the shortest angle at a constant angular speed.',
    views: { a: 'Euler angle lerp', b: 'Quaternion slerp' },
    controls: 'Drag: rotate the camera. "New random pose" button: pick new orientations (when the preset is random)',
    info: `
    <p><b>Euler angles</b> describe a rotation as three axis rotations. Here <code>R = Ry(yaw) * Rx(pitch) * Rz(roll)</code>.</p>
    <p>Problems when you interpolate each component on its own:</p>
    <ul>
      <li>The three rotations mix on different axes, so <b>the path bends</b>.</li>
      <li><b>The angular speed is not constant</b>.</li>
      <li>Several angle sets describe the same orientation, so there is no guarantee of the shortest path.</li>
      <li>When pitch gets close to ±90°, yaw and roll turn around the same axis (<b>gimbal lock</b>). The orientations can be almost the same while the numbers differ a lot.</li>
    </ul>
    <p>A <b>quaternion</b> is a point on the 4D unit sphere. <b>Slerp</b> moves at constant speed along the great arc between two points. So it turns around one axis by the shortest angle at a constant angular speed.</p>
    <p><b>Nlerp</b> (linear interpolation, then normalize) follows the same path, but it is faster in the middle. It is cheap and commutative, so blending uses it a lot.</p>
    <p><code>q</code> and <code>-q</code> are the same rotation. So if <code>dot(q0, q1) &lt; 0</code>, flip the sign of one of them to turn the short way.</p>
    <p>The green dashed line is the nose path of the reference slerp. The colored line is the path of the current method.</p>`,
    look: [
      'Pick the "Near gimbal lock" preset. The two orientations differ by about 25°, so slerp (B) turns only a little. A wobbles through almost 15 times that angle.',
      'In the "Gimbal to normal pose" preset, look at the angular speed graph. Slerp is flat (constant angular speed). Euler bunches up on one side and changes by almost 3 times. Nlerp bulges slightly in the middle.',
      'In B, turn off "Shortest path (sign fix)" and pick random poses a few times. Sometimes it goes the long way, close to 360°.',
      'Check the "Total path angle / shortest" value. Slerp shows 1.00, and Euler is above 1.',
    ],
    refs: [
      'SIGGRAPH \'85. Brought quaternion slerp to graphics.',
      'Game Developer magazine. Why nlerp is practical.',
      null,
      null,
    ],
    params: {
      method: { label: 'Interpolation method', group: 'Interpolation', options: { euler: 'Per-component Euler angle lerp', nlerp: 'Quaternion nlerp', slerp: 'Quaternion slerp' } },
      shortest: { label: 'Shortest path (sign fix)', help: 'If dot(q0,q1) < 0, then q1 = -q1' },
      preset: { label: 'Pose preset', group: 'Scene', options: { gimbal: 'Near gimbal lock (pitch 79°)', large: 'Gimbal to normal pose', random: 'Random' } },
      duration: 'Interpolation time (s)',
      autoCam: 'Auto camera rotation',
      reroll: 'New random pose',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const R = U.rad;
    // ── 쿼터니언 [w, x, y, z] ──
    const qAxis = (ax, ay, az, a) => { const s = Math.sin(a / 2); return [Math.cos(a / 2), ax * s, ay * s, az * s]; };
    const qMul = (a, b) => [
      a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
      a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
      a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
      a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
    ];
    const qDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    const qNorm = (q) => { const l = Math.hypot(...q) || 1; return q.map((v) => v / l); };
    const qRot = (q, v) => {
      const p = qMul(qMul(q, [0, v[0], v[1], v[2]]), [q[0], -q[1], -q[2], -q[3]]);
      return [p[1], p[2], p[3]];
    };
    const fromEuler = (e) => qMul(qMul(qAxis(0, 1, 0, R(e[0])), qAxis(1, 0, 0, R(e[1]))), qAxis(0, 0, 1, R(e[2])));
    const qAngle = (a, b) => 2 * Math.acos(U.clamp(Math.abs(qDot(a, b)), 0, 1));
    function slerp(a, b, t) {
      let d = qDot(a, b);
      if (d > 0.9995) return qNorm(a.map((v, i) => U.lerp(v, b[i], t)));
      d = U.clamp(d, -1, 1);
      const th = Math.acos(d), s = Math.sin(th);
      const wa = Math.sin((1 - t) * th) / s, wb = Math.sin(t * th) / s;
      return a.map((v, i) => v * wa + b[i] * wb);
    }

    let keys = null, clock = 0, camYaw = 0.6, dragX = null;
    function makeKeys() {
      // 실제 오일러 분해기가 내놓을 법한 값들: 자세 차이는 작지만 숫자는 크게 다름
      if (P.preset === 'gimbal') return { e0: [-72, 79, 131], e1: [57, 79, -117] };
      if (P.preset === 'large') return { e0: [0, 85, 10], e1: [170, 40, 170] };
      const r = () => [ctx.rng.range(-180, 180), ctx.rng.range(-85, 85), ctx.rng.range(-180, 180)];
      return { e0: r(), e1: r() };
    }
    let randKeys = null;
    const getKeys = () => {
      if (P.preset === 'random') { if (!randKeys) randKeys = makeKeys(); return randKeys; }
      if (!keys || keys.preset !== P.preset) keys = { ...makeKeys(), preset: P.preset };
      return keys;
    };

    function orient(method, t, k) {
      if (method === 'euler') return fromEuler(k.e0.map((v, i) => U.lerp(v, k.e1[i], t)));
      const q0 = fromEuler(k.e0);
      let q1 = fromEuler(k.e1);
      if (P.shortest && qDot(q0, q1) < 0) q1 = q1.map((v) => -v);
      if (method === 'nlerp') return qNorm(q0.map((v, i) => U.lerp(v, q1[i], t)));
      return slerp(q0, q1, t);
    }

    // ── 투영 ──
    function project(v, W, H, S) {
      const cy = Math.cos(camYaw), sy = Math.sin(camYaw), cp = Math.cos(0.38), sp = Math.sin(0.38);
      const x1 = v[0] * cy - v[2] * sy, z1 = v[0] * sy + v[2] * cy;
      const y2 = v[1] * cp - z1 * sp, z2 = v[1] * sp + z1 * cp;
      const f = 4 / (4 - z2);
      return { x: W / 2 + x1 * S * f, y: H * 0.42 - y2 * S * f, z: z2 };
    }
    // 비행기 와이어프레임 (nose = +Z, 위 = +Y, 오른쪽 날개 = +X)
    const MODEL = [
      [[0, 0, 1.0], [0, 0, -0.8], '#ffffff', 3],
      [[-0.9, 0, 0.05], [0.9, 0, 0.05], '#ffffff', 3],
      [[-0.9, 0, 0.05], [0, 0, 0.45], '#ffffff', 1.5], [[0.9, 0, 0.05], [0, 0, 0.45], '#ffffff', 1.5],
      [[-0.35, 0, -0.75], [0.35, 0, -0.75], '#ffffff', 2],
      [[0, 0, -0.6], [0, 0.4, -0.8], C.warn, 3],
      [[0, 0, 0], [0.55, 0, 0], '#ff5370', 2], [[0, 0, 0], [0, 0.55, 0], '#66d17a', 2], [[0, 0, 0], [0, 0, 0.55], '#4fc3f7', 2],
    ];

    return {
      update(dt) {
        clock += dt;
        if (P.autoCam && dragX === null) camYaw += dt * 0.25;
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height, S = Math.min(W, H) * 0.28;
        const col = ctx.side === 'a' ? C.a : C.b;
        const k = getKeys();
        const d = P.duration, c2 = clock % (2 * d + 1.0);
        const t = c2 < d ? c2 / d : c2 < d + 0.5 ? 1 : c2 < 2 * d + 0.5 ? 1 - (c2 - d - 0.5) / d : 0;
        // 기준 구
        for (const ring of [0, 1, 2]) {
          const pts = [];
          for (let i = 0; i <= 48; i++) {
            const a = (i / 48) * U.TAU, c = Math.cos(a) * 1.25, s = Math.sin(a) * 1.25;
            pts.push(project(ring === 0 ? [c, 0, s] : ring === 1 ? [c, s, 0] : [0, c, s], W, H, S));
          }
          D.poly(g, pts, null, 'rgba(255,255,255,0.07)', 1, false);
        }
        // 궤적 (nose 끝)
        const trace = (m) => { const out = []; for (let i = 0; i <= 80; i++) out.push(project(qRot(orient(m, i / 80, k), [0, 0, 1.25]), W, H, S)); return out; };
        g.setLineDash([4, 4]); D.poly(g, trace('slerp'), null, 'rgba(102,209,122,0.6)', 1.5, false); g.setLineDash([]);
        if (P.method !== 'slerp') D.poly(g, trace(P.method), null, col, 2, false);
        // 시작/끝 자세 고스트
        const drawModel = (q, alpha, lwScale) => {
          const segs = MODEL.map(([a, b, c, w]) => {
            const A = project(qRot(q, a), W, H, S), B = project(qRot(q, b), W, H, S);
            return { A, B, c, w, z: (A.z + B.z) / 2 };
          }).sort((p, q2) => p.z - q2.z);
          g.globalAlpha = alpha;
          for (const s of segs) D.line(g, s.A.x, s.A.y, s.B.x, s.B.y, s.c, s.w * lwScale);
          g.globalAlpha = 1;
        };
        drawModel(fromEuler(k.e0), 0.18, 0.8);
        drawModel(fromEuler(k.e1), 0.18, 0.8);
        const q = orient(P.method, t, k);
        drawModel(q, 1, 1);
        const nose = project(qRot(q, [0, 0, 1.25]), W, H, S);
        D.circle(g, nose.x, nose.y, 5, col, '#000');

        // 각속도 그래프 (최단 각 대비)
        const N = 100, sp = [];
        let total = 0;
        for (let i = 0; i < N; i++) {
          const a = orient(P.method, i / N, k), b = orient(P.method, (i + 1) / N, k), ang = qAngle(a, b);
          total += ang; sp.push(ang * N);
        }
        const q0 = fromEuler(k.e0), q1 = fromEuler(k.e1), geo = Math.max(1e-4, qAngle(q0, q1));
        const usedGeo = P.method !== 'euler' && !P.shortest && qDot(q0, q1) < 0 ? U.TAU - geo : geo;
        const ratio = sp.map((v) => v / geo);
        const top = Math.max(2, Math.ceil(Math.max(...ratio)));
        const gx = 12, gw = W - 24, gy = H - 78, gh = 64;
        D.plot(g, ratio, gx, gy, gw, gh, { min: 0, max: top, color: col, label: GTL.L(`각속도 / 최단 회전 등각속도 (0 ~ ${top})`, `Angular speed / constant speed of shortest turn (0 ~ ${top})`) });
        const y1 = gy + gh - gh / top;
        g.setLineDash([3, 4]); D.line(g, gx, y1, gx + gw, y1, C.good, 1); g.setLineDash([]);
        D.line(g, gx + t * gw, gy, gx + t * gw, gy + gh, 'rgba(255,255,255,0.5)', 1);
        const ce = k.e0.map((v, i) => U.lerp(v, k.e1[i], t));
        D.text(g, GTL.L(`시작 (${k.e0.map((v) => v.toFixed(0)).join(', ')})  →  끝 (${k.e1.map((v) => v.toFixed(0)).join(', ')})   [yaw, pitch, roll]°`, `Start (${k.e0.map((v) => v.toFixed(0)).join(', ')})  →  End (${k.e1.map((v) => v.toFixed(0)).join(', ')})   [yaw, pitch, roll]°`), 10, 8, { size: 11, color: C.dim });
        if (P.method === 'euler') D.text(g, GTL.L(`현재 오일러 (${ce.map((v) => v.toFixed(0)).join(', ')})`, `Current Euler (${ce.map((v) => v.toFixed(0)).join(', ')})`), 10, 24, { size: 11, color: col });
        ctx.stat(GTL.L('최단 회전각', 'Shortest angle'), U.deg(geo).toFixed(1) + '°');
        ctx.stat(GTL.L('경로 총 회전각 / 최단', 'Total path angle / shortest'), (total / geo).toFixed(2) + (usedGeo !== geo ? GTL.L(' (먼 길)', ' (long way)') : ''));
        ctx.stat(GTL.L('각속도 최대/최소', 'Angular speed max/min'), (Math.max(...sp) / Math.max(1e-6, Math.min(...sp))).toFixed(2) + '×');
      },
      onPointer(type, m) {
        if (type === 'down') dragX = m.x;
        else if (type === 'move' && dragX !== null && m.down) { camYaw += (m.x - dragX) * 0.01; dragX = m.x; }
        else if (type === 'up' || type === 'leave') dragX = null;
      },
      onAction(key) { if (key === 'reroll') randKeys = P.preset === 'random' ? makeKeys() : null; },
    };
  },
});
