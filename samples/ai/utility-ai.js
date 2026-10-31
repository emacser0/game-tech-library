// 의사결정: 우선순위 FSM vs Utility AI
GTL.register({
  id: 'utility-ai',
  title: '의사결정: 우선순위 FSM vs Utility AI',
  summary: '같은 주민과 같은 늑대 경로에서 두 가지 두뇌를 비교. 고정 우선순위 규칙은 "늑대가 보이면 무조건 도망"처럼 상황의 정도를 무시해 굶거나 일을 못 함. Utility AI는 행동마다 점수를 응답 곡선으로 계산해 여러 욕구를 저울질함.',
  views: { a: '우선순위 FSM', b: 'Utility AI' },
  info: `
    <p><b>우선순위 FSM</b>(유한 상태 기계): 규칙을 위에서부터 차례로 검사함.</p>
    <ul>
      <li>늑대가 150px 안이면 도망</li>
      <li>아니고 배고픔 &gt; 0.7이면 먹기</li>
      <li>아니고 피로 &gt; 0.8이면 자기</li>
      <li>그 밖에는 일하기</li>
    </ul>
    <p>읽기 쉽고 디버깅도 쉬움. 단점은 두 가지.</p>
    <ul>
      <li>조건이 <b>참/거짓</b>뿐임. "아주 배고픈데 늑대가 멀리 있음" 같은 정도의 차이를 표현하지 못함.</li>
      <li>규칙 순서가 곧 우선순위임. 서로 부딪히는 욕구를 저울질할 수 없음.</li>
    </ul>
    <p><b>Utility AI</b>: 행동마다 입력(배고픔, 피로, 위협)을 <b>응답 곡선</b>(이차, 로지스틱 등)으로 0..1 점수로 바꿈. 점수가 가장 높은 행동을 고름.
    지금 하는 행동에는 <b>관성 보너스</b>를 줌. 점수가 비슷할 때 행동이 깜빡이듯 바뀌는 현상(dithering)을 막기 위함.
    Dave Mark의 Infinite Axis Utility System, The Sims의 욕구 시스템, Guild Wars 2 등에서 쓰였음.</p>
    <p>오른쪽 위 패널: A는 규칙별 조건(입력값과 임계값), B는 행동별 점수 막대. 늑대 경로는 두 뷰가 같음.</p>`,
  diagram: (L) => {
    const y = (v) => (140 - 110 * v).toFixed(1);
    const xd = (d) => (40 + d / 300 * 210).toFixed(1), xh = (h) => (300 + h * 210).toFixed(1);
    const flee = Array.from({ length: 31 }, (_, i) => `${xd(i * 10)},${y(Math.pow(Math.max(0, 1 - i * 10 / 250), 2))}`).join(' L');
    const eat = Array.from({ length: 21 }, (_, i) => `${xh(i / 20)},${y(Math.min(1, 1.1 * (i / 20) ** 2))}`).join(' L');
    return `<svg viewBox="0 0 540 204" xmlns="http://www.w3.org/2000/svg">
    <text x="40" y="16">${L('도망 점수', 'Flee score')}</text>
    <text x="300" y="16">${L('먹기 점수', 'Eat score')}</text>
    <path d="M40,24 L40,140 L250,140" class="d-dim"/>
    <path d="M300,24 L300,140 L510,140" class="d-dim"/>
    <text x="34" y="33" text-anchor="end" class="t-small t-dim">1</text><text x="34" y="143" text-anchor="end" class="t-small t-dim">0</text>
    <text x="294" y="33" text-anchor="end" class="t-small t-dim">1</text><text x="294" y="143" text-anchor="end" class="t-small t-dim">0</text>
    <path d="M40,30 L145,30 L145,140 L250,140" class="d-a"/>
    <path d="M${flee}" class="d-b"/>
    <path d="M300,140 L447,140 L447,30 L510,30" class="d-a"/>
    <path d="M${eat}" class="d-b"/>
    <text x="152" y="46" class="t-small t-a">${L('A: 150px 안이면 1', 'A: 1 inside 150px, else 0')}</text>
    <text x="152" y="60" class="t-small t-b">B: (1 - d/250)^2</text>
    <text x="306" y="46" class="t-small t-a">${L('A: 0.7 넘으면 1', 'A: 1 above 0.7')}</text>
    <text x="306" y="60" class="t-small t-b">${L('B: 1.1 × 배고픔^2', 'B: 1.1 × hunger^2')}</text>
    <text x="40" y="152" text-anchor="middle" class="t-small t-dim">0</text>
    <text x="145" y="152" text-anchor="middle" class="t-small t-dim">150</text>
    <text x="250" y="152" text-anchor="middle" class="t-small t-dim">300</text>
    <text x="145" y="164" text-anchor="middle" class="t-small t-dim">${L('늑대 거리 (px)', 'wolf distance (px)')}</text>
    <text x="300" y="152" text-anchor="middle" class="t-small t-dim">0</text>
    <text x="447" y="152" text-anchor="middle" class="t-small t-dim">0.7</text>
    <text x="510" y="152" text-anchor="middle" class="t-small t-dim">1</text>
    <text x="405" y="164" text-anchor="middle" class="t-small t-dim">${L('배고픔', 'hunger')}</text>
    <text x="10" y="184" class="t-small t-a">${L('A: 규칙 순서가 곧 우선순위. 위 규칙이 참이면 아래 규칙은 보지 않음', 'A: rule order is the priority. When a rule is true, the rules below are skipped.')}</text>
    <text x="10" y="199" class="t-small t-b">${L('B: 행동마다 곡선 점수를 곱해 최댓값 선택. 현재 행동에 관성 보너스', 'B: multiply curve scores per action, pick the highest, add inertia to the current one.')}</text>
  </svg>`;
  },
  look: [
    '늑대가 작업대나 식탁 근처를 지나면 A의 주민은 거리가 꽤 멀어도 모두 일을 버리고 도망감. "총 작업량"이 A 쪽이 적음.',
    '배고픔이 1에 가까울 때 늑대가 식탁 근처를 맴돌면 A는 도망만 치다 굶음("위기 시간" 증가). B는 위협이 크지 않으면 먹으러 감.',
    'B의 "관성 보너스"를 0으로 하면 점수가 비슷한 순간 행동이 빠르게 바뀜("결정 변경 / 분" 증가).',
    'A의 "도망 거리"를 줄이면 작업량은 늘지만 "늑대에게 물린 시간"도 늘어남. 임계값 조정만으로는 한계가 있음.',
  ],
  refs: [
    { type: 'book', title: 'Behavioral Mathematics for Game AI', year: 2009, note: 'Dave Mark. 응답 곡선 기반 효용 이론의 게임 적용.' },
    { type: 'talk', title: 'Improving AI Decision Modeling Through Utility Theory', year: 2010, note: 'Dave Mark & Kevin Dill, GDC 2010 AI Summit.' },
    { type: 'talk', title: 'Building a Better Centaur: AI at Massive Scale', year: 2015, note: 'Dave Mark & Mike Lewis, GDC 2015. Infinite Axis Utility System (Guild Wars 2).' },
    { type: 'book', title: 'An Introduction to Utility Theory', year: 2013, note: 'David "Rez" Graham, Game AI Pro (CRC Press) 9장.' },
    { type: 'book', title: 'Game Programming Patterns - State', url: 'https://gameprogrammingpatterns.com/state.html', year: 2014, note: 'Robert Nystrom. FSM 패턴.' },
  ],
  params: [
    { key: 'brain', label: '두뇌', type: 'select', group: '의사결정', options: [
      { value: 'fsm', label: '우선순위 FSM (임계값 규칙)' },
      { value: 'utility', label: 'Utility AI (응답 곡선)' },
    ], a: 'fsm', b: 'utility' },
    { key: 'fleeDist', label: '도망 거리 (FSM)', type: 'range', min: 40, max: 300, step: 5, default: 150, when: (p) => p.brain === 'fsm' },
    { key: 'inertia', label: '관성 보너스 (Utility)', type: 'range', min: 0, max: 0.4, step: 0.01, default: 0.12, when: (p) => p.brain === 'utility' },
    { key: 'threatCurve', label: '위협 곡선 지수 (Utility)', type: 'range', min: 0.5, max: 4, step: 0.1, default: 2, when: (p) => p.brain === 'utility', help: 'threat = (1 − 거리/250)^k' },
    { key: 'colonists', label: '주민 수', type: 'int', min: 1, max: 5, default: 3, shared: true, reset: true, group: '장면' },
    { key: 'simSpeed', label: '시뮬레이션 배속', type: 'range', min: 0.5, max: 6, step: 0.5, default: 2, shared: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Decision Making: Priority FSM vs Utility AI',
    summary: 'Compares two brains with the same colonists and the same wolf path. Fixed priority rules ignore degree, like "always flee when you see a wolf", so colonists starve or fail to work. Utility AI scores each action with response curves and weighs several needs.',
    views: { a: 'Priority FSM', b: 'Utility AI' },
    info: `
    <p><b>Priority FSM</b> (finite state machine): checks rules from top to bottom.</p>
    <ul>
      <li>If the wolf is within 150px, flee</li>
      <li>Else, if hunger &gt; 0.7, eat</li>
      <li>Else, if fatigue &gt; 0.8, sleep</li>
      <li>Otherwise, work</li>
    </ul>
    <p>It is easy to read and easy to debug. It has two weak points.</p>
    <ul>
      <li>Conditions are only <b>true or false</b>. It cannot express degree, like "very hungry, but the wolf is far away".</li>
      <li>Rule order is the priority. It cannot weigh needs that conflict.</li>
    </ul>
    <p><b>Utility AI</b>: for each action, it turns inputs (hunger, fatigue, threat) into a 0..1 score with a <b>response curve</b> (quadratic, logistic, and so on). It picks the action with the highest score.
    The current action gets an <b>inertia bonus</b>. This stops the action from flickering when scores are close (dithering).
    It is used in Dave Mark's Infinite Axis Utility System, the needs system of The Sims, Guild Wars 2, and more.</p>
    <p>Top right panel: A shows each rule's condition (input and threshold). B shows a score bar for each action. The wolf path is the same in both views.</p>`,
    look: [
      'When the wolf passes near the workbench or the table, A\'s colonists all drop work and flee, even when it is fairly far. "Total work" is lower in A.',
      'When hunger is near 1 and the wolf circles near the table, A keeps fleeing and starves ("Crisis time" goes up). B goes to eat if the threat is not large.',
      'Set B\'s "Inertia bonus" to 0. When scores are close, the action switches quickly ("Decision changes / min" goes up).',
      'Lower A\'s "Flee distance". Work goes up, but "Time bitten by wolf" also goes up. Tuning thresholds alone has limits.',
    ],
    refs: [
      'Dave Mark. Applies utility theory with response curves to games.',
      'Dave Mark & Kevin Dill, GDC 2010 AI Summit.',
      'Dave Mark & Mike Lewis, GDC 2015. Infinite Axis Utility System (Guild Wars 2).',
      'David "Rez" Graham, Game AI Pro (CRC Press), chapter 9.',
      'Robert Nystrom. The FSM pattern.',
    ],
    params: {
      brain: { label: 'Brain', group: 'Decision making', options: { fsm: 'Priority FSM (threshold rules)', utility: 'Utility AI (response curves)' } },
      fleeDist: 'Flee distance (FSM)',
      inertia: 'Inertia bonus (Utility)',
      threatCurve: { label: 'Threat curve exponent (Utility)', help: 'threat = (1 − distance/250)^k' },
      colonists: { label: 'Colonists', group: 'Scene' },
      simSpeed: 'Simulation speed',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, V = U.v2, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 760, WH = 460;
    const ST = { eat: V(120, 90), sleep: V(110, 380), work: V(560, 250) };
    const ACTS = ['eat', 'sleep', 'work', 'flee'];
    const NAMES = { eat: GTL.L('먹기', 'Eat'), sleep: GTL.L('자기', 'Sleep'), work: GTL.L('일하기', 'Work'), flee: GTL.L('도망', 'Flee'), idle: GTL.L('대기', 'Idle') };
    const ICON = { eat: '🍞', sleep: '🛏', work: '⚒' };
    let col, wolf, wolfWp, wolfRng, totalWork, crisis, switches, bites, simT;

    function init() {
      const rng = U.rng(ctx.seed * 13 + 4);
      col = [];
      for (let i = 0; i < P.colonists; i++) {
        col.push({ p: V(rng.range(300, 600), rng.range(100, 380)), hunger: rng.range(0.2, 0.6), fatigue: rng.range(0.1, 0.5), hp: 1,
          act: 'work', rule: '', scores: {}, inputs: {}, workDone: 0 });
      }
      wolfRng = U.rng(ctx.seed * 29 + 8);
      wolf = V(-40, 230); wolfWp = V(300, 200);
      totalWork = 0; crisis = 0; switches = 0; bites = 0; simT = 0;
    }
    init();
    // 늑대: 시드 고정 경유점 (주민과 무관, A/B 동일)
    const wolfPoints = [() => V(ST.work.x + wolfRng.range(-120, 60), ST.work.y + wolfRng.range(-90, 90)),
      () => V(ST.eat.x + wolfRng.range(40, 160), ST.eat.y + wolfRng.range(0, 120)),
      () => V(wolfRng.range(250, 500), wolfRng.range(60, 400)),
      () => V(WW + 80, wolfRng.range(60, 400))];

    function decideFSM(c, threatD) {
      const keep = (a) => c.act === a;
      if (threatD < P.fleeDist || (keep('flee') && threatD < P.fleeDist * 1.3)) { c.rule = GTL.L(`늑대 ${threatD.toFixed(0)} < ${P.fleeDist}`, `Wolf ${threatD.toFixed(0)} < ${P.fleeDist}`); return 'flee'; }
      if (keep('eat') && c.hunger > 0.1) { c.rule = GTL.L('먹는 중 (배고픔 > 0.1)', 'Eating (hunger > 0.1)'); return 'eat'; }
      if (keep('sleep') && c.fatigue > 0.1) { c.rule = GTL.L('자는 중 (피로 > 0.1)', 'Sleeping (fatigue > 0.1)'); return 'sleep'; }
      if (c.hunger > 0.7) { c.rule = GTL.L('배고픔 > 0.7', 'Hunger > 0.7'); return 'eat'; }
      if (c.fatigue > 0.8) { c.rule = GTL.L('피로 > 0.8', 'Fatigue > 0.8'); return 'sleep'; }
      c.rule = GTL.L('기본', 'Default'); return 'work';
    }
    const logistic = (x, k, m) => 1 / (1 + Math.exp(-k * (x - m)));
    function decideUtility(c, threatD) {
      const threat = Math.pow(U.clamp(1 - threatD / 250, 0, 1), P.threatCurve);
      const travel = (a) => 1 - 0.15 * U.clamp(V.dist(c.p, ST[a]) / 600, 0, 1); // 멀수록 약간 감점
      const s = {
        eat: Math.pow(c.hunger, 2) * 1.1 * travel('eat') * (1 - threat * 0.6),
        sleep: logistic(c.fatigue, 10, 0.75) * travel('sleep') * (1 - threat * 0.8),
        work: 0.35 * (1 - c.fatigue * 0.6) * (1 - threat),
        flee: threat * (1 - Math.pow(c.hunger, 4) * 0.5),
      };
      // 진행 중인 행동 유지 보너스 (먹기/자기는 충분히 회복할 때까지)
      if (s[c.act] !== undefined) s[c.act] += P.inertia;
      if (c.act === 'eat' && c.hunger > 0.15) s.eat += 0.2;
      if (c.act === 'sleep' && c.fatigue > 0.15) s.sleep += 0.2;
      c.scores = s;
      let best = 'work', bv = -1;
      for (const a of ACTS) if (s[a] > bv) { bv = s[a]; best = a; }
      return best;
    }

    function step(dt) {
      simT += dt;
      // 늑대 이동
      const wd = V.sub(wolfWp, wolf), wl = V.len(wd);
      if (wl < 5) {
        if (wolf.x > WW + 40) { wolf = V(-60, wolfRng.range(60, 400)); }
        wolfWp = wolfRng.pick(wolfPoints)();
      } else wolf = V.add(wolf, V.scale(wd, Math.min(wl, 55 * dt) / wl));

      for (const c of col) {
        const threatD = V.dist(c.p, wolf);
        c.inputs = { hunger: c.hunger, fatigue: c.fatigue, threatD };
        const next = P.brain === 'fsm' ? decideFSM(c, threatD) : decideUtility(c, threatD);
        if (next !== c.act) { switches++; c.act = next; }
        // 실행
        let target = null, sp = 90;
        if (c.act === 'flee') {
          const away = V.norm(V.sub(c.p, wolf));
          target = V.add(c.p, V.scale(away, 60)); sp = 110;
        } else target = ST[c.act];
        const d = V.dist(c.p, target);
        if (d > 10) c.p = V.add(c.p, V.scale(V.sub(target, c.p), Math.min(d, sp * dt) / d));
        c.p.x = U.clamp(c.p.x, 15, WW - 15); c.p.y = U.clamp(c.p.y, 15, WH - 15);
        const at = d <= 12;
        c.hunger += 0.03 * dt; c.fatigue += 0.015 * dt;
        if (at && c.act === 'eat') c.hunger -= 0.25 * dt;
        if (at && c.act === 'sleep') { c.fatigue -= 0.12 * dt; c.hp += 0.02 * dt; }
        if (at && c.act === 'work') { c.workDone += dt; totalWork += dt; c.fatigue += 0.02 * dt; }
        c.hunger = U.clamp(c.hunger, 0, 1); c.fatigue = U.clamp(c.fatigue, 0, 1);
        if (c.hunger >= 0.99 || c.fatigue >= 0.99) { crisis += dt; c.hp -= 0.02 * dt; }
        if (threatD < 28) { c.hp -= 0.25 * dt; bites += dt; }
        c.hp = U.clamp(c.hp, 0, 1);
      }
    }

    const view = () => { const s = Math.min(ctx.width / WW, ctx.height / WH); return { s, ox: (ctx.width - WW * s) / 2, oy: (ctx.height - WH * s) / 2 }; };
    return {
      update(dt) {
        let t = dt * P.simSpeed;
        while (t > 0) { const h = Math.min(t, 1 / 60); step(h); t -= h; }
      },
      onAction() { init(); },
      render() {
        const g = ctx.g, vw = view(), s = vw.s;
        const X = (p) => ({ x: vw.ox + p.x * s, y: vw.oy + p.y * s });
        D.rect(g, vw.ox, vw.oy, WW * s, WH * s, '#181b21', 'rgba(255,255,255,0.1)');
        for (const k of Object.keys(ST)) {
          const p = X(ST[k]);
          D.circle(g, p.x, p.y, 22 * s, 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.3)', 1);
          D.text(g, ICON[k], p.x, p.y, { align: 'center', baseline: 'middle', size: Math.round(20 * s) });
          D.text(g, NAMES[k === 'eat' ? 'eat' : k], p.x, p.y + 26 * s, { align: 'center', size: 10, color: C.dim });
        }
        // 늑대 + 위협 반경
        const w = X(wolf);
        if (P.brain === 'fsm') D.circle(g, w.x, w.y, P.fleeDist * s, 'rgba(255,83,112,0.05)', 'rgba(255,83,112,0.4)', 1);
        else for (let r = 1; r <= 4; r++) D.circle(g, w.x, w.y, (250 * r / 4) * s, null, `rgba(255,83,112,${0.45 - r * 0.09})`, 1);
        D.circle(g, w.x, w.y, 13 * s, C.bad, '#000', 1.5);
        D.text(g, '🐺', w.x, w.y, { align: 'center', baseline: 'middle', size: Math.round(16 * s) });
        // 주민
        const colC = ctx.side === 'a' ? C.a : C.b;
        col.forEach((c, i) => {
          const p = X(c.p);
          D.circle(g, p.x, p.y, 11 * s, c.hp > 0.3 ? colC : C.bad, '#000', 1.5);
          D.text(g, String(i + 1), p.x, p.y, { align: 'center', baseline: 'middle', size: 11, color: '#000' });
          D.text(g, NAMES[c.act], p.x, p.y - 24 * s, { align: 'center', size: 11, color: c.act === 'flee' ? C.bad : '#fff' });
          D.rect(g, p.x - 14, p.y + 14 * s, 28, 3, 'rgba(0,0,0,0.6)'); D.rect(g, p.x - 14, p.y + 14 * s, 28 * c.hp, 3, C.good);
        });
        // 디버그 패널
        const pw = 210, rowH = P.brain === 'fsm' ? 58 : 66, px = ctx.width - pw - 8, py = 8;
        D.rect(g, px, py, pw, rowH * col.length + 8, 'rgba(10,12,16,0.82)', 'rgba(255,255,255,0.15)');
        col.forEach((c, i) => {
          const y0 = py + 6 + i * rowH;
          D.text(g, GTL.L(`주민 ${i + 1}: ${NAMES[c.act]}`, `Colonist ${i + 1}: ${NAMES[c.act]}`), px + 8, y0, { size: 11, color: '#fff' });
          if (P.brain === 'fsm') {
            const items = [[GTL.L('배고픔', 'Hunger'), c.hunger, 0.7], [GTL.L('피로', 'Fatigue'), c.fatigue, 0.8], [GTL.L('위협', 'Threat'), U.clamp(1 - c.inputs.threatD / 300, 0, 1), 1 - P.fleeDist / 300]];
            items.forEach(([name, v, th], k) => {
              const y = y0 + 15 + k * 12;
              D.text(g, name, px + 8, y - 1, { size: 9, color: C.dim });
              D.rect(g, px + 50, y, 110, 7, 'rgba(255,255,255,0.08)');
              D.rect(g, px + 50, y, 110 * v, 7, v > th ? C.warn : 'rgba(255,255,255,0.45)');
              D.line(g, px + 50 + 110 * th, y - 2, px + 50 + 110 * th, y + 9, C.bad, 1.5);
            });
            D.text(g, '→ ' + c.rule, px + 166, y0 + 1, { size: 9, color: C.warn, align: 'right' });
          } else {
            let best = c.act;
            ACTS.forEach((a, k) => {
              const v = c.scores[a] || 0, y = y0 + 15 + k * 12;
              D.text(g, NAMES[a], px + 8, y - 1, { size: 9, color: C.dim });
              D.rect(g, px + 50, y, 120, 7, 'rgba(255,255,255,0.08)');
              D.rect(g, px + 50, y, 120 * U.clamp(v, 0, 1.3) / 1.3, 7, a === best ? C.b : 'rgba(255,255,255,0.45)');
              D.text(g, v.toFixed(2), px + 176, y - 1, { size: 9, color: a === best ? C.b : C.dim });
            });
          }
        });
        ctx.stat(GTL.L('총 작업량', 'Total work'), totalWork.toFixed(1));
        ctx.stat(GTL.L('위기 시간 (배고픔/피로 한계)', 'Crisis time (hunger/fatigue max)'), crisis.toFixed(1) + ' s');
        ctx.stat(GTL.L('늑대에게 물린 시간', 'Time bitten by wolf'), bites.toFixed(1) + ' s');
        ctx.stat(GTL.L('결정 변경 / 분', 'Decision changes / min'), simT > 1 ? (switches / (simT / 60)).toFixed(1) : '-');
        ctx.stat(GTL.L('평균 체력', 'Avg health'), (col.reduce((a, c) => a + c.hp, 0) / Math.max(1, col.length) * 100).toFixed(0) + ' %');
      },
    };
  },
});
