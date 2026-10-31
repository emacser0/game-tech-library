// 2D 전역 조명: Jump Flooding으로 거리장을 만들고, 거리장 위에서 레이를 진행(sphere tracing)해 빛을 모음
GTL.register({
  id: 'jfa-2d-gi',
  title: '2D 전역 조명 (Jump Flood 거리장 + 레이 마칭)',
  summary: 'Jump Flooding(JFA)으로 화면 전체의 "가장 가까운 벽까지 거리"를 log₂N 패스 만에 만듦. 이 거리장 위에서 레이를 큰 보폭으로 진행해 광원마다 하드 섀도를 그리거나, 모든 방향으로 레이를 쏴서 면광원의 부드러운 그림자와 색 번짐을 얻음.',
  renderer: 'webgl2',
  views: { a: '점광원 하드 섀도', b: '레이 수집 전역 조명' },
  controls: '마우스: 주황 광원 이동',
  info: `
    <p>2D 조명에서 비싼 부분은 "이 픽셀에서 저 방향으로 가면 무엇에 부딪히나"를 묻는 레이 질의. 한 픽셀씩 전진하면 화면 폭만큼 텍스처를 읽어야 함.</p>
    <p><b>거리장(Distance Field)</b>이 있으면 현재 위치에서 가장 가까운 벽까지의 거리 d만큼 한 번에 건너뛰어도 안전함. 이것이 sphere tracing. 빈 공간에서는 보폭이 커서 수십 번 안에 끝남.</p>
    <p><b>Jump Flooding</b>(Rong & Tan 2006)은 거리장을 GPU에서 빠르게 만드는 방법</p>
    <ol>
    <li>벽 픽셀에 자기 좌표를 씨앗(seed)으로 씀</li>
    <li>보폭 k = N/2, N/4, ..., 1로 패스를 반복. 각 픽셀은 k만큼 떨어진 8개 이웃의 씨앗 중 가장 가까운 것을 가져감.</li>
    <li>log₂N 패스 뒤 모든 픽셀이 (거의) 가장 가까운 씨앗을 앎. 거리 = |픽셀 - 씨앗|.</li>
    </ol>
    <p>조명 방식은 셋</p>
    <ul>
    <li><b>하드 섀도</b>: 광원 중심으로 레이 하나. 막히면 0, 아니면 1.</li>
    <li><b>소프트 섀도</b>: 같은 레이에서 <code>min(k d / t)</code>를 추적해 벽을 아슬아슬하게 스친 정도로 반그림자를 근사 (Quilez 방식)</li>
    <li><b>전역 조명</b>: 모든 방향으로 레이 R개. 부딪힌 픽셀의 발광 색을 평균. 면광원 크기에 맞는 반그림자와 광원 색 혼합이 저절로 생김. 레이가 적으면 노이즈가 생겨서 프레임마다 각도를 흔들고 시간 누적으로 평균냄.</li>
    </ul>
    <p>어려운 점(level 4인 이유):</p>
    <ul>
    <li>JFA 패스가 모자라면 씨앗이 닿지 않은 영역의 거리가 무한대가 됨. 레이가 벽을 건너뛰어 빛이 새어 나감.</li>
    <li>좌표를 8비트 채널에 담으려면 16비트로 나눠 담아야 함. 정밀도를 잃으면 거리장이 계단처럼 틀어짐.</li>
    <li>시간 누적은 노이즈를 지우지만 광원이 움직이면 잔상이 남음. 8비트 버퍼에서는 누적 값이 반올림에 걸려 줄무늬가 생김.</li>
    </ul>`,
  diagram: (L) => `<svg viewBox="0 0 540 206" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="14">${L('Jump Flooding: 보폭 k를 절반씩', 'Jump flooding: halve step k')}</text>
    ${Array.from({ length: 10 }, (_, i) => `<line x1="${40 + i * 14}" y1="24" x2="${40 + i * 14}" y2="150" class="d-dim"/><line x1="40" y1="${24 + i * 14}" x2="166" y2="${24 + i * 14}" class="d-dim"/>`).join('')}
    <rect x="96" y="80" width="14" height="14" class="f-accent"/>
    ${[[4, 0.3], [2, 0.6], [1, 1]].map(([k, o]) => [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].map(([dx, dy]) => `<circle cx="${103 + dx * k * 14}" cy="${87 + dy * k * 14}" r="3.5" class="f-b" opacity="${o}"/>`).join('')).join('')}
    <text x="10" y="168" class="t-small">${L('k = 4, 2, 1 (흐림에서 진함 순)', 'k = 4, 2, 1 (faint to solid)')}</text>
    <text x="10" y="182" class="t-small t-dim">${L('이웃 8개의 씨앗 중 가장 가까운 것을 가짐', 'Keep the nearest seed of 8 neighbors')}</text>
    <text x="10" y="196" class="t-small t-dim">${L('log2 N 패스 뒤 거리 = |픽셀 - 씨앗|', 'After log2 N passes: dist = |pixel - seed|')}</text>
    <text x="300" y="14">${L('Sphere tracing: 거리 d만큼 건너뜀', 'Sphere tracing: jump by distance d')}</text>
    <rect x="340" y="30" width="80" height="42" class="f-dim"/><rect x="480" y="30" width="50" height="150" class="f-dim"/><rect x="350" y="150" width="80" height="30" class="f-dim"/>
    ${[[322, 115, 45], [367, 113, 37], [404, 111, 39], [443, 109, 37]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" class="d-b" opacity="0.6"/><circle cx="${x}" cy="${y}" r="2.5" class="f-b"/>`).join('')}
    <path d="M322,115 L478,107" class="d-accent" marker-end="url(#arr)"/>
    <circle cx="480" cy="107" r="3.5" class="f-good"/>
    <text x="300" y="192" class="t-small t-dim">${L('원 = 그 위치에서 가장 가까운 벽까지 거리', 'Circle = distance to the nearest wall')}</text>
    <text x="300" y="204" class="t-small t-dim">${L('레이가 4번 만에 벽에 닿음', 'The ray reaches the wall in 4 steps')}</text>
  </svg>`,
  look: [
    'A와 B를 비교하면 A는 그림자 경계가 칼처럼 날카로움. B는 광원 크기에 맞는 반그림자가 생기고 벽 틈으로 색이 섞여 들어옴.',
    '"JFA 패스 수"를 4 이하로 낮추면 벽에서 먼 영역에 씨앗이 닿지 않음. 빛이 벽을 뚫고 새어 나감. "보기"를 "Voronoi"로 바꾸면 빈 영역이 검게 보임.',
    'B의 "레이 수"를 4로 낮추고 "시간 누적"을 0으로 내리면 화면이 지글거림. 누적을 0.9로 올리면 매끈해지지만 마우스 광원을 움직이면 잔상이 남음.',
    'A를 "소프트 섀도"로 바꾸면 레이 하나로도 반그림자가 생김. 대신 광원이 여러 개여도 색 번짐은 없음.',
    '"레이 최대 단계"를 8로 낮추면 먼 광원까지 레이가 닿지 못해 그림자가 아닌 곳이 어두워짐',
  ],
  refs: [
    { type: 'paper', title: 'Jump Flooding in GPU with Applications to Voronoi Diagram and Distance Transform (Guodong Rong, Tiow-Seng Tan)', year: 2006, note: 'I3D 2006. log₂N 패스로 근사 Voronoi와 거리 변환을 만드는 JFA 원 논문. JFA+1 같은 오차 보정도 다룸.' },
    { type: 'paper', title: 'Sphere Tracing: A Geometric Method for the Antialiased Ray Tracing of Implicit Surfaces (John C. Hart)', year: 1996, note: 'The Visual Computer 12(10). 거리만큼 건너뛰는 레이 진행.' },
    { type: 'article', title: 'Soft Shadows in Raymarched SDFs (Inigo Quilez)', url: 'https://iquilezles.org/articles/rmshadows/', note: 'min(k d / t)로 반그림자를 근사하는 방법' },
    { type: 'article', title: '2D Global Illumination in Godot (Sam Bigos)', year: 2021, note: 'JFA 거리장 + 레이 수집 2D GI를 게임용으로 구현한 글과 데모' },
  ],
  params: [
    { key: 'method', label: '조명 방식', type: 'select', group: '조명', options: [
      { value: 0, label: '하드 섀도 (광원마다 레이 1개)' },
      { value: 1, label: '소프트 섀도 (min(k d / t) 근사)' },
      { value: 2, label: '전역 조명 (모든 방향 레이 수집)' },
    ], a: 0, b: 2 },
    { key: 'rays', label: '레이 수/픽셀', type: 'int', min: 4, max: 64, default: 24, when: (p) => p.method === 2 },
    { key: 'accum', label: '시간 누적', type: 'range', min: 0, max: 0.95, step: 0.05, default: 0.8, help: '이전 프레임 결과를 남기는 비율', when: (p) => p.method === 2 },
    { key: 'softK', label: '반그림자 계수 k', type: 'range', min: 2, max: 32, step: 1, default: 8, help: '작을수록 반그림자가 넓음', when: (p) => p.method === 1 },
    { key: 'steps', label: '레이 최대 단계', type: 'int', min: 8, max: 128, default: 64 },
    { key: 'jfaPasses', label: 'JFA 패스 수', type: 'int', min: 1, max: 10, default: 10, group: '거리장', help: '첫 보폭 = 2^(패스 수 - 1)' },
    { key: 'view', label: '보기', type: 'select', options: [
      { value: 0, label: '최종' },
      { value: 1, label: 'Voronoi (가장 가까운 씨앗)' },
      { value: 2, label: '거리장 (8px 등고선)' },
      { value: 3, label: '조명 버퍼만' },
    ], default: 0 },
    { key: 'res', label: '조명 해상도 (세로 px)', type: 'select', group: '장면', options: [
      { value: 128, label: '128' }, { value: 192, label: '192' }, { value: 256, label: '256' },
    ], default: 192, shared: true },
    { key: 'intensity', label: '밝기', type: 'range', min: 0.2, max: 4, step: 0.1, default: 1.2, shared: true },
    { key: 'animate', label: '광원 움직임', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: '2D Global Illumination (Jump Flood Distance Field + Ray Marching)',
    summary: 'Jump Flooding (JFA) builds the "distance to the nearest wall" for the whole screen in only log₂N passes. On this distance field, rays advance in big steps. You can draw a hard shadow for each light, or cast rays in all directions to get soft shadows from area lights and color bleeding.',
    views: { a: 'Point light hard shadows', b: 'Ray-gathered global illumination' },
    controls: 'Mouse: move the orange light',
    info: `
    <p>The costly part of 2D lighting is the ray query: "If I go from this pixel in that direction, what do I hit?" Stepping one pixel at a time means reading the texture as many times as the screen is wide.</p>
    <p>With a <b>distance field</b>, you can safely jump ahead by d, the distance from the current spot to the nearest wall. This is sphere tracing. In empty space the steps are large, so it ends within a few dozen steps.</p>
    <p><b>Jump Flooding</b> (Rong & Tan 2006) is a fast way to build a distance field on the GPU.</p>
    <ol>
    <li>Write each wall pixel's own coordinates as its seed.</li>
    <li>Repeat passes with step size k = N/2, N/4, ..., 1. Each pixel takes the nearest seed among its 8 neighbors at distance k.</li>
    <li>After log₂N passes, every pixel knows its (almost) nearest seed. Distance = |pixel - seed|.</li>
    </ol>
    <p>There are three lighting methods.</p>
    <ul>
    <li><b>Hard shadow</b>: one ray toward the light center. 0 if blocked, 1 if not.</li>
    <li><b>Soft shadow</b>: on the same ray, track <code>min(k d / t)</code>. It approximates the penumbra from how closely the ray grazes a wall (Quilez method).</li>
    <li><b>Global illumination</b>: R rays in all directions. Average the emissive color of the pixels they hit. Penumbras that match the area light size and mixing of light colors appear on their own. Few rays cause noise, so the angles are jittered each frame and averaged over time.</li>
    </ul>
    <p>Hard parts (why this is level 4):</p>
    <ul>
    <li>With too few JFA passes, areas no seed reaches get an infinite distance. Rays skip over walls and light leaks through.</li>
    <li>To store coordinates in 8-bit channels, you must split them across 16 bits. If you lose precision, the distance field gets distorted in steps.</li>
    <li>Temporal accumulation removes noise, but moving lights leave trails. In an 8-bit buffer, the accumulated value gets stuck on rounding and shows banding.</li>
    </ul>`,
    look: [
      'Compare A and B. In A, shadow edges are razor sharp. In B, penumbras match the light size and colors bleed in through gaps in the walls.',
      'Lower "JFA passes" to 4 or less. Seeds do not reach areas far from walls. Light leaks through walls. Set "View" to "Voronoi" and the empty areas look black.',
      'In B, lower "Rays/pixel" to 4 and "Temporal accumulation" to 0. The screen flickers. Raise accumulation to 0.9 and it gets smooth, but moving the mouse light leaves trails.',
      'Set A to "Soft shadow". You get penumbras even with one ray. But there is no color bleeding, even with several lights.',
      'Lower "Max ray steps" to 8. Rays cannot reach distant lights, so unshadowed areas get dark.',
    ],
    refs: [
      'I3D 2006. The original JFA paper that builds an approximate Voronoi diagram and distance transform in log₂N passes. It also covers error fixes like JFA+1.',
      'The Visual Computer 12(10). Ray marching that jumps ahead by the distance.',
      'How to approximate penumbras with min(k d / t).',
      'An article and demo that build 2D GI with a JFA distance field and ray gathering for games.',
    ],
    params: {
      method: { label: 'Lighting method', group: 'Lighting', options: { 0: 'Hard shadow (1 ray per light)', 1: 'Soft shadow (min(k d / t) approx.)', 2: 'Global illumination (gather rays in all directions)' } },
      rays: 'Rays/pixel',
      accum: { label: 'Temporal accumulation', help: 'How much of the previous frame to keep' },
      softK: { label: 'Penumbra factor k', help: 'Smaller means wider penumbras' },
      steps: 'Max ray steps',
      jfaPasses: { label: 'JFA passes', group: 'Distance field', help: 'First step size = 2^(passes - 1)' },
      view: { label: 'View', options: { 0: 'Final', 1: 'Voronoi (nearest seed)', 2: 'Distance field (8px contours)', 3: 'Light buffer only' } },
      res: { label: 'Light resolution (height px)', group: 'Scene' },
      intensity: 'Brightness',
      animate: 'Light motion',
    },
  },

  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, P = ctx.params;
    const floatExt = gl.getExtension('EXT_color_buffer_float');
    const VS = `#version 300 es
