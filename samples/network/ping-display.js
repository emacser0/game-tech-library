// 핑 표시: 순간 RTT vs 지수 평균 vs 지수 평균 + 지터
// 핑 패킷의 지연/손실은 (시드, 채널, 보낸 틱) 해시로 정해짐. A와 B는 같은 RTT 표본을 받음.
(() => {
  const U = GTL.util, D = U.draw, C = U.colors;
  const STEP = 1000 / 60; // 시뮬레이션 기본 틱 (ms)

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


  // 스파이크: 일부 패킷이 크게 늦게 도착 (Wi-Fi 재전송, 큐 적체 흉내)
  function spikeMs(seed, chan, key, prob) {
    if (hash01(seed, chan + 50, key) >= prob) return 0;
    return 150 + hash01(seed, chan + 51, key) * 250;
  }
  // 자동 입력: 몇 초마다 경로가 바뀐 것처럼 기본 지연을 바꿈
  const ROUTE = [0, 0, 60, 60, 0, 120, 120, 30, 0, 0];
  const routeExtra = (tMs) => ROUTE[Math.floor(tMs / 4000) % ROUTE.length];

  GTL.register({
    id: 'ping-display',
    title: '핑 표시 (순간 RTT vs 평균 vs 지터)',
    summary: '핑 숫자를 패킷 하나의 RTT로 바로 보여주면 매번 크게 흔들림. 지수 평균을 쓰면 안정되고, 지터를 함께 보여주면 연결 품질까지 알 수 있음.',
    views: { a: '순간 RTT', b: '지수 평균 + 지터' },
    controls: '↑↓ / WS: 추가 지연 늘리기, 줄이기 (두 뷰 동시)',
    info: `
      <p><b>RTT(왕복 지연)</b>: 핑 패킷을 보내고 응답이 돌아오기까지 걸린 시간. 게임 화면의 "핑" 숫자.</p>
      <p>왜 필요한가: 패킷마다 지연이 다름(지터). 표본 하나를 그대로 보여주면 숫자가 계속 튀어서 읽을 수 없음.
      스파이크 하나에 "랙 걸림" 경고가 뜨기도 함.</p>
      <ul>
        <li><b>순간 RTT</b>: 마지막 표본을 그대로 표시</li>
        <li><b>지수 평균(EWMA)</b>: <code>SRTT += α × (표본 − SRTT)</code>. TCP 재전송 타이머(RFC 6298)와 같은 식. α = 1/8이 표준값.</li>
        <li><b>지수 평균 + 지터</b>: 편차도 평균. <code>RTTVAR += β × (|SRTT − 표본| − RTTVAR)</code>, β = 2α. 핑 옆에 ± 지터와 손실률 표시.</li>
      </ul>
      <p>단점: α가 작으면 숫자는 안정되지만 실제 지연 변화(경로 변경)를 늦게 따라감</p>`,
    diagram: (L) => `<svg viewBox="0 0 540 170" xmlns="http://www.w3.org/2000/svg">
      <defs><marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
      <text x="4" y="16" class="t-small t-dim">${L('스파이크 표본 하나가 들어왔을 때 (RTT, ms)', 'One spike sample arrives (RTT, ms)')}</text>
      <line x1="40" y1="80" x2="520" y2="80" class="d-dim"/>
      ${[40, 60, 80, 100, 120, 140, 160].map((ms) => `<line x1="${40 + (ms - 40) * 4}" y1="76" x2="${40 + (ms - 40) * 4}" y2="84" class="d-dim"/><text x="${40 + (ms - 40) * 4}" y="98" text-anchor="middle" class="t-small t-mono t-dim">${ms}</text>`).join('')}
      <circle cx="120" cy="80" r="5" class="f-dim"/>
      <text x="120" y="60" text-anchor="middle" class="t-small">${L('이전 SRTT 60', 'old SRTT 60')}</text>
      <circle cx="440" cy="80" r="6" class="f-a"/>
      <text x="440" y="46" text-anchor="middle" class="t-a">${L('A 표시: 140', 'A shows: 140')}</text>
      <text x="440" y="60" text-anchor="middle" class="t-small">${L('새 표본 (스파이크)', 'new sample (spike)')}</text>
      <circle cx="160" cy="80" r="6" class="f-b"/>
      <path d="M124,116 L158,116" class="d-b" marker-end="url(#arrB)"/>
      <line x1="120" y1="110" x2="120" y2="122" class="d-dim"/><line x1="440" y1="110" x2="440" y2="122" class="d-dim"/>
      <line x1="160" y1="116" x2="440" y2="116" class="d-dim" stroke-dasharray="3 3"/>
      <text x="300" y="132" text-anchor="middle" class="t-small t-dim">${L('차이 80', 'gap 80')}</text>
      <text x="164" y="132" class="t-b">${L('B 표시: 70', 'B shows: 70')}</text>
      <text x="4" y="152" class="t-small t-mono">SRTT += α × (${L('표본', 'sample')} - SRTT), α = 1/8</text>
      <text x="4" y="166" class="t-small t-mono">RTTVAR += β × (|SRTT - ${L('표본', 'sample')}| - RTTVAR), β = 1/4</text>
    </svg>`,
    look: [
      '두 뷰의 큰 숫자를 비교하면, A는 매 핑마다 수십 ms씩 바뀌고 스파이크 때 빨간색으로 튐. B는 거의 일정함.',
      '"표시값 흔들림" 측정값을 비교하면 A가 B보다 몇 배 큼',
      '자동 입력이 켜져 있으면 4초마다 기본 지연이 바뀜. 그래프에서 B의 선이 A보다 조금 늦게 새 값에 도달.',
      'B의 평활 계수(α)를 0.02로 낮추면 숫자는 더 안정되지만 지연 변화를 1~2초 늦게 따라감',
      '지터를 0으로 낮추면 세 방식의 차이가 거의 사라짐. 차이의 원인은 지터임.',
    ],
    refs: [
      { type: 'paper', title: 'RFC 6298 - Computing TCP\'s Retransmission Timer', url: 'https://www.rfc-editor.org/rfc/rfc6298', year: 2011, note: 'SRTT, RTTVAR 지수 평균식과 α = 1/8, β = 1/4' },
      { type: 'paper', title: 'Congestion Avoidance and Control', year: 1988, note: 'Van Jacobson, SIGCOMM 88. RTT 평균과 편차 추정의 출발점.' },
      { type: 'paper', title: 'RFC 3550 - RTP: A Transport Protocol for Real-Time Applications', url: 'https://www.rfc-editor.org/rfc/rfc3550', year: 2003, note: '도착 간격 지터를 1/16 계수로 평균' },
      { type: 'article', title: 'Reliability and Congestion Avoidance over UDP', url: 'https://gafferongames.com/post/reliability_ordering_and_congestion_avoidance_over_udp/', note: 'Glenn Fiedler. 게임 프로토콜에서 RTT를 지수 평균으로 추적.' },
    ],
    params: [
      { key: 'lat', label: '편도 지연 (ms)', type: 'int', min: 0, max: 300, default: 40, shared: true, group: '네트워크' },
      { key: 'jitter', label: '지터 (ms)', type: 'int', min: 0, max: 150, default: 50, shared: true, help: '패킷마다 0~지터 ms 추가 지연' },
      { key: 'spike', label: '지연 스파이크 확률', type: 'range', min: 0, max: 0.2, step: 0.01, default: 0.05, shared: true, help: '일부 패킷이 150~400ms 더 늦게 도착' },
      { key: 'loss', label: '패킷 손실률', type: 'range', min: 0, max: 0.3, step: 0.01, default: 0.03, shared: true },
      { key: 'pingHz', label: '핑 전송률 (Hz)', type: 'int', min: 1, max: 20, default: 10, shared: true },
      { key: 'auto', label: '자동 입력', type: 'bool', default: true, shared: true, group: '장면', help: '4초마다 기본 지연을 바꿈 (경로 변경 흉내)' },
      { key: 'mode', label: '표시 방식', type: 'select', group: '기법', options: [
        { value: 'inst', label: '순간 RTT' },
        { value: 'ewma', label: '지수 평균' },
        { value: 'jitter', label: '지수 평균 + 지터' },
      ], default: 'jitter', a: 'inst', b: 'jitter' },
      { key: 'alpha', label: '평활 계수 α', type: 'range', min: 0.02, max: 0.5, step: 0.005, default: 0.125, when: (p) => p.mode !== 'inst', help: 'RFC 6298 표준값 0.125' },
      { key: 'restart', label: '다시 시작', type: 'button' },
    ],
    en: {
      title: 'Ping Display (Instant RTT vs Average vs Jitter)',
      summary: 'If the ping number shows the RTT of a single packet, it jumps a lot every time. An exponential average makes it stable. Show jitter too, and players can also see connection quality.',
      views: { a: 'Instant RTT', b: 'Exponential average + jitter' },
      controls: 'Up / Down, W / S: add or remove extra latency (both views)',
      info: `
      <p><b>RTT (round-trip time)</b>: the time from sending a ping packet until the reply comes back. It is the "ping" number on the game screen.</p>
      <p>Why you need it: every packet has a different delay (jitter). If you show one sample as is, the number keeps jumping and nobody can read it.
      A single spike can even trigger a "lag" warning.</p>
      <ul>
        <li><b>Instant RTT</b>: shows the last sample as is.</li>
        <li><b>Exponential average (EWMA)</b>: <code>SRTT += α × (sample − SRTT)</code>. Same formula as the TCP retransmission timer (RFC 6298). The standard value is α = 1/8.</li>
        <li><b>Exponential average + jitter</b>: also averages the deviation. <code>RTTVAR += β × (|SRTT − sample| − RTTVAR)</code>, β = 2α. Shows ± jitter and loss rate next to the ping.</li>
      </ul>
      <p>Downside: with a small α, the number is stable but follows real latency changes (route changes) slowly.</p>`,
      look: [
        'Compare the big numbers in both views. A changes by tens of ms with every ping and turns red on spikes. B stays almost constant.',
        'Compare the "Shown value wobble" stat. A is several times larger than B.',
        'With auto input on, the base latency changes every 4 seconds. In the graph, B\'s line reaches the new value a little later than A.',
        'Lower B\'s smoothing factor (α) to 0.02. The number gets even more stable, but it follows latency changes 1 to 2 seconds late.',
        'Lower jitter to 0. The difference between the three modes almost disappears. Jitter is the cause of the difference.',
      ],
      refs: [
        'The SRTT and RTTVAR exponential average formulas, with α = 1/8 and β = 1/4.',
        'Van Jacobson, SIGCOMM 88. Where RTT average and deviation estimates started.',
        'Averages interarrival jitter with a 1/16 factor.',
        'Glenn Fiedler. Tracks RTT with an exponential average in a game protocol.',
      ],
      params: {
        lat: { label: 'One-way latency (ms)', group: 'Network' },
        jitter: { label: 'Jitter (ms)', help: 'Each packet gets 0 to jitter ms of extra delay' },
        spike: { label: 'Latency spike chance', help: 'Some packets arrive 150 to 400ms later' },
        loss: 'Packet loss rate',
        pingHz: 'Ping send rate (Hz)',
        auto: { label: 'Auto input', group: 'Scene', help: 'Changes the base latency every 4 seconds (simulates route changes)' },
        mode: { label: 'Display mode', group: 'Technique', options: { inst: 'Instant RTT', ewma: 'Exponential average', jitter: 'Exponential average + jitter' } },
        alpha: { label: 'Smoothing factor α', help: 'RFC 6298 standard value 0.125' },
        restart: 'Restart',
      },
    },

    setup(ctx) {
      const P = ctx.params;
      let st;
      function init() {
        ctx.rng = U.rng(ctx.seed);
        const ls = ctx.rng.int(1, 1e9);
        st = {
          ls, now: 0, tick: 0, acc: 0, pAcc: 0, seq: 0, manual: 0,
          up: new Link(ls, 1), down: new Link(ls, 2),
          samples: [], shown: null, srtt: null, rttvar: 0, hist: [], outcomes: [],
          absErr: 0, nErr: 0,
        };
      }
      init();

      const extra = () => st.manual + (P.auto ? routeExtra(st.now) : 0);
      const expected = () => 2 * (P.lat + extra()) + P.jitter; // 지터는 편도마다 평균 jitter/2

      function onSample(r) {
        const a = P.alpha, b = Math.min(1, 2 * a);
        if (st.srtt === null) { st.srtt = r; st.rttvar = r / 2; }
        else { st.rttvar += b * (Math.abs(st.srtt - r) - st.rttvar); st.srtt += a * (r - st.srtt); }
        st.shown = P.mode === 'inst' ? r : st.srtt;
        st.samples.push({ t: st.now, r });
      }

      function tick() {
        st.now += STEP; st.tick++;
        const dt = STEP / 1000;
        const k = ctx.input;
        if (k.key('ArrowUp') || k.key('KeyW')) st.manual = Math.min(300, st.manual + 150 * dt);
        if (k.key('ArrowDown') || k.key('KeyS')) st.manual = Math.max(0, st.manual - 150 * dt);
        const ex = extra();
        const net = { lat: P.lat + ex, jit: P.jitter, loss: P.loss };

        const iv = 1000 / P.pingHz;
        st.pAcc += STEP;
        if (st.pAcc >= iv) {
          st.pAcc = Math.min(st.pAcc - iv, iv);
          const p = st.up.send(st.now, st.tick, { seq: st.seq++, t: st.now }, net, 32);
          if (!p.lost) p.t1 += spikeMs(st.ls, 1, st.tick, P.spike);
          st.outcomes.push({ seq: p.data.seq, t: st.now, ok: null });
        }
        // 서버: 받은 즉시 같은 내용으로 응답
        for (const p of st.up.poll(st.now)) {
          const q = st.down.send(st.now, st.tick, p.data, net, 32);
          if (!q.lost) q.t1 += spikeMs(st.ls, 2, st.tick, P.spike);
        }
        for (const p of st.down.poll(st.now)) {
          const o = st.outcomes.find((x) => x.seq === p.data.seq);
          if (o) o.ok = true;
          onSample(st.now - p.data.t);
        }
        // 1초 안에 응답이 없으면 손실로 처리
        for (const o of st.outcomes) if (o.ok === null && st.now - o.t > 1000) o.ok = false;
        while (st.outcomes.length > 60) st.outcomes.shift();
        while (st.samples.length && st.samples[0].t < st.now - 6000) st.samples.shift();

        if (st.shown !== null && st.tick % 3 === 0) {
          st.hist.push({ t: st.now, v: st.shown, e: expected(), j: st.rttvar });
          while (st.hist.length && st.hist[0].t < st.now - 6000) st.hist.shift();
          if (st.now > 2000) { st.absErr += Math.abs(st.shown - expected()); st.nErr++; }
        }
      }

      const qualityColor = (v) => (v < 100 ? C.good : v < 180 ? C.warn : C.bad);

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
          const L = layout(W, H, 2);
          const [p0, p1] = L.panels;
          p0.w = Math.min(p0.w, Math.max(150, W * 0.32));
          p1.x = p0.x + p0.w + 6; p1.w = W - p1.x - 6;

          // 게임 화면 HUD
          panel(g, p0, GTL.L('게임 화면의 핑 표시', 'In-game ping display'), col);
          const cx = p0.x + p0.w / 2, cy = p0.y + p0.h * 0.42;
          if (st.shown === null) D.text(g, GTL.L('측정 중', 'Measuring'), cx, cy, { size: 16, color: C.dim, align: 'center', baseline: 'middle' });
          else {
            const v = st.shown;
            const judge = P.mode === 'jitter' ? st.srtt + st.rttvar : v;
            D.text(g, Math.round(v) + '', cx, cy, { size: Math.min(48, p0.w * 0.28), color: qualityColor(judge), align: 'center', baseline: 'middle' });
            D.text(g, 'ms', cx, cy + Math.min(30, p0.w * 0.17), { size: 11, color: C.dim, align: 'center' });
            if (P.mode === 'jitter') {
              const done = st.outcomes.filter((o) => o.ok !== null);
              const lossPct = done.length ? (done.filter((o) => !o.ok).length / done.length) * 100 : 0;
              D.text(g, GTL.L(`± ${Math.round(st.rttvar)} ms 지터`, `± ${Math.round(st.rttvar)} ms jitter`), cx, cy + 50, { size: 12, color: C.text, align: 'center' });
              D.text(g, GTL.L(`손실 ${lossPct.toFixed(0)} %`, `Loss ${lossPct.toFixed(0)} %`), cx, cy + 66, { size: 12, color: lossPct > 5 ? C.bad : C.text, align: 'center' });
            }
          }
          // 최근 핑 결과 (초록 응답, 빨강 손실)
          const oy = p0.y + p0.h - 18, ow = Math.max(2, (p0.w - 12) / 40);
          st.outcomes.slice(-40).forEach((o, i) => D.rect(g, p0.x + 6 + i * ow, oy, ow - 1, 10, o.ok === null ? 'rgba(255,255,255,0.15)' : o.ok ? 'rgba(102,209,122,0.6)' : C.bad));

          // 그래프
          panel(g, p1, GTL.L('RTT 표본(점) vs 표시값(선) vs 기대 RTT(초록), 최근 6초', 'RTT samples (dots) vs shown value (line) vs expected RTT (green), last 6 s'), C.dim);
          const gx = p1.x + 34, gy = p1.y + 22, gw = p1.w - 40, gh = Math.max(20, p1.h - 30);
          D.rect(g, gx, gy, gw, gh, 'rgba(0,0,0,0.3)');
          let vmax = 200;
          for (const s of st.samples) vmax = Math.max(vmax, s.r);
          vmax = Math.ceil(vmax / 100) * 100;
          const X = (t) => gx + gw - ((st.now - t) / 6000) * gw, Y = (v) => gy + gh - (v / vmax) * gh;
          for (let v = 0; v <= vmax; v += 100) {
            D.line(g, gx, Y(v), gx + gw, Y(v), 'rgba(255,255,255,0.06)');
            D.text(g, v + '', gx - 4, Y(v), { size: 9, color: C.dim, align: 'right', baseline: 'middle' });
          }
          const hs = st.hist;
          if (P.mode === 'jitter' && hs.length > 1) {
            g.beginPath();
            hs.forEach((h, i) => (i ? g.lineTo(X(h.t), Y(h.v + h.j)) : g.moveTo(X(h.t), Y(h.v + h.j))));
            for (let i = hs.length - 1; i >= 0; i--) g.lineTo(X(hs[i].t), Y(Math.max(0, hs[i].v - hs[i].j)));
            g.closePath(); g.fillStyle = 'rgba(120,180,255,0.12)'; g.fill();
          }
          if (hs.length > 1) {
            D.poly(g, hs.map((h) => ({ x: X(h.t), y: Y(h.e) })), null, 'rgba(102,209,122,0.7)', 1, false);
            D.poly(g, hs.map((h) => ({ x: X(h.t), y: Y(h.v) })), null, col, 2, false);
          }
          for (const s of st.samples) D.circle(g, X(s.t), Y(s.r), 2.2, 'rgba(255,255,255,0.55)');

          drawTimeline(g, L.tl, st.now, 2000, [
            { link: st.up, dir: 1, color: 'rgba(200,200,200,0.9)', lw: 1, dot: 2 },
            { link: st.down, dir: -1, color: col, lw: 1.3, dot: 3 },
          ], [GTL.L('클라', 'Client'), GTL.L('서버', 'Server')]);

          const recent = hs.filter((h) => h.t > st.now - 3000).map((h) => h.v);
          let sd = 0;
          if (recent.length > 1) {
            const m = recent.reduce((a, b) => a + b, 0) / recent.length;
            sd = Math.sqrt(recent.reduce((a, b) => a + (b - m) * (b - m), 0) / recent.length);
          }
          ctx.stat(GTL.L('표시값', 'Shown value'), st.shown === null ? '-' : Math.round(st.shown) + ' ms');
          ctx.stat(GTL.L('표시값 흔들림 (3초 표준편차)', 'Shown value wobble (3 s std dev)'), sd.toFixed(1) + ' ms');
          ctx.stat(GTL.L('기대 RTT (지연×2 + 지터)', 'Expected RTT (latency×2 + jitter)'), Math.round(expected()) + ' ms');
          ctx.stat(GTL.L('기대 RTT와 평균 차이', 'Avg gap from expected RTT'), st.nErr ? (st.absErr / st.nErr).toFixed(1) + ' ms' : '-');
          ctx.stat(GTL.L('지터 추정 (RTTVAR)', 'Jitter estimate (RTTVAR)'), st.rttvar.toFixed(1) + ' ms');
        },
        onAction(key) { if (key === 'restart') init(); },
      };
    },
  });
})();
