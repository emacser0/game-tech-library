// 원 vs 원: 겹침 판정만 vs 겹침 해소(밀어내기)
GTL.register({
  id: 'circle-separation',
  title: '원 vs 원 충돌: 겹침 판정 vs 밀어내기',
  summary: '겹침을 판정만 하면 유닛이 서로 통과해 한 점에 뭉침. 겹친 깊이만큼 두 원을 중심선 방향으로 밀어내면 유닛이 무리를 이룸. 반복 횟수가 적으면 빽빽한 곳에 겹침이 남음.',
  views: { a: '판정만', b: '밀어내기' },
  controls: '마우스: 목표 지점 이동 (뷰 밖이면 목표가 천천히 돎)',
  info: `
    <p>원 두 개는 <b>중심 사이 거리가 반지름 합보다 작으면</b> 겹침. 제곱 거리로 비교하면 제곱근 없이 판정함.</p>
    <p>판정만 하면 아무 일도 일어나지 않음. 유닛이 같은 목표로 가면 모두 한 점에 겹침.</p>
    <p><b>밀어내기</b>(겹침 해소)는 이렇게 동작함.</p>
    <ul>
      <li>침투 깊이 = 반지름 합 - 중심 거리.</li>
      <li>두 원을 중심선 방향으로 깊이의 절반씩 반대로 옮김.</li>
      <li>한 원을 밀면 다른 원과 새로 겹칠 수 있음. 그래서 전체 검사를 몇 번 반복함(반복 해소).</li>
    </ul>
    <p>단점:</p>
    <ul>
      <li>반복이 적으면 빽빽한 곳에서 겹침이 남음. 반복이 많으면 비용이 늘어남.</li>
      <li>보정 비율이 1보다 작으면 떨림은 줄지만 겹침이 천천히 풀림.</li>
      <li>중심이 정확히 같으면 방향을 정할 수 없음. 임의 방향을 하나 정해서 밀어야 함.</li>
    </ul>`,
  diagram: (L) => `<svg viewBox="0 0 540 178" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="14" class="t-a">${L('A: 판정만', 'A: test only')}</text>
    <text x="290" y="14" class="t-b">${L('B: 밀어내기', 'B: push apart')}</text>
    <line x1="270" y1="22" x2="270" y2="150" class="d-dim"/>
    <circle cx="98" cy="80" r="36" class="f-a" fill-opacity="0.25"/><circle cx="98" cy="80" r="36" class="d-a"/>
    <circle cx="142" cy="80" r="36" class="f-a" fill-opacity="0.25"/><circle cx="142" cy="80" r="36" class="d-a"/>
    <circle cx="98" cy="80" r="2.5" class="f-a"/><circle cx="142" cy="80" r="2.5" class="f-a"/>
    <text x="120" y="134" text-anchor="middle" class="t-small">${L('d &lt; r1 + r2 이면 겹침', 'Overlap if d &lt; r1 + r2')}</text>
    <text x="120" y="148" text-anchor="middle" class="t-small t-dim">${L('위치는 그대로 남음', 'Positions stay as they are')}</text>
    <circle cx="364" cy="80" r="36" class="d-dim" stroke-dasharray="4 3"/><circle cx="436" cy="80" r="36" class="d-dim" stroke-dasharray="4 3"/>
    <circle cx="378" cy="80" r="36" class="d-b"/><circle cx="422" cy="80" r="36" class="d-b"/>
    <line x1="386" y1="80" x2="414" y2="80" class="d-accent"/>
    <text x="400" y="36" text-anchor="middle" class="t-small">${L('침투 깊이 = r1 + r2 - d', 'depth = r1 + r2 - d')}</text>
    <line x1="400" y1="40" x2="400" y2="76" class="d-dim"/>
    <path d="M378,80 L362,80" class="d-b" marker-end="url(#arr)"/><path d="M422,80 L438,80" class="d-b" marker-end="url(#arr)"/>
    <path d="M378,120 L378,126 L422,126 L422,120" class="d-dim"/><text x="400" y="138" text-anchor="middle" class="t-small t-mono">d</text>
    <text x="400" y="152" text-anchor="middle" class="t-small t-dim">${L('중심선 방향으로 깊이/2씩 반대로 이동', 'Each moves depth/2 along the center line')}</text>
    <text x="4" y="172" class="t-small t-dim">${L('제곱 거리로 비교하면 제곱근이 필요 없음. 점선은 밀어낸 뒤 위치', 'Compare squared distances to skip the square root. Dashed circles show the result')}</text>
  </svg>`,
  look: [
    '기본 상태에서 A는 유닛이 목표 지점 한곳에 모두 겹침(빨간 원). B는 유닛이 둥근 무리를 이룸.',
    'B의 "해소 반복 횟수"를 1로 낮추면 무리 중심부에 겹침이 남고 "최대 침투" 값이 커짐.',
    'B의 "보정 비율"을 0.2로 낮추면 무리가 물렁하게 출렁이고 겹침이 천천히 풀림.',
    '유닛 수를 400으로 올리면 두 뷰 모두 쌍 검사 수가 늘어남. B는 반복 횟수만큼 비용이 곱해짐.',
  ],
  refs: [
    { type: 'book', title: 'Real-Time Collision Detection, 4.3 Spheres (Christer Ericson)', year: 2005, note: '구 대 구 판정과 제곱 거리 비교.' },
    { type: 'paper', title: 'Position Based Dynamics (Müller, Heidelberger, Hennix, Ratcliff)', year: 2007, note: 'Journal of Visual Communication and Image Representation 18(2). 위치 보정을 반복하는 방식의 기반.' },
    { type: 'article', title: 'Steering Behaviors For Autonomous Characters (Craig Reynolds)', url: 'https://www.red3d.com/cwr/steer/', year: 1999, note: '목표 추적과 분리(separation) 행동.' },
  ],
  params: [
    { key: 'count', label: '유닛 수', type: 'int', min: 10, max: 400, default: 160, shared: true, reset: true, group: '장면' },
    { key: 'radius', label: '반지름', type: 'range', min: 3, max: 16, step: 0.5, default: 8, shared: true },
    { key: 'speed', label: '이동 속도', type: 'range', min: 10, max: 300, step: 5, default: 120, shared: true },
    { key: 'resolve', label: '겹침 해소', type: 'bool', group: '충돌 처리', a: false, b: true, default: false },
    { key: 'iters', label: '해소 반복 횟수', type: 'int', min: 1, max: 10, default: 4, when: (p) => p.resolve },
    { key: 'factor', label: '보정 비율', type: 'range', min: 0.1, max: 1, step: 0.05, default: 1, help: '침투 깊이 중 이번 반복에서 밀어낼 비율', when: (p) => p.resolve },
    { key: 'showLinks', label: '겹침 선 표시', type: 'bool', default: true },
  ],
  en: {
    title: 'Circle vs Circle Collision: Overlap Test vs Push Apart',
    summary: 'If you only test for overlap, units pass through each other and pile up on one point. Push the two circles apart along the center line by the overlap depth, and the units form a crowd. With few iterations, overlap remains in dense areas.',
    views: { a: 'Test only', b: 'Push apart' },
    controls: 'Mouse: move the target point (outside the view, the target circles slowly)',
    info: `
    <p>Two circles overlap <b>when the distance between their centers is less than the sum of their radii</b>. Compare squared distances, and you can test without a square root.</p>
    <p>A test alone changes nothing. If units head for the same target, they all overlap on one point.</p>
    <p><b>Push apart</b> (overlap resolution) works like this.</p>
    <ul>
      <li>Penetration depth = sum of radii - center distance.</li>
      <li>Move the two circles in opposite directions along the center line, each by half the depth.</li>
      <li>Pushing one circle can make it overlap another. So repeat the full check a few times (iterative resolution).</li>
    </ul>
    <p>Downsides:</p>
    <ul>
      <li>With few iterations, overlap remains in dense areas. With many iterations, cost goes up.</li>
      <li>A correction ratio below 1 reduces jitter, but overlap clears slowly.</li>
      <li>If the centers are exactly the same, there is no direction. You must pick some direction and push along it.</li>
    </ul>`,
    look: [
      'In the default state, units in A all overlap on the target point (red circles). In B, units form a round crowd.',
      'Lower B\'s "Resolve iterations" to 1. Overlap remains in the middle of the crowd, and "Max penetration" grows.',
      'Lower B\'s "Correction ratio" to 0.2. The crowd wobbles softly, and overlap clears slowly.',
      'Raise the unit count to 400. Pair tests go up in both views. In B, the cost is multiplied by the iteration count.',
    ],
    refs: [
      'Sphere vs sphere test and squared distance comparison.',
      'Journal of Visual Communication and Image Representation 18(2). The basis of methods that repeat position correction.',
      'Seek and separation behaviors.',
    ],
    params: {
      count: { label: 'Unit count', group: 'Scene' },
      radius: 'Radius',
      speed: 'Move speed',
      resolve: { label: 'Resolve overlap', group: 'Collision handling' },
      iters: 'Resolve iterations',
      factor: { label: 'Correction ratio', help: 'Share of the penetration depth to push out in this iteration' },
      showLinks: 'Show overlap lines',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    let n, x, y, over;
    let st = { pairs: 0, tests: 0, maxPen: 0, avgPen: 0 };
    let tx = 0, ty = 0, t = 0;

    function init() {
      ctx.rng = U.rng(ctx.seed);
      n = P.count;
      x = new Float32Array(n); y = new Float32Array(n); over = new Uint8Array(n);
      for (let i = 0; i < n; i++) { x[i] = ctx.rng.range(0, ctx.width); y[i] = ctx.rng.range(0, ctx.height); }
    }
    init();

    // 모든 쌍의 겹침을 검사. push가 참이면 겹친 만큼 밀어냄
    function pass(push) {
      const R2 = P.radius * 2, k = P.factor * 0.5;
      let pairs = 0, tests = 0, maxPen = 0, sumPen = 0;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          tests++;
          const dx = x[j] - x[i], dy = y[j] - y[i], d2 = dx * dx + dy * dy;
          if (d2 >= R2 * R2) continue;
          const d = Math.sqrt(d2), pen = R2 - d;
          pairs++; sumPen += pen; if (pen > maxPen) maxPen = pen;
          over[i] = over[j] = 1;
          if (!push) continue;
          // 중심이 같으면 방향이 없으므로 인덱스로 정한 방향을 씀
          let nx, ny;
          if (d > 1e-6) { nx = dx / d; ny = dy / d; } else { const a = (i * 2.399 + j) % U.TAU; nx = Math.cos(a); ny = Math.sin(a); }
          const m = pen * k;
          x[i] -= nx * m; y[i] -= ny * m; x[j] += nx * m; y[j] += ny * m;
        }
      }
      return { pairs, tests, maxPen, avgPen: pairs ? sumPen / pairs : 0 };
    }

    return {
      update(dt) {
        t += dt;
        const W = ctx.width, H = ctx.height, m = ctx.input.mouse;
        if (m.inside) { tx = m.x; ty = m.y; }
        else { tx = W / 2 + Math.cos(t * 0.4) * W * 0.22; ty = H / 2 + Math.sin(t * 0.4) * H * 0.22; }
        // 목표로 이동 (도착 반경 안에서는 감속)
        const sp = P.speed * dt;
        for (let i = 0; i < n; i++) {
          const dx = tx - x[i], dy = ty - y[i], d = Math.hypot(dx, dy);
          if (d < 1e-3) continue;
          const s = Math.min(sp, d) * Math.min(1, d / 40 + 0.3);
          x[i] += (dx / d) * s; y[i] += (dy / d) * s;
        }
        let tests = 0;
        if (P.resolve) for (let k = 0; k < P.iters; k++) tests += pass(true).tests;
        over.fill(0);
        const r = pass(false); // 해소 후 남은 겹침 측정
        r.tests += tests;
        st = r;
        for (let i = 0; i < n; i++) { x[i] = U.clamp(x[i], 0, W); y[i] = U.clamp(y[i], 0, H); }
      },
      render() {
        ctx.clearStats();
        const g = ctx.g, R = P.radius, col = ctx.side === 'a' ? C.a : C.b;
        if (P.showLinks) {
          g.beginPath();
          const R2 = R * 2;
          for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
            const dx = x[j] - x[i], dy = y[j] - y[i];
            if (dx * dx + dy * dy < R2 * R2) { g.moveTo(x[i], y[i]); g.lineTo(x[j], y[j]); }
          }
          g.strokeStyle = 'rgba(255,83,112,0.35)'; g.lineWidth = 1; g.stroke();
        }
        for (const h of [0, 1]) {
          g.beginPath();
          for (let i = 0; i < n; i++) if (over[i] === h) { g.moveTo(x[i] + R, y[i]); g.arc(x[i], y[i], R, 0, U.TAU); }
          g.fillStyle = h ? 'rgba(255,83,112,0.45)' : col; g.fill();
          g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1; g.stroke();
        }
        D.circle(g, tx, ty, 5, null, C.warn, 2);
        D.line(g, tx - 9, ty, tx + 9, ty, C.warn, 1); D.line(g, tx, ty - 9, tx, ty + 9, C.warn, 1);
        ctx.stat(GTL.L('겹친 쌍', 'Overlapping pairs'), st.pairs);
        ctx.stat(GTL.L('최대 침투 (px)', 'Max penetration (px)'), st.maxPen.toFixed(1));
        ctx.stat(GTL.L('평균 침투 (px)', 'Average penetration (px)'), st.avgPen.toFixed(2));
        ctx.stat(GTL.L('프레임당 쌍 검사 수', 'Pair tests per frame'), st.tests.toLocaleString());
      },
    };
  },
});
