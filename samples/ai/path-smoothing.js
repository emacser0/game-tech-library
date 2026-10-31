// 경로 스무딩: 격자 경로 vs String Pulling vs Theta*
GTL.register({
  id: 'path-smoothing',
  title: '경로 스무딩: String Pulling, Theta*',
  summary: '격자 A* 경로는 45° 단위로 꺾여 지그재그로 보임. 두 가지 해결법을 비교. 시야(LOS) 검사로 필요 없는 경유점을 지우는 후처리, 그리고 탐색 중에 바로 임의 각도로 잇는 Theta*.',
  views: { a: '8방향 격자 경로', b: 'Theta*' },
  controls: '드래그: 벽 칠하기/지우기, S/G 원 드래그: 시작/목표 이동, 우클릭 드래그: 지우기',
  info: `
    <p>격자 A*의 경로는 칸 중심에서 이웃 칸 중심으로만 이동함. 그래서 비용이 최적이어도 <b>꺾임이 많고 방향이 45° 단위</b>임.
    캐릭터가 이 경로를 그대로 따라가면 로봇처럼 움직임.</p>
    <ul>
      <li><b>String Pulling (LOS 후처리)</b>: 경로의 현재 점에서 <b>직선으로 보이는(line of sight, LOS) 가장 먼 점</b>까지 건너뜀. 싸고 간단함. 단, 원래 격자 경로가 고른 길을 벗어나지 못해 최단이 아닐 수 있음.</li>
      <li><b>Theta*</b>: A* 확장 중 이웃 n을 열 때, 현재 노드의 <b>부모에서 n이 보이면 그 부모를 n의 부모로</b> 삼음. 탐색 자체가 임의 각도(any-angle) 경로를 만듦. 후처리보다 짧은 경로가 나올 때가 많음. 단점은 LOS 검사 비용.</li>
      <li><b>4방향</b>: 비교용. 계단식 경로가 가장 심함.</li>
    </ul>
    <p>LOS 검사는 칸 중심 사이 선분이 지나는 모든 칸(supercover)을 확인함. 캐릭터(점)가 경로를 따라 이동하며 누적 회전량을 잼.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 184" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="psB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="18">${L('같은 장애물을 도는 세 경로', 'Three paths around one obstacle')}</text>
    <rect x="100" y="76" width="50" height="89" fill="currentColor" opacity="0.35"/>
    <path d="M30,150 L90,90 L90,64 L250,64" class="d-a"/>
    <path d="M30,150 L90,64 L250,64" class="d-accent" stroke-dasharray="5 3"/>
    <path d="M30,150 L100,74 L250,64" class="d-b"/>
    <circle cx="30" cy="150" r="4" class="f-accent"/><text x="16" y="154">S</text>
    <circle cx="250" cy="64" r="4" class="f-accent"/><text x="256" y="68">G</text>
    <line x1="165" y1="108" x2="181" y2="108" class="d-a"/><text x="186" y="112" class="t-small">${L('8방향 격자', '8-way grid')}</text>
    <line x1="165" y1="126" x2="181" y2="126" class="d-accent" stroke-dasharray="5 3"/><text x="186" y="130" class="t-small">String pulling</text>
    <line x1="165" y1="144" x2="181" y2="144" class="d-b"/><text x="186" y="148" class="t-small">Theta*</text>
    <text x="300" y="18">${L('Theta*의 부모 갱신', 'Theta* parent update')}</text>
    <text x="300" y="40" class="t-small">${L('p에서 n이 보이면(LOS)', 'If n is visible from p (LOS),')}</text>
    <text x="300" y="54" class="t-small">${L('n의 부모를 s 대신 p로 정함', 'the parent of n becomes p, not s')}</text>
    <line x1="320" y1="140" x2="390" y2="140" class="d-line"/>
    <line x1="390" y1="140" x2="440" y2="88" class="d-dim" stroke-dasharray="4 3"/>
    <line x1="320" y1="140" x2="433" y2="91" class="d-b" marker-end="url(#psB)"/>
    <circle cx="320" cy="140" r="4" class="f-dim"/><circle cx="390" cy="140" r="4" class="f-dim"/><circle cx="440" cy="88" r="4" class="f-dim"/>
    <text x="350" y="110" class="t-small t-b">Theta*</text>
    <text x="420" y="124" class="t-small t-dim">A*</text>
    <text x="300" y="160" class="t-small">${L('p (s의 부모)', 'p (parent of s)')}</text>
    <text x="392" y="160" class="t-small">${L('s (현재)', 's (current)')}</text>
    <text x="448" y="92" class="t-small">${L('n (이웃)', 'n (neighbor)')}</text>
    <text x="300" y="178" class="t-small t-dim">${L('탐색 중에 임의 각도 간선이 생김', 'Any-angle edges form during the search')}</text>
  </svg>`,
  look: [
    '"총 회전각"을 보면 격자 경로는 지그재그 때문에 회전이 큼. Theta*와 String pulling은 장애물 모서리에서만 꺾임.',
    'A를 "8방향 + String pulling"으로 바꾸고 B(Theta*)와 "경로 길이"를 비교하면 대부분 Theta*가 같거나 짧음.',
    '"LOS 검사" 수와 "계산 시간"을 보면 매끄러운 경로일수록 LOS 비용이 큼.',
    '벽을 그려 좁은 통로를 만들면 두 방식 모두 통로 모서리를 스치듯 지나감(에이전트 반지름 0).',
  ],
  refs: [
    { type: 'paper', title: 'Theta*: Any-Angle Path Planning on Grids', year: 2007, note: 'Nash, Daniel, Koenig, Felner. AAAI-07.', url: 'https://cdn.aaai.org/AAAI/2007/AAAI07-187.pdf' },
    { type: 'article', title: 'Toward More Realistic Pathfinding', year: 2001, note: 'Marco Pinter. Game Developer Magazine / Gamasutra. LOS 기반 경로 스무딩.' },
    { type: 'article', title: 'An Empirical Comparison of Any-Angle Path-Planning Algorithms', year: 2015, note: 'Uras & Koenig, SoCS 2015.' },
    { type: 'book', title: 'AI Game Programming Wisdom', year: 2002, note: 'Steve Rabin 편. 경로 스무딩/string pulling 관련 장 다수.' },
  ],
  params: [
    { key: 'mode', label: '경로 방식', type: 'select', group: '경로', options: [
      { value: 'grid4', label: '4방향 격자 A*' },
      { value: 'grid8', label: '8방향 격자 A*' },
      { value: 'pull', label: '8방향 + String pulling' },
      { value: 'theta', label: 'Theta* (any-angle)' },
    ], a: 'grid8', b: 'theta' },
    { key: 'showRaw', label: '원본 격자 경로 겹쳐 보기', type: 'bool', default: true, when: (p) => p.mode === 'pull' || p.mode === 'theta' },
    { key: 'showLos', label: 'LOS 검사 선 표시', type: 'bool', default: false },
    { key: 'agentSpeed', label: '에이전트 속도 (칸/s)', type: 'range', min: 1, max: 30, step: 0.5, default: 8, shared: true },
    { key: 'map', label: '맵', type: 'select', group: '장면', shared: true, reset: true, options: [
      { value: 'scatter', label: '흩어진 장애물' }, { value: 'rooms', label: '방과 문' }, { value: 'trap', label: 'U자 함정 + 장애물' },
      { value: 'maze', label: '미로' }, { value: 'empty', label: '빈 맵' },
    ], default: 'scatter' },
    { key: 'cols', label: '격자 가로 칸 수', type: 'int', min: 16, max: 90, default: 40, shared: true, reset: true },
    { key: 'clear', label: '벽 모두 지우기', type: 'button' },
  ],
  en: {
    title: 'Path Smoothing: String Pulling, Theta*',
    summary: 'Grid A* paths turn in 45° steps and look zigzag. This compares two fixes. One is a post-process that removes unneeded waypoints with line of sight (LOS) checks. The other is Theta*, which connects at any angle during the search itself.',
    views: { a: '8-way grid path', b: 'Theta*' },
    controls: 'Drag: paint or erase walls. Drag the S/G circles: move start or goal. Right drag: erase.',
    info: `
    <p>A grid A* path only moves from a cell center to a neighbor cell center. So even when the cost is optimal, it has <b>many turns, in 45° steps</b>.
    A character that follows this path as is moves like a robot.</p>
    <ul>
      <li><b>String Pulling (LOS post-process)</b>: from the current point, skip ahead to the <b>farthest point visible in a straight line (line of sight, LOS)</b>. It is cheap and simple. But it cannot leave the route the grid path chose, so it may not be the shortest.</li>
      <li><b>Theta*</b>: when A* opens a neighbor n, <b>if n is visible from the current node's parent, that parent becomes n's parent</b>. The search itself builds an any-angle path. It often finds shorter paths than post-processing. The downside is the cost of LOS checks.</li>
      <li><b>4-way</b>: for comparison. It has the worst staircase path.</li>
    </ul>
    <p>The LOS check tests every cell the segment between cell centers passes through (supercover). A character (a point) moves along the path and measures its total turning.</p>`,
    look: [
      'Look at "Total turn angle". The grid path turns a lot because of the zigzag. Theta* and string pulling turn only at obstacle corners.',
      'Switch A to "8-way + String pulling" and compare "Path length" with B (Theta*). In most cases Theta* is the same or shorter.',
      'Look at the "LOS checks" count and "Compute time". The smoother the path, the higher the LOS cost.',
      'Draw walls to make a narrow corridor. Both methods brush past the corridor corners (agent radius 0).',
    ],
    refs: [
      null,
      'Marco Pinter. Game Developer Magazine / Gamasutra. LOS-based path smoothing.',
      null,
      'Edited by Steve Rabin. Several chapters on path smoothing and string pulling.',
    ],
    params: {
      mode: { label: 'Path method', group: 'Path', options: { grid4: '4-way grid A*', grid8: '8-way grid A*', pull: '8-way + String pulling' } },
      showRaw: 'Overlay raw grid path',
      showLos: 'Show LOS check lines',
      agentSpeed: 'Agent speed (cells/s)',
      map: { label: 'Map', group: 'Scene', options: { scatter: 'Scattered obstacles', rooms: 'Rooms and doors', trap: 'U trap + obstacles', maze: 'Maze', empty: 'Empty map' } },
      cols: 'Grid columns',
      clear: 'Clear all walls',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const SQ2 = Math.SQRT2;
    const cols = P.cols, rows = Math.max(12, Math.round(cols * 0.6));
    const N = cols * rows;
    let cost, start, goal;

    // ── 맵 생성 (시드 고정, A/B 동일) ──
    function genMap() {
      const rng = U.rng(ctx.seed * 7 + 3);
      cost = new Uint8Array(N).fill(1);
      const wall = (x, y) => { if (x >= 0 && y >= 0 && x < cols && y < rows) cost[y * cols + x] = 0; };
      const box = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) wall(x, y); };
      start = { x: Math.round(cols * 0.12), y: Math.round(rows * 0.5) };
      goal = { x: Math.round(cols * 0.88), y: Math.round(rows * 0.5) };
      const kind = P.map;
      if (kind === 'empty' || kind === 'scatter') { start = { x: Math.round(cols * 0.1), y: Math.round(rows * 0.2) }; goal = { x: Math.round(cols * 0.9), y: Math.round(rows * 0.8) }; }
      if (kind === 'scatter' || kind === 'trap') {
        const n = Math.round(N / (kind === 'trap' ? 70 : 45));
        for (let i = 0; i < n; i++) box(rng.int(0, cols - 1), rng.int(0, rows - 1), rng.int(1, 4), rng.int(1, 4));
      }
      if (kind === 'trap') {
        const x1 = Math.round(cols * 0.5), y0 = Math.round(rows * 0.2), y1 = Math.round(rows * 0.8), x0 = Math.round(cols * 0.3);
        for (let y = y0; y <= y1; y++) wall(x1, y);
        for (let x = x0; x <= x1; x++) { wall(x, y0); wall(x, y1); }
        start = { x: Math.round(cols * 0.4), y: Math.round(rows * 0.5) };
        // 함정 안쪽은 비워 둠
        for (let y = y0 + 1; y < y1; y++) for (let x = x0; x < x1; x++) cost[y * cols + x] = 1;
      }
      if (kind === 'maze') {
        cost.fill(0);
        const cw = Math.floor((cols - 1) / 2), ch = Math.floor((rows - 1) / 2);
        const seen = new Uint8Array(cw * ch);
        const stack = [[0, Math.floor(ch / 2)]];
        seen[stack[0][1] * cw] = 1;
        cost[(stack[0][1] * 2 + 1) * cols + 1] = 1;
        while (stack.length) {
          const [cx, cy] = stack[stack.length - 1];
          const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => {
            const nx = cx + dx, ny = cy + dy;
            return nx >= 0 && ny >= 0 && nx < cw && ny < ch && !seen[ny * cw + nx];
          });
          if (!nb.length) { stack.pop(); continue; }
          const [dx, dy] = rng.pick(nb);
          const nx = cx + dx, ny = cy + dy;
          seen[ny * cw + nx] = 1;
          cost[(cy * 2 + 1 + dy) * cols + cx * 2 + 1 + dx] = 1;
          cost[(ny * 2 + 1) * cols + nx * 2 + 1] = 1;
          stack.push([nx, ny]);
        }
        // 고리 몇 개 추가 (경로 선택지)
        for (let i = 0; i < N / 25; i++) {
          const x = rng.int(1, cols - 2), y = rng.int(1, rows - 2);
          if (cost[y * cols + x] === 0 && ((cost[y * cols + x - 1] && cost[y * cols + x + 1]) || (cost[(y - 1) * cols + x] && cost[(y + 1) * cols + x]))) cost[y * cols + x] = 1;
        }
        start = { x: 1, y: Math.floor(ch / 2) * 2 + 1 };
        goal = { x: (cw - 1) * 2 + 1, y: Math.floor(ch / 2) * 2 + 1 };
      }
      if (kind === 'rooms') {
        const xs = [], ys = [];
        for (let x = Math.round(cols / 4); x < cols - 2; x += Math.round(cols / 4)) xs.push(x);
        for (let y = Math.round(rows / 3); y < rows - 2; y += Math.round(rows / 3)) ys.push(y);
        for (const x of xs) for (let y = 0; y < rows; y++) wall(x, y);
        for (const y of ys) for (let x = 0; x < cols; x++) wall(x, y);
        const yb = [0, ...ys, rows], xb = [0, ...xs, cols];
        for (const x of xs) for (let i = 0; i < yb.length - 1; i++) if (rng.chance(0.8)) { const y = rng.int(yb[i] + 1, yb[i + 1] - 2); cost[y * cols + x] = 1; cost[(y + 1) * cols + x] = 1; }
        for (const y of ys) for (let i = 0; i < xb.length - 1; i++) if (rng.chance(0.6)) { const x = rng.int(xb[i] + 1, xb[i + 1] - 2); cost[y * cols + x] = 1; cost[y * cols + x + 1] = 1; }
        start = { x: 2, y: 2 }; goal = { x: cols - 3, y: rows - 3 };
      }
      if (P.mud) {
        const nz = U.noise(ctx.seed * 13 + 5);
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          if (cost[i] && nz.fbm2(x * 0.09, y * 0.09, { octaves: 3 }) > 0.18) cost[i] = 5;
        }
      }
      for (const p of [start, goal]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const x = p.x + dx, y = p.y + dy;
        if (x >= 0 && y >= 0 && x < cols && y < rows && cost[y * cols + x] === 0 && kind !== 'maze') cost[y * cols + x] = 1;
      }
      cost[start.y * cols + start.x] = 1; cost[goal.y * cols + goal.x] = 1;
    }

    // ── 이진 힙 (f, 동점 키 t) ──
    function Heap() {
      const id = [], f = [], t = [];
      const less = (i, j) => f[i] < f[j] - 1e-9 || (Math.abs(f[i] - f[j]) <= 1e-9 && t[i] < t[j]);
      const swap = (i, j) => { [id[i], id[j]] = [id[j], id[i]]; [f[i], f[j]] = [f[j], f[i]]; [t[i], t[j]] = [t[j], t[i]]; };
      return {
        get size() { return id.length; },
        push(n, fv, tv) {
          id.push(n); f.push(fv); t.push(tv);
          let i = id.length - 1;
          while (i > 0) { const p = (i - 1) >> 1; if (!less(i, p)) break; swap(i, p); i = p; }
        },
        pop() {
          const top = id[0], last = id.length - 1;
          swap(0, last); id.pop(); f.pop(); t.pop();
          let i = 0;
          for (;;) {
            const l = i * 2 + 1, r = l + 1; let m = i;
            if (l < id.length && less(l, m)) m = l;
            if (r < id.length && less(r, m)) m = r;
            if (m === i) break;
            swap(i, m); i = m;
          }
          return top;
        },
      };
    }

    const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    const passable = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && cost[y * cols + x] > 0;
    const cx0 = (i) => i % cols, cy0 = (i) => (i / cols) | 0;
    const dist = (a, b) => Math.hypot(cx0(a) - cx0(b), cy0(a) - cy0(b));
    let losChecks = 0, losLines = [];

    // 칸 중심 a에서 b까지 선분이 지나는 모든 칸이 통과 가능한가 (supercover 격자 순회)
    function los(a, b) {
      losChecks++;
      if (P.showLos && losLines.length < 4000) losLines.push(a, b);
      let x = cx0(a), y = cy0(a);
      const x1 = cx0(b), y1 = cy0(b);
      let dx = Math.abs(x1 - x), dy = Math.abs(y1 - y);
      const xi = x1 > x ? 1 : -1, yi = y1 > y ? 1 : -1;
      let n = 1 + dx + dy, err = dx - dy;
      dx *= 2; dy *= 2;
      for (; n > 0; n--) {
        if (!passable(x, y)) return false;
        if (err > 0) { x += xi; err -= dy; }
        else if (err < 0) { y += yi; err += dx; }
        else { // 정확히 모서리를 지남: 양쪽 칸이 모두 열려 있어야 함
          if (!passable(x + xi, y) || !passable(x, y + yi)) return false;
          x += xi; y += yi; err += dx - dy; n--;
        }
      }
      return true;
    }

    // A* (4/8방향) 또는 Theta*
    function search(kind) {
      const g = new Float64Array(N).fill(Infinity), parent = new Int32Array(N).fill(-1), st = new Uint8Array(N);
      const s = start.y * cols + start.x, gi = goal.y * cols + goal.x;
      const heap = Heap();
      const diag = kind !== 'grid4';
      const h = (i) => {
        const dx = Math.abs(cx0(i) - goal.x), dy = Math.abs(cy0(i) - goal.y);
        return kind === 'theta' ? Math.hypot(dx, dy) : diag ? Math.max(dx, dy) + (SQ2 - 1) * Math.min(dx, dy) : dx + dy;
      };
      g[s] = 0; heap.push(s, h(s), h(s)); st[s] = 1;
      let expanded = 0;
      while (heap.size) {
        const cur = heap.pop();
        if (st[cur] === 2) continue;
        st[cur] = 2; expanded++;
        if (cur === gi) break;
        const x = cx0(cur), y = cy0(cur);
        for (const [dx, dy] of diag ? DIRS8 : DIRS4) {
          const nx = x + dx, ny = y + dy;
          if (!passable(nx, ny)) continue;
          if (dx && dy && (!passable(x + dx, y) || !passable(x, y + dy))) continue;
          const n = ny * cols + nx;
          if (st[n] === 2) continue;
          let ng, par;
          const pp = parent[cur];
          if (kind === 'theta' && pp >= 0 && los(pp, n)) { ng = g[pp] + dist(pp, n); par = pp; }
          else { ng = g[cur] + (dx && dy ? SQ2 : 1); par = cur; }
          if (ng < g[n] - 1e-9) {
            g[n] = ng; parent[n] = par; st[n] = 1;
            heap.push(n, ng + h(n), h(n));
          }
        }
      }
      const out = [];
      if (st[gi] === 2) for (let i = gi; i >= 0; i = parent[i]) out.push(i);
      return { path: out.reverse(), expanded, st };
    }

    // 경로 위 점에서 보이는 가장 먼 점으로 건너뛰기
    function stringPull(p) {
      if (p.length < 3) return p.slice();
      const out = [p[0]];
      let i = 0;
      while (i < p.length - 1) {
        let j = p.length - 1;
        while (j > i + 1 && !los(p[i], p[j])) j--;
        out.push(p[j]); i = j;
      }
      return out;
    }

    let raw, final, explored, ms, agent, wait = 0, lastTurn = -1;
    function restart() {
      const kind = P.mode === 'pull' ? 'grid8' : P.mode;
      raw = kind === 'theta' ? search('grid8').path : null;
      losChecks = 0; losLines = [];
      const t0 = ctx.now();
      const r = search(kind);
      final = P.mode === 'pull' ? stringPull(r.path) : r.path;
      ms = ctx.now() - t0;
      if (!raw) raw = r.path;
      explored = r.st;
      agent = { seg: 0, x: start.x, y: start.y, heading: null, turn: 0, trail: [], done: false }; lastTurn = -1;
    }
    genMap();
    restart();

    // ── 화면 배치 & 렌더용 저해상도 버퍼 ──
    const img = ctx.createCanvas(cols, rows);
    const ig = img.getContext('2d');
    const idata = ig.createImageData(cols, rows);
    const layout = () => {
      const cs = Math.min(ctx.width / cols, ctx.height / rows);
      return { cs, ox: (ctx.width - cs * cols) / 2, oy: (ctx.height - cs * rows) / 2 };
    };
    const cellAt = (m) => {
      const L = layout();
      const x = Math.floor((m.x - L.ox) / L.cs), y = Math.floor((m.y - L.oy) / L.cs);
      return x >= 0 && y >= 0 && x < cols && y < rows ? { x, y } : null;
    };

    // ── 마우스 편집 ──
    let drag = null, paintVal = 0;
    function paint(c) {
      if (!c) return;
      if (drag === 'start' || drag === 'goal') {
        const t = drag === 'start' ? start : goal;
        if (cost[c.y * cols + c.x] > 0 && (t.x !== c.x || t.y !== c.y)) { t.x = c.x; t.y = c.y; restart(); }
        return;
      }
      if ((c.x === start.x && c.y === start.y) || (c.x === goal.x && c.y === goal.y)) return;
      const i = c.y * cols + c.x;
      if (cost[i] !== paintVal) { cost[i] = paintVal; restart(); }
    }

    const pathLen = (p) => { let s = 0; for (let k = 1; k < p.length; k++) s += dist(p[k - 1], p[k]); return s; };
    const sideCol = U.hexToRgb(ctx.side === 'a' ? C.a : C.b);

    return {
      update(dt) {
        const A = agent;
        if (final.length < 2) return;
        if (A.done) { wait += dt; if (wait > 1.2) { wait = 0; lastTurn = A.turn; agent = { seg: 0, x: start.x, y: start.y, heading: null, turn: 0, trail: [], done: false }; } return; }
        let move = P.agentSpeed * dt;
        while (move > 0 && !A.done) {
          const b = final[A.seg + 1];
          const tx = cx0(b), ty = cy0(b);
          const dx = tx - A.x, dy = ty - A.y, d = Math.hypot(dx, dy);
          if (d > 1e-6) {
            const hd = Math.atan2(dy, dx);
            if (A.heading !== null) A.turn += Math.abs(U.angleDiff(A.heading, hd));
            A.heading = hd;
          }
          if (d <= move) { A.x = tx; A.y = ty; move -= d; A.seg++; if (A.seg >= final.length - 1) A.done = true; }
          else { A.x += (dx / d) * move; A.y += (dy / d) * move; move = 0; }
        }
        A.trail.push({ x: A.x, y: A.y });
        if (A.trail.length > 400) A.trail.shift();
      },
      onParam(key) { if (key === 'mode' || key === 'showLos') restart(); },
      onAction(key) {
        if (key === 'clear') { for (let i = 0; i < N; i++) if (cost[i] === 0) cost[i] = 1; }
        restart();
      },
      onPointer(type, m) {
        const c = cellAt(m);
        if (type === 'down') {
          if (!c) return;
          if (c.x === start.x && c.y === start.y) drag = 'start';
          else if (c.x === goal.x && c.y === goal.y) drag = 'goal';
          else { drag = 'paint'; paintVal = m.button === 2 || cost[c.y * cols + c.x] === 0 ? 1 : 0; }
          paint(c);
        } else if (type === 'move' && drag && m.down) paint(c);
        else if (type === 'up' || type === 'leave') drag = null;
      },
      render() {
        const g = ctx.g, L = layout(), cs = L.cs, d = idata.data;
        for (let i = 0; i < N; i++) {
          const k = i * 4;
          let r = 30, gg = 34, b = 41;
          if (cost[i] === 0) { r = 70; gg = 78; b = 94; }
          else if (explored[i]) { r = U.lerp(r, sideCol[0], 0.14); gg = U.lerp(gg, sideCol[1], 0.14); b = U.lerp(b, sideCol[2], 0.14); }
          d[k] = r; d[k + 1] = gg; d[k + 2] = b; d[k + 3] = 255;
        }
        ig.putImageData(idata, 0, 0);
        g.imageSmoothingEnabled = false;
        g.drawImage(img, L.ox, L.oy, cs * cols, cs * rows);
        g.imageSmoothingEnabled = true;
        if (cs >= 9) D.grid(g, cs * cols, cs * rows, cs, 'rgba(0,0,0,0.25)', L.ox, L.oy);
        const px = (x) => L.ox + (x + 0.5) * cs, py = (y) => L.oy + (y + 0.5) * cs;
        const toPts = (p) => p.map((i) => ({ x: px(cx0(i)), y: py(cy0(i)) }));
        const col = ctx.side === 'a' ? C.a : C.b;
        if (P.showLos) {
          g.globalAlpha = 0.12;
          for (let k = 0; k < losLines.length; k += 2) D.line(g, px(cx0(losLines[k])), py(cy0(losLines[k])), px(cx0(losLines[k + 1])), py(cy0(losLines[k + 1])), C.warn, 1);
          g.globalAlpha = 1;
        }
        if (P.showRaw && final !== raw && raw.length) {
          g.setLineDash([4, 4]);
          D.poly(g, toPts(raw), null, 'rgba(255,255,255,0.45)', 1.5, false);
          g.setLineDash([]);
        }
        if (final.length) {
          const pts = toPts(final);
          D.poly(g, pts, null, 'rgba(0,0,0,0.55)', Math.max(4, cs * 0.35), false);
          D.poly(g, pts, null, col, Math.max(2, cs * 0.16), false);
          for (const p of pts) D.circle(g, p.x, p.y, Math.max(2, cs * 0.16), '#fff');
        }
        // 에이전트와 궤적
        const A = agent;
        if (A.trail.length > 1) D.poly(g, A.trail.map((p) => ({ x: px(p.x), y: py(p.y) })), null, 'rgba(255,255,255,0.25)', 1, false);
        const ar = Math.max(5, cs * 0.5);
        D.circle(g, px(A.x), py(A.y), ar, '#fff', '#000', 1.5);
        if (A.heading !== null) D.arrow(g, px(A.x), py(A.y), px(A.x) + Math.cos(A.heading) * ar * 2, py(A.y) + Math.sin(A.heading) * ar * 2, '#fff', 2, 6);
        const rr = Math.max(4, cs * 0.4);
        D.circle(g, px(start.x), py(start.y), rr, C.good, '#000', 1.5);
        D.circle(g, px(goal.x), py(goal.y), rr, C.bad, '#000', 1.5);

        ctx.stat(GTL.L('경로 길이', 'Path length'), final.length ? pathLen(final).toFixed(2) + GTL.L(' 칸', ' cells') : GTL.L('경로 없음', 'No path'));
        ctx.stat(GTL.L('경유점 수', 'Waypoints'), final.length);
        ctx.stat(GTL.L('총 회전각 (에이전트)', 'Total turn angle (agent)'), U.deg(A.done || lastTurn < 0 ? A.turn : lastTurn).toFixed(0) + '°');
        ctx.stat(GTL.L('LOS 검사', 'LOS checks'), losChecks);
        ctx.stat(GTL.L('계산 시간', 'Compute time'), ms.toFixed(2) + ' ms');
      },
    };
  },
});
