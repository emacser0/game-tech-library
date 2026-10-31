// 프러스텀 컬링 + LOD: 드로우 콜과 삼각형 수 비교, 위에서 본 디버그 미니맵
GTL.register({
  id: 'frustum-culling-lod',
  title: '프러스텀 컬링 & LOD',
  summary: '시야(프러스텀) 밖 물체는 그리지 않고, 멀리 있는 물체는 저폴리곤 메시로 바꿈. 같은 화면을 훨씬 적은 드로우 콜과 삼각형으로 그림.',
  renderer: 'webgl',
  views: { a: '컬링, LOD 없음', b: '프러스텀 컬링 + LOD' },
  controls: '마우스 드래그: 시선 회전, 휠: 시야각(FOV)',
  info: `
    <p><b>프러스텀(frustum)</b>은 카메라가 보는 잘린 피라미드 모양의 공간. <b>프러스텀 컬링</b>은 이 공간 밖의 물체를 GPU에 보내지 않는 기법.</p>
    <ul>
      <li>뷰-투영 행렬에서 평면 6개를 바로 뽑아냄(Gribb & Hartmann).</li>
      <li>물체의 <b>경계 구</b>가 한 평면의 바깥에 완전히 있으면 버림.</li>
      <li>물체당 CPU 내적 6번이면 됨. 드로우 콜과 정점 처리량이 시야각 비율만큼 줄어듦.</li>
      <li>실제 엔진은 BVH나 옥트리로 묶어 계층적으로 검사함.</li>
    </ul>
    <p><b>LOD(Level of Detail)</b>는 멀리 있는 물체를 단순한 메시로 바꾸는 기법. 물체의 화면상 크기(투영 반지름)로 LOD0(2304 삼각형) → LOD1(256) → LOD2(48)를 고름.</p>
    <p>먼 물체에 삼각형 수천 개를 쓰면 삼각형이 픽셀보다 많아져 낭비. GPU의 쿼드 단위 셰이딩 효율도 떨어짐.</p>
    <p>단점: LOD가 바뀌는 순간 모양이 튀는 <b>팝핑(popping)</b>이 생김. 디더 페이드나 지오모핑으로 감춤.</p>
    <p>오른쪽 위 미니맵은 위에서 본 장면:</p>
    <ul>
      <li>흰 선: 카메라 프러스텀.</li>
      <li><span style="color:#66d17a">초록/노랑/주황</span>: LOD0/1/2로 그린 물체.</li>
      <li><span style="color:#ff5370">빨강</span>: 컬링된 물체.</li>
    </ul>`,
  // 도식: 위에서 본 프러스텀. 경계 구 검사로 버리는 물체와 거리별 LOD 구간
  diagram: (L) => `<svg viewBox="0 0 540 194" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="100" r="5" class="f-accent"/>
    <text x="30" y="124" class="t-small">${L('카메라', 'camera')}</text>
    <path d="M40,100 L340,20 L340,180 Z" class="d-line"/>
    <path d="M146,70 A110,110 0 0 1 146,130" class="d-dim" stroke-dasharray="3 3"/>
    <path d="M251,41 A220,220 0 0 1 251,159" class="d-dim" stroke-dasharray="3 3"/>
    <text x="118" y="172" class="t-small t-dim">${L('LOD0', 'LOD0')}</text>
    <text x="220" y="186" class="t-small t-dim">${L('LOD1', 'LOD1')}</text>
    <text x="300" y="186" class="t-small t-dim">${L('LOD2', 'LOD2')}</text>
    <circle cx="110" cy="96" r="9" class="f-good"/>
    <circle cx="190" cy="76" r="9" class="f-good"/>
    <circle cx="205" cy="120" r="9" class="f-good"/>
    <circle cx="290" cy="60" r="9" class="f-good"/>
    <circle cx="300" cy="140" r="9" class="f-good"/>
    <circle cx="150" cy="52" r="9" class="f-good"/>
    <circle cx="130" cy="30" r="9" class="f-bad"/>
    <circle cx="220" cy="175" r="9" class="f-bad"/>
    <circle cx="70" cy="160" r="9" class="f-bad"/>
    <text x="360" y="30" class="t-small">${L('초록: 그림 (평면 걸침 포함)', 'Green: drawn (even if crossing)')}</text>
    <text x="360" y="46" class="t-small t-dim">${L('빨강: 경계 구가 한 평면', 'Red: bounding sphere fully')}</text>
    <text x="360" y="60" class="t-small t-dim">${L('바깥에 완전히 있어 버림', 'outside one plane, culled')}</text>
    <text x="360" y="86" class="t-mono t-small">dot(n, c) + d &lt; -r</text>
    <text x="360" y="128" class="t-small">${L('점선 호: LOD 전환 경계', 'Dashed arcs: LOD switch')}</text>
    <text x="360" y="142" class="t-small t-dim">${L('멀수록 단순한 메시', 'Farther gets simpler mesh')}</text>
  </svg>`,
  look: [
    'A와 B의 메인 화면을 비교하면 거의 같지만 B의 드로우 콜과 삼각형 수는 몇 분의 일로 줄어듦.',
    '휠로 시야각을 넓히면 컬링되는 물체(미니맵의 빨강)가 줄고 드로우 콜이 늘어남.',
    '"LOD 색 표시"를 켜면 거리별 LOD 단계가 색으로 보임. LOD 바이어스를 낮추면 저폴리곤 구가 각져 보이기 시작함(팝핑).',
    '물체 수를 늘리면 A의 프레임 비용(⏱)이 B보다 훨씬 빠르게 늘어남.',
  ],
  refs: [
    { type: 'paper', title: 'Fast Extraction of Viewing Frustum Planes from the World-View-Projection Matrix (Gil Gribb, Klaus Hartmann)', year: 2001 },
    { type: 'article', title: 'LearnOpenGL: Frustum Culling', url: 'https://learnopengl.com/Guest-Articles/2021/Scene/Frustum-Culling' },
    { type: 'engine', title: 'Unity: LOD Group', url: 'https://docs.unity3d.com/Manual/class-LODGroup.html', note: '화면 높이 비율로 LOD 전환, cross-fade.' },
    { type: 'engine', title: 'Unreal Engine: Visibility and Occlusion Culling', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/visibility-and-occlusion-culling-in-unreal-engine' },
    { type: 'book', title: 'Real-Time Rendering, 4th ed., Ch. 19 Acceleration Algorithms (culling, LOD)', year: 2018 },
  ],
  params: [
    { key: 'cull', label: '프러스텀 컬링', type: 'bool', a: false, b: true, group: '최적화' },
    { key: 'lod', label: 'LOD', type: 'bool', a: false, b: true },
    { key: 'lodBias', label: 'LOD 바이어스', type: 'range', min: 0.2, max: 4, step: 0.05, default: 1, when: (p) => p.lod, help: '클수록 고해상도 LOD를 더 멀리까지 유지' },
    { key: 'lodColors', label: 'LOD 색 표시', type: 'bool', default: false },
    { key: 'minimap', label: '미니맵', type: 'bool', default: true },
    { key: 'count', label: '물체 수', type: 'int', min: 200, max: 5000, step: 100, default: 2500, shared: true, reset: true, group: '장면' },
    { key: 'far', label: '원평면 거리', type: 'range', min: 30, max: 300, step: 5, default: 220, shared: true },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Frustum Culling & LOD',
    summary: 'Skip objects outside the view (frustum), and swap far objects for low poly meshes. The same picture takes far fewer draw calls and triangles.',
    views: { a: 'No culling, no LOD', b: 'Frustum culling + LOD' },
    controls: 'Mouse drag: turn view. Wheel: field of view (FOV).',
    info: `
    <p>The <b>frustum</b> is the space the camera sees, shaped like a cut pyramid. <b>Frustum culling</b> does not send objects outside this space to the GPU.</p>
    <ul>
      <li>It pulls the 6 planes straight out of the view-projection matrix (Gribb & Hartmann).</li>
      <li>If an object's <b>bounding sphere</b> is fully outside one plane, it is dropped.</li>
      <li>It costs only 6 dot products per object on the CPU. Draw calls and vertex work drop by the share of the scene outside the view.</li>
      <li>Real engines group objects in a BVH or octree and test them in a hierarchy.</li>
    </ul>
    <p><b>LOD (Level of Detail)</b> swaps far objects for simpler meshes. The object's size on screen (projected radius) picks LOD0 (2304 triangles) → LOD1 (256) → LOD2 (48).</p>
    <p>Thousands of triangles on a far object means more triangles than pixels, which is waste. It also lowers the GPU's quad-based shading efficiency.</p>
    <p>Downside: the shape jumps at the moment the LOD changes. This is <b>popping</b>. Dither fades or geomorphing hide it.</p>
    <p>The minimap at the top right shows the scene from above:</p>
    <ul>
      <li>White lines: camera frustum.</li>
      <li><span style="color:#66d17a">Green/yellow/orange</span>: objects drawn at LOD0/1/2.</li>
      <li><span style="color:#ff5370">Red</span>: culled objects.</li>
    </ul>`,
    look: [
      'Compare the main views of A and B. They look almost the same, but B uses a small fraction of the draw calls and triangles.',
      'Widen the field of view with the wheel. Fewer objects get culled (red on the minimap), and draw calls go up.',
      'Turn on "Show LOD colors" to see the LOD level by distance. Lower the LOD bias and the low poly spheres start to look blocky (popping).',
      'Raise the object count. A\'s frame cost (⏱) grows much faster than B\'s.',
    ],
    refs: [null, null, 'Switches LOD by screen height ratio, with cross-fade.', null, null],
    params: {
      cull: { label: 'Frustum culling', group: 'Optimization' },
      lodBias: { label: 'LOD bias', help: 'Higher keeps high detail LODs out to a longer distance' },
      lodColors: 'Show LOD colors',
      minimap: 'Minimap',
      count: { label: 'Object count', group: 'Scene' },
      far: 'Far plane distance',
      autoRotate: 'Auto rotate',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params, G = U.geometry;

    function lodMesh(geo) {
      const pb = U.gl.buffer(gl, geo.positions), nb = U.gl.buffer(gl, geo.normals), ib = U.gl.buffer(gl, geo.indices, gl.ELEMENT_ARRAY_BUFFER);
      return {
        tris: geo.count / 3, count: geo.count,
        bind(prog) { U.gl.attrib(gl, prog, 'a_position', pb, 3); U.gl.attrib(gl, prog, 'a_normal', nb, 3); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); },
        draw() { gl.drawElements(gl.TRIANGLES, geo.count, gl.UNSIGNED_SHORT, 0); },
      };
    }
    const lods = [lodMesh(G.sphere(1, 48, 24)), lodMesh(G.sphere(1, 16, 8)), lodMesh(G.sphere(1, 6, 4))];
    const ground = G.upload(gl, G.plane(700, 1, 1));

    const rng = U.rng(ctx.seed * 13 + 1);
    const N = P.count, objs = [];
    for (let i = 0; i < N; i++) {
      const a = rng.range(0, U.TAU), d = 6 + Math.sqrt(rng.next()) * 240, r = rng.range(0.5, 2.2);
      objs.push({ x: Math.cos(a) * d, y: r, z: Math.sin(a) * d, r, c: U.hexToRgb01(rng.pick(U.colors.series)), lod: 0, vis: true });
    }

    const prog = U.gl.program(gl, `
      attribute vec3 a_position; attribute vec3 a_normal;
      uniform mat4 u_vp; uniform vec4 u_obj;
      varying vec3 v_n; varying float v_d;
      void main(){
        vec3 wp = a_position * u_obj.w + u_obj.xyz;
        v_n = a_normal;
        vec4 cp = u_vp * vec4(wp, 1.0);
        v_d = cp.w;
        gl_Position = cp;
      }`, `
      precision mediump float;
      uniform vec3 u_color; uniform float u_far;
      varying vec3 v_n; varying float v_d;
      void main(){
        vec3 N = normalize(v_n);
        float l = max(dot(N, normalize(vec3(0.4, 0.8, 0.3))), 0.0) * 0.8 + 0.25;
        vec3 c = u_color * l;
        c = mix(c, vec3(0.1, 0.12, 0.16), smoothstep(u_far * 0.6, u_far, v_d));
        gl_FragColor = vec4(c, 1.0);
      }`);
    const groundProg = U.gl.program(gl, `
      attribute vec3 a_position; uniform mat4 u_vp; varying vec2 v_p; varying float v_d;
      void main(){ v_p = a_position.xz; vec4 cp = u_vp * vec4(a_position, 1.0); v_d = cp.w; gl_Position = cp; }`, `
      precision mediump float; uniform float u_far; varying vec2 v_p; varying float v_d;
      void main(){
        vec2 g = abs(fract(v_p / 10.0) - 0.5);
        float line = step(0.47, max(g.x, g.y));
        vec3 c = mix(vec3(0.16, 0.18, 0.2), vec3(0.26, 0.29, 0.33), line);
        c = mix(c, vec3(0.1, 0.12, 0.16), smoothstep(u_far * 0.6, u_far, v_d));
        gl_FragColor = vec4(c, 1.0);
      }`);
    // 미니맵: 점(물체) + 선(프러스텀) 을 한 번씩 그림
    const mapProg = U.gl.program(gl, `
      attribute vec2 a_p; attribute vec3 a_c; uniform mat4 u_mvp; uniform float u_size; varying vec3 v_c;
      void main(){ v_c = a_c; gl_PointSize = u_size; gl_Position = u_mvp * vec4(a_p.x, 0.0, a_p.y, 1.0); }`, `
      precision mediump float; varying vec3 v_c;
      void main(){ gl_FragColor = vec4(v_c, 1.0); }`);
    const mapPos = new Float32Array(N * 2), mapCol = new Float32Array(N * 3);
    objs.forEach((o, i) => { mapPos[i * 2] = o.x; mapPos[i * 2 + 1] = o.z; });
    const mapPosBuf = U.gl.buffer(gl, mapPos), mapColBuf = U.gl.buffer(gl, mapCol, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    const lineBuf = U.gl.buffer(gl, new Float32Array(10), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    const lineColBuf = U.gl.buffer(gl, new Float32Array(15).fill(1));
    const LOD_COL = [U.hexToRgb01(U.colors.good), U.hexToRgb01(U.colors.warn), U.hexToRgb01(U.colors.a)], CULL_COL = U.hexToRgb01(U.colors.bad);

    const cam = { yaw: 0, pitch: -0.05, fov: 60, drag: false, lx: 0, ly: 0 };
    const eye = [0, 3, 0];
    const planes = new Float32Array(24);
    function extractPlanes(m) {
      // Gribb-Hartmann: row3 ± row0/1/2 (column-major이므로 row i = m[i], m[4+i], m[8+i], m[12+i])
      const r = (i) => [m[i], m[4 + i], m[8 + i], m[12 + i]];
      const r0 = r(0), r1 = r(1), r2 = r(2), r3 = r(3);
      const ps = [[1, r0], [-1, r0], [1, r1], [-1, r1], [1, r2], [-1, r2]];
      ps.forEach(([s, row], k) => {
        const a = r3[0] + s * row[0], b = r3[1] + s * row[1], c = r3[2] + s * row[2], d = r3[3] + s * row[3];
        const l = Math.hypot(a, b, c);
        planes.set([a / l, b / l, c / l, d / l], k * 4);
      });
    }
    const sphereVisible = (o) => {
      for (let k = 0; k < 6; k++) if (planes[k * 4] * o.x + planes[k * 4 + 1] * o.y + planes[k * 4 + 2] * o.z + planes[k * 4 + 3] < -o.r) return false;
      return true;
    };

    return {
      update(dt) {
        if (P.autoRotate && !cam.drag) cam.yaw += dt * 0.12;
        if (ctx.input.mouse.wheel) cam.fov = U.clamp(cam.fov + ctx.input.mouse.wheel * 5, 20, 110);
      },
      onPointer(type, m) {
        if (type === 'down') { cam.drag = true; cam.lx = m.x; cam.ly = m.y; }
        else if (type === 'up' || type === 'leave') cam.drag = false;
        else if (type === 'move' && cam.drag) {
          cam.yaw -= (m.x - cam.lx) * 0.006; cam.pitch = U.clamp(cam.pitch - (m.y - cam.ly) * 0.006, -0.8, 0.6);
          cam.lx = m.x; cam.ly = m.y;
        }
      },
      render() {
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clearColor(0.1, 0.12, 0.16, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        const aspect = ctx.width / ctx.height, fovy = U.rad(cam.fov), far = P.far;
        const proj = M.perspective(fovy, aspect, 0.3, far);
        const dir = [Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), -Math.cos(cam.yaw) * Math.cos(cam.pitch)];
        const vp = M.multiply(proj, M.lookAt(eye, [eye[0] + dir[0], eye[1] + dir[1], eye[2] + dir[2]]));

        groundProg.use();
        gl.uniformMatrix4fv(groundProg.u('u_vp'), false, vp);
        gl.uniform1f(groundProg.u('u_far'), far);
        ground.draw(groundProg);

        // ── 컬링 + LOD 선택 (CPU) ──
        const t0 = ctx.now();
        extractPlanes(vp);
        const tanH = Math.tan(fovy / 2);
        const buckets = [[], [], []];
        let visible = 0;
        for (const o of objs) {
          o.vis = !P.cull || sphereVisible(o);
          if (!o.vis) continue;
          visible++;
          let lod = 0;
          if (P.lod) {
            const d = Math.hypot(o.x - eye[0], o.y - eye[1], o.z - eye[2]);
            const screen = o.r / (Math.max(d, 0.01) * tanH) * P.lodBias; // 화면 높이 대비 투영 반지름
            lod = screen > 0.06 ? 0 : screen > 0.015 ? 1 : 2;
          }
          o.lod = lod;
          buckets[lod].push(o);
        }
        const cullMs = ctx.now() - t0;

        // ── 드로우: LOD별로 메시 바인딩 1회, 물체마다 드로우 콜 1회 ──
        const t1 = ctx.now();
        prog.use();
        gl.uniformMatrix4fv(prog.u('u_vp'), false, vp);
        gl.uniform1f(prog.u('u_far'), far);
        const uObj = prog.u('u_obj'), uCol = prog.u('u_color');
        let draws = 1, tris = 2;
        for (let l = 0; l < 3; l++) {
          if (!buckets[l].length) continue;
          lods[l].bind(prog);
          for (const o of buckets[l]) {
            gl.uniform4f(uObj, o.x, o.y, o.z, o.r);
            const c = P.lodColors ? LOD_COL[l] : o.c;
            gl.uniform3f(uCol, c[0], c[1], c[2]);
            lods[l].draw();
            draws++; tris += lods[l].tris;
          }
        }
        const drawMs = ctx.now() - t1;

        // ── 미니맵 ──
        if (P.minimap) {
          const s = Math.round(Math.min(ctx.pixelWidth, ctx.pixelHeight) * 0.42), x0 = ctx.pixelWidth - s - 8, y0 = ctx.pixelHeight - s - 8;
          gl.enable(gl.SCISSOR_TEST);
          gl.scissor(x0, y0, s, s);
          gl.viewport(x0, y0, s, s);
          gl.clearColor(0.05, 0.06, 0.08, 1);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          gl.disable(gl.SCISSOR_TEST);
          gl.disable(gl.DEPTH_TEST);
          for (let i = 0; i < N; i++) {
            const o = objs[i], c = o.vis ? LOD_COL[o.lod] : CULL_COL;
            mapCol[i * 3] = c[0]; mapCol[i * 3 + 1] = c[1]; mapCol[i * 3 + 2] = c[2];
          }
          gl.bindBuffer(gl.ARRAY_BUFFER, mapColBuf);
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, mapCol);
          const R = 250;
          const mvp = M.multiply(M.ortho(-R, R, -R, R, -10, 10), M.lookAt([0, 5, 0], [0, 0, 0], [0, 0, -1]));
          mapProg.use();
          gl.uniformMatrix4fv(mapProg.u('u_mvp'), false, mvp);
          gl.uniform1f(mapProg.u('u_size'), Math.max(1.5, ctx.pixelRatio * 2));
          U.gl.attrib(gl, mapProg, 'a_p', mapPosBuf, 2);
          U.gl.attrib(gl, mapProg, 'a_c', mapColBuf, 3);
          gl.drawArrays(gl.POINTS, 0, N);
          // 프러스텀 (수평 단면): 눈 → 원평면 좌/우 끝
          const hfov = Math.atan(tanH * aspect), fd = far * Math.cos(cam.pitch);
          const pL = [eye[0] + Math.sin(cam.yaw - hfov) * fd / Math.cos(hfov), eye[2] - Math.cos(cam.yaw - hfov) * fd / Math.cos(hfov)];
          const pR = [eye[0] + Math.sin(cam.yaw + hfov) * fd / Math.cos(hfov), eye[2] - Math.cos(cam.yaw + hfov) * fd / Math.cos(hfov)];
          gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array([eye[0], eye[2], pL[0], pL[1], pR[0], pR[1], eye[0], eye[2], eye[0], eye[2]]));
          U.gl.attrib(gl, mapProg, 'a_p', lineBuf, 2);
          U.gl.attrib(gl, mapProg, 'a_c', lineColBuf, 3);
          gl.drawArrays(gl.LINE_STRIP, 0, 4);
          gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        }

        ctx.stat(GTL.L('드로우 콜', 'Draw calls'), draws);
        ctx.stat(GTL.L('삼각형', 'Triangles'), tris.toLocaleString());
        ctx.stat(GTL.L('그린 물체', 'Objects drawn'), `${visible} / ${N}`);
        ctx.stat('LOD0/1/2', buckets.map((b) => b.length).join(' / '));
        ctx.stat(GTL.L('컬링 CPU ms', 'Culling CPU ms'), cullMs.toFixed(2));
        ctx.stat(GTL.L('드로우 제출 ms', 'Draw submit ms'), drawMs.toFixed(2));
        ctx.stat('FOV', cam.fov + '°');
      },
    };
  },
});
