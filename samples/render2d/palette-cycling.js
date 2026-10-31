// 인덱스 컬러 + 팔레트 LUT: 컬러 사이클링, 팔레트 스왑, 시간대 변화
GTL.register({
  id: 'palette-cycling',
  title: '팔레트 LUT, 컬러 사이클링, 팔레트 스왑',
  summary: '픽셀에 색 대신 "팔레트 번호"를 저장하고, 셰이더가 작은 LUT(색 조회표)에서 색을 찾음. 텍스처는 그대로 두고 팔레트만 바꿔서 물 흐름, 시간대, 캐릭터 색 변형을 만듦.',
  renderer: 'webgl',
  views: { a: 'RGB 텍스처 (고정)', b: '인덱스 + 팔레트 LUT' },
  controls: '"기사 피격" 버튼: 캐릭터 팔레트를 잠깐 흰색으로 교체',
  info: `
    <p>8비트 시절 하드웨어는 프레임버퍼에 색 대신 팔레트 인덱스를 저장했음. 팔레트 레지스터 몇 개만 바꾸면 화면 전체 색이 바로 바뀜.</p>
    <p>그래서 인덱스 범위를 돌리는 <b>컬러 사이클링(Color Cycling)</b>으로 그림 한 장에 폭포, 용암, 물결을 움직였음. Mark Ferrari의 작업이 유명함.</p>
    <p>현대 GPU에서도 같은 기법을 씀. 스프라이트에 인덱스(R)와 팔레트 행(G)을 저장함. 프래그먼트 셰이더가
    <code>texture2D(u_pal, vec2((idx+0.5)/64, (row+0.5)/4))</code>로 색을 찾음. 팔레트 텍스처는 64×4 = 1KB라서 매 프레임 갱신해도 비용이 거의 없음.</p>
    <ul>
    <li><b>RGB 고정</b>: 미리 구운 RGB 텍스처. 팔레트를 바꾸려면 다시 구워야 함. 그래서 사이클링과 시간대 변화가 불가능.</li>
    <li><b>CPU 재채색</b>: 매 프레임 CPU가 모든 픽셀을 다시 칠하고 텍스처 전체를 업로드. 결과는 같지만 업로드량이 수백 배.</li>
    <li><b>GPU LUT</b>: 인덱스 텍스처는 그대로 두고 1KB 팔레트만 업로드.</li>
    </ul>`,
  diagram: (L) => `<svg viewBox="0 0 540 170" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="14">${L('인덱스 텍스처', 'Index texture')}</text>
    ${[[1, 2, 5, 6], [0, 4, 5, 7], [3, 4, 6, 7]].map((r, j) => r.map((v, i) => `<rect x="${10 + i * 24}" y="${24 + j * 24}" width="24" height="24" class="f-dim"/><text x="${22 + i * 24}" y="${40 + j * 24}" text-anchor="middle" class="t-small t-mono">${v}</text>`).join('')).join('')}
    <text x="10" y="112" class="t-small t-dim">${L('색 대신 번호 저장', 'Stores numbers, not colors')}</text>
    <path d="M110,60 L146,60" class="d-accent" marker-end="url(#arr)"/>
    <text x="150" y="14">${L('팔레트 LUT (64x4 = 1KB)', 'Palette LUT (64x4 = 1 KB)')}</text>
    <text x="150" y="40" class="t-small t-mono">t</text><text x="150" y="80" class="t-small t-mono">t+1</text>
    ${[[0.3, 0.55, 0.8, 1], [1, 0.3, 0.55, 0.8]].map((cyc, j) => Array.from({ length: 8 }, (_, i) => `<rect x="${176 + i * 28}" y="${24 + j * 40}" width="28" height="24" class="${i < 4 ? 'f-b' : 'f-accent'}" opacity="${i < 4 ? 0.2 + i * 0.2 : cyc[i - 4]}"/><text x="${190 + i * 28}" y="${40 + j * 40}" text-anchor="middle" class="t-small t-mono">${i}</text>`).join('')).join('')}
    <path d="M288,94 L288,100 L400,100 L400,94" class="d-accent"/>
    <text x="344" y="114" text-anchor="middle" class="t-small">${L('사이클 범위 4~7: 매 프레임 회전', 'Cycle range 4~7: rotates each frame')}</text>
    <path d="M404,60 L440,60" class="d-accent" marker-end="url(#arr)"/>
    <rect x="444" y="38" width="88" height="44" rx="3" class="f-dim"/>
    <text x="488" y="64" text-anchor="middle" class="t-small t-mono">pal[idx]</text>
    <text x="488" y="98" text-anchor="middle" class="t-small t-dim">${L('화면 색', 'Screen color')}</text>
    <text x="10" y="138" class="t-small t-a">${L('A: RGB 고정 텍스처. 색이 구워져 있어 바꾸려면 다시 구워야 함', 'A: baked RGB texture. To change colors you must bake again')}</text>
    <text x="10" y="154" class="t-small t-b">${L('B: 인덱스 텍스처는 그대로, 1KB 팔레트만 매 프레임 업로드', 'B: index texture stays, only the 1 KB palette is uploaded per frame')}</text>
  </svg>`,
  look: [
    'B의 폭포, 강, 횃불을 보면 흐르는 동안 A는 멈춰 있음. 픽셀 데이터는 같고 팔레트만 움직임.',
    'A를 "CPU 재채색"으로 바꾸면 B와 똑같이 보이지만 "업로드/프레임"이 수백 KB로 커짐.',
    '"시간대"를 움직이면 하늘, 산, 물이 낮 → 노을 → 밤으로 바뀜. 인덱스 이미지는 한 장뿐임.',
    '"인덱스 시각화"를 켜면 픽셀마다 저장된 번호가 무지개색으로 보임. 폭포의 줄무늬가 사이클링 범위임.',
    '"기사 피격" 버튼을 누르면 기사 3명이 잠깐 흰색으로 바뀜. 세 기사는 스프라이트 데이터가 같고 팔레트 행만 다름.',
  ],
  refs: [
    { type: 'talk', title: "8 Bit & '8 Bitish' Graphics-Outside the Box (Mark Ferrari)", year: 2016, note: 'GDC 2016. 컬러 사이클링 배경 아트의 제작 과정.' },
    { type: 'article', title: 'Old School Color Cycling with HTML5 (Joseph Huckaby)', year: 2010, note: 'Mark Ferrari의 LBM 아트를 캔버스에서 사이클링하는 데모와 해설.' },
    { type: 'article', title: 'Breaking the NES for Shovel Knight (David D\'Angelo, Yacht Club Games)', year: 2014, note: 'NES 팔레트 제약과 이를 다룬 방법. Gamasutra 기고.' },
    { type: 'engine', title: 'Indexed color / palette textures', note: '많은 레트로 스타일 게임이 인덱스+LUT 셰이더로 팔레트 스왑(적 색 변형, 피격 플래시)을 구현함.' },
  ],
  params: [
    { key: 'mode', label: '방식', type: 'select', group: '표현 방식', options: [
      { value: 'rgb', label: 'RGB 텍스처 (미리 구움)' },
      { value: 'cpu', label: 'CPU 재채색 + 전체 업로드' },
      { value: 'lut', label: 'GPU 팔레트 LUT' },
    ], a: 'rgb', b: 'lut' },
    { key: 'cycle', label: '컬러 사이클링', type: 'bool', default: true, when: (p) => p.mode !== 'rgb' },
    { key: 'cycleSpeed', label: '사이클 속도 (단계/초)', type: 'range', min: 1, max: 30, step: 1, default: 10, when: (p) => p.mode !== 'rgb' },
    { key: 'autoTime', label: '시간대 자동 진행', type: 'bool', default: true, when: (p) => p.mode !== 'rgb' },
    { key: 'timeOfDay', label: '시간대', type: 'range', min: 0, max: 1, step: 0.01, default: 0, when: (p) => p.mode !== 'rgb' && !p.autoTime, help: '0 낮, 0.33 노을, 0.66 밤' },
    { key: 'showIndex', label: '인덱스 시각화', type: 'bool', default: false, when: (p) => p.mode !== 'rgb' },
    { key: 'flash', label: '피격 플래시', type: 'button', buttonLabel: '기사 피격' },
  ],
  en: {
    title: 'Palette LUT, Color Cycling, Palette Swap',
    summary: 'Each pixel stores a "palette index" instead of a color. The shader looks up the color in a small LUT (color lookup table). The texture stays the same, and only the palette changes. This makes flowing water, time of day, and character color variants.',
    views: { a: 'RGB texture (fixed)', b: 'Index + palette LUT' },
    controls: '"Hit knights" button: swap the character palette to white for a moment',
    info: `
    <p>8-bit era hardware stored palette indices in the framebuffer instead of colors. Changing a few palette registers changed the colors of the whole screen at once.</p>
    <p>So <b>color cycling</b>, which rotates a range of indices, could animate waterfalls, lava, and waves in a single picture. The work of Mark Ferrari is famous.</p>
    <p>Modern GPUs use the same technique. The sprite stores the index (R) and the palette row (G). The fragment shader looks up the color with
    <code>texture2D(u_pal, vec2((idx+0.5)/64, (row+0.5)/4))</code>. The palette texture is 64×4 = 1KB, so updating it every frame costs almost nothing.</p>
    <ul>
    <li><b>Fixed RGB</b>: a pre-baked RGB texture. To change the palette you must bake it again. So cycling and time-of-day changes are not possible.</li>
    <li><b>CPU recolor</b>: every frame the CPU repaints all pixels and uploads the whole texture. The result is the same, but the upload is hundreds of times larger.</li>
    <li><b>GPU LUT</b>: the index texture stays as is. Only the 1KB palette is uploaded.</li>
    </ul>`,
    look: [
    'Watch the waterfall, river, and torches in B. They flow while A stays still. The pixel data is the same, and only the palette moves.',
    'Set A to "CPU recolor". It looks the same as B, but "Upload/frame" grows to hundreds of KB.',
    'Move "Time of day". The sky, mountains, and water change from day → sunset → night. There is only one index image.',
    'Turn on "Show indices". The number stored in each pixel shows as a rainbow color. The stripes in the waterfall are the cycling range.',
    'Press the "Hit knights" button. The 3 knights turn white for a moment. The three knights share the same sprite data and differ only in palette row.',
    ],
    refs: [
    'GDC 2016. How the color cycling background art was made.',
    'A demo and write-up that cycles Mark Ferrari\'s LBM art on a canvas.',
    'NES palette limits and how they handled them. A Gamasutra article.',
    'Many retro-style games use an index + LUT shader for palette swaps (enemy color variants, hit flashes).',
    ],
    params: {
    mode: { label: 'Method', group: 'Rendering method', options: { rgb: 'RGB texture (pre-baked)', cpu: 'CPU recolor + full upload', lut: 'GPU palette LUT' } },
    cycle: 'Color cycling',
    cycleSpeed: 'Cycle speed (steps/s)',
    autoTime: 'Auto advance time of day',
    timeOfDay: { label: 'Time of day', help: '0 day, 0.33 sunset, 0.66 night' },
    showIndex: 'Show indices',
    flash: { label: 'Hit flash', buttonLabel: 'Hit knights' },
    },
  },

  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, P = ctx.params;
    const W = 320, H = 180, PW = 64, PH = 4;

    // ── 인덱스 이미지 생성 (R=팔레트 인덱스, G=팔레트 행) ──
    const idx = new Uint8Array(W * H), row = new Uint8Array(W * H);
    const nz = U.noise(5);
    const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const set = (x, y, i, r = 0) => { if (x >= 0 && y >= 0 && x < W && y < H) { idx[y * W + x] = i; row[y * W + x] = r; } };
    const rr = U.rng(77);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      // 하늘: 8단계 + 4x4 Bayer로 단계 경계를 디더
      const f = (y / 100) * 8 + (B4[(y & 3) * 4 + (x & 3)] / 16 - 0.5);
      set(x, y, U.clamp(Math.floor(f), 0, 7));
    }
    for (let i = 0; i < 70; i++) { const x = rr.int(0, W - 1), y = rr.int(0, 55); set(x, y, 41); }
    for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) if (x * x + y * y <= 80) set(250 + x, 30 + y, 40);
    // 먼 산 / 가까운 산
    for (let x = 0; x < W; x++) {
      const h1 = 78 + nz.fbm2(x / 60, 0.5, { octaves: 4 }) * 30;
      for (let y = Math.floor(h1); y < H; y++) set(x, y, 8 + ((y - h1) > 6 ? 1 : 0));
      const h2 = 104 + nz.fbm2(x / 40, 3.3, { octaves: 4 }) * 22;
      for (let y = Math.floor(h2); y < H; y++) set(x, y, 10 + ((y - h2) > 4 ? 1 : 0));
    }
    // 땅
    for (let y = 132; y < H; y++) for (let x = 0; x < W; x++) set(x, y, 12 + (nz.value2(x / 3, y / 3) > 0.6 ? 1 : 0) + (y > 160 ? 2 : 0));
    // 절벽 + 폭포 (인덱스 16..23을 아래로 흐르게 배치)
    const colOff = []; for (let x = 0; x < 28; x++) colOff.push(rr.int(0, 7));
    for (let y = 70; y < 146; y++) {
      for (let x = 110; x < 150; x++) if (x < 116 || x > 143) set(x, y, 28 + ((x + y) % 7 === 0 ? 1 : 0));
      for (let x = 116; x < 144; x++) set(x, y, 16 + ((colOff[x - 116] - y) & 7)); // 사이클이 진행되면 하이라이트가 아래로 이동
    }
    // 강 (오른쪽으로 흐름)
    for (let y = 146; y < 160; y++) for (let x = 0; x < W; x++) {
      const wav = Math.floor(Math.sin(x * 0.15 + y) * 1.5);
      set(x, y, 16 + (((-x >> 1) + y * 3 + wav) & 7));
    }
    // 돌 기둥 + 횃불 (인덱스 24..27)
    for (const tx of [60, 270]) {
      for (let y = 112; y < 146; y++) for (let x = tx - 3; x <= tx + 3; x++) set(x, y, 28 + ((x + y) & 1) + (x === tx - 3 ? 2 : 0));
      for (let y = 0; y < 10; y++) for (let x = -3; x <= 3; x++) {
        const w = 3 - Math.floor(y / 3.5);
        if (Math.abs(x) <= w) set(tx + x, 111 - y, 24 + ((y + Math.abs(x) * 2) & 3));
      }
    }
    // 기사 스프라이트 (12x16), 같은 데이터에 팔레트 행만 1/2/3
    const KN = [
      '....oooo....',
      '...ohaaao...',
      '..ohaaaaao..',
      '..oaoeeoao..',
      '..oaosssao..',
      '...oooooo...',
      '..okaahakko.',
      '.okcaaaacko.',
      '.okcaddacko.',
      '.okcaaaacko.',
      '..oaaaaaao..',
      '..odaoodao..',
      '..odo..odo..',
      '..odo..odo..',
      '.oddo..oddo.',
      '.oooo..oooo.',
    ];
    const KMAP = { o: 32, s: 33, a: 34, d: 35, c: 36, k: 37, e: 38, h: 39 };
    const knights = [[170, 130, 1], [196, 130, 2], [222, 130, 3]];
    for (const [kx, ky, kr] of knights) {
      KN.forEach((line, y) => { for (let x = 0; x < 12; x++) { const ch = line[x]; if (KMAP[ch] !== undefined) set(kx + x, ky - 16 + y, KMAP[ch], kr); } });
    }

    // ── 팔레트 ──
    const hex = (h) => U.hexToRgb(h);
    const ramp = (a, b, n) => { const A = hex(a), Bc = hex(b), o = []; for (let i = 0; i < n; i++) { const t = n === 1 ? 0 : i / (n - 1); o.push(A.map((v, k) => v + (Bc[k] - v) * t)); } return o; };
    function keyPalette(k) {
      const p = [];
      p.push(...ramp(k.sky0, k.sky1, 8));               // 0..7
      p.push(hex(k.far), hex(k.far2), hex(k.near), hex(k.near2)); // 8..11
      p.push(hex(k.g0), hex(k.g1), hex(k.g2), hex(k.g3)); // 12..15
      const wv = ramp(k.w0, k.w1, 8);                   // 16..23 (하이라이트 2칸)
      wv[3] = hex(k.wh); wv[4] = hex(k.wh2);
      p.push(...wv);
      p.push(hex('#7a1405'), hex('#e0400b'), hex('#ffa31a'), hex('#fff1a8')); // 24..27 불
      p.push(hex(k.st0), hex(k.st1), hex(k.st2), hex(k.st3)); // 28..31
      for (let i = 32; i < 40; i++) p.push([255, 0, 255]); // 캐릭터는 행 1..3 사용
      p.push(hex(k.sun), hex(k.star));                  // 40, 41
      while (p.length < PW) p.push([0, 0, 0]);
      return p;
    }
    const KEYS = [
      keyPalette({ sky0: '#3a7bd5', sky1: '#bfe6ff', far: '#7c9fbf', far2: '#6d8fae', near: '#4f7a4a', near2: '#3f6a3c', g0: '#5c9e3a', g1: '#73b84a', g2: '#6b4a2b', g3: '#5a3d22', w0: '#1a4f9c', w1: '#4aa3df', wh: '#d8f3ff', wh2: '#9fd8ff', st0: '#8a8a8a', st1: '#a3a3a3', st2: '#5e5e5e', st3: '#707070', sun: '#fff7c2', star: '#9fd0f5' }),
      keyPalette({ sky0: '#2b1d52', sky1: '#ff8a3d', far: '#7a4a6e', far2: '#6a3e60', near: '#4a2f40', near2: '#3c2534', g0: '#5a4a2a', g1: '#6e5a32', g2: '#4a2e1b', g3: '#3a2414', w0: '#3b2a6a', w1: '#e0784a', wh: '#ffe0a0', wh2: '#ffb36b', st0: '#7a5a5a', st1: '#93706a', st2: '#4e3a3a', st3: '#604848', sun: '#ffcf6b', star: '#ffb070' }),
      keyPalette({ sky0: '#02030a', sky1: '#1b2350', far: '#1e2a48', far2: '#1a2440', near: '#121a2c', near2: '#0e1524', g0: '#1a2a26', g1: '#22362e', g2: '#16120e', g3: '#100d0a', w0: '#071030', w1: '#1f3a7a', wh: '#9fb8ff', wh2: '#5c7ad0', st0: '#3a3f4a', st1: '#4a505c', st2: '#262a32', st3: '#30343e', sun: '#e8ecff', star: '#ffffff' }),
    ];
    const CHAR = [
      null,
      ['#140c1c', '#f0c8a0', '#4b7bd8', '#2c4a8a', '#d83a3a', '#8a1e28', '#ffffff', '#c8e0ff'],
      ['#140c1c', '#d8a878', '#5cae4a', '#2e6a2a', '#f0c63a', '#a07a14', '#ffffff', '#d8ffc0'],
      ['#140c1c', '#a87858', '#8a5ac8', '#4a2a7a', '#e8e8e8', '#9a9aa8', '#ffe040', '#f0d8ff'],
    ];
    const pal = new Uint8Array(PW * PH * 4);
    let cycleT = 0, todT = 0, flashT = 0, uploadBytes = 0, cpuMs = 0;

    function buildPalette(tod, shift, fireShift) {
      const seg = tod * 3, k = Math.floor(seg) % 3, t = seg - Math.floor(seg);
      const A = KEYS[k], Bk = KEYS[(k + 1) % 3];
      for (let i = 0; i < PW; i++) {
        let src = i;
        if (i >= 16 && i < 24) src = 16 + ((i - 16 + shift) & 7);  // 물 범위 회전
        if (i >= 24 && i < 28) src = 24 + ((i - 24 + fireShift) & 3);
        const o = i * 4;
        for (let c = 0; c < 3; c++) pal[o + c] = A[src][c] + (Bk[src][c] - A[src][c]) * t;
        pal[o + 3] = 255;
      }
      for (let r = 1; r < PH; r++) for (let j = 0; j < 8; j++) {
        const o = (r * PW + 32 + j) * 4, c = flashT > 0 && j > 0 ? [255, 255, 255] : hex(CHAR[r][j]);
        pal[o] = c[0]; pal[o + 1] = c[1]; pal[o + 2] = c[2]; pal[o + 3] = 255;
      }
    }

    // RGB 굽기 (CPU): 현재 팔레트로 전체 이미지를 칠함
    const rgb = new Uint8Array(W * H * 4);
    function bake() {
      for (let i = 0; i < W * H; i++) {
        const p = (row[i] * PW + idx[i]) * 4, o = i * 4;
        rgb[o] = pal[p]; rgb[o + 1] = pal[p + 1]; rgb[o + 2] = pal[p + 2]; rgb[o + 3] = 255;
      }
    }

    const idxData = new Uint8Array(W * H * 4);
    for (let i = 0; i < W * H; i++) { idxData[i * 4] = idx[i]; idxData[i * 4 + 1] = row[i]; idxData[i * 4 + 3] = 255; }
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    const idxTex = U.gl.texture(gl, { width: W, height: H, data: idxData }, { filter: 'nearest' });
    buildPalette(0, 0, 0); bake();
    const staticTex = U.gl.texture(gl, { width: W, height: H, data: rgb.slice() }, { filter: 'nearest' });
    const cpuTex = U.gl.texture(gl, { width: W, height: H, data: rgb }, { filter: 'nearest' });
    const palTex = U.gl.texture(gl, { width: PW, height: PH, data: pal }, { filter: 'nearest' });

    const fs = `
      precision mediump float;
      uniform sampler2D u_img; uniform sampler2D u_pal;
      uniform float u_lut; uniform float u_showIdx;
      varying vec2 v_uv;
      vec3 hue(float h){ return clamp(abs(mod(h*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0); }
      void main(){
        vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
        vec4 s = texture2D(u_img, uv);
        if (u_lut < 0.5) { gl_FragColor = vec4(s.rgb, 1.0); return; }
        float idx = floor(s.r * 255.0 + 0.5);
        float row = floor(s.g * 255.0 + 0.5);
        vec3 c = texture2D(u_pal, vec2((idx + 0.5) / 64.0, (row + 0.5) / 4.0)).rgb;
        if (u_showIdx > 0.5) c = mix(c, hue(idx / 42.0), 0.75);
        gl_FragColor = vec4(c, 1.0);
      }`;
    const prog = U.gl.program(gl, U.gl.QUAD_VS, fs);
    const quad = U.gl.quad(gl);

    return {
      update(dt) {
        if (P.cycle) cycleT += dt * P.cycleSpeed;
        if (P.autoTime) todT = (todT + dt * 0.03) % 1;
        if (flashT > 0) flashT -= dt;
      },
      onAction(key) { if (key === 'flash') flashT = 0.25; },
      render() {
        const tod = P.autoTime ? todT : P.timeOfDay;
        const shift = Math.floor(cycleT) & 7, fire = Math.floor(cycleT * 1.3) & 3;
        uploadBytes = 0; cpuMs = 0;
        let imgTex = staticTex, useLut = 0;
        if (P.mode === 'lut') {
          buildPalette(tod, shift, fire);
          gl.bindTexture(gl.TEXTURE_2D, palTex);
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, PW, PH, gl.RGBA, gl.UNSIGNED_BYTE, pal);
          uploadBytes = pal.length; imgTex = idxTex; useLut = 1;
        } else if (P.mode === 'cpu') {
          buildPalette(tod, shift, fire);
          const t0 = ctx.now();
          bake();
          gl.bindTexture(gl.TEXTURE_2D, cpuTex);
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, rgb);
          cpuMs = ctx.now() - t0;
          uploadBytes = rgb.length; imgTex = cpuTex;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        // 16:9 레터박스
        const pw = ctx.pixelWidth, ph = ctx.pixelHeight, s = Math.min(pw / W, ph / H);
        const vw = Math.round(W * s), vh = Math.round(H * s);
        gl.viewport(Math.floor((pw - vw) / 2), Math.floor((ph - vh) / 2), vw, vh);
        prog.use();
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, imgTex);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, palTex);
        gl.uniform1i(prog.u('u_img'), 0);
        gl.uniform1i(prog.u('u_pal'), 1);
        gl.uniform1f(prog.u('u_lut'), useLut);
        gl.uniform1f(prog.u('u_showIdx'), P.showIndex && useLut ? 1 : 0);
        quad.draw(prog);
        gl.activeTexture(gl.TEXTURE0);
        ctx.stat(GTL.L('업로드/프레임', 'Upload/frame'), uploadBytes ? (uploadBytes / 1024).toFixed(1) + ' KB' : GTL.L('0 (정지)', '0 (paused)'));
        ctx.stat(GTL.L('CPU 재채색', 'CPU recolor'), P.mode === 'cpu' ? cpuMs.toFixed(2) + ' ms' : '-');
        ctx.stat(GTL.L('이미지', 'Image'), GTL.L(`${W}×${H}, 팔레트 ${PW}×${PH}`, `${W}×${H}, palette ${PW}×${PH}`));
      },
    };
  },
});
