// Jump Point Search vs A*
GTL.register({
  id: 'jump-point-search',
  title: 'Jump Point Search (JPS) vs A*',
  summary: '비용이 균일한 격자에는 비용이 같은 대칭 경로가 아주 많음. JPS는 직선과 대각선으로 "점프"하며 대칭 경로를 걸러 냄. 그 결과 열린 목록에 넣는 노드가 크게 줄어듦.',
  views: { a: 'A*', b: 'JPS' },
  controls: '드래그: 벽 칠하기/지우기, S/G 원 드래그: 시작/목표 이동, 우클릭 드래그: 지우기',
  info: `
    <p>8방향 균일 격자에는 <b>대칭 경로</b>가 많음. 대칭 경로는 대각선과 직선의 이동 순서만 다르고 비용은 같은 경로. A*는 이 경로들을 모두 열린 목록에 넣음.</p>
    <p><b>JPS</b>(Jump Point Search)는 진행 방향을 유지하며 칸을 스캔. 아래 두 곳에서만 멈추고, 그 칸(점프 포인트)만 힙에 넣음.</p>
    <ul>
      <li><b>강제 이웃(forced neighbor)</b>이 있는 칸: 장애물 때문에 다른 길로는 갈 수 없는 이웃이 생긴 곳</li>
      <li>목표 칸</li>
    </ul>
    <p>대각선으로 갈 때는 칸마다 수평, 수직 점프를 먼저 시도</p>
    <p>경로 비용은 A*와 같은 최적값. 대신 <b>힙 연산 수가 훨씬 적음</b>.</p>
    <p>단점:</p>
    <ul>
      <li>칸 스캔(점프 테스트)이 많아짐. 메모리 접근이 싼 격자에서만 유리.</li>
      <li>칸마다 비용이 다른 지형(가중치 격자)에는 그대로 쓸 수 없음</li>
    </ul>
    <p>이 구현은 <b>모서리 가로지르기를 금지</b>하는 변형. PathFinding.js의 JPFMoveDiagonallyIfNoObstacles와 같은 규칙.</p>
    <p>B 뷰 읽는 법: 원은 점프 포인트, 선은 부모에서 점프한 구간, 흐린 칸은 스캔한 칸</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 170" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="jpsA" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    <marker id="jpsB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="18">${L('A*: 이웃 칸을 모두 힙에 넣음', 'A*: pushes every neighbor to the heap')}</text>
    ${[0, 1, 2].map((r) => [0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => `<rect x="${20 + c * 24}" y="${34 + r * 24}" width="24" height="24" class="f-dim"/>`
      + (r === 1 && c === 0 ? '' : `<circle cx="${32 + c * 24}" cy="${46 + r * 24}" r="3.5" class="f-a"/>`)).join('')).join('')}
    <line x1="40" y1="70" x2="222" y2="70" class="d-a" marker-end="url(#jpsA)"/>
    <text x="32" y="74" text-anchor="middle">S</text>
    <text x="20" y="126" class="t-small t-a">${L('대칭 경로의 칸까지 모두 힙에 들어감', 'cells on symmetric paths enter the heap too')}</text>
    <text x="290" y="18">${L('JPS: 직선 스캔 후 점프 포인트만 힙에', 'JPS: scan, push only jump points')}</text>
    <text x="350" y="30" text-anchor="middle" class="t-small t-dim">${L('벽', 'wall')}</text>
    ${[1, 2, 3].map((c) => `<rect x="${290 + c * 24}" y="34" width="24" height="24" fill="currentColor" opacity="0.45"/>`).join('')}
    <rect x="387" y="35" width="22" height="22" class="d-accent" stroke-dasharray="3 2"/>
    <text x="416" y="50" class="t-small">${L('강제 이웃', 'forced neighbor')}</text>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => `<rect x="${290 + c * 24}" y="58" width="24" height="24" class="${c <= 4 ? 'f-dim' : 'd-dim'}"/>`).join('')}
    <text x="302" y="74" text-anchor="middle">S</text>
    <line x1="310" y1="70" x2="390" y2="70" class="d-b" marker-end="url(#jpsB)"/>
    <circle cx="398" cy="70" r="6" class="f-b"/>
    <text x="398" y="100" text-anchor="middle" class="t-small t-b">${L('점프 포인트 (힙에 넣음)', 'jump point (pushed)')}</text>
    <text x="290" y="126" class="t-small t-dim">${L('도중 칸은 스캔만 하고 힙에 넣지 않음', 'cells on the way are scanned, not pushed')}</text>
    <text x="10" y="158" class="t-small t-dim">${L('경로 비용은 같음. JPS는 힙 연산 대신 칸 스캔이 많아짐', 'Same path cost. JPS trades heap operations for cell scans')}</text>
  </svg>`,
  look: [
    '"확장 노드"와 "힙 push"를 비교하면 JPS 쪽이 훨씬 적음. JPS의 열린 목록은 점프 포인트 몇 개뿐임.',
    '"스캔한 칸"을 보면 JPS는 확장은 적은 대신 직선 스캔이 많음. 맵을 "미로"로 바꾸면 이점이 줄어듦.',
    '맵을 "빈 맵"이나 "방과 문"으로 바꾸면 차이가 가장 커짐. 격자를 120칸으로 키우면 "전체 탐색 시간" 차이도 보임.',
    '어떤 맵에서도 두 뷰의 경로 비용은 같음(둘 다 최적). JPS 경로는 점프 포인트 사이를 직선으로 이음.',
  ],
  refs: [
    { type: 'paper', title: 'Online Graph Pruning for Pathfinding on Grid Maps', year: 2011, note: 'Daniel Harabor, Alban Grastien. AAAI-11. JPS 원논문.', url: 'https://ojs.aaai.org/index.php/AAAI/article/view/7994' },
    { type: 'paper', title: 'Improving Jump Point Search', year: 2014, note: 'Harabor & Grastien. ICAPS 2014. 블록 단위 스캔, 전처리(JPS+) 등.' },
    { type: 'talk', title: 'JPS+: Over 100x Faster than A*', year: 2015, note: 'Steve Rabin, GDC 2015 AI Summit.' },
    { type: 'code', title: 'PathFinding.js (Xueqiao Xu)', url: 'https://github.com/qiao/PathFinding.js', note: 'JPS 대각선 규칙 변형들의 공개 구현' },
  ],
  params: [
    { key: 'algo', label: '알고리즘', type: 'select', group: '탐색', options: [
      { value: 'astar', label: 'A* (Octile)' },
      { value: 'jps', label: 'Jump Point Search' },
    ], a: 'astar', b: 'jps' },
    { key: 'showScan', label: '스캔한 칸 표시', type: 'bool', default: true, when: (p) => p.algo === 'jps' },
    { key: 'speed', label: '애니메이션 속도', type: 'select', shared: true, options: [
      { value: 5, label: '5 노드/s' }, { value: 20, label: '20 노드/s' }, { value: 80, label: '80 노드/s' },
      { value: 400, label: '400 노드/s' }, { value: 0, label: '즉시' },
    ], default: 20, help: '확장(힙 pop) 1회를 1 노드로 셈' },
    { key: 'map', label: '맵', type: 'select', group: '장면', shared: true, reset: true, options: [
      { value: 'scatter', label: '흩어진 장애물' }, { value: 'rooms', label: '방과 문' }, { value: 'trap', label: 'U자 함정 + 장애물' },
      { value: 'maze', label: '미로' }, { value: 'empty', label: '빈 맵' },
    ], default: 'scatter' },
    { key: 'cols', label: '격자 가로 칸 수', type: 'int', min: 20, max: 120, default: 64, shared: true, reset: true },
    { key: 'restart', label: '다시 탐색', type: 'button' },
    { key: 'clear', label: '벽 모두 지우기', type: 'button' },
  ],
  en: {
    title: 'Jump Point Search (JPS) vs A*',
    summary: 'A grid with uniform cost has a huge number of symmetric paths with the same cost. JPS "jumps" along straight and diagonal lines and filters out symmetric paths. As a result, far fewer nodes go into the open list.',
    views: { a: 'A*', b: 'JPS' },
    controls: 'Drag: paint or erase walls. Drag the S/G circles: move start or goal. Right drag: erase.',
    info: `
    <p>An 8-way uniform grid has many <b>symmetric paths</b>. Symmetric paths differ only in the order of diagonal and straight moves, and have the same cost. A* puts all of them into the open list.</p>
    <p><b>JPS</b> (Jump Point Search) scans cells while keeping its direction. It stops only at the two places below, and only those cells (jump points) go into the heap.</p>
    <ul>
      <li>A cell with a <b>forced neighbor</b>: a place where an obstacle creates a neighbor that no other route can reach</li>
      <li>The goal cell</li>
    </ul>
    <p>When moving diagonally, it first tries a horizontal and a vertical jump at each cell.</p>
    <p>The path cost is the same optimum as A*. But it uses <b>far fewer heap operations</b>.</p>
    <p>Downsides:</p>
    <ul>
      <li>It scans more cells (jump tests). It only wins on grids where memory access is cheap.</li>
      <li>You cannot use it as is on terrain where each cell has a different cost (weighted grids).</li>
    </ul>
    <p>This implementation is the variant that <b>forbids corner cutting</b>. It uses the same rule as JPFMoveDiagonallyIfNoObstacles in PathFinding.js.</p>
    <p>How to read view B: circles are jump points, lines are jumps from the parent, and faint cells are scanned cells.</p>`,
    look: [
      'Compare "Expanded nodes" and "Heap pushes". JPS has far fewer. The JPS open list holds only a few jump points.',
      'Look at "Scanned cells". JPS expands less but does many straight scans. Switch the map to "Maze" and the advantage shrinks.',
      'Switch the map to "Empty map" or "Rooms and doors" for the biggest difference. Raise the grid to 120 cells to also see a gap in "Full search time".',
      'On any map, both views have the same path cost (both optimal). The JPS path joins jump points with straight lines.',
    ],
    refs: [
      'Daniel Harabor, Alban Grastien. AAAI-11. The original JPS paper.',
      'Harabor & Grastien. ICAPS 2014. Block-based scanning, preprocessing (JPS+), and more.',
      'Steve Rabin, GDC 2015 AI Summit.',
      'An open implementation of several JPS diagonal rule variants.',
    ],
    params: {
      algo: { label: 'Algorithm', group: 'Search' },
      showScan: 'Show scanned cells',
      speed: { label: 'Animation speed', help: 'One expansion (heap pop) counts as one node', options: { 5: '5 nodes/s', 20: '20 nodes/s', 80: '80 nodes/s', 400: '400 nodes/s', 0: 'Instant' } },
      map: { label: 'Map', group: 'Scene', options: { scatter: 'Scattered obstacles', rooms: 'Rooms and doors', trap: 'U trap + obstacles', maze: 'Maze', empty: 'Empty map' } },
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
    const octile = (a, b) => {
      const dx = Math.abs((a % cols) - (b % cols)), dy = Math.abs(((a / cols) | 0) - ((b / cols) | 0));
      return Math.max(dx, dy) + (SQ2 - 1) * Math.min(dx, dy);
    };

    // A*/JPS 공용 탐색기. step() 1회 = 힙에서 노드 하나 확장
    function createSearch(algo) {
      const g = new Float64Array(N).fill(Infinity);
      const parent = new Int32Array(N).fill(-1);
      const st = new Uint8Array(N);   // 1 열림, 2 닫힘
      const scan = new Uint8Array(N); // JPS가 테스트한 칸
      const s = start.y * cols + start.x, gi = goal.y * cols + goal.x;
      const heap = Heap();
      const S = { g, parent, st, scan, done: false, found: false, expanded: 0, pushes: 1, scanned: 0, last: -1 };
      g[s] = 0; st[s] = 1;
      heap.push(s, octile(s, gi), octile(s, gi));
      const W = passable;

      // 점프: (px,py)에서 (x,y) 방향으로 진행하다 점프 포인트를 찾으면 인덱스, 없으면 -1
      function jump(x, y, px, py) {
        const dx = x - px, dy = y - py;
        for (;;) {
          if (!W(x, y)) return -1;
          const i = y * cols + x;
          scan[i] = 1; S.scanned++;
          if (i === gi) return i;
          if (dx && dy) {
            if (jump(x + dx, y, x, y) >= 0 || jump(x, y + dy, x, y) >= 0) return i;
          } else if (dx) {
            if ((W(x, y - 1) && !W(x - dx, y - 1)) || (W(x, y + 1) && !W(x - dx, y + 1))) return i;
          } else {
            if ((W(x - 1, y) && !W(x - 1, y - dy)) || (W(x + 1, y) && !W(x + 1, y - dy))) return i;
          }
          if (!(W(x + dx, y) && W(x, y + dy))) return -1; // 대각선은 양 옆이 모두 열려 있어야 진행
          x += dx; y += dy;
        }
      }
      // 부모 방향으로 가지치기한 이웃
      function prunedNeighbors(cur) {
        const x = cur % cols, y = (cur / cols) | 0, out = [];
        const p = parent[cur];
        if (p < 0) {
          for (const [dx, dy] of DIRS8) {
            if (!W(x + dx, y + dy)) continue;
            if (dx && dy && (!W(x + dx, y) || !W(x, y + dy))) continue;
            out.push([x + dx, y + dy]);
          }
          return out;
        }
        const px = p % cols, py = (p / cols) | 0;
        const dx = Math.sign(x - px), dy = Math.sign(y - py);
        if (dx && dy) {
          const wy = W(x, y + dy), wx = W(x + dx, y);
          if (wy) out.push([x, y + dy]);
          if (wx) out.push([x + dx, y]);
          if (wx && wy) out.push([x + dx, y + dy]);
        } else if (dx) {
          const nx = W(x + dx, y), up = W(x, y - 1), dn = W(x, y + 1);
          if (nx) { out.push([x + dx, y]); if (up) out.push([x + dx, y - 1]); if (dn) out.push([x + dx, y + 1]); }
          if (up) out.push([x, y - 1]);
          if (dn) out.push([x, y + 1]);
        } else {
          const ny = W(x, y + dy), l = W(x - 1, y), r = W(x + 1, y);
          if (ny) { out.push([x, y + dy]); if (l) out.push([x - 1, y + dy]); if (r) out.push([x + 1, y + dy]); }
          if (l) out.push([x - 1, y]);
          if (r) out.push([x + 1, y]);
        }
        return out;
      }

      const relax = (cur, n) => {
        if (st[n] === 2) return;
        const ng = g[cur] + octile(cur, n);
        if (ng < g[n] - 1e-9) {
          g[n] = ng; parent[n] = cur; st[n] = 1;
          const h = octile(n, gi);
          heap.push(n, ng + h, h); S.pushes++;
        }
      };

      S.step = () => {
        if (S.done) return;
        let cur = -1;
        while (heap.size) { const n = heap.pop(); if (st[n] !== 2) { cur = n; break; } }
        if (cur < 0) { S.done = true; return; }
        st[cur] = 2; S.expanded++; S.last = cur;
        if (cur === gi) { S.done = true; S.found = true; return; }
        const cx = cur % cols, cy = (cur / cols) | 0;
        if (algo === 'jps') {
          for (const [nx, ny] of prunedNeighbors(cur)) {
            const j = jump(nx, ny, cx, cy);
            if (j >= 0) relax(cur, j);
          }
        } else {
          for (const [dx, dy] of DIRS8) {
            const nx = cx + dx, ny = cy + dy;
            if (!W(nx, ny)) continue;
            if (dx && dy && (!W(cx + dx, cy) || !W(cx, cy + dy))) continue;
            S.scanned++;
            relax(cur, ny * cols + nx);
          }
        }
      };
      S.path = () => {
        const out = [];
        if (!S.found) return out;
        for (let i = gi; i >= 0; i = parent[i]) out.push(i);
        return out.reverse();
      };
      return S;
    }

    let search, path, acc, fullMs, openCount = 0;
    function restart() {
      search = createSearch(P.algo);
      path = null; acc = 0;
      const t0 = ctx.now();
      const tmp = createSearch(P.algo);
      while (!tmp.done) tmp.step();
      fullMs = ctx.now() - t0;
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
      onParam(key) { if (key !== 'showScan') restart(); },
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
        const d = idata.data, S = search, jps = P.algo === 'jps';
        openCount = 0;
        for (let i = 0; i < N; i++) {
          const k = i * 4, c = cost[i];
          let r = 30, gg = 34, b = 41;
          if (c === 0) { r = 70; gg = 78; b = 94; }
          else if (jps) {
            if (S.scan[i] && P.showScan) { r = U.lerp(r, sideCol[0], 0.2); gg = U.lerp(gg, sideCol[1], 0.2); b = U.lerp(b, sideCol[2], 0.2); }
          } else if (S.st[i]) {
            const a = S.st[i] === 1 ? 0.8 : 0.35;
            const mix = S.st[i] === 1 ? sideCol.map((v) => U.lerp(v, 255, 0.45)) : sideCol;
            r = U.lerp(r, mix[0], a); gg = U.lerp(gg, mix[1], a); b = U.lerp(b, mix[2], a);
          }
          if (S.st[i] === 1) openCount++;
          d[k] = r; d[k + 1] = gg; d[k + 2] = b; d[k + 3] = 255;
        }
        ig.putImageData(idata, 0, 0);
        g.imageSmoothingEnabled = false;
        g.drawImage(img, L.ox, L.oy, cs * cols, cs * rows);
        g.imageSmoothingEnabled = true;
        if (cs >= 9) D.grid(g, cs * cols, cs * rows, cs, 'rgba(0,0,0,0.25)', L.ox, L.oy);
        const cx = (i) => L.ox + ((i % cols) + 0.5) * cs, cy = (i) => L.oy + (((i / cols) | 0) + 0.5) * cs;
        const col = ctx.side === 'a' ? C.a : C.b;
        if (jps) {
          // 점프 구간과 점프 포인트
          g.globalAlpha = 0.7;
          for (let i = 0; i < N; i++) if (S.st[i] && S.parent[i] >= 0) D.line(g, cx(S.parent[i]), cy(S.parent[i]), cx(i), cy(i), col, 1);
          g.globalAlpha = 1;
          for (let i = 0; i < N; i++) if (S.st[i]) D.circle(g, cx(i), cy(i), Math.max(2.5, cs * 0.35), S.st[i] === 1 ? '#fff' : col, '#000', 1);
        }
        if (!S.done && S.last >= 0) {
          const pts = [];
          for (let i = S.last; i >= 0; i = S.parent[i]) pts.push({ x: cx(i), y: cy(i) });
          D.poly(g, pts, null, 'rgba(255,255,255,0.4)', 1.5, false);
          D.rect(g, L.ox + (S.last % cols) * cs, L.oy + ((S.last / cols) | 0) * cs, cs, cs, null, '#fff', 2);
        }
        let pcost = 0;
        if (path && path.length) {
          const pts = path.map((i) => ({ x: cx(i), y: cy(i) }));
          D.poly(g, pts, null, 'rgba(0,0,0,0.6)', Math.max(3, cs * 0.45), false);
          D.poly(g, pts, null, '#fff', Math.max(2, cs * 0.22), false);
          for (let k = 1; k < path.length; k++) pcost += octile(path[k - 1], path[k]);
        }
        const rr = Math.max(4, cs * 0.45);
        D.circle(g, L.ox + (start.x + 0.5) * cs, L.oy + (start.y + 0.5) * cs, rr, C.good, '#000', 1.5);
        D.circle(g, L.ox + (goal.x + 0.5) * cs, L.oy + (goal.y + 0.5) * cs, rr, C.bad, '#000', 1.5);

        ctx.stat(GTL.L('확장 노드 (힙 pop)', 'Expanded nodes (heap pop)'), S.expanded);
        ctx.stat(GTL.L('힙 push', 'Heap pushes'), S.pushes);
        ctx.stat(GTL.L('열린 목록', 'Open list'), openCount);
        ctx.stat(GTL.L('스캔한 칸', 'Scanned cells'), S.scanned);
        ctx.stat(GTL.L('경로 비용', 'Path cost'), path ? (path.length ? pcost.toFixed(1) : GTL.L('경로 없음', 'No path')) : GTL.L('탐색 중…', 'Searching…'));
        ctx.stat(GTL.L('전체 탐색 시간', 'Full search time'), fullMs.toFixed(2) + ' ms');
      },
    };
  },
});
