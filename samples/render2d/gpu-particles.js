// GPU 파티클 시뮬레이션: CPU에서 갱신 후 매 프레임 업로드 vs 부동소수점 텍스처 핑퐁으로 GPU에서 갱신
GTL.register({
  id: 'gpu-particles',
  title: 'GPU 파티클 시뮬레이션 (Niagara GPU 이미터, VFX Graph)',
  summary: '같은 이미터 규칙으로 파티클 수만 개를 움직임. A는 JS에서 위치를 계산해 매 프레임 버퍼로 올림. B는 상태를 부동소수점 텍스처에 두고 셰이더로 갱신해 업로드 없음.',
  renderer: 'webgl2',
  views: { a: 'CPU 시뮬레이션 + 업로드', b: 'GPU 시뮬레이션 (텍스처 핑퐁)' },
  controls: '조작 없음. 파라미터로 개수와 힘을 바꿈.',
  info: `
    <p><b>GPU 파티클</b>은 파티클의 위치, 속도, 나이를 GPU 메모리에 두고 셰이더로 갱신하는 방식. Unreal Niagara의 GPU 이미터, Unity VFX Graph가 이 방식임.</p>
    <p>CPU 방식은 파티클마다 JS(또는 C++) 루프를 돌고, 결과 위치를 매 프레임 정점 버퍼로 보냄(<code>bufferSubData</code>).
    파티클 수에 비례해 <b>CPU 시간과 업로드량이 함께 늘어남</b>. 10만 개면 프레임마다 약 1.2MB를 보냄.</p>
    <p>GPU 방식의 동작:</p>
    <ul>
      <li>상태를 RGBA32F 텍스처 두 장에 저장. 텍셀 하나가 파티클 하나.</li>
      <li>시뮬레이션 패스: 텍스처 A를 읽고 힘을 적용해 텍스처 B에 씀. 다음 프레임에는 A와 B를 바꿈(핑퐁).</li>
      <li>그리기 패스: 정점 셰이더가 <code>gl_VertexID</code>로 텍셀을 읽어 위치를 정함. CPU는 개수만 알려 줌.</li>
    </ul>
    <p>단점: 부동소수점 렌더 타겟(<code>EXT_color_buffer_float</code>) 필요. 파티클끼리의 상호작용, 게임 로직으로 결과를 다시 읽는 일(충돌 이벤트 등)은 어려움.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 204" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="arrA" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    </defs>
    <text x="4" y="16" class="t-a">${L('A: CPU 시뮬레이션', 'A: CPU simulation')}</text>
    <rect x="10" y="26" width="120" height="40" rx="4" class="f-dim"/>
    <text x="70" y="44" text-anchor="middle">${L('JS 루프', 'JS loop')}</text>
    <text x="70" y="58" text-anchor="middle" class="t-small t-dim">${L('파티클마다 계산', 'per particle')}</text>
    <path d="M130,46 L200,46" class="d-a" marker-end="url(#arrA)"/>
    <rect x="202" y="26" width="130" height="40" rx="4" class="f-dim"/>
    <text x="267" y="44" text-anchor="middle" class="t-mono">bufferSubData</text>
    <text x="267" y="58" text-anchor="middle" class="t-small t-dim">${L('매 프레임 12B x N', '12 B x N every frame')}</text>
    <path d="M332,46 L402,46" class="d-a" marker-end="url(#arrA)"/>
    <rect x="404" y="26" width="120" height="40" rx="4" class="f-dim"/>
    <text x="464" y="50" text-anchor="middle">${L('그리기', 'Draw')}</text>
    <line x1="166" y1="20" x2="166" y2="78" class="d-dim" stroke-dasharray="3 3"/>
    <text x="10" y="84" class="t-small t-dim">${L('CPU 쪽', 'CPU side')}</text>
    <text x="172" y="84" class="t-small t-dim">${L('PCIe 버스를 지나 GPU로', 'over the bus to the GPU')}</text>
    <text x="4" y="112" class="t-b">${L('B: GPU 시뮬레이션', 'B: GPU simulation')}</text>
    <rect x="10" y="124" width="110" height="40" rx="4" class="f-dim"/>
    <text x="65" y="142" text-anchor="middle">${L('텍스처 A', 'Texture A')}</text>
    <text x="65" y="156" text-anchor="middle" class="t-small t-dim">${L('위치, 속도, 나이', 'pos, vel, age')}</text>
    <path d="M120,144 L180,144" class="d-b" marker-end="url(#arrB)"/>
    <rect x="182" y="124" width="110" height="40" rx="4" class="f-dim"/>
    <text x="237" y="142" text-anchor="middle">${L('시뮬레이션 패스', 'Sim pass')}</text>
    <text x="237" y="156" text-anchor="middle" class="t-small t-dim">${L('프래그먼트 셰이더', 'fragment shader')}</text>
    <path d="M292,144 L352,144" class="d-b" marker-end="url(#arrB)"/>
    <rect x="354" y="124" width="80" height="40" rx="4" class="f-dim"/>
    <text x="394" y="148" text-anchor="middle">${L('텍스처 B', 'Texture B')}</text>
    <path d="M434,144 L470,144" class="d-b" marker-end="url(#arrB)"/>
    <rect x="472" y="124" width="62" height="40" rx="4" class="f-dim"/>
    <text x="503" y="148" text-anchor="middle">${L('그리기', 'Draw')}</text>
    <path d="M394,164 C394,186 65,186 65,166" class="d-accent" stroke-dasharray="4 3" marker-end="url(#arrB)"/>
    <text x="230" y="200" text-anchor="middle" class="t-small">${L('다음 프레임에 A와 B를 바꿈 (업로드 없음)', 'Swap A and B next frame (no upload)')}</text>
  </svg>`,
  look: [
    '"파티클 수"를 200000으로 올리면 A의 "CPU 시뮬레이션" 시간과 프레임 비용(⏱)이 크게 늘어남. B의 CPU 시간은 거의 0에 머묾.',
    'A의 "업로드량"을 보면 파티클 수에 비례해 프레임마다 MB 단위로 늘어남. B는 항상 0.',
    '"힘의 종류"를 바꿔도 두 뷰의 움직임은 같은 규칙을 따름. 비용 차이만 남음.',
    '"파티클 수"를 1000으로 낮추면 두 방식의 비용 차이가 거의 사라짐. 개수가 적으면 CPU 방식도 충분함.',
  ],
  refs: [
    { type: 'engine', title: 'Unreal Engine: Niagara GPU Simulation (GPU Compute Sim target)', note: 'Niagara 이미터의 Sim Target을 GPUCompute Sim으로 바꾸면 상태가 GPU 버퍼에 있음' },
    { type: 'engine', title: 'Unity: Choosing your particle system solution', url: 'https://docs.unity3d.com/Manual/ChoosingYourParticleSystem.html', note: 'Built-in Particle System(CPU) vs Visual Effect Graph(GPU) 비교' },
    { type: 'talk', title: 'Building a Million-Particle System (Lutz Latta)', year: 2004, note: 'GDC 2004. 부동소수점 텍스처에 상태를 두고 핑퐁으로 갱신하는 방식.' },
    { type: 'talk', title: 'Compute-Based GPU Particle Systems (Gareth Thomas)', year: 2014, note: 'GDC 2014. 컴퓨트 셰이더로 생성, 갱신, 정렬까지 GPU에서 처리.' },
  ],
  params: [
    { key: 'count', label: '파티클 수', type: 'int', min: 1000, max: 200000, step: 1000, default: 100000, shared: true, reset: true, group: '이미터' },
    { key: 'force', label: '힘의 종류', type: 'select', options: [
      { value: 'vortex', label: '소용돌이' },
      { value: 'curl', label: '컬 노이즈 흐름' },
    ], default: 'vortex', shared: true },
    { key: 'strength', label: '힘의 세기', type: 'range', min: 0, max: 3, step: 0.05, default: 1, shared: true },
    { key: 'gravity', label: '중력', type: 'range', min: 0, max: 3, step: 0.05, default: 0.6, shared: true },
    { key: 'life', label: '수명 (초)', type: 'range', min: 0.5, max: 8, step: 0.1, default: 4, shared: true, help: '수명이 끝난 파티클은 이미터에서 다시 생성됨' },
    { key: 'size', label: '점 크기', type: 'range', min: 1, max: 4, step: 0.5, default: 1.5, shared: true },
    { key: 'sim', label: '시뮬레이션 위치', type: 'select', group: '방식', options: [
      { value: 'cpu', label: 'CPU (JS 루프 + bufferSubData)' },
      { value: 'gpu', label: 'GPU (부동소수점 텍스처 핑퐁)' },
    ], a: 'cpu', b: 'gpu' },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'GPU Particle Simulation (Niagara GPU Emitters, VFX Graph)',
    summary: 'Tens of thousands of particles move by the same emitter rules. A computes positions in JS and uploads them to a buffer every frame. B keeps the state in float textures and updates it in a shader, so nothing is uploaded.',
    views: { a: 'CPU sim + upload', b: 'GPU sim (texture ping-pong)' },
    controls: 'No input. Change the count and forces with the parameters.',
    info: `
    <p><b>GPU particles</b> keep each particle's position, velocity and age in GPU memory and update them in a shader. Unreal Niagara GPU emitters and Unity VFX Graph work this way.</p>
    <p>The CPU approach runs a JS (or C++) loop per particle and sends the new positions to a vertex buffer every frame (<code>bufferSubData</code>).
    <b>CPU time and upload size both grow with the particle count</b>. With 100k particles that is about 1.2 MB per frame.</p>
    <p>How the GPU approach works:</p>
    <ul>
      <li>Store the state in two RGBA32F textures. One texel is one particle.</li>
      <li>Simulation pass: read texture A, apply the forces, write texture B. Next frame, swap A and B (ping-pong).</li>
      <li>Draw pass: the vertex shader reads the texel for <code>gl_VertexID</code> and places the point. The CPU only passes the count.</li>
    </ul>
    <p>Downsides: it needs float render targets (<code>EXT_color_buffer_float</code>). Particle to particle interaction and reading results back into game logic (collision events and so on) are hard.</p>`,
    look: [
      'Raise "Particle count" to 200000. A\'s "CPU simulation" time and frame cost (⏱) grow a lot. B\'s CPU time stays near 0.',
      'Watch A\'s "Upload size". It grows with the count, several MB per frame. B always shows 0.',
      'Change "Force type". Both views follow the same rules. Only the cost differs.',
      'Lower "Particle count" to 1000. The cost gap almost disappears. For small counts the CPU approach is fine.',
    ],
    refs: [
      'Set a Niagara emitter Sim Target to GPUCompute Sim and its state lives in GPU buffers.',
      'Compares the built-in Particle System (CPU) with the Visual Effect Graph (GPU).',
      'GDC 2004. Keeps the state in float textures and updates it by ping-pong.',
      'GDC 2014. Spawning, updating and sorting all run on the GPU with compute shaders.',
    ],
    params: {
      count: { label: 'Particle count', group: 'Emitter' },
      force: { label: 'Force type', options: { vortex: 'Vortex', curl: 'Curl noise flow' } },
      strength: 'Force strength',
      gravity: 'Gravity',
      life: { label: 'Lifetime (s)', help: 'Particles that reach the end of their life respawn at the emitter' },
      size: 'Point size',
      sim: { label: 'Simulation on', group: 'Method', options: { cpu: 'CPU (JS loop + bufferSubData)', gpu: 'GPU (float texture ping-pong)' } },
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, P = ctx.params;
    const floatExt = gl.getExtension('EXT_color_buffer_float');
    const N = P.count;
    const SIDE = Math.ceil(Math.sqrt(N));

    // ── 셰이더 (ASCII only) ──
    const COMMON = `
float hash(float n){ return fract(sin(n) * 43758.5453); }
vec2 force(vec2 p, vec2 v, float t, float mode, float str, float grav){
  vec2 f = vec2(0.0, -grav);
  if (mode < 0.5) {
    vec2 d = p - vec2(0.0, 0.15);
    float r2 = dot(d, d) + 0.05;
    f += (vec2(-d.y, d.x) * 0.9 / r2 - d * 1.2) * str;
  } else {
    float k = 2.6;
    float a = k * p.x + t * 0.6, b = k * p.y - t * 0.4;
    vec2 flow = vec2(-sin(a) * sin(b), -cos(a) * cos(b)) * 1.2;
    f += (flow * str - v) * 0.9 + vec2(0.0, 0.45);
  }
  return f - v * 0.35;
}
`;
    const SIM_VS = `#version 300 es
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;
    const SIM_FS = `#version 300 es
precision highp float;
uniform sampler2D u_s0; uniform sampler2D u_s1;
uniform float u_dt; uniform float u_time; uniform float u_mode; uniform float u_str; uniform float u_grav; uniform float u_life;
uniform vec2 u_emit;
layout(location = 0) out vec4 o0;
layout(location = 1) out vec4 o1;
` + COMMON + `
void main(){
  ivec2 ij = ivec2(gl_FragCoord.xy);
  vec4 s0 = texelFetch(u_s0, ij, 0);
  vec4 s1 = texelFetch(u_s1, ij, 0);
  vec2 p = s0.xy, v = s0.zw;
  float age = s1.x + u_dt, life = s1.y, seed = s1.z, gen = s1.w;
  if (age >= life) {
    gen += 1.0;
    float r1 = hash(seed * 17.31 + gen * 3.17), r2 = hash(seed * 7.13 + gen * 11.7), r3 = hash(seed * 3.71 + gen * 5.3);
    float ang = 1.5708 + (r1 - 0.5) * 1.3;
    float spd = 0.7 + r2 * 0.9;
    p = u_emit; v = vec2(cos(ang), sin(ang)) * spd;
    age = 0.0; life = u_life * (0.5 + r3 * 0.5);
  } else if (age > 0.0) {
    v += force(p, v, u_time, u_mode, u_str, u_grav) * u_dt;
    p += v * u_dt;
  } else {
    p = u_emit;
  }
  o0 = vec4(p, v);
  o1 = vec4(age, life, seed, gen);
}`;
    const DRAW_FS = `#version 300 es
precision highp float;
in float v_t; uniform vec3 u_col; out vec4 o;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float m = 1.0 - smoothstep(0.2, 0.5, length(c));
  vec3 col = mix(vec3(1.0, 0.95, 0.85), u_col, clamp(v_t * 1.5, 0.0, 1.0));
  float a = (v_t < 0.0 || v_t > 1.0) ? 0.0 : (1.0 - v_t) * 0.55;
  o = vec4(col * a * m, 1.0);
}`;
    const DRAW_GPU_VS = `#version 300 es
precision highp float;
uniform sampler2D u_s0; uniform sampler2D u_s1; uniform int u_side; uniform float u_asp; uniform float u_size;
out float v_t;
void main(){
  ivec2 ij = ivec2(gl_VertexID % u_side, gl_VertexID / u_side);
  vec4 s0 = texelFetch(u_s0, ij, 0);
  vec4 s1 = texelFetch(u_s1, ij, 0);
  v_t = s1.y > 0.0 ? s1.x / s1.y : -1.0;
  if (s1.x <= 0.0) v_t = -1.0;
  gl_Position = vec4(s0.x / u_asp, s0.y, 0.0, 1.0);
  gl_PointSize = u_size;
}`;
    const DRAW_CPU_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec3 a_p;
uniform float u_asp; uniform float u_size;
out float v_t;
void main(){
  v_t = a_p.z;
  gl_Position = vec4(a_p.x / u_asp, a_p.y, 0.0, 1.0);
  gl_PointSize = u_size;
}`;
    const progSim = U.gl.program(gl, SIM_VS, SIM_FS);
    const progGpu = U.gl.program(gl, DRAW_GPU_VS, DRAW_FS);
    const progCpu = U.gl.program(gl, DRAW_CPU_VS, DRAW_FS);
    const quad = U.gl.quad(gl);

    // ── CPU 상태 ──
    const px = new Float32Array(N), py = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N);
    const age = new Float32Array(N), life = new Float32Array(N), seed = new Float32Array(N), gen = new Float32Array(N);
    const upload = new Float32Array(N * 3);
    const cpuBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cpuBuf);
    gl.bufferData(gl.ARRAY_BUFFER, upload.byteLength, gl.DYNAMIC_DRAW);
    const vaoCpu = gl.createVertexArray();
    gl.bindVertexArray(vaoCpu);
    gl.bindBuffer(gl.ARRAY_BUFFER, cpuBuf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    const vaoEmpty = gl.createVertexArray();
    gl.bindVertexArray(null);

    // ── GPU 상태: 상태 텍스처 2장 x 2세트(핑퐁) ──
    const mkTex = (data) => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, SIDE, SIDE, 0, gl.RGBA, gl.FLOAT, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    let sets = null, cur = 0, gpuOk = false;

    let t = 0, cpuMs = 0, upMs = 0, gpuJsMs = 0;
    const hash = (n) => { const s = Math.sin(n) * 43758.5453; return s - Math.floor(s); };
    const emitter = (tt) => [Math.sin(tt * 0.7) * 0.5, -0.65];

    function init() {
      ctx.rng = U.rng(ctx.seed);
      t = 0;
      const e = emitter(0);
      for (let i = 0; i < N; i++) {
        seed[i] = ctx.rng.range(0, 1000);
        life[i] = P.life * (0.5 + ctx.rng.range(0, 0.5));
        age[i] = -ctx.rng.range(0, P.life);      // 음수: 아직 태어나지 않음 (출생을 시간에 분산)
        gen[i] = 0;
        px[i] = e[0]; py[i] = e[1]; vx[i] = 0; vy[i] = 0;
      }
      if (sets) for (const s of sets) { gl.deleteFramebuffer(s.fb); gl.deleteTexture(s.t0); gl.deleteTexture(s.t1); }
      sets = null; gpuOk = false;
      if (floatExt) {
        const d0 = new Float32Array(SIDE * SIDE * 4), d1 = new Float32Array(SIDE * SIDE * 4);
        for (let i = 0; i < SIDE * SIDE; i++) {
          if (i < N) {
            d0[i * 4] = px[i]; d0[i * 4 + 1] = py[i];
            d1[i * 4] = age[i]; d1[i * 4 + 1] = life[i]; d1[i * 4 + 2] = seed[i];
          } else { d1[i * 4] = -1e9; d1[i * 4 + 1] = 1e9; } // 남는 텍셀은 영원히 미출생
        }
        sets = [0, 1].map(() => {
          const t0 = mkTex(d0), t1 = mkTex(d1);
          const fb = gl.createFramebuffer();
          gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t0, 0);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, t1, 0);
          return { t0, t1, fb };
        });
        gpuOk = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        cur = 0;
      }
    }
    init();

    const useGpu = () => P.sim === 'gpu' && gpuOk;

    function cpuStep(dt) {
      const mode = P.force === 'vortex' ? 0 : 1, str = P.strength, grav = P.gravity, L = P.life;
      const e = emitter(t);
      const damp = 0.35;
      for (let i = 0; i < N; i++) {
        let a = age[i] + dt;
        if (a >= life[i]) {
          const g = ++gen[i], s = seed[i];
          const r1 = hash(s * 17.31 + g * 3.17), r2 = hash(s * 7.13 + g * 11.7), r3 = hash(s * 3.71 + g * 5.3);
          const ang = 1.5708 + (r1 - 0.5) * 1.3, spd = 0.7 + r2 * 0.9;
          px[i] = e[0]; py[i] = e[1]; vx[i] = Math.cos(ang) * spd; vy[i] = Math.sin(ang) * spd;
          a = 0; life[i] = L * (0.5 + r3 * 0.5);
        } else if (a > 0) {
          const x = px[i], y = py[i];
          let v0 = vx[i], v1 = vy[i];
          let fx = 0, fy = -grav;
          if (mode === 0) {
            const dx = x, dy = y - 0.15, r2 = dx * dx + dy * dy + 0.05;
            fx += (-dy * 0.9 / r2 - dx * 1.2) * str;
            fy += (dx * 0.9 / r2 - dy * 1.2) * str;
          } else {
            const A = 2.6 * x + t * 0.6, B = 2.6 * y - t * 0.4;
            fx += (-Math.sin(A) * Math.sin(B) * 1.2 * str - v0) * 0.9;
            fy += (-Math.cos(A) * Math.cos(B) * 1.2 * str - v1) * 0.9 + 0.45; // 부력
          }
          fx -= v0 * damp; fy -= v1 * damp;
          v0 += fx * dt; v1 += fy * dt;
          vx[i] = v0; vy[i] = v1;
          px[i] = x + v0 * dt; py[i] = y + v1 * dt;
        } else { px[i] = e[0]; py[i] = e[1]; }
        age[i] = a;
        const k = i * 3;
        upload[k] = px[i]; upload[k + 1] = py[i];
        upload[k + 2] = a > 0 ? a / life[i] : -1;
      }
    }

    function gpuStep(dt) {
      const src = sets[cur], dst = sets[1 - cur];
      gl.bindVertexArray(null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      gl.viewport(0, 0, SIDE, SIDE);
      gl.disable(gl.BLEND);
      progSim.use();
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src.t0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, src.t1);
      gl.uniform1i(progSim.u('u_s0'), 0);
      gl.uniform1i(progSim.u('u_s1'), 1);
      gl.uniform1f(progSim.u('u_dt'), dt);
      gl.uniform1f(progSim.u('u_time'), t);
      gl.uniform1f(progSim.u('u_mode'), P.force === 'vortex' ? 0 : 1);
      gl.uniform1f(progSim.u('u_str'), P.strength);
      gl.uniform1f(progSim.u('u_grav'), P.gravity);
      gl.uniform1f(progSim.u('u_life'), P.life);
      const e = emitter(t);
      gl.uniform2f(progSim.u('u_emit'), e[0], e[1]);
      quad.draw(progSim, 'a_pos');
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.activeTexture(gl.TEXTURE0);
      cur = 1 - cur;
    }

    let mode = useGpu() ? 'gpu' : 'cpu';
    // 방식이 실시간으로 바뀌면 상태를 처음부터 다시 만듦
    function syncMode() {
      const m = useGpu() ? 'gpu' : 'cpu';
      if (m === mode) return;
      mode = m;
      init();
    }

    const ema = (old, v) => old * 0.9 + v * 0.1;
    return {
      update(dt) {
        syncMode();
        const h = Math.min(dt, 1 / 30);
        if (h <= 0) return;
        t += h;
        if (mode === 'cpu') {
          const t0 = ctx.now();
          cpuStep(h);
          const t1 = ctx.now();
          gl.bindBuffer(gl.ARRAY_BUFFER, cpuBuf);
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, upload);
          const t2 = ctx.now();
          cpuMs = ema(cpuMs, t1 - t0); upMs = ema(upMs, t2 - t1);
        } else {
          const t0 = ctx.now();
          gpuStep(h);
          gpuJsMs = ema(gpuJsMs, ctx.now() - t0);
          cpuMs = ema(cpuMs, 0); upMs = ema(upMs, 0);
        }
      },
      render() {
        const W = ctx.pixelWidth, H = ctx.pixelHeight;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, W, H);
        gl.clearColor(0.03, 0.035, 0.05, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
        const asp = W / Math.max(1, H);
        const col = U.hexToRgb01(ctx.side === 'a' ? U.colors.a : U.colors.b);
        const size = P.size * ctx.pixelRatio;
        if (mode === 'gpu') {
          progGpu.use();
          gl.bindVertexArray(vaoEmpty);
          const s = sets[cur];
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, s.t0);
          gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, s.t1);
          gl.uniform1i(progGpu.u('u_s0'), 0);
          gl.uniform1i(progGpu.u('u_s1'), 1);
          gl.uniform1i(progGpu.u('u_side'), SIDE);
          gl.uniform1f(progGpu.u('u_asp'), asp);
          gl.uniform1f(progGpu.u('u_size'), size);
          gl.uniform3f(progGpu.u('u_col'), col[0], col[1], col[2]);
          gl.drawArrays(gl.POINTS, 0, N);
          gl.activeTexture(gl.TEXTURE0);
        } else {
          progCpu.use();
          gl.bindVertexArray(vaoCpu);
          gl.uniform1f(progCpu.u('u_asp'), asp);
          gl.uniform1f(progCpu.u('u_size'), size);
          gl.uniform3f(progCpu.u('u_col'), col[0], col[1], col[2]);
          gl.drawArrays(gl.POINTS, 0, N);
        }
        gl.bindVertexArray(null);
        gl.disable(gl.BLEND);

        if (P.sim === 'gpu' && !gpuOk) {
          ctx.stat(GTL.L('경고', 'Warning'), GTL.L('EXT_color_buffer_float 미지원. 부동소수점 텍스처에 쓸 수 없어 CPU 방식으로 대체', 'No EXT_color_buffer_float. Cannot render to float textures, so this view falls back to CPU'));
        }
        ctx.stat(GTL.L('파티클 수', 'Particles'), N.toLocaleString('en-US'));
        ctx.stat(GTL.L('시뮬레이션', 'Simulation'), mode === 'gpu' ? GTL.L('GPU (텍스처 ', 'GPU (texture ') + SIDE + 'x' + SIDE + ')' : 'CPU (JS)');
        ctx.stat(GTL.L('CPU 시뮬레이션', 'CPU simulation'), cpuMs.toFixed(2) + ' ms');
        ctx.stat(GTL.L('업로드 (bufferSubData)', 'Upload (bufferSubData)'), upMs.toFixed(2) + ' ms');
        ctx.stat(GTL.L('업로드량/프레임', 'Upload size/frame'), mode === 'cpu' ? (upload.byteLength / 1048576).toFixed(2) + ' MB' : '0 MB');
        if (mode === 'gpu') ctx.stat(GTL.L('GPU 명령 제출 (JS)', 'GPU command submit (JS)'), gpuJsMs.toFixed(3) + ' ms');
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
