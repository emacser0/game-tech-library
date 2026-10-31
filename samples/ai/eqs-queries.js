// 위치 선택: 단순 규칙 vs 환경 쿼리 (Unreal EQS: 생성기, 필터, 점수, 가중합)
GTL.register({
  id: 'eqs-queries',
  title: '위치 선택: 단순 규칙 vs 환경 쿼리 (Unreal EQS)',
  summary: 'AI가 플레이어를 쏠 자리를 고름. 단순 규칙(플레이어와 가장 가까운 엄폐 지점)은 플레이어 바로 옆 자리를 고름. EQS처럼 후보 점을 만들고 테스트로 거르고 점수를 매기면, 플레이어가 보이고 거리가 적당하고 가기 쉬운 자리를 고름.',
  views: { a: '단순 규칙', b: 'EQS 쿼리' },
  controls: '드래그로 플레이어(초록) 이동. 놓고 3초 지나면 자동으로 움직임. B의 점 위에 마우스를 올리면 테스트별 점수 표시.',
  info: `
    <p><b>EQS(Environment Query System)</b>: Unreal의 위치 선택 도구. "어디로 갈까"를 코드 대신 쿼리 자산으로 정의함.</p>
    <p>단순 규칙(가장 가까운 엄폐 지점, 플레이어에게 가장 가까운 점)은 조건 하나만 봄. 그래서 플레이어가 안 보이는 자리, 너무 가까운 자리, 멀리 돌아가야 하는 자리를 고르기 쉬움.</p>
    <p>쿼리 실행 순서:</p>
    <ul>
      <li><b>생성기(Generator)</b>: 후보 점(item)을 만듦. 여기서는 AI(Querier) 주변 격자(Points: Grid). 내비메시 밖 점은 버림.</li>
      <li><b>필터 테스트</b>: 조건을 못 넘은 점을 버림. 예: 플레이어까지 가시선(Trace), 최소 거리, 도달 가능 여부.</li>
      <li><b>점수 테스트</b>: 남은 점마다 값을 재고 0~1로 정규화. 예: 기준 거리와의 차이(Distance), 경로 길이(Pathfinding), 바라보는 방향(Dot).</li>
      <li>테스트 점수 × 가중치를 더해 최종 점수. <b>Single Best Item</b> 모드면 최고 점수 하나를 고름.</li>
    </ul>
    <p>이 샘플의 "좋은 사격 자리": 플레이어가 보이고, 플레이어와 거리가 100~340인 자리.</p>
    <p>비싼 테스트(경로, 트레이스)는 뒤에 두고 싼 필터를 먼저 돌려 후보를 줄임. Unreal도 테스트 비용 순으로 실행 순서를 정리함.</p>
    <p>단점: 후보 수 × 테스트 수만큼 비용이 듦. 격자가 촘촘하면 쿼리가 비쌈. 점수가 비슷한 점 사이에서 목표가 흔들릴 수 있음.</p>`,
  // 도식: 생성기 → 필터(제거) → 점수 테스트(정규화) → 가중합 → 최고 점수 선택
  diagram: (L) => `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="50" y="16" text-anchor="middle">${L('생성기', 'Generator')}</text>
    ${[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => `<circle cx="${23 + c * 18}" cy="${36 + r * 18}" r="4" class="f-b"/>`).join('')).join('')}
    <text x="50" y="112" text-anchor="middle" class="t-small t-dim">${L('Querier 주변 격자', 'Grid around querier')}</text>
    <path d="M96,63 L120,63" class="d-line" marker-end="url(#arr)"/>
    <text x="172" y="16" text-anchor="middle">${L('필터', 'Filter')}</text>
    ${[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => { const out = (r + c * 3) % 4 === 0 || (c === 3 && r < 2); const x = 145 + c * 18, y = 36 + r * 18; return out ? `<path d="M${x - 3},${y - 3} L${x + 3},${y + 3} M${x + 3},${y - 3} L${x - 3},${y + 3}" class="d-dim"/>` : `<circle cx="${x}" cy="${y}" r="4" class="f-b"/>`; }).join('')).join('')}
    <text x="172" y="112" text-anchor="middle" class="t-small t-dim">${L('가시선 없음, 도달 불가 제거', 'Drop: no LOS, unreachable')}</text>
    <path d="M218,63 L242,63" class="d-line" marker-end="url(#arr)"/>
    <text x="320" y="16" text-anchor="middle">${L('점수 테스트 (0~1)', 'Score tests (0~1)')}</text>
    <rect x="250" y="26" width="140" height="18" class="f-dim"/><text x="256" y="39" class="t-small">${L('거리: 기준값에 가까울수록', 'Distance: near reference')}</text>
    <rect x="250" y="50" width="140" height="18" class="f-dim"/><text x="256" y="63" class="t-small">${L('경로 길이: 짧을수록', 'Path length: shorter')}</text>
    <rect x="250" y="74" width="140" height="18" class="f-dim"/><text x="256" y="87" class="t-small">${L('Dot: 앞쪽일수록', 'Dot: more in front')}</text>
    <text x="320" y="112" text-anchor="middle" class="t-small t-dim">${L('남은 점 사이에서 정규화', 'Normalized over items left')}</text>
    <path d="M394,63 L418,63" class="d-line" marker-end="url(#arr)"/>
    <text x="470" y="16" text-anchor="middle">${L('가중합', 'Weighted sum')}</text>
    <text x="470" y="44" text-anchor="middle" class="t-small t-mono">w1 s1 + w2 s2</text>
    <text x="470" y="58" text-anchor="middle" class="t-small t-mono">+ w3 s3</text>
    <circle cx="470" cy="80" r="7" class="f-good"/><circle cx="470" cy="80" r="11" class="d-line"/>
    <text x="470" y="112" text-anchor="middle" class="t-small t-dim">${L('최고 점수 하나 선택', 'Pick the single best')}</text>
    <line x1="10" y1="128" x2="530" y2="128" class="d-dim"/>
    <text x="10" y="148" class="t-a">${L('단순 규칙', 'Simple rule')}</text>
    <text x="110" y="148" class="t-small">${L('조건 하나 (플레이어와 가장 가까운 엄폐 지점)', 'One condition (cover point closest to the player)')}</text>
    <text x="110" y="162" class="t-small t-dim">${L('플레이어 바로 옆이라 너무 가까워도 고름', 'Picks it even when it is right next to the player')}</text>
    <text x="10" y="186" class="t-b">${L('EQS', 'EQS')}</text>
    <text x="110" y="186" class="t-small">${L('필터로 불가능한 점을 버리고, 남은 점을 여러 기준으로 비교', 'Filters drop bad items, then several scores compare the rest')}</text>
  </svg>`,
  look: [
    'A는 플레이어와 가장 가까운 엄폐 지점(네모)으로 감. 플레이어 바로 옆이라 너무 가까움. "좋은 사격 자리 비율"이 10% 아래로 낮음. B는 가려진 점(회색 X)과 너무 가까운 점을 버리고 거리 점수가 좋은 점을 골라 70% 넘게 유지함.',
    'B의 점 위에 마우스를 올리면 왼쪽 위에 테스트별 원래 값, 정규화 점수, 가중치가 나옴. 필터에서 빠진 점은 빠진 이유가 나옴.',
    '"기준 거리"를 100으로 낮추면 초록 점이 플레이어 가까이 모임. 320으로 올리면 멀리서 보는 자리를 고름.',
    '"경로 길이 가중치"를 2로 올리면 지금 위치에서 가까운 점이 이기고 "이동 거리"가 줄어듦. 0으로 내리면 멀어도 거리 점수가 좋은 점까지 걸어가서 "이동 거리"가 두 배 넘게 늘어남.',
    '플레이어를 엄폐물 뒤로 끌어다 놓으면 B의 회색 점(가시선 없음) 영역이 엄폐물 그림자 모양으로 바뀜.',
  ],
  refs: [
    { type: 'engine', title: 'Unreal Engine - Environment Query System Overview', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/environment-query-system-overview-in-unreal-engine', note: '생성기, 컨텍스트, 테스트, 점수 매기기 구조.' },
    { type: 'engine', title: 'Unreal Engine - EQS Node Reference: Tests', note: 'Distance, Trace, Pathfinding, Dot 테스트. Filter Only, Score Only, Filter and Score 목적과 점수 식(Scoring Equation).' },
    { type: 'engine', title: 'Unreal Engine - EQS Node Reference: Generators', note: 'Points: Grid, Points: Circle, Actors Of Class 등 후보 생성기.' },
    { type: 'book', title: 'Tactical Position Selection: An Architecture and Query Language', year: 2013, note: 'Matthew Jack. Game AI Pro. Crytek의 위치 선택 쿼리 언어. 생성, 조건, 가중치 구조가 EQS와 같음.' },
  ],
  params: [
    { key: 'mode', label: '위치 선택', type: 'select', group: '선택 방식', options: [
      { value: 'cover', label: '단순: 플레이어와 가장 가까운 엄폐 지점' },
      { value: 'near', label: '단순: 플레이어에게 가장 가까운 점' },
      { value: 'eqs', label: 'EQS 쿼리' },
    ], a: 'cover', b: 'eqs' },
    { key: 'interval', label: '쿼리 주기 (s)', type: 'range', min: 0.2, max: 2, step: 0.1, default: 0.5 },
    { key: 'gridHalf', label: '격자 반경', type: 'range', min: 100, max: 300, step: 10, default: 210, group: '생성기 (Points: Grid)', when: (p) => p.mode === 'eqs' },
    { key: 'spacing', label: '점 간격', type: 'int', min: 25, max: 60, default: 35, when: (p) => p.mode === 'eqs' },
    { key: 'losFilter', label: '가시선 필터 (Trace)', type: 'bool', default: true, group: '필터 테스트', when: (p) => p.mode === 'eqs', help: '플레이어가 안 보이는 점을 버림' },
    { key: 'minDist', label: '최소 거리', type: 'range', min: 0, max: 200, step: 10, default: 90, when: (p) => p.mode === 'eqs', help: '플레이어와 이보다 가까운 점을 버림' },
    { key: 'idealDist', label: '기준 거리', type: 'range', min: 80, max: 400, step: 10, default: 220, group: '점수 테스트', when: (p) => p.mode === 'eqs', help: 'Distance 테스트. 이 거리에 가까울수록 높은 점수' },
    { key: 'wDist', label: '거리 가중치', type: 'range', min: 0, max: 2, step: 0.1, default: 1, when: (p) => p.mode === 'eqs' },
    { key: 'wPath', label: '경로 길이 가중치', type: 'range', min: 0, max: 2, step: 0.1, default: 0.6, when: (p) => p.mode === 'eqs', help: 'Pathfinding 테스트. 경로가 짧을수록 높은 점수' },
    { key: 'wDot', label: '방향 가중치', type: 'range', min: 0, max: 2, step: 0.1, default: 0.3, when: (p) => p.mode === 'eqs', help: 'Dot 테스트. AI가 바라보는 쪽에 있을수록 높은 점수' },
    { key: 'aiSpeed', label: 'AI 속도', type: 'range', min: 30, max: 200, step: 5, default: 90, shared: true, group: '장면' },
    { key: 'playerSpeed', label: '플레이어 속도', type: 'range', min: 0, max: 150, step: 5, default: 45, shared: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Position Selection: Simple Rule vs Environment Query (Unreal EQS)',
    summary: 'The AI picks a spot to shoot the player from. A simple rule (the cover point closest to the player) picks a spot right next to the player. An EQS style query makes candidate points, filters them with tests and scores them. It picks a spot that can see the player, keeps a good distance and is easy to reach.',
    views: { a: 'Simple rule', b: 'EQS query' },
    controls: 'Drag to move the player (green). 3 seconds after you let go, it moves on its own. Hover a point in B to see its score per test.',
    info: `
    <p><b>EQS (Environment Query System)</b> is the position selection tool in Unreal. You define "where should I go" as a query asset instead of code.</p>
    <p>A simple rule (closest cover point, point closest to the player) looks at only one condition. So it easily picks a spot that cannot see the player, a spot too close, or a spot that needs a long detour.</p>
    <p>How a query runs:</p>
    <ul>
      <li><b>Generator</b>: makes candidate points (items). Here it is a grid around the AI (Querier) (Points: Grid). Points off the navmesh are dropped.</li>
      <li><b>Filter tests</b>: drop points that fail a condition. Examples: line of sight to the player (Trace), minimum distance, reachability.</li>
      <li><b>Score tests</b>: measure a value for each point left and normalize it to 0~1. Examples: gap to a reference distance (Distance), path length (Pathfinding), facing direction (Dot).</li>
      <li>Add test score × weight to get the final score. In <b>Single Best Item</b> mode, the query returns the top item.</li>
    </ul>
    <p>In this sample, a "good firing spot" can see the player and is 100~340 away from the player.</p>
    <p>Run cheap filters first to cut the item count, and put expensive tests (path, trace) later. Unreal also orders tests by cost.</p>
    <p>Downside: the cost is item count × test count. A dense grid makes the query expensive. The target can flip between points with similar scores.</p>`,
    look: [
      'A goes to the cover point (square) closest to the player. It is right next to the player, which is too close. "Good firing spot" stays below 10%. B drops hidden points (grey X) and points that are too close, picks a point with a good distance score, and stays above 70%.',
      'Hover a point in B. The top left shows the raw value, normalized score and weight for each test. For a filtered point, it shows why it was dropped.',
      'Lower "Reference distance" to 100. The green points gather near the player. Raise it to 320 and the AI picks a spot that watches from far away.',
      'Raise "Path length weight" to 2. Points near the current position win, and "Distance walked" goes down. Lower it to 0. The AI walks far to reach a point with a good distance score, and "Distance walked" more than doubles.',
      'Drag the player behind a block. The grey points (no line of sight) in B change to the shape of the block shadow.',
    ],
    refs: [
      'Structure of generators, contexts, tests and scoring.',
      'Distance, Trace, Pathfinding and Dot tests. The Filter Only, Score Only and Filter and Score purposes, and the Scoring Equation.',
      'Candidate generators such as Points: Grid, Points: Circle and Actors Of Class.',
      'Matthew Jack. Game AI Pro. The position query language at Crytek. Generation, conditions and weights work like EQS.',
    ],
    params: {
      mode: { label: 'Position selection', group: 'Selection method', options: { cover: 'Simple: cover point closest to the player', near: 'Simple: point closest to the player', eqs: 'EQS query' } },
      interval: 'Query interval (s)',
      gridHalf: { label: 'Grid radius', group: 'Generator (Points: Grid)' },
      spacing: 'Point spacing',
      losFilter: { label: 'Line of sight filter (Trace)', group: 'Filter tests', help: 'Drops points that cannot see the player' },
      minDist: { label: 'Minimum distance', help: 'Drops points closer to the player than this' },
      idealDist: { label: 'Reference distance', group: 'Score tests', help: 'Distance test. Points closer to this distance score higher' },
      wDist: 'Distance weight',
      wPath: { label: 'Path length weight', help: 'Pathfinding test. Shorter paths score higher' },
      wDot: { label: 'Direction weight', help: 'Dot test. Points in the direction the AI faces score higher' },
      aiSpeed: { label: 'AI speed', group: 'Scene' },
      playerSpeed: 'Player speed',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, V = U.v2, D = U.draw, C = U.colors, P = ctx.params;
    const GOOD_MIN = 100, GOOD_MAX = 340, WW = 640, WH = 400, R = 9, CS = 10, GC = WW / CS, GR = WH / CS, GN = GC * GR;
    const rects = [
      { x: 150, y: 90, w: 60, h: 90 }, { x: 300, y: 40, w: 110, h: 40 }, { x: 300, y: 200, w: 50, h: 110 },
      { x: 450, y: 150, w: 90, h: 50 }, { x: 110, y: 280, w: 90, h: 40 }, { x: 470, y: 300, w: 50, h: 60 },
    ];
    const route = [V(560, 70), V(590, 250), V(410, 370), V(420, 120)];
    // 엄폐 지점: 각 상자의 네 변 가운데에서 바깥으로 조금 떨어진 점
    const covers = [];
    for (const r of rects) {
      for (const p of [V(r.x - 16, r.y + r.h / 2), V(r.x + r.w + 16, r.y + r.h / 2), V(r.x + r.w / 2, r.y - 16), V(r.x + r.w / 2, r.y + r.h + 16)]) {
        if (p.x > R && p.y > R && p.x < WW - R && p.y < WH - R && !insideInflated(p)) covers.push(p);
      }
    }
    // 길찾기 격자: 상자를 AI 반지름만큼 부풀린 영역은 막힘
    const block = new Uint8Array(GN);
    for (let i = 0; i < GN; i++) {
      const p = V((i % GC + 0.5) * CS, (((i / GC) | 0) + 0.5) * CS);
      if (insideInflated(p) || p.x < R || p.y < R || p.x > WW - R || p.y > WH - R) block[i] = 1;
    }
    function insideInflated(p, m = R) { for (const r of rects) if (p.x > r.x - m && p.x < r.x + r.w + m && p.y > r.y - m && p.y < r.y + r.h + m) return true; return false; }
    function segHits(a, b, r, m) {
      const dx = b.x - a.x, dy = b.y - a.y;
      let t0 = 0, t1 = 1;
      for (const [o, d, mn, mx] of [[a.x, dx, r.x - m, r.x + r.w + m], [a.y, dy, r.y - m, r.y + r.h + m]]) {
        if (Math.abs(d) < 1e-9) { if (o < mn || o > mx) return false; continue; }
        let ta = (mn - o) / d, tb = (mx - o) / d;
        if (ta > tb) [ta, tb] = [tb, ta];
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
        if (t0 > t1) return false;
      }
      return true;
    }
    const clear = (a, b, m = 0) => { for (const r of rects) if (segHits(a, b, r, m)) return false; return true; };
    const cellOf = (p) => U.clamp(Math.floor(p.y / CS), 0, GR - 1) * GC + U.clamp(Math.floor(p.x / CS), 0, GC - 1);
    const cellPos = (i) => V((i % GC + 0.5) * CS, (((i / GC) | 0) + 0.5) * CS);

    // Querier에서 모든 셀까지 Dijkstra 한 번 (경로 길이 테스트와 이동에 같이 씀)
    const dist = new Float64Array(GN), parent = new Int32Array(GN);
    function dijkstra(src) {
      dist.fill(Infinity); parent.fill(-1);
      const heap = []; // [d, i]
      const push = (d, i) => { heap.push([d, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
      const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
      dist[src] = 0; push(0, src);
      while (heap.length) {
        const [d, cur] = pop();
        if (d > dist[cur]) continue;
        const cx = cur % GC, cy = (cur / GC) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= GC || ny >= GR) continue;
          const ni = ny * GC + nx;
          if (block[ni]) continue;
          if (dx && dy && (block[cy * GC + nx] || block[ny * GC + cx])) continue;
          const nd = d + (dx && dy ? 1.4142 : 1) * CS;
          if (nd < dist[ni]) { dist[ni] = nd; parent[ni] = cur; push(nd, ni); }
        }
      }
    }
    function buildPath(from, target) {
      const cells = [];
      for (let i = cellOf(target); i >= 0 && cells.length < GN; i = parent[i]) cells.push(cellPos(i));
      cells.reverse();
      cells.push(V(target.x, target.y));
      // 문자열 당기기: 막히지 않는 한 가장 먼 점으로 바로 감
      const out = [];
      let a = from, k = 0;
      while (k < cells.length) {
        let j = cells.length - 1;
        while (j > k && !clear(a, cells[j], R - 1)) j--;
        out.push(cells[j]); a = cells[j]; k = j + 1;
      }
      return out;
    }

    let ai, player, items, chosen, chosenCover, stats, queryT, manualT, queryMs;
    function init() {
      ai = { p: V(60, 360), dir: -Math.PI / 4, path: [], target: null };
      player = { p: V(route[0].x, route[0].y), wp: 1, pause: 0 };
      items = []; chosen = null; chosenCover = null; queryT = 0; manualT = 0; queryMs = 0;
      stats = { losT: 0, goodT: 0, totalT: 0, walked: 0, queries: 0, filtered: 0, evaluated: 0 };
    }
    init();

    function runQuery() {
      const t0 = ctx.now();
      const qc = cellOf(ai.p);
      dijkstra(block[qc] ? nearestOpen(qc) : qc);
      stats.queries++;
      let target = null;
      items = []; chosenCover = null;
      if (P.mode === 'cover') {
        let bd = Infinity;
        for (const c of covers) { const d = V.dist(c, player.p); if (d < bd && isFinite(dist[cellOf(c)])) { bd = d; target = c; } }
        chosenCover = target;
      } else if (P.mode === 'near') {
        const to = V.sub(ai.p, player.p), l = V.len(to);
        target = l > 40 ? V.add(player.p, V.scale(to, 40 / l)) : V(ai.p.x, ai.p.y);
        if (insideInflated(target) || !isFinite(dist[cellOf(target)])) target = cellPos(nearestReach(cellOf(target)));
      } else {
        // 생성기: Querier 주변 격자. 월드에 맞춰 칸을 고정해 쿼리마다 점이 흔들리지 않게 함
        const sp = P.spacing, half = P.gridHalf;
        const x0 = Math.ceil((ai.p.x - half) / sp) * sp, y0 = Math.ceil((ai.p.y - half) / sp) * sp;
        for (let y = y0; y <= ai.p.y + half; y += sp) for (let x = x0; x <= ai.p.x + half; x += sp) {
          const p = V(x, y);
          if (x < R || y < R || x > WW - R || y > WH - R || insideInflated(p)) continue; // 내비메시 밖
          items.push({ p, fail: null, raw: {}, s: {}, score: 0 });
        }
        const fwd = V.fromAngle(ai.dir);
        // 필터 테스트 (싼 것부터)
        for (const it of items) {
          const dp = V.dist(it.p, player.p);
          it.raw.dist = dp;
          if (dp < P.minDist) { it.fail = 'min'; continue; }
          it.raw.path = dist[cellOf(it.p)];
          if (!isFinite(it.raw.path)) { it.fail = 'path'; continue; }
          if (P.losFilter && !clear(it.p, player.p)) { it.fail = 'los'; continue; }
          const to = V.sub(it.p, ai.p), l = V.len(to);
          it.raw.dot = l > 1e-3 ? V.dot(fwd, V.scale(to, 1 / l)) : 1;
          it.raw.gap = Math.abs(dp - P.idealDist);
        }
        const live = items.filter((it) => !it.fail);
        // 점수 테스트: 남은 점 사이에서 0~1로 정규화. 낮을수록 좋은 값은 뒤집음
        const norm = (key, invert) => {
          let lo = Infinity, hi = -Infinity;
          for (const it of live) { lo = Math.min(lo, it.raw[key]); hi = Math.max(hi, it.raw[key]); }
          for (const it of live) { const n = hi - lo > 1e-9 ? (it.raw[key] - lo) / (hi - lo) : 1; it.s[key] = invert ? 1 - n : n; }
        };
        norm('gap', true); norm('path', true); norm('dot', false);
        const wsum = P.wDist + P.wPath + P.wDot || 1;
        let best = null;
        for (const it of live) {
          it.score = (P.wDist * it.s.gap + P.wPath * it.s.path + P.wDot * it.s.dot) / wsum;
          if (!best || it.score > best.score) best = it;
        }
        stats.evaluated += items.length; stats.filtered += items.length - live.length;
        chosen = best;
        target = best ? best.p : null;
      }
      if (target) { ai.target = target; ai.path = buildPath(ai.p, target); }
      queryMs = U.lerp(queryMs, ctx.now() - t0, 0.2);
    }
    function nearestOpen(c) { let bi = c, bd = Infinity; const p = cellPos(c); for (let i = 0; i < GN; i++) if (!block[i]) { const d = V.distSq(cellPos(i), p); if (d < bd) { bd = d; bi = i; } } return bi; }
    function nearestReach(c) { let bi = cellOf(ai.p), bd = Infinity; const p = cellPos(c); for (let i = 0; i < GN; i++) if (isFinite(dist[i])) { const d = V.distSq(cellPos(i), p); if (d < bd) { bd = d; bi = i; } } return bi; }

    const view = () => { const s = Math.min(ctx.width / WW, ctx.height / WH); return { s, ox: (ctx.width - WW * s) / 2, oy: (ctx.height - WH * s) / 2 }; };
    const toWorld = (m) => { const vw = view(); return V((m.x - vw.ox) / vw.s, (m.y - vw.oy) / vw.s); };

    function step(dt) {
      // 플레이어: 드래그하면 마우스로, 아니면 경로를 따라 이동
      const m = ctx.input.mouse;
      if (m.inside && m.down) {
        const t = toWorld(m);
        t.x = U.clamp(t.x, R, WW - R); t.y = U.clamp(t.y, R, WH - R);
        if (!insideInflated(t, 6)) player.p = t;
        manualT = 3;
      } else if (manualT > 0) manualT -= dt;
      else if (P.playerSpeed > 0) {
        const t = route[player.wp], d = V.sub(t, player.p), l = V.len(d);
        if (player.pause > 0) player.pause -= dt;
        else if (l < 3) { player.wp = (player.wp + 1) % route.length; player.pause = 2.5; }
        else player.p = V.add(player.p, V.scale(d, Math.min(l, P.playerSpeed * dt) / l));
      }
      queryT -= dt;
      if (queryT <= 0) { runQuery(); queryT = P.interval; }
      // AI 이동
      const before = V(ai.p.x, ai.p.y);
      let move = P.aiSpeed * dt;
      while (move > 0 && ai.path.length) {
        const t = ai.path[0], d = V.sub(t, ai.p), l = V.len(d);
        if (l <= move) { ai.p = V(t.x, t.y); ai.path.shift(); move -= l; }
        else { ai.p = V.add(ai.p, V.scale(d, move / l)); move = 0; }
      }
      const mv = V.sub(ai.p, before), ml = V.len(mv);
      stats.walked += ml;
      const want = ml > 0.05 ? Math.atan2(mv.y, mv.x) : Math.atan2(player.p.y - ai.p.y, player.p.x - ai.p.x);
      ai.dir = U.lerpAngle(ai.dir, want, 1 - Math.exp(-6 * dt));
      stats.totalT += dt;
      if (clear(ai.p, player.p)) { stats.losT += dt; const d = V.dist(ai.p, player.p); if (d >= GOOD_MIN && d <= GOOD_MAX) stats.goodT += dt; }
    }

    return {
      update(dt) { let t = dt; while (t > 1e-6) { const h = Math.min(t, 1 / 60); step(h); t -= h; } },
      onAction() { init(); },
      render() {
        const g = ctx.g, vw = view(), s = vw.s;
        const X = (p) => ({ x: vw.ox + p.x * s, y: vw.oy + p.y * s });
        const col = ctx.side === 'a' ? C.a : C.b;
        D.rect(g, vw.ox, vw.oy, WW * s, WH * s, '#181b21', 'rgba(255,255,255,0.1)');
        for (const r of rects) D.rect(g, vw.ox + r.x * s, vw.oy + r.y * s, r.w * s, r.h * s, '#3a404c', '#59606e');
        const pp = X(player.p), ap = X(ai.p);
        // 단순 규칙: 엄폐 지점
        if (P.mode === 'cover') {
          for (const c of covers) { const q = X(c); D.rect(g, q.x - 4, q.y - 4, 8, 8, null, 'rgba(255,255,255,0.35)'); }
          if (chosenCover) { const q = X(chosenCover); D.rect(g, q.x - 6, q.y - 6, 12, 12, null, col, 2); }
        }
        // EQS 항목: 점수 색(빨강→초록), 필터에서 빠진 점은 회색 X
        let hover = null;
        const m = ctx.input.mouse;
        if (P.mode === 'eqs') {
          let hd = 14;
          for (const it of items) {
            const q = X(it.p);
            if (it.fail) {
              g.strokeStyle = 'rgba(160,170,185,0.45)'; g.lineWidth = 1; g.beginPath();
              g.moveTo(q.x - 3, q.y - 3); g.lineTo(q.x + 3, q.y + 3); g.moveTo(q.x + 3, q.y - 3); g.lineTo(q.x - 3, q.y + 3); g.stroke();
            } else D.circle(g, q.x, q.y, 4.5, U.hsl(it.score * 120, 75, 50), 'rgba(0,0,0,0.5)', 1);
            if (m.inside && !m.down) { const d = Math.hypot(m.x - q.x, m.y - q.y); if (d < hd) { hd = d; hover = it; } }
          }
          if (chosen) { const q = X(chosen.p); D.circle(g, q.x, q.y, 9, null, '#fff', 2); }
        }
        if (ai.target) {
          const q = X(ai.target);
          D.poly(g, [ap, ...ai.path.map(X)], null, col, 1.5, false);
          D.circle(g, q.x, q.y, 3, col);
        }
        // 가시선: AI에서 플레이어까지
        const los = clear(ai.p, player.p);
        if (los) D.line(g, ap.x, ap.y, pp.x, pp.y, 'rgba(102,209,122,0.7)', 1.5);
        else { g.setLineDash([3, 5]); D.line(g, ap.x, ap.y, pp.x, pp.y, 'rgba(255,83,112,0.55)', 1); g.setLineDash([]); }
        D.circle(g, pp.x, pp.y, R * s, C.good, '#000', 1.5);
        D.circle(g, ap.x, ap.y, R * s + 1, col, '#000', 1.5);
        const f = V.fromAngle(ai.dir);
        D.line(g, ap.x, ap.y, ap.x + f.x * 15, ap.y + f.y * 15, '#000', 2);
        // 마우스를 올린 점의 테스트별 점수
        if (hover) {
          const q = X(hover.p);
          D.circle(g, q.x, q.y, 8, null, C.accent, 2);
          const lines = [];
          if (hover.fail) {
            const why = { min: GTL.L('최소 거리 필터에서 빠짐', 'Dropped by minimum distance'), path: GTL.L('도달 불가로 빠짐', 'Dropped: unreachable'), los: GTL.L('가시선 필터에서 빠짐', 'Dropped by line of sight') }[hover.fail];
            lines.push([why, C.bad]);
            lines.push([GTL.L('플레이어 거리 ', 'Player distance ') + hover.raw.dist.toFixed(0), C.dim]);
          } else {
            const row = (name, raw, sc, w) => [`${name} ${raw}  ${GTL.L('점수', 'score')} ${sc.toFixed(2)} × ${w.toFixed(1)}`, C.text];
            lines.push(row(GTL.L('거리', 'Distance'), hover.raw.dist.toFixed(0) + ' (' + GTL.L('차이 ', 'gap ') + hover.raw.gap.toFixed(0) + ')', hover.s.gap, P.wDist));
            lines.push(row(GTL.L('경로', 'Path'), hover.raw.path.toFixed(0), hover.s.path, P.wPath));
            lines.push(row('Dot', hover.raw.dot.toFixed(2), hover.s.dot, P.wDot));
            lines.push([GTL.L('최종 점수 ', 'Final score ') + hover.score.toFixed(3) + (hover === chosen ? GTL.L(' (선택됨)', ' (chosen)') : ''), U.hsl(hover.score * 120, 75, 60)]);
          }
          const bw = 300, bh = lines.length * 15 + 10;
          D.rect(g, 6, 6, bw, bh, 'rgba(10,12,16,0.85)', 'rgba(255,255,255,0.2)');
          lines.forEach(([t, c], i) => D.text(g, t, 12, 11 + i * 15, { size: 11, color: c }));
        } else if (P.mode !== 'eqs') {
          const t = P.mode === 'cover' ? GTL.L('규칙: 플레이어와 가장 가까운 엄폐 지점', 'Rule: cover point closest to the player') : GTL.L('규칙: 플레이어에게 가장 가까운 점', 'Rule: point closest to the player');
          D.text(g, t, 8, 8, { size: 11, color: C.dim });
        }
        ctx.stat(GTL.L('좋은 사격 자리 비율', 'Good firing spot'), stats.totalT > 0 ? (stats.goodT / stats.totalT * 100).toFixed(0) + ' %' : '-');
        ctx.stat(GTL.L('시야 확보 비율', 'LOS kept'), stats.totalT > 0 ? (stats.losT / stats.totalT * 100).toFixed(0) + ' %' : '-');
        ctx.stat(GTL.L('플레이어 거리', 'Player distance'), V.dist(ai.p, player.p).toFixed(0));
        ctx.stat(GTL.L('이동 거리', 'Distance walked'), stats.walked.toFixed(0));
        if (P.mode === 'eqs') {
          const live = items.filter((it) => !it.fail).length;
          ctx.stat(GTL.L('후보 점 (남음 / 전체)', 'Items (left / total)'), `${live} / ${items.length}`);
          if (!chosen) ctx.stat(GTL.L('쿼리 결과', 'Query result'), GTL.L('실패 (남은 점 없음)', 'Failed (no items left)'));
        }
        ctx.stat(GTL.L('쿼리 시간', 'Query time'), queryMs.toFixed(2) + ' ms');
      },
    };
  },
});
