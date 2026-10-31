// 오버드로 시각화: 백페이스 컬링, 앞→뒤 정렬, Z-프리패스
GTL.register({
  id: 'overdraw',
  title: '오버드로 줄이기 (백페이스 컬링, 정렬, Z-프리패스)',
  summary: '같은 픽셀을 여러 번 셰이딩하는 오버드로는 픽셀 셰이더 비용을 몇 배로 늘림. 뒷면을 버리고 불투명 물체를 앞→뒤로 그리면 깊이 테스트가 뒤쪽 프래그먼트를 미리 걸러냄.',
  renderer: 'webgl',
  views: { a: '뒤→앞, 컬링 없음', b: '앞→뒤 + 백페이스 컬링' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌',
  info: `
    <p><b>오버드로(overdraw)</b>: 한 픽셀을 여러 번 셰이딩하는 낭비. 화면에는 보이지 않지만 픽셀 셰이더 비용이 그만큼 늘어남.</p>
    <p>히트맵은 픽셀마다 <b>깊이 테스트를 통과해 셰이딩된 프래그먼트 수</b>를 보여줌. 가산 블렌딩으로 1/255씩 더해 정확히 셈.</p>
    <ul>
      <li><span style="color:#3c64d2">파랑</span>: 1회</li>
      <li><span style="color:#66d17a">초록</span>: 2회</li>
      <li><span style="color:#ffcb6b">노랑</span>: 4회</li>
      <li><span style="color:#ff5370">빨강</span>: 8회</li>
      <li>흰색: 16회 이상</li>
    </ul>
    <p>오버드로를 줄이는 방법:</p>
    <ul>
      <li><b>백페이스 컬링</b>: 닫힌 메시의 뒷면은 늘 앞면에 가려짐. 래스터화 전에 버려 삼각형과 프래그먼트를 대략 절반으로 줄임.</li>
      <li><b>앞→뒤 정렬</b>: 가까운 물체를 먼저 그림. 뒤 물체의 프래그먼트는 깊이 테스트(early-Z)에서 탈락해 셰이딩되지 않음. 뒤→앞이 최악.</li>
      <li><b>Z-프리패스</b>: 색 없이 깊이만 먼저 그린 뒤 <code>LEQUAL</code>로 다시 그림. 픽셀당 정확히 한 번만 셰이딩. 단점: 정점 처리는 2배.</li>
    </ul>
    <p>주의: 깊이 테스트를 끄면 반투명 파티클처럼 모든 프래그먼트가 셰이딩됨. 이 오버드로는 정렬로도 못 줄임. 반투명은 오히려 뒤→앞 정렬 <i>필요</i>.</p>`,
  // 도식: 한 픽셀 위에 겹친 물체 3개. 그리는 순서에 따라 셰이딩 횟수가 달라짐
  diagram: (L) => `<svg viewBox="0 0 540 184" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="18" class="t-a">${L('A: 뒤에서 앞으로', 'A: back to front')}</text>
    <circle cx="30" cy="52" r="5" class="f-accent"/>
    <line x1="36" y1="52" x2="500" y2="52" class="d-dim" stroke-dasharray="3 3"/>
    <rect x="138" y="30" width="24" height="44" class="f-dim"/>
    <rect x="268" y="30" width="24" height="44" class="f-dim"/>
    <rect x="398" y="30" width="24" height="44" class="f-dim"/>
    <circle cx="410" cy="52" r="6" class="f-a"/>
    <text x="426" y="40" class="t-small t-mono">1</text>
    <circle cx="280" cy="52" r="6" class="f-a"/>
    <text x="296" y="40" class="t-small t-mono">2</text>
    <circle cx="150" cy="52" r="6" class="f-a"/>
    <text x="166" y="40" class="t-small t-mono">3</text>
    <text x="530" y="56" text-anchor="end" class="t-small t-a">${L('셰이딩 3회', 'shaded 3x')}</text>
    <text x="10" y="98" class="t-b">${L('B: 앞에서 뒤로 (early-Z)', 'B: front to back (early-Z)')}</text>
    <circle cx="30" cy="132" r="5" class="f-accent"/>
    <line x1="36" y1="132" x2="500" y2="132" class="d-dim" stroke-dasharray="3 3"/>
    <rect x="138" y="110" width="24" height="44" class="f-dim"/>
    <rect x="268" y="110" width="24" height="44" class="f-dim"/>
    <rect x="398" y="110" width="24" height="44" class="f-dim"/>
    <circle cx="150" cy="132" r="6" class="f-b"/>
    <text x="166" y="120" class="t-small t-mono">1</text>
    <line x1="274" y1="126" x2="286" y2="138" class="d-bad"/>
    <line x1="274" y1="138" x2="286" y2="126" class="d-bad"/>
    <line x1="404" y1="126" x2="416" y2="138" class="d-bad"/>
    <line x1="404" y1="138" x2="416" y2="126" class="d-bad"/>
    <text x="530" y="136" text-anchor="end" class="t-small t-b">${L('셰이딩 1회', 'shaded 1x')}</text>
    <text x="10" y="176" class="t-small t-dim">${L('한 픽셀을 지나는 시선. X: 깊이 테스트에서 탈락해 셰이더가 안 돎', 'View ray through one pixel. X: fails depth test, shader never runs')}</text>
  </svg>`,
  look: [
    'A의 히트맵을 보면 노랑과 빨강 영역이 넓음. B는 대부분 파랑(1회). 평균 오버드로 수치도 크게 차이 남.',
    'B에서 백페이스 컬링만 끄면 구와 토러스 안쪽 면 때문에 수치가 올라감. 정렬만 "없음"으로 바꿔도 마찬가지.',
    'Z-프리패스를 켜면 정렬과 상관없이 평균이 1.0에 가까워짐',
    '"셰이딩 보기"로 바꾸면 A와 B의 최종 화면이 똑같음. 오버드로는 눈에 보이지 않는 비용.',
  ],
  refs: [
    { type: 'article', title: 'A trip through the Graphics Pipeline 2011, part 7: Z/Stencil processing, 3 ways (Fabian Giesen)', url: 'https://fgiesen.wordpress.com/2011/07/08/a-trip-through-the-graphics-pipeline-2011-part-7/', year: 2011, note: 'Early-Z, Hi-Z 동작' },
    { type: 'engine', title: 'Unreal Engine: Optimization Viewmodes (Shader Complexity / Quad Overdraw)', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/viewport-modes-in-unreal-engine' },
    { type: 'engine', title: 'Unity: Rendering order: opaque front-to-back, transparent back-to-front (Render queue)', url: 'https://docs.unity3d.com/Manual/SL-SubShaderTags.html' },
    { type: 'article', title: 'LearnOpenGL: Face culling', url: 'https://learnopengl.com/Advanced-OpenGL/Face-culling' },
  ],
  params: [
    { key: 'sort', label: '그리기 순서', type: 'select', group: '최적화', options: [
      { value: 'none', label: '정렬 없음 (생성 순서)' },
      { value: 'b2f', label: '뒤 → 앞' },
      { value: 'f2b', label: '앞 → 뒤' },
    ], a: 'b2f', b: 'f2b' },
    { key: 'cull', label: '백페이스 컬링', type: 'bool', a: false, b: true },
    { key: 'prepass', label: 'Z-프리패스', type: 'bool', default: false },
    { key: 'depthTest', label: '깊이 테스트', type: 'bool', default: true, help: '끄면 파티클처럼 모든 프래그먼트가 셰이딩됨' },
    { key: 'view', label: '보기', type: 'select', options: [
      { value: 'heat', label: '오버드로 히트맵' },
      { value: 'shaded', label: '셰이딩 보기' },
    ], default: 'heat' },
    { key: 'count', label: '물체 수', type: 'int', min: 20, max: 1000, step: 10, default: 300, shared: true, reset: true, group: '장면' },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Reducing Overdraw (Backface Culling, Sorting, Z-Prepass)',
    summary: 'Overdraw shades the same pixel many times and multiplies pixel shader cost. Drop back faces and draw opaque objects front to back. Then the depth test rejects hidden fragments early.',
    views: { a: 'Back to front, no culling', b: 'Front to back + backface culling' },
    controls: 'Mouse drag: rotate camera. Wheel: zoom.',
    info: `
    <p><b>Overdraw</b>: wasted work from shading one pixel many times. You cannot see it on screen, but pixel shader cost goes up by that much.</p>
    <p>The heatmap shows, per pixel, <b>how many fragments passed the depth test and got shaded</b>. Additive blending adds 1/255 each time, so the count is exact.</p>
    <ul>
      <li><span style="color:#3c64d2">Blue</span>: 1 time</li>
      <li><span style="color:#66d17a">Green</span>: 2 times</li>
      <li><span style="color:#ffcb6b">Yellow</span>: 4 times</li>
      <li><span style="color:#ff5370">Red</span>: 8 times</li>
      <li>White: 16 times or more</li>
    </ul>
    <p>Ways to reduce overdraw:</p>
    <ul>
      <li><b>Backface culling</b>: the back faces of a closed mesh are always hidden by its front faces. Dropping them before rasterization cuts triangles and fragments by about half.</li>
      <li><b>Front to back sorting</b>: draw near objects first. Fragments of objects behind them fail the depth test (early-Z) and are not shaded. Back to front is the worst case.</li>
      <li><b>Z-prepass</b>: draw only depth first, with no color, then draw again with <code>LEQUAL</code>. Each pixel is shaded exactly once. Downside: vertex work doubles.</li>
    </ul>
    <p>Note: with the depth test off, every fragment is shaded, like with transparent particles. Sorting cannot reduce this overdraw. Transparent objects actually <i>need</i> back to front sorting.</p>`,
    look: [
      'Look at the heatmap in A. Yellow and red areas are large. B is mostly blue (1 time). The average overdraw numbers also differ a lot.',
      'In B, turn off only backface culling. The inner faces of spheres and tori push the number up. Setting only the order to "No sorting" does the same.',
      'Turn on Z-prepass. The average gets close to 1.0 no matter the order.',
      'Switch to "Shaded view". A and B look exactly the same. Overdraw is a cost you cannot see.',
    ],
    refs: ['How Early-Z and Hi-Z work.', null, null, null],
    params: {
      sort: { label: 'Draw order', group: 'Optimization', options: { none: 'No sorting (creation order)', b2f: 'Back to front', f2b: 'Front to back' } },
      cull: 'Backface culling',
      prepass: 'Z-prepass',
      depthTest: { label: 'Depth test', help: 'When off, every fragment is shaded, like particles' },
      view: { label: 'View', options: { heat: 'Overdraw heatmap', shaded: 'Shaded view' } },
      count: { label: 'Object count', group: 'Scene' },
      autoRotate: 'Auto rotate',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params, G = U.geometry;
    const torusG = G.torus(0.6, 0.25, 32, 16);
    const meshes = [G.upload(gl, G.sphere(0.7, 24, 12)), G.upload(gl, G.cube(1.1)), G.upload(gl, torusG)];
    const rng = U.rng(ctx.seed * 5 + 9);
    const objs = [];
    for (let i = 0; i < P.count; i++) {
      const p = [rng.range(-6, 6), rng.range(-3, 3), rng.range(-6, 6)];
      const w = M.mul(M.translation(...p), M.rotationY(rng.range(0, U.TAU)), M.rotationX(rng.range(0, U.TAU)), M.scaling(rng.range(0.5, 1.3)));
      objs.push({ p, w, n: M.normalMatrix(w), m: rng.int(0, 2), c: U.hexToRgb01(rng.pick(U.colors.series)), d: 0 });
    }

    const VS = `
      attribute vec3 a_position; attribute vec3 a_normal;
      uniform mat4 u_vp; uniform mat4 u_world; uniform mat3 u_nmat;
      varying vec3 v_n;
      void main(){ v_n = u_nmat * a_normal; gl_Position = u_vp * u_world * vec4(a_position, 1.0); }`;
    const countProg = U.gl.program(gl, VS, `
      precision mediump float; varying vec3 v_n;
      void main(){ gl_FragColor = vec4(1.0 / 255.0, 0.0, 0.0, 1.0); }`);
    const shadeProg = U.gl.program(gl, VS, `
      precision mediump float; uniform vec3 u_color; varying vec3 v_n;
      void main(){
        vec3 N = normalize(v_n);
        if (!gl_FrontFacing) N = -N;
        float l = max(dot(N, normalize(vec3(0.4, 0.8, 0.5))), 0.0) * 0.8 + 0.2;
        gl_FragColor = vec4(pow(u_color * l, vec3(0.9)), 1.0);
      }`);
    const heatProg = U.gl.program(gl, U.gl.QUAD_VS, `
      precision mediump float; uniform sampler2D u_tex; varying vec2 v_uv;
      void main(){
        float n = floor(texture2D(u_tex, v_uv).r * 255.0 + 0.5);
        vec3 c = vec3(0.04, 0.045, 0.06);
        if (n > 0.5) {
          float t = clamp(log2(n) / 4.0, 0.0, 1.0) * 4.0;
          vec3 c0 = vec3(0.24, 0.39, 0.82), c1 = vec3(0.4, 0.82, 0.48), c2 = vec3(1.0, 0.8, 0.42), c3 = vec3(1.0, 0.33, 0.44), c4 = vec3(1.0);
          c = t < 1.0 ? mix(c0, c1, t) : t < 2.0 ? mix(c1, c2, t - 1.0) : t < 3.0 ? mix(c2, c3, t - 2.0) : mix(c3, c4, t - 3.0);
        }
        gl_FragColor = vec4(c, 1.0);
      }`);
    const quad = U.gl.quad(gl);

    let fb = null, fbW = 0, fbH = 0, pixels = null;
    let avg = 0, maxN = 0, covered = 0;
    const cam = { yaw: 0.5, pitch: 0.3, dist: 15, drag: false, lx: 0, ly: 0 };

    function drawScene(prog, vp, eye, withColor) {
      // 정렬
      for (const o of objs) o.d = (o.p[0] - eye[0]) ** 2 + (o.p[1] - eye[1]) ** 2 + (o.p[2] - eye[2]) ** 2;
      let list = objs;
      if (P.sort === 'f2b') list = objs.slice().sort((a, b) => a.d - b.d);
      else if (P.sort === 'b2f') list = objs.slice().sort((a, b) => b.d - a.d);
      prog.use();
      gl.uniformMatrix4fv(prog.u('u_vp'), false, vp);
      for (const o of list) {
        gl.uniformMatrix4fv(prog.u('u_world'), false, o.w);
        gl.uniformMatrix3fv(prog.u('u_nmat'), false, o.n);
        if (withColor) gl.uniform3fv(prog.u('u_color'), o.c);
        meshes[o.m].draw(prog);
      }
    }
    function pass(prog, vp, eye, withColor, counting) {
      if (P.cull) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);
      if (P.depthTest) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);
      if (P.depthTest && P.prepass) {
        gl.colorMask(false, false, false, false);
        gl.depthMask(true); gl.depthFunc(gl.LESS);
        gl.disable(gl.BLEND);
        drawScene(prog, vp, eye, false);
        gl.colorMask(true, true, true, true);
        gl.depthMask(false); gl.depthFunc(gl.LEQUAL);
      } else { gl.depthMask(true); gl.depthFunc(gl.LESS); }
      if (counting) { gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); } else gl.disable(gl.BLEND);
      drawScene(prog, vp, eye, withColor);
      gl.disable(gl.BLEND);
      gl.depthMask(true); gl.depthFunc(gl.LESS);
    }

    return {
      update(dt) {
        if (P.autoRotate && !cam.drag) cam.yaw += dt * 0.15;
        if (ctx.input.mouse.wheel) cam.dist = U.clamp(cam.dist * Math.pow(1.12, ctx.input.mouse.wheel), 4, 40);
      },
      onPointer(type, m) {
        if (type === 'down') { cam.drag = true; cam.lx = m.x; cam.ly = m.y; }
        else if (type === 'up' || type === 'leave') cam.drag = false;
        else if (type === 'move' && cam.drag) {
          cam.yaw -= (m.x - cam.lx) * 0.008; cam.pitch = U.clamp(cam.pitch + (m.y - cam.ly) * 0.008, -1.4, 1.4);
          cam.lx = m.x; cam.ly = m.y;
        }
      },
      render() {
        const w = Math.max(1, Math.ceil(ctx.pixelWidth / 2)), h = Math.max(1, Math.ceil(ctx.pixelHeight / 2));
        if (!fb || fbW !== w || fbH !== h) { if (fb) fb.dispose(); fb = U.gl.framebuffer(gl, w, h, { depth: true, filter: 'nearest' }); fbW = w; fbH = h; pixels = new Uint8Array(w * h * 4); }
        const proj = M.perspective(U.rad(50), ctx.width / ctx.height, 0.1, 100);
        const eye = M.orbitEye([0, 0, 0], cam.yaw, cam.pitch, cam.dist);
        const vp = M.multiply(proj, M.lookAt(eye, [0, 0, 0]));

        // ── 카운트 패스 (절반 해상도) ──
        const t0 = ctx.now();
        fb.bind();
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        pass(countProg, vp, eye, false, true);
        if (ctx.frame % 10 === 0) {
          gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          let sum = 0, cov = 0, mx = 0;
          for (let i = 0; i < pixels.length; i += 4) { const n = pixels[i]; if (n) { sum += n; cov++; if (n > mx) mx = n; } }
          avg = cov ? sum / cov : 0; maxN = mx; covered = cov / (w * h);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);

        if (P.view === 'heat') {
          gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
          heatProg.use();
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fb.tex); gl.uniform1i(heatProg.u('u_tex'), 0);
          quad.draw(heatProg);
        } else {
          gl.clearColor(0.08, 0.09, 0.11, 1);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          pass(shadeProg, vp, eye, true, false);
        }
        const ms = ctx.now() - t0;
        ctx.stat(GTL.L('평균 오버드로 (덮인 픽셀당)', 'Average overdraw (per covered pixel)'), avg.toFixed(2) + '×');
        ctx.stat(GTL.L('최대', 'Max'), maxN >= 255 ? '255+' : maxN);
        ctx.stat(GTL.L('화면 덮인 비율', 'Screen coverage'), (covered * 100).toFixed(0) + '%');
        ctx.stat(GTL.L('드로우 콜', 'Draw calls'), objs.length * (P.prepass && P.depthTest ? 2 : 1));
        ctx.stat(GTL.L('CPU ms (정렬+제출)', 'CPU ms (sort+submit)'), ms.toFixed(2));
      },
    };
  },
});
