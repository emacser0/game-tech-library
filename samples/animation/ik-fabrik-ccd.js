// 역운동학(IK): FABRIK vs CCD. 같은 체인, 같은 목표, 같은 반복 횟수
GTL.register({
  id: 'ik-fabrik-ccd',
  title: '역운동학 IK: FABRIK vs CCD',
  summary: '반복형 IK 두 가지 비교. IK(역운동학)는 끝점(손, 발)이 목표에 닿도록 관절 각도를 거꾸로 구하는 방법. CCD는 관절을 끝에서부터 하나씩 돌리고, FABRIK은 점 위치를 앞뒤로 당겨 맞춤. 수렴 속도, 자세의 자연스러움, 제약 처리가 다름.',
  views: { a: 'CCD', b: 'FABRIK' },
  controls: '마우스를 뷰 안에 두면 목표가 마우스를 따라감. 밖에 두면 목표가 자동으로 움직임.',
  info: `
    <p><b>CCD (Cyclic Coordinate Descent)</b>: 끝 관절부터 루트까지 차례로 관절을 회전. "관절에서 끝점을 보는 방향"을 "관절에서 목표를 보는 방향"으로 맞춤.</p>
    <ul>
      <li>장점: 구현이 쉬움. 관절별 각도 제약을 바로 걸 수 있음.</li>
      <li>단점: 끝쪽 관절이 먼저 크게 꺾여 <b>말려 들어가는(curl) 자세</b>가 되기 쉬움. 반복이 많이 필요.</li>
    </ul>
    <p><b>FABRIK (Forward And Backward Reaching IK)</b>: 점과 뼈 길이만으로 자세를 맞춤</p>
    <ul>
      <li>backward: 끝점을 목표에 놓고, 뼈 길이를 유지하며 루트 쪽으로 당김</li>
      <li>forward: 루트를 원래 위치에 놓고, 다시 끝 쪽으로 당김</li>
      <li>장점: 각도와 삼각함수가 없어 빠름. 회전이 체인 전체에 <b>고르게 나뉨</b>. 적은 반복으로도 자연스러움.</li>
      <li>제약: forward 단계에서 부모 뼈 방향 기준으로 방향을 잘라 적용</li>
    </ul>
    <p>체인은 이전 프레임의 자세에서 시작함(warm start). "매 프레임 초기 자세에서"를 켜면 반복 횟수당 수렴 속도를 공정하게 비교할 수 있음.</p>`,
  diagram: (L) => {
    const chain = (p, cls, dash) => `<polyline points="${p.map((q) => q.join(',')).join(' ')}" class="${cls}"${dash ? ' stroke-dasharray="4 3"' : ''}/>`
      + p.map((q) => `<circle cx="${q[0]}" cy="${q[1]}" r="3" class="f-dim"/>`).join('');
    const cross = (x, y) => `<circle cx="${x}" cy="${y}" r="6" class="d-accent"/><line x1="${x - 9}" y1="${y}" x2="${x + 9}" y2="${y}" class="d-accent"/><line x1="${x}" y1="${y - 9}" x2="${x}" y2="${y + 9}" class="d-accent"/>`;
    return `<svg viewBox="0 0 540 210" xmlns="http://www.w3.org/2000/svg">
    <line x1="270" y1="8" x2="270" y2="200" class="d-dim"/>
    <text x="10" y="18" class="t-a">${L('A: CCD (관절 각도 회전)', 'A: CCD (rotate joint angles)')}</text>
    ${chain([[60, 170], [60, 125], [60, 80], [60, 35]], 'd-dim')}
    ${chain([[60, 170], [60, 125], [60, 80], [104.9, 83.2]], 'd-a', true)}
    ${chain([[60, 170], [60, 125], [81.7, 85.6], [119.5, 110.1]], 'd-a')}
    ${cross(200, 90)}
    <text x="72" y="158" class="t-small t-dim">${L('루트 쪽은 거의 그대로', 'root side barely moves')}</text>
    <text x="10" y="186" class="t-small">${L('점선: 1단계 (끝 관절 회전)', 'Dashed: step 1 (turn end joint)')}</text>
    <text x="10" y="200" class="t-small">${L('실선: 2단계 (다음 관절 회전)', 'Solid: step 2 (turn next joint)')}</text>
    <text x="280" y="18" class="t-b">${L('B: FABRIK (점 위치 이동)', 'B: FABRIK (move point positions)')}</text>
    ${chain([[330, 170], [330, 125], [330, 80], [330, 35]], 'd-dim')}
    ${chain([[355.1, 138.7], [383.3, 103.6], [425.1, 86.8], [470, 90]], 'd-b', true)}
    ${chain([[330, 170], [358.2, 134.9], [394.7, 108.6], [438.4, 97.8]], 'd-b')}
    ${cross(470, 90)}
    <circle cx="355.1" cy="138.7" r="5" class="d-b"/>
    <text x="364" y="150" class="t-small t-dim">${L('루트가 밀려남', 'root drifts')}</text>
    <text x="280" y="186" class="t-small">${L('점선: backward (끝점을 목표에)', 'Dashed: backward (end to target)')}</text>
    <text x="280" y="200" class="t-small">${L('실선: forward (루트를 제자리로)', 'Solid: forward (root back in place)')}</text>
  </svg>`;
  },
  look: [
    '반복 횟수를 1~3으로 낮추고 "매 프레임 초기 자세에서"를 켜면 FABRIK은 1~2회에도 거의 닿음. CCD는 끝부분만 꺾인 채 멀리 떨어짐.',
    '"반복 과정 표시"를 켜면 반복마다 중간 자세가 흐리게 보임. CCD는 끝에서부터 말리고 FABRIK은 전체가 함께 휨.',
    '관절 각도 제한을 30° 정도로 걸면 두 방식 모두 도달 범위가 줄어듦. CCD는 관절별 클램프로 제약을 자연스럽게 다룸. FABRIK은 forward 단계에서 잘라낸 만큼 오차가 남기 쉬움.',
    '목표를 도달 거리(점선 원) 밖으로 보내면 두 방식 모두 목표를 향해 일자로 뻗음',
  ],
  refs: [
    { type: 'paper', title: 'FABRIK: A fast, iterative solver for the Inverse Kinematics problem (Aristidou & Lasenby)', year: 2011, note: 'Graphical Models 73(5).' },
    { type: 'paper', title: 'A Combined Optimization Method for Solving the Inverse Kinematics Problem of Mechanical Manipulators (Wang & Chen)', year: 1991, note: 'IEEE Trans. Robotics and Automation 7(4). CCD의 원전.' },
    { type: 'paper', title: 'Inverse Kinematics and Geometric Constraints for Articulated Figure Manipulation (Chris Welman)', year: 1993, note: 'Simon Fraser University 석사 논문. CCD와 Jacobian 방식을 게임, 애니메이션 관점에서 정리.' },
    { type: 'engine', title: 'Unreal Engine - FABRIK / CCDIK Animation Blueprint 노드', note: '엔진에 두 솔버가 모두 내장' },
  ],
  params: [
    { key: 'solver', label: '솔버', type: 'select', group: 'IK', options: [
      { value: 'ccd', label: 'CCD' },
      { value: 'fabrik', label: 'FABRIK' },
    ], a: 'ccd', b: 'fabrik' },
    { key: 'iters', label: '최대 반복 횟수', type: 'int', min: 1, max: 50, default: 4 },
    { key: 'tol', label: '허용 오차 (px)', type: 'range', min: 0.1, max: 10, step: 0.1, default: 1 },
    { key: 'limit', label: '관절 각도 제한 (°)', type: 'int', min: 5, max: 180, default: 180, help: '180 = 제한 없음. 부모 뼈 방향 기준 ±각도' },
    { key: 'cold', label: '매 프레임 초기 자세에서', type: 'bool', default: false, help: '이전 프레임 자세를 이어받지 않음' },
    { key: 'showIter', label: '반복 과정 표시', type: 'bool', default: false },
    { key: 'segments', label: '뼈 개수', type: 'int', min: 2, max: 16, default: 6, shared: true, reset: true, group: '장면' },
    { key: 'tSpeed', label: '자동 목표 속도', type: 'range', min: 0, max: 3, step: 0.05, default: 1, shared: true },
  ],
  en: {
    title: 'Inverse Kinematics (IK): FABRIK vs CCD',
    summary: 'Compares two iterative IK methods. IK (inverse kinematics) works backward to find joint angles so the end point (a hand or foot) reaches a target. CCD turns one joint at a time, starting from the end. FABRIK pulls point positions back and forth to fit. They differ in convergence speed, how natural the pose looks, and how they handle constraints.',
    controls: 'Keep the mouse inside the view and the target follows it. When the mouse is outside, the target moves on its own.',
    info: `
    <p><b>CCD (Cyclic Coordinate Descent)</b>: rotates joints in order, from the end joint to the root. Each joint turns so that "the direction from the joint to the end point" matches "the direction from the joint to the target".</p>
    <ul>
      <li>Pros: easy to build. You can apply per-joint angle limits directly.</li>
      <li>Cons: the joints near the end bend hard first, so the chain tends to <b>curl up</b>. It needs many iterations.</li>
    </ul>
    <p><b>FABRIK (Forward And Backward Reaching IK)</b>: fits the pose using only points and bone lengths.</p>
    <ul>
      <li>Backward: put the end point on the target, then pull toward the root while keeping bone lengths.</li>
      <li>Forward: put the root back in its original place, then pull toward the end again.</li>
      <li>Pros: fast, because it uses no angles or trig. Rotation <b>spreads evenly</b> over the whole chain. It looks natural even with few iterations.</li>
      <li>Constraints: in the forward pass, it clips each direction relative to the parent bone.</li>
    </ul>
    <p>The chain starts from the previous frame's pose (warm start). Turn on "Reset pose every frame" to compare convergence per iteration fairly.</p>`,
    look: [
      'Lower the iterations to 1~3 and turn on "Reset pose every frame". FABRIK almost reaches the target in 1~2 iterations. CCD bends only at the end and stays far away.',
      'Turn on "Show iterations". Each iteration\'s pose appears faintly. CCD curls from the end, while FABRIK bends as a whole.',
      'Set the joint angle limit to about 30°. Both methods reach less far. CCD handles the limit naturally with a per-joint clamp. FABRIK tends to keep some error from the clipping in the forward pass.',
      'Move the target outside the reach (dashed circle). Both methods stretch straight toward the target.',
    ],
    refs: [
      'Graphical Models 73(5).',
      'IEEE Trans. Robotics and Automation 7(4). The original CCD paper.',
      'Master\'s thesis, Simon Fraser University. Covers CCD and Jacobian methods from a game and animation point of view.',
      { title: 'Unreal Engine - FABRIK / CCDIK Animation Blueprint nodes', note: 'The engine has both solvers built in.' },
    ],
    params: {
      solver: 'Solver',
      iters: 'Max iterations',
      tol: 'Tolerance (px)',
      limit: { label: 'Joint angle limit (°)', help: '180 means no limit. ± angle relative to the parent bone direction' },
      cold: { label: 'Reset pose every frame', help: 'Do not carry over the previous frame\'s pose' },
      showIter: 'Show iterations',
      segments: { label: 'Bone count', group: 'Scene' },
      tSpeed: 'Auto target speed',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params, V = U.v2;
    const n = P.segments;
    const UP = -Math.PI / 2;
    let lens = [], pts = [], tAuto = 0, target = { x: 0, y: 0 }, iterPoses = [], lastIters = 0, lastErr = 0, lastUs = 0;
    const base = () => ({ x: ctx.width / 2, y: ctx.height - 30 });
    const reach = () => Math.min(ctx.width * 0.45, ctx.height * 0.8);
    function layout() {
      const R = reach(), w = [];
      for (let i = 0; i < n; i++) w.push(1 - (i / n) * 0.5);
      const sum = w.reduce((a, b) => a + b, 0);
      lens = w.map((x) => (x / sum) * R);
    }
    function straight() {
      const b = base();
      pts = [b];
      let ang = UP;
      for (let i = 0; i < n; i++) { ang += 0.15; const p = pts[i]; pts.push({ x: p.x + Math.cos(ang) * lens[i], y: p.y + Math.sin(ang) * lens[i] }); }
    }
    layout(); straight();

    const lim = () => U.rad(P.limit);
    const parentAng = (p, i) => (i === 0 ? UP : V.angle(V.sub(p[i], p[i - 1])));

    function fabrik(p, t) {
      // backward
      p[n] = { x: t.x, y: t.y };
      for (let i = n - 1; i >= 0; i--) p[i] = V.add(p[i + 1], V.scale(V.norm(V.sub(p[i], p[i + 1])), lens[i]));
      // forward (+ 제약)
      p[0] = base();
      for (let i = 0; i < n; i++) {
        let a = V.angle(V.sub(p[i + 1], p[i]));
        if (P.limit < 180) { const pa = parentAng(p, i); a = pa + U.clamp(U.angleDiff(pa, a), -lim(), lim()); }
        p[i + 1] = V.add(p[i], V.fromAngle(a, lens[i]));
      }
    }
    function ccd(p, t) {
      for (let i = n - 1; i >= 0; i--) {
        const cur = V.angle(V.sub(p[n], p[i])), want = V.angle(V.sub(t, p[i]));
        let delta = U.angleDiff(cur, want);
        if (P.limit < 180) {
          const local = U.angleDiff(parentAng(p, i), V.angle(V.sub(p[i + 1], p[i])));
          delta = U.clamp(local + delta, -lim(), lim()) - local;
        }
        const piv = p[i];
        for (let j = i + 1; j <= n; j++) p[j] = V.add(piv, V.rotate(V.sub(p[j], piv), delta));
      }
    }

    return {
      update(dt) {
        tAuto += dt * P.tSpeed;
        const m = ctx.input.mouse, b = base(), R = reach();
        target = m.inside ? { x: m.x, y: m.y }
          : { x: b.x + Math.sin(tAuto * 0.9) * R * 0.95, y: b.y - R * 0.6 + Math.sin(tAuto * 1.7 + 1) * R * 0.5 };
        if (P.cold) straight();
        pts[0] = base();
        iterPoses = [];
        const t0 = ctx.now();
        let it = 0;
        for (; it < P.iters; it++) {
          if (V.dist(pts[n], target) <= P.tol) break;
          (P.solver === 'ccd' ? ccd : fabrik)(pts, target);
          if (P.showIter) iterPoses.push(pts.map((q) => ({ x: q.x, y: q.y })));
        }
        lastUs = (ctx.now() - t0) * 1000;
        lastIters = it;
        lastErr = V.dist(pts[n], target);
      },
      resize() { layout(); straight(); },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height, b = base();
        const col = ctx.side === 'a' ? C.a : C.b;
        D.grid(g, W, H, 40);
        g.setLineDash([4, 6]); D.circle(g, b.x, b.y, lens.reduce((a, c) => a + c, 0), null, 'rgba(255,255,255,0.15)', 1); g.setLineDash([]);
        D.rect(g, b.x - 30, b.y, 60, 12, '#2a2f38');
        iterPoses.forEach((pose, k) => {
          const a = 0.12 + 0.25 * (k / Math.max(1, iterPoses.length));
          D.poly(g, pose, null, `rgba(255,255,255,${a})`, 2, false);
        });
        // 제약 부채꼴
        if (P.limit < 180) {
          for (let i = 0; i < n; i++) {
            const pa = parentAng(pts, i);
            g.beginPath(); g.moveTo(pts[i].x, pts[i].y);
            g.arc(pts[i].x, pts[i].y, Math.min(26, lens[i] * 0.6), pa - lim(), pa + lim());
            g.closePath(); g.fillStyle = 'rgba(255,203,107,0.10)'; g.fill();
          }
        }
        for (let i = 0; i < n; i++) {
          D.line(g, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, col, Math.max(3, 12 - i * 1.2));
        }
        pts.forEach((p, i) => D.circle(g, p.x, p.y, i === n ? 5 : 6, i === n ? '#fff' : '#20242c', col, 2));
        D.circle(g, target.x, target.y, 9, null, C.warn, 2);
        D.line(g, target.x - 13, target.y, target.x + 13, target.y, C.warn, 1);
        D.line(g, target.x, target.y - 13, target.x, target.y + 13, C.warn, 1);
        // 관절 최대 꺾임
        let maxBend = 0;
        for (let i = 1; i < n; i++) maxBend = Math.max(maxBend, Math.abs(U.angleDiff(parentAng(pts, i), V.angle(V.sub(pts[i + 1], pts[i])))));
        ctx.stat(GTL.L('끝점 오차', 'End point error'), lastErr.toFixed(2) + ' px');
        ctx.stat(GTL.L('사용한 반복', 'Iterations used'), `${lastIters} / ${P.iters}`);
        ctx.stat(GTL.L('풀이 시간', 'Solve time'), lastUs.toFixed(1) + ' µs');
        ctx.stat(GTL.L('관절 최대 꺾임', 'Max joint bend'), U.deg(maxBend).toFixed(0) + '°');
      },
    };
  },
});
