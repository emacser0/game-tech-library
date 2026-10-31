// 타일맵 충돌 해결 순서: 동시 최소 침투 vs 축 분리 vs 축별 스윕
GTL.register({
  id: 'tilemap-resolution',
  title: '타일맵 충돌 해결: 축 분리와 모서리 걸림',
  summary: 'X, Y를 한꺼번에 움직이고 "덜 겹친 방향"으로 밀어내면 두 문제가 생김. 평평한 바닥의 타일 이음매에 걸리고(모서리 걸림), 빠르면 벽을 뚫음. 축을 나눠 X 이동 후 해결, Y 이동 후 해결하고 이동 구간을 스윕하면 둘 다 사라짐.',
  views: { a: '동시 이동 + 최소 침투', b: '축별 스윕' },
  controls: '←→: 흰 테두리 봇 조종, ↑ 또는 Space: 점프 (나머지 봇은 자동)',
  info: `
    <p>타일맵 플랫포머에서 가장 흔한 실수는 <b>동시 이동 + 최소 침투</b> 방식. 위치에 속도를 한 번에 더하고, 겹친 타일마다 <b>침투가 작은 축</b>으로 밀어냄.</p>
    <p>이 방식은 <b>모서리 걸림</b>(corner snagging)을 일으킴.</p>
    <ul>
      <li>봇이 떨어지며 옆으로 이동해 두 바닥 타일에 걸쳐 착지함.</li>
      <li>새로 들어간 타일과는 X 겹침이 Y 겹침보다 작을 수 있음.</li>
      <li>그래서 봇이 <b>옆으로 밀려남</b>. 평평한 바닥인데 벽에 부딪힌 것처럼 멈춤.</li>
    </ul>
    <p>결과가 <b>타일을 순회하는 순서</b>에 따라 달라지는 것도 문제. 이 샘플에서는 왼쪽으로 달릴 때 더 자주 걸림.</p>
    <p><b>축 분리</b>: X만 움직이고 X 충돌을 해결함(이동 반대 방향으로 밀기). 그다음 Y만 움직이고 해결함. 이음매 문제가 사라짐.
    단, 한 프레임에 벽 두께 이상 움직이면 여전히 관통함.</p>
    <p><b>축별 스윕</b>: 이동할 구간의 타일 열이나 행을 앞에서부터 검사해 첫 벽에서 멈춤. 속도와 관계없이 관통하지 않음.
    많은 2D 엔진의 타일 충돌이 이 계열. 예: Celeste와 TowerFall의 픽셀 단위 이동, Flixel과 Phaser의 축 분리.</p>`,
  diagram: (L) => {
    const tiles = (ox) => [0, 1, 2].map((i) => `<rect x="${ox + 40 + i * 50}" y="110" width="50" height="40" class="f-dim"/>`).join('');
    return `<svg viewBox="0 0 540 188" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="arr-a" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="arr-b" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    </defs>
    ${tiles(0)}
    <rect x="100" y="72" width="30" height="30" class="d-dim" stroke-dasharray="4 3"/>
    <path d="M115,87 L101,103" class="d-dim" marker-end="url(#arr)"/>
    <rect x="84" y="90" width="30" height="30" class="d-a"/>
    <rect x="84" y="110" width="6" height="10" class="f-a"/>
    <path d="M118,100 L138,100" class="d-a" marker-end="url(#arr-a)"/>
    <text x="142" y="98" class="t-small t-a">${L('옆으로 밀림', 'pushed sideways')}</text>
    ${tiles(270)}
    <rect x="370" y="72" width="30" height="30" class="d-dim" stroke-dasharray="4 3"/>
    <rect x="354" y="72" width="30" height="30" class="d-b" stroke-dasharray="4 3" stroke-width="1.2"/>
    <path d="M386,64 L356,64" class="d-b" marker-end="url(#arr-b)"/><text x="371" y="58" text-anchor="middle" class="t-small t-b">1</text>
    <rect x="354" y="80" width="30" height="30" class="d-b"/>
    <path d="M392,84 L392,106" class="d-b" marker-end="url(#arr-b)"/><text x="398" y="100" class="t-small t-b">2</text>
    <text x="20" y="166" class="t-small t-a">${L('A: 동시 이동 후 최소 침투 축으로 밀기', 'A: move both, push out on smallest overlap')}</text>
    <text x="20" y="180" class="t-small t-dim">${L('이음매에서 X로 밀려 걸림', 'At the seam, it is pushed on X and snags')}</text>
    <text x="290" y="166" class="t-small t-b">${L('B: X 이동 후 해결, Y 이동 후 해결', 'B: move X, resolve; then move Y, resolve')}</text>
    <text x="290" y="180" class="t-small t-dim">${L('X 단계는 안 겹침. Y 단계에서 위로 밀림', 'X step: no overlap. Y step: pushed up')}</text>
  </svg>`;
  },
  look: [
    'A에서 노란 ×를 보면 "걸림"이 보임. 평평한 바닥에서 봇이 갑자기 방향을 바꾸는 순간. B는 0을 유지함.',
    '달리기 속도를 60 이상으로 올리면 A가 얇은 기둥을 뚫음(빨간 원). B를 "축 분리 (스윕 없음)"로 바꾸고 110 이상으로 올리면 B도 뚫음.',
    '두 뷰의 "프레임당 검사 타일"을 비교하면 스윕 방식이 이동 거리만큼 타일을 더 많이 봄. 정확성의 비용.',
    '흰 테두리 봇을 ←로 달리며 점프와 착지를 반복하면 걸림을 직접 느낄 수 있음.',
  ],
  refs: [
    { type: 'article', title: 'The guide to implementing 2D platformers (Rodrigo Monteiro)', url: 'http://higherorderfun.com/blog/2012/05/20/the-guide-to-implementing-2d-platformers/', year: 2012, note: '타일 기반 충돌, 축 분리 이동, 경사로.' },
    { type: 'article', title: 'Celeste & TowerFall Physics (Maddy Thorson)', url: 'https://maddythorson.medium.com/celeste-and-towerfall-physics-d24bd2ae0fc5', year: 2019, note: '정수 픽셀 단위로 축마다 한 칸씩 이동하며 충돌 검사.' },
    { type: 'book', title: 'Real-Time Collision Detection, 5.5 Intersection of Moving Objects (Christer Ericson)', year: 2005 },
  ],
  params: [
    { key: 'bots', label: '봇 수', type: 'int', min: 1, max: 16, default: 8, shared: true, reset: true, group: '장면' },
    { key: 'run', label: '달리기 속도 (타일/초)', type: 'range', min: 2, max: 140, step: 1, default: 9, shared: true },
    { key: 'jumpRate', label: '자동 점프 빈도', type: 'range', min: 0, max: 3, step: 0.1, default: 1.2, shared: true },
    { key: 'method', label: '해결 방식', type: 'select', group: '충돌 해결', options: [
      { value: 'naive', label: '동시 이동 + 최소 침투 축' },
      { value: 'axis', label: '축 분리 (스윕 없음)' },
      { value: 'swept', label: '축별 스윕' },
    ], a: 'naive', b: 'swept' },
    { key: 'trails', label: '궤적 표시', type: 'bool', default: true },
  ],
  en: {
    title: 'Tilemap Collision Resolution: Axis Separation and Edge Snagging',
    summary: 'If you move X and Y together and push out along the "less overlapped" axis, two problems appear. Bots catch on tile seams in a flat floor (corner snagging), and fast bots pass through walls. Split the axes: move X and resolve, then move Y and resolve, and sweep the path. Both problems go away.',
    views: { a: 'Move together + min penetration', b: 'Per-axis sweep' },
    controls: '←→: steer the white-outlined bot, ↑ or Space: jump (other bots move on their own)',
    info: `
    <p>The most common mistake in tilemap platformers is <b>moving together + min penetration</b>. You add velocity to the position in one step. Then for each overlapped tile, you push out along <b>the axis with less penetration</b>.</p>
    <p>This causes <b>corner snagging</b>.</p>
    <ul>
      <li>A bot falls while moving sideways and lands across two floor tiles.</li>
      <li>For the newly entered tile, the X overlap can be smaller than the Y overlap.</li>
      <li>So the bot <b>gets pushed sideways</b>. It stops as if it hit a wall, even on a flat floor.</li>
    </ul>
    <p>Another problem: the result depends on <b>the order you visit tiles</b>. In this sample, bots snag more often when running left.</p>
    <p><b>Axis separation</b>: move only X and resolve X collisions (push back against the motion). Then move only Y and resolve. The seam problem goes away.
    But if a bot moves more than a wall's thickness in one frame, it still passes through.</p>
    <p><b>Per-axis sweep</b>: test the tile columns or rows along the path from front to back, and stop at the first wall. It never passes through, at any speed.
    Tile collision in many 2D engines works this way. Examples: pixel-by-pixel movement in Celeste and TowerFall, and axis separation in Flixel and Phaser.</p>`,
    look: [
      'Look for yellow × marks in A. They show "Snags", the moments a bot suddenly turns on a flat floor. B stays at 0.',
      'Raise the run speed to 60 or more. A passes through thin pillars (red circles). Switch B to "Axis separation (no sweep)" and raise it to 110 or more. B passes through too.',
      'Compare "Tiles tested per frame" in both views. The sweep method checks more tiles, in line with the distance moved. This is the cost of accuracy.',
      'Run the white-outlined bot with ← while you jump and land again and again. You can feel the snag yourself.',
    ],
    refs: [
      'Tile-based collision, axis-separated movement, and slopes.',
      'Moves one whole pixel at a time on each axis and checks collision at every step.',
      null,
    ],
    params: {
      bots: { label: 'Bot count', group: 'Scene' },
      run: 'Run speed (tiles/s)',
      jumpRate: 'Auto jump rate',
      method: { label: 'Resolution method', group: 'Collision resolution', options: { naive: 'Move together + min penetration axis', axis: 'Axis separation (no sweep)', swept: 'Per-axis sweep' } },
      trails: 'Show trails',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const GW = 32, GH = 18, BW = 0.8, BH = 0.8, G = 60, JUMP = Math.sqrt(2 * G * 3.3), DT = 1 / 60, E = 1e-6;
    const map = new Uint8Array(GW * GH);
    const set = (x, y) => { if (x >= 0 && y >= 0 && x < GW && y < GH) map[y * GW + x] = 1; };
    for (let x = 0; x < GW; x++) { set(x, 0); set(x, GH - 1); }
    for (let y = 0; y < GH; y++) { set(0, y); set(GW - 1, y); }
    for (const [x0, x1, y] of [[5, 9, 4], [20, 24, 4], [3, 8, 8], [23, 28, 8], [12, 17, 10], [2, 7, 13], [19, 24, 13], [26, 29, 15]]) for (let x = x0; x <= x1; x++) set(x, y);
    for (const [x, y0, y1] of [[11, 5, 8], [21, 5, 8], [8, 10, 12], [15, 14, 16], [22, 14, 16], [28, 10, 12]]) for (let y = y0; y <= y1; y++) set(x, y);
    const solid = (x, y) => x < 0 || y < 0 || x >= GW || y >= GH || map[y * GW + x] === 1;

    let bots, events, acc, stats, tileChecks;
    function spawn(b) { b.x = 2 + ctx.rng.range(0, GW - 5); b.y = 1.2; b.vx = 0; b.vy = 0; }
    function init() {
      ctx.rng = U.rng(ctx.seed);
      bots = [];
      for (let i = 0; i < P.bots; i++) {
        const b = { dir: ctx.rng.chance(0.5) ? 1 : -1, jumpT: ctx.rng.range(0.2, 1.5), trail: [], ground: false };
        spawn(b); bots.push(b);
      }
      events = []; acc = 0; stats = { snag: 0, tunnel: 0 }; tileChecks = 0;
    }
    init();

    const event = (type, x, y) => { events.push({ type, x, y, t: 1.5 }); if (type === 'snag') stats.snag++; else stats.tunnel++; };

    function pushX(b, tx, ty, fromLeft) {
      b.x = fromLeft ? tx - BW : tx + 1;
      b.hitWall = true;
      // 걸림 판정: 미는 타일이 이어진 바닥의 일부(위는 비었고, 박스가 온 쪽 옆 타일도 벽)인데 옆으로 밀림
      if (!solid(tx, ty - 1) && solid(fromLeft ? tx - 1 : tx + 1, ty)) { b.snagged = true; event('snag', tx + (fromLeft ? 0 : 1), ty); }
    }
    function pushY(b, ty, fromTop) {
      if (fromTop) { b.y = ty - BH; if (b.vy > 0) b.vy = 0; b.ground = true; }
      else { b.y = ty + 1; if (b.vy < 0) b.vy = 0; }
    }
    function overlapTiles(b) {
      const out = [];
      for (let ty = Math.floor(b.y + E); ty <= Math.floor(b.y + BH - E); ty++)
        for (let tx = Math.floor(b.x + E); tx <= Math.floor(b.x + BW - E); tx++) { tileChecks++; if (solid(tx, ty)) out.push([tx, ty]); }
      return out;
    }
    const overl = (b, tx, ty) => b.x < tx + 1 - E && b.x + BW > tx + E && b.y < ty + 1 - E && b.y + BH > ty + E;

    function resolveNaive(b) {
      for (const [tx, ty] of overlapTiles(b)) {
        if (!overl(b, tx, ty)) continue; // 앞선 밀어내기로 이미 해결됨
        const ox = Math.min(b.x + BW - tx, tx + 1 - b.x), oy = Math.min(b.y + BH - ty, ty + 1 - b.y);
        if (ox < oy) pushX(b, tx, ty, b.x + BW / 2 < tx + 0.5);
        else pushY(b, ty, b.y + BH / 2 < ty + 0.5);
      }
    }
    function resolveAxis(b, axis, d) {
      for (const [tx, ty] of overlapTiles(b)) {
        if (!overl(b, tx, ty)) continue;
        if (axis === 'x') { if (d !== 0) pushX(b, tx, ty, d > 0); }
        else if (d !== 0) pushY(b, ty, d > 0);
      }
    }
    function sweepX(b, d) {
      const r0 = Math.floor(b.y + E), r1 = Math.floor(b.y + BH - E);
      if (d > 0) {
        const lead = b.x + BW, c0 = Math.floor(lead - E) + 1, c1 = Math.floor(lead + d - E);
        for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) { tileChecks++; if (solid(c, r)) { pushX(b, c, r, true); return; } }
      } else if (d < 0) {
        const lead = b.x, c0 = Math.floor(lead + E) - 1, c1 = Math.floor(lead + d + E);
        for (let c = c0; c >= c1; c--) for (let r = r0; r <= r1; r++) { tileChecks++; if (solid(c, r)) { pushX(b, c, r, false); return; } }
      }
      b.x += d;
    }
    function sweepY(b, d) {
      const c0 = Math.floor(b.x + E), c1 = Math.floor(b.x + BW - E);
      if (d > 0) {
        const lead = b.y + BH, r0 = Math.floor(lead - E) + 1, r1 = Math.floor(lead + d - E);
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { tileChecks++; if (solid(c, r)) { pushY(b, r, true); return; } }
      } else if (d < 0) {
        const lead = b.y, r0 = Math.floor(lead + E) - 1, r1 = Math.floor(lead + d + E);
        for (let r = r0; r >= r1; r--) for (let c = c0; c <= c1; c++) { tileChecks++; if (solid(c, r)) { pushY(b, r, false); return; } }
      }
      b.y += d;
    }

    function stepBot(b, i, dt) {
      const kb = ctx.input;
      if (i === 0 && (kb.key('ArrowLeft') || kb.key('ArrowRight'))) b.dir = kb.key('ArrowLeft') ? -1 : 1;
      b.jumpT -= dt;
      const wantJump = (i === 0 && (kb.key('Space') || kb.key('ArrowUp'))) || (P.jumpRate > 0 && b.jumpT <= 0);
      if (b.jumpT <= 0) b.jumpT = ctx.rng.range(0.3, 2.5) / Math.max(0.1, P.jumpRate);
      if (wantJump && b.ground) b.vy = -JUMP;
      b.vx = b.dir * P.run;
      b.vy = Math.min(b.vy + G * dt, 50);
      const px = b.x + BW / 2, py = b.y + BH / 2;
      b.ground = false; b.hitWall = false; b.snagged = false;
      const dx = b.vx * dt, dy = b.vy * dt;
      if (P.method === 'naive') { b.x += dx; b.y += dy; resolveNaive(b); }
      else if (P.method === 'axis') { b.x += dx; resolveAxis(b, 'x', dx); b.y += dy; resolveAxis(b, 'y', dy); }
      else { sweepX(b, dx); sweepY(b, dy); }
      if (b.hitWall) b.dir = -b.dir;
      // 관통 검사: 이전 중심 → 현재 중심 선분이 벽 타일 내부를 지났는지 확인
      const nx = b.x + BW / 2, ny = b.y + BH / 2, len = Math.hypot(nx - px, ny - py);
      const steps = Math.ceil(len / 0.1);
      for (let s = 1; s < steps; s++) {
        const qx = px + ((nx - px) * s) / steps, qy = py + ((ny - py) * s) / steps;
        if (solid(Math.floor(qx), Math.floor(qy))) { event('tunnel', qx, qy); break; }
      }
      if (b.x < 0 || b.y < 0 || b.x > GW || b.y > GH || solid(Math.floor(nx), Math.floor(ny))) spawn(b);
    }

    return {
      update(dt) {
        acc += dt;
        tileChecks = 0;
        let n = 0;
        while (acc >= DT && n < 8) {
          for (let i = 0; i < bots.length; i++) stepBot(bots[i], i, DT);
          acc -= DT; n++;
        }
        if (n >= 8) acc = 0;
        for (const b of bots) { b.trail.push(b.x + BW / 2, b.y + BH / 2); if (b.trail.length > 120) b.trail.splice(0, 2); }
        for (const e of events) e.t -= dt;
        events = events.filter((e) => e.t > 0);
        this._checks = tileChecks;
      },
      render() {
        ctx.clearStats();
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const T = Math.min(W / GW, H / GH), ox = (W - GW * T) / 2, oy = (H - GH * T) / 2;
        const col = ctx.side === 'a' ? C.a : C.b;
        g.beginPath();
        for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (map[y * GW + x]) g.rect(ox + x * T, oy + y * T, T, T);
        g.fillStyle = '#3a4150'; g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1; g.stroke(); // 타일 이음매
        bots.forEach((b, i) => {
          if (P.trails && b.trail.length > 3) {
            g.beginPath();
            for (let k = 0; k < b.trail.length; k += 2) {
              const X = ox + b.trail[k] * T, Y = oy + b.trail[k + 1] * T;
              const jump = k > 0 && Math.abs(b.trail[k] - b.trail[k - 2]) + Math.abs(b.trail[k + 1] - b.trail[k - 1]) > 4; // 리스폰
              if (k === 0 || jump) g.moveTo(X, Y); else g.lineTo(X, Y);
            }
            g.strokeStyle = ctx.side === 'a' ? 'rgba(255,122,89,0.25)' : 'rgba(79,195,247,0.25)'; g.lineWidth = 1; g.stroke();
          }
          D.rect(g, ox + b.x * T, oy + b.y * T, BW * T, BH * T, col, i === 0 ? '#fff' : null, 2);
        });
        for (const e of events) {
          const a = Math.min(1, e.t), X = ox + e.x * T, Y = oy + e.y * T;
          if (e.type === 'snag') { const s = 6; D.line(g, X - s, Y - s, X + s, Y + s, `rgba(255,203,107,${a})`, 3); D.line(g, X - s, Y + s, X + s, Y - s, `rgba(255,203,107,${a})`, 3); }
          else D.circle(g, X, Y, 8 + (1.5 - e.t) * 10, null, `rgba(255,83,112,${a})`, 3);
        }
        ctx.stat(GTL.L('걸림 (평지에서 옆으로 밀림)', 'Snags (pushed sideways on flat ground)'), stats.snag);
        ctx.stat(GTL.L('관통', 'Pass-through'), stats.tunnel);
        ctx.stat(GTL.L('프레임당 검사 타일', 'Tiles tested per frame'), this._checks || 0);
        ctx.stat(GTL.L('프레임당 이동 (타일)', 'Move per frame (tiles)'), (P.run / 60).toFixed(2));
      },
    };
  },
});
