// fBm(프랙털 브라운 운동): 옥타브 / 라쿠나리티 / 게인, ridged / billow 변형, 지형 컬러맵
GTL.register({
  id: 'fbm-terrain',
  title: 'fBm 옥타브 지형 (Ridged / Billow)',
  summary: '1 옥타브 vs 6 옥타브 fBm 비교. 노이즈 한 겹은 밋밋한 언덕뿐임. 주파수는 올리고 진폭은 줄인 노이즈를 여러 겹 더하면 해안선, 산맥 같은 프랙털 디테일이 생김.',
  views: { a: '1 옥타브', b: '6 옥타브 fBm' },
  controls: '마우스 세로 이동: 단면 위치',
  info: `
    <p><b>fBm(프랙털 브라운 운동)</b>: 크기가 다른 노이즈를 여러 겹(옥타브) 더하는 방식.
    식은 <code>Σ amp<sub>i</sub> × noise(p × freq<sub>i</sub>)</code>.
    옥타브마다 <code>freq *= lacunarity</code>, <code>amp *= gain</code>을 적용함.</p>
    <ul>
      <li><b>라쿠나리티</b>: 옥타브마다 곱하는 주파수 배율. 표준값 2.</li>
      <li><b>게인</b>: 옥타브마다 곱하는 진폭 배율. 표준값 0.5.</li>
    </ul>
    <p>표준값에서는 스펙트럼이 1/f 형태가 되어 자연 지형과 닮음.
    게인을 올리면 고주파가 강해져 거칠어짐(프랙털 차원↑). 낮추면 매끄러워짐.</p>
    <p>변형:</p>
    <ul>
      <li><b>Ridged</b>: <code>1 − |noise|</code>를 제곱함. 0을 지나는 선이 날카로운 능선이 됨(산맥).</li>
      <li><b>Billow</b>: <code>|noise|</code>를 씀. 둥근 골짜기가 생김(구름, 언덕).</li>
    </ul>
    <p>옥타브마다 좌표를 회전, 이동하면 격자 방향 아티팩트가 겹쳐 보이는 현상이 줄어듦.</p>
    <p>Minecraft 지형 높이, No Man's Sky 행성 지형 등 대부분의 노이즈 기반 지형이 이 fBm 변형을 바탕으로 함.</p>`,
  // 도식: 옥타브마다 주파수 2배, 진폭 절반인 노이즈를 더해 1 옥타브 위에 디테일이 쌓이는 과정
  diagram: (L) => {
    const o = (t) => Math.sin(t) + 0.5 * Math.sin(t * 2.3 + 1.1);
    const path = (cy, amp, fn) => {
      let d = '';
      for (let i = 0; i <= 100; i++) d += (i ? ' L' : 'M') + (130 + i * 4) + ',' + (cy - amp * fn(i / 100)).toFixed(1);
      return d;
    };
    const oct = (k) => (u) => Math.pow(0.5, k) * o(u * 11 * Math.pow(2, k) + k * 1.7);
    const sum = (u) => oct(0)(u) + oct(1)(u) + oct(2)(u) + oct(3)(u);
    const row = (y, ko, en, note) => `<text x="4" y="${y}">${L(ko, en)}</text><text x="4" y="${y + 13}" class="t-small t-dim t-mono">${note}</text>`;
    return `<svg viewBox="0 0 540 206" xmlns="http://www.w3.org/2000/svg">
    ${row(28, '옥타브 1', 'Octave 1', 'freq 1, amp 1')}
    ${row(66, '옥타브 2', 'Octave 2', 'freq 2, amp 0.5')}
    ${row(98, '옥타브 3, 4', 'Octaves 3, 4', 'freq 4, 8')}
    <text x="4" y="150" class="t-b">${L('합계 (fBm)', 'Sum (fBm)')}</text>
    <text x="4" y="163" class="t-small t-dim">${L('점선: 1 옥타브', 'dashed: octave 1')}</text>
    <path d="${path(32, 12, oct(0))}" class="d-a"/>
    <path d="${path(68, 12, oct(1))}" class="d-line"/>
    <path d="${path(98, 12, oct(2))}" class="d-line"/><path d="${path(106, 12, oct(3))}" class="d-dim"/>
    <text x="118" y="126" class="t-dim">+</text>
    <path d="${path(150, 12, oct(0))}" class="d-a" stroke-dasharray="4 3" opacity="0.6"/>
    <path d="${path(150, 12, sum)}" class="d-b"/>
    <text x="4" y="200" class="t-small t-dim">${L('주파수는 2배(라쿠나리티), 진폭은 절반(게인)씩. 큰 형태는 그대로이고 작은 굴곡이 쌓임', 'Frequency doubles (lacunarity), amplitude halves (gain). The big shape stays, small bumps pile on')}</text>
  </svg>`;
  },
  look: [
    'A의 옥타브를 1→2→4로 올리면 해안선이 점점 복잡해짐. 8 이상은 화면 해상도보다 작아져 차이가 거의 없고 비용만 늘어남.',
    '게인을 0.7 이상으로 올리면 지형이 잡음처럼 거칠어짐. 0.3으로 내리면 1옥타브와 비슷하게 매끈해짐.',
    '변형을 Ridged로 바꾸고 해수면을 낮추면 날카로운 산맥이 보임. 아래 단면 그래프에서도 봉우리가 뾰족해짐.',
    '"옥타브별 단면"을 켜면 각 옥타브가 단면에 더하는 기여(주파수↑ 진폭↓)가 따로 보임.',
    '라쿠나리티를 2 대신 1.9~2.1로 두면 옥타브 격자가 정렬되지 않아 패턴 반복이 덜 눈에 띔.',
  ],
  refs: [
    { type: 'book', title: 'Texturing & Modeling: A Procedural Approach (Ebert, Musgrave, Peachey, Perlin, Worley)', year: 2002, note: 'Musgrave의 fBm, ridged multifractal 지형 장.' },
    { type: 'article', title: 'Inigo Quilez: fBm', url: 'https://iquilezles.org/articles/fbm/', note: '게인과 Hurst 지수, 스펙트럼 관점 해설.' },
    { type: 'article', title: 'Red Blob Games: Making maps with noise functions', url: 'https://www.redblobgames.com/maps/terrain-from-noise/', note: '옥타브, 재분배(redistribution), 고도→바이옴 매핑.' },
    { type: 'game', title: "Minecraft / No Man's Sky", note: '노이즈 옥타브 합성 기반 지형 생성의 대표 사례.' },
  ],
  params: [
    { key: 'octaves', label: '옥타브', type: 'int', min: 1, max: 10, a: 1, b: 6, group: 'fBm' },
    { key: 'lacunarity', label: '라쿠나리티 (주파수 배율)', type: 'range', min: 1.2, max: 3.5, step: 0.05, default: 2 },
    { key: 'gain', label: '게인 (진폭 배율)', type: 'range', min: 0.2, max: 0.85, step: 0.01, default: 0.5 },
    { key: 'variant', label: '변형', type: 'select', options: [
      { value: 'fbm', label: '기본 fBm' },
      { value: 'ridged', label: 'Ridged (능선)' },
      { value: 'billow', label: 'Billow (둥근)' },
    ], default: 'fbm' },
    { key: 'rotate', label: '옥타브마다 회전', type: 'bool', default: true, help: '격자 방향 아티팩트를 줄임.' },
    { key: 'scale', label: '기본 주파수', type: 'range', min: 1, max: 8, step: 0.1, default: 3, shared: true, group: '지형' },
    { key: 'sea', label: '해수면', type: 'range', min: 0, max: 0.9, step: 0.01, default: 0.45, shared: true },
    { key: 'colormap', label: '색상', type: 'select', options: [
      { value: 'terrain', label: '지형' },
      { value: 'gray', label: '높이(그레이)' },
    ], default: 'terrain', shared: true },
    { key: 'shade', label: '음영 (Hillshade)', type: 'bool', default: true, shared: true },
    { key: 'res', label: '해상도', type: 'int', min: 64, max: 256, default: 200, shared: true, group: '표시' },
    { key: 'layers', label: '옥타브별 단면', type: 'bool', default: false, shared: true },
    { key: 'pan', label: '자동 스크롤', type: 'bool', default: false, shared: true },
  ],
  en: {
    title: 'fBm Octave Terrain (Ridged / Billow)',
    summary: '1 octave vs 6 octave fBm. A single layer of noise gives only flat, gentle hills. Add several layers with rising frequency and falling amplitude, and you get fractal detail like coastlines and mountain ranges.',
    views: { a: '1 octave', b: '6 octave fBm' },
    controls: 'Move the mouse up or down: slice position',
    info: `
    <p><b>fBm (fractional Brownian motion)</b> adds several layers (octaves) of noise at different sizes.
    The formula is <code>Σ amp<sub>i</sub> × noise(p × freq<sub>i</sub>)</code>.
    Each octave applies <code>freq *= lacunarity</code> and <code>amp *= gain</code>.</p>
    <ul>
      <li><b>Lacunarity</b>: the frequency multiplier per octave. The standard value is 2.</li>
      <li><b>Gain</b>: the amplitude multiplier per octave. The standard value is 0.5.</li>
    </ul>
    <p>With the standard values, the spectrum follows 1/f and looks like natural terrain.
    Raise the gain and high frequencies get stronger, so the terrain gets rough (higher fractal dimension). Lower it and the terrain gets smooth.</p>
    <p>Variants:</p>
    <ul>
      <li><b>Ridged</b>: squares <code>1 − |noise|</code>. Zero crossings become sharp ridges (mountain ranges).</li>
      <li><b>Billow</b>: uses <code>|noise|</code>. This makes round valleys (clouds, hills).</li>
    </ul>
    <p>Rotating and shifting coordinates per octave reduces visible grid-aligned artifacts that stack up.</p>
    <p>Most noise-based terrain builds on fBm variants, such as Minecraft terrain height and No Man's Sky planet terrain.</p>`,
    look: [
      'Raise A\'s octaves from 1 to 2 to 4. The coastline gets more and more complex. At 8 or more, octaves are smaller than a screen pixel, so you see almost no change and only pay more cost.',
      'Raise the gain to 0.7 or more. The terrain gets rough like static. Lower it to 0.3 and it gets as smooth as 1 octave.',
      'Set the variant to Ridged and lower the sea level. You see sharp mountain ranges. The peaks in the slice graph below also get pointy.',
      'Turn on "Per-octave slices". You see each octave\'s contribution to the slice on its own (higher frequency, lower amplitude).',
      'Set lacunarity to 1.9~2.1 instead of 2. The octave grids do not line up, so repeating patterns are less visible.',
    ],
    refs: ['Musgrave\'s chapters on fBm and ridged multifractal terrain.', 'Explains gain, the Hurst exponent, and the spectral view.', 'Octaves, redistribution, and mapping elevation to biomes.', 'Well-known examples of terrain built from summed noise octaves.'],
    params: {
      octaves: 'Octaves',
      lacunarity: 'Lacunarity (frequency multiplier)',
      gain: 'Gain (amplitude multiplier)',
      variant: { label: 'Variant', options: { fbm: 'Basic fBm', ridged: 'Ridged', billow: 'Billow (round)' } },
      rotate: { label: 'Rotate each octave', help: 'Reduces grid-aligned artifacts.' },
      scale: { label: 'Base frequency', group: 'Terrain' },
      sea: 'Sea level',
      colormap: { label: 'Color', options: { terrain: 'Terrain', gray: 'Height (gray)' } },
      shade: 'Hillshade',
      res: { label: 'Resolution', group: 'Display' },
      layers: 'Per-octave slices',
      pan: 'Auto scroll',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const N = U.noise(ctx.seed);
    const ROT = 0.6435; // 약 36.87° (3-4-5 삼각형)
    const cr = Math.cos(ROT), sr = Math.sin(ROT);

    // 옥타브 i 하나의 기여(정규화 전). 단면 레이어 표시에도 사용
    function octave(i, x, y, freq) {
      let px = x * freq, py = y * freq;
      if (P.rotate) for (let k = 0; k < i; k++) { const t = px * cr - py * sr; py = px * sr + py * cr; px = t; }
      const n = N.perlin2(px + i * 17.13, py - i * 9.71);
      if (P.variant === 'ridged') { const r = U.clamp(1 - Math.abs(n) * 1.6, 0, 1); return r * r * 2 - 1; }
      if (P.variant === 'billow') return Math.abs(n) * 2.6 - 1;
      return n * 1.35;
    }
    function height(x, y) {
      let amp = 1, freq = 1, sum = 0, norm = 0;
      for (let i = 0; i < P.octaves; i++) {
        sum += octave(i, x, y, freq) * amp;
        norm += amp; amp *= P.gain; freq *= P.lacunarity;
      }
      return U.clamp(0.5 + 0.5 * (sum / norm), 0, 1);
    }

    const STOPS = [
      [0.0, [18, 40, 90]], [0.75, [40, 90, 160]], [1.0, [70, 140, 190]],
    ];
    function terrainColor(h, sea, out, o) {
      let c;
      if (h < sea) {
        const t = sea > 0 ? h / sea : 0;
        c = t < 0.75 ? mix(STOPS[0][1], STOPS[1][1], t / 0.75) : mix(STOPS[1][1], STOPS[2][1], (t - 0.75) / 0.25);
      } else {
        const t = (h - sea) / Math.max(1e-6, 1 - sea);
        if (t < 0.04) c = [214, 200, 140];
        else if (t < 0.3) c = mix([90, 160, 70], [60, 125, 55], (t - 0.04) / 0.26);
        else if (t < 0.55) c = mix([60, 125, 55], [40, 85, 45], (t - 0.3) / 0.25);
        else if (t < 0.78) c = mix([110, 100, 90], [140, 130, 125], (t - 0.55) / 0.23);
        else c = [235, 238, 245];
      }
      out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2];
    }
    const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

    const buf = { cv: null, g: null, img: null, key: '', h: null };
    let panX = 0, buildMs = 0, landPct = 0;

    function rebuild(gw, gh) {
      if (!buf.cv || buf.cv.width !== gw || buf.cv.height !== gh) {
        buf.cv = ctx.createCanvas(gw, gh); buf.g = buf.cv.getContext('2d'); buf.img = buf.g.createImageData(gw, gh);
        buf.h = new Float32Array(gw * gh);
      }
      const t0 = ctx.now();
      const k = P.scale / gw, hs = buf.h, d = buf.img.data;
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) hs[y * gw + x] = height(x * k + panX, y * k);
      let land = 0;
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
        const i = y * gw + x, o = i * 4, h = hs[i];
        if (h >= P.sea) land++;
        if (P.colormap === 'terrain') terrainColor(h, P.sea, d, o);
        else d[o] = d[o + 1] = d[o + 2] = h * 255;
        if (P.shade) {
          const hx = hs[y * gw + Math.min(gw - 1, x + 1)] - hs[y * gw + Math.max(0, x - 1)];
          const hy = hs[Math.min(gh - 1, y + 1) * gw + x] - hs[Math.max(0, y - 1) * gw + x];
          const above = P.colormap !== 'terrain' || h >= P.sea;
          const s = above ? U.clamp(1 - (hx + hy) * 9, 0.45, 1.35) : 1;
          d[o] *= s; d[o + 1] *= s; d[o + 2] *= s;
        }
        d[o + 3] = 255;
      }
      buf.g.putImageData(buf.img, 0, 0);
      buildMs = ctx.now() - t0;
      landPct = (land / (gw * gh)) * 100;
    }

    return {
      update(dt) { if (P.pan) panX += dt * 0.25; },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const gw = P.res, gh = Math.max(8, Math.round(P.res * H / W));
        const key = [P.octaves, P.lacunarity, P.gain, P.variant, P.rotate, P.scale, P.sea, P.colormap, P.shade, gw, gh, panX].join('|');
        if (key !== buf.key) { rebuild(gw, gh); buf.key = key; }
        g.imageSmoothingEnabled = true;
        g.drawImage(buf.cv, 0, 0, W, H);

        // 단면 그래프
        const col = ctx.side === 'a' ? C.a : C.b;
        const m = ctx.input.mouse;
        const sy = m.inside ? U.clamp(m.y, 0, H - 1) : H * 0.45;
        D.line(g, 0, sy, W, sy, col, 1);
        const ph = 100, py0 = H - ph - 6;
        g.fillStyle = 'rgba(10,12,16,0.82)'; g.fillRect(0, py0, W, ph);
        const k = P.scale / W, ry = sy * k;
        const seaY = py0 + ph - 4 - P.sea * (ph - 8);
        g.fillStyle = 'rgba(40,90,160,0.35)'; g.fillRect(0, seaY, W, py0 + ph - seaY);
        if (P.layers) {
          let amp = 1, freq = 1;
          for (let i = 0; i < P.octaves; i++) {
            g.beginPath();
            for (let x = 0; x <= W; x += 2) {
              const v = octave(i, x * k + panX, ry, freq) * amp * 0.5;
              const yy = py0 + ph / 2 - v * (ph / 2 - 6);
              x ? g.lineTo(x, yy) : g.moveTo(x, yy);
            }
            g.strokeStyle = U.hsl(200 + i * 25, 70, 65, 0.55); g.lineWidth = 1; g.stroke();
            amp *= P.gain; freq *= P.lacunarity;
          }
        }
        g.beginPath();
        for (let x = 0; x <= W; x += 1) {
          const v = height(x * k + panX, ry);
          const yy = py0 + ph - 4 - v * (ph - 8);
          x ? g.lineTo(x, yy) : g.moveTo(x, yy);
        }
        g.strokeStyle = col; g.lineWidth = 1.5; g.stroke();
        D.text(g, P.layers ? GTL.L('단면 높이 + 옥타브별 기여', 'Slice height + per-octave contribution') : GTL.L('단면 높이 (파란 영역 = 해수면 아래)', 'Slice height (blue area = below sea level)'), 6, py0 + 4, { size: 10, color: C.dim });

        let totalAmp = 0, a = 1; for (let i = 0; i < P.octaves; i++) { totalAmp += a; a *= P.gain; }
        ctx.stat(GTL.L('옥타브 / 최고 주파수', 'Octaves / top frequency'), `${P.octaves} / ×${Math.pow(P.lacunarity, P.octaves - 1).toFixed(1)}`);
        ctx.stat(GTL.L('마지막 옥타브 비중', 'Last octave weight'), ((Math.pow(P.gain, P.octaves - 1) / totalAmp) * 100).toFixed(1) + ' %');
        ctx.stat(GTL.L('육지 비율', 'Land ratio'), landPct.toFixed(1) + ' %');
        ctx.stat(GTL.L('필드 생성', 'Field build'), buildMs.toFixed(1) + ' ms');
      },
    };
  },
});
