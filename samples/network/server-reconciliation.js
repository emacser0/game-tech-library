// 서버 재조정 (Server Reconciliation) + 오차 보정 평활화
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
    id: 'server-reconciliation',
    title: '서버 재조정 (Server Reconciliation)',
    summary: '예측 중인 클라이언트가 서버 스냅샷을 받으면, 서버 상태로 되돌린 뒤 서버가 아직 처리하지 않은 입력을 다시 적용함. 재조정이 없으면 스냅샷마다 과거로 끌려가는 러버밴딩이 생김.',
    views: { a: '예측만 (서버 상태로 덮어씀)', b: '예측 + 재조정 (입력 재적용)' },
    controls: '←↑→↓ / WASD 이동 (두 뷰 동시)',
    info: `
      <p><b>서버 재조정</b>: 서버 상태를 받은 뒤, 서버가 아직 처리하지 않은 내 입력을 그 위에 다시 시뮬레이션하는 기법.</p>
      <p>예측만 하고 서버 스냅샷으로 그대로 덮어쓰면 문제가 생김. 스냅샷은 <b>RTT/2 + α만큼 과거의 상태</b>임.
      그래서 이동할 때마다 플레이어가 뒤로 당겨짐(러버밴딩, rubber-banding).</p>
      <ul>
        <li>클라이언트는 보낸 입력을 번호와 함께 버퍼에 보관함.</li>
        <li>스냅샷에는 서버가 마지막으로 처리한 입력 번호가 있음. 그 번호 이하의 입력은 버림.</li>
        <li>서버 상태 위에 나머지 입력을 <b>다시 시뮬레이션</b>함.</li>
        <li>로직이 결정론적이면 결과가 예측과 같음. 화면에는 아무 변화가 없음.</li>
      </ul>
      <p>단점: 서버에만 있는 요소가 있으면 예측이 틀림. 여기서는 <b>보라색 범퍼 NPC</b>가 서버에서만 플레이어를 밀어냄.
      이때 쓰는 <b>보정 방식</b>:</p>
      <ul>
        <li>즉시 스냅(snap): 바로 맞는 위치로 옮김.</li>
        <li>부드럽게 수렴(smooth): 화면에 오프셋을 두고 서서히 맞춤.</li>
        <li>오차가 너무 크면 순간이동함.</li>
      </ul>`,
    diagram: (L) => `<svg viewBox="0 0 540 178" xmlns="http://www.w3.org/2000/svg">
      <defs><marker id="arrA" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
      <text x="4" y="25">${L('입력 버퍼', 'Input buffer')}</text>
      ${[3, 4, 5, 6, 7, 8].map((n, i) => `<rect x="${120 + i * 52}" y="10" width="48" height="22" class="f-dim"/>${n > 5 ? `<rect x="${120 + i * 52}" y="10" width="48" height="22" class="d-b"/>` : ''}<text x="${144 + i * 52}" y="25" text-anchor="middle" class="t-mono ${n > 5 ? 't-b' : 't-dim'}">#${n}</text>`).join('')}
      <text x="198" y="46" text-anchor="middle" class="t-small t-dim">${L('서버 처리 완료 (버림)', 'processed by server (drop)')}</text>
      <text x="354" y="46" text-anchor="middle" class="t-small t-b">${L('미확인 (다시 적용)', 'unacked (replay)')}</text>
      <line x1="30" y1="104" x2="530" y2="104" class="d-dim"/>
      <text x="30" y="96" class="t-small t-dim">${L('위치', 'position')}</text>
      <circle cx="200" cy="104" r="6" class="f-dim"/>
      <text x="200" y="124" text-anchor="middle" class="t-small">${L('서버 스냅샷 (과거)', 'server snapshot (past)')}</text>
      <path d="M200,98 Q236,68 272,98 M272,98 Q308,68 344,98 M344,98 Q380,68 416,98" class="d-b"/>
      <path d="M408,92 L416,98" class="d-b" marker-end="url(#arrB)"/>
      <text x="236" y="76" text-anchor="middle" class="t-small t-b">#6</text><text x="308" y="76" text-anchor="middle" class="t-small t-b">#7</text><text x="380" y="76" text-anchor="middle" class="t-small t-b">#8</text>
      <circle cx="420" cy="104" r="6" class="f-b"/>
      <text x="420" y="124" text-anchor="middle" class="t-small t-b">${L('B: 예측과 같은 위치', 'B: same as prediction')}</text>
      <path d="M414,146 L206,146" class="d-a" marker-end="url(#arrA)"/>
      <text x="310" y="162" text-anchor="middle" class="t-small t-a">${L('A: 서버 상태로 덮어써서 뒤로 끌려감 (러버밴딩)', 'A: overwritten by the server state, pulled back (rubber-banding)')}</text>
    </svg>`,
    look: [
      'A에서 이동하면 플레이어가 계속 떨리며 뒤로 끌려감. "화면 튐" 그래프에 스냅샷마다 스파이크가 생김.',
      'B에서 범퍼에 부딪히면 그때만 보정(오예측)이 일어나고 캐릭터가 툭 튐.',
      'B의 보정 방식을 "부드럽게 수렴"으로 바꾸면 튐이 사라지고, 캐릭터가 잠깐 미끄러지듯 따라감.',
      '"범퍼 NPC"를 끄면 B의 보정량이 0에 가까워짐. 손실이 있어도 입력 중복 전송 덕분에 서버와 예측이 일치함.',
      '지연을 올리면 "미확인 입력" 상자 줄이 길어짐. 길이는 약 RTT × 60Hz.',
    ],
    refs: [
      { type: 'article', title: 'Fast-Paced Multiplayer (Part II): Client-Side Prediction and Server Reconciliation', url: 'https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html', note: 'Gabriel Gambetta. 입력 번호와 재적용.' },
      { type: 'article', title: 'Networked Physics (2004)', url: 'https://gafferongames.com/post/networked_physics_2004/', note: 'Glenn Fiedler. 입력 히스토리 재생과 부드러운 보정.' },
      { type: 'engine', title: 'Source Multiplayer Networking - Input prediction', url: 'https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking', note: 'Valve. 예측 오류 시 cl_smooth로 보정을 평활화.' },
      { type: 'talk', title: 'Overwatch Gameplay Architecture and Netcode', year: 2017, note: 'Tim Ford, GDC 2017. 오예측 때 롤백과 재시뮬레이션.' },
    ],
    params: [
      { key: 'lat', label: '편도 지연 (ms)', type: 'int', min: 0, max: 500, default: 120, shared: true, group: '네트워크' },
      { key: 'jitter', label: '지터 (ms)', type: 'int', min: 0, max: 150, default: 20, shared: true },
      { key: 'loss', label: '패킷 손실률', type: 'range', min: 0, max: 0.3, step: 0.01, default: 0.03, shared: true },
      { key: 'sendHz', label: '스냅샷 전송률 (Hz)', type: 'int', min: 5, max: 60, default: 20, shared: true },
      { key: 'auto', label: '자동 입력', type: 'bool', default: true, shared: true, group: '장면' },
      { key: 'npc', label: '범퍼 NPC (서버만 시뮬레이션)', type: 'bool', default: true, shared: true, help: '예측이 틀리는 상황을 만듦' },
      { key: 'reconcile', label: '서버 재조정', type: 'bool', group: '기법', a: false, b: true },
      { key: 'smooth', label: '보정 방식', type: 'select', options: [
        { value: 'snap', label: '즉시 스냅' },
        { value: 'smooth', label: '부드럽게 수렴' },
      ], default: 'snap', help: '보정 오차를 화면에 반영하는 방법' },
      { key: 'smoothRate', label: '수렴 속도 (1/s)', type: 'range', min: 1, max: 30, step: 0.5, default: 10, when: (p) => p.smooth === 'smooth' },
      { key: 'restart', label: '다시 시작', type: 'button' },
    ],
    en: {
      title: 'Server Reconciliation',
      summary: 'When a predicting client receives a server snapshot, it resets to the server state and then applies again the inputs the server has not processed yet. Without reconciliation, each snapshot pulls the player into the past (rubber-banding).',
      views: { a: 'Prediction only (overwrite with server state)', b: 'Prediction + reconciliation (replay inputs)' },
      controls: 'Arrow keys / WASD: move (both views)',
      info: `
      <p><b>Server reconciliation</b>: after receiving the server state, the client simulates its own inputs that the server has not processed yet on top of it.</p>
      <p>If you only predict and then overwrite with the server snapshot, a problem appears. A snapshot is <b>a state from RTT/2 + α in the past</b>.
      So the player gets pulled back every time it moves (rubber-banding).</p>
      <ul>
        <li>The client keeps the inputs it sent in a buffer, each with a number.</li>
        <li>The snapshot holds the number of the last input the server processed. The client drops inputs up to that number.</li>
        <li>The client <b>simulates again</b> the remaining inputs on top of the server state.</li>
        <li>If the logic is deterministic, the result matches the prediction. Nothing changes on screen.</li>
      </ul>
      <p>Downside: if something exists only on the server, the prediction is wrong. Here the <b>purple bumper NPC</b> pushes the player only on the server.
      <b>Correction modes</b> for this case:</p>
      <ul>
        <li>Snap: move to the correct position at once.</li>
        <li>Smooth: keep an offset on screen and close it gradually.</li>
        <li>If the error is too large, teleport.</li>
      </ul>`,
      look: [
        'Move in A. The player keeps shaking and gets pulled back. The "Screen jump" graph spikes at every snapshot.',
        'In B, a correction (misprediction) happens only when you hit the bumper, and the character jumps a little.',
        'Switch B\'s correction mode to "Smooth". The jumps disappear, and the character glides to catch up for a moment.',
        'Turn off "Bumper NPC". B\'s correction drops close to 0. Even with loss, sending inputs more than once keeps the server and the prediction in sync.',
        'Raise latency. The row of "Unacked inputs" boxes gets longer. Its length is about RTT × 60Hz.',
      ],
      refs: [
        'Gabriel Gambetta. Input numbers and replay.',
        'Glenn Fiedler. Input history replay and smooth correction.',
        'Valve. Smooths corrections with cl_smooth after prediction errors.',
        'Tim Ford, GDC 2017. Rollback and resimulation on misprediction.',
      ],
      params: {
        lat: { label: 'One-way latency (ms)', group: 'Network' },
        jitter: 'Jitter (ms)',
        loss: 'Packet loss rate',
        sendHz: 'Snapshot send rate (Hz)',
        auto: { label: 'Auto input', group: 'Scene' },
        npc: { label: 'Bumper NPC (server only)', help: 'Creates cases where prediction is wrong' },
        reconcile: { label: 'Server reconciliation', group: 'Technique' },
        smooth: { label: 'Correction mode', help: 'How the correction error shows on screen', options: { snap: 'Snap', smooth: 'Smooth' } },
        smoothRate: 'Smoothing rate (1/s)',
        restart: 'Restart',
      },
    },

    setup(ctx) {
      const P = ctx.params;
      const WW = 400, WH = 260, SPEED = 170, R = 10, NR = 22;
      let st;
      const move = (s, m, dt) => {
        const l = Math.hypot(m.x, m.y) || 1;
        s.x = U.clamp(s.x + (m.x / l) * SPEED * dt, R, WW - R);
        s.y = U.clamp(s.y + (m.y / l) * SPEED * dt, R, WH - R);
      };
      // 서버 전용 NPC: 경기장을 8자 궤도로 돎
      const npcPos = (t) => ({ x: WW / 2 + Math.sin(t * 0.0009) * 140, y: WH / 2 + Math.sin(t * 0.0018) * 70 });
      const push = (s, n) => {
        const dx = s.x - n.x, dy = s.y - n.y, d = Math.hypot(dx, dy);
        if (d < R + NR) {
          const k = d > 1e-6 ? (R + NR - d) / d : 0;
          s.x = U.clamp(s.x + dx * k + (d > 1e-6 ? 0 : R + NR), R, WW - R);
          s.y = U.clamp(s.y + dy * k, R, WH - R);
          return true;
        }
        return false;
      };
      function init() {
        ctx.rng = U.rng(ctx.seed);
        const ls = ctx.rng.int(1, 1e9);
        const c0 = { x: WW / 2, y: WH - 40 };
        st = {
          now: 0, tick: 0, acc: 0, sendAcc: 0,
          up: new Link(ls, 1), down: new Link(ls, 2),
          server: { ...c0, lastSeq: -1, hits: 0 },
          sv: { ...c0, seq: -1, t: -1, nx: npcPos(0).x, ny: npcPos(0).y },
          pred: { ...c0 }, off: { x: 0, y: 0 },
          pending: [], recent: [], seq: 0,
          disp: { ...c0 }, jerk: [], corr: [], mispredicts: 0, lastCorr: 0, flash: 0, lastMove: { x: 0, y: 0 },
        };
      }
      init();

      function tick() {
        st.now += STEP; st.tick++;
        const dt = STEP / 1000;
        const net = { lat: P.lat, jit: P.jitter, loss: P.loss };
        const m = getMove(ctx, st.now);
        st.lastMove = m;
        const before = { x: st.pred.x + st.off.x, y: st.pred.y + st.off.y };

        // 클라이언트 예측
        const cmd = { seq: st.seq++, x: m.x, y: m.y };
        st.recent.push(cmd); if (st.recent.length > 3) st.recent.shift();
        st.up.send(st.now, st.tick, st.recent.slice(), net, 28 + 12);
        move(st.pred, m, dt);
        st.pending.push(cmd);
        const expected = { x: st.pred.x + st.off.x - before.x, y: st.pred.y + st.off.y - before.y };

        // 서버
        const npc = npcPos(st.now);
        for (const p of st.up.poll(st.now)) {
          for (const c of p.data) if (c.seq > st.server.lastSeq) {
            move(st.server, c, dt);
            if (P.npc && push(st.server, npc)) st.server.hits++;
            st.server.lastSeq = c.seq;
          }
        }
        if (P.npc) push(st.server, npc); // NPC가 가만히 있는 플레이어도 밂
        st.sendAcc += STEP;
        const iv = 1000 / P.sendHz;
        if (st.sendAcc >= iv) {
          st.sendAcc = Math.min(st.sendAcc - iv, iv);
          st.down.send(st.now, st.tick, { x: st.server.x, y: st.server.y, seq: st.server.lastSeq, t: st.now, nx: npc.x, ny: npc.y }, net, 28 + 20);
        }

        // 클라이언트: 스냅샷 수신 → 재조정
        for (const p of st.down.poll(st.now)) {
          const s = p.data;
          if (s.t <= st.sv.t) continue;
          st.sv = { ...s };
          st.pending = st.pending.filter((c) => c.seq > s.seq);
          const old = { x: st.pred.x, y: st.pred.y };
          st.pred.x = s.x; st.pred.y = s.y;
          if (P.reconcile) for (const c of st.pending) move(st.pred, c, dt);
          const ex = old.x - st.pred.x, ey = old.y - st.pred.y, e = Math.hypot(ex, ey);
          st.lastCorr = e;
          st.corr.push(e); if (st.corr.length > 40) st.corr.shift();
          if (e > 0.5) { st.mispredicts++; st.flash = 1; }
          if (P.smooth === 'smooth' && e < 120) { st.off.x += ex; st.off.y += ey; } // 화면 위치는 연속 유지
          else { st.off.x = 0; st.off.y = 0; }
        }
        // 시각 오프셋 감쇠
        const k = Math.exp(-P.smoothRate * dt);
        if (P.smooth === 'smooth') { st.off.x *= k; st.off.y *= k; } else { st.off.x = 0; st.off.y = 0; }

        st.disp = { x: st.pred.x + st.off.x, y: st.pred.y + st.off.y };
        // 화면 튐 = 실제 화면 이동 - 입력으로 기대한 이동
        const jx = st.disp.x - before.x - expected.x, jy = st.disp.y - before.y - expected.y;
        st.jerk.push(Math.hypot(jx, jy)); if (st.jerk.length > 180) st.jerk.shift();
        st.flash = Math.max(0, st.flash - dt * 3);
      }

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

          panel(g, p0, GTL.L('서버 (권위)', 'Server (authoritative)'), C.good);
          let m = fit(p0, WW, WH); arena(g, m);
          if (P.npc) { const n = npcPos(st.now); D.circle(g, m.X(n.x), m.Y(n.y), NR * m.s, 'rgba(199,146,234,0.5)', C.accent, 1.5); }
          D.circle(g, m.X(st.server.x), m.Y(st.server.y), R * m.s, C.good);
          D.text(g, GTL.L(`범퍼 충돌 ${st.server.hits}`, `Bumper hits ${st.server.hits}`), p0.x + 6, p0.y + p0.h - 16, { size: 10, color: C.dim });

          panel(g, p1, GTL.L('로컬 클라이언트 (예측)', 'Local client (predicted)'), col);
          m = fit(p1, WW, WH); arena(g, m);
          if (P.npc) D.circle(g, m.X(st.sv.nx), m.Y(st.sv.ny), NR * m.s, 'rgba(199,146,234,0.25)', 'rgba(199,146,234,0.6)', 1);
          D.circle(g, m.X(st.sv.x), m.Y(st.sv.y), R * m.s, null, C.good, 1.5);   // 최신 서버 상태 (과거)
          const dx = m.X(st.disp.x), dy = m.Y(st.disp.y);
          D.line(g, m.X(st.sv.x), m.Y(st.sv.y), dx, dy, 'rgba(102,209,122,0.4)', 1);
          if (st.flash > 0) D.circle(g, dx, dy, (R + 10 * st.flash) * m.s, null, `rgba(255,83,112,${st.flash})`, 2);
          D.circle(g, dx, dy, R * m.s, col);
          if (Math.hypot(st.off.x, st.off.y) > 0.5) D.circle(g, m.X(st.pred.x), m.Y(st.pred.y), 3, null, C.warn, 1);
          D.text(g, GTL.L('○ 녹색 = 받은 서버 상태', '○ green = received server state'), p1.x + 6, p1.y + p1.h - 16, { size: 10, color: C.dim });

          panel(g, p2, GTL.L('미확인 입력 & 화면 튐', 'Unacked inputs & screen jumps'), C.dim);
          const bx = p2.x + 6, bw = p2.w - 12;
          const cell = 7, perRow = Math.max(1, Math.floor(bw / cell));
          for (let i = 0; i < Math.min(st.pending.length, perRow * 4); i++) {
            const c = st.pending[i];
            const x = bx + (i % perRow) * cell, y = p2.y + 24 + Math.floor(i / perRow) * cell;
            D.rect(g, x, y, cell - 1, cell - 1, c.x || c.y ? col : 'rgba(255,255,255,0.2)');
          }
          const gy = p2.y + 24 + cell * 4 + 8, gh = Math.max(16, p2.h - (gy - p2.y) - 22);
          D.plot(g, st.jerk, bx, gy, bw, gh, { min: 0, max: 12, color: C.bad, label: GTL.L('화면 튐 (px/틱)', 'Screen jump (px/tick)') });
          D.text(g, GTL.L(`미확인 ${st.pending.length}개, 최근 보정 ${st.lastCorr.toFixed(1)}`, `${st.pending.length} unacked, last correction ${st.lastCorr.toFixed(1)}`), bx, p2.y + p2.h - 16, { size: 10, color: C.dim });

          drawTimeline(g, L.tl, st.now, 2000, [
            { link: st.up, dir: 1, color: 'rgba(200,200,200,0.9)', lw: 1, dot: 2 },
            { link: st.down, dir: -1, color: col, lw: 1.5, dot: 3.5 },
          ], [GTL.L('클라', 'Client'), GTL.L('서버', 'Server')]);

          const avg = st.corr.length ? st.corr.reduce((a, b) => a + b, 0) / st.corr.length : 0;
          const maxJ = st.jerk.length ? Math.max(...st.jerk) : 0;
          ctx.stat(GTL.L('스냅샷당 평균 보정량', 'Avg correction per snapshot'), avg.toFixed(2) + ' u');
          ctx.stat(GTL.L('최대 화면 튐 (3초)', 'Max screen jump (3 s)'), maxJ.toFixed(1) + ' u');
          ctx.stat(GTL.L('보정 발생 횟수', 'Correction count'), st.mispredicts);
          ctx.stat(GTL.L('미확인 입력', 'Unacked inputs'), st.pending.length);
        },
        onAction(key) { if (key === 'restart') init(); },
      };
    },
  });
})();
