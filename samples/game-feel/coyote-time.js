// 코요테 타임: 발판을 벗어난 직후 잠깐 동안 점프를 허용하는 유예 시간
GTL.register({
  id: 'coyote-time',
  title: '코요테 타임 (Coyote Time)',
  summary: '플레이어가 점프를 누를 때 캐릭터는 이미 몇 프레임 전에 발판을 벗어난 경우가 많음. 짧은 유예 시간을 주면 억울한 추락이 사라짐.',
  views: { a: '유예 없음 (0ms)', b: '코요테 타임 100ms' },
  controls: '←→ / A D 이동, Space / Z / ↑ / W 점프 (키를 누르면 자동 데모가 잠시 멈춤)',
  info: `
    <p><b>코요테 타임</b>: 발판을 벗어난 뒤에도 잠깐 동안 지상 점프를 허용하는 유예 시간.
    이름은 절벽 밖에서 잠시 멈춰 있다 떨어지는 만화 캐릭터 와일 E. 코요테에서 유래.</p>
    <p>왜 필요한가: 사람의 반응 지연, 입력 지연, 렌더링 지연 때문에 플레이어는 가장자리를 <b>지나친 뒤</b>에 점프를 누르는 일이 잦음.
    "지면에 닿아 있을 때만 점프"를 엄격하게 적용하면 이 입력이 무시되고 캐릭터가 구덩이로 떨어짐.</p>
    <p>동작 원리: 지면을 떠나면 타이머(<code>coyoteTimer</code>)가 줄어듦. 타이머가 남아 있는 동안은 지상 점프를 허용함.
    점프하면 타이머를 0으로 만들어 이중 점프를 막음.</p>
    <pre>if (grounded) coyoteTimer = COYOTE;
else coyoteTimer -= dt;
if (jumpPressed && coyoteTimer > 0) { vy = -JUMP; coyoteTimer = 0; }</pre>
    <p>Celeste는 0.1초(<code>JumpGraceTime</code>)를 씀.
    단점: 너무 길면 공중에서 한 번 더 점프하는 이중 점프처럼 느껴짐.
    가장자리 너머의 색 띠는 유예 시간 동안 이동하는 거리(속도 × 유예)를 나타냄.</p>`,
  // 도식: 가장자리를 지난 뒤의 점프 입력. A는 지면에서만 허용, B는 유예 구간까지 허용
  diagram: (L) => `<svg viewBox="0 0 540 180" xmlns="http://www.w3.org/2000/svg">
    <rect x="110" y="60" width="150" height="12" class="f-dim"/><rect x="440" y="60" width="90" height="12" class="f-dim"/>
    <text x="256" y="54" text-anchor="end" class="t-small t-dim">${L('가장자리', 'edge')}</text>
    <line x1="260" y1="40" x2="260" y2="150" class="d-dim" stroke-dasharray="3 3"/>
    <path d="M260,62 Q300,66 330,96" class="d-a" stroke-dasharray="5 3"/>
    <text x="336" y="98" class="t-a">${L('A: 추락', 'A: falls')}</text>
    <path d="M290,62 Q365,-2 440,58" class="d-b"/>
    <text x="365" y="22" text-anchor="middle" class="t-b">${L('B: 점프 성공', 'B: jumps')}</text>
    <line x1="290" y1="40" x2="290" y2="150" class="d-accent" stroke-dasharray="4 3"/>
    <text x="296" y="48" class="t-small">${L('점프 입력', 'jump press')}</text>
    <text x="4" y="120">${L('A 점프 허용', 'A jump OK')}</text>
    <rect x="110" y="110" width="150" height="12" class="f-good"/>
    <path d="M285,111 L295,121 M295,111 L285,121" class="d-bad"/>
    <text x="4" y="142">${L('B 점프 허용', 'B jump OK')}</text>
    <rect x="110" y="132" width="150" height="12" class="f-good"/><rect x="260" y="132" width="50" height="12" class="f-b"/>
    <text x="316" y="142" class="t-small t-b">${L('코요테 100ms', 'coyote 100ms')}</text>
    <circle cx="290" cy="138" r="3.5" class="f-good"/>
    <text x="4" y="172" class="t-small t-dim">${L('가장자리를 지나고 70ms 뒤의 입력. A는 무시함, B는 유예 구간 안이라 점프함', 'Jump pressed 70 ms after the edge. A ignores it. B is inside the grace window, so it jumps')}</text>
  </svg>`,
  look: [
    '자동 데모를 켜 두면 가장자리를 벗어난 뒤 70ms 늦게 점프를 누름. A는 매번 추락하고(✗), B는 정상적으로 점프함(✓).',
    '"데모: 점프 지연"을 코요테 타임보다 크게(예: 150ms) 올리면 B도 떨어짐. 유예 띠 밖에서 눌렀기 때문.',
    'B의 코요테 타임을 250ms 이상으로 키우면 눈에 띄게 떨어지는 중에도 점프가 되어 부자연스러움.',
    '궤적 색을 보면 상태가 구분됨. 초록은 지상, 뷰 색은 코요테 유예 중(점프 가능), 회색은 공중(점프 불가).',
  ],
  refs: [
    { type: 'code', title: 'Celeste - Player.cs (JumpGraceTime = 0.1f)', url: 'https://github.com/NoelFB/Celeste', year: 2018, note: 'Maddy Thorson, Noel Berry. jumpGraceTimer로 코요테 타임 구현.' },
    { type: 'article', title: 'Celeste & Forgiveness (Maddy Thorson)', year: 2020, note: '코요테 타임, 점프 버퍼, 코너 보정 등 Celeste의 "관대한" 조작 기법 정리.' },
    { type: 'book', title: 'Game Feel: A Game Designer\'s Guide to Virtual Sensation (Steve Swink)', year: 2008 },
    { type: 'talk', title: 'Why Does Celeste Feel So Good to Play? (Game Maker\'s Toolkit)', year: 2019, note: 'Mark Brown의 영상 분석.' },
  ],
  params: [
    { key: 'coyote', label: '코요테 타임 (ms)', type: 'range', min: 0, max: 300, step: 5, a: 0, b: 100, group: '기법' },
    { key: 'showWindow', label: '유예 구간 표시', type: 'bool', default: true },
    { key: 'demo', label: '자동 데모', type: 'bool', default: true, shared: true, group: '장면' },
    { key: 'demoLate', label: '데모: 점프 지연 (ms)', type: 'range', min: 0, max: 200, step: 5, default: 70, shared: true, help: '자동 데모가 가장자리를 벗어난 뒤 점프를 누르기까지 걸리는 시간' },
    { key: 'runSpeed', label: '이동 속도 (px/s)', type: 'int', min: 120, max: 320, default: 220, shared: true },
    { key: 'restart', label: '처음부터', type: 'button', buttonLabel: '다시 시작' },
  ],
  en: {
    title: 'Coyote Time',
    summary: 'When the player presses jump, the character has often left the ledge a few frames earlier. A short grace period removes these unfair falls.',
    views: { a: 'No grace (0ms)', b: 'Coyote time 100ms' },
    controls: '←→ / A D to move, Space / Z / ↑ / W to jump (pressing a key pauses the auto demo for a moment)',
    info: `
    <p><b>Coyote time</b> is a grace period. It still allows a ground jump for a short time after you leave a ledge.
    The name comes from Wile E. Coyote, the cartoon character who hangs in the air past a cliff before he falls.</p>
    <p>Why you need it: human reaction time, input lag, and render lag mean players often press jump <b>after</b> they pass the edge.
    If you strictly allow "jump only while touching the ground", this input is ignored and the character falls into the pit.</p>
    <p>How it works: when you leave the ground, a timer (<code>coyoteTimer</code>) counts down. While time is left, a ground jump is allowed.
    A jump sets the timer to 0, so you cannot double jump.</p>
    <pre>if (grounded) coyoteTimer = COYOTE;
else coyoteTimer -= dt;
if (jumpPressed && coyoteTimer > 0) { vy = -JUMP; coyoteTimer = 0; }</pre>
    <p>Celeste uses 0.1 s (<code>JumpGraceTime</code>).
    Downside: if it is too long, it feels like a double jump in the air.
    The colored band past each edge shows the distance you travel during the grace period (speed × grace).</p>`,
    look: [
      'With the auto demo on, jump is pressed 70ms after leaving the edge. A falls every time (✗). B jumps normally (✓).',
      'Raise "Demo: jump delay" above the coyote time (for example 150ms). B falls too, because the press is outside the grace band.',
      'Raise B\'s coyote time to 250ms or more. You can jump even while clearly falling, which looks unnatural.',
      'The trail color shows the state. Green is ground, the view color is coyote grace (can jump), gray is air (cannot jump).',
    ],
    refs: ['Maddy Thorson, Noel Berry. jumpGraceTimer implements coyote time.', 'A summary of Celeste\'s "forgiving" controls: coyote time, jump buffer, corner correction, and more.', null, 'Video analysis by Mark Brown.'],
    params: {
      coyote: { label: 'Coyote time (ms)', group: 'Technique' },
      showWindow: 'Show grace window',
      demo: { label: 'Auto demo', group: 'Scene' },
      demoLate: { label: 'Demo: jump delay (ms)', help: 'Time from leaving the edge until the auto demo presses jump' },
      runSpeed: 'Run speed (px/s)',
      restart: { label: 'Start over', buttonLabel: 'Restart' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 640, WH = 360, STEP = 1 / 120;
    const GRAV = 2200, JUMP_V = 720, PW = 18, PH = 24;
    const col = ctx.side === 'a' ? C.a : C.b;
    const KEYS = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], jump: ['Space', 'KeyZ', 'ArrowUp', 'KeyW'] };
    const ALL = [...KEYS.left, ...KEYS.right, ...KEYS.jump];

    const solids = [
      { x: -40, y: 280, w: 220, h: 100 },
      { x: 290, y: 258, w: 140, h: 120 },
      { x: 540, y: 280, w: 140, h: 100 },
    ];
    const edges = [180, 430]; // 구덩이 직전 가장자리

    let p, acc, trail, marks, demoState, idle, pendingPress, prevDemoJump, endTimer, stats, lastVerdict;
    function resetEpisode() {
      p = { x: 40, y: 280 - PH, vx: 0, vy: 0, grounded: true, coyote: 0, jumped: false, airT: 0 };
      trail = []; marks = []; endTimer = -1;
      demoState = { edge: 0, holdT: 0 };
      prevDemoJump = false; pendingPress = false;
    }
    function init() { acc = 0; idle = 99; stats = { ok: 0, fall: 0 }; lastVerdict = '-'; resetEpisode(); }
    init();

    const overlap = (a, s) => a.x < s.x + s.w && a.x + PW > s.x && a.y < s.y + s.h && a.y + PH > s.y;

    function demoInput() {
      const late = P.demoLate / 1000;
      let jump = false;
      const e = edges[demoState.edge];
      if (e !== undefined && p.x > e - 2 + late * Math.max(1, Math.abs(p.vx))) { demoState.edge++; demoState.holdT = 0.28; }
      if (demoState.holdT > 0) { demoState.holdT -= STEP; jump = true; }
      const pressed = jump && !prevDemoJump;
      prevDemoJump = jump;
      return { left: false, right: endTimer < 0, jump, jumpPressed: pressed };
    }

    function step(inp) {
      const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      const accel = p.grounded ? 3000 : 2000;
      p.vx = U.approach(p.vx, dir * P.runSpeed, accel * STEP);
      // 코요테 타이머
      if (p.grounded) { p.coyote = P.coyote / 1000; p.jumped = false; p.airT = 0; }
      else { p.coyote -= STEP; p.airT += STEP; }
      if (inp.jumpPressed) {
        const can = p.grounded || (p.coyote > 0 && !p.jumped);
        marks.push({ x: p.x + PW / 2, y: p.y, ok: can, air: p.grounded ? 0 : p.airT });
        if (marks.length > 12) marks.shift();
        if (can) {
          p.vy = -JUMP_V; p.grounded = false; p.coyote = 0; p.jumped = true;
          lastVerdict = p.airT > 0 ? GTL.L(`✓ 공중 ${(p.airT * 1000).toFixed(0)}ms 후 점프 허용`, `✓ Jump allowed after ${(p.airT * 1000).toFixed(0)}ms in the air`) : GTL.L('✓ 지상 점프', '✓ Ground jump');
        } else lastVerdict = GTL.L(`✗ 공중 ${(p.airT * 1000).toFixed(0)}ms, 입력 무시`, `✗ ${(p.airT * 1000).toFixed(0)}ms in the air, input ignored`);
      }
      p.vy = Math.min(p.vy + GRAV * STEP, 900);
      // X 이동
      p.x += p.vx * STEP;
      for (const s of solids) if (overlap(p, s)) { p.x = p.vx > 0 ? s.x - PW : s.x + s.w; p.vx = 0; }
      // Y 이동
      p.y += p.vy * STEP;
      p.grounded = false;
      for (const s of solids) if (overlap(p, s)) {
        if (p.vy > 0) { p.y = s.y - PH; p.grounded = true; } else p.y = s.y + s.h;
        p.vy = 0;
      }
      if (p.x < 0) { p.x = 0; p.vx = 0; }
      const state = p.grounded ? 'ground' : p.coyote > 0 && !p.jumped ? 'coyote' : 'air';
      trail.push({ x: p.x + PW / 2, y: p.y + PH, s: state });
      if (trail.length > 400) trail.shift();
      // 에피소드 종료 판정
      if (endTimer < 0) {
        if (p.y > WH + 30) { stats.fall++; endTimer = 0.5; }
        else if (p.grounded && p.x > 580) { stats.ok++; endTimer = 0.6; }
      } else {
        endTimer -= STEP;
        if (endTimer <= 0) resetEpisode();
      }
    }

    return {
      update(dt) {
        const kb = ctx.input;
        const manual = {
          left: KEYS.left.some(kb.key), right: KEYS.right.some(kb.key),
          jump: KEYS.jump.some(kb.key), jumpPressed: KEYS.jump.some(kb.pressed),
        };
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
          else { inp = { ...manual, jumpPressed: pendingPress }; pendingPress = false; }
          step(inp);
        }
        if (!demo && p.y > WH + 30 && endTimer < 0) resetEpisode();
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const sc = Math.min(W / WW, H / WH), ox = (W - WW * sc) / 2, oy = (H - WH * sc) / 2;
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        D.grid(g, WW, WH, 40);
        for (const s of solids) {
          D.rect(g, s.x, s.y, s.w, s.h, '#2a2f38');
          D.rect(g, s.x, s.y, s.w, 3, '#4a5260');
        }
        // 유예 구간
        if (P.showWindow) {
          for (const e of edges) {
            const s = solids.find((q) => Math.abs(q.x + q.w - e) < 1);
            const len = (P.coyote / 1000) * P.runSpeed;
            g.setLineDash([4, 4]); D.line(g, e, s.y - 40, e, s.y + 30, C.dim, 1); g.setLineDash([]);
            if (len > 0) {
              g.globalAlpha = 0.35; D.rect(g, e, s.y - 2, len, 6, col); g.globalAlpha = 1;
              D.rect(g, e, s.y - 2, len, 6, null, col, 1);
            }
            D.text(g, GTL.L(`유예 ${P.coyote | 0}ms`, `Grace ${P.coyote | 0}ms`), e + 3, s.y + 8, { size: 10, color: len > 0 ? col : C.dim });
          }
        }
        // 궤적
        for (let i = 0; i < trail.length; i += 2) {
          const t = trail[i];
          D.circle(g, t.x, t.y, 1.6, t.s === 'ground' ? C.good : t.s === 'coyote' ? col : 'rgba(200,200,200,0.35)');
        }
        // 점프 입력 지점
        for (const m of marks) {
          if (m.ok) D.poly(g, [{ x: m.x - 5, y: m.y - 14 }, { x: m.x + 5, y: m.y - 14 }, { x: m.x, y: m.y - 6 }], C.good);
          else { D.line(g, m.x - 5, m.y - 15, m.x + 5, m.y - 5, C.bad, 2); D.line(g, m.x + 5, m.y - 15, m.x - 5, m.y - 5, C.bad, 2); }
        }
        // 플레이어
        D.rect(g, p.x, p.y, PW, PH, col);
        D.rect(g, p.x + (p.vx >= 0 ? 11 : 3), p.y + 6, 4, 4, '#14161a');
        // 코요테 타이머 바
        if (!p.grounded && P.coyote > 0) {
          const f = U.clamp(p.coyote / (P.coyote / 1000), 0, 1);
          D.rect(g, p.x - 6, p.y - 10, PW + 12, 4, 'rgba(255,255,255,0.15)');
          if (!p.jumped) D.rect(g, p.x - 6, p.y - 10, (PW + 12) * f, 4, col);
        }
        D.text(g, lastVerdict, 12, 12, { size: 13, color: lastVerdict[0] === '✗' ? C.bad : lastVerdict[0] === '✓' ? C.good : C.dim });
        if (P.demo && idle <= 2.5) D.text(g, GTL.L('수동 조작 중', 'Manual control'), WW - 12, 12, { size: 11, color: C.warn, align: 'right' });
        g.restore();
        ctx.stat(GTL.L('코요테 타임', 'Coyote time'), GTL.L(`${P.coyote | 0} ms (${((P.coyote / 1000) * 60).toFixed(1)} 프레임@60)`, `${P.coyote | 0} ms (${((P.coyote / 1000) * 60).toFixed(1)} frames@60)`));
        ctx.stat(GTL.L('완주 / 추락', 'Cleared / fell'), `${stats.ok} / ${stats.fall}`);
        ctx.stat(GTL.L('상태', 'State'), p.grounded ? GTL.L('지상', 'Ground') : p.coyote > 0 && !p.jumped ? GTL.L('코요테 유예', 'Coyote grace') : GTL.L('공중', 'Air'));
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
