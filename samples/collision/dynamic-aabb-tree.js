// 동적 AABB 트리 (Box2D b2DynamicTree 방식): fat AABB 증분 갱신 vs 매 프레임 하향식 재구축
GTL.register({
  id: 'dynamic-aabb-tree',
  title: '동적 AABB 트리: fat AABB 증분 갱신 vs 매 프레임 재구축',
  summary: '움직이는 오브젝트가 많은 장면에서 BVH를 매 프레임 새로 만들면 정지한 오브젝트까지 모두 다시 정렬. 여유를 둔 fat AABB로 감싸고, 실제 AABB가 밖으로 나갈 때만 다시 삽입하면 프레임당 갱신이 수십 개로 줄어듦. 대신 질의 후보가 늘어남.',
  views: { a: '매 프레임 재구축', b: 'fat AABB 증분 갱신' },
  controls: '마우스: 그 위치를 덮는 노드 경로 표시',
  info: `
    <p><b>동적 AABB 트리</b>는 오브젝트의 AABB를 잎으로 두는 이진 BVH. 내부 노드는 두 자식을 감싸는 AABB를 가짐. Box2D의 <code>b2DynamicTree</code>가 대표 구현.</p>
    <p><b>매 프레임 재구축</b>(하향식): 모든 오브젝트를 중심 기준으로 긴 축을 따라 정렬하고 가운데에서 둘로 나눔. 트리 품질은 좋음. 하지만 정지한 오브젝트까지 매번 다시 정렬.</p>
    <p><b>증분 갱신</b>은 이렇게 동작</p>
    <ul>
      <li>잎에는 실제 AABB보다 여유값만큼 큰 <b>fat AABB</b>를 저장. 이동 방향으로는 변위 × 배율만큼 더 늘림(예측 확장).</li>
      <li>실제 AABB가 fat AABB 안에 있으면 아무것도 하지 않음</li>
      <li>밖으로 나가면 잎을 빼고 다시 삽입. 삽입 위치는 둘레 증가가 가장 작은 형제를 찾아 내려가며 고름.</li>
      <li>삽입과 제거 뒤에는 높이 차가 1보다 큰 노드를 회전해 균형을 맞춤(AVL과 같은 원리)</li>
    </ul>
    <p>단점과 튜닝:</p>
    <ul>
      <li>여유값이 크면 재삽입은 줄지만 fat AABB끼리 더 많이 겹침. 그만큼 후보 쌍과 방문 노드가 늘어남.</li>
      <li>회전이 없으면 재삽입을 반복할수록 트리가 한쪽으로 길어짐. 높이가 커지면 질의가 느려짐.</li>
      <li>후보 쌍은 내로우페이즈에서 실제 AABB로 다시 걸러야 함</li>
    </ul>`,
  diagram: (L) => {
    const objs = [
      { n: 1, t: [30, 40, 24, 18], f: [24, 34, 50, 30] },
      { n: 2, t: [80, 80, 20, 20], f: [74, 74, 32, 32] },
      { n: 3, t: [170, 40, 22, 22], f: [164, 34, 34, 34] },
      { n: 4, t: [200, 100, 26, 18], f: [194, 94, 38, 42] },
    ];
    const box = ([x, y, w, h], cls, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}"${extra}/>`;
    const node = (cx, y, label, leaf) => `<rect x="${cx - 18}" y="${y}" width="36" height="16" class="${leaf ? 'f-b' : 'f-dim'}"${leaf ? ' fill-opacity="0.3"' : ''}/><text x="${cx}" y="${y + 12}" text-anchor="middle" class="t-small t-mono">${label}</text>`;
    const edge = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1 + 16}" x2="${x2}" y2="${y2}" class="d-dim"/>`;
    return `<svg viewBox="0 0 540 198" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    ${box([14, 22, 228, 124], 'd-dim', ' stroke-dasharray="1 3"')}
    ${box([20, 30, 90, 80], 'd-dim')}${box([160, 30, 76, 110], 'd-dim')}
    <text x="246" y="30" class="t-small t-dim">${L('루트', 'root')}</text>
    <text x="106" y="44" text-anchor="end" class="t-small t-dim t-mono">N1</text>
    <text x="232" y="44" text-anchor="end" class="t-small t-dim t-mono">N2</text>
    ${objs.map((o) => box(o.t, 'f-b', ' fill-opacity="0.45"') + box(o.f, 'd-b', ' stroke-dasharray="4 3"') + `<text x="${o.t[0] + 3}" y="${o.t[1] + 11}" class="t-small t-mono">${o.n}</text>`).join('')}
    <line x1="56" y1="49" x2="70" y2="49" class="d-accent" marker-end="url(#arr)"/>
    <line x1="213" y1="120" x2="213" y2="133" class="d-accent" marker-end="url(#arr)"/>
    ${edge(410, 20, 350, 70)}${edge(410, 20, 470, 70)}${edge(350, 70, 320, 120)}${edge(350, 70, 380, 120)}${edge(470, 70, 440, 120)}${edge(470, 70, 500, 120)}
    ${node(410, 20, L('루트', 'root'))}${node(350, 70, 'N1')}${node(470, 70, 'N2')}
    ${node(320, 120, '1', true)}${node(380, 120, '2', true)}${node(440, 120, '3', true)}${node(500, 120, '4', true)}
    <text x="4" y="164" class="t-small t-dim">${L('채움: 실제 AABB, 점선: fat AABB (여유값 + 이동 방향 예측, 주황 화살표 = 속도)', 'Filled: real AABB. Dashed: fat AABB (margin + predicted motion, orange = velocity)')}</text>
    <text x="4" y="178" class="t-small t-a">${L('A: 매 프레임 모든 잎을 정렬해 트리를 새로 만듦', 'A: sorts every leaf and rebuilds the tree each frame')}</text>
    <text x="4" y="192" class="t-small t-b">${L('B: 실제 AABB가 fat AABB 밖으로 나간 잎만 빼서 다시 삽입', 'B: removes and reinserts only leaves whose real AABB leaves the fat AABB')}</text>
  </svg>`;
  },
  look: [
    '기본 상태에서 "트리 갱신 비용"을 비교하면 A가 몇 배 큼. B의 "재삽입 수"는 전체 오브젝트 수의 몇 %에 그침.',
    'B의 "후보 쌍"은 "실제 겹침 쌍"보다 큼. fat AABB 때문에 생긴 거짓 후보. A는 두 값이 같음.',
    'B의 "여유값"과 "변위 예측 배율"을 모두 0으로 낮추면 움직이는 오브젝트가 매 프레임 모두 재삽입됨. 이때 갱신 비용이 A의 재구축보다 커짐.',
    'B의 "여유값"을 30으로 올리면 재삽입은 거의 없지만 후보 쌍과 질의 비용이 크게 늘어남',
    '"트리 비용"과 "방문 노드"는 A가 더 낮음. 하나씩 삽입해 쌓은 트리는 한 번에 나눈 트리보다 품질이 떨어짐. 그래서 "질의 비용"은 B가 더 큼.',
    'B의 "회전으로 균형 유지"를 끄고 몇 초 기다리면 "트리 높이"가 계속 커지고 "방문 노드"가 늘어남',
    '"정지 오브젝트 비율"을 0으로 낮추면 증분 갱신의 이득이 줄어듦. 0.95로 올리면 차이가 커짐.',
  ],
  refs: [
    { type: 'code', title: 'Box2D b2DynamicTree (Erin Catto)', url: 'https://github.com/erincatto/box2d', note: 'v2.4의 b2_dynamic_tree.cpp. fat AABB(b2_aabbExtension), 변위 예측(b2_aabbMultiplier), 둘레 기반 형제 선택, Balance 회전.' },
    { type: 'talk', title: 'Dynamic Bounding Volume Hierarchies (Erin Catto), GDC', year: 2019, note: '삽입 비용 함수와 회전, 증분 갱신의 트리 품질 문제' },
    { type: 'book', title: 'Real-Time Collision Detection, 6.2 Building Strategies for Hierarchy Construction (Christer Ericson)', year: 2005, note: '하향식 구축과 증분 삽입' },
    { type: 'paper', title: 'Fast, Effective BVH Updates for Animated Scenes (Kopta et al.)', year: 2012, note: 'I3D 2012. 트리 회전으로 갱신된 BVH 품질을 유지.' },
  ],
  params: [
    { key: 'count', label: '오브젝트 수', type: 'int', min: 200, max: 3000, default: 1500, shared: true, reset: true, group: '장면' },
    { key: 'staticFrac', label: '정지 오브젝트 비율', type: 'range', min: 0, max: 0.95, step: 0.05, default: 0.6, shared: true, reset: true },
    { key: 'speed', label: '이동 속도', type: 'range', min: 0, max: 200, step: 5, default: 40, shared: true },
    { key: 'mode', label: '갱신 방식', type: 'select', group: '트리', options: [
      { value: 'rebuild', label: '매 프레임 재구축 (하향식)' },
      { value: 'incremental', label: 'fat AABB 증분 갱신' },
    ], a: 'rebuild', b: 'incremental', default: 'rebuild' },
    { key: 'margin', label: '여유값 (px)', type: 'range', min: 0, max: 30, step: 0.5, default: 2, help: 'Box2D의 b2_aabbExtension', when: (p) => p.mode === 'incremental' },
    { key: 'predict', label: '변위 예측 배율', type: 'range', min: 0, max: 8, step: 0.5, default: 2, help: 'Box2D의 b2_aabbMultiplier. 0이면 끔', when: (p) => p.mode === 'incremental' },
    { key: 'balance', label: '회전으로 균형 유지', type: 'bool', default: true, when: (p) => p.mode === 'incremental' },
    { key: 'showDepth', label: '내부 노드 표시 깊이', type: 'int', min: 0, max: 14, default: 5 },
  ],
  en: {
    title: 'Dynamic AABB Tree: Incremental Fat AABB Updates vs Rebuild Every Frame',
    summary: 'In a scene with many moving objects, rebuilding the BVH every frame re-sorts even the objects that stand still. Wrap each object in a fat AABB with some slack, and reinsert it only when its real AABB leaves the fat one. Updates per frame drop to a few dozen. In return, query candidates go up.',
    views: { a: 'Rebuild every frame', b: 'Incremental fat AABB updates' },
    controls: 'Mouse: show the path of nodes that cover that position',
    info: `
    <p>A <b>dynamic AABB tree</b> is a binary BVH whose leaves are object AABBs. Each internal node holds an AABB that encloses its two children. Box2D's <code>b2DynamicTree</code> is the best-known implementation.</p>
    <p><b>Rebuild every frame</b> (top-down): sort all objects by center along the long axis and split them in half. Tree quality is good. But it re-sorts even the objects that stand still, every time.</p>
    <p><b>Incremental update</b> works like this.</p>
    <ul>
      <li>Each leaf stores a <b>fat AABB</b> that is larger than the real AABB by a margin. In the direction of motion it grows further by displacement × multiplier (predictive expansion).</li>
      <li>If the real AABB is inside the fat AABB, do nothing.</li>
      <li>If it leaves, remove the leaf and insert it again. To pick the spot, walk down the tree toward the sibling with the smallest perimeter increase.</li>
      <li>After insert and remove, rotate any node whose height difference is more than 1 to keep balance (the same idea as AVL).</li>
    </ul>
    <p>Downsides and tuning:</p>
    <ul>
      <li>A large margin means fewer reinserts, but fat AABBs overlap more. Candidate pairs and visited nodes go up by that much.</li>
      <li>Without rotation, the tree grows lopsided as reinserts repeat. A taller tree makes queries slower.</li>
      <li>The narrowphase must filter candidate pairs again with the real AABBs.</li>
    </ul>`,
    look: [
      'In the default state, compare "Tree update cost". A is several times larger. B\'s "Reinserts" is only a few % of all objects.',
      'B\'s "Candidate pairs" is larger than "Real overlap pairs". These are false candidates from the fat AABBs. In A the two values are the same.',
      'Lower both B\'s "Margin" and "Displacement prediction multiplier" to 0. Every moving object is reinserted every frame. Then the update cost gets larger than A\'s rebuild.',
      'Raise B\'s "Margin" to 30. There are almost no reinserts, but candidate pairs and query cost rise a lot.',
      '"Tree cost" and "Visited nodes" are lower in A. A tree built by inserting one at a time has lower quality than a tree split all at once. So B has a larger "Query cost".',
      'Turn off B\'s "Balance with rotations" and wait a few seconds. "Tree height" keeps growing, and "Visited nodes" goes up.',
      'Lower "Static object ratio" to 0. The gain from incremental updates shrinks. Raise it to 0.95 and the gap grows.',
    ],
    refs: [
      'b2_dynamic_tree.cpp in v2.4. Covers fat AABB (b2_aabbExtension), displacement prediction (b2_aabbMultiplier), perimeter-based sibling choice, and Balance rotations.',
      'The insertion cost function, rotations, and tree quality problems with incremental updates.',
      'Top-down construction and incremental insertion.',
      'I3D 2012. Keeps the quality of an updated BVH with tree rotations.',
    ],
    params: {
      count: { label: 'Object count', group: 'Scene' },
      staticFrac: 'Static object ratio',
      speed: 'Move speed',
      mode: { label: 'Update method', group: 'Tree', options: { rebuild: 'Rebuild every frame (top-down)', incremental: 'Incremental fat AABB updates' } },
      margin: { label: 'Margin (px)', help: 'b2_aabbExtension in Box2D' },
      predict: { label: 'Displacement prediction multiplier', help: 'b2_aabbMultiplier in Box2D. 0 means off' },
      balance: 'Balance with rotations',
      showDepth: 'Internal node display depth',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    let n, x, y, vx, vy, hw, hh, isStatic, proxy, flash;
    // 노드 풀
    let cap = 0, lx, ly, ux, uy, parent, c1, c2, height, obj, free, freeTop, root = -1;
    let builtMode = null, stack = null;
    let st = { update: 0, query: 0, reinserts: 0, cand: 0, real: 0, visited: 0, height: 0, cost: 0 };
    let avgU = 0, avgQ = 0;
    const histU = [];

    function init() {
      ctx.rng = U.rng(ctx.seed);
      const r = ctx.rng;
      n = P.count;
      x = new Float64Array(n); y = new Float64Array(n); vx = new Float64Array(n); vy = new Float64Array(n);
      hw = new Float64Array(n); hh = new Float64Array(n); isStatic = new Uint8Array(n); proxy = new Int32Array(n); flash = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        hw[i] = r.range(1.5, 5); hh[i] = r.range(1.5, 5);
        x[i] = r.range(hw[i], ctx.width - hw[i]); y[i] = r.range(hh[i], ctx.height - hh[i]);
        isStatic[i] = r.chance(P.staticFrac) ? 1 : 0;
        const a = r.range(0, U.TAU), s = r.range(0.3, 1);
        vx[i] = Math.cos(a) * s; vy[i] = Math.sin(a) * s;
      }
      cap = 2 * n + 2;
      lx = new Float64Array(cap); ly = new Float64Array(cap); ux = new Float64Array(cap); uy = new Float64Array(cap);
      parent = new Int32Array(cap); c1 = new Int32Array(cap); c2 = new Int32Array(cap); height = new Int32Array(cap); obj = new Int32Array(cap);
      free = new Int32Array(cap);
      stack = new Int32Array(cap + 4); // 깊이 우선 탐색 스택. 트리가 한쪽으로 길어져도 넘치지 않음
      builtMode = null;
    }
    function resetPool() { for (let k = 0; k < cap; k++) free[k] = cap - 1 - k; freeTop = cap; root = -1; }
    function alloc() { const k = free[--freeTop]; parent[k] = c1[k] = c2[k] = -1; height[k] = 0; obj[k] = -1; return k; }
    function release(k) { free[freeTop++] = k; }
    const isLeaf = (k) => c1[k] === -1;
    const perim = (ax, ay, bx, by) => 2 * (bx - ax + by - ay);
    function refit(k) {
      const a = c1[k], b = c2[k];
      lx[k] = Math.min(lx[a], lx[b]); ly[k] = Math.min(ly[a], ly[b]);
      ux[k] = Math.max(ux[a], ux[b]); uy[k] = Math.max(uy[a], uy[b]);
      height[k] = 1 + Math.max(height[a], height[b]);
    }

    // ── Box2D b2DynamicTree::Balance 이식: A의 높이 차가 1보다 크면 자식을 위로 회전 ──
    function balance(iA) {
      if (isLeaf(iA) || height[iA] < 2) return iA;
      const iB = c1[iA], iC = c2[iA];
      const bal = height[iC] - height[iB];
      if (bal > 1) { // C를 위로
        const iF = c1[iC], iG = c2[iC];
        c1[iC] = iA; parent[iC] = parent[iA]; parent[iA] = iC;
        const p = parent[iC];
        if (p !== -1) { if (c1[p] === iA) c1[p] = iC; else c2[p] = iC; } else root = iC;
        if (height[iF] > height[iG]) { c2[iC] = iF; c2[iA] = iG; parent[iG] = iA; }
        else { c2[iC] = iG; c2[iA] = iF; parent[iF] = iA; }
        refit(iA); refit(iC);
        return iC;
      }
      if (bal < -1) { // B를 위로
        const iD = c1[iB], iE = c2[iB];
        c1[iB] = iA; parent[iB] = parent[iA]; parent[iA] = iB;
        const p = parent[iB];
        if (p !== -1) { if (c1[p] === iA) c1[p] = iB; else c2[p] = iB; } else root = iB;
        if (height[iD] > height[iE]) { c2[iB] = iD; c1[iA] = iE; parent[iE] = iA; }
        else { c2[iB] = iE; c1[iA] = iD; parent[iD] = iA; }
        refit(iA); refit(iB);
        return iB;
      }
      return iA;
    }
    function walkUp(k) {
      while (k !== -1) {
        if (P.balance) k = balance(k);
        refit(k);
        k = parent[k];
      }
    }

    // ── 삽입: 둘레 증가 비용이 가장 작은 형제를 찾아 내려감 (b2DynamicTree::InsertLeaf) ──
    function insertLeaf(leaf) {
      if (root === -1) { root = leaf; parent[leaf] = -1; return; }
      const Lx = lx[leaf], Ly = ly[leaf], Ux = ux[leaf], Uy = uy[leaf];
      let k = root;
      while (!isLeaf(k)) {
        const area = perim(lx[k], ly[k], ux[k], uy[k]);
        const comb = perim(Math.min(lx[k], Lx), Math.min(ly[k], Ly), Math.max(ux[k], Ux), Math.max(uy[k], Uy));
        const cost = 2 * comb, inh = 2 * (comb - area);
        const childCost = (ch) => {
          const p = perim(Math.min(lx[ch], Lx), Math.min(ly[ch], Ly), Math.max(ux[ch], Ux), Math.max(uy[ch], Uy));
          return (isLeaf(ch) ? p : p - perim(lx[ch], ly[ch], ux[ch], uy[ch])) + inh;
        };
        const k1 = childCost(c1[k]), k2 = childCost(c2[k]);
        if (cost < k1 && cost < k2) break;
        k = k1 < k2 ? c1[k] : c2[k];
      }
      const sib = k, oldP = parent[sib], np = alloc();
      parent[np] = oldP;
      if (oldP !== -1) { if (c1[oldP] === sib) c1[oldP] = np; else c2[oldP] = np; } else root = np;
      c1[np] = sib; c2[np] = leaf; parent[sib] = np; parent[leaf] = np;
      walkUp(np);
    }
    function removeLeaf(leaf) {
      if (leaf === root) { root = -1; return; }
      const p = parent[leaf], gp = parent[p], sib = c1[p] === leaf ? c2[p] : c1[p];
      if (gp !== -1) {
        if (c1[gp] === p) c1[gp] = sib; else c2[gp] = sib;
        parent[sib] = gp; release(p);
        walkUp(gp);
      } else { root = sib; parent[sib] = -1; release(p); }
    }

    function setFat(leaf, i, margin, mult, dx, dy) {
      lx[leaf] = x[i] - hw[i] - margin; ly[leaf] = y[i] - hh[i] - margin;
      ux[leaf] = x[i] + hw[i] + margin; uy[leaf] = y[i] + hh[i] + margin;
      if (dx < 0) lx[leaf] += dx * mult; else ux[leaf] += dx * mult;
      if (dy < 0) ly[leaf] += dy * mult; else uy[leaf] += dy * mult;
    }

    // ── 하향식 재구축: 중심을 긴 축으로 정렬해 반으로 나눔 ──
    let ids = null;
    function buildTD(lo, hi) {
      if (hi - lo === 1) {
        const i = ids[lo], k = alloc();
        obj[k] = i; proxy[i] = k; setFat(k, i, 0, 0, 0, 0);
        return k;
      }
      let ax = Infinity, ay = Infinity, bx = -Infinity, by = -Infinity;
      for (let q = lo; q < hi; q++) { const i = ids[q]; if (x[i] < ax) ax = x[i]; if (x[i] > bx) bx = x[i]; if (y[i] < ay) ay = y[i]; if (y[i] > by) by = y[i]; }
      const key = bx - ax >= by - ay ? x : y;
      ids.subarray(lo, hi).sort((a, b) => key[a] - key[b]);
      const mid = (lo + hi) >> 1, k = alloc();
      const a = buildTD(lo, mid), b = buildTD(mid, hi);
      c1[k] = a; c2[k] = b; parent[a] = k; parent[b] = k; refit(k);
      return k;
    }
    function rebuildTopDown() {
      resetPool();
      if (!ids || ids.length !== n) ids = new Int32Array(n);
      for (let i = 0; i < n; i++) ids[i] = i;
      root = buildTD(0, n); parent[root] = -1;
    }
    function rebuildIncremental() {
      resetPool();
      for (let i = 0; i < n; i++) { const k = alloc(); obj[k] = i; proxy[i] = k; setFat(k, i, P.margin, 0, 0, 0); insertLeaf(k); }
    }

    function queryAll() {
      let cand = 0, real = 0, visited = 0;
      for (let i = 0; i < n; i++) {
        const me = proxy[i], qlx = lx[me], qly = ly[me], qux = ux[me], quy = uy[me];
        let sp = 0; stack[sp++] = root;
        while (sp > 0) {
          const k = stack[--sp];
          visited++;
          if (ux[k] < qlx || lx[k] > qux || uy[k] < qly || ly[k] > quy) continue;
          if (isLeaf(k)) {
            const j = obj[k];
            if (j <= i) continue;
            cand++;
            if (Math.abs(x[i] - x[j]) < hw[i] + hw[j] && Math.abs(y[i] - y[j]) < hh[i] + hh[j]) real++;
          } else { stack[sp++] = c1[k]; stack[sp++] = c2[k]; }
        }
      }
      return { cand, real, visited };
    }
    function treeCost() {
      // 내부 노드 둘레 합 / 루트 둘레 (낮을수록 질의가 쌈)
      if (root === -1 || isLeaf(root)) return 0;
      let s = 0, sp = 0; stack[sp++] = root;
      while (sp > 0) { const k = stack[--sp]; if (isLeaf(k)) continue; s += perim(lx[k], ly[k], ux[k], uy[k]); stack[sp++] = c1[k]; stack[sp++] = c2[k]; }
      return s / perim(lx[root], ly[root], ux[root], uy[root]);
    }

    init();

    return {
      update(dt) {
        const W = ctx.width, H = ctx.height, sp = P.speed * dt;
        const dxs = new Float64Array(n), dys = new Float64Array(n);
        for (let i = 0; i < n; i++) {
          flash[i] = Math.max(0, flash[i] - dt * 3);
          if (isStatic[i]) continue;
          const ox = x[i], oy = y[i];
          x[i] += vx[i] * sp; y[i] += vy[i] * sp;
          if (x[i] < hw[i]) { x[i] = hw[i]; vx[i] = Math.abs(vx[i]); } else if (x[i] > W - hw[i]) { x[i] = W - hw[i]; vx[i] = -Math.abs(vx[i]); }
          if (y[i] < hh[i]) { y[i] = hh[i]; vy[i] = Math.abs(vy[i]); } else if (y[i] > H - hh[i]) { y[i] = H - hh[i]; vy[i] = -Math.abs(vy[i]); }
          dxs[i] = x[i] - ox; dys[i] = y[i] - oy;
        }
        const t0 = ctx.now();
        let reinserts = 0;
        if (P.mode === 'rebuild') { rebuildTopDown(); reinserts = n; builtMode = 'rebuild'; }
        else {
          if (builtMode !== 'incremental') { rebuildIncremental(); builtMode = 'incremental'; }
          for (let i = 0; i < n; i++) {
            if (isStatic[i]) continue;
            const k = proxy[i];
            // 실제 AABB가 fat AABB 안이면 그대로 둠 (b2DynamicTree::MoveProxy)
            if (x[i] - hw[i] >= lx[k] && y[i] - hh[i] >= ly[k] && x[i] + hw[i] <= ux[k] && y[i] + hh[i] <= uy[k]) continue;
            removeLeaf(k);
            setFat(k, i, P.margin, P.predict, dxs[i], dys[i]);
            insertLeaf(k);
            reinserts++; flash[i] = 1;
          }
        }
        const t1 = ctx.now();
        const q = queryAll();
        const t2 = ctx.now();
        avgU = avgU ? avgU * 0.9 + (t1 - t0) * 0.1 : t1 - t0;
        avgQ = avgQ ? avgQ * 0.9 + (t2 - t1) * 0.1 : t2 - t1;
        histU.push(t1 - t0); if (histU.length > 120) histU.shift();
        st = { reinserts, ...q, height: root >= 0 ? height[root] : 0, cost: treeCost() };
      },
      render() {
        ctx.clearStats();
        const g = ctx.g, W = ctx.width, col = ctx.side === 'a' ? C.a : C.b;
        if (root === -1) return;
        // 내부 노드 (깊이별 색)
        const showD = P.showDepth;
        if (showD > 0) {
          const dstack = [[root, 0]];
          const byDepth = Array.from({ length: showD }, () => []);
          while (dstack.length) {
            const [k, d] = dstack.pop();
            if (isLeaf(k) || d >= showD) continue;
            byDepth[d].push(k);
            dstack.push([c1[k], d + 1], [c2[k], d + 1]);
          }
          byDepth.forEach((list, d) => {
            g.beginPath();
            for (const k of list) g.rect(lx[k], ly[k], ux[k] - lx[k], uy[k] - ly[k]);
            g.strokeStyle = U.hsl(40 + d * 28, 70, 65, Math.max(0.15, 0.6 - d * 0.06)); g.lineWidth = 1; g.stroke();
          });
        }
        // 잎의 fat AABB
        if (P.mode === 'incremental') {
          g.beginPath();
          for (let i = 0; i < n; i++) if (!isStatic[i]) { const k = proxy[i]; g.rect(lx[k], ly[k], ux[k] - lx[k], uy[k] - ly[k]); }
          g.strokeStyle = 'rgba(79,195,247,0.3)'; g.lineWidth = 1; g.stroke();
        }
        // 오브젝트
        for (const s of [1, 0]) {
          g.beginPath();
          for (let i = 0; i < n; i++) if (isStatic[i] === s) g.rect(x[i] - hw[i], y[i] - hh[i], hw[i] * 2, hh[i] * 2);
          g.fillStyle = s ? 'rgba(160,168,184,0.55)' : col; g.fill();
        }
        g.beginPath();
        for (let i = 0; i < n; i++) if (flash[i] > 0.5) g.rect(x[i] - hw[i] - 1, y[i] - hh[i] - 1, hw[i] * 2 + 2, hh[i] * 2 + 2);
        g.strokeStyle = '#fff'; g.lineWidth = 1; g.stroke();
        // 마우스: 점을 덮는 노드 경로
        const m = ctx.input.mouse;
        if (m.inside) {
          let sp = 0, cnt = 0; stack[sp++] = root;
          g.beginPath();
          while (sp > 0) {
            const k = stack[--sp];
            if (m.x < lx[k] || m.x > ux[k] || m.y < ly[k] || m.y > uy[k]) continue;
            cnt++; g.rect(lx[k], ly[k], ux[k] - lx[k], uy[k] - ly[k]);
            if (!isLeaf(k)) { stack[sp++] = c1[k]; stack[sp++] = c2[k]; }
          }
          g.strokeStyle = C.warn; g.lineWidth = 1.5; g.stroke();
          D.text(g, GTL.L(`덮는 노드 ${cnt}개`, `${cnt} covering nodes`), m.x + 10, m.y - 16, { color: C.warn, size: 11 });
        }
        D.plot(g, histU, W - 170, 8, 160, 44, { min: 0, color: col, label: GTL.L(`트리 갱신 ${avgU.toFixed(2)} ms`, `Tree update ${avgU.toFixed(2)} ms`) });
        ctx.stat(GTL.L('트리 갱신 비용', 'Tree update cost'), avgU.toFixed(2) + ' ms');
        ctx.stat(GTL.L('질의 비용', 'Query cost'), avgQ.toFixed(2) + ' ms');
        ctx.stat(GTL.L('재삽입 수 (프레임당)', 'Reinserts (per frame)'), P.mode === 'rebuild' ? GTL.L(`전체 ${n}`, `All ${n}`) : st.reinserts);
        ctx.stat(GTL.L('트리 높이', 'Tree height'), st.height);
        ctx.stat(GTL.L('트리 비용 (내부 둘레 합 / 루트)', 'Tree cost (sum of internal perimeters / root)'), st.cost.toFixed(1));
        ctx.stat(GTL.L('방문 노드', 'Visited nodes'), st.visited.toLocaleString());
        ctx.stat(GTL.L('후보 쌍', 'Candidate pairs'), st.cand.toLocaleString());
        ctx.stat(GTL.L('실제 겹침 쌍', 'Real overlap pairs'), st.real.toLocaleString());
      },
    };
  },
});
