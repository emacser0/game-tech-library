// 레이어 충돌 매트릭스 (Unity Layer Collision Matrix, Unreal 콜리전 채널과 반응)
GTL.register({
  id: 'layer-collision-matrix',
  title: '레이어 충돌 매트릭스 (Unity Layer Collision Matrix, Unreal 콜리전 채널)',
  summary: '모든 오브젝트 쌍을 검사하면 검사 수가 많고 총알이 같은 편을 맞힘. 레이어 매트릭스로 쌍을 거르면 검사 수가 줄고 원하는 충돌만 남음.',
  views: { a: '모든 쌍 검사', b: '레이어 매트릭스' },
  controls: 'B 뷰 오른쪽 위 매트릭스 칸 클릭: 무시, 겹침, 막힘 순서로 바뀜',
  info: `
    <p><b>레이어 충돌 매트릭스</b>는 오브젝트에 레이어(종류)를 붙이고, 레이어 쌍마다 충돌 여부를 표로 정하는 방식</p>
    <p>필터가 없으면 모든 쌍을 검사. 그래서 검사 수가 <code>n(n-1)/2</code>로 늘고, 적 총알이 쏜 적을 바로 맞히는 문제가 생김.</p>
    <p>동작 원리:</p>
    <ul>
      <li>레이어 쌍마다 반응을 하나 정함. Unreal 용어로 무시(Ignore), 겹침(Overlap), 막힘(Block).</li>
      <li>무시인 쌍은 검사 자체를 건너뜀. 검사 수가 줄어듦.</li>
      <li>겹침은 이벤트만 보냄(피격, 아이템 획득). 막힘은 서로 밀어냄.</li>
    </ul>
    <p>Unity는 Physics 설정의 Layer Collision Matrix, Unreal은 오브젝트 채널과 채널별 반응(Collision Response)으로 같은 일을 함</p>
    <p>단점: 레이어 수가 제한됨(Unity 32개). 표가 커지면 의도하지 않은 설정을 찾기 어려움.</p>`,
  // 도식: 삼각형 매트릭스 한 칸이 레이어 쌍 하나, 무시 칸은 검사하지 않음
  diagram: (L) => {
    const names = [L('플레이어', 'Player'), L('적', 'Enemy'), L('아군 총알', 'Player bullet'), L('적 총알', 'Enemy bullet'), L('아이템', 'Pickup')];
    const R = [[0], [2, 2], [0, 1, 0], [1, 0, 0, 0], [1, 0, 0, 0, 0]];
    const cls = ['f-dim', 'f-b', 'f-accent'];
    const txt = ['-', 'O', 'B'];
    const x0 = 150, y0 = 22, cs = 26;
    let s = '';
    names.forEach((n, i) => {
      s += `<text x="${x0 - 6}" y="${y0 + i * cs + 17}" text-anchor="end" class="t-small">${n}</text>`;
      for (let j = 0; j <= i; j++) {
        s += `<rect x="${x0 + j * cs}" y="${y0 + i * cs}" width="${cs - 2}" height="${cs - 2}" class="${cls[R[i][j]]}"/>`;
        s += `<text x="${x0 + j * cs + 12}" y="${y0 + i * cs + 16}" text-anchor="middle" class="t-mono t-small">${txt[R[i][j]]}</text>`;
      }
    });
    ['P', 'E', 'PB', 'EB', 'I'].forEach((n, j) => { s += `<text x="${x0 + j * cs + 12}" y="${y0 - 6}" text-anchor="middle" class="t-mono t-small t-dim">${n}</text>`; });
    return `<svg viewBox="0 0 540 170" xmlns="http://www.w3.org/2000/svg">
    ${s}
    <rect x="310" y="24" width="14" height="14" class="f-dim"/><text x="330" y="35">${L('무시: 검사 안 함', 'Ignore: no test')}</text>
    <rect x="310" y="46" width="14" height="14" class="f-b"/><text x="330" y="57">${L('겹침: 이벤트만', 'Overlap: event only')}</text>
    <rect x="310" y="68" width="14" height="14" class="f-accent"/><text x="330" y="79">${L('막힘: 밀어냄', 'Block: push apart')}</text>
    <text x="310" y="108" class="t-a">${L('필터 없음: 모든 쌍 검사', 'No filter: test every pair')}</text>
    <text x="310" y="124" class="t-small t-dim">${L('적 총알이 쏜 적을 맞힘', 'Enemy bullets hit their own shooter')}</text>
    <text x="310" y="146" class="t-b">${L('매트릭스: 칸 하나 = 레이어 쌍', 'Matrix: one cell = one layer pair')}</text>
    <text x="310" y="162" class="t-small t-dim">${L('무시 칸의 쌍은 아예 검사하지 않음', 'Pairs in Ignore cells are never tested')}</text>
  </svg>`;
  },
  look: [
    '기본 상태에서 "쌍 검사 수"의 비율 비교. A는 전체 쌍의 100 %를 검사. B는 총알이 더 많이 살아 있어도 10 % 안팎만 검사.',
    'A에서 "같은 편 피격" 수가 계속 늘어남. 총알이 쏜 쪽과 같은 편 총알에 바로 부딪혀 사라짐. B는 0.',
    'B 매트릭스에서 "적" 행 "적 총알" 칸(E, EB)을 겹침으로 바꾸면 B에서도 같은 편 피격이 생김. 쌍 검사 수도 늘어남.',
    '"적 수"를 늘리면 A의 검사 수는 제곱으로 늘어남. B는 필요한 레이어 쌍만큼만 늘어남.',
  ],
  refs: [
    { type: 'engine', title: 'Unity Manual - Layer-based collision detection', url: 'https://docs.unity3d.com/Manual/LayerBasedCollision.html', note: 'Physics 설정의 Layer Collision Matrix' },
    { type: 'engine', title: 'Unity Scripting API - Physics.IgnoreLayerCollision', url: 'https://docs.unity3d.com/ScriptReference/Physics.IgnoreLayerCollision.html', note: '코드에서 레이어 쌍 충돌을 끄고 켬' },
    { type: 'engine', title: 'Unreal Engine - Collision Overview (Collision Responses, Trace and Object Channels)', note: 'Ignore, Overlap, Block 세 가지 반응과 오브젝트 채널' },
    { type: 'code', title: 'Box2D - b2Filter (categoryBits, maskBits, groupIndex)', note: '비트 마스크로 같은 일을 하는 방식' },
  ],
  params: [
    { key: 'enemies', label: '적 수', type: 'int', min: 5, max: 120, default: 40, shared: true, reset: true, group: '장면' },
    { key: 'pickups', label: '아이템 수', type: 'int', min: 0, max: 40, default: 12, shared: true, reset: true },
    { key: 'fireRate', label: '발사 빈도', type: 'range', min: 0.2, max: 3, step: 0.1, default: 1, shared: true, help: '1이면 적은 1.5초, 플레이어는 0.2초마다 발사' },
    { key: 'filter', label: '충돌 필터', type: 'select', group: '필터', options: [
      { value: 'none', label: '없음 (모든 쌍, 모두 막힘)' },
      { value: 'matrix', label: '레이어 매트릭스' },
    ], a: 'none', b: 'matrix' },
    { key: 'resetMatrix', label: '매트릭스 기본값', type: 'button', when: (p) => p.filter === 'matrix' },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Layer Collision Matrix (Unity Layer Collision Matrix, Unreal Collision Channels)',
    summary: 'Testing every pair of objects costs many checks, and bullets hit their own team. A layer matrix filters the pairs, so there are fewer checks and only the wanted collisions remain.',
    views: { a: 'Test every pair', b: 'Layer matrix' },
    controls: 'Click a cell of the matrix in the top right of view B: it cycles Ignore, Overlap, Block.',
    info: `
    <p>A <b>layer collision matrix</b> gives each object a layer (its kind) and uses a table to decide, per pair of layers, whether they collide.</p>
    <p>Without a filter, every pair is tested. The check count grows as <code>n(n-1)/2</code>, and an enemy bullet hits the enemy that fired it.</p>
    <p>How it works:</p>
    <ul>
      <li>Each layer pair gets one response. In Unreal terms: Ignore, Overlap, Block.</li>
      <li>Ignore pairs are skipped entirely. The check count goes down.</li>
      <li>Overlap only sends an event (damage, pickup). Block pushes the two apart.</li>
    </ul>
    <p>Unity does this with the Layer Collision Matrix in the Physics settings. Unreal does it with object channels and per-channel collision responses.</p>
    <p>Downside: the number of layers is limited (32 in Unity). A large table makes unintended settings hard to find.</p>`,
    look: [
      'Compare the percentage in "Pair checks" in the default state. A tests 100 % of all pairs. B tests only about 10 %, even with more bullets alive.',
      'In A, "Friendly hits" keeps growing. Bullets hit the shooter or a bullet of the same team and vanish. B stays at 0.',
      'In the B matrix, set the cell at row "Enemy", column "Enemy bullet" (E, EB) to Overlap. B now gets friendly hits too, and the pair checks go up.',
      'Raise "Enemy count". A grows with the square of the count. B only grows by the layer pairs it needs.',
    ],
    refs: ['The Layer Collision Matrix in the Physics settings.', 'Turns collision between two layers off or on from code.', 'The three responses Ignore, Overlap, Block, and object channels.', 'Does the same thing with bit masks.'],
    params: {
      enemies: { label: 'Enemy count', group: 'Scene' },
      pickups: 'Pickup count',
      fireRate: { label: 'Fire rate', help: 'At 1, enemies fire every 1.5 s and the player every 0.2 s' },
      filter: { label: 'Collision filter', group: 'Filter', options: { none: 'None (every pair, all Block)', matrix: 'Layer matrix' } },
      resetMatrix: 'Matrix defaults',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 800, WH = 500;
    // 레이어: 0 플레이어, 1 적, 2 아군 총알, 3 적 총알, 4 아이템
    const NL = 5;
    const LNAME = () => [GTL.L('플레이어', 'Player'), GTL.L('적', 'Enemy'), GTL.L('아군 총알', 'Player bullet'), GTL.L('적 총알', 'Enemy bullet'), GTL.L('아이템', 'Pickup')];
    const LSHORT = ['P', 'E', 'PB', 'EB', 'I'];
    const TEAM = [0, 1, 0, 1, -1];
    const LCOL = [C.good, C.bad, '#89ddff', '#f78c6c', C.warn];
    const IGN = 0, OVL = 1, BLK = 2;
    const DEFAULT = [ // 아래 삼각형 [i][j], j <= i
      [IGN],
      [BLK, BLK],
      [IGN, OVL, IGN],
      [OVL, IGN, IGN, IGN],
      [OVL, IGN, IGN, IGN, IGN],
    ];
    let M;
    const resetMatrix = () => { M = DEFAULT.map((r) => r.slice()); };
    resetMatrix();
    const resp = (a, b) => (a >= b ? M[a][b] : M[b][a]);

    let nAtCheck = 0, objs, checks, friendly, valid, collected, flashes, playerT;
    const mk = (layer, x, y, vx, vy, r, owner) => ({ layer, x, y, vx, vy, r, owner, dead: false, t: ctx.random() * 1.5, flash: 0 });
    function init() {
      ctx.rng = U.rng(ctx.seed);
      const r = ctx.rng;
      objs = [mk(0, WW / 2, WH / 2, 0, 0, 12, -1)];
      for (let i = 0; i < P.enemies; i++) {
        const a = r.range(0, U.TAU), s = r.range(20, 50);
        objs.push(mk(1, r.range(30, WW - 30), r.range(30, WH - 30), Math.cos(a) * s, Math.sin(a) * s, 10, -1));
      }
      for (let i = 0; i < P.pickups; i++) objs.push(mk(4, r.range(30, WW - 30), r.range(30, WH - 30), 0, 0, 7, -1));
      checks = 0; friendly = 0; valid = 0; collected = 0; flashes = []; playerT = 0;
    }
    init();

    function fire(src, tx, ty, layer, speed) {
      const dx = tx - src.x, dy = ty - src.y, d = Math.hypot(dx, dy) || 1;
      // 쏜 오브젝트의 중심에서 생성: 필터가 없으면 바로 자기 자신과 겹침
      objs.push(mk(layer, src.x, src.y, (dx / d) * speed, (dy / d) * speed, 4, src));
    }

    function hit(a, b, rsp, dx, dy, d) {
      // a.layer <= b.layer 보장
      const bul = (o) => o.layer === 2 || o.layer === 3;
      if (rsp === BLK && !bul(a) && !bul(b) && a.layer !== 4 && b.layer !== 4) {
        const pen = a.r + b.r - d, nx = dx / (d || 1), ny = dy / (d || 1);
        const wa = a.layer === 0 ? 0.2 : 0.5, wb = 1 - wa;
        a.x -= nx * pen * wa; a.y -= ny * pen * wa; b.x += nx * pen * wb; b.y += ny * pen * wb;
        return;
      }
      for (const [o, other] of [[a, b], [b, a]]) {
        if (bul(o) && !o.dead) {
          o.dead = true;
          other.flash = 0.25;
          const sameTeam = TEAM[other.layer] === TEAM[o.layer];
          if (sameTeam) { friendly++; flashes.push({ x: o.x, y: o.y, t: 0.5, bad: true }); }
          else if (other.layer === 0 || other.layer === 1) { valid++; flashes.push({ x: o.x, y: o.y, t: 0.4, bad: false }); }
          return;
        }
      }
      for (const [o, other] of [[a, b], [b, a]]) {
        if (o.layer === 4 && !o.dead) {
          o.dead = true; collected++;
          if (other.layer !== 0) friendly++; // 적이 아이템을 먹음: 원하지 않는 충돌
          return;
        }
      }
    }

    function testPair(a, b) {
      checks++;
      if (a.dead || b.dead) return;
      const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r;
      const d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr) return;
      const lo = a.layer <= b.layer ? a : b, hi = lo === a ? b : a;
      const rsp = P.filter === 'matrix' ? resp(hi.layer, lo.layer) : BLK;
      if (rsp === IGN) return;
      hit(lo, hi, rsp, hi.x - lo.x, hi.y - lo.y, Math.sqrt(d2));
    }

    function collide() {
      checks = 0; nAtCheck = objs.length;
      if (P.filter !== 'matrix') {
        for (let i = 0; i < objs.length; i++) for (let j = i + 1; j < objs.length; j++) testPair(objs[i], objs[j]);
        return;
      }
      const by = Array.from({ length: NL }, () => []);
      for (const o of objs) by[o.layer].push(o);
      for (let i = 0; i < NL; i++) for (let j = 0; j <= i; j++) {
        if (M[i][j] === IGN) continue; // 무시 쌍은 검사 자체를 건너뜀
        const A = by[i], B = by[j];
        if (i === j) { for (let p = 0; p < A.length; p++) for (let q = p + 1; q < A.length; q++) testPair(A[p], A[q]); }
        else for (const a of A) for (const b of B) testPair(a, b);
      }
    }

    // 화면 좌표의 매트릭스 배치
    const MCS = 18;
    const matLayout = () => {
      const W = ctx.width;
      return { x0: W - 10 - NL * MCS, y0: 30 };
    };

    return {
      update(dt) {
        const pl = objs[0];
        playerT += dt;
        pl.x = WW / 2 + Math.cos(playerT * 0.5) * 220; pl.y = WH / 2 + Math.sin(playerT * 0.8) * 140;
        const rate = P.fireRate;
        for (const o of objs) {
          if (o.dead) continue;
          o.flash = Math.max(0, o.flash - dt);
          if (o.layer === 1) {
            o.x += o.vx * dt; o.y += o.vy * dt;
            if (o.x < 10 || o.x > WW - 10) { o.vx = -o.vx; o.x = U.clamp(o.x, 10, WW - 10); }
            if (o.y < 10 || o.y > WH - 10) { o.vy = -o.vy; o.y = U.clamp(o.y, 10, WH - 10); }
            o.t -= dt * rate;
            if (o.t <= 0) { o.t = 1.5; fire(o, pl.x, pl.y, 3, 160); }
          } else if (o.layer === 2 || o.layer === 3) {
            o.x += o.vx * dt; o.y += o.vy * dt;
            if (o.x < -10 || o.x > WW + 10 || o.y < -10 || o.y > WH + 10) o.dead = true;
          }
        }
        pl.t -= dt * rate;
        if (pl.t <= 0) {
          pl.t = 0.2;
          let best = null, bd = Infinity;
          for (const o of objs) if (o.layer === 1) { const d = (o.x - pl.x) ** 2 + (o.y - pl.y) ** 2; if (d < bd) { bd = d; best = o; } }
          if (best) fire(pl, best.x, best.y, 2, 320);
        }
        collide();
        // 사라진 아이템은 다른 자리에 다시 생성
        for (const o of objs) if (o.layer === 4 && o.dead) { o.dead = false; o.x = ctx.random() * (WW - 60) + 30; o.y = ctx.random() * (WH - 60) + 30; }
        objs = objs.filter((o) => !o.dead);
        for (const f of flashes) f.t -= dt;
        flashes = flashes.filter((f) => f.t > 0);
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const s = Math.min(W / WW, H / WH), ox = (W - WW * s) / 2, oy = (H - WH * s) / 2;
        D.rect(g, ox, oy, WW * s, WH * s, null, C.grid, 1);
        for (const o of objs) {
          const x = ox + o.x * s, y = oy + o.y * s, r = Math.max(2, o.r * s);
          const col = LCOL[o.layer];
          if (o.layer === 4) D.rect(g, x - r, y - r, r * 2, r * 2, col);
          else D.circle(g, x, y, r, o.flash > 0 ? '#fff' : col);
        }
        for (const f of flashes) D.circle(g, ox + f.x * s, oy + f.y * s, (1 - f.t) * 16 + 4, null, f.bad ? C.bad : C.good, 2);

        // 범례
        const names = LNAME();
        names.forEach((n, i) => { D.circle(g, 14, 16 + i * 15, 4, LCOL[i]); D.text(g, LSHORT[i] + ' ' + n, 24, 10 + i * 15, { size: 11, color: C.dim }); });

        // 매트릭스 (삼각형)
        const { x0, y0 } = matLayout();
        const on = P.filter === 'matrix';
        D.rect(g, x0 - 30, y0 - 22, NL * MCS + 36, NL * MCS + 28, 'rgba(0,0,0,0.6)');
        for (let j = 0; j < NL; j++) D.text(g, LSHORT[j], x0 + j * MCS + MCS / 2, y0 - 16, { size: 10, color: C.dim, align: 'center' });
        for (let i = 0; i < NL; i++) {
          D.text(g, LSHORT[i], x0 - 6, y0 + i * MCS + 4, { size: 10, color: C.dim, align: 'right' });
          for (let j = 0; j <= i; j++) {
            const v = on ? M[i][j] : BLK;
            const fill = v === IGN ? 'rgba(255,255,255,0.06)' : v === OVL ? C.b : C.accent;
            g.globalAlpha = on ? 1 : 0.45;
            D.rect(g, x0 + j * MCS, y0 + i * MCS, MCS - 2, MCS - 2, fill);
            D.text(g, v === IGN ? '-' : v === OVL ? 'O' : 'B', x0 + j * MCS + (MCS - 2) / 2, y0 + i * MCS + 3, { size: 10, color: v === IGN ? C.dim : '#111', align: 'center' });
            g.globalAlpha = 1;
          }
        }
        D.text(g, on ? GTL.L('- 무시  O 겹침  B 막힘', '- Ignore  O Overlap  B Block') : GTL.L('필터 없음: 전부 막힘', 'No filter: all Block'), W - 10, y0 + NL * MCS + 8, { size: 10, color: C.dim, align: 'right' });

        const n = nAtCheck, all = (n * (n - 1)) / 2;
        ctx.stat(GTL.L('오브젝트 수', 'Objects'), n);
        ctx.stat(GTL.L('전체 쌍 수 n(n-1)/2', 'All pairs n(n-1)/2'), all.toLocaleString());
        ctx.stat(GTL.L('쌍 검사 수', 'Pair checks'), checks.toLocaleString() + ' (' + ((checks / Math.max(1, all)) * 100).toFixed(0) + ' %)');
        ctx.stat(GTL.L('같은 편 피격 (원하지 않음)', 'Friendly hits (unwanted)'), friendly);
        ctx.stat(GTL.L('상대 편 피격', 'Enemy hits'), valid);
      },
      onPointer(type, m) {
        if (type !== 'down' || P.filter !== 'matrix') return;
        const { x0, y0 } = matLayout();
        const j = Math.floor((m.x - x0) / MCS), i = Math.floor((m.y - y0) / MCS);
        if (i >= 0 && i < NL && j >= 0 && j <= i) M[i][j] = (M[i][j] + 1) % 3;
      },
      onAction(key) {
        if (key === 'restart') init();
        if (key === 'resetMatrix') resetMatrix();
      },
    };
  },
});
