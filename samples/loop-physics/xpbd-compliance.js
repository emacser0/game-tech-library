// XPBD vs PBD: 반복 횟수에 따라 강성이 바뀌는 PBD vs 컴플라이언스로 강성이 일정한 XPBD
GTL.register({
  id: 'xpbd-compliance',
  title: 'XPBD vs PBD: 반복 횟수와 강성',
  summary: 'PBD의 강성 k는 반복 횟수와 dt에 따라 실제 단단함이 달라짐. XPBD는 컴플라이언스 α와 라그랑주 승수 λ를 써서 반복 횟수와 상관없이 같은 늘어남으로 수렴.',
  views: { a: 'PBD (강성 k)', b: 'XPBD (컴플라이언스 α)' },
  controls: '조작 없음. 각 뷰의 기둥 3개는 반복 횟수만 다름.',
  info: `
    <p><b>PBD(Position Based Dynamics)</b>는 위치를 직접 고쳐 제약을 맞추는 방법. 천, 로프, 소프트 바디에 널리 씀.
    거리 제약은 반복마다 오차 <code>C</code>의 <code>k</code>(0~1) 비율만큼 고침.</p>
    <p>문제: 같은 <code>k</code>라도 반복을 많이 돌수록, 서브스텝을 늘릴수록 더 단단해짐. 성능 때문에 반복 횟수를 바꾸면 재질 느낌까지 바뀜.</p>
    <p>반복 보정 <code>k' = 1 - (1 - k)^(1/n)</code>(Müller 2007)는 반복 횟수 의존을 줄이지만 dt 의존은 남음</p>
    <p><b>XPBD(Extended PBD)</b>는 제약마다 라그랑주 승수 <code>λ</code>를 누적하고, 컴플라이언스(강성의 역수) <code>α</code>를 씀</p>
    <ul>
      <li><code>α̃ = α / h²</code></li>
      <li><code>Δλ = (-C - α̃ λ) / (w1 + w2 + α̃)</code></li>
      <li><code>λ += Δλ</code>, 위치 보정은 <code>Δx = w ∇C Δλ</code></li>
    </ul>
    <p><code>λ</code>가 이번 스텝에 누적된 힘(정확히는 힘 × h²)을 기억. 그래서 반복을 더 돌아도 단단해지지 않고 <code>α</code>가 정한 늘어남으로 수렴.
    <code>α = 0</code>이면 PBD의 <code>k = 1</code>과 같은 단단한 제약.</p>
    <p>추가 비용은 제약마다 실수 하나(<code>λ</code>)와 나눗셈 한 번. 단점: 반복이 너무 적으면 수렴 전이라 목표보다 조금 더 늘어남. 서브스텝을 늘리면 해결됨.</p>
    <p>초록 눈금은 α에서 계산한 정답 길이. 질량 1 입자 n개가 매달린 체인에서 총 늘어남 = <code>α g n(n+1)/2</code>.</p>`,
  // 도식: 반복 횟수에 따른 체인 늘어남. PBD는 반복할수록 단단해짐. XPBD는 α가 정한 정답으로 수렴
  diagram: (L) => {
    const X = (n) => (40 + (n / 30) * 240).toFixed(1), Y = (s) => (150 - s * 70).toFixed(1);
    const path = (fn) => { let d = ''; for (let n = 1; n <= 30; n++) d += (n > 1 ? ' L' : 'M') + X(n) + ',' + Y(fn(n)); return d; };
    return `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
    <line x1="40" y1="150" x2="285" y2="150" class="d-dim"/><line x1="40" y1="150" x2="40" y2="20" class="d-dim"/>
    <text x="44" y="18" class="t-small">${L('체인 늘어남', 'Chain stretch')}</text>
    <text x="285" y="166" text-anchor="end" class="t-small">${L('반복 횟수', 'iterations')}</text>
    <text x="${X(1)}" y="166" text-anchor="middle" class="t-small t-mono">1</text><text x="${X(30)}" y="178" text-anchor="middle" class="t-small t-mono">30</text>
    <line x1="40" y1="${Y(0.7)}" x2="285" y2="${Y(0.7)}" class="d-good" stroke-dasharray="4 3"/>
    <path d="${path((n) => 1.7 / (1 + 0.22 * (n - 1)))}" class="d-a"/>
    <path d="${path((n) => 0.7 + 0.5 * Math.exp(-(n - 1) / 2.5))}" class="d-b"/>
    <text x="${X(8)}" y="${Y(1.05)}" class="t-small t-a">${L('PBD: 계속 단단해짐', 'PBD: keeps getting stiffer')}</text>
    <text x="${X(9)}" y="${Y(0.7) - 6}" class="t-small t-b">${L('XPBD: 정답에 수렴', 'XPBD: converges to the answer')}</text>
    <text x="310" y="30" class="t-a">PBD</text>
    <text x="310" y="46" class="t-small t-mono">Δx ∝ k C</text>
    <text x="310" y="60" class="t-small t-dim">${L('반복마다 오차의 k 비율씩 고침', 'fixes k of the error each pass')}</text>
    <text x="310" y="90" class="t-b">XPBD</text>
    <text x="310" y="106" class="t-small t-mono">α̃ = α / h²</text>
    <text x="310" y="120" class="t-small t-mono">Δλ = (-C - α̃ λ) / (w1 + w2 + α̃)</text>
    <text x="310" y="134" class="t-small t-mono">λ += Δλ,  Δx = w ∇C Δλ</text>
    <text x="310" y="150" class="t-small t-dim">${L('λ가 누적된 힘을 기억', 'λ remembers the force so far')}</text>
    <text x="310" y="176" class="t-small t-dim">${L('초록 점선: α에서 계산한 정답', 'Green dashes: answer from α')}</text>
  </svg>`;
  },
  look: [
    'A의 기둥 3개 길이가 모두 다름. 반복 2회 기둥이 가장 길게 늘어지고 32회 기둥은 거의 늘어나지 않음.',
    'B는 기둥 3개가 모두 초록 눈금(α 정답 길이) 근처에서 멈춤. "반복 횟수에 따른 길이 차이"가 A보다 훨씬 작음.',
    'A를 "PBD + 반복 보정"으로 바꾸면 기둥끼리의 차이는 줄지만, 서브스텝을 4로 올리면 전체가 다시 단단해짐. B는 서브스텝을 바꿔도 길이가 그대로임.',
    'B의 α를 0으로 내리면 늘어남이 사라지고 단단한 체인이 됨. α를 올리면 고무줄처럼 늘어남.',
  ],
  refs: [
    { type: 'paper', title: 'XPBD: Position-Based Simulation of Compliant Constrained Dynamics (Macklin, Müller, Chentanez)', year: 2016, note: 'MIG 2016. 컴플라이언스와 λ 누적으로 반복 횟수, dt 의존 제거.' },
    { type: 'paper', title: 'Position Based Dynamics (Müller, Heidelberger, Hennix, Ratcliff)', year: 2007, note: 'Journal of Visual Communication and Image Representation. 강성 k와 반복 보정 1-(1-k)^(1/n).' },
    { type: 'paper', title: 'Small Steps in Physics Simulation (Macklin, Storey, Lu, Terdiman, Chentanez, Jeschke, Müller)', year: 2019, note: 'SCA 2019. 반복 대신 서브스텝을 늘리는 XPBD.' },
    { type: 'talk', title: 'Ten Minute Physics (Matthias Müller)', note: 'XPBD 소프트 바디, 천 예제 영상과 코드' },
  ],
  params: [
    { key: 'method', label: '솔버', type: 'select', group: '솔버', options: [
      { value: 'pbd', label: 'PBD (강성 k)' },
      { value: 'pbdc', label: 'PBD + 반복 보정 k\'' },
      { value: 'xpbd', label: 'XPBD (컴플라이언스 α)' },
    ], a: 'pbd', b: 'xpbd', default: 'pbd' },
    { key: 'k', label: 'PBD 강성 k', type: 'range', min: 0.01, max: 1, step: 0.01, default: 0.1, when: (p) => p.method !== 'xpbd', help: '반복 한 번에 오차를 고치는 비율' },
    { key: 'alpha', label: 'XPBD 컴플라이언스 α (×10⁻³)', type: 'range', min: 0, max: 4, step: 0.05, default: 1, when: (p) => p.method === 'xpbd', help: '강성의 역수. 단위는 px/(질량 × px/s²)' },
    { key: 'substeps', label: '서브스텝 수', type: 'int', min: 1, max: 8, default: 1 },
    { key: 'iters', label: '기둥별 반복 횟수', type: 'select', shared: true, group: '장면', options: [
      { value: '1,4,16', label: '1, 4, 16' },
      { value: '2,8,32', label: '2, 8, 32' },
      { value: '4,16,64', label: '4, 16, 64' },
    ], default: '2,8,32' },
    { key: 'links', label: '체인 마디 수', type: 'int', min: 3, max: 16, default: 10, shared: true, reset: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'XPBD vs PBD: Iterations and Stiffness',
    summary: 'In PBD, the real stiffness of k changes with the iteration count and dt. XPBD uses compliance α and a Lagrange multiplier λ. It converges to the same stretch no matter how many iterations you run.',
    views: { a: 'PBD (stiffness k)', b: 'XPBD (compliance α)' },
    controls: 'No input. The 3 columns in each view differ only in iteration count.',
    info: `
    <p><b>PBD (Position Based Dynamics)</b> fixes constraints by moving positions directly. It is widely used for cloth, rope, and soft bodies.
    Each iteration, a distance constraint fixes a fraction <code>k</code> (0~1) of the error <code>C</code>.</p>
    <p>The problem: with the same <code>k</code>, more iterations or more substeps make it stiffer. If you change the iteration count for performance, the material feel changes too.</p>
    <p>The iteration correction <code>k' = 1 - (1 - k)^(1/n)</code> (Müller 2007) reduces the dependence on iteration count, but the dependence on dt remains.</p>
    <p><b>XPBD (Extended PBD)</b> accumulates a Lagrange multiplier <code>λ</code> per constraint and uses compliance <code>α</code> (the inverse of stiffness).</p>
    <ul>
      <li><code>α̃ = α / h²</code></li>
      <li><code>Δλ = (-C - α̃ λ) / (w1 + w2 + α̃)</code></li>
      <li><code>λ += Δλ</code>, position correction is <code>Δx = w ∇C Δλ</code></li>
    </ul>
    <p><code>λ</code> remembers the force accumulated in this step (strictly, force × h²). So more iterations do not make it stiffer. It converges to the stretch that <code>α</code> sets.
    <code>α = 0</code> gives a rigid constraint, the same as <code>k = 1</code> in PBD.</p>
    <p>The extra cost is one float (<code>λ</code>) and one division per constraint. Downside: with too few iterations it has not converged yet, so it stretches a bit more than the target. More substeps fix this.</p>
    <p>The green mark is the exact length computed from α. For a chain of n particles with mass 1, total stretch = <code>α g n(n+1)/2</code>.</p>`,
    look: [
      'In A, all 3 columns have different lengths. The 2-iteration column sags the most. The 32-iteration column barely stretches.',
      'In B, all 3 columns stop near the green mark (exact α length). "Length spread by iteration count" is much smaller than in A.',
      'Switch A to "PBD + iteration correction". The gap between columns shrinks. But raise substeps to 4 and the whole chain gets stiff again. In B, the length stays the same when you change substeps.',
      'Lower α in B to 0. The stretch disappears and the chain becomes rigid. Raise α and it stretches like a rubber band.',
    ],
    refs: [
      'MIG 2016. Compliance and λ accumulation remove the dependence on iteration count and dt.',
      'Journal of Visual Communication and Image Representation. Stiffness k and the iteration correction 1-(1-k)^(1/n).',
      'SCA 2019. XPBD with more substeps instead of more iterations.',
      'Videos and code for XPBD soft body and cloth examples.',
    ],
    params: {
      method: { label: 'Solver', group: 'Solver', options: { pbd: 'PBD (stiffness k)', pbdc: 'PBD + iteration correction k\'', xpbd: 'XPBD (compliance α)' } },
      k: { label: 'PBD stiffness k', help: 'Fraction of the error fixed in one iteration' },
      alpha: { label: 'XPBD compliance α (×10⁻³)', help: 'Inverse of stiffness. Unit: px/(mass × px/s²)' },
      substeps: 'Substeps',
      iters: { label: 'Iterations per column', group: 'Scene' },
      links: 'Chain links',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const LW = 600, LH = 500, GRAV = 980, HZ = 60, H = 1 / HZ, DAMP = 4;
    const N = P.links, REST = 180 / N, AY = 50, XS = [130, 300, 470];
    let cols, acc, cost;
    const init = () => {
      cols = XS.map((ax) => {
        const c = { x: new Float64Array(N + 1), y: new Float64Array(N + 1), px: new Float64Array(N + 1), py: new Float64Array(N + 1), vx: new Float64Array(N + 1), vy: new Float64Array(N + 1), lam: new Float64Array(N), ax, len: 180 };
        for (let i = 0; i <= N; i++) { c.x[i] = ax; c.y[i] = AY + i * REST; }
        return c;
      });
      acc = 0; cost = 0;
    };
    init();
    const iterList = () => String(P.iters).split(',').map(Number);

    function stepCol(c, h, iters) {
      for (let i = 1; i <= N; i++) {
        c.vy[i] += GRAV * h;
        c.px[i] = c.x[i]; c.py[i] = c.y[i];
        c.x[i] += c.vx[i] * h; c.y[i] += c.vy[i] * h;
      }
      c.lam.fill(0);
      const method = P.method;
      const kEff = method === 'pbdc' ? 1 - Math.pow(1 - P.k, 1 / iters) : P.k;
      const at = (P.alpha * 1e-3) / (h * h);
      for (let it = 0; it < iters; it++) {
        for (let j = 0; j < N; j++) {
          const a = j, b = j + 1;
          const wa = a === 0 ? 0 : 1, wb = 1;
          const dx = c.x[b] - c.x[a], dy = c.y[b] - c.y[a];
          const L = Math.hypot(dx, dy) || 1e-9, nx = dx / L, ny = dy / L;
          const Cv = L - REST;
          let dl;
          if (method === 'xpbd') { dl = (-Cv - at * c.lam[j]) / (wa + wb + at); c.lam[j] += dl; }
          else dl = (-kEff * Cv) / (wa + wb);
          c.x[a] -= wa * dl * nx; c.y[a] -= wa * dl * ny;
          c.x[b] += wb * dl * nx; c.y[b] += wb * dl * ny;
        }
        cost += N;
      }
      const f = Math.exp(-DAMP * h);
      for (let i = 1; i <= N; i++) {
        c.vx[i] = ((c.x[i] - c.px[i]) / h) * f;
        c.vy[i] = ((c.y[i] - c.py[i]) / h) * f;
      }
    }

    const target = () => 180 + P.alpha * 1e-3 * GRAV * (N * (N + 1)) / 2;

    return {
      update(dt) {
        acc += dt;
        cost = 0;
        const its = iterList();
        let guard = 0;
        while (acc >= H && guard++ < 4) {
          const n = P.substeps, h = H / n;
          cols.forEach((c, ci) => { for (let s = 0; s < n; s++) stepCol(c, h, its[ci]); });
          acc -= H;
        }
        if (guard >= 4) acc = 0;
        for (const c of cols) {
          let L = 0;
          for (let j = 0; j < N; j++) L += Math.hypot(c.x[j + 1] - c.x[j], c.y[j + 1] - c.y[j]);
          c.len = L;
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, Hh = ctx.height;
        const s = Math.min(W / LW, Hh / LH), ox = (W - LW * s) / 2, oy = (Hh - LH * s) / 2;
        const col = ctx.side === 'a' ? C.a : C.b;
        const its = iterList();
        g.save(); g.translate(ox, oy); g.scale(s, s);
        D.grid(g, LW, LH, 40);
        D.rect(g, 60, AY - 12, 480, 8, '#9aa3b2');
        const restY = AY + 180, tgtY = AY + target();
        g.setLineDash([5, 5]);
        D.line(g, 40, restY, 560, restY, C.dim, 1);
        g.setLineDash([]);
        D.text(g, GTL.L('쉬는 길이', 'Rest length'), 44, restY - 14, { size: 10, color: C.dim });
        if (P.method === 'xpbd') {
          D.line(g, 40, tgtY, 560, tgtY, C.good, 1.5);
          D.text(g, GTL.L('α 정답 길이', 'Exact α length'), 44, tgtY + 3, { size: 10, color: C.good });
        }
        cols.forEach((c, ci) => {
          D.text(g, GTL.L(`반복 ${its[ci]}회`, `${its[ci]} iterations`), c.ax, AY - 30, { size: 12, align: 'center', color: C.text });
          for (let j = 0; j < N; j++) {
            const L = Math.hypot(c.x[j + 1] - c.x[j], c.y[j + 1] - c.y[j]);
            const st = U.clamp((L / REST - 1) * 2, 0, 1);
            D.line(g, c.x[j], c.y[j], c.x[j + 1], c.y[j + 1], `hsl(${120 - st * 120},70%,60%)`, 3);
          }
          for (let i = 1; i <= N; i++) D.circle(g, c.x[i], c.y[i], i === N ? 7 : 3.5, col);
          D.text(g, `+${((c.len / 180 - 1) * 100).toFixed(0)}%`, c.ax + 12, c.y[N] - 6, { size: 12, color: C.warn });
        });
        g.restore();
        const st = cols.map((c) => (c.len / 180 - 1) * 100);
        ctx.stat(GTL.L('늘어남 (반복 ' + its.join('/') + ')', 'Stretch (iterations ' + its.join('/') + ')'), st.map((v) => v.toFixed(1) + '%').join(' / '));
        ctx.stat(GTL.L('반복 횟수에 따른 길이 차이', 'Length spread by iteration count'), (Math.max(...st) - Math.min(...st)).toFixed(1) + ' %p');
        if (P.method === 'xpbd') ctx.stat(GTL.L('α 정답 늘어남', 'Exact α stretch'), ((target() / 180 - 1) * 100).toFixed(1) + ' %');
        else if (P.method === 'pbdc') ctx.stat(GTL.L('보정된 k\' (반복 ' + its.join('/') + ')', 'Corrected k\' (iterations ' + its.join('/') + ')'), its.map((n) => (1 - Math.pow(1 - P.k, 1 / n)).toFixed(3)).join(' / '));
        else ctx.stat(GTL.L('α 정답 늘어남', 'Exact α stretch'), GTL.L('해당 없음 (PBD는 물리 단위 없음)', 'N/A (PBD has no physical units)'));
        ctx.stat(GTL.L('프레임당 제약 계산', 'Constraint solves per frame'), cost);
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
