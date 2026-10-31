// 디졸브 셰이더: 노이즈 값과 임계값을 비교해 픽셀을 버리고, 경계에 발광 띠를 그림 vs 알파 페이드
GTL.register({
  id: 'dissolve-shader',
  title: '디졸브 셰이더 (노이즈 임계값 + 가장자리 발광)',
  summary: '픽셀마다 노이즈 값을 하나씩 정해 두고, 진행도가 그 값을 넘은 픽셀부터 지움. 불에 타듯 구멍이 번지며 사라지고, 경계에 발광 띠를 넣기 쉬움. 알파 페이드는 전체가 함께 반투명해져서 뒤가 비침.',
  renderer: 'webgl',
  views: { a: '알파 페이드', b: '노이즈 디졸브 + 발광 경계' },
  info: `
    <p><b>디졸브(Dissolve)</b>는 오브젝트가 사라지거나 나타날 때 쓰는 셰이더 효과. 적 사망, 순간이동, 아이템 획득에 자주 씀.</p>
    <p>동작은 비교 한 번임.</p>
    <ol>
    <li>노이즈 텍스처에서 값 n(0~1)을 읽음.</li>
    <li>진행도 p로 임계값 <code>thr = mix(-w, 1, p)</code>를 만듦. w는 경계 띠 폭.</li>
    <li><code>n &lt; thr</code>이면 <code>discard</code>. <code>n</code>이 <code>thr + w</code> 안쪽이면 발광 색을 섞음.</li>
    </ol>
    <p>임계값을 <code>-w</code>에서 시작해야 p = 0일 때 발광 띠가 보이지 않음.</p>
    <p>노이즈 분포가 중요함. fBm(여러 옥타브 합) 값은 0.5 근처에 몰려 있음. 그대로 쓰면 처음엔 아무 일도 없다가 중간에 한꺼번에 사라짐. 값을 순위로 바꾸는 <b>히스토그램 평탄화</b>를 하면 남은 면적이 p에 정비례함.</p>
    <p>알파 페이드는 블렌딩이 필요해서 정렬 문제가 생기고, 반투명한 동안 뒤 배경과 겹쳐 보임. 디졸브는 픽셀을 남기거나 버리기만 해서 불투명 패스에 그대로 둘 수 있음.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 176" xmlns="http://www.w3.org/2000/svg">
    <text x="20" y="14" class="t-b">${L('B: 픽셀마다 노이즈 값 n을 임계값과 비교', 'B: compare each pixel noise n with a threshold')}</text>
    <line x1="20" y1="104" x2="330" y2="104" class="d-dim"/>
    <polyline points="${[0.62, 0.55, 0.41, 0.33, 0.38, 0.52, 0.66, 0.71, 0.6, 0.47, 0.36, 0.3, 0.42, 0.58, 0.69, 0.75, 0.64, 0.5, 0.44, 0.53, 0.61, 0.57, 0.4, 0.28, 0.35, 0.49, 0.63, 0.72, 0.66, 0.54, 0.46].map((n, i) => `${25 + i * 10},${104 - n * 80}`).join(' ')}" class="d-line"/>
    <line x1="20" y1="68" x2="330" y2="68" class="d-accent"/>
    <line x1="20" y1="58.4" x2="330" y2="58.4" class="d-accent" stroke-dasharray="4 3"/>
    <text x="334" y="72" class="t-small t-mono">thr</text>
    <text x="334" y="58" class="t-small t-mono">thr + w</text>
    ${[0.62, 0.55, 0.41, 0.33, 0.38, 0.52, 0.66, 0.71, 0.6, 0.47, 0.36, 0.3, 0.42, 0.58, 0.69, 0.75, 0.64, 0.5, 0.44, 0.53, 0.61, 0.57, 0.4, 0.28, 0.35, 0.49, 0.63, 0.72, 0.66, 0.54, 0.46].map((n, i) => n < 0.45 ? '' : `<rect x="${20 + i * 10}" y="112" width="9" height="14" class="${n < 0.57 ? 'f-accent' : 'f-b'}"/>`).join('')}
    <rect x="20" y="142" width="9" height="9" class="d-dim" fill="none"/><text x="33" y="150" class="t-small">${L('n &lt; thr: discard', 'n &lt; thr: discard')}</text>
    <rect x="140" y="142" width="9" height="9" class="f-accent"/><text x="153" y="150" class="t-small">${L('발광 띠', 'Glow band')}</text>
    <rect x="230" y="142" width="9" height="9" class="f-b"/><text x="243" y="150" class="t-small">${L('남음', 'Kept')}</text>
    <text x="20" y="170" class="t-small t-dim">${L('진행도 p가 오르면 thr = mix(-w, 1, p)가 올라가 구멍이 번짐', 'As progress p rises, thr = mix(-w, 1, p) rises and the holes spread')}</text>
    <text x="380" y="14" class="t-a">${L('A: 알파 페이드', 'A: alpha fade')}</text>
    <rect x="380" y="112" width="150" height="14" class="f-a" opacity="0.45"/>
    <text x="380" y="40" class="t-small">${L('모든 픽셀이 같은 알파', 'All pixels share one alpha')}</text>
    <text x="380" y="56" class="t-small">${L('전체가 함께 반투명해짐', 'All of it turns see-through')}</text>
    <text x="380" y="72" class="t-small t-dim">${L('블렌딩과 정렬이 필요함', 'Needs blending and sorting')}</text>
  </svg>`,
  look: [
    'A와 B를 비교하면 A는 문양 전체가 함께 옅어지며 체커 무늬가 비침. B는 남은 부분이 끝까지 불투명함.',
    'B의 "노이즈 분포 평탄화"를 끄면 "남은 면적"이 진행도 0.3까지 거의 100%에 머물다가 갑자기 줄어듦.',
    'B의 노이즈를 "화이트 노이즈"로 바꾸면 덩어리 없이 모래처럼 흩어지며 사라짐.',
    '"아래에서 위로"를 고르면 불타 올라가는 방향성이 생김. "경계 폭"을 0으로 내리면 발광 띠가 없어짐.',
  ],
  refs: [
    { type: 'article', title: 'Dissolve using Unity Shader Graph (Brackeys)', year: 2018, note: '노이즈 + Alpha Clip Threshold + 경계 발광을 노드로 구성하는 영상 튜토리얼.' },
    { type: 'engine', title: 'Unreal Engine: Opacity Mask (Masked 블렌드 모드)', note: '디졸브를 반투명 대신 마스크(알파 테스트)로 구현하는 이유와 같음.' },
    { type: 'book', title: 'Texturing and Modeling: A Procedural Approach (Ebert, Musgrave, Peachey, Perlin, Worley)', year: 2002, note: 'fBm 노이즈와 그 분포 특성.' },
  ],
  params: [
    { key: 'method', label: '방식', type: 'select', group: '전환 효과', options: [
      { value: 0, label: '알파 페이드' },
      { value: 1, label: '노이즈 디졸브' },
    ], a: 0, b: 1 },
    { key: 'noise', label: '노이즈', type: 'select', options: [
      { value: 0, label: 'fBm (구름 모양)' },
      { value: 1, label: '화이트 노이즈 (텍셀마다 무작위)' },
      { value: 2, label: '아래에서 위로 (fBm + 세로 경사)' },
    ], default: 0, when: (p) => p.method === 1 },
    { key: 'equalize', label: '노이즈 분포 평탄화', type: 'bool', default: true, when: (p) => p.method === 1 && p.noise !== 1 },
    { key: 'edge', label: '경계 폭', type: 'range', min: 0, max: 0.2, step: 0.005, default: 0.06, when: (p) => p.method === 1 },
    { key: 'edgeColor', label: '경계 색', type: 'color', default: '#ff7a1a', when: (p) => p.method === 1 },
    { key: 'glow', label: '경계 밝기', type: 'range', min: 0.5, max: 4, step: 0.1, default: 2.2, when: (p) => p.method === 1 },
    { key: 'scaleN', label: '노이즈 크기 배율', type: 'range', min: 0.5, max: 4, step: 0.1, default: 1.5, when: (p) => p.method === 1 },
    { key: 'showNoise', label: '노이즈 보기', type: 'bool', default: false, when: (p) => p.method === 1 },
    { key: 'auto', label: '자동 진행', type: 'bool', default: true, shared: true, group: '진행도' },
    { key: 'progress', label: '진행도', type: 'range', min: 0, max: 1, step: 0.01, default: 0.45, shared: true, when: (p) => !p.auto },
    { key: 'period', label: '반복 주기 (초)', type: 'range', min: 1, max: 8, step: 0.5, default: 4, shared: true, when: (p) => p.auto },
  ],

  en: {
    title: 'Dissolve Shader (Noise Threshold + Edge Glow)',
    summary: 'Give each pixel one noise value. Erase a pixel once the progress passes its value. Holes spread as if the object burns away, and a glowing edge band is easy to add. An alpha fade makes the whole object translucent at once, so the background shows through.',
    views: { a: 'Alpha fade', b: 'Noise dissolve + glowing edge' },
    info: `
    <p>A <b>dissolve</b> is a shader effect for objects that disappear or appear. Games often use it for enemy deaths, teleports, and item pickups.</p>
    <p>It needs only one comparison.</p>
    <ol>
    <li>Read a value n (0 to 1) from a noise texture.</li>
    <li>Build the threshold <code>thr = mix(-w, 1, p)</code> from the progress p. w is the width of the edge band.</li>
    <li>If <code>n &lt; thr</code>, <code>discard</code> the pixel. If <code>n</code> is below <code>thr + w</code>, mix in the glow color.</li>
    </ol>
    <p>The threshold must start at <code>-w</code>. Then the glow band is hidden when p = 0.</p>
    <p>The noise distribution matters. fBm (a sum of several octaves) values cluster near 0.5. If you use them as is, nothing happens at first, and then most of it vanishes at once in the middle. <b>Histogram equalization</b> turns values into ranks. Then the remaining area is directly proportional to p.</p>
    <p>An alpha fade needs blending, which brings sorting problems. While it is translucent, it overlaps with the background behind it. A dissolve only keeps or drops pixels, so it can stay in the opaque pass.</p>`,
    look: [
    'Compare A and B. In A the whole pattern fades together and the checkerboard shows through. In B the remaining part stays opaque to the end.',
    'Turn off B\'s "Equalize noise distribution". "Remaining area" stays near 100% until progress 0.3, then drops suddenly.',
    'Set B\'s noise to "White noise". It scatters like sand, without clumps, as it disappears.',
    'Pick "Bottom to top" to get a burn that moves upward. Lower "Edge width" to 0 and the glow band disappears.',
    ],
    refs: [
    'A video tutorial that builds noise + Alpha Clip Threshold + edge glow with nodes.',
    { title: 'Unreal Engine: Opacity Mask (Masked blend mode)', note: 'The same reason a dissolve uses a mask (alpha test) instead of translucency.' },
    'fBm noise and its distribution.',
    ],
    params: {
      method: { label: 'Method', group: 'Transition effect', options: { 0: 'Alpha fade', 1: 'Noise dissolve' } },
      noise: { label: 'Noise', options: { 0: 'fBm (cloud shape)', 1: 'White noise (random per texel)', 2: 'Bottom to top (fBm + vertical gradient)' } },
      equalize: 'Equalize noise distribution',
      edge: 'Edge width',
      edgeColor: 'Edge color',
      glow: 'Edge brightness',
      scaleN: 'Noise scale',
      showNoise: 'Show noise',
      auto: { label: 'Auto play', group: 'Progress' },
      progress: 'Progress',
      period: 'Cycle period (s)',
    },
  },

  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, P = ctx.params;
    // 오브젝트: 방패 문양 (알파 포함)
    const OS = 256, oc = ctx.createCanvas(OS, OS), g = oc.getContext('2d');
    g.clearRect(0, 0, OS, OS);
    const shield = () => { g.beginPath(); g.moveTo(128, 18); g.lineTo(226, 52); g.quadraticCurveTo(222, 180, 128, 240); g.quadraticCurveTo(34, 180, 30, 52); g.closePath(); };
    const grd = g.createLinearGradient(0, 18, 0, 240); grd.addColorStop(0, '#5aa0ff'); grd.addColorStop(1, '#1a3c8a');
    shield(); g.fillStyle = grd; g.fill(); g.lineWidth = 10; g.strokeStyle = '#e8d27a'; g.stroke();
    g.fillStyle = '#f4ead2';
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i & 1 ? 26 : 62; g.lineTo(128 + Math.cos(a) * r, 120 + Math.sin(a) * r); }
    g.closePath(); g.fill();
    g.fillStyle = '#e8d27a'; g.fillRect(70, 196, 116, 8);
    const objTex = U.gl.texture(gl, oc, { filter: 'linear' });

    // 노이즈 텍스처: fBm 원본, fBm 평탄화, 화이트 노이즈
    const N = 128, nz = U.noise(ctx.seed + 11);
    const raw = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      // 타일 경계가 이어지도록 한 주기 떨어진 4개 위치를 섞음
      const fx = x / N, fy = y / N, s = 6;
      const a = nz.fbm2(fx * s, fy * s, { octaves: 5 }), b = nz.fbm2((fx - 1) * s, fy * s, { octaves: 5 });
      const c = nz.fbm2(fx * s, (fy - 1) * s, { octaves: 5 }), d = nz.fbm2((fx - 1) * s, (fy - 1) * s, { octaves: 5 });
      raw[y * N + x] = U.lerp(U.lerp(a, b, fx), U.lerp(c, d, fx), fy);
    }
    let mn = Infinity, mx = -Infinity;
    for (const v of raw) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
    const lin = raw.map((v) => (v - mn) / (mx - mn));
    const idx = Array.from(lin.keys()).sort((i, j) => lin[i] - lin[j]);
    const eq = new Float32Array(N * N);
    idx.forEach((i, r) => { eq[i] = r / (N * N - 1); });
    const rng = ctx.rng;
    const white = new Float32Array(N * N).map(() => rng.next());
    const mkTex = (arr, filter) => {
      const d = new Uint8Array(N * N * 4);
      for (let i = 0; i < N * N; i++) { const v = Math.round(arr[i] * 255); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
      return U.gl.texture(gl, { width: N, height: N, data: d }, { filter, wrap: 'repeat' });
    };
    const texLin = mkTex(lin, 'linear'), texEq = mkTex(eq, 'linear'), texWhite = mkTex(white, 'nearest');

    const VS = `attribute vec2 a_pos; varying vec2 v_uv; uniform vec2 u_scale;
void main(){ v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5); gl_Position = vec4(a_pos * u_scale, 0.0, 1.0); }`;
    const BG_FS = `precision mediump float; varying vec2 v_uv; uniform vec2 u_res;
void main(){
  vec2 c = floor(v_uv * u_res / 24.0);
  float k = mod(c.x + c.y, 2.0);
  gl_FragColor = vec4(mix(vec3(0.16, 0.17, 0.2), vec3(0.24, 0.25, 0.29), k), 1.0);
}`;
    const FS = `precision mediump float; varying vec2 v_uv;
uniform sampler2D u_tex; uniform sampler2D u_noise;
uniform float u_p; uniform float u_method; uniform float u_ntype; uniform float u_edge;
uniform vec3 u_ecol; uniform float u_glow; uniform float u_nscale; uniform float u_show;
void main(){
  vec4 c = texture2D(u_tex, v_uv);
  if (c.a < 0.01) discard;
  if (u_method < 0.5) { gl_FragColor = vec4(c.rgb, c.a * (1.0 - u_p)); return; }
  float n = texture2D(u_noise, v_uv * u_nscale).r;
  if (u_ntype > 1.5) n = clamp(mix(1.0 - v_uv.y, n, 0.35), 0.0, 1.0);
  if (u_show > 0.5) { gl_FragColor = vec4(vec3(n), c.a); return; }
  float thr = mix(-u_edge, 1.0, u_p);
  if (n < thr) discard;
  float band = u_edge > 0.0 ? 1.0 - clamp((n - thr) / u_edge, 0.0, 1.0) : 0.0;
  vec3 col = mix(c.rgb, min(u_ecol * u_glow, vec3(1.0)) + vec3(band * band * 0.3), band);
  gl_FragColor = vec4(col, c.a);
}`;
    const prog = U.gl.program(gl, VS, FS), bgProg = U.gl.program(gl, VS, BG_FS);
    const quad = U.gl.quad(gl);
    let t = 0;

    const progressNow = () => {
      if (!P.auto) return P.progress;
      // 0 유지 → 증가 → 1 유지 → 감소
      const ph = (t / P.period) % 1;
      if (ph < 0.15) return 0;
      if (ph < 0.5) return (ph - 0.15) / 0.35;
      if (ph < 0.65) return 1;
      return 1 - (ph - 0.65) / 0.35;
    };
    // CPU에서 같은 공식으로 남은 면적 계산 (64x64 격자)
    function remain(p) {
      const thr = U.lerp(-P.edge, 1, p), G = 64;
      const arr = P.noise === 1 ? white : P.equalize ? eq : lin;
      let alive = 0;
      for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
        const u = (x + 0.5) / G, v = (y + 0.5) / G;
        const sx = Math.floor(U.wrap(u * P.scaleN, 0, 1) * N) % N, sy = Math.floor(U.wrap(v * P.scaleN, 0, 1) * N) % N;
        let n = arr[sy * N + sx];
        if (P.noise === 2) n = U.clamp(U.lerp(1 - v, n, 0.35), 0, 1);
        if (n >= thr) alive++;
      }
      return alive / (G * G);
    }

    return {
      update(dt) { t += dt; },
      render() {
        const pw = ctx.pixelWidth, ph = ctx.pixelHeight;
        gl.viewport(0, 0, pw, ph);
        gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.BLEND);
        bgProg.use();
        gl.uniform2f(bgProg.u('u_scale'), 1, 1);
        gl.uniform2f(bgProg.u('u_res'), pw, ph);
        quad.draw(bgProg);

        const p = progressNow();
        const side = Math.min(pw, ph) * 0.8;
        prog.use();
        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, objTex);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, P.noise === 1 ? texWhite : P.equalize ? texEq : texLin);
        gl.uniform1i(prog.u('u_tex'), 0); gl.uniform1i(prog.u('u_noise'), 1);
        gl.uniform2f(prog.u('u_scale'), side / pw, side / ph);
        gl.uniform1f(prog.u('u_p'), p);
        gl.uniform1f(prog.u('u_method'), P.method);
        gl.uniform1f(prog.u('u_ntype'), P.noise);
        gl.uniform1f(prog.u('u_edge'), P.edge);
        const ec = U.hexToRgb01(P.edgeColor);
        gl.uniform3f(prog.u('u_ecol'), ec[0], ec[1], ec[2]);
        gl.uniform1f(prog.u('u_glow'), P.glow);
        gl.uniform1f(prog.u('u_nscale'), P.scaleN);
        gl.uniform1f(prog.u('u_show'), P.showNoise ? 1 : 0);
        quad.draw(prog);
        gl.disable(gl.BLEND);
        gl.activeTexture(gl.TEXTURE0);

        ctx.stat(GTL.L('진행도', 'Progress'), p.toFixed(2));
        if (P.method === 0) {
          ctx.stat(GTL.L('남은 면적', 'Remaining area'), '100%');
          ctx.stat(GTL.L('불투명도', 'Opacity'), `${Math.round((1 - p) * 100)}%`);
          ctx.stat(GTL.L('블렌딩', 'Blending'), GTL.L('필요 (반투명 패스)', 'Needed (translucent pass)'));
        } else {
          ctx.stat(GTL.L('남은 면적', 'Remaining area'), `${Math.round(remain(p) * 100)}%`);
          ctx.stat(GTL.L('불투명도', 'Opacity'), '100%');
          ctx.stat(GTL.L('블렌딩', 'Blending'), GTL.L('불필요 (discard)', 'Not needed (discard)'));
        }
      },
    };
  },
});
