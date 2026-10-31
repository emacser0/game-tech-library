// 시야 판정: 거리 / 시야각 / 레이캐스트 LOS / 다중 레이캐스트 + 감지 게이지
GTL.register({
  id: 'vision-stealth',
  title: '시야 판정 & 잠입 감지 게이지',
  summary: '경비병이 플레이어를 "보는지" 판정하는 방식을 비교. 시야각만 보면 벽 너머도 보이는 버그가 생김. 몸의 여러 점에 레이를 쏴 가림을 확인하고 감지 게이지를 서서히 채우면 잠입 게임다운 판정이 됨.',
  views: { a: '시야각만 (벽 무시)', b: '시야각 + 다중 레이캐스트' },
  controls: '마우스를 뷰 위에 올리면 플레이어(초록)가 마우스를 따라감, 마우스가 뷰 밖에 있으면 자동 경로로 잠입',
  info: `
    <p>감지 판정은 값싼 검사부터 차례로 걸러 냄</p>
    <ol>
      <li><b>거리</b>: 감지 거리 밖이면 즉시 탈락</li>
      <li><b>시야각</b>: 정면 벡터와 대상 방향의 내적 ≥ cos(FOV/2)</li>
      <li><b>가시선(LOS)</b>: 눈에서 대상까지 레이캐스트해 벽에 막히는지 확인. 가장 비싼 검사라서 마지막에 함.</li>
      <li><b>다중 레이</b>: 중심만 검사하면 몸 절반이 모서리 밖으로 나와도 못 볼 수 있음. 반대로 중심만 보이면 몸 대부분이 가려져도 발각됨.
      그래서 머리, 몸통, 좌우 끝 등 여러 점에 레이를 쏴 <b>보이는 비율</b>을 구함.</li>
    </ol>
    <p>판정 결과를 바로 "발각"으로 쓰지 않음. 대신 <b>감지 게이지</b>에 쌓음.</p>
    <ul>
      <li>가까울수록, 정면일수록, 많이 보일수록 빨리 참</li>
      <li>안 보이면 서서히 줄어듦</li>
      <li>30%를 넘으면 <b>의심</b>(마지막 위치를 쳐다봄)</li>
      <li>100%가 되면 <b>발각</b>(추격)</li>
    </ul>
    <p>Splinter Cell, Metal Gear Solid, Thief 등 잠입 게임의 공통 구조</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 222" xmlns="http://www.w3.org/2000/svg">
    <text x="8" y="14" class="t-a">${L('A: 시야각만 (벽 무시)', 'A: view cone only')}</text>
    <path d="M30,92 L227,20 A210,210 0 0 1 227,164 Z" class="d-a" stroke-dasharray="4 3"/>
    <rect x="118" y="56" width="16" height="72" class="f-dim"/>
    <line x1="30" y1="92" x2="169" y2="94" class="d-a"/>
    <circle cx="178" cy="94" r="9" class="f-good"/>
    <text x="178" y="120" text-anchor="middle" class="t-small t-a">${L('감지됨', 'detected')}</text>
    <circle cx="30" cy="92" r="6" class="f-a"/>
    <text x="8" y="182" class="t-small t-a">${L('콘 안이면 벽 뒤도 보임 (1.0)', 'Inside the cone means seen, even behind a wall')}</text>
    <line x1="268" y1="6" x2="268" y2="188" class="d-dim"/>
    <text x="280" y="14" class="t-b">${L('B: 시야각 + 다중 레이', 'B: view cone + multiple rays')}</text>
    <path d="M300,90 L497,18 A210,210 0 0 1 497,162 Z" class="d-b" stroke-dasharray="4 3"/>
    <rect x="390" y="34" width="16" height="62" class="f-dim"/>
    <text x="398" y="28" text-anchor="middle" class="t-small">${L('막힘', 'blocked')}</text>
    <circle cx="452" cy="99" r="17" class="d-dim"/>
    <line x1="300" y1="90" x2="390" y2="85.3" class="d-bad"/><circle cx="452" cy="82" r="2.5" class="f-bad"/>
    <line x1="300" y1="90" x2="390" y2="91.8" class="d-bad"/><circle cx="452" cy="93" r="2.5" class="f-bad"/>
    <line x1="300" y1="90" x2="452" y2="104" class="d-good"/><circle cx="452" cy="104" r="2.5" class="f-good"/>
    <line x1="300" y1="90" x2="452" y2="116" class="d-good"/><circle cx="452" cy="116" r="2.5" class="f-good"/>
    <line x1="300" y1="90" x2="444" y2="104" class="d-good"/><circle cx="444" cy="104" r="2.5" class="f-good"/>
    <circle cx="300" cy="90" r="6" class="f-b"/>
    <text x="452" y="134" text-anchor="middle" class="t-small">${L('몸의 5점에 레이', 'rays to 5 body points')}</text>
    <text x="280" y="182" class="t-small t-b">${L('보이는 비율 3/5 = 0.6', 'Visible ratio 3/5 = 0.6')}</text>
    <text x="8" y="204">${L('게이지', 'Meter')}</text>
    <rect x="70" y="196" width="460" height="8" class="f-dim"/>
    <rect x="70" y="196" width="253" height="8" class="f-b"/>
    <line x1="208" y1="192" x2="208" y2="208" class="d-accent"/>
    <line x1="530" y1="192" x2="530" y2="208" class="d-accent"/>
    <text x="208" y="218" text-anchor="middle" class="t-small t-dim">${L('30% 의심', '30% suspicious')}</text>
    <text x="370" y="218" text-anchor="middle" class="t-small t-dim">${L('보이는 비율 × 근접도만큼 참', 'fills by visible ratio × closeness')}</text>
    <text x="530" y="218" text-anchor="end" class="t-small t-dim">${L('100% 발각', '100% detected')}</text>
  </svg>`,
  look: [
    '마우스를 뷰 밖에 두면 A는 플레이어가 벽 뒤에 숨어도 시야각 안이면 게이지가 참. B는 벽이 시야를 정확히 자름.',
    'B를 지켜보면 시야 다각형(레이 팬)이 벽 모서리에서 잘리고, 플레이어 몸에 초록/빨강 레이가 꽂힘',
    '플레이어를 벽 모서리에 반쯤 걸치게 두면 "보이는 비율"이 0.25~0.75 사이로 바뀌고 게이지가 천천히 참',
    'B의 판정 방식을 "시야각 + 중심 1개 레이"로 바꾸면 몸 절반이 보여도 감지하지 못할 때가 생김',
  ],
  refs: [
    { type: 'talk', title: 'Modeling AI Perception and Awareness in Splinter Cell: Blacklist', year: 2014, note: 'Martin Walsh, GDC 2014. 시야 레이캐스트 지점, 감지 게이지, 주변시 설계.' },
    { type: 'book', title: 'Artificial Intelligence for Games (3rd ed.)', year: 2019, note: 'Ian Millington. 감각 관리(Sense Management) 장.' },
    { type: 'article', title: '2D Visibility (Red Blob Games)', url: 'https://www.redblobgames.com/articles/visibility/', year: 2012, note: 'Amit Patel. 레이/각도 스윕 기반 시야 다각형.' },
    { type: 'engine', title: 'Unreal Engine - AI Perception (AISense_Sight)', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/ai-perception-in-unreal-engine', note: '시야 반경, 주변시 각도, LOS 트레이스' },
  ],
  params: [
    { key: 'check', label: '판정 방식', type: 'select', group: '판정', options: [
      { value: 'radius', label: '거리만' },
      { value: 'cone', label: '거리 + 시야각 (벽 무시)' },
      { value: 'los1', label: '시야각 + 중심 1개 레이' },
      { value: 'multi', label: '시야각 + 다중 레이 (5점)' },
    ], a: 'cone', b: 'multi' },
    { key: 'fov', label: '시야각 (°)', type: 'range', min: 20, max: 180, step: 1, default: 80 },
    { key: 'range', label: '감지 거리', type: 'range', min: 80, max: 450, step: 5, default: 260 },
    { key: 'gain', label: '게이지 상승 속도', type: 'range', min: 0.1, max: 3, step: 0.05, default: 1 },
    { key: 'rays', label: '시야 다각형 레이 수', type: 'int', min: 8, max: 240, default: 90, help: '그리기용 레이 팬' },
    { key: 'playerSpeed', label: '플레이어 속도', type: 'range', min: 30, max: 250, step: 5, default: 95, shared: true, group: '장면' },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Line of Sight & Stealth Detection Meter',
    summary: 'Compares ways to decide whether a guard "sees" the player. Checking only the view cone causes a bug where the guard sees through walls. Casting rays at several points on the body checks for cover. Filling a detection meter slowly gives stealth game style detection.',
    views: { a: 'View cone only (ignores walls)', b: 'View cone + multiple raycasts' },
    controls: 'Move the mouse over a view and the player (green) follows it. When the mouse is outside the view, the player sneaks along a set route.',
    info: `
    <p>Detection filters with the cheapest checks first.</p>
    <ol>
      <li><b>Distance</b>: outside the detection range, the target fails at once.</li>
      <li><b>View cone</b>: the dot product of the facing vector and the direction to the target ≥ cos(FOV/2).</li>
      <li><b>Line of sight (LOS)</b>: raycast from the eye to the target and check whether a wall blocks it. This is the most expensive check, so it runs last.</li>
      <li><b>Multiple rays</b>: if you check only the center, the guard may miss a player whose half body sticks out past a corner. And if only the center is visible, the player is caught even when most of the body is hidden.
      So cast rays at several points (head, torso, left and right edges) and compute the <b>visible ratio</b>.</li>
    </ol>
    <p>The result does not mean "detected" right away. It fills a <b>detection meter</b> instead.</p>
    <ul>
      <li>It fills faster when the player is closer, more in front, and more visible.</li>
      <li>When the player is hidden, it drains slowly.</li>
      <li>Above 30%, the guard becomes <b>suspicious</b> (looks at the last position).</li>
      <li>At 100%, the guard <b>detects</b> the player (chases).</li>
    </ul>
    <p>This is the common structure of stealth games such as Splinter Cell, Metal Gear Solid and Thief.</p>`,
    look: [
      'Keep the mouse outside the view. In A, the meter fills whenever the player is inside the view cone, even behind a wall. In B, walls cut the view exactly.',
      'Watch B. The view polygon (ray fan) is cut at wall corners, and green or red rays hit the player\'s body.',
      'Put the player half behind a wall corner. "Visible ratio" changes between 0.25 and 0.75, and the meter fills slowly.',
      'Switch B to "View cone + 1 center ray". Sometimes the guard misses the player even when half the body is visible.',
    ],
    refs: [
      'Martin Walsh, GDC 2014. Sight raycast points, detection meter, and peripheral vision design.',
      'Ian Millington. Chapter on sense management.',
      'Amit Patel. View polygons built with rays and angle sweeps.',
      'Sight radius, peripheral vision angle, LOS trace.',
    ],
    params: {
      check: { label: 'Check method', group: 'Detection', options: { radius: 'Distance only', cone: 'Distance + view cone (ignores walls)', los1: 'View cone + 1 center ray', multi: 'View cone + multiple rays (5 points)' } },
      fov: 'Field of view (°)',
      range: 'Detection range',
      gain: 'Meter fill speed',
      rays: { label: 'View polygon rays', help: 'Ray fan used for drawing' },
      playerSpeed: { label: 'Player speed', group: 'Scene' },
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, V = U.v2, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 800, WH = 500, PR = 10;
    // 고정 벽 + 시드 상자
    // 위쪽 복도 = 경비 순찰, 아래쪽 = 플레이어 잠입로. 가운데 벽 두 개 사이에 틈이 있음.
    const walls = [
      { x: 130, y: 220, w: 230, h: 24 }, { x: 440, y: 220, w: 230, h: 24 },
      { x: 300, y: 60, w: 30, h: 40 }, { x: 560, y: 150, w: 30, h: 40 },
    ];
    const rng = U.rng(ctx.seed * 11 + 2);
    for (let i = 0; i < 5; i++) walls.push({ x: rng.range(80, 680), y: rng.range(320, 400), w: rng.range(24, 50), h: rng.range(24, 44) });
    const patrol = [V(90, 130), V(710, 130), V(710, 185), V(90, 185)];
    const sneak = [V(60, 262), V(740, 262), V(745, 465), V(55, 465)];

    let exposed = 0, guard, player, meter, state, lastSeen, detections, vis, rayCount, fanPts, bodyRays, sneakI;
    function init() {
      guard = { p: V(90, 130), dir: 0, wp: 1, sweep: 0 };
      player = { p: V(380, 262) }; sneakI = 1;
      meter = 0; state = 0; lastSeen = null; detections = 0; exposed = 0; vis = 0; rayCount = 0; fanPts = []; bodyRays = [];
    }
    init();

    // 레이 vs AABB (slab). 반환: 충돌 t (0..1) 또는 Infinity
    function rayBox(ax, ay, dx, dy, b) {
      let t0 = 0, t1 = 1;
      for (const [o, d, mn, mx] of [[ax, dx, b.x, b.x + b.w], [ay, dy, b.y, b.y + b.h]]) {
        if (Math.abs(d) < 1e-9) { if (o < mn || o > mx) return Infinity; continue; }
        let ta = (mn - o) / d, tb = (mx - o) / d;
        if (ta > tb) [ta, tb] = [tb, ta];
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
        if (t0 > t1) return Infinity;
      }
      return t0;
    }
    function raycast(a, b) {
      rayCount++;
      const dx = b.x - a.x, dy = b.y - a.y;
      let t = 1;
      for (const w of walls) { const h = rayBox(a.x, a.y, dx, dy, w); if (h < t) t = h; }
      return t;
    }
    function collide(p, r) {
      for (const w of walls) {
        const cx = U.clamp(p.x, w.x, w.x + w.w), cy = U.clamp(p.y, w.y, w.y + w.h);
        const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy);
        if (d < r) {
          if (d > 1e-6) { p.x = cx + (dx / d) * r; p.y = cy + (dy / d) * r; }
          else p.y = w.y - r;
        }
      }
      p.x = U.clamp(p.x, r, WW - r); p.y = U.clamp(p.y, r, WH - r);
    }
    const view = () => { const s = Math.min(ctx.width / WW, ctx.height / WH); return { s, ox: (ctx.width - WW * s) / 2, oy: (ctx.height - WH * s) / 2 }; };

    // 감지: 0..1 가시도
    function sense() {
      const eye = guard.p, to = V.sub(player.p, eye), d = V.len(to);
      bodyRays = [];
      if (d > P.range) return 0;
      if (P.check === 'radius') return 1;
      const f = V.fromAngle(guard.dir);
      const ang = Math.acos(U.clamp(V.dot(f, V.scale(to, 1 / (d || 1))), -1, 1));
      if (ang > U.rad(P.fov) / 2) return 0;
      if (P.check === 'cone') return 1;
      const side = V.scale(V.perp(V.norm(to)), PR * 0.9);
      const pts = P.check === 'los1' ? [player.p] : [player.p, V.add(player.p, side), V.sub(player.p, side), V.add(player.p, V.scale(V.norm(to), -PR * 0.8)), V.add(player.p, V.scale(V.norm(to), PR * 0.6))];
      let seen = 0;
      for (const q of pts) {
        const t = raycast(eye, q);
        const ok = t >= 0.999;
        if (ok) seen++;
        bodyRays.push({ q, ok, hit: V.lerp(eye, q, t) });
      }
      return seen / pts.length;
    }

    return {
      update(dt) {
        rayCount = 0;
        // ── 플레이어 ──
        const m = ctx.input.mouse, vw = view();
        let tgt;
        if (m.inside) tgt = V((m.x - vw.ox) / vw.s, (m.y - vw.oy) / vw.s);
        else {
          tgt = sneak[sneakI];
          if (V.dist(player.p, tgt) < 8) { sneakI = (sneakI + 1) % sneak.length; tgt = sneak[sneakI]; }
        }
        const to = V.sub(tgt, player.p), dl = V.len(to);
        if (dl > 1) player.p = V.add(player.p, V.scale(to, Math.min(dl, P.playerSpeed * dt) / dl));
        collide(player.p, PR);

        // ── 감지 ──
        vis = sense();
        const d = V.dist(guard.p, player.p);
        if (vis > 0) {
          exposed += dt;
          const closeness = 1 - U.clamp(d / P.range, 0, 1);
          meter += dt * P.gain * vis * (0.25 + 1.6 * closeness * closeness);
          lastSeen = V(player.p.x, player.p.y);
        } else meter -= dt * (state === 2 ? 0.12 : 0.25);
        meter = U.clamp(meter, 0, 1);
        const prev = state;
        state = meter >= 1 ? 2 : state === 2 && meter > 0.5 ? 2 : meter >= 0.3 ? 1 : 0;
        if (state === 2 && prev !== 2) detections++;

        // ── 경비병 ──
        const g = guard;
        let goal = null, speed = 70, faceTo = null;
        if (state === 2 && lastSeen) { goal = lastSeen; speed = 115; faceTo = lastSeen; }
        else if (state === 1 && lastSeen) { faceTo = lastSeen; speed = 0; }
        else {
          goal = patrol[g.wp];
          if (V.dist(g.p, goal) < 6) { g.wp = (g.wp + 1) % patrol.length; goal = patrol[g.wp]; }
        }
        if (goal && speed > 0) {
          const v = V.sub(goal, g.p), l = V.len(v);
          if (l > 2) g.p = V.add(g.p, V.scale(v, Math.min(l, speed * dt) / l));
          collide(g.p, 11);
          if (!faceTo) faceTo = goal;
        }
        g.sweep += dt;
        if (faceTo) {
          const want = V.angle(V.sub(faceTo, g.p)) + (state === 0 ? Math.sin(g.sweep * 1.3) * 0.35 : 0);
          g.dir = U.lerpAngle(g.dir, want, 1 - Math.exp(-5 * dt));
        }

        // ── 시야 다각형 (그리기용 레이 팬) ──
        fanPts = [g.p];
        if (P.check === 'los1' || P.check === 'multi') {
          const half = U.rad(P.fov) / 2;
          for (let k = 0; k <= P.rays; k++) {
            const a = g.dir - half + (k / P.rays) * half * 2;
            const e = V.add(g.p, V.fromAngle(a, P.range));
            fanPts.push(V.lerp(g.p, e, raycast(g.p, e)));
          }
        }
      },
      onAction() { init(); },
      render() {
        const gg = ctx.g, vw = view(), s = vw.s;
        const X = (p) => ({ x: vw.ox + p.x * s, y: vw.oy + p.y * s });
        D.rect(gg, vw.ox, vw.oy, WW * s, WH * s, '#181b21', 'rgba(255,255,255,0.1)');
        const g = guard, gp = X(g.p);
        const stCol = state === 2 ? C.bad : state === 1 ? C.warn : 'rgba(255,255,255,1)';
        const fill = state === 2 ? 'rgba(255,83,112,0.18)' : state === 1 ? 'rgba(255,203,107,0.16)' : 'rgba(255,255,255,0.09)';
        // 시야 영역
        if (P.check === 'radius') D.circle(gg, gp.x, gp.y, P.range * s, fill, 'rgba(255,255,255,0.25)', 1);
        else if (P.check === 'cone') {
          gg.beginPath(); gg.moveTo(gp.x, gp.y);
          gg.arc(gp.x, gp.y, P.range * s, g.dir - U.rad(P.fov) / 2, g.dir + U.rad(P.fov) / 2); gg.closePath();
          gg.fillStyle = fill; gg.fill(); gg.strokeStyle = 'rgba(255,255,255,0.25)'; gg.lineWidth = 1; gg.stroke();
        } else D.poly(gg, fanPts.map(X), fill, 'rgba(255,255,255,0.25)', 1);
        // 벽
        for (const w of walls) D.rect(gg, vw.ox + w.x * s, vw.oy + w.y * s, w.w * s, w.h * s, '#4a5263', '#000');
        // 순찰 경로
        gg.setLineDash([3, 5]);
        D.poly(gg, patrol.map(X), null, 'rgba(255,255,255,0.12)', 1, true);
        gg.setLineDash([]);
        // 몸 레이
        for (const r of bodyRays) {
          const h = X(r.hit), q = X(r.q);
          D.line(gg, gp.x, gp.y, h.x, h.y, r.ok ? 'rgba(102,209,122,0.8)' : 'rgba(255,83,112,0.8)', 1);
          D.circle(gg, q.x, q.y, 2.5, r.ok ? C.good : C.bad);
        }
        if (lastSeen && state > 0) { const l = X(lastSeen); D.circle(gg, l.x, l.y, 6, null, C.warn, 1.5); }
        // 플레이어 & 경비병
        const pp = X(player.p);
        D.circle(gg, pp.x, pp.y, PR * s, C.good, '#000', 1.5);
        D.circle(gg, gp.x, gp.y, 11 * s, ctx.side === 'a' ? C.a : C.b, '#000', 1.5);
        D.arrow(gg, gp.x, gp.y, gp.x + Math.cos(g.dir) * 22 * s, gp.y + Math.sin(g.dir) * 22 * s, '#fff', 2, 6);
        // 게이지
        const bw = 44 * s, bx = gp.x - bw / 2, by = gp.y - 26 * s;
        D.rect(gg, bx, by, bw, 5, 'rgba(0,0,0,0.6)');
        D.rect(gg, bx, by, bw * meter, 5, stCol);
        D.text(gg, state === 2 ? '!' : state === 1 ? '?' : '', gp.x, by - 16, { align: 'center', size: 15, color: stCol });

        ctx.stat(GTL.L('보이는 비율', 'Visible ratio'), vis.toFixed(2));
        ctx.stat(GTL.L('감지 게이지', 'Detection meter'), (meter * 100).toFixed(0) + ' %');
        ctx.stat(GTL.L('상태', 'State'), [GTL.L('평온', 'Calm'), GTL.L('의심', 'Suspicious'), GTL.L('발각!', 'Detected!')][state]);
        ctx.stat(GTL.L('발각 횟수', 'Detections'), detections);
        ctx.stat(GTL.L('보인 시간 누적', 'Total time seen'), exposed.toFixed(1) + ' s');
        ctx.stat(GTL.L('레이캐스트 / 프레임', 'Raycasts / frame'), rayCount);
      },
    };
  },
});
