// 주스(Juice): 게임 규칙은 그대로, 피드백만 더해 "손맛"을 만듦. Juice it or lose it (2012) 스타일
GTL.register({
  id: 'juice',
  title: '주스: Juice it or lose it',
  summary: '두 뷰는 완전히 같은 벽돌깨기 게임(같은 공 궤적, 같은 점수). 다른 것은 트윈, 스쿼시, 파티클, 흔들림 같은 시각 피드백뿐인데 느낌은 전혀 다름.',
  views: { a: '주스 없음', b: '주스 전부' },
  controls: '←→ / A D 또는 마우스로 패들 이동 (조작하면 자동 플레이가 잠시 멈춤)',
  info: `
    <p><b>주스</b>(juice): 게임 규칙은 그대로 두고 덧붙이는 시각, 청각 피드백. 손맛을 만드는 요소.</p>
    <p>Martin Jonasson과 Petri Purho의 발표 <i>Juice it or lose it</i>(2012)는 평범한 벽돌깨기에서 <b>게임 규칙을 하나도 바꾸지 않음</b>.
    피드백만 하나씩 더해 "살아 있는" 게임으로 바꾸는 과정을 보여 줌.
    이 샘플의 주스 요소도 모두 렌더링 전용. 그래서 두 뷰의 시뮬레이션(공 위치, 벽돌, 점수)은 프레임 단위로 같음.</p>
    <ul>
      <li><b>트윈 등장</b>: 벽돌이 이징(outBounce)으로 차례로 등장</li>
      <li><b>스쿼시 & 스트레치</b>: 공은 속도 방향으로 늘어나고 충돌 순간 찌그러짐. 패들은 스프링으로 출렁임.</li>
      <li><b>파괴 연출 & 파편</b>: 벽돌이 바로 사라지지 않고 회전하며 떨어짐. 파편도 튐.</li>
      <li><b>화면 흔들림, 플래시, 꼬리, 색</b></li>
      <li><b>패들의 눈</b>: 공을 쳐다보는 눈. 발표의 명장면.</li>
    </ul>
    <p>단점: 과하면 정보가 가려지고 눈이 피로해짐. 요소를 하나씩 껐다 켜며 무엇이 가장 효과적인지 비교해 볼 것.</p>`,
  // 도식: 같은 입력, 같은 시뮬레이션. 주스는 상태를 읽어서 B 화면에만 더함
  diagram: (L) => `<svg viewBox="0 0 540 176" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <rect x="10" y="68" width="70" height="40" class="f-dim"/>
    <text x="45" y="85" text-anchor="middle">${L('입력', 'Input')}</text>
    <text x="45" y="99" text-anchor="middle" class="t-small t-dim">${L('같은 입력', 'same input')}</text>
    <path d="M80,88 L98,88" class="d-line" marker-end="url(#arr)"/>
    <rect x="100" y="66" width="130" height="44" class="f-dim"/>
    <text x="165" y="84" text-anchor="middle">${L('시뮬레이션', 'Simulation')}</text>
    <text x="165" y="99" text-anchor="middle" class="t-small t-dim">${L('공, 벽돌, 점수', 'ball, bricks, score')}</text>
    <path d="M230,76 L428,46" class="d-a" marker-end="url(#arr)"/>
    <rect x="430" y="28" width="100" height="34" class="d-a"/>
    <text x="480" y="49" text-anchor="middle" class="t-a">${L('A 화면', 'A screen')}</text>
    <text x="330" y="50" text-anchor="middle" class="t-small t-dim">${L('그대로 그림', 'plain draw')}</text>
    <path d="M230,100 L258,124" class="d-b" marker-end="url(#arr)"/>
    <rect x="260" y="106" width="140" height="44" class="d-b"/>
    <text x="330" y="122" text-anchor="middle" class="t-b">${L('주스 (그리기 전용)', 'Juice (render only)')}</text>
    <text x="330" y="134" text-anchor="middle" class="t-small">${L('트윈, 스쿼시, 파편', 'tween, squash, debris')}</text>
    <text x="330" y="145" text-anchor="middle" class="t-small">${L('흔들림, 플래시, 꼬리', 'shake, flash, trail')}</text>
    <path d="M400,128 L428,128" class="d-b" marker-end="url(#arr)"/>
    <rect x="430" y="111" width="100" height="34" class="d-b"/>
    <text x="480" y="132" text-anchor="middle" class="t-b">${L('B 화면', 'B screen')}</text>
    <text x="4" y="170" class="t-small t-dim">${L('주스는 상태를 읽기만 함. 그래서 두 뷰의 공 궤적과 점수는 프레임 단위로 같음', 'Juice only reads the state. So the ball path and score match frame by frame')}</text>
  </svg>`,
  look: [
    '두 뷰의 공과 점수를 비교하면 항상 같음. 그런데 B 쪽이 더 세게 맞는 것처럼 느껴짐.',
    'B에서 파편과 흔들림을 끄면 타격감이 크게 줄어듦. 눈을 끄면 캐릭터성이 사라짐.',
    '"다시 시작"을 누르면 B의 벽돌은 튕기며 떨어져 들어옴(트윈 등장). A의 벽돌은 그냥 나타남.',
    'A에서 "색"만 켜도 생각보다 차이가 큼. 가장 싸게 얻는 주스.',
  ],
  refs: [
    { type: 'talk', title: 'Juice it or lose it (Martin Jonasson & Petri Purho)', url: 'https://www.youtube.com/watch?v=Fy0aCDmgnxg', year: 2012, note: '벽돌깨기에 주스를 단계적으로 추가' },
    { type: 'talk', title: 'The art of screenshake (Jan Willem Nijman, Vlambeer)', year: 2013, note: 'INDIGO 2013. 30여 가지 작은 피드백으로 슈터를 바꾸는 시연.' },
    { type: 'book', title: 'Game Feel: A Game Designer\'s Guide to Virtual Sensation (Steve Swink)', year: 2008, note: '"polish": 시뮬레이션과 별개인 감각 피드백 층' },
    { type: 'article', title: 'Robert Penner\'s Easing Functions', url: 'http://robertpenner.com/easing/', note: '트윈 이징 함수의 표준 레퍼런스' },
  ],
  params: [
    { key: 'tween', label: '트윈 등장', type: 'bool', a: false, b: true, group: '주스 요소' },
    { key: 'color', label: '색', type: 'bool', a: false, b: true },
    { key: 'squash', label: '스쿼시 & 스트레치', type: 'bool', a: false, b: true },
    { key: 'breakAnim', label: '파괴 연출', type: 'bool', a: false, b: true },
    { key: 'particles', label: '파편 파티클', type: 'bool', a: false, b: true },
    { key: 'shake', label: '화면 흔들림', type: 'bool', a: false, b: true },
    { key: 'flash', label: '충돌 플래시', type: 'bool', a: false, b: true },
    { key: 'trail', label: '공 꼬리', type: 'bool', a: false, b: true },
    { key: 'eyes', label: '패들의 눈', type: 'bool', a: false, b: true },
    { key: 'intensity', label: '강도', type: 'range', min: 0.2, max: 2, step: 0.05, default: 1, when: (p) => p.shake || p.squash || p.particles },
    { key: 'demo', label: '자동 플레이', type: 'bool', default: true, shared: true, group: '장면' },
    { key: 'ballSpeed', label: '공 속도', type: 'int', min: 200, max: 600, default: 340, shared: true },
    { key: 'restart', label: '처음부터', type: 'button', buttonLabel: '다시 시작' },
  ],
  en: {
    title: 'Juice: Juice it or lose it',
    summary: 'Both views run exactly the same Breakout game (same ball path, same score). Only the visual feedback differs: tweens, squash, particles, shake. Yet they feel completely different.',
    views: { a: 'No juice', b: 'All juice' },
    controls: '←→ / A D or the mouse to move the paddle (any input pauses the auto play for a moment)',
    info: `
    <p><b>Juice</b> is visual and audio feedback you add on top without changing the game rules. It is what makes a game feel good to play.</p>
    <p>The talk <i>Juice it or lose it</i> (2012) by Martin Jonasson and Petri Purho starts from a plain Breakout and <b>does not change a single game rule</b>.
    It adds feedback one piece at a time and turns it into a game that feels "alive".
    Every juice element in this sample is also render only. So the simulation of both views (ball position, bricks, score) is the same frame by frame.</p>
    <ul>
      <li><b>Tweened entry</b>: bricks appear one by one with easing (outBounce).</li>
      <li><b>Squash & stretch</b>: the ball stretches along its velocity and squashes on impact. The paddle wobbles on a spring.</li>
      <li><b>Break animation & debris</b>: bricks do not vanish at once. They spin and fall. Debris flies too.</li>
      <li><b>Screen shake, flash, trail, color</b>.</li>
      <li><b>Paddle eyes</b>: eyes that watch the ball. The famous moment of the talk.</li>
    </ul>
    <p>Downside: too much hides information and tires the eyes. Turn elements off and on one at a time, and compare which works best.</p>`,
    look: [
      'Compare the ball and score in both views. They are always the same. Yet B feels like it hits harder.',
      'In B, turn off debris and shake. The impact feel drops a lot. Turn off the eyes and the character is gone.',
      'Press "Restart". B\'s bricks bounce and drop in (tweened entry). A\'s bricks just appear.',
      'In A, turn on only "Color". The difference is bigger than you expect. It is the cheapest juice.',
    ],
    refs: [
      'Adds juice to Breakout step by step.',
      'INDIGO 2013. A demo that changes a shooter with about 30 small kinds of feedback.',
      '"Polish": a layer of sensory feedback separate from the simulation.',
      'The standard reference for tween easing functions.',
    ],
    params: {
      tween: { label: 'Tweened entry', group: 'Juice elements' },
      color: 'Color',
      squash: 'Squash & stretch',
      breakAnim: 'Break animation',
      particles: 'Debris particles',
      shake: 'Screen shake',
      flash: 'Impact flash',
      trail: 'Ball trail',
      eyes: 'Paddle eyes',
      intensity: 'Intensity',
      demo: { label: 'Auto play', group: 'Scene' },
      ballSpeed: 'Ball speed',
      restart: { label: 'Start over', buttonLabel: 'Restart' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params, E = U.ease;
    const WW = 640, WH = 360, STEP = 1 / 120, COLS = 10, ROWS = 5, BW = 56, BH = 18, GAP = 4, BR = 6;
    const PADY = 326, PADH = 12;
    const KEYS = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'] };
    const fx = U.rng(ctx.seed + 99);       // 연출 전용 난수 (게임 상태에 영향 없음)
    const noise = U.noise(ctx.seed + 7);

    let bricks, ball, pad, acc, idle, score, lost, time, mouseX, lastMouseX;
    // 연출 상태
    let parts, falling, trail, trauma, bgFlash, padSpring, ballSquash, wallFlash, smile;

    function buildBricks() {
      bricks = [];
      const x0 = (WW - (COLS * BW + (COLS - 1) * GAP)) / 2;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        bricks.push({ x: x0 + c * (BW + GAP), y: 40 + r * (BH + GAP), alive: true, r, c, born: time + (c + r * 2) * 0.04 + 0.1 });
      }
    }
    function serve() {
      const gr = U.rng(ctx.seed + score * 7 + lost * 13);   // 게임 난수: 상태로부터 결정 → A/B 동일
      const a = U.rad(-90 + gr.range(-35, 35));
      ball = { x: pad.x, y: PADY - 20, vx: Math.cos(a), vy: Math.sin(a), speed: P.ballSpeed, wait: 0.6 };
    }
    function init() {
      time = 0; acc = 0; idle = 99; score = 0; lost = 0; mouseX = null; lastMouseX = null;
      pad = { x: WW / 2, w: 84, vx: 0 };
      buildBricks(); serve();
      parts = []; falling = []; trail = []; trauma = 0; bgFlash = 0; wallFlash = { l: 0, r: 0, t: 0 };
      padSpring = { y: 0, v: 0 }; ballSquash = { s: 0, v: 0, ang: 0 }; smile = 0;
    }
    init();

    // ─── 게임 로직 (주스와 무관, 고정 스텝) ───
    function hitFx(kind, x, y, b) {
      // 연출 이벤트 기록. 게임 상태는 바꾸지 않음
      if (kind === 'brick') {
        trauma = Math.min(1, trauma + 0.35);
        bgFlash = 1;
        ballSquash.v -= 14;
        for (let i = 0; i < 14; i++) {
          const a = fx.range(0, U.TAU), s = fx.range(60, 260);
          parts.push({ x, y, vx: Math.cos(a) * s + ball.vx * 80, vy: Math.sin(a) * s + ball.vy * 80, life: fx.range(0.4, 0.9), max: 0.9, r: b.r, sz: fx.range(2, 5), rot: fx.range(0, 6) });
        }
        falling.push({ x: b.x, y: b.y, r: b.r, vx: ball.vx * 60 + fx.range(-40, 40), vy: -fx.range(40, 140), rot: 0, vr: fx.range(-8, 8), life: 1.2, white: 0.08 });
      } else if (kind === 'pad') {
        trauma = Math.min(1, trauma + 0.12);
        padSpring.v += 220; ballSquash.v -= 18; smile = 0.6;
      } else if (kind === 'wall') {
        ballSquash.v -= 10;
        if (x <= BR + 1) wallFlash.l = 1; else if (x >= WW - BR - 1) wallFlash.r = 1; else wallFlash.t = 1;
      }
    }

    function step(dir) {
      time += STEP;
      // 패들
      if (dir !== null) {
        pad.vx = U.approach(pad.vx, dir * 520, 5000 * STEP);
        pad.x += pad.vx * STEP;
      }
      pad.x = U.clamp(pad.x, pad.w / 2, WW - pad.w / 2);
      // 공
      if (ball.wait > 0) { ball.wait -= STEP; ball.x = pad.x; return; }
      const sp = ball.speed;
      ball.x += ball.vx * sp * STEP; ball.y += ball.vy * sp * STEP;
      if (ball.x < BR) { ball.x = BR; ball.vx = Math.abs(ball.vx); hitFx('wall', ball.x, ball.y); }
      if (ball.x > WW - BR) { ball.x = WW - BR; ball.vx = -Math.abs(ball.vx); hitFx('wall', ball.x, ball.y); }
      if (ball.y < BR) { ball.y = BR; ball.vy = Math.abs(ball.vy); hitFx('wall', ball.x, ball.y); }
      // 패들 충돌
      if (ball.vy > 0 && ball.y + BR >= PADY && ball.y - BR <= PADY + PADH && Math.abs(ball.x - pad.x) <= pad.w / 2 + BR) {
        const off = U.clamp((ball.x - pad.x) / (pad.w / 2), -1, 1);
        const a = U.rad(-90 + off * 60);
        ball.vx = Math.cos(a); ball.vy = Math.sin(a); ball.y = PADY - BR;
        ball.speed = Math.min(ball.speed + 6, P.ballSpeed * 1.5);
        hitFx('pad', ball.x, ball.y);
      }
      // 벽돌 충돌 (한 스텝에 하나)
      for (const b of bricks) {
        if (!b.alive) continue;
        const nx = U.clamp(ball.x, b.x, b.x + BW), ny = U.clamp(ball.y, b.y, b.y + BH);
        const dx = ball.x - nx, dy = ball.y - ny;
        if (dx * dx + dy * dy <= BR * BR) {
          b.alive = false; score++;
          const ox = Math.min(ball.x + BR - b.x, b.x + BW - (ball.x - BR));
          const oy = Math.min(ball.y + BR - b.y, b.y + BH - (ball.y - BR));
          if (ox < oy) ball.vx = -ball.vx; else ball.vy = -ball.vy;
          hitFx('brick', nx, ny, b);
          break;
        }
      }
      if (!bricks.some((b) => b.alive)) { buildBricks(); }
      if (ball.y > WH + 20) { lost++; serve(); }
    }

    // 자동 플레이: 공 낙하 지점을 벽 반사까지 예측해 따라감 (결정적)
    function aiDir() {
      let tx = WW / 2;
      if (ball.vy > 0 || ball.wait > 0) {
        const t = ball.wait > 0 ? 0 : (PADY - BR - ball.y) / (ball.vy * ball.speed);
        let x = ball.x + ball.vx * ball.speed * Math.max(0, t);
        const span = WW - 2 * BR;
        x -= BR; x = ((x % (2 * span)) + 2 * span) % (2 * span); if (x > span) x = 2 * span - x; x += BR;
        // 가장 가까운 남은 벽돌 쪽으로 튕기도록 오프셋
        const target = bricks.find((b) => b.alive);
        const aim = target ? U.clamp((target.x + BW / 2 - x) / 300, -0.7, 0.7) : 0;
        tx = x - aim * pad.w * 0.45;
      }
      const d = tx - pad.x;
      return Math.abs(d) < 4 ? 0 : U.clamp(d / 30, -1, 1);
    }

    // ─── 연출 업데이트 (프레임 dt) ───
    function updateFx(dt) {
      const k = P.intensity;
      trauma = Math.max(0, trauma - dt * 1.6);
      bgFlash = Math.max(0, bgFlash - dt * 5);
      smile = Math.max(0, smile - dt);
      for (const s of ['l', 'r', 't']) wallFlash[s] = Math.max(0, wallFlash[s] - dt * 4);
      // 스프링 (padSpring, ballSquash)
      padSpring.v += (-300 * padSpring.y - 12 * padSpring.v) * dt; padSpring.y += padSpring.v * dt * k;
      ballSquash.v += (-500 * ballSquash.s - 16 * ballSquash.v) * dt; ballSquash.s += ballSquash.v * dt * 0.06;
      for (const q of parts) { q.vy += 600 * dt; q.vx *= 1 - dt * 1.5; q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; q.rot += dt * 8; }
      parts = parts.filter((q) => q.life > 0);
      for (const f of falling) { f.vy += 900 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt; f.life -= dt; f.white -= dt; }
      falling = falling.filter((f) => f.life > 0 && f.y < WH + 60);
      trail.push({ x: ball.x, y: ball.y });
      if (trail.length > 14) trail.shift();
    }

    const brickColor = (r, l = 58) => (P.color ? U.hsl(330 - r * 32, 75, l) : '#8a8f99');

    return {
      update(dt) {
        const kb = ctx.input, m = ctx.input.mouse;
        const kdir = (KEYS.right.some(kb.key) ? 1 : 0) - (KEYS.left.some(kb.key) ? 1 : 0);
        const sc = Math.min(ctx.width / WW, ctx.height / WH), ox = (ctx.width - WW * sc) / 2;
        let mouseMoved = false;
        if (m.inside) { const mx = (m.x - ox) / sc; if (lastMouseX !== null && Math.abs(mx - lastMouseX) > 0.5) { mouseMoved = true; mouseX = mx; } lastMouseX = mx; }
        const touched = kdir !== 0 || mouseMoved;
        idle = touched ? 0 : idle + dt;
        const auto = P.demo && idle > 2.5;
        acc += dt;
        while (acc >= STEP) {
          acc -= STEP;
          let dir;
          if (auto) dir = aiDir();
          else if (kdir) { dir = kdir; mouseX = null; }
          else if (mouseX !== null) dir = Math.abs(mouseX - pad.x) < 3 ? 0 : U.clamp((mouseX - pad.x) / 25, -1, 1);
          else dir = 0;
          step(dir);
        }
        updateFx(dt);
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height, k = P.intensity;
        const sc = Math.min(W / WW, H / WH), ox = (W - WW * sc) / 2, oy = (H - WH * sc) / 2;
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        // 화면 흔들림 (trauma², 펄린)
        if (P.shake && trauma > 0) {
          const s = trauma * trauma * k;
          g.translate(WW / 2, WH / 2);
          g.rotate(noise.perlin2(time * 25, 9.1) * 0.03 * s);
          g.translate(-WW / 2 + noise.perlin2(time * 25, 1.3) * 14 * s, -WH / 2 + noise.perlin2(4.7, time * 25) * 14 * s);
        }
        const bg = P.color ? '#1b1530' : '#1a1c20';
        D.rect(g, -20, -20, WW + 40, WH + 40, bg);
        if (P.flash && bgFlash > 0) D.rect(g, -20, -20, WW + 40, WH + 40, `rgba(255,255,255,${bgFlash * 0.06})`);
        if (P.color) D.grid(g, WW, WH, 32, 'rgba(180,140,255,0.06)');
        // 벽 플래시
        if (P.flash) {
          if (wallFlash.l) D.rect(g, 0, 0, 4, WH, `rgba(255,255,255,${wallFlash.l * 0.8})`);
          if (wallFlash.r) D.rect(g, WW - 4, 0, 4, WH, `rgba(255,255,255,${wallFlash.r * 0.8})`);
          if (wallFlash.t) D.rect(g, 0, 0, WW, 4, `rgba(255,255,255,${wallFlash.t * 0.8})`);
        }
        // 벽돌
        for (const b of bricks) {
          if (!b.alive) continue;
          let y = b.y, s = 1;
          if (P.tween) {
            const tt = U.clamp((time - b.born) / 0.7, 0, 1);
            if (tt <= 0) continue;
            y = U.lerp(-60, b.y, E.outBounce(tt));
            s = U.lerp(0.4, 1, E.outBack(U.clamp(tt * 1.5, 0, 1)));
          }
          const cx = b.x + BW / 2, cy = y + BH / 2;
          D.rect(g, cx - (BW / 2) * s, cy - (BH / 2) * s, BW * s, BH * s, brickColor(b.r));
          if (P.color) D.rect(g, cx - (BW / 2) * s, cy - (BH / 2) * s, BW * s, 3 * s, brickColor(b.r, 75));
        }
        // 파괴 연출
        if (P.breakAnim) for (const f of falling) {
          g.save(); g.translate(f.x + BW / 2, f.y + BH / 2); g.rotate(f.rot);
          const s = U.clamp(f.life / 1.2, 0, 1);
          g.globalAlpha = s;
          D.rect(g, (-BW / 2) * s, (-BH / 2) * s, BW * s, BH * s, P.flash && f.white > 0 ? '#fff' : brickColor(f.r));
          g.restore();
        }
        g.globalAlpha = 1;
        // 파티클
        if (P.particles) for (const q of parts) {
          g.globalAlpha = U.clamp(q.life / 0.5, 0, 1);
          const sz = q.sz * k;
          g.save(); g.translate(q.x, q.y); g.rotate(q.rot);
          D.rect(g, -sz / 2, -sz / 2, sz, sz, P.color ? brickColor(q.r, 68) : '#c8ccd4');
          g.restore();
        }
        g.globalAlpha = 1;
        // 공 꼬리
        if (P.trail) for (let i = 0; i < trail.length - 1; i++) {
          const f = i / trail.length;
          D.circle(g, trail[i].x, trail[i].y, BR * f, P.color ? `rgba(255,220,120,${f * 0.5})` : `rgba(255,255,255,${f * 0.4})`);
        }
        // 공 (속도 방향 스트레치 + 충돌 스쿼시)
        g.save(); g.translate(ball.x, ball.y);
        if (P.squash) {
          const ang = Math.atan2(ball.vy, ball.vx);
          const st = 1 + U.clamp(ball.speed / 1200, 0, 0.5) * k * (ball.wait > 0 ? 0 : 1) + ballSquash.s * k;
          g.rotate(ang); g.scale(st, 1 / st);
        }
        D.circle(g, 0, 0, BR, P.color ? '#ffd166' : '#e6e6e6');
        g.restore();
        // 패들 (스프링 출렁임 + 이동 시 늘어남)
        let pw = pad.w, ph = PADH, py = PADY;
        if (P.squash) {
          const stretch = 1 + U.clamp(Math.abs(pad.vx) / 520, 0, 1) * 0.18 * k;
          const sy = 1 - U.clamp(padSpring.y * 0.01, -0.5, 0.6);
          pw *= stretch / Math.sqrt(sy); ph *= sy; py = PADY + (PADH - ph) / 2 + padSpring.y * 0.04;
        }
        D.rect(g, pad.x - pw / 2, py, pw, ph, P.color ? (smile > 0 && P.flash ? '#9ef0ff' : C.b) : '#b9bec8');
        if (P.eyes) {
          for (const s of [-1, 1]) {
            const ex = pad.x + s * 12, ey = py - 4;
            D.circle(g, ex, ey, 6, '#fff');
            const a = Math.atan2(ball.y - ey, ball.x - ex);
            D.circle(g, ex + Math.cos(a) * 2.5, ey + Math.sin(a) * 2.5, 2.6, '#111');
          }
          if (smile > 0) { g.beginPath(); g.arc(pad.x, py + ph * 0.35, 6, 0.15 * Math.PI, 0.85 * Math.PI); g.strokeStyle = '#111'; g.lineWidth = 2; g.stroke(); }
        }
        if (P.demo && idle <= 2.5) D.text(g, GTL.L('수동 조작 중', 'Manual control'), WW - 10, WH - 18, { size: 11, color: C.warn, align: 'right' });
        g.restore();
        const on = ['tween', 'color', 'squash', 'breakAnim', 'particles', 'shake', 'flash', 'trail', 'eyes'].filter((q) => P[q]).length;
        ctx.stat(GTL.L('점수 / 놓친 공', 'Score / missed balls'), `${score} / ${lost}`);
        ctx.stat(GTL.L('주스 요소', 'Juice elements'), `${on} / 9`);
        ctx.stat(GTL.L('파티클', 'Particles'), P.particles ? parts.length : 0);
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
