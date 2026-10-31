// 반사 프로브 박스 투영: 무한 거리 큐브맵 조회 vs 박스 교차로 보정한 조회
GTL.register({
  id: 'box-projected-cubemap',
  title: '박스 투영 큐브맵 반사 (Reflection Probe Box Projection)',
  summary: '방 안의 반사를 큐브맵 하나로 그림. 반사 방향을 그대로 조회하면 벽이 무한히 멀다고 가정하는 셈이라 반사가 미끄러지고 벽과 어긋남. 반사 광선을 프로브 박스와 교차시켜 방향을 보정하면 바닥 반사가 벽과 맞물림.',
  renderer: 'webgl',
  views: { a: '무한 거리 조회', b: '박스 투영 (시차 보정)' },
  controls: '마우스 드래그: 시선 회전. 카메라는 방 안을 자동으로 오감.',
  info: `
    <p><b>반사 프로브(reflection probe)</b>는 한 지점에서 주변을 큐브맵으로 찍어 두고, 반사 방향으로 그 큐브맵을 읽는 방식</p>
    <p>큐브맵 조회는 방향만 씀. 그래서 반사하는 점의 위치와 상관없이 같은 방향이면 같은 색이 나옴. 하늘처럼 아주 먼 환경에서는 맞지만 방 안에서는 틀림:</p>
    <ul>
      <li>카메라가 움직이면 바닥 반사가 벽과 따로 미끄러짐</li>
      <li>바닥과 벽이 만나는 선이 반사 속에서 이어지지 않음</li>
    </ul>
    <p><b>박스 투영(box projection, parallax correction)</b>은 방을 상자로 근사해서 보정:</p>
    <ol>
      <li>반사하는 점 P에서 반사 방향 R로 광선을 쏴서 프로브 박스와 만나는 점 H를 구함</li>
      <li>프로브 중심 C에서 H를 향하는 방향 <code>H - C</code>로 큐브맵을 읽음</li>
    </ol>
    <p>Unity는 Reflection Probe의 <b>Box Projection</b> 옵션, Unreal은 <b>Box Reflection Capture</b>가 이 방식임</p>
    <p>한계: 방이 상자 모양일 때만 정확함. 박스 크기가 실제 벽과 다르면 다시 어긋남. 큐브맵에 없는 물체(이 샘플의 구)는 반사에 안 나옴.</p>`,
  // 도식: 위에서 본 방. 반사 광선이 벽과 만나는 점 H, A와 B가 큐브맵을 읽는 방향
  diagram: (L) => `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="arrA" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    </defs>
    <rect x="40" y="20" width="260" height="160" class="d-line"/>
    <text x="170" y="194" text-anchor="middle" class="t-small t-dim">${L('위에서 본 방 = 프로브 박스', 'Room seen from above = probe box')}</text>
    <line x1="260" y1="165" x2="42" y2="89" class="d-line" marker-end="url(#arr)"/>
    <circle cx="260" cy="165" r="4" class="f-accent"/><text x="266" y="168" class="t-small">P</text>
    <text x="218" y="140" class="t-small">R</text>
    <circle cx="40" cy="88" r="4" class="f-b"/><text x="46" y="98" class="t-small t-b">H</text>
    <circle cx="170" cy="100" r="5" class="f-dim"/><text x="176" y="112" class="t-small">${L('프로브 C', 'probe C')}</text>
    <line x1="170" y1="100" x2="43" y2="56" class="d-a" stroke-dasharray="5 3" marker-end="url(#arrA)"/>
    <circle cx="40" cy="54.5" r="4" class="f-a"/>
    <line x1="170" y1="100" x2="44" y2="88.5" class="d-b" marker-end="url(#arrB)"/>
    <text x="320" y="34">${L('같은 큐브맵, 다른 조회 방향', 'Same cubemap, different lookup')}</text>
    <line x1="320" y1="56" x2="350" y2="56" class="d-line" marker-end="url(#arr)"/>
    <text x="358" y="60" class="t-small">${L('P에서 나간 반사 광선 R', 'reflection ray R from P')}</text>
    <line x1="320" y1="84" x2="350" y2="84" class="d-a" stroke-dasharray="5 3"/>
    <text x="358" y="82" class="t-small t-a">${L('A: C에서 R 방향 그대로', 'A: R itself, from C')}</text>
    <text x="358" y="95" class="t-small t-dim">${L('엉뚱한 벽 지점이 비침', 'shows the wrong wall spot')}</text>
    <line x1="320" y1="118" x2="350" y2="118" class="d-b"/>
    <text x="358" y="116" class="t-small t-b">${L('B: 박스와 만난 점 H로', 'B: toward box hit H')}</text>
    <text x="358" y="129" class="t-small t-dim">${L('P가 실제로 보는 벽 지점', 'the wall spot P really sees')}</text>
    <text x="320" y="156" class="t-mono t-small">H = P + R t</text>
    <text x="320" y="170" class="t-mono t-small">dir = H - C</text>
  </svg>`,
  look: [
    'A의 바닥을 보면 바닥과 벽이 만나는 어두운 띠가 반사 속에서 벽과 이어지지 않음. B는 거울처럼 이어짐.',
    '카메라가 움직일 때 A의 반사는 벽과 따로 미끄러짐. B는 벽에 붙어 있음.',
    '"프로브 위치 X"를 옮기면 A의 반사가 크게 바뀜. B는 박스 투영이 위치 차이를 보정해서 거의 그대로임.',
    'B에서 "박스 크기 배율"을 1에서 벗어나게 하면 B도 어긋남. 박스가 실제 벽과 맞아야 정확함.',
  ],
  refs: [
    { type: 'engine', title: 'Unity Manual: Reflection Probes (Box Projection)', url: 'https://docs.unity3d.com/Manual/class-ReflectionProbe.html', note: 'Box Projection을 켜면 프로브 박스 기준으로 반사 방향을 보정' },
    { type: 'engine', title: 'Unreal Engine: Reflections Captures', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/reflections-captures-in-unreal-engine', note: 'Sphere와 Box Reflection Capture. Box는 방 모양에 맞춰 시차를 보정.' },
    { type: 'article', title: 'Image-based Lighting approaches and parallax-corrected cubemap (Sebastien Lagarde)', year: 2012, note: '박스 투영 공식과 실제 게임 적용을 정리한 글' },
  ],
  params: [
    { key: 'method', label: '큐브맵 조회', type: 'select', group: '반사', options: [
      { value: 'infinite', label: '반사 방향 그대로 (무한 거리)' },
      { value: 'box', label: '박스 투영 (시차 보정)' },
    ], a: 'infinite', b: 'box' },
    { key: 'boxScale', label: '박스 크기 배율', type: 'range', min: 0.6, max: 1.6, step: 0.02, default: 1, help: '1이면 프로브 박스가 실제 방과 같음', when: (p) => p.method === 'box' },
    { key: 'refl', label: '바닥 반사 세기', type: 'range', min: 0, max: 1, step: 0.05, default: 0.6 },
    { key: 'showBox', label: '프로브와 박스 표시', type: 'bool', default: true },
    { key: 'probeX', label: '프로브 위치 X', type: 'range', min: -4, max: 4, step: 0.1, default: 0, shared: true, group: '프로브 (큐브맵 촬영 지점)' },
    { key: 'probeY', label: '프로브 높이', type: 'range', min: 0.3, max: 3.7, step: 0.1, default: 1.5, shared: true },
    { key: 'probeZ', label: '프로브 위치 Z', type: 'range', min: -5, max: 5, step: 0.1, default: 0, shared: true },
    { key: 'autoMove', label: '카메라 자동 이동', type: 'bool', default: true, shared: true, group: '카메라' },
  ],
  en: {
    title: 'Box Projected Cubemap Reflections (Reflection Probe Box Projection)',
    summary: 'Reflections inside a room come from one cubemap. If you look it up with the reflection direction alone, you assume the walls are infinitely far, so reflections slide and do not line up with the walls. If you intersect the reflection ray with the probe box and correct the direction, the floor reflection meets the walls.',
    views: { a: 'Infinite distance lookup', b: 'Box projection (parallax corrected)' },
    controls: 'Mouse drag: turn the view. The camera moves around the room on its own.',
    info: `
    <p>A <b>reflection probe</b> captures the surroundings from one point into a cubemap. Surfaces read that cubemap along their reflection direction.</p>
    <p>A cubemap lookup uses only a direction. So the same direction gives the same color, wherever the reflecting point is. That is right for a far environment like the sky, but wrong inside a room:</p>
    <ul>
      <li>When the camera moves, the floor reflection slides apart from the walls.</li>
      <li>The line where the floor meets the wall does not continue into the reflection.</li>
    </ul>
    <p><b>Box projection (parallax correction)</b> treats the room as a box and corrects the lookup:</p>
    <ol>
      <li>Cast a ray from the reflecting point P along the reflection direction R. Find the point H where it hits the probe box.</li>
      <li>Read the cubemap along <code>H - C</code>, the direction from the probe center C to H.</li>
    </ol>
    <p>Unity calls this the <b>Box Projection</b> option of a Reflection Probe. Unreal uses a <b>Box Reflection Capture</b>.</p>
    <p>Limits: it is exact only for box shaped rooms. If the box size does not match the walls, the reflection is off again. Objects missing from the cubemap (the spheres here) do not show in reflections.</p>`,
    look: [
      'Look at the floor in A. The dark strip where floor meets wall does not continue into the reflection. In B it continues like a mirror.',
      'As the camera moves, the reflection in A slides apart from the walls. In B it stays attached to the walls.',
      'Move "Probe position X". The reflection in A changes a lot. B stays almost the same, because box projection corrects for the position.',
      'In B, move "Box size scale" away from 1. B goes wrong too. The box must match the real walls.',
    ],
    refs: ['With Box Projection on, the reflection direction is corrected against the probe box.', 'Sphere and Box Reflection Captures. The box shape corrects parallax to fit the room.', 'A write-up of the box projection formula and how games use it.'],
    params: {
      method: { label: 'Cubemap lookup', group: 'Reflection', options: { infinite: 'Reflection direction only (infinite distance)', box: 'Box projection (parallax corrected)' } },
      boxScale: { label: 'Box size scale', help: 'At 1 the probe box matches the room' },
      refl: 'Floor reflection strength',
      showBox: 'Show probe and box',
      probeX: { label: 'Probe position X', group: 'Probe (cubemap capture point)' },
      probeY: 'Probe height',
      probeZ: 'Probe position Z',
      autoMove: { label: 'Auto move camera', group: 'Camera' },
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, G = U.geometry, P = ctx.params;
    const HALF = [5, 2, 6], CENTER = [0, 2, 0];   // 방 상자 (바닥 y=0, 천장 y=4)

    // ── 방 표면 무늬 (JS와 GLSL이 같은 규칙) ──
    const fract = (v) => v - Math.floor(v);
    const gridLine = (v, w) => (Math.abs(fract(v) - 0.5) >= 0.5 - w ? 1 : 0);
    function roomColor(x, y, z) {
      const qy = y - 2, ax = Math.abs(x) / HALF[0], ay = Math.abs(qy) / HALF[1], az = Math.abs(z) / HALF[2];
      if (ay >= ax && ay >= az) {
        if (qy < 0) {
          const ch = (((Math.floor(x) + Math.floor(z)) % 2) + 2) % 2;
          return ch > 0.5 ? [0.22, 0.2, 0.18] : [0.6, 0.56, 0.5];
        }
        return Math.abs(x) < 1.5 && Math.abs(z) < 0.5 ? [1, 0.97, 0.85] : [0.3, 0.3, 0.32];
      }
      if (y < 0.2) return [0.1, 0.1, 0.11];
      if (ax >= az) {
        if (x < 0) return gridLine(z / 1.5, 0.06) > 0.5 ? [0.95, 0.9, 0.85] : [0.7, 0.25, 0.2];
        if (Math.abs(z) < 2 && y > 1 && y < 3) return Math.abs(z) < 0.06 || Math.abs(y - 2) < 0.06 ? [0.15, 0.15, 0.18] : [0.6, 0.8, 1];
        return [0.2, 0.5, 0.55];
      }
      if (z < 0) return Math.abs(x) < 0.9 && y < 2.4 ? [0.35, 0.22, 0.12] : [0.75, 0.65, 0.3];
      return gridLine(x, 0.03) > 0.5 || gridLine(y, 0.03) > 0.5 ? [0.3, 0.27, 0.42] : [0.45, 0.4, 0.6];
    }
    const ROOM_GLSL = `
      float gridLine(float v, float w){ return step(0.5 - w, abs(fract(v) - 0.5)); }
      vec3 roomColor(vec3 p){
        vec3 h = vec3(5.0, 2.0, 6.0);
        float qy = p.y - 2.0;
        float ax = abs(p.x) / h.x, ay = abs(qy) / h.y, az = abs(p.z) / h.z;
        if (ay >= ax && ay >= az) {
          if (qy < 0.0) {
            float ch = mod(floor(p.x) + floor(p.z), 2.0);
            return ch > 0.5 ? vec3(0.22, 0.2, 0.18) : vec3(0.6, 0.56, 0.5);
          }
          return (abs(p.x) < 1.5 && abs(p.z) < 0.5) ? vec3(1.0, 0.97, 0.85) : vec3(0.3, 0.3, 0.32);
        }
        if (p.y < 0.2) return vec3(0.1, 0.1, 0.11);
        if (ax >= az) {
          if (p.x < 0.0) return gridLine(p.z / 1.5, 0.06) > 0.5 ? vec3(0.95, 0.9, 0.85) : vec3(0.7, 0.25, 0.2);
          if (abs(p.z) < 2.0 && p.y > 1.0 && p.y < 3.0) return (abs(p.z) < 0.06 || abs(p.y - 2.0) < 0.06) ? vec3(0.15, 0.15, 0.18) : vec3(0.6, 0.8, 1.0);
          return vec3(0.2, 0.5, 0.55);
        }
        if (p.z < 0.0) return (abs(p.x) < 0.9 && p.y < 2.4) ? vec3(0.35, 0.22, 0.12) : vec3(0.75, 0.65, 0.3);
        return (gridLine(p.x, 0.03) > 0.5 || gridLine(p.y, 0.03) > 0.5) ? vec3(0.3, 0.27, 0.42) : vec3(0.45, 0.4, 0.6);
      }`;

    // 상자 안의 점 p에서 방향 d로 나간 광선이 상자 벽과 만나는 거리
    function boxExit(p, d, bmin, bmax) {
      let t = Infinity;
      for (let i = 0; i < 3; i++) {
        const di = Math.abs(d[i]) < 1e-4 ? 1e-4 : d[i];
        const t1 = (bmax[i] - p[i]) / di, t2 = (bmin[i] - p[i]) / di;
        t = Math.min(t, Math.max(t1, t2));
      }
      return t;
    }
    const ROOM_MIN = CENTER.map((c, i) => c - HALF[i]), ROOM_MAX = CENTER.map((c, i) => c + HALF[i]);

    // ── 큐브맵 굽기: 프로브 위치에서 방을 찍음 (절차적으로 광선을 쏴서 계산) ──
    const FACE = 128;
    const cube = gl.createTexture();
    const FACE_DIRS = [
      (u, v) => [1, -v, -u], (u, v) => [-1, -v, u], (u, v) => [u, 1, v],
      (u, v) => [u, -1, -v], (u, v) => [u, -v, 1], (u, v) => [-u, -v, -1],
    ];
    const px = new Uint8Array(FACE * FACE * 4);
    let probe = [0, 1.5, 0];
    function bake() {
      probe = [U.clamp(P.probeX, -4.8, 4.8), U.clamp(P.probeY, 0.1, 3.9), U.clamp(P.probeZ, -5.8, 5.8)];
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, cube);
      for (let f = 0; f < 6; f++) {
        for (let y = 0; y < FACE; y++) for (let x = 0; x < FACE; x++) {
          const d = FACE_DIRS[f](2 * (x + 0.5) / FACE - 1, 2 * (y + 0.5) / FACE - 1);
          const l = Math.hypot(d[0], d[1], d[2]); d[0] /= l; d[1] /= l; d[2] /= l;
          const t = boxExit(probe, d, ROOM_MIN, ROOM_MAX);
          const c = roomColor(probe[0] + d[0] * t, probe[1] + d[1] * t, probe[2] + d[2] * t), i = (y * FACE + x) * 4;
          px[i] = c[0] * 255; px[i + 1] = c[1] * 255; px[i + 2] = c[2] * 255; px[i + 3] = 255;
        }
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, 0, gl.RGBA, FACE, FACE, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
      }
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    bake();

    // ── 셰이더 ──
    const vs = `
      attribute vec3 a_position; attribute vec3 a_normal;
      uniform mat4 u_vp; uniform mat4 u_model;
      varying vec3 v_wpos; varying vec3 v_n;
      void main(){
        vec4 w = u_model * vec4(a_position, 1.0);
        v_wpos = w.xyz; v_n = a_normal;
        gl_Position = u_vp * w;
      }`;
    // u_mode 0: 방 (바닥은 반사), 1: 크롬 구, 2: 단색
    const fs = `
      precision highp float;
      uniform samplerCube u_cube;
      uniform vec3 u_eye; uniform vec3 u_probe; uniform vec3 u_bmin; uniform vec3 u_bmax;
      uniform float u_boxProj; uniform float u_mode; uniform float u_refl; uniform vec3 u_color;
      varying vec3 v_wpos; varying vec3 v_n;
      ${ROOM_GLSL}
      vec3 lookupRefl(vec3 p, vec3 r){
        vec3 dir = r;
        if (u_boxProj > 0.5) {
          vec3 rs = mix(vec3(0.0001), r, step(0.0001, abs(r)));
          vec3 t1 = (u_bmax - p) / rs;
          vec3 t2 = (u_bmin - p) / rs;
          vec3 tf = max(t1, t2);
          float t = min(min(tf.x, tf.y), tf.z);
          dir = p + r * t - u_probe;
        }
        return textureCube(u_cube, dir).rgb;
      }
      void main(){
        vec3 v = normalize(v_wpos - u_eye);
        vec3 c;
        if (u_mode < 0.5) {
          c = roomColor(v_wpos);
          if (v_n.y < -0.5) {
            vec3 n = vec3(0.0, 1.0, 0.0);
            c = mix(c, lookupRefl(v_wpos, reflect(v, n)), u_refl);
          }
        } else if (u_mode < 1.5) {
          vec3 n = normalize(v_n);
          vec3 r = reflect(v, n);
          float fres = 0.6 + 0.4 * pow(1.0 - max(dot(-v, n), 0.0), 5.0);
          c = lookupRefl(v_wpos, r) * u_color * fres;
        } else {
          c = u_color;
        }
        gl_FragColor = vec4(c, 1.0);
      }`;
    const prog = U.gl.program(gl, vs, fs);
    const room = G.upload(gl, G.cube(1));
    const sph = G.upload(gl, G.sphere(1, 48, 24));
    const lineVs = `attribute vec3 a_position; uniform mat4 u_mvp; void main(){ gl_Position = u_mvp * vec4(a_position, 1.0); }`;
    const lineFs = `precision mediump float; uniform vec3 u_color; void main(){ gl_FragColor = vec4(u_color, 1.0); }`;
    const lineProg = U.gl.program(gl, lineVs, lineFs);
    const E = [];
    for (const a of [-1, 1]) for (const b of [-1, 1]) {
      E.push(-1, a, b, 1, a, b); E.push(a, -1, b, a, 1, b); E.push(a, b, -1, a, b, 1);
    }
    const edgeBuf = U.gl.buffer(gl, new Float32Array(E));
    const SPHERES = [{ p: [1.8, 1.0, -1.5], r: 1.0 }, { p: [-2.2, 0.7, 0.8], r: 0.7 }];

    // 바닥 점들의 평균 반사 방향 오차 (실제로 보이는 벽 지점 기준)
    const FLOOR_PTS = [];
    for (let i = 0; i < 64; i++) FLOOR_PTS.push([ctx.rng.range(-4.5, 4.5), 0, ctx.rng.range(-5.5, 3)]);
    function reflError(eye, bmin, bmax, boxProj) {
      let sum = 0;
      for (const p of FLOOR_PTS) {
        let vx = p[0] - eye[0], vy = p[1] - eye[1], vz = p[2] - eye[2];
        const l = Math.hypot(vx, vy, vz); vx /= l; vy /= l; vz /= l;
        const r = [vx, -vy, vz];
        const tt = boxExit(p, r, ROOM_MIN, ROOM_MAX);
        const truth = [p[0] + r[0] * tt - probe[0], p[1] + r[1] * tt - probe[1], p[2] + r[2] * tt - probe[2]];
        let used = r;
        if (boxProj) {
          const tb = boxExit(p, r, bmin, bmax);
          used = [p[0] + r[0] * tb - probe[0], p[1] + r[1] * tb - probe[1], p[2] + r[2] * tb - probe[2]];
        }
        const dot = (truth[0] * used[0] + truth[1] * used[1] + truth[2] * used[2]) / (Math.hypot(...truth) * Math.hypot(...used) || 1);
        sum += Math.acos(U.clamp(dot, -1, 1));
      }
      return U.deg(sum / FLOOR_PTS.length);
    }

    let yawOff = 0, dragging = false, lastX = 0, camT = 0;
    return {
      update(dt) { if (P.autoMove) camT += dt; },
      onParam(key) { if (key === 'probeX' || key === 'probeY' || key === 'probeZ') bake(); },
      onPointer(type, m) {
        if (type === 'down') { dragging = true; lastX = m.x; }
        else if (type === 'up' || type === 'leave') dragging = false;
        else if (type === 'move' && dragging) { yawOff -= (m.x - lastX) * 0.005; lastX = m.x; }
      },
      render() {
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clearColor(0.05, 0.05, 0.06, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        const eye = [Math.sin(camT * 0.35) * 3.2, 1.7 + Math.sin(camT * 0.23) * 0.4, 4.6];
        const yaw = Math.sin(camT * 0.35) * -0.35 + yawOff;
        const target = [eye[0] + Math.sin(yaw) * 5, 0.6, eye[2] - Math.cos(yaw) * 5];
        const vp = M.multiply(M.perspective(U.rad(70), ctx.width / ctx.height, 0.05, 50), M.lookAt(eye, target));
        const boxProj = P.method === 'box';
        const k = boxProj ? P.boxScale : 1;
        const bmin = CENTER.map((c, i) => c - HALF[i] * k), bmax = CENTER.map((c, i) => c + HALF[i] * k);

        prog.use();
        gl.uniformMatrix4fv(prog.u('u_vp'), false, vp);
        gl.uniform3fv(prog.u('u_eye'), eye);
        gl.uniform3fv(prog.u('u_probe'), probe);
        gl.uniform3fv(prog.u('u_bmin'), bmin);
        gl.uniform3fv(prog.u('u_bmax'), bmax);
        gl.uniform1f(prog.u('u_boxProj'), boxProj ? 1 : 0);
        gl.uniform1f(prog.u('u_refl'), P.refl);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cube);
        gl.uniform1i(prog.u('u_cube'), 0);

        // 방: 상자 안쪽에서 보므로 컬링 끔
        gl.disable(gl.CULL_FACE);
        gl.uniform1f(prog.u('u_mode'), 0);
        gl.uniformMatrix4fv(prog.u('u_model'), false, M.multiply(M.translation(...CENTER), M.scaling(HALF[0] * 2, HALF[1] * 2, HALF[2] * 2)));
        room.draw(prog);

        gl.uniform1f(prog.u('u_mode'), 1);
        gl.uniform3fv(prog.u('u_color'), [0.95, 0.93, 0.9]);
        for (const s of SPHERES) {
          gl.uniformMatrix4fv(prog.u('u_model'), false, M.multiply(M.translation(...s.p), M.scaling(s.r)));
          sph.draw(prog);
        }

        if (P.showBox) {
          gl.uniform1f(prog.u('u_mode'), 2);
          gl.uniform3fv(prog.u('u_color'), [1, 0.85, 0.2]);
          gl.uniformMatrix4fv(prog.u('u_model'), false, M.multiply(M.translation(...probe), M.scaling(0.12)));
          sph.draw(prog);
          if (boxProj) {
            lineProg.use();
            const half = HALF.map((h) => h * k * 0.995);
            gl.uniformMatrix4fv(lineProg.u('u_mvp'), false, M.mul(vp, M.translation(...CENTER), M.scaling(half[0], half[1], half[2])));
            gl.uniform3fv(lineProg.u('u_color'), U.hexToRgb01(U.colors.b));
            U.gl.attrib(gl, lineProg, 'a_position', edgeBuf, 3);
            gl.drawArrays(gl.LINES, 0, E.length / 3);
          }
        }

        ctx.stat(GTL.L('평균 반사 방향 오차', 'Mean reflection direction error'), reflError(eye, bmin, bmax, boxProj).toFixed(1) + GTL.L('도', ' deg'));
        ctx.stat(GTL.L('큐브맵 해상도', 'Cubemap size'), FACE + 'x' + FACE + ' x 6');
      },
    };
  },
});
