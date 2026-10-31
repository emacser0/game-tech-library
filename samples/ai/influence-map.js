// 영향력 맵: 거리 스탬프 vs 전파(decay + momentum)
GTL.register({
  id: 'influence-map',
  title: '영향력 맵 (Influence Map): 스탬프 vs 전파',
  summary: '두 진영 유닛의 영향력을 격자에 퍼뜨려 장악 지역, 최전선, 긴장 지역을 읽어 냄. 거리 스탬프는 벽을 무시하고 즉시 바뀜. 감쇠와 관성이 있는 전파는 벽을 돌아 흐르고 과거 정보를 기억함.',
  views: { a: '거리 스탬프 (벽 무시)', b: '전파 (decay + momentum)' },
  controls: '클릭: 빨강 진영 유닛 추가, 우클릭: 파랑 진영 유닛 추가',
  info: `
    <p>영향력 맵(Influence Map)은 칸마다 진영별 영향력 값을 저장하는 격자. 전략 AI는 이 값으로 아래 세 가지를 읽고 공격, 방어, 후퇴 지점을 고름.</p>
    <ul>
      <li><b>장악 지역</b>: balance = 아군 − 적군</li>
      <li><b>긴장도</b>: tension = 아군 + 적군</li>
      <li><b>취약 지역</b>: vulnerability = tension − |balance|. 곧 최전선.</li>
    </ul>
    <p>계산 방식 두 가지:</p>
    <ul>
      <li><b>거리 스탬프</b>: 유닛마다 반경 안 칸에 <code>강도 × (1 − 거리/반경)</code>를 더함. 단순하고 빠름. 단, <b>벽 너머로 새어 나가고</b>, 유닛이 사라지면 즉시 0이 됨.</li>
      <li><b>전파</b>: 갱신마다 각 칸이 목표값을 향해 <code>momentum</code> 비율만큼 다가감. 목표값은 이웃 값에 <code>exp(−decay × 거리)</code>를 곱한 값 중 최댓값.
      벽 칸은 0이라서 영향력이 <b>길을 따라 돌아서</b> 퍼짐. 관성 때문에 유닛이 지나간 자리에 잔상이 남음(정찰 기억).</li>
    </ul>
    <p>⚔ 표시: 취약도(최전선)가 가장 높은 칸.</p>`,
  diagram: (L) => {
    const cols = 9, rows = 5, cs = 22, ux = 2, uy = 1, wall = (x, y) => x === 4 && y < 4;
    const free = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && !wall(x, y);
    // B: 벽을 돌아가는 경로 거리 (8방향, 모서리 가로지르기 금지)
    const dist = new Array(cols * rows).fill(Infinity); dist[uy * cols + ux] = 0;
    for (let it = 0; it < 20; it++) for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (!free(x, y)) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if ((!dx && !dy) || !free(x + dx, y + dy)) continue;
        if (dx && dy && (!free(x + dx, y) || !free(x, y + dy))) continue;
        const d = dist[(y + dy) * cols + x + dx] + (dx && dy ? Math.SQRT2 : 1);
        if (d < dist[y * cols + x]) dist[y * cols + x] = d;
      }
    }
    const stamp = (x, y) => Math.max(0, 1 - Math.hypot(x - ux, y - uy) / 4.5);
    const prop = (x, y) => Math.exp(-0.3 * dist[y * cols + x]);
    const grid = (ox, oy, val, cls) => {
      let s = '';
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const X = ox + x * cs, Y = oy + y * cs;
        s += `<rect x="${X}" y="${Y}" width="${cs}" height="${cs}" class="f-dim"/>`;
        if (wall(x, y)) { s += `<path d="M${X + 4},${Y + 4} L${X + cs - 4},${Y + cs - 4} M${X + cs - 4},${Y + 4} L${X + 4},${Y + cs - 4}" class="d-line"/>`; continue; }
        const v = val(x, y);
        if (v > 0.03) s += `<rect x="${X + 1}" y="${Y + 1}" width="${cs - 2}" height="${cs - 2}" class="${cls}" fill-opacity="${(0.1 + 0.9 * v).toFixed(2)}"/>`;
      }
      return s + `<circle cx="${ox + (ux + 0.5) * cs}" cy="${oy + (uy + 0.5) * cs}" r="6" class="d-line"/>`;
    };
    return `<svg viewBox="0 0 540 214" xmlns="http://www.w3.org/2000/svg">
    <text x="30" y="18" class="t-a">${L('A: 거리 스탬프', 'A: distance stamp')}</text>
    <text x="300" y="18" class="t-b">${L('B: 전파 (decay)', 'B: propagation (decay)')}</text>
    <text x="530" y="18" text-anchor="end" class="t-small t-dim">${L('X 칸: 벽, 원: 유닛', 'X: wall, circle: unit')}</text>
    ${grid(30, 26, stamp, 'f-a')}
    ${grid(300, 26, prop, 'f-b')}
    <text x="${300 + 4.5 * cs}" y="148" text-anchor="middle" class="t-small t-dim">${L('문', 'door')}</text>
    <text x="30" y="160" class="t-small">${L('강도 × (1 - 거리/반경)', 'strength × (1 - dist/radius)')}</text>
    <text x="30" y="173" class="t-small t-a">${L('벽 너머 칸도 바로 물듦', 'Cells behind the wall get it too')}</text>
    <text x="300" y="160" class="t-small">${L('max(이웃 값 × e^(-decay × d))', 'max(neighbor × e^(-decay × d))')}</text>
    <text x="300" y="173" class="t-small t-b">${L('벽 칸은 0, 문으로 돌아서 퍼짐', 'Walls are 0, so it flows via the door')}</text>
    <text x="10" y="194" class="t-small t-dim">${L('B 갱신: 새 값 = lerp(현재 값, 목표, momentum). 작을수록 잔상(기억)이 길게 남음', 'B update: new = lerp(current, target, momentum). Smaller momentum leaves longer trails (memory).')}</text>
    <text x="10" y="209" class="t-small t-dim">${L('최전선 = 긴장도 - |장악|. 두 진영 값이 함께 큰 칸', 'Front line = tension - |balance|: cells where both teams are strong')}</text>
  </svg>`;
  },
  look: [
    '기본 상태로 실행하면 A는 벽 바로 너머 칸까지 같은 색으로 물듦. B는 벽에서 끊기고 문과 통로로만 흘러 들어감.',
    'B의 momentum을 0.1로 낮추면 잔상이 길게 남아 유닛 이동의 "기억"이 생김. 0.9로 높이면 현재 상태를 빠르게 따라감.',
    'decay를 키우면 영향 범위가 좁아짐. 줄이면 맵 전체로 퍼짐.',
    '표시를 "취약도 (최전선)"로 바꾸면 A의 경계선은 벽을 가로지르고, B의 경계선은 통로를 따라 그려짐.',
  ],
  refs: [
    { type: 'article', title: 'The Core Mechanics of Influence Mapping', year: 2011, note: 'Alex J. Champandard, AiGameDev.com. momentum/decay 전파 알고리즘.' },
    { type: 'book', title: 'Modular Tactical Influence Maps', year: 2015, note: 'Dave Mark, Game AI Pro 2 (CRC Press) 30장.' },
    { type: 'book', title: 'Game Programming Gems 2 - Influence Mapping', year: 2001, note: 'Paul Tozour. 영향력 맵의 고전적 소개.' },
    { type: 'book', title: 'Artificial Intelligence for Games (3rd ed.)', year: 2019, note: 'Ian Millington. Tactical and Strategic AI 장, Influence Maps.' },
  ],
  params: [
    { key: 'mode', label: '계산 방식', type: 'select', group: '계산', options: [
      { value: 'stamp', label: '거리 스탬프 (벽 무시)' },
      { value: 'prop', label: '전파 (decay + momentum)' },
    ], a: 'stamp', b: 'prop' },
    { key: 'radius', label: '스탬프 반경 (칸)', type: 'range', min: 2, max: 20, step: 0.5, default: 9, when: (p) => p.mode === 'stamp' },
    { key: 'decay', label: 'decay', type: 'range', min: 0.02, max: 0.6, step: 0.01, default: 0.12, when: (p) => p.mode === 'prop' },
    { key: 'momentum', label: 'momentum', type: 'range', min: 0.05, max: 1, step: 0.01, default: 0.5, when: (p) => p.mode === 'prop', help: '1이면 즉시 목표값, 작을수록 느리게 변함(기억)' },
    { key: 'iters', label: '프레임당 전파 반복', type: 'int', min: 1, max: 8, default: 2, when: (p) => p.mode === 'prop' },
    { key: 'view', label: '표시', type: 'select', options: [
      { value: 'balance', label: '장악 (빨강 − 파랑)' },
      { value: 'tension', label: '긴장도 (합)' },
      { value: 'vuln', label: '취약도 (최전선)' },
    ], default: 'balance' },
    { key: 'units', label: '진영당 유닛 수', type: 'int', min: 1, max: 20, default: 6, shared: true, reset: true, group: '장면' },
    { key: 'unitSpeed', label: '유닛 속도 (칸/s)', type: 'range', min: 0, max: 8, step: 0.5, default: 3, shared: true },
    { key: 'cols', label: '격자 가로 칸 수', type: 'int', min: 30, max: 100, default: 64, shared: true, reset: true },
  ],
  en: {
    title: 'Influence Map: Stamping vs Propagation',
    summary: 'Spreads the influence of two teams\' units over a grid to read controlled areas, the front line, and tense areas. Distance stamping ignores walls and changes instantly. Propagation with decay and momentum flows around walls and remembers the past.',
    views: { a: 'Distance stamp (ignores walls)', b: 'Propagation (decay + momentum)' },
    controls: 'Click: add a red unit. Right click: add a blue unit.',
    info: `
    <p>An influence map is a grid that stores an influence value per team in each cell. Strategy AI reads the three values below from it and picks where to attack, defend, or retreat.</p>
    <ul>
      <li><b>Control</b>: balance = ours − theirs</li>
      <li><b>Tension</b>: tension = ours + theirs</li>
      <li><b>Vulnerability</b>: vulnerability = tension − |balance|. This is the front line.</li>
    </ul>
    <p>Two ways to compute it:</p>
    <ul>
      <li><b>Distance stamp</b>: for each unit, add <code>strength × (1 − distance/radius)</code> to cells inside the radius. It is simple and fast. But it <b>leaks through walls</b>, and it drops to 0 the moment a unit leaves.</li>
      <li><b>Propagation</b>: on each update, every cell moves toward a target value by the <code>momentum</code> ratio. The target is the largest neighbor value times <code>exp(−decay × distance)</code>.
      Wall cells are 0, so influence <b>flows around along paths</b>. Momentum leaves a trail where units passed (scouting memory).</li>
    </ul>
    <p>The ⚔ mark: the cell with the highest vulnerability (front line).</p>`,
    look: [
      'Run with defaults. In A, cells right behind a wall get the same color. In B, influence stops at walls and flows in only through doors and corridors.',
      'Lower B\'s momentum to 0.1. Long trails stay, so unit movement leaves a "memory". Raise it to 0.9 and it follows the current state quickly.',
      'Raise decay and the influence range gets smaller. Lower it and influence spreads over the whole map.',
      'Switch the display to "Vulnerability (front line)". A\'s border cuts across walls. B\'s border follows the corridors.',
    ],
    refs: [
      'Alex J. Champandard, AiGameDev.com. The momentum and decay propagation algorithm.',
      'Dave Mark, Game AI Pro 2 (CRC Press), chapter 30.',
      'Paul Tozour. A classic introduction to influence maps.',
      'Ian Millington. Tactical and Strategic AI chapter, Influence Maps.',
    ],
    params: {
      mode: { label: 'Method', group: 'Computation', options: { stamp: 'Distance stamp (ignores walls)', prop: 'Propagation (decay + momentum)' } },
      radius: 'Stamp radius (cells)',
      momentum: { label: 'momentum', help: '1 jumps to the target at once. Smaller values change slowly (memory).' },
      iters: 'Propagation passes per frame',
      view: { label: 'Display', options: { balance: 'Control (red − blue)', tension: 'Tension (sum)', vuln: 'Vulnerability (front line)' } },
      units: { label: 'Units per team', group: 'Scene' },
      unitSpeed: 'Unit speed (cells/s)',
      cols: 'Grid columns',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const cols = P.cols, rows = Math.round(cols * 0.6), N = cols * rows;
    const rng = U.rng(ctx.seed * 5 + 9);
    // ── 맵: 방 구조 (벽 + 문) ──
    const wall = new Uint8Array(N);
    const vx = [Math.round(cols * 0.33), Math.round(cols * 0.66)], hy = Math.round(rows * 0.5);
    for (const x of vx) for (let y = 0; y < rows; y++) wall[y * cols + x] = 1;
    for (let x = 0; x < cols; x++) wall[hy * cols + x] = 1;
    const door = (x, y) => { if (x >= 0 && y >= 0 && x < cols && y < rows) wall[y * cols + x] = 0; };
    for (const x of vx) for (const [y0, y1] of [[0, hy], [hy, rows]]) { const y = rng.int(y0 + 2, y1 - 3); door(x, y); door(x, y + 1); door(x, y + 2); }
    for (const [x0, x1] of [[0, vx[0]], [vx[0], vx[1]], [vx[1], cols]]) if (rng.chance(0.75)) { const x = rng.int(x0 + 2, x1 - 4); door(x, hy); door(x + 1, hy); door(x + 2, hy); }
    for (let i = 0; i < N / 160; i++) { const x = rng.int(1, cols - 3), y = rng.int(1, rows - 3); wall[y * cols + x] = wall[y * cols + x + 1] = 1; }
    const free = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && !wall[y * cols + x];
    const freeCells = []; for (let i = 0; i < N; i++) if (!wall[i]) freeCells.push(i);

    // ── 유닛: 같은 방 안에서 무작위 목적지로 배회 (A/B 동일 궤적) ──
    const units = [];
    const addUnit = (team, x, y) => units.push({ team, x, y, tx: x, ty: y, str: 1 });
    const pickIn = (fn) => { const c = freeCells.filter((i) => fn(i % cols, (i / cols) | 0)); return rng.pick(c.length ? c : freeCells); };
    for (let k = 0; k < P.units; k++) {
      let c = pickIn((x) => x < vx[0]); addUnit(0, c % cols + 0.5, ((c / cols) | 0) + 0.5);
      c = pickIn((x) => x > vx[1]); addUnit(1, c % cols + 0.5, ((c / cols) | 0) + 0.5);
    }
    const moveRng = U.rng(ctx.seed * 3 + 1);

    const inf = [new Float32Array(N), new Float32Array(N)], tmp = new Float32Array(N);
    let ms = 0, cellOps = 0;

    function stamp() {
      inf[0].fill(0); inf[1].fill(0);
      const r = P.radius, r2 = r * r;
      for (const u of units) {
        const a = inf[u.team];
        const x0 = Math.max(0, Math.floor(u.x - r)), x1 = Math.min(cols - 1, Math.ceil(u.x + r));
        const y0 = Math.max(0, Math.floor(u.y - r)), y1 = Math.min(rows - 1, Math.ceil(u.y + r));
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const i = y * cols + x;
          if (wall[i]) continue;
          const d2 = (x + 0.5 - u.x) ** 2 + (y + 0.5 - u.y) ** 2;
          cellOps++;
          if (d2 < r2) a[i] += u.str * (1 - Math.sqrt(d2) / r);
        }
      }
      for (const a of inf) for (let i = 0; i < N; i++) if (a[i] > 1) a[i] = 1;
    }
    const SQ2 = Math.SQRT2;
    function propagate() {
      const k1 = Math.exp(-P.decay), k2 = Math.exp(-P.decay * SQ2), mom = P.momentum;
      for (let t = 0; t < 2; t++) {
        const a = inf[t];
        for (const u of units) if (u.team === t) { const i = Math.floor(u.y) * cols + Math.floor(u.x); a[i] = Math.max(a[i], u.str); }
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          if (wall[i]) { tmp[i] = 0; continue; }
          let m = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx, ny = y + dy;
            if (!free(nx, ny)) continue;
            if (dx && dy && (!free(x + dx, y) || !free(x, y + dy))) continue;
            const v = a[ny * cols + nx] * (dx && dy ? k2 : k1);
            if (v > m) m = v;
          }
          tmp[i] = U.lerp(a[i], m, mom);
          cellOps++;
        }
        for (const u of units) if (u.team === t) { const i = Math.floor(u.y) * cols + Math.floor(u.x); tmp[i] = Math.max(tmp[i], u.str); }
        a.set(tmp);
      }
    }

    const L = () => { const cs = Math.min(ctx.width / cols, ctx.height / rows); return { cs, ox: (ctx.width - cs * cols) / 2, oy: (ctx.height - cs * rows) / 2 }; };
    const img = ctx.createCanvas(cols, rows), ig = img.getContext('2d'), id = ig.createImageData(cols, rows);
    let hot = -1, frontCells = 0;

    return {
      update(dt) {
        // 유닛 이동 (모드와 무관, A/B 동일)
        for (const u of units) {
          const dx = u.tx - u.x, dy = u.ty - u.y, d = Math.hypot(dx, dy);
          if (d < 0.3) {
            const c = freeCells[Math.floor(moveRng.next() * freeCells.length)];
            u.tx = c % cols + 0.5; u.ty = ((c / cols) | 0) + 0.5;
            continue;
          }
          const step = Math.min(d, P.unitSpeed * dt);
          const nx = u.x + (dx / d) * step, ny = u.y + (dy / d) * step;
          if (free(Math.floor(nx), Math.floor(ny))) { u.x = nx; u.y = ny; }
          else if (free(Math.floor(nx), Math.floor(u.y))) u.x = nx;
          else if (free(Math.floor(u.x), Math.floor(ny))) u.y = ny;
          else { const c = freeCells[Math.floor(moveRng.next() * freeCells.length)]; u.tx = c % cols + 0.5; u.ty = ((c / cols) | 0) + 0.5; }
        }
        const t0 = ctx.now(); cellOps = 0;
        if (P.mode === 'stamp') stamp();
        else for (let k = 0; k < P.iters; k++) propagate();
        ms = ctx.now() - t0;
      },
      onParam(key) { if (key === 'mode') { inf[0].fill(0); inf[1].fill(0); } },
      onPointer(type, m) {
        if (type !== 'down') return;
        const l = L(), x = (m.x - l.ox) / l.cs, y = (m.y - l.oy) / l.cs;
        if (!free(Math.floor(x), Math.floor(y))) return;
        addUnit(m.button === 2 ? 1 : 0, x, y);
      },
      render() {
        const g = ctx.g, l = L(), cs = l.cs, d = id.data, R = inf[0], B = inf[1];
        let best = -1, bv = 0.05; frontCells = 0;
        for (let i = 0; i < N; i++) {
          const k = i * 4;
          if (wall[i]) { d[k] = 70; d[k + 1] = 78; d[k + 2] = 94; d[k + 3] = 255; continue; }
          const r = R[i], b = B[i], bal = r - b, ten = r + b, vul = ten - Math.abs(bal);
          if (vul > bv) { bv = vul; best = i; }
          if (vul > 0.25) frontCells++;
          let cr = 26, cg = 29, cb = 36;
          if (P.view === 'balance') {
            const t = U.clamp(Math.abs(bal), 0, 1);
            if (bal > 0) { cr = U.lerp(cr, 255, t); cg = U.lerp(cg, 90, t); cb = U.lerp(cb, 80, t); }
            else { cr = U.lerp(cr, 70, t); cg = U.lerp(cg, 170, t); cb = U.lerp(cb, 255, t); }
          } else {
            const t = U.clamp(P.view === 'tension' ? ten / 1.5 : vul / 1, 0, 1);
            cr = U.lerp(cr, 255, t); cg = U.lerp(cg, 210, t * t); cb = U.lerp(cb, 90, t);
          }
          d[k] = cr; d[k + 1] = cg; d[k + 2] = cb; d[k + 3] = 255;
        }
        hot = best;
        ig.putImageData(id, 0, 0);
        g.imageSmoothingEnabled = false;
        g.drawImage(img, l.ox, l.oy, cols * cs, rows * cs);
        g.imageSmoothingEnabled = true;
        // 등고선 대용: 장악 경계 (부호가 바뀌는 칸 경계)
        if (P.view === 'balance') {
          g.beginPath();
          for (let y = 0; y < rows; y++) for (let x = 0; x < cols - 1; x++) {
            const i = y * cols + x;
            if (wall[i] || wall[i + 1]) continue;
            const a = R[i] - B[i], b = R[i + 1] - B[i + 1];
            if (a * b < 0 && Math.abs(a - b) > 0.05) { g.moveTo(l.ox + (x + 1) * cs, l.oy + y * cs); g.lineTo(l.ox + (x + 1) * cs, l.oy + (y + 1) * cs); }
          }
          for (let y = 0; y < rows - 1; y++) for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            if (wall[i] || wall[i + cols]) continue;
            const a = R[i] - B[i], b = R[i + cols] - B[i + cols];
            if (a * b < 0 && Math.abs(a - b) > 0.05) { g.moveTo(l.ox + x * cs, l.oy + (y + 1) * cs); g.lineTo(l.ox + (x + 1) * cs, l.oy + (y + 1) * cs); }
          }
          g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.stroke();
        }
        for (const u of units) D.circle(g, l.ox + u.x * cs, l.oy + u.y * cs, Math.max(3, cs * 0.55), u.team ? '#4fc3f7' : '#ff7a59', '#fff', 1.5);
        if (hot >= 0) D.text(g, '⚔', l.ox + (hot % cols + 0.5) * cs, l.oy + (((hot / cols) | 0) + 0.5) * cs, { align: 'center', baseline: 'middle', size: Math.max(14, cs * 1.6), color: '#fff' });
        ctx.stat(GTL.L('갱신 비용', 'Update cost'), ms.toFixed(2) + ' ms');
        ctx.stat(GTL.L('칸 연산 / 프레임', 'Cell ops / frame'), cellOps);
        ctx.stat(GTL.L('최전선 칸 수', 'Front line cells'), frontCells);
        ctx.stat(GTL.L('유닛', 'Units'), units.length);
      },
    };
  },
});
