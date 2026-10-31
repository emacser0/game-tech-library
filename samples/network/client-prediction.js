// 클라이언트 측 예측 (Client-side Prediction)
// 모든 네트워크는 뷰 내부에서 시뮬레이션. 패킷 지연/손실은 (시드, 채널, 보낸 틱)의 해시로 정해지므로
// A/B가 같은 시각에 보낸 패킷은 정확히 같은 네트워크 상태를 겪음
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

  GTL.register({
    id: 'client-prediction',
    title: '클라이언트 측 예측 (Client-side Prediction)',
    summary: '내 입력을 서버 응답 없이 로컬에서 바로 시뮬레이션. 지연이 커도 조작이 즉시 반응. 서버 상태가 오면 미확인 입력을 다시 적용해 맞춤.',
    views: { a: '예측 없음 (서버 응답 대기)', b: '예측 + 재조정' },
    controls: '←↑→↓ / WASD 이동 (두 뷰 동시). 키 입력이 자동 입력보다 우선.',
    info: `
      <p><b>클라이언트 측 예측</b>: 서버와 같은 이동 코드를 클라이언트에서도 실행해 입력을 바로 화면에 반영하는 기법</p>
      <p>권위 서버(authoritative server) 구조에서는 클라이언트가 입력만 보내고, 위치는 서버가 정함.
      예측이 없으면 <b>입력이 서버에 도착 → 서버가 처리 → 스냅샷이 돌아옴</b> 과정을 모두 기다림.
      그래서 화면이 RTT(왕복 지연) + 스냅샷 대기 시간만큼 늦게 반응.</p>
      <ul>
        <li>서버 스냅샷에 "마지막으로 처리한 입력 번호"가 담김</li>
        <li>클라이언트는 서버 상태로 되돌린 뒤, 아직 확인되지 않은 입력을 다시 적용(<b>재조정, reconciliation</b>)</li>
        <li>게임 로직이 결정론적(같은 입력이면 같은 결과)이면 결과가 예측과 같음. 그래서 보정이 보이지 않음.</li>
        <li>입력 패킷마다 최근 입력 3개를 중복으로 담음. 패킷 일부가 손실돼도 서버가 입력을 놓치지 않음.</li>
      </ul>
      <p>단점: 재조정 없이 예측만 하면 스냅샷이 올 때마다 위치가 과거로 끌려감</p>`,
    diagram: (L) => `<svg viewBox="0 0 540 192" xmlns="http://www.w3.org/2000/svg">
      <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="arrA" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
      <text x="4" y="54">${L('클라이언트', 'Client')}</text>
      <text x="4" y="124">${L('서버', 'Server')}</text>
      <line x1="110" y1="50" x2="530" y2="50" class="d-dim"/>
      <line x1="110" y1="120" x2="530" y2="120" class="d-dim"/>
      <line x1="150" y1="50" x2="258" y2="118" class="d-accent" marker-end="url(#arr)"/>
      <text x="196" y="96" text-anchor="end" class="t-small">${L('입력 #5', 'input #5')}</text>
      <rect x="260" y="112" width="30" height="16" class="f-dim"/>
      <text x="275" y="140" text-anchor="middle" class="t-small t-dim">${L('서버 처리', 'server step')}</text>
      <line x1="290" y1="120" x2="398" y2="52" class="d-line" marker-end="url(#arr)"/>
      <text x="352" y="96" class="t-small">${L('스냅샷 (ack #5)', 'snapshot (ack #5)')}</text>
      <line x1="200" y1="44" x2="200" y2="56" class="d-dim"/><line x1="250" y1="44" x2="250" y2="56" class="d-dim"/>
      <text x="225" y="66" text-anchor="middle" class="t-small t-dim">#6, #7</text>
      <circle cx="150" cy="50" r="5" class="f-b"/>
      <text x="150" y="34" text-anchor="middle" class="t-b">${L('B: 즉시 반응', 'B: moves now')}</text>
      <circle cx="400" cy="50" r="5" class="f-a"/>
      <text x="400" y="34" text-anchor="middle" class="t-a">${L('A: 여기서 반응', 'A: moves here')}</text>
      <path d="M152,170 L398,170" class="d-a" marker-start="url(#arrA)" marker-end="url(#arrA)"/>
      <text x="275" y="162" text-anchor="middle" class="t-small t-a">${L('RTT + 스냅샷 대기', 'RTT + snapshot wait')}</text>
      <text x="4" y="188" class="t-small t-dim">${L('B는 서버 상태로 되돌린 뒤 미확인 입력(#6, #7)을 다시 적용', 'B rewinds to the server state, then replays the unacked inputs (#6, #7)')}</text>
    </svg>`,
    look: [
      '오른쪽 "입력 vs 화면" 그래프에서 두 선을 비교하면, A는 화면 이동(주황)이 입력(회색 계단)보다 RTT만큼 늦게 시작하고 늦게 멈춤. B는 두 선이 거의 겹침.',
      '편도 지연을 300ms 이상으로 올리면 A는 조작이 "물에 잠긴" 듯 둔해짐. B는 지연과 관계없이 즉시 반응.',
      'B에서 "서버 재조정"을 끄면 스냅샷이 올 때마다 캐릭터가 과거 위치로 끌려가 덜컹거림 (다음 샘플 "서버 재조정" 참고)',
      '하단 타임라인에서 선의 방향을 보면 패킷 종류가 구분됨. 위→아래 회색 선은 입력, 아래→위 색 선은 스냅샷, 빨간 X는 손실 패킷.',
    ],
    refs: [
      { type: 'article', title: 'Fast-Paced Multiplayer (Part II): Client-Side Prediction and Server Reconciliation', url: 'https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html', note: 'Gabriel Gambetta. 이 샘플 구조의 출발점.' },
      { type: 'article', title: 'Fast-Paced Multiplayer (Part I): Client-Server Game Architecture', url: 'https://www.gabrielgambetta.com/client-server-game-architecture.html', note: 'Gabriel Gambetta. 권위 서버와 입력 지연 문제.' },
      { type: 'engine', title: 'Source Multiplayer Networking - Input prediction', url: 'https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking', note: 'Valve Developer Wiki.' },
      { type: 'paper', title: 'Latency Compensating Methods in Client/Server In-game Protocol Design and Optimization', url: 'https://developer.valvesoftware.com/wiki/Latency_Compensating_Methods_in_Client/Server_In-game_Protocol_Design_and_Optimization', year: 2001, note: 'Yahn Bernier (Valve). 클라이언트 예측과 랙 보상을 다룬 고전 문서.' },
      { type: 'talk', title: 'Overwatch Gameplay Architecture and Netcode', year: 2017, note: 'Tim Ford, GDC 2017. ECS 기반 예측/롤백.' },
    ],
    params: [
      { key: 'lat', label: '편도 지연 (ms)', type: 'int', min: 0, max: 500, default: 150, shared: true, group: '네트워크' },
      { key: 'jitter', label: '지터 (ms)', type: 'int', min: 0, max: 150, default: 20, shared: true },
      { key: 'loss', label: '패킷 손실률', type: 'range', min: 0, max: 0.3, step: 0.01, default: 0.03, shared: true },
      { key: 'sendHz', label: '스냅샷 전송률 (Hz)', type: 'int', min: 5, max: 60, default: 20, shared: true },
      { key: 'auto', label: '자동 입력', type: 'bool', default: true, shared: true, group: '장면', help: '키 입력이 없으면 스크립트로 이동' },
      { key: 'predict', label: '클라이언트 예측', type: 'bool', group: '기법', a: false, b: true },
      { key: 'reconcile', label: '서버 재조정', type: 'bool', default: true, when: (p) => p.predict, help: '서버 상태에 미확인 입력을 다시 적용' },
      { key: 'ghost', label: '서버 상태 고스트 표시', type: 'bool', default: true },
      { key: 'restart', label: '다시 시작', type: 'button' },
    ],
    en: {
      title: 'Client-side Prediction',
      summary: 'The client simulates its own input locally right away, without waiting for the server. Controls respond at once even with high latency. When server state arrives, the client applies its unacknowledged inputs again to match.',
      views: { a: 'No prediction (wait for server)', b: 'Prediction + reconciliation' },
      controls: 'Arrow keys / WASD to move (both views at once). Key input overrides auto input.',
      info: `
      <p><b>Client-side prediction</b> runs the same movement code on the client as on the server. Your input shows on screen right away.</p>
      <p>With an authoritative server, the client only sends input, and the server decides the position.
      Without prediction, the client waits for the whole round trip: <b>input reaches the server, the server processes it, and a snapshot comes back</b>.
      So the screen reacts late by the RTT (round-trip time) plus the snapshot wait.</p>
      <ul>
        <li>Each server snapshot holds the "last processed input number".</li>
        <li>The client resets to the server state, then applies the unacknowledged inputs again (<b>reconciliation</b>).</li>
        <li>If game logic is deterministic (same input gives the same result), the result matches the prediction. So you do not see the correction.</li>
        <li>Each input packet also carries the last 3 inputs. If some packets are lost, the server still gets every input.</li>
      </ul>
      <p>Downside: prediction without reconciliation pulls the position back into the past on every snapshot.</p>`,
      look: [
        'Compare the two lines in the "Input vs screen" graph on the right. In A, screen movement (orange) starts and stops later than input (gray steps) by the RTT. In B, the two lines almost overlap.',
        'Raise one-way latency to 300 ms or more. A feels sluggish, as if moving through water. B responds at once, whatever the latency.',
        'In B, turn off "Server reconciliation". The character jerks back to a past position on every snapshot (see the next sample, "Server reconciliation").',
        'In the timeline at the bottom, line direction shows the packet type. Gray lines going down are inputs, colored lines going up are snapshots, and red X marks are lost packets.',
      ],
      refs: [
        'Gabriel Gambetta. The starting point for this sample\'s design.',
        'Gabriel Gambetta. The authoritative server and the input lag problem.',
        'Valve Developer Wiki.',
        'Yahn Bernier (Valve). A classic paper on client prediction and lag compensation.',
        'Tim Ford, GDC 2017. ECS-based prediction and rollback.',
      ],
      params: {
        lat: { label: 'One-way latency (ms)', group: 'Network' },
        jitter: 'Jitter (ms)',
        loss: 'Packet loss rate',
        sendHz: 'Snapshot send rate (Hz)',
        auto: { label: 'Auto input', group: 'Scene', help: 'Moves by script when there is no key input' },
        predict: { label: 'Client-side prediction', group: 'Technique' },
        reconcile: { label: 'Server reconciliation', help: 'Apply unacknowledged inputs again on top of server state' },
        ghost: 'Show server state ghost',
        restart: 'Restart',
      },
    },

    setup(ctx) {
      const P = ctx.params;
      const WW = 400, WH = 260, SPEED = 170, R = 10;
      let st;
      const move = (s, m, dt) => {
        const l = Math.hypot(m.x, m.y) || 1;
        s.x = U.clamp(s.x + (m.x / l) * SPEED * dt, R, WW - R);
        s.y = U.clamp(s.y + (m.y / l) * SPEED * dt, R, WH - R);
      };
      function init() {
        ctx.rng = U.rng(ctx.seed);
        const ls = ctx.rng.int(1, 1e9);
        st = {
          now: 0, tick: 0, acc: 0, sendAcc: 0,
          up: new Link(ls, 1), down: new Link(ls, 2),
          server: { x: WW / 2, y: WH / 2, lastSeq: -1 },
          sv: { x: WW / 2, y: WH / 2, seq: -1, t: -1 },      // 클라가 받은 최신 서버 상태
          pred: { x: WW / 2, y: WH / 2 },                    // 예측 상태
          pending: [], recent: [], seq: 0,
          disp: { x: WW / 2, y: WH / 2 }, prevDisp: { x: WW / 2, y: WH / 2 },
          trail: [], hist: [], lastMove: { x: 0, y: 0 }, meas: null, vxs: 0, lags: [], snapsRecv: 0,
        };
      }
      init();

      function tick() {
        st.now += STEP; st.tick++;
        const dt = STEP / 1000;
        const net = { lat: P.lat, jit: P.jitter, loss: P.loss };
        const m = getMove(ctx, st.now);

        // 1) 클라이언트: 입력 생성, 전송 (최근 3개 중복 전송)
        const cmd = { seq: st.seq++, x: m.x, y: m.y };
        st.recent.push(cmd); if (st.recent.length > 3) st.recent.shift();
        st.up.send(st.now, st.tick, st.recent.slice(), net, 28 + 3 * 4);
        if (P.predict) { move(st.pred, m, dt); st.pending.push(cmd); }

        // 2) 서버: 도착한 입력을 순서대로 한 번씩 적용
        for (const p of st.up.poll(st.now)) {
          for (const c of p.data) if (c.seq > st.server.lastSeq) { move(st.server, c, dt); st.server.lastSeq = c.seq; }
        }
        // 3) 서버: 스냅샷 전송
        const iv = 1000 / P.sendHz;
        st.sendAcc += STEP;
        if (st.sendAcc >= iv) {
          st.sendAcc = Math.min(st.sendAcc - iv, iv);
          st.down.send(st.now, st.tick, { x: st.server.x, y: st.server.y, seq: st.server.lastSeq, t: st.now }, net, 28 + 12);
        }
        // 4) 클라이언트: 스냅샷 수신
        for (const p of st.down.poll(st.now)) {
          const s = p.data;
          if (s.t <= st.sv.t) continue; // 순서 뒤바뀐 오래된 스냅샷 무시
          st.sv = { ...s }; st.snapsRecv++;
          st.pending = st.pending.filter((c) => c.seq > s.seq);
          if (P.predict) {
            st.pred.x = s.x; st.pred.y = s.y;
            if (P.reconcile) for (const c of st.pending) move(st.pred, c, dt);
          }
        }
        if (!P.predict) { st.pred.x = st.sv.x; st.pred.y = st.sv.y; st.pending.length = 0; }

        // 표시 위치
        st.prevDisp = { ...st.disp };
        st.disp = P.predict ? { ...st.pred } : { x: st.sv.x, y: st.sv.y };
        st.trail.push({ ...st.disp }); if (st.trail.length > 50) st.trail.shift();
        const maxStep = SPEED * dt;
        st.vxs = U.lerp(st.vxs, (st.disp.x - st.prevDisp.x) / maxStep, 0.3); // 스냅샷 단위 점프를 약간 평활
        st.hist.push({ ix: m.x, vx: st.vxs });
        if (st.hist.length > 150) st.hist.shift();

        // 입력 → 화면 반응 지연 측정
        const lm = st.lastMove;
        if ((m.x || m.y) && (m.x !== lm.x || m.y !== lm.y)) {
          const l = Math.hypot(m.x, m.y);
          st.meas = { t: st.now - STEP, dx: m.x / l, dy: m.y / l, x: st.prevDisp.x, y: st.prevDisp.y };
        }
        st.lastMove = { x: m.x, y: m.y };
        if (st.meas) {
          const me = st.meas;
          const d = (st.disp.x - me.x) * me.dx + (st.disp.y - me.y) * me.dy;
          if (d > 1.5) { st.lags.push(st.now - me.t); if (st.lags.length > 10) st.lags.shift(); st.meas = null; }
          else if (st.now - me.t > 3000) st.meas = null;
        }
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

          // 서버
          panel(g, p0, GTL.L('서버 (권위 상태)', 'Server (authoritative)'), C.good);
          let m = fit(p0, WW, WH);
          D.rect(g, m.ox, m.oy, m.w, m.h, null, 'rgba(255,255,255,0.15)');
          D.grid(g, m.w, m.h, 40 * m.s, C.grid, m.ox, m.oy);
          D.circle(g, m.X(st.server.x), m.Y(st.server.y), R * m.s, C.good);
          D.text(g, GTL.L(`처리한 입력 #${st.server.lastSeq}`, `Processed input #${st.server.lastSeq}`), p0.x + 6, p0.y + p0.h - 16, { size: 10, color: C.dim });

          // 클라이언트
          panel(g, p1, GTL.L('로컬 클라이언트 화면', 'Local client view'), col);
          m = fit(p1, WW, WH);
          D.rect(g, m.ox, m.oy, m.w, m.h, null, 'rgba(255,255,255,0.15)');
          D.grid(g, m.w, m.h, 40 * m.s, C.grid, m.ox, m.oy);
          for (let i = 0; i < st.trail.length; i++) {
            D.circle(g, m.X(st.trail[i].x), m.Y(st.trail[i].y), 2, `rgba(255,255,255,${(i / st.trail.length) * 0.3})`);
          }
          if (P.ghost) D.circle(g, m.X(st.sv.x), m.Y(st.sv.y), R * m.s, null, C.good, 1.5);
          const px = m.X(st.disp.x), py = m.Y(st.disp.y);
          D.circle(g, px, py, R * m.s, col);
          const lm = st.lastMove;
          if (lm.x || lm.y) {
            const l = Math.hypot(lm.x, lm.y);
            D.arrow(g, px, py, px + (lm.x / l) * 26, py + (lm.y / l) * 26, C.warn, 2);
          }
          D.text(g, GTL.L(`미확인 입력 ${st.pending.length}개`, `Unacked inputs: ${st.pending.length}`), p1.x + 6, p1.y + p1.h - 16, { size: 10, color: C.dim });

          // 입력 vs 화면 그래프
          panel(g, p2, GTL.L('입력 vs 화면 이동 (x축)', 'Input vs screen motion (x)'), C.dim);
          const gx = p2.x + 6, gy = p2.y + 24, gw = p2.w - 12, gh = Math.max(20, p2.h - 46);
          D.rect(g, gx, gy, gw, gh, 'rgba(0,0,0,0.3)');
          D.line(g, gx, gy + gh / 2, gx + gw, gy + gh / 2, 'rgba(255,255,255,0.1)');
          const ix = st.hist.map((h) => h.ix), vx = st.hist.map((h) => U.clamp(h.vx, -1.5, 1.5));
          D.plot(g, ix, gx, gy + 4, gw, gh - 8, { min: -1.6, max: 1.6, color: 'rgba(255,255,255,0.45)', background: false, lineWidth: 2 });
          D.plot(g, vx, gx, gy + 4, gw, gh - 8, { min: -1.6, max: 1.6, color: col, background: false });
          D.text(g, GTL.L('━ 입력', '━ Input'), gx + 4, gy + 3, { size: 10, color: 'rgba(255,255,255,0.6)' });
          D.text(g, GTL.L('━ 화면 속도', '━ Screen speed'), gx + 52, gy + 3, { size: 10, color: col });
          D.text(g, GTL.L('2.5초 →현재', '2.5 s → now'), gx + gw - 4, p2.y + p2.h - 16, { size: 10, color: C.dim, align: 'right' });

          drawTimeline(g, L.tl, st.now, 2000, [
            { link: st.up, dir: 1, color: 'rgba(200,200,200,0.9)', lw: 1, dot: 2 },
            { link: st.down, dir: -1, color: col, lw: 1.5, dot: 3.5 },
          ], [GTL.L('클라', 'Client'), GTL.L('서버', 'Server')]);

          const avg = st.lags.length ? st.lags.reduce((a, b) => a + b, 0) / st.lags.length : null;
          ctx.stat(GTL.L('입력→화면 반응', 'Input to screen'), avg === null ? '-' : avg.toFixed(0) + ' ms');
          ctx.stat(GTL.L('RTT(지연×2)', 'RTT (latency×2)'), P.lat * 2 + ' ms');
          ctx.stat(GTL.L('미확인 입력', 'Unacked inputs'), st.pending.length);
          ctx.stat(GTL.L('손실(입력/스냅샷)', 'Lost (input/snapshot)'), `${st.up.lost} / ${st.down.lost}`);
        },
        onAction(key) { if (key === 'restart') init(); },
      };
    },
  });
})();
