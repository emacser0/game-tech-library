// 2차 동역학(Second-Order Dynamics): f(진동수), ζ(감쇠), r(초기 반응)으로 "성격"을 조절하는 추종 시스템
GTL.register({
  id: 'second-order-dynamics',
  title: '2차 동역학으로 성격 있는 추종',
  summary: '지수 감쇠 lerp는 항상 "느리게 다가가기"만 함. 스프링-댐퍼 2차 시스템 y + k₁ẏ + k₂ÿ = x + k₃ẋ 를 직관적인 f, ζ, r 파라미터로 다루면 overshoot, 탄성, 예비 동작(anticipation)까지 표현 가능.',
  views: { a: '지수 lerp 추종', b: '2차 동역학 (f, ζ, r)' },
  controls: '마우스를 뷰 안에 두면 목표가 마우스를 따라감.',
  info: `
    <p><b>2차 동역학</b>은 스프링과 댐퍼처럼 위치와 속도를 함께 다루는 추종 방식. 지수 lerp와 달리 목표를 넘어가거나 출렁일 수 있음.</p>
    <p>t3ssel8r의 방식은 2차 시스템의 계수를 직관적인 값 세 개로 바꿈.</p>
    <ul>
      <li><b>f (Hz)</b>: 고유 진동수. 응답 속도를 정함. 클수록 빠르게 반응.</li>
      <li><b>ζ (zeta)</b>: 감쇠비. 0이면 계속 진동. 0~1이면 overshoot 후 안정. 1 이상이면 진동 없이 천천히 수렴.</li>
      <li><b>r</b>: 초기 반응. 0이면 천천히 출발, 1이면 즉시 반응, 1보다 크면 목표를 앞질러 나감. 음수면 반대로 살짝 물러났다가 출발(<b>예비 동작</b>).</li>
    </ul>
    <p>계수: <code>k₁ = ζ/(πf)</code>, <code>k₂ = 1/(2πf)²</code>, <code>k₃ = rζ/(2πf)</code>. 적분은 semi-implicit Euler.
    큰 dt에서 발산하지 않도록 <code>k₂</code>를 <code>max(k₂, T²/2 + Tk₁/2, Tk₁)</code>로 클램프함.</p>
    <p>오른쪽 아래 그래프는 현재 파라미터의 <b>계단 응답</b>. 목표가 0에서 1로 순간 이동했을 때 y가 시간에 따라 변하는 모습.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
    <text x="4" y="20" class="t-a">${L('A: 지수 lerp (1차)', 'A: exponential lerp (1st order)')}</text>
    <text x="4" y="36" class="t-small t-mono">dy/dt = λ (x - y)</text>
    <text x="4" y="50" class="t-small t-dim">${L('속도가 남은 거리에 비례. 넘어갈 수 없음', 'Speed is proportional to the gap. It never passes x')}</text>
    <text x="4" y="78" class="t-b">${L('B: 2차 동역학 (스프링 + 댐퍼)', 'B: second order (spring + damper)')}</text>
    <rect x="10" y="96" width="34" height="26" class="f-dim"/>
    <text x="27" y="113" text-anchor="middle" class="t-small t-mono">x</text>
    <polyline points="44,103 58,103 64,95 74,111 84,95 94,111 104,95 110,103 132,103" class="d-b"/>
    <line x1="44" y1="117" x2="78" y2="117" class="d-dim"/><rect x="78" y="111" width="26" height="12" class="d-dim"/>
    <line x1="92" y1="117" x2="132" y2="117" class="d-dim"/><line x1="92" y1="113" x2="92" y2="121" class="d-dim"/>
    <rect x="132" y="94" width="34" height="30" class="f-b"/>
    <text x="149" y="113" text-anchor="middle" class="t-small t-mono">y</text>
    <text x="84" y="90" text-anchor="middle" class="t-small">${L('스프링: f', 'spring: f')}</text>
    <text x="91" y="136" text-anchor="middle" class="t-small t-dim">${L('댐퍼: ζ', 'damper: ζ')}</text>
    <text x="4" y="156" class="t-small t-dim">${L('r: 목표 속도 ẋ의 반영 정도', 'r: how much target speed ẋ feeds in')}</text>
    <text x="4" y="172" class="t-small t-mono">y + k₁ẏ + k₂ÿ = x + k₃ẋ</text>
    <text x="280" y="20">${L('계단 응답 (목표가 0에서 1로 점프)', 'Step response (target jumps 0 to 1)')}</text>
    <line x1="280" y1="150" x2="530" y2="150" class="d-dim"/><line x1="280" y1="30" x2="280" y2="150" class="d-dim"/>
    <line x1="280" y1="65.3" x2="530" y2="65.3" class="d-good" stroke-dasharray="4 3"/>
    <line x1="280" y1="135.9" x2="530" y2="135.9" class="d-dim" stroke-dasharray="2 3"/>
    <text x="274" y="69" text-anchor="end" class="t-small t-mono">1</text><text x="274" y="139" text-anchor="end" class="t-small t-mono">0</text>
    <path d="M280.0,135.9 L285.2,125.0 L290.4,115.9 L295.6,108.1 L300.8,101.5 L306.0,96.0 L311.3,91.3 L316.5,87.3 L321.7,83.9 L326.9,81.0 L332.1,78.6 L337.3,76.6 L342.5,74.8 L347.7,73.4 L352.9,72.1 L358.1,71.1 L363.3,70.2 L368.5,69.4 L373.8,68.8 L379.0,68.3 L384.2,67.8 L389.4,67.4 L394.6,67.1 L399.8,66.8 L405.0,66.6 L415.4,66.2 L431.0,65.9 L451.9,65.6 L483.1,65.4 L530.0,65.3" class="d-a"/>
    <path d="M280.0,135.9 L285.2,125.3 L290.4,110.3 L295.6,94.5 L300.8,79.5 L306.0,66.7 L311.3,56.9 L316.5,50.2 L321.7,46.6 L326.9,45.7 L332.1,47.0 L337.3,49.7 L342.5,53.4 L347.7,57.4 L352.9,61.2 L358.1,64.5 L363.3,67.1 L368.5,68.9 L373.8,69.9 L379.0,70.2 L384.2,70.0 L389.4,69.3 L394.6,68.4 L399.8,67.4 L405.0,66.5 L410.2,65.6 L415.4,64.9 L420.6,64.5 L425.8,64.2 L431.0,64.1 L441.5,64.3 L451.9,64.7 L462.3,65.2 L472.7,65.5 L488.3,65.6 L509.2,65.4 L530.0,65.2" class="d-b"/>
    <path d="M280.0,135.9 L285.2,147.4 L290.4,150.0 L295.6,143.5 L300.8,130.8 L306.0,114.7 L311.3,97.5 L316.5,81.3 L321.7,67.3 L326.9,56.5 L332.1,49.1 L337.3,45.1 L342.5,44.0 L347.7,45.3 L352.9,48.3 L358.1,52.3 L363.3,56.6 L368.5,60.7 L373.8,64.3 L379.0,67.1 L384.2,69.1 L389.4,70.2 L394.6,70.6 L399.8,70.4 L405.0,69.7 L410.2,68.7 L415.4,67.7 L420.6,66.6 L425.8,65.7 L431.0,64.9 L441.5,64.1 L451.9,64.0 L462.3,64.4 L472.7,64.9 L488.3,65.5 L509.2,65.6 L530.0,65.3" class="d-b" stroke-dasharray="3 3" stroke-width="1.2"/>
    <text x="340" y="38" class="t-small t-b">${L('B: 목표를 넘음 (ζ &lt; 1)', 'B: overshoot (ζ &lt; 1)')}</text>
    <text x="380" y="90" class="t-small t-a">${L('A: 감속하며 접근만 함', 'A: slows down, never passes')}</text>
    <text x="300" y="164" class="t-small t-b">${L('점선 r &lt; 0: 먼저 물러남 (예비 동작)', 'dashed r &lt; 0: backs off first (anticipation)')}</text>
    <text x="280" y="180" class="t-small t-dim">${L('f: 상승 속도, ζ: 출렁임, r: 출발 기울기', 'f: rise speed, ζ: wobble, r: start slope')}</text>
  </svg>`,
  look: [
    'A(lerp)에서 목표가 점프하면 무조건 감속하며 다가감. overshoot도 예비 동작도 없음.',
    'B에서 ζ를 0.1로 내리면 오래 출렁임. 1.5로 올리면 lerp와 비슷하게 느리게 수렴함.',
    'r을 -2로 하면 목표 반대쪽으로 살짝 물러난 뒤 출발함(anticipation). 3으로 올리면 출발 순간 앞으로 튐.',
    '계단 응답 그래프를 비교하면 모양이 곧 "성격". 그래프가 같으면 느낌도 같음.',
  ],
  refs: [
    { type: 'talk', title: 'Giving Personality to Procedural Animations using Math (t3ssel8r)', year: 2022, note: 'YouTube. f, ζ, r 파라미터화와 안정성 클램프의 출처.' },
    { type: 'article', title: 'Spring-It-On: The Game Developer\'s Spring-Roll-Call (Daniel Holden)', url: 'https://theorangeduck.com/page/spring-roll-call', year: 2021, note: '감쇠 스프링의 해석해와 반감기 파라미터화.' },
    { type: 'book', title: 'Game Programming Gems 4 - Critically Damped Ease-In/Ease-Out Smoothing (Thomas Lowe)', year: 2004, note: 'Unity SmoothDamp의 기반이 된 임계 감쇠 스무딩.' },
    { type: 'engine', title: 'Unity - Vector3.SmoothDamp', url: 'https://docs.unity3d.com/ScriptReference/Vector3.SmoothDamp.html', note: '임계 감쇠(ζ=1) 스프링 추종.' },
  ],
  params: [
    { key: 'method', label: '추종 방식', type: 'select', group: '추종', options: [
      { value: 'lerp', label: '지수 lerp (damp)' },
      { value: 'sod', label: '2차 동역학' },
    ], a: 'lerp', b: 'sod' },
    { key: 'lambda', label: 'λ (lerp 속도)', type: 'range', min: 0.5, max: 20, step: 0.1, default: 5, when: (p) => p.method === 'lerp' },
    { key: 'f', label: 'f 진동수 (Hz)', type: 'range', min: 0.1, max: 6, step: 0.05, default: 1.6, when: (p) => p.method === 'sod' },
    { key: 'zeta', label: 'ζ 감쇠비', type: 'range', min: 0, max: 2, step: 0.01, default: 0.4, when: (p) => p.method === 'sod' },
    { key: 'r', label: 'r 초기 반응', type: 'range', min: -4, max: 4, step: 0.05, default: 1, when: (p) => p.method === 'sod' },
    { key: 'target', label: '자동 목표 움직임', type: 'select', group: '장면', options: [
      { value: 'mixed', label: '점프 + 원운동' },
      { value: 'jump', label: '순간 이동만' },
      { value: 'circle', label: '원운동만' },
    ], default: 'mixed', shared: true },
    { key: 'followers', label: '연쇄 추종자 수', type: 'int', min: 1, max: 6, default: 1, shared: true, help: '앞 추종자를 다음 추종자가 따라감 (꼬리)' },
  ],
  en: {
    title: 'Following With Personality: Second-Order Dynamics',
    summary: 'Exponential lerp only ever "slowly moves closer". If you control the spring-damper second-order system y + k₁ẏ + k₂ÿ = x + k₃ẋ with the intuitive parameters f, ζ, and r, you can express overshoot, bounce, and even anticipation.',
    views: { a: 'Exponential lerp follow', b: 'Second-order dynamics (f, ζ, r)' },
    controls: 'Keep the mouse inside the view and the target follows it.',
    info: `
    <p><b>Second-order dynamics</b> is a way to follow a target that tracks both position and velocity, like a spring and damper. Unlike exponential lerp, it can go past the target and wobble.</p>
    <p>t3ssel8r's approach turns the coefficients of a second-order system into three intuitive values.</p>
    <ul>
      <li><b>f (Hz)</b>: natural frequency. It sets the response speed. Higher values react faster.</li>
      <li><b>ζ (zeta)</b>: damping ratio. At 0 it keeps oscillating. Between 0 and 1 it overshoots, then settles. At 1 or more it converges slowly without oscillating.</li>
      <li><b>r</b>: initial response. At 0 it starts slowly, at 1 it reacts at once, and above 1 it runs ahead of the target. When negative, it first backs off a little, then starts (<b>anticipation</b>).</li>
    </ul>
    <p>Coefficients: <code>k₁ = ζ/(πf)</code>, <code>k₂ = 1/(2πf)²</code>, <code>k₃ = rζ/(2πf)</code>. Integration uses semi-implicit Euler.
    To keep it from diverging at large dt, <code>k₂</code> is clamped to <code>max(k₂, T²/2 + Tk₁/2, Tk₁)</code>.</p>
    <p>The graph at the lower right is the <b>step response</b> of the current parameters. It shows how y changes over time when the target jumps from 0 to 1.</p>`,
    look: [
      'In A (lerp), when the target jumps, the follower always slows down as it approaches. There is no overshoot and no anticipation.',
      'In B, lower ζ to 0.1 and it wobbles for a long time. Raise it to 1.5 and it converges slowly, much like lerp.',
      'Set r to -2. It backs off a little away from the target, then starts (anticipation). Raise it to 3 and it jumps forward the moment it starts.',
      'Compare the step response graphs. The shape is the "personality". If the graphs match, the feel matches too.',
    ],
    refs: [
      'YouTube. The source of the f, ζ, r parameters and the stability clamp.',
      'The analytic solution of damped springs and half-life parameters.',
      'The critically damped smoothing that Unity SmoothDamp is based on.',
      'A critically damped (ζ=1) spring follower.',
    ],
    params: {
      method: { label: 'Follow method', group: 'Follow', options: { lerp: 'Exponential lerp (damp)', sod: 'Second-order dynamics' } },
      lambda: 'λ (lerp speed)',
      f: 'f frequency (Hz)',
      zeta: 'ζ damping ratio',
      r: 'r initial response',
      target: { label: 'Auto target motion', group: 'Scene', options: { mixed: 'Jumps + circling', jump: 'Jumps only', circle: 'Circling only' } },
      followers: { label: 'Chained followers', help: 'Each follower follows the one in front (a tail)' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params, V = U.v2;
    let tgt = { x: ctx.width / 2, y: ctx.height / 2 }, active = 1, clock = 0, jumpTimer = 0, phase = 'jump', phaseTimer = 6;
    const MAXF = 6;
    const fol = Array.from({ length: MAXF }, () => ({ y: { ...tgt }, yd: { x: 0, y: 0 }, xp: { ...tgt }, trail: [] }));

    function coef() {
      const f = Math.max(0.01, P.f), z = P.zeta, r = P.r;
      return { k1: z / (Math.PI * f), k2: 1 / ((2 * Math.PI * f) ** 2), k3: (r * z) / (2 * Math.PI * f) };
    }
    // 1D/2D 공용 한 스텝
    function sodStep(s, x, T, k) {
      const xd = { x: (x.x - s.xp.x) / T, y: (x.y - s.xp.y) / T };
      s.xp = { x: x.x, y: x.y };
      const k2s = Math.max(k.k2, (T * T) / 2 + (T * k.k1) / 2, T * k.k1);
      s.y = { x: s.y.x + T * s.yd.x, y: s.y.y + T * s.yd.y };
      s.yd = {
        x: s.yd.x + (T * (x.x + k.k3 * xd.x - s.y.x - k.k1 * s.yd.x)) / k2s,
        y: s.yd.y + (T * (x.y + k.k3 * xd.y - s.y.y - k.k1 * s.yd.y)) / k2s,
      };
    }
    function stepFollower(s, x, T) {
      if (P.method === 'lerp') {
        const ny = V.lerp(s.y, x, 1 - Math.exp(-P.lambda * T));
        s.yd = V.scale(V.sub(ny, s.y), 1 / T); s.y = ny; s.xp = { ...x };
      } else sodStep(s, x, T, coef());
    }

    return {
      update(dt) {
        if (dt <= 0) return;
        clock += dt;
        const W = ctx.width, H = ctx.height, m = ctx.input.mouse;
        if (m.inside) tgt = { x: m.x, y: m.y };
        else {
          let mode = P.target;
          if (mode === 'mixed') {
            phaseTimer -= dt;
            if (phaseTimer <= 0) { phase = phase === 'jump' ? 'circle' : 'jump'; phaseTimer = 6; }
            mode = phase;
          }
          if (mode === 'jump') {
            jumpTimer -= dt;
            if (jumpTimer <= 0) { tgt = { x: ctx.rng.range(W * 0.15, W * 0.85), y: ctx.rng.range(H * 0.15, H * 0.6) }; jumpTimer = 1.6; }
          } else {
            const R = Math.min(W, H) * 0.25;
            tgt = { x: W / 2 + Math.cos(clock * 1.8) * R * 1.4, y: H * 0.38 + Math.sin(clock * 1.8) * R };
          }
        }
        let x = tgt;
        for (let i = 0; i < P.followers; i++) {
          const s = fol[i];
          if (i >= active) { s.y = { ...x }; s.xp = { ...x }; s.yd = { x: 0, y: 0 }; s.trail = []; }
          stepFollower(s, x, dt);
          s.trail.push({ ...s.y }); if (s.trail.length > 50) s.trail.shift();
          x = s.y;
        }
        active = P.followers;
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        D.grid(g, W, H, 40);
        // 목표
        D.circle(g, tgt.x, tgt.y, 10, null, C.warn, 2);
        D.line(g, tgt.x - 14, tgt.y, tgt.x + 14, tgt.y, C.warn, 1);
        D.line(g, tgt.x, tgt.y - 14, tgt.x, tgt.y + 14, C.warn, 1);
        for (let i = P.followers - 1; i >= 0; i--) {
          const s = fol[i];
          if (s.trail.length > 1) D.poly(g, s.trail, null, 'rgba(255,255,255,0.15)', 1.5, false);
          const sp = V.len(s.yd), ang = sp > 1 ? Math.atan2(s.yd.y, s.yd.x) : 0;
          const sz = i === 0 ? 1 : 0.75 - i * 0.06;
          g.save(); g.translate(s.y.x, s.y.y); g.rotate(ang);
          const stretch = 1 + Math.min(0.6, sp / 2500);
          g.scale(stretch, 1 / stretch);
          D.poly(g, [{ x: 16 * sz, y: 0 }, { x: -11 * sz, y: -10 * sz }, { x: -6 * sz, y: 0 }, { x: -11 * sz, y: 10 * sz }], col, '#000', 1);
          g.restore();
        }
        // 계단 응답
        const gw = Math.min(220, W * 0.4), gh = 90, gx = W - gw - 12, gy = H - gh - 12;
        const T = 1 / 120, N = 300, vals = [];
        const s = { y: { x: 0, y: 0 }, yd: { x: 0, y: 0 }, xp: { x: 0, y: 0 } };
        const one = { x: 1, y: 0 };
        for (let i = 0; i < N; i++) {
          if (P.method === 'lerp') s.y.x = U.lerp(s.y.x, 1, 1 - Math.exp(-P.lambda * T));
          else sodStep(s, one, T, coef());
          vals.push(U.clamp(s.y.x, -1, 2.2));
        }
        const lo = -0.6, hi = 1.8;
        D.plot(g, vals, gx, gy, gw, gh, { min: lo, max: hi, color: col, label: GTL.L('계단 응답 (0 → 1, 2.5초)', 'Step response (0 → 1, 2.5 s)') });
        const yOf = (v) => gy + gh - ((v - lo) / (hi - lo)) * gh;
        g.setLineDash([3, 4]);
        D.line(g, gx, yOf(1), gx + gw, yOf(1), C.good, 1);
        D.line(g, gx, yOf(0), gx + gw, yOf(0), C.dim, 1);
        g.setLineDash([]);
        const peak = Math.max(...vals), low = Math.min(...vals);
        let settle = N;
        for (let i = N - 1; i >= 0; i--) if (Math.abs(vals[i] - 1) > 0.05) { settle = i + 1; break; }
        const lead = fol[0];
        ctx.stat('overshoot', peak > 1.001 ? ((peak - 1) * 100).toFixed(0) + ' %' : GTL.L('없음', 'None'));
        ctx.stat(GTL.L('예비 동작 (음의 최저)', 'Anticipation (lowest negative)'), low < -0.001 ? (low * 100).toFixed(0) + ' %' : GTL.L('없음', 'None'));
        ctx.stat(GTL.L('5% 안정 시간', '5% settling time'), settle >= N ? '> 2.5 s' : (settle * T).toFixed(2) + ' s');
        ctx.stat(GTL.L('추종 오차', 'Follow error'), V.dist(lead.y, tgt).toFixed(0) + ' px');
      },
    };
  },
});
