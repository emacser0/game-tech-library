// PD 관절 드라이브(물리 애니메이션): 키네마틱으로 애니메이션 포즈를 그대로 따름 vs PD 토크로 목표 포즈를 쫓음
GTL.register({
  id: 'pd-joint-drive',
  title: 'PD 관절 드라이브 (Physical Animation, Slerp Drive)',
  summary: '키네마틱 팔은 애니메이션 포즈를 매 프레임 그대로 덮어써서 맞아도 반응 없음. PD 드라이브는 목표 포즈와의 각도 오차로 토크를 만들어 팔을 끌고 감. 맞으면 밀려났다가 스스로 포즈로 돌아옴.',
  views: { a: '키네마틱 (포즈 그대로)', b: 'PD 드라이브' },
  controls: '"타격" 버튼: 팔 끝에 공 던지기. "주기적 타격"이 켜져 있으면 2.5초마다 자동으로 맞음.',
  info: `
    <p><b>PD 관절 드라이브</b>는 관절에 토크를 줘서 물리 바디를 애니메이션 포즈 쪽으로 끌고 가는 방법. 물리 애니메이션(Physical Animation)의 기본 부품.</p>
    <p>키네마틱 방식은 매 프레임 관절 각도를 애니메이션 값으로 덮어씀. 그래서 두 가지 한계가 있음.</p>
    <ul>
      <li>총알, 주먹, 벽에 맞아도 팔이 전혀 밀리지 않음</li>
      <li>반응을 넣으려면 피격 애니메이션을 따로 만들어야 함</li>
    </ul>
    <p>PD 드라이브는 관절마다 스프링과 댐퍼를 둠</p>
    <ul>
      <li>오차 <code>e = θ목표 - θ</code></li>
      <li>토크 <code>τ = kp * e - kd * ω</code> (kp: 강성, kd: 감쇠, ω: 관절 각속도)</li>
      <li>물리 엔진이 <code>I * α = τ + 외부 토크</code>로 적분. <code>I</code>는 관성(질량에 비례)</li>
    </ul>
    <p>엔진 기능:</p>
    <ul>
      <li><b>Unreal</b> Physical Animation Component: 프로필의 Orientation Strength, Angular Velocity Strength, Position Strength, Velocity Strength</li>
      <li><b>Unity</b> ConfigurableJoint의 Slerp Drive: <code>positionSpring</code>(kp), <code>positionDamper</code>(kd), <code>maximumForce</code></li>
    </ul>
    <p>감쇠비 <code>ζ = kd / (2√(kp I))</code>가 1이면 출렁임 없이 가장 빨리 포즈로 돌아옴. 1보다 작으면 흔들리고, 크면 느림.</p>
    <p>단점: 목표 속도를 0으로 두는 PD는 움직이는 포즈를 늘 조금 늦게 따라감. 중력도 일정한 오차(처짐)를 남김. 강성을 올리면 줄지만 맞아도 덜 밀림. 그래서 게임은 피격 순간 강성을 잠시 낮췄다가 다시 올리기도 함.</p>
    <p>흐린 점선 팔은 애니메이션 목표 포즈. 관절의 빨간 호와 손끝 점선은 스프링 오차.</p>`,
  // 도식: 관절 하나의 PD 제어. 목표 각도와 현재 각도의 차이로 토크를 만들고, 물리가 그 토크로 관절을 돌림
  diagram: (L) => `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="arr-pd" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="arr-pdt" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    </defs>
    <circle cx="70" cy="40" r="7" class="f-dim"/>
    <line x1="70" y1="40" x2="70" y2="160" class="d-dim" stroke-dasharray="5 4"/>
    <circle cx="70" cy="160" r="5" class="d-dim"/>
    <line x1="70" y1="40" x2="148" y2="131" class="d-b"/>
    <circle cx="148" cy="131" r="6" class="f-b"/>
    <path d="M70,110 A70,70 0 0 1 116,93" class="d-bad"/>
    <text x="88" y="124" class="t-small t-mono">e</text>
    <path d="M135.6,115.5 A100,100 0 0 1 98,136" class="d-accent" marker-end="url(#arr-pd)"/>
    <text x="104" y="160" class="t-small">${L('토크 τ', 'torque τ')}</text>
    <text x="10" y="182" class="t-small t-dim">${L('점선: 목표 포즈', 'dashed: target pose')}</text>
    <text x="120" y="182" class="t-small t-b">${L('파랑: 현재 포즈', 'blue: current pose')}</text>
    <text x="10" y="18" class="t-small">${L('관절 하나', 'One joint')}</text>
    <rect x="230" y="14" width="96" height="26" class="f-dim"/>
    <text x="278" y="31" text-anchor="middle" class="t-small">${L('애니메이션', 'Animation')}</text>
    <text x="336" y="31" class="t-small t-mono">θ_target</text>
    <path d="M278,40 L278,62" class="d-line" marker-end="url(#arr-pdt)"/>
    <rect x="230" y="64" width="200" height="40" class="f-dim"/>
    <text x="330" y="82" text-anchor="middle" class="t-mono">τ = kp × e - kd × ω</text>
    <text x="330" y="97" text-anchor="middle" class="t-small t-mono">e = θ_target - θ</text>
    <path d="M330,104 L330,124" class="d-line" marker-end="url(#arr-pdt)"/>
    <rect x="230" y="126" width="200" height="26" class="f-dim"/>
    <text x="330" y="143" text-anchor="middle" class="t-small t-mono">I α = τ + ${L('타격 토크', 'hit torque')}</text>
    <path d="M430,139 L470,139 L470,84 L436,84" class="d-line" marker-end="url(#arr-pdt)"/>
    <text x="476" y="108" class="t-small t-mono">θ, ω</text>
    <text x="230" y="172" class="t-small t-dim">${L('kp: 강성 (Unity positionSpring)', 'kp: stiffness (Unity positionSpring)')}</text>
    <text x="230" y="186" class="t-small t-dim">${L('kd: 감쇠 (Unity positionDamper)', 'kd: damping (Unity positionDamper)')}</text>
  </svg>`,
  look: [
    '"타격"을 누르면 A의 팔은 공에 맞아도 그대로 움직임. B의 팔은 밀려났다가 몇 번 흔들린 뒤 목표 포즈로 돌아옴.',
    'B의 감쇠 kd를 2 이하로 낮추면 맞은 뒤 오래 출렁임. 30 이상으로 올리면 출렁임 없이 천천히 돌아옴. 감쇠비 ζ가 1 근처일 때 가장 빨리 안정됨.',
    'B의 강성 kp를 30 이하로 낮추면 중력 때문에 팔이 목표보다 처지고, 움직이는 포즈를 크게 늦게 따라감(오차 그래프가 커짐)',
    'B의 질량을 4로 올리면 같은 kp, kd에서 관성이 커져 느리게 반응하고 더 많이 처짐. 질량에 맞춰 kp도 올려야 같은 느낌이 남.',
  ],
  refs: [
    { type: 'engine', title: 'Unreal Engine - Physical Animation Component, Physical Animation Profile', note: 'Orientation, Position, Velocity, Angular Velocity Strength로 바디를 애니메이션 포즈 쪽으로 끔' },
    { type: 'engine', title: 'Unity - Configurable Joint (Slerp Drive)', url: 'https://docs.unity3d.com/Manual/class-ConfigurableJoint.html', note: 'Target Rotation, Position Spring, Position Damper, Maximum Force.' },
    { type: 'engine', title: 'Unity - ConfigurableJoint.slerpDrive', url: 'https://docs.unity3d.com/ScriptReference/ConfigurableJoint-slerpDrive.html' },
    { type: 'talk', title: "Physics Animation in 'Uncharted 4: A Thief's End' (Michal Mach)", year: 2017, note: 'GDC 2017. 애니메이션 포즈를 따라가는 물리 캐릭터와 피격 반응.' },
    { type: 'paper', title: 'Stable Proportional-Derivative Controllers (Tan, Liu, Turk)', year: 2011, note: '큰 kp에서도 안정적인 암시적 PD. 엔진 드라이브가 큰 강성을 버티는 원리.' },
  ],
  params: [
    { key: 'mode', label: '구동 방식', type: 'select', group: '드라이브', options: [
      { value: 'kinematic', label: '키네마틱 (포즈 덮어쓰기)' },
      { value: 'pd', label: 'PD 드라이브 (토크)' },
    ], a: 'kinematic', b: 'pd' },
    { key: 'kp', label: '강성 kp', type: 'range', min: 5, max: 400, step: 5, default: 120, when: (p) => p.mode === 'pd', help: 'Unity positionSpring, Unreal Orientation Strength' },
    { key: 'kd', label: '감쇠 kd', type: 'range', min: 0, max: 60, step: 0.5, default: 10, when: (p) => p.mode === 'pd', help: 'Unity positionDamper, Unreal Angular Velocity Strength' },
    { key: 'mass', label: '팔 질량', type: 'range', min: 0.2, max: 5, step: 0.1, default: 1, when: (p) => p.mode === 'pd', help: '관성 I가 질량에 비례' },
    { key: 'gravity', label: '중력', type: 'bool', default: true, when: (p) => p.mode === 'pd' },
    { key: 'impact', label: '타격 세기', type: 'range', min: 0, max: 15, step: 0.5, default: 6, shared: true, group: '타격' },
    { key: 'auto', label: '주기적 타격', type: 'bool', default: true, shared: true, help: '2.5초마다 공이 팔 끝을 침' },
    { key: 'animSpeed', label: '애니메이션 속도', type: 'range', min: 0, max: 2, step: 0.05, default: 1, shared: true, group: '장면' },
    { key: 'hit', label: '타격', type: 'button' },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'PD Joint Drive (Physical Animation, Slerp Drive)',
    summary: 'A kinematic arm overwrites its pose with the animation every frame, so it does not react to hits. A PD drive turns the angle error to the target pose into torque and pulls the arm along. When hit, the arm gets pushed away and then returns to the pose on its own.',
    views: { a: 'Kinematic (pose as is)', b: 'PD drive' },
    controls: '"Hit" button: throw a ball at the hand. With "Periodic hits" on, a ball hits every 2.5 s.',
    info: `
    <p>A <b>PD joint drive</b> applies torque at each joint to pull a physics body toward the animation pose. It is the basic part of physical animation.</p>
    <p>The kinematic way overwrites joint angles with the animation every frame. This has two limits.</p>
    <ul>
      <li>Bullets, punches, and walls never push the arm.</li>
      <li>Any reaction needs its own hit animation.</li>
    </ul>
    <p>A PD drive puts a spring and a damper on each joint.</p>
    <ul>
      <li>Error <code>e = θtarget - θ</code></li>
      <li>Torque <code>τ = kp * e - kd * ω</code> (kp: stiffness, kd: damping, ω: joint angular velocity)</li>
      <li>The physics engine integrates <code>I * α = τ + external torque</code>. <code>I</code> is inertia, which grows with mass.</li>
    </ul>
    <p>Engine features:</p>
    <ul>
      <li><b>Unreal</b> Physical Animation Component: Orientation Strength, Angular Velocity Strength, Position Strength, and Velocity Strength in a profile.</li>
      <li><b>Unity</b> ConfigurableJoint Slerp Drive: <code>positionSpring</code> (kp), <code>positionDamper</code> (kd), <code>maximumForce</code>.</li>
    </ul>
    <p>With damping ratio <code>ζ = kd / (2√(kp I))</code> at 1, the arm returns to the pose fastest without wobbling. Below 1 it wobbles. Above 1 it is slow.</p>
    <p>Downside: a PD drive with zero target velocity always lags a moving pose a little. Gravity also leaves a steady error (sag). Higher stiffness reduces both, but hits push the arm less. So games often lower stiffness for a moment on a hit and then raise it again.</p>
    <p>The faint dashed arm is the animation target pose. The red arcs at the joints and the dotted line at the hand show the spring error.</p>`,
    look: [
      'Press "Hit". A\'s arm keeps moving as if nothing happened. B\'s arm gets pushed, wobbles a few times, and returns to the target pose.',
      'Lower B\'s damping kd to 2 or less. The arm wobbles for a long time after a hit. Raise it above 30. The arm returns slowly with no wobble. It settles fastest when the damping ratio ζ is near 1.',
      'Lower B\'s stiffness kp to 30 or less. Gravity makes the arm sag below the target, and it lags the moving pose a lot (the error graph grows).',
      'Raise B\'s mass to 4. With the same kp and kd, the larger inertia makes the arm react slowly and sag more. Raise kp with mass to keep the same feel.',
    ],
    refs: [
      'Pulls bodies toward the animation pose with Orientation, Position, Velocity, and Angular Velocity Strength.',
      'Target Rotation, Position Spring, Position Damper, Maximum Force.',
      null,
      'GDC 2017. A physics character that follows the animation pose and reacts to hits.',
      'An implicit PD that stays stable with large kp. This is why engine drives can handle high stiffness.',
    ],
    params: {
      mode: { label: 'Drive mode', group: 'Drive', options: { kinematic: 'Kinematic (overwrite pose)', pd: 'PD drive (torque)' } },
      kp: { label: 'Stiffness kp', help: 'Unity positionSpring, Unreal Orientation Strength' },
      kd: { label: 'Damping kd', help: 'Unity positionDamper, Unreal Angular Velocity Strength' },
      mass: { label: 'Arm mass', help: 'Inertia I grows with mass' },
      gravity: 'Gravity',
      impact: { label: 'Hit strength', group: 'Hits' },
      auto: { label: 'Periodic hits', help: 'A ball hits the hand every 2.5 s' },
      animSpeed: { label: 'Animation speed', group: 'Scene' },
      hit: 'Hit',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    // 길이 단위: 위팔 1. 화면 배율은 render에서 정함
    const L1 = 1, L2 = 0.85;
    const H = 1 / 240;                 // 고정 물리 스텝
    const HIT_EVERY = 2.5, FLIGHT = 0.35;
    const HIST = 300;

    let t, animT, acc, th, w, hitT, ball, hist, peak, flash;

    // 애니메이션 목표 포즈. 각도는 아래 방향 기준, 화면 오른쪽(+x)으로 돌면 +
    function target(tt) {
      return [0.55 + 0.55 * Math.sin(1.4 * tt), 0.8 + 0.45 * Math.sin(1.4 * tt + 1.1)];
    }
    function targetVel(tt) {
      return [0.55 * 1.4 * Math.cos(1.4 * tt), 0.45 * 1.4 * Math.cos(1.4 * tt + 1.1)];
    }
    // 관절 위치 (어깨 원점, 단위 길이)
    function pose(a) {
      const e = { x: Math.sin(a[0]) * L1, y: Math.cos(a[0]) * L1 };
      const h = { x: e.x + Math.sin(a[0] + a[1]) * L2, y: e.y + Math.cos(a[0] + a[1]) * L2 };
      return { e, h };
    }
    // 관성: 관절을 독립된 회전체로 근사 (어깨는 팔 전체, 팔꿈치는 아래팔)
    const inertia = () => [P.mass * 1.0, P.mass * 0.3];

    function init() {
      t = 0; animT = 0; acc = 0;
      th = target(0); w = [0, 0];
      hitT = 1.2; ball = null; hist = []; peak = 0; flash = 0;
    }
    init();

    function launch() { ball = { t: 0, done: false }; }

    function applyHit() {
      flash = 0.5;
      if (P.mode !== 'pd') return;       // 키네마틱: 다음 프레임에 애니메이션이 덮어씀
      const I = inertia(), p = pose(th);
      const J = { x: -P.impact, y: 0 };  // 오른쪽에서 날아온 공이 왼쪽으로 침
      // 각 관절에서 손끝까지의 팔 r에 대한 각충격량 r x J (화면 좌표, y 아래)
      const cross = (r) => r.x * J.y - r.y * J.x;
      // 각도 증가 방향(+x로 회전)은 화면 좌표에서 시계 반대 방향 → 부호 반전
      w[0] += -cross(p.h) / I[0];
      w[1] += -cross({ x: p.h.x - p.e.x, y: p.h.y - p.e.y }) / I[1];
    }

    function step(dt) {
      animT += dt * P.animSpeed;
      const tg = target(animT);
      if (P.mode === 'kinematic') {
        const tv = targetVel(animT);
        th = tg; w = [tv[0] * P.animSpeed, tv[1] * P.animSpeed];
        return;
      }
      const I = inertia();
      const g = P.gravity ? 9.8 * 1.6 : 0;
      for (let j = 0; j < 2; j++) {
        const err = tg[j] - th[j];
        // τ = kp * e - kd * ω. 감쇠 항(-kd * ω)은 아래 암시적 풀이의 분모에 들어감
        let tau = P.kp * err;
        // 중력 토크: 어깨는 팔 전체 무게, 팔꿈치는 아래팔 무게. 아래 방향으로 당김
        if (j === 0) tau -= g * P.mass * 0.6 * Math.sin(th[0]);
        else tau -= g * P.mass * 0.25 * Math.sin(th[0] + th[1]);
        // 스프링과 댐퍼를 암시적으로 풂(stable PD). 큰 kp, kd에서도 발산하지 않음
        w[j] = (w[j] + (dt / I[j]) * tau) / (1 + (dt / I[j]) * (P.kd + dt * P.kp));
        th[j] += w[j] * dt;
      }
    }

    function handErr() {
      const a = pose(th).h, b = pose(target(animT)).h;
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    return {
      update(dt) {
        if (dt <= 0) return;
        t += dt;
        if (P.auto) { hitT -= dt; if (hitT <= 0) { hitT = HIT_EVERY; launch(); } }
        if (ball && !ball.done) {
          ball.t += dt;
          if (ball.t >= FLIGHT) { ball.done = true; ball.t = 0; applyHit(); }
        } else if (ball && ball.done) { ball.t += dt; if (ball.t > 0.6) ball = null; }
        acc += dt;
        let n = 0;
        while (acc >= H && n < 60) { step(H); acc -= H; n++; }
        if (n >= 60) acc = 0;
        flash = Math.max(0, flash - dt);
        const e = handErr();
        hist.push(e); if (hist.length > HIST) hist.shift();
        peak = Math.max(peak * Math.exp(-dt * 0.3), e);
      },
      render() {
        const g = ctx.g, W = ctx.width, Hh = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        const plotH = Math.min(70, Hh * 0.18);
        const s = Math.min(W * 0.32, (Hh - plotH - 40) * 0.5);
        const ox = W * 0.38, oy = Math.max(30, (Hh - plotH) * 0.22);
        D.grid(g, W, Hh, 40);
        const X = (p) => ox + p.x * s, Y = (p) => oy + p.y * s;
        const tg = target(animT), tp = pose(tg), cp = pose(th);
        const S0 = { x: 0, y: 0 };

        // 몸통(고정)
        D.rect(g, ox - 34, oy - 26, 34, s * 1.2, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.12)');
        D.circle(g, ox - 17, oy - 44, 16, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.12)');

        // 목표 포즈 (유령)
        g.setLineDash([6, 5]);
        D.line(g, X(S0), Y(S0), X(tp.e), Y(tp.e), 'rgba(216,221,230,0.45)', 3);
        D.line(g, X(tp.e), Y(tp.e), X(tp.h), Y(tp.h), 'rgba(216,221,230,0.45)', 3);
        g.setLineDash([]);
        D.circle(g, X(tp.e), Y(tp.e), 5, null, 'rgba(216,221,230,0.45)', 1.5);
        D.circle(g, X(tp.h), Y(tp.h), 7, null, 'rgba(216,221,230,0.45)', 1.5);

        // 관절 오차 호 (스프링 오차)
        const arc = (cx, cy, base, a0, a1, r) => {
          if (Math.abs(a1 - a0) < 0.01) return;
          // 아래 방향 기준 각도 → 캔버스 각도: PI/2 - a
          g.beginPath(); g.arc(cx, cy, r, Math.PI / 2 - (base + a0), Math.PI / 2 - (base + a1), a1 > a0);
          g.strokeStyle = C.bad; g.lineWidth = 3; g.stroke();
        };
        arc(X(S0), Y(S0), 0, th[0], tg[0], s * 0.32);
        arc(X(cp.e), Y(cp.e), th[0], th[1], tg[1], s * 0.26);
        // 손끝 스프링 오차
        g.setLineDash([2, 3]);
        D.line(g, X(cp.h), Y(cp.h), X(tp.h), Y(tp.h), C.bad, 1.5);
        g.setLineDash([]);

        // 현재 포즈
        D.line(g, X(S0), Y(S0), X(cp.e), Y(cp.e), col, 8);
        D.line(g, X(cp.e), Y(cp.e), X(cp.h), Y(cp.h), col, 7);
        D.circle(g, X(S0), Y(S0), 7, C.bg, col, 2);
        D.circle(g, X(cp.e), Y(cp.e), 6, C.bg, col, 2);
        D.circle(g, X(cp.h), Y(cp.h), 9, col);

        // 공
        if (ball) {
          const hx = X(cp.h), hy = Y(cp.h);
          let bx, by;
          if (!ball.done) { const k = ball.t / FLIGHT; bx = U.lerp(W + 20, hx + 14, k); by = U.lerp(hy - 40, hy, k); }
          else { bx = hx + 14 + ball.t * 300; by = hy - ball.t * 120 + ball.t * ball.t * 400; }
          D.circle(g, bx, by, 8, C.warn || C.accent);
        }
        if (flash > 0) {
          const msg = P.mode === 'pd' ? GTL.L('타격: 토크로 밀림', 'Hit: pushed by torque') : GTL.L('타격 무시: 포즈를 덮어씀', 'Hit ignored: pose overwritten');
          D.text(g, msg, X(cp.h) + 16, Y(cp.h) + 14, { size: 12, color: P.mode === 'pd' ? C.good : C.bad });
        }

        D.text(g, GTL.L('점선: 애니메이션 목표 포즈', 'Dashed: animation target pose'), W - 10, 10, { size: 11, color: C.dim, align: 'right' });
        D.text(g, GTL.L('빨강: 스프링 오차', 'Red: spring error'), W - 10, 26, { size: 11, color: C.bad, align: 'right' });

        // 손끝 오차 그래프
        D.plot(g, hist.map((v) => Math.min(v, 0.6)), 10, Hh - plotH - 8, W - 20, plotH, { min: 0, max: 0.6, color: col, label: GTL.L('손끝 오차 (최근 5초)', 'Hand error (last 5 s)') });

        const deg = (r) => (Math.atan2(Math.sin(r), Math.cos(r)) * 180 / Math.PI).toFixed(1) + '°';
        ctx.stat(GTL.L('어깨 오차', 'Shoulder error'), deg(tg[0] - th[0]));
        ctx.stat(GTL.L('팔꿈치 오차', 'Elbow error'), deg(tg[1] - th[1]));
        ctx.stat(GTL.L('손끝 오차 최대 (위팔 길이 대비)', 'Peak hand error (vs upper arm)'), (peak * 100).toFixed(0) + ' %');
        if (P.mode === 'pd') {
          const I = inertia();
          ctx.stat(GTL.L('감쇠비 ζ (어깨)', 'Damping ratio ζ (shoulder)'), (P.kd / (2 * Math.sqrt(P.kp * I[0]))).toFixed(2));
        } else ctx.stat(GTL.L('타격 반응', 'Hit reaction'), GTL.L('없음', 'none'));
      },
      onAction(key) {
        if (key === 'hit') launch();
        if (key === 'restart') init();
      },
    };
  },
});
