// 고정 타임스텝 vs 가변 타임스텝 (+ 렌더 보간)
// 참조 샘플: 새 샘플 작성 시 이 파일의 구조를 따름.
GTL.register({
  id: 'fixed-timestep',
  title: '고정 타임스텝 & 렌더 보간',
  summary: '프레임 시간(dt)을 그대로 물리에 쓰면 프레임레이트에 따라 결과가 달라짐. 고정 스텝과 렌더 보간을 함께 쓰면 같은 결과와 부드러운 화면을 모두 얻음.',
  views: { a: '가변 dt', b: '고정 스텝 + 보간' },
  controls: '조작 없음. 캐릭터가 자동으로 점프를 반복함.',
  info: `
    <p><b>고정 타임스텝</b>은 물리를 항상 같은 시간 간격(<code>dt</code>)으로 진행하는 게임 루프 방식.</p>
    <p>매 프레임 잰 <code>dt</code>를 그대로 쓰면(가변 타임스텝) 프레임레이트에 따라 적분 오차가 달라짐.
    그래서 <b>점프 높이와 충돌 결과가 기기마다 달라짐</b>. 프레임이 크게 튀면 벽을 뚫기도 함.</p>
    <p>동작 원리:</p>
    <ul>
      <li>실제로 흐른 시간을 <code>accumulator</code>에 쌓음.</li>
      <li>쌓인 시간만큼 같은 <code>dt</code>로 물리를 여러 번 진행함.</li>
      <li>남은 시간 비율 <code>alpha = accumulator / dt</code>로 이전 상태와 현재 상태를 <b>보간해 그림</b>. 물리 주기가 낮아도 화면이 부드러움.</li>
    </ul>
    <p>단점: 보간 때문에 화면이 물리보다 최대 한 스텝 늦음. 한 프레임에 스텝이 너무 많이 쌓이면 밀린 시간을 버려야 함.</p>
    <p>이 샘플은 호스트 프레임레이트와 지터(프레임 시간의 흔들림)를 <b>흉내 냄</b>. 두 뷰는 같은 시드로 같은 프레임 타이밍을 받음.</p>`,
  // 도식: 길이가 제각각인 프레임과 고정 간격 물리 스텝, 남은 시간으로 보간하는 위치
  diagram: (L) => `<svg viewBox="0 0 540 178" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="4" y="30">${L('실제 프레임', 'Real frames')}</text>
    <text x="4" y="44" class="t-dim t-small">${L('가변 dt', 'variable dt')}</text>
    <rect x="120" y="18" width="70" height="26" class="f-dim"/><rect x="190" y="18" width="40" height="26" class="f-dim"/>
    <rect x="230" y="18" width="110" height="26" class="f-dim"/><rect x="340" y="18" width="55" height="26" class="f-dim"/>
    <rect x="395" y="18" width="90" height="26" class="f-dim"/>
    <text x="155" y="35" text-anchor="middle" class="t-small t-mono">16ms</text><text x="210" y="35" text-anchor="middle" class="t-small t-mono">9</text>
    <text x="285" y="35" text-anchor="middle" class="t-small t-mono">25ms</text><text x="367" y="35" text-anchor="middle" class="t-small t-mono">12</text>
    <text x="440" y="35" text-anchor="middle" class="t-small t-mono">20ms</text>
    <text x="4" y="92">${L('물리 스텝', 'Physics steps')}</text>
    <text x="4" y="106" class="t-dim t-small">${L('고정 dt', 'fixed dt')}</text>
    <line x1="120" y1="90" x2="530" y2="90" class="d-dim"/>
    ${[120, 170, 220, 270, 320, 370, 420, 470, 520].map((x) => `<line x1="${x}" y1="80" x2="${x}" y2="100" class="d-b"/>`).join('')}
    <line x1="340" y1="12" x2="340" y2="150" class="d-accent" stroke-dasharray="4 3"/>
    <text x="344" y="160" class="t-small" fill="currentColor">${L('이 프레임의 렌더 시점', 'render time of this frame')}</text>
    <path d="M320,114 L340,114" class="d-accent" marker-start="url(#arr)" marker-end="url(#arr)"/>
    <text x="330" y="128" text-anchor="middle" class="t-small">acc</text>
    <circle cx="320" cy="140" r="4" class="f-dim"/><circle cx="370" cy="140" r="4" class="f-dim"/>
    <circle cx="340" cy="140" r="5" class="f-a"/>
    <text x="120" y="144" class="t-small t-dim">${L('이전 상태, 현재 상태 사이를', 'Blend previous and current state')}</text>
    <text x="120" y="157" class="t-small t-dim">${L('alpha = acc / dt 비율로 보간', 'by alpha = acc / dt')}</text>
    <text x="4" y="176" class="t-small t-dim">${L('프레임 길이와 상관없이 물리는 항상 같은 간격으로 진행됨', 'Physics always advances by the same interval, whatever the frame length')}</text>
  </svg>`,
  look: [
    '호스트 FPS를 15 이하로 낮추고 지터를 올리면 A의 점프 높이(주황 눈금)가 매번 달라짐. B는 항상 같은 높이.',
    'B에서 물리 주기를 10~20Hz로 낮추고 "렌더 보간"을 끄면 가로 이동 박스가 계단식으로 끊김. 다시 켜면 부드러워짐.',
    '"프레임 스파이크"를 켜면 A는 한 번에 큰 dt를 받아 크게 튐. B는 프레임당 최대 스텝 제한(spiral of death 방지) 덕분에 안정적임.',
  ],
  refs: [
    { type: 'article', title: 'Fix Your Timestep!', url: 'https://gafferongames.com/post/fix_your_timestep/', year: 2004, note: 'Glenn Fiedler. accumulator와 보간 패턴의 고전.' },
    { type: 'article', title: 'Game Programming Patterns - Game Loop', url: 'https://gameprogrammingpatterns.com/game-loop.html', year: 2014, note: 'Robert Nystrom.' },
    { type: 'engine', title: 'Unity - FixedUpdate / Time.fixedDeltaTime', url: 'https://docs.unity3d.com/Manual/fixed-updates.html', note: '물리는 FixedUpdate에서 진행. Rigidbody Interpolate 옵션이 렌더 보간.' },
    { type: 'engine', title: 'Godot - physics_ticks_per_second & physics interpolation', url: 'https://docs.godotengine.org/en/stable/tutorials/physics/interpolation/index.html', year: 2024, note: 'Godot 4.3에서 2D, 4.4에서 3D 물리 보간 도입.' },
  ],
  params: [
    { key: 'hostFps', label: '호스트 FPS', type: 'int', min: 5, max: 144, default: 24, shared: true, group: '프레임 시뮬레이션', help: '실제 게임의 프레임레이트를 흉내 냄' },
    { key: 'jitter', label: '프레임 지터', type: 'range', min: 0, max: 1, step: 0.01, default: 0.5, shared: true, help: '프레임 시간이 무작위로 흔들리는 비율' },
    { key: 'spikes', label: '프레임 스파이크', type: 'bool', default: false, shared: true, help: '가끔 250ms짜리 긴 프레임 발생' },
    { key: 'mode', label: '루프 방식', type: 'select', group: '루프', options: [
      { value: 'variable', label: '가변 dt' },
      { value: 'fixed', label: '고정 스텝' },
    ], a: 'variable', b: 'fixed' },
    { key: 'physHz', label: '물리 주기 (Hz)', type: 'int', min: 5, max: 240, default: 60, when: (p) => p.mode === 'fixed' },
    { key: 'interp', label: '렌더 보간', type: 'bool', default: true, when: (p) => p.mode === 'fixed', help: 'alpha = acc/dt 비율로 이전 상태와 현재 상태를 보간' },
    { key: 'maxSteps', label: '프레임당 최대 스텝', type: 'int', min: 1, max: 20, default: 8, when: (p) => p.mode === 'fixed' },
    { key: 'integrator', label: '적분기', type: 'select', options: [
      { value: 'semi', label: 'Semi-implicit Euler' },
      { value: 'euler', label: 'Explicit Euler' },
    ], default: 'semi', shared: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Fixed Timestep & Render Interpolation',
    summary: 'If you feed the frame time (dt) straight into physics, results change with the frame rate. A fixed step plus render interpolation gives the same results and a smooth picture.',
    views: { a: 'Variable dt', b: 'Fixed step + interp' },
    controls: 'No input. The character jumps on its own.',
    info: `
    <p>A <b>fixed timestep</b> is a game loop that always advances physics by the same time interval (<code>dt</code>).</p>
    <p>If you use the measured <code>dt</code> of each frame (variable timestep), integration error changes with the frame rate.
    So <b>jump height and collision results differ between devices</b>. A large frame spike can even push objects through walls.</p>
    <p>How it works:</p>
    <ul>
      <li>Add the real elapsed time to an <code>accumulator</code>.</li>
      <li>Step physics with the same <code>dt</code> as many times as the accumulated time allows.</li>
      <li><b>Interpolate between the previous and current state</b> with the leftover ratio <code>alpha = accumulator / dt</code>. The picture stays smooth even with a low physics rate.</li>
    </ul>
    <p>Downside: interpolation makes the picture up to one step behind physics. If too many steps pile up in one frame, you must drop the extra time.</p>
    <p>This sample <b>simulates</b> the host frame rate and jitter (random variation in frame time). Both views get the same frame timing from the same seed.</p>`,
    look: [
      'Lower host FPS to 15 or less and raise jitter. A\'s jump height (orange ticks) changes every time. B always reaches the same height.',
      'In B, lower the physics rate to 10~20 Hz and turn off "Render interpolation". The sliding box moves in steps. Turn it back on and it moves smoothly.',
      'Turn on "Frame spikes". A gets one huge dt and jumps wildly. B stays stable thanks to the max steps per frame limit (prevents the spiral of death).',
    ],
    refs: ['Glenn Fiedler. The classic write-up of the accumulator and interpolation pattern.', 'Robert Nystrom.', 'Physics runs in FixedUpdate. The Rigidbody Interpolate option is render interpolation.', 'Godot 4.3 added 2D physics interpolation, and 4.4 added 3D.'],
    params: {
      hostFps: { label: 'Host FPS', help: 'Simulates the frame rate of a real game', group: 'Frame simulation' },
      jitter: { label: 'Frame jitter', help: 'How much frame time varies at random' },
      spikes: { label: 'Frame spikes', help: 'Sometimes inserts a long 250 ms frame' },
      mode: { label: 'Loop mode', group: 'Loop', options: { variable: 'Variable dt', fixed: 'Fixed step' } },
      physHz: 'Physics rate (Hz)',
      interp: { label: 'Render interpolation', help: 'Blend the previous and current state by alpha = acc/dt' },
      maxSteps: 'Max steps per frame',
      integrator: 'Integrator',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors;
    const P = ctx.params;
    const GRAV = 1800, JUMP_V = 820, MOVE_SPEED = 260;
    const idealApex = (JUMP_V * JUMP_V) / (2 * GRAV);

    let s, prev, hostAcc, nextFrame, acc, apexes, trail, steps, frameDt, spikeTimer;
    const init = () => {
      s = { y: 0, vy: 0, x: 0, maxY: 0 };    // y: 지면 위 높이(px), 위쪽이 +
      prev = { ...s };
      hostAcc = 0; acc = 0; nextFrame = 0; steps = 0; frameDt = 0; spikeTimer = 2;
      apexes = []; trail = [];
      ctx.rng = U.rng(ctx.seed);             // 리셋 시 같은 프레임 타이밍 재현
    };
    init();

    function step(dt) {
      if (s.y <= 0 && s.vy <= 0) {           // 착지 → 기록 후 즉시 다시 점프
        if (s.maxY > 0) { apexes.push(s.maxY); if (apexes.length > 12) apexes.shift(); }
        s.y = 0; s.vy = JUMP_V; s.maxY = 0;
      }
      if (P.integrator === 'semi') { s.vy -= GRAV * dt; s.y += s.vy * dt; }
      else { s.y += s.vy * dt; s.vy -= GRAV * dt; }
      if (s.y < 0) s.y = 0;
      s.maxY = Math.max(s.maxY, s.y);
      s.x = (s.x + MOVE_SPEED * dt) % 10000;
      steps++;
    }

    // 시뮬레이션된 "호스트 프레임" 1회
    function hostFrame(dt) {
      frameDt = dt; steps = 0;
      if (P.mode === 'variable') {
        prev = { ...s };
        step(dt);
      } else {
        const h = 1 / P.physHz;
        acc += dt;
        let n = 0;
        while (acc >= h && n < P.maxSteps) { prev = { ...s }; step(h); acc -= h; n++; }
        if (n >= P.maxSteps) acc = 0;        // spiral of death 방지: 밀린 시간 버림
      }
      const alpha = P.mode === 'fixed' && P.interp ? U.clamp(acc * P.physHz, 0, 1) : 1;
      const rx = U.lerp(prev.x, s.x, alpha), ry = U.lerp(prev.y, s.y, alpha);
      trail.push({ x: rx, y: ry });
      if (trail.length > 60) trail.shift();
    }

    return {
      update(dt) {
        hostAcc += dt;
        if (hostAcc >= nextFrame) {
          const elapsed = hostAcc;
          hostAcc = 0;
          spikeTimer -= elapsed;
          const base = 1 / P.hostFps;
          nextFrame = base * (1 + (ctx.random() * 2 - 1) * P.jitter * 0.9);
          if (P.spikes && spikeTimer <= 0) { nextFrame = 0.25; spikeTimer = 2 + ctx.random() * 2; }
          hostFrame(elapsed);
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const ground = H - 50, scale = Math.min(1, (ground - 40) / (idealApex * 1.25));
        D.grid(g, W, H, 40);
        D.line(g, 0, ground, W, ground, C.dim, 2);
        // 이상적인 점프 높이
        const iy = ground - idealApex * scale;
        g.setLineDash([6, 6]); D.line(g, 0, iy, W, iy, C.good, 1); g.setLineDash([]);
        D.text(g, GTL.L('이론 최고점 ', 'Ideal apex ') + idealApex.toFixed(0) + 'px', 8, iy - 16, { color: C.good, size: 11 });
        // 각 점프의 실제 최고점
        const col = ctx.side === 'a' ? C.a : C.b;
        apexes.forEach((a, i) => {
          const y = ground - a * scale;
          D.line(g, W * 0.18 + i * 10, y, W * 0.18 + i * 10 + 8, y, col, 3);
        });
        // 점프 캐릭터 (렌더된 위치 궤적)
        const cx = W * 0.3;
        for (let i = 0; i < trail.length; i++) {
          D.circle(g, cx, ground - trail[i].y * scale - 14, 3, `rgba(255,255,255,${(i / trail.length) * 0.35})`);
        }
        const last = trail[trail.length - 1] || { x: 0, y: 0 };
        D.rect(g, cx - 14, ground - last.y * scale - 28, 28, 28, col);
        // 가로 이동 박스: 끊김 확인용
        const lane = W * 0.45, laneW = W * 0.5;
        D.rect(g, lane, ground - 30, laneW, 2, C.grid);
        for (let i = Math.max(0, trail.length - 8); i < trail.length; i++) {
          D.rect(g, lane + (trail[i].x % laneW) - 10, ground - 52, 20, 20, `rgba(255,255,255,${0.06 + (i - trail.length + 8) * 0.05})`);
        }
        D.rect(g, lane + (last.x % laneW) - 10, ground - 52, 20, 20, col);

        const lastApex = apexes[apexes.length - 1] || 0;
        ctx.stat(GTL.L('호스트 dt', 'Host dt'), (frameDt * 1000).toFixed(1) + ' ms');
        ctx.stat(GTL.L('이번 프레임 물리 스텝', 'Physics steps this frame'), steps);
        ctx.stat(GTL.L('최근 최고점 오차', 'Last apex error'), lastApex ? (((lastApex - idealApex) / idealApex) * 100).toFixed(2) + ' %' : '-');
        if (apexes.length > 1) {
          const spread = Math.max(...apexes) - Math.min(...apexes);
          ctx.stat(GTL.L('최고점 편차(최대-최소)', 'Apex spread (max-min)'), spread.toFixed(1) + ' px');
        }
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
