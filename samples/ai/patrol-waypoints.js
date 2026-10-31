// 순찰: 무작위 이동 vs 웨이포인트 순찰 + 대기
GTL.register({
  id: 'patrol-waypoints',
  title: '순찰: 무작위 이동 vs 웨이포인트 순찰',
  summary: '경비병이 같은 마당을 지키는 두 가지 방식을 비교. 무작위 이동은 한쪽 구석을 오래 비워 둠. 웨이포인트를 차례로 돌고 멈춰서 둘러보면 모든 구역을 고르게 살핌.',
  views: { a: '무작위 이동', b: '웨이포인트 순찰 + 대기' },
  controls: '마우스 클릭: 클릭한 곳에 웨이포인트 추가 (웨이포인트 방식), 지우기 버튼으로 초기화',
  info: `
    <p><b>순찰</b>: 적이 없을 때 경비병이 하는 기본 행동. 플레이어가 경비병을 처음 만나는 상태라서 게임의 인상을 크게 좌우.</p>
    <ul>
      <li><b>무작위 방향</b>: 몇 초마다 방향을 새로 고름. 구현은 가장 쉬움. 같은 곳을 맴돌거나 구석을 오래 비워 둠.</li>
      <li><b>무작위 지점</b>: 마당 안의 아무 지점을 골라 걸어감. 가운데를 자주 지나고 가장자리는 덜 감.</li>
      <li><b>웨이포인트 순찰</b>: 레벨 디자이너가 찍은 지점을 차례로 돎. 지점마다 잠깐 멈춰 좌우를 둘러봄.</li>
    </ul>
    <p>바닥 칸의 색은 경비병이 그 칸을 마지막으로 본 뒤 지난 시간(방치 시간). 붉을수록 오래 비어 있음.</p>
    <p>웨이포인트의 단점: 경로가 뻔해서 플레이어가 외울 수 있음. 실제 게임은 대기 시간이나 순서에 작은 무작위성을 섞음.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 190" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="pw-b" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="18" class="t-a">${L('A: 무작위 방향', 'A: random direction')}</text>
    <rect x="10" y="26" width="245" height="124" class="f-dim"/>
    <rect x="14" y="104" width="86" height="42" class="f-bad" fill-opacity="0.25"/>
    <text x="20" y="130" class="t-small">${L('오래 빈 구석', 'empty for long')}</text>
    <polyline points="130,88 205,40 245,75 170,120 232,145 248,120 150,60 100,32 60,62 120,100 200,96" class="d-a"/>
    <text x="10" y="168" class="t-small t-dim">${L('몇 초마다 새 방향, 벽에서 반사', 'new heading every few s, bounce at walls')}</text>
    <text x="10" y="182" class="t-small t-dim">${L('구역마다 방치 시간이 크게 다름', 'neglect time varies a lot by area')}</text>
    <text x="285" y="18" class="t-b">${L('B: 웨이포인트 순찰 + 대기', 'B: waypoint patrol + wait')}</text>
    <rect x="285" y="26" width="245" height="124" class="f-dim"/>
    <path d="M407,88 L411.2,111.6 A24,24 0 1 1 411.2,64.4 Z" class="f-b" fill-opacity="0.2"/>
    ${[[320, 46, 400, 46], [412, 46, 493, 46], [500, 51, 500, 81], [495, 88, 414, 88], [402, 88, 322, 88], [315, 93, 315, 123], [320, 130, 400, 130], [412, 130, 493, 130]].map(([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="d-b" marker-end="url(#pw-b)"/>`).join('')}
    <line x1="495" y1="127" x2="320" y2="49" class="d-dim" stroke-dasharray="4 3"/>
    ${[315, 407, 500].map((x) => [46, 88, 130].map((y) => `<circle cx="${x}" cy="${y}" r="4" class="f-b"/>`).join('')).join('')}
    <text x="307" y="43" text-anchor="end" class="t-small">1</text>
    <text x="285" y="168" class="t-small t-dim">${L('디자이너가 찍은 지점을 순서대로 돎', 'visits designer-placed points in order')}</text>
    <text x="285" y="182" class="t-small t-dim">${L('지점마다 멈춰 좌우를 둘러봄', 'stops at each point and looks around')}</text>
  </svg>`,
  look: [
    '1분 정도 두면 A의 바닥 일부가 짙은 빨강으로 남음. B는 모든 칸이 일정 시간 안에 다시 밝아짐. "최대 방치 시간" 숫자가 크게 다름.',
    'B의 "둘러보기"를 끄면 대기 중 시야가 한 방향에 고정됨. 웨이포인트 사이 측면이 덜 보여 "평균 방치 시간"이 늘어남.',
    'A를 "무작위 지점"으로 바꾸면 가운데는 자주 보지만 네 구석이 계속 붉게 남음',
    'B 뷰를 클릭해 웨이포인트를 한쪽에만 몰아 찍으면 반대쪽이 방치됨. 웨이포인트 배치가 순찰 품질을 정함.',
  ],
  refs: [
    { type: 'engine', title: 'Unity Manual - Making an Agent Patrol Between a Set of Points', url: 'https://docs.unity3d.com/Manual/nav-AgentPatrol.html', note: 'NavMeshAgent로 웨이포인트를 차례로 도는 예제' },
    { type: 'paper', title: 'Steering Behaviors For Autonomous Characters', url: 'https://www.red3d.com/cwr/steer/gdc99/', year: 1999, note: 'Craig Reynolds, GDC 1999. Wander 행동.' },
    { type: 'book', title: 'Artificial Intelligence for Games (3rd ed.)', year: 2019, note: 'Ian Millington. 이동과 의사결정 기초.' },
  ],
  params: [
    { key: 'mode', label: '순찰 방식', type: 'select', group: '순찰', options: [
      { value: 'wander', label: '무작위 방향' },
      { value: 'randpoint', label: '무작위 지점' },
      { value: 'waypoint', label: '웨이포인트 순찰' },
    ], a: 'wander', b: 'waypoint' },
    { key: 'wait', label: '웨이포인트 대기 (s)', type: 'range', min: 0, max: 4, step: 0.1, default: 1.5, when: (p) => p.mode !== 'wander' },
    { key: 'look', label: '대기 중 둘러보기', type: 'bool', default: true, when: (p) => p.mode !== 'wander' },
    { key: 'speed', label: '이동 속도', type: 'range', min: 30, max: 200, step: 5, default: 90, shared: true, group: '경비병' },
    { key: 'fov', label: '시야각 (°)', type: 'range', min: 30, max: 180, step: 5, default: 90, shared: true },
    { key: 'range', label: '시야 거리', type: 'range', min: 40, max: 200, step: 5, default: 120, shared: true },
    { key: 'simSpeed', label: '시뮬레이션 배속', type: 'range', min: 0.5, max: 8, step: 0.5, default: 3, shared: true, group: '장면' },
    { key: 'clearWp', label: '웨이포인트 지우기', type: 'button' },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Patrol: Random Wander vs Waypoint Patrol',
    summary: 'Compares two ways a guard can watch the same yard. Random movement leaves one corner empty for a long time. Visiting waypoints in order and stopping to look around covers every area evenly.',
    views: { a: 'Random movement', b: 'Waypoint patrol + wait' },
    controls: 'Mouse click: add a waypoint where you click (waypoint mode). Use the clear button to reset.',
    info: `
    <p><b>Patrol</b>: the default behavior of a guard when no enemy is around. It is the first state the player sees a guard in, so it shapes the feel of the game.</p>
    <ul>
      <li><b>Random direction</b>: picks a new direction every few seconds. It is the easiest to build. The guard circles the same spot or leaves corners empty for a long time.</li>
      <li><b>Random point</b>: picks any point in the yard and walks there. It often crosses the middle and visits the edges less.</li>
      <li><b>Waypoint patrol</b>: visits points placed by a level designer, in order. It stops briefly at each point and looks left and right.</li>
    </ul>
    <p>The color of each floor cell shows the time since the guard last saw it (neglect time). Redder means empty for longer.</p>
    <p>Downside of waypoints: the route is predictable, so the player can memorize it. Real games mix a little randomness into wait times or order.</p>`,
    look: [
      'Wait about a minute. Parts of A\'s floor stay dark red. In B, every cell turns bright again within a set time. The "Max neglect time" numbers differ a lot.',
      'Turn off "Look around while waiting" in B. The view stays fixed in one direction while waiting. The sides between waypoints get seen less, so "Avg neglect time" goes up.',
      'Switch A to "Random point". It sees the middle often, but the four corners stay red.',
      'Click the B view to place waypoints on one side only. The other side gets neglected. Waypoint placement decides patrol quality.',
    ],
    refs: ['Example of a NavMeshAgent visiting waypoints in order.', 'Craig Reynolds, GDC 1999. The Wander behavior.', 'Ian Millington. Basics of movement and decision making.'],
    params: {
      mode: { label: 'Patrol mode', group: 'Patrol', options: { wander: 'Random direction', randpoint: 'Random point', waypoint: 'Waypoint patrol' } },
      wait: 'Waypoint wait (s)',
      look: 'Look around while waiting',
      speed: { label: 'Move speed', group: 'Guard' },
      fov: 'Field of view (°)',
      range: 'View distance',
      simSpeed: { label: 'Simulation speed', group: 'Scene' },
      clearWp: 'Clear waypoints',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, V = U.v2, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 760, WH = 460, CS = 20, GX = WW / CS, GY = WH / CS;
    const DEFAULT_WP = [V(75, 75), V(380, 75), V(685, 75), V(685, 230), V(380, 230), V(75, 230), V(75, 385), V(380, 385), V(685, 385)];
    let wps = DEFAULT_WP.map((p) => V(p.x, p.y));
    let guard, seen, simT, dist, rng, trail;

    function init() {
      rng = U.rng(ctx.seed * 7 + 3);
      guard = { p: V(380, 230), dir: 0, wp: 0, waitT: 0, baseDir: 0, turnT: 0, target: null };
      seen = new Float32Array(GX * GY); // 마지막으로 본 시각
      simT = 0; dist = 0; trail = [];
    }
    init();

    function moveTo(target, dt) {
      const d = V.sub(target, guard.p), l = V.len(d);
      if (l < 3) return true;
      const st = Math.min(l, P.speed * dt);
      guard.p = V.add(guard.p, V.scale(d, st / l));
      guard.dir = U.lerpAngle(guard.dir, Math.atan2(d.y, d.x), 1 - Math.exp(-10 * dt));
      dist += st;
      return false;
    }

    function step(dt) {
      simT += dt;
      if (P.mode === 'wander') {
        guard.turnT -= dt;
        if (guard.turnT <= 0) { guard.baseDir = rng.range(-Math.PI, Math.PI); guard.turnT = rng.range(1, 3); }
        let v = V.fromAngle(guard.baseDir);
        const np = V.add(guard.p, V.scale(v, P.speed * dt));
        // 벽에 닿으면 반사
        if (np.x < 15 || np.x > WW - 15) { v = V(-v.x, v.y); guard.baseDir = V.angle(v); }
        if (np.y < 15 || np.y > WH - 15) { v = V(v.x, -v.y); guard.baseDir = V.angle(v); }
        guard.p = V.add(guard.p, V.scale(v, P.speed * dt));
        guard.p.x = U.clamp(guard.p.x, 15, WW - 15); guard.p.y = U.clamp(guard.p.y, 15, WH - 15);
        guard.dir = U.lerpAngle(guard.dir, guard.baseDir, 1 - Math.exp(-10 * dt));
        dist += P.speed * dt;
      } else {
        if (guard.waitT > 0) {
          guard.waitT -= dt;
          if (P.look) guard.dir = guard.baseDir + Math.sin((P.wait - guard.waitT) / Math.max(0.3, P.wait) * U.TAU) * U.rad(100);
          if (guard.waitT <= 0) guard.target = null;
        } else {
          if (!guard.target) {
            if (P.mode === 'randpoint') guard.target = V(rng.range(20, WW - 20), rng.range(20, WH - 20));
            else { guard.wp = guard.wp % Math.max(1, wps.length); guard.target = wps.length ? wps[guard.wp] : V(WW / 2, WH / 2); }
          }
          if (moveTo(guard.target, dt)) {
            guard.waitT = P.wait; guard.baseDir = guard.dir;
            if (P.mode === 'waypoint') guard.wp = (guard.wp + 1) % Math.max(1, wps.length);
            if (P.wait <= 0) guard.target = null;
          }
        }
      }
      // 시야 안의 칸 갱신
      const cosH = Math.cos(U.rad(P.fov) / 2), f = V.fromAngle(guard.dir), r2 = P.range * P.range;
      const x0 = Math.max(0, Math.floor((guard.p.x - P.range) / CS)), x1 = Math.min(GX - 1, Math.floor((guard.p.x + P.range) / CS));
      const y0 = Math.max(0, Math.floor((guard.p.y - P.range) / CS)), y1 = Math.min(GY - 1, Math.floor((guard.p.y + P.range) / CS));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const dx = (x + 0.5) * CS - guard.p.x, dy = (y + 0.5) * CS - guard.p.y, dd = dx * dx + dy * dy;
        if (dd > r2) continue;
        const l = Math.sqrt(dd);
        if (l < CS * 0.75 || (dx * f.x + dy * f.y) / l >= cosH) seen[y * GX + x] = simT;
      }
    }

    const view = () => { const s = Math.min(ctx.width / WW, ctx.height / WH); return { s, ox: (ctx.width - WW * s) / 2, oy: (ctx.height - WH * s) / 2 }; };
    let trailT = 0;
    return {
      update(dt) {
        let t = dt * P.simSpeed;
        while (t > 0) { const h = Math.min(t, 1 / 60); step(h); t -= h; }
        trailT += dt * P.simSpeed;
        if (trailT > 0.2) { trailT = 0; trail.push(V(guard.p.x, guard.p.y)); if (trail.length > 150) trail.shift(); }
      },
      onAction(key) {
        if (key === 'clearWp') { wps = []; guard.target = null; guard.wp = 0; }
        else { wps = DEFAULT_WP.map((p) => V(p.x, p.y)); init(); }
      },
      onPointer(type, m) {
        if (type !== 'down' || P.mode !== 'waypoint') return;
        const vw = view(), p = V((m.x - vw.ox) / vw.s, (m.y - vw.oy) / vw.s);
        if (p.x < 0 || p.y < 0 || p.x > WW || p.y > WH) return;
        if (wps.length >= 16) wps.shift();
        wps.push(p);
      },
      render() {
        const g = ctx.g, vw = view(), s = vw.s;
        const X = (p) => ({ x: vw.ox + p.x * s, y: vw.oy + p.y * s });
        // 방치 시간 지도
        let sum = 0, mx = 0, stale = 0, never = 0;
        for (let y = 0; y < GY; y++) for (let x = 0; x < GX; x++) {
          const age = simT - seen[y * GX + x];
          sum += age; if (age > mx) mx = age; if (age > 60) stale++; if (seen[y * GX + x] === 0) { never++; }
          const k = U.clamp(age / 40, 0, 1);
          g.fillStyle = `rgba(${Math.round(40 + 200 * k)},${Math.round(70 - 30 * k)},${Math.round(60 - 20 * k)},${0.25 + 0.6 * k})`;
          g.fillRect(vw.ox + x * CS * s, vw.oy + y * CS * s, CS * s - 1, CS * s - 1);
        }
        D.rect(g, vw.ox, vw.oy, WW * s, WH * s, null, 'rgba(255,255,255,0.2)');
        // 웨이포인트
        if (P.mode === 'waypoint' && wps.length) {
          const pts = wps.map(X);
          D.poly(g, pts, null, 'rgba(255,255,255,0.35)', 1, true);
          pts.forEach((p, i) => {
            D.circle(g, p.x, p.y, 7, i === guard.wp ? C.warn : 'rgba(255,255,255,0.25)', '#fff', 1);
            D.text(g, String(i + 1), p.x, p.y - 18, { align: 'center', size: 10, color: C.dim });
          });
        }
        if (P.mode === 'randpoint' && guard.target) { const t = X(guard.target); D.circle(g, t.x, t.y, 6, null, C.warn, 1.5); }
        // 궤적
        if (trail.length > 1) D.poly(g, trail.map(X), null, 'rgba(255,255,255,0.25)', 1, false);
        // 시야
        const gp = X(guard.p), half = U.rad(P.fov) / 2;
        g.beginPath(); g.moveTo(gp.x, gp.y); g.arc(gp.x, gp.y, P.range * s, guard.dir - half, guard.dir + half); g.closePath();
        g.fillStyle = 'rgba(255,220,120,0.15)'; g.fill(); g.strokeStyle = 'rgba(255,220,120,0.5)'; g.lineWidth = 1; g.stroke();
        D.circle(g, gp.x, gp.y, 9, ctx.side === 'a' ? C.a : C.b, '#000', 1.5);
        const f = V.fromAngle(guard.dir);
        D.line(g, gp.x, gp.y, gp.x + f.x * 14, gp.y + f.y * 14, '#000', 2);
        if (guard.waitT > 0) D.text(g, GTL.L('대기', 'Wait'), gp.x, gp.y - 22, { align: 'center', size: 10, color: C.warn });
        const n = GX * GY;
        ctx.stat(GTL.L('평균 방치 시간', 'Avg neglect time'), (sum / n).toFixed(1) + ' s');
        ctx.stat(GTL.L('최대 방치 시간', 'Max neglect time'), mx.toFixed(1) + ' s');
        ctx.stat(GTL.L('60초 넘게 방치된 칸', 'Cells neglected over 60 s'), (stale / n * 100).toFixed(0) + ' %');
        ctx.stat(GTL.L('한 번도 못 본 칸', 'Cells never seen'), (never / n * 100).toFixed(0) + ' %');
        ctx.stat(GTL.L('이동 거리', 'Distance moved'), dist.toFixed(0) + ' px');
        ctx.stat(GTL.L('경과 시간', 'Elapsed time'), simT.toFixed(0) + ' s');
      },
    };
  },
});
