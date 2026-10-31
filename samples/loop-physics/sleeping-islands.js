// 슬립(Sleeping) & 시뮬레이션 아일랜드: 정지한 물체 그룹을 재워 비용 절감
GTL.register({
  id: 'sleeping-islands',
  title: '슬립 & 시뮬레이션 아일랜드',
  summary: '쌓여서 멈춘 물체도 매 스텝 적분과 충돌 검사를 하면 비용이 그대로임. 접촉으로 연결된 그룹(아일랜드)이 모두 충분히 느려지면 통째로 재우고, 깨어 있는 물체가 닿을 때만 깨움.',
  views: { a: '슬립 끔', b: '슬립 + 아일랜드' },
  controls: '마우스 클릭: 클릭 지점에 폭발 (주변 아일랜드 깨우기)',
  info: `
    <p><b>슬립</b>(Sleeping)은 멈춘 물체를 계산에서 잠시 빼는 최적화. <b>아일랜드</b>는 접촉이나 조인트로 연결된 바디 묶음(union-find, DFS로 구성).</p>
    <p>아일랜드 안의 모든 바디가 <b>임계 속도 이하로 일정 시간</b>(Box2D 기본 0.5초) 머물면 아일랜드 전체가 <b>잠듦</b>. 잠든 바디는 다음 계산에서 빠짐.</p>
    <ul>
      <li>적분</li>
      <li>솔버</li>
      <li>바디 쌍 충돌 검사</li>
    </ul>
    <p>바디 하나씩 재우지 않는 이유: 더미의 맨 아래만 잠들면 위 물체를 받쳐 줄 반응이 사라지기 때문.</p>
    <p>깨어 있는 바디가 잠든 바디에 닿으면 그 <b>아일랜드 전체가 깨어남</b>. 칸막이로 나뉜 통은 서로 다른 아일랜드라서 공이 떨어진 통만 깨어남.</p>
    <p>단점: 지터(떨림)가 큰 솔버는 속도가 임계값 아래로 내려가지 않아 영영 잠들지 못함. 그래서 슬립 효과는 솔버 품질에 달려 있음.</p>
    <p>색: 깨어 있음 = 뷰 강조색, 잠듦 = 어두운 색(아일랜드별 테두리 색).</p>`,
  // 도식: 칸막이로 나뉜 두 아일랜드(하나는 잠듦, 하나는 공이 닿아 깨어남)와 슬립 타이머
  diagram: (L) => {
    const pile = (x0, cls) => [[0, 0], [1, 0], [2, 0], [3, 0], [0.5, 1], [1.5, 1], [2.5, 1], [1, 2], [2, 2]]
      .map(([c, r]) => `<circle cx="${x0 + 14 + c * 24}" cy="${136 - r * 21}" r="11" class="${cls}"/>`).join('');
    return `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr-si" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <path d="M18,40 L18,148 L272,148 L272,40" class="d-line"/><line x1="145" y1="60" x2="145" y2="148" class="d-line"/>
    ${pile(26, 'f-dim')}${pile(152, 'f-b')}
    <rect x="22" y="80" width="118" height="64" rx="8" class="d-dim" stroke-dasharray="4 3"/>
    <rect x="149" y="80" width="118" height="64" rx="8" class="d-b" stroke-dasharray="4 3"/>
    <circle cx="210" cy="30" r="9" class="f-b"/><path d="M210,42 L210,70" class="d-b" marker-end="url(#arr-si)"/>
    <text x="80" y="166" text-anchor="middle" class="t-small">${L('아일랜드 1: 잠듦', 'Island 1: asleep')}</text>
    <text x="80" y="179" text-anchor="middle" class="t-small t-dim">${L('적분, 솔버, 검사 생략', 'skips integrate, solve, test')}</text>
    <text x="208" y="166" text-anchor="middle" class="t-small t-b">${L('아일랜드 2: 깨어남', 'Island 2: awake')}</text>
    <text x="208" y="179" text-anchor="middle" class="t-small t-dim">${L('하나가 닿으면 전체가 깨어남', 'one hit wakes all of it')}</text>
    <line x1="310" y1="140" x2="530" y2="140" class="d-line"/><line x1="310" y1="140" x2="310" y2="30" class="d-line"/>
    <text x="314" y="26" class="t-small">${L('아일랜드에서 가장 빠른 속도', 'Fastest speed in the island')}</text>
    <line x1="310" y1="118" x2="530" y2="118" class="d-dim" stroke-dasharray="4 3"/>
    <text x="528" y="113" text-anchor="end" class="t-small t-dim">${L('임계 속도', 'threshold')}</text>
    <path d="M310,40 C350,60 370,100 400,118 S440,132 530,134" class="d-b"/>
    <rect x="400" y="142" width="80" height="8" class="f-accent"/>
    <text x="440" y="164" text-anchor="middle" class="t-small">${L('0.5초 유지', 'stays 0.5 s')}</text>
    <line x1="480" y1="34" x2="480" y2="152" class="d-accent" stroke-dasharray="3 3"/>
    <text x="484" y="46" class="t-small">${L('잠듦', 'sleep')}</text>
  </svg>`;
  },
  look: [
    'B에서 공이 쌓이고 1~2초 지나면 통 단위로 어두워짐(잠듦). "깨어 있는 바디"와 "충돌 검사 쌍"이 A보다 크게 줄어듦.',
    '3초마다 공이 한 통에 떨어지면 B에서는 그 통의 아일랜드만 깨어났다가 다시 잠듦.',
    '클릭으로 폭발을 일으키면 주변 아일랜드가 깨어나 튐. 잠든 상태에서도 정확히 반응함.',
    '"아일랜드 단위로 재우기"를 끄면 바디가 하나씩 잠들었다가 깨어 있는 이웃 때문에 바로 다시 깨어남. 더미 전체가 거의 잠들지 못함.',
    '솔버 반복 횟수를 1~2로 낮추면 더미가 잘게 떨려(지터) 잠들기까지 오래 걸림. 슬립 임계 속도를 크게 올리면 움직이던 공이 너무 일찍 멈춤.',
  ],
  refs: [
    { type: 'article', title: 'Simulation Islands (Erin Catto)', url: 'https://box2d.org/posts/2023/10/simulation-islands/', year: 2023, note: 'Box2D v3의 영속적 아일랜드 관리와 슬립.' },
    { type: 'engine', title: 'Box2D - b2_timeToSleep / linearSleepTolerance', url: 'https://box2d.org/documentation/', note: '바디가 잠들기까지 0.5초, 속도 허용치.' },
    { type: 'engine', title: 'Unity - Rigidbody.sleepThreshold / Rigidbody.Sleep', url: 'https://docs.unity3d.com/ScriptReference/Rigidbody-sleepThreshold.html', note: 'PhysX는 질량으로 나눈 운동 에너지가 기준.' },
    { type: 'engine', title: 'Godot - RigidBody2D.can_sleep / sleeping', url: 'https://docs.godotengine.org/en/stable/classes/class_rigidbody2d.html' },
  ],
  params: [
    { key: 'sleep', label: '슬립 사용', type: 'bool', a: false, b: true, default: false, group: '슬립' },
    { key: 'sleepVel', label: '슬립 임계 속도 (px/s)', type: 'range', min: 1, max: 60, step: 1, default: 12, when: (p) => p.sleep },
    { key: 'sleepTime', label: '잠들기까지 시간 (s)', type: 'range', min: 0.1, max: 2, step: 0.05, default: 0.5, when: (p) => p.sleep },
    { key: 'islands', label: '아일랜드 단위로 재우기', type: 'bool', default: true, when: (p) => p.sleep, help: '끄면 바디마다 따로 잠듦. 깨어 있는 이웃이 계속 깨워서 더미가 거의 잠들지 못함' },
    { key: 'iterations', label: '솔버 반복 횟수', type: 'int', min: 1, max: 16, default: 8 },
    { key: 'count', label: '공 개수', type: 'int', min: 20, max: 400, default: 220, shared: true, reset: true, group: '장면' },
    { key: 'drops', label: '주기적 낙하', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Sleeping & Simulation Islands',
    summary: 'Objects that are stacked and still cost the same if you integrate and test them for collisions every step. When every body in a contact group (island) is slow enough, put the whole group to sleep. Wake it only when an awake body touches it.',
    views: { a: 'Sleep off', b: 'Sleep + islands' },
    controls: 'Mouse click: explosion at the click point (wakes nearby islands)',
    info: `
    <p><b>Sleeping</b> is an optimization that takes still objects out of the calculation for a while. An <b>island</b> is a group of bodies linked by contacts or joints (built with union-find or DFS).</p>
    <p>When every body in an island stays <b>below a threshold speed for some time</b> (0.5 s by default in Box2D), the whole island <b>falls asleep</b>. Sleeping bodies skip these steps:</p>
    <ul>
      <li>Integration</li>
      <li>Solver</li>
      <li>Body pair collision tests</li>
    </ul>
    <p>Why not put bodies to sleep one at a time? If only the bottom of a pile sleeps, the bodies above lose the reaction force that holds them up.</p>
    <p>When an awake body touches a sleeping body, <b>the whole island wakes up</b>. Bins split by walls are separate islands, so only the bin where a ball lands wakes up.</p>
    <p>Downside: a solver with strong jitter (shaking) never gets speeds below the threshold, so bodies never sleep. So the gain from sleeping depends on solver quality.</p>
    <p>Colors: awake = view highlight color, asleep = dark color (outline color per island).</p>`,
    look: [
      'In B, 1~2 seconds after the balls settle, each bin turns dark (asleep). "Awake bodies" and "Collision test pairs" drop far below A.',
      'Every 3 seconds a ball drops into one bin. In B, only that bin\'s island wakes up, then sleeps again.',
      'Click to cause an explosion. Nearby islands wake up and fly apart. They react correctly even from sleep.',
      'Turn off "Sleep by island". Bodies fall asleep one by one, then awake neighbors wake them right away. The pile almost never sleeps.',
      'Lower solver iterations to 1~2. The pile jitters, so it takes a long time to sleep. Raise the sleep threshold speed a lot and moving balls stop too early.',
    ],
    refs: ['Persistent island management and sleeping in Box2D v3.', '0.5 s before a body sleeps, and the speed tolerance.', 'PhysX uses kinetic energy divided by mass as the threshold.', null],
    params: {
      sleep: { label: 'Use sleeping', group: 'Sleep' },
      sleepVel: 'Sleep threshold speed (px/s)',
      sleepTime: 'Time to sleep (s)',
      islands: { label: 'Sleep by island', help: 'When off, each body sleeps on its own. Awake neighbors keep waking them, so the pile almost never sleeps' },
      iterations: 'Solver iterations',
      count: { label: 'Ball count', group: 'Scene' },
      drops: 'Periodic drops',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const LW = 600, LH = 420, GRAV = 900, HZ = 60, FLOOR = 405;
    const WALLS = [ // 정적 AABB [x0, y0, x1, y1]
      [0, FLOOR, LW, LH + 40], [-40, 0, 12, LH], [LW - 12, 0, LW + 40, LH],
      [146, 230, 154, FLOOR], [296, 230, 304, FLOOR], [446, 230, 454, FLOOR],
    ];
    const BIN_X = [80, 225, 375, 525];
    ctx.rng = U.rng(ctx.seed);
    const bodies = [];
    const add = (x, y, r) => bodies.push({ x, y, px: x, py: y, vx: 0, vy: 0, r, inv: 1 / (r * r), asleep: false, st: 0, island: -1, wake: 0 });
    for (let i = 0; i < P.count; i++) {
      const bin = i % 4, k = Math.floor(i / 4), col = k % 5, row = Math.floor(k / 5);
      add(BIN_X[bin] + (col - 2) * 22 + ctx.rng.range(-2, 2), 200 - row * 21 + ctx.rng.range(-1, 1), ctx.rng.range(6, 9.5));
    }
    const RMAX = 9.5, CELL = RMAX * 2;
    let acc = 0, checks = 0, physMs = 0, dropT = 0, drops = 0, sleepingIslands = 0, nextIsland = 0;
    const islandMembers = new Map();
    let warm = new Map();
    const blasts = [];

    function wakeIsland(id) {
      const m = islandMembers.get(id);
      if (!m) return;
      for (const b of m) { b.asleep = false; b.st = 0; b.island = -1; b.wake = 1; }
      islandMembers.delete(id);
    }
    function wakeBody(b) { if (!b.asleep) return; if (b.island >= 0 && islandMembers.has(b.island)) wakeIsland(b.island); else { b.asleep = false; b.st = 0; b.wake = 1; } }

    // 원 vs 정적 AABB 최근접 접촉: 법선(벽→공)과 관통 깊이
    function wallContact(b, w) {
      const qx = U.clamp(b.x, w[0], w[2]), qy = U.clamp(b.y, w[1], w[3]);
      const dx = b.x - qx, dy = b.y - qy, d2 = dx * dx + dy * dy;
      if (d2 >= (b.r + 0.5) * (b.r + 0.5)) return null;
      if (d2 > 1e-9) { const d = Math.sqrt(d2); return { nx: dx / d, ny: dy / d, pen: b.r - d }; }
      const l = b.x - w[0], r = w[2] - b.x, t = b.y - w[1], bt = w[3] - b.y, m = Math.min(l, r, t, bt);
      if (m === t) return { nx: 0, ny: -1, pen: t + b.r };
      if (m === l) return { nx: -1, ny: 0, pen: l + b.r };
      if (m === r) return { nx: 1, ny: 0, pen: r + b.r };
      return { nx: 0, ny: 1, pen: bt + b.r };
    }

    function step(h) {
      const sleepOn = P.sleep, MU = 0.4;
      for (const b of bodies) {
        if (b.asleep) continue;
        b.vy += GRAV * h;
        const damp = Math.exp(-0.3 * h);
        b.vx *= damp; b.vy *= damp;
      }
      // 브로드페이즈: 균일 격자
      const grid = new Map();
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        const k = Math.floor(b.x / CELL) * 1000 + Math.floor(b.y / CELL);
        let c = grid.get(k); if (!c) grid.set(k, (c = [])); c.push(i);
      }
      const pairs = [];
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        const cx = Math.floor(a.x / CELL), cy = Math.floor(a.y / CELL);
        for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
          const c = grid.get((cx + ox) * 1000 + cy + oy);
          if (!c) continue;
          for (const j of c) {
            if (j <= i) continue;
            const b = bodies[j];
            if (a.asleep && b.asleep) continue;   // 잠든 쌍은 검사 생략
            checks++;
            const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r + 0.5;
            const d2 = dx * dx + dy * dy;
            if (d2 < rr * rr) { const d = Math.sqrt(d2) || 1e-6; pairs.push({ a, b, i, j, key: i * 8192 + j, nx: dx / d, ny: dy / d, pen: a.r + b.r - d, ln: 0, lt: 0 }); }
          }
        }
      }
      // 잠든 바디가 깨어 있는 바디와 닿으면 아일랜드 깨우기
      if (sleepOn) for (const c of pairs) if (c.a.asleep !== c.b.asleep) { wakeBody(c.a); wakeBody(c.b); }
      const wallC = [];
      bodies.forEach((b, i) => {
        if (b.asleep) return;
        WALLS.forEach((w, k) => { const c = wallContact(b, w); if (c) { c.b = b; c.key = -(i * 8 + k + 1); c.ln = 0; c.lt = 0; wallC.push(c); } });
      });
      // Warm starting: 지난 스텝 누적 충격량으로 시작 (깊은 더미가 가라앉지 않게)
      for (const c of pairs) {
        const o = warm.get(c.key);
        if (!o) continue;
        const a = c.a, b = c.b, wa = a.asleep ? 0 : a.inv, wb = b.asleep ? 0 : b.inv;
        c.ln = o[0]; c.lt = o[1];
        const px = c.nx * c.ln - c.ny * c.lt, py = c.ny * c.ln + c.nx * c.lt;
        a.vx -= px * wa; a.vy -= py * wa; b.vx += px * wb; b.vy += py * wb;
      }
      for (const c of wallC) {
        const o = warm.get(c.key);
        if (!o) continue;
        c.ln = o[0]; c.lt = o[1];
        c.b.vx += c.nx * c.ln - c.ny * c.lt; c.b.vy += c.ny * c.ln + c.nx * c.lt;
      }
      // 속도 솔버: Sequential impulses (반발 0, 마찰)
      for (let it = 0; it < P.iterations; it++) {
        for (const c of pairs) {
          const a = c.a, b = c.b;
          const wa = a.asleep ? 0 : a.inv, wb = b.asleep ? 0 : b.inv, w = wa + wb;
          if (!w) continue;
          const vn = (b.vx - a.vx) * c.nx + (b.vy - a.vy) * c.ny;
          const l0 = c.ln; c.ln = Math.max(0, l0 - vn / w); const dl = c.ln - l0;
          a.vx -= c.nx * dl * wa; a.vy -= c.ny * dl * wa; b.vx += c.nx * dl * wb; b.vy += c.ny * dl * wb;
          const tx = -c.ny, ty = c.nx, vt = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty;
          const t0 = c.lt; c.lt = U.clamp(t0 - vt / w, -MU * c.ln, MU * c.ln); const dt_ = c.lt - t0;
          a.vx -= tx * dt_ * wa; a.vy -= ty * dt_ * wa; b.vx += tx * dt_ * wb; b.vy += ty * dt_ * wb;
        }
        for (const c of wallC) {
          const b = c.b;
          const vn = b.vx * c.nx + b.vy * c.ny;
          const l0 = c.ln; c.ln = Math.max(0, l0 - vn); const dl = c.ln - l0;
          b.vx += c.nx * dl; b.vy += c.ny * dl;
          const tx = -c.ny, ty = c.nx, vt = b.vx * tx + b.vy * ty;
          const t0 = c.lt; c.lt = U.clamp(t0 - vt, -MU * c.ln, MU * c.ln); const dt_ = c.lt - t0;
          b.vx += tx * dt_; b.vy += ty * dt_;
        }
      }
      warm = new Map();
      for (const c of pairs) warm.set(c.key, [c.ln, c.lt]);
      for (const c of wallC) warm.set(c.key, [c.ln, c.lt]);
      for (const b of bodies) if (!b.asleep) { b.x += b.vx * h; b.y += b.vy * h; }
      // 위치 보정: 속도에 영향 없이 관통만 해소 (slop 0.5px)
      for (let it = 0; it < 2; it++) {
        for (const c of pairs) {
          const a = c.a, b = c.b;
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6, pen = a.r + b.r - d - 0.5;
          if (pen <= 0) continue;
          const wa = a.asleep ? 0 : a.inv, wb = b.asleep ? 0 : b.inv, w = wa + wb;
          if (!w) continue;
          const s = (pen * 0.5) / w, nx = dx / d, ny = dy / d;
          a.x -= nx * s * wa; a.y -= ny * s * wa; b.x += nx * s * wb; b.y += ny * s * wb;
        }
        for (const b of bodies) {
          if (b.asleep) continue;
          for (const w of WALLS) { const c = wallContact(b, w); if (c && c.pen > 0.5) { b.x += c.nx * (c.pen - 0.5); b.y += c.ny * (c.pen - 0.5); } }
        }
      }
      // 슬립 판정
      if (!sleepOn) return;
      const tol = P.sleepVel;
      for (const b of bodies) {
        if (b.asleep) continue;
        if (b.vx * b.vx + b.vy * b.vy < tol * tol) b.st += h; else b.st = 0;
      }
      if (!P.islands) {
        for (const b of bodies) if (!b.asleep && b.st >= P.sleepTime) { b.asleep = true; b.vx = b.vy = 0; b.island = -1; }
        return;
      }
      // union-find 로 아일랜드 구성 (깨어 있는 바디끼리의 접촉)
      const parent = bodies.map((_, i) => i);
      const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
      for (const c of pairs) { if (c.a.asleep || c.b.asleep) continue; const a = find(c.i), b = find(c.j); if (a !== b) parent[a] = b; }
      const minSt = new Map();
      bodies.forEach((b, i) => { if (b.asleep) return; const r = find(i); minSt.set(r, Math.min(minSt.has(r) ? minSt.get(r) : Infinity, b.st)); });
      const newIsl = new Map();
      bodies.forEach((b, i) => {
        if (b.asleep) return;
        const r = find(i);
        if (minSt.get(r) < P.sleepTime) return;
        if (!newIsl.has(r)) newIsl.set(r, nextIsland++);
        const id = newIsl.get(r);
        b.asleep = true; b.vx = b.vy = 0; b.island = id;
        if (!islandMembers.has(id)) islandMembers.set(id, []);
        islandMembers.get(id).push(b);
      });
    }

    const toLocal = (m) => {
      const s = Math.min(ctx.width / LW, ctx.height / LH), ox = (ctx.width - LW * s) / 2, oy = (ctx.height - LH * s) / 2;
      return { x: (m.x - ox) / s, y: (m.y - oy) / s };
    };

    return {
      update(dt) {
        const H = 1 / HZ;
        acc += dt;
        dropT += dt;
        if (P.drops && dropT > 3 && drops < 60) {
          dropT = 0;
          add(BIN_X[drops % 4] + ((drops * 37) % 60) - 30, 20, 9);
          drops++;
        }
        let n = 0;
        checks = 0;
        const t0 = ctx.now();
        while (acc >= H && n < 3) { step(H); acc -= H; n++; }
        if (n >= 3) acc = 0;
        if (n) { physMs = physMs * 0.9 + ((ctx.now() - t0) / n) * 0.1; checks = Math.round(checks / n); }
        for (const b of bodies) b.wake = Math.max(0, b.wake - dt * 2);
        for (const bl of blasts) bl.life -= dt * 2;
        while (blasts.length && blasts[0].life <= 0) blasts.shift();
      },
      onPointer(type, m) {
        if (type !== 'down') return;
        const l = toLocal(m);
        blasts.push({ x: l.x, y: l.y, life: 1 });
        for (const b of bodies) {
          const dx = b.x - l.x, dy = b.y - l.y, d = Math.hypot(dx, dy);
          if (d > 90) continue;
          wakeBody(b);
          const f = (1 - d / 90) * 700 / Math.max(d, 8) ;
          b.vx += dx * f; b.vy += dy * f - 150;
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const s = Math.min(W / LW, H / LH);
        const col = ctx.side === 'a' ? C.a : C.b;
        g.save(); g.translate((W - LW * s) / 2, (H - LH * s) / 2); g.scale(s, s);
        for (const w of WALLS) D.rect(g, w[0], w[1], w[2] - w[0], w[3] - w[1], '#3a404b');
        // 깨어 있는 공은 한 번에, 잠든 공은 아일랜드 색 테두리
        g.fillStyle = col;
        g.beginPath();
        let awake = 0;
        for (const b of bodies) { if (b.asleep) continue; awake++; g.moveTo(b.x + b.r, b.y); g.arc(b.x, b.y, b.r, 0, U.TAU); }
        g.fill();
        for (const b of bodies) {
          if (!b.asleep) { if (b.wake > 0) D.circle(g, b.x, b.y, b.r + 2, null, `rgba(255,203,107,${b.wake})`, 2); continue; }
          const hue = b.island >= 0 ? (b.island * 67) % 360 : 220;
          D.circle(g, b.x, b.y, b.r - 0.5, '#2b3240', U.hsl(hue, 45, 55), 1.2);
        }
        for (const bl of blasts) D.circle(g, bl.x, bl.y, 90 * (1 - bl.life * 0.6), null, `rgba(255,83,112,${bl.life})`, 3);
        g.restore();
        let isl = 0; for (const [, m] of islandMembers) if (m.length) isl++;
        ctx.stat(GTL.L('깨어 있는 바디', 'Awake bodies'), `${awake} / ${bodies.length}`);
        ctx.stat(GTL.L('충돌 검사 쌍 / 스텝', 'Collision test pairs / step'), checks);
        ctx.stat(GTL.L('물리 시간', 'Physics time'), physMs.toFixed(3) + ' ms');
        ctx.stat(GTL.L('잠든 아일랜드', 'Sleeping islands'), P.sleep ? (P.islands ? isl : GTL.L('개별 슬립', 'Per-body sleep')) : '-');
      },
    };
  },
});
