// 보이스 제한 & 우선순위 & 가상화: 무제한 재생 vs 우선순위 컬링
GTL.register({
  id: 'voice-limit',
  title: '보이스 제한 & 가상화',
  summary: '전투처럼 소리가 몰리면 동시 재생 수(보이스)가 폭증해 믹스가 뭉개지고 클리핑이 생김. 보이스 수를 제한하고 우선순위와 들리는 크기로 골라 나머지를 가상화하면 중요한 소리만 깨끗하게 남음.',
  views: { a: '제한 없음', b: '우선순위 + 가상화 (최대 8)' },
  controls: '조작 없음. 주변에서 총성, 발소리, 탄피, 폭발이 무작위로 남.',
  info: `
    <p><b>보이스(Voice)</b>는 지금 실제로 믹싱되는 소리 하나. 보이스마다 디코딩, 리샘플링, 필터, 공간화 비용이 듦.
    그래서 엔진은 동시에 처리할 실제 보이스 수에 상한을 둠 (모바일은 수십 개 수준).</p>
    <p>보이스가 많으면 생기는 문제:</p>
    <ul>
      <li>CPU 비용이 보이스 수에 비례해 늘어남</li>
      <li>작은 소리 수십 개가 쌓여 믹스가 탁해지고, 합이 0dBFS를 넘으면 <b>클리핑</b></li>
      <li>중요한 소리(폭발, 대사)가 잡음에 묻힘</li>
    </ul>
    <p>해결 방법:</p>
    <ul>
      <li><b>보이스 상한</b>: 단순히 먼저 온 소리만 받으면, 나중에 온 폭발이 버려짐 ("선착순" 모드)</li>
      <li><b>우선순위 + 들리는 크기</b>: 매 프레임 점수(우선순위 + 거리 감쇠 반영 음량)로 줄을 세워 상위 N개만 실제로 재생</li>
      <li><b>가상화(Virtualization)</b>: 밀려난 소리는 끄지 않고 재생 위치만 계속 셈. 다시 상위로 오르면 이어서 재생. FMOD의 Virtual Voice, Wwise의 Virtual Voice 설정.</li>
      <li><b>종류별 상한</b>: 같은 발소리가 10개씩 쌓이지 않게 종류마다 개수를 제한</li>
    </ul>`,
  diagram: (L) => {
    const req = [[L('발소리', 'Step'), 2], [L('발소리', 'Step'), 3], [L('탄피', 'Shell'), 1], [L('총성', 'Shot'), 6], [L('발소리', 'Step'), 4], [L('폭발', 'Boom'), 9]];
    const list = req.map(([n, s], i) => `<text x="10" y="${42 + i * 20}" class="t-small t-mono">${i + 1}</text><text x="24" y="${42 + i * 20}" class="t-small">${n}</text><rect x="70" y="${33 + i * 20}" width="${s * 8}" height="10" class="f-accent"/>`).join('');
    const slot = (x, y, n, cls) => `<rect x="${x}" y="${y}" width="130" height="20" rx="3" class="f-dim"/><text x="${x + 65}" y="${y + 14}" text-anchor="middle" class="t-small ${cls}">${n}</text>`;
    return `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="18">${L('도착 순서, 점수', 'Arrival order, score')}</text>
    ${list}
    <path d="M160,80 L200,80" class="d-line" marker-end="url(#arr)"/>
    <text x="210" y="18">${L('선착순 (상한 3)', 'First come (limit 3)')}</text>
    ${slot(210, 30, `1 ${req[0][0]}`, '')}${slot(210, 54, `2 ${req[1][0]}`, '')}${slot(210, 78, `3 ${req[2][0]}`, '')}
    <text x="210" y="118" class="t-small">${L('버려짐: 4, 5, 6 (폭발 포함)', 'Dropped: 4, 5, 6 (boom too)')}</text>
    <line x1="210" y1="124" x2="340" y2="124" class="d-bad"/>
    <text x="380" y="18" class="t-b">${L('B 우선순위 (상한 3)', 'B priority (limit 3)')}</text>
    ${slot(380, 30, `6 ${req[5][0]} (9)`, 't-b')}${slot(380, 54, `4 ${req[3][0]} (6)`, 't-b')}${slot(380, 78, `5 ${req[4][0]} (4)`, 't-b')}
    <text x="380" y="118" class="t-small t-dim">${L('가상화: 1, 2, 3', 'Virtual: 1, 2, 3')}</text>
    <text x="380" y="132" class="t-small t-dim">${L('재생 위치만 계속 셈', 'only the play position runs')}</text>
    <text x="4" y="164" class="t-small t-dim">${L('점수 = 우선순위 + 들리는 크기. 매 프레임 다시 정렬해서 상위 N개만 실제로 믹싱', 'Score = priority + audible level. Re-sort every frame and mix only the top N')}</text>
    <text x="4" y="182" class="t-small t-a">${L('A (제한 없음): 6개를 모두 믹싱해서 합이 0dBFS를 넘고 클리핑', 'A (no limit): mixes all 6, the sum passes 0dBFS and clips')}</text>
    </svg>`;
  },
  look: [
    'A의 "실제 보이스" 수와 아래 믹스 레벨 그래프를 보면 자주 0dB(빨간 선)를 넘음. B는 8개 이하로 유지되고 넘는 시간이 훨씬 짧음.',
    'B의 방식을 "선착순"으로 바꾸면 "놓친 폭발" 수가 늘어남. 슬롯이 가득 찬 순간에 온 폭발이 버려짐.',
    '장면에서 속이 빈 원이 가상 보이스. 폭발이 끝나 슬롯이 비면 가상 보이스가 다시 채워짐.',
    '"이벤트 빈도"를 150으로 올리면 A의 보이스가 수십 개까지 늘어남. B의 믹서 비용은 그대로.',
  ],
  refs: [
    { type: 'engine', title: 'FMOD Engine - Virtual Voice System', url: 'https://www.fmod.com/docs/2.02/api/white-papers-virtual-voices.html', note: '실제 보이스 수 제한, 들리는 크기로 정렬, 가상 보이스로 위치만 추적' },
    { type: 'engine', title: 'Wwise - Playback Limit & Priority, Virtual Voices', note: '사운드별 Playback Priority, 거리 기반 우선순위 오프셋, Virtual Voice Behavior' },
    { type: 'engine', title: 'Unity Manual - Audio Source (Priority), Project Settings Audio (Max Real Voices)', url: 'https://docs.unity3d.com/Manual/class-AudioManager.html', note: 'Max Real Voices, Max Virtual Voices.' },
    { type: 'book', title: 'Game Audio Programming: Principles and Practices (Guy Somberg 편)', year: 2016, note: '보이스 관리, 우선순위, 가상화 구현' },
  ],
  params: [
    { key: 'mode', label: '보이스 관리', type: 'select', group: '보이스', options: [
      { value: 'none', label: '제한 없음' },
      { value: 'fcfs', label: '선착순 (상한만)' },
      { value: 'priority', label: '우선순위 + 가상화' },
    ], a: 'none', b: 'priority' },
    { key: 'maxVoices', label: '최대 실제 보이스', type: 'int', min: 1, max: 32, default: 8, when: (p) => p.mode !== 'none' },
    { key: 'perType', label: '종류별 최대', type: 'int', min: 1, max: 16, default: 3, when: (p) => p.mode !== 'none' },
    { key: 'virtDb', label: '가상화 기준 (dB)', type: 'range', min: -60, max: -10, step: 1, default: -36, when: (p) => p.mode === 'priority', help: '이보다 작게 들리면 슬롯이 남아도 가상화' },
    { key: 'rate', label: '이벤트 빈도 (/초)', type: 'range', min: 5, max: 150, step: 1, default: 60, shared: true, group: '장면' },
    { key: 'sound', label: '소리 켜기', type: 'button', buttonLabel: '소리 켜기/끄기', group: '소리' },
    { key: 'listen', label: '소리 내는 뷰', type: 'select', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], default: 'a', shared: true },
    { key: 'vol', label: '음량', type: 'range', min: 0, max: 1, step: 0.01, default: 0.25, shared: true },
  ],
  en: {
    title: 'Voice Limits & Virtualization',
    summary: 'When many sounds pile up, as in combat, the number of playing sounds (voices) explodes. The mix turns to mush and clips. Limit the voice count, pick voices by priority and loudness, and virtualize the rest. Only the important sounds stay clear.',
    views: { a: 'No limit', b: 'Priority + virtualization (max 8)' },
    controls: 'No input. Gunshots, footsteps, shell casings, and explosions play at random around you.',
    info: `
    <p>A <b>voice</b> is one sound that is being mixed right now. Each voice costs decoding, resampling, filtering, and spatialization.
    So engines cap the number of real voices they process at once (a few dozen on mobile).</p>
    <p>Problems with too many voices:</p>
    <ul>
      <li>CPU cost grows with the voice count.</li>
      <li>Dozens of small sounds pile up and make the mix muddy. If the sum goes over 0 dBFS, you get <b>clipping</b>.</li>
      <li>Important sounds (explosions, dialogue) get buried in noise.</li>
    </ul>
    <p>Solutions:</p>
    <ul>
      <li><b>Voice cap</b>: if you only accept sounds that come first, a later explosion gets dropped ("first come" mode).</li>
      <li><b>Priority + loudness</b>: every frame, rank sounds by a score (priority + volume after distance attenuation). Only the top N play for real.</li>
      <li><b>Virtualization</b>: sounds that lose their slot are not stopped. Only their playback position keeps counting. When they rise back to the top, they resume. See the Virtual Voice settings in FMOD and Wwise.</li>
      <li><b>Per-type cap</b>: limit the count per type so the same footstep does not stack 10 times.</li>
    </ul>`,
    look: [
      'Look at A\'s "Real voices" count and the mix level graph below. It often goes over 0 dB (the red line). B stays at 8 or fewer, and the time over 0 dB is much shorter.',
      'Switch B\'s mode to "First come". The "Missed explosions" count goes up. Explosions that arrive when all slots are full get dropped.',
      'Hollow circles in the scene are virtual voices. When an explosion ends and a slot frees up, a virtual voice fills it again.',
      'Raise "Event rate" to 150. A\'s voices grow to dozens. B\'s mixer cost stays the same.',
    ],
    refs: [
      'Limits the real voice count, sorts by loudness, and tracks only the position of virtual voices.',
      'Playback Priority per sound, a distance based priority offset, and Virtual Voice Behavior.',
      'Max Real Voices, Max Virtual Voices.',
      { title: 'Game Audio Programming: Principles and Practices (ed. Guy Somberg)', note: 'Implementing voice management, priority, and virtualization.' },
    ],
    params: {
      mode: { label: 'Voice management', group: 'Voices', options: { none: 'No limit', fcfs: 'First come (cap only)', priority: 'Priority + virtualization' } },
      maxVoices: 'Max real voices',
      perType: 'Max per type',
      virtDb: { label: 'Virtualize below (dB)', help: 'Quieter sounds are virtualized even if slots are free' },
      rate: { label: 'Event rate (/s)', group: 'Scene' },
      sound: { label: 'Sound on', buttonLabel: 'Sound on/off', group: 'Sound' },
      listen: 'View that plays sound',
      vol: 'Volume',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const col = ctx.side === 'a' ? C.a : C.b;
    const R = 50, HIST = 240, SAMPLE = 1 / 30;
    const TYPES = [
      { name: GTL.L('폭발', 'Explosion'), prio: 100, dur: 1.6, gain: 1.6, p: 0.05, color: C.bad, osc: 'sawtooth', f: 60 },
      { name: GTL.L('총성', 'Gunshot'), prio: 60, dur: 0.35, gain: 0.9, p: 0.35, color: C.warn, osc: 'square', f: 190 },
      { name: GTL.L('발소리', 'Footstep'), prio: 30, dur: 0.2, gain: 0.5, p: 0.35, color: C.good, osc: 'triangle', f: 320 },
      { name: GTL.L('탄피', 'Shell casing'), prio: 10, dur: 0.25, gain: 0.35, p: 0.25, color: C.accent, osc: 'sine', f: 2400 },
    ];
    const toDb = (g) => (g > 1e-5 ? 20 * Math.log10(g) : -100);

    let rng, t, voices, spawnAcc, nextId, hist, sampleAcc, clipTime, missedBoom, totalBoom, mix, realN, virtN, burstT;
    function init() {
      rng = U.rng(ctx.seed);
      t = 0; voices = []; spawnAcc = 0; nextId = 1; hist = []; sampleAcc = 0;
      clipTime = 0; missedBoom = 0; totalBoom = 0; mix = 0; realN = 0; virtN = 0; burstT = 2;
    }
    init();

    function spawn() {
      // 난수는 항상 같은 순서와 개수로 뽑음 (두 뷰 장면 동일)
      const u = rng.next(), a = rng.range(0, U.TAU), d = Math.sqrt(rng.next()) * R;
      let acc = 0, type = TYPES[TYPES.length - 1];
      for (const ty of TYPES) { acc += ty.p; if (u < acc) { type = ty; break; } }
      const v = { id: nextId++, type, x: Math.cos(a) * d, y: Math.sin(a) * d, d, age: 0, state: 'new', everReal: false };
      if (type === TYPES[0]) totalBoom++;
      voices.push(v);
    }
    const att = (d) => 4 / (4 + Math.max(0, d - 4));
    const env = (v) => Math.exp(-3 * v.age / v.type.dur);
    const audibility = (v) => v.type.gain * att(v.d) * env(v);

    function assign() {
      const live = voices;
      if (P.mode === 'none') { for (const v of live) v.state = 'real'; return; }
      const perType = new Map();
      const count = (ty) => perType.get(ty) || 0;
      if (P.mode === 'fcfs') {
        // 선착순: 이미 재생 중인 소리는 유지. 새 소리는 자리가 있을 때만 받고, 없으면 버림
        let n = 0;
        for (const v of live) if (v.state === 'real') { n++; perType.set(v.type, count(v.type) + 1); }
        for (const v of live) {
          if (v.state === 'virtual') v.state = 'culled';     // 다른 모드에서 바꾼 경우: 선착순에는 가상 보이스 없음
          if (v.state !== 'new') continue;
          if (n < P.maxVoices && count(v.type) < P.perType) { v.state = 'real'; n++; perType.set(v.type, count(v.type) + 1); }
          else v.state = 'culled';
        }
        return;
      }
      // 우선순위 + 가상화: 점수 순으로 상위 N개를 실제 보이스로
      const sorted = live.filter((v) => v.state !== 'culled').sort((p, q) => (q.type.prio + 40 * audibility(q)) - (p.type.prio + 40 * audibility(p)));
      let n = 0;
      for (const v of sorted) {
        if (n < P.maxVoices && count(v.type) < P.perType && toDb(audibility(v)) > P.virtDb) {
          v.state = 'real'; n++; perType.set(v.type, count(v.type) + 1);
        } else v.state = 'virtual';
      }
    }

    // ── 오디오: "소리 켜기" 버튼을 눌러야 생성 ──
    let ac = null, master = null, nodes = new Map();
    function soundToggle() {
      if (ac) { stopAudio(); return; }
      if (typeof AudioContext === 'undefined') return;
      ac = new AudioContext();
      master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
      nodes = new Map();
      if (ac.resume) ac.resume();
    }
    function stopAudio() {
      if (!ac) return;
      try { ac.close(); } catch (e) { /* 이미 닫힘 */ }
      ac = null; master = null; nodes = new Map();
    }
    const audible = () => !!ac && P.listen === ctx.side;
    function syncAudio() {
      const now = ac.currentTime;
      master.gain.setTargetAtTime(audible() ? P.vol : 0, now, 0.03);
      const want = new Set();
      for (const v of voices) {
        if (v.state !== 'real') continue;
        want.add(v.id);
        let n = nodes.get(v.id);
        if (!n) {
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = v.type.osc; o.frequency.value = v.type.f * (0.9 + 0.2 * ((v.id * 0.618) % 1));
          g.gain.value = 0; o.connect(g); g.connect(master); o.start();
          n = { o, g }; nodes.set(v.id, n);
        }
        n.g.gain.setTargetAtTime(audibility(v) * 0.5, now, 0.01);
      }
      for (const [id, n] of nodes) {
        if (want.has(id)) continue;
        n.g.gain.setTargetAtTime(0, now, 0.01);
        n.o.stop(now + 0.06);
        nodes.delete(id);
      }
    }

    return {
      update(dt) {
        t += dt;
        burstT -= dt;
        const burst = burstT < 0;                          // 몇 초마다 1초 동안 빈도 2배 (전투 폭주)
        if (burstT < -1) burstT = 3;
        spawnAcc += dt * P.rate * (burst ? 2 : 1);
        while (spawnAcc >= 1) { spawnAcc -= 1; spawn(); }
        for (const v of voices) v.age += dt;
        // 끝난 소리 정리
        voices = voices.filter((v) => {
          if (v.age < v.type.dur) return true;
          if (v.type === TYPES[0] && !v.everReal) missedBoom++;
          return false;
        });
        assign();
        mix = 0; realN = 0; virtN = 0;
        for (const v of voices) {
          if (v.state === 'real') { v.everReal = true; realN++; mix += audibility(v); }
          else if (v.state === 'virtual') virtN++;
        }
        if (mix > 1) clipTime += dt;
        sampleAcc += dt;
        while (sampleAcc >= SAMPLE) { sampleAcc -= SAMPLE; hist.push({ n: realN, mix }); if (hist.length > HIST) hist.shift(); }
        if (ac) syncAudio();
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const worldH = H * 0.55, cx = W / 2, cy = worldH / 2, ppm = (Math.min(W, worldH) / 2 - 12) / R;
        D.grid(g, W, worldH, 20);
        D.circle(g, cx, cy, R * ppm, null, C.grid, 1);
        D.circle(g, cx, cy, 4 * ppm, null, 'rgba(255,255,255,0.15)', 1);
        for (const v of voices) {
          const x = cx + v.x * ppm, y = cy + v.y * ppm, r = 3 + 10 * Math.sqrt(audibility(v));
          if (v.state === 'real') D.circle(g, x, y, r, v.type.color);
          else if (v.state === 'virtual') D.circle(g, x, y, r, null, v.type.color, 1.2);
          else if (v.state === 'culled') { D.line(g, x - 4, y - 4, x + 4, y + 4, C.dim, 1); D.line(g, x - 4, y + 4, x + 4, y - 4, C.dim, 1); }
        }
        D.circle(g, cx, cy, 6, '#fff');
        TYPES.forEach((ty, i) => {
          D.circle(g, 14, 14 + i * 16, 5, ty.color);
          D.text(g, GTL.L(`${ty.name} (우선순위 ${ty.prio})`, `${ty.name} (priority ${ty.prio})`), 24, 8 + i * 16, { size: 10, color: C.text });
        });
        D.text(g, GTL.L('채움 = 실제, 빈 원 = 가상, X = 버림', 'Filled = real, hollow = virtual, X = dropped'), 10, 8 + TYPES.length * 16, { size: 10, color: C.dim });
        // ── 그래프 ──
        const px = 40, pw = W - 56, gh = Math.max(36, (H - worldH - 30) / 2);
        const y1 = worldH + 8, y2 = y1 + gh + 12;
        const nMax = Math.max(16, ...hist.map((h) => h.n));
        D.plot(g, hist.map((h) => h.n), px, y1, pw, gh, { min: 0, max: nMax, color: col, label: GTL.L(`실제 보이스 수 (0~${nMax})`, `Real voices (0~${nMax})`) });
        if (P.mode !== 'none') {
          const ly = y1 + gh - (P.maxVoices / nMax) * gh;
          g.setLineDash([4, 4]); D.line(g, px, ly, px + pw, ly, C.warn, 1); g.setLineDash([]);
        }
        const yOf = (db) => y2 + gh - U.clamp((db + 30) / 42, 0, 1) * gh;   // -30 ~ +12 dB
        D.plot(g, hist.map((h) => U.clamp(toDb(h.mix), -30, 12)), px, y2, pw, gh, { min: -30, max: 12, color: col, label: GTL.L('믹스 레벨 (-30~+12dB)', 'Mix level (-30~+12dB)') });
        D.line(g, px, yOf(0), px + pw, yOf(0), C.bad, 1);
        D.text(g, '0dB', px - 4, yOf(0) - 5, { size: 9, color: C.bad, align: 'right' });
        // 믹서 비용 막대
        D.rect(g, W - 22, 10, 10, worldH - 20, 'rgba(0,0,0,0.4)');
        const cost = Math.min(1, realN / 48);
        D.rect(g, W - 22, 10 + (worldH - 20) * (1 - cost), 10, (worldH - 20) * cost, cost > 0.5 ? C.bad : col);
        D.text(g, GTL.L('비용', 'Cost'), W - 17, worldH - 6, { size: 9, color: C.dim, align: 'center' });

        ctx.stat(GTL.L('실제 보이스', 'Real voices'), realN);
        ctx.stat(GTL.L('가상 보이스', 'Virtual voices'), virtN);
        ctx.stat(GTL.L('믹스 레벨', 'Mix level'), toDb(mix).toFixed(1) + ' dB');
        ctx.stat(GTL.L('클리핑 시간 비율', 'Time clipping'), t > 0 ? ((clipTime / t) * 100).toFixed(1) + ' %' : '-');
        ctx.stat(GTL.L('놓친 폭발', 'Missed explosions'), `${missedBoom} / ${totalBoom}`);
        ctx.stat(GTL.L('소리', 'Sound'), typeof AudioContext === 'undefined' ? GTL.L('미지원', 'Not supported') : !ac ? GTL.L('꺼짐', 'Off') : audible() ? GTL.L('재생 중', 'Playing') : GTL.L('음소거 (다른 뷰 선택)', 'Muted (other view selected)'));
      },
      onAction(key) { if (key === 'sound') soundToggle(); },
      dispose() { stopAudio(); },
    };
  },
});
