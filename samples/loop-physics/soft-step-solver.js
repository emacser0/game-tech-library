// 소프트 스텝: 강체 제약 + Baumgarte vs 소프트 제약 + 서브스텝 + relax (Box2D v3)
GTL.register({
  id: 'soft-step-solver',
  title: '소프트 스텝 & 소프트 제약 (Box2D v3)',
  summary: '가벼운 링크에 무거운 추를 단 체인은 반복 솔버가 수렴하지 못해 늘어남. 같은 비용으로 스텝을 쪼개고 제약을 진동수와 감쇠비로 정의한 소프트 스텝(Box2D v3)은 늘어남이 크게 줄고 튀지 않음.',
  views: { a: 'Baumgarte, 반복 8', b: '소프트 스텝, 서브스텝 4' },
  controls: '마우스 드래그: 추 잡아끌기',
  info: `
    <p><b>소프트 스텝(Soft Step)</b>은 Box2D v3의 솔버 구조. Erin Catto가 Solver2D 실험에서 여러 솔버를 비교한 뒤 고른 방식.</p>
    <p>기존 방식(PGS + Baumgarte)은 한 프레임에 속도 제약을 여러 번 반복해서 풂.</p>
    <ul>
      <li>위치 오차 <code>C</code>는 바이어스 속도 <code>β/h * C</code>로 고침.</li>
      <li><code>β</code>는 단위가 없는 값이라 dt가 바뀌면 느낌이 바뀜. 크게 잡으면 에너지가 늘어 튐.</li>
      <li>질량비가 크면(가벼운 링크, 무거운 추) 반복을 늘려도 잘 수렴하지 않음.</li>
    </ul>
    <p>소프트 스텝은 세 가지를 바꿈.</p>
    <ul>
      <li><b>서브스텝</b>: 프레임을 <code>n</code>개로 나누고 각 서브스텝에서 반복은 1회만 함. 반복보다 서브스텝이 수렴에 훨씬 유리함.</li>
      <li><b>소프트 제약</b>: 제약을 진동수 <code>f</code>(Hz)와 감쇠비 <code>ζ</code>를 가진 스프링으로 봄.
        <code>ω = 2πf</code>, <code>a1 = 2ζ + hω</code>, <code>a2 = hω a1</code>, <code>a3 = 1/(1+a2)</code>.
        충격량 = <code>-m_eff * a2*a3 * (Cdot + ω/a1 * C) - a3 * 누적 충격량</code>. dt가 바뀌어도 같은 물리 단위로 동작함.</li>
      <li><b>Relax</b>: 위치를 옮긴 뒤 바이어스 없이 한 번 더 풀어서 위치 보정이 만든 속도를 없앰. 튀는 현상을 막음.</li>
    </ul>
    <p>두 뷰는 프레임당 제약 풀이 횟수가 같음(A 8회, B 4 서브스텝 × 2회).</p>
    <p>진동수가 서브스텝 주기에 가까우면 불안정함. Box2D v3는 접촉 진동수를 서브스텝 주기의 1/4 이하로 제한함. 이 샘플도 같은 상한을 씀.</p>
    <p>단점: 서브스텝마다 적분과 접촉 갱신이 필요해 코드가 복잡함. 소프트 제약이라 무거운 추를 달면 조금 늘어남.</p>`,
  // 도식: 한 프레임 안의 작업 순서. A는 반복 8회 뒤 적분 1회, B는 서브스텝 4개마다 풀이, 적분, relax. 아래는 소프트 제약 계수
  diagram: (L) => {
    const seg = (x, y) => [[L('풀이', 'solve'), 'f-b'], [L('적분', 'move'), 'f-dim'], ['relax', 'f-dim']]
      .map(([t, c], i) => `<rect x="${x + i * 32}" y="${y}" width="30" height="22" class="${c}"/><text x="${x + i * 32 + 15}" y="${y + 15}" text-anchor="middle" class="t-small">${t}</text>`).join('');
    return `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="18" class="t-small t-dim">${L('한 프레임 (같은 풀이 횟수 8회)', 'One frame (8 solves in both)')}</text>
    <text x="10" y="44" class="t-a">A: Baumgarte</text>
    <rect x="130" y="30" width="300" height="22" class="f-dim"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<line x1="${142 + i * 36}" y1="32" x2="${142 + i * 36}" y2="50" class="d-a"/>`).join('')}
    <rect x="434" y="30" width="96" height="22" class="f-dim"/>
    <text x="482" y="45" text-anchor="middle" class="t-small">${L('적분 1회', 'move once')}</text>
    <text x="280" y="66" text-anchor="middle" class="t-small t-dim">${L('반복 8회, 바이어스 β/h × C', '8 iterations, bias β/h × C')}</text>
    <text x="10" y="96" class="t-b">${L('B: 소프트 스텝', 'B: soft step')}</text>
    ${seg(130, 82)}${seg(230, 82)}${seg(330, 82)}${seg(430, 82)}
    <text x="330" y="120" text-anchor="middle" class="t-small t-dim">${L('서브스텝 4개 × (풀이 1 + relax 1)', '4 substeps × (1 solve + 1 relax)')}</text>
    <text x="10" y="148" class="t-small">${L('소프트 제약: 진동수 f, 감쇠비 ζ인 스프링으로 봄', 'Soft constraint: a spring with frequency f, damping ratio ζ')}</text>
    <text x="10" y="166" class="t-small t-mono">ω = 2πf,  a1 = 2ζ + hω,  a2 = hω a1,  a3 = 1 / (1 + a2)</text>
    <text x="10" y="184" class="t-small t-dim">${L('물리 단위라서 dt가 바뀌어도 느낌이 같음. relax가 보정 속도를 지워 튀지 않음', 'Physical units keep the feel when dt changes. Relax removes push-out speed')}</text>
  </svg>`;
  },
  look: [
    '시작하면 A의 체인이 쉬는 길이 원(점선) 밖으로 크게 늘어나고, 몇 초 뒤에는 늘어난 채로 흔들림. B는 원 근처를 따라 흔들림(최근 3초 최대 늘어남 약 11%).',
    'A의 반복을 32로 올리면 늘어남이 줄지만 제약 풀이 비용이 4배가 됨. 질량비를 200으로 올리면 A는 100% 넘게 늘어나고 B는 25% 이하로 유지됨.',
    'A의 β를 0.9로 올리면 링크가 떨리고 일부 링크가 2배 넘게 늘어남. B의 진동수를 15Hz로 낮추면 고무줄처럼 늘어남.',
    'B의 서브스텝을 1, 반복을 7로 바꾸면(같은 비용) 진동수 상한이 15Hz로 떨어지고 늘어남이 80% 넘게 커짐. 개선의 대부분은 서브스텝에서 나옴.',
  ],
  refs: [
    { type: 'article', title: 'Solver2D (Erin Catto)', url: 'https://box2d.org/posts/2024/02/solver2d/', year: 2024, note: 'PGS, TGS, XPBD, soft step 등 솔버 비교. 질량비가 큰 체인 테스트.' },
    { type: 'talk', title: 'Soft Constraints: Reinventing the Spring (Erin Catto, GDC 2011)', year: 2011, note: '진동수와 감쇠비로 정의한 제약.' },
    { type: 'code', title: 'Box2D v3 (Erin Catto)', url: 'https://github.com/erincatto/box2d', note: 'b2MakeSoft, 서브스텝 솔버, relax 단계.' },
    { type: 'paper', title: 'Stabilization of Constraints and Integrals of Motion in Dynamical Systems (J. Baumgarte)', year: 1972, note: 'Computer Methods in Applied Mechanics and Engineering. 바이어스 안정화의 원조.' },
  ],
  params: [
    { key: 'method', label: '솔버', type: 'select', group: '솔버', options: [
      { value: 'baumgarte', label: '강체 제약 + Baumgarte' },
      { value: 'soft', label: '소프트 제약 (relax 없음)' },
      { value: 'softstep', label: '소프트 스텝 (소프트 제약 + relax)' },
    ], a: 'baumgarte', b: 'softstep', default: 'baumgarte' },
    { key: 'substeps', label: '서브스텝 수', type: 'int', min: 1, max: 16, a: 1, b: 4, default: 1 },
    { key: 'iters', label: '서브스텝당 반복', type: 'int', min: 1, max: 32, a: 8, b: 1, default: 1, help: 'relax 반복은 소프트 스텝에서 1회 추가' },
    { key: 'beta', label: 'Baumgarte β', type: 'range', min: 0, max: 1, step: 0.05, default: 0.2, when: (p) => p.method === 'baumgarte' },
    { key: 'hertz', label: '제약 진동수 (Hz)', type: 'range', min: 2, max: 120, step: 1, default: 60, when: (p) => p.method !== 'baumgarte' },
    { key: 'zeta', label: '감쇠비 ζ', type: 'range', min: 0, max: 10, step: 0.1, default: 2, when: (p) => p.method !== 'baumgarte' },
    { key: 'ratio', label: '추 질량비 (추 / 링크)', type: 'range', min: 1, max: 200, step: 1, default: 100, shared: true, group: '장면' },
    { key: 'links', label: '링크 수', type: 'int', min: 3, max: 20, default: 8, shared: true, reset: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Soft Step & Soft Constraints (Box2D v3)',
    summary: 'A chain of light links with a heavy weight stretches, because the iterative solver cannot converge. The soft step (Box2D v3) splits the step at the same cost and defines constraints by frequency and damping ratio. It stretches much less and does not jitter.',
    views: { a: 'Baumgarte, 8 iterations', b: 'Soft step, 4 substeps' },
    controls: 'Mouse drag: grab and pull the weight',
    info: `
    <p>The <b>soft step</b> is the solver design in Box2D v3. Erin Catto chose it after comparing many solvers in his Solver2D experiments.</p>
    <p>The classic approach (PGS + Baumgarte) solves velocity constraints many times per frame.</p>
    <ul>
      <li>Position error <code>C</code> is fixed with a bias velocity <code>β/h * C</code>.</li>
      <li><code>β</code> has no unit, so the feel changes when dt changes. A large value adds energy and makes things jump.</li>
      <li>With a large mass ratio (light links, heavy weight), more iterations still do not converge well.</li>
    </ul>
    <p>The soft step changes three things.</p>
    <ul>
      <li><b>Substeps</b>: split the frame into <code>n</code> parts and run only 1 iteration per substep. Substeps help convergence far more than iterations.</li>
      <li><b>Soft constraints</b>: treat each constraint as a spring with frequency <code>f</code> (Hz) and damping ratio <code>ζ</code>.
        <code>ω = 2πf</code>, <code>a1 = 2ζ + hω</code>, <code>a2 = hω a1</code>, <code>a3 = 1/(1+a2)</code>.
        Impulse = <code>-m_eff * a2*a3 * (Cdot + ω/a1 * C) - a3 * accumulated impulse</code>. It works in the same physical units even when dt changes.</li>
      <li><b>Relax</b>: after moving positions, solve once more without bias. This removes the velocity that position correction added, and stops jumping.</li>
    </ul>
    <p>Both views do the same number of constraint solves per frame (A: 8, B: 4 substeps × 2).</p>
    <p>A frequency close to the substep rate is unstable. Box2D v3 caps the contact frequency at 1/4 of the substep rate. This sample uses the same cap.</p>
    <p>Downside: each substep needs integration and a contact update, so the code is more complex. Soft constraints also stretch a little under a heavy weight.</p>`,
    look: [
      'At the start, A\'s chain stretches far outside the rest length circle (dashed). After a few seconds it keeps swinging while stretched. B swings along the circle (max stretch over the last 3 s is about 11%).',
      'Raise A\'s iterations to 32. The stretch shrinks, but the solve cost goes up 4 times. Raise the mass ratio to 200. A stretches over 100%, and B stays under 25%.',
      'Raise A\'s β to 0.9. The links shake and some stretch to more than 2 times their length. Lower B\'s frequency to 15 Hz and it stretches like a rubber band.',
      'Set B to 1 substep and 7 iterations (same cost). The frequency cap drops to 15 Hz and the stretch grows by over 80%. Most of the gain comes from substeps.',
    ],
    refs: [
      'Compares PGS, TGS, XPBD, soft step and other solvers. Includes a chain test with a large mass ratio.',
      'Constraints defined by frequency and damping ratio.',
      'b2MakeSoft, the substep solver, and the relax stage.',
      'Computer Methods in Applied Mechanics and Engineering. The origin of bias stabilization.',
    ],
    params: {
      method: { label: 'Solver', group: 'Solver', options: { baumgarte: 'Rigid constraint + Baumgarte', soft: 'Soft constraint (no relax)', softstep: 'Soft step (soft constraint + relax)' } },
      substeps: 'Substeps',
      iters: { label: 'Iterations per substep', help: 'Soft step adds 1 extra relax iteration' },
      hertz: 'Constraint frequency (Hz)',
      zeta: 'Damping ratio ζ',
      ratio: { label: 'Weight mass ratio (weight / link)', group: 'Scene' },
      links: 'Links',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const LW = 600, LH = 440, GRAV = 980, H = 1 / 60;
    const N = P.links, TOTAL = 240, REST = TOTAL / N, AX = 300, AY = 70;
    let x, y, vx, vy, accI, acc, solves, maxStretch, peak, endD, simT, hist, grab = false, mouseL = null;
    const init = () => {
      x = new Float64Array(N + 1); y = new Float64Array(N + 1); vx = new Float64Array(N + 1); vy = new Float64Array(N + 1);
      accI = new Float64Array(N);
      for (let i = 0; i <= N; i++) { x[i] = AX + i * REST; y[i] = AY; }
      acc = 0; solves = 0; maxStretch = 0; peak = 0; endD = 0; simT = 0; hist = [];
    };
    init();
    // Box2D처럼 진동수를 서브스텝 주기의 1/4로 제한
    const hzEff = (h) => Math.min(P.hertz, 0.25 / h);
    const invMass = (i) => (i === 0 ? 0 : i === N ? 1 / P.ratio : 1);

    function solve(h, mode) {
      // mode: 'rigid'(Baumgarte), 'soft', 'relax'
      let ms = 1, is = 0, biasRate = 0;
      if (mode === 'rigid') biasRate = P.beta / h;
      else if (mode === 'soft') {
        const w = 2 * Math.PI * hzEff(h), z = P.zeta;
        const a1 = 2 * z + h * w, a2 = h * w * a1, a3 = 1 / (1 + a2);
        biasRate = w / a1; ms = a2 * a3; is = a3;
      }
      for (let j = 0; j < N; j++) {
        const a = j, b = j + 1, wa = invMass(a), wb = invMass(b);
        const dx = x[b] - x[a], dy = y[b] - y[a];
        const L = Math.hypot(dx, dy) || 1e-9, nx = dx / L, ny = dy / L;
        const Cv = L - REST;
        const cdot = (vx[b] - vx[a]) * nx + (vy[b] - vy[a]) * ny;
        const meff = 1 / (wa + wb);
        const imp = -meff * ms * (cdot + biasRate * Cv) - is * accI[j];
        accI[j] += imp;
        vx[a] -= wa * imp * nx; vy[a] -= wa * imp * ny;
        vx[b] += wb * imp * nx; vy[b] += wb * imp * ny;
      }
      solves += N;
    }
    function warmStart() {
      for (let j = 0; j < N; j++) {
        const a = j, b = j + 1, wa = invMass(a), wb = invMass(b);
        const dx = x[b] - x[a], dy = y[b] - y[a];
        const L = Math.hypot(dx, dy) || 1e-9, nx = dx / L, ny = dy / L;
        vx[a] -= wa * accI[j] * nx; vy[a] -= wa * accI[j] * ny;
        vx[b] += wb * accI[j] * nx; vy[b] += wb * accI[j] * ny;
      }
    }
    function substep(h) {
      for (let i = 1; i <= N; i++) vy[i] += GRAV * h;
      warmStart();
      const mode = P.method === 'baumgarte' ? 'rigid' : 'soft';
      for (let it = 0; it < P.iters; it++) solve(h, mode);
      for (let i = 1; i <= N; i++) { x[i] += vx[i] * h; y[i] += vy[i] * h; }
      if (P.method === 'softstep') solve(h, 'relax');
      if (grab && mouseL) {
        // 추를 마우스 쪽으로 끄는 감쇠 스프링 (가속도 기준이라 질량과 무관)
        vx[N] += ((mouseL.x - x[N]) * 60 - vx[N] * 8) * h;
        vy[N] += ((mouseL.y - y[N]) * 60 - vy[N] * 8) * h;
      }
    }

    const toLocal = (m) => {
      const s = Math.min(ctx.width / LW, ctx.height / LH), ox = (ctx.width - LW * s) / 2, oy = (ctx.height - LH * s) / 2;
      return { x: (m.x - ox) / s, y: (m.y - oy) / s };
    };

    return {
      update(dt) {
        acc += dt; solves = 0;
        let guard = 0;
        while (acc >= H && guard++ < 4) {
          const n = P.substeps;
          for (let s = 0; s < n; s++) substep(H / n);
          acc -= H;
        }
        if (guard >= 4) acc = 0;
        let ms = 0;
        for (let j = 0; j < N; j++) ms = Math.max(ms, Math.hypot(x[j + 1] - x[j], y[j + 1] - y[j]) / REST - 1);
        if (!isFinite(ms) || ms > 20) init();
        maxStretch = ms;
        endD = Math.hypot(x[N] - AX, y[N] - AY) / TOTAL - 1;
        simT += dt;
        hist.push({ t: simT, v: endD });
        while (hist.length && hist[0].t < simT - 3) hist.shift();
        peak = hist.reduce((m, h) => Math.max(m, h.v), -Infinity);
      },
      onPointer(type, m) {
        mouseL = toLocal(m);
        if (type === 'down') grab = Math.hypot(mouseL.x - x[N], mouseL.y - y[N]) < 40;
        else if (type === 'up' || type === 'leave') grab = false;
      },
      render() {
        const g = ctx.g, W = ctx.width, Hh = ctx.height;
        const s = Math.min(W / LW, Hh / LH), ox = (W - LW * s) / 2, oy = (Hh - LH * s) / 2;
        const col = ctx.side === 'a' ? C.a : C.b;
        g.save(); g.translate(ox, oy); g.scale(s, s);
        D.grid(g, LW, LH, 40);
        D.rect(g, AX - 30, AY - 10, 60, 6, '#9aa3b2');
        // 쉬는 길이 원
        g.setLineDash([5, 6]);
        g.beginPath(); g.arc(AX, AY, TOTAL, 0, Math.PI); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1; g.stroke();
        g.setLineDash([]);
        for (let j = 0; j < N; j++) {
          const L = Math.hypot(x[j + 1] - x[j], y[j + 1] - y[j]);
          const st = U.clamp(Math.abs(L / REST - 1) * 5, 0, 1);
          D.line(g, x[j], y[j], x[j + 1], y[j + 1], `hsl(${120 - st * 120},70%,60%)`, 3);
        }
        for (let i = 1; i < N; i++) D.circle(g, x[i], y[i], 3.5, col);
        const r = 6 + Math.cbrt(P.ratio) * 2.2;
        D.circle(g, x[N], y[N], r, col, grab ? C.warn : '#fff', grab ? 3 : 1.5);
        if (grab && mouseL) D.line(g, x[N], y[N], mouseL.x, mouseL.y, C.warn, 1);
        g.restore();
        ctx.stat(GTL.L('최대 링크 늘어남', 'Max link stretch'), (maxStretch * 100).toFixed(1) + ' %');
        ctx.stat(GTL.L('체인 전체 늘어남', 'Whole chain stretch'), (endD * 100).toFixed(1) + ' %');
        ctx.stat(GTL.L('최근 3초 최대 늘어남', 'Max stretch (last 3 s)'), (peak * 100).toFixed(1) + ' %');
        ctx.stat(GTL.L('프레임당 제약 풀이', 'Constraint solves per frame'), solves);
        if (P.method !== 'baumgarte') ctx.stat(GTL.L('적용 진동수 (상한 = 서브스텝 주기/4)', 'Applied frequency (cap = substep rate/4)'), hzEff(H / P.substeps).toFixed(0) + ' / ' + (60 * P.substeps / 4).toFixed(0) + ' Hz');
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
