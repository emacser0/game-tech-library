// 포스트 프로세스: CRT 시뮬레이션 (곡률, 스캔라인, 섀도 마스크, 색수차, 비네트, 글로우)
GTL.register({
  id: 'crt-postfx',
  title: 'CRT 포스트 프로세스',
  summary: '저해상도 게임 화면을 그대로 확대하면 각진 픽셀이 보임. 하지만 당시 아트는 CRT의 스캔라인, 형광체 번짐, 마스크를 전제로 그렸음. 풀스크린 셰이더 하나로 이를 재현함.',
  renderer: 'webgl',
  views: { a: '원본 (Nearest 확대)', b: 'CRT 셰이더' },
  info: `
    <p>포스트 프로세스(Post Process)는 장면을 먼저 텍스처로 렌더링하고, 화면 크기 사각형에 프래그먼트 셰이더를 돌려 픽셀마다 효과를 계산하는 방식.</p>
    <p>이 샘플은 320×180 게임 화면을 매 프레임 텍스처로 올리고 다음 효과를 적용함.</p>
    <ul>
    <li><b>곡률</b>: UV를 중심에서 바깥으로 휘어 볼록한 브라운관 유리를 흉내 냄.</li>
    <li><b>스캔라인</b>: 원본 한 줄 안에서 세로 위치에 따라 가우시안으로 밝기를 줌. 밝은 줄일수록 빔이 굵어지는 효과도 포함.</li>
    <li><b>마스크</b>: 화면 픽셀 단위의 R/G/B 세로 줄(아파처 그릴), 엇갈린 점(섀도 마스크), 슬롯 마스크.</li>
    <li><b>색수차</b>: R, B 채널을 중심 방향으로 약간 어긋나게 샘플링.</li>
    <li><b>글로우, 비네트, 노이즈</b>: 형광체 번짐, 가장자리 어둡게 하기, 미세한 깜빡임.</li>
    </ul>
    <p>스캔라인과 마스크는 밝기를 깎으므로 보정 게인을 곱함. 연산은 선형 공간(감마 2.2 디코드)에서 함.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 170" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="14" class="t-a">${L('A: Nearest 확대', 'A: Nearest scale')}</text>
    ${[0.9, 0.5, 0.25].map((o, i) => `<rect x="10" y="${24 + i * 30}" width="140" height="30" class="f-a" opacity="${o}"/>`).join('')}
    <text x="10" y="128" class="t-small t-dim">${L('원본 한 줄 = 평평한 띠', 'One source row = flat band')}</text>
    <text x="180" y="14" class="t-b">${L('B: 스캔라인 + 마스크', 'B: scanlines + mask')}</text>
    ${[[0.9, 26], [0.5, 18], [0.25, 12]].map(([o, h], i) => `<rect x="180" y="${39 + i * 30 - h / 2}" width="140" height="${h}" class="f-a" opacity="${o}"/><rect x="180" y="${39 + i * 30 - h / 4}" width="140" height="${h / 2}" class="f-a" opacity="${o}"/>`).join('')}
    ${Array.from({ length: 46 }, (_, i) => `<rect x="${180 + i * 3}" y="24" width="1.2" height="90" class="${['f-bad', 'f-good', 'f-b'][i % 3]}" opacity="0.45"/>`).join('')}
    <text x="180" y="128" class="t-small t-dim">${L('줄 사이 어둠 + RGB 세로 줄', 'Dark gaps + RGB stripes')}</text>
    <line x1="360" y1="110" x2="530" y2="110" class="d-dim"/><line x1="360" y1="110" x2="360" y2="24" class="d-dim"/>
    <polyline points="${Array.from({ length: 35 }, (_, i) => { const x = i / 34; return `${360 + x * 170},${110 - 80 * Math.exp(-Math.pow((x - 0.5) / 0.22, 2))}`; }).join(' ')}" class="d-a"/>
    <polyline points="${Array.from({ length: 35 }, (_, i) => { const x = i / 34; return `${360 + x * 170},${110 - 28 * Math.exp(-Math.pow((x - 0.5) / 0.11, 2))}`; }).join(' ')}" class="d-b"/>
    <text x="368" y="20" class="t-small t-a">${L('밝은 줄: 빔이 굵음', 'Bright row: wide beam')}</text>
    <text x="474" y="96" class="t-small t-b">${L('어두운 줄', 'Dark row')}</text>
    <text x="445" y="124" text-anchor="middle" class="t-small t-dim">${L('줄 안의 세로 위치', 'Vertical position in a row')}</text>
    <text x="10" y="150" class="t-small t-dim">${L('곡률: UV를 중심에서 바깥으로 휨. 색수차: R과 B를 중심 쪽으로 조금 어긋나게 읽음.', 'Curvature bends UV outward. Chromatic aberration reads R and B slightly offset.')}</text>
    <text x="10" y="164" class="t-small t-dim">${L('스캔라인과 마스크가 깎은 밝기는 게인을 곱해 되돌림.', 'A gain restores the brightness that scanlines and mask remove.')}</text>
  </svg>`,
  look: [
    'B를 가까이 보면 화면 픽셀 단위의 R/G/B 마스크 줄과 원본 줄마다의 스캔라인이 보임. 멀리서 보면 픽셀아트가 부드럽게 "녹음".',
    '"마스크"를 바꾸면 아파처 그릴(Trinitron), 섀도 마스크, 슬롯 마스크의 질감 차이가 보임.',
    '"곡률"을 0으로 두고 "색수차"를 크게 하면 효과 하나의 기여만 따로 보임.',
    '창을 작게 해서 확대 배율을 낮추면 마스크가 모아레(물결무늬)를 만듦. 실제 CRT 셰이더들이 고해상도 디스플레이를 권장하는 이유.',
  ],
  refs: [
    { type: 'code', title: 'libretro slang-shaders (crt-royale, crt-geom, crt-lottes 등)', url: 'https://github.com/libretro/slang-shaders', note: '에뮬레이터용 CRT 셰이더 모음. 마스크, 스캔라인, 곡률 구현 참고.' },
    { type: 'code', title: 'CRT shader (Timothy Lottes)', note: '퍼블릭 도메인 CRT 셰이더. 가우시안 스캔라인, 섀도 마스크, 곡률을 구현. libretro에 crt-lottes로 포함.' },
    { type: 'game', title: 'Balatro (LocalThunk)', year: 2024, note: '설정에서 조절하는 CRT 포스트 프로세스를 아트 스타일의 일부로 사용.' },
  ],
  params: [
    { key: 'on', label: 'CRT 효과', type: 'bool', group: '효과', a: false, b: true },
    { key: 'curv', label: '곡률', type: 'range', min: 0, max: 0.5, step: 0.01, default: 0.18, when: (p) => p.on },
    { key: 'scan', label: '스캔라인', type: 'range', min: 0, max: 1, step: 0.01, default: 0.75, when: (p) => p.on },
    { key: 'mask', label: '마스크', type: 'select', options: [
      { value: 0, label: '없음' },
      { value: 1, label: '아파처 그릴 (RGB 세로줄)' },
      { value: 2, label: '섀도 마스크 (엇갈린 점)' },
      { value: 3, label: '슬롯 마스크' },
    ], default: 1, when: (p) => p.on },
    { key: 'maskDark', label: '마스크 어두움', type: 'range', min: 0, max: 1, step: 0.01, default: 0.5, when: (p) => p.on && p.mask !== 0 },
    { key: 'ca', label: '색수차', type: 'range', min: 0, max: 3, step: 0.05, default: 0.6, when: (p) => p.on, help: '원본 픽셀 단위' },
    { key: 'glow', label: '글로우', type: 'range', min: 0, max: 1, step: 0.01, default: 0.35, when: (p) => p.on },
    { key: 'vig', label: '비네트', type: 'range', min: 0, max: 1, step: 0.01, default: 0.5, when: (p) => p.on },
    { key: 'noise', label: '노이즈/깜빡임', type: 'range', min: 0, max: 0.2, step: 0.005, default: 0.03, when: (p) => p.on },
  ],

  en: {
    title: 'CRT Post-Processing',
    summary: 'If you scale up a low-res game screen as is, you see blocky pixels. But artists of that time drew for CRT scanlines, phosphor glow, and masks. One fullscreen shader brings these back.',
    views: { a: 'Original (nearest upscale)', b: 'CRT shader' },
    info: `
    <p>Post processing first renders the scene to a texture. Then it runs a fragment shader on a screen-sized quad and computes the effect for each pixel.</p>
    <p>This sample uploads a 320x180 game screen to a texture every frame and applies these effects.</p>
    <ul>
    <li><b>Curvature</b>: bend the UVs outward from the center to imitate the curved glass of a picture tube.</li>
    <li><b>Scanlines</b>: within each source row, set the brightness with a Gaussian of the vertical position. Brighter rows also get a thicker beam.</li>
    <li><b>Mask</b>: per-screen-pixel R/G/B vertical stripes (aperture grille), staggered dots (shadow mask), or a slot mask.</li>
    <li><b>Chromatic aberration</b>: sample the R and B channels slightly offset toward the center.</li>
    <li><b>Glow, vignette, noise</b>: phosphor glow, darker edges, and a slight flicker.</li>
    </ul>
    <p>Scanlines and masks reduce brightness, so the shader multiplies by a compensating gain. The math runs in linear space (gamma 2.2 decode).</p>`,
    look: [
    'Look at B up close. You see R/G/B mask stripes per screen pixel and a scanline for each source row. From a distance the pixel art "melts" smoothly.',
    'Change "Mask" to see the texture of aperture grille (Trinitron), shadow mask, and slot mask.',
    'Set "Curvature" to 0 and raise "Chromatic aberration". You see the effect of that one setting alone.',
    'Make the window small to lower the scale. The mask creates moire (wave patterns). This is why real CRT shaders recommend high-res displays.',
    ],
    refs: [
    { title: 'libretro slang-shaders (crt-royale, crt-geom, crt-lottes, and more)', note: 'A collection of CRT shaders for emulators. A good reference for masks, scanlines, and curvature.' },
    'A public domain CRT shader. It implements Gaussian scanlines, a shadow mask, and curvature. Included in libretro as crt-lottes.',
    'Uses a CRT post process, adjustable in the settings, as part of its art style.',
    ],
    params: {
      on: { label: 'CRT effect', group: 'Effects' },
      curv: 'Curvature',
      scan: 'Scanlines',
      mask: { label: 'Mask', options: { 0: 'None', 1: 'Aperture grille (RGB stripes)', 2: 'Shadow mask (staggered dots)', 3: 'Slot mask' } },
      maskDark: 'Mask darkness',
      ca: { label: 'Chromatic aberration', help: 'In source pixels' },
      glow: 'Glow',
      vig: 'Vignette',
      noise: 'Noise/flicker',
    },
  },

  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, P = ctx.params;
    const GW = 320, GH = 180;
    const cv = ctx.createCanvas(GW, GH), g = cv.getContext('2d');
    const rng = U.rng(9);
    const stars = []; for (let i = 0; i < 60; i++) stars.push([rng.int(0, GW * 2), rng.int(0, 90), rng.pick(['#ffffff', '#89ddff', '#ffcb6b'])]);
    const hills = []; for (let i = 0; i < 40; i++) hills.push(rng.range(20, 50));
    const coins = []; for (let i = 0; i < 8; i++) coins.push([rng.int(0, 600), rng.int(70, 120)]);
    // 3x5 픽셀 숫자 폰트
    const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
    const text = (str, x, y, c) => {
      g.fillStyle = c;
      for (let k = 0; k < str.length; k++) {
        const d = DIG[+str[k]]; if (!d) continue;
        for (let i = 0; i < 15; i++) if (d[i] === '1') g.fillRect(x + k * 4 + (i % 3), y + Math.floor(i / 3), 1, 1);
      }
    };
    function drawGame(t) {
      g.imageSmoothingEnabled = false;
      // 하늘 띠
      const sky = ['#1a1040', '#2a1858', '#3c2070', '#5a2a80', '#7a3a88', '#a04a80', '#d06a70'];
      sky.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 14, GW, 14); });
      const camX = Math.floor(t * 30);
      for (const [x, y, c] of stars) { g.fillStyle = c; g.fillRect(((x - camX * 0.1) % (GW * 2) + GW * 2) % (GW * 2) - GW / 2, y, 1, 1); }
      g.fillStyle = '#ffdd88'; g.beginPath(); g.arc(250, 70, 18, 0, Math.PI * 2); g.fill();
      // 먼 산 (패럴랙스)
      g.fillStyle = '#3a1e5a';
      for (let i = 0; i < 40; i++) { const x = ((i * 24 - camX * 0.3) % 960 + 960) % 960 - 40; g.beginPath(); g.moveTo(x, 130); g.lineTo(x + 24, 130 - hills[i]); g.lineTo(x + 48, 130); g.fill(); }
      // 땅 타일
      for (let x = -16; x < GW + 16; x += 16) {
        const tx = x - (camX % 16);
        g.fillStyle = '#2a8a3a'; g.fillRect(tx, 140, 16, 4);
        g.fillStyle = '#6a4020'; g.fillRect(tx, 144, 16, 36);
        g.fillStyle = '#4a2810'; g.fillRect(tx + 15, 144, 1, 36); g.fillRect(tx, 160, 16, 1);
      }
      // 코인
      for (const [x, y] of coins) {
        const cx = ((x - camX) % 640 + 640) % 640 - 160, w = Math.abs(Math.round(Math.sin(t * 6 + x) * 3)) + 1;
        g.fillStyle = '#ffcb3a'; g.fillRect(cx - w, y, w * 2, 8); g.fillStyle = '#fff6c0'; g.fillRect(cx - w + 1, y + 1, 1, 3);
      }
      // 플레이어
      const py = 124 - Math.abs(Math.sin(t * 3)) * 26;
      g.fillStyle = '#140c1c'; g.fillRect(80, py, 12, 16);
      g.fillStyle = '#d83a3a'; g.fillRect(81, py + 1, 10, 6);
      g.fillStyle = '#f0c8a0'; g.fillRect(82, py + 7, 8, 4);
      g.fillStyle = '#4b7bd8'; g.fillRect(81, py + 11, 10, 4);
      g.fillStyle = '#ffffff'; g.fillRect(87, py + 8, 1, 1);
      // HUD
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(4, 4, 60, 9);
      text(String(10000 + Math.floor(t * 37) % 90000).padStart(6, '0'), 6, 6, '#ffffff');
      g.fillStyle = '#ff5370'; for (let i = 0; i < 3; i++) g.fillRect(GW - 14 - i * 9, 6, 6, 5);
    }
    const tex = U.gl.texture(gl, cv, { filter: 'nearest' });

    const fs = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      uniform sampler2D u_tex; uniform vec2 u_src; uniform vec2 u_out; uniform vec2 u_org;
      uniform float u_on; uniform float u_curv; uniform float u_scan; uniform float u_mask; uniform float u_maskDark;
      uniform float u_ca; uniform float u_glow; uniform float u_vig; uniform float u_noise; uniform float u_time;
      varying vec2 v_uv;
      vec3 dec(vec3 c){ return pow(c, vec3(2.2)); }
      vec3 fetch(vec2 uv){ return dec(texture2D(u_tex, vec2(uv.x, 1.0 - uv.y)).rgb); }
      vec2 curve(vec2 uv){
        uv = uv * 2.0 - 1.0;
        vec2 off = abs(uv.yx) * u_curv;
        uv = uv + uv * off * off;
        return uv * 0.5 + 0.5;
      }
      // horizontal soft sample, vertically locked to source row center
      vec3 row(vec2 uv, float dy){
        float y = (floor(uv.y * u_src.y) + 0.5 + dy) / u_src.y;
        vec2 dir = (uv - 0.5) * u_ca / u_src;
        vec3 c;
        c.r = fetch(vec2(uv.x + dir.x, y)).r;
        c.g = fetch(vec2(uv.x, y)).g;
        c.b = fetch(vec2(uv.x - dir.x, y)).b;
        return c;
      }
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        if (u_on < 0.5) { gl_FragColor = vec4(texture2D(u_tex, vec2(v_uv.x, 1.0 - v_uv.y)).rgb, 1.0); return; }
        vec2 uv = curve(v_uv);
        if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
        // scanlines: blend the nearest two source rows with gaussian beams
        float fy = fract(uv.y * u_src.y) - 0.5;
        vec3 c0 = row(uv, 0.0);
        vec3 c1 = row(uv, fy > 0.0 ? 1.0 : -1.0);
        float d0 = abs(fy), d1 = 1.0 - abs(fy);
        vec3 s0 = mix(vec3(0.09), vec3(0.2), c0);
        vec3 s1 = mix(vec3(0.09), vec3(0.2), c1);
        vec3 w0 = exp(-(d0 * d0) / (2.0 * s0 * s0));
        vec3 w1 = exp(-(d1 * d1) / (2.0 * s1 * s1));
        vec3 col = mix(c0, (c0 * w0 + c1 * w1) * 2.0, u_scan);
        // glow: wide blur approximation
        vec3 glo = vec3(0.0);
        for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++) {
          glo += fetch(uv + vec2(float(i), float(j)) * 1.5 / u_src);
        }
        col += glo / 25.0 * u_glow * 0.6;
        // mask in output pixels
        vec2 fc = gl_FragCoord.xy - u_org;
        vec3 m = vec3(1.0);
        if (u_mask > 0.5) {
          float dk = 1.0 - u_maskDark;
          m = vec3(dk);
          float px = fc.x;
          if (u_mask > 1.5 && u_mask < 2.5) px += 1.5 * floor(mod(fc.y, 2.0));
          if (u_mask > 2.5) px += 1.5 * floor(mod(floor(fc.y / 3.0), 2.0));
          float k = mod(floor(px), 3.0);
          if (k < 0.5) m.r = 1.0; else if (k < 1.5) m.g = 1.0; else m.b = 1.0;
          if (u_mask > 2.5 && mod(fc.y, 3.0) < 1.0) m *= mix(1.0, dk, 0.6);
          col *= m * (1.0 + u_maskDark * 1.1);
        }
        // vignette
        vec2 vv = uv * (1.0 - uv.yx);
        float vig = pow(clamp(vv.x * vv.y * 16.0, 0.0, 1.0), 0.25 * u_vig + 0.001);
        col *= mix(1.0, vig, u_vig);
        // noise + flicker
        col *= 1.0 + (hash(fc + fract(u_time) * 100.0) - 0.5) * u_noise + sin(u_time * 60.0) * u_noise * 0.15;
        gl_FragColor = vec4(pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2)), 1.0);
      }`;
    const prog = U.gl.program(gl, U.gl.QUAD_VS, fs);
    const quad = U.gl.quad(gl);
    let t = 0;

    return {
      update(dt) { t += dt; },
      render() {
        drawGame(t);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
        const f = P.on ? gl.LINEAR : gl.NEAREST;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
        const pw = ctx.pixelWidth, ph = ctx.pixelHeight, s = Math.min(pw / GW, ph / GH);
        const vw = Math.round(GW * s), vh = Math.round(GH * s), ox = Math.floor((pw - vw) / 2), oy = Math.floor((ph - vh) / 2);
        gl.viewport(0, 0, pw, ph);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(ox, oy, vw, vh);
        prog.use();
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(prog.u('u_tex'), 0);
        gl.uniform2f(prog.u('u_src'), GW, GH);
        gl.uniform2f(prog.u('u_out'), vw, vh);
        gl.uniform2f(prog.u('u_org'), ox, oy);
        gl.uniform1f(prog.u('u_on'), P.on ? 1 : 0);
        gl.uniform1f(prog.u('u_curv'), P.curv);
        gl.uniform1f(prog.u('u_scan'), P.scan);
        gl.uniform1f(prog.u('u_mask'), +P.mask);
        gl.uniform1f(prog.u('u_maskDark'), P.maskDark);
        gl.uniform1f(prog.u('u_ca'), P.ca);
        gl.uniform1f(prog.u('u_glow'), P.glow);
        gl.uniform1f(prog.u('u_vig'), P.vig);
        gl.uniform1f(prog.u('u_noise'), P.noise);
        gl.uniform1f(prog.u('u_time'), t);
        quad.draw(prog);
        ctx.stat(GTL.L('원본', 'Source'), `${GW}×${GH}`);
        ctx.stat(GTL.L('출력', 'Output'), `${vw}×${vh} (×${s.toFixed(2)})`);
      },
    };
  },
});
