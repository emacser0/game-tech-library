// 감각 기억: 시야에서 사라지면 즉시 포기 vs 마지막으로 본 위치 추적
GTL.register({
  id: 'last-known-position',
  title: '감각 기억: 마지막으로 본 위치 추적',
  summary: '플레이어가 기둥 뒤로 숨었을 때 경비병의 반응을 비교. 보이지 않는 순간 잊으면 기둥 하나로 쉽게 따돌림. 마지막으로 본 위치(LKP)를 기억하고 가서 둘러보면 모퉁이 너머의 플레이어를 다시 찾음.',
  views: { a: '즉시 포기', b: '마지막 위치 기억 + 수색' },
  controls: '마우스를 뷰 위에 올리면 플레이어(초록)가 마우스를 따라감, 뷰 밖에 있으면 자동으로 움직임 (발각되면 가까운 기둥 뒤로 숨음)',
  info: `
    <p><b>감각 기억</b>: AI가 감각으로 얻은 정보를 잠시 저장해 두는 것. 사람은 눈을 감아도 방금 본 물체가 거기 있다고 믿음. 이를 대상 지속성(object persistence)이라 부름.</p>
    <p>기억이 없으면 판단은 "지금 보이는가"뿐임. 플레이어가 기둥 뒤로 한 걸음만 가도 경비병은 순찰로 돌아감. 플레이어 눈에는 멍청해 보임.</p>
    <p>기억을 넣는 방법:</p>
    <ul>
      <li><b>마지막으로 본 위치(LKP, Last Known Position)</b>: 시야에서 사라진 지점을 저장. 그곳까지 가서 수색 시간 동안 둘러봄.</li>
      <li><b>예측 위치</b>: LKP에 마지막 속도 × 예측 시간을 더함. 도망간 방향으로 앞서 감.</li>
      <li>시간이 지나면 기억을 버림. 수색이 끝나면 순찰로 돌아감.</li>
    </ul>
    <p>단점: 수색이 너무 길거나 예측이 정확하면 플레이어가 숨을 곳이 없어 답답함. 수색 시간은 난이도 조절 값으로 씀.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 206" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="lkp-n" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="lkp-a" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="lkp-b" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    </defs>
    <text x="8" y="14" class="t-a">${L('A: 기억 없음', 'A: no memory')}</text>
    <rect x="30" y="30" width="70" height="24" rx="4" class="f-dim"/><text x="65" y="46" text-anchor="middle">${L('순찰', 'Patrol')}</text>
    <rect x="180" y="30" width="70" height="24" rx="4" class="f-dim"/><text x="215" y="46" text-anchor="middle">${L('추격', 'Chase')}</text>
    <line x1="100" y1="37" x2="178" y2="37" class="d-line" marker-end="url(#lkp-n)"/>
    <text x="140" y="31" text-anchor="middle" class="t-small">${L('보임', 'seen')}</text>
    <line x1="180" y1="48" x2="102" y2="48" class="d-a" marker-end="url(#lkp-a)"/>
    <text x="140" y="68" text-anchor="middle" class="t-small t-a">${L('안 보이면 즉시 포기', 'lost sight: give up at once')}</text>
    <rect x="400" y="20" width="40" height="40" class="f-dim"/>
    <line x1="325" y1="41" x2="418" y2="70" class="d-dim" stroke-dasharray="3 3"/>
    <line x1="425" y1="72" x2="470" y2="45" class="d-dim" stroke-dasharray="3 3"/>
    <circle cx="320" cy="40" r="5" class="f-b"/>
    <text x="320" y="28" text-anchor="middle" class="t-small t-dim">${L('경비병', 'guard')}</text>
    <circle cx="425" cy="72" r="7" class="d-b"/><text x="425" y="76" text-anchor="middle" class="t-small t-b">?</text>
    <text x="425" y="91" text-anchor="middle" class="t-small t-b">LKP</text>
    <circle cx="458" cy="52" r="7" class="d-b" stroke-dasharray="3 2"/>
    <text x="482" y="70" class="t-small t-dim">${L('예측 위치', 'predicted')}</text>
    <circle cx="472" cy="44" r="5" class="f-good"/>
    <text x="472" y="32" text-anchor="middle" class="t-small t-dim">${L('플레이어', 'player')}</text>
    <text x="8" y="96" class="t-b">${L('B: LKP 기억 + 수색', 'B: remember LKP + search')}</text>
    <rect x="30" y="108" width="70" height="24" rx="4" class="f-dim"/><text x="65" y="124" text-anchor="middle">${L('순찰', 'Patrol')}</text>
    <rect x="150" y="108" width="70" height="24" rx="4" class="f-dim"/><text x="185" y="124" text-anchor="middle">${L('추격', 'Chase')}</text>
    <rect x="270" y="108" width="90" height="24" rx="4" class="f-dim"/><text x="315" y="124" text-anchor="middle">${L('LKP로 이동', 'Go to LKP')}</text>
    <rect x="410" y="108" width="70" height="24" rx="4" class="f-dim"/><text x="445" y="124" text-anchor="middle">${L('수색', 'Search')}</text>
    <line x1="100" y1="114" x2="148" y2="114" class="d-line" marker-end="url(#lkp-n)"/>
    <text x="124" y="104" text-anchor="middle" class="t-small">${L('보임', 'seen')}</text>
    <line x1="220" y1="114" x2="268" y2="114" class="d-b" marker-end="url(#lkp-b)"/>
    <text x="245" y="104" text-anchor="middle" class="t-small t-b">${L('놓침: LKP 저장', 'lost: save LKP')}</text>
    <line x1="360" y1="114" x2="408" y2="114" class="d-b" marker-end="url(#lkp-b)"/>
    <text x="384" y="104" text-anchor="middle" class="t-small t-b">${L('도착', 'arrived')}</text>
    <line x1="270" y1="126" x2="222" y2="126" class="d-line" marker-end="url(#lkp-n)"/>
    <text x="245" y="143" text-anchor="middle" class="t-small">${L('다시 보임', 'seen again')}</text>
    <path d="M445,132 L445,154 L65,154 L65,134" class="d-b" marker-end="url(#lkp-b)"/>
    <text x="255" y="167" text-anchor="middle" class="t-small t-b">${L('수색 시간 끝: 포기', 'search time over: give up')}</text>
    <text x="8" y="186" class="t-small t-dim">${L('이동, 수색 중 다시 보이면 추격. 대부분 LKP로 가는 도중 모퉁이 너머를 보고 다시 찾음', 'Seen again while moving or searching: chase. Most re-finds happen on the way to the LKP.')}</text>
    <text x="8" y="201" class="t-small t-dim">${L('예측 위치 = LKP + 마지막 속도 × 예측 시간', 'Predicted position = LKP + last velocity × prediction time')}</text>
  </svg>`,
  look: [
    '자동 모드로 두면 A는 플레이어가 기둥 뒤로 숨는 순간 "포기". B는 물음표(LKP)로 가서 모퉁이 너머를 다시 봄. "다시 찾은 횟수"와 "잡은 횟수"가 B 쪽이 큼.',
    'B를 "예측 위치"로 바꾸면 수색 지점(점선 원)이 도망간 방향으로 앞섬. 예측 시간을 크게 하면 엉뚱한 곳을 수색하기도 함.',
    'B의 "수색 시간"을 0.5초로 줄여도 "다시 찾은 횟수"는 조금만 줄어듦. 대부분 LKP로 가는 도중에 모퉁이 너머를 보고 다시 찾음. 수색 시간보다 기억한 위치가 더 중요함.',
    '마우스로 직접 숨어 보면 A는 기둥 하나로 따돌릴 수 있음. B는 숨은 뒤 다른 쪽으로 빠져나가야 함.',
  ],
  refs: [
    { type: 'paper', title: 'Object Persistence for Synthetic Creatures', year: 2002, note: 'Damian Isla, Bruce Blumberg. AAMAS 2002. 보이지 않는 대상의 위치를 믿음으로 유지하고 예측.' },
    { type: 'book', title: 'Probabilistic Target Tracking and Search Using Occupancy Maps', year: 2006, note: 'Damian Isla. AI Game Programming Wisdom 3. 놓친 대상의 위치를 확률 지도로 추적.' },
    { type: 'talk', title: 'Modeling AI Perception and Awareness in Splinter Cell: Blacklist', year: 2014, note: 'Martin Walsh, GDC 2014. 마지막으로 본 위치와 수색 행동.' },
    { type: 'engine', title: 'Unreal Engine - AI Perception', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/ai-perception-in-unreal-engine', note: '자극(stimulus)의 Max Age로 감각 기억 유지 시간 지정' },
  ],
  params: [
    { key: 'memory', label: '감각 기억', type: 'select', group: '경비병', options: [
      { value: 'none', label: '없음 (보이지 않으면 즉시 포기)' },
      { value: 'lkp', label: '마지막으로 본 위치 (LKP)' },
      { value: 'predict', label: '예측 위치 (LKP + 속도 × 시간)' },
    ], a: 'none', b: 'lkp' },
    { key: 'search', label: '수색 시간 (s)', type: 'range', min: 0.5, max: 8, step: 0.1, default: 3.5, when: (p) => p.memory !== 'none' },
    { key: 'predict', label: '예측 시간 (s)', type: 'range', min: 0.2, max: 3, step: 0.1, default: 0.8, when: (p) => p.memory === 'predict' },
    { key: 'fov', label: '시야각 (°)', type: 'range', min: 40, max: 180, step: 5, default: 100, shared: true },
    { key: 'range', label: '시야 거리', type: 'range', min: 100, max: 450, step: 10, default: 280, shared: true },
    { key: 'guardSpeed', label: '경비병 속도', type: 'range', min: 40, max: 200, step: 5, default: 105, shared: true },
    { key: 'playerSpeed', label: '플레이어 속도', type: 'range', min: 40, max: 200, step: 5, default: 95, shared: true, group: '장면' },
    { key: 'simSpeed', label: '시뮬레이션 배속', type: 'range', min: 0.5, max: 5, step: 0.5, default: 1.5, shared: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Sensory Memory: Tracking the Last Known Position',
    summary: 'Compares how a guard reacts when the player hides behind a pillar. If the guard forgets the moment it loses sight, one pillar is enough to escape. If it remembers the last known position (LKP), goes there and looks around, it finds the player again past the corner.',
    views: { a: 'Give up at once', b: 'Remember last position + search' },
    controls: 'Move the mouse over a view and the player (green) follows it. When the mouse is outside the view, the player moves on its own (when spotted, it hides behind a nearby pillar).',
    info: `
    <p><b>Sensory memory</b>: the AI stores what its senses picked up for a short time. A person who closes their eyes still believes an object they just saw is there. This is called object persistence.</p>
    <p>Without memory, the only question is "can I see it now". If the player takes one step behind a pillar, the guard goes back to patrol. To the player, the guard looks stupid.</p>
    <p>Ways to add memory:</p>
    <ul>
      <li><b>Last known position (LKP)</b>: store the point where the target left view. Go there and look around for the search time.</li>
      <li><b>Predicted position</b>: add last velocity × prediction time to the LKP. The guard heads ahead in the direction the player ran.</li>
      <li>Drop the memory after some time. When the search ends, go back to patrol.</li>
    </ul>
    <p>Downside: if the search is too long or the prediction too accurate, the player has nowhere to hide and gets frustrated. Search time works as a difficulty setting.</p>`,
    look: [
      'In auto mode, A "gives up" the moment the player hides behind a pillar. B goes to the question mark (LKP) and looks past the corner again. B has higher "Found again after losing" and "Times caught".',
      'Switch B to "Predicted position". The search point (dashed circle) moves ahead in the direction the player ran. With a large prediction time, the guard sometimes searches the wrong place.',
      'Lower B\'s "Search time" to 0.5 seconds. "Found again after losing" drops only a little. Most re-finds happen on the way to the LKP, when the guard sees past the corner. The remembered position matters more than the search time.',
      'Hide with the mouse yourself. In A, one pillar is enough to escape. In B, you must hide and then slip out the other side.',
    ],
    refs: [
      'Damian Isla, Bruce Blumberg. AAMAS 2002. Keeps and predicts the position of unseen targets as a belief.',
      'Damian Isla. AI Game Programming Wisdom 3. Tracks the position of a lost target with a probability map.',
      'Martin Walsh, GDC 2014. Last known position and search behavior.',
      'The Max Age of a stimulus sets how long sensory memory lasts.',
    ],
    params: {
      memory: { label: 'Sensory memory', group: 'Guard', options: { none: 'None (give up when out of sight)', lkp: 'Last known position (LKP)', predict: 'Predicted position (LKP + velocity × time)' } },
      search: 'Search time (s)',
      predict: 'Prediction time (s)',
      fov: 'Field of view (°)',
      range: 'Sight range',
      guardSpeed: 'Guard speed',
      playerSpeed: { label: 'Player speed', group: 'Scene' },
      simSpeed: 'Simulation speed',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, V = U.v2, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 800, WH = 480, R = 10;
    const rects = [
      { x: 230, y: 130, w: 70, h: 70 }, { x: 480, y: 110, w: 80, h: 55 }, { x: 370, y: 270, w: 60, h: 90 },
      { x: 590, y: 290, w: 70, h: 70 }, { x: 130, y: 320, w: 60, h: 60 },
    ];
    const patrolWp = [V(80, 70), V(720, 70), V(720, 240), V(80, 240)];
    const routeWp = [V(90, 440), V(330, 440), V(330, 245), V(720, 250), V(740, 440)];
    let guard, player, stats, simT, events;

    function init() {
      guard = { p: V(80, 70), dir: 0, state: 'patrol', wp: 1, lkp: null, target: null, timer: 0, sweep: 0, seen: false };
      player = { p: V(90, 440), v: V(0, 0), state: 'route', wp: 1, hide: null, timer: 0 };
      stats = { spotted: 0, reacq: 0, giveUp: 0, caught: 0, chaseT: 0 };
      simT = 0; events = [];
    }
    init();

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
    function clear(a, b) { for (const r of rects) if (rayBox(a.x, a.y, b.x - a.x, b.y - a.y, r) < 1) return false; return true; }
    function collide(p) {
      for (const w of rects) {
        const cx = U.clamp(p.x, w.x, w.x + w.w), cy = U.clamp(p.y, w.y, w.y + w.h);
        const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy);
        if (d < R) { if (d > 1e-6) { p.x = cx + dx / d * R; p.y = cy + dy / d * R; } else p.y = w.y - R; }
      }
      p.x = U.clamp(p.x, R, WW - R); p.y = U.clamp(p.y, R, WH - R);
    }
    // 장애물에 밀리며 이동. 0.6초 넘게 막히면 도착으로 처리 (길찾기 없는 단순 이동)
    function moveTo(o, target, sp, dt) {
      const d = V.sub(target, o.p), l = V.len(d);
      if (l < 4) { o.stuckT = 0; return true; }
      const before = V(o.p.x, o.p.y);
      o.p = V.add(o.p, V.scale(d, Math.min(l, sp * dt) / l));
      collide(o.p);
      if (V.dist(before, o.p) < sp * dt * 0.2) o.stuckT = (o.stuckT || 0) + dt; else o.stuckT = 0;
      if (o.stuckT > 0.6) { o.stuckT = 0; return true; }
      return false;
    }
    function sees() {
      const to = V.sub(player.p, guard.p), d = V.len(to);
      if (d > P.range) return false;
      if (d > R * 2) {
        const f = V.fromAngle(guard.dir);
        if (V.dot(f, V.scale(to, 1 / d)) < Math.cos(U.rad(P.fov) / 2)) return false;
      }
      return clear(guard.p, player.p);
    }
    const face = (to, dt, k = 8) => { if (V.len(to) > 1e-3) guard.dir = U.lerpAngle(guard.dir, Math.atan2(to.y, to.x), 1 - Math.exp(-k * dt)); };
    const log = (txt, col) => { events.unshift({ txt, col, t: simT }); if (events.length > 5) events.pop(); };

    function stepPlayer(dt, mouseTarget) {
      const old = V(player.p.x, player.p.y);
      if (mouseTarget) moveTo(player, mouseTarget, P.playerSpeed, dt);
      else if (player.state === 'route') {
        if (guard.seen) {
          // 발각되면 경비병 반대편 기둥 뒤로 숨음
          let best = null, bd = Infinity;
          for (const r of rects) {
            const c = V(r.x + r.w / 2, r.y + r.h / 2), away = V.norm(V.sub(c, guard.p));
            const spot = V.add(c, V.scale(away, Math.max(r.w, r.h) / 2 + 16));
            const d = V.dist(spot, player.p) + (V.dist(spot, guard.p) < V.dist(player.p, guard.p) ? 150 : 0);
            if (d < bd) { bd = d; best = spot; }
          }
          player.state = 'hide'; player.hide = best; player.timer = 2;
        } else if (moveTo(player, routeWp[player.wp], P.playerSpeed, dt)) player.wp = (player.wp + 1) % routeWp.length;
      } else {
        moveTo(player, player.hide, P.playerSpeed * 1.2, dt);
        if (!guard.seen) player.timer -= dt; else player.timer = 2;
        if (player.timer <= 0) {
          player.state = 'route';
          let bi = 0, bd = Infinity;
          routeWp.forEach((w, i) => { const d = V.dist(w, player.p); if (d < bd) { bd = d; bi = i; } });
          player.wp = (bi + 1) % routeWp.length;
        }
      }
      player.v = V.scale(V.sub(player.p, old), 1 / dt);
    }

    function stepGuard(dt) {
      const s = sees();
      if (s && !guard.seen && guard.state === 'patrol') { stats.spotted++; log(GTL.L('발견', 'Spotted'), C.warn); }
      if (s && (guard.state === 'investigate' || guard.state === 'search')) { stats.reacq++; log(GTL.L('다시 찾음', 'Found again'), C.good); }
      guard.seen = s;
      if (s) { guard.state = 'chase'; guard.lkp = V(player.p.x, player.p.y); guard.lastV = V(player.v.x, player.v.y); }
      if (guard.state === 'chase') {
        stats.chaseT += dt;
        if (!s) {
          if (P.memory === 'none') { guard.state = 'patrol'; stats.giveUp++; log(GTL.L('포기 (잊음)', 'Gave up (forgot)'), C.bad); }
          else {
            let t = guard.lkp;
            if (P.memory === 'predict') { t = V.add(t, V.scale(V.limit(guard.lastV, 200), P.predict)); collide(t); }
            guard.target = t; guard.state = 'investigate';
          }
        } else {
          face(V.sub(player.p, guard.p), dt, 12);
          moveTo(guard, player.p, P.guardSpeed, dt);
          if (V.dist(guard.p, player.p) < R * 2.2) {
            stats.caught++; log(GTL.L('잡음', 'Caught'), C.good);
            player.p = V(90, 440); player.wp = 1; player.state = 'route';
            guard.state = 'patrol'; guard.seen = false;
          }
        }
      }
      if (guard.state === 'investigate') {
        stats.chaseT += dt;
        face(V.sub(guard.target, guard.p), dt);
        const arrived = moveTo(guard, guard.target, P.guardSpeed, dt);
        if (arrived) { guard.state = 'search'; guard.timer = P.search; guard.sweep = guard.dir; }
      } else if (guard.state === 'search') {
        stats.chaseT += dt;
        guard.timer -= dt;
        guard.dir = guard.sweep + Math.sin((P.search - guard.timer) * 2.2) * U.rad(110);
        if (guard.timer <= 0) { guard.state = 'patrol'; stats.giveUp++; log(GTL.L('포기 (수색 끝)', 'Gave up (search over)'), C.bad); }
      } else if (guard.state === 'patrol') {
        const t = patrolWp[guard.wp];
        face(V.sub(t, guard.p), dt, 5);
        if (moveTo(guard, t, P.guardSpeed * 0.6, dt)) guard.wp = (guard.wp + 1) % patrolWp.length;
      }
    }

    const view = () => { const s = Math.min(ctx.width / WW, ctx.height / WH); return { s, ox: (ctx.width - WW * s) / 2, oy: (ctx.height - WH * s) / 2 }; };
    return {
      update(dt) {
        const m = ctx.input.mouse, vw = view();
        const mt = m.inside ? V((m.x - vw.ox) / vw.s, (m.y - vw.oy) / vw.s) : null;
        let t = dt * P.simSpeed;
        while (t > 1e-6) { const h = Math.min(t, 1 / 60); simT += h; stepPlayer(h, mt); stepGuard(h); t -= h; }
      },
      onAction() { init(); },
      render() {
        const g = ctx.g, vw = view(), s = vw.s;
        const X = (p) => ({ x: vw.ox + p.x * s, y: vw.oy + p.y * s });
        D.rect(g, vw.ox, vw.oy, WW * s, WH * s, '#181b21', 'rgba(255,255,255,0.1)');
        for (const r of rects) D.rect(g, vw.ox + r.x * s, vw.oy + r.y * s, r.w * s, r.h * s, '#3a404c', '#59606e');
        const gp = X(guard.p), half = U.rad(P.fov) / 2;
        // 시야 부채꼴
        g.beginPath(); g.moveTo(gp.x, gp.y); g.arc(gp.x, gp.y, P.range * s, guard.dir - half, guard.dir + half); g.closePath();
        g.fillStyle = guard.state === 'patrol' ? 'rgba(255,220,120,0.08)' : 'rgba(255,83,112,0.1)'; g.fill();
        // 기억: LKP와 수색 지점
        if ((guard.state === 'investigate' || guard.state === 'search') && guard.lkp) {
          const lp = X(guard.lkp), tp = X(guard.target);
          D.text(g, '?', lp.x, lp.y, { align: 'center', baseline: 'middle', size: 20, color: C.warn });
          D.circle(g, lp.x, lp.y, 12, null, C.warn, 1);
          if (P.memory === 'predict') {
            g.setLineDash([4, 4]); D.circle(g, tp.x, tp.y, 14, null, C.warn, 1.5); D.line(g, lp.x, lp.y, tp.x, tp.y, C.warn, 1); g.setLineDash([]);
          }
          if (guard.state === 'investigate') D.line(g, gp.x, gp.y, tp.x, tp.y, 'rgba(255,200,80,0.5)', 1);
        }
        // 가시선
        const pp = X(player.p);
        const inRange = V.dist(guard.p, player.p) < P.range;
        if (inRange) {
          if (guard.seen) D.line(g, gp.x, gp.y, pp.x, pp.y, C.good, 1.5);
          else { g.setLineDash([3, 5]); D.line(g, gp.x, gp.y, pp.x, pp.y, 'rgba(255,83,112,0.45)', 1); g.setLineDash([]); }
        }
        D.circle(g, pp.x, pp.y, R * s, C.good, '#000', 1.5);
        if (player.state === 'hide') D.text(g, GTL.L('숨음', 'Hiding'), pp.x, pp.y + 14, { align: 'center', size: 10, color: C.good });
        D.circle(g, gp.x, gp.y, R * s + 1, ctx.side === 'a' ? C.a : C.b, '#000', 1.5);
        const f = V.fromAngle(guard.dir);
        D.line(g, gp.x, gp.y, gp.x + f.x * 16, gp.y + f.y * 16, '#000', 2);
        const NAMES = { patrol: GTL.L('순찰', 'Patrol'), chase: GTL.L('추격', 'Chase'), investigate: GTL.L('LKP로 이동', 'Going to LKP'), search: GTL.L('수색 ', 'Search ') + Math.max(0, guard.timer).toFixed(1) + 's' };
        D.text(g, NAMES[guard.state], gp.x, gp.y - 26, { align: 'center', size: 11, color: guard.state === 'patrol' ? '#fff' : C.warn });
        // 사건 기록
        events.forEach((e, i) => D.text(g, `${e.t.toFixed(0)}s ${e.txt}`, ctx.width - 8, 8 + i * 14, { align: 'right', size: 11, color: e.col }));
        ctx.stat(GTL.L('발견 횟수', 'Times spotted'), stats.spotted);
        ctx.stat(GTL.L('놓친 뒤 다시 찾은 횟수', 'Found again after losing'), stats.reacq);
        ctx.stat(GTL.L('포기 횟수', 'Times gave up'), stats.giveUp);
        ctx.stat(GTL.L('잡은 횟수', 'Times caught'), stats.caught);
        ctx.stat(GTL.L('추격 + 수색 시간', 'Chase + search time'), stats.chaseT.toFixed(1) + ' s');
      },
    };
  },
});
