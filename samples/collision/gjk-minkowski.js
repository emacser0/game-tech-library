// 민코프스키 차와 GJK (+ EPA)
GTL.register({
  id: 'gjk-minkowski',
  title: '민코프스키 차 & GJK / EPA',
  summary: '두 볼록 도형이 겹치면 민코프스키 차 A−B가 원점을 포함함(역도 성립). A−B 전체를 만들면 n×m 연산이 듦. GJK는 support 함수 몇 번으로 원점을 감싸는 단체(simplex)를 찾음.',
  views: { a: '민코프스키 차 전부 계산', b: 'GJK + EPA' },
  controls: '마우스: 도형 A 이동 (마우스가 밖에 있으면 자동 이동)',
  info: `
    <p><b>민코프스키 차</b> A−B는 A의 점에서 B의 점을 뺀 모든 점의 집합. 식으로는 { a − b | a∈A, b∈B }.
    A와 B에 공통 점이 있으면 a − b = 0. 즉 <b>원점이 A−B 안에 있음</b>.</p>
    <p>오른쪽 아래 패널이 A−B 공간이고, 십자가 원점. 도형을 움직이면 원점이 들어가고 나가는 순간이 보임.</p>
    <p>A 뷰는 모든 꼭짓점 쌍의 차(n×m개 점)를 구함. 그 볼록 껍질을 만들어 원점 포함 여부를 검사함. 정확하지만 비쌈.</p>
    <p><b>GJK</b>(Gilbert-Johnson-Keerthi)는 A−B를 만들지 않음. 쓰는 것은 support 함수 하나:
    <code>support(d) = (A에서 d 방향으로 가장 먼 점) − (B에서 −d 방향으로 가장 먼 점)</code>.</p>
    <ul>
      <li>원점 쪽으로 단체를 키움 (점, 선분, 삼각형 순).</li>
      <li>단체가 원점을 감싸면 충돌로 끝냄.</li>
      <li>원점을 넘어가지 못하면 분리로 끝냄.</li>
      <li>보통 3~6회 반복이면 충분함.</li>
    </ul>
    <p>겹쳤을 때는 <b>EPA</b>(Expanding Polytope Algorithm)를 씀. EPA는 GJK의 마지막 삼각형을 A−B 경계까지 넓혀서 원점에서 가장 가까운 변을 찾음.
    그 거리와 법선이 침투 깊이와 방향(MTV).</p>`,
  diagram: (L) => {
    const pts = [[380, 45], [420, 45], [380, 85], [420, 85], [415, 100], [455, 100], [415, 140], [455, 140], [345, 100], [385, 100], [345, 140], [385, 140]];
    return `<svg viewBox="0 0 540 194" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <rect x="70" y="80" width="40" height="40" class="d-line"/>
    <polygon points="100,65 135,120 65,120" class="d-a"/>
    <text x="104" y="60" class="t-a">A</text><text x="58" y="134" class="t-small">B</text>
    <text x="10" y="160">${L('월드 공간', 'World space')}</text>
    <text x="10" y="174" class="t-small t-dim">${L('A와 B가 겹침', 'A and B overlap')}</text>
    <path d="M190,95 L318,95" class="d-line" marker-end="url(#arr)"/>
    <text x="254" y="88" text-anchor="middle" class="t-small t-mono">a - b</text>
    <polygon points="380,45 420,45 455,100 455,140 345,140 345,100" class="d-a" stroke-width="1.4"/>
    ${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="2.5" class="f-a"/>`).join('')}
    <polygon points="420,45 455,140 345,140" class="d-b"/>
    <text x="426" y="42" class="t-small t-b">1</text><text x="460" y="150" class="t-small t-b">2</text><text x="334" y="150" class="t-small t-b">3</text>
    <line x1="383" y1="100" x2="397" y2="100" class="d-accent"/><line x1="390" y1="93" x2="390" y2="107" class="d-accent"/>
    <text x="396" y="96" class="t-small">${L('원점', 'origin')}</text>
    <text x="300" y="164" class="t-small t-a">${L('A: 점 n×m개의 볼록 껍질', 'A: hull of all n×m points')}</text>
    <text x="300" y="177" class="t-small t-b">${L('B: GJK 단체(1, 2, 3)가 원점을 감쌈', 'B: GJK simplex (1, 2, 3) encloses the origin')}</text>
    <text x="10" y="190" class="t-small t-dim">${L('원점이 A - B 안에 있으면 충돌. GJK는 support 점 몇 개로 이를 확인', 'Origin inside A - B means a hit. GJK checks this with a few support points')}</text>
  </svg>`;
  },
  look: [
    '오른쪽 아래 패널을 비교하면 A는 n×m개의 점 구름과 그 껍질을 그림. B는 GJK가 실제로 계산한 support 점(번호)과 최종 단체만 그림.',
    '꼭짓점 48개 상태에서 "정점 연산"을 보면 A는 차를 2304개 만듦. B는 반복 수 × (n+m) 수준.',
    'B에서 도형을 겹치면 EPA 다각형(노랑)이 펼쳐지고, 원래 공간에 침투 벡터 화살표가 나타남.',
    '꼭짓점 수를 바꿔도 GJK 반복 수는 거의 그대로임. 원(꼭짓점 많음)이나 캡슐도 support 함수만 있으면 됨.',
  ],
  refs: [
    { type: 'paper', title: 'A Fast Procedure for Computing the Distance Between Complex Objects in Three-Dimensional Space (Gilbert, Johnson, Keerthi)', year: 1988, note: 'IEEE Journal on Robotics and Automation. GJK 원 논문.' },
    { type: 'talk', title: 'Implementing GJK (Casey Muratori)', url: 'https://caseymuratori.com/blog_0003', year: 2006, note: '원점 방향 단체 갱신을 설명한 유명한 영상.' },
    { type: 'book', title: 'Collision Detection in Interactive 3D Environments (Gino van den Bergen)', year: 2003, note: 'GJK/EPA 실전 구현. SOLID 라이브러리.' },
    { type: 'article', title: 'GJK & EPA, dyn4j blog (William Bittle)', url: 'https://dyn4j.org/2010/04/gjk-gilbert-johnson-keerthi/', year: 2010 },
  ],
  params: [
    { key: 'verts', label: '꼭짓점 수 (각 도형)', type: 'int', min: 3, max: 64, default: 48, shared: true, reset: true, group: '도형' },
    { key: 'spin', label: '회전 속도', type: 'range', min: 0, max: 2, step: 0.05, default: 0.3, shared: true },
    { key: 'method', label: '방식', type: 'select', group: '알고리즘', options: [
      { value: 'full', label: '민코프스키 차 전부 계산 (n×m)' },
      { value: 'gjk', label: 'GJK (support 함수)' },
    ], a: 'full', b: 'gjk' },
    { key: 'epa', label: 'EPA로 침투 깊이 계산', type: 'bool', default: true, when: (p) => p.method === 'gjk' },
    { key: 'ghostHull', label: 'A−B 외곽선 참고 표시', type: 'bool', a: false, b: true, when: (p) => p.method === 'gjk', help: '시각화 전용 (비용에 포함하지 않음)' },
  ],
  en: {
    title: 'Minkowski Difference & GJK / EPA',
    summary: 'When two convex shapes overlap, their Minkowski difference A−B contains the origin (and the reverse is also true). Building all of A−B takes n×m operations. GJK finds a simplex that encloses the origin with just a few support calls.',
    views: { a: 'Compute the full Minkowski difference', b: 'GJK + EPA' },
    controls: 'Mouse: move shape A (it moves on its own when the mouse is outside)',
    info: `
    <p>The <b>Minkowski difference</b> A−B is the set of all points you get by subtracting a point of B from a point of A. As a formula: { a − b | a∈A, b∈B }.
    If A and B share a point, then a − b = 0. In other words, <b>the origin is inside A−B</b>.</p>
    <p>The bottom right panel shows A−B space, and the cross is the origin. Move the shapes and you can see the moment the origin enters and leaves.</p>
    <p>View A computes the difference of every vertex pair (n×m points). It builds their convex hull and checks if it contains the origin. This is exact but expensive.</p>
    <p><b>GJK</b> (Gilbert-Johnson-Keerthi) never builds A−B. It uses a single support function:
    <code>support(d) = (farthest point of A in direction d) − (farthest point of B in direction −d)</code>.</p>
    <ul>
      <li>Grow a simplex toward the origin (point, then segment, then triangle).</li>
      <li>If the simplex encloses the origin, stop with a collision.</li>
      <li>If it cannot get past the origin, stop with a separation.</li>
      <li>Usually 3 to 6 iterations are enough.</li>
    </ul>
    <p>When the shapes overlap, use <b>EPA</b> (Expanding Polytope Algorithm). EPA expands GJK's final triangle out to the boundary of A−B and finds the edge nearest the origin.
    That distance and normal are the penetration depth and direction (MTV).</p>`,
    look: [
      'Compare the bottom right panels. A draws a cloud of n×m points and its hull. B draws only the support points GJK actually computed (numbered) and the final simplex.',
      'With 48 vertices, look at "Vertex ops". A builds 2304 differences. B is about iterations × (n+m).',
      'In B, overlap the shapes. The EPA polygon (yellow) spreads out, and a penetration vector arrow appears in the original space.',
      'Change the vertex count. The GJK iteration count barely changes. A circle (many vertices) or a capsule works too, as long as it has a support function.',
    ],
    refs: [
      'IEEE Journal on Robotics and Automation. The original GJK paper.',
      'A famous video that explains how to update the simplex toward the origin.',
      'Practical GJK/EPA implementation. The SOLID library.',
      null,
    ],
    params: {
      verts: { label: 'Vertex count (each shape)', group: 'Shapes' },
      spin: 'Rotation speed',
      method: { label: 'Method', group: 'Algorithm', options: { full: 'Full Minkowski difference (n×m)', gjk: 'GJK (support function)' } },
      epa: 'Compute penetration depth with EPA',
      ghostHull: { label: 'Show A−B outline for reference', help: 'For display only (not counted in the cost)' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params, V = U.v2;
    let t = 0, ang = 0, ax = ctx.width * 0.3, ay = ctx.height * 0.4;
    let localA = [], localB = [];

    function convexBlob(r, k, rx, ry) {
      const angs = Array.from({ length: k }, () => r.range(0, U.TAU)).sort((a, b) => a - b);
      return angs.map((a) => ({ x: Math.cos(a) * rx, y: Math.sin(a) * ry }));
    }
    function init() {
      ctx.rng = U.rng(ctx.seed);
      const k = P.verts;
      localA = convexBlob(ctx.rng, k, 60, 30);
      localB = convexBlob(ctx.rng, k, 45, 55);
    }
    init();
    const place = (pts, cx, cy, a) => { const c = Math.cos(a), s = Math.sin(a); return pts.map((p) => ({ x: cx + p.x * c - p.y * s, y: cy + p.x * s + p.y * c })); };

    function hull(pts) {
      const p = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
      const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
      const lo = [], up = [];
      for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
      for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
      return lo.slice(0, -1).concat(up.slice(0, -1));
    }
    function containsOrigin(h) { // CCW 볼록 다각형
      for (let i = 0; i < h.length; i++) { const a = h[i], b = h[(i + 1) % h.length]; if ((b.x - a.x) * (-a.y) - (b.y - a.y) * (-a.x) < 0) return false; }
      return h.length > 2;
    }

    function fullMethod(A, B) {
      const pts = [];
      for (const a of A) for (const b of B) pts.push({ x: a.x - b.x, y: a.y - b.y });
      const h = hull(pts);
      return { pts, hull: h, hit: containsOrigin(h), ops: A.length * B.length };
    }

    // ── GJK ──
    function gjk(A, B, cA, cB) {
      let ops = 0;
      const far = (S, d) => { let best = S[0], bd = -Infinity; for (const p of S) { ops++; const v = p.x * d.x + p.y * d.y; if (v > bd) { bd = v; best = p; } } return best; };
      const support = (d) => V.sub(far(A, d), far(B, { x: -d.x, y: -d.y }));
      const triple = (a, b, c) => { const ac = a.x * c.x + a.y * c.y, bc = b.x * c.x + b.y * c.y; return { x: b.x * ac - a.x * bc, y: b.y * ac - a.y * bc }; };
      const supports = [];
      let d = V.sub(cA, cB); if (V.lenSq(d) < 1e-9) d = { x: 1, y: 0 };
      const S = [support(d)]; supports.push(S[0]);
      d = V.scale(S[0], -1);
      let iter = 0, hit = false;
      while (iter++ < 32) {
        if (V.lenSq(d) < 1e-12) { hit = true; break; } // 원점이 단체 위
        const p = support(d); supports.push(p);
        if (V.dot(p, d) < 0) { hit = false; break; }
        S.push(p);
        if (S.length === 2) {
          const a = S[1], b = S[0], ab = V.sub(b, a), ao = V.scale(a, -1);
          d = triple(ab, ao, ab);
          if (V.lenSq(d) < 1e-12) d = V.perp(ab);
        } else {
          const a = S[2], b = S[1], c = S[0];
          const ab = V.sub(b, a), ac = V.sub(c, a), ao = V.scale(a, -1);
          const abPerp = triple(ac, ab, ab), acPerp = triple(ab, ac, ac);
          if (V.dot(abPerp, ao) > 0) { S.splice(0, 1); d = abPerp; }
          else if (V.dot(acPerp, ao) > 0) { S.splice(1, 1); d = acPerp; }
          else { hit = true; break; }
        }
      }
      return { S, supports, hit, iter, ops, support };
    }

    function epa(S, support) {
      const poly = S.slice();
      let iter = 0, best = null;
      while (iter++ < 32) {
        best = null;
        for (let i = 0; i < poly.length; i++) {
          const a = poly[i], b = poly[(i + 1) % poly.length];
          let n = V.norm(V.perp(V.sub(b, a)));
          let dist = V.dot(n, a);
          if (dist < 0) { n = V.scale(n, -1); dist = -dist; }
          if (!best || dist < best.dist) best = { n, dist, i };
        }
        const p = support(best.n);
        if (V.dot(p, best.n) - best.dist < 0.01) break;
        poly.splice(best.i + 1, 0, p);
      }
      return { poly, n: best.n, depth: best.dist, iter };
    }

    let res = null;
    function compute() {
      const W = ctx.width, H = ctx.height;
      const cA = { x: ax, y: ay }, cB = { x: W * 0.36, y: H * 0.5 };
      const A = place(localA, cA.x, cA.y, ang), B = place(localB, cB.x, cB.y, -ang * 0.7);
      const t0 = ctx.now();
      let out;
      const REP = 20;
      for (let k = 0; k < REP; k++) {
        if (P.method === 'full') out = fullMethod(A, B);
        else {
          out = gjk(A, B, cA, cB);
          if (out.hit && P.epa && out.S.length === 3) out.epa = epa(out.S, out.support);
        }
      }
      out.us = ((ctx.now() - t0) / REP) * 1000;
      Object.assign(out, { A, B, cA, cB });
      return out;
    }

    let usAvg = 0;
    return {
      update(dt) {
        t += dt; ang += P.spin * dt;
        const m = ctx.input.mouse, W = ctx.width, H = ctx.height;
        if (m.inside && m.x < W * 0.72) { ax = m.x; ay = m.y; }
        else if (!m.inside) { ax = W * 0.36 + Math.cos(t * 0.5) * W * 0.2; ay = H * 0.5 + Math.sin(t * 0.8) * H * 0.18; }
        res = compute();
        usAvg = usAvg ? usAvg * 0.9 + res.us * 0.1 : res.us;
      },
      render() {
        ctx.clearStats();
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const r = res || compute();
        D.grid(g, W, H, 40);
        const hitCol = 'rgba(255,83,112,0.35)';
        D.poly(g, r.B, r.hit ? hitCol : 'rgba(79,195,247,0.2)', C.b, 2);
        D.poly(g, r.A, r.hit ? hitCol : 'rgba(255,122,89,0.2)', C.a, 2);
        D.text(g, 'A', r.cA.x - 4, r.cA.y - 6, { color: C.a }); D.text(g, 'B', r.cB.x - 4, r.cB.y - 6, { color: C.b });
        if (r.epa) {
          const pv = V.scale(r.epa.n, -r.epa.depth);
          D.arrow(g, r.cA.x, r.cA.y, r.cA.x + pv.x, r.cA.y + pv.y, C.warn, 2.5);
          g.setLineDash([5, 4]); D.poly(g, r.A.map((p) => V.add(p, pv)), null, C.warn, 1.5); g.setLineDash([]);
        }

        // ── 민코프스키 공간 패널 ──
        const ps = Math.min(W * 0.4, H * 0.6), px0 = W - ps - 8, py0 = H - ps - 8;
        const ox = px0 + ps / 2, oy = py0 + ps / 2, sc = ps / 2 / 230;
        const M = (p) => ({ x: ox + p.x * sc, y: oy + p.y * sc });
        g.save();
        g.beginPath(); g.rect(px0, py0, ps, ps); g.clip();
        D.rect(g, px0, py0, ps, ps, 'rgba(0,0,0,0.45)');
        D.grid(g, ps, ps, 25 * sc * 2, 'rgba(255,255,255,0.05)', px0, py0);
        if (P.method === 'full') {
          g.fillStyle = 'rgba(255,255,255,0.35)';
          for (const p of r.pts) { const q = M(p); g.fillRect(q.x - 1, q.y - 1, 2, 2); }
          D.poly(g, r.hull.map(M), r.hit ? 'rgba(255,83,112,0.2)' : 'rgba(255,122,89,0.12)', C.a, 1.5);
        } else {
          if (P.ghostHull) {
            const h = fullMethod(r.A, r.B).hull;
            g.setLineDash([3, 4]); D.poly(g, h.map(M), null, 'rgba(255,255,255,0.3)', 1); g.setLineDash([]);
          }
          if (r.epa) D.poly(g, r.epa.poly.map(M), 'rgba(255,203,107,0.12)', C.warn, 1.5);
          r.supports.forEach((p, i) => { const q = M(p); D.circle(g, q.x, q.y, 3, C.b); D.text(g, String(i), q.x + 4, q.y - 12, { size: 10, color: C.b }); });
          D.poly(g, r.S.map(M), r.hit ? 'rgba(255,83,112,0.3)' : 'rgba(79,195,247,0.15)', r.hit ? C.bad : C.b, 2, r.S.length > 2);
          if (r.epa) { const q = M(V.scale(r.epa.n, r.epa.depth)); D.arrow(g, ox, oy, q.x, q.y, C.warn, 2); }
        }
        D.line(g, ox - 8, oy, ox + 8, oy, C.text, 1.5); D.line(g, ox, oy - 8, ox, oy + 8, C.text, 1.5);
        g.restore();
        D.rect(g, px0, py0, ps, ps, null, 'rgba(255,255,255,0.25)');
        D.text(g, GTL.L('A − B 공간 (원점 = 십자)', 'A − B space (origin = cross)'), px0 + 6, py0 + 4, { size: 11, color: C.dim });
        D.text(g, r.hit ? GTL.L('원점 포함 → 충돌', 'Contains origin → collision') : GTL.L('원점 밖 → 분리', 'Origin outside → separated'), 10, 10, { size: 14, color: r.hit ? C.bad : C.good });

        ctx.stat(GTL.L('판정', 'Result'), r.hit ? GTL.L('충돌', 'Collision') : GTL.L('분리', 'Separated'));
        ctx.stat(GTL.L('정점 연산', 'Vertex ops'), r.ops.toLocaleString() + (P.method === 'full' ? GTL.L(' (n×m 차)', ' (n×m differences)') : GTL.L(' (support 내적)', ' (support dot products)')));
        if (P.method === 'gjk') ctx.stat(GTL.L('GJK 반복', 'GJK iterations'), r.iter);
        if (r.epa) ctx.stat(GTL.L('EPA 반복 / 침투 깊이', 'EPA iterations / penetration depth'), `${r.epa.iter} / ${r.epa.depth.toFixed(1)} px`);
        ctx.stat(GTL.L('판정 비용', 'Test cost'), usAvg.toFixed(1) + ' µs');
      },
    };
  },
});
