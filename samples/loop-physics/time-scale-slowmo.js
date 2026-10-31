// 타임 스케일 & 슬로모션: dt만 줄임 vs 고정 스텝 유지 + 보간
GTL.register({
  id: 'time-scale-slowmo',
  title: '타임 스케일 & 슬로모션',
  summary: '슬로모션에서 물리 dt만 줄이면 궤적이 1배속과 달라짐. 고정 스텝을 유지하고 시간 누적만 늦추면 궤적이 같고, 렌더 보간을 더하면 화면도 부드러움.',
  views: { a: 'dt × 스케일', b: '고정 스텝 + 보간' },
  controls: '조작 없음. "자동 슬로모션"이 켜져 있으면 1배속과 슬로모션을 번갈아 함.',
  info: `
    <p><b>타임 스케일(Time Scale)</b>은 게임 시간이 흐르는 속도를 바꾸는 값. 불릿 타임, 히트스톱, 일시정지에 씀.</p>
    <p>구현 방식에 따라 결과가 크게 다름</p>
    <ul>
      <li><b>dt × 스케일</b>: 매 프레임 <code>step(dt * scale)</code>. 가장 쉬움. 스텝 크기가 달라져 충돌 결과와 궤적이 1배속과 달라짐. 프레임레이트에 따라서도 달라짐.</li>
      <li><b>고정 스텝 유지</b>: 누적기에 <code>dt * scale</code>를 더하고 고정 <code>h</code>로 스텝. 궤적이 1배속과 같음. 0.2배속이면 물리가 5프레임에 한 번만 움직여 화면이 뚝뚝 끊김.</li>
      <li><b>고정 스텝 + 렌더 보간</b>: 위 방식에 이전 상태와 현재 상태를 <code>acc / h</code>로 보간해 그림. 궤적이 같고 화면도 부드러움. 한 스텝만큼 늦게 보임.</li>
      <li><b>스텝 크기도 스케일</b>: Unity 문서가 권하는 <code>fixedDeltaTime *= timeScale</code>. 부드럽지만 궤적이 달라지고, 초당 물리 스텝 수가 줄지 않아 비용도 그대로임.</li>
    </ul>
    <p>흰 원은 같은 시드로 1배속 고정 스텝(60Hz)을 돌린 기준. 공과 흰 원이 겹치면 슬로모션이 결과를 바꾸지 않았음.</p>
    <p>단점: 고정 스텝 방식은 이전 상태를 저장해야 함. 리플레이, 넷코드처럼 결정론이 필요하면 이 방식만 쓸 수 있음.</p>`,
  // 도식: 0.2배속에서 렌더 프레임 10개 동안의 물리 스텝. A는 매 프레임 작은 스텝, B는 5프레임마다 같은 h 스텝 + 보간
  diagram: (L) => `<svg viewBox="0 0 540 182" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="18" class="t-small t-dim">${L('0.2배속, 렌더 프레임 10개', '0.2x speed, 10 render frames')}</text>
    <text x="10" y="44">${L('렌더 프레임', 'Render frames')}</text>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => `<line x1="${120 + i * 40}" y1="32" x2="${120 + i * 40}" y2="48" class="d-dim"/>`).join('')}
    <line x1="120" y1="40" x2="520" y2="40" class="d-dim"/>
    <text x="10" y="82" class="t-a">${L('A: dt × 0.2', 'A: dt × 0.2')}</text>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<rect x="${121 + i * 40}" y="66" width="38" height="22" class="f-dim"/>`).join('')}
    <text x="140" y="81" text-anchor="middle" class="t-small t-mono">h/5</text>
    <text x="120" y="104" class="t-small t-dim">${L('스텝 크기가 1배속과 달라 궤적이 바뀜', 'Step size differs from 1x, so the path changes')}</text>
    <text x="10" y="134" class="t-b">${L('B: 고정 h + 보간', 'B: fixed h + interp')}</text>
    <rect x="121" y="118" width="198" height="22" class="f-dim"/><rect x="321" y="118" width="198" height="22" class="f-dim"/>
    <text x="220" y="133" text-anchor="middle" class="t-small t-mono">h</text><text x="420" y="133" text-anchor="middle" class="t-small t-mono">h</text>
    ${[1, 2, 3, 4, 6, 7, 8, 9].map((i) => `<circle cx="${120 + i * 40}" cy="129" r="3" class="f-b"/>`).join('')}
    <text x="120" y="156" class="t-small t-dim">${L('1배속과 같은 h라서 궤적이 같음', 'Same h as 1x, so the path is the same')}</text>
    <text x="120" y="170" class="t-small t-dim">${L('점: 프레임마다 acc / h 비율로 보간한 위치', 'Dots: per-frame position blended by acc / h')}</text>
  </svg>`,
  look: [
    '슬로모션 구간이 지나면 A의 공이 흰 원(1배속 기준)에서 벗어나 다른 길로 떨어짐. B는 공과 흰 원이 계속 겹침(기준 대비 오차 0).',
    'B를 "고정 스텝 (보간 없음)"으로 바꾸면 슬로모션에서 공이 뚝뚝 끊겨 움직임. "멈춘 프레임 비율"이 80% 가까이 오름.',
    'A를 "스텝 크기도 스케일"로 바꾸면 화면은 부드럽지만 오차가 생기고 초당 물리 스텝이 60으로 유지됨',
    '"자동 슬로모션"을 끄고 타임 스케일을 1로 두면 A도 기준과 거의 겹침. 브라우저 프레임 간격이 흔들리면 A만 조금씩 벗어남.',
  ],
  refs: [
    { type: 'engine', title: 'Unity - Time.timeScale', url: 'https://docs.unity3d.com/ScriptReference/Time-timeScale.html', note: 'timeScale을 바꿀 때 fixedDeltaTime도 같은 비율로 줄이라고 권함' },
    { type: 'engine', title: 'Unity - Rigidbody.interpolation', url: 'https://docs.unity3d.com/ScriptReference/Rigidbody-interpolation.html', note: '고정 스텝 사이 렌더 보간' },
    { type: 'article', title: 'Fix Your Timestep! (Glenn Fiedler)', url: 'https://gafferongames.com/post/fix_your_timestep/', year: 2004, note: '누적기와 상태 보간' },
  ],
  params: [
    { key: 'mode', label: '타임 스케일 방식', type: 'select', group: '타임 스케일', options: [
      { value: 'scaled', label: 'dt × 스케일 (가변 스텝)' },
      { value: 'scaledH', label: '스텝 크기도 스케일 (h × 스케일)' },
      { value: 'fixed', label: '고정 스텝 (보간 없음)' },
      { value: 'interp', label: '고정 스텝 + 렌더 보간' },
    ], a: 'scaled', b: 'interp', default: 'scaled' },
    { key: 'scale', label: '슬로모션 배율', type: 'range', min: 0.05, max: 1, step: 0.05, default: 0.2, shared: true },
    { key: 'auto', label: '자동 슬로모션', type: 'bool', default: true, shared: true, help: '1배속 1.5초, 슬로모션 3초를 반복' },
    { key: 'count', label: '공 개수', type: 'int', min: 1, max: 40, default: 14, shared: true, reset: true, group: '장면' },
    { key: 'ghost', label: '1배속 기준 표시', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Time Scale & Slow Motion',
    summary: 'In slow motion, if you only shrink the physics dt, paths differ from normal speed. Keep the fixed step and only slow the time accumulation. Paths stay the same. Add render interpolation and the picture is smooth too.',
    views: { a: 'dt × scale', b: 'Fixed step + interp' },
    controls: 'No input. When "Auto slow motion" is on, it switches between normal speed and slow motion.',
    info: `
    <p><b>Time scale</b> is a value that changes how fast game time passes. Games use it for bullet time, hit stop, and pause.</p>
    <p>Results differ a lot depending on how you implement it.</p>
    <ul>
      <li><b>dt × scale</b>: call <code>step(dt * scale)</code> every frame. This is the easiest. The step size changes, so collision results and paths differ from normal speed. They also change with the frame rate.</li>
      <li><b>Keep the fixed step</b>: add <code>dt * scale</code> to the accumulator and step with a fixed <code>h</code>. Paths match normal speed. At 0.2x speed, physics moves only once every 5 frames, so the picture stutters.</li>
      <li><b>Fixed step + render interpolation</b>: same as above, but draw by interpolating the previous and current state with <code>acc / h</code>. Paths match and the picture is smooth. The picture lags one step behind.</li>
      <li><b>Scale the step size too</b>: <code>fixedDeltaTime *= timeScale</code>, as the Unity docs suggest. It is smooth, but paths change. Physics steps per second do not drop, so the cost stays the same.</li>
    </ul>
    <p>The white circles are a reference run at normal speed with a fixed step (60 Hz) and the same seed. If a ball overlaps its white circle, slow motion did not change the result.</p>
    <p>Downside: the fixed step method must store the previous state. If you need determinism (replays, netcode), this is the only method you can use.</p>`,
    look: [
      'After the slow motion section, A\'s balls leave the white circles (normal speed reference) and fall along other paths. In B, balls and white circles keep overlapping (0 error against the reference).',
      'Switch B to "Fixed step (no interpolation)". In slow motion the balls stutter. "Frozen frame ratio" rises close to 80%.',
      'Switch A to "Scale the step size too". The picture is smooth, but error appears and physics steps per second stay at 60.',
      'Turn off "Auto slow motion" and set time scale to 1. A also almost matches the reference. If browser frame timing varies, only A drifts a little.',
    ],
    refs: ['Suggests reducing fixedDeltaTime by the same ratio when you change timeScale.', 'Render interpolation between fixed steps.', 'Accumulator and state interpolation.'],
    params: {
      mode: { label: 'Time scale method', group: 'Time scale', options: { scaled: 'dt × scale (variable step)', scaledH: 'Scale the step size too (h × scale)', fixed: 'Fixed step (no interpolation)', interp: 'Fixed step + render interpolation' } },
      scale: 'Slow motion factor',
      auto: { label: 'Auto slow motion', help: 'Repeats 1.5 s at normal speed and 3 s of slow motion' },
      count: { label: 'Ball count', group: 'Scene' },
      ghost: 'Show normal speed reference',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const LW = 600, LH = 400, R = 6, GRAV = 900, E = 0.75, H = 1 / 60;
    const pegs = [];
    for (let row = 0; row < 7; row++) {
      for (let c = 0; c < 11; c++) {
        const x = 50 + c * 50 + (row % 2 ? 25 : 0);
        if (x > LW - 30) continue;
        pegs.push({ x, y: 110 + row * 38, r: 7 });
      }
    }
    // 같은 순서로 리스폰 위치를 만드는 정수 해시
    const hash = (i, k) => { let h = (i * 374761393 + k * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const N = P.count;
    const seeds = [];
    for (let i = 0; i < N; i++) seeds.push({ x: ctx.rng.range(80, 520), y: ctx.rng.range(-300, 20), vx: ctx.rng.range(-60, 60) });

    const makeSim = () => {
      const s = { x: new Float64Array(N), y: new Float64Array(N), vx: new Float64Array(N), vy: new Float64Array(N), k: new Int32Array(N) };
      for (let i = 0; i < N; i++) { s.x[i] = seeds[i].x; s.y[i] = seeds[i].y; s.vx[i] = seeds[i].vx; }
      return s;
    };
    const step = (s, h) => {
      for (let i = 0; i < N; i++) {
        s.vy[i] += GRAV * h;
        s.x[i] += s.vx[i] * h; s.y[i] += s.vy[i] * h;
        for (const p of pegs) {
          const dx = s.x[i] - p.x, dy = s.y[i] - p.y, rr = R + p.r, d2 = dx * dx + dy * dy;
          if (d2 < rr * rr && d2 > 1e-9) {
            const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
            s.x[i] = p.x + nx * rr; s.y[i] = p.y + ny * rr;
            const vn = s.vx[i] * nx + s.vy[i] * ny;
            if (vn < 0) { s.vx[i] -= (1 + E) * vn * nx; s.vy[i] -= (1 + E) * vn * ny; }
          }
        }
        if (s.x[i] < R) { s.x[i] = R; s.vx[i] = Math.abs(s.vx[i]) * E; }
        if (s.x[i] > LW - R) { s.x[i] = LW - R; s.vx[i] = -Math.abs(s.vx[i]) * E; }
        if (s.y[i] > LH + 20) {
          s.k[i]++;
          s.x[i] = 60 + hash(i, s.k[i]) * 480; s.y[i] = -10 - hash(i + 99, s.k[i]) * 60;
          s.vx[i] = (hash(i + 7, s.k[i]) - 0.5) * 120; s.vy[i] = 0;
        }
      }
    };
    const copy = (src, dst) => { dst.x.set(src.x); dst.y.set(src.y); };

    let diverged = 0, sim, prev, ghost, acc, gAcc, realT, stepTimes, frozen, frames, lastDrawn, errAvg;
    const init = () => {
      sim = makeSim(); prev = makeSim(); ghost = makeSim();
      acc = 0; gAcc = 0; realT = 0; stepTimes = []; frozen = 0; frames = 0; lastDrawn = null; errAvg = 0;
    };
    init();

    const curScale = () => {
      if (!P.auto) return P.scale;
      const t = realT % 6;
      if (t < 1.5) return 1;
      if (t < 2) return U.lerp(1, P.scale, U.ease.inOutQuad((t - 1.5) / 0.5));
      if (t < 5) return P.scale;
      if (t < 5.5) return U.lerp(P.scale, 1, U.ease.inOutQuad((t - 5) / 0.5));
      return 1;
    };
    let scaleNow = 1;
    const alpha = () => (P.mode === 'interp' ? U.clamp(acc / H, 0, 1) : 1);
    const drawPos = (i) => {
      const a = alpha();
      return { x: U.lerp(prev.x[i], sim.x[i], a), y: U.lerp(prev.y[i], sim.y[i], a) };
    };

    return {
      update(dt) {
        realT += dt;
        scaleNow = curScale();
        const simDt = dt * scaleNow;
        let steps = 0;
        if (P.mode === 'scaled') {
          copy(sim, prev); step(sim, simDt); steps = 1; acc = 0;
        } else {
          const h = P.mode === 'scaledH' ? H * scaleNow : H;
          acc += simDt;
          let guard = 0;
          while (acc >= h && guard++ < 240) { copy(sim, prev); step(sim, h); acc -= h; steps++; }
        }
        // 1배속 기준: 같은 게임 시간을 고정 60Hz로 진행
        gAcc += simDt;
        while (gAcc >= H) { step(ghost, H); gAcc -= H; }
        for (let i = 0; i < steps; i++) stepTimes.push(realT);
        while (stepTimes.length && stepTimes[0] < realT - 1) stepTimes.shift();
        // 오차: 같은 게임 시간에서 기준과 비교
        let e = 0, n = 0;
        for (let i = 0; i < N; i++) if (sim.k[i] === ghost.k[i]) { e += Math.hypot(sim.x[i] - ghost.x[i], sim.y[i] - ghost.y[i]); n++; }
        diverged = 0;
        for (let i = 0; i < N; i++) if (sim.k[i] !== ghost.k[i] || Math.hypot(sim.x[i] - ghost.x[i], sim.y[i] - ghost.y[i]) > 5) diverged++;
        const err = n ? e / n : 0;
        errAvg = errAvg * 0.9 + err * 0.1;
        // 끊김 측정: 그려지는 위치가 이전 프레임과 같으면 멈춘 프레임
        const p0 = drawPos(0);
        frames++;
        if (lastDrawn && p0.x === lastDrawn.x && p0.y === lastDrawn.y) frozen++;
        lastDrawn = p0;
        if (frames > 120) { frames *= 0.5; frozen *= 0.5; }
      },
      render() {
        const g = ctx.g, W = ctx.width, Hh = ctx.height;
        const s = Math.min(W / LW, Hh / LH), ox = (W - LW * s) / 2, oy = (Hh - LH * s) / 2;
        const col = ctx.side === 'a' ? C.a : C.b;
        g.save(); g.translate(ox, oy); g.scale(s, s);
        g.beginPath(); g.rect(0, 0, LW, LH); g.clip();
        D.grid(g, LW, LH, 40);
        for (const p of pegs) D.circle(g, p.x, p.y, p.r, '#3a4150');
        for (let i = 0; i < N; i++) {
          const p = drawPos(i);
          D.circle(g, p.x, p.y, R, col);
          if (P.ghost) D.circle(g, ghost.x[i], ghost.y[i], R + 2, null, 'rgba(255,255,255,0.75)', 1.2);
          if (P.ghost && sim.k[i] === ghost.k[i]) {
            const d = Math.hypot(p.x - ghost.x[i], p.y - ghost.y[i]);
            if (d > 3) D.line(g, p.x, p.y, ghost.x[i], ghost.y[i], C.bad, 1);
          }
        }
        g.restore();
        // 타임 스케일 게이지
        const gw = 140, gx = W - gw - 12, gy = 10;
        D.rect(g, gx, gy, gw, 10, 'rgba(0,0,0,0.45)');
        D.rect(g, gx, gy, gw * scaleNow, 10, scaleNow < 0.99 ? C.accent : C.good);
        D.text(g, GTL.L(`타임 스케일 ×${scaleNow.toFixed(2)}`, `Time scale ×${scaleNow.toFixed(2)}`), gx, gy + 13, { size: 11, color: C.text });
        ctx.stat(GTL.L('타임 스케일', 'Time scale'), '×' + scaleNow.toFixed(2));
        ctx.stat(GTL.L('1배속 기준 대비 평균 오차', 'Mean error vs normal speed'), errAvg.toFixed(1) + ' px');
        ctx.stat(GTL.L('기준에서 5px 이상 벗어난 공', 'Balls off reference by 5px+'), diverged + ' / ' + N);
        ctx.stat(GTL.L('실제 초당 물리 스텝', 'Actual physics steps per second'), stepTimes.length);
        ctx.stat(GTL.L('멈춘 프레임 비율', 'Frozen frame ratio'),(frames ? (frozen / frames) * 100 : 0).toFixed(0) + ' %');
      },
    };
  },
});
