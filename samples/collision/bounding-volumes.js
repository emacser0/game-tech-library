// 경계 볼륨 비교: 원 / AABB / OBB / 볼록 껍질: 빈 공간과 거짓 양성
GTL.register({
  id: 'bounding-volumes',
  title: '경계 볼륨: 원, AABB, OBB, 볼록 껍질',
  summary: '경계 볼륨이 실제 모양을 얼마나 꼭 맞게 감싸는지(빈 공간)에 따라 거짓 양성 수가 정해짐. 꼭 맞을수록 검사 비용은 커짐.',
  views: { a: '경계 원', b: 'OBB' },
  controls: '조작 없음. 도형이 떠다니며 회전.',
  info: `
    <p><b>경계 볼륨</b>(Bounding Volume)은 실제 모양을 감싸는 단순한 도형. 정밀한 충돌 검사는 비싸므로 경계 볼륨끼리 먼저 검사.</p>
    <ul>
      <li>경계 볼륨이 겹치지 않으면 확실히 충돌이 아님</li>
      <li>겹치면 실제 모양을 정밀 검사</li>
      <li>경계 볼륨은 겹치는데 실제 모양은 안 닿는 경우가 <b>거짓 양성</b>. 그만큼 정밀 검사가 낭비됨.</li>
    </ul>
    <p>종류별 특징:</p>
    <ul>
      <li><b>원/구</b>: 거리 제곱 비교 한 번으로 검사. 회전해도 바뀌지 않음. 길쭉한 모양에서는 빈 공간이 큼.</li>
      <li><b>AABB</b>(축 정렬 경계 상자): 검사가 가장 쌈. 회전할 때마다 다시 계산해야 함. 45° 회전한 막대에서는 크게 부풂.</li>
      <li><b>OBB</b>(방향 경계 상자): 모양과 함께 회전하므로 꼭 맞음. 검사는 SAT 4축(3D는 15축).</li>
      <li><b>볼록 껍질</b>: 오목한 부분을 빼면 가장 꼭 맞음. 검사 비용은 꼭짓점 수에 비례.</li>
    </ul>
    <p>회색 반투명 영역이 경계 볼륨, 밝은 도형이 실제 모양. 둘의 차이가 빈 공간. 실제 모양은 볼록 조각들의 합으로 만들어 정확히 판정.</p>`,
  diagram: (L) => {
    const stick = (cx) => `<rect x="-55" y="-9" width="110" height="18" transform="translate(${cx} 70) rotate(-45)" class="f-dim"/>`;
    return `<svg viewBox="0 0 540 162" xmlns="http://www.w3.org/2000/svg">
    ${stick(95)}<circle cx="95" cy="70" r="57" class="d-a"/>
    <circle cx="125" cy="98" r="6" class="f-a"/>
    <text x="104" y="118" text-anchor="middle" class="t-small t-a">${L('거짓 양성', 'false positive')}</text>
    ${stick(270)}<rect x="224.75" y="24.75" width="90.5" height="90.5" class="d-line" stroke-dasharray="5 3"/>
    ${stick(445)}<rect x="-58" y="-12" width="116" height="24" transform="translate(445 70) rotate(-45)" class="d-b"/>
    <text x="95" y="142" text-anchor="middle" class="t-a">${L('원: 빈 공간 큼', 'Circle: much empty space')}</text>
    <text x="270" y="142" text-anchor="middle">${L('AABB: 회전하면 부풂', 'AABB: grows when rotated')}</text>
    <text x="445" y="142" text-anchor="middle" class="t-b">${L('OBB: 꼭 맞음, 검사는 SAT', 'OBB: tight fit, SAT test')}</text>
    <text x="270" y="158" text-anchor="middle" class="t-small t-dim">${L('빈 공간이 클수록 거짓 양성이 늘어남. 꼭 맞을수록 검사 비용은 커짐', 'More empty space means more false positives. A tighter fit costs more to test')}</text>
  </svg>`;
  },
  look: [
    '기본 상태(막대 모양)에서 빨간 점선(거짓 양성)을 비교하면 A(원)는 많고 B(OBB)는 거의 없음',
    'B를 AABB로 바꾸면 막대가 45°일 때 상자가 크게 부풀었다 줄어듦. 회전에 따라 빈 공간 비율이 출렁임.',
    '모양을 "L자"로 바꾸면 OBB와 볼록 껍질도 오목한 안쪽에 빈 공간이 남음. 이럴 때는 여러 볼록 조각(compound)으로 나눔.',
    '경계 볼륨을 원에서 볼록 껍질 쪽으로 바꾸면 "BV 갱신+검사" 비용이 커짐. 빈 공간과 검사 비용의 맞교환(트레이드오프).',
  ],
  refs: [
    { type: 'book', title: 'Real-Time Collision Detection, Ch.4 Bounding Volumes (Christer Ericson)', year: 2005, note: 'AABB, 구, OBB, k-DOP 비교와 회전 시 갱신' },
    { type: 'paper', title: 'OBBTree: A Hierarchical Structure for Rapid Interference Detection (Gottschalk, Lin, Manocha)', year: 1996, note: 'SIGGRAPH 96. OBB 분리축 검사.' },
    { type: 'article', title: 'Solving Geometric Problems with the Rotating Calipers (Godfried Toussaint)', year: 1983, note: '볼록 다각형을 감싸는 최소 면적 사각형' },
  ],
  params: [
    { key: 'count', label: '도형 개수', type: 'int', min: 4, max: 40, default: 18, shared: true, reset: true, group: '장면' },
    { key: 'shape', label: '모양', type: 'select', options: [
      { value: 'stick', label: '막대 (길쭉함)' },
      { value: 'L', label: 'L자 (오목함)' },
      { value: 'blob', label: '볼록 다각형' },
      { value: 'mix', label: '섞음' },
    ], default: 'stick', shared: true, reset: true },
    { key: 'spin', label: '회전 속도', type: 'range', min: 0, max: 3, step: 0.05, default: 0.6, shared: true },
    { key: 'speed', label: '이동 속도', type: 'range', min: 0, max: 150, step: 1, default: 40, shared: true },
    { key: 'bv', label: '경계 볼륨', type: 'select', group: '경계 볼륨', options: [
      { value: 'circle', label: '경계 원' },
      { value: 'aabb', label: 'AABB' },
      { value: 'obb', label: 'OBB' },
      { value: 'hull', label: '볼록 껍질' },
    ], a: 'circle', b: 'obb' },
    { key: 'showBV', label: '경계 볼륨 표시', type: 'bool', default: true },
  ],
  en: {
    title: 'Bounding Volumes: Circle, AABB, OBB, Convex Hull',
    summary: 'How tightly a bounding volume wraps the real shape (its empty space) sets the number of false positives. A tighter fit costs more to test.',
    views: { a: 'Bounding circle', b: 'OBB' },
    controls: 'No input. Shapes drift and rotate.',
    info: `
    <p>A <b>bounding volume</b> is a simple shape that wraps the real shape. Exact collision tests are expensive, so you test bounding volumes first.</p>
    <ul>
      <li>If the bounding volumes do not overlap, there is surely no collision.</li>
      <li>If they overlap, test the real shapes in detail.</li>
      <li>When bounding volumes overlap but the real shapes do not touch, it is a <b>false positive</b>. That detailed test is wasted.</li>
    </ul>
    <p>Types:</p>
    <ul>
      <li><b>Circle/sphere</b>: one squared distance check. Rotation does not change it. Long shapes leave a lot of empty space.</li>
      <li><b>AABB</b> (axis-aligned bounding box): the cheapest test. You must recompute it on every rotation. It swells a lot around a stick rotated 45°.</li>
      <li><b>OBB</b> (oriented bounding box): rotates with the shape, so it fits tightly. The test uses SAT with 4 axes (15 axes in 3D).</li>
      <li><b>Convex hull</b>: the tightest fit except for concave parts. Test cost grows with the vertex count.</li>
    </ul>
    <p>The gray see-through area is the bounding volume. The bright shape is the real shape. The gap between them is empty space. Each real shape is a union of convex pieces, so the exact test is precise.</p>`,
    look: [
      'In the default state (sticks), compare the red dashed lines (false positives). A (circle) has many. B (OBB) has almost none.',
      'Switch B to AABB. When a stick is at 45°, its box swells and then shrinks. The share of empty space swings with rotation.',
      'Switch the shape to "L shape". OBB and convex hull also leave empty space inside the concave corner. In this case, split the shape into several convex pieces (compound).',
      'Move the bounding volume from circle toward convex hull. The "BV update+test" cost goes up. This is the tradeoff between empty space and test cost.',
    ],
    refs: [
      'Compares AABB, sphere, OBB, and k-DOP, and how to update them on rotation.',
      'SIGGRAPH 96. Separating axis test for OBBs.',
      'Minimum-area rectangle that encloses a convex polygon.',
    ],
    params: {
      count: { label: 'Shape count', group: 'Scene' },
      shape: { label: 'Shape', options: { stick: 'Stick (long)', L: 'L shape (concave)', blob: 'Convex polygon', mix: 'Mixed' } },
      spin: 'Rotation speed',
      speed: 'Move speed',
      bv: { label: 'Bounding volume', group: 'Bounding volume', options: { circle: 'Bounding circle', hull: 'Convex hull' } },
      showBV: 'Show bounding volume',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    let shapes = [];
    let st = { bvPairs: 0, real: 0, fp: 0, waste: 0, us: 0 };
    let pairLines = [];

    // ── 기하 헬퍼 ──
    const area = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p.x * q.y - q.x * p.y; } return Math.abs(a) / 2; };
    function hull(pts) {
      const p = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
      const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
      const lo = [], up = [];
      for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
      for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
      return lo.slice(0, -1).concat(up.slice(0, -1));
    }
    // 최소 면적 OBB: 껍질의 각 변 방향을 시도 (rotating calipers의 단순 버전)
    function minOBB(h) {
      let best = null;
      for (let i = 0; i < h.length; i++) {
        const a = h[i], b = h[(i + 1) % h.length];
        const ux = b.x - a.x, uy = b.y - a.y, l = Math.hypot(ux, uy) || 1;
        const u = { x: ux / l, y: uy / l }, v = { x: -u.y, y: u.x };
        let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
        for (const p of h) { const du = p.x * u.x + p.y * u.y, dv = p.x * v.x + p.y * v.y; u0 = Math.min(u0, du); u1 = Math.max(u1, du); v0 = Math.min(v0, dv); v1 = Math.max(v1, dv); }
        const ar = (u1 - u0) * (v1 - v0);
        if (!best || ar < best.ar) best = { ar, u, v, u0, u1, v0, v1 };
      }
      const { u, v, u0, u1, v0, v1 } = best;
      return [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([a, b]) => ({ x: u.x * a + v.x * b, y: u.y * a + v.y * b }));
    }
    const rectPts = (cx, cy, hw, hh) => [{ x: cx - hw, y: cy - hh }, { x: cx + hw, y: cy - hh }, { x: cx + hw, y: cy + hh }, { x: cx - hw, y: cy + hh }];
    // SAT: 볼록 다각형 두 개 겹침
    function satOverlap(A, B) {
      for (const poly of [A, B]) {
        for (let i = 0; i < poly.length; i++) {
          const p = poly[i], q = poly[(i + 1) % poly.length];
          const nx = -(q.y - p.y), ny = q.x - p.x;
          let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
          for (const v of A) { const d = v.x * nx + v.y * ny; if (d < a0) a0 = d; if (d > a1) a1 = d; }
          for (const v of B) { const d = v.x * nx + v.y * ny; if (d < b0) b0 = d; if (d > b1) b1 = d; }
          if (a1 < b0 || b1 < a0) return false;
        }
      }
      return true;
    }

    function makeShape(r, kind) {
      const s = r.range(14, 26);
      let parts;
      if (kind === 'stick') parts = [rectPts(0, 0, s * 2.2, s * 0.32)];
      else if (kind === 'L') parts = [rectPts(-s * 0.4, 0, s * 0.4, s * 1.4), rectPts(s * 0.8, s * 1.0, s * 0.8, s * 0.4)];
      else {
        const k = r.int(5, 8), pts = [];
        for (let i = 0; i < k; i++) { const a = (i / k) * U.TAU + r.range(-0.3, 0.3); pts.push({ x: Math.cos(a) * s * r.range(0.7, 1.6), y: Math.sin(a) * s * r.range(0.5, 1.0) }); }
        parts = [hull(pts)];
      }
      // 국소 좌표 원점 = 꼭짓점 평균
      const all = parts.flat();
      const cx = all.reduce((a, p) => a + p.x, 0) / all.length, cy = all.reduce((a, p) => a + p.y, 0) / all.length;
      parts = parts.map((pp) => pp.map((p) => ({ x: p.x - cx, y: p.y - cy })));
      const h = hull(parts.flat());
      const rad = Math.max(...h.map((p) => Math.hypot(p.x, p.y)));
      return { parts, hull: h, obb: minOBB(h), rad, shapeArea: parts.reduce((a, pp) => a + area(pp), 0) };
    }

    function init() {
      ctx.rng = U.rng(ctx.seed);
      const r = ctx.rng;
      shapes = [];
      for (let i = 0; i < P.count; i++) {
        const kind = P.shape === 'mix' ? r.pick(['stick', 'L', 'blob']) : P.shape;
        const sh = makeShape(r, kind);
        const a = r.range(0, U.TAU);
        Object.assign(sh, { x: r.range(40, ctx.width - 40), y: r.range(40, ctx.height - 40), vx: Math.cos(a), vy: Math.sin(a), ang: r.range(0, U.TAU), w: r.range(-1, 1) });
        shapes.push(sh);
      }
    }
    init();

    const xf = (s, pts) => { const c = Math.cos(s.ang), sn = Math.sin(s.ang); return pts.map((p) => ({ x: s.x + p.x * c - p.y * sn, y: s.y + p.x * sn + p.y * c })); };

    function computeBV(s) {
      const t = P.bv;
      if (t === 'circle') return { type: 'circle', x: s.x, y: s.y, r: s.rad, area: Math.PI * s.rad * s.rad };
      const h = xf(s, s.hull);
      if (t === 'aabb') {
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (const p of h) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
        return { type: 'aabb', x0, y0, x1, y1, area: (x1 - x0) * (y1 - y0) };
      }
      if (t === 'obb') { const pts = xf(s, s.obb); return { type: 'poly', pts, area: area(pts) }; }
      return { type: 'poly', pts: h, area: area(h) };
    }
    function bvOverlap(a, b) {
      if (a.type === 'circle') { const rr = a.r + b.r; return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < rr * rr; }
      if (a.type === 'aabb') return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
      return satOverlap(a.pts, b.pts);
    }

    return {
      update(dt) {
        const W = ctx.width, H = ctx.height;
        for (const s of shapes) {
          s.x += s.vx * P.speed * dt; s.y += s.vy * P.speed * dt; s.ang += s.w * P.spin * dt;
          if (s.x < 20) s.vx = Math.abs(s.vx); if (s.x > W - 20) s.vx = -Math.abs(s.vx);
          if (s.y < 20) s.vy = Math.abs(s.vy); if (s.y > H - 20) s.vy = -Math.abs(s.vy);
        }
        // BV 계산 + 쌍 검사 (비용 측정을 위해 10회 반복)
        const REP = 10;
        const t0 = ctx.now();
        let bvs, bvPairs = 0;
        for (let rep = 0; rep < REP; rep++) {
          bvs = shapes.map(computeBV);
          bvPairs = 0;
          for (let i = 0; i < bvs.length; i++) for (let j = i + 1; j < bvs.length; j++) if (bvOverlap(bvs[i], bvs[j])) bvPairs++;
        }
        const us = ((ctx.now() - t0) / REP) * 1000;
        // 정밀 판정 (모든 쌍) + 분류
        const world = shapes.map((s) => s.parts.map((pp) => xf(s, pp)));
        let real = 0, fp = 0, wasteSum = 0;
        pairLines = [];
        for (let i = 0; i < shapes.length; i++) {
          wasteSum += 1 - shapes[i].shapeArea / bvs[i].area;
          for (let j = i + 1; j < shapes.length; j++) {
            const bvHit = bvOverlap(bvs[i], bvs[j]);
            let exact = false;
            for (const pa of world[i]) { for (const pb of world[j]) if (satOverlap(pa, pb)) { exact = true; break; } if (exact) break; }
            if (exact) real++;
            if (bvHit && !exact) fp++;
            if (bvHit) pairLines.push({ i, j, exact });
          }
        }
        st = { bvPairs, real, fp, waste: Math.max(0, (wasteSum / shapes.length) * 100), us: st.us ? st.us * 0.9 + us * 0.1 : us };
        this._bvs = bvs; this._world = world;
      },
      render() {
        ctx.clearStats();
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        const bvs = this._bvs || shapes.map(computeBV);
        const world = this._world || shapes.map((s) => s.parts.map((pp) => xf(s, pp)));
        D.grid(g, W, H, 40);
        const hitSet = new Set();
        for (const l of pairLines) if (l.exact) { hitSet.add(l.i); hitSet.add(l.j); }
        if (P.showBV) {
          for (const b of bvs) {
            if (b.type === 'circle') D.circle(g, b.x, b.y, b.r, 'rgba(255,255,255,0.08)', col, 1);
            else if (b.type === 'aabb') D.rect(g, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 'rgba(255,255,255,0.08)', col, 1);
            else D.poly(g, b.pts, 'rgba(255,255,255,0.08)', col, 1);
          }
        }
        world.forEach((parts, i) => { for (const pp of parts) D.poly(g, pp, hitSet.has(i) ? C.good : 'rgba(216,221,230,0.85)'); });
        for (const l of pairLines) {
          const a = shapes[l.i], b = shapes[l.j];
          if (!l.exact) { g.setLineDash([5, 4]); D.line(g, a.x, a.y, b.x, b.y, C.bad, 2); g.setLineDash([]); }
          else D.line(g, a.x, a.y, b.x, b.y, C.good, 2);
        }
        D.text(g, GTL.L('실선: 실제 충돌   점선: 거짓 양성', 'Solid: real collision   Dashed: false positive'), 8, 8, { size: 11, color: C.dim });
        ctx.stat(GTL.L('BV 겹침 쌍', 'BV overlap pairs'), st.bvPairs);
        ctx.stat(GTL.L('실제 충돌 쌍', 'Real colliding pairs'), st.real);
        ctx.stat(GTL.L('거짓 양성', 'False positives'), st.fp);
        ctx.stat(GTL.L('평균 빈 공간', 'Average empty space'), st.waste.toFixed(1) + ' %');
        ctx.stat(GTL.L('BV 갱신+검사', 'BV update+test'), st.us.toFixed(1) + ' µs');
      },
    };
  },
});
