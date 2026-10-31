// 가속, 감속 곡선과 공중 제어: 즉시 속도 vs 가속/감속/반전 곡선
GTL.register({
  id: 'accel-curves',
  title: '가속, 감속 곡선 & 공중 제어',
  summary: '입력 즉시 최고 속도, 떼는 즉시 정지하면 정확하지만 무게감 없음. 가속, 감속, 반전 시간을 따로 조절하고 공중 제어를 줄이면 캐릭터에 질량과 관성이 생김.',
  views: { a: '즉시 속도 (Instant)', b: '가속/감속 곡선 + 공중 제어 50%' },
  controls: '←→ / A D 이동, Space / Z / ↑ / W 점프 (키를 누르면 자동 데모가 잠시 멈춤)',
  info: `
    <p>수평 이동의 성격은 현재 속도를 목표 속도(입력 × 최고 속도)로 어떻게 바꾸는지에 따라 정해짐</p>
    <ul>
      <li><b>즉시</b>: <code>vx = dir × max</code>. 반응은 완벽함. 대신 무게가 없어 로봇처럼 딱딱함(초기 Mega Man 계열).</li>
      <li><b>선형 가속/감속</b>: <code>vx = approach(vx, target, rate × dt)</code>. 가속, 감속, <b>반전</b>(입력이 속도와 반대 방향) 비율을 따로 둠.
      반전을 빠르게 하면 관성은 남기면서 방향 전환은 둔하지 않음(Super Mario의 "스키드").</li>
      <li><b>지수 감쇠</b>: <code>vx = damp(vx, target, λ, dt)</code>. 처음엔 빠르게, 끝은 부드럽게 목표에 붙음. 프레임레이트와 무관한 lerp.</li>
      <li><b>공중 제어</b>: 공중에서 가속 비율에 곱하는 배수. 낮을수록 점프 궤적이 "던져진" 느낌이 됨. 1이면 공중에서도 자유롭게 방향을 꺾음.</li>
    </ul>
    <p>아래 그래프는 목표 속도(점선)와 실제 속도(실선). 바닥의 괄호는 <b>정지 거리</b>(입력을 뗀 뒤 멈출 때까지 미끄러진 거리).</p>`,
  // 도식: 같은 입력에 대한 속도 변화. A는 계단, B는 가속, 반전, 감속 기울기
  diagram: (L) => `<svg viewBox="0 0 540 190" xmlns="http://www.w3.org/2000/svg">
    <text x="4" y="25">${L('입력', 'Input')}</text>
    <rect x="110" y="14" width="190" height="16" class="f-dim"/><rect x="300" y="14" width="150" height="16" class="f-dim"/>
    <text x="205" y="26" text-anchor="middle" class="t-small">${L('→ 누름', 'hold →')}</text>
    <text x="375" y="26" text-anchor="middle" class="t-small">${L('← 누름', 'hold ←')}</text>
    <text x="490" y="26" text-anchor="middle" class="t-small t-dim">${L('뗌', 'release')}</text>
    <line x1="110" y1="110" x2="530" y2="110" class="d-dim"/>
    <line x1="110" y1="60" x2="530" y2="60" class="d-dim" stroke-dasharray="2 3"/>
    <line x1="110" y1="160" x2="530" y2="160" class="d-dim" stroke-dasharray="2 3"/>
    <text x="104" y="63" text-anchor="end" class="t-small t-dim">${L('+최고 속도', '+max')}</text>
    <text x="104" y="113" text-anchor="end" class="t-small t-dim">0</text>
    <text x="104" y="163" text-anchor="end" class="t-small t-dim">${L('-최고 속도', '-max')}</text>
    <path d="M110,110 L110,60 L300,60 L300,160 L450,160 L450,110 L530,110" class="d-a"/>
    <path d="M110,110 L150,60 L300,60 L320,110 L360,160 L450,160 L495,110 L530,110" class="d-b"/>
    <text x="134" y="78" class="t-small t-b">${L('가속', 'accel')}</text>
    <text x="318" y="96" class="t-small t-b">${L('반전 (빠름)', 'turn (fast)')}</text>
    <text x="478" y="146" class="t-small t-b">${L('감속', 'decel')}</text>
    <text x="200" y="52" class="t-small t-a">${L('A: 즉시 바뀜', 'A: instant')}</text>
    <text x="4" y="182" class="t-small t-dim">${L('A는 속도가 계단처럼 바뀜. B는 기울기(가속도)가 있어 무게와 관성이 생김', 'A changes speed in steps. B has slopes (acceleration), so it gains weight and inertia')}</text>
  </svg>`,
  look: [
    '두 뷰의 속도 그래프를 비교하면 A는 사각파(목표와 같음), B는 경사진 사다리꼴. B는 바닥의 점 간격이 점점 벌어져 가속이 보임.',
    '정지 거리 괄호를 보면 A는 0px, B는 감속 시간에 비례해 미끄러짐. 감속 시간을 0.4초로 올리면 얼음 위처럼 됨.',
    '데모 후반의 공중 방향 전환을 보면 A는 V자로 꺾이고, B(공중 제어 50%)는 완만하게 휘어짐. 공중 제어를 0으로 하면 전혀 꺾이지 않음.',
    '"반전 가속 배수"를 1로 내리면 방향 전환이 둔해짐(그래프 기울기 같음). 3 이상으로 올리면 미끄러짐 없이 탁 꺾임.',
  ],
  refs: [
    { type: 'book', title: 'Game Feel: A Game Designer\'s Guide to Virtual Sensation (Steve Swink)', year: 2008, note: '입력→반응 곡선(ADSR 엔벨로프)으로 움직임의 느낌을 분석' },
    { type: 'article', title: 'Sonic Physics Guide (Sonic Retro)', url: 'https://info.sonicretro.org/Sonic_Physics_Guide', note: 'acceleration / deceleration / friction / air acceleration 값을 프레임 단위로 정리한 실제 게임 분석' },
    { type: 'talk', title: 'Platformer Toolkit (Game Maker\'s Toolkit)', url: 'https://gmtk.itch.io/platformer-toolkit', year: 2022, note: '가속, 감속, 반전 속도와 공중 제어를 따로 조절' },
    { type: 'code', title: 'Celeste - Player.cs (RunAccel, RunReduce, AirMult)', url: 'https://github.com/NoelFB/Celeste', year: 2018, note: '공중에서는 가속에 AirMult(0.65)를 곱함' },
  ],
  params: [
    { key: 'mode', label: '속도 변화 방식', type: 'select', group: '이동', options: [
      { value: 'instant', label: '즉시 (Instant)' },
      { value: 'linear', label: '선형 가속/감속' },
      { value: 'damp', label: '지수 감쇠 (damp)' },
    ], a: 'instant', b: 'linear' },
    { key: 'accelTime', label: '최고 속도까지 (초)', type: 'range', min: 0.02, max: 0.8, step: 0.01, default: 0.18, when: (p) => p.mode !== 'instant' },
    { key: 'decelTime', label: '정지까지 (초)', type: 'range', min: 0.02, max: 0.8, step: 0.01, default: 0.2, when: (p) => p.mode !== 'instant' },
    { key: 'turnMult', label: '반전 가속 배수', type: 'range', min: 1, max: 4, step: 0.1, default: 2, when: (p) => p.mode === 'linear', help: '입력이 현재 속도 반대 방향일 때 감속 비율에 곱함' },
    { key: 'airControl', label: '공중 제어', type: 'range', min: 0, max: 1, step: 0.05, a: 1, b: 0.5, when: (p) => p.mode !== 'instant', help: '공중에서 가속/감속 비율 배수' },
    { key: 'maxSpeed', label: '최고 속도 (px/s)', type: 'int', min: 100, max: 400, default: 240, shared: true },
    { key: 'showTrail', label: '위치 점 (0.05초 간격)', type: 'bool', default: true },
    { key: 'demo', label: '자동 데모', type: 'bool', default: true, shared: true, group: '장면' },
    { key: 'restart', label: '처음부터', type: 'button', buttonLabel: '다시 시작' },
  ],
  en: {
    title: 'Acceleration Curves & Air Control',
    summary: 'Reaching top speed at once and stopping the moment you let go is precise, but it has no weight. Tune acceleration, deceleration, and turn time on their own, and reduce air control. Then the character gains mass and inertia.',
    views: { a: 'Instant speed', b: 'Accel/decel curves + 50% air control' },
    controls: '←→ / A D to move, Space / Z / ↑ / W to jump (pressing a key pauses the auto demo for a moment)',
    info: `
    <p>The feel of horizontal movement depends on how you change the current speed toward the target speed (input × top speed).</p>
    <ul>
      <li><b>Instant</b>: <code>vx = dir × max</code>. Response is perfect. But there is no weight, so it feels stiff like a robot (early Mega Man style).</li>
      <li><b>Linear accel/decel</b>: <code>vx = approach(vx, target, rate × dt)</code>. Acceleration, deceleration, and <b>turn</b> (input against the current speed) each get their own rate.
      A fast turn keeps inertia but does not make direction changes sluggish (Super Mario's "skid").</li>
      <li><b>Exponential damping</b>: <code>vx = damp(vx, target, λ, dt)</code>. It moves fast at first and settles softly on the target. It is a lerp that does not depend on frame rate.</li>
      <li><b>Air control</b>: a multiplier on the acceleration rate in the air. Lower values make the jump feel "thrown". At 1 you can turn freely in the air too.</li>
    </ul>
    <p>The graph below shows the target speed (dashed) and the real speed (solid). The brackets on the floor show the <b>stopping distance</b> (how far you slide after letting go).</p>`,
    look: [
      'Compare the speed graphs of both views. A is a square wave (same as the target). B is a sloped trapezoid. In B the dots on the floor spread out over time, so you can see the acceleration.',
      'Look at the stopping distance brackets. A is 0px. B slides in proportion to the decel time. Raise the decel time to 0.4 s and it feels like ice.',
      'Watch the air turn late in the demo. A bends in a sharp V. B (50% air control) curves gently. Set air control to 0 and it does not bend at all.',
      'Lower "Turn accel multiplier" to 1. Turns become sluggish (same graph slope). Raise it to 3 or more and it snaps around without sliding.',
    ],
    refs: [
      'Analyzes the feel of movement with input to response curves (ADSR envelope).',
      'A real game analysis with acceleration, deceleration, friction, and air acceleration values per frame.',
      'Tune acceleration, deceleration, turn speed, and air control on their own.',
      'In the air, acceleration is multiplied by AirMult (0.65).',
    ],
    params: {
      mode: { label: 'Speed change mode', group: 'Movement', options: { instant: 'Instant', linear: 'Linear accel/decel', damp: 'Exponential damping (damp)' } },
      accelTime: 'Time to top speed (s)',
      decelTime: 'Time to stop (s)',
      turnMult: { label: 'Turn accel multiplier', help: 'Multiplies the decel rate when input is against the current speed' },
      airControl: { label: 'Air control', help: 'Multiplier on the accel/decel rate in the air' },
      maxSpeed: 'Top speed (px/s)',
      showTrail: 'Position dots (every 0.05 s)',
      demo: { label: 'Auto demo', group: 'Scene' },
      restart: { label: 'Start over', buttonLabel: 'Restart' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 640, WH = 360, STEP = 1 / 120;
    const GRAV = 2000, JUMP_V = 640, PW = 18, PH = 24, FLOOR = 200;
    const col = ctx.side === 'a' ? C.a : C.b;
    const KEYS = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], jump: ['Space', 'KeyZ', 'ArrowUp', 'KeyW'] };
    const ALL = [...KEYS.left, ...KEYS.right, ...KEYS.jump];
    // 데모 스크립트: [시작, 끝, 방향]
    const SCRIPT = [[0, 1.0, 1], [1.6, 2.4, -1], [2.4, 2.8, 1], [3.3, 3.9, -1], [3.9, 4.6, 1]];
    const JUMPS = [[3.5, 3.8]];
    const EPISODE = 5.8;

    let p, acc, demoT, idle, pendingPress, prevDemoJump, vxHist, tgHist, trail, trailT, stops, curStop, reach, histN;
    function resetEpisode() {
      p = { x: 180, y: FLOOR - PH, vx: 0, vy: 0, grounded: true, dir: 0 };
      demoT = 0; prevDemoJump = false; pendingPress = false;
      trail = []; trailT = 0; stops = []; curStop = null; reach = null;
    }
    function init() { acc = 0; idle = 99; vxHist = []; tgHist = []; histN = 0; resetEpisode(); }
    init();

    function demoInput() {
      demoT += STEP;
      let dir = 0;
      for (const [a, b, d] of SCRIPT) if (demoT >= a && demoT < b) dir = d;
      const jump = JUMPS.some(([a, b]) => demoT >= a && demoT < b);
      const pressed = jump && !prevDemoJump;
      prevDemoJump = jump;
      if (demoT > EPISODE) resetEpisode();
      return { left: dir < 0, right: dir > 0, jump, jumpPressed: pressed };
    }

    function step(inp) {
      const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      const max = P.maxSpeed, target = dir * max;
      const air = p.grounded ? 1 : P.airControl;
      const vx0 = p.vx;
      if (P.mode === 'instant') p.vx = target;
      else if (P.mode === 'linear') {
        let rate;
        if (dir === 0) rate = max / P.decelTime;
        else if (Math.sign(p.vx) !== 0 && Math.sign(p.vx) !== dir) rate = (max / P.decelTime) * P.turnMult;
        else rate = max / P.accelTime;
        p.vx = U.approach(p.vx, target, rate * air * STEP);
      } else {
        const lambda = 4.6 / (dir === 0 ? P.decelTime : P.accelTime);
        p.vx = U.damp(p.vx, target, lambda * air, STEP);
        if (Math.abs(p.vx - target) < 0.5) p.vx = target;
      }
      // 최고 속도 도달 시간
      if (dir !== 0 && p.dir === 0 && Math.abs(vx0) < 5) reach = { t: 0, done: false };
      if (reach && !reach.done) { if (Math.abs(p.vx) >= max * 0.98) reach.done = true; else reach.t += STEP; if (dir === 0) reach = null; }
      // 정지 거리
      if (dir === 0 && p.dir !== 0 && p.grounded) curStop = { x0: p.x + PW / 2, v0: Math.abs(p.vx), t: 0 };
      if (curStop) {
        curStop.t += STEP;
        if (dir !== 0 || !p.grounded) curStop = null;
        else if (Math.abs(p.vx) < 1) { curStop.x1 = p.x + PW / 2; stops.push(curStop); if (stops.length > 3) stops.shift(); curStop = null; }
      }
      p.dir = dir;
      if (inp.jumpPressed && p.grounded) { p.vy = -JUMP_V; p.grounded = false; }
      if (!inp.jump && p.vy < 0) p.vy += GRAV * 2 * STEP;
      p.vy = Math.min(p.vy + GRAV * STEP, 900);
      p.x += p.vx * STEP;
      if (p.x < 0) { p.x = 0; p.vx = 0; }
      if (p.x > WW - PW) { p.x = WW - PW; p.vx = 0; }
      p.y += p.vy * STEP;
      p.grounded = false;
      if (p.y + PH >= FLOOR) { p.y = FLOOR - PH; p.vy = 0; p.grounded = true; }
      trailT += STEP;
      if (trailT >= 0.05) { trailT -= 0.05; trail.push({ x: p.x + PW / 2, y: p.y + PH / 2 }); if (trail.length > 40) trail.shift(); }
      if ((histN = (histN + 1) % 2) === 0) {
        vxHist.push(p.vx); tgHist.push(target);
        if (vxHist.length > 360) { vxHist.shift(); tgHist.shift(); }
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
          else { inp = { ...manual, jumpPressed: pendingPress }; pendingPress = false; }
          step(inp);
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const sc = Math.min(W / WW, H / WH), ox = (W - WW * sc) / 2, oy = (H - WH * sc) / 2;
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        D.grid(g, WW, FLOOR, 40);
        D.rect(g, 0, FLOOR, WW, 6, '#4a5260');
        // 정지 거리
        for (const s of stops) {
          const y = FLOOR + 14, x0 = Math.min(s.x0, s.x1), x1 = Math.max(s.x0, s.x1);
          D.line(g, x0, y - 4, x0, y + 4, C.warn, 1.5); D.line(g, x1, y - 4, x1, y + 4, C.warn, 1.5); D.line(g, x0, y, x1, y, C.warn, 1.5);
          D.text(g, GTL.L(`정지 ${Math.abs(s.x1 - s.x0).toFixed(0)}px / ${(s.t * 1000).toFixed(0)}ms`, `Stop ${Math.abs(s.x1 - s.x0).toFixed(0)}px / ${(s.t * 1000).toFixed(0)}ms`), (x0 + x1) / 2, y + 6, { size: 9, color: C.warn, align: 'center' });
        }
        // 위치 점
        if (P.showTrail) trail.forEach((t, i) => D.circle(g, t.x, t.y, 2.2, `rgba(255,255,255,${0.1 + (i / trail.length) * 0.45})`));
        // 플레이어 + 속도 화살표
        D.rect(g, p.x, p.y, PW, PH, col);
        D.rect(g, p.x + (p.vx >= 0 ? 11 : 3), p.y + 6, 4, 4, '#14161a');
        if (Math.abs(p.vx) > 2) D.arrow(g, p.x + PW / 2, p.y - 10, p.x + PW / 2 + p.vx * 0.25, p.y - 10, col, 2, 6);
        // 입력 표시
        const d = p.dir;
        D.text(g, '◀', WW - 52, 12, { size: 16, color: d < 0 ? C.text : 'rgba(255,255,255,0.15)' });
        D.text(g, '▶', WW - 30, 12, { size: 16, color: d > 0 ? C.text : 'rgba(255,255,255,0.15)' });
        if (P.demo && idle <= 2.5) D.text(g, GTL.L('수동 조작 중', 'Manual control'), 12, 12, { size: 11, color: C.warn });
        // 속도 그래프
        const gx = 10, gy = 236, gw = WW - 20, gh = 112, m = P.maxSpeed * 1.15;
        D.plot(g, tgHist, gx, gy, gw, gh, { min: -m, max: m, color: 'rgba(255,255,255,0.35)', lineWidth: 1 });
        D.plot(g, vxHist, gx, gy, gw, gh, { min: -m, max: m, color: col, lineWidth: 2, background: false, label: GTL.L('vx (실선: 실제 속도, 회색: 목표 속도)', 'vx (solid: real speed, gray: target speed)') });
        D.line(g, gx, gy + gh / 2, gx + gw, gy + gh / 2, 'rgba(255,255,255,0.15)', 1);
        g.restore();
        ctx.stat(GTL.L('속도', 'Speed'), `${p.vx.toFixed(0)} px/s`);
        if (reach && reach.done) ctx.stat(GTL.L('최고 속도 도달', 'Time to top speed'), `${(reach.t * 1000).toFixed(0)} ms`);
        const ls = stops[stops.length - 1];
        if (ls) ctx.stat(GTL.L('마지막 정지 거리', 'Last stopping distance'), `${Math.abs(ls.x1 - ls.x0).toFixed(1)} px`);
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
