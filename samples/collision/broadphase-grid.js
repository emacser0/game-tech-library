// 브로드페이즈: 전수 검사 O(n²) vs 균일 그리드 vs 공간 해시
GTL.register({
  id: 'broadphase-grid',
  title: '브로드페이즈: 전수 검사 vs 균일 그리드 / 공간 해시',
  summary: '모든 쌍을 검사하면 n(n-1)/2번 검사함. 공간을 셀로 나누고 이웃 셀만 보면 검사 수가 거의 선형으로 줄어듦. 단, 셀 크기를 잘못 고르면 이득이 사라짐.',
  views: { a: '전수 검사 O(n²)', b: '균일 그리드' },
  controls: '마우스를 원 위에 올리면 그 원의 검사 후보(선)와 질의 셀(사각형)이 보임.',
  info: `
    <p>충돌 판정은 보통 두 단계로 나눔.</p>
    <ul>
      <li><b>브로드페이즈</b>: 겹칠 수 있는 쌍을 싸게 추려냄.</li>
      <li><b>내로우페이즈</b>: 추려낸 쌍만 정밀하게 검사함.</li>
    </ul>
    <p>전수 검사는 원이 2000개면 약 200만 쌍을 검사함. 원이 늘수록 검사 수가 제곱으로 늘어남.</p>
    <p><b>균일 그리드</b>는 원의 중심을 셀 하나에 넣음. 원들은 카운팅 정렬로 연속 배열에 배치함.
    질의할 때는 "자기 반지름 + 최대 반지름" 범위에 걸친 셀만 훑음.
    보통 셀 크기는 <b>가장 흔한 오브젝트 지름의 1~2배</b>가 알맞음.</p>
    <p><b>공간 해시</b>는 셀 좌표를 해시해서 고정 크기 버킷 테이블에 넣음. 월드가 무한해도 메모리는 버킷 수로 고정됨.</p>
    <p>단점:</p>
    <ul>
      <li>셀이 너무 작으면 방문할 셀 수가 폭증함.</li>
      <li>셀이 너무 크면 한 셀에 원이 몰려 다시 O(n²)에 가까워짐.</li>
      <li>공간 해시는 서로 다른 셀이 같은 버킷에 들어감(<b>해시 충돌</b>). 그만큼 쓸데없는 검사가 늘어남.</li>
    </ul>`,
  diagram: (L) => {
    const P = [[30, 30], [70, 90], [100, 50], [140, 100], [190, 40], [215, 105]];
    let all = '';
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) all += `<line x1="${10 + P[i][0]}" y1="${16 + P[i][1]}" x2="${10 + P[j][0]}" y2="${16 + P[j][1]}" class="d-a" stroke-width="1"/>`;
    const near = (p) => p[0] >= 40 && p[0] < 160;
    return `<svg viewBox="0 0 540 178" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="16" width="240" height="120" class="d-dim"/>
    ${all}
    ${P.map((p) => `<circle cx="${10 + p[0]}" cy="${16 + p[1]}" r="5" class="f-a"/>`).join('')}
    ${[0, 1, 2, 3, 4, 5, 6].map((c) => `<line x1="${290 + c * 40}" y1="16" x2="${290 + c * 40}" y2="136" class="d-dim"/>`).join('')}
    ${[0, 1, 2, 3].map((r) => `<line x1="290" y1="${16 + r * 40}" x2="530" y2="${16 + r * 40}" class="d-dim"/>`).join('')}
    <rect x="330" y="16" width="120" height="120" class="d-b" stroke-dasharray="5 3"/>
    ${P.filter((p, i) => i !== 2 && near(p)).map((p) => `<line x1="390" y1="66" x2="${290 + p[0]}" y2="${16 + p[1]}" class="d-b"/>`).join('')}
    ${P.map((p, i) => `<circle cx="${290 + p[0]}" cy="${16 + p[1]}" r="${i === 2 ? 6 : 5}" class="${near(p) ? 'f-b' : 'f-dim'}"/>`).join('')}
    <text x="10" y="154" class="t-a">${L('전수 검사: 6개면 15쌍', 'Brute force: 6 objects, 15 pairs')}</text>
    <text x="290" y="154" class="t-b">${L('그리드: 주변 9칸 안의 2쌍만', 'Grid: 2 pairs in the 9 nearby cells')}</text>
    <text x="10" y="172" class="t-small t-dim">${L('n이 늘면 A는 n²에 비례해, B는 거의 n에 비례해 늘어남', 'As n grows, A grows with n², B grows almost linearly with n')}</text>
  </svg>`;
  },
  look: [
    '기본 상태에서 오른쪽 위 ms 그래프를 비교하면 A는 수십만~수백만 쌍, B는 수천 쌍을 검사함.',
    'B의 셀 크기를 4px로 낮추면 "방문 셀"이 폭증함. 160px로 올리면 셀마다 원이 몰려 검사 수가 다시 늘어남(U자 곡선).',
    '"큰 원 비율"을 올리면 질의 범위가 최대 반지름에 맞춰 커져서 그리드 효율이 떨어짐. 크기가 제각각일 때 쿼드트리나 BVH가 유리한 이유.',
    'B를 공간 해시로 바꾸고 버킷 수를 16~64로 줄이면 "해시 충돌 낭비 검사"가 늘어남.',
  ],
  refs: [
    { type: 'book', title: 'Real-Time Collision Detection, Ch.7 Spatial Partitioning (Christer Ericson)', year: 2005, note: '균일 그리드, 해시 그리드, 셀 크기 선택.' },
    { type: 'paper', title: 'Optimized Spatial Hashing for Collision Detection of Deformable Objects (Teschner et al.)', year: 2003, note: 'VMV 2003. 해시 함수 (x*73856093 XOR y*19349663 XOR z*83492791) mod n의 출처.' },
    { type: 'article', title: 'Spatial hashing, Ten Minute Physics (Matthias Müller)', url: 'https://matthias-research.github.io/pages/tenMinutePhysics/', note: '카운팅 정렬 기반 밀집(dense) 해시 구현 해설.' },
  ],
  params: [
    { key: 'count', label: '원 개수', type: 'int', min: 100, max: 3000, default: 1600, shared: true, reset: true, group: '장면' },
    { key: 'radius', label: '반지름', type: 'range', min: 2, max: 10, step: 0.5, default: 4, shared: true },
    { key: 'bigFrac', label: '큰 원 비율', type: 'range', min: 0, max: 0.1, step: 0.005, default: 0, shared: true, reset: true, help: '반지름이 5배인 원의 비율' },
    { key: 'speed', label: '속도', type: 'range', min: 0, max: 200, step: 1, default: 50, shared: true },
    { key: 'method', label: '방식', type: 'select', group: '브로드페이즈', options: [
      { value: 'brute', label: '전수 검사 O(n²)' },
      { value: 'grid', label: '균일 그리드' },
      { value: 'hash', label: '공간 해시' },
    ], a: 'brute', b: 'grid' },
    { key: 'cell', label: '셀 크기 (px)', type: 'int', min: 4, max: 160, default: 16, when: (p) => p.method !== 'brute' },
    { key: 'buckets', label: '해시 버킷 수', type: 'int', min: 16, max: 8192, default: 2048, when: (p) => p.method === 'hash' },
    { key: 'showCells', label: '셀 점유도 표시', type: 'bool', default: true, when: (p) => p.method !== 'brute' },
  ],
  en: {
    title: 'Broadphase: Brute Force vs Uniform Grid / Spatial Hash',
    summary: 'Testing every pair takes n(n-1)/2 tests. If you split space into cells and check only nearby cells, the test count drops to almost linear. But a bad cell size wipes out the gain.',
    views: { a: 'Brute force O(n²)', b: 'Uniform grid' },
    controls: 'Hover over a circle to see its candidate pairs (lines) and the cells it queries (rectangle).',
    info: `
    <p>Collision detection usually has two phases.</p>
    <ul>
      <li><b>Broadphase</b>: cheaply finds the pairs that might overlap.</li>
      <li><b>Narrowphase</b>: tests only those pairs in detail.</li>
    </ul>
    <p>With 2000 circles, brute force tests about 2 million pairs. The test count grows with the square of the circle count.</p>
    <p>A <b>uniform grid</b> puts each circle's center into one cell. A counting sort packs the circles into one continuous array.
    A query scans only the cells within "own radius + max radius".
    A good cell size is usually <b>1 to 2 times the diameter of the most common object</b>.</p>
    <p>A <b>spatial hash</b> hashes cell coordinates into a fixed-size bucket table. Even with an infinite world, memory stays fixed at the bucket count.</p>
    <p>Downsides:</p>
    <ul>
      <li>If cells are too small, the number of cells to visit explodes.</li>
      <li>If cells are too large, circles crowd into one cell and the cost moves back toward O(n²).</li>
      <li>In a spatial hash, different cells can land in the same bucket (<b>hash collision</b>). This adds useless tests.</li>
    </ul>`,
    look: [
      'In the default state, compare the ms graphs at the top right. A tests hundreds of thousands to millions of pairs. B tests a few thousand.',
      'Lower B\'s cell size to 4 px. "Visited cells" explodes. Raise it to 160 px. Circles crowd into each cell and the test count rises again (a U-shaped curve).',
      'Raise "Large circle ratio". The query range grows to fit the max radius, so the grid gets less efficient. This is why a quadtree or BVH wins when sizes vary a lot.',
      'Switch B to spatial hash and cut the bucket count to 16~64. "Wasted tests from hash collisions" goes up.',
    ],
    refs: [
      'Uniform grids, hashed grids, and choosing a cell size.',
      'VMV 2003. Source of the hash function (x*73856093 XOR y*19349663 XOR z*83492791) mod n.',
      'Explains a dense hash built on a counting sort.',
    ],
    params: {
      count: { label: 'Circle count', group: 'Scene' },
      radius: 'Radius',
      bigFrac: { label: 'Large circle ratio', help: 'Share of circles with 5 times the radius' },
      speed: 'Speed',
      method: { label: 'Method', group: 'Broadphase', options: { brute: 'Brute force O(n²)', grid: 'Uniform grid', hash: 'Spatial hash' } },
      cell: 'Cell size (px)',
      buckets: 'Hash bucket count',
      showCells: 'Show cell occupancy',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const BIG = 5;
    let n, x, y, vx, vy, sc, hit, cellX, cellY, sorted, cellStart, cellCount, stamp;
    let stats = { tests: 0, pairs: 0, cells: 0, waste: 0, ms: 0 };
    const hist = [];
    let msAvg = 0, maxScale = 1;

    function init() {
      ctx.rng = U.rng(ctx.seed);
      const r = ctx.rng;
      n = P.count;
      x = new Float32Array(n); y = new Float32Array(n); vx = new Float32Array(n); vy = new Float32Array(n);
      sc = new Float32Array(n); hit = new Uint8Array(n); cellX = new Int32Array(n); cellY = new Int32Array(n);
      sorted = new Int32Array(n);
      maxScale = 1;
      for (let i = 0; i < n; i++) {
        x[i] = r.range(0, ctx.width); y[i] = r.range(0, ctx.height);
        const a = r.range(0, U.TAU), s = r.range(0.3, 1);
        vx[i] = Math.cos(a) * s; vy[i] = Math.sin(a) * s;
        sc[i] = r.chance(P.bigFrac) ? BIG : 1;
        if (sc[i] > maxScale) maxScale = sc[i];
      }
    }
    init();

    const hashCell = (cx, cy, B) => (((Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663)) >>> 0) % B);

    function cellSize() {
      // 셀 수가 지나치게 많아지지 않도록 하한
      let cs = P.cell;
      while (Math.ceil(ctx.width / cs) * Math.ceil(ctx.height / cs) > 120000) cs++;
      return cs;
    }

    function broadphase() {
      const R = P.radius, rmax = R * maxScale;
      hit.fill(0);
      let tests = 0, pairs = 0, cells = 0, waste = 0;
      if (P.method === 'brute') {
        for (let i = 0; i < n; i++) {
          const xi = x[i], yi = y[i], ri = sc[i] * R;
          for (let j = i + 1; j < n; j++) {
            const dx = x[j] - xi, dy = y[j] - yi, rr = ri + sc[j] * R;
            tests++;
            if (dx * dx + dy * dy < rr * rr) { hit[i] = hit[j] = 1; pairs++; }
          }
        }
      } else {
        const cs = cellSize();
        const gw = Math.ceil(ctx.width / cs) + 1, gh = Math.ceil(ctx.height / cs) + 1;
        const isHash = P.method === 'hash';
        const B = isHash ? P.buckets : gw * gh;
        if (!cellCount || cellCount.length < B + 1) { cellCount = new Int32Array(B + 1); cellStart = new Int32Array(B + 1); stamp = new Int32Array(B); }
        cellCount.fill(0, 0, B + 1); stamp.fill(0, 0, B);
        const key = new Int32Array(n);
        for (let i = 0; i < n; i++) {
          const cx = U.clamp(Math.floor(x[i] / cs), 0, gw - 1), cy = U.clamp(Math.floor(y[i] / cs), 0, gh - 1);
          cellX[i] = cx; cellY[i] = cy;
          const k = isHash ? hashCell(cx, cy, B) : cy * gw + cx;
          key[i] = k; cellCount[k]++;
        }
        // 카운팅 정렬: cellStart[k] .. cellStart[k+1]
        let acc = 0;
        for (let k = 0; k < B; k++) { cellStart[k] = acc; acc += cellCount[k]; }
        cellStart[B] = acc;
        const fillPos = cellStart.slice(0, B);
        for (let i = 0; i < n; i++) sorted[fillPos[key[i]]++] = i;

        for (let i = 0; i < n; i++) {
          const xi = x[i], yi = y[i], ri = sc[i] * R, reach = ri + rmax;
          const x0 = Math.max(0, Math.floor((xi - reach) / cs)), x1 = Math.min(gw - 1, Math.floor((xi + reach) / cs));
          const y0 = Math.max(0, Math.floor((yi - reach) / cs)), y1 = Math.min(gh - 1, Math.floor((yi + reach) / cs));
          const q = i + 1;
          for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
            const k = isHash ? hashCell(cx, cy, B) : cy * gw + cx;
            cells++;
            if (isHash) { if (stamp[k] === q) continue; stamp[k] = q; }
            for (let s = cellStart[k], e = cellStart[k + 1]; s < e; s++) {
              const j = sorted[s];
              if (j <= i) continue;
              tests++;
              if (isHash && (cellX[j] < x0 || cellX[j] > x1 || cellY[j] < y0 || cellY[j] > y1)) waste++;
              const dx = x[j] - xi, dy = y[j] - yi, rr = ri + sc[j] * R;
              if (dx * dx + dy * dy < rr * rr) { hit[i] = hit[j] = 1; pairs++; }
            }
          }
        }
      }
      stats = { tests, pairs, cells, waste };
    }

    function nearestToMouse() {
      const m = ctx.input.mouse;
      if (!m.inside) return -1;
      let best = -1, bd = 400;
      for (let i = 0; i < n; i++) {
        const d = (x[i] - m.x) ** 2 + (y[i] - m.y) ** 2;
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    }

    return {
      update(dt) {
        const W = ctx.width, H = ctx.height, sp = P.speed * dt;
        for (let i = 0; i < n; i++) {
          x[i] += vx[i] * sp; y[i] += vy[i] * sp;
          if (x[i] < 0) { x[i] = 0; vx[i] = Math.abs(vx[i]); } else if (x[i] > W) { x[i] = W; vx[i] = -Math.abs(vx[i]); }
          if (y[i] < 0) { y[i] = 0; vy[i] = Math.abs(vy[i]); } else if (y[i] > H) { y[i] = H; vy[i] = -Math.abs(vy[i]); }
        }
        const t0 = ctx.now();
        broadphase();
        const ms = ctx.now() - t0;
        msAvg = msAvg ? msAvg * 0.9 + ms * 0.1 : ms;
        hist.push(ms); if (hist.length > 120) hist.shift();
      },
      render() {
        ctx.clearStats();
        const g = ctx.g, W = ctx.width, H = ctx.height, R = P.radius;
        const col = ctx.side === 'a' ? C.a : C.b;
        const usesCells = P.method !== 'brute';
        const cs = cellSize();
        if (usesCells && P.showCells && cellCount) {
          // 점유도 히트맵 (현재 위치 기준으로 다시 계산. 렌더는 상태를 바꾸지 않음)
          const gw = Math.ceil(W / cs) + 1, gh = Math.ceil(H / cs) + 1;
          if (gw * gh <= 40000) {
            const occ = new Uint16Array(gw * gh);
            for (let i = 0; i < n; i++) {
              const cx = U.clamp(Math.floor(x[i] / cs), 0, gw - 1), cy = U.clamp(Math.floor(y[i] / cs), 0, gh - 1);
              occ[cy * gw + cx]++;
            }
            for (let k = 0; k < occ.length; k++) if (occ[k]) {
              g.fillStyle = `rgba(79,195,247,${Math.min(0.5, occ[k] * 0.03)})`;
              g.fillRect((k % gw) * cs, Math.floor(k / gw) * cs, cs, cs);
            }
          }
          if (cs >= 8) D.grid(g, W, H, cs, 'rgba(255,255,255,0.08)');
        }
        // 원: 색별로 한 번에 그림
        for (const h of [0, 1]) {
          g.beginPath();
          for (let i = 0; i < n; i++) {
            if (hit[i] !== h) continue;
            const r = sc[i] * R;
            g.moveTo(x[i] + r, y[i]); g.arc(x[i], y[i], r, 0, U.TAU);
          }
          g.fillStyle = h ? C.bad : 'rgba(216,221,230,0.55)';
          g.fill();
        }
        // 마우스 하이라이트: 후보 목록
        const sel = nearestToMouse();
        if (sel >= 0) {
          const rmax = R * maxScale, reach = sc[sel] * R + rmax;
          const xi = x[sel], yi = y[sel];
          let cand = 0;
          g.beginPath();
          if (!usesCells) {
            for (let j = 0; j < n; j++) if (j !== sel) { g.moveTo(xi, yi); g.lineTo(x[j], y[j]); cand++; }
          } else {
            const x0 = Math.floor((xi - reach) / cs), x1 = Math.floor((xi + reach) / cs);
            const y0 = Math.floor((yi - reach) / cs), y1 = Math.floor((yi + reach) / cs);
            D.rect(g, x0 * cs, y0 * cs, (x1 - x0 + 1) * cs, (y1 - y0 + 1) * cs, null, C.warn, 1.5);
            const isHash = P.method === 'hash', B = P.buckets;
            const gw = Math.ceil(W / cs) + 1;
            const qset = new Set();
            for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) qset.add(isHash ? hashCell(cx, cy, B) : cy * gw + cx);
            for (let j = 0; j < n; j++) {
              if (j === sel) continue;
              const cx = U.clamp(Math.floor(x[j] / cs), 0, gw - 1), cy = U.clamp(Math.floor(y[j] / cs), 0, Math.ceil(H / cs));
              const k = isHash ? hashCell(cx, cy, B) : cy * gw + cx;
              if (qset.has(k)) { g.moveTo(xi, yi); g.lineTo(x[j], y[j]); cand++; }
            }
          }
          g.strokeStyle = U.rgb(255, 203, 107, 0.25); g.lineWidth = 1; g.stroke();
          D.circle(g, xi, yi, sc[sel] * R + 2, null, C.warn, 2);
          D.text(g, GTL.L(`후보 ${cand}개`, `${cand} candidates`), xi + 10, yi - 18, { color: C.warn, size: 11 });
        }
        // ms 그래프
        D.plot(g, hist, W - 170, 8, 160, 44, { min: 0, color: col, label: GTL.L(`브로드페이즈 ${msAvg.toFixed(2)} ms`, `Broadphase ${msAvg.toFixed(2)} ms`) });

        ctx.stat(GTL.L('쌍 검사 수', 'Pair tests'), stats.tests.toLocaleString());
        ctx.stat(GTL.L('전수 검사였다면', 'With brute force'), (n * (n - 1) / 2).toLocaleString());
        ctx.stat(GTL.L('충돌 쌍', 'Colliding pairs'), stats.pairs);
        if (usesCells) ctx.stat(GTL.L('방문 셀', 'Visited cells'), stats.cells.toLocaleString());
        if (P.method === 'hash') ctx.stat(GTL.L('해시 충돌 낭비 검사', 'Wasted tests from hash collisions'), stats.waste.toLocaleString());
        ctx.stat(GTL.L('브로드페이즈', 'Broadphase'), msAvg.toFixed(2) + ' ms');
      },
    };
  },
});
