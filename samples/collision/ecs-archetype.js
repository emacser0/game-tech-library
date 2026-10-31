// ECS 아키타입 청크 (Unity Entities, Unreal Mass): 이질적인 객체 배열 vs 아키타입별 SoA 청크
GTL.register({
  id: 'ecs-archetype',
  title: 'ECS 아키타입 청크 (Unity Entities, Unreal Mass)',
  summary: '종류가 섞인 객체 배열을 가상 호출로 업데이트하는 방식과, 같은 컴포넌트 조합끼리 청크에 모아 시스템이 맞는 청크만 도는 방식을 비교함. 대신 컴포넌트를 붙이고 떼면 엔티티가 다른 청크로 옮겨 가는 비용이 생김.',
  views: { a: '객체 배열 + 가상 호출', b: '아키타입 청크' },
  info: `
    <p><b>ECS</b>(Entity Component System)에서 엔티티는 번호일 뿐이고, 데이터는 컴포넌트(위치, 속도, 체력 등)에 있음. <b>아키타입</b>은 컴포넌트 조합 하나. 같은 아키타입의 엔티티는 같은 <b>청크</b>에 모임.</p>
    <p>청크 안에서는 컴포넌트마다 배열이 따로 있음(SoA). 그래서 이동 시스템은 위치와 속도 배열만 차례로 읽음. Unity Entities는 16KB 청크, Unreal Mass는 프래그먼트(Fragment) 청크를 씀.</p>
    <p>A 방식(객체 배열)의 문제:</p>
    <ul>
      <li>여러 종류 객체가 생성 순서대로 섞여 메모리에 흩어짐.</li>
      <li>객체마다 가상 호출과 종류별 분기가 생김. 쓰지 않는 필드도 캐시에 같이 올라옴.</li>
    </ul>
    <p>B 방식의 동작:</p>
    <ul>
      <li>시스템은 필요한 컴포넌트를 모두 가진 아키타입만 찾음(쿼리).</li>
      <li>맞는 청크를 처음부터 끝까지 분기 없이 돎.</li>
    </ul>
    <p>단점: 컴포넌트를 붙이거나 떼는 <b>구조 변경</b>(structural change)은 엔티티를 다른 아키타입의 청크로 복사하고, 빈자리를 마지막 엔티티로 메움. 자주 바뀌는 상태는 컴포넌트 대신 값(플래그)으로 두는 편이 나음.</p>
    <p>이 샘플은 JavaScript라서 실제 엔진보다 차이가 작게 나올 수 있음. 측정값은 이 브라우저에서 잰 실제 시간.</p>`,
  // 도식: 섞인 객체 배열 vs 아키타입 청크(컴포넌트별 열), 구조 변경 시 이동
  diagram: (L) => {
    const kinds = ['f-good', 'f-accent', 'f-bad', 'f-dim'];
    const seq = [0, 2, 1, 1, 3, 0, 2, 1, 3, 2, 0, 1, 1, 2, 3, 0];
    let a = '';
    seq.forEach((k, i) => { a += `<rect x="${110 + i * 26}" y="22" width="24" height="18" class="${kinds[k]}"/>`; });
    return `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="4" y="35" class="t-a">${L('A: 객체 배열', 'A: object array')}</text>
    ${a}
    <text x="110" y="56" class="t-small t-dim">${L('종류가 섞인 순서. 객체마다 가상 호출, 분기', 'Kinds mixed in memory. A virtual call and a branch per object')}</text>
    <text x="4" y="86" class="t-b">${L('B: 아키타입 청크', 'B: archetype chunks')}</text>
    <text x="110" y="78" class="t-small t-dim">${L('청크 [위치, 속도, 체력, AI]', 'chunk [Pos, Vel, Hp, AI]')}</text>
    <rect x="110" y="84" width="150" height="12" class="f-good"/><rect x="110" y="98" width="150" height="12" class="f-accent"/>
    <rect x="110" y="112" width="150" height="12" class="f-bad"/><rect x="110" y="126" width="150" height="12" class="f-dim"/>
    <text x="114" y="93" class="t-small t-mono">x y x y x y ...</text>
    <text x="114" y="107" class="t-small t-mono">vx vy vx vy ...</text>
    <text x="300" y="78" class="t-small t-dim">${L('청크 [위치, 속도, 체력, AI, 화상]', 'chunk [Pos, Vel, Hp, AI, Burn]')}</text>
    <rect x="300" y="84" width="150" height="12" class="f-good"/><rect x="300" y="98" width="150" height="12" class="f-accent"/>
    <rect x="300" y="112" width="150" height="12" class="f-bad"/><rect x="300" y="126" width="150" height="12" class="f-dim"/>
    <rect x="300" y="140" width="150" height="12" class="f-b"/>
    <path d="M262,104 L296,104" class="d-accent" marker-end="url(#arr)"/>
    <text x="110" y="158" class="t-small">${L('같은 열을 끝까지 읽음: 분기 없음', 'Reads one column to the end: no branches')}</text>
    <text x="300" y="174" class="t-small t-b">${L('화상 추가 = 다른 청크로 복사', 'Add Burn = copy to another chunk')}</text>
    <text x="300" y="188" class="t-small t-dim">${L('빈자리는 마지막 엔티티로 메움', 'The gap is filled by the last entity')}</text>
  </svg>`;
  },
  look: [
    '기본 상태에서 "업데이트" ms를 비교함. B가 더 빠름. 엔티티 수를 늘리면 차이가 커짐.',
    'B의 메모리 그림을 봄. 아키타입마다 청크가 한 줄씩 있고, 청크 안은 컴포넌트별 색 띠로 나뉨. A는 종류 색이 뒤섞여 있음.',
    '"프레임당 구조 변경"을 2000으로 올리면 B의 "구조 변경" ms가 A보다 몇 배 커짐. A는 플래그만 바꿈. B는 엔티티를 매번 다른 청크로 복사함.',
    '"프레임당 구조 변경"을 0으로 두고 다시 시작하면 "청크 채움 비율"이 100 %에 가까움. 구조 변경을 켜면 두 아키타입 청크에 빈자리가 생겨 비율이 떨어짐.',
  ],
  refs: [
    { type: 'engine', title: 'Unity Entities - Archetypes concepts, Chunks, Structural changes', note: 'Entities 패키지 문서. 아키타입, 16KB 청크, 구조 변경 비용과 EntityCommandBuffer.' },
    { type: 'engine', title: 'Unreal Engine - MassEntity (Fragments, Archetypes, Processors)', note: 'Mass의 프래그먼트, 아키타입 청크, 프로세서(시스템).' },
    { type: 'talk', title: 'Overwatch Gameplay Architecture and Netcode', year: 2017, note: 'Timothy Ford, GDC 2017. 실제 게임의 ECS 구조.' },
    { type: 'talk', title: 'Data-Oriented Design and C++', year: 2014, note: 'Mike Acton, CppCon 2014.' },
    { type: 'article', title: 'Building an ECS #2: Archetypes and Vectorization', note: 'Sander Mertens (Flecs 작성자).' },
  ],
  params: [
    { key: 'count', label: '엔티티 수', type: 'int', min: 5000, max: 200000, step: 5000, default: 60000, shared: true, reset: true, group: '장면' },
    { key: 'layout', label: '저장 방식', type: 'select', group: '저장', reset: true, options: [
      { value: 'objects', label: '객체 배열 + 가상 호출' },
      { value: 'archetype', label: '아키타입 청크 (SoA)' },
    ], a: 'objects', b: 'archetype' },
    { key: 'changes', label: '프레임당 구조 변경', type: 'int', min: 0, max: 2000, step: 10, default: 100, shared: true, help: '적 엔티티에 화상(Burn) 컴포넌트를 붙이거나 뗌' },
    { key: 'graphMax', label: '그래프 최대 (ms)', type: 'range', min: 1, max: 30, step: 1, default: 6, shared: true },
  ],
  en: {
    title: 'ECS Archetype Chunks (Unity Entities, Unreal Mass)',
    summary: 'Compares updating a mixed array of objects through virtual calls with storing entities of the same component set together in chunks, where each system walks only the matching chunks. The cost: adding or removing a component moves the entity to another chunk.',
    views: { a: 'Object array + virtual calls', b: 'Archetype chunks' },
    info: `
    <p>In <b>ECS</b> (Entity Component System), an entity is only a number. The data lives in components (position, velocity, health, and so on). An <b>archetype</b> is one set of components. Entities of the same archetype live together in the same <b>chunks</b>.</p>
    <p>Inside a chunk, each component has its own array (SoA). So the move system reads only the position and velocity arrays in order. Unity Entities uses 16 KB chunks. Unreal Mass uses fragment chunks.</p>
    <p>Problems with A (an object array):</p>
    <ul>
      <li>Objects of different kinds are mixed in creation order and scattered in memory.</li>
      <li>Every object costs a virtual call and a branch on its kind. Unused fields come into the cache too.</li>
    </ul>
    <p>How B works:</p>
    <ul>
      <li>A system finds only the archetypes that have all the components it needs (a query).</li>
      <li>It walks each matching chunk from start to end with no branches.</li>
    </ul>
    <p>Downside: adding or removing a component is a <b>structural change</b>. It copies the entity into a chunk of another archetype and fills the gap with the last entity. State that changes often is better kept as a value (a flag) than as a component.</p>
    <p>This sample is JavaScript, so the gap can be smaller than in a real engine. The numbers are real times measured in this browser.</p>`,
    look: [
      'Compare "Update" ms in the default state. B is faster. Raise the entity count and the gap grows.',
      'Look at the memory picture of B. Each archetype has one row of chunks, and each chunk is split into colored bands per component. In A the kind colors are mixed.',
      'Raise "Structural changes per frame" to 2000. The "Structural changes" ms of B becomes several times that of A. A only flips a flag. B copies the entity to another chunk every time.',
      'Set "Structural changes per frame" to 0 and restart. "Chunk fill" is close to 100 %. Turn changes back on: chunks of both archetypes get gaps and the fill drops.',
    ],
    refs: ['Entities package docs. Archetypes, 16 KB chunks, structural change cost, EntityCommandBuffer.', 'Mass fragments, archetype chunks, processors (systems).', 'Timothy Ford, GDC 2017. The ECS design of a shipped game.', 'Mike Acton, CppCon 2014.', 'Sander Mertens (author of Flecs).'],
    params: {
      count: { label: 'Entity count', group: 'Scene' },
      layout: { label: 'Storage', group: 'Storage', options: { objects: 'Object array + virtual calls', archetype: 'Archetype chunks (SoA)' } },
      changes: { label: 'Structural changes per frame', help: 'Adds or removes a Burn component on enemy entities' },
      graphMax: 'Graph max (ms)',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    // 컴포넌트 비트
    const POS = 1, VEL = 2, HP = 4, AI = 8, SPIN = 16, BURN = 32;
    const COMPS = [POS, VEL, HP, AI, SPIN, BURN];
    const CNAME = () => [GTL.L('위치', 'Pos'), GTL.L('속도', 'Vel'), GTL.L('체력', 'Hp'), GTL.L('AI', 'AI'), GTL.L('회전', 'Spin'), GTL.L('화상', 'Burn')];
    const CCOL = [C.good, C.warn, C.bad, C.accent, '#89ddff', '#f78c6c'];
    const FIELDS = { 1: ['x', 'y'], 2: ['vx', 'vy'], 4: ['hp'], 8: ['ph'], 16: ['ang'], 32: ['bt'] };
    // 종류: 돌, 총알, 적, 아이템
    const KINDS = [POS | SPIN, POS | VEL, POS | VEL | HP | AI, POS | VEL | SPIN];
    const KNAME = () => [GTL.L('돌', 'Rock'), GTL.L('총알', 'Bullet'), GTL.L('적', 'Enemy'), GTL.L('아이템', 'Pickup')];
    const KCOL = [C.dim, C.good, C.accent, C.warn];
    const CAP = 256; // 청크당 엔티티 수
    const DT = 1 / 60;

    // ── A: 종류별 클래스 (필드 구성이 서로 다름) ──
    class Rock { constructor(r) { this.kind = 0; this.x = r.range(0, 1); this.y = r.range(0, 1); this.ang = 0; this.name = 'rock'; this.mesh = 3; } update(dt) { this.ang += 2 * dt; } }
    class Bullet { constructor(r) { this.kind = 1; this.x = r.range(0, 1); this.y = r.range(0, 1); const a = r.range(0, U.TAU); this.vx = Math.cos(a) * 0.3; this.vy = Math.sin(a) * 0.3; this.owner = 0; this.damage = 5; }
      update(dt) { let x = this.x + this.vx * dt, y = this.y + this.vy * dt; if (x < 0) x += 1; else if (x >= 1) x -= 1; if (y < 0) y += 1; else if (y >= 1) y -= 1; this.x = x; this.y = y; } }
    class Enemy { constructor(r) { this.kind = 2; this.x = r.range(0, 1); this.y = r.range(0, 1); this.vx = 0; this.vy = 0; this.hp = 100; this.ph = r.range(0, U.TAU); this.burning = false; this.bt = 0; this.target = null; this.state = 1; }
      update(dt) {
        const tx = 0.5 + 0.3 * Math.cos(this.ph), ty = 0.5 + 0.3 * Math.sin(this.ph);
        this.vx += (tx - this.x) * 0.5 * dt; this.vy += (ty - this.y) * 0.5 * dt; this.ph += dt;
        let x = this.x + this.vx * dt, y = this.y + this.vy * dt; if (x < 0) x += 1; else if (x >= 1) x -= 1; if (y < 0) y += 1; else if (y >= 1) y -= 1; this.x = x; this.y = y;
        if (this.burning) { this.hp -= 10 * dt; if (this.hp < 0) this.hp = 100; }
      } }
    class Pickup { constructor(r) { this.kind = 3; this.x = r.range(0, 1); this.y = r.range(0, 1); const a = r.range(0, U.TAU); this.vx = Math.cos(a) * 0.05; this.vy = Math.sin(a) * 0.05; this.ang = 0; this.value = 10; }
      update(dt) { let x = this.x + this.vx * dt, y = this.y + this.vy * dt; if (x < 0) x += 1; else if (x >= 1) x -= 1; if (y < 0) y += 1; else if (y >= 1) y -= 1; this.x = x; this.y = y; this.ang += 2 * dt; } }
    const CLS = [Rock, Bullet, Enemy, Pickup];
    const pickKind = (r) => { const v = r.range(0, 1); return v < 0.2 ? 0 : v < 0.6 ? 1 : v < 0.85 ? 2 : 3; };

    let objs, enemyIds, archs, archByMask, locA, locC, locR, n, upAvg, scAvg, hist, burning;

    // ── B: 아키타입과 청크 ──
    function newChunk(mask) {
      const c = { n: 0, ent: new Int32Array(CAP) };
      for (const k of COMPS) if (mask & k) for (const f of FIELDS[k]) c[f] = new Float32Array(CAP);
      return c;
    }
    function getArch(mask) {
      let a = archByMask.get(mask);
      if (!a) { a = { mask, id: archs.length, chunks: [] }; archs.push(a); archByMask.set(mask, a); }
      return a;
    }
    function freeChunk(a) {
      for (let i = 0; i < a.chunks.length; i++) if (a.chunks[i].n < CAP) return i;
      a.chunks.push(newChunk(a.mask));
      return a.chunks.length - 1;
    }
    function addEntity(e, mask, init) {
      const a = getArch(mask), ci = freeChunk(a), c = a.chunks[ci], row = c.n++;
      c.ent[row] = e; locA[e] = a.id; locC[e] = ci; locR[e] = row;
      for (const f in init) if (c[f]) c[f][row] = init[f];
    }
    // 구조 변경: 다른 아키타입 청크로 복사한 뒤, 원래 자리는 마지막 엔티티로 메움
    function moveEntity(e, newMask) {
      const sa = archs[locA[e]], sc = sa.chunks[locC[e]], sr = locR[e];
      const da = getArch(newMask), dci = freeChunk(da), dc = da.chunks[dci], dr = dc.n++;
      dc.ent[dr] = e;
      for (const k of COMPS) {
        if (!(newMask & k)) continue;
        for (const f of FIELDS[k]) dc[f][dr] = sa.mask & k ? sc[f][sr] : 0;
      }
      locA[e] = da.id; locC[e] = dci; locR[e] = dr;
      const last = --sc.n;
      if (sr !== last) {
        for (const k of COMPS) if (sa.mask & k) for (const f of FIELDS[k]) sc[f][sr] = sc[f][last];
        const m = sc.ent[last]; sc.ent[sr] = m; locR[m] = sr;
      }
    }

    function init() {
      ctx.rng = U.rng(ctx.seed);
      const r = ctx.rng;
      n = P.count;
      objs = null; archs = []; archByMask = new Map(); enemyIds = []; burning = new Uint8Array(n);
      locA = new Int32Array(n); locC = new Int32Array(n); locR = new Int32Array(n);
      upAvg = 0; scAvg = 0; hist = [];
      if (P.layout === 'objects') {
        objs = new Array(n);
        for (let e = 0; e < n; e++) { const k = pickKind(r); objs[e] = new CLS[k](r); if (k === 2) enemyIds.push(e); }
      } else {
        for (let e = 0; e < n; e++) {
          const k = pickKind(r), o = new CLS[k](r); // 같은 난수열로 같은 초기값
          addEntity(e, KINDS[k], o);
          if (k === 2) enemyIds.push(e);
        }
      }
    }
    init();

    // ── B 시스템: 쿼리에 맞는 아키타입의 청크만 돎 ──
    function forEachChunk(req, fn) {
      for (const a of archs) if ((a.mask & req) === req) for (const c of a.chunks) if (c.n) fn(c, c.n);
    }
    function runSystems(dt) {
      forEachChunk(POS | VEL | AI, (c, m) => {
        const x = c.x, y = c.y, vx = c.vx, vy = c.vy, ph = c.ph;
        for (let i = 0; i < m; i++) {
          const p = ph[i];
          vx[i] += (0.5 + 0.3 * Math.cos(p) - x[i]) * 0.5 * dt; vy[i] += (0.5 + 0.3 * Math.sin(p) - y[i]) * 0.5 * dt; ph[i] = p + dt;
        }
      });
      forEachChunk(POS | VEL, (c, m) => {
        const x = c.x, y = c.y, vx = c.vx, vy = c.vy;
        for (let i = 0; i < m; i++) {
          let px = x[i] + vx[i] * dt, py = y[i] + vy[i] * dt;
          if (px < 0) px += 1; else if (px >= 1) px -= 1; if (py < 0) py += 1; else if (py >= 1) py -= 1;
          x[i] = px; y[i] = py;
        }
      });
      forEachChunk(SPIN, (c, m) => { const a = c.ang; for (let i = 0; i < m; i++) a[i] += 2 * dt; });
      forEachChunk(HP | BURN, (c, m) => { const h = c.hp; for (let i = 0; i < m; i++) { let v = h[i] - 10 * dt; if (v < 0) v = 100; h[i] = v; } });
    }

    let picks = new Int32Array(0);
    function pickTargets(k) {
      const r = ctx.rng, E = enemyIds;
      if (picks.length < k) picks = new Int32Array(k);
      for (let i = 0; i < k; i++) picks[i] = E.length ? E[(r.range(0, 1) * E.length) | 0] : -1;
    }
    function structural(k) {
      for (let i = 0; i < k; i++) {
        const e = picks[i];
        if (e < 0) return;
        burning[e] ^= 1;
        if (objs) objs[e].burning = !!burning[e];          // A: 플래그만 바꿈
        else moveEntity(e, KINDS[2] | (burning[e] ? BURN : 0)); // B: 다른 아키타입으로 이동
      }
    }

    return {
      update() {
        const t0 = ctx.now();
        if (objs) { for (let i = 0; i < n; i++) objs[i].update(DT); }
        else runSystems(DT);
        pickTargets(P.changes); // 난수 뽑기는 측정에서 뺌
        const t1 = ctx.now();
        structural(P.changes);
        const t2 = ctx.now();
        upAvg = upAvg ? upAvg * 0.92 + (t1 - t0) * 0.08 : t1 - t0;
        scAvg = scAvg ? scAvg * 0.92 + (t2 - t1) * 0.08 : t2 - t1;
        hist.push(t1 - t0); if (hist.length > 150) hist.shift();
      },
      render() {
        ctx.clearStats();
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        D.plot(g, hist, 10, 8, Math.min(260, W - 20), 50, { min: 0, max: P.graphMax, color: col, label: GTL.L(`업데이트 ${upAvg.toFixed(2)} ms (최대 ${P.graphMax} ms)`, `Update ${upAvg.toFixed(2)} ms (max ${P.graphMax} ms)`) });
        let y = 70;
        if (objs) {
          // 할당 순서대로 객체 종류를 색으로 표시
          D.text(g, GTL.L('메모리 순서 (앞쪽 객체들, 색 = 종류)', 'Memory order (first objects, color = kind)'), 10, y, { size: 11, color: C.dim });
          y += 18;
          const cs = 7, perRow = Math.max(8, Math.floor((W - 20) / cs)), rows = Math.max(1, Math.min(24, Math.floor((H - y - 40) / cs)));
          const m = Math.min(n, perRow * rows);
          for (let i = 0; i < m; i++) D.rect(g, 10 + (i % perRow) * cs, y + Math.floor(i / perRow) * cs, cs - 1, cs - 1, KCOL[objs[i].kind]);
          y += rows * cs + 8;
          const kn = KNAME();
          let lx = 10;
          kn.forEach((s, k) => { D.rect(g, lx, y + 2, 9, 9, KCOL[k]); D.text(g, s, lx + 13, y, { size: 11, color: C.dim }); lx += 20 + s.length * 7; });
          D.text(g, GTL.L('객체마다 update() 가상 호출', 'One virtual update() call per object'), 10, y + 16, { size: 11, color: C.dim });
        } else {
          D.text(g, GTL.L('아키타입별 청크 (띠 = 컴포넌트 열, 높이 = 채움)', 'Chunks per archetype (band = component column, height = fill)'), 10, y, { size: 11, color: C.dim });
          y += 18;
          const cn = CNAME();
          const rowH = Math.max(18, Math.min(34, (H - y - 34) / Math.max(1, archs.length)));
          for (const a of archs) {
            let lx = 10;
            COMPS.forEach((k, ci) => { if (a.mask & k) { D.rect(g, lx, y + 3, 6, rowH - 8, CCOL[ci]); lx += 7; } });
            const comps = COMPS.map((k, ci) => (a.mask & k ? cn[ci] : null)).filter(Boolean);
            const used = a.chunks.filter((c) => c.n).length;
            D.text(g, comps.join(',') + ` (${used})`, lx + 3, y + 2, { size: 10, color: C.text });
            const cx0 = 170, cw = 9, maxC = Math.max(1, Math.floor((W - cx0 - 30) / cw));
            const bands = COMPS.map((k, ci) => (a.mask & k ? ci : -1)).filter((v) => v >= 0);
            for (let i = 0; i < Math.min(maxC, a.chunks.length); i++) {
              const c = a.chunks[i], x = cx0 + i * cw, bh = rowH - 6, fill = c.n / CAP;
              D.rect(g, x, y + 2, cw - 2, bh, 'rgba(255,255,255,0.06)');
              const bw = (cw - 2) / bands.length;
              bands.forEach((ci, j) => D.rect(g, x + j * bw, y + 2 + bh * (1 - fill), bw, bh * fill, CCOL[ci]));
            }
            if (a.chunks.length > maxC) D.text(g, '+' + (a.chunks.length - maxC), cx0 + maxC * cw + 2, y + 2, { size: 10, color: C.dim });
            y += rowH;
          }
        }
        let fillPct = '-', chunks = '-';
        if (!objs) {
          let cap = 0, used = 0, cc = 0;
          for (const a of archs) for (const c of a.chunks) { cc++; cap += CAP; used += c.n; }
          fillPct = ((used / Math.max(1, cap)) * 100).toFixed(1) + ' %'; chunks = cc;
        }
        ctx.stat(GTL.L('업데이트', 'Update'), upAvg.toFixed(2) + ' ms');
        ctx.stat(GTL.L('엔티티당', 'Per entity'), ((upAvg * 1e6) / n).toFixed(1) + ' ns');
        ctx.stat(GTL.L('구조 변경', 'Structural changes'), scAvg.toFixed(3) + ' ms (' + P.changes + GTL.L('회', ' per frame') + ')');
        if (!objs) {
          ctx.stat(GTL.L('아키타입 수', 'Archetypes'), archs.length);
          ctx.stat(GTL.L('청크 수', 'Chunks'), chunks);
          ctx.stat(GTL.L('청크 채움 비율', 'Chunk fill'), fillPct);
        }
        ctx.stat(GTL.L('엔티티 수', 'Entities'), n.toLocaleString());
      },
    };
  },
});
