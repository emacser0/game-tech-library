// 버텍스 셰이더 바람 흔들림: 정적 / 사인 / 사인 + 노이즈 돌풍, 높이 가중치
GTL.register({
  id: 'vertex-wind-sway',
  title: '버텍스 셰이더 바람 흔들림 (풀, 나무)',
  summary: '풀잎 정점을 버텍스 셰이더에서 옮겨 바람을 흉내 냄. 사인파만 쓰면 들판 전체가 한 몸처럼 움직임. 위치 기반 위상과 노이즈 돌풍을 더하면 바람이 들판을 훑고 지나감.',
  renderer: 'webgl',
  views: { a: '정적 (흔들림 없음)', b: '사인 + 노이즈 돌풍' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌',
  info: `
    <p><b>버텍스 셰이더 바람</b>은 정점 위치에 시간 함수로 만든 오프셋을 더하는 기법. 물리 계산이 없고 CPU 비용이 0이라 풀, 덤불, 나뭇잎에 널리 씀.</p>
    <p>핵심 요소:</p>
    <ul>
      <li><b>높이 가중치</b>: 오프셋에 (정점 높이)<sup>k</sup>를 곱함. 뿌리는 땅에 붙고 끝만 휨. 가중치가 없으면 풀잎 전체가 미끄러짐.</li>
      <li><b>위치 기반 위상</b>: 사인의 위상에 월드 위치를 넣음. 그래서 파도처럼 바람이 지나감.</li>
      <li><b>노이즈 돌풍(gust)</b>: 바람 방향으로 흘러가는 저주파 노이즈로 세기를 바꿈. 들판에 바람 자국이 생김.</li>
      <li><b>무작위 위상</b>: 풀잎마다 위상을 조금씩 다르게 줘서 같은 박자로 움직이지 않게 함.</li>
    </ul>
    <p>단점: 정점만 옮기므로 길이가 늘어나 보일 수 있음. 여기서는 휜 만큼 높이를 낮춰 길이를 대략 유지함. 충돌, 밟힘 같은 상호작용은 따로 처리해야 함.</p>`,
  // 도식: 높이 가중치로 끝만 휘는 풀잎과 위치 기반 위상으로 지나가는 바람 파도
  diagram: (L) => `<svg viewBox="0 0 540 194" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="16" class="t-small t-dim">${L('풀잎 하나: 오프셋 = 바람 × 높이^k', 'One blade: offset = wind × height^k')}</text>
    <line x1="20" y1="160" x2="240" y2="160" class="d-dim"/>
    <line x1="80" y1="160" x2="80" y2="40" class="d-dim" stroke-dasharray="3 3"/>
    <polyline points="80.0,160.0 81.7,140.0 86.7,120.0 95.0,100.0 106.7,80.0 121.7,60.0 140.0,40.0" class="d-b"/>
    <circle cx="81.7" cy="140" r="3" class="f-b"/>
    <line x1="80" y1="120" x2="84.7" y2="120" class="d-b" marker-end="url(#arrB)"/>
    <circle cx="86.7" cy="120" r="3" class="f-b"/>
    <line x1="80" y1="100" x2="93" y2="100" class="d-b" marker-end="url(#arrB)"/>
    <circle cx="95" cy="100" r="3" class="f-b"/>
    <line x1="80" y1="80" x2="104.7" y2="80" class="d-b" marker-end="url(#arrB)"/>
    <circle cx="106.7" cy="80" r="3" class="f-b"/>
    <line x1="80" y1="60" x2="119.7" y2="60" class="d-b" marker-end="url(#arrB)"/>
    <circle cx="121.7" cy="60" r="3" class="f-b"/>
    <line x1="80" y1="40" x2="138" y2="40" class="d-b" marker-end="url(#arrB)"/>
    <circle cx="140" cy="40" r="3" class="f-b"/>
    <text x="150" y="60" class="t-small">${L('끝은 크게 휨', 'tip bends most')}</text>
    <text x="88" y="154" class="t-small">${L('뿌리 고정', 'root stays')}</text>
    <text x="280" y="16" class="t-small t-dim">${L('들판: 위상에 위치를 넣어 파도처럼 지나감', 'Field: position in phase makes a wave')}</text>
    <line x1="280" y1="160" x2="530" y2="160" class="d-dim"/>
    <path d="M290,160 Q290,110 298.0,72.4" class="d-b"/>
    <path d="M309,160 Q309,110 327.3,75.5" class="d-b"/>
    <path d="M328,160 Q328,110 351.8,77.1" class="d-b"/>
    <path d="M347,160 Q347,110 368.8,76.5" class="d-b"/>
    <path d="M366,160 Q366,110 379.4,74.0" class="d-b"/>
    <path d="M385,160 Q385,110 387.4,70.7" class="d-b"/>
    <path d="M404,160 Q404,110 398.1,71.8" class="d-b"/>
    <path d="M423,160 Q423,110 415.3,72.3" class="d-b"/>
    <path d="M442,160 Q442,110 439.9,70.6" class="d-b"/>
    <path d="M461,160 Q461,110 469.3,72.5" class="d-b"/>
    <path d="M480,160 Q480,110 498.5,75.6" class="d-b"/>
    <path d="M499,160 Q499,110 522.8,77.1" class="d-b"/>
    <path d="M518,160 Q518,110 539.7,76.5" class="d-b"/>
    <text x="280" y="186" class="t-mono t-small">sin(time + dot(pos, windDir) * k)</text>
    <text x="10" y="186" class="t-small t-a">${L('A는 오프셋 0 (정지)', 'A has zero offset (still)')}</text>
  </svg>`,
  look: [
    'B에서 들판을 위에서 보면 밝은 돌풍 자국이 바람 방향으로 흘러감.',
    '흔들림 방식을 "사인만"으로 바꾸고 위상 분산을 0으로 낮추면 모든 풀잎이 같은 박자로 움직임.',
    '"높이 가중치"를 끄면 풀잎 뿌리가 땅 위를 미끄러짐. "가중치 보기"를 켜면 뿌리 0(검정) ~ 끝 1(노랑)이 보임.',
    '가중치 지수를 3으로 올리면 끝부분만 휘어 뻣뻣한 풀처럼 보임. 1이면 막대처럼 기울어짐.',
  ],
  refs: [
    { type: 'book', title: 'GPU Gems 3, Chapter 16: Vegetation Procedural Animation and Shading in Crysis (Tiago Sousa)', url: 'https://developer.nvidia.com/gpugems/gpugems3/part-iii-rendering/chapter-16-vegetation-procedural-animation-and-shading-crysis', year: 2007, note: '주 굽힘(main bending)과 세부 흔들림을 정점 셰이더로 처리.' },
    { type: 'book', title: 'GPU Gems, Chapter 7: Rendering Countless Blades of Waving Grass (Kurt Pelzer)', url: 'https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-7-rendering-countless-blades-waving-grass', year: 2004 },
    { type: 'engine', title: 'Unity Manual: Wind Zones', url: 'https://docs.unity3d.com/Manual/class-WindZone.html' },
    { type: 'talk', title: 'Procedural Grass in Ghost of Tsushima (Eric Wohllaib)', year: 2021, note: 'GDC 2021. 풀잎마다 베지어 곡선과 바람 노이즈로 휘게 함.' },
  ],
  params: [
    { key: 'mode', label: '흔들림 방식', type: 'select', group: '바람', options: [
      { value: 0, label: '정적' },
      { value: 1, label: '사인만' },
      { value: 2, label: '사인 + 노이즈 돌풍' },
    ], a: 0, b: 2 },
    { key: 'strength', label: '세기', type: 'range', min: 0, max: 1, step: 0.01, default: 0.45, when: (p) => +p.mode > 0 },
    { key: 'freq', label: '흔들림 빈도 (Hz)', type: 'range', min: 0.1, max: 3, step: 0.05, default: 0.9, when: (p) => +p.mode > 0 },
    { key: 'spread', label: '위상 분산', type: 'range', min: 0, max: 1, step: 0.01, default: 0.6, help: '위치와 풀잎별 무작위 위상의 비율', when: (p) => +p.mode > 0 },
    { key: 'gustScale', label: '돌풍 크기 (m)', type: 'range', min: 1, max: 20, step: 0.5, default: 7, when: (p) => +p.mode === 2 },
    { key: 'gustSpeed', label: '돌풍 속도 (m/s)', type: 'range', min: 0, max: 10, step: 0.1, default: 3.5, when: (p) => +p.mode === 2 },
    { key: 'windDir', label: '바람 방향 (°)', type: 'range', min: 0, max: 360, step: 1, default: 30 },
    { key: 'heightWeight', label: '높이 가중치', type: 'bool', default: true, group: '가중치', when: (p) => +p.mode > 0 },
    { key: 'weightPow', label: '가중치 지수 k', type: 'range', min: 1, max: 3, step: 0.1, default: 2, when: (p) => p.heightWeight && +p.mode > 0 },
    { key: 'showWeight', label: '가중치 보기', type: 'bool', default: false },
    { key: 'count', label: '풀잎 수', type: 'int', min: 1000, max: 20000, step: 1000, default: 8000, shared: true, reset: true, group: '장면' },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Vertex Shader Wind Sway (Grass, Trees)',
    summary: 'The vertex shader moves grass blade vertices to fake wind. With only a sine wave, the whole field moves as one. Add a position based phase and noise gusts, and the wind sweeps across the field.',
    views: { a: 'Static (no sway)', b: 'Sine + noise gusts' },
    controls: 'Mouse drag: rotate camera. Wheel: zoom.',
    info: `
    <p><b>Vertex shader wind</b> adds an offset, made from a function of time, to each vertex position. It needs no physics and costs zero CPU, so games use it widely for grass, bushes, and leaves.</p>
    <p>Key parts:</p>
    <ul>
      <li><b>Height weight</b>: multiply the offset by (vertex height)<sup>k</sup>. The root stays on the ground and only the tip bends. Without the weight, the whole blade slides.</li>
      <li><b>Position based phase</b>: put the world position into the sine phase. The wind then passes like a wave.</li>
      <li><b>Noise gusts</b>: low frequency noise that flows in the wind direction changes the strength. Wind trails appear on the field.</li>
      <li><b>Random phase</b>: give each blade a slightly different phase so they do not move in the same beat.</li>
    </ul>
    <p>Downside: only vertices move, so blades can look stretched. Here the height drops as the blade bends, which roughly keeps its length. Interaction such as collision or stepping on grass needs separate handling.</p>`,
    look: [
      'In B, look at the field from above. Bright gust trails flow in the wind direction.',
      'Set the sway mode to "Sine only" and lower phase spread to 0. Every blade moves in the same beat.',
      'Turn off "Height weight". Blade roots slide over the ground. Turn on "Show weight" to see root 0 (black) to tip 1 (yellow).',
      'Raise the weight exponent to 3. Only the tips bend, like stiff grass. At 1 the blades tilt like sticks.',
    ],
    refs: ['Handles main bending and detail sway in the vertex shader.', null, null, 'GDC 2021. Each blade bends along a Bezier curve driven by wind noise.'],
    params: {
      mode: { label: 'Sway mode', group: 'Wind', options: { 0: 'Static', 1: 'Sine only', 2: 'Sine + noise gusts' } },
      strength: 'Strength',
      freq: 'Sway frequency (Hz)',
      spread: { label: 'Phase spread', help: 'Mix between position phase and random phase per blade' },
      gustScale: 'Gust size (m)',
      gustSpeed: 'Gust speed (m/s)',
      windDir: 'Wind direction (°)',
      heightWeight: { label: 'Height weight', group: 'Weight' },
      weightPow: 'Weight exponent k',
      showWeight: 'Show weight',
      count: { label: 'Blade count', group: 'Scene' },
      autoRotate: 'Auto rotate',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params;
    const rng = ctx.rng;
    const FIELD = 14;

    // 풀잎 생성: 4단 세그먼트(삼각형 7개 = 정점 21개). 정점 속성 = 뿌리(3) + 로컬 오프셋(3) + 높이(1) + 무작위(1)
    const SEG = 4, VPB = (SEG - 1) * 6 + 3;
    const n = P.count | 0;
    const data = new Float32Array(n * VPB * 8);
    let o = 0;
    for (let i = 0; i < n; i++) {
      const rx = rng.range(-FIELD / 2, FIELD / 2), rz = rng.range(-FIELD / 2, FIELD / 2);
      const h = rng.range(0.35, 0.8), w = rng.range(0.03, 0.06), ang = rng.range(0, U.TAU);
      const lean = rng.range(-0.15, 0.15), rnd = rng.range(0, 1);
      const cx = Math.cos(ang), cz = Math.sin(ang);
      const pt = (s, side) => { // s: 0..SEG, side: -1/1/0
        const t = s / SEG, ww = w * (1 - t) * side;
        const lx = cx * ww + -cz * lean * t * t * h, lz = cz * ww + cx * lean * t * t * h;
        return [lx, t * h, lz, t];
      };
      const push = (p) => { data[o++] = rx; data[o++] = 0; data[o++] = rz; data[o++] = p[0]; data[o++] = p[1]; data[o++] = p[2]; data[o++] = p[3]; data[o++] = rnd; };
      for (let s = 0; s < SEG - 1; s++) {
        const a0 = pt(s, -1), a1 = pt(s, 1), b0 = pt(s + 1, -1), b1 = pt(s + 1, 1);
        push(a0); push(a1); push(b1); push(a0); push(b1); push(b0);
      }
      push(pt(SEG - 1, -1)); push(pt(SEG - 1, 1)); push(pt(SEG, 0));
    }
    const grassBuf = U.gl.buffer(gl, data);
    const vertCount = n * VPB;

    const grassVS = `
      attribute vec3 a_root; attribute vec3 a_local; attribute float a_h; attribute float a_rnd;
      uniform mat4 u_vp; uniform float u_time; uniform float u_mode; uniform float u_strength;
      uniform float u_freq; uniform float u_spread; uniform float u_gustScale; uniform float u_gustSpeed;
      uniform vec2 u_dir; uniform float u_useWeight; uniform float u_pow;
      varying vec3 v_col; varying float v_w; varying float v_gust;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }
      void main(){
        float w = u_useWeight > 0.5 ? pow(a_h, u_pow) : 1.0;
        vec3 p = a_root + a_local;
        float bend = 0.0, gust = 0.0;
        if (u_mode > 0.5) {
          float phase = mix(0.0, dot(a_root.xz, u_dir) * 0.8 + a_rnd * 6.2831853, u_spread);
          float sway = sin(u_time * u_freq * 6.2831853 + phase);
          if (u_mode < 1.5) {
            bend = u_strength * (0.3 + 0.5 * sway);
          } else {
            vec2 q = (a_root.xz - u_dir * u_time * u_gustSpeed) / u_gustScale;
            gust = smoothstep(0.35, 0.85, vnoise(q) * 0.7 + vnoise(q * 2.3 + 5.0) * 0.3);
            bend = u_strength * (0.15 + 0.25 * sway + gust * (0.9 + 0.3 * sin(u_time * u_freq * 15.0 + a_rnd * 20.0)));
          }
        }
        float off = bend * w * (u_useWeight > 0.5 ? a_local.y + 0.25 : 0.6);
        p.xz += u_dir * off;
        p.y -= u_useWeight > 0.5 ? 0.5 * off * off / max(a_local.y + 0.25, 0.1) : 0.0;
        vec3 base = mix(vec3(0.10, 0.22, 0.05), vec3(0.45, 0.72, 0.22), a_h);
        base *= 0.8 + 0.4 * a_rnd;
        v_col = base * (1.0 + gust * 0.35);
        v_w = w; v_gust = gust;
        gl_Position = u_vp * vec4(p, 1.0);
      }`;
    const grassFS = `
      precision mediump float;
      uniform float u_showWeight;
      varying vec3 v_col; varying float v_w; varying float v_gust;
      void main(){
        vec3 c = v_col;
        if (u_showWeight > 0.5) c = mix(vec3(0.0), vec3(1.0, 0.85, 0.1), clamp(v_w, 0.0, 1.0));
        gl_FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
      }`;
    const grass = U.gl.program(gl, grassVS, grassFS);
    const groundProg = U.gl.program(gl, `
      attribute vec3 a_position; uniform mat4 u_vp; varying vec2 v_p;
      void main(){ v_p = a_position.xz; gl_Position = u_vp * vec4(a_position, 1.0); }`, `
      precision mediump float; varying vec2 v_p;
      void main(){
        vec2 g = abs(fract(v_p) - 0.5);
        float line = step(0.48, max(g.x, g.y));
        vec3 c = mix(vec3(0.09, 0.07, 0.05), vec3(0.16, 0.13, 0.09), line);
        gl_FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
      }`);
    const ground = U.geometry.upload(gl, U.geometry.plane(FIELD + 2, 1, 1));
    // 바람 방향 화살표 (선)
    const arrowBuf = gl.createBuffer();
    const lineProg = U.gl.program(gl, `
      attribute vec3 a_position; uniform mat4 u_vp;
      void main(){ gl_Position = u_vp * vec4(a_position, 1.0); }`, `
      precision mediump float; uniform vec3 u_color;
      void main(){ gl_FragColor = vec4(u_color, 1.0); }`);
    const sideCol = U.hexToRgb01(ctx.side === 'a' ? U.colors.a : U.colors.b);

    const cam = { yaw: 0.6, pitch: 0.42, dist: 9, drag: false, lx: 0, ly: 0 };
    let time = 0;

    return {
      update(dt) {
        time += dt;
        if (P.autoRotate && !cam.drag) cam.yaw += dt * 0.12;
        if (ctx.input.mouse.wheel) cam.dist = U.clamp(cam.dist * Math.pow(1.12, ctx.input.mouse.wheel), 1.5, 25);
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
        gl.clearColor(0.55, 0.68, 0.82, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        const proj = M.perspective(U.rad(50), ctx.width / ctx.height, 0.05, 100);
        const tgt = [0, 0.3, 0];
        const vp = M.multiply(proj, M.lookAt(M.orbitEye(tgt, cam.yaw, cam.pitch, cam.dist), tgt));
        const a = U.rad(P.windDir), dir = [Math.cos(a), Math.sin(a)];

        groundProg.use();
        gl.uniformMatrix4fv(groundProg.u('u_vp'), false, vp);
        ground.draw(groundProg);

        grass.use();
        gl.uniformMatrix4fv(grass.u('u_vp'), false, vp);
        gl.uniform1f(grass.u('u_time'), time);
        gl.uniform1f(grass.u('u_mode'), +P.mode);
        gl.uniform1f(grass.u('u_strength'), P.strength);
        gl.uniform1f(grass.u('u_freq'), P.freq);
        gl.uniform1f(grass.u('u_spread'), P.spread);
        gl.uniform1f(grass.u('u_gustScale'), P.gustScale);
        gl.uniform1f(grass.u('u_gustSpeed'), P.gustSpeed);
        gl.uniform2fv(grass.u('u_dir'), dir);
        gl.uniform1f(grass.u('u_useWeight'), P.heightWeight ? 1 : 0);
        gl.uniform1f(grass.u('u_pow'), P.weightPow);
        gl.uniform1f(grass.u('u_showWeight'), P.showWeight ? 1 : 0);
        const st = 32;
        U.gl.attrib(gl, grass, 'a_root', grassBuf, 3, gl.FLOAT, st, 0);
        U.gl.attrib(gl, grass, 'a_local', grassBuf, 3, gl.FLOAT, st, 12);
        U.gl.attrib(gl, grass, 'a_h', grassBuf, 1, gl.FLOAT, st, 24);
        U.gl.attrib(gl, grass, 'a_rnd', grassBuf, 1, gl.FLOAT, st, 28);
        gl.drawArrays(gl.TRIANGLES, 0, vertCount);

        // 바람 방향 화살표 (들판 가장자리)
        const bx = -dir[0] * (FIELD / 2 + 0.6), bz = -dir[1] * (FIELD / 2 + 0.6), L = 2.2, y = 0.05;
        const tx = bx + dir[0] * L, tz = bz + dir[1] * L, px = -dir[1] * 0.35, pz = dir[0] * 0.35;
        const hx = tx - dir[0] * 0.5, hz = tz - dir[1] * 0.5;
        gl.bindBuffer(gl.ARRAY_BUFFER, arrowBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([bx, y, bz, tx, y, tz, tx, y, tz, hx + px, y, hz + pz, tx, y, tz, hx - px, y, hz - pz]), gl.DYNAMIC_DRAW);
        lineProg.use();
        gl.uniformMatrix4fv(lineProg.u('u_vp'), false, vp);
        gl.uniform3fv(lineProg.u('u_color'), sideCol);
        U.gl.attrib(gl, lineProg, 'a_position', arrowBuf, 3);
        gl.drawArrays(gl.LINES, 0, 6);

        const names = [GTL.L('정적', 'Static'), GTL.L('사인만', 'Sine only'), GTL.L('사인 + 노이즈', 'Sine + noise')];
        const tipMax = +P.mode === 0 ? 0 : P.strength * (+P.mode === 1 ? 0.8 : 1.6) * (P.heightWeight ? 1.05 : 0.6);
        ctx.stat(GTL.L('방식', 'Mode'), names[+P.mode]);
        ctx.stat(GTL.L('풀잎 수', 'Blades'), n);
        ctx.stat(GTL.L('정점 수', 'Vertices'), vertCount);
        ctx.stat(GTL.L('끝 최대 이동 (m)', 'Max tip offset (m)'), tipMax.toFixed(2));
        ctx.stat(GTL.L('뿌리 이동', 'Root movement'), +P.mode > 0 && !P.heightWeight ? GTL.L('있음 (미끄러짐)', 'Yes (sliding)') : GTL.L('없음', 'None'));
        ctx.stat(GTL.L('CPU 정점 갱신', 'CPU vertex updates'), GTL.L('0 (셰이더에서 계산)', '0 (computed in shader)'));
      },
    };
  },
});
