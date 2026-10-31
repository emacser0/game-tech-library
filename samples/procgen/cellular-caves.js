// 셀룰러 오토마타 동굴: 무작위 채움 → B/S 규칙 반복 → 연결 영역 분석
GTL.register({
  id: 'cellular-caves',
  title: '셀룰러 오토마타 동굴',
  summary: '무작위로 채운 벽에 "이웃 벽이 많으면 벽, 적으면 빈칸" 규칙을 몇 번 반복하면 자연스러운 동굴이 됨. 반복 횟수와 출생/생존 임계값이 모양을 결정',
  single: true,
  controls: '조작 없음. "다시 생성"을 누르면 새 시드로 생성.',
  info: `
    <p><b>셀룰러 오토마타(CA)</b>: 칸마다 이웃 상태를 보고 다음 상태를 정하는 규칙을 반복하는 방식</p>
    <p>먼저 각 칸을 확률 <code>p</code>로 벽으로 채움. 세대마다 주변 8칸의 벽 개수 <code>n</code>을 셈.</p>
    <ul>
      <li><b>빈칸</b>: n ≥ 출생값이면 벽이 됨</li>
      <li><b>벽</b>: n ≥ 생존값이면 벽으로 남음</li>
    </ul>
    <p>대표 규칙은 "4-5 규칙"(출생 5, 생존 4). 다수결 필터처럼 작동. 고립된 점은 사라지고 경계는 매끄러워짐.</p>
    <p>단점: CA만으로는 <b>모든 빈칸이 이어진다는 보장이 없음.</b> 실전에서는 플러드 필로 영역을 찾음.
    그다음 가장 큰 영역만 남기거나 작은 영역을 터널로 이음.
    이 샘플은 영역마다 다른 색을 칠함. "가장 큰 영역만 남기기"로 후처리 결과를 보여줌.</p>`,
  // 도식: 주변 8칸의 벽 수로 다음 상태를 정하는 4-5 규칙, 무작위 채움이 반복 후 동굴이 되는 모습
  diagram: (L) => {
    const W = 26, H = 18, c = 4.8;
    let s = 1;
    const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
    let g = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.push(x === 0 || y === 0 || x === W - 1 || y === H - 1 || rnd() < 0.46 ? 1 : 0);
    const g0 = g.slice();
    for (let k = 0; k < 5; k++) {
      g = g.map((v, i) => {
        const x = i % W, y = (i / W) | 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const X = x + dx, Y = y + dy;
          n += (X < 0 || Y < 0 || X >= W || Y >= H) ? 1 : g[Y * W + X];
        }
        return v ? (n >= 4 ? 1 : 0) : (n >= 5 ? 1 : 0);
      });
    }
    const draw = (cells, ox, cls) => `<rect x="${ox}" y="36" width="${W * c}" height="${H * c}" class="f-dim"/>` +
      cells.map((v, i) => v ? `<rect x="${(ox + (i % W) * c).toFixed(1)}" y="${(36 + ((i / W) | 0) * c).toFixed(1)}" width="${c}" height="${c}" class="${cls}"/>` : '').join('');
    const nb = (oy, walls, center) => {
      let out = '';
      for (let i = 0; i < 9; i++) {
        const wall = i === 4 ? center : walls.includes(i);
        out += `<rect x="${12 + (i % 3) * 18}" y="${oy + ((i / 3) | 0) * 18}" width="18" height="18" class="${wall ? 'f-b' : 'f-dim'}"/>`;
      }
      return out + `<rect x="30" y="${oy + 18}" width="18" height="18" class="d-accent"/>`;
    };
    return `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="16">${L('규칙: 주변 8칸의 벽 수 n', 'Rule: n = walls among 8 neighbors')}</text>
    ${nb(30, [0, 1, 2, 3, 6], false)}
    <text x="76" y="44" class="t-small t-mono">n = 5</text>
    <text x="76" y="60" class="t-small">${L('빈칸 → 벽 (n ≥ 5)', 'empty → wall (n ≥ 5)')}</text>
    ${nb(94, [2, 8], true)}
    <text x="76" y="108" class="t-small t-mono">n = 2</text>
    <text x="76" y="124" class="t-small">${L('벽 → 빈칸 (n < 4)', 'wall → empty (n < 4)')}</text>
    <text x="10" y="168" class="t-small t-dim">${L('다수결 필터처럼 작동', 'Works like a majority vote')}</text>
    <text x="262" y="28" class="t-a t-small">${L('무작위 채움 (반복 0)', 'random fill (step 0)')}</text>
    <text x="408" y="28" class="t-b t-small">${L('5회 반복 후', 'after 5 steps')}</text>
    ${draw(g0, 262, 'f-a')}${draw(g, 408, 'f-b')}
    <text x="397" y="82" text-anchor="middle" class="t-dim">→</text>
    <text x="262" y="142" class="t-small">${L('고립된 점은 사라지고 경계는 매끄러워짐', 'Lone cells vanish and edges smooth out')}</text>
    <text x="10" y="190" class="t-small t-dim">${L('CA만으로는 모든 빈칸의 연결이 보장되지 않음. 플러드 필로 영역을 찾아 정리', 'CA alone does not guarantee that all open cells connect. Flood fill finds regions to clean up')}</text>
  </svg>`;
  },
  look: [
    '반복 횟수를 0→1→2→3으로 올리면 잡음 같은 점이 뭉쳐 둥근 동굴이 됨',
    '채움 비율을 40% 이하로 낮추면 벽이 사라져 탁 트인 공간이 됨. 52% 이상이면 작은 방으로 쪼개지고 영역 수가 늘어남.',
    '출생 임계값을 4로 내리면 벽이 계속 자라 동굴이 막힘. 6으로 올리면 벽이 녹아 사라짐.',
    '"영역 색칠"을 켜면 서로 도달할 수 없는 영역이 다른 색으로 보임. "가장 큰 영역만 남기기"를 켜면 플레이어가 갇힐 곳이 사라짐.',
  ],
  refs: [
    { type: 'paper', title: 'Cellular automata for real-time generation of infinite cave levels (Johnson, Yannakakis, Togelius, PCGames 2010)', year: 2010 },
    { type: 'article', title: 'RogueBasin: Cellular Automata Method for Generating Random Cave-Like Levels', url: 'https://www.roguebasin.com/index.php/Cellular_Automata_Method_for_Generating_Random_Cave-Like_Levels', note: '4-5 규칙과 연결성 후처리' },
    { type: 'book', title: 'Procedural Content Generation in Games (Shaker, Togelius, Nelson)', url: 'https://www.pcgbook.com/', year: 2016, note: '3장 Fractals, noise and agents. CA 동굴.' },
    { type: 'game', title: 'Brogue / Caves of Qud', note: '로그라이크 동굴 생성에 CA 계열 기법 사용' },
  ],
  params: [
    { key: 'iterations', label: '반복 횟수', type: 'int', min: 0, max: 12, default: 5, group: '규칙' },
    { key: 'birth', label: '출생 임계값 (빈칸→벽)', type: 'int', min: 1, max: 8, default: 5 },
    { key: 'survive', label: '생존 임계값 (벽 유지)', type: 'int', min: 1, max: 8, default: 4 },
    { key: 'fill', label: '초기 벽 비율 (%)', type: 'range', min: 25, max: 70, step: 1, default: 46, shared: true, group: '장면' },
    { key: 'cell', label: '칸 크기 (px)', type: 'int', min: 3, max: 16, default: 6, shared: true },
    { key: 'border', label: '바깥 테두리를 벽으로', type: 'bool', default: true, shared: true },
    { key: 'regions', label: '영역 색칠', type: 'bool', default: true, shared: true, group: '후처리' },
    { key: 'keepLargest', label: '가장 큰 영역만 남기기', type: 'bool', default: false },
    { key: 'animate', label: '세대 애니메이션', type: 'bool', default: true, shared: true, group: '표시' },
    { key: 'speed', label: '세대/초', type: 'range', min: 0.5, max: 20, step: 0.5, default: 3, shared: true, when: (p) => p.animate },
    { key: 'regen', label: '다시 생성', type: 'button', buttonLabel: '다시 생성 (새 시드)' },
  ],
  en: {
    title: 'Cellular Automata Caves',
    summary: 'Start with randomly filled walls. Repeat a rule a few times: "many wall neighbors means wall, few means empty". You get natural caves. The number of passes and the birth and survival thresholds decide the shape.',
    controls: 'No input. Press "Regenerate" to build with a new seed.',
    info: `
    <p><b>Cellular automata (CA)</b> repeat a rule that sets each cell\'s next state from its neighbors.</p>
    <p>First, fill each cell with wall at probability <code>p</code>. Each generation counts the walls <code>n</code> in the 8 cells around it.</p>
    <ul>
      <li><b>Empty cell</b>: becomes wall if n ≥ birth.</li>
      <li><b>Wall</b>: stays wall if n ≥ survival.</li>
    </ul>
    <p>The common rule is the "4-5 rule" (birth 5, survival 4). It works like a majority filter. Isolated dots vanish and borders get smooth.</p>
    <p>Downside: CA alone <b>does not guarantee that all empty cells connect.</b> In practice you find regions with a flood fill.
    Then you keep only the largest region or join small regions with tunnels.
    This sample paints each region a different color. "Keep largest region only" shows the cleaned-up result.</p>`,
    look: [
      'Raise the passes from 0 to 1, 2, 3. Noisy dots clump into round caves.',
      'Lower the fill ratio to 40% or less. Walls disappear and the space opens up. At 52% or more, it splits into small rooms and the region count rises.',
      'Lower the birth threshold to 4. Walls keep growing and close the caves. Raise it to 6 and walls melt away.',
      'Turn on "Color regions". Regions you cannot reach from each other show in different colors. Turn on "Keep largest region only" and the places where a player could get stuck disappear.',
    ],
    refs: [null, 'The 4-5 rule and connectivity cleanup.', 'Chapter 3, Fractals, noise and agents. CA caves.', 'Roguelikes that use CA-style methods to build caves.'],
    params: {
      iterations: { label: 'Passes', group: 'Rule' },
      birth: 'Birth threshold (empty to wall)',
      survive: 'Survival threshold (keep wall)',
      fill: { label: 'Initial wall ratio (%)', group: 'Scene' },
      cell: 'Cell size (px)',
      border: 'Make outer border wall',
      regions: { label: 'Color regions', group: 'Cleanup' },
      keepLargest: 'Keep largest region only',
      animate: { label: 'Animate generations', group: 'Display' },
      speed: 'Generations/s',
      regen: { label: 'Regenerate', buttonLabel: 'Regenerate (new seed)' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    let regen = 0, key = '', gens = [], gw = 0, gh = 0, progress = 0;
    const buf = { cv: null, g: null, img: null, key: '' };
    let info = { regions: 0, largest: 0, wall: 0 };

    function generate(W, H) {
      gw = Math.max(8, Math.floor(W / P.cell)); gh = Math.max(8, Math.floor(H / P.cell));
      const rng = U.rng(ctx.seed * 131 + regen * 7717 + 3);
      const isBorder = (x, y) => x === 0 || y === 0 || x === gw - 1 || y === gh - 1;
      let g0 = new Uint8Array(gw * gh);
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) g0[y * gw + x] = (P.border && isBorder(x, y)) || rng.next() * 100 < P.fill ? 1 : 0;
      gens = [g0];
      for (let it = 0; it < P.iterations; it++) {
        const src = gens[gens.length - 1], dst = new Uint8Array(gw * gh);
        for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
          let n = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const xx = x + dx, yy = y + dy;
            n += xx < 0 || yy < 0 || xx >= gw || yy >= gh ? 1 : src[yy * gw + xx]; // 바깥은 벽 취급
          }
          const i = y * gw + x;
          dst[i] = src[i] ? (n >= P.survive ? 1 : 0) : (n >= P.birth ? 1 : 0);
          if (P.border && isBorder(x, y)) dst[i] = 1;
        }
        gens.push(dst);
      }
      progress = P.animate ? 0 : P.iterations;
    }

    // 4-연결 플러드 필 → 영역 id
    function label(grid) {
      const lab = new Int32Array(gw * gh).fill(-1), sizes = [];
      const stack = [];
      for (let i = 0; i < gw * gh; i++) {
        if (grid[i] || lab[i] >= 0) continue;
        const id = sizes.length; let size = 0;
        stack.push(i); lab[i] = id;
        while (stack.length) {
          const c = stack.pop(); size++;
          const x = c % gw, y = (c / gw) | 0;
          if (x > 0 && !grid[c - 1] && lab[c - 1] < 0) { lab[c - 1] = id; stack.push(c - 1); }
          if (x < gw - 1 && !grid[c + 1] && lab[c + 1] < 0) { lab[c + 1] = id; stack.push(c + 1); }
          if (y > 0 && !grid[c - gw] && lab[c - gw] < 0) { lab[c - gw] = id; stack.push(c - gw); }
          if (y < gh - 1 && !grid[c + gw] && lab[c + gw] < 0) { lab[c + gw] = id; stack.push(c + gw); }
        }
        sizes.push(size);
      }
      return { lab, sizes };
    }

    function paint(gen) {
      if (!buf.cv || buf.cv.width !== gw || buf.cv.height !== gh) {
        buf.cv = ctx.createCanvas(gw, gh); buf.g = buf.cv.getContext('2d'); buf.img = buf.g.createImageData(gw, gh);
      }
      const grid = gens[gen], { lab, sizes } = label(grid), d = buf.img.data;
      let big = -1; sizes.forEach((s, i) => { if (big < 0 || s > sizes[big]) big = i; });
      let walls = 0, floor = 0;
      for (let i = 0; i < gw * gh; i++) {
        const o = i * 4;
        let wall = grid[i] === 1;
        if (!wall && P.keepLargest && lab[i] !== big) wall = true;
        if (wall) {
          walls++;
          const x = i % gw, y = (i / gw) | 0;
          const edge = (x > 0 && !grid[i - 1]) || (x < gw - 1 && !grid[i + 1]) || (y > 0 && !grid[i - gw]) || (y < gh - 1 && !grid[i + gw]);
          const v = edge && !(P.keepLargest && !grid[i]) ? 78 : 42;
          d[o] = v; d[o + 1] = v * 0.9; d[o + 2] = v * 0.8;
        } else {
          floor++;
          if (P.regions && lab[i] !== big) {
            const h = (lab[i] * 137.5) % 360, c = hsl2rgb(h, 0.6, 0.55);
            d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2];
          } else { d[o] = 196; d[o + 1] = 170; d[o + 2] = 130; }
        }
        d[o + 3] = 255;
      }
      buf.g.putImageData(buf.img, 0, 0);
      const totalFloor = sizes.reduce((a, b) => a + b, 0);
      info = { regions: sizes.length, largest: totalFloor ? (sizes[big] / totalFloor) * 100 : 0, wall: (walls / (gw * gh)) * 100, tiny: sizes.filter((s) => s < 15).length };
    }
    function hsl2rgb(h, s, l) {
      const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
      const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return [f(0) * 255, f(8) * 255, f(4) * 255];
    }

    return {
      update(dt) { if (P.animate && progress < P.iterations) progress = Math.min(P.iterations, progress + P.speed * dt); },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const k = [P.iterations, P.birth, P.survive, P.fill, P.cell, P.border, regen, W, H].join('|');
        if (k !== key) { generate(W, H); key = k; buf.key = ''; }
        const gen = Math.min(gens.length - 1, Math.floor(P.animate ? progress : P.iterations));
        const pk = [gen, P.regions, P.keepLargest].join('|');
        if (pk !== buf.key) { paint(gen); buf.key = pk; }
        g.imageSmoothingEnabled = false;
        const cw = W / gw, ch = H / gh, c = Math.min(cw, ch);
        const ox = (W - gw * c) / 2, oy = (H - gh * c) / 2;
        g.drawImage(buf.cv, ox, oy, gw * c, gh * c);
        g.imageSmoothingEnabled = true;
        const col = ctx.side === 'a' ? C.a : C.b;
        g.fillStyle = 'rgba(10,12,16,0.75)'; g.fillRect(6, 6, 150, 20);
        D.text(g, GTL.L(`세대 ${gen} / ${P.iterations}`, `Generation ${gen} / ${P.iterations}`), 12, 10, { color: col });
        ctx.stat(GTL.L('벽 비율', 'Wall ratio'), info.wall.toFixed(1) + ' %');
        ctx.stat(GTL.L('분리된 영역 수', 'Separate regions'), info.regions);
        ctx.stat(GTL.L('최대 영역 / 전체 빈칸', 'Largest region / all empty'), info.largest.toFixed(1) + ' %');
        ctx.stat(GTL.L('15칸 미만 자투리', 'Scraps under 15 cells'), info.tiny);
      },
      onAction(key) { if (key === 'regen') regen++; },
    };
  },
});
