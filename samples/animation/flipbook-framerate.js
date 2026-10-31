// 플립북 프레임레이트: 포즈를 매 프레임 갱신 vs 12fps(2프레임마다) 홀드. 이동은 부드럽게 또는 같이 끊기게.
GTL.register({
  id: 'flipbook-framerate',
  title: '애니메이션 프레임레이트: 매 프레임 vs 2프레임마다 (on twos)',
  summary: '포즈를 화면 프레임마다 바꾸면 매끄럽고, 12fps로 유지하면 손그림 같은 리듬이 생김. 포즈만 끊고 이동은 부드럽게 두면 리듬은 살지만 발이 앞뒤로 밀림.',
  views: { a: '포즈 60fps (매 프레임)', b: '포즈 12fps (on twos), 이동 부드럽게' },
  controls: '조작 없음. 캐릭터가 오른쪽으로 계속 걸음.',
  info: `
    <p><b>애니메이션 프레임레이트</b>는 포즈를 몇 번 바꾸는지를 뜻함. 화면 프레임레이트(60fps)와 따로 정할 수 있음.</p>
    <p>손그림 애니메이션은 24fps 기준으로 한 포즈를 2프레임 유지. 이것을 <b>2프레임마다(on twos)</b>라고 부름. 실제 포즈 갱신은 12번/초.
    Guilty Gear Xrd는 3D 모델을 이 방식으로 재생해 2D 애니메이션처럼 보이게 했음.</p>
    <p>구현은 간단함. 재생 시간을 <code>floor(t * fps) / fps</code>로 내림한 뒤 그 시간의 포즈를 씀.</p>
    <p>단점: 위치를 매 프레임 옮기면서 포즈만 유지하면, 땅을 디딘 발이 몸과 함께 앞으로 끌려감. 다음 포즈에서 발이 뒤로 튐.
    위치까지 같은 간격으로 끊으면 발은 고정되지만 화면 이동이 덜컥거림.</p>`,
  // 도식: 화면 프레임 20개 동안의 포즈 갱신. B는 한 포즈를 5프레임 유지하는 동안 몸만 앞으로 가서 디딘 발이 끌려갔다가 뒤로 튐
  diagram: (L) => {
    const x0 = 130, fw = 19.5, n = 20;
    const ticks = Array.from({ length: n + 1 }, (_, i) => `<line x1="${(x0 + i * fw).toFixed(1)}" y1="14" x2="${(x0 + i * fw).toFixed(1)}" y2="24" class="d-dim"/>`).join('');
    const boxA = Array.from({ length: n }, (_, i) => `<rect x="${(x0 + i * fw + 1).toFixed(1)}" y="34" width="${(fw - 2).toFixed(1)}" height="18" class="d-a"/>`).join('');
    const boxB = Array.from({ length: 4 }, (_, i) => `<rect x="${(x0 + i * 5 * fw + 1).toFixed(1)}" y="62" width="${(5 * fw - 2).toFixed(1)}" height="18" class="d-b"/><text x="${(x0 + (i + 0.5) * 5 * fw).toFixed(1)}" y="75" text-anchor="middle" class="t-small">${L('포즈 ', 'pose ')}${i + 1}</text>`).join('');
    let saw = `M${x0},150`;
    for (let i = 0; i < 4; i++) { const xs = x0 + (i + 1) * 5 * fw; saw += ` L${xs.toFixed(1)},118 L${xs.toFixed(1)},150`; }
    return `<svg viewBox="0 0 540 206" xmlns="http://www.w3.org/2000/svg">
    <text x="4" y="23">${L('화면 프레임', 'Screen frames')}</text>${ticks}
    <text x="4" y="47" class="t-a">${L('A: 포즈 60fps', 'A: pose 60fps')}</text>${boxA}
    <text x="4" y="75" class="t-b">${L('B: 포즈 12fps', 'B: pose 12fps')}</text>${boxB}
    <text x="4" y="122">${L('디딘 발의', 'Planted foot')}</text>
    <text x="4" y="136">${L('월드 위치', 'world x')}</text>
    <line x1="${x0}" y1="150" x2="${x0 + n * fw}" y2="150" class="d-a"/>
    <path d="${saw}" class="d-b"/>
    <text x="${x0 + 2.5 * fw}" y="112" text-anchor="middle" class="t-small t-dim">${L('몸만 이동, 발이 끌려감', 'body moves, foot drags')}</text>
    <text x="${x0 + 5 * fw + 4}" y="164" class="t-small t-dim">${L('다음 포즈에서 뒤로 튐', 'snaps back on the next pose')}</text>
    <text x="${x0 + n * fw - 4}" y="164" text-anchor="end" class="t-small t-a">${L('A: 고정', 'A: fixed')}</text>
    <text x="4" y="186" class="t-mono t-small">held = floor(t * fps) / fps</text>
    <text x="4" y="200" class="t-small t-dim">${L('"포즈와 함께 끊기"는 위치도 held 시간으로 계산. 발은 고정되지만 몸이 덜컥거림', '"Step with pose" also uses the held time for position. Feet stay put, but the body jerks')}</text>
  </svg>`;
  },
  look: [
    'B의 발끝 표시(점)를 보면 디딘 발이 앞으로 미끄러졌다가 포즈가 바뀔 때 뒤로 튐. "디딘 발 밀림" 값으로 확인됨.',
    'B의 "위치 갱신"을 "포즈와 함께 끊기"로 바꾸면 발 밀림이 0이 됨. 대신 몸 전체가 덜컥거리며 이동.',
    '포즈 프레임레이트를 8fps(3프레임마다)로 낮추면 리듬이 더 강해짐. 동시에 동작이 뚝뚝 끊겨 읽기 어려워짐.',
    '"잔상 표시"를 켜면 유지된 포즈의 간격이 넓게 보임. A는 잔상이 촘촘히 이어짐.',
  ],
  refs: [
    { type: 'talk', title: 'GuiltyGearXrd\'s Art Style: The X Factor Between 2D and 3D (Junya C. Motomura)', year: 2015, note: 'GDC 2015. 3D 모델을 프레임을 덜어 내며 재생해 2D 애니메이션처럼 보이게 함.' },
    { type: 'book', title: 'The Animator\'s Survival Kit (Richard Williams)', note: '1프레임마다(ones)와 2프레임마다(twos) 촬영의 차이' },
  ],
  params: [
    { key: 'poseFps', label: '포즈 프레임레이트', type: 'select', group: '재생', options: [
      { value: 60, label: '60fps (매 프레임)' },
      { value: 24, label: '24fps' },
      { value: 12, label: '12fps (on twos)' },
      { value: 8, label: '8fps (on threes)' },
    ], a: 60, b: 12 },
    { key: 'move', label: '위치 갱신', type: 'select', options: [
      { value: 'smooth', label: '매 프레임 (부드럽게)' },
      { value: 'stepped', label: '포즈와 함께 끊기' },
    ], default: 'smooth', when: (p) => p.poseFps < 60 },
    { key: 'onion', label: '잔상 표시', type: 'bool', default: true },
    { key: 'speed', label: '걷기 속도 (px/s)', type: 'range', min: 40, max: 200, step: 1, default: 110, shared: true, group: '장면' },
  ],
  en: {
    title: 'Animation Frame Rate: Every Frame vs On Twos',
    summary: 'Changing the pose every screen frame looks smooth. Holding poses at 12fps gives a hand-drawn rhythm. If you step only the pose and keep movement smooth, you keep the rhythm, but the feet slide back and forth.',
    views: { a: 'Pose 60fps (every frame)', b: 'Pose 12fps (on twos), smooth movement' },
    controls: 'No input. The character keeps walking to the right.',
    info: `
    <p>The <b>animation frame rate</b> is how often the pose changes. You can set it apart from the screen frame rate (60fps).</p>
    <p>Hand-drawn animation at 24fps often holds each pose for 2 frames. This is called <b>on twos</b>. The pose actually changes 12 times per second.
    Guilty Gear Xrd played its 3D models this way to make them look like 2D animation.</p>
    <p>It is simple to build. Round the playback time down with <code>floor(t * fps) / fps</code>, then use the pose at that time.</p>
    <p>Downside: if you move the position every frame but hold the pose, the planted foot gets dragged forward with the body. On the next pose, the foot snaps back.
    If you also step the position at the same interval, the foot stays put, but the movement on screen jerks.</p>`,
    look: [
      'Look at B\'s foot markers (dots). The planted foot slides forward, then snaps back when the pose changes. The "Planted foot slide" value shows it.',
      'Change B\'s "Position update" to "Step with pose". Foot slide drops to 0. Instead, the whole body jerks as it moves.',
      'Lower the pose frame rate to 8fps (on threes). The rhythm gets stronger. At the same time, the motion gets choppy and harder to read.',
      'Turn on "Show ghosts". The held poses appear far apart. In A, the ghosts form a dense chain.',
    ],
    refs: [
      'GDC 2015. Plays 3D models with dropped frames so they look like 2D animation.',
      'The difference between shooting on ones and on twos.',
    ],
    params: {
      poseFps: { label: 'Pose frame rate', group: 'Playback', options: { 60: '60fps (every frame)' } },
      move: { label: 'Position update', options: { smooth: 'Every frame (smooth)', stepped: 'Step with pose' } },
      onion: 'Show ghosts',
      speed: { label: 'Walk speed (px/s)', group: 'Scene' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const TAU = U.TAU, PERIOD = 1.0, UL = 46, LL = 46, HIP = 86;
    let t = 0, ghosts = [], lastHeld = -1, slideHist = [], prevFoot = null, poseJump = 0, prevPose = null;
    let updates = 0, updWindow = [];

    // 한 주기 걷기 클립. q는 0~1. 디딤 구간에서 발이 몸 기준으로 정확히 v 속도로 뒤로 감.
    function footLocal(q, v) {
      const L = (v * PERIOD) / 2;
      if (q < 0.5) return { x: L / 2 - v * q * PERIOD, y: 0, stance: true };
      const s = U.smoothstep(0.5, 1, q);
      return { x: U.lerp(-L / 2, L / 2, s), y: -Math.sin((q - 0.5) * 2 * Math.PI) * 18, stance: false };
    }
    function pose(time) {
      const v = P.speed, p = (time / PERIOD) % 1;
      const fl = footLocal(p, v), fr = footLocal((p + 0.5) % 1, v);
      const bob = Math.abs(Math.sin(p * TAU)) * 4;
      return { fl, fr, bob, arm: Math.sin(p * TAU) * 0.5 };
    }
    // 2관절 IK. 엉덩이 h에서 발 f로. 무릎은 앞쪽으로 굽힘.
    function ik(h, f) {
      const dx = f.x - h.x, dy = f.y - h.y, d = Math.min(Math.hypot(dx, dy), UL + LL - 0.01);
      const a = Math.atan2(dy, dx), c = Math.acos(U.clamp((UL * UL + d * d - LL * LL) / (2 * UL * d), -1, 1));
      return { x: h.x + Math.cos(a - c) * UL, y: h.y + Math.sin(a - c) * UL };
    }
    const rootX = (time) => time * P.speed;

    return {
      update(dt) {
        t += dt;
        const fps = +P.poseFps;
        const held = fps >= 60 ? t : Math.floor(t * fps) / fps;
        const root = P.move === 'stepped' && fps < 60 ? rootX(held) : rootX(t);
        const pz = pose(held);
        if (held !== lastHeld) {
          updates++; updWindow.push(t);
          if (prevPose) poseJump = Math.max(Math.abs(pz.fl.x - prevPose.fl.x), Math.abs(pz.fr.x - prevPose.fr.x));
          prevPose = pz; lastHeld = held;
          ghosts.push({ root, pz }); if (ghosts.length > 8) ghosts.shift();
        }
        while (updWindow.length && updWindow[0] < t - 1) updWindow.shift();
        // 디딘 발의 월드 위치 변화 = 발 밀림
        const st = pz.fl.stance ? 'l' : 'r', fx = root + (st === 'l' ? pz.fl.x : pz.fr.x);
        let slide = 0;
        if (prevFoot && prevFoot.st === st) slide = Math.abs(fx - prevFoot.x);
        prevFoot = { st, x: fx };
        slideHist.push(slide / dt); if (slideHist.length > 120) slideHist.shift();
        this.root = root; this.pz = pz;
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height, col = ctx.side === 'a' ? C.a : C.b;
        const gy = H * 0.68, span = W + 120;
        const sx = (x) => ((x % span) + span) % span - 60;
        D.line(g, 0, gy, W, gy, C.dim, 2);
        for (let x = 0; x < W; x += 40) D.line(g, x, gy + 2, x - 10, gy + 12, 'rgba(255,255,255,0.12)', 1);
        const fig = (root, pz, color, lw, alpha) => {
          const ox = sx(root), hip = { x: ox, y: gy - HIP + pz.bob };
          g.globalAlpha = alpha;
          for (const [f, c] of [[pz.fr, 'rgba(255,255,255,0.35)'], [pz.fl, color]]) {
            const foot = { x: ox + f.x, y: gy + f.y }, k = ik(hip, foot);
            D.line(g, hip.x, hip.y, k.x, k.y, c, lw); D.line(g, k.x, k.y, foot.x, foot.y, c, lw);
            if (alpha === 1) D.circle(g, foot.x, foot.y, 4, f.stance ? C.warn : null, f.stance ? null : C.dim, 1);
          }
          const neck = { x: hip.x + 6, y: hip.y - 62 };
          D.line(g, hip.x, hip.y, neck.x, neck.y, color, lw + 1);
          for (const s of [1, -1]) {
            const a = pz.arm * s, el = { x: neck.x + Math.sin(a) * 32, y: neck.y + 4 + Math.cos(a) * 32 };
            D.line(g, neck.x, neck.y + 4, el.x, el.y, s > 0 ? color : 'rgba(255,255,255,0.35)', lw);
            D.line(g, el.x, el.y, el.x + Math.sin(a + 0.5) * 30, el.y + Math.cos(a + 0.5) * 30, s > 0 ? color : 'rgba(255,255,255,0.35)', lw);
          }
          D.circle(g, neck.x + 3, neck.y - 16, 13, alpha === 1 ? '#20242c' : null, color, lw * 0.6);
          g.globalAlpha = 1;
        };
        if (!this.pz) return;
        if (P.onion) ghosts.forEach((gh, i) => fig(gh.root, gh.pz, '#ffffff', 2, 0.05 + 0.03 * i));
        fig(this.root, this.pz, col, 5, 1);
        D.plot(g, slideHist, 12, H - 82, W - 24, 64, { min: 0, max: 600, color: col, label: GTL.L('디딘 발 월드 속도 (px/s, 0이면 고정)', 'Planted foot world speed (px/s, 0 means fixed)') });
        const avg = slideHist.reduce((a, b) => a + b, 0) / Math.max(1, slideHist.length);
        ctx.stat(GTL.L('포즈 갱신', 'Pose updates'), updWindow.length + GTL.L(' 회/초', ' per s'));
        ctx.stat(GTL.L('포즈 유지 시간', 'Pose hold time'), (1000 / +P.poseFps).toFixed(1) + ' ms');
        ctx.stat(GTL.L('디딘 발 밀림', 'Planted foot slide'), avg.toFixed(0) + ' px/s');
        ctx.stat(GTL.L('포즈 1회 변화', 'Change per pose'), poseJump.toFixed(1) + ' px');
      },
    };
  },
});
