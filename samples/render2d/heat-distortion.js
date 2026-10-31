// 열기 왜곡과 충격파 굴절: 장면을 텍스처에 그린 뒤, 스크롤되는 노이즈로 UV를 조금씩 밀어서 다시 읽음
GTL.register({
  id: 'heat-distortion',
  title: '열기 왜곡 & 굴절 (UV 오프셋 노이즈)',
  summary: '장면을 먼저 텍스처에 그리고, 화면을 다시 그릴 때 노이즈 값만큼 UV를 밀어서 읽음. 불꽃 위 아지랑이와 충격파 같은 굴절이 생김. 기하 구조는 그대로라서 비용은 풀스크린 패스 하나와 텍스처 읽기 몇 번뿐임.',
  renderer: 'webgl',
  views: { a: '왜곡 없음', b: 'UV 오프셋 왜곡' },
  controls: '클릭: 그 위치에 충격파',
  info: `
    <p>뜨거운 공기는 밀도가 달라서 빛을 굴절시킴. 그래서 불꽃 너머 배경이 일렁여 보임. 게임은 이 현상을 실제 광학 계산 없이 <b>UV 오프셋</b>으로 흉내 냄.</p>
    <ol>
    <li>장면 전체를 렌더 타겟(텍스처)에 그림.</li>
    <li>풀스크린 패스에서 노이즈 텍스처를 읽어 2D 벡터 <code>(n.rg * 2 - 1)</code>를 얻음.</li>
    <li>벡터에 강도와 <b>마스크</b>를 곱해 UV에 더한 뒤 장면 텍스처를 읽음.</li>
    </ol>
    <ul>
    <li>노이즈를 위로 스크롤하면 열기가 올라가는 느낌이 남. 속도가 다른 두 층을 더하면 반복 무늬가 덜 보임.</li>
    <li>마스크는 열원 위쪽 기둥 모양. 마스크가 없으면 화면 전체가 흔들려서 멀미가 남.</li>
    <li>충격파는 노이즈 대신 고리 모양 마스크와 바깥 방향 벡터를 씀.</li>
    <li>색수차(R, G, B를 조금씩 다른 오프셋으로 읽기)를 더하면 렌즈 느낌이 강해짐.</li>
    </ul>
    <p>단점: 화면 밖이나 앞쪽 물체의 픽셀을 끌어와서 경계가 번질 수 있음. 실제 엔진은 깊이를 비교해 앞쪽 물체가 끌려오지 않게 막기도 함.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 170" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <rect x="10" y="26" width="100" height="84" rx="3" class="f-dim"/>
    ${[[30, 90], [55, 70], [80, 95], [42, 52], [92, 60], [68, 42]].map(([x, y]) => `<path d="M${x},${y} L${x},${y - 14}" class="d-accent" marker-end="url(#arr)"/>`).join('')}
    <text x="60" y="14" text-anchor="middle">${L('노이즈 텍스처', 'Noise texture')}</text>
    <text x="60" y="126" text-anchor="middle" class="t-small t-dim">${L('위로 스크롤', 'scrolls up')}</text>
    <text x="60" y="140" text-anchor="middle" class="t-small t-mono">n.rg * 2 - 1</text>
    <text x="128" y="72" text-anchor="middle">x</text>
    <rect x="146" y="26" width="100" height="84" rx="3" class="f-dim"/>
    <ellipse cx="196" cy="62" rx="22" ry="34" class="f-b" opacity="0.5"/>
    <polygon points="184,108 196,88 208,108" class="f-accent"/>
    <text x="196" y="14" text-anchor="middle">${L('마스크', 'Mask')}</text>
    <text x="196" y="126" text-anchor="middle" class="t-small t-dim">${L('열원 위쪽 기둥', 'column above the heat')}</text>
    <text x="196" y="140" text-anchor="middle" class="t-small t-dim">${L('x 강도', 'x strength')}</text>
    <path d="M250,68 L286,68" class="d-accent" marker-end="url(#arr)"/>
    <text x="268" y="62" text-anchor="middle" class="t-small">${L('오프셋', 'offset')}</text>
    <rect x="290" y="26" width="240" height="84" rx="3" class="f-dim"/>
    ${[1, 2, 3, 4, 5, 6, 7].map((i) => `<line x1="${290 + i * 30}" y1="26" x2="${290 + i * 30}" y2="110" class="d-dim"/>`).join('')}
    ${[1, 2].map((i) => `<line x1="290" y1="${26 + i * 28}" x2="530" y2="${26 + i * 28}" class="d-dim"/>`).join('')}
    <rect x="380" y="60" width="12" height="12" class="d-line" fill="none"/>
    <circle cx="404" cy="46" r="4" class="f-b"/>
    <path d="M386,66 L401,49" class="d-accent" marker-end="url(#arr)"/>
    <text x="410" y="48" class="t-small">${L('여기서 읽음', 'read here')}</text>
    <text x="398" y="84" class="t-small">${L('출력 픽셀', 'output pixel')}</text>
    <text x="410" y="14" text-anchor="middle">${L('장면 렌더 타겟', 'Scene render target')}</text>
    <text x="290" y="126" class="t-small t-a">${L('A: 오프셋 0, 같은 위치를 읽음', 'A: offset 0, reads the same spot')}</text>
    <text x="10" y="162" class="t-small t-dim">${L('색 = scene(uv + (n.rg * 2 - 1) x 강도 x 마스크). 마스크가 없으면 화면 전체가 흔들림.', 'color = scene(uv + (n.rg * 2 - 1) x strength x mask). Without a mask the whole screen wobbles.')}</text>
  </svg>`,
  look: [
    'A와 B의 불꽃 위 벽돌 줄눈을 비교하면 B만 줄눈이 물결처럼 일렁임.',
    'B의 "디버그 보기"를 "오프셋 벡터"로 바꾸면 왜곡이 들어가는 영역과 방향이 색으로 보임.',
    'B의 "마스크"를 끄면 화면 전체가 흔들림. 열원 근처만 왜곡해야 자연스러움.',
    '뷰를 클릭하면 충격파 고리가 퍼지며 배경을 바깥으로 밀어냄. "색수차"를 켜면 고리 가장자리에 무지개 띠가 생김.',
  ],
  refs: [
    { type: 'book', title: 'GPU Gems 2, Chapter 19: Generic Refraction Simulation (Tiago Sousa)', year: 2005, note: '장면 텍스처를 노멀맵으로 흔들어 읽는 굴절 기법. 앞쪽 물체가 끌려오는 문제를 마스크로 막는 방법도 다룸.' },
    { type: 'engine', title: 'Unreal Engine: 머티리얼 Refraction 입력', note: '반투명 머티리얼의 굴절을 별도 Distortion 패스에서 화면 UV 오프셋으로 처리함.' },
    { type: 'engine', title: 'Unity URP: Opaque Texture (_CameraOpaqueTexture)', note: '불투명 패스 결과를 텍스처로 받아 열기 왜곡에 사용함.' },
  ],
  params: [
    { key: 'on', label: '왜곡', type: 'bool', group: '왜곡', a: false, b: true },
    { key: 'strength', label: '강도 (px)', type: 'range', min: 0, max: 30, step: 0.5, default: 8, when: (p) => p.on },
    { key: 'scale', label: '노이즈 크기', type: 'range', min: 1, max: 12, step: 0.5, default: 5, when: (p) => p.on },
    { key: 'speed', label: '상승 속도', type: 'range', min: 0, max: 2, step: 0.05, default: 0.6, when: (p) => p.on },
    { key: 'mask', label: '마스크 (열원 위쪽만)', type: 'bool', default: true, when: (p) => p.on },
    { key: 'chroma', label: '색수차', type: 'bool', default: false, when: (p) => p.on },
    { key: 'shock', label: '충격파 강도', type: 'range', min: 0, max: 40, step: 1, default: 18, when: (p) => p.on },
    { key: 'debug', label: '디버그 보기', type: 'select', options: [
      { value: 0, label: '최종' },
      { value: 1, label: '오프셋 벡터' },
    ], default: 0, when: (p) => p.on },
    { key: 'autoShock', label: '자동 충격파', type: 'bool', default: true, shared: true, group: '장면' },
  ],
  en: {
    title: 'Heat Distortion & Refraction (UV Offset Noise)',
    summary: 'Draw the scene to a texture first. When you draw the screen again, shift the UV by a noise value before reading. This creates refraction like heat haze above a flame or a shock wave. The geometry stays the same, so the cost is just one full-screen pass and a few texture reads.',
    views: { a: 'No distortion', b: 'UV offset distortion' },
    controls: 'Click: shock wave at that spot',
    info: `
    <p>Hot air has a different density, so it bends light. That is why the background behind a flame seems to waver. Games fake this with a <b>UV offset</b> instead of real optics.</p>
    <ol>
    <li>Draw the whole scene to a render target (texture).</li>
    <li>In a full-screen pass, read a noise texture to get a 2D vector <code>(n.rg * 2 - 1)</code>.</li>
    <li>Multiply the vector by the strength and a <b>mask</b>, add it to the UV, then read the scene texture.</li>
    </ol>
    <ul>
    <li>Scroll the noise upward and the heat seems to rise. Adding two layers with different speeds hides the repeating pattern.</li>
    <li>The mask is a column shape above the heat source. Without a mask, the whole screen shakes and causes motion sickness.</li>
    <li>A shock wave uses a ring-shaped mask and an outward vector instead of noise.</li>
    <li>Adding chromatic aberration (reading R, G, and B with slightly different offsets) makes it feel more like a lens.</li>
    </ul>
    <p>Downside: it can pull in pixels from off screen or from objects in front, so edges may smear. Real engines sometimes compare depth to keep objects in front from being pulled in.</p>`,
    look: [
      'Compare the brick mortar lines above the flame in A and B. Only in B do the lines ripple like waves.',
      'Set "Debug view" in B to "Offset vector". Colors show where the distortion applies and in which direction.',
      'Turn off "Mask" in B. The whole screen shakes. Distortion looks natural only near the heat source.',
      'Click a view. A shock wave ring spreads and pushes the background outward. Turn on "Chromatic aberration" and rainbow bands appear at the ring edge.',
    ],
    refs: [
      'A refraction technique that reads the scene texture shifted by a normal map. It also covers using a mask to stop objects in front from being pulled in.',
      { title: 'Unreal Engine: material Refraction input', note: 'Handles refraction of translucent materials as a screen UV offset in a separate Distortion pass.' },
      'Gets the opaque pass result as a texture and uses it for heat distortion.',
    ],
    params: {
      on: { label: 'Distortion', group: 'Distortion' },
      strength: 'Strength (px)',
      scale: 'Noise size',
      speed: 'Rise speed',
      mask: 'Mask (above heat source only)',
      chroma: 'Chromatic aberration',
      shock: 'Shock wave strength',
      debug: { label: 'Debug view', options: { 0: 'Final', 1: 'Offset vector' } },
      autoShock: { label: 'Auto shock waves', group: 'Scene' },
    },
  },

  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, P = ctx.params;
    // 이어지는(tileable) 2채널 노이즈: R, G에 서로 다른 값 노이즈
    const N = 128, n1 = U.noise(ctx.seed + 21), n2 = U.noise(ctx.seed + 37);
    const data = new Uint8Array(N * N * 4);
    const tile = (nz, x, y, s) => {
      const fx = x / N, fy = y / N;
      const a = nz.fbm2(fx * s, fy * s, { octaves: 3 }), b = nz.fbm2((fx - 1) * s, fy * s, { octaves: 3 });
      const c = nz.fbm2(fx * s, (fy - 1) * s, { octaves: 3 }), d = nz.fbm2((fx - 1) * s, (fy - 1) * s, { octaves: 3 });
      return U.lerp(U.lerp(a, b, fx), U.lerp(c, d, fx), fy);
    };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const o = (y * N + x) * 4;
      data[o] = U.clamp(128 + tile(n1, x, y, 4) * 300, 0, 255);
      data[o + 1] = U.clamp(128 + tile(n2, x, y, 4) * 300, 0, 255);
      data[o + 2] = 0; data[o + 3] = 255;
    }
    const noiseTex = U.gl.texture(gl, { width: N, height: N, data }, { filter: 'linear', wrap: 'repeat' });

    const VS = U.gl.QUAD_VS;
    const SCENE_FS = `precision highp float; varying vec2 v_uv;
uniform vec2 u_res; uniform float u_time;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec2 px = v_uv * u_res;
  float asp = u_res.x / u_res.y;
  vec2 q = vec2(v_uv.x * asp, v_uv.y);
  // brick wall
  float bh = 22.0, bw = 52.0;
  float row = floor(px.y / bh);
  float bx = px.x / bw + mod(row, 2.0) * 0.5;
  vec2 cell = vec2(floor(bx), row);
  vec2 f = vec2(fract(bx) * bw, mod(px.y, bh));
  float mortar = step(f.x, 3.0) + step(f.y, 3.0);
  vec3 brick = mix(vec3(0.45, 0.2, 0.14), vec3(0.62, 0.3, 0.2), hash(cell));
  vec3 col = mortar > 0.0 ? vec3(0.78, 0.74, 0.66) : brick;
  // windows (striped curtains)
  vec2 wc = vec2(asp * 0.2, 0.62);
  if (abs(q.x - wc.x) < 0.12 && abs(q.y - wc.y) < 0.16) col = mix(vec3(0.15, 0.3, 0.55), vec3(0.85, 0.9, 1.0), step(0.5, fract(q.x * 40.0)));
  vec2 wc2 = vec2(asp * 0.8, 0.62);
  if (abs(q.x - wc2.x) < 0.12 && abs(q.y - wc2.y) < 0.16) col = mix(vec3(0.1, 0.12, 0.16), vec3(0.95, 0.85, 0.4), step(0.5, fract(q.y * 30.0)));
  // floor
  if (q.y < 0.12) col = mix(vec3(0.18, 0.16, 0.15), vec3(0.24, 0.22, 0.2), step(0.5, fract(q.x * 8.0)));
  // brazier + flame
  vec2 fb = vec2(asp * 0.5, 0.14);
  vec2 d = q - fb;
  if (abs(d.x) < 0.11 && d.y < 0.0 && d.y > -0.05) col = vec3(0.12, 0.11, 0.1);
  float fl = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 c = fb + vec2(sin(u_time * (3.0 + fi) + fi * 2.0) * 0.015 + (fi - 1.5) * 0.03, 0.05 + 0.02 * sin(u_time * 5.0 + fi));
    vec2 e = (q - c) * vec2(1.0, 0.55);
    fl += smoothstep(0.06, 0.0, length(e));
  }
  fl = clamp(fl, 0.0, 1.0);
  col = mix(col, mix(vec3(1.0, 0.35, 0.05), vec3(1.0, 0.9, 0.5), fl * fl), fl);
  gl_FragColor = vec4(col, 1.0);
}`;
    const DIST_FS = `precision highp float; varying vec2 v_uv;
uniform sampler2D u_scene; uniform sampler2D u_noise;
uniform vec2 u_res; uniform float u_time; uniform float u_str; uniform float u_scale; uniform float u_speed;
uniform float u_mask; uniform float u_chroma; uniform float u_debug; uniform float u_on;
uniform vec4 u_ring[4]; uniform float u_shock;
void main(){
  float asp = u_res.x / u_res.y;
  vec2 q = vec2(v_uv.x * asp, v_uv.y);
  vec2 off = vec2(0.0);
  if (u_on > 0.5) {
    vec2 nq = q * u_scale;
    vec2 n = texture2D(u_noise, nq * 0.25 - vec2(0.0, u_time * u_speed * 0.5)).rg * 2.0 - 1.0;
    n += (texture2D(u_noise, nq * 0.5 + vec2(0.37, 0.11) - vec2(0.0, u_time * u_speed)).rg * 2.0 - 1.0) * 0.5;
    float m = 1.0;
    if (u_mask > 0.5) {
      vec2 d = q - vec2(asp * 0.5, 0.16);
      float w = 0.05 + max(d.y, 0.0) * 0.45;
      m = exp(-(d.x * d.x) / (w * w)) * smoothstep(-0.04, 0.04, d.y) * (1.0 - smoothstep(0.25, 0.8, d.y));
    }
    off = n * m * u_str / u_res.y;
    for (int i = 0; i < 4; i++) {
      vec4 r = u_ring[i];
      if (r.w <= 0.0) continue;
      vec2 d = q - r.xy;
      float len = length(d);
      float k = (len - r.z) / 0.035;
      float prof = exp(-k * k) * r.w;
      off += (len > 0.0001 ? d / len : vec2(0.0)) * prof * u_shock / u_res.y;
    }
  }
  vec2 o = vec2(off.x / asp, off.y);
  if (u_debug > 0.5) { gl_FragColor = vec4(0.5 + o.x * u_res.x / 40.0, 0.5 + o.y * u_res.y / 40.0, 0.5, 1.0); return; }
  vec3 col;
  if (u_chroma > 0.5) {
    col.r = texture2D(u_scene, v_uv + o * 1.25).r;
    col.g = texture2D(u_scene, v_uv + o).g;
    col.b = texture2D(u_scene, v_uv + o * 0.75).b;
  } else col = texture2D(u_scene, v_uv + o).rgb;
  gl_FragColor = vec4(col, 1.0);
}`;
    const sceneProg = U.gl.program(gl, VS, SCENE_FS), distProg = U.gl.program(gl, VS, DIST_FS);
    const quad = U.gl.quad(gl);
    let fb = null, t = 0, nextShock = 0.8;
    const rings = [];
    const rng = ctx.rng;
    const spawn = (x, y) => { rings.push({ x, y, age: 0 }); if (rings.length > 4) rings.shift(); };

    return {
      update(dt) {
        t += dt;
        const W = ctx.width, H = ctx.height, asp = W / H;
        if (P.autoShock && t >= nextShock) { spawn(rng.range(0.2, 0.8) * asp, rng.range(0.35, 0.8)); nextShock = t + 2.2; }
        const m = ctx.input.mouse;
        if (m.pressed && m.inside) spawn((m.x / W) * asp, 1 - m.y / H);
        for (const r of rings) r.age += dt;
        while (rings.length && rings[0].age > 1.6) rings.shift();
      },
      render() {
        const pw = ctx.pixelWidth, ph = ctx.pixelHeight;
        if (!fb || fb.width !== pw || fb.height !== ph) { if (fb) fb.dispose(); fb = U.gl.framebuffer(gl, pw, ph); }
        gl.disable(gl.BLEND);
        fb.bind();
        sceneProg.use();
        gl.uniform2f(sceneProg.u('u_res'), pw, ph);
        gl.uniform1f(sceneProg.u('u_time'), t);
        quad.draw(sceneProg);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, pw, ph);
        distProg.use();
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fb.tex);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, noiseTex);
        gl.uniform1i(distProg.u('u_scene'), 0); gl.uniform1i(distProg.u('u_noise'), 1);
        gl.uniform2f(distProg.u('u_res'), pw, ph);
        gl.uniform1f(distProg.u('u_time'), t);
        gl.uniform1f(distProg.u('u_str'), P.strength * ctx.pixelRatio);
        gl.uniform1f(distProg.u('u_scale'), P.scale);
        gl.uniform1f(distProg.u('u_speed'), P.speed);
        gl.uniform1f(distProg.u('u_mask'), P.mask ? 1 : 0);
        gl.uniform1f(distProg.u('u_chroma'), P.chroma ? 1 : 0);
        gl.uniform1f(distProg.u('u_debug'), P.on ? P.debug : 0);
        gl.uniform1f(distProg.u('u_on'), P.on ? 1 : 0);
        gl.uniform1f(distProg.u('u_shock'), P.shock * ctx.pixelRatio);
        const ru = new Float32Array(16);
        rings.forEach((r, i) => { const k = r.age / 1.6; ru[i * 4] = r.x; ru[i * 4 + 1] = r.y; ru[i * 4 + 2] = 0.02 + k * 0.6; ru[i * 4 + 3] = (1 - k) * (1 - k); });
        gl.uniform4fv(distProg.u('u_ring'), ru);
        quad.draw(distProg);
        gl.activeTexture(gl.TEXTURE0);

        const reads = P.on ? (P.chroma ? 3 : 1) + 2 : 1;
        ctx.stat(GTL.L('렌더 패스', 'Render passes'), 2);
        ctx.stat(GTL.L('텍스처 읽기/픽셀', 'Texture reads/pixel'), reads);
        ctx.stat(GTL.L('최대 오프셋', 'Max offset'), P.on ? `${(P.strength * 1.5).toFixed(1)} px` : '0 px');
        ctx.stat(GTL.L('활성 충격파', 'Active shock waves'), P.on ? rings.length : 0);
      },
    };
  },
});
