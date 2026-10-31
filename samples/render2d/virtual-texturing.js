// 가상 텍스처링: 고정 해상도 전체 로드 vs 피드백 + 페이지 테이블 + 물리 타일 캐시(LRU) + mip 폴백
GTL.register({
  id: 'virtual-texturing',
  title: '가상 텍스처링 (Unreal Runtime Virtual Texture, 스트리밍 VT)',
  summary: '16384x16384 크기의 절차적 텍스처 위를 카메라가 이동. A는 낮은 해상도 하나를 통째로 올려서 확대하면 흐림. B는 화면에 보이는 타일만 필요한 mip으로 만들어 작은 캐시에 넣고, 없는 타일은 더 거친 mip으로 대신 그림.',
  views: { a: '고정 해상도 전체 로드', b: '가상 텍스처링 (타일 캐시)' },
  controls: '드래그로 이동, 휠로 확대와 축소. 조작하면 자동 카메라가 멈춤.',
  info: `
    <p><b>가상 텍스처링(Virtual Texturing)</b>은 아주 큰 텍스처를 작은 타일(페이지)로 나누고, 화면에 필요한 타일만 GPU 메모리에 두는 방식. Unreal의 Streaming Virtual Texture와 Runtime Virtual Texture, id Tech의 MegaTexture가 이 방식임.</p>
    <p>16384x16384 RGBA 텍스처는 mip 체인까지 약 1.3GB. 통째로 올릴 수 없어서 낮은 해상도 하나만 쓰면 확대했을 때 흐림.</p>
    <p>동작 원리:</p>
    <ul>
      <li><b>피드백 패스</b>: 저해상도로 화면을 훑어 픽셀마다 필요한 (mip, 타일 x, 타일 y)를 기록</li>
      <li><b>페이지 테이블</b>: mip별 표. 가상 타일 주소를 물리 캐시의 슬롯 번호로 바꿈.</li>
      <li><b>물리 캐시</b>: 크기가 고정된 타일 아틀라스. 가득 차면 가장 오래 안 쓴 타일(LRU)을 내보냄.</li>
      <li><b>업로드 예산</b>: 프레임마다 만들 수 있는 타일 수를 제한. 끊김(hitch)을 막음.</li>
      <li><b>mip 폴백</b>: 아직 없는 타일은 캐시에 있는 부모 타일(더 거친 mip)의 일부를 확대해 그림</li>
    </ul>
    <p>단점: 페이지 테이블 조회만큼 샘플링 비용이 늘어남. 카메라가 빠르게 움직이면 잠시 흐린 타일이 보임(팝인). 타일 경계에 필터링 이음매가 생기지 않게 테두리(border) 텍셀 필요.</p>`,
  diagram: [
    (L) => `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="70" y="14" text-anchor="middle">${L('가상 주소 공간', 'Virtual address space')}</text>
    <text x="70" y="27" text-anchor="middle" class="t-small t-dim">${L('mip 0, 256x256 타일', 'mip 0, 256x256 tiles')}</text>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="${10 + i * 24}" y1="34" x2="${10 + i * 24}" y2="154" class="d-dim"/><line x1="10" y1="${34 + i * 24}" x2="130" y2="${34 + i * 24}" class="d-dim"/>`).join('')}
    <rect x="34" y="58" width="48" height="48" class="d-b" fill="none"/>
    <text x="58" y="172" text-anchor="middle" class="t-small t-b">${L('화면에 보이는 타일', 'Tiles on screen')}</text>
    <path d="M84,82 L196,82" class="d-accent" marker-end="url(#arr)"/>
    <text x="140" y="76" text-anchor="middle" class="t-small t-mono">(m, x, y)</text>
    <text x="250" y="14" text-anchor="middle">${L('페이지 테이블', 'Page table')}</text>
    <text x="250" y="27" text-anchor="middle" class="t-small t-dim">${L('mip별 표', 'one per mip')}</text>
    <rect x="200" y="34" width="100" height="120" rx="3" class="f-dim"/>
    <text x="210" y="56" class="t-small t-mono">m0 (3,2)  -1</text>
    <text x="210" y="74" class="t-small t-mono">m0 (4,2)  #7</text>
    <text x="210" y="92" class="t-small t-mono">m0 (3,3)  #2</text>
    <text x="210" y="110" class="t-small t-mono">m1 (1,1)  #5</text>
    <text x="210" y="128" class="t-small t-mono">m8 (0,0)  #0</text>
    <text x="250" y="148" text-anchor="middle" class="t-small t-dim">${L('-1 = 캐시에 없음', '-1 = not cached')}</text>
    <path d="M302,72 L392,72" class="d-accent" marker-end="url(#arr)"/>
    <text x="347" y="66" text-anchor="middle" class="t-small">${L('슬롯 번호', 'slot index')}</text>
    <text x="460" y="14" text-anchor="middle">${L('물리 타일 캐시', 'Physical tile cache')}</text>
    <text x="460" y="27" text-anchor="middle" class="t-small t-dim">${L('고정 크기, LRU 교체', 'fixed size, LRU eviction')}</text>
    ${[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${396 + c * 30}" y="${34 + r * 30}" width="28" height="28" class="${(r * 4 + c) % 5 === 3 ? 'f-dim' : 'f-b'}" opacity="${(r * 4 + c) % 5 === 3 ? 1 : 0.35 + ((r * 4 + c) % 3) * 0.2}"/><text x="${410 + c * 30}" y="${52 + r * 30}" text-anchor="middle" class="t-small t-mono">${r * 4 + c}</text>`).join('')).join('')}
    <path d="M250,154 L250,170 L456,170 L456,156" class="d-dim" stroke-dasharray="3 3"/>
    <text x="352" y="184" text-anchor="middle" class="t-small t-dim">${L('업로드 예산 안에서 빈 슬롯이나 LRU 슬롯에 새 타일 생성', 'New tiles fill free or LRU slots within the upload budget')}</text>
  </svg>`,
    (L) => `<svg viewBox="0 0 540 150" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr2" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="4" y="14">${L('mip 폴백: 없는 타일은 캐시에 있는 조상 타일의 일부를 확대', 'Mip fallback: a missing tile uses part of a cached ancestor, scaled up')}</text>
    <rect x="20" y="34" width="80" height="80" class="f-dim"/>
    <rect x="20" y="34" width="40" height="40" class="d-bad" fill="none" stroke-dasharray="3 2"/>
    <text x="60" y="130" text-anchor="middle" class="t-small">${L('mip 0 요청: 없음', 'mip 0 wanted: missing')}</text>
    <path d="M108,74 L170,74" class="d-accent" marker-end="url(#arr2)"/>
    <rect x="180" y="34" width="80" height="80" class="f-dim"/>
    <rect x="180" y="34" width="40" height="40" class="d-bad" fill="none" stroke-dasharray="3 2"/>
    <text x="220" y="130" text-anchor="middle" class="t-small">${L('mip 1: 없음', 'mip 1: missing')}</text>
    <path d="M268,74 L330,74" class="d-accent" marker-end="url(#arr2)"/>
    <rect x="340" y="34" width="80" height="80" class="f-b" opacity="0.5"/>
    <rect x="340" y="34" width="20" height="20" class="d-good" fill="none"/>
    <text x="380" y="130" text-anchor="middle" class="t-small">${L('mip 2: 캐시에 있음', 'mip 2: cached')}</text>
    <text x="436" y="60" class="t-small t-dim">${L('한 변 1/4 부분을', 'Take a 1/4 part')}</text>
    <text x="436" y="74" class="t-small t-dim">${L('4배로 확대해', 'and draw it 4x')}</text>
    <text x="436" y="88" class="t-small t-dim">${L('흐리게 그림', 'larger (blurry)')}</text>
    <text x="4" y="146" class="t-small t-dim">${L('동시에 mip 1, 0 순서로 로드 요청. 다음 프레임부터 점점 선명해짐', 'Meanwhile it requests mip 1, then mip 0. The tile gets sharper over the next frames')}</text>
  </svg>`,
  ],
  look: [
    '처음 화면에서 A는 확대된 텍스처가 크게 흐림. B는 잠깐 흐렸다가 몇 프레임 안에 선명해짐(빨간 테두리 = 폴백 타일).',
    'B의 "프레임당 업로드"를 1로 낮추면 폴백 타일이 오래 남음. 12로 올리면 빨리 선명해지지만 "생성 시간"이 늘어남.',
    'B의 "캐시 크기"를 128로 낮추고 "mip 바이어스"를 -1로 내리면 보이는 타일이 캐시보다 많아짐. "캐시 부족"이 생기고 일부 타일이 계속 흐림.',
    'A의 "고정 mip"을 4에서 낮출수록 메모리가 4배씩 늘어남. 그래도 최대로 확대하면 여전히 흐림. "선명한 전체 로드" 값과 비교.',
  ],
  refs: [
    { type: 'engine', title: 'Unreal Engine: Virtual Texturing (Streaming Virtual Texturing, Runtime Virtual Texturing)', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/virtual-texturing-in-unreal-engine', note: 'SVT는 디스크에서 타일을 스트리밍, RVT는 머티리얼로 타일을 실행 중에 생성' },
    { type: 'talk', title: 'Sparse Virtual Textures (Sean Barrett)', year: 2008, note: 'GDC 2008. 피드백, 페이지 테이블, 물리 캐시 구조를 처음 널리 알린 발표.' },
    { type: 'article', title: 'Software Virtual Textures (J.M.P. van Waveren, id Software)', year: 2012, note: 'Rage의 MegaTexture 구현. 피드백 버퍼, 페이지 테이블 갱신, 타일 테두리 처리.' },
    { type: 'talk', title: 'Adaptive Virtual Texture Rendering in Far Cry 4 (Ka Chen)', year: 2015, note: 'GDC 2015. 지형 텍스처를 실행 중에 합성해 가상 텍스처에 넣음. RVT와 같은 생각.' },
  ],
  params: [
    { key: 'method', label: '텍스처 방식', type: 'select', group: '방식', options: [
      { value: 'fixed', label: '고정 해상도 전체 로드' },
      { value: 'vt', label: '가상 텍스처링' },
    ], a: 'fixed', b: 'vt' },
    { key: 'fixedMip', label: '고정 mip', type: 'int', min: 4, max: 7, default: 4, reset: true, when: (p) => p.method === 'fixed', help: '전체 텍스처를 이 mip 하나로 올림. 1 낮출 때마다 메모리 4배' },
    { key: 'cacheTiles', label: '캐시 크기 (타일)', type: 'select', options: [
      { value: 128, label: '128 (2MB)' },
      { value: 256, label: '256 (4MB)' },
      { value: 512, label: '512 (8MB)' },
    ], default: 256, reset: true, when: (p) => p.method === 'vt' },
    { key: 'budget', label: '프레임당 업로드 (타일)', type: 'int', min: 1, max: 12, default: 4, when: (p) => p.method === 'vt', help: '프레임마다 새로 만들어 캐시에 넣을 수 있는 타일 수' },
    { key: 'bias', label: 'mip 바이어스', type: 'range', min: -1, max: 2, step: 0.25, default: 0, when: (p) => p.method === 'vt', help: '음수면 더 고해상도 mip 요청. 타일 수가 늘어남' },
    { key: 'autoCam', label: '자동 카메라', type: 'bool', default: true, shared: true, group: '카메라와 표시' },
    { key: 'camSpeed', label: '카메라 속도', type: 'range', min: 0.2, max: 3, step: 0.1, default: 1, shared: true },
    { key: 'showTiles', label: '타일 경계 표시', type: 'bool', default: true, shared: true, help: '빨간 테두리는 폴백(더 거친 mip으로 대신 그린) 타일' },
    { key: 'tint', label: 'mip 색 표시', type: 'bool', default: false, shared: true },
    { key: 'overlay', label: '캐시, 페이지 테이블 표시', type: 'bool', default: true, shared: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Virtual Texturing (Unreal Runtime Virtual Texture, Streaming VT)',
    summary: 'A camera moves over a 16384x16384 procedural texture. A uploads one low resolution copy of the whole texture, so it is blurry when zoomed in. B builds only the tiles on screen at the mip they need, keeps them in a small cache, and draws missing tiles from a coarser mip.',
    views: { a: 'Fixed resolution, all loaded', b: 'Virtual texturing (tile cache)' },
    controls: 'Drag to pan, wheel to zoom. Any input stops the auto camera.',
    info: `
    <p><b>Virtual texturing</b> splits a very large texture into small tiles (pages) and keeps only the tiles the screen needs in GPU memory. Unreal Streaming Virtual Texture and Runtime Virtual Texture, and id Tech MegaTexture, work this way.</p>
    <p>A 16384x16384 RGBA texture with its mip chain takes about 1.3 GB. You cannot upload all of it, and one low resolution copy is blurry when you zoom in.</p>
    <p>How it works:</p>
    <ul>
      <li><b>Feedback pass</b>: scan the screen at low resolution and record the (mip, tile x, tile y) each pixel needs.</li>
      <li><b>Page table</b>: one table per mip. It turns a virtual tile address into a slot index in the physical cache.</li>
      <li><b>Physical cache</b>: a tile atlas of fixed size. When it is full, the least recently used (LRU) tile is evicted.</li>
      <li><b>Upload budget</b>: limits how many tiles can be built per frame. This avoids hitches.</li>
      <li><b>Mip fallback</b>: a tile that is not ready yet is drawn from part of its cached parent tile (a coarser mip), scaled up.</li>
    </ul>
    <p>Downsides: the page table lookup adds sampling cost. When the camera moves fast you briefly see blurry tiles (pop-in). Tiles need border texels so filtering does not show seams.</p>`,
    look: [
      'On first load A is very blurry where the texture is magnified. B is blurry for a moment, then sharp within a few frames (red outline = fallback tile).',
      'Lower B\'s "Uploads per frame" to 1. Fallback tiles stay longer. Raise it to 12. Tiles sharpen fast, but "Build time" grows.',
      'Set B\'s "Cache size" to 128 and "Mip bias" to -1. More tiles are visible than the cache holds. "Cache full" appears and some tiles stay blurry.',
      'Lower A\'s "Fixed mip" from 4. Memory grows 4x per step, and the full zoom is still blurry. Compare with "Sharp full load".',
    ],
    refs: [
      'SVT streams tiles from disk. RVT builds tiles at runtime from materials.',
      'GDC 2008. The talk that made the feedback, page table and physical cache design widely known.',
      'The MegaTexture implementation in Rage. Feedback buffer, page table updates and tile borders.',
      'GDC 2015. Builds terrain texture at runtime into a virtual texture. The same idea as RVT.',
    ],
    params: {
      method: { label: 'Texture method', group: 'Method', options: { fixed: 'Fixed resolution, all loaded', vt: 'Virtual texturing' } },
      fixedMip: { label: 'Fixed mip', help: 'Upload the whole texture at this one mip. Each step down costs 4x memory' },
      cacheTiles: 'Cache size (tiles)',
      budget: { label: 'Uploads per frame (tiles)', help: 'How many new tiles can be built and put in the cache each frame' },
      bias: { label: 'Mip bias', help: 'Negative asks for a sharper mip. More tiles are needed' },
      autoCam: { label: 'Auto camera', group: 'Camera and display' },
      camSpeed: 'Camera speed',
      showTiles: { label: 'Show tile borders', help: 'A red outline marks a fallback tile (drawn from a coarser mip)' },
      tint: 'Show mip colors',
      overlay: 'Show cache and page table',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const VSIZE = 16384, TILE = 64, MAXMIP = 8;   // mip 8 = 타일 1장
    const OCT = 11;                                // 파장 2048 ~ 2 px
    const SEED = (ctx.seed | 0) * 7919 + 13;
    const MIPCOL = ['#ff5d5d', '#ff9f43', '#ffd166', '#7bd88f', '#4cc9f0', '#6c8cff', '#b48cff', '#ff7ad9', '#cccccc'];

    // ── 절차적 텍스처 생성기 (비용이 큰 함수라고 가정) ──
    const hash = (ix, iy, o) => {
      let n = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(o + SEED, 1442695041);
      n = Math.imul(n ^ (n >>> 13), 1274126177);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
    };
    const vnoise = (x, y, o) => {
      const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
      const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
      const a = hash(ix, iy, o), b = hash(ix + 1, iy, o), c = hash(ix, iy + 1, o), d = hash(ix + 1, iy + 1, o);
      return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
    };
    const FINE = 5;                                // 파장 64px 이하 옥타브는 밝기 잔무늬로도 씀
    let ampSum = 0, fineSum = 0; for (let o = 0; o < OCT; o++) { ampSum += Math.pow(0.55, o); if (o >= FINE) fineSum += Math.pow(0.55, o); }
    // 한 점의 고도 (시작 위치를 육지로 고를 때 씀)
    const elevAt = (vx, vy) => {
      let e = 0, amp = 1;
      for (let o = 0; o < OCT; o++) { const w = 2048 >> o; e += vnoise(vx / w, vy / w, o) * amp; amp *= 0.55; }
      return e / ampSum * 1.5 - 0.25;
    };
    // 고도 → 색 램프
    const ramp = new Uint8Array(256 * 3);
    const stops = [[0, 20, 40, 90], [0.4, 40, 90, 160], [0.45, 210, 200, 150], [0.5, 90, 150, 70], [0.62, 40, 105, 50], [0.74, 120, 110, 95], [0.86, 160, 155, 150], [1, 245, 245, 250]];
    for (let i = 0; i < 256; i++) {
      const e = i / 255;
      let k = 0; while (k < stops.length - 2 && e > stops[k + 1][0]) k++;
      const s0 = stops[k], s1 = stops[k + 1], f = U.clamp((e - s0[0]) / (s1[0] - s0[0]), 0, 1);
      for (let c = 0; c < 3; c++) ramp[i * 3 + c] = s0[c + 1] + (s1[c + 1] - s0[c + 1]) * f;
    }
    // 주기 p, 폭 w인 선이 [x0, x0+t) 구간을 덮는 비율 (mip 텍셀 하나의 필터링 근사)
    const cover = (x0, t, p, w) => {
      if (t >= p) return w / p;
      const k = Math.floor(x0 / p) * p;
      let c = Math.max(0, Math.min(x0 + t, k + w) - Math.max(x0, k));
      c += Math.max(0, Math.min(x0 + t, k + p + w) - Math.max(x0, k + p));
      return c / t;
    };
    let genCount = 0;
    // mip 단계의 타일 (tx, ty)를 img의 (ox, oy) 위치에 생성
    function genTile(img, stride, ox, oy, mip, tx, ty) {
      const texel = 1 << mip, nOct = OCT - mip;
      let missing = 0; for (let o = nOct; o < OCT; o++) missing += Math.pow(0.55, o) * 0.5;
      const data = img.data;
      for (let j = 0; j < TILE; j++) {
        const vy0 = (ty * TILE + j) * texel, vy = vy0 + texel * 0.5;
        const ry = 1 - (1 - cover(vy0, texel, 1024, 10) * 0.9) * (1 - cover(vy0, texel, 128, 2) * 0.55);
        for (let i = 0; i < TILE; i++) {
          const vx0 = (tx * TILE + i) * texel, vx = vx0 + texel * 0.5;
          const rx = 1 - (1 - cover(vx0, texel, 1024, 10) * 0.9) * (1 - cover(vx0, texel, 128, 2) * 0.55);
          const line = 1 - (1 - rx) * (1 - ry);
          let e = 0, f = 0, amp = 1;
          for (let o = 0; o < nOct; o++) {
            const w = 2048 >> o, nv = vnoise(vx / w, vy / w, o) * amp;
            e += nv; if (o >= FINE) f += nv - amp * 0.5;   // 잔무늬: 평균 0, 빠진 옥타브는 0으로 둠
            amp *= 0.55;
          }
          e = U.clamp((e + missing) / ampSum * 1.5 - 0.25, 0, 1);
          const ci = (e * 255) | 0;
          const sh = (1 + f / fineSum * 0.9) * (1 - line);
          const k = ((oy + j) * stride + ox + i) * 4;
          data[k] = ramp[ci * 3] * sh + 235 * line;
          data[k + 1] = ramp[ci * 3 + 1] * sh + 225 * line;
          data[k + 2] = ramp[ci * 3 + 2] * sh + 200 * line;
          data[k + 3] = 255;
        }
      }
      genCount++;
    }

    // ── A: 고정 mip 하나로 전체 텍스처 ──
    let fixed = null;
    function ensureFixed() {
      if (fixed) return;
      const L = P.fixedMip, n = VSIZE >> L, tiles = n / TILE;
      const cv = ctx.createCanvas(n, n), g = cv.getContext('2d');
      const img = g.createImageData(n, n);
      for (let ty = 0; ty < tiles; ty++) for (let tx = 0; tx < tiles; tx++) genTile(img, n, tx * TILE, ty * TILE, L, tx, ty);
      g.putImageData(img, 0, 0);
      fixed = { cv, mip: L, size: n, tiles: tiles * tiles, bytes: n * n * 4 };
    }

    // ── B: 페이지 테이블 + 물리 캐시 ──
    let vt = null;
    function ensureVT() {
      if (vt) return;
      const cap = Number(P.cacheTiles), cols = 16, rows = Math.ceil(cap / cols);
      const atlas = ctx.createCanvas(cols * TILE, rows * TILE), ag = atlas.getContext('2d');
      const tileImg = ag.createImageData(TILE, TILE);
      const table = [];
      for (let m = 0; m <= MAXMIP; m++) { const n = 1 << (MAXMIP - m); table.push(new Int16Array(n * n).fill(-1)); }
      const slots = [];
      for (let i = 0; i < cap; i++) slots.push({ mip: -1, tx: 0, ty: 0, used: -1, pinned: false });
      vt = { cap, cols, atlas, ag, tileImg, table, slots, frame: 0, evictions: 0, uploads: 0, genMs: 0, queue: 0, full: 0, requested: 0, samples: 0 };
      // 가장 거친 두 단계(mip 8, 7)는 항상 상주: 폴백이 반드시 성공
      for (let m = MAXMIP; m >= MAXMIP - 1; m--) {
        const n = 1 << (MAXMIP - m);
        for (let ty = 0; ty < n; ty++) for (let tx = 0; tx < n; tx++) { const s = loadTile(m, tx, ty); if (s >= 0) vt.slots[s].pinned = true; }
      }
    }
    function allocSlot() {
      let best = -1, bestUsed = Infinity;
      for (let i = 0; i < vt.cap; i++) {
        const s = vt.slots[i];
        if (s.mip < 0) return i;
        if (!s.pinned && s.used < vt.frame && s.used < bestUsed) { bestUsed = s.used; best = i; }
      }
      if (best >= 0) {
        const s = vt.slots[best], n = 1 << (MAXMIP - s.mip);
        vt.table[s.mip][s.ty * n + s.tx] = -1;   // 페이지 테이블에서 내보낸 타일 제거
        vt.evictions++;
      }
      return best;
    }
    function loadTile(m, tx, ty) {
      const si = allocSlot();
      if (si < 0) return -1;
      genTile(vt.tileImg, TILE, 0, 0, m, tx, ty);
      vt.ag.putImageData(vt.tileImg, (si % vt.cols) * TILE, Math.floor(si / vt.cols) * TILE);
      const s = vt.slots[si];
      s.mip = m; s.tx = tx; s.ty = ty; s.used = vt.frame;
      vt.table[m][ty * (1 << (MAXMIP - m)) + tx] = si;
      return si;
    }
    const lookup = (m, tx, ty) => vt.table[m][ty * (1 << (MAXMIP - m)) + tx];
    // 없는 타일의 가장 가까운 상주 조상 (k = 올라간 단계 수)
    function resident(m, tx, ty) {
      for (let k = 0; m + k <= MAXMIP; k++) {
        const s = lookup(m + k, tx >> k, ty >> k);
        if (s >= 0) return { slot: s, k };
      }
      return null;
    }

    // ── 카메라: 화면 1px당 가상 px = 2^e ──
    let cam, tau, dirOff, manual, drag;
    function init() {
      ctx.rng = U.rng(ctx.seed);
      cam = { x: 8192, y: 8192, e: -1 };
      for (let i = 0; i < 40; i++) {
        const x = ctx.rng.range(4000, 12000), y = ctx.rng.range(4000, 12000), ev = elevAt(x, y);
        cam.x = x; cam.y = y;
        if (ev > 0.52 && ev < 0.8) break;
      }
      tau = 0; dirOff = ctx.rng.range(0, U.TAU); manual = false; drag = null;
      fixed = null; vt = null; genCount = 0;
    }
    init();

    const desiredMip = (e, bias) => U.clamp(Math.floor(e + bias + 0.5), 0, MAXMIP);
    function visibleRange(m, W, H) {
      const span = TILE << m, k = Math.pow(2, cam.e);
      const x0 = cam.x - W / 2 * k, y0 = cam.y - H / 2 * k, x1 = cam.x + W / 2 * k, y1 = cam.y + H / 2 * k;
      const n = 1 << (MAXMIP - m);
      return {
        tx0: U.clamp(Math.floor(x0 / span), 0, n - 1), ty0: U.clamp(Math.floor(y0 / span), 0, n - 1),
        tx1: U.clamp(Math.floor(x1 / span), 0, n - 1), ty1: U.clamp(Math.floor(y1 / span), 0, n - 1),
        empty: x1 < 0 || y1 < 0 || x0 > VSIZE || y0 > VSIZE,
      };
    }

    // 피드백 패스: 8px 간격으로 화면을 샘플링해 필요한 타일 목록을 만듦
    function feedback(W, H) {
      const m = desiredMip(cam.e, P.bias), k = Math.pow(2, cam.e), span = TILE << m, n = 1 << (MAXMIP - m);
      const need = new Map();
      let samples = 0;
      for (let sy0 = 0; sy0 < H + 8; sy0 += 8) {
        const sy = Math.min(sy0, H - 1);
        for (let sx0 = 0; sx0 < W + 8; sx0 += 8) {
          const sx = Math.min(sx0, W - 1);
          samples++;
          const vx = cam.x + (sx - W / 2) * k, vy = cam.y + (sy - H / 2) * k;
          if (vx < 0 || vy < 0 || vx >= VSIZE || vy >= VSIZE) continue;
          const tx = Math.floor(vx / span), ty = Math.floor(vy / span);
          const key = ty * n + tx;
          if (!need.has(key)) need.set(key, { m, tx, ty, d: Math.abs(sx - W / 2) + Math.abs(sy - H / 2) });
        }
      }
      vt.samples = samples;
      return [...need.values()];
    }

    function updateVT(W, H) {
      vt.frame++;
      const need = feedback(W, H);
      vt.requested = need.length;
      // 1) 상주 타일은 사용 시각 갱신, 없으면 자신과 없는 조상을 로드 대기열에 넣음
      const queue = new Map();
      for (const t of need) {
        for (let k = 0; t.m + k <= MAXMIP; k++) {
          const m = t.m + k, tx = t.tx >> k, ty = t.ty >> k, s = lookup(m, tx, ty);
          if (s >= 0) { vt.slots[s].used = vt.frame; break; }
          const key = m * 100000 + ty * 300 + tx;
          if (!queue.has(key)) queue.set(key, { m, tx, ty, d: t.d });
        }
      }
      // 2) 거친 mip 먼저(폴백 품질), 같은 mip이면 화면 중심에 가까운 순
      const list = [...queue.values()].sort((a, b) => b.m - a.m || a.d - b.d);
      vt.queue = list.length;
      vt.uploads = 0; vt.full = 0;
      const t0 = ctx.now();
      for (const t of list) {
        if (vt.uploads >= P.budget) break;
        if (loadTile(t.m, t.tx, t.ty) < 0) { vt.full = list.length - vt.uploads; break; }
        vt.uploads++;
      }
      const ms = ctx.now() - t0;
      vt.genMs = vt.genMs * 0.85 + ms * 0.15;
    }

    function autoCamera(dt, W) {
      tau += dt * P.camSpeed;
      cam.e = 2.5 - 3.5 * Math.cos(tau * 0.2);
      const th = dirOff + tau * 0.15 + Math.sin(tau * 0.37) * 1.5;
      const v = W * Math.pow(2, cam.e) * 0.12 * P.camSpeed;
      cam.x += Math.cos(th) * v * dt; cam.y += Math.sin(th) * v * dt;
      if (cam.x < 600 || cam.x > VSIZE - 600 || cam.y < 600 || cam.y > VSIZE - 600) {
        cam.x = U.clamp(cam.x, 600, VSIZE - 600); cam.y = U.clamp(cam.y, 600, VSIZE - 600);
        dirOff += Math.PI * 0.8;
      }
    }

    const toScreen = (vx, vy, W, H, k) => [(vx - cam.x) / k + W / 2, (vy - cam.y) / k + H / 2];

    function drawOverlay(g, W, H, m) {
      const pad = 8, cell = 4;
      const ptS = 96, ox = W - pad - ptS, oy = H - pad - ptS;
      const cw = 32 * cell, px0 = P.method === 'vt' ? ox - 12 - cw - 6 : ox + ptS - 170;
      D.rect(g, px0, oy - 46, W - 2 - px0, H - 2 - (oy - 46), 'rgba(0,0,0,0.6)');
      // 페이지 테이블 (현재 mip): 가상 공간 전체를 96px로
      D.rect(g, ox - 1, oy - 1, ptS + 2, ptS + 2, 'rgba(0,0,0,0.65)');
      const n = 1 << (MAXMIP - m), cs = ptS / n;
      if (P.method === 'fixed') {
        D.rect(g, ox, oy, ptS, ptS, 'rgba(255,122,89,0.45)');
      } else {
        const tb = vt.table[m];
        g.fillStyle = 'rgba(123,216,143,0.9)';
        for (const s of vt.slots) if (s.mip === m) g.fillRect(ox + s.tx * cs, oy + s.ty * cs, Math.max(1, cs), Math.max(1, cs));
        if (tb.length <= 64) { g.strokeStyle = 'rgba(255,255,255,0.15)'; for (let i = 0; i <= n; i++) { D.line(g, ox + i * cs, oy, ox + i * cs, oy + ptS, 'rgba(255,255,255,0.15)', 1); D.line(g, ox, oy + i * cs, ox + ptS, oy + i * cs, 'rgba(255,255,255,0.15)', 1); } }
      }
      const k = Math.pow(2, cam.e), sc = ptS / VSIZE;
      g.save(); g.beginPath(); g.rect(ox, oy, ptS, ptS); g.clip();
      g.strokeStyle = C.accent; g.lineWidth = 1;
      g.strokeRect(ox + (cam.x - W / 2 * k) * sc, oy + (cam.y - H / 2 * k) * sc, Math.max(2, W * k * sc), Math.max(2, H * k * sc));
      g.restore();
      D.text(g, GTL.L('페이지 테이블 mip ', 'Page table mip ') + (P.method === 'fixed' ? fixed.mip : m) + ` (${n}x${n})`, ox + ptS, oy - 14, { size: 10, color: C.text, align: 'right' });
      // 물리 캐시 점유
      if (P.method === 'vt') {
        const cols = 32, rows = Math.ceil(vt.cap / cols);
        const chh = rows * cell, cx = ox - 12 - cw, cy = oy;
        D.rect(g, cx - 1, cy - 1, cw + 2, chh + 2, 'rgba(0,0,0,0.65)');
        for (let i = 0; i < vt.cap; i++) {
          const s = vt.slots[i];
          if (s.mip < 0) continue;
          g.globalAlpha = s.used === vt.frame ? 1 : 0.3;
          D.rect(g, cx + (i % cols) * cell, cy + Math.floor(i / cols) * cell, cell - 1, cell - 1, MIPCOL[s.mip]);
        }
        g.globalAlpha = 1;
        D.text(g, GTL.L('물리 캐시 ', 'Physical cache ') + vt.cap + GTL.L(' 타일', ' tiles'), cx + cw, cy - 28, { size: 10, color: C.text, align: 'right' });
        D.text(g, GTL.L('색 = mip, 흐림 = 이번 프레임 미사용', 'color = mip, faded = unused now'), cx + cw, cy - 42, { size: 9, color: C.dim, align: 'right' });
      }
    }

    return {
      update(dt) {
        const W = ctx.width, H = ctx.height;
        if (P.autoCam && !manual) autoCamera(dt, W);
        if (P.method === 'fixed') ensureFixed();
        else { ensureVT(); updateVT(W, H); }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        D.rect(g, 0, 0, W, H, '#0b0d10');
        const k = Math.pow(2, cam.e);
        g.imageSmoothingEnabled = true;
        const m = desiredMip(cam.e, P.bias);
        let fallbacks = 0, drawn = 0;
        if (P.method === 'fixed') {
          if (!fixed) return;
          const r = VSIZE / fixed.size;       // 가상 px / 텍셀
          const x0 = U.clamp(cam.x - W / 2 * k, 0, VSIZE), y0 = U.clamp(cam.y - H / 2 * k, 0, VSIZE);
          const x1 = U.clamp(cam.x + W / 2 * k, 0, VSIZE), y1 = U.clamp(cam.y + H / 2 * k, 0, VSIZE);
          if (x1 > x0 && y1 > y0) {
            const [dx, dy] = toScreen(x0, y0, W, H, k);
            g.drawImage(fixed.cv, x0 / r, y0 / r, (x1 - x0) / r, (y1 - y0) / r, dx, dy, (x1 - x0) / k, (y1 - y0) / k);
          }
          if (P.tint) { g.globalAlpha = 0.25; D.rect(g, 0, 0, W, H, MIPCOL[fixed.mip]); g.globalAlpha = 1; }
          if (P.showTiles) {
            const span = TILE << fixed.mip, rg = visibleRange(fixed.mip, W, H);
            const [ax, ay] = toScreen(0, 0, W, H, k), [bx, by] = toScreen(VSIZE, VSIZE, W, H, k);
            const lx0 = Math.max(0, ax), ly0 = Math.max(0, ay), lx1 = Math.min(W, bx), ly1 = Math.min(H, by);
            if (!rg.empty) {
              for (let tx = rg.tx0; tx <= rg.tx1 + 1; tx++) { const [sx] = toScreen(tx * span, 0, W, H, k); D.line(g, sx, ly0, sx, ly1, 'rgba(255,255,255,0.18)', 1); }
              for (let ty = rg.ty0; ty <= rg.ty1 + 1; ty++) { const [, sy] = toScreen(0, ty * span, W, H, k); D.line(g, lx0, sy, lx1, sy, 'rgba(255,255,255,0.18)', 1); }
            }
          }
        } else {
          if (!vt) return;
          const rg = visibleRange(m, W, H), span = TILE << m;
          if (!rg.empty) {
            for (let ty = rg.ty0; ty <= rg.ty1; ty++) {
              for (let tx = rg.tx0; tx <= rg.tx1; tx++) {
                const res = resident(m, tx, ty);
                if (!res) continue;
                const sub = TILE / (1 << res.k);
                const sxs = (res.slot % vt.cols) * TILE + (tx & ((1 << res.k) - 1)) * sub;
                const sys = Math.floor(res.slot / vt.cols) * TILE + (ty & ((1 << res.k) - 1)) * sub;
                const [dx, dy] = toScreen(tx * span, ty * span, W, H, k);
                const ds = span / k;
                g.drawImage(vt.atlas, sxs, sys, sub, sub, Math.floor(dx), Math.floor(dy), Math.ceil(ds) + 1, Math.ceil(ds) + 1);
                drawn++;
                const usedMip = m + res.k;
                if (P.tint) { g.globalAlpha = 0.25; D.rect(g, dx, dy, ds, ds, MIPCOL[usedMip]); g.globalAlpha = 1; }
                if (P.showTiles) {
                  if (res.k > 0) { fallbacks++; g.strokeStyle = C.bad; g.lineWidth = 2; g.strokeRect(dx + 2, dy + 2, ds - 4, ds - 4); }
                  else { g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1; g.strokeRect(dx + 0.5, dy + 0.5, ds, ds); }
                } else if (res.k > 0) fallbacks++;
              }
            }
          }
        }
        if (P.overlay) drawOverlay(g, W, H, P.method === 'fixed' ? fixed.mip : m);

        const MB = (b) => (b / 1048576).toFixed(1) + ' MB';
        const sharpBytes = VSIZE * VSIZE * 4 * 4 / 3;
        ctx.stat(GTL.L('확대 배율', 'Zoom'), (1 / k).toFixed(3) + 'x');
        ctx.stat(GTL.L('필요한 mip', 'Needed mip'), desiredMip(cam.e, P.method === 'vt' ? P.bias : 0));
        if (P.method === 'fixed') {
          ctx.stat(GTL.L('사용 mip', 'Used mip'), fixed.mip + ` (${fixed.size}x${fixed.size})`);
          ctx.stat(GTL.L('텍스처 메모리', 'Texture memory'), MB(fixed.bytes));
          ctx.stat(GTL.L('시작 때 생성한 타일', 'Tiles built at start'), fixed.tiles);
          ctx.stat(GTL.L('선명한 전체 로드', 'Sharp full load'), MB(sharpBytes));
        } else {
          ctx.stat(GTL.L('물리 캐시 메모리', 'Physical cache memory'), MB(vt.cap * TILE * TILE * 4));
          ctx.stat(GTL.L('피드백 샘플', 'Feedback samples'), vt.samples);
          ctx.stat(GTL.L('요청 타일', 'Requested tiles'), vt.requested);
          ctx.stat(GTL.L('이번 프레임 업로드', 'Uploaded this frame'), vt.uploads + ' / ' + P.budget);
          ctx.stat(GTL.L('대기 중 타일', 'Pending tiles'), Math.max(0, vt.queue - vt.uploads));
          ctx.stat(GTL.L('폴백 타일', 'Fallback tiles'), fallbacks + ' / ' + drawn);
          ctx.stat(GTL.L('교체 누계 (LRU)', 'Evictions (LRU)'), vt.evictions);
          ctx.stat(GTL.L('생성 시간', 'Build time'), vt.genMs.toFixed(2) + ' ms');
          ctx.stat(GTL.L('캐시 부족', 'Cache full'), vt.full ? vt.full + GTL.L(' 타일 대기', ' tiles waiting') : '-');
        }
      },
      onPointer(type, mouse, ev) {
        if (type === 'down') { drag = { x: mouse.x, y: mouse.y }; manual = true; }
        else if (type === 'up' || type === 'leave') drag = null;
        else if (type === 'move' && drag && mouse.down) {
          const k = Math.pow(2, cam.e);
          cam.x = U.clamp(cam.x - (mouse.x - drag.x) * k, 0, VSIZE);
          cam.y = U.clamp(cam.y - (mouse.y - drag.y) * k, 0, VSIZE);
          drag = { x: mouse.x, y: mouse.y };
        } else if (type === 'wheel') {
          const dy = ev && ev.deltaY !== undefined ? ev.deltaY : mouse.wheel || 0;
          if (!dy) return;
          manual = true;
          const W = ctx.width, H = ctx.height, k0 = Math.pow(2, cam.e);
          const vx = cam.x + (mouse.x - W / 2) * k0, vy = cam.y + (mouse.y - H / 2) * k0;
          cam.e = U.clamp(cam.e + Math.sign(dy) * 0.25, -2, 7);
          const k1 = Math.pow(2, cam.e);
          cam.x = vx - (mouse.x - W / 2) * k1; cam.y = vy - (mouse.y - H / 2) * k1;
          if (ev && ev.preventDefault) ev.preventDefault();
        }
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
