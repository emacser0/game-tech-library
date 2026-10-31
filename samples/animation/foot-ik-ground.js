// 울퉁불퉁한 지면의 발 IK: 발마다 아래로 트레이스, 투 본 IK, 골반 낮추기, 발 회전
GTL.register({
  id: 'foot-ik-ground',
  title: '지면 발 IK와 골반 보정 (Unreal Control Rig, Unity Two Bone IK)',
  summary: '평지용 걷기 클립을 계단과 경사에서 그대로 쓰면 발이 뜨거나 땅에 묻힘. 발마다 아래로 트레이스해 투 본 IK로 발을 지면에 붙이고, 골반을 낮춰 다리가 닿게 하면 발이 지면을 정확히 디딤.',
  views: { a: '애니메이션만', b: '발 IK + 골반 보정' },
  controls: '조작 없음. 캐릭터가 오른쪽으로 계속 걷고, 카메라가 따라감.',
  info: `
    <p><b>지면 발 IK</b>는 애니메이션이 만든 발 위치를 실제 지면 높이에 맞게 고치는 후처리. Unreal에서는 Control Rig나 Leg IK 노드, Unity에서는 Animation Rigging의 Two Bone IK Constraint로 만듦.</p>
    <p>걷기 클립은 평지 기준으로 만듦. 캡슐(루트)은 발밑 한 점의 높이만 따라가므로 계단 위에서 한 발은 공중에 뜨고 다른 발은 계단에 묻힘.</p>
    <p>동작 순서:</p>
    <ul>
      <li>발마다 위에서 아래로 트레이스(레이캐스트)해 지면 높이와 법선을 얻음.</li>
      <li>발 오프셋 = 지면 높이 - 애니메이션 발 높이. 값이 튀지 않게 보간 속도로 따라감.</li>
      <li>골반을 두 오프셋 중 더 낮은 쪽만큼 내림. 낮은 발까지 다리가 닿게 하려는 것. 골반을 내리지 않으면 다리 길이가 모자라 발이 뜸.</li>
      <li>엉덩이에서 발 목표까지 투 본 IK로 무릎 위치를 구함.</li>
      <li>발을 지면 법선에 맞춰 회전함. 경사에서 발끝이 묻히거나 뜨지 않음.</li>
    </ul>
    <p>단점: 트레이스 비용이 발 수만큼 듦. 계단 모서리에서 목표가 갑자기 바뀌므로 보간 속도를 적당히 골라야 함. 너무 느리면 발이 늦게 붙고, 너무 빠르면 떨림.</p>`,
  // 도식: 계단 위의 트레이스, 발 목표, 골반 오프셋
  diagram: (L) => `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    <marker id="arrb" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <path d="M20,180 L20,150 L200,150 L200,120 L330,120 L330,200 Z" class="f-dim"/>
    <line x1="20" y1="120" x2="330" y2="120" class="d-dim" stroke-dasharray="2 3"/>
    <text x="24" y="136" class="t-small t-dim">${L('캡슐 기준 높이', 'capsule floor')}</text>
    <line x1="170" y1="40" x2="104" y2="80" class="d-a" stroke-dasharray="4 3"/><line x1="104" y1="80" x2="110" y2="120" class="d-a" stroke-dasharray="4 3"/>
    <circle cx="110" cy="120" r="4" class="f-a"/>
    <text x="40" y="112" class="t-small t-a">${L('뜬 발 (A)', 'floating foot (A)')}</text>
    <line x1="110" y1="60" x2="110" y2="150" class="d-accent" stroke-dasharray="3 2" marker-end="url(#arr)"/>
    <line x1="250" y1="60" x2="250" y2="120" class="d-accent" stroke-dasharray="3 2" marker-end="url(#arr)"/>
    <text x="104" y="66" text-anchor="end" class="t-small">${L('트레이스', 'trace')}</text>
    <circle cx="110" cy="150" r="4" class="f-good"/><circle cx="250" cy="120" r="4" class="f-good"/>
    <text x="116" y="164" class="t-small">${L('지면 맞춤 목표', 'hit point target')}</text>
    <line x1="180" y1="48" x2="120" y2="100" class="d-b"/><line x1="120" y1="100" x2="110" y2="150" class="d-b"/>
    <line x1="180" y1="48" x2="232" y2="88" class="d-b"/><line x1="232" y1="88" x2="250" y2="120" class="d-b"/>
    <circle cx="170" cy="40" r="5" class="f-a"/><circle cx="180" cy="48" r="5" class="f-b"/>
    <line x1="166" y1="22" x2="166" y2="44" class="d-b" marker-end="url(#arrb)"/>
    <text x="70" y="28" class="t-small t-b">${L('골반 낮춤', 'lower pelvis')}</text>
    <text x="350" y="40">${L('B의 처리 순서', 'Steps in B')}</text>
    <text x="350" y="62" class="t-small">${L('1. 발마다 아래로 트레이스', '1. Trace down per foot')}</text>
    <text x="350" y="80" class="t-small">${L('2. 발 오프셋 = 지면 - 애니 발', '2. Offset = ground - anim foot')}</text>
    <text x="350" y="98" class="t-small">${L('3. 골반을 더 낮은 오프셋만큼 내림', '3. Lower pelvis by the lower offset')}</text>
    <text x="350" y="116" class="t-small">${L('4. 투 본 IK로 무릎 계산', '4. Two bone IK for the knee')}</text>
    <text x="350" y="134" class="t-small">${L('5. 발을 지면 법선에 맞춤', '5. Rotate foot to the normal')}</text>
    <text x="350" y="166" class="t-small t-dim">${L('골반을 안 내리면 다리 길이 부족', 'No pelvis drop: leg too short')}</text>
    <text x="350" y="180" class="t-small t-dim">${L('낮은 계단까지 발이 못 닿음', 'to reach the lower step')}</text>
  </svg>`,
  look: [
    'A가 계단을 오를 때 한 발이 공중에 뜨고 다른 발은 계단 안으로 묻힘. B는 두 발이 모두 디딘 단 위에 놓임.',
    'B에서 "골반 보정"을 끄면 낮은 계단을 디딘 다리가 쭉 펴진 채 발이 뜸. "IK 도달 부족" 값이 커짐.',
    '지면을 "경사"로 바꾸고 B의 "발 회전"을 끄면 오르막에서 발끝이 땅에 묻힘. 켜면 발바닥이 경사와 나란함.',
    '"보간 속도"를 2 근처로 낮추면 계단 모서리에서 발이 늦게 붙음. 30 근처로 올리면 모서리마다 골반이 툭 떨어짐.',
  ],
  refs: [
    { type: 'engine', title: 'Unreal Engine - Control Rig', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/control-rig-in-unreal-engine', note: '트레이스와 Basic IK, Full Body IK 노드로 발 IK와 골반 보정을 구성.' },
    { type: 'engine', title: 'Unreal Engine - Leg IK, Two Bone IK animation nodes', note: 'Animation Blueprint의 스켈레탈 컨트롤 노드.' },
    { type: 'engine', title: 'Unity Animation Rigging - Two Bone IK Constraint', url: 'https://docs.unity3d.com/Packages/com.unity.animation.rigging@1.3/manual/constraints/TwoBoneIKConstraint.html', note: 'Root, Mid, Tip 본과 Target, Hint로 다리 IK를 만듦.' },
    { type: 'engine', title: 'Unity Manual - Inverse Kinematics (OnAnimatorIK, SetIKPosition)', url: 'https://docs.unity3d.com/Manual/InverseKinematics.html', note: 'Humanoid 리그의 내장 발 IK.' },
  ],
  params: [
    { key: 'ik', label: '발 IK', type: 'bool', group: '발 IK', a: false, b: true, default: false, help: '발마다 트레이스해 지면에 맞춤' },
    { key: 'pelvis', label: '골반 보정', type: 'bool', default: true, when: (p) => p.ik, help: '두 발 오프셋 중 더 낮은 쪽만큼 골반을 내림' },
    { key: 'footRot', label: '발 회전', type: 'bool', default: true, when: (p) => p.ik, help: '디딘 발을 지면 법선 방향에 맞춤' },
    { key: 'interp', label: '보간 속도', type: 'range', min: 2, max: 40, step: 0.5, default: 14, when: (p) => p.ik, help: '오프셋이 목표를 따라가는 속도 (1/초)' },
    { key: 'traces', label: '트레이스 표시', type: 'bool', default: true, shared: true },
    { key: 'terrain', label: '지면', type: 'select', group: '장면', shared: true, reset: true, options: [
      { value: 'stairs', label: '계단' },
      { value: 'slope', label: '경사' },
      { value: 'mixed', label: '섞음 (계단, 경사, 둔덕)' },
    ], default: 'stairs' },
    { key: 'stepH', label: '계단 높이 (px)', type: 'range', min: 6, max: 30, step: 1, default: 18, shared: true, reset: true },
    { key: 'speed', label: '걷기 속도 배율', type: 'range', min: 0.3, max: 1.5, step: 0.01, default: 0.8, shared: true },
  ],
  en: {
    title: 'Ground Foot IK and Pelvis Offset (Unreal Control Rig, Unity Two Bone IK)',
    summary: 'A walk clip made for flat ground makes feet float or sink on stairs and slopes. Tracing down per foot, placing the foot with two bone IK, and lowering the pelvis so the leg can reach makes the feet land exactly on the ground.',
    views: { a: 'Animation only', b: 'Foot IK + pelvis offset' },
    controls: 'No input. The character keeps walking to the right, and the camera follows.',
    info: `
    <p><b>Ground foot IK</b> is a post process that moves the animated foot to the real ground height. In Unreal you build it with Control Rig or the Leg IK node. In Unity you use the Two Bone IK Constraint of Animation Rigging.</p>
    <p>Walk clips are made for flat ground. The capsule (root) follows the height of one point under it, so on stairs one foot floats in the air and the other sinks into the step.</p>
    <p>Steps:</p>
    <ul>
      <li>Trace (raycast) down for each foot to get the ground height and normal.</li>
      <li>Foot offset = ground height - animated foot height. It follows the target at the interp speed so it does not jump.</li>
      <li>Lower the pelvis by the lower of the two offsets, so the leg can reach the lower foot. Without it, the leg is too short and the foot floats.</li>
      <li>Solve the knee with two bone IK from the hip to the foot target.</li>
      <li>Rotate the foot to the ground normal, so the toes do not sink or float on slopes.</li>
    </ul>
    <p>Downsides: each foot costs one trace. Targets change suddenly at stair edges, so the interp speed needs care. Too slow and the foot lands late; too fast and it jitters.</p>`,
    look: [
      'When A climbs stairs, one foot floats in the air and the other sinks into the step. In B both feet rest on the step they stand on.',
      'Turn off "Pelvis offset" in B. The leg on the lower step stays fully straight and the foot floats. The "IK reach shortfall" value grows.',
      'Set the ground to "Slope" and turn off "Foot rotation" in B. On the uphill, the toes sink into the ground. Turn it on and the sole lies along the slope.',
      'Lower "Interp speed" to about 2. The foot lands late at stair edges. Raise it to about 30 and the pelvis drops sharply at every edge.',
    ],
    refs: [
      'Build foot IK and the pelvis offset with traces and the Basic IK or Full Body IK nodes.',
      'Skeletal control nodes in the Animation Blueprint.',
      'Builds leg IK from the Root, Mid, Tip bones with a Target and a Hint.',
      'Built-in foot IK for Humanoid rigs.',
    ],
    params: {
      ik: { label: 'Foot IK', group: 'Foot IK', help: 'Trace per foot and fit it to the ground' },
      pelvis: { label: 'Pelvis offset', help: 'Lower the pelvis by the lower of the two foot offsets' },
      footRot: { label: 'Foot rotation', help: 'Align the planted foot to the ground normal' },
      interp: { label: 'Interp speed', help: 'How fast offsets follow their target (1/s)' },
      traces: 'Show traces',
      terrain: { label: 'Ground', group: 'Scene', options: { stairs: 'Stairs', slope: 'Slope', mixed: 'Mixed (stairs, slope, bumps)' } },
      stepH: 'Step height (px)',
      speed: 'Walk speed scale',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const THIGH = 44, SHIN = 44, HIP = 84, ANK = 7, STRIDE = 56, PERIOD = 1.0, TOE = 18;
    let segs, rootX, rootY, phase, gL, gR, pelv, rotL, rotR, camY, errHist, errSum, errT, shortSum;

    // 지면 구간 생성 (지연 생성, ctx.rng 순서로 결정적)
    function addSeg() {
      const last = segs[segs.length - 1], x0 = last ? last.x1 : -400, y0 = last ? last.y1 : 0;
      let type = 'flat';
      const mode = P.terrain;
      const r = ctx.rng.range(0, 1);
      const up = y0 < -60 ? true : y0 > 60 ? false : ctx.rng.range(0, 1) < 0.5;
      if (!last || x0 < 0) type = 'flat';
      else if (last.type !== 'flat') type = 'flat';
      else if (mode === 'stairs') type = 'stairs';
      else if (mode === 'slope') type = 'slope';
      else type = r < 0.4 ? 'stairs' : r < 0.75 ? 'slope' : 'bump';
      const s = { type, x0, y0 };
      if (type === 'flat') { s.x1 = x0 + ctx.rng.range(70, 140); s.y1 = y0; }
      else if (type === 'stairs') {
        s.n = ctx.rng.int(3, 6); s.w = ctx.rng.range(30, 46); s.h = P.stepH * (up ? 1 : -1);
        s.x1 = x0 + s.n * s.w; s.y1 = y0 + s.n * s.h;
      } else if (type === 'slope') {
        const ang = U.rad(ctx.rng.range(14, 26)) * (up ? 1 : -1), len = ctx.rng.range(120, 200);
        s.grad = Math.tan(ang); s.x1 = x0 + len; s.y1 = y0 + len * s.grad;
      } else { s.amp = ctx.rng.range(10, 18); s.x1 = x0 + ctx.rng.range(90, 130); s.y1 = y0; }
      segs.push(s);
    }
    function segAt(x) {
      while (segs[segs.length - 1].x1 <= x) addSeg();
      let lo = 0, hi = segs.length - 1;
      while (lo < hi) { const m = (lo + hi) >> 1; if (segs[m].x1 <= x) lo = m + 1; else hi = m; }
      return segs[lo];
    }
    // 지면 높이(위쪽 +)와 기울기
    function ground(x) {
      const s = segAt(x), u = x - s.x0;
      if (s.type === 'flat') return { y: s.y0, slope: 0 };
      if (s.type === 'slope') return { y: s.y0 + u * s.grad, slope: s.grad };
      if (s.type === 'stairs') return { y: s.y0 + Math.min(s.n, Math.floor(u / s.w) + 1) * s.h, slope: 0 };
      const k = Math.PI / (s.x1 - s.x0);
      return { y: s.y0 + s.amp * Math.sin(u * k) ** 2, slope: s.amp * 2 * Math.sin(u * k) * Math.cos(u * k) * k };
    }
    const init = () => {
      ctx.rng = U.rng(ctx.seed);
      segs = []; addSeg();
      rootX = 0; rootY = 0; phase = 0; gL = gR = null; pelv = rotL = rotR = 0; camY = 0;
      errHist = []; errSum = 0; errT = 0; shortSum = 0;
    };
    init();

    // 평지용 걷기 클립: 루트 기준 발 위치 (x 앞, 높이 lift)
    function animFoot(q) {
      if (q < 0.5) return { x: STRIDE / 2 - STRIDE * q * 2, lift: 0 };
      const s = (q - 0.5) * 2;
      return { x: -STRIDE / 2 + STRIDE * U.smoothstep(0, 1, s), lift: Math.sin(s * Math.PI) * 14 };
    }
    // 2D 투 본 IK (무릎은 앞쪽으로). 화면 좌표가 아닌 월드 좌표(위쪽 +)
    function ik2(hip, tgt) {
      const dx = tgt.x - hip.x, dy = tgt.y - hip.y, dist = Math.hypot(dx, dy), d = Math.min(dist, THIGH + SHIN - 0.01);
      const a = Math.atan2(dy, dx), c = Math.acos(U.clamp((THIGH * THIGH + d * d - SHIN * SHIN) / (2 * THIGH * d), -1, 1));
      const knee = { x: hip.x + Math.cos(a + c) * THIGH, y: hip.y + Math.sin(a + c) * THIGH };
      return { knee, ankle: { x: hip.x + Math.cos(a) * d, y: hip.y + Math.sin(a) * d }, short: Math.max(0, dist - d) };
    }

    let pose = null;
    function solve(dt) {
      const qL = phase % 1, qR = (phase + 0.5) % 1, fL = animFoot(qL), fR = animFoot(qR);
      const feet = [[fL, 'L'], [fR, 'R']].map(([f, s]) => {
        const wx = rootX + f.x, gnd = ground(wx);
        return { f, s, wx, gnd, animY: rootY + f.lift };
      });
      const k = 1 - Math.exp(-P.interp * dt);
      if (P.ik) {
        // 지면 높이를 월드 기준으로 보간 (캡슐이 움직여도 목표가 밀리지 않음)
        if (gL === null) { gL = feet[0].gnd.y; gR = feet[1].gnd.y; }
        gL += (feet[0].gnd.y - gL) * k; gR += (feet[1].gnd.y - gR) * k;
        const tp = P.pelvis ? Math.min(0, gL - rootY, gR - rootY) : 0;
        pelv += (tp - pelv) * k;
        const ra = (f) => (P.footRot ? Math.atan(f.gnd.slope) * (1 - U.clamp(f.f.lift / 8, 0, 1)) : 0);
        rotL += (ra(feet[0]) - rotL) * k; rotR += (ra(feet[1]) - rotR) * k;
      } else { gL = gR = null; pelv = rotL = rotR = 0; }
      const hip = { x: rootX + 4, y: rootY + HIP + pelv };
      const legs = feet.map((ft, i) => {
        const off = P.ik ? (i === 0 ? gL : gR) - rootY : 0, rot = i === 0 ? rotL : rotR;
        // 발목 목표: 발바닥이 지면에 닿도록 발목은 법선 방향으로 ANK만큼 위
        const tgt = { x: ft.wx, y: ft.animY + off + ANK / Math.cos(rot) };
        const r = ik2(hip, tgt);
        return { ...ft, rot, r, tgt };
      });
      pose = { hip, legs };
      return pose;
    }

    return {
      update(dt) {
        const spd = (2 * STRIDE / PERIOD) * P.speed;
        rootX += spd * dt;
        phase = (phase + (dt / PERIOD) * P.speed) % 1;
        rootY = U.damp(rootY, ground(rootX).y, 14, dt); // 캡슐 높이 (두 뷰 같음)
        camY = U.damp(camY, rootY, 3, dt);
        const ps = solve(dt);
        // 디딘 발의 오차 (발바닥과 지면 사이 거리)
        let e = 0, n = 0, sh = 0;
        for (const l of ps.legs) {
          sh += l.r.short;
          if (l.f.lift < 1) {
            const c = Math.cos(l.rot), si = Math.sin(l.rot), ax = l.r.ankle.x + si * ANK, ay = l.r.ankle.y - c * ANK;
            const toeX = ax + c * TOE, toeY = ay + si * TOE;
            e += Math.abs(ay - ground(ax).y) + Math.max(0, ground(toeX).y - toeY); n++; // 뒤꿈치 틈 + 발끝 묻힘
          }
        }
        const err = n ? e / n : 0;
        errHist.push(err); if (errHist.length > 240) errHist.shift();
        errSum = errSum * 0.995 + err; errT = errT * 0.995 + 1; shortSum = shortSum * 0.95 + sh * 0.05;
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height, col = ctx.side === 'a' ? C.a : C.b;
        const ps = pose || solve(0);
        const ox = W * 0.4 - rootX, oy = H * 0.55 + camY;
        const S = (x, y) => ({ x: x + ox, y: oy - y });
        // 지면
        const pts = [];
        for (let sx = 0; sx <= W; sx += 1) { const x = sx - ox; pts.push({ x: sx, y: oy - ground(x).y }); }
        pts.push({ x: W, y: H }, { x: 0, y: H });
        D.poly(g, pts, '#262b34', null);
        D.poly(g, pts.slice(0, -2), null, 'rgba(255,255,255,0.45)', 1.5, false);
        // 트레이스
        if (P.traces && P.ik) {
          for (const l of ps.legs) {
            const a = S(l.wx, rootY + HIP + 30), b = S(l.wx, l.gnd.y);
            g.setLineDash([3, 3]); D.line(g, a.x, a.y, b.x, b.y, C.accent, 1); g.setLineDash([]);
            D.circle(g, b.x, b.y, 3, C.good);
          }
        }
        // 캐릭터
        const hp = S(ps.hip.x, ps.hip.y);
        if (P.ik && P.pelvis) {
          const h0 = S(ps.hip.x, rootY + HIP);
          D.line(g, h0.x - 14, h0.y, h0.x + 14, h0.y, 'rgba(255,255,255,0.3)', 1);
          if (Math.abs(pelv) > 0.5) D.arrow(g, h0.x + 18, h0.y, h0.x + 18, hp.y, C.b, 1.5, 5);
        }
        const leg = (l, c) => {
          const k = S(l.r.knee.x, l.r.knee.y), an = S(l.r.ankle.x, l.r.ankle.y);
          D.line(g, hp.x, hp.y, k.x, k.y, c, 5); D.line(g, k.x, k.y, an.x, an.y, c, 5);
          const heel = S(l.r.ankle.x - Math.cos(l.rot) * 4 + Math.sin(l.rot) * ANK, l.r.ankle.y - ANK * Math.cos(l.rot) - Math.sin(l.rot) * 4);
          const toe = S(l.r.ankle.x + Math.cos(l.rot) * TOE + Math.sin(l.rot) * ANK, l.r.ankle.y - ANK * Math.cos(l.rot) + Math.sin(l.rot) * TOE);
          D.line(g, an.x, an.y, heel.x, heel.y, c, 4); D.line(g, heel.x, heel.y, toe.x, toe.y, c, 4);
          if (l.f.lift < 1) D.circle(g, heel.x, heel.y, 3, C.warn);
        };
        leg(ps.legs[1], 'rgba(255,255,255,0.4)');
        const neck = S(ps.hip.x + 6, ps.hip.y + 60);
        D.line(g, hp.x, hp.y, neck.x, neck.y, col, 6);
        const sw = Math.sin(phase * U.TAU) * 0.5;
        D.line(g, neck.x, neck.y + 4, neck.x + Math.sin(sw) * 34, neck.y + 4 + Math.cos(sw) * 34, col, 4);
        D.circle(g, neck.x + 3, neck.y - 16, 13, '#20242c', col, 3);
        leg(ps.legs[0], col);

        D.plot(g, errHist.map((v) => Math.min(v, 30)), 12, H - 70, W - 24, 56, { min: 0, max: 30, color: col, label: GTL.L('디딘 발과 지면 사이 거리 (px)', 'Gap between planted foot and ground (px)') });
        ctx.stat(GTL.L('평균 발 오차', 'Average foot error'), (errSum / Math.max(1e-6, errT)).toFixed(1) + ' px');
        ctx.stat(GTL.L('골반 오프셋', 'Pelvis offset'), pelv.toFixed(1) + ' px');
        ctx.stat(GTL.L('IK 도달 부족', 'IK reach shortfall'), shortSum.toFixed(1) + ' px');
      },
    };
  },
});
