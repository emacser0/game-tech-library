// 에임 어시스트: 마찰(감속), 자석(끌어당김), 추적(접착)
GTL.register({
  id: 'aim-assist',
  title: '에임 어시스트 (마찰 & 자석)',
  summary: '패드 스틱이나 부정확한 손으로 움직이는 목표를 조준하기는 어려움. 목표 근처에서 조준 속도를 줄이고(마찰), 살짝 끌어당기고(자석), 목표 움직임을 따라가게(추적) 하면 "내가 잘 쏜" 느낌이 남.',
  views: { a: '보조 없음', b: '마찰 + 자석 + 추적' },
  controls: '←→↑↓ / WASD 조준 (스틱처럼), 마우스 이동도 가능, Space / Z / 클릭 발사 (조작하면 자동 데모가 잠시 멈춤)',
  info: `
    <p><b>에임 어시스트</b>: 조준을 몰래 도와주는 보조 기법. 콘솔 슈터는 스틱의 낮은 정밀도를 보완하려고 여러 보조를 겹쳐 씀.
    모든 보조는 <b>목표 주변의 보조 반경</b> 안에서만 작동하고, 목표에 가까울수록 강해짐(falloff).</p>
    <ul>
      <li><b>마찰 (Friction / Slowdown)</b>: 반경 안에서 조준 속도에 <code>1 - friction × falloff</code>를 곱함. 목표를 지나쳐 버리는 오버슈트가 줄어듦.</li>
      <li><b>자석 (Magnetism / Pull)</b>: 플레이어가 조준을 움직이는 동안 조준점을 목표 중심 쪽으로 조금 당김. 입력이 없을 때 당기면 자동 조준처럼 느껴져서 보통 입력 중일 때만 적용.</li>
      <li><b>추적 (Adhesion / Tracking)</b>: 목표 이동 속도의 일부를 조준점에 더함. 움직이는 적 위에 조준이 "붙어" 있게 됨.</li>
    </ul>
    <p>자동 데모에서는 <b>같은 가상 플레이어</b>가 두 뷰를 조작. 이 플레이어에는 반응 지연(150ms)과 손떨림 노이즈가 있음. 입력은 같고, 결과 차이는 보조에서만 생김.</p>
    <p>단점: 보조가 너무 강하면 목표가 겹칠 때 엉뚱한 적에게 끌려가거나, 게임이 대신 쏘는 느낌을 줌</p>`,
  // 도식: 보조 반경 안에서 조준점 이동. A는 같은 간격으로 지나침, B는 간격이 줄며(마찰) 중심으로 휨(자석)
  diagram: (L) => `<svg viewBox="0 0 540 166" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arrA" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker><marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker><marker id="arrT" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <circle cx="190" cy="95" r="70" class="d-dim" stroke-dasharray="4 3"/>
    <circle cx="190" cy="95" r="35" class="d-dim" stroke-dasharray="2 3"/>
    <text x="190" y="20" text-anchor="middle" class="t-small t-dim">${L('보조 반경', 'assist radius')}</text>
    <circle cx="190" cy="95" r="10" class="f-accent"/>
    <path d="M190,108 L190,138" class="d-dim" marker-end="url(#arrT)"/>
    <text x="196" y="136" class="t-small t-dim">${L('목표 이동', 'target motion')}</text>
    <path d="M40,40 L330,130" class="d-a" marker-end="url(#arrA)"/>
    ${[[40, 40], [80, 52.4], [120, 64.8], [160, 77.2], [200, 89.6], [240, 102], [280, 114.4], [320, 126.8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5" class="f-a"/>`).join('')}
    <path d="M60,50 Q150,60 184,90" class="d-b" marker-end="url(#arrB)"/>
    ${[[60, 50], [101.6, 56.4], [136.5, 65.5], [159.5, 74.8], [171.3, 81.2], [179.9, 87]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5" class="f-b"/>`).join('')}
    <text x="350" y="40" class="t-small">${L('마찰: v × (1 - f × falloff)', 'friction: v × (1 - f × falloff)')}</text>
    <text x="350" y="60" class="t-small">${L('자석: 중심 쪽으로 당김 (입력 중)', 'magnet: pull to center (on input)')}</text>
    <text x="350" y="80" class="t-small">${L('추적: 목표 속도 일부를 더함', 'tracking: follow target velocity')}</text>
    <text x="350" y="100" class="t-small t-dim">${L('falloff: 중심 1, 반경 끝 0', 'falloff: 1 at center, 0 at edge')}</text>
    <text x="350" y="120" class="t-small t-dim">${L('점 = 같은 시간 간격의 조준점', 'dots = aim at equal time steps')}</text>
    <text x="4" y="158" class="t-small t-a">${L('A: 같은 속도로 지나침', 'A: passes at full speed')}</text>
    <text x="180" y="158" class="t-small t-b">${L('B: 반경 안에서 느려지고 목표로 휨', 'B: slows inside the radius and bends to the target')}</text>
  </svg>`,
  look: [
    '조준 궤적(꼬리)을 비교하면 A는 목표를 지나쳤다 돌아오는 S자 오버슈트가 큼. B는 반경 안에서 감속해 빨리 안착.',
    '"조준 유지율"과 "명중률" 수치를 비교하면 같은 가상 플레이어인데도 B가 훨씬 높음',
    'B의 자석을 1.0으로 올리고 "입력 중일 때만 자석"을 끄면 손을 떼도 조준이 끌려감. 과한 보조의 예.',
    '목표 속도를 올리면 마찰만으로는 오히려 따라가기 어려워짐. 추적(접착)을 켜면 이 문제가 줄어듦.',
  ],
  refs: [
    { type: 'game', title: 'Halo: Combat Evolved (Bungie, 2001)', note: '콘솔 FPS에서 조준 감속(reticle friction)과 탄 자석(bullet magnetism)을 대중화한 사례' },
    { type: 'book', title: 'Game Feel: A Game Designer\'s Guide to Virtual Sensation (Steve Swink)', year: 2008 },
    { type: 'engine', title: 'Unity Input System - Stick Deadzone processor', url: 'https://docs.unity3d.com/Packages/com.unity.inputsystem@1.7/manual/Processors.html', note: '스틱 입력 데드존/응답 곡선 처리' },
  ],
  params: [
    { key: 'friction', label: '마찰 (감속)', type: 'range', min: 0, max: 0.95, step: 0.01, a: 0, b: 0.55, group: '보조' },
    { key: 'magnet', label: '자석 (끌어당김)', type: 'range', min: 0, max: 1, step: 0.01, a: 0, b: 0.45 },
    { key: 'magnetOnInput', label: '입력 중일 때만 자석', type: 'bool', default: true, when: (p) => p.magnet > 0 },
    { key: 'adhesion', label: '추적 (접착)', type: 'range', min: 0, max: 1, step: 0.01, a: 0, b: 0.6 },
    { key: 'radius', label: '보조 반경 (px)', type: 'int', min: 20, max: 140, default: 60 },
    { key: 'showAssist', label: '보조 영역 표시', type: 'bool', default: true },
    { key: 'targetSpeed', label: '목표 속도', type: 'range', min: 0, max: 260, step: 5, default: 120, shared: true, group: '장면' },
    { key: 'shake', label: '데모: 손떨림', type: 'range', min: 0, max: 1, step: 0.01, default: 0.5, shared: true },
    { key: 'demo', label: '자동 데모', type: 'bool', default: true, shared: true },
    { key: 'restart', label: '처음부터', type: 'button', buttonLabel: '다시 시작' },
  ],
  en: {
    title: 'Aim Assist (Friction & Magnetism)',
    summary: 'Aiming at a moving target with a gamepad stick or an unsteady hand is hard. Near the target, slow the aim (friction), pull it a little (magnetism), and make it follow the target (tracking). Then it feels like "I made a good shot".',
    views: { a: 'No assist', b: 'Friction + magnetism + tracking' },
    controls: '←→↑↓ / WASD to aim (like a stick), mouse movement also works, Space / Z / click to fire (any input pauses the auto demo for a moment)',
    info: `
    <p><b>Aim assist</b> quietly helps the player aim. Console shooters stack several assists to make up for the low precision of sticks.
    Every assist works only inside an <b>assist radius around the target</b>, and it gets stronger closer to the target (falloff).</p>
    <ul>
      <li><b>Friction (slowdown)</b>: inside the radius, multiply aim speed by <code>1 - friction × falloff</code>. This reduces overshoot past the target.</li>
      <li><b>Magnetism (pull)</b>: while the player moves the aim, pull the reticle a little toward the target center. Pulling with no input feels like auto aim, so it usually applies only during input.</li>
      <li><b>Tracking (adhesion)</b>: add part of the target's velocity to the reticle. The aim then "sticks" to a moving enemy.</li>
    </ul>
    <p>In the auto demo, <b>the same virtual player</b> controls both views. This player has a reaction delay (150ms) and hand shake noise. The input is the same, so any difference comes only from the assist.</p>
    <p>Downside: if the assist is too strong, it can pull you to the wrong enemy when targets overlap, or feel like the game shoots for you.</p>`,
    look: [
      'Compare the aim trails. A has a big S shaped overshoot that passes the target and comes back. B slows inside the radius and settles quickly.',
      'Compare "Time on target" and "Hit rate". It is the same virtual player, but B is much higher.',
      'Raise B\'s magnetism to 1.0 and turn off "Magnetism only during input". The aim gets pulled even when you let go. This is an example of too much assist.',
      'Raise the target speed. Friction alone then makes it harder to keep up. Turning on tracking (adhesion) reduces this problem.',
    ],
    refs: [
      'Made reticle friction and bullet magnetism common in console FPS games.',
      null,
      'Dead zone and response curve processing for stick input.',
    ],
    params: {
      friction: { label: 'Friction (slowdown)', group: 'Assist' },
      magnet: 'Magnetism (pull)',
      magnetOnInput: 'Magnetism only during input',
      adhesion: 'Tracking (adhesion)',
      radius: 'Assist radius (px)',
      showAssist: 'Show assist area',
      targetSpeed: { label: 'Target speed', group: 'Scene' },
      shake: 'Demo: hand shake',
      demo: 'Auto demo',
      restart: { label: 'Start over', buttonLabel: 'Restart' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 640, WH = 360, STEP = 1 / 120, MAX_AIM = 520, TR = 14, DELAY = 0.15;
    const col = ctx.side === 'a' ? C.a : C.b;
    const KEYS = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'], fire: ['Space', 'KeyZ'] };
    const ALL = [...KEYS.left, ...KEYS.right, ...KEYS.up, ...KEYS.down, ...KEYS.fire];
    const noise = U.noise(ctx.seed + 5);

    let demoSt, targets, ret, t, acc, idle, hist, shots, stat, focus, fireCD, pendingFire, mouseDelta, lastMouse, trail;
    function init() {
      const r = U.rng(ctx.seed + 3);
      targets = Array.from({ length: 4 }, (_, i) => ({
        x: r.range(120, 520), y: r.range(80, 280), ph: r.range(0, 10), fx: r.range(0.25, 0.55), fy: r.range(0.3, 0.6), vx: 0, vy: 0, flash: 0, id: i,
      }));
      ret = { x: WW / 2, y: WH / 2, vx: 0, vy: 0, pull: { x: 0, y: 0 } };
      t = 0; acc = 0; idle = 99; hist = []; shots = []; trail = [];
      stat = { shots: 0, hits: 0, onT: 0, tot: 0 };
      focus = 0; fireCD = 0; demoSt = { x: 0, y: 0 }; pendingFire = false; mouseDelta = { x: 0, y: 0 }; lastMouse = null;
    }
    init();

    // 목표: 시간에 대한 결정적 궤적(리사주) → A/B 동일
    function moveTargets() {
      const s = P.targetSpeed / 120;
      for (const tg of targets) {
        tg.ph += STEP * s;
        const nx = 320 + Math.sin(tg.ph * tg.fx * 2 + tg.id * 1.7) * 230;
        const ny = 180 + Math.sin(tg.ph * tg.fy * 2.3 + tg.id) * 120;
        tg.vx = (nx - tg.x) / STEP; tg.vy = (ny - tg.y) / STEP;
        tg.x = nx; tg.y = ny;
        tg.flash = Math.max(0, tg.flash - STEP);
      }
    }

    // 보조 계산: 가장 가까운 목표와 falloff(0..1)
    function nearest(x, y) {
      let best = null, bd = Infinity;
      for (const tg of targets) { const d = Math.hypot(tg.x - x, tg.y - y); if (d < bd) { bd = d; best = tg; } }
      const fall = U.clamp(1 - (bd - TR * 0.3) / P.radius, 0, 1);
      return { tg: best, d: bd, fall };
    }

    // 가상 플레이어: 지연된 지각 + 비례 제어 + 손떨림 → 스틱 값
    function demoStick() {
      const k = Math.round(DELAY / STEP);
      const lag = hist[Math.max(0, hist.length - 1 - k)], lag2 = hist[Math.max(0, hist.length - 7 - k)];
      const tg = lag ? lag[focus] : targets[focus], tg2 = lag2 ? lag2[focus] : tg;
      // 지연된 위치 + 지각한 속도로 예측 (사람은 움직이는 목표를 앞질러 봄)
      const pvx = (tg.x - tg2.x) / (6 * STEP), pvy = (tg.y - tg2.y) / (6 * STEP);
      const ex = tg.x + pvx * DELAY - ret.x, ey = tg.y + pvy * DELAY - ret.y;
      let sx = ex / 60 + (pvx / MAX_AIM) * 0.8, sy = ey / 60 + (pvy / MAX_AIM) * 0.8;
      const sh = P.shake;
      sx += noise.perlin2(t * 3.1, 0.5) * 1.2 * sh;
      sy += noise.perlin2(0.5, t * 3.3) * 1.2 * sh;
      // 손의 관성: 스틱 값이 즉시 바뀌지 않아 목표를 지나치는 오버슈트가 생김
      demoSt.x = U.damp(demoSt.x, U.clamp(sx, -1, 1), 9, STEP);
      demoSt.y = U.damp(demoSt.y, U.clamp(sy, -1, 1), 9, STEP);
      const fire = Math.hypot(ex, ey) < TR * 1.4;
      return { sx: demoSt.x, sy: demoSt.y, fire };
    }

    function step(inp) {
      t += STEP;
      moveTargets();
      hist.push(targets.map((q) => ({ x: q.x, y: q.y })));
      if (hist.length > 60) hist.shift();
      if (Math.floor(t / 3) !== Math.floor((t - STEP) / 3)) focus = (focus + 1) % targets.length;

      const n = nearest(ret.x, ret.y);
      // 원래 입력이 만드는 이동량
      let dx = inp.sx * MAX_AIM * STEP + inp.mx, dy = inp.sy * MAX_AIM * STEP + inp.my;
      const moving = Math.hypot(dx, dy) > 0.05;
      // 마찰
      const fr = 1 - P.friction * n.fall;
      dx *= fr; dy *= fr;
      // 자석
      ret.pull = { x: 0, y: 0 };
      if (P.magnet > 0 && n.fall > 0 && (moving || !P.magnetOnInput)) {
        const k = P.magnet * n.fall * 6 * STEP;
        ret.pull = { x: (n.tg.x - ret.x) * k, y: (n.tg.y - ret.y) * k };
        dx += ret.pull.x; dy += ret.pull.y;
      }
      // 추적(접착)
      if (P.adhesion > 0 && n.fall > 0) { dx += n.tg.vx * STEP * P.adhesion * n.fall; dy += n.tg.vy * STEP * P.adhesion * n.fall; }
      ret.x = U.clamp(ret.x + dx, 0, WW); ret.y = U.clamp(ret.y + dy, 0, WH);
      trail.push({ x: ret.x, y: ret.y });
      if (trail.length > 90) trail.shift();

      const n2 = nearest(ret.x, ret.y);
      stat.tot += STEP; if (n2.d < TR) stat.onT += STEP;
      fireCD -= STEP;
      if (inp.fire && fireCD <= 0) {
        fireCD = 0.3; stat.shots++;
        const hit = n2.d < TR;
        if (hit) { stat.hits++; n2.tg.flash = 0.15; }
        shots.push({ x: ret.x, y: ret.y, hit, life: 0.8 });
      }
      for (const s of shots) s.life -= STEP;
      shots = shots.filter((s) => s.life > 0);
    }

    return {
      update(dt) {
        const kb = ctx.input, m = ctx.input.mouse;
        const sc = Math.min(ctx.width / WW, ctx.height / WH);
        const ax = (KEYS.right.some(kb.key) ? 1 : 0) - (KEYS.left.some(kb.key) ? 1 : 0);
        const ay = (KEYS.down.some(kb.key) ? 1 : 0) - (KEYS.up.some(kb.key) ? 1 : 0);
        const firePressed = KEYS.fire.some(kb.pressed) || m.pressed;
        let mdx = 0, mdy = 0;
        if (m.inside && lastMouse) { mdx = (m.x - lastMouse.x) / sc; mdy = (m.y - lastMouse.y) / sc; }
        lastMouse = m.inside ? { x: m.x, y: m.y } : null;
        const touched = ALL.some(kb.key) || firePressed || Math.abs(mdx) + Math.abs(mdy) > 0.5;
        idle = touched ? 0 : idle + dt;
        const auto = P.demo && idle > 2.5;
        if (!auto) { mouseDelta.x += mdx; mouseDelta.y += mdy; if (firePressed) pendingFire = true; }
        acc += dt;
        let first = true;
        while (acc >= STEP) {
          acc -= STEP;
          let inp;
          if (auto) { const d = demoStick(); inp = { sx: d.sx, sy: d.sy, mx: 0, my: 0, fire: d.fire }; }
          else {
            const len = Math.hypot(ax, ay) || 1;
            inp = { sx: ax / len, sy: ay / len, mx: first ? mouseDelta.x : 0, my: first ? mouseDelta.y : 0, fire: pendingFire || KEYS.fire.some(kb.key) || m.down };
            if (first) { mouseDelta.x = mouseDelta.y = 0; pendingFire = false; }
          }
          first = false;
          step(inp);
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const sc = Math.min(W / WW, H / WH), ox = (W - WW * sc) / 2, oy = (H - WH * sc) / 2;
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        D.rect(g, 0, 0, WW, WH, '#181b22');
        D.grid(g, WW, WH, 40);
        for (const tg of targets) {
          if (P.showAssist && (P.friction > 0 || P.magnet > 0 || P.adhesion > 0)) {
            D.circle(g, tg.x, tg.y, TR * 0.3 + P.radius, 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.12)', 1);
          }
          const isF = tg.id === focus && P.demo && idle > 2.5;
          D.circle(g, tg.x, tg.y, TR, tg.flash > 0 ? '#fff' : isF ? '#c75b5b' : '#7a4848');
          D.circle(g, tg.x, tg.y, TR * 0.55, null, 'rgba(255,255,255,0.6)', 1.5);
          D.circle(g, tg.x, tg.y, 2, '#fff');
        }
        // 조준 궤적
        for (let i = 1; i < trail.length; i++) {
          g.globalAlpha = i / trail.length * 0.8;
          D.line(g, trail[i - 1].x, trail[i - 1].y, trail[i].x, trail[i].y, col, 2);
        }
        g.globalAlpha = 1;
        for (const s of shots) {
          g.globalAlpha = s.life / 0.8;
          if (s.hit) D.circle(g, s.x, s.y, 6 + (0.8 - s.life) * 20, null, C.good, 2);
          else { D.line(g, s.x - 4, s.y - 4, s.x + 4, s.y + 4, C.bad, 2); D.line(g, s.x + 4, s.y - 4, s.x - 4, s.y + 4, C.bad, 2); }
        }
        g.globalAlpha = 1;
        // 조준점
        const n = nearest(ret.x, ret.y), on = n.d < TR;
        D.circle(g, ret.x, ret.y, 9, null, on ? C.good : '#fff', 1.5);
        D.line(g, ret.x - 15, ret.y, ret.x - 5, ret.y, '#fff', 1.5); D.line(g, ret.x + 5, ret.y, ret.x + 15, ret.y, '#fff', 1.5);
        D.line(g, ret.x, ret.y - 15, ret.x, ret.y - 5, '#fff', 1.5); D.line(g, ret.x, ret.y + 5, ret.x, ret.y + 15, '#fff', 1.5);
        if (P.showAssist && n.fall > 0 && (P.friction > 0 || P.magnet > 0)) {
          D.rect(g, ret.x + 14, ret.y + 12, 34, 4, 'rgba(255,255,255,0.15)');
          D.rect(g, ret.x + 14, ret.y + 12, 34 * n.fall, 4, col);
          if (Math.hypot(ret.pull.x, ret.pull.y) > 0.01) D.arrow(g, ret.x, ret.y, ret.x + ret.pull.x * 40, ret.y + ret.pull.y * 40, C.warn, 1.5, 5);
        }
        if (P.demo && idle <= 2.5) D.text(g, GTL.L('수동 조작 중', 'Manual control'), WW - 10, 10, { size: 11, color: C.warn, align: 'right' });
        g.restore();
        ctx.stat(GTL.L('명중률', 'Hit rate'), stat.shots ? `${((stat.hits / stat.shots) * 100).toFixed(0)}% (${stat.hits}/${stat.shots})` : '-');
        ctx.stat(GTL.L('조준 유지율', 'Time on target'), stat.tot ? `${((stat.onT / stat.tot) * 100).toFixed(0)}%` : '-');
        ctx.stat(GTL.L('보조 강도 (falloff)', 'Assist strength (falloff)'), n.fall.toFixed(2));
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
