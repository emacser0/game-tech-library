// 등속 이동: 곡선 매개변수 t를 시간에 비례해 올리면 속도가 들쭉날쭉함 → 호 길이(arc-length) 재매개화
GTL.register({
  id: 'arc-length',
  title: '등속 이동: 호 길이 재매개화',
  summary: 'Bézier 곡선의 t를 일정하게 늘려도 화면 속도는 일정하지 않음. 누적 길이 테이블(LUT)로 거리를 t로 바꾸면 곡선 위를 일정한 속도로 움직임.',
  views: { a: 't 선형 증가', b: '호 길이 LUT' },
  controls: '드래그: Bézier 제어점 이동',
  info: `
    <p>매개 곡선 <code>B(t)</code>의 <code>t</code>는 길이가 아닌 매개변수. 제어점이 한쪽에 몰리면 그쪽은 <code>|B'(t)|</code>가 작아져 <b>느려짐</b>. 먼 쪽은 <b>빨라짐</b>.</p>
    <p>레일 위 카메라, 탄환 궤적, 기차, 컨베이어처럼 일정한 속도가 필요한 곳에서 문제가 됨.</p>
    <p>해결 방법(호 길이 재매개화):</p>
    <ul>
      <li>곡선을 N개로 샘플링해 <b>누적 길이 테이블</b> <code>L[i] = s(t<sub>i</sub>)</code>를 만듦.</li>
      <li>이동 거리 <code>d = speed * time</code>을 구함.</li>
      <li>이진 탐색으로 <code>L[i] ≤ d &lt; L[i+1]</code>인 구간을 찾음.</li>
      <li>구간 안에서 선형 보간해 <code>t</code>를 얻음.</li>
    </ul>
    <p>단점: LUT가 거칠면 구간 안에서 속도 오차가 조금 남음. 더 정밀하게 하려면 Gauss-Legendre 적분과 Newton 반복을 씀.</p>
    <p>흰 점열은 <b>같은 시간 간격</b>마다 오브젝트가 있던 위치. 간격이 일정하면 등속.</p>`,
  diagram: (L) => {
    // s(t): 누적 길이 (출발과 끝이 느린 곡선 가정)
    const s = (t) => t * t * (3 - 2 * t), inv = (c) => 0.5 - Math.sin(Math.asin(1 - 2 * c) / 3);
    const graph = (x0, cls, title, mode) => {
      const X = (t) => x0 + 190 * t, Y = (v) => 145 - 105 * v;
      const curve = Array.from({ length: 31 }, (_, i) => `${X(i / 30).toFixed(1)},${Y(s(i / 30)).toFixed(1)}`).join(' L');
      const steps = [0.25, 0.5, 0.75].map((k) => {
        const t = mode === 't' ? k : inv(k), v = s(t);
        return `<path d="M${X(t).toFixed(1)},145 L${X(t).toFixed(1)},${Y(v).toFixed(1)} L${x0},${Y(v).toFixed(1)}" class="d-dim" stroke-dasharray="3 3"/>`
          + `<circle cx="${X(t).toFixed(1)}" cy="145" r="3.5" class="${mode === 't' ? 'f-' + cls : 'f-dim'}"/><circle cx="${x0}" cy="${Y(v).toFixed(1)}" r="3.5" class="${mode === 't' ? 'f-dim' : 'f-' + cls}"/>`;
      }).join('');
      return `<line x1="${x0}" y1="145" x2="${x0 + 196}" y2="145" class="d-line"/><line x1="${x0}" y1="145" x2="${x0}" y2="34" class="d-line"/>
        <path d="M${curve}" class="d-${cls}"/>${steps}
        <text x="${x0 + 196}" y="160" text-anchor="end" class="t-small t-mono">t</text>
        <text x="${x0 - 6}" y="40" text-anchor="end" class="t-small t-mono">s</text>
        <text x="${x0 - 30}" y="20" class="t-${cls}">${title}</text>`;
    };
    return `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    ${graph(50, 'a', L('A: t를 같은 간격으로 증가', 'A: equal steps in t'), 't')}
    ${graph(320, 'b', L('B: 거리를 같은 간격으로 증가', 'B: equal steps in distance'), 's')}
    <text x="20" y="174" class="t-small t-a">${L('거리 s 간격이 들쭉날쭉: 속도 변화', 'Uneven gaps in distance s: speed changes')}</text>
    <text x="290" y="174" class="t-small t-b">${L('LUT로 s에서 t를 거꾸로 찾음: 등속', 'The LUT maps s back to t: constant speed')}</text>
    <text x="4" y="192" class="t-small t-dim">${L('s(t)는 누적 길이 표 L[i]. 이진 탐색으로 구간을 찾고 구간 안에서 선형 보간', 's(t) is the cumulative length table L[i]. Binary search finds the segment, then lerp inside it')}</text>
  </svg>`;
  },
  look: [
    'A의 흰 점열을 보면 제어점이 몰린 시작 부분은 촘촘하고 중간은 넓음. B는 모든 구간의 간격이 같음.',
    '아래 속도 그래프를 보면 A는 목표 속도(1.0)의 몇 배까지 출렁이고 B는 평평함.',
    'B에서 LUT 샘플 수를 3~5로 줄이면 구간마다 속도가 계단처럼 변함. 샘플 수와 정확도는 서로 맞바꾸는 관계.',
    '제어점 P1을 P0 위에 겹치면 A는 출발 직후 거의 멈춤.',
  ],
  refs: [
    { type: 'paper', title: 'Computing the Arc Length of Parametric Curves (Guenter & Parent)', year: 1990, note: 'IEEE Computer Graphics and Applications 10(3). 적응적 적분과 테이블로 호 길이 매개화.' },
    { type: 'talk', title: 'The Beauty of Bézier Curves (Freya Holmér)', year: 2021, note: 'YouTube. 후반부에 LUT를 이용한 등속 이동 설명.' },
    { type: 'book', title: 'Computer Animation: Algorithms and Techniques (Rick Parent)', note: '보간 기반 애니메이션 장에서 호 길이 매개화와 속도 곡선(ease) 제어를 다룸.' },
    { type: 'engine', title: 'Unity Splines - SplineUtility.GetPointAtLinearDistance', url: 'https://docs.unity3d.com/Packages/com.unity.splines@latest', note: '엔진 스플라인 API의 거리 기반 평가.' },
  ],
  params: [
    { key: 'method', label: '진행 방식', type: 'select', group: '매개화', options: [
      { value: 'param', label: 't를 시간에 비례' },
      { value: 'arclen', label: '호 길이 LUT (거리 → t)' },
    ], a: 'param', b: 'arclen' },
    { key: 'lut', label: 'LUT 샘플 수', type: 'int', min: 2, max: 200, default: 64, when: (p) => p.method === 'arclen' },
    { key: 'speed', label: '목표 속도 (px/s)', type: 'range', min: 40, max: 800, step: 10, default: 220, shared: true, group: '장면' },
    { key: 'ticks', label: '시간 간격 점 개수', type: 'int', min: 5, max: 60, default: 24, shared: true },
    { key: 'showLut', label: 'LUT 샘플 위치 표시', type: 'bool', default: false },
  ],
  en: {
    title: 'Constant Speed: Arc-Length Reparameterization',
    summary: 'Raising a Bézier curve\'s t at a steady rate does not give a steady speed on screen. Convert distance to t with a cumulative length table (LUT), and the object moves along the curve at a constant speed.',
    views: { a: 't grows linearly', b: 'Arc-length LUT' },
    controls: 'Drag: move the Bézier control points',
    info: `
    <p>The <code>t</code> of a parametric curve <code>B(t)</code> is a parameter, not a length. Where control points bunch up, <code>|B'(t)|</code> gets small and the object <b>slows down</b>. Where they are far apart, it <b>speeds up</b>.</p>
    <p>This is a problem wherever you need steady speed: rail cameras, bullet paths, trains, and conveyors.</p>
    <p>The fix (arc-length reparameterization):</p>
    <ul>
      <li>Sample the curve at N points and build a <b>cumulative length table</b> <code>L[i] = s(t<sub>i</sub>)</code>.</li>
      <li>Find the travel distance <code>d = speed * time</code>.</li>
      <li>Use binary search to find the segment where <code>L[i] ≤ d &lt; L[i+1]</code>.</li>
      <li>Interpolate linearly inside the segment to get <code>t</code>.</li>
    </ul>
    <p>Downside: a coarse LUT leaves a small speed error inside each segment. For more precision, use Gauss-Legendre integration and Newton iteration.</p>
    <p>The white dots are where the object was at <b>equal time steps</b>. Even spacing means constant speed.</p>`,
    look: [
      'Look at A\'s white dots. They are dense at the start, where the control points bunch up, and wide in the middle. In B, every gap is the same.',
      'Look at the speed graph below. A swings to several times the target speed (1.0). B stays flat.',
      'In B, lower the LUT sample count to 3~5. The speed changes in steps from segment to segment. Sample count trades off against accuracy.',
      'Put control point P1 on top of P0. A almost stops right after it starts.',
    ],
    refs: [
      'IEEE Computer Graphics and Applications 10(3). Arc-length parameterization with adaptive integration and tables.',
      'YouTube. The second half explains constant speed motion with a LUT.',
      'The chapter on interpolation-based animation covers arc-length parameterization and speed curve (ease) control.',
      'Distance-based evaluation in an engine spline API.',
    ],
    params: {
      method: { label: 'Progress method', group: 'Parameterization', options: { param: 't proportional to time', arclen: 'Arc-length LUT (distance to t)' } },
      lut: 'LUT sample count',
      speed: { label: 'Target speed (px/s)', group: 'Scene' },
      ticks: 'Time step dot count',
      showLut: 'Show LUT sample points',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params, V = U.v2;
    let pts = [[0.06, 0.85], [0.1, 0.78], [0.55, -0.15], [0.95, 0.75]].map(([x, y]) => ({ x, y }));
    let drag = -1, dist = 0;
    const area = () => ({ x: 40, y: 40, w: ctx.width - 80, h: ctx.height - 170 });
    const toS = (p) => { const a = area(); return { x: a.x + p.x * a.w, y: a.y + p.y * a.h }; };
    const toN = (x, y) => { const a = area(); return { x: U.clamp((x - a.x) / a.w, -0.05, 1.05), y: U.clamp((y - a.y) / a.h, -0.3, 1.1) }; };
    const bez = (S, t) => {
      const u = 1 - t;
      return {
        x: u * u * u * S[0].x + 3 * u * u * t * S[1].x + 3 * u * t * t * S[2].x + t * t * t * S[3].x,
        y: u * u * u * S[0].y + 3 * u * u * t * S[1].y + 3 * u * t * t * S[2].y + t * t * t * S[3].y,
      };
    };
    function buildLut(S, n) {
      const L = [0];
      let prev = bez(S, 0);
      for (let i = 1; i <= n; i++) { const p = bez(S, i / n); L.push(L[i - 1] + V.dist(prev, p)); prev = p; }
      return L;
    }
    function tForDist(L, d) {
      const n = L.length - 1;
      if (d <= 0) return 0;
      if (d >= L[n]) return 1;
      let lo = 0, hi = n;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (L[mid] <= d) lo = mid; else hi = mid; }
      return (lo + (d - L[lo]) / (L[hi] - L[lo] || 1)) / n;
    }
    // 진행률 s(0..1, 시간 기준) → t
    function tAt(S, s, L, len) { return P.method === 'param' ? s : tForDist(L, s * len); }

    return {
      update(dt) { dist += P.speed * dt; },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        D.grid(g, W, H, 40);
        const S = pts.map(toS);
        const len = buildLut(S, 1000)[1000];                 // 기준 길이
        const L = buildLut(S, P.method === 'arclen' ? P.lut : 1000);
        g.setLineDash([4, 5]); D.poly(g, S, null, 'rgba(255,255,255,0.2)', 1, false); g.setLineDash([]);
        g.beginPath();
        for (let i = 0; i <= 120; i++) { const p = bez(S, i / 120); i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); }
        g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 6; g.stroke();
        if (P.method === 'arclen' && P.showLut) {
          for (let i = 0; i <= P.lut; i++) { const p = bez(S, i / P.lut); D.circle(g, p.x, p.y, 4, null, C.warn, 1.5); }
        }
        // 같은 시간 간격 점열
        for (let i = 0; i <= P.ticks; i++) {
          const p = bez(S, tAt(S, i / P.ticks, L, len));
          D.circle(g, p.x, p.y, 3.5, '#fff');
        }
        S.forEach((p, i) => {
          D.circle(g, p.x, p.y, i === drag ? 9 : 7, i === 0 || i === 3 ? '#20242c' : 'rgba(0,0,0,0.4)', i === 0 || i === 3 ? '#fff' : C.dim, 2);
          D.text(g, 'P' + i, p.x + 9, p.y - 16, { size: 10, color: C.dim });
        });
        // 이동 오브젝트
        const s = (dist % len) / len;
        const t = tAt(S, s, L, len);
        const p = bez(S, t);
        D.circle(g, p.x, p.y, 11, col, '#000', 1.5);

        // 속도 그래프 (목표 속도 대비)
        const N = 150, sp = [], ds = 1 / N;
        let vmin = Infinity, vmax = 0;
        for (let i = 0; i < N; i++) {
          const a = bez(S, tAt(S, i * ds, L, len)), b = bez(S, tAt(S, (i + 1) * ds, L, len));
          const r = V.dist(a, b) / (len * ds);
          sp.push(r); vmin = Math.min(vmin, r); vmax = Math.max(vmax, r);
        }
        const gx = 40, gy = H - 110, gw = W - 80, gh = 80, top = Math.max(2, Math.ceil(vmax));
        D.plot(g, sp, gx, gy, gw, gh, { min: 0, max: top, color: col, label: GTL.L(`속도 / 목표 속도  (0 ~ ${top})`, `Speed / target speed  (0 ~ ${top})`) });
        const y1 = gy + gh - gh / top;
        g.setLineDash([4, 4]); D.line(g, gx, y1, gx + gw, y1, C.good, 1); g.setLineDash([]);
        D.text(g, '1.0', gx + gw + 4, y1 - 6, { size: 10, color: C.good });
        D.line(g, gx + s * gw, gy, gx + s * gw, gy + gh, 'rgba(255,255,255,0.5)', 1);

        ctx.stat(GTL.L('곡선 길이', 'Curve length'), len.toFixed(0) + ' px');
        ctx.stat(GTL.L('속도 최소 / 최대 (×목표)', 'Speed min / max (× target)'), `${vmin.toFixed(2)} / ${vmax.toFixed(2)}`);
        ctx.stat(GTL.L('현재 t', 'Current t'), t.toFixed(3) + GTL.L('  (시간 진행률 ', '  (time progress ') + s.toFixed(3) + ')');
      },
      onPointer(type, m) {
        if (type === 'down') {
          let best = -1, bd = 18;
          pts.forEach((p, i) => { const s = toS(p), d = Math.hypot(s.x - m.x, s.y - m.y); if (d < bd) { bd = d; best = i; } });
          drag = best;
        } else if (type === 'move' && drag >= 0 && m.down) pts[drag] = toN(m.x, m.y);
        else if (type === 'up' || type === 'leave') drag = -1;
      },
    };
  },
});
