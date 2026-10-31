// 노이즈 종류 비교: White / Value / Perlin / Simplex / Worley(F1, F2-F1)
GTL.register({
  id: 'noise-types',
  title: '노이즈 종류 (White, Value, Perlin, Simplex, Worley)',
  summary: 'Value 노이즈 vs Perlin 노이즈 비교. 노이즈는 종류마다 모양, 연속성, 격자 아티팩트가 다름. 같은 주파수에서 2D 필드, 1D 단면, 값 분포(히스토그램)를 비교.',
  views: { a: 'Value 노이즈', b: 'Perlin (Gradient) 노이즈' },
  controls: '마우스 세로 이동: 1D 단면 위치 선택',
  info: `
    <p><b>노이즈</b>: 절차적 생성의 기본 재료. 위치마다 정해진, 무작위처럼 보이는 값을 돌려주는 함수.</p>
    <ul>
      <li><b>White</b>: 샘플마다 독립된 난수. 이웃한 값끼리 연관 없음.</li>
      <li><b>Value 노이즈</b>: 정수 격자점에 난수 <i>값</i>을 두고 사이를 보간. 계산이 싸지만 극값이 격자점에 몰려 <b>네모난 덩어리</b>가 보임.</li>
      <li><b>Perlin 노이즈</b>(1985, 2002 개선판): 격자점에 난수 <i>기울기</i>를 두고 내적을 보간. 격자점 값이 항상 0이라 극값이 격자 사이로 흩어짐. 그래서 더 자연스러움.</li>
      <li><b>Simplex</b>: 정사각형 대신 삼각형(심플렉스) 격자를 씀. 방향성 아티팩트가 적고 고차원에서 빠름.</li>
      <li><b>Worley(셀룰러) 노이즈</b>: 셀마다 흩뿌린 특징점까지의 거리(F1)를 씀. F2−F1은 셀 경계를 강조. 돌바닥, 세포, 균열 텍스처에 쓰임.</li>
    </ul>`,
  // 도식: 1D 단면에서 Value(격자점에 값)와 Perlin(격자점에 기울기)의 차이, 극값 위치
  diagram: (L) => `<svg viewBox="0 0 540 178" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arrb" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="16" class="t-a">${L('Value: 격자점에 난수 값', 'Value: random value at lattice points')}</text>
    <text x="280" y="16" class="t-b">${L('Perlin: 격자점에 난수 기울기', 'Perlin: random gradient at lattice points')}</text>
    ${[20, 75, 130, 185, 240, 290, 345, 400, 455, 510].map((x) => `<line x1="${x}" y1="30" x2="${x}" y2="130" class="d-dim" stroke-dasharray="3 3"/>`).join('')}
    <line x1="10" y1="80" x2="250" y2="80" class="d-dim"/><line x1="280" y1="80" x2="520" y2="80" class="d-dim"/>
    <path d="M20,48 C47,48 48,112 75,112 C102,112 103,58 130,58 C157,58 158,100 185,100 C212,100 213,66 240,66" class="d-a"/>
    ${[[20, 48], [75, 112], [130, 58], [185, 100], [240, 66]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" class="f-a"/>`).join('')}
    <path d="M290,80 C305,46 330,46 345,80 C360,104 385,104 400,80 C415,40 440,40 455,80 C470,110 495,110 510,80" class="d-b"/>
    ${[[290, -1], [345, 1], [400, -1], [455, 1], [510, -1]].map(([x, s]) => `<line x1="${x}" y1="80" x2="${x + 10}" y2="${80 + s * 20}" class="d-b" marker-end="url(#arrb)"/><circle cx="${x}" cy="80" r="3" class="f-dim"/>`).join('')}
    <text x="10" y="148" class="t-small">${L('극값이 격자점에 몰림. 네모난 덩어리', 'Extremes sit on lattice points: blocky')}</text>
    <text x="280" y="148" class="t-small">${L('격자점 값은 항상 0. 극값은 격자 사이', 'Always 0 at lattice points, extremes in between')}</text>
    <text x="10" y="172" class="t-small t-dim">${L('같은 격자, 같은 보간. 격자점에 무엇을 두느냐만 다름', 'Same lattice, same blending. Only what each lattice point stores differs')}</text>
  </svg>`,
  look: [
    '"정수 격자 표시"를 켜고 A(Value)를 보면 밝고 어두운 점이 격자 교차점에 몰려 있음. B(Perlin)는 교차점이 항상 중간 회색임.',
    '1D 단면 그래프를 보면 Perlin, Simplex 곡선은 격자 눈금(세로 점선)마다 0.5를 지남. Value는 눈금에서 평평한 극값을 가짐.',
    '히스토그램을 비교하면 White는 평평함(균등 분포). Value는 넓게 퍼지고, Perlin, Simplex는 가운데로 몰린 종 모양임. 지형 높이로 쓸 때 정규화가 필요한 이유.',
    '색상을 "등고선 밴드"로 바꾸면 Value 노이즈의 축에 맞춰진 마름모, 사각형 윤곽이 뚜렷해짐',
  ],
  refs: [
    { type: 'paper', title: 'An Image Synthesizer (Ken Perlin, SIGGRAPH 1985)', url: 'https://dl.acm.org/doi/10.1145/325165.325247', year: 1985, note: 'Perlin 노이즈 최초 발표' },
    { type: 'paper', title: 'Improving Noise (Ken Perlin, SIGGRAPH 2002)', url: 'https://mrl.cs.nyu.edu/~perlin/paper445.pdf', year: 2002, note: '5차 fade 곡선과 개선된 기울기 집합' },
    { type: 'paper', title: 'A Cellular Texture Basis Function (Steven Worley, SIGGRAPH 1996)', url: 'https://dl.acm.org/doi/10.1145/237170.237267', year: 1996 },
    { type: 'article', title: 'Simplex noise demystified (Stefan Gustavson)', year: 2005, note: 'Simplex 노이즈 구현 해설. 이 샘플의 simplex 구현이 따르는 방식.' },
    { type: 'article', title: 'Red Blob Games: Making maps with noise functions', url: 'https://www.redblobgames.com/maps/terrain-from-noise/', note: 'Amit Patel. 노이즈로 지형을 만드는 입문 글.' },
  ],
  params: [
    { key: 'type', label: '노이즈 종류', type: 'select', group: '노이즈', options: [
      { value: 'white', label: 'White (난수)' },
      { value: 'value', label: 'Value 노이즈' },
      { value: 'perlin', label: 'Perlin (Gradient)' },
      { value: 'simplex', label: 'Simplex' },
      { value: 'worley', label: 'Worley F1' },
      { value: 'worley2', label: 'Worley F2 − F1' },
    ], a: 'value', b: 'perlin' },
    { key: 'scale', label: '주파수 (화면당 격자 수)', type: 'range', min: 2, max: 32, step: 0.5, default: 7, shared: true },
    { key: 'colormap', label: '색상', type: 'select', options: [
      { value: 'gray', label: '그레이스케일' },
      { value: 'bands', label: '등고선 밴드' },
      { value: 'heat', label: '히트맵' },
    ], default: 'gray', shared: true },
    { key: 'res', label: '필드 해상도 (가로 픽셀)', type: 'int', min: 48, max: 200, default: 160, shared: true, group: '표시' },
    { key: 'lattice', label: '정수 격자 표시', type: 'bool', default: true, shared: true },
    { key: 'slice', label: '1D 단면 그래프', type: 'bool', default: true, shared: true },
    { key: 'hist', label: '히스토그램', type: 'bool', default: true, shared: true },
    { key: 'animate', label: '흐르기 (도메인 이동)', type: 'bool', default: false, shared: true },
  ],
  en: {
    title: 'Noise Types (White, Value, Perlin, Simplex, Worley)',
    summary: 'Value noise vs Perlin noise. Each noise type differs in shape, continuity, and grid artifacts. This sample compares the 2D field, a 1D slice, and the value distribution (histogram) at the same frequency.',
    views: { a: 'Value noise', b: 'Perlin (gradient) noise' },
    controls: 'Move the mouse up or down: choose the 1D slice position',
    info: `
    <p><b>Noise</b> is the basic building block of procedural generation. It is a function that returns a fixed, random-looking value for each position.</p>
    <ul>
      <li><b>White</b>: an independent random number per sample. Neighboring values have no relation.</li>
      <li><b>Value noise</b>: puts random <i>values</i> on integer grid points and interpolates between them. It is cheap, but extremes gather on grid points, so you see <b>square blobs</b>.</li>
      <li><b>Perlin noise</b> (1985, improved in 2002): puts random <i>gradients</i> on grid points and interpolates dot products. The value at grid points is always 0, so extremes spread between grid points. This looks more natural.</li>
      <li><b>Simplex</b>: uses a triangle (simplex) grid instead of squares. It has fewer directional artifacts and is fast in higher dimensions.</li>
      <li><b>Worley (cellular) noise</b>: uses the distance (F1) to feature points scattered in each cell. F2−F1 highlights cell borders. It is used for cobblestone, cell, and crack textures.</li>
    </ul>`,
    look: [
      'Turn on "Show integer grid" and look at A (Value). Bright and dark spots gather at grid crossings. In B (Perlin), crossings are always mid gray.',
      'Look at the 1D slice graph. Perlin and Simplex curves pass 0.5 at every grid tick (vertical dotted line). Value has flat extremes at the ticks.',
      'Compare the histograms. White is flat (uniform). Value spreads wide, and Perlin and Simplex form a bell shape around the middle. This is why you need to normalize noise for terrain height.',
      'Set the color to "Contour bands". The axis-aligned diamond and square outlines of value noise become clear.',
    ],
    refs: ['The first publication of Perlin noise.', 'Quintic fade curve and an improved gradient set.', null, 'A guide to implementing simplex noise. The simplex code in this sample follows it.', 'Amit Patel. An introduction to making terrain with noise.'],
    params: {
      type: { label: 'Noise type', group: 'Noise', options: { white: 'White (random)', value: 'Value noise' } },
      scale: 'Frequency (grid cells per screen)',
      colormap: { label: 'Color', options: { gray: 'Grayscale', bands: 'Contour bands', heat: 'Heat map' } },
      res: { label: 'Field resolution (horizontal pixels)', group: 'Display' },
      lattice: 'Show integer grid',
      slice: '1D slice graph',
      hist: 'Histogram',
      animate: 'Flow (move the domain)',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const seed = ctx.seed;
    const N = U.noise(seed);

    // 정수 해시 → [0,1)
    const hash = (x, y, s) => {
      let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(s | 0, 0x9e3779b1);
      h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
      h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };

    // Simplex 2D (Gustavson 방식)
    const perm = new Uint8Array(512);
    { const r = U.rng(seed ^ 0x5eed); const a = Array.from({ length: 256 }, (_, i) => i); r.shuffle(a); for (let i = 0; i < 512; i++) perm[i] = a[i & 255]; }
    const G3 = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [0, 1], [0, -1]];
    const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
    function simplex2(xin, yin) {
      const s = (xin + yin) * F2;
      const i = Math.floor(xin + s), j = Math.floor(yin + s);
      const t = (i + j) * G2;
      const x0 = xin - (i - t), y0 = yin - (j - t);
      const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
      const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
      const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
      const ii = i & 255, jj = j & 255;
      let n = 0;
      let t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 > 0) { const g = G3[perm[ii + perm[jj]] % 12]; t0 *= t0; n += t0 * t0 * (g[0] * x0 + g[1] * y0); }
      let t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 > 0) { const g = G3[perm[ii + i1 + perm[jj + j1]] % 12]; t1 *= t1; n += t1 * t1 * (g[0] * x1 + g[1] * y1); }
      let t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 > 0) { const g = G3[perm[ii + 1 + perm[jj + 1]] % 12]; t2 *= t2; n += t2 * t2 * (g[0] * x2 + g[1] * y2); }
      return 70 * n; // ≈ [-1, 1]
    }

    // Worley: 셀마다 특징점 1개, 3x3 이웃 탐색. 결과는 wF1, wF2에 기록 (할당 없음)
    let wF1 = 0, wF2 = 0;
    function worley(x, y) {
      const ix = Math.floor(x), iy = Math.floor(y);
      let f1 = 81, f2 = 81;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const cx = ix + dx, cy = iy + dy;
        const ddx = cx + hash(cx, cy, seed) - x, ddy = cy + hash(cx, cy, seed + 101) - y;
        const d = ddx * ddx + ddy * ddy;
        if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
      }
      wF1 = Math.sqrt(f1); wF2 = Math.sqrt(f2);
    }

    // 모든 노이즈를 대략 [0,1]로
    function sample(type, x, y, px, py, tick) {
      switch (type) {
        case 'white': return hash(px, py + tick * 7919, seed);
        case 'value': return N.value2(x, y);
        case 'perlin': return U.clamp(0.5 + N.perlin2(x, y) * 0.75, 0, 1);
        case 'simplex': return U.clamp(0.5 + simplex2(x, y) * 0.5, 0, 1);
        case 'worley': worley(x, y); return U.clamp(wF1, 0, 1);
        default: worley(x, y); return U.clamp((wF2 - wF1) * 1.4, 0, 1);
      }
    }

    function colorize(v, map, out, o) {
      if (map === 'gray') { const c = v * 255; out[o] = out[o + 1] = out[o + 2] = c; }
      else if (map === 'bands') {
        const f = (v * 12) % 1, edge = f < 0.08 ? 0.35 : 1;
        const c = (Math.floor(v * 12) / 12) * 200 + 40;
        out[o] = c * edge * 0.75; out[o + 1] = c * edge * 0.9; out[o + 2] = c * edge;
      } else {
        out[o] = 255 * U.clamp(v * 2.2 - 0.2, 0, 1);
        out[o + 1] = 255 * U.clamp(v * 2 - 0.8, 0, 1);
        out[o + 2] = 255 * U.clamp(0.5 - Math.abs(v - 0.3) * 2, 0, 1) + 255 * U.clamp(v * 3 - 2.4, 0, 1) * 0.6;
      }
      out[o + 3] = 255;
    }

    const buf = { cv: null, g: null, img: null, key: '' };
    const hist = new Float32Array(32);
    let stats = { mean: 0, sd: 0, ms: 0 };
    let offset = 0;

    function rebuild(gw, gh) {
      if (!buf.cv || buf.cv.width !== gw || buf.cv.height !== gh) {
        buf.cv = ctx.createCanvas(gw, gh); buf.g = buf.cv.getContext('2d'); buf.img = buf.g.createImageData(gw, gh);
      }
      const t0 = ctx.now();
      const d = buf.img.data, type = P.type, k = P.scale / gw, map = P.colormap;
      const tick = Math.floor(offset * 4);
      hist.fill(0);
      let sum = 0, sum2 = 0;
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
        const v = sample(type, (x + 0.5) * k + offset, (y + 0.5) * k, x, y, tick);
        sum += v; sum2 += v * v;
        hist[Math.min(31, (v * 32) | 0)]++;
        colorize(v, map, d, (y * gw + x) * 4);
      }
      buf.g.putImageData(buf.img, 0, 0);
      const n = gw * gh, mean = sum / n;
      stats = { mean, sd: Math.sqrt(Math.max(0, sum2 / n - mean * mean)), ms: ctx.now() - t0 };
    }

    return {
      update(dt) { if (P.animate) offset += dt * 0.6; },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const gw = P.res, gh = Math.max(8, Math.round(P.res * H / W));
        const key = [P.type, P.scale, P.colormap, gw, gh, offset].join('|');
        if (key !== buf.key) { rebuild(gw, gh); buf.key = key; }
        g.imageSmoothingEnabled = P.type === 'white' ? false : true;
        g.drawImage(buf.cv, 0, 0, W, H);
        g.imageSmoothingEnabled = true;

        const cell = W / P.scale; // 격자 1칸의 화면 크기
        const ox = -((offset % 1) + 1) % 1 * cell;
        if (P.lattice && P.type !== 'white') {
          D.grid(g, W, H, cell, 'rgba(255,255,255,0.18)', ox, 0);
        }
        const col = ctx.side === 'a' ? C.a : C.b;
        const m = ctx.input.mouse;
        const sy = m.inside ? U.clamp(m.y, 0, H - 1) : H * 0.4;
        if (P.slice) {
          D.line(g, 0, sy, W, sy, col, 1);
          const gh2 = 90, gy = H - gh2 - 6;
          g.fillStyle = 'rgba(10,12,16,0.82)'; g.fillRect(0, gy, W, gh2);
          // 격자 눈금
          if (P.type !== 'white') {
            g.setLineDash([3, 4]);
            for (let x = ox; x <= W; x += cell) if (x >= 0) D.line(g, x, gy, x, gy + gh2, 'rgba(255,255,255,0.25)', 1);
            g.setLineDash([]);
          }
          D.line(g, 0, gy + gh2 / 2, W, gy + gh2 / 2, 'rgba(255,255,255,0.12)', 1);
          const k = P.scale / W, tick = Math.floor(offset * 4);
          const ry = sy * k;
          const gwPix = P.res / W;
          g.beginPath();
          const step = P.type === 'white' ? Math.max(1, W / P.res) : 2;
          for (let x = 0; x <= W; x += step) {
            const v = sample(P.type, x * k + offset, ry, Math.floor(x * gwPix), Math.floor(sy * gwPix), tick);
            const py = gy + gh2 - 6 - v * (gh2 - 12);
            x ? g.lineTo(x, py) : g.moveTo(x, py);
          }
          g.strokeStyle = col; g.lineWidth = 1.5; g.stroke();
          D.text(g, GTL.L('1D 단면 (세로 점선 = 정수 격자)', '1D slice (dotted line = integer grid)'), 6, gy + 4, { size: 10, color: C.dim });
        }
        if (P.hist) {
          const hw = 130, hh = 60, hx = W - hw - 8, hy = 8;
          g.fillStyle = 'rgba(10,12,16,0.82)'; g.fillRect(hx, hy, hw, hh + 16);
          let mx = 1; for (const v of hist) mx = Math.max(mx, v);
          const bw = hw / 32;
          g.fillStyle = col;
          for (let i = 0; i < 32; i++) { const h = (hist[i] / mx) * hh; g.fillRect(hx + i * bw, hy + 14 + hh - h, bw - 0.5, h); }
          D.text(g, GTL.L('값 분포 0 → 1', 'Value distribution 0 → 1'), hx + 4, hy + 2, { size: 10, color: C.dim });
        }
        ctx.stat(GTL.L('평균', 'Mean'), stats.mean.toFixed(3));
        ctx.stat(GTL.L('표준편차', 'Std dev'), stats.sd.toFixed(3));
        ctx.stat(GTL.L('필드 생성', 'Field build'), stats.ms.toFixed(1) + ' ms');
      },
    };
  },
});
