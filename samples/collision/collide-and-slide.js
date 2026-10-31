// 원 vs 선분 이동: 충돌 시 멈춤 vs 벽을 따라 미끄러짐(collide and slide)
GTL.register({
  id: 'collide-and-slide',
  title: '원 vs 선분 이동: 충돌 시 멈춤 vs 미끄러짐 (collide and slide)',
  summary: '원을 이동 경로로 스윕해 처음 닿는 벽에서 멈추면 비스듬한 벽에 붙어 움직이지 못함. 남은 이동에서 벽 법선 성분을 빼고 다시 스윕하면 벽을 따라 미끄러져 목표에 도착.',
  views: { a: '충돌 시 멈춤', b: '미끄러짐 (collide and slide)' },
  controls: '←→↑↓ 또는 WASD: 흰 테두리 원 조종 (나머지 원은 오른쪽 목표로 자동 이동)',
  info: `
    <p>캐릭터 이동은 보통 <b>스윕</b>으로 처리. 원이 이번 프레임 이동 경로를 따라 움직일 때 벽에 처음 닿는 시각 t(0~1)를 구함.</p>
    <ul>
      <li>원 vs 선분 스윕 = 반지름만큼 두꺼워진 선분(캡슐)과 중심점 반직선의 교차</li>
      <li>평평한 면: 반지름만큼 밀어낸 직선과 교차</li>
      <li>끝점: 끝점을 중심으로 한 원과 교차</li>
    </ul>
    <p><b>충돌 시 멈춤</b>: 닿는 지점까지만 이동하고 남은 이동을 버림. 벽과 거의 평행하게 움직여도 멈춤. 그래서 비스듬한 벽에 한번 닿으면 붙어서 못 움직임.</p>
    <p><b>미끄러짐</b>(collide and slide):</p>
    <ol>
      <li>닿는 지점 바로 앞까지 이동</li>
      <li>남은 이동에서 벽 법선 방향 성분을 뺌. 벽과 평행한 성분만 남음.</li>
      <li>남은 이동으로 다시 스윕. 구석에서는 여러 벽에 차례로 닿으므로 몇 번 반복.</li>
    </ol>
    <p>단점: 반복 상한이 작으면 구석에서 남은 이동을 버림. 오목한 구석에서는 미끄러져도 갇힘. 이 샘플은 원끼리 충돌하지 않음.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 190" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    <marker id="arrb" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    <marker id="arrn" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <path d="M110,180 L290,20 L298,29 L118,189 Z" class="f-dim"/>
    <line x1="110" y1="180" x2="290" y2="20" class="d-line"/>
    <text x="300" y="24" class="t-small t-dim">${L('벽', 'wall')}</text>
    <circle cx="20" cy="110" r="14" class="d-dim"/>
    <text x="20" y="140" text-anchor="middle" class="t-small t-dim">${L('시작', 'start')}</text>
    <line x1="20" y1="110" x2="280" y2="110" class="d-dim" stroke-dasharray="4 3" marker-end="url(#arr)"/>
    <text x="40" y="103" class="t-small t-dim">${L('원하는 이동', 'desired move')}</text>
    <text x="196" y="126" class="t-small t-dim">${L('남은 이동 r', 'remaining r')}</text>
    <circle cx="167.7" cy="110" r="14" class="f-a" fill-opacity="0.25"/><circle cx="167.7" cy="110" r="14" class="d-a"/>
    <line x1="177" y1="120.5" x2="154.4" y2="95.1" class="d-accent" marker-end="url(#arrn)"/>
    <text x="146" y="92" class="t-small t-mono">n</text>
    <line x1="167.7" y1="110" x2="230.4" y2="54.2" class="d-b" marker-end="url(#arrb)"/>
    <circle cx="230.4" cy="54.2" r="14" class="d-b"/>
    <line x1="230.4" y1="54.2" x2="280" y2="110" class="d-dim" stroke-dasharray="2 3"/>
    <text x="258" y="78" class="t-small t-dim">${L('법선 성분 제거', 'normal part removed')}</text>
    <text x="380" y="44" class="t-a">${L('A: 닿은 곳에서 멈춤', 'A: stops at contact')}</text>
    <text x="380" y="58" class="t-small t-dim">${L('남은 이동은 버림', 'and drops the rest')}</text>
    <text x="380" y="88" class="t-b">${L('B: 벽을 따라 미끄러짐', 'B: slides along wall')}</text>
    <text x="380" y="102" class="t-small t-dim">${L('남은 이동에서 법선 성분 제거', 'removes the normal part')}</text>
    <text x="380" y="118" class="t-small t-mono">slide = r - (r.n) n</text>
    <text x="380" y="134" class="t-small t-dim">${L('구석에서는 몇 번 반복', 'repeats at corners')}</text>
  </svg>`,
  look: [
    '기본 상태에서 A는 원들이 비스듬한 벽에 붙어 멈춤(빨간 원). B는 벽을 따라 미끄러져 오른쪽 목표에 도착. "도착 수"를 비교.',
    'B의 "최대 반복 횟수"를 1로 낮추면 미끄러짐 없이 A와 같아짐. 2로 올리면 대부분의 경우가 해결됨.',
    '흰 테두리 원을 ↗ 방향으로 벽에 비스듬히 밀면 A는 멈추고 B는 벽을 따라 움직임',
    '"이동 효율"은 실제 이동 거리를 원하는 이동 거리로 나눈 값. B는 벽을 따라가며 속도가 줄 뿐 0이 되지 않음.',
  ],
  refs: [
    { type: 'paper', title: 'Improved Collision detection and Response (Kasper Fauerby)', year: 2003, note: '타원체 스윕과 재귀 미끄러짐 응답. 반복 상한 5.' },
    { type: 'paper', title: 'Generic Collision Detection for Games Using Ellipsoids (Paul Nettle)', year: 2000, note: '스윕 구 충돌과 슬라이딩 평면의 초기 정리' },
    { type: 'book', title: 'Real-Time Collision Detection, 5.5 Intersection of Moving Objects (Christer Ericson)', year: 2005, note: '움직이는 구 vs 평면, 선분 스윕' },
    { type: 'engine', title: 'Godot CharacterBody2D.move_and_slide', url: 'https://docs.godotengine.org/en/stable/classes/class_characterbody2d.html', note: 'max_slides(기본 4)로 반복 상한을 정함' },
  ],
  params: [
    { key: 'bots', label: '원 개수', type: 'int', min: 1, max: 60, default: 24, shared: true, reset: true, group: '장면' },
    { key: 'speed', label: '이동 속도', type: 'range', min: 20, max: 400, step: 5, default: 120, shared: true },
    { key: 'radius', label: '반지름', type: 'range', min: 4, max: 20, step: 1, default: 9, shared: true },
    { key: 'mode', label: '충돌 응답', type: 'select', group: '이동', options: [
      { value: 'stop', label: '충돌 시 멈춤' },
      { value: 'slide', label: '미끄러짐 (collide and slide)' },
    ], a: 'stop', b: 'slide', default: 'stop' },
    { key: 'iters', label: '최대 반복 횟수', type: 'int', min: 1, max: 6, default: 4, help: '한 프레임에 스윕을 다시 하는 최대 횟수', when: (p) => p.mode === 'slide' },
    { key: 'showNormals', label: '접촉 법선 표시', type: 'bool', default: true },
  ],
  en: {
    title: 'Circle vs Segment Movement: Stop vs Slide (Collide and Slide)',
    summary: 'If you sweep a circle along its path and stop at the first wall it touches, it sticks to slanted walls and cannot move. Remove the wall normal part from the leftover motion and sweep again. The circle slides along the wall and reaches the goal.',
    views: { a: 'Stop on hit', b: 'Slide (collide and slide)' },
    controls: '←→↑↓ or WASD: steer the white-outlined circle (other circles move to the goal on the right on their own)',
    info: `
    <p>Character movement is usually done with a <b>sweep</b>. As the circle moves along this frame's path, find the time t (0~1) when it first touches a wall.</p>
    <ul>
      <li>Circle vs segment sweep = intersect the center ray with the segment thickened by the radius (a capsule).</li>
      <li>Flat side: intersect with the line pushed out by the radius.</li>
      <li>End point: intersect with a circle centered on the end point.</li>
    </ul>
    <p><b>Stop on hit</b>: move only up to the touch point and throw away the rest. It stops even when moving almost parallel to the wall. So once it touches a slanted wall, it sticks and cannot move.</p>
    <p><b>Slide</b> (collide and slide):</p>
    <ol>
      <li>Move to just before the touch point.</li>
      <li>Remove the wall normal part from the leftover motion. Only the part parallel to the wall remains.</li>
      <li>Sweep again with the leftover motion. In a corner it touches several walls in turn, so repeat a few times.</li>
    </ol>
    <p>Downsides: with a small iteration limit, leftover motion is thrown away in corners. In a concave corner, the circle gets trapped even with sliding. In this sample, circles do not collide with each other.</p>`,
    look: [
      'In the default state, circles in A stick to slanted walls and stop (red circles). In B they slide along the walls and reach the goal on the right. Compare "Arrived".',
      'Lower B\'s "Max iterations" to 1. There is no sliding, so it acts like A. Raise it to 2 and most cases are solved.',
      'Push the white-outlined circle into a wall at a slant, toward ↗. A stops. B moves along the wall.',
      '"Move efficiency" is the real distance moved divided by the wanted distance. In B the speed drops along walls, but it never reaches 0.',
    ],
    refs: [
      'Ellipsoid sweep and recursive sliding response. Iteration limit of 5.',
      'An early write-up of swept sphere collision and sliding planes.',
      'Moving sphere vs plane, and segment sweeps.',
      'max_slides (default 4) sets the iteration limit.',
    ],
    params: {
      bots: { label: 'Circle count', group: 'Scene' },
      speed: 'Move speed',
      radius: 'Radius',
      mode: { label: 'Collision response', group: 'Movement', options: { stop: 'Stop on hit', slide: 'Slide (collide and slide)' } },
      iters: { label: 'Max iterations', help: 'Max number of re-sweeps in one frame' },
      showNormals: 'Show contact normals',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 640, WH = 400, SKIN = 0.05;
    // 벽 선분 (월드 좌표 640x400)
    const walls = [];
    const loop = (pts) => { for (let i = 0; i < pts.length; i++) walls.push([...pts[i], ...pts[(i + 1) % pts.length]]); };
    const seg = (x0, y0, x1, y1) => walls.push([x0, y0, x1, y1]);
    loop([[10, 10], [630, 10], [630, 390], [10, 390]]);
    seg(140, 40, 250, 190); seg(140, 360, 250, 225);
    loop([[340, 120], [395, 200], [340, 280], [300, 200]]);
    seg(470, 200, 560, 110); seg(470, 200, 560, 290);

    let bots, stats, contacts;
    function spawn(b) { b.x = ctx.rng.range(25, 90); b.y = ctx.rng.range(25, 375); b.eff = 1; b.stuckT = 0; b.bias = ctx.rng.range(-0.35, 0.35); }
    function init() {
      ctx.rng = U.rng(ctx.seed);
      bots = [];
      for (let i = 0; i <= P.bots; i++) { const b = { player: i === 0 }; spawn(b); if (b.player) { b.x = 60; b.y = 200; } bots.push(b); }
      stats = { arrived: 0, respawn: 0, iterSum: 0, iterN: 0, effSum: 1, pen: 0 };
      contacts = [];
    }
    init();

    // 원(중심 c, 반지름 r)을 d만큼 스윕했을 때 처음 닿는 선분. { t, nx, ny } 또는 null
    function sweep(cx, cy, dx, dy, r) {
      let best = null;
      const consider = (t, nx, ny) => { if (!best || t < best.t) best = { t, nx, ny }; };
      for (const [ax, ay, bx, by] of walls) {
        const ex = bx - ax, ey = by - ay, L = Math.hypot(ex, ey), ux = ex / L, uy = ey / L;
        // 면: 원이 있는 쪽을 향하는 법선
        let nx = -uy, ny = ux, s0 = (cx - ax) * nx + (cy - ay) * ny;
        if (s0 < 0) { nx = -nx; ny = -ny; s0 = -s0; }
        const ds = dx * nx + dy * ny;
        if (ds < 0) {
          const t = Math.max(0, (s0 - r) / -ds);
          if (t <= 1) {
            const px = cx + dx * t, py = cy + dy * t, proj = (px - ax) * ux + (py - ay) * uy;
            if (proj >= 0 && proj <= L) consider(t, nx, ny);
          }
        }
        // 끝점
        for (const [qx, qy] of [[ax, ay], [bx, by]]) {
          const fx = cx - qx, fy = cy - qy, a2 = dx * dx + dy * dy, b = 2 * (fx * dx + fy * dy), c = fx * fx + fy * fy - r * r;
          if (a2 < 1e-12 || b >= 0) continue; // 멀어지는 중
          if (c < 0) { const l = Math.hypot(fx, fy) || 1; consider(0, fx / l, fy / l); continue; }
          const disc = b * b - 4 * a2 * c;
          if (disc < 0) continue;
          const t = (-b - Math.sqrt(disc)) / (2 * a2);
          if (t >= 0 && t <= 1) { const hx = fx + dx * t, hy = fy + dy * t, l = Math.hypot(hx, hy) || 1; consider(t, hx / l, hy / l); }
        }
      }
      return best;
    }

    // 침투 안전장치: 겹친 벽에서 밀어냄. 겹침이 있었으면 true
    function depenetrate(b, r) {
      let hit = false;
      for (const [ax, ay, bx, by] of walls) {
        const ex = bx - ax, ey = by - ay, t = U.clamp(((b.x - ax) * ex + (b.y - ay) * ey) / (ex * ex + ey * ey), 0, 1);
        const qx = ax + ex * t, qy = ay + ey * t, dx = b.x - qx, dy = b.y - qy, d = Math.hypot(dx, dy);
        if (d < r - 0.5 && d > 1e-6) { b.x = qx + (dx / d) * r; b.y = qy + (dy / d) * r; hit = true; }
      }
      return hit;
    }

    function move(b, dx, dy) {
      const r = P.radius, maxIter = P.mode === 'slide' ? P.iters : 1;
      let rx = dx, ry = dy, it = 0;
      for (; it < maxIter; it++) {
        const len = Math.hypot(rx, ry);
        if (len < 1e-6) break;
        const h = sweep(b.x, b.y, rx, ry, r);
        if (!h) { b.x += rx; b.y += ry; rx = ry = 0; it++; break; }
        const t = Math.max(0, h.t - SKIN / len);
        b.x += rx * t; b.y += ry * t;
        contacts.push([b.x - h.nx * r, b.y - h.ny * r, h.nx, h.ny]);
        rx *= 1 - t; ry *= 1 - t;
        if (P.mode === 'stop') { rx = ry = 0; it++; break; }
        const dn = rx * h.nx + ry * h.ny; // 법선 성분 제거
        rx -= dn * h.nx; ry -= dn * h.ny;
      }
      return it;
    }

    return {
      update(dt) {
        contacts = [];
        const sp = P.speed;
        const kb = ctx.input;
        for (const b of bots) {
          let vx, vy;
          if (b.player) {
            vx = (kb.key('ArrowRight') || kb.key('KeyD') ? 1 : 0) - (kb.key('ArrowLeft') || kb.key('KeyA') ? 1 : 0);
            vy = (kb.key('ArrowDown') || kb.key('KeyS') ? 1 : 0) - (kb.key('ArrowUp') || kb.key('KeyW') ? 1 : 0);
            const l = Math.hypot(vx, vy); if (l) { vx /= l; vy /= l; }
          } else {
            // 오른쪽으로 가되 원마다 위아래 기울기가 조금 다름
            const l = Math.hypot(1, b.bias); vx = 1 / l; vy = b.bias / l;
          }
          const want = sp * dt * Math.hypot(vx, vy);
          const x0 = b.x, y0 = b.y;
          const it = move(b, vx * sp * dt, vy * sp * dt);
          if (depenetrate(b, P.radius)) stats.pen++;
          if (want > 0 && !b.player) {
            const e = Math.hypot(b.x - x0, b.y - y0) / want;
            b.eff = b.eff * 0.9 + e * 0.1;
            stats.effSum = stats.effSum * 0.98 + e * 0.02;
            stats.iterSum += it; stats.iterN++;
            b.stuckT = b.eff < 0.05 ? b.stuckT + dt : 0;
            if (b.x > 575) { stats.arrived++; spawn(b); }
            else if (b.stuckT > 5) { stats.respawn++; spawn(b); }
          }
        }
      },
      render() {
        ctx.clearStats();
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const S = Math.min(W / WW, H / WH), ox = (W - WW * S) / 2, oy = (H - WH * S) / 2;
        const X = (x) => ox + x * S, Y = (y) => oy + y * S;
        const col = ctx.side === 'a' ? C.a : C.b, r = P.radius * S;
        D.rect(g, X(575), Y(10), (630 - 575) * S, 380 * S, 'rgba(195,232,141,0.08)', null);
        D.text(g, GTL.L('목표', 'Goal'), X(585), Y(18), { color: C.good, size: 11 });
        g.beginPath();
        for (const [ax, ay, bx, by] of walls) { g.moveTo(X(ax), Y(ay)); g.lineTo(X(bx), Y(by)); }
        g.strokeStyle = '#8b93a5'; g.lineWidth = 3; g.lineCap = 'round'; g.stroke(); g.lineCap = 'butt';
        for (const b of bots) {
          const stuck = !b.player && b.eff < 0.05;
          D.circle(g, X(b.x), Y(b.y), r, stuck ? C.bad : col, b.player ? '#fff' : 'rgba(0,0,0,0.4)', b.player ? 2 : 1);
          if (!b.player) {
            const l = Math.hypot(1, b.bias), k = (P.radius + 8) / l;
            D.line(g, X(b.x), Y(b.y), X(b.x + k), Y(b.y + b.bias * k), 'rgba(255,255,255,0.45)', 1);
          }
        }
        if (P.showNormals) {
          g.beginPath();
          for (const [px, py, nx, ny] of contacts) { g.moveTo(X(px), Y(py)); g.lineTo(X(px + nx * 14), Y(py + ny * 14)); }
          g.strokeStyle = C.warn; g.lineWidth = 1.5; g.stroke();
        }
        let stuck = 0;
        for (const b of bots) if (!b.player && b.eff < 0.05) stuck++;
        ctx.stat(GTL.L('도착 수', 'Arrived'), stats.arrived);
        ctx.stat(GTL.L('지금 막힌 원', 'Stuck now'), stuck);
        ctx.stat(GTL.L('막혀서 재시작', 'Respawned after stuck'), stats.respawn);
        ctx.stat(GTL.L('이동 효율', 'Move efficiency'), (stats.effSum * 100).toFixed(0) + ' %');
        ctx.stat(GTL.L('평균 스윕 횟수', 'Average sweeps'), stats.iterN ? (stats.iterSum / stats.iterN).toFixed(2) : '0');
        ctx.stat(GTL.L('침투 보정', 'Penetration fixes'), stats.pen);
      },
    };
  },
});
