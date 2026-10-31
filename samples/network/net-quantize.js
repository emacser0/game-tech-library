// 벡터, 회전 양자화 (Unreal FVector_NetQuantize, FRotator::SerializeCompressed)
(() => {
  const U = GTL.util, D = U.draw, C = U.colors;

  // 위치 방식: 배율(scale), 성분당 최대 비트(maxBits). float는 성분당 32비트
  const POS = {
    float: { scale: 0, label: ['FVector (float32 × 3)', 'FVector (float32 × 3)'] },
    q1: { scale: 1, maxBits: 20, label: ['NetQuantize (1cm)', 'NetQuantize (1 cm)'] },
    q10: { scale: 10, maxBits: 24, label: ['NetQuantize10 (0.1cm)', 'NetQuantize10 (0.1 cm)'] },
    q100: { scale: 100, maxBits: 30, label: ['NetQuantize100 (0.01cm)', 'NetQuantize100 (0.01 cm)'] },
  };
  // 가변 길이 정수 벡터: 비트 수 필드(5비트) + 성분마다 (부호 포함) 필요한 비트 수. UE 방식을 단순화한 근사
  function packedBits(v, scale, maxBits) {
    let m = 0;
    for (const c of v) m = Math.max(m, Math.abs(Math.round(c * scale)));
    const b = Math.min(maxBits, Math.ceil(Math.log2(m + 1)) + 1);
    return 5 + 3 * b;
  }
  const quantPos = (v, mode) => (mode === 'float' ? v.map((c) => Math.fround(c)) : v.map((c) => Math.round(c * POS[mode].scale) / POS[mode].scale));
  const posBits = (v, mode) => (mode === 'float' ? 96 : packedBits(v, POS[mode].scale, POS[mode].maxBits));

  // 회전: pitch, yaw, roll(0). 압축 방식은 성분마다 "0이 아님" 1비트 + 값 비트
  function quantRot(yaw, pitch, mode) {
    if (mode === 'float') return { yaw: Math.fround(yaw), pitch: Math.fround(pitch), bits: 96 };
    if (mode === 'byte' || mode === 'short') {
      const n = mode === 'byte' ? 256 : 65536, vb = mode === 'byte' ? 8 : 16;
      const q = (a) => { const k = Math.round((U.wrap(a, 0, 360) / 360) * n) % n; return { a: (k / n) * 360, nz: k !== 0 }; };
      const y = q(yaw), p = q(pitch);
      return { yaw: y.a, pitch: p.a, bits: 3 + (y.nz ? vb : 0) + (p.nz ? vb : 0) };
    }
    // NetQuantizeNormal: 방향 벡터 성분마다 [-1, 1]을 16비트 고정소수로
    const r = (c) => Math.round(c * 32767) / 32767;
    const yr = U.rad(yaw), pr = U.rad(pitch);
    const dx = r(Math.cos(pr) * Math.cos(yr)), dy = r(Math.cos(pr) * Math.sin(yr)), dz = r(Math.sin(pr));
    return { yaw: U.deg(Math.atan2(dy, dx)), pitch: U.deg(Math.atan2(dz, Math.hypot(dx, dy))), bits: 48 };
  }

  GTL.register({
    id: 'net-quantize',
    title: '벡터, 회전 양자화 (Unreal NetQuantize)',
    summary: 'float32 벡터 하나는 96비트. Unreal의 FVector_NetQuantize는 정수로 반올림해 약 절반으로 줄이고, 회전은 축마다 8비트나 16비트로 압축함. 대신 느린 물체는 계단처럼 움직이고, 멀리 겨냥하면 조준 방향 오차가 커짐.',
    views: { a: 'float32 그대로', b: 'NetQuantize + 8비트 회전' },
    controls: '조작 없음. 물체가 천천히 움직이고 조준 방향이 천천히 돌아감.',
    info: `
      <p><b>양자화</b>: 실수를 정해진 간격의 정수로 반올림해 적은 비트로 보내는 기법. Unreal은 복제용 벡터, 회전 타입을 정밀도별로 제공함.</p>
      <ul>
        <li><code>FVector</code>: float32 3개, 96비트.</li>
        <li><code>FVector_NetQuantize</code>: 1cm(정수) 단위. 값 크기에 맞춰 성분 비트 수를 줄임(최대 20비트).</li>
        <li><code>FVector_NetQuantize10</code>, <code>FVector_NetQuantize100</code>: 0.1cm, 0.01cm 단위. 비트가 더 듦.</li>
        <li><code>FVector_NetQuantizeNormal</code>: 길이 1인 방향 벡터. 성분마다 [-1, 1]을 16비트로.</li>
        <li><code>FRotator::SerializeCompressed</code>: 축마다 8비트(1.4도 간격). <code>SerializeCompressedShort</code>는 16비트(0.0055도). 0인 축은 1비트만 씀.</li>
      </ul>
      <p>왜 필요한가: 위치와 회전은 거의 모든 패킷에 실림. 플레이어 수 × 전송률을 곱하면 비트 절약이 그대로 대역폭 절약이 됨.
      Unreal의 <code>FRepMovement</code>도 기본값이 위치 정수 반올림, 회전 8비트.</p>
      <p>단점: 간격보다 작은 움직임은 사라짐. 느린 물체는 계단처럼 튀고, 각도 오차는 거리에 비례해 커짐(30m에서 1.4도 간격이면 최대 약 37cm).</p>
      <p>이 샘플의 가변 길이 비트 수는 UE 직렬화 방식을 단순화한 근사값.</p>`,
    diagram: [
      (L) => `<svg viewBox="0 0 540 190" xmlns="http://www.w3.org/2000/svg">
        <text x="4" y="14" class="t-a">${L('A: float32 성분 3개 = 96비트', 'A: 3 float32 components = 96 bits')}</text>
        ${[0, 1, 2].map((i) => `<rect x="${4 + i * 140}" y="22" width="6" height="20" class="f-a"/><rect x="${10 + i * 140}" y="22" width="32" height="20" class="f-dim"/><rect x="${42 + i * 140}" y="22" width="96" height="20" class="f-dim"/>
          <text x="${26 + i * 140}" y="36" text-anchor="middle" class="t-small t-mono">${L('지수', 'exp')}</text><text x="${90 + i * 140}" y="36" text-anchor="middle" class="t-small t-mono">${L('가수 23비트', 'mantissa 23')} ${['x', 'y', 'z'][i]}</text>`).join('')}
        <text x="4" y="58" class="t-small t-dim">${L('부호 1 + 지수 8 + 가수 23. 값이 작든 크든 항상 32비트', 'sign 1 + exponent 8 + mantissa 23. Always 32 bits, large value or small')}</text>
        <text x="4" y="82" class="t-b">${L('B: NetQuantize = 비트 수 + 정수 성분 3개', 'B: NetQuantize = bit count + 3 integers')}</text>
        <rect x="4" y="90" width="22" height="20" class="f-b"/><text x="15" y="104" text-anchor="middle" class="t-small t-mono">5</text>
        ${[0, 1, 2].map((i) => `<rect x="${28 + i * 72}" y="90" width="70" height="20" class="f-dim"/><text x="${63 + i * 72}" y="104" text-anchor="middle" class="t-small t-mono">${['x', 'y', 'z'][i]}: 15</text>`).join('')}
        <text x="250" y="104" class="t-small t-mono t-b">${L('약 50비트 (좌표 ±16000cm)', 'about 50 bits (coords ±16000 cm)')}</text>
        <text x="4" y="134" class="t-small t-dim">${L('반올림 격자: q = round(x × 배율)', 'Rounding grid: q = round(x × scale)')}</text>
        <line x1="10" y1="164" x2="530" y2="164" class="d-dim"/>
        ${[0, 1, 2, 3, 4].map((k) => `<line x1="${20 + k * 120}" y1="152" x2="${20 + k * 120}" y2="176" class="d-line"/><text x="${20 + k * 120}" y="188" text-anchor="middle" class="t-small t-mono">${1200 + k}</text>`).join('')}
        ${Array.from({ length: 40 }, (_, k) => (k % 10 ? `<line x1="${20 + k * 12}" y1="159" x2="${20 + k * 12}" y2="169" class="d-dim"/>` : '')).join('')}
        <circle cx="291" cy="164" r="4" class="f-accent"/><text x="286" y="148" text-anchor="end" class="t-small">${L('실제 1202.26', 'true 1202.26')}</text>
        <path d="M291,170 L260,170" class="d-b"/><circle cx="260" cy="170" r="3" class="f-b"/>
        <text x="300" y="148" class="t-small t-b">${L('1cm 격자: 1202, 0.1cm 격자: 1202.3', '1 cm grid: 1202, 0.1 cm grid: 1202.3')}</text>
      </svg>`,
      (L) => `<svg viewBox="0 0 540 150" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="110" r="6" class="f-dim"/>
        <text x="40" y="132" text-anchor="middle" class="t-small">${L('사수', 'shooter')}</text>
        ${Array.from({ length: 7 }, (_, k) => { const a = (-3 + k) * 4.2 * Math.PI / 180 - 0.17; return `<line x1="40" y1="110" x2="${(40 + 480 * Math.cos(a)).toFixed(1)}" y2="${(110 + 480 * Math.sin(a)).toFixed(1)}" class="d-dim" stroke-dasharray="2 4"/>`; }).join('')}
        <line x1="40" y1="110" x2="${(40 + 470 * Math.cos(-0.205)).toFixed(1)}" y2="${(110 + 470 * Math.sin(-0.205)).toFixed(1)}" class="d-good"/>
        <line x1="40" y1="110" x2="${(40 + 470 * Math.cos(-0.17)).toFixed(1)}" y2="${(110 + 470 * Math.sin(-0.17)).toFixed(1)}" class="d-b"/>
        <path d="M${(40 + 470 * Math.cos(-0.205)).toFixed(1)},${(110 + 470 * Math.sin(-0.205)).toFixed(1)} L${(40 + 470 * Math.cos(-0.17)).toFixed(1)},${(110 + 470 * Math.sin(-0.17)).toFixed(1)}" class="d-bad"/>
        <text x="80" y="130" class="t-small t-dim">${L('점선: 8비트 회전이 낼 수 있는 방향 (1.4도 간격)', 'dotted: directions an 8-bit rotation can send (1.4 deg steps)')}</text>
        <text x="4" y="16" class="t-small">${L('초록: 실제 조준', 'green: true aim')}</text>
        <text x="4" y="30" class="t-small t-b">${L('파랑: 반올림한 방향', 'blue: rounded aim')}</text>
        <text x="4" y="146" class="t-small t-dim">${L('각도 오차는 같아도 빗나가는 거리는 거리에 비례함 (오차 = 거리 × 각도)', 'The angle error is fixed, but the miss distance grows with range (miss = range × angle)')}</text>
      </svg>`,
    ],
    look: [
      'B의 위치 패널에서 물체(파랑)가 1cm 격자를 따라 계단처럼 튐. A(주황)는 실제 경로(초록)를 그대로 따라감.',
      'B의 위치 정밀도를 NetQuantize100으로 바꾸면 계단이 사라지고 위치 비트가 늘어남.',
      '조준 패널에서 B의 회전 압축을 8비트로 두면 목표 지점 오차가 수십 cm. 16비트나 NetQuantizeNormal로 바꾸면 거의 0.',
      '"조준 거리"를 늘리면 같은 각도 오차가 더 큰 빗나감이 됨.',
      '"월드 좌표 크기"를 키우면 정수 성분이 커져서 NetQuantize의 비트 수도 늘어남. float32는 항상 96비트.',
    ],
    refs: [
      { type: 'engine', title: 'Unreal Engine API - FVector_NetQuantize, FVector_NetQuantize10, FVector_NetQuantize100, FVector_NetQuantizeNormal', note: 'NetSerialization.h에 정의된 복제용 벡터 타입. 정밀도별 배율과 최대 비트 수가 다름.' },
      { type: 'engine', title: 'Unreal Engine API - FRotator::SerializeCompressed, SerializeCompressedShort', note: '축마다 8비트, 16비트로 압축. 0인 축은 플래그만 보냄.' },
      { type: 'engine', title: 'Unreal Engine API - FRepMovement', note: 'LocationQuantizationLevel, RotationQuantizationLevel로 이동 복제 정밀도를 고름.' },
      { type: 'article', title: 'Snapshot Compression', url: 'https://gafferongames.com/post/snapshot_compression/', note: 'Glenn Fiedler. 위치, 회전 양자화와 비트 수 계산.' },
    ],
    params: [
      { key: 'posMode', label: '위치 정밀도', type: 'select', group: '기법', options: [
        { value: 'float', label: 'FVector (float32 × 3)' },
        { value: 'q1', label: 'NetQuantize (1cm)' },
        { value: 'q10', label: 'NetQuantize10 (0.1cm)' },
        { value: 'q100', label: 'NetQuantize100 (0.01cm)' },
      ], a: 'float', b: 'q1' },
      { key: 'rotMode', label: '회전 압축', type: 'select', options: [
        { value: 'float', label: 'FRotator (float32 × 3)' },
        { value: 'short', label: 'SerializeCompressedShort (16비트)' },
        { value: 'byte', label: 'SerializeCompressed (8비트)' },
        { value: 'normal', label: 'NetQuantizeNormal (방향 16비트)' },
      ], a: 'float', b: 'byte' },
      { key: 'speed', label: '이동 속도 (cm/s)', type: 'range', min: 0.5, max: 40, step: 0.5, default: 3, shared: true, group: '장면' },
      { key: 'turn', label: '조준 회전 속도 (도/s)', type: 'range', min: 0.2, max: 20, step: 0.2, default: 2, shared: true },
      { key: 'aimDist', label: '조준 거리 (m)', type: 'range', min: 2, max: 100, step: 1, default: 30, shared: true },
      { key: 'world', label: '월드 좌표 크기 (cm)', type: 'select', options: [
        { value: 300, label: '300 (원점 근처)' }, { value: 16000, label: '16000' }, { value: 200000, label: '200000 (2km)' },
      ], default: 16000, shared: true },
      { key: 'sendHz', label: '전송률 (Hz)', type: 'int', min: 5, max: 60, default: 30, shared: true, group: '네트워크' },
      { key: 'players', label: '복제 대상 수', type: 'int', min: 1, max: 200, default: 64, shared: true, help: '총 대역폭 = 대상 수 × 업데이트당 비트 × 전송률' },
      { key: 'restart', label: '다시 시작', type: 'button' },
    ],
    en: {
      title: 'Vector & Rotation Quantization (Unreal NetQuantize)',
      summary: 'One float32 vector is 96 bits. Unreal FVector_NetQuantize rounds to integers and cuts that about in half. Rotations compress to 8 or 16 bits per axis. The cost: slow objects move in steps, and aim direction error grows with range.',
      views: { a: 'Plain float32', b: 'NetQuantize + 8-bit rotation' },
      controls: 'No input. The object drifts slowly and the aim turns slowly.',
      info: `
      <p><b>Quantization</b> rounds a real number to a fixed step, so it fits in fewer bits. Unreal has replication types for vectors and rotations at several precisions.</p>
      <ul>
        <li><code>FVector</code>: 3 float32 values, 96 bits.</li>
        <li><code>FVector_NetQuantize</code>: 1 cm (whole number) steps. Uses only as many bits per component as the value needs (max 20).</li>
        <li><code>FVector_NetQuantize10</code>, <code>FVector_NetQuantize100</code>: 0.1 cm and 0.01 cm steps. They cost more bits.</li>
        <li><code>FVector_NetQuantizeNormal</code>: a unit direction vector. Each component in [-1, 1] uses 16 bits.</li>
        <li><code>FRotator::SerializeCompressed</code>: 8 bits per axis (1.4 degree steps). <code>SerializeCompressedShort</code> uses 16 bits (0.0055 degrees). A zero axis costs only 1 bit.</li>
      </ul>
      <p>Why: position and rotation go into almost every packet. Multiply by player count and send rate, and every bit saved is bandwidth saved.
      Unreal <code>FRepMovement</code> also defaults to whole-number location and 8-bit rotation.</p>
      <p>Downside: motion smaller than the step disappears. Slow objects jump in steps, and angle error grows with distance (a 1.4 degree step at 30 m can miss by about 37 cm).</p>
      <p>The variable bit counts in this sample are a simplified estimate of UE serialization.</p>`,
      look: [
        'In the B position panel, the object (blue) jumps along the 1 cm grid in steps. A (orange) follows the true path (green) exactly.',
        'Switch B position precision to NetQuantize100. The steps disappear and position bits grow.',
        'In the aim panel with 8-bit rotation in B, the target point misses by tens of cm. With 16-bit or NetQuantizeNormal it is almost 0.',
        'Raise "Aim distance". The same angle error becomes a bigger miss.',
        'Raise "World coordinate size". The integer components get bigger, so NetQuantize needs more bits. float32 is always 96 bits.',
      ],
      refs: [
        'Replication vector types in NetSerialization.h. Each has its own scale and max bit count.',
        'Compresses each axis to 8 or 16 bits. A zero axis sends only a flag.',
        'LocationQuantizationLevel and RotationQuantizationLevel pick the precision for movement replication.',
        'Glenn Fiedler. Position and rotation quantization with bit counts.',
      ],
      params: {
        posMode: { label: 'Position precision', group: 'Technique', options: { q1: 'NetQuantize (1 cm)', q10: 'NetQuantize10 (0.1 cm)', q100: 'NetQuantize100 (0.01 cm)' } },
        rotMode: { label: 'Rotation compression', options: { short: 'SerializeCompressedShort (16-bit)', byte: 'SerializeCompressed (8-bit)', normal: 'NetQuantizeNormal (16-bit direction)' } },
        speed: { label: 'Move speed (cm/s)', group: 'Scene' },
        turn: 'Aim turn speed (deg/s)',
        aimDist: 'Aim distance (m)',
        world: { label: 'World coordinate size (cm)', options: { 300: '300 (near origin)', 200000: '200000 (2 km)' } },
        sendHz: { label: 'Send rate (Hz)', group: 'Network' },
        players: { label: 'Replicated objects', help: 'Total bandwidth = objects × bits per update × send rate' },
        restart: 'Restart',
      },
    },

    setup(ctx) {
      const P = ctx.params;
      let st;
      function init() {
        st = {
          t: 0, sAcc: 1, pos: [0, 0, 0], head: 0.4, yaw: 20, pitch: 2, dYaw: 0, dPitch: 0,
          truth: [], recv: [], cur: null, curRot: null, posB: 0, rotB: 0, errHist: [], maxErr: 0, aimErr: 0,
        };
      }
      init();
      const origin = () => { const w = +P.world; return [w * 0.61 + 0.37, -w * 0.43 + 0.81, 120.25]; };

      function tick(dt) {
        st.t += dt;
        st.head += Math.sin(st.t * 0.35) * 0.25 * dt;
        st.pos[0] += Math.cos(st.head) * P.speed * dt;
        st.pos[1] += Math.sin(st.head) * P.speed * dt;
        st.yaw = U.wrap(st.yaw + P.turn * dt * (Math.sin(st.t * 0.15) > -0.3 ? 1 : -1), 0, 360);
        st.pitch = 2 + Math.sin(st.t * 0.4) * 1.5;
        const o = origin();
        const world = [o[0] + st.pos[0], o[1] + st.pos[1], o[2]];
        st.truth.push({ t: st.t, x: world[0], y: world[1] });
        while (st.truth.length && st.truth[0].t < st.t - 4) st.truth.shift();

        st.sAcc += dt;
        if (st.sAcc >= 1 / P.sendHz) {
          st.sAcc %= 1 / P.sendHz;
          const q = quantPos(world, P.posMode);
          st.posB = posBits(world, P.posMode);
          st.cur = { t: st.t, x: q[0], y: q[1] };
          st.recv.push(st.cur);
          while (st.recv.length && st.recv[0].t < st.t - 4) st.recv.shift();
          const r = quantRot(st.yaw, st.pitch, P.rotMode);
          st.rotB = r.bits; st.curRot = r;
          // 양자화 오차만 봄 (보낸 순간의 실제 값과 비교, 전송 지연 제외)
          st.errHist.push(Math.hypot(world[0] - q[0], world[1] - q[1]));
          if (st.errHist.length > 120) st.errHist.shift();
          st.maxErr = Math.max(...st.errHist);
          st.dYaw = U.angleDiff(U.rad(st.yaw), U.rad(r.yaw));
          st.dPitch = st.pitch - r.pitch;
          st.aimErr = Math.hypot(U.deg(st.dYaw), st.dPitch);
        }
      }

      return {
        update(dt) {
          let left = dt;
          while (left > 1e-6) { const h = Math.min(left, 1 / 120); tick(h); left -= h; }
        },
        render() {
          const g = ctx.g, W = ctx.width, H = ctx.height;
          const col = ctx.side === 'a' ? C.a : C.b;
          const pad = 6, top = 30, barH = Math.max(70, Math.min(110, H * 0.28));
          const topH = Math.max(60, H - barH - top - pad * 2);
          const pw = (W - pad * 3) / 2;
          const r1 = { x: pad, y: top, w: pw, h: topH }, r2 = { x: pad * 2 + pw, y: top, w: pw, h: topH };
          const panel = (r, title) => {
            D.rect(g, r.x, r.y, r.w, r.h, 'rgba(255,255,255,0.025)', 'rgba(255,255,255,0.12)');
            D.text(g, title, r.x + 6, r.y + 5, { size: 11, color: C.dim });
          };

          // 1) 위치 확대 패널: 화면 폭이 약 8cm
          panel(r1, GTL.L('위치 (확대, 약 8cm 폭)', 'Position (zoom, about 8 cm wide)'));
          const last = st.truth[st.truth.length - 1];
          if (last) {
            const s = (r1.w - 12) / 8, cx = r1.x + r1.w / 2, cy = r1.y + 20 + (r1.h - 26) / 2;
            const X = (x) => cx + (x - last.x) * s, Y = (y) => cy + (y - last.y) * s;
            g.save(); g.beginPath(); g.rect(r1.x + 1, r1.y + 18, r1.w - 2, r1.h - 19); g.clip();
            if (P.posMode !== 'float') {
              const step = 1 / POS[P.posMode].scale;
              if (step * s >= 4) {
                const x0 = Math.floor((last.x - r1.w / 2 / s) / step) * step, y0 = Math.floor((last.y - r1.h / 2 / s) / step) * step;
                for (let x = x0; X(x) < r1.x + r1.w; x += step) D.line(g, X(x), r1.y + 18, X(x), r1.y + r1.h, 'rgba(255,255,255,0.09)');
                for (let y = y0; Y(y) < r1.y + r1.h; y += step) D.line(g, r1.x, Y(y), r1.x + r1.w, Y(y), 'rgba(255,255,255,0.09)');
              }
            }
            D.poly(g, st.truth.map((p) => ({ x: X(p.x), y: Y(p.y) })), null, C.good, 1.5, false);
            if (st.recv.length) {
              const pts = [];
              st.recv.forEach((p, i) => { if (i) pts.push({ x: X(p.x), y: Y(st.recv[i - 1].y) }); pts.push({ x: X(p.x), y: Y(p.y) }); });
              D.poly(g, pts, null, col, 1.2, false);
              for (const p of st.recv) D.circle(g, X(p.x), Y(p.y), 2, col);
            }
            D.circle(g, X(last.x), Y(last.y), 6, null, C.good, 2);
            if (st.cur) D.circle(g, X(st.cur.x), Y(st.cur.y), 5, col);
            g.restore();
            D.text(g, GTL.L(`초록: 실제, 점: 클라이언트. 최대 오차 ${st.maxErr.toFixed(3)}cm`, `Green: true, dots: client. Max error ${st.maxErr.toFixed(3)} cm`), r1.x + 6, r1.y + r1.h - 16, { size: 10, color: C.dim });
          }

          // 2) 조준 패널
          panel(r2, GTL.L(`조준 (거리 ${P.aimDist}m)`, `Aim (range ${P.aimDist} m)`));
          if (st.curRot) {
            const sx = r2.x + 16, sy = r2.y + r2.h * 0.6, len = r2.w - 40;
            // 조준 방향을 화면 기준 방향으로 돌려 그림. 차이 각도는 실제 값
            const base = -0.25;
            D.circle(g, sx, sy, 5, C.dim);
            D.line(g, sx, sy, sx + Math.cos(base) * len, sy + Math.sin(base) * len, C.good, 1.5);
            D.line(g, sx, sy, sx + Math.cos(base + st.dYaw) * len, sy + Math.sin(base + st.dYaw) * len, col, 1.5);
            const angErr = st.aimErr, miss = P.aimDist * 100 * Math.tan(U.rad(angErr));
            // 목표 확대 (1px = 1cm, ±50cm)
            const ix = r2.x + r2.w - 96, iy = r2.y + 22, iw = 90;
            D.rect(g, ix, iy, iw, iw, 'rgba(0,0,0,0.4)', 'rgba(255,255,255,0.15)');
            const icx = ix + iw / 2, icy = iy + iw / 2, k = iw / 100;
            D.circle(g, icx, icy, 20 * k, null, 'rgba(255,255,255,0.25)', 1);
            D.circle(g, icx, icy, 3, C.good);
            const mx = U.clamp(P.aimDist * 100 * Math.tan(st.dYaw), -50, 50), my = U.clamp(st.dPitch * P.aimDist * 100 * Math.PI / 180, -50, 50);
            D.circle(g, icx + mx * k, icy - my * k, 3, col);
            D.text(g, GTL.L('목표 ±50cm', 'target ±50 cm'), ix + 3, iy + iw + 3, { size: 10, color: C.dim });
            D.text(g, GTL.L(`각도 오차 ${angErr.toFixed(3)}도, 빗나감 ${miss.toFixed(1)}cm`, `Angle error ${angErr.toFixed(3)} deg, miss ${miss.toFixed(1)} cm`), r2.x + 6, r2.y + r2.h - 16, { size: 10, color: C.dim });
          }

          // 3) 비트 막대
          const by = top + topH + pad, bx = pad, bw = W - pad * 2;
          D.rect(g, bx, by, bw, barH, 'rgba(0,0,0,0.3)', 'rgba(255,255,255,0.1)');
          D.text(g, GTL.L('업데이트당 비트 (흐린 막대: float32 기준)', 'Bits per update (faint bar: float32 baseline)'), bx + 6, by + 4, { size: 10, color: C.dim });
          const lw = 70, scale = (bw - lw - 60) / 192;
          const rows = [
            [GTL.L('위치', 'Position'), st.posB, 96],
            [GTL.L('회전', 'Rotation'), st.rotB, 96],
            [GTL.L('합계', 'Total'), st.posB + st.rotB, 192],
          ];
          const rh = (barH - 22) / 3;
          rows.forEach(([name, v, base], i) => {
            const y = by + 20 + i * rh;
            D.text(g, name, bx + 6, y + rh / 2, { size: 10, baseline: 'middle', color: C.text });
            D.rect(g, bx + lw, y + 2, base * scale, rh - 5, 'rgba(255,255,255,0.08)');
            D.rect(g, bx + lw, y + 2, v * scale, rh - 5, col);
            D.text(g, `${v}`, bx + lw + Math.max(v, base) * scale + 6, y + rh / 2, { size: 10, baseline: 'middle', color: C.text });
          });

          const kbps = ((st.posB + st.rotB) * P.sendHz * P.players) / 1000;
          ctx.stat(GTL.L('위치 비트 / 업데이트', 'Position bits / update'), st.posB);
          ctx.stat(GTL.L('회전 비트 / 업데이트', 'Rotation bits / update'), st.rotB);
          ctx.stat(GTL.L('총 대역폭', 'Total bandwidth'), kbps.toFixed(1) + ' kbps');
          ctx.stat(GTL.L('최대 위치 오차', 'Max position error'), st.maxErr.toFixed(3) + ' cm');
          ctx.stat(GTL.L('조준 각도 오차', 'Aim angle error'), (st.aimErr || 0).toFixed(3) + GTL.L('도', ' deg'));
          ctx.stat(GTL.L('목표 지점 빗나감', 'Miss at target'), (P.aimDist * 100 * Math.tan(U.rad(st.aimErr || 0))).toFixed(1) + ' cm');
        },
        onAction(key) { if (key === 'restart') init(); },
      };
    },
  });
})();
