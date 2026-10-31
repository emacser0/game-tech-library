// 쿼드트리 vs 균일 그리드 : 뭉친 분포에서의 범위 질의
GTL.register({
  id: 'quadtree',
  title: '쿼드트리: 적응형 공간 분할과 범위 질의',
  summary: '점이 한곳에 뭉치면 균일 그리드는 일부 셀이 꽉 차서 검사 수가 폭증. 쿼드트리는 밀도에 맞춰 깊게 쪼개므로 질의 비용이 일정하게 유지됨.',
  views: { a: '균일 그리드', b: '쿼드트리' },
  controls: '마우스: 질의 사각형 이동 (마우스가 밖에 있으면 자동 이동)',
  info: `
    <p><b>쿼드트리</b>는 공간을 4등분하며 나누는 트리. 노드의 점 개수가 <code>capacity</code>를 넘으면 4등분. 이 과정을 <code>max depth</code>까지 반복.</p>
    <p>빈 곳은 큰 노드 하나로 남고, 붐비는 곳만 잘게 나뉨. 그래서 <b>밀도가 고르지 않은 장면</b>에 강함. 예: 군중, 마을, 파티클 분수.</p>
    <p>질의는 루트부터 내려감. 질의 영역과 겹치지 않는 노드는 통째로 건너뜀.
    이 샘플은 점이 매 프레임 움직이므로 트리를 <b>매번 다시 빌드</b>(인덱스 배열을 제자리 분할). 빌드 비용도 함께 표시.</p>
    <p>단점과 비교:</p>
    <ul>
      <li>균일 그리드는 빌드가 O(n)으로 더 쌈. 하지만 셀 크기가 하나뿐이라 뭉친 곳에서는 한 셀에 수백 개가 들어감.</li>
      <li>쿼드트리는 빌드 비용이 더 큼</li>
      <li>같은 위치에 점이 겹치면 분할이 끝나지 않음. <code>max depth</code>가 이를 막는 안전장치.</li>
    </ul>`,
  diagram: (L) => {
    const P = [[6, 8], [14, 20], [24, 6], [30, 28], [10, 30], [28, 16], [20, 26], [4, 18], [32, 4], [17, 12], [100, 30], [80, 110], [120, 90], [50, 100], [60, 55]];
    const dots = (ox, cls) => P.map((p) => `<circle cx="${ox + p[0]}" cy="${10 + p[1]}" r="2.6" class="${cls}"/>`).join('');
    const grid = [1, 2, 3].map((i) => `<line x1="${10 + i * 35}" y1="10" x2="${10 + i * 35}" y2="150" class="d-dim"/><line x1="10" y1="${10 + i * 35}" x2="150" y2="${10 + i * 35}" class="d-dim"/>`).join('');
    const cross = (x, y, s) => `<line x1="${190 + x + s}" y1="${10 + y}" x2="${190 + x + s}" y2="${10 + y + 2 * s}" class="d-b" stroke-width="1.2"/><line x1="${190 + x}" y1="${10 + y + s}" x2="${190 + x + 2 * s}" y2="${10 + y + s}" class="d-b" stroke-width="1.2"/>`;
    const node = (x, y, cls) => `<circle cx="${x}" cy="${y}" r="5" class="${cls}"/>`;
    const edge = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="d-dim"/>`;
    return `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="140" height="140" class="d-dim"/>${grid}
    <rect x="10" y="10" width="35" height="35" class="d-a"/>
    ${dots(10, 'f-a')}
    <rect x="190" y="10" width="140" height="140" class="d-dim"/>
    ${cross(0, 0, 70)}${cross(0, 0, 35)}${cross(0, 0, 17.5)}${cross(17.5, 0, 8.75)}
    <rect x="268" y="88" width="48" height="40" class="d-accent" stroke-dasharray="4 3"/>
    ${dots(190, 'f-b')}
    ${edge(440, 24, 380, 64)}${edge(440, 24, 420, 64)}${edge(440, 24, 460, 64)}${edge(440, 24, 500, 64)}
    ${edge(380, 64, 356, 104)}${edge(380, 64, 372, 104)}${edge(380, 64, 388, 104)}${edge(380, 64, 404, 104)}
    ${[344, 352, 360, 368].map((x) => edge(356, 104, x, 140)).join('')}
    ${node(440, 24, 'f-b')}${node(380, 64, 'f-b')}${node(420, 64, 'f-dim')}${node(460, 64, 'f-dim')}${node(500, 64, 'f-accent')}
    ${node(356, 104, 'f-b')}${node(372, 104, 'f-dim')}${node(388, 104, 'f-dim')}${node(404, 104, 'f-dim')}
    ${[344, 352, 360, 368].map((x) => `<circle cx="${x}" cy="140" r="3" class="f-dim"/>`).join('')}
    <text x="10" y="166" class="t-small t-a">${L('균일 그리드: 한 셀에 10개', 'Grid: 10 points in one cell')}</text>
    <text x="190" y="166" class="t-small t-b">${L('쿼드트리: 붐비는 곳만 깊게 분할', 'Quadtree: deep splits where crowded')}</text>
    <text x="444" y="166" text-anchor="middle" class="t-small t-dim">${L('노드마다 자식 4개', '4 children per node')}</text>
    <text x="10" y="182" class="t-small t-dim">${L('질의(점선 사각형)는 겹치지 않는 노드를 통째로 건너뜀. 루트 다음은 강조 노드만 방문', 'A query (dashed box) skips nodes it does not overlap. After the root, only the highlighted node')}</text>
  </svg>`;
  },
  look: [
    '기본 상태(군집 분포)에서 오른쪽 위 "이웃 질의 검사 수"를 보면 A(그리드)가 훨씬 큼. 질의 사각형을 군집 위로 옮기면 차이가 더 잘 보임.',
    '분포를 "균일"로 바꾸면 그리드와 쿼드트리의 차이가 거의 사라짐. 오히려 그리드의 빌드 비용이 더 쌈.',
    'capacity를 1~2로 낮추면 노드 수와 빌드 시간이 늘어남. 64로 올리면 리프가 커져서 검사 수가 늘어남.',
    'max depth를 3으로 제한하면 군집 내부가 충분히 쪼개지지 않아 그리드처럼 동작',
  ],
  refs: [
    { type: 'paper', title: 'Quad Trees: A Data Structure for Retrieval on Composite Keys (Finkel & Bentley)', year: 1974, note: 'Acta Informatica 4. 쿼드트리 원 논문.' },
    { type: 'book', title: 'Real-Time Collision Detection, 7.3 Trees (Christer Ericson)', year: 2005 },
    { type: 'book', title: 'Game Programming Patterns, Spatial Partition (Robert Nystrom)', url: 'https://gameprogrammingpatterns.com/spatial-partition.html', year: 2014 },
  ],
  params: [
    { key: 'count', label: '점 개수', type: 'int', min: 500, max: 12000, default: 5000, shared: true, reset: true, group: '장면' },
    { key: 'dist', label: '분포', type: 'select', options: [
      { value: 'cluster', label: '군집 (가우시안)' },
      { value: 'uniform', label: '균일' },
    ], default: 'cluster', shared: true, reset: true },
    { key: 'speed', label: '움직임 속도', type: 'range', min: 0, max: 60, step: 1, default: 15, shared: true },
    { key: 'qsize', label: '질의 사각형 크기', type: 'int', min: 20, max: 300, default: 110, shared: true },
    { key: 'structure', label: '자료구조', type: 'select', group: '공간 분할', options: [
      { value: 'none', label: '없음 (선형 탐색)' },
      { value: 'grid', label: '균일 그리드' },
      { value: 'quadtree', label: '쿼드트리' },
    ], a: 'grid', b: 'quadtree' },
    { key: 'cell', label: '그리드 셀 크기', type: 'int', min: 8, max: 120, default: 40, when: (p) => p.structure === 'grid' },
    { key: 'capacity', label: '노드 capacity', type: 'int', min: 1, max: 64, default: 8, help: '노드를 4등분하기 전 최대 점 개수', when: (p) => p.structure === 'quadtree' },
    { key: 'maxDepth', label: 'max depth', type: 'int', min: 1, max: 12, default: 8, help: '트리의 최대 깊이', when: (p) => p.structure === 'quadtree' },
    { key: 'showNodes', label: '노드/셀 표시', type: 'bool', default: true },
  ],
  en: {
    title: 'Quadtree: Adaptive Spatial Partitioning and Range Queries',
    summary: 'When points bunch up in one place, some cells of a uniform grid fill up and the test count explodes. A quadtree splits deeper where density is high, so query cost stays steady.',
    views: { a: 'Uniform grid', b: 'Quadtree' },
    controls: 'Mouse: move the query rectangle (it moves on its own when the mouse is outside)',
    info: `
    <p>A <b>quadtree</b> is a tree that splits space into four parts. When a node holds more points than <code>capacity</code>, it splits into four. This repeats down to <code>max depth</code>.</p>
    <p>Empty areas stay as one large node. Only crowded areas get split finely. So it works well for <b>scenes with uneven density</b>. Examples: crowds, towns, particle fountains.</p>
    <p>A query walks down from the root. It skips any node that does not overlap the query area, along with everything under it.
    In this sample the points move every frame, so the tree is <b>rebuilt every frame</b> (by partitioning an index array in place). The build cost is shown too.</p>
    <p>Downsides and comparison:</p>
    <ul>
      <li>A uniform grid builds in O(n), which is cheaper. But it has only one cell size, so a crowded cell can hold hundreds of points.</li>
      <li>A quadtree costs more to build.</li>
      <li>If points share the same position, splitting never ends. <code>max depth</code> is the safety limit that stops this.</li>
    </ul>`,
    look: [
      'In the default state (clustered), look at "Neighbor query tests" at the top right. A (grid) is much larger. Move the query rectangle over a cluster to see the gap more clearly.',
      'Switch the distribution to "Uniform". The gap between grid and quadtree almost disappears. The grid even builds faster.',
      'Lower capacity to 1~2. Node count and build time go up. Raise it to 64. Leaves get bigger and the test count goes up.',
      'Limit max depth to 3. Clusters are not split enough, so the tree acts like a grid.',
    ],
    refs: ['Acta Informatica 4. The original quadtree paper.', null, null],
    params: {
      count: { label: 'Point count', group: 'Scene' },
      dist: { label: 'Distribution', options: { cluster: 'Clustered (Gaussian)', uniform: 'Uniform' } },
      speed: 'Movement speed',
      qsize: 'Query rectangle size',
      structure: { label: 'Data structure', group: 'Spatial partition', options: { none: 'None (linear scan)', grid: 'Uniform grid', quadtree: 'Quadtree' } },
      cell: 'Grid cell size',
      capacity: { label: 'Node capacity', help: 'Max points in a node before it splits into four' },
      maxDepth: { label: 'max depth', help: 'Max depth of the tree' },
      showNodes: 'Show nodes/cells',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const NQ = 400; // 비용 측정용 이웃 질의 횟수
    let n, px, py, perm, home;
    // 쿼드트리 노드 (평면 배열)
    let nx = [], ny = [], ns = [], nlo = [], nhi = [];
    let gridStart = null, gridSorted = null, gw = 0, gh = 0, gcs = 0;
    let st = { build: 0, query: 0, qTests: 0, nbrTests: 0, nodes: 0, depth: 0, visited: 0, found: 0 };
    let hits = new Uint8Array(1), visitedMark = [];
    const hist = [];
    let qx = 0, qy = 0, t = 0;

    function init() {
      ctx.rng = U.rng(ctx.seed);
      const r = ctx.rng, W = ctx.width, H = ctx.height;
      n = P.count;
      px = new Float32Array(n); py = new Float32Array(n); home = new Float32Array(n * 2);
      perm = new Int32Array(n); hits = new Uint8Array(n);
      const centers = Array.from({ length: 5 }, () => ({ x: r.range(0.15, 0.85) * W, y: r.range(0.15, 0.85) * H, s: r.range(12, 45) }));
      for (let i = 0; i < n; i++) {
        if (P.dist === 'uniform' || i % 10 === 0) { px[i] = r.range(0, W); py[i] = r.range(0, H); }
        else { const c = centers[i % 5]; px[i] = c.x + r.gauss() * c.s; py[i] = c.y + r.gauss() * c.s; }
        px[i] = U.clamp(px[i], 1, W - 1); py[i] = U.clamp(py[i], 1, H - 1);
        home[i * 2] = r.range(0, U.TAU); home[i * 2 + 1] = r.range(0.5, 1.5);
      }
    }
    init();

    // ── 쿼드트리 빌드: perm[lo,hi) 구간을 제자리 분할 ──
    function partition(lo, hi, test) {
      let i = lo, j = hi - 1;
      while (i <= j) {
        if (test(perm[i])) i++;
        else { const tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp; j--; }
      }
      return i;
    }
    // kids[id]: 자식 4개 id (리프는 null)
    let kids = [];
    function buildTree() {
      nx = []; ny = []; ns = []; nlo = []; nhi = []; kids = [];
      for (let i = 0; i < n; i++) perm[i] = i;
      st.depth = 0;
      const S = Math.max(ctx.width, ctx.height);
      // 재귀로 빌드한 뒤 자식 목록을 기록
      const rec = (x, y, s, lo, hi, depth) => {
        const id = nx.length;
        nx.push(x); ny.push(y); ns.push(s); nlo.push(lo); nhi.push(hi); kids.push(null);
        if (depth > st.depth) st.depth = depth;
        if (hi - lo <= P.capacity || depth >= P.maxDepth) return id;
        const h = s / 2, mx = x + h, my = y + h;
        const midY = partition(lo, hi, (k) => py[k] < my);
        const m0 = partition(lo, midY, (k) => px[k] < mx);
        const m1 = partition(midY, hi, (k) => px[k] < mx);
        kids[id] = [rec(x, y, h, lo, m0, depth + 1), rec(mx, y, h, m0, midY, depth + 1), rec(x, my, h, midY, m1, depth + 1), rec(mx, my, h, m1, hi, depth + 1)];
        return id;
      };
      rec(0, 0, S, 0, n, 0);
    }

    function buildGrid() {
      gcs = P.cell; gw = Math.ceil(ctx.width / gcs) + 1; gh = Math.ceil(ctx.height / gcs) + 1;
      const B = gw * gh;
      const cnt = new Int32Array(B + 1), key = new Int32Array(n);
      for (let i = 0; i < n; i++) {
        const k = U.clamp(Math.floor(py[i] / gcs), 0, gh - 1) * gw + U.clamp(Math.floor(px[i] / gcs), 0, gw - 1);
        key[i] = k; cnt[k + 1]++;
      }
      for (let k = 0; k < B; k++) cnt[k + 1] += cnt[k];
      gridStart = cnt; gridSorted = new Int32Array(n);
      const pos = cnt.slice(0, B);
      for (let i = 0; i < n; i++) gridSorted[pos[key[i]]++] = i;
    }

    // 범위 질의: 사각형 [x0,x1]x[y0,y1]. mark가 있으면 결과/방문 기록
    function query(x0, y0, x1, y1, mark) {
      let tests = 0, found = 0, visited = 0;
      const s = P.structure;
      const testPt = (k) => {
        tests++;
        if (px[k] >= x0 && px[k] <= x1 && py[k] >= y0 && py[k] <= y1) { found++; if (mark) hits[k] = 1; }
      };
      if (s === 'none') {
        for (let k = 0; k < n; k++) testPt(k);
      } else if (s === 'grid') {
        const cx0 = Math.max(0, Math.floor(x0 / gcs)), cx1 = Math.min(gw - 1, Math.floor(x1 / gcs));
        const cy0 = Math.max(0, Math.floor(y0 / gcs)), cy1 = Math.min(gh - 1, Math.floor(y1 / gcs));
        for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
          const k = cy * gw + cx; visited++;
          if (mark) visitedMark.push(k);
          for (let q = gridStart[k], e = gridStart[k + 1]; q < e; q++) testPt(gridSorted[q]);
        }
      } else {
        const stack = [0];
        while (stack.length) {
          const id = stack.pop();
          const x = nx[id], y = ny[id], sz = ns[id];
          if (x > x1 || y > y1 || x + sz < x0 || y + sz < y0) continue;
          visited++;
          const kd = kids[id];
          if (kd) { stack.push(kd[0], kd[1], kd[2], kd[3]); continue; }
          if (mark) visitedMark.push(id);
          for (let q = nlo[id]; q < nhi[id]; q++) testPt(perm[q]);
        }
      }
      return { tests, found, visited };
    }

    return {
      update(dt) {
        t += dt;
        const W = ctx.width, H = ctx.height, sp = P.speed * dt;
        for (let i = 0; i < n; i++) {
          const a = home[i * 2] + t * home[i * 2 + 1];
          px[i] = U.clamp(px[i] + Math.cos(a) * sp, 1, W - 1);
          py[i] = U.clamp(py[i] + Math.sin(a) * sp, 1, H - 1);
        }
        const m = ctx.input.mouse;
        if (m.inside) { qx = m.x; qy = m.y; }
        else { qx = W * (0.5 + 0.38 * Math.sin(t * 0.37)); qy = H * (0.5 + 0.35 * Math.sin(t * 0.53 + 1)); }

        const t0 = ctx.now();
        if (P.structure === 'grid') buildGrid();
        else if (P.structure === 'quadtree') buildTree();
        const t1 = ctx.now();
        // 비용 측정: 고정된 NQ개 점이 자기 주변 (24px) 이웃을 질의
        let nbr = 0;
        const step = Math.max(1, Math.floor(n / NQ));
        for (let i = 0; i < n; i += step) nbr += query(px[i] - 12, py[i] - 12, px[i] + 12, py[i] + 12, false).tests;
        const t2 = ctx.now();
        // 시각화용 질의
        hits.fill(0); visitedMark = [];
        const h = P.qsize / 2;
        const q = query(qx - h, qy - h, qx + h, qy + h, true);
        st.build = st.build * 0.9 + (t1 - t0) * 0.1;
        st.query = st.query * 0.9 + (t2 - t1) * 0.1;
        st.nbrTests = nbr; st.qTests = q.tests; st.found = q.found; st.visited = q.visited;
        st.nodes = P.structure === 'quadtree' ? nx.length : P.structure === 'grid' ? gw * gh : 0;
        hist.push(nbr); if (hist.length > 120) hist.shift();
      },
      render() {
        ctx.clearStats();
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        const s = P.structure;
        if (P.showNodes && s === 'quadtree' && kids.length) {
          g.beginPath();
          for (let id = 0; id < nx.length; id++) if (!kids[id]) g.rect(nx[id] + 0.5, ny[id] + 0.5, ns[id], ns[id]);
          g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1; g.stroke();
          for (const id of visitedMark) D.rect(g, nx[id], ny[id], ns[id], ns[id], 'rgba(255,203,107,0.10)', 'rgba(255,203,107,0.5)');
        } else if (P.showNodes && s === 'grid' && gridStart) {
          for (let k = 0; k < gw * gh; k++) {
            const c = gridStart[k + 1] - gridStart[k];
            if (c) { g.fillStyle = `rgba(255,122,89,${Math.min(0.45, c * 0.004)})`; g.fillRect((k % gw) * gcs, Math.floor(k / gw) * gcs, gcs, gcs); }
          }
          D.grid(g, W, H, gcs, 'rgba(255,255,255,0.08)');
          for (const k of visitedMark) D.rect(g, (k % gw) * gcs, Math.floor(k / gw) * gcs, gcs, gcs, 'rgba(255,203,107,0.10)', 'rgba(255,203,107,0.5)');
        }
        g.fillStyle = 'rgba(216,221,230,0.6)';
        for (let i = 0; i < n; i++) if (!hits[i]) g.fillRect(px[i] - 1, py[i] - 1, 2, 2);
        g.fillStyle = col;
        for (let i = 0; i < n; i++) if (hits[i]) g.fillRect(px[i] - 1.5, py[i] - 1.5, 3, 3);
        const h = P.qsize / 2;
        D.rect(g, qx - h, qy - h, h * 2, h * 2, null, col, 2);
        D.text(g, GTL.L(`검사 ${st.qTests} → 결과 ${st.found}`, `Tests ${st.qTests} → found ${st.found}`), qx - h, qy - h - 16, { color: col, size: 11 });
        D.plot(g, hist, W - 170, 8, 160, 44, { min: 0, color: col, label: GTL.L(`이웃 질의 검사 ${st.nbrTests}`, `Neighbor query tests ${st.nbrTests}`) });

        ctx.stat(GTL.L('질의 사각형 검사 수', 'Query rectangle tests'), st.qTests);
        ctx.stat(s === 'quadtree' ? GTL.L('방문 노드', 'Visited nodes') : GTL.L('방문 셀', 'Visited cells'), st.visited);
        ctx.stat(GTL.L(`이웃 질의 ${NQ}회 검사 수`, `Tests for ${NQ} neighbor queries`), st.nbrTests.toLocaleString());
        if (s !== 'none') ctx.stat(s === 'quadtree' ? GTL.L('노드 수 / 깊이', 'Nodes / depth') : GTL.L('셀 수', 'Cells'), s === 'quadtree' ? `${st.nodes} / ${st.depth}` : st.nodes);
        ctx.stat(GTL.L('빌드', 'Build'), st.build.toFixed(2) + ' ms');
        ctx.stat(GTL.L('질의', 'Query'), st.query.toFixed(2) + ' ms');
      },
    };
  },
});
