// 캔버스 재생성 범위: 캔버스 하나 vs 정적 캔버스 + 동적 하위 캔버스 (Unity uGUI, Unreal Invalidation Box)
GTL.register({
  id: 'canvas-dirty-rebuild',
  title: '캔버스 다시 만들기와 하위 캔버스 분리 (uGUI Canvas, UMG Invalidation)',
  summary: 'UI 캔버스 하나에서 요소 하나만 바뀌어도 캔버스 전체의 메시를 다시 만듦. 자주 바뀌는 요소(타이머, 체력바, 미니맵 마커)를 하위 캔버스로 떼어 내면 그 부분만 다시 만들어서 정점 작업이 크게 줄어듦.',
  views: { a: '캔버스 하나', b: '정적 + 동적 하위 캔버스' },
  controls: '조작 없음. 체력바, 타이머, 미니맵 마커가 계속 바뀜. 다시 만든 요소는 잠깐 색이 칠해짐.',
  info: `
    <p>Unity uGUI의 <b>캔버스</b>(Canvas)는 안에 있는 UI 요소를 메시 하나로 묶어서 그림. 그래서 그리기 호출(배치)이 적음.</p>
    <p>문제: 요소 하나가 바뀌면 그 요소가 <b>더티</b>(dirty, 다시 만들어야 함) 표시를 받고, 캔버스 전체가 더티가 됨. 다음 프레임에 캔버스의 모든 요소 정점을 다시 만들고 배치를 다시 계산.</p>
    <ul>
      <li>정적 요소 수백 개와 매 프레임 바뀌는 체력바 하나가 같은 캔버스에 있으면, 정적 요소도 매 프레임 다시 만듦</li>
      <li>비용은 바뀐 요소 수가 아니라 캔버스 전체 정점 수에 비례</li>
    </ul>
    <p>해결 방법: 자주 바뀌는 요소를 <b>하위 캔버스</b>(nested Canvas)로 옮김. 하위 캔버스는 부모와 따로 메시를 만들어서, 더티 표시가 부모로 번지지 않음.</p>
    <ul>
      <li>정적 캔버스: 패널, 인벤토리 칸, 아이콘, 미니맵 지형. 가끔만 다시 만듦.</li>
      <li>동적 하위 캔버스: 타이머, 체력바, 미니맵 마커. 매 프레임 다시 만들어도 정점이 적음.</li>
      <li>Unreal UMG는 <b>Invalidation Box</b>가 같은 역할. 안쪽 위젯의 레이아웃과 그리기 결과를 저장해 두고, 바뀔 때만 다시 계산.</li>
    </ul>
    <p>단점: 캔버스끼리는 배치를 합칠 수 없어서 그리기 호출이 늘어남. 캔버스를 너무 잘게 나누면 오히려 느려짐. "자주 바뀌는 것끼리 묶기"가 기준.</p>
    <p>이 샘플은 다시 만들기를 실제 반복문으로 함. 요소마다 사각형 정점(위치, UV, 재질 번호)을 배열에 다시 쓰고, 화면은 그 배열에서 그림.</p>`,
  // 도식: 캔버스 트리와 더티 표시. A는 더티가 캔버스 전체로 번짐, B는 하위 캔버스에서 멈춤
  diagram: (L) => {
    const node = (x, y, w, t, cls) => `<rect x="${x}" y="${y}" width="${w}" height="20" rx="3" class="${cls}"/><text x="${x + w / 2}" y="${y + 14}" text-anchor="middle" class="t-small">${t}</text>`;
    const kids = [L('패널', 'Panel'), L('인벤토리', 'Inventory'), L('미니맵', 'Minimap')];
    return `<svg viewBox="0 0 540 206" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arrA" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="16" class="t-a">${L('A: 캔버스 하나', 'A: one canvas')}</text>
    ${node(80, 28, 100, L('캔버스 (더티)', 'Canvas (dirty)'), 'f-a')}
    ${kids.map((t, i) => `<line x1="130" y1="48" x2="${38 + i * 62}" y2="80" class="d-dim"/>${node(10 + i * 62, 80, 56, t, 'f-a')}`).join('')}
    <line x1="130" y1="48" x2="222" y2="80" class="d-dim"/>
    ${node(196, 80, 56, L('체력바', 'Health'), 'f-a')}
    <path d="M224,80 Q232,52 182,38" class="d-a" marker-end="url(#arrA)"/>
    <text x="234" y="60" class="t-small t-a">${L('더티가 번짐', 'dirty spreads')}</text>
    <text x="10" y="124" class="t-small t-a">${L('다시 만드는 범위: 캔버스 전체', 'Rebuild scope: whole canvas')}</text>
    <text x="10" y="138" class="t-small t-dim">${L('정점 수 = 모든 요소의 합', 'Vertices = sum of all elements')}</text>
    <line x1="270" y1="8" x2="270" y2="146" class="d-dim"/>
    <text x="284" y="16" class="t-b">${L('B: 하위 캔버스 분리', 'B: split sub-canvas')}</text>
    ${node(330, 28, 100, L('정적 캔버스', 'Static canvas'), 'f-dim')}
    ${kids.map((t, i) => `<line x1="380" y1="48" x2="${312 + i * 50}" y2="80" class="d-dim"/>${node(286 + i * 50, 80, 48, t, 'f-dim')}`).join('')}
    <line x1="380" y1="48" x2="476" y2="80" class="d-dim"/>
    ${node(436, 80, 96, L('하위 캔버스', 'Sub-canvas'), 'f-b')}
    <line x1="460" y1="100" x2="460" y2="112" class="d-dim"/><line x1="508" y1="100" x2="508" y2="112" class="d-dim"/>
    ${node(436, 112, 48, L('체력바', 'Health'), 'f-b')}${node(486, 112, 48, L('타이머', 'Timer'), 'f-b')}
    <text x="284" y="124" class="t-small t-b">${L('하위 캔버스에서 멈춤', 'Stops at the sub-canvas')}</text>
    <text x="284" y="138" class="t-small t-dim">${L('정적 쪽은 그대로 재사용', 'Static side is reused')}</text>
    <text x="10" y="166" class="t-small">${L('프레임마다: 값 바뀜 → 요소 더티 → 소속 캔버스 더티 → 캔버스의 모든 요소 정점 다시 씀', 'Each frame: value changes, element dirty, its canvas dirty, all its elements rewrite vertices')}</text>
    <rect x="10" y="178" width="400" height="10" class="f-a"/><text x="416" y="187" class="t-small t-a">${L('A 정점', 'A verts')}</text>
    <rect x="10" y="192" width="22" height="10" class="f-b"/><text x="38" y="201" class="t-small t-b">${L('B 정점 (배치는 캔버스 수만큼 늘어남)', 'B verts (batches grow with canvas count)')}</text>
  </svg>`;
  },
  look: [
    'A는 HUD 전체가 매 프레임 주황색으로 깜박임. B는 체력바, 타이머, 미니맵 마커만 파랗게 깜박임.',
    '"이번 프레임 다시 만든 정점"을 비교하면 A는 수천 개, B는 수십~수백 개',
    '"정적 요소 수"를 400으로 올리면 A의 정점과 재생성 시간이 함께 커짐. B는 거의 그대로.',
    '"체력바 애니메이션"과 "미니맵 마커 이동"을 끄면 A도 타이머가 바뀌는 0.1초마다만 다시 만듦. 그래도 매번 전체를 다시 만듦.',
    '"골드 바꾸기"를 누르면 B에서도 정적 캔버스 전체가 한 번 깜박임. 정적 요소도 바뀌면 다시 만들어야 함.',
    '"배치 수"는 B가 더 많음. 캔버스를 나누면 그리기 호출이 늘어나는 대가가 있음.',
  ],
  refs: [
    { type: 'article', title: 'Unity - Optimization tips for Unity UI', url: 'https://unity.com/how-to/unity-ui-optimization-tips', note: '"Split up your Canvases" 항목. 요소 하나가 바뀌면 캔버스 전체가 더티가 됨.' },
    { type: 'engine', title: 'Unity uGUI 2.0 - Canvas', url: 'https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/UICanvas.html' },
    { type: 'engine', title: 'Unity Scripting API - Canvas', url: 'https://docs.unity3d.com/ScriptReference/Canvas.html', note: 'Canvas.willRenderCanvases 시점에 더티 요소의 그래픽을 다시 만듦' },
    { type: 'engine', title: 'Unreal Engine - Invalidation in Slate and UMG', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/invalidation-in-slate-and-umg-for-unreal-engine', note: 'Invalidation Box, Retainer Panel, 전역 무효화(Global Invalidation)' },
  ],
  params: [
    { key: 'layout', label: '캔버스 구성', type: 'select', group: '방식', options: [
      { value: 'single', label: '캔버스 하나' },
      { value: 'split', label: '정적 + 동적 하위 캔버스' },
    ], a: 'single', b: 'split' },
    { key: 'staticCount', label: '정적 요소 수 (인벤토리 칸)', type: 'int', min: 20, max: 400, step: 10, default: 150, shared: true, reset: true, group: 'HUD' },
    { key: 'animHealth', label: '체력바 애니메이션', type: 'bool', default: true, shared: true, help: '매 프레임 채움 길이가 바뀜' },
    { key: 'animTimer', label: '타이머', type: 'bool', default: true, shared: true, help: '0.1초마다 숫자가 바뀜' },
    { key: 'animMarker', label: '미니맵 마커 이동', type: 'bool', default: true, shared: true },
    { key: 'flash', label: '다시 만든 요소 표시', type: 'bool', default: true, shared: true },
    { key: 'gold', label: '골드 바꾸기', type: 'button', help: '정적 캔버스의 골드 숫자를 바꿈' },
  ],
  en: {
    title: 'Canvas Rebuild and Sub-Canvas Split (uGUI Canvas, UMG Invalidation)',
    summary: 'In one UI canvas, a change to a single element rebuilds the mesh of the whole canvas. Move the elements that change often (timer, health bar, minimap marker) to a sub-canvas, and only that part is rebuilt, so vertex work drops a lot.',
    views: { a: 'One canvas', b: 'Static + dynamic sub-canvas' },
    controls: 'No input. The health bar, timer, and minimap marker keep changing. Rebuilt elements are tinted for a moment.',
    info: `
    <p>A Unity uGUI <b>Canvas</b> merges the UI elements inside it into one mesh. That keeps draw calls (batches) low.</p>
    <p>The problem: when one element changes, it gets marked <b>dirty</b> (needs a rebuild), and the whole canvas becomes dirty. On the next frame, the canvas rewrites the vertices of every element and recomputes its batches.</p>
    <ul>
      <li>If hundreds of static elements share a canvas with a health bar that changes every frame, the static elements are rebuilt every frame too.</li>
      <li>The cost grows with the vertex count of the whole canvas, not with the number of changed elements.</li>
    </ul>
    <p>The fix: move the elements that change often to a <b>sub-canvas</b> (nested Canvas). A sub-canvas builds its own mesh, so its dirty flag does not spread to the parent.</p>
    <ul>
      <li>Static canvas: panels, inventory slots, icons, minimap terrain. Rebuilt only now and then.</li>
      <li>Dynamic sub-canvas: timer, health bar, minimap marker. Rebuilt every frame, but it has few vertices.</li>
      <li>In Unreal UMG, the <b>Invalidation Box</b> plays the same role. It caches the layout and paint result of its child widgets and recomputes them only when they change.</li>
    </ul>
    <p>Downside: batches cannot merge across canvases, so draw calls go up. Splitting into too many canvases makes things slower. Group things that change at the same rate.</p>
    <p>This sample does the rebuild with a real loop. Each element rewrites its quad vertices (position, UV, material id) into an array, and the view draws from that array.</p>`,
    look: [
      'A tints the whole HUD orange every frame. B tints only the health bar, timer, and minimap marker blue.',
      'Compare "Vertices rebuilt this frame". A rebuilds thousands, B tens to hundreds.',
      'Raise "Static elements" to 400. A\'s vertices and rebuild time grow with it. B stays almost the same.',
      'Turn off "Health bar animation" and "Minimap marker movement". A now rebuilds only when the timer changes (every 0.1 s), but still rebuilds everything each time.',
      'Press "Change gold". Even in B, the whole static canvas flashes once. Static elements must be rebuilt when they change.',
      '"Batches" is higher in B. Splitting canvases costs extra draw calls.',
    ],
    refs: [
      'The "Split up your Canvases" section. One changed element dirties the whole canvas.',
      null,
      'Dirty graphics are rebuilt at Canvas.willRenderCanvases.',
      'Invalidation Box, Retainer Panel, Global Invalidation.',
    ],
    params: {
      layout: { label: 'Canvas setup', group: 'Method', options: { single: 'One canvas', split: 'Static + dynamic sub-canvas' } },
      staticCount: { label: 'Static elements (inventory slots)', group: 'HUD' },
      animHealth: { label: 'Health bar animation', help: 'The fill length changes every frame' },
      animTimer: { label: 'Timer', help: 'The digits change every 0.1 s' },
      animMarker: 'Minimap marker movement',
      flash: 'Show rebuilt elements',
      gold: { label: 'Change gold', help: 'Changes the gold number on the static canvas' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    // 재질 번호별 색 (같은 재질끼리는 배치로 묶임)
    const MAT = ['#1c2230', '#3a4458', '#d8dee9', '#e0525f', '#2f5a3a', '#24402d', '#ffd166', '#ffffff',
      '#5a7fd6', '#a05ad6', '#5ad69a', '#d6a35a', '#d65a7f'];
    const M = { bg: 0, border: 1, text: 2, hp: 3, land: 4, land2: 5, marker: 6, white: 7, icon: 8 };
    const FLOATS = 20;                         // 사각형 1개 = 정점 4개 × (x, y, u, v, 재질)
    // 7-세그먼트 숫자 (a b c d e f g)
    const SEG = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f];

    let W = 0, H = 0, t = 0, els, canvases, gold, hp, timer, mx, my;
    let frameVerts = 0, frameEls = 0, frameCanv = 0, vertsPerSec = 0, rebuildMs = 0;

    // 정점 쓰기: 현재 캔버스 버퍼에 사각형 하나 추가
    let cur = null;
    function quad(x, y, w, h, mat) {
      if ((cur.n + 1) * FLOATS > cur.vb.length) { const nb = new Float32Array(cur.vb.length * 2); nb.set(cur.vb); cur.vb = nb; }
      const v = cur.vb, o = cur.n * FLOATS;
      v[o] = x; v[o + 1] = y; v[o + 2] = 0; v[o + 3] = 0; v[o + 4] = mat;
      v[o + 5] = x + w; v[o + 6] = y; v[o + 7] = 1; v[o + 8] = 0; v[o + 9] = mat;
      v[o + 10] = x + w; v[o + 11] = y + h; v[o + 12] = 1; v[o + 13] = 1; v[o + 14] = mat;
      v[o + 15] = x; v[o + 16] = y + h; v[o + 17] = 0; v[o + 18] = 1; v[o + 19] = mat;
      cur.n++;
    }
    function digit(x, y, w, h, d, mat) {
      const s = SEG[d], k = Math.max(1, Math.round(w * 0.2)), hh = h / 2;
      if (s & 1) quad(x, y, w, k, mat);
      if (s & 2) quad(x + w - k, y, k, hh, mat);
      if (s & 4) quad(x + w - k, y + hh, k, hh, mat);
      if (s & 8) quad(x, y + h - k, w, k, mat);
      if (s & 16) quad(x, y + hh, k, hh, mat);
      if (s & 32) quad(x, y, k, hh, mat);
      if (s & 64) quad(x, y + hh - k / 2, w, k, mat);
    }
    function number(x, y, size, str, mat) {
      const w = size * 0.55;
      for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (c >= '0' && c <= '9') digit(x, y, w, size, c.charCodeAt(0) - 48, mat);
        else if (c === ':') { quad(x + w * 0.3, y + size * 0.25, 2, 2, mat); quad(x + w * 0.3, y + size * 0.7, 2, 2, mat); }
        else if (c === '.') quad(x + w * 0.3, y + size - 2, 2, 2, mat);
        x += w + Math.max(2, size * 0.2);
      }
    }
    // 가짜 글자: 글자마다 획 2~3개
    function label(x, y, size, n, seed, mat) {
      const w = size * 0.5;
      for (let i = 0; i < n; i++) {
        const h = (seed * 31 + i * 17) % 7;
        if (h === 6) { x += w * 0.8; continue; }  // 띄어쓰기
        quad(x, y + size * 0.15, Math.max(1, w * 0.25), size * 0.85, mat);
        quad(x, y + (h & 1 ? size * 0.45 : size * 0.15), w, Math.max(1, size * 0.15), mat);
        if (h & 2) quad(x + w * 0.75, y + size * 0.15, Math.max(1, w * 0.25), size * 0.85, mat);
        x += w * 1.3;
      }
    }
    function panel(e) {
      quad(e.x, e.y, e.w, e.h, M.bg);
      quad(e.x, e.y, e.w, 1, M.border); quad(e.x, e.y + e.h - 1, e.w, 1, M.border);
      quad(e.x, e.y, 1, e.h, M.border); quad(e.x + e.w - 1, e.y, 1, e.h, M.border);
    }

    // 요소 종류별 정점 생성
    const GEN = {
      panel,
      label: (e) => label(e.x, e.y, e.h, e.len, e.seed, M.text),
      slot: (e) => {
        panel(e);
        const p = Math.max(2, e.w * 0.15);
        quad(e.x + p, e.y + p, e.w - 2 * p, e.h - 2 * p, M.icon + (e.item % 5));
        if (e.w >= 18) number(e.x + e.w * 0.5, e.y + e.h * 0.6, Math.max(5, e.h * 0.3), String(e.count), M.white);
      },
      minimap: (e) => {
        panel(e);
        const n = 10, s = (e.w - 4) / n;
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
          if ((e.seed >> ((i * 7 + j * 3) % 24)) & 1 || (i + j) % 3 === 0) quad(e.x + 2 + i * s, e.y + 2 + j * s, s - 1, s - 1, (i * j + e.seed) % 2 ? M.land : M.land2);
        }
      },
      gold: (e) => { quad(e.x, e.y + 2, e.h - 4, e.h - 4, M.marker); number(e.x + e.h, e.y, e.h, String(gold), M.marker); },
      health: (e) => {
        quad(e.x, e.y, e.w, e.h, M.bg);
        quad(e.x + 1, e.y + 1, Math.round((e.w - 2) * hp), e.h - 2, M.hp);
        for (let i = 1; i < 10; i++) quad(e.x + (e.w * i) / 10, e.y + 1, 1, e.h - 2, M.bg);
        number(e.x + e.w + 6, e.y, e.h, String(Math.round(hp * 1000)), M.text);
      },
      timer: (e) => {
        const m = Math.floor(timer / 60), s = Math.floor(timer % 60), d = Math.floor((timer * 10) % 10);
        number(e.x, e.y, e.h, `${m}:${String(s).padStart(2, '0')}.${d}`, M.white);
      },
      marker: (e) => {
        const x = Math.round(mx), y = Math.round(my);
        quad(x - 4, y - 1, 9, 3, M.marker); quad(x - 1, y - 4, 3, 9, M.marker); quad(x - 2, y - 2, 5, 5, M.white);
      },
    };

    function init() {
      ctx.rng = U.rng(ctx.seed);
      const r = ctx.rng;
      gold = 12480; t = 0; hp = 0.8; timer = 300; mx = my = 0;
      const mk = (type, dyn, extra) => ({ type, dyn, x: 0, y: 0, w: 0, h: 0, flash: 0, ...extra });
      els = [];
      els.push(mk('panel', false, { role: 'top' }));
      els.push(mk('slot', false, { role: 'portrait', item: 0, count: 42 }));
      els.push(mk('label', false, { role: 'name', len: 9, seed: 3 }));
      els.push(mk('health', true, { role: 'hp' }));
      for (let i = 0; i < 6; i++) els.push(mk('slot', false, { role: 'buff', i, item: i, count: r.int(1, 9) }));
      els.push(mk('panel', false, { role: 'timerFrame' }));
      els.push(mk('timer', true, { role: 'timer' }));
      els.push(mk('minimap', false, { role: 'minimap', seed: r.int(0, 0xffffff) }));
      els.push(mk('marker', true, { role: 'marker' }));
      els.push(mk('gold', false, { role: 'gold' }));
      els.push(mk('panel', false, { role: 'invFrame' }));
      for (let i = 0; i < P.staticCount; i++) els.push(mk('slot', false, { role: 'inv', i, item: r.int(0, 4), count: r.int(1, 99) }));
      for (let i = 0; i < 8; i++) els.push(mk('slot', false, { role: 'skill', i, item: r.int(0, 4), count: i + 1 }));
      for (let i = 0; i < 3; i++) els.push(mk('label', false, { role: 'chat', i, len: r.int(16, 28), seed: r.int(1, 99) }));
      canvases = [
        { name: 'root', n: 0, vb: new Float32Array(4096), dirty: true, flash: 0, batches: 0, els: [] },
        { name: 'sub', n: 0, vb: new Float32Array(1024), dirty: true, flash: 0, batches: 0, els: [] },
      ];
      W = H = 0;
    }
    init();

    // 화면 크기에 맞춰 요소 배치
    function layout() {
      W = ctx.width; H = ctx.height;
      const mmS = Math.round(U.clamp(Math.min(W, H) * 0.24, 70, 120));
      const hpW = Math.round(U.clamp(W * 0.28, 70, 170));
      let invTop = 0;
      for (const e of els) {
        const set = (x, y, w, h) => { e.x = Math.round(x); e.y = Math.round(y); e.w = Math.round(w); e.h = Math.round(h); };
        switch (e.role) {
          case 'top': set(6, 6, Math.max(120, W * 0.45), 62); break;
          case 'portrait': set(12, 12, 50, 50); break;
          case 'name': set(70, 13, 0, 10); break;
          case 'hp': set(70, 28, hpW, 12); break;
          case 'buff': set(70 + e.i * 16, 46, 14, 14); break;
          case 'timerFrame': set(W * 0.62 - 50 - mmS * 0.3, 8, 92, 30); break;
          case 'timer': set(W * 0.62 - 42 - mmS * 0.3, 14, 0, 18); break;
          case 'minimap': set(W - mmS - 8, 8, mmS, mmS); break;
          case 'marker': break;
          case 'gold': set(W - mmS - 8, mmS + 14, 0, 12); invTop = mmS + 34; break;
        }
      }
      invTop = Math.max(invTop, 76);
      const invBot = H - 96, invH = Math.max(40, invBot - invTop), invW = W - 16;
      const n = P.staticCount;
      const cols = Math.max(1, Math.ceil(Math.sqrt((n * invW) / invH)));
      const rows = Math.ceil(n / cols), s = Math.max(6, Math.min(invW / cols, invH / rows));
      for (const e of els) {
        if (e.role === 'invFrame') { e.x = 6; e.y = invTop - 4; e.w = W - 12; e.h = rows * s + 8; }
        if (e.role === 'inv') { e.x = Math.round(8 + (e.i % cols) * s); e.y = Math.round(invTop + Math.floor(e.i / cols) * s); e.w = e.h = Math.max(4, Math.round(s - 2)); }
        if (e.role === 'skill') { e.w = e.h = 30; e.x = Math.round(W - 8 - (8 - e.i) * 33); e.y = H - 86; }
        if (e.role === 'chat') { e.x = Math.round(W * 0.4); e.y = H - 48 + e.i * 14; e.h = 9; }
      }
      for (const c of canvases) c.dirty = true;
    }

    function assign() {
      canvases[0].els = []; canvases[1].els = [];
      for (const e of els) (P.layout === 'split' && e.dyn ? canvases[1] : canvases[0]).els.push(e);
    }
    function markDirty(e) {
      (P.layout === 'split' && e.dyn ? canvases[1] : canvases[0]).dirty = true;
    }

    // 캔버스 다시 만들기: 소속 요소 전부의 정점을 다시 쓰고, 재질이 바뀌는 지점으로 배치 수를 셈
    function rebuild(c) {
      cur = c; c.n = 0;
      for (const e of c.els) {
        const q0 = c.n;
        GEN[e.type](e);
        e.q0 = q0; e.qn = c.n - q0;
        e.flash = 1;
        frameVerts += e.qn * 4; frameEls++;
      }
      let b = 0, last = -1;
      const seen = new Set();
      for (let q = 0; q < c.n; q++) {
        const m = c.vb[q * FLOATS + 4];
        if (m !== last) { last = m; seen.add(m); }
      }
      b = seen.size;                           // 겹치지 않는 같은 재질은 하나로 묶인다고 보고 재질 종류 수로 셈
      c.batches = c.n ? b : 0;
      c.dirty = false; c.flash = 1; frameCanv++;
    }

    let lastLayout = '';
    return {
      update(dt) {
        t += dt;
        if (ctx.width !== W || ctx.height !== H) layout();
        if (lastLayout !== P.layout) { lastLayout = P.layout; assign(); for (const c of canvases) c.dirty = true; }
        const byRole = (r) => els.find((e) => e.role === r);
        // 동적 값 갱신. 값이 실제로 바뀐 경우에만 더티 표시
        if (P.animHealth) {
          const e = byRole('hp');
          const nhp = U.clamp(0.55 + 0.35 * Math.sin(t * 1.3) + 0.08 * Math.sin(t * 4.1), 0.02, 1);
          if (Math.round((e.w - 2) * nhp) !== Math.round((e.w - 2) * hp) || Math.round(nhp * 1000) !== Math.round(hp * 1000)) { hp = nhp; markDirty(e); }
        }
        if (P.animTimer) {
          const nt = Math.max(0, 300 - t);
          if (Math.floor(nt * 10) !== Math.floor(timer * 10)) markDirty(byRole('timer'));
          timer = nt;
        }
        if (P.animMarker) {
          const m = byRole('minimap');
          const nx = m.x + m.w * (0.5 + 0.38 * Math.sin(t * 0.9)), ny = m.y + m.h * (0.5 + 0.38 * Math.sin(t * 1.37 + 1));
          if (Math.round(nx) !== Math.round(mx) || Math.round(ny) !== Math.round(my)) markDirty(byRole('marker'));
          mx = nx; my = ny;
        } else if (!mx) { const m = byRole('minimap'); mx = m.x + m.w / 2; my = m.y + m.h / 2; }

        frameVerts = 0; frameEls = 0; frameCanv = 0;
        const t0 = ctx.now();
        for (const c of canvases) if (c.dirty) rebuild(c);
        const ms = ctx.now() - t0;
        rebuildMs = rebuildMs * 0.9 + ms * 0.1;
        vertsPerSec = vertsPerSec * 0.95 + (dt > 0 ? frameVerts / dt : 0) * 0.05;
        for (const e of els) e.flash = Math.max(0, e.flash - dt * 4);
        for (const c of canvases) c.flash = Math.max(0, c.flash - dt * 4);
      },
      render() {
        const g = ctx.g;
        if (!canvases[0].n && !canvases[1].n) return;
        const col = ctx.side === 'a' ? C.a : C.b;
        // 캔버스 버퍼에서 그림 (정적 캔버스 먼저, 하위 캔버스가 위)
        for (const c of canvases) {
          const v = c.vb;
          for (let q = 0; q < c.n; q++) {
            const o = q * FLOATS;
            g.fillStyle = MAT[v[o + 4]];
            g.fillRect(v[o], v[o + 1], v[o + 10] - v[o], v[o + 11] - v[o + 1]);
          }
        }
        // 다시 만든 요소 표시
        if (P.flash) {
          g.fillStyle = col;
          for (const e of els) {
            if (e.flash <= 0) continue;
            g.globalAlpha = e.flash * 0.45;
            let x = e.x, y = e.y, w = e.w, h = e.h;
            if (e.type === 'marker') { x = mx - 6; y = my - 6; w = h = 12; }
            if (e.type === 'timer') w = 80;
            if (e.type === 'label') w = e.len * e.h * 0.65;
            if (e.type === 'gold') w = 70;
            if (e.type === 'health') w = e.w + 40;
            g.fillRect(x, y, w, h);
          }
          g.globalAlpha = 1;
        }
        // 캔버스 트리와 더티 표시
        const tx = 8, ty = H - 86;
        const line = (y, depth, c, name) => {
          D.circle(g, tx + 6 + depth * 14, y + 6, 4, c.flash > 0 ? col : '#444b58');
          D.text(g, name + GTL.L(`  정점 ${(c.n * 4).toLocaleString()}`, `  ${(c.n * 4).toLocaleString()} verts`), tx + 14 + depth * 14, y, { size: 11, color: C.text });
        };
        if (P.layout === 'single') line(ty, 0, canvases[0], GTL.L('캔버스', 'Canvas'));
        else {
          line(ty, 0, canvases[0], GTL.L('정적 캔버스', 'Static canvas'));
          line(ty + 16, 1, canvases[1], GTL.L('동적 하위 캔버스', 'Dynamic sub-canvas'));
        }

        const used = P.layout === 'split' ? canvases : [canvases[0]];
        ctx.stat(GTL.L('이번 프레임 다시 만든 정점', 'Vertices rebuilt this frame'), frameVerts.toLocaleString());
        ctx.stat(GTL.L('이번 프레임 다시 만든 요소', 'Elements rebuilt this frame'), frameEls);
        ctx.stat(GTL.L('초당 다시 만든 정점', 'Vertices rebuilt per second'), Math.round(vertsPerSec).toLocaleString());
        ctx.stat(GTL.L('재생성 시간', 'Rebuild time'), rebuildMs.toFixed(3) + ' ms');
        ctx.stat(GTL.L('배치 수', 'Batches'), used.reduce((s, c) => s + c.batches, 0));
      },
      onAction(key) {
        if (key === 'gold') { gold += 1 + ctx.rng.int(10, 990); markDirty(els.find((e) => e.role === 'gold')); }
      },
      onParam(key) { if (key === 'layout') { assign(); for (const c of canvases) c.dirty = true; } },
    };
  },
});
