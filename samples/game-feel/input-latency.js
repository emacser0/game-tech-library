// 입력 지연 체감: 버튼을 누른 뒤 N 프레임 늦게 게임에 반영될 때의 차이
GTL.register({
  id: 'input-latency',
  title: '입력 지연 체감 (프레임 지연)',
  summary: '같은 순간에 점프를 눌러도 입력이 몇 프레임 늦게 반영되면 캐릭터는 그만큼 늦게 뜀. 0 프레임과 6 프레임(100ms) 지연을 같은 입력으로 비교.',
  views: { a: '지연 0 프레임', b: '지연 6 프레임 (100ms)' },
  controls: 'Space / Z / ↑ / W 점프 (키를 누르면 자동 데모가 잠시 멈춤)',
  info: `
    <p><b>입력 지연(Input Lag)</b>: 버튼을 누른 순간부터 그 결과가 게임 상태에 반영되기까지 걸리는 시간.
    여러 단계가 쌓여서 생김. 예: 컨트롤러 폴링, OS 이벤트 처리, 게임 루프 대기, 렌더 큐, 디스플레이 처리.</p>
    <p>왜 중요한가: 플레이어는 화면을 보고 "지금"이라고 판단해 버튼을 누름.
    반영이 늦으면 캐릭터는 그만큼 앞으로 더 간 뒤에 뜀. 타이밍 여유가 작은 장애물부터 실패.</p>
    <p>이 샘플은 입력을 큐에 넣고 N 프레임 뒤에 꺼내 적용. 바닥의 흰 표시는 버튼을 누른 지점, 뷰 색 표시는 점프가 실제로 시작된 지점.
    두 표시 사이 거리 = 속도 × 지연 시간.</p>
    <ul>
      <li>줄이는 방법: 입력을 프레임 시작 직전에 읽기, 렌더 큐(버퍼링 프레임) 줄이기, 수직 동기 대기 줄이기</li>
      <li>숨기는 방법: 점프 버퍼, 코요테 타임 같은 관대한 판정. 대전 게임 롤백 넷코드의 입력 지연 설정도 같은 문제를 다룸.</li>
    </ul>`,
  // 도식: 같은 프레임에 누른 입력이 큐를 거쳐 N 프레임 뒤에 적용되는 흐름과 그 사이 이동 거리
  diagram: (L) => `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr-il" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="4" y="18" class="t-dim t-small">${L('프레임', 'Frame')}</text>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<text x="${120 + i * 40}" y="18" text-anchor="middle" class="t-small t-mono t-dim">${i}</text><line x1="${120 + i * 40}" y1="24" x2="${120 + i * 40}" y2="102" class="d-dim" stroke-dasharray="1 3"/>`).join('')}
    <text x="4" y="42">${L('버튼 입력', 'Button input')}</text>
    <circle cx="120" cy="38" r="5" class="f-accent"/><text x="130" y="42" class="t-small">${L('누름', 'press')}</text>
    <text x="4" y="68" class="t-a">${L('A: 지연 0', 'A: delay 0')}</text>
    <rect x="114" y="57" width="12" height="16" class="f-a"/><text x="132" y="69" class="t-small">${L('점프 시작', 'jump starts')}</text>
    <text x="4" y="94" class="t-b">${L('B: 지연 6', 'B: delay 6')}</text>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${121 + i * 40}" y="84" width="38" height="14" class="f-dim"/>`).join('')}
    <text x="240" y="95" text-anchor="middle" class="t-small t-dim">${L('입력 큐에서 대기', 'waits in input queue')}</text>
    <rect x="354" y="83" width="12" height="16" class="f-b"/><text x="372" y="95" class="t-small">${L('점프 시작', 'jump starts')}</text>
    <text x="4" y="150" class="t-dim t-small">${L('바닥 표시', 'Ground marks')}</text>
    <line x1="120" y1="160" x2="520" y2="160" class="d-dim"/>
    <rect x="266" y="146" width="12" height="14" class="f-dim"/>
    <line x1="200" y1="148" x2="200" y2="168" class="d-line"/>
    <path d="M200,160 Q245,108 290,160" class="d-a"/><path d="M260,160 Q305,108 350,160" class="d-b"/>
    <path d="M202,174 L258,174" class="d-accent" marker-start="url(#arr-il)" marker-end="url(#arr-il)"/>
    <text x="268" y="178" class="t-small">${L('거리 = 이동 속도 × 지연 시간', 'distance = speed × delay time')}</text>
  </svg>`,
  look: [
    '자동 데모는 두 뷰에서 같은 순간에 점프를 누름. A는 모두 통과하고, B는 높은 장애물에서 자주 부딪힘.',
    'B의 입력 지연을 2 프레임으로 낮추면 거의 다 통과. 4 프레임부터 실패가 섞이기 시작.',
    '"이동 속도"를 올리면 같은 지연이라도 흰 표시와 색 표시 사이가 벌어지고 실패가 늘어남',
    '자동 데모를 끄고 직접 해 보면 B는 일찍 누르도록 손이 적응해 감. 지연이 "무겁다"는 느낌으로 남음.',
  ],
  refs: [
    { type: 'book', title: 'Game Feel: A Game Designer\'s Guide to Virtual Sensation (Steve Swink)', year: 2008, note: '응답성(responsiveness)과 입력 지연이 조작감에 주는 영향' },
    { type: 'talk', title: '8 Frames in 16ms: Rollback Networking in Mortal Kombat and Injustice 2 (Michael Stallone)', year: 2018, note: 'GDC 2018. 입력 지연 프레임과 롤백의 균형.' },
    { type: 'article', title: 'Computer latency: 1977-2017 (Dan Luu)', url: 'https://danluu.com/input-lag/', year: 2017, note: '키 입력에서 화면 반영까지의 지연 측정 사례' },
    { type: 'engine', title: 'NVIDIA Reflex', note: '렌더 큐를 줄여 시스템 지연을 낮추는 SDK' },
  ],
  params: [
    { key: 'delay', label: '입력 지연 (프레임@60)', type: 'int', min: 0, max: 12, a: 0, b: 6, default: 0, group: '기법' },
    { key: 'showQueue', label: '입력 큐 표시', type: 'bool', default: true },
    { key: 'speed', label: '이동 속도 (px/s)', type: 'int', min: 200, max: 480, default: 320, shared: true, group: '장면' },
    { key: 'demo', label: '자동 데모', type: 'bool', default: true, shared: true },
    { key: 'restart', label: '처음부터', type: 'button', buttonLabel: '다시 시작' },
  ],
  en: {
    title: 'Feeling Input Latency (Frame Delay)',
    summary: 'Even if you press jump at the same moment, the character jumps later when input is applied a few frames late. This compares 0 frames and 6 frames (100ms) of delay with the same input.',
    views: { a: '0 frames delay', b: '6 frames delay (100ms)' },
    controls: 'Space / Z / ↑ / W to jump (pressing a key pauses the auto demo for a moment)',
    info: `
    <p><b>Input lag</b> is the time from the moment you press a button until the result reaches the game state.
    It comes from many stages added together. For example: controller polling, OS event handling, waiting in the game loop, the render queue, and display processing.</p>
    <p>Why it matters: players watch the screen, decide "now", and press the button.
    If the input arrives late, the character moves further forward before it jumps. Obstacles with the smallest timing margin fail first.</p>
    <p>This sample puts input in a queue and applies it N frames later. White marks on the floor show where you pressed. Marks in the view color show where the jump really started.
    The distance between the two marks = speed × delay.</p>
    <ul>
      <li>Ways to reduce it: read input just before the frame starts, shorten the render queue (buffered frames), and reduce vsync waiting.</li>
      <li>Ways to hide it: forgiving checks such as jump buffering and coyote time. The input delay setting in fighting game rollback netcode deals with the same problem.</li>
    </ul>`,
    look: [
      'The auto demo presses jump at the same moment in both views. A clears everything. B often hits the tall obstacles.',
      'Lower B\'s input delay to 2 frames and it clears almost everything. Failures start to mix in from 4 frames.',
      'Raise "Move speed". With the same delay, the gap between the white and colored marks grows and failures increase.',
      'Turn off the auto demo and try it yourself. In B your hand learns to press early. The delay stays with you as a "heavy" feeling.',
    ],
    refs: [
      'How responsiveness and input latency affect game feel.',
      'GDC 2018. Balancing input delay frames and rollback.',
      'Measurements of the latency from a key press to the screen.',
      'An SDK that lowers system latency by shortening the render queue.',
    ],
    params: {
      delay: { label: 'Input delay (frames@60)', group: 'Technique' },
      showQueue: 'Show input queue',
      speed: { label: 'Move speed (px/s)', group: 'Scene' },
      demo: 'Auto demo',
      restart: { label: 'Start over', buttonLabel: 'Restart' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 640, WH = 360, STEP = 1 / 60;
    const GROUND = 290, PX = 120, PW = 20, PH = 24, GRAV = 2600, JUMP_V = 640;
    const col = ctx.side === 'a' ? C.a : C.b;
    const JUMP = ['Space', 'KeyZ', 'ArrowUp', 'KeyW'];

    let rng, obs, nextX, scroll, p, queue, acc, idle, pending, stats, marks, flash, frame, lastGap;
    function init() {
      rng = U.rng(ctx.seed + 5);
      obs = []; nextX = 520; scroll = 0; acc = 0; idle = 99; pending = false; frame = 0; flash = 0;
      p = { y: GROUND - PH, vy: 0, grounded: true };
      queue = []; marks = []; stats = { ok: 0, hit: 0 }; lastGap = null;
      while (nextX < WW + 400) spawn();
    }
    function spawn() {
      const w = rng.pick([22, 30, 46]), h = rng.pick([28, 36]);
      // 자동 데모가 점프를 누르는 거리 (사람마다, 매번 조금씩 다름). 두 뷰가 같은 값을 씀
      const trig = rng.range(36, 60);
      obs.push({ x: nextX, w, h, trig, pressed: false, hit: false, done: false });
      nextX += rng.range(230, 420);
    }
    init();

    function step(manualPress, auto) {
      frame++;
      const dx = P.speed * STEP;
      scroll += dx;
      for (const o of obs) o.x -= dx;
      nextX -= dx;
      while (obs.length && obs[0].x + obs[0].w < -40) obs.shift();
      while (nextX < WW + 400) spawn();
      // 사람 입력 (데모: 장애물 앞 거리가 trig 이하가 되면 누름)
      let press = false;
      if (auto) {
        const o = obs.find((q) => !q.pressed && q.x + q.w > PX);
        if (o && o.x - (PX + PW) <= o.trig) { o.pressed = true; press = true; }
      } else press = manualPress;
      if (press) marks.push({ wx: scroll + PX + PW / 2, kind: 'press', f: frame });
      // 입력 큐: N 프레임 뒤에 꺼냄
      queue.push({ press, f: frame });
      let applied = false;
      while (queue.length > P.delay) { const q = queue.shift(); if (q.press) { applied = true; lastGap = (frame - q.f); } }
      if (applied) {
        marks.push({ wx: scroll + PX + PW / 2, kind: p.grounded ? 'jump' : 'miss', f: frame });
        if (p.grounded) { p.vy = -JUMP_V; p.grounded = false; }
      }
      while (marks.length > 24) marks.shift();
      // 물리
      p.vy += GRAV * STEP;
      p.y += p.vy * STEP;
      if (p.y >= GROUND - PH) { p.y = GROUND - PH; p.vy = 0; p.grounded = true; }
      // 충돌, 통과 판정
      for (const o of obs) {
        if (o.done) continue;
        const ov = PX < o.x + o.w && PX + PW > o.x && p.y + PH > GROUND - o.h;
        if (ov && !o.hit) { o.hit = true; stats.hit++; flash = 0.25; }
        if (o.x + o.w < PX) { o.done = true; if (!o.hit) stats.ok++; }
      }
      flash = Math.max(0, flash - STEP);
    }

    return {
      update(dt) {
        const kb = ctx.input;
        const pressed = JUMP.some(kb.pressed);
        idle = JUMP.some(kb.key) || pressed ? 0 : idle + dt;
        const auto = P.demo && idle > 2.5;
        if (!auto && pressed) pending = true;
        acc += dt;
        while (acc >= STEP) { acc -= STEP; step(pending, auto); pending = false; }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const sc = Math.min(W / WW, H / WH), ox = (W - WW * sc) / 2, oy = (H - WH * sc) / 2;
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        D.grid(g, WW, WH, 40, undefined, -(scroll % 40), 0);
        D.rect(g, 0, GROUND, WW, WH - GROUND, '#2a2f38');
        D.rect(g, 0, GROUND, WW, 3, '#4a5260');
        // 누름, 실행 표시
        for (const m of marks) {
          const x = m.wx - scroll;
          if (x < -10) continue;
          if (m.kind === 'press') D.rect(g, x - 1, GROUND + 4, 2, 14, '#fff');
          else D.rect(g, x - 1, GROUND + 4, 2, 14, m.kind === 'jump' ? col : C.dim);
        }
        for (let i = 0; i < marks.length; i++) {
          const m = marks[i];
          if (m.kind !== 'press') continue;
          const e = marks.slice(i + 1).find((q) => q.kind !== 'press');
          if (!e) continue;
          const x0 = m.wx - scroll, x1 = e.wx - scroll;
          if (x1 - x0 > 1) D.arrow(g, x0, GROUND + 24, x1, GROUND + 24, col, 1.5, 5);
        }
        // 장애물
        for (const o of obs) D.rect(g, o.x, GROUND - o.h, o.w, o.h, o.hit ? C.bad : '#6b7385', o.hit ? '#fff' : null, 1);
        // 플레이어
        D.rect(g, PX, p.y, PW, PH, flash > 0 ? C.bad : col);
        D.rect(g, PX + 12, p.y + 6, 4, 4, '#14161a');
        // 입력 큐
        if (P.showQueue) {
          const bx = 12, by = 40, bw = 18;
          D.text(g, GTL.L(`입력 큐 (${P.delay} 프레임 뒤 적용)`, `Input queue (applied ${P.delay} frames later)`), bx, by - 16, { size: 11, color: C.dim });
          for (let i = 0; i < Math.max(1, P.delay); i++) {
            const q = queue[i];
            D.rect(g, bx + i * (bw + 3), by, bw, bw, q && q.press ? C.warn : 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.25)', 1);
          }
          if (P.delay === 0) D.text(g, GTL.L('바로 적용', 'Applied at once'), bx + bw + 8, by + 3, { size: 11, color: C.good });
        }
        D.text(g, GTL.L('흰 표시: 누른 지점, 색 표시: 점프 시작 지점', 'White mark: where you pressed, colored mark: where the jump started'), WW - 12, GROUND + 44, { size: 10, color: C.dim, align: 'right' });
        if (P.demo && idle <= 2.5) D.text(g, GTL.L('수동 조작 중', 'Manual control'), WW - 12, 12, { size: 11, color: C.warn, align: 'right' });
        g.restore();
        const tot = stats.ok + stats.hit;
        ctx.stat(GTL.L('입력 지연', 'Input delay'), GTL.L(`${P.delay} 프레임 (${(P.delay * 1000 / 60).toFixed(0)} ms)`, `${P.delay} frames (${(P.delay * 1000 / 60).toFixed(0)} ms)`));
        ctx.stat(GTL.L('통과 / 충돌', 'Cleared / hit'), `${stats.ok} / ${stats.hit}`);
        ctx.stat(GTL.L('통과율', 'Clear rate'), tot ? `${((stats.ok / tot) * 100).toFixed(0)}%` : '-');
        ctx.stat(GTL.L('누름에서 점프까지 거리', 'Distance from press to jump'), `${(P.delay * P.speed / 60).toFixed(0)} px`);
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
