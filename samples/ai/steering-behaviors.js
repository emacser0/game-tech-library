// 조향 행동 (Steering Behaviors): Seek / Arrive / Flee / Pursue / Evade / Wander
GTL.register({
  id: 'steering-behaviors',
  title: '조향 행동: Seek, Arrive, Pursue, Wander',
  summary: 'Reynolds의 조향 행동은 "원하는 속도 − 현재 속도"를 힘으로 쓰는 단순한 규칙. 목표로 곧장 달려드는 Seek는 목표를 지나쳐 진동함. Arrive는 감속 반경 안에서 부드럽게 멈춤.',
  views: { a: 'Seek', b: 'Arrive' },
  controls: '목표가 "마우스"이면 마우스 위치를 따라감',
  info: `
    <p>조향 행동(steering behavior)은 캐릭터가 목표를 향해 스스로 움직이게 하는 규칙. 모든 행동이 같은 틀을 씀.</p>
    <ul>
      <li><code>steering = desired_velocity − velocity</code>를 계산함.</li>
      <li>이 값을 <b>최대 힘</b>으로 자름.</li>
      <li>질량으로 나눠 가속도로 씀.</li>
    </ul>
    <p>차량(움직이는 캐릭터)은 최대 속도와 최대 힘 제한 때문에 방향을 즉시 바꾸지 못함. 그래서 자연스러운 곡선을 그림.</p>
    <ul>
      <li><b>Seek</b>: desired = 목표 방향 × 최대 속도. 목표에 도착해도 감속하지 않음. 그래서 <b>지나치고 되돌아오기</b>를 반복함.</li>
      <li><b>Arrive</b>: 감속 반경 안에서 desired 속도를 거리에 비례해 줄임.</li>
      <li><b>Flee</b>: Seek의 반대 방향.</li>
      <li><b>Pursue / Evade</b>: 목표의 현재 위치 대신 <b>예측 위치</b>(위치 + 속도 × T)로 Seek/Flee를 함. T는 거리/속도에 비례.</li>
      <li><b>Wander</b>: 앞쪽 원 위의 점을 매 프레임 조금씩 무작위로 옮기고, 그 점으로 Seek를 함. 결과는 부드러운 배회.</li>
    </ul>
    <p>화살표 읽는 법:</p>
    <ul>
      <li>흰색: 현재 속도</li>
      <li>초록: 원하는 속도</li>
      <li>빨강: 조향력</li>
    </ul>
    <p>맵 가장자리에서는 경계 유지(containment) 힘이 더해짐.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="sb-n" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="18">${L('조향력 = 원하는 속도 − 현재 속도', 'steering = desired − velocity')}</text>
    <circle cx="128" cy="40" r="6" class="f-good"/>
    <text x="140" y="44" class="t-small t-dim">${L('목표', 'target')}</text>
    <circle cx="40" cy="150" r="4" class="f-dim"/>
    <line x1="40" y1="150" x2="170" y2="150" class="d-line" marker-end="url(#sb-n)"/>
    <line x1="40" y1="150" x2="110" y2="62" class="d-good" marker-end="url(#sb-n)"/>
    <line x1="170" y1="150" x2="112" y2="65" class="d-bad" marker-end="url(#sb-n)"/>
    <text x="105" y="168" text-anchor="middle" class="t-small">${L('현재 속도', 'velocity')}</text>
    <text x="70" y="100" text-anchor="end" class="t-small">${L('원하는 속도', 'desired')}</text>
    <text x="150" y="100" class="t-small">${L('조향력', 'steering')}</text>
    <text x="150" y="113" class="t-small t-dim">${L('최대 힘으로 자름', 'clamped to max force')}</text>
    <line x1="262" y1="10" x2="262" y2="180" class="d-dim"/>
    <line x1="290" y1="40" x2="290" y2="160" class="d-dim"/>
    <line x1="290" y1="160" x2="528" y2="160" class="d-dim"/>
    <text x="294" y="34" class="t-small t-dim">${L('원하는 속력', 'desired speed')}</text>
    <text x="528" y="174" text-anchor="end" class="t-small t-dim">${L('목표까지 거리', 'distance')}</text>
    <text x="290" y="174" text-anchor="middle" class="t-small t-dim">0</text>
    <text x="286" y="62" text-anchor="end" class="t-small t-dim">${L('최대', 'max')}</text>
    <line x1="400" y1="44" x2="400" y2="160" class="d-dim" stroke-dasharray="4 3"/>
    <text x="400" y="174" text-anchor="middle" class="t-small t-dim">${L('감속 반경', 'slowing radius')}</text>
    <path d="M290,58 L528,58" class="d-a"/>
    <path d="M290,160 L400,62 L528,62" class="d-b"/>
    <text x="300" y="50" class="t-a">${L('Seek: 항상 최대 속력', 'Seek: always max speed')}</text>
    <text x="352" y="130" class="t-b">${L('Arrive: 거리에 비례해 감속', 'Arrive: scales with distance')}</text>
    <text x="10" y="194" class="t-small t-dim">${L('Seek는 목표 위에서도 최대 속력이라 지나침. Arrive는 목표에서 0이 되어 멈춤.', 'Seek still has max speed at the target, so it overshoots. Arrive reaches 0 there and stops.')}</text>
  </svg>`,
  look: [
    '기본 상태(목표가 4초마다 이동)로 실행하면 A(Seek)는 목표를 지나쳐 빙빙 돌고, B(Arrive)는 감속 원 안에서 미끄러지듯 멈춤. "정착 시간"이 B 쪽이 짧음.',
    '목표를 "원 궤도로 이동"으로, A를 Seek, B를 Pursue로 두면 Pursue가 예측점(노란 점)을 향해 가로질러 더 빨리 따라잡음. "평균 거리"가 B 쪽이 작음.',
    '최대 힘을 낮추면 회전 반경이 커지고 Seek의 진동이 심해짐. 최대 힘을 아주 높이면 Seek도 거의 직선으로 붙음.',
    'Wander의 지터(jitter)와 원 반경을 바꾸면 배회 성격이 바뀜(초조함 vs 느긋함).',
  ],
  refs: [
    { type: 'paper', title: 'Steering Behaviors For Autonomous Characters', year: 1999, note: 'Craig W. Reynolds, GDC 1999. Seek/Flee/Pursue/Evade/Arrive/Wander 정의.', url: 'https://www.red3d.com/cwr/steer/gdc99/' },
    { type: 'article', title: 'Steering Behaviors (Craig Reynolds 홈페이지)', url: 'https://www.red3d.com/cwr/steer/', note: '각 행동의 자바 애플릿 데모 모음.' },
    { type: 'book', title: 'Programming Game AI by Example', year: 2004, note: 'Mat Buckland. 3장 "How to Create Autonomous Moving Game Agents".' },
    { type: 'book', title: 'The Nature of Code - Autonomous Agents', url: 'https://natureofcode.com/autonomous-agents/', note: 'Daniel Shiffman. 조향 행동 입문.' },
  ],
  params: [
    { key: 'behavior', label: '행동', type: 'select', group: '행동', options: [
      { value: 'seek', label: 'Seek (추적)' },
      { value: 'arrive', label: 'Arrive (도착)' },
      { value: 'flee', label: 'Flee (도주)' },
      { value: 'pursue', label: 'Pursue (예측 추적)' },
      { value: 'evade', label: 'Evade (예측 회피)' },
      { value: 'wander', label: 'Wander (배회)' },
    ], a: 'seek', b: 'arrive' },
    { key: 'slowRadius', label: '감속 반경 (px)', type: 'range', min: 20, max: 300, step: 5, default: 140, when: (p) => p.behavior === 'arrive' },
    { key: 'predict', label: '최대 예측 시간 (s)', type: 'range', min: 0, max: 3, step: 0.05, default: 1.2, when: (p) => p.behavior === 'pursue' || p.behavior === 'evade' },
    { key: 'wanderR', label: 'Wander 원 반경', type: 'range', min: 5, max: 120, step: 1, default: 40, when: (p) => p.behavior === 'wander' },
    { key: 'wanderD', label: 'Wander 원 거리', type: 'range', min: 0, max: 200, step: 1, default: 80, when: (p) => p.behavior === 'wander' },
    { key: 'jitter', label: 'Wander 지터 (rad/s)', type: 'range', min: 0, max: 20, step: 0.1, default: 5, when: (p) => p.behavior === 'wander' },
    { key: 'maxSpeed', label: '최대 속도 (px/s)', type: 'range', min: 50, max: 600, step: 10, default: 260, shared: true, group: '차량' },
    { key: 'maxForce', label: '최대 힘 (px/s²)', type: 'range', min: 50, max: 3000, step: 10, default: 700, shared: true },
    { key: 'target', label: '목표', type: 'select', shared: true, group: '장면', options: [
      { value: 'points', label: '4초마다 순간 이동' },
      { value: 'moving', label: '원 궤도로 이동' },
      { value: 'mouse', label: '마우스' },
    ], default: 'points' },
    { key: 'targetSpeed', label: '목표 이동 속도', type: 'range', min: 0.1, max: 2, step: 0.05, default: 1.1, shared: true, when: (p) => p.target === 'moving' },
    { key: 'showVec', label: '벡터 표시', type: 'bool', default: true, shared: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Steering Behaviors: Seek, Arrive, Pursue, Wander',
    summary: 'Reynolds steering behaviors are simple rules that use "desired velocity minus current velocity" as a force. Seek rushes straight at the target, overshoots, and oscillates. Arrive stops smoothly inside a slowing radius.',
    views: { a: 'Seek', b: 'Arrive' },
    controls: 'When the target is "Mouse", the agent follows the mouse.',
    info: `
    <p>A steering behavior is a rule that makes a character move toward a goal on its own. All behaviors share the same frame.</p>
    <ul>
      <li>Compute <code>steering = desired_velocity − velocity</code>.</li>
      <li>Clamp it to the <b>max force</b>.</li>
      <li>Divide by mass and use it as acceleration.</li>
    </ul>
    <p>The vehicle (the moving character) cannot turn instantly because of its max speed and max force limits. So it draws natural curves.</p>
    <ul>
      <li><b>Seek</b>: desired = direction to target × max speed. It does not slow down at the target. So it <b>overshoots and comes back</b> again and again.</li>
      <li><b>Arrive</b>: inside the slowing radius, it scales the desired speed by distance.</li>
      <li><b>Flee</b>: the opposite direction of Seek.</li>
      <li><b>Pursue / Evade</b>: Seek or Flee toward the <b>predicted position</b> (position + velocity × T) instead of the current one. T grows with distance / speed.</li>
      <li><b>Wander</b>: move a point on a circle ahead of the agent a little at random each frame, then Seek that point. The result is smooth roaming.</li>
    </ul>
    <p>How to read the arrows:</p>
    <ul>
      <li>White: current velocity</li>
      <li>Green: desired velocity</li>
      <li>Red: steering force</li>
    </ul>
    <p>Near the map edge, a containment force is added.</p>`,
    look: [
      'Run with defaults (the target moves every 4 seconds). A (Seek) overshoots and circles the target. B (Arrive) glides to a stop inside the slowing circle. "Settle time" is shorter in B.',
      'Set the target to "Move on a circle", A to Seek, and B to Pursue. Pursue cuts across toward the predicted point (yellow dot) and catches up sooner. "Avg distance" is smaller in B.',
      'Lower max force. The turning radius grows and Seek oscillates more. Set max force very high and Seek also sticks to the target in a near straight line.',
      'Change Wander jitter and circle radius. The roaming style changes (nervous vs relaxed).',
    ],
    refs: [
      'Craig W. Reynolds, GDC 1999. Defines Seek, Flee, Pursue, Evade, Arrive, and Wander.',
      { title: 'Steering Behaviors (Craig Reynolds homepage)', note: 'A set of Java applet demos for each behavior.' },
      'Mat Buckland. Chapter 3, "How to Create Autonomous Moving Game Agents".',
      'Daniel Shiffman. An introduction to steering behaviors.',
    ],
    params: {
      behavior: { label: 'Behavior', group: 'Behavior', options: { seek: 'Seek', arrive: 'Arrive', flee: 'Flee', pursue: 'Pursue (predictive chase)', evade: 'Evade (predictive escape)', wander: 'Wander' } },
      slowRadius: 'Slowing radius (px)',
      predict: 'Max prediction time (s)',
      wanderR: 'Wander circle radius',
      wanderD: 'Wander circle distance',
      jitter: 'Wander jitter (rad/s)',
      maxSpeed: { label: 'Max speed (px/s)', group: 'Vehicle' },
      maxForce: 'Max force (px/s²)',
      target: { label: 'Target', group: 'Scene', options: { points: 'Teleport every 4 s', moving: 'Move on a circle', mouse: 'Mouse' } },
      targetSpeed: 'Target speed',
      showVec: 'Show vectors',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, V = U.v2, D = U.draw, C = U.colors, P = ctx.params;
    let calm = 0, agent, target, tvel, timer, trail, wanderAng, settle, lastSettle, distHist, tPhase, pred, desired, steer, wanderPt;
    function init() {
      ctx.rng = U.rng(ctx.seed);
      agent = { p: V(ctx.width * 0.2, ctx.height * 0.7), v: V(60, -120) };
      target = V(ctx.width * 0.7, ctx.height * 0.35); tvel = V(0, 0);
      timer = 0; trail = []; wanderAng = 0; settle = 0; lastSettle = null; distHist = []; tPhase = 0;
      pred = null; desired = V(); steer = V(); wanderPt = null;
    }
    init();

    function seek(t) { return V.sub(V.scale(V.norm(V.sub(t, agent.p)), P.maxSpeed), agent.v); }
    function flee(t) { return V.sub(V.scale(V.norm(V.sub(agent.p, t)), P.maxSpeed), agent.v); }

    return {
      update(dt) {
        const W = ctx.width, H = ctx.height;
        // ── 목표 이동 ──
        const prevT = target;
        if (P.target === 'mouse' && ctx.input.mouse.inside) target = V(ctx.input.mouse.x, ctx.input.mouse.y);
        else if (P.target === 'moving') {
          tPhase += dt * P.targetSpeed;
          target = V(W / 2 + Math.cos(tPhase) * W * 0.32, H / 2 + Math.sin(tPhase * 1.3) * H * 0.32);
        } else if (P.target === 'points') {
          timer += dt;
          if (timer > 4) {
            timer = 0;
            if (settle >= 0) lastSettle = 0; // 4초 안에 정착하지 못함
            settle = 0;
            target = V(ctx.rng.range(W * 0.1, W * 0.9), ctx.rng.range(H * 0.15, H * 0.85));
          }
        }
        tvel = dt > 0 ? V.scale(V.sub(target, prevT), 1 / dt) : V();
        if (V.len(tvel) > 3000) tvel = V(); // 순간이동은 속도로 치지 않음

        // ── 행동 ──
        const b = P.behavior;
        pred = null; wanderPt = null;
        let force;
        const toT = V.sub(target, agent.p), dist = V.len(toT);
        if (b === 'seek') force = seek(target);
        else if (b === 'flee') force = dist < 300 ? flee(target) : V.scale(agent.v, -0.5);
        else if (b === 'arrive') {
          const sp = dist < P.slowRadius ? P.maxSpeed * (dist / P.slowRadius) : P.maxSpeed;
          force = V.sub(V.scale(V.norm(toT), sp), agent.v);
        } else if (b === 'pursue' || b === 'evade') {
          const T = Math.min(P.predict, dist / Math.max(1, V.len(agent.v) + V.len(tvel)) * 2);
          pred = V.add(target, V.scale(tvel, T));
          force = b === 'pursue' ? seek(pred) : (dist < 320 ? flee(pred) : V.scale(agent.v, -0.5));
        } else {
          wanderAng += (ctx.random() * 2 - 1) * P.jitter * dt * 3;
          const fwd = V.len(agent.v) > 1 ? V.norm(agent.v) : V(1, 0);
          const center = V.add(agent.p, V.scale(fwd, P.wanderD));
          wanderPt = V.add(center, V.fromAngle(V.angle(fwd) + wanderAng, P.wanderR));
          force = seek(wanderPt);
        }
        desired = V.add(force, agent.v);
        // 경계 유지
        const m = 50;
        const wallF = V(
          agent.p.x < m ? P.maxSpeed : agent.p.x > W - m ? -P.maxSpeed : 0,
          agent.p.y < m ? P.maxSpeed : agent.p.y > H - m ? -P.maxSpeed : 0);
        force = V.add(force, V.scale(wallF, 2));
        // 원하는 속도와의 차이를 반응 이득(1/s)으로 가속도로 바꾼 뒤 최대 힘으로 자름
        steer = V.limit(V.scale(force, 6), P.maxForce);
        agent.v = V.limit(V.add(agent.v, V.scale(steer, dt)), P.maxSpeed);
        agent.p = V.add(agent.p, V.scale(agent.v, dt));
        agent.p.x = U.clamp(agent.p.x, 4, W - 4); agent.p.y = U.clamp(agent.p.y, 4, H - 4);

        trail.push(agent.p); if (trail.length > 240) trail.shift();
        // 정착 판정: 목표 근처에서 거의 멈출 때까지 걸린 시간
        if (P.target === 'points') {
          if (settle >= 0) {
            settle += dt;
            if (V.dist(agent.p, target) < 15 && V.len(agent.v) < 40) { calm += dt; if (calm > 0.3) { lastSettle = settle; settle = -1; } } else calm = 0;
          }
        }
        distHist.push(V.dist(agent.p, target)); if (distHist.length > 300) distHist.shift();
      },
      onAction() { init(); },
      onParam(key) { if (key === 'target' || key === 'behavior') { settle = 0; lastSettle = null; distHist = []; } },
      render() {
        const g = ctx.g, col = ctx.side === 'a' ? C.a : C.b;
        D.grid(g, ctx.width, ctx.height, 40);
        const b = P.behavior;
        // 목표
        if (b === 'arrive') D.circle(g, target.x, target.y, P.slowRadius, 'rgba(102,209,122,0.06)', 'rgba(102,209,122,0.4)', 1);
        if (b === 'flee' || b === 'evade') D.circle(g, target.x, target.y, b === 'flee' ? 300 : 320, null, 'rgba(255,83,112,0.25)', 1);
        D.circle(g, target.x, target.y, 9, C.good, '#000', 1.5);
        if (pred) { D.line(g, target.x, target.y, pred.x, pred.y, C.warn, 1); D.circle(g, pred.x, pred.y, 5, C.warn); }
        if (wanderPt) {
          const fwd = V.len(agent.v) > 1 ? V.norm(agent.v) : V(1, 0);
          const c = V.add(agent.p, V.scale(fwd, P.wanderD));
          D.line(g, agent.p.x, agent.p.y, c.x, c.y, 'rgba(255,255,255,0.2)', 1);
          D.circle(g, c.x, c.y, P.wanderR, null, 'rgba(255,255,255,0.3)', 1);
          D.circle(g, wanderPt.x, wanderPt.y, 4, C.warn);
        }
        // 궤적
        if (trail.length > 1) D.poly(g, trail, null, 'rgba(255,255,255,0.18)', 1.5, false);
        // 차량
        const ang = V.len(agent.v) > 1 ? V.angle(agent.v) : 0;
        const pts = [V(14, 0), V(-9, 7), V(-5, 0), V(-9, -7)].map((p) => V.add(agent.p, V.rotate(p, ang)));
        D.poly(g, pts, col, '#000', 1.5);
        if (P.showVec) {
          const s = 0.35;
          D.arrow(g, agent.p.x, agent.p.y, agent.p.x + desired.x * s, agent.p.y + desired.y * s, C.good, 1.5);
          D.arrow(g, agent.p.x, agent.p.y, agent.p.x + agent.v.x * s, agent.p.y + agent.v.y * s, '#fff', 2);
          D.arrow(g, agent.p.x + agent.v.x * s, agent.p.y + agent.v.y * s, agent.p.x + (agent.v.x + steer.x * 0.25) * s, agent.p.y + (agent.v.y + steer.y * 0.25) * s, C.bad, 1.5);
        }
        D.plot(g, distHist, ctx.width - 170, 10, 160, 44, { min: 0, color: col, label: GTL.L('목표까지 거리', 'Distance to target') });
        ctx.stat(GTL.L('속도', 'Speed'), V.len(agent.v).toFixed(0) + ' px/s');
        ctx.stat(GTL.L('목표까지 거리', 'Distance to target'), V.dist(agent.p, target).toFixed(0) + ' px');
        if (P.target === 'points') ctx.stat(GTL.L('정착 시간 (직전)', 'Settle time (last)'), lastSettle === null ? '-' : lastSettle > 0 ? lastSettle.toFixed(2) + ' s' : GTL.L('4초 내 미정착', 'Not settled in 4 s'));
        if (distHist.length) ctx.stat(GTL.L('평균 거리 (5초)', 'Avg distance (5 s)'), (distHist.reduce((a, c) => a + c, 0) / distHist.length).toFixed(0) + ' px');
      },
    };
  },
});
