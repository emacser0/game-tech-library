// 노멀 매핑 & 패럴랙스 오클루전 매핑 (탄젠트 공간)
GTL.register({
  id: 'normal-mapping',
  title: '노멀 매핑 & 패럴랙스 매핑',
  summary: '정점은 그대로 두고 픽셀마다 텍스처에서 법선을 읽어 조명. 저폴리곤 표면에 요철이 생김. 패럴랙스 오클루전 매핑은 깊이감까지 더함.',
  renderer: 'webgl',
  views: { a: '정점 법선만', b: '노멀 맵' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌',
  info: `
    <p><b>노멀 맵(normal map)</b>은 텍셀마다 법선 방향을 RGB로 저장한 텍스처. 기준은 <b>탄젠트 공간(tangent space)</b>: T = U 방향, B = V 방향, N = 표면 법선.</p>
    <p>폴리곤을 늘리지 않고 표면에 요철을 그릴 수 있어 필요</p>
    <p>동작 원리:</p>
    <ul>
      <li>셰이더가 정점에서 받은 TBN 행렬로 법선을 월드 공간으로 바꿔 조명</li>
      <li>탄젠트는 삼각형의 위치와 UV 변화로 CPU에서 계산(Lengyel 방식, w = 손잡이 방향)</li>
      <li>노멀 맵은 절차적 높이맵을 중앙 차분해 만듦. 높이는 알파 채널에 넣음.</li>
    </ul>
    <p><b>초록 채널 반전</b>은 흔한 버그를 재현. OpenGL(Y+)과 DirectX(Y−)의 노멀 맵 규약이 달라 생김. 요철이 한 축으로만 뒤집혀 보임.</p>
    <p><b>패럴랙스 오클루전 매핑(POM)</b>은 시선 방향으로 높이맵을 여러 층 샘플링해 교차점을 찾고 UV를 옮김. 비스듬히 보면 벽돌이 실제로 튀어나와 보임.</p>
    <p>단점: 실루엣은 바뀌지 않음. WebGL1의 루프 제약 때문에 고정 24단계로 샘플링.</p>`,
  // 도식: 정점 법선만 쓸 때와 노멀 맵으로 텍셀마다 법선을 바꿀 때
  diagram: (L) => `<svg viewBox="0 0 540 190" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arrA" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker><marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="20" y="16" class="t-a">${L('A: 정점 법선만', 'A: vertex normals only')}</text>
    <rect x="20" y="110" width="220" height="10" class="f-dim"/>
    <line x1="35" y1="110" x2="35" y2="70" class="d-a" marker-end="url(#arrA)"/>
    <line x1="60" y1="110" x2="60" y2="70" class="d-a" marker-end="url(#arrA)"/>
    <line x1="85" y1="110" x2="85" y2="70" class="d-a" marker-end="url(#arrA)"/>
    <line x1="110" y1="110" x2="110" y2="70" class="d-a" marker-end="url(#arrA)"/>
    <line x1="135" y1="110" x2="135" y2="70" class="d-a" marker-end="url(#arrA)"/>
    <line x1="160" y1="110" x2="160" y2="70" class="d-a" marker-end="url(#arrA)"/>
    <line x1="185" y1="110" x2="185" y2="70" class="d-a" marker-end="url(#arrA)"/>
    <line x1="210" y1="110" x2="210" y2="70" class="d-a" marker-end="url(#arrA)"/>
    <line x1="235" y1="110" x2="235" y2="70" class="d-a" marker-end="url(#arrA)"/>
    <text x="20" y="140" class="t-small">${L('평평한 면은 조명도 평평함', 'A flat face lights flat')}</text>
    <text x="290" y="16" class="t-b">${L('B: 텍셀마다 법선 (노멀 맵)', 'B: a normal per texel (normal map)')}</text>
    <rect x="290" y="110" width="220" height="10" class="f-dim"/>
    <polyline points="290.0,100.0 294.0,99.6 298.0,98.4 302.0,96.6 306.0,94.4 310.0,92.0 314.0,89.7 318.0,87.8 322.0,86.6 326.0,86.0 330.0,86.3 334.0,87.3 338.0,89.0 342.0,91.2 346.0,93.6 350.0,95.9 354.0,97.9 358.0,99.3 362.0,100.0 366.0,99.8 370.0,98.9 374.0,97.3 378.0,95.2 382.0,92.8 386.0,90.5 390.0,88.4 394.0,86.9 398.0,86.1 402.0,86.1 406.0,86.9 410.0,88.4 414.0,90.5 418.0,92.8 422.0,95.2 426.0,97.3 430.0,98.9 434.0,99.8 438.0,100.0 442.0,99.3 446.0,97.9 450.0,95.9 454.0,93.6 458.0,91.2 462.0,89.0 466.0,87.3 470.0,86.3 474.0,86.0 478.0,86.6 482.0,87.8 486.0,89.7 490.0,92.0 494.0,94.4 498.0,96.6 502.0,98.4 506.0,99.6 510.0,100.0" class="d-dim" stroke-dasharray="3 3"/>
    <line x1="305" y1="110" x2="285.1" y2="75.3" class="d-b" marker-end="url(#arrB)"/>
    <line x1="330" y1="110" x2="336.7" y2="70.6" class="d-b" marker-end="url(#arrB)"/>
    <line x1="355" y1="110" x2="369.6" y2="72.8" class="d-b" marker-end="url(#arrB)"/>
    <line x1="380" y1="110" x2="359.6" y2="75.6" class="d-b" marker-end="url(#arrB)"/>
    <line x1="405" y1="110" x2="414.7" y2="71.2" class="d-b" marker-end="url(#arrB)"/>
    <line x1="430" y1="110" x2="442.3" y2="71.9" class="d-b" marker-end="url(#arrB)"/>
    <line x1="455" y1="110" x2="434.4" y2="75.7" class="d-b" marker-end="url(#arrB)"/>
    <line x1="480" y1="110" x2="492.3" y2="71.9" class="d-b" marker-end="url(#arrB)"/>
    <line x1="505" y1="110" x2="514.7" y2="71.2" class="d-b" marker-end="url(#arrB)"/>
    <text x="290" y="140" class="t-small">${L('점선 요철을 법선만으로 흉내 냄', 'Fakes the dotted bumps with normals')}</text>
    <text x="20" y="166" class="t-mono t-small">n = TBN * (rgb * 2 - 1)</text>
    <text x="20" y="182" class="t-small t-dim">${L('T = U 방향, B = V 방향, N = 표면 법선. 실루엣은 그대로임', 'T = U axis, B = V axis, N = surface normal. Silhouette does not change')}</text>
  </svg>`,
  look: [
    '광원이 움직일 때 A는 평평한 벽지처럼 보임. B는 벽돌 모서리에 그림자와 하이라이트가 생김.',
    'B를 "패럴랙스 오클루전"으로 바꾸고 카메라를 낮춰 비스듬히 보면 줄눈이 움푹 들어가 보임. 구의 가장자리(실루엣)는 여전히 매끈함.',
    '"초록 채널 반전"을 켜면 위아래 요철만 뒤집혀 광원이 엉뚱한 쪽에서 비추는 것처럼 보임',
    '디버그를 "탄젠트(T)"로 바꾸면 큐브는 면마다, 구는 경도 방향으로 탄젠트가 바뀌는 모습이 색으로 보임',
  ],
  refs: [
    { type: 'paper', title: 'Simulation of Wrinkled Surfaces (James F. Blinn)', url: 'https://dl.acm.org/doi/10.1145/965139.507101', year: 1978, note: 'SIGGRAPH 78. 범프 매핑의 원조.' },
    { type: 'paper', title: 'Efficient Bump Mapping Hardware (Peercy, Airey, Cabral)', year: 1997, note: 'SIGGRAPH 97. 탄젠트 공간 법선 섭동.' },
    { type: 'book', title: 'Mathematics for 3D Game Programming and Computer Graphics (Eric Lengyel): Computing Tangent Space Basis Vectors', note: '정점별 탄젠트와 손잡이(w) 계산법' },
    { type: 'paper', title: 'Dynamic Parallax Occlusion Mapping with Approximate Soft Shadows (Natalya Tatarchuk)', year: 2006, note: 'I3D 2006 / ATI. POM.' },
    { type: 'article', title: 'LearnOpenGL: Normal Mapping / Parallax Mapping', url: 'https://learnopengl.com/Advanced-Lighting/Parallax-Mapping' },
  ],
  params: [
    { key: 'mode', label: '법선', type: 'select', group: '셰이딩', options: [
      { value: 'none', label: '정점 법선만' },
      { value: 'normal', label: '노멀 맵' },
      { value: 'pom', label: '노멀 맵 + 패럴랙스 오클루전' },
    ], a: 'none', b: 'normal' },
    { key: 'strength', label: '노멀 세기', type: 'range', min: 0, max: 2, step: 0.05, default: 1, when: (p) => p.mode !== 'none' },
    { key: 'heightScale', label: '패럴랙스 깊이', type: 'range', min: 0, max: 0.12, step: 0.005, default: 0.05, when: (p) => p.mode === 'pom' },
    { key: 'flipGreen', label: '초록 채널 반전 (규약 버그)', type: 'bool', default: false, when: (p) => p.mode !== 'none' },
    { key: 'debug', label: '디버그 보기', type: 'select', options: [
      { value: 0, label: '끔' },
      { value: 1, label: '최종 법선 (월드)' },
      { value: 2, label: '탄젠트 (T)' },
    ], default: 0 },
    { key: 'shape', label: '모양', type: 'select', group: '장면', options: [
      { value: 'cube', label: '큐브' },
      { value: 'plane', label: '평면' },
      { value: 'sphere', label: '구' },
      { value: 'torus', label: '토러스' },
    ], default: 'cube', shared: true },
    { key: 'pattern', label: '패턴', type: 'select', options: [
      { value: 'bricks', label: '벽돌' },
      { value: 'rivets', label: '리벳 패널' },
    ], default: 'bricks', shared: true, reset: true },
    { key: 'tiling', label: 'UV 반복', type: 'range', min: 0.5, max: 6, step: 0.5, default: 1.5, shared: true },
    { key: 'lightMove', label: '광원 이동', type: 'bool', default: true, shared: true },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Normal Mapping & Parallax Mapping',
    summary: 'Keep the vertices as they are, and light each pixel with a normal read from a texture. A low-poly surface gets bumps. Parallax occlusion mapping also adds depth.',
    views: { a: 'Vertex normals only', b: 'Normal map' },
    controls: 'Mouse drag: rotate camera. Wheel: zoom.',
    info: `
    <p>A <b>normal map</b> is a texture that stores a normal direction as RGB in each texel. It uses <b>tangent space</b>: T = U direction, B = V direction, N = surface normal.</p>
    <p>You need it because it draws bumps on a surface without adding polygons.</p>
    <p>How it works:</p>
    <ul>
      <li>The shader uses the TBN matrix from the vertices to turn the normal into world space, then lights it.</li>
      <li>The CPU computes tangents from the position and UV changes of each triangle (Lengyel method, w = handedness).</li>
      <li>The normal map comes from central differences of a procedural height map. The height goes in the alpha channel.</li>
    </ul>
    <p><b>Flip green channel</b> reproduces a common bug. It happens because OpenGL (Y+) and DirectX (Y−) use different normal map conventions. The bumps look flipped along one axis only.</p>
    <p><b>Parallax occlusion mapping (POM)</b> samples the height map in several layers along the view direction, finds the hit point, and shifts the UV. At a slant, the bricks really seem to stick out.</p>
    <p>Downside: the silhouette does not change. WebGL1 loop limits force a fixed 24 sample steps.</p>`,
    look: [
      'As the light moves, A looks like flat wallpaper. B gets shadows and highlights on the brick edges.',
      'Switch B to "Parallax occlusion" and lower the camera to look at a slant. The mortar lines look sunken. The sphere edge (silhouette) is still smooth.',
      'Turn on "Flip green channel". Only the up and down bumps flip, so the light seems to come from the wrong side.',
      'Set debug to "Tangent (T)". Colors show the tangent changing per face on the cube and along longitude on the sphere.',
    ],
    refs: ['SIGGRAPH 78. The origin of bump mapping.', 'SIGGRAPH 97. Normal perturbation in tangent space.', 'How to compute per-vertex tangents and handedness (w).', 'I3D 2006 / ATI. POM.', null],
    params: {
      mode: { label: 'Normals', group: 'Shading', options: { none: 'Vertex normals only', normal: 'Normal map', pom: 'Normal map + parallax occlusion' } },
      strength: 'Normal strength',
      heightScale: 'Parallax depth',
      flipGreen: 'Flip green channel (convention bug)',
      debug: { label: 'Debug view', options: { 0: 'Off', 1: 'Final normal (world)', 2: 'Tangent (T)' } },
      shape: { label: 'Shape', group: 'Scene', options: { cube: 'Cube', plane: 'Plane', sphere: 'Sphere', torus: 'Torus' } },
      pattern: { label: 'Pattern', options: { bricks: 'Bricks', rivets: 'Rivet panel' } },
      tiling: 'UV tiling',
      lightMove: 'Move light',
      autoRotate: 'Auto rotate',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params;

    // ── 절차적 높이맵 → 노멀 맵(RGB) + 높이(A), 알베도 ──
    const S = 256;
    const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const tileNoise = (x, y, period) => { // 주기적(타일링 가능) value noise
      const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
      const w = (t) => t * t * (3 - 2 * t), u = w(fx), v = w(fy);
      const h = (a, b) => hash(((a % period) + period) % period, ((b % period) + period) % period);
      return U.lerp(U.lerp(h(ix, iy), h(ix + 1, iy), u), U.lerp(h(ix, iy + 1), h(ix + 1, iy + 1), u), v);
    };
    const height = new Float32Array(S * S), albedo = new Uint8Array(S * S * 4);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const n = tileNoise(x / 16, y / 16, 16) * 0.6 + tileNoise(x / 6, y / 6, Math.round(S / 6)) * 0.4;
      let h, r, g, b;
      if (P.pattern === 'bricks') {
        const row = Math.floor(y / 32), off = row % 2 ? 32 : 0;
        const bx = ((x + off) % 64), by = y % 32, id = Math.floor(((x + off) % S) / 64) + row * 7;
        const e = Math.min(bx - 2, 62 - bx, by - 2, 30 - by);
        const bevel = U.smoothstep(0, 7, e);
        h = e < 0 ? 0.05 + n * 0.08 : 0.25 + bevel * 0.6 + n * 0.15;
        const tint = hash(id, 3) * 0.25;
        if (e < 0) { r = 150; g = 145; b = 135; }
        else { r = 150 + tint * 200; g = 62 + tint * 60; b = 45 + tint * 30; }
        r *= 0.8 + n * 0.4; g *= 0.8 + n * 0.4; b *= 0.8 + n * 0.4;
      } else {
        const cx = (x % 64) - 32, cy = (y % 64) - 32, d = Math.hypot(cx, cy);
        const groove = Math.min(x % 128, 128 - (x % 128), y % 128, 128 - (y % 128));
        h = 0.4 + n * 0.05 - (groove < 3 ? 0.3 : 0);
        if (d < 11) h += Math.sqrt(1 - (d / 11) ** 2) * 0.45;
        const v = 120 + n * 60;
        r = v * 0.95; g = v; b = v * 1.08;
      }
      height[y * S + x] = U.clamp(h, 0, 1);
      const i = (y * S + x) * 4;
      albedo[i] = U.clamp(r, 0, 255); albedo[i + 1] = U.clamp(g, 0, 255); albedo[i + 2] = U.clamp(b, 0, 255); albedo[i + 3] = 255;
    }
    const nmap = new Uint8Array(S * S * 4), H = (x, y) => height[((y + S) % S) * S + ((x + S) % S)];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      // 캔버스 행(y)이 증가 = 텍스처 v 증가 = 탄젠트 공간 +B
      const dx = (H(x + 1, y) - H(x - 1, y)) * 0.5 * 12, dy = (H(x, y + 1) - H(x, y - 1)) * 0.5 * 12;
      let nx = -dx, ny = -dy, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
      const i = (y * S + x) * 4;
      nmap[i] = (nx * 0.5 + 0.5) * 255; nmap[i + 1] = (ny * 0.5 + 0.5) * 255; nmap[i + 2] = (nz * 0.5 + 0.5) * 255; nmap[i + 3] = H(x, y) * 255;
    }
    const texN = U.gl.texture(gl, { width: S, height: S, data: nmap }, { wrap: 'repeat', mipmap: true });
    const texA = U.gl.texture(gl, { width: S, height: S, data: albedo }, { wrap: 'repeat', mipmap: true });

    // ── 지오메트리 + 탄젠트 (Lengyel) ──
    function withTangents(g) {
      const n = g.positions.length / 3, idx = g.indices;
      const t1 = new Float32Array(n * 3), t2 = new Float32Array(n * 3);
      for (let t = 0; t < idx.length; t += 3) {
        const a = idx[t], b = idx[t + 1], c = idx[t + 2], p = g.positions, uv = g.uvs;
        const e1 = [p[b * 3] - p[a * 3], p[b * 3 + 1] - p[a * 3 + 1], p[b * 3 + 2] - p[a * 3 + 2]];
        const e2 = [p[c * 3] - p[a * 3], p[c * 3 + 1] - p[a * 3 + 1], p[c * 3 + 2] - p[a * 3 + 2]];
        const du1 = uv[b * 2] - uv[a * 2], dv1 = uv[b * 2 + 1] - uv[a * 2 + 1], du2 = uv[c * 2] - uv[a * 2], dv2 = uv[c * 2 + 1] - uv[a * 2 + 1];
        const det = du1 * dv2 - du2 * dv1;
        if (Math.abs(det) < 1e-12) continue;
        const r = 1 / det;
        for (const v of [a, b, c]) for (let k = 0; k < 3; k++) {
          t1[v * 3 + k] += (e1[k] * dv2 - e2[k] * dv1) * r;
          t2[v * 3 + k] += (e2[k] * du1 - e1[k] * du2) * r;
        }
      }
      const tan = new Float32Array(n * 4);
      for (let v = 0; v < n; v++) {
        const N = [g.normals[v * 3], g.normals[v * 3 + 1], g.normals[v * 3 + 2]], T = [t1[v * 3], t1[v * 3 + 1], t1[v * 3 + 2]];
        const d = N[0] * T[0] + N[1] * T[1] + N[2] * T[2];
        let tx = T[0] - N[0] * d, ty = T[1] - N[1] * d, tz = T[2] - N[2] * d;
        let l = Math.hypot(tx, ty, tz);
        if (l < 1e-8) { tx = Math.abs(N[0]) < 0.9 ? 1 : 0; ty = tx ? 0 : 1; tz = 0; l = 1; } // 극점 등 퇴화
        tx /= l; ty /= l; tz /= l;
        const cx = N[1] * tz - N[2] * ty, cy = N[2] * tx - N[0] * tz, cz = N[0] * ty - N[1] * tx;
        const w = cx * t2[v * 3] + cy * t2[v * 3 + 1] + cz * t2[v * 3 + 2] < 0 ? -1 : 1;
        tan.set([tx, ty, tz, w], v * 4);
      }
      const mesh = U.geometry.upload(gl, g), tb = U.gl.buffer(gl, tan);
      return { count: g.count, draw(prog) { U.gl.attrib(gl, prog, 'a_tangent', tb, 4); mesh.draw(prog); } };
    }
    const torusG = U.geometry.torus(0.85, 0.4, 64, 32);
    const meshes = {
      cube: withTangents(U.geometry.cube(1.6)),
      plane: withTangents(U.geometry.plane(3.2, 1, 2)),
      sphere: withTangents(U.geometry.sphere(1, 64, 32)),
      torus: withTangents(torusG),
    };
    const marker = U.geometry.upload(gl, U.geometry.sphere(0.05, 12, 8));

    const vs = `
      attribute vec3 a_position; attribute vec3 a_normal; attribute vec2 a_uv; attribute vec4 a_tangent;
      uniform mat4 u_vp; uniform mat4 u_world; uniform mat3 u_nmat; uniform float u_tiling;
      varying vec3 v_pos; varying vec3 v_n; varying vec3 v_t; varying vec3 v_b; varying vec2 v_uv;
      void main(){
        vec4 wp = u_world * vec4(a_position, 1.0);
        v_pos = wp.xyz;
        v_n = normalize(u_nmat * a_normal);
        v_t = normalize(mat3(u_world[0].xyz, u_world[1].xyz, u_world[2].xyz) * a_tangent.xyz);
        v_b = cross(v_n, v_t) * a_tangent.w;
        v_uv = a_uv * u_tiling;
        gl_Position = u_vp * wp;
      }`;
    const fs = `
      precision highp float;
      uniform sampler2D u_nmap; uniform sampler2D u_albedo;
      uniform vec3 u_eye; uniform vec3 u_lightPos;
      uniform float u_mode; uniform float u_strength; uniform float u_heightScale; uniform float u_flipG; uniform float u_debug;
      varying vec3 v_pos; varying vec3 v_n; varying vec3 v_t; varying vec3 v_b; varying vec2 v_uv;
      vec2 pom(vec2 uv, vec3 Vt) {
        float dl = 1.0 / 24.0;
        vec2 duv = Vt.xy / max(Vt.z, 0.2) * u_heightScale * dl;
        float prevD = 1.0 - texture2D(u_nmap, uv).a;
        float prevCur = 0.0;
        vec2 prevUV = uv;
        vec2 res = uv - duv * 24.0;
        float found = prevD <= 0.0 ? 1.0 : 0.0;
        if (found > 0.5) res = uv;
        for (int i = 1; i <= 24; i++) {
          vec2 nuv = uv - duv * float(i);
          float ncur = dl * float(i);
          float nd = 1.0 - texture2D(u_nmap, nuv).a;
          if (found < 0.5 && ncur >= nd) {
            float after = nd - ncur;
            float before = prevD - prevCur;
            float w = after / (after - before - 1e-5);
            res = mix(nuv, prevUV, w);
            found = 1.0;
          }
          prevUV = nuv; prevD = nd; prevCur = ncur;
        }
        return res;
      }
      void main(){
        vec3 N = normalize(v_n), T = normalize(v_t), B = normalize(v_b);
        vec3 V = normalize(u_eye - v_pos);
        vec2 uv = v_uv;
        if (u_mode > 1.5) uv = pom(v_uv, vec3(dot(V, T), dot(V, B), dot(V, N)));
        vec3 n = N;
        if (u_mode > 0.5) {
          vec3 t = texture2D(u_nmap, uv).xyz * 2.0 - 1.0;
          if (u_flipG > 0.5) t.y = -t.y;
          t.xy *= u_strength;
          n = normalize(mat3(T, B, N) * t);
        }
        vec3 L = normalize(u_lightPos - v_pos);
        vec3 Hh = normalize(L + V);
        float d = length(u_lightPos - v_pos);
        float att = 5.0 / (1.0 + 0.4 * d * d);
        vec3 alb = pow(texture2D(u_albedo, uv).rgb, vec3(2.2));
        float ndl = max(dot(n, L), 0.0);
        float spec = ndl > 0.0 ? pow(max(dot(n, Hh), 0.0), 48.0) * 0.5 : 0.0;
        vec3 c = alb * 0.05 + (alb * ndl + vec3(spec)) * att;
        c = pow(c / (1.0 + c), vec3(1.0 / 2.2));
        if (u_debug > 1.5) c = T * 0.5 + 0.5;
        else if (u_debug > 0.5) c = n * 0.5 + 0.5;
        gl_FragColor = vec4(c, 1.0);
      }`;
    const prog = U.gl.program(gl, vs, fs);
    const unlit = U.gl.program(gl, `
      attribute vec3 a_position; uniform mat4 u_mvp;
      void main(){ gl_Position = u_mvp * vec4(a_position, 1.0); }`, `
      precision mediump float;
      void main(){ gl_FragColor = vec4(1.0, 0.95, 0.7, 1.0); }`);

    const cam = { yaw: 0.6, pitch: 0.45, dist: 4.2, drag: false, lx: 0, ly: 0 };
    let lightT = 0.5, objT = 0;

    return {
      update(dt) {
        if (P.autoRotate && !cam.drag) cam.yaw += dt * 0.15;
        if (P.lightMove) lightT += dt * 0.8;
        if (ctx.input.mouse.wheel) cam.dist = U.clamp(cam.dist * Math.pow(1.12, ctx.input.mouse.wheel), 1.5, 12);
        objT += dt;
      },
      onPointer(type, m) {
        if (type === 'down') { cam.drag = true; cam.lx = m.x; cam.ly = m.y; }
        else if (type === 'up' || type === 'leave') cam.drag = false;
        else if (type === 'move' && cam.drag) {
          cam.yaw -= (m.x - cam.lx) * 0.008; cam.pitch = U.clamp(cam.pitch + (m.y - cam.ly) * 0.008, -1.45, 1.45);
          cam.lx = m.x; cam.ly = m.y;
        }
      },
      render() {
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clearColor(0.06, 0.07, 0.09, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        const flat = P.shape === 'plane';
        if (flat) gl.disable(gl.CULL_FACE); else gl.enable(gl.CULL_FACE);
        const proj = M.perspective(U.rad(50), ctx.width / ctx.height, 0.05, 100);
        const eye = M.orbitEye([0, 0, 0], cam.yaw, cam.pitch, cam.dist);
        const vp = M.multiply(proj, M.lookAt(eye, [0, 0, 0]));
        const lr = flat ? 1.3 : 1.7;
        const light = [Math.cos(lightT) * lr, flat ? 0.45 : 0.9 * Math.sin(lightT * 0.6), Math.sin(lightT) * lr];

        prog.use();
        const world = M.create();
        gl.uniformMatrix4fv(prog.u('u_vp'), false, vp);
        gl.uniformMatrix4fv(prog.u('u_world'), false, world);
        gl.uniformMatrix3fv(prog.u('u_nmat'), false, M.normalMatrix(world));
        gl.uniform1f(prog.u('u_tiling'), P.tiling);
        gl.uniform3fv(prog.u('u_eye'), eye);
        gl.uniform3fv(prog.u('u_lightPos'), light);
        gl.uniform1f(prog.u('u_mode'), { none: 0, normal: 1, pom: 2 }[P.mode]);
        gl.uniform1f(prog.u('u_strength'), P.strength);
        gl.uniform1f(prog.u('u_heightScale'), P.heightScale);
        gl.uniform1f(prog.u('u_flipG'), P.flipGreen ? 1 : 0);
        gl.uniform1f(prog.u('u_debug'), +P.debug);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texN); gl.uniform1i(prog.u('u_nmap'), 0);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texA); gl.uniform1i(prog.u('u_albedo'), 1);
        const mesh = meshes[P.shape] || meshes.cube;
        mesh.draw(prog);
        gl.activeTexture(gl.TEXTURE0);

        unlit.use();
        gl.uniformMatrix4fv(unlit.u('u_mvp'), false, M.multiply(vp, M.translation(light[0], light[1], light[2])));
        marker.draw(unlit);

        ctx.stat(GTL.L('삼각형', 'Triangles'), (mesh.count / 3) | 0);
        ctx.stat(GTL.L('픽셀당 텍스처 샘플', 'Texture samples per pixel'), { none: 1, normal: 2, pom: 27 }[P.mode]);
      },
    };
  },
});
