// 락스텝 RTS: 결정론 체크섬으로 디싱크 감지 vs 감지 없음 (부동소수점 차이를 일부러 주입)
// 두 피어가 같은 명령으로 같은 시뮬레이션을 돌림. 패킷 지연/손실은 (시드, 채널, 보낸 틱) 해시로 정해짐.
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


  const SIM_MS = 1000 / 30;     // 시뮬레이션 틱 (30Hz)
  const TPT = 3;                // 턴당 틱 수 (턴 = 100ms)
  const DELAY = 3;              // 명령 지연 (턴). 턴 T에 만든 명령은 턴 T+3에 실행
  const NU = 12;                // 팀당 유닛 수
  const INJ_TICK = 60;          // "한 번 주입" 모드에서 오차를 넣는 틱 (2초)
  const INJ_EPS = 1e-5;         // 주입하는 오차 (px)
  const BASES = [{ x: 30, y: 130 }, { x: 370, y: 130 }];
  const TEAM_COL = ['#ef7d6b', '#7fb2f0'];
  const RALLY = [
    [[200, 130], [250, 80], [150, 190], [230, 160], [190, 100]],
    [[200, 130], [150, 180], [250, 70], [170, 110], [220, 170]],
  ];

  // 상태 해시: 실수는 Float64 비트 그대로 섞음 (아주 작은 차이도 감지)
  const dv = new DataView(new ArrayBuffer(8));
  function mix(h, v) { h ^= v; return Math.imul(h, 16777619) >>> 0; }
  function hashState(S) {
    let h = 2166136261;
    for (const u of S.units) {
      dv.setFloat64(0, u.x); h = mix(h, dv.getUint32(0)); h = mix(h, dv.getUint32(4));
      dv.setFloat64(0, u.y); h = mix(h, dv.getUint32(0)); h = mix(h, dv.getUint32(4));
      h = mix(h, u.hp | 0); h = mix(h, u.cd | 0); h = mix(h, u.dead | 0);
    }
    return h >>> 0;
  }
  const cloneState = (S) => ({ tick: S.tick, rally: S.rally.map((r) => ({ ...r })), score: S.score.slice(), units: S.units.map((u) => ({ ...u })) });
  function initState() {
    const units = [];
    for (let t = 0; t < 2; t++) for (let i = 0; i < NU; i++) {
      const o = formation(i);
      units.push({ team: t, i, x: BASES[t].x + (t ? -o.x : o.x) * 0.6 + (t ? -20 : 20), y: BASES[t].y + o.y, hp: 100, cd: 0, dead: 0 });
    }
    return { tick: 0, rally: [{ x: 200, y: 130 }, { x: 200, y: 130 }], score: [0, 0], units };
  }
  function formation(i) { return { x: ((i % 4) - 1.5) * 8, y: (Math.floor(i / 4) - 1) * 8 }; }

  // 결정론 시뮬레이션 1틱. f: 거리 계산 후처리 (피어 2에 float32 반올림을 주입할 때 사용)
  function simTick(S, f) {
    const dt = SIM_MS / 1000, sp = 38, U_ = S.units;
    for (const u of U_) {
      if (u.dead > 0) {
        if (--u.dead === 0) { u.hp = 100; u.x = BASES[u.team].x; u.y = BASES[u.team].y + formation(u.i).y; }
        continue;
      }
      if (u.cd > 0) u.cd--;
      let best = -1, bd = 1e18;
      for (let j = 0; j < U_.length; j++) {
        const e = U_[j];
        if (e.team === u.team || e.dead > 0) continue;
        const d2 = (e.x - u.x) * (e.x - u.x) + (e.y - u.y) * (e.y - u.y);
        if (d2 < bd) { bd = d2; best = j; }
      }
      let tx, ty, stop = 2;
      if (best >= 0 && bd < 70 * 70) {
        const e = U_[best];
        if (bd <= 16 * 16) {
          if (u.cd === 0) {
            e.hp -= 8 + (u.i % 3) * 2; u.cd = 18;
            if (e.hp <= 0) { e.dead = 45; e.hp = 0; S.score[u.team]++; }
          }
          continue;
        }
        tx = e.x; ty = e.y; stop = 15;
      } else {
        const o = formation(u.i), r = S.rally[u.team];
        tx = r.x + (u.team ? -o.x : o.x); ty = r.y + o.y;
      }
      const dx = tx - u.x, dy = ty - u.y, d = f(Math.sqrt(dx * dx + dy * dy));
      if (d > stop) { const s = Math.min(sp * dt, d - stop) / d; u.x += dx * s; u.y += dy * s; }
    }
    // 같은 팀끼리 밀어내기 (작은 차이가 증폭되는 곳)
    for (let a = 0; a < U_.length; a++) {
      const u = U_[a];
      if (u.dead > 0) continue;
      for (let b = a + 1; b < U_.length; b++) {
        const v = U_[b];
        if (v.dead > 0) continue;
        const dx = v.x - u.x, dy = v.y - u.y, d2 = dx * dx + dy * dy;
        if (d2 >= 121 || d2 < 1e-12) continue;
        const d = f(Math.sqrt(d2)), push = ((11 - d) / d) * 0.4;
        u.x -= dx * push; u.y -= dy * push; v.x += dx * push; v.y += dy * push;
      }
    }
    for (const u of U_) { u.x = U.clamp(u.x, 6, 394); u.y = U.clamp(u.y, 6, 254); }
    S.tick++;
  }

  GTL.register({
    id: 'lockstep-checksum',
    title: '락스텝 디싱크 감지 (체크섬)',
    summary: '락스텝은 명령만 주고받고 각자 같은 시뮬레이션을 돌림. 부동소수점 결과가 한 번만 달라도 두 피어의 게임이 조용히 갈라짐. 턴마다 상태 체크섬을 교환하면 갈라진 턴을 바로 찾아 멈추거나 재동기화할 수 있음.',
    views: { a: '감지 없음', b: '체크섬 + 재동기화' },
    controls: '←↑→↓ / WASD: 빨간 팀 집결 지점 이동 (명령은 3턴 뒤 실행)',
    info: `
      <p><b>결정론 락스텝(Deterministic Lockstep)</b>: 피어끼리 유닛 상태가 아니라 <b>명령</b>만 보내는 방식. 모두 같은 턴에 같은 명령을 실행하므로 같은 결과가 나와야 함. 유닛이 수천 개인 RTS(Age of Empires, StarCraft)에서 대역폭을 아끼려고 씀.</p>
      <p>왜 체크섬이 필요한가: 결과가 비트 단위로 같아야 함. 컴파일러 최적화, CPU 명령(x87, FMA), 수학 라이브러리 차이로 실수 계산 결과가 아주 조금만 달라도 됨.
      그 차이는 거리 비교, 목표 선택, 사망 판정을 거치며 커짐. 결국 서로 다른 게임을 하게 됨(<b>디싱크</b>). 아무도 알아채지 못함.</p>
      <ul>
        <li>매 턴(또는 N턴마다) 상태 해시. 실수는 Float64 비트를 그대로 섞음.</li>
        <li>해시를 명령 패킷에 실어 보냄. 호스트가 같은 턴의 해시 비교.</li>
        <li>다르면 <b>정지</b>(오류 보고, 상태 덤프로 원인 추적) 또는 <b>재동기화</b>(호스트가 그 턴의 전체 상태를 보내고, 받은 피어가 이후 턴을 다시 시뮬레이션)</li>
        <li>이 샘플은 피어 2에만 일부러 오차를 넣음. "한 번 주입"은 2초에 유닛 하나의 x에 0.00001을 더함. "float32 반올림"은 피어 2가 거리 계산을 float32로 반올림.</li>
      </ul>
      <p>단점: 체크섬은 갈라졌다는 사실만 알려줌. 원인(어떤 코드가 비결정적인지) 찾기는 여전히 어려움. 재동기화는 전체 상태 크기만큼 대역폭이 들고, 원인이 남아 있으면 계속 반복됨.</p>`,
    diagram: (L) => {
      const h1 = ['3c1a', '9f02', '51be', 'd7e4', '0a9c', '6b13', 'e25f'];
      const h2 = ['3c1a', '9f02', '51be', 'd7e5', '41f0', '8c2d', '17a6'];
      const row = (y, hs, bad) => hs.map((h, i) => `<rect x="${100 + i * 60}" y="${y}" width="50" height="24" class="f-dim"/>${bad && i >= 3 ? `<rect x="${100 + i * 60}" y="${y}" width="50" height="24" class="d-bad"/>` : ''}<text x="${125 + i * 60}" y="${y + 16}" text-anchor="middle" class="t-small t-mono">${h}</text>`).join('');
      return `<svg viewBox="0 0 540 172" xmlns="http://www.w3.org/2000/svg">
      <defs><marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
      ${h1.map((_, i) => `<text x="${125 + i * 60}" y="22" text-anchor="middle" class="t-small t-dim">T${i + 1}</text>`).join('')}
      <text x="4" y="46">${L('피어 1', 'Peer 1')}</text>
      <text x="4" y="96">${L('피어 2', 'Peer 2')}</text>
      ${row(30, h1, false)}
      ${row(80, h2, true)}
      <text x="305" y="72" text-anchor="middle" class="t-b">≠</text>
      <path d="M330,56 L362,78" class="d-b" marker-end="url(#arrB)"/>
      <text x="370" y="70" class="t-small t-b">${L('재동기화', 'resync')}</text>
      <text x="4" y="126" class="t-small t-a">${L('A: 감지 없음. T4의 작은 실수 오차가 커져 두 피어가 다른 게임을 진행', 'A: no check. A tiny float error at T4 grows and the peers play different games')}</text>
      <text x="4" y="144" class="t-small t-b">${L('B: 턴마다 상태 해시 교환. T4에서 다름을 바로 감지', 'B: peers swap a state hash every turn. The T4 mismatch shows up at once')}</text>
      <text x="4" y="160" class="t-small t-b">${L('호스트가 T4 상태를 보내고 피어 2가 이후 턴을 다시 계산', 'The host sends its T4 state and peer 2 re-simulates the later turns')}</text>
    </svg>`;
    },
    look: [
      '15초쯤 지켜보면 A의 피어 2 화면에 빨간 테두리(피어 1과 위치가 다른 유닛)가 늘고 두 피어의 점수가 달라짐. 체크섬이 없으니 아무 경고도 없음.',
      'B는 오차를 넣은 턴에 바로 "디싱크 감지"가 뜨고, RTT 정도 뒤에 재동기화되어 두 화면이 다시 같아짐',
      '아래 그래프(로그 눈금)에서 A의 상태 차이가 1e-7 근처에서 시작해 교전 때마다 계단식으로 커지고, 결국 수십 px가 됨. 작은 오차가 증폭되는 모습임.',
      '오차 주입을 "float32 반올림"으로 바꾸면 B는 재동기화를 계속 반복. 원인을 고치지 않으면 재동기화로 해결되지 않음.',
      'B의 디싱크 처리를 "정지"로 바꾸면 감지 즉시 두 피어가 멈춤. 개발 중 디버깅에 쓰는 방식.',
    ],
    refs: [
      { type: 'talk', title: '1500 Archers on a 28.8: Network Programming in Age of Empires and Beyond', year: 2001, note: 'Paul Bettner, Mark Terrano, GDC 2001. 턴 기반 락스텝과 동기화 검사(out-of-sync 디버깅).' },
      { type: 'article', title: 'Deterministic Lockstep', url: 'https://gafferongames.com/post/deterministic_lockstep/', note: 'Glenn Fiedler. 입력만 보내는 동기화와 결정론 요구.' },
      { type: 'article', title: 'Floating Point Determinism', url: 'https://gafferongames.com/post/floating_point_determinism/', note: 'Glenn Fiedler. 컴파일러, CPU별 부동소수점 결과 차이.' },
      { type: 'article', title: 'The Tech of Planetary Annihilation: ChronoCam', note: 'Forrest Smith. 결정론 락스텝 대신 상태 기반 동기화를 택한 이유.' },
    ],
    params: [
      { key: 'lat', label: '편도 지연 (ms)', type: 'int', min: 0, max: 250, default: 60, shared: true, group: '네트워크', help: '명령 지연(300ms)보다 RTT가 크면 대기가 생김' },
      { key: 'jitter', label: '지터 (ms)', type: 'int', min: 0, max: 100, default: 20, shared: true },
      { key: 'loss', label: '패킷 손실률', type: 'range', min: 0, max: 0.3, step: 0.01, default: 0.02, shared: true, help: '패킷마다 최근 명령 8턴분을 중복으로 실어 손실을 덮음' },
      { key: 'inject', label: '오차 주입 (피어 2)', type: 'select', group: '장면', shared: true, reset: true, options: [
        { value: 'none', label: '없음' },
        { value: 'once', label: '한 번 주입 (2초, 0.00001)' },
        { value: 'fround', label: 'float32 반올림 (계속)' },
      ], default: 'once' },
      { key: 'auto', label: '자동 입력', type: 'bool', default: true, shared: true, help: '두 팀의 집결 지점을 스크립트로 바꿈' },
      { key: 'detect', label: '체크섬 교환', type: 'bool', group: '기법', a: false, b: true },
      { key: 'every', label: '체크섬 주기 (턴)', type: 'int', min: 1, max: 20, default: 1, when: (p) => p.detect },
      { key: 'onDesync', label: '디싱크 처리', type: 'select', options: [
        { value: 'halt', label: '정지' },
        { value: 'resync', label: '호스트 상태로 재동기화' },
      ], default: 'resync', when: (p) => p.detect },
      { key: 'restart', label: '다시 시작', type: 'button' },
    ],
    en: {
      title: 'Lockstep Desync Detection (Checksum)',
      summary: 'In lockstep, peers exchange only commands and each runs the same simulation. If a floating point result differs even once, the two games split apart without notice. Exchange a state checksum every turn, and you find the turn where they split right away. Then you can halt or resync.',
      views: { a: 'No detection', b: 'Checksum + resync' },
      controls: 'Arrow keys / WASD: move the red team rally point (commands run 3 turns later)',
      info: `
      <p><b>Deterministic lockstep</b>: peers send only <b>commands</b>, not unit state. Everyone runs the same commands on the same turn, so the results must match. RTS games with thousands of units (Age of Empires, StarCraft) use it to save bandwidth.</p>
      <p>Why you need a checksum: results must match bit for bit. Compiler optimizations, CPU instructions (x87, FMA), and math library differences can change floating point results by a tiny amount.
      That gap grows through distance compares, target choices, and death checks. In the end the peers play different games (<b>desync</b>). Nobody notices.</p>
      <ul>
        <li>Hash the state every turn (or every N turns). Mix in the raw Float64 bits of each number.</li>
        <li>Send the hash in the command packet. The host compares hashes for the same turn.</li>
        <li>If they differ, <b>halt</b> (report the error and dump state to find the cause) or <b>resync</b> (the host sends the full state for that turn, and the receiving peer simulates the later turns again).</li>
        <li>This sample adds error to peer 2 on purpose. "Inject once" adds 0.00001 to one unit's x at 2 seconds. "float32 rounding" makes peer 2 round distance math to float32.</li>
      </ul>
      <p>Downside: a checksum only tells you that the games split. Finding the cause (which code is not deterministic) is still hard. A resync costs bandwidth equal to the full state, and it keeps repeating if the cause remains.</p>`,
      look: [
        'Watch for about 15 seconds. On A\'s peer 2 view, red outlines (units at different positions than peer 1) increase, and the two peers\' scores differ. With no checksum, there is no warning.',
        'In B, "Desync detected" appears on the turn with the injected error. About one RTT later it resyncs, and both views match again.',
        'In the graph below (log scale), A\'s state gap starts near 1e-7 and grows in steps with each fight, finally reaching tens of px. A tiny error gets amplified.',
        'Switch error injection to "float32 rounding". B resyncs again and again. Resync does not fix the problem unless you fix the cause.',
        'Switch B\'s desync handling to "Halt". Both peers stop as soon as the desync is detected. Teams use this for debugging during development.',
      ],
      refs: [
        'Paul Bettner, Mark Terrano, GDC 2001. Turn-based lockstep and sync checks (out-of-sync debugging).',
        'Glenn Fiedler. Sync by sending only inputs, and what determinism requires.',
        'Glenn Fiedler. Floating point results that differ by compiler and CPU.',
        'Forrest Smith. Why they chose state-based sync over deterministic lockstep.',
      ],
      params: {
        lat: { label: 'One-way latency (ms)', group: 'Network', help: 'If RTT is larger than the command delay (300ms), peers must wait' },
        jitter: 'Jitter (ms)',
        loss: { label: 'Packet loss rate', help: 'Each packet repeats the last 8 turns of commands to cover loss' },
        inject: { label: 'Error injection (peer 2)', group: 'Scene', options: { none: 'None', once: 'Inject once (2 s, 0.00001)', fround: 'float32 rounding (always)' } },
        auto: { label: 'Auto input', help: 'A script changes both teams\' rally points' },
        detect: { label: 'Checksum exchange', group: 'Technique' },
        every: 'Checksum interval (turns)',
        onDesync: { label: 'Desync handling', options: { halt: 'Halt', resync: 'Resync from host state' } },
        restart: 'Restart',
      },
    },

    setup(ctx) {
      const P = ctx.params;
      let st;
      const ident = (x) => x;
      const peerFn = (id) => (id === 1 && P.inject === 'fround' ? Math.fround : ident);

      function makePeer(id) {
        return { id, S: initState(), turn: 0, sub: 0, my: new Map(), other: new Map(), hashes: new Map(), hist: new Map(), stall: 0, run: 0, sAcc: 0, epoch: 0 };
      }
      function init() {
        ctx.rng = U.rng(ctx.seed);
        const ls = ctx.rng.int(1, 1e9);
        st = {
          now: 0, step: 0, acc: 0, simAcc: 0, manual: { x: 0, y: 0 },
          peers: [makePeer(0), makePeer(1)],
          links: [new Link(ls, 1), new Link(ls, 2)], // links[i]: 피어 i → 다른 피어
          halted: false, detected: null, resyncs: 0, epoch: 0, diffHist: [], events: [], lastDiff: 0, injected: false,
        };
        for (const p of st.peers) for (let t = 0; t < DELAY; t++) { p.my.set(t, cmdFor(p.id, t)); p.other.set(t, cmdFor(1 - p.id, t)); }
      }
      function cmdFor(team, turn) {
        const seq = RALLY[team], k = P.auto ? Math.floor(turn / 30) % seq.length : 0;
        let [x, y] = seq[k];
        if (team === 0) { x += st ? st.manual.x : 0; y += st ? st.manual.y : 0; }
        return { x: U.clamp(x, 20, 380), y: U.clamp(y, 20, 240) };
      }
      init();

      // 턴 T의 처음 틱을 시작할 때 명령 적용
      function stepPeer(p) {
        if (p.sub === 0) {
          if (!p.my.has(p.turn) || !p.other.has(p.turn)) { p.stall++; return false; }
          const c0 = p.id === 0 ? p.my.get(p.turn) : p.other.get(p.turn);
          const c1 = p.id === 1 ? p.my.get(p.turn) : p.other.get(p.turn);
          p.S.rally[0] = { ...c0 }; p.S.rally[1] = { ...c1 };
          // 이 턴을 시작하며 DELAY턴 뒤에 실행할 내 명령을 만듦
          const nt = p.turn + DELAY;
          if (!p.my.has(nt)) p.my.set(nt, cmdFor(p.id, nt));
        }
        simTick(p.S, peerFn(p.id));
        if (p.id === 1 && P.inject === 'once' && p.S.tick === INJ_TICK && !p.resim) { p.S.units[3].x += INJ_EPS; st.injected = true; st.events.push({ t: st.now, k: 'inj' }); }
        p.run++;
        if (++p.sub === TPT) {
          p.sub = 0;
          p.hist.set(p.turn, cloneState(p.S));
          if (P.detect && p.turn % P.every === 0) p.hashes.set(p.turn, { h: hashState(p.S), epoch: p.epoch });
          for (const k of p.hist.keys()) if (k < p.turn - 80) p.hist.delete(k);
          for (const k of p.hashes.keys()) if (k < p.turn - 80) p.hashes.delete(k);
          p.turn++;
        }
        return true;
      }

      function sendPacket(p) {
        const net = { lat: P.lat, jit: P.jitter, loss: P.loss };
        const cmds = [];
        const top = p.turn + DELAY;
        for (let t = Math.max(0, top - 8); t <= top; t++) if (p.my.has(t)) cmds.push([t, p.my.get(t)]);
        const hs = [];
        for (const [t, v] of p.hashes) if (t >= p.turn - 6) hs.push([t, v.h, v.epoch]);
        st.links[p.id].send(st.now, st.step * 2 + p.id, { type: 'cmd', cmds, hs }, net, 28 + cmds.length * 6 + hs.length * 6);
      }

      function hostCompare(t, h, epoch) {
        const host = st.peers[0], mine = host.hashes.get(t);
        if (!mine || epoch < st.epoch || st.halted) return;
        if (mine.h === h) return;
        if (!st.detected) st.detected = { turn: t, t: st.now };
        st.events.push({ t: st.now, k: 'det' });
        if (P.onDesync === 'halt') { st.halted = true; return; }
        // 재동기화: 호스트의 턴 t 상태를 전체 전송. 새 epoch 이전 해시는 무시
        st.epoch++; st.resyncs++;
        const snap = host.hist.get(t);
        if (!snap) return;
        const net = { lat: P.lat, jit: P.jitter, loss: 0 };
        st.links[0].send(st.now, st.step * 2 + 1e6, { type: 'state', turn: t, S: cloneState(snap), epoch: st.epoch }, net, 28 + NU * 2 * 20);
      }

      function applyResync(p, msg) {
        // 받은 상태(턴 msg.turn 종료 시점)에서 지금까지의 턴을 다시 시뮬레이션
        const curTurn = p.turn, curSub = p.sub;
        p.S = cloneState(msg.S); p.epoch = msg.epoch;
        p.turn = msg.turn + 1; p.sub = 0; p.resim = true;
        for (const k of [...p.hashes.keys()]) if (k > msg.turn) p.hashes.delete(k);
        let guard = 0;
        while ((p.turn < curTurn || (p.turn === curTurn && p.sub < curSub)) && guard++ < 5000) {
          if (!stepPeer(p)) break; // 명령은 이미 받아 둔 것을 다시 씀
        }
        p.resim = false;
        st.events.push({ t: st.now, k: 'sync' });
      }

      function tick() {
        st.now += STEP; st.step++;
        const k = readKeys(ctx.input);
        st.manual.x = U.clamp(st.manual.x + k.x * 100 * STEP / 1000, -180, 180);
        st.manual.y = U.clamp(st.manual.y + k.y * 100 * STEP / 1000, -110, 110);
        // 네트워크 수신
        for (let i = 0; i < 2; i++) {
          const to = st.peers[1 - i];
          for (const pk of st.links[i].poll(st.now)) {
            const d = pk.data;
            if (d.type === 'cmd') {
              for (const [t, c] of d.cmds) if (!to.other.has(t)) to.other.set(t, c);
              if (to.id === 0 && P.detect) for (const [t, h, e] of d.hs) hostCompare(t, h, e);
            } else if (d.type === 'state' && to.id === 1) applyResync(to, d);
          }
          for (const key of to.other.keys()) if (key < to.turn - 40) to.other.delete(key);
          for (const key of to.my.keys()) if (key < to.turn - 40) to.my.delete(key);
        }
        if (!st.halted) {
          st.simAcc += STEP;
          while (st.simAcc >= SIM_MS) { st.simAcc -= SIM_MS; for (const p of st.peers) stepPeer(p); }
        }
        for (const p of st.peers) { p.sAcc += STEP; if (p.sAcc >= 50) { p.sAcc -= 50; sendPacket(p); } }
        // 같은 턴의 두 피어 상태 비교 (관찰용. 실제 게임에서는 알 수 없는 값)
        const tb = Math.min(st.peers[0].turn, st.peers[1].turn) - 1;
        const a = st.peers[0].hist.get(tb), b = st.peers[1].hist.get(tb);
        if (a && b) {
          let s = 0;
          for (let i = 0; i < a.units.length; i++) s += Math.hypot(a.units[i].x - b.units[i].x, a.units[i].y - b.units[i].y);
          st.lastDiff = s / a.units.length; st.cmpTurn = tb;
        }
        if (st.step % 4 === 0) { st.diffHist.push(st.lastDiff); if (st.diffHist.length > 300) st.diffHist.shift(); }
        while (st.events.length && st.events[0].t < st.now - 20000) st.events.shift();
      }

      function drawPeer(g, r, p, title, col, other) {
        panel(g, r, title, col);
        const m = fit(r, 400, 260);
        D.rect(g, m.ox, m.oy, m.w, m.h, null, 'rgba(255,255,255,0.15)');
        D.grid(g, m.w, m.h, 40 * m.s, C.grid, m.ox, m.oy);
        for (let t = 0; t < 2; t++) {
          D.rect(g, m.X(BASES[t].x - 10), m.Y(BASES[t].y - 30), 20 * m.s, 60 * m.s, null, TEAM_COL[t], 1);
          const rl = p.S.rally[t];
          D.line(g, m.X(rl.x - 5), m.Y(rl.y), m.X(rl.x + 5), m.Y(rl.y), TEAM_COL[t], 1.5);
          D.line(g, m.X(rl.x), m.Y(rl.y - 5), m.X(rl.x), m.Y(rl.y + 5), TEAM_COL[t], 1.5);
        }
        const ref = other ? other.hist.get(p.turn - 1) : null;
        const mine = other ? p.hist.get(p.turn - 1) : null;
        p.S.units.forEach((u, i) => {
          if (u.dead > 0) return;
          D.circle(g, m.X(u.x), m.Y(u.y), 4.5 * m.s, TEAM_COL[u.team]);
          D.rect(g, m.X(u.x - 5), m.Y(u.y - 8), 10 * m.s * (u.hp / 100), 1.5 * m.s + 0.5, 'rgba(255,255,255,0.6)');
          if (ref && mine) {
            const a = ref.units[i], b = mine.units[i];
            if (Math.hypot(a.x - b.x, a.y - b.y) > 0.5 || a.dead !== b.dead) D.circle(g, m.X(u.x), m.Y(u.y), 7.5 * m.s, null, C.bad, 2);
          }
        });
        D.text(g, GTL.L(`점수 ${p.S.score[0]} : ${p.S.score[1]}   턴 ${p.turn}`, `Score ${p.S.score[0]} : ${p.S.score[1]}   Turn ${p.turn}`), r.x + 6, r.y + r.h - 15, { size: 10, color: C.text });
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
          const L = layout(W, H, 2, 64);
          const [p0, p1] = L.panels;
          const [A, B] = st.peers;
          drawPeer(g, p0, A, GTL.L('피어 1 (호스트)', 'Peer 1 (host)'), C.text, null);
          drawPeer(g, p1, B, GTL.L('피어 2 (빨간 테두리: 피어 1과 다른 유닛)', 'Peer 2 (red outline: differs from peer 1)'), col, A);
          if (st.halted) D.text(g, GTL.L(`디싱크 감지, 정지 (턴 ${st.detected.turn})`, `Desync detected, halted (turn ${st.detected.turn})`), p1.x + p1.w / 2, p1.y + p1.h / 2, { size: 14, color: C.bad, align: 'center', baseline: 'middle' });
          const recent = st.events.filter((e) => st.now - e.t < 1500);
          if (recent.some((e) => e.k === 'det')) D.text(g, GTL.L('디싱크 감지', 'Desync detected'), p1.x + p1.w - 6, p1.y + 5, { size: 11, color: C.bad, align: 'right' });
          else if (recent.some((e) => e.k === 'sync')) D.text(g, GTL.L('재동기화됨', 'Resynced'), p1.x + p1.w - 6, p1.y + 5, { size: 11, color: C.good, align: 'right' });

          // 상태 차이 그래프 (log10)
          const t = L.tl;
          const lg = st.diffHist.map((v) => U.clamp(Math.log10(v + 1e-13), -12, 2));
          D.rect(g, t.x, t.y, t.w, t.h, 'rgba(0,0,0,0.35)');
          for (let e = -12; e <= 2; e += 2) {
            const y = t.y + t.h - ((e + 12) / 14) * t.h;
            D.line(g, t.x + 30, y, t.x + t.w, y, 'rgba(255,255,255,0.05)');
            D.text(g, `1e${e}`, t.x + 26, y, { size: 8, color: C.dim, align: 'right', baseline: 'middle' });
          }
          D.plot(g, lg, t.x + 30, t.y, t.w - 30, t.h, { min: -12, max: 2, color: col, background: false });
          D.text(g, GTL.L('두 피어의 평균 위치 차이 (px, 로그 눈금), 최근 20초', 'Avg position gap between peers (px, log scale), last 20 s'), t.x + 34, t.y + 2, { size: 10, color: C.dim });

          const lat = st.detected && st.injected ? st.detected.t - (INJ_TICK * SIM_MS) : null;
          ctx.stat(GTL.L('두 피어 상태 차이', 'State gap between peers'), st.lastDiff === 0 ? GTL.L('0 (일치)', '0 (match)') : st.lastDiff.toExponential(1) + ' px');
          ctx.stat(GTL.L('점수 (피어 1 / 피어 2)', 'Score (peer 1 / peer 2)'), `${A.S.score.join(':')} / ${B.S.score.join(':')}`);
          ctx.stat(GTL.L('디싱크 감지', 'Desync detected'), !P.detect ? GTL.L('- (체크섬 없음)', '- (no checksum)') : st.detected ? GTL.L(`턴 ${st.detected.turn}`, `Turn ${st.detected.turn}`) + (lat !== null && P.inject === 'once' ? GTL.L(`, ${lat.toFixed(0)}ms 뒤`, `, after ${lat.toFixed(0)}ms`) : '') : GTL.L('없음', 'None'));
          ctx.stat(GTL.L('재동기화 횟수', 'Resync count'), st.resyncs);
          ctx.stat(GTL.L('대기 틱 (명령 미도착)', 'Stall ticks (commands missing)'), `${A.stall} / ${B.stall}`);
        },
        onAction(key) { if (key === 'restart') init(); },
      };
    },
  });
})();
