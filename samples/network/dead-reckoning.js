// 데드 레커닝(외삽) vs 보간, 그리고 보정 평활화 (Projective Velocity Blending)
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
    id: 'dead-reckoning',
    title: '데드 레커닝 / 외삽 (Dead Reckoning)',
    summary: '보간은 정확하지만 항상 과거를 보여줌. 외삽(데드 레커닝)은 마지막 위치와 속도로 "지금"을 추측해 지연 없음. 대신 급회전 때 빗나가고 새 스냅샷마다 튐. 이 튐은 속도 블렌딩으로 숨김.',
    views: { a: '보간 (렌더 지연)', b: '외삽 + 속도 블렌딩' },
    controls: '←↑→↓ / WASD: 주황/하늘색 차량을 그 방향으로 조향 (서버에 바로 반영된다고 가정)',
    info: `
      <p><b>외삽(데드 레커닝, dead reckoning)</b>: 마지막 스냅샷의 위치와 속도로 현재 위치를 추정하는 기법. 식은 <code>p = p₀ + v₀ × (t − t₀)</code>.</p>
      <p>왜 필요한가: <b>보간</b>은 받은 두 스냅샷 사이를 그려서 궤적이 정확함. 하지만 화면 속 엔티티는 <code>지연 + 보간 지연</code>만큼 과거에 있음.
      외삽은 이 지연이 없음. 관성이 큰 물체(직진하는 차량, 비행기, 배)에 잘 맞음.
      군사 시뮬레이션 표준(DIS, IEEE 1278)과 레이싱, 비행 게임에서 씀.</p>
      <p>보완 기법:</p>
      <ul>
        <li><b>Projective Velocity Blending</b>(Curtiss Murphy): 새 스냅샷이 오면 두 궤적을 <i>블렌딩 시간</i>에 걸쳐 섞음. 하나는 지금 보이는 위치와 속도에서 출발한 궤적, 하나는 새 스냅샷으로 외삽한 궤적. 그래서 튐 없이 수렴.</li>
        <li><b>임계값 기반 전송</b>(DIS 방식): 서버도 클라이언트와 같은 외삽 모델을 돌림. 오차가 임계값을 넘을 때만 상태를 보냄. 대역폭이 크게 줄어듦.</li>
      </ul>
      <p>단점: 방향을 바꾸면 추정이 빗나감. 새 스냅샷이 오면 화면 위치가 <b>순간이동</b>.</p>`,
    diagram: (L) => `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
      <defs><marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
      <path d="M30,160 L250,160 Q330,160 360,90 L378,46" class="d-dim"/>
      <text x="40" y="150" class="t-small t-dim">${L('실제 경로', 'true path')}</text>
      <line x1="250" y1="160" x2="400" y2="160" class="d-b" stroke-dasharray="5 4"/>
      <text x="325" y="176" text-anchor="middle" class="t-small t-mono t-b">p = p₀ + v₀ × t</text>
      <circle cx="250" cy="160" r="5" class="f-dim"/>
      <circle cx="150" cy="160" r="6" class="f-a"/>
      <circle cx="400" cy="160" r="6" class="f-b"/>
      <circle cx="372" cy="60" r="7" class="d-good"/>
      <text x="360" y="40" text-anchor="end" class="t-small">${L('실제 현재 위치', 'true position now')}</text>
      <path d="M404,152 Q414,100 380,64" class="d-b" stroke-dasharray="4 3" marker-end="url(#arrB)"/>
      <text x="414" y="104" class="t-small t-b">${L('속도 블렌딩으로', 'velocity blending')}</text>
      <text x="414" y="117" class="t-small t-b">${L('새 궤적에 수렴', 'joins the new path')}</text>
      <text x="150" y="192" text-anchor="middle" class="t-a">${L('A: 보간 (과거 위치)', 'A: interp (past)')}</text>
      <text x="250" y="192" text-anchor="middle" class="t-small">${L('스냅샷 p₀, v₀', 'snapshot p₀, v₀')}</text>
      <text x="440" y="192" text-anchor="middle" class="t-b">${L('B: 외삽 위치', 'B: extrapolated')}</text>
      <text x="4" y="16" class="t-small t-dim">${L('외삽은 지연이 없지만 회전하면 빗나감. 새 스냅샷이 오면 튀는 대신 섞어서 따라감', 'Extrapolation has no delay but misses on turns. On a new snapshot it blends instead of jumping')}</text>
    </svg>`,
    look: [
      '녹색 고스트(실제 현재 위치)와 비교하면, A는 항상 뒤처짐. B는 직선 구간에서 고스트와 겹침.',
      'B의 표시 방식을 "외삽 (즉시 스냅)"으로 바꾸면 스냅샷마다 차량이 툭툭 튐. "최대 튐" 수치가 커짐.',
      '"봇 기동성"을 올리면 외삽이 회전 바깥으로 빗나가는 오버슈트가 커짐. 보간은 영향을 받지 않음.',
      '"임계값 기반 전송"을 켜고 봇 기동성을 0~0.5로 낮추면 직진 중에는 패킷이 거의 안 나감(하단 타임라인). "전송 패킷/초" 수치가 줄어듦.',
    ],
    refs: [
      { type: 'book', title: 'Believable Dead Reckoning for Networked Games', year: 2011, note: 'Curtiss Murphy, Game Engine Gems 2. Projective Velocity Blending.' },
      { type: 'article', title: 'Dead Reckoning: Latency Hiding for Networked Games', year: 1997, note: 'Jesse Aronson, Gamasutra.' },
      { type: 'paper', title: 'IEEE 1278.1 - Distributed Interactive Simulation (DIS) Application Protocols', note: '데드 레커닝 알고리즘과 임계값 기반 갱신을 표준화' },
      { type: 'article', title: 'Fast-Paced Multiplayer (Part III): Entity Interpolation', url: 'https://www.gabrielgambetta.com/entity-interpolation.html', note: 'Gabriel Gambetta. 외삽(dead reckoning)과 보간 비교.' },
      { type: 'article', title: 'Snapshot Interpolation', url: 'https://gafferongames.com/post/snapshot_interpolation/', note: 'Glenn Fiedler. 외삽이 물리 객체에서 깨지는 이유.' },
    ],
    params: [
      { key: 'lat', label: '편도 지연 (ms)', type: 'int', min: 0, max: 400, default: 100, shared: true, group: '네트워크' },
      { key: 'jitter', label: '지터 (ms)', type: 'int', min: 0, max: 150, default: 20, shared: true },
      { key: 'loss', label: '패킷 손실률', type: 'range', min: 0, max: 0.3, step: 0.01, default: 0.03, shared: true },
      { key: 'sendHz', label: '전송률 (Hz)', type: 'int', min: 2, max: 60, default: 10, shared: true },
      { key: 'auto', label: '자동 입력', type: 'bool', default: true, shared: true, group: '장면' },
      { key: 'agility', label: '봇 기동성 (rad/s)', type: 'range', min: 0, max: 5, step: 0.1, default: 2, shared: true, help: '봇 차량의 최대 회전 속도' },
      { key: 'mode', label: '표시 방식', type: 'select', group: '기법', options: [
        { value: 'interp', label: '보간' },
        { value: 'extrap', label: '외삽 (즉시 스냅)' },
        { value: 'blend', label: '외삽 + 속도 블렌딩' },
      ], a: 'interp', b: 'blend' },
      { key: 'delay', label: '보간 지연 (ms)', type: 'int', min: 0, max: 400, default: 200, when: (p) => p.mode === 'interp' },
      { key: 'blendMs', label: '블렌딩 시간 (ms)', type: 'int', min: 20, max: 600, default: 200, when: (p) => p.mode === 'blend' },
      { key: 'thresh', label: '임계값 기반 전송 (DIS)', type: 'bool', default: false, help: '서버의 외삽 오차가 임계값을 넘을 때만 전송 (하트비트는 최소 1초마다)' },
      { key: 'threshU', label: '전송 임계 오차 (u)', type: 'range', min: 1, max: 40, step: 1, default: 15, when: (p) => p.thresh },
      { key: 'ghost', label: '실제 위치 고스트', type: 'bool', default: true },
      { key: 'restart', label: '다시 시작', type: 'button' },
    ],
    en: {
      title: 'Dead Reckoning (Extrapolation)',
      summary: 'Interpolation is accurate but always shows the past. Extrapolation (dead reckoning) guesses "now" from the last position and velocity, so it has no delay. But it misses on sharp turns and jumps on each new snapshot. Velocity blending hides these jumps.',
      views: { a: 'Interpolation (render delay)', b: 'Extrapolation + velocity blending' },
      controls: 'Arrow keys / WASD: steer the orange/sky blue car in that direction (assume the server applies it at once)',
      info: `
      <p><b>Extrapolation (dead reckoning)</b> estimates the current position from the position and velocity in the last snapshot. The formula is <code>p = p₀ + v₀ × (t − t₀)</code>.</p>
      <p>Why you need it: <b>interpolation</b> draws between two received snapshots, so the path is accurate. But the entity on screen is in the past by <code>latency + interpolation delay</code>.
      Extrapolation has no such delay. It fits objects with high inertia (cars driving straight, planes, ships).
      The military simulation standard (DIS, IEEE 1278) and racing and flight games use it.</p>
      <p>Supporting techniques:</p>
      <ul>
        <li><b>Projective Velocity Blending</b> (Curtiss Murphy): when a new snapshot arrives, mix two paths over the <i>blend time</i>. One path starts from the position and velocity you see now. The other is extrapolated from the new snapshot. So the car converges without a jump.</li>
        <li><b>Threshold-based sending</b> (DIS style): the server runs the same extrapolation model as the client. It sends state only when the error goes over a threshold. This cuts bandwidth a lot.</li>
      </ul>
      <p>Downside: the estimate misses when the object changes direction. When a new snapshot arrives, the position on screen <b>teleports</b>.</p>`,
      look: [
        'Compare with the green ghost (true current position). A always lags behind. B overlaps the ghost on straight sections.',
        'Switch B\'s display mode to "Extrapolation (instant snap)". The car jerks on every snapshot. The "Max jump" value grows.',
        'Raise "Bot agility". Extrapolation overshoots to the outside of turns more. Interpolation is not affected.',
        'Turn on "Threshold-based sending" and lower bot agility to 0~0.5. Almost no packets go out while cars drive straight (see the bottom timeline). The "Packets sent/s" value drops.',
      ],
      refs: [
        'Curtiss Murphy, Game Engine Gems 2. Projective Velocity Blending.',
        'Jesse Aronson, Gamasutra.',
        'Standardizes dead reckoning algorithms and threshold-based updates.',
        'Gabriel Gambetta. Compares extrapolation (dead reckoning) with interpolation.',
        'Glenn Fiedler. Why extrapolation breaks for physics objects.',
      ],
      params: {
        lat: { label: 'One-way latency (ms)', group: 'Network' },
        jitter: 'Jitter (ms)',
        loss: 'Packet loss rate',
        sendHz: 'Send rate (Hz)',
        auto: { label: 'Auto input', group: 'Scene' },
        agility: { label: 'Bot agility (rad/s)', help: 'Max turn rate of the bot cars' },
        mode: { label: 'Display mode', group: 'Technique', options: { interp: 'Interpolation', extrap: 'Extrapolation (instant snap)', blend: 'Extrapolation + velocity blending' } },
        delay: 'Interpolation delay (ms)',
        blendMs: 'Blend time (ms)',
        thresh: { label: 'Threshold-based sending (DIS)', help: 'Send only when the server\'s extrapolation error goes over the threshold (heartbeat at least every 1 s)' },
        threshU: 'Send error threshold (u)',
        ghost: 'True position ghost',
        restart: 'Restart',
      },
    },

    setup(ctx) {
      const P = ctx.params;
      const WW = 400, WH = 260, N = 3;
      let st, seed;
      function init() {
        ctx.rng = U.rng(ctx.seed);
        seed = ctx.rng.int(1, 1e9);
        st = {
          now: 0, tick: 0, acc: 0, sendAcc: 0, down: new Link(seed, 2),
          cars: [
            { x: 200, y: 200, h: 0, v: 0 },
            { x: 80, y: 60, h: 0.3, v: 120 },
            { x: 320, y: 120, h: 2.5, v: 140 },
          ],
          sentModel: null, lastSendT: -1e9,
          buf: [], age: null, latest: null, blend: null, disp: [], dispV: [], trails: [[], [], []],
          errHist: [], jumpHist: [], sendTimes: [],
        };
        st.disp = st.cars.map((c) => ({ x: c.x, y: c.y }));
        st.dispV = st.cars.map(() => ({ x: 0, y: 0 }));
      }
      init();

      const vel = (c) => ({ x: Math.cos(c.h) * c.v, y: Math.sin(c.h) * c.v });
      function simCar(c, i, dt) {
        if (i === 0) {
          const m = getMove(ctx, st.now);
          if (m.x || m.y) {
            const want = Math.atan2(m.y, m.x);
            c.h += U.clamp(U.angleDiff(c.h, want), -3.5 * dt, 3.5 * dt);
            c.v = U.approach(c.v, 150, 300 * dt);
          } else c.v = U.approach(c.v, 0, 250 * dt);
        } else {
          const block = Math.floor(st.now / 650);
          let steer = (hash01(seed, 10 + i, block) * 2 - 1) * P.agility;
          // 벽 근처에서는 중앙으로 회전
          const m = 35;
          if (c.x < m || c.x > WW - m || c.y < m || c.y > WH - m) {
            const want = Math.atan2(WH / 2 - c.y, WW / 2 - c.x);
            steer = U.clamp(U.angleDiff(c.h, want) * 4, -3, 3);
          }
          c.h += steer * dt;
        }
        c.x = U.clamp(c.x + Math.cos(c.h) * c.v * dt, 8, WW - 8);
        c.y = U.clamp(c.y + Math.sin(c.h) * c.v * dt, 8, WH - 8);
      }
      const snapOf = (t) => ({ t, e: st.cars.map((c) => { const v = vel(c); return { x: c.x, y: c.y, vx: v.x, vy: v.y }; }) });
      const extrap = (e, dtMs) => ({ x: e.x + (e.vx * dtMs) / 1000, y: e.y + (e.vy * dtMs) / 1000 });

      function tick() {
        st.now += STEP; st.tick++;
        const dt = STEP / 1000;
        const net = { lat: P.lat, jit: P.jitter, loss: P.loss };
        st.cars.forEach((c, i) => simCar(c, i, dt));

        // 서버 전송 결정
        st.sendAcc += STEP;
        let send = false;
        if (P.thresh) {
          if (!st.sentModel || st.now - st.lastSendT >= 1000) send = true;
          else {
            const dtm = st.now - st.sentModel.t;
            for (let i = 0; i < N; i++) {
              const pr = extrap(st.sentModel.e[i], dtm);
              if (Math.hypot(pr.x - st.cars[i].x, pr.y - st.cars[i].y) > P.threshU) { send = true; break; }
            }
          }
          st.sendAcc = 0;
        } else {
          const iv = 1000 / P.sendHz;
          if (st.sendAcc >= iv) { st.sendAcc = Math.min(st.sendAcc - iv, iv); send = true; }
        }
        if (send) {
          const s = snapOf(st.now);
          st.sentModel = s; st.lastSendT = st.now;
          st.down.send(st.now, st.tick, s, net, 28 + N * 16);
          st.sendTimes.push(st.now);
        }
        while (st.sendTimes.length && st.sendTimes[0] < st.now - 2000) st.sendTimes.shift();

        // 클라이언트 수신
        for (const p of st.down.poll(st.now)) {
          const s = p.data;
          const age = st.now - s.t;
          st.age = st.age === null ? age : U.lerp(st.age, age, 0.1);
          let i = st.buf.length;
          while (i > 0 && st.buf[i - 1].t > s.t) i--;
          st.buf.splice(i, 0, s);
          if (!st.latest || s.t > st.latest.t) {
            st.latest = s;
            // 블렌딩 시작점 = 지금 화면에 보이는 위치와 속도
            st.blend = { t: st.now, p0: st.disp.map((d) => ({ ...d })), v0: st.dispV.map((v) => ({ ...v })) };
          }
        }
        while (st.buf.length > 2 && st.buf[1].t < st.now - 1500) st.buf.shift();

        const prev = st.disp.map((d) => ({ ...d }));
        const est = st.now - (st.age ?? 0);
        if (st.latest) {
          if (P.mode === 'interp') {
            const rt = est - P.delay;
            const k = st.buf.findIndex((s) => s.t > rt);
            st.disp = st.cars.map((_, j) => {
              if (k === -1) return { x: st.buf[st.buf.length - 1].e[j].x, y: st.buf[st.buf.length - 1].e[j].y };
              if (k === 0) return { x: st.buf[0].e[j].x, y: st.buf[0].e[j].y };
              const a = st.buf[k - 1].e[j], b = st.buf[k].e[j], f = U.clamp((rt - st.buf[k - 1].t) / (st.buf[k].t - st.buf[k - 1].t), 0, 1);
              return { x: U.lerp(a.x, b.x, f), y: U.lerp(a.y, b.y, f) };
            });
          } else {
            const L = st.latest, tau = U.clamp(est - L.t, 0, 600); // 외삽 상한
            st.disp = L.e.map((e, j) => {
              const target = extrap(e, tau);
              if (P.mode !== 'blend' || !st.blend) return target;
              const bt = st.now - st.blend.t, f = U.clamp(bt / P.blendMs, 0, 1);
              if (f >= 1) return target;
              const v0 = st.blend.v0[j], vb = { x: U.lerp(v0.x, e.vx, f), y: U.lerp(v0.y, e.vy, f) };
              const pt = { x: st.blend.p0[j].x + (vb.x * bt) / 1000, y: st.blend.p0[j].y + (vb.y * bt) / 1000 };
              return { x: U.lerp(pt.x, target.x, f), y: U.lerp(pt.y, target.y, f) };
            });
          }
        }
        st.dispV = st.disp.map((d, j) => ({ x: (d.x - prev[j].x) / dt, y: (d.y - prev[j].y) / dt }));
        st.disp.forEach((d, j) => { st.trails[j].push(d); if (st.trails[j].length > 45) st.trails[j].shift(); });
        let err = 0, jump = 0;
        st.cars.forEach((c, j) => {
          err += Math.hypot(c.x - st.disp[j].x, c.y - st.disp[j].y);
          // 튐 = 한 틱 이동량 중 차량 최고 속도로 설명할 수 없는 부분
          jump = Math.max(jump, Math.hypot(st.disp[j].x - prev[j].x, st.disp[j].y - prev[j].y) - 160 * dt);
        });
        st.errHist.push(err / N); if (st.errHist.length > 180) st.errHist.shift();
        st.jumpHist.push(Math.max(0, jump)); if (st.jumpHist.length > 180) st.jumpHist.shift();
      }

      function arena(g, m) {
        D.rect(g, m.ox, m.oy, m.w, m.h, null, 'rgba(255,255,255,0.15)');
        D.grid(g, m.w, m.h, 40 * m.s, C.grid, m.ox, m.oy);
      }
      function car(g, m, x, y, h, fill, stroke) {
        const s = m.s, cx = m.X(x), cy = m.Y(y), c = Math.cos(h), n = Math.sin(h);
        const pts = [[13, 0], [-9, 7], [-6, 0], [-9, -7]].map(([a, b]) => ({ x: cx + (a * c - b * n) * s, y: cy + (a * n + b * c) * s }));
        D.poly(g, pts, fill, stroke, 1.5);
      }
      const carCol = (i, col) => (i === 0 ? col : U.hsl(i === 1 ? 50 : 280, 70, 65));

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

          panel(g, p0, GTL.L('서버 (실제)', 'Server (true)'), C.good);
          let m = fit(p0, WW, WH); arena(g, m);
          st.cars.forEach((c, i) => car(g, m, c.x, c.y, c.h, carCol(i, col)));

          panel(g, p1, GTL.L('관찰자 클라이언트 화면', 'Observer client view'), col);
          m = fit(p1, WW, WH); arena(g, m);
          // 받은 스냅샷 위치 + 외삽 벡터
          for (const s of st.buf) s.e.forEach((e) => D.circle(g, m.X(e.x), m.Y(e.y), 1.8, 'rgba(255,255,255,0.35)'));
          if (st.latest && P.mode !== 'interp') st.latest.e.forEach((e) => D.arrow(g, m.X(e.x), m.Y(e.y), m.X(e.x + e.vx * 0.3), m.Y(e.y + e.vy * 0.3), 'rgba(255,203,107,0.6)', 1, 5));
          g.globalAlpha = 0.4;
          st.trails.forEach((tr, j) => { if (tr.length > 1) D.poly(g, tr.map((d) => ({ x: m.X(d.x), y: m.Y(d.y) })), null, carCol(j, col), 1, false); });
          g.globalAlpha = 1;
          if (P.ghost) st.cars.forEach((c) => car(g, m, c.x, c.y, c.h, null, C.good));
          st.disp.forEach((d, j) => {
            const v = st.dispV[j], h = Math.hypot(v.x, v.y) > 5 ? Math.atan2(v.y, v.x) : st.cars[j].h;
            car(g, m, d.x, d.y, h, carCol(j, col));
          });

          panel(g, p2, GTL.L('오차 & 튐', 'Error & jumps'), C.dim);
          const bx = p2.x + 6, bw = p2.w - 12, top = p2.y + 22, hh = Math.max(16, (p2.h - 30) / 2 - 4);
          D.plot(g, st.errHist, bx, top, bw, hh, { min: 0, max: 60, color: C.warn, label: GTL.L('현재 위치 오차 (u)', 'Current position error (u)') });
          D.plot(g, st.jumpHist, bx, top + hh + 6, bw, hh, { min: 0, max: 20, color: C.bad, label: GTL.L('화면 튐 (u/틱)', 'Screen jump (u/tick)') });

          drawTimeline(g, L.tl, st.now, 2000, [{ link: st.down, dir: 1, color: col, lw: 1.5, dot: 3.5 }], [GTL.L('서버', 'Server'), GTL.L('관찰자', 'Viewer')]);

          const avgE = st.errHist.length ? st.errHist.reduce((a, b) => a + b, 0) / st.errHist.length : 0;
          ctx.stat(GTL.L('현재 위치 오차(평균)', 'Position error (avg)'), avgE.toFixed(1) + ' u');
          ctx.stat(GTL.L('최대 튐 (3초)', 'Max jump (3 s)'), (st.jumpHist.length ? Math.max(...st.jumpHist) : 0).toFixed(1) + ' u');
          ctx.stat(GTL.L('전송 패킷/초', 'Packets sent/s'), (st.sendTimes.length / 2).toFixed(1));
        },
        onAction(key) { if (key === 'restart') init(); },
      };
    },
  });
})();
