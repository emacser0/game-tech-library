// 지터 버퍼 (Jitter / Playout Buffer), 끊김 vs 지연 트레이드오프
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
    id: 'jitter-buffer',
    title: '지터 버퍼 (Jitter Buffer)',
    summary: '패킷 도착 간격이 들쭉날쭉하면 받은 즉시 재생할 때 끊김. 몇 프레임을 미리 쌓아두고 일정한 박자로 꺼내면 매끄러워짐. 대신 그만큼 지연이 늘어남.',
    views: { a: '버퍼 2프레임', b: '버퍼 4프레임' },
    controls: '←↑→↓ / WASD: 큰 원 이동 (서버 쪽 입력)',
    info: `
      <p><b>지터 버퍼</b>: 도착한 프레임을 잠시 쌓아두었다가 일정한 박자로 꺼내 재생하는 버퍼.</p>
      <p>왜 필요한가: 서버는 일정한 간격으로 프레임을 보냄. 하지만 인터넷을 지나며 패킷마다 지연이 달라짐(<b>지터</b>).
      VoIP(RTP, RFC 3550)와 스냅샷 보간 모두 같은 문제를 풂.</p>
      <ul>
        <li>수신 측은 프레임 k를 <code>재생 시각(k) = k × 간격 + 기본 지연 + 버퍼 지연</code>에 꺼냄.</li>
        <li>추가 지연이 버퍼 지연보다 작은 패킷은 모두 제때 재생됨.</li>
        <li>더 늦게 온 패킷은 재생 시점이 이미 지나 <b>버려짐</b>. 그동안 화면이 멈춤(언더런).</li>
        <li><b>적응형</b> 모드: 최근 2초간 관측한 도착 편차(최소 지연 대비)를 덮을 만큼만 버퍼를 자동 조절함.</li>
        <li>RFC 3550의 지터 추정값 <code>J += (|D| − J)/16</code>도 함께 표시함.</li>
      </ul>
      <p>단점: 버퍼가 크면 끊김은 줄지만 <b>모든 프레임이 그만큼 늦게</b> 보임.</p>`,
    diagram: (L) => `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
      <text x="4" y="34">${L('송신', 'Send')}</text>
      <text x="4" y="79">${L('도착', 'Arrive')}</text>
      <text x="4" y="119" class="t-a">${L('A 재생', 'A play')}</text>
      <text x="4" y="154" class="t-b">${L('B 재생', 'B play')}</text>
      ${[30, 75, 115, 150].map((y) => `<line x1="90" y1="${y}" x2="530" y2="${y}" class="d-dim"/>`).join('')}
      ${[[110, 145], [170, 220], [230, 260], [290, 365], [350, 390], [410, 460]].map(([s, a], k) => `<circle cx="${s}" cy="30" r="3.5" class="f-dim"/><line x1="${s}" y1="30" x2="${a}" y2="75" class="d-line"/><circle cx="${a}" cy="75" r="3.5" class="f-dim"/><text x="${s}" y="20" text-anchor="middle" class="t-small t-mono t-dim">${k}</text>`).join('')}
      ${[165, 225, 285, 345, 405, 465].map((x, k) => k === 3 ? `<path d="M${x - 5},110 L${x + 5},120 M${x + 5},110 L${x - 5},120" class="d-bad"/><text x="${x}" y="134" text-anchor="middle" class="t-small t-dim">${L('늦음 (버림)', 'late (dropped)')}</text>` : `<circle cx="${x}" cy="115" r="4" class="f-a"/>`).join('')}
      ${[190, 250, 310, 370, 430, 490].map((x) => `<circle cx="${x}" cy="150" r="4" class="f-b"/>`).join('')}
      <text x="4" y="180" class="t-small t-dim">${L('재생은 일정한 박자. 버퍼보다 늦은 프레임만 버림. 버퍼가 크면 모든 프레임이 늦음', 'Steady playout beat. Frames later than the buffer are dropped. A bigger buffer delays all frames')}</text>
    </svg>`,
    look: [
      '두 뷰의 원을 비교하면, A는 자주 멈칫함(다음 프레임이 아직 안 와서 언더런). B는 매끄럽지만 "총 지연"이 더 큼.',
      'A의 버퍼 크기를 0~1로 줄이면 "버퍼 상태"에 빨간 칸(늦어서 버린 프레임)이 생김.',
      '지터를 0으로 낮추면 A도 매끄러워짐. 버퍼는 지터를 덮을 만큼만 있으면 충분함.',
      '버퍼 모드를 "적응형"으로 바꾸고 지터를 바꾸면 버퍼 지연이 따라서 늘고 줄어듦.',
      '손실률을 올리면 B에서도 가끔 멈춤(손실 칸은 보라색). 손실은 버퍼로 해결할 수 없음.',
    ],
    refs: [
      { type: 'paper', title: 'RFC 3550 - RTP: A Transport Protocol for Real-Time Applications', url: 'https://www.rfc-editor.org/rfc/rfc3550', year: 2003, note: '6.4.1절 도착 간격 지터 추정식.' },
      { type: 'article', title: 'Snapshot Interpolation', url: 'https://gafferongames.com/post/snapshot_interpolation/', note: 'Glenn Fiedler. 지터를 덮는 보간 버퍼 크기 선택.' },
      { type: 'article', title: 'What Every Programmer Needs To Know About Game Networking', url: 'https://gafferongames.com/post/what_every_programmer_needs_to_know_about_game_networking/', note: 'Glenn Fiedler.' },
      { type: 'engine', title: 'Source Multiplayer Networking - Entity interpolation', url: 'https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking', note: 'Valve. 보간 지연(cl_interp)이 지터 버퍼 역할을 함.' },
    ],
    params: [
      { key: 'lat', label: '기본 지연 (ms)', type: 'int', min: 0, max: 300, default: 60, shared: true, group: '네트워크' },
      { key: 'jitter', label: '지터 (ms)', type: 'int', min: 0, max: 200, default: 70, shared: true, help: '패킷마다 0~지터 ms 추가 지연' },
      { key: 'loss', label: '패킷 손실률', type: 'range', min: 0, max: 0.3, step: 0.01, default: 0.02, shared: true },
      { key: 'rate', label: '프레임 전송률 (Hz)', type: 'int', min: 10, max: 60, default: 30, shared: true },
      { key: 'auto', label: '자동 입력', type: 'bool', default: true, shared: true, group: '장면' },
      { key: 'mode', label: '버퍼 모드', type: 'select', group: '기법', options: [
        { value: 'fixed', label: '고정 크기' },
        { value: 'adaptive', label: '적응형' },
      ], default: 'fixed' },
      { key: 'frames', label: '버퍼 크기 (프레임)', type: 'int', min: 0, max: 10, default: 4, a: 2, b: 4, when: (p) => p.mode === 'fixed' },
      { key: 'restart', label: '다시 시작', type: 'button' },
    ],
    en: {
      title: 'Jitter Buffer',
      summary: 'When packets arrive at uneven intervals, playing each one as soon as it arrives causes stutter. Store a few frames first and take them out at a steady beat, and playback becomes smooth. The cost is that much more delay.',
      views: { a: 'Buffer 2 frames', b: 'Buffer 4 frames' },
      controls: 'Arrow keys / WASD: move the big circle (server-side input)',
      info: `
      <p>A <b>jitter buffer</b> holds arriving frames for a short time and then plays them out at a steady beat.</p>
      <p>Why you need it: the server sends frames at a steady interval. But on the way through the internet, each packet gets a different delay (<b>jitter</b>).
      VoIP (RTP, RFC 3550) and snapshot interpolation both solve the same problem.</p>
      <ul>
        <li>The receiver takes frame k out at <code>playout time(k) = k × interval + base delay + buffer delay</code>.</li>
        <li>Every packet whose extra delay is smaller than the buffer delay plays on time.</li>
        <li>A packet that arrives later has already missed its playout time, so it is <b>dropped</b>. Meanwhile the picture freezes (underrun).</li>
        <li><b>Adaptive</b> mode sizes the buffer automatically, just enough to cover the arrival spread (vs the minimum delay) seen in the last 2 seconds.</li>
        <li>It also shows the RFC 3550 jitter estimate <code>J += (|D| − J)/16</code>.</li>
      </ul>
      <p>Downside: a big buffer reduces stutter, but <b>every frame shows up that much later</b>.</p>`,
      look: [
        'Compare the circles in both views. A often hitches (underrun, because the next frame has not arrived yet). B is smooth, but its "Total delay" is larger.',
        'Reduce A\'s buffer size to 0 or 1. Red cells (frames dropped as late) appear in "Buffer state".',
        'Lower jitter to 0. A also becomes smooth. The buffer only needs to be big enough to cover the jitter.',
        'Switch the buffer mode to "Adaptive" and change jitter. The buffer delay grows and shrinks to follow it.',
        'Raise packet loss. B also freezes sometimes (lost cells are purple). A buffer cannot fix loss.',
      ],
      refs: [
        'Section 6.4.1: the interarrival jitter estimate.',
        'Glenn Fiedler. Choosing an interpolation buffer size that covers jitter.',
        'Glenn Fiedler.',
        'Valve. The interpolation delay (cl_interp) works as a jitter buffer.',
      ],
      params: {
        lat: { label: 'Base latency (ms)', group: 'Network' },
        jitter: { label: 'Jitter (ms)', help: 'Each packet gets 0 to jitter ms of extra delay' },
        loss: 'Packet loss rate',
        rate: 'Frame send rate (Hz)',
        auto: { label: 'Auto input', group: 'Scene' },
        mode: { label: 'Buffer mode', group: 'Technique', options: { fixed: 'Fixed size', adaptive: 'Adaptive' } },
        frames: 'Buffer size (frames)',
        restart: 'Restart',
      },
    },

    setup(ctx) {
      const P = ctx.params;
      const WW = 400, WH = 260, SPEED = 170;
      let st;
      function init() {
        ctx.rng = U.rng(ctx.seed);
        const ls = ctx.rng.int(1, 1e9);
        st = {
          now: 0, tick: 0, acc: 0, sAcc: 0, seq: 0, down: new Link(ls, 2),
          player: { x: 200, y: 200 }, frames: new Map(), lostSet: new Set(), lateSet: new Set(),
          offs: [], minOff: null, J: 0, lastTransit: null, delay: 0,
          disp: null, prevDisp: null, speed: [], stall: [], late: 0, recv: 0, ph: 0, trail: [],
        };
      }
      init();
      const orbit = (tMs) => ({ x: 120 + Math.cos(tMs / 450) * 80, y: 110 + Math.sin(tMs / 450) * 80 });

      function tick() {
        st.now += STEP; st.tick++;
        const dt = STEP / 1000;
        const net = { lat: P.lat, jit: P.jitter, loss: P.loss };
        const m = getMove(ctx, st.now), l = Math.hypot(m.x, m.y) || 1;
        st.player.x = U.clamp(st.player.x + (m.x / l) * SPEED * dt, 12, WW - 12);
        st.player.y = U.clamp(st.player.y + (m.y / l) * SPEED * dt, 12, WH - 12);

        const iv = 1000 / P.rate;
        st.sAcc += STEP;
        if (st.sAcc >= iv) {
          st.sAcc = Math.min(st.sAcc - iv, iv);
          const k = st.seq++;
          const pk = st.down.send(st.now, st.tick, { k, t: st.now, o: orbit(st.now), p: { ...st.player } }, net, 40);
          if (pk.lost) st.lostSet.add(k);
        }

        for (const p of st.down.poll(st.now)) {
          const f = p.data;
          st.recv++;
          const transit = st.now - f.t; // 클라 입장에선 "도착시각 - 서버 타임스탬프" (시계 오프셋 포함)
          if (st.lastTransit !== null) st.J += (Math.abs(transit - st.lastTransit) - st.J) / 16; // RFC 3550
          st.lastTransit = transit;
          st.offs.push({ t: st.now, o: transit });
          // 이미 재생 시점이 지난 프레임은 버림
          if (st.disp && f.t < st.ph - 1e-6) { st.late++; st.lateSet.add(f.k); continue; }
          st.frames.set(f.k, f);
        }
        while (st.offs.length && st.offs[0].t < st.now - 2000) st.offs.shift();
        if (!st.offs.length) return;
        const mn = Math.min(...st.offs.map((o) => o.o)), mx = Math.max(...st.offs.map((o) => o.o));
        st.minOff = st.minOff === null ? mn : Math.min(U.lerp(st.minOff, mn, 0.01), mn);
        const target = P.mode === 'fixed' ? P.frames * iv : Math.max(0, mx - st.minOff) + 8;
        st.delay = P.mode === 'fixed' ? target : U.approach(st.delay, target, 40 * dt); // 적응형은 서서히 변경 (재생 속도 조절에 해당)

        // 재생 헤드(서버 시간축). 앞으로만 진행.
        const ph = Math.max(st.ph, st.now - st.minOff - st.delay);
        st.ph = ph;
        // ph를 감싸는 두 프레임 찾기
        const kf = Math.floor(ph / iv);
        let a = null, b = null;
        for (let k = kf + 2; k >= kf - 6; k--) { const f = st.frames.get(k); if (f && f.t <= ph) { a = f; break; } }
        for (let k = kf - 1; k <= kf + 8; k++) { const f = st.frames.get(k); if (f && f.t > ph) { b = f; break; } }
        st.prevDisp = st.disp;
        let stalled = false;
        if (a && b) {
          const u = U.clamp((ph - a.t) / (b.t - a.t), 0, 1);
          st.disp = { o: v2l(a.o, b.o, u), p: v2l(a.p, b.p, u) };
        } else if (a) { st.disp = st.disp || { o: a.o, p: a.p }; stalled = true; } // 다음 프레임 없음 → 정지
        else stalled = !!st.disp;
        st.stall.push(stalled ? 1 : 0); if (st.stall.length > 300) st.stall.shift();
        if (st.disp && st.prevDisp) {
          st.speed.push(Math.min(600, Math.hypot(st.disp.o.x - st.prevDisp.o.x, st.disp.o.y - st.prevDisp.o.y) / dt));
          if (st.speed.length > 180) st.speed.shift();
        }
        if (st.disp) { st.trail.push(st.disp.o); if (st.trail.length > 40) st.trail.shift(); }
        for (const k of st.frames.keys()) if (k < kf - 30) st.frames.delete(k);
        for (const k of st.lostSet) if (k < kf - 30) st.lostSet.delete(k);
        for (const k of st.lateSet) if (k < kf - 30) st.lateSet.delete(k);
      }
      const v2l = (a, b, u) => ({ x: U.lerp(a.x, b.x, u), y: U.lerp(a.y, b.y, u) });

      function arena(g, m) {
        D.rect(g, m.ox, m.oy, m.w, m.h, null, 'rgba(255,255,255,0.15)');
        D.grid(g, m.w, m.h, 40 * m.s, C.grid, m.ox, m.oy);
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
          const iv = 1000 / P.rate;

          panel(g, p0, GTL.L('서버 (원본)', 'Server (source)'), C.good);
          let m = fit(p0, WW, WH); arena(g, m);
          const o = orbit(st.now);
          D.circle(g, m.X(o.x), m.Y(o.y), 9 * m.s, C.good);
          D.circle(g, m.X(st.player.x), m.Y(st.player.y), 11 * m.s, C.good);

          panel(g, p1, GTL.L('클라이언트 재생', 'Client playback'), col);
          m = fit(p1, WW, WH); arena(g, m);
          st.trail.forEach((d, i) => D.circle(g, m.X(d.x), m.Y(d.y), 1.8, `rgba(255,255,255,${0.1 + (i / st.trail.length) * 0.4})`));
          if (st.disp) {
            D.circle(g, m.X(st.disp.o.x), m.Y(st.disp.o.y), 9 * m.s, col);
            D.circle(g, m.X(st.disp.p.x), m.Y(st.disp.p.y), 11 * m.s, col);
          }
          const stallNow = st.stall[st.stall.length - 1];
          if (stallNow) D.text(g, GTL.L('언더런, 정지', 'Underrun, frozen'), p1.x + p1.w - 6, p1.y + 5, { size: 10, color: C.bad, align: 'right' });

          panel(g, p2, GTL.L('버퍼 상태 (프레임 번호)', 'Buffer state (frame number)'), C.dim);
          const kf = Math.floor(st.ph / iv);
          const cells = 18, cw = Math.max(4, (p2.w - 12) / cells), cy = p2.y + 26, ch = 20;
          for (let i = 0; i < cells; i++) {
            const k = kf - 4 + i;
            if (k < 0) continue;
            const x = p2.x + 6 + i * cw;
            let fill = 'rgba(255,255,255,0.06)';                    // 아직 안 옴
            if (st.frames.has(k)) fill = k <= kf ? 'rgba(255,255,255,0.25)' : col; // 재생됨 / 대기 중
            if (st.lateSet.has(k)) fill = C.bad;
            if (st.lostSet.has(k) && k <= kf) fill = C.accent;
            D.rect(g, x + 1, cy, cw - 2, ch, fill);
          }
          const phx = p2.x + 6 + (4 + (st.ph / iv - kf)) * cw;
          D.line(g, phx, cy - 4, phx, cy + ch + 4, C.warn, 2);
          D.text(g, GTL.L('재생', 'Play'), phx, cy + ch + 5, { size: 9, color: C.warn, align: 'center' });
          const gy = cy + ch + 22, gh = Math.max(16, p2.y + p2.h - gy - 6);
          const ideal = (80 * 1000) / 450;
          D.plot(g, st.speed, p2.x + 6, gy, p2.w - 12, gh, { min: 0, max: ideal * 3, color: col, label: GTL.L('궤도 원 화면 속도', 'Orbit circle screen speed') });
          const iy = gy + gh - gh / 3;
          D.line(g, p2.x + 6, iy, p2.x + p2.w - 6, iy, 'rgba(102,209,122,0.4)', 1);

          drawTimeline(g, L.tl, st.now, 1500, [{ link: st.down, dir: 1, color: col, lw: 1.3, dot: 3 }], [GTL.L('서버', 'Server'), GTL.L('클라', 'Client')]);

          const sr = st.stall.length ? st.stall.reduce((a, b) => a + b, 0) / st.stall.length : 0;
          ctx.stat(GTL.L('버퍼 지연', 'Buffer delay'), st.delay.toFixed(0) + ' ms');
          ctx.stat(GTL.L('총 지연 (기본+버퍼)', 'Total delay (base + buffer)'), ((st.minOff ?? 0) + st.delay).toFixed(0) + ' ms');
          ctx.stat(GTL.L('언더런(정지) 비율', 'Underrun (freeze) rate'), (sr * 100).toFixed(1) + ' %');
          ctx.stat(GTL.L('늦어서 버린 프레임', 'Frames dropped as late'), st.late);
          ctx.stat(GTL.L('지터 추정 J (RFC 3550)', 'Jitter estimate J (RFC 3550)'), st.J.toFixed(1) + ' ms');
        },
        onAction(key) { if (key === 'restart') init(); },
      };
    },
  });
})();
