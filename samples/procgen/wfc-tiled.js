// 웨이브 펑션 콜랩스(Simple Tiled Model): 변 매칭 타일(풀/도로/강), 칸 선택 휴리스틱 비교
GTL.register({
  id: 'wfc-tiled',
  title: '웨이브 펑션 콜랩스 (Tiled WFC)',
  summary: '무작위 칸 선택 vs 최소 엔트로피 선택 비교. 어떤 칸부터 확정하느냐에 따라 모순 빈도가 크게 달라짐. 최소 엔트로피 선택이 모순이 훨씬 적음.',
  views: { a: '무작위 칸 선택', b: '최소 엔트로피 선택' },
  controls: '조작 없음. "반복"이 켜져 있으면 완성 후 새 시드로 계속 생성하며 통계를 누적함.',
  info: `
    <p><b>웨이브 펑션 콜랩스(WFC)</b>: 모든 칸이 "놓을 수 있는 타일 후보"를 전부 들고 시작함.
    칸을 하나씩 타일 하나로 확정(collapse)하고, 이웃 칸의 후보를 규칙에 맞게 줄여 나가는 방식.</p>
    <p>타일 규칙:</p>
    <ul>
      <li>타일은 네 변의 종류(풀, 도로, 강)로 정의함.</li>
      <li><b>맞닿은 두 변의 종류가 같아야</b> 이웃할 수 있음.</li>
      <li>20종: 풀, 도로(직선, 곡선, T, 십자), 강(직선, 곡선), 다리.</li>
      <li>강은 갈라지거나 끊기지 않음. 도로에는 막다른 길이 없음.</li>
    </ul>
    <p>그래서 "여기서 시작한 강은 어딘가로 빠져나가야 함" 같은 <b>장거리 제약</b>이 생김.
    이웃만 보는 전파로는 이를 미리 알 수 없음. 그 결과 모순이 생길 수 있음.</p>
    <p>WFC 루프:</p>
    <ol>
      <li>미확정 칸 하나를 고름.</li>
      <li>가중치에 비례해 타일 하나로 확정함.</li>
      <li>바뀐 칸에서 이웃으로 <b>제약 전파</b>(AC-3)를 함. 이웃 후보 중 호환되는 것만 남김.</li>
      <li>후보가 0개인 칸이 생기면 <b>모순(contradiction)</b>.</li>
    </ol>
    <p>1단계에서 <b>후보가 가장 적은(엔트로피 최소) 칸</b>을 고르면 제약이 강한 곳부터 정하게 됨.
    그래서 모순이 크게 줄고, 확정된 영역이 한 덩어리로 자라남.
    <b>무작위 선택</b>은 서로 떨어진 곳을 따로 정함. 그러다 사이를 메울 수 없는 상황이 자주 생김.</p>
    <p>이 샘플은 모순이 나면 <b>국소 재시작</b>(주변 반경을 지우고 다시 전파) 또는 전체 재시작으로 복구함.</p>`,
  // 도식: 후보 개수 격자에서 칸 고르기 (A 무작위 vs B 최소 엔트로피)와 WFC 루프
  diagram: (L) => `<svg viewBox="0 0 540 176" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr-wfc" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="16" class="t-dim t-small">${L('칸 안 숫자 = 남은 타일 후보 수', 'number in cell = tile candidates left')}</text>
    ${[[20, 20, 5, 20, 20], [20, 4, 0, 3, 20], [20, 20, 2, 20, 20]].map((row, y) => row.map((n, x) => {
      const cx = 10 + x * 36, cy = 24 + y * 36;
      return `<rect x="${cx}" y="${cy}" width="36" height="36" class="${n === 0 ? 'f-accent' : 'f-dim'}"/>` +
        (n ? `<text x="${cx + 18}" y="${cy + 22}" text-anchor="middle" class="t-mono${n === 20 ? ' t-dim' : ''}">${n}</text>` : `<text x="${cx + 18}" y="${cy + 22}" text-anchor="middle" class="t-small">${L('확정', 'set')}</text>`);
    }).join('')).join('')}
    <rect x="156" y="26" width="32" height="32" rx="3" class="d-a"/>
    <rect x="84" y="98" width="32" height="32" rx="3" class="d-b"/>
    <text x="10" y="150" class="t-a t-small">${L('A: 무작위 칸 (후보 20)', 'A: random cell (20 left)')}</text>
    <text x="10" y="163" class="t-b t-small">${L('B: 후보가 가장 적은 칸 (2)', 'B: fewest candidates (2)')}</text>
    <rect x="226" y="24" width="92" height="28" rx="4" class="f-dim"/><text x="272" y="42" text-anchor="middle">${L('1. 칸 고르기', '1. Pick cell')}</text>
    <rect x="334" y="24" width="92" height="28" rx="4" class="f-dim"/><text x="380" y="42" text-anchor="middle">${L('2. 타일 확정', '2. Collapse')}</text>
    <rect x="442" y="24" width="92" height="28" rx="4" class="f-dim"/><text x="488" y="42" text-anchor="middle">${L('3. 이웃 전파', '3. Propagate')}</text>
    <line x1="319" y1="38" x2="332" y2="38" class="d-accent" marker-end="url(#arr-wfc)"/>
    <line x1="427" y1="38" x2="440" y2="38" class="d-accent" marker-end="url(#arr-wfc)"/>
    <path d="M488,53 L488,66 L272,66 L272,55" class="d-accent" marker-end="url(#arr-wfc)"/>
    <text x="380" y="80" text-anchor="middle" class="t-small t-dim">${L('후보가 남은 칸이 없을 때까지 반복', 'repeat until every cell is set')}</text>
    <line x1="510" y1="66" x2="510" y2="96" class="d-bad" marker-end="url(#arr-wfc)"/>
    <rect x="394" y="98" width="140" height="26" rx="4" class="d-bad"/>
    <text x="464" y="115" text-anchor="middle" class="t-small">${L('후보 0개: 모순', '0 candidates: contradiction')}</text>
    <text x="464" y="138" text-anchor="middle" class="t-small t-dim">${L('국소 재시작으로 복구', 'recover by local restart')}</text>
    <text x="226" y="163" class="t-small t-dim">${L('제약이 강한 곳부터 정하면 확정 영역이 한 덩어리로 자람', 'Most constrained first: one solved region grows')}</text>
  </svg>`,
  look: [
    'A와 B를 비교하면 A(무작위 선택)는 여기저기 조각을 확정하며 빨갛게 번쩍이는 모순이 자주 남. B는 한 덩어리가 퍼지듯 자라고 모순이 드묾.',
    '"반복"을 켠 채 수십 회 돌린 뒤 "회당 평균 모순"을 비교하면 휴리스틱만 바꿨는데도 차이가 큼.',
    'A의 선택을 "스캔라인"으로 바꿔도 모순이 거의 없음. 핵심은 엔트로피 계산보다 "확정된 영역의 경계에서 이어 붙이는 것"임.',
    '"막다른 길 타일 허용"을 켜면 도로가 아무 데서나 끝날 수 있어 무작위 선택에서도 모순이 줄어듦. 타일셋 설계가 모순 빈도를 좌우함.',
    '풀밭 가중치를 낮추고 도로, 강 가중치를 올리면 맵이 빽빽해지고 무작위 선택의 모순이 더 늘어남.',
  ],
  refs: [
    { type: 'code', title: 'mxgmn/WaveFunctionCollapse (Maxim Gumin)', url: 'https://github.com/mxgmn/WaveFunctionCollapse', year: 2016, note: '원본 구현. Simple Tiled Model, Overlapping Model, 최소 엔트로피 휴리스틱.' },
    { type: 'paper', title: 'WaveFunctionCollapse is Constraint Solving in the Wild (Karth & Smith, FDG 2017)', year: 2017, note: 'WFC를 제약 충족 문제로 분석하고 휴리스틱을 비교.' },
    { type: 'game', title: 'Bad North (Plausible Concept, 2018)', note: 'Oskar Stålberg. 섬 생성에 WFC 사용.' },
    { type: 'game', title: 'Townscaper (Oskar Stålberg, 2021)', note: '불규칙 격자 위에서 WFC로 건물 모듈 선택.' },
    { type: 'game', title: 'Caves of Qud (Freehold Games)', note: '마을, 건물 생성에 WFC를 쓴 것으로 알려짐.' },
  ],
  params: [
    { key: 'heuristic', label: '칸 선택 휴리스틱', type: 'select', group: 'WFC', options: [
      { value: 'random', label: '무작위 칸' },
      { value: 'scan', label: '스캔라인 (좌→우, 위→아래)' },
      { value: 'entropy', label: '최소 엔트로피 (Shannon)' },
    ], a: 'random', b: 'entropy' },
    { key: 'onFail', label: '모순 시 복구', type: 'select', options: [
      { value: 'local', label: '국소 재시작 (주변 반경 지우기)' },
      { value: 'restart', label: '전체 재시작' },
    ], default: 'local', shared: true },
    { key: 'grassW', label: '풀밭 타일 가중치', type: 'range', min: 0.2, max: 12, step: 0.1, default: 4, shared: true, group: '타일 가중치' },
    { key: 'roadW', label: '도로 타일 가중치', type: 'range', min: 0, max: 4, step: 0.05, default: 1, shared: true },
    { key: 'riverW', label: '강 타일 가중치', type: 'range', min: 0, max: 4, step: 0.05, default: 1, shared: true },
    { key: 'deadEnds', label: '막다른 길 타일 허용', type: 'bool', default: false, shared: true, reset: true, help: '도로 끝 타일(4종). 허용하면 제약이 느슨해져 모순이 줄어듦.' },
    { key: 'tile', label: '타일 크기 (px)', type: 'int', min: 10, max: 40, default: 20, shared: true, reset: true, group: '표시' },
    { key: 'speed', label: '확정/초', type: 'range', min: 5, max: 3000, step: 5, default: 120, shared: true },
    { key: 'loop', label: '반복 (완성 후 새 시드)', type: 'bool', default: true, shared: true },
    { key: 'showCount', label: '후보 수 표시', type: 'bool', default: false, shared: true },
    { key: 'regen', label: '다시 생성', type: 'button', buttonLabel: '다시 생성 (통계 초기화)' },
  ],
  en: {
    title: 'Wave Function Collapse (Tiled WFC)',
    summary: 'Random cell choice vs minimum entropy choice. Which cell you settle first changes how often contradictions happen. Minimum entropy choice has far fewer contradictions.',
    views: { a: 'Random cell choice', b: 'Minimum entropy choice' },
    controls: 'No input. With "Repeat" on, it keeps building with new seeds after each finish and adds up the stats.',
    info: `
    <p><b>Wave function collapse (WFC)</b> starts with every cell holding all "tile candidates it could take".
    It settles (collapses) cells one at a time to a single tile, and narrows the neighbors\' candidates to fit the rules.</p>
    <p>Tile rules:</p>
    <ul>
      <li>A tile is defined by the type of its four edges (grass, road, river).</li>
      <li>Two tiles can be neighbors only if <b>the touching edges have the same type</b>.</li>
      <li>20 tiles: grass, road (straight, curve, T, cross), river (straight, curve), bridge.</li>
      <li>Rivers never split or stop. Roads have no dead ends.</li>
    </ul>
    <p>This creates <b>long-range constraints</b>, such as "a river that starts here must exit somewhere".
    Propagation that only looks at neighbors cannot know this in advance. As a result, contradictions can happen.</p>
    <p>The WFC loop:</p>
    <ol>
      <li>Pick one unsettled cell.</li>
      <li>Settle it to one tile, with chance in proportion to weight.</li>
      <li>Run <b>constraint propagation</b> (AC-3) from the changed cell to its neighbors. Keep only compatible neighbor candidates.</li>
      <li>If a cell ends up with 0 candidates, that is a <b>contradiction</b>.</li>
    </ol>
    <p>If step 1 picks <b>the cell with the fewest candidates (minimum entropy)</b>, the most constrained places get decided first.
    So contradictions drop a lot, and the settled area grows as one piece.
    <b>Random choice</b> decides far-apart places on their own. Then it often hits gaps that nothing can fill.</p>
    <p>On a contradiction, this sample recovers with a <b>local restart</b> (clear the nearby area and propagate again) or a full restart.</p>`,
    look: [
      'Compare A and B. A (random choice) settles scattered pieces and often flashes red contradictions. B grows like one spreading piece and contradictions are rare.',
      'Keep "Repeat" on and run dozens of times. Then compare "Mean contradictions per run". Only the heuristic changed, but the gap is large.',
      'Switch A\'s choice to "Scanline". Contradictions almost vanish. The key is not the entropy math but "growing from the edge of the settled area".',
      'Turn on "Allow dead-end tiles". Roads can end anywhere, so even random choice has fewer contradictions. Tile set design drives how often contradictions happen.',
      'Lower the grass weight and raise the road and river weights. The map gets dense, and random choice gets even more contradictions.',
    ],
    refs: ['The original implementation. Simple Tiled Model, Overlapping Model, minimum entropy heuristic.', 'Analyzes WFC as a constraint satisfaction problem and compares heuristics.', 'Oskar Stålberg. Uses WFC to build islands.', 'Picks building modules with WFC on an irregular grid.', 'Known to use WFC to build villages and buildings.'],
    params: {
      heuristic: { label: 'Cell choice heuristic', group: 'WFC', options: { random: 'Random cell', scan: 'Scanline (left to right, top to bottom)', entropy: 'Minimum entropy (Shannon)' } },
      onFail: { label: 'Recovery on contradiction', options: { local: 'Local restart (clear nearby area)', restart: 'Full restart' } },
      grassW: { label: 'Grass tile weight', group: 'Tile weights' },
      roadW: 'Road tile weight',
      riverW: 'River tile weight',
      deadEnds: { label: 'Allow dead-end tiles', help: 'Road end tiles (4 kinds). Allowing them loosens the constraints, so contradictions drop.' },
      tile: { label: 'Tile size (px)', group: 'Display' },
      speed: 'Collapses/s',
      loop: 'Repeat (new seed after finish)',
      showCount: 'Show candidate count',
      regen: { label: 'Regenerate', buttonLabel: 'Regenerate (reset stats)' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    // 타일 = 네 변의 종류 [오른쪽, 아래, 왼쪽, 위], 0=풀 1=도로 2=강. 이웃과 맞닿은 변의 종류가 같아야 함.
    // 강은 끊기거나 갈라지지 않고(직선, 곡선만), 도로는 기본으로 막다른 길이 없음 → 장거리 제약이 생겨 모순이 생길 수 있음.
    const base = ['0000', '1010', '1100', '1110', '1111', '2020', '2200', '1212'];
    if (P.deadEnds) base.push('1000');
    const rot = (t) => t[3] + t[0] + t[1] + t[2];
    const seen = new Set(), tiles = [];
    for (const b of base) { let t = b; for (let r = 0; r < 4; r++) { if (!seen.has(t)) { seen.add(t); tiles.push(t.split('').map(Number)); } t = rot(t); } }
    const NT = tiles.length;
    const FULL = NT >= 32 ? 0xffffffff : ((1 << NT) - 1) >>> 0;
    const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
    // compat[dir][t]: 방향 dir 이웃에 올 수 있는 타일 마스크
    const compat = [0, 1, 2, 3].map(() => new Uint32Array(NT));
    for (let i = 0; i < NT; i++) for (let j = 0; j < NT; j++) for (let dir = 0; dir < 4; dir++)
      if (tiles[i][dir] === tiles[j][(dir + 2) % 4]) compat[dir][i] = (compat[dir][i] | (1 << j)) >>> 0;
    const kind = (t) => (t.includes(1) && t.includes(2) ? 'bridge' : t.includes(2) ? 'river' : t.includes(1) ? 'road' : 'grass');

    // 타일 이미지
    const S = 24;
    const EX = [S, S / 2, 0, S / 2], EY = [S / 2, S, S / 2, 0];
    const tileImg = tiles.map((t) => {
      const cv = ctx.createCanvas(S, S), g = cv.getContext('2d');
      g.fillStyle = '#4f8a3e'; g.fillRect(0, 0, S, S);
      g.fillStyle = '#5a9746'; for (let k = 0; k < 4; k++) g.fillRect((k * 7) % S, (k * 11 + 3) % S, 2, 2);
      g.lineCap = 'round';
      const band = (type, w, color) => {
        const es = [0, 1, 2, 3].filter((d) => t[d] === type);
        if (!es.length) return;
        g.strokeStyle = color; g.lineWidth = w;
        if (es.length === 2 && (es[1] - es[0]) % 2 === 1) {      // 곡선: 두 변 사이를 사분원으로
          g.beginPath(); g.moveTo(EX[es[0]], EY[es[0]]); g.quadraticCurveTo(S / 2, S / 2, EX[es[1]], EY[es[1]]); g.stroke();
        } else for (const d of es) { g.beginPath(); g.moveTo(S / 2, S / 2); g.lineTo(EX[d], EY[d]); g.stroke(); }
      };
      band(2, S * 0.5, '#2f6fb0'); band(2, S * 0.3, '#3f86c8');
      if (kind(t) === 'bridge') { band(1, S * 0.42, '#6b4a2b'); band(1, S * 0.3, '#a07848'); }
      else { band(1, S * 0.3, '#8a8578'); band(1, S * 0.06, '#d8d0b8'); }
      return cv;
    });

    const popcnt = (m) => { m = m - ((m >>> 1) & 0x55555555); m = (m & 0x33333333) + ((m >>> 2) & 0x33333333); return (((m + (m >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24; };
    let weights = new Float64Array(NT);
    function updateWeights() {
      tiles.forEach((t, i) => {
        const k = kind(t);
        weights[i] = Math.max(1e-3, k === 'grass' ? P.grassW : k === 'road' ? P.roadW / (t.filter((e) => e === 1).length >= 3 ? 2 : 1) : k === 'river' ? P.riverW : 0.5 * Math.min(P.roadW, P.riverW));
      });
    }

    let gw = 0, gh = 0, dom = null, fixed = null, rng = null, runSeed = 0, budget = 0;
    let fails = 0, runFails = 0, runs = 0, totalFails = 0, collapsed = 0, holdT = 0, flashes = [];

    function newRun() {
      gw = Math.max(6, Math.floor(ctx.width / P.tile)); gh = Math.max(4, Math.floor(ctx.height / P.tile));
      dom = new Uint32Array(gw * gh).fill(FULL);
      fixed = new Int8Array(gw * gh).fill(-1);
      rng = U.rng(ctx.seed * 4099 + runSeed * 7919); // 두 뷰 동일 시드
      collapsed = 0; runFails = 0; holdT = 0;
    }
    function fullReset() { runSeed = 0; runs = 0; totalFails = 0; fails = 0; flashes = []; newRun(); }

    // 제약 전파: 변경된 칸 목록에서 시작. 모순이면 해당 칸 index 반환, 아니면 -1
    function propagate(stack) {
      while (stack.length) {
        const c = stack.pop(), cx = c % gw, cy = (c / gw) | 0, m = dom[c];
        for (let dir = 0; dir < 4; dir++) {
          const nx = cx + DX[dir], ny = cy + DY[dir];
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
          let allowed = 0;
          for (let t = 0, mm = m; mm; t++, mm >>>= 1) if (mm & 1) allowed |= compat[dir][t];
          const n = ny * gw + nx, nd = (dom[n] & allowed) >>> 0;
          if (nd !== dom[n]) {
            dom[n] = nd;
            if (!nd) return n;
            stack.push(n);
          }
        }
      }
      return -1;
    }
    function entropy(m) {
      let sw = 0, swl = 0;
      for (let t = 0; m; t++, m >>>= 1) if (m & 1) { const w = weights[t]; sw += w; swl += w * Math.log(w); }
      return Math.log(sw) - swl / sw;
    }
    function pickCell() {
      const n = gw * gh;
      if (P.heuristic === 'scan') { for (let i = 0; i < n; i++) if (fixed[i] < 0) return i; return -1; }
      if (P.heuristic === 'random') {
        let cnt = 0; for (let i = 0; i < n; i++) if (fixed[i] < 0) cnt++;
        if (!cnt) return -1;
        let k = Math.floor(rng.next() * cnt);
        for (let i = 0; i < n; i++) if (fixed[i] < 0 && k-- === 0) return i;
        return -1;
      }
      let best = -1, be = Infinity;
      for (let i = 0; i < n; i++) if (fixed[i] < 0) {
        const e = popcnt(dom[i]) === 1 ? -1 : entropy(dom[i]) + rng.next() * 1e-3;
        if (e < be) { be = e; best = i; }
      }
      return best;
    }
    function recover(at) {
      fails++; runFails++;
      flashes.push({ i: at, t: 0.6 });
      if (P.onFail === 'restart') { const keep = runFails; newRun(); runFails = keep; return; }
      for (let R = 2; R <= 12; R += 2) {
        const ax = at % gw, ay = (at / gw) | 0;
        for (let y = Math.max(0, ay - R); y <= Math.min(gh - 1, ay + R); y++)
          for (let x = Math.max(0, ax - R); x <= Math.min(gw - 1, ax + R); x++) {
            const i = y * gw + x; if (fixed[i] >= 0) { fixed[i] = -1; collapsed--; }
          }
        // 확정 칸으로부터 모든 도메인 재계산
        const stack = [];
        for (let i = 0; i < gw * gh; i++) { if (fixed[i] >= 0) { dom[i] = (1 << fixed[i]) >>> 0; stack.push(i); } else dom[i] = FULL; }
        if (propagate(stack) < 0) return;
      }
      const keep = runFails; newRun(); runFails = keep;
    }
    function step() {
      const c = pickCell();
      if (c < 0) return false;
      // 가중 무작위 선택
      let m = dom[c], sw = 0;
      for (let t = 0, mm = m; mm; t++, mm >>>= 1) if (mm & 1) sw += weights[t];
      let r = rng.next() * sw, pick = -1;
      for (let t = 0, mm = m; mm; t++, mm >>>= 1) if (mm & 1) { pick = t; r -= weights[t]; if (r <= 0) break; }
      dom[c] = (1 << pick) >>> 0; fixed[c] = pick; collapsed++;
      const bad = propagate([c]);
      if (bad >= 0) recover(bad);
      return true;
    }

    updateWeights();
    fullReset();

    return {
      update(dt) {
        for (const f of flashes) f.t -= dt;
        flashes = flashes.filter((f) => f.t > 0);
        if (collapsed >= gw * gh) {
          if (!P.loop) return;
          holdT += dt;
          if (holdT > 1.2) { runs++; totalFails += runFails; runSeed++; newRun(); }
          return;
        }
        budget += P.speed * dt;
        let guard = 4000;
        while (budget >= 1 && guard-- > 0) {
          budget--;
          if (!step()) break;
          if (collapsed >= gw * gh) { budget = 0; break; }
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const T = Math.min(W / gw, H / gh), ox = (W - gw * T) / 2, oy = (H - gh * T) / 2;
        g.imageSmoothingEnabled = true;
        for (let i = 0; i < gw * gh; i++) {
          const x = ox + (i % gw) * T, y = oy + ((i / gw) | 0) * T;
          if (fixed[i] >= 0) g.drawImage(tileImg[fixed[i]], x, y, T + 0.5, T + 0.5);
          else {
            const n = popcnt(dom[i]), v = 30 + (1 - n / NT) * 60;
            g.fillStyle = `rgb(${v},${v},${v + 8})`; g.fillRect(x, y, T - 1, T - 1);
            if (P.showCount && T >= 14) D.text(g, String(n), x + T / 2, y + T / 2, { size: Math.min(11, T * 0.5), color: C.dim, align: 'center', baseline: 'middle' });
          }
        }
        for (const f of flashes) {
          const x = ox + (f.i % gw) * T, y = oy + ((f.i / gw) | 0) * T;
          g.globalAlpha = U.clamp(f.t / 0.6, 0, 1);
          D.rect(g, x - T * 2, y - T * 2, T * 5, T * 5, null, C.bad, 2);
          D.rect(g, x, y, T, T, C.bad);
          g.globalAlpha = 1;
        }
        const col = ctx.side === 'a' ? C.a : C.b;
        const pct = (collapsed / (gw * gh)) * 100;
        D.text(g, collapsed >= gw * gh ? GTL.L('완성', 'Complete') : GTL.L(`확정 ${pct.toFixed(0)}%`, `Settled ${pct.toFixed(0)}%`), 8, 8, { color: collapsed >= gw * gh ? C.good : col });
        ctx.stat(GTL.L('이번 회 모순', 'Contradictions this run'), runFails);
        ctx.stat(GTL.L('완성 횟수', 'Completed runs'), runs);
        ctx.stat(GTL.L('회당 평균 모순', 'Mean contradictions per run'), runs ? (totalFails / runs).toFixed(2) : '-');
        ctx.stat(GTL.L('타일 종류 / 격자', 'Tile types / grid'), `${NT} / ${gw}×${gh}`);
      },
      onParam(key) { if (/W$/.test(key)) updateWeights(); },
      onAction(key) { if (key === 'regen') fullReset(); },
    };
  },
});
