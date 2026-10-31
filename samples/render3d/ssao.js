// SSAO: 없음 / Crytek(구 샘플, 깊이만) / 법선 반구 샘플
GTL.register({
  id: 'ssao',
  title: 'SSAO (스크린 스페이스 앰비언트 오클루전)',
  summary: '구석, 틈, 접촉면은 주변 물체가 하늘빛을 가려 어두움. 깊이 버퍼로 픽셀 주변이 얼마나 막혔는지 추정해 환경광을 줄이면 물체가 바닥에 "붙어" 보임.',
  renderer: 'webgl2',
  views: { a: 'AO 없음', b: '법선 반구 SSAO' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌',
  info: `
    <p><b>앰비언트 오클루전(AO)</b>: 주변 물체가 환경광을 가리는 정도. <b>SSAO</b>는 이를 화면(깊이 버퍼)만으로 추정하는 기법. AO가 없으면 물체가 바닥에서 떠 보임.</p>
    <p>동작 순서:</p>
    <ol>
      <li>장면을 그려 <b>깊이 텍스처</b>와 뷰 공간 <b>법선</b>을 저장</li>
      <li>픽셀의 뷰 공간 위치 P 주변에 샘플 점을 뿌려 화면에 투영. 그 위치의 깊이 버퍼 값이 샘플보다 앞이면 "막힘"으로 셈.</li>
      <li>4×4 회전 노이즈로 생긴 무늬를 4×4 블러로 지움</li>
      <li>최종 셰이딩에서 <b>환경광에만</b> 곱함</li>
    </ol>
    <p>샘플 분포 방식:</p>
    <ul>
      <li><b>Crytek 방식</b>(Crysis, 2007): 법선 없이 <i>구</i> 안에 샘플을 뿌림. 평평한 면도 샘플 절반이 표면 아래라 막힘으로 판정됨. 그래서 전체가 회색이 되고 모서리가 밝게 뜸.</li>
      <li><b>법선 반구</b> 방식: 법선 쪽 반구에만 샘플을 둠. 평면은 하얗고 오목한 곳만 어두워짐. 샘플은 중심에 몰리도록 가중.</li>
    </ul>
    <p>단점과 조정:</p>
    <ul>
      <li><b>반경</b>이 크면 넓은 그늘이 생김. 대신 실루엣 뒤 먼 물체까지 막힘으로 잘못 판정해 <b>헤일로</b>가 생김. 거리 범위 검사(range check)로 줄임.</li>
      <li><b>바이어스</b>가 너무 작으면 깊이 정밀도 때문에 평면에 얼룩(self-occlusion)이 생김</li>
      <li>AO는 절반 해상도에서 계산</li>
    </ul>`,
  // 도식: 구 샘플(Crytek 방식)과 법선 반구 샘플이 평면과 모서리에서 다르게 판정되는 이유
  diagram: (L) => `<svg viewBox="0 0 540 194" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="16">${L('Crytek: 구 안에 샘플 (법선 없음)', 'Crytek: samples in a sphere (no normal)')}</text>
    <rect x="10" y="110" width="250" height="40" class="f-dim"/>
    <circle cx="135" cy="110" r="60" class="d-dim"/>
    <circle cx="106.2" cy="114.9" r="3.5" class="f-bad"/>
    <circle cx="120.7" cy="121.4" r="3.5" class="f-bad"/>
    <circle cx="148.8" cy="62.2" r="3.5" class="d-line"/>
    <circle cx="108.5" cy="80.8" r="3.5" class="d-line"/>
    <circle cx="172" cy="107.4" r="3.5" class="d-line"/>
    <circle cx="150.3" cy="71.6" r="3.5" class="d-line"/>
    <circle cx="149.8" cy="150.5" r="3.5" class="f-bad"/>
    <circle cx="137.5" cy="136.5" r="3.5" class="f-bad"/>
    <circle cx="153.9" cy="62" r="3.5" class="d-line"/>
    <circle cx="163.4" cy="120" r="3.5" class="f-bad"/>
    <circle cx="175.2" cy="107" r="3.5" class="d-line"/>
    <circle cx="159.1" cy="151.7" r="3.5" class="f-bad"/>
    <circle cx="158.6" cy="156.3" r="3.5" class="f-bad"/>
    <circle cx="123.4" cy="143.1" r="3.5" class="f-bad"/>
    <circle cx="135" cy="110" r="4" class="f-accent"/>
    <text x="10" y="168" class="t-small">${L('평평한 바닥도 절반이 막힘, 전체가 회색', 'Half is blocked even on flat ground, all gray')}</text>
    <text x="290" y="16" class="t-b">${L('B: 법선 쪽 반구에 샘플', 'B: samples in the normal hemisphere')}</text>
    <rect x="290" y="110" width="250" height="40" class="f-dim"/>
    <rect x="470" y="30" width="30" height="80" class="f-dim"/>
    <path d="M360,110 A60,60 0 0 1 480,110" class="d-dim"/>
    <circle cx="391.2" cy="105.1" r="3.5" class="f-b"/>
    <circle cx="405.7" cy="98.6" r="3.5" class="f-b"/>
    <circle cx="433.8" cy="62.2" r="3.5" class="f-b"/>
    <circle cx="393.5" cy="80.8" r="3.5" class="f-b"/>
    <circle cx="457" cy="107.4" r="3.5" class="f-b"/>
    <circle cx="435.3" cy="71.6" r="3.5" class="f-b"/>
    <circle cx="434.8" cy="69.5" r="3.5" class="f-b"/>
    <circle cx="422.5" cy="83.5" r="3.5" class="f-b"/>
    <circle cx="438.9" cy="62" r="3.5" class="f-b"/>
    <circle cx="448.4" cy="100" r="3.5" class="f-b"/>
    <circle cx="460.2" cy="107" r="3.5" class="f-b"/>
    <circle cx="444.1" cy="68.3" r="3.5" class="f-b"/>
    <circle cx="443.6" cy="63.7" r="3.5" class="f-b"/>
    <circle cx="408.4" cy="76.9" r="3.5" class="f-b"/>
    <circle cx="420" cy="110" r="4" class="f-accent"/>
    <text x="290" y="168" class="t-small">${L('벽 안에 들어간 샘플(빨강)만 막힘', 'Only samples inside the wall (red) block')}</text>
    <text x="10" y="186" class="t-small t-dim">${L('채운 점: 깊이 버퍼보다 뒤에 있어 막힘으로 셈', 'Filled dot: behind the depth buffer, counts as blocked')}</text>
  </svg>`,
  look: [
    'B에서 벽과 바닥이 만나는 모서리, 상자 밑, 구가 바닥에 닿는 점을 보면 어두워져 물체가 접지됨. A는 물체가 떠 보임.',
    '"AO만 보기"로 바꾸고 방식을 Crytek으로 하면 평평한 바닥이 회색이 되고 물체 윤곽이 밝게 뜸',
    '반경을 2로 올리면 물체 주변에 넓은 어두운 헤일로가 생김. 블러를 끄면 4×4 노이즈 무늬가 드러남.',
    '샘플 수를 8로 줄이면 얼룩이 늘어남. 품질과 비용을 맞바꾸는 관계.',
  ],
  refs: [
    { type: 'talk', title: 'Finding Next Gen: CryEngine 2 (Martin Mittring)', url: 'https://dl.acm.org/doi/10.1145/1281500.1281671', year: 2007, note: 'SIGGRAPH 2007 Advanced Real-Time Rendering course. SSAO 최초 공개.' },
    { type: 'article', title: 'LearnOpenGL: SSAO', url: 'https://learnopengl.com/Advanced-Lighting/SSAO', note: '법선 지향 반구 커널, 4×4 노이즈, range check' },
    { type: 'paper', title: 'Image-Space Horizon-Based Ambient Occlusion (Bavoil, Sainz, Dimitrov)', year: 2008, note: 'SIGGRAPH 2008 Talks. HBAO.' },
    { type: 'talk', title: 'Practical Real-Time Strategies for Accurate Indirect Occlusion (Jimenez et al.)', year: 2016, note: 'SIGGRAPH 2016 PBS course. GTAO.' },
  ],
  params: [
    { key: 'mode', label: 'AO 방식', type: 'select', group: 'SSAO', options: [
      { value: 0, label: '없음' },
      { value: 1, label: 'Crytek (구, 깊이만)' },
      { value: 2, label: '법선 반구' },
    ], a: 0, b: 2 },
    { key: 'samples', label: '샘플 수', type: 'select', options: [8, 16, 32], default: 16, when: (p) => +p.mode > 0 },
    { key: 'radius', label: '반경', type: 'range', min: 0.1, max: 2, step: 0.05, default: 0.6, when: (p) => +p.mode > 0 },
    { key: 'bias', label: '바이어스', type: 'range', min: 0, max: 0.1, step: 0.001, default: 0.02, when: (p) => +p.mode > 0 },
    { key: 'power', label: '세기 (지수)', type: 'range', min: 0.5, max: 4, step: 0.1, default: 1.6, when: (p) => +p.mode > 0 },
    { key: 'blur', label: '4×4 블러', type: 'bool', default: true, when: (p) => +p.mode > 0 },
    { key: 'view', label: '보기', type: 'select', options: [
      { value: 'final', label: '최종' },
      { value: 'ao', label: 'AO만 보기' },
    ], default: 'final' },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: true, shared: true, group: '장면' },
  ],
  en: {
    title: 'SSAO (Screen Space Ambient Occlusion)',
    summary: 'Corners, gaps, and contact points are darker because nearby objects block sky light. SSAO uses the depth buffer to guess how blocked each pixel is and dims ambient light there. Objects then look "grounded".',
    views: { a: 'No AO', b: 'Normal hemisphere SSAO' },
    controls: 'Mouse drag: rotate camera. Wheel: zoom.',
    info: `
    <p><b>Ambient occlusion (AO)</b>: how much nearby objects block ambient light. <b>SSAO</b> estimates it from the screen (depth buffer) alone. Without AO, objects seem to float above the floor.</p>
    <p>Steps:</p>
    <ol>
      <li>Draw the scene and store a <b>depth texture</b> and view space <b>normals</b>.</li>
      <li>Scatter sample points around the pixel's view space position P and project them to the screen. If the depth buffer at that spot is in front of the sample, count it as "blocked".</li>
      <li>A 4×4 blur removes the pattern made by the 4×4 rotation noise.</li>
      <li>In final shading, multiply it into <b>ambient light only</b>.</li>
    </ol>
    <p>Sample layouts:</p>
    <ul>
      <li><b>Crytek method</b> (Crysis, 2007): scatter samples in a <i>sphere</i> with no normal. Even on a flat surface, half the samples are below it and count as blocked. So everything turns gray and edges glow bright.</li>
      <li><b>Normal hemisphere</b> method: place samples only in the hemisphere on the normal side. Flat surfaces stay white and only concave spots get darker. Samples are weighted to cluster near the center.</li>
    </ul>
    <p>Downsides and tuning:</p>
    <ul>
      <li>A large <b>radius</b> gives wide shading. But it also counts far objects behind a silhouette as blockers, which makes a <b>halo</b>. A range check reduces it.</li>
      <li>If <b>bias</b> is too small, depth precision causes blotches on flat surfaces (self-occlusion).</li>
      <li>AO is computed at half resolution.</li>
    </ul>`,
    look: [
      'In B, look at where the wall meets the floor, under the boxes, and where the sphere touches the floor. They get darker and the objects look grounded. In A the objects seem to float.',
      'Switch to "AO only" and set the method to Crytek. The flat floor turns gray and object outlines glow bright.',
      'Raise the radius to 2. A wide dark halo appears around objects. Turn off blur and the 4×4 noise pattern shows.',
      'Lower the sample count to 8. Blotches increase. You trade quality for cost.',
    ],
    refs: ['SIGGRAPH 2007 Advanced Real-Time Rendering course. The first public SSAO.', 'Normal oriented hemisphere kernel, 4×4 noise, range check.', 'SIGGRAPH 2008 Talks. HBAO.', 'SIGGRAPH 2016 PBS course. GTAO.'],
    params: {
      mode: { label: 'AO method', options: { 0: 'None', 1: 'Crytek (sphere, depth only)', 2: 'Normal hemisphere' } },
      samples: 'Sample count',
      radius: 'Radius',
      bias: 'Bias',
      power: 'Strength (exponent)',
      blur: '4×4 blur',
      view: { label: 'View', options: { final: 'Final', ao: 'AO only' } },
      autoRotate: { label: 'Auto rotate', group: 'Scene' },
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params, G = U.geometry;
    const torusG = G.torus(0.7, 0.28, 48, 24);
    const mesh = { cube: G.upload(gl, G.cube(1)), sphere: G.upload(gl, G.sphere(1, 40, 20)), torus: G.upload(gl, torusG) };
    const T = M.translation, S = M.scaling;
    const objs = [
      [mesh.cube, M.mul(T(0, -0.1, 0), S(14, 0.2, 14)), [0.75, 0.73, 0.7]],
      [mesh.cube, M.mul(T(0, 3, -4.1), S(14, 6, 0.2)), [0.72, 0.7, 0.68]],
      [mesh.cube, M.mul(T(-5.1, 3, 0), S(0.2, 6, 14)), [0.7, 0.72, 0.74]],
      [mesh.cube, M.mul(T(-4.2, 0.8, -3.2), S(1.6)), [0.8, 0.45, 0.35]],
      [mesh.cube, M.mul(T(-4.3, 2.0, -3.3), M.rotationY(0.4), S(0.8)), [0.85, 0.7, 0.4]],
      [mesh.cube, M.mul(T(-2.5, 0.5, -3.4), M.rotationY(0.2), S(1)), [0.5, 0.6, 0.8]],
      [mesh.sphere, M.mul(T(0.5, 0.8, -1), S(0.8)), [0.85, 0.85, 0.85]],
      [mesh.sphere, M.mul(T(2.2, 0.45, 0.8), S(0.45)), [0.6, 0.8, 0.55]],
      [mesh.torus, M.mul(T(-1.6, 0.28, 1.2), S(1)), [0.9, 0.6, 0.3]],
      [mesh.cube, M.mul(T(3.2, 2.5, -3.2), S(0.6, 5, 0.6)), [0.7, 0.7, 0.75]],
      [mesh.cube, M.mul(T(1.2, 0.15, 2.4), M.rotationY(0.7), S(2.2, 0.3, 1.0)), [0.55, 0.45, 0.65]],
    ];
    for (const o of objs) o.push(M.normalMatrix(o[1]));

    // ── 커널 & 노이즈 ──
    const rng = U.rng(4242);
    const hemi = new Float32Array(32 * 3), sphere = new Float32Array(32 * 3);
    for (let i = 0; i < 32; i++) {
      for (const [arr, zMin] of [[hemi, 0], [sphere, -1]]) {
        let v, l;
        do { v = [rng.range(-1, 1), rng.range(-1, 1), rng.range(zMin, 1)]; l = Math.hypot(...v); } while (l > 1 || l < 0.05);
        let s = i / 32; s = U.lerp(0.1, 1, s * s);
        const r = rng.range(0.2, 1) * s / l;
        arr.set(v.map((x) => x * r), i * 3);
      }
    }
    const noise = new Uint8Array(16 * 4);
    for (let i = 0; i < 16; i++) {
      const a = rng.range(0, U.TAU);
      noise.set([(Math.cos(a) * 0.5 + 0.5) * 255, (Math.sin(a) * 0.5 + 0.5) * 255, 128, 255], i * 4);
    }
    const noiseTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, noiseTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 4, 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, noise);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    // ── 셰이더 ──
    const QVS = `#version 300 es
      in vec2 a_pos; out vec2 v_uv;
      void main(){ v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`;
    const gbuf = U.gl.program(gl, `#version 300 es
      in vec3 a_position; in vec3 a_normal;
      uniform mat4 u_vp; uniform mat4 u_world; uniform mat4 u_view; uniform mat3 u_nmat;
      out vec3 v_nv;
      void main(){ v_nv = mat3(u_view) * (u_nmat * a_normal); gl_Position = u_vp * u_world * vec4(a_position, 1.0); }`, `#version 300 es
      precision highp float; in vec3 v_nv; out vec4 o_color;
      void main(){ o_color = vec4(normalize(v_nv) * 0.5 + 0.5, 1.0); }`);
    const ssao = U.gl.program(gl, QVS, `#version 300 es
      precision highp float;
      uniform sampler2D u_depth; uniform sampler2D u_normal; uniform sampler2D u_noise;
      uniform mat4 u_proj; uniform mat4 u_invProj; uniform vec3 u_kernel[32];
      uniform float u_samples; uniform float u_radius; uniform float u_bias; uniform float u_mode; uniform vec2 u_noiseScale;
      in vec2 v_uv; out vec4 o_color;
      vec3 viewPos(vec2 uv) {
        float d = texture(u_depth, uv).r;
        vec4 p = u_invProj * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
        return p.xyz / p.w;
      }
      void main(){
        float d0 = texture(u_depth, v_uv).r;
        if (d0 >= 1.0) { o_color = vec4(1.0); return; }
        vec3 Pv = viewPos(v_uv);
        vec3 N = normalize(texture(u_normal, v_uv).xyz * 2.0 - 1.0);
        vec3 rv = normalize(texture(u_noise, v_uv * u_noiseScale).xyz * 2.0 - 1.0);
        vec3 T = normalize(rv - N * dot(rv, N));
        vec3 B = cross(N, T);
        mat3 TBN = mat3(T, B, N);
        float occ = 0.0;
        for (int i = 0; i < 32; i++) {
          if (float(i) >= u_samples) break;
          vec3 k = u_kernel[i];
          vec3 dir = u_mode < 1.5 ? reflect(k, rv) : TBN * k;
          vec3 Sv = Pv + dir * u_radius;
          vec4 c = u_proj * vec4(Sv, 1.0);
          vec2 suv = c.xy / c.w * 0.5 + 0.5;
          float sz = viewPos(suv).z;
          float range = smoothstep(0.0, 1.0, u_radius / max(abs(Pv.z - sz), 1e-4));
          occ += (sz >= Sv.z + u_bias ? 1.0 : 0.0) * range;
        }
        o_color = vec4(vec3(1.0 - occ / u_samples), 1.0);
      }`);
    const blur = U.gl.program(gl, QVS, `#version 300 es
      precision mediump float;
      uniform sampler2D u_tex; uniform vec2 u_texel; uniform float u_on;
      in vec2 v_uv; out vec4 o_color;
      void main(){
        if (u_on < 0.5) { o_color = texture(u_tex, v_uv); return; }
        float s = 0.0;
        for (int x = -2; x < 2; x++) for (int y = -2; y < 2; y++) s += texture(u_tex, v_uv + (vec2(float(x), float(y)) + 0.5) * u_texel).r;
        o_color = vec4(vec3(s / 16.0), 1.0);
      }`);
    const shade = U.gl.program(gl, `#version 300 es
      in vec3 a_position; in vec3 a_normal;
      uniform mat4 u_vp; uniform mat4 u_world; uniform mat3 u_nmat;
      out vec3 v_n;
      void main(){ v_n = u_nmat * a_normal; gl_Position = u_vp * u_world * vec4(a_position, 1.0); }`, `#version 300 es
      precision highp float;
      uniform sampler2D u_ao; uniform vec2 u_res; uniform float u_useAO; uniform float u_power; uniform vec3 u_color; uniform vec3 u_sun;
      in vec3 v_n; out vec4 o_color;
      void main(){
        float ao = u_useAO > 0.5 ? pow(texture(u_ao, gl_FragCoord.xy / u_res).r, u_power) : 1.0;
        vec3 N = normalize(v_n);
        vec3 alb = pow(u_color, vec3(2.2));
        vec3 amb = mix(vec3(0.3, 0.27, 0.24), vec3(0.6, 0.68, 0.82), N.y * 0.5 + 0.5);
        vec3 c = alb * (amb * ao * 1.3 + vec3(1.0, 0.94, 0.85) * max(dot(N, u_sun), 0.0) * 0.45);
        c = c / (1.0 + c * 0.25);
        o_color = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
      }`);
    const show = U.gl.program(gl, QVS, `#version 300 es
      precision mediump float; uniform sampler2D u_tex; in vec2 v_uv; out vec4 o_color;
      void main(){ o_color = vec4(texture(u_tex, v_uv).rrr, 1.0); }`);
    const quad = U.gl.quad(gl);

    // ── 렌더 타겟 ──
    function colorTex(w, h, linear) {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const f = linear ? gl.LINEAR : gl.NEAREST;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }
    function fbo(color, depth) {
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
      if (depth) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return fb;
    }
    let rt = null;
    function ensureTargets(w, h) {
      if (rt && rt.w === w && rt.h === h) return;
      if (rt) { [rt.nTex, rt.dTex, rt.aoTex, rt.blTex].forEach((t) => gl.deleteTexture(t)); [rt.gFB, rt.aoFB, rt.blFB].forEach((f) => gl.deleteFramebuffer(f)); }
      const hw = Math.max(1, w >> 1), hh = Math.max(1, h >> 1);
      const nTex = colorTex(w, h, false);
      const dTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, dTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, w, h, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const aoTex = colorTex(hw, hh, false), blTex = colorTex(hw, hh, true);
      rt = { w, h, hw, hh, nTex, dTex, aoTex, blTex, gFB: fbo(nTex, dTex), aoFB: fbo(aoTex, null), blFB: fbo(blTex, null) };
    }
    const bindTex = (unit, tex, prog, name) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(prog.u(name), unit); };

    const cam = { yaw: 0.6, base: 0.6, swing: 0, pitch: 0.4, dist: 10, drag: false, lx: 0, ly: 0 };
    const sun = (() => { const v = [0.5, 0.75, 0.45]; const l = Math.hypot(...v); return v.map((x) => x / l); })();

    return {
      update(dt) {
        if (P.autoRotate && !cam.drag) cam.swing += dt * 0.25; // 방 안쪽만 보이도록 좌우로 왕복
        cam.yaw = cam.base + Math.sin(cam.swing) * 0.5;
        if (ctx.input.mouse.wheel) cam.dist = U.clamp(cam.dist * Math.pow(1.12, ctx.input.mouse.wheel), 3, 25);
      },
      onPointer(type, m) {
        if (type === 'down') { cam.drag = true; cam.lx = m.x; cam.ly = m.y; }
        else if (type === 'up' || type === 'leave') cam.drag = false;
        else if (type === 'move' && cam.drag) {
          cam.base -= (m.x - cam.lx) * 0.008; cam.pitch = U.clamp(cam.pitch + (m.y - cam.ly) * 0.008, 0.05, 1.45);
          cam.lx = m.x; cam.ly = m.y;
        }
      },
      render() {
        const W = ctx.pixelWidth, H = ctx.pixelHeight, mode = +P.mode;
        ensureTargets(W, H);
        const proj = M.perspective(U.rad(50), ctx.width / ctx.height, 0.1, 60);
        const target = [-0.5, 1.2, -0.8];
        const eye = M.orbitEye(target, cam.yaw, cam.pitch, cam.dist);
        const view = M.lookAt(eye, target);
        const vp = M.multiply(proj, view);
        gl.enable(gl.CULL_FACE);
        const drawAll = (prog, withColor) => {
          for (const [m, w, c, n] of objs) {
            gl.uniformMatrix4fv(prog.u('u_world'), false, w);
            gl.uniformMatrix3fv(prog.u('u_nmat'), false, n);
            if (withColor) gl.uniform3fv(prog.u('u_color'), c);
            m.draw(prog);
          }
        };

        if (mode > 0) {
          // 1) 깊이 + 뷰 공간 법선
          gl.bindFramebuffer(gl.FRAMEBUFFER, rt.gFB);
          gl.viewport(0, 0, W, H);
          gl.enable(gl.DEPTH_TEST);
          gl.clearColor(0.5, 0.5, 1, 1);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          gbuf.use();
          gl.uniformMatrix4fv(gbuf.u('u_vp'), false, vp);
          gl.uniformMatrix4fv(gbuf.u('u_view'), false, view);
          drawAll(gbuf, false);
          // 2) SSAO (절반 해상도)
          gl.disable(gl.DEPTH_TEST);
          gl.bindFramebuffer(gl.FRAMEBUFFER, rt.aoFB);
          gl.viewport(0, 0, rt.hw, rt.hh);
          ssao.use();
          bindTex(0, rt.dTex, ssao, 'u_depth');
          bindTex(1, rt.nTex, ssao, 'u_normal');
          bindTex(2, noiseTex, ssao, 'u_noise');
          gl.uniformMatrix4fv(ssao.u('u_proj'), false, proj);
          gl.uniformMatrix4fv(ssao.u('u_invProj'), false, M.invert(proj));
          gl.uniform3fv(ssao.u('u_kernel[0]'), mode === 1 ? sphere : hemi);
          gl.uniform1f(ssao.u('u_samples'), +P.samples);
          gl.uniform1f(ssao.u('u_radius'), P.radius);
          gl.uniform1f(ssao.u('u_bias'), P.bias);
          gl.uniform1f(ssao.u('u_mode'), mode);
          gl.uniform2f(ssao.u('u_noiseScale'), rt.hw / 4, rt.hh / 4);
          quad.draw(ssao);
          // 3) 블러
          gl.bindFramebuffer(gl.FRAMEBUFFER, rt.blFB);
          blur.use();
          bindTex(0, rt.aoTex, blur, 'u_tex');
          gl.uniform2f(blur.u('u_texel'), 1 / rt.hw, 1 / rt.hh);
          gl.uniform1f(blur.u('u_on'), P.blur ? 1 : 0);
          quad.draw(blur);
        }

        // 4) 최종 셰이딩
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, W, H);
        gl.clearColor(0.6, 0.68, 0.82, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (P.view === 'ao') {
          gl.disable(gl.DEPTH_TEST);
          if (mode > 0) { show.use(); bindTex(0, rt.blTex, show, 'u_tex'); quad.draw(show); }
          else { gl.clearColor(1, 1, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
        } else {
          gl.enable(gl.DEPTH_TEST);
          shade.use();
          gl.uniformMatrix4fv(shade.u('u_vp'), false, vp);
          gl.uniform2f(shade.u('u_res'), W, H);
          gl.uniform1f(shade.u('u_useAO'), mode > 0 ? 1 : 0);
          gl.uniform1f(shade.u('u_power'), P.power);
          gl.uniform3fv(shade.u('u_sun'), sun);
          bindTex(0, mode > 0 ? rt.blTex : noiseTex, shade, 'u_ao');
          drawAll(shade, true);
        }
        gl.activeTexture(gl.TEXTURE0);
        ctx.stat(GTL.L('방식', 'Method'), [GTL.L('없음', 'None'), GTL.L('Crytek (구)', 'Crytek (sphere)'), GTL.L('법선 반구', 'Normal hemisphere')][mode]);
        ctx.stat(GTL.L('AO 해상도', 'AO resolution'), mode > 0 ? `${rt.hw}×${rt.hh}` : '-');
        ctx.stat(GTL.L('픽셀당 깊이 샘플', 'Depth samples per pixel'), mode > 0 ? +P.samples + (P.blur ? GTL.L(' + 블러 16', ' + blur 16') : '') : 0);
        ctx.stat(GTL.L('지오메트리 패스', 'Geometry passes'), mode > 0 ? 2 : 1);
      },
    };
  },
});
