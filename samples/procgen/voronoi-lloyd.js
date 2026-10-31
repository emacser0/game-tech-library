// 보로노이 다이어그램 + 로이드 완화(Lloyd relaxation)
GTL.register({
  id: 'voronoi-lloyd',
  title: '보로노이 & 로이드 완화 (Lloyd Relaxation)',
  summary: '무작위 점 vs 로이드 완화 8회 비교. 무작위 점의 보로노이 셀은 크기가 제각각임. 로이드 완화를 반복하면 셀이 고른 육각형에 가까워짐.',
  views: { a: '무작위 점 (완화 0회)', b: '로이드 완화 8회' },
  controls: '조작 없음. "다시 생성"을 누르면 새 시드로 만듦.',
  info: `
    <p><b>보로노이 다이어그램</b>: 평면의 각 위치를 가장 가까운 사이트(seed point)에 배정해 나눈 영역.
    맵 영역, 지역 분할의 기본 도구.
    거리 함수를 바꾸면 셀 모양이 바뀜. 맨해튼은 마름모, 체비셰프는 사각형.
    이 샘플은 저해상도 래스터에서 공간 버킷으로 가장 가까운 사이트를 찾음.</p>
    <p><b>로이드 완화</b>: 아래 두 단계를 반복</p>
    <ol>
      <li>보로노이 셀 계산</li>
      <li>각 사이트를 자기 셀의 무게중심으로 옮김</li>
    </ol>
    <p>몇 번만 반복해도 셀 크기 편차가 크게 줄어듦. 결국 중심 보로노이 분할(CVT)에 수렴.</p>
    <p>단점: 너무 많이 반복하면 거의 규칙적인 벌집이 되어 자연스러운 무작위성이 사라짐. 그래서 실전에서는 1~3회만 쓰기도 함.</p>
    <p>사례: Red Blob Games의 폴리곤 맵 생성은 무작위 점에 로이드 완화를 적용. 그 보로노이 셀을 섬, 바이옴의 단위 지역으로 씀.</p>`,
  // 도식: 사이트를 셀 무게중심으로 옮기는 로이드 한 단계와 반복에 따른 셀 넓이 편차 감소
  diagram: (L) => `<svg viewBox="0 0 540 176" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr-lloyd" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <polygon points="10,10 140,10 110,90 10,120" class="f-dim"/>
    <polygon points="140,10 260,10 260,70 110,90" class="f-dim"/>
    <polygon points="10,120 110,90 260,70 260,140 10,140" class="f-dim"/>
    ${[[30, 28, 68, 58], [240, 20, 192, 46], [30, 132, 132, 116]].map(([sx, sy, cx, cy]) =>
      `<line x1="${sx}" y1="${sy}" x2="${cx}" y2="${cy}" class="d-accent" marker-end="url(#arr-lloyd)"/><circle cx="${sx}" cy="${sy}" r="4" class="f-a"/><circle cx="${cx}" cy="${cy}" r="4" class="f-b"/>`).join('')}
    <circle cx="16" cy="158" r="4" class="f-a"/><text x="24" y="162" class="t-small">${L('사이트', 'site')}</text>
    <circle cx="86" cy="158" r="4" class="f-b"/><text x="94" y="162" class="t-small">${L('셀 무게중심', 'cell centroid')}</text>
    <rect x="290" y="10" width="240" height="24" rx="4" class="f-dim"/><text x="300" y="26">${L('1. 보로노이 셀 계산', '1. Compute Voronoi cells')}</text>
    <rect x="290" y="44" width="240" height="24" rx="4" class="f-dim"/><text x="300" y="60">${L('2. 사이트를 무게중심으로 이동', '2. Move each site to its centroid')}</text>
    <path d="M290,56 L280,56 L280,22 L288,22" class="d-accent" marker-end="url(#arr-lloyd)"/>
    <text x="290" y="88" class="t-small t-dim">${L('반복 횟수별 셀 넓이 편차 (예시)', 'Cell area spread per iteration (example)')}</text>
    ${[[0, 48], [1, 30], [2, 20], [4, 12], [8, 7]].map(([it, h], i) =>
      `<rect x="${300 + i * 46}" y="${150 - h}" width="28" height="${h}" class="${i ? 'f-b' : 'f-a'}"/><text x="${314 + i * 46}" y="164" text-anchor="middle" class="t-mono t-small">${it}</text>`).join('')}
    <line x1="290" y1="150" x2="530" y2="150" class="d-dim"/>
  </svg>`,
  look: [
    'A와 B의 셀 크기를 비교하면 A는 아주 작은 셀과 큰 셀이 섞여 있고 B는 비슷한 크기의 육각형에 가까움. "셀 면적 변동계수"에서도 차이가 보임.',
    '"무게중심 화살표"를 켜면 A에서 각 점이 끌려갈 방향이 보임. 큰 셀일수록 화살표가 김.',
    'A의 반복 횟수를 1, 2, 3으로 올리면 처음 1~2회에 개선이 대부분 일어남. 이후 "평균 이동량"이 급감(수렴).',
    '거리 함수를 맨해튼이나 체비셰프로 바꾸면 셀 경계가 마름모, 사각형 모양이 됨. 완화 결과도 다른 격자 패턴으로 수렴.',
  ],
  refs: [
    { type: 'paper', title: 'Least Squares Quantization in PCM (Stuart P. Lloyd, IEEE Trans. Information Theory 1982)', year: 1982, note: '로이드 알고리즘 원 논문 (1957년 벨 연구소 보고서)' },
    { type: 'paper', title: 'Centroidal Voronoi Tessellations: Applications and Algorithms (Du, Faber, Gunzburger, SIAM Review 1999)', year: 1999 },
    { type: 'article', title: 'Red Blob Games: Polygonal Map Generation for Games', url: 'http://www-cs-students.stanford.edu/~amitp/game-programming/polygon-map-generation/', year: 2010, note: 'Amit Patel. 로이드 완화와 보로노이 기반 섬 생성.' },
    { type: 'article', title: 'Inigo Quilez: Voronoi edges', url: 'https://iquilezles.org/articles/voronoilines/', note: '셰이더에서 보로노이 경계를 계산하는 방법' },
  ],
  params: [
    { key: 'iters', label: '로이드 반복 횟수', type: 'int', min: 0, max: 30, a: 0, b: 8, group: '완화' },
    { key: 'metric', label: '거리 함수', type: 'select', options: [
      { value: 'euclid', label: '유클리드' },
      { value: 'manhattan', label: '맨해튼' },
      { value: 'cheb', label: '체비셰프' },
    ], default: 'euclid' },
    { key: 'count', label: '사이트 수', type: 'int', min: 5, max: 300, default: 60, shared: true, group: '장면' },
    { key: 'px', label: '래스터 픽셀 크기', type: 'int', min: 2, max: 8, default: 3, shared: true },
    { key: 'animate', label: '반복 애니메이션', type: 'bool', default: true, shared: true, group: '표시' },
    { key: 'speed', label: '반복/초', type: 'range', min: 0.5, max: 20, step: 0.5, default: 2, shared: true, when: (p) => p.animate },
    { key: 'fill', label: '셀 색칠', type: 'bool', default: true, shared: true },
    { key: 'arrows', label: '무게중심 화살표', type: 'bool', default: false, shared: true },
    { key: 'regen', label: '다시 생성', type: 'button', buttonLabel: '다시 생성 (새 시드)' },
  ],
  en: {
    title: 'Voronoi & Lloyd Relaxation',
    summary: 'Random points vs 8 passes of Lloyd relaxation. Voronoi cells from random points vary in size. Repeat Lloyd relaxation and the cells get close to even hexagons.',
    views: { a: 'Random points (0 passes)', b: '8 Lloyd passes' },
    controls: 'No input. Press "Regenerate" to build with a new seed.',
    info: `
    <p>A <b>Voronoi diagram</b> splits the plane by assigning each position to its nearest site (seed point).
    It is a basic tool for map regions and area splitting.
    Change the distance function and the cell shape changes. Manhattan gives diamonds, Chebyshev gives squares.
    This sample finds the nearest site on a low-resolution raster with spatial buckets.</p>
    <p><b>Lloyd relaxation</b> repeats the two steps below.</p>
    <ol>
      <li>Compute the Voronoi cells.</li>
      <li>Move each site to the centroid of its own cell.</li>
    </ol>
    <p>Just a few passes greatly reduce the spread in cell size. It finally converges to a centroidal Voronoi tessellation (CVT).</p>
    <p>Downside: too many passes give an almost regular honeycomb and remove the natural randomness. So in practice people sometimes use only 1~3 passes.</p>
    <p>Example: Red Blob Games\' polygon map generation applies Lloyd relaxation to random points. Its Voronoi cells become the unit regions for islands and biomes.</p>`,
    look: [
      'Compare cell sizes in A and B. A mixes tiny and large cells. B is close to hexagons of similar size. The "Cell area CV" value also shows the gap.',
      'Turn on "Centroid arrows". In A you see where each point gets pulled. Larger cells have longer arrows.',
      'Raise A\'s passes to 1, 2, 3. Most of the gain happens in the first 1~2 passes. After that, "Mean move" drops fast (convergence).',
      'Switch the distance function to Manhattan or Chebyshev. Cell borders become diamonds or squares. Relaxation also converges to a different grid pattern.',
    ],
    refs: ['The original Lloyd algorithm paper (a 1957 Bell Labs report).', null, 'Amit Patel. Lloyd relaxation and Voronoi-based island generation.', 'How to compute Voronoi borders in a shader.'],
    params: {
      iters: { label: 'Lloyd passes', group: 'Relaxation' },
      metric: { label: 'Distance function', options: { euclid: 'Euclidean', manhattan: 'Manhattan', cheb: 'Chebyshev' } },
      count: { label: 'Sites', group: 'Scene' },
      px: 'Raster pixel size',
      animate: { label: 'Animate passes', group: 'Display' },
      speed: 'Passes/s',
      fill: 'Color cells',
      arrows: 'Centroid arrows',
      regen: { label: 'Regenerate', buttonLabel: 'Regenerate (new seed)' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    let regen = 0, key = '', iters = [], progress = 0, gw = 0, gh = 0, pxs = 3;
    let lab = null, cache = { key: '', cent: null, area: null };
    const buf = { cv: null, g: null, img: null };
    let colors = [];

    function reset(W, H) {
      pxs = P.px;
      gw = Math.max(16, Math.floor(W / pxs)); gh = Math.max(12, Math.floor(H / pxs));
      lab = new Int32Array(gw * gh);
      const rng = U.rng(ctx.seed * 2713 + regen * 6007 + 23);
      const pts = new Float64Array(P.count * 2);
      for (let i = 0; i < P.count; i++) { pts[i * 2] = rng.range(0, gw); pts[i * 2 + 1] = rng.range(0, gh); }
      iters = [pts];
      colors = [];
      for (let i = 0; i < P.count; i++) {
        const h = (i * 137.508) % 360, l = 0.32 + rng.next() * 0.16;
        const k = (n) => (n + h / 30) % 12, a = 0.45 * Math.min(l, 1 - l);
        const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        colors.push([f(0) * 255, f(8) * 255, f(4) * 255]);
      }
      progress = P.animate ? 0 : P.iters;
      cache.key = '';
      if (!buf.cv || buf.cv.width !== gw || buf.cv.height !== gh) {
        buf.cv = ctx.createCanvas(gw, gh); buf.g = buf.cv.getContext('2d'); buf.img = buf.g.createImageData(gw, gh);
      }
    }

    // 래스터 보로노이: 공간 버킷 + 링 탐색. 결과 lab, 셀별 무게중심/면적
    function rasterize(pts) {
      const n = pts.length / 2, metric = P.metric;
      const bs = Math.max(2, Math.sqrt((gw * gh) / n)), bw = Math.ceil(gw / bs), bh = Math.ceil(gh / bs);
      const bins = Array.from({ length: bw * bh }, () => []);
      for (let i = 0; i < n; i++) bins[Math.min(bh - 1, Math.floor(pts[i * 2 + 1] / bs)) * bw + Math.min(bw - 1, Math.floor(pts[i * 2] / bs))].push(i);
      const sx = new Float64Array(n), sy = new Float64Array(n), area = new Float64Array(n);
      const maxR = Math.max(bw, bh);
      for (let y = 0; y < gh; y++) {
        const py = y + 0.5, by = Math.floor(py / bs);
        for (let x = 0; x < gw; x++) {
          const px = x + 0.5, bx = Math.floor(px / bs);
          let best = -1, bd = Infinity;
          for (let r = 0; r <= maxR; r++) {
            for (let yy = by - r; yy <= by + r; yy++) {
              if (yy < 0 || yy >= bh) continue;
              const edge = yy === by - r || yy === by + r;
              for (let xx = bx - r; xx <= bx + r; xx += edge ? 1 : 2 * r || 1) {
                if (xx < 0 || xx >= bw) continue;
                const list = bins[yy * bw + xx];
                for (let k = 0; k < list.length; k++) {
                  const i = list[k], dx = Math.abs(pts[i * 2] - px), dy = Math.abs(pts[i * 2 + 1] - py);
                  const d = metric === 'euclid' ? Math.sqrt(dx * dx + dy * dy) : metric === 'manhattan' ? dx + dy : Math.max(dx, dy);
                  if (d < bd) { bd = d; best = i; }
                }
              }
            }
            if (best >= 0 && bd <= r * bs) break;
          }
          lab[y * gw + x] = best;
          sx[best] += px; sy[best] += py; area[best]++;
        }
      }
      const cent = new Float64Array(n * 2);
      for (let i = 0; i < n; i++) {
        if (area[i] > 0) { cent[i * 2] = sx[i] / area[i]; cent[i * 2 + 1] = sy[i] / area[i]; }
        else { cent[i * 2] = pts[i * 2]; cent[i * 2 + 1] = pts[i * 2 + 1]; }
      }
      return { cent, area };
    }
    function ensure(k) {
      while (iters.length <= k) iters.push(rasterize(iters[iters.length - 1]).cent);
    }
    function currentPts() {
      const target = P.iters, s = Math.min(target, P.animate ? progress : target);
      const i0 = Math.floor(s), f = s - i0;
      ensure(Math.min(target, i0 + 1));
      if (f <= 0 || i0 >= target) return { pts: iters[i0], s };
      const a = iters[i0], b = iters[i0 + 1], out = new Float64Array(a.length);
      for (let i = 0; i < a.length; i++) out[i] = a[i] + (b[i] - a[i]) * U.smoothstep(0, 1, f);
      return { pts: out, s };
    }

    return {
      update(dt) {
        const W = ctx.width, H = ctx.height;
        const k = [P.count, P.px, P.metric, regen, W, H].join('|');
        if (k !== key) { reset(W, H); key = k; iters.length = 1; }
        if (P.animate && progress < P.iters) progress = Math.min(P.iters, progress + P.speed * dt);
        if (progress > P.iters) progress = P.iters;
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        if (!lab) { reset(W, H); key = [P.count, P.px, P.metric, regen, W, H].join('|'); }
        const { pts, s } = currentPts();
        const ck = [s, P.metric, P.fill, key].join('|');
        if (ck !== cache.key) {
          const r = rasterize(pts); cache.cent = r.cent; cache.area = r.area; cache.key = ck;
          const d = buf.img.data;
          for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
            const i = y * gw + x, l = lab[i], o = i * 4;
            const border = (x + 1 < gw && lab[i + 1] !== l) || (y + 1 < gh && lab[i + gw] !== l);
            if (border) { d[o] = 230; d[o + 1] = 232; d[o + 2] = 240; }
            else if (P.fill) { const c = colors[l]; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; }
            else { d[o] = 24; d[o + 1] = 26; d[o + 2] = 32; }
            d[o + 3] = 255;
          }
          buf.g.putImageData(buf.img, 0, 0);
        }
        const T = Math.min(W / gw, H / gh), ox = (W - gw * T) / 2, oy = (H - gh * T) / 2;
        g.imageSmoothingEnabled = false;
        g.drawImage(buf.cv, ox, oy, gw * T, gh * T);
        g.imageSmoothingEnabled = true;
        const col = ctx.side === 'a' ? C.a : C.b, n = pts.length / 2, cent = cache.cent;
        let move = 0;
        for (let i = 0; i < n; i++) {
          const x = ox + pts[i * 2] * T, y = oy + pts[i * 2 + 1] * T;
          const cx = ox + cent[i * 2] * T, cy = oy + cent[i * 2 + 1] * T;
          move += Math.hypot(cx - x, cy - y);
          if (P.arrows && Math.hypot(cx - x, cy - y) > 2) D.arrow(g, x, y, cx, cy, C.warn, 1.2, 5);
          D.circle(g, x, y, 2.5, col, '#000', 1);
        }
        // 면적 통계
        const area = cache.area;
        let m = 0, m2 = 0; for (let i = 0; i < n; i++) { m += area[i]; m2 += area[i] * area[i]; }
        m /= n; const cv = Math.sqrt(Math.max(0, m2 / n - m * m)) / m;
        let minA = Infinity, maxA = 0; for (let i = 0; i < n; i++) { minA = Math.min(minA, area[i]); maxA = Math.max(maxA, area[i]); }
        D.text(g, GTL.L(`반복 ${s.toFixed(s % 1 ? 1 : 0)} / ${P.iters}`, `Pass ${s.toFixed(s % 1 ? 1 : 0)} / ${P.iters}`), 8, 8, { color: col });
        ctx.stat(GTL.L('셀 면적 변동계수', 'Cell area CV'), cv.toFixed(3));
        ctx.stat(GTL.L('최대/최소 셀 면적', 'Max/min cell area'), minA > 0 ? (maxA / minA).toFixed(1) + GTL.L('배', 'x') : '∞');
        ctx.stat(GTL.L('평균 이동량 (다음 반복)', 'Mean move (next pass)'), (move / n / T * pxs).toFixed(2) + ' px');
      },
      onAction(key) { if (key === 'regen') regen++; },
    };
  },
});
