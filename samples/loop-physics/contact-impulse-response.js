// 충돌 응답: 위치 보정만 vs 각자 반사 vs 질량을 고려한 임펄스
GTL.register({
  id: 'contact-impulse-response',
  title: '충돌 응답: 위치 보정 vs 임펄스',
  summary: '겹친 물체를 밀어내기만 하면 속도가 그대로라 서로 밀고 들어가거나 끼임. 상대 속도와 질량으로 충격량(임펄스)을 계산해 속도를 바꾸면 운동량이 보존되고 뉴턴의 요람처럼 튕겨 나감.',
  views: { a: '위치 보정만', b: '임펄스' },
  controls: '조작 없음. 장면이 몇 초마다 다시 시작됨.',
  info: `
    <p><b>충돌 응답</b>은 겹침을 찾은 뒤 위치와 속도를 고치는 단계. 감지보다 이 단계에서 버그가 더 자주 생김.</p>
    <ul>
      <li><b>위치 보정만</b>: 겹친 만큼 질량 비율로 밀어냄. 속도는 그대로라 다음 스텝에 다시 파고듦. 중력이 있으면 바닥 공의 속도가 끝없이 커짐.</li>
      <li><b>각자 반사</b>: 각 물체가 자기 속도의 법선 성분만 뒤집음. 질량을 무시해서 가벼운 공이 무거운 공을 쳐도 무거운 공이 꿈쩍하지 않음. 운동량이 보존되지 않음.</li>
      <li><b>임펄스</b>: 접촉 법선 <code>n</code>, 상대 속도 <code>v_rel</code>, 반발 계수 <code>e</code>, 역질량 <code>w</code>로 충격량을 구함.
        <code>j = -(1 + e) * dot(v_rel, n) / (w1 + w2)</code>. 두 물체에 <code>±j n</code>을 역질량만큼 나눠 줌. 서로 멀어지는 중이면(<code>dot(v_rel, n) &gt; 0</code>) 건너뜀.</li>
    </ul>
    <p>임펄스 방식도 위치 보정은 함께 씀. 속도만 바꾸면 이미 생긴 겹침이 남기 때문.</p>
    <p>단점: 여러 물체가 동시에 닿으면 순서대로 풀어서 오차가 생김. 정확히 맞추려면 반복 솔버 필요(이 카테고리의 "상자 쌓기" 샘플 참고).</p>`,
  // 도식: 위치 보정만 하면 속도가 그대로 남음. 임펄스는 법선 방향 상대 속도를 질량 비율로 나눠 바꿈
  diagram: (L) => `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="arr-ca" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="arr-cb" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="arr-cd" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    </defs>
    <text x="10" y="16" class="t-a">${L('A: 위치 보정만', 'A: position fix only')}</text>
    <circle cx="90" cy="80" r="28" class="f-dim"/><circle cx="136" cy="80" r="22" class="f-dim"/>
    <path d="M100,40 L72,40" class="d-line" marker-end="url(#arr-cd)"/><path d="M126,40 L154,40" class="d-line" marker-end="url(#arr-cd)"/>
    <text x="113" y="30" text-anchor="middle" class="t-small">${L('겹친 만큼 밀어냄', 'push apart by overlap')}</text>
    <path d="M70,128 L110,128" class="d-a" marker-end="url(#arr-ca)"/><path d="M160,128 L130,128" class="d-a" marker-end="url(#arr-ca)"/>
    <text x="113" y="148" text-anchor="middle" class="t-small t-dim">${L('속도는 그대로', 'velocity unchanged')}</text>
    <text x="10" y="176" class="t-small">${L('다음 스텝에 다시 파고듦', 'They dig in again next step')}</text>
    <text x="290" y="16" class="t-b">${L('B: 임펄스', 'B: impulse')}</text>
    <circle cx="350" cy="80" r="28" class="f-dim"/><circle cx="400" cy="80" r="22" class="f-dim"/>
    <path d="M378,40 L412,40" class="d-line" marker-end="url(#arr-cd)"/>
    <text x="418" y="44" class="t-small t-mono">n</text>
    <path d="M340,128 L304,128" class="d-b" marker-end="url(#arr-cb)"/><path d="M410,128 L460,128" class="d-b" marker-end="url(#arr-cb)"/>
    <text x="380" y="148" text-anchor="middle" class="t-small t-dim">${L('충돌 뒤 속도', 'velocity after hit')}</text>
    <text x="290" y="164" class="t-small t-mono">v_rel = v2 - v1</text>
    <text x="290" y="178" class="t-small t-mono">j = -(1+e) dot(v_rel, n) / (w1+w2)</text>
    <text x="290" y="192" class="t-small t-mono">v1 -= w1 j n,  v2 += w2 j n</text>
  </svg>`,
  look: [
    '뉴턴의 요람 장면에서 B는 첫 공이 멈추고 마지막 공이 같은 속도로 튀어 나감. A는 첫 공이 줄 전체를 밀고 가다 벽에 끼임.',
    '"질량 차이" 장면에서 A를 "각자 반사"로 바꾸면 가벼운 공이 무거운 공에 맞고 튀어도 무거운 공이 그대로 있음. 운동량 보존 수치가 100%에서 크게 벗어남.',
    '"상자 속 공" 장면에서 A는 바닥 공이 바닥에 파묻혀 떨리고 "최대 속도"가 시간에 따라 계속 커짐. B는 공이 쌓여 멈춤.',
    'B의 반발 계수를 0으로 내리면 요람의 공들이 한 덩어리로 같이 움직임. 운동량은 보존되고 운동 에너지만 줄어듦.',
  ],
  refs: [
    { type: 'article', title: 'Physics, Part 3: Collision Response (Chris Hecker)', year: 1997, note: 'Game Developer Magazine. 충격량 식 유도.' },
    { type: 'article', title: 'How to Create a Custom 2D Physics Engine: The Basics and Impulse Resolution (Randy Gaul)', year: 2013, note: 'Envato Tuts+. 임펄스 해결과 위치 보정.' },
    { type: 'book', title: 'Game Physics Engine Development (Ian Millington)', year: 2007, note: '접촉 해결, 반발 계수, 겹침 해소' },
  ],
  params: [
    { key: 'method', label: '충돌 응답', type: 'select', group: '응답', options: [
      { value: 'position', label: '위치 보정만' },
      { value: 'reflect', label: '위치 보정 + 각자 반사' },
      { value: 'impulse', label: '위치 보정 + 임펄스' },
    ], a: 'position', b: 'impulse', default: 'position' },
    { key: 'e', label: '반발 계수 e', type: 'range', min: 0, max: 1, step: 0.05, default: 1 },
    { key: 'scene', label: '장면', type: 'select', shared: true, reset: true, group: '장면', options: [
      { value: 'cradle', label: '뉴턴의 요람' },
      { value: 'mass', label: '질량 차이' },
      { value: 'box', label: '상자 속 공 (중력)' },
    ], default: 'cradle' },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Collision Response: Position Fix vs Impulse',
    summary: 'If you only push overlapping bodies apart, their velocity stays the same, so they keep pushing in or get stuck. Compute an impulse from relative velocity and mass and change the velocity. Momentum is kept and the balls bounce like a Newton\'s cradle.',
    views: { a: 'Position fix only', b: 'Impulse' },
    controls: 'No input. The scene restarts every few seconds.',
    info: `
    <p><b>Collision response</b> is the step that fixes position and velocity after an overlap is found. Bugs show up here more often than in detection.</p>
    <ul>
      <li><b>Position fix only</b>: push bodies apart by the overlap, split by mass ratio. Velocity stays the same, so they dig in again next step. With gravity, the speed of the bottom balls grows without limit.</li>
      <li><b>Separate reflection</b>: each body flips only the normal part of its own velocity. It ignores mass, so a light ball hitting a heavy ball does not move the heavy one. Momentum is not kept.</li>
      <li><b>Impulse</b>: compute the impulse from the contact normal <code>n</code>, relative velocity <code>v_rel</code>, restitution <code>e</code>, and inverse mass <code>w</code>.
        <code>j = -(1 + e) * dot(v_rel, n) / (w1 + w2)</code>. Apply <code>±j n</code> to the two bodies, scaled by inverse mass. Skip it if they are already moving apart (<code>dot(v_rel, n) &gt; 0</code>).</li>
    </ul>
    <p>The impulse method still uses position correction too. Changing only velocity leaves the overlap that already exists.</p>
    <p>Downside: when many bodies touch at once, solving them in order adds error. To get it exact you need an iterative solver (see the "Box stacking" sample in this category).</p>`,
    look: [
      'In the Newton\'s cradle scene, B\'s first ball stops and the last ball flies off at the same speed. In A, the first ball pushes the whole row and gets stuck at the wall.',
      'In the "Mass difference" scene, switch A to "Separate reflection". A light ball bounces off a heavy ball, but the heavy ball stays put. The momentum number drifts far from 100%.',
      'In the "Balls in a box" scene, A\'s bottom balls sink into the floor and shake, and "Max speed" keeps growing over time. In B, the balls pile up and come to rest.',
      'Lower B\'s restitution to 0. The cradle balls move together as one lump. Momentum is kept, and only kinetic energy drops.',
    ],
    refs: [
      'Game Developer Magazine. Derives the impulse formula.',
      'Envato Tuts+. Impulse resolution and position correction.',
      'Contact resolution, restitution, and overlap removal.',
    ],
    params: {
      method: { label: 'Collision response', group: 'Response', options: { position: 'Position fix only', reflect: 'Position fix + separate reflection', impulse: 'Position fix + impulse' } },
      e: 'Restitution e',
      scene: { label: 'Scene', group: 'Scene', options: { cradle: 'Newton\'s cradle', mass: 'Mass difference', box: 'Balls in a box (gravity)' } },
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const LW = 600, LH = 400, H = 1 / 120, PASSES = 4;
    const scene = P.scene;
    const GRAV = scene === 'box' ? 700 : 0;
    const PERIOD = scene === 'cradle' ? 6 : scene === 'mass' ? 5 : Infinity;
    let balls, acc, t, P0, E0, Pwall, maxOverlap, overlapNow;
    const ball = (x, y, vx, vy, r, m) => ({ x, y, vx, vy, r, w: 1 / m, m });
    const init = () => {
      ctx.rng = GTL.util.rng(ctx.seed);
      balls = [];
      if (scene === 'cradle') {
        const r = 18;
        balls.push(ball(70, 200, 320, 0, r, 1));
        for (let i = 0; i < 5; i++) balls.push(ball(300 + i * (2 * r + 0.5), 200, 0, 0, r, 1));
      } else if (scene === 'mass') {
        balls.push(ball(90, 120, 220, 0, 30, 8), ball(330, 120, 0, 0, 12, 1));
        balls.push(ball(90, 290, 320, 0, 12, 1), ball(330, 290, 0, 0, 30, 8));
      } else {
        for (let i = 0; i < 24; i++) {
          const r = ctx.rng.range(10, 22);
          balls.push(ball(ctx.rng.range(40, 560), ctx.rng.range(30, 250), ctx.rng.range(-150, 150), ctx.rng.range(-50, 50), r, (r * r) / 200));
        }
      }
      acc = 0; t = 0; maxOverlap = 0; overlapNow = 0; Pwall = { x: 0, y: 0 };
      P0 = momentum(); E0 = energy();
    };
    const momentum = () => balls.reduce((p, b) => ({ x: p.x + b.m * b.vx, y: p.y + b.m * b.vy }), { x: 0, y: 0 });
    const energy = () => balls.reduce((s, b) => s + 0.5 * b.m * (b.vx * b.vx + b.vy * b.vy) + b.m * GRAV * (LH - b.y), 0);
    init();

    function respond(a, b, nx, ny, pen) {
      // 위치 보정: 역질량 비율로 겹침을 나눔 (모든 방식 공통)
      const wsum = a.w + b.w;
      if (wsum <= 0) return;
      a.x -= nx * pen * (a.w / wsum); a.y -= ny * pen * (a.w / wsum);
      b.x += nx * pen * (b.w / wsum); b.y += ny * pen * (b.w / wsum);
      const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (P.method === 'impulse') {
        if (vn >= 0) return;
        const j = (-(1 + P.e) * vn) / wsum;
        a.vx -= j * a.w * nx; a.vy -= j * a.w * ny;
        b.vx += j * b.w * nx; b.vy += j * b.w * ny;
      } else if (P.method === 'reflect') {
        if (vn >= 0) return;
        // 각자 자기 속도의 법선 성분만 뒤집음 (질량, 상대 속도 무시)
        const an = a.vx * nx + a.vy * ny, bn = b.vx * nx + b.vy * ny;
        if (an > 0) { a.vx -= (1 + P.e) * an * nx; a.vy -= (1 + P.e) * an * ny; }
        if (bn < 0) { b.vx -= (1 + P.e) * bn * nx; b.vy -= (1 + P.e) * bn * ny; }
      }
    }
    // 벽은 무한 질량 물체로 취급. 벽이 준 운동량은 따로 모아 보존 측정에서 뺌
    function wall(b, nx, ny, pen) {
      b.x += nx * pen; b.y += ny * pen;
      if (P.method === 'position') return;
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) {
        const dvx = -(1 + P.e) * vn * nx, dvy = -(1 + P.e) * vn * ny;
        b.vx += dvx; b.vy += dvy;
        Pwall.x += b.m * dvx; Pwall.y += b.m * dvy;
      }
    }

    function step(h) {
      for (const b of balls) { b.vy += GRAV * h; b.x += b.vx * h; b.y += b.vy * h; }
      overlapNow = 0;
      for (let pass = 0; pass < PASSES; pass++) {
        for (let i = 0; i < balls.length; i++) {
          for (let k = i + 1; k < balls.length; k++) {
            const a = balls[i], b = balls[k];
            const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, d2 = dx * dx + dy * dy;
            if (d2 >= rr * rr || d2 < 1e-12) continue;
            const d = Math.sqrt(d2), pen = rr - d;
            if (pass === 0) overlapNow = Math.max(overlapNow, pen);
            respond(a, b, dx / d, dy / d, pen);
          }
        }
        for (const b of balls) {
          if (b.x < b.r) wall(b, 1, 0, b.r - b.x);
          if (b.x > LW - b.r) wall(b, -1, 0, b.x - (LW - b.r));
          if (b.y < b.r) wall(b, 0, 1, b.r - b.y);
          if (b.y > LH - b.r) { if (pass === 0) overlapNow = Math.max(overlapNow, b.y - (LH - b.r)); wall(b, 0, -1, b.y - (LH - b.r)); }
        }
      }
      maxOverlap = Math.max(maxOverlap * 0.995, overlapNow);
    }

    return {
      update(dt) {
        acc += dt;
        let guard = 0;
        while (acc >= H && guard++ < 30) { step(H); acc -= H; t += H; }
        if (guard >= 30) acc = 0;
        if (t > PERIOD) init();
      },
      render() {
        const g = ctx.g, W = ctx.width, Hh = ctx.height;
        const s = Math.min(W / LW, Hh / LH), ox = (W - LW * s) / 2, oy = (Hh - LH * s) / 2;
        const col = ctx.side === 'a' ? C.a : C.b;
        g.save(); g.translate(ox, oy); g.scale(s, s);
        D.grid(g, LW, LH, 40);
        D.rect(g, 0, 0, LW, LH, null, '#3a4150', 2);
        let vmax = 0;
        for (const b of balls) {
          const sp = Math.hypot(b.vx, b.vy);
          vmax = Math.max(vmax, sp);
          const heavy = b.m > 3;
          D.circle(g, b.x, b.y, b.r, heavy ? U.rgb(...U.hexToRgb(col), 0.55) : col, '#fff', 1);
          if (sp > 5) D.arrow(g, b.x, b.y, b.x + b.vx * 0.15, b.y + b.vy * 0.15, '#fff', 1.5, 5);
          if (scene === 'mass') D.text(g, `m${b.m}`, b.x, b.y - 6, { size: 11, align: 'center', color: '#14161a' });
        }
        g.restore();
        const p = momentum(), e = energy();
        const p0 = Math.hypot(P0.x, P0.y);
        if (scene !== 'box') ctx.stat(GTL.L('운동량 보존 (벽 제외, 초기 대비)', 'Momentum kept (excl. walls, vs start)'), p0 > 1e-6 ? (((p.x - Pwall.x) / P0.x) * 100).toFixed(0) + ' %' : '-');
        ctx.stat(GRAV ? GTL.L('역학 에너지 (초기 대비)', 'Mechanical energy (vs start)') : GTL.L('운동 에너지 (초기 대비)', 'Kinetic energy (vs start)'), E0 > 0 ? ((e / E0) * 100).toFixed(0) + ' %' : '-');
        ctx.stat(GTL.L('최대 겹침 (최근)', 'Max overlap (recent)'), maxOverlap.toFixed(1) + ' px');
        ctx.stat(GTL.L('최대 속도', 'Max speed'), vmax.toFixed(0) + ' px/s');
        if (scene === 'cradle') ctx.stat(GTL.L('첫 공 / 마지막 공 속도', 'First / last ball speed'), balls[0].vx.toFixed(0) + ' / ' + balls[balls.length - 1].vx.toFixed(0) + ' px/s');
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
