// 스플라인 비교: Catmull-Rom (uniform / centripetal / chordal), Bézier, B-spline, 선형
GTL.register({
  id: 'spline-curves',
  title: '스플라인: Catmull-Rom α, Bézier, B-spline',
  summary: '제어점이 같아도 곡선 종류와 매개화에 따라 모양이 크게 달라짐. Uniform Catmull-Rom은 점이 몰린 곳에 고리(loop)와 첨점(cusp, 뾰족한 꺾임)이 생김. Centripetal(α=0.5)은 이를 없앰.',
  views: { a: 'Catmull-Rom uniform (α=0)', b: 'Catmull-Rom centripetal (α=0.5)' },
  controls: '드래그: 제어점 이동. "무작위 배치" 버튼: 점 다시 배치',
  info: `
    <p><b>Catmull-Rom</b>은 모든 제어점을 <b>통과하는</b> 보간 스플라인. 그래서 카메라 경로와 웨이포인트 이동에 많이 씀.</p>
    <p>각 구간은 앞뒤 네 점으로 만듦. 노트(knot, 구간 경계의 매개변수 값) 간격은 <code>t<sub>i+1</sub> = t<sub>i</sub> + |P<sub>i+1</sub> − P<sub>i</sub>|<sup>α</sup></code>로 정함.</p>
    <ul>
      <li><b>α = 0 (uniform)</b>: 점 간격을 무시함. 가까운 점과 먼 점이 섞이면 <b>고리, 첨점, 과도한 overshoot</b>가 생김.</li>
      <li><b>α = 0.5 (centripetal)</b>: 구간 내부에 고리와 첨점이 생기지 않음(Yuksel 외, 2011 증명). 제어점에 더 붙어 감.</li>
      <li><b>α = 1 (chordal)</b>: 더 둥글고 크게 돎.</li>
    </ul>
    <p><b>Bézier</b>(전체 점을 하나의 제어 다각형으로 씀)와 <b>균일 3차 B-spline</b>은 <b>근사</b> 곡선. 점을 통과하지 않지만 더 매끄러움(B-spline은 C² 연속).</p>
    <p>흰 점은 각 구간에서 같은 <code>t</code> 간격으로 찍은 위치. 간격이 고르지 않음("등속 이동" 샘플 참고).</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
    <path d="M20,165 L110,70 L140,76 L240,165" class="d-dim" stroke-dasharray="3 4"/>
    <path d="M20,165 C50,120 80,80 110,70 M140,76 C175,95 215,125 240,165" class="d-dim"/>
    <path d="M110,70 C175,20 75,20 140,76" class="d-a"/>
    <path d="M110,70 C120,66 130,70 140,76" class="d-b"/>
    ${[[20, 165], [110, 70], [140, 76], [240, 165]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="4" class="f-dim"/><text x="${x + (i === 1 ? -22 : i === 2 ? 8 : 8)}" y="${y + (i === 0 || i === 3 ? 4 : 18)}" class="t-small t-mono">P${i}</text>`).join('')}
    <text x="152" y="34" class="t-small t-a">${L('A: 고리', 'A: loop')}</text>
    <text x="150" y="102" class="t-small t-b">${L('B: 고리 없음', 'B: no loop')}</text>
    <text x="290" y="24">${L('노트 간격 (매개변수 t)', 'Knot spacing (parameter t)')}</text>
    <line x1="290" y1="60" x2="520" y2="60" class="d-dim"/>
    <line x1="366.7" y1="60" x2="443.3" y2="60" class="d-a" stroke-width="5"/>
    ${[290, 366.7, 443.3, 520].map((x) => `<line x1="${x}" y1="53" x2="${x}" y2="67" class="d-line"/>`).join('')}
    <text x="405" y="48" text-anchor="middle" class="t-small t-mono">P1~P2</text>
    <text x="290" y="84" class="t-small t-a">${L('A: α=0, 모든 구간이 같은 폭', 'A: α=0, every segment has the same width')}</text>
    <line x1="290" y1="120" x2="520" y2="120" class="d-dim"/>
    <line x1="382.5" y1="120" x2="426.6" y2="120" class="d-b" stroke-width="5"/>
    ${[290, 382.5, 426.6, 520].map((x) => `<line x1="${x}" y1="113" x2="${x}" y2="127" class="d-line"/>`).join('')}
    <text x="404.5" y="108" text-anchor="middle" class="t-small t-mono">P1~P2</text>
    <text x="290" y="144" class="t-small t-b">${L('B: α=0.5, 폭 = 점 거리^0.5', 'B: α=0.5, width = point distance^0.5')}</text>
    <text x="4" y="194" class="t-small t-dim">${L('짧은 구간에 긴 t 폭을 주면 접선이 구간보다 길어져 곡선이 고리를 그림', 'A short segment with a wide t range gets tangents longer than itself, so the curve loops')}</text>
  </svg>`,
  look: [
    '기본 배치에서 왼쪽 위의 가까운 두 점 근처를 보면 A는 작은 고리나 뾰족한 꺾임이 생기고 B는 매끈하게 지나감.',
    '점 하나를 다른 점 바로 옆으로 끌면 uniform은 크게 튀어나가고 centripetal은 차분함.',
    'α를 1(chordal)까지 올리면 곡선이 더 넓게 돎.',
    '곡선 종류를 B-spline으로 바꾸면 점을 통과하지 않지만 가장 매끄러운 곡선이 됨.',
    '"닫힌 곡선"을 켜면 레이싱 트랙이나 순찰 경로 같은 루프 경로가 됨.',
  ],
  refs: [
    { type: 'paper', title: 'Parameterization and Applications of Catmull-Rom Curves (Yuksel, Schaefer, Keyser)', year: 2011, note: 'Computer-Aided Design 43(7). centripetal(α=0.5)은 구간 안에 첨점(cusp)과 자기 교차가 없음을 증명.' },
    { type: 'paper', title: 'A Class of Local Interpolating Splines (Catmull & Rom)', year: 1974, note: 'Computer Aided Geometric Design (Academic Press).' },
    { type: 'article', title: 'Centripetal Catmull-Rom spline (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline', note: 'Barry-Goldman 피라미드 형식 수식.' },
    { type: 'talk', title: 'The Continuity of Splines (Freya Holmér)', year: 2022, note: 'YouTube. Bézier, Hermite, Catmull-Rom, B-spline 연속성 비교.' },
    { type: 'engine', title: 'Unity - Splines package', url: 'https://docs.unity3d.com/Packages/com.unity.splines@latest', note: 'Catmull-Rom, Bézier 노트 타입 지원.' },
  ],
  params: [
    { key: 'type', label: '곡선 종류', type: 'select', group: '곡선', options: [
      { value: 'catmull', label: 'Catmull-Rom' },
      { value: 'bezier', label: 'Bézier (전체 제어 다각형)' },
      { value: 'bspline', label: '균일 3차 B-spline' },
      { value: 'linear', label: '선형 (꺾은선)' },
    ], default: 'catmull' },
    { key: 'alpha', label: 'α (매개화)', type: 'range', min: 0, max: 1, step: 0.05, a: 0, b: 0.5, when: (p) => p.type === 'catmull', help: '0: uniform, 0.5: centripetal, 1: chordal' },
    { key: 'closed', label: '닫힌 곡선', type: 'bool', default: false, shared: true },
    { key: 'showTicks', label: '같은 t 간격 점', type: 'bool', default: true },
    { key: 'showPoly', label: '제어 다각형', type: 'bool', default: true },
    { key: 'speed', label: '이동 속도 (구간/초)', type: 'range', min: 0, max: 3, step: 0.05, default: 0.6, shared: true },
    { key: 'randomize', label: '무작위 배치', type: 'button' },
  ],
  en: {
    title: 'Splines: Catmull-Rom α, Bézier, B-spline',
    summary: 'With the same control points, the curve type and parameterization change the shape a lot. Uniform Catmull-Rom forms loops and cusps (sharp kinks) where points bunch up. Centripetal (α=0.5) removes them.',
    controls: 'Drag: move a control point. "Randomize" button: place the points again',
    info: `
    <p><b>Catmull-Rom</b> is an interpolating spline that <b>passes through</b> every control point. That is why camera paths and waypoint movement use it a lot.</p>
    <p>Each segment is built from the four points around it. The knot spacing (the parameter value at segment boundaries) is set by <code>t<sub>i+1</sub> = t<sub>i</sub> + |P<sub>i+1</sub> − P<sub>i</sub>|<sup>α</sup></code>.</p>
    <ul>
      <li><b>α = 0 (uniform)</b>: ignores point spacing. When near and far points mix, you get <b>loops, cusps, and too much overshoot</b>.</li>
      <li><b>α = 0.5 (centripetal)</b>: no loops or cusps inside a segment (proved by Yuksel et al., 2011). It hugs the control points more closely.</li>
      <li><b>α = 1 (chordal)</b>: rounder, with wider turns.</li>
    </ul>
    <p><b>Bézier</b> (uses all points as one control polygon) and <b>uniform cubic B-spline</b> are <b>approximating</b> curves. They do not pass through the points, but they are smoother (B-spline is C² continuous).</p>
    <p>The white dots are positions at equal <code>t</code> steps in each segment. The spacing is not even (see the "Constant Speed" sample).</p>`,
    look: [
      'In the default layout, look near the two close points at the upper left. A forms a small loop or a sharp kink. B passes through smoothly.',
      'Drag one point right next to another. Uniform shoots far out, while centripetal stays calm.',
      'Raise α to 1 (chordal). The curve takes wider turns.',
      'Change the curve type to B-spline. It does not pass through the points, but it gives the smoothest curve.',
      'Turn on "Closed curve". It becomes a loop path, like a race track or a patrol route.',
    ],
    refs: [
      'Computer-Aided Design 43(7). Proves that centripetal (α=0.5) has no cusps or self-intersections inside a segment.',
      'Computer Aided Geometric Design (Academic Press).',
      'Formulas in the Barry-Goldman pyramid form.',
      'YouTube. Compares the continuity of Bézier, Hermite, Catmull-Rom, and B-spline.',
      'Supports Catmull-Rom and Bézier knot types.',
    ],
    params: {
      type: { label: 'Curve type', group: 'Curve', options: { bezier: 'Bézier (whole control polygon)', bspline: 'Uniform cubic B-spline', linear: 'Linear (polyline)' } },
      alpha: 'α (parameterization)',
      closed: 'Closed curve',
      showTicks: 'Equal t step dots',
      showPoly: 'Control polygon',
      speed: 'Move speed (segments/s)',
      randomize: 'Randomize',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params, V = U.v2;
    let pts = [[0.08, 0.78], [0.22, 0.22], [0.27, 0.25], [0.5, 0.8], [0.72, 0.18], [0.93, 0.62]].map(([x, y]) => ({ x, y }));
    let drag = -1, clock = 0;
    const toScreen = (p) => ({ x: 30 + p.x * (ctx.width - 60), y: 30 + p.y * (ctx.height - 80) });
    const toNorm = (x, y) => ({ x: U.clamp((x - 30) / (ctx.width - 60), 0, 1), y: U.clamp((y - 30) / (ctx.height - 80), 0, 1) });

    // Barry-Goldman 피라미드 형식 (비균일 Catmull-Rom)
    function catmull(p0, p1, p2, p3, alpha, u) {
      const kt = (a, b) => Math.max(1e-4, Math.pow(V.dist(a, b), alpha));
      const t0 = 0, t1 = t0 + kt(p0, p1), t2 = t1 + kt(p1, p2), t3 = t2 + kt(p2, p3);
      const t = U.lerp(t1, t2, u);
      const mix = (a, b, ta, tb) => V.lerp(a, b, (t - ta) / (tb - ta));
      const A1 = mix(p0, p1, t0, t1), A2 = mix(p1, p2, t1, t2), A3 = mix(p2, p3, t2, t3);
      const B1 = mix(A1, A2, t0, t2), B2 = mix(A2, A3, t1, t3);
      return mix(B1, B2, t1, t2);
    }
    function bspline(p0, p1, p2, p3, u) {
      const u2 = u * u, u3 = u2 * u;
      const b0 = (1 - u) ** 3 / 6, b1 = (3 * u3 - 6 * u2 + 4) / 6, b2 = (-3 * u3 + 3 * u2 + 3 * u + 1) / 6, b3 = u3 / 6;
      return { x: p0.x * b0 + p1.x * b1 + p2.x * b2 + p3.x * b3, y: p0.y * b0 + p1.y * b1 + p2.y * b2 + p3.y * b3 };
    }
    function casteljau(ps, u) {
      let a = ps.slice();
      while (a.length > 1) { const b = []; for (let i = 0; i < a.length - 1; i++) b.push(V.lerp(a[i], a[i + 1], u)); a = b; }
      return a[0];
    }
    // 구간 함수 목록 [(u)=>point]
    function segments(S) {
      const n = S.length, closed = P.closed, type = P.type, segs = [];
      const at = (i) => (closed ? S[((i % n) + n) % n] : i < 0 ? V.sub(V.scale(S[0], 2), S[1]) : i >= n ? V.sub(V.scale(S[n - 1], 2), S[n - 2]) : S[i]);
      if (type === 'linear') {
        const m = closed ? n : n - 1;
        for (let i = 0; i < m; i++) { const a = S[i], b = S[(i + 1) % n]; segs.push((u) => V.lerp(a, b, u)); }
      } else if (type === 'catmull') {
        const m = closed ? n : n - 1;
        for (let i = 0; i < m; i++) {
          const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2), al = P.alpha;
          segs.push((u) => catmull(p0, p1, p2, p3, al, u));
        }
      } else if (type === 'bspline') {
        if (closed) for (let i = 0; i < n; i++) { const q = [at(i - 1), at(i), at(i + 1), at(i + 2)]; segs.push((u) => bspline(q[0], q[1], q[2], q[3], u)); }
        else {
          const E = [S[0], S[0], ...S, S[n - 1], S[n - 1]]; // 끝점 3번 반복 → 양 끝 통과
          for (let i = 0; i + 3 < E.length; i++) { const q = E.slice(i, i + 4); segs.push((u) => bspline(q[0], q[1], q[2], q[3], u)); }
        }
      } else {
        const ctrl = closed ? [...S, S[0]] : S;
        segs.push((u) => casteljau(ctrl, u));
      }
      return segs;
    }

    return {
      update(dt) { clock += dt * P.speed; },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        D.grid(g, W, H, 40);
        const S = pts.map(toScreen);
        if (P.showPoly) {
          g.setLineDash([4, 5]);
          D.poly(g, S, null, 'rgba(255,255,255,0.22)', 1, P.closed);
          g.setLineDash([]);
        }
        const segs = segments(S);
        const RES = P.type === 'bezier' ? 200 : 40;
        let len = 0, prev = null;
        g.beginPath();
        segs.forEach((f, si) => {
          for (let i = 0; i <= RES; i++) {
            if (si > 0 && i === 0) continue;
            const p = f(i / RES);
            if (prev) len += V.dist(prev, p);
            prev ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y);
            prev = p;
          }
        });
        g.strokeStyle = col; g.lineWidth = 3; g.stroke();
        if (P.showTicks) {
          const per = P.type === 'bezier' ? 8 * Math.max(1, S.length - 1) : 8;
          segs.forEach((f) => { for (let i = 0; i < per; i++) { const p = f(i / per); D.circle(g, p.x, p.y, 2.2, 'rgba(255,255,255,0.75)'); } });
        }
        // 제어점
        S.forEach((p, i) => {
          D.circle(g, p.x, p.y, i === drag ? 9 : 7, i === drag ? C.warn : '#20242c', '#fff', 2);
          D.text(g, String(i), p.x + 9, p.y - 16, { size: 10, color: C.dim });
        });
        // 이동 오브젝트 (구간당 같은 시간)
        if (segs.length) {
          const total = segs.length;
          const s = P.closed ? clock % total : (clock % (total * 2)) < total ? clock % total : total - (clock % total);
          const si = Math.min(total - 1, Math.floor(s)), u = s - si;
          const p = segs[si](Math.min(1, u)), q = segs[si](Math.min(1, u + 0.01));
          const ang = Math.atan2(q.y - p.y, q.x - p.x);
          g.save(); g.translate(p.x, p.y); g.rotate(ang);
          D.poly(g, [{ x: 12, y: 0 }, { x: -8, y: -7 }, { x: -8, y: 7 }], C.warn, '#000', 1);
          g.restore();
        }
        const name = P.type === 'catmull' ? `Catmull-Rom α=${P.alpha.toFixed(2)}` : P.type;
        D.text(g, name, 10, 8, { size: 12, color: col });
        ctx.stat(GTL.L('곡선 길이', 'Curve length'), len.toFixed(0) + ' px');
        ctx.stat(GTL.L('제어점 통과', 'Passes through points'), P.type === 'catmull' || P.type === 'linear' ? GTL.L('예 (보간)', 'Yes (interpolating)') : GTL.L('아니오 (근사)', 'No (approximating)'));
        ctx.stat(GTL.L('연속성', 'Continuity'), { catmull: 'C¹', bspline: 'C²', bezier: GTL.L('C∞ (단일 곡선)', 'C∞ (single curve)'), linear: 'C⁰' }[P.type]);
      },
      onPointer(type, m) {
        if (type === 'down') {
          let best = -1, bd = 18;
          pts.forEach((p, i) => { const s = toScreen(p), d = Math.hypot(s.x - m.x, s.y - m.y); if (d < bd) { bd = d; best = i; } });
          drag = best;
        } else if (type === 'move' && drag >= 0 && m.down) {
          pts[drag] = toNorm(m.x, m.y);
        } else if (type === 'up' || type === 'leave') drag = -1;
      },
      onAction(key) {
        if (key === 'randomize') {
          const n = pts.length;
          pts = Array.from({ length: n }, (_, i) => ({ x: U.clamp((i + 0.5) / n + ctx.rng.range(-0.12, 0.12), 0, 1), y: ctx.rng.range(0.05, 0.95) }));
        }
      },
    };
  },
});
