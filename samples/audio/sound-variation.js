// 반복 피로 줄이기: 같은 소리 반복 vs 피치/볼륨 랜덤화 + 변형 풀
GTL.register({
  id: 'sound-variation',
  title: '반복 피로 줄이기 (랜덤화 & 변형 풀)',
  summary: '발소리처럼 자주 나는 소리를 매번 똑같이 재생하면 기계적으로 들림. 피치와 볼륨을 조금씩 흔들고, 여러 변형을 연속 중복 없이 고르면 같은 이벤트도 자연스럽게 들림.',
  views: { a: '같은 소리 반복', b: '랜덤화 + 셔플 변형 풀' },
  controls: '조작 없음. 캐릭터가 일정 간격으로 발소리를 냄. Space를 누르면 한 번 더 냄.',
  info: `
    <p>같은 샘플이 짧은 간격으로 반복되면 귀가 금방 패턴을 알아챔. 이것을 <b>반복 피로(Repetition Fatigue)</b> 또는 "머신건 효과"라고 부름.</p>
    <p>흔히 쓰는 처방은 세 가지</p>
    <ul>
      <li><b>피치 랜덤화</b>: 재생 속도를 ±1~2반음 안에서 흔듦. 비용이 거의 없음.</li>
      <li><b>볼륨 랜덤화</b>: ±1~3dB. 너무 크면 소리가 튀어 보임.</li>
      <li><b>변형 풀</b>: 같은 이벤트에 녹음 여러 개를 두고 고름. 완전 무작위는 같은 것이 연달아 나올 수 있음. <b>셔플</b>(한 바퀴 다 돌기 전에는 중복 없음)이나 "직전 것 제외"가 흔한 규칙.</li>
    </ul>
    <p>FMOD의 Multi Instrument, Wwise의 Random Container가 이 기능을 제공. 순차(라운드 로빈)는 중복은 없지만 주기가 들림.</p>
    <p>이 샘플의 변형은 코드로 만든 노이즈 버스트(필터, 길이, 저음 성분이 다름). 위쪽 줄은 각 변형의 파형.</p>`,
  diagram: (L) => {
    const row = (y, seq, cls, dy, bad) => seq.map((v, i) => {
      const x = 130 + i * 38, yy = y + (dy ? dy[i] : 0);
      return `<rect x="${x}" y="${yy}" width="32" height="22" rx="3" class="${bad && bad.includes(i) ? 'd-bad' : 'f-dim'}"/><text x="${x + 16}" y="${yy + 15}" text-anchor="middle" class="t-mono ${cls}">${v}</text>`;
    }).join('');
    return `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <text x="4" y="30" class="t-a">${L('A 같은 소리', 'A same sound')}</text>
    <text x="4" y="43" class="t-dim t-small">${L('변형 1개, 흔들기 없음', '1 variant, no jitter')}</text>
    ${row(16, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 't-a')}
    <text x="4" y="86">${L('완전 무작위', 'Pure random')}</text>
    <text x="4" y="99" class="t-dim t-small">${L('같은 것이 연달아 나옴', 'repeats back to back')}</text>
    ${row(72, [2, 3, 3, 1, 4, 4, 4, 2, 1, 3], '', null, [2, 5, 6])}
    <text x="4" y="142" class="t-b">${L('B 셔플', 'B shuffle')}</text>
    <text x="4" y="155" class="t-dim t-small">${L('높이 = 피치 흔들기', 'height = pitch jitter')}</text>
    ${row(128, [3, 1, 4, 2, 1, 4, 3, 2, 3, 1], 't-b', [-5, 3, -2, 6, -4, 1, 5, -6, 0, 3])}
    <line x1="279" y1="118" x2="279" y2="164" class="d-dim" stroke-dasharray="3 3"/><line x1="431" y1="118" x2="431" y2="164" class="d-dim" stroke-dasharray="3 3"/>
    <text x="203" y="176" text-anchor="middle" class="t-small t-dim">${L('한 바퀴: 4개 모두 한 번씩', 'one bag: each of 4 once')}</text>
    <text x="355" y="176" text-anchor="middle" class="t-small t-dim">${L('다음 바퀴', 'next bag')}</text>
    <text x="4" y="192" class="t-small t-dim">${L('빨간 칸은 직전과 같은 변형. 셔플은 바퀴 경계에서도 직전 것을 피함', 'Red cells repeat the previous variant. Shuffle avoids that, even across bags')}</text>
    </svg>`;
  },
  look: [
    '아래 타임라인을 보면 A는 모든 막대가 같은 높이, 같은 색. B는 높이(볼륨), 위치(피치), 색(변형)이 매번 다름.',
    'B의 고르기 방식을 "완전 무작위"로 바꾸면 "직전과 같은 변형" 수가 올라감. 셔플은 0 유지.',
    '"순차 (라운드 로빈)"는 중복은 없지만 색이 일정한 주기로 반복됨. 간격을 짧게 하면 리듬처럼 들림.',
    '피치 범위를 4반음 이상으로 올리면 서로 다른 소리처럼 들리기 시작. 1~2반음이 보통 적당함.',
  ],
  refs: [
    { type: 'engine', title: 'Wwise - Random Container', note: 'Shuffle 모드, "Avoid repeating last x played" 옵션' },
    { type: 'engine', title: 'FMOD Studio - Multi Instrument (Playlist)', note: '재생 목록 무작위, 순차 선택. 이벤트 속성의 Pitch, Volume 랜덤화(Modulator).' },
    { type: 'engine', title: 'MDN - AudioBufferSourceNode.playbackRate', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/playbackRate', note: '재생 속도로 피치를 바꿈' },
    { type: 'book', title: 'Game Audio Programming: Principles and Practices (Guy Somberg 편)', year: 2016, note: '변형 선택, 랜덤화 등 사운드 엔진 실무 기법 모음' },
  ],
  params: [
    { key: 'variants', label: '변형 수', type: 'int', min: 1, max: 6, a: 1, b: 4, group: '변형' },
    { key: 'pick', label: '고르기 방식', type: 'select', options: [
      { value: 'random', label: '완전 무작위' },
      { value: 'shuffle', label: '셔플 (한 바퀴 중복 없음)' },
      { value: 'sequential', label: '순차 (라운드 로빈)' },
    ], default: 'shuffle', when: (p) => p.variants > 1 },
    { key: 'pitch', label: '피치 범위 (± 반음)', type: 'range', min: 0, max: 6, step: 0.25, a: 0, b: 1.5, group: '랜덤화' },
    { key: 'volDb', label: '볼륨 범위 (± dB)', type: 'range', min: 0, max: 8, step: 0.5, a: 0, b: 2.5 },
    { key: 'interval', label: '발소리 간격 (초)', type: 'range', min: 0.1, max: 1, step: 0.01, default: 0.32, shared: true, group: '장면' },
    { key: 'sound', label: '소리 켜기', type: 'button', buttonLabel: '소리 켜기/끄기', group: '소리' },
    { key: 'listen', label: '소리 내는 뷰', type: 'select', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], default: 'a', shared: true },
    { key: 'vol', label: '음량', type: 'range', min: 0, max: 1, step: 0.01, default: 0.5, shared: true },
  ],
  en: {
    title: 'Reducing Repetition Fatigue (Randomization & Variation Pools)',
    summary: 'Sounds that play often, like footsteps, sound mechanical if they are the same every time. Shift the pitch and volume a little, and pick from several variations without repeats. The same event then sounds natural.',
    views: { a: 'Same sound repeated', b: 'Randomization + shuffled variation pool' },
    controls: 'No input. The character makes a footstep at a fixed interval. Press Space to play one more.',
    info: `
    <p>When the same sample repeats at short intervals, the ear quickly notices the pattern. This is called <b>repetition fatigue</b> or the "machine gun effect".</p>
    <p>There are three common fixes.</p>
    <ul>
      <li><b>Pitch randomization</b>: shift the playback rate within ±1~2 semitones. It costs almost nothing.</li>
      <li><b>Volume randomization</b>: ±1~3 dB. Too much makes sounds stand out.</li>
      <li><b>Variation pool</b>: keep several recordings for the same event and pick one. Pure random can pick the same one twice in a row. <b>Shuffle</b> (no repeats until a full round is done) or "skip the last one" are common rules.</li>
    </ul>
    <p>FMOD's Multi Instrument and Wwise's Random Container offer this feature. Sequential (round robin) has no repeats, but you can hear the cycle.</p>
    <p>The variations in this sample are noise bursts made in code (they differ in filter, length, and low end). The top row shows the waveform of each variation.</p>`,
    look: [
      'Look at the timeline at the bottom. In A, every bar has the same height and color. In B, the height (volume), position (pitch), and color (variation) change every time.',
      'Switch B\'s pick mode to "Pure random". The "Same variation as last" count goes up. Shuffle keeps it at 0.',
      '"Sequential (round robin)" has no repeats, but the colors repeat in a fixed cycle. With a short interval, it sounds like a rhythm.',
      'Raise the pitch range to 4 semitones or more. The steps start to sound like different sounds. 1~2 semitones is usually enough.',
    ],
    refs: [
      'Shuffle mode and the "Avoid repeating last x played" option.',
      'Random and sequential playlist selection. Pitch and volume randomization (Modulator) in event properties.',
      'Changes pitch through the playback rate.',
      { title: 'Game Audio Programming: Principles and Practices (ed. Guy Somberg)', note: 'A collection of practical sound engine techniques such as variation selection and randomization.' },
    ],
    params: {
      variants: { label: 'Variation count', group: 'Variations' },
      pick: { label: 'Pick mode', options: { random: 'Pure random', shuffle: 'Shuffle (no repeats per round)', sequential: 'Sequential (round robin)' } },
      pitch: { label: 'Pitch range (± semitones)', group: 'Randomization' },
      volDb: 'Volume range (± dB)',
      interval: { label: 'Footstep interval (s)', group: 'Scene' },
      sound: { label: 'Sound on', buttonLabel: 'Sound on/off', group: 'Sound' },
      listen: 'View that plays sound',
      vol: 'Volume',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const col = ctx.side === 'a' ? C.a : C.b;
    const MAXV = 6, VIS_SR = 8000;

    // 변형 정의: 같은 시드라 A, B가 같은 변형 세트를 가짐
    const defs = [];
    { const r = U.rng(ctx.seed + 31);
      for (let i = 0; i < MAXV; i++) defs.push({ len: r.range(0.07, 0.14), cutoff: r.range(0.08, 0.35), thump: r.range(60, 120), thumpAmt: r.range(0.3, 0.8), seed: r.int(1, 1e6) }); }
    // 샘플 배열 생성 (시각화와 AudioBuffer 공용)
    function synth(def, sr, out) {
      const r = U.rng(def.seed), n = out.length;
      const k = 1 - Math.exp(-U.TAU * def.cutoff * 4000 / sr);   // 1극 로우패스 계수
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        const env = t < 0.004 ? t / 0.004 : Math.exp(-(t - 0.004) / (def.len * 0.3));
        lp += (r.next() * 2 - 1 - lp) * k;
        out[i] = (lp * 1.6 + Math.sin(U.TAU * def.thump * t) * def.thumpAmt * Math.exp(-t / 0.03)) * env * 0.7;
      }
      return out;
    }
    const vis = defs.map((d) => synth(d, VIS_SR, new Float32Array(Math.ceil(d.len * VIS_SR))));

    let rng, timer, events, bag, seq, lastIdx, repeats, walkX, stepCount;
    function init() {
      rng = U.rng(ctx.seed + 7);
      timer = 0.2; events = []; bag = []; seq = 0; lastIdx = -1; repeats = 0; walkX = 0; stepCount = 0;
    }
    init();

    function pickVariant() {
      const n = P.variants;
      if (n <= 1) return 0;
      if (P.pick === 'random') return rng.int(0, n - 1);
      if (P.pick === 'sequential') return (seq++) % n;
      // 셔플 백: 비면 다시 채움. 새 바퀴의 첫 값이 직전 값과 같으면 뒤로 보냄
      bag = bag.filter((i) => i < n);
      if (!bag.length) {
        bag = rng.shuffle(Array.from({ length: n }, (_, i) => i));
        if (bag[bag.length - 1] === lastIdx && n > 1) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
      }
      return bag.pop();
    }

    function step() {
      // 랜덤 값은 항상 같은 횟수만큼 뽑음 (범위가 0이어도). 파라미터를 바꿔도 장면 난수 흐름이 같게 유지됨
      const u1 = rng.next() * 2 - 1, u2 = rng.next() * 2 - 1;
      const idx = pickVariant();
      const semi = u1 * P.pitch, db = u2 * P.volDb;
      if (idx === lastIdx) repeats++;
      lastIdx = idx;
      stepCount++;
      events.push({ idx, semi, db, foot: stepCount & 1 });
      if (events.length > 24) events.shift();
      play(idx, semi, db);
    }

    // ── 오디오: "소리 켜기" 버튼을 눌러야 생성 ──
    let ac = null, master = null, bufs = [];
    function soundToggle() {
      if (ac) { stopAudio(); return; }
      if (typeof AudioContext === 'undefined') return;
      ac = new AudioContext();
      master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
      bufs = defs.map((d) => {
        const b = ac.createBuffer(1, Math.ceil(d.len * ac.sampleRate), ac.sampleRate);
        synth(d, ac.sampleRate, b.getChannelData(0));
        return b;
      });
      if (ac.resume) ac.resume();
    }
    function stopAudio() {
      if (!ac) return;
      try { ac.close(); } catch (e) { /* 이미 닫힘 */ }
      ac = null; master = null; bufs = [];
    }
    const audible = () => !!ac && P.listen === ctx.side;
    function play(idx, semi, db) {
      if (!ac || !audible()) return;
      const src = ac.createBufferSource(), g = ac.createGain();
      src.buffer = bufs[idx];
      src.playbackRate.value = Math.pow(2, semi / 12);
      g.gain.value = Math.pow(10, db / 20);
      src.connect(g); g.connect(master); src.start();
    }

    // 최근 이벤트 통계
    function stats() {
      const n = events.length;
      if (!n) return { sd: 0, uniq: 0 };
      let m = 0; for (const e of events) m += e.semi; m /= n;
      let v = 0; for (const e of events) v += (e.semi - m) ** 2;
      const keys = new Set(events.slice(-16).map((e) => `${e.idx}|${e.semi.toFixed(1)}|${e.db.toFixed(1)}`));
      return { sd: Math.sqrt(v / n), uniq: keys.size };
    }

    return {
      update(dt) {
        timer -= dt;
        walkX += dt * 60 / Math.max(0.1, P.interval) * 0.5;
        if (timer <= 0) { timer += P.interval; step(); }
        if (ctx.input.pressed('Space')) step();
        if (ac) master.gain.setTargetAtTime(audible() ? P.vol : 0, ac.currentTime, 0.03);
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        // ── 변형 파형 ──
        const n = P.variants, cw = (W - 24) / MAXV, ch = Math.min(60, H * 0.16);
        for (let i = 0; i < MAXV; i++) {
          const x = 12 + i * cw, y = 10, on = i < n;
          D.rect(g, x + 2, y, cw - 4, ch, on ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.12)', i === lastIdx ? '#fff' : null, 1.5);
          const data = vis[i], c = C.series[i];
          g.beginPath();
          for (let k = 0; k < data.length; k += 4) {
            const xx = x + 4 + (k / (VIS_SR * 0.14)) * (cw - 8), yy = y + ch / 2 - data[k] * ch * 0.45;
            k ? g.lineTo(xx, yy) : g.moveTo(xx, yy);
          }
          g.strokeStyle = on ? c : 'rgba(255,255,255,0.12)'; g.lineWidth = 1; g.stroke();
          D.text(g, `#${i + 1}`, x + 6, y + 3, { size: 10, color: on ? C.text : C.dim });
        }
        // ── 걷는 캐릭터 ──
        const gy = 10 + ch + 70, last = events[events.length - 1];
        D.line(g, 0, gy, W, gy, C.dim, 2);
        const cx = W * 0.5;
        const ox = -(walkX % 40);
        for (let x = ox; x < W; x += 40) D.line(g, x, gy, x - 8, gy + 8, C.grid, 2);
        D.rect(g, cx - 10, gy - 44, 20, 32, col);
        D.circle(g, cx, gy - 52, 9, col);
        const ph = timer / Math.max(0.1, P.interval);
        D.line(g, cx - 4, gy - 12, cx - 4 + (last && last.foot ? 6 : -6) * ph, gy, '#fff', 3);
        D.line(g, cx + 4, gy - 12, cx + 4 - (last && last.foot ? 6 : -6) * ph, gy, '#fff', 3);
        if (last) {
          const age = 1 - ph;
          D.circle(g, cx + (last.foot ? 6 : -6), gy, 6 + age * 24 * Math.pow(10, last.db / 20), null, `rgba(255,255,255,${0.5 * (1 - age)})`, 2);
        }
        // ── 타임라인: 높이 = 볼륨, 세로 위치 = 피치, 색 = 변형 ──
        const ty = gy + 24, th = Math.max(60, H - ty - 14), tx = 12, tw = W - 24;
        D.rect(g, tx, ty, tw, th, 'rgba(0,0,0,0.35)');
        const mid = ty + th / 2;
        D.line(g, tx, mid, tx + tw, mid, C.grid, 1);
        D.text(g, GTL.L('최근 24회. 세로 위치 = 피치(±6반음), 길이 = 볼륨, 색 = 변형', 'Last 24 steps. Height = pitch (±6 semitones), length = volume, color = variation'), tx + 4, ty + 3, { size: 10, color: C.dim });
        const bw = tw / 24;
        events.forEach((e, i) => {
          const x = tx + i * bw + bw / 2;
          const y = mid - (e.semi / 6) * (th / 2 - 14);
          const len = 10 + 18 * Math.pow(10, e.db / 20);
          D.line(g, x, y - len / 2, x, y + len / 2, C.series[e.idx], Math.max(2, bw * 0.5));
          if (i > 0 && events[i - 1].idx === e.idx && P.variants > 1) D.circle(g, x, ty + th - 8, 3, C.bad);
        });

        const s = stats();
        ctx.stat(GTL.L('발소리 수', 'Footsteps'), stepCount);
        ctx.stat(GTL.L('직전과 같은 변형', 'Same variation as last'), P.variants > 1 ? repeats + GTL.L(' 회', ' times') : GTL.L('- (변형 1개)', '- (1 variation)'));
        ctx.stat(GTL.L('피치 표준편차 (최근 24회)', 'Pitch std dev (last 24)'), s.sd.toFixed(2) + GTL.L(' 반음', ' semitones'));
        ctx.stat(GTL.L('서로 다른 소리 (최근 16회)', 'Distinct sounds (last 16)'), s.uniq);
        ctx.stat(GTL.L('소리', 'Sound'), typeof AudioContext === 'undefined' ? GTL.L('미지원', 'Not supported') : !ac ? GTL.L('꺼짐', 'Off') : audible() ? GTL.L('재생 중', 'Playing') : GTL.L('음소거 (다른 뷰 선택)', 'Muted (other view selected)'));
      },
      onAction(key) { if (key === 'sound') soundToggle(); },
      dispose() { stopAudio(); },
    };
  },
});
