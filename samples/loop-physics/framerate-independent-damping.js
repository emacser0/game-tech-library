// 프레임레이트 독립 감쇠: lerp(x, t, k) per frame vs lerp(x, t, 1 - exp(-λ*dt))
GTL.register({
  id: 'framerate-independent-damping',
  title: '프레임레이트 독립 감쇠 (lerp vs damp)',
  summary: '매 프레임 x = lerp(x, target, k)를 하면 FPS가 높을수록 더 빨리 따라감. k*dt로 고쳐도 정확하지 않음. 1 - e^(-λ*dt)를 쓰면 모든 FPS에서 같은 곡선이 나옴.',
  views: { a: 'lerp(x, t, k)', b: 'damp: 1 - e^(-λ*dt)' },
  controls: '조작 없음. 목표가 3초마다 좌우로 바뀜.',
  info: `
    <p><b>프레임레이트 독립 감쇠</b>는 FPS와 관계없이 같은 속도로 목표에 다가가게 하는 방법</p>
    <p>한 프레임에 남은 거리의 <code>k</code>만큼 다가가면 n 프레임 뒤 남은 거리는 <code>(1-k)ⁿ</code>. 1초 동안의 프레임 수 n이 곧 FPS.
    그래서 <b>144fps가 10fps보다 14배 빨리</b> 수렴. 기기 성능에 따라 게임 속도가 달라지는 대표적인 버그.</p>
    <p>흔한 수정인 <code>lerp(x, t, k*dt*60)</code>은 1차 근사일 뿐임. 두 가지 문제가 남음.</p>
    <ul>
      <li>낮은 FPS에서 여전히 결과가 다름</li>
      <li><code>k*dt*60 &gt; 1</code>이면 목표를 지나침</li>
    </ul>
    <p>정답은 연속 시간 지수 감쇠 <code>dx/dt = -λ(x - t)</code>의 정확한 해를 쓰는 것</p>
    <p><code>x = lerp(x, t, 1 - exp(-λ*dt))</code> (= <code>1 - (1-k)^(dt*60)</code>, 60fps에서 기존 k와 같은 느낌)</p>
    <p>단점: <code>exp</code> 계산이 한 번 더 들어감. 기존 k 값을 λ로 바꿔야 함.</p>
    <p>각 뷰 안의 레인 5개는 서로 다른 호스트 FPS를 <b>흉내 냄</b>. 두 뷰는 같은 시드로 같은 프레임 타이밍을 받음.</p>`,
  // 도식: 0.5초 동안 남은 거리. 프레임 lerp는 FPS마다 곡선이 다름. damp는 모든 FPS가 같은 지수 곡선 위에 놓임
  diagram: (L) => {
    const Y = (r) => (150 - r * 116).toFixed(1);
    const X = (t, x0) => (x0 + (t / 0.5) * 200).toFixed(1);
    const stair = (x0, fps, f) => {
      let d = `M${x0},${Y(1)}`, r = 1;
      for (let i = 1; i <= Math.floor(0.5 * fps); i++) { d += ` L${X(i / fps, x0)},${Y(r)}`; r *= f; d += ` L${X(i / fps, x0)},${Y(r)}`; }
      return d + ` L${x0 + 200},${Y(r)}`;
    };
    const lam = -Math.log(0.9) * 60;
    let curve = '';
    for (let i = 0; i <= 50; i++) { const t = (i / 50) * 0.5; curve += (i ? ' L' : 'M') + X(t, 300) + ',' + Y(Math.exp(-lam * t)); }
    const axes = (x0) => `<line x1="${x0}" y1="150" x2="${x0 + 200}" y2="150" class="d-dim"/><line x1="${x0}" y1="150" x2="${x0}" y2="30" class="d-dim"/>`;
    return `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
    <text x="30" y="18" class="t-a">${L('A: 매 프레임 lerp(x, t, 0.1)', 'A: lerp(x, t, 0.1) every frame')}</text>
    <text x="300" y="18" class="t-b">B: 1 - e^(-λ dt)</text>
    ${axes(30)}${axes(300)}
    <text x="26" y="37" text-anchor="end" class="t-small t-mono">1</text><text x="26" y="153" text-anchor="end" class="t-small t-mono">0</text>
    <path d="${stair(30, 10, 0.9)}" class="d-a"/>
    <path d="${stair(30, 30, 0.9)}" class="d-a" stroke-dasharray="5 3"/>
    <path d="${stair(30, 144, 0.9)}" class="d-a" stroke-dasharray="2 2"/>
    <text x="234" y="${Y(0.59)}" class="t-small t-mono">10 fps</text>
    <text x="234" y="${Y(0.2)}" class="t-small t-mono">30 fps</text>
    <text x="234" y="144" class="t-small t-mono">144</text>
    <path d="${stair(300, 10, Math.exp(-lam / 10))}" class="d-dim"/>
    <path d="${curve}" class="d-b"/>
    <text x="400" y="72" class="t-small">${L('10, 30, 144 fps 모두', '10, 30, 144 fps all')}</text>
    <text x="400" y="85" class="t-small">${L('같은 곡선 위에 놓임', 'land on one curve')}</text>
    <text x="30" y="166" class="t-small t-dim">${L('세로: 남은 거리, 가로: 0 ~ 0.5초', 'Vertical: distance left, horizontal: 0 ~ 0.5 s')}</text>
    <text x="30" y="180" class="t-small t-dim">${L('A는 n 프레임 뒤 (1-k)ⁿ만 남음. FPS가 높을수록 빨리 줄어듦', 'A keeps (1-k)ⁿ after n frames. Higher FPS shrinks faster')}</text>
  </svg>`;
  },
  look: [
    'A의 레인을 비교하면 144fps 레인(맨 아래)이 가장 먼저 도착하고 10fps 레인이 한참 늦음. B는 다섯 레인이 같은 시각에 도착(도착 시간 편차 통계).',
    'A를 "k*dt*60 선형 보정"으로 바꾸면 차이가 줄지만 10fps 레인은 여전히 다름. k를 0.3 이상으로 올리면 10fps 레인이 목표를 지나쳐 출렁임.',
    '지터를 올려도 B의 곡선은 겹침. 각 프레임이 실제 dt만큼 정확히 감쇠하기 때문.',
    'Unity에서 Vector3.Lerp(a, b, k)를 Update에서 쓰는 코드가 이 문제를 가짐. Time.deltaTime을 지수에 넣어야 해결됨.',
  ],
  refs: [
    { type: 'article', title: 'Frame Rate Independent Damping using Lerp (Rory Driscoll)', year: 2016, note: '1 - (1-k)^dt 유도' },
    { type: 'article', title: "Spring-It-On: The Game Developer's Spring-Roll-Call (Daniel Holden)", url: 'https://theorangeduck.com/page/spring-roll-call', year: 2021, note: '"damper" 절. 지수 감쇠와 half-life 파라미터화.' },
    { type: 'engine', title: 'Unity - Mathf.Lerp / Time.deltaTime', url: 'https://docs.unity3d.com/ScriptReference/Mathf.Lerp.html' },
    { type: 'article', title: 'Game Programming Patterns - Game Loop', url: 'https://gameprogrammingpatterns.com/game-loop.html', year: 2014, note: '가변 dt 루프에서 dt를 곱해야 하는 이유' },
  ],
  params: [
    { key: 'method', label: '감쇠 방식', type: 'select', group: '감쇠', options: [
      { value: 'lerp', label: 'lerp(x, t, k), 프레임당' },
      { value: 'lerpdt', label: 'lerp(x, t, k*dt*60), 선형 보정' },
      { value: 'damp', label: 'lerp(x, t, 1 - e^(-λ*dt)), 정확' },
    ], a: 'lerp', b: 'damp' },
    { key: 'k', label: 'k (60fps 기준 프레임당 비율)', type: 'range', min: 0.01, max: 0.5, step: 0.01, default: 0.1, help: 'damp의 λ = -ln(1-k)*60' },
    { key: 'jitter', label: '프레임 지터', type: 'range', min: 0, max: 0.8, step: 0.01, default: 0.3, shared: true, group: '프레임 시뮬레이션' },
  ],
  en: {
    title: 'Frame-Rate Independent Damping (lerp vs damp)',
    summary: 'If you run x = lerp(x, target, k) every frame, a higher FPS follows faster. Changing it to k*dt is still not exact. With 1 - e^(-λ*dt), every FPS gives the same curve.',
    views: { a: 'lerp(x, t, k)', b: 'damp: 1 - e^(-λ*dt)' },
    controls: 'No input. The target switches left and right every 3 seconds.',
    info: `
    <p><b>Frame-rate independent damping</b> makes a value approach its target at the same speed at any FPS.</p>
    <p>If each frame moves <code>k</code> of the remaining distance, the distance left after n frames is <code>(1-k)ⁿ</code>. The number of frames in one second, n, is the FPS.
    So <b>144 fps converges 14 times faster than 10 fps</b>. This is a classic bug where game speed depends on device performance.</p>
    <p>The common fix, <code>lerp(x, t, k*dt*60)</code>, is only a first order approximation. Two problems remain.</p>
    <ul>
      <li>Results still differ at low FPS.</li>
      <li>If <code>k*dt*60 &gt; 1</code>, it overshoots the target.</li>
    </ul>
    <p>The right answer is the exact solution of continuous exponential decay, <code>dx/dt = -λ(x - t)</code>.</p>
    <p><code>x = lerp(x, t, 1 - exp(-λ*dt))</code> (= <code>1 - (1-k)^(dt*60)</code>, which feels the same as the old k at 60 fps)</p>
    <p>Downside: it adds one more <code>exp</code> call. You must convert old k values to λ.</p>
    <p>The 5 lanes in each view <b>simulate</b> different host frame rates. Both views get the same frame timing from the same seed.</p>`,
    look: [
      'Compare the lanes in A. The 144 fps lane (bottom) arrives first, and the 10 fps lane is far behind. In B, all five lanes arrive at the same time (see the arrival time spread stat).',
      'Switch A to "k*dt*60 linear fix". The gap shrinks, but the 10 fps lane still differs. Raise k to 0.3 or more, and the 10 fps lane overshoots the target and wobbles.',
      'Raise jitter. B\'s curves still overlap, because each frame decays by exactly its real dt.',
      'Unity code that calls Vector3.Lerp(a, b, k) in Update has this problem. Put Time.deltaTime into the exponent to fix it.',
    ],
    refs: [
      'Derives 1 - (1-k)^dt.',
      'The "damper" section. Exponential decay and a half-life parameter.',
      null,
      'Why you must multiply by dt in a variable dt loop.',
    ],
    params: {
      method: { label: 'Damping method', group: 'Damping', options: { lerp: 'lerp(x, t, k), per frame', lerpdt: 'lerp(x, t, k*dt*60), linear fix', damp: 'lerp(x, t, 1 - e^(-λ*dt)), exact' } },
      k: { label: 'k (per frame ratio at 60 fps)', help: 'damp uses λ = -ln(1-k)*60' },
      jitter: { label: 'Frame jitter', group: 'Frame simulation' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const FPS = [10, 20, 30, 60, 144];
    const L = 60, R = 540, PERIOD = 3;
    const HIST = 200;
    const lanes = FPS.map((fps, i) => ({ fps, x: L, acc: 0, next: 1 / fps, frames: 0, settle: null, hist: [], col: C.series[i % C.series.length] }));
    let t = 0, target = R, switchT = 0, phase = 0;

    function apply(x, tgt, dt) {
      const k = P.k;
      if (P.method === 'lerp') return U.lerp(x, tgt, k);
      if (P.method === 'lerpdt') return U.lerp(x, tgt, k * dt * 60);
      const lambda = -Math.log(1 - k) * 60;
      return U.lerp(x, tgt, 1 - Math.exp(-lambda * dt));
    }

    return {
      update(dt) {
        t += dt;
        const ph = Math.floor(t / PERIOD);
        if (ph !== phase) { phase = ph; target = ph % 2 ? L : R; switchT = ph * PERIOD; for (const ln of lanes) ln.settle = null; }
        for (const ln of lanes) {
          ln.acc += dt;
          // 시뮬레이션된 호스트 프레임: 이번 실제 프레임 안에 여러 번 들어갈 수 있음
          let guard = 0;
          while (ln.acc >= ln.next && guard++ < 32) {
            const fdt = ln.next;
            ln.acc -= fdt;
            ln.next = (1 / ln.fps) * (1 + (ctx.random() * 2 - 1) * P.jitter);
            ln.x = apply(ln.x, target, fdt);
            ln.frames++;
            if (ln.settle === null && Math.abs(ln.x - target) < (R - L) * 0.01) ln.settle = t - ln.acc - switchT;
          }
          ln.hist.push(ln.x);
          if (ln.hist.length > HIST) ln.hist.shift();
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const laneH = Math.min(44, (H * 0.55) / lanes.length);
        const sx = (W - 40) / (R - L + 60), ox = 20 - (L - 30) * sx;
        const X = (v) => ox + v * sx;
        D.grid(g, W, H, 40);
        // 목표선
        D.line(g, X(target), 6, X(target), 6 + laneH * lanes.length, C.good, 2);
        lanes.forEach((ln, i) => {
          const y = 6 + i * laneH;
          D.rect(g, X(L), y + laneH / 2 - 1, X(R) - X(L), 2, 'rgba(255,255,255,0.08)');
          D.rect(g, X(ln.x) - 9, y + laneH / 2 - 9, 18, 18, ln.col);
          D.text(g, `${ln.fps}fps`, 6, y + laneH / 2 - 7, { size: 11, color: ln.col });
          const st = ln.settle;
          D.text(g, st === null ? GTL.L(`남은 거리 ${((Math.abs(ln.x - target) / (R - L)) * 100).toFixed(0)}%`, `Remaining ${((Math.abs(ln.x - target) / (R - L)) * 100).toFixed(0)}%`) : GTL.L(`도착 ${(st * 1000).toFixed(0)}ms`, `Arrived ${(st * 1000).toFixed(0)}ms`), W - 8, y + laneH / 2 - 7, { size: 11, color: C.text, align: 'right' });
        });
        // x(t) 그래프: 레인 겹쳐 그리기
        const gy = 14 + laneH * lanes.length, gh = H - gy - 8;
        if (gh > 30) {
          D.rect(g, 10, gy, W - 20, gh, 'rgba(0,0,0,0.35)');
          lanes.forEach((ln) => D.plot(g, ln.hist.length > 1 ? ln.hist : [L, L], 10, gy, W - 20, gh, { min: L - 20, max: R + 20, color: ln.col, background: false, lineWidth: 1.5 }));
          D.text(g, GTL.L('레인별 위치 x(t) (겹칠수록 프레임레이트 독립)', 'Position x(t) per lane (more overlap = more frame-rate independent)'), 14, gy + 3, { size: 10, color: C.dim });
        }
        const done = lanes.filter((l) => l.settle !== null).map((l) => l.settle);
        ctx.stat(GTL.L('1% 도착 시간 편차 (최대-최소)', '1% arrival time spread (max-min)'), done.length === lanes.length ? ((Math.max(...done) - Math.min(...done)) * 1000).toFixed(0) + ' ms'
          : t - switchT > 1.5 ? GTL.L(`${lanes.length - done.length}개 레인 미도착`, `${lanes.length - done.length} lanes not arrived`) : GTL.L('측정 중', 'Measuring'));
        if (P.method === 'damp') ctx.stat('λ', (-Math.log(1 - P.k) * 60).toFixed(2) + ' /s');
        else ctx.stat('λ', '-');
        ctx.stat(GTL.L('10fps 레인 / 144fps 레인 위치', '10 fps lane / 144 fps lane position'), lanes[0].x.toFixed(0) + ' / ' + lanes[4].x.toFixed(0));
      },
    };
  },
});
