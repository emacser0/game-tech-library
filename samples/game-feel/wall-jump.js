// 벽 점프 & 벽 미끄러짐: 낙하 속도 제한과 벽 점프 직후 입력 잠금
GTL.register({
  id: 'wall-jump',
  title: '벽 점프 & 벽 미끄러짐',
  summary: '벽에 붙어도 그냥 떨어지고, 벽 점프 직후 방향키가 바로 먹히면 반대 벽까지 못 감. 벽 미끄러짐(낙하 속도 제한)과 짧은 입력 잠금을 주면 같은 입력으로 수직 통로를 올라감.',
  views: { a: '미끄러짐 없음, 입력 잠금 없음', b: '벽 미끄러짐 + 입력 잠금 150ms' },
  controls: '←→ / A D 이동, Space / Z / ↑ / W 점프, 벽에 붙은 채 점프하면 벽 점프 (키를 누르면 자동 데모가 잠시 멈춤)',
  info: `
    <p><b>벽 점프(Wall Jump)</b>: 공중에서 벽에 닿은 채 점프하면 벽 반대쪽 위로 튕겨 나감</p>
    <ul>
      <li><b>벽 미끄러짐(Wall Slide)</b>: 벽 쪽으로 방향키를 누르고 있으면 낙하 속도를 낮게 제한.
      플레이어가 다음 점프를 판단할 시간이 생기고, 벽에 붙었다는 사실이 눈에 보임.</li>
      <li><b>입력 잠금(Input Lock, Force Move)</b>: 벽 점프 직후 짧은 시간 동안 방향 입력을 무시하고 벽 반대 방향으로 밀어 줌.
      플레이어는 벽 점프 순간에도 손가락이 아직 벽 쪽 방향키에 있음. 잠금이 없으면 그 입력이 공중 가속을 바로 상쇄해 벽에서 거의 떨어지지 못함.</li>
    </ul>
    <p>Celeste는 벽 점프 뒤 0.16초 동안 수평 이동을 고정(<code>WallJumpForceTime</code>).
    단점: 잠금이 길면 공중에서 조작이 안 되는 답답함이 생김. 0.1~0.2초가 흔한 값.</p>
    <p>뷰 색 궤적은 벽 점프 뒤 잠금 구간, 회색은 자유 이동, 초록은 벽 미끄러짐 구간</p>`,
  // 도식: 입력 잠금 없이 벽 쪽 입력이 남을 때와 미끄러짐 + 잠금이 있을 때의 벽 점프 궤적
  diagram: (L) => `<svg viewBox="0 0 540 204" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr-wj" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <rect x="40" y="20" width="16" height="160" class="f-dim"/><rect x="200" y="20" width="16" height="160" class="f-dim"/>
    <rect x="300" y="20" width="16" height="160" class="f-dim"/><rect x="460" y="20" width="16" height="160" class="f-dim"/>
    <text x="128" y="14" text-anchor="middle" class="t-a">${L('A: 미끄러짐 없음, 잠금 없음', 'A: no slide, no lock')}</text>
    <text x="388" y="14" text-anchor="middle" class="t-b">${L('B: 미끄러짐 + 잠금', 'B: slide + lock')}</text>
    <path d="M58,150 Q105,95 60,80" class="d-a"/><circle cx="58" cy="150" r="4" class="f-a"/>
    <text x="64" y="62" class="t-small">${L('벽 쪽 입력이 밀기 상쇄', 'held key cancels push')}</text>
    <line x1="60" y1="86" x2="60" y2="172" class="d-dim" stroke-dasharray="3 3" marker-end="url(#arr-wj)"/>
    <text x="66" y="170" class="t-small t-dim">${L('빠른 낙하', 'fast fall')}</text>
    <line x1="318" y1="104" x2="318" y2="150" class="d-good"/><text x="324" y="124" class="t-small">${L('미끄러짐', 'slide')}</text>
    <circle cx="318" cy="150" r="4" class="f-b"/>
    <path d="M318,150 L370,116" class="d-b"/><text x="352" y="142" class="t-small">${L('잠금 150ms', 'lock 150ms')}</text>
    <path d="M370,116 Q425,82 458,70" class="d-dim" marker-end="url(#arr-wj)"/><text x="400" y="104" class="t-small t-dim">${L('자유 이동', 'free move')}</text>
    <text x="128" y="198" text-anchor="middle" class="t-small">${L('같은 벽으로 되돌아옴', 'Drifts back to the same wall')}</text>
    <text x="388" y="198" text-anchor="middle" class="t-small">${L('반대 벽까지 도달', 'Reaches the other wall')}</text>
  </svg>`,
  look: [
    '자동 데모는 벽 점프 직후에도 120ms 동안 벽 쪽 방향키를 누르고 있음. A는 반대 벽에 낮게 닿고 점점 내려가 바닥에 떨어짐. B는 꼭대기까지 올라감.',
    'A의 입력 잠금만 150ms로 올려도 꼭대기까지 올라감. 잠금이 반대 벽까지 갈 수평 속도를 지켜 주기 때문.',
    'B의 입력 잠금을 0으로 내리면 벽 점프 직후 궤적이 벽 쪽으로 꺾여 들어감. 미끄러짐 덕분에 올라가긴 하지만 "완주 시간"이 늘어남.',
    '"데모: 방향 전환 지연"을 0으로 내리면 사람이 바로 반대 방향을 누른 경우가 됨. 이때는 잠금이 없어도 잘 올라감.',
  ],
  refs: [
    { type: 'code', title: 'Celeste - Player.cs (WallJumpForceTime = 0.16f, WallSlideStartMax)', url: 'https://github.com/NoelFB/Celeste', year: 2018, note: '벽 점프 뒤 forceMoveX 타이머, 벽 미끄러짐 낙하 속도 제한' },
    { type: 'game', title: 'Super Meat Boy (Team Meat)', year: 2010, note: '벽 미끄러짐과 벽 점프를 중심으로 만든 플랫포머' },
    { type: 'game', title: 'Mega Man X (Capcom)', year: 1993, note: '벽 미끄러짐과 벽 차기 점프의 초기 사례' },
    { type: 'book', title: 'Game Feel: A Game Designer\'s Guide to Virtual Sensation (Steve Swink)', year: 2008 },
  ],
  params: [
    { key: 'slide', label: '벽 미끄러짐', type: 'bool', a: false, b: true, default: false, group: '기법' },
    { key: 'slideMax', label: '미끄러짐 최대 낙하 속도 (px/s)', type: 'int', min: 40, max: 400, default: 120, when: (p) => p.slide },
    { key: 'lock', label: '벽 점프 입력 잠금 (ms)', type: 'range', min: 0, max: 300, step: 10, a: 0, b: 150, default: 0 },
    { key: 'demo', label: '자동 데모', type: 'bool', default: true, shared: true, group: '장면' },
    { key: 'demoReact', label: '데모: 방향 전환 지연 (ms)', type: 'range', min: 0, max: 250, step: 10, default: 120, shared: true, help: '벽 점프를 누른 뒤 반대 방향키로 바꾸기까지 걸리는 시간' },
    { key: 'restart', label: '처음부터', type: 'button', buttonLabel: '다시 시작' },
  ],
  en: {
    title: 'Wall Jump & Wall Slide',
    summary: 'If you just fall when touching a wall, and the direction key takes effect right after a wall jump, you cannot reach the opposite wall. Add a wall slide (fall speed limit) and a short input lock. Then the same input climbs the vertical shaft.',
    views: { a: 'No slide, no input lock', b: 'Wall slide + 150ms input lock' },
    controls: '←→ / A D to move, Space / Z / ↑ / W to jump. Jump while touching a wall to wall jump (pressing a key pauses the auto demo for a moment)',
    info: `
    <p><b>Wall jump</b>: jump while touching a wall in the air, and you bounce up and away from the wall.</p>
    <ul>
      <li><b>Wall slide</b>: while you hold the direction key toward the wall, the fall speed is capped low.
      The player gets time to plan the next jump, and you can see that the character is on the wall.</li>
      <li><b>Input lock (force move)</b>: right after a wall jump, ignore direction input for a short time and push away from the wall.
      At the moment of the wall jump, the player's finger is still on the key toward the wall. Without a lock, that input cancels the air acceleration at once, and the character barely leaves the wall.</li>
    </ul>
    <p>Celeste fixes horizontal movement for 0.16 s after a wall jump (<code>WallJumpForceTime</code>).
    Downside: a long lock feels frustrating because you cannot steer in the air. 0.1 to 0.2 s is a common value.</p>
    <p>Trail colors: the view color is the lock period after a wall jump, gray is free movement, green is wall slide.</p>`,
    look: [
      'The auto demo keeps holding the key toward the wall for 120ms after each wall jump. A reaches the opposite wall low, slips down step by step, and falls to the floor. B climbs to the top.',
      'Just raise A\'s input lock to 150ms and it reaches the top too. The lock keeps the horizontal speed needed to reach the opposite wall.',
      'Lower B\'s input lock to 0. Right after a wall jump, the path bends back toward the wall. The slide still lets it climb, but "Clear time" goes up.',
      'Lower "Demo: direction change delay" to 0. This is a player who switches direction at once. Then it climbs fine even without a lock.',
    ],
    refs: [
      'The forceMoveX timer after a wall jump, and the fall speed limit for wall slides.',
      'A platformer built around wall slides and wall jumps.',
      'An early example of wall slides and wall kick jumps.',
      null,
    ],
    params: {
      slide: { label: 'Wall slide', group: 'Technique' },
      slideMax: 'Max slide fall speed (px/s)',
      lock: 'Wall jump input lock (ms)',
      demo: { label: 'Auto demo', group: 'Scene' },
      demoReact: { label: 'Demo: direction change delay (ms)', help: 'Time from pressing wall jump until switching to the opposite direction key' },
      restart: { label: 'Start over', buttonLabel: 'Restart' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 640, WORLD_H = 1100, STEP = 1 / 120;
    const GRAV = 2000, MAXFALL = 760, RUN = 240, AIR_ACC = 3000, GND_ACC = 3600;
    const JUMP_V = 680, WJ_VX = 360, WJ_VY = 620, PW = 16, PH = 22;
    const FLOOR = 1060, GOAL = 140, START_X = 312;
    const col = ctx.side === 'a' ? C.a : C.b;
    const KEYS = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], jump: ['Space', 'KeyZ', 'ArrowUp', 'KeyW'] };
    const ALL = [...KEYS.left, ...KEYS.right, ...KEYS.jump];
    const solids = [
      { x: 180, y: 0, w: 80, h: FLOOR },     // 왼쪽 벽 (안쪽 면 x = 260)
      { x: 380, y: 0, w: 80, h: FLOOR },     // 오른쪽 벽 (안쪽 면 x = 380)
      { x: 0, y: FLOOR, w: WW, h: 60 },
    ];

    let p, acc, idle, pend, trail, stats, demo, camY, best, endT, msg, epT, lastTime;
    function resetEpisode() {
      p = { x: START_X, y: FLOOR - PH, vx: 0, vy: 0, grounded: true, wall: 0, lock: 0, lockDir: 0, sliding: false, face: 1 };
      trail = []; best = 0; endT = -1; epT = 0;
      demo = { side: -1, hold: -1, wallT: 0, react: 0, t: 0, prevJump: false, jumpHold: 0, launched: false };
      camY = p.y;
    }
    function init() { lastTime = null; acc = 0; idle = 99; pend = false; stats = { ok: 0, fail: 0, wj: 0 }; msg = '-'; resetEpisode(); }
    init();

    const overlap = (a, s) => a.x < s.x + s.w && a.x + PW > s.x && a.y < s.y + s.h && a.y + PH > s.y;
    const wallAt = (dir) => solids.some((s) => overlap({ x: p.x + dir * 2, y: p.y }, s));

    function demoInput() {
      demo.t += STEP;
      let jump = false;
      if (p.grounded) {
        // 바닥: 목표 벽 쪽을 누르며 점프해 첫 벽에 붙음
        demo.hold = demo.side;
        if (demo.t > 0.4 && !demo.launched) { jump = true; demo.launched = true; }
      } else if (p.wall === demo.side && p.lock <= 0) {
        demo.wallT += STEP;
        if (demo.wallT >= 0.08) {
          jump = true; demo.wallT = 0;
          demo.react = P.demoReact / 1000;
          demo.side = -demo.side;
        }
      }
      if (demo.react > 0) { demo.react -= STEP; demo.hold = -demo.side; } else demo.hold = demo.side;
      if (jump) demo.jumpHold = 0.05;
      let held = false;
      if (demo.jumpHold > 0) { demo.jumpHold -= STEP; held = true; }
      const pressed = held && !demo.prevJump;
      demo.prevJump = held;
      return { left: demo.hold < 0, right: demo.hold > 0, jumpPressed: pressed };
    }

    function step(inp) {
      let dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      if (p.lock > 0) { p.lock -= STEP; dir = p.lockDir; }
      if (dir) p.face = dir;
      p.wall = p.grounded ? 0 : wallAt(-1) ? -1 : wallAt(1) ? 1 : 0;
      if (inp.jumpPressed) {
        if (p.grounded) { p.vy = -JUMP_V; p.grounded = false; }
        else if (p.wall) {
          p.vx = -p.wall * WJ_VX; p.vy = -WJ_VY; stats.wj++;
          p.lock = P.lock / 1000; p.lockDir = -p.wall;
          if (p.lock > 0) dir = p.lockDir;
          p.wall = 0;
        }
      }
      p.vx = U.approach(p.vx, dir * RUN, (p.grounded ? GND_ACC : AIR_ACC) * STEP);
      p.vy = Math.min(p.vy + GRAV * STEP, MAXFALL);
      // 벽 미끄러짐: 벽 쪽으로 누르고 있고 내려가는 중이면 낙하 속도 제한
      p.sliding = P.slide && p.wall !== 0 && dir === p.wall && p.vy > 0;
      if (p.sliding) p.vy = Math.min(p.vy, P.slideMax);
      p.x += p.vx * STEP;
      for (const s of solids) if (overlap(p, s)) { p.x = p.vx > 0 ? s.x - PW : s.x + s.w; p.vx = 0; }
      p.y += p.vy * STEP;
      p.grounded = false;
      for (const s of solids) if (overlap(p, s)) {
        if (p.vy > 0) { p.y = s.y - PH; p.grounded = true; } else p.y = s.y + s.h;
        p.vy = 0;
      }
      const h = FLOOR - PH - p.y;
      best = Math.max(best, h);
      trail.push({ x: p.x + PW / 2, y: p.y + PH / 2, s: p.sliding ? 'slide' : p.lock > 0 ? 'lock' : 'free' });
      if (trail.length > 1600) trail.shift();
    }

    function judge(auto) {
      if (endT >= 0) { endT -= STEP; if (endT < 0) resetEpisode(); return; }
      epT += STEP;
      if (p.y < GOAL) { lastTime = epT; stats.ok++; msg = GTL.L('✓ 꼭대기 도착', '✓ Reached the top'); endT = 0.6; return; }
      if (auto && p.grounded && best > 60) { stats.fail++; msg = GTL.L(`✗ 바닥으로 떨어짐 (최고 ${best.toFixed(0)}px)`, `✗ Fell to the floor (best ${best.toFixed(0)}px)`); endT = 0.5; return; }
      if (auto && demo.t > 14) { stats.fail++; msg = GTL.L('✗ 시간 초과', '✗ Time out'); endT = 0.3; }
    }

    return {
      update(dt) {
        const kb = ctx.input;
        const manual = { left: KEYS.left.some(kb.key), right: KEYS.right.some(kb.key), jumpPressed: KEYS.jump.some(kb.pressed) };
        const touched = ALL.some(kb.key) || manual.jumpPressed;
        const was = P.demo && idle > 2.5;
        idle = touched ? 0 : idle + dt;
        const auto = P.demo && idle > 2.5;
        if (auto && !was) resetEpisode();
        if (!auto && manual.jumpPressed) pend = true;
        acc += dt;
        while (acc >= STEP) {
          acc -= STEP;
          let inp;
          if (auto) inp = demoInput();
          else { inp = { ...manual, jumpPressed: pend }; pend = false; }
          if (endT >= 0) inp = { left: false, right: false, jumpPressed: false };
          step(inp);
          judge(auto);
        }
        camY = U.damp(camY, p.y, 6, dt);
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const sc = Math.min(W / WW, H / 360) * 1.0, vh = H / sc;
        const cy = U.clamp(camY - vh * 0.45, -40, WORLD_H - vh);
        g.save(); g.translate((W - WW * sc) / 2, 0); g.scale(sc, sc); g.translate(0, -cy);
        D.grid(g, WW, WORLD_H, 40);
        // 높이 눈금
        for (let y = FLOOR; y > 0; y -= 100) {
          D.line(g, 470, y, 490, y, 'rgba(255,255,255,0.2)');
          D.text(g, `${FLOOR - y}`, 494, y - 6, { size: 10, color: C.dim });
        }
        D.rect(g, 260, GOAL - 4, 120, 4, C.good);
        D.text(g, GTL.L('목표', 'Goal'), 320, GOAL - 18, { size: 11, color: C.good, align: 'center' });
        for (const s of solids) { D.rect(g, s.x, s.y, s.w, s.h, '#2a2f38'); }
        D.rect(g, 258, 0, 2, FLOOR, '#4a5260'); D.rect(g, 380, 0, 2, FLOOR, '#4a5260');
        // 최고 높이선
        const by = FLOOR - PH - best;
        g.setLineDash([4, 4]); D.line(g, 260, by, 380, by, 'rgba(255,255,255,0.35)', 1); g.setLineDash([]);
        // 궤적
        for (let i = 0; i < trail.length; i += 2) {
          const t = trail[i];
          D.circle(g, t.x, t.y, 1.5, t.s === 'slide' ? C.good : t.s === 'lock' ? col : 'rgba(200,200,200,0.45)');
        }
        // 플레이어
        D.rect(g, p.x, p.y, PW, PH, col);
        D.rect(g, p.x + (p.face > 0 ? 9 : 3), p.y + 5, 4, 4, '#14161a');
        if (p.sliding) for (let i = 0; i < 3; i++) D.circle(g, p.x + (p.wall > 0 ? PW : 0), p.y + 6 + i * 6, 1.5, '#fff');
        if (p.lock > 0) D.rect(g, p.x - 4, p.y - 8, (PW + 8) * U.clamp(p.lock / Math.max(0.001, P.lock / 1000), 0, 1), 3, col);
        g.restore();
        D.text(g, msg, 12, 12, { size: 13, color: msg[0] === '✗' ? C.bad : msg[0] === '✓' ? C.good : C.dim });
        if (P.demo && idle <= 2.5) D.text(g, GTL.L('수동 조작 중', 'Manual control'), W - 12, 12, { size: 11, color: C.warn, align: 'right' });
        ctx.stat(GTL.L('완주 / 실패', 'Cleared / failed'), `${stats.ok} / ${stats.fail}`);
        ctx.stat(GTL.L('이번 시도 최고 높이', 'Best height this try'), `${best.toFixed(0)} px`);
        ctx.stat(GTL.L('완주 시간 (최근)', 'Clear time (last)'), lastTime === null ? '-' : `${lastTime.toFixed(2)} s`);
        ctx.stat(GTL.L('벽 점프 횟수', 'Wall jumps'), `${stats.wj}`);
        ctx.stat(GTL.L('낙하 속도', 'Fall speed'), `${Math.max(0, p.vy).toFixed(0)} px/s${p.sliding ? GTL.L(' (미끄러짐)', ' (sliding)') : ''}`);
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
