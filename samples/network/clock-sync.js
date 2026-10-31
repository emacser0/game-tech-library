// 시계 동기화: NTP 방식 RTT/2 추정 + 최소 RTT 표본 선택 vs 서버 타임스탬프 그대로 사용
// 패킷 지연/손실은 (시드, 채널, 보낸 틱) 해시로 정해짐. A와 B는 같은 표본을 받음.
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


  const ROUTE = [0, 0, 50, 50, 0, 100, 100, 20, 0, 0];
  const routeExtra = (tMs) => ROUTE[Math.floor(tMs / 5000) % ROUTE.length];
  const BEAT = 2000; // 서버가 정한 박자 (ms). 0, 2000, 4000... 서버 시각마다 이벤트 발생

  GTL.register({
    id: 'clock-sync',
    title: '시계 동기화 (NTP 방식)',
    summary: '클라이언트가 서버 시각을 알아야 서버가 예약한 이벤트를 제때 보여줌. 받은 타임스탬프를 그대로 쓰면 편도 지연만큼 늦음. 왕복 시간의 절반을 보정하고 RTT가 가장 작은 표본을 고르면 오차가 몇 ms로 줄어듦.',
    views: { a: '타임스탬프 그대로', b: 'RTT/2 보정 + 최소 RTT 필터' },
    controls: '↑↓ / WS: 추가 지연 늘리기, 줄이기 (두 뷰 동시)',
    info: `
      <p><b>시계 동기화</b>: 클라이언트가 "지금 서버 시각"을 추정하는 일. 라운드 시작 카운트다운, 예약된 폭발, 서버 시간 기반 애니메이션에 필요함.</p>
      <p>왜 필요한가: 두 컴퓨터의 시계는 시작 시각도 다르고 흐르는 속도도 조금씩 다름(드리프트). 서버 타임스탬프는 받은 순간 이미 편도 지연만큼 과거임.</p>
      <ul>
        <li>클라이언트가 자기 시각 t0를 담아 요청을 보냄. 서버는 받은 시각 t1과 보낸 시각 t2를 담아 응답함. 클라이언트는 받은 시각 t3를 기록함.</li>
        <li>RTT = (t3 − t0) − (t2 − t1). 시계 차이 θ = ((t1 − t0) + (t2 − t3)) / 2. 편도 지연이 RTT/2라고 가정한 식(NTP).</li>
        <li><b>최소 RTT 필터</b>: 최근 N개 표본 중 RTT가 가장 작은 표본의 θ를 씀. 큐에서 덜 기다린 패킷일수록 RTT/2 가정이 잘 맞기 때문.</li>
        <li>추정값이 바뀔 때 한 번에 점프하지 않고 조금씩 따라감(slew). 시간이 뒤로 가면 애니메이션이 튐.</li>
      </ul>
      <p>단점: 상향, 하향 지연이 다르면(비대칭 경로) 그 차이의 절반만큼 오차가 남음. 어떤 필터로도 없앨 수 없음.</p>`,
    diagram: (L) => `<svg viewBox="0 0 540 190" xmlns="http://www.w3.org/2000/svg">
      <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
      <text x="4" y="39">${L('클라이언트', 'Client')}</text>
      <text x="4" y="109">${L('서버', 'Server')}</text>
      <line x1="90" y1="35" x2="520" y2="35" class="d-dim"/>
      <line x1="90" y1="105" x2="520" y2="105" class="d-dim"/>
      <line x1="120" y1="35" x2="248" y2="103" class="d-line" marker-end="url(#arr)"/>
      <rect x="250" y="99" width="40" height="12" class="f-dim"/>
      <line x1="290" y1="105" x2="418" y2="37" class="d-line" marker-end="url(#arr)"/>
      <text x="120" y="25" text-anchor="middle" class="t-mono">t0</text>
      <text x="420" y="25" text-anchor="middle" class="t-mono">t3</text>
      <text x="250" y="124" text-anchor="middle" class="t-mono">t1</text>
      <text x="290" y="124" text-anchor="middle" class="t-mono">t2</text>
      <text x="166" y="78" text-anchor="end" class="t-small t-dim">${L('요청', 'request')}</text>
      <text x="370" y="78" class="t-small t-dim">${L('응답 (t1, t2)', 'reply (t1, t2)')}</text>
      <text x="4" y="148" class="t-small t-mono">RTT = (t3 - t0) - (t2 - t1)</text>
      <text x="280" y="148" class="t-small t-mono">θ = ((t1 - t0) + (t2 - t3)) / 2</text>
      <text x="4" y="166" class="t-small t-a">${L('A: 받은 t2를 지금 서버 시각으로 씀 (편도 지연만큼 늦음)', 'A: treats the received t2 as server time now (late by one-way delay)')}</text>
      <text x="4" y="182" class="t-small t-b">${L('B: 서버 시각 = 내 시각 + θ. 최근 표본 중 RTT가 가장 작은 것의 θ를 씀', 'B: server time = my time + θ, taken from the recent sample with the lowest RTT')}</text>
    </svg>`,
    look: [
      '왼쪽 시계판의 두 바늘을 비교하면, A의 바늘(주황)은 서버 바늘(초록)보다 뒤처짐. "시간 오차"가 편도 지연보다 큰 음수(-80ms 이하). B는 거의 겹침.',
      '자동 입력이 켜져 있으면 5초마다 지연이 바뀜. A의 오차는 지연을 따라 커지지만 B는 거의 그대로임.',
      'B의 방식을 "RTT/2 (표본 1개)"로 바꾸면 평균은 맞지만 지터 때문에 오차가 표본마다 ±20ms씩 흔들림.',
      '상향/하향 비대칭을 80ms로 올리면 B에도 약 40ms 오차가 남음. RTT/2 가정이 깨진 결과임.',
      '시계 드리프트를 크게 올리고 동기화 주기를 0.2Hz로 낮추면 표본 사이에 오차가 쌓임.',
    ],
    refs: [
      { type: 'paper', title: 'RFC 5905 - Network Time Protocol Version 4', url: 'https://www.rfc-editor.org/rfc/rfc5905', year: 2010, note: 't1~t4 타임스탬프로 offset, delay를 구하는 식. 최소 지연 표본 선택(clock filter).' },
      { type: 'paper', title: 'Internet Time Synchronization: the Network Time Protocol', year: 1991, note: 'David L. Mills, IEEE Transactions on Communications.' },
      { type: 'article', title: 'A Stream-based Time Synchronization Technique For Networked Computer Games', note: 'Zachary Booth Simpson. 여러 표본 중 이상치를 버리고 평균하는 게임용 방식.' },
      { type: 'engine', title: 'Unity Netcode for GameObjects - NetworkTime and Ticks', note: 'ServerTime과 LocalTime을 RTT로 추정하고 부드럽게 보정함.' },
    ],
    params: [
      { key: 'lat', label: '편도 지연 (ms)', type: 'int', min: 0, max: 300, default: 60, shared: true, group: '네트워크' },
      { key: 'jitter', label: '지터 (ms)', type: 'int', min: 0, max: 200, default: 60, shared: true },
      { key: 'asym', label: '상향/하향 비대칭 (ms)', type: 'int', min: 0, max: 200, default: 0, shared: true, help: '상향 지연을 이만큼 더 크게 만듦' },
      { key: 'loss', label: '패킷 손실률', type: 'range', min: 0, max: 0.3, step: 0.01, default: 0.03, shared: true },
      { key: 'offset', label: '클라 시계 시작 차이 (ms)', type: 'int', min: -5000, max: 5000, default: 1700, shared: true, reset: true, group: '시계' },
      { key: 'drift', label: '시계 드리프트 (ppm)', type: 'int', min: 0, max: 20000, default: 2000, shared: true, help: '1000 ppm = 1초에 1ms씩 어긋남' },
      { key: 'auto', label: '자동 입력', type: 'bool', default: true, shared: true, group: '장면', help: '5초마다 지연을 바꿈 (경로 변경 흉내)' },
      { key: 'method', label: '동기화 방식', type: 'select', group: '기법', options: [
        { value: 'none', label: '동기화 없음 (로컬 시계)' },
        { value: 'naive', label: '타임스탬프 그대로' },
        { value: 'rtt2', label: 'RTT/2 (표본 1개)' },
        { value: 'filtered', label: 'RTT/2 + 최소 RTT 필터' },
      ], default: 'filtered', a: 'naive', b: 'filtered' },
      { key: 'window', label: '필터 표본 수', type: 'int', min: 2, max: 32, default: 8, when: (p) => p.method === 'filtered' },
      { key: 'syncHz', label: '동기화 주기 (Hz)', type: 'range', min: 0.2, max: 10, step: 0.1, default: 3 },
      { key: 'restart', label: '다시 시작', type: 'button' },
    ],
    en: {
      title: 'Clock Sync (NTP Style)',
      summary: 'The client must know the server time to show server-scheduled events on time. If it uses the received timestamp as is, it runs late by the one-way latency. Correct by half the round-trip time and pick the sample with the lowest RTT, and the error drops to a few ms.',
      views: { a: 'Raw timestamp', b: 'RTT/2 correction + min RTT filter' },
      controls: '↑↓ / WS: raise or lower extra latency (both views at once)',
      info: `
      <p><b>Clock sync</b> means the client estimates "the server time right now". You need it for round start countdowns, scheduled explosions, and animations driven by server time.</p>
      <p>Why you need it: two computers' clocks start at different times and run at slightly different speeds (drift). A server timestamp is already in the past by the one-way latency when it arrives.</p>
      <ul>
        <li>The client sends a request with its own time t0. The server replies with its receive time t1 and send time t2. The client records its receive time t3.</li>
        <li>RTT = (t3 − t0) − (t2 − t1). Clock offset θ = ((t1 − t0) + (t2 − t3)) / 2. This formula (NTP) assumes the one-way latency is RTT/2.</li>
        <li><b>Min RTT filter</b>: use the θ of the sample with the lowest RTT among the last N samples. A packet that waited less in queues fits the RTT/2 assumption better.</li>
        <li>When the estimate changes, the clock follows it a little at a time (slew) instead of jumping. If time goes backward, animations glitch.</li>
      </ul>
      <p>Downside: if upstream and downstream latency differ (asymmetric path), an error of half that difference remains. No filter can remove it.</p>`,
      look: [
        'Compare the two hands on the clock face on the left. A\'s hand (orange) lags behind the server hand (green). "Time error" is a negative value larger than the one-way latency (-80 ms or less). In B, the hands almost overlap.',
        'With auto input on, latency changes every 5 seconds. A\'s error grows with latency, but B\'s stays almost the same.',
        'Switch B\'s method to "RTT/2 (single sample)". The average is right, but jitter makes the error swing by ±20 ms from sample to sample.',
        'Raise up/down asymmetry to 80 ms. B also keeps an error of about 40 ms. The RTT/2 assumption no longer holds.',
        'Raise clock drift a lot and lower the sync rate to 0.2 Hz. Error builds up between samples.',
      ],
      refs: [
        'The formulas that get offset and delay from timestamps t1 to t4. Picks the lowest delay sample (clock filter).',
        'David L. Mills, IEEE Transactions on Communications.',
        'Zachary Booth Simpson. A method for games that drops outliers among many samples and averages the rest.',
        'Estimates ServerTime and LocalTime from RTT and corrects them smoothly.',
      ],
      params: {
        lat: { label: 'One-way latency (ms)', group: 'Network' },
        jitter: 'Jitter (ms)',
        asym: { label: 'Up/down asymmetry (ms)', help: 'Makes upstream latency larger by this amount' },
        loss: 'Packet loss rate',
        offset: { label: 'Client clock start offset (ms)', group: 'Clock' },
        drift: { label: 'Clock drift (ppm)', help: '1000 ppm = 1 ms off per second' },
        auto: { label: 'Auto input', group: 'Scene', help: 'Changes latency every 5 seconds (mimics a route change)' },
        method: { label: 'Sync method', group: 'Technique', options: { none: 'No sync (local clock)', naive: 'Raw timestamp', rtt2: 'RTT/2 (single sample)', filtered: 'RTT/2 + min RTT filter' } },
        window: 'Filter sample count',
        syncHz: 'Sync rate (Hz)',
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
          now: 0, tick: 0, acc: 0, qAcc: 1e9, manual: 0, local: P.offset,
          up: new Link(ls, 1), down: new Link(ls, 2),
          samples: [], theta: null, target: null, used: null, hist: [], errs: [], beats: [],
        };
      }
      init();

      const extra = () => st.manual + (P.auto ? routeExtra(st.now) : 0);
      const estServer = () => (P.method === 'none' || st.theta === null ? st.local : st.local + st.theta);

      function tick() {
        st.now += STEP; st.tick++;
        const dt = STEP / 1000;
        const k = ctx.input;
        if (k.key('ArrowUp') || k.key('KeyW')) st.manual = Math.min(300, st.manual + 150 * dt);
        if (k.key('ArrowDown') || k.key('KeyS')) st.manual = Math.max(0, st.manual - 150 * dt);
        st.local += STEP * (1 + P.drift * 1e-6); // 클라 로컬 시계 (드리프트 포함)
        const ex = extra();
        const upNet = { lat: P.lat + ex + P.asym, jit: P.jitter, loss: P.loss };
        const dnNet = { lat: P.lat + ex, jit: P.jitter, loss: P.loss };

        const iv = 1000 / P.syncHz;
        st.qAcc += STEP;
        if (st.qAcc >= iv) {
          st.qAcc = Math.min(st.qAcc - iv, iv);
          st.up.send(st.now, st.tick, { t0: st.local }, upNet, 36);
        }
        // 서버: 서버 시각 = 시뮬레이션 시각(st.now). 받은 즉시 응답 (t1 = t2)
        for (const p of st.up.poll(st.now)) st.down.send(st.now, st.tick, { t0: p.data.t0, t1: st.now, t2: st.now }, dnNet, 44);
        for (const p of st.down.poll(st.now)) {
          const { t0, t1, t2 } = p.data, t3 = st.local;
          const rtt = (t3 - t0) - (t2 - t1);
          const s = { rtt, theta: ((t1 - t0) + (t2 - t3)) / 2, naive: t2 - t3, t: st.now, t3 };
          st.samples.push(s);
          while (st.samples.length > 32) st.samples.shift();
          if (P.method === 'naive') { st.target = s.naive; st.used = s; }
          else if (P.method === 'rtt2') { st.target = s.theta; st.used = s; }
          else if (P.method === 'filtered') {
            const win = st.samples.slice(-P.window);
            const best = win.reduce((a, b) => (b.rtt < a.rtt ? b : a));
            st.target = best.theta; st.used = best;
          }
        }
        // slew: 필터 방식은 큰 차이(250ms 이상)만 즉시 맞추고, 나머지는 천천히 따라감
        if (st.target !== null) {
          if (st.theta === null || P.method !== 'filtered' || Math.abs(st.target - st.theta) > 250) st.theta = st.target;
          else st.theta = U.approach(st.theta, st.target, 20 * dt + Math.abs(st.target - st.theta) * 0.05);
        }
        const err = estServer() - st.now;
        if (st.tick % 3 === 0) {
          st.hist.push({ t: st.now, e: err });
          while (st.hist.length && st.hist[0].t < st.now - 10000) st.hist.shift();
        }
        st.errs.push(Math.abs(err)); if (st.errs.length > 300) st.errs.shift();
        // 서버가 예약한 박자: 클라는 추정 서버 시각이 박자를 넘을 때 효과를 띄움
        const es = estServer();
        if (Math.floor(es / BEAT) !== Math.floor((es - STEP) / BEAT)) st.beats.push({ who: 'c', t: st.now });
        if (Math.floor(st.now / BEAT) !== Math.floor((st.now - STEP) / BEAT)) st.beats.push({ who: 's', t: st.now });
        while (st.beats.length && st.beats[0].t < st.now - 600) st.beats.shift();
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
          const L = layout(W, H, 2);
          const [p0, p1] = L.panels;
          p0.w = Math.min(p0.w, Math.max(160, W * 0.36));
          p1.x = p0.x + p0.w + 6; p1.w = W - p1.x - 6;

          // 시계판: 서버가 정한 박자(2초에 한 바퀴)
          panel(g, p0, GTL.L('서버 박자 시계 (2초에 한 바퀴)', 'Server beat clock (1 turn per 2 s)'), C.dim);
          const cx = p0.x + p0.w / 2, cy = p0.y + 22 + (p0.h - 50) / 2, r = Math.max(10, Math.min(p0.w / 2 - 14, (p0.h - 60) / 2));
          const sFlash = st.beats.some((b) => b.who === 's' && st.now - b.t < 200);
          const cFlash = st.beats.some((b) => b.who === 'c' && st.now - b.t < 200);
          D.circle(g, cx, cy, r, sFlash ? 'rgba(102,209,122,0.18)' : 'rgba(0,0,0,0.3)', 'rgba(255,255,255,0.25)', 1.5);
          if (cFlash) D.circle(g, cx, cy, r + 5, null, col, 3);
          for (let i = 0; i < 20; i++) {
            const a = (i / 20) * U.TAU - Math.PI / 2, l = i % 5 === 0 ? 10 : 4;
            D.line(g, cx + Math.cos(a) * (r - l), cy + Math.sin(a) * (r - l), cx + Math.cos(a) * r, cy + Math.sin(a) * r, 'rgba(255,255,255,0.3)');
          }
          const hand = (t, c, w, len) => {
            const a = ((((t % BEAT) + BEAT) % BEAT) / BEAT) * U.TAU - Math.PI / 2;
            D.line(g, cx, cy, cx + Math.cos(a) * r * len, cy + Math.sin(a) * r * len, c, w);
          };
          hand(st.now, C.good, 4, 0.92);
          hand(estServer(), col, 2.5, 0.8);
          D.circle(g, cx, cy, 4, C.text);
          const err = estServer() - st.now;
          D.text(g, `${err >= 0 ? '+' : ''}${err.toFixed(0)} ms`, cx, p0.y + p0.h - 22, { size: 14, color: Math.abs(err) < 15 ? C.good : Math.abs(err) < 50 ? C.warn : C.bad, align: 'center' });
          D.text(g, GTL.L('━ 서버', '━ Server'), p0.x + 6, p0.y + p0.h - 14, { size: 10, color: C.good });
          D.text(g, GTL.L('━ 클라 추정', '━ Client est.'), p0.x + p0.w - 6, p0.y + p0.h - 14, { size: 10, color: col, align: 'right' });

          // 오차 그래프
          panel(g, p1, GTL.L('추정 서버 시각 오차 (ms), 최근 10초. 점: 표본별 RTT/2 결과', 'Server time estimate error (ms), last 10 s. Dots: RTT/2 per sample'), C.dim);
          const gx = p1.x + 36, gy = p1.y + 22, gw = p1.w - 42, gh = Math.max(20, p1.h - 30);
          D.rect(g, gx, gy, gw, gh, 'rgba(0,0,0,0.3)');
          let lim = 50;
          for (const h of st.hist) lim = Math.max(lim, Math.abs(h.e));
          lim = Math.min(3000, Math.ceil(lim / 50) * 50);
          const X = (t) => gx + gw - ((st.now - t) / 10000) * gw, Y = (v) => gy + gh / 2 - (U.clamp(v, -lim, lim) / lim) * (gh / 2 - 2);
          D.line(g, gx, Y(0), gx + gw, Y(0), 'rgba(102,209,122,0.5)');
          D.text(g, '+' + lim, gx - 4, gy + 2, { size: 9, color: C.dim, align: 'right', baseline: 'top' });
          D.text(g, '0', gx - 4, Y(0), { size: 9, color: C.dim, align: 'right', baseline: 'middle' });
          D.text(g, '-' + lim, gx - 4, gy + gh - 2, { size: 9, color: C.dim, align: 'right', baseline: 'bottom' });
          // 각 표본의 RTT/2 추정 오차 (서버 시각 기준)
          for (const s of st.samples) {
            if (s.t < st.now - 10000) continue;
            const e = s.t3 + s.theta - s.t;
            D.circle(g, X(s.t), Y(e), s === st.used ? 3.5 : 2, s === st.used ? C.warn : 'rgba(255,255,255,0.45)');
          }
          if (st.hist.length > 1) D.poly(g, st.hist.map((h) => ({ x: X(h.t), y: Y(h.e) })), null, col, 2, false);

          drawTimeline(g, L.tl, st.now, 2000, [
            { link: st.up, dir: 1, color: 'rgba(200,200,200,0.9)', lw: 1, dot: 2 },
            { link: st.down, dir: -1, color: col, lw: 1.3, dot: 3 },
          ], [GTL.L('클라', 'Client'), GTL.L('서버', 'Server')]);

          const mae = st.errs.length ? st.errs.reduce((a, b) => a + b, 0) / st.errs.length : 0;
          ctx.stat(GTL.L('시간 오차 (지금)', 'Time error (now)'), `${err >= 0 ? '+' : ''}${err.toFixed(1)} ms`);
          ctx.stat(GTL.L('평균 절대 오차 (5초)', 'Mean abs error (5 s)'), mae.toFixed(1) + ' ms');
          ctx.stat(GTL.L('사용한 표본 RTT', 'RTT of used sample'), st.used ? st.used.rtt.toFixed(0) + ' ms' : '-');
          ctx.stat(GTL.L('비대칭 때문에 남는 오차', 'Error left by asymmetry'), P.method === 'rtt2' || P.method === 'filtered' ? GTL.L('약 ', 'About ') + (P.asym / 2).toFixed(0) + ' ms' : '-');
        },
        onAction(key) { if (key === 'restart') init(); },
      };
    },
  });
})();
