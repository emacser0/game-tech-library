// 틱레이트 & 스냅샷 전송률, 정확도와 지연 vs 대역폭
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
    id: 'tick-send-rate',
    title: '틱레이트 & 전송률 (Tick / Send Rate)',
    summary: '서버의 초당 시뮬레이션 횟수(틱레이트)와 초당 스냅샷 전송 횟수(전송률)를 비교함. 두 값이 궤적 정확도, 표시 지연, 대역폭을 함께 결정함.',
    views: { a: '20틱 / 10Hz 전송', b: '64틱 / 64Hz 전송' },
    controls: '←↑→↓ / WASD: 큰 원(플레이어) 이동',
    info: `
      <p><b>틱레이트(tickrate)</b>: 서버가 월드를 한 단계씩 진행하는 주기. 틱레이트가 낮으면 이렇게 됨:</p>
      <ul>
        <li>입력이 다음 틱 경계까지 기다림(평균 ½틱 지연).</li>
        <li>빠른 원운동이 거친 다각형으로 근사됨.</li>
      </ul>
      <p><b>전송률(update rate)</b>: 서버가 스냅샷을 보내는 주기. 보통 틱레이트 이하.
      클라이언트는 보간을 위해 <code>보간 지연 = 전송 간격 × 보간 비율</code>만큼 과거를 그림(Source의 <code>cl_interp_ratio</code>, 기본 2).
      그래서 전송률이 낮을수록 <b>원격 엔티티가 더 늦게, 더 각지게</b> 보임.</p>
      <p>단점: 대역폭이 전송률 × 스냅샷 크기만큼 늘어남.</p>
      <p>실제 예: CS:GO 공식 매치메이킹 64틱, 커뮤니티 서버 128틱, VALORANT 128틱.
      대역폭 수치는 단순 계산값. 기준은 UDP/IP 헤더(28B) + 패킷 헤더 + 엔티티당 14B(무압축).</p>`,
    diagram: (L) => `<svg viewBox="0 0 540 172" xmlns="http://www.w3.org/2000/svg">
      <text x="110" y="24" class="t-a">${L('A: 20틱, 10Hz 전송', 'A: 20 tick, 10 Hz send')}</text>
      <line x1="110" y1="44" x2="400" y2="44" class="d-dim"/>
      ${[0, 1, 2, 3, 4].map((i) => `<line x1="${110 + i * 72.5}" y1="36" x2="${110 + i * 72.5}" y2="52" class="d-a"/>${i % 2 === 0 ? `<circle cx="${110 + i * 72.5}" cy="44" r="4" class="f-a"/>` : ''}`).join('')}
      <text x="110" y="84" class="t-b">${L('B: 64틱, 64Hz 전송', 'B: 64 tick, 64 Hz send')}</text>
      <line x1="110" y1="104" x2="400" y2="104" class="d-dim"/>
      ${Array.from({ length: 13 }, (_, i) => `<line x1="${(110 + i * 290 / 12.8).toFixed(1)}" y1="96" x2="${(110 + i * 290 / 12.8).toFixed(1)}" y2="112" class="d-b"/><circle cx="${(110 + i * 290 / 12.8).toFixed(1)}" cy="104" r="3" class="f-b"/>`).join('')}
      <text x="4" y="48" class="t-small t-dim">${L('0~200ms', '0~200 ms')}</text>
      <line x1="110" y1="134" x2="110" y2="146" class="d-dim"/><text x="116" y="144" class="t-small t-dim">${L('틱 (시뮬레이션 1회)', 'tick (one sim step)')}</text>
      <circle cx="250" cy="140" r="3.5" class="f-dim"/><text x="258" y="144" class="t-small t-dim">${L('스냅샷 전송', 'snapshot sent')}</text>
      <polygon points="${Array.from({ length: 6 }, (_, i) => `${(475 + 42 * Math.cos(i * Math.PI / 3)).toFixed(1)},${(72 + 42 * Math.sin(i * Math.PI / 3)).toFixed(1)}`).join(' ')}" class="d-a"/>
      <polygon points="${Array.from({ length: 24 }, (_, i) => `${(475 + 42 * Math.cos(i * Math.PI / 12)).toFixed(1)},${(72 + 42 * Math.sin(i * Math.PI / 12)).toFixed(1)}`).join(' ')}" class="d-b"/>
      <text x="475" y="132" text-anchor="middle" class="t-small t-dim">${L('원운동 근사', 'circle path')}</text>
      <text x="4" y="166" class="t-small t-dim">${L('보간 지연 = 전송 간격 × 2. A는 200ms, B는 31ms 과거를 그림', 'Interp delay = send interval × 2. A draws 200 ms in the past, B draws 31 ms')}</text>
    </svg>`,
    look: [
      '클라이언트 화면의 궤적(흰 선)을 비교하면, A는 원을 현(弦)으로 자른 다각형 모양임. B는 거의 원.',
      'A의 "보간 지연"을 보면 200ms임. 녹색 고스트(서버 현재 위치)와 표시 위치의 차이가 큼.',
      '대역폭 패널을 비교하면 B가 수 배 큼.',
      '엔티티 수를 늘리면 64명 서버의 총 송신량이 크게 늘어남 (델타 압축, 관심 영역 관리 샘플 참고).',
      '틱레이트는 그대로 두고 전송률만 낮추면, 서버 궤적(왼쪽)은 매끈하지만 클라이언트 궤적은 각짐.',
    ],
    refs: [
      { type: 'engine', title: 'Source Multiplayer Networking', url: 'https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking', note: 'Valve. tickrate, cl_updaterate, cl_interp_ratio, 대역폭(rate).' },
      { type: 'article', title: "VALORANT's 128-Tick Servers", url: 'https://technology.riotgames.com/news/valorants-128-tick-servers', year: 2020, note: 'Riot Games Technology 블로그. 128틱 서버의 비용 최적화.' },
      { type: 'article', title: 'Snapshot Interpolation', url: 'https://gafferongames.com/post/snapshot_interpolation/', note: 'Glenn Fiedler. 전송률별 보간 버퍼와 대역폭.' },
      { type: 'talk', title: 'Overwatch Gameplay Architecture and Netcode', year: 2017, note: 'Tim Ford, GDC 2017. 고정 틱(60Hz) 시뮬레이션.' },
    ],
    params: [
      { key: 'lat', label: '편도 지연 (ms)', type: 'int', min: 0, max: 300, default: 50, shared: true, group: '네트워크' },
      { key: 'jitter', label: '지터 (ms)', type: 'int', min: 0, max: 80, default: 5, shared: true },
      { key: 'loss', label: '패킷 손실률', type: 'range', min: 0, max: 0.2, step: 0.01, default: 0.0, shared: true },
      { key: 'count', label: '엔티티 수', type: 'int', min: 2, max: 64, default: 12, shared: true, reset: true, group: '장면' },
      { key: 'players', label: '서버 접속 인원', type: 'int', min: 2, max: 128, default: 64, shared: true, help: '서버 총 송신량 계산용' },
      { key: 'auto', label: '자동 입력', type: 'bool', default: true, shared: true },
      { key: 'tickHz', label: '서버 틱레이트 (Hz)', type: 'int', min: 5, max: 128, default: 64, a: 20, b: 64, group: '기법' },
      { key: 'sendHz', label: '스냅샷 전송률 (Hz)', type: 'int', min: 2, max: 128, default: 64, a: 10, b: 64, help: '틱레이트를 넘을 수 없음' },
      { key: 'ratio', label: '보간 비율', type: 'range', min: 0.5, max: 4, step: 0.5, default: 2, help: '보간 지연 = 전송 간격 × 비율' },
      { key: 'ghost', label: '서버 현재 위치 고스트', type: 'bool', default: true },
      { key: 'restart', label: '다시 시작', type: 'button' },
    ],
    en: {
      title: 'Tick Rate & Send Rate',
      summary: 'This compares how many times per second the server simulates (tick rate) and how many snapshots per second it sends (send rate). Together they set path accuracy, display delay, and bandwidth.',
      views: { a: '20 tick / 10Hz send', b: '64 tick / 64Hz send' },
      controls: 'Arrow keys / WASD: move the big circle (player)',
      info: `
      <p><b>Tick rate</b>: how often the server advances the world by one step. With a low tick rate:</p>
      <ul>
        <li>Input waits until the next tick boundary (½ tick delay on average).</li>
        <li>Fast circular motion turns into a rough polygon.</li>
      </ul>
      <p><b>Send rate (update rate)</b>: how often the server sends snapshots. Usually at or below the tick rate.
      For interpolation, the client draws the past by <code>interpolation delay = send interval × interpolation ratio</code> (Source's <code>cl_interp_ratio</code>, default 2).
      So the lower the send rate, the <b>later and more angular remote entities</b> look.</p>
      <p>Downside: bandwidth grows by send rate × snapshot size.</p>
      <p>Real examples: CS:GO official matchmaking uses 64 tick, community servers 128 tick, VALORANT 128 tick.
      Bandwidth numbers are simple estimates. They assume a UDP/IP header (28B) + packet header + 14B per entity (no compression).</p>`,
      look: [
        'Compare the paths (white lines) on the client view. In A, the circle becomes a polygon cut into chords. In B, it is almost a circle.',
        'Look at A\'s "Interpolation delay". It is 200ms. The gap between the green ghost (current server position) and the shown position is large.',
        'Compare the bandwidth panels. B is several times larger.',
        'Raise the entity count. The total send of a 64-player server grows a lot (see the delta compression and interest management samples).',
        'Keep the tick rate and lower only the send rate. The server path (left) stays smooth, but the client path gets angular.',
      ],
      refs: [
        'Valve. tickrate, cl_updaterate, cl_interp_ratio, bandwidth (rate).',
        'Riot Games Technology blog. Cost optimization for 128-tick servers.',
        'Glenn Fiedler. Interpolation buffers and bandwidth by send rate.',
        'Tim Ford, GDC 2017. Fixed tick (60Hz) simulation.',
      ],
      params: {
        lat: { label: 'One-way latency (ms)', group: 'Network' },
        jitter: 'Jitter (ms)',
        loss: 'Packet loss rate',
        count: { label: 'Entity count', group: 'Scene' },
        players: { label: 'Players on server', help: 'Used to compute total server send' },
        auto: 'Auto input',
        tickHz: { label: 'Server tick rate (Hz)', group: 'Technique' },
        sendHz: { label: 'Snapshot send rate (Hz)', help: 'Cannot be higher than the tick rate' },
        ratio: { label: 'Interpolation ratio', help: 'Interpolation delay = send interval × ratio' },
        ghost: 'Current server position ghost',
        restart: 'Restart',
      },
    },

    setup(ctx) {
      const P = ctx.params;
      const WW = 400, WH = 260, SPEED = 170;
      let st, orb;
      function init() {
        ctx.rng = U.rng(ctx.seed);
        const ls = ctx.rng.int(1, 1e9);
        orb = Array.from({ length: P.count }, () => ({
          cx: ctx.rng.range(70, 330), cy: ctx.rng.range(60, 200), r: ctx.rng.range(25, 55),
          w: ctx.rng.range(3.5, 8) * (ctx.rng.chance(0.5) ? 1 : -1), ph: ctx.rng.range(0, U.TAU),
        }));
        st = {
          now: 0, tick: 0, acc: 0, sAcc: 0, sTick: 0, sTime: 0, down: new Link(ls, 2),
          player: { x: 200, y: 220 }, ents: [], sTrail: [], buf: [], age: null, disp: [], trails: [],
          bytesHist: [], bytesWin: [], err: [], ticksWin: [],
        };
        st.ents = serverState(0);
        st.disp = st.ents.map((e) => ({ ...e }));
        st.trails = st.ents.map(() => []);
      }
      const orbPos = (o, t) => ({ x: o.cx + Math.cos(o.ph + o.w * t / 1000) * o.r, y: o.cy + Math.sin(o.ph + o.w * t / 1000) * o.r });
      const serverState = (t) => [{ x: st.player.x, y: st.player.y }, ...orb.map((o) => orbPos(o, t))];
      init();

      function tick() {
        st.now += STEP; st.tick++;
        const net = { lat: P.lat, jit: P.jitter, loss: P.loss };
        const m = getMove(ctx, st.now);
        // 서버: tickHz 주기로만 월드를 진행 (입력도 틱 경계에서만 반영)
        const tickMs = 1000 / P.tickHz;
        const every = Math.max(1, Math.round(P.tickHz / Math.min(P.sendHz, P.tickHz)));
        st.sAcc += STEP;
        let guard = 0;
        while (st.sAcc >= tickMs && guard++ < 16) {
          st.sAcc -= tickMs;
          st.sTime += tickMs; st.sTick++;
          const dt = tickMs / 1000, l = Math.hypot(m.x, m.y) || 1;
          st.player.x = U.clamp(st.player.x + (m.x / l) * SPEED * dt, 12, WW - 12);
          st.player.y = U.clamp(st.player.y + (m.y / l) * SPEED * dt, 12, WH - 12);
          st.ents = serverState(st.sTime);
          st.ticksWin.push(st.now);
          if (st.sTick % every === 0) {
            const bytes = 28 + 12 + st.ents.length * 14;
            st.down.send(st.now, Math.round(st.sTime), { t: st.sTime, ents: st.ents.map((e) => ({ ...e })) }, net, bytes);
            st.bytesWin.push({ t: st.now, b: bytes });
          }
        }
        if (guard >= 16) st.sAcc = 0;
        while (st.bytesWin.length && st.bytesWin[0].t < st.now - 1000) st.bytesWin.shift();
        while (st.ticksWin.length && st.ticksWin[0] < st.now - 1000) st.ticksWin.shift();
        st.sTrail.push({ ...st.ents[1] }); if (st.sTrail.length > 60) st.sTrail.shift();

        for (const p of st.down.poll(st.now)) {
          const s = p.data, age = st.now - s.t;
          st.age = st.age === null ? age : U.lerp(st.age, age, 0.1);
          let i = st.buf.length;
          while (i > 0 && st.buf[i - 1].t > s.t) i--;
          st.buf.splice(i, 0, s);
        }
        while (st.buf.length > 2 && st.buf[1].t < st.now - 2000) st.buf.shift();
        if (st.buf.length) {
          const iv = (1000 / P.tickHz) * every;
          const rt = st.now - (st.age ?? 0) - iv * P.ratio;
          st.rt = rt;
          const k = st.buf.findIndex((s) => s.t > rt);
          if (k <= 0) st.disp = (k === 0 ? st.buf[0] : st.buf[st.buf.length - 1]).ents.map((e) => ({ ...e }));
          else {
            const a = st.buf[k - 1], b = st.buf[k], f = U.clamp((rt - a.t) / (b.t - a.t), 0, 1);
            st.disp = a.ents.map((e, j) => ({ x: U.lerp(e.x, b.ents[j].x, f), y: U.lerp(e.y, b.ents[j].y, f) }));
          }
          // 경로 오차: 같은 렌더 시각의 진짜 궤도 위치와 비교 (지연 제외, 모양 오차만)
          let e = 0;
          orb.forEach((o, j) => { const tp = orbPos(o, rt); e += Math.hypot(tp.x - st.disp[j + 1].x, tp.y - st.disp[j + 1].y); });
          st.err.push(e / orb.length); if (st.err.length > 120) st.err.shift();
        }
        st.disp.forEach((d, j) => { if (st.trails[j]) { st.trails[j].push(d); if (st.trails[j].length > 50) st.trails[j].shift(); } });
        const bps = st.bytesWin.reduce((a, b) => a + b.b, 0);
        st.bytesHist.push(bps * 8 / 1000); if (st.bytesHist.length > 180) st.bytesHist.shift();
      }

      function arena(g, m) {
        D.rect(g, m.ox, m.oy, m.w, m.h, null, 'rgba(255,255,255,0.15)');
        D.grid(g, m.w, m.h, 40 * m.s, C.grid, m.ox, m.oy);
      }
      function drawEnts(g, m, list, col, outline) {
        list.forEach((e, i) => {
          const r = (i === 0 ? 10 : 5) * m.s;
          if (outline) D.circle(g, m.X(e.x), m.Y(e.y), r, null, C.good, 1);
          else D.circle(g, m.X(e.x), m.Y(e.y), r, i === 0 ? col : U.hsl((i * 47) % 360, 55, 65));
        });
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
          const every = Math.max(1, Math.round(P.tickHz / Math.min(P.sendHz, P.tickHz)));
          const effHz = P.tickHz / every, iv = 1000 / effHz;

          panel(g, p0, GTL.L(`서버 (${P.tickHz}틱)`, `Server (${P.tickHz} tick)`), C.good);
          let m = fit(p0, WW, WH); arena(g, m);
          if (st.sTrail.length > 1) D.poly(g, st.sTrail.map((d) => ({ x: m.X(d.x), y: m.Y(d.y) })), null, 'rgba(102,209,122,0.6)', 1, false);
          drawEnts(g, m, st.ents, C.good);

          panel(g, p1, GTL.L(`클라이언트 (${effHz.toFixed(0)}Hz 수신, 보간)`, `Client (${effHz.toFixed(0)}Hz receive, interpolated)`), col);
          m = fit(p1, WW, WH); arena(g, m);
          orb.forEach((o) => D.circle(g, m.X(o.cx), m.Y(o.cy), o.r * m.s, null, 'rgba(255,255,255,0.06)', 1));
          g.globalAlpha = 0.55;
          st.trails.forEach((tr) => { if (tr.length > 1) D.poly(g, tr.map((d) => ({ x: m.X(d.x), y: m.Y(d.y) })), null, '#ffffff', 1, false); });
          g.globalAlpha = 1;
          if (P.ghost) drawEnts(g, m, st.ents, col, true);
          drawEnts(g, m, st.disp, col);

          panel(g, p2, GTL.L('대역폭 (클라 1명, kbps)', 'Bandwidth (1 client, kbps)'), C.dim);
          const bx = p2.x + 6, bw = p2.w - 12, gy = p2.y + 24, gh = Math.max(20, p2.h - 70);
          const maxK = Math.max(50, ...st.bytesHist);
          D.plot(g, st.bytesHist, bx, gy, bw, gh, { min: 0, max: maxK * 1.15, color: col, label: GTL.L(`최대 ${maxK.toFixed(0)} kbps`, `Max ${maxK.toFixed(0)} kbps`) });
          const kb = st.bytesHist[st.bytesHist.length - 1] || 0;
          D.text(g, GTL.L(`${kb.toFixed(1)} kbps × ${P.players}명`, `${kb.toFixed(1)} kbps × ${P.players} players`), bx, gy + gh + 6, { size: 11, color: C.text });
          D.text(g, GTL.L(`= 서버 송신 ${(kb * P.players / 1000).toFixed(2)} Mbps`, `= server send ${(kb * P.players / 1000).toFixed(2)} Mbps`), bx, gy + gh + 22, { size: 11, color: col });

          drawTimeline(g, L.tl, st.now, 1000, [{ link: st.down, dir: 1, color: col, lw: 1.2, dot: 3 }], [GTL.L('서버', 'Server'), GTL.L('클라', 'Client')]);

          const err = st.err.length ? st.err.reduce((a, b) => a + b, 0) / st.err.length : 0;
          ctx.stat(GTL.L('보간 지연', 'Interpolation delay'), (iv * P.ratio).toFixed(0) + ' ms');
          ctx.stat(GTL.L('입력 틱 대기(평균)', 'Input wait for tick (avg)'), (500 / P.tickHz).toFixed(1) + ' ms');
          ctx.stat(GTL.L('궤적 모양 오차', 'Path shape error'), err.toFixed(2) + ' u');
          ctx.stat(GTL.L('서버 틱/초', 'Server ticks per s'), st.ticksWin.length);
          ctx.stat(GTL.L('대역폭/클라', 'Bandwidth per client'), kb.toFixed(1) + ' kbps');
        },
        onAction(key) { if (key === 'restart') init(); },
      };
    },
  });
})();
