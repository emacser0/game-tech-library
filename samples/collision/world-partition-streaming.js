// 월드 스트리밍 (Unreal World Partition): 그리드 셀, 로딩 범위, 히스테리시스, 비동기 로드 예산
GTL.register({
  id: 'world-partition-streaming',
  title: '월드 스트리밍: 그리드 셀, 로딩 범위, 히스테리시스 (Unreal World Partition)',
  summary: '반경 하나로 매 프레임 셀을 로드하고 언로드하면 경계에서 같은 셀이 계속 들락거림. 언로드 반경을 더 크게 두고 로드를 비동기로 나누면 로드 수가 줄고 프레임이 고름.',
  views: { a: '단일 반경, 즉시 로드', b: '히스테리시스 + 비동기' },
  controls: '뷰 안에서 마우스를 누르고 있으면 스트리밍 소스(플레이어)가 마우스 쪽으로 이동함. 떼면 자동 경로로 돌아감.',
  info: `
    <p><b>월드 스트리밍</b>은 넓은 월드를 그리드 셀로 나누고, 플레이어 근처 셀만 메모리에 올리는 방식. Unreal의 World Partition이 대표 사례.</p>
    <p>월드 전체를 올리면 메모리와 오브젝트 수가 감당할 수 없을 만큼 커짐. 그래서 <b>스트리밍 소스</b>(보통 플레이어) 주변의 <b>로딩 범위</b> 안 셀만 로드함.</p>
    <p>반경 하나로 로드와 언로드를 모두 정하면 문제가 생김. 플레이어가 셀 경계 근처에서 왔다 갔다 하면 같은 셀이 계속 로드되고 언로드됨(스래싱, thrashing).</p>
    <p>B의 동작 원리:</p>
    <ul>
      <li><b>히스테리시스</b>: 로드 반경보다 언로드 반경을 크게 둠. 둘 사이에서는 상태를 바꾸지 않음.</li>
      <li><b>비동기 로드</b>: 로드는 시간이 걸림. 동시에 진행하는 로드 수를 제한하고 가까운 셀부터 처리함.</li>
    </ul>
    <p>단점: 언로드 반경만큼 메모리를 더 씀. 빠르게 움직이면 로드가 늦어 빈 셀이 보일 수 있음.</p>`,
  // 도식: 로드 반경과 언로드 반경 사이 띠, 경계를 오가는 소스
  diagram: (L) => `<svg viewBox="0 0 540 190" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="16" class="t-a">${L('A: 반경 하나', 'A: one radius')}</text>
    <line x1="20" y1="70" x2="240" y2="70" class="d-dim"/>
    <line x1="130" y1="40" x2="130" y2="100" class="d-a"/>
    <text x="134" y="36" class="t-small t-a">R</text>
    <path d="M110,82 L150,82" class="d-accent" marker-start="url(#arr)" marker-end="url(#arr)"/>
    <text x="20" y="62" class="t-small">${L('로드', 'load')}</text><text x="200" y="62" class="t-small">${L('언로드', 'unload')}</text>
    <text x="20" y="118" class="t-small t-dim">${L('R 근처에서 조금만 움직여도', 'A small move near R')}</text>
    <text x="20" y="131" class="t-small t-dim">${L('로드, 언로드가 반복됨', 'flips load and unload again')}</text>
    <text x="290" y="16" class="t-b">${L('B: 두 반경 (히스테리시스)', 'B: two radii (hysteresis)')}</text>
    <rect x="390" y="40" width="50" height="60" class="f-dim"/>
    <line x1="300" y1="70" x2="530" y2="70" class="d-dim"/>
    <line x1="390" y1="40" x2="390" y2="100" class="d-b"/><line x1="440" y1="40" x2="440" y2="100" class="d-b" stroke-dasharray="4 3"/>
    <text x="386" y="36" class="t-small t-b" text-anchor="end">${L('로드', 'load')} R</text>
    <text x="444" y="36" class="t-small t-b">${L('언로드', 'unload')} R+h</text>
    <path d="M395,82 L435,82" class="d-accent" marker-start="url(#arr)" marker-end="url(#arr)"/>
    <text x="300" y="118" class="t-small t-dim">${L('띠 안에서는 상태 유지', 'Inside the band, state stays')}</text>
    <text x="300" y="131" class="t-small t-dim">${L('h보다 작게 오가면 로드 0회', 'Moves smaller than h cause no loads')}</text>
    <text x="10" y="158">${L('셀 상태', 'Cell states')}</text>
    <rect x="80" y="148" width="14" height="14" class="f-dim"/><text x="98" y="159" class="t-small">${L('미로드', 'unloaded')}</text>
    <rect x="170" y="148" width="14" height="14" class="f-accent"/><text x="188" y="159" class="t-small">${L('로드 중 (비동기)', 'loading (async)')}</text>
    <rect x="300" y="148" width="14" height="14" class="f-b"/><text x="318" y="159" class="t-small">${L('로드됨', 'loaded')}</text>
    <text x="10" y="182" class="t-small t-dim">${L('동시 로드 수를 제한하고 가까운 셀부터 처리함. 한 프레임에 몰리지 않음', 'Loads in flight are capped, nearest cells first. They do not pile up in one frame')}</text>
  </svg>`,
  look: [
    '기본 상태에서 "초당 로드 수"를 비교함. A는 플레이어가 경계를 오갈 때마다 로드가 계속 생김. B는 거의 0.',
    'A의 셀 테두리를 봄. 빨간 테두리(방금 언로드)와 흰 테두리(방금 로드)가 같은 줄에서 깜박임.',
    'B에서 "히스테리시스"를 0으로 낮추면 B도 A처럼 스래싱이 생김.',
    'A를 "전부 로드"로 바꾸면 로드는 없지만 메모리와 오브젝트 수가 몇 배로 커짐.',
    'B에서 "로드 시간"을 올리고 "이동 속도"를 높이면 진행 방향 셀이 늦게 채워짐. 비동기 로드의 단점.',
  ],
  refs: [
    { type: 'engine', title: 'Unreal Engine - World Partition', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/world-partition-in-unreal-engine', note: '런타임 그리드, 셀 크기, 로딩 범위, 스트리밍 소스.' },
    { type: 'engine', title: 'Unreal Engine API - UWorldPartitionStreamingSourceComponent', note: '플레이어 말고도 스트리밍 소스를 추가할 수 있음.' },
    { type: 'engine', title: 'Unity Scripting API - SceneManager.LoadSceneAsync', url: 'https://docs.unity3d.com/ScriptReference/SceneManagement.SceneManager.LoadSceneAsync.html', note: 'Unity에서 씬을 셀처럼 나누어 비동기로 추가 로드하는 기본 수단.' },
  ],
  params: [
    { key: 'speed', label: '이동 속도 (셀/초)', type: 'range', min: 0.2, max: 8, step: 0.1, default: 0.4, shared: true, group: '스트리밍 소스' },
    { key: 'zig', label: '경계 지그재그 폭 (셀)', type: 'range', min: 0, max: 1, step: 0.05, default: 0.4, shared: true, help: '자동 경로가 셀 경계를 위아래로 오가는 폭' },
    { key: 'mode', label: '스트리밍 방식', type: 'select', group: '스트리밍', options: [
      { value: 'all', label: '전부 로드' },
      { value: 'naive', label: '단일 반경, 매 프레임 즉시 로드' },
      { value: 'partition', label: '그리드 + 히스테리시스 + 비동기' },
    ], a: 'naive', b: 'partition' },
    { key: 'radius', label: '로딩 범위 (셀)', type: 'range', min: 1, max: 6, step: 0.1, default: 3, shared: true, when: (p) => p.mode !== 'all' },
    { key: 'hyst', label: '히스테리시스 (셀)', type: 'range', min: 0, max: 3, step: 0.1, default: 1, when: (p) => p.mode === 'partition', help: '언로드 반경 = 로딩 범위 + 이 값' },
    { key: 'loadTime', label: '셀 로드 시간 (초)', type: 'range', min: 0.05, max: 2, step: 0.05, default: 0.3, when: (p) => p.mode === 'partition' },
    { key: 'inFlight', label: '동시 로드 수', type: 'int', min: 1, max: 16, default: 4, when: (p) => p.mode === 'partition', help: '프레임 비용을 나누는 예산' },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'World Streaming: Grid Cells, Loading Range, Hysteresis (Unreal World Partition)',
    summary: 'If one radius decides both load and unload every frame, the same cells keep going in and out at the border. A larger unload radius plus async loads gives far fewer loads and even frames.',
    views: { a: 'One radius, instant load', b: 'Hysteresis + async' },
    controls: 'Hold the mouse button inside a view to move the streaming source (the player) toward the mouse. Release it to return to the auto path.',
    info: `
    <p><b>World streaming</b> splits a large world into grid cells and keeps only the cells near the player in memory. Unreal World Partition is the best known example.</p>
    <p>Loading the whole world makes memory and object count far too large. So only the cells inside the <b>loading range</b> around a <b>streaming source</b> (usually the player) are loaded.</p>
    <p>Using one radius for both load and unload causes a problem. When the player moves back and forth near a cell border, the same cells load and unload again and again (thrashing).</p>
    <p>How B works:</p>
    <ul>
      <li><b>Hysteresis</b>: the unload radius is larger than the load radius. Between the two, state does not change.</li>
      <li><b>Async loading</b>: a load takes time. The number of loads in flight is capped, and the nearest cells go first.</li>
    </ul>
    <p>Downside: the extra unload radius costs memory. When moving fast, loads lag and empty cells can show.</p>`,
    look: [
      'Compare "Loads per second" in the default state. A keeps loading every time the player crosses the border. B stays near 0.',
      'Watch the cell outlines in A. Red outlines (just unloaded) and white outlines (just loaded) blink on the same rows.',
      'Set "Hysteresis" to 0 in B. B now thrashes like A.',
      'Switch A to "Load everything". There are no loads, but memory and object count are several times larger.',
      'In B, raise "Cell load time" and "Move speed". Cells ahead of the player fill in late. This is the downside of async loading.',
    ],
    refs: ['Runtime grid, cell size, loading range, streaming sources.', 'You can add streaming sources other than the player.', 'The basic tool in Unity for splitting the world into scenes and loading them additively and asynchronously.'],
    params: {
      speed: { label: 'Move speed (cells/s)', group: 'Streaming source' },
      zig: { label: 'Border zig-zag width (cells)', help: 'How far the auto path swings up and down across a cell border' },
      mode: { label: 'Streaming mode', group: 'Streaming', options: { all: 'Load everything', naive: 'One radius, instant load each frame', partition: 'Grid + hysteresis + async' } },
      radius: 'Loading range (cells)',
      hyst: { label: 'Hysteresis (cells)', help: 'Unload radius = loading range + this value' },
      loadTime: 'Cell load time (s)',
      inFlight: { label: 'Loads in flight', help: 'Budget that spreads the frame cost' },
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const GX = 24, GY = 14, NC = GX * GY;
    const UNL = 0, REQ = 1, LDG = 2, LDD = 3;
    let state, prog, objCount, mem, flash, px, py, pathT, loadsLog, unloadsLog, simT, totalLoads, hist, histT, layout = null;
    function init() {
      ctx.rng = U.rng(ctx.seed);
      const r = ctx.rng;
      state = new Uint8Array(NC); prog = new Float32Array(NC); flash = new Float32Array(NC);
      objCount = new Int32Array(NC); mem = new Float32Array(NC);
      for (let i = 0; i < NC; i++) {
        const dense = r.range(0, 1) < 0.2;
        objCount[i] = dense ? r.int(150, 400) : r.int(10, 120);
        mem[i] = 2 + objCount[i] * 0.06;
      }
      pathT = 0; simT = 0; totalLoads = 0;
      loadsLog = []; unloadsLog = []; hist = []; histT = 0;
      px = 2; py = GY / 2;
      if (P.mode === 'all') for (let i = 0; i < NC; i++) state[i] = LDD;
    }
    init();
    let lastMode = P.mode;

    // 플레이어에서 셀 사각형까지의 거리 (셀 단위)
    const cellDist = (i) => {
      const cx = i % GX, cy = (i / GX) | 0;
      const dx = Math.max(cx - px, 0, px - (cx + 1)), dy = Math.max(cy - py, 0, py - (cy + 1));
      return Math.hypot(dx, dy);
    };
    const doLoad = (i) => { state[i] = LDD; flash[i] = 0.4; loadsLog.push(simT); totalLoads++; };
    const doUnload = (i) => { state[i] = UNL; prog[i] = 0; flash[i] = -0.4; unloadsLog.push(simT); };

    function stream(dt) {
            if (P.mode === 'all') {
        for (let i = 0; i < NC; i++) if (state[i] !== LDD) doLoad(i);
      } else if (P.mode === 'naive') {
        for (let i = 0; i < NC; i++) {
          const want = cellDist(i) < P.radius;
          if (want && state[i] !== LDD) doLoad(i); // 동기 로드: 이번 프레임에 전부 처리
          else if (!want && state[i] !== UNL) doUnload(i);
        }
      } else {
        const R = P.radius, RU = P.radius + P.hyst;
        let inFlight = 0;
        const req = [];
        for (let i = 0; i < NC; i++) {
          const d = cellDist(i);
          if (state[i] === UNL) { if (d < R) state[i] = REQ; }
          else if (d > RU) { if (state[i] === LDD) doUnload(i); else { state[i] = UNL; prog[i] = 0; } continue; }
          if (state[i] === LDG) {
            prog[i] += dt / P.loadTime;
            if (prog[i] >= 1) doLoad(i); else inFlight++;
          }
          if (state[i] === REQ) req.push(i);
        }
        req.sort((a, b) => cellDist(a) - cellDist(b)); // 가까운 셀부터
        for (const i of req) { if (inFlight >= P.inFlight) break; state[i] = LDG; prog[i] = 0; inFlight++; }
      }
    }

    return {
      update(dt) {
        if (P.mode !== lastMode) { lastMode = P.mode; init(); }
        simT += dt;
        const m = ctx.input.mouse;
        const L = layout;
        if (m.down && m.inside && L) {
          const tx = (m.x - L.ox) / L.s, ty = (m.y - L.oy) / L.s;
          const dx = tx - px, dy = ty - py, d = Math.hypot(dx, dy);
          const step = Math.min(d, P.speed * 2 * dt);
          if (d > 1e-6) { px += (dx / d) * step; py += (dy / d) * step; }
          px = U.clamp(px, 0, GX); py = U.clamp(py, 0, GY);
        } else {
          // 자동 경로: 가로로 왕복하면서 y = 7 셀 경계를 위아래로 지그재그
          pathT += dt * P.speed;
          const span = GX - 4, ph = pathT % (span * 2);
          const tx = 2 + (ph < span ? ph : span * 2 - ph);
          const tri = Math.abs(((simT * 1.5) % 2) - 1) * 2 - 1; // -1..1 삼각파
          const ty = GY / 2 + tri * P.zig;
          px = U.lerp(px, tx, Math.min(1, dt * 6)); py = U.lerp(py, ty, Math.min(1, dt * 10));
        }
        stream(dt);
        for (let i = 0; i < NC; i++) if (flash[i]) flash[i] = flash[i] > 0 ? Math.max(0, flash[i] - dt) : Math.min(0, flash[i] + dt);
        while (loadsLog.length && loadsLog[0] < simT - 1) loadsLog.shift();
        while (unloadsLog.length && unloadsLog[0] < simT - 1) unloadsLog.shift();
        histT += dt;
        if (histT > 0.1) { histT = 0; hist.push(loadsLog.length); if (hist.length > 120) hist.shift(); }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const top = 78;
        const s = Math.min((W - 20) / GX, (H - top - 10) / GY), ox = (W - GX * s) / 2, oy = top;
        layout = { s, ox, oy };
        const col = ctx.side === 'a' ? C.a : C.b;
        let nLoaded = 0, memSum = 0, objSum = 0, nLoading = 0;
        for (let i = 0; i < NC; i++) {
          const x = ox + (i % GX) * s, y = oy + ((i / GX) | 0) * s;
          const st = state[i];
          D.rect(g, x + 1, y + 1, s - 2, s - 2, 'rgba(255,255,255,0.04)');
          if (st === LDD) {
            nLoaded++; memSum += mem[i]; objSum += objCount[i];
            g.globalAlpha = 0.25 + Math.min(0.5, objCount[i] / 600);
            D.rect(g, x + 1, y + 1, s - 2, s - 2, col);
            g.globalAlpha = 1;
          } else if (st === LDG) {
            nLoading++;
            D.rect(g, x + 1, y + 1 + (s - 2) * (1 - prog[i]), s - 2, (s - 2) * prog[i], C.accent);
          } else if (st === REQ) D.rect(g, x + 2, y + 2, s - 4, s - 4, null, C.dim, 1);
          if (flash[i] > 0) D.rect(g, x + 1, y + 1, s - 2, s - 2, null, '#fff', 2);
          else if (flash[i] < 0) D.rect(g, x + 1, y + 1, s - 2, s - 2, null, C.bad, 2);
        }
        // 지그재그 경계선
        D.line(g, ox, oy + (GY / 2) * s, ox + GX * s, oy + (GY / 2) * s, 'rgba(255,255,255,0.15)', 1);
        const sx = ox + px * s, sy = oy + py * s;
        if (P.mode !== 'all') {
          D.circle(g, sx, sy, P.radius * s, null, col, 1.5);
          if (P.mode === 'partition' && P.hyst > 0) {
            g.setLineDash([5, 4]); D.circle(g, sx, sy, (P.radius + P.hyst) * s, null, col, 1); g.setLineDash([]);
          }
        }
        D.circle(g, sx, sy, 5, '#fff', col, 2);
        D.plot(g, hist, 10, 8, Math.min(240, W - 20), 56, { min: 0, max: 40, color: col, label: GTL.L(`초당 로드 수 ${loadsLog.length} (그래프 최대 40)`, `Loads per second ${loadsLog.length} (graph max 40)`) });

        ctx.stat(GTL.L('로드된 셀', 'Loaded cells'), `${nLoaded} / ${NC}`);
        if (P.mode === 'partition') ctx.stat(GTL.L('로드 중 셀', 'Cells loading'), nLoading);
        ctx.stat(GTL.L('메모리', 'Memory'), memSum.toFixed(0) + ' MB');
        ctx.stat(GTL.L('오브젝트 수', 'Objects'), objSum.toLocaleString());
        ctx.stat(GTL.L('초당 로드 수', 'Loads per second'), loadsLog.length);
        ctx.stat(GTL.L('초당 언로드 수', 'Unloads per second'), unloadsLog.length);
        ctx.stat(GTL.L('누적 로드 수', 'Total loads'), totalLoads);
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
