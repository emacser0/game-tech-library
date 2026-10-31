// 픽셀 퍼펙트 스케일링: 비정수 배율 Nearest (불균일, 반짝임) vs 정수 배율 vs Bilinear vs Sharp bilinear
GTL.register({
  id: 'pixel-perfect-scaling',
  title: '픽셀 퍼펙트 스케일링 (정수 배율, Sharp Bilinear)',
  summary: '저해상도 픽셀아트를 3.37배 같은 비정수 배율로 Nearest 확대하면, 픽셀마다 3칸 또는 4칸이 됨. 선 굵기가 들쭉날쭉하고 스크롤하면 반짝임. 해결책은 정수 배율이나 Sharp bilinear.',
  renderer: 'webgl',
  views: { a: 'Nearest, 비정수 배율', b: '정수 배율 + 레터박스' },
  info: `
    <p>픽셀아트 게임은 160×90 같은 고정 내부 해상도로 그린 뒤 창 크기에 맞춰 확대. 이때 배율은 대부분 정수가 아님.</p>
    <ul>
    <li><b>Nearest (비정수)</b>: 화면을 꽉 채우지만 텍셀이 3px, 4px 폭으로 불균일하게 나뉨. 1px 줄무늬가 굵기가 다른 줄로 보임.
    카메라가 움직이면 넓어지는 텍셀이 계속 바뀌어 <b>반짝임(Shimmer)</b>이 생김.</li>
    <li><b>정수 배율</b>: floor(배율)로 확대하고 남는 공간은 테두리로 둠. 모든 텍셀이 정확히 같은 크기. Celeste(320×180)를 비롯한 많은 픽셀아트 게임의 기본값.</li>
    <li><b>Bilinear</b>: 균일하지만 전체가 흐릿함</li>
    <li><b>Sharp bilinear</b>: 텍셀 안쪽은 Nearest처럼 평평하게 두고, <b>텍셀 경계의 1px 남짓만</b> bilinear로 섞음. 화면을 꽉 채우면서도 선명하고 균일함.</li>
    </ul>
    <p>"카메라 텍셀 스냅"을 켜면 카메라가 텍셀 단위로만 움직임. 서브픽셀 이동 때문에 생기는 반짝임은 사라지지만, 비정수 배율의 불균일함은 남음.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 150" xmlns="http://www.w3.org/2000/svg">
    <text x="4" y="14" class="t-small t-dim">${L('텍셀 10개를 화면 픽셀로 확대 (칸 하나 = 화면 픽셀 1개)', '10 texels scaled to screen pixels (one tick = one screen pixel)')}</text>
    ${[30, 74, 118].map((y) => Array.from({ length: 35 }, (_, i) => `<line x1="${150 + i * 8}" y1="${y - 4}" x2="${150 + i * 8}" y2="${y}" class="d-dim"/>`).join('')).join('')}
    <text x="4" y="46" class="t-a">${L('A: Nearest x3.4', 'A: Nearest x3.4')}</text>
    ${[0, 3, 7, 10, 14, 17, 20, 24, 27, 31, 34].slice(0, 10).map((b, i, arr) => { const e = [0, 3, 7, 10, 14, 17, 20, 24, 27, 31, 34][i + 1]; return `<rect x="${150 + b * 8}" y="32" width="${(e - b) * 8}" height="22" class="f-a" opacity="${i % 2 ? 0.45 : 1}"/><text x="${150 + (b + e) * 4}" y="47" text-anchor="middle" class="t-small t-mono">${e - b}</text>`; }).join('')}
    <text x="430" y="47" class="t-small">${L('폭 3과 4가 섞임', 'widths 3 and 4 mix')}</text>
    <text x="4" y="90" class="t-b">${L('B: 정수 x3 + 테두리', 'B: integer x3 + border')}</text>
    <rect x="150" y="76" width="16" height="22" class="f-dim" opacity="0.4"/><rect x="406" y="76" width="16" height="22" class="f-dim" opacity="0.4"/>
    ${Array.from({ length: 10 }, (_, i) => `<rect x="${166 + i * 24}" y="76" width="24" height="22" class="f-b" opacity="${i % 2 ? 0.45 : 1}"/>`).join('')}
    <text x="430" y="91" class="t-small">${L('모두 폭 3', 'all width 3')}</text>
    <text x="4" y="134">Sharp bilinear</text>
    ${Array.from({ length: 10 }, (_, i) => `<rect x="${150 + i * 3.4 * 8}" y="120" width="${3.4 * 8}" height="22" class="f-b" opacity="${i % 2 ? 0.45 : 1}"/>`).join('')}
    ${[3.4, 6.8, 10.2, 13.6, 20.4, 23.8, 27.2, 30.6].map((p) => `<rect x="${150 + Math.floor(p) * 8}" y="120" width="8" height="22" class="f-accent" opacity="0.6"/>`).join('')}
    <text x="430" y="135" class="t-small">${L('경계 1px만 섞음', 'blends 1 px at edges')}</text>
  </svg>`,
  look: [
    'A의 왼쪽 1px 세로 줄무늬를 보면 굵은 줄과 가는 줄이 섞여 있고, 스크롤되면 물결처럼 반짝임. B는 모든 줄이 같은 굵기.',
    'B를 Sharp bilinear로 바꾸면 화면을 꽉 채우면서도 줄무늬가 균일함. 가까이 보면 텍셀 경계만 살짝 섞여 있음.',
    '"텍셀 경계 표시"를 켜면 A의 텍셀 칸 폭이 불규칙한 것이 직접 보임',
    '배율을 정확히 3.00이나 4.00으로 맞추면 A도 깨끗해짐. 원인은 비정수 배율 그 자체.',
  ],
  refs: [
    { type: 'engine', title: 'Godot: Multiple resolutions (stretch mode, integer scaling)', url: 'https://docs.godotengine.org/en/stable/tutorials/rendering/multiple_resolutions.html' },
    { type: 'engine', title: 'Unity: 2D Pixel Perfect Camera', url: 'https://docs.unity3d.com/Packages/com.unity.2d.pixel-perfect@latest', note: '정수 배율, 업스케일 RT, 픽셀 스냅 옵션' },
    { type: 'code', title: 'sharp-bilinear shader (libretro)', url: 'https://github.com/libretro/glsl-shaders', note: '정수 배율 nearest로 먼저 확대하고 나머지만 bilinear로 처리. 에뮬레이터에서 널리 쓰임.' },
    { type: 'game', title: 'Celeste (Maddy Makes Games)', year: 2018, note: '320×180 내부 해상도를 정수 배율로 확대하는 대표적 픽셀아트 게임' },
  ],
  params: [
    { key: 'mode', label: '확대 방식', type: 'select', group: '스케일링', options: [
      { value: 'nearest', label: 'Nearest (배율 그대로)' },
      { value: 'integer', label: '정수 배율 Nearest + 레터박스' },
      { value: 'bilinear', label: 'Bilinear' },
      { value: 'sharp', label: 'Sharp bilinear' },
    ], a: 'nearest', b: 'integer' },
    { key: 'zoom', label: '배율 (CSS px)', type: 'range', min: 1, max: 8, step: 0.01, default: 3.37 },
    { key: 'snap', label: '카메라 텍셀 스냅', type: 'bool', default: false },
    { key: 'grid', label: '텍셀 경계 표시', type: 'bool', default: false, group: '표시' },
    { key: 'pan', label: '카메라 이동 속도 (텍셀/초)', type: 'range', min: 0, max: 30, step: 0.1, default: 6, shared: true },
  ],
  en: {
    title: 'Pixel-Perfect Scaling (Integer Scale, Sharp Bilinear)',
    summary: 'Scale low-resolution pixel art with Nearest at a non-integer factor like 3.37, and each texel becomes 3 or 4 pixels wide. Line widths become uneven, and the image shimmers when it scrolls. The fix is an integer scale or sharp bilinear.',
    views: { a: 'Nearest, non-integer scale', b: 'Integer scale + letterbox' },
    info: `
    <p>Pixel art games draw at a fixed internal resolution like 160×90 and then scale it up to the window size. Usually the scale factor is not an integer.</p>
    <ul>
    <li><b>Nearest (non-integer)</b>: it fills the screen, but texels split unevenly into 3px and 4px widths. A 1px stripe pattern looks like lines of different widths.
    When the camera moves, the texels that get wider keep changing. This causes <b>shimmer</b>.</li>
    <li><b>Integer scale</b>: scale by floor(scale) and leave the rest as a border. Every texel has exactly the same size. This is the default in many pixel art games, including Celeste (320×180).</li>
    <li><b>Bilinear</b>: even, but the whole image is blurry.</li>
    <li><b>Sharp bilinear</b>: keeps the inside of each texel flat like Nearest, and blends <b>only about 1px at texel edges</b> with bilinear. It fills the screen and stays sharp and even.</li>
    </ul>
    <p>Turn on "Camera texel snap" and the camera moves only in whole texels. Shimmer from subpixel motion goes away, but the unevenness of a non-integer scale stays.</p>`,
    look: [
    'Look at the 1px vertical stripes on the left of A. Thick and thin lines are mixed, and they shimmer like waves as it scrolls. In B every line has the same width.',
    'Set B to Sharp bilinear. It fills the screen and the stripes stay even. Up close, only the texel edges are slightly blended.',
    'Turn on "Show texel edges". You can see directly that A\'s texel cells have uneven widths.',
    'Set the scale to exactly 3.00 or 4.00. A also becomes clean. The cause is the non-integer scale itself.',
    ],
    refs: [
    null,
    'Integer scale, upscale RT, and pixel snap options.',
    'Scales first with integer nearest, then handles only the rest with bilinear. Widely used in emulators.',
    'A well-known pixel art game that scales a 320×180 internal resolution by an integer factor.',
    ],
    params: {
    mode: { label: 'Scaling method', group: 'Scaling', options: { nearest: 'Nearest (scale as is)', integer: 'Integer scale Nearest + letterbox' } },
    zoom: 'Scale (CSS px)',
    snap: 'Camera texel snap',
    grid: { label: 'Show texel edges', group: 'Display' },
    pan: 'Camera pan speed (texels/s)',
    },
  },

  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, P = ctx.params;
    const TW = 128, TH = 64, GW = 160, GH = 90;
    // ── 픽셀아트 월드 텍스처 (128×64, 반복) ──
    const cv = ctx.createCanvas(TW, TH), g = cv.getContext('2d');
    const px = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
    g.fillStyle = '#1b1f3a'; g.fillRect(0, 0, TW, TH);
    for (let x = 0; x < 32; x += 2) { g.fillStyle = '#e8e8e8'; g.fillRect(x, 0, 1, 30); }               // 1px 세로 줄무늬
    for (let y = 0; y < 30; y++) for (let x = 32; x < 64; x++) if ((x + y) & 1) px(x, y, '#ffcb6b');      // 1px 체커
    for (let i = 0; i < 30; i++) { px(64 + i, i, '#4fc3f7'); px(64 + ((i * 2) % 30), i, '#66d17a'); }     // 대각선
    const SPR = [
      '....111111....', '...12222221...', '..1222222221..', '..1233223321..', '..1233223321..', '..1222222221..',
      '...12244221...', '....111111....', '...15555551...', '..1555555551..', '..1515555151..', '..1115555111..',
      '....155551....', '....15..51....', '...111..111...',
    ];
    const SC = { 1: '#140c1c', 2: '#f0c8a0', 3: '#ffffff', 4: '#d83a3a', 5: '#4b7bd8' };
    SPR.forEach((l, y) => { for (let x = 0; x < l.length; x++) if (SC[l[x]]) px(100 + x, 6 + y, SC[l[x]]); });
    // 바닥 타일
    for (let tx = 0; tx < TW; tx += 16) {
      g.fillStyle = '#5a3d22'; g.fillRect(tx, 44, 16, 20);
      g.fillStyle = '#73b84a'; g.fillRect(tx, 44, 16, 3);
      g.fillStyle = '#3a2414'; g.fillRect(tx + 15, 47, 1, 17); g.fillRect(tx, 55, 16, 1);
      px(tx + 4, 50, '#8a6a42'); px(tx + 10, 59, '#8a6a42');
    }
    // 1px 원
    for (let a = 0; a < 64; a++) px(Math.round(20 + Math.cos(a / 10.18) * 9), Math.round(37 + Math.sin(a / 10.18) * 5), '#ff7a59');
    const tex = U.gl.texture(gl, cv, { wrap: 'repeat', filter: 'nearest' });

    const fs = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      uniform sampler2D u_tex; uniform vec2 u_texSize; uniform vec2 u_game;
      uniform vec2 u_origin; uniform float u_scale; uniform vec2 u_cam;
      uniform float u_sharp; uniform float u_grid;
      // game pixel coords (y down) for a framebuffer pixel
      vec2 gameAt(vec2 fc){ vec2 d = fc - u_origin; return vec2(d.x, -d.y) / u_scale; }
      void main(){
        vec2 fc = gl_FragCoord.xy;
        vec2 s = gameAt(fc);
        if (s.x < 0.0 || s.y < 0.0 || s.x >= u_game.x || s.y >= u_game.y) { gl_FragColor = vec4(0.03, 0.03, 0.04, 1.0); return; }
        vec2 w = s + u_cam;
        vec2 t = w;
        if (u_sharp > 0.5) {
          vec2 fl = floor(w);
          vec2 cd = fract(w) - 0.5;
          vec2 range = vec2(0.5 - 0.5 / u_scale);
          vec2 f = (cd - clamp(cd, -range, range)) * u_scale + 0.5;
          t = fl + f;
        }
        vec3 c = texture2D(u_tex, t / u_texSize).rgb;
        if (u_grid > 0.5) {
          vec2 w1 = gameAt(fc - vec2(1.0, -1.0)) + u_cam;
          if (floor(w1.x) != floor(w.x) || floor(w1.y) != floor(w.y)) c = mix(c, vec3(1.0, 0.1, 0.4), 0.7);
        }
        gl_FragColor = vec4(c, 1.0);
      }`;
    const prog = U.gl.program(gl, U.gl.QUAD_VS, fs);
    const quad = U.gl.quad(gl);
    let cam = 0;

    return {
      update(dt) { cam += dt * P.pan; },
      render() {
        const pw = ctx.pixelWidth, ph = ctx.pixelHeight, dpr = ctx.pixelRatio;
        let scale = P.zoom * dpr;
        if (P.mode === 'integer') scale = Math.max(1, Math.floor(scale));
        const ox = Math.round((pw - GW * scale) / 2), oyTop = Math.round((ph - GH * scale) / 2);
        gl.viewport(0, 0, pw, ph);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        const lin = P.mode === 'bilinear' || P.mode === 'sharp';
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, lin ? gl.LINEAR : gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, lin ? gl.LINEAR : gl.NEAREST);
        prog.use();
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(prog.u('u_tex'), 0);
        gl.uniform2f(prog.u('u_texSize'), TW, TH);
        gl.uniform2f(prog.u('u_game'), GW, GH);
        // gl_FragCoord는 아래가 0, 따라서 게임 화면 좌상단 = (ox, ph - oyTop)
        gl.uniform2f(prog.u('u_origin'), ox, ph - oyTop);
        gl.uniform1f(prog.u('u_scale'), scale);
        const cx = P.snap ? Math.floor(cam) : cam;
        gl.uniform2f(prog.u('u_cam'), cx % TW, (cx * 0.25) % TH);
        gl.uniform1f(prog.u('u_sharp'), P.mode === 'sharp' ? 1 : 0);
        gl.uniform1f(prog.u('u_grid'), P.grid ? 1 : 0);
        quad.draw(prog);
        const lo = Math.floor(scale), hi = Math.ceil(scale);
        ctx.stat(GTL.L('배율 (기기 픽셀/텍셀)', 'Scale (device px/texel)'), scale.toFixed(2) + (dpr !== 1 ? ` (DPR ${dpr})` : ''));
        ctx.stat(GTL.L('텍셀 폭', 'Texel width'), P.mode === 'nearest' && lo !== hi ? GTL.L(`${lo}px / ${hi}px 혼재`, `${lo}px / ${hi}px mixed`) : P.mode === 'nearest' || P.mode === 'integer' ? GTL.L(`${lo}px 균일`, `${lo}px even`) : GTL.L('보간', 'Interpolated'));
        ctx.stat(GTL.L('화면 사용률', 'Screen usage'), ((GW * scale * GH * scale) / (pw * ph) * 100).toFixed(0) + ' %');
      },
    };
  },
});
