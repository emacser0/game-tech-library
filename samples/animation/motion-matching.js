// 모션 매칭(Motion Matching) 단순화: 상태 머신 + 크로스페이드 vs 포즈 데이터베이스에서 궤적 특징으로 프레임 검색
GTL.register({
  id: 'motion-matching',
  title: '모션 매칭 vs 상태 머신 블렌딩',
  summary: '상태 머신은 대기, 걷기, 달리기 클립 3개를 속도 기준으로 바꾸고 코드로 이동시켜, 중간 속도와 가감속에서 발이 미끄러짐. 모션 매칭은 긴 동작 기록(데이터베이스)에서 지금 포즈와 앞으로의 궤적에 가장 맞는 프레임을 찾아 재생해 발이 땅에 붙음.',
  views: { a: '상태 머신 + 크로스페이드', b: '모션 매칭' },
  controls: '→ 누르는 동안 달리기, ↑ 걷기, ← 멈춤 (두 뷰 공통). 누르지 않으면 목표 속도가 자동으로 바뀜.',
  info: `
    <p><b>상태 머신 방식</b>: 상태마다 클립을 정하고 조건(속도 임계값)에 따라 전환하며 크로스페이드. 이동은 코드가 처리.
    클립 속도와 실제 이동 속도가 다르면 발이 미끄러짐. 상태와 전환이 늘수록 그래프 관리가 어려워짐.</p>
    <p><b>모션 매칭</b>(Simon Clavet, Ubisoft, GDC 2016): 긴 동작 캡처 전체를 프레임 단위 데이터베이스로 씀. 일정 간격으로 아래 특징을 모아 질의(query)를 만듦.</p>
    <ul>
      <li>현재 포즈: 엉덩이 기준 두 발의 위치와 속도, 엉덩이 속도</li>
      <li>원하는 궤적: 입력으로 예측한 0.2, 0.4, 0.6초 뒤 위치</li>
    </ul>
    <p>모든 프레임의 같은 특징과 비교해 가중 거리(특징별 표준편차로 정규화)가 가장 작은 프레임으로 점프. 점프할 때 포즈 차이는 0.15초 동안 감쇠시킴(관성화, inertialization의 단순형). 이동은 데이터베이스의 루트 모션을 씀.</p>
    <p>여기서 데이터베이스는 절차적 보행으로 만든 45초 분량 기록. 실제 게임은 수 분 분량의 캡처를 쓰고, KD 트리나 구간 경계 상자(AABB)로 검색을 가속.</p>
    <p>단점: 데이터에 없는 동작은 나오지 않음. 특징 가중치 튜닝이 어렵고, 메모리와 검색 비용이 큼. 원하는 궤적과 실제 이동이 어긋나 반응이 늦을 수 있음.</p>`,
  // 도식: A는 속도 임계값으로 고정 속도 클립 3개를 바꾸고 코드로 이동. B는 질의(포즈 7개 + 궤적 3개 특징)와 가장 가까운 데이터베이스 프레임으로 점프
  diagram: (L) => {
    const node = (x, label) => `<rect x="${x}" y="38" width="58" height="28" rx="5" class="f-dim"/><text x="${x + 29}" y="56" text-anchor="middle" class="t-small">${label}</text>`;
    const q = Array.from({ length: 10 }, (_, i) => `<rect x="${270 + i * 18}" y="38" width="16" height="14" class="${i < 7 ? 'f-dim' : 'f-b'}"/>`).join('');
    const db = Array.from({ length: 26 }, (_, i) => `<rect x="${270 + i * 10}" y="102" width="9" height="16" class="${i === 23 ? 'f-b' : 'f-dim'}"/>`).join('');
    return `<svg viewBox="0 0 540 214" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arrA" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    <marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="12" y="18" class="t-a">${L('A: 상태 머신', 'A: state machine')}</text>
    ${node(12, L('대기 0', 'Idle 0'))}${node(98, L('걷기 90', 'Walk 90'))}${node(184, L('달리기 240', 'Run 240'))}
    <line x1="72" y1="48" x2="96" y2="48" class="d-dim" marker-end="url(#arrA)"/><line x1="96" y1="56" x2="72" y2="56" class="d-dim" marker-end="url(#arrA)"/>
    <line x1="158" y1="48" x2="182" y2="48" class="d-dim" marker-end="url(#arrA)"/><line x1="182" y1="56" x2="158" y2="56" class="d-dim" marker-end="url(#arrA)"/>
    <text x="84" y="34" text-anchor="middle" class="t-small t-mono">v 30</text>
    <text x="170" y="34" text-anchor="middle" class="t-small t-mono">v 165</text>
    <text x="12" y="86" class="t-small t-dim">${L('클립 속도는 고정 (px/s)', 'Clip speeds are fixed (px/s)')}</text>
    <text x="12" y="100" class="t-small t-dim">${L('이동은 코드가 처리', 'Code moves the body')}</text>
    <text x="12" y="128" class="t-small">${L('목표 속도 150일 때', 'At a target speed of 150')}</text>
    <rect x="12" y="136" width="120" height="10" class="f-a"/><text x="138" y="145" class="t-small">${L('이동 150', 'move 150')}</text>
    <rect x="12" y="152" width="72" height="10" class="f-dim"/><text x="138" y="161" class="t-small">${L('걷기 클립 90', 'walk clip 90')}</text>
    <line x1="86" y1="157" x2="132" y2="157" class="d-bad" stroke-dasharray="3 2"/>
    <text x="12" y="186" class="t-small t-dim">${L('차이만큼 디딘 발이 미끄러짐', 'The gap slides the planted foot')}</text>
    <line x1="258" y1="8" x2="258" y2="206" class="d-dim"/>
    <text x="270" y="18" class="t-b">${L('B: 모션 매칭', 'B: motion matching')}</text>
    <text x="456" y="49" class="t-small t-dim">${L('질의', 'query')}</text>
    ${q}
    <text x="332" y="64" text-anchor="middle" class="t-small t-dim">${L('포즈 7', 'pose 7')}</text>
    <text x="423" y="64" text-anchor="middle" class="t-small t-b">${L('궤적 3', 'path 3')}</text>
    <text x="270" y="96" class="t-small t-dim">${L('데이터베이스: 프레임마다 같은 10개 특징', 'Database: the same 10 features per frame')}</text>
    ${db}
    <path d="M440,68 L503,100" class="d-b" marker-end="url(#arrB)"/>
    <text x="452" y="84" text-anchor="end" class="t-small">${L('가중 거리 최소', 'min weighted distance')}</text>
    <line x1="335" y1="98" x2="335" y2="122" class="d-line"/>
    <text x="331" y="133" text-anchor="end" class="t-small t-dim">${L('재생 중', 'playing')}</text>
    <path d="M340,122 Q420,156 503,122" class="d-b" marker-end="url(#arrB)"/>
    <text x="420" y="160" text-anchor="middle" class="t-small">${L('점프 + 0.15초 감쇠', 'jump + 0.15 s fade')}</text>
    <text x="270" y="178" class="t-mono t-small">cost = Σ w (f − q)² / σ²</text>
    <text x="270" y="196" class="t-small t-dim">${L('이동은 데이터베이스의 루트 모션', 'Movement uses the database root motion')}</text>
  </svg>`;
  },
  look: [
    'A의 노란 디딤 발 표시를 보면 가속과 감속 중, 그리고 목표 속도가 150px/s일 때 발이 미끄러짐. B는 디딘 자리에 머묾.',
    '"발 미끄러짐" 값을 비교하면 A는 수십 px/s, B는 몇 px/s (대부분 점프 직후 감쇠 구간에서 생김)',
    '위쪽 데이터베이스 막대를 보면 B의 재생 위치(흰 선)가 목표 속도가 바뀔 때마다 비슷한 속도 구간으로 점프',
    'B의 "궤적 가중치"를 0으로 내리면 포즈만 이어 가며 입력을 무시. 3으로 올리면 반응은 빠르지만 점프가 잦아짐.',
    'A의 "재생 속도 맞춤"을 켜면 미끄러짐이 줄지만 걸음 박자가 어색하게 빨라지거나 느려짐',
  ],
  refs: [
    { type: 'talk', title: 'Motion Matching and The Road to Next-Gen Animation (Simon Clavet)', year: 2016, note: 'GDC 2016, Ubisoft Montreal. For Honor의 모션 매칭.' },
    { type: 'paper', title: 'Learned Motion Matching (Daniel Holden, Oussama Kanoun, Maksym Perepichka, Tiberiu Popa)', year: 2020, note: 'ACM SIGGRAPH 2020 (ACM TOG). 모션 매칭의 특징, 검색, 관성화 설명과 메모리 절감.' },
    { type: 'engine', title: 'Unreal Engine 5 - Motion Matching (Pose Search plugin)', note: 'Pose Search Database, Schema(특징 채널), Chooser' },
    { type: 'talk', title: 'Inertialization: High-Performance Animation Transitions in Gears of War (David Bollo)', year: 2018, note: 'GDC 2018. 점프 전환의 포즈 차이를 감쇠.' },
  ],
  params: [
    { key: 'method', label: '애니메이션 방식', type: 'select', group: '방식', options: [
      { value: 'fsm', label: '상태 머신 + 크로스페이드' },
      { value: 'mm', label: '모션 매칭' },
    ], a: 'fsm', b: 'mm' },
    { key: 'rateMatch', label: '재생 속도 맞춤', type: 'bool', default: false, when: (p) => p.method === 'fsm', help: '클립 재생 속도를 이동 속도 / 클립 속도로 바꿈' },
    { key: 'xfade', label: '크로스페이드 시간 (초)', type: 'range', min: 0.05, max: 0.6, step: 0.01, default: 0.25, when: (p) => p.method === 'fsm' },
    { key: 'interval', label: '검색 간격 (초)', type: 'range', min: 0.02, max: 0.5, step: 0.01, default: 0.1, when: (p) => p.method === 'mm' },
    { key: 'trajW', label: '궤적 가중치', type: 'range', min: 0, max: 3, step: 0.05, default: 1.5, when: (p) => p.method === 'mm' },
    { key: 'inertial', label: '점프 감쇠 시간 (초)', type: 'range', min: 0, max: 0.4, step: 0.01, default: 0.15, when: (p) => p.method === 'mm' },
    { key: 'dbSec', label: '데이터베이스 길이 (초)', type: 'int', min: 10, max: 120, default: 45, shared: true, reset: true, group: '장면' },
  ],
  en: {
    title: 'Motion Matching vs State Machine Blending',
    summary: 'A state machine switches between three clips (idle, walk, run) by speed and moves the character in code, so the feet slide at in-between speeds and while speeding up or slowing down. Motion matching searches a long motion recording (the database) for the frame that best fits the current pose and the coming path, then plays it, so the feet stay on the ground.',
    views: { a: 'State machine + crossfade', b: 'Motion matching' },
    controls: 'Hold → to run, ↑ to walk, ← to stop (in both views). If you press nothing, the target speed changes on its own.',
    info: `
    <p><b>State machine</b>: each state has a clip. It switches states by conditions (speed thresholds) and crossfades. Code handles the movement.
    If the clip speed differs from the real movement speed, the feet slide. The more states and transitions you add, the harder the graph is to manage.</p>
    <p><b>Motion matching</b> (Simon Clavet, Ubisoft, GDC 2016): uses a whole long motion capture as a database of frames. At a fixed interval, it builds a query from these features.</p>
    <ul>
      <li>Current pose: the position and speed of both feet relative to the hips, and the hip speed</li>
      <li>Desired path: the positions 0.2, 0.4, and 0.6 seconds ahead, predicted from input</li>
    </ul>
    <p>It compares these with the same features of every frame and jumps to the frame with the smallest weighted distance (normalized by each feature's standard deviation). On a jump, the pose difference fades out over 0.15 seconds (a simple form of inertialization). Movement uses the database's root motion.</p>
    <p>Here the database is a 45 second recording made with procedural walking. Real games use minutes of capture and speed up the search with a KD tree or segment bounding boxes (AABB).</p>
    <p>Downside: motions that are not in the data never appear. Feature weights are hard to tune, and memory and search cost are high. The desired path and the real movement can drift apart, which can make the response slow.</p>`,
    look: [
      'Look at A\'s yellow planted foot markers. The feet slide while speeding up and slowing down, and when the target speed is 150px/s. In B, they stay where they land.',
      'Compare the "Foot slide" values. A shows tens of px/s, B only a few (mostly in the fade right after a jump).',
      'Look at the database bar at the top. Each time the target speed changes, B\'s playback position (white line) jumps to a section with a similar speed.',
      'Lower B\'s "Trajectory weight" to 0. It only keeps the pose going and ignores input. Raise it to 3. It responds faster, but it jumps more often.',
      'Turn on A\'s "Match playback rate". Sliding drops, but the step rhythm gets oddly fast or slow.',
    ],
    refs: [
      'GDC 2016, Ubisoft Montreal. Motion matching in For Honor.',
      'ACM SIGGRAPH 2020 (ACM TOG). Explains the features, search, and inertialization of motion matching, and how to cut memory.',
      'Pose Search Database, Schema (feature channels), Chooser.',
      'GDC 2018. Fades out the pose difference on jump transitions.',
    ],
    params: {
      method: { label: 'Animation method', group: 'Method', options: { fsm: 'State machine + crossfade', mm: 'Motion matching' } },
      rateMatch: { label: 'Match playback rate', help: 'Sets the clip playback rate to move speed / clip speed' },
      xfade: 'Crossfade time (s)',
      interval: 'Search interval (s)',
      trajW: 'Trajectory weight',
      inertial: 'Jump fade time (s)',
      dbSec: { label: 'Database length (s)', group: 'Scene' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const DT = 1 / 60, OMEGA = 5, FUT = [12, 24, 36], NF = 10, HIP = 80, UL = 50, LL = 50;
    const freqOf = (v) => (v < 3 ? 0 : 0.9 + v / 200);                       // 걸음 주기 (회/초)
    const swingOf = (v) => U.lerp(0.38, 0.55, U.clamp((v - 90) / 150, 0, 1));  // 한 주기 중 발이 뜬 비율
    const liftOf = (v) => U.lerp(12, 28, U.clamp(v / 240, 0, 1));
    function springStep(s, vt) { s.a += (OMEGA * OMEGA * (vt - s.v) - 2 * OMEGA * s.a) * DT; s.v += s.a * DT; }

    // ── 1. 데이터베이스 만들기: 절차적 보행을 "캡처"함. 디딘 발은 월드에 고정됨 ──
    const N = P.dbSec * 60, M = N + 40;
    const rr = U.rng(9001), SPEEDS = [0, 0, 60, 90, 120, 150, 190, 240];
    const hip = new Float32Array(M), vel = new Float32Array(M), feet = new Float32Array(M * 4);
    {
      const s = { v: 0, a: 0 }; let vt = 0, timer = 0, hx = 0, phi = 0;
      const ft = [{ x: -8, y: 0, sw: false, from: 0 }, { x: 8, y: 0, sw: false, from: 0 }];
      for (let f = 0; f < M; f++) {
        timer -= DT; if (timer <= 0) { vt = rr.pick(SPEEDS); timer = rr.range(0.7, 2.4); }
        springStep(s, vt); const v = Math.max(0, s.v);
        hx += v * DT;
        const fr = freqOf(v), sf = swingOf(v);
        const rate = fr > 0 ? fr : (ft.some((o) => o.sw) ? 1.4 : 0);
        phi += rate * DT;
        ft.forEach((o, i) => {
          const q = (phi + 0.5 * i) % 1, inSwing = rate > 0 && q < sf;
          if (inSwing && !o.sw) { o.sw = true; o.from = o.x; }
          if (o.sw && !inSwing) { o.sw = false; o.y = 0; }
          if (o.sw) {
            const u = q / sf, remain = (sf - q) / Math.max(rate, 0.5), stance = (1 - sf) / Math.max(fr, 0.9);
            const land = hx + v * remain + (v * stance) / 2;
            o.x = U.lerp(o.from, land, U.smoothstep(0, 1, u)); o.y = -Math.sin(Math.PI * u) * liftOf(v);
          }
        });
        hip[f] = hx; vel[f] = v;
        feet[f * 4] = ft[0].x - hx; feet[f * 4 + 1] = ft[0].y; feet[f * 4 + 2] = ft[1].x - hx; feet[f * 4 + 3] = ft[1].y;
      }
    }
    // 특징: 발 위치 4, 발 x 속도 2, 엉덩이 속도 1, 미래 이동량 3
    const F = new Float32Array(N * NF);
    const featOf = (f, out) => {
      for (let k = 0; k < 4; k++) out[k] = feet[f * 4 + k];
      out[4] = (feet[(f + 1) * 4] - feet[f * 4]) * 60; out[5] = (feet[(f + 1) * 4 + 2] - feet[f * 4 + 2]) * 60;
      out[6] = vel[f];
      for (let k = 0; k < 3; k++) out[7 + k] = hip[f + FUT[k]] - hip[f];
    };
    const tmp = new Float32Array(NF), mean = new Float32Array(NF), std = new Float32Array(NF);
    for (let f = 0; f < N; f++) { featOf(f, tmp); for (let k = 0; k < NF; k++) { F[f * NF + k] = tmp[k]; mean[k] += tmp[k] / N; } }
    for (let f = 0; f < N; f++) for (let k = 0; k < NF; k++) std[k] += (F[f * NF + k] - mean[k]) ** 2 / N;
    for (let k = 0; k < NF; k++) std[k] = Math.sqrt(std[k]) || 1;
    for (let f = 0; f < N; f++) for (let k = 0; k < NF; k++) F[f * NF + k] = (F[f * NF + k] - mean[k]) / std[k];
    const LAST = N - 1;

    // ── 2. 상태 머신용 클립: 고정 속도의 제자리 보행 ──
    const CLIPS = { idle: 0, walk: 90, run: 240 };
    function clipFeet(speed, ph) {
      if (speed === 0) return [-8, 0, 8, 0];
      const fr = freqOf(speed), sf = swingOf(speed), S = (speed / fr) * (1 - sf), out = [];
      for (let i = 0; i < 2; i++) {
        const q = (ph + 0.5 * i) % 1;
        if (q < sf) { const u = q / sf; out.push(U.lerp(-S / 2, S / 2, U.smoothstep(0, 1, u)), -Math.sin(Math.PI * u) * liftOf(speed)); }
        else out.push(U.lerp(S / 2, -S / 2, (q - sf) / (1 - sf)), 0);
      }
      return out;
    }

    // ── 3. 실행 상태 ──
    const ctrl = { v: 0, a: 0 }; let vt = 0, autoTimer = 0, charX = 0;
    let idx = 0, frameAcc = 0, searchT = 0, offs = [0, 0, 0, 0], offT = 1, jumps = 0, searchMs = 0, jumpMarks = [];
    let st = 'idle', ph = 0, fade = null, pose = [-8, 0, 8, 0], prevWorld = null, slideAcc = 0, slideTime = 0;
    const desiredHist = [], actualHist = [];
    const q = new Float32Array(NF);
    let futureCtrl = [0, 0, 0];

    function predict() {
      const s = { v: ctrl.v, a: ctrl.a }; const out = []; let x = 0;
      for (let i = 1; i <= FUT[2]; i++) { springStep(s, vt); x += s.v * DT; if (FUT.includes(i)) out.push(x); }
      return out;
    }
    function search() {
      const t0 = ctx.now();
      featOf(idx, tmp);
      for (let k = 0; k < 7; k++) q[k] = (tmp[k] - mean[k]) / std[k];
      for (let k = 0; k < 3; k++) q[7 + k] = (futureCtrl[k] - mean[7 + k]) / std[7 + k];
      const tw = P.trajW * P.trajW;
      let best = -1, bc = Infinity;
      for (let f = 0; f < N - 30; f++) {
        let c = 0; const o = f * NF;
        for (let k = 0; k < 7; k++) { const d = F[o + k] - q[k]; c += d * d; }
        for (let k = 7; k < 10; k++) { const d = F[o + k] - q[k]; c += tw * d * d; }
        if (c < bc) { bc = c; best = f; }
      }
      searchMs = ctx.now() - t0;
      if (best >= 0 && Math.abs(best - idx) > 3) {
        const cur = currentMM();
        for (let k = 0; k < 4; k++) offs[k] = cur[k] - feet[best * 4 + k];
        offT = 0; idx = best; jumps++; jumpMarks.push({ f: best, t: ctx.time });
      }
    }
    function currentMM() {
      const k = P.inertial > 0 ? 1 - U.smoothstep(0, 1, offT / P.inertial) : 0;
      return [0, 1, 2, 3].map((i) => feet[idx * 4 + i] + offs[i] * k);
    }

    return {
      update(dt) {
        // 입력과 목표 속도
        const I = ctx.input;
        autoTimer -= dt;
        if (I.key('ArrowRight')) vt = 240; else if (I.key('ArrowUp')) vt = 90; else if (I.key('ArrowLeft')) vt = 0;
        else if (autoTimer <= 0) { vt = [0, 90, 150, 240][Math.floor(ctx.random() * 4)]; autoTimer = 1.2 + ctx.random() * 1.6; }
        const steps = Math.max(1, Math.round(dt / DT));
        for (let s = 0; s < steps; s++) springStep(ctrl, vt);
        ctrl.v = Math.max(0, ctrl.v);
        futureCtrl = predict();
        let move = 0;
        if (P.method === 'mm') {
          frameAcc += dt * 60;
          while (frameAcc >= 1) {
            frameAcc -= 1;
            if (idx >= LAST) { searchT = 0; search(); if (idx >= LAST) idx = 0; }
            move += hip[idx + 1] - hip[idx]; idx++;
          }
          offT += dt;
          searchT -= dt;
          if (searchT <= 0) { searchT = P.interval; search(); }
          pose = currentMM();
        } else {
          const target = ctrl.v < 30 ? 'idle' : ctrl.v < 165 ? 'walk' : 'run';
          if (target !== st) { fade = { from: st, t: 0 }; st = target; }
          const cs = CLIPS[st] || CLIPS.walk;
          const rate = P.rateMatch && CLIPS[st] > 0 ? ctrl.v / CLIPS[st] : 1;
          ph = (ph + freqOf(cs) * rate * dt) % 1;
          let p = clipFeet(CLIPS[st], ph);
          if (fade) {
            fade.t += dt / P.xfade;
            if (fade.t >= 1) fade = null;
            else { const o = clipFeet(CLIPS[fade.from], ph), w = U.smoothstep(0, 1, fade.t); p = p.map((x, i) => U.lerp(o[i], x, w)); }
          }
          pose = p; move = ctrl.v * dt;
        }
        charX += move;
        // 디딘 발 미끄러짐 (월드 x 변화)
        const world = [charX + pose[0], pose[1], charX + pose[2], pose[3]];
        if (prevWorld) for (let i = 0; i < 2; i++) if (world[i * 2 + 1] > -0.5 && prevWorld[i * 2 + 1] > -0.5) slideAcc += Math.abs(world[i * 2] - prevWorld[i * 2]);
        prevWorld = world; slideTime += dt;
        if (slideTime > 4) { slideAcc *= 0.5; slideTime *= 0.5; }
        desiredHist.push(ctrl.v); actualHist.push(dt > 0 ? move / dt : 0);
        if (desiredHist.length > 300) { desiredHist.shift(); actualHist.shift(); }
        while (jumpMarks.length && ctx.time - jumpMarks[0].t > 3) jumpMarks.shift();
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height, col = ctx.side === 'a' ? C.a : C.b;
        const gy = H - 120, cx = W * 0.35, cam = charX - cx;
        // 데이터베이스 막대 (색은 속도)
        if (P.method === 'mm') {
          const bw = W - 24, cols = Math.min(bw, 300);
          for (let i = 0; i < cols; i++) {
            const f = Math.floor((i / cols) * N);
            D.rect(g, 12 + (i / cols) * bw, 10, bw / cols + 0.5, 10, U.hsl(200 - vel[f] * 0.75, 60, 25 + vel[f] / 8));
          }
          for (const m of jumpMarks) D.line(g, 12 + (m.f / N) * bw, 6, 12 + (m.f / N) * bw, 24, 'rgba(255,203,107,0.6)', 1);
          D.line(g, 12 + (idx / N) * bw, 4, 12 + (idx / N) * bw, 26, '#fff', 2);
          D.text(g, GTL.L(`데이터베이스 ${N} 프레임 (색: 속도, 노란 선: 최근 점프)`, `Database ${N} frames (color: speed, yellow lines: recent jumps)`), 12, 28, { size: 10, color: C.dim });
        } else {
          D.text(g, GTL.L(`상태: ${st}${fade ? ' (크로스페이드)' : ''}`, `State: ${st}${fade ? ' (crossfade)' : ''}`), 12, 10, { size: 12, color: C.text });
        }
        D.line(g, 0, gy, W, gy, C.dim, 2);
        for (let x = -(((cam % 40) + 40) % 40); x < W; x += 40) D.line(g, x, gy + 2, x - 10, gy + 12, 'rgba(255,255,255,0.15)', 1);
        // 원하는 궤적 (채운 점) vs 데이터베이스 프레임의 궤적 (빈 원)
        futureCtrl.forEach((d) => D.circle(g, cx + d, gy + 22, 5, C.warn));
        if (P.method === 'mm') FUT.forEach((k) => D.circle(g, cx + hip[Math.min(M - 1, idx + k)] - hip[idx], gy + 22, 8, null, col, 2));
        // 인물
        const v = actualHist.length ? actualHist[actualHist.length - 1] : 0;
        const bob = Math.min(Math.abs(pose[1]), Math.abs(pose[3])) * 0.15;
        const hp = { x: cx, y: gy - HIP + v * 0.03 + bob };
        const ik = (f) => {
          const dx = f.x - hp.x, dy = f.y - hp.y, d = Math.min(Math.hypot(dx, dy), UL + LL - 0.01);
          const a = Math.atan2(dy, dx), c = Math.acos(U.clamp((UL * UL + d * d - LL * LL) / (2 * UL * d), -1, 1));
          return { x: hp.x + Math.cos(a - c) * UL, y: hp.y + Math.sin(a - c) * UL };
        };
        for (const i of [1, 0]) {
          const f = { x: cx + pose[i * 2], y: gy + pose[i * 2 + 1] }, k = ik(f), c = i ? 'rgba(255,255,255,0.35)' : col;
          D.line(g, hp.x, hp.y, k.x, k.y, c, 5); D.line(g, k.x, k.y, f.x, f.y, c, 5);
          if (pose[i * 2 + 1] > -0.5) D.circle(g, f.x, f.y, 5, C.warn);
        }
        const lean = U.clamp(v / 240, 0, 1) * 0.3, neck = { x: hp.x + Math.sin(lean) * 62, y: hp.y - Math.cos(lean) * 62 };
        D.line(g, hp.x, hp.y, neck.x, neck.y, col, 6);
        const sw = (pose[2] - pose[0]) * 0.012;
        D.line(g, neck.x, neck.y + 4, neck.x + Math.sin(sw) * 34, neck.y + 4 + Math.cos(sw) * 34, col, 4);
        D.circle(g, neck.x + 3, neck.y - 16, 13, '#20242c', col, 3);
        D.plot(g, desiredHist, 12, H - 80, W - 24, 64, { min: 0, max: 300, color: 'rgba(255,203,107,0.7)', label: GTL.L('이동 속도: 노랑 목표, 색 실제 (px/s)', 'Move speed: yellow is target, color is actual (px/s)') });
        D.plot(g, actualHist, 12, H - 80, W - 24, 64, { min: 0, max: 300, color: col, background: false });
        const err = desiredHist.reduce((a, d, i) => a + Math.abs(d - actualHist[i]), 0) / Math.max(1, desiredHist.length);
        ctx.stat(GTL.L('발 미끄러짐', 'Foot slide'), (slideAcc / Math.max(1e-6, slideTime)).toFixed(1) + ' px/s');
        ctx.stat(GTL.L('목표 속도 오차 (5초 평균)', 'Target speed error (5 s average)'), err.toFixed(1) + ' px/s');
        if (P.method === 'mm') {
          ctx.stat(GTL.L('점프 횟수', 'Jumps'), jumps);
          ctx.stat(GTL.L('검색 비용', 'Search cost'), GTL.L(`${N} 프레임 비교, ${searchMs.toFixed(2)} ms`, `${N} frames compared, ${searchMs.toFixed(2)} ms`));
        } else ctx.stat(GTL.L('목표 속도', 'Target speed'), vt + ' px/s');
      },
    };
  },
});
