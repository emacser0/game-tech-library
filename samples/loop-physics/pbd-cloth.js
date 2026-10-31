// Verlet 천(cloth) / Position Based Dynamics: 제약 반복 횟수, 서브스텝, 찢어짐
GTL.register({
  id: 'pbd-cloth',
  title: 'Verlet 천 & 제약 반복 횟수 (PBD)',
  summary: 'Verlet 적분과 거리 제약 투영(Jakobsen 방식, PBD)으로 천을 만듦. 제약을 몇 번 반복해 푸는지가 곧 천의 "강성". 반복이 적으면 고무처럼 늘어남.',
  views: { a: '반복 2회', b: '반복 20회' },
  controls: '마우스 드래그: 천 잡아당기기 (찢어짐을 켜면 찢을 수 있음)',
  info: `
    <p><b>PBD</b>(Position Based Dynamics)는 힘 대신 위치를 직접 고쳐 제약을 맞추는 시뮬레이션 방법. Hitman(2000)에서 소개된 Jakobsen 방식이 출발점.</p>
    <p>동작 원리:</p>
    <ul>
      <li>속도 대신 <b>이전 위치</b>를 저장하는 Verlet 적분으로 입자를 옮김(<code>x' = x + (x - x_prev) + g*dt²</code>)</li>
      <li>각 거리 제약을 <b>위치를 직접 옮겨</b> 맞춤</li>
      <li>한 제약을 맞추면 이웃 제약이 깨짐. 그래서 전체를 여러 번 반복(Gauss-Seidel).</li>
    </ul>
    <p>단점: 반복이 부족하면 오차가 다 풀리지 않아 천이 <b>늘어지고</b> 출렁임. PBD의 강성은 재질 값이 아니라 <b>반복 횟수와 dt에 따라 달라짐</b>. XPBD는 compliance(유연도) 값으로 이 문제를 고침.</p>
    <p>같은 계산량이면 반복 대신 <b>서브스텝</b>을 늘리는 편이 더 단단한 경우가 많음(Macklin 2019 "Small Steps")</p>
    <p>선 색은 늘어남 비율(초록 = 원래 길이, 빨강 = 많이 늘어남)</p>`,
  // 도식: 거리 제약 투영 한 번과, 반복 횟수에 따라 남는 늘어남
  diagram: (L) => `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr-pc" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="18">${L('거리 제약 하나 투영', 'Project one distance constraint')}</text>
    <line x1="40" y1="80" x2="220" y2="80" class="d-dim" stroke-dasharray="3 3"/>
    <circle cx="40" cy="80" r="7" class="f-dim"/><circle cx="220" cy="80" r="7" class="f-dim"/>
    <path d="M48,62 L80,62" class="d-accent" marker-end="url(#arr-pc)"/><path d="M212,62 L180,62" class="d-accent" marker-end="url(#arr-pc)"/>
    <text x="130" y="58" text-anchor="middle" class="t-small">${L('각자 (d - L) / 2씩 당김', 'each moves (d - L) / 2')}</text>
    <path d="M40,100 L220,100" class="d-dim"/><text x="130" y="114" text-anchor="middle" class="t-small t-mono">${L('현재 길이 d', 'current length d')}</text>
    <path d="M85,126 L175,126" class="d-good"/><text x="130" y="140" text-anchor="middle" class="t-small t-mono">${L('원래 길이 L', 'rest length L')}</text>
    <text x="10" y="164" class="t-small t-dim">${L('한 제약을 맞추면 이웃 제약이 다시 깨짐', 'Fixing one constraint breaks its neighbors')}</text>
    <text x="10" y="178" class="t-small t-dim">${L('그래서 전체를 여러 번 반복', 'So the solver repeats over all of them')}</text>
    <line x1="300" y1="24" x2="500" y2="24" class="d-line"/>
    <path d="M340,24 L340,46 L340,70 L340,96 L340,124 L340,156" class="d-a"/>
    ${[24, 46, 70, 96, 124, 156].map((y) => `<circle cx="340" cy="${y}" r="4" class="f-a"/>`).join('')}
    <path d="M440,24 L440,124" class="d-b"/>
    ${[24, 44, 64, 84, 104, 124].map((y) => `<circle cx="440" cy="${y}" r="4" class="f-b"/>`).join('')}
    <text x="350" y="146" class="t-small t-a">${L('반복 2회', '2 iterations')}</text>
    <text x="350" y="172" class="t-small t-dim">${L('아래로 갈수록 늘어남', 'stretches toward the end')}</text>
    <text x="450" y="114" class="t-small t-b">${L('반복 20회', '20 iterations')}</text>
    <text x="450" y="140" class="t-small t-dim">${L('원래 길이 유지', 'no stretch')}</text>
  </svg>`,
  look: [
    'A(반복 2회)와 B(20회)의 "평균 늘어남"을 비교하면 A의 천이 아래로 크게 늘어지고 빨갛게 보임. B는 거의 원래 크기 유지.',
    'A를 반복 1, 서브스텝 8로 바꾸면 프레임당 제약 풀이 수가 B의 절반도 안 되는데 B보다 더 단단함',
    '"찢어짐"을 켜고 마우스로 세게 당기면 천이 찢어짐. 반복이 적은 쪽은 많이 늘어나서 더 쉽게 찢어짐.',
    '"바람"을 끄면 정지 상태의 처짐만 남아 반복 횟수에 따른 차이가 더 분명해짐',
  ],
  refs: [
    { type: 'talk', title: 'Advanced Character Physics (Thomas Jakobsen)', year: 2001, note: 'GDC 2001. Hitman: Codename 47의 Verlet 적분과 제약 투영.' },
    { type: 'paper', title: 'Position Based Dynamics (Müller, Heidelberger, Hennix, Ratcliff)', year: 2006, note: 'VRIPHYS 2006, JVCIR 2007. 강성이 반복 횟수에 따라 달라지는 문제 언급.' },
    { type: 'paper', title: 'XPBD: Position-Based Simulation of Compliant Constrained Dynamics (Macklin, Müller, Chentanez)', year: 2016, note: 'MIG 2016. compliance로 반복 횟수와 관계없는 강성.' },
    { type: 'paper', title: 'Small Steps in Physics Simulation (Macklin et al.)', year: 2019, note: 'SCA 2019.' },
  ],
  params: [
    { key: 'iterations', label: '제약 반복 횟수', type: 'int', min: 1, max: 30, a: 2, b: 20, default: 2, group: '솔버' },
    { key: 'substeps', label: '서브스텝 수', type: 'int', min: 1, max: 8, default: 1 },
    { key: 'tear', label: '찢어짐', type: 'bool', default: false },
    { key: 'tearRatio', label: '찢어지는 늘어남 비율', type: 'range', min: 1.3, max: 5, step: 0.1, default: 2.2, when: (p) => p.tear },
    { key: 'wind', label: '바람', type: 'bool', default: true, shared: true, group: '장면' },
    { key: 'cols', label: '가로 입자 수', type: 'int', min: 8, max: 40, default: 28, shared: true, reset: true },
    { key: 'rows', label: '세로 입자 수', type: 'int', min: 6, max: 30, default: 20, shared: true, reset: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Verlet Cloth & Constraint Iterations (PBD)',
    summary: 'This cloth uses Verlet integration and distance constraint projection (the Jakobsen method, PBD). The number of times you solve the constraints sets the cloth "stiffness". With few iterations, it stretches like rubber.',
    views: { a: '2 iterations', b: '20 iterations' },
    controls: 'Mouse drag: pull the cloth (turn on tearing to tear it)',
    info: `
    <p><b>PBD</b> (Position Based Dynamics) is a simulation method that fixes constraints by moving positions directly instead of using forces. It grew from the Jakobsen method shown in Hitman (2000).</p>
    <p>How it works:</p>
    <ul>
      <li>Move particles with Verlet integration, which stores the <b>previous position</b> instead of velocity (<code>x' = x + (x - x_prev) + g*dt²</code>).</li>
      <li>Satisfy each distance constraint by <b>moving positions directly</b>.</li>
      <li>Fixing one constraint breaks its neighbors. So the solver repeats over all of them several times (Gauss-Seidel).</li>
    </ul>
    <p>Downside: with too few iterations, the error does not fully resolve, so the cloth <b>sags</b> and wobbles. In PBD, stiffness is not a material value. It <b>depends on the iteration count and dt</b>. XPBD fixes this with a compliance (softness) value.</p>
    <p>For the same cost, adding <b>substeps</b> instead of iterations often gives a stiffer result (Macklin 2019 "Small Steps").</p>
    <p>Line color shows the stretch ratio (green = rest length, red = heavily stretched).</p>`,
    look: [
      'Compare "Average stretch" in A (2 iterations) and B (20). A\'s cloth sags far down and looks red. B keeps almost its original size.',
      'Set A to 1 iteration and 8 substeps. It solves less than half as many constraints per frame as B, yet it is stiffer than B.',
      'Turn on "Tearing" and pull hard with the mouse. The cloth tears. The side with fewer iterations stretches more, so it tears more easily.',
      'Turn off "Wind". Only the resting sag remains, so the difference from the iteration count is clearer.',
    ],
    refs: [
      'GDC 2001. Verlet integration and constraint projection in Hitman: Codename 47.',
      'VRIPHYS 2006, JVCIR 2007. Notes that stiffness depends on the iteration count.',
      'MIG 2016. Compliance gives stiffness that does not depend on the iteration count.',
      'SCA 2019.',
    ],
    params: {
      iterations: { label: 'Constraint iterations', group: 'Solver' },
      substeps: 'Substeps',
      tear: 'Tearing',
      tearRatio: 'Tear stretch ratio',
      wind: { label: 'Wind', group: 'Scene' },
      cols: 'Particles across',
      rows: 'Particles down',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const LW = 600, LH = 420, GRAV = 900, HZ = 60;
    const NX = P.cols, NY = P.rows, N = NX * NY;
    const sp = Math.min(440 / (NX - 1), 230 / (NY - 1));
    const x0 = (LW - sp * (NX - 1)) / 2, y0 = 40;
    let x, y, ox, oy, pin, cons, acc, solves, broken, grab = -1, mouseL = null, t;
    const init = () => {
      x = new Float64Array(N); y = new Float64Array(N); ox = new Float64Array(N); oy = new Float64Array(N); pin = new Uint8Array(N);
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
        const k = j * NX + i;
        x[k] = ox[k] = x0 + i * sp; y[k] = oy[k] = y0 + j * sp;
        if (j === 0 && (i % 4 === 0 || i === NX - 1)) pin[k] = 1;
      }
      cons = [];
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
        const k = j * NX + i;
        if (i < NX - 1) cons.push({ a: k, b: k + 1, r: sp, on: true });
        if (j < NY - 1) cons.push({ a: k, b: k + NX, r: sp, on: true });
      }
      acc = 0; solves = 0; broken = 0; t = 0;
    };
    init();

    function substep(h) {
      t += h;
      const drag = Math.pow(0.99, h * 60);
      for (let k = 0; k < N; k++) {
        if (pin[k] || k === grab) continue;
        let ax = 0, ay = GRAV;
        if (P.wind) {
          const gust = 0.6 + 0.4 * Math.sin(t * 0.9);
          ax = gust * 260 * (0.6 + 0.4 * Math.sin(y[k] * 0.04 + t * 3.1 + x[k] * 0.02));
          ay += gust * 60 * Math.sin(x[k] * 0.05 + t * 2.3);
        }
        const nx = x[k] + (x[k] - ox[k]) * drag + ax * h * h;
        const ny = y[k] + (y[k] - oy[k]) * drag + ay * h * h;
        ox[k] = x[k]; oy[k] = y[k]; x[k] = nx; y[k] = ny;
      }
      if (grab >= 0 && mouseL) { ox[grab] = x[grab]; oy[grab] = y[grab]; x[grab] = mouseL.x; y[grab] = mouseL.y; }
      for (let it = 0; it < P.iterations; it++) {
        for (let c = 0; c < cons.length; c++) {
          const s = cons[c];
          if (!s.on) continue;
          const a = s.a, b = s.b;
          const dx = x[b] - x[a], dy = y[b] - y[a];
          const d = Math.sqrt(dx * dx + dy * dy) || 1e-9;
          const wa = pin[a] || a === grab ? 0 : 1, wb = pin[b] || b === grab ? 0 : 1;
          const w = wa + wb;
          if (!w) continue;
          const corr = (d - s.r) / d / w;
          x[a] += dx * corr * wa; y[a] += dy * corr * wa;
          x[b] -= dx * corr * wb; y[b] -= dy * corr * wb;
        }
        solves += cons.length;
      }
      if (P.tear) {
        for (const s of cons) {
          if (!s.on) continue;
          const d = Math.hypot(x[s.b] - x[s.a], y[s.b] - y[s.a]);
          if (d > s.r * P.tearRatio) { s.on = false; broken++; }
        }
      }
    }

    const toLocal = (m) => {
      const s = Math.min(ctx.width / LW, ctx.height / LH), ox_ = (ctx.width - LW * s) / 2, oy_ = (ctx.height - LH * s) / 2;
      return { x: (m.x - ox_) / s, y: (m.y - oy_) / s };
    };

    return {
      update(dt) {
        const H = 1 / HZ;
        acc += dt; solves = 0;
        let n = 0;
        while (acc >= H && n < 3) {
          for (let s = 0; s < P.substeps; s++) substep(H / P.substeps);
          acc -= H; n++;
        }
        if (n >= 3) acc = 0;
      },
      onPointer(type, m) {
        const l = toLocal(m);
        mouseL = l;
        if (type === 'down') {
          let best = -1, bd = 28 * 28;
          for (let k = 0; k < N; k++) { if (pin[k]) continue; const d = (x[k] - l.x) ** 2 + (y[k] - l.y) ** 2; if (d < bd) { bd = d; best = k; } }
          grab = best;
        } else if (type === 'up' || type === 'leave') grab = -1;
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const s = Math.min(W / LW, H / LH);
        g.save(); g.translate((W - LW * s) / 2, (H - LH * s) / 2); g.scale(s, s);
        D.grid(g, LW, LH, 40);
        // 원래 크기 윤곽
        g.setLineDash([4, 6]);
        D.rect(g, x0, y0, sp * (NX - 1), sp * (NY - 1), null, 'rgba(255,255,255,0.18)');
        g.setLineDash([]);
        // 늘어남 비율별 색 버킷
        const B = 6, paths = Array.from({ length: B }, () => []);
        let sum = 0, cnt = 0, mx = 0;
        for (const c of cons) {
          if (!c.on) continue;
          const d = Math.hypot(x[c.b] - x[c.a], y[c.b] - y[c.a]);
          const st = d / c.r - 1;
          sum += Math.abs(st); cnt++; if (st > mx) mx = st;
          paths[U.clamp(Math.floor(Math.abs(st) * 20), 0, B - 1)].push(c);
        }
        g.lineWidth = 1.3;
        for (let bi = 0; bi < B; bi++) {
          if (!paths[bi].length) continue;
          g.beginPath();
          for (const c of paths[bi]) { g.moveTo(x[c.a], y[c.a]); g.lineTo(x[c.b], y[c.b]); }
          g.strokeStyle = `hsl(${120 - (bi / (B - 1)) * 120},70%,58%)`;
          g.stroke();
        }
        const col = ctx.side === 'a' ? C.a : C.b;
        for (let k = 0; k < N; k++) if (pin[k]) D.rect(g, x[k] - 4, y[k] - 4, 8, 8, col);
        if (grab >= 0) D.circle(g, x[grab], y[grab], 7, null, C.warn, 2);
        // 가장 낮은 점 표시 (처짐)
        let low = 0; for (let k = 0; k < N; k++) if (y[k] > low && isFinite(y[k])) low = y[k];
        D.line(g, 20, low, 60, low, col, 2);
        D.text(g, GTL.L(`처짐 +${Math.max(0, low - (y0 + sp * (NY - 1))).toFixed(0)}`, `Sag +${Math.max(0, low - (y0 + sp * (NY - 1))).toFixed(0)}`), 20, low + 4, { size: 11, color: col });
        g.restore();
        ctx.stat(GTL.L('평균 늘어남', 'Average stretch'), cnt ? ((sum / cnt) * 100).toFixed(2) + ' %' : '-');
        ctx.stat(GTL.L('최대 늘어남', 'Max stretch'), (mx * 100).toFixed(1) + ' %');
        ctx.stat(GTL.L('프레임당 제약 풀이', 'Constraint solves per frame'), solves);
        if (P.tear) ctx.stat(GTL.L('끊어진 제약', 'Broken constraints'), broken);
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
