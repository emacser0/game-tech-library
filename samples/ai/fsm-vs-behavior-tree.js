// 유한 상태 기계 vs 행동 트리: 같은 행동, 다른 구조
GTL.register({
  id: 'fsm-vs-behavior-tree',
  title: '유한 상태 기계 (FSM) vs 행동 트리 (BT)',
  summary: '같은 경비병 행동을 평면 FSM과 행동 트리로 각각 구현해 비교. 행동은 두 뷰가 똑같음. 요구사항(행동)을 하나씩 늘리면 FSM의 전이 수는 제곱으로 늘고, 행동 트리의 노드 수는 일정하게 3개씩 늘어남.',
  views: { a: '평면 FSM', b: '행동 트리' },
  info: `
    <p><b>유한 상태 기계(FSM, Finite State Machine)</b>: 상태(순찰, 추격 등)와 상태 사이의 전이(조건이 맞으면 다른 상태로 넘어감)로 행동을 표현</p>
    <p>우선순위가 있는 행동을 평면 FSM으로 만들면 문제가 생김</p>
    <ul>
      <li>더 급한 행동(도망 등)은 <b>모든 상태</b>에서 끼어들 수 있어야 함. 상태마다 전이를 하나씩 더함.</li>
      <li>급한 일이 끝나면 "지금 맞는 다음 행동"으로 돌아가야 함. 그 사이 행동의 조건이 모두 거짓인지 가드에 넣어야 함.</li>
      <li>결과: 상태 n개에 전이 n(n-1)개. 새 행동 하나를 넣을 때 기존 상태 대부분을 고침. 상태 폭발(state explosion)이라 부름.</li>
    </ul>
    <p><b>행동 트리(BT, Behavior Tree)</b>: 매 틱 루트에서 아래로 내려가며 실행할 행동을 고름</p>
    <ul>
      <li><b>선택(Selector, ?)</b>: 자식을 왼쪽부터 실행해 처음 성공하거나 실행 중인 자식에서 멈춤. 왼쪽이 우선순위가 높음.</li>
      <li><b>순서(Sequence, →)</b>: 자식을 차례로 실행해 하나라도 실패하면 멈춤. "조건 → 행동" 쌍을 만듦.</li>
      <li>새 행동은 선택 노드에 자식 하나를 끼워 넣으면 끝. 다른 가지를 고치지 않음.</li>
    </ul>
    <p>BT의 단점: 매 틱 위에서부터 다시 평가. 오래 걸리는 행동은 "실행 중" 상태 관리 필요. (이 샘플의 FSM은 덜 급한 상태로 가는 가드까지 매 틱 검사해서 "조건 검사 / 틱"이 오히려 더 많음.) 상태를 직접 기억하는 FSM이 더 단순한 경우도 많음(애니메이션, 문 열림 같은 작은 상태).</p>`,
  look: [
    '기본값(행동 7개)에서 A의 상태 그림은 전이 42개가 엉켜 있음. B의 트리는 노드 20개가 한 줄로 늘어섬.',
    '"요구사항 수"를 1에서 6까지 올리며 "전이 수"와 "노드 수"를 비교. FSM은 2, 6, 12, 20, 30, 42로 늘고 BT는 5, 8, 11, 14, 17, 20으로 늘어남.',
    '"새 행동 1개 추가 시"를 보면 FSM은 기존 상태를 모두 고쳐야 함(새 상태로 가는 전이를 각 상태에 추가). BT는 항상 노드 3개 추가, 기존 노드 수정 0곳.',
    '두 뷰의 경비병 움직임과 "현재 행동"은 항상 같음. 구조만 다르고 결과는 같음.',
  ],
  refs: [
    { type: 'talk', title: 'Handling Complexity in the Halo 2 AI', year: 2005, note: 'Damian Isla, GDC 2005. 게임 AI에 행동 트리(계층적 FSM 확장)를 알린 발표.' },
    { type: 'book', title: 'Behavior Trees in Robotics and AI: An Introduction', url: 'https://arxiv.org/abs/1709.00084', year: 2018, note: 'Michele Colledanchise, Petter Ögren. CRC Press. FSM과 BT의 모듈성 비교.' },
    { type: 'paper', title: 'Statecharts: A Visual Formalism for Complex Systems', year: 1987, note: 'David Harel. Science of Computer Programming 8(3). 평면 상태 기계의 상태 폭발과 계층 상태.' },
    { type: 'book', title: 'Game Programming Patterns - State', url: 'https://gameprogrammingpatterns.com/state.html', year: 2014, note: 'Robert Nystrom. FSM, 계층 상태 기계, 푸시다운 오토마타.' },
    { type: 'book', title: 'Artificial Intelligence for Games (3rd ed.)', year: 2019, note: 'Ian Millington. 상태 기계와 행동 트리 장.' },
  ],
  params: [
    { key: 'arch', label: '구조', type: 'select', group: '의사결정', options: [
      { value: 'fsm', label: '평면 FSM (상태 + 전이)' },
      { value: 'bt', label: '행동 트리 (선택 + 순서)' },
    ], a: 'fsm', b: 'bt' },
    { key: 'reqs', label: '요구사항 수', type: 'int', min: 1, max: 6, default: 6, shared: true, reset: true, help: '1: 순찰+추격, 2: +공격, 3: +소리 조사, 4: +재장전, 5: +회복, 6: +도망' },
    { key: 'simSpeed', label: '시뮬레이션 배속', type: 'range', min: 0.25, max: 4, step: 0.25, default: 1, shared: true, group: '장면' },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Finite State Machine (FSM) vs Behavior Tree (BT)',
    summary: 'Builds the same guard behavior twice, once as a flat FSM and once as a behavior tree. Both views behave exactly the same. As you add requirements (behaviors) one by one, FSM transitions grow with the square, while behavior tree nodes grow by a steady 3 each time.',
    views: { a: 'Flat FSM', b: 'Behavior tree' },
    info: `
    <p>A <b>finite state machine (FSM)</b> describes behavior with states (patrol, chase and so on) and transitions between them (when a condition holds, it moves to another state).</p>
    <p>Building prioritized behaviors as a flat FSM causes problems.</p>
    <ul>
      <li>A more urgent behavior (such as flee) must be able to interrupt from <b>every state</b>. You add one transition to each state.</li>
      <li>When the urgent task ends, the guard must return to "the right next behavior". The guard must check that the conditions of every behavior in between are false.</li>
      <li>Result: n states need n(n-1) transitions. Adding one new behavior means editing most existing states. This is called state explosion.</li>
    </ul>
    <p>A <b>behavior tree (BT)</b> walks down from the root every tick and picks the behavior to run.</p>
    <ul>
      <li><b>Selector (?)</b>: runs children from the left and stops at the first child that succeeds or is running. Left means higher priority.</li>
      <li><b>Sequence (→)</b>: runs children in order and stops if any one fails. It forms "condition → action" pairs.</li>
      <li>To add a behavior, you insert one child into the selector. You do not edit other branches.</li>
    </ul>
    <p>BT downsides: it re-evaluates from the top every tick. Long actions need "running" state handling. (The FSM in this sample also checks guards toward less urgent states every tick, so its "Condition checks / tick" is actually higher.) An FSM that stores its state directly is often simpler (for small states like animation or an open door).</p>`,
    look: [
      'With the default (7 behaviors), A\'s state diagram is a tangle of 42 transitions. B\'s tree lines up 20 nodes in one row.',
      'Raise "Requirements" from 1 to 6 and compare "Transitions" and "Nodes". The FSM grows 2, 6, 12, 20, 30, 42. The BT grows 5, 8, 11, 14, 17, 20.',
      'Look at "Adding 1 new behavior". The FSM must edit every existing state (each one gets a transition to the new state). The BT always adds 3 nodes and edits 0 existing nodes.',
      'The guard\'s movement and "Current behavior" are always the same in both views. Only the structure differs. The result is the same.',
    ],
    refs: [
      'Damian Isla, GDC 2005. The talk that brought behavior trees (an extension of hierarchical FSMs) to game AI.',
      'Michele Colledanchise, Petter Ögren. CRC Press. Compares the modularity of FSMs and BTs.',
      'David Harel. Science of Computer Programming 8(3). State explosion in flat state machines, and hierarchical states.',
      'Robert Nystrom. FSMs, hierarchical state machines, pushdown automata.',
      'Ian Millington. Chapters on state machines and behavior trees.',
    ],
    params: {
      arch: { label: 'Structure', group: 'Decision making', options: { fsm: 'Flat FSM (states + transitions)', bt: 'Behavior tree (selector + sequence)' } },
      reqs: { label: 'Requirements', help: '1: patrol+chase, 2: +attack, 3: +check noise, 4: +reload, 5: +heal, 6: +flee' },
      simSpeed: { label: 'Simulation speed', group: 'Scene' },
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, V = U.v2, D = U.draw, C = U.colors, P = ctx.params;
    const AW = 300; // 경기장 크기 (월드 단위)
    // 우선순위 순서 (위가 더 급함). req: 몇 번째 요구사항에서 추가되는지
    const ALL = [
      { id: 'flee', name: '도망', en: 'Flee', req: 6, label: 'hp<0.3', labelEn: 'hp<0.3', cond: (b) => b.hp < 0.3 },
      { id: 'reload', name: '재장전', en: 'Reload', req: 4, label: '탄=0', labelEn: 'ammo=0', cond: (b) => b.ammo === 0 },
      { id: 'attack', name: '공격', en: 'Attack', req: 2, label: '거리<70', labelEn: 'dist<70', cond: (b) => b.seen && b.dist < 70 },
      { id: 'chase', name: '추격', en: 'Chase', req: 1, label: '보임', labelEn: 'seen', cond: (b) => b.seen },
      { id: 'investigate', name: '소리 조사', en: 'Check noise', req: 3, label: '소리', labelEn: 'noise', cond: (b) => b.noise },
      { id: 'heal', name: '회복', en: 'Heal', req: 5, label: 'hp<0.7', labelEn: 'hp<0.7', cond: (b) => b.hp < 0.7 },
      { id: 'patrol', name: '순찰', en: 'Patrol', req: 0, label: '', labelEn: '', cond: () => true },
    ];
    const pick = (k) => ALL.filter((x) => x.req <= k);

    // 평면 FSM: 모든 상태 쌍에 전이. 더 급한 상태로: [cond_to]. 덜 급한 상태로: [!cond_from, !cond(사이 상태)..., cond_to]
    function buildFSM(states) {
      const tr = [];
      states.forEach((from, i) => {
        // 검사 순서: 더 급한 상태부터, 그다음 덜 급한 상태
        states.forEach((to, j) => {
          if (j >= i) return;
          tr.push({ from: i, to: j, terms: [{ s: j, neg: false }] });
        });
        states.forEach((to, j) => {
          if (j <= i) return;
          const terms = [{ s: i, neg: true }];
          for (let k = i + 1; k < j; k++) terms.push({ s: k, neg: true });
          if (to.id !== 'patrol') terms.push({ s: j, neg: false });
          tr.push({ from: i, to: j, terms });
        });
      });
      return tr;
    }
    const sig = (t, st) => st[t.from].id + '>' + st[t.to].id;
    function fsmDelta(k) {
      if (k >= 6) return null;
      const s0 = pick(k), s1 = pick(k + 1), t0 = buildFSM(s0), t1 = buildFSM(s1);
      const m0 = new Map(t0.map((t) => [sig(t, s0), t.terms.map((q) => (q.neg ? '!' : '') + s0[q.s].id).join(',')]));
      let added = 0, changed = 0; const touched = new Set();
      for (const t of t1) {
        const key = sig(t, s1), g = t.terms.map((q) => (q.neg ? '!' : '') + s1[q.s].id).join(',');
        if (!m0.has(key)) added++; else if (m0.get(key) !== g) changed++; else continue;
        if (s1[t.from].req <= k) touched.add(t.from);
      }
      return { added, changed, touched: touched.size };
    }

    let states, trans, delta, bb, guard, enemy, noisePos, noiseRng, nextNoise, cur, lastTr, lastTrT, evalSum, ticks, evalNow, btEval, simT, downs, timeIn, shotT, reloadT, flash;
    function init() {
      states = pick(P.reqs);
      trans = buildFSM(states);
      delta = fsmDelta(P.reqs);
      noiseRng = U.rng(ctx.seed * 31 + 9);
      guard = { p: V(60, 60), wp: 1, hp: 1, ammo: 6 };
      enemy = V(150, 150);
      bb = { hp: 1, ammo: 6, seen: false, dist: 999, noise: false };
      noisePos = null; nextNoise = 3;
      cur = states.length - 1; lastTr = null; lastTrT = 0;
      evalSum = 0; ticks = 0; evalNow = 0; btEval = []; simT = 0; downs = 0; shotT = 0; reloadT = 0; flash = 0;
      timeIn = {};
    }
    init();
    const WPS = [V(50, 50), V(250, 50), V(250, 250), V(50, 250)];

    function sense() {
      bb.dist = V.dist(guard.p, enemy);
      bb.seen = bb.dist < 120;
      bb.hp = guard.hp; bb.ammo = guard.ammo;
      bb.noise = !!noisePos;
    }
    // FSM 틱: 현재 상태에서 나가는 전이를 순서대로 검사
    function tickFSM() {
      let n = 0;
      for (const t of trans) {
        if (t.from !== cur) continue;
        let ok = true;
        for (const q of t.terms) { n++; const v = states[q.s].cond(bb); if (q.neg ? v : !v) { ok = false; break; } }
        if (ok) { lastTr = t; lastTrT = 0.8; cur = t.to; break; }
      }
      return n;
    }
    // BT 틱: 선택 노드가 왼쪽부터 순서 노드(조건 → 행동)를 실행
    function tickBT() {
      let n = 0;
      btEval = [];
      for (let i = 0; i < states.length; i++) {
        const st = states[i];
        if (st.id === 'patrol') { btEval[i] = 'run'; cur = i; break; }
        n++;
        if (st.cond(bb)) { btEval[i] = 'run'; cur = i; break; }
        btEval[i] = 'fail';
      }
      return n;
    }
    const moveTo = (t, sp, dt) => { const d = V.sub(t, guard.p), l = V.len(d); if (l < 3) return true; guard.p = V.add(guard.p, V.scale(d, Math.min(l, sp * dt) / l)); return false; };

    function step(dt) {
      simT += dt;
      // 적: 리사주 곡선 경로 (경비병과 무관)
      enemy = V(150 + 125 * Math.sin(simT * 0.23), 150 + 125 * Math.sin(simT * 0.37 + 1));
      nextNoise -= dt;
      if (nextNoise <= 0) { noisePos = V(noiseRng.range(30, 270), noiseRng.range(30, 270)); nextNoise = noiseRng.range(7, 12); }
      sense();
      const n = P.arch === 'fsm' ? tickFSM() : tickBT();
      evalNow = n; evalSum += n; ticks++;
      const act = states[cur].id;
      timeIn[act] = (timeIn[act] || 0) + dt;
      if (act !== 'reload') reloadT = 0;
      // 행동 실행
      if (act === 'patrol') { if (moveTo(WPS[guard.wp], 45, dt)) guard.wp = (guard.wp + 1) % 4; }
      else if (act === 'chase') moveTo(enemy, 60, dt);
      else if (act === 'attack') { shotT -= dt; if (shotT <= 0 && guard.ammo > 0) { guard.ammo--; shotT = 0.45; flash = 0.12; } }
      else if (act === 'reload') { reloadT += dt; if (reloadT > 1.5) { guard.ammo = 6; reloadT = 0; } }
      else if (act === 'investigate') { if (moveTo(noisePos, 55, dt)) noisePos = null; }
      else if (act === 'heal') guard.hp = Math.min(1, guard.hp + 0.12 * dt);
      else if (act === 'flee') { const away = V.norm(V.sub(guard.p, enemy)); guard.p = V.add(guard.p, V.scale(away, 70 * dt)); }
      guard.p.x = U.clamp(guard.p.x, 10, AW - 10); guard.p.y = U.clamp(guard.p.y, 10, AW - 10);
      // 적의 공격
      if (V.dist(guard.p, enemy) < 85) guard.hp -= 0.07 * dt;
      guard.hp = Math.min(1, guard.hp + 0.004 * dt);
      if (guard.hp <= 0) { downs++; guard.hp = 1; guard.ammo = 6; guard.p = V(50, 50); }
      lastTrT = Math.max(0, lastTrT - dt); flash = Math.max(0, flash - dt);
    }

    function drawArena(g, x0, y0, size) {
      const s = size / AW, X = (p) => ({ x: x0 + p.x * s, y: y0 + p.y * s });
      D.rect(g, x0, y0, size, size, '#181b21', 'rgba(255,255,255,0.15)');
      D.poly(g, WPS.map(X), null, 'rgba(255,255,255,0.12)', 1, true);
      const gp = X(guard.p), ep = X(enemy);
      D.circle(g, gp.x, gp.y, 120 * s, null, 'rgba(255,220,120,0.18)', 1);
      if (noisePos) { const np = X(noisePos); D.circle(g, np.x, np.y, 6 + 4 * Math.sin(simT * 8), null, C.warn, 1.5); D.text(g, GTL.L('소리', 'Noise'), np.x, np.y + 9, { align: 'center', size: 9, color: C.warn }); }
      if (flash > 0) D.line(g, gp.x, gp.y, ep.x, ep.y, '#fff', 2);
      D.circle(g, ep.x, ep.y, 7, C.bad, '#000', 1.5);
      D.circle(g, gp.x, gp.y, 8, ctx.side === 'a' ? C.a : C.b, '#000', 1.5);
      D.text(g, GTL.L(states[cur].name, states[cur].en), gp.x, gp.y - 22, { align: 'center', size: 11, color: '#fff' });
      D.rect(g, gp.x - 12, gp.y + 11, 24, 3, 'rgba(0,0,0,0.6)'); D.rect(g, gp.x - 12, gp.y + 11, 24 * guard.hp, 3, C.good);
      for (let i = 0; i < 6; i++) D.rect(g, gp.x - 12 + i * 4, gp.y + 16, 3, 3, i < guard.ammo ? C.warn : 'rgba(255,255,255,0.15)');
    }

    function drawFSM(g, x0, y0, w, h) {
      const cx = x0 + w / 2, cy = y0 + h / 2, R = Math.min(w, h) * 0.36, n = states.length;
      const pos = states.map((_, i) => { const a = -Math.PI / 2 + (i / n) * U.TAU; return V(cx + Math.cos(a) * R, cy + Math.sin(a) * R); });
      for (const t of trans) {
        const a = pos[t.from], b = pos[t.to], d = V.norm(V.sub(b, a)), off = V.scale(V.perp(d), 4);
        const p1 = V.add(V.add(a, V.scale(d, 22)), off), p2 = V.add(V.sub(b, V.scale(d, 24)), off);
        const hot = lastTr === t && lastTrT > 0;
        const out = t.from === cur;
        D.arrow(g, p1.x, p1.y, p2.x, p2.y, hot ? C.warn : out ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.13)', hot ? 2.5 : 1, 5);
      }
      states.forEach((st, i) => {
        const p = pos[i];
        D.circle(g, p.x, p.y, 20, i === cur ? C.a : '#262a33', i === cur ? '#fff' : 'rgba(255,255,255,0.4)', 1.5);
        D.text(g, GTL.L(st.name, st.en), p.x, p.y, { align: 'center', baseline: 'middle', size: 10, color: i === cur ? '#000' : '#fff' });
      });
      D.text(g, GTL.L('밝은 화살표: 현재 상태에서 검사하는 전이', 'Bright arrows: transitions checked from the current state'), x0 + 4, y0 + h - 14, { size: 10, color: C.dim });
    }

    function drawBT(g, x0, y0, w, h) {
      const n = states.length, colW = w / n;
      const root = V(x0 + w / 2, y0 + 30);
      const box = (x, y, bw, txt, state) => {
        const col = state === 'run' ? C.good : state === 'fail' ? C.bad : 'rgba(255,255,255,0.35)';
        D.rect(g, x - bw / 2, y - 10, bw, 20, state === 'run' ? 'rgba(70,200,120,0.25)' : '#262a33', col, state ? 1.5 : 1);
        D.text(g, txt, x, y, { align: 'center', baseline: 'middle', size: 10, color: '#fff' });
      };
      states.forEach((st, i) => {
        const cx = x0 + colW * (i + 0.5), ev = btEval[i];
        D.line(g, root.x, root.y + 10, cx, y0 + 80, ev ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)', 1);
        const bw = Math.min(colW - 4, 64);
        if (st.id === 'patrol') { box(cx, y0 + 90, bw, GTL.L(st.name, st.en), ev); return; }
        box(cx, y0 + 90, Math.min(bw, 26), '→', ev);
        D.line(g, cx, y0 + 100, cx - colW * 0.18, y0 + 135, 'rgba(255,255,255,0.3)', 1);
        D.line(g, cx, y0 + 100, cx + colW * 0.18, y0 + 160, 'rgba(255,255,255,0.3)', 1);
        box(cx - colW * 0.18, y0 + 145, bw * 0.8, GTL.L(st.label, st.labelEn), ev === 'fail' ? 'fail' : ev === 'run' ? 'run' : null);
        box(cx + colW * 0.18, y0 + 170, bw * 0.8, GTL.L(st.name, st.en), ev === 'run' ? 'run' : null);
      });
      box(root.x, root.y, 30, '?', 'run');
      D.text(g, GTL.L('선택(?)은 왼쪽부터 검사. 빨강: 실패한 조건, 초록: 실행 중', 'Selector (?) checks from the left. Red: failed condition, green: running'), x0 + 4, y0 + h - 14, { size: 10, color: C.dim });
    }

    return {
      update(dt) {
        let t = dt * P.simSpeed;
        while (t > 1e-6) { const hh = Math.min(t, 1 / 30); step(hh); t -= hh; }
      },
      onAction() { init(); },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const size = Math.max(80, Math.min(H - 16, W * 0.4));
        drawArena(g, 8, 8, size);
        const dx = size + 16, dw = W - dx - 8;
        if (P.arch === 'fsm') drawFSM(g, dx, 8, dw, H - 16); else drawBT(g, dx, 8, dw, H - 16);
        const n = states.length;
        if (P.arch === 'fsm') {
          const terms = trans.reduce((a, t) => a + t.terms.length, 0);
          ctx.stat(GTL.L('상태 수', 'States'), n);
          ctx.stat(GTL.L('전이 수', 'Transitions'), trans.length);
          ctx.stat(GTL.L('가드 조건 항 합계', 'Total guard terms'), terms);
          ctx.stat(GTL.L('새 행동 1개 추가 시', 'Adding 1 new behavior'), delta ? GTL.L(`전이 +${delta.added}, 가드 수정 ${delta.changed}개, 기존 상태 ${delta.touched}곳 수정`, `transitions +${delta.added}, guards changed ${delta.changed}, existing states edited ${delta.touched}`) : '-');
        } else {
          ctx.stat(GTL.L('노드 수', 'Nodes'), 1 + (n - 1) * 3 + 1);
          ctx.stat(GTL.L('연결 수 (부모-자식)', 'Links (parent-child)'), (n - 1) * 3 + 1);
          ctx.stat(GTL.L('조건 노드 수', 'Condition nodes'), n - 1);
          ctx.stat(GTL.L('새 행동 1개 추가 시', 'Adding 1 new behavior'), P.reqs < 6 ? GTL.L('노드 +3, 기존 노드 수정 0곳', 'nodes +3, existing nodes edited 0') : '-');
        }
        ctx.stat(GTL.L('조건 검사 / 틱 (평균)', 'Condition checks / tick (avg)'), ticks ? (evalSum / ticks).toFixed(2) : '-');
        ctx.stat(GTL.L('현재 행동', 'Current behavior'), GTL.L(states[cur].name, states[cur].en));
        ctx.stat(GTL.L('쓰러진 횟수', 'Times downed'), downs);
      },
    };
  },
});
