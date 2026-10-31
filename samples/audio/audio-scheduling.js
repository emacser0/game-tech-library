// 오디오 스케줄링: setTimeout으로 바로 재생 vs AudioContext 시계 기반 lookahead 예약
GTL.register({
  id: 'audio-scheduling',
  title: '오디오 스케줄링 (Lookahead)',
  summary: 'setTimeout이 깨어날 때 바로 소리를 내면 메인 스레드가 바쁠 때마다 박자가 밀림. 타이머로는 조금 앞의 노트를 미리 찾기만 하고, 정확한 재생 시각은 오디오 시계에 예약하면 부하가 있어도 박자가 정확함.',
  views: { a: 'setTimeout 즉시 재생', b: 'lookahead 예약' },
  controls: '조작 없음. 16분음표 메트로놈이 계속 울림. 메인 스레드 부하는 실제로 바쁜 대기를 걸어서 만듦.',
  info: `
    <p>리듬 게임, 음악 시퀀서, 연사 무기처럼 <b>박자가 정확해야 하는 소리</b>는 재생 시각을 어떻게 정하느냐가 중요함.</p>
    <p><b>A: setTimeout 즉시 재생.</b> 다음 노트 시각까지 타이머를 걸고, 깨어나면 바로 재생.
    타이머는 메인 스레드에서 돌기 때문에 렌더링, GC, 긴 작업이 있으면 늦게 깨어남. 그 지연이 그대로 박자 오차가 됨.</p>
    <p><b>B: lookahead 예약</b> (Chris Wilson, "A Tale of Two Clocks"):</p>
    <ul>
      <li>짧은 간격(예: 25ms)으로 타이머를 돌림.</li>
      <li>깨어날 때마다 "지금부터 예약 범위(예: 100ms) 안에 있는 노트"를 모두 찾음.</li>
      <li>찾은 노트를 <code>osc.start(정확한 시각)</code>으로 오디오 시계(<code>AudioContext.currentTime</code>)에 예약.</li>
      <li>오디오 시계는 별도 스레드에서 샘플 단위로 정확함. 타이머가 늦어도 예약 범위 안이면 오차 0.</li>
    </ul>
    <p>단점: 예약 범위만큼 지연이 생겨 템포 변경이나 정지가 늦게 반영됨. 범위가 너무 짧으면 긴 부하를 못 견딤.
    타이머가 예약 범위보다 더 늦게 깨어나면 B도 늦음.</p>
    <p>측정: 오차 = 소리가 실제로 나는 시각 - 의도한 시각. B는 예약 시점이 이미 노트 시각을 지났을 때만 늦음.
    부하는 A 뷰의 update에서 바쁜 대기로 만들고, 두 뷰가 같은 메인 스레드를 쓰므로 둘 다 영향을 받음.</p>`,
  diagram: (L) => {
    const notes = [180, 280, 380, 480], ticks = [120, 160, 200, 240, 280, 320, 360, 432, 472, 512];
    return `<svg viewBox="0 0 540 206" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arrb" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    ${notes.map((x) => `<line x1="${x}" y1="22" x2="${x}" y2="168" class="d-dim" stroke-dasharray="3 3"/><circle cx="${x}" cy="28" r="4" class="f-dim"/>`).join('')}
    <text x="4" y="32">${L('의도한 박자', 'Intended beats')}</text>
    <text x="4" y="72">${L('메인 스레드', 'Main thread')}</text>
    <line x1="110" y1="68" x2="530" y2="68" class="d-dim"/>
    <rect x="385" y="56" width="45" height="24" class="f-accent"/>
    <text x="407" y="52" text-anchor="middle" class="t-small">${L('부하 스파이크', 'load spike')}</text>
    ${ticks.map((x) => `<line x1="${x}" y1="62" x2="${x}" y2="74" class="d-line"/>`).join('')}
    <text x="4" y="112" class="t-a">${L('A 즉시 재생', 'A play on wake')}</text>
    <line x1="110" y1="108" x2="530" y2="108" class="d-dim"/>
    ${[[180, 186], [280, 284], [380, 432], [480, 486]].map(([n, x]) => `<line x1="${n}" y1="108" x2="${x}" y2="108" class="d-bad"/><rect x="${x - 2}" y="98" width="4" height="20" class="f-a"/>`).join('')}
    <text x="438" y="102" class="t-small t-a">${L('늦음', 'late')}</text>
    <text x="4" y="152" class="t-b">${L('B 예약', 'B scheduled')}</text>
    <line x1="110" y1="148" x2="530" y2="148" class="d-dim"/>
    ${notes.map((x) => `<rect x="${x - 2}" y="138" width="4" height="20" class="f-b"/>`).join('')}
    <path d="M320,166 L320,172 L420,172 L420,166" class="d-b"/>
    <path d="M320,140 C330,126 360,126 376,138" class="d-b" marker-end="url(#arrb)"/>
    <text x="370" y="186" text-anchor="middle" class="t-small t-b">${L('깨어난 순간, 예약 범위 안의 노트를 오디오 시계에 미리 예약', 'On wake, book every note in the window on the audio clock')}</text>
    <text x="4" y="202" class="t-small t-dim">${L('세로 눈금 = 타이머가 깨어난 순간', 'Ticks = timer wake-ups')}</text>
    </svg>`;
  },
  look: [
    '아래 히스토그램에서 A는 오차가 수 ms~수십 ms로 퍼짐. B는 거의 모두 0ms 칸에 모임.',
    '"부하 스파이크 (ms)"를 150으로 올리면 A는 스파이크마다 큰 오차가 생김. B는 예약 범위(100ms)를 넘는 만큼만 늦음.',
    'B의 "예약 범위"를 타이머 간격보다 작게(예: 20ms) 하면 B도 늦는 노트가 생김.',
    '부하를 모두 0으로 두면 A도 오차가 작아짐. 그래도 B보다 퍼짐이 큼 (타이머 자체의 지터).',
    '브라우저 탭을 다른 탭으로 바꿨다가 돌아오면 A는 크게 늦음. 백그라운드 탭은 타이머가 느려짐.',
  ],
  refs: [
    { type: 'article', title: 'A Tale of Two Clocks - Scheduling Web Audio with Precision (Chris Wilson)', url: 'https://web.dev/articles/audio-scheduling', year: 2013, note: 'HTML5 Rocks에 처음 실림. lookahead 25ms, scheduleAheadTime 100ms 예시.' },
    { type: 'engine', title: 'MDN - AudioContext.currentTime', url: 'https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/currentTime', note: '오디오 하드웨어 시계. 초 단위, 계속 증가함.' },
    { type: 'engine', title: 'MDN - AudioScheduledSourceNode.start', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AudioScheduledSourceNode/start', note: 'when 인자로 정확한 재생 시각을 예약.' },
    { type: 'engine', title: 'FMOD Engine - Channel::setDelay (DSP clock)', note: '네이티브 엔진도 DSP 시계 기준으로 샘플 단위 예약을 제공함.' },
  ],
  params: [
    { key: 'mode', label: '스케줄링 방식', type: 'select', group: '스케줄링', options: [
      { value: 'timeout', label: 'setTimeout 즉시 재생' },
      { value: 'lookahead', label: 'lookahead 예약' },
    ], a: 'timeout', b: 'lookahead' },
    { key: 'tick', label: '타이머 간격 (ms)', type: 'range', min: 5, max: 100, step: 1, default: 25, when: (p) => p.mode === 'lookahead' },
    { key: 'ahead', label: '예약 범위 (ms)', type: 'range', min: 10, max: 300, step: 5, default: 100, when: (p) => p.mode === 'lookahead' },
    { key: 'bpm', label: '템포 (BPM, 16분음표)', type: 'range', min: 60, max: 240, step: 1, default: 120, shared: true, group: '부하' },
    { key: 'frameLoad', label: '프레임마다 부하 (ms)', type: 'range', min: 0, max: 12, step: 0.5, default: 3, shared: true, help: '매 프레임 메인 스레드를 바쁘게 붙잡는 시간' },
    { key: 'spikeMs', label: '부하 스파이크 (ms)', type: 'range', min: 0, max: 150, step: 5, default: 60, shared: true, help: 'GC나 긴 작업을 흉내 냄' },
    { key: 'spikeEvery', label: '스파이크 간격 (초)', type: 'range', min: 0.3, max: 3, step: 0.1, default: 1, shared: true },
    { key: 'sound', label: '소리 켜기', type: 'button', buttonLabel: '소리 켜기/끄기', group: '소리' },
    { key: 'listen', label: '소리 내는 뷰', type: 'select', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], default: 'a', shared: true },
    { key: 'vol', label: '음량', type: 'range', min: 0, max: 1, step: 0.01, default: 0.4, shared: true },
    { key: 'clear', label: '기록 지우기', type: 'button' },
  ],
  en: {
    title: 'Audio Scheduling (Lookahead)',
    summary: 'If you play a sound as soon as setTimeout wakes up, the beat drifts every time the main thread is busy. Use the timer only to find the next few notes early. Schedule the exact play time on the audio clock. The beat then stays exact even under load.',
    views: { a: 'setTimeout, play now', b: 'Lookahead scheduling' },
    controls: 'No input. A 16th note metronome keeps ticking. Main thread load comes from a real busy wait.',
    info: `
    <p>For <b>sounds that need exact timing</b>, such as rhythm games, music sequencers, and rapid fire weapons, how you set the play time matters.</p>
    <p><b>A: setTimeout, play now.</b> Set a timer for the next note time, and play the sound right when it wakes up.
    The timer runs on the main thread. Rendering, GC, and long tasks make it wake up late. That delay becomes beat error.</p>
    <p><b>B: lookahead scheduling</b> (Chris Wilson, "A Tale of Two Clocks"):</p>
    <ul>
      <li>Run a timer at a short interval (for example, 25 ms).</li>
      <li>Each time it wakes up, find all notes "inside the schedule window from now" (for example, 100 ms).</li>
      <li>Schedule those notes on the audio clock (<code>AudioContext.currentTime</code>) with <code>osc.start(exact time)</code>.</li>
      <li>The audio clock runs on its own thread and is exact to the sample. Even if the timer is late, the error is 0 while it stays inside the window.</li>
    </ul>
    <p>Downside: the window adds delay, so tempo changes and stops take effect late. If the window is too short, it cannot survive long load spikes.
    If the timer wakes up later than the window, B is late too.</p>
    <p>Measurement: error = time the sound actually plays - intended time. B is late only when the note time has already passed at scheduling time.
    The load comes from a busy wait in the update of view A. Both views share the same main thread, so both are affected.</p>`,
    look: [
      'In the bottom histogram, A\'s error spreads from a few ms to tens of ms. B gathers almost all in the 0 ms bin.',
      'Raise "Load spike (ms)" to 150. A gets a large error at every spike. B is late only by the amount past the window (100 ms).',
      'Set B\'s "Schedule window" smaller than the timer interval (for example, 20 ms). B also gets late notes.',
      'Set all loads to 0. A\'s error gets smaller too. But it still spreads more than B (jitter in the timer itself).',
      'Switch to another browser tab and come back. A is very late. Timers slow down in background tabs.',
    ],
    refs: [
      'First published on HTML5 Rocks. Example with a 25 ms lookahead and a 100 ms scheduleAheadTime.',
      'The audio hardware clock. In seconds, always increasing.',
      'Schedules an exact play time with the when argument.',
      'Native engines also offer sample accurate scheduling on the DSP clock.',
    ],
    params: {
      mode: { label: 'Scheduling mode', group: 'Scheduling', options: { timeout: 'setTimeout, play now', lookahead: 'Lookahead scheduling' } },
      tick: 'Timer interval (ms)',
      ahead: 'Schedule window (ms)',
      bpm: { label: 'Tempo (BPM, 16th notes)', group: 'Load' },
      frameLoad: { label: 'Load per frame (ms)', help: 'Time the main thread is kept busy every frame' },
      spikeMs: { label: 'Load spike (ms)', help: 'Mimics GC or a long task' },
      spikeEvery: 'Spike interval (s)',
      sound: { label: 'Sound on', buttonLabel: 'Sound on/off', group: 'Sound' },
      listen: 'View that plays sound',
      vol: 'Volume',
      clear: 'Clear history',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const col = ctx.side === 'a' ? C.a : C.b;
    const now = () => ctx.now();
    const BINS = 31, KEEP = 400;
    const interval = () => 60000 / P.bpm / 4;

    let errs, notes, nextNote, noteIdx, timerId, spikeAcc, lastBeat, alive = true;
    function clearRec() { errs = []; notes = []; }
    clearRec();

    // ── 오디오 (소리 켜기 버튼을 눌러야 생성). 재생 함수는 시각화와 무관하게 호출됨 ──
    let ac = null, master = null, clockOff = 0;
    function soundToggle() {
      if (ac) { stopAudio(); return; }
      if (typeof AudioContext === 'undefined') return;
      ac = new AudioContext();
      master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
      clockOff = ac.currentTime - now() / 1000;    // performance 시계(ms) → 오디오 시계(s) 변환
      if (ac.resume) ac.resume();
    }
    function stopAudio() {
      if (!ac) return;
      try { ac.close(); } catch (e) { /* 이미 닫힘 */ }
      ac = null; master = null;
    }
    const audible = () => !!ac && P.listen === ctx.side;
    function click(atAudioTime, accent) {
      if (!ac) return;
      const t = Math.max(ac.currentTime, atAudioTime);
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'square'; o.frequency.value = accent ? 1760 : 880;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(accent ? 0.5 : 0.3, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.06);
    }

    function record(ideal, actual) {
      const e = actual - ideal;
      errs.push(e); if (errs.length > KEEP) errs.shift();
      notes.push({ ideal, actual, accent: noteIdx % 4 === 0 }); if (notes.length > 64) notes.shift();
      noteIdx++;
    }

    // A: 다음 노트 시각에 타이머를 걸고, 깨어나면 즉시 재생
    function timeoutLoop() {
      if (!alive || P.mode !== 'timeout') return;
      timerId = setTimeout(() => {
        if (!alive) return;
        const t = now();
        record(nextNote, t);
        click(ac ? ac.currentTime : 0, noteIdx % 4 === 1);
        nextNote += interval();
        if (nextNote < t - 1000) nextNote = t;   // 탭이 오래 멈춘 경우 따라잡지 않음
        timeoutLoop();
      }, Math.max(0, nextNote - now()));
    }
    // B: 짧은 간격으로 깨어나 예약 범위 안의 노트를 오디오 시계에 예약
    function lookaheadLoop() {
      if (!alive || P.mode !== 'lookahead') return;
      const t = now();
      if (nextNote < t - 1000) nextNote = t;
      while (nextNote < t + P.ahead) {
        record(nextNote, Math.max(nextNote, t));  // 이미 지난 노트만 늦음
        click(nextNote / 1000 + clockOff, noteIdx % 4 === 1);
        nextNote += interval();
      }
      timerId = setTimeout(lookaheadLoop, P.tick);
    }
    function restart() {
      clearTimeout(timerId);
      nextNote = now() + 200; noteIdx = 0; spikeAcc = 0;
      if (P.mode === 'timeout') timeoutLoop(); else lookaheadLoop();
    }
    restart();

    function busy(ms) { const end = now() + ms; while (now() < end) { /* 메인 스레드 붙잡기 */ } }

    function stats() {
      const n = errs.length;
      if (!n) return null;
      let s = 0, mx = 0, late = 0;
      for (const e of errs) { s += e; if (e > mx) mx = e; if (e > 5) late++; }
      const mean = s / n;
      let v = 0; for (const e of errs) v += (e - mean) ** 2;
      return { mean, mx, sd: Math.sqrt(v / n), late: late / n, n };
    }

    return {
      update() {
        // 부하는 A 뷰에서만 걸음. 두 뷰가 같은 메인 스레드를 쓰므로 둘 다 영향을 받음
        if (ctx.side === 'a') {
          if (P.frameLoad > 0) busy(P.frameLoad);
          spikeAcc += ctx.realDt;
          if (P.spikeMs > 0 && spikeAcc >= P.spikeEvery) { spikeAcc = 0; busy(P.spikeMs); }
        }
        if (ac) master.gain.setTargetAtTime(audible() ? P.vol : 0, ac.currentTime, 0.03);
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height, t = now();
        // ── 메트로놈: 최근 노트가 울린 시각 기준으로 깜빡임 ──
        let flash = 0, acc = false;
        for (let i = notes.length - 1; i >= 0; i--) if (notes[i].actual <= t) { flash = Math.max(0, 1 - (t - notes[i].actual) / 120); acc = notes[i].accent; break; }
        D.circle(g, 40, 40, 18 + flash * 6, `rgba(255,255,255,${0.08 + flash * 0.6})`, acc && flash > 0 ? C.warn : col, 2);
        D.text(g, GTL.L(`${P.bpm.toFixed(0)} BPM, 간격 ${interval().toFixed(1)} ms`, `${P.bpm.toFixed(0)} BPM, interval ${interval().toFixed(1)} ms`), 70, 32, { size: 12, color: C.text });
        // ── 최근 노트 오차 막대 ──
        const bx = 16, by = 76, bw = W - 32, bh = Math.max(50, H * 0.26);
        D.rect(g, bx, by, bw, bh, 'rgba(0,0,0,0.35)');
        const maxE = 40, n = notes.length, w = bw / 64;
        for (let i = 0; i < n; i++) {
          const e = notes[i].actual - notes[i].ideal, h = Math.min(1, e / maxE) * (bh - 16);
          D.rect(g, bx + (64 - n + i) * w + 1, by + bh - h, Math.max(1, w - 2), Math.max(1, h), e > 5 ? C.bad : col);
        }
        D.line(g, bx, by + bh - (5 / maxE) * (bh - 16), bx + bw, by + bh - (5 / maxE) * (bh - 16), 'rgba(255,203,107,0.5)', 1);
        D.text(g, GTL.L('최근 64개 노트의 늦음 (0~40ms). 노란 선 = 5ms', 'Lateness of the last 64 notes (0~40ms). Yellow line = 5ms'), bx + 4, by + 3, { size: 10, color: C.dim });
        // ── 오차 히스토그램 ──
        const hx = 40, hy = by + bh + 16, hw = W - 56, hh = Math.max(50, H - hy - 22);
        const bins = new Array(BINS).fill(0);
        for (const e of errs) bins[U.clamp(Math.round(e), 0, BINS - 1)]++;
        const top = Math.max(1, ...bins);
        D.rect(g, hx, hy, hw, hh, 'rgba(0,0,0,0.35)');
        const cw = hw / BINS;
        bins.forEach((c, i) => { const h = (c / top) * (hh - 14); D.rect(g, hx + i * cw + 1, hy + hh - h, cw - 2, h, i > 5 ? C.bad : col); });
        for (const ms of [0, 10, 20, 30]) D.text(g, ms === 30 ? '30+' : String(ms), hx + ms * cw + cw / 2, hy + hh + 3, { size: 9, color: C.dim, align: 'center' });
        D.text(g, GTL.L(`오차 히스토그램 (ms, 최근 ${errs.length}개)`, `Error histogram (ms, last ${errs.length})`), hx + 4, hy + 3, { size: 10, color: C.dim });

        const s = stats();
        ctx.stat(GTL.L('평균 오차', 'Mean error'), s ? s.mean.toFixed(2) + ' ms' : '-');
        ctx.stat(GTL.L('지터 (표준편차)', 'Jitter (std dev)'), s ? s.sd.toFixed(2) + ' ms' : '-');
        ctx.stat(GTL.L('최대 오차', 'Max error'), s ? s.mx.toFixed(1) + ' ms' : '-');
        ctx.stat(GTL.L('5ms 넘게 늦은 노트', 'Notes over 5ms late'), s ? (s.late * 100).toFixed(1) + ' %' : '-');
        ctx.stat(GTL.L('소리', 'Sound'), typeof AudioContext === 'undefined' ? GTL.L('미지원', 'Not supported') : !ac ? GTL.L('꺼짐', 'Off') : audible() ? GTL.L('재생 중', 'Playing') : GTL.L('음소거 (다른 뷰 선택)', 'Muted (other view selected)'));
      },
      onParam(key) { if (key === 'mode') { clearRec(); restart(); } },
      onAction(key) {
        if (key === 'sound') soundToggle();
        if (key === 'clear') clearRec();
      },
      dispose() { alive = false; clearTimeout(timerId); stopAudio(); },
    };
  },
});
