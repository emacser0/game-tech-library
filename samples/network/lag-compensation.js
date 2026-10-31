// 랙 보상 (Lag Compensation / Server-side Rewind), 히트스캔 판정
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
    id: 'lag-compensation',
    title: '랙 보상 (Lag Compensation)',
    summary: '사수는 지연과 보간 지연만큼 과거의 적을 보고 쏨. 서버가 현재 위치로 판정하면 화면에서 정확히 맞힌 총알도 빗나감. 서버가 사수가 보던 시점으로 적을 되감아 판정하면 맞음. 대신 피격자는 엄폐 뒤에서 맞는 일이 생김.',
    views: { a: '랙 보상 없음 (현재 위치 판정)', b: '랙 보상 (되감기 판정)' },
    controls: '← → / A D: 피격자(위쪽 원) 좌우 이동, Space: 수동 사격 (자동 사격을 끈 경우)',
    info: `
      <p><b>랙 보상</b>: 서버가 사수가 보던 시각으로 대상을 되감아 명중을 판정하는 기법</p>
      <p>왜 필요한가: 사수 화면 속 적은 <code>서버→사수 지연 + 보간 지연</code>만큼 과거 위치임.
      사수가 화면에서 정확히 조준해도, 명령이 서버에 닿을 무렵 적은 이미 이동해 있음.
      그래서 <b>현재 위치로 판정하면 빗나감</b>. 사수가 이동 방향 앞을 겨냥(리드)해도, 필요한 리드 양이 핑마다 달라짐.</p>
      <ul>
        <li>서버는 각 플레이어의 과거 위치(히트박스)를 일정 시간 기록해 둠</li>
        <li>사격 명령에는 사수가 렌더링하던 시각이 들어 있음</li>
        <li>서버는 대상을 그 시각으로 <b>되감아(rewind)</b> 판정한 뒤 원래대로 되돌림</li>
        <li>결과: "보이는 대로 맞음(favor the shooter)"</li>
      </ul>
      <p>단점: 피격자는 이미 엄폐물 뒤로 들어갔는데 맞는 일이 생김. 그래서 최대 되감기 시간을 제한해 높은 핑 사수의 이점을 줄임.
      Valve Source는 최대 1초. Overwatch는 높은 핑에서 보정량을 줄임.</p>`,
    diagram: (L) => `<svg viewBox="0 0 540 180" xmlns="http://www.w3.org/2000/svg">
      <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
      <text x="4" y="16" class="t-small t-dim">${L('서버는 히트박스 위치 기록 보관 (Source 최대 1초)', 'The server keeps a history of hitbox positions (Source: up to 1 s)')}</text>
      <circle cx="40" cy="110" r="8" class="f-dim"/>
      <text x="40" y="136" text-anchor="middle" class="t-small">${L('사수', 'shooter')}</text>
      ${[200, 300, 350].map((x) => `<rect x="${x}" y="90" width="24" height="40" class="f-dim" opacity="0.5"/>`).join('')}
      <line x1="50" y1="110" x2="262" y2="110" class="d-accent"/>
      <rect x="250" y="90" width="24" height="40" class="d-b" stroke-dasharray="4 2"/>
      <rect x="400" y="90" width="24" height="40" class="f-dim"/>
      <rect x="400" y="90" width="24" height="40" class="d-a"/>
      <path d="M406,104 L418,116 M418,104 L406,116" class="d-bad"/>
      <text x="262" y="64" text-anchor="middle" class="t-b">${L('B: 되감은 위치로 판정', 'B: rewound position')}</text>
      <text x="262" y="80" text-anchor="middle" class="t-small t-b">${L('명중', 'hit')}</text>
      <text x="412" y="64" text-anchor="middle" class="t-a">${L('A: 현재 위치로 판정', 'A: current position')}</text>
      <text x="412" y="80" text-anchor="middle" class="t-small t-a">${L('빗나감', 'miss')}</text>
      <path d="M264,150 L410,150" class="d-accent" marker-start="url(#arr)" marker-end="url(#arr)"/>
      <text x="337" y="168" text-anchor="middle" class="t-small">${L('사수 화면과 서버 현재 사이의 시간 (편도 지연 + 보간 지연)', 'Gap between shooter view and server now (latency + interp delay)')}</text>
    </svg>`,
    look: [
      'A에서 사수 화면과 서버 판정을 비교하면, 화면에서는 명중(초록 탄)이어도 서버는 대부분 빗나감으로 판정. "서버 인정률"이 낮고, 피격자가 멈춰 있을 때만 맞음.',
      'B에서 서버 패널을 보면 점선 원(되감은 히트박스)에 판정이 일어남. 인정률이 거의 100%.',
      'B의 피격자 화면을 보면, 엄폐물(회색 벽) 뒤에 들어간 직후 "피격!"이 뜨기도 함. "엄폐 뒤 피격" 수치가 올라감.',
      '사수 지연을 250ms 이상으로 올리고 B의 "최대 되감기"를 100ms로 낮추면 인정률이 다시 떨어짐(높은 핑 제한)',
    ],
    refs: [
      { type: 'engine', title: 'Lag compensation', url: 'https://developer.valvesoftware.com/wiki/Lag_Compensation', note: 'Valve Developer Wiki. 서버 측 히트박스 되감기.' },
      { type: 'paper', title: 'Latency Compensating Methods in Client/Server In-game Protocol Design and Optimization', url: 'https://developer.valvesoftware.com/wiki/Latency_Compensating_Methods_in_Client/Server_In-game_Protocol_Design_and_Optimization', year: 2001, note: 'Yahn Bernier (Valve).' },
      { type: 'article', title: 'Fast-Paced Multiplayer (Part IV): Lag Compensation', url: 'https://www.gabrielgambetta.com/lag-compensation.html', note: 'Gabriel Gambetta.' },
      { type: 'engine', title: 'Source Multiplayer Networking - Lag compensation', url: 'https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking', note: '명령 실행 시각 = 서버 시각 − 패킷 지연 − 클라 보간 지연' },
      { type: 'talk', title: 'Overwatch Gameplay Architecture and Netcode', year: 2017, note: 'Tim Ford, GDC 2017. 히트 판정 되감기와 높은 핑 제한.' },
      { type: 'talk', title: 'I Shot You First: Networking the Gameplay of HALO: REACH', year: 2011, note: 'David Aldridge, GDC 2011.' },
    ],
    params: [
      { key: 'lat', label: '사수 편도 지연 (ms)', type: 'int', min: 0, max: 400, default: 100, shared: true, group: '네트워크' },
      { key: 'vlat', label: '피격자 편도 지연 (ms)', type: 'int', min: 0, max: 300, default: 40, shared: true },
      { key: 'jitter', label: '지터 (ms)', type: 'int', min: 0, max: 100, default: 10, shared: true },
      { key: 'loss', label: '패킷 손실률', type: 'range', min: 0, max: 0.2, step: 0.01, default: 0.0, shared: true },
      { key: 'sendHz', label: '스냅샷 전송률 (Hz)', type: 'int', min: 10, max: 60, default: 30, shared: true },
      { key: 'interp', label: '사수 보간 지연 (ms)', type: 'int', min: 0, max: 200, default: 70, shared: true },
      { key: 'auto', label: '자동 입력 (피격자 이동)', type: 'bool', default: true, shared: true, group: '장면' },
      { key: 'autoFire', label: '자동 사격', type: 'bool', default: true, shared: true },
      { key: 'fireMs', label: '사격 간격 (ms)', type: 'int', min: 150, max: 1500, default: 400, shared: true },
      { key: 'aimErr', label: '사수 조준 오차 (u)', type: 'range', min: 0, max: 20, step: 0.5, default: 4, shared: true, help: '사수 화면 기준 무작위 조준 오차' },
      { key: 'comp', label: '랙 보상 (되감기)', type: 'bool', group: '기법', a: false, b: true },
      { key: 'maxRewind', label: '최대 되감기 (ms)', type: 'int', min: 0, max: 1000, default: 500, when: (p) => p.comp },
      { key: 'restart', label: '다시 시작', type: 'button' },
    ],
    en: {
      title: 'Lag Compensation',
      summary: 'The shooter sees and shoots at the enemy in the past, by the latency plus the interpolation delay. If the server checks against the current position, a shot that hit exactly on screen misses. If the server rewinds the enemy to the moment the shooter saw, it hits. The cost: targets sometimes get hit after they reach cover.',
      views: { a: 'No lag compensation (current position)', b: 'Lag compensation (rewind)' },
      controls: 'Left / Right, A / D: move the target (top circle). Space: fire by hand (when auto fire is off)',
      info: `
      <p><b>Lag compensation</b>: the server rewinds the target to the time the shooter saw, then checks the hit.</p>
      <p>Why you need it: the enemy on the shooter's screen is in a past position, by <code>server→shooter latency + interpolation delay</code>.
      Even if the shooter aims exactly on screen, the enemy has already moved by the time the command reaches the server.
      So <b>a check against the current position misses</b>. The shooter can lead the target, but the needed lead changes with ping.</p>
      <ul>
        <li>The server records each player's past positions (hitboxes) for a while.</li>
        <li>Each fire command includes the time the shooter was rendering.</li>
        <li>The server <b>rewinds</b> the target to that time, checks the hit, and then restores it.</li>
        <li>Result: "what you see is what you hit" (favor the shooter).</li>
      </ul>
      <p>Downside: a target can get hit after it already moved behind cover. So games limit the maximum rewind time to reduce the advantage of high-ping shooters.
      Valve Source allows up to 1 second. Overwatch reduces the compensation at high ping.</p>`,
      look: [
        'In A, compare the shooter view with the server check. Even when the screen shows a hit (green shot), the server mostly calls it a miss. "Server accept rate" is low, and shots hit only while the target stands still.',
        'In B, look at the server panel. The check happens on the dashed circle (rewound hitbox). The accept rate is almost 100%.',
        'In B, look at the target view. "Hit!" sometimes appears right after the target moves behind cover (gray wall). The "Hit behind cover" count goes up.',
        'Raise shooter latency to 250ms or more and lower B\'s "Max rewind" to 100ms. The accept rate drops again (high-ping limit).',
      ],
      refs: [
        'Valve Developer Wiki. Server-side hitbox rewind.',
        'Yahn Bernier (Valve).',
        'Gabriel Gambetta.',
        'Command time = server time − packet latency − client interpolation delay.',
        'Tim Ford, GDC 2017. Hit check rewind and the high-ping limit.',
        'David Aldridge, GDC 2011.',
      ],
      params: {
        lat: { label: 'Shooter one-way latency (ms)', group: 'Network' },
        vlat: 'Target one-way latency (ms)',
        jitter: 'Jitter (ms)',
        loss: 'Packet loss rate',
        sendHz: 'Snapshot send rate (Hz)',
        interp: 'Shooter interpolation delay (ms)',
        auto: { label: 'Auto input (target moves)', group: 'Scene' },
        autoFire: 'Auto fire',
        fireMs: 'Fire interval (ms)',
        aimErr: { label: 'Shooter aim error (u)', help: 'Random aim error on the shooter screen' },
        comp: { label: 'Lag compensation (rewind)', group: 'Technique' },
        maxRewind: 'Max rewind (ms)',
        restart: 'Restart',
      },
    },

    setup(ctx) {
      const P = ctx.params;
      const WW = 400, WH = 260, LANE = 62, R = 12, SPEED = 160;
      const SH = { x: 200, y: 238 };
      const WALL = { x: 172, y: 100, w: 56, h: 18 };
      let st, seed;
      // 선분 (ax,ay)-(bx,by)이 벽 사각형과 교차하는가 (Liang-Barsky)
      function blocked(ax, ay, bx, by) {
        let t0 = 0, t1 = 1;
        const dx = bx - ax, dy = by - ay;
        const ps = [-dx, dx, -dy, dy], qs = [ax - WALL.x, WALL.x + WALL.w - ax, ay - WALL.y, WALL.y + WALL.h - ay];
        for (let i = 0; i < 4; i++) {
          if (Math.abs(ps[i]) < 1e-9) { if (qs[i] < 0) return false; continue; }
          const t = qs[i] / ps[i];
          if (ps[i] < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
          if (t0 > t1) return false;
        }
        return true;
      }
      const hidden = (x) => blocked(SH.x, SH.y, x, LANE);
      function init() {
        ctx.rng = U.rng(ctx.seed);
        seed = ctx.rng.int(1, 1e9);
        st = {
          now: 0, tick: 0, acc: 0, sendAcc: 0, cool: 0, shotId: 0,
          vUp: new Link(seed, 1), sDown: new Link(seed, 2), sUp: new Link(seed, 3), vDown: new Link(seed, 4),
          vClient: { x: 120 }, vRecent: [], vSeq: 0,
          server: { x: 120, lastSeq: -1 }, hist: [],
          buf: [], age: null, rt: 0, sDisp: 120,
          shots: [], judged: [], vHits: [],
          clientHits: 0, serverHits: 0, unfair: 0, rewinds: [],
        };
      }
      init();
      function serverXAt(t) {
        const h = st.hist;
        if (!h.length) return st.server.x;
        if (t <= h[0].t) return h[0].x;
        for (let i = h.length - 1; i > 0; i--) if (h[i - 1].t <= t) {
          const a = h[i - 1], b = h[i];
          return U.lerp(a.x, b.x, U.clamp((t - a.t) / (b.t - a.t), 0, 1));
        }
        return h[h.length - 1].x;
      }

      function tick() {
        st.now += STEP; st.tick++;
        const dt = STEP / 1000;
        const netS = { lat: P.lat, jit: P.jitter, loss: P.loss }, netV = { lat: P.vlat, jit: P.jitter, loss: P.loss };
        const mv = getMove(ctx, st.now).x;

        // 피격자 클라이언트: 자기 자신은 예측(즉시 이동), 입력 전송
        st.vClient.x = U.clamp(st.vClient.x + mv * SPEED * dt, 20, WW - 20);
        const cmd = { seq: st.vSeq++, x: mv };
        st.vRecent.push(cmd); if (st.vRecent.length > 3) st.vRecent.shift();
        st.vUp.send(st.now, st.tick, st.vRecent.slice(), netV, 32);

        // 서버: 피격자 이동 + 위치 기록
        for (const p of st.vUp.poll(st.now)) for (const c of p.data) if (c.seq > st.server.lastSeq) {
          st.server.x = U.clamp(st.server.x + c.x * SPEED * dt, 20, WW - 20); st.server.lastSeq = c.seq;
        }
        st.hist.push({ t: st.now, x: st.server.x });
        while (st.hist.length > 2 && st.hist[0].t < st.now - 1200) st.hist.shift();

        st.sendAcc += STEP;
        const iv = 1000 / P.sendHz;
        if (st.sendAcc >= iv) { st.sendAcc = Math.min(st.sendAcc - iv, iv); st.sDown.send(st.now, st.tick, { t: st.now, x: st.server.x }, netS, 36); }

        // 사수 클라이언트: 스냅샷 보간
        for (const p of st.sDown.poll(st.now)) {
          const s = p.data, age = st.now - s.t;
          st.age = st.age === null ? age : U.lerp(st.age, age, 0.1);
          let i = st.buf.length;
          while (i > 0 && st.buf[i - 1].t > s.t) i--;
          st.buf.splice(i, 0, s);
        }
        while (st.buf.length > 2 && st.buf[1].t < st.now - 1500) st.buf.shift();
        if (st.buf.length) {
          const rt = st.now - (st.age ?? 0) - P.interp;
          st.rt = rt;
          const k = st.buf.findIndex((s) => s.t > rt);
          if (k === -1) st.sDisp = st.buf[st.buf.length - 1].x;
          else if (k === 0) st.sDisp = st.buf[0].x;
          else { const a = st.buf[k - 1], b = st.buf[k]; st.sDisp = U.lerp(a.x, b.x, U.clamp((rt - a.t) / (b.t - a.t), 0, 1)); }
          // 렌더 시각은 사수가 아는 값임 (스냅샷 타임스탬프 기준)
          st.rt = Math.min(rt, st.buf[st.buf.length - 1].t);
        }
        // 사격
        st.cool -= STEP;
        const want = (P.autoFire && st.cool <= 0) || ctx.input.pressed('Space');
        if (want && st.buf.length && !hidden(st.sDisp)) {
          st.cool = P.fireMs;
          const id = st.shotId++;
          const aimX = st.sDisp + (hash01(seed, 77, id) * 2 - 1) * P.aimErr;
          const clientHit = !hidden(aimX) && Math.abs(aimX - st.sDisp) < R;
          if (clientHit) st.clientHits++;
          const shot = { id, t: st.now, aimX, clientHit, rt: st.rt, seenX: st.sDisp };
          st.shots.push(shot);
          st.sUp.send(st.now, st.tick * 4 + 1, shot, netS, 40);
        }
        while (st.shots.length && st.shots[0].t < st.now - 900) st.shots.shift();

        // 서버: 사격 판정
        for (const p of st.sUp.poll(st.now)) {
          const s = p.data;
          let tx = st.server.x, rewind = 0;
          if (P.comp) {
            const tr = Math.max(s.rt, st.now - P.maxRewind);
            rewind = st.now - tr;
            tx = serverXAt(tr);
          }
          const hit = !blocked(SH.x, SH.y, s.aimX, LANE) && Math.abs(s.aimX - tx) < R;
          const unfair = hit && hidden(st.server.x);
          if (hit) st.serverHits++;
          if (unfair) st.unfair++;
          st.rewinds.push(rewind); if (st.rewinds.length > 20) st.rewinds.shift();
          const j = { t: st.now, aimX: s.aimX, tx, cur: st.server.x, hit, unfair, clientHit: s.clientHit, comp: P.comp };
          st.judged.push(j);
          if (hit) st.vDown.send(st.now, st.tick * 4 + 2, { ...j }, netV, 24);
        }
        while (st.judged.length && st.judged[0].t < st.now - 1200) st.judged.shift();
        // 피격자: 피격 알림 수신
        for (const p of st.vDown.poll(st.now)) {
          st.vHits.push({ t: st.now, x: st.vClient.x, behind: hidden(st.vClient.x) });
        }
        while (st.vHits.length && st.vHits[0].t < st.now - 900) st.vHits.shift();
      }

      function scene(g, m, victimX, vcol) {
        D.rect(g, m.ox, m.oy, m.w, m.h, null, 'rgba(255,255,255,0.15)');
        D.line(g, m.X(0), m.Y(LANE), m.X(WW), m.Y(LANE), 'rgba(255,255,255,0.08)', 1);
        D.rect(g, m.X(WALL.x), m.Y(WALL.y), WALL.w * m.s, WALL.h * m.s, '#555b66', '#8a93a3');
        // 벽 그림자(사수 시야에서 가려지는 레인 구간)
        const sx0 = SH.x + (WALL.x - SH.x) * (SH.y - LANE) / (SH.y - WALL.y - WALL.h);
        const sx1 = SH.x + (WALL.x + WALL.w - SH.x) * (SH.y - LANE) / (SH.y - WALL.y - WALL.h);
        D.rect(g, m.X(sx0), m.Y(LANE - 16), (sx1 - sx0) * m.s, 32 * m.s, 'rgba(0,0,0,0.35)');
        D.circle(g, m.X(SH.x), m.Y(SH.y), 9 * m.s, '#9aa3b2');
        if (victimX !== null) D.circle(g, m.X(victimX), m.Y(LANE), R * m.s, vcol);
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

          panel(g, p0, GTL.L('사수 클라이언트 화면', 'Shooter client view'), C.text);
          let m = fit(p0, WW, WH);
          scene(g, m, st.sDisp, U.hsl(340, 70, 65));
          for (const s of st.shots) {
            const a = 1 - (st.now - s.t) / 900;
            g.globalAlpha = Math.max(0, a);
            D.line(g, m.X(SH.x), m.Y(SH.y), m.X(s.aimX), m.Y(LANE), s.clientHit ? C.good : C.dim, 1.5);
            g.globalAlpha = 1;
          }
          D.text(g, GTL.L('보이는 적 = 과거 위치', 'Visible enemy = past position'), p0.x + 6, p0.y + p0.h - 16, { size: 10, color: C.dim });

          panel(g, p1, P.comp ? GTL.L('서버 판정 (되감기)', 'Server check (rewind)') : GTL.L('서버 판정 (현재 위치)', 'Server check (current position)'), col);
          m = fit(p1, WW, WH);
          scene(g, m, st.server.x, C.good);
          for (const j of st.judged) {
            const a = Math.max(0, 1 - (st.now - j.t) / 1200);
            g.globalAlpha = a;
            D.line(g, m.X(SH.x), m.Y(SH.y), m.X(j.aimX), m.Y(LANE), j.hit ? C.good : C.bad, 1.5);
            if (j.comp) { g.setLineDash([3, 3]); D.circle(g, m.X(j.tx), m.Y(LANE), R * m.s, null, col, 1.5); g.setLineDash([]); }
            D.text(g, j.hit ? (j.unfair ? GTL.L('명중(엄폐 뒤)', 'Hit (behind cover)') : GTL.L('명중', 'Hit')) : GTL.L('빗나감', 'Miss'), m.X(j.aimX), m.Y(LANE) - R * m.s - 14, { size: 10, color: j.hit ? C.good : C.bad, align: 'center' });
            g.globalAlpha = 1;
          }

          panel(g, p2, GTL.L('피격자 클라이언트 화면', 'Target client view'), U.hsl(340, 70, 65));
          m = fit(p2, WW, WH);
          scene(g, m, st.vClient.x, U.hsl(340, 70, 65));
          for (const h of st.vHits) {
            const a = Math.max(0, 1 - (st.now - h.t) / 900);
            g.globalAlpha = a;
            D.circle(g, m.X(h.x), m.Y(LANE), (R + 8 * (1 - a)) * m.s + 4, null, C.bad, 2.5);
            D.text(g, h.behind ? GTL.L('피격! (엄폐 뒤인데?)', 'Hit! (behind cover?)') : GTL.L('피격!', 'Hit!'), m.X(h.x), m.Y(LANE) + R * m.s + 6, { size: 11, color: C.bad, align: 'center' });
            g.globalAlpha = 1;
          }

          drawTimeline(g, L.tl, st.now, 1500, [
            { link: st.sDown, dir: -1, color: 'rgba(200,200,200,0.8)', lw: 1, dot: 2 },
            { link: st.sUp, dir: 1, color: C.warn, lw: 2, dot: 4 },
            { link: st.vDown, dir: -1, color: C.bad, lw: 2, dot: 4 },
          ], [GTL.L('클라', 'Client'), GTL.L('서버', 'Server')]);

          const rate = st.clientHits ? (st.serverHits / st.clientHits) * 100 : 0;
          const rw = st.rewinds.length ? st.rewinds.reduce((a, b) => a + b, 0) / st.rewinds.length : 0;
          ctx.stat(GTL.L('사수 화면 명중', 'Hits on shooter screen'), st.clientHits);
          ctx.stat(GTL.L('서버 인정 명중', 'Hits accepted by server'), st.serverHits);
          ctx.stat(GTL.L('서버 인정률', 'Server accept rate'), rate.toFixed(0) + ' %');
          ctx.stat(GTL.L('엄폐 뒤 피격', 'Hit behind cover'), st.unfair);
          ctx.stat(GTL.L('평균 되감기', 'Avg rewind'), rw.toFixed(0) + ' ms');
        },
        onAction(key) { if (key === 'restart') init(); },
      };
    },
  });
})();
