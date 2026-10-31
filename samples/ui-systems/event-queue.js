// 이벤트 큐: 즉시 호출 vs 큐에 넣고 다음 프레임에 처리 (연쇄 폭발)
GTL.register({
  id: 'event-queue',
  title: '이벤트 큐: 즉시 호출 vs 지연 처리',
  summary: '폭발 이벤트를 받자마자 처리기를 호출하면 연쇄 폭발이 재귀 호출이 되어 한 프레임에 몰리고 호출 깊이가 폭주함. 이벤트를 큐에 넣고 프레임마다 정해진 만큼 처리하면 깊이는 항상 1이고 부하가 여러 프레임에 퍼짐.',
  views: { a: '즉시 호출', b: '이벤트 큐' },
  controls: '드럼통을 클릭하면 불이 붙음. 자동 데모가 연쇄가 끝날 때마다 새 판을 만들고 불을 붙임.',
  info: `
    <p><b>이벤트 큐</b>(Event Queue)는 보낸 이벤트를 바로 처리하지 않고 큐에 쌓아 두었다가 나중에 꺼내 처리하는 방법. 보내는 쪽과 받는 쪽을 시간적으로 떼어 놓음.</p>
    <p>즉시 호출(관찰자 패턴을 그대로 쓴 경우)의 문제:</p>
    <ul>
      <li><b>재진입</b>(reentrancy): 처리기 안에서 다시 이벤트를 보내면 처리기가 재귀로 다시 불림. 연쇄 폭발은 호출 스택이 연쇄 길이만큼 깊어짐.</li>
      <li><b>순서 꼬임</b>: 폭발 처리기 다음에 도는 점수 처리기가 자식 폭발이 모두 끝난 뒤에야 불림. 기록 순서가 실제 순서와 거꾸로 됨.</li>
      <li><b>한 프레임 폭주</b>: 연쇄 전체가 한 프레임 안에서 끝나서 그 프레임만 크게 느려짐. 소리도 한 프레임에 수십 개가 겹침.</li>
    </ul>
    <p>큐 방식의 동작:</p>
    <ul>
      <li><code>emit</code>은 큐 끝에 이벤트를 넣고 바로 반환함.</li>
      <li>프레임마다 그 시점에 쌓인 이벤트만 꺼내 처리함. 처리 중에 새로 들어온 이벤트는 다음 프레임으로 넘어감.</li>
      <li>프레임당 처리 수(예산)를 정해 두면 부하가 프레임마다 고르게 퍼짐.</li>
    </ul>
    <p>단점: 이벤트가 처리될 때까지 지연이 생김. 보낸 시점의 상태가 처리 시점에 바뀌어 있을 수 있음. 큐가 계속 쌓이면 지연이 끝없이 늘어나므로 크기 제한이 필요함.</p>`,
  // 도식: 즉시 호출은 연쇄가 재귀 호출 스택이 됨 vs 큐는 프레임마다 쌓인 이벤트만 꺼냄
  diagram: (L) => {
    const stack = [0, 1, 2, 3].map((i) => `<rect x="${20 + i * 26}" y="${30 + i * 16}" width="96" height="14" rx="2" class="d-a"/><text x="${26 + i * 26}" y="${41 + i * 16}" class="t-small t-mono">explode(${i + 1})</text>`).join('');
    const frame = (x, n, q, out) => `<text x="${x}" y="132" class="t-small t-dim">${L('프레임 ' + n, 'Frame ' + n)}</text>
      <rect x="${x}" y="138" width="150" height="22" class="d-dim"/>
      ${q.map((e, i) => `<rect x="${x + 4 + i * 36}" y="141" width="32" height="16" class="f-b" opacity="${i === 0 ? 0.7 : 0.35}"/><text x="${x + 20 + i * 36}" y="153" text-anchor="middle" class="t-small t-mono">${e}</text>`).join('')}
      <text x="${x}" y="176" class="t-small">${out}</text>`;
    return `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="20" y="18" class="t-a">${L('A: 즉시 호출', 'A: immediate call')}</text>
    ${stack}
    <path d="M210,30 L210,92" class="d-a" marker-end="url(#arr)"/>
    <text x="220" y="48" class="t-small">${L('처리기 안에서 다시 emit하면 재귀 호출', 'emit inside a handler calls handlers again')}</text>
    <text x="220" y="62" class="t-small">${L('호출 깊이 = 연쇄 길이', 'Call depth = chain length')}</text>
    <text x="220" y="76" class="t-small t-dim">${L('연쇄 전체가 한 프레임 안에서 끝남', 'The whole chain runs in one frame')}</text>
    <text x="20" y="114" class="t-b">${L('B: 이벤트 큐', 'B: event queue')}</text>
    ${frame(20, 1, ['e1'], L('e1 처리, e2와 e3을 큐 끝에', 'run e1, push e2, e3'))}
    ${frame(195, 2, ['e2', 'e3'], L('e2, e3 처리, e4를 큐 끝에', 'run e2, e3, push e4'))}
    ${frame(370, 3, ['e4'], L('e4 처리, 큐 빔', 'run e4, queue empty'))}
    <path d="M172,149 L193,149" class="d-accent" marker-end="url(#arr)"/>
    <path d="M347,149 L368,149" class="d-accent" marker-end="url(#arr)"/>
    <text x="20" y="192" class="t-small t-dim">${L('처리 중에 들어온 이벤트는 다음 프레임으로 넘어감. 호출 깊이는 항상 1', 'Events sent during processing wait for the next frame. Call depth is always 1')}</text>
  </svg>`;
  },
  look: [
    '자동 데모에서 A는 연쇄 전체가 한 번에 터지고 "최대 호출 깊이"가 스택 한도를 넘음. 넘친 이벤트는 사라져서 일부 드럼통이 터지지 않음(빨간 X).',
    'B는 불길이 물결처럼 퍼짐. "최대 호출 깊이"는 항상 1이고 사라진 이벤트도 없음.',
    '아래 그래프에서 A는 한 프레임에 이벤트가 수십 개 몰린 막대 하나. B는 낮은 막대가 여러 프레임에 이어짐.',
    'A의 "점수 기록 순서 역전"은 재진입 때문에 생김. B는 폭발 순서와 기록 순서가 같음.',
    'B의 "프레임당 처리 예산"을 1로 낮추면 연쇄가 느려지고 "연쇄에 걸린 프레임"이 늘어남. 지연과 부하 분산은 서로 맞바꾸는 관계.',
  ],
  refs: [
    { type: 'book', title: 'Game Programming Patterns - Event Queue (Robert Nystrom)', url: 'https://gameprogrammingpatterns.com/event-queue.html', year: 2014, note: '오디오 요청을 큐로 묶는 예제와 재진입, 피드백 루프 주의점.' },
    { type: 'book', title: 'Game Programming Patterns - Observer (Robert Nystrom)', url: 'https://gameprogrammingpatterns.com/observer.html', year: 2014, note: '즉시 호출 방식의 관찰자 패턴.' },
    { type: 'engine', title: 'Godot - Object.call_deferred', url: 'https://docs.godotengine.org/en/stable/classes/class_object.html', note: '호출을 현재 프레임 끝(유휴 시간)으로 미루는 내장 기능.' },
  ],
  params: [
    { key: 'mode', label: '전달 방식', type: 'select', group: '이벤트', options: [
      { value: 'immediate', label: '즉시 호출 (재귀)' },
      { value: 'queue', label: '이벤트 큐 (다음 프레임 처리)' },
    ], a: 'immediate', b: 'queue', reset: true },
    { key: 'budget', label: '프레임당 처리 예산', type: 'int', min: 1, max: 64, default: 4, when: (p) => p.mode === 'queue', help: '한 프레임에 꺼내 처리할 최대 이벤트 수' },
    { key: 'stackLimit', label: '호출 스택 한도 (흉내)', type: 'int', min: 8, max: 300, default: 40, shared: true, group: '장면', help: '이 깊이를 넘으면 스택 오버플로로 보고 이벤트를 버림' },
    { key: 'density', label: '드럼통 밀도', type: 'range', min: 0.3, max: 0.9, step: 0.05, default: 0.65, shared: true },
    { key: 'auto', label: '자동 데모', type: 'bool', default: true, shared: true },
    { key: 'eventCost', label: '이벤트당 비용 (ms, 흉내)', type: 'range', min: 0, max: 0.5, step: 0.01, default: 0.12, shared: true, help: '처리기의 파티클, 물리 비용을 흉내 냄' },
  ],

  en: {
    title: 'Event Queue: Immediate Call vs Deferred',
    summary: 'If you call the handler as soon as an explosion event arrives, a chain reaction becomes recursion. It all lands in one frame and the call depth explodes. If you queue events and process a fixed number per frame, depth is always 1 and the load spreads over many frames.',
    views: { a: 'Immediate call', b: 'Event queue' },
    controls: 'Click a barrel to set it on fire. The auto demo builds a new field and lights it each time a chain ends.',
    info: `
    <p>An <b>event queue</b> does not handle sent events right away. It stores them in a queue and takes them out later. This separates the sender and the receiver in time.</p>
    <p>Problems with immediate calls (the plain observer pattern):</p>
    <ul>
      <li><b>Reentrancy</b>: if a handler sends an event, the handler gets called again recursively. In a chain explosion, the call stack gets as deep as the chain is long.</li>
      <li><b>Wrong order</b>: the score handler runs after the explosion handler. So it only runs after all child explosions finish. The log order is the reverse of the real order.</li>
      <li><b>One frame spike</b>: the whole chain finishes inside one frame, so that frame gets very slow. Dozens of sounds also overlap in one frame.</li>
    </ul>
    <p>How the queue works:</p>
    <ul>
      <li><code>emit</code> adds the event to the end of the queue and returns right away.</li>
      <li>Each frame takes out only the events already in the queue at that point. Events added during processing wait for the next frame.</li>
      <li>If you set a limit per frame (budget), the load spreads evenly across frames.</li>
    </ul>
    <p>Downside: events wait before they are handled. The state at send time may have changed by the time the event is handled. If the queue keeps growing, the delay grows without end, so you need a size limit.</p>`,
    look: [
      'In the auto demo, A\'s whole chain goes off at once and "Max call depth" passes the stack limit. Overflowing events get lost, so some barrels never explode (red X).',
      'In B, the fire spreads like a wave. "Max call depth" is always 1 and no events are lost.',
      'In the graph below, A shows one bar with dozens of events in one frame. B shows low bars across many frames.',
      'A\'s "Score order inversions" come from reentrancy. In B, the explosion order and the log order match.',
      'Lower B\'s "Budget per frame" to 1. The chain slows down and "Frames in chain" goes up. Delay and load spreading are a trade-off.',
    ],
    refs: [
      'An example that queues audio requests, plus warnings about reentrancy and feedback loops.',
      'The observer pattern with immediate calls.',
      'A built-in feature that defers a call to the end of the current frame (idle time).',
    ],
    params: {
      mode: { label: 'Delivery mode', group: 'Events', options: { immediate: 'Immediate call (recursive)', queue: 'Event queue (next frame)' } },
      budget: { label: 'Budget per frame', help: 'Max events taken out and handled in one frame' },
      stackLimit: { label: 'Call stack limit (simulated)', group: 'Scene', help: 'Past this depth, count it as a stack overflow and drop the event' },
      density: 'Barrel density',
      auto: 'Auto demo',
      eventCost: { label: 'Cost per event (ms, simulated)', help: 'Simulates the particle and physics cost of the handler' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const COLS = 20, ROWS = 11, RADIUS = 1.6;
    let barrels, queue, depth, maxDepth, lost, frameNo, eventsThisFrame, perFrame;
    let chainStart, chainFrames, idle, explodeSeq, scoreSeq, inversions, peakEvents, totalEvents;

    function newField() {
      const r = ctx.rng;
      barrels = [];
      // 무작위 값 개수를 항상 같게 뽑아서 두 뷰의 판이 같게 유지됨
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const on = r.next() < P.density, jx = r.range(-0.2, 0.2), jy = r.range(-0.2, 0.2);
        if (on) barrels.push({ gx: x + 0.5 + jx, gy: y + 0.5 + jy, state: 'alive', t: 0, nb: [], exp: -1, score: -1 });
      }
      for (const a of barrels) for (const b of barrels) if (a !== b && Math.hypot(a.gx - b.gx, a.gy - b.gy) < RADIUS) a.nb.push(b);
      const pick = Math.floor(r.next() * Math.max(1, barrels.length));
      queue = []; depth = 0; maxDepth = 0; lost = 0; explodeSeq = 0; scoreSeq = 0; inversions = 0; peakEvents = 0; totalEvents = 0;
      chainStart = -1; chainFrames = 0; idle = 0;
      return barrels[pick];
    }

    // 처리기 3개: 피해(연쇄), 소리, 점수
    const handlers = [
      function damage(ev) {
        const b = ev.barrel;
        b.state = 'exploded'; b.t = 0; b.exp = explodeSeq++;
        for (const n of b.nb) if (n.state === 'alive') { n.state = 'lit'; emit({ type: 'explode', barrel: n }); }
      },
      function sound() { /* 소리 재생 요청. 같은 프레임에 겹친 수를 셈 */ },
      function score(ev) {
        const b = ev.barrel;
        b.score = scoreSeq++;
        if (b.score !== b.exp) inversions++;
      },
    ];

    function dispatch(ev) {
      eventsThisFrame++; totalEvents++;
      for (const h of handlers) h(ev);
    }
    function emit(ev) {
      if (P.mode === 'queue') { queue.push(ev); return; }
      // 즉시 호출: 처리기 안에서 보낸 이벤트가 재귀로 처리됨
      depth++;
      maxDepth = Math.max(maxDepth, depth);
      if (depth > P.stackLimit) { lost++; ev.barrel.state = 'lost'; depth--; return; }
      dispatch(ev);
      depth--;
    }
    function ignite(b) {
      if (!b || b.state !== 'alive') return;
      if (chainStart < 0) chainStart = frameNo;
      b.state = 'lit';
      emit({ type: 'explode', barrel: b });
    }

    ctx.rng = U.rng(ctx.seed);
    frameNo = 0; perFrame = [];
    let first = newField(), firstTimer = 0.6;

    function layout() {
      const W = ctx.width, H = ctx.height;
      const cs = Math.min((W - 20) / COLS, (H - 120) / ROWS);
      return { cs, ox: (W - cs * COLS) / 2, oy: 28 };
    }

    return {
      update(dt) {
        frameNo++;
        eventsThisFrame = 0;
        if (first) { firstTimer -= dt; if (firstTimer <= 0) { ignite(first); first = null; } }
        if (P.mode === 'queue' && queue.length) {
          // 이 프레임 시작 시점에 있던 이벤트만, 예산만큼 처리
          const n = Math.min(queue.length, P.budget);
          const batch = queue.splice(0, n);
          depth = 1; maxDepth = Math.max(maxDepth, 1);
          for (const ev of batch) dispatch(ev);
          depth = 0;
        }
        for (const b of barrels) b.t += dt;
        const busy = queue.length > 0 || barrels.some((b) => b.state === 'lit' && P.mode === 'queue');
        if (chainStart >= 0 && (busy || eventsThisFrame)) chainFrames = frameNo - chainStart + 1;
        if (!busy && !first) {
          idle += dt;
          if (P.auto && idle > 1.6) { first = newField(); firstTimer = 0.4; }
        } else idle = 0;
        peakEvents = Math.max(peakEvents, eventsThisFrame);
        perFrame.push(eventsThisFrame);
        if (perFrame.length > 180) perFrame.shift();
      },
      onPointer(type, m) {
        if (type !== 'down') return;
        const L = layout();
        let best = null, bd = 0.8;
        for (const b of barrels) {
          const d = Math.hypot(m.x - (L.ox + b.gx * L.cs), m.y - (L.oy + b.gy * L.cs)) / L.cs;
          if (d < bd) { bd = d; best = b; }
        }
        if (best) { first = null; eventsThisFrame = 0; ignite(best); peakEvents = Math.max(peakEvents, eventsThisFrame); }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        const L = layout(), cs = L.cs, r = cs * 0.32;
        D.text(g, P.mode === 'queue' ? GTL.L(`큐 대기 ${queue.length}개`, `Queued: ${queue.length}`) : GTL.L(`현재 호출 깊이 ${depth}`, `Current call depth ${depth}`), 10, 8, { size: 12, color: col });
        for (const b of barrels) {
          const x = L.ox + b.gx * cs, y = L.oy + b.gy * cs;
          if (b.state === 'alive') D.circle(g, x, y, r, '#8a6a3a', '#5a4220', 1.5);
          else if (b.state === 'lit') { D.circle(g, x, y, r, '#8a6a3a'); D.circle(g, x, y, r + 2, null, C.warn, 2); }
          else if (b.state === 'lost') {
            D.circle(g, x, y, r, '#8a6a3a');
            D.line(g, x - r, y - r, x + r, y + r, C.bad, 2.5); D.line(g, x + r, y - r, x - r, y + r, C.bad, 2.5);
          } else {
            const f = U.clamp(1 - b.t / 0.35, 0, 1);
            if (f > 0) D.circle(g, x, y, r * (1 + 1.6 * (1 - f)), `rgba(255,${150 + 80 * f | 0},80,${0.85 * f})`);
            D.circle(g, x, y, r * 0.6, '#2a2a2a');
            if (cs > 22 && b.score >= 0) D.text(g, String(b.score), x, y, { size: 9, color: b.score === b.exp ? C.dim : C.bad, align: 'center', baseline: 'middle' });
          }
        }
        // 프레임당 이벤트 막대 그래프
        const gx = 10, gy = H - 78, gw = W - 20, gh = 56;
        D.rect(g, gx, gy, gw, gh, 'rgba(0,0,0,0.35)');
        const maxE = Math.max(20, ...perFrame);
        const bw = gw / 180;
        for (let i = 0; i < perFrame.length; i++) {
          const v = perFrame[i]; if (!v) continue;
          const h = (v / maxE) * gh;
          D.rect(g, gx + i * bw, gy + gh - h, Math.max(1, bw - 0.5), h, col);
        }
        D.text(g, GTL.L(`프레임당 처리한 이벤트 (최대 ${maxE})`, `Events handled per frame (max ${maxE})`), gx + 4, gy + 3, { size: 10, color: C.dim });

        const peakMs = 16.7 + peakEvents * P.eventCost;
        ctx.stat(GTL.L('최대 호출 깊이', 'Max call depth'), GTL.L(`${maxDepth} (한도 ${P.stackLimit})`, `${maxDepth} (limit ${P.stackLimit})`));
        ctx.stat(GTL.L('스택 초과로 사라진 이벤트', 'Events lost to stack overflow'), lost);
        ctx.stat(GTL.L('프레임당 최대 이벤트 (소리 동시 재생)', 'Max events per frame (sounds at once)'), peakEvents);
        ctx.stat(GTL.L('가장 느린 프레임 (흉내)', 'Slowest frame (simulated)'), peakMs.toFixed(1) + ' ms');
        ctx.stat(GTL.L('연쇄에 걸린 프레임', 'Frames in chain'), chainFrames);
        ctx.stat(GTL.L('점수 기록 순서 역전', 'Score order inversions'), `${inversions} / ${totalEvents}`);
      },
    };
  },
});
