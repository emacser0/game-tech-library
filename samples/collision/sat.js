// 분리축 정리 (SAT): 투영 시각화와 최소 이동 벡터(MTV)
GTL.register({
  id: 'sat',
  title: '분리축 정리 (SAT) & 최소 이동 벡터',
  summary: '두 볼록 도형이 떨어져 있으면 투영이 겹치지 않는 축이 반드시 있음. 2D에서는 각 변의 법선만 검사하면 충분함. 겹침이 가장 작은 축이 밀어낼 방향(MTV).',
  views: { a: '월드 X/Y축만 (= AABB)', b: '모든 변의 법선' },
  controls: '마우스: 주황색 도형 A 이동 (마우스가 밖에 있으면 자동 이동), 휠: A 회전',
  info: `
    <p><b>분리축 정리</b>(Separating Axis Theorem, SAT): "두 볼록 도형이 겹치지 않음"과 "투영 구간이 겹치지 않는 축이 있음"은 같은 뜻.
    2D 볼록 다각형에서는 <b>두 도형의 모든 변의 법선</b>만 후보 축으로 보면 됨. 3D에서는 면 법선과 변끼리의 외적까지 봄.</p>
    <p>검사 순서:</p>
    <ol>
      <li>축마다 꼭짓점을 내적으로 투영해 [min, max] 구간을 구함</li>
      <li>한 축이라도 구간이 떨어져 있으면 바로 끝냄(조기 종료, early-out)</li>
      <li>모든 축에서 겹치면 충돌</li>
      <li><b>겹침이 가장 작은 축 × 그 겹침량</b>이 도형을 떼어내는 최소 이동 벡터(MTV)</li>
    </ol>
    <p>A 뷰처럼 월드 X/Y축만 검사하면 AABB 검사와 같아짐. 그래서 회전한 도형이 실제로 떨어져 있어도 충돌로 판정.</p>
    <p>화면 둘레의 선이 각 축이고, 그 위의 굵은 막대가 두 도형의 투영 구간. 초록 축이 분리축.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <polygon points="90,45 120,75 90,105 60,75" class="d-a"/>
    <polygon points="140,95 170,125 140,155 110,125" class="d-line"/>
    <line x1="106.5" y1="13.7" x2="202" y2="109.2" class="d-dim"/>
    <line x1="113.9" y1="21.1" x2="143.9" y2="51.1" class="d-a" stroke-width="4"/>
    <line x1="163.9" y1="71.1" x2="193.9" y2="101.1" class="d-line" stroke-width="4"/>
    <line x1="143.9" y1="51.1" x2="163.9" y2="71.1" class="d-good" stroke-width="4"/>
    <line x1="120" y1="75" x2="143.9" y2="51.1" class="d-dim" stroke-dasharray="3 3"/>
    <line x1="140" y1="95" x2="163.9" y2="71.1" class="d-dim" stroke-dasharray="3 3"/>
    <text x="172" y="62" class="t-small">${L('분리축', 'separating axis')}</text>
    <line x1="40" y1="188" x2="200" y2="188" class="d-dim"/>
    <line x1="60" y1="176" x2="120" y2="176" class="d-a" stroke-width="3"/>
    <line x1="110" y1="182" x2="170" y2="182" class="d-line" stroke-width="3"/>
    <rect x="110" y="172" width="10" height="14" class="f-bad" opacity="0.5"/>
    <text x="210" y="184" class="t-small t-a">${L('X축: 구간이 겹쳐 충돌로 오판', 'X axis: overlap, false hit')}</text>
    <text x="300" y="30" class="t-a">${L('A: 월드 X, Y축만 검사', 'A: test world X and Y only')}</text>
    <text x="300" y="44" class="t-small t-dim">${L('두 축 모두 겹쳐 충돌로 판정', 'Both overlap, so it reports a hit')}</text>
    <text x="300" y="74" class="t-b">${L('B: 모든 변의 법선 검사', 'B: test every edge normal')}</text>
    <text x="300" y="88" class="t-small t-dim">${L('대각선 법선에서 틈 발견, 조기 종료', 'A gap on the diagonal normal: stop early')}</text>
    <text x="300" y="118" class="t-small t-dim">${L('모두 겹치면 겹침이 가장 작은 축이 MTV', 'All overlap: least overlap axis = MTV')}</text>
  </svg>`,
  look: [
    '도형이 비스듬히 스치듯 지나갈 때 보면 A는 "충돌 (거짓 양성!)"을 표시. B는 초록색 분리축을 찾아냄.',
    'B에서 두 도형을 겹치면 노란 화살표(MTV)가 겹침이 가장 작은 축 방향을 가리킴. 점선 도형이 밀어낸 위치.',
    '"조기 종료"를 끄면 모든 축을 검사. 켜면 분리축을 찾는 즉시 멈춰서 "검사한 축 수"가 줄어듦.',
    '꼭짓점 수를 8로 올리면 후보 축이 늘어남(평행한 법선은 하나로 합침). 원은 축이 무한하므로 "중심에서 가장 가까운 꼭짓점 방향" 축을 추가하는 식으로 처리.',
  ],
  refs: [
    { type: 'book', title: 'Real-Time Collision Detection, 5.2.1 Separating-axis Test (Christer Ericson)', year: 2005 },
    { type: 'book', title: 'Collision Detection in Interactive 3D Environments (Gino van den Bergen)', year: 2003 },
    { type: 'article', title: 'SAT (Separating Axis Theorem), dyn4j blog (William Bittle)', url: 'https://dyn4j.org/2010/01/sat/', year: 2010, note: '투영과 MTV를 그림으로 설명한 대표 튜토리얼' },
    { type: 'engine', title: 'Box2D, b2CollidePolygons', url: 'https://github.com/erincatto/box2d', note: '분리가 가장 큰 축(가장 덜 겹치는 면 법선)을 찾아 접촉을 생성' },
  ],
  params: [
    { key: 'sidesA', label: 'A 꼭짓점 수', type: 'int', min: 3, max: 8, default: 4, shared: true, group: '도형' },
    { key: 'sidesB', label: 'B 꼭짓점 수', type: 'int', min: 3, max: 8, default: 5, shared: true },
    { key: 'stretch', label: 'A 길쭉함', type: 'range', min: 1, max: 3, step: 0.05, default: 2.2, shared: true },
    { key: 'spin', label: '회전 속도', type: 'range', min: 0, max: 2, step: 0.05, default: 0.4, shared: true },
    { key: 'axes', label: '검사 축', type: 'select', group: 'SAT', options: [
      { value: 'xy', label: '월드 X/Y축만 (= AABB 검사)' },
      { value: 'normals', label: '모든 변의 법선' },
    ], a: 'xy', b: 'normals' },
    { key: 'earlyOut', label: '조기 종료', type: 'bool', default: true },
    { key: 'resolve', label: 'MTV로 밀어낸 위치 표시', type: 'bool', default: true },
    { key: 'showProj', label: '투영 표시', type: 'bool', default: true },
  ],
  en: {
    title: 'Separating Axis Theorem (SAT) & Minimum Translation Vector',
    summary: 'If two convex shapes are apart, there is always an axis where their projections do not overlap. In 2D, testing the normal of each edge is enough. The axis with the smallest overlap gives the push-out direction (MTV).',
    views: { a: 'World X/Y axes only (= AABB)', b: 'All edge normals' },
    controls: 'Mouse: move orange shape A (it moves on its own when the mouse is outside), wheel: rotate A',
    info: `
    <p><b>Separating Axis Theorem</b> (SAT): "two convex shapes do not overlap" means the same as "there is an axis where their projected intervals do not overlap".
    For 2D convex polygons, you only need to try <b>the normals of every edge of both shapes</b> as candidate axes. In 3D you also try the cross products of edge pairs, along with face normals.</p>
    <p>Test steps:</p>
    <ol>
      <li>For each axis, project the vertices with a dot product to get the [min, max] interval.</li>
      <li>If the intervals are apart on even one axis, stop right away (early-out).</li>
      <li>If they overlap on every axis, it is a collision.</li>
      <li><b>The axis with the smallest overlap × that overlap</b> is the minimum translation vector (MTV) that pulls the shapes apart.</li>
    </ol>
    <p>If you test only the world X/Y axes like view A, it becomes the same as an AABB test. So it reports a collision even when rotated shapes are actually apart.</p>
    <p>The lines around the screen are the axes. The thick bars on them are the projected intervals of the two shapes. A green axis is a separating axis.</p>`,
    look: [
      'Watch when the shapes graze past each other at an angle. A shows "Collision (false positive!)". B finds a green separating axis.',
      'In B, overlap the two shapes. The yellow arrow (MTV) points along the axis with the smallest overlap. The dashed shape is the pushed-out position.',
      'Turn off "Early-out" and every axis is tested. Turn it on and the test stops as soon as it finds a separating axis, so "Axes tested" goes down.',
      'Raise the vertex count to 8. The candidate axes increase (parallel normals merge into one). A circle has infinite axes, so you handle it by adding an axis toward the vertex nearest the center.',
    ],
    refs: [
      null,
      null,
      'A well-known tutorial that explains projection and the MTV with pictures.',
      'Finds the axis with the largest separation (the face normal with the least overlap) and builds contacts from it.',
    ],
    params: {
      sidesA: { label: 'A vertex count', group: 'Shapes' },
      sidesB: 'B vertex count',
      stretch: 'A stretch',
      spin: 'Rotation speed',
      axes: { label: 'Test axes', options: { xy: 'World X/Y axes only (= AABB test)', normals: 'All edge normals' } },
      earlyOut: 'Early-out',
      resolve: 'Show position pushed out by MTV',
      showProj: 'Show projections',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    let t = 0, angA = 0.5, angB = 0, wheelAng = 0;
    let ax = ctx.width * 0.25, ay = ctx.height * 0.5;

    const regular = (k, r, sx) => Array.from({ length: k }, (_, i) => {
      const a = (i / k) * U.TAU + Math.PI / k;
      return { x: Math.cos(a) * r * sx, y: Math.sin(a) * r };
    });
    const place = (pts, cx, cy, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return pts.map((p) => ({ x: cx + p.x * c - p.y * s, y: cy + p.x * s + p.y * c })); };
    const normalsOf = (poly) => poly.map((p, i) => { const q = poly[(i + 1) % poly.length]; return U.v2.norm({ x: -(q.y - p.y), y: q.x - p.x }); });
    const project = (poly, n) => { let lo = Infinity, hi = -Infinity; for (const v of poly) { const d = v.x * n.x + v.y * n.y; if (d < lo) lo = d; if (d > hi) hi = d; } return [lo, hi]; };

    function sat(A, B, mode, early) {
      let axes;
      if (mode === 'xy') axes = [{ x: 1, y: 0 }, { x: 0, y: 1 }];
      else {
        axes = [];
        for (const n of normalsOf(A).concat(normalsOf(B))) if (!axes.some((m) => Math.abs(m.x * n.x + m.y * n.y) > 0.9999)) axes.push(n);
      }
      const res = [];
      let hit = true, best = null;
      for (const n of axes) {
        const a = project(A, n), b = project(B, n);
        const ov = Math.min(a[1], b[1]) - Math.max(a[0], b[0]);
        res.push({ n, a, b, ov });
        if (ov < 0) { hit = false; if (early) break; }
        else if (!best || ov < best.ov) best = { n, ov };
      }
      return { axes: res, total: axes.length, hit, best };
    }

    let shapeA = [], shapeB = [], cA = { x: 0, y: 0 }, cB = { x: 0, y: 0 };
    function rebuild() {
      const W = ctx.width, H = ctx.height, R = Math.min(W, H) * 0.12;
      cB = { x: W * 0.5, y: H * 0.5 };
      cA = { x: ax, y: ay };
      shapeA = place(regular(P.sidesA, R * 0.55, P.stretch), cA.x, cA.y, angA + wheelAng);
      shapeB = place(regular(P.sidesB, R, 1), cB.x, cB.y, angB);
    }

    return {
      update(dt) {
        t += dt;
        angA += P.spin * dt * 0.7; angB -= P.spin * dt * 0.4;
        const m = ctx.input.mouse, W = ctx.width, H = ctx.height;
        if (m.inside) { ax = m.x; ay = m.y; }
        else { const R = Math.min(W, H) * 0.26; ax = W * 0.5 + Math.cos(t * 0.6) * R * 1.1; ay = H * 0.5 + Math.sin(t * 0.6) * R * 0.75; }
      },
      onPointer(type, m) { if (type === 'wheel') wheelAng += (m.wheel > 0 ? 1 : -1) * 0.12; },
      render() {
        ctx.clearStats();
        const g = ctx.g, W = ctx.width, H = ctx.height;
        rebuild();
        const colA = C.a, colB = C.b;
        const r = sat(shapeA, shapeB, P.axes, P.earlyOut);
        const truth = sat(shapeA, shapeB, 'normals', true).hit;
        D.grid(g, W, H, 40);

        // 축 + 투영 구간
        const O = { x: W / 2, y: H / 2 }, ring = Math.min(W, H) * 0.44;
        const sepIdx = r.axes.findIndex((a) => a.ov < 0);
        if (P.showProj) {
          r.axes.forEach((A, k) => {
            const n = A.n, p = { x: -n.y, y: n.x };
            const off = ring * (k % 2 ? -1 : 1) * (0.86 + 0.14 * ((k >> 1) % 2));
            const base = { x: O.x + p.x * off, y: O.y + p.y * off };
            const oD = O.x * n.x + O.y * n.y;
            const pt = (tt, s = 0) => ({ x: base.x + n.x * (tt - oD) + p.x * s, y: base.y + n.y * (tt - oD) + p.y * s });
            const isSep = k === sepIdx, isMtv = r.hit && r.best && r.best.n === n;
            const axisCol = isSep ? C.good : isMtv ? C.warn : 'rgba(255,255,255,0.18)';
            const L0 = pt(oD - 1000), L1 = pt(oD + 1000);
            D.line(g, L0.x, L0.y, L1.x, L1.y, axisCol, isSep || isMtv ? 1.5 : 1);
            const a0 = pt(A.a[0], 4), a1 = pt(A.a[1], 4), b0 = pt(A.b[0], -4), b1 = pt(A.b[1], -4);
            D.line(g, a0.x, a0.y, a1.x, a1.y, colA, 5);
            D.line(g, b0.x, b0.y, b1.x, b1.y, colB, 5);
            if (A.ov >= 0) { const o0 = pt(Math.max(A.a[0], A.b[0])), o1 = pt(Math.min(A.a[1], A.b[1])); D.line(g, o0.x, o0.y, o1.x, o1.y, 'rgba(255,83,112,0.9)', 3); }
            const lab = pt((A.a[1] + A.b[1]) / 2 + 30, 12 * (k % 2 ? -1 : 1));
            D.text(g, A.ov < 0 ? GTL.L(`분리 ${(-A.ov).toFixed(0)}`, `Gap ${(-A.ov).toFixed(0)}`) : GTL.L(`겹침 ${A.ov.toFixed(0)}`, `Overlap ${A.ov.toFixed(0)}`), lab.x, lab.y, { size: 10, color: isSep ? C.good : isMtv ? C.warn : C.dim, align: 'center', baseline: 'middle' });
            if (isSep || isMtv) {
              // 꼭짓점 → 축 투영 안내선
              g.setLineDash([3, 4]);
              for (const [poly, s] of [[shapeA, 4], [shapeB, -4]]) {
                const [lo, hi] = project(poly, n);
                for (const v of poly) {
                  const d = v.x * n.x + v.y * n.y;
                  if (Math.abs(d - lo) < 1e-6 || Math.abs(d - hi) < 1e-6) { const q = pt(d, s); D.line(g, v.x, v.y, q.x, q.y, 'rgba(255,255,255,0.25)', 1); }
                }
              }
              g.setLineDash([]);
            }
          });
        }
        // AABB(검사 축이 xy일 때 실제로 검사하는 것)
        if (P.axes === 'xy') {
          for (const poly of [shapeA, shapeB]) {
            const xs = poly.map((p) => p.x), ys = poly.map((p) => p.y);
            g.setLineDash([4, 4]);
            D.rect(g, Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), null, 'rgba(255,255,255,0.35)');
            g.setLineDash([]);
          }
        }
        const fillA = r.hit ? 'rgba(255,83,112,0.35)' : 'rgba(255,122,89,0.25)';
        D.poly(g, shapeB, r.hit ? 'rgba(255,83,112,0.35)' : 'rgba(79,195,247,0.25)', colB, 2);
        D.poly(g, shapeA, fillA, colA, 2);
        D.text(g, 'A', cA.x - 4, cA.y - 6, { color: colA, size: 12 });
        D.text(g, 'B', cB.x - 4, cB.y - 6, { color: colB, size: 12 });

        // MTV
        let mtvLen = 0;
        if (r.hit && r.best && P.resolve) {
          let n = r.best.n;
          if ((cA.x - cB.x) * n.x + (cA.y - cB.y) * n.y < 0) n = { x: -n.x, y: -n.y };
          mtvLen = r.best.ov;
          const push = U.v2.scale(n, r.best.ov);
          D.arrow(g, cA.x, cA.y, cA.x + push.x, cA.y + push.y, C.warn, 2.5);
          g.setLineDash([5, 4]);
          D.poly(g, shapeA.map((p) => U.v2.add(p, push)), null, C.warn, 1.5);
          g.setLineDash([]);
        }
        const verdict = r.hit ? (truth ? GTL.L('충돌', 'Collision') : GTL.L('충돌 (거짓 양성!)', 'Collision (false positive!)')) : GTL.L('분리됨', 'Separated');
        D.text(g, GTL.L(`판정: ${verdict}`, `Result: ${verdict}`), 10, 10, { size: 14, color: r.hit ? (truth ? C.bad : C.warn) : C.good });
        ctx.stat(GTL.L('검사한 축 / 후보 축', 'Axes tested / candidate axes'), `${r.axes.length} / ${r.total}`);
        ctx.stat(GTL.L('판정', 'Result'), verdict);
        ctx.stat(GTL.L('실제 (모든 법선 SAT)', 'Truth (SAT on all normals)'), truth ? GTL.L('충돌', 'Collision') : GTL.L('분리', 'Separated'));
        if (r.hit) ctx.stat(GTL.L('MTV 길이', 'MTV length'), mtvLen.toFixed(1) + ' px');
      },
    };
  },
});
