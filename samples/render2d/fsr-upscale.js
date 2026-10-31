// 공간 업스케일링: 저해상도로 렌더한 뒤 바이리니어 확대 vs 에지 적응 업스케일(FSR 1 EASU를 단순화) + RCAS 샤프닝
GTL.register({
  id: 'fsr-upscale',
  title: '공간 업스케일링 (Bilinear vs 에지 적응 + 샤프닝)',
  summary: '화면을 낮은 해상도로 렌더하고 출력 해상도로 키우면 픽셀 비용이 크게 줄어듦. 바이리니어 확대는 경계가 뭉개짐. 경계 방향을 보고 커널을 늘이는 에지 적응 필터와 대비 제한 샤프닝을 쓰면 같은 입력에서 경계가 훨씬 또렷함.',
  renderer: 'webgl',
  views: { a: 'Bilinear 확대', b: '에지 적응 (EASU 유사) + RCAS' },
  controls: '마우스: 돋보기 위치',
  info: `
    <p>해상도를 가로세로 절반으로 낮추면 셰이딩할 픽셀이 1/4로 줄어듦. 대신 확대(업스케일) 필터의 품질이 화질을 결정.</p>
    <ul>
    <li><b>Nearest</b>: 가장 가까운 텍셀 복사. 계단과 깍두기가 그대로 커짐.</li>
    <li><b>Bilinear</b>: 주변 2×2를 선형 보간. 하드웨어가 공짜로 해 주지만 경계가 흐려짐.</li>
    <li><b>Catmull-Rom</b>: 4×4 쌍삼차 보간. 더 선명하지만 경계 근처에 링잉(밝고 어두운 테)이 생김.</li>
    <li><b>에지 적응 (EASU 유사)</b>: 12탭에서 밝기 기울기로 경계 방향을 찾음. Lanczos 비슷한 커널을 경계를 따라 길게, 가로질러 좁게 늘임. 결과를 가운데 2×2의 최소값, 최대값으로 잘라 링잉을 막음.</li>
    <li><b>RCAS 샤프닝</b>: 상하좌우 4탭으로 선명하게 만듦. 이웃의 최소값, 최대값을 보고 0~1을 넘지 않는 만큼만 강도를 정해서 하얀 테가 생기지 않음.</li>
    </ul>
    <p>AMD FidelityFX Super Resolution 1(FSR 1)이 EASU와 RCAS 두 패스로 이렇게 동작. 이 샘플은 핵심 아이디어만 옮긴 단순화 구현이라 원본과 결과가 똑같지는 않음.</p>
    <p>공간 업스케일은 프레임 하나의 정보만 씀. 없는 디테일은 만들지 못하고, 입력에 계단이 있으면 계단을 선명하게 키움. 그래서 입력이 안티에일리어싱된 상태여야 함. 여러 프레임을 모으는 시간 업스케일(FSR 2, DLSS, TAAU)은 이 한계를 넘음.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 162" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="14" class="t-a">A: Bilinear</text>
    <polygon points="40,26 136,26 40,122" class="f-dim"/>
    ${[0, 1, 2, 3, 4].map((i) => `<line x1="${40 + i * 24}" y1="26" x2="${40 + i * 24}" y2="122" class="d-dim"/><line x1="40" y1="${26 + i * 24}" x2="136" y2="${26 + i * 24}" class="d-dim"/>`).join('')}
    <line x1="40" y1="122" x2="136" y2="26" class="d-line"/>
    <rect x="64" y="50" width="48" height="48" class="d-a" fill="none"/>
    <circle cx="88" cy="74" r="3.5" class="f-accent"/>
    <text x="10" y="140" class="t-small">${L('2x2를 그대로 섞음', 'Blends the 2x2 as is')}</text>
    <text x="10" y="153" class="t-small t-dim">${L('경계를 가로질러 섞여 흐림', 'Mixes across the edge: blur')}</text>
    <text x="190" y="14" class="t-b">${L('B: 에지 적응 (EASU 유사)', 'B: Edge-adaptive (EASU-like)')}</text>
    <polygon points="230,26 326,26 230,122" class="f-dim"/>
    ${[0, 1, 2, 3, 4].map((i) => `<line x1="${230 + i * 24}" y1="26" x2="${230 + i * 24}" y2="122" class="d-dim"/><line x1="230" y1="${26 + i * 24}" x2="326" y2="${26 + i * 24}" class="d-dim"/>`).join('')}
    <line x1="230" y1="122" x2="326" y2="26" class="d-line"/>
    ${[[1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [3, 2], [1, 3], [2, 3]].map(([i, j]) => `<circle cx="${242 + i * 24}" cy="${38 + j * 24}" r="2.8" class="f-b"/>`).join('')}
    <ellipse cx="278" cy="74" rx="44" ry="10" transform="rotate(-45 278 74)" class="d-b"/>
    <path d="M278,74 L300,96" class="d-accent" marker-end="url(#arr)"/>
    <text x="302" y="108" class="t-small">${L('기울기', 'gradient')}</text>
    <text x="190" y="140" class="t-small">${L('12탭으로 경계 방향을 찾음', '12 taps find the edge direction')}</text>
    <text x="190" y="153" class="t-small t-dim">${L('경계를 따라 길게, 가로질러 좁게', 'Long along the edge, narrow across')}</text>
    <text x="392" y="14">${L('RCAS 샤프닝', 'RCAS sharpening')}</text>
    ${[0, 1, 2, 3].map((i) => `<line x1="${420 + i * 24}" y1="30" x2="${420 + i * 24}" y2="102" class="d-dim"/><line x1="420" y1="${30 + i * 24}" x2="492" y2="${30 + i * 24}" class="d-dim"/>`).join('')}
    ${[[1, 0], [0, 1], [2, 1], [1, 2]].map(([i, j]) => `<circle cx="${432 + i * 24}" cy="${42 + j * 24}" r="3.5" class="f-b"/>`).join('')}
    <circle cx="456" cy="66" r="4.5" class="f-accent"/>
    <text x="392" y="140" class="t-small">${L('상하좌우 4탭으로 선명하게', '4 neighbor taps sharpen')}</text>
    <text x="392" y="153" class="t-small t-dim">${L('이웃 최소, 최대로 강도 제한', 'Clamped by neighbor min/max')}</text>
  </svg>`,
  look: [
    'A와 B의 돋보기를 비교하면 A는 지멘스 스타 바퀴살과 삼각형 경계가 뿌옇게 번짐. B는 경계가 또렷하고 링잉 없음.',
    'A를 "Catmull-Rom"으로 바꾸면 선명해지지만 밝은 선 옆에 어두운 테가 생김',
    '"렌더 배율"을 0.33까지 내리면 두 방식 모두 가는 선이 사라짐. 공간 업스케일은 없는 정보를 되살리지 못함.',
    '"입력 안티에일리어싱"을 끄면 B도 계단이 선명하게 커짐. 입력이 AA된 상태여야 하는 이유임.',
    'A를 "네이티브"로 바꾸면 출력 해상도로 직접 렌더한 정답과 B를 비교할 수 있음',
  ],
  refs: [
    { type: 'code', title: 'AMD FidelityFX Super Resolution 1 (FSR 1): ffx_fsr1.h, EASU와 RCAS', url: 'https://github.com/GPUOpen-Effects/FidelityFX-FSR', year: 2021, note: '원본 셰이더와 문서. 이 샘플의 탭 배치, 가중치 근사, 대비 제한 샤프닝의 출처.' },
    { type: 'article', title: 'AMD FidelityFX Super Resolution 1 (GPUOpen 문서)', url: 'https://gpuopen.com/fidelityfx-superresolution/', note: '입력에 안티에일리어싱이 필요하다는 조건과 배율별 품질 모드' },
    { type: 'paper', title: 'Cubic Convolution Interpolation for Digital Image Processing (Robert G. Keys)', year: 1981, note: 'IEEE Trans. ASSP. Catmull-Rom 계열 쌍삼차 보간 커널.' },
  ],
  params: [
    { key: 'method', label: '업스케일 필터', type: 'select', group: '업스케일', options: [
      { value: 'native', label: '네이티브 (출력 해상도로 렌더, 정답)' },
      { value: 'nearest', label: 'Nearest' },
      { value: 'bilinear', label: 'Bilinear' },
      { value: 'catmull', label: 'Catmull-Rom (4×4)' },
      { value: 'easu', label: '에지 적응 (EASU 유사, 12탭)' },
    ], a: 'bilinear', b: 'easu' },
    { key: 'sharpen', label: 'RCAS 샤프닝', type: 'bool', a: false, b: true },
    { key: 'sharpStops', label: '샤프닝 감쇠 (stop)', type: 'range', min: 0, max: 2, step: 0.05, default: 0.2, help: '0이 가장 강함. 1 증가마다 강도 절반', when: (p) => p.sharpen },
    { key: 'scale', label: '렌더 배율', type: 'select', group: '장면', options: [
      { value: 0.33, label: '0.33 (3배 확대, Performance 이하)' },
      { value: 0.5, label: '0.5 (2배 확대, Performance)' },
      { value: 0.59, label: '0.59 (1.7배, Balanced)' },
      { value: 0.67, label: '0.67 (1.5배, Quality)' },
      { value: 0.77, label: '0.77 (1.3배, Ultra Quality)' },
    ], default: 0.5, shared: true },
    { key: 'inputAA', label: '입력 안티에일리어싱 (4x SSAA)', type: 'bool', default: true, shared: true },
    { key: 'loupe', label: '돋보기 (4배)', type: 'bool', default: true, shared: true },
    { key: 'animate', label: '회전', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Spatial Upscaling (Bilinear vs Edge-Adaptive + Sharpening)',
    summary: 'Render the screen at a low resolution and scale it up to the output resolution. This cuts the pixel cost a lot. Bilinear scaling blurs edges. An edge-adaptive filter stretches its kernel along the edge direction, and contrast-limited sharpening keeps it from overshooting. With the same input, edges look much crisper.',
    views: { a: 'Bilinear scaling', b: 'Edge-adaptive (EASU-like) + RCAS' },
    controls: 'Mouse: magnifier position',
    info: `
    <p>If you halve the width and height, you shade only 1/4 of the pixels. In exchange, the quality of the upscale filter decides the final image quality.</p>
    <ul>
    <li><b>Nearest</b>: copies the closest texel. Stair steps and blocks grow as they are.</li>
    <li><b>Bilinear</b>: blends the nearby 2×2 texels linearly. The hardware does it for free, but edges get blurry.</li>
    <li><b>Catmull-Rom</b>: 4×4 bicubic interpolation. It is sharper, but it adds ringing (light and dark halos) near edges.</li>
    <li><b>Edge-adaptive (EASU-like)</b>: finds the edge direction from the luma gradient over 12 taps. It stretches a Lanczos-like kernel long along the edge and narrow across it. It clamps the result to the min and max of the center 2×2 to prevent ringing.</li>
    <li><b>RCAS sharpening</b>: sharpens with 4 taps (up, down, left, right). It checks the min and max of the neighbors and limits the strength so values stay within 0~1. So no white halos appear.</li>
    </ul>
    <p>AMD FidelityFX Super Resolution 1 (FSR 1) works this way with two passes, EASU and RCAS. This sample is a simplified version that keeps only the core ideas. Its output does not exactly match the original.</p>
    <p>Spatial upscaling uses information from one frame only. It cannot create missing detail. If the input has stair steps, it scales them up sharply. So the input must already be anti-aliased. Temporal upscalers (FSR 2, DLSS, TAAU) collect several frames and get past this limit.</p>`,
    look: [
      'Compare the magnifiers of A and B. In A, the Siemens star spokes and the triangle edges look blurry. In B, edges are crisp with no ringing.',
      'Set A to "Catmull-Rom". It gets sharper, but dark halos appear next to bright lines.',
      'Lower "Render scale" to 0.33. Thin lines disappear in both. Spatial upscaling cannot bring back missing information.',
      'Turn off "Input anti-aliasing". B also scales up the stair steps sharply. This is why the input must be anti-aliased.',
      'Set A to "Native". Now you can compare B with the reference rendered directly at output resolution.',
    ],
    refs: [
      { title: 'AMD FidelityFX Super Resolution 1 (FSR 1): ffx_fsr1.h, EASU and RCAS', note: 'Original shaders and docs. The source of the tap layout, weight approximation, and contrast-limited sharpening in this sample.' },
      { title: 'AMD FidelityFX Super Resolution 1 (GPUOpen docs)', note: 'The input anti-aliasing requirement and the quality modes for each scale.' },
      'IEEE Trans. ASSP. The Catmull-Rom family bicubic interpolation kernel.',
    ],
    params: {
      method: { label: 'Upscale filter', group: 'Upscale', options: { native: 'Native (render at output resolution, reference)', easu: 'Edge-adaptive (EASU-like, 12 taps)' } },
      sharpen: 'RCAS sharpening',
      sharpStops: { label: 'Sharpening falloff (stops)', help: '0 is the strongest. Each +1 halves the strength' },
      scale: { label: 'Render scale', group: 'Scene', options: { 0.33: '0.33 (3x scale, below Performance)', 0.5: '0.5 (2x scale, Performance)', 0.59: '0.59 (1.7x, Balanced)', 0.67: '0.67 (1.5x, Quality)', 0.77: '0.77 (1.3x, Ultra Quality)' } },
      inputAA: 'Input anti-aliasing (4x SSAA)',
      loupe: 'Magnifier (4x)',
      animate: 'Rotate',
    },
  },

  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, P = ctx.params;
    const VS = U.gl.QUAD_VS;
    const SCENE_FS = `precision highp float; varying vec2 v_uv;
uniform vec2 u_res; uniform float u_time; uniform float u_aa;
vec2 rot(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
float tri(vec2 p, float r){
  float k = 1.7320508;
  p.x = abs(p.x) - r; p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}
float seg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
vec3 scene(vec2 q, float asp){
  vec3 col = mix(vec3(0.08, 0.09, 0.12), vec3(0.17, 0.19, 0.25), q.y);
  // Siemens star
  vec2 d = q - vec2(asp * 0.27, 0.56);
  float r = length(d);
  if (r < 0.3) {
    float a = atan(d.y, d.x) + u_time * 0.15;
    float s = step(0.5, fract(a * 36.0 / 6.2831853));
    col = mix(vec3(0.05), vec3(0.95), s);
  }
  if (abs(r - 0.305) < 0.004) col = vec3(0.9, 0.75, 0.3);
  // rotating triangle
  vec2 tp = rot(q - vec2(asp * 0.72, 0.68), u_time * 0.3);
  if (tri(tp, 0.15) < 0.0) col = vec3(0.95, 0.35, 0.25);
  // thin lines (several angles)
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float ang = 0.12 + fi * 0.21 + u_time * 0.02;
    vec2 c = vec2(asp * 0.72, 0.22);
    vec2 dir = vec2(cos(ang), sin(ang)) * 0.2;
    if (seg(q, c - dir, c + dir) < 0.0012 + fi * 0.0006) col = vec3(0.4, 0.9, 1.0);
  }
  // bars of increasing width
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float w = 0.0015 * (fi + 1.0);
    float x0 = asp * 0.06 + fi * 0.035;
    if (q.x > x0 && q.x < x0 + w && q.y > 0.06 && q.y < 0.2) col = vec3(1.0);
  }
  return col;
}
void main(){
  float asp = u_res.x / u_res.y;
  vec2 px = v_uv * u_res;
  vec3 c;
  if (u_aa > 0.5) {
    c = scene((px + vec2(-0.25, -0.25)) / u_res.y, asp) + scene((px + vec2(0.25, -0.25)) / u_res.y, asp)
      + scene((px + vec2(-0.25, 0.25)) / u_res.y, asp) + scene((px + vec2(0.25, 0.25)) / u_res.y, asp);
    c *= 0.25;
  } else c = scene(px / u_res.y, asp);
  gl_FragColor = vec4(c, 1.0);
}`;
    const UP_FS = `precision highp float; varying vec2 v_uv;
uniform sampler2D u_src; uniform vec2 u_in; uniform float u_mode;
vec3 T(vec2 tc){ return texture2D(u_src, (tc + 0.5) / u_in).rgb; }
float L(vec3 c){ return c.g + 0.5 * (c.r + c.b); }
vec4 cubicW(float x){
  float x2 = x * x, x3 = x2 * x;
  return vec4(-0.5 * x3 + x2 - 0.5 * x, 1.5 * x3 - 2.5 * x2 + 1.0, -1.5 * x3 + 2.0 * x2 + 0.5 * x, 0.5 * x3 - 0.5 * x2);
}
void easuTap(inout vec3 acc, inout float aw, vec2 off, vec2 dir, vec2 len2, float lob, float clp, vec3 c){
  vec2 v = vec2(off.x * dir.x + off.y * dir.y, -off.x * dir.y + off.y * dir.x) * len2;
  float d2 = min(dot(v, v), clp);
  float wB = 0.4 * d2 - 1.0;
  float wA = lob * d2 - 1.0;
  wB *= wB; wA *= wA;
  wB = 1.5625 * wB - 0.5625;
  float w = wB * wA;
  acc += c * w; aw += w;
}
void dirLen(inout vec2 dir, inout float len, float w, float lA, float lB, float lC, float lD, float lE){
  // lA up, lB left, lC center, lD right, lE down
  float dc = lD - lC, cb = lC - lB;
  float lenX = max(abs(dc), abs(cb));
  lenX = lenX > 0.0 ? clamp(abs(lD - lB) / lenX, 0.0, 1.0) : 0.0;
  lenX *= lenX;
  float ec = lE - lC, ca = lC - lA;
  float lenY = max(abs(ec), abs(ca));
  lenY = lenY > 0.0 ? clamp(abs(lE - lA) / lenY, 0.0, 1.0) : 0.0;
  lenY *= lenY;
  dir += vec2(lD - lB, lE - lA) * w;
  len += (lenX + lenY) * w;
}
void main(){
  vec2 pp = v_uv * u_in - 0.5;
  vec2 fp = floor(pp);
  vec2 f = pp - fp;
  if (u_mode < 1.5) {
    // 1 = bilinear (hardware filter)
    gl_FragColor = vec4(texture2D(u_src, v_uv).rgb, 1.0);
    return;
  }
  if (u_mode < 2.5) {
    vec4 wx = cubicW(f.x), wy = cubicW(f.y);
    vec3 s = vec3(0.0);
    for (int j = 0; j < 4; j++) {
      vec3 row = vec3(0.0);
      for (int i = 0; i < 4; i++) {
        vec3 c = T(fp + vec2(float(i) - 1.0, float(j) - 1.0));
        float w = i == 0 ? wx.x : i == 1 ? wx.y : i == 2 ? wx.z : wx.w;
        row += c * w;
      }
      float wj = j == 0 ? wy.x : j == 1 ? wy.y : j == 2 ? wy.z : wy.w;
      s += row * wj;
    }
    gl_FragColor = vec4(clamp(s, 0.0, 1.0), 1.0);
    return;
  }
  //    b c
  //  e f g h
  //  i j k l
  //    n o
  vec3 b = T(fp + vec2(0.0, -1.0)), c = T(fp + vec2(1.0, -1.0));
  vec3 e = T(fp + vec2(-1.0, 0.0)), ff = T(fp), g = T(fp + vec2(1.0, 0.0)), h = T(fp + vec2(2.0, 0.0));
  vec3 i = T(fp + vec2(-1.0, 1.0)), j = T(fp + vec2(0.0, 1.0)), k = T(fp + vec2(1.0, 1.0)), l = T(fp + vec2(2.0, 1.0));
  vec3 n = T(fp + vec2(0.0, 2.0)), o = T(fp + vec2(1.0, 2.0));
  float bL = L(b), cL = L(c), eL = L(e), fL = L(ff), gL = L(g), hL = L(h), iL = L(i), jL = L(j), kL = L(k), lL = L(l), nL = L(n), oL = L(o);
  vec2 dir = vec2(0.0); float len = 0.0;
  dirLen(dir, len, (1.0 - f.x) * (1.0 - f.y), bL, eL, fL, gL, jL);
  dirLen(dir, len, f.x * (1.0 - f.y), cL, fL, gL, hL, kL);
  dirLen(dir, len, (1.0 - f.x) * f.y, fL, iL, jL, kL, nL);
  dirLen(dir, len, f.x * f.y, gL, jL, kL, lL, oL);
  float d2 = dot(dir, dir);
  if (d2 < 1.0 / 32768.0) dir = vec2(1.0, 0.0); else dir *= inversesqrt(d2);
  len = len * 0.5; len *= len;
  float stretch = 1.0 / max(abs(dir.x), abs(dir.y));
  vec2 len2 = vec2(1.0 + (stretch - 1.0) * len, 1.0 - 0.5 * len);
  float lob = 0.5 - 0.29 * len;
  float clp = 1.0 / lob;
  vec3 acc = vec3(0.0); float aw = 0.0;
  easuTap(acc, aw, vec2(0.0, -1.0) - f, dir, len2, lob, clp, b);
  easuTap(acc, aw, vec2(1.0, -1.0) - f, dir, len2, lob, clp, c);
  easuTap(acc, aw, vec2(-1.0, 1.0) - f, dir, len2, lob, clp, i);
  easuTap(acc, aw, vec2(0.0, 1.0) - f, dir, len2, lob, clp, j);
  easuTap(acc, aw, vec2(0.0, 0.0) - f, dir, len2, lob, clp, ff);
  easuTap(acc, aw, vec2(-1.0, 0.0) - f, dir, len2, lob, clp, e);
  easuTap(acc, aw, vec2(1.0, 1.0) - f, dir, len2, lob, clp, k);
  easuTap(acc, aw, vec2(2.0, 1.0) - f, dir, len2, lob, clp, l);
  easuTap(acc, aw, vec2(2.0, 0.0) - f, dir, len2, lob, clp, h);
  easuTap(acc, aw, vec2(1.0, 0.0) - f, dir, len2, lob, clp, g);
  easuTap(acc, aw, vec2(1.0, 2.0) - f, dir, len2, lob, clp, o);
  easuTap(acc, aw, vec2(0.0, 2.0) - f, dir, len2, lob, clp, n);
  vec3 mn = min(min(ff, g), min(j, k)), mx = max(max(ff, g), max(j, k));
  vec3 res = acc / max(aw, 1e-5);
  gl_FragColor = vec4(clamp(res, mn, mx), 1.0);
}`;
    const NEAREST_FS = `precision highp float; varying vec2 v_uv;
uniform sampler2D u_src; uniform vec2 u_in;
void main(){ vec2 tc = floor(v_uv * u_in) + 0.5; gl_FragColor = vec4(texture2D(u_src, tc / u_in).rgb, 1.0); }`;
    const RCAS_FS = `precision highp float; varying vec2 v_uv;
uniform sampler2D u_src; uniform vec2 u_texel; uniform float u_sharp;
void main(){
  vec3 b = texture2D(u_src, v_uv + vec2(0.0, -u_texel.y)).rgb;
  vec3 d = texture2D(u_src, v_uv + vec2(-u_texel.x, 0.0)).rgb;
  vec3 e = texture2D(u_src, v_uv).rgb;
  vec3 f = texture2D(u_src, v_uv + vec2(u_texel.x, 0.0)).rgb;
  vec3 h = texture2D(u_src, v_uv + vec2(0.0, u_texel.y)).rgb;
  vec3 mn4 = min(min(b, d), min(f, h));
  vec3 mx4 = max(max(b, d), max(f, h));
  vec3 hitMin = mn4 / (4.0 * mx4 + 1e-5);
  vec3 hitMax = (1.0 - mx4) / (4.0 * mn4 - 4.0 - 1e-5);
  vec3 lobeRGB = max(-hitMin, hitMax);
  float lobe = max(-0.1875, min(max(lobeRGB.r, max(lobeRGB.g, lobeRGB.b)), 0.0)) * u_sharp;
  vec3 c = (lobe * (b + d + f + h) + e) / (4.0 * lobe + 1.0);
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;
    const PRESENT_FS = `precision highp float; varying vec2 v_uv;
uniform sampler2D u_src; uniform vec2 u_res; uniform vec2 u_center; uniform float u_rad; uniform float u_loupe;
void main(){
  vec2 px = v_uv * u_res;
  vec2 d = px - u_center;
  float r = length(d);
  if (u_loupe > 0.5 && r < u_rad) {
    vec2 sp = floor(u_center + d / 4.0) + 0.5;
    gl_FragColor = vec4(texture2D(u_src, sp / u_res).rgb, 1.0);
    return;
  }
  if (u_loupe > 0.5 && r < u_rad + 2.0) { gl_FragColor = vec4(0.95, 0.8, 0.3, 1.0); return; }
  gl_FragColor = vec4(texture2D(u_src, v_uv).rgb, 1.0);
}`;
    const progScene = U.gl.program(gl, VS, SCENE_FS), progUp = U.gl.program(gl, VS, UP_FS), progNear = U.gl.program(gl, VS, NEAREST_FS);
    const progRcas = U.gl.program(gl, VS, RCAS_FS), progPresent = U.gl.program(gl, VS, PRESENT_FS);
    const quad = U.gl.quad(gl);
    let low = null, up = null, sh = null, t = 0;
    const MODE = { bilinear: 1, catmull: 2, easu: 3 };
    const TAPS = { native: 0, nearest: 1, bilinear: 1, catmull: 16, easu: 12 };

    function ensure(lw, lh, pw, ph) {
      if (!low || low.width !== lw || low.height !== lh) { if (low) low.dispose(); low = U.gl.framebuffer(gl, lw, lh, { filter: 'linear' }); }
      if (!up || up.width !== pw || up.height !== ph) {
        if (up) up.dispose(); if (sh) sh.dispose();
        up = U.gl.framebuffer(gl, pw, ph, { filter: 'nearest' });
        sh = U.gl.framebuffer(gl, pw, ph, { filter: 'nearest' });
      }
    }
    const bindTex = (prog, tex) => { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(prog.u('u_src'), 0); };

    return {
      update(dt) { if (P.animate) t += dt; },
      render() {
        const pw = ctx.pixelWidth, ph = ctx.pixelHeight;
        const sc = Number(P.scale);
        const lw = Math.max(8, Math.round(pw * sc)), lh = Math.max(8, Math.round(ph * sc));
        ensure(lw, lh, pw, ph);
        gl.disable(gl.BLEND);
        let passes = 0;
        const native = P.method === 'native';
        // 1) 장면
        (native ? up : low).bind();
        progScene.use();
        gl.uniform2f(progScene.u('u_res'), native ? pw : lw, native ? ph : lh);
        gl.uniform1f(progScene.u('u_time'), t);
        gl.uniform1f(progScene.u('u_aa'), P.inputAA ? 1 : 0);
        quad.draw(progScene); passes++;
        // 2) 업스케일
        if (!native) {
          up.bind();
          const prog = P.method === 'nearest' ? progNear : progUp;
          prog.use(); bindTex(prog, low.tex);
          gl.uniform2f(prog.u('u_in'), lw, lh);
          if (prog === progUp) gl.uniform1f(prog.u('u_mode'), MODE[P.method]);
          quad.draw(prog); passes++;
        }
        // 3) 샤프닝
        let final = up;
        if (P.sharpen) {
          sh.bind();
          progRcas.use(); bindTex(progRcas, up.tex);
          gl.uniform2f(progRcas.u('u_texel'), 1 / pw, 1 / ph);
          gl.uniform1f(progRcas.u('u_sharp'), Math.pow(2, -P.sharpStops));
          quad.draw(progRcas); passes++;
          final = sh;
        }
        // 4) 화면 출력 + 돋보기
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, pw, ph);
        progPresent.use(); bindTex(progPresent, final.tex);
        const m = ctx.input.mouse, pr = ctx.pixelRatio;
        // 기본 위치: 지멘스 스타 중심에서 조금 오른쪽 (바퀴살이 가늘어지는 곳)
        const cx = m.inside ? m.x : ctx.width * 0.27 + ctx.height * 0.12, cy = m.inside ? m.y : ctx.height * 0.44;
        gl.uniform2f(progPresent.u('u_res'), pw, ph);
        gl.uniform2f(progPresent.u('u_center'), cx * pr, ph - cy * pr);
        gl.uniform1f(progPresent.u('u_rad'), Math.min(ctx.width, ctx.height) * 0.22 * pr);
        gl.uniform1f(progPresent.u('u_loupe'), P.loupe ? 1 : 0);
        quad.draw(progPresent); passes++;
        gl.activeTexture(gl.TEXTURE0);

        const shaded = native ? pw * ph : lw * lh;
        ctx.stat(GTL.L('내부 해상도', 'Internal resolution'), native ? GTL.L(`${pw}×${ph} (네이티브)`, `${pw}×${ph} (native)`) : `${lw}×${lh}`);
        ctx.stat(GTL.L('셰이딩 픽셀 비율', 'Shaded pixel ratio'), `${Math.round((shaded / (pw * ph)) * 100)}%`);
        ctx.stat(GTL.L('업스케일 탭/픽셀', 'Upscale taps/pixel'), TAPS[P.method] + (P.sharpen ? ' + RCAS 5' : ''));
        ctx.stat(GTL.L('렌더 패스', 'Render passes'), passes);
      },
    };
  },
});
