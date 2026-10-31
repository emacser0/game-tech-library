// 동굴 생성: 노이즈 임계값 vs 펄린 웜(Perlin Worms). 연결 영역 수로 동굴 연결성 비교
GTL.register({
  id: 'perlin-worms',
  title: '펄린 웜 (Perlin Worms) 동굴 vs 노이즈 임계값',
  summary: '노이즈 임계값 동굴 vs 펄린 웜 동굴 비교. 임계값 방식은 빈 공간 비율이 같아도 서로 끊긴 방이 수십 개 생김. 펄린 웜은 노이즈로 방향을 정해 이어진 긴 터널을 파냄.',
  views: { a: '노이즈 임계값', b: '펄린 웜' },
  controls: '조작 없음. "다시 생성"을 누르면 새 시드로 만듦.',
  info: `
    <p><b>노이즈 임계값</b>: fBm 노이즈 값이 기준보다 큰 칸을 빈 공간으로 만듦. 빠르고 모양이 자연스러움.
    하지만 덩어리가 따로따로 생겨 서로 이어지지 않음. 플레이어가 갈 수 없는 방이 많아짐.</p>
    <p><b>펄린 웜</b>: 벌레(웜) 여러 마리가 굴을 파며 나아감. 매 걸음 진행 방향을 1D 펄린 노이즈로 정함.
    노이즈는 이웃한 값이 비슷하므로 방향이 부드럽게 휘어짐. 굴 반지름도 노이즈로 바꿔 굵기가 달라짐.
    한 마리가 지나간 자리는 처음부터 끝까지 이어져 있음.</p>
    <p><b>백색 노이즈 방향</b>: 매 걸음 방향을 독립 난수로 흔듦. 앞뒤 걸음이 서로 상관이 없어 굴이 지그재그로 떨림. 펄린 노이즈가 왜 필요한지 보여 주는 비교용.</p>
    <p>단점: 웜끼리 만나지 않으면 터널 묶음이 따로 남음. 실제 게임은 웜 시작점을 기존 굴 위에 두거나, 연결 검사 후 이어 붙임.</p>`,
  // 도식: 임계값 동굴의 끊긴 덩어리 vs 펄린 노이즈로 방향을 정하는 웜의 이어진 굴, 방향 노이즈 비교
  diagram: (L) => `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="14" class="t-a">${L('A 노이즈 임계값', 'A noise threshold')}</text>
    <rect x="10" y="22" width="250" height="120" rx="4" class="f-dim"/>
    <ellipse cx="60" cy="60" rx="32" ry="20" class="d-a"/>
    <ellipse cx="150" cy="105" rx="40" ry="22" class="d-a"/>
    <ellipse cx="215" cy="52" rx="28" ry="16" class="d-a"/>
    <ellipse cx="95" cy="122" rx="14" ry="10" class="d-a"/>
    <text x="60" y="64" text-anchor="middle">S</text>
    <path d="M144,99 L156,111 M156,99 L144,111" class="d-bad"/><path d="M209,46 L221,58 M221,46 L209,58" class="d-bad"/>
    <path d="M89,116 L101,128 M101,116 L89,128" class="d-bad"/>
    <text x="10" y="158" class="t-small t-dim">${L('덩어리가 따로 생김. X = 시작점에서 갈 수 없음', 'Separate blobs. X = unreachable from start')}</text>
    <text x="280" y="14" class="t-b">${L('B 펄린 웜', 'B Perlin worm')}</text>
    <rect x="280" y="22" width="250" height="120" rx="4" class="f-dim"/>
    <path d="M300,110 C330,60 370,50 400,80 S460,130 510,50" class="d-b" style="stroke-width:9" stroke-linecap="round" opacity="0.45"/>
    <path d="M300,110 C330,60 370,50 400,80 S460,130 510,50" class="d-b"/>
    <path d="M300,40 L312,52 L320,38 L333,56 L341,40 L352,58 L362,42" class="d-dim"/>
    <text x="368" y="48" class="t-small t-dim">${L('백색 노이즈 방향: 지그재그', 'white noise heading: zigzag')}</text>
    <circle cx="300" cy="110" r="4" class="f-accent"/>
    <text x="280" y="158" class="t-small t-dim">${L('한 마리가 판 굴은 처음부터 끝까지 이어짐', 'One worm tunnel stays connected end to end')}</text>
    <text x="280" y="174" class="t-mono t-small">heading += perlin1D(step) * turn</text>
    <text x="280" y="192" class="t-small t-dim">${L('이웃 값이 비슷해 방향이 부드럽게 휨', 'Nearby values are similar, so it bends smoothly')}</text>
  </svg>`,
  look: [
    '두 뷰의 "연결 영역 수"를 비교하면 A는 수십 개, B는 몇 개뿐임. 빨간 칸이 가장 큰 영역과 이어지지 않은 곳.',
    'B의 방향 방식을 백색 노이즈로 바꾸면 굴이 떨리고 짧게 뭉침. 같은 길이를 가도 멀리 못 감.',
    'B의 회전 세기를 올리면 굴이 구불구불해지고, 낮추면 거의 직선이 됨.',
    'A의 빈 공간 목표를 50%까지 올려도 가장 큰 영역은 40%도 안 됨. 60%에서야 하나로 이어지고, 그때는 동굴이 아니라 넓은 벌판이 됨.',
  ],
  refs: [
    { type: 'code', title: 'libnoise examples: Perlin worms', note: '노이즈로 방향을 정하는 웜 데모.' },
    { type: 'game', title: 'Minecraft (Mojang): 1.18 이전 동굴 carver', note: '굴 파기(carver)로 휘어진 터널을 파는 방식. 1.18부터는 노이즈 동굴(치즈, 스파게티 동굴)을 함께 씀.' },
    { type: 'article', title: 'Red Blob Games: Making maps with noise functions', url: 'https://www.redblobgames.com/maps/terrain-from-noise/', note: '노이즈 임계값으로 지형을 만드는 기본 방식.' },
  ],
  params: [
    { key: 'mode', label: '생성 방식', type: 'select', group: '동굴', options: [
      { value: 'threshold', label: '노이즈 임계값' },
      { value: 'white', label: '웜 + 백색 노이즈 방향' },
      { value: 'perlin', label: '웜 + 펄린 노이즈 방향' },
    ], a: 'threshold', b: 'perlin' },
    { key: 'target', label: '빈 공간 목표 (%)', type: 'range', min: 5, max: 60, step: 1, default: 24, when: (p) => p.mode === 'threshold', help: '이 비율이 되도록 임계값을 자동으로 정함.' },
    { key: 'noiseScale', label: '노이즈 주파수', type: 'range', min: 2, max: 16, step: 0.5, default: 7, when: (p) => p.mode === 'threshold' },
    { key: 'worms', label: '웜 수', type: 'int', min: 1, max: 20, default: 6, when: (p) => p.mode !== 'threshold' },
    { key: 'length', label: '웜 길이 (걸음)', type: 'int', min: 20, max: 600, default: 220, when: (p) => p.mode !== 'threshold' },
    { key: 'turn', label: '회전 세기', type: 'range', min: 0, max: 1.5, step: 0.05, default: 0.8, when: (p) => p.mode !== 'threshold' },
    { key: 'radius', label: '굴 반지름 (칸)', type: 'range', min: 1, max: 5, step: 0.1, default: 2.2, when: (p) => p.mode !== 'threshold' },
    { key: 'res', label: '격자 가로 칸 수', type: 'int', min: 80, max: 220, default: 160, shared: true, group: '표시' },
    { key: 'showRegions', label: '끊긴 영역 표시', type: 'bool', default: true, shared: true },
    { key: 'showPath', label: '웜 경로 표시', type: 'bool', default: true, shared: true },
    { key: 'animate', label: '파는 과정 애니메이션', type: 'bool', default: true, shared: true },
    { key: 'speed', label: '걸음/초', type: 'range', min: 50, max: 5000, step: 50, default: 700, shared: true, when: (p) => p.animate },
    { key: 'regen', label: '다시 생성', type: 'button', buttonLabel: '다시 생성 (새 시드)' },
  ],
  en: {
    title: 'Perlin Worms Caves vs Noise Threshold',
    summary: 'Noise threshold caves vs Perlin worm caves. The threshold method makes dozens of cut-off rooms, even at the same open space ratio. Perlin worms steer with noise and dig long, connected tunnels.',
    views: { a: 'Noise threshold', b: 'Perlin worms' },
    controls: 'No input. Press "Regenerate" to build with a new seed.',
    info: `
    <p><b>Noise threshold</b>: cells where the fBm noise value is above a set level become open space. It is fast and looks natural.
    But blobs form on their own and do not connect. Many rooms become unreachable for the player.</p>
    <p><b>Perlin worms</b>: several worms dig tunnels as they move. Each step, 1D Perlin noise sets the heading.
    Neighboring noise values are similar, so the heading bends smoothly. Noise also changes the tunnel radius, so the width varies.
    The path of one worm is connected from start to end.</p>
    <p><b>White noise heading</b>: shakes the heading with an independent random number each step. Steps have no relation to each other, so the tunnel jitters in a zigzag. This is for comparison, to show why Perlin noise is needed.</p>
    <p>Downside: if worms never meet, groups of tunnels stay apart. Real games start worms on existing tunnels, or check connectivity and join them afterward.</p>`,
    look: [
      'Compare "Connected regions" in the two views. A has dozens. B has only a few. Red cells are places not linked to the largest region.',
      'Switch B\'s heading method to white noise. Tunnels jitter and clump short. With the same length, they do not get far.',
      'Raise B\'s turn strength. Tunnels get winding. Lower it and they become almost straight.',
      'Raise A\'s open space target to 50%. The largest region is still under 40%. Only at 60% does it join into one, and then it is a wide plain, not a cave.',
    ],
    refs: ['A worm demo that steers with noise.', { title: 'Minecraft (Mojang): cave carver before 1.18', note: 'Digs curved tunnels with a carver. Since 1.18 it also uses noise caves (cheese and spaghetti caves).' }, 'The basic method of building terrain with a noise threshold.'],
    params: {
      mode: { label: 'Generation method', group: 'Caves', options: { threshold: 'Noise threshold', white: 'Worms + white noise heading', perlin: 'Worms + Perlin noise heading' } },
      target: { label: 'Open space target (%)', help: 'Sets the threshold automatically to reach this ratio.' },
      noiseScale: 'Noise frequency',
      worms: 'Worms',
      length: 'Worm length (steps)',
      turn: 'Turn strength',
      radius: 'Tunnel radius (cells)',
      res: { label: 'Grid width (cells)', group: 'Display' },
      showRegions: 'Show cut-off regions',
      showPath: 'Show worm paths',
      animate: 'Animate digging',
      speed: 'Steps/s',
      regen: { label: 'Regenerate', buttonLabel: 'Regenerate (new seed)' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    let regen = 0, key = '', gw = 0, gh = 0;
    let solid = null, region = null, carveOps = [], paths = [], progress = 0, applied = 0;
    let stats = { regions: 0, largest: 0, open: 0 };
    let cv = null, cg = null, img = null, dirty = true, statDirty = true, lastShow = null;

    function build(W, H) {
      gw = P.res; gh = Math.max(20, Math.round(P.res * H / W));
      solid = new Uint8Array(gw * gh).fill(1);
      region = new Int32Array(gw * gh);
      const seed = ctx.seed * 131 + regen * 977 + 5;
      const N = U.noise(seed);
      const rng = U.rng(seed);
      carveOps = []; paths = [];
      if (P.mode === 'threshold') {
        const vals = new Float32Array(gw * gh), s = P.noiseScale / gw;
        for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) vals[y * gw + x] = N.fbm2(x * s, y * s, { octaves: 4 });
        // 목표 비율이 되는 분위수를 임계값으로 사용
        const sorted = Float32Array.from(vals).sort();
        const thr = sorted[Math.floor((1 - P.target / 100) * (sorted.length - 1))];
        for (let i = 0; i < vals.length; i++) if (vals[i] > thr) solid[i] = 0;
        progress = applied = 0;
      } else {
        for (let w = 0; w < P.worms; w++) {
          let x = rng.range(gw * 0.1, gw * 0.9), y = rng.range(gh * 0.1, gh * 0.9);
          const base = rng.range(0, U.TAU), off = rng.range(0, 200);
          const path = [];
          for (let s = 0; s < P.length; s++) {
            let ang;
            if (P.mode === 'perlin') ang = base + N.perlin2(off + s * 0.045, w * 3.7) * Math.PI * 2 * P.turn;
            else ang = base + (rng.next() * 2 - 1) * Math.PI * P.turn;
            const r = P.radius * (0.7 + 0.6 * (N.perlin2(off * 0.5 + s * 0.03, 50 + w) * 0.5 + 0.5));
            x += Math.cos(ang); y += Math.sin(ang);
            // 벽에 닿으면 반사해서 화면 밖으로 나가지 않게 함
            if (x < 2) x = 4 - x; if (x > gw - 3) x = 2 * (gw - 3) - x;
            if (y < 2) y = 4 - y; if (y > gh - 3) y = 2 * (gh - 3) - y;
            carveOps.push([x, y, r]); path.push([x, y]);
          }
          paths.push(path);
        }
        progress = P.animate ? 0 : carveOps.length; applied = 0;
      }
      dirty = statDirty = true;
    }

    function carve(x, y, r) {
      const r2 = r * r, x0 = Math.max(1, Math.floor(x - r)), x1 = Math.min(gw - 2, Math.ceil(x + r));
      const y0 = Math.max(1, Math.floor(y - r)), y1 = Math.min(gh - 2, Math.ceil(y + r));
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
        const dx = xx + 0.5 - x, dy = yy + 0.5 - y;
        if (dx * dx + dy * dy <= r2) solid[yy * gw + xx] = 0;
      }
    }

    // 4방향 연결 영역 라벨링. 가장 큰 영역 id를 반환
    const stack = [];
    function label() {
      region.fill(-1);
      let id = 0, best = -1, bestSize = 0, open = 0;
      for (let i = 0; i < solid.length; i++) {
        if (solid[i] || region[i] >= 0) continue;
        let size = 0; stack.length = 0; stack.push(i); region[i] = id;
        while (stack.length) {
          const c = stack.pop(); size++;
          const cx = c % gw, cy = (c - cx) / gw;
          if (cx > 0 && !solid[c - 1] && region[c - 1] < 0) { region[c - 1] = id; stack.push(c - 1); }
          if (cx < gw - 1 && !solid[c + 1] && region[c + 1] < 0) { region[c + 1] = id; stack.push(c + 1); }
          if (cy > 0 && !solid[c - gw] && region[c - gw] < 0) { region[c - gw] = id; stack.push(c - gw); }
          if (cy < gh - 1 && !solid[c + gw] && region[c + gw] < 0) { region[c + gw] = id; stack.push(c + gw); }
        }
        open += size;
        if (size > bestSize) { bestSize = size; best = id; }
        id++;
      }
      stats = { regions: id, largest: open ? (bestSize / open) * 100 : 0, open: (open / solid.length) * 100, best };
    }

    function paint() {
      if (!cv || cv.width !== gw || cv.height !== gh) { cv = ctx.createCanvas(gw, gh); cg = cv.getContext('2d'); img = cg.createImageData(gw, gh); }
      const d = img.data;
      for (let i = 0; i < solid.length; i++) {
        const o = i * 4;
        if (solid[i]) { d[o] = 52; d[o + 1] = 44; d[o + 2] = 40; }
        else if (P.showRegions && region[i] !== stats.best) { d[o] = 200; d[o + 1] = 70; d[o + 2] = 80; }
        else { d[o] = 196; d[o + 1] = 184; d[o + 2] = 150; }
        d[o + 3] = 255;
      }
      cg.putImageData(img, 0, 0);
    }

    return {
      update(dt) {
        if (P.mode !== 'threshold' && P.animate && progress < carveOps.length) progress = Math.min(carveOps.length, progress + P.speed * dt);
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const k = [P.mode, P.target, P.noiseScale, P.worms, P.length, P.turn, P.radius, P.res, regen, W, H].join('|');
        if (k !== key) { build(W, H); key = k; }
        if (P.mode !== 'threshold') {
          const n = Math.floor(P.animate ? progress : carveOps.length);
          if (n > applied) { for (let i = applied; i < n; i++) carve(carveOps[i][0], carveOps[i][1], carveOps[i][2]); applied = n; dirty = statDirty = true; }
        }
        if (statDirty) { label(); statDirty = false; dirty = true; }
        if (dirty || P.showRegions !== lastShow) { paint(); dirty = false; lastShow = P.showRegions; }
        const T = Math.min(W / gw, H / gh), ox = (W - gw * T) / 2, oy = (H - gh * T) / 2;
        g.imageSmoothingEnabled = false;
        g.drawImage(cv, ox, oy, gw * T, gh * T);
        const col = ctx.side === 'a' ? C.a : C.b;
        if (P.showPath && P.mode !== 'threshold') {
          let left = Math.floor(P.animate ? progress : carveOps.length);
          for (const path of paths) {
            const m = Math.min(path.length, left); left -= m;
            if (m < 2) continue;
            g.beginPath();
            for (let i = 0; i < m; i++) { const px = ox + path[i][0] * T, py = oy + path[i][1] * T; i ? g.lineTo(px, py) : g.moveTo(px, py); }
            g.strokeStyle = col; g.lineWidth = 1; g.globalAlpha = 0.75; g.stroke(); g.globalAlpha = 1;
            D.circle(g, ox + path[0][0] * T, oy + path[0][1] * T, 3, col);
          }
        }
        ctx.stat(GTL.L('빈 공간 비율', 'Open space ratio'), stats.open.toFixed(1) + ' %');
        ctx.stat(GTL.L('연결 영역 수', 'Connected regions'), stats.regions);
        ctx.stat(GTL.L('가장 큰 영역 비중', 'Largest region share'), stats.largest.toFixed(1) + ' %');
        if (P.mode !== 'threshold') ctx.stat(GTL.L('판 걸음', 'Steps dug'), `${applied} / ${carveOps.length}`);
      },
      onAction(key) { if (key === 'regen') regen++; },
    };
  },
});
