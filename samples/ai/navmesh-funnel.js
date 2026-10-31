// 내비메시 경로: 폴리곤 중심 / 포털 중점 vs 퍼널 알고리즘 (Simple Stupid Funnel Algorithm)
GTL.register({
  id: 'navmesh-funnel',
  title: '내비메시 경로: 폴리곤 중심 vs 퍼널 알고리즘',
  summary: '같은 내비메시와 같은 폴리곤 통로(corridor)에서 실제 이동 경로를 만드는 방식을 비교. 폴리곤 중심이나 포털 중점을 이으면 지그재그로 돌아감. 퍼널 알고리즘은 통로 안에서 가장 짧은 경로를 구해 모서리만 스치며 지나감.',
  views: { a: '폴리곤 중심 경유', b: '퍼널 알고리즘' },
  controls: '마우스 클릭: 목표 지정 (출발점은 이전 목표). 클릭하지 않으면 3초마다 새 질의',
  info: `
    <p><b>내비메시(navigation mesh)</b>: 걸을 수 있는 바닥을 볼록 다각형(폴리곤)으로 덮은 자료구조. 여기서는 빈 칸을 큰 직사각형으로 합쳐 만듦. 이웃 폴리곤이 맞닿은 변을 <b>포털</b>이라 부름.</p>
    <p>길찾기는 2단계로 나뉨</p>
    <ol>
      <li><b>통로 찾기</b>: 폴리곤을 노드로 A*를 돌려 지나갈 폴리곤 목록(통로)을 얻음. 그리드보다 노드가 훨씬 적음.</li>
      <li><b>경로 만들기</b>: 통로 안에서 실제로 걸을 점 목록을 만듦. 이 샘플이 비교하는 부분.</li>
    </ol>
    <ul>
      <li><b>폴리곤 중심</b>: 중심 → 포털 중점 → 다음 중심. 항상 통로 안에 있지만 크게 지그재그.</li>
      <li><b>포털 중점</b>: 포털 가운데만 이음. 조금 낫지만 넓은 포털에서 여전히 돌아감.</li>
      <li><b>퍼널(funnel)</b>: 현재 꼭짓점(apex)에서 다음 포털 양 끝으로 깔때기를 만듦. 포털을 하나씩 보며 깔때기를 좁힘. 왼쪽과 오른쪽이 엇갈리면 그 모서리를 경로 점으로 확정하고 거기서 다시 시작. 결과는 통로 안의 최단 경로.</li>
    </ul>
    <p>퍼널의 한계: 통로 안에서만 최단임. A*가 고른 통로가 최선이 아니면 경로도 최선이 아님. 에이전트 반지름만큼 포털을 줄여야 벽에 몸이 닿지 않음.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 218" xmlns="http://www.w3.org/2000/svg">
    <text x="20" y="16" class="t-small t-dim">${L('A*가 고른 통로 (볼록 폴리곤 4개)', 'corridor from A* (4 convex polygons)')}</text>
    <rect x="20" y="90" width="120" height="80" class="f-dim"/>
    <rect x="140" y="24" width="120" height="106" class="f-dim"/>
    <rect x="260" y="24" width="120" height="56" class="f-dim"/>
    <rect x="380" y="24" width="140" height="146" class="f-dim"/>
    <line x1="140" y1="90" x2="140" y2="130" class="d-accent" stroke-dasharray="4 3"/>
    <line x1="260" y1="24" x2="260" y2="80" class="d-accent" stroke-dasharray="4 3"/>
    <line x1="380" y1="24" x2="380" y2="80" class="d-accent" stroke-dasharray="4 3"/>
    <line x1="140" y1="130" x2="260" y2="24" class="d-dim" stroke-dasharray="3 3"/>
    <line x1="140" y1="130" x2="260" y2="80" class="d-dim" stroke-dasharray="3 3"/>
    <polyline points="40,150 140,110 200,77 260,52 320,52 380,52 450,97 500,150" class="d-a"/>
    ${[[140, 110], [200, 77], [260, 52], [320, 52], [380, 52], [450, 97]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" class="f-a"/>`).join('')}
    <polyline points="40,150 140,130 260,80 380,80 500,150" class="d-b"/>
    ${[[140, 130], [260, 80], [380, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" class="f-b"/>`).join('')}
    <circle cx="40" cy="150" r="5" class="f-good"/><circle cx="500" cy="150" r="5" class="f-good"/>
    <text x="50" y="164" class="t-small">${L('출발', 'start')}</text>
    <text x="490" y="164" text-anchor="end" class="t-small">${L('목표', 'goal')}</text>
    <text x="146" y="146" class="t-small t-dim">${L('꼭짓점 (apex)', 'apex')}</text>
    <line x1="20" y1="188" x2="40" y2="188" class="d-a"/>
    <text x="46" y="192" class="t-a">${L('A: 폴리곤 중심 경유, 지그재그', 'A: via polygon centers, zigzag')}</text>
    <line x1="280" y1="188" x2="300" y2="188" class="d-b"/>
    <text x="306" y="192" class="t-b">${L('B: 퍼널, 모서리에서만 꺾임', 'B: funnel, turns only at corners')}</text>
    <line x1="20" y1="206" x2="40" y2="206" class="d-accent" stroke-dasharray="4 3"/>
    <text x="46" y="210" class="t-small t-dim">${L('포털: 두 폴리곤이 맞닿은 변', 'portal: edge shared by two polygons')}</text>
    <line x1="280" y1="206" x2="300" y2="206" class="d-dim" stroke-dasharray="3 3"/>
    <text x="306" y="210" class="t-small t-dim">${L('깔때기: 좌우가 엇갈리면 모서리 확정', 'funnel: sides cross, so fix a corner')}</text>
  </svg>`,
  look: [
    'A의 경로는 폴리곤마다 가운데로 꺾여 들어감. B는 장애물 모서리 몇 곳에서만 꺾임. "꺾인 점 수"와 "퍼널 대비 길이"를 비교.',
    'A를 "포털 중점"으로 바꾸면 길이가 줄지만 넓은 포털에서 여전히 지그재그',
    '"에이전트 반지름"을 0으로 하면 B의 경로가 모서리에 딱 붙음. 키우면 모서리에서 그만큼 떨어져 지나감.',
    'B의 "포털 표시"에서 초록은 왼쪽 끝, 빨강은 오른쪽 끝. 깔때기가 좁아지다 엇갈리는 곳에 경로 점이 생김.',
  ],
  refs: [
    { type: 'article', title: 'Simple Stupid Funnel Algorithm', url: 'http://digestingduck.blogspot.com/2010/03/simple-stupid-funnel-algorithm.html', year: 2010, note: 'Mikko Mononen. 이 샘플의 퍼널 구현이 따르는 방식.' },
    { type: 'code', title: 'Recast & Detour', url: 'https://github.com/recastnavigation/recastnavigation', note: 'Mikko Mononen. 내비메시 생성(Recast)과 통로 탐색, findStraightPath(Detour). Unity, Unreal 등에서 씀.' },
    { type: 'paper', title: 'Euclidean Shortest Paths in the Presence of Rectilinear Barriers', year: 1984, note: 'D. T. Lee, F. P. Preparata. Networks 14(3). 퍼널 알고리즘의 출발점.' },
    { type: 'book', title: 'Simplified 3D Movement and Pathfinding Using Navigation Meshes', year: 2000, note: 'Greg Snook. Game Programming Gems 1. 게임용 내비메시 소개.' },
  ],
  params: [
    { key: 'method', label: '경로 만들기', type: 'select', group: '경로', options: [
      { value: 'center', label: '폴리곤 중심 경유' },
      { value: 'portal', label: '포털 중점 경유' },
      { value: 'funnel', label: '퍼널 알고리즘 (SSFA)' },
    ], a: 'center', b: 'funnel' },
    { key: 'radius', label: '에이전트 반지름', type: 'range', min: 0, max: 14, step: 1, default: 6, shared: true },
    { key: 'showMesh', label: '폴리곤 경계 표시', type: 'bool', default: true },
    { key: 'showPortals', label: '포털 표시', type: 'bool', default: true },
    { key: 'interval', label: '자동 질의 간격 (s)', type: 'range', min: 1, max: 10, step: 0.5, default: 3, shared: true, group: '장면' },
    { key: 'blocks', label: '장애물 수', type: 'int', min: 4, max: 40, default: 22, shared: true, reset: true },
  ],
  en: {
    title: 'Navmesh Paths: Polygon Centers vs Funnel Algorithm',
    summary: 'Compares ways to build the actual movement path from the same navmesh and the same polygon corridor. Linking polygon centers or portal midpoints makes a zigzag detour. The funnel algorithm finds the shortest path inside the corridor and only grazes corners.',
    views: { a: 'Via polygon centers', b: 'Funnel algorithm' },
    controls: 'Mouse click: set the goal (the start is the previous goal). Without clicks, a new query runs every 3 seconds.',
    info: `
    <p>A <b>navigation mesh (navmesh)</b> covers the walkable floor with convex polygons. Here it merges empty cells into large rectangles. The shared edge between two neighbor polygons is called a <b>portal</b>.</p>
    <p>Pathfinding has 2 steps.</p>
    <ol>
      <li><b>Find the corridor</b>: run A* with polygons as nodes. You get the list of polygons to pass (the corridor). There are far fewer nodes than in a grid.</li>
      <li><b>Build the path</b>: make the list of points to walk inside the corridor. This sample compares this step.</li>
    </ol>
    <ul>
      <li><b>Polygon centers</b>: center, then portal midpoint, then the next center. The path always stays in the corridor, but it zigzags a lot.</li>
      <li><b>Portal midpoints</b>: links only portal midpoints. It is a bit better, but it still detours at wide portals.</li>
      <li><b>Funnel</b>: builds a funnel from the current corner (apex) to both ends of the next portal. It checks portals one by one and narrows the funnel. When the left and right sides cross, it fixes that corner as a path point and starts again from there. The result is the shortest path inside the corridor.</li>
    </ul>
    <p>Limits of the funnel: it is shortest only inside the corridor. If the corridor that A* picked is not the best, the path is not the best either. You must shrink portals by the agent radius so the body does not touch walls.</p>`,
    look: [
      'A\'s path turns into the middle of every polygon. B turns only at a few obstacle corners. Compare "Turn points" and "Length vs funnel".',
      'Switch A to "Via portal midpoints". The length drops, but the path still zigzags at wide portals.',
      'Set "Agent radius" to 0. B\'s path hugs the corners. Raise it and the path passes that far from the corners.',
      'In B\'s "Show portals", green is the left end and red is the right end. A path point appears where the funnel narrows and then crosses.',
    ],
    refs: [
      'Mikko Mononen. The funnel method this sample follows.',
      'Mikko Mononen. Navmesh building (Recast), corridor search and findStraightPath (Detour). Used in Unity, Unreal and others.',
      'D. T. Lee, F. P. Preparata. Networks 14(3). The origin of the funnel algorithm.',
      'Greg Snook. Game Programming Gems 1. Introduces navmeshes for games.',
    ],
    params: {
      method: { label: 'Path building', group: 'Path', options: { center: 'Via polygon centers', portal: 'Via portal midpoints', funnel: 'Funnel algorithm (SSFA)' } },
      radius: 'Agent radius',
      showMesh: 'Show polygon edges',
      showPortals: 'Show portals',
      interval: { label: 'Auto query interval (s)', group: 'Scene' },
      blocks: 'Obstacle count',
    },
  },

  setup(ctx) {
    const U = GTL.util, V = U.v2, D = U.draw, C = U.colors, P = ctx.params;
    const CS = 20, GW = 40, GH = 24, WW = GW * CS, WH = GH * CS;
    const grid = new Uint8Array(GW * GH);
    const id = (x, y) => y * GW + x;
    // ── 장애물 배치 ──
    {
      const r = U.rng(ctx.seed * 61 + 13);
      for (let k = 0; k < P.blocks; k++) {
        const w = r.int(1, 5), h = r.int(1, 5), x0 = r.int(1, GW - w - 1), y0 = r.int(1, GH - h - 1);
        for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) grid[id(x, y)] = 1;
      }
      // 가장 큰 연결 영역만 남김
      const comp = new Int32Array(GW * GH).fill(-1); let best = 0, bestN = 0, cid = 0;
      for (let i = 0; i < grid.length; i++) {
        if (grid[i] || comp[i] >= 0) continue;
        const q = [i]; comp[i] = cid; let n = 0;
        while (q.length) {
          const c = q.pop(); n++;
          const x = c % GW, y = (c / GW) | 0;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
            const j = id(nx, ny);
            if (!grid[j] && comp[j] < 0) { comp[j] = cid; q.push(j); }
          }
        }
        if (n > bestN) { bestN = n; best = cid; }
        cid++;
      }
      for (let i = 0; i < grid.length; i++) if (!grid[i] && comp[i] !== best) grid[i] = 1;
    }
    // ── 내비메시: 빈 칸을 큰 직사각형으로 탐욕 병합 ──
    const owner = new Int32Array(GW * GH).fill(-1);
    const polys = [];
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      if (grid[id(x, y)] || owner[id(x, y)] >= 0) continue;
      let w = 1; while (x + w < GW && !grid[id(x + w, y)] && owner[id(x + w, y)] < 0) w++;
      let h = 1;
      outer: while (y + h < GH) { for (let k = 0; k < w; k++) if (grid[id(x + k, y + h)] || owner[id(x + k, y + h)] >= 0) break outer; h++; }
      const pi = polys.length;
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) owner[id(xx, yy)] = pi;
      polys.push({ x: x * CS, y: y * CS, w: w * CS, h: h * CS, c: V((x + w / 2) * CS, (y + h / 2) * CS), nb: [] });
    }
    // 포털: 맞닿은 변의 겹치는 구간
    for (let i = 0; i < polys.length; i++) for (let j = i + 1; j < polys.length; j++) {
      const a = polys[i], b = polys[j];
      let p = null, q = null;
      if (a.x + a.w === b.x || b.x + b.w === a.x) {
        const x = a.x + a.w === b.x ? b.x : a.x, y0 = Math.max(a.y, b.y), y1 = Math.min(a.y + a.h, b.y + b.h);
        if (y1 > y0) { p = V(x, y0); q = V(x, y1); }
      } else if (a.y + a.h === b.y || b.y + b.h === a.y) {
        const y = a.y + a.h === b.y ? b.y : a.y, x0 = Math.max(a.x, b.x), x1 = Math.min(a.x + a.w, b.x + b.w);
        if (x1 > x0) { p = V(x0, y); q = V(x1, y); }
      }
      if (p) { a.nb.push({ to: j, p, q }); b.nb.push({ to: i, p, q }); }
    }
    const polyAt = (pt) => { const x = Math.floor(pt.x / CS), y = Math.floor(pt.y / CS); return x < 0 || y < 0 || x >= GW || y >= GH ? -1 : owner[id(x, y)]; };

    // ── 폴리곤 A* (중심 사이 거리) ──
    let expanded = 0;
    function corridor(s, t, sp, tp) {
      const g = new Float64Array(polys.length).fill(Infinity), par = new Int32Array(polys.length).fill(-1), closed = new Uint8Array(polys.length);
      const pos = (i) => (i === s ? sp : polys[i].c);
      g[s] = 0; const open = [s]; expanded = 0;
      while (open.length) {
        let bi = 0;
        for (let k = 1; k < open.length; k++) if (g[open[k]] + V.dist(pos(open[k]), tp) < g[open[bi]] + V.dist(pos(open[bi]), tp)) bi = k;
        const u = open.splice(bi, 1)[0];
        if (closed[u]) continue;
        closed[u] = 1; expanded++;
        if (u === t) break;
        for (const e of polys[u].nb) {
          if (closed[e.to]) continue;
          const ng = g[u] + V.dist(pos(u), e.to === t ? tp : polys[e.to].c);
          if (ng < g[e.to]) { g[e.to] = ng; par[e.to] = u; open.push(e.to); }
        }
      }
      if (s !== t && par[t] < 0) return null;
      const list = []; for (let u = t; u >= 0; u = par[u]) list.push(u);
      return list.reverse();
    }

    // 포털 목록 (이동 방향 기준 왼쪽, 오른쪽). 반지름만큼 양 끝을 안으로 줄임
    function portalsOf(list, sp, tp) {
      const out = [{ l: sp, r: sp }];
      for (let k = 0; k + 1 < list.length; k++) {
        const a = polys[list[k]], e = a.nb.find((n) => n.to === list[k + 1]);
        let p = e.p, q = e.q;
        const L = V.dist(p, q), rad = Math.min(P.radius, L / 2 - 0.01);
        if (rad > 0) { const d = V.scale(V.sub(q, p), 1 / L); p = V.add(p, V.scale(d, rad)); q = V.sub(q, V.scale(d, rad)); }
        // 이동 방향: 이 폴리곤 중심에서 포털 중점으로
        const mid = V.lerp(p, q, 0.5), dir = V.sub(mid, a.c);
        // 화면 좌표(y 아래)에서 cross < 0 이면 진행 방향의 왼쪽
        const cr = dir.x * (p.y - mid.y) - dir.y * (p.x - mid.x);
        out.push(cr < 0 ? { l: q, r: p } : { l: p, r: q });
      }
      out.push({ l: tp, r: tp });
      return out;
    }
    // Simple Stupid Funnel Algorithm (Mononen 2010)
    let funnelIters = 0;
    function funnel(portals) {
      const tri = (a, b, c) => { const ax = b.x - a.x, ay = b.y - a.y, bx = c.x - a.x, by = c.y - a.y; return bx * ay - ax * by; };
      const eq = (a, b) => V.distSq(a, b) < 1e-6;
      const pts = [portals[0].l];
      let apex = portals[0].l, left = portals[0].l, right = portals[0].r, ai = 0, li = 0, ri = 0;
      funnelIters = 0;
      for (let i = 1; i < portals.length; i++) {
        if (++funnelIters > 10000) break;
        const l = portals[i].l, r = portals[i].r;
        // 오른쪽 갱신
        if (tri(apex, right, r) <= 0) {
          if (eq(apex, right) || tri(apex, left, r) > 0) { right = r; ri = i; }
          else { pts.push(left); apex = left; ai = li; left = apex; right = apex; li = ai; ri = ai; i = ai; continue; }
        }
        // 왼쪽 갱신
        if (tri(apex, left, l) >= 0) {
          if (eq(apex, left) || tri(apex, right, l) < 0) { left = l; li = i; }
          else { pts.push(right); apex = right; ai = ri; left = apex; right = apex; li = ai; ri = ai; i = ai; continue; }
        }
      }
      const last = portals[portals.length - 1].l;
      if (!eq(pts[pts.length - 1], last)) pts.push(last);
      return pts;
    }
    function buildPath(method, list, portals, sp, tp) {
      if (method === 'funnel') return funnel(portals);
      const pts = [sp];
      for (let k = 1; k < portals.length - 1; k++) {
        const m = V.lerp(portals[k].l, portals[k].r, 0.5);
        if (method === 'center' && k > 1) pts.push(polys[list[k - 1]].c);
        pts.push(m);
      }
      pts.push(tp);
      return pts;
    }
    const lenOf = (pts) => { let L = 0; for (let i = 1; i < pts.length; i++) L += V.dist(pts[i - 1], pts[i]); return L; };
    const turnsOf = (pts) => {
      let n = 0;
      for (let i = 1; i + 1 < pts.length; i++) {
        const a = V.sub(pts[i], pts[i - 1]), b = V.sub(pts[i + 1], pts[i]);
        if (V.len(a) < 1e-6 || V.len(b) < 1e-6) continue;
        if (Math.abs(U.angleDiff(V.angle(a), V.angle(b))) > U.rad(1)) n++;
      }
      return n;
    };

    let qrng, start, goal, res, timer, agentT, hist;
    const randomPoint = () => { const p = qrng.pick(polys); return V(p.x + qrng.range(4, p.w - 4), p.y + qrng.range(4, p.h - 4)); };
    function runQuery() {
      const s = polyAt(start), t = polyAt(goal);
      if (s < 0 || t < 0) { res = null; return; }
      const t0 = ctx.now();
      const list = corridor(s, t, start, goal);
      if (!list) { res = null; return; }
      const portals = portalsOf(list, start, goal);
      const pts = buildPath(P.method, list, portals, start, goal);
      const ms = ctx.now() - t0;
      const ref = P.method === 'funnel' ? pts : funnel(portals);
      res = { list, portals, pts, len: lenOf(pts), ref: lenOf(ref), straight: V.dist(start, goal), turns: turnsOf(pts), ms, exp: expanded };
      hist.push({ ratio: res.len / Math.max(1e-6, res.ref), turns: res.turns });
      if (hist.length > 30) hist.shift();
      agentT = 0;
    }
    function init() {
      qrng = U.rng(ctx.seed * 43 + 3); hist = [];
      start = randomPoint(); goal = randomPoint();
      for (let k = 0; k < 20; k++) { const c = randomPoint(); if (V.dist(c, start) > V.dist(goal, start)) goal = c; }
      timer = P.interval; runQuery();
    }
    init();

    const view = () => { const s = Math.min(ctx.width / WW, ctx.height / WH); return { s, ox: (ctx.width - WW * s) / 2, oy: (ctx.height - WH * s) / 2 }; };
    function pointAlong(pts, d) {
      for (let i = 1; i < pts.length; i++) {
        const l = V.dist(pts[i - 1], pts[i]);
        if (d <= l) return V.lerp(pts[i - 1], pts[i], l > 0 ? d / l : 0);
        d -= l;
      }
      return pts[pts.length - 1];
    }
    return {
      update(dt) {
        agentT += dt;
        timer -= dt;
        if (timer <= 0) { timer = P.interval; start = goal; goal = randomPoint(); runQuery(); }
      },
      onParam(key) { if (key === 'method' || key === 'radius') { hist = []; runQuery(); } },
      onPointer(type, m) {
        if (type !== 'down') return;
        const vw = view(), p = V((m.x - vw.ox) / vw.s, (m.y - vw.oy) / vw.s);
        if (polyAt(p) < 0) return;
        start = goal; goal = p; timer = Math.max(timer, P.interval); runQuery();
      },
      render() {
        const g = ctx.g, vw = view(), s = vw.s;
        const X = (p) => ({ x: vw.ox + p.x * s, y: vw.oy + p.y * s });
        D.rect(g, vw.ox, vw.oy, WW * s, WH * s, '#4a505c');
        g.fillStyle = '#1b1e25';
        for (const p of polys) g.fillRect(vw.ox + p.x * s, vw.oy + p.y * s, p.w * s, p.h * s);
        if (res) {
          g.fillStyle = ctx.side === 'a' ? 'rgba(255,150,60,0.16)' : 'rgba(80,190,255,0.16)';
          for (const i of res.list) { const p = polys[i]; g.fillRect(vw.ox + p.x * s, vw.oy + p.y * s, p.w * s, p.h * s); }
        }
        if (P.showMesh) {
          g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = 1;
          for (const p of polys) g.strokeRect(vw.ox + p.x * s + 0.5, vw.oy + p.y * s + 0.5, p.w * s - 1, p.h * s - 1);
        }
        if (!res) { ctx.stat(GTL.L('경로', 'Path'), GTL.L('없음', 'None')); return; }
        if (P.showPortals) {
          for (let k = 1; k < res.portals.length - 1; k++) {
            const l = X(res.portals[k].l), r = X(res.portals[k].r);
            D.line(g, l.x, l.y, r.x, r.y, 'rgba(255,220,120,0.6)', 1.5);
            D.circle(g, l.x, l.y, 2.5, C.good); D.circle(g, r.x, r.y, 2.5, C.bad);
          }
        }
        if (P.method === 'center') for (let k = 1; k + 1 < res.list.length; k++) { const c = X(polys[res.list[k]].c); D.circle(g, c.x, c.y, 2, 'rgba(255,255,255,0.5)'); }
        const sp = res.pts.map(X);
        D.poly(g, sp, null, '#fff', 2, false);
        for (const p of sp.slice(1, -1)) D.circle(g, p.x, p.y, 3, ctx.side === 'a' ? C.a : C.b, '#000', 1);
        const a = X(pointAlong(res.pts, (agentT * 160) % (res.len + 80)));
        D.circle(g, a.x, a.y, Math.max(3, P.radius) * s, ctx.side === 'a' ? C.a : C.b, '#000', 1.5);
        const ss = X(start), gg = X(goal);
        D.circle(g, ss.x, ss.y, 5, C.good, '#000', 1.5); D.circle(g, gg.x, gg.y, 5, C.bad, '#000', 1.5);
        const avg = (k) => hist.reduce((acc, h) => acc + h[k], 0) / Math.max(1, hist.length);
        ctx.stat(GTL.L('경로 길이', 'Path length'), res.len.toFixed(0) + ' px');
        ctx.stat(GTL.L('퍼널 대비 길이', 'Length vs funnel'), (res.len / res.ref * 100).toFixed(1) + GTL.L(' % (평균 ', ' % (avg ') + (avg('ratio') * 100).toFixed(1) + ' %)');
        ctx.stat(GTL.L('직선 거리 대비', 'Length vs straight line'), (res.len / Math.max(1, res.straight) * 100).toFixed(0) + ' %');
        ctx.stat(GTL.L('꺾인 점 수', 'Turn points'), res.turns + GTL.L(' (평균 ', ' (avg ') + avg('turns').toFixed(1) + ')');
        ctx.stat(GTL.L('통로 폴리곤 수', 'Corridor polygons'), res.list.length + GTL.L(' / 전체 ', ' / total ') + polys.length);
        ctx.stat(GTL.L('A* 확장 폴리곤', 'A* expanded polygons'), res.exp);
        ctx.stat(GTL.L('질의 시간', 'Query time'), res.ms.toFixed(3) + ' ms');
      },
    };
  },
});
