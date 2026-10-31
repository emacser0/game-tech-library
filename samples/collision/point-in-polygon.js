// 점-다각형 포함 판정: 교차 수(짝홀 규칙) vs 와인딩 넘버(0이 아닌 규칙)
GTL.register({
  id: 'point-in-polygon',
  title: '점-다각형 포함 판정: 교차 수 vs 와인딩 넘버',
  summary: '점에서 오른쪽으로 반직선을 쏘아 변과 만난 횟수가 홀수면 안쪽으로 봄(교차 수). 자기 교차 다각형에서는 겹친 영역이 바깥으로 판정됨. 와인딩 넘버는 다각형이 점을 감은 횟수를 세므로 겹친 영역도 안쪽으로 봄.',
  views: { a: '교차 수 (짝홀)', b: '와인딩 넘버' },
  controls: '마우스: 검사 점 이동 (반직선과 교차 지점, 판정값 표시)',
  info: `
    <p>점이 다각형 안에 있는지 묻는 문제. 클릭 판정, 영역 트리거, 내비게이션 영역 검사에 쓰임.</p>
    <p><b>교차 수</b>(crossing number, 짝홀 규칙):</p>
    <ul>
      <li>점에서 +x 방향으로 반직선을 쏨</li>
      <li>반직선이 변을 지난 횟수가 홀수면 안쪽</li>
      <li>자기 교차 다각형에서 두 번 감긴 영역은 짝수가 되어 바깥으로 판정됨</li>
    </ul>
    <p><b>와인딩 넘버</b>(winding number, 0이 아닌 규칙):</p>
    <ul>
      <li>위로 지나는 변은 +1, 아래로 지나는 변은 -1을 더함</li>
      <li>합이 0이 아니면 안쪽. 값은 다각형이 점을 몇 번 감았는지를 뜻함.</li>
      <li>비용은 교차 수와 같음. 변마다 덧셈 하나와 외적 하나.</li>
    </ul>
    <p><b>꼭짓점 처리</b>: 반직선이 꼭짓점을 정확히 지나면 두 변에서 모두 세어 판정이 뒤집힘.
    변의 y 구간을 반열린 구간 [y0, y1)으로 다루면 한 번만 셈. "단순 구현"은 닫힌 구간을 써서 이 문제가 생김.</p>`,
  diagram: (L) => {
    const V = [[0, -60], [35.3, 48.5], [-57.1, -18.5], [57.1, -18.5], [-35.3, 48.5]];
    const d = (cx, cy) => 'M' + V.map(([x, y]) => `${cx + x},${cy + y}`).join(' L') + ' Z';
    const star = (cx, cy, cls, rule) => `<path d="${d(cx, cy)}" class="${cls}" fill-opacity="0.35" fill-rule="${rule}"/><path d="${d(cx, cy)}" class="d-line"/>`;
    const ray = (cx, cy) => `<line x1="${cx}" y1="${cy}" x2="${cx + 110}" y2="${cy}" class="d-accent" marker-end="url(#arr)"/><circle cx="${cx}" cy="${cy}" r="3.5" class="f-accent"/><circle cx="${cx + 19.5}" cy="${cy}" r="3.5" class="d-line"/><circle cx="${cx + 31.6}" cy="${cy}" r="3.5" class="d-line"/>`;
    return `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    <marker id="arrb" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    ${star(110, 84, 'f-a', 'evenodd')}${ray(110, 84)}
    <text x="129.5" y="76" text-anchor="middle" class="t-small t-mono">1</text><text x="141.6" y="98" text-anchor="middle" class="t-small t-mono">2</text>
    ${star(370, 84, 'f-b', 'nonzero')}${ray(370, 84)}
    <path d="M380,54 L385,70" class="d-b" marker-end="url(#arrb)"/>
    <path d="M418,72 L409,79" class="d-b" marker-end="url(#arrb)"/>
    <text x="384" y="98" text-anchor="middle" class="t-small t-mono">+1</text><text x="404" y="98" text-anchor="middle" class="t-small t-mono">+1</text>
    <text x="110" y="156" text-anchor="middle" class="t-a">${L('A: 교차 2번, 짝수라 바깥', 'A: 2 crossings, even, so outside')}</text>
    <text x="110" y="171" text-anchor="middle" class="t-small t-dim">${L('두 번 감긴 가운데가 구멍이 됨', 'The center (wound twice) becomes a hole')}</text>
    <text x="370" y="156" text-anchor="middle" class="t-b">${L('B: 와인딩 +1 +1 = 2, 안쪽', 'B: winding +1 +1 = 2, inside')}</text>
    <text x="370" y="171" text-anchor="middle" class="t-small t-dim">${L('변 방향을 부호로 더해서 가운데도 안쪽', 'Signs follow edge direction, so the center is inside')}</text>
    <text x="270" y="190" text-anchor="middle" class="t-small t-dim">${L('두 변(파란 화살표)이 반직선을 같은 방향으로 지남', 'Both edges (blue arrows) cross the ray in the same direction')}</text>
  </svg>`;
  },
  look: [
    '기본 상태(오각별)에서 A는 별의 가운데 오각형이 비어 있음. B는 가운데까지 모두 안쪽으로 판정. 가운데는 두 번 감겨서 흰색으로 표시됨.',
    '마우스를 별 가운데에 두면 A는 교차 2회(짝수, 바깥), B는 와인딩 넘버 2 또는 -2(안쪽)를 표시',
    '모양을 "오목 다각형"으로 바꾸면 자기 교차가 없으므로 두 방식의 결과가 같아짐',
    '모양을 "오목 다각형"으로, A를 "단순 구현 (닫힌 구간)"으로 바꾸고 "꼭짓점을 표본 행에 맞춤"을 켜면 A의 꼭짓점 높이에 가로 줄무늬 오류가 생김',
    '모양을 "이중 고리"로 바꾸면 B의 흰색 영역(와인딩 2)이 보임. 두 번 감긴 곳.',
  ],
  refs: [
    { type: 'book', title: 'Real-Time Collision Detection, Testing Point in Polygon (Christer Ericson)', year: 2005 },
    { type: 'article', title: 'Inclusion of a Point in a Polygon (Dan Sunday)', note: 'softSurfer 기하 알고리즘 글. 반열린 구간 규칙과 외적 기반 와인딩 넘버 구현.' },
    { type: 'paper', title: 'The point in polygon problem for arbitrary polygons (Hormann & Agathos)', year: 2001, note: 'Computational Geometry 20(3). 교차 수와 와인딩 넘버의 관계, 경계 사례.' },
    { type: 'article', title: 'Point in Polygon Strategies (Eric Haines), Graphics Gems IV', year: 1994 },
  ],
  params: [
    { key: 'shape', label: '모양', type: 'select', group: '장면', options: [
      { value: 'star', label: '오각별 (자기 교차)' },
      { value: 'hepta', label: '칠각별 {7/3}' },
      { value: 'loops', label: '이중 고리' },
      { value: 'concave', label: '오목 다각형' },
    ], default: 'star', shared: true },
    { key: 'spin', label: '회전 속도', type: 'range', min: 0, max: 1, step: 0.05, default: 0.15, shared: true },
    { key: 'step', label: '표본 간격 (px)', type: 'int', min: 3, max: 16, default: 6, shared: true },
    { key: 'snap', label: '꼭짓점을 표본 행에 맞춤', type: 'bool', default: false, shared: true, help: '꼭짓점 y를 표본 점의 행 높이로 반올림. 꼭짓점 경계 사례를 일부러 만듦.' },
    { key: 'method', label: '판정 방식', type: 'select', group: '포함 판정', options: [
      { value: 'naive', label: '단순 구현 (닫힌 구간)' },
      { value: 'crossing', label: '교차 수 (짝홀)' },
      { value: 'winding', label: '와인딩 넘버 (0이 아님)' },
    ], a: 'crossing', b: 'winding', default: 'crossing' },
    { key: 'showEdges', label: '변 방향 표시', type: 'bool', default: true },
  ],
  en: {
    title: 'Point in Polygon: Crossing Number vs Winding Number',
    summary: 'Cast a ray to the right from the point. If it crosses edges an odd number of times, the point is inside (crossing number). In a self-intersecting polygon, overlapped areas count as outside. The winding number counts how many times the polygon winds around the point, so overlapped areas count as inside too.',
    views: { a: 'Crossing number (even-odd)', b: 'Winding number' },
    controls: 'Mouse: move the test point (shows the ray, the crossing points, and the result)',
    info: `
    <p>The question is whether a point is inside a polygon. It is used for click tests, area triggers, and navigation area checks.</p>
    <p><b>Crossing number</b> (even-odd rule):</p>
    <ul>
      <li>Cast a ray from the point in the +x direction.</li>
      <li>If the ray crosses edges an odd number of times, the point is inside.</li>
      <li>In a self-intersecting polygon, an area wound twice gives an even count and counts as outside.</li>
    </ul>
    <p><b>Winding number</b> (nonzero rule):</p>
    <ul>
      <li>Add +1 for an edge that crosses upward and -1 for an edge that crosses downward.</li>
      <li>If the sum is not 0, the point is inside. The value tells how many times the polygon winds around the point.</li>
      <li>The cost is the same as the crossing number: one addition and one cross product per edge.</li>
    </ul>
    <p><b>Vertex handling</b>: if the ray passes exactly through a vertex, both edges count it and the result flips.
    Treat each edge's y range as a half-open interval [y0, y1) and it counts only once. The "naive version" uses closed intervals, so it has this problem.</p>`,
    look: [
      'In the default state (pentagram), the center pentagon of the star is empty in A. B counts everything up to the center as inside. The center is wound twice, so it shows in white.',
      'Put the mouse in the center of the star. A shows 2 crossings (even, outside). B shows winding number 2 or -2 (inside).',
      'Switch the shape to "Concave polygon". It has no self-intersection, so both methods give the same result.',
      'Switch the shape to "Concave polygon", switch A to "Naive version (closed interval)", and turn on "Snap vertices to sample rows". Horizontal stripe errors appear in A at vertex heights.',
      'Switch the shape to "Double loop". You can see B\'s white area (winding 2). That is where it winds twice.',
    ],
    refs: [
      null,
      'A softSurfer article on geometry algorithms. Covers the half-open interval rule and a winding number built on cross products.',
      'Computational Geometry 20(3). The link between crossing number and winding number, and edge cases.',
      null,
    ],
    params: {
      shape: { label: 'Shape', group: 'Scene', options: { star: 'Pentagram (self-intersecting)', hepta: 'Heptagram {7/3}', loops: 'Double loop', concave: 'Concave polygon' } },
      spin: 'Rotation speed',
      step: 'Sample spacing (px)',
      snap: { label: 'Snap vertices to sample rows', help: 'Rounds vertex y to the row height of the sample points. This creates vertex edge cases on purpose' },
      method: { label: 'Test method', group: 'Containment test', options: { naive: 'Naive version (closed interval)', crossing: 'Crossing number (even-odd)', winding: 'Winding number (nonzero)' } },
      showEdges: 'Show edge directions',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    let ang = 0, poly = [];
    let st = { inside: 0, total: 0, ms: 0 };
    let field = null, fw = 0, fh = 0;

    function makePoly() {
      const W = ctx.width, H = ctx.height, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.42;
      const pts = [];
      if (P.shape === 'star' || P.shape === 'hepta') {
        const nV = P.shape === 'star' ? 5 : 7, k = P.shape === 'star' ? 2 : 3;
        for (let i = 0; i < nV; i++) { const a = ang - Math.PI / 2 + (i * k * U.TAU) / nV; pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
      } else if (P.shape === 'loops') {
        // 반지름이 각도에 따라 변하는 곡선을 두 바퀴 돎. 안쪽 영역은 두 번 감김
        const N = 48;
        for (let i = 0; i < N; i++) {
          const t = (i / N) * U.TAU * 2, r = R * (0.62 + 0.38 * Math.cos(t * 0.5 + 0.4));
          pts.push([cx + Math.cos(t + ang) * r, cy + Math.sin(t + ang) * r * 0.9]);
        }
      } else {
        const N = 14;
        for (let i = 0; i < N; i++) {
          const a = ang + (i / N) * U.TAU, r = R * (i % 2 ? 0.45 : 1) * (i % 4 === 1 ? 0.6 : 1);
          pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
        }
      }
      if (P.snap) {
        const s = P.step, o = s / 2;
        for (const p of pts) p[1] = Math.round((p[1] - o) / s) * s + o;
      }
      return pts;
    }

    // 판정 함수: 반환값은 { inside, cross, wind }
    function crossingNaive(px, py, pts) {
      let c = 0;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [x0, y0] = pts[j], [x1, y1] = pts[i];
        const lo = Math.min(y0, y1), hi = Math.max(y0, y1);
        if (py < lo || py > hi || y0 === y1) continue; // 닫힌 구간: 꼭짓점을 두 번 셈
        const xi = x0 + ((py - y0) * (x1 - x0)) / (y1 - y0);
        if (xi > px) c++;
      }
      return c;
    }
    function crossing(px, py, pts) {
      let c = 0;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [x0, y0] = pts[j], [x1, y1] = pts[i];
        if ((y0 > py) !== (y1 > py)) { // 반열린 구간
          const xi = x0 + ((py - y0) * (x1 - x0)) / (y1 - y0);
          if (xi > px) c++;
        }
      }
      return c;
    }
    function winding(px, py, pts) {
      let w = 0;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [x0, y0] = pts[j], [x1, y1] = pts[i];
        const side = (x1 - x0) * (py - y0) - (px - x0) * (y1 - y0); // 점이 변의 어느 쪽인지 (외적)
        if (y0 <= py) { if (y1 > py && side > 0) w++; }
        else if (y1 <= py && side < 0) w--;
      }
      return w;
    }
    const test = (px, py, pts) => {
      if (P.method === 'winding') return winding(px, py, pts);
      const c = P.method === 'naive' ? crossingNaive(px, py, pts) : crossing(px, py, pts);
      return c & 1;
    };

    function compute() {
      poly = makePoly();
      const s = P.step, W = ctx.width, H = ctx.height;
      fw = Math.ceil(W / s); fh = Math.ceil(H / s);
      if (!field || field.length < fw * fh) field = new Int8Array(fw * fh);
      const t0 = ctx.now();
      let inside = 0;
      for (let j = 0; j < fh; j++) {
        const py = j * s + s / 2;
        for (let i = 0; i < fw; i++) {
          const v = test(i * s + s / 2, py, poly);
          field[j * fw + i] = v;
          if (v !== 0) inside++;
        }
      }
      st = { inside, total: fw * fh, ms: ctx.now() - t0 };
    }
    compute();

    return {
      update(dt) { ang += P.spin * dt; compute(); },
      onParam() { compute(); },
      resize() { compute(); },
      render() {
        ctx.clearStats();
        const g = ctx.g, s = P.step, col = ctx.side === 'a' ? C.a : C.b;
        // 표본 점
        for (const lv of [1, 2, 3]) {
          g.beginPath();
          for (let k = 0; k < fw * fh; k++) {
            const v = Math.min(3, Math.abs(field[k]));
            if (v !== lv) continue;
            const X = (k % fw) * s + s / 2, Y = Math.floor(k / fw) * s + s / 2, r = Math.max(1, s * 0.32);
            g.rect(X - r, Y - r, r * 2, r * 2);
          }
          g.globalAlpha = lv === 1 ? 0.55 : 0.95;
          g.fillStyle = lv === 1 ? col : '#ffffff';
          g.fill();
        }
        g.globalAlpha = 1;
        // 다각형 외곽선과 변 방향
        D.poly(g, poly.map(([x, y]) => ({ x, y })), null, 'rgba(216,221,230,0.9)', 1.5, true);
        if (P.showEdges) {
          for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            if (poly.length > 20 && i % 3) continue;
            const [x0, y0] = poly[j], [x1, y1] = poly[i];
            const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, l = Math.hypot(x1 - x0, y1 - y0) || 1;
            const ux = (x1 - x0) / l, uy = (y1 - y0) / l;
            D.arrow(g, mx - ux * 8, my - uy * 8, mx + ux * 8, my + uy * 8, 'rgba(216,221,230,0.6)', 1.5);
          }
        }
        // 마우스 검사 점: 반직선과 교차 지점
        const m = ctx.input.mouse;
        if (m.inside) {
          const px = m.x, py = m.y;
          D.line(g, px, py, ctx.width, py, C.warn, 1);
          let cross = 0;
          for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const [x0, y0] = poly[j], [x1, y1] = poly[i];
            if ((y0 > py) !== (y1 > py)) {
              const xi = x0 + ((py - y0) * (x1 - x0)) / (y1 - y0);
              if (xi > px) { cross++; D.circle(g, xi, py, 4, y1 > y0 ? C.good : C.bad, null); }
            }
          }
          const w = winding(px, py, poly), v = test(px, py, poly);
          D.circle(g, px, py, 5, v ? col : '#000', '#fff', 2);
          const label = P.method === 'winding' ? GTL.L(`와인딩 ${w} → ${w ? '안' : '밖'}`, `Winding ${w} → ${w ? 'inside' : 'outside'}`) : GTL.L(`교차 ${P.method === 'naive' ? crossingNaive(px, py, poly) : cross}회 → ${v ? '안' : '밖'}`, `${P.method === 'naive' ? crossingNaive(px, py, poly) : cross} crossings → ${v ? 'inside' : 'outside'}`);
          D.text(g, label, px + 10, py - 12, { color: C.warn, size: 12 });
          ctx.stat(GTL.L('검사 점 교차 수', 'Test point crossings'), cross);
          ctx.stat(GTL.L('검사 점 와인딩 넘버', 'Test point winding number'), w);
        }
        ctx.stat(GTL.L('안쪽 표본 비율', 'Inside sample ratio'), ((100 * st.inside) / Math.max(1, st.total)).toFixed(1) + ' %');
        ctx.stat(GTL.L('안쪽 표본 수', 'Inside sample count'), st.inside.toLocaleString());
        ctx.stat(GTL.L('변 수', 'Edge count'), poly.length);
        ctx.stat(GTL.L('판정 시간 (전체 표본)', 'Test time (all samples)'), st.ms.toFixed(2) + ' ms');
      },
    };
  },
});
