// 강 생성: 노이즈 능선을 강으로 쓰기 vs 경사 하강 흐름 누적(D8 + Priority-Flood 웅덩이 채우기)
GTL.register({
  id: 'river-flow',
  title: '강 생성: 흐름 누적 vs 노이즈 강',
  summary: '노이즈 강 vs 흐름 누적 강 비교. 노이즈 값이 0 근처인 곳을 강으로 그리면 산을 넘고 중간에 끊김. 빗물이 낮은 쪽으로 흐르는 양을 누적하면 강이 합류하며 굵어지고 모두 해안까지 이어짐.',
  views: { a: '노이즈 강', b: '흐름 누적 + 웅덩이 채우기' },
  controls: '마우스를 올리면 그 칸에 떨어진 빗물이 흘러가는 길 표시',
  info: `
    <p><b>노이즈 강</b>: 두 번째 노이즈의 절댓값이 작은 칸(0을 지나는 선)을 강으로 칠함. 구불구불한 선이 쉽게 나옴.
    하지만 지형 높이와 상관이 없음. 강이 산등성이를 넘고, 바다에 닿지 않은 채 끝나거나 고리 모양이 됨.</p>
    <p><b>흐름 누적(Flow Accumulation)</b>:</p>
    <ol>
      <li>칸마다 이웃 8칸 중 가장 낮은 칸으로 흐름 방향을 정함(D8)</li>
      <li>모든 칸에 빗물 1을 떨어뜨림. 높은 칸부터 차례로 자기 물을 아래 칸에 넘김.</li>
      <li>받은 물이 기준보다 많은 칸이 강. 물이 많을수록 굵게 그림.</li>
    </ol>
    <p><b>웅덩이 채우기(Priority-Flood)</b>: 노이즈 지형에는 사방이 높은 구덩이가 많음. 물이 여기에 갇히면 강이 중간에 끝남.
    바다에서 시작해 낮은 칸부터 넓혀 가며, 주변보다 낮은 칸을 아주 조금씩 높여 채움. 채운 자리는 호수가 됨.</p>
    <p>단점: D8은 방향이 8개뿐이라 평지에서 강이 직선과 45° 꺾임으로 보임. 실제 게임은 여러 방향으로 나눠 흘리거나(MFD), 강 경로를 매끄럽게 다듬음.</p>`,
  // 도식: D8 흐름 방향과 빗물 누적 (B), 웅덩이에서 끊기는 강과 Priority-Flood로 채운 호수
  diagram: (L) => {
    const Hh = [[9, 8, 7, 6], [8, 6, 5, 3], [7, 5, 2, 0]], cs = 40, ox = 20, oy = 24;
    const down = [], acc = Hh.map((r) => r.map(() => 1));
    for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) {
      let best = null, bh = Hh[y][x];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if ((dx || dy) && nx >= 0 && ny >= 0 && nx < 4 && ny < 3 && Hh[ny][nx] < bh) { bh = Hh[ny][nx]; best = [nx, ny]; }
      }
      down.push({ x, y, h: Hh[y][x], to: best });
    }
    down.slice().sort((a, b) => b.h - a.h).forEach((c) => { if (c.to) acc[c.to[1]][c.to[0]] += acc[c.y][c.x]; });
    return `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr-rv" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="20" y="16" class="t-small t-dim">${L('작은 숫자 = 높이, 큰 숫자 = 누적 빗물', 'small = height, big = collected rain')}</text>
    ${down.map((c) => {
      const x = ox + c.x * cs, y = oy + c.y * cs, a = acc[c.y][c.x], river = a >= 4;
      return `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" class="${river ? 'f-b' : 'f-dim'}"${river ? ' opacity="0.5"' : ''}/>` +
        `<text x="${x + 3}" y="${y + 10}" class="t-small t-dim">${c.h}</text><text x="${x + 20}" y="${y + 26}" text-anchor="middle" class="t-mono">${a}</text>`;
    }).join('')}
    ${down.filter((c) => c.to).map((c) => {
      const cx = ox + c.x * cs + cs / 2, cy = oy + c.y * cs + cs / 2, tx = ox + c.to[0] * cs + cs / 2, ty = oy + c.to[1] * cs + cs / 2;
      return `<line x1="${cx + (tx - cx) * 0.3}" y1="${cy + (ty - cy) * 0.3}" x2="${cx + (tx - cx) * 0.75}" y2="${cy + (ty - cy) * 0.75}" class="d-b" marker-end="url(#arr-rv)"/>`;
    }).join('')}
    <text x="10" y="164" class="t-small">${L('D8: 가장 낮은 이웃 칸으로 물을 넘김', 'D8: pass water to the lowest neighbor')}</text>
    <text x="10" y="178" class="t-small t-dim">${L('누적이 큰 칸(파랑) = 강', 'cells with high totals (blue) = river')}</text>
    <polygon points="316,96 340,120 380,96" class="f-b" opacity="0.6"/>
    <path d="M260,50 L310,90 L340,120 L380,96 L430,110 L480,130 L530,140" class="d-line"/>
    <line x1="480" y1="140" x2="530" y2="140" class="d-b"/>
    <text x="505" y="156" text-anchor="middle" class="t-small t-b">${L('바다', 'sea')}</text>
    <circle cx="340" cy="114" r="4" class="f-a"/>
    <text x="262" y="20" class="t-a t-small">${L('웅덩이: 물이 갇혀 강이 중간에 끊김', 'Pit: water gets stuck, the river stops')}</text>
    <text x="262" y="34" class="t-b t-small">${L('Priority-Flood로 채우면 호수가 되어 넘쳐흐름', 'Priority-Flood fills it: a lake that spills')}</text>
    <line x1="316" y1="96" x2="380" y2="96" class="d-b" stroke-dasharray="3 2"/>
    <text x="348" y="140" text-anchor="middle" class="t-small t-dim">${L('호수', 'lake')}</text>
    <text x="262" y="178" class="t-small t-dim">${L('바다에서 시작해 낮은 칸부터 채워 나감', 'Start at the sea and fill from the lowest cell')}</text>
  </svg>`;
  },
  look: [
    'A와 B의 "물이 강을 따라 흐르는 칸"을 비교하면 A는 60% 안팎, B는 100%. A의 강은 지형의 경사와 상관없이 그려짐.',
    'B의 웅덩이 채우기를 끄면 "바다에 닿은 강 줄기 비율"이 떨어짐. 강이 내륙 구덩이(빨간 점)에서 끝남.',
    'A에서 산 위에 마우스를 올리면 실제 빗물 길(흰 선)이 노이즈 강을 무시하고 다른 쪽으로 흐름',
    'B의 강 기준을 낮추면 지류가 늘어나 나뭇가지 모양이 됨. 높이면 큰 강 몇 개만 남음.',
    '"흐름 누적 보기"를 켜면 모든 칸의 물 양이 보임. 골짜기를 따라 밝은 선이 모여듦.',
  ],
  refs: [
    { type: 'paper', title: "J. F. O'Callaghan, D. M. Mark: The extraction of drainage networks from digital elevation data", year: 1984, note: 'Computer Vision, Graphics, and Image Processing. D8 흐름 방향과 흐름 누적.' },
    { type: 'paper', title: 'R. Barnes, C. Lehman, D. Mulla: Priority-flood: An optimal depression-filling and watershed-labeling algorithm for digital elevation models', year: 2014, note: 'Computers & Geosciences. 우선순위 큐로 웅덩이를 채우는 방법(ε 기울기 포함).' },
    { type: 'article', title: 'Amit Patel: Polygonal Map Generation for Games', url: 'http://www-cs-students.stanford.edu/~amitp/game-programming/polygon-map-generation/', year: 2010, note: '고도를 따라 내려가는 강과 강 굵기 누적' },
    { type: 'article', title: 'Red Blob Games: Mapgen4', url: 'https://www.redblobgames.com/maps/mapgen4/', note: '강을 흐름 누적으로 만드는 지도 생성기' },
  ],
  params: [
    { key: 'method', label: '강 생성 방식', type: 'select', group: '강', options: [
      { value: 'noise', label: '노이즈 강 (|noise| < 폭)' },
      { value: 'flow', label: '흐름 누적 (D8)' },
    ], a: 'noise', b: 'flow' },
    { key: 'width', label: '노이즈 강 폭', type: 'range', min: 0.004, max: 0.06, step: 0.001, default: 0.014, when: (p) => p.method === 'noise' },
    { key: 'fill', label: '웅덩이 채우기', type: 'bool', default: true, when: (p) => p.method === 'flow' },
    { key: 'threshold', label: '강 기준 (모인 물 칸 수)', type: 'range', min: 5, max: 400, step: 1, default: 60, when: (p) => p.method === 'flow' },
    { key: 'sea', label: '해수면', type: 'range', min: 0.2, max: 0.6, step: 0.01, default: 0.36, shared: true, group: '지형', reset: true },
    { key: 'res', label: '격자 가로 칸 수', type: 'int', min: 80, max: 240, default: 180, shared: true, reset: true },
    { key: 'showAcc', label: '흐름 누적 보기', type: 'bool', default: false, shared: true, group: '표시' },
  ],
  en: {
    title: 'River Generation: Flow Accumulation vs Noise Rivers',
    summary: 'Noise rivers vs flow accumulation rivers. If you draw rivers where a noise value is near 0, they cross mountains and break off. If you add up how much rain flows downhill, rivers merge, grow wider, and all reach the coast.',
    views: { a: 'Noise rivers', b: 'Flow accumulation + pit filling' },
    controls: 'Hover the mouse to show the path rain takes from that cell.',
    info: `
    <p><b>Noise rivers</b>: paint cells where the absolute value of a second noise is small (the zero line) as river. You easily get winding lines.
    But they have nothing to do with terrain height. Rivers cross ridges, end before they reach the sea, or form loops.</p>
    <p><b>Flow accumulation</b>:</p>
    <ol>
      <li>For each cell, set the flow direction to the lowest of its 8 neighbors (D8).</li>
      <li>Drop 1 unit of rain on every cell. Starting from the highest cell, each cell passes its water to the cell below.</li>
      <li>Cells that receive more water than a threshold are river. More water means a wider line.</li>
    </ol>
    <p><b>Pit filling (Priority-Flood)</b>: noise terrain has many pits that are high on all sides. If water gets trapped there, the river ends midway.
    Start from the sea, grow outward from the lowest cells, and raise cells lower than their surroundings by a tiny amount to fill them. Filled areas become lakes.</p>
    <p>Downside: D8 has only 8 directions, so on flat land rivers look like straight lines and 45° turns. Real games split flow in several directions (MFD) or smooth the river paths.</p>`,
    look: [
      'Compare "Cells where water follows the river" in A and B. A is around 60%. B is 100%. A\'s rivers ignore the slope of the terrain.',
      'Turn off pit filling in B. "River systems that reach the sea" drops. Rivers end in inland pits (red dots).',
      'In A, hover over a mountain. The real rain path (white line) ignores the noise river and flows another way.',
      'Lower B\'s river threshold. Tributaries grow into a tree shape. Raise it and only a few large rivers remain.',
      'Turn on "Show flow accumulation". You see the water amount of every cell. Bright lines gather along the valleys.',
    ],
    refs: ['Computer Vision, Graphics, and Image Processing. D8 flow direction and flow accumulation.', 'Computers & Geosciences. Fills pits with a priority queue (with an ε slope).', 'Rivers that run down the elevation, with river width from accumulation.', 'A map generator that builds rivers with flow accumulation.'],
    params: {
      method: { label: 'River method', group: 'Rivers', options: { noise: 'Noise river (|noise| < width)', flow: 'Flow accumulation (D8)' } },
      width: 'Noise river width',
      fill: 'Pit filling',
      threshold: 'River threshold (cells of gathered water)',
      sea: { label: 'Sea level', group: 'Terrain' },
      res: 'Grid width (cells)',
      showAcc: { label: 'Show flow accumulation', group: 'Display' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const N = U.noise(ctx.seed * 53 + 1), N2 = U.noise(ctx.seed * 53 + 2);
    const EPS = 1e-5;
    const DX = [-1, 0, 1, -1, 1, -1, 0, 1], DY = [-1, -1, -1, 0, 0, 1, 1, 1];
    let gw = 0, gh = 0, h = null, filled = null, dir = null, acc = null, river = null, rawDir = null;
    let terrainKey = '', riverKey = '', cv = null, cg = null, img = null, info = {}, pits = [];

    function makeTerrain(W, H) {
      gw = P.res; gh = Math.max(30, Math.round(P.res * H / W));
      const n = gw * gh;
      h = new Float32Array(n); filled = new Float32Array(n); dir = new Int32Array(n); rawDir = new Int32Array(n);
      acc = new Float32Array(n); river = new Uint8Array(n);
      const s = 3.2 / gw;
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
        const nx = (x / gw) * 2 - 1, ny = (y / gh) * 2 - 1;
        const d = Math.min(1, Math.hypot(nx, ny * 0.9));
        const v = 0.5 + 0.6 * N.fbm2(x * s, y * s, { octaves: 5, gain: 0.45 });
        h[y * gw + x] = U.clamp(v * 1.05 - d * d * 0.55 + 0.12, 0, 1);
      }
      // 원래 지형 기준 경사 하강 방향 (마우스 빗물 경로용)
      for (let i = 0; i < n; i++) rawDir[i] = lowest(h, i, false);
    }

    // 가장 낮은 이웃 칸. 자기보다 낮은 이웃이 없으면 -1
    function lowest(arr, i, allowEq) {
      const x = i % gw, y = (i - x) / gw;
      let best = -1, bh = arr[i];
      for (let k = 0; k < 8; k++) {
        const xx = x + DX[k], yy = y + DY[k];
        if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue;
        const j = yy * gw + xx;
        if (arr[j] < bh || (allowEq && arr[j] === bh && best < 0)) { bh = arr[j]; best = j; }
      }
      return best;
    }

    // 최소 힙 (Priority-Flood용)
    function flood() {
      const n = gw * gh, done = new Uint8Array(n);
      const heap = [], hk = [];
      const push = (i, v) => {
        let c = heap.length; heap.push(i); hk.push(v);
        while (c > 0) { const p = (c - 1) >> 1; if (hk[p] <= hk[c]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; [hk[p], hk[c]] = [hk[c], hk[p]]; c = p; }
      };
      const pop = () => {
        const top = heap[0], tv = hk[0], li = heap.pop(), lv = hk.pop();
        if (heap.length) {
          heap[0] = li; hk[0] = lv;
          let c = 0;
          for (;;) {
            const l = c * 2 + 1, r = l + 1; let m = c;
            if (l < heap.length && hk[l] < hk[m]) m = l;
            if (r < heap.length && hk[r] < hk[m]) m = r;
            if (m === c) break;
            [heap[m], heap[c]] = [heap[c], heap[m]]; [hk[m], hk[c]] = [hk[c], hk[m]]; c = m;
          }
        }
        return [top, tv];
      };
      // 바다 칸과 테두리에서 시작
      for (let i = 0; i < n; i++) {
        const x = i % gw, y = (i - x) / gw;
        if (h[i] < P.sea || x === 0 || y === 0 || x === gw - 1 || y === gh - 1) { filled[i] = h[i]; done[i] = 1; push(i, h[i]); }
      }
      while (heap.length) {
        const [i, v] = pop();
        const x = i % gw, y = (i - x) / gw;
        for (let k = 0; k < 8; k++) {
          const xx = x + DX[k], yy = y + DY[k];
          if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue;
          const j = yy * gw + xx;
          if (done[j]) continue;
          done[j] = 1;
          filled[j] = Math.max(h[j], v + EPS);
          push(j, filled[j]);
        }
      }
    }

    function computeRivers() {
      const n = gw * gh;
      pits = [];
      river.fill(0);
      const isSea = (i) => h[i] < P.sea;
      if (P.method === 'flow') {
        if (P.fill) flood(); else filled.set(h);
        for (let i = 0; i < n; i++) dir[i] = isSea(i) ? -1 : lowest(filled, i, false);
        // 높은 칸부터 물을 아래로 넘김
        const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => filled[b] - filled[a]);
        acc.fill(1);
        for (const i of order) if (dir[i] >= 0) acc[dir[i]] += acc[i];
        for (let i = 0; i < n; i++) if (!isSea(i) && acc[i] >= P.threshold) river[i] = 1;
        for (let i = 0; i < n; i++) if (river[i] && dir[i] < 0 && !isSea(i)) pits.push(i);
      } else {
        filled.set(h);
        const s = 3.5 / gw;
        for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
          const i = y * gw + x;
          if (isSea(i)) continue;
          const v = N2.fbm2(x * s + 40, y * s - 20, { octaves: 2 });
          if (Math.abs(v) < P.width) river[i] = 1;
        }
        // 흐름 누적 보기용 값은 원래 지형으로 계산
        const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => h[b] - h[a]);
        acc.fill(1);
        for (const i of order) if (!isSea(i) && rawDir[i] >= 0) acc[rawDir[i]] += acc[i];
      }
      measure();
    }

    // 강 줄기(8방향 연결 덩어리)마다 바다에 닿는지, 오르막 구간 비율, 합류점 수
    function measure() {
      const n = gw * gh, lab = new Int32Array(n).fill(-1), st = [];
      let comps = 0, reach = 0, cells = 0, uphill = 0, lakes = 0, confl = 0, follow = 0;
      const isSea = (i) => h[i] < P.sea;
      for (let i = 0; i < n; i++) {
        if (river[i]) cells++;
        if (!isSea(i) && filled[i] > h[i] + 0.003) lakes++;
        if (!river[i] || lab[i] >= 0) continue;
        let touches = false; st.length = 0; st.push(i); lab[i] = comps;
        while (st.length) {
          const c = st.pop(), x = c % gw, y = (c - x) / gw;
          for (let k = 0; k < 8; k++) {
            const xx = x + DX[k], yy = y + DY[k];
            if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue;
            const j = yy * gw + xx;
            if (isSea(j)) touches = true;
            if (river[j] && lab[j] < 0) { lab[j] = comps; st.push(j); }
          }
        }
        if (touches) reach++;
        comps++;
      }
      // 오르막: 강 칸에서 이웃 강 칸 중 더 낮은(원래 높이) 칸도 바다도 없는 막다른 칸
      for (let i = 0; i < n; i++) {
        if (!river[i]) continue;
        const x = i % gw, y = (i - x) / gw;
        let lower = false, ups = 0;
        for (let k = 0; k < 8; k++) {
          const xx = x + DX[k], yy = y + DY[k];
          if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue;
          const j = yy * gw + xx;
          if (isSea(j) || (river[j] && filled[j] < filled[i])) lower = true;
          if (P.method === 'flow' && river[j] && dir[j] === i) ups++;
        }
        if (!lower) uphill++;
        if (ups >= 2) confl++;
        // 이 칸의 빗물이 실제로 흘러가는 칸(경사 하강)이 강이나 바다인가
        const nx = P.method === 'flow' ? dir[i] : rawDir[i];
        if (nx >= 0 && (river[nx] || isSea(nx))) follow++;
      }
      info = { comps, reach: comps ? (reach / comps) * 100 : 0, cells, stuck: uphill, lakes, confl, follow: cells ? (follow / cells) * 100 : 0 };
    }

    function paint() {
      if (!cv || cv.width !== gw || cv.height !== gh) { cv = ctx.createCanvas(gw, gh); cg = cv.getContext('2d'); img = cg.createImageData(gw, gh); }
      const d = img.data, sea = P.sea;
      let maxA = 1; for (let i = 0; i < acc.length; i++) if (h[i] >= sea && acc[i] > maxA) maxA = acc[i];
      const lmax = Math.log(maxA);
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
        const i = y * gw + x, o = i * 4, v = h[i];
        let r, g, b;
        if (v < sea) { const t = v / sea; r = 20 + 25 * t; g = 45 + 55 * t; b = 95 + 70 * t; }
        else {
          const t = (v - sea) / (1 - sea);
          if (t < 0.04) { r = 205; g = 192; b = 140; }
          else if (t < 0.45) { r = 80 + t * 60; g = 145 - t * 40; b = 65; }
          else if (t < 0.75) { r = 120; g = 108; b = 92; }
          else { r = 225; g = 228; b = 235; }
          const hx = h[y * gw + Math.min(gw - 1, x + 1)] - h[y * gw + Math.max(0, x - 1)];
          const hy = h[Math.min(gh - 1, y + 1) * gw + x] - h[Math.max(0, y - 1) * gw + x];
          const sh = U.clamp(1 - (hx + hy) * 7, 0.55, 1.3);
          r *= sh; g *= sh; b *= sh;
          if (filled[i] > v + 0.003 && P.method === 'flow') { r = 60; g = 120; b = 190; }
          if (P.showAcc) { const a = Math.log(acc[i]) / lmax; r = g = b = 30 + 225 * a; }
          if (river[i]) {
            const w = P.method === 'flow' ? U.clamp(Math.log(acc[i] / P.threshold) / 3, 0, 1) : 0.6;
            r = 50 - 20 * w; g = 110 + 30 * w; b = 210 + 30 * w;
          }
        }
        d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
      }
      cg.putImageData(img, 0, 0);
    }

    return {
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const tk = [P.res, P.sea, W, H].join('|');
        if (tk !== terrainKey) { makeTerrain(W, H); terrainKey = tk; riverKey = ''; }
        const rk = [P.method, P.width, P.fill, P.threshold, P.showAcc].join('|');
        if (rk !== riverKey) { computeRivers(); paint(); riverKey = rk; }
        const T = Math.min(W / gw, H / gh), ox = (W - gw * T) / 2, oy = (H - gh * T) / 2;
        g.imageSmoothingEnabled = false;
        g.drawImage(cv, ox, oy, gw * T, gh * T);
        // 내륙에서 끝난 강 끝
        for (const i of pits) { const x = i % gw, y = (i - x) / gw; D.circle(g, ox + (x + 0.5) * T, oy + (y + 0.5) * T, Math.max(2.5, T), C.bad); }
        // 마우스: 빗물 경로 (흐름 누적 방식이면 그 방향, 아니면 원래 지형의 경사 하강)
        const m = ctx.input.mouse;
        if (m.inside) {
          const cx = Math.floor((m.x - ox) / T), cy = Math.floor((m.y - oy) / T);
          if (cx >= 0 && cy >= 0 && cx < gw && cy < gh) {
            const D8 = P.method === 'flow' ? dir : rawDir;
            let i = cy * gw + cx, steps = 0;
            g.beginPath(); g.moveTo(ox + (cx + 0.5) * T, oy + (cy + 0.5) * T);
            while (i >= 0 && steps < 4000 && h[i] >= P.sea) {
              const nx = D8[i]; if (nx < 0) break;
              i = nx; steps++;
              const x = i % gw, y = (i - x) / gw;
              g.lineTo(ox + (x + 0.5) * T, oy + (y + 0.5) * T);
            }
            g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
            const ended = i >= 0 && h[i] >= P.sea;
            D.circle(g, ox + (cx + 0.5) * T, oy + (cy + 0.5) * T, 4, '#fff');
            D.text(g, ended ? GTL.L('빗물이 내륙 구덩이에 갇힘', 'Rain is trapped in an inland pit') : GTL.L(`바다까지 ${steps}칸`, `${steps} cells to the sea`), m.x + 8, m.y - 14, { size: 11, color: ended ? C.bad : '#fff' });
          }
        }
        ctx.stat(GTL.L('강 칸 수', 'River cells'), info.cells);
        ctx.stat(GTL.L('강 줄기 수', 'River systems'), info.comps);
        ctx.stat(GTL.L('바다에 닿은 강 줄기 비율', 'River systems that reach the sea'), info.reach.toFixed(0) + ' %');
        ctx.stat(GTL.L('물이 강을 따라 흐르는 칸', 'Cells where water follows the river'), info.follow.toFixed(0) + ' %');
        ctx.stat(GTL.L('내려갈 곳 없는 강 칸', 'River cells with no way down'), info.stuck);
        if (P.method === 'flow') { ctx.stat(GTL.L('합류점', 'Confluences'), info.confl); ctx.stat(GTL.L('호수 칸 (깊이 0.003 이상)', 'Lake cells (depth 0.003 or more)'), info.lakes); }
      },
    };
  },
});
