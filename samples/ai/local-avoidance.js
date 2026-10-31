// 로컬 회피: 없음 / 반발력 / RVO (Reciprocal Velocity Obstacles, 샘플링 방식)
GTL.register({
  id: 'local-avoidance',
  title: '로컬 회피: 반발력 vs RVO',
  summary: '서로 엇갈려 지나가야 하는 군중을 비교. 거리 기반 반발력은 정면으로 마주치면 서로 밀며 멈추고 떨림. RVO는 "이 속도로 가면 몇 초 뒤 부딪히는지"를 보고 미리 비켜 감. 상대도 절반을 비켜 준다고 가정해 진동 없음.',
  views: { a: '반발력 (separation)', b: 'RVO' },
  info: `
    <p>로컬 회피(local avoidance)는 길찾기 경로를 따라가는 에이전트끼리 부딪히지 않게 하는 기법</p>
    <p><b>반발력</b>: 가까운 이웃에게서 멀어지는 힘을 선호 속도에 더함. 거리만 보므로 <b>너무 늦게 반응</b>.
    정면으로 마주친 두 에이전트는 힘이 정확히 상쇄되어 멈추거나 좌우로 떨림.</p>
    <p><b>Velocity Obstacle (VO)</b>: 상대가 지금 속도를 유지한다고 가정. 그때 내가 고르면 시간 τ 안에 충돌하는 속도의 원뿔이 VO.
    원뿔 밖의 속도를 고르면 안전함. 단, 두 에이전트가 동시에 VO를 피하면 둘 다 과하게 비켰다가 다시 돌아옴. 이 <b>진동</b>이 문제.</p>
    <p><b>RVO (Reciprocal VO)</b>: "상대도 회피의 절반을 맡는다"고 가정. 그래서 원뿔을 <code>(v<sub>A</sub>+v<sub>B</sub>)/2</code>만큼 옮김.</p>
    <p>이 샘플은 van den Berg 등(2008)의 원 논문처럼 <b>후보 속도를 샘플링</b>. 그중 <code>penalty = w / 충돌까지 시간 + |v − v<sub>pref</sub>|</code>가 가장 작은 속도를 고름.
    실무 표준은 선형계획법을 쓰는 ORCA/RVO2.</p>
    <p>화면 읽는 법:</p>
    <ul>
      <li>빨간 테두리: 겹침(충돌)</li>
      <li>B 뷰의 0번 에이전트 주변 점: 후보 속도. 붉을수록 곧 충돌하는 속도.</li>
    </ul>`,
  diagram: (L) => `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="la-n" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="la-a" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="la-b" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    </defs>
    <text x="8" y="18" class="t-a">${L('A: 반발력 (거리만 봄)', 'A: repulsion (distance only)')}</text>
    <circle cx="85" cy="90" r="46" class="d-dim" stroke-dasharray="3 3"/>
    <circle cx="165" cy="90" r="46" class="d-dim" stroke-dasharray="3 3"/>
    <circle cx="85" cy="90" r="10" class="f-a"/>
    <circle cx="165" cy="90" r="10" class="f-a"/>
    <line x1="97" y1="90" x2="121" y2="90" class="d-line" marker-end="url(#la-n)"/>
    <line x1="153" y1="90" x2="129" y2="90" class="d-line" marker-end="url(#la-n)"/>
    <line x1="73" y1="90" x2="49" y2="90" class="d-a" marker-end="url(#la-a)"/>
    <line x1="177" y1="90" x2="201" y2="90" class="d-a" marker-end="url(#la-a)"/>
    <text x="125" y="72" text-anchor="middle" class="t-small">${L('선호 속도', 'preferred')}</text>
    <text x="49" y="108" text-anchor="middle" class="t-small t-a">${L('반발력', 'repulsion')}</text>
    <text x="201" y="108" text-anchor="middle" class="t-small t-a">${L('반발력', 'repulsion')}</text>
    <text x="8" y="156" class="t-small t-dim">${L('두 힘이 한 직선 위에서 상쇄됨', 'The forces lie on one line and cancel')}</text>
    <text x="8" y="170" class="t-small t-dim">${L('멈추거나 좌우로 떨림', 'Agents stall or jitter left and right')}</text>
    <text x="8" y="184" class="t-small t-dim">${L('닿기 직전에야 반응', 'They react only when already close')}</text>
    <line x1="262" y1="8" x2="262" y2="192" class="d-dim"/>
    <text x="280" y="18" class="t-b">${L('B: RVO (충돌까지 시간을 봄)', 'B: RVO (looks at time to collision)')}</text>
    <polygon points="300,100 471,61 471,139" class="f-bad" fill-opacity="0.18"/>
    <line x1="300" y1="100" x2="471" y2="61" class="d-dim"/>
    <line x1="300" y1="100" x2="471" y2="139" class="d-dim"/>
    <circle cx="480" cy="100" r="40" class="d-dim" stroke-dasharray="3 3"/>
    <text x="420" y="104" text-anchor="middle" class="t-small">${L('VO (충돌 원뿔)', 'VO')}</text>
    <circle cx="300" cy="100" r="8" class="f-b"/>
    <circle cx="480" cy="100" r="8" class="f-b"/>
    <line x1="310" y1="100" x2="380" y2="100" class="d-line" stroke-dasharray="4 3" marker-end="url(#la-n)"/>
    <line x1="307" y1="97" x2="358" y2="74" class="d-b" marker-end="url(#la-b)"/>
    <line x1="473" y1="103" x2="428" y2="132" class="d-b" marker-end="url(#la-b)"/>
    <text x="296" y="66" class="t-small t-b">${L('고른 속도', 'chosen velocity')}</text>
    <text x="280" y="152" class="t-small t-dim">${L('점선: 선호 속도, VO 안이라 곧 충돌', 'Dashed: preferred velocity, inside the VO')}</text>
    <text x="280" y="166" class="t-small t-dim">${L('파랑: 고른 속도, 둘이 절반씩 비킴', 'Blue: chosen velocity, each takes half')}</text>
    <text x="280" y="180" class="t-small">${L('penalty = w / 충돌까지 시간 + |v − v_pref|', 'penalty = w / time to collision + |v − v_pref|')}</text>
    <text x="280" y="194" class="t-small t-dim">${L('이 값이 가장 작은 후보 속도를 고름', 'Pick the candidate with the smallest penalty')}</text>
  </svg>`,
  look: [
    '기본 장면(원형 교차)으로 실행하면 A는 가운데서 서로 밀치며 겹치고(빨간 테두리) 떨림. B는 충돌 전에 미리 같은 방향으로 비켜 소용돌이처럼 빠져나감.',
    '"겹침 누적"과 "라운드 시간"을 비교하면 반발력은 몸으로 밀고 지나가 빠르지만 겹침이 수백 번 생김. RVO는 돌아가서 약간 느리지만 거의 겹치지 않음.',
    'A의 "반발 반경"을 키우면 겹침은 줄지만 정체가 생김',
    'B의 "회피 가중치 w"를 0 가까이 내리면 선호 속도만 고집해 충돌이 늘어남. 너무 크게 올리면 과하게 돌아감.',
    '장면을 "십자 교차"나 "복도 정면 충돌"로 바꿔도 같은 차이가 보임. A를 "회피 없음"으로 두면 그냥 겹쳐 지나감.',
  ],
  refs: [
    { type: 'paper', title: 'Reciprocal Velocity Obstacles for Real-Time Multi-Agent Navigation', year: 2008, note: 'van den Berg, Lin, Manocha. ICRA 2008. 샘플링 기반 RVO.', url: 'https://doi.org/10.1109/ROBOT.2008.4543489' },
    { type: 'paper', title: 'Reciprocal n-Body Collision Avoidance (ORCA)', year: 2011, note: 'van den Berg, Guy, Lin, Manocha. Robotics Research (ISRR 2009). 선형계획 기반 ORCA.', url: 'https://doi.org/10.1007/978-3-642-19457-3_1' },
    { type: 'paper', title: 'Motion Planning in Dynamic Environments Using Velocity Obstacles', year: 1998, note: 'Fiorini & Shiller. IJRR 17(7). Velocity Obstacle 개념.', url: 'https://doi.org/10.1177/027836499801700706' },
    { type: 'code', title: 'RVO2 Library (UNC GAMMA)', url: 'https://gamma.cs.unc.edu/RVO2/', note: 'ORCA의 공식 C++ 구현. Unity/Unreal의 군중 회피(RVO avoidance)도 이 계열.' },
    { type: 'engine', title: 'Unreal Engine - RVO Avoidance / Detour Crowd', note: 'CharacterMovementComponent의 bUseRVOAvoidance, Recast/Detour의 dtCrowd' },
  ],
  params: [
    { key: 'method', label: '회피 방식', type: 'select', group: '회피', options: [
      { value: 'none', label: '회피 없음' },
      { value: 'repulsion', label: '반발력 (거리 기반)' },
      { value: 'rvo', label: 'RVO (샘플링)' },
    ], a: 'repulsion', b: 'rvo' },
    { key: 'repelR', label: '반발 반경 (반지름 배수)', type: 'range', min: 1.5, max: 6, step: 0.1, default: 3, when: (p) => p.method === 'repulsion' },
    { key: 'repelK', label: '반발 세기', type: 'range', min: 0.2, max: 5, step: 0.1, default: 1.5, when: (p) => p.method === 'repulsion' },
    { key: 'w', label: '회피 가중치 w', type: 'range', min: 0.1, max: 10, step: 0.1, default: 2.5, when: (p) => p.method === 'rvo', help: 'penalty = w / 충돌시간 + |v − v_pref|' },
    { key: 'samples', label: '후보 속도 수', type: 'int', min: 16, max: 160, default: 80, when: (p) => p.method === 'rvo' },
    { key: 'horizon', label: '고려 반경 (px)', type: 'range', min: 40, max: 300, step: 5, default: 140, when: (p) => p.method === 'rvo' },
    { key: 'scene', label: '장면', type: 'select', group: '장면', shared: true, reset: true, options: [
      { value: 'circle', label: '원형 교차 (반대편으로)' },
      { value: 'cross', label: '십자 교차' },
      { value: 'corridor', label: '복도 정면 충돌' },
    ], default: 'circle' },
    { key: 'count', label: '에이전트 수', type: 'int', min: 4, max: 60, default: 28, shared: true, reset: true },
    { key: 'speed', label: '선호 속도 (px/s)', type: 'range', min: 30, max: 200, step: 5, default: 90, shared: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Local Avoidance: Repulsion vs RVO',
    summary: 'Compares crowds that must pass through each other. Distance-based repulsion makes agents push, stall, and jitter when they meet head on. RVO checks "if I keep this velocity, when do we collide?" and steps aside early. It assumes the other agent takes half of the avoidance, so there is no oscillation.',
    views: { a: 'Repulsion (separation)', b: 'RVO' },
    info: `
    <p>Local avoidance keeps agents that follow pathfinding routes from bumping into each other.</p>
    <p><b>Repulsion</b>: adds a force away from nearby neighbors to the preferred velocity. It only looks at distance, so it <b>reacts too late</b>.
    Two agents that meet head on cancel each other's forces exactly, so they stop or jitter left and right.</p>
    <p><b>Velocity Obstacle (VO)</b>: assumes the other agent keeps its current velocity. The VO is the cone of velocities that would make me collide within time τ.
    Any velocity outside the cone is safe. But if both agents avoid the VO at the same time, both swerve too far and then come back. This <b>oscillation</b> is the problem.</p>
    <p><b>RVO (Reciprocal VO)</b>: assumes "the other agent takes half of the avoidance". So it shifts the cone by <code>(v<sub>A</sub>+v<sub>B</sub>)/2</code>.</p>
    <p>Like the original paper by van den Berg et al. (2008), this sample <b>samples candidate velocities</b>. It picks the one with the smallest <code>penalty = w / time to collision + |v − v<sub>pref</sub>|</code>.
    The industry standard is ORCA/RVO2, which uses linear programming.</p>
    <p>How to read the screen:</p>
    <ul>
      <li>Red outline: overlap (collision)</li>
      <li>Dots around agent 0 in view B: candidate velocities. Redder means a velocity that collides sooner.</li>
    </ul>`,
    look: [
      'Run the default scene (circle swap). In A, agents shove and overlap in the middle (red outline) and jitter. In B, they step aside the same way before colliding and swirl out.',
      'Compare "Total overlaps" and "Round time". Repulsion pushes through and is fast, but causes hundreds of overlaps. RVO goes around and is a bit slower, but almost never overlaps.',
      'Raise A\'s "Repulsion radius". Overlaps go down, but traffic jams appear.',
      'Lower B\'s "Avoidance weight w" close to 0. Agents insist on their preferred velocity and collide more. Raise it too high and they detour too much.',
      'Switch the scene to "Cross traffic" or "Corridor head on". The same difference shows. Set A to "No avoidance" and agents just pass through each other.',
    ],
    refs: [
      'van den Berg, Lin, Manocha. ICRA 2008. Sampling-based RVO.',
      'van den Berg, Guy, Lin, Manocha. Robotics Research (ISRR 2009). ORCA based on linear programming.',
      'Fiorini & Shiller. IJRR 17(7). The Velocity Obstacle concept.',
      'The official C++ implementation of ORCA. Crowd avoidance in Unity and Unreal (RVO avoidance) belongs to this family.',
      'bUseRVOAvoidance in CharacterMovementComponent, and dtCrowd in Recast/Detour.',
    ],
    params: {
      method: { label: 'Avoidance method', group: 'Avoidance', options: { none: 'No avoidance', repulsion: 'Repulsion (distance based)', rvo: 'RVO (sampling)' } },
      repelR: 'Repulsion radius (× radius)',
      repelK: 'Repulsion strength',
      w: { label: 'Avoidance weight w', help: 'penalty = w / time to collision + |v − v_pref|' },
      samples: 'Candidate velocities',
      horizon: 'Neighbor radius (px)',
      scene: { label: 'Scene', group: 'Scene', options: { circle: 'Circle swap (to the far side)', cross: 'Cross traffic', corridor: 'Corridor head on' } },
      count: 'Agent count',
      speed: 'Preferred speed (px/s)',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const RAD = 9;
    let agents, round, roundT, collisions, lastRound, overlapping, samplesDbg;
    function init() {
      const rng = U.rng(ctx.seed);
      const W = ctx.width, H = ctx.height, n = P.count, cx = W / 2, cy = H / 2;
      agents = [];
      for (let i = 0; i < n; i++) {
        let s, gl, hue;
        if (P.scene === 'circle') {
          const a = (i / n) * U.TAU + rng.range(-0.02, 0.02), r = Math.min(W, H) * 0.44;
          s = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
          gl = { x: cx - Math.cos(a) * r, y: cy - Math.sin(a) * r };
          hue = (i / n) * 360;
        } else if (P.scene === 'cross') {
          const half = Math.ceil(n / 2), k = i % half, colI = k % 4;
          const span = Math.min(W, H) * 0.5, off = ((Math.floor(k / 4) / Math.max(1, Math.ceil(half / 4) - 1)) - 0.5) * span * 0.7;
          if (i < half) { s = { x: 30 + colI * 24, y: cy + off }; gl = { x: W - 30 - (3 - colI) * 24, y: cy + off }; hue = 20; }
          else { s = { x: cx + off, y: 30 + colI * 24 }; gl = { x: cx + off, y: H - 30 - (3 - colI) * 24 }; hue = 200; }
        } else {
          const half = Math.ceil(n / 2), k = i % half, rowsN = Math.ceil(half / 3), r = k % rowsN, c = Math.floor(k / rowsN);
          const y = cy + (r - (rowsN - 1) / 2) * 24 + rng.range(-3, 3);
          const cm = Math.ceil(half / rowsN) - 1 - c; // 앞줄이 더 먼 자리로 가도록 순서 뒤집기
          if (i < half) { s = { x: 40 + c * 24, y }; gl = { x: W - 40 - cm * 24, y }; hue = 20; }
          else { s = { x: W - 40 - c * 24, y }; gl = { x: 40 + cm * 24, y }; hue = 200; }
        }
        agents.push({ x: s.x, y: s.y, vx: 0, vy: 0, sx: s.x, sy: s.y, gx: gl.x, gy: gl.y, hue });
      }
      round = 0; roundT = 0; collisions = 0; lastRound = null; overlapping = new Set(); samplesDbg = [];
    }
    init();

    // 상대 위치 p, 상대 속도 v 로 반지름 R 원에 닿기까지 시간 (없으면 Infinity)
    function timeToCollision(px, py, vx, vy, R) {
      const c = px * px + py * py - R * R;
      if (c < 0) return (px * vx + py * vy) < 0 ? 0 : Infinity; // 이미 겹침: 다가가면 0
      const a = vx * vx + vy * vy, b = px * vx + py * vy; // |p + v*t|² = R² 의 가장 작은 양의 근
      if (b >= 0 || a < 1e-9) return Infinity;            // 멀어지는 중
      const disc = b * b - a * c;
      if (disc < 0) return Infinity;
      return (-b - Math.sqrt(disc)) / a;
    }

    // 도착한 에이전트는 주차 상태: 다른 에이전트의 회피 대상에서 제외 (도착 지점 혼잡으로 인한 교착 방지)
    const arrived = (a) => Math.hypot(a.gx - a.x, a.gy - a.y) < 12;

    function prefVel(a) {
      const dx = a.gx - a.x, dy = a.gy - a.y, d = Math.hypot(dx, dy);
      if (d < 2) return { x: 0, y: 0 };
      const s = Math.min(P.speed, d * 2);
      return { x: (dx / d) * s, y: (dy / d) * s };
    }

    return {
      update(dt) {
        const n = agents.length, m = P.method;
        roundT += dt;
        const newV = [];
        for (let i = 0; i < n; i++) {
          const a = agents[i], vp = prefVel(a);
          if (m === 'none') { newV.push(vp); continue; }
          if (m === 'repulsion') {
            let fx = 0, fy = 0;
            const RR = RAD * 2 * P.repelR / 2;
            for (let j = 0; j < n; j++) {
              if (j === i || arrived(agents[j])) continue;
              const o = agents[j], dx = a.x - o.x, dy = a.y - o.y, d = Math.hypot(dx, dy);
              if (d < RR && d > 1e-6) { const s = (RR - d) / RR; fx += (dx / d) * s; fy += (dy / d) * s; }
            }
            let vx = vp.x + fx * P.speed * P.repelK, vy = vp.y + fy * P.speed * P.repelK;
            const l = Math.hypot(vx, vy), mx = P.speed * 1.2;
            if (l > mx) { vx *= mx / l; vy *= mx / l; }
            newV.push({ x: vx, y: vy });
            continue;
          }
          // RVO: 후보 속도 샘플링
          const nb = [];
          for (let j = 0; j < n; j++) {
            if (j === i || arrived(agents[j])) continue;
            const o = agents[j];
            const d = Math.hypot(o.x - a.x, o.y - a.y);
            if (d < P.horizon) nb.push({ o, d });
          }
          // 가까운 이웃 최대 10개만 (RVO2의 maxNeighbors와 같은 역할)
          nb.sort((p, q) => p.d - q.d);
          if (nb.length > 10) nb.length = 10;
          const vmax = P.speed * 1.2;
          const cands = [vp];
          const K = P.samples;
          const rngs = [0.25, 0.5, 0.75, 1];
          const per = Math.max(4, Math.round(K / rngs.length));
          for (const fr of rngs) for (let k = 0; k < per; k++) {
            const ang = (k / per) * U.TAU + fr; // 고리마다 약간 회전 (결정적)
            cands.push({ x: Math.cos(ang) * vmax * fr, y: Math.sin(ang) * vmax * fr });
          }
          cands.push({ x: 0, y: 0 });
          let best = vp, bestPen = Infinity;
          const dbg = i === 0 ? [] : null;
          for (const c of cands) {
            let tmin = Infinity;
            for (const { o } of nb) {
              // RVO: 상대에 대한 상대속도 = (2c − v_a) − v_o
              const rvx = 2 * c.x - a.vx - o.vx, rvy = 2 * c.y - a.vy - o.vy;
              const t = timeToCollision(a.x - o.x, a.y - o.y, rvx, rvy, RAD * 2 + 2);
              if (t < tmin) tmin = t;
            }
            const pen = P.w * 10 / Math.max(tmin, 1e-3) + Math.hypot(c.x - vp.x, c.y - vp.y);
            if (dbg) dbg.push({ x: c.x, y: c.y, t: tmin });
            if (pen < bestPen) { bestPen = pen; best = c; }
          }
          if (dbg) samplesDbg = dbg;
          newV.push(best);
        }
        // 속도 갱신 (약간의 가속 제한)
        for (let i = 0; i < n; i++) {
          const a = agents[i], v = newV[i];
          a.vx = U.damp(a.vx, v.x, 12, dt); a.vy = U.damp(a.vy, v.y, 12, dt);
          a.x += a.vx * dt; a.y += a.vy * dt;
        }
        // 충돌 카운트 (새로 겹친 쌍)
        const now = new Set();
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
          const A = agents[i], B = agents[j];
          if (arrived(A) || arrived(B)) continue;
          if (Math.hypot(A.x - B.x, A.y - B.y) < RAD * 2 - 1) { const k = i * 1000 + j; now.add(k); if (!overlapping.has(k)) collisions++; }
        }
        overlapping = now;
        // 라운드: 모두 도착하면 목표 교환
        const done = agents.every(arrived);
        if (done || roundT > 40) {
          lastRound = done ? roundT : null; round++; roundT = 0;
          for (const a of agents) { [a.sx, a.gx] = [a.gx, a.sx]; [a.sy, a.gy] = [a.gy, a.sy]; }
        }
      },
      onAction() { init(); },
      render() {
        const g = ctx.g, ov = new Set();
        D.grid(g, ctx.width, ctx.height, 40);
        for (const k of overlapping) { ov.add(Math.floor(k / 1000)); ov.add(k % 1000); }
        for (const a of agents) D.line(g, a.x, a.y, a.gx, a.gy, 'rgba(255,255,255,0.04)', 1);
        for (const a of agents) D.circle(g, a.gx, a.gy, 2, 'rgba(255,255,255,0.25)');
        if (P.method === 'rvo' && samplesDbg.length && agents.length) {
          const a = agents[0], s = 0.5;
          for (const c of samplesDbg) {
            const danger = isFinite(c.t) ? U.clamp(1 - c.t / 3, 0, 1) : 0;
            D.circle(g, a.x + c.x * s, a.y + c.y * s, 2, U.rgb(U.lerp(102, 255, danger), U.lerp(209, 60, danger), U.lerp(122, 80, danger), 0.9));
          }
          D.circle(g, a.x, a.y, P.horizon, null, 'rgba(255,255,255,0.1)', 1);
        }
        agents.forEach((a, i) => {
          D.circle(g, a.x, a.y, RAD, U.hsl(a.hue, 65, 55), ov.has(i) ? C.bad : 'rgba(0,0,0,0.6)', ov.has(i) ? 2.5 : 1);
          D.line(g, a.x, a.y, a.x + a.vx * 0.15, a.y + a.vy * 0.15, '#fff', 1.5);
        });
        if (agents.length) D.circle(g, agents[0].x, agents[0].y, RAD + 3, null, '#fff', 1);
        let sp = 0; for (const a of agents) sp += Math.hypot(a.vx, a.vy);
        ctx.stat(GTL.L('도착', 'Arrived'), agents.filter(arrived).length + ' / ' + agents.length);
        ctx.stat(GTL.L('겹침 누적 (쌍)', 'Total overlaps (pairs)'), collisions);
        ctx.stat(GTL.L('현재 겹침', 'Current overlaps'), overlapping.size);
        ctx.stat(GTL.L('라운드 시간', 'Round time'), GTL.L(`${roundT.toFixed(1)} s (직전 ${lastRound === null ? '-' : lastRound.toFixed(1) + ' s'})`, `${roundT.toFixed(1)} s (last ${lastRound === null ? '-' : lastRound.toFixed(1) + ' s'})`));
        ctx.stat(GTL.L('평균 속도 / 선호', 'Avg speed / preferred'), ((sp / Math.max(1, agents.length)) / P.speed * 100).toFixed(0) + ' %');
      },
    };
  },
});
