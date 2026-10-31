// 2D 뷰 컬링: 전부 그리기 vs 오브젝트별 AABB 검사 vs 공간 그리드 컬링
GTL.register({
  id: 'view-culling',
  title: '뷰(프러스텀) 컬링: 화면 밖은 그리지 않기',
  summary: '큰 월드의 오브젝트를 전부 그리면 화면 밖 오브젝트의 그리기 비용까지 냄. 카메라 사각형과 겹치는 것만 그리면 그리기 비용이 줄어듦. 공간 그리드로 후보를 줄이면 검사 비용도 화면 크기에 비례하게 됨.',
  views: { a: '전부 그리기', b: '그리드 컬링' },
  controls: 'WASD 또는 방향키: 카메라 이동 (입력이 없으면 자동 순회)',
  info: `
    <p><b>뷰 컬링</b>은 카메라 사각형(3D에서는 뷰 프러스텀)과 경계 상자가 겹치지 않는 오브젝트를 그리기 전에 버리는 기법.</p>
    <p>캔버스와 GPU도 화면 밖 도형을 결국 잘라냄(클리핑). 하지만 그 전에 이미 다음 비용을 냄.</p>
    <ul>
      <li>그리기 명령 생성</li>
      <li>상태 변경</li>
      <li>좌표 변환</li>
    </ul>
    <p>오브젝트마다 AABB 검사를 하면 그리기는 줄어듦. 하지만 <b>검사 수는 여전히 전체 개수만큼</b>(O(n)).</p>
    <p><b>공간 그리드 컬링</b>은 월드를 셀로 나누고 각 셀에 오브젝트를 미리 등록해 둠(정적 오브젝트). 카메라가 걸친 셀만 훑으므로 비용이 <b>화면에 보이는 양</b>에 비례함.
    3D 엔진은 같은 목적으로 BVH, 옥트리, 포털, 오클루전 컬링을 씀.</p>
    <p>"컬링 영역 축소"는 디버그 기능. 컬링 사각형을 화면보다 작게 만들어서 경계 밖 오브젝트가 사라지는 모습을 보여줌.</p>`,
  diagram: (L) => {
    const pts = Array.from({ length: 64 }, (_, i) => [4 + ((i * 53) % 97) / 97 * 232, 4 + ((i * 29) % 59) / 59 * 112]);
    const inCam = ([x, y]) => x >= 85 && x <= 165 && y >= 25 && y <= 75;
    const cells = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) cells.push([c, r]);
    const lit = (c, r) => c >= 2 && c <= 4 && r <= 1;
    return `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
    <text x="15" y="16" class="t-a">${L('A: 전부 그리기', 'A: draw all')}</text>
    <text x="285" y="16" class="t-b">${L('B: 그리드 컬링', 'B: grid culling')}</text>
    <rect x="15" y="24" width="240" height="120" class="f-dim"/>
    ${pts.map(([x, y]) => `<circle cx="${(15 + x).toFixed(1)}" cy="${(24 + y).toFixed(1)}" r="2.5" class="f-a"/>`).join('')}
    <rect x="100" y="49" width="80" height="50" class="d-accent"/>
    <rect x="285" y="24" width="240" height="120" class="f-dim"/>
    ${cells.map(([c, r]) => `<rect x="${285 + c * 40}" y="${24 + r * 40}" width="40" height="40" class="${lit(c, r) ? 'f-b' : 'd-dim'}"${lit(c, r) ? ' fill-opacity="0.18"' : ''}/>`).join('')}
    ${pts.map(([x, y]) => `<circle cx="${(285 + x).toFixed(1)}" cy="${(24 + y).toFixed(1)}" r="2.5" class="${inCam([x, y]) ? 'f-b' : 'f-dim'}"/>`).join('')}
    <rect x="370" y="49" width="80" height="50" class="d-accent"/>
    <text x="140" y="45" text-anchor="middle" class="t-small">${L('카메라', 'camera')}</text>
    <text x="410" y="45" text-anchor="middle" class="t-small">${L('카메라', 'camera')}</text>
    <text x="15" y="160" class="t-small t-dim">${L('화면 밖 오브젝트도 그리기 명령을 만듦', 'Offscreen objects still issue draw calls')}</text>
    <text x="285" y="160" class="t-small t-dim">${L('카메라가 걸친 셀(파랑)만 훑음', 'Scans only the cells under the camera (blue)')}</text>
    <text x="270" y="180" text-anchor="middle" class="t-small">${L('검사 비용이 월드 크기가 아니라 화면 크기에 비례함', 'Check cost scales with screen size, not world size')}</text>
  </svg>`;
  },
  look: [
    '기본 상태에서 오른쪽 위 렌더 ms를 비교하면 A는 매 프레임 전체(수만 개)를 그리고, B는 화면 안의 수백 개만 그림.',
    'B의 점선 사각형 밖을 보면 그리지 않은 영역이 보임(디버그 축소). 축소를 0으로 하면 컬링 영역이 화면과 같아짐.',
    'B를 "오브젝트별 AABB 검사"로 바꾸면 그린 오브젝트 수는 같지만 "컬링 검사 수"가 전체 개수만큼 늘어남.',
    '그리드 셀 크기를 바꾸면 미니맵의 노란 칸(실제로 훑은 셀)이 달라짐. "방문 셀"과 "컬링 검사 수"가 서로 반대로 움직임.',
  ],
  refs: [
    { type: 'book', title: 'Real-Time Rendering, 4th ed., Ch.19 Acceleration Algorithms (Akenine-Möller, Haines, Hoffman et al.)', year: 2018, note: '뷰 프러스텀 컬링, BVH, 포털, 오클루전 컬링.' },
    { type: 'engine', title: 'Unity, Occlusion culling / Frustum culling', url: 'https://docs.unity3d.com/Manual/OcclusionCulling.html' },
    { type: 'engine', title: 'Godot, VisibleOnScreenNotifier2D', url: 'https://docs.godotengine.org/en/stable/classes/class_visibleonscreennotifier2d.html', note: '화면 밖 2D 노드의 처리와 렌더를 멈춤.' },
  ],
  params: [
    { key: 'count', label: '오브젝트 수', type: 'int', min: 2000, max: 40000, default: 20000, shared: true, reset: true, group: '장면' },
    { key: 'world', label: '월드 크기 (px)', type: 'int', min: 2000, max: 12000, step: 500, default: 5000, shared: true, reset: true },
    { key: 'camSpeed', label: '카메라 속도', type: 'range', min: 0, max: 1500, step: 10, default: 400, shared: true },
    { key: 'mode', label: '컬링 방식', type: 'select', group: '컬링', options: [
      { value: 'none', label: '없음 (전부 그리기)' },
      { value: 'aabb', label: '오브젝트별 AABB 검사' },
      { value: 'grid', label: '공간 그리드 + AABB' },
    ], a: 'none', b: 'grid' },
    { key: 'cell', label: '그리드 셀 크기', type: 'int', min: 64, max: 1024, step: 32, default: 256, when: (p) => p.mode === 'grid' },
    { key: 'shrink', label: '컬링 영역 축소 (디버그)', type: 'range', min: 0, max: 0.4, step: 0.01, a: 0, b: 0.15, default: 0, when: (p) => p.mode !== 'none' },
    { key: 'minimap', label: '미니맵', type: 'bool', default: true },
  ],
  en: {
    title: 'View (Frustum) Culling: Skip What Is Off Screen',
    summary: 'If you draw every object in a large world, you pay to draw objects off screen too. Draw only what overlaps the camera rectangle, and drawing cost drops. Use a spatial grid to cut down candidates, and the test cost also scales with the screen size.',
    views: { a: 'Draw everything', b: 'Grid culling' },
    controls: 'WASD or arrow keys: move the camera (it tours on its own with no input)',
    info: `
    <p><b>View culling</b> drops objects before drawing when their bounding box does not overlap the camera rectangle (the view frustum in 3D).</p>
    <p>The canvas and the GPU do cut off shapes outside the screen in the end (clipping). But before that, you have already paid for:</p>
    <ul>
      <li>Building draw commands</li>
      <li>State changes</li>
      <li>Coordinate transforms</li>
    </ul>
    <p>An AABB test per object cuts down drawing. But <b>the test count still equals the total object count</b> (O(n)).</p>
    <p><b>Spatial grid culling</b> splits the world into cells and registers each object in a cell in advance (static objects). It scans only the cells the camera covers, so cost scales with <b>what is visible on screen</b>.
    3D engines use BVHs, octrees, portals, and occlusion culling for the same goal.</p>
    <p>"Shrink culling area" is a debug feature. It makes the culling rectangle smaller than the screen, so you can see objects vanish outside the boundary.</p>`,
    look: [
      'In the default state, compare render ms at the top right. A draws everything (tens of thousands) every frame. B draws only the few hundred on screen.',
      'Look outside B\'s dashed rectangle. You can see the area that was not drawn (debug shrink). Set shrink to 0 and the culling area matches the screen.',
      'Switch B to "Per-object AABB test". The drawn object count stays the same, but "Culling tests" rises to the total count.',
      'Change the grid cell size. The yellow squares on the minimap (cells actually scanned) change. "Visited cells" and "Culling tests" move in opposite directions.',
    ],
    refs: [
      'View frustum culling, BVH, portals, and occlusion culling.',
      null,
      'Stops processing and rendering 2D nodes that are off screen.',
    ],
    params: {
      count: { label: 'Object count', group: 'Scene' },
      world: 'World size (px)',
      camSpeed: 'Camera speed',
      mode: { label: 'Culling method', group: 'Culling', options: { none: 'None (draw everything)', aabb: 'Per-object AABB test', grid: 'Spatial grid + AABB' } },
      cell: 'Grid cell size',
      shrink: 'Shrink culling area (debug)',
      minimap: 'Minimap',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const palette = ['#4fc3f7', '#ff7a59', '#66d17a', '#ffcb6b', '#c792ea', '#f78c6c', '#89ddff', '#ff5370'];
    let n, ox, oy, os, oc, WS, camX, camY, t, mini, gridCell = 0, gStart, gItems, gW;
    let st = { drawn: 0, tests: 0, cells: 0, ms: 0 };
    let visitedCells = [];
    const hist = [];

    function init() {
      ctx.rng = U.rng(ctx.seed);
      const r = ctx.rng;
      n = P.count; WS = P.world;
      ox = new Float32Array(n); oy = new Float32Array(n); os = new Float32Array(n); oc = new Uint8Array(n);
      const nz = U.noise(ctx.seed);
      for (let i = 0; i < n; i++) {
        // 노이즈로 밀도에 변화를 줌
        let x, y, tries = 0;
        do { x = r.range(0, WS); y = r.range(0, WS); tries++; } while (tries < 6 && nz.fbm2(x / 1200, y / 1200, { octaves: 3 }) < r.range(-0.4, 0.3));
        ox[i] = x; oy[i] = y; os[i] = r.range(6, 22); oc[i] = r.int(0, palette.length - 1);
      }
      camX = WS / 2; camY = WS / 2; t = 0;
      // 미니맵: 한 번만 그려 둠
      const M = 140;
      mini = ctx.createCanvas(M, M);
      const mg = mini.getContext('2d');
      mg.fillStyle = 'rgba(0,0,0,0.6)'; mg.fillRect(0, 0, M, M);
      mg.fillStyle = 'rgba(216,221,230,0.35)';
      for (let i = 0; i < n; i++) mg.fillRect((ox[i] / WS) * M, (oy[i] / WS) * M, 1, 1);
      gridCell = 0;
    }
    init();

    function buildGrid() {
      gridCell = P.cell; gW = Math.ceil(WS / gridCell) + 1;
      const B = gW * gW, cnt = new Int32Array(B + 1), key = new Int32Array(n);
      for (let i = 0; i < n; i++) { const k = U.clamp(Math.floor(oy[i] / gridCell), 0, gW - 1) * gW + U.clamp(Math.floor(ox[i] / gridCell), 0, gW - 1); key[i] = k; cnt[k + 1]++; }
      for (let k = 0; k < B; k++) cnt[k + 1] += cnt[k];
      gStart = cnt; gItems = new Int32Array(n);
      const pos = cnt.slice(0, B);
      for (let i = 0; i < n; i++) gItems[pos[key[i]]++] = i;
    }

    return {
      update(dt) {
        t += dt;
        const k = ctx.input;
        let mx = (k.key('KeyD') || k.key('ArrowRight') ? 1 : 0) - (k.key('KeyA') || k.key('ArrowLeft') ? 1 : 0);
        let my = (k.key('KeyS') || k.key('ArrowDown') ? 1 : 0) - (k.key('KeyW') || k.key('ArrowUp') ? 1 : 0);
        if (mx || my) { camX += mx * P.camSpeed * dt; camY += my * P.camSpeed * dt; }
        else {
          // 자동 순회 (리사주 곡선)
          const R = WS * 0.38, w = (P.camSpeed / Math.max(1, R)) * 0.6;
          camX = U.damp(camX, WS / 2 + Math.sin(t * w) * R, 2, dt);
          camY = U.damp(camY, WS / 2 + Math.sin(t * w * 1.37 + 1) * R, 2, dt);
        }
        camX = U.clamp(camX, 0, WS); camY = U.clamp(camY, 0, WS);
      },
      render() {
        ctx.clearStats();
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        const vx0 = camX - W / 2, vy0 = camY - H / 2;
        const sh = P.mode === 'none' ? 0 : P.shrink;
        const cx0 = vx0 + W * sh, cy0 = vy0 + H * sh, cx1 = vx0 + W * (1 - sh), cy1 = vy0 + H * (1 - sh);
        D.grid(g, W, H, 100, 'rgba(255,255,255,0.04)', -vx0, -vy0);
        let drawn = 0, tests = 0, cells = 0;
        const t0 = ctx.now();
        let lastC = -1;
        const drawObj = (i) => {
          if (oc[i] !== lastC) { g.fillStyle = palette[oc[i]]; lastC = oc[i]; }
          const s = os[i];
          g.fillRect(ox[i] - vx0 - s / 2, oy[i] - vy0 - s / 2, s, s);
          drawn++;
        };
        visitedCells = [];
        if (P.mode === 'none') {
          for (let i = 0; i < n; i++) drawObj(i);
        } else if (P.mode === 'aabb') {
          for (let i = 0; i < n; i++) {
            const h = os[i] / 2; tests++;
            if (ox[i] + h < cx0 || ox[i] - h > cx1 || oy[i] + h < cy0 || oy[i] - h > cy1) continue;
            drawObj(i);
          }
        } else {
          if (gridCell !== P.cell || !gStart) buildGrid();
          const pad = 11; // 최대 반 크기 (셀 경계에 걸친 오브젝트용)
          const gx0 = Math.max(0, Math.floor((cx0 - pad) / gridCell)), gx1 = Math.min(gW - 1, Math.floor((cx1 + pad) / gridCell));
          const gy0 = Math.max(0, Math.floor((cy0 - pad) / gridCell)), gy1 = Math.min(gW - 1, Math.floor((cy1 + pad) / gridCell));
          for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
            const k = gy * gW + gx; cells++; visitedCells.push(gx, gy);
            for (let q = gStart[k], e = gStart[k + 1]; q < e; q++) {
              const i = gItems[q], h = os[i] / 2; tests++;
              if (ox[i] + h < cx0 || ox[i] - h > cx1 || oy[i] + h < cy0 || oy[i] - h > cy1) continue;
              drawObj(i);
            }
          }
        }
        const ms = ctx.now() - t0;
        st.ms = st.ms ? st.ms * 0.9 + ms * 0.1 : ms;
        hist.push(ms); if (hist.length > 120) hist.shift();
        if (sh > 0) { g.setLineDash([6, 5]); D.rect(g, W * sh, H * sh, W * (1 - 2 * sh), H * (1 - 2 * sh), null, col, 1.5); g.setLineDash([]); }

        if (P.minimap && mini) {
          const M = 140, mx = W - M - 8, my = H - M - 8, s = M / WS;
          g.drawImage(mini, mx, my);
          if (P.mode === 'grid') {
            g.fillStyle = 'rgba(255,203,107,0.35)';
            for (let k = 0; k < visitedCells.length; k += 2) g.fillRect(mx + visitedCells[k] * gridCell * s, my + visitedCells[k + 1] * gridCell * s, Math.max(1, gridCell * s), Math.max(1, gridCell * s));
          }
          D.rect(g, mx + vx0 * s, my + vy0 * s, W * s, H * s, null, col, 1.5);
          D.rect(g, mx, my, M, M, null, 'rgba(255,255,255,0.3)');
        }
        D.plot(g, hist, W - 170, 8, 160, 44, { min: 0, color: col, label: GTL.L(`렌더 ${st.ms.toFixed(2)} ms`, `Render ${st.ms.toFixed(2)} ms`) });
        ctx.stat(GTL.L('그린 오브젝트', 'Objects drawn'), `${drawn.toLocaleString()} / ${n.toLocaleString()}`);
        ctx.stat(GTL.L('컬링 검사 수', 'Culling tests'), tests.toLocaleString());
        if (P.mode === 'grid') ctx.stat(GTL.L('방문 셀', 'Visited cells'), cells);
        ctx.stat(GTL.L('오브젝트 그리기+컬링', 'Object draw+culling'), st.ms.toFixed(2) + ' ms');
      },
    };
  },
});
