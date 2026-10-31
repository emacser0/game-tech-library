// 서브스텝(Substepping): 단단한 스프링 체인의 안정성 vs 서브스텝 수
GTL.register({
  id: 'physics-substepping',
  title: '서브스텝 & 강성 스프링 안정성',
  summary: '단단한(stiff) 스프링은 dt가 고유 주기보다 크면 명시적 적분에서 폭발. 한 프레임을 잘게 나눠 여러 번 적분(서브스텝)하면 같은 강성에서도 안정됨.',
  views: { a: '서브스텝 1', b: '서브스텝 8' },
  controls: '마우스 드래그: 체인 입자 잡아끌기',
  info: `
    <p><b>서브스텝</b>은 렌더 프레임 하나 안에서 물리를 <code>n</code>번, <code>dt/n</code> 간격으로 진행하는 방법</p>
    <p>단단한 스프링은 큰 dt에서 불안정함. 강성 <code>k</code>, 질량 <code>m</code>인 스프링의 고유 각진동수는 <code>ω = √(k/m)</code>.
    입자 체인에서는 이웃 입자가 서로 반대로 떠는 진동이 <code>ω_max ≈ 2√(k/m)</code>까지 올라감.
    Semi-implicit Euler는 <code>ω*dt &lt; 2</code>일 때만 안정함. 그래서 60Hz(dt=16.7ms)에서 강성을 올리면 체인이 바로 <b>폭발</b>.</p>
    <p>서브스텝을 쓰면 안정 조건이 <code>n</code>배 느슨해짐. 최근 엔진은 반복(iteration)보다 서브스텝을 늘리는 쪽이 같은 비용에서 더 단단하고 안정적이라는 결과를 활용.</p>
    <ul>
      <li>Box2D v3의 soft step</li>
      <li>PhysX TGS</li>
      <li>XPBD "Small Steps"</li>
    </ul>
    <p>단점: 비용도 <code>n</code>배로 늘어남</p>
    <p>오른쪽 위 게이지는 안정성 지표 <code>2√(k/m)*dt_sub</code>. 2를 넘으면(빨강) 오차가 매 스텝 커짐.</p>`,
  // 도식: 한 프레임을 1스텝 vs 8서브스텝으로 나눔. 안정성 지표 2√(k/m) × dt가 2 미만이어야 안정
  diagram: (L) => {
    const X = (v) => 40 + v * 92;
    return `<svg viewBox="0 0 540 176" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="32" class="t-a">${L('A: 1 스텝', 'A: 1 step')}</text>
    <rect x="130" y="18" width="400" height="20" class="f-dim"/>
    <text x="330" y="32" text-anchor="middle" class="t-small t-mono">dt = 16.7 ms</text>
    <text x="10" y="64" class="t-b">${L('B: 8 서브스텝', 'B: 8 substeps')}</text>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${130 + i * 50}" y="50" width="50" height="20" class="f-dim"/>`).join('')}
    <text x="155" y="64" text-anchor="middle" class="t-small t-mono">2.1</text>
    <text x="10" y="102" class="t-small">${L('안정성 지표 2√(k/m) × dt (k/m = 20000)', 'Stability 2√(k/m) × dt (k/m = 20000)')}</text>
    <line x1="${X(0)}" y1="130" x2="${X(2)}" y2="130" class="d-good" stroke-width="5"/>
    <line x1="${X(2)}" y1="130" x2="${X(5)}" y2="130" class="d-bad" stroke-width="5"/>
    ${[0, 1, 2, 3, 4, 5].map((v) => `<line x1="${X(v)}" y1="124" x2="${X(v)}" y2="136" class="d-dim"/><text x="${X(v)}" y="150" text-anchor="middle" class="t-small t-mono">${v}</text>`).join('')}
    <text x="${X(1)}" y="166" text-anchor="middle" class="t-small">${L('안정', 'stable')}</text>
    <text x="${X(3.5)}" y="166" text-anchor="middle" class="t-small">${L('오차가 매 스텝 커짐 (폭발)', 'error grows every step (explodes)')}</text>
    <circle cx="${X(4.71)}" cy="130" r="6" class="f-a"/><text x="${X(4.71)}" y="118" text-anchor="middle" class="t-small t-mono">A 4.7</text>
    <circle cx="${X(0.59)}" cy="130" r="6" class="f-b"/><text x="${X(0.59)}" y="118" text-anchor="middle" class="t-small t-mono">B 0.59</text>
  </svg>`;
  },
  look: [
    'A(서브스텝 1)를 시작하면 체인이 바로 폭발하고 재시작을 반복. B(8)는 같은 강성에서 매끄럽게 흔들림.',
    'A의 서브스텝을 2, 3, 4로 올리면 게이지가 2 아래로 내려가는 순간부터 안정됨',
    'B의 강성을 최대로 올리면 B도 결국 폭발. 필요한 서브스텝 수는 √k에 비례.',
    '"끝 추"를 켜면(질량 20배) 무거운 추가 체인을 크게 늘림. 안정성은 가벼운 입자가 정하므로 게이지는 그대로임.',
  ],
  refs: [
    { type: 'paper', title: 'Small Steps in Physics Simulation (Macklin et al.)', year: 2019, note: 'SCA 2019. 반복보다 서브스텝이 효율적이라는 XPBD 결과.' },
    { type: 'article', title: 'Solver2D (Erin Catto)', url: 'https://box2d.org/posts/2024/02/solver2d/', year: 2024, note: 'Box2D v3 솔버 비교. Soft step은 서브스텝과 소프트 제약의 조합.' },
    { type: 'engine', title: 'Unreal Engine - Physics Sub-stepping', note: 'Project Settings > Physics > Substepping. 프레임 dt를 최대 서브스텝 dt로 나눠 여러 번 시뮬레이션.' },
    { type: 'article', title: 'Spring Physics (Glenn Fiedler)', url: 'https://gafferongames.com/post/spring_physics/', year: 2004 },
  ],
  params: [
    { key: 'substeps', label: '서브스텝 수', type: 'int', min: 1, max: 32, a: 1, b: 8, default: 1, group: '솔버' },
    { key: 'stiffness', label: '스프링 강성 k/m', type: 'range', min: 200, max: 60000, step: 100, default: 20000 },
    { key: 'damping', label: '스프링 감쇠', type: 'range', min: 0, max: 20, step: 0.5, default: 3, help: '스프링 방향 상대 속도를 줄이는 정도 (1/s)' },
    { key: 'hz', label: '프레임 주기 (Hz)', type: 'int', min: 20, max: 120, default: 60 },
    { key: 'segments', label: '체인 마디 수', type: 'int', min: 4, max: 40, default: 18, shared: true, reset: true, group: '장면' },
    { key: 'heavy', label: '끝 추 (질량 ×20)', type: 'bool', default: false, shared: true, reset: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Substepping & Stiff Spring Stability',
    summary: 'With explicit integration, a stiff spring blows up when dt is larger than its natural period. Split each frame into smaller pieces and integrate several times (substeps). The same stiffness then stays stable.',
    views: { a: '1 substep', b: '8 substeps' },
    controls: 'Mouse drag: grab and pull a chain particle',
    info: `
    <p><b>Substepping</b> runs physics <code>n</code> times inside one render frame, each time with an interval of <code>dt/n</code>.</p>
    <p>Stiff springs are unstable at large dt. A spring with stiffness <code>k</code> and mass <code>m</code> has a natural angular frequency of <code>ω = √(k/m)</code>.
    In a particle chain, the mode where neighbors shake against each other goes up to <code>ω_max ≈ 2√(k/m)</code>.
    Semi-implicit Euler is stable only when <code>ω*dt &lt; 2</code>. So at 60 Hz (dt=16.7 ms), raising the stiffness makes the chain <b>blow up</b> right away.</p>
    <p>Substepping relaxes the stability limit by a factor of <code>n</code>. Recent engines use the finding that, for the same cost, more substeps give stiffer and more stable results than more iterations.</p>
    <ul>
      <li>Box2D v3 soft step</li>
      <li>PhysX TGS</li>
      <li>XPBD "Small Steps"</li>
    </ul>
    <p>Downside: the cost also grows <code>n</code> times.</p>
    <p>The gauge at the top right is the stability measure <code>2√(k/m)*dt_sub</code>. Above 2 (red), the error grows every step.</p>`,
    look: [
      'Start A (1 substep). The chain blows up right away and keeps restarting. B (8) swings smoothly at the same stiffness.',
      'Raise A\'s substeps to 2, 3, 4. It becomes stable as soon as the gauge drops below 2.',
      'Raise B\'s stiffness to the max. B also blows up in the end. The substeps you need grow with √k.',
      'Turn on "End weight" (20x mass). The heavy weight stretches the chain a lot. The light particles set the stability, so the gauge does not change.',
    ],
    refs: [
      'SCA 2019. The XPBD finding that substeps are more efficient than iterations.',
      'Compares Box2D v3 solvers. Soft step combines substepping and soft constraints.',
      'Project Settings > Physics > Substepping. Splits the frame dt by the max substep dt and simulates several times.',
      null,
    ],
    params: {
      substeps: { label: 'Substeps', group: 'Solver' },
      stiffness: 'Spring stiffness k/m',
      damping: { label: 'Spring damping', help: 'How much relative velocity along the spring is reduced (1/s)' },
      hz: 'Frame rate (Hz)',
      segments: { label: 'Chain segments', group: 'Scene' },
      heavy: 'End weight (20x mass)',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const LW = 600, LH = 400, GRAV = 900;
    const N = P.segments + 1, REST = Math.min(15, 300 / P.segments);
    const AX = 300, AY = 50;
    let px, py, vx, vy, inv, acc, explodes, boomTimer, maxStretch, springEvals, grab = -1;
    const init = () => {
      px = new Float64Array(N); py = new Float64Array(N); vx = new Float64Array(N); vy = new Float64Array(N); inv = new Float64Array(N);
      for (let i = 0; i < N; i++) { px[i] = AX + i * REST; py[i] = AY; inv[i] = i === 0 ? 0 : 1; }
      if (P.heavy) inv[N - 1] = 1 / 20;
      acc = 0; boomTimer = 0; maxStretch = 0; springEvals = 0;
    };
    explodes = 0;
    init();

    let mouseL = null;
    function substep(h) {
      const k = P.stiffness, c = P.damping;
      const fx = new Float64Array(N), fy = new Float64Array(N);
      for (let i = 0; i < N - 1; i++) {
        const j = i + 1;
        const dx = px[j] - px[i], dy = py[j] - py[i];
        const L = Math.hypot(dx, dy) || 1e-9, nx = dx / L, ny = dy / L;
        const rv = (vx[j] - vx[i]) * nx + (vy[j] - vy[i]) * ny;
        // 강성 k/m 은 "질량 1 입자 기준"이므로 힘 = k*(L-REST) (질량 1 단위)
        const f = k * (L - REST) + c * rv;
        fx[i] += f * nx; fy[i] += f * ny; fx[j] -= f * nx; fy[j] -= f * ny;
      }
      springEvals += N - 1;
      for (let i = 0; i < N; i++) {
        if (!inv[i] || i === grab) continue;
        vx[i] += fx[i] * inv[i] * h;
        vy[i] += (GRAV + fy[i] * inv[i]) * h;
        px[i] += vx[i] * h; py[i] += vy[i] * h;
      }
      if (grab > 0 && mouseL) {
        vx[grab] = (mouseL.x - px[grab]) / h * 0.2; vy[grab] = (mouseL.y - py[grab]) / h * 0.2;
        px[grab] = mouseL.x; py[grab] = mouseL.y;
      }
    }

    function exploded() {
      for (let i = 0; i < N - 1; i++) {
        const L = Math.hypot(px[i + 1] - px[i], py[i + 1] - py[i]);
        if (!isFinite(L) || L > REST * 8) return true;
      }
      return false;
    }

    const toLocal = (m) => {
      const s = Math.min(ctx.width / LW, ctx.height / LH), ox = (ctx.width - LW * s) / 2, oy = (ctx.height - LH * s) / 2;
      return { x: (m.x - ox) / s, y: (m.y - oy) / s };
    };

    return {
      update(dt) {
        if (boomTimer > 0) { boomTimer -= dt; if (boomTimer <= 0) init(); return; }
        const H = 1 / P.hz;
        acc += dt;
        springEvals = 0;
        let frames = 0;
        while (acc >= H && frames < 4) {
          const n = P.substeps;
          for (let s = 0; s < n; s++) substep(H / n);
          acc -= H; frames++;
          if (exploded()) { explodes++; boomTimer = 1.5; return; }
        }
        if (frames >= 4) acc = 0;
        let ms = 0;
        for (let i = 0; i < N - 1; i++) ms = Math.max(ms, Math.hypot(px[i + 1] - px[i], py[i + 1] - py[i]) / REST - 1);
        maxStretch = ms;
      },
      onPointer(type, m) {
        const l = toLocal(m);
        mouseL = l;
        if (type === 'down') {
          let best = -1, bd = 30 * 30;
          for (let i = 1; i < N; i++) { const d = (px[i] - l.x) ** 2 + (py[i] - l.y) ** 2; if (d < bd) { bd = d; best = i; } }
          grab = best;
        } else if (type === 'up' || type === 'leave') grab = -1;
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const s = Math.min(W / LW, H / LH), ox = (W - LW * s) / 2, oy = (H - LH * s) / 2;
        const col = ctx.side === 'a' ? C.a : C.b;
        g.save(); g.translate(ox, oy); g.scale(s, s);
        D.grid(g, LW, LH, 40);
        D.rect(g, AX - 30, AY - 10, 60, 6, '#9aa3b2');
        const boom = boomTimer > 0;
        // 스프링: 늘어남에 따라 색
        for (let i = 0; i < N - 1; i++) {
          const L = Math.hypot(px[i + 1] - px[i], py[i + 1] - py[i]);
          if (!isFinite(L)) continue;
          const st = U.clamp(Math.abs(L / REST - 1) * 4, 0, 1);
          D.line(g, px[i], py[i], px[i + 1], py[i + 1], `hsl(${120 - st * 120},70%,60%)`, 2.5);
        }
        for (let i = 0; i < N; i++) {
          if (!isFinite(px[i]) || !isFinite(py[i])) continue;
          const r = i === N - 1 && P.heavy ? 11 : 4;
          D.circle(g, px[i], py[i], r, i === grab ? C.warn : col);
        }
        if (boom) D.text(g, GTL.L('폭발! 💥 재시작…', 'Exploded! 💥 Restarting…'), LW / 2, LH / 2, { align: 'center', size: 22, color: C.bad });
        g.restore();
        // 안정성 게이지
        const hsub = 1 / P.hz / P.substeps;
        const metric = 2 * Math.sqrt(P.stiffness) * hsub;
        const gx = W - 170, gy = 12, gw = 150;
        D.rect(g, gx, gy, gw, 12, 'rgba(0,0,0,0.4)');
        const f = U.clamp(metric / 4, 0, 1);
        D.rect(g, gx, gy, gw * f, 12, metric < 2 ? C.good : C.bad);
        D.line(g, gx + gw / 2, gy - 3, gx + gw / 2, gy + 15, '#fff', 1.5);
        D.text(g, GTL.L(`ω*dt = ${metric.toFixed(2)} (안정 < 2)`, `ω*dt = ${metric.toFixed(2)} (stable < 2)`), gx, gy + 16, { size: 11, color: metric < 2 ? C.good : C.bad });
        ctx.stat(GTL.L('서브스텝 dt', 'Substep dt'), (hsub * 1000).toFixed(2) + ' ms');
        ctx.stat(GTL.L('최대 늘어남', 'Max stretch'), boom ? '∞' : (maxStretch * 100).toFixed(1) + ' %');
        ctx.stat(GTL.L('프레임당 스프링 계산', 'Spring evals per frame'), springEvals);
        ctx.stat(GTL.L('폭발 횟수', 'Explosions'), explodes);
      },
      onAction(key) { if (key === 'restart') { init(); } },
    };
  },
});
