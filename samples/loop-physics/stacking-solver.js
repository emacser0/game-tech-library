// 상자 스태킹 & 솔버: Sequential Impulses 반복 횟수, Warm Starting, Baumgarte 위치 보정
GTL.register({
  id: 'stacking-solver',
  title: '상자 쌓기 & 솔버 반복 / Warm Starting',
  summary: 'Sequential Impulses 솔버는 접촉 충격량을 반복해서 조금씩 맞춤. 반복이 부족하면 높은 스택이 서로 파고들어 가라앉음. 이전 프레임의 충격량으로 시작하는 Warm Starting이 이 문제를 적은 비용으로 해결함.',
  views: { a: 'Warm Start 끔', b: 'Warm Start 켬' },
  controls: '마우스 클릭: 클릭한 위치 위에서 상자 떨어뜨리기',
  info: `
    <p><b>Sequential Impulses</b>는 Box2D 계열 솔버의 방식. 접촉마다 "관통 속도를 없애는 충격량 λ"를 구하고, 모든 접촉에 대해 <b>여러 번 반복</b>함(Gauss-Seidel).
    핵심은 누적 충격량을 <code>λ ≥ 0</code>으로 제한(클램프)하는 것(Catto, GDC 2006).</p>
    <p>문제: 높이 N인 기둥의 바닥 접촉은 위 상자 N개의 무게를 받쳐야 함. 한 번 반복할 때 정보는 대략 한 상자씩만 전달됨.
    그래서 <b>반복 수 &lt; 스택 높이</b>이면 충격량이 모자라 상자가 서로 파고듦.</p>
    <p><b>Warm Starting</b>은 같은 접촉의 지난 프레임 누적 충격량을 저장했다가 이번 프레임의 시작값으로 씀. 정지한 스택은 해가 프레임마다 거의 같음.
    그래서 몇 프레임 만에 정확한 해에 수렴하고, 이후엔 반복 몇 번으로 충분함.</p>
    <p>관통을 밀어내는 위치 보정 방식:</p>
    <ul>
      <li><b>Baumgarte 안정화</b>: <code>bias = β/dt * max(관통 - slop, 0)</code>를 속도에 섞음. 단점은 보정 속도가 실제 운동 에너지가 되어 튀는 것. warm start가 이 에너지를 다음 프레임에 다시 넣음.</li>
      <li><b>Split impulse</b>(기본값): 위치 갱신에만 쓰는 별도 의사 속도로 보정을 풂. 위 문제를 피함.</li>
    </ul>
    <p>살짝 떨어진 접촉도 추측성(speculative) 접촉으로 유지함. warm start 정보가 끊기지 않게 하기 위함.</p>
    <p>빨간 영역은 겹침(관통), 노란 막대는 접촉 법선 충격량 크기.</p>`,
  // 도식: 높이 12 스택의 바닥 접촉 충격량이 반복마다 쌓이는 모습. warm start는 지난 프레임 값에서 출발
  diagram: (L) => {
    const X = (i) => 300 + i * 18, Y = (v) => 160 - v * 100;
    let cold = `M${X(0)},${Y(0)}`;
    for (let i = 1; i <= 6; i++) cold += ` L${X(i - 1)},${Y(i / 12).toFixed(1)} L${X(i)},${Y(i / 12).toFixed(1)}`;
    return `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr-ss" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <line x1="30" y1="150" x2="150" y2="150" class="d-line"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="70" y="${130 - i * 20}" width="40" height="19" class="f-dim"/>`).join('')}
    <path d="M122,40 L122,140" class="d-line" marker-end="url(#arr-ss)"/>
    <text x="128" y="90" class="t-small">${L('무게가', 'load')}</text><text x="128" y="103" class="t-small">${L('아래로 쌓임', 'adds up')}</text>
    <text x="10" y="168" class="t-small">${L('바닥 접촉이 위 상자 N개를 받침', 'Bottom contact holds N boxes')}</text>
    <text x="10" y="181" class="t-small t-dim">${L('반복 1회에 약 한 상자씩 전달', 'One iteration passes about one box')}</text>
    <line x1="300" y1="160" x2="520" y2="160" class="d-dim"/><line x1="300" y1="160" x2="300" y2="30" class="d-dim"/>
    <text x="304" y="22" class="t-small">${L('바닥 접촉 충격량 (프레임 하나 안)', 'Bottom contact impulse (in one frame)')}</text>
    <text x="520" y="176" text-anchor="end" class="t-small">${L('반복', 'iteration')}</text>
    <line x1="300" y1="${Y(1)}" x2="520" y2="${Y(1)}" class="d-good" stroke-dasharray="4 3"/>
    <text x="296" y="${Y(1) + 3}" text-anchor="end" class="t-small">${L('필요', 'need')}</text>
    <path d="${cold}" class="d-a"/>
    <line x1="${X(0)}" y1="${Y(0.98)}" x2="520" y2="${Y(0.98)}" class="d-b"/>
    <text x="${X(0) + 4}" y="${Y(1) - 8}" class="t-small t-b">${L('B: 지난 프레임 값에서 시작', 'B: starts at last frame value')}</text>
    <line x1="${X(6)}" y1="30" x2="${X(6)}" y2="160" class="d-dim" stroke-dasharray="2 3"/>
    <text x="${X(6)}" y="176" text-anchor="middle" class="t-small t-mono">6</text>
    <line x1="${X(6)}" y1="${Y(0.5)}" x2="${X(6)}" y2="${Y(1)}" class="d-bad"/>
    <text x="${X(6) + 6}" y="${Y(0.78)}" class="t-small">${L('모자람: 상자가 가라앉음', 'short: boxes sink')}</text>
    <text x="${X(6) + 6}" y="${Y(0.45)}" class="t-small t-a">${L('A: 0에서 시작', 'A: starts at 0')}</text>
    <text x="${X(6) + 6}" y="${Y(0.45) + 13}" class="t-small t-dim">${L('반복 6회에서 멈춤', 'stops at 6 iterations')}</text>
  </svg>`;
  },
  look: [
    'A(Warm Start 끔)를 보면 기둥 아래쪽 상자일수록 겹쳐(빨강) 전체 높이가 줄어듦. B는 같은 반복 수에서 거의 겹치지 않음.',
    'A의 반복 횟수를 스택 높이 이상(예: 20~40)으로 올리면 A도 훨씬 덜 가라앉음. 대신 솔버 시간이 그만큼 늘어남. B는 6회로 충분.',
    '장면을 "무거운 상자 위"로 바꾸면 질량비 때문에 수렴이 훨씬 어려움. Warm Start가 있어도 반복을 올려야 함.',
    '위치 보정을 Baumgarte로 바꾸고 "무거운 상자 위" 장면을 보면 B의 스택이 통째로 튀어 오름. 보정 충격량이 warm start로 다음 프레임에 다시 들어가기 때문. Split impulse는 이 에너지 유입을 막음.',
    'β를 0으로 하면 관통이 회복되지 않고 계속 쌓임.',
  ],
  refs: [
    { type: 'talk', title: 'Fast and Simple Physics using Sequential Impulses (Erin Catto)', url: 'https://box2d.org/publications/', year: 2006, note: 'GDC 2006. 누적 충격량 클램프, warm starting, Baumgarte.' },
    { type: 'code', title: 'Box2D Lite', url: 'https://github.com/erincatto/box2d-lite', note: '이 샘플 솔버 구조의 원형 (Arbiter, warm starting).' },
    { type: 'paper', title: 'Stabilization of Constraints and Integrals of Motion in Dynamical Systems (J. Baumgarte)', year: 1972, note: '위치 오차를 속도 제약에 섞는 안정화 기법.' },
    { type: 'engine', title: 'Unity - Physics settings: Default Solver Iterations', note: 'PhysX 솔버 반복 횟수 (Rigidbody.solverIterations로 개별 설정).' },
  ],
  params: [
    { key: 'warm', label: 'Warm Starting', type: 'bool', a: false, b: true, default: false, group: '솔버' },
    { key: 'iterations', label: '속도 반복 횟수', type: 'int', min: 1, max: 40, default: 6 },
    { key: 'posFix', label: '위치 보정 방식', type: 'select', options: [
      { value: 'baumgarte', label: 'Baumgarte (속도에 섞음)' },
      { value: 'split', label: 'Split impulse (별도 의사 속도)' },
    ], default: 'split' },
    { key: 'beta', label: '위치 보정 계수 β', type: 'range', min: 0, max: 1, step: 0.02, default: 0.2 },
    { key: 'slop', label: '허용 관통 slop (px)', type: 'range', min: 0, max: 4, step: 0.1, default: 0.5 },
    { key: 'friction', label: '마찰 μ', type: 'range', min: 0, max: 1, step: 0.05, default: 0.6 },
    { key: 'scene', label: '장면', type: 'select', group: '장면', options: [
      { value: 'column', label: '기둥 (높이 = 상자 수)' },
      { value: 'pyramid', label: '피라미드' },
      { value: 'heavy', label: '무거운 상자 위 (질량 ×30)' },
    ], default: 'column', shared: true, reset: true },
    { key: 'height', label: '상자 수 / 단 수', type: 'int', min: 2, max: 16, default: 12, shared: true, reset: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Box Stacking & Solver Iterations / Warm Starting',
    summary: 'A Sequential Impulses solver adjusts contact impulses a little at a time over many iterations. With too few iterations, a tall stack sinks into itself. Warm starting begins from the last frame\'s impulses and fixes this at low cost.',
    views: { a: 'Warm start off', b: 'Warm start on' },
    controls: 'Mouse click: drop a box above the clicked spot',
    info: `
    <p><b>Sequential Impulses</b> is the method behind Box2D style solvers. For each contact, it finds "the impulse λ that removes the approaching speed", and it <b>repeats this many times</b> over all contacts (Gauss-Seidel).
    The key idea is to clamp the accumulated impulse to <code>λ ≥ 0</code> (Catto, GDC 2006).</p>
    <p>Problem: the bottom contact of a column N boxes tall must hold the weight of all N boxes above it. Each iteration passes information up or down by about one box.
    So when <b>iterations &lt; stack height</b>, the impulse falls short and the boxes sink into each other.</p>
    <p><b>Warm starting</b> saves the accumulated impulse of each contact from the last frame and uses it as this frame's starting value. A resting stack has almost the same solution every frame.
    So it converges to the right answer in a few frames, and after that a few iterations are enough.</p>
    <p>Ways to push out penetration:</p>
    <ul>
      <li><b>Baumgarte stabilization</b>: mixes <code>bias = β/dt * max(penetration - slop, 0)</code> into the velocity. Downside: the correction speed becomes real kinetic energy, so bodies pop. Warm starting feeds this energy back in the next frame.</li>
      <li><b>Split impulse</b> (default): solves the correction with a separate pseudo velocity that only moves positions. This avoids the problem above.</li>
    </ul>
    <p>Contacts that are slightly apart are kept as speculative contacts. This keeps the warm start data from breaking.</p>
    <p>Red areas show overlap (penetration). Yellow bars show the size of the contact normal impulse.</p>`,
    look: [
      'Look at A (warm start off). The lower a box is in the column, the more it overlaps (red), and the whole stack gets shorter. B barely overlaps with the same iteration count.',
      'Raise A\'s iterations to the stack height or more (for example 20~40). A sinks much less. But solver time grows by the same amount. B needs only 6.',
      'Switch the scene to "Heavy box on top". The mass ratio makes convergence much harder. You need more iterations even with warm starting.',
      'Switch position correction to Baumgarte and watch the "Heavy box on top" scene. B\'s whole stack jumps up. The correction impulse comes back next frame through warm starting. Split impulse stops this energy from entering.',
      'Set β to 0. Penetration never recovers and keeps building up.',
    ],
    refs: [
      'GDC 2006. Accumulated impulse clamping, warm starting, and Baumgarte.',
      'The model for this sample\'s solver structure (Arbiter, warm starting).',
      'A stabilization method that mixes position error into the velocity constraint.',
      'PhysX solver iteration count (set per body with Rigidbody.solverIterations).',
    ],
    params: {
      warm: { label: 'Warm starting', group: 'Solver' },
      iterations: 'Velocity iterations',
      posFix: { label: 'Position correction', options: { baumgarte: 'Baumgarte (mixed into velocity)', split: 'Split impulse (separate pseudo velocity)' } },
      beta: 'Position correction factor β',
      slop: 'Allowed penetration slop (px)',
      friction: 'Friction μ',
      scene: { label: 'Scene', group: 'Scene', options: { column: 'Column (height = box count)', pyramid: 'Pyramid', heavy: 'Heavy box on top (mass ×30)' } },
      height: 'Boxes / rows',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const LW = 600, LH = 460, GRAV = 900, HZ = 60, GROUND = 440;
    const S = Math.min(32, 400 / P.height), MARGIN = 3;
    let bodies, contacts, prevImp, acc, solveMs, nextId;

    const box = (x, y, w, h, mass) => ({ id: nextId++, x, y, w, h, vx: 0, vy: 0, inv: mass ? 1 / mass : 0, mass });
    const init = () => {
      ctx.rng = U.rng(ctx.seed);
      nextId = 0;
      bodies = [box(LW / 2, GROUND + 50, LW * 2, 100, 0)];  // 바닥(정적), 중심 좌표
      const n = P.height;
      if (P.scene === 'pyramid') {
        for (let r = 0; r < n; r++) for (let i = 0; i < n - r; i++) {
          const x = LW / 2 + (i - (n - r - 1) / 2) * (S + 1.5);
          bodies.push(box(x + ctx.rng.range(-0.3, 0.3), GROUND - S / 2 - r * S - 0.01, S, S, 1));
        }
      } else {
        for (let i = 0; i < n; i++) {
          const heavyTop = P.scene === 'heavy' && i === n - 1;
          const w = heavyTop ? S * 1.6 : S;
          bodies.push(box(LW / 2 + ctx.rng.range(-0.5, 0.5), GROUND - S / 2 - i * S - 0.01, w, S, heavyTop ? 30 : 1));
        }
      }
      contacts = []; prevImp = new Map(); acc = 0; solveMs = 0;
    };
    init();

    function collide() {
      const out = [];
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], b = bodies[j];
        if (!a.inv && !b.inv) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const ox = (a.w + b.w) / 2 - Math.abs(dx), oy = (a.h + b.h) / 2 - Math.abs(dy);
        // 추측성(speculative) 여유: 살짝 떨어진 접촉도 유지해 warm start 정보가 끊기지 않게 함
        if (ox <= -MARGIN || oy <= -MARGIN || (ox <= 0 && oy <= 0)) continue;
        let nx = 0, ny = 0, pen, cx, cy;
        const vertical = ox > 0 && oy > 0 ? oy < ox : oy <= 0;
        if (vertical) { ny = dy > 0 ? 1 : -1; pen = oy; cx = (Math.max(a.x - a.w / 2, b.x - b.w / 2) + Math.min(a.x + a.w / 2, b.x + b.w / 2)) / 2; cy = ny > 0 ? a.y + a.h / 2 : a.y - a.h / 2; }
        else { nx = dx > 0 ? 1 : -1; pen = ox; cy = (Math.max(a.y - a.h / 2, b.y - b.h / 2) + Math.min(a.y + a.h / 2, b.y + b.h / 2)) / 2; cx = nx > 0 ? a.x + a.w / 2 : a.x - a.w / 2; }
        const key = a.id * 4096 + b.id + (nx ? 0.5 : 0);
        out.push({ a, b, nx, ny, pen, cx, cy, key, ln: 0, lt: 0, ox, oy });
      }
      return out;
    }

    function step(h) {
      for (const b of bodies) if (b.inv) b.vy += GRAV * h;
      contacts = collide();
      const mu = P.friction;
      for (const c of contacts) {
        const k = c.a.inv + c.b.inv;
        c.mass = 1 / k;
        // 관통: Baumgarte 보정 / 떨어짐: 남은 간격만큼은 접근 허용 (speculative)
        const corr = (P.beta / h) * Math.max(0, c.pen - P.slop);
        const split = P.posFix === 'split';
        c.bias = c.pen < 0 ? c.pen / h : split ? 0 : corr;
        c.pbias = split ? corr : 0; c.lp = 0;
        if (P.warm && prevImp.has(c.key)) {
          const [ln, lt] = prevImp.get(c.key);
          c.ln = ln; c.lt = lt;
          const px = c.nx * ln - c.ny * lt, py = c.ny * ln + c.nx * lt; // 법선 + 접선(t = (-ny, nx))
          c.a.vx -= px * c.a.inv; c.a.vy -= py * c.a.inv;
          c.b.vx += px * c.b.inv; c.b.vy += py * c.b.inv;
        }
      }
      for (let it = 0; it < P.iterations; it++) {
        for (const c of contacts) {
          const a = c.a, b = c.b;
          // 법선
          let rvx = b.vx - a.vx, rvy = b.vy - a.vy;
          const vn = rvx * c.nx + rvy * c.ny;
          let dl = c.mass * (-vn + c.bias);
          const l0 = c.ln; c.ln = Math.max(0, l0 + dl); dl = c.ln - l0;
          a.vx -= c.nx * dl * a.inv; a.vy -= c.ny * dl * a.inv;
          b.vx += c.nx * dl * b.inv; b.vy += c.ny * dl * b.inv;
          // 마찰 (접선 t = (-ny, nx))
          rvx = b.vx - a.vx; rvy = b.vy - a.vy;
          const tx = -c.ny, ty = c.nx;
          const vt = rvx * tx + rvy * ty;
          let dt_ = c.mass * -vt;
          const t0 = c.lt; c.lt = U.clamp(t0 + dt_, -mu * c.ln, mu * c.ln); dt_ = c.lt - t0;
          a.vx -= tx * dt_ * a.inv; a.vy -= ty * dt_ * a.inv;
          b.vx += tx * dt_ * b.inv; b.vy += ty * dt_ * b.inv;
        }
      }
      prevImp = new Map();
      for (const c of contacts) prevImp.set(c.key, [c.ln, c.lt]);
      // Split impulse: 위치 보정은 별도 의사 속도로만 풀고, 실제 속도와 warm start에는 섞지 않음
      for (const b of bodies) { b.px = 0; b.py = 0; }
      if (P.posFix === 'split') {
        for (let it = 0; it < P.iterations; it++) {
          for (const c of contacts) {
            if (c.pbias <= 0 && c.lp <= 0) continue;
            const a = c.a, b = c.b;
            const vn = (b.px - a.px) * c.nx + (b.py - a.py) * c.ny;
            let dl = c.mass * (-vn + c.pbias);
            const l0 = c.lp; c.lp = Math.max(0, l0 + dl); dl = c.lp - l0;
            a.px -= c.nx * dl * a.inv; a.py -= c.ny * dl * a.inv;
            b.px += c.nx * dl * b.inv; b.py += c.ny * dl * b.inv;
          }
        }
      }
      for (const b of bodies) if (b.inv) { b.x += (b.vx + b.px) * h; b.y += (b.vy + b.py) * h; }
      // 화면 밖으로 떨어진 상자 제거
      bodies = bodies.filter((b) => !b.inv || (b.y < LH + 200 && b.x > -200 && b.x < LW + 200));
    }

    const toLocal = (m) => {
      const s = Math.min(ctx.width / LW, ctx.height / LH), ox = (ctx.width - LW * s) / 2, oy = (ctx.height - LH * s) / 2;
      return { x: (m.x - ox) / s, y: (m.y - oy) / s };
    };

    return {
      update(dt) {
        const H = 1 / HZ;
        acc += dt;
        let n = 0;
        const t0 = ctx.now();
        while (acc >= H && n < 3) { step(H); acc -= H; n++; }
        if (n >= 3) acc = 0;
        if (n) solveMs = solveMs * 0.9 + ((ctx.now() - t0) / n) * 0.1;
      },
      onPointer(type, m) {
        if (type !== 'down' || bodies.length > 80) return;
        const l = toLocal(m);
        let top = GROUND;
        for (const b of bodies) if (b.inv && Math.abs(b.x - l.x) < S) top = Math.min(top, b.y - b.h / 2);
        bodies.push(box(U.clamp(l.x, 20, LW - 20), Math.max(-S * 4, top - S * 3), S, S, 1));
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const s = Math.min(W / LW, H / LH);
        const col = ctx.side === 'a' ? C.a : C.b;
        g.save(); g.translate((W - LW * s) / 2, (H - LH * s) / 2); g.scale(s, s);
        D.grid(g, LW, LH, S);
        D.rect(g, 0, GROUND, LW, LH - GROUND, '#2a2f38');
        D.line(g, 0, GROUND, LW, GROUND, '#5a6270', 2);
        // 이상적인 스택 높이
        if (P.scene !== 'pyramid') {
          const ideal = GROUND - P.height * S;
          g.setLineDash([5, 5]); D.line(g, LW / 2 - 90, ideal, LW / 2 + 90, ideal, C.good, 1); g.setLineDash([]);
          D.text(g, GTL.L('이상적 높이', 'Ideal height'), LW / 2 + 94, ideal - 6, { size: 10, color: C.good });
        }
        for (const b of bodies) {
          if (!b.inv) continue;
          const heavy = b.mass > 1;
          D.rect(g, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, heavy ? 'rgba(199,146,234,0.45)' : 'rgba(255,255,255,0.08)', heavy ? C.accent : col, 1.5);
        }
        let maxPen = 0, maxImp = 1, touching = 0;
        for (const c of contacts) {
          if (c.pen > 0) touching++; if (c.pen > maxPen) maxPen = c.pen; if (c.ln > maxImp) maxImp = c.ln; }
        for (const c of contacts) {
          if (c.pen > 0.6) {
            const x0 = Math.max(c.a.x - c.a.w / 2, c.b.x - c.b.w / 2), x1 = Math.min(c.a.x + c.a.w / 2, c.b.x + c.b.w / 2);
            const y0 = Math.max(c.a.y - c.a.h / 2, c.b.y - c.b.h / 2), y1 = Math.min(c.a.y + c.a.h / 2, c.b.y + c.b.h / 2);
            D.rect(g, x0, y0, x1 - x0, y1 - y0, 'rgba(255,83,112,0.75)');
          }
          if (c.ln > 0) {
            const L = (c.ln / maxImp) * S * 0.9;
            if (c.ny) D.rect(g, c.cx - 2, c.cy - L / 2, 4, L, 'rgba(255,203,107,0.8)');
            else D.rect(g, c.cx - L / 2, c.cy - 2, L, 4, 'rgba(255,203,107,0.8)');
          }
        }
        g.restore();
        let topY = GROUND;
        for (const b of bodies) if (b.inv) topY = Math.min(topY, b.y - b.h / 2);
        ctx.stat(GTL.L('최대 관통', 'Max penetration'), maxPen.toFixed(2) + ' px');
        if (P.scene !== 'pyramid') ctx.stat(GTL.L('스택 높이 손실', 'Stack height loss'), Math.max(0, topY - (GROUND - P.height * S)).toFixed(1) + ' px');
        ctx.stat(GTL.L('접촉 수 (겹침 / 추측성 포함)', 'Contacts (overlapping / incl. speculative)'), touching + ' / ' + contacts.length);
        ctx.stat(GTL.L('솔버 시간', 'Solver time'), solveMs.toFixed(3) + ' ms');
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
