// HZB 오클루전 컬링 (Unreal HZB occlusion): 2D 탑다운, 1D 깊이 버퍼와 max 밉 피라미드
GTL.register({
  id: 'hzb-occlusion',
  title: 'HZB 오클루전 컬링: 깊이 밉 피라미드 (Unreal HZB)',
  summary: '프러스텀 컬링만 쓰면 건물 뒤에 가려진 오브젝트도 그림. 깊이 버퍼의 max 밉 피라미드(HZB)로 텍셀 1~2개만 읽어 가려진 오브젝트를 보수적으로 걸러냄.',
  views: { a: '프러스텀 컬링만', b: '프러스텀 + HZB' },
  controls: '마우스를 오브젝트 근처에 올리면 그 오브젝트의 HZB 검사(읽은 텍셀, 가까운 깊이)를 아래 피라미드에 표시',
  info: `
    <p><b>오클루전 컬링</b>은 다른 물체에 가려 보이지 않는 오브젝트를 그리기 전에 빼는 기법. <b>HZB</b>(Hierarchical Z-Buffer)는 깊이 버퍼로 이를 빠르게 판정하는 방식.</p>
    <p>프러스텀 컬링은 화면 밖만 걸러냄. 도시처럼 건물이 많은 장면에서는 화면 안이어도 대부분 가려져 있음. 이 오브젝트를 그리면 GPU 비용만 듦.</p>
    <p>동작 원리:</p>
    <ul>
      <li>가리는 물체(오클루더)의 깊이 버퍼를 만듦. 이 샘플은 2D라서 카메라에서 나가는 열(각도)마다 깊이 하나를 둠.</li>
      <li>깊이 버퍼를 반씩 줄인 밉 피라미드를 만듦. 각 텍셀은 아래 두 텍셀 중 <b>먼 깊이(max)</b>를 가짐.</li>
      <li>오브젝트 범위가 텍셀 2개 안에 들어가는 레벨을 고름. 그 텍셀의 max 깊이보다 오브젝트의 가장 가까운 점이 멀면 확실히 가려짐.</li>
    </ul>
    <p>max를 쓰기 때문에 판정이 <b>보수적</b>임. 가려진 것을 그릴 수는 있어도, 보이는 것을 빼지는 않음.</p>
    <p>Unreal은 이전 프레임 깊이로 HZB를 만들어 검사. 그래서 카메라가 빠르게 돌면 한 프레임 늦게 나타나는 문제가 생길 수 있음. Unity의 기본 오클루전 컬링은 미리 구운(bake) 가시성 데이터를 씀.</p>`,
  // 도식: 깊이 버퍼 8열, max 피라미드, 오브젝트 하나의 보수적 검사
  diagram: (L) => {
    const d0 = [40, 44, 30, 34, 90, 95, 38, 36];
    const lv = [d0];
    while (lv[lv.length - 1].length > 1) { const p = lv[lv.length - 1], q = []; for (let i = 0; i < p.length; i += 2) q.push(Math.max(p[i], p[i + 1])); lv.push(q); }
    const bw = 240 / 8, base = 46;
    let s = '';
    lv.forEach((row, k) => {
      const w = 240 / row.length, y = base + k * 34;
      s += `<text x="8" y="${y + 4}" class="t-small t-dim">${L('레벨', 'level')} ${k}</text>`;
      row.forEach((d, i) => {
        const hi = k === 1 && i === 1;
        s += `<rect x="${60 + i * w + 1}" y="${y - 10}" width="${w - 2}" height="18" class="${hi ? 'f-b' : 'f-dim'}"/>`;
        s += `<text x="${60 + i * w + w / 2}" y="${y + 3}" text-anchor="middle" class="t-mono t-small">${d}</text>`;
      });
    });
    return `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
    <text x="8" y="16">${L('깊이 버퍼 (열마다 가장 가까운 오클루더 거리)', 'Depth buffer (nearest occluder distance per column)')}</text>
    <text x="60" y="194" class="t-small t-dim">${L('위 레벨 = 아래 두 칸의 max (먼 쪽)', 'Upper level = max of the two below (the far one)')}</text>
    ${s}
    <rect x="${60 + 2 * bw + 1}" y="26" width="${2 * bw - 2}" height="5" class="f-accent"/>
    <text x="${60 + 4 * bw + 6}" y="32" class="t-small">${L('오브젝트가 덮는 열 2, 3', 'Object covers columns 2, 3')}</text>
    <text x="310" y="60">${L('오브젝트 가장 가까운 깊이 = 60', 'Object nearest depth = 60')}</text>
    <text x="310" y="80" class="t-small">${L('레벨 1의 텍셀 1개만 읽음: max = 34', 'Read 1 texel of level 1: max = 34')}</text>
    <text x="310" y="100" class="t-b">${L('60 > 34 이면 확실히 가려짐', '60 > 34, so surely hidden')}</text>
    <text x="310" y="128" class="t-small t-dim">${L('max = 그 열들 중 가장 먼 오클루더', 'max = the farthest occluder there')}</text>
    <text x="310" y="141" class="t-small t-dim">${L('그보다 멀면 모든 열에서 가려짐', 'Farther than it: hidden in all columns')}</text>
    <text x="310" y="166" class="t-small t-dim">${L('큰 오브젝트는 더 위 레벨을 읽음', 'Larger objects read a higher level')}</text>
  </svg>`;
  },
  look: [
    '기본 상태에서 "그린 오브젝트" 수 비교. B가 A보다 훨씬 적음. 건물 뒤의 빨간 테두리 오브젝트가 HZB로 빠진 것.',
    '아래 피라미드를 봄. 위 레벨로 갈수록 텍셀 수가 반씩 줄고 값은 먼 쪽(max)을 따름. 건물 사이 틈이 있으면 그 칸은 멀게 나옴.',
    'B에서 "밉 바이어스"를 올리면 더 거친 레벨을 읽음. 텍셀은 덜 읽지만 틈의 먼 깊이가 섞여 빠지는 오브젝트가 줄어듦.',
    '"깊이 버퍼 해상도"를 낮추면 열이 넓어져 판정이 더 보수적이 됨',
  ],
  refs: [
    { type: 'paper', title: 'Hierarchical Z-Buffer Visibility', year: 1993, note: 'Greene, Kass, Miller. SIGGRAPH 1993. Z 피라미드로 가시성을 판정하는 원조 논문.' },
    { type: 'engine', title: 'Unreal Engine - Visibility and Occlusion Culling', note: 'Hardware Occlusion Queries와 HZB Occlusion 설정, r.HZBOcclusion' },
    { type: 'engine', title: 'Unity Manual - Occlusion culling', url: 'https://docs.unity3d.com/Manual/OcclusionCulling.html', note: '미리 구운 가시성 데이터를 쓰는 방식. HZB와 목적은 같고 방법이 다름.' },
    { type: 'article', title: 'Hierarchical-Z map based occlusion culling', year: 2010, note: 'Daniel Rakos (RasterGrid 블로그). GPU에서 HZB 컬링을 구현하는 과정.' },
  ],
  params: [
    { key: 'count', label: '오브젝트 수', type: 'int', min: 50, max: 2000, default: 500, shared: true, reset: true, group: '장면' },
    { key: 'buildings', label: '건물 수', type: 'int', min: 0, max: 40, default: 12, shared: true, reset: true },
    { key: 'fov', label: '시야각 (도)', type: 'range', min: 30, max: 120, step: 1, default: 75, shared: true },
    { key: 'camMove', label: '카메라 움직임', type: 'bool', default: true, shared: true },
    { key: 'mode', label: '컬링 방식', type: 'select', group: '컬링', options: [
      { value: 'frustum', label: '프러스텀만' },
      { value: 'hzb', label: '프러스텀 + HZB' },
    ], a: 'frustum', b: 'hzb' },
    { key: 'cols', label: '깊이 버퍼 해상도 (열)', type: 'select', options: [
      { value: 64, label: '64' }, { value: 128, label: '128' }, { value: 256, label: '256' },
    ], default: 128, shared: true },
    { key: 'bias', label: '밉 바이어스', type: 'int', min: 0, max: 4, default: 0, when: (p) => p.mode === 'hzb', help: '0이면 오브젝트 범위가 텍셀 2개에 들어가는 레벨. 올리면 더 거친 레벨' },
  ],
  en: {
    title: 'HZB Occlusion Culling: Depth Mip Pyramid (Unreal HZB)',
    summary: 'Frustum culling alone still draws objects hidden behind buildings. A max mip pyramid of the depth buffer (HZB) reads only 1 or 2 texels and conservatively removes hidden objects.',
    views: { a: 'Frustum culling only', b: 'Frustum + HZB' },
    controls: 'Hover the mouse near an object. Its HZB test (texels read, nearest depth) shows on the pyramid below.',
    info: `
    <p><b>Occlusion culling</b> removes objects hidden behind other objects before drawing them. <b>HZB</b> (Hierarchical Z-Buffer) decides this quickly with the depth buffer.</p>
    <p>Frustum culling only removes what is off screen. In a scene with many buildings, like a city, most on-screen objects are still hidden. Drawing them only costs GPU time.</p>
    <p>How it works:</p>
    <ul>
      <li>Build a depth buffer of the objects that hide others (occluders). This sample is 2D, so there is one depth per column (angle) from the camera.</li>
      <li>Build a mip pyramid by halving the depth buffer again and again. Each texel keeps the <b>farther depth (max)</b> of the two below it.</li>
      <li>Pick the level where the object range fits in 2 texels. If the nearest point of the object is farther than the max depth of those texels, it is surely hidden.</li>
    </ul>
    <p>Because it uses max, the test is <b>conservative</b>. It may draw a hidden object, but it never removes a visible one.</p>
    <p>Unreal builds the HZB from the previous frame depth. So when the camera turns fast, an object can appear one frame late. Unity's built-in occlusion culling uses baked visibility data instead.</p>`,
    look: [
      'Compare "Objects drawn" in the default state. B draws far fewer than A. The red outlined objects behind buildings are the ones HZB removed.',
      'Look at the pyramid below. Each level up has half the texels, and values follow the far side (max). Where there is a gap between buildings, that texel is far.',
      'Raise "Mip bias" in B. It reads a coarser level. It reads fewer texels, but the far depth of gaps mixes in and fewer objects get removed.',
      'Lower "Depth buffer resolution". Columns get wider and the test gets more conservative.',
    ],
    refs: ['Greene, Kass, Miller. SIGGRAPH 1993. The original paper on visibility with a Z pyramid.', 'Hardware occlusion queries, HZB occlusion settings, r.HZBOcclusion.', 'Uses baked visibility data. Same goal as HZB, different method.', 'Daniel Rakos (RasterGrid blog). How to build HZB culling on the GPU.'],
    params: {
      count: { label: 'Object count', group: 'Scene' },
      buildings: 'Building count',
      fov: 'Field of view (deg)',
      camMove: 'Camera motion',
      mode: { label: 'Culling mode', group: 'Culling', options: { frustum: 'Frustum only', hzb: 'Frustum + HZB' } },
      cols: 'Depth buffer resolution (columns)',
      bias: { label: 'Mip bias', help: 'At 0, the level where the object range fits in 2 texels. Higher means a coarser level' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 800, WH = 600, FAR = 760;
    let blds, objs, camX, camY, camA, t = 0;
    let fN = 0, fFov = 1, levels = [], res = [], stats = { pass: 0, tests: 0, reads: 0, occ: 0 };
    function init() {
      ctx.rng = U.rng(ctx.seed);
      const r = ctx.rng;
      blds = [];
      for (let i = 0; i < P.buildings; i++) {
        const w = r.range(40, 110), h = r.range(30, 90);
        const x = r.range(40, WW - 40 - w), y = r.range(40, WH - 280 - h);
        blds.push({ x0: x, y0: y, x1: x + w, y1: y + h });
      }
      const inside = (x, y, rr) => blds.some((b) => x > b.x0 - rr && x < b.x1 + rr && y > b.y0 - rr && y < b.y1 + rr);
      objs = [];
      let guard = 0;
      while (objs.length < P.count && guard++ < P.count * 30) {
        const x = r.range(10, WW - 10), y = r.range(10, WH - 140), rr = r.range(3, 8);
        if (!inside(x, y, rr)) objs.push({ x, y, r: rr });
      }
      res = new Uint8Array(objs.length);
    }
    init();

    // 광선과 AABB의 교차 거리 (slab)
    function rayBox(ox, oy, dx, dy, b) {
      let t0 = 0, t1 = FAR;
      if (Math.abs(dx) < 1e-9) { if (ox < b.x0 || ox > b.x1) return FAR; }
      else { let a = (b.x0 - ox) / dx, c = (b.x1 - ox) / dx; if (a > c) { const s = a; a = c; c = s; } t0 = Math.max(t0, a); t1 = Math.min(t1, c); }
      if (Math.abs(dy) < 1e-9) { if (oy < b.y0 || oy > b.y1) return FAR; }
      else { let a = (b.y0 - oy) / dy, c = (b.y1 - oy) / dy; if (a > c) { const s = a; a = c; c = s; } t0 = Math.max(t0, a); t1 = Math.min(t1, c); }
      return t0 <= t1 ? t0 : FAR;
    }
    const castAt = (ang) => {
      const dx = Math.cos(ang), dy = Math.sin(ang);
      let best = FAR;
      for (const b of blds) { const h = rayBox(camX, camY, dx, dy, b); if (h < best) best = h; }
      return best;
    };

    function frame() {
      const N = +P.cols, fov = U.rad(P.fov);
      fN = N; fFov = fov;
      // 1) 깊이 버퍼: 열의 양 끝과 가운데 광선 중 가장 먼 깊이 (열 전체를 덮을 때만 가깝게 나옴)
      const d0 = new Float32Array(N);
      const a0 = camA - fov / 2, da = fov / N;
      for (let i = 0; i < N; i++) d0[i] = Math.max(castAt(a0 + i * da), castAt(a0 + (i + 0.5) * da), castAt(a0 + (i + 1) * da));
      // 2) max 밉 피라미드
      levels = [d0];
      while (levels[levels.length - 1].length > 1) {
        const p = levels[levels.length - 1], q = new Float32Array(p.length >> 1);
        for (let i = 0; i < q.length; i++) q[i] = Math.max(p[2 * i], p[2 * i + 1]);
        levels.push(q);
      }
      // 3) 오브젝트 검사
      stats = { pass: 0, tests: 0, reads: 0, occ: 0 };
      const hzb = P.mode === 'hzb', top = levels.length - 1;
      for (let k = 0; k < objs.length; k++) {
        const o = objs[k];
        const dx = o.x - camX, dy = o.y - camY, d = Math.hypot(dx, dy);
        const rel = U.angleDiff(camA, Math.atan2(dy, dx));
        const half = d > o.r ? Math.asin(o.r / d) : Math.PI;
        if (Math.abs(rel) - half > fov / 2 || d - o.r > FAR) { res[k] = 0; continue; } // 프러스텀 밖
        stats.pass++;
        res[k] = 1;
        if (!hzb || d <= o.r) continue;
        stats.tests++;
        const c0 = U.clamp(Math.floor((rel - half + fov / 2) / da), 0, N - 1);
        const c1 = U.clamp(Math.floor((rel + half + fov / 2) / da), 0, N - 1);
        const lvl = Math.min(top, Math.ceil(Math.log2(c1 - c0 + 1)) + P.bias);
        const row = levels[lvl];
        let mx = 0;
        for (let i = c0 >> lvl; i <= c1 >> lvl; i++) { mx = Math.max(mx, row[i]); stats.reads++; }
        if (d - o.r > mx) { res[k] = 2; stats.occ++; }
      }
    }

    function probeInfo(k) {
      const o = objs[k], N = fN, fov = fFov, da = fov / N;
      const dx = o.x - camX, dy = o.y - camY, d = Math.hypot(dx, dy);
      const rel = U.angleDiff(camA, Math.atan2(dy, dx)), half = Math.asin(Math.min(1, o.r / d));
      const c0 = U.clamp(Math.floor((rel - half + fov / 2) / da), 0, N - 1), c1 = U.clamp(Math.floor((rel + half + fov / 2) / da), 0, N - 1);
      const lvl = Math.min(levels.length - 1, Math.ceil(Math.log2(c1 - c0 + 1)) + P.bias);
      return { c0, c1, lvl, near: d - o.r };
    }

    let probe = -1, probeT = 0, layout = null;
    return {
      update(dt) {
        if (P.camMove) t += dt;
        camX = WW / 2 + Math.sin(t * 0.25) * 220;
        camY = WH - 120;
        camA = -Math.PI / 2 + Math.sin(t * 0.4) * 0.35;
        frame();
        // 관찰용 오브젝트: 마우스 근처, 없으면 가려진 오브젝트를 돌아가며 선택
        const m = ctx.input.mouse;
        probe = -1;
        if (m.inside && layout) {
          const wx = (m.x - layout.ox) / layout.s, wy = (m.y - layout.oy) / layout.s;
          let bd = 30 * 30;
          for (let k = 0; k < objs.length; k++) { if (!res[k]) continue; const e = (objs[k].x - wx) ** 2 + (objs[k].y - wy) ** 2; if (e < bd) { bd = e; probe = k; } }
        }
        if (probe < 0) {
          probeT += dt;
          const cand = [];
          for (let k = 0; k < objs.length; k++) if (res[k] === (P.mode === 'hzb' ? 2 : 1)) cand.push(k);
          if (cand.length) probe = cand[Math.floor(probeT / 1.5) % cand.length];
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        if (camX === undefined) return;
        const col = ctx.side === 'a' ? C.a : C.b;
        const pyrH = Math.min(150, H * 0.34);
        const areaH = H - pyrH - 8;
        const s = Math.min(W / WW, areaH / WH), ox = (W - WW * s) / 2, oy = 0;
        layout = { s, ox, oy };
        const X = (x) => ox + x * s, Y = (y) => oy + y * s;
        const N = fN, fov = fFov, da = fov / N, a0 = camA - fov / 2;
        // 프러스텀 영역과 깊이 경계선
        const d0 = levels[0];
        const pts = [{ x: X(camX), y: Y(camY) }];
        for (let i = 0; i < N; i++) {
          const a = a0 + (i + 0.5) * da, d = Math.min(d0[i], FAR);
          pts.push({ x: X(camX + Math.cos(a) * d), y: Y(camY + Math.sin(a) * d) });
        }
        D.poly(g, pts, 'rgba(255,255,255,0.05)', null);
        D.poly(g, pts.slice(1), null, col, 1.2, false);
        for (const b of blds) D.rect(g, X(b.x0), Y(b.y0), (b.x1 - b.x0) * s, (b.y1 - b.y0) * s, '#3a4050', '#555c6c');
        for (let k = 0; k < objs.length; k++) {
          const o = objs[k], x = X(o.x), y = Y(o.y), r = Math.max(1.5, o.r * s);
          if (res[k] === 0) D.circle(g, x, y, r * 0.6, 'rgba(255,255,255,0.12)');
          else if (res[k] === 1) D.circle(g, x, y, r, col);
          else D.circle(g, x, y, r, null, C.bad, 1.2);
        }
        D.circle(g, X(camX), Y(camY), 6, '#fff');
        let pi = null;
        if (probe >= 0 && probe < objs.length && res[probe]) {
          const o = objs[probe];
          D.circle(g, X(o.x), Y(o.y), o.r * s + 6, null, C.accent, 2);
          if (P.mode === 'hzb') pi = probeInfo(probe);
        }

        // 피라미드: 레벨마다 막대 (높이 = 깊이 / FAR)
        const py0 = H - pyrH, nL = levels.length, rowH = pyrH / nL;
        const px0 = 64, pw = W - px0 - 8;
        D.rect(g, 0, py0 - 4, W, pyrH + 4, 'rgba(0,0,0,0.35)');
        for (let l = 0; l < nL; l++) {
          const row = levels[l], bw = pw / row.length, y = py0 + l * rowH;
          D.text(g, GTL.L('레벨 ', 'level ') + l, 6, y + 1, { size: 9, color: C.dim });
          for (let i = 0; i < row.length; i++) {
            const h = (Math.min(row[i], FAR) / FAR) * (rowH - 2);
            const read = pi && l === pi.lvl && i >= pi.c0 >> l && i <= pi.c1 >> l;
            D.rect(g, px0 + i * bw, y + rowH - 1 - h, Math.max(1, bw - (bw > 3 ? 1 : 0)), h, read ? C.accent : 'rgba(255,255,255,0.25)');
          }
          if (pi && l === pi.lvl) {
            const hy = y + rowH - 1 - (Math.min(pi.near, FAR) / FAR) * (rowH - 2);
            D.line(g, px0, hy, px0 + pw, hy, C.bad, 1);
          }
        }
        if (pi) {
          const bw0 = pw / N;
          D.rect(g, px0 + pi.c0 * bw0, py0 - 4, (pi.c1 - pi.c0 + 1) * bw0, 3, C.accent);
        }
        D.text(g, P.mode === 'hzb' ? GTL.L('보라: 읽은 텍셀, 빨간 선: 오브젝트의 가장 가까운 깊이', 'Purple: texels read, red line: nearest depth of the object') : GTL.L('A는 피라미드를 읽지 않음', 'A does not read the pyramid'), W - 8, py0 - 18, { size: 10, color: C.dim, align: 'right' });

        const drawn = stats.pass - stats.occ + blds.length;
        ctx.stat(GTL.L('전체 오브젝트', 'Total objects'), objs.length);
        ctx.stat(GTL.L('프러스텀 통과', 'Passed frustum'), stats.pass);
        if (P.mode === 'hzb') {
          ctx.stat(GTL.L('HZB 검사 수', 'HZB tests'), stats.tests);
          ctx.stat(GTL.L('읽은 텍셀 수', 'Texels read'), stats.reads);
          ctx.stat(GTL.L('가려져 빠짐', 'Occluded'), stats.occ);
        }
        ctx.stat(GTL.L('그린 오브젝트 (건물 포함)', 'Objects drawn (incl. buildings)'), drawn);
      },
    };
  },
});
