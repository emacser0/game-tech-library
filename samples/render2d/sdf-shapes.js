// SDF 렌더링: 저해상도 비트맵(알파) 확대 vs 같은 해상도의 Signed Distance Field (Valve 2007)
(function () {
  const HI = 512;
  const cache = {};
  // Felzenszwalb & Huttenlocher 1D 제곱 거리 변환
  function edt1d(f, n, d, v, z) {
    let k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
    for (let q = 1; q < n; q++) {
      let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
    }
    k = 0;
    for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; const dq = q - v[k]; d[q] = dq * dq + f[v[k]]; }
  }
  function edt2d(grid, w, h) {
    const n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) f[y] = grid[y * w + x];
      edt1d(f, h, d, v, z);
      for (let y = 0; y < h; y++) grid[y * w + x] = d[y];
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) f[x] = grid[y * w + x];
      edt1d(f, w, d, v, z);
      for (let x = 0; x < w; x++) grid[y * w + x] = d[x];
    }
  }
  // 고해상도 마스크 → (비트맵 커버리지, SDF) 저해상도 텍스처
  function build(ctx, lo, spread) {
    const key = lo + ':' + spread;
    if (cache[key]) return cache[key];
    const cv = ctx.createCanvas(HI, HI), g = cv.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, HI, HI);
    g.fillStyle = '#fff';
    g.font = `bold ${HI * 0.36}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('GTL', HI / 2, HI * 0.34);
    // 별
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i & 1 ? HI * 0.08 : HI * 0.19; g.lineTo(HI * 0.28 + Math.cos(a) * r, HI * 0.74 + Math.sin(a) * r); }
    g.closePath(); g.fill();
    // 가는 고리 + 하트 비슷한 곡선
    g.lineWidth = HI * 0.022; g.strokeStyle = '#fff';
    g.beginPath(); g.arc(HI * 0.7, HI * 0.74, HI * 0.15, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(HI * 0.7, HI * 0.74, HI * 0.06, 0, Math.PI * 2); g.fill();
    const src = g.getImageData(0, 0, HI, HI).data;
    const N = HI * HI, inside = new Uint8Array(N);
    for (let i = 0; i < N; i++) inside[i] = src[i * 4] > 127 ? 1 : 0;
    const dOut = new Float64Array(N), dIn = new Float64Array(N);
    for (let i = 0; i < N; i++) { dOut[i] = inside[i] ? 0 : 1e20; dIn[i] = inside[i] ? 1e20 : 0; }
    edt2d(dOut, HI, HI); edt2d(dIn, HI, HI);
    const R = HI / lo, bmp = new Uint8Array(lo * lo * 4), sdf = new Uint8Array(lo * lo * 4);
    for (let y = 0; y < lo; y++) for (let x = 0; x < lo; x++) {
      // 비트맵: R×R 블록 평균 커버리지 (일반적인 축소 이미지)
      let s = 0;
      for (let yy = 0; yy < R; yy++) for (let xx = 0; xx < R; xx++) s += inside[(y * R + yy) * HI + x * R + xx];
      const cov = s / (R * R);
      // SDF: 셀 중심의 부호 거리 (+ 안쪽), 저해상도 텍셀 단위
      const cx = Math.min(HI - 1, Math.floor((x + 0.5) * R)), cy = Math.min(HI - 1, Math.floor((y + 0.5) * R)), ci = cy * HI + cx;
      const dist = (Math.sqrt(dIn[ci]) - Math.sqrt(dOut[ci])) / R;
      const v = Math.max(0, Math.min(1, 0.5 + dist / (2 * spread)));
      const o = (y * lo + x) * 4;
      bmp[o] = bmp[o + 1] = bmp[o + 2] = cov * 255; bmp[o + 3] = 255;
      sdf[o] = sdf[o + 1] = sdf[o + 2] = Math.round(v * 255); sdf[o + 3] = 255;
    }
    return (cache[key] = { bmp, sdf });
  }

  GTL.register({
    id: 'sdf-shapes',
    title: 'SDF 렌더링 (거리장 텍스처)',
    summary: '같은 64×64 텍스처에 커버리지(알파) 대신 "가장자리까지의 부호 거리"를 저장. 수십 배 확대해도 가장자리가 선명하고, 외곽선, 글로우, 그림자, 굵기 조절을 셰이더 몇 줄로 얻음.',
    renderer: 'webgl',
    views: { a: '64² 비트맵 (bilinear)', b: '64² SDF' },
    info: `
      <p>비트맵 알파를 확대하면 bilinear 보간 때문에 가장자리가 <b>흐릿한 경사</b>가 됨. 알파 테스트(&gt;0.5)를 하면 모양이 <b>울퉁불퉁하게 뭉개짐</b>.</p>
      <p><b>SDF(Signed Distance Field, 부호 거리장)</b>는 텍셀마다 가장 가까운 가장자리까지의 거리를 저장 (안쪽 +, 바깥 −).
      거리는 텍셀 사이에서 거의 선형이라 bilinear 보간이 <b>정확한 가장자리 위치</b>를 되살림.
      <code>smoothstep</code> 폭을 화면 미분(<code>fwidth</code>)에 맞추면 어떤 배율에서도 1px 안티에일리어싱이 됨.</p>
      <p>같은 텍스처 하나로 여러 효과를 냄</p>
      <ul>
      <li>굵기: 임계값을 옮김</li>
      <li>외곽선: 두 임계값 사이를 칠함</li>
      <li>글로우: 바깥 거리에 따라 감쇠</li>
      <li>그림자: 오프셋 위치에서 한 번 더 샘플</li>
      </ul>
      <p>Valve가 TF2의 UI와 데칼에 도입해 유명해졌음. 지금은 대부분 게임 엔진 텍스트 렌더링(TextMeshPro 등)의 기본.
      단점은 날카로운 모서리가 둥글게 깎이는 것. MSDF(다채널 SDF)가 이를 보완.</p>
      <p>여기서는 512² 마스크에 Felzenszwalb 거리 변환을 적용해 저해상도 SDF를 만듦. 왼쪽 아래 작은 사각형이 실제 텍스처.</p>`,
    diagram: (L) => `<svg viewBox="0 0 540 176" xmlns="http://www.w3.org/2000/svg">
      <text x="20" y="14" class="t-a">${L('A: 알파 비트맵', 'A: alpha bitmap')}</text>
      <text x="290" y="14" class="t-b">${L('B: 부호 거리 (SDF)', 'B: signed distance (SDF)')}</text>
      <line x1="30" y1="120" x2="250" y2="120" class="d-dim"/>
      <line x1="30" y1="80" x2="250" y2="80" class="d-accent" stroke-dasharray="4 3"/><text x="252" y="84" class="t-small t-mono">0.5</text>
      <polyline points="${[1, 1, 0.8, 0, 0, 0].map((a, i) => `${40 + i * 40},${120 - a * 80}`).join(' ')}" class="d-a"/>
      ${[1, 1, 0.8, 0, 0, 0].map((a, i) => `<circle cx="${40 + i * 40}" cy="${120 - a * 80}" r="3" class="f-a"/>`).join('')}
      <line x1="132" y1="30" x2="132" y2="124" class="d-good" stroke-dasharray="2 2"/>
      ${[0, 1, 2, 3, 4].map((i) => `<rect x="${120 + i * 8}" y="132" width="8" height="10" class="f-a" opacity="${(1 - i / 4).toFixed(2)}"/>`).join('')}
      <rect x="30" y="132" width="90" height="10" class="f-a"/>
      <text x="20" y="160" class="t-small">${L('경계가 텍셀 1칸 폭의 경사', 'The edge is a ramp one texel wide')}</text>
      <text x="20" y="172" class="t-small t-dim">${L('확대하면 흐리거나 울퉁불퉁함', 'Magnified: blurry or lumpy')}</text>
      <line x1="300" y1="80" x2="520" y2="80" class="d-accent" stroke-dasharray="4 3"/><text x="522" y="84" class="t-small t-mono">0</text>
      <polyline points="${[2.3, 1.3, 0.3, -0.7, -1.7, -2.7].map((d, i) => `${310 + i * 40},${80 - d * 16}`).join(' ')}" class="d-b"/>
      ${[2.3, 1.3, 0.3, -0.7, -1.7, -2.7].map((d, i) => `<circle cx="${310 + i * 40}" cy="${80 - d * 16}" r="3" class="f-b"/>`).join('')}
      <line x1="402" y1="30" x2="402" y2="124" class="d-good" stroke-dasharray="2 2"/>
      <rect x="300" y="132" width="102" height="10" class="f-b"/>
      <text x="290" y="160" class="t-small">${L('거리는 선형이라 0 지점이 정확한 경계', 'Distance is linear: zero is the exact edge')}</text>
      <text x="290" y="172" class="t-small t-dim">${L('smoothstep 폭 = fwidth로 항상 1px', 'smoothstep width = fwidth: always 1 px')}</text>
      <text x="136" y="28" class="t-small t-dim">${L('실제 경계', 'true edge')}</text>
    </svg>`,
    look: [
      '확대를 12배 이상 올리면 A의 글자는 흐릿하게 번지고, B는 여전히 칼같이 선명함',
      'A를 "알파 테스트"로 바꾸면 선명해지지만 모양이 울퉁불퉁 뭉개짐 (Valve 논문의 비교 그림과 같음)',
      'B에서 외곽선, 글로우, 그림자, 굵기를 바꾸면 효과가 바로 붙음. 텍스처는 그대로임.',
      '"텍스처 해상도"를 32로 낮추면 SDF도 모서리가 둥글어짐. 날카로운 모서리에 약한 SDF의 한계가 드러남.',
    ],
    refs: [
      { type: 'paper', title: 'Improved Alpha-Tested Magnification for Vector Textures and Special Effects (Chris Green, Valve)', url: 'https://steamcdn-a.akamaihd.net/apps/valve/2007/SIGGRAPH2007_AlphaTestedMagnification.pdf', year: 2007, note: 'SIGGRAPH 2007 Course. SDF 텍스처 확대와 외곽선, 글로우, 그림자.' },
      { type: 'paper', title: 'Distance Transforms of Sampled Functions (Felzenszwalb, Huttenlocher)', year: 2012, note: 'Theory of Computing. O(n) 정확한 유클리드 거리 변환.' },
      { type: 'paper', title: 'Shape Decomposition for Multi-channel Distance Fields (Viktor Chlumský)', year: 2015, note: '석사 논문. 날카로운 모서리를 보존하는 MSDF.' },
      { type: 'article', title: '2D distance functions (Inigo Quilez)', url: 'https://iquilezles.org/articles/distfunctions2d/' },
      { type: 'engine', title: 'TextMeshPro (Unity): SDF 폰트 렌더링', note: '외곽선, 언더레이, 글로우를 SDF 셰이더 파라미터로 제공' },
    ],
    params: [
      { key: 'mode', label: '렌더링', type: 'select', group: '방식', options: [
        { value: 'bitmap', label: '비트맵 알파 (bilinear)' },
        { value: 'alphaTest', label: '비트맵 + 알파 테스트 (>0.5)' },
        { value: 'sdf', label: 'SDF' },
      ], a: 'bitmap', b: 'sdf' },
      { key: 'res', label: '텍스처 해상도', type: 'select', options: [32, 64, 128], default: 64, shared: true, reset: true },
      { key: 'zoom', label: '확대 (텍스처 → 화면)', type: 'range', min: 0.5, max: 24, step: 0.1, default: 6, shared: true, group: '보기' },
      { key: 'rotate', label: '천천히 회전', type: 'bool', default: true, shared: true },
      { key: 'weight', label: '굵기 (텍셀)', type: 'range', min: -1.5, max: 1.5, step: 0.05, default: 0, group: 'SDF 효과', when: (p) => p.mode === 'sdf' },
      { key: 'outline', label: '외곽선 (텍셀)', type: 'range', min: 0, max: 2.5, step: 0.05, default: 0, when: (p) => p.mode === 'sdf' },
      { key: 'glow', label: '글로우 (텍셀)', type: 'range', min: 0, max: 5, step: 0.1, default: 0, when: (p) => p.mode === 'sdf' },
      { key: 'shadow', label: '그림자', type: 'bool', default: false, when: (p) => p.mode === 'sdf' },
    ],
    en: {
      title: 'SDF Rendering (Distance Field Textures)',
      summary: 'The same 64×64 texture stores the "signed distance to the edge" instead of coverage (alpha). Edges stay sharp even at many times zoom. You get outline, glow, shadow, and weight control with a few shader lines.',
      views: { a: '64² bitmap (bilinear)', b: '64² SDF' },
      info: `
      <p>When you zoom in on bitmap alpha, bilinear interpolation turns the edge into a <b>blurry ramp</b>. An alpha test (&gt;0.5) makes the shape <b>lumpy and mushy</b>.</p>
      <p>An <b>SDF (Signed Distance Field)</b> stores, in each texel, the distance to the nearest edge (+ inside, − outside).
      Distance is almost linear between texels, so bilinear interpolation recovers the <b>exact edge position</b>.
      If you match the <code>smoothstep</code> width to the screen derivative (<code>fwidth</code>), you get 1px anti-aliasing at any zoom.</p>
      <p>One texture gives many effects.</p>
      <ul>
      <li>Weight: move the threshold.</li>
      <li>Outline: fill between two thresholds.</li>
      <li>Glow: fade by the outside distance.</li>
      <li>Shadow: sample once more at an offset.</li>
      </ul>
      <p>Valve made it famous by using it for UI and decals in TF2. Today it is the default for text rendering in most game engines (TextMeshPro and others).
      The downside is that sharp corners get rounded. MSDF (multi-channel SDF) fixes this.</p>
      <p>Here, a Felzenszwalb distance transform runs on a 512² mask to build a low-resolution SDF. The small square at the bottom left is the actual texture.</p>`,
      look: [
        'Raise zoom to 12× or more. The letters in A blur and smear. B stays razor sharp.',
        'Switch A to "alpha test". It gets sharp, but the shape turns lumpy (like the comparison figure in the Valve paper).',
        'In B, change outline, glow, shadow, and weight. The effects apply at once. The texture does not change.',
        'Lower "Texture resolution" to 32. The SDF corners also get round. This shows the SDF weakness with sharp corners.',
      ],
      refs: [
        'SIGGRAPH 2007 Course. SDF texture magnification with outline, glow, and shadow.',
        'Theory of Computing. Exact Euclidean distance transform in O(n).',
        'Master thesis. MSDF, which keeps sharp corners.',
        null,
        { title: 'TextMeshPro (Unity): SDF font rendering', note: 'Gives outline, underlay, and glow as SDF shader parameters.' },
      ],
      params: {
        mode: { label: 'Rendering', group: 'Method', options: { bitmap: 'Bitmap alpha (bilinear)', alphaTest: 'Bitmap + alpha test (>0.5)' } },
        res: 'Texture resolution',
        zoom: { label: 'Zoom (texture → screen)', group: 'View' },
        rotate: 'Rotate slowly',
        weight: { label: 'Weight (texels)', group: 'SDF effects' },
        outline: 'Outline (texels)',
        glow: 'Glow (texels)',
        shadow: 'Shadow',
      },
    },

    setup(ctx) {
      const U = GTL.util, gl = ctx.gl, P = ctx.params;
      const LO = +P.res, SPREAD = 6;
      const deriv = gl.getExtension('OES_standard_derivatives');
      const { bmp, sdf } = build(ctx, LO, SPREAD);
      const bmpTex = U.gl.texture(gl, { width: LO, height: LO, data: bmp }, { filter: 'linear', wrap: 'clamp' });
      const sdfTex = U.gl.texture(gl, { width: LO, height: LO, data: sdf }, { filter: 'linear', wrap: 'clamp' });

      const fs = `
        #extension GL_OES_standard_derivatives : enable
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif
        uniform sampler2D u_tex; uniform vec2 u_res; uniform vec2 u_center;
        uniform float u_size; uniform float u_rot; uniform float u_mode; uniform float u_texN;
        uniform float u_spread; uniform float u_weight; uniform float u_outline; uniform float u_glow; uniform float u_shadow;
        uniform float u_hasDeriv;
        float fall(float r, float d){ return 1.0 - smoothstep(0.0, r, d); }
        float distAt(vec2 uv){ return (texture2D(u_tex, uv).r - 0.5) * 2.0 * u_spread; }
        vec3 over(vec3 dst, vec3 src, float a){ return mix(dst, src, clamp(a, 0.0, 1.0)); }
        void main(){
          vec2 fc = gl_FragCoord.xy;
          // background
          vec2 ck = floor(fc / (16.0 * (u_res.y / 600.0) + 1.0));
          vec3 c = mix(vec3(0.09, 0.1, 0.13), vec3(0.11, 0.12, 0.16), mod(ck.x + ck.y, 2.0));
          // preview of the raw texture (bottom-left)
          float pv = min(u_res.x, u_res.y) * 0.22;
          if (fc.x > 8.0 && fc.y > 8.0 && fc.x < 8.0 + pv && fc.y < 8.0 + pv) {
            vec2 puv = (fc - 8.0) / pv;
            puv.y = 1.0 - puv.y;
            vec2 nuv = (floor(puv * u_texN) + 0.5) / u_texN;
            gl_FragColor = vec4(vec3(texture2D(u_tex, nuv).r), 1.0);
            return;
          }
          vec2 d = fc - u_center;
          float s = sin(u_rot), co = cos(u_rot);
          d = vec2(d.x * co - d.y * s, d.x * s + d.y * co);
          vec2 uv = d / u_size + 0.5;
          uv.y = 1.0 - uv.y;
          vec3 fill = vec3(1.0, 0.85, 0.35);
          if (u_mode < 0.5) {
            float a = texture2D(u_tex, uv).r;
            c = over(c, fill, a);
          } else if (u_mode < 1.5) {
            float a = step(0.5, texture2D(u_tex, uv).r);
            c = over(c, fill, a);
          } else {
            float dist = distAt(uv);
            float w;
            #ifdef GL_OES_standard_derivatives
            w = max(fwidth(dist), 1e-4);
            #else
            w = u_texN / u_size;
            #endif
            if (u_hasDeriv < 0.5) w = u_texN / u_size;
            float e = dist + u_weight;
            if (u_shadow > 0.5) {
              float sd = distAt(uv - vec2(1.0, 1.0) / u_texN) + u_weight;
              c = over(c, vec3(0.0), 0.6 * clamp(sd / 1.2 + 0.5, 0.0, 1.0));
            }
            if (u_glow > 0.0) c = c + vec3(0.3, 0.7, 1.0) * fall(u_glow, max(-e, 0.0)) * 0.9;
            if (u_outline > 0.0) c = over(c, vec3(0.85, 0.2, 0.35), clamp((e + u_outline) / w + 0.5, 0.0, 1.0));
            c = over(c, fill, clamp(e / w + 0.5, 0.0, 1.0));
          }
          gl_FragColor = vec4(c, 1.0);
        }`;
      const prog = U.gl.program(gl, U.gl.QUAD_VS, fs);
      const quad = U.gl.quad(gl);
      let rot = 0;
      return {
        update(dt) {
          if (P.rotate) rot += dt * 0.15;
        },
        render() {
          gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
          gl.clearColor(0, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
          prog.use();
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, P.mode === 'sdf' ? sdfTex : bmpTex);
          gl.uniform1i(prog.u('u_tex'), 0);
          gl.uniform2f(prog.u('u_res'), ctx.pixelWidth, ctx.pixelHeight);
          gl.uniform2f(prog.u('u_center'), ctx.pixelWidth * 0.55, ctx.pixelHeight * 0.5);
          const size = LO * P.zoom * ctx.pixelRatio;
          gl.uniform1f(prog.u('u_size'), size);
          gl.uniform1f(prog.u('u_rot'), Math.sin(rot) * 0.5);
          gl.uniform1f(prog.u('u_mode'), { bitmap: 0, alphaTest: 1, sdf: 2 }[P.mode]);
          gl.uniform1f(prog.u('u_texN'), LO);
          gl.uniform1f(prog.u('u_spread'), SPREAD);
          gl.uniform1f(prog.u('u_weight'), P.weight);
          gl.uniform1f(prog.u('u_outline'), P.outline);
          gl.uniform1f(prog.u('u_glow'), P.glow);
          gl.uniform1f(prog.u('u_shadow'), P.shadow ? 1 : 0);
          gl.uniform1f(prog.u('u_hasDeriv'), deriv ? 1 : 0);
          quad.draw(prog);
          ctx.stat(GTL.L('텍스처', 'Texture'), GTL.L(`${LO}×${LO} (${(LO * LO / 1024).toFixed(1)}K 텍셀)`, `${LO}×${LO} (${(LO * LO / 1024).toFixed(1)}K texels)`));
          ctx.stat(GTL.L('화면 배율', 'Screen scale'), `${P.zoom.toFixed(1)}×`);
          ctx.stat('fwidth', deriv ? GTL.L('지원', 'Supported') : GTL.L('미지원 (근사)', 'Not supported (approx.)'));
        },
      };
    },
  });
})();
