// 보이드 (Boids): 분리, 정렬, 응집
GTL.register({
  id: 'boids',
  title: '보이드 (Boids): 분리, 정렬, 응집',
  summary: '개체마다 주변 이웃만 보고 세 규칙(분리, 정렬, 응집)을 따르면, 전체가 무리 지어 남. 정렬 규칙 하나만 빼도 무리는 방향 없이 뭉쳐 웅성거리는 덩어리가 됨.',
  views: { a: '정렬 없음 (분리+응집)', b: '세 규칙 모두' },
  controls: '마우스: 포식자 ("포식자"를 켜면 보이드가 피함)',
  info: `
    <p>보이드(Boids)는 새 떼 같은 무리 움직임을 흉내 내는 모델(Craig Reynolds, 1987). 개체마다 <b>인지 반경</b>과 <b>시야각</b> 안의 이웃만 보고 세 힘을 더함.</p>
    <ul>
      <li><b>분리 (Separation)</b>: 너무 가까운 이웃에게서 멀어짐(거리에 반비례).</li>
      <li><b>정렬 (Alignment)</b>: 이웃의 평균 진행 방향에 맞춤.</li>
      <li><b>응집 (Cohesion)</b>: 이웃의 무게중심으로 향함.</li>
    </ul>
    <p>보이드 색은 진행 방향(색상환). 같은 색이 넓게 퍼져 있으면 정렬된 무리임.</p>
    <p>"극성(polarization)"은 모든 개체의 진행 방향 평균의 크기. 1이면 모두 같은 방향, 0이면 무질서.</p>
    <p>이웃을 단순 반복(O(n²))으로 찾으면 거리 검사가 개체 수의 제곱으로 늘어남.
    인지 반경 크기의 <b>균일 격자(공간 해시)</b>를 쓰면 주변 9칸만 보면 됨. 비용이 대략 O(n)으로 줄고 결과는 같음.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 214" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="bo-n" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="bo-c" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="bo-a" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="bo-b" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    </defs>
    <text x="10" y="16">${L('분리', 'Separation')}</text>
    <circle cx="92" cy="74" r="40" class="d-dim"/>
    <circle cx="92" cy="74" r="24" class="d-bad" stroke-dasharray="3 3"/>
    <line x1="92" y1="74" x2="73.7" y2="86.2" class="d-accent" marker-end="url(#bo-c)"/>
    <text x="188" y="16">${L('정렬', 'Alignment')}</text>
    <text x="250" y="16" class="t-small t-dim">${L('A는 가중치 0, B는 1', 'weight: A 0, B 1')}</text>
    <circle cx="270" cy="74" r="40" class="d-dim"/>
    <line x1="270" y1="74" x2="289.3" y2="56.6" class="d-b" marker-end="url(#bo-b)"/>
    <text x="366" y="16">${L('응집', 'Cohesion')}</text>
    <circle cx="414" cy="78" r="46" class="d-dim"/>
    <circle cx="451.3" cy="76.7" r="3" class="f-accent"/>
    <line x1="414" y1="78" x2="445" y2="77" class="d-accent" marker-end="url(#bo-c)"/>
    ${[[92, 74, 0, 1], [110, 62, 20], [64, 50, 10], [118, 100, -10], [270, 74, 0, 1], [244, 52, -40], [302, 60, -55], [292, 100, -30], [414, 78, 120, 1], [446, 50, 60], [458, 76, -90], [450, 104, -60]].map(([x, y, a, me]) => `<line x1="${x}" y1="${y}" x2="${(x + 14 * Math.cos(a * Math.PI / 180)).toFixed(1)}" y2="${(y + 14 * Math.sin(a * Math.PI / 180)).toFixed(1)}" class="${me ? 'd-line' : 'd-dim'}" marker-end="url(#bo-n)"/>`).join('')}
    <text x="10" y="132" class="t-small t-dim">${L('가까운 이웃에게서 멀어짐', 'move away from close ones')}</text>
    <text x="188" y="132" class="t-small t-dim">${L('이웃의 평균 방향에 맞춤', 'match the average heading')}</text>
    <text x="366" y="132" class="t-small t-dim">${L('이웃의 무게중심으로 향함', 'steer to their center')}</text>
    <line x1="4" y1="142" x2="536" y2="142" class="d-dim"/>
    <text x="10" y="162" class="t-a">${L('A: 분리 + 응집', 'A: separation + cohesion')}</text>
    <text x="10" y="178" class="t-small t-dim">${L('뭉치지만 방향이 제각각', 'clumps, but headings differ')}</text>
    <text x="10" y="192" class="t-small t-dim">${L('극성 낮음', 'low polarization')}</text>
    ${[[178, 158, 40], [205, 153, 200], [232, 160, 110], [186, 180, -60], [214, 178, 10], [244, 184, 250], [196, 200, 150], [230, 202, -70]].map(([x, y, a]) => `<line x1="${x}" y1="${y}" x2="${(x + 14 * Math.cos(a * Math.PI / 180)).toFixed(1)}" y2="${(y + 14 * Math.sin(a * Math.PI / 180)).toFixed(1)}" class="d-a" marker-end="url(#bo-a)"/>`).join('')}
    <text x="280" y="162" class="t-b">${L('B: 세 규칙 모두', 'B: all three rules')}</text>
    <text x="280" y="178" class="t-small t-dim">${L('같은 방향으로 함께 흐름', 'flows together in one heading')}</text>
    <text x="280" y="192" class="t-small t-dim">${L('극성 높음', 'high polarization')}</text>
    ${[[444, 158], [472, 154], [500, 160], [452, 180], [480, 178], [508, 182], [462, 200], [490, 198]].map(([x, y]) => `<line x1="${x}" y1="${y}" x2="${x + 13.5}" y2="${y - 3.6}" class="d-b" marker-end="url(#bo-b)"/>`).join('')}
  </svg>`,
  look: [
    '기본 상태로 실행하면 A(정렬 0)는 덩어리로 뭉치지만 방향이 제각각이라 색이 뒤섞임. B는 같은 색 무리가 함께 흐름. "극성"이 B 쪽이 높음.',
    '분리를 0으로 하면 한 점으로 뭉쳐 버림. 응집을 0으로 하면 무리가 쉽게 흩어짐.',
    '시야각을 360°에서 120°로 줄이면 뒤를 못 보게 되어 길게 늘어진 행렬이 생김.',
    '개체 수를 800으로 올리고 이웃 탐색을 "단순 반복"에서 "균일 격자"로 바꾸면 "거리 검사 / 프레임"이 크게 줄어듦.',
  ],
  refs: [
    { type: 'paper', title: 'Flocks, Herds, and Schools: A Distributed Behavioral Model', year: 1987, note: 'Craig W. Reynolds. SIGGRAPH 87.', url: 'https://doi.org/10.1145/37402.37406' },
    { type: 'article', title: 'Boids (Craig Reynolds)', url: 'https://www.red3d.com/cwr/boids/', note: '저자의 보이드 소개 페이지와 응용 사례.' },
    { type: 'game', title: 'Half-Life (Valve, 1998)', note: '새, 물고기 무리에 보이드 계열 기법을 쓴 사례로 자주 인용됨.' },
    { type: 'paper', title: 'Novel Type of Phase Transition in a System of Self-Driven Particles', year: 1995, note: 'Vicsek et al. PRL 75. 정렬 규칙과 극성(order parameter) 개념.', url: 'https://doi.org/10.1103/PhysRevLett.75.1226' },
  ],
  params: [
    { key: 'sep', label: '분리 가중치', type: 'range', min: 0, max: 4, step: 0.05, default: 1.5, group: '규칙' },
    { key: 'ali', label: '정렬 가중치', type: 'range', min: 0, max: 4, step: 0.05, default: 1, a: 0, b: 1 },
    { key: 'coh', label: '응집 가중치', type: 'range', min: 0, max: 4, step: 0.05, default: 1 },
    { key: 'radius', label: '인지 반경 (px)', type: 'range', min: 10, max: 150, step: 1, default: 55, group: '인지' },
    { key: 'sepRadius', label: '분리 반경 (px)', type: 'range', min: 4, max: 60, step: 1, default: 20 },
    { key: 'fov', label: '시야각 (°)', type: 'range', min: 30, max: 360, step: 5, default: 270 },
    { key: 'search', label: '이웃 탐색', type: 'select', options: [
      { value: 'brute', label: '단순 반복 O(n²)' }, { value: 'grid', label: '균일 격자 (공간 해시)' },
    ], default: 'grid' },
    { key: 'count', label: '개체 수', type: 'int', min: 20, max: 800, default: 250, shared: true, reset: true, group: '장면' },
    { key: 'maxSpeed', label: '최대 속도', type: 'range', min: 40, max: 400, step: 5, default: 160, shared: true },
    { key: 'predator', label: '포식자 (마우스)', type: 'bool', default: true, shared: true },
    { key: 'debug', label: '한 개체의 이웃 표시', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Boids: Separation, Alignment, Cohesion',
    summary: 'Each agent looks only at nearby neighbors and follows three rules (separation, alignment, cohesion). The whole group then flies as a flock. Remove just the alignment rule and the flock becomes a buzzing clump with no direction.',
    views: { a: 'No alignment (sep + coh)', b: 'All three rules' },
    controls: 'Mouse: predator (turn on "Predator" and the boids flee)',
    info: `
    <p>Boids is a model that imitates group motion like a flock of birds (Craig Reynolds, 1987). Each agent looks only at neighbors inside its <b>perception radius</b> and <b>field of view</b>, and adds three forces.</p>
    <ul>
      <li><b>Separation</b>: move away from neighbors that are too close (inversely proportional to distance).</li>
      <li><b>Alignment</b>: match the average heading of neighbors.</li>
      <li><b>Cohesion</b>: steer toward the center of mass of neighbors.</li>
    </ul>
    <p>Boid color shows heading (color wheel). A wide patch of the same color is an aligned flock.</p>
    <p>"Polarization" is the length of the average heading of all agents. 1 means all face the same way. 0 means disorder.</p>
    <p>If you find neighbors with a simple loop (O(n²)), distance checks grow with the square of the agent count.
    A <b>uniform grid (spatial hash)</b> with cells the size of the perception radius only needs the 9 nearby cells. The cost drops to about O(n) and the result is the same.</p>`,
    look: [
      'Run with defaults. A (alignment 0) forms clumps, but headings differ, so colors mix. In B, same-color flocks flow together. "Polarization" is higher in B.',
      'Set separation to 0 and the boids collapse into one point. Set cohesion to 0 and the flock breaks apart easily.',
      'Reduce field of view from 360° to 120°. Boids cannot see behind them, so long lines form.',
      'Raise the count to 800 and switch neighbor search from "Brute force" to "Uniform grid". "Distance checks / frame" drops a lot.',
    ],
    refs: ['Craig W. Reynolds. SIGGRAPH 87.', 'The author\'s boids page with examples of use.', 'Often cited as a game that used boid-style methods for birds and fish schools.', 'Vicsek et al. PRL 75. The alignment rule and polarization (order parameter).'],
    params: {
      sep: { label: 'Separation weight', group: 'Rules' },
      ali: 'Alignment weight',
      coh: 'Cohesion weight',
      radius: { label: 'Perception radius (px)', group: 'Perception' },
      sepRadius: 'Separation radius (px)',
      fov: 'Field of view (°)',
      search: { label: 'Neighbor search', options: { brute: 'Brute force O(n²)', grid: 'Uniform grid (spatial hash)' } },
      count: { label: 'Agent count', group: 'Scene' },
      maxSpeed: 'Max speed',
      predator: 'Predator (mouse)',
      debug: 'Show neighbors of one agent',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const n = P.count;
    const px = new Float32Array(n), py = new Float32Array(n), vx = new Float32Array(n), vy = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      px[i] = ctx.rng.range(0, ctx.width); py[i] = ctx.rng.range(0, ctx.height);
      const a = ctx.rng.range(0, U.TAU), s = ctx.rng.range(0.5, 1) * P.maxSpeed;
      vx[i] = Math.cos(a) * s; vy[i] = Math.sin(a) * s;
    }
    let checks = 0, avgNb = 0, polar = 0;
    const polarHist = [];
    const dbgNb = [];
    // 균일 격자
    let gcols = 1, grows = 1, head = new Int32Array(1);
    const next = new Int32Array(n);
    function buildGrid(cell) {
      gcols = Math.max(1, Math.floor(ctx.width / cell)); grows = Math.max(1, Math.floor(ctx.height / cell));
      if (head.length < gcols * grows) head = new Int32Array(gcols * grows);
      head.fill(-1, 0, gcols * grows);
      for (let i = 0; i < n; i++) {
        const cx = Math.min(gcols - 1, Math.floor((px[i] / ctx.width) * gcols)), cy = Math.min(grows - 1, Math.floor((py[i] / ctx.height) * grows));
        const c = cy * gcols + cx;
        next[i] = head[c]; head[c] = i;
      }
    }
    const ax = new Float32Array(n), ay = new Float32Array(n);

    return {
      update(dt) {
        const W = ctx.width, H = ctx.height, R = P.radius, R2 = R * R, SR2 = P.sepRadius * P.sepRadius;
        const cosHalf = Math.cos(U.rad(P.fov) / 2), full = P.fov >= 359;
        const grid = P.search === 'grid';
        if (grid) buildGrid(R);
        checks = 0; let nbSum = 0; dbgNb.length = 0;
        const m = ctx.input.mouse, pred = P.predator && m.inside;
        for (let i = 0; i < n; i++) {
          let cnt = 0, sx = 0, sy = 0, avx = 0, avy = 0, cx = 0, cy = 0;
          const sp = Math.hypot(vx[i], vy[i]) || 1, hx = vx[i] / sp, hy = vy[i] / sp;
          const visit = (j) => {
            if (j === i) return;
            checks++;
            let dx = px[j] - px[i], dy = py[j] - py[i];
            if (dx > W / 2) dx -= W; else if (dx < -W / 2) dx += W;
            if (dy > H / 2) dy -= H; else if (dy < -H / 2) dy += H;
            const d2 = dx * dx + dy * dy;
            if (d2 > R2 || d2 < 1e-6) return;
            const d = Math.sqrt(d2);
            if (!full && (dx * hx + dy * hy) / d < cosHalf) return;
            cnt++;
            if (i === 0 && P.debug) dbgNb.push(j);
            avx += vx[j]; avy += vy[j];
            cx += dx; cy += dy;
            if (d2 < SR2) { sx -= dx / d2 * P.sepRadius; sy -= dy / d2 * P.sepRadius; }
          };
          if (grid) {
            const gx = Math.min(gcols - 1, Math.floor((px[i] / W) * gcols)), gy = Math.min(grows - 1, Math.floor((py[i] / H) * grows));
            const span = gcols < 3 || grows < 3;
            if (span) for (let j = 0; j < n; j++) visit(j);
            else for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
              const c = ((gy + oy + grows) % grows) * gcols + ((gx + ox + gcols) % gcols);
              for (let j = head[c]; j >= 0; j = next[j]) visit(j);
            }
          } else for (let j = 0; j < n; j++) visit(j);
          nbSum += cnt;
          let fx = 0, fy = 0;
          const ms = P.maxSpeed;
          if (cnt) {
            // 정렬: 평균 속도로 / 응집: 중심으로 / 분리: 밀어내기 (모두 "원하는 속도 − 현재 속도" 형태)
            const al = Math.hypot(avx, avy) || 1;
            fx += (avx / al * ms - vx[i]) * P.ali;
            fy += (avy / al * ms - vy[i]) * P.ali;
            const cl = Math.hypot(cx, cy) || 1;
            fx += (cx / cl * ms - vx[i]) * P.coh * 0.6;
            fy += (cy / cl * ms - vy[i]) * P.coh * 0.6;
            fx += sx * ms * P.sep * 0.6; fy += sy * ms * P.sep * 0.6;
          }
          if (pred) {
            let dx = px[i] - m.x, dy = py[i] - m.y;
            const d = Math.hypot(dx, dy);
            if (d < 120 && d > 0.1) { fx += (dx / d) * ms * 8 * (1 - d / 120); fy += (dy / d) * ms * 8 * (1 - d / 120); }
          }
          ax[i] = fx * 1.2; ay[i] = fy * 1.2;
        }
        avgNb = nbSum / n;
        let mvx = 0, mvy = 0;
        for (let i = 0; i < n; i++) {
          vx[i] += ax[i] * dt; vy[i] += ay[i] * dt;
          let s = Math.hypot(vx[i], vy[i]);
          const ms = P.maxSpeed;
          if (s > ms) { vx[i] *= ms / s; vy[i] *= ms / s; s = ms; }
          if (s < ms * 0.4 && s > 1e-3) { vx[i] *= (ms * 0.4) / s; vy[i] *= (ms * 0.4) / s; s = ms * 0.4; }
          px[i] = U.wrap(px[i] + vx[i] * dt, 0, W); py[i] = U.wrap(py[i] + vy[i] * dt, 0, H);
          mvx += vx[i] / (s || 1); mvy += vy[i] / (s || 1);
        }
        polar = Math.hypot(mvx, mvy) / n;
        polarHist.push(polar); if (polarHist.length > 240) polarHist.shift();
      },
      render() {
        const g = ctx.g;
        if (P.debug && n) {
          const r = P.radius, a0 = Math.atan2(vy[0], vx[0]), half = U.rad(P.fov) / 2;
          g.beginPath();
          if (P.fov >= 359) g.arc(px[0], py[0], r, 0, U.TAU);
          else { g.moveTo(px[0], py[0]); g.arc(px[0], py[0], r, a0 - half, a0 + half); g.closePath(); }
          g.fillStyle = 'rgba(255,255,255,0.06)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1; g.stroke();
          D.circle(g, px[0], py[0], P.sepRadius, null, 'rgba(255,83,112,0.5)', 1);
          g.beginPath();
          for (const j of dbgNb) { g.moveTo(px[0], py[0]); g.lineTo(px[j], py[j]); }
          g.strokeStyle = 'rgba(255,255,255,0.4)'; g.stroke();
        }
        // 진행 방향 색으로 그리기 (색상 버킷별 일괄 path)
        const B = 12;
        for (let b = 0; b < B; b++) {
          g.beginPath();
          for (let i = 0; i < n; i++) {
            const a = Math.atan2(vy[i], vx[i]);
            const bi = Math.floor(((a + Math.PI) / U.TAU) * B) % B;
            if (bi !== b) continue;
            const c = Math.cos(a), s = Math.sin(a);
            g.moveTo(px[i] + c * 7, py[i] + s * 7);
            g.lineTo(px[i] - c * 4 - s * 3.5, py[i] - s * 4 + c * 3.5);
            g.lineTo(px[i] - c * 4 + s * 3.5, py[i] - s * 4 - c * 3.5);
            g.closePath();
          }
          g.fillStyle = U.hsl((b / B) * 360, 75, 62); g.fill();
        }
        if (P.debug && n) D.circle(g, px[0], py[0], 4, null, '#fff', 2);
        const m = ctx.input.mouse;
        if (P.predator && m.inside) D.circle(g, m.x, m.y, 120, null, 'rgba(255,83,112,0.35)', 1);
        D.plot(g, polarHist, ctx.width - 170, 10, 160, 40, { min: 0, max: 1, color: ctx.side === 'a' ? C.a : C.b, label: GTL.L('극성', 'Polarization') });
        ctx.stat(GTL.L('극성 (0=무질서, 1=정렬)', 'Polarization (0=disorder, 1=aligned)'), polar.toFixed(2));
        ctx.stat(GTL.L('평균 이웃 수', 'Avg neighbors'), avgNb.toFixed(1));
        ctx.stat(GTL.L('거리 검사 / 프레임', 'Distance checks / frame'), checks);
      },
    };
  },
});
