// 오브젝트 배치: 균등 랜덤 vs Unreal PCG 프레임워크 방식의 포인트 파이프라인
GTL.register({
  id: 'pcg-scatter',
  title: 'PCG 포인트 파이프라인 (Unreal PCG Framework): 나무와 바위 배치',
  summary: '균등 랜덤 배치 vs PCG 노드 파이프라인 비교. 균등 랜덤은 오브젝트가 겹치고 도로 위에도 놓임. PCG 파이프라인은 점을 만든 뒤 밀도, 도로 제외, 겹침 제거를 차례로 거쳐 숲 덩어리와 빈 도로를 만듦.',
  views: { a: '균등 랜덤', b: 'PCG 파이프라인' },
  controls: '조작 없음. B의 단계를 하나씩 끄고 켜며 결과를 비교함. "다시 생성"을 누르면 새 시드로 만듦.',
  info: `
    <p><b>PCG 프레임워크</b>(Procedural Content Generation): Unreal Engine 5의 절차적 배치 도구.
    그래프의 노드가 <b>점 데이터</b>(위치, 밀도, 크기, 회전)를 받아 고친 뒤 다음 노드로 넘김. 마지막에 점마다 메시를 놓음.</p>
    <p>점을 균등 랜덤으로 한 번에 뿌리면 문제가 생김:</p>
    <ul>
      <li>나무끼리 겹침.</li>
      <li>도로 위에도 나무가 놓임.</li>
      <li>숲과 빈터 구분 없이 고르게 흩어져 자연스럽지 않음.</li>
    </ul>
    <p>이 샘플의 파이프라인(노드 순서대로):</p>
    <ul>
      <li><b>Surface Sampler</b>: 지면에 격자 칸마다 점 하나를 흔들어 놓음(Looseness).</li>
      <li><b>Density Noise</b>: 점마다 노이즈 값을 밀도(0~1)로 넣음.</li>
      <li><b>Density Filter</b>: 밀도가 임계값보다 낮은 점을 버림. 숲 덩어리와 빈터가 생김.</li>
      <li><b>Difference</b>: 도로 스플라인 근처 점을 뺌(차집합).</li>
      <li><b>Self Pruning</b>: 점의 경계(Bounds)가 겹치면 큰 점부터 남기고 작은 점을 버림.</li>
      <li><b>Transform Points</b>: 남은 점에 무작위 크기와 회전을 줌.</li>
    </ul>
    <p>단점: 노드 순서가 결과를 바꿈. Transform Points가 크기를 키우면 Pruning 뒤에 다시 겹칠 수 있음.
    그래서 최대 배율을 1 이하로 두거나 크기를 먼저 정한 뒤 Pruning을 함.</p>`,
  // 도식: PCG 노드 6개를 거치며 줄어드는 점 개수 (예시 값)
  diagram: (L) => `<svg viewBox="0 0 540 206" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr-pcg" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    ${[
      ['Surface', 'Sampler', L('격자 + 지터', 'jittered grid'), ''],
      ['Density', 'Noise', L('밀도 = 노이즈', 'set density'), ''],
      ['Density', 'Filter', L('밀도 &lt; t 제거', 'remove d &lt; t'), ''],
      ['Difference', '', L('도로 근처 제거', 'minus road'), ''],
      ['Self', 'Pruning', L('겹침 제거', 'drop overlaps'), L('큰 것 우선', 'larger first')],
      ['Transform', 'Points', L('무작위 크기', 'random scale'), L('무작위 회전', 'random yaw')],
    ].map(([n1, n2, s1, s2], i) => {
      const x = 5 + i * 90;
      return `<rect x="${x}" y="8" width="80" height="64" rx="4" class="f-dim"/>
      <text x="${x + 40}" y="24" text-anchor="middle">${n1}</text>
      ${n2 ? `<text x="${x + 40}" y="37" text-anchor="middle">${n2}</text>` : ''}
      <text x="${x + 40}" y="52" text-anchor="middle" class="t-small t-dim">${s1}</text>
      ${s2 ? `<text x="${x + 40}" y="64" text-anchor="middle" class="t-small t-dim">${s2}</text>` : ''}
      ${i < 5 ? `<line x1="${x + 81}" y1="40" x2="${x + 89}" y2="40" class="d-accent" marker-end="url(#arr-pcg)"/>` : ''}`;
    }).join('')}
    ${[300, 300, 168, 140, 104, 104].map((n, i, a) => {
      const x = 5 + i * 90, h = (n / 300) * 46, d = i > 0 ? a[i - 1] - n : 0;
      return `<rect x="${x + 22}" y="${150 - h}" width="36" height="${h}" class="f-b"${i === 1 ? ' opacity="0.55"' : ''}/>
      <text x="${x + 40}" y="${146 - h}" text-anchor="middle" class="t-mono">${n}</text>
      <text x="${x + 40}" y="164" text-anchor="middle" class="t-small t-dim">${d > 0 ? '-' + d : i === 1 ? L('개수 같음', 'same count') : i === 5 ? L('개수 같음', 'same count') : L('점 개수', 'points')}</text>`;
    }).join('')}
    <line x1="5" y1="150" x2="535" y2="150" class="d-dim"/>
    <rect x="5" y="180" width="12" height="12" class="f-a"/>
    <text x="22" y="190">${L('A 균등 랜덤: 300개 그대로 남아 겹침과 도로 위 배치 발생', 'A uniform random: all 300 stay, so objects overlap and sit on the road')}</text>
    <text x="22" y="203" class="t-small t-dim">${L('막대 값은 기본값 예시. 실제 개수는 뷰의 측정값 참고', 'Bar values are an example. See the view stats for real counts')}</text>
  </svg>`,
  look: [
    'A와 B를 비교하면 A는 도로 위에 나무가 있고 빨간 테두리(겹침)가 많음. B는 도로가 비고 겹침 쌍이 0개.',
    'B에서 "Density Filter"를 끄면 숲 덩어리가 사라지고 지면 전체가 고르게 채워짐. "남은 점" 수치가 크게 늘어남.',
    'B에서 "Self Pruning"을 끄고 나무 크기를 키우면 겹침 쌍 수치가 다시 올라감.',
    'B에서 Transform 최대 배율을 1.5로 올리면 Pruning 뒤에 커진 나무끼리 다시 겹침. 노드 순서의 영향이 보임.',
    '밀도 임계값을 올리면 숲이 작은 섬으로 쪼개지고, 내리면 빈터가 줄어듦.',
  ],
  refs: [
    { type: 'engine', title: 'Unreal Engine: Procedural Content Generation Overview', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/procedural-content-generation-overview', note: 'PCG 그래프, 점 데이터, 노드 실행 흐름 소개.' },
    { type: 'engine', title: 'Unreal Engine: Procedural Content Generation Framework Node Reference', note: 'Surface Sampler, Density Filter, Difference, Self Pruning, Transform Points 노드 설명.' },
    { type: 'talk', title: 'Electric Dreams Environment (Unreal Engine 5.2 PCG 시연, GDC 2023 State of Unreal)', year: 2023, note: '큰 숲 환경을 PCG 그래프로 배치한 Epic 시연.' },
    { type: 'paper', title: 'Fast Poisson Disk Sampling in Arbitrary Dimensions (Robert Bridson, SIGGRAPH 2007 sketches)', url: 'https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf', year: 2007, note: '최소 거리 배치의 다른 방법. Self Pruning과 목적이 같음.' },
  ],
  params: [
    { key: 'mode', label: '배치 방식', type: 'select', group: '배치', options: [
      { value: 'uniform', label: '균등 랜덤' },
      { value: 'pcg', label: 'PCG 파이프라인' },
    ], a: 'uniform', b: 'pcg' },
    { key: 'density', label: '샘플러 밀도 (100px² 당 점)', type: 'range', min: 4, max: 40, step: 1, default: 16, shared: true, help: 'Surface Sampler의 Points Per Squared Meter에 해당. A도 같은 개수를 뿌림' },
    { key: 'treeSize', label: '나무 크기 (px)', type: 'range', min: 4, max: 20, step: 0.5, default: 9, shared: true, help: '나무 경계 반지름. 바위는 이 값의 55%' },
    { key: 'useNoise', label: 'Density Noise', type: 'bool', default: true, group: 'PCG 단계', when: (p) => p.mode === 'pcg', help: '점마다 노이즈 값을 밀도로 넣음' },
    { key: 'noiseScale', label: '노이즈 크기 (px)', type: 'range', min: 40, max: 300, step: 5, default: 130, when: (p) => p.mode === 'pcg' && p.useNoise },
    { key: 'useFilter', label: 'Density Filter', type: 'bool', default: true, when: (p) => p.mode === 'pcg', help: '밀도가 임계값보다 낮은 점을 버림' },
    { key: 'threshold', label: '밀도 임계값', type: 'range', min: 0, max: 1, step: 0.01, default: 0.5, when: (p) => p.mode === 'pcg' && p.useFilter },
    { key: 'useDiff', label: 'Difference (도로 제외)', type: 'bool', default: true, when: (p) => p.mode === 'pcg', help: '도로 스플라인 근처 점을 뺌' },
    { key: 'roadWidth', label: '도로 폭 (px)', type: 'range', min: 10, max: 80, step: 1, default: 34, shared: true },
    { key: 'usePrune', label: 'Self Pruning', type: 'bool', default: true, when: (p) => p.mode === 'pcg', help: '경계가 겹치면 큰 점부터 남김' },
    { key: 'useTransform', label: 'Transform Points', type: 'bool', default: true, when: (p) => p.mode === 'pcg', help: '무작위 크기와 회전' },
    { key: 'scaleMin', label: '최소 배율', type: 'range', min: 0.3, max: 1.5, step: 0.05, default: 0.65, when: (p) => p.mode === 'pcg' && p.useTransform },
    { key: 'scaleMax', label: '최대 배율', type: 'range', min: 0.3, max: 1.5, step: 0.05, default: 1.0, when: (p) => p.mode === 'pcg' && p.useTransform },
    { key: 'showRemoved', label: '제거된 점 표시', type: 'bool', default: true, shared: true, group: '표시', help: '단계별 색: 회색 Density Filter, 빨강 Difference, 노랑 Self Pruning' },
    { key: 'showDensity', label: '밀도 노이즈 표시', type: 'bool', default: true, shared: true },
    { key: 'markIssues', label: '겹침, 도로 침범 표시', type: 'bool', default: true, shared: true },
    { key: 'regen', label: '다시 생성', type: 'button', buttonLabel: '다시 생성 (새 시드)' },
  ],
  en: {
    title: 'PCG Point Pipeline (Unreal PCG Framework): Tree and Rock Scatter',
    summary: 'Uniform random scatter vs a PCG node pipeline. Uniform random makes objects overlap and puts them on the road. The PCG pipeline makes points, then runs density, road exclusion, and overlap removal in order. You get forest clumps and a clear road.',
    views: { a: 'Uniform random', b: 'PCG pipeline' },
    controls: 'No input. Turn the stages of B off and on one by one and compare. Press "Regenerate" to build with a new seed.',
    info: `
    <p>The <b>PCG Framework</b> (Procedural Content Generation) is the procedural placement tool in Unreal Engine 5.
    Each node in a graph takes <b>point data</b> (position, density, size, rotation), changes it, and passes it to the next node. At the end, a mesh is placed at each point.</p>
    <p>Scattering points uniformly at random in one go causes problems:</p>
    <ul>
      <li>Trees overlap each other.</li>
      <li>Trees also land on the road.</li>
      <li>Objects spread evenly with no forest or clearing, so it does not look natural.</li>
    </ul>
    <p>The pipeline in this sample (in node order):</p>
    <ul>
      <li><b>Surface Sampler</b>: puts one shaken point in each grid cell on the ground (Looseness).</li>
      <li><b>Density Noise</b>: writes a noise value into each point as its density (0~1).</li>
      <li><b>Density Filter</b>: drops points whose density is below a threshold. Forest clumps and clearings appear.</li>
      <li><b>Difference</b>: subtracts the points near the road spline.</li>
      <li><b>Self Pruning</b>: when point bounds overlap, it keeps the larger point and drops the smaller one.</li>
      <li><b>Transform Points</b>: gives the remaining points a random scale and rotation.</li>
    </ul>
    <p>Downside: node order changes the result. If Transform Points makes objects larger, they can overlap again after pruning.
    So keep the max scale at 1 or less, or set the size before pruning.</p>`,
    look: [
      'Compare A and B. A has trees on the road and many red outlines (overlaps). B has a clear road and 0 overlapping pairs.',
      'In B, turn off "Density Filter". The forest clumps disappear and the whole ground fills evenly. The "Points left" value rises a lot.',
      'In B, turn off "Self Pruning" and raise the tree size. The overlapping pairs value goes up again.',
      'In B, raise the Transform max scale to 1.5. Trees that grew after pruning overlap again. This shows why node order matters.',
      'Raise the density threshold and the forest breaks into small islands. Lower it and the clearings shrink.',
    ],
    refs: ['An introduction to PCG graphs, point data, and how nodes run.', 'Describes the Surface Sampler, Density Filter, Difference, Self Pruning, and Transform Points nodes.', { title: 'Electric Dreams Environment (Unreal Engine 5.2 PCG demo, GDC 2023 State of Unreal)', note: 'An Epic demo that places a large forest with a PCG graph.' }, 'Another way to place objects with a minimum distance. It has the same goal as Self Pruning.'],
    params: {
      mode: { label: 'Placement method', group: 'Placement', options: { uniform: 'Uniform random', pcg: 'PCG pipeline' } },
      density: { label: 'Sampler density (points per 100px²)', help: 'Like Points Per Squared Meter in Surface Sampler. A scatters the same number of points' },
      treeSize: { label: 'Tree size (px)', help: 'Tree bounds radius. Rocks are 55% of this value' },
      useNoise: { label: 'Density Noise', group: 'PCG stages', help: 'Writes a noise value into each point as its density' },
      noiseScale: 'Noise size (px)',
      useFilter: { label: 'Density Filter', help: 'Drops points with density below the threshold' },
      threshold: 'Density threshold',
      useDiff: { label: 'Difference (road exclusion)', help: 'Subtracts points near the road spline' },
      roadWidth: 'Road width (px)',
      usePrune: { label: 'Self Pruning', help: 'When bounds overlap, keep the larger point' },
      useTransform: { label: 'Transform Points', help: 'Random scale and rotation' },
      scaleMin: 'Min scale',
      scaleMax: 'Max scale',
      showRemoved: { label: 'Show removed points', group: 'Display', help: 'Color by stage: gray Density Filter, red Difference, yellow Self Pruning' },
      showDensity: 'Show density noise',
      markIssues: 'Mark overlaps and road hits',
      regen: { label: 'Regenerate', buttonLabel: 'Regenerate (new seed)' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    let regen = 0, key = '', road = [], all = [], final = [], counts = {}, issues = { pairs: 0, onRoad: 0 }, bad = new Set();
    let densCanvas = null;

    // 도로 스플라인: Catmull-Rom 곡선을 폴리라인으로 샘플링
    function makeRoad(rng, W, H) {
      const cp = [-0.08, 0.22, 0.5, 0.78, 1.08].map((t) => ({ x: t * W, y: H * (0.5 + rng.range(-0.28, 0.28)) }));
      const out = [];
      for (let i = 0; i < cp.length - 1; i++) {
        const p0 = cp[Math.max(0, i - 1)], p1 = cp[i], p2 = cp[i + 1], p3 = cp[Math.min(cp.length - 1, i + 2)];
        for (let s = 0; s < 30; s++) {
          const t = s / 30, t2 = t * t, t3 = t2 * t;
          const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
          out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
        }
      }
      out.push(cp[cp.length - 1]);
      return out;
    }
    function roadDist(x, y) {
      let best = Infinity;
      for (let i = 0; i < road.length - 1; i++) {
        const a = road[i], b = road[i + 1], dx = b.x - a.x, dy = b.y - a.y;
        const t = U.clamp(((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
        const d = Math.hypot(x - a.x - dx * t, y - a.y - dy * t);
        if (d < best) best = d;
      }
      return best;
    }

    // 경계 원끼리 겹치는 쌍 세기 (공간 해시)
    function overlapPairs(list, cell) {
      const map = new Map(), hit = new Set();
      let n = 0;
      list.forEach((p, i) => {
        const k = Math.floor(p.x / cell) + ',' + Math.floor(p.y / cell);
        if (!map.has(k)) map.set(k, []); map.get(k).push(i);
      });
      list.forEach((p, i) => {
        const gx = Math.floor(p.x / cell), gy = Math.floor(p.y / cell);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const arr = map.get(gx + dx + ',' + (gy + dy)); if (!arr) continue;
          for (const j of arr) if (j > i) {
            const q = list[j], r = p.ext * p.scale + q.ext * q.scale;
            if ((p.x - q.x) ** 2 + (p.y - q.y) ** 2 < r * r) { n++; hit.add(p); hit.add(q); }
          }
        }
      });
      return { n, hit };
    }

    function generate(W, H) {
      const seed = ctx.seed * 131 + regen * 7919;
      road = makeRoad(U.rng(seed + 3), W, H);
      const rng = U.rng(seed + 11), noise = U.noise(seed + 17);
      const cell = Math.sqrt(10000 / P.density);
      const cols = Math.max(1, Math.floor(W / cell)), rows = Math.max(1, Math.floor(H / cell));
      const cw = W / cols, ch = H / rows;
      const tR = P.treeSize;
      const pcg = P.mode === 'pcg';
      // 1. Surface Sampler (A는 같은 개수를 균등 랜덤으로)
      all = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const tree = rng.next() < 0.65;
        const p = {
          x: pcg ? (x + 0.5 + (rng.next() - 0.5)) * cw : 0, y: pcg ? (y + 0.5 + (rng.next() - 0.5)) * ch : 0,
          tree, ext: (tree ? tR : tR * 0.55) * rng.range(0.9, 1.1), hue: 85 + rng.range(-25, 25),
          sr: rng.next(), rr: rng.next(), density: 1, scale: 1, rot: 0, removed: null,
        };
        all.push(p);
      }
      if (!pcg) for (const p of all) { p.x = rng.range(0, W); p.y = rng.range(0, H); }
      counts = { sampler: all.length };
      let pts = all.slice();
      if (pcg) {
        // 2. Density Noise
        if (P.useNoise) for (const p of pts) p.density = U.clamp(0.5 + noise.fbm2(p.x / P.noiseScale, p.y / P.noiseScale, { octaves: 3 }) * 1.4, 0, 1);
        counts.noise = pts.length;
        // 3. Density Filter
        if (P.useFilter) pts = pts.filter((p) => (p.density >= P.threshold ? true : ((p.removed = 'filter'), false)));
        counts.filter = pts.length;
        // 4. Difference: 도로 스플라인 근처 제외
        if (P.useDiff) pts = pts.filter((p) => (roadDist(p.x, p.y) >= P.roadWidth / 2 + p.ext ? true : ((p.removed = 'diff'), false)));
        counts.diff = pts.length;
        // 5. Self Pruning (Large to Small): 큰 경계부터 남기고 겹치는 작은 점 버림
        if (P.usePrune) {
          const order = pts.slice().sort((a, b) => b.ext - a.ext);
          const cs = tR * 2.4, map = new Map(), kept = [];
          for (const p of order) {
            const gx = Math.floor(p.x / cs), gy = Math.floor(p.y / cs);
            let ok = true;
            for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1 && ok; dx++) {
              const arr = map.get(gx + dx + ',' + (gy + dy)); if (!arr) continue;
              for (const q of arr) { const r = p.ext + q.ext; if ((p.x - q.x) ** 2 + (p.y - q.y) ** 2 < r * r) { ok = false; break; } }
            }
            if (ok) { const k = gx + ',' + gy; if (!map.has(k)) map.set(k, []); map.get(k).push(p); kept.push(p); }
            else p.removed = 'prune';
          }
          const keep = new Set(kept);
          pts = pts.filter((p) => keep.has(p));
        }
        counts.prune = pts.length;
        // 6. Transform Points: 무작위 크기, 회전 (점마다 미리 뽑은 난수 사용)
        if (P.useTransform) {
          const lo = Math.min(P.scaleMin, P.scaleMax), hi = Math.max(P.scaleMin, P.scaleMax);
          for (const p of pts) { p.scale = U.lerp(lo, hi, p.sr); p.rot = p.rr * U.TAU; }
        }
      }
      final = pts;
      const ov = overlapPairs(final, tR * 2 * Math.max(1, P.scaleMax));
      bad = ov.hit;
      let onRoad = 0;
      for (const p of final) if (roadDist(p.x, p.y) < P.roadWidth / 2 + p.ext * p.scale) { onRoad++; bad.add(p); }
      issues = { pairs: ov.n, onRoad };
      // 밀도 노이즈 오버레이 (재생성할 때만 그림)
      densCanvas = null;
      if (pcg && P.useNoise) {
        const s = 6, w = Math.max(1, Math.ceil(W / s)), h = Math.max(1, Math.ceil(H / s));
        densCanvas = ctx.createCanvas(w, h);
        const dg = densCanvas.getContext('2d'), img = dg.createImageData(w, h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const d = U.clamp(0.5 + noise.fbm2((x * s) / P.noiseScale, (y * s) / P.noiseScale, { octaves: 3 }) * 1.4, 0, 1);
          const pass = !P.useFilter || d >= P.threshold, i = (y * w + x) * 4;
          img.data[i] = 20 + d * 30; img.data[i + 1] = 40 + d * 60; img.data[i + 2] = 25 + d * 20; img.data[i + 3] = pass ? 120 : 60;
        }
        dg.putImageData(img, 0, 0);
      }
    }

    function drawObj(g, p) {
      const R = p.ext * p.scale;
      if (p.tree) {
        const ox = Math.cos(p.rot) * R * 0.28, oy = Math.sin(p.rot) * R * 0.28;
        D.circle(g, p.x + R * 0.25, p.y + R * 0.3, R, 'rgba(0,0,0,0.35)');
        D.circle(g, p.x, p.y, R, U.hsl(p.hue, 45, 30));
        D.circle(g, p.x - ox, p.y - oy, R * 0.6, U.hsl(p.hue, 50, 42));
      } else {
        const pts = [];
        for (let k = 0; k < 5; k++) { const a = p.rot + (k / 5) * U.TAU; const rr = R * (k % 2 ? 0.8 : 1); pts.push({ x: p.x + Math.cos(a) * rr, y: p.y + Math.sin(a) * rr }); }
        D.poly(g, pts, '#8a8f96', '#5d6268', 1, true);
      }
    }

    return {
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const k = [P.mode, P.density, P.treeSize, P.useNoise, P.noiseScale, P.useFilter, P.threshold, P.useDiff, P.roadWidth,
          P.usePrune, P.useTransform, P.scaleMin, P.scaleMax, regen, W, H].join('|');
        if (k !== key) { generate(W, H); key = k; } // 파라미터에서 파생된 캐시 재생성
        const pcg = P.mode === 'pcg';
        D.clear(g, W, H, '#1d2a1c');
        if (P.showDensity && densCanvas) { g.imageSmoothingEnabled = true; g.drawImage(densCanvas, 0, 0, W, H); }
        // 도로
        g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath(); road.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
        g.strokeStyle = '#6b5a43'; g.lineWidth = P.roadWidth; g.stroke();
        g.setLineDash([8, 8]); g.strokeStyle = 'rgba(255,240,200,0.35)'; g.lineWidth = 1.5; g.stroke(); g.setLineDash([]);
        // 제거된 점: 단계별 색
        if (P.showRemoved && pcg) {
          const sc = { filter: 'rgba(200,200,200,0.35)', diff: C.bad, prune: C.warn };
          for (const p of all) if (p.removed) {
            const c = sc[p.removed], s = 2.5;
            D.line(g, p.x - s, p.y - s, p.x + s, p.y + s, c, 1.2); D.line(g, p.x - s, p.y + s, p.x + s, p.y - s, c, 1.2);
          }
        }
        for (const p of final) if (!p.tree) drawObj(g, p);
        for (const p of final) if (p.tree) drawObj(g, p);
        if (P.markIssues) for (const p of bad) D.circle(g, p.x, p.y, p.ext * p.scale + 1.5, null, C.bad, 1.5);

        if (pcg) {
          const st = (on, ko, en, n) => ctx.stat(GTL.L(ko, en), on ? n : `${n} (${GTL.L('끔', 'off')})`);
          ctx.stat(GTL.L('1 Surface Sampler', '1 Surface Sampler'), counts.sampler);
          st(P.useNoise, '2 Density Noise', '2 Density Noise', counts.noise);
          st(P.useFilter, '3 Density Filter', '3 Density Filter', counts.filter);
          st(P.useDiff, '4 Difference', '4 Difference', counts.diff);
          st(P.usePrune, '5 Self Pruning', '5 Self Pruning', counts.prune);
        } else ctx.stat(GTL.L('뿌린 점', 'Points scattered'), counts.sampler);
        ctx.stat(GTL.L('남은 점', 'Points left'), final.length);
        ctx.stat(GTL.L('겹침 쌍', 'Overlapping pairs'), issues.pairs);
        ctx.stat(GTL.L('도로 침범', 'On the road'), issues.onRoad);
      },
      onAction(key) { if (key === 'regen') regen++; },
    };
  },
});
