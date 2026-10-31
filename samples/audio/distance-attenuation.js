// 거리 감쇠 곡선: 선형 vs 역거리(로그) vs 커스텀 롤오프
GTL.register({
  id: 'distance-attenuation',
  title: '거리 감쇠 곡선 (Rolloff)',
  summary: '음원이 멀어질 때 음량을 줄이는 곡선을 비교함. 선형은 가까이서 덜 줄고 멀리서 너무 큼. 역거리 곡선은 자연스럽지만 최대 거리에서 0이 되지 않아 끊김이 생김. 끝을 0으로 페이드하는 커스텀 곡선이 둘의 장점을 합침.',
  views: { a: '선형', b: '커스텀 (역거리 + 끝 페이드)' },
  controls: '위쪽 장면을 누른 채 끌면 음원 위치를 직접 정함. 놓으면 자동 이동.',
  info: `
    <p><b>거리 감쇠(Attenuation, Rolloff)</b>는 음원과 청자 사이 거리에 따라 음량을 줄이는 곡선.
    3D 오디오의 가장 기본 설정이고, 모든 엔진이 최소 거리(min)와 최대 거리(max)를 받음.</p>
    <ul>
      <li><b>선형</b>: <code>1 - (d - min) / (max - min)</code>. max에서 정확히 0. 귀는 로그로 듣기 때문에 가까이서는 거의 안 줄고 멀리서 갑자기 사라지는 느낌.</li>
      <li><b>역거리(로그)</b>: <code>min / (min + rolloff × (d - min))</code>. 실제 음압 감소(거리 2배당 -6dB)에 가까움. 대신 max에서도 0이 아님.</li>
      <li><b>커스텀</b>: 역거리 곡선에 max 근처에서 0으로 내려가는 페이드를 곱함. 엔진의 커스텀 롤오프 커브로 흔히 만듦.</li>
    </ul>
    <p>엔진은 max 밖의 보이스를 끄거나 가상화(재생 위치만 추적)해서 비용을 아낌.
    이때 곡선이 0이 아니면 음량이 갑자기 끊김. 아래 이득 기록에 계단으로 보임.</p>
    <p>Web Audio의 <code>PannerNode.distanceModel</code>도 같은 세 식('linear', 'inverse', 'exponential')을 씀. 이 샘플은 식을 직접 계산해 GainNode에 넣음.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 190" xmlns="http://www.w3.org/2000/svg">
    <line x1="60" y1="140" x2="500" y2="140" class="d-dim"/><line x1="60" y1="16" x2="60" y2="140" class="d-dim"/>
    <text x="54" y="24" text-anchor="end" class="t-small t-mono">0dB</text><text x="54" y="84" text-anchor="end" class="t-small t-mono">-24</text>
    <text x="54" y="143" text-anchor="end" class="t-small t-dim">${L('무음', 'silent')}</text>
    <line x1="80" y1="16" x2="80" y2="146" class="d-dim" stroke-dasharray="3 3"/><line x1="300" y1="16" x2="300" y2="146" class="d-dim" stroke-dasharray="3 3"/>
    <line x1="460" y1="16" x2="460" y2="146" class="d-dim" stroke-dasharray="3 3"/>
    <text x="80" y="158" text-anchor="middle" class="t-small t-mono">min</text><text x="300" y="158" text-anchor="middle" class="t-small">${L('페이드 시작', 'fade start')}</text>
    <text x="460" y="158" text-anchor="middle" class="t-small t-mono">max</text><text x="530" y="170" text-anchor="end" class="t-small t-dim">${L('거리', 'distance')}</text>
    <path d="M60,20.0 L80,20.0 L85,24.8 L90,28.8 L95,32.2 L100,35.1 L120,43.9 L140,50.1 L160,54.9 L180,58.9 L200,62.3 L220,65.2 L240,67.7 L260,70.0 L280,72.1 L300,74.0 L320,75.7 L340,77.3 L360,78.8 L380,80.2 L400,81.5 L420,82.8 L440,83.9 L460,85.1" class="d-dim" stroke-dasharray="5 3"/>
    <line x1="460" y1="85" x2="460" y2="140" class="d-bad"/>
    <path d="M60,20.0 L80,20.0 L100,21.2 L120,22.4 L140,23.7 L160,25.1 L180,26.6 L200,28.2 L220,30.0 L240,31.9 L260,33.9 L280,36.2 L300,38.8 L320,41.7 L340,45.0 L360,49.0 L380,53.8 L400,60.1 L410,64.0 L420,68.9 L430,75.1 L440,83.9 L450,99.0 L460,140.0" class="d-a"/>
    <path d="M60,20.0 L80,20.0 L85,24.8 L90,28.8 L95,32.2 L100,35.1 L120,43.9 L140,50.1 L160,54.9 L180,58.9 L200,62.3 L220,65.2 L240,67.7 L260,70.0 L280,72.1 L300,74.0 L320,76.7 L340,81.0 L360,87.1 L380,95.3 L400,106.5 L410,113.9 L420,123.1 L430,135.1 L440,140.0 L460,140.0" class="d-b"/>
    <text x="200" y="22" class="t-a t-small">${L('A 선형: 가까이서 덜 줄어듦', 'A linear: barely drops up close')}</text>
    <text x="140" y="110" class="t-b t-small">${L('B 커스텀: 역거리 x 끝 페이드', 'B custom: inverse x end fade')}</text>
    <text x="345" y="66" class="t-dim t-small">${L('역거리', 'inverse')}</text>
    <text x="466" y="104" class="t-small">${L('max에서', 'step at')}</text><text x="466" y="116" class="t-small">${L('계단', 'max')}</text>
    <text x="4" y="182" class="t-small t-dim">${L('귀는 dB(로그)로 들음. dB 축에서 보면 선형은 끝에서 급히 떨어지고, 역거리는 max에서 0이 안 됨', 'On a dB axis (how ears hear), linear drops late and fast, and inverse never hits 0 at max')}</text>
  </svg>`,
  look: [
    'A(선형)와 B(커스텀)의 곡선을 비교하면 같은 거리 10m에서 A의 dB가 훨씬 높음. 선형은 멀리서도 크게 들림.',
    'A의 곡선을 "역거리"로 바꾸면 음원이 최대 거리를 넘는 순간 이득 기록에 계단이 생김. 보이스 컬링 때문에 생기는 끊김.',
    '"최대 거리 밖 보이스 정지"를 끄면 역거리 곡선은 max 밖에서도 일정한 음량을 유지함 (Unity, FMOD의 기본 동작).',
    '"dB 축"을 켜면 선형 곡선이 max 근처에서 급하게 떨어지는 모양이 보임. 귀가 느끼는 변화는 이쪽에 가까움.',
  ],
  refs: [
    { type: 'engine', title: 'MDN - PannerNode.distanceModel', url: 'https://developer.mozilla.org/en-US/docs/Web/API/PannerNode/distanceModel', note: "linear, inverse, exponential 식이 정리됨." },
    { type: 'engine', title: 'Web Audio API 명세 - Distance Effects', url: 'https://www.w3.org/TR/webaudio/', note: 'refDistance, maxDistance, rolloffFactor의 정확한 정의.' },
    { type: 'engine', title: 'Unity Manual - Audio Source (Volume Rolloff)', url: 'https://docs.unity3d.com/Manual/class-AudioSource.html', note: 'Logarithmic, Linear, Custom Rolloff. 커스텀 커브를 직접 그릴 수 있음.' },
    { type: 'engine', title: 'FMOD Studio - Spatializer (Distance Attenuation)', note: 'Min/Max distance와 Linear, Inverse, Linear Squared 등 롤오프 종류.' },
  ],
  params: [
    { key: 'curve', label: '감쇠 곡선', type: 'select', group: '감쇠', options: [
      { value: 'linear', label: '선형' },
      { value: 'inverse', label: '역거리 (로그)' },
      { value: 'custom', label: '커스텀 (역거리 + 끝 페이드)' },
    ], a: 'linear', b: 'custom' },
    { key: 'minDist', label: '최소 거리 (m)', type: 'range', min: 0.5, max: 10, step: 0.5, default: 2, help: '이 거리 안에서는 음량이 최대' },
    { key: 'maxDist', label: '최대 거리 (m)', type: 'range', min: 10, max: 60, step: 1, default: 40 },
    { key: 'rolloff', label: '롤오프 배율', type: 'range', min: 0.2, max: 3, step: 0.1, default: 1, when: (p) => p.curve !== 'linear', help: '역거리 곡선이 줄어드는 빠르기' },
    { key: 'fadeStart', label: '페이드 시작 (max 대비)', type: 'range', min: 0.3, max: 0.95, step: 0.05, default: 0.6, when: (p) => p.curve === 'custom' },
    { key: 'cull', label: '최대 거리 밖 보이스 정지', type: 'bool', default: true, shared: true, group: '장면', help: '엔진이 max 밖 보이스를 끄는 동작을 흉내 냄' },
    { key: 'dbAxis', label: 'dB 축', type: 'bool', default: false, shared: true },
    { key: 'speed', label: '이동 속도', type: 'range', min: 0.05, max: 1, step: 0.05, default: 0.25, shared: true },
    { key: 'sound', label: '소리 켜기', type: 'button', buttonLabel: '소리 켜기/끄기', group: '소리' },
    { key: 'listen', label: '소리 내는 뷰', type: 'select', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], default: 'a', shared: true },
    { key: 'vol', label: '음량', type: 'range', min: 0, max: 1, step: 0.01, default: 0.35, shared: true },
  ],
  en: {
    title: 'Distance Attenuation Curves (Rolloff)',
    summary: 'This compares curves that lower the volume as a sound source moves away. Linear drops too little up close and stays too loud far away. The inverse curve sounds natural, but it does not reach 0 at max distance, so the sound cuts off. A custom curve that fades to 0 at the end combines the strengths of both.',
    views: { a: 'Linear', b: 'Custom (inverse + end fade)' },
    controls: 'Press and drag in the top scene to set the source position. Release to let it move on its own.',
    info: `
    <p><b>Distance attenuation (rolloff)</b> is a curve that lowers the volume based on the distance between the source and the listener.
    It is the most basic setting in 3D audio. Every engine takes a min distance and a max distance.</p>
    <ul>
      <li><b>Linear</b>: <code>1 - (d - min) / (max - min)</code>. It is exactly 0 at max. Our ears hear on a log scale, so the sound barely drops up close and then suddenly vanishes far away.</li>
      <li><b>Inverse (log)</b>: <code>min / (min + rolloff × (d - min))</code>. It is close to real sound pressure loss (-6 dB each time distance doubles). But it is not 0 even at max.</li>
      <li><b>Custom</b>: multiplies the inverse curve by a fade that drops to 0 near max. Engines usually build this with a custom rolloff curve.</li>
    </ul>
    <p>Engines save cost by stopping or virtualizing voices beyond max (they only track the playback position).
    If the curve is not 0 at that point, the volume cuts off suddenly. You can see this as a step in the gain history below.</p>
    <p>The Web Audio <code>PannerNode.distanceModel</code> uses the same three formulas ('linear', 'inverse', 'exponential'). This sample computes the formulas itself and feeds the result to a GainNode.</p>`,
    look: [
      'Compare the curves of A (linear) and B (custom). At the same 10 m, A has a much higher dB. Linear stays loud even far away.',
      'Switch A\'s curve to "Inverse". When the source passes max distance, a step appears in the gain history. Voice culling causes this cutoff.',
      'Turn off "Stop voices beyond max distance". The inverse curve then keeps a constant volume beyond max (the default in Unity and FMOD).',
      'Turn on "dB axis". You can see the linear curve drop sharply near max. This is closer to the change your ears hear.',
    ],
    refs: [
      'Lists the linear, inverse, and exponential formulas.',
      { title: 'Web Audio API spec - Distance Effects', note: 'Exact definitions of refDistance, maxDistance, and rolloffFactor.' },
      'Logarithmic, Linear, and Custom Rolloff. You can draw a custom curve yourself.',
      'Min/Max distance and rolloff types such as Linear, Inverse, and Linear Squared.',
    ],
    params: {
      curve: { label: 'Attenuation curve', group: 'Attenuation', options: { linear: 'Linear', inverse: 'Inverse (log)', custom: 'Custom (inverse + end fade)' } },
      minDist: { label: 'Min distance (m)', help: 'Volume is at full inside this distance' },
      maxDist: 'Max distance (m)',
      rolloff: { label: 'Rolloff factor', help: 'How fast the inverse curve drops' },
      fadeStart: 'Fade start (fraction of max)',
      cull: { label: 'Stop voices beyond max distance', group: 'Scene', help: 'Mimics how engines stop voices beyond max' },
      dbAxis: 'dB axis',
      speed: 'Move speed',
      sound: { label: 'Sound on', buttonLabel: 'Sound on/off', group: 'Sound' },
      listen: 'View that plays sound',
      vol: 'Volume',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const col = ctx.side === 'a' ? C.a : C.b;
    const RANGE = 70;                       // 화면에 보이는 최대 거리 (m)
    const toDb = (g) => (g > 1e-5 ? 20 * Math.log10(g) : -100);

    function gainAt(d) {
      const mn = P.minDist, mx = Math.max(P.maxDist, mn + 0.5);
      if (P.cull && d > mx) return 0;
      const dd = Math.min(d, mx);           // max 밖은 max 값 유지 (컬링을 끈 경우)
      if (dd <= mn) return 1;
      if (P.curve === 'linear') return 1 - (dd - mn) / (mx - mn);
      const inv = mn / (mn + P.rolloff * (dd - mn));
      if (P.curve === 'inverse') return inv;
      return inv * (1 - U.smoothstep(mx * P.fadeStart, mx, dd));
    }

    let t, dist, hist, dragging;
    function init() { t = 0; dist = 1; hist = []; dragging = false; }
    init();

    // ── 오디오: "소리 켜기" 버튼을 눌러야 생성 ──
    let ac = null, master = null, srcGain = null, oscs = [];
    function soundToggle() {
      if (ac) { stopAudio(); return; }
      if (typeof AudioContext === 'undefined') return;
      ac = new AudioContext();
      master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
      srcGain = ac.createGain(); srcGain.gain.value = 0;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
      lp.connect(srcGain); srcGain.connect(master);
      oscs = [['sawtooth', 110, 0.5], ['triangle', 165, 0.6], ['sine', 55, 0.8]].map(([type, f, v]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.value = f; g.gain.value = v * 0.4;
        o.connect(g); g.connect(lp); o.start();
        return o;
      });
      if (ac.resume) ac.resume();
    }
    function stopAudio() {
      if (!ac) return;
      try { ac.close(); } catch (e) { /* 이미 닫힘 */ }
      ac = null; master = null; srcGain = null; oscs = [];
    }
    const audible = () => !!ac && P.listen === ctx.side;

    function layout() {
      const W = ctx.width, H = ctx.height;
      const worldH = Math.max(80, H * 0.4);
      return { W, H, worldH, x0: 30, ppm: (W - 50) / RANGE, cy: worldH / 2 };
    }

    return {
      update(dt) {
        t += dt;
        const L = layout(), m = ctx.input.mouse;
        if (m.pressed && m.inside && m.y < L.worldH) dragging = true;
        if (!m.down) dragging = false;
        if (dragging) dist = U.clamp((m.x - L.x0) / L.ppm, 0, RANGE);
        else dist = 0.5 + (RANGE - 6) * (0.5 - 0.5 * Math.cos(t * P.speed * 1.2));
        const g = gainAt(dist);
        hist.push(g);
        if (hist.length > 240) hist.shift();
        if (ac) {
          const now = ac.currentTime;
          master.gain.setTargetAtTime(audible() ? P.vol : 0, now, 0.03);
          srcGain.gain.setTargetAtTime(g, now, 0.01);
        }
      },
      render() {
        const g = ctx.g, L = layout(), { W, H, worldH, x0, ppm, cy } = L;
        const mx = Math.max(P.maxDist, P.minDist + 0.5);
        // ── 장면 ──
        D.grid(g, W, worldH, 20);
        g.save(); g.beginPath(); g.rect(0, 0, W, worldH); g.clip();
        D.circle(g, x0, cy, P.minDist * ppm, 'rgba(102,209,122,0.10)', C.good, 1);
        g.setLineDash([5, 5]); D.circle(g, x0, cy, mx * ppm, null, C.bad, 1); g.setLineDash([]);
        if (P.curve === 'custom') D.circle(g, x0, cy, mx * P.fadeStart * ppm, null, 'rgba(255,203,107,0.5)', 1);
        g.restore();
        D.text(g, 'min', x0 + P.minDist * ppm + 3, cy + 4, { size: 10, color: C.good });
        D.text(g, 'max', Math.min(W - 26, x0 + mx * ppm + 3), cy + 4, { size: 10, color: C.bad });
        D.circle(g, x0, cy, 8, '#fff');
        D.text(g, GTL.L('청자', 'Listener'), x0 - 12, cy + 12, { size: 10, color: C.dim });
        const gn = gainAt(dist), sx = x0 + dist * ppm;
        D.line(g, x0, cy, sx, cy, 'rgba(255,255,255,0.25)', 1);
        D.circle(g, sx, cy, 6 + 10 * gn, col + '55');
        D.circle(g, sx, cy, 6, gn > 0 ? col : C.dim, '#fff', 1.5);
        // ── 감쇠 곡선 ──
        const py = worldH + 14, ph = Math.max(60, (H - worldH) * 0.55), px = 40, pw = W - 56;
        const yOf = (v) => {
          if (P.dbAxis) return py + ph - U.clamp((toDb(v) + 60) / 60, 0, 1) * ph;
          return py + ph - v * ph;
        };
        D.rect(g, px, py, pw, ph, 'rgba(0,0,0,0.35)');
        for (let i = 0; i <= 4; i++) {
          const yy = py + (ph * i) / 4;
          D.line(g, px, yy, px + pw, yy, C.grid, 1);
          D.text(g, P.dbAxis ? `${-15 * i}dB` : (1 - i / 4).toFixed(2), px - 4, yy - 5, { size: 9, color: C.dim, align: 'right' });
        }
        const xOf = (d) => px + (d / RANGE) * pw;
        g.setLineDash([4, 4]);
        D.line(g, xOf(P.minDist), py, xOf(P.minDist), py + ph, C.good, 1);
        D.line(g, xOf(mx), py, xOf(mx), py + ph, C.bad, 1);
        g.setLineDash([]);
        g.beginPath();
        for (let i = 0; i <= 200; i++) {
          const d = (i / 200) * RANGE, x = xOf(d), y = yOf(gainAt(d));
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.strokeStyle = col; g.lineWidth = 2; g.stroke();
        D.circle(g, xOf(dist), yOf(gn), 5, '#fff', col, 2);
        D.text(g, GTL.L(`음량 vs 거리 (0~${RANGE}m)`, `Volume vs distance (0~${RANGE}m)`), px + 4, py + 3, { size: 10, color: C.dim });
        // ── 이득 기록 ──
        const hy = py + ph + 14, hh = Math.max(30, H - hy - 8);
        D.plot(g, hist, px, hy, pw, hh, { min: 0, max: 1, color: col, label: GTL.L('이득 기록 (4초). 계단 = 끊김', 'Gain history (4 s). Step = cutoff') });

        ctx.stat(GTL.L('거리', 'Distance'), dist.toFixed(1) + ' m');
        ctx.stat(GTL.L('이득', 'Gain'), `${gn.toFixed(3)} (${gn > 0 ? toDb(gn).toFixed(1) + ' dB' : GTL.L('무음', 'silent')})`);
        ctx.stat(GTL.L('10m 이득', 'Gain at 10 m'), toDb(gainAt(10)).toFixed(1) + ' dB');
        const edge = gainAt(mx - 0.01);
        ctx.stat(GTL.L('max 경계의 끊김', 'Cutoff at max edge'), !P.cull ? GTL.L('- (컬링 꺼짐)', '- (culling off)') : edge > 1e-3 ? GTL.L(`${toDb(edge).toFixed(1)} dB에서 무음으로`, `${toDb(edge).toFixed(1)} dB to silence`) : GTL.L('없음', 'None'));
        ctx.stat(GTL.L('소리', 'Sound'), typeof AudioContext === 'undefined' ? GTL.L('미지원', 'Not supported') : !ac ? GTL.L('꺼짐', 'Off') : audible() ? GTL.L('재생 중', 'Playing') : GTL.L('음소거 (다른 뷰 선택)', 'Muted (other view selected)'));
      },
      onAction(key) { if (key === 'sound') soundToggle(); },
      dispose() { stopAudio(); },
    };
  },
});
