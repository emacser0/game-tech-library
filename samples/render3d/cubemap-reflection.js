// 큐브맵 환경 반사: 없음 / 밉 0 고정 / 거칠기별 밉 선택
GTL.register({
  id: 'cubemap-reflection',
  title: '큐브맵 환경 반사 & 거칠기별 밉',
  summary: '주변 환경을 큐브맵에 담아 반사 방향으로 읽음. 반사가 없으면 금속이 검고 평평해 보임. 거칠기에 맞춰 흐린 밉 레벨을 고르면 거친 금속과 매끈한 금속이 구별됨.',
  renderer: 'webgl2',
  views: { a: '반사 없음', b: '반사 + 거칠기별 밉' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌',
  info: `
    <p><b>큐브맵(cubemap)</b>은 한 점에서 본 주변을 정육면체 6면에 담은 텍스처. 방향 벡터로 바로 조회함. 게임은 레벨 곳곳에 <b>반사 프로브(reflection probe)</b>를 두고 큐브맵을 미리 구워 둠.</p>
    <p>동작:</p>
    <ol>
      <li>시선을 법선으로 반사한 방향 R = reflect(-V, N)을 구함.</li>
      <li>큐브맵에서 R 방향 색을 읽어 반사색으로 씀. 세기는 프레넬(Schlick)로 정함.</li>
      <li>거친 표면은 반사가 넓게 퍼짐. 그래서 거칠기가 클수록 <b>흐린 밉 레벨</b>을 읽음(<code>textureLod</code>).</li>
    </ol>
    <p>반사가 없으면 금속은 확산광이 0이라 직접광 하이라이트만 남음. 그래서 검은 플라스틱처럼 보임.</p>
    <p>단점과 한계:</p>
    <ul>
      <li>이 샘플은 <code>generateMipmap</code>의 박스 필터 밉을 씀. 실제 엔진은 밉마다 GGX 로브로 미리 적분(prefilter)함. 박스 필터는 거친 반사에서 블록 무늬가 남음.</li>
      <li>큐브맵은 한 점 기준이라 물체 위치에 따른 시차가 없음. 박스 투영(parallax-corrected)으로 보정함.</li>
      <li>동적 물체나 자기 자신은 큐브맵에 안 들어감.</li>
    </ul>`,
  // 도식: 반사 벡터 R로 큐브맵을 읽는 과정과 거칠기별 밉 레벨 선택
  diagram: (L) => `<svg viewBox="0 0 540 184" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker><marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="16" class="t-small t-dim">${L('반사 방향으로 큐브맵 조회', 'Look up the cubemap along R')}</text>
    <rect x="20" y="26" width="220" height="140" class="d-dim" stroke-dasharray="4 3"/>
    <text x="26" y="160" class="t-small t-dim">${L('큐브맵 (주변 환경)', 'cubemap (surroundings)')}</text>
    <circle cx="150" cy="110" r="34" class="f-dim"/>
    <circle cx="40" cy="60" r="4" class="f-accent"/>
    <text x="46" y="52" class="t-small">${L('눈', 'eye')}</text>
    <line x1="42" y1="62" x2="126" y2="86" class="d-line" marker-end="url(#arr)"/>
    <line x1="126" y1="86" x2="100" y2="60" class="d-dim" marker-end="url(#arr)"/>
    <text x="86" y="60" class="t-small">${L('N', 'N')}</text>
    <line x1="126" y1="86" x2="200" y2="28" class="d-b" marker-end="url(#arrB)"/>
    <text x="170" y="50" class="t-small t-b">${L('R', 'R')}</text>
    <text x="290" y="16" class="t-small t-dim">${L('거칠기에 맞춰 흐린 밉을 읽음', 'Rougher reads a blurrier mip')}</text>
    <rect x="290" y="46" width="64" height="64" class="f-dim"/>
    <text x="322" y="124" text-anchor="middle" class="t-small t-mono">0</text>
    <rect x="366" y="78" width="32" height="32" class="f-dim"/>
    <text x="382" y="124" text-anchor="middle" class="t-small t-mono">1</text>
    <rect x="410" y="94" width="16" height="16" class="f-dim"/>
    <text x="418" y="124" text-anchor="middle" class="t-small t-mono">2</text>
    <rect x="438" y="102" width="8" height="8" class="f-dim"/>
    <text x="442" y="124" text-anchor="middle" class="t-small t-mono">3</text>
    <rect x="458" y="106" width="4" height="4" class="f-dim"/>
    <text x="460" y="124" text-anchor="middle" class="t-small t-mono">4</text>
    <line x1="290" y1="140" x2="470" y2="140" class="d-b" marker-end="url(#arrB)"/>
    <text x="290" y="156" class="t-small">${L('거칠기 0', 'roughness 0')}</text>
    <text x="470" y="156" text-anchor="end" class="t-small">${L('거칠기 1', 'roughness 1')}</text>
    <text x="290" y="176" class="t-small t-a">${L('A는 조회 없음 (상수 앰비언트)', 'A does no lookup (constant ambient)')}</text>
  </svg>`,
  look: [
    'A의 금속 구는 검게 보이고 하이라이트 한 점만 남음. B는 하늘과 땅이 비침.',
    '반사를 "밉 0 고정"으로 바꾸면 거칠기 1의 구도 거울처럼 선명하게 비침. 거칠기 차이가 사라짐.',
    '"밉 레벨 보기"를 켜면 왼쪽(매끈) 구는 파랑(밉 0), 오른쪽(거침) 구는 빨강(최대 밉)으로 칠해짐.',
    '금속성을 0으로 낮추면 정면은 반사가 약하고 가장자리만 밝게 비침(프레넬).',
  ],
  refs: [
    { type: 'paper', title: 'Reflection and Refraction of Light from Arbitrary Surfaces (Blinn, Newell)', url: 'https://dl.acm.org/doi/10.1145/360349.360353', year: 1976, note: 'Communications of the ACM. 환경 매핑을 처음 제안.' },
    { type: 'talk', title: 'Real Shading in Unreal Engine 4 (Brian Karis)', year: 2013, note: 'SIGGRAPH 2013 PBS course. 거칠기별로 미리 적분한 큐브맵 밉과 split-sum 근사.' },
    { type: 'engine', title: 'Unity Manual: Reflection Probes', url: 'https://docs.unity3d.com/Manual/class-ReflectionProbe.html' },
    { type: 'article', title: 'LearnOpenGL: Specular IBL', url: 'https://learnopengl.com/PBR/IBL/Specular-IBL' },
  ],
  params: [
    { key: 'mode', label: '반사', type: 'select', group: '반사', options: [
      { value: 0, label: '없음 (상수 앰비언트)' },
      { value: 1, label: '큐브맵, 밉 0 고정' },
      { value: 2, label: '큐브맵, 거칠기별 밉' },
    ], a: 0, b: 2 },
    { key: 'fresnel', label: '프레넬 (Schlick)', type: 'bool', default: true, when: (p) => +p.mode > 0 },
    { key: 'envGain', label: '환경 세기', type: 'range', min: 0, max: 2, step: 0.05, default: 1, when: (p) => +p.mode > 0 },
    { key: 'lodScale', label: '거칠기→밉 배율', type: 'range', min: 0.2, max: 1.5, step: 0.05, default: 1, help: '1이면 거칠기 1에서 최대 밉', when: (p) => +p.mode === 2 },
    { key: 'showLod', label: '밉 레벨 보기', type: 'bool', default: false, when: (p) => +p.mode > 0 },
    { key: 'metal', label: '금속성', type: 'range', min: 0, max: 1, step: 0.05, default: 1, group: '재질' },
    { key: 'env', label: '환경', type: 'select', group: '장면', options: [
      { value: 'outdoor', label: '야외 (하늘, 해, 건물)' },
      { value: 'studio', label: '스튜디오 (조명 패널)' },
    ], default: 'outdoor', shared: true, reset: true },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Cubemap Reflections & Roughness Mips',
    summary: 'Store the surroundings in a cubemap and read it along the reflection direction. Without reflections, metal looks black and flat. Pick a blurrier mip level to match roughness, and rough and smooth metals look different.',
    views: { a: 'No reflection', b: 'Reflection + roughness mips' },
    controls: 'Mouse drag: rotate camera, wheel: zoom',
    info: `
    <p>A <b>cubemap</b> is a texture that stores the view around one point on the 6 faces of a cube. You look it up directly with a direction vector. Games place <b>reflection probes</b> around a level and bake cubemaps ahead of time.</p>
    <p>How it works:</p>
    <ul>
      <li>Reflect the view direction about the normal: R = reflect(-V, N).</li>
      <li>Read the color in direction R from the cubemap and use it as the reflection color. Fresnel (Schlick) sets its strength.</li>
      <li>Rough surfaces spread reflections wide. So the rougher the surface, the <b>blurrier the mip level</b> it reads (<code>textureLod</code>).</li>
    </ul>
    <p>Without reflections, metal has zero diffuse light, so only direct light highlights remain. So it looks like black plastic.</p>
    <p>Downsides and limits:</p>
    <ul>
      <li>This sample uses box filtered mips from <code>generateMipmap</code>. Real engines prefilter each mip with a GGX lobe. A box filter leaves blocky patterns in rough reflections.</li>
      <li>A cubemap is captured at one point, so it has no parallax as the object moves. Box projection (parallax-corrected) fixes this.</li>
      <li>Dynamic objects and the object itself do not appear in the cubemap.</li>
    </ul>`,
    look: [
      'The metal spheres in A look black, with only one highlight. In B, the sky and ground show in them.',
      'Set reflection to "Mip 0 fixed". Even the roughness 1 sphere reflects sharply like a mirror. The roughness difference disappears.',
      'Turn on "Show mip level". The left (smooth) sphere turns blue (mip 0), and the right (rough) sphere turns red (max mip).',
      'Lower metalness to 0. The front shows weak reflections, and only the edges reflect brightly (Fresnel).',
    ],
    refs: ['Communications of the ACM. First proposed environment mapping.', 'SIGGRAPH 2013 PBS course. Cubemap mips prefiltered per roughness, and the split-sum approximation.'],
    params: {
      mode: { label: 'Reflection', group: 'Reflection', options: { 0: 'None (constant ambient)', 1: 'Cubemap, mip 0 fixed', 2: 'Cubemap, roughness mips' } },
      fresnel: 'Fresnel (Schlick)',
      envGain: 'Environment strength',
      lodScale: { label: 'Roughness to mip scale', help: 'At 1, roughness 1 uses the max mip' },
      showLod: 'Show mip level',
      metal: { label: 'Metalness', group: 'Material' },
      env: { label: 'Environment', group: 'Scene', options: { outdoor: 'Outdoor (sky, sun, buildings)', studio: 'Studio (light panels)' } },
      autoRotate: 'Auto rotate',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params, G = U.geometry;
    const rng = ctx.rng;

    // ── 절차적 큐브맵 ──
    const FACE = 128, MIPS = Math.log2(FACE) + 1;
    const SUN = (() => { const v = [0.5, 0.42, -0.6], l = Math.hypot(...v); return v.map((x) => x / l); })();
    const blds = [];
    for (let i = 0; i < 26; i++) blds.push({ a0: rng.range(0, U.TAU), w: rng.range(0.08, 0.3), h: rng.range(0.05, 0.35), c: rng.range(0.25, 0.5) });
    const panels = [
      { d: [0.8, 0.35, 0.5], s: 0.35, c: [1, 0.95, 0.85] },
      { d: [-0.85, 0.2, 0.3], s: 0.25, c: [0.4, 0.7, 1] },
      { d: [0.0, 0.95, 0.0], s: 0.45, c: [1, 1, 1] },
      { d: [-0.2, 0.15, -0.95], s: 0.2, c: [1, 0.5, 0.3] },
    ].map((p) => { const l = Math.hypot(...p.d); return { ...p, d: p.d.map((x) => x / l) }; });
    const envColor = (x, y, z) => {
      if (P.env === 'studio') {
        let c = [0.05, 0.05, 0.06];
        if (y < 0) { const ch = (Math.floor(x / -y * 2) + Math.floor(z / -y * 2)) & 1; c = ch ? [0.12, 0.12, 0.13] : [0.07, 0.07, 0.08]; }
        for (const p of panels) {
          const d = x * p.d[0] + y * p.d[1] + z * p.d[2];
          if (d > 1 - p.s * p.s * 0.5) c = p.c;
        }
        return c;
      }
      if (y < 0) {
        const t = -y, gx = x / Math.max(t, 0.02), gz = z / Math.max(t, 0.02);
        const ch = (Math.floor(gx) + Math.floor(gz)) & 1;
        const base = ch ? [0.32, 0.27, 0.2] : [0.24, 0.2, 0.15];
        const f = Math.min(1, t * 6);
        return base.map((v, i) => U.lerp([0.7, 0.68, 0.62][i], v, f));
      }
      const az = Math.atan2(z, x), el = Math.asin(Math.min(1, y));
      for (const b of blds) {
        const d = Math.abs(U.angleDiff(az, b.a0));
        if (d < b.w * 0.5 && el < b.h) {
          const win = (Math.floor(az * 60) & 1) && (Math.floor(el * 60) & 1) ? 0.35 : 0;
          return [b.c * 0.5 + win, b.c * 0.55 + win * 0.9, b.c * 0.7 + win * 0.5];
        }
      }
      const s = x * SUN[0] + y * SUN[1] + z * SUN[2];
      if (s > 0.995) return [1, 1, 0.95];
      const glow = Math.pow(Math.max(s, 0), 64) * 0.6;
      const t = Math.pow(1 - y, 3);
      return [U.lerp(0.18, 0.75, t) + glow, U.lerp(0.38, 0.8, t) + glow * 0.9, U.lerp(0.75, 0.85, t) + glow * 0.6];
    };
    const cube = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cube);
    const dirs = [
      (u, v) => [1, -v, -u], (u, v) => [-1, -v, u], (u, v) => [u, 1, v],
      (u, v) => [u, -1, -v], (u, v) => [u, -v, 1], (u, v) => [-u, -v, -1],
    ];
    const px = new Uint8Array(FACE * FACE * 4);
    for (let f = 0; f < 6; f++) {
      for (let y = 0; y < FACE; y++) for (let x = 0; x < FACE; x++) {
        const d = dirs[f](2 * (x + 0.5) / FACE - 1, 2 * (y + 0.5) / FACE - 1), l = Math.hypot(d[0], d[1], d[2]);
        const c = envColor(d[0] / l, d[1] / l, d[2] / l), i = (y * FACE + x) * 4;
        px[i] = U.clamp(c[0], 0, 1) * 255; px[i + 1] = U.clamp(c[1], 0, 1) * 255; px[i + 2] = U.clamp(c[2], 0, 1) * 255; px[i + 3] = 255;
      }
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, 0, gl.RGBA8, FACE, FACE, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
    }
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // ── 장면 ──
    const T = M.translation, S = M.scaling;
    const sph = G.upload(gl, G.sphere(1, 48, 24)), tor = G.upload(gl, G.torus(0.9, 0.3, 64, 32)), floor = G.upload(gl, G.plane(14, 1, 1));
    const ROUGH = [0, 0.25, 0.5, 0.75, 1];
    const objs = ROUGH.map((r, i) => ({ m: sph, w: M.mul(T((i - 2) * 1.75, 0.75, 0.8), S(0.75)), rough: r, c: [0.95, 0.8, 0.55], metalScale: 1 }));
    objs.push({ m: tor, w: M.mul(T(0, 1.4, -1.6), M.rotationX(1.2)), rough: 0.1, c: [0.9, 0.92, 0.95], metalScale: 1 });
    objs.push({ m: floor, w: M.create(), rough: 0.85, c: [0.45, 0.45, 0.47], metalScale: 0 });
    for (const o of objs) o.n = M.normalMatrix(o.w);

    const prog = U.gl.program(gl, `#version 300 es
      in vec3 a_position; in vec3 a_normal;
      uniform mat4 u_vp; uniform mat4 u_world; uniform mat3 u_nmat;
      out vec3 v_pos; out vec3 v_n;
      void main(){
        vec4 wp = u_world * vec4(a_position, 1.0);
        v_pos = wp.xyz; v_n = u_nmat * a_normal;
        gl_Position = u_vp * wp;
      }`, `#version 300 es
      precision highp float;
      uniform samplerCube u_env; uniform vec3 u_eye; uniform vec3 u_sun;
      uniform vec3 u_color; uniform float u_rough; uniform float u_metal;
      uniform float u_mode; uniform float u_fresnel; uniform float u_gain; uniform float u_lodScale; uniform float u_maxLod; uniform float u_showLod;
      in vec3 v_pos; in vec3 v_n;
      out vec4 o_color;
      vec3 toLin(vec3 c) { return pow(c, vec3(2.2)); }
      void main(){
        vec3 N = normalize(v_n), V = normalize(u_eye - v_pos), R = reflect(-V, N);
        float NoV = max(dot(N, V), 0.0);
        vec3 alb = toLin(u_color);
        vec3 F0 = mix(vec3(0.04), alb, u_metal);
        vec3 diffC = alb * (1.0 - u_metal);
        // direct sun light: Lambert + Blinn-Phong
        vec3 H = normalize(u_sun + V);
        float a = max(u_rough * u_rough, 0.002);
        float shin = max(2.0 / (a * a) - 2.0, 1.0);
        float NoL = max(dot(N, u_sun), 0.0);
        vec3 sunC = vec3(1.0, 0.95, 0.88) * 2.2;
        vec3 spec = F0 * pow(max(dot(N, H), 0.0), shin) * (shin + 8.0) / 25.13;
        vec3 c = (diffC + spec) * sunC * NoL;
        float lod = 0.0;
        if (u_mode < 0.5) {
          c += diffC * vec3(0.22, 0.24, 0.3);
        } else {
          vec3 F = F0;
          if (u_fresnel > 0.5) F = F0 + (max(vec3(1.0 - u_rough), F0) - F0) * pow(1.0 - NoV, 5.0);
          lod = u_mode < 1.5 ? 0.0 : clamp(u_rough * u_lodScale * u_maxLod, 0.0, u_maxLod);
          vec3 env = toLin(textureLod(u_env, R, lod).rgb);
          vec3 irr = toLin(textureLod(u_env, N, u_maxLod).rgb);
          c += (diffC * irr * (1.0 - F) + env * F) * u_gain;
          if (u_showLod > 0.5) c = mix(c, mix(vec3(0.1, 0.35, 1.0), vec3(1.0, 0.25, 0.15), lod / u_maxLod), 0.6);
        }
        c = c / (1.0 + c);
        o_color = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
      }`);
    const sky = U.gl.program(gl, `#version 300 es
      in vec2 a_pos; uniform mat4 u_invVP; uniform vec3 u_eye; out vec3 v_dir;
      void main(){
        // homogeneous direction stays linear in screen space (no divide before interpolation)
        vec4 p = u_invVP * vec4(a_pos, 1.0, 1.0);
        v_dir = p.xyz - u_eye * p.w;
        gl_Position = vec4(a_pos, 1.0, 1.0);
      }`, `#version 300 es
      precision highp float;
      uniform samplerCube u_env; in vec3 v_dir; out vec4 o_color;
      void main(){
        vec3 c = pow(textureLod(u_env, normalize(v_dir), 0.0).rgb, vec3(2.2));
        c = c / (1.0 + c);
        o_color = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
      }`);
    const quad = U.gl.quad(gl);

    const cam = { yaw: 0.25, pitch: 0.22, dist: 8.5, drag: false, lx: 0, ly: 0 };

    return {
      update(dt) {
        if (P.autoRotate && !cam.drag) cam.yaw += dt * 0.15;
        if (ctx.input.mouse.wheel) cam.dist = U.clamp(cam.dist * Math.pow(1.12, ctx.input.mouse.wheel), 2.5, 20);
      },
      onPointer(type, m) {
        if (type === 'down') { cam.drag = true; cam.lx = m.x; cam.ly = m.y; }
        else if (type === 'up' || type === 'leave') cam.drag = false;
        else if (type === 'move' && cam.drag) {
          cam.yaw -= (m.x - cam.lx) * 0.008; cam.pitch = U.clamp(cam.pitch + (m.y - cam.ly) * 0.008, -0.3, 1.5);
          cam.lx = m.x; cam.ly = m.y;
        }
      },
      render() {
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const tgt = [0, 0.8, 0];
        const eye = M.orbitEye(tgt, cam.yaw, cam.pitch, cam.dist);
        const proj = M.perspective(U.rad(50), ctx.width / ctx.height, 0.1, 100);
        const vp = M.multiply(proj, M.lookAt(eye, tgt));
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_CUBE_MAP, cube);

        gl.disable(gl.DEPTH_TEST);
        sky.use();
        gl.uniformMatrix4fv(sky.u('u_invVP'), false, M.invert(vp));
        gl.uniform3fv(sky.u('u_eye'), eye);
        gl.uniform1i(sky.u('u_env'), 0);
        quad.draw(sky);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        prog.use();
        gl.uniformMatrix4fv(prog.u('u_vp'), false, vp);
        gl.uniform3fv(prog.u('u_eye'), eye);
        gl.uniform3fv(prog.u('u_sun'), SUN);
        gl.uniform1i(prog.u('u_env'), 0);
        gl.uniform1f(prog.u('u_mode'), +P.mode);
        gl.uniform1f(prog.u('u_fresnel'), P.fresnel ? 1 : 0);
        gl.uniform1f(prog.u('u_gain'), P.envGain);
        gl.uniform1f(prog.u('u_lodScale'), P.lodScale);
        gl.uniform1f(prog.u('u_maxLod'), MIPS - 1);
        gl.uniform1f(prog.u('u_showLod'), P.showLod ? 1 : 0);
        for (const o of objs) {
          gl.uniformMatrix4fv(prog.u('u_world'), false, o.w);
          gl.uniformMatrix3fv(prog.u('u_nmat'), false, o.n);
          gl.uniform3fv(prog.u('u_color'), o.c);
          gl.uniform1f(prog.u('u_rough'), o.rough);
          gl.uniform1f(prog.u('u_metal'), P.metal * o.metalScale);
          o.m.draw(prog);
        }
        gl.disable(gl.CULL_FACE);

        const mode = +P.mode;
        const lodOf = (r) => (mode === 2 ? Math.min(r * P.lodScale * (MIPS - 1), MIPS - 1) : 0);
        ctx.stat(GTL.L('반사', 'Reflection'), [GTL.L('없음', 'None'), GTL.L('밉 0 고정', 'Mip 0 fixed'), GTL.L('거칠기별 밉', 'Roughness mips')][mode]);
        ctx.stat(GTL.L('큐브맵', 'Cubemap'), GTL.L(`${FACE}² x 6면, 밉 ${MIPS}단계`, `${FACE}² x 6 faces, ${MIPS} mip levels`));
        ctx.stat(GTL.L('구 거칠기→밉', 'Sphere roughness to mip'), mode ? ROUGH.map((r) => lodOf(r).toFixed(1)).join(', ') : '-');
        ctx.stat(GTL.L('픽셀당 큐브맵 조회', 'Cubemap lookups per pixel'), mode ? 2 : 0);
      },
    };
  },
});
