// TAA (Temporal Anti-Aliasing): 없음 / 지터만 / 지터 + 히스토리 블렌드 + 이웃 클램핑, 고스팅 시각화
GTL.register({
  id: 'taa',
  title: 'TAA (시간적 안티에일리어싱)',
  summary: '매 프레임 투영을 픽셀 이하로 흔들고(지터) 이전 프레임 결과와 섞어 프레임 여러 장의 샘플을 모음. 움직이는 물체는 모션 벡터로 이전 위치를 찾고, 이웃 색 범위로 히스토리를 제한해 고스팅을 줄임.',
  renderer: 'webgl2',
  pixelRatio: 1,
  contextAttributes: () => ({ antialias: false }),
  views: { a: 'AA 없음', b: 'TAA + 이웃 클램핑' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌',
  info: `
    <p><b>TAA</b>는 픽셀당 샘플을 시간 축으로 나눠 모으는 안티에일리어싱. 프레임마다 샘플 1개만 계산하지만 수십 프레임이 쌓여 슈퍼샘플링과 비슷한 결과가 됨.</p>
    <p>동작 순서:</p>
    <ol>
      <li><b>지터(jitter)</b>: 투영 행렬을 Halton(2,3) 수열로 프레임마다 픽셀 이하만큼 옮김</li>
      <li><b>모션 벡터</b>: 정점마다 이번 프레임과 이전 프레임의 화면 위치 차이를 별도 버퍼에 저장</li>
      <li><b>재투영(reprojection)</b>: 이전 결과(히스토리)를 "현재 UV - 모션 벡터" 위치에서 읽음</li>
      <li><b>이웃 클램핑</b>: 현재 프레임 3×3 이웃의 색 범위(YCoCg 공간)로 히스토리를 제한. 가려졌다 드러난 곳의 오래된 색을 버림.</li>
      <li><b>블렌드</b>: 결과 = lerp(히스토리, 현재, α). α가 0.1이면 실효 샘플 약 19개.</li>
    </ol>
    <p>단점:</p>
    <ul>
      <li>모션 벡터가 틀리거나 클램핑이 없으면 움직인 물체 뒤에 잔상이 남음(<b>고스팅</b>)</li>
      <li>클램핑이 강하면 가는 선에서 히스토리가 자주 버려져 깜빡임이 남음. 분산 클리핑(variance clipping)은 범위를 평균 ± 표준편차로 좁혀 두 문제 사이를 조절.</li>
      <li>히스토리를 bilinear로 읽으므로 전체가 조금 흐려짐. 엔진은 Catmull-Rom 샘플링과 샤프닝으로 보완.</li>
    </ul>`,
  // 도식: 프레임마다 옮기는 지터 위치, 히스토리 블렌드, 이웃 클램핑
  diagram: (L) => `<svg viewBox="0 0 540 180" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="16" class="t-small t-dim">${L('픽셀 하나 안의 지터 위치', 'Jitter inside one pixel')}</text>
    <rect x="20" y="26" width="130" height="130" class="f-dim"/>
    <circle cx="85" cy="69.3" r="3.5" class="f-b"/>
    <text x="90" y="66.3" class="t-small t-mono">1</text>
    <circle cx="52.5" cy="112.7" r="3.5" class="f-b"/>
    <text x="57.5" y="109.7" class="t-small t-mono">2</text>
    <circle cx="117.5" cy="40.4" r="3.5" class="f-b"/>
    <text x="122.5" y="37.4" class="t-small t-mono">3</text>
    <circle cx="36.2" cy="83.8" r="3.5" class="f-b"/>
    <text x="41.2" y="80.8" class="t-small t-mono">4</text>
    <circle cx="101.2" cy="127.1" r="3.5" class="f-b"/>
    <text x="106.2" y="124.1" class="t-small t-mono">5</text>
    <circle cx="68.8" cy="54.9" r="3.5" class="f-b"/>
    <text x="73.8" y="51.9" class="t-small t-mono">6</text>
    <circle cx="133.8" cy="98.2" r="3.5" class="f-b"/>
    <text x="138.8" y="95.2" class="t-small t-mono">7</text>
    <circle cx="28.1" cy="141.6" r="3.5" class="f-b"/>
    <text x="33.1" y="138.6" class="t-small t-mono">8</text>
    <text x="20" y="172" class="t-small">${L('Halton(2,3), 프레임마다 1개', 'Halton(2,3), one per frame')}</text>
    <text x="180" y="16" class="t-small t-dim">${L('히스토리 블렌드', 'History blend')}</text>
    <text x="180" y="44" class="t-mono t-small">out = lerp(hist, cur, 0.1)</text>
    <text x="180" y="64" class="t-small">${L('약 19프레임 샘플이 쌓임', 'about 19 frames of samples')}</text>
    <text x="180" y="92" class="t-small t-dim">${L('히스토리 위치', 'history position')}</text>
    <text x="180" y="108" class="t-mono t-small">uv - motionVector</text>
    <text x="180" y="172" class="t-small t-a">${L('A는 픽셀 중심 1개뿐, 계단 남음', 'A uses only the pixel center')}</text>
    <text x="380" y="16" class="t-small t-dim">${L('이웃 클램핑 (3x3 색 범위)', 'Neighbor clamp (3x3 range)')}</text>
    <line x1="390" y1="80" x2="530" y2="80" class="d-dim"/>
    <rect x="420" y="70" width="70" height="20" class="f-dim"/>
    <text x="420" y="104" text-anchor="middle" class="t-small t-mono">${L('min', 'min')}</text>
    <text x="490" y="104" text-anchor="middle" class="t-small t-mono">${L('max', 'max')}</text>
    <circle cx="520" cy="80" r="5" class="f-a"/>
    <circle cx="490" cy="80" r="5" class="f-b"/>
    <line x1="514" y1="72" x2="496" y2="72" class="d-line"/>
    <text x="380" y="130" class="t-small">${L('범위 밖 히스토리(주황)를', 'Out of range history (orange)')}</text>
    <text x="380" y="144" class="t-small">${L('경계로 당김(파랑), 고스팅 감소', 'is pulled to the edge (blue)')}</text>
  </svg>`,
  look: [
    'A의 바닥 격자와 울타리 기둥에서 계단과 반짝임이 보임. B는 선이 매끈하고 카메라가 돌아도 안정적임.',
    'B에서 이웃 클램핑을 "없음"으로 바꾸면 회전 날개와 움직이는 구 뒤에 긴 잔상이 남음. "고스팅 보기"를 켜면 빨갛게 표시됨.',
    '"모션 벡터 사용"을 끄면 클램핑이 있어도 움직이는 물체 가장자리가 번짐',
    'AA를 "지터만"으로 바꾸면 화면 전체가 떨림. 히스토리 블렌드가 이 떨림을 평균내는 역할을 함.',
    'α를 0.5로 올리면 잔상은 줄지만 계단이 돌아옴. 0.03이면 매끈하지만 클램핑 없이는 잔상이 길어짐.',
  ],
  refs: [
    { type: 'talk', title: 'High Quality Temporal Supersampling (Brian Karis)', year: 2014, note: 'SIGGRAPH 2014 Advances in Real-Time Rendering. UE4 TAA, YCoCg 이웃 클램핑, 가장 가까운 깊이의 속도 사용.' },
    { type: 'talk', title: 'Temporal Reprojection Anti-Aliasing in INSIDE (Lasse Jon Fuglsang Pedersen)', year: 2016, note: 'GDC 2016. AABB 클리핑과 속도 버퍼.' },
    { type: 'talk', title: 'An Excursion in Temporal Supersampling (Marco Salvi)', year: 2016, note: 'GDC 2016. 분산 클리핑(variance clipping).' },
    { type: 'paper', title: 'A Survey of Temporal Antialiasing Techniques (Lei Yang, Shiqiu Liu, Marco Salvi)', year: 2020, note: 'Computer Graphics Forum (EGSR 2020 STAR).' },
  ],
  params: [
    { key: 'aa', label: 'AA', type: 'select', group: 'TAA', options: [
      { value: 0, label: '없음' },
      { value: 1, label: '지터만 (블렌드 없음)' },
      { value: 2, label: 'TAA (지터 + 히스토리)' },
    ], a: 0, b: 2 },
    { key: 'clampMode', label: '이웃 클램핑', type: 'select', options: [
      { value: 0, label: '없음' },
      { value: 1, label: 'min-max 클램프 (YCoCg)' },
      { value: 2, label: '분산 클리핑 (평균 ± σ)' },
    ], default: 1, when: (p) => +p.aa === 2 },
    { key: 'useVel', label: '모션 벡터 사용', type: 'bool', default: true, when: (p) => +p.aa === 2 },
    { key: 'alpha', label: '현재 프레임 비율 α', type: 'range', min: 0.03, max: 0.5, step: 0.01, default: 0.1, when: (p) => +p.aa === 2 },
    { key: 'jitterN', label: '지터 패턴 길이', type: 'select', options: [4, 8, 16], default: 8, when: (p) => +p.aa > 0 },
    { key: 'showGhost', label: '고스팅 보기', type: 'bool', default: false, help: '최종 결과와 현재 프레임 차이를 빨강으로 표시', when: (p) => +p.aa === 2 },
    { key: 'speed', label: '물체 움직임 속도', type: 'range', min: 0, max: 2, step: 0.05, default: 1, shared: true, group: '장면' },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'TAA (Temporal Anti-Aliasing)',
    summary: 'Each frame shifts the projection by less than a pixel (jitter) and blends with the previous frame, so samples from many frames add up. Moving objects use motion vectors to find their previous position. Clamping history to the neighbor color range reduces ghosting.',
    views: { a: 'No AA', b: 'TAA + neighborhood clamp' },
    controls: 'Mouse drag: rotate camera, wheel: zoom',
    info: `
    <p><b>TAA</b> is anti-aliasing that spreads the samples for each pixel over time. Each frame computes only 1 sample, but dozens of frames add up to a result close to supersampling.</p>
    <p>Steps:</p>
    <ol>
      <li><b>Jitter</b>: shift the projection matrix by less than a pixel each frame, using the Halton(2,3) sequence.</li>
      <li><b>Motion vectors</b>: for each vertex, store the screen position change between this frame and the previous frame in a separate buffer.</li>
      <li><b>Reprojection</b>: read the previous result (history) at "current UV - motion vector".</li>
      <li><b>Neighborhood clamp</b>: limit the history to the color range (in YCoCg space) of the 3×3 neighbors in the current frame. This drops stale colors in areas that were hidden and are now visible.</li>
      <li><b>Blend</b>: result = lerp(history, current, α). At α = 0.1, you get about 19 effective samples.</li>
    </ol>
    <p>Downsides:</p>
    <ul>
      <li>If motion vectors are wrong or there is no clamp, trails stay behind moving objects (<b>ghosting</b>).</li>
      <li>A strong clamp often throws away history on thin lines, so flicker remains. Variance clipping narrows the range to mean ± standard deviation and balances the two problems.</li>
      <li>History is read with bilinear filtering, so the whole image gets a little blurry. Engines fix this with Catmull-Rom sampling and sharpening.</li>
    </ul>`,
    look: [
      'In A, the floor grid and fence posts show jagged edges and sparkles. In B, lines are smooth and stay stable as the camera turns.',
      'In B, set neighborhood clamp to "None". Long trails stay behind the spinning blades and the moving sphere. Turn on "Show ghosting" to mark them in red.',
      'Turn off "Use motion vectors". The edges of moving objects smear, even with clamping.',
      'Set AA to "Jitter only". The whole screen shakes. The history blend averages out this shake.',
      'Raise α to 0.5. Trails get shorter, but jagged edges come back. At 0.03 it is smooth, but without clamping the trails get long.',
    ],
    refs: ['SIGGRAPH 2014 Advances in Real-Time Rendering. UE4 TAA, YCoCg neighborhood clamp, using the velocity of the closest depth.', 'GDC 2016. AABB clipping and the velocity buffer.', 'GDC 2016. Variance clipping.', 'Computer Graphics Forum (EGSR 2020 STAR).'],
    params: {
      aa: { label: 'AA', group: 'TAA', options: { 0: 'None', 1: 'Jitter only (no blend)', 2: 'TAA (jitter + history)' } },
      clampMode: { label: 'Neighborhood clamp', options: { 0: 'None', 1: 'Min-max clamp (YCoCg)', 2: 'Variance clipping (mean ± σ)' } },
      useVel: 'Use motion vectors',
      alpha: 'Current frame weight α',
      jitterN: 'Jitter pattern length',
      showGhost: { label: 'Show ghosting', help: 'Marks the difference between the final result and the current frame in red' },
      speed: { label: 'Object speed', group: 'Scene' },
      autoRotate: 'Auto rotate',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params, G = U.geometry;
    const T = M.translation, S = M.scaling;
    const cbf = gl.getExtension('EXT_color_buffer_float');

    const cube = G.upload(gl, G.cube(1)), sph = G.upload(gl, G.sphere(1, 32, 16)), floor = G.upload(gl, G.plane(30, 1, 1));
    // 정적 오브젝트 + 움직이는 오브젝트(함수)
    const statics = [{ m: floor, w: M.create(), c: [0.75, 0.75, 0.75], kind: 1 }];
    for (let i = 0; i < 25; i++) statics.push({ m: cube, w: M.mul(T(-4.8 + i * 0.4, 0.6, -2.2), S(0.035, 1.2, 0.035)), c: [0.85, 0.8, 0.7], kind: 0 });
    statics.push({ m: cube, w: M.mul(T(0, 1.05, -2.2), S(9.8, 0.03, 0.03)), c: [0.85, 0.8, 0.7], kind: 0 });
    statics.push({ m: cube, w: M.mul(T(0, 0.45, -2.2), S(9.8, 0.03, 0.03)), c: [0.85, 0.8, 0.7], kind: 0 });
    statics.push({ m: cube, w: M.mul(T(2.2, 0.9, 0.3), S(0.08, 1.8, 0.08)), c: [0.5, 0.5, 0.55], kind: 0 });
    const dyn = [];
    for (let i = 0; i < 4; i++) dyn.push({ m: cube, c: [0.95, 0.55, 0.25], kind: 0, f: (t) => M.mul(T(2.2, 1.8, 0.36), M.rotationZ(t * 2.2 + i * Math.PI / 2), T(0.75, 0, 0), S(1.5, 0.06, 0.03)) });
    dyn.push({ m: sph, c: [0.3, 0.6, 0.95], kind: 2, f: (t) => M.mul(T(Math.sin(t * 0.9) * 3, 0.55, 1.2), M.rotationZ(-Math.sin(t * 0.9) * 2), S(0.55)) });
    dyn.push({ m: cube, c: [0.9, 0.9, 0.9], kind: 2, f: (t) => M.mul(T(-2.4, 0.5, 0.2 + Math.cos(t * 1.3) * 1.2), M.rotationY(t * 0.8), S(0.7)) });
    for (const o of [...statics, ...dyn]) o.prev = null;

    const sceneProg = U.gl.program(gl, `#version 300 es
      in vec3 a_position; in vec3 a_normal;
      uniform mat4 u_vpJit; uniform mat4 u_vp; uniform mat4 u_prevVP; uniform mat4 u_world; uniform mat4 u_prevWorld;
      out vec3 v_n; out vec3 v_pos; out vec3 v_obj; out vec4 v_cur; out vec4 v_prev;
      void main(){
        vec4 wp = u_world * vec4(a_position, 1.0);
        v_pos = wp.xyz; v_obj = a_position;
        v_n = mat3(u_world) * a_normal;
        v_cur = u_vp * wp;
        v_prev = u_prevVP * (u_prevWorld * vec4(a_position, 1.0));
        gl_Position = u_vpJit * wp;
      }`, `#version 300 es
      precision highp float;
      uniform vec3 u_color; uniform float u_kind;
      in vec3 v_n; in vec3 v_pos; in vec3 v_obj; in vec4 v_cur; in vec4 v_prev;
      layout(location = 0) out vec4 o_color;
      layout(location = 1) out vec4 o_vel;
      void main(){
        vec3 N = normalize(v_n);
        vec3 alb = u_color;
        if (u_kind > 0.5 && u_kind < 1.5) {
          vec2 g = abs(fract(v_pos.xz * 2.0 + 0.5) - 0.5);
          alb *= (min(g.x, g.y) < 0.02) ? 0.15 : 1.0;
        } else if (u_kind > 1.5) {
          alb *= step(0.5, fract(v_obj.y * 4.0 + v_obj.x * 2.0)) * 0.8 + 0.2;
        }
        float d = max(dot(N, normalize(vec3(0.4, 0.8, 0.3))), 0.0);
        vec3 c = alb * (0.25 + 0.85 * d);
        o_color = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
        vec2 vel = (v_cur.xy / v_cur.w - v_prev.xy / v_prev.w) * 0.5;
        vec2 e = clamp(vel * 2.0 + 0.5, 0.0, 1.0);
        vec2 hi = floor(e * 255.0) / 255.0;
        o_vel = vec4(hi, fract(e * 255.0));
      }`);
    const QVS = `#version 300 es
      in vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;
    const resolve = U.gl.program(gl, QVS, `#version 300 es
      precision highp float;
      uniform sampler2D u_cur; uniform sampler2D u_vel; uniform sampler2D u_hist;
      uniform vec2 u_res; uniform float u_alpha; uniform float u_clamp; uniform float u_useVel; uniform float u_reset;
      out vec4 o_color;
      vec3 toY(vec3 c) { return vec3(0.25 * c.r + 0.5 * c.g + 0.25 * c.b, 0.5 * c.r - 0.5 * c.b, -0.25 * c.r + 0.5 * c.g - 0.25 * c.b); }
      vec3 fromY(vec3 y) { return vec3(y.x + y.y - y.z, y.x + y.z, y.x - y.y - y.z); }
      vec2 decodeVel(vec4 t) { return ((t.xy + t.zw / 255.0) - 0.5) * 0.5; }
      vec3 clipBox(vec3 mn, vec3 mx, vec3 q) {
        vec3 c = 0.5 * (mx + mn), e = 0.5 * (mx - mn) + 1e-4;
        vec3 v = q - c, a = abs(v / e);
        float m = max(a.x, max(a.y, a.z));
        return m > 1.0 ? c + v / m : q;
      }
      void main(){
        ivec2 ip = ivec2(gl_FragCoord.xy);
        vec2 uv = gl_FragCoord.xy / u_res;
        vec3 cur = toY(texelFetch(u_cur, ip, 0).rgb);
        vec3 mn = vec3(1e9), mx = vec3(-1e9), m1 = vec3(0.0), m2 = vec3(0.0);
        vec2 vel = vec2(0.0);
        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            ivec2 q = clamp(ip + ivec2(x, y), ivec2(0), ivec2(u_res) - 1);
            vec3 c = toY(texelFetch(u_cur, q, 0).rgb);
            mn = min(mn, c); mx = max(mx, c); m1 += c; m2 += c * c;
            vec2 v = decodeVel(texelFetch(u_vel, q, 0));
            if (dot(v, v) > dot(vel, vel)) vel = v;
          }
        }
        vec2 puv = uv - (u_useVel > 0.5 ? vel : vec2(0.0));
        vec3 hist = toY(texture(u_hist, puv).rgb);
        if (u_clamp > 0.5 && u_clamp < 1.5) hist = clamp(hist, mn, mx);
        else if (u_clamp > 1.5) {
          vec3 mu = m1 / 9.0, sg = sqrt(max(m2 / 9.0 - mu * mu, 0.0));
          hist = clipBox(max(mu - sg, mn), min(mu + sg, mx), hist);
        }
        float a = u_alpha;
        if (u_reset > 0.5 || puv.x < 0.0 || puv.y < 0.0 || puv.x > 1.0 || puv.y > 1.0) a = 1.0;
        o_color = vec4(max(fromY(mix(hist, cur, a)), 0.0), 1.0);
      }`);
    const blit = U.gl.program(gl, QVS, `#version 300 es
      precision highp float;
      uniform sampler2D u_tex; uniform sampler2D u_cur; uniform float u_ghost;
      out vec4 o_color;
      void main(){
        ivec2 ip = ivec2(gl_FragCoord.xy);
        vec3 c = texelFetch(u_tex, ip, 0).rgb;
        if (u_ghost > 0.5) {
          vec3 k = texelFetch(u_cur, ip, 0).rgb;
          float g = smoothstep(0.06, 0.3, length(c - k));
          c = mix(c * 0.6, vec3(1.0, 0.1, 0.1), g);
        }
        o_color = vec4(c, 1.0);
      }`);
    const quad = U.gl.quad(gl);

    // ── 렌더 타겟 ──
    let rt = null;
    const tex2d = (w, h, ifmt, fmt, type, filter) => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, type, null);
      U.gl.textureParams(gl, t, { filter });
      return t;
    };
    function makeRT(w, h) {
      if (rt) {
        gl.deleteFramebuffer(rt.scene); gl.deleteRenderbuffer(rt.depth);
        for (const t of [rt.color, rt.vel, ...rt.hist]) gl.deleteTexture(t);
        for (const f of rt.histFB) gl.deleteFramebuffer(f);
      }
      const color = tex2d(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, 'nearest');
      const vel = tex2d(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, 'nearest');
      const depth = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
      const scene = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, scene);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, vel, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      const hist = [], histFB = [];
      for (let i = 0; i < 2; i++) {
        const t = cbf ? tex2d(w, h, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, 'linear') : tex2d(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, 'linear');
        const f = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, f);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
        hist.push(t); histFB.push(f);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      rt = { w, h, color, vel, depth, scene, hist, histFB, cur: 0, valid: false };
    }

    const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
    const cam = { yaw: 0.35, pitch: 0.3, dist: 7.5, drag: false, lx: 0, ly: 0 };
    let time = 0, jitterIdx = 0, prevVP = null, lastAA = -1;

    return {
      update(dt) {
        time += dt * P.speed;
        if (P.autoRotate && !cam.drag) cam.yaw += dt * 0.15;
        if (ctx.input.mouse.wheel) cam.dist = U.clamp(cam.dist * Math.pow(1.12, ctx.input.mouse.wheel), 2, 20);
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
        const W = ctx.pixelWidth, H = ctx.pixelHeight;
        if (!rt || rt.w !== W || rt.h !== H) makeRT(W, H);
        const aa = +P.aa;
        if (aa !== lastAA) { rt.valid = false; lastAA = aa; }
        const tgt = [0, 0.8, 0];
        const proj = M.perspective(U.rad(50), W / H, 0.1, 100);
        const vp = M.multiply(proj, M.lookAt(M.orbitEye(tgt, cam.yaw, cam.pitch, cam.dist), tgt));
        let jx = 0, jy = 0;
        if (aa > 0) {
          const n = +P.jitterN, i = (jitterIdx++ % n) + 1;
          jx = halton(i, 2) - 0.5; jy = halton(i, 3) - 0.5;
        }
        const pj = new Float32Array(proj);
        pj[8] += jx * 2 / W; pj[9] += jy * 2 / H;
        const vpJit = M.multiply(pj, M.lookAt(M.orbitEye(tgt, cam.yaw, cam.pitch, cam.dist), tgt));
        if (!prevVP) prevVP = vp;

        // ── 1패스: 색 + 모션 벡터 (MRT) ──
        gl.bindFramebuffer(gl.FRAMEBUFFER, rt.scene);
        gl.viewport(0, 0, W, H);
        gl.clearBufferfv(gl.COLOR, 0, [0.12, 0.13, 0.17, 1]);
        gl.clearBufferfv(gl.COLOR, 1, [0.5, 0.5, 0, 0]);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        sceneProg.use();
        gl.uniformMatrix4fv(sceneProg.u('u_vpJit'), false, vpJit);
        gl.uniformMatrix4fv(sceneProg.u('u_vp'), false, vp);
        gl.uniformMatrix4fv(sceneProg.u('u_prevVP'), false, prevVP);
        const drawObj = (o, w) => {
          gl.uniformMatrix4fv(sceneProg.u('u_world'), false, w);
          gl.uniformMatrix4fv(sceneProg.u('u_prevWorld'), false, o.prev || w);
          gl.uniform3fv(sceneProg.u('u_color'), o.c);
          gl.uniform1f(sceneProg.u('u_kind'), o.kind);
          o.m.draw(sceneProg);
          o.prev = w;
        };
        for (const o of statics) drawObj(o, o.w);
        for (const o of dyn) drawObj(o, o.f(time));
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        prevVP = vp;

        // ── 2패스: 리졸브 (히스토리 핑퐁) ──
        let show = rt.color;
        if (aa === 2) {
          const src = rt.cur, dst = 1 - rt.cur;
          gl.bindFramebuffer(gl.FRAMEBUFFER, rt.histFB[dst]);
          gl.viewport(0, 0, W, H);
          resolve.use();
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, rt.color); gl.uniform1i(resolve.u('u_cur'), 0);
          gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, rt.vel); gl.uniform1i(resolve.u('u_vel'), 1);
          gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, rt.hist[src]); gl.uniform1i(resolve.u('u_hist'), 2);
          gl.uniform2f(resolve.u('u_res'), W, H);
          gl.uniform1f(resolve.u('u_alpha'), P.alpha);
          gl.uniform1f(resolve.u('u_clamp'), +P.clampMode);
          gl.uniform1f(resolve.u('u_useVel'), P.useVel ? 1 : 0);
          gl.uniform1f(resolve.u('u_reset'), rt.valid ? 0 : 1);
          quad.draw(resolve);
          rt.cur = dst; rt.valid = true;
          show = rt.hist[dst];
        }

        // ── 3패스: 화면 출력 ──
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, W, H);
        blit.use();
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, show); gl.uniform1i(blit.u('u_tex'), 0);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, rt.color); gl.uniform1i(blit.u('u_cur'), 1);
        gl.uniform1f(blit.u('u_ghost'), aa === 2 && P.showGhost ? 1 : 0);
        quad.draw(blit);
        gl.activeTexture(gl.TEXTURE0);

        ctx.stat('AA', [GTL.L('없음', 'None'), GTL.L('지터만', 'Jitter only'), 'TAA'][aa]);
        ctx.stat(GTL.L('지터 (px)', 'Jitter (px)'), aa ? `${jx.toFixed(2)}, ${jy.toFixed(2)}` : '0, 0');
        if (aa === 2) {
          ctx.stat(GTL.L('실효 샘플 수 ≈ (2-α)/α', 'Effective samples ≈ (2-α)/α'), ((2 - P.alpha) / P.alpha).toFixed(1));
          ctx.stat(GTL.L('95% 수렴 (프레임)', '95% convergence (frames)'), Math.ceil(Math.log(0.05) / Math.log(1 - P.alpha)));
          ctx.stat(GTL.L('히스토리 포맷', 'History format'), cbf ? 'RGBA16F' : GTL.L('RGBA8 (float 렌더 미지원)', 'RGBA8 (no float render support)'));
        }
        ctx.stat(GTL.L('해상도', 'Resolution'), `${W}x${H}`);
      },
    };
  },
});
