// 수치 적분기 비교: Explicit Euler / Semi-implicit Euler / Velocity Verlet / RK4
GTL.register({
  id: 'physics-integrators',
  title: '수치 적분기 비교 (Euler, Verlet, RK4)',
  summary: '같은 궤도와 스프링을 같은 dt로 적분해도 적분기에 따라 에너지가 새거나(발산) 보존됨. Explicit Euler와 Semi-implicit Euler는 코드 한 줄 차이지만 결과가 완전히 다름.',
  views: { a: 'Explicit Euler', b: 'RK4' },
  controls: '조작 없음. 위성이 중심 별을 공전.',
  info: `
    <p><b>수치 적분기</b>는 속도와 가속도로 다음 위치를 계산하는 방법. 물리 엔진은 매 스텝 <code>x' = v, v' = a(x)</code>를 적분.</p>
    <p>적분기마다 정확도, 비용, 에너지 보존 성질이 다름. 잘못 고르면 궤도가 풀리거나 물체가 튀어 나감.</p>
    <ul>
      <li><b>Explicit Euler</b>: 이전 속도로 위치를 옮김(<code>x += v*dt; v += a*dt</code>). 에너지가 매 스텝 조금씩 <b>늘어나</b> 궤도가 바깥으로 풀림.</li>
      <li><b>Semi-implicit Euler</b>(Symplectic Euler): 순서만 바꿈(<code>v += a*dt; x += v*dt</code>). 심플렉틱 적분기(에너지 오차가 쌓이지 않는 적분기)라 오차가 일정 범위에서 오르내리기만 함. Box2D 등 대부분의 게임 물리 엔진이 기본으로 씀.</li>
      <li><b>Velocity Verlet</b>: 2차 정확도의 심플렉틱 적분기</li>
      <li><b>RK4</b>: 스텝마다 힘을 4번 계산하는 4차 정확도 적분기. 오차가 아주 작음.</li>
    </ul>
    <p>단점: RK4는 비용이 4배. 심플렉틱이 아니라서 아주 오래 돌리면 에너지가 서서히 줄어듦.</p>
    <p>그래프는 초기 에너지 대비 상대 오차 <code>(E - E₀) / |E₀|</code>. 점선은 아주 작은 dt로 미리 계산한 기준 궤도.</p>`,
  // 도식: 적분기별 갱신 순서와, 옛 속도로 접선을 따라 가면 궤도가 바깥으로 풀리는 이유
  diagram: (L) => {
    let spiral = '';
    for (let i = 0; i <= 120; i++) {
      const th = (i / 120) * Math.PI * 3, r = 46 + (i / 120) * 22;
      spiral += (i ? ' L' : 'M') + (420 + r * Math.cos(th)).toFixed(1) + ',' + (108 - r * Math.sin(th)).toFixed(1);
    }
    return `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr-pi" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="18" class="t-a">Explicit Euler</text>
    <text x="10" y="34" class="t-small t-mono">x += v*dt;  v += a*dt</text>
    <text x="10" y="48" class="t-small t-dim">${L('옛 속도로 이동. 에너지가 늘어남', 'Moves with the old velocity. Energy grows')}</text>
    <text x="10" y="76">Semi-implicit Euler</text>
    <text x="10" y="92" class="t-small t-mono">v += a*dt;  x += v*dt</text>
    <text x="10" y="106" class="t-small t-dim">${L('새 속도로 이동. 에너지 오차가 쌓이지 않음', 'Moves with the new velocity. Error does not pile up')}</text>
    <text x="10" y="134" class="t-b">RK4</text>
    <text x="10" y="150" class="t-small t-mono">k1, k2, k3, k4</text>
    <text x="10" y="164" class="t-small t-dim">${L('스텝마다 힘을 4번 계산해 가중 평균', 'Evaluates force 4 times per step, weighted mean')}</text>
    <text x="10" y="178" class="t-small t-dim">${L('4차 정확도, 비용 4배', '4th order accuracy, 4x cost')}</text>
    <path d="${spiral}" class="d-a"/>
    <circle cx="420" cy="108" r="46" class="d-b"/>
    <circle cx="420" cy="108" r="6" class="f-accent"/>
    <circle cx="420" cy="62" r="3.5" class="f-dim"/>
    <path d="M420,62 L486,62" class="d-accent" marker-end="url(#arr-pi)"/>
    <line x1="420" y1="108" x2="486" y2="62" class="d-dim" stroke-dasharray="3 3"/>
    <text x="420" y="16" text-anchor="middle" class="t-small">${L('접선으로 한 스텝 가면', 'One step along the tangent')}</text>
    <text x="420" y="28" text-anchor="middle" class="t-small">${L('중심에서 더 멀어짐', 'lands farther from the center')}</text>
    <text x="420" y="192" text-anchor="middle" class="t-small t-dim">${L('주황: Euler 궤도, 파랑: 실제 궤도', 'Orange: Euler orbit, blue: true orbit')}</text>
  </svg>`;
  },
  look: [
    'A(Explicit Euler)를 몇 바퀴 돌리면 궤도가 바깥으로 풀리고 에너지 그래프가 계속 올라감. B(RK4)는 기준 궤도와 겹침.',
    'A를 Semi-implicit Euler로 바꾸면 궤도가 세차(회전)는 하지만 바깥으로 벗어나지 않음. 에너지 오차가 오르내리기만 함.',
    '물리 주기를 10Hz로 낮추면 차이가 크게 벌어짐. 240Hz로 올리면 Euler도 한동안 버팀(오차 ∝ dt).',
    '"스텝당 힘 계산" 값을 보면 RK4가 4배 비쌈. 같은 비용으로 Semi-implicit Euler를 4배 높은 주기로 돌린 결과와 비교해 볼 수 있음.',
  ],
  refs: [
    { type: 'article', title: 'Integration Basics', url: 'https://gafferongames.com/post/integration_basics/', year: 2004, note: 'Glenn Fiedler. Euler vs RK4 게임 물리 입문.' },
    { type: 'paper', title: 'Computer "Experiments" on Classical Fluids (L. Verlet)', year: 1967, note: 'Physical Review 159. Verlet 적분의 출발점.' },
    { type: 'book', title: 'Geometric Numerical Integration (Hairer, Lubich, Wanner)', year: 2006, note: '심플렉틱 적분기가 에너지를 장기적으로 보존하는 이유' },
    { type: 'code', title: 'Box2D - b2IntegrateVelocities / b2IntegratePositions', url: 'https://github.com/erincatto/box2d', note: '속도 먼저, 그 속도로 위치를 갱신하는 Semi-implicit Euler' },
  ],
  params: [
    { key: 'integrator', label: '적분기', type: 'select', group: '적분', options: [
      { value: 'euler', label: 'Explicit Euler' },
      { value: 'semi', label: 'Semi-implicit Euler' },
      { value: 'verlet', label: 'Velocity Verlet' },
      { value: 'rk4', label: 'RK4' },
    ], a: 'euler', b: 'rk4' },
    { key: 'hz', label: '물리 주기 (Hz)', type: 'int', min: 5, max: 240, default: 30, help: 'dt = 1/Hz (시뮬레이션 시간 단위)' },
    { key: 'scene', label: '장면', type: 'select', group: '장면', options: [
      { value: 'orbit', label: '타원 궤도 (중력)' },
      { value: 'spring', label: '2D 스프링 (조화 진동자)' },
    ], default: 'orbit', shared: true, reset: true },
    { key: 'timeScale', label: '시간 배율', type: 'range', min: 0.25, max: 4, step: 0.05, default: 1, shared: true },
    { key: 'showRef', label: '기준 궤도 표시', type: 'bool', default: true, shared: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Numerical Integrators (Euler, Verlet, RK4)',
    summary: 'Integrate the same orbit and spring with the same dt. Depending on the integrator, energy leaks (diverges) or stays conserved. Explicit Euler and Semi-implicit Euler differ by one line of code, but the results are completely different.',
    views: { a: 'Explicit Euler', b: 'RK4' },
    controls: 'No input. A satellite orbits the central star.',
    info: `
    <p>A <b>numerical integrator</b> computes the next position from velocity and acceleration. A physics engine integrates <code>x' = v, v' = a(x)</code> every step.</p>
    <p>Each integrator has different accuracy, cost, and energy behavior. A poor choice makes orbits unwind or objects fly off.</p>
    <ul>
      <li><b>Explicit Euler</b>: moves the position with the old velocity (<code>x += v*dt; v += a*dt</code>). Energy <b>grows</b> a little every step, so the orbit spirals outward.</li>
      <li><b>Semi-implicit Euler</b> (Symplectic Euler): only swaps the order (<code>v += a*dt; x += v*dt</code>). It is a symplectic integrator (energy error does not build up), so the error only goes up and down within a fixed range. Box2D and most game physics engines use it by default.</li>
      <li><b>Velocity Verlet</b>: a second-order symplectic integrator.</li>
      <li><b>RK4</b>: a fourth-order integrator that evaluates forces 4 times per step. Its error is very small.</li>
    </ul>
    <p>Downside: RK4 costs 4 times as much. It is not symplectic, so over a very long run its energy slowly drops.</p>
    <p>The graph shows the relative error against the initial energy, <code>(E - E₀) / |E₀|</code>. The dashed line is a reference orbit computed ahead of time with a very small dt.</p>`,
    look: [
      'Let A (Explicit Euler) run a few laps. The orbit spirals outward and the energy graph keeps rising. B (RK4) overlaps the reference orbit.',
      'Switch A to Semi-implicit Euler. The orbit precesses (rotates) but does not drift outward. The energy error only goes up and down.',
      'Lower the physics rate to 10 Hz. The gap grows large. Raise it to 240 Hz and even Euler holds up for a while (error ∝ dt).',
      'Check "Force evals per step": RK4 costs 4 times as much. Compare it with Semi-implicit Euler at a 4 times higher rate for the same cost.',
    ],
    refs: [
      'Glenn Fiedler. An intro to Euler vs RK4 for game physics.',
      'Physical Review 159. The origin of Verlet integration.',
      'Why symplectic integrators conserve energy over the long run.',
      'Semi-implicit Euler: update velocity first, then update position with that velocity.',
    ],
    params: {
      integrator: { label: 'Integrator', group: 'Integration' },
      hz: { label: 'Physics rate (Hz)', help: 'dt = 1/Hz (in simulation time)' },
      scene: { label: 'Scene', group: 'Scene', options: { orbit: 'Elliptical orbit (gravity)', spring: '2D spring (harmonic oscillator)' } },
      timeScale: 'Time scale',
      showRef: 'Show reference orbit',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const orbit = P.scene === 'orbit';
    // 단위: 궤도 GM = 1, 시작 반지름 1. 스프링 k = ω².
    const SPRING_W = U.TAU / 2.5, K = SPRING_W * SPRING_W;
    const x0 = orbit ? { x: 1, y: 0, vx: 0, vy: 0.75 } : { x: 1, y: 0, vx: 0, vy: 0.45 * SPRING_W };
    const accel = orbit
      ? (x, y) => { const r2 = x * x + y * y, r = Math.sqrt(r2), f = -1 / (r2 * Math.max(r, 0.05)); return [x * f, y * f]; }
      : (x, y) => [-K * x, -K * y];
    const energy = (s) => {
      const v2 = s.vx * s.vx + s.vy * s.vy;
      return orbit ? 0.5 * v2 - 1 / Math.hypot(s.x, s.y) : 0.5 * v2 + 0.5 * K * (s.x * s.x + s.y * s.y);
    };
    const E0 = energy(x0);
    // 공전 주기(케플러 3법칙) 또는 스프링 주기
    const semiMajor = orbit ? 1 / (2 / 1 - (x0.vy * x0.vy)) : 1;
    const period = orbit ? U.TAU * Math.pow(semiMajor, 1.5) : 2.5;

    function step(s, h, kind) {
      if (kind === 'euler') {
        const [ax, ay] = accel(s.x, s.y);
        s.x += s.vx * h; s.y += s.vy * h; s.vx += ax * h; s.vy += ay * h;
      } else if (kind === 'semi') {
        const [ax, ay] = accel(s.x, s.y);
        s.vx += ax * h; s.vy += ay * h; s.x += s.vx * h; s.y += s.vy * h;
      } else if (kind === 'verlet') {
        const [ax, ay] = accel(s.x, s.y);
        s.x += s.vx * h + 0.5 * ax * h * h; s.y += s.vy * h + 0.5 * ay * h * h;
        const [bx, by] = accel(s.x, s.y);
        s.vx += 0.5 * (ax + bx) * h; s.vy += 0.5 * (ay + by) * h;
      } else {
        const f = (x, y, vx, vy) => { const [ax, ay] = accel(x, y); return [vx, vy, ax, ay]; };
        const k1 = f(s.x, s.y, s.vx, s.vy);
        const k2 = f(s.x + k1[0] * h / 2, s.y + k1[1] * h / 2, s.vx + k1[2] * h / 2, s.vy + k1[3] * h / 2);
        const k3 = f(s.x + k2[0] * h / 2, s.y + k2[1] * h / 2, s.vx + k2[2] * h / 2, s.vy + k2[3] * h / 2);
        const k4 = f(s.x + k3[0] * h, s.y + k3[1] * h, s.vx + k3[2] * h, s.vy + k3[3] * h);
        s.x += (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) * h / 6;
        s.y += (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) * h / 6;
        s.vx += (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]) * h / 6;
        s.vy += (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]) * h / 6;
      }
    }
    const EVALS = { euler: 1, semi: 1, verlet: 1, rk4: 4 }; // Verlet은 다음 스텝의 a를 재사용하면 1회

    // 기준 궤도: 아주 작은 dt의 RK4로 한 주기
    const ref = [];
    { const s = { ...x0 }, h = period / 4000; for (let i = 0; i <= 4000; i++) { if (i % 10 === 0) ref.push([s.x, s.y]); step(s, h, 'rk4'); } }

    let s, acc, simT, trail, errHist, steps, diverged, divergeTimer, maxErr;
    const init = () => {
      s = { ...x0 }; acc = 0; simT = 0; trail = []; errHist = []; steps = 0; diverged = false; divergeTimer = 0; maxErr = 0;
    };
    init();

    return {
      update(dt) {
        if (diverged) { divergeTimer += dt; if (divergeTimer > 2) init(); return; }
        const h = 1 / P.hz;
        acc += dt * P.timeScale;
        let n = 0;
        while (acc >= h && n < 2000) {
          step(s, h, P.integrator);
          acc -= h; simT += h; steps++; n++;
          trail.push(s.x, s.y);
          if (trail.length > 2400) trail.splice(0, 2);
          const r = Math.hypot(s.x, s.y);
          if (!isFinite(r) || r > 8 || (orbit && r < 0.03)) { diverged = true; break; }
        }
        const err = (energy(s) - E0) / Math.abs(E0);
        if (isFinite(err)) { errHist.push(err); maxErr = Math.max(maxErr, Math.abs(err)); }
        if (errHist.length > 600) errHist.shift();
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const graphH = Math.min(110, H * 0.25);
        const areaH = H - graphH - 20;
        const sc = Math.min(W, areaH) * (orbit ? 0.55 : 0.42);
        const cx = W / 2 - (orbit ? (1 - semiMajor) * sc : 0), cy = areaH / 2 + 6;
        const col = ctx.side === 'a' ? C.a : C.b;
        D.grid(g, W, areaH + 10, 40);
        if (orbit) {
          D.circle(g, cx, cy, 10, C.warn);
          D.circle(g, cx, cy, 18, null, 'rgba(255,203,107,0.25)', 2);
        } else {
          D.line(g, cx - 6, cy, cx + 6, cy, C.dim); D.line(g, cx, cy - 6, cx, cy + 6, C.dim);
        }
        if (P.showRef) {
          g.setLineDash([4, 5]);
          D.poly(g, ref.map(([x, y]) => ({ x: cx + x * sc, y: cy - y * sc })), null, 'rgba(102,209,122,0.7)', 1.5, true);
          g.setLineDash([]);
        }
        // 궤적
        if (trail.length >= 4) {
          const n = trail.length / 2;
          g.lineWidth = 1.5;
          for (let seg = 0; seg < 4; seg++) {
            const a = Math.floor((seg / 4) * (n - 1)), b = Math.floor(((seg + 1) / 4) * (n - 1));
            g.beginPath();
            for (let i = a; i <= b; i++) {
              const px = cx + trail[i * 2] * sc, py = cy - trail[i * 2 + 1] * sc;
              i === a ? g.moveTo(px, py) : g.lineTo(px, py);
            }
            g.globalAlpha = 0.2 + seg * 0.2; g.strokeStyle = col; g.stroke();
          }
          g.globalAlpha = 1;
        }
        const px = cx + s.x * sc, py = cy - s.y * sc;
        if (!orbit) D.line(g, cx, cy, px, py, 'rgba(255,255,255,0.25)', 1);
        if (isFinite(px) && isFinite(py)) {
          D.arrow(g, px, py, px + s.vx * sc * 0.25, py - s.vy * sc * 0.25, 'rgba(255,255,255,0.7)', 1.5, 6);
          D.circle(g, px, py, 7, col);
        }
        if (diverged) D.text(g, GTL.L('발산! 궤도 이탈, 다시 시작', 'Diverged! Left orbit, restarting'), W / 2, cy - 12, { align: 'center', color: C.bad, size: 16 });

        // 에너지 오차 그래프 (대칭 범위)
        const gy = H - graphH - 6, gw = W - 20;
        let m = 0.01; for (const e of errHist) m = Math.max(m, Math.abs(e));
        m = Math.min(m * 1.15, 10);
        D.plot(g, errHist.length > 1 ? errHist : [0, 0], 10, gy, gw, graphH, { min: -m, max: m, color: col, label: GTL.L(`에너지 상대 오차 (±${(m * 100).toFixed(m < 0.1 ? 2 : 0)}%)`, `Relative energy error (±${(m * 100).toFixed(m < 0.1 ? 2 : 0)}%)`) });
        D.line(g, 10, gy + graphH / 2, 10 + gw, gy + graphH / 2, 'rgba(255,255,255,0.15)');

        const err = (energy(s) - E0) / Math.abs(E0);
        ctx.stat(GTL.L('에너지 오차', 'Energy error'), isFinite(err) ? (err * 100).toFixed(3) + ' %' : '∞');
        ctx.stat(GTL.L('최대 |오차|', 'Max |error|'), (maxErr * 100).toFixed(3) + ' %');
        ctx.stat(GTL.L('경과 주기', 'Elapsed periods'), (simT / period).toFixed(1) + GTL.L(' 바퀴', ' laps'));
        ctx.stat(GTL.L('스텝당 힘 계산', 'Force evals per step'), EVALS[P.integrator] + GTL.L(' 회', 'x'));
        ctx.stat('dt', (1000 / P.hz).toFixed(1) + GTL.L(' ms (주기의 ', ' ms (') + (100 / P.hz / period).toFixed(2) + GTL.L('%)', '% of period)'));
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
