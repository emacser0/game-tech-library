// 프레넬 반사 (Schlick 근사) & 림 라이트
GTL.register({
  id: 'fresnel-rim',
  title: '프레넬 반사 & 림 라이트',
  summary: '모든 물체는 스치는 각도에서 볼수록 거울처럼 반사함(프레넬). 반사율이 상수면 물이 평평한 페인트처럼 보임. Schlick 근사를 쓰면 수평선 쪽에 하늘이 비침.',
  renderer: 'webgl',
  views: { a: '상수 반사율', b: 'Schlick 프레넬 + 림' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌',
  info: `
    <p><b>프레넬(Fresnel) 반사</b>: 반사율이 보는 각도에 따라 달라지는 현상.</p>
    <ul>
      <li>수직으로 볼 때의 반사율 <b>F0</b>: 물 ≈ 0.02, 유리 ≈ 0.04, 금속 0.5~1.0.</li>
      <li>시선이 표면을 스칠수록(θ→90°) 모든 재질의 반사율이 <b>1에 가까워짐</b>.</li>
    </ul>
    <p>바다를 보면 발밑은 물속(짙은 청록)이 보이고 수평선으로 갈수록 하늘이 비침. 이것이 프레넬 효과. 반사율을 상수로 두면 이 그라데이션이 사라져 수면이 칠한 판처럼 보임.</p>
    <p><b>Schlick 근사</b> <code>F = F0 + (1−F0)(1−cosθ)^5</code>는 프레넬 방정식을 싸게 흉내 냄.</p>
    <p><b>림 라이트(rim light)</b>는 <code>pow(1 − dot(N,V), p)</code>로 실루엣 부근을 밝히는 연출 기법. 모양은 프레넬과 같지만 물리 기반이 아닌 "역광 테두리" 연출. 캐릭터를 배경에서 떼어 잘 보이게 할 때 많이 씀.</p>`,
  // 도식: 보는 각도에 따른 반사율. 상수 반사율과 Schlick 프레넬
  diagram: (L) => `<svg viewBox="0 0 540 180" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="40" y="16" class="t-small t-dim">${L('반사율 대 보는 각도 (F0 = 0.04)', 'Reflectance vs view angle (F0 = 0.04)')}</text>
    <line x1="40" y1="140" x2="280" y2="140" class="d-dim"/>
    <line x1="40" y1="140" x2="40" y2="30" class="d-dim"/>
    <line x1="40" y1="135.6" x2="280" y2="135.6" class="d-a"/>
    <polyline points="40.0,135.6 44.0,135.6 48.0,135.6 52.0,135.6 56.0,135.6 60.0,135.6 64.0,135.6 68.0,135.6 72.0,135.6 76.0,135.6 80.0,135.6 84.0,135.6 88.0,135.6 92.0,135.6 96.0,135.6 100.0,135.6 104.0,135.6 108.0,135.6 112.0,135.6 116.0,135.6 120.0,135.6 124.0,135.6 128.0,135.6 132.0,135.6 136.0,135.6 140.0,135.6 144.0,135.5 148.0,135.5 152.0,135.5 156.0,135.4 160.0,135.4 164.0,135.3 168.0,135.2 172.0,135.0 176.0,134.9 180.0,134.6 184.0,134.3 188.0,134.0 192.0,133.5 196.0,133.0 200.0,132.3 204.0,131.5 208.0,130.5 212.0,129.3 216.0,127.8 220.0,126.1 224.0,124.1 228.0,121.7 232.0,119.0 236.0,115.7 240.0,112.0 244.0,107.7 248.0,102.7 252.0,97.0 256.0,90.5 260.0,83.1 264.0,74.8 268.0,65.4 272.0,54.9 276.0,43.1 280.0,30.0" class="d-b"/>
    <text x="40" y="154" text-anchor="middle" class="t-small t-mono">0</text>
    <text x="280" y="154" text-anchor="middle" class="t-small t-mono">90</text>
    <text x="160" y="154" text-anchor="middle" class="t-small t-dim">${L('각도 (수직 0, 스침 90)', 'angle (head-on 0, grazing 90)')}</text>
    <text x="46" y="130" class="t-small t-a">${L('A 상수', 'A constant')}</text>
    <text x="276" y="40" text-anchor="end" class="t-small t-b">${L('B Schlick', 'B Schlick')}</text>
    <line x1="300" y1="130" x2="530" y2="130" class="d-line"/>
    <circle cx="310" cy="50" r="5" class="f-dim"/>
    <line x1="310" y1="50" x2="350" y2="128" class="d-dim" marker-end="url(#arr)"/>
    <line x1="310" y1="50" x2="520" y2="126" class="d-dim" marker-end="url(#arr)"/>
    <text x="330" y="150" class="t-small">${L('발밑: 물속이 보임', 'near: see into water')}</text>
    <text x="530" y="116" text-anchor="end" class="t-small">${L('수평선: 하늘이 비침', 'horizon: sky reflects')}</text>
    <text x="300" y="172" class="t-small">${L('스치는 각도일수록 반사율이 1에 가까워짐', 'At grazing angles reflectance nears 1')}</text>
  </svg>`,
  look: [
    'A의 수면을 보면 어디서나 같은 비율로 하늘이 섞여 평평함. B는 발밑이 어둡고 수평선 쪽이 하늘처럼 밝음.',
    '카메라를 최대한 낮추면(아래에서 위로 드래그) B의 수면이 거의 거울이 됨.',
    'B에서 F0를 1.0 가까이 올리면 금속처럼 모든 각도에서 반사함. 프레넬 효과는 F0가 작은 유전체에서 가장 큼.',
    '림 라이트를 켜고 지수를 바꾸면 구 테두리 빛의 두께가 바뀜. 어두운 구가 배경과 분리되어 보임.',
  ],
  refs: [
    { type: 'paper', title: 'An Inexpensive BRDF Model for Physically-based Rendering (Christophe Schlick)', year: 1994, note: 'Computer Graphics Forum (Eurographics 94). Schlick 프레넬 근사.' },
    { type: 'talk', title: 'Real Shading in Unreal Engine 4 (Brian Karis)', url: 'https://blog.selfshadow.com/publications/s2013-shading-course/', year: 2013, note: 'SIGGRAPH 2013 PBS course.' },
    { type: 'article', title: 'Everything has Fresnel (John Hable, Filmic Worlds)', url: 'http://filmicworlds.com/blog/everything-has-fresnel/', year: 2010 },
    { type: 'book', title: 'Real-Time Rendering, 4th ed., 9.5 Fresnel Reflectance (Akenine-Möller et al.)', year: 2018 },
  ],
  params: [
    { key: 'fresnel', label: '반사율', type: 'select', group: '프레넬', options: [
      { value: 0, label: '반사 없음' },
      { value: 1, label: '상수 반사율' },
      { value: 2, label: 'Schlick 프레넬' },
    ], a: 1, b: 2 },
    { key: 'constR', label: '상수 반사율', type: 'range', min: 0, max: 1, step: 0.01, default: 0.35, when: (p) => +p.fresnel === 1 },
    { key: 'f0', label: 'F0 (수직 반사율)', type: 'range', min: 0, max: 1, step: 0.01, default: 0.02, when: (p) => +p.fresnel === 2, help: '물 0.02, 유리 0.04, 금속 0.5~1' },
    { key: 'rim', label: '림 라이트', type: 'bool', a: false, b: true, group: '림 라이트' },
    { key: 'rimPow', label: '림 지수', type: 'range', min: 1, max: 10, step: 0.1, default: 3.5, when: (p) => p.rim },
    { key: 'rimInt', label: '림 세기', type: 'range', min: 0, max: 3, step: 0.05, default: 1.2, when: (p) => p.rim },
    { key: 'waves', label: '물결', type: 'bool', default: true, shared: true, group: '장면' },
    { key: 'sunElev', label: '태양 고도 (°)', type: 'range', min: 2, max: 80, step: 1, default: 18, shared: true },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: false, shared: true },
  ],
  en: {
    title: 'Fresnel Reflection & Rim Light',
    summary: 'Every surface reflects more like a mirror as you view it at a grazing angle (Fresnel). With a constant reflectance, water looks like flat paint. With the Schlick approximation, the sky shows near the horizon.',
    views: { a: 'Constant reflectance', b: 'Schlick Fresnel + rim' },
    controls: 'Mouse drag: rotate camera. Wheel: zoom.',
    info: `
    <p><b>Fresnel reflection</b>: reflectance changes with the viewing angle.</p>
    <ul>
      <li>Reflectance when you look straight on is <b>F0</b>: water ≈ 0.02, glass ≈ 0.04, metals 0.5~1.0.</li>
      <li>As the view grazes the surface (θ→90°), the reflectance of every material <b>gets close to 1</b>.</li>
    </ul>
    <p>When you look at the sea, you see into the water (dark teal) at your feet. Toward the horizon, the sky reflects more. This is the Fresnel effect. With a constant reflectance, this gradient is gone and the water looks like a painted board.</p>
    <p>The <b>Schlick approximation</b> <code>F = F0 + (1−F0)(1−cosθ)^5</code> is a cheap stand-in for the Fresnel equations.</p>
    <p><b>Rim light</b> brightens the area near the silhouette with <code>pow(1 − dot(N,V), p)</code>. Its shape is like Fresnel, but it is not physically based. It is an artistic "backlit edge". It is often used to separate a character from the background.</p>`,
    look: [
      'Look at the water in A. The sky mixes in at the same rate everywhere, so it looks flat. In B, the water at your feet is dark, and it gets as bright as the sky toward the horizon.',
      'Lower the camera as far as it goes (drag from bottom to top). The water in B becomes almost a mirror.',
      'In B, raise F0 close to 1.0. It reflects at every angle, like metal. The Fresnel effect is strongest on dielectrics with a small F0.',
      'Turn on rim light and change the exponent. The thickness of the glow on the sphere edges changes. The dark sphere stands out from the background.',
    ],
    refs: ['Computer Graphics Forum (Eurographics 94). The Schlick Fresnel approximation.', 'SIGGRAPH 2013 PBS course.', null, null],
    params: {
      fresnel: { label: 'Reflectance', group: 'Fresnel', options: { 0: 'No reflection', 1: 'Constant reflectance', 2: 'Schlick Fresnel' } },
      constR: 'Constant reflectance',
      f0: { label: 'F0 (normal incidence reflectance)', help: 'Water 0.02, glass 0.04, metal 0.5~1' },
      rim: { label: 'Rim light', group: 'Rim light' },
      rimPow: 'Rim exponent',
      rimInt: 'Rim intensity',
      waves: { label: 'Waves', group: 'Scene' },
      sunElev: 'Sun elevation (°)',
      autoRotate: 'Auto rotate',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params, G = U.geometry;
    const water = G.upload(gl, G.plane(400, 1, 1));
    const sphere = G.upload(gl, G.sphere(1, 48, 24));
    const quad = U.gl.quad(gl);

    const COMMON = `
      uniform vec3 u_sun; uniform vec3 u_eye; uniform float u_mode; uniform float u_constR; uniform float u_f0;
      uniform float u_rim; uniform float u_rimPow; uniform float u_rimInt;
      vec3 sky(vec3 d) {
        float y = max(d.y, 0.0);
        vec3 c = mix(vec3(0.85, 0.78, 0.7), vec3(0.18, 0.38, 0.78), pow(y, 0.45));
        float s = max(dot(d, u_sun), 0.0);
        c += vec3(1.0, 0.75, 0.45) * (pow(s, 8.0) * 0.35 + pow(s, 900.0) * 30.0);
        return d.y < 0.0 ? mix(c, vec3(0.3, 0.32, 0.35), clamp(-d.y * 4.0, 0.0, 1.0)) : c;
      }
      float reflectance(float NoV) {
        if (u_mode < 0.5) return 0.0;
        if (u_mode < 1.5) return u_constR;
        return u_f0 + (1.0 - u_f0) * pow(1.0 - clamp(NoV, 0.0, 1.0), 5.0);
      }
      vec3 finish(vec3 c) { c = c / (1.0 + c); return pow(c, vec3(1.0 / 2.2)); }`;

    const waterProg = U.gl.program(gl, `
      attribute vec3 a_position; uniform mat4 u_vp; varying vec3 v_pos;
      void main(){ v_pos = a_position; gl_Position = u_vp * vec4(a_position, 1.0); }`, `
      precision highp float;
      uniform float u_time; uniform float u_waves;
      varying vec3 v_pos;
      ${COMMON}
      void main(){
        vec2 p = v_pos.xz;
        vec2 g = vec2(0.0);
        if (u_waves > 0.5) {
          vec2 d1 = vec2(0.8, 0.6), d2 = vec2(-0.5, 0.86), d3 = vec2(0.2, -0.98), d4 = vec2(-0.9, -0.3);
          g += d1 * 0.06 * cos(dot(d1, p) * 1.3 + u_time * 1.4);
          g += d2 * 0.05 * cos(dot(d2, p) * 2.1 + u_time * 1.9);
          g += d3 * 0.035 * cos(dot(d3, p) * 3.7 + u_time * 2.6);
          g += d4 * 0.02 * cos(dot(d4, p) * 7.3 + u_time * 3.4);
        }
        vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
        vec3 V = normalize(u_eye - v_pos);
        float NoV = max(dot(N, V), 0.0);
        vec3 R = reflect(-V, N);
        R.y = abs(R.y);
        vec3 deep = vec3(0.01, 0.06, 0.09) + vec3(0.02, 0.1, 0.1) * max(dot(N, u_sun), 0.0);
        float F = reflectance(NoV);
        vec3 c = mix(deep, sky(R), F);
        float dist = length(v_pos.xz - u_eye.xz);
        c = mix(c, sky(normalize(vec3(-V.x, 0.02, -V.z))), smoothstep(80.0, 190.0, dist));
        gl_FragColor = vec4(finish(c), 1.0);
      }`);
    const objProg = U.gl.program(gl, `
      attribute vec3 a_position; attribute vec3 a_normal;
      uniform mat4 u_vp; uniform mat4 u_world;
      varying vec3 v_pos; varying vec3 v_n;
      void main(){
        vec4 wp = u_world * vec4(a_position, 1.0);
        v_pos = wp.xyz; v_n = a_normal;
        gl_Position = u_vp * wp;
      }`, `
      precision highp float;
      uniform vec3 u_color;
      varying vec3 v_pos; varying vec3 v_n;
      ${COMMON}
      void main(){
        vec3 N = normalize(v_n), V = normalize(u_eye - v_pos);
        float NoV = max(dot(N, V), 0.0);
        vec3 R = reflect(-V, N);
        float ndl = max(dot(N, u_sun), 0.0);
        vec3 diff = u_color * (ndl * vec3(1.0, 0.85, 0.7) * 1.5 + sky(N) * 0.25);
        float F = reflectance(NoV);
        vec3 c = mix(diff, sky(R), F);
        if (u_rim > 0.5) c += vec3(0.55, 0.8, 1.0) * pow(1.0 - NoV, u_rimPow) * u_rimInt;
        gl_FragColor = vec4(finish(c), 1.0);
      }`);
    const skyProg = U.gl.program(gl, `
      attribute vec2 a_pos; varying vec2 v_ndc;
      void main(){ v_ndc = a_pos; gl_Position = vec4(a_pos, 0.999, 1.0); }`, `
      precision highp float;
      uniform mat4 u_invVP;
      varying vec2 v_ndc;
      ${COMMON}
      void main(){
        vec4 p = u_invVP * vec4(v_ndc, 1.0, 1.0);
        vec3 d = normalize(p.xyz / p.w - u_eye);
        gl_FragColor = vec4(finish(sky(d)), 1.0);
      }`);

    const cam = { yaw: 0.0, pitch: 0.16, dist: 9, drag: false, lx: 0, ly: 0 };
    let t = 0;
    const balls = [
      { p: [0, 0.75, 0], s: 1.0, c: [0.05, 0.05, 0.06] },
      { p: [-2.6, 0.55, 1.2], s: 0.7, c: [0.8, 0.25, 0.15] },
      { p: [2.4, 0.5, -0.8], s: 0.65, c: [0.9, 0.85, 0.75] },
    ];

    return {
      update(dt) {
        t += dt;
        if (P.autoRotate && !cam.drag) cam.yaw += dt * 0.12;
        if (ctx.input.mouse.wheel) cam.dist = U.clamp(cam.dist * Math.pow(1.12, ctx.input.mouse.wheel), 3, 40);
      },
      onPointer(type, m) {
        if (type === 'down') { cam.drag = true; cam.lx = m.x; cam.ly = m.y; }
        else if (type === 'up' || type === 'leave') cam.drag = false;
        else if (type === 'move' && cam.drag) {
          cam.yaw -= (m.x - cam.lx) * 0.008; cam.pitch = U.clamp(cam.pitch + (m.y - cam.ly) * 0.006, 0.02, 1.5);
          cam.lx = m.x; cam.ly = m.y;
        }
      },
      render() {
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const proj = M.perspective(U.rad(55), ctx.width / ctx.height, 0.1, 500);
        const eye = M.orbitEye([0, 0.4, 0], cam.yaw, cam.pitch, cam.dist);
        const vp = M.multiply(proj, M.lookAt(eye, [0, 0.4, 0]));
        const el = U.rad(P.sunElev), sun = [Math.cos(el) * 0.3, Math.sin(el), -Math.cos(el) * 0.95];
        const sl = Math.hypot(...sun), sunN = sun.map((v) => v / sl);
        const common = (p) => {
          gl.uniform3fv(p.u('u_sun'), sunN);
          gl.uniform3fv(p.u('u_eye'), eye);
          gl.uniform1f(p.u('u_mode'), +P.fresnel);
          gl.uniform1f(p.u('u_constR'), P.constR);
          gl.uniform1f(p.u('u_f0'), P.f0);
          gl.uniform1f(p.u('u_rim'), P.rim ? 1 : 0);
          gl.uniform1f(p.u('u_rimPow'), P.rimPow);
          gl.uniform1f(p.u('u_rimInt'), P.rimInt);
        };
        gl.disable(gl.DEPTH_TEST);
        skyProg.use(); common(skyProg);
        gl.uniformMatrix4fv(skyProg.u('u_invVP'), false, M.invert(vp));
        quad.draw(skyProg);

        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        waterProg.use(); common(waterProg);
        gl.uniformMatrix4fv(waterProg.u('u_vp'), false, vp);
        gl.uniform1f(waterProg.u('u_time'), t);
        gl.uniform1f(waterProg.u('u_waves'), P.waves ? 1 : 0);
        water.draw(waterProg);

        gl.enable(gl.CULL_FACE);
        objProg.use(); common(objProg);
        gl.uniformMatrix4fv(objProg.u('u_vp'), false, vp);
        for (const b of balls) {
          const bob = P.waves ? Math.sin(t * 1.3 + b.p[0]) * 0.05 : 0;
          gl.uniformMatrix4fv(objProg.u('u_world'), false, M.mul(M.translation(b.p[0], b.p[1] + bob, b.p[2]), M.scaling(b.s)));
          gl.uniform3fv(objProg.u('u_color'), b.c);
          sphere.draw(objProg);
        }
        const F = (deg) => {
          const m = +P.fresnel;
          if (m === 0) return 0;
          if (m === 1) return P.constR;
          return P.f0 + (1 - P.f0) * Math.pow(1 - Math.cos(U.rad(deg)), 5);
        };
        ctx.stat(GTL.L('반사율 0° / 60° / 85°', 'Reflectance 0° / 60° / 85°'), `${F(0).toFixed(2)} / ${F(60).toFixed(2)} / ${F(85).toFixed(2)}`);
        ctx.stat(GTL.L('카메라 고도각', 'Camera pitch'), U.deg(cam.pitch).toFixed(0) + '°');
      },
    };
  },
});
