// 스쿼시 & 스트레치: 속도, 충격에 따라 형태를 늘리고 찌그러뜨리기 (부피 보존 + 감쇠 스프링)
GTL.register({
  id: 'squash-stretch',
  title: '스쿼시 & 스트레치',
  summary: '단단한 박스가 점프하면 그냥 물체로 보임. 도약할 때 늘어나고 착지할 때 찌그러지면 살아 있는 캐릭터가 됨. 요령은 부피를 보존하고 감쇠 스프링으로 되돌리기.',
  views: { a: '변형 없음', b: '스쿼시 & 스트레치' },
  controls: '←→ / A D 이동, Space / Z / ↑ / W 점프 (길게 누르면 높이 뜀), 키를 누르면 자동 데모가 잠시 멈춤',
  info: `
    <p><b>스쿼시 & 스트레치</b>: 디즈니 애니메이션 12원칙의 첫 번째. 물체를 찌그러뜨리고 늘려서 질량감과 탄성을 표현함.
    게임에서는 물리 판정(충돌 박스)은 그대로 두고 <b>그리는 스케일만</b> 바꿈.</p>
    <ul>
      <li><b>도약 스트레치</b>: 점프 순간 세로로 늘림(속도 방향을 강조).</li>
      <li><b>착지 스쿼시</b>: 착지 충격 속도에 비례해 납작하게 만듦.</li>
      <li><b>속도 스트레치</b>: 공중에서 |속도|에 비례해 이동 방향으로 늘림(공은 속도 방향으로 축을 회전).</li>
      <li><b>부피 보존</b>: <code>scaleX = 1 / scaleY</code>. 없으면 단순히 커졌다 작아지는 것처럼 보임.</li>
      <li><b>감쇠 스프링</b>: <code>d'' = -k(d - target) - 2ζ√k × d'</code> 로 원래 모양으로 복원함. ζ(감쇠비)가 작으면 젤리처럼 출렁임.</li>
      <li><b>예비 동작(anticipation)</b>: 점프 전에 웅크리기. 표현력은 좋지만 입력 지연이 생겨서 게임에서는 짧게(0~50ms) 씀.</li>
    </ul>
    <p>피벗은 발밑(하단 중앙). 그래서 찌그러져도 발이 땅에 붙어 있음. 반투명 잔상은 최근 형태.</p>`,
  // 도식: 점프 단계별 그리는 스케일(B)과 고정 박스(A, 충돌 박스). 피벗은 발밑
  diagram: (L) => `<svg viewBox="0 0 540 176" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="5" width="10" height="10" class="f-b"/>
    <text x="18" y="14" class="t-small">${L('B 그리는 스케일', 'B: drawn scale')}</text>
    <rect x="150" y="5" width="10" height="10" class="d-a" stroke-dasharray="3 2"/>
    <text x="164" y="14" class="t-small">${L('점선: A 박스, 두 뷰의 충돌 박스', 'dashed: A box, collision box in both')}</text>
    <line x1="10" y1="120" x2="530" y2="120" class="d-line"/>
    <path d="M60,120 C110,60 220,40 270,64 C320,80 360,100 375,120" class="d-dim" stroke-dasharray="3 3"/>
    <rect x="40" y="80" width="40" height="40" class="d-a" stroke-dasharray="3 2"/>
    <rect x="45" y="66" width="30" height="54" class="f-b"/>
    <rect x="145" y="40" width="40" height="40" class="d-a" stroke-dasharray="3 2"/>
    <rect x="148.5" y="32" width="33" height="48" class="f-b"/>
    <rect x="250" y="24" width="40" height="40" class="d-a" stroke-dasharray="3 2"/>
    <rect x="250" y="24" width="40" height="40" class="f-b"/>
    <rect x="355" y="80" width="40" height="40" class="d-a" stroke-dasharray="3 2"/>
    <rect x="341.5" y="96" width="67" height="24" class="f-b"/>
    <rect x="460" y="80" width="40" height="40" class="d-a" stroke-dasharray="3 2"/>
    <rect x="462" y="76" width="36" height="44" class="f-b"/>
    ${[60, 375, 480].map((x) => `<circle cx="${x}" cy="120" r="3" class="f-accent"/>`).join('')}
    <text x="60" y="134" text-anchor="middle" class="t-small">${L('도약 스트레치', 'takeoff stretch')}</text>
    <text x="165" y="134" text-anchor="middle" class="t-small">${L('속도 스트레치', 'velocity stretch')}</text>
    <text x="270" y="134" text-anchor="middle" class="t-small">${L('정점', 'apex')}</text>
    <text x="375" y="134" text-anchor="middle" class="t-small">${L('착지 스쿼시', 'landing squash')}</text>
    <text x="480" y="134" text-anchor="middle" class="t-small">${L('스프링 복원', 'spring return')}</text>
    <text x="60" y="147" text-anchor="middle" class="t-small t-mono t-dim">sy 1.35</text>
    <text x="165" y="147" text-anchor="middle" class="t-small t-mono t-dim">sy 1.2</text>
    <text x="270" y="147" text-anchor="middle" class="t-small t-mono t-dim">sy 1.0</text>
    <text x="375" y="147" text-anchor="middle" class="t-small t-mono t-dim">sy 0.6</text>
    <text x="480" y="147" text-anchor="middle" class="t-small t-mono t-dim">sy 1.1</text>
    <text x="4" y="170" class="t-small t-dim">${L('부피 보존: sx = 1 / sy. 피벗(주황 점)이 발밑이라 찌그러져도 발이 땅에 붙음', 'Volume kept: sx = 1 / sy. The pivot (dot) is at the feet, so they stay on the ground')}</text>
  </svg>`,
  look: [
    'A와 B의 같은 점프를 비교하면 충돌과 궤적은 완전히 같음. 그런데 B만 무게와 탄성이 느껴짐.',
    '"부피 보존"을 끄면 착지 시 캐릭터가 작아지기만 해서 어색함.',
    '감쇠비(ζ)를 0.1로 낮추면 젤리처럼 출렁임. 1.0이면 출렁임 없이 바로 복원됨.',
    '세기를 2로 키우면 과장된 카툰 느낌이 남. 하단 그래프는 플레이어의 세로 스케일.',
    '"예비 동작"을 120ms로 주면 점프가 눈에 띄게 늦게 나감. 표현력과 반응성 사이의 트레이드오프.',
  ],
  refs: [
    { type: 'book', title: 'The Illusion of Life: Disney Animation (Frank Thomas & Ollie Johnston)', year: 1981, note: '애니메이션 12원칙: Squash and Stretch, Anticipation 등.' },
    { type: 'talk', title: 'Juice it or lose it (Martin Jonasson & Petri Purho)', year: 2012, note: '브레이크아웃 데모에서 스트레치와 트윈 적용.' },
    { type: 'book', title: 'Game Feel: A Game Designer\'s Guide to Virtual Sensation (Steve Swink)', year: 2008 },
  ],
  params: [
    { key: 'enabled', label: '스쿼시 & 스트레치', type: 'bool', a: false, b: true, group: '기법' },
    { key: 'strength', label: '세기', type: 'range', min: 0, max: 2, step: 0.05, default: 1, when: (p) => p.enabled },
    { key: 'volume', label: '부피 보존 (sx = 1/sy)', type: 'bool', default: true, when: (p) => p.enabled },
    { key: 'takeoff', label: '도약 스트레치', type: 'range', min: 0, max: 0.8, step: 0.01, default: 0.35, when: (p) => p.enabled },
    { key: 'land', label: '착지 스쿼시', type: 'range', min: 0, max: 0.7, step: 0.01, default: 0.4, when: (p) => p.enabled },
    { key: 'velStretch', label: '속도 스트레치', type: 'range', min: 0, max: 1, step: 0.01, default: 0.3, when: (p) => p.enabled },
    { key: 'stiff', label: '스프링 강성 k', type: 'range', min: 50, max: 2000, step: 10, default: 600, when: (p) => p.enabled },
    { key: 'zeta', label: '감쇠비 ζ', type: 'range', min: 0.05, max: 1.5, step: 0.01, default: 0.3, when: (p) => p.enabled },
    { key: 'anticip', label: '예비 동작 (ms)', type: 'range', min: 0, max: 200, step: 5, default: 0, help: '점프 전 웅크리기. 입력 지연이 생김' },
    { key: 'ghosts', label: '잔상 표시', type: 'bool', default: true },
    { key: 'demo', label: '자동 데모', type: 'bool', default: true, shared: true, group: '장면' },
    { key: 'restart', label: '처음부터', type: 'button', buttonLabel: '다시 시작' },
  ],
  en: {
    title: 'Squash & Stretch',
    summary: 'A rigid box that jumps looks like a plain object. Stretch it on takeoff and squash it on landing, and it becomes a living character. The trick is to keep the volume and return to shape with a damped spring.',
    views: { a: 'No deformation', b: 'Squash & stretch' },
    controls: '←→ / A D to move, Space / Z / ↑ / W to jump (hold to jump higher). Pressing a key pauses the auto demo for a moment',
    info: `
    <p><b>Squash and stretch</b> is the first of Disney's 12 principles of animation. Squashing and stretching an object shows its mass and elasticity.
    In games you keep the physics (collision box) as it is and change <b>only the drawing scale</b>.</p>
    <ul>
      <li><b>Takeoff stretch</b>: stretch tall at the moment of the jump (stresses the direction of motion).</li>
      <li><b>Landing squash</b>: flatten in proportion to the impact speed on landing.</li>
      <li><b>Velocity stretch</b>: in the air, stretch along the direction of motion in proportion to |speed| (a ball rotates its axis to the velocity).</li>
      <li><b>Volume preservation</b>: <code>scaleX = 1 / scaleY</code>. Without it, the shape just looks like it grows and shrinks.</li>
      <li><b>Damped spring</b>: <code>d'' = -k(d - target) - 2ζ√k × d'</code> brings back the original shape. A small ζ (damping ratio) makes it wobble like jelly.</li>
      <li><b>Anticipation</b>: crouch before the jump. It is expressive, but it adds input delay, so games keep it short (0 to 50ms).</li>
    </ul>
    <p>The pivot is at the feet (bottom center). So the feet stay on the ground even when squashed. The faded copies are recent shapes.</p>`,
    look: [
      'Compare the same jump in A and B. Collision and path are exactly the same. But only B feels like it has weight and bounce.',
      'Turn off "Volume preservation". On landing the character only shrinks, which looks odd.',
      'Lower the damping ratio (ζ) to 0.1 and it wobbles like jelly. At 1.0 it returns at once without wobbling.',
      'Raise the strength to 2 for an exaggerated cartoon feel. The bottom graph shows the player\'s vertical scale.',
      'Set "Anticipation" to 120ms. The jump starts clearly later. This is a tradeoff between expression and responsiveness.',
    ],
    refs: [
      'The 12 principles of animation: Squash and Stretch, Anticipation, and more.',
      'Applies stretch and tweens in a Breakout demo.',
      null,
    ],
    params: {
      enabled: { label: 'Squash & stretch', group: 'Technique' },
      strength: 'Strength',
      volume: 'Volume preservation (sx = 1/sy)',
      takeoff: 'Takeoff stretch',
      land: 'Landing squash',
      velStretch: 'Velocity stretch',
      stiff: 'Spring stiffness k',
      zeta: 'Damping ratio ζ',
      anticip: { label: 'Anticipation (ms)', help: 'Crouch before the jump. Adds input delay' },
      ghosts: 'Show afterimages',
      demo: { label: 'Auto demo', group: 'Scene' },
      restart: { label: 'Start over', buttonLabel: 'Restart' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 640, WH = 360, STEP = 1 / 120, GROUND = 290, GRAV = 2000, JUMP_V = 780, SIZE = 38, BR = 18;
    const col = ctx.side === 'a' ? C.a : C.b;
    const KEYS = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], jump: ['Space', 'KeyZ', 'ArrowUp', 'KeyW'] };
    const ALL = [...KEYS.left, ...KEYS.right, ...KEYS.jump];
    // 데모: [시작 시각, 누르는 시간, 목표 x]
    const SCRIPT = [[0.4, 0.32, 300], [1.5, 0.06, 300], [2.2, 0.32, 120], [3.3, 0.12, 120], [3.9, 0.32, 220]];
    const LOOP = 5;

    let p, ball, acc, idle, demoT, ghosts, gTimer, hist, pending, prevJump, jumps;
    function init() {
      acc = 0; idle = 99; demoT = 0; ghosts = []; gTimer = 0; hist = []; pending = false; prevJump = false; jumps = 0;
      p = { x: 200, y: GROUND, vx: 0, vy: 0, grounded: true, d: 0, dv: 0, crouch: -1, holding: false };
      ball = { x: 470, y: 120, vx: 150, vy: 0, d: 0, dv: 0, axis: Math.PI / 2 };
    }
    init();

    const spring = (o, target, dt) => {
      const k = P.stiff, c = 2 * P.zeta * Math.sqrt(k);
      o.dv += (-k * (o.d - target) - c * o.dv) * dt;
      o.d += o.dv * dt;
    };
    const S = () => P.strength;

    function demoInput() {
      const t0 = demoT % LOOP;
      let jump = false, target = 200;
      for (const [s, hold, tx] of SCRIPT) { if (t0 >= s) target = tx; if (t0 >= s && t0 < s + hold) jump = true; }
      const dir = Math.abs(target - p.x) > 8 ? Math.sign(target - p.x) : 0;
      demoT += STEP;
      const pressed = jump && !prevJump; prevJump = jump;
      return { left: dir < 0, right: dir > 0, jump, jumpPressed: pressed };
    }

    function doJump() {
      p.vy = -JUMP_V; p.grounded = false; p.crouch = -1; jumps++;
      p.d = P.takeoff * S(); p.dv = 0;
    }

    function step(inp) {
      const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      p.vx = U.approach(p.vx, dir * 230, (p.grounded ? 2400 : 1500) * STEP);
      if (inp.jumpPressed && p.grounded && p.crouch < 0) {
        if (P.anticip > 0) p.crouch = P.anticip / 1000; else doJump();
      }
      p.holding = inp.jump;
      if (p.crouch >= 0) { p.crouch -= STEP; if (p.crouch < 0) doJump(); }
      if (!p.grounded && !inp.jump && p.vy < -200) p.vy *= 0.5;   // 가변 점프: 짧게 누르면 낮게
      p.vy += GRAV * STEP;
      p.x = U.clamp(p.x + p.vx * STEP, 30, 390);
      p.y += p.vy * STEP;
      if (p.y >= GROUND) {
        if (!p.grounded) { const impact = U.clamp(p.vy / 900, 0.25, 1.3); p.d = -P.land * S() * impact; p.dv = 0; }
        p.y = GROUND; p.vy = 0; p.grounded = true;
      }
      let target = 0;
      if (p.crouch >= 0) target = -0.22 * S();
      else if (!p.grounded) target = Math.min(0.5, (P.velStretch * S() * Math.abs(p.vy)) / 1000);
      spring(p, target, STEP);
      p.d = U.clamp(p.d, -0.75, 1.2);

      // 공
      ball.vy += GRAV * 0.8 * STEP;
      ball.x += ball.vx * STEP; ball.y += ball.vy * STEP;
      if (ball.x < 430 + BR) { ball.x = 430 + BR; ball.vx = Math.abs(ball.vx); ball.d = -P.land * S() * 0.6; ball.dv = 0; ball.axis = 0; }
      if (ball.x > WW - 12 - BR) { ball.x = WW - 12 - BR; ball.vx = -Math.abs(ball.vx); ball.d = -P.land * S() * 0.6; ball.dv = 0; ball.axis = 0; }
      if (ball.y > GROUND - BR) {
        const impact = U.clamp(ball.vy / 900, 0.25, 1.3);
        ball.y = GROUND - BR; ball.vy = -ball.vy * 0.8;
        if (ball.vy > -420) ball.vy = -860;
        ball.d = -P.land * S() * impact; ball.dv = 0; ball.axis = Math.PI / 2;
      }
      const sp = Math.hypot(ball.vx, ball.vy);
      if (ball.d >= 0) ball.axis = Math.atan2(ball.vy, ball.vx);
      spring(ball, Math.min(0.5, (P.velStretch * S() * sp) / 1000), STEP);
      ball.d = U.clamp(ball.d, -0.75, 1.2);
    }

    const scales = (d) => {
      if (!P.enabled) return { sx: 1, sy: 1 };
      const sy = U.clamp(1 + d, 0.3, 2.2);
      return { sx: P.volume ? 1 / sy : 1, sy };
    };

    return {
      update(dt) {
        const kb = ctx.input;
        const manual = { left: KEYS.left.some(kb.key), right: KEYS.right.some(kb.key), jump: KEYS.jump.some(kb.key) };
        const pr = KEYS.jump.some(kb.pressed);
        const wasDemo = P.demo && idle > 2.5;
        idle = ALL.some(kb.key) || pr ? 0 : idle + dt;
        const demo = P.demo && idle > 2.5;
        if (demo && !wasDemo) { demoT = 0; prevJump = false; }
        if (!demo && pr) pending = true;
        acc += dt;
        while (acc >= STEP) {
          acc -= STEP;
          let inp;
          if (demo) inp = demoInput();
          else { inp = { ...manual, jumpPressed: pending }; pending = false; }
          step(inp);
          if (++gTimer >= 7) {
            gTimer = 0;
            const a = scales(p.d), b = scales(ball.d);
            ghosts.push({ px: p.x, py: p.y, psx: a.sx, psy: a.sy, bx: ball.x, by: ball.y, bsx: b.sx, bsy: b.sy, ax: ball.axis });
            if (ghosts.length > 10) ghosts.shift();
          }
        }
        hist.push(scales(p.d).sy);
        if (hist.length > 180) hist.shift();
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const sc = Math.min(W / WW, H / WH), ox = (W - WW * sc) / 2, oy = (H - WH * sc) / 2;
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        D.grid(g, WW, WH, 40);
        D.rect(g, 0, GROUND, WW, WH - GROUND, '#252a33');
        D.line(g, 0, GROUND, WW, GROUND, '#4a5260', 2);
        D.line(g, 430, 60, 430, GROUND, '#4a5260', 2);
        D.line(g, WW - 12, 60, WW - 12, GROUND, '#4a5260', 2);

        const drawBody = (x, y, sx, sy, fill, stroke, alpha, eyes) => {
          const w = SIZE * sx, h = SIZE * sy;
          g.globalAlpha = alpha;
          D.rect(g, x - w / 2, y - h, w, h, fill, stroke, 2);
          if (eyes) {
            const ey = y - h * 0.68, look = U.clamp(p.vx / 230, -1, 1) * 4;
            D.rect(g, x - w * 0.22 + look - 3, ey - 4 * sy, 6, 8 * sy, '#14161a');
            D.rect(g, x + w * 0.22 + look - 3, ey - 4 * sy, 6, 8 * sy, '#14161a');
          }
          g.globalAlpha = 1;
        };
        const drawBall = (x, y, sx, sy, axis, fill, stroke, alpha) => {
          g.save(); g.globalAlpha = alpha; g.translate(x, y); g.rotate(axis);
          g.scale(sy, sx);  // 축 방향(로컬 x) = 늘어나는 방향
          D.circle(g, 0, 0, BR, fill, stroke, 2 / Math.max(sx, sy));
          D.line(g, -BR, 0, BR, 0, 'rgba(0,0,0,0.25)', 2);
          g.restore(); g.globalAlpha = 1;
        };
        if (P.ghosts) ghosts.forEach((q, i) => {
          const a = 0.06 + (i / ghosts.length) * 0.18;
          drawBody(q.px, q.py, q.psx, q.psy, null, col, a, false);
          drawBall(q.bx, q.by, q.bsx, q.bsy, q.ax, null, col, a);
        });
        // 그림자
        const sh = U.clamp(1 - (GROUND - p.y) / 260, 0.3, 1);
        g.globalAlpha = 0.35; g.beginPath(); g.ellipse(p.x, GROUND + 3, 22 * sh, 4 * sh, 0, 0, U.TAU); g.fillStyle = '#000'; g.fill(); g.globalAlpha = 1;
        const a = scales(p.d), b = scales(ball.d);
        drawBody(p.x, p.y, a.sx, a.sy, col, '#ffffff55', 1, true);
        drawBall(ball.x, ball.y, b.sx, b.sy, ball.axis, C.warn, '#ffffff55', 1);
        // 충돌 박스(변하지 않음)
        D.rect(g, p.x - SIZE / 2, p.y - SIZE, SIZE, SIZE, null, 'rgba(255,255,255,0.18)', 1);
        D.plot(g, hist, 12, 12, 200, 46, { min: 0.4, max: 1.7, color: col, label: GTL.L('세로 스케일 sy (1.0 = 원형)', 'Vertical scale sy (1.0 = original)') });
        D.line(g, 12, 12 + 46 - ((1 - 0.4) / 1.3) * 46, 212, 12 + 46 - ((1 - 0.4) / 1.3) * 46, 'rgba(255,255,255,0.2)', 1);
        if (P.demo && idle <= 2.5) D.text(g, GTL.L('수동 조작 중', 'Manual control'), WW - 12, 12, { size: 11, color: C.warn, align: 'right' });
        g.restore();
        ctx.stat(GTL.L('플레이어 스케일', 'Player scale'), `${a.sx.toFixed(2)} × ${a.sy.toFixed(2)}`);
        ctx.stat(GTL.L('면적 비', 'Area ratio'), (a.sx * a.sy).toFixed(2));
        ctx.stat(GTL.L('점프 수', 'Jumps'), jumps);
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
