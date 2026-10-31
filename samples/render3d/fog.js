// 안개: 선형 / 지수 / 지수² / 높이 안개 (+ 태양 방향 산란)
GTL.register({
  id: 'fog',
  title: '안개 (Linear, Exp, Exp², 높이 안개)',
  summary: '거리에 따라 장면 색을 안개색과 섞으면 깊이감이 생김. 먼 곳의 팝인과 원경 경계도 숨김. 감쇠 곡선과 높이별 밀도에 따라 분위기가 크게 바뀜.',
  renderer: 'webgl',
  views: { a: '선형 안개', b: '높이 안개 + 태양 산란' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌(거리)',
  info: `
    <p>안개는 픽셀 색을 거리에 따라 안개색과 섞는 효과. 깊이감을 주고, 먼 곳의 팝인과 그리기 거리 한계를 숨기는 데 필요.</p>
    <p>안개 계수 <code>f</code>(1 = 보임, 0 = 완전히 안개)로 <code>mix(fogColor, color, f)</code>를 계산. <code>f</code>를 구하는 방식:</p>
    <ul>
      <li><b>선형</b>: <code>(end − d)/(end − start)</code>. 시작과 끝이 분명해 경계가 띠처럼 보이기 쉬움(OpenGL 고정 파이프라인 GL_LINEAR).</li>
      <li><b>지수</b>: <code>exp(−density * d)</code>. 균일한 매질의 투과율(Beer-Lambert 법칙).</li>
      <li><b>지수²</b>: <code>exp(−(density * d)²)</code>. 가까이는 맑고 어느 거리부터 급격히 짙어짐.</li>
    </ul>
    <p><b>높이 안개</b>: 밀도가 고도에 따라 <code>a * e^(−b * y)</code>로 줄어든다고 봄. 시선을 따라 밀도를 해석적으로 적분(Quilez). 낮은 골짜기는 짙고, 기둥 꼭대기와 하늘은 맑음. 태양 쪽을 볼 때 안개색을 밝히면 간단한 <b>내산란</b> 효과가 됨.</p>
    <p>주의: 안개색과 하늘의 수평선 색을 맞춰야 원경이 하늘에 자연스럽게 녹아듦. 오픈월드 게임은 이 원리로 먼 LOD 전환과 그리기 거리 한계를 감춤.</p>`,
  // 도식: 거리별 안개 계수 커브(선형, 지수, 지수²)와 높이 안개의 밀도 분포
  diagram: (L) => `<svg viewBox="0 0 540 168" xmlns="http://www.w3.org/2000/svg">
    <text x="30" y="16" class="t-small t-dim">${L('보이는 정도 f 대 거리', 'Visibility f vs distance')}</text>
    <line x1="30" y1="140" x2="260" y2="140" class="d-dim"/>
    <line x1="30" y1="140" x2="30" y2="30" class="d-dim"/>
    <polyline points="30.0,30.0 76.0,30.0 214.0,140.0 260.0,140.0" class="d-a"/>
    <polyline points="30.0,30.0 35.8,37.9 41.5,45.3 47.2,52.2 53.0,58.5 58.8,64.4 64.5,69.9 70.2,74.9 76.0,79.6 81.8,84.0 87.5,88.0 93.2,91.8 99.0,95.3 104.8,98.5 110.5,101.5 116.2,104.3 122.0,106.9 127.8,109.3 133.5,111.5 139.2,113.5 145.0,115.5 150.8,117.2 156.5,118.9 162.2,120.4 168.0,121.8 173.8,123.1 179.5,124.3 185.2,125.5 191.0,126.5 196.8,127.5 202.5,128.4 208.2,129.2 214.0,130.0 219.8,130.7 225.5,131.4 231.2,132.0 237.0,132.6 242.8,133.1 248.5,133.6 254.2,134.1 260.0,134.5" class="d-line"/>
    <polyline points="30.0,30.0 35.8,30.3 41.5,31.3 47.2,33.0 53.0,35.2 58.8,38.0 64.5,41.3 70.2,45.2 76.0,49.4 81.8,53.9 87.5,58.7 93.2,63.7 99.0,68.8 104.8,74.0 110.5,79.2 116.2,84.3 122.0,89.3 127.8,94.1 133.5,98.7 139.2,103.1 145.0,107.2 150.8,111.0 156.5,114.6 162.2,117.8 168.0,120.7 173.8,123.4 179.5,125.8 185.2,127.9 191.0,129.7 196.8,131.4 202.5,132.8 208.2,134.0 214.0,135.0 219.8,135.9 225.5,136.7 231.2,137.3 237.0,137.8 242.8,138.3 248.5,138.6 254.2,138.9 260.0,139.1" class="d-line" stroke-dasharray="4 3"/>
    <text x="150" y="62" class="t-small t-a">${L('A 선형: 경계가 띠로 보임', 'A linear: hard start, end')}</text>
    <text x="48" y="114" class="t-small">${L('지수', 'exp')}</text>
    <text x="163.4" y="93.8" class="t-small">${L('지수²', 'exp²')}</text>
    <text x="30" y="160" class="t-small t-mono">${L('color = mix(fogColor, color, f)', 'color = mix(fogColor, color, f)')}</text>
    <text x="320" y="16" class="t-small t-dim">${L('B 높이 안개: 밀도 = a e^(-b y)', 'B height fog: density = a e^(-b y)')}</text>
    <line x1="320" y1="140" x2="520" y2="140" class="d-dim"/>
    <line x1="320" y1="140" x2="320" y2="30" class="d-dim"/>
    <polyline points="500.0,140.0 486.2,137.2 473.4,134.5 461.6,131.8 450.7,129.0 440.7,126.2 431.4,123.5 422.8,120.8 414.9,118.0 407.6,115.2 400.9,112.5 394.7,109.8 388.9,107.0 383.6,104.2 378.7,101.5 374.2,98.8 370.0,96.0 366.2,93.2 362.6,90.5 359.4,87.8 356.3,85.0 353.5,82.2 351.0,79.5 348.6,76.8 346.4,74.0 344.4,71.2 342.5,68.5 340.8,65.8 339.2,63.0 337.7,60.2 336.3,57.5 335.1,54.8 333.9,52.0 332.8,49.2 331.9,46.5 330.9,43.8 330.1,41.0 329.3,38.2 328.6,35.5 327.9,32.8 327.3,30.0" class="d-b"/>
    <text x="324" y="40" class="t-small t-dim">${L('높이', 'height')}</text>
    <text x="520" y="154" text-anchor="end" class="t-small t-dim">${L('밀도', 'density')}</text>
    <text x="390" y="66" class="t-small">${L('높은 곳 맑음', 'clear up high')}</text>
    <text x="440" y="128" class="t-small">${L('골짜기 짙음', 'thick in valleys')}</text>
    <text x="320" y="160" class="t-small">${L('시선을 따라 밀도를 적분', 'Integrate density along the view ray')}</text>
  </svg>`,
  look: [
    'A의 선형 안개를 보면 "끝 거리" 너머가 같은 색 벽처럼 보임. 시작과 끝 거리를 바꾸면 띠의 위치가 움직임.',
    'B를 지수에서 지수²로 바꾸면 가까운 기둥은 선명해지고 먼 곳은 더 급격히 사라짐',
    'B의 높이 안개에서 카메라를 높이 올리면(드래그) 땅 근처에만 안개가 깔린 모습이 보임. "고도 감쇠"를 올리면 안개층이 얇아짐.',
    '태양 산란을 켜고 태양 쪽(노란 하늘)을 보면 안개가 밝게 빛남',
  ],
  refs: [
    { type: 'article', title: 'Inigo Quilez: Better Fog', url: 'https://iquilezles.org/articles/fog/', note: '높이 안개 해석적 적분, 태양 방향 안개색' },
    { type: 'talk', title: 'Real-time Atmospheric Effects in Games (Carsten Wenzel, Crytek)', year: 2006, note: 'SIGGRAPH 2006 course. CryEngine 높이 안개.' },
    { type: 'engine', title: 'Unreal Engine: Exponential Height Fog', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/exponential-height-fog-in-unreal-engine' },
    { type: 'engine', title: 'OpenGL 2.1 glFog: GL_LINEAR / GL_EXP / GL_EXP2', url: 'https://registry.khronos.org/OpenGL-Refpages/gl2.1/xhtml/glFog.xml' },
  ],
  params: [
    { key: 'mode', label: '안개 방식', type: 'select', group: '안개', options: [
      { value: 0, label: '없음' },
      { value: 1, label: '선형' },
      { value: 2, label: '지수 (Exp)' },
      { value: 3, label: '지수² (Exp²)' },
      { value: 4, label: '높이 안개 (지수 높이)' },
    ], a: 1, b: 4 },
    { key: 'start', label: '시작 거리', type: 'range', min: 0, max: 100, step: 1, default: 10, when: (p) => +p.mode === 1 },
    { key: 'end', label: '끝 거리', type: 'range', min: 10, max: 250, step: 1, default: 70, when: (p) => +p.mode === 1 },
    { key: 'density', label: '밀도', type: 'range', min: 0.002, max: 0.12, step: 0.001, default: 0.03, when: (p) => +p.mode >= 2 },
    { key: 'falloff', label: '고도 감쇠', type: 'range', min: 0.02, max: 1, step: 0.01, default: 0.22, when: (p) => +p.mode === 4 },
    { key: 'sunScatter', label: '태양 방향 산란', type: 'bool', a: false, b: true },
    { key: 'fogColor', label: '안개색', type: 'color', default: '#9fb2c6', shared: true, group: '장면' },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Fog (Linear, Exp, Exp², Height Fog)',
    summary: 'Mixing scene color with fog color by distance adds a sense of depth. It also hides pop-in and the edge of the far view. The falloff curve and density by height change the mood a lot.',
    views: { a: 'Linear fog', b: 'Height fog + sun scattering' },
    controls: 'Mouse drag: rotate camera. Wheel: zoom (distance).',
    info: `
    <p>Fog mixes each pixel color with the fog color by distance. It adds depth and hides pop-in and the draw distance limit.</p>
    <p>A fog factor <code>f</code> (1 = visible, 0 = full fog) computes <code>mix(fogColor, color, f)</code>. Ways to get <code>f</code>:</p>
    <ul>
      <li><b>Linear</b>: <code>(end − d)/(end − start)</code>. The start and end are clear, so the edge often looks like a band (GL_LINEAR in the OpenGL fixed pipeline).</li>
      <li><b>Exp</b>: <code>exp(−density * d)</code>. Transmittance through a uniform medium (Beer-Lambert law).</li>
      <li><b>Exp²</b>: <code>exp(−(density * d)²)</code>. Clear up close, then thick quickly past a certain distance.</li>
    </ul>
    <p><b>Height fog</b>: density falls with height as <code>a * e^(−b * y)</code>. The density is integrated along the view ray in closed form (Quilez). Low valleys are thick, while pillar tops and the sky are clear. Brightening the fog color when you look toward the sun gives a simple <b>in-scattering</b> effect.</p>
    <p>Note: match the fog color to the sky color at the horizon so the far view blends into the sky. Open world games use this to hide far LOD changes and the draw distance limit.</p>`,
    look: [
      'Look at the linear fog in A. Everything past the "End distance" looks like a wall of one color. Change the start and end distance to move the band.',
      'Switch B from Exp to Exp². Near pillars get sharper, and far areas fade out faster.',
      'In B with height fog, raise the camera high (drag). The fog lies only near the ground. Raise "Height falloff" to make the fog layer thinner.',
      'Turn on sun scattering and look toward the sun (yellow sky). The fog glows bright.',
    ],
    refs: ['Closed-form height fog integral, fog color by sun direction.', 'SIGGRAPH 2006 course. CryEngine height fog.', null, null],
    params: {
      mode: { label: 'Fog mode', group: 'Fog', options: { 0: 'None', 1: 'Linear', 2: 'Exponential (Exp)', 3: 'Exponential² (Exp²)', 4: 'Height fog (exponential height)' } },
      start: 'Start distance',
      end: 'End distance',
      density: 'Density',
      falloff: 'Height falloff',
      sunScatter: 'Sun direction scattering',
      fogColor: { label: 'Fog color', group: 'Scene' },
      autoRotate: 'Auto rotate',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params, G = U.geometry;

    // ── 기둥 숲: 상자 수천 개를 정점 버퍼 하나로 합침 (드로우 콜 1회) ──
    const rng = U.rng(ctx.seed * 7 + 3);
    const cube = G.cube(1);
    const pos = [], nor = [], col = [], idx = [];
    let boxes = 0;
    for (let i = 0; i < 1800; i++) {
      const r = 4 + Math.sqrt(rng.next()) * 170, a = rng.range(0, U.TAU);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      const w = rng.range(0.6, 2.2), h = rng.range(1, 9) * (rng.chance(0.08) ? 3 : 1);
      const tint = rng.range(0, 1);
      const c = [U.lerp(0.55, 0.85, tint), U.lerp(0.4, 0.6, tint), U.lerp(0.3, 0.42, tint)];
      const base = pos.length / 3;
      for (let v = 0; v < 24; v++) {
        pos.push(x + cube.positions[v * 3] * w, (cube.positions[v * 3 + 1] + 0.5) * h, z + cube.positions[v * 3 + 2] * w);
        nor.push(cube.normals[v * 3], cube.normals[v * 3 + 1], cube.normals[v * 3 + 2]);
        col.push(...c);
      }
      for (let k = 0; k < 36; k++) idx.push(base + cube.indices[k]);
      boxes++;
    }
    const bufs = { a_position: U.gl.buffer(gl, new Float32Array(pos)), a_normal: U.gl.buffer(gl, new Float32Array(nor)), a_color: U.gl.buffer(gl, new Float32Array(col)) };
    const ib = U.gl.buffer(gl, new Uint16Array(idx), gl.ELEMENT_ARRAY_BUFFER);
    const forest = { count: idx.length, draw(prog) { for (const k in bufs) U.gl.attrib(gl, prog, k, bufs[k], 3); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0); } };
    const ground = G.upload(gl, G.plane(600, 1, 1));
    const quad = U.gl.quad(gl);

    const FOG = `
      uniform float u_mode; uniform float u_start; uniform float u_end; uniform float u_density; uniform float u_falloff;
      uniform float u_scatter; uniform vec3 u_fogColor; uniform vec3 u_sun; uniform vec3 u_eye;
      vec3 fogColorFor(vec3 rd) {
        float s = max(dot(rd, u_sun), 0.0);
        return u_scatter > 0.5 ? mix(u_fogColor, vec3(1.0, 0.86, 0.6), pow(s, 8.0)) : u_fogColor;
      }
      // 반환: 투과율 (1 = 안개 없음)
      float transmittance(vec3 ro, vec3 rd, float d) {
        if (u_mode < 0.5) return 1.0;
        if (u_mode < 1.5) return clamp((u_end - d) / max(u_end - u_start, 0.001), 0.0, 1.0);
        if (u_mode < 2.5) return exp(-u_density * d);
        if (u_mode < 3.5) { float k = u_density * d; return exp(-k * k); }
        float b = u_falloff;
        float a = u_density * 3.0;
        float amount;
        if (abs(rd.y) < 1e-4) amount = a * exp(-ro.y * b) * d;
        else amount = (a / b) * exp(-ro.y * b) * (1.0 - exp(-rd.y * d * b)) / rd.y;
        return exp(-max(amount, 0.0));
      }`;
    const prog = U.gl.program(gl, `
      attribute vec3 a_position; attribute vec3 a_normal; attribute vec3 a_color;
      uniform mat4 u_vp; uniform float u_isGround;
      varying vec3 v_pos; varying vec3 v_n; varying vec3 v_c;
      void main(){
        v_pos = a_position; v_n = a_normal;
        v_c = u_isGround > 0.5 ? vec3(0.32, 0.36, 0.24) : a_color;
        gl_Position = u_vp * vec4(a_position, 1.0);
      }`, `
      precision highp float;
      uniform float u_isGround;
      varying vec3 v_pos; varying vec3 v_n; varying vec3 v_c;
      ${FOG}
      void main(){
        vec3 N = normalize(v_n);
        vec3 alb = v_c;
        if (u_isGround > 0.5) {
          vec2 g = floor(v_pos.xz / 4.0);
          alb *= mod(g.x + g.y, 2.0) < 0.5 ? 0.85 : 1.0;
        }
        float ndl = max(dot(N, u_sun), 0.0);
        vec3 c = alb * (vec3(1.0, 0.92, 0.8) * ndl * 1.1 + vec3(0.35, 0.42, 0.55) * (0.6 + 0.4 * N.y));
        vec3 dv = v_pos - u_eye;
        float d = length(dv);
        vec3 rd = dv / d;
        float t = transmittance(u_eye, rd, d);
        c = mix(fogColorFor(rd), c, t);
        gl_FragColor = vec4(c, 1.0);
      }`);
    const skyProg = U.gl.program(gl, `
      attribute vec2 a_pos; varying vec2 v_ndc;
      void main(){ v_ndc = a_pos; gl_Position = vec4(a_pos, 0.999, 1.0); }`, `
      precision highp float;
      uniform mat4 u_invVP; varying vec2 v_ndc;
      ${FOG}
      void main(){
        vec4 p = u_invVP * vec4(v_ndc, 1.0, 1.0);
        vec3 rd = normalize(p.xyz / p.w - u_eye);
        vec3 top = vec3(0.28, 0.45, 0.75);
        vec3 c = mix(fogColorFor(rd), top, smoothstep(0.0, 0.5, rd.y));
        c += vec3(1.0, 0.9, 0.7) * pow(max(dot(rd, u_sun), 0.0), 600.0) * 2.0;
        gl_FragColor = vec4(min(c, vec3(1.0)), 1.0);
      }`);

    const cam = { yaw: 0, pitch: 0.12, dist: 14, drag: false, lx: 0, ly: 0 };
    const sun = (() => { const v = [0.2, 0.25, -1]; const l = Math.hypot(...v); return v.map((x) => x / l); })();

    return {
      update(dt) {
        if (P.autoRotate && !cam.drag) cam.yaw += dt * 0.08;
        if (ctx.input.mouse.wheel) cam.dist = U.clamp(cam.dist * Math.pow(1.15, ctx.input.mouse.wheel), 3, 120);
      },
      onPointer(type, m) {
        if (type === 'down') { cam.drag = true; cam.lx = m.x; cam.ly = m.y; }
        else if (type === 'up' || type === 'leave') cam.drag = false;
        else if (type === 'move' && cam.drag) {
          cam.yaw -= (m.x - cam.lx) * 0.006; cam.pitch = U.clamp(cam.pitch + (m.y - cam.ly) * 0.006, 0.02, 1.45);
          cam.lx = m.x; cam.ly = m.y;
        }
      },
      render() {
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const proj = M.perspective(U.rad(60), ctx.width / ctx.height, 0.2, 800);
        const target = [0, 2, 0];
        const eye = M.orbitEye(target, cam.yaw, cam.pitch, cam.dist);
        const vp = M.multiply(proj, M.lookAt(eye, [0, 2 + cam.pitch * 2, 0]));
        const fogRGB = U.hexToRgb01(P.fogColor);
        const setFog = (p) => {
          gl.uniform1f(p.u('u_mode'), +P.mode);
          gl.uniform1f(p.u('u_start'), P.start);
          gl.uniform1f(p.u('u_end'), Math.max(P.end, P.start + 1));
          gl.uniform1f(p.u('u_density'), P.density);
          gl.uniform1f(p.u('u_falloff'), P.falloff);
          gl.uniform1f(p.u('u_scatter'), P.sunScatter ? 1 : 0);
          gl.uniform3fv(p.u('u_fogColor'), fogRGB);
          gl.uniform3fv(p.u('u_sun'), sun);
          gl.uniform3fv(p.u('u_eye'), eye);
        };
        gl.disable(gl.DEPTH_TEST);
        skyProg.use(); setFog(skyProg);
        gl.uniformMatrix4fv(skyProg.u('u_invVP'), false, M.invert(vp));
        quad.draw(skyProg);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        prog.use(); setFog(prog);
        gl.uniformMatrix4fv(prog.u('u_vp'), false, vp);
        gl.uniform1f(prog.u('u_isGround'), 1);
        ground.draw(prog);
        gl.uniform1f(prog.u('u_isGround'), 0);
        forest.draw(prog);

        const m = +P.mode;
        const vis = m === 1 ? P.end : m === 2 ? 3 / P.density : m === 3 ? Math.sqrt(3) / P.density : null;
        ctx.stat(GTL.L('95% 안개 거리', '95% fog distance'), vis == null ? (m === 4 ? GTL.L('고도에 따라 다름', 'Depends on height') : '∞') : vis.toFixed(0));
        ctx.stat(GTL.L('카메라 높이', 'Camera height'), eye[1].toFixed(1));
        ctx.stat(GTL.L('상자 / 드로우 콜', 'Boxes / draw calls'), `${boxes} / 3`);
      },
    };
  },
});
