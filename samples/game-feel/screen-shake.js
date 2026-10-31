// 화면 흔들림: 프레임마다 무작위 오프셋 vs 트라우마² 기반 펄린 노이즈 (+ 회전)
GTL.register({
  id: 'screen-shake',
  title: '화면 흔들림: 트라우마 & 펄린 노이즈',
  summary: '프레임마다 카메라를 무작위로 튕기면 지글거리고, 프레임레이트에 따라 느낌이 달라짐. 트라우마(0~1)를 쌓고 그 제곱으로 펄린 노이즈의 크기를 정하면 강약이 자연스럽고 부드러운 흔들림이 됨.',
  views: { a: '무작위 오프셋 (선형)', b: '트라우마² × 펄린 + 회전' },
  controls: 'Space / Z: 플레이어 위치에서 폭발 (트라우마 추가), ←→↑↓ / WASD 이동',
  info: `
    <p>가장 흔한 구현은 흔들림 시간 동안 매 프레임 <code>offset = random(-1,1) × 강도</code>를 더하는 방식. 문제는 세 가지.</p>
    <ul>
      <li>값이 프레임마다 따로 놀아 <b>고주파 지글거림</b>이 생김.</li>
      <li>60fps와 144fps에서 체감이 다름.</li>
      <li>강도가 일정해 강약이 없음.</li>
    </ul>
    <p>Squirrel Eiserloh(GDC 2016)의 방식:</p>
    <ul>
      <li><b>트라우마</b> <code>t ∈ [0,1]</code>: 충격마다 더함(최대 1). 초당 일정량씩 선형으로 줄어듦.</li>
      <li><b>흔들림 = t² (또는 t³)</b>: 작은 충격은 거의 안 흔들리고 큰 충격은 확 흔들림. 감쇠 끝부분은 부드럽게 사라짐.</li>
      <li><b>펄린 노이즈</b>로 오프셋을 샘플링: <code>x = maxOffset × shake × perlin(seed, time × freq)</code>. 시간에 따라 연속이라 부드럽고 프레임레이트와 무관함.</li>
      <li><b>회전 흔들림</b>: 2D에서는 작은 각도의 회전이 이동보다 강렬하게 느껴짐. 이동 흔들림은 화면 가장자리를 드러내므로 최대값을 작게 둠.</li>
    </ul>
    <p>UI(HUD)는 흔들림 바깥에서 그려야 읽기 쉬움. 아래 그래프는 카메라 X 오프셋의 시간 변화.</p>`,
  // 도식: 트라우마에 따른 흔들림 크기(t vs t²)와 시간에 따른 오프셋(무작위 vs 펄린)
  diagram: (L) => {
    const rowA = [], rowB = [];
    for (let i = 0; i <= 35; i++) {
      const x = 250 + i * 8, u = i / 35;
      const r = Math.sin(i * 12.9898) * 43758.5453;
      rowA.push(`${x},${(48 + 30 * (1 - u) * ((r - Math.floor(r)) * 2 - 1)).toFixed(1)}`);
    }
    for (let i = 0; i <= 140; i++) {
      const x = 250 + i * 2, u = i / 140;
      const n = 0.6 * Math.sin(i * 0.11 + 0.5) + 0.4 * Math.sin(i * 0.23 + 1.7);
      rowB.push(`${x},${(130 + 30 * (1 - u) * (1 - u) * n).toFixed(1)}`);
    }
    return `<svg viewBox="0 0 540 180" xmlns="http://www.w3.org/2000/svg">
    <line x1="30" y1="140" x2="200" y2="140" class="d-dim"/><line x1="30" y1="20" x2="30" y2="140" class="d-dim"/>
    <path d="M30,140 L200,20" class="d-a"/>
    <path d="M30,140 Q115,140 200,20" class="d-b"/>
    <text x="34" y="14" class="t-small t-dim">${L('흔들림 크기', 'shake amount')}</text>
    <text x="200" y="154" text-anchor="end" class="t-small t-dim">${L('트라우마 t (0~1)', 'trauma t (0~1)')}</text>
    <text x="40" y="40" class="t-small t-a">A: shake = t</text>
    <text x="40" y="54" class="t-small t-b">B: shake = t²</text>
    <text x="30" y="172" class="t-small t-dim">${L('B는 작은 충격에 거의 안 흔들림', 'B barely shakes on small hits')}</text>
    <text x="250" y="12" class="t-small t-a">${L('A: 프레임마다 무작위, 지글거림', 'A: random each frame, jittery')}</text>
    <line x1="250" y1="48" x2="530" y2="48" class="d-dim"/>
    <polyline points="${rowA.join(' ')}" class="d-a" stroke-width="1.4"/>
    <text x="250" y="92" class="t-small t-b">${L('B: 펄린 노이즈, 시간에 연속', 'B: Perlin noise, continuous in time')}</text>
    <line x1="250" y1="130" x2="530" y2="130" class="d-dim"/>
    <polyline points="${rowB.join(' ')}" class="d-b" stroke-width="1.6"/>
    <text x="530" y="172" text-anchor="end" class="t-small t-dim">${L('시간 →, 트라우마 감소', 'time →, trauma decays')}</text>
  </svg>`;
  },
  look: [
    '하단 그래프를 비교하면 A는 뾰족한 톱니, B는 부드러운 곡선. 최대 오프셋이 같아도 B가 더 묵직하게 느껴짐.',
    'A의 지수(exponent)를 1로 두면 작은 폭발도 화면을 크게 흔듦. 2~3으로 올리면 큰 폭발만 강하게 흔들림.',
    'B의 노이즈 주파수를 3 정도로 낮추면 배멀미 같은 출렁임이 됨. 40으로 올리면 A처럼 지글거림.',
    'Space를 연타하면 트라우마가 1에서 더 오르지 않음. 흔들림이 끝없이 세지지 않는 것도 트라우마 모델의 장점.',
    '회전 각도를 0으로 하면 B도 밋밋해짐. 2~4°만 줘도 타격감이 크게 달라짐.',
  ],
  refs: [
    { type: 'talk', title: 'Math for Game Programmers: Juicing Your Cameras With Math (Squirrel Eiserloh)', year: 2016, note: 'GDC 2016. 트라우마, shake = trauma², 펄린 노이즈 기반 흔들림, 회전 흔들림.' },
    { type: 'talk', title: 'The Art of Screenshake (Jan Willem Nijman, Vlambeer)', year: 2013, note: 'INDIGO 2013. 화면 흔들림을 포함한 30가지 타격감 기법.' },
    { type: 'talk', title: 'Juice it or lose it (Martin Jonasson & Petri Purho)', year: 2012, note: '게임에 주스를 단계적으로 추가하는 시연 발표.' },
  ],
  params: [
    { key: 'mode', label: '흔들림 방식', type: 'select', group: '흔들림', options: [
      { value: 'none', label: '없음' },
      { value: 'random', label: '프레임마다 무작위' },
      { value: 'perlin', label: '펄린 노이즈' },
    ], a: 'random', b: 'perlin' },
    { key: 'exponent', label: '지수 (shake = trauma^n)', type: 'select', options: [1, 2, 3], a: 1, b: 2, when: (p) => p.mode !== 'none' },
    { key: 'maxOffset', label: '최대 이동 (px)', type: 'range', min: 0, max: 40, step: 1, default: 16, when: (p) => p.mode !== 'none' },
    { key: 'maxAngle', label: '최대 회전 (°)', type: 'range', min: 0, max: 10, step: 0.5, a: 0, b: 3, when: (p) => p.mode !== 'none' },
    { key: 'freq', label: '노이즈 주파수 (Hz)', type: 'range', min: 1, max: 40, step: 0.5, default: 14, when: (p) => p.mode === 'perlin' },
    { key: 'decay', label: '트라우마 감소 (/초)', type: 'range', min: 0.2, max: 3, step: 0.05, default: 0.9 },
    { key: 'demo', label: '자동 데모 (주기적 폭발)', type: 'bool', default: true, shared: true, group: '장면' },
    { key: 'interval', label: '폭발 간격 (초)', type: 'range', min: 0.4, max: 4, step: 0.1, default: 1.6, shared: true, when: (p) => p.demo },
    { key: 'restart', label: '처음부터', type: 'button', buttonLabel: '다시 시작' },
  ],
  en: {
    title: 'Screen Shake: Trauma & Perlin Noise',
    summary: 'Jolting the camera at random every frame looks jittery, and it feels different at each frame rate. Build up trauma (0 to 1) and use its square to scale Perlin noise. The shake then has natural strength and stays smooth.',
    views: { a: 'Random offset (linear)', b: 'Trauma² × Perlin + rotation' },
    controls: 'Space / Z: explosion at the player position (adds trauma), ←→↑↓ / WASD to move',
    info: `
    <p>The most common approach adds <code>offset = random(-1,1) × strength</code> every frame while the shake lasts. It has three problems.</p>
    <ul>
      <li>Each frame gets an unrelated value, so you get <b>high frequency jitter</b>.</li>
      <li>It feels different at 60fps and 144fps.</li>
      <li>The strength is constant, so there is no variation.</li>
    </ul>
    <p>The approach of Squirrel Eiserloh (GDC 2016):</p>
    <ul>
      <li><b>Trauma</b> <code>t ∈ [0,1]</code>: add some on each impact (max 1). It goes down linearly at a fixed rate per second.</li>
      <li><b>Shake = t² (or t³)</b>: small impacts barely shake, and big impacts shake hard. The end of the decay fades out smoothly.</li>
      <li>Sample the offset from <b>Perlin noise</b>: <code>x = maxOffset × shake × perlin(seed, time × freq)</code>. It is continuous over time, so it is smooth and does not depend on frame rate.</li>
      <li><b>Rotational shake</b>: in 2D a small rotation feels stronger than movement. Movement shake shows the screen edges, so keep its maximum small.</li>
    </ul>
    <p>Draw the UI (HUD) outside the shake so it stays easy to read. The graph below shows the camera X offset over time.</p>`,
    look: [
      'Compare the bottom graphs. A is a spiky sawtooth. B is a smooth curve. Even with the same max offset, B feels heavier.',
      'Set A\'s exponent to 1. Even a small explosion shakes the screen a lot. Raise it to 2 or 3 and only big explosions shake hard.',
      'Lower B\'s noise frequency to about 3. It sways like seasickness. Raise it to 40 and it jitters like A.',
      'Mash Space. Trauma does not go above 1. The shake does not grow forever, which is another strength of the trauma model.',
      'Set the rotation angle to 0 and B looks flat too. Just 2 to 4° makes the impact feel very different.',
    ],
    refs: [
      'GDC 2016. Trauma, shake = trauma², Perlin noise shake, rotational shake.',
      'INDIGO 2013. 30 impact techniques, including screen shake.',
      'A live demo that adds juice to a game step by step.',
    ],
    params: {
      mode: { label: 'Shake mode', group: 'Shake', options: { none: 'None', random: 'Random every frame', perlin: 'Perlin noise' } },
      exponent: 'Exponent (shake = trauma^n)',
      maxOffset: 'Max offset (px)',
      maxAngle: 'Max rotation (°)',
      freq: 'Noise frequency (Hz)',
      decay: 'Trauma decay (/s)',
      demo: { label: 'Auto demo (periodic explosions)', group: 'Scene' },
      interval: 'Explosion interval (s)',
      restart: { label: 'Start over', buttonLabel: 'Restart' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 640, WH = 360;
    const col = ctx.side === 'a' ? C.a : C.b;
    const MOVE = { l: ['ArrowLeft', 'KeyA'], r: ['ArrowRight', 'KeyD'], u: ['ArrowUp', 'KeyW'], d: ['ArrowDown', 'KeyS'] };
    const BOOM = ['Space', 'KeyZ'];
    const noise = U.noise(ctx.seed + 7);

    let trauma, t, boomTimer, booms, parts, hist, player, sceneRng, shakeRng, cam, crates, boomCount;
    function init() {
      sceneRng = U.rng(ctx.seed);           // 장면(폭발 위치, 파편): 두 뷰 동일
      shakeRng = U.rng(ctx.seed + 1234);    // 흔들림 전용 난수: 장면 난수와 분리해 A/B 동기 유지
      trauma = 0; t = 0; boomTimer = 0.5; booms = []; parts = []; hist = []; boomCount = 0;
      player = { x: WW / 2, y: WH / 2 };
      cam = { x: 0, y: 0, a: 0 };
      crates = [];
      const r = U.rng(ctx.seed + 55);
      for (let i = 0; i < 14; i++) crates.push({ x: r.range(40, WW - 70), y: r.range(40, WH - 70), s: r.range(18, 34) });
    }
    init();

    function explode(x, y, power) {
      booms.push({ x, y, r: 0, life: 0, power });
      for (let i = 0; i < 26 * power; i++) {
        const a = sceneRng.range(0, U.TAU), sp = sceneRng.range(60, 320) * power;
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: sceneRng.range(0.4, 0.9) });
      }
      trauma = Math.min(1, trauma + 0.35 + 0.4 * power);
      boomCount++;
    }

    return {
      update(dt) {
        const kb = ctx.input;
        t += dt;
        const dx = (MOVE.r.some(kb.key) ? 1 : 0) - (MOVE.l.some(kb.key) ? 1 : 0);
        const dy = (MOVE.d.some(kb.key) ? 1 : 0) - (MOVE.u.some(kb.key) ? 1 : 0);
        player.x = U.clamp(player.x + dx * 200 * dt, 20, WW - 20);
        player.y = U.clamp(player.y + dy * 200 * dt, 20, WH - 20);
        if (BOOM.some(kb.pressed)) explode(player.x, player.y, 1);
        if (P.demo) {
          boomTimer -= dt;
          if (boomTimer <= 0) {
            boomTimer = P.interval;
            const big = sceneRng.chance(0.3);
            explode(sceneRng.range(60, WW - 60), sceneRng.range(50, WH - 50), big ? 1.2 : 0.35);
          }
        }
        for (const b of booms) { b.life += dt; b.r = 20 + 160 * U.ease.outCubic(Math.min(1, b.life / 0.5)) * b.power; }
        booms = booms.filter((b) => b.life < 0.6);
        for (const q of parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= Math.exp(-4 * dt); q.vy *= Math.exp(-4 * dt); q.life -= dt; }
        parts = parts.filter((q) => q.life > 0);

        // 트라우마 감소 & 흔들림 계산
        trauma = Math.max(0, trauma - P.decay * dt);
        const shake = Math.pow(trauma, +P.exponent);
        const maxA = U.rad(P.maxAngle);
        if (P.mode === 'random') {
          cam.x = P.maxOffset * shake * (shakeRng.next() * 2 - 1);
          cam.y = P.maxOffset * shake * (shakeRng.next() * 2 - 1);
          cam.a = maxA * shake * (shakeRng.next() * 2 - 1);
        } else if (P.mode === 'perlin') {
          const n = (k) => U.clamp(noise.perlin2(t * P.freq, k + 0.5) * 1.5, -1, 1);
          cam.x = P.maxOffset * shake * n(0);
          cam.y = P.maxOffset * shake * n(17);
          cam.a = maxA * shake * n(41);
        } else { cam.x = cam.y = cam.a = 0; }
        hist.push(cam.x);
        if (hist.length > 180) hist.shift();
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const sc = Math.min(W / WW, H / WH), ox = (W - WW * sc) / 2, oy = (H - WH * sc) / 2;
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        // ── 카메라(흔들림) 적용 월드 ──
        g.save();
        g.translate(WW / 2, WH / 2); g.rotate(cam.a); g.translate(-WW / 2 + cam.x, -WH / 2 + cam.y);
        D.rect(g, -60, -60, WW + 120, WH + 120, '#1b1f26');
        for (let y = -40; y < WH + 40; y += 40) for (let x = -40; x < WW + 40; x += 40) {
          if (((x + y) / 40) & 1) D.rect(g, x, y, 40, 40, '#1f242c');
        }
        D.rect(g, 4, 4, WW - 8, WH - 8, null, '#3a414d', 4);
        for (const c of crates) { D.rect(g, c.x, c.y, c.s, c.s, '#5a4a36', '#7a6548', 2); D.line(g, c.x, c.y, c.x + c.s, c.y + c.s, '#7a6548', 1); }
        for (const b of booms) {
          const f = b.life / 0.6;
          D.circle(g, b.x, b.y, b.r * 0.55, `rgba(255,${200 - f * 150},80,${0.5 * (1 - f)})`);
          D.circle(g, b.x, b.y, b.r, null, `rgba(255,230,180,${1 - f})`, 3);
        }
        for (const q of parts) D.rect(g, q.x - 2, q.y - 2, 4, 4, `rgba(255,${150 + q.life * 100},90,${Math.min(1, q.life * 2)})`);
        D.circle(g, player.x, player.y, 11, col, '#fff', 2);
        g.restore();
        // ── HUD (흔들림 없음) ──
        D.rect(g, 12, 12, 160, 10, 'rgba(0,0,0,0.5)');
        D.rect(g, 12, 12, 160 * trauma, 10, C.warn);
        D.rect(g, 12, 12, 160 * Math.pow(trauma, +P.exponent), 10, col);
        D.text(g, GTL.L(`트라우마 ${trauma.toFixed(2)}  흔들림 ${Math.pow(trauma, +P.exponent).toFixed(2)}`, `Trauma ${trauma.toFixed(2)}  shake ${Math.pow(trauma, +P.exponent).toFixed(2)}`), 12, 26, { size: 11, color: C.text });
        D.plot(g, hist, 12, WH - 62, 200, 50, { min: -40, max: 40, color: col, label: GTL.L('카메라 X 오프셋 (3초)', 'Camera X offset (3 s)') });
        D.line(g, 12, WH - 37, 212, WH - 37, 'rgba(255,255,255,0.15)', 1);
        g.restore();
        let jerk = 0;
        for (let i = 2; i < hist.length; i++) jerk += Math.abs(hist[i] - 2 * hist[i - 1] + hist[i - 2]);
        ctx.stat(GTL.L('트라우마', 'Trauma'), trauma.toFixed(2));
        ctx.stat(GTL.L('오프셋', 'Offset'), `${cam.x.toFixed(1)}, ${cam.y.toFixed(1)} px, ${U.deg(cam.a).toFixed(1)}°`);
        ctx.stat(GTL.L('지글거림 (2차 차분 평균)', 'Jitter (mean 2nd difference)'), hist.length > 2 ? (jerk / (hist.length - 2)).toFixed(2) + ' px' : '-');
        ctx.stat(GTL.L('폭발 수', 'Explosions'), boomCount);
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
