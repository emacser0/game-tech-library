// 관심 영역 관리 (Interest Management / Area of Interest)
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
    id: 'interest-management',
    title: '관심 영역 관리 (AOI)',
    summary: '모든 클라이언트에게 월드 전체를 보내면 대역폭이 (엔티티 수 × 접속자 수)로 폭증함. 각 클라이언트 주변(관심 영역)의 엔티티만 보내면 대역폭이 크게 줄어듦. 경계 떨림은 히스테리시스로 막음.',
    views: { a: '전체 브로드캐스트', b: '반경 AOI + 히스테리시스' },
    controls: '←↑→↓ / WASD: 클라이언트 #0 (주황/하늘색) 이동',
    info: `
      <p><b>관심 영역 관리(AOI, Area of Interest)</b>: 서버가 클라이언트마다 주변 엔티티만 골라 보내는 기법.</p>
      <p>왜 필요한가: MMO나 배틀로얄처럼 넓은 월드에서는 플레이어가 볼 수 없는 먼 엔티티까지 보낼 이유가 없음.</p>
      <p>서버는 클라이언트마다 <b>관련성(relevancy)</b>을 판정해 관심 영역 안의 엔티티만 복제함.
      엔티티가 영역에 들어오면 생성(spawn) 메시지를, 나가면 삭제 메시지를 보냄. 판정 방식:</p>
      <ul>
        <li><b>반경</b>: 플레이어와의 거리 &lt; R. Unreal의 <code>NetCullDistanceSquared</code>와 같은 발상.</li>
        <li><b>격자</b>: 월드를 R 크기 칸으로 나누고, 플레이어 칸 주변 3×3 칸의 엔티티를 보냄. 엔티티를 칸별 목록에 두면 거리 검사 없이 찾음.</li>
        <li><b>히스테리시스</b>: 들어오는 반경은 R, 나가는 반경은 1.25R로 다르게 둠. 경계에서 생성과 삭제가 반복되는 것을 막음.</li>
      </ul>
      <p>단점: 관심 영역이 카메라보다 작으면 화면 안에서 엔티티가 갑자기 나타남(pop-in). 대역폭과 시야 사이의 트레이드오프.</p>`,
    diagram: (L) => {
      const E = [[-90, -50], [-30, -60], [35, -30], [-20, 20], [70, 40], [100, -55], [-100, 50], [18, 55], [55, 5], [-60, -10]];
      const R = 50, R2 = 62.5;
      const side = (cx, b) => E.map(([dx, dy]) => {
        const d = Math.hypot(dx, dy), x = cx + dx, y = 90 + dy;
        if (!b) return `<line x1="${cx}" y1="90" x2="${x}" y2="${y}" class="d-a" opacity="0.35"/><circle cx="${x}" cy="${y}" r="4" class="f-a"/>`;
        if (d < R) return `<line x1="${cx}" y1="90" x2="${x}" y2="${y}" class="d-b" opacity="0.35"/><circle cx="${x}" cy="${y}" r="4" class="f-b"/>`;
        if (d < R2) return `<circle cx="${x}" cy="${y}" r="4" class="d-b"/>`;
        return `<circle cx="${x}" cy="${y}" r="4" class="f-dim"/>`;
      }).join('');
      return `<svg viewBox="0 0 540 204" xmlns="http://www.w3.org/2000/svg">
      ${side(135, false)}
      <circle cx="405" cy="90" r="${R}" class="d-b"/>
      <circle cx="405" cy="90" r="${R2}" class="d-b" stroke-dasharray="4 3" opacity="0.6"/>
      ${side(405, true)}
      <circle cx="135" cy="90" r="6" class="f-accent"/><circle cx="405" cy="90" r="6" class="f-accent"/>
      <text x="378" y="62" text-anchor="middle" class="t-small t-b">R</text>
      <text x="405" y="22" text-anchor="middle" class="t-small t-b">1.25R</text>
      <text x="135" y="178" text-anchor="middle" class="t-a">${L('A: 전체 전송 (10개)', 'A: send all (10)')}</text>
      <text x="405" y="178" text-anchor="middle" class="t-b">${L('B: 반경 R 안만 전송', 'B: send inside R only')}</text>
      <text x="405" y="196" text-anchor="middle" class="t-small t-dim">${L('빈 원: R~1.25R, 보내던 중이면 유지 (히스테리시스)', 'hollow: R~1.25R, kept if already sent (hysteresis)')}</text>
    </svg>`;
    },
    look: [
      '대역폭 패널을 비교하면, A는 모든 클라이언트가 엔티티 전부를 받음. B는 각자 주변만 받아 수 배 작음.',
      'B의 AOI 반경을 100으로 줄이면 클라이언트 화면(카메라 사각형) 안에 점선(아직 모르는 엔티티)이 생기고, 엔티티가 갑자기 나타남.',
      '히스테리시스를 끄면 "진입/이탈 이벤트"가 늘어남. 경계에 걸친 엔티티가 계속 생성, 삭제됨.',
      'AOI 방식을 "격자"로 바꾸면 서버 맵에 칸이 보임. 거리 검사 대상이 전체 엔티티에서 주변 칸 엔티티로 줄어듦.',
    ],
    refs: [
      { type: 'engine', title: 'Unreal Engine - Actor Relevancy and Priority', note: 'Unreal 네트워킹 문서. NetCullDistanceSquared, bAlwaysRelevant, 우선순위.' },
      { type: 'engine', title: 'Unreal Engine - Replication Graph', note: '공간 격자 노드로 대규모 접속자 관련성 판정 (Fortnite).' },
      { type: 'talk', title: 'The TRIBES Engine Networking Model', year: 2000, note: 'Mark Frohnmayer & Tim Gift, GDC 2000. Ghost 관리와 범위(scoping).' },
      { type: 'book', title: 'Networked Virtual Environments: Design and Implementation', year: 1999, note: 'Sandeep Singhal & Michael Zyda. 관심 영역 관리와 공간 분할.' },
      { type: 'article', title: 'State Synchronization', url: 'https://gafferongames.com/post/state_synchronization/', note: 'Glenn Fiedler. 우선순위 누적기(priority accumulator)로 대역폭 예산 분배.' },
    ],
    params: [
      { key: 'lat', label: '편도 지연 (ms)', type: 'int', min: 0, max: 300, default: 60, shared: true, group: '네트워크' },
      { key: 'loss', label: '패킷 손실률', type: 'range', min: 0, max: 0.2, step: 0.01, default: 0.0, shared: true },
      { key: 'sendHz', label: '전송률 (Hz)', type: 'int', min: 5, max: 30, default: 15, shared: true },
      { key: 'count', label: 'NPC 수', type: 'int', min: 10, max: 300, default: 120, shared: true, reset: true, group: '장면' },
      { key: 'auto', label: '자동 입력', type: 'bool', default: true, shared: true },
      { key: 'aoi', label: 'AOI 방식', type: 'select', group: '기법', options: [
        { value: 'none', label: '없음 (전체 전송)' },
        { value: 'radius', label: '반경' },
        { value: 'grid', label: '격자 (3×3 칸)' },
      ], a: 'none', b: 'radius' },
      { key: 'radius', label: 'AOI 반경 / 칸 크기', type: 'int', min: 60, max: 400, default: 190, when: (p) => p.aoi !== 'none' },
      { key: 'hyst', label: '히스테리시스 (이탈 1.25R)', type: 'bool', default: true, when: (p) => p.aoi === 'radius' },
      { key: 'reveal', label: '모르는 엔티티 점선 표시', type: 'bool', default: true, help: '클라이언트 #0이 받지 못한 엔티티를 디버그로 표시' },
      { key: 'restart', label: '다시 시작', type: 'button' },
    ],
    en: {
      title: 'Interest Management (AOI)',
      summary: 'If you send the whole world to every client, bandwidth explodes (entities × players). Send only the entities near each client (area of interest), and bandwidth drops a lot. Hysteresis stops flicker at the edge.',
      views: { a: 'Full broadcast', b: 'Radius AOI + hysteresis' },
      controls: 'Arrow keys / WASD: move client #0 (orange or sky blue)',
      info: `
      <p><b>Interest management (AOI, Area of Interest)</b>: the server picks only nearby entities for each client and sends those.</p>
      <p>Why you need it: in large worlds such as MMOs or battle royales, there is no reason to send far entities the player cannot see.</p>
      <p>The server decides <b>relevancy</b> for each client and replicates only the entities in its area of interest.
      When an entity enters the area, the server sends a spawn message. When it leaves, the server sends a delete message. Ways to decide:</p>
      <ul>
        <li><b>Radius</b>: distance to the player &lt; R. Same idea as Unreal's <code>NetCullDistanceSquared</code>.</li>
        <li><b>Grid</b>: split the world into cells of size R and send entities in the 3×3 cells around the player's cell. Keep entities in per-cell lists, and you find them with no distance checks.</li>
        <li><b>Hysteresis</b>: use radius R to enter and 1.25R to leave. This stops spawn and delete from repeating at the edge.</li>
      </ul>
      <p>Downside: if the area of interest is smaller than the camera, entities suddenly appear on screen (pop-in). It is a tradeoff between bandwidth and view range.</p>`,
      look: [
        'Compare the bandwidth panels. In A, every client gets all entities. In B, each client gets only nearby ones, several times less.',
        'In B, reduce the AOI radius to 100. Dashed circles (entities the client does not know yet) appear inside the client view (camera rectangle), and entities pop in.',
        'Turn off hysteresis. "Enter/leave events" increase. Entities on the edge keep spawning and getting deleted.',
        'Switch the AOI mode to "Grid". Cells appear on the server map. Distance checks drop from all entities to entities in nearby cells.',
      ],
      refs: [
        'Unreal networking docs. NetCullDistanceSquared, bAlwaysRelevant, priority.',
        'Relevancy for very large player counts with spatial grid nodes (Fortnite).',
        'Mark Frohnmayer & Tim Gift, GDC 2000. Ghost management and scoping.',
        'Sandeep Singhal & Michael Zyda. Interest management and spatial partitioning.',
        'Glenn Fiedler. Splits a bandwidth budget with a priority accumulator.',
      ],
      params: {
        lat: { label: 'One-way latency (ms)', group: 'Network' },
        loss: 'Packet loss rate',
        sendHz: 'Send rate (Hz)',
        count: { label: 'NPC count', group: 'Scene' },
        auto: 'Auto input',
        aoi: { label: 'AOI mode', group: 'Technique', options: { none: 'None (send all)', radius: 'Radius', grid: 'Grid (3×3 cells)' } },
        radius: 'AOI radius / cell size',
        hyst: 'Hysteresis (leave at 1.25R)',
        reveal: { label: 'Show unknown entities as dashed', help: 'Debug view of entities client #0 did not receive' },
        restart: 'Restart',
      },
    },

    setup(ctx) {
      const P = ctx.params;
      const WW = 900, WH = 560, NC = 4, CAM_W = 300, CAM_H = 200, SPEED = 200;
      let st, npcs;
      function init() {
        ctx.rng = U.rng(ctx.seed);
        const ls = ctx.rng.int(1, 1e9);
        npcs = Array.from({ length: P.count }, () => ({
          hx: ctx.rng.range(40, WW - 40), hy: ctx.rng.range(40, WH - 40),
          ax: ctx.rng.range(20, 110), ay: ctx.rng.range(20, 90), fx: ctx.rng.range(0.2, 0.8), fy: ctx.rng.range(0.2, 0.8), ph: ctx.rng.range(0, U.TAU),
        }));
        st = {
          now: 0, tick: 0, acc: 0, sAcc: 0, link: new Link(ls, 2),
          me: { x: 300, y: 300 }, clients: [], npc: [], sets: Array.from({ length: NC }, () => new Set()),
          known: new Map(), lastT: -1, bw: Array.from({ length: NC }, () => []), churn: [], checks: 0, recvCount: 0,
        };
        update0();
      }
      function update0() {
        const s = st.now / 1000;
        st.npc = npcs.map((n) => ({ x: U.clamp(n.hx + Math.sin(s * n.fx + n.ph) * n.ax, 5, WW - 5), y: U.clamp(n.hy + Math.cos(s * n.fy + n.ph * 1.7) * n.ay, 5, WH - 5) }));
        st.clients = [
          { x: st.me.x, y: st.me.y },
          { x: 650 + Math.cos(s * 0.35) * 180, y: 280 + Math.sin(s * 0.35) * 180 },
          { x: 200 + Math.cos(s * 0.5 + 2) * 120, y: 400 + Math.sin(s * 0.8) * 100 },
          { x: 450 + Math.sin(s * 0.27) * 380, y: 110 + Math.sin(s * 0.6) * 60 },
        ];
      }
      init();
      const cellOf = (x, y) => [Math.floor(x / P.radius), Math.floor(y / P.radius)];

      // 클라이언트 c에게 보낼 엔티티 집합
      function relevant(c, prev) {
        const p = st.clients[c], out = new Set();
        if (P.aoi === 'none') { for (let i = 0; i < st.npc.length; i++) out.add(i); return out; }
        if (P.aoi === 'radius') {
          const r2 = P.radius * P.radius, l2 = (P.hyst ? P.radius * 1.25 : P.radius) ** 2;
          for (let i = 0; i < st.npc.length; i++) {
            const e = st.npc[i], d2 = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
            st.checks++;
            if (d2 < r2 || (prev.has(i) && d2 < l2)) out.add(i);
          }
          return out;
        }
        // grid: 칸별 목록에서 3×3 칸만 조회
        const [cx, cy] = cellOf(p.x, p.y);
        for (let gy = cy - 1; gy <= cy + 1; gy++) for (let gx = cx - 1; gx <= cx + 1; gx++) {
          const list = st.grid.get(gx + ',' + gy);
          if (list) for (const i of list) { out.add(i); st.checks++; }
        }
        return out;
      }

      function tick() {
        st.now += STEP; st.tick++;
        const dt = STEP / 1000;
        const m = getMove(ctx, st.now), l = Math.hypot(m.x, m.y) || 1;
        st.me.x = U.clamp(st.me.x + (m.x / l) * SPEED * dt, 10, WW - 10);
        st.me.y = U.clamp(st.me.y + (m.y / l) * SPEED * dt, 10, WH - 10);
        update0();

        st.sAcc += STEP;
        const iv = 1000 / P.sendHz;
        if (st.sAcc >= iv) {
          st.sAcc = Math.min(st.sAcc - iv, iv);
          st.checks = 0;
          if (P.aoi === 'grid') {
            st.grid = new Map();
            st.npc.forEach((e, i) => { const k = cellOf(e.x, e.y).join(','); if (!st.grid.has(k)) st.grid.set(k, []); st.grid.get(k).push(i); });
          }
          let churn = 0;
          for (let c = 0; c < NC; c++) {
            const prev = st.sets[c], next = relevant(c, prev);
            let enter = 0, leave = 0;
            for (const i of next) if (!prev.has(i)) enter++;
            for (const i of prev) if (!next.has(i)) leave++;
            churn += enter + leave;
            // 헤더 + 엔티티당 상태 14B + 생성 메시지 6B + 삭제 메시지 2B
            const bytes = 28 + 8 + next.size * 14 + enter * 6 + leave * 2;
            st.bw[c].push({ t: st.now, b: bytes });
            st.sets[c] = next;
            if (c === 0) {
              const ents = [];
              for (const i of next) ents.push([i, st.npc[i].x, st.npc[i].y]);
              st.link.send(st.now, st.tick, { t: st.now, ents }, { lat: P.lat, jit: 10, loss: P.loss }, bytes);
            }
          }
          st.churn.push({ t: st.now, n: churn });
        }
        for (const b of st.bw) while (b.length && b[0].t < st.now - 1000) b.shift();
        while (st.churn.length && st.churn[0].t < st.now - 1000) st.churn.shift();

        // 클라이언트 #0: 받은 집합으로 알고 있는 엔티티 갱신 (집합에 없으면 삭제)
        for (const p of st.link.poll(st.now)) {
          const s = p.data;
          if (s.t <= st.lastT) continue;
          st.lastT = s.t;
          const nk = new Map();
          for (const [i, x, y] of s.ents) nk.set(i, { x, y, born: st.known.has(i) ? st.known.get(i).born : st.now });
          st.known = nk;
          st.recvCount = s.ents.length;
        }
      }

      const kbps = (c) => st.bw[c].reduce((a, b) => a + b.b, 0) * 8 / 1000;

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
          const ccol = (c) => (c === 0 ? col : U.hsl(90 + c * 70, 50, 60));

          // 서버 전체 맵
          panel(g, p0, GTL.L('서버 (월드 전체)', 'Server (whole world)'), C.good);
          let m = fit(p0, WW, WH);
          D.rect(g, m.ox, m.oy, m.w, m.h, 'rgba(0,0,0,0.2)', 'rgba(255,255,255,0.15)');
          if (P.aoi === 'grid') {
            D.grid(g, m.w, m.h, P.radius * m.s, 'rgba(255,255,255,0.07)', m.ox, m.oy);
            g.save(); g.beginPath(); g.rect(m.ox, m.oy, m.w, m.h); g.clip();
            for (let c = 0; c < NC; c++) {
              const [cx, cy] = cellOf(st.clients[c].x, st.clients[c].y);
              D.rect(g, m.X((cx - 1) * P.radius), m.Y((cy - 1) * P.radius), 3 * P.radius * m.s, 3 * P.radius * m.s, c === 0 ? 'rgba(255,255,255,0.06)' : null, ccol(c), c === 0 ? 1.5 : 0.8);
            }
            g.restore();
          } else if (P.aoi === 'radius') {
            for (let c = 0; c < NC; c++) {
              D.circle(g, m.X(st.clients[c].x), m.Y(st.clients[c].y), P.radius * m.s, c === 0 ? 'rgba(255,255,255,0.05)' : null, ccol(c), c === 0 ? 1.5 : 0.8);
              if (P.hyst && c === 0) { g.setLineDash([3, 3]); D.circle(g, m.X(st.clients[c].x), m.Y(st.clients[c].y), P.radius * 1.25 * m.s, null, ccol(c), 0.8); g.setLineDash([]); }
            }
          }
          const s0 = st.sets[0];
          st.npc.forEach((e, i) => D.circle(g, m.X(e.x), m.Y(e.y), Math.max(1.2, 3 * m.s), s0.has(i) ? '#e8e8e8' : 'rgba(255,255,255,0.25)'));
          const me = st.clients[0];
          D.rect(g, m.X(me.x - CAM_W / 2), m.Y(me.y - CAM_H / 2), CAM_W * m.s, CAM_H * m.s, null, col, 1);
          st.clients.forEach((c, i) => D.circle(g, m.X(c.x), m.Y(c.y), Math.max(3, 7 * m.s), ccol(i), '#000', 1));

          // 클라이언트 #0 화면 (카메라)
          panel(g, p1, GTL.L('클라이언트 #0 화면 (카메라)', 'Client #0 view (camera)'), col);
          const cm = fit(p1, CAM_W, CAM_H);
          const camX = me.x - CAM_W / 2, camY = me.y - CAM_H / 2;
          const X = (x) => cm.X(x - camX), Y = (y) => cm.Y(y - camY);
          D.rect(g, cm.ox, cm.oy, cm.w, cm.h, 'rgba(0,0,0,0.25)', 'rgba(255,255,255,0.2)');
          g.save(); g.beginPath(); g.rect(cm.ox, cm.oy, cm.w, cm.h); g.clip();
          D.grid(g, cm.w, cm.h, 50 * cm.s, C.grid, cm.ox - (camX % 50) * cm.s, cm.oy - (camY % 50) * cm.s);
          if (P.reveal) st.npc.forEach((e, i) => {
            if (st.known.has(i)) return;
            g.setLineDash([2, 3]); D.circle(g, X(e.x), Y(e.y), 5 * cm.s, null, 'rgba(255,255,255,0.35)', 1); g.setLineDash([]);
          });
          for (const [, k] of st.known) {
            const age = st.now - k.born;
            D.circle(g, X(k.x), Y(k.y), 5 * cm.s, '#e8e8e8');
            if (age < 400) D.circle(g, X(k.x), Y(k.y), (5 + 10 * (1 - age / 400)) * cm.s, null, C.warn, 1.5); // 방금 생성됨
          }
          st.clients.forEach((c, i) => { if (i) D.circle(g, X(c.x), Y(c.y), 7 * cm.s, ccol(i)); });
          D.circle(g, X(me.x), Y(me.y), 8 * cm.s, col);
          g.restore();

          // 대역폭
          panel(g, p2, GTL.L('클라이언트별 수신 대역폭', 'Receive bandwidth per client'), C.dim);
          const bx = p2.x + 8, bw = p2.w - 16, by = p2.y + 26;
          const maxK = Math.max(20, (28 + 8 + npcs.length * 14) * P.sendHz * 8 / 1000);
          let total = 0;
          for (let c = 0; c < NC; c++) {
            const k = kbps(c); total += k;
            const y = by + c * 26;
            D.text(g, `#${c}`, bx, y + 3, { size: 10, color: ccol(c) });
            D.rect(g, bx + 22, y, bw - 22, 14, 'rgba(255,255,255,0.05)');
            D.rect(g, bx + 22, y, (bw - 22) * U.clamp(k / maxK, 0, 1), 14, ccol(c));
            D.text(g, GTL.L(`${k.toFixed(1)} kbps, ${st.sets[c].size}개`, `${k.toFixed(1)} kbps, ${st.sets[c].size} ents`), bx + 26, y + 2, { size: 10, color: C.text });
          }
          const ty = by + NC * 26 + 6;
          D.text(g, GTL.L(`서버 총 송신 ${total.toFixed(1)} kbps`, `Server total send ${total.toFixed(1)} kbps`), bx, ty, { size: 11, color: col });
          D.text(g, GTL.L(`(전체 전송 기준 ${(maxK * NC).toFixed(0)} kbps)`, `(full broadcast: ${(maxK * NC).toFixed(0)} kbps)`), bx, ty + 16, { size: 10, color: C.dim });

          drawTimeline(g, L.tl, st.now, 1500, [{ link: st.link, dir: 1, color: col, lw: 1.5, dot: 3.5 }], [GTL.L('서버', 'Server'), GTL.L('클라#0', 'Client')]);

          const churn = st.churn.reduce((a, b) => a + b.n, 0);
          ctx.stat(GTL.L('클라 #0 수신', 'Client #0 receive'), kbps(0).toFixed(1) + ' kbps');
          ctx.stat(GTL.L('서버 총 송신', 'Server total send'), total.toFixed(1) + ' kbps');
          ctx.stat(GTL.L('클라 #0이 아는 엔티티', 'Entities known to client #0'), `${st.recvCount} / ${npcs.length}`);
          ctx.stat(GTL.L('진입/이탈 이벤트/초', 'Enter/leave events per s'), churn);
          ctx.stat(GTL.L('관련성 검사/스냅샷', 'Relevancy checks per snapshot'), P.aoi === 'none' ? GTL.L('0 (전부)', '0 (all)') : st.checks);
        },
        onAction(key) { if (key === 'restart') init(); },
      };
    },
  });
})();
