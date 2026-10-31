// 블러 커널 비교: 2D 박스 / 분리형 박스 / 분리형 가우시안 / 선형 샘플링 가우시안 / Kawase / Dual filter
GTL.register({
  id: 'blur-kernels',
  title: '블러 커널 비교 (Box, Gaussian, Kawase, Dual)',
  summary: '같은 반경의 블러라도 구현에 따라 픽셀당 텍스처 샘플 수가 수백 개에서 수십 개까지 차이 남. 분리형 커널, 선형 샘플링, 다단 축소로 비용을 줄이는 방법을 비교함.',
  renderer: 'webgl',
  pixelRatio: 1,
  views: { a: '2D 박스 (단일 패스)', b: 'Dual filter (Kawase)' },
  info: `
    <p>블러 커널(Kernel)은 픽셀 주변을 어떤 가중치로 섞을지 정한 표. 같은 반경이라도 읽는 방식에 따라 비용이 크게 다름.</p>
    <ul>
    <li><b>2D 박스</b>: (2r+1)² 샘플을 평균. 반경 12면 픽셀당 625회. 사각형 모양으로 번짐(박스 아티팩트).</li>
    <li><b>분리형(Separable)</b>: 가로 1D → 세로 1D 두 패스. 2D 가우시안과 박스는 두 1D 커널의 곱이라 결과는 같음. 비용은 2(2r+1).</li>
    <li><b>선형 샘플링 가우시안</b>: 인접한 두 탭을 가중치 비율 위치에서 bilinear 한 번으로 읽음. 탭 수가 거의 절반이 됨 (Rákos 2010).</li>
    <li><b>Kawase</b>: 패스마다 대각선 4탭을 점점 넓은 간격(0,1,2,2,3…)으로 반복. 여러 번 겹치면 가우시안에 가까워짐.</li>
    <li><b>Dual filter</b> (Bjørge 2015): 반해상도로 내려가며 5탭, 올라오며 8탭. 단계마다 처리 픽셀 수가 1/4로 줄어 모바일에서 가장 저렴함.</li>
    </ul>
    <p>GPU 시간은 프레임워크의 ⏱(CPU 측정)에 잘 잡히지 않음. "GPU 동기화"를 켜면 1픽셀 readPixels로 GPU 작업이 끝날 때까지 기다린 시간을 잼.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 172" xmlns="http://www.w3.org/2000/svg">
    <text x="54" y="14" text-anchor="middle" class="t-a">${L('2D 박스', '2D box')}</text>
    <text x="162" y="14" text-anchor="middle">${L('분리형', 'Separable')}</text>
    <text x="270" y="14" text-anchor="middle">${L('선형 샘플링', 'Linear sampling')}</text>
    <text x="378" y="14" text-anchor="middle">Kawase</text>
    <text x="486" y="14" text-anchor="middle" class="t-b">Dual filter</text>
    ${[0, 1, 2, 3, 4].map((j) => [0, 1, 2, 3, 4].map((i) => `<circle cx="${26 + i * 14}" cy="${40 + j * 14}" r="3.5" class="f-a"/>`).join('')).join('')}
    ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${134 + i * 14}" cy="34" r="3.5" class="f-accent"/>`).join('')}
    <text x="200" y="37" class="t-small t-dim">1</text>
    ${[0, 1, 2, 3, 4].map((j) => `<circle cx="162" cy="${54 + j * 12}" r="3.5" class="f-accent"/>`).join('')}
    <text x="172" y="88" class="t-small t-dim">2</text>
    ${[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((i) => `<circle cx="${270 + i * 10}" cy="68" r="2.5" class="f-dim"/>`).join('')}
    ${[-35, -15, 0, 15, 35].map((x) => `<circle cx="${270 + x}" cy="68" r="4.5" class="f-accent" opacity="0.85"/>`).join('')}
    <rect x="376" y="66" width="4" height="4" class="f-dim"/>
    ${[[8, 1], [16, 0.65], [24, 0.35]].map(([o, a]) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => `<circle cx="${378 + sx * o}" cy="${68 + sy * o}" r="3.5" class="f-accent" opacity="${a}"/>`).join('')).join('')}
    <rect x="456" y="34" width="60" height="36" class="f-b" opacity="0.35"/>
    <rect x="466" y="76" width="40" height="22" class="f-b" opacity="0.55"/>
    <rect x="473" y="102" width="26" height="12" class="f-b" opacity="0.8"/>
    <text x="54" y="128" text-anchor="middle" class="t-small t-mono">(2r+1)^2</text>
    <text x="54" y="142" text-anchor="middle" class="t-small t-dim">${L('r=12면 625탭', '625 taps at r=12')}</text>
    <text x="162" y="128" text-anchor="middle" class="t-small t-mono">2(2r+1)</text>
    <text x="162" y="142" text-anchor="middle" class="t-small t-dim">${L('r=12면 50탭', '50 taps at r=12')}</text>
    <text x="270" y="128" text-anchor="middle" class="t-small">${L('탭 수 절반', 'Half the taps')}</text>
    <text x="270" y="142" text-anchor="middle" class="t-small t-dim">${L('bilinear 1회 = 2탭', '1 read = 2 taps')}</text>
    <text x="378" y="128" text-anchor="middle" class="t-small">${L('패스마다 4탭', '4 taps per pass')}</text>
    <text x="378" y="142" text-anchor="middle" class="t-small t-dim">${L('간격을 넓혀 반복', 'wider each pass')}</text>
    <text x="486" y="128" text-anchor="middle" class="t-small">${L('1/2씩 축소 후 확대', 'Down by 1/2, then up')}</text>
    <text x="486" y="142" text-anchor="middle" class="t-small t-dim">${L('내림 5탭, 올림 8탭', '5 taps down, 8 up')}</text>
    <text x="270" y="166" text-anchor="middle" class="t-small t-dim">${L('같은 반경이라도 픽셀당 읽는 횟수가 크게 다름', 'Same radius, very different reads per pixel')}</text>
  </svg>`,
  look: [
    '반경을 키우며 A(2D 박스)와 B의 "픽셀당 샘플", "GPU 대기 포함 시간"을 비교하면 A만 급격히 느려짐.',
    'A를 분리형 가우시안으로 바꾸면 박스 특유의 사각 번짐이 사라지고 비용도 크게 줄어듦.',
    '"원본과 반반 보기"를 켜고 밝은 점과 가는 선을 보면 커널 모양 차이가 잘 보임 (박스는 각짐, 가우시안은 둥긂).',
    'Kawase나 Dual로 반경을 바꾸면 번짐이 단계 단위로 늘어 반경을 정확히 맞추기 어려움. 대신 비용이 아주 낮음.',
  ],
  refs: [
    { type: 'talk', title: 'Bandwidth-Efficient Rendering (Marius Bjørge, ARM)', year: 2015, note: 'SIGGRAPH 2015. Dual Kawase(Dual filter) 블러.' },
    { type: 'talk', title: 'Frame Buffer Postprocessing Effects in DOUBLE-S.T.E.A.L (Wreckless) (Masaki Kawase)', year: 2003, note: 'GDC 2003. Kawase 블러.' },
    { type: 'article', title: 'Efficient Gaussian blur with linear sampling (Daniel Rákos)', year: 2010, note: 'RasterGrid 블로그. bilinear 한 번으로 두 탭을 읽는 방법.' },
    { type: 'book', title: 'GPU Gems 3, Ch.40: Incremental Computation of the Gaussian (Ken Turkowski)', year: 2007 },
  ],
  params: [
    { key: 'method', label: '방식', type: 'select', group: '블러', options: [
      { value: 'box2d', label: '2D 박스 (단일 패스)' },
      { value: 'boxSep', label: '분리형 박스 (2패스)' },
      { value: 'gaussSep', label: '분리형 가우시안 (2패스)' },
      { value: 'gaussLin', label: '분리형 가우시안 + 선형 샘플링' },
      { value: 'kawase', label: 'Kawase (다중 패스)' },
      { value: 'dual', label: 'Dual filter (다운/업샘플)' },
    ], a: 'box2d', b: 'dual' },
    { key: 'radius', label: '반경 (px)', type: 'int', min: 1, max: 24, default: 10, help: '2D 박스는 최대 16까지만 적용' },
    { key: 'split', label: '원본과 반반 보기', type: 'bool', default: false, group: '표시' },
    { key: 'sync', label: 'GPU 동기화 (시간 측정)', type: 'bool', default: true },
    { key: 'animate', label: '움직임', type: 'bool', default: true, shared: true },
  ],

  en: {
    title: 'Blur Kernels Compared (Box, Gaussian, Kawase, Dual)',
    summary: 'Two blurs with the same radius can differ a lot in texture samples per pixel: from hundreds down to tens, depending on the method. This sample compares ways to cut the cost: separable kernels, linear sampling, and multi-step downscaling.',
    views: { a: '2D box (single pass)', b: 'Dual filter (Kawase)' },
    info: `
    <p>A blur kernel is a table of weights that says how to mix the pixels around each pixel. With the same radius, the cost depends a lot on how you read the pixels.</p>
    <ul>
    <li><b>2D box</b>: average (2r+1)<sup>2</sup> samples. At radius 12 that is 625 reads per pixel. The blur spreads in a square shape (box artifact).</li>
    <li><b>Separable</b>: two passes, a horizontal 1D pass and then a vertical 1D pass. A 2D Gaussian or box is the product of two 1D kernels, so the result is the same. The cost is 2(2r+1).</li>
    <li><b>Linear sampling Gaussian</b>: read two neighboring taps with one bilinear fetch, placed by the ratio of their weights. This almost halves the tap count (Rákos 2010).</li>
    <li><b>Kawase</b>: each pass reads 4 diagonal taps at a growing spacing (0, 1, 2, 2, 3...). After several passes the result looks close to a Gaussian.</li>
    <li><b>Dual filter</b> (Bjørge 2015): 5 taps on the way down to half resolution, 8 taps on the way up. Each step works on 1/4 of the pixels, so it is the cheapest choice on mobile.</li>
    </ul>
    <p>The framework's ⏱ (a CPU measurement) does not capture GPU time well. Turn on "GPU sync" to call a 1-pixel readPixels. It measures the time spent waiting until the GPU work finishes.</p>`,
    look: [
    'Raise the radius and compare "Samples per pixel" and "Time incl. GPU wait" in A (2D box) and B. Only A slows down sharply.',
    'Switch A to separable Gaussian. The square blur of the box goes away, and the cost drops a lot.',
    'Turn on "Split with original" and look at bright dots and thin lines. The kernel shapes differ clearly (box looks blocky, Gaussian looks round).',
    'With Kawase or Dual, the blur grows in steps when you change the radius. So it is hard to hit an exact radius. In return, the cost is very low.',
    ],
    refs: [
    'SIGGRAPH 2015. Dual Kawase (dual filter) blur.',
    'GDC 2003. The Kawase blur.',
    'RasterGrid blog. How to read two taps with one bilinear fetch.',
    null,
    ],
    params: {
      method: { label: 'Method', group: 'Blur', options: { box2d: '2D box (single pass)', boxSep: 'Separable box (2 passes)', gaussSep: 'Separable Gaussian (2 passes)', gaussLin: 'Separable Gaussian + linear sampling', kawase: 'Kawase (multi-pass)', dual: 'Dual filter (down/upsample)' } },
      radius: { label: 'Radius (px)', help: '2D box applies up to 16 only' },
      split: { label: 'Split with original', group: 'Display' },
      sync: 'GPU sync (timing)',
      animate: 'Motion',
    },
  },

  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, P = ctx.params;
    const HEAD = `
      precision mediump float;
      uniform sampler2D u_src; uniform vec2 u_texel; varying vec2 v_uv;
    `;
    const progs = {
      copy: U.gl.program(gl, U.gl.QUAD_VS, HEAD + `
        uniform sampler2D u_orig; uniform float u_split;
        void main(){
          vec3 c = texture2D(u_src, v_uv).rgb;
          if (u_split > 0.5 && v_uv.x < 0.5) c = texture2D(u_orig, v_uv).rgb;
          if (u_split > 0.5 && abs(v_uv.x - 0.5) < u_texel.x) c = vec3(1.0, 0.8, 0.2);
          gl_FragColor = vec4(c, 1.0);
        }`),
      box2d: U.gl.program(gl, U.gl.QUAD_VS, HEAD + `
        uniform float u_r;
        void main(){
          vec3 s = vec3(0.0);
          for (int y = -16; y <= 16; y++) {
            if (abs(float(y)) > u_r) continue;
            for (int x = -16; x <= 16; x++) {
              if (abs(float(x)) > u_r) continue;
              s += texture2D(u_src, v_uv + vec2(float(x), float(y)) * u_texel).rgb;
            }
          }
          float n = 2.0 * u_r + 1.0;
          gl_FragColor = vec4(s / (n * n), 1.0);
        }`),
      sep: U.gl.program(gl, U.gl.QUAD_VS, HEAD + `
        uniform float u_r; uniform vec2 u_dir; uniform float u_gauss;
        void main(){
          vec3 s = vec3(0.0); float wsum = 0.0;
          float sigma = max(u_r / 2.0, 0.5);
          for (int i = -24; i <= 24; i++) {
            float fi = float(i);
            if (abs(fi) > u_r) continue;
            float w = u_gauss > 0.5 ? exp(-fi * fi / (2.0 * sigma * sigma)) : 1.0;
            s += texture2D(u_src, v_uv + u_dir * fi * u_texel).rgb * w;
            wsum += w;
          }
          gl_FragColor = vec4(s / wsum, 1.0);
        }`),
      lin: U.gl.program(gl, U.gl.QUAD_VS, HEAD + `
        uniform float u_r; uniform vec2 u_dir;
        void main(){
          float sigma = max(u_r / 2.0, 0.5);
          vec3 s = texture2D(u_src, v_uv).rgb;
          float wsum = 1.0;
          for (int k = 0; k < 12; k++) {
            float a = 2.0 * float(k) + 1.0, b = a + 1.0;
            if (a > u_r) continue;
            float wa = exp(-a * a / (2.0 * sigma * sigma));
            float wb = b <= u_r ? exp(-b * b / (2.0 * sigma * sigma)) : 0.0;
            float w = wa + wb;
            float off = (a * wa + b * wb) / w;
            vec2 o = u_dir * off * u_texel;
            s += (texture2D(u_src, v_uv + o).rgb + texture2D(u_src, v_uv - o).rgb) * w;
            wsum += 2.0 * w;
          }
          gl_FragColor = vec4(s / wsum, 1.0);
        }`),
      kawase: U.gl.program(gl, U.gl.QUAD_VS, HEAD + `
        uniform float u_off;
        void main(){
          vec2 o = (u_off + 0.5) * u_texel;
          vec3 s = texture2D(u_src, v_uv + vec2(o.x, o.y)).rgb + texture2D(u_src, v_uv + vec2(-o.x, o.y)).rgb
                 + texture2D(u_src, v_uv + vec2(o.x, -o.y)).rgb + texture2D(u_src, v_uv + vec2(-o.x, -o.y)).rgb;
          gl_FragColor = vec4(s * 0.25, 1.0);
        }`),
      down: U.gl.program(gl, U.gl.QUAD_VS, HEAD + `
        void main(){
          vec2 h = u_texel * 0.5;
          vec3 s = texture2D(u_src, v_uv).rgb * 4.0;
          s += texture2D(u_src, v_uv - h).rgb;
          s += texture2D(u_src, v_uv + h).rgb;
          s += texture2D(u_src, v_uv + vec2(h.x, -h.y)).rgb;
          s += texture2D(u_src, v_uv - vec2(h.x, -h.y)).rgb;
          gl_FragColor = vec4(s / 8.0, 1.0);
        }`),
      up: U.gl.program(gl, U.gl.QUAD_VS, HEAD + `
        void main(){
          vec2 h = u_texel * 0.5;
          vec3 s = texture2D(u_src, v_uv + vec2(-h.x * 2.0, 0.0)).rgb;
          s += texture2D(u_src, v_uv + vec2(-h.x, h.y)).rgb * 2.0;
          s += texture2D(u_src, v_uv + vec2(0.0, h.y * 2.0)).rgb;
          s += texture2D(u_src, v_uv + vec2(h.x, h.y)).rgb * 2.0;
          s += texture2D(u_src, v_uv + vec2(h.x * 2.0, 0.0)).rgb;
          s += texture2D(u_src, v_uv + vec2(h.x, -h.y)).rgb * 2.0;
          s += texture2D(u_src, v_uv + vec2(0.0, -h.y * 2.0)).rgb;
          s += texture2D(u_src, v_uv + vec2(-h.x, -h.y)).rgb * 2.0;
          gl_FragColor = vec4(s / 12.0, 1.0);
        }`),
    };
    const quad = U.gl.quad(gl);

    // ── 원본: 선명한 고대비 이미지 (캔버스로 생성, 뷰 해상도와 1:1) ──
    let srcCv = null, srcTex = null, fbA = null, fbB = null, chain = [], fw = 0, fh = 0, t = 0, gpuMs = 0;
    function drawSource(time) {
      const g = srcCv.getContext('2d'), w = fw, h = fh;
      g.fillStyle = '#0d0f14'; g.fillRect(0, 0, w, h);
      const r = U.rng(5);
      // 체커
      for (let y = 0; y < h * 0.4; y += 16) for (let x = 0; x < w * 0.35; x += 16) { if (((x + y) >> 4) & 1) { g.fillStyle = '#e8e8e8'; g.fillRect(x, y, 16, 16); } }
      // 가는 선
      g.strokeStyle = '#ffffff'; g.lineWidth = 1;
      for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(w * 0.4 + i * 9, 10); g.lineTo(w * 0.4 + i * 9 + 60, h * 0.42); g.stroke(); }
      // 밝은 점
      for (let i = 0; i < 40; i++) { g.fillStyle = U.hsl(r.int(0, 360), 90, 70); g.fillRect(r.int(w * 0.62, w - 6), r.int(6, h * 0.42), 2, 2); }
      // 텍스트
      g.fillStyle = '#ffcb6b'; g.font = `bold ${Math.round(h * 0.12)}px sans-serif`; g.textBaseline = 'middle';
      g.fillText(GTL.L('BLUR 블러', 'BLUR blur'), w * 0.05, h * 0.58);
      // 색 도형 (움직임)
      const cx = w * (0.6 + 0.25 * Math.sin(time * 0.7));
      g.fillStyle = '#4fc3f7'; g.beginPath(); g.arc(cx, h * 0.78, h * 0.1, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ff7a59'; g.fillRect(w * 0.1, h * 0.7, w * 0.25, h * 0.16);
      g.fillStyle = '#66d17a'; g.fillRect(w * 0.12 + Math.sin(time) * 20, h * 0.74, 3, h * 0.2);
    }
    function rebuild() {
      fw = ctx.pixelWidth; fh = ctx.pixelHeight;
      srcCv = ctx.createCanvas(fw, fh);
      if (srcTex) gl.deleteTexture(srcTex);
      srcTex = U.gl.texture(gl, null, {});
      gl.bindTexture(gl.TEXTURE_2D, srcTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fw, fh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      for (const f of [fbA, fbB, ...chain]) if (f) f.dispose();
      fbA = U.gl.framebuffer(gl, fw, fh); fbB = U.gl.framebuffer(gl, fw, fh);
      chain = []; let w = fw, h = fh;
      for (let i = 0; i < 6; i++) { w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); chain.push(U.gl.framebuffer(gl, w, h)); }
    }

    function run(prog, target, tex, tw, th, setU) {
      if (target) target.bind(); else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, fw, fh); }
      prog.use();
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(prog.u('u_src'), 0);
      gl.uniform2f(prog.u('u_texel'), 1 / tw, 1 / th);
      if (setU) setU(prog);
      quad.draw(prog);
    }

    const px = new Uint8Array(4);
    return {
      update(dt) { if (P.animate) t += dt; },
      render() {
        if (!srcCv || fw !== ctx.pixelWidth || fh !== ctx.pixelHeight) rebuild();
        drawSource(t);
        gl.bindTexture(gl.TEXTURE_2D, srcTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // 캔버스 위쪽 = v 1
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, srcCv);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.disable(gl.BLEND);
        const r = P.radius, m = P.method;
        let out = srcTex, taps = 0, passes = 0, pixWork = 0;
        const full = fw * fh;
        if (P.sync) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); // 이전 작업을 비우고 시작
        const t0 = ctx.now();
        if (m === 'box2d') {
          const rr = Math.min(16, r);
          run(progs.box2d, fbA, srcTex, fw, fh, (p) => gl.uniform1f(p.u('u_r'), rr));
          out = fbA.tex; taps = (2 * rr + 1) ** 2; passes = 1; pixWork = full;
        } else if (m === 'boxSep' || m === 'gaussSep') {
          const gs = m === 'gaussSep' ? 1 : 0;
          run(progs.sep, fbA, srcTex, fw, fh, (p) => { gl.uniform1f(p.u('u_r'), r); gl.uniform2f(p.u('u_dir'), 1, 0); gl.uniform1f(p.u('u_gauss'), gs); });
          run(progs.sep, fbB, fbA.tex, fw, fh, (p) => { gl.uniform1f(p.u('u_r'), r); gl.uniform2f(p.u('u_dir'), 0, 1); gl.uniform1f(p.u('u_gauss'), gs); });
          out = fbB.tex; taps = 2 * (2 * r + 1); passes = 2; pixWork = 2 * full;
        } else if (m === 'gaussLin') {
          run(progs.lin, fbA, srcTex, fw, fh, (p) => { gl.uniform1f(p.u('u_r'), r); gl.uniform2f(p.u('u_dir'), 1, 0); });
          run(progs.lin, fbB, fbA.tex, fw, fh, (p) => { gl.uniform1f(p.u('u_r'), r); gl.uniform2f(p.u('u_dir'), 0, 1); });
          out = fbB.tex; taps = 2 * (1 + 2 * Math.ceil(r / 2)); passes = 2; pixWork = 2 * full;
        } else if (m === 'kawase') {
          // 반경에 맞춰 오프셋 수열 0,1,2,2,3,4,5,6... 사용
          const seq = [0, 1, 2, 2, 3, 4, 5, 6, 7, 8];
          let acc = 0, n = 0;
          while (n < seq.length && acc < r) { acc += seq[n] + 1; n++; }
          n = Math.max(1, n);
          let src = srcTex, dst = fbA;
          for (let i = 0; i < n; i++) {
            run(progs.kawase, dst, src, fw, fh, (p) => gl.uniform1f(p.u('u_off'), seq[i]));
            src = dst.tex; dst = dst === fbA ? fbB : fbA;
          }
          out = src; taps = 4 * n; passes = n; pixWork = n * full;
        } else if (m === 'dual') {
          const L = U.clamp(Math.round(Math.log2(r)), 1, 6);
          let src = srcTex, sw = fw, sh = fh;
          for (let i = 0; i < L; i++) {
            run(progs.down, chain[i], src, sw, sh);
            src = chain[i].tex; sw = chain[i].width; sh = chain[i].height;
            pixWork += sw * sh; taps += 5 * (sw * sh) / full;
          }
          for (let i = L - 2; i >= -1; i--) {
            const target = i >= 0 ? chain[i] : fbA;
            run(progs.up, target, src, sw, sh);
            src = target.tex; sw = target.width; sh = target.height;
            pixWork += sw * sh; taps += 8 * (sw * sh) / full;
          }
          out = fbA.tex; passes = L * 2;
        }
        // 화면 출력
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, fw, fh);
        progs.copy.use();
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, out);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, srcTex);
        gl.uniform1i(progs.copy.u('u_src'), 0);
        gl.uniform1i(progs.copy.u('u_orig'), 1);
        gl.uniform2f(progs.copy.u('u_texel'), 1 / fw, 1 / fh);
        gl.uniform1f(progs.copy.u('u_split'), P.split ? 1 : 0);
        quad.draw(progs.copy);
        gl.activeTexture(gl.TEXTURE0);
        if (P.sync) { gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const ms = ctx.now() - t0; gpuMs = gpuMs ? gpuMs * 0.9 + ms * 0.1 : ms; }
        ctx.stat(GTL.L('픽셀당 샘플 (출력 기준)', 'Samples per pixel (output)'), taps.toFixed(1));
        ctx.stat(GTL.L('패스 수', 'Passes'), passes);
        ctx.stat(GTL.L('처리 픽셀', 'Pixels processed'), (pixWork / 1e6).toFixed(2) + ' M');
        ctx.stat(GTL.L('GPU 대기 포함 시간', 'Time incl. GPU wait'), P.sync ? gpuMs.toFixed(2) + ' ms' : GTL.L('꺼짐', 'Off'));
      },
    };
  },
});
