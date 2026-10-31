// 계층형 상태 기계 + 푸시다운 오토마타 vs 평면 FSM (캐릭터 상태와 일시정지 메뉴)
GTL.register({
  id: 'hfsm-pushdown',
  title: '계층형 상태 기계 & 상태 스택 vs 평면 FSM',
  summary: '평면 FSM은 공통 전이(점프, 공격, 메뉴 열기)를 상태마다 따로 적어야 해서 전이 수가 빠르게 늘어남. 메뉴를 닫으면 이전 상태를 몰라서 대기 상태로 돌아가고 버그가 생김. 계층형 상태 기계는 공통 전이를 상위 상태에 한 번만 두고, 상태 스택은 메뉴를 닫을 때 원래 상태로 정확히 돌아감.',
  views: { a: '평면 FSM', b: '계층형 + 상태 스택' },
  controls: '←→ 이동, Shift 달리기, Space 점프, X 공격, M 일시정지 메뉴, I 인벤토리. 자동 데모가 같은 입력을 반복함.',
  info: `
    <p><b>유한 상태 기계</b>(FSM)는 캐릭터가 한 번에 한 상태(대기, 걷기, 점프 등)에만 있고, 조건이 맞으면 다른 상태로 옮겨 가는 구조.</p>
    <p>평면 FSM의 문제:</p>
    <ul>
      <li>"점프 키를 누르면 점프"를 대기, 걷기, 달리기 상태에 각각 적어야 함. 상태가 늘면 전이 수가 상태 수의 제곱에 가깝게 늘어남.</li>
      <li>메뉴를 열면 이전 상태를 기억하지 못함. 닫을 때 보통 대기 상태로 돌려보냄.</li>
      <li>공중에서 메뉴를 닫으면 "지상 상태인 대기"가 되어 공중 점프 같은 버그가 생김. 공격 중이었다면 공격이 취소됨.</li>
    </ul>
    <p>해결 방법:</p>
    <ul>
      <li><b>계층형 상태 기계</b>(HFSM): 대기, 걷기, 달리기를 "지상" 상위 상태로 묶음. 하위 상태가 처리하지 않은 입력은 상위 상태가 처리함. 점프, 공격, 낙하 전이를 "지상"에 한 번만 적음.</li>
      <li><b>푸시다운 오토마타</b>(상태 스택): 메뉴를 열 때 현재 상태를 스택에 넣고(push), 닫을 때 꺼냄(pop). 점프 중이었으면 점프로, 공격 중이었으면 남은 공격 시간 그대로 돌아감.</li>
    </ul>
    <p>단점: 계층이 깊어지면 어느 단계가 입력을 처리했는지 추적하기 어려움. 스택에 쌓인 상태가 오래 머물면 그동안 바뀐 게임 상태(예: 맞아서 죽음)와 어긋날 수 있어서 복귀할 때 검사가 필요함.</p>`,
  // 도식: 평면 FSM은 같은 전이를 상태마다 적음 vs 상위 상태에 한 번. 상태 스택은 메뉴를 닫으면 원래 상태로 pop
  diagram: (L) => {
    const box = (x, y, w, t, cls = 'f-dim') => `<rect x="${x}" y="${y}" width="${w}" height="22" rx="4" class="${cls}"/><text x="${x + w / 2}" y="${y + 15}" text-anchor="middle" class="t-small">${t}</text>`;
    const ground = [L('대기', 'Idle'), L('걷기', 'Walk'), L('달리기', 'Run')];
    return `<svg viewBox="0 0 540 214" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="arrA" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    </defs>
    <text x="10" y="18" class="t-a">${L('A: 평면 FSM', 'A: flat FSM')}</text>
    ${ground.map((t, i) => box(20, 34 + i * 34, 70, t)).join('')}
    ${box(170, 68, 70, L('점프', 'Jump'))}
    ${[0, 1, 2].map((i) => `<path d="M90,${45 + i * 34} L168,79" class="d-a" marker-end="url(#arrA)"/>`).join('')}
    <text x="130" y="134" text-anchor="middle" class="t-small t-a">${L('같은 전이를 3번 적음', 'Same transition written 3 times')}</text>
    ${box(170, 150, 70, L('메뉴', 'Menu'))}
    <path d="M170,165 C60,192 0,120 18,46" class="d-a" stroke-dasharray="4 3" marker-end="url(#arrA)"/>
    <text x="10" y="196" class="t-small t-a">${L('닫으면 항상 대기로 감', 'Closing always goes to Idle')}</text>
    <line x1="268" y1="10" x2="268" y2="204" class="d-dim"/>
    <text x="284" y="18" class="t-b">${L('B: 계층형 + 상태 스택', 'B: hierarchical + stack')}</text>
    <rect x="284" y="28" width="100" height="116" rx="6" class="d-b"/>
    <text x="292" y="42" class="t-small t-b">${L('지상', 'Grounded')}</text>
    ${ground.map((t, i) => box(298, 48 + i * 30, 72, t)).join('')}
    ${box(444, 68, 70, L('점프', 'Jump'))}
    <path d="M384,79 L442,79" class="d-b" marker-end="url(#arrB)"/>
    <text x="413" y="72" text-anchor="middle" class="t-small t-mono">Space</text>
    <text x="479" y="104" text-anchor="middle" class="t-small t-b">${L('상위 상태에 한 번', 'Once on the parent')}</text>
    <text x="284" y="166" class="t-small">${L('상태 스택', 'State stack')}</text>
    <path d="M354,154 L354,200 L436,200 L436,154" class="d-dim"/>
    ${box(358, 176, 74, L('점프 0.3초', 'Jump 0.3s'), 'f-dim')}
    ${box(358, 152, 74, L('메뉴', 'Menu'), 'f-dim')}
    <text x="446" y="164" class="t-small t-mono">push / pop</text>
    <text x="446" y="190" class="t-small t-b">${L('닫으면 점프로 복귀', 'Pops back to Jump')}</text>
  </svg>`;
  },
  look: [
    '자동 데모에서 점프 중 메뉴를 열고 닫으면 A는 공중에서 대기 상태가 되고, 미리 누른 점프가 한 번 더 나감("공중 점프"가 늘어남). B는 낙하 상태로 돌아가서 정상 착지.',
    '공격 중 인벤토리를 열고 닫으면 A는 공격이 끊기고 대기로 감. B는 공격의 남은 시간부터 이어 감. 아래 상태 기록 띠에서 색 순서로 비교됨.',
    '위쪽 상태도에서 A의 전이 선이 34개로 얽혀 있음. B는 상위 상태 덕분에 17개.',
    'B의 방식을 "계층형 (스택 없음)"으로 바꾸면 전이 수는 줄지만 메뉴 복귀 버그는 A와 똑같이 생김. 두 기법은 서로 다른 문제를 해결함.',
  ],
  refs: [
    { type: 'book', title: 'Game Programming Patterns - State (Robert Nystrom)', url: 'https://gameprogrammingpatterns.com/state.html', year: 2014, note: '평면 FSM, 계층형 상태 기계, 푸시다운 오토마타를 차례로 설명.' },
    { type: 'paper', title: 'Statecharts: A visual formalism for complex systems (David Harel)', year: 1987, note: 'Science of Computer Programming 8(3). 계층 상태와 히스토리 상태의 원전.' },
    { type: 'engine', title: 'Unity Manual - Sub-State Machines', url: 'https://docs.unity3d.com/Manual/NestedStateMachines.html', note: 'Animator의 하위 상태 기계로 상태를 묶는 기능.' },
  ],
  params: [
    { key: 'mode', label: '상태 기계 구조', type: 'select', group: '구조', options: [
      { value: 'flat', label: '평면 FSM' },
      { value: 'hier', label: '계층형 (스택 없음)' },
      { value: 'stack', label: '계층형 + 상태 스택' },
    ], a: 'flat', b: 'stack', reset: true },
    { key: 'auto', label: '자동 데모', type: 'bool', default: true, shared: true, group: '장면' },
    { key: 'edges', label: '전이 선 표시', type: 'bool', default: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],

  en: {
    title: 'Hierarchical State Machine & State Stack vs Flat FSM',
    summary: 'A flat FSM must repeat shared transitions (jump, attack, open menu) in every state, so the transition count grows fast. When you close a menu, it does not know the previous state. It goes back to idle, which causes bugs. A hierarchical state machine puts shared transitions once on a parent state. A state stack returns to the exact previous state when you close the menu.',
    views: { a: 'Flat FSM', b: 'Hierarchical + state stack' },
    controls: '←→ to move, Shift to run, Space to jump, X to attack, M for pause menu, I for inventory. The auto demo repeats the same input.',
    info: `
    <p>A <b>finite state machine</b> (FSM) keeps a character in only one state at a time (idle, walk, jump, and so on). When a condition is met, it moves to another state.</p>
    <p>Problems with a flat FSM:</p>
    <ul>
      <li>You must write "jump when the jump key is pressed" separately in idle, walk, and run. As states grow, transitions grow close to the square of the state count.</li>
      <li>Opening a menu forgets the previous state. Closing it usually sends you back to idle.</li>
      <li>If you close the menu in the air, you become "idle", a ground state. This causes bugs like jumping in mid air. If you were attacking, the attack gets canceled.</li>
    </ul>
    <p>Solutions:</p>
    <ul>
      <li><b>Hierarchical state machine</b> (HFSM): group idle, walk, and run under a "Grounded" parent state. The parent handles any input the child does not handle. Write the jump, attack, and fall transitions only once, on "Grounded".</li>
      <li><b>Pushdown automata</b> (state stack): when you open a menu, push the current state onto a stack. When you close it, pop it. If you were jumping, you go back to jumping. If you were attacking, you go back with the same attack time left.</li>
    </ul>
    <p>Downside: with deep hierarchies, it is hard to trace which level handled an input. If a state stays on the stack for a long time, it can drift from game state that changed meanwhile (for example, you got hit and died). So you need a check when you resume.</p>`,
    look: [
      'In the auto demo, open and close the menu during a jump. A becomes idle in the air, and the buffered jump fires again ("Air jumps" goes up). B goes back to falling and lands normally.',
      'Open and close the inventory during an attack. A cuts the attack and goes to idle. B continues from the attack time left. Compare the color order in the state history strip below.',
      'In the state diagram at the top, A has 34 tangled transition lines. B has 17, thanks to parent states.',
      'Switch B\'s mode to "Hierarchical (no stack)". Transitions drop, but the menu return bug happens just like in A. The two techniques solve different problems.',
    ],
    refs: [
      'Explains flat FSMs, hierarchical state machines, and pushdown automata in order.',
      'Science of Computer Programming 8(3). The original source of hierarchical states and history states.',
      'An Animator feature that groups states into sub-state machines.',
    ],
    params: {
      mode: { label: 'State machine structure', group: 'Structure', options: { flat: 'Flat FSM', hier: 'Hierarchical (no stack)', stack: 'Hierarchical + state stack' } },
      auto: { label: 'Auto demo', group: 'Scene' },
      edges: 'Show transition lines',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const GRAV = 1700, JUMP_V = 640, WALK = 140, RUN = 290, AIR = 170, ATTACK_T = 0.6, JUMP_BUF = 0.15;
    const NAME = GTL.L({ Idle: '대기', Walk: '걷기', Run: '달리기', Jump: '점프', Fall: '낙하', Attack: '공격', Pause: '일시정지', Inventory: '인벤토리', Grounded: '지상', Airborne: '공중', Gameplay: '플레이', Menu: '메뉴' }, { Idle: 'Idle', Walk: 'Walk', Run: 'Run', Jump: 'Jump', Fall: 'Fall', Attack: 'Attack', Pause: 'Pause', Inventory: 'Inventory', Grounded: 'Grounded', Airborne: 'Airborne', Gameplay: 'Gameplay', Menu: 'Menu' });
    const SCOLOR = { Idle: '#7d8594', Walk: '#66d17a', Run: '#89ddff', Jump: '#ffcb6b', Fall: '#f78c6c', Attack: '#ff5370', Pause: '#c792ea', Inventory: '#ab47bc' };
    const GAMEPLAY = ['Idle', 'Walk', 'Run', 'Jump', 'Fall', 'Attack'];
    const MENU = ['Pause', 'Inventory'];
    const PARENT = { Idle: 'Grounded', Walk: 'Grounded', Run: 'Grounded', Jump: 'Airborne', Fall: 'Airborne', Grounded: 'Gameplay', Airborne: 'Gameplay', Attack: 'Gameplay', Pause: 'Menu', Inventory: 'Menu' };

    // 전이 표. 이 배열의 길이가 그대로 "전이 수"
    const mv = (i) => i.left || i.right;
    function buildTable(mode) {
      const T = [];
      const add = (from, to, when, extra) => T.push({ from, to, when, ...extra });
      const groundedCommon = (from) => {
        add(from, 'Jump', (i) => i.jump);
        add(from, 'Attack', (i) => i.attack);
        add(from, 'Fall', (i, b) => !b.onGround);
      };
      if (mode === 'flat') for (const s of ['Idle', 'Walk', 'Run']) groundedCommon(s);
      else groundedCommon('Grounded');
      add('Idle', 'Walk', (i) => mv(i) && !i.run); add('Idle', 'Run', (i) => mv(i) && i.run);
      add('Walk', 'Idle', (i) => !mv(i)); add('Walk', 'Run', (i) => mv(i) && i.run);
      add('Run', 'Idle', (i) => !mv(i)); add('Run', 'Walk', (i) => mv(i) && !i.run);
      add('Jump', 'Fall', (i, b) => b.vy <= 0);
      add('Fall', 'Idle', (i, b) => b.onGround);
      add('Attack', 'Idle', (i, b) => b.attackT <= 0);
      if (mode === 'flat') for (const s of GAMEPLAY) { add(s, 'Pause', (i) => i.menu); add(s, 'Inventory', (i) => i.inv); }
      else { add('Gameplay', 'Pause', (i) => i.menu, { push: mode === 'stack' }); add('Gameplay', 'Inventory', (i) => i.inv, { push: mode === 'stack' }); }
      if (mode === 'stack') {
        add('Pause', 'Inventory', (i) => i.inv, { push: true });
        add('Pause', '(이전)', (i) => i.menu, { pop: true });
        add('Inventory', '(이전)', (i) => i.inv, { pop: true });
      } else {
        add('Pause', 'Idle', (i) => i.menu); add('Inventory', 'Idle', (i) => i.inv);
        add('Pause', 'Inventory', (i) => i.inv); add('Inventory', 'Pause', (i) => i.menu);
      }
      return T;
    }

    // 자동 데모 입력 (주기 8.5초). [시작, 끝, 키] 끝이 없으면 한 번 누름
    const SCRIPT = [
      [0.3, 1.3, 'ArrowRight'], [1.4, 0, 'Space'], [1.72, 0, 'KeyM'], [2.5, 0, 'Space'], [2.56, 0, 'KeyM'],
      [3.3, 4.6, 'ArrowLeft'], [3.3, 4.6, 'ShiftLeft'], [4.1, 0, 'KeyX'], [4.3, 0, 'KeyI'], [5.1, 0, 'KeyI'],
      [6.0, 7.2, 'ArrowRight'],
    ];
    const PERIOD = 8.5;

    let table, leaf, stack, body, t, demoT, timeline, flashEdge, jumpBuf, mismatches, airJumps, savedLeaf, lastResume;
    function init() {
      table = buildTable(P.mode);
      leaf = 'Idle'; stack = [];
      body = { x: 0.3, y: 0, vx: 0, vy: 0, onGround: true, attackT: 0, face: 1 };
      t = 0; demoT = 0; timeline = []; flashEdge = new Map(); jumpBuf = 0;
      mismatches = 0; airJumps = 0; savedLeaf = null; lastResume = '-';
    }
    init();

    const chainOf = (s) => { const c = []; for (let n = s; n; n = PARENT[n]) c.push(n); return c; };
    const isMenu = (s) => MENU.includes(s);

    function enter(s, resumed) {
      if (resumed) return; // 스택에서 꺼낸 상태는 진입 동작을 다시 하지 않음
      if (s === 'Jump') {
        if (!body.onGround) airJumps++;
        body.vy = JUMP_V; body.onGround = false; jumpBuf = 0;
      }
      if (s === 'Attack') body.attackT = ATTACK_T;
    }

    function step(inp) {
      // 평면 FSM은 상위 상태가 없으므로 자기 자신만 검사
      const chain = P.mode === 'flat' ? [leaf] : chainOf(leaf);
      for (const node of chain) {
        for (let k = 0; k < table.length; k++) {
          const tr = table[k];
          if (tr.from !== node || !tr.when(inp, body)) continue;
          const prev = leaf;
          let resumed = false;
          if (tr.pop) { leaf = stack.pop() || 'Idle'; resumed = true; }
          else { if (tr.push) stack.push(leaf); leaf = tr.to; }
          flashEdge.set(k, 0.5);
          // 메뉴에 들어갈 때의 상태를 기억해 두고, 나올 때 같은 상태로 돌아왔는지 비교
          if (!isMenu(prev) && isMenu(leaf)) savedLeaf = prev;
          if (isMenu(prev) && !isMenu(leaf)) {
            lastResume = `${NAME[savedLeaf]} → ${NAME[leaf]}`;
            if (savedLeaf && savedLeaf !== leaf) mismatches++;
            savedLeaf = null;
          }
          enter(leaf, resumed);
          return;
        }
      }
    }

    function physics(dt, inp) {
      const b = body, W = Math.max(200, ctx.width);
      const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      if (dir) b.face = dir;
      if (leaf === 'Walk') b.vx = dir * WALK;
      else if (leaf === 'Run') b.vx = dir * RUN;
      else if (leaf === 'Jump' || leaf === 'Fall') b.vx = dir * AIR;
      else b.vx = U.approach(b.vx, 0, 1400 * dt);
      if (leaf === 'Attack') b.attackT -= dt;
      b.vy -= GRAV * dt;
      b.y += b.vy * dt;
      if (b.y <= 0) { b.y = 0; b.vy = Math.max(0, b.vy); b.onGround = true; } else b.onGround = false;
      b.x = U.wrap(b.x + (b.vx * dt) / W, 0, 1);
    }

    function readInput(dt) {
      const k = ctx.input;
      const inp = {
        left: k.key('ArrowLeft') || k.key('KeyA'), right: k.key('ArrowRight') || k.key('KeyD'),
        run: k.key('ShiftLeft') || k.key('ShiftRight'),
        jumpPressed: k.pressed('Space'), attack: k.pressed('KeyX'), menu: k.pressed('KeyM'), inv: k.pressed('KeyI'),
      };
      if (P.auto) {
        const a = demoT % PERIOD, a0 = (demoT - dt) % PERIOD;
        for (const [s, e, key] of SCRIPT) {
          const held = e ? a >= s && a < e : false;
          const hit = !e && a0 < s && a >= s;
          if (key === 'ArrowRight' && held) inp.right = true;
          if (key === 'ArrowLeft' && held) inp.left = true;
          if (key === 'ShiftLeft' && held) inp.run = true;
          if (hit && key === 'Space') inp.jumpPressed = true;
          if (hit && key === 'KeyX') inp.attack = true;
          if (hit && key === 'KeyM') inp.menu = true;
          if (hit && key === 'KeyI') inp.inv = true;
        }
      }
      // 점프 입력 버퍼: 조금 일찍 누른 점프도 잠시 기억함 (메뉴가 열려 있어도 기억함)
      if (inp.jumpPressed) jumpBuf = JUMP_BUF; else jumpBuf = Math.max(0, jumpBuf - dt);
      inp.jump = jumpBuf > 0;
      return inp;
    }

    // 상태도 배치 (상태도 영역 기준 0~1 좌표)
    const POS = { Idle: [0.07, 0.3], Walk: [0.2, 0.3], Run: [0.33, 0.3], Jump: [0.07, 0.76], Fall: [0.2, 0.76], Attack: [0.33, 0.76], Pause: [0.6, 0.3], Inventory: [0.6, 0.76] };
    const BOX = [0.11, 0.24];
    function groupRect(name, R) {
      const members = Object.keys(POS).filter((s) => chainOf(s).includes(name));
      let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
      for (const m of members) { const [x, y] = POS[m]; x0 = Math.min(x0, x - BOX[0] / 2); x1 = Math.max(x1, x + BOX[0] / 2); y0 = Math.min(y0, y - BOX[1] / 2); y1 = Math.max(y1, y + BOX[1] / 2); }
      const pad = name === 'Gameplay' || name === 'Menu' ? 0.03 : 0.012;
      return { x: R.x + (x0 - pad) * R.w, y: R.y + (y0 - pad * 2.2) * R.h, w: (x1 - x0 + pad * 2) * R.w, h: (y1 - y0 + pad * 3.2) * R.h };
    }
    function nodeCenter(name, R) {
      if (POS[name]) return { x: R.x + POS[name][0] * R.w, y: R.y + POS[name][1] * R.h };
      if (name === '(이전)') return { x: R.x + 0.86 * R.w, y: R.y + 0.5 * R.h };
      const g = groupRect(name, R);
      return { x: g.x + g.w / 2, y: g.y + g.h / 2 };
    }

    return {
      update(dt) {
        t += dt; demoT += dt;
        const inp = readInput(dt);
        step(inp);
        if (!isMenu(leaf)) physics(dt, inp);
        for (const [k, v] of flashEdge) { if (v - dt <= 0) flashEdge.delete(k); else flashEdge.set(k, v - dt); }
        timeline.push(leaf);
        if (timeline.length > 600) timeline.shift();
      },
      onAction(key) { if (key === 'restart') init(); },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        const R = { x: 8, y: 8, w: W - 16, h: H * 0.42 };
        const active = new Set(P.mode === 'flat' ? [leaf] : chainOf(leaf));

        // 상위 상태 묶음
        if (P.mode !== 'flat') {
          for (const name of ['Gameplay', 'Menu', 'Grounded', 'Airborne']) {
            const r = groupRect(name, R);
            D.rect(g, r.x, r.y, r.w, r.h, active.has(name) ? 'rgba(79,195,247,0.08)' : null, active.has(name) ? col : 'rgba(255,255,255,0.25)', 1);
            D.text(g, NAME[name], r.x + 4, r.y + 2, { size: 10, color: active.has(name) ? col : C.dim });
          }
        }
        // 전이 선
        if (P.edges) {
          table.forEach((tr, k) => {
            const a = nodeCenter(tr.from, R), b = nodeCenter(tr.to, R);
            const f = flashEdge.get(k) || 0;
            const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.15, my = (a.y + b.y) / 2 - (b.x - a.x) * 0.15;
            g.beginPath(); g.moveTo(a.x, a.y); g.quadraticCurveTo(mx, my, b.x, b.y);
            g.strokeStyle = f > 0 ? `rgba(255,255,255,${0.4 + f})` : 'rgba(255,255,255,0.13)';
            g.lineWidth = f > 0 ? 2.5 : 1; g.stroke();
          });
        }
        // 상태 상자
        for (const s of Object.keys(POS)) {
          const c = nodeCenter(s, R), bw = BOX[0] * R.w, bh = BOX[1] * R.h * 0.62;
          const on = s === leaf;
          D.rect(g, c.x - bw / 2, c.y - bh / 2, bw, bh, on ? SCOLOR[s] : '#232a35', on ? '#fff' : SCOLOR[s], on ? 2 : 1);
          D.text(g, NAME[s], c.x, c.y, { size: 11, color: on ? '#111' : '#fff', align: 'center', baseline: 'middle' });
        }
        if (P.mode === 'stack') {
          const c = nodeCenter('(이전)', R);
          D.text(g, GTL.L('상태 스택', 'State stack'), c.x, R.y + 4, { size: 10, color: C.dim, align: 'center' });
          stack.forEach((s, i) => {
            const y = R.y + R.h - 20 - i * 20;
            D.rect(g, c.x - 40, y, 80, 18, SCOLOR[s] + '88', '#fff', 1);
            D.text(g, NAME[s], c.x, y + 9, { size: 10, color: '#fff', align: 'center', baseline: 'middle' });
          });
          if (!stack.length) D.text(g, GTL.L('(비어 있음)', '(empty)'), c.x, R.y + R.h - 20, { size: 10, color: C.dim, align: 'center' });
        }

        // 게임 장면
        const groundY = H - 52, sceneTop = R.y + R.h + 6;
        D.line(g, 0, groundY, W, groundY, C.dim, 2);
        const ys = U.clamp((groundY - sceneTop - 50) / 130, 0.2, 1);
        const px = body.x * W, py = groundY - body.y * ys - 16;
        D.rect(g, px - 10, py - 16, 20, 32, SCOLOR[leaf] || col);
        D.circle(g, px + body.face * 5, py - 8, 3, '#111');
        if (leaf === 'Attack' || (isMenu(leaf) && stack.includes('Attack'))) {
          const f = U.clamp(1 - body.attackT / ATTACK_T, 0, 1);
          const s0 = body.face > 0 ? -1.2 : Math.PI + 1.2, s1 = s0 + 2.4 * f * body.face;
          g.beginPath(); g.arc(px, py, 28, s0, s1, body.face < 0);
          g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
        }
        D.text(g, NAME[leaf], px, py - 34, { size: 12, color: '#fff', align: 'center' });
        if (isMenu(leaf)) {
          D.rect(g, 0, sceneTop, W, groundY - sceneTop + 2, 'rgba(0,0,0,0.45)');
          D.text(g, GTL.L(`${NAME[leaf]} 메뉴 (게임 정지)`, `${NAME[leaf]} menu (game paused)`), W / 2, (sceneTop + groundY) / 2, { size: 15, color: '#fff', align: 'center', baseline: 'middle' });
        }
        // 상태 기록 띠 (최근 10초)
        const ty = H - 40, th = 12, tw = W - 16;
        D.text(g, GTL.L('상태 기록', 'State history'), 8, ty - 1, { size: 9, color: C.dim, baseline: 'bottom' });
        for (let i = 0; i < timeline.length; i++) {
          D.rect(g, 8 + (i / 600) * tw, ty, tw / 600 + 0.5, th, SCOLOR[timeline[i]]);
        }

        ctx.stat(GTL.L('전이 수', 'Transitions'), table.length);
        ctx.stat(GTL.L('메뉴 복귀 (들어갈 때 → 나올 때)', 'Menu return (enter → exit)'), lastResume);
        ctx.stat(GTL.L('메뉴 복귀 후 상태 불일치', 'State mismatches after menu'), mismatches);
        ctx.stat(GTL.L('공중 점프 (버그)', 'Air jumps (bug)'), airJumps);
        if (P.mode === 'stack') ctx.stat(GTL.L('스택 깊이', 'Stack depth'), stack.length);
      },
    };
  },
});
