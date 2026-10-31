// 넷 휴면 (Net Dormancy) & 넷 업데이트 빈도 (Unreal)
(() => {
  const U = GTL.util, D = U.draw, C = U.colors;

  function hash01(seed, a, b) {
    let h = (seed | 0) ^ Math.imul(a | 0, 0x9e3779b1) ^ Math.imul((b | 0) + 0x632be5ab, 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
    h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  // 액터 종류: 비교할 속성 수(cmp), 변경 시 보낼 바이트(bytes), 조정한 NetUpdateFrequency(tuned, Hz), 휴면 가능 여부
  const TYPES = {
    door: { cmp: 4, bytes: 2, tuned: 10, dorm: true },
    pickup: { cmp: 4, bytes: 2, tuned: 10, dorm: true },
    npc: { cmp: 10, bytes: 6, tuned: 10, dorm: false },
    capture: { cmp: 3, bytes: 4, tuned: 4, dorm: false },
    mover: { cmp: 12, bytes: 14, tuned: 999, dorm: false },
  };
  const HEADER = 4, OPEN = 10, CLOSE = 2;
  const HIST = 180;

  GTL.register({
    id: 'net-dormancy',
    title: '넷 휴면 & 업데이트 빈도 (Unreal Net Dormancy)',
    summary: '서버가 매 넷 틱 모든 액터의 속성을 비교하면 거의 멈춰 있는 문, 아이템에도 CPU를 씀. 변하지 않는 액터를 휴면시키고 바뀔 때만 깨우면(FlushNetDormancy) 비교 수가 크게 줄어듦. 드물게 바뀌는 액터는 업데이트 빈도를 낮춤.',
    views: { a: '모두 깨어 있음, 매 틱 검사', b: '휴면 + 적응형 빈도' },
    controls: '조작 없음. "문 5개 열기" 버튼으로 휴면 중인 문을 깨울 수 있음.',
    info: `
      <p><b>넷 휴면(Net Dormancy)</b>: 한동안 바뀌지 않을 액터를 복제 검사 대상에서 빼는 Unreal의 기능</p>
      <p>왜 필요한가: 서버는 넷 틱마다 복제 대상 액터의 속성을 지난번 보낸 값(섀도 상태)과 비교.
      바뀐 것이 없어도 비교 비용은 듦. 맵에 문, 아이템, 장식 액터가 수천 개면 이 비교가 서버 CPU를 크게 차지.</p>
      <ul>
        <li><code>DORM_Awake</code>: 기본값. 매번 검사.</li>
        <li><code>DORM_DormantAll</code>: 휴면. 액터 채널을 닫고 검사하지 않음.</li>
        <li><code>FlushNetDormancy()</code>: 휴면 중인 액터의 값을 바꿀 때 호출. 액터가 깨어나 바뀐 값을 보내고, 다시 휴면으로 돌아갈 수 있음.</li>
        <li><code>NetUpdateFrequency</code>: 액터를 초당 몇 번 검사할지 정함. 깃발 점령률처럼 계속 바뀌지만 급하지 않은 값은 낮게 둠.</li>
        <li><b>적응형 업데이트 빈도</b>: 바뀐 것이 없으면 검사 간격을 <code>MinNetUpdateFrequency</code>까지 늘리고, 바뀌면 다시 높임</li>
      </ul>
      <p>단점: 휴면 중에 값을 바꾸고 Flush를 빼먹으면 클라이언트에 반영되지 않음(흔한 버그). 적응형 빈도는 드문 변경을 최대 <code>1 / 최소 빈도</code>초 늦게 보냄.</p>
      <p>이 샘플의 비교 수와 바이트는 액터 종류별로 정한 단순화한 값</p>`,
    diagram: (L) => `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
      <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="arrX" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
      <rect x="10" y="60" width="100" height="44" rx="8" class="f-dim"/><rect x="10" y="60" width="100" height="44" rx="8" class="d-b"/>
      <text x="60" y="80" text-anchor="middle" class="t-mono t-small">DORM_Awake</text>
      <text x="60" y="95" text-anchor="middle" class="t-small t-dim">${L('매 틱 비교', 'compared')}</text>
      <rect x="210" y="60" width="110" height="44" rx="8" class="f-dim"/>
      <text x="265" y="80" text-anchor="middle" class="t-mono t-small">DormantAll</text>
      <text x="265" y="95" text-anchor="middle" class="t-small t-dim">${L('비교 없음', 'not compared')}</text>
      <path d="M112,70 L208,70" class="d-line" marker-end="url(#arr)"/>
      <text x="160" y="40" text-anchor="middle" class="t-small">${L('변경 없음', 'nothing changed')}</text>
      <text x="160" y="54" text-anchor="middle" class="t-small t-mono">SetNetDormancy</text>
      <path d="M208,94 L112,94" class="d-accent" marker-end="url(#arrX)"/>
      <text x="160" y="116" text-anchor="middle" class="t-small t-mono">FlushNetDormancy</text>
      <text x="160" y="130" text-anchor="middle" class="t-small">${L('바뀐 값 전송', 'sends the change')}</text>
      <path d="M300,104 C320,150 210,150 230,106" class="d-bad" stroke-dasharray="4 3"/>
      <text x="265" y="160" text-anchor="middle" class="t-small t-dim">${L('Flush 없이 값 변경', 'change without Flush')}</text>
      <text x="265" y="174" text-anchor="middle" class="t-small t-dim">${L('클라이언트에 안 감', 'client never sees it')}</text>
      <text x="350" y="20" class="t-small">${L('적응형 업데이트 빈도', 'Adaptive update frequency')}</text>
      <line x1="350" y1="120" x2="530" y2="120" class="d-dim"/>
      <line x1="350" y1="30" x2="350" y2="120" class="d-dim"/>
      <text x="346" y="44" text-anchor="end" class="t-small t-mono t-dim">max</text>
      <text x="346" y="112" text-anchor="end" class="t-small t-mono t-dim">min</text>
      <path d="M350,40 L380,40 Q400,40 420,108 L455,108 L455,40 L470,40 Q490,40 510,108 L530,108" class="d-b"/>
      <circle cx="455" cy="40" r="4" class="f-accent"/>
      <text x="455" y="136" text-anchor="middle" class="t-small">${L('값 변경', 'change')}</text>
      <text x="350" y="160" class="t-small t-dim">${L('변경이 없으면 검사 빈도를', 'No change: the check rate')}</text>
      <text x="350" y="174" class="t-small t-dim">${L('MinNetUpdateFrequency까지 낮춤', 'falls to MinNetUpdateFrequency')}</text>
      <text x="4" y="194" class="t-small t-dim">${L('휴면 액터는 채널이 닫혀 비교 비용이 0. 깨울 때만 채널 열기 비용이 듦', 'A dormant actor has a closed channel and costs no compares. Waking it costs one channel open')}</text>
    </svg>`,
    look: [
      '"속성 비교 / 틱"을 비교하면 A는 모든 액터를 매번 검사. B는 움직이는 액터와 깨어난 액터만 검사해서 몇 분의 일로 줄어듦.',
      '"문 5개 열기"를 누르면 B의 문이 노란 테두리(Flush)로 깨어나 값을 보내고, 1초 뒤 다시 회색(휴면)으로 돌아감',
      'B에서 "변경 시 Flush 호출"을 끄고 문을 열면 빨간 테두리가 남음. 서버 값이 바뀌었지만 클라이언트에 영영 가지 않음.',
      'B의 MinNetUpdateFrequency를 0.5로 낮추면 비교 수는 더 줄지만 "평균 반영 지연"이 늘어남',
      '"NetUpdateFrequency"를 A처럼 "모두 틱마다"로 두면 깃발(점령률) 액터가 매 틱 전송되어 대역폭이 늘어남',
    ],
    refs: [
      { type: 'engine', title: 'Unreal Engine - Actor Network Dormancy', note: 'DORM_Awake, DORM_DormantAll, FlushNetDormancy 설명. 휴면 중 값 변경 시 Flush 필요.' },
      { type: 'engine', title: 'Unreal Engine - Detailed Actor Replication Flow', note: '액터마다 NetUpdateFrequency로 검사 시점을 정하고, 속성을 비교해 바뀐 것만 보내는 흐름' },
      { type: 'engine', title: 'Unreal Engine - AActor::NetUpdateFrequency, MinNetUpdateFrequency', note: '적응형 업데이트 빈도(net.UseAdaptiveNetUpdateFrequency)가 두 값 사이에서 빈도 조절' },
      { type: 'article', title: 'Network Compendium (Cedric Neukirchen)', note: 'Unreal 네트워크 입문 문서. 복제, 관련성, 우선순위 정리.' },
    ],
    params: [
      { key: 'count', label: '액터 수', type: 'int', min: 20, max: 200, default: 80, shared: true, reset: true, group: '장면' },
      { key: 'movers', label: '움직이는 액터 수', type: 'int', min: 0, max: 20, default: 4, shared: true, reset: true },
      { key: 'changeRate', label: '상태 변경 빈도 (액터당 분당)', type: 'range', min: 0, max: 30, step: 0.5, default: 6, shared: true, help: '문, 아이템, NPC가 상태를 바꾸는 평균 횟수' },
      { key: 'tickRate', label: '서버 넷 틱 (Hz)', type: 'int', min: 10, max: 60, default: 30, shared: true },
      { key: 'dormancy', label: '휴면 (DORM_DormantAll)', type: 'bool', a: false, b: true, group: '기법', help: '문과 아이템을 휴면시킴. 바뀌지 않으면 비교하지 않음' },
      { key: 'flush', label: '변경 시 Flush 호출', type: 'bool', default: true, when: (p) => p.dormancy, help: '휴면 중인 액터의 값을 바꿀 때 FlushNetDormancy 호출' },
      { key: 'freqMode', label: 'NetUpdateFrequency', type: 'select', options: [
        { value: 'max', label: '모두 틱마다' },
        { value: 'tuned', label: '종류별 조정' },
        { value: 'adaptive', label: '종류별 조정 + 적응형' },
      ], a: 'max', b: 'adaptive', help: '종류별 조정: 문, 아이템, NPC 10Hz, 깃발 4Hz, 움직이는 액터는 매 틱' },
      { key: 'minFreq', label: 'MinNetUpdateFrequency (Hz)', type: 'range', min: 0.5, max: 10, step: 0.5, default: 2, when: (p) => p.freqMode === 'adaptive' },
      { key: 'openDoors', label: '문 5개 열기', type: 'button', buttonLabel: '문 5개 열기' },
      { key: 'restart', label: '다시 시작', type: 'button' },
    ],
    en: {
      title: 'Net Dormancy & Update Frequency (Unreal)',
      summary: 'If the server compares every property of every actor on every net tick, it spends CPU even on doors and pickups that barely change. Put unchanging actors to sleep and wake them only on change (FlushNetDormancy), and compares drop sharply. Lower the update frequency of actors that change rarely.',
      views: { a: 'All awake, checked every tick', b: 'Dormancy + adaptive frequency' },
      controls: 'No input. The "Open 5 doors" button wakes dormant doors.',
      info: `
      <p><b>Net dormancy</b> is an Unreal feature that takes actors out of replication checks while they are not expected to change.</p>
      <p>Why: on each net tick, the server compares the properties of each replicated actor with the values it sent last time (the shadow state).
      This compare costs CPU even when nothing changed. With thousands of doors, pickups, and props in a map, these compares take a large share of server CPU.</p>
      <ul>
        <li><code>DORM_Awake</code>: the default. The actor is checked every time.</li>
        <li><code>DORM_DormantAll</code>: dormant. The actor channel closes and the actor is not checked.</li>
        <li><code>FlushNetDormancy()</code>: call it when you change a dormant actor. The actor wakes, sends the change, and can go dormant again.</li>
        <li><code>NetUpdateFrequency</code>: how many times per second the actor is checked. Keep it low for values that change all the time but are not urgent, like a capture progress bar.</li>
        <li><b>Adaptive update frequency</b>: when nothing changes, the check interval grows down to <code>MinNetUpdateFrequency</code>. A change raises it again.</li>
      </ul>
      <p>Downside: if you change a value during dormancy and forget the Flush, clients never see it (a common bug). Adaptive frequency can send a rare change up to <code>1 / min frequency</code> seconds late.</p>
      <p>Compare counts and bytes in this sample are simplified values per actor type.</p>`,
      look: [
        'Compare "Property compares / tick". A checks every actor every time. B checks only moving and awake actors, a fraction of A.',
        'Press "Open 5 doors". The doors in B wake with a yellow border (Flush), send the change, and turn gray (dormant) again after 1 s.',
        'In B, turn off "Flush on change" and open doors. A red border stays. The server value changed, but the client never gets it.',
        'Lower MinNetUpdateFrequency in B to 0.5. Compares drop further, but "Avg update delay" grows.',
        'Set "NetUpdateFrequency" to "Every tick" as in A. The flag (capture progress) actors send every tick and bandwidth grows.',
      ],
      refs: [
        'DORM_Awake, DORM_DormantAll, and FlushNetDormancy. A change during dormancy needs a Flush.',
        'Each actor is checked when its NetUpdateFrequency says so. Properties are compared and only changes are sent.',
        'Adaptive update frequency (net.UseAdaptiveNetUpdateFrequency) moves the rate between these two values.',
        'An introduction to Unreal networking: replication, relevancy, priority.',
      ],
      params: {
        count: { label: 'Actor count', group: 'Scene' },
        movers: 'Moving actors',
        changeRate: { label: 'State changes (per actor per minute)', help: 'Average number of state changes for doors, pickups, and NPCs' },
        tickRate: 'Server net tick (Hz)',
        dormancy: { label: 'Dormancy (DORM_DormantAll)', group: 'Technique', help: 'Doors and pickups go dormant. No compares while nothing changes' },
        flush: { label: 'Flush on change', help: 'Call FlushNetDormancy when a dormant actor changes' },
        freqMode: { label: 'NetUpdateFrequency', help: 'Per type: doors, pickups, NPCs 10 Hz, flags 4 Hz, movers every tick', options: { max: 'Every tick', tuned: 'Per type', adaptive: 'Per type + adaptive' } },
        minFreq: 'MinNetUpdateFrequency (Hz)',
        openDoors: { label: 'Open 5 doors', buttonLabel: 'Open 5 doors' },
        restart: 'Restart',
      },
    },

    setup(ctx) {
      const P = ctx.params;
      let st;
      function init() {
        ctx.rng = U.rng(ctx.seed);
        const n = P.count, m = Math.min(P.movers, n);
        const kinds = [];
        for (let i = 0; i < m; i++) kinds.push('mover');
        const rest = n - m;
        const nd = Math.round(rest * 0.35), np = Math.round(rest * 0.3), nn = Math.round(rest * 0.2);
        for (let i = 0; i < rest; i++) kinds.push(i < nd ? 'door' : i < nd + np ? 'pickup' : i < nd + np + nn ? 'npc' : 'capture');
        ctx.rng.shuffle(kinds);
        const dormOn = P.dormancy;
        const actors = kinds.map((k, i) => ({
          i, k, T: TYPES[k],
          val: k === 'capture' ? ctx.rng.range(0, 1) : k === 'mover' ? ctx.rng.range(0, U.TAU) : 0,
          sent: null, client: null, pending: -1,
          dorm: dormOn && TYPES[k].dorm, awakeUntil: 0, freq: 999, next: 0,
          cmpT: -1, sendT: -9, flushT: -9, spin: ctx.rng.range(1.2, 2.4) * (ctx.rng.next() < 0.5 ? -1 : 1),
        }));
        // 처음 상태는 접속 시 한 번 보냈다고 가정
        for (const a of actors) { a.sent = a.val; a.client = a.val; }
        st = {
          seed: ctx.rng.int(1, 1e9), actors, now: 0, acc: 0, tick: 0, doorCursor: 0, openReq: 0,
          cmpHist: [], bwHist: [], bytesWin: [], cmpWin: [], lat: [], lastTickT: -1, considered: 0,
        };
      }
      init();

      const maxFreqOf = (a) => (P.freqMode === 'max' ? P.tickRate : Math.min(P.tickRate, a.T.tuned));

      function change(a, t) {
        if (a.k === 'door' || a.k === 'pickup') a.val = (a.val + 1) % 2;
        else if (a.k === 'npc') a.val = (a.val + 1) % 8;
        if (a.pending < 0) a.pending = t;
        if (a.dorm && P.flush) { a.dorm = false; a.flushT = t; a.wake = true; a.next = t; }
        if (!a.dorm) a.awakeUntil = t + 1;
      }

      function netTick() {
        const dt = 1 / P.tickRate;
        st.now += dt; st.tick++;
        const t = st.now;
        const pPerTick = P.changeRate / 60 / P.tickRate;
        let cmp = 0, bytes = 0, considered = 0;

        // 1) 서버 게임 로직: 상태 변경 (두 뷰가 같은 해시로 같은 변경을 받음)
        for (const a of st.actors) {
          if (a.k === 'mover') { a.val += a.spin * dt; continue; }
          if (a.k === 'capture') { a.val = (a.val + 0.08 * dt) % 1; if (a.pending < 0) a.pending = t; continue; }
          const scale = a.k === 'door' ? 1 : a.k === 'pickup' ? 0.5 : 0.7;
          if (hash01(st.seed, a.i, st.tick) < pPerTick * scale) change(a, t);
        }
        while (st.openReq > 0) {
          st.openReq--;
          const doors = st.actors.filter((a) => a.k === 'door');
          for (let j = 0; j < 5 && doors.length; j++) change(doors[(st.doorCursor + j) % doors.length], t);
          st.doorCursor += 5;
        }

        // 2) 복제: 깨어 있고 검사 시점이 된 액터만 속성 비교
        for (const a of st.actors) {
          if (a.dorm) continue;
          if (t + 1e-6 < a.next) continue;
          considered++;
          cmp += a.T.cmp; a.cmpT = st.tick;
          const maxF = maxFreqOf(a);
          if (a.val !== a.sent) {
            bytes += HEADER + a.T.bytes + (a.wake ? OPEN : 0);
            a.wake = false;
            a.sent = a.val; a.client = a.val; a.sendT = t;
            if (a.pending >= 0) { st.lat.push({ t, d: t - a.pending }); a.pending = -1; }
            a.freq = maxF;
          } else if (P.freqMode === 'adaptive') {
            a.freq = Math.max(P.minFreq, Math.min(a.freq, maxF) * 0.7);
          } else a.freq = maxF;
          a.next = t + 1 / Math.min(a.freq, maxF) - 1e-6;
          // 바뀐 값을 보낸 뒤 1초 동안 변화가 없으면 다시 휴면
          if (P.dormancy && a.T.dorm && t >= a.awakeUntil && a.pending < 0) { a.dorm = true; bytes += CLOSE; }
        }
        if (!P.dormancy) for (const a of st.actors) if (a.dorm) { a.dorm = false; a.wake = true; a.next = t; }

        st.lastTickT = st.tick; st.considered = considered;
        st.cmpHist.push(cmp); st.bwHist.push(bytes * P.tickRate * 8 / 1000);
        if (st.cmpHist.length > HIST) { st.cmpHist.shift(); st.bwHist.shift(); }
        st.bytesWin.push({ t, b: bytes }); st.cmpWin.push({ t, c: cmp, n: considered });
        while (st.bytesWin[0].t < t - 1) st.bytesWin.shift();
        while (st.cmpWin[0].t < t - 1) st.cmpWin.shift();
        while (st.lat.length && st.lat[0].t < t - 4) st.lat.shift();
      }

      function icon(g, a, cx, cy, r, col) {
        if (a.k === 'door') {
          if (a.val) { D.line(g, cx - r, cy - r, cx - r * 0.3, cy - r * 0.6, col, 2); D.line(g, cx + r, cy - r, cx + r * 0.3, cy - r * 0.6, col, 2); D.line(g, cx - r, cy + r, cx + r, cy + r, col, 1); }
          else D.rect(g, cx - r, cy - r, r * 2, r * 2, null, col, 2);
        } else if (a.k === 'pickup') {
          const pts = [{ x: cx, y: cy - r }, { x: cx + r, y: cy }, { x: cx, y: cy + r }, { x: cx - r, y: cy }];
          D.poly(g, pts, a.val ? null : col, col, 1.5);
        } else if (a.k === 'npc') {
          D.circle(g, cx, cy, r * 0.8, null, col, 1.5);
          const ang = a.val * 0.785;
          D.line(g, cx, cy, cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, col, 1.5);
        } else if (a.k === 'capture') {
          D.line(g, cx - r, cy - r, cx - r, cy + r, col, 1.5);
          D.rect(g, cx - r, cy - r, r * 2, r * 0.8, null, col, 1);
          D.rect(g, cx - r, cy - r, r * 2 * a.val, r * 0.8, col);
        } else {
          D.circle(g, cx, cy, r * 0.9, null, 'rgba(255,255,255,0.15)', 1);
          D.circle(g, cx + Math.cos(a.val) * r * 0.9, cy + Math.sin(a.val) * r * 0.9, Math.max(2, r * 0.35), col);
        }
      }

      return {
        update(dt) {
          st.acc += dt;
          const step = 1 / P.tickRate;
          let n = 0;
          while (st.acc >= step && n++ < 8) { netTick(); st.acc -= step; }
          if (n >= 8) st.acc = 0;
        },
        render() {
          const g = ctx.g, W = ctx.width, H = ctx.height;
          const side = ctx.side === 'a' ? C.a : C.b;
          const awakeFill = ctx.side === 'a' ? 'rgba(255,122,89,0.16)' : 'rgba(79,195,247,0.16)';
          const pad = 6, top = 30, legendH = 18, plotH = Math.max(50, Math.min(110, H * 0.26));
          const gx = pad, gy = top + legendH, gw = W - pad * 2, gh = Math.max(40, H - plotH - legendH - top - pad * 2);
          const n = st.actors.length;
          const cols = Math.max(1, Math.ceil(Math.sqrt(n * gw / gh)));
          const rows = Math.ceil(n / cols);
          const s = Math.min(gw / cols, gh / rows);
          const ox = gx + (gw - s * cols) / 2;
          const t = st.now;

          // 범례
          let lx = pad;
          const leg = (fill, stroke, label) => {
            D.rect(g, lx, top + 3, 10, 10, fill, stroke, stroke ? 2 : 1);
            D.text(g, label, lx + 14, top + 3, { size: 10, color: C.dim });
            g.font = '10px ui-monospace, Consolas, monospace';
            lx += 14 + (g.measureText(label).width || label.length * 6) + 12;
          };
          leg(awakeFill, side, GTL.L('깨어 있음 (검사)', 'awake (checked)'));
          leg('rgba(255,255,255,0.05)', null, GTL.L('휴면', 'dormant'));
          leg(null, C.warn, 'Flush');
          leg(null, C.bad, GTL.L('클라이언트 불일치', 'client out of sync'));

          for (const a of st.actors) {
            const cx0 = ox + (a.i % cols) * s, cy0 = gy + Math.floor(a.i / cols) * s;
            const inset = Math.max(1, s * 0.08);
            const x = cx0 + inset, y = cy0 + inset, w = s - inset * 2;
            D.rect(g, x, y, w, w, a.dorm ? 'rgba(255,255,255,0.04)' : awakeFill);
            if (!a.dorm && a.cmpT === st.lastTickT) D.rect(g, x + 0.5, y + 0.5, w - 1, w - 1, null, side, 1);
            const stale = a.pending >= 0 && t - a.pending > 0.6 && a.k !== 'capture' && a.k !== 'mover';
            if (stale) D.rect(g, x + 1, y + 1, w - 2, w - 2, null, C.bad, 2);
            else if (t - a.flushT < 0.5) D.rect(g, x + 1, y + 1, w - 2, w - 2, null, C.warn, 2);
            if (t - a.sendT < 0.12) D.circle(g, x + w - 4, y + 4, 2.2, '#fff');
            icon(g, a, x + w / 2, y + w / 2, w * 0.26, a.dorm ? C.dim : C.text);
          }

          // 그래프
          const py = H - plotH - pad, pw = (W - pad * 3) / 2;
          const all = st.actors.reduce((sum, a) => sum + a.T.cmp, 0);
          const nm = st.actors.filter((a) => a.k === 'mover').length, nc = st.actors.filter((a) => a.k === 'capture').length;
          const bwMax = Math.max(8, ((nm * (HEADER + TYPES.mover.bytes) + nc * (HEADER + TYPES.capture.bytes)) * P.tickRate * 8 / 1000) * 1.6);
          D.plot(g, st.cmpHist, pad, py, pw, plotH, { min: 0, max: all, color: side, label: GTL.L(`속성 비교 / 틱 (최대 ${all})`, `Property compares / tick (max ${all})`) });
          D.plot(g, st.bwHist, pad * 2 + pw, py, pw, plotH, { min: 0, max: bwMax, color: side, label: GTL.L(`대역폭 kbps (최대 ${bwMax.toFixed(0)})`, `Bandwidth kbps (max ${bwMax.toFixed(0)})`) });

          const ticks = Math.max(1, st.cmpWin.length);
          const cmpAvg = st.cmpWin.reduce((s2, e) => s2 + e.c, 0) / ticks;
          const consAvg = st.cmpWin.reduce((s2, e) => s2 + e.n, 0) / ticks;
          const kbps = st.bytesWin.reduce((s2, e) => s2 + e.b, 0) * 8 / 1000;
          const dormN = st.actors.filter((a) => a.dorm).length;
          const latAvg = st.lat.length ? st.lat.reduce((s2, e) => s2 + e.d, 0) / st.lat.length : 0;
          const stale = st.actors.filter((a) => a.pending >= 0 && t - a.pending > 1 && a.k !== 'capture' && a.k !== 'mover').length;
          ctx.stat(GTL.L('속성 비교 / 틱', 'Property compares / tick'), cmpAvg.toFixed(0));
          ctx.stat(GTL.L('검사한 액터 / 틱', 'Actors checked / tick'), consAvg.toFixed(1) + ' / ' + n);
          ctx.stat(GTL.L('휴면 액터', 'Dormant actors'), dormN);
          ctx.stat(GTL.L('대역폭', 'Bandwidth'), kbps.toFixed(1) + ' kbps');
          ctx.stat(GTL.L('평균 반영 지연', 'Avg update delay'), (latAvg * 1000).toFixed(0) + ' ms');
          ctx.stat(GTL.L('클라이언트 불일치 액터', 'Out-of-sync actors'), stale);
        },
        onAction(key) {
          if (key === 'restart') init();
          if (key === 'openDoors') st.openReq++;
        },
      };
    },
  });
})();
