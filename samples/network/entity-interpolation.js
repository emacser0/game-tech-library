// 엔티티 보간 (Entity Interpolation) vs 최신 스냅샷 그대로 표시
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
    id: 'entity-interpolation',
    title: '엔티티 보간 (Entity Interpolation)',
    summary: '원격 엔티티를 받은 스냅샷 위치에 바로 그리면 전송 주기마다 뚝뚝 끊김. 일부러 조금 과거(렌더 지연)를 그리며 두 스냅샷 사이를 보간하면 부드러워짐.',
    views: { a: '최신 스냅샷 그대로', b: '보간 (렌더 지연 버퍼)' },
    controls: '←↑→↓ / WASD: 원격 플레이어(큰 원) 조종. 이 입력은 서버에 바로 들어간다고 가정',
    info: `
      <p><b>엔티티 보간</b>: 원격 엔티티를 조금 과거 시각에 그리면서, 받은 두 스냅샷 사이를 이어 그리는 기법</p>
      <p>서버는 스냅샷을 초당 수십 번 이하로만 보냄. 관찰자 클라이언트가 <b>가장 최근 스냅샷 위치</b>를 그대로 그리면 문제가 생김.</p>
      <ul>
        <li>엔티티가 전송 주기마다 순간이동</li>
        <li>지터나 손실이 있으면 간격까지 들쭉날쭉해짐</li>
      </ul>
      <p>동작 원리:</p>
      <ul>
        <li>렌더 시각을 <code>추정 서버 시각 − 보간 지연</code>으로 둠</li>
        <li>렌더 시각을 감싸는 두 스냅샷 사이를 선형 보간</li>
        <li>보간 지연이 전송 간격의 2배 이상이면 스냅샷 하나를 잃어도 다음 스냅샷으로 이어 붙임(Source 엔진 기본 100ms, <code>cl_interp_ratio 2</code>)</li>
        <li>버퍼에 렌더 시각 이후의 스냅샷이 없으면(언더런) 마지막 위치에서 멈춤(빨간 표시)</li>
      </ul>
      <p>단점: <b>원격 엔티티를 항상 과거 모습으로 봄</b>. 이 지연은 랙 보상에서 서버가 되감아 맞춤.</p>`,
    diagram: (L) => `<svg viewBox="0 0 540 180" xmlns="http://www.w3.org/2000/svg">
      <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
      <text x="4" y="84" class="t-dim">${L('시간', 'time')}</text>
      <line x1="50" y1="80" x2="530" y2="80" class="d-dim"/>
      <line x1="290" y1="80" x2="360" y2="80" class="d-b"/>
      ${[80, 150, 220, 290, 360, 430].map((x, i) => `<circle cx="${x}" cy="80" r="4" class="f-dim"/><text x="${x}" y="98" text-anchor="middle" class="t-small t-mono t-dim">S${i + 1}</text>`).join('')}
      <circle cx="430" cy="80" r="5" class="f-a"/>
      <line x1="430" y1="48" x2="430" y2="72" class="d-a"/>
      <text x="430" y="42" text-anchor="middle" class="t-a">${L('A: 최신 스냅샷', 'A: latest snapshot')}</text>
      <line x1="325" y1="58" x2="325" y2="104" class="d-b" stroke-dasharray="3 3"/>
      <circle cx="325" cy="80" r="5" class="f-b"/>
      <text x="325" y="118" text-anchor="middle" class="t-b">${L('B: 렌더 시각에서 S4, S5 보간', 'B: blend S4 and S5 at render time')}</text>
      <line x1="495" y1="58" x2="495" y2="104" class="d-accent" stroke-dasharray="4 3"/>
      <text x="495" y="52" text-anchor="middle" class="t-small">${L('현재', 'now')}</text>
      <path d="M327,138 L493,138" class="d-accent" marker-start="url(#arr)" marker-end="url(#arr)"/>
      <text x="410" y="154" text-anchor="middle" class="t-small">${L('보간 지연 (전송 간격 × 2)', 'interp delay (send interval × 2)')}</text>
      <text x="4" y="174" class="t-small t-dim">${L('렌더 시각 뒤에 스냅샷이 둘 있어 하나를 잃어도 보간이 이어짐', 'Two snapshots wait past render time, so one lost packet does not break the blend')}</text>
    </svg>`,
    look: [
      '두 뷰의 궤적 점을 비교하면, A는 점이 뭉쳤다 벌어졌다 함(끊김). B는 점 간격이 고름.',
      'B에서 보간 지연을 전송 간격(1000/전송률)보다 작게 내리면 언더런이 늘어 B도 멈칫거림. 손실률을 올리면 더 심해짐.',
      '"스냅샷 버퍼" 패널에서 노란 선(렌더 시각)을 보면, 흰 막대(받은 스냅샷) 두 개 사이에 있을 때만 움직임이 부드러움',
      '서버(녹색 고스트)와 화면 사이 거리를 비교하면, B의 "표시 지연"이 A보다 보간 지연만큼 큼',
    ],
    refs: [
      { type: 'article', title: 'Fast-Paced Multiplayer (Part III): Entity Interpolation', url: 'https://www.gabrielgambetta.com/entity-interpolation.html', note: 'Gabriel Gambetta.' },
      { type: 'article', title: 'Snapshot Interpolation', url: 'https://gafferongames.com/post/snapshot_interpolation/', note: 'Glenn Fiedler. 보간 버퍼 크기와 손실 내성.' },
      { type: 'engine', title: 'Source Multiplayer Networking - Entity interpolation', url: 'https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking', note: 'Valve. cl_interp, cl_interp_ratio, 100ms 기본 보간.' },
      { type: 'engine', title: 'Interpolation (Valve Developer Wiki)', note: 'Source 엔진 보간 설정 문서' },
    ],
    params: [
      { key: 'lat', label: '편도 지연 (ms)', type: 'int', min: 0, max: 400, default: 80, shared: true, group: '네트워크' },
      { key: 'jitter', label: '지터 (ms)', type: 'int', min: 0, max: 150, default: 30, shared: true },
      { key: 'loss', label: '패킷 손실률', type: 'range', min: 0, max: 0.3, step: 0.01, default: 0.05, shared: true },
      { key: 'sendHz', label: '스냅샷 전송률 (Hz)', type: 'int', min: 2, max: 60, default: 12, shared: true },
      { key: 'auto', label: '자동 입력', type: 'bool', default: true, shared: true, group: '장면' },
      { key: 'mode', label: '표시 방식', type: 'select', group: '기법', options: [
        { value: 'raw', label: '최신 스냅샷' },
        { value: 'interp', label: '보간' },
      ], a: 'raw', b: 'interp' },
      { key: 'delay', label: '보간 지연 (ms)', type: 'int', min: 0, max: 400, default: 170, when: (p) => p.mode === 'interp', help: '권장: 전송 간격 × 2 이상' },
      { key: 'ghost', label: '실제 서버 위치 고스트', type: 'bool', default: true },
      { key: 'restart', label: '다시 시작', type: 'button' },
    ],
    en: {
      title: 'Entity Interpolation',
      summary: 'If you draw a remote entity right at each snapshot position, it jumps at every send interval. Draw a little in the past (render delay) and interpolate between two snapshots. Motion becomes smooth.',
      views: { a: 'Latest snapshot as is', b: 'Interpolation (render delay buffer)' },
      controls: 'Arrow keys / WASD: move the remote player (big circle). Assume this input goes straight to the server.',
      info: `
      <p><b>Entity interpolation</b> draws a remote entity at a time slightly in the past. It draws the path between two received snapshots.</p>
      <p>The server sends snapshots only a few dozen times per second or less. Problems appear if the observer client draws the <b>latest snapshot position</b> as is.</p>
      <ul>
        <li>The entity teleports at every send interval.</li>
        <li>With jitter or loss, the gaps also become uneven.</li>
      </ul>
      <p>How it works:</p>
      <ul>
        <li>Set the render time to <code>estimated server time − interpolation delay</code>.</li>
        <li>Linearly interpolate between the two snapshots around the render time.</li>
        <li>If the interpolation delay is at least 2 times the send interval, a single lost snapshot is bridged by the next one (Source engine default 100ms, <code>cl_interp_ratio 2</code>).</li>
        <li>If the buffer has no snapshot after the render time (underrun), the entity stops at its last position (red label).</li>
      </ul>
      <p>Downside: <b>you always see remote entities in the past</b>. With lag compensation, the server rewinds to match this delay.</p>`,
      look: [
        'Compare the trail dots in both views. In A, dots bunch up and spread out (stutter). In B, dot spacing stays even.',
        'In B, lower the interpolation delay below the send interval (1000/send rate). Underruns increase and B also stutters. Raising packet loss makes it worse.',
        'Watch the yellow line (render time) in the "Snapshot buffer" panel. Motion is smooth only while it sits between two white bars (received snapshots).',
        'Compare the distance between the server (green ghost) and the screen. B\'s "Display delay" is larger than A\'s by the interpolation delay.',
      ],
      refs: [
        'Gabriel Gambetta.',
        'Glenn Fiedler. Interpolation buffer size and loss tolerance.',
        'Valve. cl_interp, cl_interp_ratio, 100ms default interpolation.',
        'Source engine interpolation settings.',
      ],
      params: {
        lat: { label: 'One-way latency (ms)', group: 'Network' },
        jitter: 'Jitter (ms)',
        loss: 'Packet loss rate',
        sendHz: 'Snapshot send rate (Hz)',
        auto: { label: 'Auto input', group: 'Scene' },
        mode: { label: 'Display mode', group: 'Technique', options: { raw: 'Latest snapshot', interp: 'Interpolation' } },
        delay: { label: 'Interpolation delay (ms)', help: 'Recommended: send interval × 2 or more' },
        ghost: 'True server position ghost',
        restart: 'Restart',
      },
    },

    setup(ctx) {
      const P = ctx.params;
      const WW = 400, WH = 260, SPEED = 170;
      const N_BOT = 4;
      let st;
      const botPos = (i, t) => {
        const s = t / 1000;
        if (i === 0) return { x: 200 + Math.cos(s * 1.6) * 150, y: 130 + Math.sin(s * 1.6) * 90 };
        if (i === 1) return { x: 200 + Math.sin(s * 1.1) * 170, y: 130 + Math.sin(s * 2.2) * 60 };
        if (i === 2) { const u = (s * 0.9) % 2; const tri = u < 1 ? u : 2 - u; return { x: 30 + tri * 340, y: 40 + Math.abs(Math.sin(s * 3)) * 40 }; }
        return { x: 70 + Math.cos(s * 2.6) * 40, y: 200 + Math.sin(s * 2.6) * 40 };
      };
      function init() {
        ctx.rng = U.rng(ctx.seed);
        const ls = ctx.rng.int(1, 1e9);
        st = {
          now: 0, tick: 0, acc: 0, sendAcc: 0, down: new Link(ls, 2),
          player: { x: 200, y: 200 }, buf: [], age: null, rt: 0,
          disp: [], trails: [], under: 0, underHist: [], latHist: [], speed: [], lastSnapT: -1,
        };
        for (let i = 0; i <= N_BOT; i++) st.trails.push([]);
      }
      init();

      const serverEnts = (t) => [{ x: st.player.x, y: st.player.y }, ...Array.from({ length: N_BOT }, (_, i) => botPos(i, t))];

      function tick() {
        st.now += STEP; st.tick++;
        const dt = STEP / 1000;
        const net = { lat: P.lat, jit: P.jitter, loss: P.loss };
        const m = getMove(ctx, st.now);
        const l = Math.hypot(m.x, m.y) || 1;
        st.player.x = U.clamp(st.player.x + (m.x / l) * SPEED * dt, 12, WW - 12);
        st.player.y = U.clamp(st.player.y + (m.y / l) * SPEED * dt, 12, WH - 12);

        st.sendAcc += STEP;
        const iv = 1000 / P.sendHz;
        if (st.sendAcc >= iv) {
          st.sendAcc = Math.min(st.sendAcc - iv, iv);
          st.down.send(st.now, st.tick, { t: st.now, ents: serverEnts(st.now) }, net, 28 + 8 * (N_BOT + 1));
        }
        for (const p of st.down.poll(st.now)) {
          const s = p.data;
          // 클라이언트는 스냅샷 타임스탬프만 안다: "도착 시각 - 서버 시각"의 평균으로 서버 시계를 추정
          const age = st.now - s.t;
          st.age = st.age === null ? age : U.lerp(st.age, age, 0.1);
          let i = st.buf.length;
          while (i > 0 && st.buf[i - 1].t > s.t) i--;
          st.buf.splice(i, 0, s);
          st.lastSnapT = Math.max(st.lastSnapT, s.t);
        }
        const estServer = st.now - (st.age ?? 0);
        let under = false, shown;
        if (!st.buf.length) shown = serverEnts(0).map(() => ({ x: -100, y: -100 }));
        else if (P.mode === 'raw') {
          const last = st.buf[st.buf.length - 1];
          shown = last.ents; st.rt = last.t;
        } else {
          const rt = estServer - P.delay;
          st.rt = rt;
          let k = st.buf.findIndex((s) => s.t > rt);
          if (k === -1) { shown = st.buf[st.buf.length - 1].ents; under = true; }
          else if (k === 0) shown = st.buf[0].ents;
          else {
            const a = st.buf[k - 1], b = st.buf[k], f = U.clamp((rt - a.t) / (b.t - a.t), 0, 1);
            shown = a.ents.map((e, j) => ({ x: U.lerp(e.x, b.ents[j].x, f), y: U.lerp(e.y, b.ents[j].y, f) }));
          }
        }
        while (st.buf.length > 2 && st.buf[1].t < st.rt - 500) st.buf.shift();
        const prev = st.disp[0];
        st.disp = shown.map((e) => ({ x: e.x, y: e.y }));
        st.disp.forEach((e, i) => { st.trails[i].push(e); if (st.trails[i].length > 40) st.trails[i].shift(); });
        st.under = under;
        st.underHist.push(under ? 1 : 0); if (st.underHist.length > 300) st.underHist.shift();
        if (st.buf.length) { st.latHist.push(st.now - st.rt); if (st.latHist.length > 120) st.latHist.shift(); }
        if (prev && prev.x > -50) {
          st.speed.push(Math.min(SPEED * 3, Math.hypot(st.disp[0].x - prev.x, st.disp[0].y - prev.y) / dt));
          if (st.speed.length > 180) st.speed.shift();
        }
      }

      function arena(g, m) {
        D.rect(g, m.ox, m.oy, m.w, m.h, null, 'rgba(255,255,255,0.15)');
        D.grid(g, m.w, m.h, 40 * m.s, C.grid, m.ox, m.oy);
      }
      function ents(g, m, list, col, ghost) {
        list.forEach((e, i) => {
          const r = (i === 0 ? 11 : 7) * m.s;
          if (ghost) D.circle(g, m.X(e.x), m.Y(e.y), r, null, C.good, 1.2);
          else D.circle(g, m.X(e.x), m.Y(e.y), r, i === 0 ? col : U.hsl(200 + i * 35, 60, 65));
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
          const truth = serverEnts(st.now);

          panel(g, p0, GTL.L('서버 (실제 위치)', 'Server (true position)'), C.good);
          let m = fit(p0, WW, WH); arena(g, m);
          ents(g, m, truth, C.good);

          panel(g, p1, GTL.L('관찰자 클라이언트 화면', 'Observer client view'), col);
          m = fit(p1, WW, WH); arena(g, m);
          if (P.ghost) ents(g, m, truth, col, true);
          st.trails.forEach((tr) => tr.forEach((e, i) => D.circle(g, m.X(e.x), m.Y(e.y), 1.6, `rgba(255,255,255,${0.08 + (i / tr.length) * 0.4})`)));
          ents(g, m, st.disp, col);
          if (st.under) D.text(g, GTL.L('버퍼 언더런, 정지', 'Buffer underrun, frozen'), p1.x + p1.w - 6, p1.y + 5, { size: 10, color: C.bad, align: 'right' });

          // 스냅샷 버퍼
          panel(g, p2, GTL.L('스냅샷 버퍼 (서버 시각축)', 'Snapshot buffer (server time)'), C.dim);
          const bx = p2.x + 8, bw = p2.w - 16, by = p2.y + 26, bh = 34;
          const est = st.now - (st.age ?? 0), t0 = est - 700, tx = (t) => bx + ((t - t0) / 800) * bw;
          D.rect(g, bx, by, bw, bh, 'rgba(0,0,0,0.3)');
          for (const s of st.buf) if (s.t >= t0) D.rect(g, tx(s.t) - 1.5, by + 4, 3, bh - 8, 'rgba(255,255,255,0.75)');
          D.line(g, tx(est), by - 2, tx(est), by + bh + 2, C.good, 1.5);
          D.line(g, tx(st.rt), by - 4, tx(st.rt), by + bh + 4, C.warn, 2);
          D.text(g, GTL.L('렌더', 'Render'), tx(st.rt), by + bh + 4, { size: 9, color: C.warn, align: 'center' });
          D.text(g, GTL.L('서버(추정)', 'Server (est.)'), Math.min(tx(est), bx + bw - 20), by - 13, { size: 9, color: C.good, align: 'center' });
          const gy = by + bh + 20, gh = Math.max(16, p2.y + p2.h - gy - 6);
          D.plot(g, st.speed, bx, gy, bw, gh, { min: 0, max: SPEED * 3, color: col, label: GTL.L('원격 플레이어 화면 속도', 'Remote player screen speed') });
          D.line(g, bx, gy + gh - (SPEED / (SPEED * 3)) * gh, bx + bw, gy + gh - (SPEED / (SPEED * 3)) * gh, 'rgba(102,209,122,0.35)', 1);

          drawTimeline(g, L.tl, st.now, 2000, [{ link: st.down, dir: 1, color: col, lw: 1.5, dot: 3.5 }], [GTL.L('서버', 'Server'), GTL.L('관찰자', 'Viewer')]);

          const lat = st.latHist.length ? st.latHist.reduce((a, b) => a + b, 0) / st.latHist.length : 0;
          const ur = st.underHist.length ? st.underHist.reduce((a, b) => a + b, 0) / st.underHist.length : 0;
          let err = 0;
          for (let i = 0; i < truth.length; i++) if (st.disp[i]) err += Math.hypot(truth[i].x - st.disp[i].x, truth[i].y - st.disp[i].y);
          ctx.stat(GTL.L('표시 지연 (서버 대비)', 'Display delay (vs server)'), lat.toFixed(0) + ' ms');
          ctx.stat(GTL.L('전송 간격', 'Send interval'), (1000 / P.sendHz).toFixed(0) + ' ms');
          ctx.stat(GTL.L('언더런 비율', 'Underrun rate'), (ur * 100).toFixed(1) + ' %');
          ctx.stat(GTL.L('현재 위치 오차(평균)', 'Current position error (avg)'), (err / truth.length).toFixed(1) + ' u');
        },
        onAction(key) { if (key === 'restart') init(); },
      };
    },
  });
})();
