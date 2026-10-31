// lerp 스무딩: x = lerp(x, target, 0.1)는 프레임레이트에 따라 속도가 달라짐 → 1 - exp(-λ*dt)
GTL.register({
  id: 'lerp-smoothing',
  title: 'lerp 스무딩과 프레임레이트 독립성',
  summary: '매 프레임 x = lerp(x, target, k)는 간단하지만 프레임이 많을수록 빨리 따라감. k*dt로 바꾸는 흔한 수정도 낮은 FPS에서 틀림. 지수 감쇠 1 − e^(−λ*dt)를 쓰면 어떤 FPS에서도 같은 곡선이 됨.',
  views: { a: 'lerp(x, t, k) 매 프레임', b: 'lerp(x, t, 1 − e^(−λdt))' },
  controls: '조작 없음. 목표가 2초마다 좌우로 순간 이동함. 한 뷰 안의 세 줄은 서로 다른 FPS로 시뮬레이션함.',
  info: `
    <p><code>x = lerp(x, target, 0.1)</code>은 카메라, UI, 추종 오브젝트에 흔히 쓰는 스무딩. 매 프레임 남은 거리의 10%를 줄임.</p>
    <p>문제: 1초 뒤 남는 비율은 <code>0.9<sup>fps</sup></code>. 그래서 <b>144 FPS는 60 FPS보다 훨씬 빨리 도착</b>하고 20 FPS는 느리게 도착함.</p>
    <p>흔한 수정 <code>lerp(x, t, k*dt*60)</code>은 1차 근사. dt가 크면 오차가 커짐. <code>k*dt*60 &gt; 1</code>이면 목표를 넘어 진동하거나 발산함.</p>
    <p>정확한 해: 남은 비율은 시간에 대해 지수적으로 줄어듦. 따라서 <code>x = lerp(x, t, 1 − e<sup>−λ*dt</sup>)</code>.
    여기서는 <code>λ = −ln(1 − k)*60</code>으로 정함. 그래서 <b>60 FPS에서는 세 방식이 정확히 같음</b>. 반감기로 쓰면 <code>λ = ln2 / halfLife</code>.</p>`,
  // 도식: 남은 거리의 계단 그래프. A는 프레임마다 같은 비율을 줄여 FPS가 낮으면 늦음. B는 dt에 맞춘 비율이라 계단 모서리가 같은 지수 곡선 위에 놓임
  diagram: (L) => {
    const k = 0.08, T = 0.5, h = 110, top = 46;
    const stairs = (x0, w, fps, perFrame) => {
      const n = Math.round(T * fps), dx = w / n; let v = 1, s = `M${x0},${top}`;
      for (let i = 1; i <= n; i++) { const x = x0 + i * dx; s += ` L${x.toFixed(1)},${(top + h * (1 - v)).toFixed(1)}`; v *= perFrame; s += ` L${x.toFixed(1)},${(top + h * (1 - v)).toFixed(1)}`; }
      return s;
    };
    const lam = -Math.log(1 - k) * 60;
    const yAt = (v) => (top + h * (1 - v)).toFixed(1);
    const axes = (x0, w) => `<line x1="${x0}" y1="${top - 4}" x2="${x0}" y2="${top + h}" class="d-dim"/><line x1="${x0}" y1="${top + h}" x2="${x0 + w}" y2="${top + h}" class="d-dim"/>`;
    return `<svg viewBox="0 0 540 214" xmlns="http://www.w3.org/2000/svg">
    <text x="30" y="16" class="t-a">${L('A: 프레임마다 k씩 줄임', 'A: cut k every frame')}</text>
    <text x="30" y="31" class="t-small t-dim t-mono">${L('남은 거리 = (1 − k)^프레임 수', 'left = (1 − k)^frames')}</text>
    <text x="295" y="16" class="t-b">${L('B: 1 − e^(−λdt)씩 줄임', 'B: cut 1 − e^(−λdt) each frame')}</text>
    <text x="295" y="31" class="t-small t-dim t-mono">${L('남은 거리 = e^(−λt), FPS 무관', 'left = e^(−λt), any FPS')}</text>
    ${axes(30, 190)}${axes(295, 190)}
    <path d="${stairs(30, 190, 60, 1 - k)}" class="d-dim"/>
    <path d="${stairs(30, 190, 20, 1 - k)}" class="d-a"/>
    <path d="${stairs(295, 190, 60, 1 - k)}" class="d-dim"/>
    <path d="${stairs(295, 190, 20, Math.exp(-lam / 20))}" class="d-b"/>
    <text x="224" y="${yAt(Math.pow(1 - k, 10)) - 4}" class="t-small t-a">20 FPS</text>
    <text x="224" y="${+yAt(Math.pow(1 - k, 30)) + 4}" class="t-small t-dim">60 FPS</text>
    <text x="485" y="${yAt(Math.exp(-lam * T)) - 26}" text-anchor="end" class="t-small t-b">${L('20 FPS = 60 FPS', '20 FPS = 60 FPS')}</text>
    <text x="34" y="${top + h + 14}" class="t-small t-dim">${L('시간 0 ~ 0.5초', 'time 0 ~ 0.5 s')}</text>
    <text x="299" y="${top + h + 14}" class="t-small t-dim">${L('시간 0 ~ 0.5초', 'time 0 ~ 0.5 s')}</text>
    <text x="30" y="194" class="t-small t-dim">${L('세로축은 목표까지 남은 거리. 회색 계단은 60 FPS, 색 계단은 20 FPS (k = 0.08)', 'Vertical axis: distance left to the target. Gray steps: 60 FPS, colored steps: 20 FPS (k = 0.08)')}</text>
    <text x="30" y="209" class="t-small t-dim">${L('k*dt*60 보정은 1차 근사. dt가 크면 목표를 넘음', 'The k*dt*60 fix is a first-order guess. It overshoots when dt is large')}</text>
  </svg>`;
  },
  look: [
    'A를 보면 세 줄(20, 60, 144 FPS)이 서로 다른 속도로 도착함. B는 세 줄이 겹쳐 하나로 보임.',
    '아래 그래프를 보면 A는 곡선 세 개가 벌어지고 B는 하나로 겹침. 가운데 60 FPS 줄은 두 뷰가 같음.',
    'A를 "lerp(x, t, k*dt*60) 보정"으로 바꾸고 FPS 세트를 10 / 30 / 240, k를 0.2~0.3으로 두면 10 FPS 줄이 목표를 지나쳐 출렁임. k가 0.35 이상이면 발산함.',
    '"90% 도달" 값을 보면 FPS별 차이가 숫자로 나옴.',
  ],
  refs: [
    { type: 'article', title: 'Frame Rate Independent Damping Using Lerp (Rory Driscoll)', url: 'https://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/', year: 2016 },
    { type: 'talk', title: 'Lerp smoothing is broken (Freya Holmér)', note: 'YouTube. lerp 스무딩의 프레임 의존성, exp 감쇠 해법, 반감기 파라미터화.' },
    { type: 'article', title: 'Spring-It-On: The Game Developer\'s Spring-Roll-Call (Daniel Holden)', url: 'https://theorangeduck.com/page/spring-roll-call', year: 2021, note: 'damper를 반감기로 정확하게 쓰는 법.' },
  ],
  params: [
    { key: 'method', label: '스무딩 방식', type: 'select', group: '스무딩', options: [
      { value: 'naive', label: 'lerp(x, t, k) 매 프레임' },
      { value: 'dt', label: 'lerp(x, t, k*dt*60) 보정' },
      { value: 'exp', label: 'lerp(x, t, 1 − e^(−λdt))' },
    ], a: 'naive', b: 'exp' },
    { key: 'k', label: 'k (60 FPS 기준 비율)', type: 'range', min: 0.01, max: 0.6, step: 0.01, default: 0.08, shared: true },
    { key: 'fpsSet', label: 'FPS 세트', type: 'select', group: '장면', options: [
      { value: '20,60,144', label: '20 / 60 / 144' },
      { value: '10,30,240', label: '10 / 30 / 240' },
      { value: '30,60,120', label: '30 / 60 / 120' },
    ], default: '20,60,144', shared: true, reset: true },
    { key: 'period', label: '목표 이동 주기 (초)', type: 'range', min: 0.5, max: 5, step: 0.1, default: 2, shared: true },
  ],
  en: {
    title: 'Lerp Smoothing and Frame Rate Independence',
    summary: 'Running x = lerp(x, target, k) every frame is simple, but more frames make it catch up faster. The common fix of using k*dt is also wrong at low FPS. Exponential decay 1 − e^(−λ*dt) gives the same curve at any FPS.',
    views: { a: 'lerp(x, t, k) every frame', b: 'lerp(x, t, 1 − e^(−λdt))' },
    controls: 'No input. The target jumps left and right every 2 seconds. The three rows in a view run at different FPS.',
    info: `
    <p><code>x = lerp(x, target, 0.1)</code> is a common way to smooth cameras, UI, and following objects. Each frame it cuts 10% of the remaining distance.</p>
    <p>The problem: the part left after 1 second is <code>0.9<sup>fps</sup></code>. So <b>144 FPS arrives much sooner than 60 FPS</b>, and 20 FPS arrives late.</p>
    <p>The common fix <code>lerp(x, t, k*dt*60)</code> is a first-order approximation. The error grows with dt. If <code>k*dt*60 &gt; 1</code>, it overshoots the target and wobbles or diverges.</p>
    <p>The exact solution: the remaining part shrinks exponentially over time. So use <code>x = lerp(x, t, 1 − e<sup>−λ*dt</sup>)</code>.
    Here <code>λ = −ln(1 − k)*60</code>. That is why <b>all three methods match exactly at 60 FPS</b>. With a half-life, use <code>λ = ln2 / halfLife</code>.</p>`,
    look: [
      'Look at A. The three rows (20, 60, 144 FPS) arrive at different speeds. In B, the three rows overlap and look like one.',
      'Look at the graph below. In A the three curves spread apart. In B they overlap as one. The middle 60 FPS row is the same in both views.',
      'Switch A to "lerp(x, t, k*dt*60) fix". Set the FPS set to 10 / 30 / 240 and k to 0.2~0.3. The 10 FPS row overshoots the target and wobbles. With k at 0.35 or more, it diverges.',
      'Check the "90% reached" values. They show the difference between FPS rates as numbers.',
    ],
    refs: [
      null,
      'YouTube. Covers the frame dependence of lerp smoothing, the exp decay fix, and half-life parameters.',
      'How to write an exact damper with a half-life.',
    ],
    params: {
      method: { label: 'Smoothing method', group: 'Smoothing', options: { naive: 'lerp(x, t, k) every frame', dt: 'lerp(x, t, k*dt*60) fix' } },
      k: 'k (ratio at 60 FPS)',
      fpsSet: { label: 'FPS set', group: 'Scene' },
      period: 'Target move period (s)',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const rates = P.fpsSet.split(',').map(Number);
    const cols = [C.warn, '#ffffff', C.accent];
    const lanes = rates.map((fps) => ({ fps, acc: 0, time: 0, x: 0, hist: [], arrive: null, legStart: 0 }));
    let clock = 0;
    const targetAt = (t) => (Math.floor(t / P.period) % 2 === 0 ? 1 : 0);
    function step(x, tgt, dt) {
      const k = P.k;
      if (P.method === 'naive') return U.lerp(x, tgt, k);
      if (P.method === 'dt') return U.lerp(x, tgt, k * dt * 60);
      const lambda = -Math.log(1 - k) * 60;
      return U.lerp(x, tgt, 1 - Math.exp(-lambda * dt));
    }

    return {
      update(dt) {
        clock += dt;
        for (const L of lanes) {
          L.acc += dt;
          const h = 1 / L.fps;
          let n = 0;
          while (L.acc >= h && n < 64) {
            L.acc -= h; L.time += h; n++;
            const tgt = targetAt(L.time);
            const leg = Math.floor(L.time / P.period);
            if (leg !== L.legStart) { L.legStart = leg; L.arriveStart = leg * P.period; L.arrived = false; }
            L.x = U.clamp(step(L.x, tgt, h), -4, 5);   // 발산 시 화면 밖으로 날아가지 않게 표시용 클램프
            if (!L.arrived && L.arriveStart !== undefined && Math.abs(L.x - tgt) < 0.1) { L.arrived = true; L.arrive = L.time - L.arriveStart; }
          }
          L.hist.push(L.x); if (L.hist.length > 300) L.hist.shift();
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        const x0 = 60, x1 = W - 40, top = 40, laneH = Math.min(60, (H - 200) / lanes.length);
        const tgt = targetAt(clock);
        D.grid(g, W, H, 40);
        const tx = U.lerp(x0, x1, tgt);
        D.line(g, tx, top - 10, tx, top + laneH * lanes.length, C.warn, 1);
        D.text(g, GTL.L('목표', 'Target'), tx, top - 24, { size: 10, color: C.warn, align: 'center' });
        lanes.forEach((L, i) => {
          const y = top + laneH * (i + 0.5);
          D.line(g, x0, y, x1, y, C.grid, 2);
          D.text(g, `${L.fps} FPS`, 8, y - 6, { size: 11, color: cols[i] });
          // 이 레인의 최근 프레임 위치 (이산 스텝 표시)
          D.circle(g, U.lerp(x0, x1, L.x), y, 12, i === 1 ? col : cols[i], '#000', 1.5);
        });
        // 그래프
        const gy = H - 140, gh = 120, gx = 12, gw = W - 24;
        D.rect(g, gx, gy, gw, gh, 'rgba(0,0,0,0.35)');
        const lo = -0.15, hi = 1.15;
        lanes.forEach((L, i) => D.plot(g, L.hist, gx, gy, gw, gh, { min: lo, max: hi, color: i === 1 ? col : cols[i], background: false, lineWidth: i === 1 ? 2.5 : 1.5 }));
        D.text(g, GTL.L('위치 x (최근 5초), 세 FPS 겹쳐 그림', 'Position x (last 5 s), three FPS rates overlaid'), gx + 4, gy + 3, { size: 10, color: C.dim });
        lanes.forEach((L, i) => ctx.stat(GTL.L(`${L.fps} FPS 90% 도달`, `${L.fps} FPS 90% reached`), L.arrive != null ? L.arrive.toFixed(2) + ' s' : '-'));
        if (P.method === 'dt') {
          const worst = Math.max(...rates.map((f) => (P.k * 60) / f));
          ctx.stat(GTL.L('최저 FPS의 k*dt*60', 'k*dt*60 at lowest FPS'), worst.toFixed(2) + (worst > 2 ? GTL.L(' (> 2 → 발산)', ' (> 2 → diverges)') : worst > 1 ? ' (> 1 → overshoot)' : ''));
        }
      },
    };
  },
});
