// 반발(restitution) & 마찰(friction) 계수 결합 모드: Average / Min / Max / Multiply / Geometric mean
GTL.register({
  id: 'material-combine',
  title: '반발 & 마찰 결합 모드 (Combine Mode)',
  summary: '두 물체가 닿을 때 어느 쪽 마찰 계수와 반발 계수를 쓸지는 엔진마다 다름. Unity/PhysX 기본(평균)과 Box2D 기본(마찰 기하평균, 반발 최댓값)은 같은 재질에서도 전혀 다르게 튐.',
  views: { a: 'Unity 기본 (Average/Average)', b: 'Box2D 기본 (√(μ₁μ₂) / max)' },
  controls: '조작 없음. 7초마다 다시 떨어뜨리고 밀어냄.',
  info: `
    <p><b>결합 모드</b>(Combine Mode)는 두 물체의 재질 계수를 하나로 합치는 규칙. 계수는 <b>물체 하나</b>에 붙지만, 접촉은 <b>두 물체</b> 사이에서 일어나기 때문에 필요함.</p>
    <p>엔진별 기본 규칙:</p>
    <ul>
      <li><b>Unity(PhysX)</b>: <code>PhysicsMaterial.frictionCombine / bounceCombine</code>으로 Average, Minimum, Multiply, Maximum 중 고름. 기본은 Average. 두 재질의 모드가 다르면 Average &lt; Minimum &lt; Multiply &lt; Maximum 순으로 높은 쪽을 씀.</li>
      <li><b>Box2D</b>: 마찰은 <code>√(μ₁*μ₂)</code>, 반발은 <code>max(e₁, e₂)</code>. 한쪽만 미끄러워도 미끄럽고, 한쪽만 탱탱해도 튐.</li>
    </ul>
    <p>장면 구성:</p>
    <ul>
      <li>위: 공 5개를 같은 높이에서 떨어뜨림. <code>반등 속도 = e × 충돌 속도</code>, 반등 높이 ≈ <code>e² × 낙하 높이</code>.</li>
      <li>아래: 퍽 5개를 같은 속도로 밀어냄. 마찰 감속은 <code>μ*g</code>, 정지 거리는 <code>v₀² / (2μg)</code>. 끝 벽에서는 반발로 되튐.</li>
    </ul>
    <p>대부분의 엔진은 <b>반발 임계 속도</b>도 둠(Box2D <code>restitutionThreshold</code>, Unity <code>Bounce Threshold</code>). 아주 느린 충돌의 반발을 무시해 공이 바닥에서 끝없이 잘게 튀는 것을 막음.</p>
    <p>단점: 결합 규칙이 엔진마다 달라서 같은 재질 값을 다른 엔진으로 옮기면 느낌이 달라짐.</p>`,
  // 도식: 같은 두 재질 값을 결합 모드별로 합친 결과. 주황은 Unity 기본, 파랑은 Box2D 기본
  diagram: (L) => {
    const bars = (x0, rows) => rows.map(([name, v, cls], i) => {
      const y = 40 + i * 22;
      return `<text x="${x0}" y="${y + 11}" class="t-small">${name}</text>
      <rect x="${x0 + 84}" y="${y + 2}" width="${Math.max(2, v * 140).toFixed(1)}" height="12" class="${cls}"/>
      <text x="${(x0 + 88 + v * 140).toFixed(1)}" y="${y + 12}" class="t-small t-mono">${v}</text>`;
    }).join('');
    return `<svg viewBox="0 0 540 176" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="22">${L('마찰 μ: 얼음 0.1 + 고무 0.9', 'Friction μ: ice 0.1 + rubber 0.9')}</text>
    ${bars(10, [['Average', 0.5, 'f-a'], ['Minimum', 0.1, 'f-dim'], ['Multiply', 0.09, 'f-dim'], ['Maximum', 0.9, 'f-dim'], ['√(μ₁μ₂)', 0.3, 'f-b']])}
    <text x="285" y="22">${L('반발 e: 0.2 + 0.8', 'Bounce e: 0.2 + 0.8')}</text>
    ${bars(285, [['Average', 0.5, 'f-a'], ['Minimum', 0.2, 'f-dim'], ['Multiply', 0.16, 'f-dim'], ['Maximum', 0.8, 'f-b']])}
    <rect x="10" y="158" width="10" height="10" class="f-a"/><text x="26" y="167" class="t-small">${L('Unity 기본', 'Unity default')}</text>
    <rect x="110" y="158" width="10" height="10" class="f-b"/><text x="126" y="167" class="t-small">${L('Box2D 기본', 'Box2D default')}</text>
    <text x="285" y="167" class="t-small t-dim">${L('같은 재질 쌍도 규칙에 따라 0.09 ~ 0.9', 'Same pair gives 0.09 ~ 0.9 by rule')}</text>
  </svg>`;
  },
  look: [
    'A와 B의 공 반등 높이를 비교하면 B(max)에서는 탱탱한 재질이 바닥 재질과 관계없이 거의 자기 반발대로 튐.',
    '퍽 정지 위치를 보면 B(기하평균)에서 얼음 퍽이 거의 끝까지 미끄러짐. 바닥 마찰을 0으로 하면 B의 모든 퍽이 감속 없이 벽까지 감(√(μ*0)=0). A(평균)의 고무 퍽은 여전히 멈춤.',
    '결합 모드를 Multiply로 바꾸면 계수가 곱해져 전체적으로 미끄럽고 덜 튐. Maximum은 반대.',
    '반발 임계 속도를 0으로 하면 공이 바닥에서 잘게 오래 떨림. 크게 하면 낮은 반등이 바로 멈춤.',
  ],
  refs: [
    { type: 'engine', title: 'Unity - Physic Material (Friction Combine / Bounce Combine)', url: 'https://docs.unity3d.com/Manual/class-PhysicMaterial.html' },
    { type: 'engine', title: 'NVIDIA PhysX - PxCombineMode (eAVERAGE, eMIN, eMULTIPLY, eMAX)', note: 'PxMaterial의 friction, restitution 결합 모드.' },
    { type: 'code', title: 'Box2D - b2MixFriction (sqrt) / b2MixRestitution (max)', url: 'https://github.com/erincatto/box2d' },
    { type: 'engine', title: 'Godot - PhysicsMaterial (rough / absorbent)', url: 'https://docs.godotengine.org/en/stable/classes/class_physicsmaterial.html', note: 'rough, absorbent 플래그로 결합 방식을 바꿈.' },
  ],
  params: [
    { key: 'frictionCombine', label: '마찰 결합', type: 'select', group: '결합 모드', options: [
      { value: 'average', label: 'Average (평균)' },
      { value: 'min', label: 'Minimum' },
      { value: 'multiply', label: 'Multiply (곱)' },
      { value: 'max', label: 'Maximum' },
      { value: 'geomean', label: '√(μ₁μ₂) (Box2D)' },
    ], a: 'average', b: 'geomean' },
    { key: 'bounceCombine', label: '반발 결합', type: 'select', options: [
      { value: 'average', label: 'Average (평균)' },
      { value: 'min', label: 'Minimum' },
      { value: 'multiply', label: 'Multiply (곱)' },
      { value: 'max', label: 'Maximum (Box2D)' },
      { value: 'geomean', label: '√(e₁e₂)' },
    ], a: 'average', b: 'max' },
    { key: 'threshold', label: '반발 임계 속도 (px/s)', type: 'range', min: 0, max: 300, step: 5, default: 40, help: '이 속도보다 느린 충돌은 반발 0' },
    { key: 'floorFriction', label: '바닥 마찰 μ', type: 'range', min: 0, max: 1, step: 0.01, default: 0.1, shared: true, group: '바닥 재질' },
    { key: 'floorBounce', label: '바닥 반발 e', type: 'range', min: 0, max: 1, step: 0.01, default: 0.2, shared: true },
    { key: 'v0', label: '퍽 초기 속도 (px/s)', type: 'range', min: 100, max: 1200, step: 10, default: 380, shared: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Restitution & Friction Combine Modes',
    summary: 'When two bodies touch, engines differ in which friction and restitution values they use. The Unity/PhysX default (average) and the Box2D default (geometric mean friction, max restitution) bounce very differently with the same materials.',
    views: { a: 'Unity default (Average/Average)', b: 'Box2D default (√(μ₁μ₂) / max)' },
    controls: 'No input. The scene drops and pushes the objects again every 7 seconds.',
    info: `
    <p>A <b>combine mode</b> is the rule that merges the material values of two bodies into one. Each value belongs to <b>one body</b>, but a contact happens between <b>two bodies</b>, so you need a rule.</p>
    <p>Default rules by engine:</p>
    <ul>
      <li><b>Unity (PhysX)</b>: <code>PhysicsMaterial.frictionCombine / bounceCombine</code> picks Average, Minimum, Multiply, or Maximum. The default is Average. If the two materials use different modes, the higher one wins in the order Average &lt; Minimum &lt; Multiply &lt; Maximum.</li>
      <li><b>Box2D</b>: friction is <code>√(μ₁*μ₂)</code>, and restitution is <code>max(e₁, e₂)</code>. If either side is slippery, the contact is slippery. If either side is bouncy, it bounces.</li>
    </ul>
    <p>Scene setup:</p>
    <ul>
      <li>Top: 5 balls drop from the same height. <code>Bounce speed = e × impact speed</code>, and bounce height ≈ <code>e² × drop height</code>.</li>
      <li>Bottom: 5 pucks slide off at the same speed. Friction slows them by <code>μ*g</code>, and they stop after <code>v₀² / (2μg)</code>. They bounce back off the end wall.</li>
    </ul>
    <p>Most engines also have a <b>restitution threshold</b> (Box2D <code>restitutionThreshold</code>, Unity <code>Bounce Threshold</code>). It ignores restitution in very slow impacts, so a ball does not jitter on the floor forever.</p>
    <p>Downside: combine rules differ between engines. If you move the same material values to another engine, the feel changes.</p>`,
    look: [
      'Compare the ball bounce heights in A and B. In B (max), bouncy materials bounce with almost their own restitution, whatever the floor material is.',
      'Look where the pucks stop. In B (geometric mean), the ice puck slides almost to the end. Set floor friction to 0 and every puck in B reaches the wall without slowing (√(μ*0)=0). The rubber puck in A (average) still stops.',
      'Switch the combine mode to Multiply. The values multiply, so everything is more slippery and bounces less. Maximum does the opposite.',
      'Set the restitution threshold to 0. The balls jitter on the floor for a long time. Raise it and low bounces stop right away.',
    ],
    refs: [null, 'Combine modes for PxMaterial friction and restitution.', null, 'The rough and absorbent flags change how values combine.'],
    params: {
      frictionCombine: { label: 'Friction combine', group: 'Combine mode', options: { average: 'Average', multiply: 'Multiply' } },
      bounceCombine: { label: 'Restitution combine', options: { average: 'Average', multiply: 'Multiply' } },
      threshold: { label: 'Restitution threshold (px/s)', help: 'Impacts slower than this get zero restitution' },
      floorFriction: { label: 'Floor friction μ', group: 'Floor material' },
      floorBounce: 'Floor restitution e',
      v0: 'Puck start speed (px/s)',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const LW = 600, LH = 420, GRAV = 900, HZ = 240;
    const MATS = [
      { name: GTL.L('고무', 'Rubber'), mu: 0.9, e: 0.8, col: '#ff7a59' },
      { name: GTL.L('나무', 'Wood'), mu: 0.45, e: 0.45, col: '#d9a066' },
      { name: GTL.L('금속', 'Metal'), mu: 0.2, e: 0.3, col: '#9aa3b2' },
      { name: GTL.L('얼음', 'Ice'), mu: 0.02, e: 0.1, col: '#89ddff' },
      { name: GTL.L('슈퍼볼', 'Super ball'), mu: 0.6, e: 0.95, col: '#c792ea' },
    ];
    const combine = (mode, a, b) => {
      switch (mode) {
        case 'min': return Math.min(a, b);
        case 'max': return Math.max(a, b);
        case 'multiply': return a * b;
        case 'geomean': return Math.sqrt(a * b);
        default: return (a + b) / 2;
      }
    };
    const FLOOR_Y = 190, DROP_Y = 30, BR = 12;
    const LANE_Y0 = 250, LANE_H = 32, PX0 = 40, WALL_X = 575, PS = 18;
    let balls, pucks, acc, cycle;
    const init = () => {
      balls = MATS.map((m, i) => ({ m, x: 80 + i * 110, y: DROP_Y, vy: 0, apex: [], rising: false, peak: FLOOR_Y, bounces: 0 }));
      pucks = MATS.map((m) => ({ m, x: PX0, v: P.v0, stopped: false, travel: 0 }));
      acc = 0; cycle = 0;
    };
    init();

    function step(h) {
      const eF = P.floorBounce, muF = P.floorFriction;
      for (const b of balls) {
        b.vy += GRAV * h; b.y += b.vy * h;
        if (b.y + BR >= FLOOR_Y) {
          b.y = FLOOR_Y - BR;
          if (b.vy > 0) {
            const e = combine(P.bounceCombine, b.m.e, eF);
            if (b.vy < P.threshold) b.vy = 0;
            else { b.vy = -b.vy * e; b.rising = true; b.peak = b.y; b.bounces++; }
          }
        }
        if (b.rising) {
          b.peak = Math.min(b.peak, b.y);
          if (b.vy >= 0) { b.rising = false; if (FLOOR_Y - BR - b.peak > 0.5) { b.apex.push(b.peak); if (b.apex.length > 6) b.apex.shift(); } }
        }
      }
      for (const p of pucks) {
        if (p.stopped) continue;
        const mu = combine(P.frictionCombine, p.m.mu, muF);
        const dec = mu * GRAV * h;
        const sgn = Math.sign(p.v);
        if (Math.abs(p.v) <= dec) { p.v = 0; p.stopped = true; continue; }
        p.v -= sgn * dec;
        const nx = p.x + p.v * h;
        p.travel += Math.abs(nx - p.x);
        p.x = nx;
        if (p.x + PS / 2 >= WALL_X && p.v > 0) {
          p.x = WALL_X - PS / 2;
          const e = combine(P.bounceCombine, p.m.e, eF);
          p.v = p.v < P.threshold ? 0 : -p.v * e;
          if (!p.v) p.stopped = true;
        }
        if (p.x - PS / 2 <= 25 && p.v < 0) { p.x = 25 + PS / 2; p.v = 0; p.stopped = true; }
      }
    }

    return {
      update(dt) {
        cycle += dt;
        if (cycle > 7) init();
        acc += dt;
        const h = 1 / HZ;
        let n = 0;
        while (acc >= h && n < 60) { step(h); acc -= h; n++; }
        if (n >= 60) acc = 0;
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const s = Math.min(W / LW, H / LH);
        g.save(); g.translate((W - LW * s) / 2, (H - LH * s) / 2); g.scale(s, s);
        const col = ctx.side === 'a' ? C.a : C.b;
        D.grid(g, LW, LH, 30);
        // ── 낙하 ──
        D.rect(g, 20, FLOOR_Y, LW - 40, 6, '#5a6270');
        g.setLineDash([3, 5]); D.line(g, 20, DROP_Y + BR, LW - 20, DROP_Y + BR, 'rgba(255,255,255,0.2)'); g.setLineDash([]);
        D.text(g, GTL.L('낙하 높이', 'Drop height'), 24, DROP_Y + BR - 14, { size: 10, color: C.dim });
        for (const b of balls) {
          const e = combine(P.bounceCombine, b.m.e, P.floorBounce);
          // 이론 첫 반등 높이 e²h
          const h0 = FLOOR_Y - BR - DROP_Y, th = FLOOR_Y - BR - h0 * e * e;
          D.line(g, b.x - 22, th, b.x + 22, th, 'rgba(102,209,122,0.5)', 1);
          b.apex.forEach((y, i) => D.line(g, b.x + 16, y, b.x + 30, y, `rgba(255,255,255,${0.25 + 0.12 * (6 - i)})`, 2));
          D.circle(g, b.x, b.y, BR, b.m.col, col, 2);
          D.text(g, b.m.name, b.x, FLOOR_Y + 10, { size: 11, align: 'center', color: C.text });
          D.text(g, `e=${b.m.e} → ${e.toFixed(2)}`, b.x, FLOOR_Y + 24, { size: 10, align: 'center', color: col });
        }
        // ── 미끄러짐 ──
        D.text(g, GTL.L(`퍽 미끄러짐 (바닥 μ=${P.floorFriction.toFixed(2)}, e=${P.floorBounce.toFixed(2)})`, `Puck slide (floor μ=${P.floorFriction.toFixed(2)}, e=${P.floorBounce.toFixed(2)})`), 24, LANE_Y0 - 26, { size: 11, color: C.dim });
        D.rect(g, WALL_X, LANE_Y0 - 6, 6, LANE_H * MATS.length + 4, '#5a6270');
        pucks.forEach((p, i) => {
          const y = LANE_Y0 + i * LANE_H;
          D.rect(g, 25, y + LANE_H - 8, WALL_X - 25, 1, 'rgba(255,255,255,0.12)');
          const mu = combine(P.frictionCombine, p.m.mu, P.floorFriction);
          // 이론 정지 위치
          const sd = mu > 0 ? (P.v0 * P.v0) / (2 * mu * GRAV) : Infinity;
          if (PX0 + sd < WALL_X) D.line(g, PX0 + sd, y + 2, PX0 + sd, y + LANE_H - 6, 'rgba(102,209,122,0.6)', 1.5);
          D.rect(g, p.x - PS / 2, y + LANE_H - 8 - PS, PS, PS, p.m.col, p.stopped ? '#fff' : col, 1.5);
          D.text(g, `${p.m.name} μ=${p.m.mu}→${mu.toFixed(2)}`, 30, y + 1, { size: 10, color: col });
        });
        g.restore();
        const ballE = MATS.map((m) => combine(P.bounceCombine, m.e, P.floorBounce).toFixed(2)).join(' / ');
        const puckMu = MATS.map((m) => combine(P.frictionCombine, m.mu, P.floorFriction).toFixed(2)).join(' / ');
        ctx.stat(GTL.L('결합 반발 e', 'Combined restitution e'), ballE);
        ctx.stat(GTL.L('결합 마찰 μ', 'Combined friction μ'), puckMu);
        ctx.stat(GTL.L('미끄러진 거리', 'Slide distance'), pucks.map((p) => p.travel.toFixed(0)).join(' / ') + ' px');
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
