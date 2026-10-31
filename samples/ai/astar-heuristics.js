// A* 휴리스틱 & 가중치 & 동점 처리
GTL.register({
  id: 'astar-heuristics',
  title: 'A* 휴리스틱, 가중치(ε), 동점 처리',
  summary: 'A*의 성능은 휴리스틱 h(목표까지 추정 거리)에 달려 있음. 거리 함수, 가중치 ε(f = g + ε×h), 동점(tie) 처리만 바꿔도 탐색량과 경로 품질이 크게 달라짐.',
  views: { a: 'A* (ε = 1)', b: '가중 A* (ε = 2)' },
  controls: '드래그: 벽 칠하기/지우기, S/G 원 드래그: 시작/목표 이동, 우클릭 드래그: 지우기',
  info: `
    <p><b>휴리스틱 선택</b>: 이동 규칙에 맞는 거리 함수를 써야 함.</p>
    <ul>
      <li>4방향 이동: Manhattan이 정확한 하한.</li>
      <li>8방향 이동(대각선 비용 √2): <b>Octile</b>이 정확한 하한.</li>
      <li>Euclidean: 항상 admissible(실제 비용보다 크지 않음). 단, 실제보다 작아서 더 많이 탐색함.</li>
      <li>h = 0: A*가 Dijkstra와 같아짐.</li>
      <li>8방향에 Manhattan: 실제 비용을 <b>과대평가</b>함. 빨라지지만 최적 경로를 보장하지 못함.</li>
    </ul>
    <p><b>가중 A*</b>: <code>f = g + ε×h</code>. ε &gt; 1이면 Greedy 쪽으로 기울어 탐색량이 크게 줄어듦. 경로 비용은 최적의 ε배 이내로 보장됨(bounded suboptimal).</p>
    <p><b>동점 처리</b>: 장애물 없는 넓은 영역에는 f가 같은 노드가 많이 생김. 먼저 넣은 노드부터 꺼내면(FIFO) 같은 f 띠 전체를 훑음.
    <b>h가 작은(목표에 가까운) 노드를 먼저</b> 꺼내면 거의 일직선으로 나아감.</p>
    <p>"최적 대비"는 같은 맵에서 Dijkstra로 구한 최소 비용과 비교한 값.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 190" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="18" class="t-small t-dim">${L('n에서 G까지 거리 (dx 4, dy 2)', 'Distance from n to G (dx 4, dy 2)')}</text>
    ${[40, 72, 104, 136, 168].map((x) => `<line x1="${x}" y1="56" x2="${x}" y2="120" class="d-dim"/>`).join('')}
    ${[56, 88, 120].map((y) => `<line x1="40" y1="${y}" x2="168" y2="${y}" class="d-dim"/>`).join('')}
    <path d="M40,120 L168,120 L168,56" class="d-line" stroke-dasharray="5 3"/>
    <path d="M40,120 L104,56 L168,56" class="d-accent"/>
    <line x1="40" y1="120" x2="168" y2="56" class="d-line"/>
    <circle cx="40" cy="120" r="4" class="f-dim"/><text x="27" y="124">n</text>
    <circle cx="168" cy="56" r="4" class="f-accent"/><text x="174" y="50">G</text>
    <line x1="186" y1="74" x2="202" y2="74" class="d-line" stroke-dasharray="5 3"/><text x="206" y="78" class="t-small t-mono">Manhattan 6</text>
    <line x1="186" y1="92" x2="202" y2="92" class="d-accent"/><text x="206" y="96" class="t-small t-mono">Octile 4.83</text>
    <line x1="186" y1="110" x2="202" y2="110" class="d-line"/><text x="206" y="114" class="t-small t-mono">Euclidean 4.47</text>
    <text x="10" y="150" class="t-small">${L('8방향, 장애물 없을 때 실제 비용은 Octile', 'Octile is the true 8-way cost with no walls')}</text>
    <text x="10" y="164" class="t-small t-dim">${L('Manhattan은 과대평가, Euclidean은 과소평가', 'Manhattan overestimates, Euclidean underestimates')}</text>
    <text x="300" y="18">${L('f = g + ε×h가 작은 노드부터 꺼냄', 'Smallest f = g + ε×h comes out first')}</text>
    <text x="300" y="40" class="t-a">${L('ε = 1: P 먼저', 'ε = 1: P first')}</text>
    <text x="316" y="56">P</text><rect x="330" y="46" width="18" height="12" class="f-dim"/><rect x="348" y="46" width="42" height="12" class="f-a"/><text x="396" y="56" class="t-small t-mono">f = 10</text>
    <text x="316" y="72">Q</text><rect x="330" y="62" width="42" height="12" class="f-dim"/><rect x="372" y="62" width="24" height="12" class="f-a"/><text x="402" y="72" class="t-small t-mono">f = 11</text>
    <text x="300" y="96" class="t-b">${L('ε = 2: Q 먼저', 'ε = 2: Q first')}</text>
    <text x="316" y="112">P</text><rect x="330" y="102" width="18" height="12" class="f-dim"/><rect x="348" y="102" width="84" height="12" class="f-b"/><text x="438" y="112" class="t-small t-mono">f = 17</text>
    <text x="316" y="128">Q</text><rect x="330" y="118" width="42" height="12" class="f-dim"/><rect x="372" y="118" width="48" height="12" class="f-b"/><text x="426" y="128" class="t-small t-mono">f = 15</text>
    <rect x="300" y="144" width="10" height="10" class="f-dim"/><text x="314" y="153" class="t-small">${L('g (지금까지 비용)', 'g (cost so far)')}</text>
    <rect x="420" y="144" width="10" height="10" class="f-a"/><rect x="432" y="144" width="10" height="10" class="f-b"/><text x="446" y="153" class="t-small">ε×h</text>
    <text x="300" y="170" class="t-small t-dim">P (g 3, h 7), Q (g 7, h 4)</text>
    <text x="300" y="184" class="t-small t-dim">${L('ε가 크면 목표에 가까운 Q가 앞섬', 'Larger ε favors Q, nearer the goal')}</text>
  </svg>`,
  look: [
    'B의 ε를 1, 1.5, 3 순으로 올리면 확장 노드 수는 줄고 "최적 대비 %"는 커짐.',
    '"빈 맵"에서 A의 동점 처리를 FIFO에서 "h 작은 노드 우선"으로 바꾸면 탐색 영역이 넓은 마름모에서 가는 선으로 줄어듦.',
    '대각선 이동을 켜고 휴리스틱을 Manhattan(과대평가)으로 바꾸면 빨라지지만 최적 대비가 100%를 넘을 수 있음. Octile과 비교해 볼 것.',
    '휴리스틱을 "0 (= Dijkstra)"로 바꾸면 A*가 Dijkstra와 똑같이 원형으로 퍼짐.',
  ],
  refs: [
    { type: 'paper', title: 'A Formal Basis for the Heuristic Determination of Minimum Cost Paths', year: 1968, note: 'Hart, Nilsson, Raphael. admissible 휴리스틱과 최적성 증명.', url: 'https://doi.org/10.1109/TSSC.1968.300136' },
    { type: 'paper', title: 'Heuristic search viewed as path finding in a graph', year: 1970, note: 'Ira Pohl. Artificial Intelligence 1(3-4). 가중 A*(weighted A*)의 기원.', url: 'https://doi.org/10.1016/0004-3702(70)90007-X' },
    { type: 'article', title: "Amit's A* Pages - Heuristics", url: 'http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html', note: 'Manhattan/Diagonal/Euclidean, 가중치, tie-breaking 설명.' },
    { type: 'article', title: 'Implementation of A* (Red Blob Games)', url: 'https://www.redblobgames.com/pathfinding/a-star/implementation.html', note: 'Amit Patel. 동점 처리와 경로 미관(ugly paths) 문제.' },
  ],
  params: [
    { key: 'heur', label: '휴리스틱 h', type: 'select', group: '탐색', options: [
      { value: 'octile', label: 'Octile (8방향 정확)' },
      { value: 'manhattan', label: 'Manhattan (|dx|+|dy|)' },
      { value: 'euclid', label: 'Euclidean' },
      { value: 'chebyshev', label: 'Chebyshev (max)' },
      { value: 'zero', label: '0 (= Dijkstra)' },
    ], default: 'octile' },
    { key: 'weight', label: '가중치 ε', type: 'range', min: 1, max: 5, step: 0.1, a: 1, b: 2, default: 1, help: 'f = g + ε×h. 1보다 크면 빠르지만 경로가 길어질 수 있음' },
    { key: 'tie', label: '동점 처리', type: 'select', options: [
      { value: 'fifo', label: '먼저 넣은 노드 (FIFO)' },
      { value: 'lowh', label: 'h 작은 노드 우선' },
      { value: 'lifo', label: '나중 넣은 노드 (LIFO)' },
    ], default: 'fifo' },
    { key: 'diag', label: '대각선 이동', type: 'bool', default: true, shared: true, help: '8방향 (모서리 가로지르기 금지)' },
    { key: 'speed', label: '애니메이션 속도', type: 'select', shared: true, options: [
      { value: 30, label: '30 노드/s' }, { value: 120, label: '120 노드/s' }, { value: 400, label: '400 노드/s' },
      { value: 1500, label: '1500 노드/s' }, { value: 0, label: '즉시' },
    ], default: 400 },
    { key: 'viz', label: '색 표시', type: 'select', shared: true, options: [
      { value: 'state', label: '열린/닫힌 목록' }, { value: 'g', label: '누적 비용 g' },
    ], default: 'state' },
    { key: 'map', label: '맵', type: 'select', group: '장면', shared: true, reset: true, options: [
      { value: 'scatter', label: '흩어진 장애물' }, { value: 'trap', label: 'U자 함정 + 장애물' },
      { value: 'maze', label: '미로' }, { value: 'rooms', label: '방과 문' }, { value: 'empty', label: '빈 맵' },
    ], default: 'scatter' },
    { key: 'mud', label: '진흙 지형 (비용 5)', type: 'bool', default: false, shared: true, reset: true },
    { key: 'cols', label: '격자 가로 칸 수', type: 'int', min: 20, max: 100, default: 60, shared: true, reset: true },
    { key: 'restart', label: '다시 탐색', type: 'button' },
    { key: 'clear', label: '벽 모두 지우기', type: 'button' },
  ],
  en: {
    title: 'A* Heuristics, Weight (ε), and Tie-Breaking',
    summary: 'A* performance depends on the heuristic h (estimated distance to goal). Changing only the distance function, the weight ε (f = g + ε×h), or tie handling makes a big difference in search effort and path quality.',
    views: { a: 'A* (ε = 1)', b: 'Weighted A* (ε = 2)' },
    controls: 'Drag: paint or erase walls. Drag the S/G circles: move start or goal. Right drag: erase.',
    info: `
    <p><b>Choosing a heuristic</b>: use a distance function that matches the movement rules.</p>
    <ul>
      <li>4-way movement: Manhattan is the exact lower bound.</li>
      <li>8-way movement (diagonal cost √2): <b>Octile</b> is the exact lower bound.</li>
      <li>Euclidean: always admissible (never more than the real cost). But it is lower than the real cost, so it searches more.</li>
      <li>h = 0: A* becomes the same as Dijkstra.</li>
      <li>Manhattan with 8-way movement: <b>overestimates</b> the real cost. It is faster but does not guarantee the best path.</li>
    </ul>
    <p><b>Weighted A*</b>: <code>f = g + ε×h</code>. With ε &gt; 1 it leans toward Greedy, and search effort drops a lot. The path cost is guaranteed to be within ε times the optimum (bounded suboptimal).</p>
    <p><b>Tie-breaking</b>: open areas with no obstacles have many nodes with the same f. If you take the earliest node first (FIFO), it sweeps the whole band of equal f.
    If you take <b>the node with smaller h (closer to the goal) first</b>, it moves in a near straight line.</p>
    <p>"Vs optimal" compares the cost with the minimum cost that Dijkstra finds on the same map.</p>`,
    look: [
      'Raise B\'s ε to 1, then 1.5, then 3. Expanded nodes drop, and "Vs optimal %" goes up.',
      'On the "Empty map", switch A\'s tie-breaking from FIFO to "Lower h first". The searched area shrinks from a wide diamond to a thin line.',
      'Turn on diagonal moves and switch the heuristic to Manhattan (overestimates). It gets faster, but vs optimal can go over 100%. Compare it with Octile.',
      'Switch the heuristic to "0 (= Dijkstra)". A* spreads in a circle, just like Dijkstra.',
    ],
    refs: [
      'Hart, Nilsson, Raphael. Admissible heuristics and the proof of optimality.',
      'Ira Pohl. Artificial Intelligence 1(3-4). The origin of weighted A*.',
      'Explains Manhattan, Diagonal, Euclidean, weights, and tie-breaking.',
      'Amit Patel. Tie-breaking and the ugly paths problem.',
    ],
    params: {
      heur: { label: 'Heuristic h', group: 'Search', options: { octile: 'Octile (exact for 8-way)' } },
      weight: { label: 'Weight ε', help: 'f = g + ε×h. Above 1 it is faster, but the path can get longer.' },
      tie: { label: 'Tie-breaking', options: { fifo: 'Earliest node (FIFO)', lowh: 'Lower h first', lifo: 'Latest node (LIFO)' } },
      diag: { label: 'Diagonal moves', help: '8 directions (no corner cutting)' },
      speed: { label: 'Animation speed', options: { 30: '30 nodes/s', 120: '120 nodes/s', 400: '400 nodes/s', 1500: '1500 nodes/s', 0: 'Instant' } },
      viz: { label: 'Color mode', options: { state: 'Open/closed list', g: 'Total cost g' } },
      map: { label: 'Map', group: 'Scene', options: { scatter: 'Scattered obstacles', trap: 'U trap + obstacles', maze: 'Maze', rooms: 'Rooms and doors', empty: 'Empty map' } },
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

    const HEUR = {
      octile: (dx, dy) => Math.max(dx, dy) + (SQ2 - 1) * Math.min(dx, dy),
      manhattan: (dx, dy) => dx + dy,
      euclid: (dx, dy) => Math.hypot(dx, dy),
      chebyshev: (dx, dy) => Math.max(dx, dy),
      zero: () => 0,
    };

    // 한 번에 노드 하나씩 확장하는 A* 탐색기 (o: { heur, weight, tie, diag })
    function createSearch(o) {
      const g = new Float64Array(N).fill(Infinity);
      const parent = new Int32Array(N).fill(-1);
      const st = new Uint8Array(N); // 1 열림, 2 닫힘
      const s = start.y * cols + start.x, gi = goal.y * cols + goal.x;
      const heap = Heap();
      const hf = HEUR[o.heur] || HEUR.octile;
      const h = (i) => hf(Math.abs((i % cols) - goal.x), Math.abs(((i / cols) | 0) - goal.y));
      let counter = 0;
      const tieKey = (i) => o.tie === 'lowh' ? h(i) : o.tie === 'lifo' ? -(++counter) : ++counter;
      const S = { g, parent, st, done: false, found: false, expanded: 0, maxOpen: 0, openCount: 1, last: -1, heapPushes: 1 };
      g[s] = 0; st[s] = 1;
      heap.push(s, o.weight * h(s), 0);
      const dirs = o.diag ? DIRS8 : DIRS4;
      S.step = () => {
        if (S.done) return;
        let cur = -1;
        while (heap.size) { const n = heap.pop(); if (st[n] !== 2) { cur = n; break; } }
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
          const ng = g[cur] + (dx && dy ? SQ2 : 1) * cost[n];
          if (ng < g[n] - 1e-9) {
            if (st[n] !== 1) S.openCount++;
            g[n] = ng; parent[n] = cur; st[n] = 1;
            heap.push(n, ng + o.weight * h(n), tieKey(n)); S.heapPushes++;
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

    let search, path, acc, fullMs, maxG, optimal;
    const opts = () => ({ heur: P.heur, weight: P.weight, tie: P.tie, diag: P.diag });
    function restart() {
      search = createSearch(opts());
      path = null; acc = 0;
      // 애니메이션과 별개로 같은 탐색을 끝까지 돌려 순수 비용 측정
      const t0 = ctx.now();
      const tmp = createSearch(opts());
      while (!tmp.done) tmp.step();
      fullMs = ctx.now() - t0;
      maxG = 1;
      for (let i = 0; i < N; i++) if (tmp.st[i] && isFinite(tmp.g[i])) maxG = Math.max(maxG, tmp.g[i]);
      // 기준값: Dijkstra 최소 비용
      const ref = createSearch({ heur: 'zero', weight: 1, tie: 'fifo', diag: P.diag });
      while (!ref.done) ref.step();
      optimal = ref.found ? ref.g[goal.y * cols + goal.x] : 0;
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
      onParam(key) { if (key !== 'viz') restart(); },
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
        ctx.stat(GTL.L('최적 대비', 'Vs optimal'), path && path.length && optimal ? ((pcost / optimal) * 100).toFixed(1) + ' %' : '-');
        ctx.stat(GTL.L('힙 push 수', 'Heap pushes'), S.heapPushes);
        ctx.stat(GTL.L('전체 탐색 시간', 'Full search time'), fullMs.toFixed(2) + ' ms');
      },
    };
  },
});
