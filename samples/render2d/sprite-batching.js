// 스프라이트 배칭: 스프라이트마다 draw call vs 동적 버퍼 배칭 vs 인스턴싱, 텍스처 아틀라스, 정렬
GTL.register({
  id: 'sprite-batching',
  title: '스프라이트 배칭 & 드로우 콜',
  summary: '스프라이트마다 uniform을 바꾸고 draw call을 하나씩 내면, CPU와 드라이버 부담이 개수에 비례해 쌓임. 정점을 한 버퍼에 모아 한 번에 그리면(배칭) 수천 개도 몇 번의 호출로 끝남.',
  renderer: 'webgl',
  views: { a: '스프라이트당 draw call', b: '배칭 (아틀라스)' },
  info: `
    <p>draw call은 CPU가 GPU에 "이것을 그려라"라고 보내는 명령 한 번. GPU는 삼각형 수만 개를 순식간에 그림.
    하지만 <b>draw call마다</b> 상태 검증, uniform 업로드, 명령 버퍼 기록 같은 CPU 쪽 비용이 듦.</p>
    <p>스프라이트 1개마다 draw call 1개를 쓰면 수천 개에서 CPU가 병목이 됨. WebGL은 검증 계층이 있어 더 비쌈.</p>
    <ul>
    <li><b>배칭(Batching)</b>: CPU가 스프라이트의 네 꼭짓점을 변환해 큰 정점 버퍼에 이어 씀. 한 번에 업로드하고 한 번에 그림.
    단, <b>텍스처가 바뀌면 배치를 끊어야</b> 함. 그래서 텍스처 아틀라스(여러 이미지를 한 장에 모은 것)나 텍스처별 정렬이 중요함.</li>
    <li><b>인스턴싱(Instancing)</b>: 사각형 하나와 인스턴스별 속성(위치, 크기, 회전, UV) 버퍼를 씀. 정점 변환은 GPU가 함 (<code>ANGLE_instanced_arrays</code>).</li>
    </ul>
    <p>"배치 색상화"를 켜면 같은 draw call로 그린 스프라이트가 같은 색으로 칠해짐. 배치가 어떻게 나뉘는지 보임.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 180" xmlns="http://www.w3.org/2000/svg">
    <text x="4" y="14" class="t-a">${L('A: 스프라이트마다 draw call', 'A: one draw call per sprite')}</text>
    ${Array.from({ length: 12 }, (_, i) => `<rect x="${10 + i * 30}" y="22" width="8" height="18" class="f-dim"/><rect x="${18 + i * 30}" y="22" width="8" height="18" class="f-a" opacity="0.5"/><rect x="${26 + i * 30}" y="22" width="10" height="18" class="f-a"/>`).join('')}
    <text x="378" y="36" class="t-small t-dim">${L('... 수천 번 반복', '... thousands of times')}</text>
    <text x="10" y="54" class="t-small t-dim">${L('상태 설정, uniform, draw를 스프라이트마다 CPU가 보냄', 'CPU sends state, uniforms and draw for every sprite')}</text>
    <text x="4" y="78" class="t-b">${L('B: 배칭', 'B: batching')}</text>
    <rect x="10" y="86" width="240" height="18" class="f-b" opacity="0.35"/><text x="130" y="99" text-anchor="middle" class="t-small">${L('정점 버퍼에 4꼭짓점씩 기록', 'Write 4 vertices per sprite')}</text>
    <rect x="254" y="86" width="50" height="18" class="f-b" opacity="0.65"/><text x="279" y="99" text-anchor="middle" class="t-small">${L('업로드', 'Upload')}</text>
    <rect x="308" y="86" width="50" height="18" class="f-b"/><text x="333" y="99" text-anchor="middle" class="t-small">draw 1</text>
    <text x="4" y="130">${L('텍스처 순서와 배치', 'Texture order and batches')}</text>
    ${[1, 1, 2, 2, 1, 3, 3, 1].map((t, i) => `<rect x="${10 + i * 26}" y="138" width="22" height="22" class="f-dim"/><text x="${21 + i * 26}" y="153" text-anchor="middle" class="t-small t-mono">${t}</text>`).join('')}
    ${[2, 4, 5, 7].map((i) => `<line x1="${8 + i * 26}" y1="134" x2="${8 + i * 26}" y2="164" class="d-accent"/>`).join('')}
    <text x="10" y="176" class="t-small t-dim">${L('텍스처가 바뀔 때마다 끊김: 배치 5개', 'Breaks at every texture change: 5 batches')}</text>
    <text x="300" y="130" class="t-b">${L('아틀라스: 한 장에 모음', 'Atlas: one sheet')}</text>
    ${[1, 1, 2, 2, 1, 3, 3, 1].map((t, i) => `<rect x="${300 + i * 26}" y="138" width="22" height="22" class="f-b" opacity="0.5"/><text x="${311 + i * 26}" y="153" text-anchor="middle" class="t-small t-mono">A</text>`).join('')}
    <text x="300" y="176" class="t-small t-dim">${L('끊김 없음: 배치 1개', 'No breaks: 1 batch')}</text>
  </svg>`,
  look: [
    '"draw call" 수를 비교하면 A는 스프라이트 수와 같고 B는 1. "스프라이트 수"를 늘리면 A의 "제출 CPU 시간"과 ⏱만 급격히 늘어남.',
    '"배치 색상화"를 켜면 A는 스프라이트마다 색이 제각각이고, B는 한 색임.',
    'B에서 아틀라스를 끄면(텍스처 4장) 텍스처가 바뀔 때마다 배치가 끊겨 draw call이 수천 개로 뜀.',
    '그 상태에서 "텍스처별 정렬"을 켜면 draw call이 4개로 줄어듦. 대신 그리는 순서(겹침)가 바뀜.',
    '"최대 배치 크기"를 작게 하면 버퍼가 차서 배치가 끊기는 지점이 생김.',
  ],
  refs: [
    { type: 'talk', title: 'Batch, Batch, Batch: What Does It Really Mean? (Matthias Wloka, NVIDIA)', year: 2003, note: 'GDC 2003. draw call당 CPU 비용과 배칭이 필요한 이유.' },
    { type: 'engine', title: 'Unity: Draw call batching', url: 'https://docs.unity3d.com/Manual/DrawCallBatching.html' },
    { type: 'engine', title: 'Unity: Sprite Atlas', url: 'https://docs.unity3d.com/Manual/sprite/atlas/atlas-landing.html' },
    { type: 'engine', title: 'XNA / MonoGame SpriteBatch (SpriteSortMode.Texture)', note: 'Begin과 End 사이의 스프라이트를 모아 텍스처 단위로 배칭하는 고전 API.' },
    { type: 'article', title: 'ANGLE_instanced_arrays (Khronos WebGL Extension)', url: 'https://registry.khronos.org/webgl/extensions/ANGLE_instanced_arrays/' },
  ],
  params: [
    { key: 'mode', label: '제출 방식', type: 'select', group: '렌더링', options: [
      { value: 'individual', label: '스프라이트당 draw call (uniform)' },
      { value: 'batch', label: '동적 정점 버퍼 배칭' },
      { value: 'instanced', label: '인스턴싱' },
    ], a: 'individual', b: 'batch' },
    { key: 'atlas', label: '텍스처 아틀라스', type: 'bool', default: true, help: '끄면 텍스처 4장을 따로 바인딩함' },
    { key: 'sort', label: '텍스처별 정렬', type: 'bool', default: false, when: (p) => !p.atlas },
    { key: 'maxBatch', label: '최대 배치 크기', type: 'select', options: [64, 256, 1024, 4096, 16384], default: 16384, when: (p) => p.mode === 'batch' },
    { key: 'tint', label: '배치 색상화', type: 'bool', default: false, group: '표시' },
    { key: 'count', label: '스프라이트 수', type: 'int', min: 100, max: 10000, default: 3000, shared: true, reset: true, group: '장면' },
    { key: 'move', label: '움직임', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Sprite Batching & Draw Calls',
    summary: 'If you change uniforms and issue one draw call per sprite, CPU and driver cost grows with the sprite count. If you gather the vertices in one buffer and draw them at once (batching), thousands of sprites take only a few calls.',
    views: { a: 'Draw call per sprite', b: 'Batching (atlas)' },
    info: `
    <p>A draw call is one command from the CPU to the GPU that says "draw this". The GPU draws tens of thousands of triangles in an instant.
    But <b>each draw call</b> has CPU costs, such as state checks, uniform uploads, and command buffer writes.</p>
    <p>If you use one draw call per sprite, the CPU becomes the bottleneck at a few thousand sprites. WebGL has a validation layer, so it costs even more.</p>
    <ul>
    <li><b>Batching</b>: the CPU transforms the four corners of each sprite and writes them one after another into a large vertex buffer. It uploads once and draws once.
    But you <b>must break the batch when the texture changes</b>. So a texture atlas (many images packed into one) or sorting by texture matters.</li>
    <li><b>Instancing</b>: uses one quad and a buffer of per-instance attributes (position, size, rotation, UV). The GPU transforms the vertices (<code>ANGLE_instanced_arrays</code>).</li>
    </ul>
    <p>Turn on "Color by batch" to paint sprites from the same draw call in the same color. You can see how batches split.</p>`,
    look: [
      'Compare the "draw call" count. A equals the sprite count, and B is 1. Raise "Sprite count". Only "Submit CPU time" and ⏱ in A rise sharply.',
      'Turn on "Color by batch". In A, every sprite has a different color. In B, they share one color.',
      'In B, turn off the atlas (4 textures). The batch breaks at every texture change, and draw calls jump into the thousands.',
      'Then turn on "Sort by texture". Draw calls drop to 4. But the draw order (overlap) changes.',
      'Make "Max batch size" small. The buffer fills up, and the batch breaks at those points.',
    ],
    refs: [
      'GDC 2003. CPU cost per draw call and why batching is needed.',
      null,
      null,
      'The classic API that gathers sprites between Begin and End and batches them by texture.',
      null,
    ],
    params: {
      mode: { label: 'Submit mode', group: 'Rendering', options: {
        individual: 'Draw call per sprite (uniform)', batch: 'Dynamic vertex buffer batching', instanced: 'Instancing',
      } },
      atlas: { label: 'Texture atlas', help: 'When off, binds 4 textures separately' },
      sort: 'Sort by texture',
      maxBatch: 'Max batch size',
      tint: { label: 'Color by batch', group: 'Display' },
      count: { label: 'Sprite count', group: 'Scene' },
      move: 'Movement',
    },
  },

  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, P = ctx.params;
    const inst = gl.getExtension('ANGLE_instanced_arrays');
    const N = P.count, rng = U.rng(ctx.seed * 13 + 1);
    // 스프라이트 상태
    const S = [];
    for (let i = 0; i < N; i++) S.push({
      x: rng.range(0, 1), y: rng.range(0, 1), vx: rng.range(-0.15, 0.15), vy: rng.range(-0.15, 0.15),
      size: rng.range(10, 26), rot: rng.range(0, 6.28), vr: rng.range(-2, 2), tex: rng.int(0, 3),
      r: rng.range(0.6, 1), g: rng.range(0.6, 1), b: rng.range(0.6, 1),
    });
    // 텍스처 4장 + 아틀라스 (2×2)
    const T = 32;
    function drawIcon(g, k, ox, oy) {
      g.save(); g.translate(ox + T / 2, oy + T / 2);
      g.fillStyle = ['#ff7a59', '#4fc3f7', '#66d17a', '#ffcb6b'][k];
      g.strokeStyle = '#ffffff'; g.lineWidth = 2;
      g.beginPath();
      if (k === 0) g.arc(0, 0, 13, 0, Math.PI * 2);
      else if (k === 1) for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i & 1 ? 6 : 14; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      else if (k === 2) g.rect(-11, -11, 22, 22);
      else { g.moveTo(0, -14); g.lineTo(13, 0); g.lineTo(0, 14); g.lineTo(-13, 0); }
      g.closePath(); g.fill(); g.stroke();
      g.restore();
    }
    const texs = [];
    for (let k = 0; k < 4; k++) { const c = ctx.createCanvas(T, T); drawIcon(c.getContext('2d'), k, 0, 0); texs.push(U.gl.texture(gl, c, { mipmap: true })); }
    const ac = ctx.createCanvas(T * 2, T * 2), ag = ac.getContext('2d');
    for (let k = 0; k < 4; k++) drawIcon(ag, k, (k & 1) * T, (k >> 1) * T);
    const atlasTex = U.gl.texture(gl, ac, {});
    const uvRect = (k, atlas) => atlas ? [(k & 1) * 0.5, (k >> 1) * 0.5, 0.5, 0.5] : [0, 0, 1, 1];

    const FS = `
      precision mediump float;
      uniform sampler2D u_tex; varying vec2 v_uv; varying vec4 v_col;
      void main(){ vec4 c = texture2D(u_tex, v_uv); gl_FragColor = vec4(c.rgb * v_col.rgb, c.a); }`;
    // 1) 개별: uniform으로 변환
    const progInd = U.gl.program(gl, `
      attribute vec2 a_corner;
      uniform vec2 u_res; uniform vec4 u_xf; uniform vec4 u_uvr; uniform vec4 u_col;
      varying vec2 v_uv; varying vec4 v_col;
      void main(){
        float s = sin(u_xf.w), c = cos(u_xf.w);
        vec2 p = vec2(a_corner.x * c - a_corner.y * s, a_corner.x * s + a_corner.y * c) * u_xf.z + u_xf.xy;
        v_uv = u_uvr.xy + (a_corner + 0.5) * u_uvr.zw;
        v_col = u_col;
        gl_Position = vec4(p.x / u_res.x * 2.0 - 1.0, 1.0 - p.y / u_res.y * 2.0, 0.0, 1.0);
      }`, FS);
    // 2) 배칭: CPU에서 변환된 정점
    const progBat = U.gl.program(gl, `
      attribute vec2 a_pos; attribute vec2 a_uv; attribute vec4 a_col;
      uniform vec2 u_res;
      varying vec2 v_uv; varying vec4 v_col;
      void main(){
        v_uv = a_uv; v_col = a_col;
        gl_Position = vec4(a_pos.x / u_res.x * 2.0 - 1.0, 1.0 - a_pos.y / u_res.y * 2.0, 0.0, 1.0);
      }`, FS);
    // 3) 인스턴싱: 인스턴스 속성
    const progIns = U.gl.program(gl, `
      attribute vec2 a_corner; attribute vec4 i_xf; attribute vec4 i_uvr; attribute vec4 i_col;
      uniform vec2 u_res;
      varying vec2 v_uv; varying vec4 v_col;
      void main(){
        float s = sin(i_xf.w), c = cos(i_xf.w);
        vec2 p = vec2(a_corner.x * c - a_corner.y * s, a_corner.x * s + a_corner.y * c) * i_xf.z + i_xf.xy;
        v_uv = i_uvr.xy + (a_corner + 0.5) * i_uvr.zw;
        v_col = i_col;
        gl_Position = vec4(p.x / u_res.x * 2.0 - 1.0, 1.0 - p.y / u_res.y * 2.0, 0.0, 1.0);
      }`, FS);

    // 단위 사각형 (-0.5..0.5) 6정점
    const cornerBuf = U.gl.buffer(gl, new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5]));
    const FPV = 8, VPS = 6;                                   // floats per vertex, verts per sprite
    const batchData = new Float32Array(N * VPS * FPV);
    const batchBuf = U.gl.buffer(gl, batchData.byteLength, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    const IPF = 12;                                           // instance floats
    const instData = new Float32Array(N * IPF);
    const instBuf = U.gl.buffer(gl, instData.byteLength, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);

    let order = S.map((_, i) => i), sortedFor = null;
    let stats = { calls: 0, binds: 0, bytes: 0, ms: 0 };
    const hue = (k) => { const h = (k * 0.618034) % 1; const f = (n) => { const q = (n + h * 6) % 6; return Math.max(0, Math.min(1, Math.min(q, 4 - q))); }; return [f(5) * 0.8 + 0.2, f(3) * 0.8 + 0.2, f(1) * 0.8 + 0.2]; };

    function resetAttribs() {
      for (let i = 0; i < 8; i++) { gl.disableVertexAttribArray(i); if (inst) inst.vertexAttribDivisorANGLE(i, 0); }
    }
    let boundTex = null;
    function bind(t) { if (t !== boundTex) { gl.bindTexture(gl.TEXTURE_2D, t); boundTex = t; stats.binds++; } }

    function drawIndividual(W, H, atlas) {
      progInd.use();
      gl.uniform2f(progInd.u('u_res'), W, H);
      gl.uniform1i(progInd.u('u_tex'), 0);
      U.gl.attrib(gl, progInd, 'a_corner', cornerBuf, 2);
      const lx = progInd.u('u_xf'), lu = progInd.u('u_uvr'), lc = progInd.u('u_col');
      for (let n = 0; n < order.length; n++) {
        const s = S[order[n]];
        bind(atlas ? atlasTex : texs[s.tex]);
        const uv = uvRect(s.tex, atlas);
        gl.uniform4f(lx, s.x * W, s.y * H, s.size, s.rot);
        gl.uniform4f(lu, uv[0], uv[1], uv[2], uv[3]);
        if (P.tint) { const c = hue(stats.calls); gl.uniform4f(lc, c[0], c[1], c[2], 1); } else gl.uniform4f(lc, s.r, s.g, s.b, 1);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        stats.calls++;
      }
      stats.bytes = 0;
    }

    function drawBatched(W, H, atlas) {
      progBat.use();
      gl.uniform2f(progBat.u('u_res'), W, H);
      gl.uniform1i(progBat.u('u_tex'), 0);
      const maxB = Math.min(+P.maxBatch, N);
      gl.bindBuffer(gl.ARRAY_BUFFER, batchBuf);
      const st = FPV * 4;
      const la = progBat.a('a_pos'), lb = progBat.a('a_uv'), lc = progBat.a('a_col');
      for (const [loc, size, off] of [[la, 2, 0], [lb, 2, 8], [lc, 4, 16]]) {
        if (loc < 0) continue;
        gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, st, off);
      }
      let count = 0, curTex = null, bytes = 0;
      const flush = () => {
        if (!count) return;
        bind(curTex);
        const sub = batchData.subarray(0, count * VPS * FPV);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, sub);
        bytes += sub.byteLength;
        gl.drawArrays(gl.TRIANGLES, 0, count * VPS);
        stats.calls++; count = 0;
      };
      const CX = [-0.5, 0.5, -0.5, -0.5, 0.5, 0.5], CY = [-0.5, -0.5, 0.5, 0.5, -0.5, 0.5];
      for (let n = 0; n < order.length; n++) {
        const s = S[order[n]], t = atlas ? atlasTex : texs[s.tex];
        if (t !== curTex || count >= maxB) { flush(); curTex = t; }
        const uv = uvRect(s.tex, atlas), cs = Math.cos(s.rot) * s.size, sn = Math.sin(s.rot) * s.size;
        const px = s.x * W, py = s.y * H;
        let r = s.r, g = s.g, b = s.b;
        if (P.tint) { const c = hue(stats.calls); r = c[0]; g = c[1]; b = c[2]; }
        let o = count * VPS * FPV;
        for (let v = 0; v < 6; v++) {
          const cx = CX[v], cy = CY[v];
          batchData[o] = px + cx * cs - cy * sn; batchData[o + 1] = py + cx * sn + cy * cs;
          batchData[o + 2] = uv[0] + (cx + 0.5) * uv[2]; batchData[o + 3] = uv[1] + (cy + 0.5) * uv[3];
          batchData[o + 4] = r; batchData[o + 5] = g; batchData[o + 6] = b; batchData[o + 7] = 1;
          o += FPV;
        }
        count++;
      }
      flush();
      stats.bytes = bytes;
    }

    function drawInstanced(W, H, atlas) {
      if (!inst) return drawBatched(W, H, atlas);
      progIns.use();
      gl.uniform2f(progIns.u('u_res'), W, H);
      gl.uniform1i(progIns.u('u_tex'), 0);
      U.gl.attrib(gl, progIns, 'a_corner', cornerBuf, 2);
      // 텍스처가 바뀌는 구간마다 인스턴스 draw 1회
      let start = 0, k = 0, curTex = null, bytes = 0;
      const runs = [];
      for (let n = 0; n < order.length; n++) {
        const s = S[order[n]], t = atlas ? atlasTex : texs[s.tex];
        if (t !== curTex) { if (n > start) runs.push([start, n, curTex]); start = n; curTex = t; }
        const uv = uvRect(s.tex, atlas), o = n * IPF;
        instData[o] = s.x * W; instData[o + 1] = s.y * H; instData[o + 2] = s.size; instData[o + 3] = s.rot;
        instData[o + 4] = uv[0]; instData[o + 5] = uv[1]; instData[o + 6] = uv[2]; instData[o + 7] = uv[3];
        const c = P.tint ? hue(runs.length) : [s.r, s.g, s.b];
        instData[o + 8] = c[0]; instData[o + 9] = c[1]; instData[o + 10] = c[2]; instData[o + 11] = 1;
        k++;
      }
      if (order.length > start) runs.push([start, order.length, curTex]);
      gl.bindBuffer(gl.ARRAY_BUFFER, instBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, instData.subarray(0, k * IPF));
      bytes = k * IPF * 4;
      const locs = [[progIns.a('i_xf'), 0], [progIns.a('i_uvr'), 16], [progIns.a('i_col'), 32]];
      for (const [r0, r1, t] of runs) {
        bind(t);
        for (const [loc, off] of locs) {
          if (loc < 0) continue;
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, IPF * 4, off + r0 * IPF * 4);
          inst.vertexAttribDivisorANGLE(loc, 1);
        }
        inst.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, r1 - r0);
        stats.calls++;
      }
      stats.bytes = bytes;
    }

    return {
      update(dt) {
        if (!P.move) return;
        for (const s of S) {
          s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt;
          if (s.x < 0 || s.x > 1) { s.vx = -s.vx; s.x = U.clamp(s.x, 0, 1); }
          if (s.y < 0 || s.y > 1) { s.vy = -s.vy; s.y = U.clamp(s.y, 0, 1); }
        }
      },
      render() {
        const W = ctx.width, H = ctx.height;
        const wantSort = !P.atlas && P.sort;
        if (sortedFor !== wantSort) {
          order = S.map((_, i) => i);
          if (wantSort) order.sort((a, b) => S[a].tex - S[b].tex || a - b);
          sortedFor = wantSort;
        }
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.colorMask(true, true, true, true);
        gl.clearColor(0.06, 0.07, 0.09, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.colorMask(true, true, true, false);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.activeTexture(gl.TEXTURE0);
        resetAttribs();
        stats.calls = 0; stats.binds = 0; boundTex = null;
        const t0 = ctx.now();
        if (P.mode === 'individual') drawIndividual(W, H, P.atlas);
        else if (P.mode === 'batch') drawBatched(W, H, P.atlas);
        else drawInstanced(W, H, P.atlas);
        const ms = ctx.now() - t0;
        stats.ms = stats.ms ? stats.ms * 0.9 + ms * 0.1 : ms;
        resetAttribs();
        gl.disable(gl.BLEND);
        gl.colorMask(true, true, true, true);
        ctx.stat(GTL.L('스프라이트', 'Sprites'), N);
        ctx.stat('draw call', stats.calls);
        ctx.stat(GTL.L('텍스처 바인딩', 'Texture binds'), stats.binds);
        ctx.stat(GTL.L('업로드/프레임', 'Upload/frame'), (stats.bytes / 1024).toFixed(0) + ' KB');
        ctx.stat(GTL.L('제출 CPU 시간', 'Submit CPU time'), stats.ms.toFixed(2) + ' ms');
        if (P.mode === 'instanced' && !inst) ctx.stat(GTL.L('인스턴싱', 'Instancing'), GTL.L('미지원 → 배칭으로 대체', 'Not supported → falls back to batching'));
      },
    };
  },
});
