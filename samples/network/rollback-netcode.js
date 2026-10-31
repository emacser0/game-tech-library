// 롤백 넷코드 (GGPO 방식) vs 딜레이 기반 락스텝, 2인 대전 시뮬레이션
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

  // ───────── 결정론적 대전 시뮬레이션 (입력 비트: 1=←, 2=→, 4=공격) ─────────
  const STAGE_L = 20, STAGE_R = 380, REACH = 48;
  const newFighter = (x, face) => ({ x, vx: 0, face, st: 'idle', t: 0, hit: false, hp: 100 });
  const newGame = () => ({ p: [newFighter(130, 1), newFighter(270, -1)], round: 0 });
  const cloneF = (f) => ({ x: f.x, vx: f.vx, face: f.face, st: f.st, t: f.t, hit: f.hit, hp: f.hp });
  const cloneG = (g) => ({ p: [cloneF(g.p[0]), cloneF(g.p[1])], round: g.round });
  function stepFighter(me, other, inp) {
    if (me.st === 'stun') {
      me.t--; me.x += me.vx; me.vx *= 0.82;
      if (me.t <= 0) me.st = 'idle';
    } else if (me.st === 'atk') {
      me.t++;
      if (me.t >= 6 && me.t < 10 && !me.hit && other.st !== 'stun') {
        const d = (other.x - me.x) * me.face;
        if (d > 0 && d < REACH) { me.hit = true; other.st = 'stun'; other.t = 20; other.vx = me.face * 7; other.hp -= 12; }
      }
      if (me.t >= 22) me.st = 'idle';
    } else {
      const dir = (inp & 2 ? 1 : 0) - (inp & 1 ? 1 : 0);
      me.x += dir * 2.6;
      if (inp & 4) { me.st = 'atk'; me.t = 0; me.hit = false; }
    }
  }
  function stepGame(g0, in0, in1) {
    const g = cloneG(g0);
    const [a, b] = g.p;
    stepFighter(a, b, in0);
    stepFighter(b, a, in1);
    for (const f of g.p) f.x = U.clamp(f.x, STAGE_L, STAGE_R);
    if (a.x > b.x - 24) { const mid = (a.x + b.x) / 2; a.x = mid - 12; b.x = mid + 12; } // 서로 밀기 (a는 항상 왼쪽 시작)
    for (const [me, ot] of [[a, b], [b, a]]) if (me.st === 'idle') me.face = ot.x >= me.x ? 1 : -1;
    if (a.hp <= 0 || b.hp <= 0) { const r = g.round + 1; const n = newGame(); n.round = r; return n; }
    return g;
  }

  GTL.register({
    id: 'rollback-netcode',
    title: '롤백 넷코드 vs 딜레이 기반 (GGPO)',
    summary: '딜레이 기반 락스텝은 상대 입력이 올 때까지 기다림. 그래서 지연이 입력 지연을 넘으면 게임이 멈춤. 롤백은 상대 입력을 예측해 바로 진행하고, 예측이 틀리면 과거 프레임으로 되돌아가 다시 시뮬레이션함.',
    views: { a: '딜레이 기반 (입력 지연 4F)', b: '롤백 (입력 지연 2F)' },
    controls: '← → / A D 이동, Space 또는 Z 공격 (P1, 두 뷰 동시). P2는 결정론적 봇',
    info: `
      <p>대전 격투 게임의 두 동기화 방식을 비교함. 두 피어는 <b>같은 입력으로 같은 결정론적 시뮬레이션</b>을 돌림. 그래서 상태 대신 입력만 주고받음.</p>
      <p><b>딜레이 기반(lockstep)</b>: 내 입력을 D프레임 뒤에 적용하도록 예약하고, 그동안 상대 입력이 도착하기를 기다림.</p>
      <ul>
        <li>편도 지연이 D × 16.7ms보다 크면 상대 입력이 제때 오지 않음. 그러면 <b>게임 전체가 멈춤</b>(지터만 있어도 끊김).</li>
        <li>입력 지연을 늘리면 멈춤은 줄지만 조작감이 둔해짐.</li>
      </ul>
      <p><b>롤백(rollback, GGPO)</b>: 입력 지연은 짧게 두고, 아직 안 온 상대 입력을 "직전 입력 반복"으로 <b>예측</b>해 바로 진행함.</p>
      <ul>
        <li>매 프레임 상태를 저장해 둠.</li>
        <li>실제 입력이 예측과 다르면 저장한 상태로 되돌아감(rollback).</li>
        <li>그 프레임부터 현재 프레임까지 다시 시뮬레이션함.</li>
        <li>내 조작감은 오프라인과 거의 같음.</li>
      </ul>
      <p>단점: 화면에서 상대가 순간이동할 수 있음. 예측할 수 있는 최대 프레임 수를 넘으면 롤백도 멈춤.</p>
      <p>입력 패킷은 매 틱 최근 8프레임 입력을 중복으로 담음. 그래서 손실이 생겨도 다음 패킷으로 복구됨. (단순화: 원격 피어는 항상 나와 같은 프레임에 있다고 가정)</p>`,
    diagram: (L) => `<svg viewBox="0 0 540 182" xmlns="http://www.w3.org/2000/svg">
      <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
      <text x="4" y="44" class="t-a">${L('A: 딜레이', 'A: delay')}</text>
      ${['F1', 'F2', 'F3', 'F4', '', '', 'F5', 'F6'].map((f, i) => `<rect x="${110 + i * 34}" y="28" width="32" height="24" class="f-dim"/>${f ? `<text x="${126 + i * 34}" y="44" text-anchor="middle" class="t-small t-mono">${f}</text>` : `<rect x="${110 + i * 34}" y="28" width="32" height="24" class="d-bad"/><text x="${126 + i * 34}" y="44" text-anchor="middle" class="t-small t-dim">${L('대기', 'stall')}</text>`}`).join('')}
      <text x="110" y="70" class="t-small t-a">${L('상대 입력이 늦으면 게임 전체가 멈춤', 'If the remote input is late, the whole game stalls')}</text>
      <text x="4" y="136" class="t-b">${L('B: 롤백', 'B: rollback')}</text>
      ${['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8'].map((f, i) => `<rect x="${110 + i * 34}" y="120" width="32" height="24" class="${i >= 3 && i <= 5 ? 'f-b' : 'f-dim'}"/><text x="${126 + i * 34}" y="136" text-anchor="middle" class="t-small t-mono">${f}</text>`).join('')}
      <path d="M331,118 C322,96 238,96 229,118" class="d-accent" marker-end="url(#arr)"/>
      <text x="280" y="92" text-anchor="middle" class="t-small">${L('F7에서 실제 입력 도착, 예측과 다름', 'Real input arrives at F7 and differs')}</text>
      <rect x="110" y="158" width="12" height="12" class="f-b"/>
      <text x="128" y="168" class="t-small t-dim">${L('F4~F6: 예측 입력으로 진행 후, 되돌아가 다시 계산', 'F4~F6: predicted (repeat last input), then rolled back and re-simulated')}</text>
    </svg>`,
    look: [
      '"정지 틱 비율"을 비교하면, A는 비율이 높고 게임이 자주 멈칫함(프레임 막대의 빨간 틱). B는 멈추지 않음.',
      'B의 P1 화면을 "정답" 패널과 비교하면, P2(분홍)가 가끔 순간이동함. 노란(예측) 프레임이 확정되며 롤백이 일어난 순간임.',
      'A의 입력 지연을 7 이상으로 올리면 멈춤은 사라지지만, 내 캐릭터가 키보다 한참 늦게 움직임.',
      'B의 편도 지연을 250ms로 올리고 최대 예측/롤백을 4로 낮추면, 예측 범위를 넘어 롤백도 멈춤.',
      '"재시뮬레이션 프레임/초"를 보면 롤백의 CPU 비용을 알 수 있음.',
    ],
    refs: [
      { type: 'code', title: 'GGPO - Rollback Networking SDK', url: 'https://github.com/pond3r/ggpo', note: 'Tony Cannon. 2019년 MIT 라이선스로 공개.' },
      { type: 'article', title: 'Fight the Lag! The Trick Behind GGPO\'s Low-Latency Netcode', year: 2012, note: 'Tony Cannon, Game Developer Magazine (2012년 9월).' },
      { type: 'talk', title: '8 Frames in 16ms: Rollback Networking in Mortal Kombat and Injustice 2', year: 2018, note: 'Michael Stallone (NetherRealm), GDC 2018.' },
      { type: 'article', title: 'Deterministic Lockstep', url: 'https://gafferongames.com/post/deterministic_lockstep/', note: 'Glenn Fiedler. 입력만 교환하는 결정론적 동기화.' },
      { type: 'talk', title: '1500 Archers on a 28.8: Network Programming in Age of Empires and Beyond', year: 2001, note: 'Paul Bettner & Mark Terrano, GDC 2001. RTS 락스텝과 턴 지연.' },
    ],
    params: [
      { key: 'lat', label: '편도 지연 (ms)', type: 'int', min: 0, max: 300, default: 90, shared: true, group: '네트워크' },
      { key: 'jitter', label: '지터 (ms)', type: 'int', min: 0, max: 80, default: 15, shared: true },
      { key: 'loss', label: '패킷 손실률', type: 'range', min: 0, max: 0.3, step: 0.01, default: 0.03, shared: true },
      { key: 'auto', label: '자동 입력 (P1)', type: 'bool', default: true, shared: true, group: '장면' },
      { key: 'mode', label: '넷코드', type: 'select', group: '기법', options: [
        { value: 'delay', label: '딜레이 기반 (락스텝)' },
        { value: 'rollback', label: '롤백 (GGPO)' },
      ], a: 'delay', b: 'rollback' },
      { key: 'delay', label: '입력 지연 (프레임)', type: 'int', min: 0, max: 10, default: 2, a: 4, b: 2 },
      { key: 'maxRb', label: '최대 예측/롤백 (프레임)', type: 'int', min: 1, max: 15, default: 8, when: (p) => p.mode === 'rollback' },
      { key: 'restart', label: '다시 시작', type: 'button' },
    ],
    en: {
      title: 'Rollback Netcode vs Delay-based (GGPO)',
      summary: 'Delay-based lockstep waits until the other player\'s input arrives. So when latency is larger than the input delay, the game freezes. Rollback predicts the other input and keeps going. If the prediction is wrong, it goes back to a past frame and simulates again.',
      views: { a: 'Delay-based (input delay 4F)', b: 'Rollback (input delay 2F)' },
      controls: 'Left / Right, A / D: move. Space or Z: attack (P1, both views). P2 is a deterministic bot.',
      info: `
      <p>This compares two sync methods for fighting games. Both peers run <b>the same deterministic simulation with the same inputs</b>. So they exchange only inputs, not state.</p>
      <p><b>Delay-based (lockstep)</b>: schedule my input to apply D frames later, and wait for the other input to arrive in the meantime.</p>
      <ul>
        <li>If one-way latency is larger than D × 16.7ms, the other input does not arrive in time. Then <b>the whole game freezes</b> (jitter alone causes hitches).</li>
        <li>More input delay means fewer freezes, but controls feel sluggish.</li>
      </ul>
      <p><b>Rollback (GGPO)</b>: keep the input delay short. <b>Predict</b> the other input that has not arrived yet by "repeating the last input", and keep going.</p>
      <ul>
        <li>Save the state every frame.</li>
        <li>If the real input differs from the prediction, go back to the saved state (rollback).</li>
        <li>Simulate again from that frame to the current frame.</li>
        <li>My controls feel almost the same as offline.</li>
      </ul>
      <p>Downside: the other player can teleport on screen. If prediction goes past the max frame count, rollback also freezes.</p>
      <p>Each tick, the input packet repeats the inputs of the last 8 frames. So the next packet fixes any loss. (Simplification: the remote peer is always on the same frame as me.)</p>`,
      look: [
        'Compare "Stall tick rate". A has a high rate and often hitches (red ticks in the frame bar). B never freezes.',
        'Compare B\'s P1 view with the "Ground truth" panel. P2 (pink) sometimes teleports. That is the moment a yellow (predicted) frame gets confirmed and a rollback happens.',
        'Raise A\'s input delay to 7 or more. Freezes disappear, but your character moves well after you press the key.',
        'Raise B\'s one-way latency to 250ms and lower max prediction/rollback to 4. Prediction runs out of range, and rollback freezes too.',
        '"Resimulated frames per s" shows the CPU cost of rollback.',
      ],
      refs: [
        'Tony Cannon. Released under the MIT license in 2019.',
        'Tony Cannon, Game Developer Magazine (September 2012).',
        'Michael Stallone (NetherRealm), GDC 2018.',
        'Glenn Fiedler. Deterministic sync that exchanges only inputs.',
        'Paul Bettner & Mark Terrano, GDC 2001. RTS lockstep and turn delay.',
      ],
      params: {
        lat: { label: 'One-way latency (ms)', group: 'Network' },
        jitter: 'Jitter (ms)',
        loss: 'Packet loss rate',
        auto: { label: 'Auto input (P1)', group: 'Scene' },
        mode: { label: 'Netcode', group: 'Technique', options: { delay: 'Delay-based (lockstep)', rollback: 'Rollback (GGPO)' } },
        delay: 'Input delay (frames)',
        maxRb: 'Max prediction/rollback (frames)',
        restart: 'Restart',
      },
    },

    setup(ctx) {
      const P = ctx.params;
      let st, seed;
      const botIn = (f) => {
        if (f < 12) return 0; // 시작 직후(입력 지연 구간)는 양쪽 모두 중립 입력
        const blk = Math.floor(f / 14);
        const r = hash01(seed, 31, blk);
        let v = r < 0.33 ? 1 : r < 0.66 ? 2 : 0;
        if (f % 14 < 3 && hash01(seed, 32, blk) < 0.4) v |= 4;
        return v;
      };
      function localInput() {
        const k = ctx.input;
        let v = 0;
        if (k.key('ArrowLeft') || k.key('KeyA')) v |= 1;
        if (k.key('ArrowRight') || k.key('KeyD')) v |= 2;
        if (k.key('Space') || k.key('KeyZ')) v |= 4;
        if (!v && P.auto) {
          const mx = autoMove(st.now / 1000).x;
          if (mx < 0) v |= 1; else if (mx > 0) v |= 2;
          const blk = Math.floor(st.now / 400);
          if (st.now % 400 < 50 && hash01(seed, 33, blk) < 0.45) v |= 4;
        }
        return v;
      }
      function init() {
        ctx.rng = U.rng(ctx.seed);
        seed = ctx.rng.int(1, 1e9);
        st = {
          now: 0, tick: 0, acc: 0, link: new Link(seed, 7),
          cur: 0, game: newGame(), truth: newGame(),
          localIn: new Map(), remoteIn: new Map(), used: new Map(), states: new Map(), conf: -1, sentUpTo: -1,
          tickLog: [], rbMark: new Map(), rbWin: [], resimWin: [], maxDepth: 0, errHist: [], stalls: 0, ticks: 0,
        };
      }
      init();

      function updateConf() { while (st.remoteIn.has(st.conf + 1)) st.conf++; }
      const predict = () => (st.conf >= 0 ? st.remoteIn.get(st.conf) : 0);

      // 한 프레임 진행 (cur → cur+1)
      function advance(remoteVal) {
        const c = st.cur, Dl = P.delay;
        // 내 입력을 c+D 프레임에 예약 (이미 예약된 프레임은 유지. 입력 지연 변경 시 보호)
        if (!st.localIn.has(c + Dl)) st.localIn.set(c + Dl, localInput());
        // 같은 시점에 원격 피어(같은 프레임에 있다고 가정)도 자기 입력 c+D를 만듦
        st.sentUpTo = Math.max(st.sentUpTo, c + Dl);
        const li = st.localIn.get(c) ?? 0;
        st.states.set(c, st.game);
        st.used.set(c, remoteVal);
        st.game = stepGame(st.game, li, remoteVal);
        st.truth = stepGame(st.truth, li, botIn(c));
        st.cur++;
        for (const k of st.states.keys()) if (k < st.cur - 90) { st.states.delete(k); st.used.delete(k); st.localIn.delete(k); st.remoteIn.delete(k); st.rbMark.delete(k); }
      }

      function tick() {
        st.now += STEP; st.tick++; st.ticks++;
        // 지연 0 이하 프레임은 양쪽 모두 중립 입력으로 확정
        for (let f = 0; f < P.delay; f++) if (!st.remoteIn.has(f) && st.cur < 90) st.remoteIn.set(f, 0);
        let rbFrom = Infinity;
        for (const p of st.link.poll(st.now)) {
          for (const [f, v] of p.data) {
            if (st.remoteIn.has(f) || f < st.cur - 90) continue;
            st.remoteIn.set(f, v);
            if (f < st.cur && st.used.has(f) && st.used.get(f) !== v) rbFrom = Math.min(rbFrom, f);
          }
        }
        updateConf();
        let advanced = false;
        if (P.mode === 'delay') {
          if (st.remoteIn.has(st.cur)) { advance(st.remoteIn.get(st.cur)); advanced = true; }
        } else {
          // 롤백: 예측이 틀린 가장 이른 프레임으로 되돌아가 재시뮬레이션
          if (rbFrom < st.cur && st.states.has(rbFrom)) {
            let g = st.states.get(rbFrom);
            const pv = predict();
            for (let f = rbFrom; f < st.cur; f++) {
              const rv = st.remoteIn.has(f) ? st.remoteIn.get(f) : pv;
              st.states.set(f, g); st.used.set(f, rv);
              g = stepGame(g, st.localIn.get(f) ?? 0, rv);
              st.rbMark.set(f, st.now);
            }
            st.game = g;
            const depth = st.cur - rbFrom;
            st.rbWin.push(st.now); st.resimWin.push({ t: st.now, n: depth });
            st.maxDepth = Math.max(st.maxDepth, depth);
          }
          if (st.cur - 1 - st.conf < P.maxRb) {
            advance(st.remoteIn.has(st.cur) ? st.remoteIn.get(st.cur) : predict());
            advanced = true;
          }
        }
        if (!advanced) st.stalls++;
        // 원격 피어는 매 틱 최근 8프레임 입력을 보냄 (중복 → 손실 복구, 정지 중에도 재전송)
        if (st.sentUpTo >= 0) {
          const ins = [];
          for (let f = Math.max(0, st.sentUpTo - 7); f <= st.sentUpTo; f++) ins.push([f, botIn(f)]);
          st.link.send(st.now, st.tick, ins, { lat: P.lat, jit: P.jitter, loss: P.loss }, 28 + 4 + ins.length);
        }
        st.tickLog.push(advanced ? 1 : 0); if (st.tickLog.length > 90) st.tickLog.shift();
        while (st.rbWin.length && st.rbWin[0] < st.now - 1000) st.rbWin.shift();
        while (st.resimWin.length && st.resimWin[0].t < st.now - 1000) st.resimWin.shift();
        st.errHist.push(Math.abs(st.game.p[1].x - st.truth.p[1].x) + Math.abs(st.game.p[0].x - st.truth.p[0].x));
        if (st.errHist.length > 180) st.errHist.shift();
      }

      function drawStage(g, r, game, col) {
        const m = fit(r, 400, 170);
        const floor = m.Y(140);
        D.rect(g, m.ox, m.oy, m.w, m.h, 'rgba(0,0,0,0.15)', 'rgba(255,255,255,0.15)');
        D.line(g, m.X(STAGE_L - 10), floor, m.X(STAGE_R + 10), floor, 'rgba(255,255,255,0.3)', 2);
        game.p.forEach((f, i) => {
          const c = i === 0 ? col : '#f06292';
          const w = 22 * m.s, h = 56 * m.s, x = m.X(f.x);
          const stun = f.st === 'stun';
          D.rect(g, x - w / 2, floor - h, w, h, stun ? '#ffffff' : c);
          D.rect(g, x + f.face * w * 0.15 - 3 * m.s, floor - h + 8 * m.s, 6 * m.s, 6 * m.s, '#14161a');
          if (f.st === 'atk') {
            const active = f.t >= 6 && f.t < 10;
            const len = (active ? REACH - 11 : 14) * m.s;
            D.rect(g, f.face > 0 ? x + w / 2 : x - w / 2 - len, floor - h * 0.68, len, 8 * m.s, active ? C.warn : 'rgba(255,203,107,0.4)');
          }
          // 체력 바
          const bw = m.w * 0.4, bx = i === 0 ? m.ox + 6 : m.ox + m.w - 6 - bw, by = m.oy + 6;
          D.rect(g, bx, by, bw, 6, 'rgba(255,255,255,0.1)');
          D.rect(g, i === 0 ? bx : bx + bw * (1 - f.hp / 100), by, bw * U.clamp(f.hp / 100, 0, 1), 6, c);
        });
        D.text(g, GTL.L(`라운드 ${game.round + 1}`, `Round ${game.round + 1}`), m.ox + m.w / 2, m.oy + 4, { size: 10, color: C.dim, align: 'center' });
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

          panel(g, p0, GTL.L(`P1 화면, 프레임 ${st.cur}`, `P1 view, frame ${st.cur}`), col);
          drawStage(g, p0, st.game, col);
          panel(g, p1, GTL.L('정답 (모든 입력을 아는 경우)', 'Ground truth (all inputs known)'), C.good);
          drawStage(g, p1, st.truth, col);

          panel(g, p2, GTL.L('프레임 상태', 'Frame state'), C.dim);
          const n = 30, cw = Math.max(3, (p2.w - 12) / n), fx = p2.x + 6, fy = p2.y + 24;
          for (let i = 0; i < n; i++) {
            const f = st.cur - n + i;
            if (f < 0) continue;
            let fill = C.good;                                      // 확정 입력으로 시뮬레이션
            if (!st.remoteIn.has(f)) fill = C.warn;                 // 예측 중
            const rb = st.rbMark.get(f);
            D.rect(g, fx + i * cw + 0.5, fy, cw - 1, 16, fill);
            if (rb !== undefined && st.now - rb < 400) D.rect(g, fx + i * cw + 0.5, fy + 18, cw - 1, 4, C.bad);
          }
          D.text(g, GTL.L('녹=확정 노=예측 빨=재시뮬', 'Green=confirmed Yellow=predicted Red=resim'), fx, fy + 25, { size: 9, color: C.dim });
          const ty = fy + 40;
          const tw = (p2.w - 12) / 90;
          st.tickLog.forEach((v, i) => D.rect(g, fx + i * tw, ty, Math.max(1, tw - 0.5), 8, v ? 'rgba(102,209,122,0.6)' : C.bad));
          D.text(g, GTL.L('실시간 틱: 진행 / 정지(빨)', 'Real-time ticks: advance / stall (red)'), fx, ty + 11, { size: 9, color: C.dim });
          const gy = ty + 28, gh = Math.max(16, p2.y + p2.h - gy - 6);
          D.plot(g, st.errHist, fx, gy, p2.w - 12, gh, { min: 0, max: 60, color: C.bad, label: GTL.L('정답과의 위치 차이', 'Position gap vs ground truth') });

          drawTimeline(g, L.tl, st.now, 1000, [{ link: st.link, dir: 1, color: '#f06292', lw: 1.2, dot: 3 }], ['P2', 'P1']);

          const resim = st.resimWin.reduce((a, b) => a + b.n, 0);
          ctx.stat(GTL.L('입력 지연', 'Input delay'), `${P.delay}F (${(P.delay * STEP).toFixed(0)} ms)`);
          ctx.stat(GTL.L('정지 틱 비율', 'Stall tick rate'), ((st.tickLog.filter((v) => !v).length / Math.max(1, st.tickLog.length)) * 100).toFixed(0) + ' %');
          ctx.stat(GTL.L('롤백/초', 'Rollbacks per s'), st.rbWin.length);
          ctx.stat(GTL.L('재시뮬레이션 프레임/초', 'Resimulated frames per s'), resim);
          ctx.stat(GTL.L('최대 롤백 깊이', 'Max rollback depth'), st.maxDepth + 'F');
          ctx.stat(GTL.L('예측 중 프레임', 'Predicted frames'), Math.max(0, st.cur - 1 - st.conf));
        },
        onAction(key) { if (key === 'restart') init(); },
      };
    },
  });
})();