in vec2 a_pos; out vec2 v_uv;
void main(){ v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`;
    const HEAD = `#version 300 es
precision highp float; precision highp int;
in vec2 v_uv; out vec4 o;
vec4 enc(vec2 p){ vec2 hi = floor(p / 256.0); vec2 lo = p - hi * 256.0; return vec4(hi.x, lo.x, hi.y, lo.y) / 255.0; }
vec2 dec(vec4 v){ v = floor(v * 255.0 + 0.5); return vec2(v.x * 256.0 + v.y, v.z * 256.0 + v.w); }
`;
    // geometry in normalized units: y 0..1, x 0..aspect
    const SCENE_FS = HEAD + `
uniform vec2 u_res; uniform vec4 u_box[8]; uniform vec4 u_bar; uniform float u_barAng;
uniform vec4 u_light[3]; uniform vec3 u_lcol[3];
void main(){
  vec2 q = gl_FragCoord.xy / u_res.y;
  vec4 c = vec4(0.0);
  for (int i = 0; i < 8; i++) {
    vec4 b = u_box[i];
    vec2 d = abs(q - b.xy) - b.zw;
    if (max(d.x, d.y) < 0.0) c = vec4(0.0, 0.0, 0.0, 1.0);
  }
  vec2 r = q - u_bar.xy;
  float cs = cos(u_barAng), sn = sin(u_barAng);
  r = vec2(cs * r.x + sn * r.y, -sn * r.x + cs * r.y);
  vec2 bd = abs(r) - u_bar.zw;
  if (max(bd.x, bd.y) < 0.0) c = vec4(0.0, 0.0, 0.0, 1.0);
  for (int i = 0; i < 3; i++) {
    if (length(q - u_light[i].xy) < u_light[i].z) c = vec4(u_lcol[i], 1.0);
  }
  o = c;
}`;
    const SEED_FS = HEAD + `
uniform sampler2D u_scene;
void main(){
  ivec2 ip = ivec2(gl_FragCoord.xy);
  float a = texelFetch(u_scene, ip, 0).a;
  o = a > 0.5 ? enc(vec2(ip)) : vec4(1.0);
}`;
    const JFA_FS = HEAD + `
uniform sampler2D u_src; uniform int u_step; uniform ivec2 u_size;
void main(){
  ivec2 ip = ivec2(gl_FragCoord.xy);
  vec2 p = vec2(ip);
  float best = 1e20;
  vec4 bestV = vec4(1.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      ivec2 qn = ip + ivec2(x, y) * u_step;
      if (qn.x < 0 || qn.y < 0 || qn.x >= u_size.x || qn.y >= u_size.y) continue;
      vec4 v = texelFetch(u_src, qn, 0);
      vec2 s = dec(v);
      if (s.x > 60000.0) continue;
      float d = dot(s - p, s - p);
      if (d < best) { best = d; bestV = v; }
    }
  }
  o = bestV;
}`;
    const LIGHT_FS = HEAD + `
