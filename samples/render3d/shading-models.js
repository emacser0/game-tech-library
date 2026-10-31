// 셰이딩 모델: Flat / Gouraud / Phong / Blinn-Phong
GTL.register({
  id: 'shading-models',
  title: '셰이딩 모델 (Flat, Gouraud, Phong, Blinn-Phong)',
  summary: '조명을 면, 정점, 픽셀 중 어디서 계산하는지 비교. 계산 위치에 따라 하이라이트 모양과 메시의 각짐이 크게 달라짐.',
  renderer: 'webgl',
  views: { a: 'Gouraud (정점 조명)', b: 'Blinn-Phong (픽셀 조명)' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌',
  info: `
    <p>셰이딩 모델은 조명을 어디서 계산할지 정하는 방식</p>
    <ul>
      <li><b>Flat</b>: 면마다 법선 하나를 씀. 다각형이 그대로 드러남.</li>
      <li><b>Gouraud</b>(1971): 정점에서 조명을 계산하고 색을 보간. 계산이 쌈. 단점: 하이라이트가 정점 사이에 오면 <b>사라지거나 별 모양으로 번짐</b>. 정점이 적은 바닥에 점광원을 비추면 특히 심함.</li>
      <li><b>Phong 셰이딩</b>(1975): 법선을 보간해 픽셀마다 조명을 계산. 원래 Phong 반사 모델은 반사 벡터 <code>dot(R, V)</code>를 씀. 시선이 스치는 각도에서 하이라이트가 잘림.</li>
      <li><b>Blinn-Phong</b>(1977): 반벡터 <code>H = normalize(L+V)</code>와 <code>dot(N, H)</code>를 씀. 더 자연스럽고 계산도 쌈. 같은 하이라이트 크기를 얻으려면 지수를 Phong의 약 4배로 잡아야 함.</li>
    </ul>
    <p>OpenGL 고정 파이프라인(glLight)은 Gouraud + Blinn-Phong 조합이었음. 이 샘플의 Flat과 Gouraud도 Blinn 하이라이트를 씀.</p>`,
  // 도식: 정점 조명(Gouraud)이 정점 사이 하이라이트를 놓치는 이유
  diagram: (L) => `<svg viewBox="0 0 540 202" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <line x1="30" y1="140" x2="510" y2="140" class="d-dim"/>
    <polyline points="30.0,130.0 35.0,130.0 40.0,130.0 45.0,130.0 50.0,130.0 55.0,130.0 60.0,130.0 65.0,130.0 70.0,130.0 75.0,130.0 80.0,130.0 85.0,130.0 90.0,130.0 95.0,130.0 100.0,130.0 105.0,130.0 110.0,130.0 115.0,130.0 120.0,130.0 125.0,130.0 130.0,130.0 135.0,130.0 140.0,130.0 145.0,130.0 150.0,130.0 155.0,130.0 160.0,130.0 165.0,130.0 170.0,130.0 175.0,130.0 180.0,130.0 185.0,130.0 190.0,130.0 195.0,130.0 200.0,130.0 205.0,130.0 210.0,130.0 215.0,130.0 220.0,129.9 225.0,129.8 230.0,129.6 235.0,129.1 240.0,128.2 245.0,126.5 250.0,123.8 255.0,119.5 260.0,113.1 265.0,104.4 270.0,93.2 275.0,80.1 280.0,65.9 285.0,52.1 290.0,40.5 295.0,32.7 300.0,30.0 305.0,32.7 310.0,40.5 315.0,52.1 320.0,65.9 325.0,80.1 330.0,93.2 335.0,104.4 340.0,113.1 345.0,119.5 350.0,123.8 355.0,126.5 360.0,128.2 365.0,129.1 370.0,129.6 375.0,129.8 380.0,129.9 385.0,130.0 390.0,130.0 395.0,130.0 400.0,130.0 405.0,130.0 410.0,130.0 415.0,130.0 420.0,130.0 425.0,130.0 430.0,130.0 435.0,130.0 440.0,130.0 445.0,130.0 450.0,130.0 455.0,130.0 460.0,130.0 465.0,130.0 470.0,130.0 475.0,130.0 480.0,130.0 485.0,130.0 490.0,130.0 495.0,130.0 500.0,130.0 505.0,130.0 510.0,130.0" class="d-b"/>
    <polyline points="40.0,130.0 200.0,130.0 380.0,129.9 500.0,130.0" class="d-a" stroke-dasharray="5 3"/>
    <circle cx="40" cy="130" r="4" class="f-a"/>
    <line x1="40" y1="140" x2="40" y2="146" class="d-line"/>
    <circle cx="200" cy="130" r="4" class="f-a"/>
    <line x1="200" y1="140" x2="200" y2="146" class="d-line"/>
    <circle cx="380" cy="129.9" r="4" class="f-a"/>
    <line x1="380" y1="140" x2="380" y2="146" class="d-line"/>
    <circle cx="500" cy="130" r="4" class="f-a"/>
    <line x1="500" y1="140" x2="500" y2="146" class="d-line"/>
    <text x="40" y="160" text-anchor="middle" class="t-small t-dim">${L('정점', 'vertex')}</text>
    <text x="200" y="160" text-anchor="middle" class="t-small t-dim">${L('정점', 'vertex')}</text>
    <text x="306" y="36" class="t-small">${L('하이라이트', 'highlight')}</text>
    <text x="30" y="16" class="t-small t-dim">${L('표면을 따라 잰 반사광 세기', 'Specular along the surface')}</text>
    <text x="30" y="182" class="t-small t-a">${L('A Gouraud: 정점에서만 계산하고 보간, 정점 사이 하이라이트가 사라짐', 'A Gouraud: light at vertices, then blend. A peak between them is lost')}</text>
    <text x="30" y="196" class="t-small t-b">${L('B 픽셀 조명: 픽셀마다 법선을 보간해 계산, 하이라이트가 남음', 'B per-pixel: blend normals, light every pixel. The peak stays')}</text>
  </svg>`,
  look: [
    '메시 해상도를 6~8로 낮추면 A(Gouraud)의 하이라이트가 정점마다 튀고 다각형 윤곽이 보임. B는 하이라이트가 둥글게 유지됨.',
    '바닥의 점광원 하이라이트를 보면 Gouraud에서는 정점이 적어 거의 안 보임',
    'B를 Phong으로 바꾸고 카메라를 낮춰 스치는 각도로 보면 하이라이트가 잘림. Blinn-Phong은 길게 늘어짐.',
    '"와이어프레임"을 켜면 Gouraud 하이라이트가 삼각형 경계를 따라 각지는 모습이 보임',
  ],
  refs: [
    { type: 'paper', title: 'Illumination for Computer Generated Pictures (Bui Tuong Phong)', url: 'https://dl.acm.org/doi/10.1145/360825.360839', year: 1975, note: 'Communications of the ACM. 법선 보간 + Phong 반사 모델.' },
    { type: 'paper', title: 'Models of Light Reflection for Computer Synthesized Pictures (James F. Blinn)', url: 'https://dl.acm.org/doi/10.1145/563858.563893', year: 1977, note: 'SIGGRAPH 77. 반벡터(half vector) 기반 하이라이트.' },
    { type: 'paper', title: 'Continuous Shading of Curved Surfaces (Henri Gouraud)', url: 'https://ieeexplore.ieee.org/document/1671906', year: 1971, note: 'IEEE Transactions on Computers.' },
    { type: 'article', title: 'LearnOpenGL: Basic Lighting / Advanced Lighting (Blinn-Phong)', url: 'https://learnopengl.com/Advanced-Lighting/Advanced-Lighting' },
  ],
  params: [
    { key: 'model', label: '셰이딩 모델', type: 'select', group: '셰이딩', options: [
      { value: 0, label: 'Flat (면 법선)' },
      { value: 1, label: 'Gouraud (정점 조명)' },
      { value: 2, label: 'Phong (R, V 내적)' },
      { value: 3, label: 'Blinn-Phong (N, H 내적)' },
    ], a: 1, b: 3 },
    { key: 'shininess', label: '광택 지수', type: 'range', min: 1, max: 256, step: 1, default: 48, help: 'Blinn은 같은 크기 하이라이트에 약 4배 지수가 필요' },
    { key: 'specStr', label: '스펙큘러 세기', type: 'range', min: 0, max: 2, step: 0.05, default: 0.9 },
    { key: 'wire', label: '와이어프레임', type: 'bool', default: false },
    { key: 'shape', label: '모양', type: 'select', group: '장면', options: [
      { value: 'sphere', label: '구' },
      { value: 'torus', label: '토러스' },
      { value: 'knot', label: '토러스 매듭' },
    ], default: 'sphere', shared: true },
    { key: 'res', label: '메시 해상도', type: 'int', min: 4, max: 64, default: 10, shared: true, reset: true, help: '낮을수록 Gouraud의 단점이 잘 보임' },
    { key: 'lightMove', label: '광원 이동', type: 'bool', default: true, shared: true },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Shading Models (Flat, Gouraud, Phong, Blinn-Phong)',
    summary: 'Compare where lighting is computed: per face, per vertex, or per pixel. The choice changes the highlight shape and how faceted the mesh looks.',
    views: { a: 'Gouraud (vertex lighting)', b: 'Blinn-Phong (pixel lighting)' },
    controls: 'Mouse drag: rotate camera. Wheel: zoom.',
    info: `
    <p>A shading model decides where lighting is computed.</p>
    <ul>
      <li><b>Flat</b>: uses one normal per face. The polygons show as they are.</li>
      <li><b>Gouraud</b> (1971): computes lighting at vertices and interpolates the color. It is cheap. Downside: when a highlight falls between vertices, it <b>disappears or smears into a star shape</b>. This is worst when a point light shines on a floor with few vertices.</li>
      <li><b>Phong shading</b> (1975): interpolates the normal and computes lighting per pixel. The original Phong reflection model uses the reflection vector <code>dot(R, V)</code>. At grazing view angles, the highlight gets cut off.</li>
      <li><b>Blinn-Phong</b> (1977): uses the half vector <code>H = normalize(L+V)</code> and <code>dot(N, H)</code>. It looks more natural and is also cheap. To get the same highlight size, set the exponent to about 4 times the Phong value.</li>
    </ul>
    <p>The OpenGL fixed pipeline (glLight) used Gouraud with Blinn-Phong. Flat and Gouraud in this sample also use the Blinn highlight.</p>`,
    look: [
      'Lower mesh resolution to 6~8. The highlight in A (Gouraud) jumps from vertex to vertex, and polygon edges show. B keeps a round highlight.',
      'Look at the point light highlight on the floor. In Gouraud it is barely visible because the floor has few vertices.',
      'Switch B to Phong and lower the camera to a grazing angle. The highlight gets cut off. Blinn-Phong stretches it out instead.',
      'Turn on "Wireframe". The Gouraud highlight follows triangle edges and looks jagged.',
    ],
    refs: ['Communications of the ACM. Normal interpolation + the Phong reflection model.', 'SIGGRAPH 77. Highlights based on the half vector.', 'IEEE Transactions on Computers.', null],
    params: {
      model: { label: 'Shading model', group: 'Shading', options: { 0: 'Flat (face normal)', 1: 'Gouraud (vertex lighting)', 2: 'Phong (R, V dot product)', 3: 'Blinn-Phong (N, H dot product)' } },
      shininess: { label: 'Shininess exponent', help: 'Blinn needs about 4x the exponent for the same highlight size' },
      specStr: 'Specular strength',
      wire: 'Wireframe',
      shape: { label: 'Shape', group: 'Scene', options: { sphere: 'Sphere', torus: 'Torus', knot: 'Torus knot' } },
      res: { label: 'Mesh resolution', help: 'Lower values show the Gouraud problem more clearly' },
      lightMove: 'Move light',
      autoRotate: 'Auto rotate',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params;
    const deriv = gl.getExtension('OES_standard_derivatives');

    // ── 지오메트리: 인덱스를 풀어서(삼각형마다 고유 정점) 면 법선, 무게중심 좌표를 함께 넣음 ──
    function torusKnot(seg, sides, p = 2, q = 3, R = 0.9, r = 0.28) {
      const Pp = [], N = [], T = [], I = [];
      const curve = (t) => { const s = 0.55 * (2 + Math.cos(q * t)); return [s * Math.cos(p * t), 0.55 * Math.sin(q * t), s * Math.sin(p * t)]; };
      for (let i = 0; i <= seg; i++) {
        const t = (i / seg) * U.TAU, e = 0.001;
        const c = curve(t), a = curve(t - e), b = curve(t + e);
        let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2];
        let nx = a[0] + b[0] - 2 * c[0], ny = a[1] + b[1] - 2 * c[1], nz = a[2] + b[2] - 2 * c[2];
        let bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
        let l = Math.hypot(bx, by, bz) || 1; bx /= l; by /= l; bz /= l;
        nx = by * tz - bz * ty; ny = bz * tx - bx * tz; nz = bx * ty - by * tx;
        l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        for (let j = 0; j <= sides; j++) {
          const v = (j / sides) * U.TAU, cv = Math.cos(v), sv = Math.sin(v);
          const ox = cv * nx + sv * bx, oy = cv * ny + sv * by, oz = cv * nz + sv * bz;
          Pp.push(c[0] + ox * r * R, c[1] + oy * r * R, c[2] + oz * r * R); N.push(ox, oy, oz); T.push(i / seg * 4, j / sides);
        }
      }
      for (let i = 0; i < seg; i++) for (let j = 0; j < sides; j++) {
        const a = i * (sides + 1) + j, b = a + sides + 1;
        I.push(a, b, a + 1, b, b + 1, a + 1);
      }
      return { positions: new Float32Array(Pp), normals: new Float32Array(N), uvs: new Float32Array(T), indices: new Uint16Array(I), count: I.length };
    }
    function unindex(g) {
      const n = g.indices.length;
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), fn = new Float32Array(n * 3), bary = new Float32Array(n * 3);
      for (let t = 0; t < n; t += 3) {
        let ids = [g.indices[t], g.indices[t + 1], g.indices[t + 2]];
        let p = ids.map((i) => [g.positions[i * 3], g.positions[i * 3 + 1], g.positions[i * 3 + 2]]);
        const e1 = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]];
        const e2 = [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]];
        let cx = e1[1] * e2[2] - e1[2] * e2[1], cy = e1[2] * e2[0] - e1[0] * e2[2], cz = e1[0] * e2[1] - e1[1] * e2[0];
        // 정점 법선과 반대 방향으로 감긴 삼각형(util의 torus 등)은 CCW로 뒤집음 (백페이스 컬링용)
        const sn = [0, 1, 2].reduce((s, k) => s + g.normals[ids[k] * 3] * cx + g.normals[ids[k] * 3 + 1] * cy + g.normals[ids[k] * 3 + 2] * cz, 0);
        if (sn < 0) { ids = [ids[0], ids[2], ids[1]]; p = [p[0], p[2], p[1]]; cx = -cx; cy = -cy; cz = -cz; }
        const l = Math.hypot(cx, cy, cz) || 1; cx /= l; cy /= l; cz /= l;
        for (let k = 0; k < 3; k++) {
          const o = (t + k) * 3, i = ids[k];
          pos[o] = p[k][0]; pos[o + 1] = p[k][1]; pos[o + 2] = p[k][2];
          nor[o] = g.normals[i * 3]; nor[o + 1] = g.normals[i * 3 + 1]; nor[o + 2] = g.normals[i * 3 + 2];
          fn[o] = cx; fn[o + 1] = cy; fn[o + 2] = cz;
          bary[o + k] = 1;
        }
      }
      const bufs = { a_position: U.gl.buffer(gl, pos), a_normal: U.gl.buffer(gl, nor), a_fnormal: U.gl.buffer(gl, fn), a_bary: U.gl.buffer(gl, bary) };
      return {
        count: n,
        draw(prog) {
          for (const k in bufs) U.gl.attrib(gl, prog, k, bufs[k], 3);
          gl.drawArrays(gl.TRIANGLES, 0, n);
        },
      };
    }
    const res = P.res;
    const meshes = {
      sphere: unindex(U.geometry.sphere(1, res * 2, res)),
      torus: unindex(U.geometry.torus(0.9, 0.38, res * 2, res)),
      knot: unindex(torusKnot(res * 8, Math.max(4, Math.round(res * 0.8)))),
    };
    const floor = unindex(U.geometry.plane(8, Math.max(1, Math.round(res / 4)), 1));
    const marker = U.geometry.upload(gl, U.geometry.sphere(0.07, 12, 8));

    const LIGHT = `
      uniform vec3 u_lightPos; uniform vec3 u_eye; uniform vec3 u_albedo;
      uniform float u_shininess; uniform float u_specStr;
      vec3 lightModel(vec3 P, vec3 N, float blinn) {
        vec3 L = normalize(u_lightPos - P);
        vec3 V = normalize(u_eye - P);
        float ndl = max(dot(N, L), 0.0);
        float spec = 0.0;
        if (ndl > 0.0) {
          if (blinn > 0.5) { vec3 H = normalize(L + V); spec = pow(max(dot(N, H), 0.0), u_shininess); }
          else { vec3 R = reflect(-L, N); spec = pow(max(dot(R, V), 0.0), u_shininess); }
        }
        float d = length(u_lightPos - P);
        float att = 6.0 / (1.0 + 0.35 * d * d);
        return u_albedo * 0.06 + (u_albedo * ndl + vec3(spec * u_specStr)) * att;
      }`;
    const vs = `
      attribute vec3 a_position; attribute vec3 a_normal; attribute vec3 a_fnormal; attribute vec3 a_bary;
      uniform mat4 u_vp; uniform mat4 u_world; uniform mat3 u_nmat; uniform float u_mode;
      varying vec3 v_pos; varying vec3 v_n; varying vec3 v_color; varying vec3 v_bary;
      ${LIGHT}
      void main(){
        vec4 wp = u_world * vec4(a_position, 1.0);
        vec3 n = normalize(u_nmat * (u_mode < 0.5 ? a_fnormal : a_normal));
        v_pos = wp.xyz; v_n = n; v_bary = a_bary;
        v_color = u_mode < 1.5 ? lightModel(wp.xyz, n, 1.0) : vec3(0.0);
        gl_Position = u_vp * wp;
      }`;
    const fs = (deriv ? '#extension GL_OES_standard_derivatives : enable\n#define HAS_DERIV 1\n' : '') + `
      precision highp float;
      uniform float u_mode; uniform float u_wire;
      varying vec3 v_pos; varying vec3 v_n; varying vec3 v_color; varying vec3 v_bary;
      ${LIGHT}
      void main(){
        vec3 c = u_mode < 1.5 ? v_color : lightModel(v_pos, normalize(v_n), u_mode > 2.5 ? 1.0 : 0.0);
        if (u_wire > 0.5) {
          float m = min(min(v_bary.x, v_bary.y), v_bary.z);
          #ifdef HAS_DERIV
          float e = 1.0 - smoothstep(0.0, fwidth(m) * 1.5, m);
          #else
          float e = 1.0 - smoothstep(0.0, 0.03, m);
          #endif
          c = mix(c, vec3(0.2, 1.0, 0.7), e * 0.85);
        }
        gl_FragColor = vec4(pow(max(c, vec3(0.0)), vec3(1.0 / 2.2)), 1.0);
      }`;
    const prog = U.gl.program(gl, vs, fs);
    const unlit = U.gl.program(gl, `
      attribute vec3 a_position; uniform mat4 u_mvp;
      void main(){ gl_Position = u_mvp * vec4(a_position, 1.0); }`, `
      precision mediump float; uniform vec3 u_color;
      void main(){ gl_FragColor = vec4(u_color, 1.0); }`);

    const cam = { yaw: 0.6, pitch: 0.38, dist: 4.6, drag: false, lx: 0, ly: 0 };
    let lightT = 0.8;

    return {
      update(dt) {
        if (P.autoRotate && !cam.drag) cam.yaw += dt * 0.2;
        if (P.lightMove) lightT += dt * 0.7;
        if (ctx.input.mouse.wheel) cam.dist = U.clamp(cam.dist * Math.pow(1.12, ctx.input.mouse.wheel), 2, 14);
      },
      onPointer(type, m) {
        if (type === 'down') { cam.drag = true; cam.lx = m.x; cam.ly = m.y; }
        else if (type === 'up' || type === 'leave') cam.drag = false;
        else if (type === 'move' && cam.drag) {
          cam.yaw -= (m.x - cam.lx) * 0.008; cam.pitch = U.clamp(cam.pitch + (m.y - cam.ly) * 0.008, -0.2, 1.45);
          cam.lx = m.x; cam.ly = m.y;
        }
      },
      render() {
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clearColor(0.07, 0.08, 0.1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        const proj = M.perspective(U.rad(50), ctx.width / ctx.height, 0.1, 100);
        const eye = M.orbitEye([0, 0, 0], cam.yaw, cam.pitch, cam.dist);
        const vp = M.multiply(proj, M.lookAt(eye, [0, -0.2, 0]));
        const light = [Math.cos(lightT) * 2.2, 1.3 + Math.sin(lightT * 0.7) * 0.4, Math.sin(lightT) * 2.2];

        prog.use();
        gl.uniformMatrix4fv(prog.u('u_vp'), false, vp);
        gl.uniform3fv(prog.u('u_lightPos'), light);
        gl.uniform3fv(prog.u('u_eye'), eye);
        gl.uniform1f(prog.u('u_shininess'), P.shininess);
        gl.uniform1f(prog.u('u_specStr'), P.specStr);
        gl.uniform1f(prog.u('u_mode'), +P.model);
        gl.uniform1f(prog.u('u_wire'), P.wire ? 1 : 0);

        const world = M.create();
        gl.uniformMatrix4fv(prog.u('u_world'), false, world);
        gl.uniformMatrix3fv(prog.u('u_nmat'), false, M.normalMatrix(world));
        gl.uniform3fv(prog.u('u_albedo'), [0.85, 0.35, 0.18]);
        const mesh = meshes[P.shape] || meshes.sphere;
        mesh.draw(prog);

        const fw = M.translation(0, -1.25, 0);
        gl.uniformMatrix4fv(prog.u('u_world'), false, fw);
        gl.uniformMatrix3fv(prog.u('u_nmat'), false, M.normalMatrix(fw));
        gl.uniform3fv(prog.u('u_albedo'), [0.45, 0.47, 0.5]);
        floor.draw(prog);

        unlit.use();
        gl.uniformMatrix4fv(unlit.u('u_mvp'), false, M.multiply(vp, M.translation(light[0], light[1], light[2])));
        gl.uniform3fv(unlit.u('u_color'), [1, 0.95, 0.7]);
        marker.draw(unlit);

        const names = ['Flat', 'Gouraud', 'Phong', 'Blinn-Phong'];
        ctx.stat(GTL.L('모델', 'Model'), names[+P.model]);
        ctx.stat(GTL.L('조명 계산 위치', 'Lighting computed at'), +P.model < 2 ? GTL.L('정점 (', 'Vertices (') + (mesh.count + floor.count) + ')' : GTL.L('픽셀', 'Pixels'));
        ctx.stat(GTL.L('삼각형', 'Triangles'), ((mesh.count + floor.count) / 3) | 0);
        ctx.stat(GTL.L('와이어프레임 AA', 'Wireframe AA'), deriv ? 'fwidth' : GTL.L('미지원(고정 두께)', 'Not supported (fixed width)'));
      },
    };
  },
});
