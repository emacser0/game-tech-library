// 2D 시야/그림자: 균일 레이 N개 vs 선분 끝점으로 캐스팅 (Visibility polygon)
GTL.register({
  id: 'visibility-polygon',
  title: '2D 시야 다각형 (끝점 레이캐스팅)',
  summary: '시야(빛)가 닿는 영역을 구할 때 사방으로 레이를 N개 쏘면 모서리가 잘리고 가는 틈을 놓침. 벽 끝점 방향(±ε)으로만 쏘면 적은 레이로 정확한 다각형을 얻음.',
  views: { a: '균일 레이 N개', b: '끝점 ± ε 레이' },
  controls: '마우스: 관찰자 이동 (뷰 밖이면 자동 이동)',
  info: `
    <p>시야 다각형(Visibility Polygon)은 관찰자에게 보이는 벽 위의 점들을 각도순으로 이은 다각형. 그림자, 전장의 안개, 시야 기반 은신 게임(Monaco 등)에 쓰임.</p>
    <p><b>단순한 방법</b>은 360°를 N등분해 레이를 쏘는 것. 이 방법에는 문제가 있음.</p>
    <ul>
    <li>다각형 꼭짓점이 벽 모서리와 맞지 않아 그림자 경계가 흔들림</li>
    <li>레이 간격보다 좁은 틈이나 멀리 있는 작은 기둥을 통째로 놓침</li>
    <li>N을 키워도 정확해지지 않고 비용만 늘어남</li>
    </ul>
    <p><b>끝점 캐스팅</b>은 시야 경계가 반드시 벽 선분의 끝점을 지난다는 점을 이용. 각 끝점 방향으로 <code>θ−ε, θ, θ+ε</code> 세 레이만 쏨.
    ±ε 레이는 모서리를 스쳐 뒤쪽 벽까지 날아가 그림자 경계를 만듦. 맞은 지점을 각도순으로 정렬하면 정확한 다각형이 됨.</p>
    <p>Red Blob Games의 글은 한 단계 더 나아가 각도 스윕(Sweep)으로 O(n log n)에 구함</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <text x="20" y="14" class="t-a">${L('A: 균일 레이 24개', 'A: 24 even rays')}</text>
    <text x="290" y="14" class="t-b">${L('B: 끝점 방향 3개씩', 'B: 3 rays per endpoint')}</text>
    ${[0, 270].map((ox) => `<rect x="${ox + 20}" y="20" width="230" height="150" class="d-dim" fill="none"/><rect x="${ox + 150}" y="60" width="40" height="40" class="f-dim"/>`).join('')}
    <polygon points="250,140 162,170 102,170 80,170 67,170 58,170 50,170 42,170 33,170 20,170 20,157 20,148 20,140 20,132 20,123 20,110 20,88 20,28 50,20 82,20 119,20 170,20 150,82 250,86" class="f-a" opacity="0.25"/>
    ${'250,140 162,170 102,170 80,170 67,170 58,170 50,170 42,170 33,170 20,170 20,157 20,148 20,140 20,132 20,123 20,110 20,88 20,28 50,20 82,20 119,20 170,20 150,82 250,86'.split(' ').map((p) => `<line x1="50" y1="140" x2="${p.split(',')[0]}" y2="${p.split(',')[1]}" class="d-a" opacity="0.45" stroke-width="1"/>`).join('')}
    <circle cx="50" cy="140" r="4" class="f-accent"/>
    <polygon points="520,91 460,100 420,100 420,60 458,20 290,20 290,170 520,170" class="f-b" opacity="0.2"/>
    ${[[458, 20], [420, 60], [420, 66], [441, 100], [460, 100], [520, 91]].map(([x, y]) => `<line x1="320" y1="140" x2="${x}" y2="${y}" class="d-b" stroke-width="1.2"/>`).join('')}
    <circle cx="420" cy="60" r="3" class="f-good"/><circle cx="460" cy="100" r="3" class="f-good"/>
    <circle cx="320" cy="140" r="4" class="f-accent"/>
    <text x="20" y="184" class="t-small t-dim">${L('모서리 사이로 지나가 그림자 경계가 어긋남', 'Rays miss the corners, so shadow edges drift')}</text>
    <text x="290" y="184" class="t-small t-dim">${L('θ-ε, θ, θ+ε: 하나는 모서리, 하나는 뒤 벽', 'θ-ε, θ, θ+ε: corner hit, and a ray past it')}</text>
  </svg>`,
  look: [
    'A에서 관찰자를 움직이면 그림자 경계가 톱니처럼 흔들리고 벽 모서리가 둥글게 깎임. B는 모서리가 정확함.',
    'A의 레이 수를 늘려도 먼 곳의 경계는 여전히 부정확함. "레이 표시"를 켜면 레이 간격이 보임.',
    '"보이는 적" 수치를 비교하면 B에서 보이는(빨강) 적을 A가 놓치는 경우가 보임',
    '"장애물 수"를 늘리면 B의 레이 수도 늘어남. B의 레이 수는 벽 끝점 수 × 3으로 정해짐.',
  ],
  refs: [
    { type: 'article', title: '2D Visibility (Red Blob Games, Amit Patel)', url: 'https://www.redblobgames.com/articles/visibility/', year: 2012, note: '각도 스윕 알고리즘과 인터랙티브 해설' },
    { type: 'article', title: 'Sight & Light (Nicky Case)', url: 'https://ncase.me/sight-and-light/', year: 2014, note: '끝점 ± 0.00001 rad 레이캐스팅 튜토리얼' },
    { type: 'game', title: "Monaco: What's Yours Is Mine (Pocketwatch Games)", year: 2013, note: '시야 다각형 기반 탑다운 은신 게임' },
  ],
  params: [
    { key: 'method', label: '방식', type: 'select', group: '레이캐스팅', options: [
      { value: 'uniform', label: '균일 레이 N개' },
      { value: 'endpoints', label: '끝점 ± ε' },
    ], a: 'uniform', b: 'endpoints' },
    { key: 'rays', label: '레이 수 N', type: 'int', min: 8, max: 2048, default: 90, when: (p) => p.method === 'uniform' },
    { key: 'eps', label: 'ε (rad)', type: 'range', min: 0.00001, max: 0.02, step: 0.00001, default: 0.0001, when: (p) => p.method === 'endpoints' },
    { key: 'showRays', label: '레이 표시', type: 'bool', default: true, group: '표시' },
    { key: 'boxes', label: '장애물 수', type: 'int', min: 2, max: 40, default: 12, shared: true, reset: true, group: '장면' },
    { key: 'pillars', label: '가는 기둥 수', type: 'int', min: 0, max: 40, default: 14, shared: true, reset: true },
    { key: 'enemies', label: '적 수', type: 'int', min: 0, max: 60, default: 25, shared: true, reset: true },
  ],
  en: {
    title: '2D Visibility Polygon (Endpoint Raycasting)',
    summary: 'To find the area that sight (or light) reaches, you can cast N rays in all directions. But this cuts corners and misses thin gaps. Cast rays only toward wall endpoints (±ε), and a few rays give an exact polygon.',
    views: { a: 'N uniform rays', b: 'Endpoint ± ε rays' },
    controls: 'Mouse: move the observer (moves on its own when outside the view)',
    info: `
    <p>A visibility polygon connects, in angle order, the wall points that the observer can see. It is used for shadows, fog of war, and sight-based stealth games (such as Monaco).</p>
    <p>The <b>simple method</b> splits 360° into N parts and casts a ray for each. This method has problems.</p>
    <ul>
    <li>Polygon vertices do not match wall corners, so shadow edges wobble.</li>
    <li>It completely misses gaps narrower than the ray spacing and small pillars far away.</li>
    <li>A bigger N does not make it exact. It only raises the cost.</li>
    </ul>
    <p><b>Endpoint casting</b> uses the fact that a sight boundary always passes through a wall segment endpoint. It casts only three rays toward each endpoint: <code>θ−ε, θ, θ+ε</code>.
    The ±ε rays graze the corner and fly on to the wall behind it. This forms the shadow edge. Sort the hit points by angle, and you get an exact polygon.</p>
    <p>The Red Blob Games article goes one step further. It uses an angle sweep to solve it in O(n log n).</p>`,
    look: [
      'Move the observer in A. Shadow edges wobble like saw teeth, and wall corners get rounded. B has exact corners.',
      'Raise the ray count in A. Far edges are still wrong. Turn on "Show rays" to see the ray spacing.',
      'Compare the "Visible enemies" value. Sometimes A misses enemies that B sees (red).',
      'Raise "Obstacle count". The ray count in B also rises. B uses wall endpoint count × 3 rays.',
    ],
    refs: [
      'Angle sweep algorithm with an interactive explanation.',
      'Tutorial on raycasting at endpoint ± 0.00001 rad.',
      'A top-down stealth game built on visibility polygons.',
    ],
    params: {
      method: { label: 'Method', group: 'Raycasting', options: { uniform: 'N uniform rays', endpoints: 'Endpoint ± ε' } },
      rays: 'Ray count N',
      showRays: { label: 'Show rays', group: 'Display' },
      boxes: { label: 'Obstacle count', group: 'Scene' },
      pillars: 'Thin pillar count',
      enemies: 'Enemy count',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    let segs = [], pts = [], enemies = [], W0 = 0, H0 = 0, t = 0;
    let obs = { x: 0, y: 0 };

    function build() {
      W0 = ctx.width; H0 = ctx.height;
      const r = U.rng(ctx.seed * 31 + 7);
      segs = [];
      const box = (x, y, w, h) => {
        const p = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
        for (let i = 0; i < 4; i++) segs.push([p[i][0], p[i][1], p[(i + 1) % 4][0], p[(i + 1) % 4][1]]);
      };
      box(1, 1, W0 - 2, H0 - 2);
      for (let i = 0; i < P.boxes; i++) {
        const w = r.range(20, W0 * 0.14), h = r.range(20, H0 * 0.18);
        box(r.range(10, W0 - w - 10), r.range(10, H0 - h - 10), w, h);
      }
      for (let i = 0; i < P.pillars; i++) { const s = r.range(3, 6); box(r.range(10, W0 - 20), r.range(10, H0 - 20), s, s); }
      // 고유 끝점
      const key = new Set(); pts = [];
      for (const s of segs) for (const [x, y] of [[s[0], s[1]], [s[2], s[3]]]) {
        const k = x.toFixed(2) + ',' + y.toFixed(2);
        if (!key.has(k)) { key.add(k); pts.push([x, y]); }
      }
      enemies = [];
      for (let i = 0; i < P.enemies; i++) enemies.push({ x: r.range(10, W0 - 10), y: r.range(10, H0 - 10), seen: false });
    }
    build();

    let tests = 0;
    // 레이(ox,oy,dx,dy)와 모든 선분 교차 → 가장 가까운 t
    function cast(ox, oy, dx, dy) {
      let best = Infinity;
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        const ex = s[2] - s[0], ey = s[3] - s[1];
        const den = dx * ey - dy * ex;
        tests++;
        if (Math.abs(den) < 1e-12) continue;
        const qx = s[0] - ox, qy = s[1] - oy;
        const tr = (qx * ey - qy * ex) / den, u = (qx * dy - qy * dx) / den;
        if (tr > 0 && u >= 0 && u <= 1 && tr < best) best = tr;
      }
      return best;
    }

    function computePoly() {
      tests = 0;
      const ox = obs.x, oy = obs.y, angles = [];
      if (P.method === 'uniform') {
        for (let i = 0; i < P.rays; i++) angles.push((i / P.rays) * Math.PI * 2);
      } else {
        for (const p of pts) {
          const a = Math.atan2(p[1] - oy, p[0] - ox);
          angles.push(a - P.eps, a, a + P.eps);
        }
      }
      const hits = [];
      for (const a of angles) {
        const dx = Math.cos(a), dy = Math.sin(a), tt = cast(ox, oy, dx, dy);
        if (tt === Infinity) continue;
        hits.push({ a: Math.atan2(dy, dx), x: ox + dx * tt, y: oy + dy * tt });
      }
      hits.sort((p, q) => p.a - q.a);
      return { hits, rays: angles.length };
    }

    function inPoly(poly, x, y) {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i], b = poly[j];
        if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
      }
      return inside;
    }
    // 실제 가시성 (정답): 적까지 선분이 벽과 교차하지 않으면 보임
    function trulyVisible(e) {
      const dx = e.x - obs.x, dy = e.y - obs.y, d = Math.hypot(dx, dy);
      const tt = cast(obs.x, obs.y, dx / d, dy / d);
      return tt >= d;
    }

    return {
      update(dt) {
        t += dt;
        const m = ctx.input.mouse;
        if (m.inside) { obs.x = m.x; obs.y = m.y; }
        else { obs.x = W0 * (0.5 + 0.38 * Math.cos(t * 0.27)); obs.y = H0 * (0.5 + 0.36 * Math.sin(t * 0.41)); }
      },
      resize() { build(); },
      render() {
        if (W0 !== ctx.width || H0 !== ctx.height) build();
        if (!obs.x && !obs.y) { obs.x = W0 / 2; obs.y = H0 / 2; }
        const g = ctx.g, col = ctx.side === 'a' ? C.a : C.b;
        const t0 = ctx.now();
        const { hits, rays } = computePoly();
        const ms = ctx.now() - t0;
        const savedTests = tests;
        g.fillStyle = '#07080b'; g.fillRect(0, 0, W0, H0);
        // 시야 다각형
        if (hits.length > 2) {
          const grad = g.createRadialGradient(obs.x, obs.y, 0, obs.x, obs.y, Math.max(W0, H0) * 0.8);
          grad.addColorStop(0, 'rgba(255,236,190,0.55)'); grad.addColorStop(1, 'rgba(255,236,190,0.06)');
          g.beginPath(); g.moveTo(hits[0].x, hits[0].y);
          for (const h of hits) g.lineTo(h.x, h.y);
          g.closePath(); g.fillStyle = grad; g.fill();
        }
        if (P.showRays) {
          g.strokeStyle = ctx.side === 'a' ? 'rgba(255,122,89,0.25)' : 'rgba(79,195,247,0.25)'; g.lineWidth = 1;
          g.beginPath();
          const step = Math.max(1, Math.floor(hits.length / 600));
          for (let i = 0; i < hits.length; i += step) { g.moveTo(obs.x, obs.y); g.lineTo(hits[i].x, hits[i].y); }
          g.stroke();
          if (hits.length < 900) for (const h of hits) D.circle(g, h.x, h.y, 2, col);
        }
        // 벽
        g.strokeStyle = '#c8cdd8'; g.lineWidth = 2; g.beginPath();
        for (const s of segs) { g.moveTo(s[0], s[1]); g.lineTo(s[2], s[3]); }
        g.stroke();
        // 적: 다각형 판정 vs 정답
        let seen = 0, truth = 0, wrong = 0;
        for (const e of enemies) {
          const inside = hits.length > 2 && inPoly(hits, e.x, e.y), real = trulyVisible(e);
          if (inside) seen++;
          if (real) truth++;
          if (inside !== real) wrong++;
          D.circle(g, e.x, e.y, 4, inside ? C.bad : '#3a3f4a', inside !== real ? C.warn : null, 2);
        }
        D.circle(g, obs.x, obs.y, 6, '#fff', col, 2);
        ctx.stat(GTL.L('레이 수', 'Rays'), rays);
        ctx.stat(GTL.L('선분 교차 검사', 'Segment intersection tests'), savedTests);
        ctx.stat(GTL.L('다각형 계산', 'Polygon compute'), ms.toFixed(2) + ' ms');
        ctx.stat(GTL.L('보이는 적 (정답)', 'Visible enemies (truth)'), `${seen} (${truth})`);
        ctx.stat(GTL.L('판정 오류 (노란 테두리)', 'Wrong results (yellow ring)'), wrong);
      },
    };
  },
});
