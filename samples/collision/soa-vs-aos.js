// 데이터 지향 설계: AoS(객체 배열) vs SoA(TypedArray 필드별 배열)
GTL.register({
  id: 'soa-vs-aos',
  title: 'SoA vs AoS: 파티클 업데이트의 메모리 배치',
  summary: '같은 계산이라도 데이터 배치에 따라 속도가 몇 배 차이 남. 필드별 연속 배열(SoA, TypedArray)은 업데이트에 필요한 값만 순서대로 읽어서 캐시를 가장 잘 씀.',
  views: { a: 'AoS (JS 객체 배열)', b: 'SoA (TypedArray)' },
  controls: '조작 없음. 두 뷰의 그림은 같고, 업데이트 비용(ms)만 다름.',
  info: `
    <p><b>AoS</b>(Array of Structures, 구조체 배열): <code>particles[i] = { x, y, vx, vy, life, ... }</code>. 사람이 읽기 쉬움. 하지만 JS에서는 단점이 있음.</p>
    <ul>
      <li>각 객체가 힙 곳곳에 흩어짐.</li>
      <li>숫자 필드가 박싱(별도 객체로 감싸기)되기도 함.</li>
      <li>업데이트에 필요 없는 필드까지 캐시 라인을 차지함. 예: 색상, 이름 같은 <b>차가운 데이터</b>.</li>
    </ul>
    <p><b>SoA</b>(Structure of Arrays, 배열 구조체): <code>x = Float32Array(n)</code>, <code>y = Float32Array(n)</code>처럼 필드마다 연속 배열을 둠.
    업데이트 루프가 필요한 배열만 앞에서부터 순서대로 읽음. 그래서 하드웨어 프리페처(미리 읽기)가 잘 동작하고, 차가운 필드는 아예 읽지 않음.</p>
    <p>중간 형태인 <b>인터리브 TypedArray</b>(<code>Float32Array(n × stride)</code>)는 박싱과 흩어짐이 없음. 하지만 차가운 필드가 stride를 늘려서 대역폭을 낭비함.</p>
    <p>"생성 순서 섞기"는 객체를 무작위 순서로 만듦. 그러면 배열 순서와 메모리 순서가 어긋남. 오래 돌아간 게임의 단편화된 힙과 비슷한 상태.</p>
    <p class="dim">※ 측정값은 브라우저와 CPU에 따라 다름. 업데이트 루프만 측정하고 그리기 비용은 뺌.</p>`,
  diagram: (L) => {
    const fields = ['x', 'y', 'vx', 'vy', 'c', 'c', 'c'];
    const obj = (x0, p) => fields.map((f, i) => `<rect x="${x0 + i * 22}" y="30" width="22" height="18" class="${i < 4 ? 'f-a' : 'f-dim'}"/><text x="${x0 + i * 22 + 11}" y="43" text-anchor="middle" class="t-small t-mono">${f}</text>`).join('') + `<text x="${x0}" y="26" class="t-small t-dim t-mono">p${p}</text>`;
    const row = (name, y, cls) => `<text x="4" y="${y + 11}" class="t-small t-mono">${name}</text>` + Array.from({ length: 16 }, (_, i) => `<rect x="${40 + i * 28}" y="${y}" width="28" height="14" class="${cls}"/>${cls === 'f-b' ? `<text x="${54 + i * 28}" y="${y + 10.5}" text-anchor="middle" class="t-small t-mono">${name}${i}</text>` : ''}`).join('');
    return `<svg viewBox="0 0 540 212" xmlns="http://www.w3.org/2000/svg">
    <text x="4" y="12" class="t-a">${L('A: AoS (객체마다 따로 할당)', 'A: AoS (one heap object each)')}</text>
    ${obj(10, 0)}${obj(196, 1)}${obj(382, 2)}
    <text x="180" y="43" text-anchor="middle" class="t-dim">...</text><text x="366" y="43" text-anchor="middle" class="t-dim">...</text>
    <path d="M10,54 L10,58 L164,58 L164,54" class="d-dim"/>
    <text x="10" y="70" class="t-small t-dim">${L('캐시 라인에 차가운 필드(c)가 섞임. 객체는 힙 곳곳에 흩어짐', 'Cold fields (c) share the cache line. Objects are scattered on the heap')}</text>
    <text x="4" y="94" class="t-b">${L('B: SoA (필드마다 연속 배열)', 'B: SoA (one array per field)')}</text>
    <text x="488" y="94" text-anchor="end" class="t-small t-dim">${L('캐시 라인 하나 = x 16개', 'one cache line = 16 x values')}</text>
    <path d="M40,104 L40,100 L488,100 L488,104" class="d-accent"/>
    ${row('x', 106, 'f-b')}${row('y', 123, 'f-b')}${row('vx', 140, 'f-b')}${row('vy', 157, 'f-b')}${row('c', 174, 'f-dim')}
    <text x="40" y="206" class="t-small t-dim">${L('업데이트는 x, y, vx, vy 배열만 앞에서부터 읽음. c 배열은 읽지 않음', 'The update reads only the x, y, vx, vy arrays in order. It never reads c')}</text>
  </svg>`;
  },
  look: [
    '기본 상태에서 그래프 높이를 비교하면 B(SoA)의 "업데이트" ms가 A보다 작음(그래프 최대값은 고정).',
    '"차가운 필드 수"를 0으로 하고 다시 시작하면 AoS와의 차이가 줄어듦. 16으로 올리면 AoS가 더 느려짐. 인터리브도 stride가 커지는 만큼 느려지고, SoA는 그대로임.',
    'A를 "AoS + 생성 순서 섞기"로 바꾸면 같은 객체 배열인데도 더 느려짐. 메모리 지역성의 효과.',
    '입자 수를 늘리면 데이터가 CPU 캐시를 넘어서는 지점부터 격차가 커짐.',
  ],
  refs: [
    { type: 'talk', title: 'Data-Oriented Design and C++ (Mike Acton, CppCon 2014)', url: 'https://www.youtube.com/watch?v=rX0ItVEVjHc', year: 2014 },
    { type: 'book', title: 'Data-Oriented Design (Richard Fabian)', url: 'https://www.dataorienteddesign.com/dodbook/', year: 2018 },
    { type: 'book', title: 'Game Programming Patterns, Data Locality (Robert Nystrom)', url: 'https://gameprogrammingpatterns.com/data-locality.html', year: 2014 },
    { type: 'engine', title: 'Unity DOTS, Entities (ECS) 청크 기반 SoA 저장', url: 'https://docs.unity3d.com/Packages/com.unity.entities@latest' },
  ],
  params: [
    { key: 'count', label: '입자 수', type: 'int', min: 10000, max: 250000, step: 10000, default: 150000, shared: true, reset: true, group: '장면' },
    { key: 'cold', label: '차가운 필드 수', type: 'int', min: 0, max: 16, default: 8, shared: true, reset: true, help: '업데이트가 읽지 않는 필드 (색, id, 스폰 시각 등)' },
    { key: 'layout', label: '메모리 배치', type: 'select', group: '레이아웃', options: [
      { value: 'aos', label: 'AoS (JS 객체 배열)' },
      { value: 'aosShuffled', label: 'AoS + 생성 순서 섞기' },
      { value: 'interleaved', label: '인터리브 Float32Array (stride)' },
      { value: 'soa', label: 'SoA (필드별 Float32Array)' },
    ], a: 'aos', b: 'soa', reset: true },
    { key: 'graphMax', label: '그래프 최대 (ms)', type: 'range', min: 1, max: 40, step: 1, default: 12, shared: true },
  ],
  en: {
    title: 'SoA vs AoS: Memory Layout for Particle Updates',
    summary: 'The same math can run several times faster or slower depending on data layout. Separate continuous arrays per field (SoA, TypedArray) read only the values the update needs, in order, so they use the cache best.',
    views: { a: 'AoS (array of JS objects)', b: 'SoA (TypedArray)' },
    controls: 'No input. Both views draw the same picture. Only the update cost (ms) differs.',
    info: `
    <p><b>AoS</b> (Array of Structures): <code>particles[i] = { x, y, vx, vy, life, ... }</code>. It is easy for people to read. But in JS it has downsides.</p>
    <ul>
      <li>Objects are scattered all over the heap.</li>
      <li>Number fields are sometimes boxed (wrapped in separate objects).</li>
      <li>Fields the update does not need still take up cache lines. Examples: <b>cold data</b> such as color or name.</li>
    </ul>
    <p><b>SoA</b> (Structure of Arrays): keep one continuous array per field, like <code>x = Float32Array(n)</code> and <code>y = Float32Array(n)</code>.
    The update loop reads only the arrays it needs, in order from the front. So the hardware prefetcher (reading ahead) works well, and cold fields are never read.</p>
    <p>The in-between form, an <b>interleaved TypedArray</b> (<code>Float32Array(n × stride)</code>), has no boxing or scattering. But cold fields make the stride longer and waste bandwidth.</p>
    <p>"Shuffled creation order" creates objects in random order. Then array order and memory order no longer match. This is like the fragmented heap of a game that has run for a long time.</p>
    <p class="dim">※ Measurements vary by browser and CPU. Only the update loop is measured. Drawing cost is left out.</p>`,
    look: [
      'In the default state, compare the graph heights. B (SoA) has a smaller "Update" ms than A (the graph max is fixed).',
      'Set "Cold field count" to 0 and restart. The gap with AoS shrinks. Raise it to 16 and AoS gets slower. Interleaved also slows down as the stride grows. SoA stays the same.',
      'Switch A to "AoS + shuffled creation order". It gets slower, even though it is the same array of objects. This is the effect of memory locality.',
      'Raise the particle count. The gap grows once the data no longer fits in the CPU cache.',
    ],
    refs: [
      null,
      null,
      null,
      { title: 'Unity DOTS, chunk-based SoA storage in Entities (ECS)' },
    ],
    params: {
      count: { label: 'Particle count', group: 'Scene' },
      cold: { label: 'Cold field count', help: 'Fields the update does not read (color, id, spawn time, and so on)' },
      layout: { label: 'Memory layout', group: 'Layout', options: { aos: 'AoS (array of JS objects)', aosShuffled: 'AoS + shuffled creation order', interleaved: 'Interleaved Float32Array (stride)', soa: 'SoA (Float32Array per field)' } },
      graphMax: 'Graph max (ms)',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const RW = 320, RH = 200;
    const buf = ctx.createCanvas(RW, RH), bg = buf.getContext('2d');
    const img = bg.createImageData(RW, RH);
    const pix = new Uint32Array(img.data.buffer);
    const cnt = new Uint16Array(RW * RH);
    const mkLut = (r, g, b) => Uint32Array.from({ length: 64 }, (_, i) => {
      const f = 1 - Math.exp(-i * 0.18), R = 20 + (r - 20) * f, G = 22 + (g - 22) * f, B = 26 + (b - 26) * f;
      return (0xff000000 | (Math.min(255, B + f * 60) << 16) | (Math.min(255, G + f * 60) << 8) | Math.min(255, R + f * 60)) >>> 0;
    });
    const lutA = mkLut(255, 122, 89), lutB = mkLut(79, 195, 247);
    let n, arr, X, Y, VX, VY, LIFE, F, stride, t = 0, msAvg = 0;
    const hist = [];
    const HOT = 5; // x, y, vx, vy, life

    function seedVals(r) { const a = r.range(0, U.TAU), s = r.range(0.05, 0.4); return [r.range(0, 1), r.range(0, 1), Math.cos(a) * s, Math.sin(a) * s, r.range(0, 4)]; }
    function init() {
      ctx.rng = U.rng(ctx.seed);
      const r = ctx.rng;
      n = P.count;
      arr = null; X = Y = VX = VY = LIFE = F = null;
      const L = P.layout;
      if (L === 'aos' || L === 'aosShuffled') {
        // 모든 필드를 생성자에서 같은 순서로 초기화 (V8 fast-mode 객체, 일반적인 게임 코드와 같은 형태)
        const body = 'this.x=v[0];this.y=v[1];this.vx=v[2];this.vy=v[3];this.life=v[4];' + Array.from({ length: P.cold }, (_, c) => `this.c${c}=${c}.5;`).join('');
        const Particle = new Function('v', body); // eslint-disable-line no-new-func
        const make = (v) => new Particle(v);
        arr = new Array(n);
        const vals = []; for (let i = 0; i < n; i++) vals.push(seedVals(r));
        if (L === 'aos') for (let i = 0; i < n; i++) arr[i] = make(vals[i]);
        else {
          const order = r.shuffle(Array.from({ length: n }, (_, i) => i));
          for (const i of order) arr[i] = make(vals[i]); // 메모리 순서 ≠ 배열 순서
        }
      } else if (L === 'interleaved') {
        stride = HOT + P.cold; F = new Float32Array(n * stride);
        for (let i = 0; i < n; i++) { const v = seedVals(r), o = i * stride; for (let k = 0; k < HOT; k++) F[o + k] = v[k]; for (let c = 0; c < P.cold; c++) F[o + HOT + c] = c + 0.5; }
      } else {
        X = new Float32Array(n); Y = new Float32Array(n); VX = new Float32Array(n); VY = new Float32Array(n); LIFE = new Float32Array(n);
        // 차가운 필드는 별도 배열 (업데이트 루프는 건드리지 않음)
        F = Array.from({ length: P.cold }, (_, c) => new Float32Array(n).fill(c + 0.5));
        for (let i = 0; i < n; i++) { const v = seedVals(r); X[i] = v[0]; Y[i] = v[1]; VX[i] = v[2]; VY[i] = v[3]; LIFE[i] = v[4]; }
      }
    }
    init();

    // 공통 물리: 중심 소용돌이 + 중력 + 벽 반사 + 수명 순환
    function updateAll(dt, time) {
      const cx = 0.5 + 0.2 * Math.cos(time * 0.7), cy = 0.5 + 0.2 * Math.sin(time * 0.9);
      const L = P.layout;
      if (arr) {
        for (let i = 0; i < n; i++) {
          const p = arr[i];
          const dx = p.x - cx, dy = p.y - cy, inv = 0.02 / (dx * dx + dy * dy + 0.01);
          p.vx += (-dy * inv - dx * inv * 0.3) * dt; p.vy += (dx * inv - dy * inv * 0.3 + 0.02) * dt;
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.x < 0 || p.x > 1) { p.vx = -p.vx; p.x = p.x < 0 ? 0 : 1; }
          if (p.y < 0 || p.y > 1) { p.vy = -p.vy * 0.8; p.y = p.y < 0 ? 0 : 1; }
          p.life -= dt; if (p.life < 0) p.life += 4;
        }
      } else if (L === 'interleaved') {
        const s = stride;
        for (let o = 0, e = n * s; o < e; o += s) {
          let x = F[o], y = F[o + 1], vx = F[o + 2], vy = F[o + 3];
          const dx = x - cx, dy = y - cy, inv = 0.02 / (dx * dx + dy * dy + 0.01);
          vx += (-dy * inv - dx * inv * 0.3) * dt; vy += (dx * inv - dy * inv * 0.3 + 0.02) * dt;
          x += vx * dt; y += vy * dt;
          if (x < 0 || x > 1) { vx = -vx; x = x < 0 ? 0 : 1; }
          if (y < 0 || y > 1) { vy = -vy * 0.8; y = y < 0 ? 0 : 1; }
          F[o] = x; F[o + 1] = y; F[o + 2] = vx; F[o + 3] = vy;
          let l = F[o + 4] - dt; if (l < 0) l += 4; F[o + 4] = l;
        }
      } else {
        for (let i = 0; i < n; i++) {
          let x = X[i], y = Y[i], vx = VX[i], vy = VY[i];
          const dx = x - cx, dy = y - cy, inv = 0.02 / (dx * dx + dy * dy + 0.01);
          vx += (-dy * inv - dx * inv * 0.3) * dt; vy += (dx * inv - dy * inv * 0.3 + 0.02) * dt;
          x += vx * dt; y += vy * dt;
          if (x < 0 || x > 1) { vx = -vx; x = x < 0 ? 0 : 1; }
          if (y < 0 || y > 1) { vy = -vy * 0.8; y = y < 0 ? 0 : 1; }
          X[i] = x; Y[i] = y; VX[i] = vx; VY[i] = vy;
          let l = LIFE[i] - dt; if (l < 0) l += 4; LIFE[i] = l;
        }
      }
    }

    return {
      update(dt) {
        t += dt;
        const t0 = ctx.now();
        updateAll(Math.min(dt, 1 / 30), t);
        const ms = ctx.now() - t0;
        msAvg = msAvg ? msAvg * 0.92 + ms * 0.08 : ms;
        hist.push(ms); if (hist.length > 150) hist.shift();
      },
      render() {
        ctx.clearStats();
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        // 저해상도 밀도 플롯 (레이아웃별 읽기, 측정에는 포함 안 함)
        cnt.fill(0);
        const sx = RW - 1, sy = RH - 1;
        if (arr) for (let i = 0; i < n; i += 2) { const p = arr[i]; cnt[((p.y * sy) | 0) * RW + ((p.x * sx) | 0)]++; }
        else if (P.layout === 'interleaved') for (let i = 0; i < n; i += 2) { const o = i * stride; cnt[((F[o + 1] * sy) | 0) * RW + ((F[o] * sx) | 0)]++; }
        else for (let i = 0; i < n; i += 2) cnt[((Y[i] * sy) | 0) * RW + ((X[i] * sx) | 0)]++;
        const lut = ctx.side === 'a' ? lutA : lutB;
        for (let k = 0; k < cnt.length; k++) pix[k] = lut[cnt[k] > 63 ? 63 : cnt[k]];
        bg.putImageData(img, 0, 0);
        g.imageSmoothingEnabled = true;
        const s = Math.min(W / RW, H / RH), dw = RW * s, dh = RH * s;
        g.drawImage(buf, (W - dw) / 2, (H - dh) / 2, dw, dh);
        D.plot(g, hist, 10, 10, Math.min(260, W - 20), 60, { min: 0, max: P.graphMax, color: col, label: GTL.L(`업데이트 ${msAvg.toFixed(2)} ms (최대 ${P.graphMax} ms)`, `Update ${msAvg.toFixed(2)} ms (max ${P.graphMax} ms)`) });
        const bytes = P.layout === 'soa' ? HOT * 4 : P.layout === 'interleaved' ? (HOT + P.cold) * 4 : (HOT + P.cold) * 8 + 24;
        ctx.stat(GTL.L('업데이트', 'Update'), msAvg.toFixed(2) + ' ms');
        ctx.stat(GTL.L('입자당', 'Per particle'), ((msAvg * 1e6) / n).toFixed(2) + ' ns');
        ctx.stat(GTL.L('루프가 훑는 바이트/입자 (대략)', 'Bytes scanned per particle (approx.)'), bytes + ' B' + (P.layout.startsWith('aos') ? GTL.L(' + 박싱/포인터', ' + boxing/pointers') : ''));
        ctx.stat(GTL.L('입자 수', 'Particle count'), n.toLocaleString());
      },
    };
  },
});
