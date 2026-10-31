// 선형 워크플로(감마 보정) & HDR 톤매핑
GTL.register({
  id: 'gamma-tonemapping',
  title: '선형 워크플로 & 톤매핑',
  summary: 'sRGB 값을 그대로 조명하면 감쇠, 빛 합산, 색 혼합이 모두 틀어짐. 선형 공간에서 계산하고, 톤매핑 후 sRGB로 인코딩해야 바른 결과가 나옴.',
  renderer: 'webgl',
  views: { a: '감마 공간 + 클램프', b: '선형 + ACES 톤매핑' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌',
  info: `
    <p>모니터와 이미지 파일은 <b>sRGB</b>(대략 감마 2.2)로 인코딩됨. 그래서 값 0.5의 물리적 밝기는 0.5가 아니라 약 0.21임.</p>
    <p>조명은 물리적으로 <b>선형</b>. 그래서 <b>선형 워크플로</b>가 필요함: 텍스처를 디코딩(sRGB→선형)해 계산하고, 마지막에 다시 인코딩(선형→sRGB)함. 이를 빼먹으면 다음 문제가 생김:</p>
    <ul>
      <li>역제곱 감쇠가 너무 급하게 어두워짐.</li>
      <li>두 광원이 겹치는 부분이 너무 밝음.</li>
      <li>하이라이트 주변이 채도 높게 번짐.</li>
    </ul>
    <p>현실의 밝기 범위(HDR)는 0~1을 훨씬 넘음. 단순 <b>클램프</b>는 1을 넘는 부분을 잘라냄. 그래서 색이 노랗거나 하얗게 뭉개지고 디테일이 사라짐.</p>
    <p><b>톤매핑(tone mapping)</b>은 큰 값을 부드럽게 눌러 0~1에 담는 커브. 이 샘플의 선택지:</p>
    <ul>
      <li>Reinhard: <code>x/(1+x)</code>.</li>
      <li>Reinhard 확장: 화이트 포인트를 둔 Reinhard.</li>
      <li>Hable(Uncharted 2): 필름 커브를 흉내 냄.</li>
      <li>ACES 근사(Narkowicz).</li>
    </ul>
    <p>오른쪽 아래 그래프는 입력 선형 휘도(0~4)에 대한 출력 화면값 커브.</p>`,
  // 도식: sRGB 인코딩 커브와 클램프 vs ACES 톤매핑 커브
  diagram: (L) => `<svg viewBox="0 0 540 176" xmlns="http://www.w3.org/2000/svg">
    <text x="30" y="16" class="t-small t-dim">${L('sRGB 인코딩', 'sRGB encoding')}</text>
    <line x1="30" y1="150" x2="200" y2="150" class="d-dim"/>
    <line x1="30" y1="150" x2="30" y2="30" class="d-dim"/>
    <polyline points="30.0,150.0 33.4,129.7 36.8,122.2 40.2,116.6 43.6,111.9 47.0,107.9 50.4,104.2 53.8,100.9 57.2,97.8 60.6,95.0 64.0,92.3 67.4,89.7 70.8,87.3 74.2,84.9 77.6,82.7 81.0,80.6 84.4,78.5 87.8,76.5 91.2,74.6 94.6,72.7 98.0,70.9 101.4,69.1 104.8,67.4 108.2,65.7 111.6,64.0 115.0,62.4 118.4,60.9 121.8,59.3 125.2,57.8 128.6,56.3 132.0,54.9 135.4,53.4 138.8,52.0 142.2,50.7 145.6,49.3 149.0,48.0 152.4,46.6 155.8,45.3 159.2,44.1 162.6,42.8 166.0,41.6 169.4,40.4 172.8,39.1 176.2,38.0 179.6,36.8 183.0,35.6 186.4,34.5 189.8,33.3 193.2,32.2 196.6,31.1 200.0,30.0" class="d-line"/>
    <line x1="30" y1="90" x2="65.7" y2="90" class="d-accent" stroke-dasharray="3 3"/>
    <line x1="65.7" y1="90" x2="65.7" y2="150" class="d-accent" stroke-dasharray="3 3"/>
    <text x="34" y="84" class="t-small">${L('화면값 0.5', 'screen 0.5')}</text>
    <text x="69.7" y="144" class="t-small">${L('실제 밝기 0.21', 'real 0.21')}</text>
    <text x="30" y="168" class="t-small">${L('조명은 선형 값으로 계산해야 함', 'Do lighting math on linear values')}</text>
    <text x="270" y="16" class="t-small t-dim">${L('톤매핑: 입력 HDR 0~4, 출력 0~1', 'Tone map: HDR in 0~4, out 0~1')}</text>
    <line x1="270" y1="150" x2="520" y2="150" class="d-dim"/>
    <line x1="270" y1="150" x2="270" y2="50" class="d-dim"/>
    <line x1="270" y1="50" x2="520" y2="50" class="d-dim" stroke-dasharray="2 3"/>
    <polyline points="270.0,150.0 272.5,146.0 275.0,142.0 277.5,138.0 280.0,134.0 282.5,130.0 285.0,126.0 287.5,122.0 290.0,118.0 292.5,114.0 295.0,110.0 297.5,106.0 300.0,102.0 302.5,98.0 305.0,94.0 307.5,90.0 310.0,86.0 312.5,82.0 315.0,78.0 317.5,74.0 320.0,70.0 322.5,66.0 325.0,62.0 327.5,58.0 330.0,54.0 332.5,50.0 335.0,50.0 337.5,50.0 340.0,50.0 342.5,50.0 345.0,50.0 347.5,50.0 350.0,50.0 352.5,50.0 355.0,50.0 357.5,50.0 360.0,50.0 362.5,50.0 365.0,50.0 367.5,50.0 370.0,50.0 372.5,50.0 375.0,50.0 377.5,50.0 380.0,50.0 382.5,50.0 385.0,50.0 387.5,50.0 390.0,50.0 392.5,50.0 395.0,50.0 397.5,50.0 400.0,50.0 402.5,50.0 405.0,50.0 407.5,50.0 410.0,50.0 412.5,50.0 415.0,50.0 417.5,50.0 420.0,50.0 422.5,50.0 425.0,50.0 427.5,50.0 430.0,50.0 432.5,50.0 435.0,50.0 437.5,50.0 440.0,50.0 442.5,50.0 445.0,50.0 447.5,50.0 450.0,50.0 452.5,50.0 455.0,50.0 457.5,50.0 460.0,50.0 462.5,50.0 465.0,50.0 467.5,50.0 470.0,50.0 472.5,50.0 475.0,50.0 477.5,50.0 480.0,50.0 482.5,50.0 485.0,50.0 487.5,50.0 490.0,50.0 492.5,50.0 495.0,50.0 497.5,50.0 500.0,50.0 502.5,50.0 505.0,50.0 507.5,50.0 510.0,50.0 512.5,50.0 515.0,50.0 517.5,50.0 520.0,50.0" class="d-a"/>
    <polyline points="270.0,150.0 272.5,146.9 275.0,140.9 277.5,133.8 280.0,126.7 282.5,120.0 285.0,114.0 287.5,108.6 290.0,103.8 292.5,99.6 295.0,95.9 297.5,92.6 300.0,89.7 302.5,87.1 305.0,84.8 307.5,82.7 310.0,80.8 312.5,79.1 315.0,77.5 317.5,76.1 320.0,74.8 322.5,73.6 325.0,72.5 327.5,71.4 330.0,70.5 332.5,69.6 335.0,68.8 337.5,68.0 340.0,67.3 342.5,66.7 345.0,66.0 347.5,65.4 350.0,64.9 352.5,64.4 355.0,63.9 357.5,63.4 360.0,62.9 362.5,62.5 365.0,62.1 367.5,61.7 370.0,61.4 372.5,61.0 375.0,60.7 377.5,60.4 380.0,60.1 382.5,59.8 385.0,59.5 387.5,59.3 390.0,59.0 392.5,58.8 395.0,58.5 397.5,58.3 400.0,58.1 402.5,57.9 405.0,57.7 407.5,57.5 410.0,57.3 412.5,57.1 415.0,56.9 417.5,56.7 420.0,56.6 422.5,56.4 425.0,56.3 427.5,56.1 430.0,56.0 432.5,55.8 435.0,55.7 437.5,55.6 440.0,55.4 442.5,55.3 445.0,55.2 447.5,55.1 450.0,55.0 452.5,54.8 455.0,54.7 457.5,54.6 460.0,54.5 462.5,54.4 465.0,54.3 467.5,54.2 470.0,54.1 472.5,54.0 475.0,54.0 477.5,53.9 480.0,53.8 482.5,53.7 485.0,53.6 487.5,53.5 490.0,53.5 492.5,53.4 495.0,53.3 497.5,53.2 500.0,53.2 502.5,53.1 505.0,53.0 507.5,53.0 510.0,52.9 512.5,52.8 515.0,52.8 517.5,52.7 520.0,52.7" class="d-b"/>
    <text x="337.5" y="44" class="t-small t-a">${L('A 클램프: 1 넘으면 잘림', 'A clamp: cut above 1')}</text>
    <text x="375" y="88" class="t-small t-b">${L('B ACES: 부드럽게 눌러 담음', 'B ACES: soft shoulder')}</text>
    <text x="270" y="168" class="t-small">${L('밝은 부분의 디테일이 남음', 'Bright detail survives')}</text>
  </svg>`,
  look: [
    'A의 광원 주변을 보면 단색 흰색으로 잘리고(클램프), 빛이 멀어지면 급격히 검어짐. B는 부드럽게 감쇠하고 하이라이트에 계조가 남음.',
    '"클리핑 표시"를 켜고 노출을 올리면 출력이 1.0에 닿은 픽셀이 자홍색으로 보임.',
    'B에서 선형 워크플로를 끄고 톤매핑만 남기면 화면이 칙칙해지고 대비가 너무 강해짐. 감마 인코딩이 빠졌기 때문.',
    'A에서 선형 워크플로만 켜고 톤매핑을 "없음"으로 두면 감쇠는 자연스럽지만 하이라이트 클리핑이 남음. 두 요소가 서로 독립임을 확인 가능.',
  ],
  refs: [
    { type: 'book', title: 'GPU Gems 3, Ch. 24: The Importance of Being Linear (Larry Gritz, Eugene d\'Eon)', url: 'https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-24-importance-being-linear', year: 2007 },
    { type: 'paper', title: 'Photographic Tone Reproduction for Digital Images (Reinhard et al.)', url: 'https://dl.acm.org/doi/10.1145/566654.566575', year: 2002, note: 'SIGGRAPH 2002. Reinhard 연산자.' },
    { type: 'talk', title: 'Uncharted 2: HDR Lighting (John Hable)', year: 2010, note: 'GDC 2010. 필믹 톤매핑 커브와 선형 조명.' },
    { type: 'article', title: 'ACES Filmic Tone Mapping Curve (Krzysztof Narkowicz)', url: 'https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/', year: 2016 },
    { type: 'article', title: 'LearnOpenGL: Gamma Correction / HDR', url: 'https://learnopengl.com/Advanced-Lighting/Gamma-Correction' },
    { type: 'engine', title: 'Unity: Linear or gamma workflow', url: 'https://docs.unity3d.com/Manual/LinearRendering-LinearOrGammaWorkflow.html' },
  ],
  params: [
    { key: 'linear', label: '선형 워크플로 (sRGB 디코드/인코드)', type: 'bool', a: false, b: true, group: '파이프라인' },
    { key: 'tonemap', label: '톤매핑', type: 'select', options: [
      { value: 0, label: '없음 (클램프)' },
      { value: 1, label: 'Reinhard' },
      { value: 2, label: 'Reinhard 확장 (white=4)' },
      { value: 3, label: 'Hable (Uncharted 2)' },
      { value: 4, label: 'ACES 근사 (Narkowicz)' },
    ], a: 0, b: 4 },
    { key: 'exposure', label: '노출 (EV)', type: 'range', min: -3, max: 3, step: 0.1, default: 0 },
    { key: 'showClip', label: '클리핑 표시', type: 'bool', default: false },
    { key: 'showCurve', label: '톤 커브 그래프', type: 'bool', default: true },
    { key: 'lightInt', label: '광원 세기', type: 'range', min: 0.5, max: 30, step: 0.5, default: 10, shared: true, group: '장면' },
    { key: 'lightMove', label: '광원 이동', type: 'bool', default: true, shared: true },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: false, shared: true },
  ],
  en: {
    title: 'Linear Workflow & Tone Mapping',
    summary: 'If you light sRGB values as they are, falloff, light sums, and color blends all go wrong. Compute in linear space, then tone map and encode to sRGB to get correct results.',
    views: { a: 'Gamma space + clamp', b: 'Linear + ACES tone mapping' },
    controls: 'Mouse drag: rotate camera. Wheel: zoom.',
    info: `
    <p>Monitors and image files use <b>sRGB</b> encoding (about gamma 2.2). So a value of 0.5 is not 0.5 in physical brightness. It is about 0.21.</p>
    <p>Light is physically <b>linear</b>. So you need a <b>linear workflow</b>: decode textures (sRGB to linear), do the math, and encode again at the end (linear to sRGB). If you skip this, you get these problems:</p>
    <ul>
      <li>Inverse square falloff gets dark too fast.</li>
      <li>Areas where two lights overlap are too bright.</li>
      <li>Colors around highlights bleed with too much saturation.</li>
    </ul>
    <p>Real brightness (HDR) goes far past 0 to 1. A plain <b>clamp</b> cuts off everything above 1. Colors smear into yellow or white, and detail is lost.</p>
    <p><b>Tone mapping</b> is a curve that gently compresses large values into 0 to 1. The choices in this sample:</p>
    <ul>
      <li>Reinhard: <code>x/(1+x)</code>.</li>
      <li>Extended Reinhard: Reinhard with a white point.</li>
      <li>Hable (Uncharted 2): mimics a film curve.</li>
      <li>ACES approximation (Narkowicz).</li>
    </ul>
    <p>The graph at the bottom right shows output screen value against input linear luminance (0 to 4).</p>`,
    look: [
      'Look around the lights in A. They clip to flat white (clamp), and the light turns black quickly with distance. B falls off smoothly and keeps gradation in highlights.',
      'Turn on "Show clipping" and raise exposure. Pixels whose output reaches 1.0 turn magenta.',
      'In B, turn off the linear workflow and keep only tone mapping. The image gets dull and contrast gets too strong. This is because gamma encoding is missing.',
      'In A, turn on only the linear workflow and set tone mapping to "None". Falloff looks natural, but highlight clipping remains. This shows the two parts are independent.',
    ],
    refs: [null, 'SIGGRAPH 2002. The Reinhard operator.', 'GDC 2010. Filmic tone mapping curve and linear lighting.', null, null, null],
    params: {
      linear: { label: 'Linear workflow (sRGB decode/encode)', group: 'Pipeline' },
      tonemap: { label: 'Tone mapping', options: { 0: 'None (clamp)', 2: 'Extended Reinhard (white=4)', 4: 'ACES approx. (Narkowicz)' } },
      exposure: 'Exposure (EV)',
      showClip: 'Show clipping',
      showCurve: 'Tone curve graph',
      lightInt: { label: 'Light intensity', group: 'Scene' },
      lightMove: 'Move lights',
      autoRotate: 'Auto rotate',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params;
    const G = U.geometry;
    const floor = G.upload(gl, G.plane(14, 1, 3));
    const sphere = G.upload(gl, G.sphere(1, 40, 20));
    const quad = U.gl.quad(gl);

    // sRGB로 정의된 색상표 텍스처 (회색 계단 + 원색)
    const cv = ctx.createCanvas(256, 256), g = cv.getContext('2d');
    const sw = ['#ffffff', '#c8c8c8', '#a0a0a0', '#787878', '#505050', '#282828', '#d23c3c', '#3cb43c', '#3c64d2', '#e6c832', '#c850b4', '#3cb4c8',
      '#8c5a3c', '#b4a08c', '#5a8c3c', '#6e6eaa', '#dc8c3c', '#4a4a4a'];
    g.fillStyle = '#202020'; g.fillRect(0, 0, 256, 256);
    sw.forEach((c, i) => { g.fillStyle = c; g.fillRect((i % 6) * 42 + 3, Math.floor(i / 6) * 84 + 3, 38, 78); });
    const tex = U.gl.texture(gl, cv, { wrap: 'repeat', mipmap: true });
    const spheres = [['#d23c3c', -3], ['#e6c832', -1.5], ['#ffffff', 0], ['#3cb43c', 1.5], ['#3c64d2', 3]].map(([c, x]) => ({ c: U.hexToRgb01(c), x }));

    const TONE = `
      uniform float u_linear; uniform float u_tm; uniform float u_exposure; uniform float u_clip;
      vec3 toLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
      vec3 toSRGB(vec3 c) { c = max(c, vec3(0.0)); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
      vec3 hable(vec3 x) {
        float A = 0.15, B = 0.50, C = 0.10, D = 0.20, E = 0.02, F = 0.30;
        return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
      }
      vec3 tonemap(vec3 c) {
        c = max(c, vec3(0.0));
        if (u_tm > 3.5) return clamp((c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14), 0.0, 1.0);
        if (u_tm > 2.5) return hable(c * 2.0) / hable(vec3(11.2));
        if (u_tm > 1.5) return c * (1.0 + c / 16.0) / (1.0 + c);
        if (u_tm > 0.5) return c / (1.0 + c);
        return c;
      }
      vec3 inputColor(vec3 srgb) { return u_linear > 0.5 ? toLinear(srgb) : srgb; }
      vec3 outputColor(vec3 c) {
        vec3 t = tonemap(c * exp2(u_exposure));
        vec3 o = u_linear > 0.5 ? toSRGB(t) : t;
        if (u_clip > 0.5 && max(max(o.r, o.g), o.b) >= 0.999) return vec3(1.0, 0.0, 1.0);
        return clamp(o, 0.0, 1.0);
      }`;
    const prog = U.gl.program(gl, `
      attribute vec3 a_position; attribute vec3 a_normal; attribute vec2 a_uv;
      uniform mat4 u_vp; uniform mat4 u_world;
      varying vec3 v_pos; varying vec3 v_n; varying vec2 v_uv;
      void main(){
        vec4 wp = u_world * vec4(a_position, 1.0);
        v_pos = wp.xyz; v_n = a_normal; v_uv = a_uv;
        gl_Position = u_vp * wp;
      }`, `
      precision highp float;
      uniform sampler2D u_tex; uniform float u_useTex; uniform vec3 u_color; uniform vec3 u_eye;
      uniform vec3 u_lp[3]; uniform vec3 u_lc[3];
      varying vec3 v_pos; varying vec3 v_n; varying vec2 v_uv;
      ${TONE}
      void main(){
        vec3 srgb = u_useTex > 0.5 ? texture2D(u_tex, v_uv).rgb : u_color;
        vec3 alb = inputColor(srgb);
        vec3 N = normalize(v_n), V = normalize(u_eye - v_pos);
        vec3 c = alb * 0.02;
        for (int i = 0; i < 3; i++) {
          vec3 d = u_lp[i] - v_pos;
          float r2 = dot(d, d);
          vec3 L = d * inversesqrt(r2);
          vec3 H = normalize(L + V);
          float ndl = max(dot(N, L), 0.0);
          float spec = ndl > 0.0 ? pow(max(dot(N, H), 0.0), 64.0) * 0.4 : 0.0;
          c += (alb * ndl + vec3(spec)) * u_lc[i] / r2;
        }
        gl_FragColor = vec4(outputColor(c), 1.0);
      }`);
    const lampProg = U.gl.program(gl, `
      attribute vec3 a_position; uniform mat4 u_mvp;
      void main(){ gl_Position = u_mvp * vec4(a_position, 1.0); }`, `
      precision highp float; uniform vec3 u_emit;
      ${TONE}
      void main(){ gl_FragColor = vec4(outputColor(u_emit), 1.0); }`);
    const curveProg = U.gl.program(gl, U.gl.QUAD_VS, `
      precision highp float; varying vec2 v_uv;
      ${TONE}
      void main(){
        float x = v_uv.x * 4.0;
        float v = v_uv.y * 1.1;
        float y = outputColor(vec3(x)).g;
        float yOld = outputColor(vec3(x - 4.0 / 160.0)).g;
        float th = max(abs(y - yOld), 0.008) + 0.008;
        vec3 c = vec3(0.06, 0.07, 0.09);
        if (abs(v_uv.x - 0.25) < 0.004 || abs(v - 1.0) < 0.006) c = vec3(0.25);
        if (abs(v - y) < th) c = vec3(0.3, 0.76, 0.97);
        gl_FragColor = vec4(c, 1.0);
      }`);

    const cam = { yaw: 0.25, pitch: 0.42, dist: 9, drag: false, lx: 0, ly: 0 };
    let lt = 0;
    const lightCol = [[1, 0.75, 0.45], [0.45, 0.65, 1], [1, 0.4, 0.8]];

    return {
      update(dt) {
        if (P.autoRotate && !cam.drag) cam.yaw += dt * 0.15;
        if (P.lightMove) lt += dt * 0.5;
        if (ctx.input.mouse.wheel) cam.dist = U.clamp(cam.dist * Math.pow(1.12, ctx.input.mouse.wheel), 3, 25);
      },
      onPointer(type, m) {
        if (type === 'down') { cam.drag = true; cam.lx = m.x; cam.ly = m.y; }
        else if (type === 'up' || type === 'leave') cam.drag = false;
        else if (type === 'move' && cam.drag) {
          cam.yaw -= (m.x - cam.lx) * 0.008; cam.pitch = U.clamp(cam.pitch + (m.y - cam.ly) * 0.008, 0.05, 1.5);
          cam.lx = m.x; cam.ly = m.y;
        }
      },
      render() {
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        const proj = M.perspective(U.rad(50), ctx.width / ctx.height, 0.1, 100);
        const eye = M.orbitEye([0, 0.5, 0], cam.yaw, cam.pitch, cam.dist);
        const vp = M.multiply(proj, M.lookAt(eye, [0, 0.5, 0]));
        const lp = [
          [Math.sin(lt) * 3.5, 1.6, Math.cos(lt) * 1.5 + 1],
          [Math.sin(lt * 0.7 + 2) * 4, 1.2, -1.5],
          [Math.cos(lt * 0.9) * 2, 2.6, Math.sin(lt * 0.9) * 2.5],
        ];
        const lc = lightCol.map((c, i) => c.map((v) => v * P.lightInt * (i === 2 ? 0.6 : 1)));
        const setTone = (p) => {
          gl.uniform1f(p.u('u_linear'), P.linear ? 1 : 0);
          gl.uniform1f(p.u('u_tm'), +P.tonemap);
          gl.uniform1f(p.u('u_exposure'), P.exposure);
          gl.uniform1f(p.u('u_clip'), P.showClip ? 1 : 0);
        };
        prog.use();
        setTone(prog);
        gl.uniformMatrix4fv(prog.u('u_vp'), false, vp);
        gl.uniform3fv(prog.u('u_eye'), eye);
        gl.uniform3fv(prog.u('u_lp[0]'), lp.flat());
        gl.uniform3fv(prog.u('u_lc[0]'), lc.flat());
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(prog.u('u_tex'), 0);
        gl.uniform1f(prog.u('u_useTex'), 1);
        gl.uniformMatrix4fv(prog.u('u_world'), false, M.create());
        floor.draw(prog);
        gl.uniform1f(prog.u('u_useTex'), 0);
        for (const s of spheres) {
          gl.uniformMatrix4fv(prog.u('u_world'), false, M.mul(M.translation(s.x, 0.6, 0), M.scaling(0.6)));
          gl.uniform3fv(prog.u('u_color'), s.c);
          sphere.draw(prog);
        }
        lampProg.use();
        setTone(lampProg);
        lp.forEach((p, i) => {
          gl.uniformMatrix4fv(lampProg.u('u_mvp'), false, M.mul(vp, M.translation(p[0], p[1], p[2]), M.scaling(0.08)));
          gl.uniform3fv(lampProg.u('u_emit'), lc[i].map((v) => v * 2));
          sphere.draw(lampProg);
        });
        if (P.showCurve) {
          const w = Math.round(ctx.pixelWidth * 0.26), h = Math.round(w * 0.6);
          gl.disable(gl.DEPTH_TEST);
          gl.viewport(ctx.pixelWidth - w - 8, 8, w, h);
          curveProg.use();
          setTone(curveProg);
          gl.uniform1f(curveProg.u('u_clip'), 0);
          quad.draw(curveProg);
        }
        const tm = [GTL.L('클램프', 'Clamp'), 'Reinhard', GTL.L('Reinhard 확장', 'Extended Reinhard'), 'Hable', 'ACES'][+P.tonemap];
        ctx.stat(GTL.L('파이프라인', 'Pipeline'), (P.linear ? GTL.L('sRGB→선형→', 'sRGB→linear→') : GTL.L('감마값 그대로→', 'raw gamma values→')) + tm + (P.linear ? '→sRGB' : ''));
        ctx.stat(GTL.L('노출 배율', 'Exposure scale'), '×' + Math.pow(2, P.exposure).toFixed(2));
        ctx.stat(GTL.L('그래프', 'Graph'), GTL.L('가로: 선형 0~4, 세로선 = 1.0', 'X axis: linear 0~4, vertical line = 1.0'));
      },
    };
  },
});
