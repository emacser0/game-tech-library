// 오브젝트 배치: 균등 랜덤 vs 지터 그리드 vs 포아송 디스크 (Bridson)
GTL.register({
  id: 'poisson-disk',
  title: '포아송 디스크 샘플링 (Bridson): 나무 배치',
  summary: '균등 랜덤 vs 포아송 디스크 배치 비교. 균등 랜덤은 나무가 뭉치고 빈 곳이 생김. 포아송 디스크는 최소 거리 r을 지키면서 격자처럼 보이지 않는 배치를 O(N)에 만듦.',
  views: { a: '균등 랜덤', b: '포아송 디스크' },
  controls: '조작 없음. "다시 생성"을 누르면 새 시드로 만듦.',
  info: `
    <p><b>포아송 디스크 샘플링</b>: 모든 점 사이 거리가 r 이상이 되게 무작위로 점을 놓는 방법.
    결과는 방향성 없이 고르게 퍼진 "블루 노이즈" 분포. 나무, 바위 같은 오브젝트 배치에 씀.</p>
    <p>다른 방식의 문제:</p>
    <ul>
      <li><b>균등 랜덤</b>: 점끼리 서로 독립임. 그래서 <b>뭉침(clumping)</b>과 빈 공간이 생김(나무가 겹쳐 보임).</li>
      <li><b>지터 그리드</b>: 격자 칸마다 점 하나를 흔들어 놓음. 고르지만 지터가 작으면 격자가 보이고, 크면 칸 경계에서 겹침이 보임.</li>
    </ul>
    <p><b>Bridson(2007)</b> 동작 원리:</p>
    <ul>
      <li>배경 격자를 둠. 셀 크기가 r/√2라서 셀마다 점이 최대 1개.</li>
      <li><i>활성 목록</i>에서 점 하나를 고름.</li>
      <li>그 점 둘레 [r, 2r] 고리에서 후보를 최대 k번 뽑음.</li>
      <li>근처 셀만 검사해 r보다 가까운 점이 없으면 후보를 추가함.</li>
      <li>k번 모두 실패하면 그 점을 활성 목록에서 뺌.</li>
    </ul>
    <p>공정하게 비교하려고 랜덤과 지터 그리드는 포아송 결과와 같은 개수를 뿌림.</p>`,
  // 도식: Bridson 알고리즘 한 단계. 활성 점 둘레 [r, 2r] 고리에서 후보를 뽑고 근처 셀만 검사함
  diagram: (L) => {
    let grid = '';
    for (let x = 20; x <= 290; x += 30) grid += `<line x1="${x}" y1="10" x2="${x}" y2="190" class="d-dim" opacity="0.5"/>`;
    for (let y = 10; y <= 190; y += 30) grid += `<line x1="20" y1="${y}" x2="290" y2="${y}" class="d-dim" opacity="0.5"/>`;
    const item = (y, sym, ko, en) => `${sym}<text x="318" y="${y + 4}" class="t-small">${L(ko, en)}</text>`;
    return `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    ${grid}
    <circle cx="140" cy="100" r="42" class="d-accent" stroke-dasharray="4 3"/>
    <circle cx="140" cy="100" r="84" class="d-accent" stroke-dasharray="4 3"/>
    ${[[95, 60], [200, 150], [60, 150], [250, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" class="f-b"/>`).join('')}
    <line x1="140" y1="100" x2="140" y2="59" class="d-accent" stroke-width="1.2" marker-end="url(#arr)"/>
    <text x="144" y="82" class="t-small t-mono">r</text>
    <line x1="140" y1="100" x2="57" y2="100" class="d-accent" stroke-width="1.2" marker-end="url(#arr)"/>
    <text x="82" y="95" class="t-small t-mono">2r</text>
    <circle cx="140" cy="100" r="5" class="f-accent"/><circle cx="140" cy="100" r="9" class="d-accent"/>
    <rect x="200" y="70" width="30" height="30" class="d-good" stroke-width="1"/>
    <circle cx="205" cy="85" r="4" class="f-good"/>
    <line x1="175" y1="140" x2="200" y2="150" class="d-bad" stroke-width="1.2"/>
    <circle cx="175" cy="140" r="4" class="f-bad"/>
    ${item(24, '<circle cx="306" cy="24" r="5" class="f-accent"/>', '활성 점 (활성 목록에서 고름)', 'active point (from the active list)')}
    ${item(48, '<circle cx="306" cy="48" r="6" class="d-accent" stroke-dasharray="3 2"/>', '[r, 2r] 고리에서 후보를 최대 k번 뽑음', 'up to k candidates in the [r, 2r] ring')}
    ${item(72, '<circle cx="306" cy="72" r="4" class="f-good"/>', '근처에 r 안의 점 없음: 추가', 'no point within r: added')}
    ${item(96, '<circle cx="306" cy="96" r="4" class="f-bad"/>', 'r 안에 기존 점 있음: 버림', 'a point within r: rejected')}
    ${item(120, '<rect x="300" y="114" width="12" height="12" class="d-good" stroke-width="1"/>', '셀 크기 r/√2. 셀마다 점 최대 1개', 'cell size r/√2: max one point per cell')}
    ${item(144, '<circle cx="306" cy="144" r="4" class="f-dim"/>', 'k번 모두 실패하면 활성 목록에서 뺌', 'after k failures, drop it from the list')}
    <text x="300" y="180" class="t-small t-dim">${L('근처 셀만 검사하므로 전체 비용 O(N)', 'Only nearby cells are checked: O(N) total')}</text>
  </svg>`;
  },
  look: [
    'A와 B의 빨간 선(거리 < r인 쌍)을 비교하면 A(랜덤)는 수십 개, B(포아송)는 0개. "최소 거리 / r" 수치도 차이가 남.',
    '"생성 과정 애니메이션"을 켜면 B에서 활성 점(밝은 고리)이 경계를 따라 퍼져 나가는 모습이 보임.',
    'A를 지터 그리드로 바꾸고 지터를 0.2 이하로 낮추면 격자 줄이 눈에 띔. 1.0으로 올리면 랜덤처럼 겹침.',
    'B의 시도 횟수 k를 3으로 낮추면 빨리 끝나지만 빈틈이 남아 점 개수가 줄어듦.',
  ],
  refs: [
    { type: 'paper', title: 'Fast Poisson Disk Sampling in Arbitrary Dimensions (Robert Bridson, SIGGRAPH 2007 sketches)', url: 'https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf', year: 2007 },
    { type: 'article', title: 'Mike Bostock: Poisson-Disc Sampling', url: 'https://bost.ocks.org/mike/algorithms/', year: 2014, note: '랜덤, best-candidate, Bridson 비교 시각화.' },
    { type: 'article', title: 'Red Blob Games: Making maps with noise functions (나무 배치 / blue noise 절)', url: 'https://www.redblobgames.com/maps/terrain-from-noise/' },
    { type: 'paper', title: 'Stochastic Sampling in Computer Graphics (Robert L. Cook, ACM TOG 1986)', year: 1986, note: '지터 샘플링과 포아송 디스크 분포의 렌더링 응용.' },
  ],
  params: [
    { key: 'method', label: '배치 방식', type: 'select', group: '배치', options: [
      { value: 'random', label: '균등 랜덤' },
      { value: 'jitter', label: '지터 그리드' },
      { value: 'poisson', label: '포아송 디스크 (Bridson)' },
    ], a: 'random', b: 'poisson' },
    { key: 'radius', label: '최소 거리 r (px)', type: 'range', min: 8, max: 60, step: 1, default: 22, shared: true },
    { key: 'k', label: '시도 횟수 k', type: 'int', min: 1, max: 40, default: 30, when: (p) => p.method === 'poisson' },
    { key: 'jitter', label: '지터 양', type: 'range', min: 0, max: 1, step: 0.01, default: 0.7, when: (p) => p.method === 'jitter' },
    { key: 'animate', label: '생성 과정 애니메이션', type: 'bool', default: true, shared: true, group: '표시' },
    { key: 'speed', label: '애니메이션 속도 (스텝/초)', type: 'range', min: 20, max: 2000, step: 10, default: 240, shared: true, when: (p) => p.animate },
    { key: 'style', label: '그리기', type: 'select', options: [
      { value: 'trees', label: '나무' },
      { value: 'dots', label: '점 + r 원' },
    ], default: 'trees', shared: true },
    { key: 'conflicts', label: '거리 < r 쌍 표시', type: 'bool', default: true, shared: true },
    { key: 'bgGrid', label: '가속 격자 (r/√2)', type: 'bool', default: false, shared: true },
    { key: 'regen', label: '다시 생성', type: 'button', buttonLabel: '다시 생성 (새 시드)' },
  ],
  en: {
    title: 'Poisson Disk Sampling (Bridson): Tree Placement',
    summary: 'Uniform random vs Poisson disk placement. Uniform random makes trees clump and leaves empty spots. Poisson disk keeps a minimum distance r and builds a placement that does not look like a grid, in O(N).',
    views: { a: 'Uniform random', b: 'Poisson disk' },
    controls: 'No input. Press "Regenerate" to build with a new seed.',
    info: `
    <p><b>Poisson disk sampling</b> places random points so that every pair is at least r apart.
    The result is an even "blue noise" spread with no direction. It is used to place objects like trees and rocks.</p>
    <p>Problems with other methods:</p>
    <ul>
      <li><b>Uniform random</b>: points are independent of each other. So you get <b>clumping</b> and empty space (trees look stacked).</li>
      <li><b>Jittered grid</b>: puts one shaken point in each grid cell. It is even, but with small jitter the grid shows, and with large jitter points overlap at cell borders.</li>
    </ul>
    <p>How <b>Bridson (2007)</b> works:</p>
    <ul>
      <li>Keep a background grid. The cell size is r/√2, so each cell holds at most 1 point.</li>
      <li>Pick one point from the <i>active list</i>.</li>
      <li>Draw up to k candidates from the [r, 2r] ring around that point.</li>
      <li>Check only nearby cells. If no point is closer than r, add the candidate.</li>
      <li>If all k tries fail, remove that point from the active list.</li>
    </ul>
    <p>For a fair comparison, random and jittered grid place the same number of points as the Poisson result.</p>`,
    look: [
      'Compare the red lines (pairs closer than r) in A and B. A (random) has dozens. B (Poisson) has 0. The "Min distance / r" value also differs.',
      'Turn on "Animate generation". In B, active points (bright rings) spread out along the border.',
      'Switch A to jittered grid and lower the jitter to 0.2 or less. Grid rows stand out. Raise it to 1.0 and points overlap like random.',
      'Lower B\'s attempts k to 3. It finishes faster, but gaps remain and the point count drops.',
    ],
    refs: [null, 'An animated comparison of random, best-candidate, and Bridson.', { title: 'Red Blob Games: Making maps with noise functions (tree placement / blue noise section)' }, 'Rendering uses of jittered sampling and Poisson disk distributions.'],
    params: {
      method: { label: 'Placement method', group: 'Placement', options: { random: 'Uniform random', jitter: 'Jittered grid', poisson: 'Poisson disk (Bridson)' } },
      radius: 'Min distance r (px)',
      k: 'Attempts k',
      jitter: 'Jitter amount',
      animate: { label: 'Animate generation', group: 'Display' },
      speed: 'Animation speed (steps/s)',
      style: { label: 'Draw as', options: { trees: 'Trees', dots: 'Dots + r circles' } },
      conflicts: 'Show pairs closer than r',
      bgGrid: 'Acceleration grid (r/√2)',
      regen: { label: 'Regenerate', buttonLabel: 'Regenerate (new seed)' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    let regen = 0, key = '', pts = [], steps = 1, progress = 0, stats = {};
    const M = 6; // 가장자리 여백

    function bridson(rng, W, H, r, k) {
      const cs = r / Math.SQRT2, gw = Math.ceil(W / cs), gh = Math.ceil(H / cs);
      const grid = new Int32Array(gw * gh).fill(-1);
      const out = [], active = [];
      let step = 0;
      const add = (x, y) => {
        const p = { x, y, born: step, dead: Infinity };
        grid[Math.floor(y / cs) * gw + Math.floor(x / cs)] = out.length;
        out.push(p); active.push(p);
      };
      add(rng.range(0, W), rng.range(0, H));
      while (active.length) {
        step++;
        const ai = Math.floor(rng.next() * active.length), a = active[ai];
        let found = false;
        for (let t = 0; t < k; t++) {
          const ang = rng.next() * U.TAU, d = r * Math.sqrt(1 + 3 * rng.next()); // [r, 2r] 고리 균등
          const x = a.x + Math.cos(ang) * d, y = a.y + Math.sin(ang) * d;
          if (x < 0 || y < 0 || x >= W || y >= H) continue;
          const gx = Math.floor(x / cs), gy = Math.floor(y / cs);
          let ok = true;
          for (let yy = Math.max(0, gy - 2); yy <= Math.min(gh - 1, gy + 2) && ok; yy++)
            for (let xx = Math.max(0, gx - 2); xx <= Math.min(gw - 1, gx + 2); xx++) {
              const j = grid[yy * gw + xx];
              if (j >= 0 && (out[j].x - x) ** 2 + (out[j].y - y) ** 2 < r * r) { ok = false; break; }
            }
          if (ok) { add(x, y); found = true; break; }
        }
        if (!found) { a.dead = step; active[ai] = active[active.length - 1]; active.pop(); }
      }
      return { pts: out, steps: step + 1 };
    }

    function generate(W, H) {
      const w = W - M * 2, h = H - M * 2, r = P.radius;
      // 개수 기준은 항상 포아송(같은 시드) 결과
      const base = bridson(U.rng(ctx.seed * 7919 + regen * 104729 + 1), w, h, r, 30);
      const n = base.pts.length;
      const rng = U.rng(ctx.seed * 31 + regen * 977 + 5);
      let list;
      if (P.method === 'poisson') {
        const res = P.k === 30 ? base : bridson(U.rng(ctx.seed * 7919 + regen * 104729 + 1), w, h, r, P.k);
        list = res.pts; steps = res.steps;
      } else if (P.method === 'random') {
        list = []; for (let i = 0; i < n; i++) list.push({ x: rng.range(0, w), y: rng.range(0, h), born: i, dead: i + 1 });
        steps = n + 1;
      } else {
        const c = Math.sqrt((w * h) / n), cols = Math.max(1, Math.round(w / c)), rows = Math.max(1, Math.round(h / c));
        const cw = w / cols, ch = h / rows;
        list = []; let i = 0;
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++, i++) {
          const jx = (rng.next() - 0.5) * P.jitter, jy = (rng.next() - 0.5) * P.jitter;
          list.push({ x: (x + 0.5 + jx) * cw, y: (y + 0.5 + jy) * ch, born: i, dead: i + 1 });
        }
        steps = list.length + 1;
      }
      for (const p of list) { p.x += M; p.y += M; p.hue = 85 + rng.range(-25, 25); p.s = rng.range(0.8, 1.15); }
      pts = list;
      progress = P.animate ? 0 : steps;
      computeStats(r);
    }

    // 최근접 이웃 거리 / 충돌 쌍 (공간 해시)
    let pairs = [];
    function computeStats(r) {
      const cs = r, map = new Map();
      pts.forEach((p, i) => {
        const k = Math.floor(p.x / cs) + ',' + Math.floor(p.y / cs);
        if (!map.has(k)) map.set(k, []); map.get(k).push(i);
      });
      pairs = [];
      let minD = Infinity, sum = 0, sum2 = 0, cnt = 0;
      pts.forEach((p, i) => {
        const gx = Math.floor(p.x / cs), gy = Math.floor(p.y / cs);
        let nn = Infinity;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const arr = map.get(gx + dx + ',' + (gy + dy)); if (!arr) continue;
          for (const j of arr) if (j !== i) {
            const d = Math.hypot(pts[j].x - p.x, pts[j].y - p.y);
            if (d < nn) nn = d;
            if (j > i && d < r) pairs.push([i, j]);
          }
        }
        if (nn < Infinity) { minD = Math.min(minD, nn); sum += nn; sum2 += nn * nn; cnt++; }
      });
      const mean = cnt ? sum / cnt : 0;
      stats = { minD, mean, cv: cnt && mean ? Math.sqrt(Math.max(0, sum2 / cnt - mean * mean)) / mean : 0 };
    }

    function drawTree(g, p, r, alpha) {
      const R = r * 0.42 * p.s;
      g.globalAlpha = alpha;
      D.circle(g, p.x + R * 0.25, p.y + R * 0.3, R, 'rgba(0,0,0,0.35)');
      D.circle(g, p.x, p.y, R, U.hsl(p.hue, 45, 30));
      D.circle(g, p.x - R * 0.25, p.y - R * 0.25, R * 0.6, U.hsl(p.hue, 50, 42));
      g.globalAlpha = 1;
    }

    return {
      update(dt) { if (P.animate && progress < steps) progress = Math.min(steps, progress + P.speed * dt); },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const k = [P.method, P.radius, P.k, P.jitter, regen, W, H].join('|');
        if (k !== key) { generate(W, H); key = k; } // 파라미터에서 파생된 캐시 재생성
        const col = ctx.side === 'a' ? C.a : C.b, r = P.radius;
        D.clear(g, W, H, '#1d2a1c');
        if (P.bgGrid) D.grid(g, W, H, r / Math.SQRT2, 'rgba(255,255,255,0.08)', M, M);
        const s = P.animate ? progress : steps;
        let shown = 0, act = 0;
        for (const p of pts) {
          if (p.born > s) continue;
          shown++;
          const active = p.dead > s;
          if (active && s < steps) act++;
          if (P.style === 'trees') drawTree(g, p, r, 1);
          else { D.circle(g, p.x, p.y, r / 2, null, 'rgba(255,255,255,0.12)'); D.circle(g, p.x, p.y, 2.2, C.text); }
          if (active && s < steps && P.method === 'poisson') D.circle(g, p.x, p.y, r * 0.5, null, col, 1.5);
        }
        if (P.conflicts) {
          g.beginPath();
          for (const [i, j] of pairs) {
            if (pts[i].born > s || pts[j].born > s) continue;
            g.moveTo(pts[i].x, pts[i].y); g.lineTo(pts[j].x, pts[j].y);
          }
          g.strokeStyle = C.bad; g.lineWidth = 2; g.stroke();
        }
        if (s < steps) D.text(g, GTL.L(`생성 중… ${Math.floor((s / steps) * 100)}%`, `Generating… ${Math.floor((s / steps) * 100)}%`), 8, 8, { color: col });
        ctx.stat(GTL.L('점 개수', 'Points'), `${shown} / ${pts.length}`);
        if (P.method === 'poisson' && s < steps) ctx.stat(GTL.L('활성 목록', 'Active list'), act);
        ctx.stat(GTL.L('거리 < r 쌍', 'Pairs closer than r'), pairs.length);
        ctx.stat(GTL.L('최소 거리 / r', 'Min distance / r'), (stats.minD / r).toFixed(2));
        ctx.stat(GTL.L('최근접 거리 변동계수', 'Nearest distance CV'), stats.cv.toFixed(3));
      },
      onAction(key) { if (key === 'regen') regen++; },
    };
  },
});
