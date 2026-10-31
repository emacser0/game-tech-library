// 디더링: 양자화 밴딩 vs Ordered(Bayer) / 노이즈 / Blue noise / 오차 확산(Floyd-Steinberg, Atkinson)
(function () {
  // ── 임계값 행렬 (모든 뷰가 공유하는 모듈 캐시) ──
  const BAYER = {};
  function bayer(n) {
    if (BAYER[n]) return BAYER[n];
    // 재귀 정의: M(2n) = [[4M, 4M+2], [4M+3, 4M+1]]
    let m = [[0]], size = 1;
    while (size < n) {
      const s2 = size * 2, out = [];
      for (let y = 0; y < s2; y++) {
        out.push([]);
        for (let x = 0; x < s2; x++) {
          const base = 4 * m[y % size][x % size];
          const q = (y < size ? 0 : 2) + (x < size ? 0 : 1); // 사분면 0:좌상 1:우상 2:좌하 3:우하
          out[y].push(base + [0, 2, 3, 1][q]);
        }
      }
      m = out; size = s2;
    }
    const t = new Float32Array(n * n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) t[y * n + x] = (m[y][x] + 0.5) / (n * n);
    return (BAYER[n] = t);
  }

  // Void-and-cluster (Ulichney 1993) 단순화 구현 → 64x64 blue noise 순위 행렬
  let BLUE = null;
  const BN = 64;
  function blueNoise() {
    if (BLUE) return BLUE;
    const N = BN, NN = N * N, sigma = 1.5;
    const lut = new Float32Array(NN);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = Math.min(x, N - x), dy = Math.min(y, N - y);
      lut[y * N + x] = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
    }
    const energy = new Float32Array(NN), bits = new Uint8Array(NN), rank = new Float32Array(NN);
    const splat = (i, sgn) => {
      const px = i % N, py = (i / N) | 0;
      for (let y = 0; y < N; y++) {
        const ry = ((y - py + N) % N) * N, row = y * N;
        for (let x = 0; x < N; x++) energy[row + x] += sgn * lut[ry + ((x - px + N) % N)];
      }
    };
    const tightest = () => { let b = -1, v = -1e9; for (let i = 0; i < NN; i++) if (bits[i] && energy[i] > v) { v = energy[i]; b = i; } return b; };
    const voidest = () => { let b = -1, v = 1e9; for (let i = 0; i < NN; i++) if (!bits[i] && energy[i] < v) { v = energy[i]; b = i; } return b; };
    // 초기 패턴: 시드 고정 난수 10%
    const r = GTL.util.rng(12345);
    let ones = 0;
    while (ones < NN * 0.1) { const i = Math.floor(r.next() * NN); if (!bits[i]) { bits[i] = 1; splat(i, 1); ones++; } }
    // 1단계: 가장 뭉친 점을 가장 빈 곳으로 옮기며 균일화
    for (let it = 0; it < 4000; it++) {
      const c = tightest(); bits[c] = 0; splat(c, -1);
      const v = voidest();
      if (v === c) { bits[c] = 1; splat(c, 1); break; }
      bits[v] = 1; splat(v, 1);
    }
    const proto = bits.slice(), protoE = energy.slice();
    // 2단계: 프로토타입에서 점을 하나씩 제거하며 높은 순위부터 낮은 순위로
    let k = ones;
    while (k > 0) { const c = tightest(); bits[c] = 0; splat(c, -1); k--; rank[c] = k; }
    // 3단계: 프로토타입에서 가장 빈 곳을 채우며 순위 증가
    bits.set(proto); energy.set(protoE); k = ones;
    while (k < NN) { const v = voidest(); bits[v] = 1; splat(v, 1); rank[v] = k; k++; }
    BLUE = new Float32Array(NN);
    for (let i = 0; i < NN; i++) BLUE[i] = (rank[i] + 0.5) / NN;
    return BLUE;
  }

  const TINTS = {
    none: null,
    obra: [[0.2, 0.2, 0.1], [0.9, 1.0, 1.0]],               // Obra Dinn 풍 1비트 2색
    gameboy: [[0.06, 0.22, 0.06], [0.19, 0.38, 0.19], [0.55, 0.67, 0.06], [0.61, 0.74, 0.06]],
    amber: [[0.08, 0.03, 0.0], [1.0, 0.69, 0.2]],
  };

  GTL.register({
    id: 'dither-patterns',
    title: '디더링 (Ordered, Blue Noise, 오차 확산)',
    summary: '색 단계(비트 수)를 줄이면 그라디언트에 띠(밴딩)가 생김. 디더링은 반올림 오차를 패턴이나 노이즈로 흩어서 평균 밝기를 지킴.',
    views: { a: '디더링 없음', b: 'Bayer 8×8' },
    pixelRatio: 1,
    info: `
      <p>양자화(Quantization)는 값을 가장 가까운 단계로 반올림하는 일. 단계가 적으면 부드러운 그라디언트가 <b>계단(밴딩)</b>으로 보임.</p>
      <p>디더링은 반올림 직전에 <b>임계값을 픽셀마다 다르게</b> 줌. 또는 반올림 오차를 이웃 픽셀에 나눔. 그러면 좁은 영역의 평균이 원래 값과 같아짐.</p>
      <ul>
      <li><b>Ordered (Bayer)</b>: 고정된 n×n 임계값 행렬을 바둑판처럼 반복. 픽셀끼리 독립이고 결과가 항상 같아서 셰이더에 적합함. 단점은 규칙적인 십자 무늬.</li>
      <li><b>White noise</b>: 무작위 임계값. 큰 얼룩(저주파 성분)이 섞여 지저분함.</li>
      <li><b>Interleaved Gradient Noise</b>: Jimenez(2014)가 소개한 한 줄짜리 수식 노이즈. TAA와 함께 자주 씀.</li>
      <li><b>Blue noise</b>: 잘게 흩어진 성분(고주파)만 가진 노이즈. 여기서는 void-and-cluster 방식으로 만듦. 패턴이 눈에 띄지 않아 가장 자연스러움.</li>
      <li><b>오차 확산 (Floyd-Steinberg, Atkinson)</b>: 픽셀을 차례로 돌며 오차를 오른쪽과 아래 이웃에 나눔. 품질은 좋음. 단점은 병렬로 못 돌리고, 장면이 움직이면 패턴이 프레임마다 요동침.</li>
      </ul>
      <p>Return of the Obra Dinn은 1비트 화면에 Bayer와 blue noise를 섞어 씀. 카메라가 돌 때 패턴이 "헤엄치는" 문제가 있었음. 개발노트에서 디더 패턴을 화면 대신 구면에 고정해 해결한 과정을 소개함.</p>`,
    diagram: (L) => `<svg viewBox="0 0 540 172" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="14">${L('원래 값', 'Original')}</text>
      ${Array.from({ length: 16 }, (_, i) => `<rect x="${10 + i * 10}" y="20" width="10" height="16" class="f-accent" opacity="${(i / 15).toFixed(3)}"/>`).join('')}
      <text x="10" y="54" class="t-a">${L('A: 반올림만 (4단계)', 'A: round only (4 levels)')}</text>
      ${Array.from({ length: 16 }, (_, i) => `<rect x="${10 + i * 10}" y="60" width="10" height="16" class="f-accent" opacity="${(Math.round(i / 15 * 3) / 3).toFixed(3)}"/>`).join('')}
      <text x="10" y="94" class="t-b">${L('B: Bayer 임계값', 'B: Bayer threshold')}</text>
      ${[0, 1].map((j) => Array.from({ length: 16 }, (_, i) => `<rect x="${10 + i * 10}" y="${100 + j * 8}" width="10" height="8" class="f-accent" opacity="${(Math.min(3, Math.floor(i / 15 * 3 + [[0.125, 0.625], [0.875, 0.375]][j][i % 2])) / 3).toFixed(3)}"/>`).join('')).join('')}
      <text x="10" y="166" class="t-small t-dim">${L('A는 계단(밴딩)이 생기고, B는 좁은 영역의 평균이 원래 값과 같음', 'A shows bands. In B the local average matches the original.')}</text>
      <text x="200" y="14">${L('Bayer 4x4 행렬', 'Bayer 4x4 matrix')}</text>
      ${[[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map((r, j) => r.map((v, i) => `<rect x="${200 + i * 26}" y="${22 + j * 26}" width="26" height="26" class="f-dim"/><text x="${213 + i * 26}" y="${39 + j * 26}" text-anchor="middle" class="t-small t-mono">${v}</text>`).join('')).join('')}
      <text x="200" y="138" class="t-small t-dim">${L('픽셀 위치마다 기준이 다름', 'Threshold differs per pixel')}</text>
      <text x="200" y="150" class="t-small t-dim">${L('임계값 = (v + 0.5) / 16', 'threshold = (v + 0.5) / 16')}</text>
      <text x="360" y="14">${L('오차 확산', 'Error diffusion')}</text>
      <text x="360" y="28" class="t-small t-dim">Floyd-Steinberg</text>
      <rect x="410" y="40" width="34" height="34" class="f-accent" opacity="0.7"/><text x="427" y="61" text-anchor="middle" class="t-small">${L('현재', 'now')}</text>
      <rect x="444" y="40" width="34" height="34" class="f-dim"/><rect x="376" y="74" width="34" height="34" class="f-dim"/>
      <rect x="410" y="74" width="34" height="34" class="f-dim"/><rect x="444" y="74" width="34" height="34" class="f-dim"/>
      <text x="461" y="61" text-anchor="middle" class="t-small t-mono">7/16</text>
      <text x="393" y="95" text-anchor="middle" class="t-small t-mono">3/16</text>
      <text x="427" y="95" text-anchor="middle" class="t-small t-mono">5/16</text>
      <text x="461" y="95" text-anchor="middle" class="t-small t-mono">1/16</text>
      <text x="360" y="126" class="t-small t-dim">${L('반올림 오차를 아직 처리하지 않은', 'Spread the rounding error to')}</text>
      <text x="360" y="138" class="t-small t-dim">${L('오른쪽과 아래 이웃에 나눔', 'neighbors not yet processed')}</text>
      <text x="360" y="150" class="t-small t-dim">${L('순서대로 처리해서 병렬화가 어려움', 'Sequential, hard to parallelize')}</text>
    </svg>`,
    look: [
      '비트 수를 1~2로 낮추면 A는 큰 띠로 갈라지고, B는 패턴으로 중간 톤을 표현함.',
      'B 방식을 Floyd-Steinberg로 바꾸고 "장면 움직임"을 켜면 구 주변 패턴이 프레임마다 지글거림. Bayer와 Blue noise는 화면에 고정돼 안정적임.',
      'White noise와 Blue noise를 같은 비트 수로 비교하면 blue noise가 훨씬 고르게 보임 (큰 얼룩 없음).',
      '색조를 Obra Dinn이나 Game Boy로 바꾸고 1~2비트 흑백으로 보면 실제 게임 화면 느낌이 남.',
      '오른쪽 위 작은 상자를 보면 현재 방식의 임계값 패턴이 보임.',
    ],
    refs: [
      { type: 'paper', title: 'An optimum method for two-level rendition of continuous-tone pictures (B. E. Bayer)', year: 1973, note: 'IEEE International Conference on Communications. Ordered dither 행렬의 원전.' },
      { type: 'paper', title: 'An adaptive algorithm for spatial greyscale (R. W. Floyd, L. Steinberg)', year: 1976, note: 'Proceedings of the Society for Information Display. 오차 확산 가중치 7/16, 3/16, 5/16, 1/16.' },
      { type: 'paper', title: 'Void-and-cluster method for dither array generation (R. Ulichney)', year: 1993, note: 'SPIE Human Vision, Visual Processing, and Digital Display IV. Blue noise 임계값 행렬 생성법.' },
      { type: 'talk', title: 'Next Generation Post Processing in Call of Duty: Advanced Warfare (Jorge Jimenez)', year: 2014, note: 'SIGGRAPH Advances in Real-Time Rendering. Interleaved Gradient Noise 소개.' },
      { type: 'game', title: 'Return of the Obra Dinn: 개발노트 (Lucas Pope, TIGSource)', url: 'https://forums.tigsource.com/index.php?topic=40832.0', year: 2017, note: '1비트 디더링과 디더 패턴 안정화 과정.' },
    ],
    params: [
      { key: 'method', label: '디더링 방식', type: 'select', group: '양자화', options: [
        { value: 'none', label: '없음 (반올림)' },
        { value: 'bayer2', label: 'Bayer 2×2' },
        { value: 'bayer4', label: 'Bayer 4×4' },
        { value: 'bayer8', label: 'Bayer 8×8' },
        { value: 'white', label: 'White noise' },
        { value: 'ign', label: 'Interleaved Gradient Noise' },
        { value: 'blue', label: 'Blue noise (void-and-cluster)' },
        { value: 'fs', label: 'Floyd-Steinberg 오차 확산' },
        { value: 'atkinson', label: 'Atkinson 오차 확산' },
      ], a: 'none', b: 'bayer8' },
      { key: 'bits', label: '채널당 비트', type: 'int', min: 1, max: 6, default: 2, help: '단계 수 = 2^bits' },
      { key: 'serpentine', label: '지그재그 순회', type: 'bool', default: true, when: (p) => p.method === 'fs' || p.method === 'atkinson', help: '행마다 순회 방향을 바꿔 한쪽으로 쏠린 줄무늬를 줄임' },
      { key: 'animNoise', label: '노이즈 매 프레임 변경', type: 'bool', default: false, when: (p) => p.method === 'white' || p.method === 'ign' || p.method === 'blue' },
      { key: 'color', label: '색 모드', type: 'select', group: '장면', options: [
        { value: 'gray', label: '흑백' },
        { value: 'rgb', label: 'RGB (채널별 양자화)' },
      ], default: 'gray', shared: true },
      { key: 'tint', label: '흑백 색조', type: 'select', options: [
        { value: 'none', label: '흑/백' },
        { value: 'obra', label: 'Obra Dinn 풍' },
        { value: 'gameboy', label: 'Game Boy 4색' },
        { value: 'amber', label: '앰버 모니터' },
      ], default: 'none', shared: true, when: (p) => p.color === 'gray' },
      { key: 'scale', label: '픽셀 크기', type: 'int', min: 2, max: 6, default: 3, shared: true, help: '저해상도 버퍼의 확대 배율' },
      { key: 'animate', label: '장면 움직임', type: 'bool', default: true, shared: true },
    ],
    en: {
      title: 'Dithering (Ordered, Blue Noise, Error Diffusion)',
      summary: 'With fewer color steps (bits), gradients show bands (banding). Dithering scatters the rounding error with a pattern or noise, so the average brightness stays right.',
      views: { a: 'No dithering', b: 'Bayer 8x8' },
      info: `
      <p>Quantization rounds each value to the nearest step. With few steps, a smooth gradient looks like <b>stairs (banding)</b>.</p>
      <p>Dithering gives <b>each pixel a different threshold</b> right before rounding. Or it spreads the rounding error to neighbor pixels. Then the average over a small area equals the original value.</p>
      <ul>
      <li><b>Ordered (Bayer)</b>: tile a fixed n x n threshold matrix like a checkerboard. Pixels are independent and the result never changes, so it suits shaders. The downside is a regular cross-hatch pattern.</li>
      <li><b>White noise</b>: random thresholds. Large blotches (low-frequency parts) mix in and look messy.</li>
      <li><b>Interleaved Gradient Noise</b>: a one-line formula noise from Jimenez (2014). It is often used with TAA.</li>
      <li><b>Blue noise</b>: noise with only finely scattered (high-frequency) parts. This sample builds it with the void-and-cluster method. The pattern does not stand out, so it looks the most natural.</li>
      <li><b>Error diffusion (Floyd-Steinberg, Atkinson)</b>: visit pixels in order and pass the error to the right and lower neighbors. The quality is good. The downsides: it cannot run in parallel, and the pattern jitters every frame when the scene moves.</li>
      </ul>
      <p>Return of the Obra Dinn mixes Bayer and blue noise on a 1-bit screen. The pattern "swam" when the camera turned. The dev log explains how the author fixed this by pinning the dither pattern to a sphere instead of the screen.</p>`,
      look: [
        'Lower bits to 1 or 2. A splits into wide bands. B shows the midtones with a pattern.',
        'Set B to Floyd-Steinberg and turn on "Scene motion". The pattern around the spheres crawls every frame. Bayer and blue noise stay fixed to the screen and look stable.',
        'Compare white noise and blue noise at the same bit count. Blue noise looks much more even (no large blotches).',
        'Set the tint to Obra Dinn or Game Boy and view in 1 or 2 bit grayscale. It feels like a real game screen.',
        'Look at the small box at the top right. It shows the threshold pattern of the current method.',
      ],
      refs: [
        'IEEE International Conference on Communications. The original ordered dither matrix.',
        'Proceedings of the Society for Information Display. Error diffusion weights 7/16, 3/16, 5/16, 1/16.',
        'SPIE Human Vision, Visual Processing, and Digital Display IV. How to build a blue noise threshold matrix.',
        'SIGGRAPH Advances in Real-Time Rendering. Introduces Interleaved Gradient Noise.',
        { title: 'Return of the Obra Dinn: dev log (Lucas Pope, TIGSource)', note: '1-bit dithering and how the dither pattern was made stable.' },
      ],
      params: {
        method: { label: 'Dithering method', group: 'Quantization', options: { none: 'None (rounding)', fs: 'Floyd-Steinberg error diffusion', atkinson: 'Atkinson error diffusion' } },
        bits: { label: 'Bits per channel', help: 'Step count = 2^bits' },
        serpentine: { label: 'Serpentine scan', help: 'Flip the scan direction on each row to reduce streaks that lean one way' },
        animNoise: 'Change noise every frame',
        color: { label: 'Color mode', group: 'Scene', options: { gray: 'Grayscale', rgb: 'RGB (quantize per channel)' } },
        tint: { label: 'Grayscale tint', options: { none: 'Black/white', obra: 'Obra Dinn style', gameboy: 'Game Boy 4 colors', amber: 'Amber monitor' } },
        scale: { label: 'Pixel size', help: 'Upscale factor of the low-res buffer' },
        animate: 'Scene motion',
      },
    },

    setup(ctx) {
      const U = GTL.util, D = U.draw, P = ctx.params;
      let off = null, og = null, img = null, w0 = 0, h0 = 0, work = null, src = null, t = 0;
      const insets = {};

      function ensure() {
        const w = Math.max(16, Math.ceil(ctx.width / P.scale)), h = Math.max(16, Math.ceil(ctx.height / P.scale));
        if (w === w0 && h === h0 && off) return;
        w0 = w; h0 = h;
        off = ctx.createCanvas(w, h); og = off.getContext('2d');
        img = og.createImageData(w, h);
        src = new Float32Array(w * h * 3);
        work = new Float32Array(w * h * 3);
      }

      // 장면: 위쪽 그라디언트 띠 + 셰이딩된 구 3개 (선형 0..1 값)
      function renderScene(time) {
        const w = w0, h = h0, asp = w / h, gray = P.color === 'gray';
        const lx0 = Math.cos(time * 0.5) * 0.7, ly0 = -0.55, lz0 = 0.6;
        const ll = Math.hypot(lx0, ly0, lz0), lx = lx0 / ll, ly = ly0 / ll, lz = lz0 / ll;
        const S = [
          { x: asp * (0.62 + 0.1 * Math.sin(time * 0.45)), y: 0.66, r: 0.22, c: [1.0, 0.55, 0.3] },
          { x: asp * 0.25, y: 0.7 + 0.06 * Math.sin(time * 0.7 + 1), r: 0.15, c: [0.35, 0.7, 1.0] },
          { x: asp * 0.88, y: 0.84, r: 0.1, c: [0.5, 1.0, 0.55] },
        ];
        for (let y = 0; y < h; y++) {
          const v = (y + 0.5) / h;
          for (let x = 0; x < w; x++) {
            const u = (x + 0.5) / w, i = (y * w + x) * 3;
            let r, g, b;
            if (v < 0.14) { r = g = b = u; }
            else if (v < 0.28) {
              if (gray) { r = g = b = u * u; }
              else { // 색상환 그라디언트
                const hh = u * 6, k = (n) => { const q = (n + hh) % 6; return Math.max(0, Math.min(1, Math.min(q, 4 - q))); };
                r = k(5) * 0.9 + 0.05; g = k(3) * 0.9 + 0.05; b = k(1) * 0.9 + 0.05;
              }
            } else {
              const bgv = 0.06 + 0.3 * (v - 0.28) / 0.72;
              r = bgv * 0.8; g = bgv * 0.85; b = bgv;
              const sx = u * asp, sy = v;
              for (let s = 0; s < 3; s++) {
                const o = S[s], dx = (sx - o.x) / o.r, dy = (sy - o.y) / o.r, d2 = dx * dx + dy * dy;
                if (d2 < 1) {
                  const nz = Math.sqrt(1 - d2);
                  const diff = Math.max(0, dx * lx + dy * ly + nz * lz);
                  const spec = Math.pow(diff, 40) * 0.6;
                  r = o.c[0] * (0.05 + 0.95 * diff) + spec;
                  g = o.c[1] * (0.05 + 0.95 * diff) + spec;
                  b = o.c[2] * (0.05 + 0.95 * diff) + spec;
                }
              }
            }
            if (gray) { const l = 0.299 * r + 0.587 * g + 0.114 * b; r = g = b = l; }
            src[i] = r > 1 ? 1 : r; src[i + 1] = g > 1 ? 1 : g; src[i + 2] = b > 1 ? 1 : b;
          }
        }
      }

      function threshold(method) {
        if (method === 'bayer2') return { m: bayer(2), n: 2 };
        if (method === 'bayer4') return { m: bayer(4), n: 4 };
        if (method === 'bayer8') return { m: bayer(8), n: 8 };
        if (method === 'blue') return { m: blueNoise(), n: BN };
        return null;
      }

      function quantize() {
        const w = w0, h = h0, L = (1 << P.bits) - 1, method = P.method, data = img.data;
        const gray = P.color === 'gray', tint = gray ? TINTS[P.tint] : null;
        const fr = P.animNoise ? ctx.frame : 0;
        const out = (i, r, g, b) => {
          const o = (i / 3) * 4;
          if (tint) { // 흑백 값을 색조 램프로 매핑
            const f = r * (tint.length - 1), k = Math.min(tint.length - 2, Math.floor(f)), t2 = f - k, c0 = tint[k], c1 = tint[k + 1];
            data[o] = (c0[0] + (c1[0] - c0[0]) * t2) * 255; data[o + 1] = (c0[1] + (c1[1] - c0[1]) * t2) * 255; data[o + 2] = (c0[2] + (c1[2] - c0[2]) * t2) * 255;
          } else { data[o] = r * 255; data[o + 1] = g * 255; data[o + 2] = b * 255; }
          data[o + 3] = 255;
        };
        const q = (v, th) => { let k = Math.floor(v * L + th); if (k < 0) k = 0; else if (k > L) k = L; return k / L; };

        if (method === 'fs' || method === 'atkinson') {
          work.set(src);
          const fs = method === 'fs';
          for (let y = 0; y < h; y++) {
            const rev = P.serpentine && (y & 1), dir = rev ? -1 : 1;
            for (let xx = 0; xx < w; xx++) {
              const x = rev ? w - 1 - xx : xx, i = (y * w + x) * 3;
              const res = [0, 0, 0];
              for (let c = 0; c < 3; c++) {
                const old = work[i + c], nv = q(old, 0.5), e = old - nv;
                res[c] = nv;
                if (gray && c > 0) continue;
                const add = (ox, oy, wgt) => {
                  const nx = x + ox * dir, ny = y + oy;
                  if (nx < 0 || nx >= w || ny >= h) return;
                  work[(ny * w + nx) * 3 + c] += e * wgt;
                };
                if (fs) { add(1, 0, 7 / 16); add(-1, 1, 3 / 16); add(0, 1, 5 / 16); add(1, 1, 1 / 16); }
                else { const a = 1 / 8; add(1, 0, a); add(2, 0, a); add(-1, 1, a); add(0, 1, a); add(1, 1, a); add(0, 2, a); }
              }
              if (gray) res[1] = res[2] = res[0];
              out(i, res[0], res[1], res[2]);
            }
          }
          return;
        }
        const tm = threshold(method);
        let seedA = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 3;
            let th = 0.5, th2 = 0.5, th3 = 0.5;
            if (tm) {
              const n = tm.n, ox = method === 'blue' ? (fr * 17) % n : 0, oy = method === 'blue' ? (fr * 29) % n : 0;
              th = tm.m[((y + oy) % n) * n + ((x + ox) % n)];
              // RGB에서는 채널마다 다른 오프셋으로 색 얼룩을 줄임
              th2 = method === 'blue' ? tm.m[((y + oy + 21) % n) * n + ((x + ox + 37) % n)] : th;
              th3 = method === 'blue' ? tm.m[((y + oy + 45) % n) * n + ((x + ox + 11) % n)] : th;
            } else if (method === 'white') {
              // 정수 해시 (Math.random 금지, 두 뷰 동일)
              seedA = (Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(fr + 1, 83492791)) >>> 0;
              seedA = Math.imul(seedA ^ (seedA >>> 15), 2246822519) >>> 0; seedA ^= seedA >>> 13;
              th = (seedA & 1023) / 1024; th2 = ((seedA >>> 10) & 1023) / 1024; th3 = ((seedA >>> 20) & 1023) / 1024;
            } else if (method === 'ign') {
              const px = x + fr * 5.588238, py = y + fr * 5.588238;
              const f = (0.06711056 * px + 0.00583715 * py) % 1;
              th = (52.9829189 * f) % 1; th2 = th3 = th;
            }
            out(i, q(src[i], th), q(src[i + 1], gray ? th : th2), q(src[i + 2], gray ? th : th3));
          }
        }
      }

      function insetFor(method) {
        if (insets[method] !== undefined) return insets[method];
        const tm = threshold(method);
        if (!tm) return (insets[method] = null);
        const n = tm.n, cv = ctx.createCanvas(n, n), g = cv.getContext('2d'), id = g.createImageData(n, n);
        for (let i = 0; i < n * n; i++) { const v = tm.m[i] * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
        g.putImageData(id, 0, 0);
        return (insets[method] = cv);
      }

      return {
        update(dt) { if (P.animate) t += dt; },
        render() {
          ensure();
          renderScene(t);
          const t0 = ctx.now();
          quantize();
          const ms = ctx.now() - t0;
          og.putImageData(img, 0, 0);
          const g = ctx.g;
          g.imageSmoothingEnabled = false;
          g.drawImage(off, 0, 0, w0 * P.scale, h0 * P.scale);
          const ins = insetFor(P.method);
          if (ins) {
            const s = ins.width <= 8 ? 64 / ins.width : 1, x = ctx.width - 80, y = 8 + ctx.height * 0.28;
            D.rect(g, x - 3, y - 3, ins.width * s + 6, ins.height * s + 6, 'rgba(0,0,0,0.6)');
            g.drawImage(ins, x, y, ins.width * s, ins.height * s);
            D.text(g, GTL.L('임계값 패턴', 'Threshold pattern'), x, y + ins.height * s + 6, { size: 10, color: U.colors.dim });
          }
          g.imageSmoothingEnabled = true;
          ctx.stat(GTL.L('색 단계', 'Color steps'), GTL.L(`${(1 << P.bits)} / 채널`, `${(1 << P.bits)} / channel`));
          ctx.stat(GTL.L('버퍼', 'Buffer'), `${w0}×${h0}`);
          ctx.stat(GTL.L('양자화 시간', 'Quantize time'), ms.toFixed(2) + ' ms');
        },
      };
    },
  });
})();
