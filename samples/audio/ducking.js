// 덕킹 (사이드체인): 대사가 나올 때 음악 볼륨을 낮춤
GTL.register({
  id: 'ducking',
  title: '덕킹 (Ducking)',
  summary: '대사와 음악이 같은 크기로 겹치면 대사가 묻힘. 대사가 나오는 동안 음악을 몇 dB 낮추는 덕킹을 켜면 음악 전체를 줄이지 않고도 대사가 또렷해짐.',
  views: { a: '덕킹 없음', b: '덕킹 (-10dB)' },
  controls: '조작 없음. 몇 초마다 대사가 나옴.',
  info: `
    <p><b>덕킹(Ducking)</b>은 중요한 소리(대사, 내레이션)가 나오는 동안 다른 버스(음악, 환경음)의 볼륨을 낮추는 믹싱 기법.
    오리가 물에 머리를 숙이는 모양에서 온 이름.</p>
    <p>음악을 처음부터 작게 두면 대사가 없을 때 장면이 허전해짐. 덕킹은 필요한 순간에만 줄여서 둘 다 살림.</p>
    <ul>
      <li><b>감소량</b>: 보통 -6~-12dB. 너무 크면 음악이 끊기는 느낌.</li>
      <li><b>어택(Attack)</b>: 줄어드는 데 걸리는 시간. 짧으면 대사 첫 음절이 안 묻힘. 너무 짧으면 "펌핑"이 들림.</li>
      <li><b>릴리스(Release)</b>: 다시 올라오는 시간. 문장 사이 짧은 쉼마다 음악이 오르내리지 않게 길게 둠.</li>
      <li><b>홀드(Hold)</b>: 대사가 끝난 뒤 바로 올리지 않고 기다리는 시간</li>
    </ul>
    <p>트리거는 두 가지. 대사 이벤트 시작과 끝으로 거는 방식(이 샘플)과, 대사 버스의 실제 레벨로 거는 사이드체인 컴프레서 방식.
    Wwise의 Auto-ducking, FMOD의 Sidechain + Compressor, Unity Audio Mixer의 Duck Volume이 대표적.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 190" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="4" y="32">${L('대사', 'Dialogue')}</text>
    <rect x="140" y="20" width="200" height="18" class="f-accent"/>
    <text x="240" y="33" text-anchor="middle" class="t-small">${L('재생 중', 'playing')}</text>
    <text x="4" y="78">${L('음악 이득', 'Music gain')}</text>
    <text x="96" y="68" text-anchor="end" class="t-small t-mono">0dB</text><text x="96" y="124" text-anchor="end" class="t-small t-mono">-10dB</text>
    <line x1="100" y1="65" x2="530" y2="65" class="d-a" stroke-dasharray="6 3"/>
    <text x="528" y="58" text-anchor="end" class="t-a t-small">${L('A 덕킹 없음', 'A no ducking')}</text>
    <path d="M100,65 L140,65 L165,120 L380,120 Q420,120 450,90 Q480,65 530,65" class="d-b"/>
    <text x="250" y="114" text-anchor="middle" class="t-b t-small">${L('B 덕킹', 'B ducking')}</text>
    <line x1="140" y1="42" x2="140" y2="150" class="d-dim" stroke-dasharray="3 3"/><line x1="165" y1="120" x2="165" y2="150" class="d-dim" stroke-dasharray="3 3"/>
    <line x1="340" y1="42" x2="340" y2="150" class="d-dim" stroke-dasharray="3 3"/><line x1="380" y1="120" x2="380" y2="150" class="d-dim" stroke-dasharray="3 3"/>
    <line x1="510" y1="65" x2="510" y2="150" class="d-dim" stroke-dasharray="3 3"/>
    <path d="M141,146 L164,146" class="d-line" marker-end="url(#arr)"/><path d="M341,146 L379,146" class="d-line" marker-end="url(#arr)"/><path d="M381,146 L509,146" class="d-line" marker-end="url(#arr)"/>
    <text x="152" y="162" text-anchor="middle" class="t-small">${L('어택', 'attack')}</text>
    <text x="360" y="162" text-anchor="middle" class="t-small">${L('홀드', 'hold')}</text>
    <text x="445" y="162" text-anchor="middle" class="t-small">${L('릴리스', 'release')}</text>
    <text x="4" y="184" class="t-small t-dim">${L('대사가 시작되면 짧게 내리고, 끝난 뒤 잠시 기다렸다가 천천히 올림', 'Duck fast when dialogue starts. After it ends, wait, then rise slowly')}</text>
  </svg>`,
  look: [
    '아래 그래프의 빨간 구간은 대사가 음악보다 6dB 넘게 크지 않은 구간. A는 대사마다 빨간 구간이 길고, B는 거의 없음.',
    'B의 어택을 600ms 이상으로 늘리면 대사 첫 부분에 다시 빨간 구간이 생김',
    'B의 릴리스를 50ms로 줄이고 홀드를 0으로 두면 문장 사이마다 음악 선이 출렁임 (펌핑)',
    '"음악 레벨"을 -12dB로 낮추면 A도 대사가 들리지만, 대사 없는 구간의 음악도 같이 작아짐',
  ],
  refs: [
    { type: 'engine', title: 'Unity Manual - Audio Mixer, Duck Volume', url: 'https://docs.unity3d.com/Manual/AudioMixer.html', note: 'Send로 사이드체인을 연결하는 Duck Volume 이펙트' },
    { type: 'engine', title: 'Wwise - Auto-ducking (Bus Properties)', note: '버스 단위로 다른 버스를 지정한 dB만큼 낮춤. Fade out, Fade in, Recovery time 설정.' },
    { type: 'engine', title: 'MDN - AudioParam.setTargetAtTime', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime', note: '게인 변화를 부드럽게 넣는 방법' },
    { type: 'book', title: 'Game Audio Programming: Principles and Practices (Guy Somberg 편)', year: 2016, note: '믹싱, 버스, 덕킹 같은 런타임 믹스 기법' },
  ],
  params: [
    { key: 'duck', label: '덕킹', type: 'bool', a: false, b: true, group: '덕킹' },
    { key: 'amount', label: '감소량 (dB)', type: 'range', min: -24, max: 0, step: 1, default: -10, when: (p) => p.duck },
    { key: 'attack', label: '어택 (ms)', type: 'range', min: 10, max: 1500, step: 10, default: 120, when: (p) => p.duck },
    { key: 'release', label: '릴리스 (ms)', type: 'range', min: 50, max: 3000, step: 10, default: 900, when: (p) => p.duck },
    { key: 'hold', label: '홀드 (ms)', type: 'range', min: 0, max: 1500, step: 10, default: 300, when: (p) => p.duck },
    { key: 'musicDb', label: '음악 레벨 (dB)', type: 'range', min: -24, max: 0, step: 1, default: -4, shared: true, group: '장면' },
    { key: 'dlgDb', label: '대사 레벨 (dB)', type: 'range', min: -24, max: 0, step: 1, default: -6, shared: true },
    { key: 'sound', label: '소리 켜기', type: 'button', buttonLabel: '소리 켜기/끄기', group: '소리' },
    { key: 'listen', label: '소리 내는 뷰', type: 'select', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], default: 'a', shared: true },
    { key: 'vol', label: '음량', type: 'range', min: 0, max: 1, step: 0.01, default: 0.4, shared: true },
  ],
  en: {
    title: 'Ducking',
    summary: 'When dialogue and music overlap at the same level, the dialogue gets buried. Ducking lowers the music by a few dB while dialogue plays. The dialogue becomes clear without making all the music quieter.',
    views: { a: 'No ducking', b: 'Ducking (-10dB)' },
    controls: 'No input. A line of dialogue plays every few seconds.',
    info: `
    <p><b>Ducking</b> is a mixing technique. It lowers the volume of other buses (music, ambience) while an important sound (dialogue, narration) plays.
    The name comes from a duck dipping its head into the water.</p>
    <p>If you keep the music quiet from the start, the scene feels empty when no one speaks. Ducking lowers it only when needed, so both work.</p>
    <ul>
      <li><b>Amount</b>: usually -6~-12 dB. Too much makes the music feel like it cuts out.</li>
      <li><b>Attack</b>: the time it takes to go down. A short attack keeps the first syllable clear. Too short and you hear "pumping".</li>
      <li><b>Release</b>: the time it takes to come back up. Keep it long so the music does not rise and fall at every short pause between sentences.</li>
      <li><b>Hold</b>: the time to wait after the dialogue ends before raising the music.</li>
    </ul>
    <p>There are two kinds of trigger. One uses the start and end of dialogue events (this sample). The other is a sidechain compressor that reacts to the real level of the dialogue bus.
    Common examples are Wwise Auto-ducking, FMOD Sidechain + Compressor, and Duck Volume in the Unity Audio Mixer.</p>`,
    look: [
      'The red areas in the bottom graph are where dialogue is not more than 6 dB louder than the music. A has long red areas for every line. B has almost none.',
      'Raise B\'s attack to 600 ms or more. Red areas appear again at the start of each line.',
      'Lower B\'s release to 50 ms and set hold to 0. The music line bounces between sentences (pumping).',
      'Lower "Music level" to -12 dB. You can hear the dialogue in A too, but the music gets quieter where there is no dialogue.',
    ],
    refs: [
      'The Duck Volume effect, which connects a sidechain through a Send.',
      'Lowers other buses by a set dB, per bus. Settings for Fade out, Fade in, and Recovery time.',
      'How to change gain smoothly.',
      { title: 'Game Audio Programming: Principles and Practices (ed. Guy Somberg)', note: 'Runtime mix techniques such as mixing, buses, and ducking.' },
    ],
    params: {
      duck: { label: 'Ducking', group: 'Ducking' },
      amount: 'Amount (dB)',
      attack: 'Attack (ms)',
      release: 'Release (ms)',
      hold: 'Hold (ms)',
      musicDb: { label: 'Music level (dB)', group: 'Scene' },
      dlgDb: 'Dialogue level (dB)',
      sound: { label: 'Sound on', buttonLabel: 'Sound on/off', group: 'Sound' },
      listen: 'View that plays sound',
      vol: 'Volume',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const col = ctx.side === 'a' ? C.a : C.b;
    const SAMPLE = 1 / 30, HIST = 240, CLEAR_DB = 6;   // 대사가 음악보다 6dB 이상 크면 "또렷함"으로 봄 (이 샘플의 기준)
    const dbToLin = (db) => Math.pow(10, db / 20);
    const noise = U.noise(ctx.seed + 3);

    let rng, t, lines, nextLine, duckDb, lastSpeech, hist, sampleAcc, speechFrames, buriedFrames, ratioSum;
    function init() {
      rng = U.rng(ctx.seed);
      t = 0; lines = []; nextLine = 1.2; duckDb = 0; lastSpeech = -99; hist = []; sampleAcc = 0;
      speechFrames = 0; buriedFrames = 0; ratioSum = 0;
    }
    init();

    // 대사 한 줄 = 음절 여러 개. 같은 시드라 두 뷰가 같은 대사 일정을 가짐
    function makeLine(start) {
      const syl = [];
      let x = start;
      const words = rng.int(5, 11);
      for (let i = 0; i < words; i++) {
        const len = rng.range(0.12, 0.26);
        syl.push({ t0: x, t1: x + len, amp: rng.range(0.6, 1), f: rng.range(400, 900), p: rng.range(110, 160) });
        x += len + (rng.chance(0.25) ? rng.range(0.15, 0.3) : rng.range(0.02, 0.06));
      }
      return { start, end: x, syl };
    }
    function speechAt(time) {
      for (const L of lines) {
        if (time < L.start || time > L.end) continue;
        for (const s of L.syl) if (time >= s.t0 && time <= s.t1) return { env: s.amp * Math.sin(Math.PI * (time - s.t0) / (s.t1 - s.t0)), s, line: true };
        return { env: 0, s: null, line: true };
      }
      return { env: 0, s: null, line: false };
    }

    // ── 오디오: "소리 켜기" 버튼을 눌러야 생성 ──
    let ac = null, master = null, musicGain = null, dlgGain = null, chordOscs = [], voice = null, formants = [];
    const CHORDS = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]];
    function soundToggle() {
      if (ac) { stopAudio(); return; }
      if (typeof AudioContext === 'undefined') return;
      ac = new AudioContext();
      master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
      musicGain = ac.createGain(); musicGain.gain.value = 0; musicGain.connect(master);
      chordOscs = [0, 1, 2, 3].map((i) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = i === 3 ? 'sine' : 'triangle'; o.frequency.value = i === 3 ? 110 : CHORDS[0][i];
        g.gain.value = i === 3 ? 0.35 : 0.18;
        o.connect(g); g.connect(musicGain); o.start();
        return o;
      });
      dlgGain = ac.createGain(); dlgGain.gain.value = 0; dlgGain.connect(master);
      voice = ac.createOscillator(); voice.type = 'sawtooth'; voice.frequency.value = 130;
      formants = [700, 1200].map((f) => {
        const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 6;
        voice.connect(bp); bp.connect(dlgGain);
        return bp;
      });
      voice.start();
      if (ac.resume) ac.resume();
    }
    function stopAudio() {
      if (!ac) return;
      try { ac.close(); } catch (e) { /* 이미 닫힘 */ }
      ac = null; master = null; musicGain = null; dlgGain = null; chordOscs = []; voice = null; formants = [];
    }
    const audible = () => !!ac && P.listen === ctx.side;

    function musicDbAt(time) { return P.musicDb + 2 * noise.perlin2(time * 0.4, 0.5); }   // 음악 자체의 셈여림 ±2dB

    return {
      update(dt) {
        t += dt;
        if (t >= nextLine) { const L = makeLine(t); lines.push(L); nextLine = L.end + rng.range(1.6, 3.2); }
        lines = lines.filter((L) => L.end > t - 9);
        const sp = speechAt(t);
        if (sp.line) lastSpeech = t;
        // 덕킹 게인 (dB에서 일정 속도로 이동)
        const amount = P.duck ? P.amount : 0;
        const active = P.duck && t - lastSpeech <= P.hold / 1000;
        const target = active ? amount : 0;
        const span = Math.max(1, Math.abs(amount));
        if (target < duckDb) duckDb = Math.max(target, duckDb - (span / (P.attack / 1000)) * dt);
        else duckDb = Math.min(target, duckDb + (span / (P.release / 1000)) * dt);
        if (!P.duck) duckDb = 0;

        const mDb = musicDbAt(t) + duckDb;
        const dDb = sp.env > 0.05 ? P.dlgDb + 20 * Math.log10(sp.env) : -60;
        if (sp.env > 0.3) {
          const ratio = P.dlgDb - mDb;           // 음절 중심부의 대사 대 음악 비율
          speechFrames += dt; ratioSum += ratio * dt;
          if (ratio < CLEAR_DB) buriedFrames += dt;
        }
        sampleAcc += dt;
        while (sampleAcc >= SAMPLE) {
          sampleAcc -= SAMPLE;
          hist.push({ m: mDb, d: dDb, duck: duckDb, buried: sp.line && sp.env > 0.3 && P.dlgDb - mDb < CLEAR_DB, line: sp.line });
          if (hist.length > HIST) hist.shift();
        }

        if (ac) {
          const now = ac.currentTime;
          master.gain.setTargetAtTime(audible() ? P.vol : 0, now, 0.03);
          musicGain.gain.setTargetAtTime(dbToLin(mDb) * 0.6, now, 0.02);
          const chord = CHORDS[Math.floor(t / 2) % 4];
          chordOscs.forEach((o, i) => o.frequency.setTargetAtTime(i === 3 ? chord[0] / 2 : chord[i], now, 0.01));
          dlgGain.gain.setTargetAtTime(sp.env > 0 ? dbToLin(P.dlgDb) * sp.env * 2.5 : 0, now, 0.012);
          if (sp.s) {
            voice.frequency.setTargetAtTime(sp.s.p, now, 0.03);
            formants[0].frequency.setTargetAtTime(sp.s.f, now, 0.02);
            formants[1].frequency.setTargetAtTime(sp.s.f * 2.2, now, 0.02);
          }
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const sp = speechAt(t);
        // ── 레벨 미터 ──
        const mDb = musicDbAt(t) + duckDb;
        const dDb = sp.env > 0.05 ? P.dlgDb + 20 * Math.log10(sp.env) : -60;
        const meter = (x, label, db, c) => {
          const h = H * 0.32, y = 30, v = U.clamp((db + 36) / 36, 0, 1);
          D.rect(g, x, y, 26, h, 'rgba(0,0,0,0.4)');
          D.rect(g, x, y + h * (1 - v), 26, h * v, c);
          D.text(g, label, x + 13, y + h + 6, { size: 11, align: 'center', color: C.text });
          D.text(g, db > -59 ? db.toFixed(1) + 'dB' : '-', x + 13, y + h + 20, { size: 10, align: 'center', color: C.dim });
        };
        meter(20, GTL.L('음악', 'Music'), mDb, col);
        meter(64, GTL.L('대사', 'Dialogue'), dDb, C.good);
        // 덕킹 게인 표시
        const dx = 120, dy = 30, dw = Math.max(80, W - dx - 20);
        D.text(g, GTL.L(`덕킹 게인 ${duckDb.toFixed(1)} dB`, `Ducking gain ${duckDb.toFixed(1)} dB`), dx, dy, { size: 13, color: P.duck ? col : C.dim });
        D.rect(g, dx, dy + 22, dw, 10, 'rgba(0,0,0,0.4)');
        D.rect(g, dx + dw * (1 - Math.min(1, -duckDb / 24)), dy + 22, dw * Math.min(1, -duckDb / 24), 10, col);
        D.text(g, sp.line ? GTL.L('대사 중', 'Dialogue playing') : GTL.L('대사 없음', 'No dialogue'), dx, dy + 42, { size: 12, color: sp.line ? C.good : C.dim });
        const ratio = P.dlgDb - mDb;
        D.text(g, GTL.L(`대사 - 음악 = ${ratio.toFixed(1)} dB`, `Dialogue - music = ${ratio.toFixed(1)} dB`), dx, dy + 62, { size: 12, color: ratio >= CLEAR_DB ? C.good : C.bad });

        // ── 시간 그래프 (dB) ──
        const px = 40, py = H * 0.32 + 72, pw = W - 56, ph = Math.max(60, H - py - 12);
        D.rect(g, px, py, pw, ph, 'rgba(0,0,0,0.35)');
        const yOf = (db) => py + ph - U.clamp((db + 36) / 36, 0, 1) * ph;
        for (let db = 0; db >= -36; db -= 12) {
          D.line(g, px, yOf(db), px + pw, yOf(db), C.grid, 1);
          D.text(g, db + 'dB', px - 4, yOf(db) - 5, { size: 9, color: C.dim, align: 'right' });
        }
        const n = hist.length, step = pw / (HIST - 1), x0 = px + pw - (n - 1) * step;
        for (let i = 0; i < n; i++) if (hist[i].buried) D.rect(g, x0 + i * step - step / 2, py, step + 0.5, ph, 'rgba(255,83,112,0.22)');
        // 대사 레벨 (채움)
        g.beginPath(); g.moveTo(x0, py + ph);
        for (let i = 0; i < n; i++) g.lineTo(x0 + i * step, yOf(hist[i].d));
        g.lineTo(x0 + (n - 1) * step, py + ph); g.closePath();
        g.fillStyle = 'rgba(102,209,122,0.35)'; g.fill();
        // 음악 레벨
        g.beginPath();
        for (let i = 0; i < n; i++) { const x = x0 + i * step, y = yOf(hist[i].m); i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.strokeStyle = col; g.lineWidth = 2; g.stroke();
        D.text(g, GTL.L('8초 기록. 선 = 음악, 초록 = 대사, 빨강 = 대사가 묻힌 구간', '8 s history. Line = music, green = dialogue, red = dialogue buried'), px + 4, py + 3, { size: 10, color: C.dim });

        ctx.stat(GTL.L('대사가 묻힌 비율', 'Dialogue buried'), speechFrames > 0 ? ((buriedFrames / speechFrames) * 100).toFixed(0) + ' %' : '-');
        ctx.stat(GTL.L('대사 중 평균 대사-음악', 'Avg dialogue-music during dialogue'), speechFrames > 0 ? (ratioSum / speechFrames).toFixed(1) + ' dB' : '-');
        ctx.stat(GTL.L('덕킹 게인', 'Ducking gain'), duckDb.toFixed(1) + ' dB');
        ctx.stat(GTL.L('소리', 'Sound'), typeof AudioContext === 'undefined' ? GTL.L('미지원', 'Not supported') : !ac ? GTL.L('꺼짐', 'Off') : audible() ? GTL.L('재생 중', 'Playing') : GTL.L('음소거 (다른 뷰 선택)', 'Muted (other view selected)'));
      },
      onAction(key) { if (key === 'sound') soundToggle(); },
      dispose() { stopAudio(); },
    };
  },
});
