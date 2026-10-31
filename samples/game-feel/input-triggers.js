// 입력 트리거 & 모디파이어: 키 직접 검사 vs Enhanced Input 방식 트리거
GTL.register({
  id: 'input-triggers',
  title: '입력 트리거 & 모디파이어 (Enhanced Input)',
  summary: '게임플레이 코드에서 키를 직접 검사하면 한 키에 탭과 홀드를 함께 걸 때 두 액션이 같이 나감. 트리거(Tap, Hold, Pulse, Chorded)가 키 입력을 액션 상태로 바꾸면 같은 키로 서로 다른 액션을 깔끔하게 나눔.',
  views: { a: '키 직접 검사', b: '트리거 기반 액션' },
  controls: 'Space 탭 또는 홀드, F 누르고 있기, Shift + E, E, WASD 이동 (키를 누르면 자동 데모가 잠시 멈춤)',
  info: `
    <p><b>입력 액션(Input Action)</b>: "점프", "차지 공격"처럼 게임이 알고 싶은 의도. 키는 매핑(Mapping)으로 액션에 연결함.
    Unreal Enhanced Input에서는 매핑마다 <b>트리거(Trigger)</b>와 <b>모디파이어(Modifier)</b>를 붙임.</p>
    <p>키를 직접 검사하면(A) 누르는 순간 바로 판단해야 함. 그 순간에는 탭인지 홀드인지 아직 모름.
    그래서 탭을 해도 차지 공격이 나가고, 홀드를 해도 점프가 먼저 나감. Shift + E도 E 단독 액션을 함께 부름.</p>
    <p>트리거는 매 프레임 액션 상태를 정함:</p>
    <ul>
      <li><b>None</b>: 조건 미충족. <b>Ongoing</b>: 판단 중(노랑). <b>Triggered</b>: 발동(초록). <b>Canceled</b>: Ongoing에서 발동 없이 끝남(빨강).</li>
      <li><b>Tap</b>: 기준 시간 안에 떼면 발동. 오래 누르면 취소.</li>
      <li><b>Hold</b>: 기준 시간 이상 누르면 발동. 일찍 떼면 취소.</li>
      <li><b>Pulse</b>: 누르는 동안 일정 간격으로 반복 발동.</li>
      <li><b>Chorded Action</b>: 다른 액션(Shift)이 발동 중일 때만 발동. 같은 키의 일반 매핑은 코드 블로커(Chord Blocker)로 막음.</li>
    </ul>
    <p>모디파이어는 키 값을 액션 값으로 바꿈. A 키에 Negate(부호 반전), W 키에 Swizzle(축 교환)을 붙이면 키 넷이 2D 이동 벡터 하나가 됨.
    Dead Zone은 스틱의 작은 쏠림을 0으로 버림.</p>
    <p>단점: 탭 판정은 키를 뗄 때까지 기다림. 그래서 탭 액션은 기준 시간만큼 늦게 나갈 수 있음. 홀드와 겹치지 않는 키는 Pressed 트리거가 더 빠름.</p>`,
  diagram: [(L) => `<svg viewBox="0 0 540 190" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <rect x="20" y="70" width="90" height="40" rx="6" class="f-dim"/><text x="65" y="94" text-anchor="middle">None</text>
    <rect x="225" y="70" width="90" height="40" rx="6" class="f-dim"/><text x="270" y="94" text-anchor="middle">Ongoing</text>
    <rect x="430" y="20" width="96" height="40" rx="6" class="f-dim"/><text x="478" y="44" text-anchor="middle" class="t-b">Triggered</text>
    <rect x="430" y="120" width="96" height="40" rx="6" class="f-dim"/><text x="478" y="144" text-anchor="middle" class="t-a">Canceled</text>
    <path d="M110,84 L223,84" class="d-line" marker-end="url(#arr)"/>
    <text x="166" y="76" text-anchor="middle" class="t-small">${L('키 누름', 'key down')}</text>
    <path d="M315,80 L428,46" class="d-b" marker-end="url(#arr)"/>
    <text x="332" y="50" class="t-small t-b">${L('조건 충족', 'condition met')}</text>
    <path d="M315,100 L428,136" class="d-a" marker-end="url(#arr)"/>
    <text x="332" y="138" class="t-small t-a">${L('조건 실패', 'condition failed')}</text>
    <path d="M430,150 C300,186 120,180 65,112" class="d-dim" marker-end="url(#arr)"/>
    <path d="M430,30 C300,4 110,14 65,68" class="d-dim" marker-end="url(#arr)"/>
    <text x="150" y="20" class="t-small t-dim">${L('다음 프레임', 'next frame')}</text>
    <text x="20" y="186" class="t-small t-dim">${L('Tap: 기준 안에 뗌 = 충족, 오래 누름 = 실패. Hold: 반대', 'Tap: release in time = met, held too long = failed. Hold: the opposite')}</text>
  </svg>`, (L) => `<svg viewBox="0 0 540 170" xmlns="http://www.w3.org/2000/svg">
    <text x="4" y="22" class="t-dim t-small">${L('시간', 'time')}</text>
    <line x1="100" y1="18" x2="530" y2="18" class="d-dim"/>
    <line x1="100" y1="12" x2="100" y2="160" class="d-line"/><text x="100" y="10" text-anchor="middle" class="t-small">${L('누름', 'press')}</text>
    <line x1="180" y1="24" x2="180" y2="160" class="d-dim" stroke-dasharray="4 3"/><text x="180" y="34" text-anchor="middle" class="t-small t-mono">tap 0.2s</text>
    <line x1="300" y1="24" x2="300" y2="160" class="d-dim" stroke-dasharray="4 3"/><text x="300" y="34" text-anchor="middle" class="t-small t-mono">hold 0.5s</text>
    <text x="4" y="60">${L('짧게 0.1초', 'Short 0.1 s')}</text>
    <rect x="100" y="48" width="40" height="16" class="f-dim"/><rect x="138" y="46" width="5" height="20" class="f-b"/>
    <text x="150" y="61" class="t-small t-b">${L('Tap 발동, Hold 취소', 'Tap fires, Hold cancels')}</text>
    <text x="4" y="98">${L('중간 0.35초', 'Mid 0.35 s')}</text>
    <rect x="100" y="86" width="140" height="16" class="f-dim"/><rect x="178" y="84" width="5" height="20" class="f-a"/><rect x="238" y="84" width="5" height="20" class="f-a"/>
    <text x="250" y="99" class="t-small t-a">${L('둘 다 취소', 'both cancel')}</text>
    <text x="4" y="136">${L('길게 0.9초', 'Long 0.9 s')}</text>
    <rect x="100" y="124" width="360" height="16" class="f-dim"/><rect x="178" y="122" width="5" height="20" class="f-a"/>
    <rect x="300" y="124" width="160" height="16" class="f-b"/>
    <text x="306" y="152" class="t-small t-b">${L('Hold 발동 (누르는 동안)', 'Hold fires (while held)')}</text>
    <text x="186" y="152" class="t-small t-a">${L('Tap 취소', 'Tap cancels')}</text>
  </svg>`],
  look: [
    '자동 데모의 첫 탭(0.12초)에서 A는 Jump와 Charge가 둘 다 나감. B는 Jump만 나감.',
    '자동 데모의 긴 홀드(0.9초)에서 A는 누르는 순간 Jump가 먼저 나감. B는 Tap이 빨강(Canceled)으로 끝나고 Hold만 초록이 됨.',
    '0.32초 중간 길이 누름에서 B는 두 액션 모두 취소됨. A는 둘 다 나가서 "의도와 다른 발동"이 2 늘어남.',
    'F를 누르고 있으면 A는 한 번만 쏨. B의 Pulse는 간격마다 반복해서 쏨. Pulse 간격을 0.1초로 줄이면 연사가 빨라짐.',
    'Shift + E에서 A는 Interact와 Special이 같이 나감. B는 Special만 나감. 아래 이동 상자에서 A의 점은 스틱 쏠림으로 저절로 흘러감. B는 Dead Zone이 막음.',
  ],
  refs: [
    { type: 'engine', title: 'Unreal Engine - Enhanced Input', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/enhanced-input-in-unreal-engine', note: '입력 액션, 매핑 컨텍스트, 트리거, 모디파이어 개념 설명.' },
    { type: 'engine', title: 'Unreal Engine API - UInputTriggerTap, UInputTriggerHold, UInputTriggerPulse, UInputTriggerChordAction', note: 'Tap 기준 시간, Hold 기준 시간과 One Shot, Pulse 간격, 코드 블로커 동작.' },
    { type: 'engine', title: 'Unreal Engine API - UInputModifierDeadZone, UInputModifierNegate, UInputModifierSwizzleAxis', note: 'WASD를 2D 이동 벡터로 합치는 표준 구성.' },
    { type: 'engine', title: 'Unity Input System - Interactions (Tap, Hold, SlowTap, MultiTap)', url: 'https://docs.unity3d.com/Packages/com.unity.inputsystem@1.11/manual/Interactions.html', note: 'Unity에서 같은 역할. started, performed, canceled 단계로 나뉨.' },
  ],
  params: [
    { key: 'mode', label: '입력 처리 방식', type: 'select', group: '입력 방식', options: [
      { value: 'raw', label: '키 직접 검사' },
      { value: 'trigger', label: '트리거 기반 액션' },
    ], a: 'raw', b: 'trigger' },
    { key: 'tapThr', label: 'Tap 기준 시간 (초)', type: 'range', min: 0.08, max: 0.4, step: 0.01, default: 0.2, shared: true, group: '트리거', help: '이 시간 안에 떼면 Tap. 의도 판정에도 씀' },
    { key: 'holdThr', label: 'Hold 기준 시간 (초)', type: 'range', min: 0.3, max: 1.5, step: 0.01, default: 0.5, shared: true, help: '이 시간 이상 누르면 Hold. 의도 판정에도 씀' },
    { key: 'pulse', label: 'Pulse 간격 (초)', type: 'range', min: 0.1, max: 0.6, step: 0.01, default: 0.25, when: (p) => p.mode === 'trigger' },
    { key: 'deadZone', label: 'Dead Zone 크기', type: 'range', min: 0, max: 0.5, step: 0.01, default: 0.2, group: '모디파이어', when: (p) => p.mode === 'trigger', help: '스틱 값의 길이가 이보다 작으면 0' },
    { key: 'drift', label: '스틱 쏠림 크기', type: 'range', min: 0, max: 0.4, step: 0.01, default: 0.15, shared: true, help: '손을 뗀 게임패드 스틱이 내는 작은 값 (흉내)' },
    { key: 'demo', label: '자동 데모', type: 'bool', default: true, shared: true, group: '데모' },
    { key: 'clear', label: '기록 지우기', type: 'button' },
  ],
  en: {
    title: 'Input Triggers & Modifiers (Enhanced Input)',
    summary: 'If gameplay code checks keys directly, putting tap and hold on one key fires both actions. When triggers (Tap, Hold, Pulse, Chorded) turn key input into action states, one key cleanly drives different actions.',
    views: { a: 'Direct key checks', b: 'Trigger-based actions' },
    controls: 'Space tap or hold, hold F, Shift + E, E, WASD to move (pressing a key pauses the auto demo for a moment)',
    info: `
    <p>An <b>input action</b> is an intent the game cares about, like "jump" or "charge attack". A mapping connects a key to an action.
    In Unreal Enhanced Input, each mapping can have <b>triggers</b> and <b>modifiers</b>.</p>
    <p>If you check keys directly (A), you must decide the moment the key goes down. At that moment you cannot know yet if it is a tap or a hold.
    So a tap also fires the charge attack, and a hold fires a jump first. Shift + E also calls the plain E action.</p>
    <p>Triggers set the action state every frame:</p>
    <ul>
      <li><b>None</b>: condition not met. <b>Ongoing</b>: still deciding (yellow). <b>Triggered</b>: fires (green). <b>Canceled</b>: Ongoing ended without firing (red).</li>
      <li><b>Tap</b>: fires if you release within the threshold. Holding too long cancels it.</li>
      <li><b>Hold</b>: fires once you hold past the threshold. Releasing early cancels it.</li>
      <li><b>Pulse</b>: fires again and again at a fixed interval while held.</li>
      <li><b>Chorded Action</b>: fires only while another action (Shift) is triggered. A chord blocker stops plain mappings of the same key.</li>
    </ul>
    <p>Modifiers turn the key value into the action value. Put Negate (flip sign) on A and Swizzle (swap axes) on W, and four keys become one 2D move vector.
    Dead Zone throws away small stick drift as 0.</p>
    <p>Downside: a tap is decided only when the key is released. So a tap action can fire up to the threshold later. For keys that do not share a hold, the Pressed trigger is faster.</p>`,
    look: [
      'On the first auto demo tap (0.12 s), A fires both Jump and Charge. B fires only Jump.',
      'On the long hold (0.9 s), A fires Jump the moment the key goes down. In B, Tap ends red (Canceled) and only Hold turns green.',
      'On the 0.32 s middle press, B cancels both actions. A fires both, and "Unintended firings" goes up by 2.',
      'Hold F. A shoots only once. B\'s Pulse shoots again at every interval. Lower the pulse interval to 0.1 s for faster fire.',
      'On Shift + E, A fires both Interact and Special. B fires only Special. In the move box below, A\'s dot drifts on its own from stick drift. B\'s Dead Zone stops it.',
    ],
    refs: ['Explains input actions, mapping contexts, triggers, and modifiers.', 'Tap threshold, Hold threshold and One Shot, Pulse interval, chord blocker behavior.', 'The standard setup that merges WASD into one 2D move vector.', 'The same role in Unity. Split into started, performed, and canceled phases.'],
    params: {
      mode: { label: 'Input handling', group: 'Input method', options: { raw: 'Direct key checks', trigger: 'Trigger-based actions' } },
      tapThr: { label: 'Tap threshold (s)', group: 'Triggers', help: 'Release within this time for a Tap. Also used to judge intent' },
      holdThr: { label: 'Hold threshold (s)', help: 'Hold at least this long for a Hold. Also used to judge intent' },
      pulse: 'Pulse interval (s)',
      deadZone: { label: 'Dead Zone size', group: 'Modifiers', help: 'Stick values shorter than this become 0' },
      drift: { label: 'Stick drift size', help: 'Small value a released gamepad stick reports (simulated)' },
      demo: { label: 'Auto demo', group: 'Demo' },
      clear: 'Clear history',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors;
    const P = ctx.params;
    const WIN = 5;                 // 타임라인에 보이는 시간 (초)
    const PERIOD = 8.6;            // 자동 데모 한 바퀴
    // [키, 시작, 길이]
    const SCRIPT = [
      ['Space', 0.4, 0.12], ['Space', 1.3, 0.9], ['Space', 3.0, 0.32],
      ['KeyF', 4.0, 1.1],
      ['Shift', 5.6, 1.0], ['KeyE', 5.95, 0.15], ['KeyE', 7.2, 0.15],
      ['KeyD', 0.2, 1.4], ['KeyW', 1.8, 1.0], ['KeyA', 3.2, 1.4], ['KeyS', 4.8, 1.0],
    ];
    const KEYS = ['Space', 'KeyF', 'KeyE', 'Shift', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
    // 타임라인 행: 0 Space, 1 Jump, 2 Charge, 3 F, 4 Fire, 5 Shift, 6 E, 7 Interact, 8 Special
    const ROWS = 9, KEY_ROWS = new Set([0, 3, 5, 6]);
    const ACT_COL = { Jump: C.series[0], Charge: C.series[1], Fire: C.series[2], Interact: C.series[3], Special: C.series[4] };

    let t, demoT, idle, prev, history, events, logs, presses, unintended, fired;
    let spaceT0, spaceSet, fT0, fNext, holdFired, tapState, holdState, mv, trail, stickAng;
    const init = () => {
      ctx.rng = U.rng(ctx.seed);
      t = 0; demoT = 0; idle = 99; prev = {}; history = []; events = []; logs = []; presses = [];
      unintended = 0; fired = 0; spaceT0 = 0; spaceSet = []; fT0 = 0; fNext = 0; holdFired = false;
      tapState = 0; holdState = 0;
      mv = { x: 0, y: 0 }; trail = [];
      stickAng = ctx.rng.range(0, U.TAU);
    };
    init();

    const demoDown = (code, ph) => SCRIPT.some(([c, t0, d]) => c === code && ph >= t0 && ph < t0 + d);
    const userDown = (code) => {
      const I = ctx.input;
      if (code === 'Shift') return I.key('ShiftLeft') || I.key('ShiftRight');
      if (code === 'KeyW') return I.key('KeyW') || I.key('ArrowUp');
      if (code === 'KeyA') return I.key('KeyA') || I.key('ArrowLeft');
      if (code === 'KeyS') return I.key('KeyS') || I.key('ArrowDown');
      if (code === 'KeyD') return I.key('KeyD') || I.key('ArrowRight');
      return I.key(code);
    };

    function fire(name, note, row) {
      fired++;
      const e = { t, name, note, bad: false };
      logs.push(e); if (logs.length > 40) logs.shift();
      events.push({ t, row, kind: 'trig' });
      return e;
    }
    function cancel(name, note, row) {
      logs.push({ t, name, note, cancel: true }); if (logs.length > 40) logs.shift();
      events.push({ t, row, kind: 'cancel' });
    }

    function step(dt) {
      t += dt;
      const user = {};
      let any = false;
      for (const k of KEYS) { user[k] = userDown(k); any = any || user[k]; }
      idle = any ? 0 : idle + dt;
      const auto = P.demo && idle > 3;
      if (auto) demoT += dt;
      const ph = demoT % PERIOD;
      const cur = {};
      for (const k of KEYS) cur[k] = auto ? demoDown(k, ph) : user[k];
      const pr = (k) => cur[k] && !prev[k], rl = (k) => !cur[k] && prev[k];
      const trig = P.mode === 'trigger';
      const st = new Uint8Array(ROWS);   // 0 None, 1 Ongoing, 2 Triggered
      st[0] = cur.Space ? 1 : 0; st[3] = cur.KeyF ? 1 : 0; st[5] = cur.Shift ? 1 : 0; st[6] = cur.KeyE ? 1 : 0;

      // ── Space: Jump(탭 의도) / Charge(홀드 의도) ──
      if (pr('Space')) { spaceT0 = t; spaceSet = []; holdFired = false; presses.push(t); if (presses.length > 20) presses.shift(); }
      const held = t - spaceT0;
      if (!trig) {
        if (pr('Space')) { spaceSet.push(fire('Jump', GTL.L('누르는 순간', 'on key down'), 1)); st[1] = 2; }
        if (cur.Space) st[2] = 1;
        if (rl('Space')) { spaceSet.push(fire('Charge', GTL.L('뗄 때, 차지 ', 'on release, charge ') + held.toFixed(2) + GTL.L('초', ' s'), 2)); st[2] = 2; }
      } else {
        if (cur.Space) {
          // Tap: 기준 시간 안이면 Ongoing, 넘으면 취소
          if (held <= P.tapThr) st[1] = 1;
          else if (tapState === 1) cancel('Jump', GTL.L('Tap 기준 초과', 'past Tap threshold'), 1);
          // Hold: 기준 전이면 Ongoing, 넘으면 Triggered
          if (held < P.holdThr) st[2] = 1;
          else {
            st[2] = 2;
            if (!holdFired) { holdFired = true; spaceSet.push(fire('Charge', GTL.L('홀드 ', 'hold ') + P.holdThr.toFixed(2) + GTL.L('초 도달', ' s reached'), 2)); }
          }
        }
        if (rl('Space')) {
          if (held <= P.tapThr) { spaceSet.push(fire('Jump', GTL.L('탭 ', 'tap ') + held.toFixed(2) + GTL.L('초', ' s'), 1)); st[1] = 2; }
          if (held < P.holdThr) cancel('Charge', GTL.L('일찍 뗌 ', 'released early ') + held.toFixed(2) + GTL.L('초', ' s'), 2);
        }
      }
      if (rl('Space')) {
        const intent = held <= P.tapThr ? 'Jump' : held >= P.holdThr ? 'Charge' : '';
        for (const e of spaceSet) if (e.name !== intent) { e.bad = true; unintended++; }
        spaceSet = [];
      }
      tapState = st[1]; holdState = st[2];

      // ── F: Fire ──
      if (pr('KeyF')) { fT0 = t; fNext = 0; }
      if (!trig) {
        if (pr('KeyF')) { fire('Fire', GTL.L('누르는 순간 1발', 'one shot on key down'), 4); st[4] = 2; }
      } else if (cur.KeyF) {
        const el = t - fT0;
        if (el >= fNext) { fire('Fire', GTL.L('Pulse ', 'Pulse ') + (Math.round(fNext / P.pulse) + 1), 4); st[4] = 2; fNext += P.pulse; }
        else st[4] = 1;
      }

      // ── E: Interact / Shift + E: Special ──
      if (pr('KeyE')) {
        const intent = cur.Shift ? 'Special' : 'Interact';
        const set = [];
        if (!trig) {
          set.push(fire('Interact', GTL.L('E 누름', 'E down'), 7)); st[7] = 2;
          if (cur.Shift) { set.push(fire('Special', GTL.L('Shift 확인', 'Shift checked'), 8)); st[8] = 2; }
        } else if (cur.Shift) {
          set.push(fire('Special', GTL.L('Chorded (Shift)', 'Chorded (Shift)'), 8)); st[8] = 2;
          logs.push({ t, name: 'Interact', note: GTL.L('코드 블로커가 막음', 'blocked by chord blocker'), cancel: true });
        } else { set.push(fire('Interact', GTL.L('Pressed', 'Pressed'), 7)); st[7] = 2; }
        for (const e of set) if (e.name !== intent) { e.bad = true; unintended++; }
      }
      if (trig && cur.Shift && cur.KeyE && !pr('KeyE')) st[8] = st[8] || 1;

      history.push({ t, st });
      while (history.length && history[0].t < t - WIN - 0.2) history.shift();
      while (events.length && events[0].t < t - WIN - 0.2) events.shift();

      // ── 이동: 모디파이어 ──
      let kx = 0, ky = 0;
      if (cur.KeyD) kx += 1;                 // D: 그대로 (x)
      if (cur.KeyA) kx += -1;                // A: Negate
      if (cur.KeyW) ky += 1;                 // W: Swizzle YXZ, 값 1이 y로
      if (cur.KeyS) ky += -1;                // S: Swizzle + Negate
      const m = P.drift * (0.85 + 0.15 * Math.sin(t * 0.6));
      const a = stickAng + 0.4 * Math.sin(t * 0.23);
      let sx = Math.cos(a) * m, sy = Math.sin(a) * m;
      const raw = { x: sx, y: sy };
      if (trig) {
        const len = Math.hypot(sx, sy), dz = P.deadZone;
        if (len < dz) { sx = 0; sy = 0; } else { const k = (len - dz) / (1 - dz) / len; sx *= k; sy *= k; }
      }
      let vx = kx + sx, vy = ky + sy;
      const vl = Math.hypot(vx, vy); if (vl > 1) { vx /= vl; vy /= vl; }
      mv.x = U.wrap(mv.x + vx * 0.9 * dt, -1, 1); mv.y = U.wrap(mv.y + vy * 0.9 * dt, -1, 1);
      mv.raw = raw; mv.stick = { x: sx, y: sy }; mv.v = { x: vx, y: vy };
      trail.push({ x: mv.x, y: mv.y }); if (trail.length > 90) trail.shift();

      for (const k of KEYS) prev[k] = cur[k];
      return auto;
    }

    let lastAuto = true;
    return {
      update(dt) { lastAuto = step(dt); },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const trig = P.mode === 'trigger';
        const col = ctx.side === 'a' ? C.a : C.b;
        const LW = 108, x0 = LW, x1 = W - 10, tw = Math.max(10, x1 - x0);
        const top = 26;
        const rh = U.clamp(Math.floor((H * 0.56 - top) / ROWS), 12, 24);
        const tx = (tt) => x0 + ((tt - (t - WIN)) / WIN) * tw;

        // 범례
        const leg = [['None', C.grid], ['Ongoing', C.warn], ['Triggered', C.good], ['Canceled', C.bad]];
        let lx = 8;
        for (const [n, c] of leg) { D.rect(g, lx, 8, 10, 10, c); D.text(g, n, lx + 14, 13, { size: 10, color: C.dim, baseline: 'middle' }); lx += 22 + n.length * 6; }
        D.text(g, auto() ? GTL.L('자동 데모', 'Auto demo') : GTL.L('키보드', 'Keyboard'), W - 10, 13, { size: 10, color: C.dim, align: 'right', baseline: 'middle' });

        const names = trig
          ? ['Space', 'Jump (Tap)', 'Charge (Hold)', 'F', 'Fire (Pulse)', 'Shift', 'E', 'Interact (Pressed)', 'Special (Chorded)']
          : ['Space', GTL.L('Jump (누름)', 'Jump (down)'), GTL.L('Charge (뗌)', 'Charge (up)'), 'F', GTL.L('Fire (누름)', 'Fire (down)'), 'Shift', 'E', GTL.L('Interact (누름)', 'Interact (down)'), GTL.L('Special (+Shift)', 'Special (+Shift)')];
        for (let r = 0; r < ROWS; r++) {
          const y = top + r * rh;
          const isKey = KEY_ROWS.has(r);
          D.rect(g, x0, y + 1, tw, rh - 2, isKey ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)');
          D.text(g, names[r], isKey ? 8 : 16, y + rh / 2, { size: 10, color: isKey ? C.dim : C.text, baseline: 'middle' });
          // 상태 구간 합치기
          let runS = 0, runT = 0;
          const flush = (endT) => {
            if (!runS) return;
            const c = isKey ? 'rgba(220,225,235,0.45)' : runS === 1 ? C.warn : C.good;
            const xa = Math.max(x0, tx(runT)), xb = Math.min(x1, tx(endT));
            if (xb > xa) D.rect(g, xa, y + 3, Math.max(1.5, xb - xa), rh - 6, c);
          };
          for (let i = 0; i < history.length; i++) {
            const s = history[i].st[r];
            if (s !== runS) { flush(history[i].t); runS = s; runT = history[i].t; }
          }
          flush(t);
        }
        // 발동, 취소 표시
        for (const e of events) {
          const x = tx(e.t); if (x < x0) continue;
          const y = top + e.row * rh;
          D.rect(g, x - 1.5, y + 1, 3, rh - 2, e.kind === 'trig' ? C.good : C.bad);
          if (e.kind === 'cancel') { D.line(g, x - 4, y + 3, x + 4, y + rh - 3, C.bad, 1.5); D.line(g, x + 4, y + 3, x - 4, y + rh - 3, C.bad, 1.5); }
        }
        // 기준 시간 눈금 (B)
        if (trig) {
          g.setLineDash([3, 3]);
          for (const p of presses) {
            const xa = tx(p + P.tapThr), xb = tx(p + P.holdThr);
            if (xa >= x0 && xa <= x1) D.line(g, xa, top + rh, xa, top + 2 * rh, C.text, 1);
            if (xb >= x0 && xb <= x1) D.line(g, xb, top + 2 * rh, xb, top + 3 * rh, C.text, 1);
          }
          g.setLineDash([]);
        }
        D.line(g, x1, top, x1, top + ROWS * rh, C.dim, 1);

        // ── 아래: 액션 로그(왼쪽), 이동 상자(오른쪽) ──
        const by = top + ROWS * rh + 12;
        const bh = H - by - 8;
        const boxS = Math.max(40, Math.min(bh - 18, W * 0.38, 170));
        const bx = W - boxS - 12;
        const logW = bx - 18;
        D.text(g, GTL.L('액션 로그', 'Action log'), 8, by + 4, { size: 11, color: C.dim });
        const lines = Math.max(0, Math.floor((bh - 76) / 14));
        const show = logs.slice(-lines);
        show.forEach((e, i) => {
          const y = by + 22 + i * 14;
          const c = e.cancel ? C.bad : e.bad ? C.a : ACT_COL[e.name];
          const txt = e.t.toFixed(2) + 's  ' + e.name + (e.cancel ? GTL.L(' 취소', ' canceled') : '') + '  ' + e.note + (e.bad ? GTL.L('  (의도 아님)', '  (unintended)') : '');
          const maxCh = Math.max(4, Math.floor(logW / 5.6));
          D.text(g, txt.length > maxCh ? txt.slice(0, maxCh - 1) + '…' : txt, 8, y, { size: 10, color: c, font: '10px monospace' });
        });

        // 이동 상자
        const cyb = by + 14;
        D.text(g, GTL.L('Move (WASD + 스틱)', 'Move (WASD + stick)'), bx, by + 4, { size: 11, color: C.dim });
        D.rect(g, bx, cyb, boxS, boxS, null, C.grid, 1);
        const mx = (v) => bx + (v + 1) * 0.5 * boxS, my = (v) => cyb + (1 - (v + 1) * 0.5) * boxS;
        for (let i = 1; i < trail.length; i++) {
          if (Math.abs(trail[i].x - trail[i - 1].x) > 0.5 || Math.abs(trail[i].y - trail[i - 1].y) > 0.5) continue;
          D.line(g, mx(trail[i - 1].x), my(trail[i - 1].y), mx(trail[i].x), my(trail[i].y), col, 1);
        }
        D.circle(g, mx(mv.x), my(mv.y), 5, col);
        // 스틱 표시
        const sr = Math.min(26, boxS * 0.18), scx = bx + sr + 6, scy = cyb + boxS - sr - 6;
        D.circle(g, scx, scy, sr, null, C.dim, 1);
        if (trig) D.circle(g, scx, scy, sr * P.deadZone, 'rgba(255,255,255,0.08)', C.dim, 1);
        if (mv.raw) {
          D.circle(g, scx + mv.raw.x * sr, scy - mv.raw.y * sr, 2.5, C.dim);
          D.circle(g, scx + mv.stick.x * sr, scy - mv.stick.y * sr, 2.5, col);
        }
        const modTxt = trig
          ? [GTL.L('A: Negate, W: Swizzle', 'A: Negate, W: Swizzle'), GTL.L('스틱: Dead Zone ', 'Stick: Dead Zone ') + P.deadZone.toFixed(2)]
          : [GTL.L('if (A) x -= 1 ...', 'if (A) x -= 1 ...'), GTL.L('스틱: 값 그대로', 'Stick: raw value')];
        modTxt.forEach((s, i) => D.text(g, s, bx + boxS - 4, cyb + 12 + i * 12, { size: 9, color: C.dim, align: 'right' }));

        ctx.stat(GTL.L('의도와 다른 발동', 'Unintended firings'), unintended);
        ctx.stat(GTL.L('발동한 액션', 'Actions fired'), fired);
        if (mv.v) ctx.stat(GTL.L('스틱 출력 크기', 'Stick output size'), Math.hypot(mv.stick.x, mv.stick.y).toFixed(2));
      },
      onAction(key) { if (key === 'clear') init(); },
    };
    function auto() { return lastAuto; }
  },
});
