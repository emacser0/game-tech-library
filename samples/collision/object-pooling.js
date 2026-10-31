// 오브젝트 풀링: 매 프레임 할당 vs 풀 재사용 (GC 정지 시뮬레이션)
GTL.register({
  id: 'object-pooling',
  title: '오브젝트 풀링 & GC 스파이크',
  summary: '총알과 파티클을 매번 new로 만들고 버리면 쓰레기가 쌓임. 그러면 가비지 컬렉터(GC)가 주기적으로 프레임을 멈춤. 미리 만든 객체를 재사용하면 할당이 0이 되어 프레임 시간이 평탄해짐.',
  views: { a: '매번 할당', b: '오브젝트 풀' },
  controls: '조작 없음. 분수 파티클과 원을 도는 공의 끊김 비교.',
  info: `
    <p><b>가비지 컬렉션</b>(GC)은 버려진 객체의 메모리를 자동으로 회수하는 기능. JavaScript, C#, Java 같은 언어에 있음.
    이런 언어에서 <code>new</code> 자체는 쌈. 하지만 할당이 많을수록 GC가 자주, 길게 실행됨. 그 순간 게임이 <b>끊김(hitch)</b>.
    주범은 수명이 짧고 대량으로 생기는 객체. 예: 총알, 파티클, 데미지 숫자.</p>
    <p><b>오브젝트 풀</b>은 시작할 때 객체를 미리 만들어 둠</p>
    <ul>
      <li>생성 대신 풀에서 꺼냄(<code>acquire</code>)</li>
      <li>소멸 대신 풀에 돌려줌(<code>release</code>)</li>
      <li>활성 목록은 swap-remove(지울 칸에 마지막 원소를 옮겨 넣기)로 관리해 배열도 새로 만들지 않음</li>
      <li>풀이 비면 새로 할당해야 함(풀 미스). 그래서 최대 동시 개수에 맞춰 미리 채워 둠.</li>
    </ul>
    <p>단점: 풀링만으로는 부족할 때가 많음. 다음도 매 프레임 쓰레기를 만듦.</p>
    <ul>
      <li><code>a.add(b)</code>처럼 <b>새 벡터를 반환하는 수학 함수</b></li>
      <li><code>filter</code>, <code>map</code></li>
      <li>클로저</li>
    </ul>
    <p class="dim">※ 브라우저의 실제 GC 시점은 제어할 수 없음. 그래서 이 샘플은 할당 바이트를 세고 정지를 <b>시뮬레이션</b>.
    모델: "할당 N MB마다 GC 실행, 정지 시간은 할당량에 비례". 정지하는 동안 시뮬레이션이 실제로 멈춤.</p>`,
  diagram: (L) => {
    const used = [true, true, false, true, false, true, true, false];
    return `<svg viewBox="0 0 540 172" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr-b" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="30" class="t-a">${L('A: 매번 할당', 'A: allocate each time')}</text>
    <text x="10" y="45" class="t-small t-dim">${L('쓰레기 누적 후 GC', 'garbage, then GC')}</text>
    <line x1="140" y1="66" x2="530" y2="66" class="d-dim"/>
    <path d="M140,64 L240,22 L240,64 L340,22 L340,64 L440,22 L440,64 L530,30" class="d-a"/>
    ${[240, 340, 440].map((x) => `<rect x="${x - 3}" y="14" width="6" height="52" class="f-bad" opacity="0.35"/><text x="${x + 6}" y="20" class="t-small">${L('GC 정지', 'GC pause')}</text>`).join('')}
    <text x="140" y="78" class="t-small t-dim">${L('메모리 사용량', 'memory in use')}</text>
    <text x="10" y="106" class="t-b">${L('B: 오브젝트 풀', 'B: object pool')}</text>
    <text x="10" y="121" class="t-small t-dim">${L('미리 만든 칸 재사용', 'reuse prebuilt slots')}</text>
    ${used.map((u, i) => `<rect x="${140 + i * 40}" y="94" width="36" height="26" class="${u ? 'f-b' : 'f-dim'}"/><text x="${158 + i * 40}" y="111" text-anchor="middle" class="t-small t-mono">${i}</text>`).join('')}
    <text x="140" y="146" class="t-small t-mono">free: [7, 4, 2]</text>
    <text x="250" y="146" class="t-small t-mono t-b">acquire = free.pop()</text>
    <text x="390" y="146" class="t-small t-mono">release = free.push(i)</text>
    <path d="M300,136 L226,122" class="d-b" marker-end="url(#arr-b)"/>
    <text x="10" y="166" class="t-small t-dim">${L('B는 할당이 0이라 GC가 돌지 않음. 빈 칸 번호만 스택에 넣고 뺌', 'B allocates nothing, so GC never runs. It only pushes and pops free slot numbers')}</text>
  </svg>`;
  },
  look: [
    'A를 보면 원을 도는 공과 파티클이 주기적으로 "툭" 멈춤. 위쪽 프레임 시간 그래프의 스파이크가 그 순간. B는 평탄함.',
    '"숨은 임시 할당"을 켜면 풀을 쓰는 B에도 GC가 생김. 풀링에 더해 매 프레임 생기는 임시 객체도 없애야 함.',
    'B의 "미리 채울 개수"를 0으로 하고 다시 시작하면 처음 몇 초간 풀 미스(새 할당)가 일어나다가 멈춤',
    '방출량을 올리면 A의 GC 빈도가 방출량에 비례해서 늘어남',
  ],
  refs: [
    { type: 'book', title: 'Game Programming Patterns, Object Pool (Robert Nystrom)', url: 'https://gameprogrammingpatterns.com/object-pool.html', year: 2014 },
    { type: 'engine', title: 'Unity, UnityEngine.Pool.ObjectPool<T>', url: 'https://docs.unity3d.com/ScriptReference/Pool.ObjectPool_1.html', note: 'Unity 2021부터 내장된 풀 API' },
    { type: 'article', title: 'Trash talk: the Orinoco garbage collector (V8 blog)', url: 'https://v8.dev/blog/trash-talk', year: 2019, note: 'V8의 세대별 GC(scavenger)와 정지 시간' },
    { type: 'article', title: 'Static Memory JavaScript with Object Pools (HTML5 Rocks, Colt McAnlis)', year: 2013, note: '웹 게임에서 풀로 GC 스파이크를 없앤 사례' },
  ],
  params: [
    { key: 'rate', label: '방출량 (개/초)', type: 'int', min: 200, max: 8000, default: 3000, shared: true, group: '장면' },
    { key: 'nursery', label: 'GC 주기 (할당 MB마다)', type: 'range', min: 1, max: 16, step: 0.5, default: 4, shared: true, group: 'GC 모델' },
    { key: 'gcCost', label: 'GC 정지 (ms / MB)', type: 'range', min: 2, max: 30, step: 1, default: 10, shared: true },
    { key: 'mode', label: '방식', type: 'select', group: '메모리', options: [
      { value: 'alloc', label: '매번 new + filter' },
      { value: 'pool', label: '오브젝트 풀' },
    ], a: 'alloc', b: 'pool', reset: true },
    { key: 'temps', label: '숨은 임시 할당 (벡터 연산)', type: 'bool', default: false, help: '파티클마다 매 프레임 새 {x,y} 객체 2개를 만듦' },
    { key: 'prewarm', label: '미리 채울 개수', type: 'int', min: 0, max: 20000, default: 8000, reset: true, when: (p) => p.mode === 'pool' },
  ],
  en: {
    title: 'Object Pooling & GC Spikes',
    summary: 'If you create bullets and particles with new and throw them away each time, garbage piles up. Then the garbage collector (GC) stops the frame from time to time. Reuse objects you made in advance, and allocations drop to 0 and frame time stays flat.',
    views: { a: 'Allocate every time', b: 'Object pool' },
    controls: 'No input. Compare the hitches in the particle fountain and the circling ball.',
    info: `
    <p><b>Garbage collection</b> (GC) frees the memory of discarded objects automatically. Languages like JavaScript, C#, and Java have it.
    In these languages, <code>new</code> itself is cheap. But the more you allocate, the more often and longer GC runs. At that moment the game <b>hitches</b>.
    The main cause is short-lived objects created in bulk. Examples: bullets, particles, damage numbers.</p>
    <p>An <b>object pool</b> creates objects in advance at startup.</p>
    <ul>
      <li>Instead of creating, take one from the pool (<code>acquire</code>).</li>
      <li>Instead of destroying, give it back to the pool (<code>release</code>).</li>
      <li>Manage the active list with swap-remove (move the last element into the removed slot), so no new array is created either.</li>
      <li>If the pool is empty, you must allocate a new object (pool miss). So fill it in advance to the max number in use at once.</li>
    </ul>
    <p>Downside: pooling alone is often not enough. These also create garbage every frame:</p>
    <ul>
      <li><b>Math functions that return a new vector</b>, like <code>a.add(b)</code></li>
      <li><code>filter</code>, <code>map</code></li>
      <li>Closures</li>
    </ul>
    <p class="dim">※ You cannot control when the browser actually runs GC. So this sample counts allocated bytes and <b>simulates</b> the pause.
    Model: "GC runs every N MB allocated, and the pause time grows with the amount allocated". During the pause, the simulation really stops.</p>`,
    look: [
      'Look at A. The circling ball and the particles freeze from time to time. The spikes in the frame time graph at the top mark those moments. B stays flat.',
      'Turn on "Hidden temp allocations". GC appears even in B, which uses a pool. Besides pooling, you must also remove temp objects created every frame.',
      'Set B\'s "Prewarm count" to 0 and restart. Pool misses (new allocations) happen for the first few seconds, then stop.',
      'Raise the emit rate. A\'s GC frequency rises in proportion to it.',
    ],
    refs: [
      null,
      'Built-in pool API since Unity 2021.',
      'V8\'s generational GC (scavenger) and its pause times.',
      'A case of removing GC spikes in a web game with pools.',
    ],
    params: {
      rate: { label: 'Emit rate (per second)', group: 'Scene' },
      nursery: { label: 'GC interval (every N MB allocated)', group: 'GC model' },
      gcCost: 'GC pause (ms / MB)',
      mode: { label: 'Method', group: 'Memory', options: { alloc: 'new + filter every time', pool: 'Object pool' } },
      temps: { label: 'Hidden temp allocations (vector math)', help: 'Creates 2 new {x,y} objects per particle every frame' },
      prewarm: 'Prewarm count',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    // 대략적인 V8 객체 크기(바이트), 시뮬레이션용
    const OBJ_BYTES = 72, VEC_BYTES = 32, ARR_HDR = 16, PTR = 8;
    const GRAV = 520;
    let alive, pool, free, activeN, spawnAcc, t, ballA;
    let allocSinceGC, totalAllocs, allocThisFrame, gcCount, lastPause, maxPause, stall, poolMiss;
    let frameHist, heapHist, realMs;

    function makeParticle() { return { x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, hue: 0 }; }
    function countAlloc(bytes, objs = 1) { allocSinceGC += bytes; allocThisFrame += objs; totalAllocs += objs; }

    function init() {
      ctx.rng = U.rng(ctx.seed);
      alive = []; pool = []; free = []; activeN = 0; spawnAcc = 0; t = 0; ballA = 0;
      allocSinceGC = 0; totalAllocs = 0; allocThisFrame = 0; gcCount = 0; lastPause = 0; maxPause = 0; stall = 0; poolMiss = 0;
      frameHist = []; heapHist = []; realMs = 0;
      if (P.mode === 'pool') {
        for (let i = 0; i < P.prewarm; i++) pool.push(makeParticle());
        for (let i = P.prewarm - 1; i >= 0; i--) free.push(i);
      }
    }
    init();

    function emit(p) {
      const r = ctx.rng, W = ctx.width, H = ctx.height;
      const a = -Math.PI / 2 + r.range(-0.35, 0.35), s = r.range(320, 560) * Math.min(1, H / 520);
      p.x = W / 2 + r.range(-6, 6); p.y = H - 70; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s;
      p.max = p.life = r.range(1.0, 1.8); p.hue = r.range(10, 50);
    }

    function simulate(dt) {
      // 방출
      spawnAcc += P.rate * dt;
      let k = Math.floor(spawnAcc); spawnAcc -= k;
      if (P.mode === 'alloc') {
        while (k-- > 0) { const p = makeParticle(); countAlloc(OBJ_BYTES); emit(p); alive.push(p); }
      } else {
        while (k-- > 0) {
          let idx;
          if (free.length) idx = free.pop();
          else { pool.push(makeParticle()); idx = pool.length - 1; poolMiss++; countAlloc(OBJ_BYTES); }
          emit(pool[idx]);
          alive[activeN++] = idx;
        }
      }
      // 갱신
      const g = { x: 0, y: GRAV };
      const H = ctx.height;
      const each = (p) => {
        if (P.temps) {
          // 흔한 "불변 벡터" 스타일: 매번 새 객체 생성
          const v = U.v2.add({ x: p.vx, y: p.vy }, { x: g.x * dt, y: g.y * dt });
          const pos = { x: p.x + v.x * dt, y: p.y + v.y * dt };
          countAlloc(VEC_BYTES * 2, 2); // 결과 벡터 2개 (리터럴 인자는 최적화로 사라진다고 가정)
          p.vx = v.x; p.vy = v.y; p.x = pos.x; p.y = pos.y;
        } else {
          p.vy += GRAV * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        }
        if (p.y > H - 20 && p.vy > 0) { p.y = H - 20; p.vy *= -0.35; p.vx *= 0.7; }
        p.life -= dt;
      };
      if (P.mode === 'alloc') {
        for (const p of alive) each(p);
        alive = alive.filter((p) => p.life > 0); // 새 배열 할당
        countAlloc(ARR_HDR + PTR * alive.length + 32, 2);
      } else {
        for (let i = 0; i < activeN; i++) each(pool[alive[i]]);
        for (let i = activeN - 1; i >= 0; i--) {
          const idx = alive[i];
          if (pool[idx].life <= 0) { free.push(idx); alive[i] = alive[activeN - 1]; activeN--; } // swap-remove
        }
        alive.length = Math.max(alive.length, activeN);
      }
    }

    return {
      update(dt) {
        allocThisFrame = 0;
        let frameMs = dt * 1000;
        if (stall > 0) {
          // GC 정지 중: 아무것도 진행하지 않음
          stall -= dt * 1000;
          frameHist.push(0); heapHist.push(allocSinceGC / 1048576);
        } else {
          const t0 = ctx.now();
          simulate(dt);
          realMs = realMs * 0.9 + (ctx.now() - t0) * 0.1;
          t += dt; ballA += dt * 2.2;
          if (allocSinceGC > P.nursery * 1048576) {
            const mb = allocSinceGC / 1048576;
            lastPause = 1 + mb * P.gcCost;
            maxPause = Math.max(maxPause, lastPause);
            stall = lastPause; gcCount++; allocSinceGC = 0;
            frameMs += lastPause;
          }
          frameHist.push(frameMs); heapHist.push(allocSinceGC / 1048576);
        }
        if (frameHist.length > 300) { frameHist.shift(); heapHist.shift(); }
      },
      render() {
        ctx.clearStats();
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        D.line(g, 0, H - 20, W, H - 20, C.dim, 1);
        // 파티클 (수명 4단계 알파로 묶어서 그림)
        const n = P.mode === 'alloc' ? alive.length : activeN;
        const get = P.mode === 'alloc' ? (i) => alive[i] : (i) => pool[alive[i]];
        for (let b = 0; b < 4; b++) {
          g.beginPath();
          for (let i = 0; i < n; i++) { const p = get(i), f = p.life / p.max; if (Math.min(3, Math.floor(f * 4)) === b) g.rect(p.x - 1.5, p.y - 1.5, 3, 3); }
          g.fillStyle = ctx.side === 'a' ? `rgba(255,122,89,${0.25 + b * 0.22})` : `rgba(79,195,247,${0.25 + b * 0.22})`;
          g.fill();
        }
        // 끊김 확인용 공
        const cx = W * 0.82, cy = H * 0.28, R = Math.min(W, H) * 0.12;
        D.circle(g, cx, cy, R, null, 'rgba(255,255,255,0.12)', 1);
        D.circle(g, cx + Math.cos(ballA) * R, cy + Math.sin(ballA) * R, 9, '#fff');
        if (stall > 0) D.text(g, GTL.L('GC 정지 중…', 'GC pause…'), cx - 40, cy + R + 12, { color: C.bad, size: 13 });
        // 그래프
        const gw = Math.min(W - 20, 360);
        D.plot(g, frameHist, 10, 10, gw, 54, { min: 0, max: Math.max(60, ...frameHist), color: col, label: GTL.L('프레임 시간 (ms, 시뮬레이션)', 'Frame time (ms, simulated)') });
        D.plot(g, heapHist, 10, 70, gw, 36, { min: 0, max: P.nursery, color: C.warn, label: GTL.L('GC 이후 할당량 (MB)', 'Allocated since GC (MB)') });

        ctx.stat(GTL.L('이번 프레임 할당 (객체)', 'Allocations this frame (objects)'), allocThisFrame.toLocaleString());
        ctx.stat(GTL.L('누적 할당 (객체)', 'Total allocations (objects)'), totalAllocs.toLocaleString());
        ctx.stat(GTL.L('GC 횟수', 'GC count'), gcCount);
        ctx.stat(GTL.L('최근 / 최대 GC 정지', 'Last / max GC pause'), `${lastPause.toFixed(0)} / ${maxPause.toFixed(0)} ms`);
        if (P.mode === 'pool') ctx.stat(GTL.L('풀 크기 / 사용 중 / 미스', 'Pool size / in use / misses'), `${pool.length} / ${activeN} / ${poolMiss}`);
        else ctx.stat(GTL.L('살아있는 파티클', 'Live particles'), alive.length);
        ctx.stat(GTL.L('실제 업데이트', 'Real update'), realMs.toFixed(2) + ' ms');
      },
    };
  },
});
