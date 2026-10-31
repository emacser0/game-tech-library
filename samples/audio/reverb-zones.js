// 잔향 영역 (Reverb Zone): 경계에서 프리셋 즉시 교체 vs 반지름 블렌드 + 페이드 + 내부/외부 LPF
GTL.register({
  id: 'reverb-zones',
  title: '잔향 영역 (Unity Reverb Zone, Unreal Audio Volume)',
  summary: '동굴 입구를 넘는 순간 잔향 프리셋을 바로 바꾸면 Wet 레벨이 한 번에 튀어 "툭" 소리가 남. 내부 반지름과 외부 반지름 사이에서 가중치를 섞고 페이드 시간을 두면 잔향이 서서히 바뀜. 벽 너머 음원에는 내부/외부 LPF를 서서히 걸어 공간이 나뉜 느낌을 줌.',
  views: { a: '경계에서 즉시 교체', b: '반지름 블렌드 + 페이드 + 내부/외부 LPF' },
  controls: '장면을 누르고 있으면 청자가 마우스 쪽으로 이동. 놓으면 바깥과 동굴 사이를 오가는 경로를 따라감.',
  info: `
    <p><b>잔향 영역(Reverb Zone)</b>은 청자가 있는 공간에 맞는 잔향(Reverb)을 거는 장치.
    동굴, 홀, 복도처럼 공간마다 잔향 시간과 Wet 레벨(잔향 소리의 크기)이 다름.</p>
    <p>왜 섞어야 하는가:</p>
    <ul>
      <li>트리거 하나로 프리셋을 바로 바꾸면 경계에서 Wet 레벨이 한 프레임에 크게 바뀜. 잔향이 갑자기 켜지고 "툭" 소리(지퍼 노이즈)가 남.</li>
      <li>Unity의 <b>Audio Reverb Zone</b>은 구 모양 영역에 <code>minDistance</code>(내부 반지름)와 <code>maxDistance</code>(외부 반지름)를 둠. 내부 안은 효과 100%, 외부 밖은 0%, 그 사이는 거리에 따라 섞음.</li>
      <li>Unreal의 <b>Audio Volume</b>은 Reverb Settings의 Fade Time 동안 잔향을 서서히 바꿈.</li>
    </ul>
    <p>Audio Volume의 <b>Interior Settings</b>는 공간을 나누는 다른 축. 청자가 안에 있으면 바깥 음원에 Exterior Volume과 Exterior LPF를 걸고, 밖에 있으면 안쪽 음원에 Interior 값을 검. 값마다 따로 페이드 시간이 있음.</p>
    <p>단점: 영역이 겹치면 우선순위나 가중치 규칙이 필요함. 섞는 구간이 너무 넓으면 바깥에서도 동굴 잔향이 들림.
    이 샘플은 두 프리셋을 각각 ConvolverNode(노이즈를 감쇠시켜 만든 임펄스 응답)에 통과시키고 Wet 이득만 섞음.</p>`,
  diagram: [
    (L) => `<svg viewBox="0 0 540 208" xmlns="http://www.w3.org/2000/svg">
    <circle cx="110" cy="95" r="80" class="d-b" stroke-dasharray="5 3"/>
    <circle cx="110" cy="95" r="35" class="d-b"/>
    <path d="M57.6,74.6 A56,56 0 1 1 57.6,115.4" class="d-line" style="stroke-width:5"/>
    <circle cx="110" cy="95" r="62" class="d-a" stroke-dasharray="2 4"/>
    <text x="110" y="12" text-anchor="middle" class="t-small t-b">maxDistance</text>
    <text x="110" y="85" text-anchor="middle" class="t-small t-b">min</text>
    <text x="110" y="188" text-anchor="middle" class="t-small t-dim">${L('동굴 벽 = A의 트리거 경계', 'cave wall = A trigger edge')}</text>
    <line x1="270" y1="24" x2="270" y2="140" class="d-dim"/><line x1="270" y1="140" x2="530" y2="140" class="d-dim"/>
    <text x="266" y="34" text-anchor="end" class="t-small t-mono">1</text><text x="266" y="143" text-anchor="end" class="t-small t-mono">0</text>
    <text x="274" y="16" class="t-small t-dim">${L('동굴 프리셋 가중치 w', 'cave preset weight w')}</text>
    <line x1="340" y1="24" x2="340" y2="150" class="d-dim" stroke-dasharray="3 3"/><line x1="392" y1="24" x2="392" y2="150" class="d-dim" stroke-dasharray="3 3"/>
    <line x1="476" y1="24" x2="476" y2="150" class="d-dim" stroke-dasharray="3 3"/>
    <text x="340" y="162" text-anchor="middle" class="t-small t-mono">min</text><text x="392" y="162" text-anchor="middle" class="t-small">${L('벽', 'wall')}</text>
    <text x="476" y="162" text-anchor="middle" class="t-small t-mono">max</text>
    <text x="530" y="176" text-anchor="end" class="t-small t-dim">${L('동굴 중심에서의 거리', 'distance from cave center')}</text>
    <path d="M270,30 L392,30 L392,140 L530,140" class="d-a"/>
    <path d="M270,32 L340,32 L476,138 L530,138" class="d-b"/>
    <text x="398" y="52" class="t-a t-small">${L('A: 벽에서 한 번에 바뀜', 'A: jumps at the wall')}</text>
    <text x="440" y="96" class="t-b t-small">${L('B: 선형으로 섞음', 'B: linear blend')}</text>
    <text x="4" y="204" class="t-small">${L('Wet = lerp(바깥, 동굴, w), 이어서 페이드 시간으로 한 번 더 부드럽게', 'Wet = lerp(outside, cave, w), then smoothed by fade time')}</text>
    </svg>`,
    (L) => `<svg viewBox="0 0 540 172" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <rect x="6" y="22" width="104" height="30" rx="4" class="f-dim"/>
    <text x="58" y="41" text-anchor="middle" class="t-small">${L('벽 너머 음원', 'source across wall')}</text>
    <rect x="136" y="22" width="88" height="30" rx="4" class="f-dim"/>
    <text x="180" y="35" text-anchor="middle" class="t-small t-b">LPF</text>
    <text x="180" y="47" text-anchor="middle" class="t-small t-dim">20k ~ 900Hz</text>
    <rect x="250" y="22" width="80" height="30" rx="4" class="f-dim"/>
    <text x="290" y="35" text-anchor="middle" class="t-small t-b">${L('볼륨', 'Volume')}</text>
    <text x="290" y="47" text-anchor="middle" class="t-small t-dim">0 ~ -12dB</text>
    <path d="M110,37 L134,37" class="d-line" marker-end="url(#arr)"/><path d="M224,37 L248,37" class="d-line" marker-end="url(#arr)"/>
    <rect x="456" y="60" width="76" height="30" rx="4" class="f-dim"/>
    <text x="494" y="79" text-anchor="middle" class="t-small">${L('출력', 'Output')}</text>
    <path d="M330,37 L470,37 L470,58" class="d-line" marker-end="url(#arr)"/>
    <text x="400" y="31" text-anchor="middle" class="t-small t-dim">dry</text>
    <rect x="344" y="62" width="98" height="26" rx="4" class="f-dim"/><text x="393" y="79" text-anchor="middle" class="t-small">${L('동굴 IR x w', 'cave IR x w')}</text>
    <rect x="344" y="98" width="98" height="26" rx="4" class="f-dim"/><text x="393" y="115" text-anchor="middle" class="t-small">${L('바깥 IR x (1-w)', 'outside IR x (1-w)')}</text>
    <path d="M300,52 L300,111 L342,111" class="d-dim" marker-end="url(#arr)"/><path d="M300,75 L342,75" class="d-dim" marker-end="url(#arr)"/>
    <text x="296" y="100" text-anchor="end" class="t-small t-dim">send</text>
    <path d="M442,75 L454,75" class="d-line" marker-end="url(#arr)"/><path d="M442,111 L494,111 L494,92" class="d-line" marker-end="url(#arr)"/>
    <text x="6" y="80" class="t-small t-b">${L('LPF, 볼륨 양 = 내부 가중치', 'LPF and volume amount =')}</text>
    <text x="6" y="94" class="t-small t-b">${L('(Interior Settings 페이드 시간)', 'interior weight (own fade time)')}</text>
    <text x="6" y="140" class="t-small t-dim">${L('청자가 동굴 안: 바깥 음원에 Exterior 값을 적용', 'Listener in the cave: apply Exterior values to outside sources')}</text>
    <text x="6" y="156" class="t-small t-dim">${L('청자가 동굴 밖: 동굴 음원에 Interior 값을 적용', 'Listener outside: apply Interior values to cave sources')}</text>
    </svg>`,
  ],
  look: [
    'A는 청자가 동굴 벽을 넘는 순간 Wet 레벨 그래프가 세로로 튐. B는 내부 반지름과 외부 반지름 사이에서 비스듬히 바뀜.',
    '측정값 "최근 최대 변화 (프레임당)"를 비교하면 A는 10dB 이상, B는 1dB 미만.',
    'B에서 동굴에 들어가면 아래 "폭포 LPF" 선이 서서히 내려감. 바깥 폭포 소리가 벽 너머 소리처럼 먹먹해짐. A는 그대로.',
    'A의 페이드 시간을 0.5초로 올리면 즉시 교체여도 튐이 줄어듦. 대신 경계에서 늦게 반응함.',
    '"소리 켜기"를 누르고 A를 들으면 입구에서 잔향이 갑자기 켜짐. B는 입구 앞부터 서서히 울림.',
  ],
  refs: [
    { type: 'engine', title: 'Unity Manual - Audio Reverb Zone', url: 'https://docs.unity3d.com/Manual/class-AudioReverbZone.html', note: 'Min Distance 안은 전체 효과, Max Distance 밖은 효과 없음. 그 사이에서 서서히 섞음.' },
    { type: 'engine', title: 'Unity Scripting API - AudioReverbZone', url: 'https://docs.unity3d.com/ScriptReference/AudioReverbZone.html', note: 'minDistance, maxDistance, reverbPreset, decayTime 같은 속성.' },
    { type: 'engine', title: 'Unreal Engine - Audio Volumes', note: 'Reverb Settings(Reverb Effect, Volume, Fade Time)와 Interior Settings(Exterior/Interior Volume, LPF, 각 페이드 시간).' },
    { type: 'engine', title: 'MDN - ConvolverNode', url: 'https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode', note: '임펄스 응답 버퍼로 컨볼루션 잔향을 만듦.' },
  ],
  params: [
    { key: 'blend', label: '프리셋 전환 방식', type: 'select', group: '잔향 영역', options: [
      { value: 'hard', label: '경계에서 즉시 교체' },
      { value: 'radius', label: '반지름 블렌드 (min ~ max)' },
    ], a: 'hard', b: 'radius' },
    { key: 'minDist', label: '내부 반지름 (minDistance)', type: 'range', min: 20, max: 110, step: 1, default: 60, shared: true, when: (p) => p.blend === 'radius', help: '이 안은 동굴 잔향 100%' },
    { key: 'maxDist', label: '외부 반지름 (maxDistance)', type: 'range', min: 120, max: 260, step: 1, default: 190, shared: true, when: (p) => p.blend === 'radius', help: '이 밖은 동굴 잔향 0%' },
    { key: 'fade', label: '페이드 시간 (초)', type: 'range', min: 0, max: 2, step: 0.05, a: 0, b: 0.4, help: '가중치가 목표값을 따라가는 시간' },
    { key: 'interior', label: '내부/외부 LPF (Interior Settings)', type: 'bool', a: false, b: true, group: '내부, 외부' },
    { key: 'extDb', label: '벽 너머 볼륨 (dB)', type: 'range', min: -30, max: 0, step: 1, default: -12, when: (p) => p.interior },
    { key: 'extLpf', label: '벽 너머 LPF (Hz)', type: 'range', min: 200, max: 8000, step: 50, default: 900, when: (p) => p.interior },
    { key: 'intFade', label: '내부/외부 페이드 시간 (초)', type: 'range', min: 0, max: 2, step: 0.05, default: 0.6, when: (p) => p.interior },
    { key: 'caveDecay', label: '동굴 잔향 시간 (초)', type: 'range', min: 1, max: 6, step: 0.1, default: 3.5, shared: true, group: '프리셋' },
    { key: 'caveWet', label: '동굴 Wet 레벨 (dB)', type: 'range', min: -12, max: 0, step: 0.5, default: -2, shared: true, help: '바깥 프리셋은 -20dB, 0.4초로 고정' },
    { key: 'speed', label: '청자 이동 속도', type: 'range', min: 20, max: 200, step: 5, default: 60, shared: true, group: '장면' },
    { key: 'sound', label: '소리 켜기', type: 'button', buttonLabel: '소리 켜기/끄기', group: '소리' },
    { key: 'listen', label: '소리 내는 뷰', type: 'select', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], default: 'a', shared: true },
    { key: 'vol', label: '음량', type: 'range', min: 0, max: 1, step: 0.01, default: 0.4, shared: true },
  ],
  en: {
    title: 'Reverb Zones (Unity Reverb Zone, Unreal Audio Volume)',
    summary: 'If you swap the reverb preset the moment the listener crosses the cave entrance, the wet level jumps at once and you hear a click. Blend a weight between an inner and an outer radius and add a fade time, and the reverb changes gradually. Sources across the wall get an interior/exterior LPF that fades in, so the spaces feel separate.',
    views: { a: 'Instant swap at the edge', b: 'Radius blend + fade + interior LPF' },
    controls: 'Hold the mouse button on the scene to move the listener toward the cursor. Release it to follow a path between outside and the cave.',
    info: `
    <p>A <b>reverb zone</b> applies the reverb that fits the space the listener is in.
    Caves, halls, and corridors each have their own decay time and wet level (how loud the reverb is).</p>
    <p>Why blend:</p>
    <ul>
      <li>If one trigger swaps the preset, the wet level changes a lot in one frame at the edge. The reverb switches on suddenly with a click (zipper noise).</li>
      <li>Unity's <b>Audio Reverb Zone</b> is a sphere with <code>minDistance</code> (inner radius) and <code>maxDistance</code> (outer radius). Inside the inner radius the effect is 100%, outside the outer radius it is 0%, and in between it blends by distance.</li>
      <li>Unreal's <b>Audio Volume</b> changes reverb gradually over the Fade Time in its Reverb Settings.</li>
    </ul>
    <p>The <b>Interior Settings</b> of an Audio Volume split space in another way. When the listener is inside, outside sources get the Exterior Volume and Exterior LPF. When the listener is outside, inside sources get the Interior values. Each value has its own fade time.</p>
    <p>Downsides: overlapping zones need a priority or weight rule. If the blend band is too wide, you hear cave reverb while still outside.
    This sample sends each preset through its own ConvolverNode (an impulse response made from decaying noise) and blends only the wet gains.</p>`,
    look: [
      'In A, the wet level graph jumps straight up when the listener crosses the cave wall. In B, it ramps between the inner and outer radius.',
      'Compare "Recent max change (per frame)". A shows more than 10 dB, B less than 1 dB.',
      'In B, enter the cave. The "Waterfall LPF" line below drops slowly, and the outside waterfall sounds muffled like it is behind a wall. A stays the same.',
      'Raise A\'s fade time to 0.5 s. The jump shrinks even with an instant swap. But it reacts late at the edge.',
      'Press "Sound on" and listen to A. The reverb turns on suddenly at the entrance. In B, it starts to ring before the entrance and grows slowly.',
    ],
    refs: [
      'Full effect inside Min Distance, no effect outside Max Distance, a gradual blend in between.',
      'Properties such as minDistance, maxDistance, reverbPreset, and decayTime.',
      'Reverb Settings (Reverb Effect, Volume, Fade Time) and Interior Settings (Exterior/Interior Volume, LPF, and a fade time for each).',
      'Builds convolution reverb from an impulse response buffer.',
    ],
    params: {
      blend: { label: 'Preset switch', group: 'Reverb zone', options: { hard: 'Instant swap at the edge', radius: 'Radius blend (min ~ max)' } },
      minDist: { label: 'Inner radius (minDistance)', help: 'Cave reverb is 100% inside this' },
      maxDist: { label: 'Outer radius (maxDistance)', help: 'Cave reverb is 0% outside this' },
      fade: { label: 'Fade time (s)', help: 'Time for the weight to follow its target' },
      interior: { label: 'Interior/exterior LPF (Interior Settings)', group: 'Interior, exterior' },
      extDb: 'Volume across wall (dB)',
      extLpf: 'LPF across wall (Hz)',
      intFade: 'Interior fade time (s)',
      caveDecay: { label: 'Cave decay time (s)', group: 'Presets' },
      caveWet: { label: 'Cave wet level (dB)', help: 'The outside preset is fixed at -20 dB, 0.4 s' },
      speed: { label: 'Listener speed', group: 'Scene' },
      sound: { label: 'Sound on', buttonLabel: 'Sound on/off', group: 'Sound' },
      listen: 'View that plays sound',
      vol: 'Volume',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params, v2 = U.v2;
    const col = ctx.side === 'a' ? C.a : C.b;
    const WW = 640, WH = 360, FMAX = 20000, HIST = 240, SAMPLE = 1 / 30;
    const CAVE = v2(450, 180), WALL_R = 110, GAP = 0.38;
    const OUT_WET = -20, OUT_DECAY = 0.4, OUT_PRE = 5, CAVE_PRE = 40;
    const FALLS = v2(90, 70), DRIP = v2(500, 215);
    const PATH = [v2(60, 300), v2(200, 240), v2(330, 182), v2(450, 180), v2(520, 240), v2(450, 180), v2(330, 182), v2(200, 240)];
    const lin = (db) => Math.pow(10, db / 20);
    const toDb = (g) => 20 * Math.log10(Math.max(1e-6, g));

    let Lp, seg, w, iW, hist, sampleAcc, maxStep, wetDb, dripT, rings, rng;
    const targetW = () => {
      const d = v2.dist(Lp, CAVE);
      if (P.blend === 'hard') return d < WALL_R ? 1 : 0;
      const lo = Math.min(P.minDist, P.maxDist - 1);
      return 1 - U.clamp((d - lo) / (P.maxDist - lo), 0, 1);
    };
    const inside = () => v2.dist(Lp, CAVE) < WALL_R;
    function init() {
      rng = U.rng(ctx.seed);
      Lp = v2(PATH[0].x, PATH[0].y); seg = 0;
      w = targetW(); iW = inside() ? 1 : 0;
      hist = []; sampleAcc = 0; maxStep = 0; dripT = 0.3; rings = [];
      wetDb = curWetDb();
    }
    function curWetDb() { return toDb(U.lerp(lin(OUT_WET), lin(P.caveWet), w)); }
    const decay = () => U.lerp(OUT_DECAY, P.caveDecay, w);
    const preMs = () => U.lerp(OUT_PRE, CAVE_PRE, w);
    // 벽 너머 처리 양: 바깥 음원은 청자가 안에 있을 때, 동굴 음원은 밖에 있을 때
    const fallsAmt = () => (P.interior ? iW : 0);
    const dripAmt = () => (P.interior ? 1 - iW : 0);
    const cutOf = (amt) => Math.exp(U.lerp(Math.log(FMAX), Math.log(P.extLpf), amt));
    const distGain = (s) => 1 / (1 + Math.max(0, v2.dist(Lp, s) - 40) / 120);
    init();

    // ── 오디오: "소리 켜기" 버튼을 눌러야 생성 ──
    let ac = null, A = null, irDirty = false, irTimer = 0;
    function makeIR(decaySec, preSec, seed) {
      const sr = ac.sampleRate, len = Math.floor(sr * (preSec + decaySec)), pre = Math.floor(sr * preSec);
      const buf = ac.createBuffer(2, len, sr), r = U.rng(seed);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = pre; i < len; i++) d[i] = (r.next() * 2 - 1) * Math.exp((-6.9 * (i - pre)) / (sr * decaySec));
      }
      return buf;
    }
    function connectConv(old, buffer, out) {
      const cv = ac.createConvolver(); cv.buffer = buffer;
      A.send.connect(cv); cv.connect(out);
      if (old) { try { A.send.disconnect(old); old.disconnect(); } catch (e) { /* 이미 끊김 */ } }
      return cv;
    }
    function soundToggle() {
      if (ac) { stopAudio(); return; }
      if (typeof AudioContext === 'undefined') return;
      ac = new AudioContext();
      A = {};
      A.master = ac.createGain(); A.master.gain.value = 0; A.master.connect(ac.destination);
      A.dry = ac.createGain(); A.dry.connect(A.master);
      A.send = ac.createGain();
      A.gOut = ac.createGain(); A.gOut.gain.value = 0; A.gOut.connect(A.master);
      A.gCave = ac.createGain(); A.gCave.gain.value = 0; A.gCave.connect(A.master);
      A.convOut = connectConv(null, makeIR(OUT_DECAY, OUT_PRE / 1000, ctx.seed + 1), A.gOut);
      A.convCave = connectConv(null, makeIR(P.caveDecay, CAVE_PRE / 1000, ctx.seed + 2), A.gCave);
      // 바깥 음원: 폭포 (코드로 만든 노이즈)
      const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0), r = U.rng(ctx.seed + 9);
      for (let i = 0; i < nd.length; i++) nd[i] = (r.next() * 2 - 1) * 0.3;
      const ns = ac.createBufferSource(); ns.buffer = nb; ns.loop = true;
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 400;
      A.fLp = ac.createBiquadFilter(); A.fLp.type = 'lowpass'; A.fLp.frequency.value = FMAX;
      A.fAmp = ac.createGain(); A.fAmp.gain.value = 0;
      ns.connect(hp); hp.connect(A.fLp); A.fLp.connect(A.fAmp); A.fAmp.connect(A.dry); A.fAmp.connect(A.send); ns.start();
      // 동굴 음원: 물방울 (짧은 사인 블립, 이벤트마다 생성)
      A.dLp = ac.createBiquadFilter(); A.dLp.type = 'lowpass'; A.dLp.frequency.value = FMAX;
      A.dAmp = ac.createGain(); A.dAmp.gain.value = 0;
      A.dLp.connect(A.dAmp); A.dAmp.connect(A.dry); A.dAmp.connect(A.send);
      if (ac.resume) ac.resume();
    }
    function stopAudio() {
      if (!ac) return;
      try { ac.close(); } catch (e) { /* 이미 닫힘 */ }
      ac = null; A = null;
    }
    function dripSound(pitch) {
      const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(1400 * pitch, t); o.frequency.exponentialRampToValueAtTime(500 * pitch, t + 0.07);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.6, t + 0.004); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.connect(g); g.connect(A.dLp); o.start(t); o.stop(t + 0.15);
    }
    const audible = () => !!ac && P.listen === ctx.side;

    function layout() {
      const W = ctx.width, H = ctx.height, mapH = H * 0.6;
      const sc = Math.min(W / WW, mapH / WH);
      return { W, H, mapH, sc, ox: (W - WW * sc) / 2, oy: 0 };
    }
    const follow = (cur, tgt, tau, dt) => (tau <= 0 ? tgt : cur + (tgt - cur) * (1 - Math.exp(-dt / tau)));

    return {
      update(dt) {
        const m = ctx.input.mouse, Ly = layout();
        if (m.down && m.inside && m.y < Ly.mapH) {
          const tgt = v2((m.x - Ly.ox) / Ly.sc, (m.y - Ly.oy) / Ly.sc);
          const d = v2.sub(tgt, Lp), len = v2.len(d), stp = P.speed * 2 * dt;
          if (len > 1) Lp = v2.add(Lp, v2.scale(d, Math.min(1, stp / len)));
        } else {
          let move = P.speed * dt;
          while (move > 0) {
            const tgt = PATH[(seg + 1) % PATH.length], d = v2.sub(tgt, Lp), len = v2.len(d);
            if (len <= move) { Lp = v2(tgt.x, tgt.y); move -= len; seg = (seg + 1) % PATH.length; }
            else { Lp = v2.add(Lp, v2.scale(d, move / len)); move = 0; }
          }
        }
        Lp.x = U.clamp(Lp.x, 5, WW - 5); Lp.y = U.clamp(Lp.y, 5, WH - 5);

        w = follow(w, targetW(), P.fade, dt);
        iW = follow(iW, inside() ? 1 : 0, P.intFade, dt);
        const prev = wetDb;
        wetDb = curWetDb();
        maxStep = Math.max(maxStep * Math.exp(-dt * 0.3), Math.abs(wetDb - prev));

        // 물방울 이벤트와 잔향 꼬리 표시
        dripT -= dt;
        if (dripT <= 0) {
          dripT = rng.range(0.55, 1.1);
          const pitch = rng.range(0.85, 1.2);
          rings.push({ age: 0 });
          if (ac && A) dripSound(pitch);
        }
        for (const r of rings) r.age += dt;
        rings = rings.filter((r) => r.age < decay());

        sampleAcc += dt;
        while (sampleAcc >= SAMPLE) {
          sampleAcc -= SAMPLE;
          hist.push({ wet: wetDb, fc: Math.log(cutOf(fallsAmt())), dc: Math.log(cutOf(dripAmt())) });
          if (hist.length > HIST) hist.shift();
        }

        if (ac && A) {
          const now = ac.currentTime;
          // A의 즉시 교체는 일부러 거의 0인 시간 상수로 바꿔 튐을 들려줌
          const tc = P.blend === 'hard' && P.fade <= 0 ? 0.0005 : 0.02;
          A.master.gain.setTargetAtTime(audible() ? P.vol : 0, now, 0.03);
          A.gOut.gain.setTargetAtTime((1 - w) * lin(OUT_WET), now, tc);
          A.gCave.gain.setTargetAtTime(w * lin(P.caveWet), now, tc);
          A.fAmp.gain.setTargetAtTime(0.5 * distGain(FALLS) * lin(fallsAmt() * P.extDb), now, 0.02);
          A.fLp.frequency.setTargetAtTime(cutOf(fallsAmt()), now, 0.02);
          A.dAmp.gain.setTargetAtTime(distGain(DRIP) * lin(dripAmt() * P.extDb), now, 0.02);
          A.dLp.frequency.setTargetAtTime(cutOf(dripAmt()), now, 0.02);
          if (irDirty) {
            irTimer -= dt;
            if (irTimer <= 0) { irDirty = false; A.convCave = connectConv(A.convCave, makeIR(P.caveDecay, CAVE_PRE / 1000, ctx.seed + 2), A.gCave); }
          }
        }
      },
      render() {
        const g = ctx.g, { W, H, mapH, sc, ox, oy } = layout();
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        D.rect(g, 0, 0, WW, WH, '#1a1e17');
        D.circle(g, CAVE.x, CAVE.y, WALL_R, '#121318');
        // 영역 표시
        if (P.blend === 'radius') {
          const lo = Math.min(P.minDist, P.maxDist - 1);
          const gr = g.createRadialGradient(CAVE.x, CAVE.y, lo, CAVE.x, CAVE.y, P.maxDist);
          gr.addColorStop(0, 'rgba(79,195,247,0.18)'); gr.addColorStop(1, 'rgba(79,195,247,0)');
          g.fillStyle = gr; g.beginPath(); g.arc(CAVE.x, CAVE.y, P.maxDist, 0, U.TAU); g.fill();
          D.circle(g, CAVE.x, CAVE.y, lo, 'rgba(79,195,247,0.18)', col, 2);
          g.setLineDash([8, 6]); D.circle(g, CAVE.x, CAVE.y, P.maxDist, null, col, 2); g.setLineDash([]);
          D.text(g, 'min', CAVE.x, CAVE.y - lo - 16, { size: 12, color: col, align: 'center' });
          D.text(g, 'max', CAVE.x, CAVE.y - P.maxDist + 4, { size: 12, color: col, align: 'center' });
        } else {
          g.setLineDash([3, 6]); D.circle(g, CAVE.x, CAVE.y, WALL_R + 8, null, col, 2); g.setLineDash([]);
          D.text(g, GTL.L('트리거 경계', 'Trigger edge'), CAVE.x, CAVE.y - WALL_R - 26, { size: 12, color: col, align: 'center' });
        }
        // 동굴 벽 (왼쪽에 입구)
        g.beginPath(); g.arc(CAVE.x, CAVE.y, WALL_R, Math.PI + GAP, Math.PI * 3 - GAP);
        g.strokeStyle = '#8a8070'; g.lineWidth = 10; g.stroke();
        D.text(g, GTL.L('동굴', 'Cave'), CAVE.x + 30, CAVE.y + 60, { size: 13, color: C.dim });
        // 잔향 꼬리: 물방울마다 퍼지는 원, 남은 에너지만큼 진함
        const dec = decay(), wl = lin(wetDb);
        for (const r of rings) {
          const a = Math.exp((-6.9 * r.age) / dec) * Math.min(1, wl * 1.4);
          D.circle(g, DRIP.x, DRIP.y, 6 + r.age * 70, null, `rgba(255,203,107,${(a * 0.8).toFixed(3)})`, 2);
        }
        // 음원
        for (let i = 0; i < 4; i++) D.line(g, FALLS.x - 18 + i * 12, FALLS.y - 26, FALLS.x - 18 + i * 12 + 3, FALLS.y + 20, 'rgba(137,221,255,0.5)', 3);
        D.circle(g, FALLS.x, FALLS.y, 9, C.warn, '#fff', 2);
        D.text(g, GTL.L('폭포 (바깥 음원)', 'Waterfall (outside)'), FALLS.x + 16, FALLS.y - 6, { size: 12, color: C.warn });
        D.circle(g, DRIP.x, DRIP.y, 7, C.warn, '#fff', 2);
        D.text(g, GTL.L('물방울 (동굴 음원)', 'Drip (cave)'), DRIP.x - 40, DRIP.y + 14, { size: 12, color: C.warn });
        // 경로와 청자
        g.setLineDash([2, 6]);
        D.poly(g, PATH.slice(0, 5), null, 'rgba(255,255,255,0.15)', 1.5, false);
        g.setLineDash([]);
        D.circle(g, Lp.x, Lp.y, 9, col, '#fff', 2);
        D.text(g, inside() ? GTL.L('안', 'in') : GTL.L('밖', 'out'), Lp.x, Lp.y - 26, { size: 12, color: col, align: 'center' });
        g.restore();

        // ── 아래: Wet 레벨, LPF 기록 + 현재 잔향 응답 ──
        const py = mapH + 8, ph = Math.max(48, H - py - 8), pw1 = (W - 30) * 0.6, pw2 = (W - 30) - pw1;
        const hh = ph / 2 - 3;
        D.plot(g, hist.map((h) => h.wet), 10, py, pw1, hh, { min: -24, max: 0, color: col, label: GTL.L('Wet 레벨 (-24~0dB, 8초)', 'Wet level (-24~0dB, 8 s)') });
        D.plot(g, hist.map((h) => h.fc), 10, py + hh + 6, pw1, hh, { min: Math.log(100), max: Math.log(FMAX) + 0.2, color: C.warn, label: GTL.L('폭포 LPF (로그), 흰색: 물방울 LPF', 'Waterfall LPF (log), white: drip LPF') });
        D.plot(g, hist.map((h) => h.dc), 10, py + hh + 6, pw1, hh, { min: Math.log(100), max: Math.log(FMAX) + 0.2, color: 'rgba(255,255,255,0.55)', background: false, lineWidth: 1 });
        // 임펄스 응답 모양: 직접음 1개 + 선지연 뒤 지수 감쇠 꼬리
        const fx = 20 + pw1, T = 6.5, base = py + ph - 6, top = py + 16, hgt = base - top;
        D.rect(g, fx, py, pw2, ph, 'rgba(0,0,0,0.35)');
        const tx = (t) => fx + 6 + (t / T) * (pw2 - 12);
        D.line(g, tx(0), base, tx(0), top, C.text, 2);
        const pre = preMs() / 1000, amp = Math.min(1, wl);
        g.beginPath(); g.moveTo(tx(pre), base);
        for (let i = 0; i <= 40; i++) {
          const t = pre + (i / 40) * dec;
          g.lineTo(tx(t), base - hgt * amp * Math.exp((-6.9 * (t - pre)) / dec));
        }
        g.lineTo(tx(pre + dec), base); g.closePath();
        g.fillStyle = col; g.globalAlpha = 0.35; g.fill(); g.globalAlpha = 1;
        g.strokeStyle = col; g.lineWidth = 1.5; g.stroke();
        D.text(g, GTL.L('현재 잔향 응답 (0~6.5초)', 'Current reverb response (0~6.5 s)'), fx + 4, py + 2, { size: 10, color: C.dim });

        ctx.stat(GTL.L('동굴 가중치 w', 'Cave weight w'), w.toFixed(2));
        ctx.stat(GTL.L('Wet 레벨', 'Wet level'), wetDb.toFixed(1) + ' dB');
        ctx.stat(GTL.L('잔향 시간', 'Decay time'), dec.toFixed(2) + ' s');
        ctx.stat(GTL.L('선지연', 'Pre-delay'), preMs().toFixed(0) + ' ms');
        ctx.stat(GTL.L('최근 최대 변화 (프레임당)', 'Recent max change (per frame)'), maxStep.toFixed(2) + ' dB');
        ctx.stat(GTL.L('폭포 LPF', 'Waterfall LPF'), cutOf(fallsAmt()).toFixed(0) + ' Hz');
        ctx.stat(GTL.L('소리', 'Sound'), typeof AudioContext === 'undefined' ? GTL.L('미지원', 'Not supported') : !ac ? GTL.L('꺼짐', 'Off') : audible() ? GTL.L('재생 중', 'Playing') : GTL.L('음소거 (다른 뷰 선택)', 'Muted (other view selected)'));
      },
      onParam(key) { if (key === 'caveDecay' && ac) { irDirty = true; irTimer = 0.3; } },
      onAction(key) { if (key === 'sound') soundToggle(); },
      dispose() { stopAudio(); },
    };
  },
});
