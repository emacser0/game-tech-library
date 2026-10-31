// 깊이 버퍼 정밀도 & Z-파이팅: near 평면, 깊이 포맷, Reversed-Z, 로그 깊이
GTL.register({
  id: 'depth-precision',
  title: '깊이 정밀도 & Z-파이팅 (Reversed-Z, 로그 깊이)',
  summary: '원근 깊이는 near 근처에 정밀도가 몰려, 먼 곳의 가까운 두 면이 깜빡임(Z-파이팅). near 평면 키우기, float 깊이 + Reversed-Z, 로그 깊이로 해결 가능.',
  renderer: 'webgl2',
  views: { a: '표준 깊이, 24bit', b: 'Reversed-Z, float32' },
  controls: '마우스 드래그: 시선 회전, 휠: 시야각',
  info: `
    <p><b>Z-파이팅(z-fighting)</b>: 깊이 버퍼가 가까운 두 면을 구분하지 못해 화면이 얼룩지고 깜빡이는 현상</p>
    <p>원인: 표준 투영의 깊이값 <code>d = f/(f−n) − f*n/((f−n)*w)</code>는 <b>1/w에 선형</b>. 그래서 깊이 값의 절반 이상이 near~2*near 사이에 쓰임.</p>
    <ul>
      <li>멀리서는 깊이 한 칸(quantum)이 덮는 거리 <code>Δw ≈ w²/(n * 2^bits)</code>가 폭발적으로 커짐</li>
      <li>두 면의 간격이 Δw보다 작으면 래스터화마다 앞에 그려지는 면이 바뀜</li>
      <li>가장 효과적인 대책은 <b>near 평면을 멀리</b> 두기. far는 거의 영향 없음.</li>
    </ul>
    <p><b>Reversed-Z</b>: near→1, far→0으로 뒤집어 저장. 0 근처에 촘촘한 <b>부동소수점</b> 분포가 1/w 분포를 상쇄. 그래서 거의 일정한 상대 정밀도를 얻음.</p>
    <p>단점: 고정소수점(24bit)에서는 이득이 없어 <b>float 깊이 버퍼</b> 필요. WebGL에는 clip control이 없어 이 샘플은 <code>gl_FragDepth = near / w</code>로 직접 씀.</p>
    <p><b>로그 깊이</b>: <code>log2(1+w)/log2(1+far)</code>를 씀. 어떤 포맷에서도 넓은 범위를 다룸. 단점: gl_FragDepth를 쓰면 early-Z가 꺼지는 비용이 생김.</p>
    <p>"정밀도 히트맵"은 픽셀마다 깊이 한 칸의 거리 Δw를 두 면 간격과 비교. 초록(안전) → 빨강(Z-파이팅)으로 표시.</p>`,
  // 도식: 거리별 깊이 정밀도. Δw가 면 간격을 넘는 지점부터 Z-파이팅
  diagram: (L) => `<svg viewBox="0 0 540 170" xmlns="http://www.w3.org/2000/svg">
    <text x="40" y="16" class="t-small t-dim">${L('깊이 한 칸이 덮는 거리 Δw', 'Distance covered by one depth step Δw')}</text>
    <line x1="40" y1="150" x2="340" y2="150" class="d-dim"/>
    <line x1="40" y1="150" x2="40" y2="25" class="d-dim"/>
    <polyline points="40.0,150.0 47.5,149.9 55.0,149.7 62.5,149.3 70.0,148.8 77.5,148.0 85.0,147.2 92.5,146.2 100.0,145.0 107.5,143.7 115.0,142.2 122.5,140.5 130.0,138.8 137.5,136.8 145.0,134.7 152.5,132.4 160.0,130.0 167.5,127.4 175.0,124.7 182.5,121.8 190.0,118.8 197.5,115.5 205.0,112.2 212.5,108.7 220.0,105.0 227.5,101.2 235.0,97.2 242.5,93.0 250.0,88.8 257.5,84.3 265.0,79.7 272.5,74.9 280.0,70.0 287.5,64.9 295.0,59.7 302.5,54.3 310.0,48.8 317.5,43.0 325.0,37.2 332.5,31.2 340.0,25.0" class="d-a"/>
    <polyline points="40.0,150.0 47.5,149.4 55.0,148.9 62.5,148.3 70.0,147.8 77.5,147.2 85.0,146.6 92.5,146.1 100.0,145.5 107.5,144.9 115.0,144.4 122.5,143.8 130.0,143.2 137.5,142.7 145.0,142.1 152.5,141.6 160.0,141.0 167.5,140.4 175.0,139.9 182.5,139.3 190.0,138.8 197.5,138.2 205.0,137.6 212.5,137.1 220.0,136.5 227.5,135.9 235.0,135.4 242.5,134.8 250.0,134.2 257.5,133.7 265.0,133.1 272.5,132.6 280.0,132.0 287.5,131.4 295.0,130.9 302.5,130.3 310.0,129.8 317.5,129.2 325.0,128.6 332.5,128.1 340.0,127.5" class="d-b"/>
    <line x1="40" y1="112.5" x2="340" y2="112.5" class="d-bad" stroke-dasharray="4 3"/>
    <line x1="204.317" y1="112.5" x2="204.317" y2="150" class="d-dim" stroke-dasharray="2 2"/>
    <text x="340" y="164" text-anchor="end" class="t-small t-dim">${L('거리 w (far)', 'distance w (far)')}</text>
    <text x="42" y="164" class="t-small t-dim">${L('near', 'near')}</text>
    <text x="336" y="107.5" text-anchor="end" class="t-small">${L('두 면 간격', 'gap between faces')}</text>
    <text x="208.317" y="144" class="t-small t-a">${L('여기부터 Z-파이팅', 'z-fighting from here')}</text>
    <text x="360" y="40" class="t-a">${L('A 표준 깊이: Δw ∝ w²', 'A standard: Δw ∝ w²')}</text>
    <text x="360" y="56" class="t-small t-dim">${L('멀수록 급격히 거칠어짐', 'gets coarse fast with distance')}</text>
    <text x="360" y="86" class="t-b">${L('B Reversed-Z + float', 'B Reversed-Z + float')}</text>
    <text x="360" y="102" class="t-small t-dim">${L('Δw ∝ w, 상대 정밀도 일정', 'Δw ∝ w, steady precision')}</text>
    <text x="360" y="132" class="t-small">${L('Δw가 면 간격보다 크면', 'If Δw is bigger than the gap')}</text>
    <text x="360" y="146" class="t-small">${L('앞뒤 면이 번갈아 그려짐', 'the faces swap every frame')}</text>
  </svg>`,
  look: [
    'A에서 원형으로 놓인 패널(거리 2~2500)을 보면 먼 패널일수록 주황과 파랑이 얼룩지며 깜빡임. 바닥 도로 표시도 먼 곳에서 깨짐. B는 모두 깨끗함.',
    'A에서 near를 0.001에서 1로 올리면 Z-파이팅 시작 거리가 크게 멀어짐. far를 바꾸면 거의 변화 없음.',
    'B에서 깊이 포맷만 24bit로 바꾸면 Reversed-Z인데도 Z-파이팅이 다시 생김. float 깊이가 필수.',
    'A를 float32로만 바꾸면(표준 깊이) 거의 나아지지 않음. 1.0 근처 float 정밀도가 24bit와 비슷하기 때문.',
  ],
  refs: [
    { type: 'article', title: 'Depth Precision Visualized (Nathan Reed)', url: 'https://developer.nvidia.com/content/depth-precision-visualized', year: 2015, note: 'NVIDIA Developer Blog. Reversed-Z와 float 깊이의 조합.' },
    { type: 'article', title: 'Logarithmic Depth Buffer (Outerra blog)', url: 'https://outerra.blogspot.com/2009/08/logarithmic-z-buffer.html', year: 2009 },
    { type: 'article', title: 'Learning to Love your Z-buffer (Steve Baker)', url: 'https://www.sjbaker.org/steve/omniv/love_your_z_buffer.html' },
    { type: 'article', title: 'Reversed-Z in OpenGL (Nicolas Guillemot)', url: 'https://nlguillemot.wordpress.com/2016/12/07/reversed-z-in-opengl/', year: 2016, note: 'glClipControl이 필요한 이유' },
  ],
  params: [
    { key: 'mode', label: '깊이 방식', type: 'select', group: '깊이', options: [
      { value: 0, label: '표준 (하드웨어)' },
      { value: 1, label: 'Reversed-Z (near/w)' },
      { value: 2, label: '로그 깊이' },
      { value: 3, label: '선형 (w/far)' },
    ], a: 0, b: 1 },
    { key: 'format', label: '깊이 버퍼 포맷', type: 'select', options: [
      { value: 16, label: '16bit 고정소수점' },
      { value: 24, label: '24bit 고정소수점' },
      { value: 32, label: '32bit float' },
    ], a: 24, b: 32 },
    { key: 'nearExp', label: 'near 평면 (10^x)', type: 'range', min: -3, max: 1, step: 0.1, default: -2 },
    { key: 'farExp', label: 'far 평면 (10^x)', type: 'range', min: 2, max: 5, step: 0.1, default: 4 },
    { key: 'viz', label: '정밀도 히트맵', type: 'bool', default: false },
    { key: 'gapExp', label: '두 면 간격 (10^x)', type: 'range', min: -3, max: 0, step: 0.05, default: -1.3, shared: true, group: '장면' },
    { key: 'autoRotate', label: '흔들기', type: 'bool', default: true, shared: true, help: '카메라를 살짝 움직여 Z-파이팅 깜빡임을 드러냄' },
  ],
  en: {
    title: 'Depth Precision & Z-Fighting (Reversed-Z, Log Depth)',
    summary: 'Perspective depth puts most of its precision near the near plane. So two close surfaces far away flicker (z-fighting). A larger near plane, float depth with Reversed-Z, or log depth fixes it.',
    views: { a: 'Standard depth, 24bit', b: 'Reversed-Z, float32' },
    controls: 'Mouse drag: look around. Wheel: field of view.',
    info: `
    <p><b>Z-fighting</b>: the depth buffer cannot tell two close surfaces apart, so the picture gets blotchy and flickers.</p>
    <p>Cause: the standard projection depth <code>d = f/(f−n) − f*n/((f−n)*w)</code> is <b>linear in 1/w</b>. So more than half of the depth values go to the range near~2*near.</p>
    <ul>
      <li>Far away, the distance one depth step (quantum) covers, <code>Δw ≈ w²/(n * 2^bits)</code>, grows very fast.</li>
      <li>If the gap between two surfaces is smaller than Δw, the surface in front changes from one rasterization to the next.</li>
      <li>The best fix is to <b>move the near plane out</b>. The far plane has almost no effect.</li>
    </ul>
    <p><b>Reversed-Z</b>: store near as 1 and far as 0. <b>Floating point</b> values are dense near 0, and this cancels out the 1/w spread. The result is almost constant relative precision.</p>
    <p>Downside: fixed point (24bit) gains nothing, so you need a <b>float depth buffer</b>. WebGL has no clip control, so this sample writes <code>gl_FragDepth = near / w</code> by hand.</p>
    <p><b>Log depth</b>: uses <code>log2(1+w)/log2(1+far)</code>. It covers a wide range in any format. Downside: writing gl_FragDepth turns off early-Z, which costs performance.</p>
    <p>The "Precision heatmap" compares the distance of one depth step, Δw, with the gap between the two surfaces at each pixel. It goes from green (safe) to red (z-fighting).</p>`,
    look: [
      'In A, look at the panels placed in a circle (distance 2~2500). The farther the panel, the more orange and blue blotch and flicker. The road stripe on the floor also breaks up in the distance. B is clean everywhere.',
      'In A, raise near from 0.001 to 1. Z-fighting starts much farther away. Changing far does almost nothing.',
      'In B, change only the depth format to 24bit. Z-fighting comes back even with Reversed-Z. Float depth is a must.',
      'In A, change only the format to float32 (standard depth). It barely helps, because float precision near 1.0 is close to 24bit.',
    ],
    refs: ['NVIDIA Developer Blog. Combining Reversed-Z with float depth.', null, null, 'Why you need glClipControl.'],
    params: {
      mode: { label: 'Depth mode', group: 'Depth', options: { 0: 'Standard (hardware)', 2: 'Log depth', 3: 'Linear (w/far)' } },
      format: { label: 'Depth buffer format', options: { 16: '16bit fixed point', 24: '24bit fixed point' } },
      nearExp: 'Near plane (10^x)',
      farExp: 'Far plane (10^x)',
      viz: 'Precision heatmap',
      gapExp: { label: 'Gap between surfaces (10^x)', group: 'Scene' },
      autoRotate: { label: 'Sway', help: 'Moves the camera a little to reveal z-fighting flicker' },
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params, G = U.geometry;
    const plane = G.upload(gl, G.plane(1, 1, 1));

    const vs = `#version 300 es
      in vec3 a_position;
      uniform mat4 u_vp; uniform mat4 u_world;
      out float v_w; out vec2 v_uv;
      void main(){
        vec4 cp = u_vp * (u_world * vec4(a_position, 1.0));
        v_w = cp.w; v_uv = a_position.xz + 0.5;
        gl_Position = cp;
      }`;
    const fs = `#version 300 es
      precision highp float;
      uniform float u_mode; uniform float u_near; uniform float u_far; uniform float u_bits; uniform float u_gap; uniform float u_viz;
      uniform vec3 u_color; uniform float u_grid;
      in float v_w; in vec2 v_uv;
      out vec4 o_color;
      float depthAt(float w) {
        if (u_mode < 0.5) return u_far / (u_far - u_near) - u_far * u_near / ((u_far - u_near) * w);
        if (u_mode < 1.5) return u_near / w;
        if (u_mode < 2.5) return log2(1.0 + w) / log2(1.0 + u_far);
        return w / u_far;
      }
      float slopeAt(float w) {
        if (u_mode < 0.5) return u_far * u_near / ((u_far - u_near) * w * w);
        if (u_mode < 1.5) return u_near / (w * w);
        if (u_mode < 2.5) return 1.0 / ((1.0 + w) * 0.6931472 * log2(1.0 + u_far));
        return 1.0 / u_far;
      }
      void main(){
        float w = v_w;
        float d = u_mode < 0.5 ? gl_FragCoord.z : depthAt(w);
        gl_FragDepth = clamp(d, 0.0, 1.0);
        vec3 c = u_color;
        if (u_grid > 0.5) {
          vec2 g = abs(fract(v_uv * 400.0) - 0.5);
          c *= step(max(g.x, g.y), 0.46) * 0.25 + 0.75;
        }
        if (u_viz > 0.5) {
          float dd = max(depthAt(w), 1e-30);
          float q = u_bits > 30.0 ? exp2(floor(log2(dd)) - 23.0) : 1.0 / (exp2(u_bits) - 1.0);
          float dw = q / max(slopeAt(w), 1e-30);
          float r = log2(dw / u_gap) * 0.30103;
          vec3 h = r < 0.0 ? mix(vec3(0.1, 0.8, 0.3), vec3(0.95, 0.85, 0.2), clamp(r + 2.0, 0.0, 2.0) * 0.5) : mix(vec3(0.95, 0.85, 0.2), vec3(1.0, 0.15, 0.2), clamp(r * 2.0, 0.0, 1.0));
          c = mix(c, h, 0.75);
        }
        o_color = vec4(c, 1.0);
      }`;
    const prog = U.gl.program(gl, vs, fs);
    const blit = U.gl.program(gl, `#version 300 es
      in vec2 a_pos; out vec2 v_uv;
      void main(){ v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`, `#version 300 es
      precision mediump float; uniform sampler2D u_tex; in vec2 v_uv; out vec4 o_color;
      void main(){ o_color = texture(u_tex, v_uv); }`);
    const quad = U.gl.quad(gl);

    // 선택한 깊이 포맷의 렌더 타겟
    let fbo = null, fboKey = '';
    function ensureTarget(w, h, bits) {
      const key = `${w}x${h}:${bits}`;
      if (fbo && fboKey === key) return;
      if (fbo) { gl.deleteFramebuffer(fbo.fb); gl.deleteTexture(fbo.tex); gl.deleteRenderbuffer(fbo.depth); }
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const depth = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, bits === 16 ? gl.DEPTH_COMPONENT16 : bits === 24 ? gl.DEPTH_COMPONENT24 : gl.DEPTH_COMPONENT32F, w, h);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
      const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      fbo = { fb, tex, depth, ok }; fboKey = key;
    }

    const DIST = [2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500];
    const cam = { yaw: 0, pitch: 0, fov: 55, drag: false, lx: 0, ly: 0 };
    let t = 0;
    // 해석적 Z-파이팅 시작 거리: Δw(w) > gap 이 되는 최소 w
    function firstFight(mode, bits, n, f, gap) {
      for (let w = 0.1; w < f; w *= 1.05) {
        let d, s;
        if (mode === 0) { d = f / (f - n) - f * n / ((f - n) * w); s = f * n / ((f - n) * w * w); }
        else if (mode === 1) { d = n / w; s = n / (w * w); }
        else if (mode === 2) { d = Math.log2(1 + w) / Math.log2(1 + f); s = 1 / ((1 + w) * Math.LN2 * Math.log2(1 + f)); }
        else { d = w / f; s = 1 / f; }
        if (w < n) continue;
        const q = bits === 32 ? Math.pow(2, Math.floor(Math.log2(Math.max(d, 1e-30))) - 23) : 1 / (Math.pow(2, bits) - 1);
        if (q / s > gap) return w;
      }
      return null;
    }

    return {
      update(dt) {
        t += dt;
        if (ctx.input.mouse.wheel) cam.fov = U.clamp(cam.fov + ctx.input.mouse.wheel * 4, 10, 100);
      },
      onPointer(type, m) {
        if (type === 'down') { cam.drag = true; cam.lx = m.x; cam.ly = m.y; }
        else if (type === 'up' || type === 'leave') cam.drag = false;
        else if (type === 'move' && cam.drag) {
          cam.yaw -= (m.x - cam.lx) * 0.004; cam.pitch = U.clamp(cam.pitch - (m.y - cam.ly) * 0.004, -0.6, 0.6);
          cam.lx = m.x; cam.ly = m.y;
        }
      },
      render() {
        const W = ctx.pixelWidth, H = ctx.pixelHeight, bits = +P.format, mode = +P.mode;
        ensureTarget(W, H, bits);
        const near = Math.pow(10, P.nearExp), far = Math.pow(10, P.farExp), gap = Math.pow(10, P.gapExp);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.fb);
        gl.viewport(0, 0, W, H);
        gl.clearColor(0.08, 0.09, 0.12, 1);
        gl.clearDepth(mode === 1 ? 0 : 1);
        gl.depthFunc(mode === 1 ? gl.GREATER : gl.LESS);
        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const sway = P.autoRotate ? Math.sin(t * 0.9) * 0.004 : 0;
        const yaw = cam.yaw + sway, pitch = cam.pitch + (P.autoRotate ? Math.cos(t * 0.7) * 0.002 : 0);
        const eye = [0, 0, 0];
        const dir = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
        const proj = M.perspective(U.rad(cam.fov), ctx.width / ctx.height, near, far);
        const vp = M.multiply(proj, M.lookAt(eye, dir));
        prog.use();
        gl.uniformMatrix4fv(prog.u('u_vp'), false, vp);
        gl.uniform1f(prog.u('u_mode'), mode);
        gl.uniform1f(prog.u('u_near'), near);
        gl.uniform1f(prog.u('u_far'), far);
        gl.uniform1f(prog.u('u_bits'), bits);
        gl.uniform1f(prog.u('u_gap'), gap);
        gl.uniform1f(prog.u('u_viz'), P.viz ? 1 : 0);
        const uW = prog.u('u_world'), uC = prog.u('u_color'), uG = prog.u('u_grid');
        const draw = (world, color, grid) => { gl.uniformMatrix4fv(uW, false, world); gl.uniform3fv(uC, color); gl.uniform1f(uG, grid); plane.draw(prog); };

        // 바닥 + 그 위 gap 만큼 띄운 도로(데칼) 띠
        const ground = -1.6;
        draw(M.mul(M.translation(0, ground, -far * 0.5), M.scaling(far * 2, 1, far)), [0.3, 0.32, 0.35], 1);
        draw(M.mul(M.translation(0, ground + gap, -far * 0.5), M.scaling(1.2, 1, far)), [0.85, 0.8, 0.35], 0);
        // 원형으로 배치한 패널: 앞면(주황)과 gap 뒤의 큰 뒷면(파랑)
        DIST.forEach((d, i) => {
          if (d > far) return;
          const a = (i / DIST.length) * U.TAU + Math.PI / 2, r = 0.24 * d, s = 0.13 * d;
          const x = Math.cos(a) * r, y = Math.sin(a) * r;
          const face = (z, sc) => M.mul(M.translation(x, y, -z), M.rotationX(Math.PI / 2), M.scaling(sc, 1, sc));
          draw(face(d + gap, s * 1.25), [0.25, 0.5, 0.95], 0);
          draw(face(d, s), [1.0, 0.5, 0.2], 0);
        });

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, W, H);
        gl.disable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS); gl.clearDepth(1);
        blit.use();
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fbo.tex); gl.uniform1i(blit.u('u_tex'), 0);
        quad.draw(blit);

        const ff = firstFight(mode, bits, near, far, gap);
        ctx.stat('near / far', `${near.toPrecision(2)} / ${Math.round(far)}`);
        ctx.stat(GTL.L('두 면 간격', 'Surface gap'), gap.toPrecision(2));
        ctx.stat(GTL.L('Z-파이팅 시작(이론)', 'Z-fighting starts (theory)'), ff == null ? GTL.L('far까지 없음', 'None up to far') : '≈ ' + ff.toPrecision(3));
        ctx.stat(GTL.L('패널 거리', 'Panel distances'), GTL.L('위에서 반시계: ', 'Counterclockwise from top: ') + DIST.filter((d) => d <= far).join(', '));
        if (!fbo.ok) ctx.stat(GTL.L('깊이 포맷', 'Depth format'), GTL.L('미지원 (FBO 불완전)', 'Not supported (incomplete FBO)'));
      },
    };
  },
});
