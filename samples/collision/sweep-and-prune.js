// Sweep and Prune (Sort and Sweep): 정렬 축 선택 & 삽입 정렬의 시간적 일관성
GTL.register({
  id: 'sweep-and-prune',
  title: 'Sweep and Prune: 정렬 축과 시간적 일관성',
  summary: 'AABB를 한 축으로 정렬하고, 축 위 구간이 겹치는 쌍만 검사함. 오브젝트가 넓게 퍼진 축을 고르면 검사 수가 급감함. 지난 프레임 순서를 재사용하면 정렬 비용이 거의 O(n)이 됨.',
  views: { a: 'X축 고정', b: '분산이 큰 축 자동 선택' },
  controls: '마우스를 박스 위에 올리면 그 박스의 스윕 구간(축 위에서 겹치는 구간)이 보임.',
  info: `
    <p><b>Sweep and Prune</b>(Sort and Sweep)은 정렬로 검사 쌍을 줄이는 브로드페이즈. 동작 순서:</p>
    <ol>
      <li>모든 AABB(축 정렬 경계 상자)를 한 축의 <code>min</code> 값으로 정렬함.</li>
      <li>앞에서부터 훑다가 <code>min[j] &gt; max[i]</code>가 되면 i의 검사를 끝냄.</li>
      <li>축 위 구간이 겹친 쌍만 다른 축으로 다시 확인함.</li>
    </ol>
    <p>효율은 <b>축 선택</b>에 달림. 오브젝트가 세로로 늘어서 있는데 X축으로 정렬하면 거의 모든 구간이 겹침. 이때 검사 수가 O(n²)에 가까워짐.
    Ericson은 매 프레임 각 축의 <b>분산</b>을 구해 가장 큰 축을 고르는 방법을 소개함.</p>
    <p>프레임 사이에 오브젝트는 조금씩만 움직임. 그래서 지난 프레임의 순서가 이미 거의 정렬된 상태(<b>시간적 일관성</b>).
    <b>삽입 정렬</b>은 거의 정렬된 배열에서 O(n + 교환 수)로 동작함. Box2D v2.x 이전 버전과 Bullet의 <code>btAxisSweep3</code>가 이 방식을 씀.</p>
    <p>단점: 오브젝트가 빠르게 움직이면 순서가 많이 바뀌어 삽입 정렬의 이득이 줄어듦.</p>`,
  diagram: (L) => {
    const B = [[30, 16, 60, 18], [50, 42, 70, 18], [25, 68, 60, 18], [60, 94, 55, 18], [35, 120, 65, 18]];
    return `<svg viewBox="0 0 540 192" xmlns="http://www.w3.org/2000/svg">
    ${B.map((b) => `<rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}" class="f-dim"/>`).join('')}
    ${B.map((b, i) => `<line x1="${b[0]}" y1="${148 + i * 5}" x2="${b[0] + b[2]}" y2="${148 + i * 5}" class="d-a"/>`).join('')}
    <line x1="15" y1="176" x2="140" y2="176" class="d-dim"/><text x="144" y="180" class="t-small t-dim">X</text>
    ${B.map((b) => `<line x1="152" y1="${b[1]}" x2="152" y2="${b[1] + b[3]}" class="d-b"/>`).join('')}
    <line x1="160" y1="10" x2="160" y2="142" class="d-dim"/><text x="157" y="154" class="t-small t-dim">Y</text>
    <text x="190" y="26" class="t-a">${L('X축 투영: 5개 구간이 모두 겹침', 'X axis: all 5 intervals overlap')}</text>
    <text x="190" y="41" class="t-small t-dim">${L('검사 쌍 10개 (n²에 가까움)', '10 pairs to test (close to n²)')}</text>
    <text x="190" y="66" class="t-b">${L('Y축 투영: 구간이 서로 떨어짐', 'Y axis: intervals are apart')}</text>
    <text x="190" y="81" class="t-small t-dim">${L('검사 쌍 0개. 분산이 큰 축이 유리함', '0 pairs to test. The axis with larger variance wins')}</text>
    <text x="190" y="108" class="t-small">${L('min으로 정렬한 구간을 앞에서부터 훑기', 'Sweep the intervals sorted by min')}</text>
    <line x1="200" y1="124" x2="290" y2="124" class="d-line"/><text x="194" y="127" text-anchor="end" class="t-small t-mono">i</text>
    <line x1="240" y1="133" x2="330" y2="133" class="d-good"/>
    <line x1="270" y1="142" x2="360" y2="142" class="d-good"/>
    <line x1="310" y1="151" x2="400" y2="151" class="d-dim"/>
    <line x1="290" y1="116" x2="290" y2="158" class="d-accent" stroke-dasharray="4 3"/>
    <text x="294" y="120" class="t-small t-mono">max[i]</text>
    <text x="406" y="154" class="t-small t-mono t-dim">min[j]</text>
    <text x="190" y="176" class="t-small t-dim">${L('초록 구간만 i와 검사. min[j] &gt; max[i]이면 i의 검사 종료', 'Green intervals are tested with i. Stop once min[j] &gt; max[i]')}</text>
  </svg>`;
  },
  look: [
    '기본 상태(세로 기둥 장면)에서 "축 겹침 검사"를 비교하면 A가 B보다 수십 배 많음. A는 X축 구간이 대부분 겹치기 때문.',
    'B의 정렬 방식을 "매 프레임 새로 정렬"로 바꾸면 비교 수가 n log n 수준으로 늘어남. 삽입 정렬은 교환 수가 작음.',
    '속도를 크게 올리면 순서가 많이 바뀌어 삽입 정렬의 교환 수도 커짐. 시간적 일관성이 깨지는 상황.',
    '장면을 "가로 띠"로 바꾸면 B는 자동으로 X축을 고름. A를 Y축으로 바꾸면 반대로 성능이 나빠짐.',
  ],
  refs: [
    { type: 'book', title: 'Real-Time Collision Detection, 7.5 Sort and Sweep (Christer Ericson)', year: 2005, note: '분산 기반 축 선택, 삽입 정렬 활용.' },
    { type: 'paper', title: 'I-COLLIDE: An Interactive and Exact Collision Detection System for Large-Scale Environments (Cohen, Lin, Manocha, Ponamgi)', year: 1995, note: 'Sweep and Prune과 시간적 일관성 활용을 널리 알린 논문.' },
    { type: 'engine', title: 'Bullet Physics, btAxisSweep3 / bt32BitAxisSweep3', url: 'https://github.com/bulletphysics/bullet3', note: '증분 SAP 브로드페이즈.' },
  ],
  params: [
    { key: 'count', label: '박스 개수', type: 'int', min: 100, max: 2000, default: 1200, shared: true, reset: true, group: '장면' },
    { key: 'scene', label: '장면', type: 'select', options: [
      { value: 'columns', label: '세로 기둥 (세로로 흐름)' },
      { value: 'rows', label: '가로 띠 (가로로 흐름)' },
      { value: 'uniform', label: '균일 분포' },
    ], default: 'columns', shared: true, reset: true },
    { key: 'speed', label: '속도', type: 'range', min: 0, max: 400, step: 1, default: 60, shared: true },
    { key: 'size', label: '박스 크기', type: 'range', min: 2, max: 16, step: 0.5, default: 3.5, shared: true },
    { key: 'method', label: '방식', type: 'select', group: '브로드페이즈', options: [
      { value: 'sap', label: 'Sweep and Prune' },
      { value: 'brute', label: '전수 검사' },
    ], default: 'sap' },
    { key: 'axis', label: '정렬 축', type: 'select', options: [
      { value: 'x', label: 'X축' },
      { value: 'y', label: 'Y축' },
      { value: 'auto', label: '자동 (분산이 큰 축)' },
    ], a: 'x', b: 'auto', when: (p) => p.method === 'sap' },
    { key: 'sort', label: '정렬 방식', type: 'select', options: [
      { value: 'insertion', label: '삽입 정렬 (지난 순서 재사용)' },
      { value: 'full', label: '매 프레임 새로 정렬' },
    ], default: 'insertion', when: (p) => p.method === 'sap' },
  ],
  en: {
    title: 'Sweep and Prune: Sorted Axes and Temporal Coherence',
    summary: 'Sort the AABBs along one axis and test only pairs whose intervals overlap on that axis. Pick the axis where objects spread out most, and the test count drops sharply. Reuse last frame\'s order, and sorting costs almost O(n).',
    views: { a: 'Fixed X axis', b: 'Auto pick the axis with more variance' },
    controls: 'Hover over a box to see its sweep interval (the range that overlaps on the axis).',
    info: `
    <p><b>Sweep and Prune</b> (Sort and Sweep) is a broadphase that uses sorting to cut down the pairs to test. Steps:</p>
    <ol>
      <li>Sort all AABBs (axis-aligned bounding boxes) by their <code>min</code> value on one axis.</li>
      <li>Scan from the front. Stop testing i once <code>min[j] &gt; max[i]</code>.</li>
      <li>Check only the pairs that overlap on the axis again on the other axis.</li>
    </ol>
    <p>Efficiency depends on the <b>choice of axis</b>. If objects line up vertically and you sort on X, almost every interval overlaps. Then the test count moves toward O(n²).
    Ericson describes computing the <b>variance</b> of each axis every frame and picking the largest one.</p>
    <p>Objects move only a little between frames. So last frame's order is already almost sorted (<b>temporal coherence</b>).
    <b>Insertion sort</b> runs in O(n + swaps) on an almost sorted array. Box2D before v2.x and Bullet's <code>btAxisSweep3</code> use this approach.</p>
    <p>Downside: when objects move fast, the order changes a lot and insertion sort loses its advantage.</p>`,
    look: [
      'In the default state (vertical columns), compare "Axis overlap tests". A does tens of times more than B, because most X intervals in A overlap.',
      'Switch B\'s sort method to "Full sort every frame". The comparison count rises to about n log n. Insertion sort needs few swaps.',
      'Raise the speed a lot. The order changes a lot, so insertion sort also makes many swaps. Temporal coherence breaks down.',
      'Switch the scene to "Horizontal bands". B picks the X axis on its own. Switch A to the Y axis and its performance gets worse instead.',
    ],
    refs: [
      'Variance-based axis choice and use of insertion sort.',
      'The paper that made Sweep and Prune and temporal coherence widely known.',
      'Incremental SAP broadphase.',
    ],
    params: {
      count: { label: 'Box count', group: 'Scene' },
      scene: { label: 'Scene', options: { columns: 'Vertical columns (vertical flow)', rows: 'Horizontal bands (horizontal flow)', uniform: 'Uniform' } },
      speed: 'Speed',
      size: 'Box size',
      method: { label: 'Method', group: 'Broadphase', options: { brute: 'Brute force' } },
      axis: { label: 'Sort axis', options: { x: 'X axis', y: 'Y axis', auto: 'Auto (axis with more variance)' } },
      sort: { label: 'Sort method', options: { insertion: 'Insertion sort (reuse last order)', full: 'Full sort every frame' } },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    let n, x, y, vx, vy, w, h, order, hit;
    let st = { axisTests: 0, pairs: 0, cmp: 0, swaps: 0, axis: 'x', ms: 0 };
    const hist = [];
    let msAvg = 0;

    function init() {
      ctx.rng = U.rng(ctx.seed);
      const r = ctx.rng, W = ctx.width, H = ctx.height;
      n = P.count;
      x = new Float32Array(n); y = new Float32Array(n); vx = new Float32Array(n); vy = new Float32Array(n);
      w = new Float32Array(n); h = new Float32Array(n); hit = new Uint8Array(n);
      order = new Int32Array(n);
      for (let i = 0; i < n; i++) {
        order[i] = i;
        w[i] = r.range(0.6, 1.6); h[i] = r.range(0.6, 1.6);
        const lane = r.int(0, 3);
        if (P.scene === 'columns') { x[i] = W * (0.35 + lane * 0.1) + r.gauss() * 8; y[i] = r.range(0, H); vx[i] = 0; vy[i] = r.range(0.4, 1) * (lane % 2 ? 1 : -1); }
        else if (P.scene === 'rows') { y[i] = H * (0.35 + lane * 0.1) + r.gauss() * 8; x[i] = r.range(0, W); vy[i] = 0; vx[i] = r.range(0.4, 1) * (lane % 2 ? 1 : -1); }
        else { x[i] = r.range(0, W); y[i] = r.range(0, H); const a = r.range(0, U.TAU); vx[i] = Math.cos(a); vy[i] = Math.sin(a); }
      }
    }
    init();

    const minOf = (i, ax) => (ax === 'x' ? x[i] - w[i] * P.size : y[i] - h[i] * P.size);
    const maxOf = (i, ax) => (ax === 'x' ? x[i] + w[i] * P.size : y[i] + h[i] * P.size);

    function chooseAxis() {
      if (P.axis !== 'auto') return P.axis;
      let sx = 0, sy = 0, sxx = 0, syy = 0;
      for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; sxx += x[i] * x[i]; syy += y[i] * y[i]; }
      const varX = sxx / n - (sx / n) ** 2, varY = syy / n - (sy / n) ** 2;
      return varX >= varY ? 'x' : 'y';
    }

    let mnX, mxX, mnY, mxY;
    function bounds() {
      if (!mnX || mnX.length !== n) { mnX = new Float32Array(n); mxX = new Float32Array(n); mnY = new Float32Array(n); mxY = new Float32Array(n); }
      const S = P.size;
      for (let i = 0; i < n; i++) {
        mnX[i] = x[i] - w[i] * S; mxX[i] = x[i] + w[i] * S; mnY[i] = y[i] - h[i] * S; mxY[i] = y[i] + h[i] * S;
      }
    }

    function detect() {
      hit.fill(0);
      bounds();
      let axisTests = 0, pairs = 0, cmp = 0, swaps = 0;
      if (P.method === 'brute') {
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
          axisTests++;
          if (mnX[i] < mxX[j] && mnX[j] < mxX[i] && mnY[i] < mxY[j] && mnY[j] < mxY[i]) { hit[i] = hit[j] = 1; pairs++; }
        }
        st = { axisTests, pairs, cmp, swaps, axis: '-' };
        return;
      }
      const ax = chooseAxis();
      const key = ax === 'x' ? mnX : mnY, keyMax = ax === 'x' ? mxX : mxY;
      const oMin = ax === 'x' ? mnY : mnX, oMax = ax === 'x' ? mxY : mxX;
      if (P.sort === 'full') {
        const arr = Array.from({ length: n }, (_, i) => i); // 처음부터 다시 정렬
        arr.sort((a, b) => { cmp++; return key[a] - key[b]; });
        for (let i = 0; i < n; i++) order[i] = arr[i];
      } else {
        for (let i = 1; i < n; i++) {
          const v = order[i], kv = key[v];
          let j = i - 1;
          while (j >= 0) { cmp++; if (key[order[j]] <= kv) break; order[j + 1] = order[j]; j--; swaps++; }
          order[j + 1] = v;
        }
      }
      // 스윕: min 순서대로 훑다가 min[j] > max[i]면 i 종료
      for (let a = 0; a < n; a++) {
        const i = order[a], maxI = keyMax[i], lo = oMin[i], hi = oMax[i];
        for (let b = a + 1; b < n; b++) {
          const j = order[b];
          if (key[j] > maxI) break;
          axisTests++;
          if (oMin[j] < hi && lo < oMax[j]) { hit[i] = hit[j] = 1; pairs++; }
        }
      }
      st = { axisTests, pairs, cmp, swaps, axis: ax };
    }

    return {
      update(dt) {
        const W = ctx.width, H = ctx.height, sp = P.speed * dt;
        for (let i = 0; i < n; i++) {
          x[i] = U.wrap(x[i] + vx[i] * sp, 0, W); y[i] = U.wrap(y[i] + vy[i] * sp, 0, H);
        }
        const t0 = ctx.now();
        detect();
        const ms = ctx.now() - t0;
        msAvg = msAvg ? msAvg * 0.9 + ms * 0.1 : ms;
        hist.push(ms); if (hist.length > 120) hist.shift();
      },
      render() {
        ctx.clearStats();
        const g = ctx.g, W = ctx.width, H = ctx.height, S = P.size;
        const col = ctx.side === 'a' ? C.a : C.b;
        const ax = st.axis;
        // 축 위 투영 구간 (밀도): 아래쪽 또는 오른쪽 띠
        if (P.method === 'sap') {
          g.fillStyle = ctx.side === 'a' ? 'rgba(255,122,89,0.06)' : 'rgba(79,195,247,0.06)';
          if (ax === 'x') { for (let i = 0; i < n; i++) g.fillRect(x[i] - w[i] * S, H - 26, w[i] * S * 2, 22); D.text(g, GTL.L('X축 투영', 'X projection'), 6, H - 40, { color: col, size: 11 }); }
          else { for (let i = 0; i < n; i++) g.fillRect(W - 26, y[i] - h[i] * S, 22, h[i] * S * 2); D.text(g, GTL.L('Y축 투영', 'Y projection'), W - 90, H - 18, { color: col, size: 11 }); }
        }
        for (const hv of [0, 1]) {
          g.beginPath();
          for (let i = 0; i < n; i++) if (hit[i] === hv) g.rect(x[i] - w[i] * S, y[i] - h[i] * S, w[i] * S * 2, h[i] * S * 2);
          if (hv) { g.fillStyle = 'rgba(255,83,112,0.75)'; g.fill(); }
          else { g.strokeStyle = 'rgba(216,221,230,0.45)'; g.lineWidth = 1; g.stroke(); }
        }
        // 마우스: 선택 박스의 스윕 구간
        const m = ctx.input.mouse;
        if (m.inside && P.method === 'sap') {
          let sel = -1, bd = 900;
          for (let i = 0; i < n; i++) { const d = (x[i] - m.x) ** 2 + (y[i] - m.y) ** 2; if (d < bd) { bd = d; sel = i; } }
          if (sel >= 0) {
            const lo = minOf(sel, ax), hi = maxOf(sel, ax);
            let c = 0;
            g.beginPath();
            for (let j = 0; j < n; j++) {
              if (j === sel || minOf(j, ax) > hi || maxOf(j, ax) < lo) continue;
              g.rect(x[j] - w[j] * S, y[j] - h[j] * S, w[j] * S * 2, h[j] * S * 2); c++;
            }
            g.strokeStyle = C.warn; g.lineWidth = 1.5; g.stroke();
            if (ax === 'x') D.rect(g, lo, 0, hi - lo, H, 'rgba(255,203,107,0.12)');
            else D.rect(g, 0, lo, W, hi - lo, 'rgba(255,203,107,0.12)');
            D.text(g, GTL.L(`축 구간이 겹치는 박스 ${c}개`, `${c} boxes overlap on the axis`), m.x + 12, m.y - 16, { color: C.warn, size: 11 });
          }
        }
        D.plot(g, hist, W - 200, 8, 160, 44, { min: 0, color: col, label: GTL.L(`감지 ${msAvg.toFixed(2)} ms`, `Detect ${msAvg.toFixed(2)} ms`) });
        ctx.stat(GTL.L('정렬 축', 'Sort axis'), ax === '-' ? '-' : ax.toUpperCase());
        ctx.stat(GTL.L('축 겹침 검사', 'Axis overlap tests'), st.axisTests.toLocaleString());
        ctx.stat(GTL.L('실제 충돌 쌍', 'Actual colliding pairs'), st.pairs);
        if (P.method === 'sap') ctx.stat(GTL.L('정렬 비교 / 교환', 'Sort compares / swaps'), `${st.cmp.toLocaleString()} / ${st.swaps.toLocaleString()}`);
        ctx.stat(GTL.L('감지 비용', 'Detection cost'), msAvg.toFixed(2) + ' ms');
      },
    };
  },
});
