// 드렁커드 워크(무작위 보행) 동굴: 단일 워커 vs 다중 워커 + 수명/재생성
GTL.register({
  id: 'drunkard-walk',
  title: '드렁커드 워크 (Random Walk) 동굴',
  summary: '단일 워커 vs 다중 워커 + 수명 비교. 무작위로 걷는 워커가 지나간 칸을 파내면 동굴이 됨. 워커 수, 수명, 방향 유지 확률로 "긴 줄기"와 "뭉친 동굴" 사이를 조절.',
  views: { a: '단일 워커', b: '다중 워커 + 수명' },
  controls: '조작 없음. "다시 생성"을 누르면 새 시드로 만듦.',
  info: `
    <p><b>드렁커드 워크</b>: 취객처럼 무작위로 걷는 "워커"가 지나간 칸을 파내는 방식.
    워커는 중앙에서 출발해 매 스텝 상하좌우 중 한 방향으로 움직임. 목표 바닥 비율에 도달하면 멈춤.</p>
    <p>장점: 워커가 판 칸은 모두 이어져 있음. 그래서 <b>연결성이 보장</b>됨. 셀룰러 오토마타 동굴과 달리 후처리 필요 없음.
    단점: 모양을 제어하기 어려움.</p>
    <ul>
      <li><b>단일 워커</b>: 한 줄기로 멀리 떠돌아 맵 가장자리까지 가늘고 긴 동굴이 되기 쉬움. 결과마다 편차가 큼.</li>
      <li><b>다중 워커 + 수명</b>: 워커가 일정 스텝 후 <b>기존 바닥의 임의 지점에서 다시 출발</b>. 짧은 가지가 중심부에 겹겹이 붙어 뭉친 동굴이 됨.
      모양은 예측하기 쉬워지지만, 이미 판 곳에서 다시 출발하므로 <b>스텝 효율이 떨어짐</b>.</li>
      <li><b>방향 유지 확률</b>: 높이면 직선 터널이 길어지고 재방문이 줄어 효율이 오름. 낮추면 둥글게 뭉침.</li>
    </ul>`,
  // 도식: 단일 워커의 긴 한 줄기 vs 수명이 다하면 기존 바닥에서 다시 출발하는 다중 워커
  diagram: (L) => `<svg viewBox="0 0 540 170" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="16" class="t-a">${L('단일 워커', 'Single walker')}</text>
    <rect x="10" y="24" width="250" height="110" rx="4" class="f-dim"/>
    <path d="M70,100 L80,100 L80,90 L100,90 L100,100 L120,100 L120,80 L140,80 L140,70 L170,70 L170,60 L190,60 L190,50 L220,50 L220,40 L240,40 L240,32" class="d-a"/>
    <circle cx="70" cy="100" r="4" class="f-accent"/>
    <text x="70" y="120" text-anchor="middle" class="t-small t-dim">${L('시작', 'start')}</text>
    <text x="10" y="150" class="t-small t-dim">${L('한 줄기로 멀리 떠돌아 가늘고 긴 동굴', 'One strand drifts far: a long thin cave')}</text>
    <text x="280" y="16" class="t-b">${L('다중 워커 + 수명', 'Multiple walkers + lifetime')}</text>
    <rect x="280" y="24" width="250" height="110" rx="4" class="f-dim"/>
    <path d="M405,80 L425,80 L425,70 L445,70" class="d-b"/>
    <path d="M425,80 L425,100 L415,100 L415,110 L400,110" class="d-b"/>
    <path d="M405,80 L395,80 L395,60 L380,60" class="d-b"/>
    <path d="M415,100 L395,100 L395,90 L375,90" class="d-b"/>
    <path d="M395,60 L405,60 L405,50 L425,50" class="d-b"/>
    <circle cx="405" cy="80" r="4" class="f-accent"/>
    <circle cx="425" cy="80" r="3" class="f-b"/><circle cx="415" cy="100" r="3" class="f-b"/><circle cx="395" cy="60" r="3" class="f-b"/>
    <text x="460" y="104" class="t-small t-dim">${L('파란 점:', 'blue dot:')}</text>
    <text x="460" y="116" class="t-small t-dim">${L('재출발', 'respawn')}</text>
    <text x="280" y="150" class="t-small t-dim">${L('수명이 다하면 기존 바닥에서 재출발', 'Life ends: respawn on existing floor')}</text>
    <text x="280" y="163" class="t-small t-dim">${L('중심에 뭉친 동굴, 재방문이 늘어 효율 하락', 'Compact cave, but more revisits')}</text>
  </svg>`,
  look: [
    '"다시 생성"을 여러 번 누르며 "중심에서 평균 거리"를 보면 A는 맵 끝까지 퍼지고 편차가 큼. B는 중심에 모임.',
    '히트맵(밝을수록 자주 방문)을 켜면 B의 중심부가 밝음. 재출발 때문이며, "스텝 효율"이 A보다 낮은 것이 그 비용임.',
    '방향 유지 확률을 0.8로 올리면 두 뷰 모두 복도형 터널이 되고 스텝 효율이 오름. 0으로 낮추면 둥근 덩어리가 됨.',
    'B의 수명을 0(무한)으로 두면 워커마다 멀리 떠돌아 A와 비슷한 줄기 모양이 됨. 수명 30~100에서는 뭉친 가지 모양이 됨.',
  ],
  refs: [
    { type: 'article', title: 'RogueBasin: Random Walk Cave Generation', url: 'https://www.roguebasin.com/index.php/Random_Walk_Cave_Generation' },
    { type: 'book', title: 'Procedural Content Generation in Games (Shaker, Togelius, Nelson), 3장 Agent-based dungeon growing', url: 'https://www.pcgbook.com/', year: 2016 },
    { type: 'game', title: 'Nuclear Throne (Vlambeer, 2015)', note: '여러 "floor maker" 워커가 무작위로 걸으며 레벨을 파내는 방식으로 알려짐' },
    { type: 'game', title: 'Spelunky / Brogue', note: '로그라이크 지형에 에이전트 기반 굴착 변형을 자주 씀' },
  ],
  params: [
    { key: 'walkers', label: '워커 수', type: 'int', min: 1, max: 16, a: 1, b: 6, group: '워커' },
    { key: 'life', label: '수명 (스텝, 0=무한)', type: 'int', min: 0, max: 400, a: 0, b: 60, help: '수명이 다하면 기존 바닥의 임의 칸에서 다시 출발' },
    { key: 'keepDir', label: '방향 유지 확률', type: 'range', min: 0, max: 0.95, step: 0.01, default: 0.4 },
    { key: 'target', label: '목표 바닥 비율 (%)', type: 'range', min: 5, max: 70, step: 1, default: 35, shared: true, group: '맵' },
    { key: 'cell', label: '칸 크기 (px)', type: 'int', min: 3, max: 14, default: 6, shared: true },
    { key: 'speed', label: '속도 (스텝/초)', type: 'range', min: 50, max: 20000, step: 50, default: 2500, shared: true, group: '표시' },
    { key: 'heat', label: '방문 히트맵', type: 'bool', default: true, shared: true },
    { key: 'regen', label: '다시 생성', type: 'button', buttonLabel: '다시 생성 (새 시드)' },
  ],
  en: {
    title: "Drunkard's Walk (Random Walk) Caves",
    summary: 'Single walker vs multiple walkers with a lifespan. A walker moves at random and digs out every cell it passes, which makes a cave. Walker count, lifespan, and the chance to keep direction tune the result between "long strands" and "clumped caves".',
    views: { a: 'Single walker', b: 'Multiple walkers + lifespan' },
    controls: 'No input. Press "Regenerate" to build with a new seed.',
    info: `
    <p>In a <b>drunkard\'s walk</b>, a "walker" moves at random like a drunk person and digs out every cell it passes.
    The walker starts in the center and moves up, down, left, or right each step. It stops when it reaches the target floor ratio.</p>
    <p>Upside: all cells a walker digs are linked. So <b>connectivity is guaranteed</b>. Unlike cellular automata caves, you need no cleanup.
    Downside: the shape is hard to control.</p>
    <ul>
      <li><b>Single walker</b>: wanders far in one strand, so the cave often gets thin and long, reaching the map edge. Results vary a lot.</li>
      <li><b>Multiple walkers + lifespan</b>: after a set number of steps, a walker <b>restarts from a random point on existing floor</b>. Short branches stack around the center and form a clumped cave.
      The shape is easier to predict, but restarting from dug cells <b>lowers step efficiency</b>.</li>
      <li><b>Keep direction chance</b>: raise it and straight tunnels get longer, revisits drop, and efficiency rises. Lower it and the cave clumps into round shapes.</li>
    </ul>`,
    look: [
      'Press "Regenerate" several times and watch "Mean distance from center". A spreads to the map edge and varies a lot. B gathers in the center.',
      'Turn on the heat map (brighter means more visits). B\'s center is bright. This comes from restarts, and the lower "Step efficiency" than A is the cost.',
      'Raise the keep direction chance to 0.8. Both views become corridor-like tunnels and step efficiency rises. Lower it to 0 and you get round blobs.',
      'Set B\'s lifespan to 0 (infinite). Each walker wanders far and you get strands like A. With a lifespan of 30~100 you get clumped branches.',
    ],
    refs: [null, { title: 'Procedural Content Generation in Games (Shaker, Togelius, Nelson), Chapter 3 Agent-based dungeon growing' }, 'Known for several "floor maker" walkers that walk at random and dig out the level.', 'Roguelikes that often use agent-based digging variants for terrain.'],
    params: {
      walkers: { label: 'Walkers', group: 'Walkers' },
      life: { label: 'Lifespan (steps, 0 = infinite)', help: 'When the lifespan ends, the walker restarts from a random floor cell.' },
      keepDir: 'Keep direction chance',
      target: { label: 'Target floor ratio (%)', group: 'Map' },
      cell: 'Cell size (px)',
      speed: { label: 'Speed (steps/s)', group: 'Display' },
      heat: 'Visit heat map',
      regen: { label: 'Regenerate', buttonLabel: 'Regenerate (new seed)' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
    let regen = 0, key = '', mw = 0, mh = 0, visits = null, floorList = [], walkers = [], steps = 0, budget = 0, rng = null, done = false, maxV = 1;
    const buf = { cv: null, g: null, img: null };

    function reset(W, H) {
      mw = Math.max(16, Math.floor(W / P.cell)); mh = Math.max(12, Math.floor(H / P.cell));
      visits = new Uint32Array(mw * mh);
      floorList = []; walkers = []; steps = 0; budget = 0; done = false; maxV = 1;
      rng = U.rng(ctx.seed * 6151 + regen * 2833 + 17);
      const cx = mw >> 1, cy = mh >> 1;
      dig(cx, cy);
      for (let i = 0; i < P.walkers; i++) walkers.push({ x: cx, y: cy, dir: rng.int(0, 3), age: 0 });
      if (!buf.cv || buf.cv.width !== mw || buf.cv.height !== mh) {
        buf.cv = ctx.createCanvas(mw, mh); buf.g = buf.cv.getContext('2d'); buf.img = buf.g.createImageData(mw, mh);
      }
    }
    function dig(x, y) {
      const i = y * mw + x;
      if (visits[i] === 0) floorList.push(i);
      visits[i]++;
      if (visits[i] > maxV) maxV = visits[i];
    }
    function stepWalker(w) {
      if (rng.next() >= P.keepDir) w.dir = rng.int(0, 3);
      let nx = w.x + DX[w.dir], ny = w.y + DY[w.dir];
      if (nx < 1 || ny < 1 || nx > mw - 2 || ny > mh - 2) { w.dir = (w.dir + 2) % 4; nx = w.x + DX[w.dir]; ny = w.y + DY[w.dir]; }
      w.x = nx; w.y = ny; w.age++;
      dig(nx, ny);
      steps++;
      if (P.life > 0 && w.age >= P.life) {
        const i = floorList[Math.floor(rng.next() * floorList.length)];
        w.x = i % mw; w.y = (i / mw) | 0; w.age = 0; w.dir = rng.int(0, 3);
      }
    }
    const goal = () => Math.ceil(mw * mh * P.target / 100);

    return {
      update(dt) {
        const W = ctx.width, H = ctx.height;
        const k = [P.walkers, P.life, P.cell, regen, W, H].join('|');
        if (k !== key) { reset(W, H); key = k; }
        if (done) { if (floorList.length < goal()) done = false; else return; }
        budget += P.speed * dt;
        const g = goal();
        let guard = 200000;
        while (budget >= 1 && floorList.length < g && guard-- > 0) {
          for (const w of walkers) { stepWalker(w); budget--; if (floorList.length >= g) break; }
        }
        if (floorList.length >= g) { done = true; budget = 0; }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        if (!visits) { reset(W, H); key = [P.walkers, P.life, P.cell, regen, W, H].join('|'); }
        const d = buf.img.data, lm = Math.log(maxV + 1);
        for (let i = 0; i < mw * mh; i++) {
          const v = visits[i], o = i * 4;
          if (!v) { d[o] = 22; d[o + 1] = 20; d[o + 2] = 26; }
          else if (P.heat) {
            const t = Math.log(v + 1) / lm;
            d[o] = 60 + 195 * U.clamp(t * 1.6, 0, 1); d[o + 1] = 40 + 215 * U.clamp(t * 1.6 - 0.5, 0, 1); d[o + 2] = 70 + 185 * U.clamp(t * 2 - 1.2, 0, 1);
          } else { d[o] = 180; d[o + 1] = 160; d[o + 2] = 125; }
          d[o + 3] = 255;
        }
        buf.g.putImageData(buf.img, 0, 0);
        const T = Math.min(W / mw, H / mh), ox = (W - mw * T) / 2, oy = (H - mh * T) / 2;
        g.imageSmoothingEnabled = false;
        g.drawImage(buf.cv, ox, oy, mw * T, mh * T);
        g.imageSmoothingEnabled = true;
        const col = ctx.side === 'a' ? C.a : C.b;
        if (!done) for (const w of walkers) D.circle(g, ox + (w.x + 0.5) * T, oy + (w.y + 0.5) * T, Math.max(2.5, T * 0.6), col, '#000', 1);
        D.text(g, done ? GTL.L('완료', 'Done') : GTL.L('파는 중…', 'Digging…'), 8, 8, { color: done ? C.good : col });
        const fl = floorList.length;
        ctx.stat(GTL.L('바닥 비율', 'Floor ratio'), ((fl / (mw * mh)) * 100).toFixed(1) + GTL.L(` % / 목표 ${P.target}%`, ` % / target ${P.target}%`));
        ctx.stat(GTL.L('총 스텝', 'Total steps'), steps);
        ctx.stat(GTL.L('스텝 효율 (새 칸 / 스텝)', 'Step efficiency (new cells / steps)'), steps ? (fl / steps * 100).toFixed(1) + ' %' : '-');
        ctx.stat(GTL.L('최다 방문 칸', 'Most visits on one cell'), maxV + GTL.L('회', 'x'));
        let sd = 0; const cx = mw >> 1, cy = mh >> 1;
        for (const i of floorList) sd += Math.hypot((i % mw) - cx, ((i / mw) | 0) - cy);
        ctx.stat(GTL.L('중심에서 평균 거리', 'Mean distance from center'), fl ? (sd / fl).toFixed(1) + GTL.L('칸', ' cells') : '-');
      },
      onAction(key) { if (key === 'regen') regen++; },
    };
  },
});
