// 블룸: 밝은 영역 추출 → 다운샘플 체인 → 업샘플 누적 (Jimenez 2014 방식) vs 단일 가우시안
GTL.register({
  id: 'bloom-mip-chain',
  title: '블룸 (Threshold + 다운샘플 체인)',
  summary: 'HDR 장면에서 임계값을 넘는 빛만 뽑아 해상도를 점점 줄였다가, 다시 키우며 더함. 적은 비용으로 넓고 자연스러운 빛 번짐을 얻음. 한 해상도의 블러로는 넓은 번짐이 불가능함.',
  renderer: 'webgl2',
  views: { a: '단일 가우시안 (반해상도)', b: '다운샘플 체인 6단' },
  info: `
    <p>블룸(Bloom)은 렌즈나 눈 안에서 강한 빛이 퍼지는 현상을 흉내 내는 효과. 파이프라인은 다음과 같음.</p>
    <ol>
    <li><b>HDR 렌더</b>: 1.0을 넘는 값을 저장하는 부동소수점 렌더 타겟 (여기서는 RGBA16F).</li>
    <li><b>Bright pass</b>: <code>max(밝기 − threshold, 0)</code>을 soft knee로 부드럽게 추출.</li>
    <li><b>다운샘플 체인</b>: ½, ¼, ⅛ … 해상도로 반복 축소. 각 단계의 작은 블러는 원래 해상도에서 2배씩 넓은 블러가 됨.
    13-tap 필터(Jimenez, CoD:AW)는 단순 2×2 평균보다 깜빡임(Firefly)과 블록 아티팩트가 적음.</li>
    <li><b>업샘플 + 누적</b>: 작은 단계부터 3×3 텐트 필터로 키우며 위 단계에 더함.</li>
    <li><b>합성</b>: 원본 + 블룸 × 강도 → 톤 매핑(ACES 근사) → sRGB.</li>
    </ol>
    <p>풀 해상도나 반해상도에서 가우시안 한 번으로 같은 반경을 얻으려면, 탭 수가 반경에 비례해 커짐. 체인은 단계마다 탭 수가 고정이라 비용이 로그로 늘어남.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="4" y="14" class="t-a">${L('A: 반해상도에서 가우시안 한 번', 'A: one Gaussian at half res')}</text>
    <rect x="20" y="24" width="70" height="34" rx="3" class="f-dim"/><text x="55" y="45" text-anchor="middle">HDR</text>
    <path d="M90,41 L118,41" class="d-accent" marker-end="url(#arr)"/>
    <rect x="120" y="24" width="90" height="34" rx="3" class="f-dim"/><text x="165" y="45" text-anchor="middle">Bright 1/2</text>
    <path d="M210,41 L238,41" class="d-accent" marker-end="url(#arr)"/>
    <rect x="240" y="24" width="100" height="34" rx="3" class="f-dim"/><text x="290" y="45" text-anchor="middle" class="t-a">${L('9탭 x 2 패스', '9 taps x 2')}</text>
    <path d="M340,41 L368,41" class="d-accent" marker-end="url(#arr)"/>
    <rect x="370" y="24" width="70" height="34" rx="3" class="f-dim"/><text x="405" y="45" text-anchor="middle">${L('합성', 'Composite')}</text>
    <text x="20" y="74" class="t-small t-dim">${L('번짐을 넓히려면 탭 수가 반경만큼 늘어남', 'A wider glow needs more taps, in proportion to the radius')}</text>
    <text x="4" y="98" class="t-b">${L('B: 다운샘플 체인 + 업샘플 누적', 'B: downsample chain + upsample add')}</text>
    <rect x="20" y="108" width="80" height="50" class="f-b" opacity="0.35"/><text x="60" y="137" text-anchor="middle" class="t-small t-mono">1/2</text>
    <rect x="130" y="108" width="60" height="38" class="f-b" opacity="0.45"/><text x="160" y="131" text-anchor="middle" class="t-small t-mono">1/4</text>
    <rect x="220" y="108" width="45" height="28" class="f-b" opacity="0.55"/><text x="242" y="126" text-anchor="middle" class="t-small t-mono">1/8</text>
    <rect x="295" y="108" width="34" height="21" class="f-b" opacity="0.65"/><text x="312" y="122" text-anchor="middle" class="t-small t-mono">1/16</text>
    <rect x="359" y="108" width="26" height="16" class="f-b" opacity="0.8"/>
    <path d="M100,114 L128,114" class="d-b" marker-end="url(#arr)"/><path d="M190,114 L218,114" class="d-b" marker-end="url(#arr)"/>
    <path d="M265,114 L293,114" class="d-b" marker-end="url(#arr)"/><path d="M329,114 L357,114" class="d-b" marker-end="url(#arr)"/>
    <path d="M372,126 Q350,172 312,131" class="d-accent" stroke-dasharray="3 3" marker-end="url(#arr)"/>
    <path d="M312,131 Q280,176 242,138" class="d-accent" stroke-dasharray="3 3" marker-end="url(#arr)"/>
    <path d="M242,138 Q200,182 160,148" class="d-accent" stroke-dasharray="3 3" marker-end="url(#arr)"/>
    <path d="M160,148 Q110,190 60,160" class="d-accent" stroke-dasharray="3 3" marker-end="url(#arr)"/>
    <text x="400" y="114" class="t-small">${L('파란 화살표: 13탭 축소', 'Blue: 13-tap downsample')}</text>
    <text x="400" y="130" class="t-small">${L('점선: 텐트 확대 + 더함', 'Dashed: tent up + add')}</text>
    <text x="400" y="152" class="t-small t-dim">${L('단계마다 탭 수 고정', 'Fixed taps per step')}</text>
    <text x="400" y="166" class="t-small t-dim">${L('번짐 반경은 단계마다 2배', 'Radius x2 per step')}</text>
  </svg>`,
  look: [
    'A와 B의 광원 주변을 비교하면 A는 번짐이 얇게만 붙고, B는 네온과 가로등 주변이 넓고 부드럽게 번짐.',
    'B의 "단계 수"를 1→8로 올리면 번짐 반경이 지수적으로 넓어짐.',
    'B의 다운샘플 필터를 "2×2 박스"로 바꾸면 움직이는 구슬의 블룸이 깜빡이고 각짐. 13-tap은 안정적임.',
    '"디버그 보기"를 바꾸면 bright pass 결과나 블룸 버퍼만 보임. Threshold를 0으로 내리면 화면 전체가 뿌옇게 됨(나쁜 예).',
  ],
  refs: [
    { type: 'talk', title: 'Next Generation Post Processing in Call of Duty: Advanced Warfare (Jorge Jimenez)', year: 2014, note: 'SIGGRAPH Advances in Real-Time Rendering. 13-tap 다운샘플 + 텐트 업샘플 블룸.' },
    { type: 'talk', title: 'Frame Buffer Postprocessing Effects in DOUBLE-S.T.E.A.L (Wreckless) (Masaki Kawase)', year: 2003, note: 'GDC 2003. 다단 축소 블룸과 Kawase 블러.' },
    { type: 'talk', title: 'Bandwidth-Efficient Rendering (Marius Bjørge)', year: 2015, note: 'SIGGRAPH 2015. Dual filter(다운/업샘플 블러)로 모바일 블룸 비용을 줄임.' },
    { type: 'engine', title: 'Unreal Engine: Bloom (Standard / Convolution)', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/bloom-in-unreal-engine' },
  ],
  params: [
    { key: 'method', label: '블룸 방식', type: 'select', group: '블룸', options: [
      { value: 'none', label: '끔' },
      { value: 'single', label: '단일 가우시안 (반해상도, 9탭×2)' },
      { value: 'chain', label: '다운샘플 체인 + 업샘플 누적' },
    ], a: 'single', b: 'chain' },
    { key: 'levels', label: '단계 수', type: 'int', min: 1, max: 8, default: 6, when: (p) => p.method === 'chain' },
    { key: 'downFilter', label: '다운샘플 필터', type: 'select', options: [
      { value: 'box', label: '2×2 박스 (bilinear 1탭)' },
      { value: 'jimenez', label: '13-tap (Jimenez)' },
    ], default: 'jimenez', when: (p) => p.method === 'chain' },
    { key: 'blurR', label: '가우시안 간격', type: 'range', min: 0.5, max: 4, step: 0.1, default: 1.5, when: (p) => p.method === 'single' },
    { key: 'threshold', label: 'Threshold', type: 'range', min: 0, max: 4, step: 0.01, default: 1 },
    { key: 'knee', label: 'Soft knee', type: 'range', min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: 'intensity', label: '강도', type: 'range', min: 0, max: 3, step: 0.01, default: 1 },
    { key: 'exposure', label: '노출 (EV)', type: 'range', min: -3, max: 3, step: 0.1, default: 0, shared: true, group: '장면' },
    { key: 'debug', label: '디버그 보기', type: 'select', options: [
      { value: 'final', label: '최종' },
      { value: 'bright', label: 'Bright pass' },
      { value: 'bloom', label: '블룸 버퍼만' },
    ], default: 'final' },
    { key: 'animate', label: '움직임', type: 'bool', default: true, shared: true },
  ],

  en: {
    title: 'Bloom (Threshold + Downsample Chain)',
    summary: 'Take only the light above a threshold from the HDR scene. Shrink it step by step, then grow it back and add the steps together. This gives a wide, natural glow at low cost. A blur at a single resolution cannot make a wide glow.',
    views: { a: 'Single Gaussian (half res)', b: '6-step downsample chain' },
    info: `
    <p>Bloom imitates strong light that spreads inside a lens or the eye. The pipeline works like this.</p>
    <ol>
    <li><b>HDR render</b>: a floating point render target that stores values above 1.0 (here RGBA16F).</li>
    <li><b>Bright pass</b>: extract <code>max(brightness - threshold, 0)</code> smoothly with a soft knee.</li>
    <li><b>Downsample chain</b>: shrink again and again to 1/2, 1/4, 1/8 ... resolution. A small blur at each step becomes a blur twice as wide at full resolution.
    The 13-tap filter (Jimenez, CoD:AW) has less flicker (fireflies) and fewer block artifacts than a plain 2x2 average.</li>
    <li><b>Upsample + accumulate</b>: start from the smallest step, grow it with a 3x3 tent filter, and add it to the step above.</li>
    <li><b>Composite</b>: original + bloom x intensity, then tone mapping (ACES fit), then sRGB.</li>
    </ol>
    <p>To get the same radius with one Gaussian at full or half resolution, the tap count grows with the radius. The chain uses a fixed tap count per step, so the cost grows only logarithmically.</p>`,
    look: [
    'Compare the area around the lights in A and B. A has only a thin glow. In B the neon and street lights glow wide and soft.',
    'Raise B\'s "Steps" from 1 to 8. The glow radius grows exponentially.',
    'Set B\'s downsample filter to "2x2 box". The bloom on the moving orbs flickers and looks blocky. 13-tap stays stable.',
    'Change "Debug view" to see only the bright pass result or the bloom buffer. Lower Threshold to 0 and the whole screen turns hazy (a bad example).',
    ],
    refs: [
    'SIGGRAPH Advances in Real-Time Rendering. Bloom with a 13-tap downsample and tent upsample.',
    'GDC 2003. Multi-step downscale bloom and the Kawase blur.',
    'SIGGRAPH 2015. The dual filter (downsample/upsample blur) cuts bloom cost on mobile.',
    null,
    ],
    params: {
      method: { label: 'Bloom method', group: 'Bloom', options: { none: 'Off', single: 'Single Gaussian (half res, 9 taps x 2)', chain: 'Downsample chain + upsample accumulate' } },
      levels: 'Steps',
      downFilter: { label: 'Downsample filter', options: { box: '2x2 box (1 bilinear tap)' } },
      blurR: 'Gaussian spacing',
      intensity: 'Intensity',
      exposure: { label: 'Exposure (EV)', group: 'Scene' },
      debug: { label: 'Debug view', options: { final: 'Final', bloom: 'Bloom buffer only' } },
      animate: 'Motion',
    },
  },

  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, P = ctx.params;
    const floatExt = gl.getExtension('EXT_color_buffer_float');
    const HDR_SCALE = floatExt ? 1 : 1 / 16; // 8비트 폴백: 값을 축소 저장

    const VS = `#version 300 es
in vec2 a_pos; out vec2 v_uv;
void main(){ v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`;
    const HEAD = `#version 300 es
precision highp float;
in vec2 v_uv; out vec4 o;
`;
    const sceneFs = HEAD + `
uniform vec2 u_res; uniform float u_time; uniform float u_scale;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float fall(float r, float d){ return 1.0 - smoothstep(0.0, r, d); }
float seg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
void main(){
  vec2 p = v_uv * u_res;
  float asp = u_res.x / u_res.y;
  vec2 q = vec2(v_uv.x * asp, v_uv.y);
  float px = 1.0 / u_res.y;
  vec3 col = mix(vec3(0.012, 0.01, 0.03), vec3(0.06, 0.03, 0.09), q.y);
  vec2 cell = floor(p / 7.0);
  float h = hash(cell);
  if (h > 0.985 && q.y > 0.5) col += vec3(3.0) * fall(1.3, length(p - (cell + 0.5) * 7.0));
  float bx = floor(q.x * 9.0);
  float bh = 0.18 + 0.32 * hash(vec2(bx, 3.0));
  if (q.y < bh) {
    col = vec3(0.012, 0.012, 0.02);
    vec2 wc = floor(vec2(q.x * 54.0, q.y * 36.0));
    vec2 wf = fract(vec2(q.x * 54.0, q.y * 36.0));
    if (wf.x > 0.25 && wf.x < 0.75 && wf.y > 0.3 && wf.y < 0.7 && hash(wc) > 0.72 && fract(q.x * 9.0) > 0.08 && fract(q.x * 9.0) < 0.92)
      col = vec3(1.5, 1.1, 0.55) * (0.6 + 0.8 * hash(wc + 1.7));
  }
  vec2 rc = vec2(asp * 0.5, 0.66);
  float rd = abs(length(q - rc) - 0.12);
  col += vec3(0.25, 0.65, 1.0) * 7.0 * fall(2.5 * px, rd);
  float sd = seg(q, vec2(asp * 0.12, 0.82), vec2(asp * 0.36, 0.82));
  col += vec3(1.0, 0.2, 0.6) * 6.0 * fall(3.0 * px, sd);
  float sd2 = seg(q, vec2(asp * 0.7, 0.88), vec2(asp * 0.9, 0.78));
  col += vec3(0.3, 1.0, 0.4) * 5.0 * fall(2.0 * px, sd2);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 lc = vec2(asp * (0.1 + fi * 0.2), 0.1);
    col += vec3(1.0, 0.75, 0.4) * 40.0 * fall(3.0 * px, length(q - lc));
  }
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 oc = vec2(asp * (0.15 + 0.7 * fract(u_time * (0.04 + fi * 0.013) + fi * 0.27)), 0.32 + 0.12 * sin(u_time * (0.7 + fi * 0.2) + fi));
    col += vec3(1.0, 0.4 + fi * 0.15, 0.25 + fi * 0.2) * 60.0 * fall(1.6 * px, length(q - oc));
  }
  o = vec4(col * u_scale, 1.0);
}`;
    const brightFs = HEAD + `
uniform sampler2D u_src; uniform float u_thr; uniform float u_knee; uniform float u_scale;
void main(){
  vec3 c = texture(u_src, v_uv).rgb / u_scale;
  float br = max(c.r, max(c.g, c.b));
  float k = u_thr * u_knee + 1e-4;
  float soft = clamp(br - u_thr + k, 0.0, 2.0 * k);
  soft = soft * soft / (4.0 * k);
  float w = max(soft, br - u_thr) / max(br, 1e-4);
  o = vec4(c * w * u_scale, 1.0);
}`;
    const downFs = HEAD + `
uniform sampler2D u_src; uniform vec2 u_texel; uniform float u_mode;
vec3 T(vec2 off){ return texture(u_src, v_uv + off * u_texel).rgb; }
void main(){
  if (u_mode < 0.5) { o = vec4(texture(u_src, v_uv).rgb, 1.0); return; }
  vec3 a = T(vec2(-2.0, 2.0)), b = T(vec2(0.0, 2.0)), c = T(vec2(2.0, 2.0));
  vec3 d = T(vec2(-2.0, 0.0)), e = T(vec2(0.0)), f = T(vec2(2.0, 0.0));
  vec3 g = T(vec2(-2.0, -2.0)), h = T(vec2(0.0, -2.0)), i = T(vec2(2.0, -2.0));
  vec3 j = T(vec2(-1.0, 1.0)), k = T(vec2(1.0, 1.0)), l = T(vec2(-1.0, -1.0)), m = T(vec2(1.0, -1.0));
  vec3 s = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
  o = vec4(s, 1.0);
}`;
    const upFs = HEAD + `
uniform sampler2D u_src; uniform vec2 u_texel;
void main(){
  vec4 d = vec4(u_texel, u_texel) * vec4(1.0, 1.0, -1.0, 0.0);
  vec3 s = texture(u_src, v_uv - d.xy).rgb;
  s += texture(u_src, v_uv - d.wy).rgb * 2.0;
  s += texture(u_src, v_uv - d.zy).rgb;
  s += texture(u_src, v_uv + d.zw).rgb * 2.0;
  s += texture(u_src, v_uv).rgb * 4.0;
  s += texture(u_src, v_uv + d.xw).rgb * 2.0;
  s += texture(u_src, v_uv + d.zy).rgb;
  s += texture(u_src, v_uv + d.wy).rgb * 2.0;
  s += texture(u_src, v_uv + d.xy).rgb;
  o = vec4(s / 16.0, 1.0);
}`;
    const gaussFs = HEAD + `
uniform sampler2D u_src; uniform vec2 u_dir;
void main(){
  float w[5];
  w[0] = 0.2270270270; w[1] = 0.1945945946; w[2] = 0.1216216216; w[3] = 0.0540540541; w[4] = 0.0162162162;
  vec3 s = texture(u_src, v_uv).rgb * w[0];
  for (int i = 1; i < 5; i++) {
    vec2 off = u_dir * float(i);
    s += texture(u_src, v_uv + off).rgb * w[i];
    s += texture(u_src, v_uv - off).rgb * w[i];
  }
  o = vec4(s, 1.0);
}`;
    const compFs = HEAD + `
uniform sampler2D u_scene; uniform sampler2D u_bloom; uniform float u_int; uniform float u_exp; uniform float u_scale; uniform float u_view;
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main(){
  vec3 sc = texture(u_scene, v_uv).rgb / u_scale;
  vec3 bl = texture(u_bloom, v_uv).rgb / u_scale;
  vec3 c = u_view < 0.5 ? sc + bl * u_int : bl * max(u_int, 0.25);
  c *= exp2(u_exp);
  c = aces(c);
  o = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;
    const mk = (fs) => U.gl.program(gl, VS, fs);
    const progScene = mk(sceneFs), progBright = mk(brightFs), progDown = mk(downFs), progUp = mk(upFs), progGauss = mk(gaussFs), progComp = mk(compFs);
    const quad = U.gl.quad(gl);

    let scene = null, chain = [], tmp = null, fw = 0, fh = 0, t = 0;
    const fbOpts = { float: !!floatExt };
    function rebuild() {
      fw = ctx.pixelWidth; fh = ctx.pixelHeight;
      if (scene) scene.dispose();
      for (const c of chain) c.dispose();
      if (tmp) tmp.dispose();
      scene = U.gl.framebuffer(gl, fw, fh, fbOpts);
      chain = [];
      let w = fw, h = fh;
      for (let i = 0; i < 8; i++) { w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); chain.push(U.gl.framebuffer(gl, w, h, fbOpts)); }
      tmp = U.gl.framebuffer(gl, chain[0].width, chain[0].height, fbOpts);
    }

    function pass(prog, target, tex, setU) {
      if (target) target.bind(); else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight); }
      prog.use();
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(prog.u('u_src'), 0);
      if (setU) setU(prog);
      quad.draw(prog);
    }

    return {
      update(dt) { if (P.animate) t += dt; },
      render() {
        if (!scene || fw !== ctx.pixelWidth || fh !== ctx.pixelHeight) rebuild();
        gl.disable(gl.BLEND);
        let passes = 0;
        // 1) HDR 장면
        scene.bind();
        progScene.use();
        gl.uniform2f(progScene.u('u_res'), fw, fh);
        gl.uniform1f(progScene.u('u_time'), t);
        gl.uniform1f(progScene.u('u_scale'), HDR_SCALE);
        quad.draw(progScene); passes++;

        // 2) bright pass → chain[0] (½ 해상도)
        pass(progBright, chain[0], scene.tex, (p) => {
          gl.uniform1f(p.u('u_thr'), P.threshold); gl.uniform1f(p.u('u_knee'), P.knee); gl.uniform1f(p.u('u_scale'), HDR_SCALE);
        }); passes++;
        let bloomTex = chain[0].tex, smallest = chain[0];

        if (P.debug !== 'bright') {
          if (P.method === 'chain') {
            const L = P.levels;
            for (let i = 1; i < L; i++) {
              const src = chain[i - 1];
              pass(progDown, chain[i], src.tex, (p) => { gl.uniform2f(p.u('u_texel'), 1 / src.width, 1 / src.height); gl.uniform1f(p.u('u_mode'), P.downFilter === 'jimenez' ? 1 : 0); });
              passes++;
            }
            smallest = chain[L - 1];
            // 업샘플: 작은 단계부터 위 단계에 가산
            gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
            for (let i = L - 2; i >= 0; i--) {
              const src = chain[i + 1];
              pass(progUp, chain[i], src.tex, (p) => gl.uniform2f(p.u('u_texel'), 1 / src.width, 1 / src.height));
              passes++;
            }
            gl.disable(gl.BLEND);
          } else if (P.method === 'single') {
            const c0 = chain[0], r = P.blurR;
            pass(progGauss, tmp, c0.tex, (p) => gl.uniform2f(p.u('u_dir'), r / c0.width, 0));
            pass(progGauss, c0, tmp.tex, (p) => gl.uniform2f(p.u('u_dir'), 0, r / c0.height));
            passes += 2;
          }
        }
        // 3) 합성 + 톤 매핑
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        progComp.use();
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, scene.tex);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, bloomTex);
        gl.uniform1i(progComp.u('u_scene'), 0);
        gl.uniform1i(progComp.u('u_bloom'), 1);
        const norm = P.method === 'chain' ? 1 / Math.max(1, P.levels * 0.5) : 1;
        gl.uniform1f(progComp.u('u_int'), P.method === 'none' && P.debug === 'final' ? 0 : P.intensity * norm);
        gl.uniform1f(progComp.u('u_exp'), P.exposure);
        gl.uniform1f(progComp.u('u_scale'), HDR_SCALE);
        gl.uniform1f(progComp.u('u_view'), P.debug === 'final' ? 0 : 1);
        quad.draw(progComp); passes++;
        gl.activeTexture(gl.TEXTURE0);

        const reach = P.method === 'chain' ? (2 << (P.levels - 1)) * 3 : P.method === 'single' ? 2 * 4 * P.blurR * 2 : 0;
        ctx.stat(GTL.L('렌더 패스', 'Render passes'), passes);
        ctx.stat(GTL.L('가장 작은 버퍼', 'Smallest buffer'), P.method === 'chain' ? `${smallest.width}×${smallest.height}` : `${chain[0].width}×${chain[0].height}`);
        ctx.stat(GTL.L('대략적 번짐 반경', 'Approx. glow radius'), reach ? `~${Math.round(reach)} px` : '-');
        ctx.stat(GTL.L('HDR 렌더 타겟', 'HDR render target'), floatExt ? 'RGBA16F' : GTL.L('RGBA8 (EXT_color_buffer_float 미지원 → 1/16 스케일)', 'RGBA8 (no EXT_color_buffer_float, 1/16 scale)'));
      },
    };
  },
});
