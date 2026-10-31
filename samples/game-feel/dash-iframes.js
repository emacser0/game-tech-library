// 대시 & 잔상 & 대시 무적: 짧은 고속 이동에 무적 구간과 시각 피드백을 붙임
GTL.register({
  id: 'dash-iframes',
  title: '대시 & 잔상 & 대시 무적',
  summary: '대시에 무적 구간이 없으면 탄을 향해 대시할 때 그대로 맞음. 대시 동안 무적과 잔상을 주면 "뚫고 지나가는" 회피가 되고 이동 경로도 눈에 보임.',
  views: { a: '대시만 (무적 없음, 잔상 없음)', b: '대시 무적 + 잔상' },
  controls: '←→ / A D 이동, Shift / X / C 대시, Space / Z / ↑ / W 점프 (키를 누르면 자동 데모가 잠시 멈춤)',
  info: `
    <p><b>대시(Dash)</b>: 짧은 시간 동안 고정 속도로 빠르게 움직이는 동작. 보통 중력과 입력을 잠시 무시함.</p>
    <p><b>대시 무적(Dash I-Frames)</b>: 대시 중 일부 프레임 동안 피격 판정을 끔.
    탄이나 공격을 "피해서 돌아가는" 대신 "뚫고 지나가는" 회피가 가능해짐. 액션 게임의 회피 구르기, 회피 대시가 이 방식.</p>
    <p><b>잔상(Afterimage)</b>: 대시 동안 몇 프레임마다 캐릭터 모습을 남기고 서서히 지움.
    이동이 순식간이라 눈이 따라가기 어려운데, 잔상이 경로와 속도를 보여 줌. 무적 상태도 함께 알려 줌.</p>
    <ul>
      <li>구현: 대시 타이머, 무적 타이머, 잔상 배열 정도면 충분함.</li>
      <li>단점: 무적이 길면 어떤 공격이든 대시로 넘길 수 있어 긴장감이 사라짐. 쿨다운이나 횟수 제한을 같이 둠.</li>
    </ul>
    <p>캐릭터 아래 막대는 대시 시간(회색)과 무적 시간(뷰 색)을 비교함.</p>`,
  // 도식: 무적 시간이 탄과 겹치는 구간을 덮는지, 잔상이 경로를 남기는 방식
  diagram: (L) => `<svg viewBox="0 0 540 180" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr-di" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <rect x="230" y="16" width="60" height="96" class="f-bad" fill-opacity="0.2"/>
    <text x="260" y="124" text-anchor="middle" class="t-small">${L('탄과 겹치는 구간', 'overlap with bullet')}</text>
    <text x="4" y="34">${L('대시', 'Dash')}</text>
    <rect x="120" y="22" width="300" height="18" class="f-dim"/><text x="270" y="35" text-anchor="middle" class="t-small t-mono">180ms</text>
    <text x="4" y="62" class="t-a">${L('A: 무적', 'A: i-frames')}</text>
    <line x1="120" y1="58" x2="420" y2="58" class="d-dim" stroke-dasharray="3 3"/><text x="124" y="54" class="t-small t-dim">${L('0ms (없음)', '0 ms (none)')}</text>
    <text x="430" y="62" class="t-a">${L('피격', 'hit')}</text>
    <text x="4" y="90" class="t-b">${L('B: 무적', 'B: i-frames')}</text>
    <rect x="120" y="78" width="300" height="18" class="f-b" fill-opacity="0.55"/><text x="270" y="91" text-anchor="middle" class="t-small t-mono">180ms</text>
    <text x="430" y="90" class="t-b">${L('통과', 'pass through')}</text>
    <text x="4" y="150" class="t-dim t-small">${L('B 잔상', 'B afterimages')}</text>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${130 + i * 45}" y="136" width="14" height="20" class="f-b" fill-opacity="${(0.15 + i * 0.15).toFixed(2)}"/>`).join('')}
    <rect x="355" y="136" width="14" height="20" class="f-b"/>
    <circle cx="262" cy="146" r="6" class="f-bad"/>
    <path d="M130,163 L372,163" class="d-accent" marker-end="url(#arr-di)"/>
    <text x="130" y="177" class="t-small t-dim">${L('몇 프레임마다 남긴 모습이 경로와 속도를 보여 줌', 'Snapshots every few frames show path and speed')}</text>
  </svg>`,
  look: [
    '자동 데모는 탄이 가까워지면 탄 쪽으로 대시함. A는 매번 맞고(빨간 깜빡임), B는 탄을 통과함.',
    'B의 무적 시간을 60ms로 줄여도 기본 데모는 통과함. 탄이 대시 시작 직후에 닿기 때문.',
    '이어서 "데모: 대시 거리"를 110으로 키우면 탄이 대시 후반(약 0.1초 뒤)에 닿아 B도 맞음. 무적은 대시 전체를 덮어야 안전함.',
    'A의 잔상을 켜 보면 같은 대시라도 이동 거리와 방향이 훨씬 잘 보임.',
  ],
  refs: [
    { type: 'code', title: 'Celeste - Player.cs (DashSpeed, DashTime)', url: 'https://github.com/NoelFB/Celeste', year: 2018, note: '대시 속도, 시간, 잔상(trail) 처리. Celeste의 대시는 무적이 아님.' },
    { type: 'game', title: 'Hades (Supergiant Games)', year: 2020, note: '대시 중 짧은 무적. 대시로 탄과 적 사이를 통과하는 설계.' },
    { type: 'game', title: 'Enter the Gungeon (Dodge Roll)', year: 2016, note: '회피 구르기 앞부분에만 무적. 뒷부분은 맞을 수 있음.' },
    { type: 'book', title: 'Game Feel: A Game Designer\'s Guide to Virtual Sensation (Steve Swink)', year: 2008 },
  ],
  params: [
    { key: 'iframe', label: '대시 무적 시간 (ms)', type: 'range', min: 0, max: 300, step: 10, a: 0, b: 180, default: 0, group: '기법' },
    { key: 'ghost', label: '잔상', type: 'bool', a: false, b: true, default: false },
    { key: 'dashTime', label: '대시 시간 (ms)', type: 'range', min: 80, max: 300, step: 10, default: 180, shared: true, group: '대시' },
    { key: 'dashDist', label: '대시 거리 (px)', type: 'int', min: 60, max: 220, default: 130, shared: true },
    { key: 'demo', label: '자동 데모', type: 'bool', default: true, shared: true, group: '장면' },
    { key: 'demoTrig', label: '데모: 대시 거리 (px)', type: 'int', min: 0, max: 120, default: 30, shared: true, help: '탄과 이 거리 안이 되면 자동 데모가 대시를 누름' },
    { key: 'bulletSpeed', label: '탄 속도 (px/s)', type: 'int', min: 120, max: 500, default: 300, shared: true },
    { key: 'restart', label: '처음부터', type: 'button', buttonLabel: '다시 시작' },
  ],
  en: {
    title: 'Dash, Afterimages & Dash I-Frames',
    summary: 'If a dash has no invincibility, dashing toward a bullet just gets you hit. Give the dash invincibility and afterimages. It becomes a dodge that "goes through", and you can see the path too.',
    views: { a: 'Dash only (no i-frames, no afterimages)', b: 'Dash i-frames + afterimages' },
    controls: '←→ / A D to move, Shift / X / C to dash, Space / Z / ↑ / W to jump (pressing a key pauses the auto demo for a moment)',
    info: `
    <p>A <b>dash</b> is a quick move at a fixed speed for a short time. It usually ignores gravity and input for a moment.</p>
    <p><b>Dash i-frames</b> turn off hit detection for some frames during the dash.
    Instead of "going around" bullets and attacks, you can dodge by "going through" them. Dodge rolls and dodge dashes in action games work this way.</p>
    <p><b>Afterimages</b> leave a copy of the character every few frames during the dash and fade it out.
    The move is so fast that the eye can hardly follow it, but afterimages show the path and speed. They also show the invincible state.</p>
    <ul>
      <li>Implementation: a dash timer, an invincibility timer, and an afterimage array are enough.</li>
      <li>Downside: long invincibility lets you dash past any attack, so the tension goes away. Add a cooldown or a use limit with it.</li>
    </ul>
    <p>The bars under the character compare the dash time (gray) and the invincibility time (view color).</p>`,
    look: [
      'The auto demo dashes toward the bullet when it gets close. A gets hit every time (red blink). B passes through the bullet.',
      'Even if you cut B\'s invincibility time to 60ms, the default demo still passes. The bullet arrives right after the dash starts.',
      'Next, raise "Demo: dash distance" to 110. The bullet arrives late in the dash (about 0.1 s later), and B gets hit too. Invincibility is safe only when it covers the whole dash.',
      'Turn on afterimages in A. The same dash shows its distance and direction much more clearly.',
    ],
    refs: [
      'Dash speed, time, and afterimage (trail) handling. Celeste\'s dash is not invincible.',
      'Short invincibility during the dash. The design lets you dash between bullets and enemies.',
      'Only the first part of the dodge roll is invincible. You can be hit in the last part.',
      null,
    ],
    params: {
      iframe: { label: 'Dash invincibility time (ms)', group: 'Technique' },
      ghost: 'Afterimages',
      dashTime: { label: 'Dash time (ms)', group: 'Dash' },
      dashDist: 'Dash distance (px)',
      demo: { label: 'Auto demo', group: 'Scene' },
      demoTrig: { label: 'Demo: dash distance (px)', help: 'The auto demo presses dash when the bullet is within this distance' },
      bulletSpeed: 'Bullet speed (px/s)',
      restart: { label: 'Start over', buttonLabel: 'Restart' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 640, WH = 360, STEP = 1 / 120;
    const GROUND = 290, PW = 18, PH = 26, RUN = 200, GRAV = 2200, JUMP_V = 700, HOME = 180, BR = 7;
    const col = ctx.side === 'a' ? C.a : C.b;
    const KEYS = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], jump: ['Space', 'KeyZ', 'ArrowUp', 'KeyW'], dash: ['ShiftLeft', 'ShiftRight', 'KeyX', 'KeyC'] };
    const ALL = [...KEYS.left, ...KEYS.right, ...KEYS.jump, ...KEYS.dash];

    let p, bullets, ghosts, spawnT, acc, idle, pend, stats, flash, demo, lastDash, msg;
    function init() {
      p = { x: HOME, y: GROUND - PH, vx: 0, vy: 0, grounded: true, face: 1, dashT: 0, dashDir: 1, inv: 0, cool: 0, ghostT: 0 };
      bullets = []; ghosts = []; spawnT = 0.6; acc = 0; idle = 99; pend = { jump: false, dash: false };
      stats = { hit: 0, pass: 0, passInv: 0 }; flash = 0; demo = { prevDash: false }; lastDash = null; msg = '-';
    }
    init();

    function demoInput() {
      // 가장 가까운 탄이 trig 안이면 탄 쪽으로 대시, 아니면 제자리로 걸어 돌아감
      const b = bullets.find((q) => !q.done && q.x + BR > p.x);
      let dash = false;
      if (b && p.dashT <= 0 && p.cool <= 0 && b.x - BR - (p.x + PW) <= P.demoTrig) dash = true;
      const pressed = dash && !demo.prevDash;
      demo.prevDash = dash;
      const far = p.x - HOME;
      return { left: p.dashT <= 0 && far > 4, right: p.dashT <= 0 && far < -4, jumpPressed: false, dashPressed: pressed, dashDir: 1 };
    }

    function step(inp) {
      const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      if (dir) p.face = dir;
      p.cool = Math.max(0, p.cool - STEP);
      p.inv = Math.max(0, p.inv - STEP);
      if (inp.dashPressed && p.dashT <= 0 && p.cool <= 0) {
        p.dashT = P.dashTime / 1000; p.dashDir = inp.dashDir || p.face;
        p.inv = P.iframe / 1000; p.cool = p.dashT + 0.25; p.vy = 0; p.ghostT = 0;
        lastDash = { x0: p.x, x1: p.x };
      }
      if (p.dashT > 0) {
        p.dashT -= STEP;
        p.vx = p.dashDir * (P.dashDist / (P.dashTime / 1000));
        p.vy = 0;
        if (p.dashT <= 0) p.vx = p.dashDir * RUN * 0.6;
        // 잔상
        p.ghostT -= STEP;
        if (p.ghostT <= 0) { ghosts.push({ x: p.x, y: p.y, age: 0 }); p.ghostT = 0.022; }
      } else {
        p.vx = U.approach(p.vx, dir * RUN, (p.grounded ? 2400 : 1600) * STEP);
        if (inp.jumpPressed && p.grounded) { p.vy = -JUMP_V; p.grounded = false; }
        p.vy = Math.min(p.vy + GRAV * STEP, 900);
      }
      p.x = U.clamp(p.x + p.vx * STEP, 10, WW - 10 - PW);
      p.y += p.vy * STEP;
      if (p.y >= GROUND - PH) { p.y = GROUND - PH; p.vy = 0; p.grounded = true; } else p.grounded = false;
      if (lastDash && p.dashT > 0) lastDash.x1 = p.x;
      for (const g of ghosts) g.age += STEP;
      while (ghosts.length && ghosts[0].age > 0.3) ghosts.shift();
      // 탄
      spawnT -= STEP;
      if (spawnT <= 0) { bullets.push({ x: WW + 10, y: GROUND - PH / 2 - 1, done: false, hit: false, invHit: false }); spawnT = 1.15; }
      for (const b of bullets) {
        b.x -= P.bulletSpeed * STEP;
        if (b.done) continue;
        const ov = b.x + BR > p.x && b.x - BR < p.x + PW && b.y + BR > p.y && b.y - BR < p.y + PH;
        if (ov) {
          if (p.inv > 0) { b.invHit = true; }
          else { b.done = true; b.hit = true; stats.hit++; flash = 0.3; msg = GTL.L('✗ 피격', '✗ Hit'); p.vx = -180; }
        }
        if (!b.done && b.x + BR < p.x) {
          b.done = true; stats.pass++;
          if (b.invHit) { stats.passInv++; msg = GTL.L('✓ 무적으로 통과', '✓ Passed while invincible'); } else msg = GTL.L('✓ 회피', '✓ Dodged');
        }
      }
      while (bullets.length && bullets[0].x < -20) bullets.shift();
      flash = Math.max(0, flash - STEP);
    }

    return {
      update(dt) {
        const kb = ctx.input;
        const manual = {
          left: KEYS.left.some(kb.key), right: KEYS.right.some(kb.key),
          jumpPressed: KEYS.jump.some(kb.pressed), dashPressed: KEYS.dash.some(kb.pressed),
        };
        const touched = ALL.some(kb.key) || manual.jumpPressed || manual.dashPressed;
        idle = touched ? 0 : idle + dt;
        const auto = P.demo && idle > 2.5;
        if (!auto) { if (manual.jumpPressed) pend.jump = true; if (manual.dashPressed) pend.dash = true; }
        acc += dt;
        while (acc >= STEP) {
          acc -= STEP;
          let inp;
          if (auto) inp = demoInput();
          else { inp = { ...manual, jumpPressed: pend.jump, dashPressed: pend.dash }; pend.jump = pend.dash = false; }
          step(inp);
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const sc = Math.min(W / WW, H / WH), ox = (W - WW * sc) / 2, oy = (H - WH * sc) / 2;
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        D.grid(g, WW, WH, 40);
        D.rect(g, 0, GROUND, WW, WH - GROUND, '#2a2f38');
        D.rect(g, 0, GROUND, WW, 3, '#4a5260');
        // 마지막 대시 경로
        if (lastDash) {
          D.line(g, lastDash.x0 + PW / 2, GROUND + 10, lastDash.x1 + PW / 2, GROUND + 10, 'rgba(255,255,255,0.3)', 2);
          D.text(g, GTL.L(`대시 ${Math.abs(lastDash.x1 - lastDash.x0).toFixed(0)}px`, `Dash ${Math.abs(lastDash.x1 - lastDash.x0).toFixed(0)}px`), (lastDash.x0 + lastDash.x1) / 2 + PW / 2, GROUND + 14, { size: 10, color: C.dim, align: 'center' });
        }
        // 잔상
        if (P.ghost) for (const q of ghosts) {
          g.globalAlpha = 0.55 * (1 - q.age / 0.3);
          D.rect(g, q.x, q.y, PW, PH, p.inv > 0 || q.age < 0.1 ? '#ffffff' : col);
        }
        g.globalAlpha = 1;
        // 탄
        for (const b of bullets) {
          if (b.hit) continue;
          D.circle(g, b.x, b.y, BR, C.warn, '#fff', 1);
          D.line(g, b.x + BR, b.y, b.x + BR + 18, b.y, 'rgba(255,203,107,0.4)', 2);
        }
        // 플레이어
        const blink = p.inv > 0 && Math.floor(ctx.time * 30) % 2 === 0;
        const body = flash > 0 ? C.bad : col;
        g.globalAlpha = blink ? 0.45 : 1;
        D.rect(g, p.x, p.y, PW, PH, body);
        g.globalAlpha = 1;
        if (p.inv > 0) D.rect(g, p.x - 3, p.y - 3, PW + 6, PH + 6, null, '#fff', 1.5);
        D.rect(g, p.x + (p.face > 0 ? 11 : 3), p.y + 6, 4, 4, '#14161a');
        // 대시 시간 vs 무적 시간 막대
        const bx = 20, by = 320, scl = 0.9;
        D.text(g, GTL.L('대시', 'Dash'), bx, by - 1, { size: 10, color: C.dim });
        D.rect(g, bx + 34, by, P.dashTime * scl, 6, '#6b7385');
        D.text(g, GTL.L('무적', 'I-frames'), bx, by + 11, { size: 10, color: C.dim });
        if (P.iframe > 0) D.rect(g, bx + 34, by + 12, P.iframe * scl, 6, col);
        else D.text(g, GTL.L('없음', 'None'), bx + 34, by + 11, { size: 10, color: C.bad });
        D.text(g, msg, 12, 12, { size: 13, color: msg[0] === '✗' ? C.bad : msg[0] === '✓' ? C.good : C.dim });
        if (P.demo && idle <= 2.5) D.text(g, GTL.L('수동 조작 중', 'Manual control'), WW - 12, 12, { size: 11, color: C.warn, align: 'right' });
        g.restore();
        ctx.stat(GTL.L('피격 / 통과', 'Hit / passed'), `${stats.hit} / ${stats.pass}`);
        ctx.stat(GTL.L('무적으로 통과', 'Passed while invincible'), `${stats.passInv}`);
        ctx.stat(GTL.L('무적 시간', 'Invincibility time'), GTL.L(`${P.iframe | 0} ms (${((P.iframe / 1000) * 60).toFixed(1)} 프레임@60)`, `${P.iframe | 0} ms (${((P.iframe / 1000) * 60).toFixed(1)} frames@60)`));
        ctx.stat(GTL.L('대시 속도', 'Dash speed'), `${(P.dashDist / (P.dashTime / 1000)).toFixed(0)} px/s`);
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
