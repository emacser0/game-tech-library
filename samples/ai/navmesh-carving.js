// 움직이는 장애물: 로컬 회피만 vs 내비메시 카빙 (Unity NavMeshObstacle, Unreal 동적 내비메시)
GTL.register({
  id: 'navmesh-carving',
  title: '움직이는 장애물: 회피 vs 내비메시 카빙 (NavMeshObstacle)',
  summary: '상자가 짧은 통로를 막았다 비켰다 함. 회피만 쓰면 경로가 그대로라 에이전트가 상자 앞에서 멈춤. 카빙을 쓰면 멈춘 상자 자리를 내비메시에서 잘라 내고, 에이전트가 경로를 다시 계산해 우회.',
  views: { a: '회피만 (카빙 없음)', b: '정지 시 카빙' },
  controls: '조작 없음. 에이전트가 왼쪽 방에서 오른쪽 목표(초록)로 계속 이동.',
  info: `
    <p><b>내비메시 장애물</b>: 문, 상자처럼 움직이는 물체가 길을 막을 때 쓰는 컴포넌트. Unity의 NavMeshObstacle, Unreal의 Nav Modifier가 대표 예.</p>
    <p>처리 방식은 두 가지:</p>
    <ul>
      <li><b>회피만</b>: 내비메시는 그대로 둠. 에이전트는 로컬 회피로 장애물을 피하려 함. 경로는 여전히 막힌 통로를 지나므로, 통로가 완전히 막히면 상자를 계속 밀며 멈춤.</li>
      <li><b>카빙(Carving)</b>: 장애물 발자국(footprint)에 에이전트 반지름을 더한 영역을 내비메시에서 잘라 냄. 내비메시가 바뀌면 에이전트가 경로를 다시 계산해 돌아감.</li>
    </ul>
    <p>카빙은 내비메시 일부를 다시 만드는 작업이라 비쌈. 그래서 Unity는 <b>Carve Only Stationary</b> 옵션으로 멈춘 장애물만 카빙. 멈춘 뒤 <b>Time To Stationary</b>만큼 지나야 정지로 판정. 움직이는 동안은 구멍을 지우고 회피만 씀.</p>
    <p>Unreal은 Runtime Generation을 Dynamic Modifiers Only로 두면 Nav Modifier가 걸친 타일만 다시 만듦. 영역 클래스를 NavArea_Null로 두면 그 영역을 지나갈 수 없음.</p>
    <p>단점: 정지 판정 시간 동안은 에이전트가 막힌 쪽으로 계속 감. 카빙이 자주 바뀌면 내비메시 갱신과 경로 재계산이 몰려 비용이 튐.</p>`,
  // 도식: 장애물 발자국 + 에이전트 반지름만큼 셀을 잘라 내고, 경로가 우회로로 바뀜
  diagram: (L) => {
    const cell = (x0, y0, carve) => {
      let s = '';
      for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) {
        const wall = (c >= 3 && c <= 5) && r !== 1 && r !== 4;
        const cut = carve && r === 1 && c >= 3 && c <= 5;
        const cls = wall ? 'f-dim' : cut ? 'f-bad' : '';
        s += `<rect x="${x0 + c * 22}" y="${y0 + r * 22}" width="22" height="22" class="${cls || 'd-dim'}" ${cut ? 'fill-opacity="0.45"' : ''} ${cls ? '' : 'fill="none"'}/>`;
      }
      return s;
    };
    return `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="arrA" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    </defs>
    <text x="20" y="16" class="t-a">${L('회피만: 내비메시 그대로', 'Avoidance only: mesh unchanged')}</text>
    ${cell(20, 26, false)}
    <rect x="110" y="50" width="18" height="18" class="f-accent" fill-opacity="0.8"/>
    <path d="M31,59 L105,59" class="d-a" marker-end="url(#arrA)"/>
    <path d="M130,59 L207,59" class="d-a" stroke-dasharray="4 3"/>
    <text x="104" y="150" text-anchor="middle" class="t-small t-a">${L('경로가 상자를 지남, 상자 앞에서 멈춤', 'Path goes through the crate, agent stops')}</text>
    <text x="300" y="16" class="t-b">${L('카빙: 셀을 잘라 냄', 'Carving: cells cut out')}</text>
    ${cell(300, 26, true)}
    <rect x="390" y="50" width="18" height="18" class="f-accent" fill-opacity="0.8"/>
    <rect x="366" y="48" width="66" height="22" fill="none" class="d-bad" stroke-dasharray="3 2"/>
    <path d="M311,59 L333,81 L333,103 L355,125 L421,125 L443,103 L465,81 L487,59" class="d-b" marker-end="url(#arrB)"/>
    <text x="399" y="150" text-anchor="middle" class="t-small t-b">${L('발자국 + 반지름 영역 제거, 경로 재계산', 'Footprint + radius removed, path replanned')}</text>
    <text x="20" y="172" class="t-small">${L('타임라인 (정지 시 카빙)', 'Timeline (carve only stationary)')}</text>
    <rect x="20" y="180" width="80" height="12" class="f-accent" fill-opacity="0.5"/><text x="60" y="189" text-anchor="middle" class="t-small">${L('이동 중', 'Moving')}</text>
    <rect x="100" y="180" width="100" height="12" class="f-dim"/><text x="150" y="189" text-anchor="middle" class="t-small">${L('정지 판정 대기', 'Time to stationary')}</text>
    <rect x="200" y="180" width="150" height="12" class="f-bad" fill-opacity="0.45"/><text x="275" y="189" text-anchor="middle" class="t-small">${L('카빙, 경로 재계산', 'Carved, paths replanned')}</text>
    <rect x="350" y="180" width="110" height="12" class="f-accent" fill-opacity="0.5"/><text x="405" y="189" text-anchor="middle" class="t-small">${L('이동, 구멍 제거', 'Moving, hole removed')}</text>
  </svg>`;
  },
  look: [
    '상자가 통로를 막으면 A의 에이전트는 상자 앞에 몰려 멈춤(빨간 테두리). B는 상자가 멈추고 0.5초 뒤 통로 셀이 잘려 나감(빨간 빗금). 에이전트는 아래 우회로로 돌아감.',
    'B의 "정지 판정 시간"을 3초로 올리면 그동안 B도 상자 앞에 몰림. "막힌 시간 합계"가 늘어남.',
    'B에서 "정지했을 때만 카빙"을 끄면 상자가 움직이는 동안에도 카빙. 우회는 빨라지지만 "내비메시 갱신 수"가 크게 늘어남.',
    '상자가 비키면 B는 구멍을 지우고 경로를 다시 계산. 굵은 선(첫 에이전트의 경로)이 짧은 통로로 돌아오고, 점선으로 이전 경로가 잠깐 남음.',
  ],
  refs: [
    { type: 'engine', title: 'Unity Manual - NavMesh Obstacle', url: 'https://docs.unity3d.com/Manual/class-NavMeshObstacle.html', note: 'Carve, Move Threshold, Time To Stationary, Carve Only Stationary 설명' },
    { type: 'engine', title: 'Unity Scripting API - AI.NavMeshObstacle', url: 'https://docs.unity3d.com/ScriptReference/AI.NavMeshObstacle.html', note: 'carving, carveOnlyStationary, carvingTimeToStationary 속성' },
    { type: 'engine', title: 'Unreal Engine - Modifying the Navigation Mesh', note: 'Nav Modifier Volume, Nav Area 클래스, Runtime Generation (Dynamic, Dynamic Modifiers Only)' },
    { type: 'code', title: 'Recast & Detour (DetourTileCache)', url: 'https://github.com/recastnavigation/recastnavigation', note: 'Mikko Mononen. 타일 단위로 장애물을 넣고 빼는 동적 내비메시. Unity와 Unreal 내비게이션의 바탕.' },
  ],
  params: [
    { key: 'mode', label: '장애물 처리', type: 'select', group: '장애물 (NavMeshObstacle)', options: [
      { value: 'avoid', label: '회피만 (카빙 없음)' },
      { value: 'carve', label: '카빙 (Carve)' },
    ], a: 'avoid', b: 'carve' },
    { key: 'onlyStationary', label: '정지했을 때만 카빙', type: 'bool', default: true, when: (p) => p.mode === 'carve', help: 'Carve Only Stationary. 끄면 움직이는 동안에도 계속 카빙' },
    { key: 'carveDelay', label: '정지 판정 시간 (s)', type: 'range', min: 0, max: 3, step: 0.1, default: 0.5, when: (p) => p.mode === 'carve' && p.onlyStationary, help: 'Time To Stationary. 멈춘 뒤 이 시간이 지나야 카빙' },
    { key: 'blockTime', label: '통로 막는 시간 (s)', type: 'range', min: 2, max: 15, step: 0.5, default: 7, shared: true, group: '장면' },
    { key: 'openTime', label: '통로 여는 시간 (s)', type: 'range', min: 1, max: 10, step: 0.5, default: 3, shared: true },
    { key: 'agents', label: '에이전트 수', type: 'int', min: 4, max: 30, default: 14, shared: true, reset: true },
    { key: 'speed', label: '에이전트 속도', type: 'range', min: 30, max: 150, step: 5, default: 70, shared: true },
    { key: 'simSpeed', label: '시뮬레이션 배속', type: 'range', min: 0.5, max: 4, step: 0.5, default: 1, shared: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Moving Obstacles: Avoidance vs Navmesh Carving (NavMeshObstacle)',
    summary: 'A crate blocks a short corridor and moves away again. With avoidance only, the path stays the same and agents stop in front of the crate. With carving, the stopped crate is cut out of the navmesh, and agents replan a path around it.',
    views: { a: 'Avoidance only (no carving)', b: 'Carve when stationary' },
    controls: 'No input. Agents keep walking from the left room to the goal on the right (green).',
    info: `
    <p>A <b>navmesh obstacle</b> is a component for moving objects, like doors or crates, that block the way. Examples are NavMeshObstacle in Unity and Nav Modifier in Unreal.</p>
    <p>There are two ways to handle it:</p>
    <ul>
      <li><b>Avoidance only</b>: the navmesh stays the same. Agents try to steer around the obstacle with local avoidance. The path still goes through the blocked corridor, so when the corridor is fully blocked, agents keep pushing the crate and stop.</li>
      <li><b>Carving</b>: cut the obstacle footprint, grown by the agent radius, out of the navmesh. When the navmesh changes, agents replan and go around.</li>
    </ul>
    <p>Carving rebuilds part of the navmesh, so it is expensive. That is why Unity has the <b>Carve Only Stationary</b> option: only stopped obstacles carve. An obstacle counts as stopped after it stays still for <b>Time To Stationary</b>. While it moves, the hole is removed and only avoidance is used.</p>
    <p>In Unreal, set Runtime Generation to Dynamic Modifiers Only, and only the tiles under a Nav Modifier are rebuilt. With the area class NavArea_Null, agents cannot pass through that area.</p>
    <p>Downside: during the stationary wait, agents keep walking toward the blocked side. If carving changes often, navmesh updates and replans pile up and the cost spikes.</p>`,
    look: [
      'When the crate blocks the corridor, A\'s agents crowd in front of it and stop (red ring). In B, the corridor cells are cut out 0.5 s after the crate stops (red hatching). Agents take the lower detour.',
      'Raise B\'s "Time to stationary" to 3 s. B also crowds in front of the crate during that time. "Total stuck time" goes up.',
      'In B, turn off "Carve only when stationary". The crate carves while it moves too. Agents detour sooner, but "Navmesh updates" goes up a lot.',
      'When the crate moves away, B removes the hole and replans. The thick line (the first agent\'s path) comes back to the short corridor, and the old path stays as a dashed line for a moment.',
    ],
    refs: [
      'Explains Carve, Move Threshold, Time To Stationary and Carve Only Stationary.',
      'The carving, carveOnlyStationary and carvingTimeToStationary properties.',
      'Nav Modifier Volume, Nav Area classes, Runtime Generation (Dynamic, Dynamic Modifiers Only).',
      'Mikko Mononen. A dynamic navmesh that adds and removes obstacles per tile. The base of Unity and Unreal navigation.',
    ],
    params: {
      mode: { label: 'Obstacle handling', group: 'Obstacle (NavMeshObstacle)', options: { avoid: 'Avoidance only (no carving)', carve: 'Carve' } },
      onlyStationary: { label: 'Carve only when stationary', help: 'Carve Only Stationary. When off, the obstacle carves while it moves too' },
      carveDelay: { label: 'Time to stationary (s)', help: 'Time To Stationary. Carving starts after the obstacle stays still this long' },
      blockTime: { label: 'Corridor blocked time (s)', group: 'Scene' },
      openTime: 'Corridor open time (s)',
      agents: 'Agent count',
      speed: 'Agent speed',
      simSpeed: 'Simulation speed',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const COLS = 32, ROWS = 18, CS = 20, WW = COLS * CS, WH = ROWS * CS, R = 6;
    const N = COLS * ROWS;
    const wall = new Uint8Array(N);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const border = r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1;
      const mid = c >= 12 && c <= 19 && !(r === 8 || r === 9 || r === 15 || r === 16);
      if (border || mid) wall[r * COLS + c] = 1;
    }
    const GOAL = { x: 26.5 * CS, y: 9 * CS };
    const CRATE_X = 15 * CS, CRATE_W = 2 * CS, Y_OUT = 110, Y_IN = 8 * CS, MOVE_T = 1, MOVE_THRESHOLD = 2;

    let agents, crate, carved, carvedCount, stats, spawnPts, spawnK, prevPath, prevPathT, simT;

    function init() {
      ctx.rng = U.rng(ctx.seed);
      spawnPts = [];
      for (let i = 0; i < 40; i++) spawnPts.push({ x: ctx.rng.range(2.5, 8) * CS, y: ctx.rng.range(3, 15) * CS });
      spawnK = 0;
      carved = new Uint8Array(N); carvedCount = 0;
      crate = { y: Y_OUT, phase: 'out', timer: 1.2, stillT: 0, carveY: null };
      stats = { arrived: 0, stuckT: 0, replans: 0, navUpdates: 0 };
      prevPath = null; prevPathT = 0; simT = 0;
      agents = [];
      for (let i = 0; i < P.agents; i++) {
        const sp = spawnPts[spawnK++ % spawnPts.length];
        const a = { id: i, p: { x: sp.x, y: sp.y }, path: null, pi: 0, wait: i * 0.35, stuckT: 0 };
        plan(a);
        agents.push(a);
      }
    }

    const cellOf = (p) => U.clamp(Math.floor(p.y / CS), 0, ROWS - 1) * COLS + U.clamp(Math.floor(p.x / CS), 0, COLS - 1);
    const blocked = (i) => wall[i] || carved[i];

    // 8방향 A*. 대각선은 양옆 셀이 모두 열려 있을 때만 (모서리 끼임 방지)
    function astar(s, g) {
      const gs = new Float64Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
      const gx = g % COLS, gy = (g / COLS) | 0;
      const h = (i) => { const dx = Math.abs(i % COLS - gx), dy = Math.abs(((i / COLS) | 0) - gy); return Math.max(dx, dy) + 0.4142 * Math.min(dx, dy); };
      const open = [s]; gs[s] = 0;
      while (open.length) {
        let bi = 0, bf = Infinity;
        for (let k = 0; k < open.length; k++) { const f = gs[open[k]] + h(open[k]); if (f < bf) { bf = f; bi = k; } }
        const cur = open[bi]; open[bi] = open[open.length - 1]; open.pop();
        if (cur === g) break;
        if (closed[cur]) continue;
        closed[cur] = 1;
        const cx = cur % COLS, cy = (cur / COLS) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
          const ni = ny * COLS + nx;
          if (blocked(ni) && ni !== g) continue;
          if (dx && dy && (blocked(cy * COLS + nx) || blocked(ny * COLS + cx))) continue;
          const ng = gs[cur] + (dx && dy ? 1.4142 : 1);
          if (ng < gs[ni]) { gs[ni] = ng; from[ni] = cur; open.push(ni); }
        }
      }
      if (s !== g && from[g] < 0) return null;
      const out = [];
      for (let i = g; i !== s && i >= 0; i = from[i]) out.push(i);
      return out.reverse();
    }
    function plan(a) {
      const cells = astar(cellOf(a.p), cellOf(GOAL));
      a.path = cells ? cells.map((i) => ({ x: (i % COLS + 0.5) * CS, y: (((i / COLS) | 0) + 0.5) * CS })) : null;
      if (a.path) a.path[a.path.length - 1] = { x: GOAL.x, y: GOAL.y };
      a.pi = 0;
    }
    function lead() { let best = null; for (const a of agents) if (a.wait <= 0 && a.path && (!best || a.id < best.id)) best = a; return best; }
    function replanAll() {
      const l = lead();
      if (l && l.path) { prevPath = [{ x: l.p.x, y: l.p.y }, ...l.path.slice(l.pi)]; prevPathT = 2.5; }
      for (const a of agents) { plan(a); stats.replans++; }
    }

    // 상자 발자국 + 에이전트 반지름과 겹치는 셀
    function footprint(y) {
      const out = new Uint8Array(N);
      const x0 = CRATE_X - R, x1 = CRATE_X + CRATE_W + R, y0 = y - R, y1 = y + CRATE_W + R;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        if (wall[i]) continue;
        if (c * CS < x1 - 0.01 && (c + 1) * CS > x0 + 0.01 && r * CS < y1 - 0.01 && (r + 1) * CS > y0 + 0.01) out[i] = 1;
      }
      return out;
    }
    function setCarve(next, y) {
      let changed = false, n = 0;
      for (let i = 0; i < N; i++) { if (next[i] !== carved[i]) changed = true; n += next[i]; }
      if (y !== null) { if (crate.carveY === null || Math.abs(crate.carveY - y) > MOVE_THRESHOLD) { stats.navUpdates++; crate.carveY = y; } }
      else if (crate.carveY !== null) { stats.navUpdates++; crate.carveY = null; }
      if (changed) { carved = next; carvedCount = n; replanAll(); }
    }

    function stepCrate(dt) {
      crate.timer -= dt;
      const prevY = crate.y;
      if (crate.phase === 'out' && crate.timer <= 0) { crate.phase = 'movingIn'; crate.timer = MOVE_T; }
      else if (crate.phase === 'movingIn') { crate.y = U.lerp(Y_IN, Y_OUT, Math.max(0, crate.timer) / MOVE_T); if (crate.timer <= 0) { crate.phase = 'in'; crate.timer = P.blockTime; crate.y = Y_IN; } }
      else if (crate.phase === 'in' && crate.timer <= 0) { crate.phase = 'movingOut'; crate.timer = MOVE_T; }
      else if (crate.phase === 'movingOut') { crate.y = U.lerp(Y_OUT, Y_IN, Math.max(0, crate.timer) / MOVE_T); if (crate.timer <= 0) { crate.phase = 'out'; crate.timer = P.openTime; crate.y = Y_OUT; } }
      const moving = Math.abs(crate.y - prevY) > 1e-6;
      crate.stillT = moving ? 0 : crate.stillT + dt;
      if (P.mode !== 'carve') { if (carvedCount) setCarve(new Uint8Array(N), null); return; }
      const active = P.onlyStationary ? crate.stillT >= P.carveDelay : true;
      if (active) setCarve(footprint(crate.y), crate.y);
      else setCarve(new Uint8Array(N), null);
    }

    function pushBox(p, bx, by, bw, bh) {
      const cx = U.clamp(p.x, bx, bx + bw), cy = U.clamp(p.y, by, by + bh);
      const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy);
      if (d >= R) return;
      if (d > 1e-6) { p.x = cx + dx / d * R; p.y = cy + dy / d * R; return; }
      const l = p.x - bx, rr = bx + bw - p.x, t = p.y - by, b = by + bh - p.y, m = Math.min(l, rr, t, b);
      if (m === l) p.x = bx - R; else if (m === rr) p.x = bx + bw + R; else if (m === t) p.y = by - R; else p.y = by + bh + R;
    }
    function collide(a) {
      // 상자는 옆으로만 밀어냄 (위아래는 벽에 붙어 있음)
      if (a.p.x > CRATE_X - R && a.p.x < CRATE_X + CRATE_W + R && a.p.y > crate.y - R && a.p.y < crate.y + CRATE_W + R) {
        const cx = U.clamp(a.p.x, CRATE_X, CRATE_X + CRATE_W), cy = U.clamp(a.p.y, crate.y, crate.y + CRATE_W);
        if (Math.hypot(a.p.x - cx, a.p.y - cy) < R) a.p.x = a.p.x < CRATE_X + CRATE_W / 2 ? CRATE_X - R : CRATE_X + CRATE_W + R;
      }
      const c0 = Math.floor(a.p.x / CS), r0 = Math.floor(a.p.y / CS);
      for (let r = r0 - 1; r <= r0 + 1; r++) for (let c = c0 - 1; c <= c0 + 1; c++) {
        if (r < 0 || c < 0 || r >= ROWS || c >= COLS || !wall[r * COLS + c]) continue;
        pushBox(a.p, c * CS, r * CS, CS, CS);
      }
    }

    function stepAgents(dt) {
      for (const a of agents) {
        if (a.wait > 0) { a.wait -= dt; continue; }
        if (!a.path) { plan(a); continue; }
        const before = { x: a.p.x, y: a.p.y };
        let t = a.path[a.pi];
        while (a.pi < a.path.length - 1 && Math.hypot(t.x - a.p.x, t.y - a.p.y) < 9) t = a.path[++a.pi];
        const dx = t.x - a.p.x, dy = t.y - a.p.y, d = Math.hypot(dx, dy);
        if (a.pi === a.path.length - 1 && d < 10) {
          stats.arrived++;
          const sp = spawnPts[spawnK++ % spawnPts.length];
          a.p = { x: sp.x, y: sp.y }; a.stuckT = 0; plan(a);
          continue;
        }
        const step = Math.min(d, P.speed * dt);
        a.p.x += dx / d * step; a.p.y += dy / d * step;
        a.before = before;
      }
      // 에이전트끼리 겹침 해소 (단순 분리)
      for (let i = 0; i < agents.length; i++) for (let j = i + 1; j < agents.length; j++) {
        const a = agents[i], b = agents[j];
        if (a.wait > 0 || b.wait > 0) continue;
        const dx = b.p.x - a.p.x, dy = b.p.y - a.p.y, d = Math.hypot(dx, dy);
        if (d < R * 2 && d > 1e-6) { const k = (R * 2 - d) / d * 0.5; a.p.x -= dx * k; a.p.y -= dy * k; b.p.x += dx * k; b.p.y += dy * k; }
      }
      for (const a of agents) {
        if (a.wait > 0) continue;
        collide(a); collide(a);
        if (a.before) {
          const moved = Math.hypot(a.p.x - a.before.x, a.p.y - a.before.y);
          if (moved < P.speed * dt * 0.25) { a.stuckT += dt; stats.stuckT += dt; } else a.stuckT = 0;
          a.before = null;
        }
      }
    }

    init();

    const view = () => { const s = Math.min(ctx.width / WW, (ctx.height - 4) / WH); return { s, ox: (ctx.width - WW * s) / 2, oy: (ctx.height - WH * s) / 2 }; };
    return {
      update(dt) {
        let t = dt * P.simSpeed;
        while (t > 1e-6) {
          const h = Math.min(t, 1 / 60);
          simT += h; prevPathT = Math.max(0, prevPathT - h);
          stepCrate(h); stepAgents(h);
          t -= h;
        }
      },
      onAction() { init(); },
      render() {
        const g = ctx.g, vw = view(), s = vw.s;
        const X = (x) => vw.ox + x * s, Y = (y) => vw.oy + y * s;
        const col = ctx.side === 'a' ? C.a : C.b;
        // 셀: 바닥(내비메시), 벽, 카빙된 셀
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const i = r * COLS + c, x = X(c * CS), y = Y(r * CS), w = CS * s + 0.5;
          if (wall[i]) { g.fillStyle = '#3a404c'; g.fillRect(x, y, w, w); continue; }
          g.fillStyle = carved[i] ? 'rgba(255,83,112,0.28)' : '#1d222a'; g.fillRect(x, y, w, w);
          if (carved[i]) {
            g.strokeStyle = 'rgba(255,83,112,0.7)'; g.lineWidth = 1; g.beginPath();
            g.moveTo(x, y + w * 0.5); g.lineTo(x + w * 0.5, y); g.moveTo(x, y + w); g.lineTo(x + w, y); g.moveTo(x + w * 0.5, y + w); g.lineTo(x + w, y + w * 0.5);
            g.stroke();
          }
        }
        g.strokeStyle = 'rgba(255,255,255,0.04)'; g.lineWidth = 1; g.beginPath();
        for (let c = 0; c <= COLS; c++) { g.moveTo(X(c * CS), Y(0)); g.lineTo(X(c * CS), Y(WH)); }
        for (let r = 0; r <= ROWS; r++) { g.moveTo(X(0), Y(r * CS)); g.lineTo(X(WW), Y(r * CS)); }
        g.stroke();
        // 출발 영역과 목표
        D.rect(g, X(2 * CS), Y(2.5 * CS), 6.5 * CS * s, 13 * CS * s, null, 'rgba(255,255,255,0.12)');
        D.text(g, GTL.L('출발', 'Start'), X(5.2 * CS), Y(2 * CS), { align: 'center', size: 10, color: C.dim });
        D.circle(g, X(GOAL.x), Y(GOAL.y), 10 * s + 3, 'rgba(80,220,140,0.25)', C.good, 2);
        D.text(g, GTL.L('목표', 'Goal'), X(GOAL.x), Y(GOAL.y) - 16 * s - 6, { align: 'center', size: 10, color: C.good });
        // 경로: 모든 에이전트는 흐리게, 첫 에이전트는 굵게, 이전 경로는 점선
        g.globalAlpha = 0.18;
        for (const a of agents) {
          if (a.wait > 0 || !a.path) continue;
          D.poly(g, [{ x: X(a.p.x), y: Y(a.p.y) }, ...a.path.slice(a.pi).map((q) => ({ x: X(q.x), y: Y(q.y) }))], null, col, 1, false);
        }
        g.globalAlpha = 1;
        if (prevPath && prevPathT > 0) {
          g.setLineDash([4, 4]); g.globalAlpha = Math.min(1, prevPathT);
          D.poly(g, prevPath.map((q) => ({ x: X(q.x), y: Y(q.y) })), null, 'rgba(255,255,255,0.6)', 1.5, false);
          g.setLineDash([]); g.globalAlpha = 1;
        }
        const l = lead();
        if (l && l.path) D.poly(g, [{ x: X(l.p.x), y: Y(l.p.y) }, ...l.path.slice(l.pi).map((q) => ({ x: X(q.x), y: Y(q.y) }))], null, col, 2.5, false);
        // 상자
        const cx = X(CRATE_X), cy = Y(crate.y), cw = CRATE_W * s;
        const moving = crate.phase === 'movingIn' || crate.phase === 'movingOut';
        D.rect(g, cx, cy, cw, cw, '#8a6a3a', moving ? C.warn : carvedCount ? C.bad : '#d8c8a0');
        g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + 3, cy + 3); g.lineTo(cx + cw - 3, cy + cw - 3); g.moveTo(cx + cw - 3, cy + 3); g.lineTo(cx + 3, cy + cw - 3); g.stroke();
        if (P.mode === 'carve' && crate.phase !== 'out') {
          g.setLineDash([3, 3]);
          D.rect(g, X(CRATE_X - R), Y(crate.y - R), (CRATE_W + R * 2) * s, (CRATE_W + R * 2) * s, null, 'rgba(255,83,112,0.6)', 1);
          g.setLineDash([]);
        }
        let label;
        if (moving) label = GTL.L('상자 이동 중', 'Crate moving');
        else if (crate.phase === 'out') label = GTL.L('통로 열림', 'Corridor open');
        else if (carvedCount) label = GTL.L('카빙됨', 'Carved');
        else if (P.mode === 'carve' && P.onlyStationary) label = GTL.L('정지 판정 대기 ', 'Waiting for stationary ') + Math.max(0, P.carveDelay - crate.stillT).toFixed(1) + 's';
        else label = GTL.L('통로 막힘 (회피만)', 'Corridor blocked (avoidance only)');
        D.text(g, label, X(CRATE_X + CRATE_W / 2), Y(4 * CS), { align: 'center', size: 11, color: moving ? C.warn : carvedCount ? C.bad : C.text });
        // 에이전트
        for (const a of agents) {
          if (a.wait > 0) continue;
          const stuck = a.stuckT > 0.4;
          D.circle(g, X(a.p.x), Y(a.p.y), Math.max(2.5, R * s), col, stuck ? C.bad : '#000', stuck ? 2 : 1);
        }
        let stuckNow = 0; for (const a of agents) if (a.wait <= 0 && a.stuckT > 0.4) stuckNow++;
        ctx.stat(GTL.L('도착 수', 'Arrivals'), stats.arrived);
        ctx.stat(GTL.L('막힌 시간 합계', 'Total stuck time'), stats.stuckT.toFixed(1) + ' s');
        ctx.stat(GTL.L('지금 막힌 에이전트', 'Agents stuck now'), stuckNow);
        ctx.stat(GTL.L('카빙된 셀', 'Carved cells'), carvedCount);
        ctx.stat(GTL.L('내비메시 갱신 수', 'Navmesh updates'), stats.navUpdates);
        ctx.stat(GTL.L('경로 재계산 수', 'Replans'), stats.replans);
      },
    };
  },
});
