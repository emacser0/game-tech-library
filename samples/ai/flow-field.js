// 플로우 필드 vs 유닛별 A*
GTL.register({
  id: 'flow-field',
  title: '플로우 필드 (Flow Field) vs 유닛별 A*',
  summary: '수백 유닛이 같은 목표로 갈 때 유닛마다 A*를 돌리면, 목표가 바뀔 때마다 길찾기 요청이 몰림. 플로우 필드는 목표에서 Dijkstra를 한 번 퍼뜨려 방향 지도를 만듦. 유닛 수와 상관없는 비용으로 모든 유닛을 안내함.',
  views: { a: '유닛별 A* (프레임 예산)', b: '플로우 필드' },
  controls: '클릭: 목표 지점 변경 (미러 입력을 켜면 양쪽 동시)',
  info: `
    <p><b>유닛별 A*</b>: 유닛마다 자기 위치에서 목표까지 경로를 요청함. 프레임 시간을 지키려면 프레임당 처리할 요청 수(예산)를 제한해야 함.
    그래서 목표가 바뀌면 수백 개의 요청이 큐에 쌓임. <b>뒤쪽 유닛은 경로를 받을 때까지 멈춰 있음</b>(회색).</p>
    <p><b>플로우 필드(Flow Field)</b>: 동작 순서는 다음과 같음.</p>
    <ul>
      <li>목표 칸에서 맵 전체로 Dijkstra를 한 번 퍼뜨림.</li>
      <li>그 결과로 <b>적분 필드</b>(칸마다 목표까지 비용)가 생김.</li>
      <li>칸마다 "비용이 가장 낮은 이웃 방향"을 저장함.</li>
      <li>유닛은 자기 칸의 화살표만 읽음.</li>
    </ul>
    <p>그래서 <b>유닛 수가 늘어도 길찾기 비용이 늘지 않음</b>. Supreme Commander 2, Planetary Annihilation 같은 RTS가 대규모 부대 이동에 썼음.</p>
    <p>단점: 맵 전체(또는 섹터)를 계산해야 하고, 목표마다 필드가 하나씩 필요함. 그래서 실제로는 섹터/포털 계층과 캐시를 함께 씀.</p>
    <p>두 뷰 모두 같은 분리(separation) 조향과 벽 충돌을 씀.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 218" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="ffA" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    <marker id="ffB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="18">${L('유닛별 A*: 요청이 큐에 쌓임', 'Per-unit A*: requests pile up')}</text>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<circle cx="26" cy="${40 + k * 16}" r="5" class="${k < 2 ? 'f-a' : 'f-dim'}"/>`).join('')}
    <line x1="38" y1="96" x2="56" y2="96" class="d-a" marker-end="url(#ffA)"/>
    <text x="62" y="78" class="t-small">${L('경로 요청 큐', 'path request queue')}</text>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<rect x="${62 + i * 15}" y="86" width="12" height="20" class="f-a"/>`).join('')}
    <line x1="196" y1="96" x2="212" y2="96" class="d-a" marker-end="url(#ffA)"/>
    <rect x="214" y="80" width="44" height="32" class="d-a"/><text x="236" y="100" text-anchor="middle">A*</text>
    <text x="236" y="128" text-anchor="middle" class="t-small t-a">${L('프레임당 6개', '6 per frame')}</text>
    <text x="62" y="146" class="t-small t-dim">${L('회색 유닛: 경로를 받을 때까지 정지', 'gray units: stopped until they get a path')}</text>
    <text x="62" y="162" class="t-small t-dim">${L('길찾기 비용: 유닛 수에 비례', 'pathfinding cost grows with unit count')}</text>
    <text x="290" y="18">${L('플로우 필드: 목표에서 Dijkstra 1회', 'Flow field: one Dijkstra from the goal')}</text>
    ${[[10, 9, -1, 1, 0], [9, 8, -1, 2, 1], [8, 7, -1, 3, 2], [7, 6, 5, 4, 3]].map((row, r) => row.map((v, c) => {
      const x = 290 + c * 34, y = 30 + r * 34;
      if (v < 0) return `<rect x="${x}" y="${y}" width="34" height="34" fill="currentColor" opacity="0.45"/>`;
      if (v === 0) return `<rect x="${x}" y="${y}" width="34" height="34" class="f-accent"/><text x="${x + 17}" y="${y + 21}" text-anchor="middle">G</text>`;
      const d = { r: [1, 0], u: [0, -1], d: [0, 1] }[['dd-r', 'dd-uu', 'dd-uu', 'rrruu'][r][c]];
      const cx = x + 17, cy = y + 20;
      return `<rect x="${x}" y="${y}" width="34" height="34" class="f-dim"/><text x="${x + 3}" y="${y + 10}" class="t-small t-mono t-dim">${v}</text>`
        + `<line x1="${cx - d[0] * 7}" y1="${cy - d[1] * 7}" x2="${cx + d[0] * 7}" y2="${cy + d[1] * 7}" class="d-b" marker-end="url(#ffB)"/>`;
    }).join('')).join('')}
    <text x="290" y="182" class="t-small">${L('숫자: 목표까지 적분 비용', 'number: integrated cost to the goal')}</text>
    <text x="290" y="196" class="t-small t-b">${L('칸마다 비용이 가장 낮은 이웃 방향 저장', 'each cell points to its cheapest neighbor')}</text>
    <text x="290" y="210" class="t-small t-dim">${L('비용: 맵 크기에 비례, 유닛 수와 무관', 'cost: map size only, not unit count')}</text>
  </svg>`,
  look: [
    '클릭하거나 자동 이동으로 목표를 바꾸면 A의 "경로 대기 유닛"이 유닛 수만큼 치솟음. 회색 유닛은 차례로 출발함. B는 모든 유닛이 즉시 방향을 틈.',
    'A의 "프레임당 경로 예산"을 올리면 대기는 줄지만 "길찾기 비용"(ms/프레임)이 크게 늘어남.',
    '유닛 수를 600으로 늘려도 B의 필드 계산 비용은 그대로임(맵 크기에만 비례).',
    'B의 "필드 표시"를 "방향 화살표"나 "적분 비용"으로 바꾸면 적분 필드가 벽을 돌아 퍼지는 모양이 보임.',
  ],
  refs: [
    { type: 'book', title: 'Crowd Pathfinding and Steering Using Flow Field Tiles', year: 2013, note: 'Elijah Emerson, Game AI Pro (CRC Press) 23장. Supreme Commander 2의 플로우 필드 구현.' },
    { type: 'game', title: 'Supreme Commander 2 (Gas Powered Games, 2010)', note: '플로우 필드 기반 대규모 유닛 이동.' },
    { type: 'article', title: 'Flow Field Pathfinding for Tower Defense (Red Blob Games)', url: 'https://www.redblobgames.com/pathfinding/tower-defense/', year: 2014, note: 'Amit Patel. BFS/Dijkstra로 만든 방향장 시각화.' },
    { type: 'paper', title: 'Continuum Crowds', year: 2006, note: 'Treuille, Cooper, Popović. SIGGRAPH 2006. 포텐셜 필드 기반 군중.', url: 'https://doi.org/10.1145/1141911.1142008' },
  ],
  params: [
    { key: 'mode', label: '길찾기 방식', type: 'select', group: '길찾기', options: [
      { value: 'astar', label: '유닛별 A*' },
      { value: 'flow', label: '플로우 필드' },
    ], a: 'astar', b: 'flow' },
    { key: 'budget', label: '프레임당 경로 예산', type: 'int', min: 1, max: 100, default: 6, when: (p) => p.mode === 'astar', help: '한 프레임에 처리할 A* 요청 수' },
    { key: 'show', label: '필드 표시', type: 'select', options: [
      { value: 'none', label: '없음' }, { value: 'arrows', label: '방향 화살표' }, { value: 'cost', label: '적분 비용' },
    ], default: 'arrows', when: (p) => p.mode === 'flow' },
    { key: 'showPaths', label: '일부 유닛 경로 표시', type: 'bool', default: true, when: (p) => p.mode === 'astar' },
    { key: 'units', label: '유닛 수', type: 'int', min: 20, max: 600, default: 250, shared: true, reset: true, group: '장면' },
    { key: 'speed', label: '유닛 속도 (칸/s)', type: 'range', min: 1, max: 10, step: 0.5, default: 5, shared: true },
    { key: 'autoMove', label: '목표 자동 이동 (12초)', type: 'bool', default: true, shared: true },
    { key: 'cols', label: '격자 가로 칸 수', type: 'int', min: 30, max: 90, default: 56, shared: true, reset: true },
  ],
  en: {
    title: 'Flow Field vs Per-Unit A*',
    summary: 'When hundreds of units head to the same goal and each runs its own A*, path requests pile up every time the goal changes. A flow field spreads Dijkstra once from the goal and builds a direction map. It guides every unit at a cost that does not depend on the unit count.',
    views: { a: 'Per-unit A* (frame budget)', b: 'Flow field' },
    controls: 'Click: change the goal (with mirror input on, both sides change at once)',
    info: `
    <p><b>Per-unit A*</b>: each unit requests a path from its position to the goal. To stay within frame time, you must limit the requests handled per frame (the budget).
    So when the goal changes, hundreds of requests pile up in the queue. <b>Units at the back stand still until they get a path</b> (gray).</p>
    <p><b>Flow field</b>: it works in this order.</p>
    <ul>
      <li>Spread Dijkstra once from the goal cell over the whole map.</li>
      <li>This gives an <b>integration field</b> (cost to the goal for each cell).</li>
      <li>Each cell stores "the direction to the neighbor with the lowest cost".</li>
      <li>A unit only reads the arrow in its own cell.</li>
    </ul>
    <p>So <b>pathfinding cost does not grow with more units</b>. RTS games like Supreme Commander 2 and Planetary Annihilation used it to move large armies.</p>
    <p>Downsides: you must compute the whole map (or a sector), and you need one field per goal. So real games combine it with a sector/portal hierarchy and caching.</p>
    <p>Both views use the same separation steering and wall collision.</p>`,
    look: [
      'Click, or let auto move change the goal. A\'s "Units waiting for path" jumps up to the unit count. Gray units start one after another. In B, every unit turns at once.',
      'Raise A\'s "Path budget per frame". Waiting drops, but "Pathfinding cost" (ms/frame) rises a lot.',
      'Raise the unit count to 600. B\'s field cost stays the same (it depends only on map size).',
      'Switch B\'s "Field display" to "Direction arrows" or "Integration cost". You can see the integration field spread around walls.',
    ],
    refs: [
      'Elijah Emerson, Game AI Pro (CRC Press), chapter 23. The flow field implementation of Supreme Commander 2.',
      'Large-scale unit movement based on flow fields.',
      'Amit Patel. Visualizes direction fields built with BFS and Dijkstra.',
      'Treuille, Cooper, Popović. SIGGRAPH 2006. Crowds based on potential fields.',
    ],
    params: {
      mode: { label: 'Pathfinding method', group: 'Pathfinding', options: { astar: 'Per-unit A*', flow: 'Flow field' } },
      budget: { label: 'Path budget per frame', help: 'Number of A* requests handled in one frame' },
      show: { label: 'Field display', options: { none: 'None', arrows: 'Direction arrows', cost: 'Integration cost' } },
      showPaths: 'Show paths for some units',
      units: { label: 'Unit count', group: 'Scene' },
      speed: 'Unit speed (cells/s)',
      autoMove: 'Auto move goal (12 s)',
      cols: 'Grid columns',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const SQ2 = Math.SQRT2, cols = P.cols, rows = Math.round(cols * 0.6), N = cols * rows;
    const R = 0.28; // 유닛 반지름 (칸)
    const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

    // ── 맵: 건물 블록 ──
    const rng = U.rng(ctx.seed * 31 + 7);
    const wall = new Uint8Array(N);
    for (let i = 0; i < N / 55; i++) {
      const w = rng.int(2, 6), h = rng.int(2, 6), x0 = rng.int(0, cols - w), y0 = rng.int(0, rows - h);
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) wall[y * cols + x] = 1;
    }
    // 긴 벽 몇 개 (우회 필요)
    for (let k = 0; k < 3; k++) {
      const x = Math.round(cols * (0.3 + k * 0.2)), y0 = rng.int(0, Math.round(rows * 0.4)), len = Math.round(rows * 0.55);
      for (let y = y0; y < Math.min(rows, y0 + len); y++) wall[y * cols + x] = 1;
    }
    const free = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && !wall[y * cols + x];
    const freeCells = [];
    for (let i = 0; i < N; i++) if (!wall[i]) freeCells.push(i);

    // ── 유닛 (왼쪽 영역에서 시작) ──
    const units = [];
    const leftCells = freeCells.filter((i) => i % cols < cols * 0.22);
    for (let k = 0; k < P.units; k++) {
      const c = rng.pick(leftCells);
      units.push({ x: (c % cols) + rng.range(0.3, 0.7), y: ((c / cols) | 0) + rng.range(0.3, 0.7), vx: 0, vy: 0, path: null, pi: 0, waiting: false });
    }

    // ── 목표 ──
    const goalRng = U.rng(ctx.seed * 17 + 1);
    let goal = { x: cols - 4, y: Math.round(rows / 2) };
    const nearestFree = (x, y) => {
      let best = freeCells[0], bd = Infinity;
      for (const i of freeCells) { const d = (i % cols - x) ** 2 + (((i / cols) | 0) - y) ** 2; if (d < bd) { bd = d; best = i; } }
      return { x: best % cols, y: (best / cols) | 0 };
    };
    goal = nearestFree(goal.x, goal.y);
    let goalTimer = 0, goalVersion = 0;

    // ── 힙 ──
    function Heap() {
      const id = [], f = [];
      return {
        get size() { return id.length; },
        push(n, v) {
          id.push(n); f.push(v);
          let i = id.length - 1;
          while (i > 0) { const p = (i - 1) >> 1; if (f[p] <= f[i]) break; [id[i], id[p]] = [id[p], id[i]]; [f[i], f[p]] = [f[p], f[i]]; i = p; }
        },
        pop() {
          const top = id[0], lid = id.pop(), lf = f.pop();
          if (id.length) {
            id[0] = lid; f[0] = lf;
            let i = 0;
            for (;;) {
              const l = i * 2 + 1, r = l + 1; let m = i;
              if (l < id.length && f[l] < f[m]) m = l;
              if (r < id.length && f[r] < f[m]) m = r;
              if (m === i) break;
              [id[i], id[m]] = [id[m], id[i]]; [f[i], f[m]] = [f[m], f[i]]; i = m;
            }
          }
          return top;
        },
      };
    }
    const neighbors = (i, fn) => {
      const x = i % cols, y = (i / cols) | 0;
      for (const [dx, dy] of DIRS8) {
        if (!free(x + dx, y + dy)) continue;
        if (dx && dy && (!free(x + dx, y) || !free(x, y + dy))) continue;
        fn((y + dy) * cols + x + dx, dx && dy ? SQ2 : 1, dx, dy);
      }
    };

    // ── 유닛별 A* ──
    const gA = new Float64Array(N), parA = new Int32Array(N), stamp = new Uint32Array(N), closed = new Uint32Array(N);
    let stampId = 0, frameNodes = 0;
    function astar(sx, sy) {
      stampId++;
      const s = sy * cols + sx, gi = goal.y * cols + goal.x;
      const h = (i) => { const dx = Math.abs(i % cols - goal.x), dy = Math.abs(((i / cols) | 0) - goal.y); return Math.max(dx, dy) + (SQ2 - 1) * Math.min(dx, dy); };
      const heap = Heap();
      gA[s] = 0; parA[s] = -1; stamp[s] = stampId; heap.push(s, h(s));
      while (heap.size) {
        const cur = heap.pop();
        if (closed[cur] === stampId) continue;
        closed[cur] = stampId; frameNodes++;
        if (cur === gi) break;
        neighbors(cur, (n, c) => {
          if (closed[n] === stampId) return;
          const ng = gA[cur] + c;
          if (stamp[n] !== stampId || ng < gA[n]) { stamp[n] = stampId; gA[n] = ng; parA[n] = cur; heap.push(n, ng + h(n)); }
        });
      }
      if (closed[gi] !== stampId) return [];
      const out = [];
      for (let i = gi; i >= 0; i = parA[i]) out.push(i);
      return out.reverse();
    }
    let queue = [];
    function requestAll() {
      queue = [];
      for (const u of units) { u.waiting = true; u.path = null; queue.push(u); }
    }

    // ── 플로우 필드 ──
    const integ = new Float64Array(N), dirX = new Float32Array(N), dirY = new Float32Array(N);
    let fieldMs = 0, fieldNodes = 0, maxInteg = 1;
    function buildField() {
      const t0 = ctx.now();
      integ.fill(Infinity);
      const heap = Heap();
      const gi = goal.y * cols + goal.x;
      integ[gi] = 0; heap.push(gi, 0);
      fieldNodes = 0;
      while (heap.size) {
        const cur = heap.pop();
        fieldNodes++;
        neighbors(cur, (n, c) => { const ng = integ[cur] + c; if (ng < integ[n] - 1e-9) { integ[n] = ng; heap.push(n, ng); } });
      }
      maxInteg = 1;
      for (let i = 0; i < N; i++) {
        dirX[i] = dirY[i] = 0;
        if (!isFinite(integ[i])) continue;
        maxInteg = Math.max(maxInteg, integ[i]);
        let best = integ[i], bx = 0, by = 0;
        neighbors(i, (n, c, dx, dy) => { if (integ[n] < best) { best = integ[n]; bx = dx; by = dy; } });
        const l = Math.hypot(bx, by) || 1;
        dirX[i] = bx / l; dirY[i] = by / l;
      }
      fieldMs = ctx.now() - t0;
    }

    function onGoalChanged() {
      goalVersion++;
      if (P.mode === 'flow') buildField(); else requestAll();
    }
    onGoalChanged();

    // ── 공간 해시 (분리 조향) ──
    const bucketHead = new Int32Array(N), bucketNext = new Int32Array(units.length);
    let costHist = [], arrived = 0;

    function collideWalls(u) {
      const cx = Math.floor(u.x), cy = Math.floor(u.y);
      for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) {
        if (free(x, y)) continue;
        const px = U.clamp(u.x, x, x + 1), py = U.clamp(u.y, y, y + 1);
        const dx = u.x - px, dy = u.y - py, d = Math.hypot(dx, dy);
        if (d < R) {
          if (d > 1e-6) { u.x = px + (dx / d) * R; u.y = py + (dy / d) * R; }
          else { u.x = x + 0.5 + (u.x < x + 0.5 ? -0.5 - R : 0.5 + R); }
        }
      }
      u.x = U.clamp(u.x, R, cols - R); u.y = U.clamp(u.y, R, rows - R);
    }

    const L = () => { const cs = Math.min(ctx.width / cols, ctx.height / rows); return { cs, ox: (ctx.width - cs * cols) / 2, oy: (ctx.height - cs * rows) / 2 }; };
    const bg = ctx.createCanvas(cols, rows), bgg = bg.getContext('2d'), bgData = bgg.createImageData(cols, rows);

    return {
      update(dt) {
        // 목표 자동 이동
        goalTimer += dt;
        if (P.autoMove && goalTimer > 12) {
          goalTimer = 0;
          const c = freeCells[Math.floor(goalRng.next() * freeCells.length)];
          goal = { x: c % cols, y: (c / cols) | 0 };
          onGoalChanged();
        }
        // 길찾기 비용 (프레임 예산 안에서)
        const t0 = ctx.now();
        frameNodes = 0;
        if (P.mode === 'astar') {
          let n = P.budget;
          while (n-- > 0 && queue.length) {
            const u = queue.shift();
            u.path = astar(Math.floor(u.x), Math.floor(u.y)); u.pi = 0; u.waiting = false;
          }
        }
        const pathMs = ctx.now() - t0;
        costHist.push(pathMs); if (costHist.length > 60) costHist.shift();

        // 버킷
        bucketHead.fill(-1);
        units.forEach((u, k) => { const c = Math.floor(u.y) * cols + Math.floor(u.x); bucketNext[k] = bucketHead[c]; bucketHead[c] = k; });
        arrived = 0;
        const sp = P.speed;
        for (let k = 0; k < units.length; k++) {
          const u = units[k];
          let dx = 0, dy = 0;
          const gx = goal.x + 0.5 - u.x, gy = goal.y + 0.5 - u.y, gd = Math.hypot(gx, gy);
          const arriveR = 1 + Math.sqrt(units.length) * 0.12;
          if (gd < arriveR) { arrived++; }
          else if (P.mode === 'flow') {
            const c = Math.floor(u.y) * cols + Math.floor(u.x);
            dx = dirX[c]; dy = dirY[c];
            if (!dx && !dy) { dx = gx / gd; dy = gy / gd; }
          } else if (u.path && u.path.length) {
            while (u.pi < u.path.length - 1) {
              const w = u.path[u.pi];
              if (Math.hypot(w % cols + 0.5 - u.x, ((w / cols) | 0) + 0.5 - u.y) < 0.6) u.pi++; else break;
            }
            const w = u.path[u.pi];
            const wx = w % cols + 0.5 - u.x, wy = ((w / cols) | 0) + 0.5 - u.y, wd = Math.hypot(wx, wy) || 1;
            dx = wx / wd; dy = wy / wd;
          }
          // 분리
          let sx = 0, sy = 0;
          const bx = Math.floor(u.x), by = Math.floor(u.y);
          for (let y = by - 1; y <= by + 1; y++) for (let x = bx - 1; x <= bx + 1; x++) {
            if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
            for (let j = bucketHead[y * cols + x]; j >= 0; j = bucketNext[j]) {
              if (j === k) continue;
              const o = units[j], ox = u.x - o.x, oy = u.y - o.y, d2 = ox * ox + oy * oy;
              if (d2 < (2.2 * R) ** 2 && d2 > 1e-8) { const d = Math.sqrt(d2), s = (2.2 * R - d) / (2.2 * R); sx += (ox / d) * s; sy += (oy / d) * s; }
            }
          }
          const tvx = dx * sp + sx * sp * 1.5, tvy = dy * sp + sy * sp * 1.5;
          u.vx = U.damp(u.vx, tvx, 10, dt); u.vy = U.damp(u.vy, tvy, 10, dt);
          u.x += u.vx * dt; u.y += u.vy * dt;
          collideWalls(u);
        }
      },
      onParam(key) {
        if (key === 'mode') { for (const u of units) { u.path = null; u.waiting = false; } queue = []; onGoalChanged(); }
      },
      onPointer(type, m) {
        if (type !== 'down') return;
        const l = L();
        const x = Math.floor((m.x - l.ox) / l.cs), y = Math.floor((m.y - l.oy) / l.cs);
        if (!free(x, y)) return;
        goal = { x, y }; goalTimer = 0;
        onGoalChanged();
      },
      render() {
        const g = ctx.g, l = L(), cs = l.cs, d = bgData.data;
        const showCost = P.mode === 'flow' && P.show === 'cost';
        for (let i = 0; i < N; i++) {
          const k = i * 4;
          if (wall[i]) { d[k] = 70; d[k + 1] = 78; d[k + 2] = 94; }
          else if (showCost && isFinite(integ[i])) {
            const t = integ[i] / maxInteg;
            d[k] = U.lerp(40, 20, t); d[k + 1] = U.lerp(120, 30, t); d[k + 2] = U.lerp(160, 50, t);
          } else { d[k] = 28; d[k + 1] = 32; d[k + 2] = 39; }
          d[k + 3] = 255;
        }
        bgg.putImageData(bgData, 0, 0);
        g.imageSmoothingEnabled = false;
        g.drawImage(bg, l.ox, l.oy, cols * cs, rows * cs);
        g.imageSmoothingEnabled = true;
        const X = (x) => l.ox + x * cs, Y = (y) => l.oy + y * cs;
        if (P.mode === 'flow' && P.show === 'arrows' && cs >= 6) {
          g.beginPath();
          for (let i = 0; i < N; i++) {
            if (!dirX[i] && !dirY[i]) continue;
            const x = X(i % cols + 0.5), y = Y(((i / cols) | 0) + 0.5), ax = dirX[i] * cs * 0.35, ay = dirY[i] * cs * 0.35;
            g.moveTo(x - ax, y - ay); g.lineTo(x + ax, y + ay);
            g.moveTo(x + ax, y + ay); g.lineTo(x + ax * 0.3 - ay * 0.45, y + ay * 0.3 + ax * 0.45);
          }
          g.strokeStyle = 'rgba(79,195,247,0.35)'; g.lineWidth = 1; g.stroke();
        }
        if (P.mode === 'astar' && P.showPaths) {
          g.globalAlpha = 0.35;
          for (let k = 0; k < units.length; k += 25) {
            const u = units[k];
            if (!u.path || !u.path.length) continue;
            D.poly(g, u.path.slice(u.pi).map((i) => ({ x: X(i % cols + 0.5), y: Y(((i / cols) | 0) + 0.5) })), null, C.a, 1.5, false);
          }
          g.globalAlpha = 1;
        }
        // 유닛
        const col = ctx.side === 'a' ? C.a : C.b;
        let waiting = 0;
        for (const pass of [0, 1]) {
          g.beginPath();
          for (const u of units) {
            const w = P.mode === 'astar' && (u.waiting || !u.path);
            if (w) waiting += pass;
            if ((pass === 1) !== w) continue;
            g.moveTo(X(u.x) + R * cs, Y(u.y)); g.arc(X(u.x), Y(u.y), R * cs, 0, U.TAU);
          }
          g.fillStyle = pass ? '#6b7280' : col; g.fill();
        }
        // 목표
        const gx = X(goal.x + 0.5), gy = Y(goal.y + 0.5), pr = cs * (0.6 + 0.15 * Math.sin(ctx.time * 6));
        D.circle(g, gx, gy, pr, null, C.good, 2.5);
        D.line(g, gx - pr * 1.4, gy, gx + pr * 1.4, gy, C.good, 1.5); D.line(g, gx, gy - pr * 1.4, gx, gy + pr * 1.4, C.good, 1.5);

        const avg = costHist.length ? costHist.reduce((a, b) => a + b, 0) / costHist.length : 0;
        if (P.mode === 'astar') {
          ctx.stat(GTL.L('경로 대기 유닛', 'Units waiting for path'), waiting);
          ctx.stat(GTL.L('이번 프레임 A* 노드', 'A* nodes this frame'), frameNodes);
          ctx.stat(GTL.L('길찾기 비용 (평균)', 'Pathfinding cost (avg)'), avg.toFixed(2) + GTL.L(' ms/프레임', ' ms/frame'));
        } else {
          ctx.stat(GTL.L('필드 계산 노드', 'Field nodes'), fieldNodes);
          ctx.stat(GTL.L('필드 재계산 비용', 'Field rebuild cost'), fieldMs.toFixed(2) + GTL.L(' ms (목표 변경 시 1회)', ' ms (once per goal change)'));
          ctx.stat(GTL.L('유닛당 길찾기 비용', 'Pathfinding cost per unit'), GTL.L('배열 읽기 1회', 'One array read'));
        }
        ctx.stat(GTL.L('도착 유닛', 'Units arrived'), `${arrived} / ${units.length}`);
        ctx.stat(GTL.L('목표 변경 후', 'Since goal change'), goalTimer.toFixed(1) + ' s');
      },
    };
  },
});
