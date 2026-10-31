// 절차적 보행: 발을 몸에 붙여 끌고 다니기 vs 발 고정(plant) + 거리 임계값 스텝 + 2-본 IK
GTL.register({
  id: 'procedural-walk',
  title: '절차적 보행 (Procedural Walk)',
  summary: '애니메이션 클립 없이 다리를 움직이는 고전 기법. 발을 땅에 고정해 두고, 몸이 움직여 발이 이상적 위치에서 임계 거리보다 멀어지면 호를 그리며 한 걸음 내디딤. 무릎 위치는 2-본 IK로 구함.',
  views: { a: '발을 몸에 고정 (미끄러짐)', b: '발 고정 + 스텝' },
  controls: '마우스를 뷰 안에 두면 생물이 마우스를 따라감. 밖에 두면 자동으로 돌아다님.',
  info: `
    <p>각 다리에는 몸 기준 <b>휴식 위치</b>(rest)가 있음. 발을 휴식 위치에 그냥 붙이면 몸과 함께 미끄러짐. 그래서 <b>스케이트 타는 것처럼</b> 보임(foot sliding).</p>
    <p>절차적 보행의 동작 순서:</p>
    <ul>
      <li>발을 월드 좌표에 <b>고정(plant)</b>함</li>
      <li>발과 휴식 위치의 거리가 <b>임계값</b>을 넘으면 걸음을 시작</li>
      <li>정해진 스텝 시간 동안 새 위치로 호를 그리며 발을 옮김</li>
    </ul>
    <p><b>앞쪽 예측</b>: 새 위치를 휴식 위치보다 이동 방향 앞쪽(속도 × 스텝 시간)에 잡음. 걸음이 몸을 따라잡지 못하는 문제가 줄어듦.</p>
    <p><b>걸음새(gait) 조정</b>: 이웃 다리가 땅에 있을 때만 발을 듦. 교대 보행(삼각 보행 등)이 저절로 나타남.</p>
    <p>엉덩이, 무릎, 발은 해석적 <b>2-본 IK</b>(코사인 법칙)로 무릎 위치를 구함. Rain World, 각종 거미와 메카 보스, Overgrowth 등에서 쓴 방법.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 190" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arrA" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    <marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    <marker id="arrD" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="4" y="34" class="t-a">${L('A: 몸에 고정', 'A: attached')}</text>
    <text x="4" y="48" class="t-small t-dim">${L('발 = 휴식 위치', 'foot = rest spot')}</text>
    <line x1="110" y1="62" x2="530" y2="62" class="d-line"/>
    <ellipse cx="200" cy="24" rx="26" ry="9" class="f-dim" opacity="0.5"/>
    <polyline points="200,29 222,42 215,62" class="d-dim" stroke-dasharray="3 3"/>
    <ellipse cx="300" cy="24" rx="26" ry="9" class="f-dim"/>
    <polyline points="300,29 322,42 315,62" class="d-a"/>
    <circle cx="315" cy="62" r="4" class="f-a"/>
    <path d="M215,68 L311,68" class="d-a" marker-end="url(#arrA)"/>
    <text x="340" y="56" class="t-small t-a">${L('발이 몸을 따라 땅 위를 끌림', 'The foot drags along the ground')}</text>
    <text x="4" y="114" class="t-b">${L('B: 고정 + 스텝', 'B: plant + step')}</text>
    <text x="4" y="128" class="t-small t-dim">${L('발 = 월드 좌표', 'foot = world point')}</text>
    <line x1="110" y1="140" x2="530" y2="140" class="d-line"/>
    <ellipse cx="300" cy="102" rx="26" ry="9" class="f-dim"/>
    <polyline points="300,107 258,112 230,140" class="d-b"/>
    <circle cx="150" cy="140" r="2.5" class="f-dim"/>
    <circle cx="230" cy="140" r="4.5" class="f-b"/>
    <circle cx="315" cy="140" r="4.5" class="d-dim"/>
    <path d="M230,136 Q292,82 351,136" class="d-b" stroke-dasharray="4 3" marker-end="url(#arrB)"/>
    <circle cx="355" cy="140" r="4.5" class="d-b"/>
    <text x="230" y="154" text-anchor="middle" class="t-small">${L('고정된 발', 'planted foot')}</text>
    <text x="315" y="154" text-anchor="middle" class="t-small t-dim">${L('휴식 위치', 'rest spot')}</text>
    <path d="M232,162 L313,162" class="d-dim" marker-start="url(#arrD)" marker-end="url(#arrD)"/>
    <text x="272" y="176" text-anchor="middle" class="t-small">${L('d &gt; 임계값이면 걸음 시작', 'd &gt; threshold starts a step')}</text>
    <text x="364" y="112" class="t-small t-b">${L('새 위치', 'new spot')}</text>
    <text x="364" y="125" class="t-small t-b">${L('= 휴식 위치 + 속도 × 스텝 시간', '= rest + speed × step time')}</text>
    <text x="364" y="154" class="t-small t-dim">${L('걸음 사이에는 발 고정', 'Foot stays put between steps')}</text>
  </svg>`,
  look: [
    'A의 발 궤적(흐린 선)을 보면 발이 몸을 따라 계속 끌림. B는 발자국이 점으로 찍히고 걸음 사이에만 이동.',
    '"발 미끄러짐" 값을 비교하면 A는 이동 속도만큼 나오고 B는 0 px/s',
    'B에서 "걸음새 조정"을 끄면 여러 다리가 동시에 들려 허우적댐. 켜면 교대 보행이 됨.',
    '"앞쪽 예측"을 끄고 속도를 높이면 발이 계속 뒤처짐. 다리가 늘어난 채로 질질 끌림.',
  ],
  refs: [
    { type: 'talk', title: 'An Indie Approach to Procedural Animation (David Rosen)', year: 2014, note: 'GDC 2014. Overgrowth의 절차적 보행과 IK 기법.' },
    { type: 'talk', title: 'The Rain World Animation Process (Joar Jakobsson)', year: 2016, note: 'GDC 2016. 물리와 절차적 다리 배치로 만든 생물 애니메이션.' },
    { type: 'game', title: 'Rain World (Videocult)', year: 2017, note: '도마뱀, 거미 생물의 절차적 다리' },
    { type: 'article', title: 'Inverse kinematics (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Inverse_kinematics', note: 'IK 개요. 2-본 IK는 코사인 법칙으로 닫힌 해를 구함.' },
  ],
  params: [
    { key: 'mode', label: '발 처리', type: 'select', group: '보행', options: [
      { value: 'slide', label: '휴식 위치에 고정 (미끄러짐)' },
      { value: 'step', label: '발 고정 + 임계값 스텝' },
    ], a: 'slide', b: 'step' },
    { key: 'threshold', label: '스텝 임계 거리 (px)', type: 'range', min: 4, max: 50, step: 1, default: 28, when: (p) => p.mode === 'step' },
    { key: 'stepTime', label: '스텝 시간 (초)', type: 'range', min: 0.05, max: 0.6, step: 0.01, default: 0.16, when: (p) => p.mode === 'step' },
    { key: 'gait', label: '걸음새 조정 (이웃 다리 대기)', type: 'bool', default: true, when: (p) => p.mode === 'step' },
    { key: 'predict', label: '앞쪽 예측 (속도 × 스텝 시간)', type: 'bool', default: true, when: (p) => p.mode === 'step' },
    { key: 'speed', label: '이동 속도 (px/s)', type: 'range', min: 20, max: 400, step: 5, default: 140, shared: true, group: '장면' },
    { key: 'pairs', label: '다리 쌍', type: 'int', min: 1, max: 5, default: 3, shared: true, reset: true },
    { key: 'trails', label: '발 궤적 표시', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Procedural Walk',
    summary: 'A classic way to move legs without animation clips. Each foot stays planted on the ground. When the body moves and a foot gets farther than a threshold from its ideal spot, it takes a step along an arc. A 2-bone IK finds the knee position.',
    views: { a: 'Feet attached to body (sliding)', b: 'Planted feet + steps' },
    controls: 'Keep the mouse inside the view and the creature follows it. When the mouse is outside, it wanders on its own.',
    info: `
    <p>Each leg has a <b>rest position</b> relative to the body. If you just attach the foot to the rest position, it slides along with the body. So it looks <b>like skating</b> (foot sliding).</p>
    <p>How a procedural walk works:</p>
    <ul>
      <li><b>Plant</b> the foot in world coordinates.</li>
      <li>When the distance between the foot and its rest position passes a <b>threshold</b>, start a step.</li>
      <li>Move the foot to the new spot along an arc over a set step time.</li>
    </ul>
    <p><b>Prediction</b>: place the new spot ahead of the rest position in the direction of travel (speed × step time). This keeps steps from falling behind the body.</p>
    <p><b>Gait control</b>: lift a foot only when its neighbor legs are on the ground. Alternating gaits (such as the tripod gait) appear on their own.</p>
    <p>For the hip, knee, and foot, an analytic <b>2-bone IK</b> (law of cosines) finds the knee position. Rain World, many spider and mech bosses, and Overgrowth use this method.</p>`,
    look: [
      'Look at A\'s foot trails (faint lines). The feet keep dragging along with the body. In B, footprints appear as dots and the feet move only between steps.',
      'Compare the "Foot slide" values. A shows the same value as the move speed. B shows 0 px/s.',
      'In B, turn off "Gait control". Several legs lift at once and flail. Turn it on and you get an alternating gait.',
      'Turn off "Prediction" and raise the speed. The feet keep falling behind. The legs stretch out and drag.',
    ],
    refs: [
      'GDC 2014. Procedural walking and IK in Overgrowth.',
      'GDC 2016. Creature animation built from physics and procedural leg placement.',
      'Procedural legs for the lizard and spider creatures.',
      'An overview of IK. 2-bone IK has a closed-form solution from the law of cosines.',
    ],
    params: {
      mode: { label: 'Foot handling', group: 'Walk', options: { slide: 'Attached to rest position (sliding)', step: 'Planted feet + threshold steps' } },
      threshold: 'Step threshold distance (px)',
      stepTime: 'Step time (s)',
      gait: 'Gait control (wait for neighbor legs)',
      predict: 'Prediction (speed × step time)',
      speed: { label: 'Move speed (px/s)', group: 'Scene' },
      pairs: 'Leg pairs',
      trails: 'Show foot trails',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params, V = U.v2;
    const np = P.pairs, BODY = 16 + np * 10;
    const body = { x: ctx.width / 2, y: ctx.height / 2, h: 0, vx: 0, vy: 0 };
    const ph1 = ctx.rng.range(0, 6), ph2 = ctx.rng.range(0, 6);
    let wt = 0, slip = 0, slipAvg = 0, stepCount = 0, stepRate = 0, rateTimer = 0;
    const legs = [];
    for (let i = 0; i < np; i++) {
      for (const side of [-1, 1]) {
        const along = np === 1 ? 0 : U.lerp(BODY * 0.55, -BODY * 0.55, i / (np - 1));
        legs.push({
          pair: i, side,
          hip: { x: along, y: side * 8 },
          rest: { x: along * 1.25 + 8, y: side * (34 + 6 * Math.cos((i / Math.max(1, np - 1)) * Math.PI)) },
          foot: null, from: null, to: null, t: 1, trail: [],
        });
      }
    }
    const toWorld = (p) => { const c = Math.cos(body.h), s = Math.sin(body.h); return { x: body.x + p.x * c - p.y * s, y: body.y + p.x * s + p.y * c }; };
    legs.forEach((l) => { l.foot = toWorld(l.rest); });
    const L1 = 30, L2 = 30;
    const neighbors = (l) => legs.filter((o) => o !== l && ((o.pair === l.pair) || (o.side === l.side && Math.abs(o.pair - l.pair) === 1)));

    function knee(hip, foot, side) {
      const d = U.clamp(V.dist(hip, foot), 1, L1 + L2 - 0.01);
      const a = Math.acos(U.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
      const base = V.angle(V.sub(foot, hip));
      return V.add(hip, V.fromAngle(base + side * a, L1));
    }

    return {
      update(dt) {
        // 목표 지점
        wt += dt;
        const m = ctx.input.mouse, W = ctx.width, H = ctx.height;
        const goal = m.inside ? { x: m.x, y: m.y }
          : { x: W / 2 + Math.sin(wt * 0.31 + ph1) * W * 0.36, y: H / 2 + Math.sin(wt * 0.47 + ph2) * H * 0.32 };
        const to = V.sub(goal, body), dist = V.len(to);
        const sp = dist > 6 ? Math.min(P.speed, dist * 3) : 0;
        const dir = V.norm(to);
        body.vx = U.damp(body.vx, dir.x * sp, 8, dt); body.vy = U.damp(body.vy, dir.y * sp, 8, dt);
        body.x += body.vx * dt; body.y += body.vy * dt;
        if (Math.hypot(body.vx, body.vy) > 5) body.h = U.lerpAngle(body.h, Math.atan2(body.vy, body.vx), 1 - Math.exp(-6 * dt));

        slip = 0;
        for (const l of legs) {
          const rest = toWorld(l.rest);
          if (P.mode === 'slide') {
            slip += V.dist(l.foot, rest);
            l.foot = rest; l.t = 1;
          } else if (l.t < 1) {
            l.t = Math.min(1, l.t + dt / P.stepTime);
            l.foot = V.lerp(l.from, l.to, U.ease.inOutSine(l.t));
          } else {
            const d = V.dist(l.foot, rest);
            const free = !P.gait || neighbors(l).every((o) => o.t >= 1);
            if ((d > P.threshold && free) || d > P.threshold * 2.2) {
              const lead = P.predict ? { x: body.vx * P.stepTime * 0.9, y: body.vy * P.stepTime * 0.9 } : { x: 0, y: 0 };
              l.from = l.foot; l.to = V.add(rest, lead); l.t = 0; stepCount++;
            }
          }
          if (P.trails) { l.trail.push({ x: l.foot.x, y: l.foot.y, up: l.t < 1 }); if (l.trail.length > 90) l.trail.shift(); }
        }
        slipAvg = U.damp(slipAvg, slip / Math.max(dt, 1e-4) / legs.length, 4, dt);
        rateTimer += dt;
        if (rateTimer >= 1) { stepRate = stepCount / rateTimer; stepCount = 0; rateTimer = 0; }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        D.grid(g, W, H, 32);
        if (P.trails) {
          for (const l of legs) {
            if (l.trail.length > 1) D.poly(g, l.trail, null, 'rgba(255,255,255,0.12)', 1, false);
            for (const p of l.trail) if (!p.up) D.circle(g, p.x, p.y, 1.2, 'rgba(255,255,255,0.25)');
          }
        }
        // 다리
        for (const l of legs) {
          const hip = toWorld(l.hip), lift = l.t < 1 ? Math.sin(l.t * Math.PI) : 0;
          if (P.mode === 'step') {
            const rest = toWorld(l.rest);
            D.circle(g, rest.x, rest.y, P.threshold, null, 'rgba(255,255,255,0.05)', 1);
          }
          const k = knee(hip, l.foot, -l.side);
          D.circle(g, l.foot.x + 3, l.foot.y + 3, 4 + lift * 2, 'rgba(0,0,0,0.35)');
          D.line(g, hip.x, hip.y, k.x, k.y, col, 4);
          D.line(g, k.x, k.y, l.foot.x - lift * 3, l.foot.y - lift * 6, col, 3);
          D.circle(g, k.x, k.y, 3, '#fff');
          D.circle(g, l.foot.x - lift * 3, l.foot.y - lift * 6, 4 + lift * 3, lift > 0 ? C.warn : '#fff');
        }
        // 몸통
        g.save(); g.translate(body.x, body.y); g.rotate(body.h);
        g.beginPath(); g.ellipse(0, 0, BODY, 13, 0, 0, U.TAU);
        g.fillStyle = '#2a2f38'; g.fill(); g.strokeStyle = col; g.lineWidth = 2; g.stroke();
        D.circle(g, BODY + 6, 0, 9, col);
        D.circle(g, BODY + 10, -4, 2, '#000'); D.circle(g, BODY + 10, 4, 2, '#000');
        g.restore();
        ctx.stat(GTL.L('발 미끄러짐 (다리당)', 'Foot slide (per leg)'), slipAvg.toFixed(1) + ' px/s');
        ctx.stat(GTL.L('걸음 수', 'Steps'), stepRate.toFixed(1) + ' /s');
        ctx.stat(GTL.L('들린 다리', 'Legs lifted'), legs.filter((l) => l.t < 1).length + ' / ' + legs.length);
      },
    };
  },
});
