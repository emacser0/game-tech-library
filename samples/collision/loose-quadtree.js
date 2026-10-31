// 일반 쿼드트리 vs 느슨한 쿼드트리: 노드 경계에 걸친 오브젝트를 어디에 저장하는가
GTL.register({
  id: 'loose-quadtree',
  title: '느슨한 쿼드트리: 경계에 걸친 오브젝트',
  summary: '크기가 있는 오브젝트를 일반 쿼드트리에 넣으면 노드 경계에 걸친 것은 위쪽 큰 노드에 남음. 위쪽 노드의 오브젝트는 거의 모든 질의에서 검사됨. 노드 경계를 k배로 넓힌 느슨한 쿼드트리는 깊이가 크기로만 정해져 이 문제가 사라짐.',
  views: { a: '일반 쿼드트리', b: '느슨한 쿼드트리 (k=2)' },
  controls: '마우스: 가까운 오브젝트의 저장 노드 표시 (실선은 노드 경계, 점선은 느슨한 경계)',
  info: `
    <p>점은 항상 리프 하나에 들어감. 하지만 크기가 있는 오브젝트는 노드 경계에 걸칠 수 있음.
    일반 쿼드트리는 오브젝트를 <b>완전히 담는 가장 작은 노드</b>에 저장.</p>
    <ul>
      <li>작은 오브젝트도 루트의 중심선에 걸치면 루트에 저장됨</li>
      <li>루트에 있는 오브젝트는 모든 질의에서 검사됨. 위쪽 노드가 붐빌수록 질의가 느려짐.</li>
      <li>오브젝트가 경계를 넘나들 때마다 저장 노드가 크게 바뀜</li>
    </ul>
    <p><b>느슨한 쿼드트리</b>(loose quadtree)는 노드의 경계를 사방으로 넓힘. 넓힌 경계 = 원래 크기 × k.</p>
    <ul>
      <li>오브젝트는 중심이 들어 있는 노드에 저장. 경계는 넓힌 쪽으로 판정.</li>
      <li>k=2이면 반지름이 노드 크기의 절반 이하인 오브젝트는 위치와 관계없이 그 깊이에 들어감. 깊이가 크기로 정해지고, 위치에 따라 한 단계 더 깊이 들어갈 수 있을 뿐임.</li>
      <li>단점: 노드끼리 겹치므로 질의 영역이 넓어짐. 노드마다 넓힌 경계만큼 더 많은 노드를 방문.</li>
    </ul>
    <p>같은 생각을 깊이별 균일 그리드로 구현하면 <b>계층 그리드</b>(hierarchical grid)가 됨. 이 샘플도 깊이별 셀 배열로 트리를 표현.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 218" xmlns="http://www.w3.org/2000/svg">
    <text x="20" y="12" class="t-a">${L('A: 일반 쿼드트리', 'A: regular quadtree')}</text>
    <text x="297" y="12" class="t-b">${L('B: 느슨한 쿼드트리 (k=2)', 'B: loose quadtree (k=2)')}</text>
    <rect x="20" y="52" width="130" height="130" class="f-dim"/>
    <line x1="85" y1="52" x2="85" y2="182" class="d-dim"/><line x1="20" y1="117" x2="150" y2="117" class="d-dim"/>
    <rect x="20" y="52" width="130" height="130" class="d-a"/>
    <circle cx="80" cy="96" r="10" class="f-a"/>
    <text x="156" y="64" class="t-small t-a">${L('저장 노드: 루트', 'stored at: root')}</text>
    <rect x="330" y="52" width="130" height="130" class="f-dim"/>
    <line x1="395" y1="52" x2="395" y2="182" class="d-dim"/><line x1="330" y1="117" x2="460" y2="117" class="d-dim"/>
    <rect x="297.5" y="19.5" width="130" height="130" class="d-b" stroke-dasharray="5 4"/>
    <rect x="330" y="52" width="65" height="65" class="d-b"/>
    <circle cx="390" cy="96" r="10" class="f-b"/><circle cx="390" cy="96" r="2" class="f-accent"/>
    <text x="466" y="64" class="t-small t-b">${L('저장 노드:', 'stored at:')}</text>
    <text x="466" y="77" class="t-small t-b">${L('왼쪽 위 자식', 'NW child')}</text>
    <text x="20" y="198" class="t-small t-a">${L('중심선에 걸쳐 루트에 남음', 'Crosses the center line: stays at root')}</text>
    <text x="20" y="212" class="t-small t-dim">${L('루트의 오브젝트는 모든 질의에서 검사', 'Every query checks root objects')}</text>
    <text x="297" y="198" class="t-small t-b">${L('중심(점)이 든 자식에 저장', 'Stored in the child that holds its center')}</text>
    <text x="297" y="212" class="t-small t-dim">${L('점선 = 느슨한 경계 (노드 크기 × 2)', 'Dashed = loose bounds (node size × 2)')}</text>
  </svg>`,
  look: [
    '기본 상태에서 오른쪽 위 깊이 막대를 비교하면 A는 깊이 0~2(빨간색, 주황색)에도 오브젝트가 많음. B는 깊이 0~1이 비고 크기에 맞는 깊은 단계에 모임.',
    'A의 루트 중심선(가로, 세로 가운데 선) 위의 오브젝트는 작아도 빨간색. 루트에 저장된 것.',
    '"AABB 검사 수"를 비교하면 B가 훨씬 적음. 대신 B는 "방문 노드"가 더 많음. "충돌 쌍"은 두 뷰가 같음. 결과는 같고 비용만 다름.',
    '"깊이 변화량 합"을 비교하면 A가 큼. A는 경계를 넘는 순간 깊은 노드에서 루트까지 뛰어오름. B는 많아야 한 단계만 바뀜.',
    'B의 "느슨함 k"를 1로 낮추면 A와 같아짐. 3으로 올리면 깊이는 더 깊어지지만 방문 노드가 늘어남.',
  ],
  refs: [
    { type: 'book', title: 'Loose Octrees (Thatcher Ulrich), Game Programming Gems', year: 2000, note: '노드 경계를 k배로 넓힌 옥트리. k=2 권장, 크기로 깊이를 바로 계산.' },
    { type: 'book', title: 'Real-Time Collision Detection, 7.3.6 Loose Octrees, 7.2 Hierarchical Grids (Christer Ericson)', year: 2005 },
    { type: 'paper', title: 'Quad Trees: A Data Structure for Retrieval on Composite Keys (Finkel & Bentley)', year: 1974, note: 'Acta Informatica 4.' },
  ],
  params: [
    { key: 'count', label: '오브젝트 수', type: 'int', min: 100, max: 2500, default: 1500, shared: true, reset: true, group: '장면' },
    { key: 'maxSize', label: '최대 크기 (px)', type: 'range', min: 4, max: 60, step: 1, default: 24, shared: true, reset: true, help: '오브젝트 크기는 3px~최대 크기 사이에서 고름' },
    { key: 'speed', label: '이동 속도', type: 'range', min: 0, max: 120, step: 1, default: 30, shared: true },
    { key: 'maxDepth', label: 'max depth', type: 'int', min: 2, max: 8, default: 5, shared: true },
    { key: 'kind', label: '트리 종류', type: 'select', group: '공간 분할', options: [
      { value: 'tight', label: '일반 쿼드트리' },
      { value: 'loose', label: '느슨한 쿼드트리' },
    ], a: 'tight', b: 'loose', default: 'tight' },
    { key: 'k', label: '느슨함 k', type: 'range', min: 1, max: 3, step: 0.1, default: 2, help: '노드 경계를 넓히는 배율', when: (p) => p.kind === 'loose' },
    { key: 'showNodes', label: '노드 표시', type: 'bool', default: true },
  ],
  en: {
    title: 'Loose Quadtree: Objects on Cell Boundaries',
    summary: 'When you put objects with size into a normal quadtree, the ones that cross a node boundary stay in a large node near the top. Objects in top nodes get tested in almost every query. A loose quadtree widens node bounds by k times. Depth then depends only on size, and the problem goes away.',
    views: { a: 'Normal quadtree', b: 'Loose quadtree (k=2)' },
    controls: 'Mouse: show the storage node of the nearest object (solid line is the node bound, dashed line is the loose bound)',
    info: `
    <p>A point always fits in one leaf. But an object with size can cross a node boundary.
    A normal quadtree stores an object in <b>the smallest node that fully contains it</b>.</p>
    <ul>
      <li>Even a small object goes into the root if it crosses the root's center line.</li>
      <li>Objects in the root are tested in every query. The more crowded the top nodes, the slower the queries.</li>
      <li>Each time an object crosses a boundary, its storage node changes a lot.</li>
    </ul>
    <p>A <b>loose quadtree</b> widens each node's bounds on all sides. Widened bound = original size × k.</p>
    <ul>
      <li>Store an object in the node that contains its center. Check the fit against the widened bounds.</li>
      <li>With k=2, an object whose radius is at most half the node size fits at that depth, no matter where it is. Size sets the depth, and position can only push it one level deeper.</li>
      <li>Downside: nodes overlap, so queries cover a wider area. Each node's widened bound means more nodes to visit.</li>
    </ul>
    <p>If you build the same idea with a uniform grid per depth, you get a <b>hierarchical grid</b>. This sample also stores the tree as one cell array per depth.</p>`,
    look: [
      'In the default state, compare the depth bars at the top right. A has many objects at depths 0~2 too (red, orange). B has empty depths 0~1, and objects gather at deeper levels that fit their size.',
      'Objects on A\'s root center lines (the middle horizontal and vertical lines) are red, even small ones. They are stored in the root.',
      'Compare "AABB tests". B has far fewer. But B has more "Visited nodes". "Colliding pairs" is the same in both views. The result is the same; only the cost differs.',
      'Compare "Total depth change". A is larger. In A, an object jumps from a deep node up to the root the moment it crosses a boundary. In B it changes by one level at most.',
      'Lower B\'s "Looseness k" to 1. It becomes the same as A. Raise it to 3. Depth gets deeper, but visited nodes go up.',
    ],
    refs: [
      'An octree with node bounds widened by k times. k=2 is recommended, and depth comes straight from size.',
      null,
      null,
    ],
    params: {
      count: { label: 'Object count', group: 'Scene' },
      maxSize: { label: 'Max size (px)', help: 'Object size is picked between 3 px and the max size' },
      speed: 'Move speed',
      kind: { label: 'Tree type', group: 'Spatial partition', options: { tight: 'Normal quadtree', loose: 'Loose quadtree' } },
      k: { label: 'Looseness k', help: 'Factor that widens node bounds' },
      showNodes: 'Show nodes',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const MAXL = 8;
    const offs = [0];
    for (let L = 0; L <= MAXL; L++) offs.push(offs[L] + (1 << L) * (1 << L));
    const NN = offs[MAXL + 1];
    const own = new Int32Array(NN + 1), sub = new Int32Array(NN), start = new Int32Array(NN + 1);
    let n, x, y, vx, vy, hw, hh, node, prev, prevL, lvl, list;
    let S = 1;
    let st = { tests: 0, visited: 0, pairs: 0, moved: 0, shallow: 0, avgDepth: 0, ms: 0, hist: [] };
    let msAvg = 0;

    function init() {
      ctx.rng = U.rng(ctx.seed);
      const r = ctx.rng;
      n = P.count;
      x = new Float32Array(n); y = new Float32Array(n); vx = new Float32Array(n); vy = new Float32Array(n);
      hw = new Float32Array(n); hh = new Float32Array(n);
      node = new Int32Array(n); prev = new Int32Array(n).fill(-1); prevL = new Int8Array(n).fill(-1); lvl = new Uint8Array(n); list = new Int32Array(n);
      for (let i = 0; i < n; i++) {
        const sz = r.range(3, Math.max(3.5, P.maxSize));
        hw[i] = sz * r.range(0.35, 0.65); hh[i] = sz - hw[i];
        x[i] = r.range(hw[i], ctx.width - hw[i]); y[i] = r.range(hh[i], ctx.height - hh[i]);
        const a = r.range(0, U.TAU), s = r.range(0.3, 1);
        vx[i] = Math.cos(a) * s; vy[i] = Math.sin(a) * s;
      }
    }
    init();

    const margin = (s) => (P.kind === 'loose' ? ((P.k - 1) * s) / 2 : 0);

    // 오브젝트를 담는 가장 깊은 노드를 찾음 (중심이 든 셀 + 넓힌 경계로 판정)
    function place(i, maxD) {
      for (let L = maxD; L >= 0; L--) {
        const N = 1 << L, s = S / N, m = margin(s);
        const cx = U.clamp(Math.floor(x[i] / s), 0, N - 1), cy = U.clamp(Math.floor(y[i] / s), 0, N - 1);
        if (L === 0 || (x[i] - hw[i] >= cx * s - m && x[i] + hw[i] <= (cx + 1) * s + m && y[i] - hh[i] >= cy * s - m && y[i] + hh[i] <= (cy + 1) * s + m)) {
          lvl[i] = L;
          return offs[L] + cy * N + cx;
        }
      }
      return 0;
    }

    function build() {
      const maxD = P.maxDepth;
      S = Math.max(ctx.width, ctx.height);
      own.fill(0, 0, offs[maxD + 1] + 1);
      let moved = 0, relevel = 0;
      for (let i = 0; i < n; i++) {
        node[i] = place(i, maxD);
        if (prev[i] >= 0 && prev[i] !== node[i]) moved++;
        if (prevL[i] >= 0) relevel += Math.abs(prevL[i] - lvl[i]);
        prev[i] = node[i]; prevL[i] = lvl[i];
        own[node[i]]++;
      }
      // 노드별 연속 배열 (카운팅 정렬)
      let acc = 0;
      for (let k = 0; k < offs[maxD + 1]; k++) { start[k] = acc; acc += own[k]; }
      start[offs[maxD + 1]] = acc;
      const fillPos = start.slice(0, offs[maxD + 1]);
      for (let i = 0; i < n; i++) list[fillPos[node[i]]++] = i;
      // 서브트리 개수 (빈 서브트리는 질의에서 통째로 건너뜀)
      for (let L = maxD; L >= 0; L--) {
        const N = 1 << L;
        for (let cy = 0; cy < N; cy++) for (let cx = 0; cx < N; cx++) {
          const id = offs[L] + cy * N + cx;
          let c = own[id];
          if (L < maxD) {
            const N2 = N * 2, b = offs[L + 1] + cy * 2 * N2 + cx * 2;
            c += sub[b] + sub[b + 1] + sub[b + N2] + sub[b + N2 + 1];
          }
          sub[id] = c;
        }
      }
      return { moved, relevel };
    }

    const stackL = new Int32Array(256), stackX = new Int32Array(256), stackY = new Int32Array(256);
    function queryAll() {
      const maxD = P.maxDepth;
      let tests = 0, visited = 0, pairs = 0;
      for (let i = 0; i < n; i++) {
        const x0 = x[i] - hw[i], x1 = x[i] + hw[i], y0 = y[i] - hh[i], y1 = y[i] + hh[i];
        let sp = 0;
        stackL[0] = 0; stackX[0] = 0; stackY[0] = 0; sp = 1;
        while (sp > 0) {
          sp--;
          const L = stackL[sp], cx = stackX[sp], cy = stackY[sp], N = 1 << L, id = offs[L] + cy * N + cx;
          if (sub[id] === 0) continue;
          const s = S / N, m = margin(s);
          if (x1 < cx * s - m || x0 > (cx + 1) * s + m || y1 < cy * s - m || y0 > (cy + 1) * s + m) continue;
          visited++;
          for (let q = start[id], e = start[id + 1]; q < e; q++) {
            const j = list[q];
            if (j <= i) continue;
            tests++;
            if (Math.abs(x[i] - x[j]) < hw[i] + hw[j] && Math.abs(y[i] - y[j]) < hh[i] + hh[j]) pairs++;
          }
          if (L < maxD) for (let c = 0; c < 4; c++) { stackL[sp] = L + 1; stackX[sp] = cx * 2 + (c & 1); stackY[sp] = cy * 2 + (c >> 1); sp++; }
        }
      }
      return { tests, visited, pairs };
    }

    return {
      update(dt) {
        const W = ctx.width, H = ctx.height, sp = P.speed * dt;
        for (let i = 0; i < n; i++) {
          x[i] += vx[i] * sp; y[i] += vy[i] * sp;
          if (x[i] < hw[i]) { x[i] = hw[i]; vx[i] = Math.abs(vx[i]); } else if (x[i] > W - hw[i]) { x[i] = W - hw[i]; vx[i] = -Math.abs(vx[i]); }
          if (y[i] < hh[i]) { y[i] = hh[i]; vy[i] = Math.abs(vy[i]); } else if (y[i] > H - hh[i]) { y[i] = H - hh[i]; vy[i] = -Math.abs(vy[i]); }
        }
        const t0 = ctx.now();
        const b = build();
        const q = queryAll();
        const ms = ctx.now() - t0;
        msAvg = msAvg ? msAvg * 0.9 + ms * 0.1 : ms;
        const hist = new Array(P.maxDepth + 1).fill(0);
        let sumD = 0;
        for (let i = 0; i < n; i++) { hist[lvl[i]]++; sumD += lvl[i]; }
        st = { ...q, moved: b.moved, relevel: b.relevel, hist, shallow: hist[0] + (hist[1] || 0), avgDepth: sumD / n };
      },
      render() {
        ctx.clearStats();
        const g = ctx.g, W = ctx.width, maxD = P.maxDepth;
        const depthCol = (L) => U.hsl(U.remap(L, 0, Math.max(1, maxD), 0, 200), 80, 60, 0.85);
        // 비어 있지 않은 노드의 원래 경계
        if (P.showNodes && st.hist.length) {
          g.beginPath();
          for (let L = 0; L <= maxD; L++) {
            const N = 1 << L, s = S / N;
            for (let k = 0; k < N * N; k++) if (sub[offs[L] + k] > 0 && L < maxD) {
              const cx = k % N, cy = (k / N) | 0;
              g.moveTo((cx + 0.5) * s, cy * s); g.lineTo((cx + 0.5) * s, (cy + 1) * s);
              g.moveTo(cx * s, (cy + 0.5) * s); g.lineTo((cx + 1) * s, (cy + 0.5) * s);
            }
          }
          g.strokeStyle = 'rgba(255,255,255,0.09)'; g.lineWidth = 1; g.stroke();
        }
        // 깊이별 색으로 오브젝트 그리기
        for (let L = 0; L <= maxD; L++) {
          g.beginPath();
          for (let i = 0; i < n; i++) if (lvl[i] === L) g.rect(x[i] - hw[i], y[i] - hh[i], hw[i] * 2, hh[i] * 2);
          g.fillStyle = depthCol(L); g.fill();
        }
        // 마우스 근처 오브젝트의 저장 노드
        const m = ctx.input.mouse;
        if (m.inside) {
          let best = -1, bd = 900;
          for (let i = 0; i < n; i++) { const d = (x[i] - m.x) ** 2 + (y[i] - m.y) ** 2; if (d < bd) { bd = d; best = i; } }
          if (best >= 0) {
            const L = lvl[best], N = 1 << L, s = S / N, k = node[best] - offs[L], cx = k % N, cy = (k / N) | 0, mg = margin(s);
            D.rect(g, cx * s, cy * s, s, s, null, C.warn, 2);
            if (mg > 0) { g.setLineDash([5, 4]); D.rect(g, cx * s - mg, cy * s - mg, s + mg * 2, s + mg * 2, null, C.warn, 1.5); g.setLineDash([]); }
            D.rect(g, x[best] - hw[best], y[best] - hh[best], hw[best] * 2, hh[best] * 2, null, '#fff', 2);
            D.text(g, GTL.L(`깊이 ${L}`, `Depth ${L}`), x[best] + hw[best] + 6, y[best] - 6, { color: C.warn, size: 11 });
          }
        }
        // 깊이 막대
        if (st.hist.length) {
          const bw = 14, bh = 50, bx = W - (maxD + 1) * (bw + 3) - 10, by = 10;
          D.rect(g, bx - 6, by - 4, (maxD + 1) * (bw + 3) + 9, bh + 22, 'rgba(0,0,0,0.5)', null);
          const mx = Math.max(1, ...st.hist);
          st.hist.forEach((c, L) => {
            const h = (c / mx) * bh;
            D.rect(g, bx + L * (bw + 3), by + bh - h, bw, h, depthCol(L), null);
            D.text(g, String(L), bx + L * (bw + 3) + bw / 2, by + bh + 3, { size: 10, color: C.dim, align: 'center' });
          });
        }
        ctx.stat(GTL.L('깊이 0~1에 저장된 오브젝트', 'Objects stored at depth 0~1'), st.shallow);
        ctx.stat(GTL.L('평균 저장 깊이', 'Average storage depth'), st.avgDepth.toFixed(2));
        ctx.stat(GTL.L('AABB 검사 수', 'AABB tests'), st.tests.toLocaleString());
        ctx.stat(GTL.L('방문 노드', 'Visited nodes'), st.visited.toLocaleString());
        ctx.stat(GTL.L('깊이 변화량 합 (프레임당)', 'Total depth change (per frame)'), st.relevel);
        ctx.stat(GTL.L('노드 이동 (프레임당)', 'Node moves (per frame)'), st.moved);
        ctx.stat(GTL.L('충돌 쌍', 'Colliding pairs'), st.pairs);
        ctx.stat(GTL.L('빌드 + 질의', 'Build + query'), msAvg.toFixed(2) + ' ms');
      },
    };
  },
});
