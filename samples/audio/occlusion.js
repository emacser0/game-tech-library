// 차폐 (Occlusion): 벽 레이캐스트로 로우패스 + 볼륨 감소
GTL.register({
  id: 'occlusion',
  title: '차폐 (Occlusion) 레이캐스트',
  summary: '벽 너머의 소리가 그대로 들리면 공간감이 깨짐. 음원과 청자 사이를 레이캐스트해서 벽 수만큼 볼륨을 줄이고 로우패스로 고음을 깎으면 벽 뒤의 소리처럼 들림. 레이 여러 개를 평균하면 벽 모서리에서 값이 튀지 않음.',
  views: { a: '차폐 없음', b: '다중 레이 차폐' },
  controls: '장면을 누르고 있으면 청자가 마우스 쪽으로 이동. 놓으면 정해진 경로를 순찰.',
  info: `
    <p><b>차폐(Occlusion)</b>는 음원과 청자 사이의 장애물 때문에 소리가 작아지고 먹먹해지는 효과.
    벽은 고음을 더 많이 막기 때문에 <b>볼륨 감소 + 로우패스 필터</b>로 흉내 냄.</p>
    <p>동작 방식:</p>
    <ul>
      <li>음원에서 청자까지 레이를 쏘아 막는 벽 수를 셈</li>
      <li>벽 하나당 몇 dB를 줄이고, 로우패스 차단 주파수를 낮춤</li>
      <li><b>단일 레이</b>는 레이가 벽 끝을 넘는 순간 값이 한 번에 바뀌어 "툭" 끊김</li>
      <li><b>다중 레이</b>: 음원 크기만큼 퍼진 점들로 여러 레이를 쏘고 평균함. 벽 모서리를 지날 때 값이 서서히 바뀜.</li>
      <li>값을 시간에 따라 부드럽게 따라가게(스무딩) 하면 남은 튐도 줄어듦</li>
    </ul>
    <p>단점: 문을 돌아 들어오는 소리(회절)는 레이캐스트만으로 표현 못함. 그래서 큰 게임은 방과 포털로 경로를 찾는 전파(Propagation) 시스템을 함께 씀.
    레이 수만큼 비용이 들어 보통 몇 프레임에 한 번, 가까운 음원만 검사.</p>`,
  diagram: (L) => {
    const ends = [[50, 0], [65, 0], [80, 1], [95, 1], [110, 1]];
    return `<svg viewBox="0 0 540 190" xmlns="http://www.w3.org/2000/svg">
    <line x1="130" y1="88" x2="130" y2="170" class="d-line" style="stroke-width:5"/>
    <text x="136" y="166" class="t-small t-dim">${L('벽', 'wall')}</text>
    <circle cx="230" cy="80" r="30" class="d-dim" stroke-dasharray="3 3"/>
    ${ends.map(([y, hit]) => `<line x1="40" y1="100" x2="230" y2="${y}" class="${hit ? 'd-bad' : 'd-good'}" style="stroke-width:1.2"/><circle cx="230" cy="${y}" r="2.5" class="f-accent"/>`).join('')}
    <circle cx="40" cy="100" r="7" class="f-b"/>
    <text x="40" y="124" text-anchor="middle" class="t-small">${L('청자', 'listener')}</text>
    <text x="230" y="40" text-anchor="middle" class="t-small">${L('음원 크기', 'source size')}</text>
    <text x="10" y="186" class="t-small t-dim">${L('레이 5개 중 3개 막힘: 막힌 비율만큼 dB와 LPF를 섞음', '3 of 5 rays blocked: mix dB and LPF by that share')}</text>
    <line x1="290" y1="24" x2="290" y2="140" class="d-dim"/><line x1="290" y1="140" x2="530" y2="140" class="d-dim"/>
    <text x="286" y="34" text-anchor="end" class="t-small t-mono">0dB</text><text x="286" y="134" text-anchor="end" class="t-small t-mono">-12</text>
    <text x="294" y="18" class="t-small t-dim">${L('차폐 이득', 'occlusion gain')}</text>
    <text x="530" y="170" text-anchor="end" class="t-small t-dim">${L('벽 뒤에서 문 쪽으로 이동', 'moving from behind the wall to the door')}</text>
    <path d="M290,30 L530,30" class="d-a" stroke-dasharray="6 3"/>
    <text x="300" y="44" class="t-a t-small">${L('A 차폐 없음', 'A none')}</text>
    <path d="M290,130 L410,130 L410,30 L530,30" class="d-dim"/>
    <text x="404" y="60" text-anchor="end" class="t-small t-dim">${L('단일 레이: 한 번에 튐', 'single ray: one jump')}</text>
    <path d="M290,130 L360,130 C372,130 372,110 380,110 C392,110 392,90 400,90 C412,90 412,70 420,70 C432,70 432,50 440,50 C452,50 452,30 460,30 L530,30" class="d-b"/>
    <text x="296" y="154" class="t-b t-small">${L('B 다중 레이 + 스무딩', 'B multi ray + smoothing')}</text>
    </svg>`;
  },
  look: [
    'A는 청자가 방 밖 벽 뒤에 있어도 이득과 차단 주파수가 그대로. B는 벽 뒤로 가면 아래 그래프의 선이 내려감.',
    'B의 방식을 "단일 레이"로, 스무딩을 0으로 바꾸면 문 옆을 지날 때 이득 기록에 계단이 생기고 "최근 최대 변화"가 커짐',
    '"레이 수"를 3에서 16으로 올리면 계단이 더 잘게 나뉘어 부드러워짐. 대신 검사 수가 늘어남.',
    '장면을 눌러 청자를 문 앞에 세우면 일부 레이만 막혀 반쯤 막힌 소리가 됨',
  ],
  refs: [
    { type: 'engine', title: 'Wwise - Obstruction and Occlusion', note: '게임이 레이캐스트로 값을 계산해 넘기면 볼륨과 LPF 커브에 매핑. Spatial Audio의 Rooms and Portals로 회절 처리.' },
    { type: 'engine', title: 'FMOD Studio - Occlusion (Geometry API)', note: 'Core API의 Geometry로 폴리곤을 등록하면 직접음 차폐와 잔향 차폐를 계산' },
    { type: 'engine', title: 'MDN - BiquadFilterNode', url: 'https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode', note: "type 'lowpass'와 frequency로 고음을 깎음" },
    { type: 'book', title: 'Game Audio Programming 2 (Guy Somberg 편)', year: 2019, note: '차폐, 장애물, 전파 구현 장이 있음' },
  ],
  params: [
    { key: 'mode', label: '차폐 방식', type: 'select', group: '차폐', options: [
      { value: 'none', label: '없음' },
      { value: 'single', label: '단일 레이' },
      { value: 'multi', label: '다중 레이 (평균)' },
    ], a: 'none', b: 'multi' },
    { key: 'rays', label: '레이 수', type: 'int', min: 3, max: 16, default: 7, when: (p) => p.mode === 'multi' },
    { key: 'spread', label: '음원 크기 (반지름)', type: 'range', min: 4, max: 80, step: 1, default: 30, when: (p) => p.mode === 'multi', help: '레이 끝점이 퍼지는 범위' },
    { key: 'wallDb', label: '벽 1개당 감소 (dB)', type: 'range', min: 0, max: 30, step: 1, default: 12, when: (p) => p.mode !== 'none' },
    { key: 'wallCut', label: '벽 1개 뒤 차단 주파수 (Hz)', type: 'range', min: 200, max: 8000, step: 50, default: 1200, when: (p) => p.mode !== 'none' },
    { key: 'smooth', label: '스무딩 (ms)', type: 'range', min: 0, max: 500, step: 10, default: 80, when: (p) => p.mode !== 'none' },
    { key: 'speed', label: '청자 이동 속도', type: 'range', min: 20, max: 200, step: 5, default: 70, shared: true, group: '장면' },
    { key: 'sound', label: '소리 켜기', type: 'button', buttonLabel: '소리 켜기/끄기', group: '소리' },
    { key: 'listen', label: '소리 내는 뷰', type: 'select', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], default: 'a', shared: true },
    { key: 'vol', label: '음량', type: 'range', min: 0, max: 1, step: 0.01, default: 0.35, shared: true },
  ],
  en: {
    title: 'Occlusion Raycasts',
    summary: 'If sound behind a wall plays unchanged, the sense of space breaks. Raycast between the source and the listener. Lower the volume for each wall hit and cut the highs with a lowpass. It then sounds like it comes from behind a wall. Averaging several rays keeps the value from jumping at wall corners.',
    views: { a: 'No occlusion', b: 'Multi-ray occlusion' },
    controls: 'Hold the mouse button on the scene to move the listener toward the cursor. Release it to patrol a fixed path.',
    info: `
    <p><b>Occlusion</b> is the effect of a sound getting quieter and muffled because of obstacles between the source and the listener.
    Walls block high frequencies more, so games mimic it with <b>volume reduction + a lowpass filter</b>.</p>
    <p>How it works:</p>
    <ul>
      <li>Cast a ray from the source to the listener and count the walls that block it.</li>
      <li>For each wall, lower the volume by a few dB and lower the lowpass cutoff.</li>
      <li>With a <b>single ray</b>, the value changes all at once when the ray passes a wall edge. The sound cuts with a "pop".</li>
      <li><b>Multiple rays</b>: cast several rays to points spread over the size of the source, and average them. The value changes gradually as you pass a wall corner.</li>
      <li>Smoothing the value over time removes the remaining jumps.</li>
    </ul>
    <p>Downside: raycasts alone cannot show sound that bends around a door (diffraction). So large games also use a propagation system that finds paths through rooms and portals.
    Each ray costs time, so games usually check only nearby sources, once every few frames.</p>`,
    look: [
      'In A, gain and cutoff stay the same even when the listener is behind a wall outside the room. In B, the lines in the bottom graph drop when you go behind a wall.',
      'Switch B\'s mode to "Single ray" and set smoothing to 0. Steps appear in the gain history as you pass the door, and "Recent max change" grows.',
      'Raise "Ray count" from 3 to 16. The steps split into finer ones and get smoother. But the number of checks goes up.',
      'Press on the scene to stand the listener at the door. Only some rays are blocked, so the sound is half blocked.',
    ],
    refs: [
      'The game computes values with raycasts and passes them in. They map to volume and LPF curves. Spatial Audio Rooms and Portals handle diffraction.',
      'Register polygons with Geometry in the Core API. It computes direct and reverb occlusion.',
      "Cuts high frequencies with type 'lowpass' and frequency.",
      { title: 'Game Audio Programming 2 (ed. Guy Somberg)', note: 'Has chapters on implementing occlusion, obstruction, and propagation.' },
    ],
    params: {
      mode: { label: 'Occlusion mode', group: 'Occlusion', options: { none: 'None', single: 'Single ray', multi: 'Multiple rays (average)' } },
      rays: 'Ray count',
      spread: { label: 'Source size (radius)', help: 'How far ray end points spread' },
      wallDb: 'Loss per wall (dB)',
      wallCut: 'Cutoff behind one wall (Hz)',
      smooth: 'Smoothing (ms)',
      speed: { label: 'Listener speed', group: 'Scene' },
      sound: { label: 'Sound on', buttonLabel: 'Sound on/off', group: 'Sound' },
      listen: 'View that plays sound',
      vol: 'Volume',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params, v2 = U.v2;
    const col = ctx.side === 'a' ? C.a : C.b;
    const WW = 640, WH = 400, FMAX = 20000, HIST = 240, SAMPLE = 1 / 30;
    const WALLS = [
      [360, 60, 600, 60], [600, 60, 600, 320], [360, 320, 600, 320],
      [360, 60, 360, 160], [360, 220, 360, 320],     // 왼쪽 벽 (문 160~220)
      [220, 150, 220, 360],                          // 바깥 기둥 벽
      [470, 230, 540, 230],                          // 방 안 칸막이
    ].map(([x1, y1, x2, y2]) => ({ a: v2(x1, y1), b: v2(x2, y2) }));
    const SRC = v2(500, 140);
    const PATH = [v2(80, 80), v2(300, 80), v2(300, 190), v2(420, 190), v2(420, 280), v2(560, 280), v2(430, 270), v2(430, 200), v2(300, 200), v2(300, 370), v2(80, 370)];

    // 선분 교차 (p→q 레이가 벽 w를 지나는지)
    function crosses(p, q, w) {
      const r = v2.sub(q, p), s = v2.sub(w.b, w.a);
      const den = v2.cross(r, s);
      if (Math.abs(den) < 1e-9) return false;
      const ap = v2.sub(w.a, p);
      const t = v2.cross(ap, s) / den, u = v2.cross(ap, r) / den;
      return t > 0 && t < 1 && u >= 0 && u <= 1;
    }
    const countHits = (p, q) => { let n = 0; for (const w of WALLS) if (crosses(p, q, w)) n++; return n; };

    let L, seg, segT, rays, gainDb, cutLog, hist, sampleAcc, maxStep, rayChecks, targetDb, targetCut;
    function init() {
      L = v2(PATH[0].x, PATH[0].y); seg = 0; rays = []; gainDb = 0; cutLog = Math.log(FMAX);
      hist = []; sampleAcc = 0; maxStep = 0; rayChecks = 0; targetDb = 0; targetCut = FMAX;
    }
    init();

    function evaluate() {
      rays = [];
      if (P.mode === 'none') { targetDb = 0; targetCut = FMAX; rayChecks = 0; return; }
      const pts = [];
      if (P.mode === 'single') pts.push(SRC);
      else {
        // 청자에서 본 음원의 수직 방향으로 끝점을 퍼뜨림
        const dir = v2.norm(v2.sub(SRC, L)), side = v2.perp(dir), n = P.rays;
        for (let i = 0; i < n; i++) pts.push(v2.add(SRC, v2.scale(side, (i / (n - 1) * 2 - 1) * P.spread)));
      }
      let gSum = 0, cSum = 0;
      for (const p of pts) {
        const hits = countHits(L, p);
        rays.push({ p, hits });
        gSum += Math.pow(10, (-P.wallDb * hits) / 20);
        cSum += Math.log(FMAX) + hits * (Math.log(P.wallCut) - Math.log(FMAX));
      }
      rayChecks = pts.length * WALLS.length;
      targetDb = 20 * Math.log10(Math.max(1e-6, gSum / pts.length));
      targetCut = Math.exp(Math.max(Math.log(60), cSum / pts.length));
    }

    // ── 오디오: "소리 켜기" 버튼을 눌러야 생성 ──
    let ac = null, master = null, lp = null, amp = null;
    function soundToggle() {
      if (ac) { stopAudio(); return; }
      if (typeof AudioContext === 'undefined') return;
      ac = new AudioContext();
      master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
      amp = ac.createGain(); amp.gain.value = 0;
      lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = FMAX; lp.Q.value = 0.707;
      lp.connect(amp); amp.connect(master);
      // 고음이 많은 음원: 코드로 만든 노이즈 + 톱니파 화음
      const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0), r = U.rng(ctx.seed + 9);
      for (let i = 0; i < d.length; i++) d[i] = (r.next() * 2 - 1) * 0.25;
      const nsrc = ac.createBufferSource(); nsrc.buffer = buf; nsrc.loop = true; nsrc.connect(lp); nsrc.start();
      for (const f of [196, 293.66, 392]) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sawtooth'; o.frequency.value = f; g.gain.value = 0.12;
        o.connect(g); g.connect(lp); o.start();
      }
      if (ac.resume) ac.resume();
    }
    function stopAudio() {
      if (!ac) return;
      try { ac.close(); } catch (e) { /* 이미 닫힘 */ }
      ac = null; master = null; lp = null; amp = null;
    }
    const audible = () => !!ac && P.listen === ctx.side;
    const distGain = () => { const d = v2.dist(L, SRC); return 80 / (80 + Math.max(0, d - 80)); };

    function layout() {
      const W = ctx.width, H = ctx.height, mapH = H * 0.68;
      const sc = Math.min(W / WW, mapH / WH);
      return { W, H, mapH, sc, ox: (W - WW * sc) / 2, oy: 0 };
    }

    return {
      update(dt) {
        const m = ctx.input.mouse, Ly = layout();
        if (m.down && m.inside && m.y < Ly.mapH) {
          const tgt = v2((m.x - Ly.ox) / Ly.sc, (m.y - Ly.oy) / Ly.sc);
          const d = v2.sub(tgt, L), len = v2.len(d), stp = P.speed * 2 * dt;
          if (len > 1) L = v2.add(L, v2.scale(d, Math.min(1, stp / len)));
        } else {
          let move = P.speed * dt;
          while (move > 0) {
            const tgt = PATH[(seg + 1) % PATH.length], d = v2.sub(tgt, L), len = v2.len(d);
            if (len <= move) { L = v2(tgt.x, tgt.y); move -= len; seg = (seg + 1) % PATH.length; }
            else { L = v2.add(L, v2.scale(d, move / len)); move = 0; }
          }
        }
        L.x = U.clamp(L.x, 5, WW - 5); L.y = U.clamp(L.y, 5, WH - 5);
        evaluate();
        const prevDb = gainDb;
        if (P.mode === 'none' || P.smooth <= 0) { gainDb = targetDb; cutLog = Math.log(targetCut); }
        else {
          const k = 1 - Math.exp(-dt / (P.smooth / 1000));
          gainDb += (targetDb - gainDb) * k; cutLog += (Math.log(targetCut) - cutLog) * k;
        }
        maxStep = Math.max(maxStep * Math.exp(-dt * 0.3), Math.abs(gainDb - prevDb));
        sampleAcc += dt;
        while (sampleAcc >= SAMPLE) { sampleAcc -= SAMPLE; hist.push({ g: gainDb, c: cutLog }); if (hist.length > HIST) hist.shift(); }
        if (ac) {
          const now = ac.currentTime;
          master.gain.setTargetAtTime(audible() ? P.vol : 0, now, 0.03);
          amp.gain.setTargetAtTime(distGain() * Math.pow(10, gainDb / 20), now, 0.01);
          lp.frequency.setTargetAtTime(Math.exp(cutLog), now, 0.01);
        }
      },
      render() {
        const g = ctx.g, Ly = layout(), { W, H, mapH, sc, ox, oy } = Ly;
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        D.rect(g, 0, 0, WW, WH, '#181b21');
        D.rect(g, 360, 60, 240, 260, 'rgba(255,255,255,0.03)');
        for (const r of rays) D.line(g, L.x, L.y, r.p.x, r.p.y, r.hits ? 'rgba(255,83,112,0.6)' : 'rgba(102,209,122,0.6)', 1.5 / sc);
        if (P.mode === 'none') D.line(g, L.x, L.y, SRC.x, SRC.y, 'rgba(255,255,255,0.2)', 1 / sc);
        for (const w of WALLS) D.line(g, w.a.x, w.a.y, w.b.x, w.b.y, '#9aa3b2', 6);
        if (P.mode === 'multi') D.circle(g, SRC.x, SRC.y, P.spread, null, 'rgba(255,203,107,0.4)', 1 / sc);
        D.circle(g, SRC.x, SRC.y, 10, C.warn, '#fff', 2);
        D.text(g, GTL.L('음원', 'Source'), SRC.x + 14, SRC.y - 6, { size: 13, color: C.warn });
        D.circle(g, L.x, L.y, 9, col, '#fff', 2);
        g.restore();
        // ── 아래: 이득, 차단 주파수 기록 + 필터 응답 ──
        const py = mapH + 8, ph = Math.max(40, H - py - 8), pw1 = (W - 30) * 0.6, pw2 = (W - 30) - pw1;
        D.plot(g, hist.map((h) => h.g), 10, py, pw1, ph / 2 - 3, { min: -40, max: 0, color: col, label: GTL.L('차폐 이득 (0~-40dB, 8초)', 'Occlusion gain (0~-40dB, 8 s)') });
        D.plot(g, hist.map((h) => h.c), 10, py + ph / 2 + 3, pw1, ph / 2 - 3, { min: Math.log(100), max: Math.log(FMAX), color: C.warn, label: GTL.L('차단 주파수 (로그, 100Hz~20kHz)', 'Cutoff (log, 100Hz~20kHz)') });
        // 2차 버터워스 로우패스 크기 응답 근사
        const fx = 20 + pw1, fc = Math.exp(cutLog);
        D.rect(g, fx, py, pw2, ph, 'rgba(0,0,0,0.35)');
        g.beginPath();
        for (let i = 0; i <= 60; i++) {
          const f = 20 * Math.pow(1000, i / 60), mag = 1 / Math.sqrt(1 + Math.pow(f / fc, 4));
          const db = Math.max(-48, 20 * Math.log10(mag) + gainDb);
          const x = fx + (i / 60) * pw2, y = py + 12 + (-db / 48) * (ph - 14);
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.strokeStyle = col; g.lineWidth = 2; g.stroke();
        D.text(g, GTL.L('주파수 응답 (20Hz~20kHz)', 'Frequency response (20Hz~20kHz)'), fx + 4, py + 2, { size: 10, color: C.dim });

        const blocked = rays.filter((r) => r.hits > 0).length;
        ctx.stat(GTL.L('막힌 레이', 'Blocked rays'), rays.length ? `${blocked} / ${rays.length}` : '-');
        ctx.stat(GTL.L('차폐 이득', 'Occlusion gain'), gainDb.toFixed(1) + ' dB');
        ctx.stat(GTL.L('차단 주파수', 'Cutoff'), Math.exp(cutLog).toFixed(0) + ' Hz');
        ctx.stat(GTL.L('최근 최대 변화 (프레임당)', 'Recent max change (per frame)'), maxStep.toFixed(2) + ' dB');
        ctx.stat(GTL.L('선분 검사 수', 'Segment checks'), rayChecks);
        ctx.stat(GTL.L('소리', 'Sound'), typeof AudioContext === 'undefined' ? GTL.L('미지원', 'Not supported') : !ac ? GTL.L('꺼짐', 'Off') : audible() ? GTL.L('재생 중', 'Playing') : GTL.L('음소거 (다른 뷰 선택)', 'Muted (other view selected)'));
      },
      onAction(key) { if (key === 'sound') soundToggle(); },
      dispose() { stopAudio(); },
    };
  },
});
