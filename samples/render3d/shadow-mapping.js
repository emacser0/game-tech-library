// 섀도 매핑: 없음 / Hard / PCF / PCSS + 바이어스(섀도 애크니 vs 피터 패닝)
GTL.register({
  id: 'shadow-mapping',
  title: '섀도 매핑 (Hard, PCF, PCSS)',
  summary: '광원 시점의 깊이를 텍스처에 저장하고 비교해 그림자를 만듦. 바이어스와 필터링에 따라 줄무늬, 뜬 그림자, 경계 부드러움이 달라짐.',
  renderer: 'webgl',
  views: { a: 'Hard, 바이어스 0', b: 'PCF + 바이어스' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌',
  info: `
    <p><b>섀도 매핑(shadow mapping)</b>은 2패스로 그림자를 만드는 방법</p>
    <ul>
      <li>1패스: 광원(방향광)에서 직교 투영으로 장면을 렌더해 깊이를 <b>섀도 맵</b>에 저장</li>
      <li>2패스: 각 픽셀을 광원 공간으로 옮김. 저장된 깊이보다 멀면 그림자.</li>
    </ul>
    <p>이 샘플은 확장 없이 동작하도록 깊이를 RGBA8에 24비트 이상으로 <b>패킹</b></p>
    <p><b>섀도 애크니(shadow acne)</b>: 섀도 맵 텍셀 하나가 표면의 넓은 영역을 덮음. 그래서 표면이 자기 자신을 가려 줄무늬가 생김. 광원이 비스듬할수록 심함. 해결 방법:</p>
    <ul>
      <li><b>상수 바이어스</b>: 비교 깊이를 일정량 밀어냄</li>
      <li><b>slope-scaled 바이어스</b>: 표면 기울기에 비례해 밀어냄</li>
      <li><b>normal offset</b>: 조회 위치를 법선 방향으로 밂</li>
      <li><b>앞면 컬링</b>: 섀도 패스에서 닫힌 메시의 뒷면 깊이를 저장</li>
    </ul>
    <p>단점: 바이어스가 너무 크면 물체 밑동에서 그림자가 떨어짐. 이를 <b>피터 패닝(peter panning)</b>이라 부름.</p>
    <p>경계를 부드럽게 하는 필터링:</p>
    <ul>
      <li><b>PCF</b>(Reeves 1987): 깊이 대신 주변 텍셀의 <i>비교 결과</i>를 평균. 여기서는 탭마다 bilinear 가중을 씀.</li>
      <li><b>PCSS</b>(Fernando 2005): 먼저 주변 차폐물(blocker)의 평균 깊이를 찾음. 차폐물과 수신면 거리에 비례해 PCF 반경을 키움. 그래서 <b>접촉부는 날카롭고 멀수록 흐린</b> 그림자가 됨.</li>
    </ul>`,
  // 도식: 비스듬한 면에서 섀도 맵 텍셀 깊이가 계단이 되어 생기는 애크니와 바이어스
  diagram: (L) => `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="14" class="t-a">${L('A: 바이어스 0', 'A: bias 0')}</text>
    <line x1="30" y1="24" x2="30" y2="40" class="d-dim" marker-end="url(#arr)"/>
    <line x1="60" y1="24" x2="60" y2="40" class="d-dim" marker-end="url(#arr)"/>
    <line x1="90" y1="24" x2="90" y2="40" class="d-dim" marker-end="url(#arr)"/>
    <line x1="120" y1="24" x2="120" y2="40" class="d-dim" marker-end="url(#arr)"/>
    <line x1="150" y1="24" x2="150" y2="40" class="d-dim" marker-end="url(#arr)"/>
    <line x1="180" y1="24" x2="180" y2="40" class="d-dim" marker-end="url(#arr)"/>
    <line x1="210" y1="24" x2="210" y2="40" class="d-dim" marker-end="url(#arr)"/>
    <line x1="20" y1="60" x2="240" y2="148" class="d-line"/>
    <line x1="20" y1="68.8" x2="64" y2="68.8" class="d-a"/>
    <line x1="42" y1="68.8" x2="64" y2="77.6" class="d-bad" stroke-width="4"/>
    <line x1="64" y1="86.4" x2="108" y2="86.4" class="d-a"/>
    <line x1="86" y1="86.4" x2="108" y2="95.2" class="d-bad" stroke-width="4"/>
    <line x1="108" y1="104" x2="152" y2="104" class="d-a"/>
    <line x1="130" y1="104" x2="152" y2="112.8" class="d-bad" stroke-width="4"/>
    <line x1="152" y1="121.6" x2="196" y2="121.6" class="d-a"/>
    <line x1="174" y1="121.6" x2="196" y2="130.4" class="d-bad" stroke-width="4"/>
    <line x1="196" y1="139.2" x2="240" y2="139.2" class="d-a"/>
    <line x1="218" y1="139.2" x2="240" y2="148" class="d-bad" stroke-width="4"/>
    <text x="290" y="14" class="t-b">${L('B: 바이어스로 저장 깊이를 밀어냄', 'B: bias pushes stored depth away')}</text>
    <line x1="310" y1="24" x2="310" y2="40" class="d-dim" marker-end="url(#arr)"/>
    <line x1="340" y1="24" x2="340" y2="40" class="d-dim" marker-end="url(#arr)"/>
    <line x1="370" y1="24" x2="370" y2="40" class="d-dim" marker-end="url(#arr)"/>
    <line x1="400" y1="24" x2="400" y2="40" class="d-dim" marker-end="url(#arr)"/>
    <line x1="430" y1="24" x2="430" y2="40" class="d-dim" marker-end="url(#arr)"/>
    <line x1="460" y1="24" x2="460" y2="40" class="d-dim" marker-end="url(#arr)"/>
    <line x1="490" y1="24" x2="490" y2="40" class="d-dim" marker-end="url(#arr)"/>
    <line x1="300" y1="60" x2="520" y2="148" class="d-line"/>
    <line x1="300" y1="80.8" x2="344" y2="80.8" class="d-b"/>
    <line x1="344" y1="98.4" x2="388" y2="98.4" class="d-b"/>
    <line x1="388" y1="116" x2="432" y2="116" class="d-b"/>
    <line x1="432" y1="133.6" x2="476" y2="133.6" class="d-b"/>
    <line x1="476" y1="151.2" x2="520" y2="151.2" class="d-b"/>
    <text x="10" y="172" class="t-small t-dim">${L('빛 방향(위)에서 본 단면. 가로 막대 = 섀도 맵 텍셀 하나에 저장된 깊이', 'Slice seen along the light (from top). Bar = depth stored in one shadow map texel')}</text>
    <text x="10" y="188" class="t-small">${L('빨강: 표면이 저장 깊이보다 멀어 자기 그림자가 됨 (섀도 애크니)', 'Red: surface is farther than stored depth, so it shadows itself (acne)')}</text>
  </svg>`,
  look: [
    'A의 바닥과 물체 표면을 보면 물결 줄무늬(섀도 애크니)가 보임. "광원 고도"를 낮추면 더 심해짐.',
    'B에서 상수 바이어스를 0.4 이상으로 올리면 큐브와 기둥 밑동에서 그림자가 떨어져 물체가 떠 보임(피터 패닝)',
    '해상도를 256으로 낮추면 경계가 계단처럼 보임. "텍셀 시각화"를 켜면 섀도 맵 텍셀 크기가 보임.',
    'PCSS로 바꾸면 기둥 그림자가 밑동은 날카롭고 끝으로 갈수록 흐려짐. "광원 크기"로 흐림 정도가 바뀜.',
  ],
  refs: [
    { type: 'paper', title: 'Casting Curved Shadows on Curved Surfaces (Lance Williams)', url: 'https://dl.acm.org/doi/10.1145/965139.807402', year: 1978, note: 'SIGGRAPH 78. 섀도 맵 원조.' },
    { type: 'paper', title: 'Rendering Antialiased Shadows with Depth Maps (Reeves, Salesin, Cook)', url: 'https://dl.acm.org/doi/10.1145/37402.37435', year: 1987, note: 'SIGGRAPH 87. Percentage-Closer Filtering.' },
    { type: 'talk', title: 'Percentage-Closer Soft Shadows (Randima Fernando, NVIDIA)', year: 2005, note: 'SIGGRAPH 2005 Sketches.' },
    { type: 'article', title: 'Common Techniques to Improve Shadow Depth Maps (Microsoft Docs)', url: 'https://learn.microsoft.com/en-us/windows/win32/dxtecharts/common-techniques-to-improve-shadow-depth-maps', note: 'slope-scaled bias, 앞면 컬링, 피터 패닝 설명' },
    { type: 'article', title: 'LearnOpenGL: Shadow Mapping', url: 'https://learnopengl.com/Advanced-Lighting/Shadows/Shadow-Mapping' },
    { type: 'talk', title: 'Next Generation Post Processing in Call of Duty: Advanced Warfare (Jorge Jimenez)', year: 2014, note: 'SIGGRAPH 2014. Interleaved Gradient Noise (PCSS 샘플 회전에 사용).' },
  ],
  params: [
    { key: 'mode', label: '그림자', type: 'select', group: '필터링', options: [
      { value: 0, label: '없음' },
      { value: 1, label: 'Hard (1탭)' },
      { value: 2, label: 'PCF (격자 + bilinear)' },
      { value: 3, label: 'PCSS (가변 반경)' },
    ], a: 1, b: 2 },
    { key: 'pcfR', label: 'PCF 반경 (텍셀)', type: 'int', min: 1, max: 3, default: 2, when: (p) => +p.mode === 2 },
    { key: 'lightSize', label: '광원 크기 (PCSS)', type: 'range', min: 0.005, max: 0.15, step: 0.005, default: 0.05, when: (p) => +p.mode === 3 },
    { key: 'bias', label: '상수 바이어스 (월드)', type: 'range', min: 0, max: 0.6, step: 0.005, a: 0, b: 0.02, group: '바이어스' },
    { key: 'slope', label: 'Slope-scaled 바이어스', type: 'range', min: 0, max: 0.2, step: 0.005, a: 0, b: 0.03 },
    { key: 'normalOffset', label: 'Normal offset (텍셀)', type: 'range', min: 0, max: 3, step: 0.1, a: 0, b: 1 },
    { key: 'cullFront', label: '섀도 패스 앞면 컬링', type: 'bool', default: false },
    { key: 'res', label: '섀도 맵 해상도', type: 'select', group: '섀도 맵', options: [256, 512, 1024, 2048], default: 1024 },
    { key: 'showMap', label: '섀도 맵 보기 (좌하단)', type: 'bool', default: true },
    { key: 'showTexels', label: '텍셀 시각화', type: 'bool', default: false },
    { key: 'lightElev', label: '광원 고도 (°)', type: 'range', min: 8, max: 85, step: 1, default: 32, shared: true, group: '장면' },
    { key: 'lightMove', label: '광원 회전', type: 'bool', default: true, shared: true },
    { key: 'autoRotate', label: '카메라 자동 회전', type: 'bool', default: false, shared: true },
  ],
  en: {
    title: 'Shadow Mapping (Hard, PCF, PCSS)',
    summary: 'Store depth from the light\'s view in a texture, then compare against it to make shadows. Bias and filtering change the stripes, floating shadows, and edge softness.',
    views: { a: 'Hard, bias 0', b: 'PCF + bias' },
    controls: 'Mouse drag: rotate camera. Wheel: zoom.',
    info: `
    <p><b>Shadow mapping</b> makes shadows in 2 passes.</p>
    <ul>
      <li>Pass 1: render the scene from the light (directional) with an orthographic projection, and store depth in a <b>shadow map</b>.</li>
      <li>Pass 2: move each pixel into light space. If it is farther than the stored depth, it is in shadow.</li>
    </ul>
    <p>This sample <b>packs</b> depth into RGBA8 with 24 or more bits, so it works without extensions.</p>
    <p><b>Shadow acne</b>: one shadow map texel covers a wide area of the surface. So the surface shadows itself and stripes appear. It gets worse as the light gets more slanted. Fixes:</p>
    <ul>
      <li><b>Constant bias</b>: pushes the compared depth by a fixed amount.</li>
      <li><b>Slope-scaled bias</b>: pushes it in proportion to the surface slope.</li>
      <li><b>Normal offset</b>: moves the lookup position along the normal.</li>
      <li><b>Front-face culling</b>: in the shadow pass, stores the back-face depth of closed meshes.</li>
    </ul>
    <p>Downside: too much bias detaches the shadow from the base of an object. This is called <b>peter panning</b>.</p>
    <p>Filtering that softens the edges:</p>
    <ul>
      <li><b>PCF</b> (Reeves 1987): averages the <i>comparison results</i> of nearby texels instead of the depths. Here each tap uses bilinear weights.</li>
      <li><b>PCSS</b> (Fernando 2005): first finds the average depth of nearby blockers. It grows the PCF radius in proportion to the distance between blocker and receiver. So shadows are <b>sharp at contact and blurrier farther away</b>.</li>
    </ul>`,
    look: [
      'Look at the floor and object surfaces in A. You see wavy stripes (shadow acne). Lower "Light elevation" and it gets worse.',
      'In B, raise constant bias to 0.4 or more. Shadows detach from the base of the cube and pillar, so the objects seem to float (peter panning).',
      'Lower the resolution to 256. Edges look like stairs. Turn on "Show texels" to see the shadow map texel size.',
      'Switch to PCSS. The pillar shadow is sharp at the base and gets blurrier toward the tip. "Light size" changes how blurry it gets.',
    ],
    refs: ['SIGGRAPH 78. The origin of shadow maps.', 'SIGGRAPH 87. Percentage-Closer Filtering.', 'SIGGRAPH 2005 Sketches.', 'Explains slope-scaled bias, front-face culling, and peter panning.', null, 'SIGGRAPH 2014. Interleaved Gradient Noise (used to rotate PCSS samples).'],
    params: {
      mode: { label: 'Shadows', group: 'Filtering', options: { 0: 'None', 1: 'Hard (1 tap)', 2: 'PCF (grid + bilinear)', 3: 'PCSS (variable radius)' } },
      pcfR: 'PCF radius (texels)',
      lightSize: 'Light size (PCSS)',
      bias: { label: 'Constant bias (world)', group: 'Bias' },
      slope: 'Slope-scaled bias',
      normalOffset: 'Normal offset (texels)',
      cullFront: 'Front-face culling in shadow pass',
      res: { label: 'Shadow map resolution', group: 'Shadow map' },
      showMap: 'Show shadow map (bottom left)',
      showTexels: 'Show texels',
      lightElev: { label: 'Light elevation (°)', group: 'Scene' },
      lightMove: 'Rotate light',
      autoRotate: 'Auto rotate camera',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params;
    const G = U.geometry;
    const torusG = G.torus(0.6, 0.22, 48, 24);
    const mesh = { floor: G.upload(gl, G.plane(16, 1, 1)), cube: G.upload(gl, G.cube(1)), sphere: G.upload(gl, G.sphere(1, 40, 20)), torus: G.upload(gl, torusG) };
    const T = M.translation, S = M.scaling;
    const objects = [
      { m: mesh.floor, w: M.create(), c: [0.6, 0.6, 0.62] },
      { m: mesh.cube, w: T(-2, 0.5, 0.3), c: [0.8, 0.35, 0.25] },
      { m: mesh.cube, w: M.mul(T(1.8, 1.5, -1.2), S(0.5, 3, 0.5)), c: [0.35, 0.55, 0.8] },
      { m: mesh.sphere, w: M.mul(T(0.2, 0.75, 1.8), S(0.75)), c: [0.85, 0.75, 0.3] },
      { m: mesh.torus, w: M.mul(T(-0.6, 0.62, -2.2), M.rotationX(1.2)), c: [0.4, 0.75, 0.45] },
      { m: mesh.cube, w: M.mul(T(2.6, 0.06, 1.6), S(1.4, 0.12, 1.4)), c: [0.7, 0.5, 0.75] },
    ];
    for (const o of objects) o.n = M.normalMatrix(o.w);
    const quad = U.gl.quad(gl);

    const PACK = `
      vec4 packDepth(float d) {
        vec4 e = fract(vec4(1.0, 255.0, 65025.0, 16581375.0) * d);
        return e - e.yzww * vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);
      }
      float unpackDepth(vec4 c) { return dot(c, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0)); }`;
    const depthProg = U.gl.program(gl, `
      attribute vec3 a_position; uniform mat4 u_lightVP; uniform mat4 u_world;
      void main(){ gl_Position = u_lightVP * u_world * vec4(a_position, 1.0); }`, `
      precision highp float;
      ${PACK}
      void main(){ gl_FragColor = packDepth(gl_FragCoord.z); }`);

    const vs = `
      attribute vec3 a_position; attribute vec3 a_normal;
      uniform mat4 u_vp; uniform mat4 u_world; uniform mat3 u_nmat;
      varying vec3 v_pos; varying vec3 v_n;
      void main(){
        vec4 wp = u_world * vec4(a_position, 1.0);
        v_pos = wp.xyz; v_n = normalize(u_nmat * a_normal);
        gl_Position = u_vp * wp;
      }`;
    const fs = `
      precision highp float;
      uniform sampler2D u_smap; uniform mat4 u_lightVP;
      uniform vec3 u_lightDir; uniform vec3 u_color;
      uniform float u_mode; uniform float u_pcfR; uniform float u_lightSize;
      uniform float u_bias; uniform float u_slope; uniform float u_normalOffset;
      uniform float u_smSize; uniform float u_range; uniform float u_orthoW; uniform float u_showTexels;
      varying vec3 v_pos; varying vec3 v_n;
      ${PACK}
      float cmp(vec2 uv, float z) { return z > unpackDepth(texture2D(u_smap, uv)) ? 0.0 : 1.0; }
      float cmpBilinear(vec2 uv, float z) {
        vec2 tc = uv * u_smSize - 0.5;
        vec2 f = fract(tc);
        vec2 base = (floor(tc) + 0.5) / u_smSize;
        float t = 1.0 / u_smSize;
        float a = cmp(base, z), b = cmp(base + vec2(t, 0.0), z), c = cmp(base + vec2(0.0, t), z), d = cmp(base + vec2(t, t), z);
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      vec2 vogel(float i, float n, float phi) {
        float r = sqrt((i + 0.5) / n);
        float th = i * 2.39996 + phi;
        return r * vec2(cos(th), sin(th));
      }
      float shadow(vec3 N, float NoL) {
        float texelWorld = 2.0 * u_orthoW / u_smSize;
        vec4 lp = u_lightVP * vec4(v_pos + N * u_normalOffset * texelWorld, 1.0);
        vec3 p = lp.xyz / lp.w * 0.5 + 0.5;
        if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 || p.z > 1.0) return 1.0;
        float tanT = sqrt(max(1.0 - NoL * NoL, 0.0)) / max(NoL, 0.05);
        float z = p.z - (u_bias + u_slope * min(tanT, 10.0)) / u_range;
        if (u_mode < 1.5) return cmp(p.xy, z);
        if (u_mode < 2.5) {
          float sum = 0.0, cnt = 0.0;
          for (int x = -3; x <= 3; x++) {
            for (int y = -3; y <= 3; y++) {
              if (abs(float(x)) > u_pcfR || abs(float(y)) > u_pcfR) continue;
              sum += cmpBilinear(p.xy + vec2(float(x), float(y)) / u_smSize, z);
              cnt += 1.0;
            }
          }
          return sum / cnt;
        }
        // PCSS: 1) blocker 탐색 2) 반그림자 폭 추정 3) 가변 반경 PCF
        float phi = 6.2831853 * fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
        float searchR = min(p.z * u_range * u_lightSize / (2.0 * u_orthoW), 0.04);
        float bSum = 0.0, bCnt = 0.0;
        for (int i = 0; i < 16; i++) {
          float d = unpackDepth(texture2D(u_smap, p.xy + vogel(float(i), 16.0, phi) * searchR));
          if (d < z) { bSum += d; bCnt += 1.0; }
        }
        float zb = bSum / max(bCnt, 1.0);
        float pen = max((z - zb) * u_range * u_lightSize / (2.0 * u_orthoW), 1.0 / u_smSize);
        float lit = 0.0;
        for (int i = 0; i < 32; i++) lit += cmp(p.xy + vogel(float(i), 32.0, phi) * pen, z);
        return bCnt < 0.5 ? 1.0 : lit / 32.0;
      }
      void main(){
        vec3 N = normalize(v_n);
        float NoL = dot(N, u_lightDir);
        float s = 1.0;
        if (u_mode > 0.5 && NoL > 0.0) s = shadow(N, NoL);
        vec3 alb = u_color;
        vec3 c = alb * (vec3(0.16, 0.18, 0.24) * (0.6 + 0.4 * N.y)) + alb * vec3(1.0, 0.95, 0.85) * 1.6 * max(NoL, 0.0) * s;
        if (u_showTexels > 0.5) {
          vec4 lp = u_lightVP * vec4(v_pos, 1.0);
          vec2 tc = floor((lp.xy / lp.w * 0.5 + 0.5) * u_smSize);
          c *= mod(tc.x + tc.y, 2.0) < 0.5 ? 0.8 : 1.0;
        }
        gl_FragColor = vec4(pow(c / (1.0 + c * 0.3), vec3(1.0 / 2.2)), 1.0);
      }`;
    const prog = U.gl.program(gl, vs, fs);
    const mapProg = U.gl.program(gl, U.gl.QUAD_VS, `
      precision highp float; uniform sampler2D u_smap; varying vec2 v_uv;
      ${PACK}
      void main(){ float d = unpackDepth(texture2D(u_smap, v_uv)); gl_FragColor = vec4(vec3(pow(clamp(d, 0.0, 1.0), 3.0)), 1.0); }`);

    let fb = null, fbRes = 0;
    const cam = { yaw: 0.5, pitch: 0.55, dist: 10, drag: false, lx: 0, ly: 0 };
    let lightYaw = 0.7;
    const ORTHO_W = 7, NEAR = 1, FAR = 30;

    return {
      update(dt) {
        if (P.autoRotate && !cam.drag) cam.yaw += dt * 0.15;
        if (P.lightMove) lightYaw += dt * 0.15;
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
        const res = +P.res;
        if (!fb || fbRes !== res) { if (fb) fb.dispose(); fb = U.gl.framebuffer(gl, res, res, { depth: true, filter: 'nearest' }); fbRes = res; }
        const el = U.rad(P.lightElev);
        const L = [Math.cos(el) * Math.sin(lightYaw), Math.sin(el), Math.cos(el) * Math.cos(lightYaw)];
        const lightVP = M.multiply(M.ortho(-ORTHO_W, ORTHO_W, -ORTHO_W, ORTHO_W, NEAR, FAR), M.lookAt(L.map((v) => v * 15), [0, 0, 0]));
        const t0 = ctx.now();

        // ── 1패스: 광원 시점 깊이 ──
        fb.bind();
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        if (P.cullFront) { gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT); } else gl.disable(gl.CULL_FACE);
        depthProg.use();
        gl.uniformMatrix4fv(depthProg.u('u_lightVP'), false, lightVP);
        if (+P.mode > 0) for (const o of objects) { gl.uniformMatrix4fv(depthProg.u('u_world'), false, o.w); o.m.draw(depthProg); }
        gl.cullFace(gl.BACK);
        gl.disable(gl.CULL_FACE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // ── 2패스: 카메라 ──
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clearColor(0.09, 0.1, 0.13, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const proj = M.perspective(U.rad(50), ctx.width / ctx.height, 0.1, 100);
        const eye = M.orbitEye([0, 0.5, 0], cam.yaw, cam.pitch, cam.dist);
        const vp = M.multiply(proj, M.lookAt(eye, [0, 0.5, 0]));
        prog.use();
        gl.uniformMatrix4fv(prog.u('u_vp'), false, vp);
        gl.uniformMatrix4fv(prog.u('u_lightVP'), false, lightVP);
        gl.uniform3fv(prog.u('u_lightDir'), L);
        gl.uniform1f(prog.u('u_mode'), +P.mode);
        gl.uniform1f(prog.u('u_pcfR'), P.pcfR);
        gl.uniform1f(prog.u('u_lightSize'), P.lightSize);
        gl.uniform1f(prog.u('u_bias'), P.bias);
        gl.uniform1f(prog.u('u_slope'), P.slope);
        gl.uniform1f(prog.u('u_normalOffset'), P.normalOffset);
        gl.uniform1f(prog.u('u_smSize'), res);
        gl.uniform1f(prog.u('u_range'), FAR - NEAR);
        gl.uniform1f(prog.u('u_orthoW'), ORTHO_W);
        gl.uniform1f(prog.u('u_showTexels'), P.showTexels ? 1 : 0);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fb.tex); gl.uniform1i(prog.u('u_smap'), 0);
        for (const o of objects) {
          gl.uniformMatrix4fv(prog.u('u_world'), false, o.w);
          gl.uniformMatrix3fv(prog.u('u_nmat'), false, o.n);
          gl.uniform3fv(prog.u('u_color'), o.c);
          o.m.draw(prog);
        }

        if (P.showMap && +P.mode > 0) {
          const s = Math.round(Math.min(ctx.pixelWidth, ctx.pixelHeight) * 0.28);
          gl.disable(gl.DEPTH_TEST);
          gl.viewport(8, 8, s, s);
          mapProg.use();
          gl.uniform1i(mapProg.u('u_smap'), 0);
          quad.draw(mapProg);
        }
        const names = [GTL.L('없음', 'None'), 'Hard', 'PCF', 'PCSS'];
        const taps = [0, 1, (2 * P.pcfR + 1) ** 2 * 4, 48][+P.mode];
        ctx.stat(GTL.L('방식', 'Method'), names[+P.mode]);
        ctx.stat(GTL.L('픽셀당 섀도 맵 샘플', 'Shadow map samples per pixel'), taps);
        ctx.stat(GTL.L('섀도 맵', 'Shadow map'), GTL.L(`${res}² RGBA8 패킹`, `${res}² RGBA8 packed`));
        ctx.stat(GTL.L('텍셀 크기(월드)', 'Texel size (world)'), (2 * ORTHO_W / res).toFixed(3));
        ctx.stat(GTL.L('CPU 제출 ms', 'CPU submit ms'), (ctx.now() - t0).toFixed(2));
      },
    };
  },
});
