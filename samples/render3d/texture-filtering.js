// 텍스처 필터링: Nearest / Bilinear / Mipmap(Trilinear) / Anisotropic
// 참조 샘플(WebGL): 셰이더, 버퍼, 카메라 구성은 이 파일을 따름
GTL.register({
  id: 'texture-filtering',
  title: '텍스처 필터링 & 밉맵',
  summary: '먼 바닥에서 생기는 앨리어싱(모아레, 반짝임)을 비교. 밉맵과 비등방성 필터링을 함께 쓰면 먼 곳도 깨끗하고 선명함.',
  renderer: 'webgl',
  views: { a: 'Nearest, 밉맵 없음', b: 'Trilinear + 비등방성' },
  controls: '마우스 드래그: 카메라 회전, 휠: 카메라 높이',
  info: `
    <p><b>텍셀(texel)</b>은 텍스처의 픽셀. 원근으로 본 바닥은 멀수록 화면 픽셀 하나에 텍셀 수십~수백 개가 들어감.</p>
    <p>텍셀 하나만 골라 쓰면(<code>NEAREST</code>/<code>LINEAR</code>) 샘플이 너무 듬성듬성해짐. 그래서 <b>모아레 무늬</b>가 생기고, 움직이면 <b>반짝임</b>이 일어남.</p>
    <p><b>밉맵(mipmap)</b>은 1/2, 1/4… 크기로 미리 줄여 둔 이미지 묶음. GPU가 화면 미분(ddx/ddy)으로 알맞은 크기를 고름. 그래서 앨리어싱이 사라짐.</p>
    <p>단점: 비스듬한 면에서는 가장 긴 축 기준으로 레벨을 고름. 그래서 <b>너무 흐려짐</b>. <b>비등방성 필터링(anisotropic filtering)</b>은 긴 축 방향으로 여러 번 샘플링해 선명함을 지킴.</p>`,
  // 도식: 긴 타원 영역(먼 픽셀)을 샘플 하나, 밉맵, 비등방성 샘플로 읽는 차이
  diagram: (L) => `<svg viewBox="0 0 540 180" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="14" class="t-small t-dim">${L('먼 픽셀 하나가 덮는 텍셀', 'Texels under one far pixel')}</text>
    <line x1="20" y1="26" x2="20" y2="156" class="d-dim"/>
    <line x1="20" y1="26" x2="150" y2="26" class="d-dim"/>
    <line x1="33" y1="26" x2="33" y2="156" class="d-dim"/>
    <line x1="20" y1="39" x2="150" y2="39" class="d-dim"/>
    <line x1="46" y1="26" x2="46" y2="156" class="d-dim"/>
    <line x1="20" y1="52" x2="150" y2="52" class="d-dim"/>
    <line x1="59" y1="26" x2="59" y2="156" class="d-dim"/>
    <line x1="20" y1="65" x2="150" y2="65" class="d-dim"/>
    <line x1="72" y1="26" x2="72" y2="156" class="d-dim"/>
    <line x1="20" y1="78" x2="150" y2="78" class="d-dim"/>
    <line x1="85" y1="26" x2="85" y2="156" class="d-dim"/>
    <line x1="20" y1="91" x2="150" y2="91" class="d-dim"/>
    <line x1="98" y1="26" x2="98" y2="156" class="d-dim"/>
    <line x1="20" y1="104" x2="150" y2="104" class="d-dim"/>
    <line x1="111" y1="26" x2="111" y2="156" class="d-dim"/>
    <line x1="20" y1="117" x2="150" y2="117" class="d-dim"/>
    <line x1="124" y1="26" x2="124" y2="156" class="d-dim"/>
    <line x1="20" y1="130" x2="150" y2="130" class="d-dim"/>
    <line x1="137" y1="26" x2="137" y2="156" class="d-dim"/>
    <line x1="20" y1="143" x2="150" y2="143" class="d-dim"/>
    <line x1="150" y1="26" x2="150" y2="156" class="d-dim"/>
    <line x1="20" y1="156" x2="150" y2="156" class="d-dim"/>
    <ellipse cx="85" cy="91" rx="60" ry="13" class="d-accent" transform="rotate(-18 85 91)"/>
    <circle cx="60" cy="99" r="4" class="f-a"/>
    <text x="10" y="174" class="t-small t-a">${L('A: 텍셀 1개만 읽음, 모아레', 'A: reads 1 texel, moire')}</text>
    <text x="190" y="14" class="t-small t-dim">${L('밉맵: 미리 줄인 이미지 묶음', 'Mipmap: pre-shrunk copies')}</text>
    <rect x="190" y="76" width="64" height="64" class="f-dim"/>
    <text x="222" y="154" text-anchor="middle" class="t-small t-mono">0</text>
    <rect x="264" y="108" width="32" height="32" class="f-dim"/>
    <text x="280" y="154" text-anchor="middle" class="t-small t-mono">1</text>
    <rect x="306" y="124" width="16" height="16" class="f-dim"/>
    <text x="314" y="154" text-anchor="middle" class="t-small t-mono">2</text>
    <rect x="332" y="132" width="8" height="8" class="f-dim"/>
    <text x="336" y="154" text-anchor="middle" class="t-small t-mono">3</text>
    <text x="190" y="174" class="t-small">${L('긴 축 기준 레벨이라 흐려짐', 'Level by long axis, so blurry')}</text>
    <text x="380" y="14" class="t-small t-dim">${L('비등방성: 긴 축으로 여러 번', 'Aniso: taps along long axis')}</text>
    <ellipse cx="455" cy="91" rx="62" ry="13" class="d-accent" transform="rotate(-18 455 91)"/>
    <circle cx="409.3" cy="105.8" r="4" class="f-b"/>
    <circle cx="432.2" cy="98.4" r="4" class="f-b"/>
    <circle cx="455" cy="91" r="4" class="f-b"/>
    <circle cx="477.8" cy="83.6" r="4" class="f-b"/>
    <circle cx="500.7" cy="76.2" r="4" class="f-b"/>
    <text x="380" y="174" class="t-small t-b">${L('B: 작은 밉에서 5번 샘플', 'B: 5 taps on a finer mip')}</text>
  </svg>`,
  look: [
    'A 뷰에서 카메라를 천천히 돌리면 먼 바닥에 모아레 무늬와 반짝임이 보임',
    'B에서 비등방성을 1로 낮추면 먼 곳이 회색으로 뭉개짐. 16으로 올리면 선이 다시 살아남.',
    '"밉맵 레벨 시각화"를 켜면 거리마다 선택된 밉 레벨이 색으로 보임',
    'LOD bias를 +로 올리면 더 흐린 레벨이 쓰임. -로 내리면 더 선명하지만 앨리어싱이 돌아옴.',
  ],
  refs: [
    { type: 'paper', title: 'Pyramidal Parametrics (Lance Williams)', url: 'https://dl.acm.org/doi/10.1145/964967.801126', year: 1983, note: '밉맵(MIP = multum in parvo)을 처음 제안한 SIGGRAPH 논문' },
    { type: 'engine', title: 'Unity: Texture Import: Aniso Level / Mip Maps', url: 'https://docs.unity3d.com/Manual/class-TextureImporter.html' },
    { type: 'engine', title: 'Unreal Engine: Texture Streaming & Mip Bias', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/texture-streaming-overview-for-unreal-engine' },
    { type: 'article', title: 'EXT_texture_filter_anisotropic (Khronos)', url: 'https://registry.khronos.org/webgl/extensions/EXT_texture_filter_anisotropic/' },
  ],
  params: [
    { key: 'filter', label: '필터', type: 'select', group: '샘플링', options: [
      { value: 'nearest', label: 'Nearest' },
      { value: 'linear', label: 'Bilinear' },
      { value: 'mipNearest', label: 'Nearest + 밉맵 (Nearest mip)' },
      { value: 'trilinear', label: 'Trilinear (Linear mip)' },
    ], a: 'nearest', b: 'trilinear' },
    { key: 'aniso', label: '비등방성', type: 'select', options: [1, 2, 4, 8, 16], a: 1, b: 16, help: '밉맵 필터에서만 효과 있음' },
    { key: 'lodBias', label: 'LOD bias', type: 'range', min: -3, max: 3, step: 0.1, default: 0, when: (p) => p.filter === 'trilinear' || p.filter === 'mipNearest' },
    { key: 'showMips', label: '밉맵 레벨 시각화', type: 'bool', default: false },
    { key: 'pattern', label: '패턴', type: 'select', group: '장면', options: [
      { value: 'checker', label: '체커보드' },
      { value: 'lines', label: '가는 선' },
      { value: 'noise', label: '노이즈 + 문자' },
    ], default: 'checker', shared: true, reset: true },
    { key: 'tiling', label: '반복 횟수', type: 'int', min: 4, max: 200, default: 60, shared: true },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Texture Filtering & Mipmaps',
    summary: 'Compare the aliasing (moire, shimmering) on a distant floor. Mipmaps plus anisotropic filtering keep far areas clean and sharp.',
    views: { a: 'Nearest, no mipmaps', b: 'Trilinear + anisotropic' },
    controls: 'Mouse drag: rotate camera. Wheel: camera height.',
    info: `
    <p>A <b>texel</b> is a pixel of a texture. On a floor seen in perspective, one screen pixel covers tens or hundreds of texels far away.</p>
    <p>If you pick just one texel (<code>NEAREST</code>/<code>LINEAR</code>), the samples are too sparse. This causes <b>moire patterns</b>, and <b>shimmering</b> when the camera moves.</p>
    <p>A <b>mipmap</b> is a set of images shrunk ahead of time to 1/2, 1/4, and so on. The GPU picks the right size from screen derivatives (ddx/ddy). This removes the aliasing.</p>
    <p>Downside: on slanted surfaces the GPU picks the level by the longest axis. So the image gets <b>too blurry</b>. <b>Anisotropic filtering</b> takes several samples along the long axis and keeps the image sharp.</p>`,
    look: [
      'In view A, rotate the camera slowly. You see moire patterns and shimmering on the far floor.',
      'In B, lower anisotropy to 1. The far area blurs to gray. Raise it to 16 and the lines come back.',
      'Turn on "Show mip levels". The chosen mip level shows as a color at each distance.',
      'Raise LOD bias above 0 to use blurrier levels. Lower it below 0 for sharper levels, but aliasing comes back.',
    ],
    refs: ['The SIGGRAPH paper that first proposed mipmaps (MIP = multum in parvo).', null, null, null],
    params: {
      filter: { label: 'Filter', group: 'Sampling', options: { mipNearest: 'Nearest + mipmaps (Nearest mip)' } },
      aniso: { label: 'Anisotropy', help: 'Works only with mipmap filters' },
      showMips: 'Show mip levels',
      pattern: { label: 'Pattern', group: 'Scene', options: { checker: 'Checkerboard', lines: 'Thin lines', noise: 'Noise + text' } },
      tiling: 'Tiling count',
      autoRotate: 'Auto rotate',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params;

    const vs = `
      attribute vec3 a_position; attribute vec2 a_uv;
      uniform mat4 u_mvp; uniform float u_tiling;
      varying vec2 v_uv;
      void main(){
        v_uv = a_uv * u_tiling;
        gl_Position = u_mvp * vec4(a_position, 1.0);
      }`;
    const fs = `
      #extension GL_OES_standard_derivatives : enable
      precision highp float;
      uniform sampler2D u_tex; uniform float u_bias; uniform float u_showMips; uniform float u_texSize;
      varying vec2 v_uv;
      void main(){
        vec4 c = texture2D(u_tex, v_uv, u_bias);
        if (u_showMips > 0.5) {
          vec2 dx = dFdx(v_uv * u_texSize), dy = dFdy(v_uv * u_texSize);
          float lod = 0.5 * log2(max(dot(dx,dx), dot(dy,dy))) + u_bias;
          float l = clamp(lod, 0.0, 5.0);
          vec3 m = mix(vec3(0.2,0.5,1.0), vec3(1.0,0.3,0.2), l/5.0);
          c.rgb = mix(c.rgb, m, 0.55);
        }
        gl_FragColor = vec4(c.rgb, 1.0);
      }`;
    gl.getExtension('OES_standard_derivatives');
    const prog = U.gl.program(gl, vs, fs);
    const plane = U.geometry.upload(gl, U.geometry.plane(400, 1, 1));
    const anisoExt = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
    const maxAniso = anisoExt ? gl.getParameter(anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1;

    // 절차적 텍스처 (외부 이미지 없이 생성)
    const SIZE = 256;
    const cv = ctx.createCanvas(SIZE, SIZE), g = cv.getContext('2d');
    if (P.pattern === 'checker') {
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#f2f2f2' : '#1a1a1a'; g.fillRect(x * 32, y * 32, 32, 32); }
    } else if (P.pattern === 'lines') {
      g.fillStyle = '#202428'; g.fillRect(0, 0, SIZE, SIZE);
      g.fillStyle = '#e8e8e8';
      for (let i = 0; i < SIZE; i += 16) { g.fillRect(i, 0, 2, SIZE); g.fillRect(0, i, SIZE, 2); }
    } else {
      const n = U.noise(3);
      const img = g.createImageData(SIZE, SIZE);
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        const v = (n.fbm2(x / 32, y / 32, { octaves: 4 }) * 0.5 + 0.5) * 255, i = (y * SIZE + x) * 4;
        img.data[i] = v * 0.6; img.data[i + 1] = v * 0.8; img.data[i + 2] = v; img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      g.fillStyle = '#fff'; g.font = 'bold 40px monospace'; g.fillText('GTL', 70, 140);
    }
    const tex = U.gl.texture(gl, cv, { wrap: 'repeat', mipmap: true });

    let yaw = 0.3, height = 2.2, dragging = false, lastX = 0;

    function applyFilter() {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      const f = P.filter;
      const min = { nearest: gl.NEAREST, linear: gl.LINEAR, mipNearest: gl.NEAREST_MIPMAP_NEAREST, trilinear: gl.LINEAR_MIPMAP_LINEAR }[f];
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f === 'nearest' || f === 'mipNearest' ? gl.NEAREST : gl.LINEAR);
      if (anisoExt) gl.texParameterf(gl.TEXTURE_2D, anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(maxAniso, +P.aniso));
    }

    return {
      update(dt) {
        if (P.autoRotate && !dragging) yaw += dt * 0.08;
        height = U.clamp(height + ctx.input.mouse.wheel * 0.3, 0.4, 20);
      },
      onPointer(type, m) {
        if (type === 'down') { dragging = true; lastX = m.x; }
        else if (type === 'up') dragging = false;
        else if (type === 'move' && dragging) { yaw -= (m.x - lastX) * 0.005; lastX = m.x; }
      },
      render() {
        applyFilter();
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clearColor(0.08, 0.09, 0.11, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        const proj = M.perspective(U.rad(60), ctx.width / ctx.height, 0.1, 500);
        const eye = [0, height, 0];
        const target = [Math.sin(yaw) * 10, height * 0.6, -Math.cos(yaw) * 10];
        const view = M.lookAt(eye, target);
        prog.use();
        gl.uniformMatrix4fv(prog.u('u_mvp'), false, M.multiply(proj, view));
        gl.uniform1f(prog.u('u_tiling'), P.tiling);
        gl.uniform1f(prog.u('u_bias'), P.filter === 'trilinear' || P.filter === 'mipNearest' ? P.lodBias : 0);
        gl.uniform1f(prog.u('u_showMips'), P.showMips ? 1 : 0);
        gl.uniform1f(prog.u('u_texSize'), SIZE);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(prog.u('u_tex'), 0);
        plane.draw(prog);
        ctx.stat(GTL.L('최대 비등방성(GPU)', 'Max anisotropy (GPU)'), anisoExt ? maxAniso : GTL.L('미지원', 'Not supported'));
        ctx.stat(GTL.L('카메라 높이', 'Camera height'), height.toFixed(1));
      },
    };
  },
});
