// 카메라 추적: 하드 락 / 지수 보간 / SmoothDamp / 데드존 / 룩어헤드 / 플랫폼 스냅
GTL.register({
  id: 'camera-follow',
  title: '카메라 추적 방식',
  summary: '카메라를 플레이어에 그대로 붙이면 점프할 때마다 화면이 출렁이고 앞이 잘 보이지 않음. 데드존, 룩어헤드, 플랫폼 스냅, 감쇠를 조합해 보여야 할 곳을 보여 줌.',
  views: { a: '하드 락', b: '데드존 + 룩어헤드 + 플랫폼 스냅' },
  controls: '←→ / A D 이동, Space / Z / ↑ / W 점프 (키를 누르면 자동 데모가 잠시 멈춤)',
  info: `
    <p><b>하드 락</b>: 카메라 중심을 플레이어 위치에 고정하는 방식. 구현은 쉬움.
    단점은 작은 점프와 착지 진동까지 화면 전체가 따라 움직여 멀미를 부르고, 진행 방향 시야가 화면 절반뿐이라는 점.</p>
    <ul>
      <li><b>지수 보간 (lerp)</b>: <code>cam = damp(cam, target, λ, dt)</code>. 부드럽지만 항상 뒤처짐. 프레임레이트와 무관하게 하려면 <code>1-exp(-λ × dt)</code>를 써야 함.</li>
      <li><b>SmoothDamp</b>: 임계 감쇠 스프링(Unity <code>Mathf.SmoothDamp</code>, Game Programming Gems 4). 속도를 유지해 출발과 정지가 매끄러움.</li>
      <li><b>데드존 (카메라 창)</b>: 플레이어가 창 안에서 움직이는 동안 카메라는 가만히 있음. 작은 움직임이 화면에 전달되지 않음.</li>
      <li><b>룩어헤드</b>: 목표를 진행 방향으로 앞당겨 앞쪽을 더 보여 줌. 방향을 바꿀 때 오프셋을 부드럽게 옮겨야 함.</li>
      <li><b>플랫폼 스냅</b>: 세로 위치를 <i>착지한 발판 높이</i>로만 갱신함. 점프 중에는 세로로 움직이지 않음(화면 밖으로 나갈 때만 추적).</li>
    </ul>
    <p>Itay Keren의 "Scroll Back"은 이런 기법을 실제 게임 사례(슈퍼 마리오 월드, 소닉 등)와 함께 분류함.</p>`,
  // 도식: A 하드 락(화면 중심 = 플레이어) vs B 데드존 + 룩어헤드 목표 + 발판 높이 스냅
  diagram: (L) => `<svg viewBox="0 0 540 176" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="15" y="18" class="t-a">${L('A 하드 락', 'A: hard lock')}</text>
    <rect x="15" y="28" width="230" height="116" class="d-a"/>
    <line x1="130" y1="70" x2="130" y2="102" class="d-dim"/><line x1="114" y1="86" x2="146" y2="86" class="d-dim"/>
    <rect x="124" y="80" width="12" height="14" class="f-a"/>
    <path d="M160,60 L160,100" class="d-accent" marker-start="url(#arr)" marker-end="url(#arr)"/>
    <text x="166" y="84" class="t-small">${L('점프 높이', 'jump height')}</text>
    <text x="22" y="118" class="t-small">${L('화면 중심이 항상 플레이어', 'screen center is always the player')}</text>
    <text x="22" y="132" class="t-small">${L('점프마다 화면 전체가 출렁임', 'whole screen bobs on every jump')}</text>
    <text x="295" y="18" class="t-b">${L('B 데드존 + 룩어헤드 + 스냅', 'B: dead zone + look-ahead + snap')}</text>
    <rect x="295" y="28" width="230" height="116" class="d-b"/>
    <line x1="300" y1="108" x2="520" y2="108" class="d-line"/>
    <rect x="382" y="50" width="60" height="56" class="d-dim" stroke-dasharray="4 3"/>
    <text x="384" y="45" class="t-small t-dim">${L('데드존', 'dead zone')}</text>
    <line x1="412" y1="66" x2="412" y2="90" class="d-dim"/><line x1="400" y1="78" x2="424" y2="78" class="d-dim"/>
    <rect x="350" y="94" width="12" height="14" class="f-b"/>
    <path d="M356,90 Q370,52 390,70" class="d-dim" stroke-dasharray="2 3"/>
    <path d="M364,100 L408,100" class="d-accent" marker-end="url(#arr)"/>
    <circle cx="412" cy="100" r="3.5" class="f-accent"/>
    <text x="340" y="121" class="t-small">${L('룩어헤드 목표', 'look-ahead target')}</text>
    <text x="302" y="136" class="t-small">${L('세로는 착지한 발판 높이로만 갱신', 'vertical moves only on landing')}</text>
    <text x="15" y="162" class="t-small t-dim">${L('구현 쉬움, 앞쪽 시야는 화면 절반', 'easy, but only half the screen ahead')}</text>
    <text x="295" y="162" class="t-small t-dim">${L('작은 움직임은 무시, 앞쪽을 더 보여 줌', 'ignores small moves, shows more ahead')}</text>
  </svg>`,
  look: [
    '세로 그래프를 비교하면 A는 플레이어 높이(회색)를 그대로 따라 출렁이고, B는 착지한 발판 높이에서만 계단처럼 움직임.',
    '데모 중간에 플레이어가 멈췄다 잠깐 뒤로 걸을 때 보면, 룩어헤드가 있는 쪽은 시야가 뒤쪽으로 부드럽게 넘어감.',
    'B의 방식을 "지수 보간"으로 바꾸고 감쇠 시간을 0.6초 이상으로 올리면 플레이어가 화면 가장자리까지 밀려 앞이 안 보임.',
    '"데드존"만 쓰면 창 경계에 닿는 순간 카메라가 갑자기 움직이기 시작함. 그래서 감쇠와 함께 씀.',
  ],
  refs: [
    { type: 'talk', title: 'Scroll Back: The Theory and Practice of Cameras in Side-Scrollers (Itay Keren)', year: 2015, note: 'GDC 2015. 카메라 창, 플랫폼 스냅, 룩어헤드, 큐 존 등 분류.' },
    { type: 'article', title: 'Scroll Back: The Theory and Practice of Cameras in Side-Scrollers (Gamasutra 기사판)', url: 'https://www.gamedeveloper.com/design/scroll-back-the-theory-and-practice-of-cameras-in-side-scrollers', year: 2015 },
    { type: 'talk', title: 'Math for Game Programmers: Juicing Your Cameras With Math (Squirrel Eiserloh)', year: 2016, note: 'GDC 2016. 부드러운 추적, 화면 흔들림.' },
    { type: 'engine', title: 'Unity - Mathf.SmoothDamp', url: 'https://docs.unity3d.com/ScriptReference/Mathf.SmoothDamp.html' },
    { type: 'engine', title: 'Unity Cinemachine - Position Composer (Dead Zone / Soft Zone / Lookahead)', note: 'Cinemachine의 Dead Zone, Soft Zone, Lookahead Time 설정.' },
    { type: 'book', title: 'Game Programming Gems 4 - Critically Damped Ease-In/Ease-Out Smoothing (Thomas Lowe)', year: 2004 },
  ],
  params: [
    { key: 'mode', label: '가로 추적 방식', type: 'select', group: '카메라', options: [
      { value: 'lock', label: '하드 락' },
      { value: 'lerp', label: '지수 보간 (lerp)' },
      { value: 'smooth', label: 'SmoothDamp' },
      { value: 'window', label: '데드존 (카메라 창)' },
      { value: 'lookahead', label: '룩어헤드 + SmoothDamp' },
      { value: 'combo', label: '데드존 + 룩어헤드 + SmoothDamp' },
    ], a: 'lock', b: 'combo' },
    { key: 'snap', label: '세로: 플랫폼 스냅', type: 'bool', a: false, b: true, help: '끄면 세로도 가로 방식과 같은 규칙으로 추적' },
    { key: 'smoothTime', label: '감쇠 시간 (s)', type: 'range', min: 0.02, max: 1.2, step: 0.01, default: 0.2, when: (p) => p.mode !== 'lock' && p.mode !== 'window' },
    { key: 'winW', label: '데드존 너비', type: 'int', min: 0, max: 300, default: 90, when: (p) => p.mode === 'window' || p.mode === 'combo' },
    { key: 'winH', label: '데드존 높이', type: 'int', min: 0, max: 240, default: 140, when: (p) => p.mode === 'window' || p.mode === 'combo' || p.snap },
    { key: 'look', label: '룩어헤드 거리', type: 'int', min: 0, max: 260, default: 170, when: (p) => p.mode === 'lookahead' || p.mode === 'combo' },
    { key: 'debug', label: '디버그 표시', type: 'bool', default: true },
    { key: 'zoom', label: '보이는 너비 (월드 px)', type: 'int', min: 320, max: 900, default: 520, shared: true, group: '장면' },
    { key: 'demo', label: '자동 데모', type: 'bool', default: true, shared: true },
    { key: 'restart', label: '처음부터', type: 'button', buttonLabel: '다시 시작' },
  ],
  en: {
    title: 'Camera Follow Methods',
    summary: 'If the camera sticks to the player, the screen bobs with every jump and you cannot see ahead. Combine a dead zone, look-ahead, platform snap, and damping to show what the player needs to see.',
    views: { a: 'Hard lock', b: 'Dead zone + look-ahead + platform snap' },
    controls: '←→ / A D to move, Space / Z / ↑ / W to jump (pressing a key pauses the auto demo for a moment)',
    info: `
    <p><b>Hard lock</b> fixes the camera center to the player position. It is easy to build.
    The downsides: the whole screen follows even small jumps and landing bumps, which can cause motion sickness. You also see only half a screen in the direction you move.</p>
    <ul>
      <li><b>Exponential smoothing (lerp)</b>: <code>cam = damp(cam, target, λ, dt)</code>. It is smooth but always lags behind. To make it independent of frame rate, use <code>1-exp(-λ × dt)</code>.</li>
      <li><b>SmoothDamp</b>: a critically damped spring (Unity <code>Mathf.SmoothDamp</code>, Game Programming Gems 4). It keeps a velocity, so starts and stops are smooth.</li>
      <li><b>Dead zone (camera window)</b>: while the player moves inside the window, the camera stays still. Small movements do not reach the screen.</li>
      <li><b>Look-ahead</b>: move the target forward in the direction of travel to show more of what is ahead. When the direction changes, move the offset smoothly.</li>
      <li><b>Platform snap</b>: update the vertical position only to <i>the height of the platform you landed on</i>. The camera does not move vertically during a jump (it follows only when the player leaves the screen).</li>
    </ul>
    <p>Itay Keren's "Scroll Back" sorts these techniques with real game examples (Super Mario World, Sonic, and others).</p>`,
    look: [
      'Compare the vertical graphs. A follows the player height (gray) and bobs. B moves in steps, only at the heights of the platforms it lands on.',
      'Midway through the demo the player stops and walks back for a moment. With look-ahead, the view slides smoothly to the back side.',
      'Change B\'s mode to "Exponential smoothing" and raise the damping time to 0.6 s or more. The player gets pushed to the screen edge and you cannot see ahead.',
      'With only the "Dead zone", the camera starts moving suddenly the moment the player touches the window edge. That is why you combine it with damping.',
    ],
    refs: [
      'GDC 2015. Sorts camera windows, platform snap, look-ahead, cue zones, and more.',
      { title: 'Scroll Back: The Theory and Practice of Cameras in Side-Scrollers (Gamasutra article)' },
      'GDC 2016. Smooth following, screen shake.',
      null,
      'Cinemachine settings for Dead Zone, Soft Zone, and Lookahead Time.',
      null,
    ],
    params: {
      mode: { label: 'Horizontal follow mode', group: 'Camera', options: { lock: 'Hard lock', lerp: 'Exponential smoothing (lerp)', window: 'Dead zone (camera window)', lookahead: 'Look-ahead + SmoothDamp', combo: 'Dead zone + look-ahead + SmoothDamp' } },
      snap: { label: 'Vertical: platform snap', help: 'When off, vertical follow uses the same rule as horizontal' },
      smoothTime: 'Damping time (s)',
      winW: 'Dead zone width',
      winH: 'Dead zone height',
      look: 'Look-ahead distance',
      debug: 'Show debug',
      zoom: { label: 'Visible width (world px)', group: 'Scene' },
      demo: 'Auto demo',
      restart: { label: 'Start over', buttonLabel: 'Restart' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const STEP = 1 / 120, WORLD_W = 2400, WORLD_H = 480;
    const GRAV = 2200, JUMP_V = 760, RUN = 210, PW = 18, PH = 24;
    const col = ctx.side === 'a' ? C.a : C.b;
    const KEYS = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], jump: ['Space', 'KeyZ', 'ArrowUp', 'KeyW'] };
    const ALL = [...KEYS.left, ...KEYS.right, ...KEYS.jump];

    const solids = [
      { x: -40, y: 420, w: WORLD_W + 80, h: 300 },
      { x: 400, y: 360, w: 120, h: 60 },
      { x: 610, y: 290, w: 190, h: 18 },
      { x: 1000, y: 385, w: 60, h: 35 },
      { x: 1200, y: 385, w: 60, h: 35 },
      { x: 1450, y: 370, w: 100, h: 50 },
      { x: 1550, y: 320, w: 100, h: 100 },
      { x: 1650, y: 270, w: 100, h: 150 },
      { x: 1750, y: 320, w: 100, h: 100 },
      { x: 1850, y: 370, w: 100, h: 50 },
      { x: 2050, y: 360, w: 110, h: 60 },
      { x: -40, y: 0, w: 40, h: 480 },
      { x: WORLD_W, y: 0, w: 40, h: 480 },
    ];
    // 배경 장식 (시드 고정 → A/B 동일)
    const rng = U.rng(ctx.seed + 11);
    const hills = Array.from({ length: 30 }, (_, i) => ({ x: i * 110 + rng.range(-30, 30), h: rng.range(60, 170), w: rng.range(120, 220) }));
    const stars = Array.from({ length: 60 }, () => ({ x: rng.range(0, WORLD_W), y: rng.range(20, 260), r: rng.range(0.6, 1.6) }));

    let p, cam, acc, idle, pendingPress, demo, hist, motion;
    function init() {
      p = { x: 60, y: 420 - PH, vx: 0, vy: 0, grounded: true, face: 1, groundY: 420 - PH };
      cam = { x: 0, y: 0, vx: 0, vy: 0, fx: 0, fy: 0, look: 0, lookV: 0, snapY: 0 };
      cam.fx = p.x + PW / 2; cam.fy = p.y; cam.snapY = p.y;
      const t = targetNow(); cam.x = t.x; cam.y = t.y;
      acc = 0; idle = 99; pendingPress = false;
      demo = { phase: 0, t: 0, prevJump: false, hold: 0 };
      hist = []; motion = [];
    }

    const overlap = (a, s) => a.x < s.x + s.w && a.x + PW > s.x && a.y < s.y + s.h && a.y + PH > s.y;
    const solidAt = (x, y) => solids.some((s) => x < s.x + s.w && x + PW > s.x && y < s.y + s.h && y + PH > s.y);

    // 자동 데모: 오른쪽으로 달리다 멈추고, 잠깐 되돌아가고, 끝에서 방향을 바꿔 돌아옴
    const PHASES = [
      { dir: 1, untilX: 1300 }, { dir: 0, time: 1.0 }, { dir: -1, time: 0.7 }, { dir: 0, time: 0.5 },
      { dir: 1, untilX: 2300 }, { dir: 0, time: 0.8 }, { dir: -1, untilX: 120 }, { dir: 0, time: 0.8 },
    ];
    function demoInput() {
      const ph = PHASES[demo.phase];
      demo.t += STEP;
      let done = false;
      if (ph.time !== undefined) done = demo.t >= ph.time;
      else done = ph.dir > 0 ? p.x >= ph.untilX : p.x <= ph.untilX;
      if (done) { demo.phase = (demo.phase + 1) % PHASES.length; demo.t = 0; }
      const dir = ph.dir;
      if (p.grounded && dir !== 0 && demo.hold <= 0) {
        const wall = solidAt(p.x + dir * 22, p.y - 1);
        const toFloat = dir > 0 && p.x > 500 && p.x < 520 && p.y < 360;   // 블록 위에서 떠 있는 발판으로
        if (wall || toFloat) demo.hold = 0.3;
      }
      let jump = false;
      if (demo.hold > 0) { demo.hold -= STEP; jump = true; }
      const pressed = jump && !demo.prevJump;
      demo.prevJump = jump;
      return { left: dir < 0, right: dir > 0, jumpPressed: pressed };
    }

    function step(inp) {
      const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      if (dir) p.face = dir;
      p.vx = U.approach(p.vx, dir * RUN, (p.grounded ? 2400 : 1600) * STEP);
      if (inp.jumpPressed && p.grounded) { p.vy = -JUMP_V; p.grounded = false; }
      p.vy = Math.min(p.vy + GRAV * STEP, 900);
      p.x += p.vx * STEP;
      for (const s of solids) if (overlap(p, s)) { p.x = p.vx > 0 ? s.x - PW : s.x + s.w; p.vx = 0; }
      p.y += p.vy * STEP;
      p.grounded = false;
      for (const s of solids) if (overlap(p, s)) {
        if (p.vy > 0) { p.y = s.y - PH; p.grounded = true; } else p.y = s.y + s.h;
        p.vy = 0;
      }
      if (p.grounded) p.groundY = p.y;
    }

    // Unity Mathf.SmoothDamp 과 같은 임계 감쇠 근사 (Game Programming Gems 4)
    function smoothDamp(cur, target, vel, smoothTime, dt) {
      const st = Math.max(0.0001, smoothTime), omega = 2 / st, x = omega * dt;
      const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
      const change = cur - target, temp = (vel + omega * change) * dt;
      return { v: target + (change + temp) * exp, vel: (vel - omega * temp) * exp };
    }

    function viewSize() {
      const sc = ctx.width / P.zoom;
      return { sc, vw: P.zoom, vh: ctx.height / sc };
    }

    // 현재 규칙에 따른 카메라 "목표" (상태 갱신 없이 계산 가능한 부분)
    function targetNow() {
      const px = p.x + PW / 2, py = p.y + PH / 2 - 40;
      return { x: px, y: py };
    }

    function updateCam(dt) {
      const m = P.mode, px = p.x + PW / 2, py = p.y + PH / 2 - 40;
      // 데드존 초점
      const hw = P.winW / 2, hh = P.winH / 2;
      if (px > cam.fx + hw) cam.fx = px - hw; else if (px < cam.fx - hw) cam.fx = px + hw;
      if (py > cam.fy + hh) cam.fy = py - hh; else if (py < cam.fy - hh) cam.fy = py + hh;
      // 룩어헤드 오프셋: 진행 방향(입력/속도)으로 부드럽게 이동
      const moving = Math.abs(p.vx) > 20 ? Math.sign(p.vx) : 0;
      const lookTarget = moving * P.look;
      const ls = smoothDamp(cam.look, lookTarget, cam.lookV, 0.6, dt); cam.look = ls.v; cam.lookV = ls.vel;

      let tx, ty;
      if (m === 'window' || m === 'combo') { tx = cam.fx; ty = cam.fy; } else { tx = px; ty = py; }
      if (m === 'lookahead' || m === 'combo') tx += cam.look;
      // 플랫폼 스냅: 착지한 발판 높이만 따라가되, 세로 창을 벗어나면 추적
      if (P.snap) {
        const gy = p.groundY + PH / 2 - 40;
        if (p.grounded) cam.snapY = gy;
        if (py < cam.snapY - hh) cam.snapY = py + hh;
        if (py > cam.snapY + hh * 0.6) cam.snapY = py - hh * 0.6;
        ty = cam.snapY;
      }
      const smoothX = m !== 'lock' && m !== 'window';
      const smoothY = P.snap || smoothX;
      if (m === 'lerp') {
        const lam = 3 / Math.max(0.02, P.smoothTime);
        cam.x = U.damp(cam.x, tx, lam, dt);
        if (P.snap) { const r = smoothDamp(cam.y, ty, cam.vy, 0.25, dt); cam.y = r.v; cam.vy = r.vel; }
        else cam.y = U.damp(cam.y, ty, lam, dt);
      } else {
        if (smoothX) { const r = smoothDamp(cam.x, tx, cam.vx, P.smoothTime, dt); cam.x = r.v; cam.vx = r.vel; } else cam.x = tx;
        if (smoothY) { const r = smoothDamp(cam.y, ty, cam.vy, P.snap && !smoothX ? 0.25 : P.smoothTime, dt); cam.y = r.v; cam.vy = r.vel; } else cam.y = ty;
      }
    }

    function clampCam() {
      const { vw } = viewSize();
      return {
        x: U.clamp(cam.x, vw / 2, Math.max(vw / 2, WORLD_W - vw / 2)),
        y: cam.y,
      };
    }

    init();
    let lastCam = clampCam();

    return {
      update(dt) {
        const kb = ctx.input;
        const manual = { left: KEYS.left.some(kb.key), right: KEYS.right.some(kb.key), jumpPressed: KEYS.jump.some(kb.pressed) };
        const touched = ALL.some(kb.key) || manual.jumpPressed;
        idle = touched ? 0 : idle + dt;
        const auto = P.demo && idle > 2.5;
        if (!auto && manual.jumpPressed) pendingPress = true;
        acc += dt;
        while (acc >= STEP) {
          acc -= STEP;
          let inp;
          if (auto) inp = demoInput();
          else { inp = { ...manual, jumpPressed: pendingPress }; pendingPress = false; }
          step(inp);
        }
        updateCam(dt);
        const c = clampCam();
        motion.push({ dx: Math.abs(c.x - lastCam.x), dy: Math.abs(c.y - lastCam.y), dt });
        while (motion.length > 240) motion.shift();
        lastCam = c;
        hist.push({ py: p.y + PH / 2 - 40, cy: c.y });
        if (hist.length > 300) hist.shift();
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const { sc, vw, vh } = viewSize();
        const c = clampCam();
        // 하늘 & 시차 배경
        D.rect(g, 0, 0, W, H, '#161a24');
        g.save(); g.translate(W / 2, H / 2); g.scale(sc, sc);
        g.save(); g.translate(-c.x * 0.2, -c.y * 0.2);
        for (const s of stars) D.circle(g, s.x * 0.5, s.y - 120, s.r, 'rgba(255,255,255,0.35)');
        g.restore();
        g.save(); g.translate(-c.x * 0.5, -c.y * 0.5 + 60);
        g.fillStyle = '#1f2533';
        for (const h of hills) { g.beginPath(); g.moveTo(h.x * 0.6 - h.w / 2, 420); g.quadraticCurveTo(h.x * 0.6, 420 - h.h * 2, h.x * 0.6 + h.w / 2, 420); g.fill(); }
        g.restore();
        // 월드
        g.translate(-c.x, -c.y);
        D.grid(g, WORLD_W, WORLD_H, 60, 'rgba(255,255,255,0.04)');
        for (const s of solids) { D.rect(g, s.x, s.y, s.w, s.h, '#2c3240'); D.rect(g, s.x, s.y, s.w, 3, '#4d5668'); }
        for (let x = 200; x < WORLD_W; x += 400) D.text(g, `${x}`, x, 430, { size: 10, color: C.dim, align: 'center' });
        D.rect(g, p.x, p.y, PW, PH, col);
        D.rect(g, p.x + (p.face > 0 ? 11 : 3), p.y + 6, 4, 4, '#14161a');
        if (P.debug) {
          const m = P.mode;
          if (m === 'window' || m === 'combo') {
            D.rect(g, cam.fx - P.winW / 2, (P.snap ? cam.snapY : cam.fy) - P.winH / 2, P.winW, P.winH, null, 'rgba(255,255,255,0.45)', 1 / sc);
          }
          if (m === 'lookahead' || m === 'combo') {
            const bx = (m === 'combo' ? cam.fx : p.x + PW / 2);
            D.arrow(g, bx, c.y + 30, bx + cam.look, c.y + 30, C.warn, 1.5 / sc, 6 / sc);
          }
          if (P.snap) { g.setLineDash([6, 6]); D.line(g, c.x - vw / 2, cam.snapY + 40, c.x + vw / 2, cam.snapY + 40, 'rgba(102,209,122,0.5)', 1 / sc); g.setLineDash([]); }
          const k = 8 / sc;
          D.line(g, c.x - k, c.y, c.x + k, c.y, '#fff', 1 / sc); D.line(g, c.x, c.y - k, c.x, c.y + k, '#fff', 1 / sc);
        }
        g.restore();

        // 미니맵
        const mw = Math.min(220, W * 0.4), ms = mw / WORLD_W, mh = WORLD_H * ms, mx = W - mw - 10, my = 10;
        D.rect(g, mx, my, mw, mh, 'rgba(0,0,0,0.45)');
        for (const s of solids) D.rect(g, mx + Math.max(0, s.x) * ms, my + s.y * ms, Math.min(s.w, WORLD_W) * ms, Math.max(0, Math.min(s.h, WORLD_H - s.y)) * ms, '#3a4252');
        D.rect(g, mx + (c.x - vw / 2) * ms, my + (c.y - vh / 2) * ms, vw * ms, vh * ms, null, col, 1);
        D.circle(g, mx + (p.x + PW / 2) * ms, my + (p.y + PH / 2) * ms, 2, '#fff');

        // 세로 추적 그래프: 회색 = 플레이어 높이, 뷰 색 = 카메라 높이
        if (hist.length > 2) {
          const gw = Math.min(220, W * 0.4), gh = 54, gx = 10, gy = 10;
          let lo = Infinity, hi = -Infinity;
          for (const h of hist) { lo = Math.min(lo, h.py, h.cy); hi = Math.max(hi, h.py, h.cy); }
          lo -= 10; hi += 10;
          D.plot(g, hist.map((h) => -h.py), gx, gy, gw, gh, { min: -hi, max: -lo, color: 'rgba(200,200,200,0.5)', label: GTL.L('세로: 플레이어 vs 카메라', 'Vertical: player vs camera') });
          D.plot(g, hist.map((h) => -h.cy), gx, gy, gw, gh, { min: -hi, max: -lo, color: col, background: false, lineWidth: 2 });
        }
        if (P.demo && idle <= 2.5) D.text(g, GTL.L('수동 조작 중', 'Manual control'), W - 12, my + mh + 6, { size: 11, color: C.warn, align: 'right' });

        let sx = 0, sy = 0, st = 0;
        for (const q of motion) { sx += q.dx; sy += q.dy; st += q.dt; }
        const ahead = p.face > 0 ? c.x + vw / 2 - (p.x + PW) : p.x - (c.x - vw / 2);
        ctx.stat(GTL.L('카메라 세로 이동 (px/s)', 'Camera vertical motion (px/s)'), st ? (sy / st).toFixed(0) : '-');
        ctx.stat(GTL.L('카메라 가로 이동 (px/s)', 'Camera horizontal motion (px/s)'), st ? (sx / st).toFixed(0) : '-');
        ctx.stat(GTL.L('진행 방향 시야', 'View ahead'), `${ahead.toFixed(0)} px`);
      },
      onAction(key) { if (key === 'restart') { init(); lastCam = clampCam(); } },
    };
  },
});
