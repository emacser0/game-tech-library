// 프리멀티플라이드 알파 vs 스트레이트 알파: 필터링 시 생기는 어두운 테두리(프린지)
GTL.register({
  id: 'premultiplied-alpha',
  title: '프리멀티플라이드 알파 vs 스트레이트 알파',
  summary: '투명 픽셀의 RGB는 보이지 않지만, bilinear 필터링과 밉맵이 이웃 픽셀을 섞을 때 끌려 들어옴. 스트레이트 알파에서는 검은 테두리가 생기고, 프리멀티플라이드 알파에서는 수학적으로 사라짐.',
  renderer: 'webgl',
  views: { a: '스트레이트 알파', b: '프리멀티플라이드 알파' },
  info: `
    <p><b>스트레이트(Straight) 알파</b>는 (r, g, b, a)를 따로 저장하고, 블렌딩 때 <code>src×a + dst×(1−a)</code>를 계산함.
    완전 투명 픽셀(a=0)의 RGB는 보통 검정(0,0,0)임.</p>
    <p>문제는 가장자리에서 일어남. GPU가 불투명 주황 (1,0.5,0)과 투명 검정 (0,0,0,0)을 반반 섞으면 <b>(0.5, 0.25, 0, 0.5)</b>가 됨.
    이 값은 반투명한 <b>어두운 주황</b>이라서 테두리가 시커멓게 보임. 이 테두리를 프린지(Fringe)라고 부름.</p>
    <p><b>프리멀티플라이드(Premultiplied) 알파</b>는 RGB에 a를 미리 곱해 (r×a, g×a, b×a, a)로 저장하고, <code>src + dst×(1−a)</code>로 블렌딩함.
    같은 보간 결과 (0.5, 0.25, 0, 0.5)가 이번에는 "불투명 주황 50%"를 정확히 뜻함.</p>
    <ul>
    <li>필터링, 밉맵, 합성이 모두 선형 연산으로 올바르게 동작함.</li>
    <li>a=0이면서 RGB가 있는 픽셀로 <b>가산 블렌딩</b>까지 같은 블렌드 상태에서 표현 가능.</li>
    </ul>
    <p>"셰이더에서 곱하기"는 흔한 실수. 필터링이 <i>이미 끝난 뒤</i>에 곱하므로 프린지가 그대로 남음.
    스트레이트 알파를 유지해야 하면 <b>알파 블리딩</b>(Edge Padding)으로 완화함. 투명 영역에 가장자리 색을 번지게 칠하는 방법임.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 176" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="14">${L('가장자리 텍셀 두 개를 bilinear로 반반 섞음', 'Bilinear blends two edge texels half and half')}</text>
    <rect x="20" y="26" width="40" height="40" class="f-a"/>
    <text x="40" y="82" text-anchor="middle" class="t-small t-mono">(1, .5, 0, 1)</text>
    <rect x="120" y="26" width="40" height="40" class="d-dim" fill="none" stroke-dasharray="3 2"/>
    <text x="140" y="82" text-anchor="middle" class="t-small t-mono">(0, 0, 0, 0)</text>
    <text x="90" y="50" text-anchor="middle">+</text>
    <path d="M170,46 L210,46" class="d-accent" marker-end="url(#arr)"/>
    <rect x="214" y="30" width="130" height="32" rx="3" class="f-dim"/>
    <text x="279" y="50" text-anchor="middle" class="t-small t-mono">(.5, .25, 0, .5)</text>
    <text x="279" y="80" text-anchor="middle" class="t-small t-dim">${L('같은 숫자, 해석이 다름', 'Same numbers, read differently')}</text>
    <path d="M344,40 L380,30" class="d-a"/><path d="M344,52 L380,104" class="d-b"/>
    <text x="384" y="20" class="t-a">${L('A: 스트레이트로 읽음', 'A: read as straight')}</text>
    <rect x="384" y="28" width="26" height="26" class="d-dim" fill="none"/>${[0, 1, 2, 3].map((j) => [0, 1, 2, 3].map((i) => (i + j) % 2 ? '' : `<rect x="${384 + i * 6.5}" y="${28 + j * 6.5}" width="6.5" height="6.5" class="f-a"/><rect x="${384 + i * 6.5}" y="${28 + j * 6.5}" width="6.5" height="6.5" class="f-dim" opacity="0.7"/>`).join('')).join('')}
    <text x="416" y="40" class="t-small">${L('색 (.5, .25, 0)', 'color (.5, .25, 0)')}</text>
    <text x="416" y="52" class="t-small">${L('= 어두운 주황 50%', '= dark orange 50%')}</text>
    <text x="384" y="72" class="t-small t-dim">${L('테두리가 시커멓게 보임', 'Edges look dark (fringe)')}</text>
    <text x="384" y="96" class="t-b">${L('B: 프리멀티플라이드로 읽음', 'B: read as premultiplied')}</text>
    <rect x="384" y="104" width="26" height="26" class="d-dim" fill="none"/>${[0, 1, 2, 3].map((j) => [0, 1, 2, 3].map((i) => (i + j) % 2 ? '' : `<rect x="${384 + i * 6.5}" y="${104 + j * 6.5}" width="6.5" height="6.5" class="f-a"/>`).join('')).join('')}
    <text x="416" y="116" class="t-small">rgb / a = (1, .5, 0)</text>
    <text x="416" y="128" class="t-small">${L('= 주황 50%, 정확함', '= orange 50%, correct')}</text>
    <text x="10" y="112" class="t-small t-mono t-a">A: src x a + dst x (1 - a)</text>
    <text x="10" y="128" class="t-small t-mono t-b">B: src + dst x (1 - a)</text>
    <text x="10" y="146" class="t-small t-dim">${L('체크 무늬 = 덮는 비율 50%', 'Checker = 50% coverage')}</text>
    <text x="10" y="164" class="t-small t-dim">${L('B는 RGB에 a를 미리 곱해 저장해서, 필터링한 값이 그대로 올바른 색이 됨', 'B stores RGB already multiplied by a, so filtered values stay correct colors')}</text>
  </svg>`,
  look: [
    '배경을 밝은 하늘로 두면 A의 별 테두리와 가는 광선에 검은 띠가 보임. B는 깨끗함.',
    '"크기"를 줄여 밉맵이 쓰이게 하면 A의 작은 별들이 전체적으로 어둡고 탁해짐 (밉맵 평균에 검정이 섞임).',
    'A에서 "투명 픽셀 RGB"를 흰색이나 마젠타로 바꾸면 프린지 색도 그대로 따라 바뀜. 보이지 않아야 할 데이터가 보이는 것.',
    'A를 "셰이더에서 곱하기"로 바꿔도 프린지는 남음. "알파 블리딩"을 쓰면 크게 줄어듦.',
    '필터를 Nearest로 바꾸면 두 방식의 차이가 사라짐. 문제의 원인이 보간이라는 뜻.',
  ],
  refs: [
    { type: 'article', title: 'Premultiplied alpha (Shawn Hargreaves Blog)', year: 2006, note: 'XNA 팀의 글. 프리멀티플라이드 알파가 "올바른" 표현인 이유를 설명함. XNA 4.0이 기본값으로 채택.' },
    { type: 'paper', title: 'Compositing Digital Images (Thomas Porter, Tom Duff)', url: 'https://dl.acm.org/doi/10.1145/964965.808606', year: 1984, note: 'SIGGRAPH. over 연산자와 premultiplied 표현의 원전.' },
    { type: 'article', title: 'WebGL: UNPACK_PREMULTIPLY_ALPHA_WEBGL / premultipliedAlpha', url: 'https://registry.khronos.org/webgl/specs/latest/1.0/', note: 'WebGL 명세의 텍스처 업로드와 캔버스 합성 규칙.' },
    { type: 'engine', title: 'Unity: Texture Import Settings: Alpha Is Transparency', url: 'https://docs.unity3d.com/Manual/class-TextureImporter.html', note: '투명 픽셀을 주변 색으로 채워(블리딩) 필터링 프린지를 줄이는 옵션.' },
  ],
  params: [
    { key: 'mode', label: '알파 방식', type: 'select', group: '블렌딩', options: [
      { value: 'straight', label: '스트레이트 (SRC_ALPHA, 1−SRC_ALPHA)' },
      { value: 'shaderMul', label: '스트레이트 텍스처 + 셰이더에서 rgb×a' },
      { value: 'premul', label: '프리멀티플라이드 (ONE, 1−SRC_ALPHA)' },
    ], a: 'straight', b: 'premul' },
    { key: 'clearColor', label: '투명 픽셀 RGB', type: 'select', options: [
      { value: 'black', label: '검정 (일반적)' },
      { value: 'white', label: '흰색' },
      { value: 'magenta', label: '마젠타' },
      { value: 'bleed', label: '알파 블리딩 (가장자리 색 확장)' },
    ], default: 'black', when: (p) => p.mode !== 'premul', help: '프리멀티플라이드에서는 항상 0' },
    { key: 'filter', label: '필터', type: 'select', options: [
      { value: 'nearest', label: 'Nearest' },
      { value: 'linear', label: 'Bilinear' },
      { value: 'mip', label: 'Trilinear (밉맵)' },
    ], default: 'mip' },
    { key: 'size', label: '크기', type: 'range', min: 0.2, max: 3, step: 0.01, default: 1, group: '장면', shared: true },
    { key: 'bg', label: '배경', type: 'select', options: [
      { value: 'sky', label: '밝은 하늘' },
      { value: 'dark', label: '어두운 배경' },
      { value: 'checker', label: '체커' },
    ], default: 'sky', shared: true },
    { key: 'additive', label: '가산 반짝이 (a=0 픽셀)', type: 'bool', default: true, shared: true, help: '같은 블렌드 상태로 가산 효과를 내는 것은 프리멀티플라이드에서만 가능' },
    { key: 'spin', label: '회전', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Premultiplied Alpha vs Straight Alpha',
    summary: 'You cannot see the RGB of a transparent pixel. But bilinear filtering and mipmaps pull it in when they mix neighbor pixels. Straight alpha shows a black edge. Premultiplied alpha removes it by the math.',
    views: { a: 'Straight alpha', b: 'Premultiplied alpha' },
    info: `
    <p><b>Straight alpha</b> stores (r, g, b, a) separately. Blending computes <code>src×a + dst×(1−a)</code>.
    A fully transparent pixel (a=0) usually has black RGB (0,0,0).</p>
    <p>The problem shows up at edges. When the GPU mixes opaque orange (1,0.5,0) and transparent black (0,0,0,0) half and half, the result is <b>(0.5, 0.25, 0, 0.5)</b>.
    This is a half-transparent <b>dark orange</b>, so the edge looks dark. This dark edge is called a fringe.</p>
    <p><b>Premultiplied alpha</b> multiplies RGB by a in advance and stores (r×a, g×a, b×a, a). It blends with <code>src + dst×(1−a)</code>.
    Now the same filtered value (0.5, 0.25, 0, 0.5) means exactly "opaque orange at 50%".</p>
    <ul>
    <li>Filtering, mipmaps, and compositing are all linear, so they all work correctly.</li>
    <li>A pixel with a=0 and some RGB gives <b>additive blending</b> with the same blend state.</li>
    </ul>
    <p>"Multiply in the shader" is a common mistake. It multiplies <i>after</i> filtering is already done, so the fringe stays.
    If you must keep straight alpha, use <b>alpha bleeding</b> (edge padding) to reduce it. This paints edge colors out into the transparent area.</p>`,
    look: [
      'Set the background to bright sky. A shows black bands on the star edges and thin rays. B is clean.',
      'Lower "Size" so mipmaps are used. The small stars in A look darker and muddy overall (black mixes into the mipmap average).',
      'In A, change "Transparent pixel RGB" to white or magenta. The fringe color follows it. Data that should be invisible becomes visible.',
      'Switch A to "multiply in shader". The fringe stays. "Alpha bleeding" reduces it a lot.',
      'Set the filter to Nearest. The difference between the two disappears. This shows that interpolation causes the problem.',
    ],
    refs: [
      'From the XNA team. Explains why premultiplied alpha is the "correct" form. XNA 4.0 made it the default.',
      'SIGGRAPH. The original source of the over operator and the premultiplied form.',
      'Texture upload and canvas compositing rules in the WebGL spec.',
      'Fills transparent pixels with nearby colors (bleeding) to reduce filtering fringes.',
    ],
    params: {
      mode: { label: 'Alpha mode', group: 'Blending', options: {
        straight: 'Straight (SRC_ALPHA, 1−SRC_ALPHA)',
        shaderMul: 'Straight texture + rgb×a in shader',
        premul: 'Premultiplied (ONE, 1−SRC_ALPHA)',
      } },
      clearColor: { label: 'Transparent pixel RGB', help: 'Always 0 with premultiplied', options: {
        black: 'Black (common)', white: 'White', magenta: 'Magenta', bleed: 'Alpha bleeding (extend edge color)',
      } },
      filter: { label: 'Filter', options: { mip: 'Trilinear (mipmap)' } },
      size: { label: 'Size', group: 'Scene' },
      bg: { label: 'Background', options: { sky: 'Bright sky', dark: 'Dark background', checker: 'Checker' } },
      additive: { label: 'Additive sparkles (a=0 pixels)', help: 'Only premultiplied gives additive effects with the same blend state' },
      spin: 'Rotate',
    },
  },

  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, P = ctx.params;
    const N = 128;

    // ── 스프라이트 생성: 주황→노랑 별 + 가는 광선, 부드러운 가장자리 ──
    const cov = new Float32Array(N * N), col = new Float32Array(N * N * 3);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = (x + 0.5 - N / 2), dy = (y + 0.5 - N / 2), r = Math.hypot(dx, dy), th = Math.atan2(dy, dx);
      const starR = N * 0.26 * (0.62 + 0.38 * Math.cos(5 * th));
      let a = U.clamp((starR - r) / 1.2 + 0.5, 0, 1);
      // 가운데 구멍
      a *= U.clamp((r - N * 0.06) / 1.2 + 0.5, 0, 1);
      // 가는 광선 16개 (폭 ~1px)
      const k = ((th / (Math.PI * 2)) * 16 + 16.5) % 1 - 0.5;
      const ray = U.clamp(1 - Math.abs(k * r * Math.PI * 2 / 16) / 0.8, 0, 1) * U.clamp((N * 0.48 - r) / 2, 0, 1) * 0.85;
      a = Math.max(a, ray);
      const i = y * N + x, t = U.clamp(r / (N * 0.4), 0, 1);
      cov[i] = a;
      col[i * 3] = 1.0; col[i * 3 + 1] = 0.85 - 0.5 * t; col[i * 3 + 2] = 0.15 * (1 - t);
    }
    // 반짝이 스프라이트 (가산): rgb는 있지만 a=0, 프리멀티플라이드에서만 의미 있음
    const glow = new Uint8Array(32 * 32 * 4);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const dx = x + 0.5 - 16, dy = y + 0.5 - 16, d = Math.hypot(dx, dy);
      const v = Math.exp(-d * d / 30) + 0.6 * Math.exp(-Math.abs(dx) * 1.5) * Math.exp(-dy * dy / 60) + 0.6 * Math.exp(-Math.abs(dy) * 1.5) * Math.exp(-dx * dx / 60);
      const o = (y * 32 + x) * 4, c = Math.min(1, v);
      glow[o] = c * 255; glow[o + 1] = c * 230; glow[o + 2] = c * 160; glow[o + 3] = 0;
    }

    function makeStraight(kind) {
      const d = new Uint8Array(N * N * 4);
      let fill = new Float32Array(col);
      if (kind === 'bleed') {
        // 반복 팽창: 투명 픽셀을 불투명 이웃 평균색으로 채움
        const known = new Uint8Array(N * N);
        for (let i = 0; i < N * N; i++) known[i] = cov[i] > 0.01 ? 1 : 0;
        for (let it = 0; it < 12; it++) {
          const nk = known.slice(), nf = fill.slice();
          for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            const i = y * N + x; if (known[i]) continue;
            let r = 0, g = 0, b = 0, n = 0;
            for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
              const xx = x + ox, yy = y + oy; if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue;
              const j = yy * N + xx; if (!known[j]) continue;
              r += fill[j * 3]; g += fill[j * 3 + 1]; b += fill[j * 3 + 2]; n++;
            }
            if (n) { nf[i * 3] = r / n; nf[i * 3 + 1] = g / n; nf[i * 3 + 2] = b / n; nk[i] = 1; }
          }
          known.set(nk); fill = nf;
        }
      }
      const cc = { black: [0, 0, 0], white: [1, 1, 1], magenta: [1, 0, 1] }[kind];
      for (let i = 0; i < N * N; i++) {
        const a = cov[i], o = i * 4;
        const transparent = a < 0.004;
        const r = transparent && cc ? cc[0] : fill[i * 3], g = transparent && cc ? cc[1] : fill[i * 3 + 1], b = transparent && cc ? cc[2] : fill[i * 3 + 2];
        d[o] = r * 255; d[o + 1] = g * 255; d[o + 2] = b * 255; d[o + 3] = a * 255;
      }
      return d;
    }
    const premulData = new Uint8Array(N * N * 4);
    for (let i = 0; i < N * N; i++) { const a = cov[i], o = i * 4; premulData[o] = col[i * 3] * a * 255; premulData[o + 1] = col[i * 3 + 1] * a * 255; premulData[o + 2] = col[i * 3 + 2] * a * 255; premulData[o + 3] = a * 255; }

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    const texStraight = {};
    for (const k of ['black', 'white', 'magenta', 'bleed']) texStraight[k] = U.gl.texture(gl, { width: N, height: N, data: makeStraight(k) }, { mipmap: true });
    const texPremul = U.gl.texture(gl, { width: N, height: N, data: premulData }, { mipmap: true });
    const texGlow = U.gl.texture(gl, { width: 32, height: 32, data: glow }, { mipmap: true });

    const bgFs = `
      precision mediump float;
      uniform float u_bg; uniform vec2 u_res; varying vec2 v_uv;
      void main(){
        vec3 c;
        if (u_bg < 0.5) c = mix(vec3(0.62, 0.8, 0.98), vec3(0.92, 0.96, 1.0), v_uv.y);
        else if (u_bg < 1.5) c = mix(vec3(0.05, 0.06, 0.09), vec3(0.12, 0.13, 0.18), v_uv.y);
        else { vec2 k = floor(gl_FragCoord.xy / 24.0); c = mix(vec3(0.75), vec3(0.95), mod(k.x + k.y, 2.0)); }
        gl_FragColor = vec4(c, 1.0);
      }`;
    const spVs = `
      attribute vec2 a_pos;
      uniform vec2 u_res; uniform vec4 u_xf;
      varying vec2 v_uv;
      void main(){
        vec2 c = a_pos * 0.5;              // -0.5..0.5
        float s = sin(u_xf.w), co = cos(u_xf.w);
        vec2 p = vec2(c.x * co - c.y * s, c.x * s + c.y * co) * u_xf.z + u_xf.xy;
        v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 + a_pos.y * 0.5);
        gl_Position = vec4(p / u_res * 2.0 - 1.0, 0.0, 1.0) * vec4(1.0, -1.0, 1.0, 1.0);
      }`;
    const spFs = `
      precision mediump float;
      uniform sampler2D u_tex; uniform float u_mulInShader; uniform float u_gain;
      varying vec2 v_uv;
      void main(){
        vec4 c = texture2D(u_tex, v_uv);
        if (u_mulInShader > 0.5) c.rgb *= c.a;
        gl_FragColor = c * u_gain;
      }`;
    const bgProg = U.gl.program(gl, U.gl.QUAD_VS, bgFs);
    const sp = U.gl.program(gl, spVs, spFs);
    const quad = U.gl.quad(gl);
    let t = 0;

    function setFilter(tex) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      const f = P.filter;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f === 'nearest' ? gl.NEAREST : f === 'linear' ? gl.LINEAR : gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f === 'nearest' ? gl.NEAREST : gl.LINEAR);
    }
    function drawSprite(x, y, size, rot) {
      gl.uniform4f(sp.u('u_xf'), x, y, size, rot);
      quad.draw(sp);
    }

    return {
      update(dt) { if (P.spin) t += dt; },
      render() {
        const W = ctx.width, H = ctx.height;
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.colorMask(true, true, true, true);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.BLEND);
        bgProg.use();
        gl.uniform1f(bgProg.u('u_bg'), { sky: 0, dark: 1, checker: 2 }[P.bg]);
        gl.uniform2f(bgProg.u('u_res'), ctx.pixelWidth, ctx.pixelHeight);
        quad.draw(bgProg);

        // 캔버스 알파는 1로 유지 (페이지 합성에 영향 없도록)
        gl.colorMask(true, true, true, false);
        gl.enable(gl.BLEND);
        const premul = P.mode === 'premul';
        const tex = premul ? texPremul : texStraight[P.clearColor];
        setFilter(tex);
        sp.use();
        gl.uniform2f(sp.u('u_res'), W, H);
        gl.uniform1i(sp.u('u_tex'), 0);
        gl.uniform1f(sp.u('u_gain'), 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        if (P.mode === 'straight') gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.uniform1f(sp.u('u_mulInShader'), P.mode === 'shaderMul' ? 1 : 0);

        const big = Math.min(W * 0.55, H * 0.62) * P.size;
        drawSprite(W * 0.33, H * 0.42, big, t * 0.25);
        drawSprite(W * 0.76, H * 0.3, big * 0.45, -t * 0.4 + 1);
        // 작은 별들 (밉맵 영역)
        const n = 9;
        for (let i = 0; i < n; i++) {
          const s = (10 + i * 7) * P.size;
          drawSprite(W * (0.06 + 0.88 * i / (n - 1)), H * 0.86, s, t * (0.3 + i * 0.05) + i);
        }
        // 가산 반짝이: premul 블렌드(ONE, 1−a)에서 a=0이면 순수 덧셈이 됨
        if (P.additive) {
          gl.bindTexture(gl.TEXTURE_2D, texGlow);
          setFilter(texGlow);
          gl.uniform1f(sp.u('u_mulInShader'), 0);
          for (let i = 0; i < 6; i++) {
            const a = t * 0.8 + i * 1.047, rr = big * 0.42;
            drawSprite(W * 0.33 + Math.cos(a) * rr, H * 0.42 + Math.sin(a) * rr, 40 * P.size + 8 * Math.sin(t * 3 + i), 0);
          }
        }
        gl.colorMask(true, true, true, true);
        gl.disable(gl.BLEND);
        ctx.stat(GTL.L('블렌드', 'Blend'), P.mode === 'straight' ? 'SRC_ALPHA, 1−SRC_ALPHA' : 'ONE, 1−SRC_ALPHA');
        ctx.stat(GTL.L('가산 반짝이', 'Additive sparkles'), P.additive ? (P.mode === 'straight' ? GTL.L('a=0 → 보이지 않음', 'a=0 → invisible') : GTL.L('같은 블렌드로 가산', 'Additive with same blend')) : GTL.L('꺼짐', 'Off'));
      },
    };
  },
});
