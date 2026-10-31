// 도플러 효과: 지나가는 음원의 피치 변화 (on/off, 배율)
GTL.register({
  id: 'doppler',
  title: '도플러 효과 (Doppler)',
  summary: '다가오는 음원은 높게, 멀어지는 음원은 낮게 들림. 음원과 청자의 상대 속도로 피치 배율을 계산해 넣으면 차나 총알이 지나가는 느낌이 살아남.',
  views: { a: '도플러 없음', b: '도플러 (배율 1)' },
  controls: '조작 없음. 음원이 청자 앞을 반복해서 지나감.',
  info: `
    <p><b>도플러 효과</b>는 음원이나 청자가 움직일 때 들리는 주파수가 바뀌는 현상.
    다가올 때는 파면 간격이 좁아져 높게, 멀어질 때는 넓어져 낮게 들림.</p>
    <p>청자가 멈춰 있을 때 식: <code>f' = f × c / (c - v<sub>r</sub>)</code></p>
    <ul>
      <li><code>c</code>: 음속 (공기 중 약 343m/s).</li>
      <li><code>v<sub>r</sub></code>: 음원 속도 중 청자를 향하는 성분. 다가오면 +, 멀어지면 -.</li>
      <li>게임은 여기에 <b>도플러 배율</b>을 곱해 과장하거나 줄임 (Unity의 Doppler Level, FMOD의 Doppler Scale).</li>
    </ul>
    <p>구현 방법: 매 프레임 상대 속도를 구해 <code>playbackRate</code>나 오실레이터 주파수에 배율을 곱함.
    Web Audio의 <code>PannerNode</code>는 예전에 도플러를 지원했지만 명세에서 빠졌음. 그래서 직접 계산함.</p>
    <p>주의점: 순간이동이나 카메라 컷처럼 위치가 튀면 속도가 엄청 커져 피치가 튐. 속도를 위치 차분으로 구한다면 상한을 두거나 컷 직후에는 0으로 둠.
    음속 지연(소리가 늦게 도착함)은 이 샘플에서 생략함.</p>
    <p>위쪽 원은 파면. A는 음원을 따라다니는 같은 간격의 원, B는 내보낸 위치에서 퍼지는 원이라 앞쪽이 촘촘함. 파면은 보기 쉽게 실제 음속의 1/4 속도로 그림.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    <marker id="arrb" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <line x1="10" y1="40" x2="250" y2="40" class="d-dim"/>
    <line x1="90" y1="40" x2="180" y2="120" class="d-dim" stroke-dasharray="4 3"/>
    <path d="M90,40 L162,40" class="d-line" marker-end="url(#arr)"/>
    <path d="M90,40 L129,74" class="d-b" marker-end="url(#arrb)"/>
    <circle cx="90" cy="40" r="7" class="f-accent"/><circle cx="180" cy="120" r="7" class="f-dim"/>
    <text x="90" y="26" text-anchor="middle" class="t-small">${L('음원', 'source')}</text>
    <text x="168" y="36" class="t-mono">v</text>
    <text x="100" y="94" class="t-b t-mono">v_r</text>
    <text x="192" y="124" class="t-small">${L('청자', 'listener')}</text>
    <text x="10" y="150" class="t-small t-dim">${L('v_r = 청자를 향하는 속도 성분', 'v_r = speed component toward the listener')}</text>
    <text x="10" y="168" class="t-mono">f' = f x c / (c - v_r)</text>
    <line x1="290" y1="20" x2="290" y2="160" class="d-dim"/><line x1="290" y1="100" x2="530" y2="100" class="d-dim"/>
    <text x="286" y="103" text-anchor="end" class="t-small t-mono">1</text>
    <text x="294" y="16" class="t-small t-dim">${L('피치 배율', 'pitch ratio')}</text>
    <text x="530" y="174" text-anchor="end" class="t-small t-dim">${L('시간', 'time')}</text>
    <line x1="400" y1="20" x2="400" y2="160" class="d-dim" stroke-dasharray="3 3"/>
    <text x="400" y="174" text-anchor="middle" class="t-small">${L('가장 가까운 순간', 'closest point')}</text>
    <path d="M290,100 L530,100" class="d-a" stroke-dasharray="6 3"/>
    <path d="M290,56 L385,57 C400,58 400,142 415,143 L530,144" class="d-dim"/>
    <path d="M290,60 L355,61 C395,63 405,137 445,139 L530,140" class="d-b"/>
    <text x="300" y="46" class="t-b t-small">${L('다가옴: 높음', 'approach: higher')}</text>
    <text x="450" y="130" class="t-b t-small">${L('멀어짐: 낮음', 'recede: lower')}</text>
    <text x="528" y="94" text-anchor="end" class="t-a t-small">${L('A 변화 없음', 'A no change')}</text>
    <text x="408" y="34" class="t-dim t-small">${L('통과 거리 짧음: 더 급함', 'short pass: steeper')}</text>
    <text x="4" y="190" class="t-small t-dim">${L('음원이 앞을 지나는 순간 v_r의 부호가 바뀌어 피치가 높음에서 낮음으로 넘어감', 'As the source passes, v_r flips sign, so the pitch swings from high to low')}</text>
  </svg>`,
  look: [
    '아래 주파수 그래프에서 A는 평평한 선, B는 음원이 지나가는 순간 높은 값에서 낮은 값으로 떨어짐.',
    'B의 배율을 2~3으로 올리면 낙차가 커져 만화 같은 효과음이 됨. 0.3 정도면 은은함.',
    '"통과 거리"를 1m로 줄이면 B의 피치가 거의 순간적으로 떨어짐. 멀리 지나가면 천천히 바뀜.',
    '"음원 속도"를 음속의 절반 이상으로 올리면 다가올 때 배율이 2배 가까이 됨. "최대 피치 배율"로 상한을 둠.',
  ],
  refs: [
    { type: 'engine', title: 'Unity Manual - Audio Source (Doppler Level)', url: 'https://docs.unity3d.com/Manual/class-AudioSource.html', note: '음원별 도플러 정도. 0이면 꺼짐.' },
    { type: 'engine', title: 'FMOD Engine - 3D Sound (doppler scale)', note: 'Core API의 set3DSettings에서 도플러 배율, 거리 단위, 롤오프 배율을 정함.' },
    { type: 'engine', title: 'MDN - AudioParam (frequency, playbackRate)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AudioParam', note: '계산한 배율을 넣는 대상.' },
    { type: 'article', title: 'Wikipedia - Doppler effect', url: 'https://en.wikipedia.org/wiki/Doppler_effect', note: '음원, 청자가 움직일 때의 일반식.' },
  ],
  params: [
    { key: 'doppler', label: '도플러', type: 'bool', a: false, b: true, group: '도플러' },
    { key: 'factor', label: '도플러 배율', type: 'range', min: 0, max: 3, step: 0.05, default: 1, when: (p) => p.doppler },
    { key: 'maxRatio', label: '최대 피치 배율', type: 'range', min: 1.1, max: 4, step: 0.05, default: 2, when: (p) => p.doppler, help: '상한. 하한은 그 역수' },
    { key: 'speed', label: '음원 속도 (m/s)', type: 'range', min: 5, max: 250, step: 1, default: 40, shared: true, group: '장면' },
    { key: 'passDist', label: '통과 거리 (m)', type: 'range', min: 1, max: 40, step: 0.5, default: 8, shared: true },
    { key: 'c', label: '음속 (m/s)', type: 'range', min: 100, max: 500, step: 1, default: 343, shared: true },
    { key: 'baseFreq', label: '음원 주파수 (Hz)', type: 'range', min: 80, max: 880, step: 1, default: 220, shared: true },
    { key: 'sound', label: '소리 켜기', type: 'button', buttonLabel: '소리 켜기/끄기', group: '소리' },
    { key: 'listen', label: '소리 내는 뷰', type: 'select', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], default: 'a', shared: true },
    { key: 'vol', label: '음량', type: 'range', min: 0, max: 1, step: 0.01, default: 0.35, shared: true },
  ],
  en: {
    title: 'Doppler Effect',
    summary: 'A source coming closer sounds higher, and a source moving away sounds lower. Compute a pitch ratio from the relative speed of the source and listener. Cars and bullets then feel like they really pass by.',
    views: { a: 'No Doppler', b: 'Doppler (factor 1)' },
    controls: 'No input. The source passes in front of the listener again and again.',
    info: `
    <p>The <b>Doppler effect</b> is the change in heard frequency when the source or listener moves.
    When the source comes closer, the wavefronts bunch up and it sounds higher. When it moves away, they spread out and it sounds lower.</p>
    <p>Formula when the listener is still: <code>f' = f × c / (c - v<sub>r</sub>)</code></p>
    <ul>
      <li><code>c</code>: speed of sound (about 343 m/s in air).</li>
      <li><code>v<sub>r</sub></code>: the part of the source velocity that points at the listener. Positive when it comes closer, negative when it moves away.</li>
      <li>Games multiply this by a <b>Doppler factor</b> to exaggerate or soften it (Doppler Level in Unity, Doppler Scale in FMOD).</li>
    </ul>
    <p>How to build it: compute the relative velocity every frame. Multiply <code>playbackRate</code> or the oscillator frequency by the ratio.
    The Web Audio <code>PannerNode</code> used to support Doppler, but it was removed from the spec. So this sample computes it directly.</p>
    <p>Watch out: when the position jumps (teleport, camera cut), the velocity gets huge and the pitch spikes. If you get velocity from position differences, clamp it, or set it to 0 right after a cut.
    This sample skips the sound travel delay (sound arriving late).</p>
    <p>The circles at the top are wavefronts. In A, the circles follow the source with even spacing. In B, each circle spreads from where it was sent, so they are dense in front. The wavefronts are drawn at 1/4 of the real speed of sound so they are easy to see.</p>`,
    look: [
      'In the frequency graph at the bottom, A is a flat line. B drops from high to low the moment the source passes.',
      'Raise B\'s factor to 2~3. The drop gets bigger and sounds like a cartoon effect. Around 0.3 it is subtle.',
      'Lower "Pass distance" to 1 m. B\'s pitch drops almost instantly. When the source passes far away, it changes slowly.',
      'Raise "Source speed" to half the speed of sound or more. The ratio gets close to 2x as it comes closer. "Max pitch ratio" sets a cap.',
    ],
    refs: [
      'Doppler amount per source. 0 turns it off.',
      'set3DSettings in the Core API sets the Doppler scale, distance unit, and rolloff scale.',
      'Where the computed ratio goes.',
      'The general formula when the source and listener move.',
    ],
    params: {
      doppler: { label: 'Doppler', group: 'Doppler' },
      factor: 'Doppler factor',
      maxRatio: { label: 'Max pitch ratio', help: 'Upper limit. The lower limit is its inverse' },
      speed: { label: 'Source speed (m/s)', group: 'Scene' },
      passDist: 'Pass distance (m)',
      c: 'Speed of sound (m/s)',
      baseFreq: 'Source frequency (Hz)',
      sound: { label: 'Sound on', buttonLabel: 'Sound on/off', group: 'Sound' },
      listen: 'View that plays sound',
      vol: 'Volume',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const col = ctx.side === 'a' ? C.a : C.b;
    const HALF = 70, HIST = 240, SAMPLE = 1 / 60;   // 음원은 x = -HALF ~ +HALF를 반복 이동

    let t, sx, rings, ringAcc, hist, sampleAcc, ratio, vr, gain, minR, maxR;
    function init() { t = 0; sx = -HALF; rings = []; ringAcc = 0; hist = []; sampleAcc = 0; ratio = 1; vr = 0; gain = 0; minR = 1; maxR = 1; }
    init();

    function compute() {
      const sy = -P.passDist;                       // 청자는 (0, 0)
      const d = Math.hypot(sx, sy);
      vr = -(sx * P.speed) / Math.max(1e-6, d);      // 음원 속도 (speed, 0)의 청자 방향 성분
      if (P.doppler) {
        const v = vr * P.factor;
        let r = P.c / Math.max(1, P.c - v);          // 음속 이상이면 발산하므로 분모 하한
        r = U.clamp(r, 1 / P.maxRatio, P.maxRatio);
        ratio = r;
      } else ratio = 1;
      gain = 5 / (5 + Math.max(0, d - 5));            // 간단한 역거리 감쇠 (min 5m)
      return d;
    }

    // ── 오디오: "소리 켜기" 버튼을 눌러야 생성 ──
    let ac = null, master = null, osc = null, osc2 = null, amp = null, pan = null;
    function soundToggle() {
      if (ac) { stopAudio(); return; }
      if (typeof AudioContext === 'undefined') return;
      ac = new AudioContext();
      master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
      amp = ac.createGain(); amp.gain.value = 0;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2500;
      pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
      osc = ac.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = P.baseFreq;
      osc2 = ac.createOscillator(); osc2.type = 'square'; osc2.frequency.value = P.baseFreq * 1.5;
      const g2 = ac.createGain(); g2.gain.value = 0.3;
      osc.connect(lp); osc2.connect(g2); g2.connect(lp); lp.connect(amp);
      if (pan) { amp.connect(pan); pan.connect(master); } else amp.connect(master);
      osc.start(); osc2.start();
      if (ac.resume) ac.resume();
    }
    function stopAudio() {
      if (!ac) return;
      try { ac.close(); } catch (e) { /* 이미 닫힘 */ }
      ac = null; master = null; osc = null; osc2 = null; amp = null; pan = null;
    }
    const audible = () => !!ac && P.listen === ctx.side;

    return {
      update(dt) {
        t += dt;
        sx += P.speed * dt;
        let wrapped = false;
        if (sx > HALF) { sx = -HALF; wrapped = true; rings = []; minR = 1; maxR = 1; }
        const d = compute();
        minR = Math.min(minR, ratio); maxR = Math.max(maxR, ratio);
        // 파면: 일정 간격으로 내보냄 (시각화용 축척: 실제 음속의 1/4)
        ringAcc += dt;
        while (ringAcc >= 0.06) { ringAcc -= 0.06; rings.push({ x: sx, y: -P.passDist, age: 0 }); }
        for (const r of rings) r.age += dt;
        rings = rings.filter((r) => r.age < 0.9);
        sampleAcc += dt;
        while (sampleAcc >= SAMPLE) { sampleAcc -= SAMPLE; hist.push(P.baseFreq * ratio); if (hist.length > HIST) hist.shift(); }
        if (ac) {
          const now = ac.currentTime;
          master.gain.setTargetAtTime(audible() ? P.vol : 0, now, 0.03);
          if (wrapped) { amp.gain.cancelScheduledValues(now); amp.gain.setValueAtTime(0, now); }
          amp.gain.setTargetAtTime(gain, now, 0.02);
          osc.frequency.setTargetAtTime(P.baseFreq * ratio, now, 0.01);
          osc2.frequency.setTargetAtTime(P.baseFreq * 1.5 * ratio, now, 0.01);
          if (pan) pan.pan.setTargetAtTime(U.clamp(sx / Math.max(1, d), -1, 1), now, 0.02);
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const worldH = H * 0.58, ppm = (W - 20) / (HALF * 2);
        const ox = W / 2, oy = worldH - 24;
        const X = (x) => ox + x * ppm, Y = (y) => oy + y * ppm;
        g.save(); g.beginPath(); g.rect(0, 0, W, worldH); g.clip();
        D.grid(g, W, worldH, 20);
        // 도로
        D.rect(g, 0, Y(-P.passDist) - 8, W, 16, 'rgba(255,255,255,0.05)');
        // 파면
        const vis = P.c * 0.25;
        for (const r of rings) {
          const a = 0.5 * (1 - r.age / 0.9);
          const cx = P.doppler ? X(r.x) : X(sx), cy = P.doppler ? Y(r.y) : Y(-P.passDist);
          D.circle(g, cx, cy, r.age * vis * ppm, null, `rgba(255,255,255,${a})`, 1);
        }
        // 음원과 속도 벡터
        const S = { x: X(sx), y: Y(-P.passDist) };
        D.arrow(g, S.x, S.y, S.x + Math.min(80, P.speed * 0.6), S.y, col, 2);
        D.rect(g, S.x - 14, S.y - 7, 28, 14, col, '#fff', 1.5);
        // 청자와 시선 방향 속도
        D.circle(g, ox, oy, 8, '#fff');
        D.text(g, GTL.L('청자', 'Listener'), ox + 12, oy - 6, { size: 11, color: C.dim });
        D.line(g, ox, oy, S.x, S.y, 'rgba(255,255,255,0.2)', 1);
        g.restore();
        // ── 주파수 그래프 ──
        const px = 46, py = worldH + 10, pw = W - 62, ph = Math.max(50, H - py - 12);
        const lo = P.baseFreq / 2.2, hi = P.baseFreq * 2.2;
        const yOf = (f) => py + ph - U.clamp((Math.log(f) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)), 0, 1) * ph;
        D.rect(g, px, py, pw, ph, 'rgba(0,0,0,0.35)');
        for (const m of [0.5, 1, 2]) {
          D.line(g, px, yOf(P.baseFreq * m), px + pw, yOf(P.baseFreq * m), m === 1 ? 'rgba(255,255,255,0.25)' : C.grid, 1);
          D.text(g, (P.baseFreq * m).toFixed(0) + 'Hz', px - 4, yOf(P.baseFreq * m) - 5, { size: 9, color: C.dim, align: 'right' });
        }
        if (hist.length > 1) {
          g.beginPath();
          const step = pw / (HIST - 1), x0 = px + pw - (hist.length - 1) * step;
          hist.forEach((f, i) => (i ? g.lineTo(x0 + i * step, yOf(f)) : g.moveTo(x0 + i * step, yOf(f))));
          g.strokeStyle = col; g.lineWidth = 2; g.stroke();
        }
        D.text(g, GTL.L('들리는 주파수 (4초, 로그 축)', 'Heard frequency (4 s, log axis)'), px + 4, py + 3, { size: 10, color: C.dim });

        ctx.stat(GTL.L('시선 방향 속도', 'Line-of-sight speed'), vr.toFixed(1) + ' m/s');
        ctx.stat(GTL.L('피치 배율', 'Pitch ratio'), ratio.toFixed(3) + GTL.L(` (${(12 * Math.log2(ratio)).toFixed(2)} 반음)`, ` (${(12 * Math.log2(ratio)).toFixed(2)} semitones)`));
        ctx.stat(GTL.L('들리는 주파수', 'Heard frequency'), (P.baseFreq * ratio).toFixed(1) + ' Hz');
        ctx.stat(GTL.L('이번 통과 배율 범위', 'Ratio range this pass'), GTL.L(`${minR.toFixed(2)} ~ ${maxR.toFixed(2)}배`, `${minR.toFixed(2)}x ~ ${maxR.toFixed(2)}x`));
        ctx.stat(GTL.L('소리', 'Sound'), typeof AudioContext === 'undefined' ? GTL.L('미지원', 'Not supported') : !ac ? GTL.L('꺼짐', 'Off') : audible() ? GTL.L('재생 중', 'Playing') : GTL.L('음소거 (다른 뷰 선택)', 'Muted (other view selected)'));
      },
      onAction(key) { if (key === 'sound') soundToggle(); },
      dispose() { stopAudio(); },
    };
  },
});
