// 가변 점프 높이 + 상승/하강 중력 비대칭 + 최고점 체공(apex hang)
GTL.register({
  id: 'variable-jump',
  title: '가변 점프 & 중력 비대칭',
  summary: '고정 포물선은 짧은 점프와 긴 점프를 구분하지 못하고 하강도 둥둥 떠 보임. 버튼을 떼면 중력을 키우고, 하강은 더 무겁게, 최고점에서는 잠깐 머무르게 하면 점프가 손에 붙음.',
  views: { a: '고정 포물선', b: '점프 컷 + 하강 2배 + 최고점 체공' },
  controls: '←→ / A D 이동, Space / Z / ↑ / W 점프 (오래 누를수록 높이 뜀), 키를 누르면 자동 데모가 잠시 멈춤',
  info: `
    <p>순수 물리 점프(초기 속도 + 일정 중력)는 대칭 포물선. 높이가 입력과 상관없이 늘 같음.
    그래서 플랫포머는 보통 아래 기법을 덧붙임.</p>
    <ul>
      <li><b>점프 컷 (가변 점프 높이)</b>: 상승 중 버튼을 떼면 낮게 뜀. 방법은 두 가지.
      <i>속도 컷</i>(<code>vy *= 0.5</code>)은 순간적이라 궤적이 꺾임.
      <i>중력 배수</i>(<code>g *= 3</code>)는 부드럽게 일찍 정점에 닿음.</li>
      <li><b>하강 중력 배수</b>: 떨어지는 중(<code>vy &gt; 0</code>)에 중력을 1.5~3배로 키움. 상승은 시원하고, 하강은 빠르고 묵직해짐.
      Kyle Pittman은 높이와 수평 거리로 초기 속도와 중력을 역산하고, 하강 구간에 다른 중력을 쓰는 방법을 정리함.</li>
      <li><b>최고점 체공 (apex hang)</b>: 버튼을 누른 채 <code>|vy|</code>가 임계값보다 작으면 중력을 절반으로 줄임. 정점에서 위치를 미세 조정할 시간이 생김
      (Celeste의 <code>HalfGravThreshold</code>).</li>
      <li><b>최대 낙하 속도</b>: <code>vy</code>에 상한을 둠. 끝없이 빨라지지 않아 착지 지점을 읽을 수 있음.</li>
    </ul>
    <p>궤적 색: 뷰 색은 누른 채 상승, 노랑은 뗀 뒤 상승(컷), 보라는 최고점 체공, 회색은 하강.</p>`,
  // 도식: A의 대칭 포물선 vs B의 비대칭 궤적 (누른 채 점프, 일찍 뗀 점프, 최고점 체공, 무거운 하강)
  diagram: (L) => `<svg viewBox="0 0 540 190" xmlns="http://www.w3.org/2000/svg">
    <line x1="20" y1="160" x2="530" y2="160" class="d-dim"/>
    <path d="M40,160 Q150,-40 260,160" class="d-a"/>
    <text x="150" y="48" text-anchor="middle" class="t-a">${L('A: 대칭, 높이 고정', 'A: symmetric, fixed height')}</text>
    <path d="M290,160 Q320,58 355,58 L385,58 Q405,58 420,160" class="d-b"/>
    <path d="M290,160 Q312,108 328,108 Q340,108 350,160" class="d-b" stroke-dasharray="5 3"/>
    <text x="370" y="24" text-anchor="middle" class="t-b">${L('B: 점프 컷, 하강 2배, 체공', 'B: jump cut, 2x fall, apex hang')}</text>
    <line x1="355" y1="50" x2="385" y2="50" class="d-accent"/>
    <text x="370" y="44" text-anchor="middle" class="t-small">${L('최고점 체공', 'apex hang')}</text>
    <text x="414" y="110" class="t-small">${L('하강 중력 ×2', 'fall gravity x2')}</text>
    <text x="320" y="100" text-anchor="middle" class="t-small">${L('일찍 뗌', 'released')}</text>
    <text x="20" y="178" class="t-small t-dim">${L('실선: 누른 채 점프, 점선: 일찍 뗀 점프. B만 입력에 따라 높이가 달라짐', 'Solid: button held. Dashed: released early. Only B changes height with input')}</text>
  </svg>`,
  look: [
    '자동 데모를 켜 두면 50 / 120 / 220 / 500ms 동안 누르는 점프를 번갈아 함. A는 모든 점프 높이가 같고(최소/최대 높이 비 100%), B는 누른 시간에 따라 높이가 달라짐.',
    'B의 "점프 컷"을 "속도 컷"으로 바꾸면 버튼을 떼는 순간 궤적이 꺾이고 vy 그래프가 계단처럼 뜀. "중력 배수"에서는 곡선이 매끄러움.',
    '하강 중력 배수를 1로 내리면 대칭 포물선이 됨. 3으로 올리면 하강이 확 빨라짐(그래프 오른쪽 기울기).',
    '최고점 체공을 켜고 임계 속도를 200으로 올리면 정점의 보라색 구간이 길어져 캐릭터가 둥실 머무름.',
  ],
  refs: [
    { type: 'talk', title: 'Math for Game Programmers: Building a Better Jump (Kyle Pittman, GDC 2016)', year: 2016, note: '점프 높이/거리에서 v0와 g 역산, 하강 중력 배수, 가변 높이.' },
    { type: 'code', title: 'Celeste - Player.cs (VarJumpTime, HalfGravThreshold, MaxFall)', url: 'https://github.com/NoelFB/Celeste', year: 2018, note: '누르는 동안 상승 속도 유지, 정점 근처 중력 절반, 최대 낙하 속도.' },
    { type: 'talk', title: 'Platformer Toolkit (Game Maker\'s Toolkit)', url: 'https://gmtk.itch.io/platformer-toolkit', year: 2022, note: '점프 컷, 하강 중력 배수 등을 슬라이더로 비교.' },
    { type: 'book', title: 'Game Feel: A Game Designer\'s Guide to Virtual Sensation (Steve Swink)', year: 2008 },
  ],
  params: [
    { key: 'cut', label: '점프 컷 (버튼 해제)', type: 'select', group: '점프', options: [
      { value: 'none', label: '없음 (고정 높이)' },
      { value: 'velocity', label: '속도 컷 (vy × k)' },
      { value: 'gravity', label: '중력 배수' },
    ], a: 'none', b: 'gravity' },
    { key: 'cutVel', label: '속도 컷 배수', type: 'range', min: 0, max: 1, step: 0.05, default: 0.4, when: (p) => p.cut === 'velocity' },
    { key: 'cutGrav', label: '해제 시 중력 배수', type: 'range', min: 1, max: 6, step: 0.1, default: 3, when: (p) => p.cut === 'gravity' },
    { key: 'fallMult', label: '하강 중력 배수', type: 'range', min: 1, max: 4, step: 0.1, a: 1, b: 2 },
    { key: 'apex', label: '최고점 체공', type: 'bool', a: false, b: true },
    { key: 'apexThresh', label: '체공 임계 속도 (px/s)', type: 'range', min: 20, max: 300, step: 5, default: 90, when: (p) => p.apex },
    { key: 'apexMult', label: '체공 중 중력 배수', type: 'range', min: 0.1, max: 1, step: 0.05, default: 0.5, when: (p) => p.apex },
    { key: 'maxFall', label: '최대 낙하 속도 (px/s)', type: 'range', min: 300, max: 1600, step: 10, a: 1600, b: 800 },
    { key: 'demo', label: '자동 데모', type: 'bool', default: true, shared: true, group: '장면' },
    { key: 'restart', label: '처음부터', type: 'button', buttonLabel: '다시 시작' },
  ],
  en: {
    title: 'Variable Jump & Asymmetric Gravity',
    summary: 'A fixed parabola cannot tell a short jump from a long one, and the fall looks floaty. Raise gravity when the button is released, make the fall heavier, and hang briefly at the apex. Then the jump feels tight.',
    views: { a: 'Fixed parabola', b: 'Jump cut + 2x fall + apex hang' },
    controls: '←→ / A D to move, Space / Z / ↑ / W to jump (hold longer to jump higher). Pressing a key pauses the auto demo for a moment',
    info: `
    <p>A pure physics jump (start speed + constant gravity) is a symmetric parabola. Its height is always the same, no matter the input.
    So platformers usually add the techniques below.</p>
    <ul>
      <li><b>Jump cut (variable jump height)</b>: releasing the button while rising gives a lower jump. There are two ways.
      A <i>velocity cut</i> (<code>vy *= 0.5</code>) is instant, so the path bends sharply.
      A <i>gravity multiplier</i> (<code>g *= 3</code>) reaches the peak early but smoothly.</li>
      <li><b>Fall gravity multiplier</b>: while falling (<code>vy &gt; 0</code>), raise gravity 1.5 to 3 times. The rise feels light, and the fall is fast and weighty.
      Kyle Pittman showed how to work out start speed and gravity from height and horizontal distance, with a different gravity for the fall.</li>
      <li><b>Apex hang</b>: while the button is held and <code>|vy|</code> is below a threshold, halve gravity. This gives time to fine tune your position at the peak
      (Celeste's <code>HalfGravThreshold</code>).</li>
      <li><b>Max fall speed</b>: cap <code>vy</code>. The fall does not speed up forever, so you can read where you will land.</li>
    </ul>
    <p>Trail colors: the view color is rising with the button held, yellow is rising after release (cut), purple is apex hang, gray is falling.</p>`,
    look: [
      'With the auto demo on, it alternates jumps held for 50 / 120 / 220 / 500ms. In A every jump has the same height (min/max height ratio 100%). In B the height depends on how long you hold.',
      'Change B\'s "Jump cut" to "Velocity cut". The path bends the moment you release, and the vy graph jumps like a step. With "Gravity multiplier" the curve stays smooth.',
      'Lower the fall gravity multiplier to 1. You get a symmetric parabola. Raise it to 3 and the fall gets much faster (the slope on the right of the graph).',
      'Turn on apex hang and raise the threshold speed to 200. The purple part at the peak gets longer, and the character floats there.',
    ],
    refs: [
      'Working out v0 and g from jump height and distance, fall gravity multiplier, variable height.',
      'Keeps rising speed while held, half gravity near the peak, max fall speed.',
      'Compare jump cut, fall gravity multiplier, and more with sliders.',
      null,
    ],
    params: {
      cut: { label: 'Jump cut (on release)', group: 'Jump', options: { none: 'None (fixed height)', velocity: 'Velocity cut (vy × k)', gravity: 'Gravity multiplier' } },
      cutVel: 'Velocity cut factor',
      cutGrav: 'Gravity multiplier on release',
      fallMult: 'Fall gravity multiplier',
      apex: 'Apex hang',
      apexThresh: 'Hang threshold speed (px/s)',
      apexMult: 'Gravity multiplier during hang',
      maxFall: 'Max fall speed (px/s)',
      demo: { label: 'Auto demo', group: 'Scene' },
      restart: { label: 'Start over', buttonLabel: 'Restart' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 640, WH = 360, STEP = 1 / 120;
    const GRAV = 2000, JUMP_V = 760, RUN = 150, PW = 18, PH = 24, FLOOR = 300;
    const FULL = (JUMP_V * JUMP_V) / (2 * GRAV);
    const col = ctx.side === 'a' ? C.a : C.b;
    const KEYS = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], jump: ['Space', 'KeyZ', 'ArrowUp', 'KeyW'] };
    const ALL = [...KEYS.left, ...KEYS.right, ...KEYS.jump];
    const HOLDS = [0.05, 0.12, 0.22, 0.5];
    const PHASE_COL = { held: col, cut: C.warn, apex: C.accent, fall: 'rgba(200,200,200,0.55)' };

    let p, acc, arcs, cur, demoState, idle, pendingPress, vyHist, lastJump, histN = 0;
    function resetEpisode() {
      p = { x: 20, y: FLOOR - PH, vx: 0, vy: 0, grounded: true, cutDone: false, phase: 'ground' };
      arcs = []; cur = null;
      demoState = { idx: 0, holdT: 0, wait: 0.3, prev: false };
      pendingPress = false;
    }
    function init() { acc = 0; idle = 99; vyHist = []; lastJump = null; resetEpisode(); }
    init();

    function demoInput() {
      let jump = false;
      if (demoState.holdT > 0) { demoState.holdT -= STEP; jump = true; }
      else if (p.grounded) {
        demoState.wait -= STEP;
        if (demoState.wait <= 0) { demoState.holdT = HOLDS[demoState.idx % HOLDS.length]; demoState.idx++; demoState.wait = 0.3; jump = true; }
      }
      const pressed = jump && !demoState.prev;
      demoState.prev = jump;
      return { left: false, right: true, jump, jumpPressed: pressed };
    }

    function step(inp) {
      const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      p.vx = U.approach(p.vx, dir * RUN, 2500 * STEP);
      if (inp.jumpPressed && p.grounded) {
        p.vy = -JUMP_V; p.grounded = false; p.cutDone = false;
        cur = { pts: [], apexY: p.y + PH, apexX: p.x, hold: 0, held: true, air: 0 };
        arcs.push(cur);
        if (arcs.length > 8) arcs.shift();
      }
      if (cur && cur.held) { if (inp.jump && p.vy < 0) cur.hold += STEP; else cur.held = false; }
      // 중력 계산
      let g = GRAV, phase = 'fall';
      if (!p.grounded) {
        if (p.vy < 0) {
          phase = inp.jump ? 'held' : 'cut';
          if (!inp.jump) {
            if (P.cut === 'gravity') g *= P.cutGrav;
            else if (P.cut === 'velocity' && !p.cutDone) { p.vy *= P.cutVel; p.cutDone = true; }
          }
        } else g *= P.fallMult;
        if (P.apex && inp.jump && Math.abs(p.vy) < P.apexThresh) { g = GRAV * P.apexMult; phase = 'apex'; }
      }
      p.vy = Math.min(p.vy + g * STEP, P.maxFall);
      p.x += p.vx * STEP;
      if (p.x < 0) { p.x = 0; p.vx = 0; }
      p.y += p.vy * STEP;
      p.grounded = false;
      if (p.y + PH >= FLOOR) {
        p.y = FLOOR - PH; p.vy = 0; p.grounded = true;
        if (cur) { lastJump = { h: FLOOR - cur.apexY, hold: cur.hold, air: cur.air }; cur = null; }
      }
      p.phase = p.grounded ? 'ground' : phase;
      if (cur) {
        cur.air += STEP;
        cur.pts.push({ x: p.x + PW / 2, y: p.y + PH, ph: phase });
        if (p.y + PH < cur.apexY) { cur.apexY = p.y + PH; cur.apexX = p.x + PW / 2; }
      }
      if ((histN = (histN + 1) % 2) === 0) { vyHist.push(p.grounded ? 0 : p.vy); if (vyHist.length > 300) vyHist.shift(); }
      if (p.x > WW - 30 && p.grounded) resetEpisode();
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
          else { inp = { ...manual, jumpPressed: pendingPress }; pendingPress = false; }
          step(inp);
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const sc = Math.min(W / WW, H / WH), ox = (W - WW * sc) / 2, oy = (H - WH * sc) / 2;
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        D.grid(g, WW, WH, 40);
        // 기준 높이: 최대 점프(고정 포물선)
        const fy = FLOOR - FULL;
        g.setLineDash([6, 6]); D.line(g, 0, fy, WW, fy, C.good, 1); g.setLineDash([]);
        D.text(g, GTL.L(`물리 최대 높이 ${FULL.toFixed(0)}px`, `Physics max height ${FULL.toFixed(0)}px`), 8, fy - 14, { size: 10, color: C.good });
        D.rect(g, 0, FLOOR, WW, WH - FLOOR, '#2a2f38');
        D.rect(g, 0, FLOOR, WW, 3, '#4a5260');
        // 궤적 (위상별 색)
        for (const a of arcs) {
          for (let i = 1; i < a.pts.length; i++) {
            const q0 = a.pts[i - 1], q1 = a.pts[i];
            D.line(g, q0.x, q0.y, q1.x, q1.y, PHASE_COL[q1.ph], 2);
          }
          if (a !== cur || p.vy > 0) {
            D.line(g, a.apexX - 14, a.apexY, a.apexX + 14, a.apexY, C.text, 2);
            D.text(g, `${(FLOOR - a.apexY).toFixed(0)}px`, a.apexX, a.apexY - 26, { size: 10, align: 'center', color: C.text });
            D.text(g, `${(a.hold * 1000).toFixed(0)}ms`, a.apexX, a.apexY - 14, { size: 9, align: 'center', color: C.dim });
          }
        }
        // 플레이어
        D.rect(g, p.x, p.y, PW, PH, col);
        D.rect(g, p.x + (p.vx >= 0 ? 11 : 3), p.y + 6, 4, 4, '#14161a');
        // vy 그래프
        const gx = 360, gy = 14, gw = 268, gh = 80, lo = -JUMP_V, hi = 1600;
        D.plot(g, vyHist, gx, gy, gw, gh, { min: lo, max: hi, color: col, label: GTL.L('vy (아래 +)', 'vy (down +)') });
        const zy = gy + gh - ((0 - lo) / (hi - lo)) * gh;
        D.line(g, gx, zy, gx + gw, zy, 'rgba(255,255,255,0.25)', 1);
        const my = gy + gh - ((P.maxFall - lo) / (hi - lo)) * gh;
        g.setLineDash([3, 3]); D.line(g, gx, my, gx + gw, my, C.bad, 1); g.setLineDash([]);
        D.text(g, GTL.L('최대 낙하', 'Max fall'), gx + gw - 4, my + 2, { size: 9, color: C.bad, align: 'right' });
        // 범례
        let lx = 12;
        for (const [k, name] of [['held', GTL.L('누른 채 상승', 'Rising (held)')], ['cut', GTL.L('뗀 뒤 상승', 'Rising (released)')], ['apex', GTL.L('최고점 체공', 'Apex hang')], ['fall', GTL.L('하강', 'Falling')]]) {
          D.rect(g, lx, 16, 10, 4, PHASE_COL[k]); D.text(g, name, lx + 14, 12, { size: 10, color: C.dim }); lx += 84;
        }
        if (P.demo && idle <= 2.5) D.text(g, GTL.L('수동 조작 중', 'Manual control'), 12, 30, { size: 11, color: C.warn });
        g.restore();
        const done = arcs.filter((a) => a !== cur).map((a) => FLOOR - a.apexY);
        if (lastJump) {
          ctx.stat(GTL.L('마지막 점프', 'Last jump'), GTL.L(`높이 ${lastJump.h.toFixed(0)}px, 누름 ${(lastJump.hold * 1000).toFixed(0)}ms, 체공 ${(lastJump.air * 1000).toFixed(0)}ms`, `Height ${lastJump.h.toFixed(0)}px, held ${(lastJump.hold * 1000).toFixed(0)}ms, airtime ${(lastJump.air * 1000).toFixed(0)}ms`));
        }
        if (done.length > 1) ctx.stat(GTL.L('최소/최대 높이 비', 'Min/max height ratio'), `${((Math.min(...done) / Math.max(...done)) * 100).toFixed(0)} %`);
        ctx.stat(GTL.L('현재 위상', 'Current phase'), { ground: GTL.L('지상', 'Ground'), held: GTL.L('상승(누름)', 'Rising (held)'), cut: GTL.L('상승(컷)', 'Rising (cut)'), apex: GTL.L('최고점 체공', 'Apex hang'), fall: GTL.L('하강', 'Falling') }[p.phase]);
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
