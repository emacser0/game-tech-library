// 인스턴싱 vs 개별 드로우 콜 vs 정적 배칭
GTL.register({
  id: 'instancing',
  title: '인스턴싱 vs 개별 드로우 콜',
  summary: '같은 메시를 수천 번 그릴 때 물체마다 드로우 콜을 보내면 CPU와 드라이버가 병목이 됨. 인스턴싱은 한 번의 호출로 전부 그림.',
  renderer: 'webgl',
  views: { a: '개별 드로우 콜', b: '인스턴싱 (1회)' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌',
  info: `
    <p><b>드로우 콜(draw call)</b>은 CPU가 GPU에 "이 메시를 그려라"라고 보내는 명령. 호출마다 <b>CPU 쪽 고정 비용</b>이 듦:</p>
    <ul>
      <li>상태 검증</li>
      <li>유니폼과 속성 설정</li>
      <li>커맨드 버퍼 기록</li>
    </ul>
    <p>작은 메시 수천 개를 따로 그리면 GPU는 놀고 CPU가 병목이 됨. WebGL은 호출마다 브라우저 검증 계층을 거쳐 네이티브보다 더 비쌈.</p>
    <p><b>인스턴싱(instancing)</b>: 같은 메시를 한 번의 호출로 N개 그리는 기법(<code>ANGLE_instanced_arrays</code>, WebGL2는 기본 기능).</p>
    <ul>
      <li><code>vertexAttribDivisor(loc, 1)</code>로 지정한 속성은 <i>인스턴스마다</i> 한 칸씩 읽힘.</li>
      <li>위치, 위상, 색을 인스턴스 버퍼에 넣고 <code>drawElementsInstanced</code>를 한 번 호출함.</li>
      <li>애니메이션은 세 방식 모두 같은 정점 셰이더에서 시간으로 계산함.</li>
    </ul>
    <p><b>정적 배칭(static batching)</b>: 모든 복사본을 정점 버퍼 하나로 미리 합쳐 드로우 콜을 줄임. 단점: 인스턴스 데이터가 정점마다 복제되어 메모리가 N배로 늘어남. 16비트 인덱스 한계 때문에 여러 덩어리로 나뉨.</p>
    <p>개별 드로우 경로도 같은 셰이더를 씀. 인스턴스 속성을 배열 대신 <code>vertexAttrib4f</code> 상수로 바꿔 가며 그림.</p>`,
  // 도식: 호출마다 CPU 고정 비용이 드는 개별 드로우와 인스턴스 버퍼로 한 번에 그리는 방식
  diagram: (L) => `<svg viewBox="0 0 540 198" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="16" class="t-a">${L('A: 물체마다 드로우 콜', 'A: one draw call per object')}</text>
    <text x="10" y="38" class="t-small t-dim">${L('CPU', 'CPU')}</text>
    <text x="10" y="62" class="t-small t-dim">${L('GPU', 'GPU')}</text>
    <rect x="50" y="26" width="30" height="16" class="f-a"/>
    <rect x="80" y="26" width="14" height="16" class="f-dim"/>
    <rect x="84" y="50" width="8" height="16" class="f-dim"/>
    <rect x="102" y="26" width="30" height="16" class="f-a"/>
    <rect x="132" y="26" width="14" height="16" class="f-dim"/>
    <rect x="136" y="50" width="8" height="16" class="f-dim"/>
    <rect x="154" y="26" width="30" height="16" class="f-a"/>
    <rect x="184" y="26" width="14" height="16" class="f-dim"/>
    <rect x="188" y="50" width="8" height="16" class="f-dim"/>
    <rect x="206" y="26" width="30" height="16" class="f-a"/>
    <rect x="236" y="26" width="14" height="16" class="f-dim"/>
    <rect x="240" y="50" width="8" height="16" class="f-dim"/>
    <rect x="258" y="26" width="30" height="16" class="f-a"/>
    <rect x="288" y="26" width="14" height="16" class="f-dim"/>
    <rect x="292" y="50" width="8" height="16" class="f-dim"/>
    <rect x="310" y="26" width="30" height="16" class="f-a"/>
    <rect x="340" y="26" width="14" height="16" class="f-dim"/>
    <rect x="344" y="50" width="8" height="16" class="f-dim"/>
    <rect x="362" y="26" width="30" height="16" class="f-a"/>
    <rect x="392" y="26" width="14" height="16" class="f-dim"/>
    <rect x="396" y="50" width="8" height="16" class="f-dim"/>
    <rect x="414" y="26" width="30" height="16" class="f-a"/>
    <rect x="444" y="26" width="14" height="16" class="f-dim"/>
    <rect x="448" y="50" width="8" height="16" class="f-dim"/>
    <rect x="466" y="26" width="30" height="16" class="f-a"/>
    <rect x="496" y="26" width="14" height="16" class="f-dim"/>
    <rect x="500" y="50" width="8" height="16" class="f-dim"/>
    <text x="50" y="84" class="t-small">${L('주황: 상태 설정, 검증 (호출마다 고정 비용). GPU는 대부분 놂', 'Orange: state setup and checks (fixed cost per call). GPU mostly idle')}</text>
    <text x="10" y="112" class="t-b">${L('B: 인스턴싱 호출 1번', 'B: one instanced call')}</text>
    <text x="10" y="134" class="t-small t-dim">${L('CPU', 'CPU')}</text>
    <text x="10" y="158" class="t-small t-dim">${L('GPU', 'GPU')}</text>
    <rect x="50" y="122" width="30" height="16" class="f-b"/>
    <rect x="80" y="146" width="150" height="16" class="f-dim"/>
    <text x="84" y="158" class="t-small t-mono">N instances</text>
    <text x="290" y="112" class="t-small t-dim">${L('인스턴스 버퍼 (divisor 1)', 'Instance buffer (divisor 1)')}</text>
    <rect x="290" y="120" width="240" height="14" class="f-dim"/>
    <text x="296" y="131" class="t-small t-mono">#0  pos  phase  color</text>
    <rect x="290" y="134" width="240" height="14" class="f-dim"/>
    <text x="296" y="145" class="t-small t-mono">#1  pos  phase  color</text>
    <rect x="290" y="148" width="240" height="14" class="f-dim"/>
    <text x="296" y="159" class="t-small t-mono">#2  pos  phase  color</text>
    <rect x="290" y="162" width="240" height="14" class="f-dim"/>
    <text x="296" y="173" class="t-small t-mono">#3  pos  phase  color</text>
    <text x="290" y="190" class="t-small">${L('인스턴스마다 한 줄씩 읽힘', 'Read one row per instance')}</text>
  </svg>`,
  look: [
    '물체 수를 20000으로 올리면 A의 "제출 CPU ms"와 프레임 비용(⏱)이 수십 ms로 치솟음. B는 거의 0.',
    '삼각형 수를 비교하면 A와 B가 같음. 차이는 모두 CPU 쪽 호출 오버헤드에서 생김.',
    '"정적 배칭"으로 바꾸면 드로우 콜이 몇 개로 줄어 빠름. 대신 정점 메모리가 크게 늘어남(통계 참고).',
  ],
  refs: [
    { type: 'article', title: 'ANGLE_instanced_arrays (Khronos WebGL extension registry)', url: 'https://registry.khronos.org/webgl/extensions/ANGLE_instanced_arrays/' },
    { type: 'book', title: 'GPU Gems 2, Ch. 3: Inside Geometry Instancing (Francesco Carucci)', url: 'https://developer.nvidia.com/gpugems/gpugems2/part-i-geometric-complexity/chapter-3-inside-geometry-instancing', year: 2005 },
    { type: 'article', title: 'Batch, Batch, Batch: What Does It Really Mean? (Matthias Wloka, NVIDIA)', year: 2003, note: 'GDC 2003. 드로우 콜 수가 CPU 병목이 되는 이유.' },
    { type: 'engine', title: 'Unity: GPU instancing / Draw call batching', url: 'https://docs.unity3d.com/Manual/GPUInstancing.html' },
    { type: 'article', title: 'LearnOpenGL: Instancing', url: 'https://learnopengl.com/Advanced-OpenGL/Instancing' },
  ],
  params: [
    { key: 'mode', label: '그리기 방식', type: 'select', group: '방식', options: [
      { value: 'individual', label: '개별 드로우 콜' },
      { value: 'instanced', label: '인스턴싱' },
      { value: 'batched', label: '정적 배칭 (병합 버퍼)' },
    ], a: 'individual', b: 'instanced' },
    { key: 'count', label: '물체 수', type: 'int', min: 100, max: 20000, step: 100, default: 5000, shared: true, group: '장면' },
    { key: 'mesh', label: '메시', type: 'select', options: [
      { value: 'cube', label: '큐브 (12 삼각형)' },
      { value: 'ico', label: '저폴리 구 (96 삼각형)' },
    ], default: 'cube', shared: true, reset: true },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Instancing vs Separate Draw Calls',
    summary: 'When you draw the same mesh thousands of times, one draw call per object makes the CPU and driver the bottleneck. Instancing draws them all with one call.',
    views: { a: 'Separate draw calls', b: 'Instancing (1 call)' },
    controls: 'Mouse drag: rotate camera. Wheel: zoom.',
    info: `
    <p>A <b>draw call</b> is a command the CPU sends to the GPU: "draw this mesh". Each call has a <b>fixed CPU cost</b>:</p>
    <ul>
      <li>State validation</li>
      <li>Setting uniforms and attributes</li>
      <li>Recording the command buffer</li>
    </ul>
    <p>If you draw thousands of small meshes one by one, the GPU sits idle and the CPU becomes the bottleneck. In WebGL each call also goes through the browser's validation layer, so it costs more than native.</p>
    <p><b>Instancing</b>: a way to draw N copies of the same mesh with one call (<code>ANGLE_instanced_arrays</code>, built in on WebGL2).</p>
    <ul>
      <li>An attribute set with <code>vertexAttribDivisor(loc, 1)</code> advances one slot <i>per instance</i>.</li>
      <li>Put position, phase, and color in an instance buffer, then call <code>drawElementsInstanced</code> once.</li>
      <li>In all three modes, the same vertex shader computes the animation from time.</li>
    </ul>
    <p><b>Static batching</b>: merge all copies into one vertex buffer ahead of time to cut draw calls. Downside: instance data is copied for every vertex, so memory grows N times. The 16-bit index limit also splits it into several chunks.</p>
    <p>The separate draw path uses the same shader. It swaps the instance attributes as <code>vertexAttrib4f</code> constants instead of arrays.</p>`,
    look: [
      'Raise the object count to 20000. A\'s "Submit CPU ms" and frame cost (⏱) jump to tens of ms. B stays near 0.',
      'Compare the triangle counts. A and B are the same. The whole difference comes from CPU call overhead.',
      'Switch to "Static batching". Draw calls drop to a few and it runs fast. But vertex memory grows a lot (see stats).',
    ],
    refs: [null, null, 'GDC 2003. Why the number of draw calls becomes a CPU bottleneck.', null, null],
    params: {
      mode: { label: 'Draw mode', group: 'Mode', options: { individual: 'Separate draw calls', instanced: 'Instancing', batched: 'Static batching (merged buffer)' } },
      count: { label: 'Object count', group: 'Scene' },
      mesh: { label: 'Mesh', options: { cube: 'Cube (12 triangles)', ico: 'Low poly sphere (96 triangles)' } },
      autoRotate: 'Auto rotate',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params, G = U.geometry;
    const ext = gl.getExtension('ANGLE_instanced_arrays');
    const MAX = 20000;

    const vs = `
      attribute vec3 a_position; attribute vec3 a_normal;
      attribute vec4 i_offset; attribute vec3 i_color;
      uniform mat4 u_vp; uniform float u_time;
      varying vec3 v_c; varying vec3 v_n;
      void main(){
        float ph = i_offset.w;
        float spd = 0.3 + 0.7 * fract(ph * 7.31);
        float a = u_time * spd + ph;
        float orbit = u_time * 0.05 * spd;
        float co = cos(orbit), so = sin(orbit);
        vec3 b = i_offset.xyz;
        vec3 c = vec3(b.x * co - b.z * so, b.y + sin(a) * 0.4, b.x * so + b.z * co);
        float cs = cos(a), sn = sin(a);
        mat3 R = mat3(cs, 0.0, -sn, 0.0, 1.0, 0.0, sn, 0.0, cs);
        v_n = R * a_normal; v_c = i_color;
        gl_Position = u_vp * vec4(R * a_position * 0.45 + c, 1.0);
      }`;
    const fs = `
      precision mediump float;
      varying vec3 v_c; varying vec3 v_n;
      void main(){
        vec3 N = normalize(v_n);
        float l = max(dot(N, normalize(vec3(0.4, 0.8, 0.3))), 0.0) * 0.75 + 0.25;
        gl_FragColor = vec4(v_c * l, 1.0);
      }`;
    // 속성 위치 고정: 0번은 항상 배열로 켜 둘 a_position (일부 드라이버가 0번 상수 속성을 에뮬레이션)
    const program = gl.createProgram();
    gl.attachShader(program, U.gl.shader(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(program, U.gl.shader(gl, gl.FRAGMENT_SHADER, fs));
    ['a_position', 'a_normal', 'i_offset', 'i_color'].forEach((n, i) => gl.bindAttribLocation(program, i, n));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(GTL.L('셰이더 프로그램 링크 실패. 아래 로그에서 원인 확인 필요:\n', 'Shader program link failed. Check the log below for the cause:\n') +gl.getProgramInfoLog(program));
    const LOC = { pos: 0, nor: 1, off: 2, col: 3 };
    const uVP = gl.getUniformLocation(program, 'u_vp'), uTime = gl.getUniformLocation(program, 'u_time');

    // 메시
    let geo;
    if (P.mesh === 'cube') geo = G.cube(1);
    else geo = G.sphere(1, 8, 6);
    const vcount = geo.positions.length / 3;
    const pb = U.gl.buffer(gl, geo.positions), nb = U.gl.buffer(gl, geo.normals), ib = U.gl.buffer(gl, geo.indices, gl.ELEMENT_ARRAY_BUFFER);
    const tris = geo.count / 3;

    // 인스턴스 데이터 (나선 은하 분포)
    const rng = U.rng(ctx.seed * 3 + 11);
    const offs = new Float32Array(MAX * 4), cols = new Float32Array(MAX * 3);
    const pal = U.colors.series.map(U.hexToRgb01);
    for (let i = 0; i < MAX; i++) {
      const arm = rng.int(0, 3), r = 4 + Math.pow(rng.next(), 0.7) * 70;
      const a = arm * (U.TAU / 4) + r * 0.06 + rng.gauss() * 0.25;
      offs.set([Math.cos(a) * r, rng.gauss() * (3 + 10 / (1 + r * 0.1)), Math.sin(a) * r, rng.range(0, 100)], i * 4);
      const c = pal[(arm * 2 + (r > 35 ? 1 : 0)) % pal.length];
      cols.set(c, i * 3);
    }
    const offBuf = U.gl.buffer(gl, offs), colBuf = U.gl.buffer(gl, cols);

    // 정적 배칭: 16비트 인덱스 한계 안에서 덩어리로 병합 (처음 사용할 때 생성)
    let batches = null, batchBytes = 0, builtN = 0;
    function buildBatches(total) {
      if (batches) for (const b of batches) { gl.deleteBuffer(b.p); gl.deleteBuffer(b.nn); gl.deleteBuffer(b.o); gl.deleteBuffer(b.c); gl.deleteBuffer(b.i); }
      batches = []; batchBytes = 0; builtN = total;
      const per = Math.floor(65535 / vcount);
      for (let s = 0; s < total; s += per) {
        const n = Math.min(per, total - s);
        const P3 = new Float32Array(n * vcount * 3), N3 = new Float32Array(n * vcount * 3), O4 = new Float32Array(n * vcount * 4), C3 = new Float32Array(n * vcount * 3);
        const I = new Uint16Array(n * geo.count);
        for (let k = 0; k < n; k++) {
          P3.set(geo.positions, k * vcount * 3); N3.set(geo.normals, k * vcount * 3);
          for (let v = 0; v < vcount; v++) { O4.set(offs.subarray((s + k) * 4, (s + k) * 4 + 4), (k * vcount + v) * 4); C3.set(cols.subarray((s + k) * 3, (s + k) * 3 + 3), (k * vcount + v) * 3); }
          for (let j = 0; j < geo.count; j++) I[k * geo.count + j] = geo.indices[j] + k * vcount;
        }
        batchBytes += P3.byteLength + N3.byteLength + O4.byteLength + C3.byteLength + I.byteLength;
        batches.push({ start: s, n, p: U.gl.buffer(gl, P3), nn: U.gl.buffer(gl, N3), o: U.gl.buffer(gl, O4), c: U.gl.buffer(gl, C3), i: U.gl.buffer(gl, I, gl.ELEMENT_ARRAY_BUFFER) });
      }
    }

    const cam = { yaw: 0.3, pitch: 0.5, dist: 110, drag: false, lx: 0, ly: 0 };
    let time = 0;
    const bindAttr = (loc, buf, size) => { gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); };

    return {
      update(dt) {
        time += dt;
        if (P.autoRotate && !cam.drag) cam.yaw += dt * 0.1;
        if (ctx.input.mouse.wheel) cam.dist = U.clamp(cam.dist * Math.pow(1.12, ctx.input.mouse.wheel), 15, 250);
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
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clearColor(0.03, 0.035, 0.05, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        const proj = M.perspective(U.rad(50), ctx.width / ctx.height, 0.5, 600);
        const eye = M.orbitEye([0, 0, 0], cam.yaw, cam.pitch, cam.dist);
        const vp = M.multiply(proj, M.lookAt(eye, [0, 0, 0]));
        const N = Math.min(P.count, MAX);
        let mode = P.mode;
        if (mode === 'instanced' && !ext) mode = 'individual';

        const t0 = ctx.now();
        gl.useProgram(program);
        gl.uniformMatrix4fv(uVP, false, vp);
        gl.uniform1f(uTime, time);
        let draws = 0;
        if (mode === 'batched') {
          if (!batches || builtN < N) buildBatches(N);
          for (const b of batches) {
            if (b.start >= N) break;
            bindAttr(LOC.pos, b.p, 3); bindAttr(LOC.nor, b.nn, 3); bindAttr(LOC.off, b.o, 4); bindAttr(LOC.col, b.c, 3);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.i);
            gl.drawElements(gl.TRIANGLES, Math.min(b.n, N - b.start) * geo.count, gl.UNSIGNED_SHORT, 0);
            draws++;
          }
        } else {
          bindAttr(LOC.pos, pb, 3); bindAttr(LOC.nor, nb, 3);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
          if (mode === 'instanced') {
            bindAttr(LOC.off, offBuf, 4); bindAttr(LOC.col, colBuf, 3);
            ext.vertexAttribDivisorANGLE(LOC.off, 1);
            ext.vertexAttribDivisorANGLE(LOC.col, 1);
            ext.drawElementsInstancedANGLE(gl.TRIANGLES, geo.count, gl.UNSIGNED_SHORT, 0, N);
            ext.vertexAttribDivisorANGLE(LOC.off, 0);
            ext.vertexAttribDivisorANGLE(LOC.col, 0);
            draws = 1;
          } else {
            // 인스턴스 속성을 상수 속성으로 바꿔 가며 물체마다 드로우 콜
            gl.disableVertexAttribArray(LOC.off);
            gl.disableVertexAttribArray(LOC.col);
            for (let i = 0; i < N; i++) {
              gl.vertexAttrib4f(LOC.off, offs[i * 4], offs[i * 4 + 1], offs[i * 4 + 2], offs[i * 4 + 3]);
              gl.vertexAttrib3f(LOC.col, cols[i * 3], cols[i * 3 + 1], cols[i * 3 + 2]);
              gl.drawElements(gl.TRIANGLES, geo.count, gl.UNSIGNED_SHORT, 0);
            }
            draws = N;
          }
        }
        const ms = ctx.now() - t0;
        ctx.stat(GTL.L('드로우 콜', 'Draw calls'), draws);
        ctx.stat(GTL.L('제출 CPU ms', 'Submit CPU ms'), ms.toFixed(2));
        ctx.stat(GTL.L('삼각형', 'Triangles'), (N * tris).toLocaleString());
        ctx.stat(GTL.L('인스턴싱 확장', 'Instancing extension'), ext ? GTL.L('지원', 'Supported') : GTL.L('미지원 → 개별 드로우', 'Not supported → separate draws'));
        if (mode === 'batched') ctx.stat(GTL.L('병합 버퍼 메모리', 'Merged buffer memory'), (batchBytes / 1048576).toFixed(1) + ' MB');
        else ctx.stat(GTL.L('정점 버퍼 메모리', 'Vertex buffer memory'), (((vcount * 6 * 4) + N * 7 * 4) / 1048576).toFixed(2) + ' MB');
      },
    };
  },
});
