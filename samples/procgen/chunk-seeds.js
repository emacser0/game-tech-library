// 시드 & 결정론: 청크별 해시 시드 vs 순차 RNG. 탐험 순서가 달라도 같은 세계가 나오는지 확인
GTL.register({
  id: 'chunk-seeds',
  title: '시드 & 결정론: 청크 해시 시드 vs 순차 RNG',
  summary: '순차 RNG vs 청크 좌표 해시 시드 비교. 순차 RNG는 탐험 순서에 따라 세계가 달라짐. 좌표 해시 시드는 어떤 순서로 가도 같은 세계가 나옴.',
  views: { a: '순차 RNG (전역 난수 스트림)', b: '좌표 해시 시드' },
  controls: '조작 없음. 두 패널은 같은 월드 시드로 서로 다른 순서로 탐험함.',
  info: `
    <p>무한 월드는 플레이어가 다가갈 때 청크(맵 조각)를 생성함. 이때 청크마다 쓸 난수를 어디서 얻느냐가 문제임.</p>
    <p>각 뷰의 두 패널은 <b>같은 월드 시드</b>를 쓰는 두 플레이어임(또는 저장 후 다시 불러온 같은 플레이어).
    왼쪽은 행 우선, 오른쪽은 다른 순서로 청크를 방문함.
    두 패널이 모두 방문한 청크의 내용이 같으면 초록, 다르면 빨강 테두리.</p>
    <p><b>순차 RNG</b>: <code>rng = new Rng(worldSeed)</code> 하나에서 청크를 만들 때마다 값을 꺼냄.
    청크 (3,2)의 내용은 "그 전에 난수를 몇 번 뽑았는가"에 따라 달라짐. 그래서 순서가 바뀌면 다른 세계가 됨.
    다음이 모두 깨짐:</p>
    <ul>
      <li>멀티플레이 동기화</li>
      <li>세이브에서 다시 생성</li>
      <li>청크를 내렸다가(언로드) 다시 생성</li>
    </ul>
    <p><b>좌표 해시</b>: <code>rng = new Rng(hash(worldSeed, cx, cy))</code>. 청크는 자기 좌표만으로 정해짐.
    그래서 순서와 무관하고 병렬 생성도 가능함.</p>
    <p>단점: <b>나쁜 해시</b>(예: <code>seed + cx + cy</code>)를 쓰면 (1,0)과 (0,1)이 같은 시드가 됨.
    그 결과 대각선 방향으로 같은 청크가 반복됨. 입력이 조금만 바뀌어도 출력이 크게 바뀌는(avalanche) 해시를 써야 함.</p>`,
  // 도식: 방문 순서에 따라 같은 청크가 다른 난수를 받는 순차 RNG vs 좌표만으로 정해지는 해시 시드
  diagram: (L) => {
    const grid = (x, y, cells, cls) => cells.map((t, i) => {
      const cx = x + (i % 2) * 34, cy = y + Math.floor(i / 2) * 26;
      return `<rect x="${cx}" y="${cy}" width="34" height="26" class="f-dim"/><text x="${cx + 17}" y="${cy + 17}" text-anchor="middle" class="t-mono t-small">${t}</text>`;
    }).join('') + `<rect x="${x + 34}" y="${y + 26}" width="34" height="26" class="${cls}"/>`;
    return `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="14" class="t-a">${L('A 순차 RNG: 방문 순서대로 다음 난수 배정', 'A sequential RNG: next value in visit order')}</text>
    ${grid(20, 22, ['r1', 'r2', 'r3', 'r4'], 'd-bad')}${grid(110, 22, ['r4', 'r3', 'r2', 'r1'], 'd-bad')}
    <text x="54" y="88" text-anchor="middle" class="t-small t-dim">${L('P1: 행 우선', 'P1: row order')}</text>
    <text x="144" y="88" text-anchor="middle" class="t-small t-dim">${L('P2: 역순', 'P2: reverse')}</text>
    <text x="200" y="44">${L('같은 청크 (1,1)인데 r4 vs r1', 'Same chunk (1,1) gets r4 vs r1')}</text>
    <text x="200" y="60" class="t-small t-dim">${L('순서가 바뀌면 다른 세계가 됨', 'A new visit order makes a different world')}</text>
    <text x="10" y="112" class="t-b">${L('B 좌표 해시: seed = hash(world, cx, cy)', 'B coordinate hash: seed = hash(world, cx, cy)')}</text>
    ${grid(20, 120, ['h00', 'h10', 'h01', 'h11'], 'd-good')}${grid(110, 120, ['h00', 'h10', 'h01', 'h11'], 'd-good')}
    <text x="54" y="186" text-anchor="middle" class="t-small t-dim">${L('P1: 행 우선', 'P1: row order')}</text>
    <text x="144" y="186" text-anchor="middle" class="t-small t-dim">${L('P2: 역순', 'P2: reverse')}</text>
    <text x="200" y="142">${L('방문 순서와 상관없이 같은 내용', 'Same content in any visit order')}</text>
    <text x="200" y="158" class="t-small t-dim">${L('나쁜 해시 seed + cx + cy는 (1,0)과 (0,1)이 같아짐', 'A bad hash like seed + cx + cy makes (1,0) equal (0,1)')}</text>
  </svg>`;
  },
  look: [
    'A를 보면 공통 청크가 거의 전부 빨강임(같은 시드인데 다른 세계). B는 공통 청크가 모두 초록임.',
    'A에서 왼쪽 첫 청크와 오른쪽 첫 청크(중앙)를 비교하면 내용이 같음. 같은 순번의 난수를 받았기 때문임. 위치가 아니라 순서가 내용을 정함.',
    'B의 방식을 "나쁜 해시 (seed + x + y)"로 바꾸면 모두 초록이지만 대각선 줄무늬로 같은 청크가 반복됨("중복 청크" 수치 증가).',
    '오른쪽 패널 순서를 "무작위"로 바꿔도 B는 여전히 전부 일치함.',
    'Minecraft에서 시드 공유가 가능한 이유도 같음. 지형이 (월드 시드, 좌표)만으로 정해지는 순수 함수이기 때문임.',
  ],
  refs: [
    { type: 'game', title: 'Minecraft: 월드 시드', note: '같은 시드와 같은 버전이면 탐험 순서와 무관하게 같은 지형. 청크 좌표에서 시드를 파생.' },
    { type: 'game', title: "No Man's Sky (Hello Games, 2016)", note: '1,800경 개 행성을 저장하지 않음. 좌표와 시드로 결정론적으로 다시 생성.' },
    { type: 'talk', title: 'Squirrel Eiserloh: Noise-Based RNG (GDC 2017 Math for Game Programmers)', year: 2017, note: '상태 있는 RNG 대신 위치 기반 해시 노이즈(Squirrel3)를 쓰자는 발표.' },
    { type: 'article', title: 'Red Blob Games: Making maps with noise functions', url: 'https://www.redblobgames.com/maps/terrain-from-noise/', note: '지형을 좌표의 함수로 다룸.' },
  ],
  params: [
    { key: 'method', label: '청크 시드 방식', type: 'select', group: '시드', options: [
      { value: 'seq', label: '순차 RNG (전역 스트림)' },
      { value: 'hash', label: '좌표 해시 hash(seed, x, y)' },
      { value: 'naive', label: '나쁜 해시 (seed + x + y)' },
    ], a: 'seq', b: 'hash' },
    { key: 'order2', label: '오른쪽 패널 탐험 순서', type: 'select', group: '장면', options: [
      { value: 'spiral', label: '나선 (중앙부터)' },
      { value: 'col', label: '열 우선 (↓)' },
      { value: 'random', label: '무작위' },
    ], default: 'spiral', shared: true },
    { key: 'grid', label: '청크 격자 (N×N)', type: 'int', min: 3, max: 11, default: 7, shared: true },
    { key: 'speed', label: '탐험 속도 (청크/초)', type: 'range', min: 1, max: 60, step: 1, default: 8, shared: true },
    { key: 'loop', label: '완료 후 새 월드 시드', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Seeds & Determinism: Chunk Hash Seeds vs Sequential RNG',
    summary: 'Sequential RNG vs chunk coordinate hash seeds. With a sequential RNG, the world changes with the exploration order. With coordinate hash seeds, you get the same world in any order.',
    views: { a: 'Sequential RNG (global random stream)', b: 'Coordinate hash seed' },
    controls: 'No input. The two panels explore with the same world seed in different orders.',
    info: `
    <p>An infinite world builds chunks (map pieces) as the player comes near. The question is where each chunk gets its random numbers.</p>
    <p>The two panels in each view are two players with <b>the same world seed</b> (or the same player after save and reload).
    The left one visits chunks row by row. The right one uses a different order.
    If a chunk both panels visited has the same content, its outline is green. If not, it is red.</p>
    <p><b>Sequential RNG</b>: takes values from one <code>rng = new Rng(worldSeed)</code> each time it builds a chunk.
    The content of chunk (3,2) depends on "how many random numbers were drawn before it". So a different order gives a different world.
    All of these break:</p>
    <ul>
      <li>Multiplayer sync</li>
      <li>Rebuilding from a save</li>
      <li>Unloading a chunk and building it again</li>
    </ul>
    <p><b>Coordinate hash</b>: <code>rng = new Rng(hash(worldSeed, cx, cy))</code>. A chunk depends only on its own coordinates.
    So order does not matter, and you can even build chunks in parallel.</p>
    <p>Downside: with a <b>bad hash</b> (for example <code>seed + cx + cy</code>), (1,0) and (0,1) get the same seed.
    As a result, the same chunk repeats along diagonals. Use a hash where a small input change makes a large output change (avalanche).</p>`,
    look: [
      'Look at A. Almost all shared chunks are red (same seed, different world). In B, all shared chunks are green.',
      'In A, compare the left panel\'s first chunk with the right panel\'s first chunk (center). The content is the same, because both got the random numbers in the same turn. Order, not position, decides the content.',
      'Switch B\'s method to "Bad hash (seed + x + y)". Everything is green, but the same chunk repeats in diagonal stripes (the "Duplicate chunks" value rises).',
      'Set the right panel\'s order to "Random". B still matches everywhere.',
      'This is also why Minecraft players can share seeds. Terrain is a pure function of (world seed, coordinates) only.',
    ],
    refs: [{ title: 'Minecraft: world seed', note: 'The same seed and version give the same terrain in any exploration order. Seeds come from chunk coordinates.' }, 'It does not store its 18 quintillion planets. It rebuilds them in a deterministic way from coordinates and a seed.', 'A talk that argues for position-based hash noise (Squirrel3) instead of a stateful RNG.', 'Treats terrain as a function of coordinates.'],
    params: {
      method: { label: 'Chunk seed method', group: 'Seed', options: { seq: 'Sequential RNG (global stream)', hash: 'Coordinate hash hash(seed, x, y)', naive: 'Bad hash (seed + x + y)' } },
      order2: { label: 'Right panel exploration order', group: 'Scene', options: { spiral: 'Spiral (from center)', col: 'Column first (↓)', random: 'Random' } },
      grid: 'Chunk grid (N×N)',
      speed: 'Exploration speed (chunks/s)',
      loop: 'New world seed after finish',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const mix = (h) => { h = Math.imul(h ^ (h >>> 16), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); return (h ^ (h >>> 16)) >>> 0; };
    const hash = (s, x, y) => mix(mix(mix(s) ^ Math.imul(x, 0x27d4eb2d)) ^ Math.imul(y, 0x165667b1));
    const BIOMES = [
      { name: '초원', c: '#4f8a3e', o: '#2f5a24' }, { name: '사막', c: '#c9b26b', o: '#8a6d3b' },
      { name: '설원', c: '#cfd8e0', o: '#6a7f8f' }, { name: '숲', c: '#2e6034', o: '#173d1c' },
      { name: '늪', c: '#4a5a3a', o: '#26331f' },
    ];

    let world = 0, key = '', panels = [], progress = 0, hold = 0;

    function orderFor(kind, N, rng) {
      const cells = [];
      if (kind === 'row') { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) cells.push([x, y]); }
      else if (kind === 'col') { for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) cells.push([x, y]); }
      else if (kind === 'random') { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) cells.push([x, y]); rng.shuffle(cells); }
      else {
        let x = Math.floor((N - 1) / 2), y = x, dx = 1, dy = 0, len = 1;
        const seen = new Set(), push = () => { if (x >= 0 && y >= 0 && x < N && y < N && !seen.has(x + ',' + y)) { seen.add(x + ',' + y); cells.push([x, y]); } };
        push();
        while (cells.length < N * N) {
          for (let r = 0; r < 2; r++) { for (let k = 0; k < len; k++) { x += dx; y += dy; push(); } [dx, dy] = [-dy, dx]; }
          len++;
        }
      }
      return cells;
    }

    function reset() {
      const N = P.grid;
      const ordRng = U.rng(ctx.seed * 17 + world * 101 + 1);
      panels = [
        { label: GTL.L('플레이어 1: 행 우선 →', 'Player 1: row first →'), order: orderFor('row', N, ordRng), chunks: new Map(), rng: null },
        { label: { spiral: GTL.L('플레이어 2: 나선', 'Player 2: spiral'), col: GTL.L('플레이어 2: 열 우선 ↓', 'Player 2: column first ↓'), random: GTL.L('플레이어 2: 무작위', 'Player 2: random') }[P.order2], order: orderFor(P.order2, N, ordRng), chunks: new Map(), rng: null },
      ];
      const worldSeed = (ctx.seed * 7919 + world * 104729) >>> 0;
      for (const p of panels) { p.worldSeed = worldSeed; p.rng = U.rng(worldSeed); }
      progress = 0; hold = 0;
    }

    // 청크 생성: 바이옴 + 오브젝트. 시드 방식에 따라 rng 출처가 다름
    function genChunk(p, cx, cy) {
      let r;
      if (P.method === 'seq') r = p.rng; // 전역 스트림을 계속 소비
      else if (P.method === 'hash') r = U.rng(hash(p.worldSeed, cx, cy) || 1);
      else r = U.rng((p.worldSeed + cx + cy) >>> 0 || 1);
      const biome = Math.floor(r.next() * BIOMES.length);
      const n = 2 + Math.floor(r.next() * 5), objs = [];
      for (let i = 0; i < n; i++) objs.push([r.next(), r.next(), r.next() < 0.6 ? 0 : 1, 0.6 + r.next() * 0.6]);
      const sig = biome + ':' + objs.map((o) => o.map((v) => v.toFixed(3)).join(',')).join(';');
      return { biome, objs, sig };
    }

    function advanceTo(n) {
      const N2 = P.grid * P.grid;
      for (const p of panels) {
        while (p.chunks.size < Math.min(n, N2)) {
          const [x, y] = p.order[p.chunks.size];
          p.chunks.set(x + ',' + y, genChunk(p, x, y));
        }
      }
    }

    return {
      update(dt) {
        const k = [P.method, P.order2, P.grid].join('|');
        if (k !== key) { reset(); key = k; }
        const N2 = P.grid * P.grid;
        if (progress < N2) { progress = Math.min(N2, progress + P.speed * dt); advanceTo(Math.floor(progress)); }
        else if (P.loop) { hold += dt; if (hold > 2.5) { world++; reset(); } }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height, N = P.grid;
        if (!panels.length) { reset(); key = [P.method, P.order2, P.grid].join('|'); }
        const gap = 14, top = 30;
        const pw = (W - gap * 3) / 2;
        const cs = Math.max(4, Math.floor(Math.min(pw, H - top - 12) / N));
        const col = ctx.side === 'a' ? C.a : C.b;
        // 비교: 두 패널 모두 생성된 청크
        let common = 0, same = 0;
        const status = new Map();
        for (const [k, c] of panels[0].chunks) {
          const o = panels[1].chunks.get(k);
          if (!o) continue;
          common++;
          const eq = o.sig === c.sig;
          if (eq) same++;
          status.set(k, eq);
        }
        panels.forEach((p, pi) => {
          const ox = gap + pi * (pw + gap) + (pw - cs * N) / 2, oy = top;
          D.text(g, p.label, ox, 8, { color: C.text, size: 11 });
          // 중복 시그니처 수
          for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            const k = x + ',' + y, c = p.chunks.get(k), px = ox + x * cs, py = oy + y * cs;
            if (!c) { D.rect(g, px, py, cs - 1, cs - 1, '#1c1f26'); continue; }
            const b = BIOMES[c.biome];
            D.rect(g, px, py, cs - 1, cs - 1, b.c);
            for (const o of c.objs) {
              const qx = px + 3 + o[0] * (cs - 7), qy = py + 3 + o[1] * (cs - 7), s = Math.max(1.5, cs * 0.09 * o[3]);
              if (o[2] === 0) D.circle(g, qx, qy, s, b.o);
              else D.poly(g, [{ x: qx, y: qy - s * 1.3 }, { x: qx + s, y: qy + s * 0.8 }, { x: qx - s, y: qy + s * 0.8 }], '#7d7a72');
            }
            if (status.has(k)) D.rect(g, px + 1, py + 1, cs - 3, cs - 3, null, status.get(k) ? C.good : C.bad, 2);
          }
          // 현재 탐험 위치
          const idx = Math.min(p.chunks.size, N * N) - 1;
          if (idx >= 0 && p.chunks.size < N * N) {
            const [x, y] = p.order[idx];
            D.circle(g, ox + (x + 0.5) * cs, oy + (y + 0.5) * cs, Math.max(3, cs * 0.18), col, '#000', 1.5);
          }
        });
        // 같은 월드 안의 중복 청크 (나쁜 해시 감지)
        const counts = new Map();
        for (const c of panels[0].chunks.values()) counts.set(c.sig, (counts.get(c.sig) || 0) + 1);
        let dup = 0; for (const v of counts.values()) if (v > 1) dup += v;
        ctx.stat(GTL.L('공통 청크 중 일치', 'Matches among shared chunks'), `${same} / ${common}`);
        ctx.stat(GTL.L('일치율', 'Match rate'), common ? ((same / common) * 100).toFixed(0) + ' %' : '-');
        ctx.stat(GTL.L('중복 청크 (같은 내용)', 'Duplicate chunks (same content)'), dup);
        ctx.stat(GTL.L('월드 시드', 'World seed'), panels[0].worldSeed);
      },
    };
  },
});
