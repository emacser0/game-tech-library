// 터널링 & 연속 충돌 감지(CCD): 이산 검사 vs 서브스텝 vs 스윕(TOI) 검사
GTL.register({
  id: 'ccd-tunneling',
  title: '터널링 & 연속 충돌 감지 (CCD)',
  summary: '빠른 물체를 스텝마다 "그 순간의 위치"로만 검사하면 얇은 벽을 건너뜀(터널링). 이동 경로 전체를 훑어 충돌 시각(TOI)을 구하면 어떤 속도에서도 막힘.',
  views: { a: '이산 검사', b: '스윕 CCD (TOI)' },
  controls: '마우스 클릭: 클릭한 방향으로 공 하나 추가 발사',
  info: `
    <p><b>터널링</b>은 빠른 물체가 얇은 벽을 그냥 통과하는 현상. <b>연속 충돌 감지</b>(CCD, Continuous Collision Detection)는 이를 막는 방법.</p>
    <p><b>이산 충돌 검사</b>는 스텝이 끝난 위치에서만 겹침을 확인함. 그래서 두 가지 문제가 생김.</p>
    <ul>
      <li>한 스텝 이동량 <code>v*dt</code>가 <code>벽 두께 + 공 지름</code>보다 크면 겹치는 순간을 아예 놓침. 공이 <b>벽을 그냥 통과</b>함.</li>
      <li>이동량이 <code>반지름 + 두께/2</code>만 넘어도 겹친 순간에 공 중심이 벽 중앙선을 이미 넘었을 수 있음. 그러면 반대 방향으로 밀려 <b>벽 건너편으로 빠져나감</b>.</li>
    </ul>
    <p>해결 방법:</p>
    <ul>
      <li><b>서브스텝</b>: dt를 n등분해 검사 간격을 줄임. 비용이 n배이고, 충분히 빠르면 여전히 뚫림.</li>
      <li><b>스윕 검사(CCD)</b>: 공이 이동하며 지나는 영역(캡슐 모양)과 벽을 교차시켜 <b>처음 부딪치는 시각 t∈[0,1]</b>을 구함. 그 시점에서 반사하고 남은 시간만큼 다시 이동함. 속도와 관계없이 정확함.</li>
    </ul>
    <p>단점: 스윕 검사는 이산 검사보다 계산이 복잡하고 비쌈.</p>
    <p>회색 점은 각 공이 물리 스텝마다 실제로 있었던 위치. 점 사이의 빈 곳이 검사하지 않은 구간.</p>`,
  // 도식: 이산 검사는 스텝 사이 구간을 보지 않음. 스윕 검사는 경로 전체에서 첫 접촉 시각을 구함
  diagram: (L) => `<svg viewBox="0 0 540 176" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr-ccd" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="16" class="t-a">${L('A: 스텝 끝 위치만 검사', 'A: test end positions only')}</text>
    <rect x="132" y="34" width="6" height="104" class="f-dim"/>
    <line x1="72" y1="88" x2="203" y2="88" class="d-dim" stroke-dasharray="3 3"/>
    <circle cx="60" cy="88" r="12" class="f-a"/><circle cx="215" cy="88" r="12" class="f-a"/>
    <text x="60" y="118" text-anchor="middle" class="t-small t-mono">t0</text>
    <text x="215" y="118" text-anchor="middle" class="t-small t-mono">t0 + dt</text>
    <text x="135" y="68" text-anchor="middle" class="t-small t-dim">${L('검사 안 한 구간', 'unchecked gap')}</text>
    <text x="10" y="156" class="t-small">${L('v*dt > 두께 + 지름이면 겹침을 놓침', 'Misses the overlap if v*dt > thickness + diameter')}</text>
    <text x="290" y="16" class="t-b">${L('B: 이동 경로 전체를 스윕', 'B: sweep the whole path')}</text>
    <rect x="320" y="76" width="200" height="24" rx="12" class="f-dim"/>
    <rect x="412" y="34" width="6" height="104" class="f-dim"/>
    <circle cx="332" cy="88" r="12" class="f-b"/>
    <circle cx="508" cy="88" r="12" class="d-dim" stroke-dasharray="3 3"/>
    <circle cx="400" cy="88" r="12" class="d-b"/>
    <text x="400" y="68" text-anchor="middle" class="t-small t-mono">t = TOI</text>
    <path d="M396,118 L340,118" class="d-b" marker-end="url(#arr-ccd)"/>
    <text x="402" y="122" class="t-small t-dim">${L('반사 후 남은 시간 이동', 'reflect, move the rest')}</text>
    <text x="290" y="156" class="t-small">${L('처음 닿는 시각 t∈[0,1]을 구해 그 자리에서 반사', 'Reflect at first contact time t in [0,1]')}</text>
  </svg>`,
  look: [
    'A를 그대로 두면 공들이 얇은 벽을 통과해 상자 밖으로 탈출함(빨간 X). B는 같은 속도에서 관통 0.',
    'A의 방식을 "서브스텝"으로 바꾸고 서브스텝 수를 올리면 관통이 줄어듦. 하지만 속도를 6000까지 올리면 다시 뚫림.',
    '시간 배율을 0.1로 낮추면 회색 점이 벽을 건너뛰는 모습이 보임. B에서는 노란 원(TOI 충돌 지점)이 벽 표면에 찍힘.',
    '벽 두께를 키우거나 속도를 낮추면 A도 막힘. 스텝당 이동량이 "반지름 + 두께/2"(통계의 안전 임계)보다 작아야 안전함.',
  ],
  refs: [
    { type: 'talk', title: 'Continuous Collision (Erin Catto, GDC 2013)', url: 'https://box2d.org/publications/', year: 2013, note: 'Box2D의 TOI, Conservative Advancement 설명.' },
    { type: 'engine', title: 'Unity - Continuous collision detection (CCD)', url: 'https://docs.unity3d.com/Manual/ContinuousCollisionDetection.html', note: 'Discrete, Continuous, Continuous Dynamic, Continuous Speculative 모드.' },
    { type: 'book', title: 'Real-Time Collision Detection (Christer Ericson)', year: 2005, note: '5.5절 Dynamic intersection tests. 움직이는 구 vs 평면, 캡슐.' },
    { type: 'engine', title: 'Box2D - Bullet bodies (b2BodyDef::isBullet)', note: '빠른 동적 바디끼리도 CCD를 적용하는 플래그.' },
  ],
  params: [
    { key: 'method', label: '충돌 검사', type: 'select', group: '검사 방식', options: [
      { value: 'discrete', label: '이산 (스텝 끝 위치만)' },
      { value: 'substep', label: '서브스텝 (n등분 이산)' },
      { value: 'ccd', label: '스윕 CCD (TOI)' },
    ], a: 'discrete', b: 'ccd' },
    { key: 'substeps', label: '서브스텝 수', type: 'int', min: 1, max: 16, default: 4, when: (p) => p.method === 'substep' },
    { key: 'speed', label: '공 속도 (px/s)', type: 'range', min: 200, max: 6000, step: 50, default: 1000 },
    { key: 'hz', label: '물리 주기 (Hz)', type: 'int', min: 10, max: 240, default: 60 },
    { key: 'thick', label: '벽 두께 (px)', type: 'range', min: 1, max: 40, step: 1, default: 4, shared: true, group: '장면' },
    { key: 'count', label: '공 개수', type: 'int', min: 1, max: 40, default: 14, shared: true, reset: true },
    { key: 'timeScale', label: '시간 배율', type: 'range', min: 0.02, max: 1, step: 0.01, default: 1, shared: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Tunneling & Continuous Collision Detection (CCD)',
    summary: 'If you only test a fast object at "where it is right now" each step, it skips over thin walls (tunneling). Sweep the whole path and find the time of impact (TOI), and walls stop it at any speed.',
    views: { a: 'Discrete test', b: 'Swept CCD (TOI)' },
    controls: 'Mouse click: fire one more ball toward the click',
    info: `
    <p><b>Tunneling</b> is when a fast object passes straight through a thin wall. <b>Continuous collision detection</b> (CCD) is a way to prevent it.</p>
    <p>A <b>discrete collision test</b> checks for overlap only at the position where the step ends. This causes two problems.</p>
    <ul>
      <li>If the move per step <code>v*dt</code> is larger than <code>wall thickness + ball diameter</code>, the test misses the overlap entirely. The ball <b>passes right through the wall</b>.</li>
      <li>Even if the move only exceeds <code>radius + thickness/2</code>, the ball center may already be past the wall's center line when the overlap is found. The ball is then pushed the wrong way and <b>exits on the far side</b>.</li>
    </ul>
    <p>Fixes:</p>
    <ul>
      <li><b>Substeps</b>: split dt into n parts to shorten the test interval. It costs n times as much, and fast enough objects still get through.</li>
      <li><b>Swept test (CCD)</b>: intersect the wall with the area the ball sweeps as it moves (a capsule shape). This gives the <b>first time of contact t∈[0,1]</b>. Reflect at that point, then move for the time that is left. It is exact at any speed.</li>
    </ul>
    <p>Downside: the swept test is more complex and more expensive than the discrete test.</p>
    <p>Gray dots show where each ball actually was at each physics step. The gaps between dots are the parts that were never tested.</p>`,
    look: [
      'Leave A as it is. Balls pass through the thin walls and escape the box (red X). B has zero tunneling at the same speed.',
      'Switch A to "Substeps" and raise the substep count. Tunneling drops. But raise the speed to 6000 and balls get through again.',
      'Lower the time scale to 0.1. You can see the gray dots skip over walls. In B, yellow circles (TOI contact points) land on the wall surface.',
      'Make walls thicker or lower the speed, and A stops balls too. The move per step must be smaller than "radius + thickness/2" (the safe limit in the stats).',
    ],
    refs: [
      'Explains TOI and Conservative Advancement in Box2D.',
      'Discrete, Continuous, Continuous Dynamic, and Continuous Speculative modes.',
      'Section 5.5, Dynamic intersection tests. Moving sphere vs plane, capsule.',
      'A flag that applies CCD between fast dynamic bodies too.',
    ],
    params: {
      method: { label: 'Collision test', group: 'Test method', options: { discrete: 'Discrete (end of step only)', substep: 'Substeps (discrete, split n ways)', ccd: 'Swept CCD (TOI)' } },
      substeps: 'Substeps',
      speed: 'Ball speed (px/s)',
      hz: 'Physics rate (Hz)',
      thick: { label: 'Wall thickness (px)', group: 'Scene' },
      count: 'Ball count',
      timeScale: 'Time scale',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const R = 6;                     // 공 반지름
    // 논리 좌표 600x400 (뷰 크기와 무관하게 같은 장면)
    const LW = 600, LH = 400;
    const BOX = { x0: 40, y0: 30, x1: 560, y1: 370 };
    const walls = [
      [BOX.x0, BOX.y0, BOX.x1, BOX.y0], [BOX.x1, BOX.y0, BOX.x1, BOX.y1],
      [BOX.x1, BOX.y1, BOX.x0, BOX.y1], [BOX.x0, BOX.y1, BOX.x0, BOX.y0],
      [200, 110, 330, 170], [380, 260, 470, 140], [140, 300, 260, 260],
    ].map(([ax, ay, bx, by]) => {
      const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
      return { ax, ay, bx, by, ux: dx / L, uy: dy / L, nx: -dy / L, ny: dx / L, L, flash: 0 };
    });

    let balls, acc, tunnels, escapes, checks, marks, toiMarks;
    const spawn = (x, y, ang) => ({ x, y, dir: ang, vx: Math.cos(ang), vy: Math.sin(ang), samples: [], escaped: 0 });
    const init = () => {
      ctx.rng = U.rng(ctx.seed);
      balls = [];
      for (let i = 0; i < P.count; i++) balls.push(spawn(300 + ctx.rng.range(-30, 30), 220 + ctx.rng.range(-20, 20), ctx.rng.range(0, U.TAU)));
      acc = 0; tunnels = 0; escapes = 0; checks = 0; marks = []; toiMarks = [];
    };
    init();

    const side = (w, x, y) => (x - w.ax) * w.nx + (y - w.ay) * w.ny;
    const along = (w, x, y) => (x - w.ax) * w.ux + (y - w.ay) * w.uy;

    // 겹침 해소(이산): 벽 캡슐과의 최근접점 기준으로 밀어내고 반사
    function resolveDiscrete(b, rad) {
      for (const w of walls) {
        checks++;
        const t = U.clamp(along(w, b.x, b.y), 0, w.L);
        const cx = w.ax + w.ux * t, cy = w.ay + w.uy * t;
        let dx = b.x - cx, dy = b.y - cy;
        const d = Math.hypot(dx, dy);
        if (d >= rad || d < 1e-9) continue;
        dx /= d; dy /= d;
        b.x = cx + dx * rad; b.y = cy + dy * rad;
        const vn = b.vx * dx + b.vy * dy;
        if (vn < 0) { b.vx -= 2 * vn * dx; b.vy -= 2 * vn * dy; }
      }
    }

    // 레이(p + d*t, t∈[0,1]) vs 반지름 rad 캡슐(벽) → { t, nx, ny } | null
    function rayCapsule(px, py, dx, dy, w, rad) {
      let best = null;
      const s0 = side(w, px, py), dn = dx * w.nx + dy * w.ny;
      const sgn = s0 >= 0 ? 1 : -1;
      if (Math.abs(s0) >= rad && dn * sgn < 0) {
        const t = (Math.abs(s0) - rad) / Math.abs(dn);
        if (t <= 1) {
          const a = along(w, px + dx * t, py + dy * t);
          if (a >= 0 && a <= w.L) best = { t, nx: w.nx * sgn, ny: w.ny * sgn };
        }
      }
      for (const [cx, cy] of [[w.ax, w.ay], [w.bx, w.by]]) {
        const fx = px - cx, fy = py - cy;
        const A = dx * dx + dy * dy, B = 2 * (fx * dx + fy * dy), Cc = fx * fx + fy * fy - rad * rad;
        if (Cc < 0 || A < 1e-12) continue;
        const disc = B * B - 4 * A * Cc;
        if (disc < 0) continue;
        const t = (-B - Math.sqrt(disc)) / (2 * A);
        if (t >= 0 && t <= 1 && (!best || t < best.t)) {
          const hx = px + dx * t - cx, hy = py + dy * t - cy, l = Math.hypot(hx, hy) || 1;
          best = { t, nx: hx / l, ny: hy / l };
        }
      }
      return best;
    }

    function moveCCD(b, h, rad) {
      let remain = 1;
      for (let iter = 0; iter < 6 && remain > 1e-6; iter++) {
        const dx = b.vx * h * remain, dy = b.vy * h * remain;
        let hit = null;
        for (const w of walls) {
          checks++;
          const r = rayCapsule(b.x, b.y, dx, dy, w, rad);
          if (r && (!hit || r.t < hit.t)) hit = r;
        }
        if (!hit) { b.x += dx; b.y += dy; break; }
        const t = Math.max(0, hit.t - 1e-4);
        b.x += dx * t; b.y += dy * t;
        toiMarks.push({ x: b.x, y: b.y, life: 1 });
        const vn = b.vx * hit.nx + b.vy * hit.ny;
        if (vn < 0) { b.vx -= 2 * vn * hit.nx; b.vy -= 2 * vn * hit.ny; }
        remain *= 1 - hit.t;
      }
      resolveDiscrete(b, rad); // 시작부터 겹쳐 있던 경우 안전장치
    }

    function stepBall(b, h) {
      const rad = R + P.thick / 2;
      const sx = b.x, sy = b.y;
      const sides = walls.map((w) => side(w, sx, sy));
      if (P.method === 'ccd') moveCCD(b, h, rad);
      else {
        const n = P.method === 'substep' ? P.substeps : 1, hh = h / n;
        for (let i = 0; i < n; i++) {
          b.x += b.vx * hh; b.y += b.vy * hh;
          resolveDiscrete(b, rad);
          if (n > 1) { b.samples.push(b.x, b.y); }
        }
      }
      if (P.method !== 'substep') b.samples.push(b.x, b.y);
      while (b.samples.length > 40) b.samples.splice(0, 2);
      // 관통 판정: 스텝 전후로 벽 중심선의 반대편에 있고, 교차점이 벽 범위 안
      walls.forEach((w, i) => {
        const s1 = side(w, b.x, b.y);
        if ((sides[i] > 0) !== (s1 > 0) && sides[i] !== 0) {
          const t = sides[i] / (sides[i] - s1);
          const ix = sx + (b.x - sx) * t, iy = sy + (b.y - sy) * t;
          const a = along(w, ix, iy);
          if (a >= 0 && a <= w.L) { tunnels++; w.flash = 1; marks.push({ x: ix, y: iy, life: 1 }); }
        }
      });
      // 상자 탈출 → 기록 후 중앙에서 같은 방향으로 재투입
      if (b.x < BOX.x0 - 2 || b.x > BOX.x1 + 2 || b.y < BOX.y0 - 2 || b.y > BOX.y1 + 2) {
        escapes++;
        marks.push({ x: U.clamp(b.x, 5, LW - 5), y: U.clamp(b.y, 5, LH - 5), life: 1.5, x2: true });
        b.x = 300; b.y = 220; b.samples = [];
      }
    }

    return {
      update(dt) {
        const h = 1 / P.hz;
        acc += dt * P.timeScale;
        let n = 0;
        checks = 0;
        while (acc >= h && n < 20) {
          for (const b of balls) {
            const sp = Math.hypot(b.vx, b.vy) || 1;
            b.vx = (b.vx / sp) * P.speed; b.vy = (b.vy / sp) * P.speed;
            stepBall(b, h);
          }
          acc -= h; n++;
        }
        if (n >= 20) acc = 0;
        const fade = dt * Math.max(P.timeScale, 0.15);
        for (const m of marks) m.life -= fade * 0.5;
        for (const m of toiMarks) m.life -= fade * 2;
        marks = marks.filter((m) => m.life > 0);
        toiMarks = toiMarks.filter((m) => m.life > 0).slice(-200);
        for (const w of walls) w.flash = Math.max(0, w.flash - dt * 3);
      },
      onPointer(type, m) {
        if (type !== 'down' || balls.length >= 60) return;
        const s = Math.min(ctx.width / LW, ctx.height / LH), ox = (ctx.width - LW * s) / 2, oy = (ctx.height - LH * s) / 2;
        const lx = (m.x - ox) / s, ly = (m.y - oy) / s;
        balls.push(spawn(300, 220, Math.atan2(ly - 220, lx - 300)));
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const s = Math.min(W / LW, H / LH), ox = (W - LW * s) / 2, oy = (H - LH * s) / 2;
        g.save();
        g.translate(ox, oy); g.scale(s, s);
        D.grid(g, LW, LH, 40);
        const col = ctx.side === 'a' ? C.a : C.b;
        g.lineCap = 'round';
        for (const w of walls) {
          D.line(g, w.ax, w.ay, w.bx, w.by, w.flash > 0 ? `rgba(255,83,112,${0.4 + w.flash * 0.6})` : '#9aa3b2', Math.max(1, P.thick));
        }
        g.lineCap = 'butt';
        // 샘플 위치(스텝마다 실제 존재했던 곳)
        g.fillStyle = 'rgba(200,205,215,0.35)';
        for (const b of balls) {
          for (let i = 0; i < b.samples.length; i += 2) { g.beginPath(); g.arc(b.samples[i], b.samples[i + 1], 2, 0, U.TAU); g.fill(); }
        }
        for (const m of toiMarks) D.circle(g, m.x, m.y, R, null, `rgba(255,203,107,${m.life})`, 1.5);
        for (const b of balls) {
          D.circle(g, b.x, b.y, R, col);
          D.line(g, b.x, b.y, b.x + b.vx * 0.006, b.y + b.vy * 0.006, 'rgba(255,255,255,0.5)', 1);
        }
        for (const m of marks) {
          const a = Math.min(1, m.life);
          if (m.x2) { D.line(g, m.x - 7, m.y - 7, m.x + 7, m.y + 7, `rgba(255,83,112,${a})`, 3); D.line(g, m.x - 7, m.y + 7, m.x + 7, m.y - 7, `rgba(255,83,112,${a})`, 3); }
          else D.circle(g, m.x, m.y, 5 + (1 - a) * 10, null, `rgba(255,83,112,${a})`, 2);
        }
        g.restore();
        const move = P.speed / P.hz / (P.method === 'substep' ? P.substeps : 1);
        ctx.stat(GTL.L('스텝당 이동량', 'Move per step'), move.toFixed(1) + ' px');
        ctx.stat(GTL.L('이산 검사 안전 임계', 'Discrete safe limit'), (R + P.thick / 2).toFixed(1) + GTL.L(' px (반지름+두께/2)', ' px (radius+thickness/2)'));
        ctx.stat(GTL.L('벽 관통', 'Wall tunneling'), tunnels);
        ctx.stat(GTL.L('상자 탈출', 'Box escapes'), escapes);
        ctx.stat(GTL.L('프레임당 벽 검사', 'Wall tests per frame'), checks);
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
