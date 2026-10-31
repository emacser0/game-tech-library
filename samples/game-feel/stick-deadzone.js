// 아날로그 스틱 데드존: 축별(axial) vs 원형(radial) vs 스케일드 원형(scaled radial)
GTL.register({
  id: 'stick-deadzone',
  title: '아날로그 스틱 데드존',
  summary: '스틱은 손을 떼도 0이 아닌 값을 냄(드리프트). 데드존 모양에 따라 대각선 입력이 축으로 쏠리거나 경계에서 속도가 튐. 스케일드 원형 데드존은 두 문제를 모두 피함.',
  views: { a: '축별 데드존', b: '스케일드 원형 데드존' },
  controls: '←→↑↓ / WASD 스틱 기울이기 (키를 누르면 자동 데모가 잠시 멈춤)',
  info: `
    <p><b>데드존(Dead Zone)</b>: 스틱 중심 근처의 입력을 0으로 버리는 구역.
    스틱은 손을 떼도 중심으로 정확히 돌아오지 않음. 이 작은 값(드리프트)을 그대로 쓰면 캐릭터가 저절로 걸어감.</p>
    <ul>
      <li><b>축별(Axial)</b>: x, y를 따로 검사. <code>|x| &lt; d</code>면 x = 0. 구현이 가장 쉬움.
      단점은 축 근처 방향이 축으로 쏠림. 20°로 기울여도 0°로 감.</li>
      <li><b>원형(Radial)</b>: 벡터 길이로 검사. <code>|v| &lt; d</code>면 0. 방향은 그대로 유지됨.
      단점은 경계를 넘는 순간 출력이 0에서 d로 바로 뜀. 아주 느린 이동 불가능.</li>
      <li><b>스케일드 원형(Scaled Radial)</b>: 원형 검사 뒤 남은 구간을 0~1로 다시 늘림.
      <code>out = norm(v) × (|v| - d) / (1 - d)</code>. 방향 유지, 출력 연속.</li>
    </ul>
    <p>왼쪽은 스틱 판. 회색 점은 원래 입력, 뷰 색 점은 데드존 처리 뒤 출력. 아래 작은 그래프는 현재 방향의 입력 크기 대 출력 크기 곡선.
    오른쪽 궤적은 출력으로 움직인 캐릭터.</p>`,
  // 도식: 세 데드존 모양과 같은 입력의 출력, 입력 크기 대 출력 크기 곡선
  diagram: (L) => `<svg viewBox="0 0 540 212" xmlns="http://www.w3.org/2000/svg">
    <text x="90" y="14" text-anchor="middle" class="t-a">${L('축별', 'Axial')}</text>
    <text x="270" y="14" text-anchor="middle">${L('원형', 'Radial')}</text>
    <text x="450" y="14" text-anchor="middle" class="t-b">${L('스케일드 원형', 'Scaled radial')}</text>
    <circle cx="90" cy="72" r="50" class="d-dim"/><circle cx="270" cy="72" r="50" class="d-dim"/><circle cx="450" cy="72" r="50" class="d-dim"/>
    <rect x="77.5" y="22" width="25" height="100" class="f-bad" fill-opacity="0.25"/><rect x="40" y="59.5" width="100" height="25" class="f-bad" fill-opacity="0.25"/>
    <circle cx="270" cy="72" r="12.5" class="f-bad" fill-opacity="0.25"/><circle cx="450" cy="72" r="12.5" class="f-bad" fill-opacity="0.25"/>
    <line x1="90" y1="72" x2="129" y2="63.7" class="d-dim" stroke-dasharray="3 2"/><circle cx="129" cy="63.7" r="4" class="f-dim"/>
    <line x1="129" y1="63.7" x2="129" y2="72" class="d-a"/><circle cx="129" cy="72" r="4" class="f-a"/>
    <line x1="270" y1="72" x2="309" y2="63.7" class="d-dim" stroke-dasharray="3 2"/><circle cx="309" cy="63.7" r="4" class="f-accent"/>
    <line x1="450" y1="72" x2="489" y2="63.7" class="d-dim" stroke-dasharray="3 2"/><circle cx="489" cy="63.7" r="4" class="f-dim"/><circle cx="485.7" cy="64.4" r="4" class="f-b"/>
    <text x="90" y="136" text-anchor="middle" class="t-small">${L('12° 입력이 0°로 쏠림', '12° input snaps to 0°')}</text>
    <text x="270" y="136" text-anchor="middle" class="t-small">${L('방향 유지, 경계에서 튐', 'Keeps direction, jumps at edge')}</text>
    <text x="450" y="136" text-anchor="middle" class="t-small">${L('방향 유지, 0부터 연속', 'Keeps direction, starts at 0')}</text>
    ${[90, 270, 450].map((c) => `<path d="M${c - 45},145 L${c - 45},190 L${c + 45},190" class="d-dim"/><line x1="${c - 22.5}" y1="186" x2="${c - 22.5}" y2="194" class="d-dim"/>`).join('')}
    <path d="M45,190 L67.5,190 M67.5,178.75 L135,145" class="d-a"/><line x1="67.5" y1="190" x2="67.5" y2="178.75" class="d-bad" stroke-dasharray="2 2"/>
    <path d="M225,190 L247.5,190 M247.5,178.75 L315,145" class="d-line"/><line x1="247.5" y1="190" x2="247.5" y2="178.75" class="d-bad" stroke-dasharray="2 2"/>
    <path d="M405,190 L427.5,190 L495,145" class="d-b"/>
    <text x="72" y="176" class="t-small t-dim">${L('튐', 'jump')}</text><text x="252" y="176" class="t-small t-dim">${L('튐', 'jump')}</text>
    <text x="427.5" y="203" text-anchor="middle" class="t-small t-mono t-dim">d</text>
    <text x="270" y="208" text-anchor="middle" class="t-small t-dim">${L('아래 그래프: 입력 크기(가로) 대 출력 크기(세로)', 'Graphs: input size (x) vs output size (y)')}</text>
  </svg>`,
  look: [
    '자동 데모의 원 그리기 단계에서 A의 궤적은 축 근처가 평평하게 꺾여 둥근 사각형이 됨. B는 원에 가까움.',
    '"방향 왜곡" 측정값을 비교하면 A만 0°보다 큼. 축 근처 입력이 축으로 쏠리기 때문. B는 방향을 그대로 둠.',
    'B의 방식을 "원형"으로 바꾸면 "경계 출력 크기"가 데드존 크기(0.25) 근처로 뜀. 스케일드 원형은 0 근처에서 시작.',
    '두 뷰 모두 "데드존 없음"으로 바꾸고 드리프트를 0.2로 올리면 손을 뗀 구간에도 캐릭터가 계속 미끄러짐',
  ],
  refs: [
    { type: 'article', title: 'Doing Thumbstick Dead Zones Right (Josh Sutphin)', note: '축별, 원형, 스케일드 원형 데드존을 단계별로 비교한 글. 이 샘플의 기준.' },
    { type: 'book', title: 'Game Feel: A Game Designer\'s Guide to Virtual Sensation (Steve Swink)', year: 2008, note: '입력 장치의 민감도와 매핑' },
    { type: 'engine', title: 'Unity Input System - StickDeadzoneProcessor', note: 'min, max 값으로 원형 데드존을 걸고 남은 구간을 다시 늘리는 처리기' },
  ],
  params: [
    { key: 'mode', label: '데드존 방식', type: 'select', group: '기법', options: [
      { value: 'none', label: '데드존 없음' },
      { value: 'axial', label: '축별 (Axial)' },
      { value: 'radial', label: '원형 (Radial)' },
      { value: 'scaled', label: '스케일드 원형 (Scaled Radial)' },
    ], a: 'axial', b: 'scaled' },
    { key: 'dead', label: '데드존 크기', type: 'range', min: 0, max: 0.5, step: 0.01, default: 0.25, when: (p) => p.mode !== 'none' },
    { key: 'drift', label: '스틱 드리프트 크기', type: 'range', min: 0, max: 0.3, step: 0.01, default: 0.14, shared: true, group: '장면', help: '손을 뗐을 때 스틱이 내는 값의 크기' },
    { key: 'speed', label: '최대 이동 속도 (px/s)', type: 'int', min: 80, max: 320, default: 180, shared: true },
    { key: 'demo', label: '자동 데모', type: 'bool', default: true, shared: true },
    { key: 'restart', label: '처음부터', type: 'button', buttonLabel: '다시 시작' },
  ],
  en: {
    title: 'Analog Stick Dead Zone',
    summary: 'A stick reports a nonzero value even when you let go (drift). Depending on the dead zone shape, diagonal input snaps to an axis or the speed jumps at the edge. A scaled radial dead zone avoids both problems.',
    views: { a: 'Axial dead zone', b: 'Scaled radial dead zone' },
    controls: '←→↑↓ / WASD to tilt the stick (pressing a key pauses the auto demo for a moment)',
    info: `
    <p>A <b>dead zone</b> is an area near the stick center where input is thrown away as 0.
    When you let go, a stick does not return exactly to the center. If you use this small value (drift) as is, the character walks on its own.</p>
    <ul>
      <li><b>Axial</b>: check x and y on their own. If <code>|x| &lt; d</code>, then x = 0. It is the easiest to build.
      Downside: directions near an axis snap to that axis. A 20° tilt becomes 0°.</li>
      <li><b>Radial</b>: check the vector length. If <code>|v| &lt; d</code>, output 0. The direction is kept.
      Downside: the output jumps from 0 to d the moment you cross the edge. Very slow movement is impossible.</li>
      <li><b>Scaled radial</b>: after the radial check, stretch the rest of the range back to 0 to 1.
      <code>out = norm(v) × (|v| - d) / (1 - d)</code>. Direction is kept, and the output is continuous.</li>
    </ul>
    <p>On the left is the stick pad. Gray dots are raw input, and dots in the view color are the output after the dead zone. The small graph below shows input size against output size in the current direction.
    The path on the right is the character moved by the output.</p>`,
    look: [
      'In the circle step of the auto demo, A\'s path flattens near the axes and becomes a rounded square. B is close to a circle.',
      'Compare the "Direction error" value. Only A is above 0°, because input near an axis snaps to it. B keeps the direction.',
      'Change B\'s mode to "Radial". "Output at edge" jumps to about the dead zone size (0.25). Scaled radial starts near 0.',
      'Set both views to "No dead zone" and raise drift to 0.2. The character keeps sliding even while you let go.',
    ],
    refs: [
      'Compares axial, radial, and scaled radial dead zones step by step. This sample is based on it.',
      'Sensitivity and mapping of input devices.',
      'A processor that applies a radial dead zone with min and max values and stretches the rest of the range.',
    ],
    params: {
      mode: { label: 'Dead zone type', group: 'Technique', options: { none: 'No dead zone', axial: 'Axial', radial: 'Radial', scaled: 'Scaled radial' } },
      dead: 'Dead zone size',
      drift: { label: 'Stick drift size', group: 'Scene', help: 'Size of the value the stick reports when you let go' },
      speed: 'Max move speed (px/s)',
      demo: 'Auto demo',
      restart: { label: 'Start over', buttonLabel: 'Restart' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 640, WH = 360, STEP = 1 / 120;
    const col = ctx.side === 'a' ? C.a : C.b;
    const KEYS = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'] };
    const ALL = [...KEYS.left, ...KEYS.right, ...KEYS.up, ...KEYS.down];
    const SX = 130, SY = 150, SR = 100;                 // 스틱 판
    const AR = { x: 270, y: 16, w: 354, h: 328 };       // 캐릭터 영역
    const noise = U.noise(ctx.seed + 3);

    // 자동 데모 단계: 손 뗌 → 20° 방향으로 천천히 밀기 → 큰 원 → 작은 원 → 손 뗌
    const PHASES = [
      { kind: 'rest', dur: 2.0, name: GTL.L('손 뗌 (드리프트만)', 'Hands off (drift only)') },
      { kind: 'ramp', dur: 2.6, name: GTL.L('20° 방향으로 천천히 밀기', 'Push slowly toward 20°') },
      { kind: 'circle', dur: 4.5, mag: 0.9, name: GTL.L('큰 원 그리기', 'Draw a big circle') },
      { kind: 'circle', dur: 4.5, mag: 0.4, name: GTL.L('작은 원 그리기 (느린 이동)', 'Draw a small circle (slow movement)') },
      { kind: 'rest', dur: 1.2, name: GTL.L('손 뗌 (드리프트만)', 'Hands off (drift only)') },
    ];

    let raw, out, pos, trail, t, idle, demo, hold, st, wasZero, edgeOut, errHist, restDist, prevAuto;
    function init() {
      raw = { x: 0, y: 0 }; out = { x: 0, y: 0 }; hold = { x: 0, y: 0 };
      pos = { x: AR.x + AR.w / 2, y: AR.y + AR.h / 2 };
      trail = []; t = 0; idle = 99; demo = { phase: 0, t: 0 };
      wasZero = true; edgeOut = null; errHist = []; restDist = 0; prevAuto = true;
    }
    init();

    function drift() {
      const m = P.drift * (0.75 + 0.25 * noise.perlin2(t * 0.7, 1.3));
      const a = U.rad(205) + 0.5 * noise.perlin2(t * 0.4, 7.1);
      return { x: Math.cos(a) * m, y: Math.sin(a) * m };
    }

    function processStick(v) {
      const d = P.dead, m = Math.hypot(v.x, v.y);
      if (P.mode === 'none') return U.v2.limit(v, 1);
      if (P.mode === 'axial') return U.v2.limit({ x: Math.abs(v.x) < d ? 0 : v.x, y: Math.abs(v.y) < d ? 0 : v.y }, 1);
      if (m < d || m < 1e-9) return { x: 0, y: 0 };
      if (P.mode === 'radial') return U.v2.limit(v, 1);
      const k = Math.min(1, (m - d) / Math.max(1e-6, 1 - d)) / m;
      return { x: v.x * k, y: v.y * k };
    }

    // 사람 손 입력 (드리프트 제외). 반환: { v, resting }
    function demoHand() {
      const ph = PHASES[demo.phase];
      demo.t += STEP;
      const f = U.clamp(demo.t / ph.dur, 0, 1);
      let v = { x: 0, y: 0 };
      if (ph.kind === 'ramp') v = U.v2.fromAngle(U.rad(-20), f);
      else if (ph.kind === 'circle') v = U.v2.fromAngle(U.rad(-20) - f * U.TAU, ph.mag);
      if (demo.t >= ph.dur) {
        demo.phase = (demo.phase + 1) % PHASES.length; demo.t = 0;
        const nx = PHASES[demo.phase];
        if (nx.kind === 'circle') {
          // 원 궤적이 영역 가운데에 오도록 시작 위치를 맞춤
          const R = (P.speed * nx.mag * nx.dur) / U.TAU, a0 = U.rad(20);
          pos = { x: AR.x + AR.w / 2 + R * Math.sin(a0), y: AR.y + AR.h / 2 + R * Math.cos(a0) };
          trail.push({ x: -999, y: -999, m: 0 });
        }
      }
      return { v, resting: ph.kind === 'rest' };
    }

    function step(auto) {
      t += STEP;
      let hand, resting;
      if (auto) { const r = demoHand(); hand = r.v; resting = r.resting; }
      else {
        const kb = ctx.input;
        const tx = (KEYS.right.some(kb.key) ? 1 : 0) - (KEYS.left.some(kb.key) ? 1 : 0);
        const ty = (KEYS.down.some(kb.key) ? 1 : 0) - (KEYS.up.some(kb.key) ? 1 : 0);
        const tgt = U.v2.norm({ x: tx, y: ty });
        // 키보드는 디지털이므로 엄지가 천천히 기울이는 것처럼 보간
        hold.x = U.approach(hold.x, tgt.x, 2.2 * STEP);
        hold.y = U.approach(hold.y, tgt.y, 2.2 * STEP);
        hand = U.v2.limit(hold, 1); resting = !tx && !ty && Math.hypot(hold.x, hold.y) < 1e-3;
      }
      if (auto) hold = { ...hand };
      const dv = drift();
      raw = U.v2.limit({ x: hand.x + dv.x, y: hand.y + dv.y }, 1);
      out = processStick(raw);
      const om = Math.hypot(out.x, out.y);
      // 경계 출력: 0에서 처음 벗어나는 순간의 출력 크기
      if (om > 1e-6 && wasZero) edgeOut = om;
      wasZero = om <= 1e-6;
      // 방향 왜곡: 데드존 처리 전 입력 방향 대 처리 뒤 출력 방향
      if (om > 1e-6 && Math.hypot(raw.x, raw.y) > 0.3) {
        errHist.push(Math.abs(U.deg(U.angleDiff(U.v2.angle(raw), U.v2.angle(out)))));
        if (errHist.length > 1200) errHist.shift();
      }
      const vx = out.x * P.speed, vy = out.y * P.speed;
      const nx = U.clamp(pos.x + vx * STEP, AR.x + 8, AR.x + AR.w - 8), ny = U.clamp(pos.y + vy * STEP, AR.y + 8, AR.y + AR.h - 8);
      if (resting) restDist += Math.hypot(nx - pos.x, ny - pos.y);
      pos.x = nx; pos.y = ny;
      trail.push({ x: pos.x, y: pos.y, m: om });
      if (trail.length > 1400) trail.shift();
    }

    return {
      update(dt) {
        const touched = ALL.some(ctx.input.key);
        idle = touched ? 0 : idle + dt;
        const auto = P.demo && idle > 2.5;
        if (auto && !prevAuto) { demo = { phase: 0, t: 0 }; }
        prevAuto = auto;
        let n = Math.round(dt / STEP);
        if (n < 1) n = 1;
        for (let i = 0; i < n; i++) step(auto);
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const sc = Math.min(W / WW, H / WH), ox = (W - WW * sc) / 2, oy = (H - WH * sc) / 2;
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        const d = P.dead;
        // 스틱 판
        D.circle(g, SX, SY, SR, '#1d212a', '#3a4150', 1.5);
        if (P.mode === 'axial') {
          g.globalAlpha = 0.25;
          D.rect(g, SX - d * SR, SY - SR, 2 * d * SR, 2 * SR, C.bad);
          D.rect(g, SX - SR, SY - d * SR, 2 * SR, 2 * d * SR, C.bad);
          g.globalAlpha = 1;
        } else if (P.mode !== 'none') {
          D.circle(g, SX, SY, d * SR, 'rgba(255,83,112,0.25)', C.bad, 1);
        }
        D.line(g, SX - SR, SY, SX + SR, SY, 'rgba(255,255,255,0.12)');
        D.line(g, SX, SY - SR, SX, SY + SR, 'rgba(255,255,255,0.12)');
        D.line(g, SX + raw.x * SR, SY + raw.y * SR, SX + out.x * SR, SY + out.y * SR, 'rgba(255,255,255,0.4)', 1);
        D.circle(g, SX + raw.x * SR, SY + raw.y * SR, 6, 'rgba(200,200,200,0.8)');
        D.circle(g, SX + out.x * SR, SY + out.y * SR, 5, col, '#fff', 1);
        D.text(g, GTL.L('회색: 원래 입력', 'Gray: raw input'), SX - SR, SY + SR + 6, { size: 10, color: C.dim });
        D.text(g, GTL.L('색 점: 출력', 'Colored dots: output'), SX + 10, SY + SR + 6, { size: 10, color: col });
        // 응답 곡선 (현재 방향)
        const gx = 40, gy = 276, gw = 180, gh = 64;
        D.rect(g, gx, gy, gw, gh, 'rgba(0,0,0,0.35)');
        const rm = Math.hypot(raw.x, raw.y), ang = rm > 1e-3 ? Math.atan2(raw.y, raw.x) : U.rad(-20);
        g.beginPath();
        for (let i = 0; i <= 60; i++) {
          const m = i / 60, o = processStick(U.v2.fromAngle(ang, m)), om = Math.hypot(o.x, o.y);
          const px = gx + m * gw, py = gy + gh - om * gh;
          i ? g.lineTo(px, py) : g.moveTo(px, py);
        }
        g.strokeStyle = col; g.lineWidth = 1.5; g.stroke();
        D.line(g, gx, gy + gh, gx + gw, gy, 'rgba(255,255,255,0.15)', 1);
        D.circle(g, gx + Math.min(1, rm) * gw, gy + gh - Math.hypot(out.x, out.y) * gh, 3, '#fff');
        D.text(g, GTL.L('입력 크기 → 출력 크기', 'Input size → output size'), gx + 4, gy + 3, { size: 10, color: C.dim });

        // 캐릭터 영역
        D.rect(g, AR.x, AR.y, AR.w, AR.h, '#181b22', '#2c3240', 1);
        D.grid(g, AR.w, AR.h, 32, 'rgba(255,255,255,0.04)', 0, 0);
        for (let i = 1; i < trail.length; i++) {
          const a = trail[i - 1], b = trail[i];
          if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 20) continue;
          g.globalAlpha = 0.25 + 0.75 * (i / trail.length);
          D.line(g, a.x, a.y, b.x, b.y, b.m > 1e-6 ? col : C.dim, 1.5);
        }
        g.globalAlpha = 1;
        D.circle(g, pos.x, pos.y, 8, col, '#fff', 1);
        if (Math.hypot(out.x, out.y) > 1e-6) D.arrow(g, pos.x, pos.y, pos.x + out.x * 30, pos.y + out.y * 30, '#fff', 1.5, 6);
        const auto = P.demo && idle > 2.5;
        D.text(g, auto ? GTL.L(`데모: ${PHASES[demo.phase].name}`, `Demo: ${PHASES[demo.phase].name}`) : GTL.L('수동 조작 중', 'Manual control'), AR.x + 8, AR.y + 6, { size: 11, color: auto ? C.dim : C.warn });
        g.restore();

        const err = errHist.length ? errHist.reduce((s, v) => s + v, 0) / errHist.length : 0;
        ctx.stat(GTL.L('방향 왜곡 (평균)', 'Direction error (mean)'), `${err.toFixed(1)}°`);
        ctx.stat(GTL.L('경계 출력 크기', 'Output at edge'), edgeOut === null ? '-' : edgeOut.toFixed(2));
        ctx.stat(GTL.L('손 뗀 동안 이동 거리', 'Distance moved while hands off'), `${restDist.toFixed(0)} px`);
        ctx.stat(GTL.L('출력', 'Output'), `(${out.x.toFixed(2)}, ${out.y.toFixed(2)})`);
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
