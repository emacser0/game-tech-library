// 각도 보간: 각도를 일반 숫자처럼 lerp하면 ±180° 경계에서 반대 방향으로 한 바퀴 돎.
GTL.register({
  id: 'angle-interpolation',
  title: '각도 보간: 최단 경로 (lerpAngle)',
  summary: 'atan2가 돌려주는 각도는 -180°~180° 경계에서 끊김. 그냥 lerp하면 경계를 넘을 때 포탑이 반대 방향으로 거의 한 바퀴 돎. 각도 차이를 [-π, π]로 감싸면 최단 경로로 보간됨.',
  views: { a: '단순 lerp', b: '최단 경로 lerpAngle' },
  controls: '마우스를 뷰 안에 두면 포탑이 마우스를 조준함. 포탑 왼쪽을 지나가 볼 것. 마우스가 밖에 있으면 목표가 자동으로 회전함.',
  info: `
    <p>각도는 원 위의 값. <code>170°</code>와 <code>-170°</code>는 실제로 20°만 떨어져 있음. 하지만 숫자로는 340° 차이.</p>
    <p><code>lerp(a, b, t)</code>는 숫자 사이를 보간함. 그래서 <b>긴 쪽(340°)으로 돌아감</b>.
    마우스 조준 포탑, 캐릭터 회전, 카메라 yaw(좌우 회전)에서 흔한 버그.</p>
    <p>해결 방법은 차이를 먼저 감싸는 것: <code>d = wrap(b - a, -π, π)</code>, <code>a + d*t</code>.
    Unity의 <code>Mathf.LerpAngle</code>와 Godot의 <code>lerp_angle</code>이 이 방식.
    3D 회전에서는 쿼터니언 내적 부호를 확인해 같은 문제를 해결함(<code>dot &lt; 0</code>이면 -q 사용).</p>
    <p>아래 다이얼은 무작위 각도 사이를 트윈함. 빨간 호는 180°보다 긴 경로로 돌아간 경우.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 180" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arrA" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    <marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <circle cx="130" cy="90" r="56" class="d-dim"/>
    <line x1="130" y1="90" x2="50" y2="90" class="d-bad" stroke-dasharray="4 3"/>
    <line x1="130" y1="90" x2="196" y2="90" class="d-dim"/>
    <text x="200" y="94" class="t-small t-dim">0°</text>
    <text x="8" y="94" class="t-small">±180°</text>
    <path d="M74.9,80.3 A56,56 0 1 1 74.9,99.7" class="d-a" marker-end="url(#arrA)"/>
    <path d="M60.2,77.7 A71,71 0 0 0 60.2,102.3" class="d-b" marker-end="url(#arrB)"/>
    <circle cx="74.9" cy="80.3" r="4" class="f-accent"/><circle cx="74.9" cy="99.7" r="4" class="f-accent"/>
    <text x="84" y="76" class="t-small">170° (a)</text>
    <text x="84" y="112" class="t-small">-170° (b)</text>
    <text x="130" y="22" text-anchor="middle" class="t-a">${L('A: 340° 먼 길', 'A: 340°, the long way')}</text>
    <text x="62" y="166" text-anchor="middle" class="t-b">${L('B: 20° 최단', 'B: 20°, shortest')}</text>
    <text x="270" y="28">${L('숫자로 본 각도', 'The angle as a number')}</text>
    <line x1="270" y1="56" x2="530" y2="56" class="d-line"/>
    <line x1="270" y1="50" x2="270" y2="62" class="d-bad"/><line x1="400" y1="50" x2="400" y2="62" class="d-dim"/><line x1="530" y1="50" x2="530" y2="62" class="d-bad"/>
    <text x="270" y="44" text-anchor="middle" class="t-small t-mono">-180</text><text x="400" y="44" text-anchor="middle" class="t-small t-mono">0</text><text x="530" y="44" text-anchor="end" class="t-small t-mono">180</text>
    <circle cx="522.8" cy="56" r="3.5" class="f-accent"/><circle cx="277.2" cy="56" r="3.5" class="f-accent"/>
    <path d="M520,80 L280,80" class="d-a" marker-end="url(#arrA)"/>
    <text x="270" y="98" class="t-small t-a">${L('lerp: b - a = -340°, 거의 한 바퀴', 'lerp: b - a = -340°, almost a full turn')}</text>
    <path d="M523,120 L530,120" class="d-b"/><path d="M270,120 L276,120" class="d-b" marker-end="url(#arrB)"/>
    <text x="400" y="124" text-anchor="middle" class="t-small t-dim">${L('경계에서 반대쪽 끝으로 이어짐', 'continues from the other end')}</text>
    <text x="270" y="142" class="t-small t-b">${L('lerpAngle: d = wrap(b - a) = +20°', 'lerpAngle: d = wrap(b - a) = +20°')}</text>
    <text x="270" y="166" class="t-small t-dim">${L('차이를 감싸면 항상 짧은 쪽으로 회전', 'Wrapping the difference turns the short way')}</text>
  </svg>`,
  look: [
    'A에서 목표(점)가 포탑 왼쪽(±180° 경계)을 지나면 포탑이 반대로 휙 한 바퀴 돎. B는 계속 따라감.',
    '"총 회전량 / 목표 회전량" 값을 보면 B는 1.0 근처를 유지하고 A는 경계를 넘을 때마다 크게 늘어남.',
    '다이얼을 보면 A는 절반 정도가 빨간 호(먼 길)로 돎. B는 항상 180° 이하의 초록 호.',
    '추적 속도를 높이면 A의 헛회전이 빨라질 뿐 사라지지 않음. 속도가 아니라 각도 표현(wrap)의 문제.',
  ],
  refs: [
    { type: 'engine', title: 'Unity - Mathf.LerpAngle', url: 'https://docs.unity3d.com/ScriptReference/Mathf.LerpAngle.html', note: '360° 경계를 고려해 올바르게 보간.' },
    { type: 'engine', title: 'Godot - @GlobalScope.lerp_angle', url: 'https://docs.godotengine.org/en/stable/classes/class_%40globalscope.html', note: 'lerp_angle, angle_difference' },
    { type: 'paper', title: 'Animating Rotation with Quaternion Curves (Ken Shoemake)', year: 1985, note: 'SIGGRAPH \'85. 3D 회전의 최단 경로(q vs -q) 문제의 출발점.' },
  ],
  params: [
    { key: 'method', label: '보간 방식', type: 'select', group: '보간', options: [
      { value: 'naive', label: '단순 lerp(a, b, t)' },
      { value: 'shortest', label: '최단 경로 lerpAngle' },
    ], a: 'naive', b: 'shortest' },
    { key: 'speed', label: '포탑 추적 속도 λ', type: 'range', min: 1, max: 20, step: 0.5, default: 6, help: 'damp(현재, 목표, λ, dt)' },
    { key: 'tween', label: '다이얼 트윈 시간 (초)', type: 'range', min: 0.2, max: 2, step: 0.05, default: 0.8, shared: true },
    { key: 'orbit', label: '자동 목표 각속도 (°/s)', type: 'range', min: 10, max: 360, step: 5, default: 90, shared: true, group: '장면' },
    { key: 'dials', label: '다이얼 개수', type: 'int', min: 1, max: 10, default: 6, shared: true, reset: true },
  ],
  en: {
    title: 'Angle Interpolation: Shortest Path (lerpAngle)',
    summary: 'Angles from atan2 jump at the -180°~180° boundary. With a plain lerp, the turret spins almost a full turn the wrong way when the target crosses that boundary. Wrap the angle difference into [-π, π] and the interpolation takes the shortest path.',
    views: { a: 'Plain lerp', b: 'Shortest path lerpAngle' },
    controls: 'Keep the mouse inside the view and the turret aims at it. Try moving past the left side of the turret. When the mouse is outside, the target circles on its own.',
    info: `
    <p>An angle is a value on a circle. <code>170°</code> and <code>-170°</code> are really only 20° apart. As numbers, though, they differ by 340°.</p>
    <p><code>lerp(a, b, t)</code> interpolates between numbers. So it <b>goes the long way (340°)</b>.
    This is a common bug in mouse-aimed turrets, character turning, and camera yaw (left and right turning).</p>
    <p>The fix is to wrap the difference first: <code>d = wrap(b - a, -π, π)</code>, then <code>a + d*t</code>.
    Unity's <code>Mathf.LerpAngle</code> and Godot's <code>lerp_angle</code> work this way.
    For 3D rotations, you solve the same problem by checking the sign of the quaternion dot product (use -q if <code>dot &lt; 0</code>).</p>
    <p>The dials below tween between random angles. A red arc means the tween took a path longer than 180°.</p>`,
    look: [
      'In A, when the target (dot) passes the left side of the turret (the ±180° boundary), the turret whips a full turn the other way. B keeps following.',
      'Check the "Total turn / target turn" value. B stays near 1.0. A grows a lot each time the target crosses the boundary.',
      'Look at the dials. In A, about half of them turn along a red arc (the long way). In B, the arc is always green and 180° or less.',
      'Raise the tracking speed. A\'s wasted spins only get faster, they do not go away. The problem is the angle representation (wrap), not the speed.',
    ],
    refs: [
      'Interpolates correctly across the 360° boundary.',
      null,
      'SIGGRAPH \'85. The starting point of the shortest path problem (q vs -q) for 3D rotation.',
    ],
    params: {
      method: { label: 'Interpolation method', group: 'Interpolation', options: { naive: 'Plain lerp(a, b, t)', shortest: 'Shortest path lerpAngle' } },
      speed: { label: 'Turret tracking speed λ', help: 'damp(current, target, λ, dt)' },
      tween: 'Dial tween time (s)',
      orbit: { label: 'Auto target speed (°/s)', group: 'Scene' },
      dials: 'Dial count',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const PI = Math.PI;
    let tAng = 0, orbitDir = 1, dirTimer = 3, angle = 0, prevAngle = 0, prevT = 0, turretTravel = 0, targetTravel = 0;
    const dials = [];
    for (let i = 0; i < P.dials; i++) {
      const a0 = ctx.rng.range(-PI, PI);
      dials.push({ from: a0, to: a0, cur: a0, t: 1, wait: ctx.rng.range(0.2, 1.2) });
    }
    const interp = (a, b, t) => (P.method === 'naive' ? U.lerp(a, b, t) : U.lerpAngle(a, b, t));
    const center = () => ({ x: ctx.width * 0.5, y: ctx.height * 0.4 });
    const targetPos = () => {
      const c = center(), m = ctx.input.mouse, R = Math.min(ctx.width, ctx.height) * 0.28;
      if (m.inside) return { x: m.x, y: m.y };
      return { x: c.x + Math.cos(tAng) * R, y: c.y + Math.sin(tAng) * R };
    };

    return {
      update(dt) {
        dirTimer -= dt;
        if (dirTimer <= 0) { orbitDir = ctx.random() < 0.7 ? orbitDir : -orbitDir; dirTimer = ctx.rng.range(2, 5); }
        tAng += orbitDir * U.rad(P.orbit) * dt;
        const c = center(), tp = targetPos();
        const target = Math.atan2(tp.y - c.y, tp.x - c.x);           // [-π, π]
        prevAngle = angle;
        angle = interp(angle, target, 1 - Math.exp(-P.speed * dt));
        if (P.method === 'shortest') angle = U.wrap(angle, -PI, PI);
        turretTravel += Math.abs(U.angleDiff(prevAngle, angle));
        targetTravel += Math.abs(U.angleDiff(prevT, target));
        prevT = target;
        for (const d of dials) {
          if (d.t < 1) {
            d.t = Math.min(1, d.t + dt / P.tween);
            d.cur = interp(d.from, d.to, U.ease.inOutCubic(d.t));
            if (d.t >= 1) d.wait = ctx.rng.range(0.3, 1.0);
          } else if ((d.wait -= dt) <= 0) {
            d.from = U.wrap(d.cur, -PI, PI);
            d.to = ctx.rng.range(-PI, PI);
            d.t = 0;
          }
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height, c = center(), tp = targetPos();
        const col = ctx.side === 'a' ? C.a : C.b;
        const R = Math.min(W, H) * 0.28;
        D.grid(g, W, H, 40);
        // 경계선 (±180°)
        g.setLineDash([5, 5]);
        D.line(g, c.x - R * 1.3, c.y, c.x, c.y, C.bad, 1);
        g.setLineDash([]);
        D.text(g, GTL.L('±180° 경계', '±180° boundary'), c.x - R * 1.3, c.y + 4, { size: 10, color: C.bad });
        D.text(g, '0°', c.x + R * 1.15, c.y + 4, { size: 10, color: C.dim });
        D.circle(g, c.x, c.y, R, null, C.grid, 1);
        // 목표
        const target = Math.atan2(tp.y - c.y, tp.x - c.x);
        D.line(g, c.x, c.y, tp.x, tp.y, 'rgba(255,255,255,0.15)', 1);
        D.circle(g, tp.x, tp.y, 7, null, C.warn, 2);
        // 오차 호
        const err = U.angleDiff(angle, target);
        g.beginPath(); g.arc(c.x, c.y, 34, angle, angle + err, err < 0);
        g.strokeStyle = C.warn; g.lineWidth = 3; g.stroke();
        // 포탑
        g.save(); g.translate(c.x, c.y); g.rotate(angle);
        D.rect(g, 0, -6, R * 0.8, 12, col);
        g.restore();
        D.circle(g, c.x, c.y, 20, '#20242c', col, 3);
        D.text(g, GTL.L(`포탑 ${U.deg(angle).toFixed(0)}°  목표 ${U.deg(target).toFixed(0)}°`, `Turret ${U.deg(angle).toFixed(0)}°  Target ${U.deg(target).toFixed(0)}°`), 10, 10, { size: 11, color: col });

        // 다이얼 행
        const n = dials.length, dr = Math.min(28, (W - 40) / n / 2 - 6), dy = H - dr - 30;
        dials.forEach((d, i) => {
          const dx = 20 + (W - 40) * ((i + 0.5) / n);
          D.circle(g, dx, dy, dr, 'rgba(0,0,0,0.3)', C.grid);
          // 이번 트윈의 실제 경로 (from → to, method 기준)
          const span = P.method === 'naive' ? d.to - d.from : U.angleDiff(d.from, d.to);
          const long = Math.abs(span) > PI + 1e-6;
          g.beginPath(); g.arc(dx, dy, dr + 4, d.from, d.from + span, span < 0);
          g.strokeStyle = long ? C.bad : C.good; g.lineWidth = 2.5; g.stroke();
          D.line(g, dx, dy, dx + Math.cos(d.to) * dr, dy + Math.sin(d.to) * dr, 'rgba(255,255,255,0.25)', 2);
          D.line(g, dx, dy, dx + Math.cos(d.cur) * dr, dy + Math.sin(d.cur) * dr, col, 3);
          D.text(g, `${Math.abs(U.deg(span)).toFixed(0)}°`, dx, dy + dr + 8, { size: 10, color: long ? C.bad : C.dim, align: 'center' });
        });

        ctx.stat(GTL.L('현재 조준 오차', 'Current aim error'), Math.abs(U.deg(err)).toFixed(1) + '°');
        ctx.stat(GTL.L('총 회전량 / 목표 회전량', 'Total turn / target turn'), targetTravel > 0.01 ? (turretTravel / targetTravel).toFixed(2) : '-');
      },
    };
  },
});
