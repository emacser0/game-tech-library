// 점프 버퍼링: 착지 직전에 누른 점프 입력을 잠깐 기억했다가 착지 순간 실행
GTL.register({
  id: 'jump-buffer',
  title: '점프 버퍼링 (Jump Buffering)',
  summary: '착지 직전에 누른 점프는 공중 입력이라 무시되기 쉬움. 입력을 잠깐 기억했다가 착지 순간 실행하면 연속 점프가 끊기지 않음.',
  views: { a: '버퍼 없음 (0ms)', b: '점프 버퍼 120ms' },
  controls: '←→ / A D 이동, Space / Z / ↑ / W 점프 (키를 누르면 자동 데모가 잠시 멈춤)',
  info: `
    <p><b>점프 버퍼</b>(Jump Buffering): 착지 직전에 누른 점프 입력을 잠깐 기억했다가 착지 순간 실행하는 기법</p>
    <p>왜 필요한가: 가시가 연달아 놓인 바닥에서는 착지하자마자 다시 점프해야 함. 플레이어는 착지 <b>직전</b>에 버튼을 누르기 쉬움.</p>
    <ul>
      <li>"지면에 있을 때만 점프" 규칙이면 공중에서 누른 입력은 버려짐</li>
      <li>착지한 뒤에는 버튼이 이미 눌린 상태라 새 입력 없음</li>
      <li>결과는 "분명히 눌렀는데 점프가 안 된" 억울한 죽음</li>
    </ul>
    <p>동작 원리: 점프를 누르면 타이머(<code>bufferTimer</code>)를 채움. 타이머가 남아 있는 동안 착지하면 점프를 실행.</p>
    <pre>if (jumpPressed) bufferTimer = BUFFER;
else bufferTimer -= dt;
if (grounded && bufferTimer > 0) { vy = -JUMP; bufferTimer = 0; }</pre>
    <p>코요테 타임은 늦은 입력을, 점프 버퍼는 이른 입력을 받아 줌. 둘은 거의 항상 함께 씀.
    단점: 너무 길면(250ms 이상) 의도하지 않은 점프가 튀어나와 조작이 오히려 미끄럽게 느껴짐.</p>`,
  // 도식: 착지 직전의 점프 입력. A는 공중 입력을 버림, B는 버퍼에 담았다가 착지 순간 실행
  diagram: (L) => `<svg viewBox="0 0 540 178" xmlns="http://www.w3.org/2000/svg">
    <rect x="110" y="80" width="420" height="8" class="f-dim"/>
    <path d="M335,80 L345,66 L355,80 M360,80 L370,66 L380,80 M385,80 L395,66 L405,80" class="f-bad"/>
    <path d="M130,20 Q250,24 300,78" class="d-line" stroke-dasharray="4 3"/>
    <path d="M300,78 L350,78" class="d-a"/>
    <text x="410" y="100" class="t-small t-a">${L('A: 가시에 닿음', 'A: hits spikes')}</text>
    <path d="M300,78 Q370,-6 440,78" class="d-b"/>
    <text x="440" y="34" class="t-b">${L('B: 바로 점프', 'B: jumps at once')}</text>
    <line x1="300" y1="14" x2="300" y2="166" class="d-dim" stroke-dasharray="3 3"/>
    <text x="304" y="16" class="t-small t-dim">${L('착지', 'landing')}</text>
    <line x1="240" y1="40" x2="240" y2="166" class="d-accent" stroke-dasharray="4 3"/>
    <text x="234" y="48" text-anchor="end" class="t-small">${L('점프 입력 (공중)', 'jump press (in air)')}</text>
    <text x="4" y="124">${L('A 버퍼 없음', 'A no buffer')}</text>
    <path d="M235,115 L245,125 M245,115 L235,125" class="d-bad"/>
    <text x="252" y="124" class="t-small t-a">${L('버려짐', 'dropped')}</text>
    <text x="4" y="150">${L('B 버퍼 120ms', 'B buffer 120ms')}</text>
    <rect x="240" y="140" width="90" height="12" class="f-b"/>
    <circle cx="300" cy="146" r="3.5" class="f-good"/>
    <text x="336" y="150" class="t-small t-b">${L('착지 순간 실행', 'runs on landing')}</text>
    <text x="4" y="174" class="t-small t-dim">${L('입력 시각부터 버퍼 시간 안에 착지하면 점프가 실행됨', 'If you land within the buffer time after the press, the jump runs')}</text>
  </svg>`,
  look: [
    '자동 데모를 켜 두면 착지 80ms 전에 점프를 누름. A는 입력이 무시되어(✗) 다음 가시에 걸리고, B는 착지 순간 버퍼에서 점프(✓).',
    'B의 점선을 따라가면 "누른 지점 → 실제로 점프한 지점"이 이어짐. 두 지점은 버퍼가 기억한 시간만큼 떨어져 있음.',
    '"데모: 착지 전 입력"을 버퍼보다 크게(예: 180ms) 올리면 B도 실패. 0으로 내리면 A도 성공.',
    'B의 버퍼를 300ms로 키우고 높은 곳에서 떨어지는 중 점프를 누르면 착지 후 원치 않는 점프가 나옴',
  ],
  refs: [
    { type: 'code', title: 'Celeste - Player.cs (점프 입력 버퍼)', url: 'https://github.com/NoelFB/Celeste', year: 2018, note: 'Input.Jump 버튼에 0.08초 버퍼(BufferTime)를 둠' },
    { type: 'article', title: 'Celeste & Forgiveness (Maddy Thorson)', year: 2020, note: '점프 버퍼링, 코요테 타임 등 관대한 입력 처리' },
    { type: 'talk', title: 'Platformer Toolkit (Game Maker\'s Toolkit)', url: 'https://gmtk.itch.io/platformer-toolkit', year: 2022, note: '점프 버퍼, 코요테 타임을 직접 조절해 보는 인터랙티브 도구' },
    { type: 'book', title: 'Game Feel: A Game Designer\'s Guide to Virtual Sensation (Steve Swink)', year: 2008 },
  ],
  params: [
    { key: 'buffer', label: '점프 버퍼 (ms)', type: 'range', min: 0, max: 300, step: 5, a: 0, b: 120, group: '기법' },
    { key: 'showBuffer', label: '버퍼 타이머 표시', type: 'bool', default: true },
    { key: 'demo', label: '자동 데모', type: 'bool', default: true, shared: true, group: '장면' },
    { key: 'demoEarly', label: '데모: 착지 전 입력 (ms)', type: 'range', min: 0, max: 250, step: 5, default: 80, shared: true, help: '자동 데모가 착지보다 얼마나 먼저 점프를 누르는지' },
    { key: 'restart', label: '처음부터', type: 'button', buttonLabel: '다시 시작' },
  ],
  en: {
    title: 'Jump Buffering',
    summary: 'A jump pressed just before landing is an air input, so it is easy to ignore. Remember the input for a moment and run it on landing. Then chained jumps do not break.',
    views: { a: 'No buffer (0ms)', b: 'Jump buffer 120ms' },
    controls: '←→ / A D to move, Space / Z / ↑ / W to jump (pressing a key pauses the auto demo for a moment)',
    info: `
    <p><b>Jump buffering</b> remembers a jump pressed just before landing for a short time. It runs the jump at the moment you land.</p>
    <p>Why you need it: on a floor with spikes in a row, you must jump again right after landing. Players tend to press the button <b>just before</b> they land.</p>
    <ul>
      <li>With a "jump only on the ground" rule, an input pressed in the air is thrown away.</li>
      <li>After landing, the button is already held, so there is no new press.</li>
      <li>The result is an unfair death: "I clearly pressed it, but it did not jump."</li>
    </ul>
    <p>How it works: pressing jump fills a timer (<code>bufferTimer</code>). If you land while time is left, the jump runs.</p>
    <pre>if (jumpPressed) bufferTimer = BUFFER;
else bufferTimer -= dt;
if (grounded && bufferTimer > 0) { vy = -JUMP; bufferTimer = 0; }</pre>
    <p>Coyote time accepts late inputs. The jump buffer accepts early inputs. You almost always use both.
    Downside: if it is too long (250ms or more), unwanted jumps pop out and the controls feel slippery.</p>`,
    look: [
      'With the auto demo on, jump is pressed 80ms before landing. A ignores the input (✗) and hits the next spike. B jumps from the buffer at the moment of landing (✓).',
      'Follow B\'s dotted line. It links "where you pressed" to "where the jump really started". The two points are apart by the time the buffer remembered.',
      'Raise "Demo: input before landing" above the buffer (for example 180ms). B fails too. Lower it to 0 and A also succeeds.',
      'Raise B\'s buffer to 300ms. Press jump while falling from a high place. An unwanted jump comes out after landing.',
    ],
    refs: [
      { title: 'Celeste - Player.cs (jump input buffer)', note: 'The Input.Jump button has a 0.08 s buffer (BufferTime).' },
      'Forgiving input handling, such as jump buffering and coyote time.',
      'An interactive tool where you tune jump buffer and coyote time yourself.',
      null,
    ],
    params: {
      buffer: { label: 'Jump buffer (ms)', group: 'Technique' },
      showBuffer: 'Show buffer timer',
      demo: { label: 'Auto demo', group: 'Scene' },
      demoEarly: { label: 'Demo: input before landing (ms)', help: 'How early the auto demo presses jump before landing' },
      restart: { label: 'Start over', buttonLabel: 'Restart' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 640, WH = 360, STEP = 1 / 120;
    const GRAV = 2200, JUMP_V = 720, RUN = 200, PW = 18, PH = 24, FLOOR = 290;
    const col = ctx.side === 'a' ? C.a : C.b;
    const KEYS = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], jump: ['Space', 'KeyZ', 'ArrowUp', 'KeyW'] };
    const ALL = [...KEYS.left, ...KEYS.right, ...KEYS.jump];

    const solids = [{ x: -40, y: FLOOR, w: 720, h: 100 }, { x: -40, y: 0, w: 40, h: FLOOR }, { x: WW, y: 0, w: 40, h: FLOOR }];
    // 가시: 한 번의 점프 거리마다 하나 → 착지 즉시 다시 뛰어야 함
    const START_JUMP = 40;
    const jumpDist = RUN * (2 * JUMP_V / GRAV);
    const spikes = [];
    for (let k = 0; k < 4; k++) spikes.push({ x: START_JUMP + PW / 2 + jumpDist * (k + 0.5) - 12, w: 24, h: 14 });

    let p, acc, trail, marks, demoState, idle, pendingPress, prevDemoJump, endTimer, stats, lastVerdict;
    function resetEpisode() {
      p = { x: 4, y: FLOOR - PH, vx: 0, vy: 0, grounded: true, buffer: 0, pressAt: null, airT: 0 };
      trail = []; marks = []; endTimer = -1;
      demoState = { pressedThisAir: false, holdT: 0, started: false };
      prevDemoJump = false; pendingPress = false;
    }
    function init() { acc = 0; idle = 99; stats = { ok: 0, fail: 0, buffered: 0, ignored: 0 }; lastVerdict = '-'; resetEpisode(); }
    init();

    const overlap = (a, s) => a.x < s.x + s.w && a.x + PW > s.x && a.y < s.y + s.h && a.y + PH > s.y;

    function demoInput() {
      const early = P.demoEarly / 1000;
      let press = false;
      if (p.vy < 0) demoState.pressedThisAir = false; // 상승 중 = 새 점프 → 다음 착지용 입력 준비
      if (!demoState.started) {
        if (p.grounded && p.x >= START_JUMP) { press = true; demoState.started = true; }
      } else if (p.x > WW - 130) {
        // 마지막 가시 통과 → 더 이상 점프하지 않음
      } else if (!p.grounded) {
        if (p.vy > 0 && !demoState.pressedThisAir) {
          const d = FLOOR - (p.y + PH);
          const tLand = (-p.vy + Math.sqrt(p.vy * p.vy + 2 * GRAV * Math.max(0, d))) / GRAV;
          if (tLand <= early) press = true;
        }
      } else if (!demoState.pressedThisAir && early < STEP) press = true; // 0ms: 착지 프레임에 누름
      if (press) { demoState.holdT = 0.2; demoState.pressedThisAir = true; }
      let jump = false;
      if (demoState.holdT > 0) { demoState.holdT -= STEP; jump = true; }
      const pressed = jump && !prevDemoJump;
      prevDemoJump = jump;
      return { left: false, right: endTimer < 0, jump, jumpPressed: pressed };
    }

    function doJump(how) {
      p.vy = -JUMP_V; p.grounded = false; p.buffer = 0;
      if (how === 'buffer' && p.pressAt) {
        marks.push({ kind: 'exec', x: p.x + PW / 2, y: p.y + PH, fx: p.pressAt.x, fy: p.pressAt.y, ms: p.pressAt.t });
        stats.buffered++;
        lastVerdict = GTL.L(`✓ 버퍼에서 실행 (${(p.pressAt.t * 1000).toFixed(0)}ms 전에 누름)`, `✓ Run from buffer (pressed ${(p.pressAt.t * 1000).toFixed(0)}ms earlier)`);
      } else lastVerdict = GTL.L('✓ 지상 점프', '✓ Ground jump');
      p.pressAt = null;
    }

    function step(inp) {
      const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      p.vx = U.approach(p.vx, dir * RUN, (p.grounded ? 3000 : 2000) * STEP);
      if (inp.jumpPressed) {
        if (p.grounded) doJump('ground');
        else {
          const buf = P.buffer / 1000;
          if (buf > 0) { p.buffer = buf; p.pressAt = { x: p.x + PW / 2, y: p.y + PH, t: 0 }; marks.push({ kind: 'press', x: p.x + PW / 2, y: p.y + PH }); }
          else { marks.push({ kind: 'ignored', x: p.x + PW / 2, y: p.y + PH }); stats.ignored++; lastVerdict = GTL.L('✗ 공중 입력, 무시됨', '✗ Air input, ignored'); }
        }
        if (marks.length > 16) marks.shift();
      } else if (p.buffer > 0) {
        p.buffer -= STEP;
        if (p.buffer <= 0) { stats.ignored++; lastVerdict = GTL.L('✗ 버퍼 만료, 입력 무시됨', '✗ Buffer expired, input ignored'); if (p.pressAt) marks.push({ kind: 'ignored', x: p.pressAt.x, y: p.pressAt.y }); p.pressAt = null; }
      }
      p.vy = Math.min(p.vy + GRAV * STEP, 900);
      p.x += p.vx * STEP;
      for (const s of solids) if (overlap(p, s)) { p.x = p.vx > 0 ? s.x - PW : s.x + s.w; p.vx = 0; }
      p.y += p.vy * STEP;
      p.grounded = false;
      for (const s of solids) if (overlap(p, s)) {
        if (p.vy > 0) { p.y = s.y - PH; p.grounded = true; } else p.y = s.y + s.h;
        p.vy = 0;
      }
      p.airT = p.grounded ? 0 : p.airT + STEP;
      if (p.pressAt) p.pressAt.t += STEP;
      // 착지 순간 버퍼 확인
      if (p.grounded && p.buffer > 0) doJump('buffer');
      trail.push({ x: p.x + PW / 2, y: p.y + PH, g: p.grounded });
      if (trail.length > 500) trail.shift();
      // 가시 충돌 / 종료
      if (endTimer < 0) {
        for (const s of spikes) {
          if (p.x < s.x + s.w - 4 && p.x + PW > s.x + 4 && p.y + PH > FLOOR - s.h + 3) { stats.fail++; endTimer = 0.7; lastVerdict = GTL.L('✗ 가시에 걸림', '✗ Hit a spike'); p.vx = 0; break; }
        }
        if (endTimer < 0 && p.grounded && p.x > WW - 50) { stats.ok++; endTimer = 0.6; }
      } else {
        p.vx = 0;
        endTimer -= STEP;
        if (endTimer <= 0) resetEpisode();
      }
    }

    return {
      update(dt) {
        const kb = ctx.input;
        const manual = { left: KEYS.left.some(kb.key), right: KEYS.right.some(kb.key), jump: KEYS.jump.some(kb.key), jumpPressed: KEYS.jump.some(kb.pressed) };
        const touched = ALL.some(kb.key) || manual.jumpPressed;
        const wasDemo = P.demo && idle > 2.5;
        idle = touched ? 0 : idle + dt;
        const demo = P.demo && idle > 2.5;
        if (demo && !wasDemo) resetEpisode();
        if (!demo && manual.jumpPressed) pendingPress = true;
        acc += dt;
        while (acc >= STEP) {
          acc -= STEP;
          let inp;
          if (demo) inp = demoInput();
          else { inp = { ...manual, jumpPressed: pendingPress }; pendingPress = false; if (endTimer >= 0) inp.left = inp.right = false; }
          step(inp);
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const sc = Math.min(W / WW, H / WH), ox = (W - WW * sc) / 2, oy = (H - WH * sc) / 2;
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        D.grid(g, WW, WH, 40);
        D.rect(g, 0, FLOOR, WW, WH - FLOOR, '#2a2f38');
        D.rect(g, 0, FLOOR, WW, 3, '#4a5260');
        for (const s of spikes) {
          const pts = [];
          for (let i = 0; i < 3; i++) { pts.push({ x: s.x + i * 8, y: FLOOR }); pts.push({ x: s.x + i * 8 + 4, y: FLOOR - s.h }); }
          pts.push({ x: s.x + s.w, y: FLOOR });
          D.poly(g, pts, '#c94a5a', '#ff8090', 1);
        }
        for (let i = 0; i < trail.length; i += 2) D.circle(g, trail[i].x, trail[i].y, 1.5, trail[i].g ? C.good : 'rgba(200,200,200,0.35)');
        for (const m of marks) {
          if (m.kind === 'ignored') {
            D.line(g, m.x - 5, m.y - 5, m.x + 5, m.y + 5, C.bad, 2); D.line(g, m.x + 5, m.y - 5, m.x - 5, m.y + 5, C.bad, 2);
            D.text(g, GTL.L('입력 무시됨', 'Input ignored'), m.x, m.y - 18, { size: 9, color: C.bad, align: 'center' });
          } else if (m.kind === 'press') {
            D.circle(g, m.x, m.y, 4, null, col, 1.5);
          } else if (m.kind === 'exec') {
            g.setLineDash([3, 3]); D.line(g, m.fx, m.fy, m.x, m.y, col, 1.5); g.setLineDash([]);
            D.poly(g, [{ x: m.x - 5, y: m.y - 12 }, { x: m.x + 5, y: m.y - 12 }, { x: m.x, y: m.y - 4 }], C.good);
            D.text(g, GTL.L(`버퍼 ${(m.ms * 1000).toFixed(0)}ms`, `Buffer ${(m.ms * 1000).toFixed(0)}ms`), m.x, m.y - 24, { size: 9, color: col, align: 'center' });
          }
        }
        D.rect(g, p.x, p.y, PW, PH, col);
        D.rect(g, p.x + (p.vx >= 0 ? 11 : 3), p.y + 6, 4, 4, '#14161a');
        if (P.showBuffer && P.buffer > 0) {
          const f = U.clamp(p.buffer / (P.buffer / 1000), 0, 1);
          D.rect(g, p.x - 6, p.y - 10, PW + 12, 4, 'rgba(255,255,255,0.15)');
          D.rect(g, p.x - 6, p.y - 10, (PW + 12) * f, 4, col);
        }
        D.text(g, lastVerdict, 12, 12, { size: 13, color: lastVerdict[0] === '✗' ? C.bad : lastVerdict[0] === '✓' ? C.good : C.dim });
        if (P.demo && idle <= 2.5) D.text(g, GTL.L('수동 조작 중', 'Manual control'), WW - 12, 12, { size: 11, color: C.warn, align: 'right' });
        g.restore();
        ctx.stat(GTL.L('점프 버퍼', 'Jump buffer'), GTL.L(`${P.buffer | 0} ms (${((P.buffer / 1000) * 60).toFixed(1)} 프레임@60)`, `${P.buffer | 0} ms (${((P.buffer / 1000) * 60).toFixed(1)} frames@60)`));
        ctx.stat(GTL.L('완주 / 실패', 'Cleared / failed'), `${stats.ok} / ${stats.fail}`);
        ctx.stat(GTL.L('버퍼 실행 / 무시된 입력', 'Buffered jumps / ignored inputs'), `${stats.buffered} / ${stats.ignored}`);
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
