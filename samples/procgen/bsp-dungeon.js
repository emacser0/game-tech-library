// 던전 생성: 랜덤 방 배치(거절 샘플링) vs BSP 분할, 복도 연결(순차 / MST / BSP 형제)
GTL.register({
  id: 'bsp-dungeon',
  title: 'BSP 던전 vs 랜덤 방 배치',
  summary: '랜덤 방 배치 vs BSP 분할 비교. 랜덤 배치는 방이 들쭉날쭉하고 복도가 엉킴. BSP는 겹침 없이 고른 던전을 만듦.',
  views: { a: '랜덤 배치 + 순차 연결', b: 'BSP + 형제 연결' },
  controls: '조작 없음. "다시 생성"을 누르면 새 시드로 만듦.',
  info: `
    <p><b>랜덤 배치</b>: 크기와 위치가 무작위인 방을 놓아 봄. 기존 방과 겹치면 버림(빨간 테두리).
    단순하지만 방 수가 운에 좌우됨. 빈 곳과 몰린 곳이 생김.</p>
    <p><b>BSP(이진 공간 분할)</b>: 맵을 가로 또는 세로로 반복해서 둘로 나눔(긴 쪽 우선). 나눈 결과는 트리가 됨.
    트리의 끝 칸(잎 노드)마다 방을 하나 넣음. 그래서 방이 겹치지 않고 맵 전체에 고르게 퍼짐.
    트리를 거슬러 올라가며 <b>형제 서브트리끼리</b> 이으면 모든 방이 연결됨.</p>
    <p>복도 연결 방식:</p>
    <ul>
      <li><b>순차</b>: 생성 순서대로 i→i+1을 이음. 맵을 가로지르는 긴 복도가 생김.</li>
      <li><b>MST</b>: 방 중심을 잇는 최소 신장 트리(Prim). 복도가 짧지만 막다른 곳이 많음.</li>
      <li><b>루프 추가</b>: MST에서 빠진 간선 일부를 되살려 순환로를 만듦. Spelunky 같은 로그라이크에서 동선을 다양하게 하는 데 중요함.</li>
    </ul>`,
  // 도식: 긴 쪽을 반복해서 나누는 BSP 분할, 잎마다 방 하나, 형제끼리 잇는 복도
  diagram: (L) => `<svg viewBox="0 0 540 204" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="16">${L('맵 분할과 방', 'Map split and rooms')}</text>
    <text x="290" y="16">${L('분할 트리: 긴 쪽을 반으로 나누기 반복', 'Split tree: halve the long side, repeat')}</text>
    <rect x="10" y="25" width="240" height="150" class="f-dim"/>
    <line x1="120" y1="25" x2="120" y2="175" class="d-b"/>
    <line x1="10" y1="95" x2="120" y2="95" class="d-b" stroke-dasharray="4 3"/>
    <line x1="120" y1="105" x2="250" y2="105" class="d-b" stroke-dasharray="4 3"/>
    <line x1="60" y1="80" x2="60" y2="110" class="d-line"/>
    <line x1="186" y1="85" x2="186" y2="120" class="d-line"/>
    <line x1="95" y1="59" x2="140" y2="59" class="d-accent"/>
    <rect x="25" y="38" width="70" height="42" class="f-b"/><rect x="30" y="110" width="60" height="50" class="f-b"/>
    <rect x="140" y="40" width="85" height="45" class="f-b"/><rect x="150" y="120" width="80" height="42" class="f-b"/>
    <text x="14" y="36" class="t-small">a</text><text x="14" y="106" class="t-small">b</text>
    <text x="124" y="36" class="t-small">c</text><text x="124" y="116" class="t-small">d</text>
    <line x1="410" y1="45" x2="340" y2="95" class="d-dim"/><line x1="410" y1="45" x2="480" y2="95" class="d-dim"/>
    <line x1="340" y1="95" x2="310" y2="140" class="d-dim"/><line x1="340" y1="95" x2="370" y2="140" class="d-dim"/>
    <line x1="480" y1="95" x2="450" y2="140" class="d-dim"/><line x1="480" y1="95" x2="510" y2="140" class="d-dim"/>
    <line x1="352" y1="95" x2="468" y2="95" class="d-accent" stroke-dasharray="4 3"/>
    <line x1="318" y1="146" x2="362" y2="146" class="d-line" stroke-dasharray="4 3"/>
    <line x1="458" y1="146" x2="502" y2="146" class="d-line" stroke-dasharray="4 3"/>
    <circle cx="410" cy="45" r="9" class="f-dim"/><circle cx="340" cy="95" r="9" class="f-dim"/><circle cx="480" cy="95" r="9" class="f-dim"/>
    <text x="424" y="42" class="t-small t-dim">${L('세로 분할', 'vertical cut')}</text>
    <text x="330" y="80" class="t-small t-dim" text-anchor="end">${L('가로 분할', 'horizontal cut')}</text>
    ${[['a', 310], ['b', 370], ['c', 450], ['d', 510]].map(([n, x]) => `<rect x="${x - 8}" y="140" width="16" height="12" class="f-b"/><text x="${x}" y="166" text-anchor="middle" class="t-small">${n}</text>`).join('')}
    <text x="410" y="182" text-anchor="middle" class="t-small t-dim">${L('잎 노드마다 방 1개', 'one room per leaf')}</text>
    <line x1="10" y1="196" x2="30" y2="196" class="d-line"/><text x="36" y="199" class="t-small">${L('잎 형제끼리 잇는 복도', 'corridor between leaf siblings')}</text>
    <line x1="200" y1="196" x2="220" y2="196" class="d-accent"/><text x="226" y="199" class="t-small">${L('서브트리끼리 잇는 복도', 'corridor between subtrees')}</text>
    <text x="380" y="199" class="t-small t-dim">${L('결과: 모든 방이 연결됨', 'so every room is connected')}</text>
  </svg>`,
  look: [
    'A의 빨간 테두리(거절된 방)와 "거절된 시도" 수치를 방 수와 비교하면 랜덤 배치의 낭비가 보임',
    'A의 연결을 MST로 바꾸면 방을 관통하던 긴 복도가 사라지고 복도 총 길이가 크게 줄어듦',
    'B에서 "분할선 표시"를 켜고 최대 깊이를 2→6으로 올리면 트리가 깊어지고 방이 작고 많아짐',
    'MST에서 루프 비율을 올리면 순환로가 생김. 0%면 트리로만 이어져 되돌아가는 길이 길어짐.',
  ],
  refs: [
    { type: 'article', title: 'RogueBasin: Basic BSP Dungeon generation', url: 'https://www.roguebasin.com/index.php/Basic_BSP_Dungeon_generation' },
    { type: 'book', title: 'Procedural Content Generation in Games (Shaker, Togelius, Nelson), 3장 Constructive generation of dungeons', url: 'https://www.pcgbook.com/', year: 2016, note: 'BSP 던전과 에이전트 기반 던전 비교' },
    { type: 'article', title: 'Bob Nystrom: Rooms and Mazes: A Procedural Dungeon Generator', url: 'https://journal.stuffwithstuff.com/2014/12/21/rooms-and-mazes/', year: 2014, note: '랜덤 방 거절 배치, 연결, 추가 루프' },
    { type: 'book', title: 'Spelunky (Derek Yu, Boss Fight Books 2016)', year: 2016, note: '격자 방 배치에 보장된 경로와 무작위성을 섞은 설계' },
  ],
  params: [
    { key: 'method', label: '방 배치', type: 'select', group: '방', options: [
      { value: 'random', label: '랜덤 배치 (겹치면 거절)' },
      { value: 'bsp', label: 'BSP 분할' },
    ], a: 'random', b: 'bsp' },
    { key: 'attempts', label: '방 시도 횟수', type: 'int', min: 5, max: 300, default: 60, when: (p) => p.method === 'random' },
    { key: 'depth', label: 'BSP 최대 깊이', type: 'int', min: 1, max: 7, default: 4, when: (p) => p.method === 'bsp' },
    { key: 'minLeaf', label: 'BSP 최소 칸 크기', type: 'int', min: 7, max: 20, default: 9, when: (p) => p.method === 'bsp' },
    { key: 'connect', label: '복도 연결', type: 'select', group: '복도', options: [
      { value: 'seq', label: '순차 (i → i+1)' },
      { value: 'mst', label: 'MST (최소 신장 트리)' },
      { value: 'tree', label: 'BSP 형제 연결 (BSP 전용)' },
    ], a: 'seq', b: 'tree' },
    { key: 'loops', label: '루프 추가 비율 (%)', type: 'range', min: 0, max: 60, step: 1, default: 15, when: (p) => p.connect === 'mst' },
    { key: 'tile', label: '타일 크기 (px)', type: 'int', min: 4, max: 14, default: 7, shared: true, group: '표시' },
    { key: 'showSplits', label: '분할선 표시', type: 'bool', default: true, shared: true },
    { key: 'showGraph', label: '연결 그래프 표시', type: 'bool', default: false, shared: true },
    { key: 'animate', label: '생성 과정 애니메이션', type: 'bool', default: true, shared: true },
    { key: 'speed', label: '단계/초', type: 'range', min: 2, max: 200, step: 1, default: 25, shared: true, when: (p) => p.animate },
    { key: 'regen', label: '다시 생성', type: 'button', buttonLabel: '다시 생성 (새 시드)' },
  ],
  en: {
    title: 'BSP Dungeon vs Random Room Placement',
    summary: 'Random room placement vs BSP splitting. Random placement makes rooms uneven and corridors tangled. BSP builds an even dungeon with no overlap.',
    views: { a: 'Random placement + sequential links', b: 'BSP + sibling links' },
    controls: 'No input. Press "Regenerate" to build with a new seed.',
    info: `
    <p><b>Random placement</b> tries rooms with random size and position. If a room overlaps an existing one, it is dropped (red outline).
    It is simple, but the room count depends on luck. Some areas stay empty and others get crowded.</p>
    <p><b>BSP (binary space partitioning)</b> splits the map in two again and again, across or down (longer side first). The splits form a tree.
    Each end cell of the tree (leaf node) gets one room. So rooms never overlap and spread evenly over the whole map.
    Walk back up the tree and link <b>sibling subtrees</b>. Then every room is connected.</p>
    <p>Corridor linking methods:</p>
    <ul>
      <li><b>Sequential</b>: links i to i+1 in creation order. This makes long corridors across the map.</li>
      <li><b>MST</b>: a minimum spanning tree (Prim) over room centers. Corridors are short, but there are many dead ends.</li>
      <li><b>Add loops</b>: brings back some edges left out of the MST to make cycles. This matters in roguelikes like Spelunky for varied routes.</li>
    </ul>`,
    look: [
      'Compare A\'s red outlines (rejected rooms) and the "Rejected tries" value with the room count. You see how much random placement wastes.',
      'Switch A\'s linking to MST. Long corridors that cut through rooms disappear, and total corridor length drops a lot.',
      'In B, turn on "Show split lines" and raise the max depth from 2 to 6. The tree gets deeper, and rooms get smaller and more numerous.',
      'With MST, raise the loop ratio. Cycles appear. At 0% everything links as a tree, so backtracking paths get long.',
    ],
    refs: [null, { title: 'Procedural Content Generation in Games (Shaker, Togelius, Nelson), Chapter 3 Constructive generation of dungeons', note: 'Compares BSP dungeons and agent-based dungeons.' }, 'Random room placement with rejection, linking, and extra loops.', 'A design that mixes a guaranteed path and randomness in a grid of rooms.'],
    params: {
      method: { label: 'Room placement', group: 'Rooms', options: { random: 'Random (reject on overlap)', bsp: 'BSP split' } },
      attempts: 'Room tries',
      depth: 'BSP max depth',
      minLeaf: 'BSP min cell size',
      connect: { label: 'Corridor linking', group: 'Corridors', options: { seq: 'Sequential (i → i+1)', mst: 'MST (minimum spanning tree)', tree: 'BSP sibling links (BSP only)' } },
      loops: 'Extra loop ratio (%)',
      tile: { label: 'Tile size (px)', group: 'Display' },
      showSplits: 'Show split lines',
      showGraph: 'Show link graph',
      animate: 'Animate generation',
      speed: 'Steps/s',
      regen: { label: 'Regenerate', buttonLabel: 'Regenerate (new seed)' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    let regen = 0, key = '', events = [], progress = 0, mw = 0, mh = 0, info = {};
    const ROOM_MIN = 4, ROOM_MAX = 12;

    function generate(W, H) {
      mw = Math.max(20, Math.floor(W / P.tile)); mh = Math.max(14, Math.floor(H / P.tile));
      const rng = U.rng(ctx.seed * 9176 + regen * 3571 + 11);
      events = [];
      const rooms = [];
      let rejected = 0, root = null;
      const center = (r) => ({ x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2) });

      if (P.method === 'random') {
        for (let i = 0; i < P.attempts; i++) {
          const w = rng.int(ROOM_MIN, ROOM_MAX), h = rng.int(ROOM_MIN, Math.min(ROOM_MAX, mh - 3));
          const r = { x: rng.int(1, mw - w - 2), y: rng.int(1, mh - h - 2), w, h };
          const hit = rooms.some((o) => r.x - 1 < o.x + o.w && r.x + r.w + 1 > o.x && r.y - 1 < o.y + o.h && r.y + r.h + 1 > o.y);
          if (hit) { rejected++; events.push({ t: 'reject', r }); continue; }
          rooms.push(r); events.push({ t: 'room', r });
        }
      } else {
        const ml = P.minLeaf;
        const split = (n, depth) => {
          n.depth = depth;
          if (depth >= P.depth) return;
          let vert = n.w > n.h * 1.25 ? true : n.h > n.w * 1.25 ? false : rng.next() < 0.5;
          if (vert && n.w < ml * 2) vert = false;
          if (!vert && n.h < ml * 2) { if (n.w >= ml * 2) vert = true; else return; }
          if (vert) {
            const c = rng.int(ml, n.w - ml);
            n.a = { x: n.x, y: n.y, w: c, h: n.h }; n.b = { x: n.x + c, y: n.y, w: n.w - c, h: n.h };
            events.push({ t: 'split', x1: n.x + c, y1: n.y, x2: n.x + c, y2: n.y + n.h, depth });
          } else {
            const c = rng.int(ml, n.h - ml);
            n.a = { x: n.x, y: n.y, w: n.w, h: c }; n.b = { x: n.x, y: n.y + c, w: n.w, h: n.h - c };
            events.push({ t: 'split', x1: n.x, y1: n.y + c, x2: n.x + n.w, y2: n.y + c, depth });
          }
          split(n.a, depth + 1); split(n.b, depth + 1);
        };
        root = { x: 0, y: 0, w: mw, h: mh };
        split(root, 0);
        const place = (n) => {
          if (n.a) { place(n.a); place(n.b); return; }
          const w = rng.int(Math.min(ROOM_MIN, n.w - 2), Math.max(ROOM_MIN, n.w - 2));
          const h = rng.int(Math.min(ROOM_MIN, n.h - 2), Math.max(ROOM_MIN, n.h - 2));
          const rw = Math.max(2, Math.min(w, n.w - 2)), rh = Math.max(2, Math.min(h, n.h - 2));
          const r = { x: n.x + rng.int(1, Math.max(1, n.w - rw - 1)), y: n.y + rng.int(1, Math.max(1, n.h - rh - 1)), w: rw, h: rh };
          n.room = r; rooms.push(r); events.push({ t: 'room', r });
        };
        place(root);
      }

      // 연결 간선 결정
      const edges = [];
      const mode = P.connect === 'tree' && !root ? 'mst' : P.connect;
      if (mode === 'seq') for (let i = 0; i + 1 < rooms.length; i++) edges.push([i, i + 1]);
      else if (mode === 'tree') {
        const walk = (n) => {
          if (!n.a) return [rooms.indexOf(n.room)];
          const A = walk(n.a), B = walk(n.b);
          let best = null, bd = Infinity;
          for (const i of A) for (const j of B) {
            const ca = center(rooms[i]), cb = center(rooms[j]);
            const d = Math.abs(ca.x - cb.x) + Math.abs(ca.y - cb.y);
            if (d < bd) { bd = d; best = [i, j]; }
          }
          edges.push(best);
          return A.concat(B);
        };
        walk(root);
      } else if (rooms.length > 1) {
        const n = rooms.length, cs = rooms.map(center);
        const dist = (i, j) => Math.hypot(cs[i].x - cs[j].x, cs[i].y - cs[j].y);
        const inT = new Uint8Array(n), best = new Float64Array(n).fill(Infinity), from = new Int32Array(n).fill(-1);
        best[0] = 0;
        const used = new Set();
        for (let k = 0; k < n; k++) {
          let u = -1; for (let i = 0; i < n; i++) if (!inT[i] && (u < 0 || best[i] < best[u])) u = i;
          inT[u] = 1;
          if (from[u] >= 0) { edges.push([from[u], u]); used.add(Math.min(u, from[u]) + ',' + Math.max(u, from[u])); }
          for (let v = 0; v < n; v++) if (!inT[v] && dist(u, v) < best[v]) { best[v] = dist(u, v); from[v] = u; }
        }
        // 루프: 짧은 비MST 간선 중 일부 추가
        const extra = [];
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (!used.has(i + ',' + j) && dist(i, j) < 28) extra.push([i, j, dist(i, j)]);
        extra.sort((a, b) => a[2] - b[2]);
        const want = Math.round((n - 1) * P.loops / 100);
        for (let k = 0; k < extra.length && k < want; k++) edges.push([extra[k][0], extra[k][1]]);
      }

      // 복도: L자 경로
      let corridorTiles = 0;
      for (const [i, j] of edges) {
        const a = center(rooms[i]), b = center(rooms[j]);
        const path = [];
        const hFirst = rng.next() < 0.5;
        const sx = Math.sign(b.x - a.x), sy = Math.sign(b.y - a.y);
        let x = a.x, y = a.y;
        path.push([x, y]);
        if (hFirst) { while (x !== b.x) { x += sx; path.push([x, y]); } while (y !== b.y) { y += sy; path.push([x, y]); } }
        else { while (y !== b.y) { y += sy; path.push([x, y]); } while (x !== b.x) { x += sx; path.push([x, y]); } }
        corridorTiles += path.length;
        events.push({ t: 'corr', path, a, b });
      }
      const grid = new Uint8Array(mw * mh);
      for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) grid[y * mw + x] = 1;
      let through = 0;
      for (const e of events) if (e.t === 'corr') for (const [x, y] of e.path) { if (grid[y * mw + x] === 0) grid[y * mw + x] = 2; }
      let floor = 0; for (const v of grid) if (v) floor++;
      // 복도가 다른 방을 관통한 횟수 (출발/도착 방 제외)
      for (const e of events) if (e.t === 'corr') {
        const seen = new Set();
        for (const [x, y] of e.path) rooms.forEach((r, k) => {
          if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h && !(e.a.x >= r.x && e.a.x < r.x + r.w && e.a.y >= r.y && e.a.y < r.y + r.h) && !(e.b.x >= r.x && e.b.x < r.x + r.w && e.b.y >= r.y && e.b.y < r.y + r.h)) seen.add(k);
        });
        through += seen.size;
      }
      info = { rooms: rooms.length, rejected, corridorTiles, floor: (floor / (mw * mh)) * 100, edges: edges.length, through, fallback: P.connect === 'tree' && !root };
      progress = P.animate ? 0 : events.length;
    }

    return {
      update(dt) { if (P.animate && progress < events.length) progress = Math.min(events.length, progress + P.speed * dt); },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const k = [P.method, P.attempts, P.depth, P.minLeaf, P.connect, P.loops, P.tile, regen, W, H].join('|');
        if (k !== key) { generate(W, H); key = k; }
        const T = Math.min(W / mw, H / mh), ox = (W - mw * T) / 2, oy = (H - mh * T) / 2;
        const col = ctx.side === 'a' ? C.a : C.b;
        D.rect(g, ox, oy, mw * T, mh * T, '#0d0e12');
        const n = Math.floor(P.animate ? progress : events.length);
        // 바닥: 복도 먼저, 방이 위
        for (let i = 0; i < n; i++) {
          const e = events[i];
          if (e.t === 'corr') { g.fillStyle = '#6d6a5e'; for (const [x, y] of e.path) g.fillRect(ox + x * T, oy + y * T, T, T); }
        }
        for (let i = 0; i < n; i++) {
          const e = events[i];
          if (e.t === 'room') D.rect(g, ox + e.r.x * T, oy + e.r.y * T, e.r.w * T, e.r.h * T, '#b8a682', 'rgba(0,0,0,0.5)', 1);
          else if (e.t === 'reject') D.rect(g, ox + e.r.x * T, oy + e.r.y * T, e.r.w * T, e.r.h * T, null, i === n - 1 ? C.bad : 'rgba(255,83,112,0.22)', 1);
          else if (e.t === 'split' && P.showSplits) D.line(g, ox + e.x1 * T, oy + e.y1 * T, ox + e.x2 * T, oy + e.y2 * T, U.hsl(190 + e.depth * 30, 80, 65, 0.9 - e.depth * 0.1), Math.max(1, 3 - e.depth * 0.5));
        }
        if (P.showGraph) for (let i = 0; i < n; i++) {
          const e = events[i];
          if (e.t === 'corr') { D.line(g, ox + (e.a.x + 0.5) * T, oy + (e.a.y + 0.5) * T, ox + (e.b.x + 0.5) * T, oy + (e.b.y + 0.5) * T, col, 1.5); D.circle(g, ox + (e.a.x + 0.5) * T, oy + (e.a.y + 0.5) * T, 3, col); }
        }
        if (n < events.length) D.text(g, GTL.L(`생성 중 ${n}/${events.length}`, `Generating ${n}/${events.length}`), 8, 8, { color: col });
        ctx.stat(GTL.L('방 수', 'Rooms'), info.rooms);
        if (P.method === 'random') ctx.stat(GTL.L('거절된 시도', 'Rejected tries'), info.rejected);
        ctx.stat(GTL.L('바닥 비율', 'Floor ratio'), info.floor.toFixed(1) + ' %');
        ctx.stat(GTL.L('복도 타일 (총 길이)', 'Corridor tiles (total length)'), info.corridorTiles);
        ctx.stat(GTL.L('복도가 관통한 방', 'Rooms cut by corridors'), info.through);
        if (info.fallback) ctx.stat(GTL.L('참고', 'Note'), GTL.L('BSP 아님 → MST로 대체', 'Not BSP → using MST'));
      },
      onAction(key) { if (key === 'regen') regen++; },
    };
  },
});
