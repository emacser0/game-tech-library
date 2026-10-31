// AI 업데이트 예산: 매 프레임 전부 vs 시간 분할(time slicing) vs 거리 기반 업데이트 LOD
GTL.register({
  id: 'update-lod',
  title: '시간 분할 & 업데이트 LOD',
  summary: '수천 에이전트의 비싼 판단(주변 탐색)을 매 프레임 모두 돌릴 필요는 없음. 프레임마다 일부만 돌리거나(시간 분할), 플레이어에서 먼 것은 드물게 돌리면(LOD) 비용이 크게 줄어듦. 가까운 곳의 품질은 그대로 유지됨.',
  views: { a: '매 프레임 전부', b: '거리 기반 LOD' },
  controls: '마우스: 플레이어(초점) 위치 (마우스가 밖에 있으면 자동 이동)',
  info: `
    <p>각 에이전트는 두 가지 일을 함</p>
    <ul>
      <li><b>판단(think)</b>: 모든 먹이를 훑어 가장 가까운 것을 목표로 고름. 비용은 O(먹이 수).</li>
      <li><b>이동</b>: 매 프레임 목표 쪽으로 움직임. 비용이 쌈.</li>
    </ul>
    <p>think를 매 프레임 전부 돌리면 비용은 <b>에이전트 수 × 먹이 수</b></p>
    <p><b>시간 분할</b>(time slicing, round-robin): 프레임마다 전체의 1/k만 think함. 비용은 1/k로 줄어듦. 단점은 모든 에이전트가 똑같이 최대 k프레임 늦게 반응한다는 점.</p>
    <p><b>업데이트 LOD</b>: 플레이어(초점)와의 거리에 따라 think 간격을 바꿈</p>
    <ul>
      <li>가까움: 매 프레임</li>
      <li>중간: 4프레임마다</li>
      <li>멂: 16프레임마다</li>
    </ul>
    <p>간격이 같은 에이전트끼리는 시작 프레임을 엇갈림(stagger). 그래서 한 프레임에 몰리지 않음. 플레이어가 보는 곳의 반응성은 유지하고 비용만 아낌.</p>
    <p>밝게 빛나는 점이 이번 프레임에 think한 에이전트. 빨간 선은 목표 먹이가 이미 먹혔는데 아직 모르는 에이전트(낡은 목표).</p>`,
  diagram: (L) => {
    const F = 16, x0 = 130, cw = 25;
    const rows = [
      { label: L('A: 매 프레임 전부', 'A: every frame'), cls: 'f-a', on: () => true },
      { label: L('시간 분할 k=4', 'Time slicing k=4'), cls: 'f-dim', on: () => true, num: true },
      { label: L('B: 가까움', 'B: near'), cls: 'f-b', on: () => true },
      { label: L('B: 중간', 'B: mid'), cls: 'f-b', on: (f) => f % 4 === 0 },
      { label: L('B: 중간, 엇갈림', 'B: mid, staggered'), cls: 'f-b', on: (f) => f % 4 === 2 },
      { label: L('B: 멂', 'B: far'), cls: 'f-b', on: (f) => f % 16 === 3 },
      { label: L('B: 멂, 엇갈림', 'B: far, staggered'), cls: 'f-b', on: (f) => f % 16 === 11 },
    ];
    let s = '';
    for (let f = 0; f < F; f++) s += `<text x="${x0 + f * cw + 11}" y="16" text-anchor="middle" class="t-small t-mono t-dim">${f}</text>`;
    rows.forEach((r, i) => {
      const y = 24 + i * 20;
      s += `<text x="4" y="${y + 12}">${r.label}</text>`;
      for (let f = 0; f < F; f++) {
        s += `<rect x="${x0 + f * cw}" y="${y}" width="22" height="16" class="${r.on(f) ? r.cls : 'd-dim'}"/>`;
        if (r.num) s += `<text x="${x0 + f * cw + 11}" y="${y + 12}" text-anchor="middle" class="t-small t-mono">${f % 4}</text>`;
      }
    });
    return `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
    <text x="4" y="16" class="t-small t-dim">${L('프레임', 'Frame')}</text>
    ${s}
    <text x="4" y="182" class="t-small t-dim">${L('채운 칸 = 그 프레임에 think 실행. 숫자는 이번에 think하는 그룹 번호', 'Filled cell = think runs that frame. Numbers show which group thinks')}</text>
  </svg>`;
  },
  look: [
    '기본 상태에서 B를 보면 초점 근처만 매 프레임 빛나고, 먼 곳은 드문드문 빛남. "think 비용" ms가 A보다 훨씬 작음.',
    'B의 빨간 선(낡은 목표) 위치를 보면 대부분 먼 곳에 있음. 플레이어가 보지 않는 곳의 품질만 낮춘 결과.',
    'B를 "시간 분할"로 바꾸고 분할 수를 30으로 올리면 화면 전체에 빨간 선이 늘고 "초당 먹은 먹이"가 줄어듦',
    '에이전트 수와 먹이 수를 늘리면 A의 ms가 두 값의 곱에 비례해 늘어남',
  ],
  refs: [
    { type: 'book', title: 'AI Game Programming Wisdom, "Level-of-Detail AI" 관련 장들 (Steve Rabin 편)', year: 2002, note: '거리와 가시성에 따른 AI 업데이트 빈도 조절' },
    { type: 'book', title: 'Game AI Pro, Ch. "Time-Slicing" 및 스케줄링 관련 장 (Steve Rabin 편)', url: 'http://www.gameaipro.com/', note: '무료 공개 PDF 모음' },
    { type: 'engine', title: 'Unreal Engine, Animation Budget Allocator / URO (Update Rate Optimization)', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/animation-budget-allocator-in-unreal-engine', note: '거리와 가시성에 따라 스켈레탈 메시 업데이트 빈도를 낮춤' },
  ],
  params: [
    { key: 'agents', label: '에이전트 수', type: 'int', min: 200, max: 4000, default: 2000, shared: true, reset: true, group: '장면' },
    { key: 'foods', label: '먹이 수', type: 'int', min: 50, max: 1500, default: 600, shared: true, reset: true },
    { key: 'mode', label: '업데이트 방식', type: 'select', group: '스케줄링', options: [
      { value: 'all', label: '매 프레임 전부' },
      { value: 'slice', label: '시간 분할 (1/k씩 round-robin)' },
      { value: 'lod', label: '거리 기반 LOD' },
    ], a: 'all', b: 'lod' },
    { key: 'slices', label: '분할 수 k', type: 'int', min: 2, max: 30, default: 8, when: (p) => p.mode === 'slice' },
    { key: 'near', label: 'LOD 근거리 반경', type: 'int', min: 40, max: 400, default: 130, when: (p) => p.mode === 'lod' },
    { key: 'farInt', label: 'LOD 원거리 간격 (프레임)', type: 'int', min: 2, max: 60, default: 16, when: (p) => p.mode === 'lod' },
    { key: 'showStale', label: '낡은 목표 표시', type: 'bool', default: true },
  ],
  en: {
    title: 'Time Slicing & Update LOD',
    summary: 'You do not need to run the expensive decisions (nearby search) of thousands of agents every frame. Run only some of them each frame (time slicing), or run far ones from the player less often (LOD). Cost drops a lot, and quality near the player stays the same.',
    views: { a: 'Everything every frame', b: 'Distance-based LOD' },
    controls: 'Mouse: player (focus) position (it moves on its own when the mouse is outside)',
    info: `
    <p>Each agent does two jobs.</p>
    <ul>
      <li><b>Think</b>: scan all food and pick the nearest one as the target. Cost is O(food count).</li>
      <li><b>Move</b>: move toward the target every frame. This is cheap.</li>
    </ul>
    <p>If every agent thinks every frame, the cost is <b>agent count × food count</b>.</p>
    <p><b>Time slicing</b> (round-robin): only 1/k of all agents think each frame. Cost drops to 1/k. The downside: every agent reacts up to k frames late, all the same.</p>
    <p><b>Update LOD</b>: change the think interval by distance from the player (focus).</p>
    <ul>
      <li>Near: every frame</li>
      <li>Middle: every 4 frames</li>
      <li>Far: every 16 frames</li>
    </ul>
    <p>Agents with the same interval start on different frames (stagger). So they do not pile up in one frame. This keeps response quick where the player is looking and saves cost elsewhere.</p>
    <p>Brightly glowing dots are agents that thought this frame. A red line marks an agent whose target food was already eaten, but it does not know yet (stale target).</p>`,
    look: [
      'In the default state, look at B. Only agents near the focus glow every frame. Far ones glow now and then. "Think cost" ms is much smaller than A.',
      'Look where B\'s red lines (stale targets) are. Most are far away. Only quality where the player is not looking went down.',
      'Switch B to "Time slicing" and raise the slice count to 30. Red lines increase across the whole screen, and "Food eaten per second" goes down.',
      'Raise the agent and food counts. A\'s ms grows in proportion to the product of the two.',
    ],
    refs: [
      { title: 'AI Game Programming Wisdom, chapters on "Level-of-Detail AI" (Steve Rabin, ed.)', note: 'Adjusting AI update rate by distance and visibility.' },
      { title: 'Game AI Pro, chapters on "Time-Slicing" and scheduling (Steve Rabin, ed.)', note: 'A free collection of PDFs.' },
      'Lowers skeletal mesh update rate by distance and visibility.',
    ],
    params: {
      agents: { label: 'Agent count', group: 'Scene' },
      foods: 'Food count',
      mode: { label: 'Update method', group: 'Scheduling', options: { all: 'Everything every frame', slice: 'Time slicing (1/k at a time, round-robin)', lod: 'Distance-based LOD' } },
      slices: 'Slice count k',
      near: 'LOD near radius',
      farInt: 'LOD far interval (frames)',
      showStale: 'Show stale targets',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    let N, F, ax, ay, avx, avy, target, targetGen, lastThink, glow, fx, fy, fgen;
    let frame = 0, t = 0, focusX = 0, focusY = 0, rr = 0, eaten = [], eatenRate = 0;
    let st = { thinks: 0, ms: 0, stale: 0, age: 0 };
    const hist = [];

    function respawnFood(k) { fx[k] = ctx.rng.range(10, ctx.width - 10); fy[k] = ctx.rng.range(10, ctx.height - 10); fgen[k]++; }
    function init() {
      ctx.rng = U.rng(ctx.seed);
      const r = ctx.rng;
      N = P.agents; F = P.foods;
      ax = new Float32Array(N); ay = new Float32Array(N); avx = new Float32Array(N); avy = new Float32Array(N);
      target = new Int32Array(N).fill(-1); targetGen = new Int32Array(N); lastThink = new Int32Array(N).fill(-999); glow = new Float32Array(N);
      fx = new Float32Array(F); fy = new Float32Array(F); fgen = new Int32Array(F);
      for (let i = 0; i < N; i++) { ax[i] = r.range(0, ctx.width); ay[i] = r.range(0, ctx.height); }
      for (let k = 0; k < F; k++) respawnFood(k);
      frame = 0; t = 0; rr = 0; eaten = []; eatenRate = 0;
    }
    init();

    function think(i) {
      // 비싼 부분: 모든 먹이 중 가장 가까운 것 찾기
      let best = -1, bd = Infinity;
      const x = ax[i], y = ay[i];
      for (let k = 0; k < F; k++) { const dx = fx[k] - x, dy = fy[k] - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = k; } }
      target[i] = best; targetGen[i] = fgen[best]; lastThink[i] = frame; glow[i] = 1;
    }
    function lodInterval(i) {
      const d = Math.hypot(ax[i] - focusX, ay[i] - focusY);
      return d < P.near ? 1 : d < P.near * 2.5 ? 4 : P.farInt;
    }

    return {
      update(dt) {
        frame++; t += dt;
        const W = ctx.width, H = ctx.height, m = ctx.input.mouse;
        if (m.inside) { focusX = m.x; focusY = m.y; }
        else { focusX = W * (0.5 + 0.32 * Math.sin(t * 0.4)); focusY = H * (0.5 + 0.3 * Math.sin(t * 0.63 + 1)); }
        // ── think 스케줄링 ──
        let thinks = 0;
        const t0 = ctx.now();
        if (P.mode === 'all') { for (let i = 0; i < N; i++) think(i); thinks = N; }
        else if (P.mode === 'slice') {
          const per = Math.ceil(N / P.slices);
          for (let c = 0; c < per; c++) { think(rr); rr = (rr + 1) % N; thinks++; }
        } else {
          for (let i = 0; i < N; i++) {
            const iv = lodInterval(i);
            if ((frame + i) % iv === 0 || target[i] < 0) { think(i); thinks++; } // i로 엇갈림(stagger)
          }
        }
        const ms = ctx.now() - t0;
        st.ms = st.ms ? st.ms * 0.9 + ms * 0.1 : ms;
        hist.push(ms); if (hist.length > 120) hist.shift();
        // ── 이동 (비용 낮음, 매 프레임) ──
        let eatNow = 0;
        const sp = 70;
        for (let i = 0; i < N; i++) {
          glow[i] = Math.max(0, glow[i] - dt * 4);
          const k = target[i];
          if (k < 0) continue;
          let dx = fx[k] - ax[i], dy = fy[k] - ay[i];
          const d = Math.hypot(dx, dy) || 1;
          if (targetGen[i] === fgen[k] && d < 5) { respawnFood(k); eatNow++; continue; }
          if (targetGen[i] !== fgen[k] && d < 5) continue; // 목표 위치에 도착했지만 이미 없음 → 다음 think까지 대기
          avx[i] = U.damp(avx[i], (dx / d) * sp, 6, dt); avy[i] = U.damp(avy[i], (dy / d) * sp, 6, dt);
          ax[i] = U.clamp(ax[i] + avx[i] * dt, 0, W); ay[i] = U.clamp(ay[i] + avy[i] * dt, 0, H);
        }
        eaten.push(eatNow); let sum = 0; for (const e of eaten) sum += e;
        if (eaten.length > 120) eaten.shift();
        eatenRate = sum / Math.max(1, eaten.length) / Math.max(1e-3, dt);
        let stale = 0, age = 0;
        for (let i = 0; i < N; i++) { if (target[i] >= 0 && targetGen[i] !== fgen[target[i]]) stale++; age += frame - lastThink[i]; }
        st.thinks = thinks; st.stale = stale; st.age = age / N;
      },
      render() {
        ctx.clearStats();
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        if (P.mode === 'lod') {
          D.circle(g, focusX, focusY, P.near, 'rgba(102,209,122,0.06)', 'rgba(102,209,122,0.4)', 1);
          D.circle(g, focusX, focusY, P.near * 2.5, null, 'rgba(255,203,107,0.3)', 1);
        }
        g.fillStyle = C.good;
        for (let k = 0; k < F; k++) g.fillRect(fx[k] - 2, fy[k] - 2, 4, 4);
        if (P.showStale) {
          g.beginPath();
          for (let i = 0; i < N; i++) { const k = target[i]; if (k >= 0 && targetGen[i] !== fgen[k]) { g.moveTo(ax[i], ay[i]); g.lineTo(fx[k], fy[k]); } }
          g.strokeStyle = 'rgba(255,83,112,0.35)'; g.lineWidth = 1; g.stroke();
        }
        g.fillStyle = 'rgba(216,221,230,0.45)';
        for (let i = 0; i < N; i++) if (glow[i] < 0.5) g.fillRect(ax[i] - 1.5, ay[i] - 1.5, 3, 3);
        g.fillStyle = col;
        for (let i = 0; i < N; i++) if (glow[i] >= 0.5) g.fillRect(ax[i] - 2, ay[i] - 2, 4, 4);
        D.circle(g, focusX, focusY, 7, null, '#fff', 2);
        D.plot(g, hist, W - 170, 8, 160, 44, { min: 0, color: col, label: `think ${st.ms.toFixed(2)} ms` });
        ctx.stat(GTL.L('이번 프레임 think', 'Thinks this frame'), `${st.thinks} / ${N}`);
        ctx.stat(GTL.L('think 비용', 'Think cost'), st.ms.toFixed(2) + ' ms');
        ctx.stat(GTL.L('평균 판단 나이', 'Average decision age'), st.age.toFixed(1) + GTL.L(' 프레임', ' frames'));
        ctx.stat(GTL.L('낡은 목표', 'Stale targets'), st.stale);
        ctx.stat(GTL.L('초당 먹은 먹이', 'Food eaten per second'), eatenRate.toFixed(0));
      },
    };
  },
});
