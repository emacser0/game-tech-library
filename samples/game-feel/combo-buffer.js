// 콤보 입력 버퍼 & 캔슬 윈도우: 프레임 데이터 기반 공격 연결
GTL.register({
  id: 'combo-buffer',
  title: '콤보 입력 버퍼 & 캔슬 윈도우',
  summary: '콤보의 다음 공격은 정해진 프레임 구간(캔슬 윈도우)에서만 나감. 버퍼가 없으면 몇 프레임 일찍 누른 입력이 버려져 콤보가 끊김. 입력 버퍼는 이른 입력을 저장했다가 윈도우가 열리는 순간 실행.',
  views: { a: '버퍼 없음 (0 프레임)', b: '입력 버퍼 8 프레임' },
  controls: 'X / J / Z / Space 공격 (키를 누르면 자동 데모가 잠시 멈춤)',
  info: `
    <p><b>프레임 데이터</b>: 공격 하나는 세 구간으로 나뉨. 발생(startup, 노랑), 판정(active, 빨강), 후딜(recovery, 파랑). 단위는 60fps 프레임.</p>
    <p><b>캔슬 윈도우(Cancel Window)</b>: 후딜을 끊고 다음 공격을 낼 수 있는 구간(초록 괄호). 보통 공격이 맞았을 때만 열림(히트 캔슬).
    윈도우는 몇 프레임뿐이라 정확히 그 안에 누르기 어려움. 사람은 대개 <b>조금 일찍</b> 누름.</p>
    <p><b>입력 버퍼(Input Buffer)</b>: 누른 입력을 N 프레임 동안 보관. 보관 중에 윈도우가 열리면 그 프레임에 실행.
    프레임 데이터 표에서 뷰 색 띠가 버퍼 덕분에 앞으로 늘어난 유효 입력 구간.</p>
    <pre>if (pressed) buffer = { frame: now };
if (buffer && canAct()) { startNext(); buffer = null; }
else if (buffer && now - buffer.frame > BUFFER) { buffer = null; /* 드롭 */ }</pre>
    <ul>
      <li>경계 사례: 버퍼에 입력이 둘 이상 쌓일 때 어떤 것을 쓸지(이 샘플은 마지막 입력), 헛친 공격에서 버퍼를 비울지, 피격되면 버퍼를 지울지</li>
      <li>단점: 버퍼가 너무 길면 의도하지 않은 공격이 늦게 튀어나옴. 연타가 "예약"처럼 느껴짐.</li>
    </ul>`,
  // 도식: 공격 프레임 데이터와 캔슬 윈도우, 이른 입력이 버려지는 경우와 버퍼에서 실행되는 경우
  diagram: (L) => `<svg viewBox="0 0 540 166" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr-cb" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="4" y="34">${L('공격 1', 'Attack 1')}</text>
    <rect x="120" y="20" width="72" height="20" class="f-dim"/><rect x="192" y="20" width="36" height="20" class="f-bad"/><rect x="228" y="20" width="216" height="20" class="f-dim"/>
    <text x="156" y="34" text-anchor="middle" class="t-small">${L('발생', 'startup')}</text>
    <text x="210" y="34" text-anchor="middle" class="t-small">${L('판정', 'active')}</text>
    <text x="390" y="34" text-anchor="middle" class="t-small">${L('후딜', 'recovery')}</text>
    <path d="M264,46 L264,52 L336,52 L336,46" class="d-good"/>
    <text x="300" y="64" text-anchor="middle" class="t-small">${L('캔슬 윈도우', 'cancel window')}</text>
    <line x1="264" y1="52" x2="264" y2="134" class="d-good" stroke-dasharray="2 3"/>
    <text x="4" y="94" class="t-a">${L('A: 버퍼 0', 'A: buffer 0')}</text>
    <circle cx="216" cy="90" r="5" class="f-a"/><text x="206" y="94" text-anchor="end" class="t-small">${L('일찍 누름', 'early press')}</text>
    <text x="226" y="94" class="t-small t-a">${L('버림', 'dropped')}</text>
    <text x="4" y="124" class="t-b">${L('B: 버퍼 8', 'B: buffer 8')}</text>
    <rect x="216" y="114" width="96" height="12" class="f-b" fill-opacity="0.3"/>
    <circle cx="216" cy="120" r="5" class="f-b"/>
    <path d="M222,120 L262,120" class="d-b" marker-end="url(#arr-cb)"/>
    <text x="320" y="124" class="t-small">${L('윈도우가 열리는 프레임에 실행', 'runs on the frame the window opens')}</text>
    <text x="270" y="156" text-anchor="middle" class="t-small t-dim">${L('버퍼: 누른 입력을 N 프레임 동안 보관, 그 사이 윈도우가 열리면 실행', 'Buffer: keeps a press for N frames and runs it if the window opens')}</text>
  </svg>`,
  look: [
    '자동 데모는 매번 다른 타이밍으로 1~8 프레임 일찍 누름. A는 대부분 드롭(✗)되어 콤보가 1~2에서 끊기고, B는 3히트를 이어 감.',
    '아래 타임라인에서 B의 흰 표시(누름)와 ✓(실행) 사이 선이 버퍼에서 기다린 프레임 수. 선은 항상 초록 윈도우 시작에서 끝남.',
    'B의 버퍼를 3 프레임으로 줄이면 일찍 누른 입력 일부가 다시 드롭됨. "버퍼로 살린 입력"이 줄어듦.',
    '버퍼를 20 프레임으로 키우고 직접 연타해 보면 손을 뗀 뒤에도 공격이 이어 나감. 너무 긴 버퍼의 부작용.',
  ],
  refs: [
    { type: 'game', title: 'Street Fighter II (Capcom)', year: 1991, note: '캔슬로 일반기를 필살기에 잇는 콤보가 널리 알려진 계기' },
    { type: 'game', title: 'Street Fighter 6 (Capcom)', year: 2023, note: '게임 안 프레임 데이터 표에서 발생, 지속, 경직 프레임과 캔슬 가능 여부를 보여 줌' },
    { type: 'article', title: 'SuperCombo Wiki - Glossary (Buffer, Cancel, Link)', note: '대전 격투 커뮤니티 위키의 용어 정리. 게임마다 버퍼 길이가 다름.' },
    { type: 'book', title: 'Game Feel: A Game Designer\'s Guide to Virtual Sensation (Steve Swink)', year: 2008 },
  ],
  params: [
    { key: 'buffer', label: '입력 버퍼 (프레임)', type: 'int', min: 0, max: 20, a: 0, b: 8, default: 0, group: '기법' },
    { key: 'hitOnly', label: '맞았을 때만 캔슬 (히트 캔슬)', type: 'bool', default: true, shared: true },
    { key: 'demo', label: '자동 데모', type: 'bool', default: true, shared: true, group: '장면' },
    { key: 'demoMax', label: '데모: 최대 이른 입력 (프레임)', type: 'int', min: 0, max: 12, default: 8, shared: true, help: '자동 데모가 윈도우 시작보다 일찍 누르는 최대 프레임 수' },
    { key: 'slow', label: '느리게 보기', type: 'bool', default: false, shared: true, help: '시뮬레이션을 1/3 속도로 진행' },
    { key: 'restart', label: '처음부터', type: 'button', buttonLabel: '다시 시작' },
  ],
  en: {
    title: 'Combo Input Buffer & Cancel Windows',
    summary: 'The next attack in a combo comes out only in a set range of frames (the cancel window). Without a buffer, an input pressed a few frames early is thrown away and the combo breaks. An input buffer stores the early input and runs it the moment the window opens.',
    views: { a: 'No buffer (0 frames)', b: '8 frame input buffer' },
    controls: 'X / J / Z / Space to attack (pressing a key pauses the auto demo for a moment)',
    info: `
    <p><b>Frame data</b>: one attack has three phases. Startup (yellow), active (red), and recovery (blue). The unit is a 60fps frame.</p>
    <p><b>Cancel window</b>: the range where you can cut recovery short and start the next attack (green bracket). It usually opens only when the attack hits (hit cancel).
    The window is only a few frames long, so it is hard to press exactly inside it. People usually press <b>a little early</b>.</p>
    <p><b>Input buffer</b>: keeps a pressed input for N frames. If the window opens while it is kept, the attack runs on that frame.
    In the frame data table, the band in the view color is the extra valid input range the buffer adds in front.</p>
    <pre>if (pressed) buffer = { frame: now };
if (buffer && canAct()) { startNext(); buffer = null; }
else if (buffer && now - buffer.frame > BUFFER) { buffer = null; /* drop */ }</pre>
    <ul>
      <li>Edge cases: which input to use when two or more pile up in the buffer (this sample uses the last one), whether to clear the buffer on a whiffed attack, and whether to clear it when you get hit.</li>
      <li>Downside: if the buffer is too long, unwanted attacks pop out late. Mashing feels like "queuing up" moves.</li>
    </ul>`,
    look: [
      'The auto demo presses 1 to 8 frames early, with different timing each time. A drops most inputs (✗), and the combo breaks at 1 or 2. B links all 3 hits.',
      'In the timeline below, the line between B\'s white mark (press) and ✓ (run) is the number of frames the input waited in the buffer. The line always ends at the start of the green window.',
      'Cut B\'s buffer to 3 frames. Some early inputs get dropped again. "Inputs saved by buffer" goes down.',
      'Raise the buffer to 20 frames and mash the button yourself. Attacks keep coming out after you let go. This is the side effect of a buffer that is too long.',
    ],
    refs: [
      'Made combos that link normal moves into special moves by canceling widely known.',
      'The in-game frame data table shows startup, active, and recovery frames and whether a move can cancel.',
      'A glossary on a fighting game community wiki. Buffer length differs from game to game.',
      null,
    ],
    params: {
      buffer: { label: 'Input buffer (frames)', group: 'Technique' },
      hitOnly: 'Cancel only on hit (hit cancel)',
      demo: { label: 'Auto demo', group: 'Scene' },
      demoMax: { label: 'Demo: max early input (frames)', help: 'Max number of frames the auto demo presses before the window starts' },
      slow: { label: 'Slow motion', help: 'Run the simulation at 1/3 speed' },
      restart: { label: 'Start over', buttonLabel: 'Restart' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 640, WH = 360, STEP = 1 / 60, HIST = 110;
    const col = ctx.side === 'a' ? C.a : C.b;
    const KEYS = ['KeyX', 'KeyJ', 'KeyZ', 'Space'];
    // s: 발생, a: 판정, r: 후딜, cs~ce: 캔슬 윈도우(공격 시작 기준 프레임, 포함)
    const MOVES = [
      { name: GTL.L('약 펀치', 'Light punch'), s: 4, a: 2, r: 11, cs: 6, ce: 12, stun: 20, reach: 46, h: 12, y: -34 },
      { name: GTL.L('중 펀치', 'Medium punch'), s: 6, a: 3, r: 14, cs: 9, ce: 16, stun: 22, reach: 58, h: 14, y: -30 },
      { name: GTL.L('강 어퍼', 'Heavy uppercut'), s: 7, a: 4, r: 22, cs: -1, ce: -1, stun: 34, reach: 44, h: 30, y: -56 },
    ];
    const total = (m) => m.s + m.a + m.r;
    // 데모가 윈도우 시작보다 일찍 누르는 프레임 수 (사람마다 다른 타이밍을 흉내 낸 고정 순열)
    const EARLY = [3, 6, 2, -1, 5, 8, 4, 7, 1, 6, 3, -2, 8, 5, 2, 7];

    let frame, acc, idle, mv, buf, hist, dummy, combo, maxCombo, stats, demo, evts, lastMsg, pendPress;
    function init() {
      frame = 0; acc = 0; idle = 99; mv = null; buf = null; hist = []; evts = [];
      dummy = { stun: 0, shake: 0, flash: 0 };
      combo = 0; maxCombo = 0; stats = { press: 0, ok: 0, buffered: 0, drop: 0, combos: [] };
      demo = { wait: 40, nextAt: -1, k: 0, sched: -1 };
      lastMsg = '-'; pendPress = false;
    }
    init();

    function phaseOf(m, f) { return f < m.s ? 's' : f < m.s + m.a ? 'a' : 'r'; }
    function windowOpen() {
      if (!mv) return false;
      const m = MOVES[mv.i];
      if (m.cs < 0 || mv.i + 1 >= MOVES.length) return false;
      if (P.hitOnly && !mv.hit) return false;
      return mv.f >= m.cs && mv.f <= m.ce;
    }
    function canAct() { return !mv || windowOpen(); }

    function startMove(i) {
      mv = { i, f: 0, hit: false };
      if (P.demo && idle > 2.5 && i + 1 < MOVES.length) {
        const m = MOVES[i];
        const e = Math.min(P.demoMax, EARLY[demo.k++ % EARLY.length]);
        demo.sched = frame + Math.max(1, m.cs - e);
      }
    }

    function stepFrame(press) {
      frame++;
      let ev = null;
      if (press) { stats.press++; buf = { f: frame }; ev = 'press'; }
      // 버퍼 소비: 행동 가능한 순간이면 실행
      if (buf && canAct()) {
        const next = mv ? mv.i + 1 : 0;
        const waited = frame - buf.f;
        stats.ok++; if (waited > 0) stats.buffered++;
        evts.push({ f: frame, kind: 'ok', from: buf.f });
        lastMsg = waited > 0 ? GTL.L(`✓ ${MOVES[next].name} (버퍼에서 ${waited}프레임 대기)`, `✓ ${MOVES[next].name} (waited ${waited} frames in buffer)`) : `✓ ${MOVES[next].name}`;
        buf = null;
        startMove(next);
      } else if (buf && frame - buf.f >= P.buffer) {
        // 버퍼 길이를 넘기면 버림 (버퍼 0이면 누른 그 프레임에만 유효)
        stats.drop++; evts.push({ f: frame, kind: 'drop', from: buf.f });
        const why = mv ? (MOVES[mv.i].cs >= 0 && mv.f < MOVES[mv.i].cs ? GTL.L(`${MOVES[mv.i].cs - mv.f}프레임 이름`, `${MOVES[mv.i].cs - mv.f} frames early`) : GTL.L('윈도우 밖', 'outside window')) : '-';
        lastMsg = GTL.L(`✗ 입력 드롭 (${why})`, `✗ Input dropped (${why})`);
        buf = null;
      }
      // 공격 진행
      let state = 'idle', win = false, bufWin = false;
      if (mv) {
        const m = MOVES[mv.i];
        state = phaseOf(m, mv.f);
        win = m.cs >= 0 && mv.f >= m.cs && mv.f <= m.ce;
        bufWin = m.cs >= 0 && mv.f >= m.cs - P.buffer && mv.f < m.cs;
        if (state === 'a' && !mv.hit) {
          mv.hit = true;
          combo = dummy.stun > 0 ? combo + 1 : 1;
          maxCombo = Math.max(maxCombo, combo);
          dummy.stun = m.stun; dummy.shake = 6; dummy.flash = 4;
        }
        mv.f++;
        if (mv.f >= total(m)) mv = null;
      }
      if (dummy.stun > 0) { dummy.stun--; if (dummy.stun === 0) { stats.combos.push(combo); if (stats.combos.length > 20) stats.combos.shift(); } }
      dummy.shake = Math.max(0, dummy.shake - 1); dummy.flash = Math.max(0, dummy.flash - 1);
      hist.push({ f: frame, state, win, bufWin, ev, mi: mv ? mv.i : -1 });
      while (hist.length > HIST) hist.shift();
      while (evts.length && evts[0].f < frame - HIST) evts.shift();
    }

    function demoPress() {
      if (!mv && dummy.stun === 0) {
        demo.wait--;
        if (demo.wait <= 0) { demo.wait = 45; demo.sched = -1; return true; }
        return false;
      }
      if (demo.sched > 0 && frame + 1 >= demo.sched) { demo.sched = -1; return true; }
      return false;
    }

    return {
      update(dt) {
        const kb = ctx.input;
        const pressed = KEYS.some(kb.pressed);
        idle = pressed || KEYS.some(kb.key) ? 0 : idle + dt;
        const auto = P.demo && idle > 2.5;
        if (!auto && pressed) pendPress = true;
        acc += P.slow ? dt / 3 : dt;
        while (acc >= STEP) {
          acc -= STEP;
          const press = auto ? demoPress() : pendPress;
          pendPress = false;
          stepFrame(press);
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const sc = Math.min(W / WW, H / WH), ox = (W - WW * sc) / 2, oy = (H - WH * sc) / 2;
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        const SC = { s: '#e0b84a', a: '#ff5370', r: '#4a7bd1', idle: '#2a2f38' };

        // 프레임 데이터 표
        const fx = 92, fy = 14, fw = 4.2, rowH = 22;
        D.text(g, GTL.L('프레임 데이터 (1칸 = 1프레임)', 'Frame data (1 cell = 1 frame)'), 12, fy - 2, { size: 10, color: C.dim });
        MOVES.forEach((m, i) => {
          const y = fy + 12 + i * rowH;
          D.text(g, m.name, 12, y + 2, { size: 11, color: mv && mv.i === i ? '#fff' : C.text });
          for (let f = 0; f < total(m); f++) D.rect(g, fx + f * fw, y, fw - 0.6, 10, SC[phaseOf(m, f)]);
          if (m.cs >= 0) {
            const bx0 = fx + Math.max(0, m.cs - P.buffer) * fw;
            if (P.buffer > 0) { g.globalAlpha = 0.45; D.rect(g, bx0, y + 12, fx + m.cs * fw - bx0, 4, col); g.globalAlpha = 1; }
            D.rect(g, fx + m.cs * fw, y + 12, (m.ce - m.cs + 1) * fw, 4, C.good);
          }
          if (mv && mv.i === i) D.poly(g, [{ x: fx + mv.f * fw, y: y - 1 }, { x: fx + mv.f * fw - 3, y: y - 6 }, { x: fx + mv.f * fw + 3, y: y - 6 }], '#fff');
        });
        D.text(g, GTL.L('초록: 캔슬 윈도우, 색 띠: 버퍼로 늘어난 입력 구간', 'Green: cancel window, colored band: input range added by buffer'), fx, fy + 12 + 3 * rowH, { size: 10, color: C.dim });

        // 캐릭터
        const gy = 230, px = 230, dx = 330;
        D.rect(g, 0, gy, WW, 3, '#4a5260');
        D.rect(g, px - 14, gy - 60, 28, 60, col);
        const sh = dummy.shake ? (dummy.shake % 2 ? 3 : -3) : 0;
        D.rect(g, dx - 14 + sh, gy - 60, 28, 60, dummy.flash ? '#fff' : dummy.stun > 0 ? '#b07a8a' : '#6b7385');
        if (mv) {
          const m = MOVES[mv.i], ph = phaseOf(m, Math.max(0, mv.f - 1));
          const ext = ph === 's' ? 10 : ph === 'a' ? m.reach : 18;
          D.rect(g, px + 14, gy + m.y, ext, m.h, ph === 'a' ? 'rgba(255,83,112,0.85)' : 'rgba(255,255,255,0.35)');
        }
        if (combo > 1 && dummy.stun > 0) D.text(g, `${combo} HIT`, dx + 26, gy - 70, { size: 20, color: C.warn });
        if (dummy.stun > 0) D.rect(g, dx - 20, gy - 72, 40 * (dummy.stun / 34), 4, C.warn);
        D.text(g, lastMsg, 12, gy + 12, { size: 12, color: lastMsg[0] === '✗' ? C.bad : lastMsg[0] === '✓' ? C.good : C.dim });
        if (buf) D.text(g, GTL.L(`버퍼 보관 중: ${frame - buf.f + 1}/${Math.max(1, P.buffer)}`, `In buffer: ${frame - buf.f + 1}/${Math.max(1, P.buffer)}`), px - 14, gy - 80, { size: 11, color: col });

        // 타임라인
        const tx = 12, ty = 290, cw = (WW - 24) / HIST;
        D.text(g, GTL.L('타임라인 (최근 프레임)', 'Timeline (recent frames)'), tx, ty - 14, { size: 10, color: C.dim });
        const x0 = frame - HIST + 1;
        hist.forEach((h) => {
          const x = tx + (h.f - x0) * cw;
          D.rect(g, x, ty, cw - 0.5, 14, SC[h.state]);
          if (h.win) D.rect(g, x, ty - 4, cw - 0.5, 3, C.good);
          else if (h.bufWin && P.buffer > 0) { g.globalAlpha = 0.45; D.rect(g, x, ty - 4, cw - 0.5, 3, col); g.globalAlpha = 1; }
          if (h.ev === 'press') D.rect(g, x + cw / 2 - 1, ty + 16, 2, 10, '#fff');
        });
        for (const e of evts) {
          const x = tx + (e.f - x0 + 0.5) * cw, xf = tx + (e.from - x0 + 0.5) * cw;
          if (xf < x - 1) D.line(g, Math.max(tx, xf), ty + 30, x, ty + 30, e.kind === 'ok' ? col : C.bad, 1.5);
          if (e.kind === 'ok') D.circle(g, x, ty + 30, 3.5, C.good);
          else { D.line(g, x - 4, ty + 26, x + 4, ty + 34, C.bad, 2); D.line(g, x + 4, ty + 26, x - 4, ty + 34, C.bad, 2); }
        }
        if (P.demo && idle <= 2.5) D.text(g, GTL.L('수동 조작 중', 'Manual control'), WW - 12, gy + 12, { size: 11, color: C.warn, align: 'right' });
        g.restore();

        const cs = stats.combos, avg = cs.length ? cs.reduce((s, v) => s + v, 0) / cs.length : 0;
        ctx.stat(GTL.L('평균 콤보 (최근)', 'Average combo (recent)'), cs.length ? avg.toFixed(2) : '-');
        ctx.stat(GTL.L('최대 콤보', 'Max combo'), `${maxCombo}`);
        ctx.stat(GTL.L('입력 수락 / 드롭', 'Inputs accepted / dropped'), `${stats.ok} / ${stats.drop}`);
        ctx.stat(GTL.L('버퍼로 살린 입력', 'Inputs saved by buffer'), `${stats.buffered}`);
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
