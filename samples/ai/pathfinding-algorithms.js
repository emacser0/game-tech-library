// 길찾기 알고리즘 비교: BFS / Dijkstra / Greedy Best-First / A*
GTL.register({
  id: 'pathfinding-algorithms',
  title: '길찾기 알고리즘: BFS, Dijkstra, Greedy, A*',
  summary: '같은 맵에서 네 가지 탐색 알고리즘이 칸을 어떤 순서로 살피는지 한 단계씩 비교. A*는 최단 경로(Dijkstra의 장점)와 목표 방향 탐색(Greedy의 장점)을 함께 얻음.',
  views: { a: 'Dijkstra', b: 'A*' },
  controls: '드래그: 벽 칠하기/지우기, S/G 원 드래그: 시작/목표 이동, 우클릭 드래그: 지우기',
  info: `
    <p>격자 길찾기는 <b>그래프 탐색</b>의 한 종류. 칸 하나가 노드(node), 이웃 칸으로 가는 이동이 간선(edge)임.</p>
    <p>네 알고리즘의 차이는 한 가지뿐임. <b>열린 목록(frontier, 다음에 살필 후보 칸)에서 어떤 칸을 먼저 꺼내는지</b>가 다름.</p>
    <ul>
      <li><b>BFS</b>: 먼저 들어온 칸부터 꺼냄(FIFO). 이동 비용을 무시. 그래서 진흙(비용 5)을 그대로 지나는 "칸 수 최소" 경로가 나옴.</li>
      <li><b>Dijkstra</b>: 누적 비용 <code>g</code>가 가장 작은 칸부터 꺼냄. 항상 최소 비용 경로를 찾음. 단, 목표 방향을 모르므로 원형으로 퍼짐.</li>
      <li><b>Greedy Best-First</b>: 휴리스틱 <code>h</code>(목표까지 추정 거리)만 봄. 탐색량은 가장 적음. 단, 장애물 뒤 함정에 빠지고 최적 경로를 보장하지 못함.</li>
      <li><b>A*</b>: <code>f = g + h</code>로 고름. h가 실제 비용보다 크지 않으면(admissible) 최적 경로를 보장. 탐색도 목표 쪽으로 몰림.</li>
    </ul>
    <p>색 읽는 법:</p>
    <ul>
      <li>어두운 칸: 닫힌 목록(확장 완료)</li>
      <li>밝은 칸: 열린 목록</li>
      <li>흰 테두리: 방금 꺼낸 칸</li>
    </ul>`,
  diagram: (L) => `<svg viewBox="0 0 540 180" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="16" class="t-small t-dim">${L('g: 지금까지 비용, h: 목표까지 추정', 'g: cost so far, h: estimate to goal')}</text>
    <ellipse cx="150" cy="110" rx="95" ry="24" class="d-b"/>
    <circle cx="70" cy="110" r="46" class="d-a" stroke-dasharray="5 3"/>
    <line x1="70" y1="110" x2="150" y2="44" class="d-line"/>
    <line x1="150" y1="44" x2="240" y2="110" class="d-dim" stroke-dasharray="4 3"/>
    <circle cx="70" cy="110" r="5" class="f-accent"/><text x="66" y="100">S</text>
    <circle cx="240" cy="110" r="5" class="f-accent"/><text x="248" y="114">G</text>
    <circle cx="150" cy="44" r="4" class="f-dim"/><text x="157" y="40">n</text>
    <text x="98" y="72" class="t-mono">g</text><text x="200" y="72" class="t-mono">h</text>
    <text x="70" y="172" text-anchor="middle" class="t-small t-a">${L('Dijkstra 탐색 범위', 'Dijkstra search area')}</text>
    <text x="200" y="172" text-anchor="middle" class="t-small t-b">${L('A* 탐색 범위', 'A* search area')}</text>
    <text x="290" y="24">${L('열린 목록에서 먼저 꺼내는 칸', 'Which cell leaves the open list first')}</text>
    <line x1="290" y1="32" x2="530" y2="32" class="d-dim"/>
    <text x="294" y="54">BFS</text><text x="380" y="54">${L('먼저 들어온 칸 (FIFO)', 'earliest added (FIFO)')}</text>
    <text x="294" y="80" class="t-a">Dijkstra</text><text x="380" y="80" class="t-a">${L('가장 작은 g', 'smallest g')}</text>
    <text x="294" y="106">Greedy</text><text x="380" y="106">${L('가장 작은 h', 'smallest h')}</text>
    <text x="294" y="132" class="t-b">A*</text><text x="380" y="132" class="t-b">${L('가장 작은 g + h', 'smallest g + h')}</text>
    <line x1="290" y1="142" x2="530" y2="142" class="d-dim"/>
    <text x="290" y="166" class="t-small t-dim">${L('h가 실제 비용 이하면 A*도 최적 경로 보장', 'If h never overestimates, A* stays optimal')}</text>
  </svg>`,
  look: [
    '기본 맵을 그대로 실행하면 A(Dijkstra)는 원형으로 퍼지고 B(A*)는 목표 쪽으로 좁게 뻗음. 두 경로의 비용은 같음.',
    'B를 Greedy로 바꾸면 확장 노드 수는 더 줄어듦. 대신 U자 함정 안에 먼저 들어갔다 돌아 나오고, 경로 비용이 커짐.',
    'A를 BFS로 바꾸면 진흙(갈색)을 가로지르는 경로가 나옴. "경로 비용"이 Dijkstra보다 커짐.',
    '미러 입력을 켜고 마우스로 벽을 그리면 두 뷰가 동시에 다시 탐색. 속도를 "즉시"로 두면 결과만 바로 보임.',
  ],
  refs: [
    { type: 'paper', title: 'A Formal Basis for the Heuristic Determination of Minimum Cost Paths', year: 1968, note: 'Hart, Nilsson, Raphael. IEEE Trans. on Systems Science and Cybernetics. A* 원논문.', url: 'https://doi.org/10.1109/TSSC.1968.300136' },
    { type: 'paper', title: 'A Note on Two Problems in Connexion with Graphs', year: 1959, note: 'E. W. Dijkstra. Numerische Mathematik 1.', url: 'https://doi.org/10.1007/BF01386390' },
    { type: 'article', title: 'Introduction to the A* Algorithm (Red Blob Games)', url: 'https://www.redblobgames.com/pathfinding/a-star/introduction.html', year: 2014, note: 'Amit Patel. BFS, Dijkstra, Greedy, A*를 같은 방식으로 시각화한 글.' },
    { type: 'article', title: "Amit's A* Pages", url: 'http://theory.stanford.edu/~amitp/GameProgramming/', note: '게임용 A* 휴리스틱과 구현 팁 모음' },
  ],
  params: [
    { key: 'algo', label: '알고리즘', type: 'select', group: '탐색', options: [
      { value: 'bfs', label: 'BFS (너비 우선)' },
      { value: 'dijkstra', label: 'Dijkstra' },
      { value: 'greedy', label: 'Greedy Best-First' },
      { value: 'astar', label: 'A*' },
    ], a: 'dijkstra', b: 'astar' },
    { key: 'diag', label: '대각선 이동', type: 'bool', default: true, help: '8방향 (모서리 가로지르기 금지)' },
    { key: 'speed', label: '애니메이션 속도', type: 'select', shared: true, options: [
      { value: 30, label: '30 노드/s' }, { value: 120, label: '120 노드/s' }, { value: 400, label: '400 노드/s' },
      { value: 1500, label: '1500 노드/s' }, { value: 0, label: '즉시' },
    ], default: 120 },
    { key: 'viz', label: '색 표시', type: 'select', shared: true, options: [
      { value: 'state', label: '열린/닫힌 목록' }, { value: 'g', label: '누적 비용 g' },
    ], default: 'state' },
    { key: 'map', label: '맵', type: 'select', group: '장면', shared: true, reset: true, options: [
      { value: 'trap', label: 'U자 함정 + 장애물' }, { value: 'scatter', label: '흩어진 장애물' },
      { value: 'maze', label: '미로' }, { value: 'rooms', label: '방과 문' }, { value: 'empty', label: '빈 맵' },
    ], default: 'trap' },
    { key: 'mud', label: '진흙 지형 (비용 5)', type: 'bool', default: true, shared: true, reset: true },
    { key: 'cols', label: '격자 가로 칸 수', type: 'int', min: 20, max: 100, default: 44, shared: true, reset: true },
    { key: 'restart', label: '다시 탐색', type: 'button' },
    { key: 'clear', label: '벽 모두 지우기', type: 'button' },
  ],
  en: {
    title: 'Pathfinding Algorithms: BFS, Dijkstra, Greedy, A*',
    summary: 'Compares, step by step, the order in which four search algorithms visit cells on the same map. A* gets both the shortest path (the strength of Dijkstra) and goal-directed search (the strength of Greedy).',
    views: { a: 'Dijkstra', b: 'A*' },
    controls: 'Drag: paint or erase walls. Drag the S/G circles: move start or goal. Right drag: erase.',
    info: `
    <p>Grid pathfinding is a kind of <b>graph search</b>. Each cell is a node, and each move to a neighbor cell is an edge.</p>
    <p>The four algorithms differ in only one thing: <b>which cell they take out of the open list (frontier, the cells to visit next) first</b>.</p>
    <ul>
      <li><b>BFS</b>: takes the cell that came in first (FIFO). It ignores move cost. So it finds the "fewest cells" path, even straight through mud (cost 5).</li>
      <li><b>Dijkstra</b>: takes the cell with the smallest total cost <code>g</code>. It always finds the lowest cost path. But it does not know where the goal is, so it spreads in a circle.</li>
      <li><b>Greedy Best-First</b>: looks only at the heuristic <code>h</code> (estimated distance to goal). It searches the fewest cells. But it falls into traps behind obstacles and does not guarantee the best path.</li>
      <li><b>A*</b>: picks by <code>f = g + h</code>. If h never exceeds the real cost (admissible), it guarantees the best path. Its search also leans toward the goal.</li>
    </ul>
    <p>How to read the colors:</p>
    <ul>
      <li>Dark cells: closed list (expanded)</li>
      <li>Bright cells: open list</li>
      <li>White outline: the cell just taken out</li>
    </ul>`,
    look: [
      'Run the default map. A (Dijkstra) spreads in a circle. B (A*) reaches toward the goal in a narrow band. Both paths cost the same.',
      'Switch B to Greedy. Expanded nodes drop further. But it first walks into the U-shaped trap, comes back out, and the path cost goes up.',
      'Switch A to BFS. The path cuts across the mud (brown). "Path cost" is higher than Dijkstra.',
      'Turn on mirror input and draw walls with the mouse. Both views search again at the same time. Set speed to "Instant" to see only the result.',
    ],
    refs: [
      'Hart, Nilsson, Raphael. IEEE Trans. on Systems Science and Cybernetics. The original A* paper.',
      'E. W. Dijkstra. Numerische Mathematik 1.',
      'Amit Patel. Visualizes BFS, Dijkstra, Greedy, and A* in the same way.',
      'A collection of A* heuristics and implementation tips for games.',
    ],
    params: {
      algo: { label: 'Algorithm', group: 'Search', options: { bfs: 'BFS (breadth first)' } },
      diag: { label: 'Diagonal moves', help: '8 directions (no corner cutting)' },
      speed: { label: 'Animation speed', options: { 30: '30 nodes/s', 120: '120 nodes/s', 400: '400 nodes/s', 1500: '1500 nodes/s', 0: 'Instant' } },
      viz: { label: 'Color mode', options: { state: 'Open/closed list', g: 'Total cost g' } },
      map: { label: 'Map', group: 'Scene', options: { trap: 'U trap + obstacles', scatter: 'Scattered obstacles', maze: 'Maze', rooms: 'Rooms and doors', empty: 'Empty map' } },
      mud: 'Mud terrain (cost 5)',
      cols: 'Grid columns',
      restart: 'Search again',
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

    function heuristic(i, diag) {
      const dx = Math.abs((i % cols) - goal.x), dy = Math.abs(((i / cols) | 0) - goal.y);
      return diag ? Math.max(dx, dy) + (SQ2 - 1) * Math.min(dx, dy) : dx + dy;
    }

    // 한 번에 노드 하나씩 확장하는 탐색기
    function createSearch(algo, diag) {
      const g = new Float64Array(N).fill(Infinity);
      const parent = new Int32Array(N).fill(-1);
      const st = new Uint8Array(N); // 1 열림, 2 닫힘
      const s = start.y * cols + start.x, gi = goal.y * cols + goal.x;
      const heap = Heap();
      const fifo = []; let head = 0;
      let counter = 0;
      const S = { g, parent, st, done: false, found: false, expanded: 0, maxOpen: 0, openCount: 1, last: -1 };
      g[s] = 0; st[s] = 1;
      const prio = (i) => algo === 'dijkstra' ? g[i] : algo === 'greedy' ? heuristic(i, diag) : g[i] + heuristic(i, diag);
      if (algo === 'bfs') fifo.push(s); else heap.push(s, prio(s), 0);
      const dirs = diag ? DIRS8 : DIRS4;
      S.step = () => {
        if (S.done) return;
        let cur = -1;
        if (algo === 'bfs') { if (head < fifo.length) cur = fifo[head++]; }
        else while (heap.size) { const n = heap.pop(); if (st[n] !== 2) { cur = n; break; } }
        if (cur < 0) { S.done = true; return; }
        st[cur] = 2; S.expanded++; S.openCount--; S.last = cur;
        if (cur === gi) { S.done = true; S.found = true; return; }
        const cx = cur % cols, cy = (cur / cols) | 0;
        for (const [dx, dy] of dirs) {
          const nx = cx + dx, ny = cy + dy;
          if (!passable(nx, ny)) continue;
          if (dx && dy && (!passable(cx + dx, cy) || !passable(cx, cy + dy))) continue;
          const n = ny * cols + nx;
          if (st[n] === 2) continue;
          const stepCost = (dx && dy ? SQ2 : 1) * cost[n];
          if (algo === 'bfs' || algo === 'greedy') {
            // BFS, Greedy: 처음 발견했을 때만 부모를 정함 (재방문 개선 없음)
            if (st[n] === 1) continue;
            if (algo === 'greedy') { g[n] = g[cur] + stepCost; parent[n] = cur; st[n] = 1; heap.push(n, prio(n), ++counter); S.openCount++; continue; }
            g[n] = g[cur] + stepCost; parent[n] = cur; st[n] = 1; fifo.push(n); S.openCount++;
          } else {
            const ng = g[cur] + stepCost;
            if (ng < g[n] - 1e-9) {
              if (st[n] !== 1) S.openCount++;
              g[n] = ng; parent[n] = cur; st[n] = 1;
              heap.push(n, prio(n), ++counter);
            }
          }
        }
        S.maxOpen = Math.max(S.maxOpen, S.openCount);
      };
      S.path = () => {
        const out = [];
        if (!S.found) return out;
        for (let i = gi; i >= 0; i = parent[i]) out.push(i);
        return out.reverse();
      };
      return S;
    }

    let search, path, acc, fullMs, maxG;
    function restart() {
      search = createSearch(P.algo, P.diag);
      path = null; acc = 0;
      // 애니메이션과 별개로 같은 탐색을 끝까지 돌려 순수 비용 측정
      const t0 = ctx.now();
      const tmp = createSearch(P.algo, P.diag);
      while (!tmp.done) tmp.step();
      fullMs = ctx.now() - t0;
      maxG = 1;
      for (let i = 0; i < N; i++) if (tmp.st[i] && isFinite(tmp.g[i])) maxG = Math.max(maxG, tmp.g[i]);
      if (P.speed === 0) { search = tmp; path = search.path(); }
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

    const sideCol = U.hexToRgb(ctx.side === 'a' ? C.a : C.b);
    return {
      update(dt) {
        if (search.done) { if (!path) path = search.path(); return; }
        acc += dt * P.speed;
        let n = Math.floor(acc); acc -= n;
        if (P.speed === 0) n = Infinity;
        while (n-- > 0 && !search.done) search.step();
        if (search.done) path = search.path();
      },
      onParam(key) { if (key === 'algo' || key === 'diag' || key === 'speed') restart(); },
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
        const g = ctx.g, L = layout(), cs = L.cs;
        const d = idata.data, S = search;
        for (let i = 0; i < N; i++) {
          const k = i * 4, c = cost[i];
          let r, gg, b;
          if (c === 0) { r = 70; gg = 78; b = 94; }
          else if (c > 1) { r = 70; gg = 52; b = 34; } else { r = 30; gg = 34; b = 41; }
          if (c && S.st[i]) {
            if (P.viz === 'g' && isFinite(S.g[i])) {
              const t = U.clamp(S.g[i] / maxG, 0, 1);
              const k2 = S.st[i] === 1 ? 0.95 : 0.6;
              r = U.lerp(r, U.lerp(80, 255, t), k2); gg = U.lerp(gg, U.lerp(200, 70, t), k2); b = U.lerp(b, U.lerp(255, 120, t), k2);
            } else {
              const a = S.st[i] === 1 ? 0.85 : 0.35;
              const base = S.st[i] === 1 ? [255, 255, 255] : sideCol;
              const mix = S.st[i] === 1 ? sideCol.map((v) => U.lerp(v, 255, 0.45)) : base;
              r = U.lerp(r, mix[0], a); gg = U.lerp(gg, mix[1], a); b = U.lerp(b, mix[2], a);
            }
          }
          d[k] = r; d[k + 1] = gg; d[k + 2] = b; d[k + 3] = 255;
        }
        ig.putImageData(idata, 0, 0);
        g.imageSmoothingEnabled = false;
        g.drawImage(img, L.ox, L.oy, cs * cols, cs * rows);
        g.imageSmoothingEnabled = true;
        if (cs >= 9) D.grid(g, cs * cols, cs * rows, cs, 'rgba(0,0,0,0.25)', L.ox, L.oy);
        const cx = (i) => L.ox + ((i % cols) + 0.5) * cs, cy = (i) => L.oy + (((i / cols) | 0) + 0.5) * cs;
        // 현재 노드에서 시작까지 임시 경로 (탐색 중)
        if (!S.done && S.last >= 0) {
          const pts = [];
          for (let i = S.last; i >= 0; i = S.parent[i]) pts.push({ x: cx(i), y: cy(i) });
          D.poly(g, pts, null, 'rgba(255,255,255,0.35)', 1.5, false);
          D.rect(g, L.ox + (S.last % cols) * cs, L.oy + ((S.last / cols) | 0) * cs, cs, cs, null, '#fff', 2);
        }
        if (path && path.length) {
          const pts = path.map((i) => ({ x: cx(i), y: cy(i) }));
          D.poly(g, pts, null, 'rgba(0,0,0,0.6)', Math.max(3, cs * 0.45), false);
          D.poly(g, pts, null, '#fff', Math.max(2, cs * 0.25), false);
        }
        const rr = Math.max(4, cs * 0.45);
        D.circle(g, L.ox + (start.x + 0.5) * cs, L.oy + (start.y + 0.5) * cs, rr, C.good, '#000', 1.5);
        D.circle(g, L.ox + (goal.x + 0.5) * cs, L.oy + (goal.y + 0.5) * cs, rr, C.bad, '#000', 1.5);
        if (cs >= 10) {
          D.text(g, 'S', L.ox + (start.x + 0.5) * cs, L.oy + (start.y + 0.5) * cs, { align: 'center', baseline: 'middle', color: '#000', size: Math.round(cs * 0.6) });
          D.text(g, 'G', L.ox + (goal.x + 0.5) * cs, L.oy + (goal.y + 0.5) * cs, { align: 'center', baseline: 'middle', color: '#000', size: Math.round(cs * 0.6) });
        }

        let pcost = 0;
        if (path) for (let k = 1; k < path.length; k++) {
          const a = path[k - 1], b = path[k];
          pcost += ((a % cols) !== (b % cols) && ((a / cols) | 0) !== ((b / cols) | 0) ? SQ2 : 1) * cost[b];
        }
        ctx.stat(GTL.L('확장 노드', 'Expanded nodes'), S.expanded);
        ctx.stat(GTL.L('열린 목록 최대', 'Max open list'), S.maxOpen);
        ctx.stat(GTL.L('경로 비용', 'Path cost'), path ? (path.length ? pcost.toFixed(1) : GTL.L('경로 없음', 'No path')) : GTL.L('탐색 중…', 'Searching…'));
        ctx.stat(GTL.L('경로 칸 수', 'Path cells'), path && path.length ? path.length : '-');
        ctx.stat(GTL.L('전체 탐색 시간', 'Full search time'), fullMs.toFixed(2) + ' ms');
      },
    };
  },
});
