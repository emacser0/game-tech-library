// 신뢰성 계층: UDP 위 ack 비트필드 + 재전송 vs 신뢰성 없음
// 패킷 지연/손실은 (시드, 채널, 보낸 틱) 해시로 정해짐. A와 B는 같은 패킷이 손실됨.
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


  const MAX_MSG_PER_PACKET = 8;

  GTL.register({
    id: 'reliability-ack',
    title: '신뢰성 계층 (Ack 비트필드 + 재전송)',
    summary: 'UDP 패킷마다 순번과 "최근 받은 32개 패킷" 비트필드를 실어 보냄. 보내는 쪽은 확인되지 않은 메시지만 다시 보냄. 손실이 있어도 중요한 메시지가 모두 도착.',
    views: { a: '신뢰성 없음', b: 'Ack 비트필드 + 재전송' },
    controls: 'Space: 메시지 1개 추가 (두 뷰 동시)',
    info: `
      <p><b>신뢰성 계층</b>: UDP 위에 직접 만드는 "필요한 메시지만 확실히 보내는" 층. 위치 같은 상태는 그대로 비신뢰 전송, 아이템 사용 같은 사건만 신뢰 전송.</p>
      <p>왜 TCP를 쓰지 않는가: TCP는 패킷 하나가 손실되면 뒤의 모든 데이터가 재전송을 기다림(Head-of-line blocking). 실시간 게임에는 지연이 너무 커짐.</p>
      <ul>
        <li>양쪽 모두 일정한 주기로 패킷을 보냄. 헤더는 <code>seq</code>(내 순번), <code>ack</code>(받은 가장 최근 순번), <code>ack_bits</code>(그 이전 32개를 받았는지 비트).</li>
        <li>ack 정보가 매 패킷마다 중복으로 실림. 응답 패킷 몇 개가 손실돼도 확인 정보는 거의 잃지 않음.</li>
        <li>보내는 쪽은 패킷 순번별로 어떤 메시지를 담았는지 기억. 그 패킷이 확인되면 메시지도 확인됨.</li>
        <li>확인되지 않은 메시지는 재전송 대기 시간이 지나면 다음 패킷에 다시 실음</li>
        <li>순서 보장을 켜면 받는 쪽이 빠진 번호를 기다렸다가 순서대로 넘김</li>
      </ul>
      <p>단점: 헤더가 패킷마다 6바이트 늘어남. 재전송된 메시지는 RTT 이상 늦게 도착. 순서 보장은 앞 메시지가 늦으면 뒤 메시지까지 늦춤.</p>`,
    diagram: (L) => `<svg viewBox="0 0 540 178" xmlns="http://www.w3.org/2000/svg">
      <defs><marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
      <text x="4" y="14" class="t-small t-dim">${L('받는 쪽이 보내는 패킷 헤더', 'Packet header from the receiver')}</text>
      <rect x="4" y="22" width="72" height="24" class="f-dim"/><text x="40" y="38" text-anchor="middle" class="t-small t-mono">seq 205</text>
      <rect x="80" y="22" width="72" height="24" class="f-dim"/><text x="116" y="38" text-anchor="middle" class="t-small t-mono">ack 104</text>
      ${[1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((b, i) => `<rect x="${160 + i * 15}" y="22" width="14" height="24" class="${b ? 'f-dim' : 'f-bad'}"/><text x="${167 + i * 15}" y="38" text-anchor="middle" class="t-small t-mono">${b}</text>`).join('')}
      <text x="402" y="38" class="t-small t-mono">... ack_bits (32)</text>
      <text x="167" y="58" text-anchor="middle" class="t-small t-mono t-dim">103</text>
      <text x="197" y="58" text-anchor="middle" class="t-small t-mono">101</text>
      <text x="272" y="58" text-anchor="middle" class="t-small t-mono t-dim">96</text>
      <text x="4" y="94" class="t-small t-dim">${L('보내는 쪽', 'Sender')}</text>
      ${[99, 100, 101, 102, 103, 104, 105, 106, 107].map((n, i) => `<rect x="${60 + i * 52}" y="100" width="48" height="22" class="${n === 107 ? 'f-b' : 'f-dim'}"/>${n === 101 ? `<rect x="${60 + i * 52}" y="100" width="48" height="22" class="d-bad"/>` : ''}<text x="${84 + i * 52}" y="115" text-anchor="middle" class="t-small t-mono">${n}${n === 101 || n === 107 ? ' M' : ''}</text>`).join('')}
      <path d="M190,98 C250,76 440,76 476,98" class="d-b" marker-end="url(#arrB)"/>
      <text x="330" y="74" text-anchor="middle" class="t-small t-b">${L('101 비트가 0, 대기 후 M을 다시 실음', 'bit for 101 is 0: M rides again after a timeout')}</text>
      <text x="4" y="148" class="t-small t-a">${L('A: 재전송 없음. 101과 함께 메시지 M이 영구히 사라짐', 'A: no resend. Message M is gone for good with packet 101')}</text>
      <text x="4" y="164" class="t-small t-b">${L('B: ack가 매 패킷에 중복으로 실려 응답 몇 개를 잃어도 확인 정보가 남음', 'B: every packet repeats the acks, so a few lost replies still leave the ack info')}</text>
    </svg>`,
    look: [
      '가운데 "받는 쪽" 격자를 비교하면, A에는 빨간 칸(영영 도착하지 않은 메시지)이 손실률만큼 생김. B는 모두 채워짐.',
      'B의 "평균 전달 지연"이 A보다 큼. 재전송된 메시지가 평균을 올림.',
      'B에서 "순서 보장"을 켜고 손실률을 0.3으로 올리면 노란 칸(앞 번호를 기다리는 메시지)이 늘고 전달 지연이 커짐',
      'B의 재전송 대기 시간을 RTT보다 짧게(30ms) 줄이면 "중복 수신"이 크게 늘어남. 확인이 오기 전에 다시 보내기 때문임.',
      '오른쪽 비트필드에서 빈 칸은 받는 쪽이 받지 못한 패킷 순번. 그 패킷에 실린 메시지가 재전송 대상이 됨.',
    ],
    refs: [
      { type: 'article', title: 'Reliability and Congestion Avoidance over UDP', url: 'https://gafferongames.com/post/reliability_ordering_and_congestion_avoidance_over_udp/', note: 'Glenn Fiedler. seq, ack, 32비트 ack_bits 헤더 구조의 출처.' },
      { type: 'article', title: 'Reliable Ordered Messages', url: 'https://gafferongames.com/post/reliable_ordered_messages/', note: 'Glenn Fiedler. 패킷 ack를 메시지 ack로 바꾸고 재전송하는 방법.' },
      { type: 'code', title: 'reliable (networkprotocol)', url: 'https://github.com/networkprotocol/reliable', note: 'Glenn Fiedler의 C 구현. 같은 ack 비트필드 방식.' },
      { type: 'talk', title: 'The TRIBES Engine Networking Model', year: 1999, note: 'Mark Frohnmayer, Tim Gift. 전송 보장 수준을 데이터 종류별로 나눈 고전 설계.' },
    ],
    params: [
      { key: 'lat', label: '편도 지연 (ms)', type: 'int', min: 0, max: 300, default: 80, shared: true, group: '네트워크' },
      { key: 'jitter', label: '지터 (ms)', type: 'int', min: 0, max: 150, default: 30, shared: true },
      { key: 'loss', label: '패킷 손실률', type: 'range', min: 0, max: 0.5, step: 0.01, default: 0.2, shared: true },
      { key: 'sendHz', label: '패킷 전송률 (Hz)', type: 'int', min: 5, max: 60, default: 30, shared: true },
      { key: 'auto', label: '자동 입력', type: 'bool', default: true, shared: true, group: '장면', help: '스크립트로 메시지를 계속 만듦 (아이템 사용, 채팅 같은 사건)' },
      { key: 'msgHz', label: '메시지 생성률 (개/초)', type: 'int', min: 1, max: 30, default: 8, shared: true, when: (p) => p.auto },
      { key: 'reliable', label: 'Ack + 재전송', type: 'bool', group: '기법', a: false, b: true },
      { key: 'resend', label: '재전송 대기 (ms)', type: 'int', min: 20, max: 600, default: 250, when: (p) => p.reliable, help: '확인이 없으면 이 시간 뒤 다시 보냄. RTT보다 조금 길게' },
      { key: 'ordered', label: '순서 보장', type: 'bool', default: false, when: (p) => p.reliable },
      { key: 'restart', label: '다시 시작', type: 'button' },
    ],
    en: {
      title: 'Reliability Layer (Ack Bitfield + Resend)',
      summary: 'Each UDP packet carries a sequence number and a bitfield of "the last 32 packets received". The sender resends only messages that are not acked yet. Even with loss, every important message arrives.',
      views: { a: 'No reliability', b: 'Ack bitfield + resend' },
      controls: 'Space: add 1 message (both views)',
      info: `
      <p>A <b>reliability layer</b> is a layer you build on top of UDP that "delivers only the messages that need it, for sure". State such as position still goes unreliable. Only events such as item use go reliable.</p>
      <p>Why not use TCP: when TCP loses one packet, all later data waits for the resend (head-of-line blocking). For real-time games, the delay gets too large.</p>
      <ul>
        <li>Both sides send packets at a steady rate. The header holds <code>seq</code> (my sequence number), <code>ack</code> (the latest sequence number received), and <code>ack_bits</code> (bits for whether the 32 before it arrived).</li>
        <li>Every packet repeats the ack info. Even if a few reply packets are lost, almost no ack info is lost.</li>
        <li>The sender remembers which messages went in each packet sequence number. When that packet is acked, its messages are acked too.</li>
        <li>A message that is not acked goes into the next packet again after the resend wait time.</li>
        <li>With ordering on, the receiver waits for missing numbers and passes messages on in order.</li>
      </ul>
      <p>Downside: the header grows by 6 bytes per packet. A resent message arrives at least one RTT late. Ordering also delays later messages when an earlier one is late.</p>`,
      look: [
        'Compare the "Receiver" grids in the middle. A gets red cells (messages that never arrive) in proportion to the loss rate. B fills every cell.',
        'B\'s "Avg delivery delay" is larger than A\'s. Resent messages raise the average.',
        'In B, turn on "Ordered" and raise packet loss to 0.3. Yellow cells (messages waiting for an earlier number) increase, and delivery delay grows.',
        'Reduce B\'s resend wait below the RTT (30ms). "Duplicates" rise sharply, because the sender resends before the ack comes back.',
        'In the bitfield on the right, an empty cell is a packet number the receiver did not get. Messages in that packet become resend targets.',
      ],
      refs: [
        'Glenn Fiedler. The source of the seq, ack, and 32-bit ack_bits header layout.',
        'Glenn Fiedler. How to turn packet acks into message acks and resend.',
        'Glenn Fiedler\'s C implementation. Uses the same ack bitfield method.',
        'Mark Frohnmayer, Tim Gift. A classic design that sets delivery guarantees per data type.',
      ],
      params: {
        lat: { label: 'One-way latency (ms)', group: 'Network' },
        jitter: 'Jitter (ms)',
        loss: 'Packet loss rate',
        sendHz: 'Packet send rate (Hz)',
        auto: { label: 'Auto input', group: 'Scene', help: 'A script keeps creating messages (events such as item use or chat)' },
        msgHz: 'Message rate (per second)',
        reliable: { label: 'Ack + resend', group: 'Technique' },
        resend: { label: 'Resend wait (ms)', help: 'Resend after this time if no ack arrives. Set it a little longer than the RTT' },
        ordered: 'Ordered',
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
          now: 0, tick: 0, acc: 0, sAcc: 0, rAcc: 0, mAcc: 0,
          up: new Link(ls, 1), down: new Link(ls, 2),
          msgs: [],            // { id, t, lastSend, sends, acked, delivered, dt }
          sendSeq: 0, sent: new Map(), // 패킷 seq → { t, ids }
          // 받는 쪽
          rSeq: 0, rRecent: -1, rGot: new Set(), rBuf: new Set(), nextId: 0,
          // 보내는 쪽이 마지막으로 받은 ack 헤더
          lastAck: null, scan: 0, resends: 0, dups: 0, rtt: null,
        };
      }
      init();

      function addMsg() { st.msgs.push({ id: st.msgs.length, t: st.now, lastSend: -1, sends: 0, acked: false, delivered: false, buffered: false, dt: 0 }); }
      function deliver(m) { if (m.delivered) return; m.delivered = true; m.buffered = false; m.dt = st.now - m.t; }

      function tick() {
        st.now += STEP; st.tick++;
        const net = { lat: P.lat, jit: P.jitter, loss: P.loss };
        if (P.auto) {
          st.mAcc += STEP;
          const iv = 1000 / P.msgHz;
          while (st.mAcc >= iv) { st.mAcc -= iv; addMsg(); }
        }
        const iv = 1000 / P.sendHz;
        // 보내는 쪽 → 받는 쪽
        st.sAcc += STEP;
        if (st.sAcc >= iv) {
          st.sAcc = Math.min(st.sAcc - iv, iv);
          const ids = [];
          // 더 볼 필요 없는 앞쪽 메시지는 건너뜀
          while (st.scan < st.msgs.length && (st.msgs[st.scan].acked || (!P.reliable && st.msgs[st.scan].sends))) st.scan++;
          for (let i = st.scan; i < st.msgs.length; i++) {
            const m = st.msgs[i];
            if (ids.length >= MAX_MSG_PER_PACKET) break;
            if (m.acked) continue;
            if (!P.reliable) { if (m.sends === 0) ids.push(m.id); continue; }
            if (m.sends === 0 || st.now - m.lastSend >= P.resend) ids.push(m.id);
          }
          for (const id of ids) { const m = st.msgs[id]; if (m.sends > 0) st.resends++; m.sends++; m.lastSend = st.now; }
          const seq = st.sendSeq++;
          st.sent.set(seq, { t: st.now, ids });
          const hdr = P.reliable ? 8 : 2;
          st.up.send(st.now, st.tick, { seq, ids }, net, 28 + hdr + ids.length * 4);
        }
        // 받는 쪽: 패킷 수신, 메시지 전달
        for (const p of st.up.poll(st.now)) {
          const { seq, ids } = p.data;
          st.rGot.add(seq);
          if (seq > st.rRecent) st.rRecent = seq;
          for (const id of ids) {
            const m = st.msgs[id];
            if (m.delivered || m.buffered) { st.dups++; continue; }
            if (!P.reliable || !P.ordered) deliver(m);
            else { m.buffered = true; st.rBuf.add(id); }
          }
          if (P.reliable && P.ordered) {
            while (st.rBuf.has(st.nextId)) { st.rBuf.delete(st.nextId); deliver(st.msgs[st.nextId]); st.nextId++; }
          } else {
            while (st.nextId < st.msgs.length && st.msgs[st.nextId].delivered) st.nextId++;
          }
        }
        for (const s of st.rGot) if (s < st.rRecent - 40) st.rGot.delete(s);
        // 받는 쪽 → 보내는 쪽: ack 헤더
        st.rAcc += STEP;
        if (st.rAcc >= iv) {
          st.rAcc = Math.min(st.rAcc - iv, iv);
          let bits = 0;
          for (let i = 0; i < 32; i++) if (st.rGot.has(st.rRecent - 1 - i)) bits |= 1 << i;
          st.down.send(st.now, st.tick, { seq: st.rSeq++, ack: st.rRecent, bits: bits >>> 0 }, net, 28 + 8);
        }
        // 보내는 쪽: ack 처리
        for (const p of st.down.poll(st.now)) {
          const h = p.data;
          if (!P.reliable || h.ack < 0) continue;
          if (!st.lastAck || h.seq > st.lastAck.seq) st.lastAck = h;
          const ackOne = (s) => {
            const e = st.sent.get(s);
            if (!e) return;
            if (s === h.ack) st.rtt = st.rtt === null ? st.now - e.t : U.lerp(st.rtt, st.now - e.t, 0.1);
            for (const id of e.ids) st.msgs[id].acked = true;
            st.sent.delete(s);
          };
          ackOne(h.ack);
          for (let i = 0; i < 32; i++) if ((h.bits >>> i) & 1) ackOne(h.ack - 1 - i);
        }
        for (const s of st.sent.keys()) if (s < st.sendSeq - 64) st.sent.delete(s);
      }

      function cellGrid(g, r, title, col, colorOf) {
        panel(g, r, title, col);
        const n = st.msgs.length, cols = 16, rows = Math.max(1, Math.min(8, Math.floor((r.h - 40) / 14)));
        const cap = cols * rows, first = Math.max(0, Math.ceil((n - cap) / cols) * cols);
        const cw = (r.w - 12) / cols, ch = Math.min(14, (r.h - 40) / rows);
        for (let k = 0; k < cap; k++) {
          const id = first + k, x = r.x + 6 + (k % cols) * cw, y = r.y + 22 + Math.floor(k / cols) * ch;
          const c = id < n ? colorOf(st.msgs[id]) : 'rgba(255,255,255,0.03)';
          D.rect(g, x + 1, y + 1, cw - 2, ch - 2, c);
        }
        return r.y + 22 + rows * ch + 4;
      }

      return {
        update(dt) {
          if (ctx.input.pressed('Space')) addMsg();
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
          const old = (m) => st.now - m.t > 1000;

          let y = cellGrid(g, p0, GTL.L('보내는 쪽: 메시지 큐', 'Sender: message queue'), C.dim, (m) => {
            if (!P.reliable) return m.sends ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)';
            if (m.acked) return 'rgba(102,209,122,0.75)';
            if (m.sends > 1) return C.warn;
            return m.sends ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)';
          });
          const legend = P.reliable ? [GTL.L('회색: 보냄, 확인 대기', 'Gray: sent, waiting for ack'), GTL.L('노랑: 재전송', 'Yellow: resent'), GTL.L('초록: 확인됨(ack)', 'Green: acked')] : [GTL.L('회색: 한 번 보냄', 'Gray: sent once'), GTL.L('확인 정보 없음', 'No ack info')];
          legend.forEach((s, i) => D.text(g, s, p0.x + 6, y + i * 13, { size: 10, color: C.dim }));

          y = cellGrid(g, p1, GTL.L('받는 쪽: 앱에 전달된 메시지', 'Receiver: messages passed to the app'), col, (m) => {
            if (m.delivered) return col;
            if (m.buffered) return C.warn;
            return old(m) ? C.bad : 'rgba(255,255,255,0.08)';
          });
          [GTL.L('색: 전달됨', 'Color: delivered'), GTL.L('노랑: 순서 대기', 'Yellow: waiting for order'), GTL.L('빨강: 1초 넘게 미도착', 'Red: missing over 1 s')].forEach((s, i) => D.text(g, s, p1.x + 6, y + i * 13, { size: 10, color: C.dim }));

          panel(g, p2, GTL.L('보내는 쪽이 받은 최신 ack 헤더', 'Latest ack header at the sender'), C.dim);
          if (!P.reliable) D.text(g, GTL.L('ack 헤더 없음', 'No ack header'), p2.x + 8, p2.y + 26, { size: 12, color: C.dim });
          else if (st.lastAck) {
            const h = st.lastAck;
            D.text(g, `ack = ${h.ack}`, p2.x + 8, p2.y + 24, { size: 12, color: C.text });
            const bw = Math.max(3, (p2.w - 16) / 16);
            for (let i = 0; i < 32; i++) {
              const x = p2.x + 8 + (i % 16) * bw, yy = p2.y + 44 + Math.floor(i / 16) * (bw + 4);
              const on = (h.bits >>> i) & 1;
              D.rect(g, x + 1, yy, bw - 2, bw, on ? 'rgba(102,209,122,0.75)' : C.bad);
            }
            D.text(g, GTL.L(`비트 i = 패킷 ${h.ack}-1-i 받음`, `Bit i = got packet ${h.ack}-1-i`), p2.x + 8, p2.y + 52 + 2 * (bw + 4), { size: 10, color: C.dim });
            D.text(g, GTL.L(`RTT 추정 ${st.rtt === null ? '-' : st.rtt.toFixed(0) + ' ms'}`, `RTT estimate ${st.rtt === null ? '-' : st.rtt.toFixed(0) + ' ms'}`), p2.x + 8, p2.y + 66 + 2 * (bw + 4), { size: 10, color: C.dim });
          }

          drawTimeline(g, L.tl, st.now, 1500, [
            { link: st.up, dir: 1, color: col, lw: 1.3, dot: 3 },
            { link: st.down, dir: -1, color: 'rgba(200,200,200,0.8)', lw: 1, dot: 2 },
          ], [GTL.L('보냄', 'Send'), GTL.L('받음', 'Recv')]);

          const settled = st.msgs.slice(-400).filter(old);
          const dl = settled.filter((m) => m.delivered);
          const avg = dl.length ? dl.reduce((a, m) => a + m.dt, 0) / dl.length : 0;
          ctx.stat(GTL.L('전달률 (최근 1초 지난 메시지)', 'Delivery rate (messages older than 1 s)'), settled.length ? ((dl.length / settled.length) * 100).toFixed(1) + ' %' : '-');
          ctx.stat(GTL.L('미도착 메시지', 'Missing messages'), settled.length - dl.length);
          ctx.stat(GTL.L('평균 전달 지연', 'Avg delivery delay'), avg.toFixed(0) + ' ms');
          ctx.stat(GTL.L('재전송 / 중복 수신', 'Resends / duplicates'), `${st.resends} / ${st.dups}`);
          ctx.stat(GTL.L('헤더 크기', 'Header size'), (P.reliable ? 8 : 2) + ' B');
        },
        onAction(key) { if (key === 'restart') init(); },
      };
    },
  });
})();
