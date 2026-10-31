// LOD 선택: 거리 기준 vs 화면 크기 기준 (Unreal LOD Screen Size, Unity LOD Group)
GTL.register({
  id: 'screen-size-lod',
  title: '화면 크기 기준 LOD (Unreal Screen Size, Unity LOD Group)',
  summary: 'LOD를 카메라 거리로 고르면 줌(FOV)을 당겼을 때 크게 보이는 물체가 저폴리로 남음. 화면에 투영된 크기로 고르면 FOV, 물체 크기와 상관없이 알맞은 LOD가 골라짐.',
  renderer: 'webgl',
  views: { a: '거리 기준 LOD', b: '화면 크기 기준 LOD' },
  controls: '마우스 드래그: 카메라 회전, 휠: 앞뒤 이동',
  info: `
    <p><b>LOD(Level of Detail)</b>는 같은 물체를 정밀도가 다른 메시 여러 개로 준비해 두고 상황에 맞게 바꿔 그리는 기법. 작게 보이는 물체에 삼각형을 덜 씀.</p>
    <p>가장 단순한 방식은 <b>카메라 거리</b>로 고르는 것. 하지만 같은 거리라도 화면에 보이는 크기는 달라짐:</p>
    <ul>
      <li>저격 조준경처럼 <b>FOV를 좁히면</b> 먼 물체가 화면을 크게 채움. 거리 기준은 여전히 저폴리를 고름.</li>
      <li>물체 자체가 크면 같은 거리에서도 크게 보임.</li>
    </ul>
    <p><b>화면 크기 기준</b>은 바운딩 구의 투영 크기를 화면 높이 대비 비율로 계산함. 대략 <code>s = r / (d tan(FOV/2))</code>. 이 값을 LOD별 기준값과 비교함.</p>
    <ul>
      <li>Unreal: Static Mesh의 LOD마다 <b>Screen Size</b> 값을 지정함.</li>
      <li>Unity: LOD Group이 <b>화면 높이 대비 비율(Screen Relative Transition Height)</b>로 전환함.</li>
    </ul>
    <p>비율이라 해상도가 바뀌어도 같은 LOD가 골라짐. 단점: 해상도를 낮춰도 삼각형 수가 그대로임. 그래서 엔진은 품질 설정별 LOD 배율(Unity <code>LOD Bias</code>, Unreal <code>r.StaticMeshLODDistanceScale</code>)을 따로 둠.</p>`,
  // 도식: 같은 거리의 같은 물체를 넓은 FOV와 좁은 FOV로 볼 때 투영 크기
  diagram: (L) => `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="14">${L('넓은 FOV (60도)', 'Wide FOV (60 deg)')}</text>
    <circle cx="30" cy="70" r="4" class="f-dim"/>
    <path d="M30,70 L200,22 L200,118 Z" class="d-dim"/>
    <circle cx="160" cy="70" r="9" class="f-a"/>
    <rect x="222" y="22" width="12" height="96" class="f-dim"/><rect x="222" y="58" width="12" height="24" class="f-a"/>
    <text x="228" y="132" text-anchor="middle" class="t-small">${L('약 25%', 'about 25%')}</text>
    <text x="30" y="132" class="t-small t-dim">${L('거리 d', 'distance d')}</text>
    <text x="300" y="14">${L('좁은 FOV (15도)', 'Narrow FOV (15 deg)')}</text>
    <circle cx="310" cy="70" r="4" class="f-dim"/>
    <path d="M310,70 L480,50 L480,90 Z" class="d-dim"/>
    <circle cx="440" cy="70" r="9" class="f-b"/>
    <rect x="502" y="22" width="12" height="96" class="f-dim"/><rect x="502" y="42" width="12" height="56" class="f-b"/>
    <text x="508" y="132" text-anchor="middle" class="t-small">${L('약 60%', 'about 60%')}</text>
    <text x="310" y="132" class="t-small t-dim">${L('같은 거리 d', 'same distance d')}</text>
    <text x="270" y="152" text-anchor="middle" class="t-small t-dim">${L('막대: 화면 높이 중 물체가 차지하는 비율', 'Bar: share of screen height the object covers')}</text>
    <text x="10" y="172" class="t-a">${L('거리 기준: d가 같으니 같은 LOD', 'Distance: same d, so same LOD')}</text>
    <text x="10" y="190" class="t-b">${L('화면 크기 기준: s = r / (d tan(FOV/2))가 커져 고품질 LOD', 'Screen size: s = r / (d tan(FOV/2)) grows, so a finer LOD')}</text>
  </svg>`,
  look: [
    '첫 화면(FOV 15도)에서 A는 크게 보이는 구가 빨강, 초록, 파랑(LOD1~3)이라 각진 실루엣이 보임. B는 대부분 흰색(LOD0)으로 매끈함.',
    'FOV를 60으로 올리면 두 뷰의 LOD 색이 거의 같아짐. 거리 기준값을 FOV 60에 맞춰 둔 결과임.',
    '"자동 줌"을 켜면 A는 줌을 당겨도 색이 그대로임. B는 줌에 따라 LOD가 바뀌어 삼각형 수가 따라 움직임.',
    '렌더 해상도를 낮추면 화면이 거칠어지지만 B의 LOD는 바뀌지 않음. 화면 크기를 비율로 재기 때문임.',
  ],
  refs: [
    { type: 'engine', title: 'Unreal Engine: Setting Up Automatic LOD Generation (Screen Size)', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/setting-up-automatic-lod-generation-in-unreal-engine', note: 'LOD마다 Screen Size 값으로 전환 시점을 정함.' },
    { type: 'engine', title: 'Unity Manual: LOD Group component reference', url: 'https://docs.unity3d.com/Manual/class-LODGroup.html', note: '화면 높이 대비 비율로 LOD를 전환함. Quality 설정의 LOD Bias가 배율.' },
    { type: 'book', title: 'Level of Detail for 3D Graphics (Luebke et al.)', year: 2002, note: '거리, 투영 크기, 화면 오차 기반 LOD 선택 기준을 정리한 책.' },
  ],
  params: [
    { key: 'method', label: 'LOD 선택 기준', type: 'select', group: 'LOD', options: [
      { value: 'distance', label: '카메라 거리' },
      { value: 'screen', label: '화면 크기 (투영 비율)' },
    ], a: 'distance', b: 'screen' },
    { key: 'lodScale', label: 'LOD 배율', type: 'range', min: 0.25, max: 4, step: 0.05, default: 1, help: '크면 고품질 LOD를 더 오래 유지 (Unity LOD Bias와 비슷)' },
    { key: 'lodColor', label: 'LOD 색 표시', type: 'bool', default: true, help: 'LOD0 흰색, LOD1 빨강, LOD2 초록, LOD3 파랑' },
    { key: 'fov', label: '카메라 FOV (도)', type: 'range', min: 5, max: 90, step: 1, default: 15, shared: true, group: '카메라', help: '작을수록 망원(조준경)' },
    { key: 'autoZoom', label: '자동 줌', type: 'bool', default: false, shared: true, help: 'FOV를 60도와 8도 사이로 반복' },
    { key: 'resScale', label: '렌더 해상도 배율', type: 'range', min: 0.25, max: 1, step: 0.05, default: 1, shared: true },
    { key: 'count', label: '물체 줄 수', type: 'int', min: 10, max: 40, default: 28, shared: true, reset: true, group: '장면' },
  ],
  en: {
    title: 'Screen Size LOD (Unreal Screen Size, Unity LOD Group)',
    summary: 'If you pick LOD by camera distance, objects that look big after a zoom (narrow FOV) stay low poly. If you pick LOD by projected screen size, the right LOD is chosen whatever the FOV or object size.',
    views: { a: 'Distance LOD', b: 'Screen size LOD' },
    controls: 'Mouse drag: rotate camera. Wheel: move forward and back.',
    info: `
    <p><b>LOD (Level of Detail)</b> means you prepare several meshes of one object with different detail and swap them as needed. Objects that look small use fewer triangles.</p>
    <p>The simplest way is to pick by <b>camera distance</b>. But at the same distance, the size on screen can differ:</p>
    <ul>
      <li>When you <b>narrow the FOV</b>, like a sniper scope, far objects fill a large part of the screen. Distance LOD still picks a low poly mesh.</li>
      <li>A big object looks big even at the same distance.</li>
    </ul>
    <p><b>Screen size LOD</b> computes the projected size of the bounding sphere as a fraction of screen height. Roughly <code>s = r / (d tan(FOV/2))</code>. It compares this value with a threshold per LOD.</p>
    <ul>
      <li>Unreal: each Static Mesh LOD has a <b>Screen Size</b> value.</li>
      <li>Unity: the LOD Group switches by <b>screen relative transition height</b>.</li>
    </ul>
    <p>It is a fraction, so the same LOD is chosen at any resolution. Downside: lowering the resolution does not lower the triangle count. So engines add a LOD scale per quality level (Unity <code>LOD Bias</code>, Unreal <code>r.StaticMeshLODDistanceScale</code>).</p>`,
    look: [
      'On first load (FOV 15 deg), the big spheres in A are red, green, and blue (LOD1~3) with jagged outlines. In B most are white (LOD0) and smooth.',
      'Raise FOV to 60. Both views show almost the same LOD colors. The distance thresholds are tuned for FOV 60.',
      'Turn on "Auto zoom". A keeps the same colors while zooming. In B the LOD follows the zoom, and the triangle count moves with it.',
      'Lower the render resolution. The image gets coarse, but B keeps the same LODs. It measures screen size as a fraction.',
    ],
    refs: ['Each LOD has a Screen Size value that sets when it switches.', 'Switches LOD by fraction of screen height. LOD Bias in Quality settings scales it.', 'A book that covers LOD selection by distance, projected size, and screen space error.'],
    params: {
      method: { label: 'LOD selection', group: 'LOD', options: { distance: 'Camera distance', screen: 'Screen size (projected fraction)' } },
      lodScale: { label: 'LOD scale', help: 'Higher keeps finer LODs longer (like Unity LOD Bias)' },
      lodColor: { label: 'Show LOD colors', help: 'LOD0 white, LOD1 red, LOD2 green, LOD3 blue' },
      fov: { label: 'Camera FOV (deg)', group: 'Camera', help: 'Smaller is more zoomed in (scope)' },
      autoZoom: { label: 'Auto zoom', help: 'Moves FOV back and forth between 60 and 8 deg' },
      resScale: 'Render resolution scale',
      count: { label: 'Object rows', group: 'Scene' },
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, G = U.geometry, P = ctx.params;
    gl.getExtension('OES_standard_derivatives');

    const vs = `
      attribute vec3 a_position; attribute vec3 a_normal;
      uniform mat4 u_vp; uniform mat4 u_model;
      varying vec3 v_wpos;
      void main(){
        vec4 w = u_model * vec4(a_position, 1.0);
        v_wpos = w.xyz;
        gl_Position = u_vp * w;
      }`;
    // 평면 셰이딩: 화면 미분으로 면 법선을 구해 삼각형 면이 보이게 함
    const fs = `
      #extension GL_OES_standard_derivatives : enable
      precision highp float;
      uniform vec3 u_color; uniform vec3 u_eye;
      varying vec3 v_wpos;
      void main(){
        vec3 n = normalize(cross(dFdx(v_wpos), dFdy(v_wpos)));
        vec3 l = normalize(vec3(0.4, 0.8, 0.45));
        float diff = 0.28 + 0.72 * max(dot(n, l), 0.0);
        vec3 c = u_color * diff;
        float d = length(v_wpos - u_eye);
        float fog = clamp((d - 60.0) / 120.0, 0.0, 0.7);
        gl_FragColor = vec4(mix(c, vec3(0.08, 0.09, 0.11), fog), 1.0);
      }`;
    const prog = U.gl.program(gl, vs, fs);
    const blitFs = `
      precision mediump float;
      uniform sampler2D u_tex; varying vec2 v_uv;
      void main(){ gl_FragColor = texture2D(u_tex, v_uv); }`;
    const blit = U.gl.program(gl, U.gl.QUAD_VS, blitFs);
    const quad = U.gl.quad(gl);

    // LOD 메시 4단계 (구 분할 수)
    const LODS = [[48, 24], [20, 10], [10, 6], [6, 4]].map(([s, r]) => {
      const g = G.sphere(1, s, r);
      return { mesh: G.upload(gl, g), tris: g.count / 3 };
    });
    const LOD_COLORS = [[0.92, 0.92, 0.92], [0.95, 0.32, 0.26], [0.3, 0.85, 0.38], [0.3, 0.52, 1.0]];
    // 화면 크기 기준값(화면 높이 대비 비율). 거리 기준값은 FOV 60, 반지름 1에서 같은 결과가 나오게 맞춤
    const SCREEN_T = [0.16, 0.07, 0.03];
    const REF_TAN = Math.tan(U.rad(30));
    const DIST_T = SCREEN_T.map((s) => 1 / (s * REF_TAN));
    const ground = G.upload(gl, G.plane(400, 1, 1));

    // 물체 배치 (시드 고정)
    const objs = [];
    for (let row = 0; row < P.count; row++) for (let col = -4; col <= 4; col++) {
      const r = ctx.rng.range(0.5, 1.6);
      objs.push({
        x: col * 4.5 + ctx.rng.range(-1, 1), z: -row * 4.5 + ctx.rng.range(-1, 1) - 20, r,
        color: [0.55 + ctx.rng.range(0, 0.3), 0.55 + ctx.rng.range(0, 0.3), 0.6 + ctx.rng.range(0, 0.3)],
      });
    }

    let yaw = 0, camZ = 0, dragging = false, lastX = 0, fb = null;
    const ensureFb = (w, h) => {
      if (fb && fb.width === w && fb.height === h) return fb;
      if (fb) fb.dispose();
      fb = U.gl.framebuffer(gl, w, h, { depth: true, filter: 'nearest' });
      return fb;
    };
    const currentFov = () => (P.autoZoom ? U.lerp(60, 8, 0.5 - 0.5 * Math.cos(ctx.time * 0.5)) : P.fov);

    return {
      update(dt) {
        camZ = U.clamp(camZ - ctx.input.mouse.wheel * 1.5, -60, 10);
        if (!dragging) yaw = Math.sin(ctx.time * 0.15) * 0.12;
      },
      onPointer(type, m) {
        if (type === 'down') { dragging = true; lastX = m.x; }
        else if (type === 'up' || type === 'leave') dragging = false;
        else if (type === 'move' && dragging) { yaw -= (m.x - lastX) * 0.004; lastX = m.x; }
      },
      render() {
        const fovDeg = currentFov(), tanH = Math.tan(U.rad(fovDeg) / 2);
        const aspect = ctx.width / ctx.height;
        const scaled = P.resScale < 0.999;
        const w = Math.max(1, Math.round(ctx.pixelWidth * P.resScale)), h = Math.max(1, Math.round(ctx.pixelHeight * P.resScale));
        if (scaled) ensureFb(w, h).bind();
        else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight); }
        gl.clearColor(0.08, 0.09, 0.11, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        const eye = [0, 2.2, 8 + camZ];
        const target = [eye[0] + Math.sin(yaw) * 10, 1.4, eye[2] - Math.cos(yaw) * 10];
        const view = M.lookAt(eye, target);
        const vp = M.multiply(M.perspective(U.rad(fovDeg), aspect, 0.1, 400), view);
        prog.use();
        gl.uniformMatrix4fv(prog.u('u_vp'), false, vp);
        gl.uniform3fv(prog.u('u_eye'), eye);

        gl.uniformMatrix4fv(prog.u('u_model'), false, M.translation(0, 0, -100));
        gl.uniform3fv(prog.u('u_color'), [0.2, 0.22, 0.25]);
        ground.draw(prog);

        const counts = [0, 0, 0, 0];
        let tris = 0;
        for (const o of objs) {
          const c = M.transformPoint(view, [o.x, o.r, o.z]);
          const depth = -c[2];
          if (depth < -o.r) continue;
          // 간단한 프러스텀 검사 (보이는 물체만 집계)
          if (Math.abs(c[0]) > Math.max(depth, 0) * tanH * aspect + o.r * 1.5 || Math.abs(c[1]) > Math.max(depth, 0) * tanH + o.r * 1.5) continue;
          const d = Math.hypot(o.x - eye[0], o.r - eye[1], o.z - eye[2]);
          let lod = 3;
          if (P.method === 'distance') {
            const dd = d / P.lodScale;
            lod = dd < DIST_T[0] ? 0 : dd < DIST_T[1] ? 1 : dd < DIST_T[2] ? 2 : 3;
          } else {
            const s = (o.r / (Math.max(d, 0.01) * tanH)) * P.lodScale;
            lod = s >= SCREEN_T[0] ? 0 : s >= SCREEN_T[1] ? 1 : s >= SCREEN_T[2] ? 2 : 3;
          }
          counts[lod]++;
          tris += LODS[lod].tris;
          gl.uniformMatrix4fv(prog.u('u_model'), false, M.multiply(M.translation(o.x, o.r, o.z), M.scaling(o.r)));
          gl.uniform3fv(prog.u('u_color'), P.lodColor ? LOD_COLORS[lod] : o.color);
          LODS[lod].mesh.draw(prog);
        }
        gl.disable(gl.CULL_FACE);

        if (scaled) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
          gl.disable(gl.DEPTH_TEST);
          blit.use();
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, fb.tex);
          gl.uniform1i(blit.u('u_tex'), 0);
          quad.draw(blit);
        }

        ctx.stat(GTL.L('삼각형 수', 'Triangles'), tris.toLocaleString());
        ctx.stat(GTL.L('LOD0 / 1 / 2 / 3 개수', 'LOD0 / 1 / 2 / 3 count'), counts.join(' / '));
        ctx.stat('FOV', fovDeg.toFixed(0) + GTL.L('도', ' deg'));
        ctx.stat(GTL.L('렌더 해상도', 'Render resolution'), w + 'x' + h);
      },
    };
  },
});
