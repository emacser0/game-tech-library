// 계층적 길찾기 HPA* vs A*
GTL.register({
  id: 'hpa-star',
  title: '계층적 길찾기: HPA* vs A*',
  summary: '방이 많은 큰 그리드에서 같은 출발점과 목표로 길을 찾아 비교. A*는 목표 쪽 넓은 영역을 셀 단위로 탐색. HPA*는 맵을 클러스터로 나누고 경계의 입구만 잇는 작은 추상 그래프를 미리 만들어 둠. 질의 때 탐색 노드가 크게 줄고, 경로는 최적보다 몇 % 길어짐.',
  views: { a: 'A* (셀 단위)', b: 'HPA* (클러스터 + 입구 그래프)' },
  controls: '마우스 클릭: 목표 지정 (출발점은 이전 목표). 클릭하지 않으면 2.5초마다 새 질의',
  info: `
    <p><b>HPA*</b>(Hierarchical Path-Finding A*, Botea, Müller, Schaeffer 2004): 그리드를 2단계로 나눠 탐색</p>
    <ol>
      <li><b>전처리</b>: 맵을 C×C 클러스터로 나눔. 이웃 클러스터 경계에서 양쪽이 모두 열린 구간을 <b>입구</b>로 찾음. 짧은 입구는 가운데 한 곳, 긴 입구(6칸 이상)는 양 끝 두 곳에 노드를 둠.</li>
      <li>클러스터 안 노드 쌍마다 클러스터 내부만 탐색해 거리를 구하고 간선으로 저장함(<b>내부 간선</b>). 경계를 건너는 쌍은 비용 1(<b>외부 간선</b>).</li>
      <li><b>질의</b>: 출발점과 목표를 자기 클러스터의 노드에 임시로 연결. 작은 추상 그래프에서 A*를 돌림.</li>
      <li><b>정제</b>: 추상 경로의 각 구간을 클러스터 안에서만 A*로 셀 경로로 바꿈. 첫 구간만 정제하면 바로 움직이기 시작할 수 있음.</li>
    </ol>
    <p>장점: 질의 비용이 맵 크기보다 추상 그래프 크기에 따라 정해짐. 큰 맵, 많은 유닛에 유리.</p>
    <p>단점:</p>
    <ul>
      <li>경로가 입구 노드를 지나야 해서 최적보다 조금 길어짐. 보통 스무딩으로 보완.</li>
      <li>맵이 바뀌면 해당 클러스터의 간선을 다시 계산해야 함</li>
      <li>클러스터가 작으면 추상 그래프가 커지고, 크면 삽입과 정제 비용이 커짐</li>
    </ul>`,
  diagram: (L) => `<svg viewBox="0 0 540 190" xmlns="http://www.w3.org/2000/svg">
    <text x="14" y="16">${L('클러스터, 입구 노드, 추상 그래프', 'Clusters, entrance nodes, abstract graph')}</text>
    <rect x="14" y="26" width="216" height="132" class="d-dim"/>
    <path d="M86,26 V46 M86,62 V120 M86,136 V158 M158,26 V36 M158,52 V130 M158,146 V158 M14,92 H36 M52,92 H110 M126,92 H190 M206,92 H230" class="d-line"/>
    ${[[80, 54, 44, 86], [92, 54, 152, 44], [92, 54, 118, 86], [152, 44, 118, 86], [164, 44, 198, 86], [44, 98, 80, 128], [92, 128, 118, 98], [92, 128, 152, 138], [118, 98, 152, 138], [164, 138, 198, 98]]
      .map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" class="d-dim" stroke-dasharray="3 3"/>`).join('')}
    <path d="M30,146 L44,98 L44,86 L80,54 L92,54 L152,44 L164,44 L210,44" class="d-b" style="stroke-width:3.5"/>
    ${[[80, 54], [92, 54], [80, 128], [92, 128], [152, 44], [164, 44], [152, 138], [164, 138], [44, 86], [44, 98], [118, 86], [118, 98], [198, 86], [198, 98]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" class="f-b"/>`).join('')}
    <circle cx="30" cy="146" r="4" class="f-accent"/><text x="36" y="154">S</text>
    <circle cx="210" cy="44" r="4" class="f-accent"/><text x="214" y="62">G</text>
    <circle cx="18" cy="175" r="3.5" class="f-b"/><text x="26" y="179" class="t-small">${L('입구 노드', 'entrance node')}</text>
    <line x1="104" y1="175" x2="120" y2="175" class="d-dim" stroke-dasharray="3 3"/><text x="124" y="179" class="t-small">${L('내부 간선', 'intra edge')}</text>
    <line x1="188" y1="175" x2="204" y2="175" class="d-b" style="stroke-width:3.5"/><text x="208" y="179" class="t-small">${L('추상 경로', 'abstract path')}</text>
    <text x="290" y="30">${L('1. 전처리: 경계의 입구 찾기', '1. Preprocess: find border entrances')}</text>
    <text x="290" y="52">${L('2. 클러스터 안 노드 쌍 거리 저장', '2. Store distances inside each cluster')}</text>
    <text x="290" y="74">${L('3. 질의: S, G 연결 후 추상 A*', '3. Query: link S and G, run abstract A*')}</text>
    <text x="290" y="96">${L('4. 정제: 구간마다 셀 경로로 변환', '4. Refine: each leg into a cell path')}</text>
    <line x1="290" y1="110" x2="530" y2="110" class="d-dim"/>
    <text x="290" y="130" class="t-a">${L('A*: 셀 단위로 넓게 탐색', 'A*: searches many cells one by one')}</text>
    <text x="290" y="150" class="t-b">${L('HPA*: 작은 추상 그래프만 탐색', 'HPA*: searches only the small graph')}</text>
    <text x="290" y="170" class="t-small t-dim">${L('대신 입구를 지나서 경로가 조금 길어짐', 'But paths through entrances are a bit longer')}</text>
  </svg>`,
  look: [
    '질의가 바뀔 때마다 "탐색 노드 수"를 비교. 멀리 가는 질의일수록 A*는 천~수천 개, HPA*는 수백 개 수준.',
    'B의 "최적 대비 경로 길이"는 보통 100~110 %. 입구 노드를 지나느라 생기는 우회임.',
    'B의 "클러스터 크기"를 6에서 16까지 바꿔 봄. 클러스터가 클수록 추상 그래프는 작아지지만 "삽입"과 "정제" 숫자가 커짐.',
    'B의 "첫 이동까지 탐색 노드"는 전체 탐색 노드보다 작음. 첫 구간만 정제하고 바로 출발할 수 있음.',
    '"벽 개수"를 0으로 하면 A*가 오히려 적게 탐색. 장애물이 적으면 휴리스틱이 정확해서 계층의 이득 없음.',
  ],
  refs: [
    { type: 'paper', title: 'Near Optimal Hierarchical Path-Finding', year: 2004, note: 'Adi Botea, Martin Müller, Jonathan Schaeffer. Journal of Game Development 1(1). HPA* 원 논문.' },
    { type: 'paper', title: 'Hierarchical A*: Searching Abstraction Hierarchies Efficiently', year: 1996, note: 'Robert Holte, M. B. Perez, R. M. Zimmer, A. J. MacDonald. AAAI 1996. 추상화 계층 탐색.' },
    { type: 'paper', title: 'Benchmarks for Grid-Based Pathfinding', url: 'https://movingai.com/benchmarks/', year: 2012, note: 'Nathan Sturtevant. IEEE TCIAIG. 게임 맵 기반 길찾기 벤치마크.' },
    { type: 'paper', title: 'A Formal Basis for the Heuristic Determination of Minimum Cost Paths', year: 1968, note: 'Hart, Nilsson, Raphael. A* 원 논문.' },
  ],
  params: [
    { key: 'algo', label: '알고리즘', type: 'select', group: '탐색', options: [
      { value: 'astar', label: 'A* (셀 단위)' },
      { value: 'hpa', label: 'HPA* (계층)' },
    ], a: 'astar', b: 'hpa' },
    { key: 'cluster', label: '클러스터 크기 (칸)', type: 'select', options: [
      { value: 6, label: '6' }, { value: 8, label: '8' }, { value: 10, label: '10' }, { value: 12, label: '12' }, { value: 16, label: '16' },
    ], default: 10, when: (p) => p.algo === 'hpa' },
    { key: 'showGraph', label: '추상 그래프 표시', type: 'bool', default: true, when: (p) => p.algo === 'hpa' },
    { key: 'interval', label: '자동 질의 간격 (s)', type: 'range', min: 0.5, max: 8, step: 0.5, default: 2.5, shared: true, group: '장면' },
    { key: 'walls', label: '벽 개수', type: 'int', min: 0, max: 24, default: 14, shared: true, reset: true },
  ],
  en: {
    title: 'Hierarchical Pathfinding: HPA* vs A*',
    summary: 'Finds paths with the same start and goal on a large grid with many rooms. A* searches a wide area toward the goal, cell by cell. HPA* splits the map into clusters and builds a small abstract graph ahead of time that links only the entrances on cluster borders. Queries search far fewer nodes, and paths are a few percent longer than optimal.',
    views: { a: 'A* (per cell)', b: 'HPA* (clusters + entrance graph)' },
    controls: 'Mouse click: set the goal (the start is the previous goal). Without clicks, a new query runs every 2.5 seconds.',
    info: `
    <p><b>HPA*</b> (Hierarchical Path-Finding A*, Botea, Müller, Schaeffer 2004): searches the grid in two levels.</p>
    <ol>
      <li><b>Preprocessing</b>: split the map into C×C clusters. On each border between neighbor clusters, find the spans open on both sides. These are <b>entrances</b>. A short entrance gets one node in the middle. A long entrance (6 cells or more) gets two nodes, one at each end.</li>
      <li>For each pair of nodes in a cluster, search only inside the cluster to get the distance, and store it as an edge (<b>intra edge</b>). Pairs across a border get cost 1 (<b>inter edge</b>).</li>
      <li><b>Query</b>: temporarily connect the start and goal to the nodes of their own clusters. Run A* on the small abstract graph.</li>
      <li><b>Refinement</b>: turn each segment of the abstract path into a cell path with A* limited to one cluster. Refining only the first segment lets the unit start moving right away.</li>
    </ol>
    <p>Upside: query cost depends on the size of the abstract graph, not the map. It helps with large maps and many units.</p>
    <p>Downsides:</p>
    <ul>
      <li>The path must pass through entrance nodes, so it is a bit longer than optimal. Smoothing usually fixes this.</li>
      <li>When the map changes, you must recompute the edges of that cluster.</li>
      <li>Small clusters make the abstract graph large. Large clusters make insertion and refinement costly.</li>
    </ul>`,
    look: [
      'Compare "Searched nodes" each time the query changes. For long queries, A* searches one to several thousand nodes. HPA* searches a few hundred.',
      'B\'s "Path length vs optimal" is usually 100~110 %. The detour comes from passing through entrance nodes.',
      'Change B\'s "Cluster size" from 6 up to 16. Larger clusters shrink the abstract graph, but the "insert" and "refine" numbers grow.',
      'B\'s "Nodes until first move" is smaller than the total searched nodes. It can refine only the first segment and start right away.',
      'Set "Wall count" to 0. A* now searches fewer nodes. With few obstacles the heuristic is accurate, so the hierarchy gives no gain.',
    ],
    refs: [
      'Adi Botea, Martin Müller, Jonathan Schaeffer. Journal of Game Development 1(1). The original HPA* paper.',
      'Robert Holte, M. B. Perez, R. M. Zimmer, A. J. MacDonald. AAAI 1996. Search over abstraction hierarchies.',
      'Nathan Sturtevant. IEEE TCIAIG. Pathfinding benchmarks based on game maps.',
      'Hart, Nilsson, Raphael. The original A* paper.',
    ],
    params: {
      algo: { label: 'Algorithm', group: 'Search', options: { astar: 'A* (per cell)', hpa: 'HPA* (hierarchical)' } },
      cluster: 'Cluster size (cells)',
      showGraph: 'Show abstract graph',
      interval: { label: 'Auto query interval (s)', group: 'Scene' },
      walls: 'Wall count',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const GW = 96, GH = 60, N = GW * GH, SQ2 = Math.SQRT2;
    const grid = new Uint8Array(N); // 1 = 벽
    const idx = (x, y) => y * GW + x;

    // ── 맵 생성: 문이 있는 긴 벽 + 블록 ──
    (function makeMap() {
      const r = U.rng(ctx.seed * 53 + 11);
      for (let k = 0; k < P.walls; k++) {
        const vert = k % 2 === 0;
        const len = vert ? GH : GW, pos = vert ? r.int(4, GW - 5) : r.int(4, GH - 5);
        const a = r.int(0, Math.floor(len * 0.3)), b = r.int(Math.floor(len * 0.7), len);
        const doors = [];
        for (let d = 0; d < 3; d++) doors.push(r.int(a, b));
        for (let t = a; t < b; t++) {
          if (doors.some((d) => t >= d && t < d + 3)) continue;
          if (vert) grid[idx(pos, t)] = 1; else grid[idx(t, pos)] = 1;
        }
      }
      for (let k = 0; k < 40; k++) {
        const w = r.int(2, 6), h = r.int(2, 6), x0 = r.int(0, GW - w), y0 = r.int(0, GH - h);
        for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) grid[idx(x, y)] = 1;
      }
      // 가장 큰 연결 영역만 남김 (모든 질의가 도달 가능)
      const comp = new Int32Array(N).fill(-1); let best = -1, bestN = 0, id = 0;
      for (let i = 0; i < N; i++) {
        if (grid[i] || comp[i] >= 0) continue;
        const q = [i]; comp[i] = id; let n = 0;
        while (q.length) {
          const c = q.pop(); n++;
          const x = c % GW, y = (c / GW) | 0;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
            const j = idx(nx, ny);
            if (!grid[j] && comp[j] < 0) { comp[j] = id; q.push(j); }
          }
        }
        if (n > bestN) { bestN = n; best = id; }
        id++;
      }
      for (let i = 0; i < N; i++) if (!grid[i] && comp[i] !== best) grid[i] = 1;
    })();
    const freeCells = [];
    for (let i = 0; i < N; i++) if (!grid[i]) freeCells.push(i);

    // ── 그리드 A* (경계 사각형 안으로 제한 가능) ──
    const gS = new Float64Array(N), par = new Int32Array(N), stamp = new Uint32Array(N), closedS = new Uint32Array(N);
    let curStamp = 1;
    const heap = [];
    const push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    const octile = (a, b) => { const dx = Math.abs(a % GW - b % GW), dy = Math.abs(((a / GW) | 0) - ((b / GW) | 0)); return Math.max(dx, dy) + (SQ2 - 1) * Math.min(dx, dy); };
    const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, SQ2], [1, -1, SQ2], [-1, 1, SQ2], [-1, -1, SQ2]];
    // goal < 0 이면 Dijkstra (경계 안 전체). mark: 확장한 셀을 기록할 배열
    function search(start, goal, bx0, by0, bx1, by1, mark) {
      const st = curStamp++;
      heap.length = 0;
      gS[start] = 0; par[start] = -1; stamp[start] = st;
      push(goal >= 0 ? octile(start, goal) : 0, start);
      let expanded = 0;
      while (heap.length) {
        const [, c] = pop();
        if (closedS[c] === st) continue;
        closedS[c] = st; expanded++;
        if (mark) mark.push(c);
        if (c === goal) break;
        const x = c % GW, y = (c / GW) | 0;
        for (const [dx, dy, w] of DIRS) {
          const nx = x + dx, ny = y + dy;
          if (nx < bx0 || ny < by0 || nx > bx1 || ny > by1) continue;
          const j = idx(nx, ny);
          if (grid[j]) continue;
          if (dx && dy && (grid[idx(x + dx, y)] || grid[idx(x, y + dy)])) continue; // 모서리 끼어 지나가기 금지
          const ng = gS[c] + w;
          if (stamp[j] !== st || ng < gS[j] - 1e-9) {
            stamp[j] = st; gS[j] = ng; par[j] = c;
            push(ng + (goal >= 0 ? octile(j, goal) : 0), j);
          }
        }
      }
      return { st, expanded };
    }
    const reached = (st, i) => closedS[i] === st;
    function pathTo(i) { const p = []; while (i >= 0) { p.push(i); i = par[i]; } return p.reverse(); }

    // ── HPA* 전처리 ──
    let H = null;
    function buildHPA(cs) {
      const t0 = ctx.now();
      const ncx = Math.ceil(GW / cs), ncy = Math.ceil(GH / cs);
      const nodeOf = new Map(); const nodes = []; const edges = []; // edges: [a, b, cost, kind]
      const cl = (i) => Math.floor((i % GW) / cs) + Math.floor(((i / GW) | 0) / cs) * ncx;
      const node = (cell) => { if (!nodeOf.has(cell)) { nodeOf.set(cell, nodes.length); nodes.push({ cell, cl: cl(cell), adj: [] }); } return nodeOf.get(cell); };
      const link = (a, b, c, kind) => { edges.push([a, b, c, kind]); nodes[a].adj.push([b, c]); nodes[b].adj.push([a, c]); };
      const addEntrance = (cellsA, cellsB) => {
        // cellsA[k], cellsB[k]는 경계 양쪽의 짝 셀. 열린 구간 찾기
        let k = 0;
        while (k < cellsA.length) {
          if (grid[cellsA[k]] || grid[cellsB[k]]) { k++; continue; }
          let e = k; while (e + 1 < cellsA.length && !grid[cellsA[e + 1]] && !grid[cellsB[e + 1]]) e++;
          const picks = e - k + 1 >= 6 ? [k, e] : [Math.floor((k + e) / 2)];
          for (const m of picks) link(node(cellsA[m]), node(cellsB[m]), 1, 'inter');
          k = e + 1;
        }
      };
      for (let cy = 0; cy < ncy; cy++) for (let cx = 0; cx < ncx; cx++) {
        const x0 = cx * cs, y0 = cy * cs, x1 = Math.min(GW, x0 + cs) - 1, y1 = Math.min(GH, y0 + cs) - 1;
        if (x1 + 1 < GW) { const A = [], B = []; for (let y = y0; y <= y1; y++) { A.push(idx(x1, y)); B.push(idx(x1 + 1, y)); } addEntrance(A, B); }
        if (y1 + 1 < GH) { const A = [], B = []; for (let x = x0; x <= x1; x++) { A.push(idx(x, y1)); B.push(idx(x, y1 + 1)); } addEntrance(A, B); }
      }
      // 내부 간선: 클러스터 안 노드마다 Dijkstra
      const byCl = new Map();
      nodes.forEach((n, i) => { if (!byCl.has(n.cl)) byCl.set(n.cl, []); byCl.get(n.cl).push(i); });
      let pre = 0;
      const bounds = (c) => { const cx = c % ncx, cy = Math.floor(c / ncx); return [cx * cs, cy * cs, Math.min(GW, cx * cs + cs) - 1, Math.min(GH, cy * cs + cs) - 1]; };
      for (const [c, list] of byCl) {
        const b = bounds(c);
        for (let a = 0; a < list.length; a++) {
          const r = search(nodes[list[a]].cell, -1, ...b, null);
          pre += r.expanded;
          for (let k = a + 1; k < list.length; k++) if (reached(r.st, nodes[list[k]].cell)) link(list[a], list[k], gS[nodes[list[k]].cell], 'intra');
        }
      }
      H = { cs, ncx, ncy, nodes, edges, nodeOf, byCl, cl, bounds, pre, buildMs: ctx.now() - t0 };
    }

    function queryHPA(s, t) {
      const low = []; let insert = 0, abs = 0, refine = 0, first = 0;
      const { nodes, byCl, cl, bounds } = H;
      // 임시 노드 S, T 연결: 자기 클러스터 안에서 Dijkstra
      const extra = new Map(); // node id -> [[nb, cost]] (S = -1, T = -2)
      const connect = (cell, id) => {
        const list = byCl.get(cl(cell)) || [];
        const r = search(cell, -1, ...bounds(cl(cell)), low);
        insert += r.expanded;
        const out = [];
        for (const n of list) if (reached(r.st, nodes[n].cell)) out.push([n, gS[nodes[n].cell]]);
        return { out, st: r.st, other: (c) => (reached(r.st, c) ? gS[c] : -1) };
      };
      const cs = connect(s, -1), ct = connect(t, -2);
      // 추상 A*
      const key = (n) => (n === -1 ? 'S' : n === -2 ? 'T' : n);
      const cellOf = (n) => (n === -1 ? s : n === -2 ? t : nodes[n].cell);
      const tIn = new Map(ct.out.map(([n, c]) => [n, c]));
      const g = new Map([[key(-1), 0]]), parent = new Map(), closed = new Set();
      const open = [[octile(s, t), -1]];
      const absMark = [];
      const direct = cl(s) === cl(t) ? ct.other(s) : -1; // 같은 클러스터면 바로 연결
      let found = false;
      while (open.length) {
        let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
        const [, u] = open.splice(bi, 1)[0];
        if (closed.has(key(u))) continue;
        closed.add(key(u)); abs++; absMark.push(u);
        if (u === -2) { found = true; break; }
        const gu = g.get(key(u));
        const nbrs = u === -1 ? cs.out.slice() : nodes[u].adj.slice();
        if (u === -1 && direct >= 0) nbrs.push([-2, direct]);
        if (u >= 0 && tIn.has(u)) nbrs.push([-2, tIn.get(u)]);
        for (const [v, c] of nbrs) {
          const ng = gu + c, kv = key(v);
          if (closed.has(kv)) continue;
          if (!g.has(kv) || ng < g.get(kv) - 1e-9) { g.set(kv, ng); parent.set(kv, u); open.push([ng + octile(cellOf(v), t), v]); }
        }
      }
      if (!found) return null;
      const absPath = []; for (let u = -2; u !== undefined; u = parent.get(key(u))) absPath.push(u);
      absPath.reverse();
      // 정제: 구간마다 클러스터 안에서 A*
      let cells = [s];
      for (let k = 0; k + 1 < absPath.length; k++) {
        const a = cellOf(absPath[k]), b = cellOf(absPath[k + 1]);
        let seg;
        if (cl(a) !== cl(b)) seg = [a, b];
        else {
          const r = search(a, b, ...bounds(cl(a)), low);
          refine += r.expanded;
          seg = pathTo(b);
          if (k === 0) first = r.expanded;
        }
        cells = cells.concat(seg.slice(1));
      }
      return { cells, absPath: absPath.map(cellOf), low, absMark: absMark.map(cellOf), insert, abs, refine, first: insert + abs + first };
    }

    function pathLen(cells) { let L = 0; for (let i = 1; i < cells.length; i++) L += octile(cells[i - 1], cells[i]); return L; }

    let qrng, start, goal, res, timer, hist;
    function runQuery() {
      const t0 = ctx.now();
      if (P.algo === 'hpa') {
        if (!H || H.cs !== P.cluster) buildHPA(P.cluster);
        const t1 = ctx.now();
        const r = queryHPA(start, goal);
        const ms = ctx.now() - t1;
        search(start, goal, 0, 0, GW - 1, GH - 1, null); // 최적 길이 비교용 (탐색 수에 포함 안 함)
        const optLen = gS[goal];
        if (!r) { res = null; return; }
        res = { kind: 'hpa', ...r, len: pathLen(r.cells), opt: optLen, ms, total: r.insert + r.abs + r.refine };
      } else {
        const mark = [];
        const r = search(start, goal, 0, 0, GW - 1, GH - 1, mark);
        res = { kind: 'astar', cells: pathTo(goal), low: mark, total: r.expanded, ms: ctx.now() - t0 };
        res.len = gS[goal]; res.opt = res.len;
      }
      hist.push({ n: res.total, ratio: res.len / res.opt, first: res.first || res.total });
      if (hist.length > 30) hist.shift();
    }
    function newRandom() { start = goal; goal = qrng.pick(freeCells); while (goal === start) goal = qrng.pick(freeCells); }
    function init() {
      qrng = U.rng(ctx.seed * 41 + 7); hist = [];
      start = qrng.pick(freeCells); goal = qrng.pick(freeCells);
      // 첫 질의는 멀리 떨어진 두 점
      for (let k = 0; k < 20; k++) { const c = qrng.pick(freeCells); if (octile(c, start) > octile(goal, start)) goal = c; }
      timer = P.interval;
      runQuery();
    }

    // 지형 이미지
    const mapImg = ctx.createCanvas(GW, GH);
    { const mg = mapImg.getContext('2d'); mg.fillStyle = '#1b1e25'; mg.fillRect(0, 0, GW, GH); mg.fillStyle = '#59606e'; for (let i = 0; i < N; i++) if (grid[i]) mg.fillRect(i % GW, (i / GW) | 0, 1, 1); }
    init();

    const view = () => { const s = Math.min(ctx.width / GW, ctx.height / GH); return { s, ox: (ctx.width - GW * s) / 2, oy: (ctx.height - GH * s) / 2 }; };
    return {
      update(dt) {
        if (P.algo === 'hpa' && (!H || H.cs !== P.cluster)) runQuery();
        timer -= dt;
        if (timer <= 0) { timer = P.interval; newRandom(); runQuery(); }
      },
      onParam(key) { if (key === 'algo' || key === 'cluster') { hist = []; runQuery(); } },
      onPointer(type, m) {
        if (type !== 'down') return;
        const vw = view(), x = Math.floor((m.x - vw.ox) / vw.s), y = Math.floor((m.y - vw.oy) / vw.s);
        if (x < 0 || y < 0 || x >= GW || y >= GH || grid[idx(x, y)]) return;
        start = goal; goal = idx(x, y); timer = Math.max(timer, P.interval); runQuery();
      },
      render() {
        const g = ctx.g, vw = view(), s = vw.s;
        const cx = (i) => vw.ox + (i % GW + 0.5) * s, cy = (i) => vw.oy + (((i / GW) | 0) + 0.5) * s;
        g.imageSmoothingEnabled = false;
        g.drawImage(mapImg, vw.ox, vw.oy, GW * s, GH * s);
        if (res) {
          g.fillStyle = ctx.side === 'a' ? 'rgba(255,150,60,0.35)' : 'rgba(80,190,255,0.35)';
          for (const c of res.low) g.fillRect(vw.ox + (c % GW) * s, vw.oy + ((c / GW) | 0) * s, s, s);
        }
        if (P.algo === 'hpa' && H) {
          g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1; g.beginPath();
          for (let x = H.cs; x < GW; x += H.cs) { g.moveTo(vw.ox + x * s, vw.oy); g.lineTo(vw.ox + x * s, vw.oy + GH * s); }
          for (let y = H.cs; y < GH; y += H.cs) { g.moveTo(vw.ox, vw.oy + y * s); g.lineTo(vw.ox + GW * s, vw.oy + y * s); }
          g.stroke();
          if (P.showGraph) {
            g.strokeStyle = 'rgba(255,220,120,0.16)'; g.beginPath();
            for (const [a, b] of H.edges) { const ca = H.nodes[a].cell, cb = H.nodes[b].cell; g.moveTo(cx(ca), cy(ca)); g.lineTo(cx(cb), cy(cb)); }
            g.stroke();
            g.fillStyle = 'rgba(255,220,120,0.7)';
            for (const n of H.nodes) g.fillRect(cx(n.cell) - 1.5, cy(n.cell) - 1.5, 3, 3);
          }
          if (res && res.absMark) for (const c of res.absMark) D.circle(g, cx(c), cy(c), 3, null, C.warn, 1);
          if (res && res.absPath) D.poly(g, res.absPath.map((c) => ({ x: cx(c), y: cy(c) })), null, 'rgba(255,220,120,0.9)', 2, false);
        }
        if (res) D.poly(g, res.cells.map((c) => ({ x: cx(c), y: cy(c) })), null, '#fff', 2, false);
        D.circle(g, cx(start), cy(start), 5, C.good, '#000', 1.5);
        D.circle(g, cx(goal), cy(goal), 5, C.bad, '#000', 1.5);
        if (!res) { ctx.stat(GTL.L('경로', 'Path'), GTL.L('없음', 'None')); return; }
        const avg = (k) => hist.reduce((a, h) => a + h[k], 0) / Math.max(1, hist.length);
        ctx.stat(GTL.L('탐색 노드 수 (이번 질의)', 'Searched nodes (this query)'), res.total);
        if (res.kind === 'hpa') {
          ctx.stat(GTL.L('탐색 내역 (삽입 / 추상 / 정제)', 'Breakdown (insert / abstract / refine)'), `${res.insert} / ${res.abs} / ${res.refine}`);
          ctx.stat(GTL.L('첫 이동까지 탐색 노드', 'Nodes until first move'), res.first);
        }
        ctx.stat(GTL.L('평균 탐색 노드 (최근 질의)', 'Avg searched nodes (recent queries)'), avg('n').toFixed(0) + GTL.L(` (${hist.length}개)`, ` (${hist.length})`));
        ctx.stat(GTL.L('경로 길이', 'Path length'), res.len.toFixed(1) + GTL.L(' 칸', ' cells'));
        ctx.stat(GTL.L('최적 대비 경로 길이', 'Path length vs optimal'), (res.len / res.opt * 100).toFixed(1) + GTL.L(' % (평균 ', ' % (avg ') + (avg('ratio') * 100).toFixed(1) + ' %)');
        ctx.stat(GTL.L('질의 시간', 'Query time'), res.ms.toFixed(2) + ' ms');
        if (res.kind === 'hpa') {
          ctx.stat(GTL.L('추상 그래프', 'Abstract graph'), GTL.L(`노드 ${H.nodes.length}, 간선 ${H.edges.length}`, `${H.nodes.length} nodes, ${H.edges.length} edges`));
          ctx.stat(GTL.L('전처리 탐색 노드', 'Preprocessing nodes'), H.pre + ` (${H.buildMs.toFixed(1)} ms)`);
        }
      },
    };
  },
});
