// 열쇠-자물쇠 던전: 무작위 배치(검증 없음) vs 미션 우선 배치(Dormans 방식) + 순환(고리) 구조
GTL.register({
  id: 'lock-key-dungeon',
  title: '열쇠-자물쇠 던전: 무작위 배치 vs 미션 우선 생성',
  summary: '열쇠와 자물쇠를 무작위로 놓은 던전 vs 진행 순서(미션)를 먼저 정하고 공간에 배치한 던전 비교. 무작위 배치는 열쇠가 자기 자물쇠 뒤에 갇혀 풀 수 없는 던전이 자주 나옴. 미션 우선 배치는 항상 풀 수 있고 모든 자물쇠가 목표 경로를 막음.',
  views: { a: '무작위 배치', b: '미션 우선 배치' },
  controls: '조작 없음. 탐험가(점)가 열쇠를 모으며 목표(G)로 감. "다시 생성"으로 새 던전.',
  info: `
    <p><b>열쇠-자물쇠 구조</b>: 젤다 던전처럼 문을 열려면 다른 곳의 열쇠가 필요한 구조. 탐험 순서를 디자이너가 조절하는 핵심 장치.</p>
    <p><b>무작위 배치</b>: 방 배치를 만든 뒤 자물쇠 문과 열쇠를 아무 데나 둠. 두 가지 문제가 생김.</p>
    <ul>
      <li>열쇠가 자기 자물쇠 뒤에 있으면 풀 수 없음(소프트락).</li>
      <li>자물쇠가 목표와 상관없는 곁가지에 있으면 의미 없는 문이 됨.</li>
    </ul>
    <p><b>미션 우선 배치</b>(Dormans 2010): 먼저 "열쇠1 → 문1 → 열쇠2 → 문2 → 목표" 같은 진행 순서를 정함. 그다음 공간에 옮김.</p>
    <ol>
      <li>시작(S)에서 목표(G)까지 경로 중, 끊으면 G에 못 가는 통로(다리)를 골라 자물쇠를 순서대로 둠.</li>
      <li>열쇠 i는 "자물쇠 1~i-1만 열린 상태에서 갈 수 있는 영역"에 둠. 그중 문에서 먼 막다른 방을 고름.</li>
    </ol>
    <p><b>순환 생성</b>(Unexplored): 트리 대신 고리(cycle)를 기본 구조로 씀. 열쇠를 얻은 뒤 왔던 길이 아닌 다른 길로 돌아올 수 있어 되돌아가기가 줄어듦.
    단, 고리 위의 통로는 다리가 아니라서 자물쇠를 둘 수 없음. 순환을 늘리면 자물쇠 자리가 줄어듦.</p>`,
  // 도식: 미션 순서를 먼저 정하는 B vs 열쇠가 자기 문 뒤에 놓일 수 있는 A
  diagram: (L) => {
    const node = (x, y, t, cls = 'f-dim') => `<rect x="${x}" y="${y}" width="60" height="26" rx="5" class="${cls}"/><text x="${x + 30}" y="${y + 17}" text-anchor="middle">${t}</text>`;
    const ar = (x1, y1, x2, y2, m = 'arr-lk') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${m === 'arrA-lk' ? 'd-a' : 'd-b'}" marker-end="url(#${m})"/>`;
    const B = [L('시작', 'Start'), L('열쇠 1', 'Key 1'), L('문 1', 'Lock 1'), L('열쇠 2', 'Key 2'), L('문 2', 'Lock 2'), L('목표', 'Goal')];
    return `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr-lk" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    <marker id="arrA-lk" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="14" class="t-b">${L('B 미션 우선: 진행 순서를 먼저 정한 뒤 공간에 옮김', 'B mission first: fix the order, then map it to rooms')}</text>
    ${B.map((t, i) => node(8 + i * 90, 24, t)).join('')}
    ${[0, 1, 2, 3, 4].map((i) => ar(69 + i * 90, 37, 97 + i * 90, 37)).join('')}
    <text x="10" y="68" class="t-small t-dim">${L('열쇠 i는 문 1 ~ i-1만 열린 상태에서 갈 수 있는 곳에 둠', 'Key i goes where you can reach with only locks 1 ~ i-1 open')}</text>
    <text x="10" y="82" class="t-small t-dim">${L('문은 끊으면 목표에 못 가는 통로(다리)에 둠', 'Locks go on bridges: cut one and the goal is unreachable')}</text>
    <text x="10" y="108" class="t-a">${L('A 무작위: 열쇠가 자기 문 뒤에 놓일 수 있음', 'A random: a key can land behind its own lock')}</text>
    ${node(8, 132, L('시작', 'Start'))}
    ${node(118, 132, L('문 1', 'Lock 1'))}<rect x="118" y="132" width="60" height="26" rx="5" class="d-bad"/>
    ${node(228, 118, L('열쇠 1', 'Key 1'))}${node(228, 150, L('목표', 'Goal'))}
    ${ar(69, 145, 116, 145, 'arrA-lk')}${ar(179, 141, 226, 131, 'arrA-lk')}${ar(179, 149, 226, 160, 'arrA-lk')}
    <text x="300" y="136">${L('소프트락', 'Softlock')}</text>
    <text x="300" y="152" class="t-small t-dim">${L('문 1을 열 열쇠가 문 1 뒤에 있음', 'The key for lock 1 is behind lock 1')}</text>
  </svg>`;
  },
  look: [
    'A의 "풀 수 있는 던전 비율 (300개 시드)"은 70~80%. 4~5개 중 하나는 소프트락. B는 항상 100%.',
    'A에서 "다시 생성"을 몇 번 누르면 빨간 원(도달할 수 없는 열쇠)이 있는 던전이 나옴.',
    '"평균 목표를 막는 자물쇠"를 비교하면 A는 3개 중 1개 미만. 나머지는 곁가지에 있어 열지 않아도 됨. 그래서 A는 풀 수 있어도 이동 칸 수가 최단 경로와 거의 같음.',
    'A의 자물쇠 수를 5로 올리면 풀 수 있는 비율이 더 떨어짐.',
    'B의 순환 수를 2~3으로 올리면 "되돌아간 이동 비율"이 줄어듦. 대신 배치 가능한 자물쇠가 줄어들 수 있음.',
  ],
  refs: [
    { type: 'paper', title: 'J. Dormans: Adventures in level design: generating missions and spaces for action adventure games', year: 2010, note: 'PCG Workshop 2010. 미션 그래프를 먼저 만들고 공간으로 변환하는 방법.' },
    { type: 'paper', title: 'J. Dormans, S. Bakkes: Generating Missions and Spaces for Adaptable Play Experiences', year: 2011, note: 'IEEE Transactions on Computational Intelligence and AI in Games.' },
    { type: 'game', title: 'Unexplored (Ludomotion, 2017)', year: 2017, note: '고리(cycle) 단위로 던전을 만드는 순환 생성(cyclic generation).' },
    { type: 'article', title: 'Boris the Brave: Dungeon Generation in Unexplored', note: 'Unexplored의 순환 생성 해설.' },
    { type: 'talk', title: "Mark Brown: Boss Keys (Game Maker's Toolkit 영상 시리즈)", note: '젤다 던전의 열쇠-자물쇠 구조 분석.' },
  ],
  params: [
    { key: 'placement', label: '열쇠, 자물쇠 배치', type: 'select', group: '생성', options: [
      { value: 'random', label: '무작위 배치' },
      { value: 'mission', label: '미션 우선 배치' },
    ], a: 'random', b: 'mission' },
    { key: 'locks', label: '자물쇠 수', type: 'int', min: 1, max: 5, default: 3 },
    { key: 'cycles', label: '순환 (고리) 수', type: 'int', min: 0, max: 4, default: 0, help: '0이면 트리. 1은 시작 방을 감싼 고리, 2부터는 먼 방끼리 잇는 고리 추가.' },
    { key: 'cols', label: '가로 방 수', type: 'int', min: 5, max: 12, default: 9, shared: true, group: '맵' },
    { key: 'rows', label: '세로 방 수', type: 'int', min: 4, max: 8, default: 6, shared: true },
    { key: 'speed', label: '탐험 속도 (방/초)', type: 'range', min: 1, max: 30, step: 1, default: 6, shared: true, group: '표시' },
    { key: 'regen', label: '다시 생성', type: 'button', buttonLabel: '다시 생성 (새 시드)' },
  ],
  en: {
    title: 'Lock-and-Key Dungeons: Random Placement vs Mission-First Generation',
    summary: 'A dungeon with keys and locks placed at random vs a dungeon where the progression order (mission) is set first and then placed in space. Random placement often traps a key behind its own lock, so the dungeon cannot be solved. Mission-first placement is always solvable, and every lock blocks the path to the goal.',
    views: { a: 'Random placement', b: 'Mission-first placement' },
    controls: 'No input. The explorer (dot) collects keys and heads to the goal (G). Press "Regenerate" for a new dungeon.',
    info: `
    <p><b>Lock-and-key structure</b>: like Zelda dungeons, you need a key from somewhere else to open a door. It is the main tool designers use to control exploration order.</p>
    <p><b>Random placement</b>: build the room layout, then put locked doors and keys anywhere. This causes two problems.</p>
    <ul>
      <li>If a key is behind its own lock, the dungeon cannot be solved (softlock).</li>
      <li>If a lock is on a side branch unrelated to the goal, the door is pointless.</li>
    </ul>
    <p><b>Mission-first placement</b> (Dormans 2010): first set a progression order, such as "key 1 → door 1 → key 2 → door 2 → goal". Then map it onto space.</p>
    <ol>
      <li>On the path from start (S) to goal (G), pick passages that cut off G when removed (bridges), and place locks on them in order.</li>
      <li>Put key i in "the area you can reach with only locks 1 to i-1 open". Within that, pick a dead-end room far from the door.</li>
    </ol>
    <p><b>Cyclic generation</b> (Unexplored): uses loops (cycles) as the basic structure instead of a tree. After you get a key, you can come back by a different way, so backtracking drops.
    But a passage on a loop is not a bridge, so you cannot put a lock there. More cycles mean fewer places for locks.</p>`,
    look: [
      'A\'s "Solvable dungeon rate (300 seeds)" is 70~80%. One in 4~5 is a softlock. B is always 100%.',
      'Press "Regenerate" a few times in A. You get a dungeon with a red circle (an unreachable key).',
      'Compare "Mean locks that block the goal". A has fewer than 1 in 3. The rest are on side branches, so you never need to open them. That is why, even when A is solvable, the moves are almost the same as the shortest path.',
      'Raise A\'s lock count to 5. The solvable rate drops even more.',
      'Raise B\'s cycles to 2~3. "Backtrack move ratio" drops. In exchange, fewer locks may fit.',
    ],
    refs: ['PCG Workshop 2010. Builds a mission graph first and turns it into space.', null, 'Cyclic generation, which builds dungeons from loops (cycles).', 'An explanation of cyclic generation in Unexplored.', { title: "Mark Brown: Boss Keys (Game Maker's Toolkit video series)", note: 'An analysis of the lock-and-key structure in Zelda dungeons.' }],
    params: {
      placement: { label: 'Key and lock placement', group: 'Generation', options: { random: 'Random placement', mission: 'Mission-first placement' } },
      locks: 'Locks',
      cycles: { label: 'Cycles (loops)', help: '0 means a tree. 1 adds a loop around the start room. 2 and up add loops that join far-apart rooms.' },
      cols: { label: 'Rooms across', group: 'Map' },
      rows: 'Rooms down',
      speed: { label: 'Exploration speed (rooms/s)', group: 'Display' },
      regen: { label: 'Regenerate', buttonLabel: 'Regenerate (new seed)' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const KEYC = ['#ffd166', '#ef476f', '#06d6a0', '#a78bfa', '#4cc9f0'];
    let regen = 0, key = '', aggKey = '', dun = null, agg = null, prog = 0;
    const ek = (a, b) => (a < b ? a * 1000 + b : b * 1000 + a);

    function build(seed, cols, rows) {
      const rng = U.rng(seed), n = cols * rows;
      const adj = Array.from({ length: n }, () => []), edges = [], eset = new Set();
      const add = (a, b) => { const k = ek(a, b); if (eset.has(k)) return; eset.add(k); edges.push([a, b]); adj[a].push(b); adj[b].push(a); };
      const nb = (i) => { const x = i % cols, y = (i - x) / cols, o = []; if (x > 0) o.push(i - 1); if (x < cols - 1) o.push(i + 1); if (y > 0) o.push(i - cols); if (y < rows - 1) o.push(i + cols); return o; };
      const S = Math.floor(rows / 2) * cols;
      const vis = new Uint8Array(n);
      if (P.cycles > 0) {
        // 시작 방을 둘레에 포함하는 직사각형 고리
        const h = rng.int(1, Math.min(3, rows - 1)), w = rng.int(2, Math.min(4, cols - 1));
        const sy = Math.floor(rows / 2), y0 = rng.int(Math.max(0, sy - h), Math.min(sy, rows - 1 - h));
        const ring = [];
        for (let x = 0; x <= w; x++) ring.push(y0 * cols + x);
        for (let y = y0 + 1; y <= y0 + h; y++) ring.push(y * cols + w);
        for (let x = w - 1; x >= 0; x--) ring.push((y0 + h) * cols + x);
        for (let y = y0 + h - 1; y > y0; y--) ring.push(y * cols);
        for (let k = 0; k < ring.length; k++) { add(ring[k], ring[(k + 1) % ring.length]); vis[ring[k]] = 1; }
      } else vis[S] = 1;
      // 무작위 Prim으로 나머지 방을 붙임
      const front = [];
      for (let i = 0; i < n; i++) if (vis[i]) for (const j of nb(i)) if (!vis[j]) front.push([j, i]);
      while (front.length) {
        const k = rng.int(0, front.length - 1), [c, from] = front[k];
        front[k] = front[front.length - 1]; front.pop();
        if (vis[c]) continue;
        vis[c] = 1; add(c, from);
        for (const j of nb(c)) if (!vis[j]) front.push([j, c]);
      }
      // 추가 고리: 그래프 거리가 먼 이웃 방 쌍을 이음
      for (let c = 1; c < P.cycles; c++) {
        let best = null, bd = -1;
        for (let t = 0; t < 40; t++) {
          const a = rng.int(0, n - 1), cand = nb(a).filter((b) => !eset.has(ek(a, b)));
          if (!cand.length) continue;
          const b = rng.pick(cand), d = bfs(adj, a, null, null).dist[b];
          if (d > bd) { bd = d; best = [a, b]; }
        }
        if (best) add(best[0], best[1]);
      }
      const d0 = bfs(adj, S, null, null).dist;
      let G = S; for (let i = 0; i < n; i++) if (d0[i] > d0[G]) G = i;
      const dn = { cols, rows, n, adj, edges, S, G, locks: new Map(), keys: new Map(), lockList: [] };
      if (P.placement === 'mission') placeMission(dn, rng); else placeRandom(dn, rng);
      dn.solve = solve(dn);
      dn.effective = dn.lockList.filter((l) => bfs(adj, S, new Map([[ek(l.a, l.b), 0]]), new Set()).dist[G] < 0).length;
      return dn;
    }

    // BFS. locks: 간선키 → 자물쇠 id, held: 가진 열쇠 id 집합 (locks가 null이면 모두 통과)
    function bfs(adj, s, locks, held) {
      const n = adj.length, dist = new Int32Array(n).fill(-1), prev = new Int32Array(n).fill(-1), q = [s];
      dist[s] = 0;
      for (let h = 0; h < q.length; h++) {
        const u = q[h];
        for (const v of adj[u]) {
          if (dist[v] >= 0) continue;
          if (locks) { const l = locks.get(ek(u, v)); if (l !== undefined && !held.has(l)) continue; }
          dist[v] = dist[u] + 1; prev[v] = u; q.push(v);
        }
      }
      return { dist, prev };
    }
    const pathTo = (prev, t) => { const p = []; for (let c = t; c >= 0; c = prev[c]) p.push(c); return p.reverse(); };

    function placeRandom(dn, rng) {
      const es = rng.shuffle(dn.edges.slice());
      const rooms = rng.shuffle(Array.from({ length: dn.n }, (_, i) => i).filter((i) => i !== dn.S && i !== dn.G));
      const K = Math.min(P.locks, es.length, rooms.length);
      for (let i = 0; i < K; i++) {
        const [a, b] = es[i];
        dn.locks.set(ek(a, b), i); dn.lockList.push({ a, b, id: i });
        dn.keys.set(rooms[i], i);
      }
    }

    function placeMission(dn, rng) {
      const { adj, S, G } = dn;
      const path = pathTo(bfs(adj, S, null, null).prev, G);
      // 경로 위 다리(끊으면 G에 못 가는 통로)만 자물쇠 후보
      const cand = [];
      for (let k = 0; k + 1 < path.length; k++) {
        const a = path[k], b = path[k + 1];
        if (bfs(adj, S, new Map([[ek(a, b), 0]]), new Set()).dist[G] < 0) cand.push([a, b, k]);
      }
      const K = Math.min(P.locks, cand.length);
      const chosen = [];
      for (let j = 0; j < K; j++) chosen.push(cand[Math.min(cand.length - 1, Math.floor(((j + 1) * cand.length) / (K + 1)))]);
      const uniq = [...new Map(chosen.map((c) => [c[2], c])).values()].sort((p, q) => p[2] - q[2]);
      uniq.forEach(([a, b], i) => { dn.locks.set(ek(a, b), i); dn.lockList.push({ a, b, id: i }); });
      const onPath = new Set(path);
      let prevReach = new Int32Array(dn.n).fill(-1);
      for (let i = 0; i < uniq.length; i++) {
        // 자물쇠 0..i-1만 열린 상태의 도달 영역
        const held = new Set(); for (let j = 0; j < i; j++) held.add(j);
        const reach = bfs(adj, S, dn.locks, held).dist;
        const near = uniq[i][0];
        const dNear = bfs(adj, near, dn.locks, held).dist;
        const tiers = [
          (r) => prevReach[r] < 0 && !onPath.has(r),
          (r) => prevReach[r] < 0,
          () => true,
        ];
        let pool = [];
        for (const ok of tiers) {
          pool = [];
          for (let r = 0; r < dn.n; r++) if (reach[r] >= 0 && r !== S && r !== G && !dn.keys.has(r) && ok(r)) pool.push(r);
          if (pool.length) break;
        }
        // 문에서 먼 방 상위 3개 중 하나 (막다른 방 우대)
        pool.sort((p, q) => (dNear[q] + (adj[q].length === 1 ? 2 : 0)) - (dNear[p] + (adj[p].length === 1 ? 2 : 0)));
        if (pool.length) dn.keys.set(pool[rng.int(0, Math.min(2, pool.length - 1))], i);
        prevReach = reach;
      }
    }

    // 탐험가: 가장 가까운 열쇠를 줍고, 목표가 열리면 바로 감
    function solve(dn) {
      const held = new Set(), walk = [dn.S], seen = new Set([dn.S]);
      let pos = dn.S, ok = false, revisit = 0;
      const step = (path) => {
        for (let k = 1; k < path.length; k++) {
          const r = path[k];
          if (seen.has(r)) revisit++; seen.add(r);
          walk.push(r);
          if (dn.keys.has(r)) held.add(dn.keys.get(r));
        }
      };
      for (let it = 0; it < 20; it++) {
        const { dist, prev } = bfs(dn.adj, pos, dn.locks, held);
        if (dist[dn.G] >= 0) { step(pathTo(prev, dn.G)); ok = true; break; }
        let best = -1;
        for (const [r, id] of dn.keys) if (!held.has(id) && dist[r] >= 0 && (best < 0 || dist[r] < dist[best])) best = r;
        if (best < 0) break;
        step(pathTo(prev, best)); pos = best;
      }
      const reach = bfs(dn.adj, pos, dn.locks, held).dist;
      return { ok, walk, moves: walk.length - 1, revisit, held, reach, shortest: bfs(dn.adj, dn.S, null, null).dist[dn.G] };
    }

    function aggregate() {
      let ok = 0, eff = 0, back = 0, nb = 0, placed = 0;
      const T = 300;
      for (let t = 0; t < T; t++) {
        const d = build(ctx.seed * 7777 + t * 31 + 5, P.cols, P.rows);
        if (d.solve.ok) { ok++; back += d.solve.revisit / Math.max(1, d.solve.moves); nb++; }
        eff += d.effective; placed += d.lockList.length;
      }
      return { ok: (ok / T) * 100, eff: eff / T, back: nb ? (back / nb) * 100 : 0, placed: placed / T };
    }

    return {
      update(dt) { if (dun) prog = Math.min(dun.solve.walk.length - 1, prog + P.speed * dt); },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const k = [P.placement, P.locks, P.cycles, P.cols, P.rows].join('|');
        if (k + '|' + regen !== key) {
          if (k !== aggKey) { agg = aggregate(); aggKey = k; }
          dun = build(ctx.seed * 131 + regen * 7919 + 3, P.cols, P.rows);
          key = k + '|' + regen; prog = 0;
        }
        const dn = dun, cols = dn.cols, rows = dn.rows;
        const T = Math.min((W - 20) / cols, (H - 44) / rows), ox = (W - cols * T) / 2, oy = 30 + (H - 34 - rows * T) / 2;
        const col = ctx.side === 'a' ? C.a : C.b;
        const cx = (i) => ox + ((i % cols) + 0.5) * T, cy = (i) => oy + (Math.floor(i / cols) + 0.5) * T;
        const rs = T * 0.62, cw = T * 0.24;
        const sol = dn.solve;
        // 통로
        for (const [a, b] of dn.edges) {
          const x1 = cx(a), y1 = cy(a), x2 = cx(b), y2 = cy(b);
          g.fillStyle = '#4a4740';
          if (y1 === y2) g.fillRect(Math.min(x1, x2), y1 - cw / 2, Math.abs(x2 - x1), cw);
          else g.fillRect(x1 - cw / 2, Math.min(y1, y2), cw, Math.abs(y2 - y1));
        }
        // 방
        for (let i = 0; i < dn.n; i++) {
          const unreachable = !sol.ok && sol.reach[i] < 0;
          D.rect(g, cx(i) - rs / 2, cy(i) - rs / 2, rs, rs, unreachable ? '#2a2326' : '#8f8672', 'rgba(0,0,0,0.5)', 1);
        }
        // 지나간 길
        const shown = Math.floor(prog);
        if (shown > 0) {
          g.beginPath();
          for (let s = 0; s <= shown; s++) { const r = sol.walk[s]; s ? g.lineTo(cx(r), cy(r)) : g.moveTo(cx(r), cy(r)); }
          g.strokeStyle = col; g.lineWidth = 2; g.globalAlpha = 0.6; g.stroke(); g.globalAlpha = 1;
        }
        // 지금까지 주운 열쇠
        const got = new Set();
        for (let s = 0; s <= shown; s++) if (dn.keys.has(sol.walk[s])) got.add(dn.keys.get(sol.walk[s]));
        // 자물쇠
        for (const l of dn.lockList) {
          const x1 = cx(l.a), y1 = cy(l.a), x2 = cx(l.b), y2 = cy(l.b), mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          const c = KEYC[l.id % KEYC.length], open = got.has(l.id);
          g.globalAlpha = open ? 0.35 : 1;
          if (y1 === y2) D.rect(g, mx - 3, my - T * 0.22, 6, T * 0.44, c, '#000', 1);
          else D.rect(g, mx - T * 0.22, my - 3, T * 0.44, 6, c, '#000', 1);
          g.globalAlpha = 1;
        }
        // 열쇠
        for (const [r, id] of dn.keys) {
          const c = KEYC[id % KEYC.length], x = cx(r), y = cy(r);
          g.globalAlpha = got.has(id) ? 0.3 : 1;
          D.circle(g, x - T * 0.08, y, T * 0.09, c, '#000', 1);
          D.rect(g, x - T * 0.02, y - 1.5, T * 0.2, 3, c);
          g.globalAlpha = 1;
          if (!sol.ok && sol.reach[r] < 0 && !sol.held.has(id)) D.circle(g, x, y, T * 0.3, null, C.bad, 2);
        }
        D.text(g, 'S', cx(dn.S), cy(dn.S) - T * 0.22, { size: Math.max(10, T * 0.24), color: '#fff', align: 'center' });
        D.text(g, 'G', cx(dn.G), cy(dn.G) - T * 0.22, { size: Math.max(10, T * 0.24), color: C.good, align: 'center' });
        // 탐험가
        const s0 = sol.walk[Math.floor(prog)], s1 = sol.walk[Math.min(sol.walk.length - 1, Math.floor(prog) + 1)], f = prog - Math.floor(prog);
        D.circle(g, U.lerp(cx(s0), cx(s1), f), U.lerp(cy(s0), cy(s1), f), Math.max(4, T * 0.11), '#fff', col, 2);
        const done = prog >= sol.walk.length - 1;
        if (done) D.text(g, sol.ok ? GTL.L('목표 도착', 'Reached the goal') : GTL.L('풀 수 없음: 남은 열쇠가 잠긴 문 뒤에 있음', 'Unsolvable: the remaining keys are behind locked doors'), 10, 8, { size: 12, color: sol.ok ? C.good : C.bad });
        else D.text(g, GTL.L(`탐험 중 ${Math.floor(prog)} / ${sol.moves}`, `Exploring ${Math.floor(prog)} / ${sol.moves}`), 10, 8, { size: 12, color: C.dim });

        ctx.stat(GTL.L('풀 수 있는 던전 비율 (300개 시드)', 'Solvable dungeon rate (300 seeds)'), agg.ok.toFixed(0) + ' %');
        ctx.stat(GTL.L('이 던전', 'This dungeon'), sol.ok ? GTL.L('풀 수 있음', 'Solvable') : GTL.L('풀 수 없음', 'Unsolvable'));
        ctx.stat(GTL.L('목표를 막는 자물쇠 / 배치', 'Locks that block the goal / placed'), `${dn.effective} / ${dn.lockList.length}`);
        ctx.stat(GTL.L('평균 목표를 막는 자물쇠 (300개)', 'Mean locks that block the goal (300)'), `${agg.eff.toFixed(2)} / ${agg.placed.toFixed(2)}`);
        ctx.stat(GTL.L('이동 칸 수 (최단 경로)', 'Moves (shortest path)'), `${sol.moves} (${sol.shortest})`);
        ctx.stat(GTL.L('되돌아간 이동 비율 (300개 평균)', 'Backtrack move ratio (mean of 300)'), agg.back.toFixed(0) + ' %');
      },
      onAction(k) { if (k === 'regen') regen++; },
    };
  },
});
