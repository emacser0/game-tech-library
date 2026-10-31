// 델타 압축 & 양자화 (Snapshot Compression)
(() => {
  const U = GTL.util, D = U.draw, C = U.colors;
  const STEP = 1000 / 60;

  // ───────── 공용 네트워크 시뮬레이션 헬퍼 (network 카테고리 샘플마다 동일) ─────────
  function hash01(seed, a, b) {
    let h = (seed | 0) ^ Math.imul(a | 0, 0x9e3779b1) ^ Math.imul((b | 0) + 0x632be5ab, 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
    h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  // 단방향 링크. send(now, key, data, {lat, jit, loss}, bytes). key는 보낸 시각 기반 정수(같은 key → 같은 지연/손실)
  class Link {
    constructor(seed, chan) { this.seed = seed; this.chan = chan; this.q = []; this.log = []; this.sent = 0; this.lost = 0; this.bytes = 0; }
    send(now, key, data, net, bytes = 0) {
      const r1 = hash01(this.seed, this.chan, key * 2), r2 = hash01(this.seed, this.chan, key * 2 + 1);
      const p = { t0: now, t1: now + net.lat + r1 * net.jit, data, lost: r2 < net.loss, bytes };
      this.sent++; this.bytes += bytes;
      if (p.lost) this.lost++; else this.q.push(p);
      this.log.push(p);
      while (this.log.length && this.log[0].t0 < now - 5000) this.log.shift();
      return p;
    }
    poll(now) {
      const out = [];
      if (!this.q.length) return out;
      const keep = [];
      for (const p of this.q) (p.t1 <= now ? out : keep).push(p);
      this.q = keep;
      return out.sort((a, b) => a.t1 - b.t1);
    }
  }
  function readKeys(input) {
    let x = 0, y = 0;
    if (input.key('ArrowLeft') || input.key('KeyA')) x -= 1;
    if (input.key('ArrowRight') || input.key('KeyD')) x += 1;
    if (input.key('ArrowUp') || input.key('KeyW')) y -= 1;
    if (input.key('ArrowDown') || input.key('KeyS')) y += 1;
    return { x, y };
  }
  const AUTO = [[1.0, 1, 0], [0.5, 0, 0], [1.0, -1, 0], [0.35, 0, 0], [0.7, 0, -1], [0.7, 0, 1], [0.3, 0, 0], [0.55, 1, 1], [0.55, -1, -1], [0.45, 0, 0]];
  const AUTO_LEN = AUTO.reduce((s, a) => s + a[0], 0);
  function autoMove(tSec) {
    let u = tSec % AUTO_LEN;
    for (const [d, x, y] of AUTO) { if (u < d) return { x, y }; u -= d; }
    return { x: 0, y: 0 };
  }
  // 키 입력이 있으면 키, 없고 자동 입력이 켜져 있으면 스크립트 입력
  function getMove(ctx, nowMs) {
    const k = readKeys(ctx.input);
    if (k.x || k.y || !ctx.params.auto) return k;
    return autoMove(nowMs / 1000);
  }
  function layout(W, H, n, tlH = 70) {
    const pad = 6;
    const tl = { x: pad, y: H - tlH - pad, w: W - pad * 2, h: tlH };
    const ph = Math.max(40, tl.y - pad * 2);
    const pw = (W - pad * (n + 1)) / n;
    return { panels: Array.from({ length: n }, (_, i) => ({ x: pad + i * (pw + pad), y: pad, w: pw, h: ph })), tl };
  }
  function panel(g, r, title, col) {
    D.rect(g, r.x, r.y, r.w, r.h, 'rgba(255,255,255,0.025)', 'rgba(255,255,255,0.12)');
    D.text(g, title, r.x + 6, r.y + 5, { size: 11, color: col || C.dim });
  }
  function fit(r, WW, WH, top = 20) {
    const s = Math.max(0.01, Math.min((r.w - 8) / WW, (r.h - top - 6) / WH));
    const ox = r.x + (r.w - WW * s) / 2, oy = r.y + top + (r.h - top - 6 - WH * s) / 2;
    return { s, ox, oy, w: WW * s, h: WH * s, X: (wx) => ox + wx * s, Y: (wy) => oy + wy * s };
  }
  // 패킷 타임라인: 오른쪽 끝 = 현재. lanes: [{ link, dir: 1(위→아래) | -1(아래→위), color, lw }]
  function drawTimeline(g, r, now, win, lanes, labels) {
    D.rect(g, r.x, r.y, r.w, r.h, 'rgba(0,0,0,0.3)', 'rgba(255,255,255,0.1)');
    const lx = r.x + 44, lw = r.w - 50, yT = r.y + 13, yB = r.y + r.h - 11;
    D.line(g, lx, yT, lx + lw, yT, 'rgba(255,255,255,0.25)');
    D.line(g, lx, yB, lx + lw, yB, 'rgba(255,255,255,0.25)');
    D.text(g, labels[0], r.x + 5, yT, { size: 10, baseline: 'middle', color: C.text });
    D.text(g, labels[1], r.x + 5, yB, { size: 10, baseline: 'middle', color: C.text });
    const tx = (t) => lx + lw - ((now - t) / win) * lw;
    for (let t = Math.ceil((now - win) / 250) * 250; t <= now; t += 250) {
      D.line(g, tx(t), yT + 3, tx(t), yB - 3, t % 1000 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)');
    }
    D.text(g, `← ${(win / 1000).toFixed(1)}s`, lx + 2, r.y + 1, { size: 9, color: C.dim });
    g.save();
    g.beginPath(); g.rect(lx, r.y, lw, r.h); g.clip();
    for (const ln of lanes) {
      const ya = ln.dir > 0 ? yT : yB, yb = ln.dir > 0 ? yB : yT;
      for (const p of ln.link.log) {
        if (Math.max(p.t1, p.t0) < now - win || p.t0 > now) continue;
        const x0 = tx(p.t0), span = Math.max(1e-6, p.t1 - p.t0);
        if (p.lost) {
          const tm = p.t0 + span * 0.5, te = Math.min(now, tm), f = (te - p.t0) / span;
          g.globalAlpha = 0.6;
          D.line(g, x0, ya, tx(te), U.lerp(ya, yb, f), C.bad, ln.lw || 1);
          g.globalAlpha = 1;
          if (now >= tm) {
            const cx = tx(tm), cy = (ya + yb) / 2;
            D.line(g, cx - 3, cy - 3, cx + 3, cy + 3, C.bad, 1.5); D.line(g, cx - 3, cy + 3, cx + 3, cy - 3, C.bad, 1.5);
          }
        } else if (p.t1 <= now) {
          g.globalAlpha = 0.28;
          D.line(g, x0, ya, tx(p.t1), yb, ln.color, ln.lw || 1);
          g.globalAlpha = 1;
        } else {
          const f = (now - p.t0) / span, hx = tx(now), hy = U.lerp(ya, yb, f);
          g.globalAlpha = 0.7;
          D.line(g, x0, ya, hx, hy, ln.color, ln.lw || 1);
          g.globalAlpha = 1;
          D.circle(g, hx - 2, hy, ln.dot || 3, ln.color);
        }
      }
    }
    g.restore();
  }
  // ─────────────────────────────────────────────────────────────────────

  GTL.register({
    id: 'delta-compression',
    title: '델타 압축 & 양자화',
    summary: '스냅샷의 float를 필요한 정밀도의 정수로 양자화하고, 클라이언트가 확인(ack)한 이전 스냅샷과 달라진 값만 보냄. 패킷 크기가 몇 분의 일로 줄어듦. 대가는 정밀도 손실과 기준 스냅샷 관리.',
    views: { a: 'float32 전체 전송', b: '10비트 양자화 + 델타' },
    controls: '조작 없음 (←↑→↓ / WASD로 첫 번째 엔티티를 움직일 수 있음)',
    info: `
      <p>스냅샷 크기를 줄이는 두 기법 비교. 대역폭을 아끼려면 필요한 정보만 필요한 정밀도로 보내야 함.</p>
      <p><b>양자화(quantization)</b>: 실수 위치를 b비트 정수로 바꿔 보내는 기법</p>
      <ul>
        <li>식: <code>q = round((x − min) / (max − min) × (2ᵇ − 1))</code></li>
        <li>월드가 400u이면 10비트로 0.39u 간격. 화면에서 구분할 수 없는 정밀도에 32비트를 쓸 필요 없음.</li>
        <li>비트가 너무 적으면 엔티티가 격자에 "스냅"되며 떨림</li>
        <li>실제 게임은 서버도 양자화된 상태로 시뮬레이션. 그래야 클라이언트와 어긋나지 않음.</li>
      </ul>
      <p><b>델타 압축(delta compression)</b>: 기준 스냅샷과 달라진 값만 보내는 기법. Quake 3가 대중화.</p>
      <ul>
        <li>기준(baseline)은 클라이언트가 <b>수신 확인(ack)한 마지막 스냅샷</b></li>
        <li>엔티티마다 "변경됨" 1비트를 보내고, 바뀐 필드만 보냄</li>
        <li>변화량이 작으면 더 적은 비트로 보냄. 정지한 엔티티는 1비트면 충분함.</li>
      </ul>
      <p>단점: ack가 손실되면 기준이 오래되어 델타가 커짐. 기준이 없으면 전체 스냅샷을 보냄(이 샘플: 기준 나이 &gt; 1초).</p>`,
    diagram: (L) => `<svg viewBox="0 0 540 176" xmlns="http://www.w3.org/2000/svg">
      <text x="4" y="14" class="t-a">${L('A: 엔티티마다 x, y, 각도를 float32로 (96비트)', 'A: x, y, angle as float32 per entity (96 bits)')}</text>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="${4 + i * 44}" y="22" width="42" height="20" class="f-dim"/><text x="${25 + i * 44}" y="36" text-anchor="middle" class="t-small t-mono">${['x', 'y', 'θ'][i % 3]}${Math.floor(i / 3)}</text>`).join('')}
      <text x="406" y="36" class="t-small t-mono t-a">${L('288비트', '288 bits')}</text>
      <text x="4" y="64" class="t-b">${L('B: 변경 플래그 + 바뀐 값의 차이(10비트 양자화)', 'B: changed flag + delta of changed values (10-bit)')}</text>
      <rect x="4" y="72" width="14" height="20" class="f-b"/><text x="11" y="86" text-anchor="middle" class="t-small t-mono">1</text>
      ${['Δx0', 'Δy0', 'Δθ0'].map((s, i) => `<rect x="${20 + i * 32}" y="72" width="30" height="20" class="f-dim"/><text x="${35 + i * 32}" y="86" text-anchor="middle" class="t-small t-mono">${s}</text>`).join('')}
      <rect x="118" y="72" width="14" height="20" class="f-dim"/><text x="125" y="86" text-anchor="middle" class="t-small t-mono">0</text>
      <rect x="134" y="72" width="14" height="20" class="f-dim"/><text x="141" y="86" text-anchor="middle" class="t-small t-mono">0</text>
      <text x="156" y="86" class="t-small t-mono t-b">${L('약 25비트', 'about 25 bits')}</text>
      <text x="250" y="86" class="t-small t-dim">${L('정지한 엔티티는 1비트', 'a still entity costs 1 bit')}</text>
      <text x="4" y="118" class="t-small t-dim">${L('양자화: 실수 위치를 가장 가까운 격자 정수로 바꿈', 'Quantize: snap the real position to the nearest grid integer')}</text>
      <line x1="10" y1="146" x2="300" y2="146" class="d-dim"/>
      ${Array.from({ length: 10 }, (_, i) => `<line x1="${20 + i * 30}" y1="140" x2="${20 + i * 30}" y2="152" class="d-dim"/>`).join('')}
      <circle cx="133" cy="146" r="4" class="f-accent"/><text x="133" y="134" text-anchor="middle" class="t-small">${L('실제 x', 'true x')}</text>
      <circle cx="140" cy="146" r="4" class="f-b"/><text x="140" y="166" text-anchor="middle" class="t-small t-b">q</text>
      <text x="320" y="140" class="t-small t-mono">${L('10비트: 간격 0.39u', '10 bits: step 0.39u')}</text>
      <text x="320" y="156" class="t-small t-mono">${L('6비트: 간격 6.25u (계단)', '6 bits: step 6.25u (stairs)')}</text>
    </svg>`,
    look: [
      '"스냅샷 크기"를 비교하면, A는 엔티티 수 × 12바이트, B는 움직이는 엔티티만큼만 커짐',
      '"움직이는 비율"을 0으로 하면 B의 스냅샷에는 거의 헤더만 남음',
      'B의 위치 비트를 6으로 내리면 확대 패널에서 엔티티가 격자(6.25u 간격)에 스냅되어 계단식으로 움직임. 녹색은 서버 실제 값, 색 점은 클라이언트 디코딩 값.',
      '손실률을 올리면 ack도 사라져 B의 "기준 나이"가 늘고 패킷이 커짐. 전체 스냅샷(빨간 막대)이 섞여 나옴.',
    ],
    refs: [
      { type: 'article', title: 'Snapshot Compression', url: 'https://gafferongames.com/post/snapshot_compression/', note: 'Glenn Fiedler. 양자화, 상대 인코딩, 델타 대 기준 스냅샷.' },
      { type: 'article', title: 'The Quake3 Networking Model', url: 'https://fabiensanglard.net/quake3/network.php', note: 'Brian Hook 해설(Fabien Sanglard 정리). ack된 스냅샷 기준 델타.' },
      { type: 'article', title: 'Serialization Strategies', url: 'https://gafferongames.com/post/serialization_strategies/', note: 'Glenn Fiedler. 비트 패킹 직렬화.' },
      { type: 'talk', title: 'I Shot You First: Networking the Gameplay of HALO: REACH', year: 2011, note: 'David Aldridge, GDC 2011. 대역폭 예산과 우선순위.' },
    ],
    params: [
      { key: 'lat', label: '편도 지연 (ms)', type: 'int', min: 0, max: 300, default: 60, shared: true, group: '네트워크' },
      { key: 'loss', label: '패킷 손실률', type: 'range', min: 0, max: 0.4, step: 0.01, default: 0.05, shared: true },
      { key: 'sendHz', label: '전송률 (Hz)', type: 'int', min: 5, max: 60, default: 20, shared: true },
      { key: 'count', label: '엔티티 수', type: 'int', min: 4, max: 128, default: 40, shared: true, reset: true, group: '장면' },
      { key: 'moving', label: '움직이는 비율', type: 'range', min: 0, max: 1, step: 0.05, default: 0.25, shared: true },
      { key: 'auto', label: '자동 입력', type: 'bool', default: true, shared: true },
      { key: 'bits', label: '위치/각도 비트', type: 'select', group: '기법', options: [
        { value: 32, label: '32 (float, 양자화 없음)' }, { value: 16, label: '16' }, { value: 12, label: '12' },
        { value: 10, label: '10' }, { value: 8, label: '8' }, { value: 6, label: '6' }, { value: 4, label: '4' },
      ], default: 10, a: 32, b: 10 },
      { key: 'delta', label: '델타 압축', type: 'bool', a: false, b: true, help: 'ack된 기준 스냅샷 대비 변경분만 전송' },
      { key: 'restart', label: '다시 시작', type: 'button' },
    ],
    en: {
      title: 'Delta Compression & Quantization',
      summary: 'Quantize snapshot floats into integers with just the precision you need. Send only the values that changed since the last snapshot the client acknowledged (ack). Packets shrink to a fraction of their size. The cost is lost precision and baseline snapshot bookkeeping.',
      views: { a: 'Full float32', b: '10-bit quantization + delta' },
      controls: 'No input needed (Arrow keys / WASD move the first entity)',
      info: `
      <p>This sample compares two ways to shrink snapshots. To save bandwidth, send only the data you need, at the precision you need.</p>
      <p><b>Quantization</b> turns a real-valued position into a b-bit integer before sending.</p>
      <ul>
        <li>Formula: <code>q = round((x − min) / (max − min) × (2ᵇ − 1))</code>.</li>
        <li>In a 400u world, 10 bits give a 0.39u step. You do not need 32 bits for precision nobody can see on screen.</li>
        <li>With too few bits, entities "snap" to a grid and jitter.</li>
        <li>Real games also simulate the server in quantized state. That keeps the server and client from drifting apart.</li>
      </ul>
      <p><b>Delta compression</b> sends only the values that differ from a baseline snapshot. Quake 3 made it popular.</p>
      <ul>
        <li>The baseline is <b>the last snapshot the client acknowledged (ack)</b>.</li>
        <li>Each entity gets a 1-bit "changed" flag, and only changed fields are sent.</li>
        <li>Small changes use fewer bits. A still entity needs only 1 bit.</li>
      </ul>
      <p>Downside: if acks are lost, the baseline gets old and deltas grow. With no baseline, the server sends a full snapshot (in this sample: baseline age &gt; 1 s).</p>`,
      look: [
        'Compare "Snapshot size". A is entity count × 12 bytes. B grows only with the number of moving entities.',
        'Set "Moving ratio" to 0. B\'s snapshot holds little more than the header.',
        'Lower B\'s position bits to 6. In the zoom panel, the entity snaps to a grid (6.25u step) and moves in steps. Green is the true server value, the colored dot is the client\'s decoded value.',
        'Raise the loss rate. Acks get lost too, so B\'s "Baseline age" rises and packets grow. Full snapshots (red bars) show up in the mix.',
      ],
      refs: [
        'Glenn Fiedler. Quantization, relative encoding, and deltas against a baseline snapshot.',
        'Brian Hook\'s explanation (summarized by Fabien Sanglard). Deltas against the acked snapshot.',
        'Glenn Fiedler. Bit-packing serialization.',
        'David Aldridge, GDC 2011. Bandwidth budgets and priorities.',
      ],
      params: {
        lat: { label: 'One-way latency (ms)', group: 'Network' },
        loss: 'Packet loss rate',
        sendHz: 'Send rate (Hz)',
        count: { label: 'Entity count', group: 'Scene' },
        moving: 'Moving ratio',
        auto: 'Auto input',
        bits: { label: 'Position/angle bits', group: 'Technique', options: { 32: '32 (float, no quantization)' } },
        delta: { label: 'Delta compression', help: 'Send only changes against the acked baseline snapshot' },
        restart: 'Restart',
      },
    },

    setup(ctx) {
      const P = ctx.params;
      const WW = 400, WH = 260, ZOOM = 10;
      let st, ents;
      function init() {
        ctx.rng = U.rng(ctx.seed);
        const ls = ctx.rng.int(1, 1e9);
        ents = Array.from({ length: P.count }, () => ({
          x0: ctx.rng.range(30, WW - 30), y0: ctx.rng.range(30, WH - 30), a0: ctx.rng.range(0, U.TAU),
          fx: ctx.rng.range(0.3, 1.2), fy: ctx.rng.range(0.3, 1.2), rx: ctx.rng.range(10, 50), ry: ctx.rng.range(10, 40), w: ctx.rng.range(-2, 2),
        }));
        st = {
          now: 0, tick: 0, acc: 0, sAcc: 0, seq: 0,
          down: new Link(ls, 2), up: new Link(ls, 1),
          state: [], hist: new Map(), acked: -1, recv: new Map(), latest: null,
          sizes: [], full: [], kbWin: [], maxErr: 0, baseAge: 0, player: { dx: 0, dy: 0 }, ztrail: [],
        };
        st.state = ents.map((e) => ({ x: e.x0, y: e.y0, a: e.a0 }));
      }
      init();

      const nMoving = () => Math.round(ents.length * P.moving);
      function simulate(t) {
        const nm = nMoving();
        st.state = ents.map((e, i) => {
          if (i === 0) return { x: U.clamp(e.x0 + st.player.dx, 5, WW - 5), y: U.clamp(e.y0 + st.player.dy, 5, WH - 5), a: e.a0 + t / 1000 };
          if (i >= nm) return { x: e.x0, y: e.y0, a: e.a0 };
          const s = t / 1000;
          return { x: e.x0 + Math.sin(s * e.fx) * e.rx, y: e.y0 + Math.cos(s * e.fy) * e.ry, a: e.a0 + s * e.w };
        });
      }
      // 양자화 / 역양자화
      const qPos = (v, max, b) => (b >= 32 ? v : Math.round(U.clamp(v / max, 0, 1) * (2 ** b - 1)));
      const dqPos = (q, max, b) => (b >= 32 ? q : (q / (2 ** b - 1)) * max);
      const qAng = (a, b) => (b >= 32 ? a : Math.round((U.wrap(a, 0, U.TAU) / U.TAU) * 2 ** b) % 2 ** b);
      const dqAng = (q, b) => (b >= 32 ? q : (q / 2 ** b) * U.TAU);
      const encode = (s, b) => s.map((e) => [qPos(e.x, WW, b), qPos(e.y, WH, b), qAng(e.a, b)]);

      // 인코딩된 비트 수 계산
      function sizeBits(q, base, b) {
        let bits = 32 + 16 + 1; // seq, baseline seq, full/delta 플래그
        if (!base) return bits + q.length * 3 * b;
        const small = Math.max(3, Math.ceil(b / 2));
        for (let i = 0; i < q.length; i++) {
          bits += 1; // 엔티티 변경 여부
          const a = q[i], o = base[i];
          if (a[0] === o[0] && a[1] === o[1] && a[2] === o[2]) continue;
          for (let f = 0; f < 3; f++) {
            bits += 1; // 필드 변경 여부
            if (a[f] === o[f]) continue;
            if (b >= 32) { bits += 32; continue; }
            let d = a[f] - o[f];
            if (f === 2) { const M = 2 ** b; d = ((d % M) + M + M / 2) % M - M / 2; } // 각도는 순환
            bits += 1 + (Math.abs(d) < 2 ** (small - 1) ? small : b); // 작은 변화량이면 짧게
          }
        }
        return bits;
      }

      function tick() {
        st.now += STEP; st.tick++;
        const dt = STEP / 1000;
        const net = { lat: P.lat, jit: 10, loss: P.loss };
        const m = getMove(ctx, st.now);
        st.player.dx = U.clamp(st.player.dx + m.x * 60 * dt, -60, 60);
        st.player.dy = U.clamp(st.player.dy + m.y * 60 * dt, -60, 60);
        simulate(st.now);
        const b = +P.bits;

        // 클라이언트 ack 수신 (서버)
        for (const p of st.up.poll(st.now)) st.acked = Math.max(st.acked, p.data);

        st.sAcc += STEP;
        const iv = 1000 / P.sendHz;
        if (st.sAcc >= iv) {
          st.sAcc = Math.min(st.sAcc - iv, iv);
          const seq = st.seq++;
          const q = encode(st.state, b);
          let base = null, baseSeq = -1;
          if (P.delta && st.acked >= 0 && st.hist.has(st.acked) && st.hist.get(st.acked).b === b && st.now - st.hist.get(st.acked).t < 1000) {
            base = st.hist.get(st.acked).q; baseSeq = st.acked;
          }
          st.hist.set(seq, { q, t: st.now, b, truth: st.state.map((e) => ({ ...e })) });
          for (const k of st.hist.keys()) if (k < seq - 64) st.hist.delete(k);
          const bytes = Math.ceil(sizeBits(q, base, b) / 8);
          st.down.send(st.now, st.tick, { seq, q, b, baseSeq, t: st.now }, net, 28 + bytes);
          st.sizes.push(bytes); st.full.push(!base);
          if (st.sizes.length > 60) { st.sizes.shift(); st.full.shift(); }
          st.kbWin.push({ t: st.now, b: 28 + bytes });
          st.baseAge = base ? st.now - st.hist.get(baseSeq).t : -1;
        }
        while (st.kbWin.length && st.kbWin[0].t < st.now - 1000) st.kbWin.shift();

        // 클라이언트: 수신 → 디코딩 → ack 전송
        for (const p of st.down.poll(st.now)) {
          const s = p.data;
          // 델타 패킷은 클라이언트가 가진 기준 스냅샷 + 변경분으로 복원됨. 결과는 서버의 양자화 값과 같음.
          if (s.baseSeq >= 0 && !st.recv.has(s.baseSeq)) continue;
          st.recv.set(s.seq, s);
          for (const k of st.recv.keys()) if (k < s.seq - 64) st.recv.delete(k);
          if (!st.latest || s.seq > st.latest.seq) st.latest = s;
          st.up.send(st.now, st.tick, s.seq, net, 28 + 4);
        }
        if (st.latest) {
          const L = st.latest;
          st.dec = L.q.map((e) => ({ x: dqPos(e[0], WW, L.b), y: dqPos(e[1], WH, L.b), a: dqAng(e[2], L.b) }));
          // 같은 시각 서버 값과 비교한 양자화 오차 (지연 제외)
          const truth = st.hist.get(L.seq)?.truth;
          let me = 0;
          if (truth) st.dec.forEach((d, i) => { me = Math.max(me, Math.hypot(d.x - truth[i].x, d.y - truth[i].y)); });
          st.maxErr = me;
          st.ztrail.push({ ...st.dec[0] }); if (st.ztrail.length > 30) st.ztrail.shift();
        }
      }

      function arena(g, m) {
        D.rect(g, m.ox, m.oy, m.w, m.h, null, 'rgba(255,255,255,0.15)');
        D.grid(g, m.w, m.h, 40 * m.s, C.grid, m.ox, m.oy);
      }
      function ent(g, m, e, fill, stroke, r = 5) {
        D.circle(g, m.X(e.x), m.Y(e.y), r * m.s + 1, fill, stroke, 1.2);
        D.line(g, m.X(e.x), m.Y(e.y), m.X(e.x) + Math.cos(e.a) * (r + 4) * m.s, m.Y(e.y) + Math.sin(e.a) * (r + 4) * m.s, stroke || fill, 1);
      }

      return {
        update(dt) {
          st.acc += dt * 1000;
          let n = 0;
          while (st.acc >= STEP && n++ < 12) { tick(); st.acc -= STEP; }
          if (n >= 12) st.acc = 0;
        },
        render() {
          const g = ctx.g, W = ctx.width, H = ctx.height;
          const col = ctx.side === 'a' ? C.a : C.b;
          const L = layout(W, H, 3);
          const [p0, p1, p2] = L.panels;
          const nm = nMoving(), b = +P.bits;

          panel(g, p0, GTL.L('서버 (원본 상태)', 'Server (original state)'), C.good);
          let m = fit(p0, WW, WH); arena(g, m);
          st.state.forEach((e, i) => ent(g, m, e, i < Math.max(1, nm) ? C.good : 'rgba(102,209,122,0.35)'));

          panel(g, p1, GTL.L('클라이언트 (디코딩 결과)', 'Client (decoded)'), col);
          m = fit(p1, WW, WH); arena(g, m);
          if (st.dec) st.dec.forEach((e, i) => ent(g, m, e, i < Math.max(1, nm) ? col : 'rgba(255,255,255,0.3)'));

          // 확대 패널 (엔티티 0)
          panel(g, p2, GTL.L(`확대 ×${ZOOM} (엔티티 #0) & 크기`, `Zoom ×${ZOOM} (entity #0) & size`), C.dim);
          const zx = p2.x + 6, zy = p2.y + 22, zw = p2.w - 12, zh = Math.max(30, (p2.h - 28) * 0.55);
          D.rect(g, zx, zy, zw, zh, 'rgba(0,0,0,0.35)');
          if (st.dec) {
            const c = st.dec[0], s = ZOOM * (zw / 200);
            const cx = zx + zw / 2, cy = zy + zh / 2;
            g.save(); g.beginPath(); g.rect(zx, zy, zw, zh); g.clip();
            if (b < 32) {
              const stepX = WW / (2 ** b - 1), stepY = WH / (2 ** b - 1);
              const n = Math.ceil(zw / (stepX * s)) + 2;
              if (stepX * s > 3) {
                const gx0 = Math.floor((c.x - zw / 2 / s) / stepX) * stepX, gy0 = Math.floor((c.y - zh / 2 / s) / stepY) * stepY;
                for (let i = 0; i < n; i++) D.line(g, cx + (gx0 + i * stepX - c.x) * s, zy, cx + (gx0 + i * stepX - c.x) * s, zy + zh, 'rgba(255,255,255,0.08)');
                for (let i = 0; i < n; i++) D.line(g, zx, cy + (gy0 + i * stepY - c.y) * s, zx + zw, cy + (gy0 + i * stepY - c.y) * s, 'rgba(255,255,255,0.08)');
              }
            }
            st.ztrail.forEach((d, i) => D.circle(g, cx + (d.x - c.x) * s, cy + (d.y - c.y) * s, 2, `rgba(255,255,255,${0.1 + (i / st.ztrail.length) * 0.4})`));
            const tr = st.hist.get(st.latest.seq)?.truth[0];
            if (tr) { D.circle(g, cx + (tr.x - c.x) * s, cy + (tr.y - c.y) * s, 5, null, C.good, 2); D.line(g, cx, cy, cx + (tr.x - c.x) * s, cy + (tr.y - c.y) * s, C.warn, 1); }
            D.circle(g, cx, cy, 4, col);
            g.restore();
            D.text(g, b < 32 ? GTL.L(`격자 ${(WW / (2 ** b - 1)).toFixed(2)}u`, `Grid ${(WW / (2 ** b - 1)).toFixed(2)}u`) : 'float32', zx + 4, zy + zh - 14, { size: 10, color: C.dim });
          }
          // 스냅샷 크기 막대
          const by = zy + zh + 6, bh = Math.max(16, p2.y + p2.h - by - 6);
          D.rect(g, zx, by, zw, bh, 'rgba(0,0,0,0.35)');
          const maxB = Math.max(64, ents.length * 12 + 8);
          const bw = zw / 60;
          st.sizes.forEach((s, i) => {
            const h = (s / maxB) * (bh - 14);
            D.rect(g, zx + i * bw, by + bh - h, Math.max(1, bw - 1), h, st.full[i] && P.delta ? C.bad : col);
          });
          D.text(g, GTL.L(`스냅샷 크기 (최대 눈금 ${maxB}B)`, `Snapshot size (scale max ${maxB}B)`), zx + 4, by + 2, { size: 10, color: C.dim });

          drawTimeline(g, L.tl, st.now, 1500, [
            { link: st.down, dir: 1, color: col, lw: 1.3, dot: 3 },
            { link: st.up, dir: -1, color: 'rgba(200,200,200,0.7)', lw: 1, dot: 2 },
          ], [GTL.L('서버', 'Server'), GTL.L('클라', 'Client')]);

          const last = st.sizes[st.sizes.length - 1] || 0;
          const raw = Math.ceil((49 + ents.length * 96) / 8); // 같은 헤더 + float32 ×3 × N
          const kbps = st.kbWin.reduce((a, b2) => a + b2.b, 0) * 8 / 1000;
          ctx.stat(GTL.L('스냅샷 크기', 'Snapshot size'), last + ' B');
          ctx.stat(GTL.L('float32 전체 대비', 'Vs full float32'), ((last / raw) * 100).toFixed(0) + ' %');
          ctx.stat(GTL.L('대역폭 (UDP 헤더 포함)', 'Bandwidth (incl. UDP header)'), kbps.toFixed(1) + ' kbps');
          ctx.stat(GTL.L('최대 양자화 오차', 'Max quantization error'), st.maxErr.toFixed(3) + ' u');
          ctx.stat(GTL.L('기준 스냅샷 나이', 'Baseline age'), P.delta ? (st.baseAge < 0 ? GTL.L('없음(전체 전송)', 'None (full send)') : st.baseAge.toFixed(0) + ' ms') : '-');
        },
        onAction(key) { if (key === 'restart') init(); },
      };
    },
  });
})();
