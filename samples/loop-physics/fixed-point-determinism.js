// 결정론: 부동소수점 vs 고정소수점. 두 "머신"이 같은 입력으로 같은 결과를 내는가
GTL.register({
  id: 'fixed-point-determinism',
  title: '결정론: 부동소수점 vs 고정소수점',
  summary: '락스텝 멀티플레이와 리플레이는 모든 머신이 비트 단위로 같은 시뮬레이션을 해야 함. 부동소수점은 덧셈 순서나 정밀도가 조금만 달라도 결과가 갈라짐. 혼돈계(당구 브레이크)는 그 차이를 눈에 보이는 크기로 키움. 정수(고정소수점)는 결합 법칙이 성립해 갈라지지 않음.',
  views: { a: '부동소수점 (float64)', b: '고정소수점 (Q16 정수)' },
  controls: '조작 없음. 14초마다 같은 초기 조건으로 다시 브레이크함.',
  info: `
    <p><b>결정론</b>(determinism)은 같은 입력이면 어느 머신에서든 비트까지 같은 결과가 나오는 성질. 락스텝 멀티플레이와 리플레이에 필요함.</p>
    <p>각 뷰 안에서 <b>머신 1</b>(채운 공)과 <b>머신 2</b>(흰 테두리)가 <b>완전히 같은 초기 조건</b>으로 같은 물리를 돌림.
    다른 점은 머신 2가 힘을 <b>반대 순서로 더하는</b> 것 하나뿐. 실제로 이런 차이가 흔히 생기는 곳:</p>
    <ul>
      <li>멀티스레드 작업 분배</li>
      <li>컴파일러 최적화(연산 재배열, FMA)</li>
      <li>다른 CPU, 다른 플랫폼</li>
    </ul>
    <p>부동소수점 덧셈은 결합 법칙이 성립하지 않음. 그래서 <code>(a+b)+c ≠ a+(b+c)</code>일 수 있음. 차이는 처음엔 1 ULP(≈10⁻¹⁶)지만
    공끼리 부딪칠 때마다 커져서(혼돈) 몇 초 안에 <b>전혀 다른 결과</b>가 됨. 락스텝 게임에서는 이것이 곧 <b>디싱크</b>(desync, 머신 간 상태 불일치).</p>
    <p><b>고정소수점</b>은 위치를 <code>px × 65536</code> 정수로 저장하고, 모든 연산을 정수 곱셈과 나눗셈(버림)으로 처리함. 정수 덧셈은 순서와 관계없이 정확함.
    그래서 두 머신의 상태 해시가 끝까지 같음.</p>
    <p>단점: 정밀도와 범위를 직접 관리해야 함. sqrt와 삼각함수도 정수 버전이 필요함.</p>
    <p>"차이 없음"을 고르면 부동소수점도 <b>같은 코드, 같은 순서, 같은 플랫폼</b>에서는 완벽히 결정론적임을 확인할 수 있음. 문제는 "같은 연산"을 보장하기 어렵다는 점.</p>`,
  // 도식: 부동소수점 덧셈은 순서에 따라 결과가 다름. 그 차이가 충돌마다 커짐. 정수는 순서와 관계없이 같음
  diagram: (L) => `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="18" class="t-a">${L('A: float64 덧셈', 'A: float64 addition')}</text>
    <text x="10" y="38" class="t-small t-mono">(0.1 + 0.2) + 0.3</text><text x="120" y="38" class="t-small t-mono">= 0.6000000000000001</text>
    <text x="10" y="54" class="t-small t-mono">0.1 + (0.2 + 0.3)</text><text x="120" y="54" class="t-small t-mono">= 0.6</text>
    <text x="10" y="70" class="t-small t-dim">${L('순서만 바꿔도 마지막 비트가 다름', 'Changing the order changes the last bit')}</text>
    <text x="10" y="102" class="t-b">${L('B: Q16 정수 (값 × 65536)', 'B: Q16 integer (value × 65536)')}</text>
    <text x="10" y="122" class="t-small t-mono">6554 + 13107 + 19661</text>
    <text x="10" y="138" class="t-small t-mono">${L('어느 순서든 = 39322', 'any order = 39322')}</text>
    <text x="10" y="154" class="t-small t-dim">${L('정수 덧셈은 결합 법칙이 성립함', 'Integer addition is associative')}</text>
    <line x1="320" y1="160" x2="530" y2="160" class="d-line"/><line x1="320" y1="160" x2="320" y2="22" class="d-line"/>
    <text x="324" y="18" class="t-small">${L('머신 1, 2의 위치 차이 (로그)', 'Gap between machine 1 and 2 (log)')}</text>
    <text x="530" y="176" text-anchor="end" class="t-small">${L('시간', 'time')}</text>
    <text x="316" y="147" text-anchor="end" class="t-small t-mono">1e-16</text>
    <text x="316" y="47" text-anchor="end" class="t-small t-mono">1 px</text>
    <line x1="320" y1="44" x2="530" y2="44" class="d-dim" stroke-dasharray="4 3"/>
    <path d="M320,144 L350,144 L350,128 L378,128 L378,108 L402,108 L402,84 L424,84 L424,58 L444,58 L444,34 L530,34" class="d-a"/>
    <text x="352" y="122" class="t-small t-a">${L('충돌마다 증폭', 'grows at each hit')}</text>
    <line x1="320" y1="158" x2="530" y2="158" class="d-b"/>
    <text x="450" y="152" class="t-small t-b">${L('B: 항상 0', 'B: always 0')}</text>
    <text x="448" y="28" class="t-small t-dim">${L('디싱크', 'desync')}</text>
  </svg>`,
  look: [
    'A를 보면 브레이크 직후(약 0.15초)에 이미 "첫 비트 차이"가 기록됨. 이때 위치 차는 10⁻⁶px 수준. 충돌이 거듭되며 커져 5초쯤부터 채운 공과 흰 테두리가 갈라짐(빨간 선). B는 해시가 끝까지 같음.',
    'A의 "머신 2 차이"를 "float32 정밀도"로 바꾸면 첫 프레임부터 갈라짐(x87 80비트 vs SSE 64비트 차이와 같은 종류의 문제).',
    '"차이 없음"을 고르면 A도 해시가 같음. 부동소수점 자체가 무작위인 것은 아님.',
    '큐 속도를 낮추면 충돌이 적어 차이가 천천히 커짐. 비트는 달라도 화면상 차이는 끝까지 안 보일 수 있음. 그래도 해시가 다르므로 락스텝에서는 디싱크.',
  ],
  refs: [
    { type: 'article', title: 'Floating Point Determinism (Glenn Fiedler)', url: 'https://gafferongames.com/post/floating_point_determinism/', year: 2010, note: '컴파일러, CPU별 부동소수점 결과 차이와 락스텝.' },
    { type: 'talk', title: '1500 Archers on a 28.8: Network Programming in Age of Empires and Beyond (Bettner, Terrano)', year: 2001, note: 'GDC 2001. 결정론적 락스텝과 out-of-sync 디버깅.' },
    { type: 'article', title: 'Floating-Point Determinism (Bruce Dawson)', year: 2013, note: 'Random ASCII 블로그. FMA, x87, 연산 순서 문제 정리.' },
    { type: 'article', title: 'What Every Computer Scientist Should Know About Floating-Point Arithmetic (David Goldberg)', year: 1991, note: 'ACM Computing Surveys. 결합 법칙 비성립, 반올림 오차.' },
  ],
  params: [
    { key: 'num', label: '수 표현', type: 'select', group: '시뮬레이션', options: [
      { value: 'float', label: '부동소수점 (float64)' },
      { value: 'fixed', label: '고정소수점 (Q16 정수)' },
    ], a: 'float', b: 'fixed', reset: true },
    { key: 'diff', label: '머신 2 차이', type: 'select', options: [
      { value: 'order', label: '힘 합산 순서 반대' },
      { value: 'fround', label: 'float32 정밀도 (부동소수점만)' },
      { value: 'none', label: '차이 없음 (같은 코드)' },
    ], default: 'order', reset: true, help: '고정소수점에서는 float32를 "순서 반대"와 같게 처리' },
    { key: 'speed', label: '큐 속도 (px/s)', type: 'range', min: 400, max: 3000, step: 50, default: 1800, shared: true, reset: true },
    { key: 'restart', label: '다시 브레이크', type: 'button' },
  ],
  en: {
    title: 'Determinism: Floating Point vs Fixed Point',
    summary: 'Lockstep multiplayer and replays need every machine to run the exact same simulation, bit for bit. With floating point, a small change in addition order or precision makes results split apart. A chaotic system (a pool break) grows that gap until you can see it. Integers (fixed point) follow the associative law, so they never split.',
    views: { a: 'Floating point (float64)', b: 'Fixed point (Q16 integer)' },
    controls: 'No input. Every 14 seconds it breaks again from the same starting state.',
    info: `
    <p><b>Determinism</b> means the same input gives the same result, down to the bit, on any machine. Lockstep multiplayer and replays need it.</p>
    <p>In each view, <b>machine 1</b> (filled balls) and <b>machine 2</b> (white outlines) run the same physics from <b>exactly the same starting state</b>.
    The only difference: machine 2 <b>adds forces in reverse order</b>. In practice, this kind of difference often comes from:</p>
    <ul>
      <li>Splitting work across threads</li>
      <li>Compiler optimizations (reordering operations, FMA)</li>
      <li>Different CPUs and platforms</li>
    </ul>
    <p>Floating point addition is not associative. So <code>(a+b)+c ≠ a+(b+c)</code> can happen. The gap starts at 1 ULP (≈10⁻¹⁶),
    but it grows with every ball collision (chaos). Within a few seconds the result is <b>completely different</b>. In a lockstep game, this is a <b>desync</b> (machines no longer share the same state).</p>
    <p><b>Fixed point</b> stores positions as integers in <code>px × 65536</code>, and does all math with integer multiply and divide (truncated). Integer addition is exact in any order.
    So the state hashes of both machines stay the same to the end.</p>
    <p>Downside: you must manage precision and range yourself. You also need integer versions of sqrt and trig functions.</p>
    <p>Pick "No difference" to see that floating point is fully deterministic with <b>the same code, the same order, and the same platform</b>. The problem is that "the same operations" are hard to guarantee.</p>`,
    look: [
      'In A, a "First bit difference" appears right after the break (about 0.15 s). The position gap is only about 10⁻⁶ px then. It grows with each collision, and around 5 s the filled balls and white outlines split (red lines). In B, the hashes match to the end.',
      'Change A\'s "Machine 2 difference" to "float32 precision". The machines split from the first frame (the same kind of problem as x87 80-bit vs SSE 64-bit).',
      'Pick "No difference". A\'s hashes match too. Floating point itself is not random.',
      'Lower the cue speed. There are fewer collisions, so the gap grows slowly. The bits differ, but you may never see a gap on screen. The hashes still differ, so lockstep still desyncs.',
    ],
    refs: ['Floating point result differences across compilers and CPUs, and lockstep.', 'GDC 2001. Deterministic lockstep and out-of-sync debugging.', 'Random ASCII blog. Covers FMA, x87, and operation order problems.', 'ACM Computing Surveys. Non-associativity and rounding error.'],
    params: {
      num: { label: 'Number format', group: 'Simulation', options: { float: 'Floating point (float64)', fixed: 'Fixed point (Q16 integer)' } },
      diff: { label: 'Machine 2 difference', help: 'In fixed point, float32 acts the same as "Reverse order"', options: { order: 'Reverse force sum order', fround: 'float32 precision (floating point only)', none: 'No difference (same code)' } },
      speed: 'Cue speed (px/s)',
      restart: 'Break again',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const TW = 600, TH = 340, R = 12, N = 16, SUB = 8;       // 1프레임(60Hz) = 8스텝 (480Hz)
    const KN = 711, KD = 4096;                               // 침투 1px당 가속 = 711/4096 px/step²
    const Q = 65536, FRIC = 4096;           // 구름 마찰: 매 스텝 v -= v/FRIC
    // 초기 조건 (두 머신, 두 뷰 공통)
    ctx.rng = U.rng(ctx.seed);
    const init0 = [];
    init0.push({ x: 140, y: TH / 2 + ctx.rng.range(-3, 3), vx: P.speed / 480, vy: ctx.rng.range(-0.02, 0.02) });
    for (let row = 0, k = 0; row < 5; row++) for (let i = 0; i <= row; i++, k++) {
      init0.push({ x: 400 + row * R * 1.75, y: TH / 2 + (i - row / 2) * R * 2.02 + ctx.rng.range(-0.2, 0.2), vx: 0, vy: 0 });
    }

    const float = P.num === 'float';
    function makeFloat(reverse, f32) {
      const fr = f32 ? Math.fround : (v) => v;
      const x = new Float64Array(N), y = new Float64Array(N), vx = new Float64Array(N), vy = new Float64Array(N);
      init0.forEach((b, i) => { x[i] = fr(b.x); y[i] = fr(b.y); vx[i] = fr(b.vx); vy[i] = fr(b.vy); });
      const ax = new Float64Array(N), ay = new Float64Array(N);
      const K = KN / KD;
      const pairForce = (i, j) => {
        const dx = fr(x[j] - x[i]), dy = fr(y[j] - y[i]);
        const d2 = fr(fr(dx * dx) + fr(dy * dy));
        if (d2 >= 4 * R * R) return;
        const d = fr(Math.sqrt(d2)) || 1e-9;
        const f = fr(K * fr(2 * R - d));
        const fx = fr(fr(f * dx) / d), fy = fr(fr(f * dy) / d);
        ax[i] = fr(ax[i] - fx); ay[i] = fr(ay[i] - fy); ax[j] = fr(ax[j] + fx); ay[j] = fr(ay[j] + fy);
      };
      const wallForce = (i) => {
        if (x[i] < R) ax[i] = fr(ax[i] + fr(K * fr(R - x[i])));
        if (x[i] > TW - R) ax[i] = fr(ax[i] - fr(K * fr(x[i] - (TW - R))));
        if (y[i] < R) ay[i] = fr(ay[i] + fr(K * fr(R - y[i])));
        if (y[i] > TH - R) ay[i] = fr(ay[i] - fr(K * fr(y[i] - (TH - R))));
      };
      return {
        step() {
          ax.fill(0); ay.fill(0);
          if (!reverse) {
            for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) pairForce(i, j);
            for (let i = 0; i < N; i++) wallForce(i);
          } else {
            for (let i = N - 1; i >= 0; i--) wallForce(i);
            for (let i = N - 1; i >= 0; i--) for (let j = N - 1; j > i; j--) pairForce(i, j);
          }
          for (let i = 0; i < N; i++) {
            vx[i] = fr(vx[i] + ax[i]); vy[i] = fr(vy[i] + ay[i]);
            vx[i] = fr(vx[i] - fr(vx[i] / FRIC)); vy[i] = fr(vy[i] - fr(vy[i] / FRIC));
            x[i] = fr(x[i] + vx[i]); y[i] = fr(y[i] + vy[i]);
          }
        },
        pos: (i) => [x[i], y[i]],
        bits: () => [x, y, vx, vy],
      };
    }

    const idiv = (a, b) => Math.trunc(a / b);
    const isqrt = (n) => { let r = Math.floor(Math.sqrt(n)); while (r * r > n) r--; while ((r + 1) * (r + 1) <= n) r++; return r; };
    function makeFixed(reverse) {
      const x = new Array(N), y = new Array(N), vx = new Array(N), vy = new Array(N);
      init0.forEach((b, i) => { x[i] = Math.round(b.x * Q); y[i] = Math.round(b.y * Q); vx[i] = Math.round(b.vx * Q); vy[i] = Math.round(b.vy * Q); });
      const ax = new Array(N).fill(0), ay = new Array(N).fill(0);
      const R2 = 2 * R * Q, RQ = R * Q, TWQ = (TW - R) * Q, THQ = (TH - R) * Q;
      const pairForce = (i, j) => {
        const dx = x[j] - x[i], dy = y[j] - y[i];
        if (Math.abs(dx) >= R2 || Math.abs(dy) >= R2) return;
        const d2 = dx * dx + dy * dy;
        if (d2 >= R2 * R2) return;
        const d = isqrt(d2) || 1;
        const f = idiv((R2 - d) * KN, KD);
        const fx = idiv(f * dx, d), fy = idiv(f * dy, d);
        ax[i] -= fx; ay[i] -= fy; ax[j] += fx; ay[j] += fy;
      };
      const wallForce = (i) => {
        if (x[i] < RQ) ax[i] += idiv((RQ - x[i]) * KN, KD);
        if (x[i] > TWQ) ax[i] -= idiv((x[i] - TWQ) * KN, KD);
        if (y[i] < RQ) ay[i] += idiv((RQ - y[i]) * KN, KD);
        if (y[i] > THQ) ay[i] -= idiv((y[i] - THQ) * KN, KD);
      };
      return {
        step() {
          ax.fill(0); ay.fill(0);
          if (!reverse) {
            for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) pairForce(i, j);
            for (let i = 0; i < N; i++) wallForce(i);
          } else {
            for (let i = N - 1; i >= 0; i--) wallForce(i);
            for (let i = N - 1; i >= 0; i--) for (let j = N - 1; j > i; j--) pairForce(i, j);
          }
          for (let i = 0; i < N; i++) {
            vx[i] += ax[i]; vy[i] += ay[i];
            vx[i] -= idiv(vx[i], FRIC); vy[i] -= idiv(vy[i], FRIC);
            x[i] += vx[i]; y[i] += vy[i];
          }
        },
        pos: (i) => [x[i] / Q, y[i] / Q],
        bits: () => [x, y, vx, vy],
      };
    }

    // 상태 해시 (FNV-1a, float는 비트 패턴 기준)
    const f64 = new Float64Array(1), u32 = new Uint32Array(f64.buffer);
    function hash(m) {
      let h = 0x811c9dc5;
      for (const arr of m.bits()) for (let i = 0; i < N; i++) {
        f64[0] = arr[i];
        for (let k = 0; k < 2; k++) { h ^= u32[k]; h = Math.imul(h, 0x01000193) >>> 0; }
      }
      return h >>> 0;
    }

    let m1, m2, frame, firstDiff, t;
    const init = () => {
      const rev = P.diff !== 'none';
      m1 = float ? makeFloat(false, false) : makeFixed(false);
      m2 = float ? makeFloat(rev && P.diff === 'order', P.diff === 'fround') : makeFixed(rev);
      frame = 0; firstDiff = null; t = 0;
    };
    init();

    return {
      update(dt) {
        t += dt;
        if (t > 14) init();
        // 고정 60Hz 프레임 1회 (결정론을 위해 실제 dt와 무관하게 진행)
        for (let s = 0; s < SUB; s++) { m1.step(); m2.step(); }
        frame++;
        if (firstDiff === null && hash(m1) !== hash(m2)) firstDiff = frame;
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const s = Math.min((W - 20) / TW, (H - 20) / TH), ox = (W - TW * s) / 2, oy = (H - TH * s) / 2;
        const col = ctx.side === 'a' ? C.a : C.b;
        g.save(); g.translate(ox, oy); g.scale(s, s);
        D.rect(g, 0, 0, TW, TH, '#18402c', '#6b4a2b', 6);
        let dev = 0;
        for (let i = 0; i < N; i++) {
          const [x1, y1] = m1.pos(i), [x2, y2] = m2.pos(i);
          const d = Math.hypot(x1 - x2, y1 - y2);
          dev = Math.max(dev, d);
          D.circle(g, x1, y1, R, i === 0 ? '#f2f2f2' : col);
          D.circle(g, x2, y2, R - 1.5, null, '#ffffff', 1.5);
          if (d > 0.5) D.line(g, x1, y1, x2, y2, C.bad, 2);
        }
        g.restore();
        const h1 = hash(m1), h2 = hash(m2);
        ctx.stat(GTL.L('상태 해시 (머신1 / 머신2)', 'State hash (machine 1 / machine 2)'), h1.toString(16).padStart(8, '0') + ' / ' + h2.toString(16).padStart(8, '0') + (h1 === h2 ? ' ✓' : ' ✗'));
        ctx.stat(GTL.L('첫 비트 차이', 'First bit difference'), firstDiff === null ? GTL.L('없음', 'None') : GTL.L(`${firstDiff} 프레임 (${(firstDiff / 60).toFixed(2)}s)`, `Frame ${firstDiff} (${(firstDiff / 60).toFixed(2)}s)`));
        ctx.stat(GTL.L('머신 간 최대 위치 차', 'Max position gap between machines'), dev.toFixed(dev < 0.01 ? 6 : 1) + ' px');
        ctx.stat(GTL.L('경과', 'Elapsed'),(frame / 60).toFixed(1) + ' s');
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
