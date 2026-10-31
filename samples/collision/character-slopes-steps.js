// 캐릭터 컨트롤러: 경사 한계(slope limit), 계단 오르기(step offset), 지면 붙이기(ground snapping)
GTL.register({
  id: 'character-slopes-steps',
  title: '캐릭터 컨트롤러: 경사 한계, 계단 오르기, 지면 붙이기',
  summary: '미끄러짐 이동만 쓰는 캐릭터는 낮은 계단에 막히고, 벽 같은 급경사를 기어오르고, 내리막과 언덕 꼭대기에서 공중에 뜸. 경사 한계, 계단 오르기, 지면 붙이기를 더하면 걷는 느낌이 의도대로 바뀜.',
  views: { a: '미끄러짐 이동만', b: '경사 한계 + 계단 + 지면 붙이기' },
  controls: '←→ 또는 AD: 이동 방향 바꾸기 (손을 떼면 자동으로 걸음), Space: 점프',
  info: `
    <p>캐릭터 컨트롤러는 물리 엔진의 강체 대신 직접 위치를 옮기는 이동 방식. 보통 collide and slide 위에 규칙 세 가지를 얹음.
    Unity CharacterController와 PhysX CCT가 같은 이름의 설정을 둠.</p>
    <ul>
      <li><b>경사 한계</b>(slope limit): 법선과 위쪽 사이 각도가 한계보다 크면 바닥이 아니라 벽으로 다룸. 미끄러질 때 위로 올라가는 성분을 없앰.</li>
      <li><b>계단 오르기</b>(step offset): 바닥에 서서 벽에 막히면 세 단계로 다시 시도. 위로 step offset만큼, 앞으로, 아래로. 내려선 면이 걸을 수 있는 바닥이면 받아들임.</li>
      <li><b>지면 붙이기</b>(ground snapping): 직전 프레임에 바닥에 있었는데 지금 떠 있으면 아래로 짧게 스윕. 바닥이 가까이 있으면 그 위로 붙임.</li>
    </ul>
    <p>지면 붙이기가 없으면 내리막에서 한 프레임마다 조금씩 떠서 계단처럼 통통 튀며 내려감. 언덕 꼭대기에서는 날아오름. 그동안 점프 입력도 받지 못함.</p>
    <p>단점과 주의:</p>
    <ul>
      <li>step offset이 크면 낮은 담장도 넘음. 캐릭터 키보다 작게 잡아야 함.</li>
      <li>snap 거리가 크면 절벽 끝에서 아래 바닥으로 빨려 들어감. 점프 직후에는 붙이지 않아야 함.</li>
      <li>이 샘플의 충돌체는 발 위치의 원 하나. 실제 게임은 캡슐을 씀.</li>
    </ul>`,
  diagram: (L) => `<svg viewBox="0 0 540 182" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arra" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    <marker id="arrb" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    <marker id="arrn" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="8" y="14">${L('계단 오르기', 'Step offset')}</text>
    <text x="186" y="14">${L('경사 한계', 'Slope limit')}</text>
    <text x="368" y="14">${L('지면 붙이기', 'Ground snapping')}</text>
    <line x1="178" y1="22" x2="178" y2="176" class="d-dim"/><line x1="360" y1="22" x2="360" y2="176" class="d-dim"/>
    <path d="M8,130 L90,130 L90,112 L172,112 L172,140 L8,140 Z" class="f-dim"/>
    <circle cx="60" cy="121" r="9" class="d-line"/>
    <line x1="64" y1="126" x2="88" y2="126" class="d-a" marker-end="url(#arra)"/>
    <path d="M60,121 L60,99 L104,99 L104,103" class="d-b" stroke-dasharray="4 3" marker-end="url(#arrb)"/>
    <circle cx="104" cy="103" r="9" class="d-b"/>
    <line x1="20" y1="130" x2="20" y2="106" class="d-b" marker-start="url(#arrb)" marker-end="url(#arrb)"/>
    <text x="8" y="90" class="t-small t-b">${L('계단 오르기 높이', 'step offset')}</text>
    <text x="8" y="158" class="t-small t-a">${L('A: 낮은 턱에 막힘', 'A: blocked by a low step')}</text>
    <text x="8" y="172" class="t-small t-b">${L('B: 위, 앞, 아래로 다시 시도', 'B: retries up, forward, down')}</text>
    <path d="M186,130 L236,130 L286,40 L354,40 L354,140 L186,140 Z" class="f-dim"/>
    <line x1="261" y1="85" x2="234.8" y2="70.5" class="d-line" marker-end="url(#arrn)"/>
    <line x1="261" y1="85" x2="261" y2="55" class="d-dim" marker-end="url(#arrn)"/>
    <path d="M261,69 A16,16 0 0,0 247,77.2" class="d-accent"/>
    <text x="250" y="66" class="t-small">θ</text>
    <text x="226" y="70" class="t-small t-mono">n</text>
    <text x="265" y="56" class="t-small t-dim">${L('위', 'up')}</text>
    <line x1="228" y1="119.7" x2="243" y2="92.7" class="d-a" marker-end="url(#arra)"/>
    <text x="186" y="158" class="t-small">${L('θ가 한계보다 크면 벽으로 다룸', 'θ above the limit: treat as wall')}</text>
    <text x="186" y="172" class="t-small t-a">${L('A는 급경사를 기어오름', 'A climbs the steep slope')}</text>
    <path d="M368,50 L410,50 L530,120 L530,140 L368,140 Z" class="f-dim"/>
    <polyline points="380,41 430,41 436,56 458,58 463,72 486,74 491,88 512,90" class="d-a" fill="none"/>
    <circle cx="447" cy="57" r="9" class="d-a"/>
    <polyline points="380,41 413,41 530,109.2" class="d-b" fill="none"/>
    <circle cx="515" cy="100.9" r="9" class="d-b"/>
    <text x="368" y="158" class="t-small t-a">${L('A: 내리막에서 뜨며 튐', 'A: floats and bounces downhill')}</text>
    <text x="368" y="172" class="t-small t-b">${L('B: 아래로 짧게 스윕해 붙임', 'B: short sweep down, then stick')}</text>
  </svg>`,
  look: [
    '기본 상태에서 A는 왼쪽 계단에 막혀 되돌아가고, 오른쪽 60° 급경사는 기어올라 고지에 도달. B는 계단을 올라 왼쪽 고지에 가고, 급경사 앞에서 되돌아옴.',
    '내리막(30°)과 언덕 꼭대기에서 A의 궤적에 빨간 점(공중)이 찍힘. "의도치 않은 공중 비율"을 비교.',
    'B의 "지면 붙이기"만 끄면 B도 내리막에서 통통 튐. "계단 오르기 높이"를 4 이하로 낮추면 B도 계단에 막힘. 발이 둥글어서 계단 높이보다 작은 값으로도 모서리를 타고 오름.',
    'B의 "경사 한계"를 65°로 올리면 B도 급경사를 오름. "45° 넘는 경사에 선 시간"이 늘어남.',
  ],
  refs: [
    { type: 'engine', title: 'Unity Manual: Character Controller component reference', url: 'https://docs.unity3d.com/Manual/class-CharacterController.html', note: 'Slope Limit, Step Offset, Skin Width 설정' },
    { type: 'engine', title: 'NVIDIA PhysX SDK Guide: Character Controllers', note: '위, 옆, 아래 3단계 이동(auto stepping), 걸을 수 없는 경사 처리' },
    { type: 'paper', title: 'Improved Collision detection and Response (Kasper Fauerby)', year: 2003, note: '타원체 스윕과 미끄러짐 응답. 컨트롤러의 바탕.' },
    { type: 'engine', title: 'Godot CharacterBody2D (floor_max_angle, floor_snap_length)', url: 'https://docs.godotengine.org/en/stable/classes/class_characterbody2d.html' },
  ],
  params: [
    { key: 'speed', label: '걷는 속도 (px/초)', type: 'range', min: 40, max: 300, step: 5, default: 170, shared: true, group: '장면' },
    { key: 'stairH', label: '계단 한 칸 높이', type: 'int', min: 6, max: 26, default: 14, shared: true, reset: true },
    { key: 'slopeLimit', label: '경사 한계 (°)', type: 'int', min: 20, max: 90, default: 45, a: 90, b: 45, group: '컨트롤러', help: '90이면 사실상 끔' },
    { key: 'stepOffset', label: '계단 오르기 높이', type: 'int', min: 0, max: 30, default: 18, a: 0, b: 18, help: '0이면 끔' },
    { key: 'snap', label: '지면 붙이기', type: 'bool', default: true, a: false, b: true },
    { key: 'snapDist', label: '붙이기 거리', type: 'int', min: 1, max: 30, default: 16, when: (p) => p.snap },
    { key: 'showTrail', label: '궤적 표시', type: 'bool', default: true },
  ],
  en: {
    title: 'Character Controller: Slope Limit, Step Up, Ground Snapping',
    summary: 'A character that uses only sliding movement gets blocked by low steps, climbs steep wall-like slopes, and floats in the air on downhills and hilltops. Add a slope limit, step up, and ground snapping, and walking feels the way you intend.',
    views: { a: 'Sliding movement only', b: 'Slope limit + steps + ground snapping' },
    controls: '← → or A D: change walking direction (it walks on its own when you let go), Space: jump',
    info: `
    <p>A character controller moves the position directly, instead of using a rigid body in the physics engine. It usually adds three rules on top of collide and slide.
    Unity CharacterController and PhysX CCT have settings with the same names.</p>
    <ul>
      <li><b>Slope limit</b>: if the angle between the normal and up is larger than the limit, treat the surface as a wall, not a floor. Remove the upward part when sliding.</li>
      <li><b>Step up</b> (step offset): when standing on the floor and blocked by a wall, try again in three moves: up by the step offset, forward, then down. Accept it if the surface you land on is walkable floor.</li>
      <li><b>Ground snapping</b>: if the character was on the floor last frame and is in the air now, sweep down a short distance. If the floor is close, snap onto it.</li>
    </ul>
    <p>Without ground snapping, the character lifts off a little every frame on a downhill and bounces down like on stairs. On a hilltop it flies up. During that time it also cannot accept jump input.</p>
    <p>Downsides and cautions:</p>
    <ul>
      <li>A large step offset lets the character climb low fences too. Keep it smaller than the character's height.</li>
      <li>A large snap distance pulls the character down to the floor below at a cliff edge. Do not snap right after a jump.</li>
      <li>The collider in this sample is one circle at the feet. Real games use a capsule.</li>
    </ul>`,
    look: [
      'In the default state, A is blocked by the stairs on the left and turns back. It climbs the 60° steep slope on the right and reaches the plateau. B climbs the stairs to the left plateau and turns back at the steep slope.',
      'On the downhill (30°) and the hilltop, red dots (in the air) appear in A\'s trail. Compare "Unintended air time".',
      'Turn off only B\'s "Ground snapping". B also bounces on the downhill. Lower "Step up height" to 4 or less. B is also blocked by the stairs. The foot is round, so it can ride over the corner even with a value smaller than the step height.',
      'Raise B\'s "Slope limit" to 65°. B also climbs the steep slope. "Time on slopes over 45°" goes up.',
    ],
    refs: [
      'Slope Limit, Step Offset, and Skin Width settings.',
      'Three-step movement (up, side, down) for auto stepping, and handling of non-walkable slopes.',
      'Ellipsoid sweep and sliding response. The basis of character controllers.',
      null,
    ],
    params: {
      speed: { label: 'Walk speed (px/s)', group: 'Scene' },
      stairH: 'Stair step height',
      slopeLimit: { label: 'Slope limit (°)', group: 'Controller', help: '90 means off in practice' },
      stepOffset: { label: 'Step up height', help: '0 means off' },
      snap: 'Ground snapping',
      snapDist: 'Snap distance',
      showTrail: 'Show trail',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 640, WH = 400, R = 12, G = 1400, JUMP = 520, SKIN = 0.05, DT = 1 / 60;
    let walls, ground, labels, ch, st, trail, acc;

    function buildLevel() {
      const h = P.stairH, y0 = 330;
      const pts = [[10, 0], [10, y0 - 4 * h], [80, y0 - 4 * h]];
      for (let i = 3; i >= 0; i--) { const x = 160 - i * 20; pts.push([x - 20, y0 - i * h], [x, y0 - i * h]); }
      // 계단: 각 단의 세로면 + 윗면. 위에서 이미 넣은 점으로 계단 모양이 됨
      const t30 = Math.tan(U.rad(30));
      pts.push([270, y0], [340, y0 + 70 * t30]);           // 30° 내리막
      const vy = y0 + 70 * t30;
      pts.push([370, vy], [415, vy - 30], [430, vy - 30], [455, vy - 12]); // 작은 언덕
      const rise = 45 * Math.tan(U.rad(60));
      pts.push([470, vy - 12], [515, vy - 12 - rise], [630, vy - 12 - rise], [630, 0]); // 60° 급경사와 고지
      walls = [];
      for (let i = 0; i + 1 < pts.length; i++) walls.push([...pts[i], ...pts[i + 1]]);
      ground = pts;
      labels = [
        [120, y0 - 2 * h - 22, GTL.L('계단', 'Stairs')], [300, y0 + 4, '30°'], [400, vy - 46, GTL.L('언덕', 'Hill')], [470, vy - 70, '60°'],
        [40, y0 - 4 * h - 20, GTL.L('왼쪽 고지', 'Left plateau')], [560, vy - 12 - rise - 20, GTL.L('오른쪽 고지', 'Right plateau')],
      ];
    }

    function init() {
      ctx.rng = U.rng(ctx.seed);
      buildLevel();
      ch = { x: 215, y: 330 - R - 0.5, vy: 0, dir: 1, grounded: true, jumping: false, blockT: 0, gn: [0, -1], inLeft: false, inRight: false };
      st = { frames: 0, air: 0, snaps: 0, steps: 0, steep: 0, left: 0, right: 0, block: 0 };
      trail = []; acc = 0;
    }
    init();

    function sweep(cx, cy, dx, dy) {
      let best = null;
      const consider = (t, nx, ny, vi) => { if (!best || t < best.t) best = { t, nx, ny, vi }; };
      for (let wi = 0; wi < walls.length; wi++) {
        const [ax, ay, bx, by] = walls[wi];
        const ex = bx - ax, ey = by - ay, L = Math.hypot(ex, ey), ux = ex / L, uy = ey / L;
        let nx = -uy, ny = ux, s0 = (cx - ax) * nx + (cy - ay) * ny;
        if (s0 < 0) { nx = -nx; ny = -ny; s0 = -s0; }
        const ds = dx * nx + dy * ny;
        if (ds < 0) {
          const t = Math.max(0, (s0 - R) / -ds);
          if (t <= 1) {
            const px = cx + dx * t, py = cy + dy * t, proj = (px - ax) * ux + (py - ay) * uy;
            if (proj >= 0 && proj <= L) consider(t, nx, ny, -1);
          }
        }
        for (let e = 0; e < 2; e++) {
          const qx = e ? bx : ax, qy = e ? by : ay, vi = wi + e;
          const fx = cx - qx, fy = cy - qy, a2 = dx * dx + dy * dy, b = 2 * (fx * dx + fy * dy), c = fx * fx + fy * fy - R * R;
          if (a2 < 1e-12 || b >= 0) continue;
          if (c < 0) { const l = Math.hypot(fx, fy) || 1; consider(0, fx / l, fy / l, vi); continue; }
          const disc = b * b - 4 * a2 * c;
          if (disc < 0) continue;
          const t = (-b - Math.sqrt(disc)) / (2 * a2);
          if (t >= 0 && t <= 1) { const hx = fx + dx * t, hy = fy + dy * t, l = Math.hypot(hx, hy) || 1; consider(t, hx / l, hy / l, vi); }
        }
      }
      return best;
    }

    const cosLimit = () => Math.cos(U.rad(P.slopeLimit)) - 1e-4;
    const walkable = (ny) => -ny >= cosLimit() && ny < -0.05; // 법선이 위쪽과 이루는 각도가 한계 이하
    // 꼭짓점에 닿으면 접촉 법선이 둥글게 기울어짐. 바닥 판정은 꼭짓점에 붙은 면 중 가장 위를 향한 면의 법선으로 함
    function surface(h) {
      if (h.vi < 0) return [h.nx, h.ny];
      let best = [h.nx, h.ny];
      for (const wi of [h.vi - 1, h.vi]) {
        if (wi < 0 || wi >= walls.length) continue;
        const [ax, ay, bx, by] = walls[wi], l = Math.hypot(bx - ax, by - ay);
        let nx = -(by - ay) / l, ny = (bx - ax) / l;
        if (nx * h.nx + ny * h.ny < 0) { nx = -nx; ny = -ny; }
        if (ny < best[1]) best = [nx, ny];
      }
      return best;
    }
    const walkHit = (h) => walkable(surface(h)[1]);

    // 원 p를 (dx,dy)만큼 미끄러지며 이동. 반환: { ground: 바닥 법선 또는 null, blocked }
    function moveSlide(p, dx, dy) {
      let rx = dx, ry = dy, groundN = null, blocked = false;
      for (let it = 0; it < 4; it++) {
        const len = Math.hypot(rx, ry);
        if (len < 1e-6) break;
        const h = sweep(p.x, p.y, rx, ry);
        if (!h) { p.x += rx; p.y += ry; break; }
        const t = Math.max(0, h.t - SKIN / len);
        p.x += rx * t; p.y += ry * t;
        rx *= 1 - t; ry *= 1 - t;
        let nx = h.nx, ny = h.ny;
        if (walkHit(h)) groundN = surface(h);
        else if (ny < 0 && ry <= 0) {
          // 걸을 수 없는 경사: 벽처럼 다룸. 수평 법선으로 미끄러져서 위로 올라가지 못함
          const l = Math.abs(nx) || 1; nx = nx / l; ny = 0; blocked = true;
        } else if (Math.abs(ny) < 0.3) blocked = true;
        const dn = rx * nx + ry * ny;
        rx -= dn * nx; ry -= dn * ny;
      }
      return { ground: groundN, blocked };
    }

    function probeGround(p, dist) {
      const h = sweep(p.x, p.y, 0, dist);
      if (!h || !walkHit(h)) return null;
      const n = surface(h);
      return { t: h.t, nx: n[0], ny: n[1] };
    }

    function step(dt) {
      const kb = ctx.input;
      if (kb.key('ArrowLeft') || kb.key('KeyA')) ch.dir = -1;
      else if (kb.key('ArrowRight') || kb.key('KeyD')) ch.dir = 1;
      if (ch.grounded && kb.pressed('Space')) { ch.vy = -JUMP; ch.grounded = false; ch.jumping = true; }
      const wasGrounded = ch.grounded;
      if (!ch.grounded) ch.vy = Math.min(ch.vy + G * dt, 900); else ch.vy = 0;
      const dx = ch.dir * P.speed * dt, dy = ch.vy * dt;
      const x0 = ch.x, y0 = ch.y;
      let res = moveSlide(ch, dx, dy);
      // 계단 오르기: 바닥에 서 있다가 막혔을 때 위, 앞, 아래로 다시 시도
      if (wasGrounded && P.stepOffset > 0 && res.blocked && Math.abs(ch.x - x0) < Math.abs(dx) * 0.5) {
        const plain = { x: ch.x, y: ch.y };
        const q = { x: x0, y: y0 };
        const up = sweep(q.x, q.y, 0, -P.stepOffset);
        const u = up ? Math.max(0, up.t * P.stepOffset - SKIN) : P.stepOffset;
        q.y -= u;
        moveSlide(q, dx, 0);
        const down = sweep(q.x, q.y, 0, u + 1);
        if (down && walkHit(down) && Math.abs(q.x - x0) > Math.abs(plain.x - x0) + 0.3) {
          q.y += Math.max(0, down.t * (u + 1) - SKIN);
          ch.x = q.x; ch.y = q.y; res = { ground: surface(down), blocked: false };
          st.steps++;
        }
      }
      let g = res.ground ? { nx: res.ground[0], ny: res.ground[1] } : null;
      if (!g && ch.vy >= 0) { const pr = probeGround(ch, 1.5); if (pr) g = pr; }
      // 지면 붙이기
      if (!g && P.snap && wasGrounded && !ch.jumping) {
        const pr = probeGround(ch, P.snapDist);
        if (pr) { ch.y += Math.max(0, pr.t * P.snapDist - SKIN); g = pr; st.snaps++; }
      }
      ch.grounded = !!g;
      if (g) { ch.gn = [g.nx, g.ny]; ch.jumping = false; ch.vy = 0; }
      // 측정
      st.frames++;
      if (!ch.grounded && !ch.jumping) st.air++;
      if (ch.grounded && -ch.gn[1] < Math.cos(U.rad(45)) - 1e-3) st.steep += dt;
      const prog = Math.abs(ch.x - x0) / (P.speed * dt);
      ch.blockT = prog < 0.1 ? ch.blockT + dt : 0;
      if (ch.blockT > 0.25) { ch.dir = -ch.dir; ch.blockT = 0; st.block++; }
      const inL = ch.x < 75, inR = ch.x > 525;
      if (inL && !ch.inLeft) st.left++;
      if (inR && !ch.inRight) st.right++;
      ch.inLeft = inL; ch.inRight = inR;
      if (ch.y > WH + 50) init();
    }

    return {
      update(dt) {
        acc += dt;
        let n = 0;
        while (acc >= DT && n < 8) { step(DT); acc -= DT; n++; }
        if (n >= 8) acc = 0;
        trail.push(ch.x, ch.y, ch.grounded ? 1 : ch.jumping ? 2 : 0);
        if (trail.length > 3 * 240) trail.splice(0, 3);
      },
      render() {
        ctx.clearStats();
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const S = Math.min(W / WW, H / WH), ox = (W - WW * S) / 2, oy = (H - WH * S) / 2;
        const X = (x) => ox + x * S, Y = (y) => oy + y * S;
        const col = ctx.side === 'a' ? C.a : C.b;
        // 지형
        g.beginPath(); g.moveTo(X(ground[0][0]), Y(WH));
        for (const [x, y] of ground) g.lineTo(X(x), Y(y));
        g.lineTo(X(ground[ground.length - 1][0]), Y(WH)); g.closePath();
        g.fillStyle = '#2b303b'; g.fill();
        g.beginPath();
        for (const [ax, ay, bx, by] of walls) {
          const ex = bx - ax, ey = by - ay, l = Math.hypot(ex, ey);
          const steep = Math.abs(ex / l) < Math.cos(U.rad(P.slopeLimit)) - 1e-4;
          if (!steep) { g.moveTo(X(ax), Y(ay)); g.lineTo(X(bx), Y(by)); }
        }
        g.strokeStyle = '#8b93a5'; g.lineWidth = 2; g.stroke();
        g.beginPath();
        for (const [ax, ay, bx, by] of walls) {
          const ex = bx - ax, ey = by - ay, l = Math.hypot(ex, ey);
          if (Math.abs(ex / l) < Math.cos(U.rad(P.slopeLimit)) - 1e-4) { g.moveTo(X(ax), Y(ay)); g.lineTo(X(bx), Y(by)); }
        }
        g.strokeStyle = C.bad; g.lineWidth = 2; g.stroke();
        for (const [x, y, s] of labels) D.text(g, s, X(x), Y(y), { color: C.dim, size: 11, align: 'center' });
        // 궤적: 공중(점프 제외)은 빨간 점
        if (P.showTrail) {
          for (let k = 0; k < trail.length; k += 3) {
            const s = trail[k + 2];
            g.fillStyle = s === 1 ? 'rgba(255,255,255,0.25)' : s === 2 ? 'rgba(255,203,107,0.6)' : C.bad;
            const r = s === 0 ? 2.2 : 1.2;
            g.fillRect(X(trail[k]) - r, Y(trail[k + 1] + R) - r, r * 2, r * 2);
          }
        }
        // 캐릭터: 발 원(충돌체) + 몸
        const cx = X(ch.x), cy = Y(ch.y), r = R * S;
        D.rect(g, cx - r * 0.7, cy - r * 3, r * 1.4, r * 2.6, 'rgba(255,255,255,0.12)', null);
        D.circle(g, cx, cy, r, col, '#fff', 1.5);
        D.circle(g, cx + ch.dir * r * 0.45, cy - r * 2.3, r * 0.18, '#fff', null);
        if (ch.grounded) D.arrow(g, cx, cy + r, cx + ch.gn[0] * 22 * S, cy + r + ch.gn[1] * 22 * S, C.good, 1.5, 5);
        const air = st.frames ? (100 * st.air) / st.frames : 0;
        ctx.stat(GTL.L('의도치 않은 공중 비율', 'Unintended air time'), air.toFixed(1) + ' %');
        ctx.stat(GTL.L('지면 붙이기 횟수', 'Ground snaps'), st.snaps);
        ctx.stat(GTL.L('계단 오르기 성공', 'Successful step ups'), st.steps);
        ctx.stat(GTL.L('45° 넘는 경사에 선 시간', 'Time on slopes over 45°'), st.steep.toFixed(1) + GTL.L(' 초', ' s'));
        ctx.stat(GTL.L('왼쪽 고지 도달', 'Reached left plateau'), st.left);
        ctx.stat(GTL.L('오른쪽 고지 도달', 'Reached right plateau'), st.right);
        ctx.stat(GTL.L('막혀서 돌아섬', 'Turned back when blocked'), st.block);
      },
    };
  },
});
