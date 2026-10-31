// 2D 라이팅: 노멀맵 스프라이트 (높이맵 → 노멀맵, Lambert + Blinn-Phong 점광원)
GTL.register({
  id: 'normal-mapped-sprites',
  title: '2D 노멀맵 라이팅',
  summary: '평면 스프라이트에 픽셀별 법선(노멀맵)을 주면, 점광원이 움직일 때 벽돌 모서리, 홈, 부조가 입체적으로 빛을 받음. 노멀맵 없이 거리 감쇠만 쓰면 둥근 빛 얼룩만 보임.',
  renderer: 'webgl',
  views: { a: '거리 감쇠만 (평면)', b: '노멀맵 라이팅' },
  controls: '마우스: 광원 이동 (뷰 밖이면 자동 궤도)',
  info: `
    <p><b>노멀맵(Normal Map)</b>은 픽셀마다 표면이 향하는 방향(법선)을 RGB에 저장한 텍스처. 2D 게임의 동적 조명은 스프라이트 옆에 노멀맵을 함께 둠.</p>
    <p>프래그먼트마다 광원 방향 <code>L = normalize(lightPos − fragPos, lightHeight)</code>를 구함. 그리고 내적 <code>max(dot(N, L), 0)</code>으로 확산광을 계산.
    핵심은 빛이 화면 평면 위 <b>높이 z</b>에 떠 있다고 가정하는 것. 높이가 낮으면 빛이 스치듯 비춰 요철이 길게 강조됨. 높으면 정면광처럼 평평해짐.</p>
    <p>여기서는 절차적으로 만든 높이맵을 중앙 차분해 노멀맵을 만듦. Sprite Lamp, Laigter 같은 툴이 손그림으로 하는 일과 같음.
    Dead Cells는 3D 모델을 저해상도로 렌더링하면서 노멀도 함께 뽑아, 2D 스프라이트에 동적 조명을 적용했음.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 170" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <line x1="20" y1="140" x2="340" y2="140" class="d-dim"/>
    <polyline points="${Array.from({ length: 33 }, (_, i) => { const x = 20 + i * 10; return `${x},${140 - 14 * Math.max(0, Math.sin((x - 20) / 40 * Math.PI))}`; }).join(' ')}" class="d-line"/>
    ${[30, 50, 70, 110, 130, 150, 190, 210, 230, 270, 290, 310].map((x) => { const t = (x - 20) / 40 * Math.PI, s = Math.sin(t), y = 140 - 14 * Math.max(0, s), dy = s > 0 ? -14 * Math.cos(t) * Math.PI / 40 : 0, nx = dy, ny = -1, l = Math.hypot(nx, ny); return `<path d="M${x},${y} L${(x + nx / l * 22).toFixed(1)},${(y + ny / l * 22).toFixed(1)}" class="d-b" marker-end="url(#arr)"/>`; }).join('')}
    <circle cx="250" cy="34" r="8" class="f-accent"/>
    <text x="262" y="28" class="t-small">${L('광원 (높이 z)', 'Light (height z)')}</text>
    ${[110, 150, 290].map((x) => { const y = 140 - 14 * Math.max(0, Math.sin((x - 20) / 40 * Math.PI)); return `<line x1="${x}" y1="${y}" x2="250" y2="34" class="d-accent" stroke-dasharray="3 3" opacity="0.7"/>`; }).join('')}
    <text x="20" y="160" class="t-small t-dim">${L('파란 화살표 N: 노멀맵 RGB에서 읽은 법선. 점선 L: 광원 방향', 'Blue N: normal read from the normal map RGB. Dashed L: light direction')}</text>
    <text x="364" y="30" class="t-b">${L('B: 노멀맵 라이팅', 'B: normal map lighting')}</text>
    <text x="364" y="48" class="t-small t-mono">max(dot(N, L), 0)</text>
    <text x="364" y="64" class="t-small">${L('빛을 향한 면은 밝고', 'Faces toward the light are')}</text>
    <text x="364" y="78" class="t-small">${L('등진 면은 어두움', 'bright, faces away are dark')}</text>
    <text x="364" y="98" class="t-small t-dim">${L('z가 낮음: 요철이 길게 강조', 'Low z: bumps stand out')}</text>
    <text x="364" y="112" class="t-small t-dim">${L('z가 높음: 정면광처럼 평평', 'High z: flat, like front light')}</text>
    <text x="364" y="136" class="t-a">${L('A: 거리 감쇠만', 'A: distance falloff only')}</text>
    <text x="364" y="150" class="t-small t-dim">${L('N을 무시해서 평평함', 'Ignores N, so it looks flat')}</text>
  </svg>`,
  look: [
    '마우스로 빛을 움직이면 B의 벽돌 모서리는 빛 쪽이 밝아지고 반대쪽에 그림자가 짐. A는 둥근 얼룩만 움직임.',
    '"광원 높이"를 20 정도로 낮추면 스치는 빛(Grazing Light)에 표면 거칠기가 강하게 드러남. 400 이상이면 거의 평평해짐.',
    '"노멀 강도"를 키우면 요철이 과장되고, 0으로 내리면 A와 같아짐',
    '"보기"를 노멀맵으로 바꾸면 법선을 RGB(x→R, y→G, z→B)로 저장한 특유의 보라색 이미지가 보임',
  ],
  refs: [
    { type: 'engine', title: 'Godot: 2D lights and shadows (Normal maps)', url: 'https://docs.godotengine.org/en/stable/tutorials/2d/2d_lights_and_shadows.html' },
    { type: 'engine', title: 'Unity URP: 2D Lights / Secondary Textures (normal map)', url: 'https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@latest' },
    { type: 'article', title: 'Art Design Deep Dive: Using a 3D pipeline for 2D animation in Dead Cells (Thomas Vasseur)', year: 2018, note: 'Gamasutra. 3D 모델에서 픽셀아트 스프라이트와 노멀맵을 함께 뽑는 과정.' },
    { type: 'code', title: 'Sprite Lamp (Snake Hill Games)', year: 2014, note: '손그림 조명 레이어에서 2D 스프라이트용 노멀/깊이 맵을 만드는 도구' },
    { type: 'paper', title: 'Models of light reflection for computer synthesized pictures (James F. Blinn)', year: 1977, note: 'SIGGRAPH. Blinn-Phong 하이라이트의 원전.' },
  ],
  params: [
    { key: 'normals', label: '노멀맵 사용', type: 'bool', group: '라이팅', a: false, b: true },
    { key: 'strength', label: '노멀 강도', type: 'range', min: 0, max: 3, step: 0.01, default: 1, when: (p) => p.normals },
    { key: 'lightZ', label: '광원 높이 (px)', type: 'range', min: 10, max: 600, step: 1, default: 80 },
    { key: 'radius', label: '광원 반경 (px)', type: 'range', min: 60, max: 900, step: 1, default: 360 },
    { key: 'ambient', label: '환경광', type: 'range', min: 0, max: 0.6, step: 0.01, default: 0.08 },
    { key: 'specular', label: '하이라이트', type: 'range', min: 0, max: 2, step: 0.01, default: 0.6 },
    { key: 'extra', label: '추가 컬러 광원 2개', type: 'bool', default: true, shared: true },
    { key: 'view', label: '보기', type: 'select', group: '표시', options: [
      { value: 'lit', label: '최종 조명' },
      { value: 'normal', label: '노멀맵' },
      { value: 'albedo', label: '알베도' },
      { value: 'diffuse', label: '조명만 (흰 표면)' },
    ], default: 'lit' },
  ],
  en: {
    title: '2D Normal Map Lighting',
    summary: 'Give a flat sprite a per-pixel normal (a normal map). When a point light moves, brick edges, grooves, and reliefs catch the light in 3D. With only distance falloff and no normal map, you see just a round blob of light.',
    views: { a: 'Distance falloff only (flat)', b: 'Normal map lighting' },
    controls: 'Mouse: move the light (it orbits on its own when the mouse is outside the view)',
    info: `
    <p>A <b>normal map</b> is a texture that stores, in RGB, the direction each pixel of the surface faces (its normal). Dynamic lighting in 2D games keeps a normal map next to each sprite.</p>
    <p>Each fragment computes the light direction <code>L = normalize(lightPos − fragPos, lightHeight)</code>. Then the dot product <code>max(dot(N, L), 0)</code> gives the diffuse light.
    The key idea is to assume the light floats at a <b>height z</b> above the screen plane. A low light grazes the surface and stretches the bumps. A high light acts like a front light and looks flat.</p>
    <p>Here a procedural height map becomes a normal map through central differences. Tools like Sprite Lamp and Laigter do the same from hand-drawn art.
    Dead Cells rendered 3D models at low resolution and extracted normals at the same time. This gave its 2D sprites dynamic lighting.</p>`,
    look: [
    'Move the light with the mouse. In B the brick edges facing the light get brighter and the far side falls into shadow. In A only a round blob moves.',
    'Lower "Light height" to about 20. The grazing light strongly shows the surface roughness. At 400 or more it looks almost flat.',
    'Raise "Normal strength" and the bumps get exaggerated. Lower it to 0 and B looks the same as A.',
    'Set "View" to Normal map. You see the typical purple image that stores normals as RGB (x→R, y→G, z→B).',
    ],
    refs: [
    null,
    null,
    'Gamasutra. How they extracted pixel art sprites and normal maps together from 3D models.',
    'A tool that builds normal and depth maps for 2D sprites from hand-drawn lighting layers.',
    'SIGGRAPH. The original source of the Blinn-Phong highlight.',
    ],
    params: {
    normals: { label: 'Use normal map', group: 'Lighting' },
    strength: 'Normal strength',
    lightZ: 'Light height (px)',
    radius: 'Light radius (px)',
    ambient: 'Ambient light',
    specular: 'Highlight',
    extra: '2 extra colored lights',
    view: { label: 'View', group: 'Display', options: { lit: 'Final lighting', normal: 'Normal map', albedo: 'Albedo', diffuse: 'Lighting only (white surface)' } },
    },
  },

  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, P = ctx.params;
    const N = 256;
    const nz = U.noise(11);
    // ── 높이맵 + 알베도 생성 ──
    const hgt = new Float32Array(N * N), alb = new Uint8Array(N * N * 4);
    const rng = U.rng(3);
    const BW = 64, BH = 32, MORTAR = 3;
    const tints = []; for (let i = 0; i < 64; i++) tints.push(rng.range(0.8, 1.15));
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const row = Math.floor(y / BH), off = (row & 1) ? BW / 2 : 0;
      const bx = (x + off) % BW, by = y % BH, brick = row * 8 + Math.floor(((x + off) % N) / BW);
      const ex = Math.min(bx, BW - 1 - bx), ey = Math.min(by, BH - 1 - by), e = Math.min(ex, ey);
      const n1 = nz.fbm2(x / 9, y / 9, { octaves: 4 }), n2 = nz.fbm2(x / 2.5 + 40, y / 2.5, { octaves: 2 });
      let h, r, g, b;
      if (e < MORTAR) { // 줄눈
        h = 0.05 + n2 * 0.04;
        const m = 0.45 + n2 * 0.1; r = m; g = m * 0.95; b = m * 0.88;
      } else {
        const bevel = U.smoothstep(MORTAR, MORTAR + 6, e);
        h = 0.35 + 0.5 * bevel + n1 * 0.12 + n2 * 0.05;
        const tt = tints[brick & 63];
        r = (0.62 + n1 * 0.15) * tt; g = (0.3 + n1 * 0.08) * tt; b = (0.22 + n1 * 0.05) * tt;
        // 균열
        const crack = Math.abs(nz.perlin2(x / 14 + brick, y / 14));
        if (crack < 0.025) { h -= 0.25 * (1 - crack / 0.025); r *= 0.6; g *= 0.6; b *= 0.6; }
      }
      // 부조 메달리온 (중앙 근처)
      const cx = x - 128, cy = y - 112, rr = Math.hypot(cx, cy);
      if (rr < 30) {
        const ring = U.smoothstep(30, 27, rr) * (1 - U.smoothstep(22, 19, rr));
        const ang = Math.atan2(cy, cx), star = rr < 18 * (0.6 + 0.4 * Math.cos(5 * ang)) ? 1 : 0;
        h = Math.max(h * (1 - U.smoothstep(30, 26, rr)), 0.2) + ring * 0.7 + star * 0.55;
        const metal = Math.max(ring, star);
        if (rr < 27) { r = 0.55 + 0.3 * metal; g = 0.48 + 0.25 * metal; b = 0.3 + 0.1 * metal; }
      }
      const i = y * N + x;
      hgt[i] = h;
      alb[i * 4] = U.clamp(r, 0, 1) * 255; alb[i * 4 + 1] = U.clamp(g, 0, 1) * 255; alb[i * 4 + 2] = U.clamp(b, 0, 1) * 255;
      alb[i * 4 + 3] = rr < 27 ? 255 : 60; // a: 광택 마스크 (금속 부조는 강하게)
    }
    // 노멀 = normalize(-dh/dx*k, -dh/dy*k, 1). 이미지 공간(y 아래로 +) 기준.
    const nrm = new Uint8Array(N * N * 4), K = 18;
    const H = (x, y) => hgt[((y + N) % N) * N + ((x + N) % N)];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = (H(x + 1, y) - H(x - 1, y)) * 0.5 * K, dy = (H(x, y + 1) - H(x, y - 1)) * 0.5 * K;
      const l = Math.hypot(dx, dy, 1), i = (y * N + x) * 4;
      nrm[i] = (-dx / l * 0.5 + 0.5) * 255; nrm[i + 1] = (-dy / l * 0.5 + 0.5) * 255; nrm[i + 2] = (1 / l * 0.5 + 0.5) * 255; nrm[i + 3] = 255;
    }
    const albTex = U.gl.texture(gl, { width: N, height: N, data: alb }, { wrap: 'repeat', mipmap: true });
    const nrmTex = U.gl.texture(gl, { width: N, height: N, data: nrm }, { wrap: 'repeat', mipmap: true });

    const fs = `
      precision mediump float;
      uniform sampler2D u_alb; uniform sampler2D u_nrm;
      uniform vec2 u_res; uniform float u_tile;
      uniform vec3 u_lpos[3]; uniform vec3 u_lcol[3]; uniform float u_lcount;
      uniform float u_useN; uniform float u_strength; uniform float u_radius;
      uniform float u_ambient; uniform float u_spec; uniform float u_view;
      varying vec2 v_uv;
      void main(){
        vec2 p = vec2(v_uv.x, 1.0 - v_uv.y) * u_res;
        vec2 tuv = p / u_tile;
        vec4 a = texture2D(u_alb, tuv);
        vec3 n = texture2D(u_nrm, tuv).xyz * 2.0 - 1.0;
        n = normalize(vec3(n.xy * u_strength, n.z));
        if (u_useN < 0.5) n = vec3(0.0, 0.0, 1.0);
        if (u_view > 0.5 && u_view < 1.5) { gl_FragColor = vec4(n * 0.5 + 0.5, 1.0); return; }
        vec3 albedo = u_view > 2.5 ? vec3(0.8) : a.rgb;
        if (u_view > 1.5 && u_view < 2.5) { gl_FragColor = vec4(albedo, 1.0); return; }
        vec3 light = vec3(u_ambient);
        vec3 spec = vec3(0.0);
        for (int i = 0; i < 3; i++) {
          if (float(i) >= u_lcount) break;
          vec3 L = vec3(u_lpos[i].xy - p, u_lpos[i].z);
          float d = length(L.xy);
          vec3 Ln = normalize(L);
          float att = 1.0 / (1.0 + (d * d) / (u_radius * u_radius) * 6.0);
          att *= 1.0 - smoothstep(u_radius, u_radius * 1.6, d);
          float diff = max(dot(n, Ln), 0.0);
          vec3 Hh = normalize(Ln + vec3(0.0, 0.0, 1.0));
          float s = pow(max(dot(n, Hh), 0.0), 40.0) * a.a;
          light += u_lcol[i] * diff * att;
          spec += u_lcol[i] * s * att * u_spec;
        }
        vec3 c = albedo * light + spec;
        c = c / (1.0 + c * 0.25);
        gl_FragColor = vec4(pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2)), 1.0);
      }`;
    const prog = U.gl.program(gl, U.gl.QUAD_VS, fs);
    const quad = U.gl.quad(gl);
    let t = 0, lx = 0, ly = 0;
    const lpos = new Float32Array(9), lcol = new Float32Array(9);

    return {
      update(dt) { t += dt; },
      render() {
        const W = ctx.width, Ht = ctx.height, m = ctx.input.mouse;
        if (m.inside) { lx = m.x; ly = m.y; }
        else { lx = W * 0.5 + Math.cos(t * 0.6) * W * 0.3; ly = Ht * 0.5 + Math.sin(t * 0.9) * Ht * 0.28; }
        lpos.set([lx, ly, P.lightZ]); lcol.set([1.6, 1.35, 1.0]);
        let count = 1;
        if (P.extra) {
          lpos.set([W * 0.5 + Math.cos(t * 0.35 + 2) * W * 0.42, Ht * 0.5 + Math.sin(t * 0.5) * Ht * 0.4, P.lightZ * 0.7], 3); lcol.set([0.2, 0.55, 1.4], 3);
          lpos.set([W * 0.5 + Math.cos(-t * 0.45) * W * 0.35, Ht * 0.5 + Math.sin(-t * 0.3 + 1) * Ht * 0.35, P.lightZ * 0.7], 6); lcol.set([1.3, 0.25, 0.5], 6);
          count = 3;
        }
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        prog.use();
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, albTex);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, nrmTex);
        gl.uniform1i(prog.u('u_alb'), 0);
        gl.uniform1i(prog.u('u_nrm'), 1);
        gl.uniform2f(prog.u('u_res'), W, Ht);
        gl.uniform1f(prog.u('u_tile'), N * 1.25);
        gl.uniform3fv(prog.u('u_lpos'), lpos);
        gl.uniform3fv(prog.u('u_lcol'), lcol);
        gl.uniform1f(prog.u('u_lcount'), count);
        gl.uniform1f(prog.u('u_useN'), P.normals ? 1 : 0);
        gl.uniform1f(prog.u('u_strength'), P.strength);
        gl.uniform1f(prog.u('u_radius'), P.radius);
        gl.uniform1f(prog.u('u_ambient'), P.ambient);
        gl.uniform1f(prog.u('u_spec'), P.specular);
        gl.uniform1f(prog.u('u_view'), { lit: 0, normal: 1, albedo: 2, diffuse: 3 }[P.view]);
        quad.draw(prog);
        gl.activeTexture(gl.TEXTURE0);
        ctx.stat(GTL.L('광원 위치', 'Light position'), `${lx.toFixed(0)}, ${ly.toFixed(0)}, z=${P.lightZ.toFixed(0)}`);
        ctx.stat(GTL.L('광원 수', 'Light count'), count);
      },
    };
  },
});