uniform sampler2D u_jfa; uniform sampler2D u_scene; uniform sampler2D u_prev;
uniform ivec2 u_size; uniform int u_method; uniform int u_rays; uniform int u_steps;
uniform vec4 u_light[3]; uniform vec3 u_lcol[3];
uniform float u_k; uniform float u_int; uniform float u_frame; uniform float u_blend;
float dist(vec2 p){
  ivec2 ip = ivec2(clamp(p, vec2(0.0), vec2(u_size) - 1.0));
  vec2 s = dec(texelFetch(u_jfa, ip, 0));
  if (s.x > 60000.0) return 1e4;
  return length(s - vec2(ip));
}
bool outside(vec2 p){ return p.x < 0.0 || p.y < 0.0 || p.x >= float(u_size.x) || p.y >= float(u_size.y); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 direct(vec2 p){
  vec3 sum = vec3(0.0);
  float H = float(u_size.y);
  for (int i = 0; i < 3; i++) {
    vec2 lp = u_light[i].xy * H;
    float lr = u_light[i].z * H;
    vec2 to = lp - p;
    float len = length(to);
    vec2 dir = to / max(len, 1e-4);
    float tEnd = len - lr - 1.0;
    float t = 1.0, vis = 1.0;
    for (int s = 0; s < 128; s++) {
      if (s >= u_steps || t >= tEnd) break;
      float d = dist(p + dir * t);
      if (d < 0.5) { vis = 0.0; break; }
      // ignore the light itself when estimating the penumbra
      if (u_method == 1 && d < tEnd - t - 1.0) vis = min(vis, u_k * d / t);
      t += max(d, 1.0);
    }
    if (t < tEnd) vis = 0.0;
    float fall = 1.0 / (1.0 + (len * len) / (0.09 * H * H));
    sum += u_lcol[i] * clamp(vis, 0.0, 1.0) * fall;
  }
  return sum;
}
vec3 gather(vec2 p){
  vec3 sum = vec3(0.0);
  float jit = fract(hash(p) + u_frame * 0.618034);
  for (int r = 0; r < 64; r++) {
    if (r >= u_rays) break;
    float a = (float(r) + jit) / float(u_rays) * 6.2831853;
    vec2 dir = vec2(cos(a), sin(a));
    float t = 0.0;
    for (int s = 0; s < 128; s++) {
      if (s >= u_steps) break;
      vec2 qp = p + dir * t;
      if (outside(qp)) break;
      float d = dist(qp);
      if (d < 0.5) { sum += texelFetch(u_scene, ivec2(qp), 0).rgb; break; }
      t += max(d, 1.0);
    }
  }
  return sum / float(u_rays) * 6.0;
}
void main(){
  vec2 p = floor(gl_FragCoord.xy);
  vec4 sc = texelFetch(u_scene, ivec2(p), 0);
  vec3 c;
  if (sc.a > 0.5) c = sc.rgb * 2.0;
  else c = u_method == 2 ? gather(p) : direct(p);
  c *= u_int;
  vec3 prev = texelFetch(u_prev, ivec2(p), 0).rgb;
  o = vec4(mix(prev, c, u_blend), 1.0);
}`;
    const COMP_FS = HEAD + `
uniform sampler2D u_light; uniform sampler2D u_hi; uniform sampler2D u_jfa;
uniform ivec2 u_size; uniform vec2 u_res; uniform int u_view; uniform float u_hdr;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec4 sc = texture(u_hi, v_uv);
  vec3 L = texture(u_light, v_uv).rgb / u_hdr;
  ivec2 ip = ivec2(v_uv * vec2(u_size));
  vec2 s = dec(texelFetch(u_jfa, ip, 0));
  bool none = s.x > 60000.0;
  if (u_view == 1) {
    vec3 vc = none ? vec3(0.0) : vec3(hash(s), hash(s + 7.1), hash(s + 3.3)) * 0.8 + 0.1;
    if (sc.a > 0.5) vc = vec3(1.0);
    o = vec4(vc, 1.0); return;
  }
  if (u_view == 2) {
    float d = none ? 1e4 : length(s - vec2(ip));
    float band = fract(d / 8.0);
    vec3 dc = none ? vec3(0.6, 0.0, 0.0) : mix(vec3(0.1, 0.2, 0.4), vec3(0.9, 0.95, 1.0), smoothstep(0.0, 0.1, band) * (1.0 - smoothstep(0.1, 0.2, band)) * 0.6 + clamp(d / 80.0, 0.0, 0.4));
    if (sc.a > 0.5) dc = vec3(1.0);
    o = vec4(dc, 1.0); return;
  }
  vec3 c;
  if (u_view == 3) c = L;
  else if (sc.a > 0.5) c = dot(sc.rgb, vec3(1.0)) > 0.0 ? sc.rgb * 2.0 : vec3(0.05, 0.055, 0.07) + L * 0.05;
  else {
    vec2 px = v_uv * u_res;
    float tile = mod(floor(px.x / 24.0) + floor(px.y / 24.0), 2.0);
    vec3 alb = mix(vec3(0.55), vec3(0.68), tile);
    c = alb * L + vec3(0.004);
  }
  c = 1.0 - exp(-c * 1.5);
  o = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;
    const mk = (fs) => U.gl.program(gl, VS, fs);
    const progScene = mk(SCENE_FS), progSeed = mk(SEED_FS), progJfa = mk(JFA_FS), progLight = mk(LIGHT_FS), progComp = mk(COMP_FS);
    const quad = U.gl.quad(gl);

    // scene: 7 boxes + 1 rotating bar (same seed in both views). x is a fraction of the view width
    const rng = ctx.rng;
    const boxDef = [[0.22, 0.3, 0.025, 0.16], [0.56, 0.75, 0.14, 0.022], [0.78, 0.32, 0.03, 0.12], [0.34, 0.78, 0.025, 0.1]];
    while (boxDef.length < 7) boxDef.push([rng.range(0.1, 0.9), rng.range(0.12, 0.88), rng.range(0.012, 0.05), rng.range(0.012, 0.05)]);
    boxDef.push([-9, -9, 0, 0]);
    const boxes = new Float32Array(32);
    const LCOL = [[1.0, 0.55, 0.15], [0.2, 0.7, 1.0], [1.0, 0.25, 0.7]];
    const lcol = new Float32Array(9); LCOL.forEach((c, i) => lcol.set(c, i * 3));
    const lights = new Float32Array(12);
    let t = 0, frame = 0;
    let sceneLo = null, sceneHi = null, jfaA = null, jfaB = null, lightA = null, lightB = null, sw = 0, shh = 0;
    const HDR = floatExt ? 1 : 1 / 4; // RGBA8 fallback stores light scaled down
    let jfaOut = null, jfaRun = 0;

    function ensure() {
      const H = Number(P.res), asp = ctx.width / Math.max(1, ctx.height);
      const W = Math.max(16, Math.round(H * asp));
      if (W !== sw || H !== shh) {
        for (const f of [sceneLo, jfaA, jfaB, lightA, lightB]) if (f) f.dispose();
        sw = W; shh = H;
        sceneLo = U.gl.framebuffer(gl, W, H, { filter: 'nearest' });
        jfaA = U.gl.framebuffer(gl, W, H, { filter: 'nearest' });
        jfaB = U.gl.framebuffer(gl, W, H, { filter: 'nearest' });
        lightA = U.gl.framebuffer(gl, W, H, { filter: 'linear', float: !!floatExt });
        lightB = U.gl.framebuffer(gl, W, H, { filter: 'linear', float: !!floatExt });
        for (const f of [lightA, lightB]) { f.bind(); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
      }
      if (!sceneHi || sceneHi.width !== ctx.pixelWidth || sceneHi.height !== ctx.pixelHeight) {
        if (sceneHi) sceneHi.dispose();
        sceneHi = U.gl.framebuffer(gl, ctx.pixelWidth, ctx.pixelHeight, { filter: 'linear' });
      }
    }
    function setSceneUniforms(res) {
      progScene.use();
      gl.uniform2f(progScene.u('u_res'), res[0], res[1]);
      const asp = ctx.width / Math.max(1, ctx.height);
      boxDef.forEach((b, i) => boxes.set([b[0] * asp, b[1], b[2], b[3]], i * 4));
      gl.uniform4fv(progScene.u('u_box'), boxes);
      gl.uniform4f(progScene.u('u_bar'), asp * 0.55, 0.42, 0.13, 0.014);
      gl.uniform1f(progScene.u('u_barAng'), t * 0.35);
      gl.uniform4fv(progScene.u('u_light'), lights);
      gl.uniform3fv(progScene.u('u_lcol'), lcol);
    }
    const tex = (unit, prog, name, t2) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t2); gl.uniform1i(prog.u(name), unit); };

    return {
      update(dt) {
        if (P.animate) t += dt;
        frame++;
      },
      render() {
        ensure();
        const asp = ctx.width / Math.max(1, ctx.height);
        const m = ctx.input.mouse;
        // light 0: mouse or orbit, lights 1, 2: orbit
        const l0 = m.inside ? [m.x / ctx.height, 1 - m.y / ctx.height] : [asp * 0.5 + Math.cos(t * 0.4) * asp * 0.3, 0.5 + Math.sin(t * 0.55) * 0.3];
        lights.set([l0[0], l0[1], 0.035, 0], 0);
        lights.set([asp * 0.2 + Math.sin(t * 0.3) * 0.05, 0.75 + Math.cos(t * 0.3) * 0.08, 0.05, 0], 4);
        lights.set([asp * 0.82 + Math.cos(t * 0.25) * 0.06, 0.2 + Math.sin(t * 0.35) * 0.05, 0.03, 0], 8);
        gl.disable(gl.BLEND);

        // 1) scene at light resolution and at screen resolution
        sceneLo.bind(); setSceneUniforms([sw, shh]); quad.draw(progScene);
        sceneHi.bind(); setSceneUniforms([ctx.pixelWidth, ctx.pixelHeight]); quad.draw(progScene);

        // 2) seed + jump flood
        jfaA.bind(); progSeed.use(); tex(0, progSeed, 'u_scene', sceneLo.tex); quad.draw(progSeed);
        let src = jfaA, dst = jfaB;
        jfaRun = 0;
        progJfa.use();
        gl.uniform2i(progJfa.u('u_size'), sw, shh);
        for (let k = P.jfaPasses - 1; k >= 0; k--) {
          dst.bind();
          tex(0, progJfa, 'u_src', src.tex);
          gl.uniform1i(progJfa.u('u_step'), 1 << k);
          quad.draw(progJfa);
          jfaRun++;
          const tmp = src; src = dst; dst = tmp;
        }
        jfaOut = src;

        // 3) lighting (ping-pong for temporal accumulation)
        const prev = lightA, cur = lightB;
        cur.bind();
        progLight.use();
        tex(0, progLight, 'u_jfa', jfaOut.tex);
        tex(1, progLight, 'u_scene', sceneLo.tex);
        tex(2, progLight, 'u_prev', prev.tex);
        gl.uniform2i(progLight.u('u_size'), sw, shh);
        gl.uniform1i(progLight.u('u_method'), P.method);
        gl.uniform1i(progLight.u('u_rays'), P.rays);
        gl.uniform1i(progLight.u('u_steps'), P.steps);
        gl.uniform4fv(progLight.u('u_light'), lights);
        gl.uniform3fv(progLight.u('u_lcol'), lcol);
        gl.uniform1f(progLight.u('u_k'), P.softK);
        gl.uniform1f(progLight.u('u_int'), P.intensity * HDR);
        gl.uniform1f(progLight.u('u_frame'), frame % 1000);
        gl.uniform1f(progLight.u('u_blend'), P.method === 2 ? 1 - P.accum : 1);
        quad.draw(progLight);
        lightA = cur; lightB = prev;

        // 4) composite
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        progComp.use();
        tex(0, progComp, 'u_light', cur.tex);
        tex(1, progComp, 'u_hi', sceneHi.tex);
        tex(2, progComp, 'u_jfa', jfaOut.tex);
        gl.uniform2i(progComp.u('u_size'), sw, shh);
        gl.uniform2f(progComp.u('u_res'), ctx.pixelWidth, ctx.pixelHeight);
        gl.uniform1i(progComp.u('u_view'), P.view);
        gl.uniform1f(progComp.u('u_hdr'), HDR);
        quad.draw(progComp);
        gl.activeTexture(gl.TEXTURE0);

        const need = Math.ceil(Math.log2(Math.max(sw, shh)));
        const rays = P.method === 2 ? P.rays : 3;
        ctx.stat(GTL.L('조명 해상도', 'Light resolution'), `${sw}×${shh}`);
        ctx.stat(GTL.L('JFA 패스 / 필요', 'JFA passes / needed'), `${jfaRun} / ${need}` + (jfaRun < need ? GTL.L(' (부족, 빛 샘 위험)', ' (too few, light may leak)') : ''));
        ctx.stat(GTL.L('레이/픽셀', 'Rays/pixel'), rays + (P.method === 2 ? '' : GTL.L(' (광원 수)', ' (light count)')));
        ctx.stat(GTL.L('최대 거리장 읽기/프레임', 'Max distance field reads/frame'), `${((sw * shh * rays * P.steps) / 1e6).toFixed(1)} M`);
        ctx.stat(GTL.L('조명 버퍼', 'Light buffer'), floatExt ? 'RGBA16F' : GTL.L('RGBA8 (EXT_color_buffer_float 미지원, 1/4 스케일)', 'RGBA8 (no EXT_color_buffer_float, 1/4 scale)'));
      },
    };
  },
});
