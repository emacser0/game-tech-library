// 툰(셀) 셰이딩 + 인버티드 헐 아웃라인
GTL.register({
  id: 'toon-outline',
  title: '툰 셰이딩 & 인버티드 헐 아웃라인',
  summary: '연속적인 명암을 몇 단계로 끊으면 셀 애니메이션 같은 그림이 됨. 법선 방향으로 부풀린 메시의 뒷면만 그리면(인버티드 헐) 외곽선이 생김.',
  renderer: 'webgl',
  views: { a: 'Lambert, 외곽선 없음', b: '툰 + 인버티드 헐' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌',
  info: `
    <p><b>툰 셰이딩(toon shading)</b>은 명암을 몇 단계로 끊어 애니메이션 채색처럼 보이게 하는 방식.</p>
    <ul>
      <li>하프 램버트(<code>dot(N,L) * 0.5 + 0.5</code>)를 임계값 몇 개로 끊어 명암 단계를 만듦.</li>
      <li>그림자색은 검정이 아니라 <b>푸르거나 보랏빛 색을 곱해서</b> 씀.</li>
      <li>하이라이트와 림 라이트도 <code>step</code>으로 딱 끊음.</li>
      <li>경계 부드러움(smoothstep 폭)은 앨리어싱을 줄이는 용도.</li>
    </ul>
    <p><b>인버티드 헐(inverted hull)</b>은 같은 메시를 법선 방향으로 조금 부풀려 뒷면만 단색으로 그림(<b>앞면 컬링</b>). 원래 메시가 가운데를 덮어 실루엣에만 테두리가 남음.</p>
    <ul>
      <li><i>화면 공간</i> 폭: 거리와 관계없이 픽셀 두께가 일정함.</li>
      <li><i>월드 공간</i> 폭: 멀어질수록 얇아짐.</li>
    </ul>
    <p>단점: 큐브처럼 모서리에서 법선이 갈라진 메시는 부풀릴 때 면이 따로 벌어짐. 그래서 <b>외곽선에 틈</b>이 생김. 같은 위치 정점의 법선을 평균한 <b>아웃라인 전용 법선</b>을 쓰면 해결됨. Guilty Gear Xrd 등은 이런 법선과 정점 컬러로 선 두께까지 아티스트가 제어했음.</p>`,
  // 도식: 툰 셰이딩의 명암 단계와 인버티드 헐로 외곽선이 남는 원리
  diagram: (L) => `<svg viewBox="0 0 540 188" xmlns="http://www.w3.org/2000/svg">
    <text x="30" y="16" class="t-small t-dim">${L('명암: N과 L의 내적에 따른 밝기', 'Shade vs dot(N, L)')}</text>
    <line x1="30" y1="140" x2="230" y2="140" class="d-dim"/>
    <line x1="30" y1="140" x2="30" y2="30" class="d-dim"/>
    <polyline points="30.0,140.0 35.0,137.2 40.0,134.5 45.0,131.8 50.0,129.0 55.0,126.2 60.0,123.5 65.0,120.8 70.0,118.0 75.0,115.2 80.0,112.5 85.0,109.8 90.0,107.0 95.0,104.2 100.0,101.5 105.0,98.8 110.0,96.0 115.0,93.2 120.0,90.5 125.0,87.8 130.0,85.0 135.0,82.2 140.0,79.5 145.0,76.8 150.0,74.0 155.0,71.2 160.0,68.5 165.0,65.8 170.0,63.0 175.0,60.2 180.0,57.5 185.0,54.8 190.0,52.0 195.0,49.2 200.0,46.5 205.0,43.8 210.0,41.0 215.0,38.2 220.0,35.5 225.0,32.8 230.0,30.0" class="d-a"/>
    <polyline points="30.0,107.0 120.0,107.0 120.0,68.5 190.0,68.5 190.0,30.0 230.0,30.0" class="d-b"/>
    <text x="34" y="154" class="t-small t-dim">${L('-1 (뒤)', '-1 (back)')}</text>
    <text x="230" y="154" text-anchor="end" class="t-small t-dim">${L('1 (앞)', '1 (front)')}</text>
    <text x="30" y="172" class="t-small">${L('A 램버트: 연속, B 툰: 3단계로 끊음', 'A Lambert: smooth. B toon: 3 bands')}</text>
    <text x="300" y="16" class="t-small t-dim">${L('인버티드 헐 외곽선', 'Inverted hull outline')}</text>
    <circle cx="420" cy="100" r="52" class="f-b"/>
    <circle cx="420" cy="100" r="44" class="f-dim"/>
    <text x="420" y="104" text-anchor="middle" class="t-small">${L('원래 메시', 'original mesh')}</text>
    <text x="300" y="32" class="t-small t-b">${L('파란 띠: 부풀린 뒷면', 'Blue ring: grown backface')}</text>
    <text x="300" y="166" class="t-small">${L('법선 방향으로 부풀리고 앞면을 컬링', 'Push out along normals, cull front faces')}</text>
    <text x="300" y="180" class="t-small t-dim">${L('가운데는 원래 메시가 덮어 테두리만 남음', 'The mesh hides the middle, only the rim stays')}</text>
  </svg>`,
  look: [
    'B를 보면 명암이 2단으로 끊기고 그림자가 보랏빛으로 칠해짐. "명암 단계"를 3~4로 올리면 단계가 늘어남.',
    '모양을 "큐브"로 바꾸고 "헐에 평균 법선"을 끄면 모서리마다 외곽선이 갈라짐.',
    '휠로 멀리 줌아웃하면 화면 공간 폭은 그대로, 월드 공간 폭은 얇아짐.',
    '"경계 부드러움"을 0으로 하면 명암 경계에 계단(앨리어싱)이 보임.',
  ],
  refs: [
    { type: 'talk', title: 'GuiltyGearXrd\'s Art Style: The X Factor Between 2D and 3D (Junya C. Motomura, Arc System Works)', url: 'https://www.gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The', year: 2015, note: 'GDC 2015. 인버티드 헐 외곽선, 정점 컬러로 두께 제어, 그림자 임계값 조정.' },
    { type: 'paper', title: 'Stylized Rendering Techniques for Scalable Real-Time 3D Animation (Lake, Marshall, Harris, Blackstein)', year: 2000, note: 'NPAR 2000. 하드웨어 툰 셰이딩.' },
    { type: 'paper', title: 'A Non-Photorealistic Lighting Model for Automatic Technical Illustration (Gooch et al.)', year: 1998, note: 'SIGGRAPH 98. 따뜻한 색과 차가운 색 셰이딩.' },
    { type: 'game', title: 'Jet Set Radio (Sega)', year: 2000, note: '셀 셰이딩을 대중화한 게임.' },
  ],
  params: [
    { key: 'shading', label: '셰이딩', type: 'select', group: '셰이딩', options: [
      { value: 'lambert', label: 'Lambert + Blinn' },
      { value: 'toon', label: '툰 (양자화)' },
    ], a: 'lambert', b: 'toon' },
    { key: 'bands', label: '명암 단계', type: 'int', min: 1, max: 4, default: 1, when: (p) => p.shading === 'toon' },
    { key: 'soft', label: '경계 부드러움', type: 'range', min: 0, max: 0.2, step: 0.005, default: 0.015, when: (p) => p.shading === 'toon' },
    { key: 'rim', label: '림 라이트', type: 'bool', default: true, when: (p) => p.shading === 'toon' },
    { key: 'outline', label: '외곽선', type: 'select', group: '외곽선', options: [
      { value: 'none', label: '없음' },
      { value: 'hull', label: '인버티드 헐' },
    ], a: 'none', b: 'hull' },
    { key: 'outlineW', label: '두께', type: 'range', min: 0.5, max: 10, step: 0.5, default: 3, when: (p) => p.outline === 'hull' },
    { key: 'space', label: '두께 기준', type: 'select', options: [
      { value: 'screen', label: '화면 공간 (px)' },
      { value: 'world', label: '월드 공간' },
    ], default: 'screen', when: (p) => p.outline === 'hull' },
    { key: 'hullSmooth', label: '헐에 평균 법선', type: 'bool', default: true, when: (p) => p.outline === 'hull' },
    { key: 'shape', label: '모양', type: 'select', group: '장면', options: [
      { value: 'scene', label: '매듭 + 구 + 큐브' },
      { value: 'cube', label: '큐브' },
      { value: 'knot', label: '토러스 매듭' },
    ], default: 'scene', shared: true },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Toon Shading & Inverted Hull Outlines',
    summary: 'Cut smooth shading into a few bands and the image looks like cel animation. Draw only the back faces of a mesh pushed out along its normals (inverted hull) and you get an outline.',
    views: { a: 'Lambert, no outline', b: 'Toon + inverted hull' },
    controls: 'Mouse drag: rotate camera. Wheel: zoom.',
    info: `
    <p><b>Toon shading</b> cuts shading into a few bands so it looks like hand-painted animation.</p>
    <ul>
      <li>It cuts half Lambert (<code>dot(N,L) * 0.5 + 0.5</code>) at a few thresholds to make shading bands.</li>
      <li>The shadow color is not black. It <b>multiplies in a blue or purple tint</b>.</li>
      <li>Highlights and rim light are also cut sharply with <code>step</code>.</li>
      <li>Edge softness (smoothstep width) reduces aliasing.</li>
    </ul>
    <p>An <b>inverted hull</b> pushes the same mesh out a little along its normals and draws only its back faces in one color (<b>front face culling</b>). The original mesh covers the middle, so the border shows only on the silhouette.</p>
    <ul>
      <li><i>Screen space</i> width: the pixel thickness stays the same at any distance.</li>
      <li><i>World space</i> width: the line gets thinner farther away.</li>
    </ul>
    <p>Downside: on a mesh with split normals at its edges (like a cube), the faces move apart when pushed out. This leaves <b>gaps in the outline</b>. The fix is <b>outline-only normals</b> that average the normals of vertices at the same position. Games like Guilty Gear Xrd used such normals and vertex colors so artists could control even line thickness.</p>`,
    look: [
      'Look at B. Shading cuts into 2 bands, and shadows get a purple tint. Raise "Shading bands" to 3~4 to add more bands.',
      'Set the shape to "Cube" and turn off "Averaged normals for hull". The outline splits at every edge.',
      'Zoom far out with the wheel. Screen space width stays the same, but world space width gets thinner.',
      'Set "Edge softness" to 0. You see stair steps (aliasing) on the shading edges.',
    ],
    refs: ['GDC 2015. Inverted hull outlines, line thickness from vertex colors, tuned shadow thresholds.', 'NPAR 2000. Hardware toon shading.', 'SIGGRAPH 98. Warm and cool color shading.', 'The game that made cel shading popular.'],
    params: {
      shading: { label: 'Shading', group: 'Shading', options: { toon: 'Toon (quantized)' } },
      bands: 'Shading bands',
      soft: 'Edge softness',
      rim: 'Rim light',
      outline: { label: 'Outline', group: 'Outline', options: { none: 'None', hull: 'Inverted hull' } },
      outlineW: 'Width',
      space: { label: 'Width space', options: { screen: 'Screen space (px)', world: 'World space' } },
      hullSmooth: 'Averaged normals for hull',
      shape: { label: 'Shape', group: 'Scene', options: { scene: 'Knot + sphere + cube', cube: 'Cube', knot: 'Torus knot' } },
      autoRotate: 'Auto rotate',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params, G = U.geometry;

    function torusKnot(seg, sides, p = 2, q = 3, r = 0.25) {
      const Pp = [], N = [], T = [], I = [];
      const curve = (t) => { const s = 0.55 * (2 + Math.cos(q * t)); return [s * Math.cos(p * t), 0.55 * Math.sin(q * t), s * Math.sin(p * t)]; };
      for (let i = 0; i <= seg; i++) {
        const t = (i / seg) * U.TAU, e = 0.001, c = curve(t), a = curve(t - e), b = curve(t + e);
        const tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2];
        let nx = a[0] + b[0] - 2 * c[0], ny = a[1] + b[1] - 2 * c[1], nz = a[2] + b[2] - 2 * c[2];
        let bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
        let l = Math.hypot(bx, by, bz) || 1; bx /= l; by /= l; bz /= l;
        nx = by * tz - bz * ty; ny = bz * tx - bx * tz; nz = bx * ty - by * tx;
        l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        for (let j = 0; j <= sides; j++) {
          const v = (j / sides) * U.TAU, cv = Math.cos(v), sv = Math.sin(v);
          const ox = cv * nx + sv * bx, oy = cv * ny + sv * by, oz = cv * nz + sv * bz;
          Pp.push(c[0] + ox * r, c[1] + oy * r, c[2] + oz * r); N.push(ox, oy, oz); T.push(i / seg, j / sides);
        }
      }
      for (let i = 0; i < seg; i++) for (let j = 0; j < sides; j++) { const a = i * (sides + 1) + j, b = a + sides + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
      return { positions: new Float32Array(Pp), normals: new Float32Array(N), uvs: new Float32Array(T), indices: new Uint16Array(I), count: I.length };
    }
    // 정점 법선과 감김 방향이 반대인 삼각형을 CCW로 뒤집기
    function fixWinding(g) {
      const p = g.positions, n = g.normals, I = g.indices;
      for (let t = 0; t < I.length; t += 3) {
        const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
        const e1 = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]], e2 = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]];
        const cx = e1[1] * e2[2] - e1[2] * e2[1], cy = e1[2] * e2[0] - e1[0] * e2[2], cz = e1[0] * e2[1] - e1[1] * e2[0];
        if (cx * n[a] + cy * n[a + 1] + cz * n[a + 2] < 0) { const s = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = s; }
      }
      return g;
    }
    // 같은 위치 정점끼리 법선 평균 → 아웃라인 전용 법선
    function makeMesh(g) {
      const n = g.positions.length / 3, key = (i) => `${g.positions[i * 3].toFixed(4)},${g.positions[i * 3 + 1].toFixed(4)},${g.positions[i * 3 + 2].toFixed(4)}`;
      const acc = new Map();
      for (let i = 0; i < n; i++) {
        const k = key(i), s = acc.get(k) || [0, 0, 0];
        s[0] += g.normals[i * 3]; s[1] += g.normals[i * 3 + 1]; s[2] += g.normals[i * 3 + 2]; acc.set(k, s);
      }
      const sn = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const s = acc.get(key(i)), l = Math.hypot(...s) || 1; sn[i * 3] = s[0] / l; sn[i * 3 + 1] = s[1] / l; sn[i * 3 + 2] = s[2] / l; }
      const mesh = G.upload(gl, g), sb = U.gl.buffer(gl, sn);
      return { count: g.count, draw(prog) { U.gl.attrib(gl, prog, 'a_snormal', sb, 3); mesh.draw(prog); } };
    }
    const knot = makeMesh(fixWinding(torusKnot(256, 20)));
    const cube = makeMesh(G.cube(1.3));
    const sphere = makeMesh(G.sphere(0.6, 40, 20));
    const ground = G.upload(gl, G.plane(30, 1, 1));

    const vs = `
      attribute vec3 a_position; attribute vec3 a_normal; attribute vec3 a_snormal;
      uniform mat4 u_vp; uniform mat4 u_world; uniform mat3 u_nmat;
      uniform float u_hull; uniform float u_width; uniform float u_screen; uniform float u_smooth; uniform vec2 u_res;
      varying vec3 v_pos; varying vec3 v_n;
      void main(){
        vec3 n = normalize(u_nmat * (u_smooth > 0.5 ? a_snormal : a_normal));
        vec4 wp = u_world * vec4(a_position, 1.0);
        if (u_hull > 0.5 && u_screen < 0.5) wp.xyz += n * u_width * 0.012;
        vec4 clip = u_vp * wp;
        if (u_hull > 0.5 && u_screen > 0.5) {
          vec2 d = (u_vp * vec4(n, 0.0)).xy;
          float l = length(d);
          d = l > 1e-5 ? d / l : vec2(0.0);
          clip.xy += d * u_width * 2.0 / u_res * clip.w;
        }
        v_pos = wp.xyz; v_n = normalize(u_nmat * a_normal);
        gl_Position = clip;
      }`;
    const fs = `
      precision highp float;
      uniform vec3 u_color; uniform vec3 u_lightDir; uniform vec3 u_eye;
      uniform float u_hull; uniform float u_toon; uniform float u_bands; uniform float u_soft; uniform float u_rim;
      varying vec3 v_pos; varying vec3 v_n;
      void main(){
        if (u_hull > 0.5) { gl_FragColor = vec4(0.1, 0.08, 0.14, 1.0); return; }
        vec3 N = normalize(v_n), L = normalize(u_lightDir), V = normalize(u_eye - v_pos), H = normalize(L + V);
        float ndl = dot(N, L);
        vec3 c;
        if (u_toon > 0.5) {
          float x = ndl * 0.5 + 0.5;
          float q = 0.0;
          for (int k = 1; k <= 4; k++) {
            if (float(k) > u_bands) break;
            float t = 0.5 + 0.45 * (float(k) - 1.0) / u_bands;
            q += smoothstep(t - u_soft, t + u_soft, x);
          }
          q /= u_bands;
          vec3 shade = u_color * vec3(0.55, 0.5, 0.78);
          c = mix(shade, u_color, q);
          float spec = smoothstep(0.96 - u_soft * 0.5, 0.96 + u_soft * 0.5, max(dot(N, H), 0.0));
          c += vec3(0.9) * spec * step(0.5, q);
          if (u_rim > 0.5) {
            float r = smoothstep(0.68 - u_soft, 0.68 + u_soft, 1.0 - max(dot(N, V), 0.0)) * smoothstep(0.0, 0.25, ndl + 0.2);
            c = mix(c, vec3(1.0, 0.97, 0.9), r * 0.6);
          }
        } else {
          float d = max(ndl, 0.0);
          float spec = d > 0.0 ? pow(max(dot(N, H), 0.0), 60.0) * 0.5 : 0.0;
          vec3 lin = pow(u_color, vec3(2.2)) * (0.08 + d * 1.1) + vec3(spec);
          c = pow(lin, vec3(1.0 / 2.2));
        }
        gl_FragColor = vec4(c, 1.0);
      }`;
    const prog = U.gl.program(gl, vs, fs);
    const groundProg = U.gl.program(gl, `
      attribute vec3 a_position; uniform mat4 u_vp; varying vec2 v_p;
      void main(){ v_p = a_position.xz; gl_Position = u_vp * vec4(a_position + vec3(0.0, -1.3, 0.0), 1.0); }`, `
      precision mediump float; varying vec2 v_p;
      void main(){
        float r = length(v_p);
        vec3 c = mix(vec3(0.86, 0.84, 0.8), vec3(0.62, 0.66, 0.74), smoothstep(2.0, 12.0, r));
        gl_FragColor = vec4(c, 1.0);
      }`);

    const cam = { yaw: 0.4, pitch: 0.3, dist: 5.5, drag: false, lx: 0, ly: 0 };
    let spin = 0;
    const L = [0.5, 0.8, 0.45];

    return {
      update(dt) {
        if (P.autoRotate && !cam.drag) cam.yaw += dt * 0.2;
        spin += dt * 0.4;
        if (ctx.input.mouse.wheel) cam.dist = U.clamp(cam.dist * Math.pow(1.12, ctx.input.mouse.wheel), 2, 30);
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
        gl.clearColor(0.62, 0.66, 0.74, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        const proj = M.perspective(U.rad(45), ctx.width / ctx.height, 0.1, 100);
        const eye = M.orbitEye([0, 0, 0], cam.yaw, cam.pitch, cam.dist);
        const vp = M.multiply(proj, M.lookAt(eye, [0, -0.2, 0]));

        gl.cullFace(gl.BACK);
        groundProg.use();
        gl.uniformMatrix4fv(groundProg.u('u_vp'), false, vp);
        ground.draw(groundProg);

        const items = [];
        if (P.shape === 'scene') {
          items.push([knot, M.mul(M.translation(0, 0.1, 0), M.rotationY(spin)), [0.95, 0.55, 0.45]]);
          items.push([sphere, M.translation(1.9, -0.7, 0.8), [0.5, 0.75, 0.95]]);
          items.push([cube, M.mul(M.translation(-1.9, -0.65, -0.6), M.rotationY(-spin * 0.7), M.scaling(0.9)), [0.65, 0.85, 0.5]]);
        } else if (P.shape === 'cube') items.push([cube, M.mul(M.rotationY(spin), M.rotationX(0.5)), [0.65, 0.85, 0.5]]);
        else items.push([knot, M.rotationY(spin), [0.95, 0.55, 0.45]]);

        prog.use();
        gl.uniformMatrix4fv(prog.u('u_vp'), false, vp);
        gl.uniform3fv(prog.u('u_lightDir'), L);
        gl.uniform3fv(prog.u('u_eye'), eye);
        gl.uniform1f(prog.u('u_toon'), P.shading === 'toon' ? 1 : 0);
        gl.uniform1f(prog.u('u_bands'), P.bands);
        gl.uniform1f(prog.u('u_soft'), P.soft);
        gl.uniform1f(prog.u('u_rim'), P.rim ? 1 : 0);
        gl.uniform1f(prog.u('u_width'), P.outlineW);
        gl.uniform1f(prog.u('u_screen'), P.space === 'screen' ? 1 : 0);
        gl.uniform2f(prog.u('u_res'), ctx.pixelWidth / ctx.pixelRatio, ctx.pixelHeight / ctx.pixelRatio);
        let tris = 0, draws = 0;
        for (const hull of P.outline === 'hull' ? [1, 0] : [0]) {
          gl.cullFace(hull ? gl.FRONT : gl.BACK);
          gl.uniform1f(prog.u('u_hull'), hull);
          gl.uniform1f(prog.u('u_smooth'), hull && P.hullSmooth ? 1 : 0);
          for (const [mesh, w, c] of items) {
            gl.uniformMatrix4fv(prog.u('u_world'), false, w);
            gl.uniformMatrix3fv(prog.u('u_nmat'), false, M.normalMatrix(w));
            gl.uniform3fv(prog.u('u_color'), c);
            mesh.draw(prog);
            tris += mesh.count / 3; draws++;
          }
        }
        gl.cullFace(gl.BACK);
        ctx.stat(GTL.L('드로우 콜', 'Draw calls'), draws + 1);
        ctx.stat(GTL.L('삼각형', 'Triangles'), tris | 0);
        ctx.stat(GTL.L('외곽선 비용', 'Outline cost'), P.outline === 'hull' ? GTL.L('메시 2배', '2x mesh') : GTL.L('없음', 'None'));
      },
    };
  },
});
