// 궤적 효과: 매 프레임 점(입자) 찍기 vs 연속 리본(트레일 렌더러). 정점 간격, 수명, 너비 감쇠, 곡선 보간.
GTL.register({
  id: 'ribbon-trail',
  title: '궤적 효과: 점 찍기 vs 연속 리본',
  summary: '빠르게 휘두르는 칼끝에 매 프레임 점을 찍으면 점 사이가 벌어져 궤적이 끊김. 지나간 위치를 정점으로 이어 띠(리본)를 만들면 속도와 상관없이 이어지고, 곡선 보간으로 꺾임도 없앰.',
  views: { a: '매 프레임 점 찍기', b: '리본 + 곡선 보간' },
  controls: '조작 없음. 칼끝이 빠르게 휘두르고 잠깐 멈추기를 반복.',
  info: `
    <p>칼 휘두르기, 미사일 연기, 자동차 미등 같은 궤적은 지나간 위치를 기록해서 그림</p>
    <p><b>점 찍기</b>: 매 프레임 칼끝에 입자를 하나 놓음. 이동 거리가 점 크기보다 크면 점 사이가 빔. 빠른 동작일수록, 프레임레이트가 낮을수록 심함.</p>
    <p><b>리본(ribbon)</b>: 위치를 정점 목록에 넣고 이웃 정점을 잇는 띠를 만듦. 정점마다 진행 방향의 수직 방향으로 너비만큼 벌려 사각형 두 개(삼각형 띠)를 이음.</p>
    <ul>
      <li><b>정점 최소 간격</b>: 이만큼 움직였을 때만 정점을 추가. 크면 정점이 적지만 곡선이 각짐.</li>
      <li><b>수명</b>: 정점이 생긴 뒤 사라질 때까지의 시간. 나이에 따라 투명도를 줄임.</li>
      <li><b>너비 감쇠</b>: 오래된 정점일수록 좁게 해서 꼬리를 뾰족하게 만듦</li>
      <li><b>곡선 보간</b>: Catmull-Rom 스플라인으로 정점 사이를 나눠 매끈하게 만듦</li>
    </ul>
    <p>단점: 급하게 꺾이는 곳에서 띠가 안쪽으로 겹치거나 꼬일 수 있음. 텍스처를 입히면 UV 늘어남도 다뤄야 함.</p>`,
  // 도식: 같은 경로에서 프레임마다 점 하나(간격이 지름보다 크면 끊김) vs 정점을 이어 만든 삼각형 띠(진행 방향의 수직으로 너비만큼 벌림, 꼬리로 갈수록 좁아짐)
  diagram: (L) => {
    const f = (n) => n.toFixed(1);
    const path = (x0, u) => [x0 + u * 210, 110 - Math.sin(u * Math.PI) * 50];
    const us = [0, 0.2, 0.4, 0.6, 0.8, 1];
    const dots = us.map((u, i) => { const p = path(20, u); return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(3 + i * 1.6)}" class="f-a" opacity="${(0.35 + i * 0.12).toFixed(2)}"/>`; }).join('');
    const vs = us.map((u) => path(300, u));
    const side = vs.map((p, i) => {
      const a = vs[Math.max(0, i - 1)], b = vs[Math.min(vs.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy); dx /= l; dy /= l;
      const w = 3 + i * 3;
      return { l: [p[0] - dy * w, p[1] + dx * w], r: [p[0] + dy * w, p[1] - dx * w], p };
    });
    let quads = '';
    for (let i = 0; i < side.length - 1; i++) {
      const A = side[i], B = side[i + 1];
      quads += `<polygon points="${f(A.l[0])},${f(A.l[1])} ${f(B.l[0])},${f(B.l[1])} ${f(B.r[0])},${f(B.r[1])} ${f(A.r[0])},${f(A.r[1])}" class="f-b" opacity="${(0.3 + i * 0.1).toFixed(2)}"/>`;
      quads += `<line x1="${f(A.r[0])}" y1="${f(A.r[1])}" x2="${f(B.l[0])}" y2="${f(B.l[1])}" class="d-dim"/>`;
    }
    const n = side[3];
    return `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arrR" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <path d="M20,110 Q125,10 230,110" class="d-dim" stroke-dasharray="3 3"/>
    ${dots}
    <text x="125" y="140" text-anchor="middle" class="t-small t-dim">${L('간격 = 속도 × dt, 지름보다 크면 끊김', 'gap = speed × dt, breaks if wider than a dot')}</text>
    ${quads}
    ${vs.map((p) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="2.5" class="f-accent"/>`).join('')}
    <line x1="${f(n.p[0])}" y1="${f(n.p[1])}" x2="${f(n.r[0])}" y2="${f(n.r[1])}" class="d-accent" marker-end="url(#arrR)"/>
    <text x="${f(n.r[0] + 8)}" y="${f(n.r[1] - 4)}" class="t-small">${L('수직 방향 × 너비/2', 'normal × width/2')}</text>
    <text x="300" y="130" text-anchor="middle" class="t-small t-dim">${L('꼬리 (오래된 정점)', 'tail (old)')}</text>
    <text x="510" y="134" text-anchor="middle" class="t-small t-dim">${L('칼끝', 'tip')}</text>
    <text x="405" y="150" text-anchor="middle" class="t-small t-dim">${L('정점 사이마다 삼각형 2개', '2 triangles per segment')}</text>
    <text x="125" y="176" text-anchor="middle" class="t-a">${L('A: 프레임마다 점 1개', 'A: one dot per frame')}</text>
    <text x="405" y="176" text-anchor="middle" class="t-b">${L('B: 정점을 이은 띠', 'B: strip through vertices')}</text>
    <text x="405" y="191" text-anchor="middle" class="t-small t-dim">${L('정점 간격과 상관없이 이어짐', 'stays connected at any spacing')}</text>
  </svg>`;
  },
  look: [
    'A를 보면 휘두르는 순간 점이 띄엄띄엄 찍혀 궤적이 끊김. "끊긴 구간" 값이 B는 0, A는 0보다 큼.',
    'B의 "곡선 보간"을 끄고 "정점 최소 간격"을 40px로 올리면 리본이 꺾인 선분으로 보임. 다시 켜면 매끈해짐.',
    'B의 "너비 감쇠"를 끄면 꼬리가 뭉툭하게 잘림',
    '"휘두르기 속도"를 올리면 A의 점 간격이 더 벌어짐. B는 정점 간격만 늘고 띠는 이어짐.',
  ],
  refs: [
    { type: 'engine', title: 'Unity Manual - Trail Renderer', url: 'https://docs.unity3d.com/Manual/class-TrailRenderer.html', note: 'Time(수명), Min Vertex Distance(정점 최소 간격), Width 곡선' },
    { type: 'engine', title: 'Unreal Engine - Niagara Ribbon Renderer', note: '입자를 순서대로 이어 리본으로 그림. 탄젠트 기반 곡선 분할 지원.' },
    { type: 'book', title: 'Real-Time Rendering (Akenine-Möller, Haines, Hoffman) - Particle Systems', note: '빌보드, 입자 궤적 표현' },
  ],
  params: [
    { key: 'mode', label: '그리기 방식', type: 'select', group: '궤적', options: [
      { value: 'dots', label: '매 프레임 점 찍기' },
      { value: 'ribbon', label: '연속 리본' },
    ], a: 'dots', b: 'ribbon' },
    { key: 'smooth', label: '곡선 보간 (Catmull-Rom)', type: 'bool', a: false, b: true, when: (p) => p.mode === 'ribbon' },
    { key: 'minDist', label: '정점 최소 간격 (px)', type: 'range', min: 1, max: 60, step: 1, default: 14, when: (p) => p.mode === 'ribbon' },
    { key: 'life', label: '수명 (초)', type: 'range', min: 0.05, max: 1.2, step: 0.01, default: 0.35 },
    { key: 'width', label: '너비 (px)', type: 'range', min: 2, max: 40, step: 1, default: 16 },
    { key: 'taper', label: '너비 감쇠', type: 'bool', default: true },
    { key: 'speed', label: '휘두르기 속도', type: 'range', min: 0.3, max: 2.5, step: 0.05, default: 1.2, shared: true, group: '장면' },
  ],
  en: {
    title: 'Trail Effects: Dots vs Continuous Ribbon',
    summary: 'If you place a dot at a fast swinging blade tip every frame, gaps open between the dots and the trail breaks. If you join past positions as vertices into a strip (ribbon), it stays connected at any speed, and curve interpolation removes the sharp corners.',
    views: { a: 'Dot every frame', b: 'Ribbon + curve interpolation' },
    controls: 'No input. The blade tip swings fast, pauses briefly, and repeats.',
    info: `
    <p>Trails such as sword swings, missile smoke, and car tail lights record past positions and draw them.</p>
    <p><b>Dots</b>: place one particle at the blade tip every frame. If the tip moves farther than the dot size, gaps appear between dots. It gets worse with faster motion and lower frame rates.</p>
    <p><b>Ribbon</b>: add positions to a vertex list and build a strip that joins neighboring vertices. At each vertex, spread out by the width at right angles to the direction of travel, and join two triangles per segment (a triangle strip).</p>
    <ul>
      <li><b>Min vertex distance</b>: add a vertex only after moving this far. A large value means fewer vertices, but the curve gets angular.</li>
      <li><b>Lifetime</b>: the time from when a vertex appears until it disappears. Opacity drops with age.</li>
      <li><b>Width taper</b>: older vertices get narrower, so the tail comes to a point.</li>
      <li><b>Curve interpolation</b>: splits the space between vertices with a Catmull-Rom spline to smooth it.</li>
    </ul>
    <p>Downside: at sharp turns, the strip can fold over itself or twist on the inside. With a texture, you also have to deal with UV stretching.</p>`,
    look: [
      'Look at A. During a swing, the dots land far apart and the trail breaks. The "Gaps" value is 0 in B and above 0 in A.',
      'Turn off B\'s "Curve interpolation" and raise "Min vertex distance" to 40px. The ribbon looks like bent line segments. Turn it back on and it becomes smooth.',
      'Turn off B\'s "Width taper". The tail ends in a blunt cut.',
      'Raise the "Swing speed". A\'s dot gaps get wider. In B, only the vertex spacing grows, and the strip stays connected.',
    ],
    refs: [
      'Time (lifetime), Min Vertex Distance, and the Width curve.',
      'Joins particles in order and draws them as a ribbon. Supports tangent-based curve subdivision.',
      'Billboards and particle trail rendering.',
    ],
    params: {
      mode: { label: 'Draw mode', group: 'Trail', options: { dots: 'Dot every frame', ribbon: 'Continuous ribbon' } },
      smooth: 'Curve interpolation (Catmull-Rom)',
      minDist: 'Min vertex distance (px)',
      life: 'Lifetime (s)',
      width: 'Width (px)',
      taper: 'Width taper',
      speed: { label: 'Swing speed', group: 'Scene' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    let t = 0, pts = [], tip = null, gaps = 0, maxGap = 0;
    // 휘두르기: 0.3초 동안 큰 호를 그리고 0.35초 멈춤을 반복. 방향은 번갈아 바뀜.
    function angleAt(time) {
      const cyc = 0.65, k = Math.floor(time / cyc), f = (time % cyc) / cyc;
      const s = U.ease.inOutCubic(U.clamp(f / 0.46, 0, 1));
      const from = k % 2 ? 2.6 : -0.4, to = k % 2 ? -0.4 : 2.6;
      return U.lerp(from, to, s) + Math.sin(time * 1.3) * 0.2;
    }
    const center = () => ({ x: ctx.width * 0.5, y: ctx.height * 0.52 });
    function tipAt(time) {
      const c = center(), a = angleAt(time) - Math.PI / 2 - 1.1, R = Math.min(ctx.width, ctx.height) * 0.36;
      return { x: c.x + Math.cos(a) * R, y: c.y + Math.sin(a) * R * 0.75 };
    }
    function catmull(p0, p1, p2, p3, s) {
      const s2 = s * s, s3 = s2 * s;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * s + (2 * a - 5 * b + 4 * c - d) * s2 + (-a + 3 * b - 3 * c + d) * s3);
      return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y), born: U.lerp(p1.born, p2.born, s) };
    }
    function stripPoints() {
      const src = pts.concat(tip ? [{ ...tip, born: t }] : []);
      if (!P.smooth || src.length < 3) return src;
      const out = [];
      for (let i = 0; i < src.length - 1; i++) {
        const p0 = src[Math.max(0, i - 1)], p1 = src[i], p2 = src[i + 1], p3 = src[Math.min(src.length - 1, i + 2)];
        const n = Math.max(1, Math.min(8, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 6)));
        for (let j = 0; j < n; j++) out.push(catmull(p0, p1, p2, p3, j / n));
      }
      out.push(src[src.length - 1]);
      return out;
    }

    return {
      update(dt) {
        t += dt * P.speed;
        tip = tipAt(t);
        if (P.mode === 'dots') pts.push({ ...tip, born: t });
        else {
          const last = pts[pts.length - 1];
          if (!last || Math.hypot(tip.x - last.x, tip.y - last.y) >= P.minDist) pts.push({ ...tip, born: t });
        }
        while (pts.length && t - pts[0].born > P.life) pts.shift();
        if (pts.length > 2000) pts.splice(0, pts.length - 2000);
        // 끊긴 구간: 이웃한 두 점의 간격이 점 지름보다 큼 (리본은 띠로 이어지므로 0)
        gaps = 0; maxGap = 0;
        for (let i = 1; i < pts.length; i++) {
          const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
          maxGap = Math.max(maxGap, d);
          if (P.mode === 'dots' && d > P.width) gaps++;
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height, col = ctx.side === 'a' ? C.a : C.b;
        const rgb = U.hexToRgb(col), c = center();
        D.grid(g, W, H, 40);
        const ageK = (p) => U.clamp(1 - (t - p.born) / P.life, 0, 1);
        const wOf = (k) => (P.width / 2) * (P.taper ? k : 1);
        let tris = 0, verts = 0;
        if (P.mode === 'dots') {
          for (const p of pts) { const k = ageK(p); D.circle(g, p.x, p.y, wOf(k), `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.15 + 0.75 * k})`); }
          verts = pts.length;
        } else {
          const s = stripPoints();
          verts = s.length;
          const side = s.map((p, i) => {
            const a = s[Math.max(0, i - 1)], b = s[Math.min(s.length - 1, i + 1)];
            let dx = b.x - a.x, dy = b.y - a.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
            const w = wOf(ageK(p));
            return { l: { x: p.x - dy * w, y: p.y + dx * w }, r: { x: p.x + dy * w, y: p.y - dx * w }, k: ageK(p) };
          });
          for (let i = 0; i < side.length - 1; i++) {
            const A = side[i], B = side[i + 1];
            D.poly(g, [A.l, B.l, B.r, A.r], `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.15 + 0.75 * (A.k + B.k) / 2})`);
            tris += 2;
          }
          // 정점 위치 표시
          for (const p of pts) D.circle(g, p.x, p.y, 2, '#ffffff');
        }
        // 칼
        if (tip) { D.line(g, c.x, c.y, tip.x, tip.y, '#cfd6e0', 4); D.circle(g, c.x, c.y, 7, '#20242c', C.dim, 2); D.circle(g, tip.x, tip.y, 4, '#fff'); }
        ctx.stat(P.mode === 'dots' ? GTL.L('입자 수', 'Particles') : GTL.L('기록 정점 수', 'Recorded vertices'), pts.length);
        ctx.stat(GTL.L('그린 정점 수', 'Drawn vertices'), verts);
        if (P.mode !== 'dots') ctx.stat(GTL.L('삼각형 수', 'Triangles'), tris);
        ctx.stat(GTL.L('끊긴 구간', 'Gaps'), gaps);
        ctx.stat(GTL.L('최대 정점 간격', 'Max vertex gap'), maxGap.toFixed(0) + ' px');
      },
    };
  },
});
