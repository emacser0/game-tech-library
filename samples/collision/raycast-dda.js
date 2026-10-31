// 그리드 레이캐스트: Amanatides & Woo DDA vs 고정 간격 레이 마칭
GTL.register({
  id: 'raycast-dda',
  title: '그리드 레이캐스트: DDA vs 고정 간격 샘플링',
  summary: '광선을 일정 간격으로 샘플링하면 벽 모서리를 건너뛰어 관통함. DDA(Amanatides & Woo)는 광선이 지나는 셀을 빠짐없이 순서대로 방문함. 그래서 벽을 놓치지 않고, 샘플 수도 지나는 셀 수만큼임.',
  views: { a: '고정 간격 마칭', b: 'DDA (Amanatides & Woo)' },
  controls: '마우스: 광원 위치 (마우스가 밖에 있으면 자동 이동)',
  info: `
    <p>타일맵에서 시야, 총알, 빛을 계산하려면 광선이 처음 만나는 벽을 찾아야 함.</p>
    <p>가장 쉬운 방법은 <b>고정 간격 마칭</b>. 광선을 따라 <code>step</code>마다 점을 찍고, 그 점이 벽 타일 안인지 확인함.
    문제는 광선이 타일의 <b>모서리만 살짝 스칠 때</b>. 두 샘플 사이에 그 타일이 끼어서 광선이 <b>관통</b>함.
    간격을 줄이면 정확해지지만 샘플이 늘어남. 그래도 관통을 완전히 없앨 수는 없음.</p>
    <p><b>DDA</b>(Amanatides &amp; Woo, 1987)는 셀 경계를 기준으로 한 칸씩 이동함.</p>
    <ul>
      <li>다음 세로 경계까지의 거리 <code>tMaxX</code>와 다음 가로 경계까지의 거리 <code>tMaxY</code>를 유지함.</li>
      <li>더 가까운 쪽 경계를 넘어 다음 셀로 이동함.</li>
      <li>덧셈과 비교만으로 <b>지나는 모든 셀을 정확한 순서로</b> 방문함.</li>
    </ul>
    <p>울펜슈타인 3D식 레이캐스팅 엔진, 복셀 렌더러, 그리드 기반 가시성 검사의 기본 기법.</p>`,
  diagram: (L) => {
    const grid = (ox) => [0, 1, 2, 3, 4, 5, 6].map((c) => `<line x1="${ox + c * 36}" y1="10" x2="${ox + c * 36}" y2="154" class="d-dim"/>`).join('')
      + [0, 1, 2, 3, 4].map((r) => `<line x1="${ox}" y1="${10 + r * 36}" x2="${ox + 216}" y2="${10 + r * 36}" class="d-dim"/>`).join('');
    const walls = (ox) => [[2, 1], [5, 0], [4, 3]].map((w) => `<rect x="${ox + w[0] * 36}" y="${10 + w[1] * 36}" width="36" height="36" class="f-dim"/>`).join('');
    const S = [[30.8, 136], [52.6, 123.3], [74.4, 110.7], [96.1, 98], [117.9, 85.3], [139.7, 72.6], [161.5, 60], [183.3, 47.3], [205, 34.6]];
    return `<svg viewBox="0 0 540 192" xmlns="http://www.w3.org/2000/svg">
    ${walls(20)}${grid(20)}
    <line x1="30.8" y1="136" x2="205" y2="34.6" class="d-a" stroke-width="1.2"/>
    ${S.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" class="${i === S.length - 1 ? 'f-bad' : 'f-a'}"/>`).join('')}
    <circle cx="126" cy="81" r="8" class="d-accent"/>
    ${[[0, 3], [1, 3], [1, 2], [2, 2]].map((c) => `<rect x="${300 + c[0] * 36}" y="${10 + c[1] * 36}" width="36" height="36" class="f-b" opacity="0.25"/>`).join('')}
    ${walls(300)}${grid(300)}
    <rect x="372" y="46" width="36" height="36" class="d-b"/>
    <line x1="310.8" y1="136" x2="403.6" y2="82" class="d-b"/>
    ${[[336, 121.4], [341.7, 118], [372, 100.4], [403.6, 82]].map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" class="f-b"/>`).join('')}
    <text x="20" y="170" class="t-small t-a">${L('A: 고정 간격 샘플이 벽 모서리를 건너뜀', 'A: fixed-step samples skip the wall corner')}</text>
    <text x="300" y="170" class="t-small t-b">${L('B: 경계를 넘을 때마다 다음 칸 방문', 'B: visits the next cell at every border')}</text>
    <text x="20" y="186" class="t-small t-dim">${L('회색 칸은 벽. DDA는 tMaxX, tMaxY 중 가까운 경계를 넘음', 'Gray cells are walls. DDA crosses the closer border (tMaxX or tMaxY)')}</text>
  </svg>`;
  },
  look: [
    'A의 빨간 표시를 보면 고정 간격 샘플이 놓친 벽(관통)이 보임. 대각선으로 놓인 벽 모서리 근처에서 특히 많음.',
    'A의 샘플 간격을 0.1까지 줄이면 놓침은 줄지만 "광선당 평균 샘플"이 크게 늘어남. 그래도 0이 되지는 않음.',
    'B를 보면 방문한 셀(파란 칸)만 검사하고, 놓친 벽이 항상 0임.',
    '광선 수를 늘리면 두 방식의 "레이캐스트" 비용(ms) 차이가 커짐.',
  ],
  refs: [
    { type: 'paper', title: 'A Fast Voxel Traversal Algorithm for Ray Tracing (John Amanatides, Andrew Woo)', year: 1987, note: 'Eurographics 87. tMax/tDelta 기반 그리드 순회.' },
    { type: 'article', title: 'Raycasting, Lode\'s Computer Graphics Tutorial', url: 'https://lodev.org/cgtutor/raycasting.html', note: 'Wolfenstein 3D식 DDA 레이캐스터 해설.' },
    { type: 'game', title: 'Wolfenstein 3D (id Software)', year: 1992, note: '그리드 DDA 레이캐스팅으로 벽을 그린 대표 사례.' },
    { type: 'book', title: 'Real-Time Collision Detection, 7.4.2 Uniform Grid Traversal (Christer Ericson)', year: 2005 },
  ],
  params: [
    { key: 'cols', label: '맵 가로 칸 수', type: 'int', min: 12, max: 64, default: 32, shared: true, reset: true, group: '장면' },
    { key: 'density', label: '벽 밀도', type: 'range', min: 0.02, max: 0.35, step: 0.01, default: 0.14, shared: true, reset: true },
    { key: 'rays', label: '광선 수', type: 'int', min: 8, max: 1440, default: 240, shared: true },
    { key: 'range', label: '최대 거리 (칸)', type: 'range', min: 4, max: 64, step: 1, default: 40, shared: true },
    { key: 'method', label: '방식', type: 'select', group: '레이캐스트', options: [
      { value: 'march', label: '고정 간격 마칭' },
      { value: 'dda', label: 'DDA (Amanatides & Woo)' },
    ], a: 'march', b: 'dda' },
    { key: 'step', label: '샘플 간격 (칸)', type: 'range', min: 0.05, max: 1.5, step: 0.05, default: 0.7, when: (p) => p.method === 'march' },
    { key: 'showSamples', label: '샘플/방문 셀 표시', type: 'bool', default: true },
  ],
  en: {
    title: 'Grid Raycast: DDA vs Fixed-Step Sampling',
    summary: 'If you sample a ray at fixed steps, it can skip a wall corner and pass through. DDA (Amanatides & Woo) visits every cell the ray crosses, in order. So it never misses a wall, and it takes only as many samples as cells crossed.',
    views: { a: 'Fixed-step marching', b: 'DDA (Amanatides & Woo)' },
    controls: 'Mouse: light position (it moves on its own when the mouse is outside)',
    info: `
    <p>To compute line of sight, bullets, or light on a tilemap, you need the first wall a ray hits.</p>
    <p>The simplest way is <b>fixed-step marching</b>. Place a point every <code>step</code> along the ray and check if it is inside a wall tile.
    The problem is when the ray <b>just grazes a tile corner</b>. The tile falls between two samples, so the ray <b>passes through</b>.
    A smaller step is more accurate but needs more samples. Even then, you cannot fully remove pass-through.</p>
    <p><b>DDA</b> (Amanatides &amp; Woo, 1987) moves one cell at a time along cell boundaries.</p>
    <ul>
      <li>Keep <code>tMaxX</code>, the distance to the next vertical boundary, and <code>tMaxY</code>, the distance to the next horizontal boundary.</li>
      <li>Cross the nearer boundary and move into the next cell.</li>
      <li>Using only additions and comparisons, it visits <b>every crossed cell in the exact order</b>.</li>
    </ul>
    <p>This is the basic technique behind Wolfenstein 3D style raycasting engines, voxel renderers, and grid-based visibility checks.</p>`,
    look: [
      'Look at the red marks in A. They show walls the fixed-step samples missed (pass-through). There are many near diagonal wall corners.',
      'Lower A\'s sample step to 0.1. Misses drop, but "Average samples per ray" rises a lot. It still does not reach 0.',
      'Look at B. It tests only the visited cells (blue squares), and missed walls are always 0.',
      'Raise the ray count. The gap in "Raycast" cost (ms) between the two methods grows.',
    ],
    refs: [
      'Eurographics 87. Grid traversal based on tMax/tDelta.',
      'Explains a Wolfenstein 3D style DDA raycaster.',
      'A classic example of drawing walls with grid DDA raycasting.',
      null,
    ],
    params: {
      cols: { label: 'Map width (cells)', group: 'Scene' },
      density: 'Wall density',
      rays: 'Ray count',
      range: 'Max distance (cells)',
      method: { label: 'Method', group: 'Raycast', options: { march: 'Fixed-step marching' } },
      step: 'Sample step (cells)',
      showSamples: 'Show samples/visited cells',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    let gw, gh, map, t = 0, ox = ctx.width / 2, oy = ctx.height / 2;
    let res = null, msAvg = 0;

    function init() {
      ctx.rng = U.rng(ctx.seed);
      const r = ctx.rng;
      gw = P.cols; gh = Math.max(8, Math.round(gw * 0.62));
      map = new Uint8Array(gw * gh);
      for (let i = 0; i < map.length; i++) map[i] = r.chance(P.density) ? 1 : 0;
      // 모서리만 맞닿은 대각선 벽 (마칭이 놓치기 쉬운 배치)
      for (let k = 0; k < Math.max(2, Math.round(gw / 10)); k++) {
        let x = r.int(2, gw - 3), y = r.int(2, gh - 3);
        const dx = r.pick([-1, 1]), dy = r.pick([-1, 1]);
        for (let s = 0; s < 6; s++) { if (x >= 0 && y >= 0 && x < gw && y < gh) map[y * gw + x] = 1; x += dx; y += dy; }
      }
      for (let x = 0; x < gw; x++) { map[x] = 1; map[(gh - 1) * gw + x] = 1; }
      for (let y = 0; y < gh; y++) { map[y * gw] = 1; map[y * gw + gw - 1] = 1; }
      // 중앙 부근 비우기
      const cx = gw >> 1, cy = gh >> 1;
      for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) map[y * gw + x] = 0;
    }
    init();
    const solid = (x, y) => x < 0 || y < 0 || x >= gw || y >= gh || map[y * gw + x] === 1;

    // DDA: 반환 { t, cells[] }
    function dda(x0, y0, dx, dy, maxT, cells) {
      let cx = Math.floor(x0), cy = Math.floor(y0);
      const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1;
      const tdx = dx !== 0 ? Math.abs(1 / dx) : Infinity, tdy = dy !== 0 ? Math.abs(1 / dy) : Infinity;
      let tmx = dx > 0 ? (cx + 1 - x0) * tdx : (x0 - cx) * tdx;
      let tmy = dy > 0 ? (cy + 1 - y0) * tdy : (y0 - cy) * tdy;
      let tt = 0, n = 0;
      if (solid(cx, cy)) return { t: 0, n: 1, c: cy * gw + cx };
      while (tt <= maxT) {
        if (tmx < tmy) { tt = tmx; tmx += tdx; cx += sx; } else { tt = tmy; tmy += tdy; cy += sy; }
        n++;
        if (cells) cells.push(cx, cy);
        if (tt > maxT) break;
        if (solid(cx, cy)) return { t: tt, n, c: cy * gw + cx };
      }
      return { t: maxT, n, c: -1 };
    }
    function march(x0, y0, dx, dy, maxT, step, samples) {
      let n = 0;
      for (let tt = 0; tt <= maxT; tt += step) {
        const x = x0 + dx * tt, y = y0 + dy * tt;
        n++;
        if (samples) samples.push(x, y);
        const cx = Math.floor(x), cy = Math.floor(y);
        if (solid(cx, cy)) return { t: tt, n, c: cy * gw + cx };
      }
      return { t: maxT, n, c: -1 };
    }

    function castAll(tile) {
      const N = P.rays, maxT = P.range, x0 = ox / tile, y0 = oy / tile;
      const hits = new Float32Array(N), truth = new Float32Array(N), bad = new Uint8Array(N), cell = new Int32Array(N);
      const vis = P.showSamples && N <= 720 ? [] : null;
      let total = 0, missed = 0;
      const t0 = ctx.now();
      for (let i = 0; i < N; i++) {
        const a = (i / N) * U.TAU, dx = Math.cos(a), dy = Math.sin(a);
        const r = P.method === 'dda' ? dda(x0, y0, dx, dy, maxT, vis) : march(x0, y0, dx, dy, maxT, P.step, vis);
        hits[i] = r.t; cell[i] = r.c; total += r.n;
      }
      const ms = ctx.now() - t0;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * U.TAU;
        const tr = dda(x0, y0, Math.cos(a), Math.sin(a), maxT, null);
        truth[i] = tr.t;
        // 처음 만난 벽 셀이 다르면 = 진짜 첫 벽을 건너뜀
        if (P.method === 'march' && tr.c !== -1 && tr.c !== cell[i]) { bad[i] = 1; missed++; }
      }
      return { hits, truth, bad, vis, total, missed, ms };
    }

    return {
      update(dt) {
        t += dt;
        const m = ctx.input.mouse, W = ctx.width, H = ctx.height;
        if (m.inside) { ox = m.x; oy = m.y; }
        else { ox = W * (0.5 + 0.3 * Math.sin(t * 0.21)); oy = H * (0.5 + 0.28 * Math.sin(t * 0.33 + 0.7)); }
      },
      render() {
        ctx.clearStats();
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const tile = Math.min(W / gw, H / gh);
        const r = castAll(tile);
        msAvg = msAvg ? msAvg * 0.9 + r.ms * 0.1 : r.ms;
        const col = ctx.side === 'a' ? C.a : C.b;
        const x0 = ox, y0 = oy;
        // 빛 영역
        g.beginPath();
        for (let i = 0; i < P.rays; i++) {
          const a = (i / P.rays) * U.TAU, px = x0 + Math.cos(a) * r.hits[i] * tile, py = y0 + Math.sin(a) * r.hits[i] * tile;
          i ? g.lineTo(px, py) : g.moveTo(px, py);
        }
        g.closePath(); g.fillStyle = ctx.side === 'a' ? 'rgba(255,122,89,0.16)' : 'rgba(79,195,247,0.16)'; g.fill();
        // 방문 셀 / 샘플
        if (r.vis) {
          if (P.method === 'dda') {
            g.fillStyle = 'rgba(79,195,247,0.10)';
            for (let k = 0; k < r.vis.length; k += 2) g.fillRect(r.vis[k] * tile, r.vis[k + 1] * tile, tile, tile);
          } else {
            g.fillStyle = 'rgba(255,203,107,0.55)';
            for (let k = 0; k < r.vis.length; k += 2) g.fillRect(r.vis[k] * tile - 1, r.vis[k + 1] * tile - 1, 2, 2);
          }
        }
        // 맵
        g.beginPath();
        for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) if (map[y * gw + x]) g.rect(x * tile, y * tile, tile, tile);
        g.fillStyle = '#3a4150'; g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1; g.stroke();
        // 놓친 벽 표시
        if (P.method === 'march') {
          g.beginPath();
          for (let i = 0; i < P.rays; i++) {
            if (!r.bad[i]) continue;
            const a = (i / P.rays) * U.TAU, c = Math.cos(a), s = Math.sin(a);
            g.moveTo(x0 + c * r.truth[i] * tile, y0 + s * r.truth[i] * tile);
            g.lineTo(x0 + c * r.hits[i] * tile, y0 + s * r.hits[i] * tile);
          }
          g.strokeStyle = C.bad; g.lineWidth = 1.5; g.stroke();
          for (let i = 0; i < P.rays; i++) {
            if (!r.bad[i]) continue;
            const a = (i / P.rays) * U.TAU;
            D.circle(g, x0 + Math.cos(a) * r.truth[i] * tile, y0 + Math.sin(a) * r.truth[i] * tile, 3, null, C.bad, 1.5);
          }
        }
        D.circle(g, x0, y0, 5, col, '#fff', 1.5);
        ctx.stat(P.method === 'dda' ? GTL.L('광선당 평균 방문 셀', 'Average visited cells per ray') : GTL.L('광선당 평균 샘플', 'Average samples per ray'), (r.total / P.rays).toFixed(1));
        ctx.stat(P.method === 'dda' ? GTL.L('총 방문 셀', 'Total visited cells') : GTL.L('총 샘플', 'Total samples'), r.total.toLocaleString());
        ctx.stat(GTL.L('놓친 벽 (관통)', 'Missed walls (pass-through)'), r.missed);
        ctx.stat(GTL.L('레이캐스트', 'Raycast'), msAvg.toFixed(2) + ' ms');
      },
    };
  },
});
