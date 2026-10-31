// 도메인 워핑 (Inigo Quilez): f(p) = fbm(p + k*fbm(p + k*fbm(p)))
GTL.register({
  id: 'domain-warp',
  title: '도메인 워핑 (Domain Warping)',
  summary: '워핑 없는 fBm vs 2단계 워핑 비교. 노이즈의 입력 좌표를 다른 노이즈로 비틀면 같은 fBm에서 대리석, 연기 같은 흐르는 형태가 나옴.',
  views: { a: '워핑 없음 (fBm)', b: '2단계 워핑' },
  controls: '조작 없음. "흐르기"를 켜면 워핑 필드가 시간에 따라 변함.',
  info: `
    <p><b>도메인 워핑</b>: 노이즈 <code>f(p)</code> 대신 좌표를 비튼 <code>f(p + h(p))</code>를 계산하는 기법.
    비트는 양 <code>h(p)</code>도 노이즈로 만듦.</p>
    <p>쓰임: 같은 fBm에서 전혀 다른 형태를 얻음</p>
    <ul>
      <li>지형: 침식된 듯한 능선, 휘어진 지층</li>
      <li>텍스처: 대리석, 연기, 행성 표면</li>
    </ul>
    <p>Inigo Quilez(IQ)의 공식:</p>
    <ul>
      <li><code>q = (fbm(p), fbm(p + (5.2,1.3)))</code></li>
      <li><code>r = (fbm(p + 4q + (1.7,9.2)), fbm(p + 4q + (8.3,2.8)))</code></li>
      <li><code>f = fbm(p + 4r)</code></li>
    </ul>
    <p>색은 최종 값에 중간 벡터 <code>|q|</code>, <code>r.x</code>를 섞어 정함. 그래서 층 구조가 강조됨.</p>
    <p>단점: 단계가 늘면 비용도 늘어남. 픽셀당 fBm 호출이 1회, 3회, 5회로 증가.</p>`,
  // 도식: 샘플 위치를 노이즈만큼 옮기는 원리. 가까운 점은 비슷하게 밀려 패턴이 휘어짐
  diagram: (L) => {
    let left = '', right = '';
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) {
      left += `<circle cx="${40 + i * 35}" cy="${48 + j * 23}" r="3" class="f-a"/>`;
      const x = 320 + i * 45, y = 48 + j * 23;
      const ex = (x + 15 * Math.sin(0.9 * j + 0.6 * i + 0.3)).toFixed(1), ey = (y + 9 * Math.cos(0.7 * i - 0.5 * j)).toFixed(1);
      right += `<circle cx="${x}" cy="${y}" r="2.5" class="f-dim"/><line x1="${x}" y1="${y}" x2="${ex}" y2="${ey}" class="d-b" stroke-width="1.2"/><circle cx="${ex}" cy="${ey}" r="3" class="f-b"/>`;
    }
    return `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="20" y="16" class="t-a t-mono">A: fbm(p)</text>
    <text x="20" y="30" class="t-small t-dim">${L('p 위치 그대로 샘플링', 'sample at p as is')}</text>
    <text x="300" y="16" class="t-b t-mono">B: fbm(p + 4r)</text>
    <text x="300" y="30" class="t-small t-dim">${L('노이즈만큼 옮긴 위치에서 샘플링', 'sample at a noise-shifted point')}</text>
    ${left}${right}
    <line x1="215" y1="94" x2="285" y2="94" class="d-accent" marker-end="url(#arr)"/>
    <text x="250" y="86" text-anchor="middle" class="t-small">${L('좌표 비틀기', 'warp coords')}</text>
    <text x="20" y="166" class="t-small t-mono">q = fbm(p)  →  r = fbm(p + 4q)  →  f = fbm(p + 4r)</text>
    <text x="20" y="186" class="t-small t-dim">${L('이웃한 점은 비슷하게 밀려서 패턴이 끊기지 않고 휘어짐. 단계마다 fBm 호출이 늘어남', 'Neighbors move alike, so the pattern bends instead of breaking. Each stage adds fBm calls')}</text>
  </svg>`;
  },
  look: [
    'A와 B를 비교하면 A는 둥근 얼룩뿐이고, B는 같은 fBm인데 길게 늘어진 소용돌이와 층이 보임',
    'A의 워핑 단계를 1로 바꾸면 중간 형태가 보임. 강도를 1→8로 올리면 왜곡이 강해지다가 결국 잘게 부서짐.',
    '"변위 벡터 표시"를 켜면 각 점의 좌표가 끌려가는 방향(q × 강도)이 화살표로 보임',
    '워핑 단계를 올리면 ⏱ 프레임 시간이 단계 수에 비례해 늘어남. 실제 게임은 셰이더나 오프라인 베이크로 처리.',
  ],
  refs: [
    { type: 'article', title: 'Inigo Quilez: Domain Warping', url: 'https://iquilezles.org/articles/warp/', year: 2002, note: '이 샘플 공식의 원전' },
    { type: 'book', title: 'Texturing & Modeling: A Procedural Approach', year: 2002, note: 'Perlin의 turbulence로 좌표를 비트는 대리석 텍스처 기법' },
    { type: 'article', title: 'The Book of Shaders: Fractal Brownian Motion (Patricio Gonzalez Vivo & Jen Lowe)', url: 'https://thebookofshaders.com/13/', note: '도메인 워핑 예제 포함' },
  ],
  params: [
    { key: 'levels', label: '워핑 단계', type: 'select', group: '워핑', options: [
      { value: 0, label: '0: 기본 fBm' },
      { value: 1, label: '1: fbm(p + k*q)' },
      { value: 2, label: '2: fbm(p + k*r(q))' },
    ], a: 0, b: 2 },
    { key: 'strength', label: '강도 k', type: 'range', min: 0, max: 8, step: 0.1, default: 4 },
    { key: 'octaves', label: 'fBm 옥타브', type: 'int', min: 1, max: 6, default: 4, shared: true },
    { key: 'scale', label: '주파수', type: 'range', min: 0.5, max: 5, step: 0.1, default: 2, shared: true },
    { key: 'palette', label: '색상', type: 'select', options: [
      { value: 'iq', label: 'IQ 스타일 (q, r 혼합)' },
      { value: 'gray', label: '최종 값만 (그레이)' },
    ], default: 'iq', shared: true, group: '표시' },
    { key: 'res', label: '해상도', type: 'int', min: 48, max: 200, default: 128, shared: true },
    { key: 'animate', label: '흐르기', type: 'bool', default: true, shared: true },
    { key: 'vectors', label: '변위 벡터 표시', type: 'bool', default: false, shared: true },
  ],
  en: {
    title: 'Domain Warping',
    summary: 'fBm without warping vs 2-level warping. Twist the input coordinates of noise with another noise, and the same fBm gives flowing shapes like marble and smoke.',
    views: { a: 'No warping (fBm)', b: '2-level warping' },
    controls: 'No input. Turn on "Flow" and the warp field changes over time.',
    info: `
    <p><b>Domain warping</b> computes <code>f(p + h(p))</code> with twisted coordinates instead of the noise <code>f(p)</code>.
    The twist amount <code>h(p)</code> is also made from noise.</p>
    <p>Use: you get very different shapes from the same fBm.</p>
    <ul>
      <li>Terrain: ridges that look eroded, bent rock layers</li>
      <li>Textures: marble, smoke, planet surfaces</li>
    </ul>
    <p>The formula by Inigo Quilez (IQ):</p>
    <ul>
      <li><code>q = (fbm(p), fbm(p + (5.2,1.3)))</code></li>
      <li><code>r = (fbm(p + 4q + (1.7,9.2)), fbm(p + 4q + (8.3,2.8)))</code></li>
      <li><code>f = fbm(p + 4r)</code></li>
    </ul>
    <p>The color mixes the final value with the middle vectors <code>|q|</code> and <code>r.x</code>. This brings out the layered structure.</p>
    <p>Downside: more levels cost more. fBm calls per pixel grow from 1 to 3 to 5.</p>`,
    look: [
      'Compare A and B. A has only round blobs. B uses the same fBm but shows long swirls and layers.',
      'Set A\'s warp levels to 1. You see an in-between shape. Raise the strength from 1 to 8. The distortion grows and finally breaks into small bits.',
      'Turn on "Show offset vectors". Arrows show where each point\'s coordinates get pulled (q × strength).',
      'Raise the warp levels. The ⏱ frame time grows with the number of levels. Real games do this in a shader or bake it offline.',
    ],
    refs: ['The original source of the formula in this sample.', 'Perlin\'s marble texture technique, which twists coordinates with turbulence.', 'Includes a domain warping example.'],
    params: {
      levels: { label: 'Warp levels', group: 'Warping', options: { 0: '0: basic fBm' } },
      strength: 'Strength k',
      octaves: 'fBm octaves',
      scale: 'Frequency',
      palette: { label: 'Color', group: 'Display', options: { iq: 'IQ style (mix q, r)', gray: 'Final value only (gray)' } },
      res: 'Resolution',
      animate: 'Flow',
      vectors: 'Show offset vectors',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const N = U.noise(ctx.seed);
    const fbm = (x, y) => 0.5 + 0.75 * N.fbm2(x, y, { octaves: P.octaves, gain: 0.5, lacunarity: 2.02 });

    // 결과: [f, qx, qy, rx, ry]
    const out = new Float32Array(5);
    function warp(x, y, t) {
      const k = P.strength, L = +P.levels;
      let qx = 0, qy = 0, rx = 0, ry = 0, f;
      if (L === 0) { f = fbm(x, y); }
      else {
        qx = fbm(x + 0.0 + t * 0.15, y + 0.0);
        qy = fbm(x + 5.2, y + 1.3 - t * 0.12);
        if (L === 1) f = fbm(x + k * qx, y + k * qy);
        else {
          rx = fbm(x + k * qx + 1.7 - t * 0.1, y + k * qy + 9.2);
          ry = fbm(x + k * qx + 8.3, y + k * qy + 2.8 + t * 0.13);
          f = fbm(x + k * rx, y + k * ry);
        }
      }
      out[0] = f; out[1] = qx; out[2] = qy; out[3] = rx; out[4] = ry;
      return out;
    }

    const buf = { cv: null, g: null, img: null, key: '' };
    let t = 0, buildMs = 0;

    function rebuild(gw, gh) {
      if (!buf.cv || buf.cv.width !== gw || buf.cv.height !== gh) {
        buf.cv = ctx.createCanvas(gw, gh); buf.g = buf.cv.getContext('2d'); buf.img = buf.g.createImageData(gw, gh);
      }
      const t0 = ctx.now();
      const d = buf.img.data, k = P.scale / gw * 1.6, iq = P.palette === 'iq';
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
        const w = warp(x * k, y * k, t), o = (y * gw + x) * 4;
        const f = U.clamp(w[0], 0, 1);
        if (!iq) { d[o] = d[o + 1] = d[o + 2] = f * 255; }
        else {
          // IQ: col = mix(c1,c2,f²*4) → mix(c3,|q|) → mix(c4,r.x)
          let a = U.clamp(f * f * 4, 0, 1);
          let r = 0.10 + (0.67 - 0.10) * a, g = 0.62 + (0.67 - 0.62) * a, b = 0.67 + (0.50 - 0.67) * a;
          const ql = U.clamp(Math.hypot(w[1], w[2]) * 0.9, 0, 1);
          r += (0.0 - r) * ql; g += (0.0 - g) * ql; b += (0.16 - b) * ql;
          const rl = U.clamp(Math.abs(w[3]), 0, 1) * (P.levels == 2 ? 1 : 0.4);
          r += (0.67 - r) * rl; g += (1.0 - g) * rl; b += (1.0 - b) * rl;
          const s = f * f * f + 0.6 * f * f + 0.5 * f;
          d[o] = U.clamp(r * s * 1.6, 0, 1) * 255; d[o + 1] = U.clamp(g * s * 1.6, 0, 1) * 255; d[o + 2] = U.clamp(b * s * 1.6, 0, 1) * 255;
        }
        d[o + 3] = 255;
      }
      buf.g.putImageData(buf.img, 0, 0);
      buildMs = ctx.now() - t0;
    }

    return {
      update(dt) { if (P.animate) t += dt; },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const gw = P.res, gh = Math.max(8, Math.round(P.res * H / W));
        const key = [P.levels, P.strength, P.octaves, P.scale, P.palette, gw, gh, t].join('|');
        if (key !== buf.key) { rebuild(gw, gh); buf.key = key; }
        g.imageSmoothingEnabled = true;
        g.drawImage(buf.cv, 0, 0, W, H);

        if (P.vectors && +P.levels > 0) {
          const k = P.scale / gw * 1.6, sx = gw / W, step = 32;
          const col = ctx.side === 'a' ? C.a : C.b;
          for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) {
            const w = warp(x * sx * k, y * sx * k, t);
            const vx = (+P.levels === 2 ? w[3] : w[1]) - 0.5, vy = (+P.levels === 2 ? w[4] : w[2]) - 0.5;
            const len = P.strength / k / sx; // 노이즈 좌표 → 화면 px
            D.arrow(g, x, y, x + vx * len * 0.5, y + vy * len * 0.5, col, 1.2, 5);
          }
        }
        const fbmCalls = [1, 3, 5][+P.levels];
        ctx.stat(GTL.L('픽셀당 fBm 호출', 'fBm calls per pixel'), fbmCalls);
        ctx.stat(GTL.L('픽셀당 노이즈 샘플', 'Noise samples per pixel'), fbmCalls * P.octaves);
        ctx.stat(GTL.L('필드 생성', 'Field build'), buildMs.toFixed(1) + ' ms');
      },
    };
  },
});
