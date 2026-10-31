// 트라이플래너 매핑 vs UV 매핑: 절벽, 구의 극점, 늘린 상자에서 텍스처가 늘어나는 정도 비교
GTL.register({
  id: 'triplanar-mapping',
  title: '트라이플래너 매핑 vs UV 매핑',
  summary: '위에서 투영한 UV는 가파른 절벽에서 텍스처가 길게 늘어남. 트라이플래너 매핑은 X, Y, Z 세 방향으로 투영해 법선 기준으로 섞음. 그래서 어느 면이든 텍셀 밀도가 고름.',
  renderer: 'webgl',
  views: { a: 'UV 매핑', b: '트라이플래너' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌',
  info: `
    <p><b>UV 매핑</b>은 정점마다 저장한 텍스처 좌표(UV)를 씀. 지형처럼 UV를 위에서 투영(xz)하면 기울어진 면은 넓은 면적에 좁은 UV가 대응됨. 그래서 절벽에 텍스처가 세로 줄무늬처럼 늘어남.</p>
    <p><b>트라이플래너 매핑(triplanar mapping)</b>은 UV 대신 월드 위치를 씀.</p>
    <ol>
      <li>월드 위치를 YZ, XZ, XY 평면에 각각 투영해 텍스처를 3번 샘플링함.</li>
      <li>법선 성분의 절댓값을 k제곱한 값을 가중치로 씀. 가중치 합은 1로 맞춤.</li>
      <li>세 색을 가중치로 섞음.</li>
    </ol>
    <p>장점: UV 펼치기(unwrap) 없이 절차적 지형, 복셀 메시, 크기를 바꾼 오브젝트에 바로 씀. 늘어남이 최대 약 1.73배(√3)로 제한됨.</p>
    <p>단점:</p>
    <ul>
      <li>샘플링 3배. 노멀 맵은 축마다 접선 공간을 따로 맞춰야 함.</li>
      <li>45° 근처 면에서 두 투영이 겹쳐 흐릿하게 섞임. k를 올리면 전환이 좁아지지만 경계가 보임.</li>
      <li>월드 공간 기준이라 움직이는 물체에서는 텍스처가 미끄러짐. 오브젝트 공간 위치를 쓰면 해결됨.</li>
    </ul>`,
  // 도식: 위에서 투영한 UV가 절벽에서 늘어나는 이유와 트라이플래너 가중치
  diagram: (L) => `<svg viewBox="0 0 540 172" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="16" class="t-a">${L('A: 위에서 투영한 UV (단면)', 'A: UV projected from above (slice)')}</text>
    <line x1="20" y1="26" x2="20" y2="140" class="d-dim" stroke-dasharray="2 3"/>
    <line x1="36" y1="26" x2="36" y2="140" class="d-dim" stroke-dasharray="2 3"/>
    <line x1="52" y1="26" x2="52" y2="140" class="d-dim" stroke-dasharray="2 3"/>
    <line x1="68" y1="26" x2="68" y2="140" class="d-dim" stroke-dasharray="2 3"/>
    <line x1="84" y1="26" x2="84" y2="140" class="d-dim" stroke-dasharray="2 3"/>
    <line x1="100" y1="26" x2="100" y2="140" class="d-dim" stroke-dasharray="2 3"/>
    <line x1="116" y1="26" x2="116" y2="122" class="d-dim" stroke-dasharray="2 3"/>
    <line x1="132" y1="26" x2="132" y2="74" class="d-dim" stroke-dasharray="2 3"/>
    <line x1="148" y1="26" x2="148" y2="50" class="d-dim" stroke-dasharray="2 3"/>
    <line x1="164" y1="26" x2="164" y2="50" class="d-dim" stroke-dasharray="2 3"/>
    <line x1="180" y1="26" x2="180" y2="50" class="d-dim" stroke-dasharray="2 3"/>
    <line x1="196" y1="26" x2="196" y2="50" class="d-dim" stroke-dasharray="2 3"/>
    <line x1="212" y1="26" x2="212" y2="50" class="d-dim" stroke-dasharray="2 3"/>
    <line x1="228" y1="26" x2="228" y2="50" class="d-dim" stroke-dasharray="2 3"/>
    <line x1="244" y1="26" x2="244" y2="50" class="d-dim" stroke-dasharray="2 3"/>
    <line x1="260" y1="26" x2="260" y2="50" class="d-dim" stroke-dasharray="2 3"/>
    <polyline points="20.0,140.0 110.0,140.0 140.0,50.0 260.0,50.0" class="d-line"/>
    <line x1="110" y1="140" x2="140" y2="50" class="d-a" stroke-width="4"/>
    <text x="146" y="110" class="t-small">${L('절벽: 텍스처 2칸이', 'Cliff: 2 tiles cover')}</text>
    <text x="146" y="123" class="t-small">${L('세로로 길게 늘어남', 'a tall stretch')}</text>
    <text x="10" y="164" class="t-small t-dim">${L('점선: 텍스처 반복 경계 (xz에서 같은 간격)', 'Dashed: tile borders (even in xz)')}</text>
    <text x="290" y="16" class="t-b">${L('B: 세 축 투영을 법선으로 섞음', 'B: blend 3 axis projections by normal')}</text>
    <text x="290" y="40" class="t-mono t-small">w = |n|^k / sum</text>
    <text x="290" y="69" class="t-small t-mono">X</text>
    <rect x="306" y="58" width="160" height="14" class="f-dim"/>
    <rect x="306" y="58" width="153.6" height="14" class="f-b"/>
    <text x="472" y="69" class="t-small t-mono">0.96</text>
    <text x="290" y="91" class="t-small t-mono">Y</text>
    <rect x="306" y="80" width="160" height="14" class="f-dim"/>
    <rect x="306" y="80" width="6.4" height="14" class="f-b"/>
    <text x="472" y="91" class="t-small t-mono">0.04</text>
    <text x="290" y="113" class="t-small t-mono">Z</text>
    <rect x="306" y="102" width="160" height="14" class="f-dim"/>
    <text x="472" y="113" class="t-small t-mono">0.00</text>
    <text x="290" y="140" class="t-small">${L('절벽 법선 (0.9, 0.4, 0), k = 4', 'Cliff normal (0.9, 0.4, 0), k = 4')}</text>
    <text x="290" y="156" class="t-small t-dim">${L('옆에서 본 투영이 거의 전부라 늘어나지 않음', 'Side projection wins, so no stretch')}</text>
  </svg>`,
  look: [
    'A의 지형 절벽을 보면 원과 격자가 세로로 길게 늘어남. B는 절벽에서도 원이 둥긂.',
    'A의 구 위쪽 극점에서 텍스처가 한 점으로 모이고, 늘린 상자의 긴 면은 가로로 늘어남.',
    '"가중치 보기"를 켜면 X(빨강), Y(초록), Z(파랑) 투영이 어디에 쓰이는지 보임.',
    '블렌드 선명도를 1로 낮추면 경사면에서 세 투영이 겹쳐 흐려짐. 16 이상이면 경계가 날카롭게 보임.',
  ],
  refs: [
    { type: 'book', title: 'GPU Gems 3, Chapter 1: Generating Complex Procedural Terrains Using the GPU (Ryan Geiss)', url: 'https://developer.nvidia.com/gpugems/gpugems3/part-i-geometry/chapter-1-generating-complex-procedural-terrains-using-gpu', year: 2007, note: 'Texturing 절에서 트라이플래너 투영과 법선 가중치를 설명함.' },
    { type: 'article', title: 'Normal Mapping for a Triplanar Shader (Ben Golus)', url: 'https://bgolus.medium.com/normal-mapping-for-a-triplanar-shader-10bf39dca05a', year: 2017, note: '블렌드 가중치와 축별 노멀 맵 처리.' },
    { type: 'engine', title: 'Unity Shader Graph: Triplanar Node', url: 'https://docs.unity3d.com/Packages/com.unity.shadergraph@10.0/manual/Triplanar-Node.html' },
  ],
  params: [
    { key: 'mapping', label: '매핑', type: 'select', group: '매핑', options: [
      { value: 'uv', label: 'UV (지형은 위에서 투영)' },
      { value: 'tri', label: '트라이플래너 (월드)' },
    ], a: 'uv', b: 'tri' },
    { key: 'sharp', label: '블렌드 선명도 k', type: 'range', min: 1, max: 32, step: 0.5, default: 4, when: (p) => p.mapping === 'tri' },
    { key: 'showWeights', label: '가중치 보기', type: 'bool', default: false, when: (p) => p.mapping === 'tri' },
    { key: 'texScale', label: '텍스처 밀도 (반복/m)', type: 'range', min: 0.1, max: 2, step: 0.05, default: 0.5, shared: true, group: '장면' },
    { key: 'pattern', label: '텍스처', type: 'select', options: [
      { value: 'grid', label: '원 + 격자' },
      { value: 'rock', label: '바위 노이즈' },
    ], default: 'grid', shared: true, reset: true },
    { key: 'cliff', label: '절벽 높이 (m)', type: 'range', min: 0.5, max: 4, step: 0.1, default: 2.4, shared: true, reset: true },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Triplanar Mapping vs UV Mapping',
    summary: 'UVs projected from above stretch the texture on steep cliffs. Triplanar mapping projects along X, Y, and Z, then blends by the normal. So texel density stays even on every face.',
    views: { a: 'UV mapping', b: 'Triplanar' },
    controls: 'Mouse drag: rotate camera, wheel: zoom',
    info: `
    <p><b>UV mapping</b> uses texture coordinates (UVs) stored per vertex. If you project terrain UVs from above (xz), a sloped face covers a large area with a small UV range. So the texture stretches into vertical streaks on cliffs.</p>
    <p><b>Triplanar mapping</b> uses the world position instead of UVs.</p>
    <ul>
      <li>Project the world position onto the YZ, XZ, and XY planes, and sample the texture 3 times.</li>
      <li>Use the absolute normal components raised to the power k as weights. Normalize the weights so they sum to 1.</li>
      <li>Blend the three colors by the weights.</li>
    </ul>
    <p>Pros: works right away on procedural terrain, voxel meshes, and scaled objects, with no UV unwrap. Stretching is limited to about 1.73x (√3) at most.</p>
    <p>Cons:</p>
    <ul>
      <li>3 times the sampling. Normal maps need a separate tangent space fix for each axis.</li>
      <li>On faces near 45°, two projections overlap and blend into a blur. Raising k narrows the transition, but the seam shows.</li>
      <li>It works in world space, so the texture slides on moving objects. Using the object space position fixes this.</li>
    </ul>`,
    look: [
      'Look at the terrain cliff in A. Circles and the grid stretch tall. In B, circles stay round even on the cliff.',
      'In A, the texture pinches to a point at the top pole of the sphere. The long face of the stretched box stretches sideways.',
      'Turn on "Show weights". You see where the X (red), Y (green), and Z (blue) projections apply.',
      'Lower blend sharpness to 1. The three projections overlap and blur on slopes. At 16 or more, the seams look sharp.',
    ],
    refs: ['The Texturing section explains triplanar projection and normal weights.', 'Blend weights and per-axis normal map handling.'],
    params: {
      mapping: { label: 'Mapping', group: 'Mapping', options: { uv: 'UV (terrain projected from above)', tri: 'Triplanar (world)' } },
      sharp: 'Blend sharpness k',
      showWeights: 'Show weights',
      texScale: { label: 'Texture density (repeats/m)', group: 'Scene' },
      pattern: { label: 'Texture', options: { grid: 'Circles + grid', rock: 'Rock noise' } },
      cliff: 'Cliff height (m)',
      autoRotate: 'Auto rotate',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params, G = U.geometry;

    // ── 지형: 계단식 절벽 + 잔물결. UV = 월드 xz ──
    const nz = U.noise(ctx.seed);
    const SIZE = 12, DIV = 96, CH = P.cliff;
    const height = (x, z) => {
      const m = nz.perlin2(x * 0.16 + 3.1, z * 0.16 - 1.7);
      return CH * U.smoothstep(-0.06, 0.06, m) + CH * 0.5 * U.smoothstep(0.18, 0.26, m) + 0.15 * nz.fbm2(x * 0.6, z * 0.6, { octaves: 3 });
    };
    const Pp = [], Nn = [], Tt = [], Ii = [];
    for (let j = 0; j <= DIV; j++) for (let i = 0; i <= DIV; i++) {
      const x = (i / DIV - 0.5) * SIZE, z = (j / DIV - 0.5) * SIZE, e = 0.02;
      const y = height(x, z);
      const dx = (height(x + e, z) - height(x - e, z)) / (2 * e), dz = (height(x, z + e) - height(x, z - e)) / (2 * e);
      const l = Math.hypot(dx, 1, dz);
      Pp.push(x, y, z); Nn.push(-dx / l, 1 / l, -dz / l); Tt.push(x, z);
    }
    for (let j = 0; j < DIV; j++) for (let i = 0; i < DIV; i++) {
      const a = j * (DIV + 1) + i, b = a + DIV + 1;
      Ii.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const terrainGeo = { positions: new Float32Array(Pp), normals: new Float32Array(Nn), uvs: new Float32Array(Tt), indices: new Uint16Array(Ii), count: Ii.length };
    // 늘어남 측정: 삼각형마다 (3D 면적 / UV 면적)의 제곱근. 위 투영은 1/|ny|, 트라이플래너는 1/max(|n|)
    let maxUV = 1, maxTri = 1, areaAll = 0, areaUV2 = 0, areaTri2 = 0;
    for (let t = 0; t < Ii.length; t += 3) {
      const A = Ii[t] * 3, B = Ii[t + 1] * 3, C = Ii[t + 2] * 3;
      const ux = Pp[B] - Pp[A], uy = Pp[B + 1] - Pp[A + 1], uz = Pp[B + 2] - Pp[A + 2];
      const vx = Pp[C] - Pp[A], vy = Pp[C + 1] - Pp[A + 1], vz = Pp[C + 2] - Pp[A + 2];
      const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
      const area = Math.hypot(cx, cy, cz) * 0.5;
      if (area < 1e-9) continue;
      const ny = Math.abs(cy) / (2 * area), nmax = Math.max(Math.abs(cx), Math.abs(cy), Math.abs(cz)) / (2 * area);
      const sUV = 1 / Math.max(ny, 1e-3), sTri = 1 / nmax;
      maxUV = Math.max(maxUV, sUV); maxTri = Math.max(maxTri, sTri);
      areaAll += area; if (sUV > 2) areaUV2 += area; if (sTri > 2) areaTri2 += area;
    }

    const T = M.translation, S = M.scaling;
    const objs = [
      { m: G.upload(gl, terrainGeo), w: M.create(), uvs: null, c: [0.85, 0.82, 0.76] },
      { m: G.upload(gl, G.sphere(1.2, 48, 24)), w: T(-2.5, CH + 1.6, -2.2), uvs: [4, 2], c: [0.8, 0.85, 0.95] },
      { m: G.upload(gl, G.cube(1)), w: M.mul(T(2.2, CH + 1.2, 2.4), M.rotationY(0.5), S(4, 0.7, 0.7)), uvs: [1, 1], c: [0.95, 0.8, 0.7] },
    ];
    for (const o of objs) o.n = M.normalMatrix(o.w);

    // ── 절차적 텍스처 ──
    const TS = 256, cv = ctx.createCanvas(TS, TS), g = cv.getContext('2d');
    if (P.pattern === 'grid') {
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
        g.fillStyle = (x + y) % 2 ? '#c9c2b4' : '#8f8676'; g.fillRect(x * 64, y * 64, 64, 64);
      }
      g.strokeStyle = '#2b2620'; g.lineWidth = 3;
      for (let i = 0; i <= TS; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, TS); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(TS, i); g.stroke(); }
      const cols = ['#d0573a', '#3a7fd0', '#3fae55', '#d0b33a'];
      for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
        g.strokeStyle = cols[y * 2 + x]; g.lineWidth = 7;
        g.beginPath(); g.arc(64 + x * 128, 64 + y * 128, 42, 0, U.TAU); g.stroke();
      }
    } else {
      const n2 = U.noise(11), img = g.createImageData(TS, TS);
      for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
        // 타일링되도록 주기 4의 좌표를 원 위에 매핑
        const ax = x / TS * U.TAU, ay = y / TS * U.TAU;
        const v = n2.perlin3(Math.cos(ax) * 1.3 + Math.cos(ay) * 0.3, Math.sin(ax) * 1.3 + 2, Math.cos(ay) * 1.3 + Math.sin(ay) * 1.3) * 0.5
          + n2.perlin3(Math.cos(ax) * 3.1, Math.sin(ax) * 3.1 + Math.cos(ay) * 3.1, Math.sin(ay) * 3.1) * 0.35;
        const crack = Math.abs(n2.perlin3(Math.cos(ax) * 2, Math.sin(ax) * 2, Math.cos(ay) * 2 + Math.sin(ay) * 2 + 7)) < 0.03 ? 0.45 : 1;
        const b = U.clamp(0.55 + v, 0, 1) * crack * 255, i = (y * TS + x) * 4;
        img.data[i] = b * 0.95; img.data[i + 1] = b * 0.88; img.data[i + 2] = b * 0.78; img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    }
    const tex = U.gl.texture(gl, cv, { wrap: 'repeat', mipmap: true });

    const prog = U.gl.program(gl, `
      attribute vec3 a_position; attribute vec3 a_normal; attribute vec2 a_uv;
      uniform mat4 u_vp; uniform mat4 u_world; uniform mat3 u_nmat;
      varying vec3 v_pos; varying vec3 v_n; varying vec2 v_uv;
      void main(){
        vec4 wp = u_world * vec4(a_position, 1.0);
        v_pos = wp.xyz; v_n = normalize(u_nmat * a_normal); v_uv = a_uv;
        gl_Position = u_vp * wp;
      }`, `
      precision highp float;
      uniform sampler2D u_tex; uniform float u_tri; uniform float u_k; uniform float u_scale;
      uniform vec2 u_uvScale; uniform float u_showW; uniform vec3 u_color; uniform vec3 u_light;
      varying vec3 v_pos; varying vec3 v_n; varying vec2 v_uv;
      void main(){
        vec3 N = normalize(v_n);
        vec3 alb;
        if (u_tri > 0.5) {
          vec3 w = pow(abs(N), vec3(u_k));
          w /= (w.x + w.y + w.z);
          vec3 cx = texture2D(u_tex, v_pos.zy * u_scale).rgb;
          vec3 cy = texture2D(u_tex, v_pos.xz * u_scale).rgb;
          vec3 cz = texture2D(u_tex, v_pos.xy * u_scale).rgb;
          alb = cx * w.x + cy * w.y + cz * w.z;
          if (u_showW > 0.5) alb = mix(alb, w, 0.7);
        } else {
          alb = texture2D(u_tex, v_uv * u_uvScale).rgb;
        }
        alb = pow(alb, vec3(2.2)) * u_color;
        float d = max(dot(N, u_light), 0.0);
        vec3 c = alb * (vec3(0.22, 0.25, 0.32) * (0.6 + 0.4 * N.y) + vec3(1.0, 0.95, 0.85) * 1.3 * d);
        gl_FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
      }`);

    const cam = { yaw: 0.9, pitch: 0.45, dist: 13, drag: false, lx: 0, ly: 0 };
    const L = (() => { const v = [0.45, 0.75, 0.35], l = Math.hypot(...v); return v.map((x) => x / l); })();

    return {
      update(dt) {
        if (P.autoRotate && !cam.drag) cam.yaw += dt * 0.12;
        if (ctx.input.mouse.wheel) cam.dist = U.clamp(cam.dist * Math.pow(1.12, ctx.input.mouse.wheel), 3, 30);
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
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clearColor(0.1, 0.11, 0.14, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        const tgt = [0, CH * 0.6, 0];
        const proj = M.perspective(U.rad(50), ctx.width / ctx.height, 0.1, 100);
        const vp = M.multiply(proj, M.lookAt(M.orbitEye(tgt, cam.yaw, cam.pitch, cam.dist), tgt));
        const tri = P.mapping === 'tri';
        prog.use();
        gl.uniformMatrix4fv(prog.u('u_vp'), false, vp);
        gl.uniform1f(prog.u('u_tri'), tri ? 1 : 0);
        gl.uniform1f(prog.u('u_k'), P.sharp);
        gl.uniform1f(prog.u('u_scale'), P.texScale);
        gl.uniform1f(prog.u('u_showW'), P.showWeights ? 1 : 0);
        gl.uniform3fv(prog.u('u_light'), L);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(prog.u('u_tex'), 0);
        for (const o of objs) {
          gl.uniformMatrix4fv(prog.u('u_world'), false, o.w);
          gl.uniformMatrix3fv(prog.u('u_nmat'), false, o.n);
          gl.uniform2fv(prog.u('u_uvScale'), o.uvs || [P.texScale, P.texScale]);
          gl.uniform3fv(prog.u('u_color'), o.c);
          o.m.draw(prog);
        }
        gl.disable(gl.CULL_FACE);
        ctx.stat(GTL.L('텍스처 샘플/픽셀', 'Texture samples/pixel'), tri ? 3 : 1);
        ctx.stat(GTL.L('지형 최대 늘어남', 'Max terrain stretch'), (tri ? maxTri : maxUV).toFixed(2) + GTL.L('배', 'x'));
        ctx.stat(GTL.L('2배 넘게 늘어난 면적', 'Area stretched over 2x'), ((tri ? areaTri2 : areaUV2) / areaAll * 100).toFixed(1) + '%');
      },
    };
  },
});
