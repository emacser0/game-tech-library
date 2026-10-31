// 우선순위 누적기 (Priority Accumulator) vs 라운드 로빈, 패킷당 갱신 개수가 제한된 상황
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
    id: 'priority-accumulator',
    title: '우선순위 누적기 (Priority Accumulator)',
    summary: '대역폭 제한으로 패킷마다 물체 몇 개만 보낼 수 있을 때, 차례대로 보내면 멈춘 물체에 자리를 낭비함. 움직이는 물체일수록 우선순위를 빨리 쌓아 자주 보내면 같은 대역폭으로 오차가 절반 이하로 줄어듦.',
    views: { a: '라운드 로빈', b: '우선순위 누적기' },
    controls: '←↑→↓ / WASD: 캐릭터 이동. 상자를 밀면 상자가 움직임',
    info: `
      <p><b>우선순위 누적기</b>: 물체마다 "얼마나 오래 안 보냈는지 × 얼마나 중요한지"를 쌓아 두고, 값이 큰 순서로 패킷을 채우는 방식.</p>
      <p>왜 필요한가: 물체가 수백 개면 매 패킷에 모두 담을 수 없음. 패킷 크기를 MTU(약 1200바이트) 이하로 유지해야 함.
      차례대로 보내면(라운드 로빈) 가만히 있는 물체도 똑같이 자리를 차지함.</p>
      <ul>
        <li>매 틱 <code>누적값 += 우선순위 × dt</code>. 우선순위는 이 샘플에서 <code>1 + 속도 × 가중치</code>(기본 0.3).</li>
        <li>패킷마다 누적값이 큰 물체 K개를 고르고, 보낸 물체의 누적값을 0으로 되돌림.</li>
        <li>우선순위가 낮은 물체도 누적값이 계속 커지므로 언젠가는 보내짐(굶주림 없음).</li>
        <li>실제 게임에서는 플레이어와의 거리, 상호작용 여부, 시야 같은 항목을 우선순위에 더함.</li>
      </ul>
      <p>단점: 우선순위 함수 튜닝이 필요함. 중요한 물체가 너무 많으면 결국 모두 늦어짐.</p>`,
    diagram: (L) => {
      const H = [20, 75, 15, 90, 30, 60, 10, 40], MOV = [1, 3, 5], TOP = [1, 3, 5];
      return `<svg viewBox="0 0 540 198" xmlns="http://www.w3.org/2000/svg">
      <line x1="40" y1="130" x2="500" y2="130" class="d-dim"/>
      ${H.map((h, i) => `<rect x="${60 + i * 55}" y="${130 - h}" width="30" height="${h}" class="${TOP.includes(i) ? 'f-b' : 'f-dim'}"/><text x="${75 + i * 55}" y="144" text-anchor="middle" class="t-small t-mono">o${i + 1}</text>${MOV.includes(i) ? `<text x="${75 + i * 55}" y="156" text-anchor="middle" class="t-small t-dim">${L('이동', 'moving')}</text>` : ''}`).join('')}
      <path d="M280,30 L280,24 L425,24 L425,30" class="d-a"/>
      <text x="352" y="16" text-anchor="middle" class="t-small t-a">${L('A: 순번대로 다음 3개 (o5~o7)', 'A: next 3 in order (o5~o7)')}</text>
      <text x="4" y="176" class="t-small t-b">${L('B: 누적값이 큰 3개를 보내고 (파란 막대), 보낸 물체는 0으로 되돌림', 'B: send the 3 largest (blue bars), then reset those to 0')}</text>
      <text x="4" y="192" class="t-small t-mono">${L('누적값 += (1 + 속도 × 가중치) × dt', 'accum += (1 + speed × weight) × dt')}</text>
    </svg>`;
    },
    look: [
      '클라이언트 화면의 빨간 선(서버 위치까지의 오차)을 비교하면, A는 궤도를 도는 물체와 밀린 상자마다 긴 선이 생김. B는 거의 보이지 않음.',
      '"평균 위치 오차"를 비교하면 B가 A의 절반 이하임. "최대 위치 오차"는 차이가 더 큼. 초당 전송량은 같음.',
      '"빠른 물체 갱신 간격"을 보면 B가 훨씬 짧음. 대신 "정지 물체 갱신 간격"은 B가 더 김.',
      '패킷당 물체 수를 물체 총수 이상으로 올리면 두 방식의 차이가 사라짐. 대역폭이 충분하면 우선순위가 필요 없음.',
    ],
    refs: [
      { type: 'article', title: 'State Synchronization', url: 'https://gafferongames.com/post/state_synchronization/', note: 'Glenn Fiedler. 우선순위 누적기와 패킷 크기 제한의 출처.' },
      { type: 'talk', title: 'Networking for Physics Programmers', year: 2015, note: 'Glenn Fiedler, GDC 2015. 물리 물체 상태 동기화와 우선순위.' },
      { type: 'engine', title: 'Unreal Engine - Actor Priority (NetPriority)', note: '마지막 복제 이후 경과 시간 × NetPriority로 대역폭을 나눔.' },
      { type: 'talk', title: 'I Shot You First: Networking the Gameplay of Halo: Reach', year: 2011, note: 'David Aldridge, GDC 2011. 오브젝트 우선순위로 대역폭 배분.' },
    ],
    params: [
      { key: 'lat', label: '편도 지연 (ms)', type: 'int', min: 0, max: 300, default: 30, shared: true, group: '네트워크' },
      { key: 'jitter', label: '지터 (ms)', type: 'int', min: 0, max: 150, default: 10, shared: true },
      { key: 'loss', label: '패킷 손실률', type: 'range', min: 0, max: 0.3, step: 0.01, default: 0.02, shared: true },
      { key: 'sendHz', label: '패킷 전송률 (Hz)', type: 'int', min: 5, max: 60, default: 20, shared: true },
      { key: 'perPacket', label: '패킷당 물체 수', type: 'int', min: 1, max: 60, default: 4, shared: true, help: '대역폭 제한. 물체 하나당 8바이트' },
      { key: 'count', label: '물체 수', type: 'int', min: 10, max: 60, default: 48, shared: true, reset: true, group: '장면' },
      { key: 'auto', label: '자동 입력', type: 'bool', default: true, shared: true, help: '키 입력이 없으면 스크립트로 이동하며 상자를 밂' },
      { key: 'method', label: '선택 방식', type: 'select', group: '기법', options: [
        { value: 'rr', label: '라운드 로빈' },
        { value: 'prio', label: '우선순위 누적기' },
      ], default: 'prio', a: 'rr', b: 'prio' },
      { key: 'speedW', label: '속도 가중치', type: 'range', min: 0, max: 1, step: 0.01, default: 0.3, when: (p) => p.method === 'prio', help: '우선순위 = 1 + 속도 × 가중치' },
      { key: 'restart', label: '다시 시작', type: 'button' },
    ],
    en: {
      title: 'Priority Accumulator',
      summary: 'When bandwidth limits let each packet carry only a few objects, sending them in turn wastes slots on objects that do not move. Let moving objects build up priority faster and send them more often. With the same bandwidth, error drops to half or less.',
      views: { a: 'Round robin', b: 'Priority accumulator' },
      controls: 'Arrow keys / WASD: move the character. Push boxes to make them move.',
      info: `
      <p>A <b>priority accumulator</b> stores "how long since the last send × how important" for each object. It fills each packet with the objects that have the largest values.</p>
      <p>Why you need it: with hundreds of objects, you cannot put them all in every packet. Packets must stay at or below the MTU (about 1200 bytes).
      If you send objects in turn (round robin), objects that stand still take a slot just like the others.</p>
      <ul>
        <li>Every tick, <code>accumulator += priority × dt</code>. In this sample, priority is <code>1 + speed × weight</code> (default 0.3).</li>
        <li>For each packet, pick the K objects with the largest accumulators, and reset the accumulators of the sent objects to 0.</li>
        <li>Low-priority objects still get sent at some point, because their accumulators keep growing (no starvation).</li>
        <li>Real games add things like distance to the player, interaction, and visibility to the priority.</li>
      </ul>
      <p>Downside: you need to tune the priority function. If too many objects are important, they all end up late.</p>`,
      look: [
        'Compare the red lines (error to the server position) on the client view. A shows long lines on every orbiting object and pushed box. In B they are barely visible.',
        'Compare "Avg position error". B is half of A or less. The gap in "Max position error" is even bigger. Bytes per second are the same.',
        'Look at "Fast object update interval". B is much shorter. In exchange, B\'s "Still object update interval" is longer.',
        'Raise objects per packet to the total object count or more. The difference between the two methods disappears. With enough bandwidth, you do not need priority.',
      ],
      refs: [
        'Glenn Fiedler. The source of the priority accumulator and the packet size limit.',
        'Glenn Fiedler, GDC 2015. State sync and priority for physics objects.',
        'Splits bandwidth by time since last replication × NetPriority.',
        'David Aldridge, GDC 2011. Splits bandwidth by object priority.',
      ],
      params: {
        lat: { label: 'One-way latency (ms)', group: 'Network' },
        jitter: 'Jitter (ms)',
        loss: 'Packet loss rate',
        sendHz: 'Packet send rate (Hz)',
        perPacket: { label: 'Objects per packet', help: 'Bandwidth limit. 8 bytes per object' },
        count: { label: 'Object count', group: 'Scene' },
        auto: { label: 'Auto input', help: 'With no key input, a script moves around and pushes boxes' },
        method: { label: 'Selection method', group: 'Technique', options: { rr: 'Round robin', prio: 'Priority accumulator' } },
        speedW: { label: 'Speed weight', help: 'Priority = 1 + speed × weight' },
        restart: 'Restart',
      },
    },

    setup(ctx) {
      const P = ctx.params;
      const WW = 400, WH = 260, SPEED = 150, PR = 10;
      let st;
      function init() {
        ctx.rng = U.rng(ctx.seed);
        const rng = ctx.rng;
        const ls = rng.int(1, 1e9);
        const objs = [];
        const nOrb = Math.max(2, Math.round(P.count * 0.2));
        for (let i = 0; i < P.count; i++) {
          if (i < nOrb) {
            objs.push({ kind: 'orb', cx: rng.range(60, WW - 60), cy: rng.range(60, WH - 60), rad: rng.range(20, 50), w: rng.range(1.2, 2.6) * (rng.chance(0.5) ? 1 : -1), ph: rng.range(0, U.TAU), x: 0, y: 0, vx: 0, vy: 0, r: 5 });
          } else {
            objs.push({ kind: 'box', x: rng.range(20, WW - 20), y: rng.range(20, WH - 20), vx: 0, vy: 0, r: 6 });
          }
        }
        st = {
          now: 0, tick: 0, acc: 0, sAcc: 0, rr: 0,
          down: new Link(ls, 2), objs, player: { x: WW / 2, y: WH / 2 },
          acc2: new Float64Array(P.count), lastSent: new Float64Array(P.count),
          cl: [], gaps: [], errHist: [], bytes: [],
        };
        placeOrbs(0);
        st.cl = objs.map((o) => ({ x: o.x, y: o.y, t: 0 }));
      }
      function placeOrbs(tMs) {
        for (const o of st.objs) if (o.kind === 'orb') {
          const a = o.ph + o.w * tMs / 1000;
          const nx = o.cx + Math.cos(a) * o.rad, ny = o.cy + Math.sin(a) * o.rad;
          o.vx = -Math.sin(a) * o.rad * o.w; o.vy = Math.cos(a) * o.rad * o.w;
          o.x = nx; o.y = ny;
        }
      }
      init();

      function moveDir() {
        const k = readKeys(ctx.input);
        if (k.x || k.y || !P.auto) return k;
        const t = st.now / 1000;
        const tx = WW / 2 + Math.sin(t * 0.7) * (WW / 2 - 30), ty = WH / 2 + Math.sin(t * 1.13 + 1) * (WH / 2 - 30);
        const dx = tx - st.player.x, dy = ty - st.player.y, l = Math.hypot(dx, dy);
        return l < 3 ? { x: 0, y: 0 } : { x: dx / l, y: dy / l };
      }

      function tick() {
        st.now += STEP; st.tick++;
        const dt = STEP / 1000;
        const net = { lat: P.lat, jit: P.jitter, loss: P.loss };
        // 서버 월드 (두 뷰가 같음)
        const m = moveDir(), l = Math.hypot(m.x, m.y) || 1;
        const pvx = (m.x / l) * SPEED, pvy = (m.y / l) * SPEED;
        st.player.x = U.clamp(st.player.x + pvx * dt, PR, WW - PR);
        st.player.y = U.clamp(st.player.y + pvy * dt, PR, WH - PR);
        placeOrbs(st.now);
        const fr = Math.exp(-1.6 * dt);
        for (const o of st.objs) {
          if (o.kind !== 'box') continue;
          const dx = o.x - st.player.x, dy = o.y - st.player.y, d = Math.hypot(dx, dy), md = o.r + PR;
          if (d < md && d > 1e-6) {
            o.x = st.player.x + (dx / d) * md; o.y = st.player.y + (dy / d) * md;
            o.vx = (dx / d) * 160 + pvx * 0.6; o.vy = (dy / d) * 160 + pvy * 0.6;
          }
          o.x += o.vx * dt; o.y += o.vy * dt;
          if (o.x < o.r) { o.x = o.r; o.vx = Math.abs(o.vx) * 0.6; }
          if (o.x > WW - o.r) { o.x = WW - o.r; o.vx = -Math.abs(o.vx) * 0.6; }
          if (o.y < o.r) { o.y = o.r; o.vy = Math.abs(o.vy) * 0.6; }
          if (o.y > WH - o.r) { o.y = WH - o.r; o.vy = -Math.abs(o.vy) * 0.6; }
          o.vx *= fr; o.vy *= fr;
          if (Math.hypot(o.vx, o.vy) < 3) o.vx = o.vy = 0;
        }
        // 우선순위 누적
        const n = st.objs.length;
        for (let i = 0; i < n; i++) {
          const o = st.objs[i];
          st.acc2[i] += (1 + Math.hypot(o.vx, o.vy) * P.speedW) * dt;
        }
        // 전송
        const iv = 1000 / P.sendHz;
        st.sAcc += STEP;
        if (st.sAcc >= iv) {
          st.sAcc = Math.min(st.sAcc - iv, iv);
          const K = Math.min(P.perPacket, n);
          let ids = [];
          if (P.method === 'rr') { for (let k = 0; k < K; k++) ids.push((st.rr + k) % n); st.rr = (st.rr + K) % n; }
          else {
            ids = Array.from({ length: n }, (_, i) => i).sort((a, b) => st.acc2[b] - st.acc2[a] || a - b).slice(0, K);
          }
          const ups = ids.map((i) => {
            const o = st.objs[i];
            const sp = Math.hypot(o.vx, o.vy), moving = sp > 20;
            st.gaps.push({ moving, still: sp === 0, gap: st.now - st.lastSent[i], t: st.now });
            st.lastSent[i] = st.now; st.acc2[i] = 0;
            return { i, x: o.x, y: o.y };
          });
          const bytes = 28 + 2 + K * 8;
          st.down.send(st.now, st.tick, { t: st.now, ups }, net, bytes);
          st.bytes.push({ t: st.now, b: bytes });
        }
        while (st.gaps.length && st.gaps[0].t < st.now - 4000) st.gaps.shift();
        while (st.bytes.length && st.bytes[0].t < st.now - 1000) st.bytes.shift();
        // 클라이언트 수신
        for (const p of st.down.poll(st.now)) {
          for (const u of p.data.ups) if (p.data.t >= st.cl[u.i].t) st.cl[u.i] = { x: u.x, y: u.y, t: p.data.t };
        }
        let sum = 0;
        for (let i = 0; i < n; i++) sum += Math.hypot(st.cl[i].x - st.objs[i].x, st.cl[i].y - st.objs[i].y);
        st.errHist.push(sum / n); if (st.errHist.length > 240) st.errHist.shift();
      }

      function world(g, m) {
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
          const L = layout(W, H, 2, 60);
          const [p0, p1] = L.panels;

          panel(g, p0, GTL.L('서버 (막대: 누적값)', 'Server (bars: accumulated value)'), C.good);
          let m = fit(p0, WW, WH); world(g, m);
          let amax = 0.5;
          for (let i = 0; i < st.objs.length; i++) amax = Math.max(amax, st.acc2[i]);
          st.objs.forEach((o, i) => {
            const fresh = st.now - st.lastSent[i] < 120;
            if (o.kind === 'orb') D.circle(g, m.X(o.x), m.Y(o.y), o.r * m.s, C.good);
            else D.rect(g, m.X(o.x - o.r), m.Y(o.y - o.r), o.r * 2 * m.s, o.r * 2 * m.s, C.good);
            if (fresh) D.circle(g, m.X(o.x), m.Y(o.y), (o.r + 4) * m.s, null, C.warn, 1.5);
            const bh = (st.acc2[i] / amax) * 14 * m.s;
            D.rect(g, m.X(o.x + o.r + 1), m.Y(o.y + o.r) - bh, 2.5, bh, 'rgba(255,200,80,0.7)');
          });
          D.circle(g, m.X(st.player.x), m.Y(st.player.y), PR * m.s, null, C.text, 2);

          panel(g, p1, GTL.L('클라이언트 화면 (빨간 선: 서버 위치와의 오차)', 'Client view (red line: error vs server position)'), col);
          m = fit(p1, WW, WH); world(g, m);
          st.objs.forEach((o, i) => {
            const c = st.cl[i];
            const e = Math.hypot(c.x - o.x, c.y - o.y);
            if (e > 1) D.line(g, m.X(c.x), m.Y(c.y), m.X(o.x), m.Y(o.y), C.bad, 1.5);
            if (o.kind === 'orb') D.circle(g, m.X(c.x), m.Y(c.y), o.r * m.s, col);
            else D.rect(g, m.X(c.x - o.r), m.Y(c.y - o.r), o.r * 2 * m.s, o.r * 2 * m.s, col);
          });
          D.circle(g, m.X(st.player.x), m.Y(st.player.y), PR * m.s, null, C.text, 2);

          const t = L.tl;
          D.plot(g, st.errHist, t.x, t.y, t.w, t.h, { min: 0, max: 30, color: col, label: GTL.L('평균 위치 오차 (px), 최근 4초, 위쪽 끝 30px', 'Avg position error (px), last 4 s, top = 30px') });

          const mv = st.gaps.filter((x) => x.moving), rs = st.gaps.filter((x) => x.still);
          const avg = (a) => (a.length ? a.reduce((s, x) => s + x.gap, 0) / a.length : 0);
          let mx = 0;
          for (let i = 0; i < st.objs.length; i++) mx = Math.max(mx, Math.hypot(st.cl[i].x - st.objs[i].x, st.cl[i].y - st.objs[i].y));
          const recent = st.errHist.slice(-120);
          ctx.stat(GTL.L('평균 위치 오차 (2초)', 'Avg position error (2 s)'), (recent.reduce((a, b) => a + b, 0) / Math.max(1, recent.length)).toFixed(2) + ' px');
          ctx.stat(GTL.L('최대 위치 오차 (지금)', 'Max position error (now)'), mx.toFixed(1) + ' px');
          ctx.stat(GTL.L('빠른 물체 갱신 간격 (20px/s 이상)', 'Fast object update interval (20px/s or more)'), mv.length ? avg(mv).toFixed(0) + ' ms' : '-');
          ctx.stat(GTL.L('정지 물체 갱신 간격', 'Still object update interval'), rs.length ? avg(rs).toFixed(0) + ' ms' : '-');
          ctx.stat(GTL.L('초당 전송량', 'Bytes per second'), st.bytes.reduce((a, b) => a + b.b, 0) + ' B/s');
        },
        onAction(key) { if (key === 'restart') init(); },
      };
    },
  });
})();
