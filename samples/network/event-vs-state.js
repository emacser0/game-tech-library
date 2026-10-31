// 이벤트 복제 vs 상태 복제: 패킷 손실 시 문 상태가 어긋나는지 비교
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


  GTL.register({
    id: 'event-vs-state',
    title: '이벤트 복제 vs 상태 복제',
    summary: '"문 3이 토글됨" 같은 이벤트를 한 번만 보내면 패킷 하나가 손실될 때 클라이언트의 문이 영영 어긋남. 문 상태 자체를 매 스냅샷에 담으면 다음 스냅샷에서 저절로 맞춰짐.',
    views: { a: '토글 이벤트', b: '상태 복제' },
    controls: '←↑→↓ / WASD: 캐릭터 이동. 발판을 밟으면 위쪽 문이 열리고 닫힘',
    info: `
      <p>서버의 변화를 클라이언트에 알리는 방법은 두 가지</p>
      <ul>
        <li><b>이벤트 복제</b>: 일어난 일을 보냄. 예: "문 3 토글". 패킷이 작고 변화가 드물 때 효율적임.</li>
        <li><b>상태 복제</b>: 현재 값을 보냄. 예: "문 열림 비트 001010". 매번 같은 값을 다시 보냄.</li>
      </ul>
      <p>왜 중요한가: 게임 패킷은 대개 UDP로 보내서 손실될 수 있음.
      손실된 이벤트는 다시 오지 않음. 토글 이벤트라면 이후 토글도 계속 반대로 적용되어 <b>영구히 어긋남</b>.
      상태 복제는 최신 값이 계속 오므로 손실이 생겨도 다음 스냅샷에서 회복됨(<b>최종 일관성</b>).</p>
      <ul>
        <li><b>절대값 이벤트</b>("문 3 = 열림")는 같은 문의 다음 이벤트가 오면 회복됨. 하지만 순서가 뒤바뀌면 틀린 값이 남음.</li>
        <li>Unreal의 프로퍼티 복제, Source의 네트워크 변수는 상태 복제. 일회성 효과(소리, 파티클)만 이벤트(RPC)로 보냄.</li>
        <li>늦게 접속한 클라이언트도 상태 복제라면 현재 상태를 바로 받음</li>
      </ul>
      <p>단점: 상태 복제는 바뀌지 않은 값도 반복해서 보냄. 오브젝트가 많으면 델타 압축이나 관심 영역 관리 필요.</p>`,
    diagram: (L) => {
      const sx = [120, 180, 240, 300, 360];
      const lane = (y0, labels) => sx.map((x, i) => {
        const y1 = y0 + 40;
        const head = `<text x="${x}" y="${y0 - 6}" text-anchor="middle" class="t-small t-mono t-dim">${labels[i]}</text>`;
        if (i === 1) return head + `<line x1="${x}" y1="${y0}" x2="${x + 17}" y2="${y0 + 20}" class="d-bad"/><path d="M${x + 13},${y0 + 16} L${x + 21},${y0 + 24} M${x + 21},${y0 + 16} L${x + 13},${y0 + 24}" class="d-bad"/>`;
        return head + `<line x1="${x}" y1="${y0}" x2="${x + 35}" y2="${y1}" class="d-line"/><circle cx="${x + 35}" cy="${y1}" r="3" class="f-dim"/>`;
      }).join('');
      return `<svg viewBox="0 0 540 172" xmlns="http://www.w3.org/2000/svg">
      <text x="4" y="48" class="t-a">${L('A: 이벤트', 'A: event')}</text>
      <text x="4" y="134" class="t-b">${L('B: 상태', 'B: state')}</text>
      ${[[26, 66], [112, 152]].map(([a, b]) => `<line x1="110" y1="${a}" x2="410" y2="${a}" class="d-dim"/><line x1="110" y1="${b}" x2="410" y2="${b}" class="d-dim"/><text x="104" y="${a + 4}" text-anchor="end" class="t-small t-dim">${L('서버', 'Server')}</text><text x="104" y="${b + 4}" text-anchor="end" class="t-small t-dim">${L('클라', 'Client')}</text>`).join('')}
      ${lane(26, ['-', L('토글 문3', 'toggle door 3'), '-', '-', '-'])}
      ${lane(112, ['000000', '001000', '001000', '001000', '001000'])}
      <text x="422" y="70" class="t-a">${L('문3: 닫힘', 'Door 3: closed')}</text>
      <text x="422" y="84" class="t-small t-dim">${L('영구히 어긋남', 'stuck wrong')}</text>
      <text x="422" y="156" class="t-b">${L('문3: 열림', 'Door 3: open')}</text>
      <text x="422" y="170" class="t-small t-dim">${L('다음 패킷에서 회복', 'recovers next packet')}</text>
    </svg>`;
    },
    look: [
      '자동 입력으로 몇 초 지켜보면, A의 클라이언트 화면에 빨간 테두리(서버와 어긋난 문)가 하나씩 늘어나고 사라지지 않음. B는 잠깐 어긋나도 다음 스냅샷(50ms 뒤)에서 회복됨.',
      'A의 복제 방식을 "절대값 이벤트"로 바꾸면 어긋난 문이 다음 토글 때 회복됨. 지터를 크게 올리면 순서 뒤바뀜 때문에 다시 어긋남이 생김.',
      '손실률을 0으로 낮추면 A도 어긋나지 않음. 손실이 없을 때만 이벤트 방식이 안전함.',
      '"초당 전송량"을 비교하면 B가 조금 더 많음. 바뀌지 않은 문 비트도 매번 보내기 때문임. 문 개수를 늘리면 차이가 커짐.',
    ],
    refs: [
      { type: 'article', title: 'State Synchronization', url: 'https://gafferongames.com/post/state_synchronization/', note: 'Glenn Fiedler. 상태를 반복 전송해 손실에 강한 동기화.' },
      { type: 'engine', title: 'Unreal Engine - Networking Overview (Property Replication, RPCs)', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/networking-overview-for-unreal-engine', note: '지속 상태는 프로퍼티 복제, 일회성 사건은 Unreliable RPC로 보내라는 권장' },
      { type: 'engine', title: 'Source Multiplayer Networking', url: 'https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking', note: 'Valve. 엔티티 상태를 스냅샷으로 반복 전송.' },
      { type: 'talk', title: 'I Shot You First: Networking the Gameplay of Halo: Reach', year: 2011, note: 'David Aldridge, GDC 2011. state data와 event(신뢰/비신뢰) 구분.' },
    ],
    params: [
      { key: 'lat', label: '편도 지연 (ms)', type: 'int', min: 0, max: 300, default: 60, shared: true, group: '네트워크' },
      { key: 'jitter', label: '지터 (ms)', type: 'int', min: 0, max: 200, default: 20, shared: true },
      { key: 'loss', label: '패킷 손실률', type: 'range', min: 0, max: 0.4, step: 0.01, default: 0.15, shared: true },
      { key: 'sendHz', label: '스냅샷 전송률 (Hz)', type: 'int', min: 5, max: 60, default: 20, shared: true },
      { key: 'doors', label: '문 개수', type: 'int', min: 3, max: 10, default: 6, shared: true, reset: true, group: '장면' },
      { key: 'auto', label: '자동 입력', type: 'bool', default: true, shared: true, help: '키 입력이 없으면 스크립트로 발판 위를 왕복' },
      { key: 'mode', label: '복제 방식', type: 'select', group: '기법', options: [
        { value: 'toggle', label: '토글 이벤트' },
        { value: 'set', label: '절대값 이벤트' },
        { value: 'state', label: '상태 복제' },
      ], default: 'state', a: 'toggle', b: 'state' },
      { key: 'restart', label: '다시 시작', type: 'button' },
    ],
    en: {
      title: 'Event Replication vs State Replication',
      summary: 'Send an event like "door 3 toggled" only once, and one lost packet leaves the client\'s door wrong forever. Put the door state itself in every snapshot, and the next snapshot fixes it on its own.',
      views: { a: 'Toggle events', b: 'State replication' },
      controls: 'Arrow keys / WASD: move the character. Step on a plate to open or close the door above it.',
      info: `
      <p>There are two ways to tell clients about server changes.</p>
      <ul>
        <li><b>Event replication</b> sends what happened. Example: "toggle door 3". It is efficient when packets are small and changes are rare.</li>
        <li><b>State replication</b> sends the current value. Example: "door open bits 001010". It sends the same value again every time.</li>
      </ul>
      <p>Why it matters: games usually send packets over UDP, so packets can be lost.
      A lost event never comes back. With toggle events, every later toggle also applies in reverse, so the state stays <b>wrong forever</b>.
      State replication keeps sending the latest value, so it recovers at the next snapshot after a loss (<b>eventual consistency</b>).</p>
      <ul>
        <li><b>Absolute events</b> ("door 3 = open") recover when the next event for the same door arrives. But if packets arrive out of order, a wrong value can remain.</li>
        <li>Unreal property replication and Source network variables are state replication. Only one-off effects (sounds, particles) go out as events (RPCs).</li>
        <li>With state replication, a client that joins late gets the current state right away.</li>
      </ul>
      <p>Downside: state replication sends unchanged values again and again. With many objects, you need delta compression or interest management.</p>`,
      look: [
        'Watch auto input for a few seconds. On A\'s client view, red outlines (doors that differ from the server) appear one by one and never go away. B may be wrong for a moment, but it recovers at the next snapshot (50ms later).',
        'Switch A\'s replication mode to "Absolute event". A wrong door recovers at its next toggle. Raise jitter a lot, and reordering makes doors go wrong again.',
        'Lower packet loss to 0. A no longer goes wrong. The event approach is safe only without loss.',
        'Compare "Bytes per second". B sends a little more, because it sends unchanged door bits every time. More doors make the gap bigger.',
      ],
      refs: [
        'Glenn Fiedler. Loss-tolerant sync by sending state again and again.',
        'Recommends property replication for lasting state and unreliable RPCs for one-off events.',
        'Valve. Sends entity state again and again in snapshots.',
        'David Aldridge, GDC 2011. Separates state data from events (reliable and unreliable).',
      ],
      params: {
        lat: { label: 'One-way latency (ms)', group: 'Network' },
        jitter: 'Jitter (ms)',
        loss: 'Packet loss rate',
        sendHz: 'Snapshot send rate (Hz)',
        doors: { label: 'Door count', group: 'Scene' },
        auto: { label: 'Auto input', help: 'With no key input, a script walks back and forth over the plates' },
        mode: { label: 'Replication mode', group: 'Technique', options: { toggle: 'Toggle event', set: 'Absolute event', state: 'State replication' } },
        restart: 'Restart',
      },
    },

    setup(ctx) {
      const P = ctx.params;
      const WW = 400, WH = 240, SPEED = 170, R = 9, PY = 170, DY = 60;
      let st;
      function init() {
        ctx.rng = U.rng(ctx.seed);
        const ls = ctx.rng.int(1, 1e9);
        const n = P.doors;
        const xs = Array.from({ length: n }, (_, i) => 40 + (i + 0.5) * ((WW - 80) / n));
        st = {
          now: 0, tick: 0, acc: 0, sAcc: 0, n, xs, pw: Math.min(34, (WW - 80) / n - 6),
          down: new Link(ls, 2), pendingEv: [],
          player: { x: 30, y: PY }, on: new Array(n).fill(false),
          server: new Array(n).fill(false), client: new Array(n).fill(false), lastSnapT: -1,
          cPlayer: { x: 30, y: PY }, wrongSince: new Array(n).fill(-1),
          evSent: 0, evLost: 0, toggles: 0, mismatchAcc: 0, samples: 0, bytesLog: [], flash: [],
        };
      }
      init();

      // 자동 입력: 발판 줄을 따라 왕복하고 가끔 위아래로 비켜 감
      function autoTarget(tMs) {
        const t = tMs / 1000;
        return { x: WW / 2 + Math.sin(t * 1.0) * (WW / 2 - 25), y: PY + (Math.sin(t * 1.9) > 0.6 ? 40 : 0) };
      }
      function moveDir() {
        const k = readKeys(ctx.input);
        if (k.x || k.y || !P.auto) return k;
        const tg = autoTarget(st.now), dx = tg.x - st.player.x, dy = tg.y - st.player.y, l = Math.hypot(dx, dy);
        return l < 3 ? { x: 0, y: 0 } : { x: dx / l, y: dy / l };
      }

      function tick() {
        st.now += STEP; st.tick++;
        const dt = STEP / 1000;
        const net = { lat: P.lat, jit: P.jitter, loss: P.loss };
        const m = moveDir(), l = Math.hypot(m.x, m.y) || 1;
        st.player.x = U.clamp(st.player.x + (m.x / l) * SPEED * dt, R, WW - R);
        st.player.y = U.clamp(st.player.y + (m.y / l) * SPEED * dt, DY + 30, WH - R);

        // 서버: 발판에 새로 올라서면 문 토글
        const evs = [];
        for (let i = 0; i < st.n; i++) {
          const on = Math.abs(st.player.x - st.xs[i]) < st.pw / 2 && Math.abs(st.player.y - PY) < 14;
          if (on && !st.on[i]) { st.server[i] = !st.server[i]; evs.push({ i, v: st.server[i] }); st.toggles++; st.flash.push({ i, t: st.now }); }
          st.on[i] = on;
        }
        // 이벤트는 다음 스냅샷 패킷에 실어 보냄 (재전송 없음)
        if (P.mode !== 'state') st.pendingEv.push(...evs);
        // 스냅샷: 캐릭터 위치는 두 방식 모두 상태로 보냄. 상태 복제는 문 비트를 포함
        const iv = 1000 / P.sendHz;
        st.sAcc += STEP;
        if (st.sAcc >= iv) {
          st.sAcc = Math.min(st.sAcc - iv, iv);
          const ev = st.pendingEv; st.pendingEv = [];
          const bytes = 28 + 8 + (P.mode === 'state' ? Math.ceil(st.n / 8) : ev.length * 2);
          const p = st.down.send(st.now, st.tick, { t: st.now, x: st.player.x, y: st.player.y, doors: P.mode === 'state' ? st.server.slice() : null, ev }, net, bytes);
          st.evSent += ev.length; if (p.lost) st.evLost += ev.length;
          st.bytesLog.push({ t: st.now, b: bytes });
        }
        while (st.bytesLog.length && st.bytesLog[0].t < st.now - 1000) st.bytesLog.shift();

        // 클라이언트 수신
        for (const p of st.down.poll(st.now)) {
          const s = p.data;
          // 이벤트는 도착한 순서대로 적용 (늦게 온 패킷도 적용)
          for (const e of s.ev) {
            if (P.mode === 'toggle') st.client[e.i] = !st.client[e.i];
            else if (P.mode === 'set') st.client[e.i] = e.v;
          }
          if (s.t <= st.lastSnapT) continue;
          st.lastSnapT = s.t;
          st.cPlayer = { x: s.x, y: s.y };
          if (s.doors) for (let i = 0; i < st.n; i++) st.client[i] = s.doors[i];
        }
        let mis = 0;
        for (let i = 0; i < st.n; i++) {
          const w = st.client[i] !== st.server[i];
          if (w) { mis++; if (st.wrongSince[i] < 0) st.wrongSince[i] = st.now; } else st.wrongSince[i] = -1;
        }
        // 정상 전파 지연(지연+지터)보다 오래 어긋난 문만 집계
        const grace = P.lat + P.jitter + 1000 / P.sendHz + 20;
        st.stale = st.wrongSince.filter((w) => w >= 0 && st.now - w > grace).length;
        st.mismatchAcc += st.stale; st.samples++;
        st.mis = mis;
        while (st.flash.length && st.flash[0].t < st.now - 300) st.flash.shift();
      }

      function drawWorld(g, m, doors, pl, col, isClient) {
        D.rect(g, m.ox, m.oy, m.w, m.h, null, 'rgba(255,255,255,0.15)');
        D.grid(g, m.w, m.h, 40 * m.s, C.grid, m.ox, m.oy);
        // 벽 + 문
        D.line(g, m.X(0), m.Y(DY), m.X(WW), m.Y(DY), 'rgba(255,255,255,0.3)', 2);
        for (let i = 0; i < st.n; i++) {
          const x = st.xs[i], w = st.pw;
          const open = doors[i];
          if (open) {
            D.rect(g, m.X(x - w / 2), m.Y(DY - 26), w * m.s, 6 * m.s, 'rgba(255,255,255,0.18)');
            D.rect(g, m.X(x - w / 2), m.Y(DY - 18), w * m.s, 36 * m.s, 'rgba(0,0,0,0.5)');
          } else {
            D.rect(g, m.X(x - w / 2), m.Y(DY - 18), w * m.s, 36 * m.s, isClient ? col : C.good);
          }
          D.text(g, open ? GTL.L('열림', 'Open') : GTL.L('닫힘', 'Closed'), m.X(x), m.Y(DY + 22), { size: Math.max(8, 10 * m.s), color: C.dim, align: 'center' });
          if (isClient && st.client[i] !== st.server[i]) {
            const stale = st.wrongSince[i] >= 0 && st.now - st.wrongSince[i] > P.lat + P.jitter + 1000 / P.sendHz + 20;
            D.rect(g, m.X(x - w / 2 - 3), m.Y(DY - 21), (w + 6) * m.s, 42 * m.s, null, stale ? C.bad : C.warn, stale ? 2.5 : 1);
          }
          // 발판
          const lit = !isClient && st.flash.some((f) => f.i === i);
          D.rect(g, m.X(x - w / 2), m.Y(PY - 8), w * m.s, 16 * m.s, lit ? C.warn : 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.25)');
          D.text(g, String(i + 1), m.X(x), m.Y(PY - 5), { size: Math.max(8, 10 * m.s), color: C.dim, align: 'center' });
        }
        D.circle(g, m.X(pl.x), m.Y(pl.y), R * m.s, isClient ? col : C.good);
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
          panel(g, p0, GTL.L('서버 (실제 문 상태)', 'Server (true door state)'), C.good);
          drawWorld(g, fit(p0, WW, WH), st.server, st.player, col, false);
          panel(g, p1, GTL.L('클라이언트 화면 (빨간 테두리: 어긋난 문)', 'Client view (red outline: wrong door)'), col);
          drawWorld(g, fit(p1, WW, WH), st.client, st.cPlayer, col, true);
          if (st.stale) D.text(g, GTL.L(`어긋남 ${st.stale}개`, `${st.stale} out of sync`), p1.x + p1.w - 6, p1.y + 5, { size: 11, color: C.bad, align: 'right' });

          drawTimeline(g, L.tl, st.now, 2000, [
            { link: st.down, dir: 1, color: col, lw: 1.3, dot: 3 },
          ], [GTL.L('서버', 'Server'), GTL.L('클라', 'Client')]);

          const bps = st.bytesLog.reduce((a, b) => a + b.b, 0);
          ctx.stat(GTL.L('어긋난 문 (지금)', 'Wrong doors (now)'), `${st.stale || 0} / ${st.n}`);
          ctx.stat(GTL.L('평균 어긋난 문 수', 'Avg wrong doors'), st.samples ? (st.mismatchAcc / st.samples).toFixed(2) : '0');
          ctx.stat(GTL.L('토글 수 (서버)', 'Toggles (server)'), st.toggles);
          ctx.stat(GTL.L('손실된 이벤트', 'Lost events'), P.mode === 'state' ? GTL.L('- (이벤트 안 씀)', '- (no events)') : `${st.evLost} / ${st.evSent}`);
          ctx.stat(GTL.L('초당 전송량', 'Bytes per second'), bps + ' B/s');
        },
        onAction(key) { if (key === 'restart') init(); },
      };
    },
  });
})();
