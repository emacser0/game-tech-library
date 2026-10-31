// 대형 이동: 각자 목표로 이동 vs 슬롯 기반 대형 유지
GTL.register({
  id: 'formation-movement',
  title: '대형 이동: 각자 이동 vs 슬롯 기반 대형',
  summary: '속도가 서로 다른 분대가 장애물을 지나 목표로 가는 모습을 비교. 각자 자기 목표 지점으로 가면 빠른 유닛이 먼저 도착하고 대형이 흩어짐. 가상 기준점(앵커)이 움직이고 유닛이 앵커 주위의 슬롯을 따라가면 대형을 유지한 채 함께 도착.',
  views: { a: '각자 목표로 이동', b: '슬롯 기반 대형' },
  controls: '마우스 클릭: 목표 지점 지정 (클릭하지 않으면 좌우를 자동으로 오감)',
  info: `
    <p><b>대형 이동(formation movement)</b>: 여러 유닛이 정해진 모양을 유지하며 함께 움직이는 것. RTS의 분대 이동, 호위대, 편대 비행에 씀.</p>
    <p><b>각자 이동</b>: 목표 지점 주변에 유닛별 도착 지점만 나눠 줌. 구현은 쉬움. 하지만 이동 중에는 대형 없음.</p>
    <ul>
      <li>빠른 유닛이 먼저 도착하고 느린 유닛이 늦게 도착</li>
      <li>장애물을 만나면 유닛마다 다른 쪽으로 돌아감</li>
    </ul>
    <p><b>슬롯 기반 대형</b>: 보이지 않는 <b>앵커</b>(가상 지휘관)가 경로를 따라 움직임. 앵커의 위치와 방향으로 <b>슬롯</b>(대형 안의 자리) 위치를 계산. 유닛은 자기 슬롯을 도착(arrive) 조향으로 따라감.</p>
    <ul>
      <li>앵커 속도를 가장 느린 유닛보다 낮게 둠. 모두 따라올 수 있음.</li>
      <li>슬롯 오차가 커지면 앵커가 속도를 줄임(뒤처진 유닛 기다리기)</li>
      <li>장애물은 유닛이 각자 피하고 다시 슬롯으로 돌아옴</li>
    </ul>
    <p>단점: 좁은 길에서는 대형이 맞지 않음. 실제 게임은 좁은 곳에서 종대로 바꾸거나 대형을 잠시 풂.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="fm-c" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="8" y="18" class="t-a">${L('A: 각자 자기 목표로', 'A: each to own goal')}</text>
    <text x="235" y="38" text-anchor="middle" class="t-small t-dim">${L('각자의 목표', 'own goals')}</text>
    ${[[52, 70], [76, 150], [100, 105], [124, 190], [148, 90]].map(([y, x]) => `<line x1="${x + 6}" y1="${y}" x2="229" y2="${y}" class="d-dim" stroke-dasharray="3 3"/><circle cx="235" cy="${y}" r="5" class="d-dim"/><circle cx="${x}" cy="${y}" r="5" class="f-a"/>`).join('')}
    <text x="8" y="178" class="t-small t-dim">${L('목표 지점만 나눠 줌, 이동 중 대형 없음', 'Only goal points, no shape on the way')}</text>
    <text x="8" y="192" class="t-small t-dim">${L('빠른 유닛이 먼저 도착하고 대형이 흩어짐', 'Fast units arrive first, the shape breaks')}</text>
    <line x1="262" y1="8" x2="262" y2="194" class="d-dim"/>
    <text x="280" y="18" class="t-b">${L('B: 앵커를 따라가는 슬롯', 'B: slots that follow an anchor')}</text>
    ${[52, 76, 124, 148].map((y) => `<circle cx="400" cy="${y}" r="6" class="d-b"/>`).join('')}
    <path d="M400,93 L407,100 L400,107 L393,100 z" class="f-accent"/>
    <line x1="410" y1="100" x2="460" y2="100" class="d-accent" marker-end="url(#fm-c)"/>
    <text x="466" y="104" class="t-small">${L('앵커 방향', 'heading')}</text>
    <text x="388" y="104" text-anchor="end" class="t-small">${L('앵커', 'anchor')}</text>
    <text x="412" y="56" class="t-small t-dim">${L('슬롯', 'slot')}</text>
    <circle cx="398" cy="53" r="4" class="f-b"/><circle cx="403" cy="77" r="4" class="f-b"/><circle cx="399" cy="123" r="4" class="f-b"/>
    <line x1="370" y1="150" x2="394" y2="148" class="d-bad"/>
    <circle cx="366" cy="150" r="4" class="f-b"/>
    <text x="358" y="154" text-anchor="end" class="t-small t-dim">${L('슬롯 오차', 'slot error')}</text>
    <text x="280" y="178" class="t-small t-dim">${L('슬롯 = 앵커 + 오프셋을 앵커 방향으로 회전', 'slot = anchor + offset rotated by heading')}</text>
    <text x="280" y="192" class="t-small t-dim">${L('앵커 속력: 가장 느린 유닛의 85%, 오차가 크면 감속', 'anchor: 85% of slowest, slows if error grows')}</text>
  </svg>`,
  look: [
    'A는 출발하자마자 빠른 유닛이 앞서 나가 횡대가 비스듬히 무너짐. "대열 길이"와 "대형 오차"가 B보다 몇 배 큼.',
    '도착할 때 A는 유닛이 하나씩 들어옴("도착 시간 차" 수 초). B는 거의 동시에 도착.',
    'B는 가장 느린 유닛에 맞춰 움직여 "이동 시간"이 A보다 김. 대형 유지의 대가임.',
    'B의 "뒤처진 유닛 기다리기"를 끄면 장애물을 돈 유닛이 늦게 합류. "대형 오차"와 "도착 시간 차"가 늘어남.',
    '"속도 차이"를 0으로 하면 A의 도착 시간 차가 절반쯤으로 줄어듦. 남은 차이는 장애물을 돌아가는 경로 차이 때문임.',
  ],
  refs: [
    { type: 'article', title: 'Coordinated Unit Movement', year: 1999, note: 'Dave Pottinger, Game Developer Magazine 1999년 1월호. Age of Empires 계열의 대형 이동.' },
    { type: 'book', title: 'Artificial Intelligence for Games (3rd ed.)', year: 2019, note: 'Ian Millington. 3.7절 대형 이동(Formation Motion): 슬롯, 앵커, 2단계 대형.' },
    { type: 'paper', title: 'Steering Behaviors For Autonomous Characters', url: 'https://www.red3d.com/cwr/steer/gdc99/', year: 1999, note: 'Craig Reynolds, GDC 1999. Arrive, 장애물 회피, 리더 따라가기.' },
  ],
  params: [
    { key: 'mode', label: '이동 방식', type: 'select', group: '대형', options: [
      { value: 'individual', label: '각자 목표로 이동' },
      { value: 'slot', label: '슬롯 기반 대형 (앵커)' },
    ], a: 'individual', b: 'slot' },
    { key: 'shape', label: '대형 모양', type: 'select', options: [
      { value: 'wedge', label: '쐐기' }, { value: 'line', label: '횡대' }, { value: 'column', label: '종대' }, { value: 'box', label: '사각' },
    ], default: 'line' },
    { key: 'wait', label: '뒤처진 유닛 기다리기', type: 'bool', default: true, when: (p) => p.mode === 'slot' },
    { key: 'count', label: '유닛 수', type: 'int', min: 3, max: 16, default: 7, shared: true, reset: true, group: '장면' },
    { key: 'speedVar', label: '속도 차이', type: 'range', min: 0, max: 1, step: 0.05, default: 0.7, shared: true, reset: true, help: '0이면 모든 유닛 속도가 같음' },
    { key: 'simSpeed', label: '시뮬레이션 배속', type: 'range', min: 0.5, max: 4, step: 0.5, default: 1.5, shared: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Formation Movement: Individual Moves vs Slot Formation',
    summary: 'Compares a squad with different unit speeds moving past obstacles to a goal. If each unit goes to its own goal point, fast units arrive first and the formation breaks up. If a virtual reference point (anchor) moves and units follow slots around it, the squad keeps its formation and arrives together.',
    views: { a: 'Each to own goal', b: 'Slot formation' },
    controls: 'Mouse click: set the goal point (without clicks, the squad moves left and right on its own)',
    info: `
    <p><b>Formation movement</b>: several units move together while keeping a set shape. It is used for squad moves in RTS games, escorts and flight formations.</p>
    <p><b>Individual moves</b>: give each unit only its own arrival point around the goal. This is easy to build. But there is no formation while moving.</p>
    <ul>
      <li>Fast units arrive first, and slow units arrive late.</li>
      <li>At an obstacle, each unit goes around a different side.</li>
    </ul>
    <p><b>Slot formation</b>: an invisible <b>anchor</b> (a virtual leader) follows the path. The anchor's position and heading give the position of each <b>slot</b> (a place in the formation). Each unit follows its slot with arrive steering.</p>
    <ul>
      <li>The anchor moves slower than the slowest unit, so everyone can keep up.</li>
      <li>When the slot error grows, the anchor slows down (waits for units that fall behind).</li>
      <li>Each unit avoids obstacles on its own and then returns to its slot.</li>
    </ul>
    <p>Downside: the formation does not fit in narrow paths. Real games switch to a column or break the formation for a while in tight spots.</p>`,
    look: [
      'In A, fast units pull ahead right after the start, and the line tilts and breaks. "Column length" and "Formation error" are several times larger than in B.',
      'On arrival, A\'s units come in one by one ("Arrival time spread" of several seconds). B\'s units arrive almost together.',
      'B moves at the pace of the slowest unit, so its "Travel time" is longer than A\'s. That is the cost of keeping formation.',
      'Turn off "Wait for units behind" in B. Units that go around obstacles rejoin late. "Formation error" and "Arrival time spread" grow.',
      'Set "Speed spread" to 0. A\'s arrival time spread drops by about half. The rest comes from different paths around obstacles.',
    ],
    refs: [
      'Dave Pottinger, Game Developer Magazine, January 1999. Formation movement in the Age of Empires series.',
      'Ian Millington. Section 3.7 Formation Motion: slots, anchors, two-level formations.',
      'Craig Reynolds, GDC 1999. Arrive, obstacle avoidance, leader following.',
    ],
    params: {
      mode: { label: 'Movement mode', group: 'Formation', options: { individual: 'Each to own goal', slot: 'Slot formation (anchor)' } },
      shape: { label: 'Formation shape', options: { wedge: 'Wedge', line: 'Line', column: 'Column', box: 'Box' } },
      wait: 'Wait for units behind',
      count: { label: 'Unit count', group: 'Scene' },
      speedVar: { label: 'Speed spread', help: 'At 0, all units have the same speed' },
      simSpeed: 'Simulation speed',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, V = U.v2, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 800, WH = 480, UR = 8;
    const obstacles = [{ p: V(400, 200), r: 48 }, { p: V(330, 340), r: 30 }, { p: V(480, 330), r: 34 }];
    const GOALS = [V(670, 240), V(130, 240)];
    let units, anchor, goal, goalI, moveT, arrived, errSum, errN, spread, lastSpread, lastMoveT, waitT, maxSpreadMove, history;

    function offsets(shape, n) {
      const o = [];
      for (let i = 0; i < n; i++) {
        if (shape === 'wedge') { const row = Math.ceil(i / 2), side = i === 0 ? 0 : (i % 2 ? -1 : 1); o.push(V(-row * 30, side * row * 26)); }
        else if (shape === 'line') o.push(V(0, (i - (n - 1) / 2) * 30));
        else if (shape === 'column') o.push(V(-i * 28, 0));
        else { const cols = Math.ceil(Math.sqrt(n)), r = Math.floor(i / cols), c = i % cols; o.push(V(-r * 30, (c - (cols - 1) / 2) * 30)); }
      }
      const m = o.reduce((a, p) => V.add(a, p), V(0, 0));
      return o.map((p) => V.sub(p, V.scale(m, 1 / n)));
    }
    const centroid = () => V.scale(units.reduce((a, u) => V.add(a, u.p), V(0, 0)), 1 / units.length);

    function setGoal(p) {
      goal = p; moveT = 0; arrived = false; errSum = 0; errN = 0; maxSpreadMove = 0;
      const c = centroid();
      const h = V.angle(V.sub(goal, c));
      const off = offsets(P.shape, units.length);
      // 슬롯 배정: 새 방향의 슬롯과 가장 가까운 유닛끼리 짝지음 (탐욕 매칭). 방향을 뒤집어도 유닛이 서로 엇갈리지 않음
      const free = new Set(off.map((_, i) => i)), left = new Set(units);
      while (left.size) {
        let bu = null, bs = -1, bd = Infinity;
        for (const u of left) for (const k of free) { const d = V.distSq(u.p, V.add(c, V.rotate(off[k], h))); if (d < bd) { bd = d; bu = u; bs = k; } }
        bu.slot = bs; left.delete(bu); free.delete(bs);
      }
      units.forEach((u) => { u.target = V.add(goal, V.rotate(off[u.slot], h)); u.arriveT = -1; });
      anchor.p = c; anchor.goalHeading = h; anchor.h = h;
    }
    function init() {
      const rng = U.rng(ctx.seed * 23 + 1);
      units = [];
      for (let i = 0; i < P.count; i++) {
        units.push({ p: V(130 + rng.range(-40, 40), 240 + rng.range(-60, 60)), v: V(0, 0), max: 80 * (1 + P.speedVar * rng.range(-0.5, 0.5)), target: null, arriveT: -1 });
      }
      anchor = { p: centroid(), h: 0, goalHeading: 0 };
      goalI = 0; lastSpread = null; lastMoveT = null; waitT = 0; history = [];
      setGoal(GOALS[0]);
    }
    init();

    function avoid(p, extra) {
      let f = V(0, 0);
      for (const o of obstacles) {
        const d = V.sub(p, o.p), l = V.len(d), rr = o.r + extra;
        if (l < rr && l > 1e-6) f = V.add(f, V.scale(d, ((rr - l) / extra) / l));
      }
      return f;
    }
    function steerUnit(u, target, dt) {
      const to = V.sub(target, u.p), d = V.len(to);
      const speed = Math.min(u.max, u.max * d / 40);
      let desired = d > 1e-6 ? V.scale(to, speed / d) : V(0, 0);
      desired = V.add(desired, V.scale(avoid(u.p, 30), u.max * 1.5));
      for (const o of units) {
        if (o === u) continue;
        const dd = V.sub(u.p, o.p), l = V.len(dd);
        if (l < UR * 2.6 && l > 1e-6) desired = V.add(desired, V.scale(dd, (UR * 2.6 - l) / l * 6));
      }
      desired = V.limit(desired, u.max);
      const acc = V.limit(V.sub(desired, u.v), 400 * dt);
      u.v = V.add(u.v, acc);
      u.p = V.add(u.p, V.scale(u.v, dt));
      // 장애물 안으로 들어가지 않게
      for (const o of obstacles) {
        const dd = V.sub(u.p, o.p), l = V.len(dd);
        if (l < o.r + UR && l > 1e-6) u.p = V.add(o.p, V.scale(dd, (o.r + UR) / l));
      }
    }

    function heading() { return P.mode === 'slot' ? anchor.h : anchor.goalHeading; }
    function formationError() {
      const c = centroid(), off = offsets(P.shape, units.length), h = heading();
      let e = 0, sp = 0;
      // sp: 이동 방향으로 잰 대열 길이 (맨 앞 유닛 ~ 맨 뒤 유닛)
      const f = V.fromAngle(h); let lo = Infinity, hi = -Infinity;
      units.forEach((u) => { e += V.dist(u.p, V.add(c, V.rotate(off[u.slot], h))); const q = V.dot(u.p, f); lo = Math.min(lo, q); hi = Math.max(hi, q); });
      sp = hi - lo;
      return { e: e / units.length, sp };
    }

    function step(dt) {
      if (arrived) {
        waitT -= dt;
        if (waitT <= 0) { goalI = (goalI + 1) % 2; setGoal(GOALS[goalI]); }
      }
      moveT += dt;
      const off = offsets(P.shape, units.length);
      if (P.mode === 'slot') {
        // 앵커 이동: 가장 느린 유닛의 85% 속도, 슬롯 오차가 크면 감속
        const minMax = Math.min(...units.map((u) => u.max));
        let slotErr = 0;
        units.forEach((u) => { slotErr += V.dist(u.p, V.add(anchor.p, V.rotate(off[u.slot], anchor.h))); });
        slotErr /= units.length;
        const slow = P.wait ? U.clamp(1 - (slotErr - 12) / 40, 0.15, 1) : 1;
        const to = V.sub(goal, anchor.p), d = V.len(to);
        if (d > 2) {
          let dir = V.scale(to, 1 / d);
          dir = V.norm(V.add(dir, V.scale(avoid(anchor.p, 70), 1.2)));
          const sp = Math.min(minMax * 0.85 * slow, d * 1.5);
          anchor.p = V.add(anchor.p, V.scale(dir, sp * dt));
          anchor.h = U.lerpAngle(anchor.h, Math.atan2(to.y, to.x), 1 - Math.exp(-2.5 * dt));
        }
        units.forEach((u) => { u.target = V.add(anchor.p, V.rotate(off[u.slot], anchor.h)); });
      }
      for (const u of units) steerUnit(u, u.target, dt);
      const fe = formationError();
      if (!arrived) { errSum += fe.e * dt; errN += dt; maxSpreadMove += fe.sp * dt; }
      // 도착 판정
      const anchorDone = P.mode !== 'slot' || V.dist(anchor.p, goal) < 4;
      for (const u of units) if (u.arriveT < 0 && anchorDone && V.dist(u.p, u.target) < 12) u.arriveT = moveT;
      if (!arrived && units.every((u) => u.arriveT >= 0)) {
        arrived = true; waitT = 1.5;
        const ts = units.map((u) => u.arriveT);
        lastSpread = Math.max(...ts) - Math.min(...ts); lastMoveT = Math.max(...ts);
        history.push({ spread: lastSpread, err: errSum / Math.max(1e-6, errN), sp: maxSpreadMove / Math.max(1e-6, errN), moveT: lastMoveT });
        if (history.length > 20) history.shift();
      }
      if (moveT > 40 && !arrived) { arrived = true; waitT = 0.5; }
    }

    const view = () => { const s = Math.min(ctx.width / WW, ctx.height / WH); return { s, ox: (ctx.width - WW * s) / 2, oy: (ctx.height - WH * s) / 2 }; };
    return {
      update(dt) {
        let t = dt * P.simSpeed;
        while (t > 1e-6) { const h = Math.min(t, 1 / 60); step(h); t -= h; }
      },
      onAction() { init(); },
      onParam(key) { if (key === 'shape' || key === 'mode') setGoal(goal); },
      onPointer(type, m) {
        if (type !== 'down') return;
        const vw = view(), p = V((m.x - vw.ox) / vw.s, (m.y - vw.oy) / vw.s);
        if (p.x < 20 || p.y < 20 || p.x > WW - 20 || p.y > WH - 20) return;
        setGoal(p);
      },
      render() {
        const g = ctx.g, vw = view(), s = vw.s;
        const X = (p) => ({ x: vw.ox + p.x * s, y: vw.oy + p.y * s });
        D.rect(g, vw.ox, vw.oy, WW * s, WH * s, '#181b21', 'rgba(255,255,255,0.1)');
        for (const o of obstacles) { const p = X(o.p); D.circle(g, p.x, p.y, o.r * s, '#3a404c', '#59606e', 1); }
        const gp = X(goal);
        D.line(g, gp.x - 8, gp.y - 8, gp.x + 8, gp.y + 8, C.warn, 2); D.line(g, gp.x - 8, gp.y + 8, gp.x + 8, gp.y - 8, C.warn, 2);
        // 이상적인 대형 (현재 무게중심 기준)
        const c = centroid(), off = offsets(P.shape, units.length), h = heading();
        const ideal = units.map((u) => X(V.add(c, V.rotate(off[u.slot], h))));
        units.forEach((u, i) => {
          const up = X(u.p);
          D.line(g, up.x, up.y, ideal[i].x, ideal[i].y, 'rgba(255,83,112,0.45)', 1);
          D.circle(g, ideal[i].x, ideal[i].y, UR * s, null, 'rgba(255,255,255,0.18)', 1);
        });
        if (P.mode === 'slot') {
          const ap = X(anchor.p);
          units.forEach((u) => { const t = X(u.target); D.circle(g, t.x, t.y, 3, null, C.b, 1); });
          D.poly(g, [V(ap.x, ap.y - 8), V(ap.x + 8, ap.y), V(ap.x, ap.y + 8), V(ap.x - 8, ap.y)], null, C.warn, 1.5);
          const f = V.fromAngle(anchor.h);
          D.arrow(g, ap.x, ap.y, ap.x + f.x * 26, ap.y + f.y * 26, C.warn, 1.5, 6);
        } else units.forEach((u) => { const t = X(u.target); D.circle(g, t.x, t.y, 3, null, C.a, 1); });
        const col = ctx.side === 'a' ? C.a : C.b;
        const maxS = Math.max(...units.map((u) => u.max)), minS = Math.min(...units.map((u) => u.max));
        units.forEach((u) => {
          const up = X(u.p), k = maxS > minS ? (u.max - minS) / (maxS - minS) : 0.5;
          D.circle(g, up.x, up.y, UR * s, col, '#000', 1.5);
          D.rect(g, up.x - 6, up.y + UR * s + 3, 12, 2, 'rgba(0,0,0,0.6)'); D.rect(g, up.x - 6, up.y + UR * s + 3, 12 * (0.2 + 0.8 * k), 2, '#fff');
        });
        D.text(g, GTL.L('빨간 선: 이상적인 대형 자리와의 차이, 흰 막대: 유닛 속도', 'Red lines: gap from the ideal formation spot, white bars: unit speed'), vw.ox + 6, vw.oy + WH * s - 16, { size: 10, color: C.dim });
        const fe = formationError();
        const avg = (k, d) => (history.length ? (history.reduce((a, x) => a + x[k], 0) / history.length).toFixed(d) : '-');
        ctx.stat(GTL.L('대형 오차 (현재)', 'Formation error (now)'), fe.e.toFixed(1) + ' px');
        ctx.stat(GTL.L('대형 오차 (이동 중 평균)', 'Formation error (avg while moving)'), avg('err', 1) + ' px');
        ctx.stat(GTL.L('대열 길이 (이동 중 평균)', 'Column length (avg while moving)'), avg('sp', 0) + ' px');
        ctx.stat(GTL.L('도착 시간 차 (평균)', 'Arrival time spread (avg)'), avg('spread', 2) + ' s');
        ctx.stat(GTL.L('이동 시간 (평균)', 'Travel time (avg)'), avg('moveT', 1) + ' s');
        ctx.stat(GTL.L('완료한 이동', 'Moves completed'), history.length);
      },
    };
  },
});
