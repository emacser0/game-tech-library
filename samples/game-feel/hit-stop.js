// 히트스톱(프리즈 프레임) + 히트 플래시 + 피격 흔들림
GTL.register({
  id: 'hit-stop',
  title: '히트스톱 & 히트 플래시',
  summary: '타격이 맞는 순간 게임을 수십 ms 멈추면(히트스톱) 뇌가 충돌을 알아챌 시간이 생겨 타격이 묵직해짐. 흰색 플래시와 피격자 진동을 더하면 같은 애니메이션도 완전히 다르게 느껴짐.',
  views: { a: '히트스톱 없음', b: '히트스톱 + 플래시 + 진동' },
  controls: 'Z / J / Space: 약공격, X / K: 강공격 (키를 누르면 자동 데모가 잠시 멈춤)',
  info: `
    <p>타격 순간은 보통 1~2프레임뿐. 아무 처리 없이 지나가면 주먹이 샌드백을 <b>스치고 지나간 것처럼</b> 보임.</p>
    <p><b>히트스톱</b>(hit stop, hit lag, freeze frame): 명중 시 공격자와 피격자의 시뮬레이션을 몇 프레임 멈추는 기법.
    격투 게임과 액션 게임에서 거의 표준. 강한 공격일수록 길게 줌(예: 약공격 3~5프레임, 강공격 8~12프레임).</p>
    <ul>
      <li><b>공격자도 정지</b>: 손이 대상에 "박힌" 느낌을 줌. 피격자만 멈추면 공격자는 계속 움직여 가볍게 느껴짐.</li>
      <li><b>피격자 진동</b>: 정지 중 피격자 스프라이트만 좌우로 떨게 해 충격을 전달(스매시브라더스 등)</li>
      <li><b>히트 플래시</b>: 피격자를 1~2프레임 흰색으로 그림. 명중 여부를 바로 읽을 수 있음.</li>
      <li>정지가 끝나면 넉백이 시작됨. "멈춤 → 폭발적 이동"의 대비가 핵심.</li>
    </ul>
    <p>시뮬레이션은 60Hz 고정 프레임. 하단 타임라인의 한 칸이 1프레임이고, 정지 프레임은 뷰 색으로 표시.
    단점: 정지가 너무 길면 템포가 끊김.</p>`,
  // 도식: 60Hz 프레임 타임라인. A는 명중 직후 넉백, B는 정지 프레임 뒤 넉백
  diagram: (L) => `<svg viewBox="0 0 540 152" xmlns="http://www.w3.org/2000/svg">
    <text x="219" y="16" text-anchor="middle" class="t-small">${L('명중', 'hit')}</text>
    <text x="4" y="36" class="t-a">${L('A 정지 없음', 'A: no hit stop')}</text>
    ${Array.from({ length: 20 }, (_, i) => `<rect x="${110 + i * 20}" y="22" width="18" height="20" class="${i < 5 ? 'f-dim' : i === 5 ? 'f-accent' : 'd-a'}"/>`).join('')}
    <text x="230" y="56" class="t-small t-a">${L('바로 넉백 시작', 'knockback starts at once')}</text>
    <path d="M230,65 L240,61 L250,69 L260,61 L270,69 L280,61 L290,69 L300,61 L310,69 L320,61 L328,65" class="d-b"/>
    <text x="4" y="84" class="t-b">${L('B 히트스톱', 'B: hit stop')}</text>
    ${Array.from({ length: 20 }, (_, i) => `<rect x="${110 + i * 20}" y="72" width="18" height="20" class="${i < 5 ? 'f-dim' : i === 5 ? 'f-accent' : i <= 10 ? 'f-b' : 'd-b'}"/>`).join('')}
    <text x="230" y="106" class="t-small t-b">${L('정지 프레임', 'frozen frames')}</text>
    <text x="332" y="106" class="t-small t-b">${L('넉백 시작', 'knockback starts')}</text>
    <rect x="110" y="118" width="10" height="10" class="f-accent"/>
    <text x="124" y="127" class="t-small">${L('명중 프레임 (B는 흰색 플래시)', 'hit frame (B: white flash)')}</text>
    <rect x="320" y="118" width="10" height="10" class="f-b"/>
    <text x="334" y="127" class="t-small">${L('정지 중 피격자만 진동', 'target shakes while frozen')}</text>
    <text x="4" y="146" class="t-small t-dim">${L('1칸 = 1프레임. 멈춤 뒤 폭발적 이동의 대비가 타격을 묵직하게 만듦', '1 cell = 1 frame. A stop, then a burst of motion, makes the hit feel heavy')}</text>
  </svg>`,
  look: [
    '자동 데모의 약-약-강 콤보를 비교하면 A는 샌드백이 툭 밀릴 뿐이고, B는 강공격에서 화면이 "쿵" 하고 멈춤',
    'B에서 "공격자도 정지"를 끄면 주먹이 대상을 관통해 지나가는 느낌이 됨',
    '히트스톱을 250ms로 키우면 동작이 끊겨 템포가 나빠짐. 강공격 배율로 약공격과 강공격의 차이를 조절해 볼 것.',
    '플래시와 진동만 켜고 히트스톱을 0으로 하면 효과가 일부 남지만 무게감은 사라짐. 무게감은 정지가 만듦.',
  ],
  refs: [
    { type: 'talk', title: 'Masahiro Sakurai on Creating Games (YouTube 채널)', year: 2022, note: '사쿠라이 마사히로. 히트스톱(hitstop)과 피격자 진동을 다룬 에피소드 있음.' },
    { type: 'talk', title: 'The Art of Screenshake (Jan Willem Nijman, Vlambeer)', year: 2013, note: 'INDIGO 2013. "sleep" (짧은 정지)를 타격감 기법으로 소개.' },
    { type: 'book', title: 'Game Feel: A Game Designer\'s Guide to Virtual Sensation (Steve Swink)', year: 2008 },
    { type: 'talk', title: 'Juice it or lose it (Martin Jonasson & Petri Purho)', year: 2012, note: '게임에 주스를 단계적으로 추가하는 시연 발표' },
  ],
  params: [
    { key: 'hitstop', label: '히트스톱', type: 'bool', a: false, b: true, group: '기법' },
    { key: 'stopMs', label: '약공격 정지 (ms)', type: 'range', min: 0, max: 250, step: 5, default: 70, when: (p) => p.hitstop },
    { key: 'heavyMul', label: '강공격 배율', type: 'range', min: 1, max: 4, step: 0.1, default: 2.4, when: (p) => p.hitstop },
    { key: 'freezeAttacker', label: '공격자도 정지', type: 'bool', default: true, when: (p) => p.hitstop },
    { key: 'shakeVictim', label: '피격자 진동', type: 'bool', a: false, b: true },
    { key: 'flash', label: '히트 플래시', type: 'bool', a: false, b: true },
    { key: 'screenShake', label: '화면 흔들림 (약하게)', type: 'bool', a: false, b: true },
    { key: 'spark', label: '타격 이펙트', type: 'bool', default: true },
    { key: 'knockback', label: '넉백 세기', type: 'range', min: 0, max: 2, step: 0.05, default: 1, shared: true, group: '장면' },
    { key: 'demo', label: '자동 데모', type: 'bool', default: true, shared: true },
    { key: 'restart', label: '처음부터', type: 'button', buttonLabel: '다시 시작' },
  ],
  en: {
    title: 'Hit Stop & Hit Flash',
    summary: 'Freeze the game for tens of ms at the moment of impact (hit stop). The brain gets time to notice the collision, so the hit feels heavy. Add a white flash and a shake on the target, and the same animation feels completely different.',
    views: { a: 'No hit stop', b: 'Hit stop + flash + shake' },
    controls: 'Z / J / Space: light attack, X / K: heavy attack (pressing a key pauses the auto demo for a moment)',
    info: `
    <p>The moment of impact usually lasts only 1 to 2 frames. If nothing happens, the fist looks like it <b>brushes past</b> the sandbag.</p>
    <p><b>Hit stop</b> (hit lag, freeze frame) pauses the simulation of the attacker and the target for a few frames on a hit.
    It is almost standard in fighting and action games. Stronger attacks get longer stops (for example 3 to 5 frames for light attacks, 8 to 12 for heavy attacks).</p>
    <ul>
      <li><b>Freeze the attacker too</b>: the hand feels "stuck" in the target. If only the target freezes, the attacker keeps moving and the hit feels light.</li>
      <li><b>Target shake</b>: during the stop, only the target sprite shakes left and right to pass on the impact (Smash Bros. and others).</li>
      <li><b>Hit flash</b>: draw the target white for 1 to 2 frames. You can read a hit at once.</li>
      <li>Knockback starts when the stop ends. The contrast of "freeze, then burst of motion" is the key.</li>
    </ul>
    <p>The simulation runs at a fixed 60Hz. In the timeline at the bottom, one cell is one frame. Frozen frames use the view color.
    Downside: if the stop is too long, it breaks the pace.</p>`,
    look: [
      'Compare the auto demo\'s light, light, heavy combo. In A the sandbag just gets pushed. In B the screen freezes with a "thud" on the heavy attack.',
      'In B, turn off "Freeze attacker too". The fist feels like it passes through the target.',
      'Raise hit stop to 250ms. The motion stutters and the pace suffers. Try the heavy attack multiplier to tune the gap between light and heavy attacks.',
      'Turn on only flash and shake, and set hit stop to 0. Some effect remains, but the weight is gone. The freeze creates the weight.',
    ],
    refs: [
      { title: 'Masahiro Sakurai on Creating Games (YouTube channel)', note: 'Masahiro Sakurai. Has episodes on hitstop and target shake.' },
      'INDIGO 2013. Introduces "sleep" (a short pause) as an impact technique.',
      null,
      'A live demo that adds juice to a game step by step.',
    ],
    params: {
      hitstop: { label: 'Hit stop', group: 'Technique' },
      stopMs: 'Light attack stop (ms)',
      heavyMul: 'Heavy attack multiplier',
      freezeAttacker: 'Freeze attacker too',
      shakeVictim: 'Target shake',
      flash: 'Hit flash',
      screenShake: 'Screen shake (light)',
      spark: 'Hit effect',
      knockback: { label: 'Knockback strength', group: 'Scene' },
      demo: 'Auto demo',
      restart: { label: 'Start over', buttonLabel: 'Restart' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 640, WH = 360, STEP = 1 / 60, GROUND = 290;
    const col = ctx.side === 'a' ? C.a : C.b;
    const LIGHT = ['KeyZ', 'KeyJ', 'Space'], HEAVY = ['KeyX', 'KeyK'];
    // 공격 정의 (프레임 단위): 준비, 판정, 회복
    const MOVES = {
      light: { wind: 4, active: 3, rec: 8, reach: 62, power: 1, dmg: 4 },
      heavy: { wind: 10, active: 4, rec: 16, reach: 78, power: 2.6, dmg: 12 },
    };
    const DEMO = ['light', 'light', 'heavy', null, 'light', 'heavy', null, null];

    let hitNow = false, acc, atk, bag, stop, stopTotal, flashF, sparks, timeline, shakeT, combo, idle, queue, demoIdx, demoWait, nums, simT, stopsLog;
    function init() {
      acc = 0; idle = 99; simT = 0;
      atk = { move: null, f: 0, hit: false, x: 282 };
      bag = { th: 0, w: 0 };                  // 매달린 샌드백 진자 (각도, 각속도)
      stop = 0; stopTotal = 0; flashF = 0; shakeT = 0; combo = 0;
      sparks = []; timeline = []; nums = []; queue = null; demoIdx = 0; demoWait = 20; stopsLog = [];
    }
    init();
    const PIV = { x: 360, y: 40 }, ROPE = 180;
    const bagPos = () => ({ x: PIV.x + Math.sin(bag.th) * ROPE, y: PIV.y + Math.cos(bag.th) * ROPE });

    function startMove(name) {
      if (atk.move && atk.f < MOVES[atk.move].wind + MOVES[atk.move].active + MOVES[atk.move].rec - 4) { queue = name; return; }
      atk.move = name; atk.f = 0; atk.hit = false;
    }

    function stepAttacker() {
      if (!atk.move) { if (queue) { startMove(queue); queue = null; } return; }
      const m = MOVES[atk.move];
      atk.f++;
      const inActive = atk.f > m.wind && atk.f <= m.wind + m.active;
      if (inActive && !atk.hit) {
        const b = bagPos();
        {
          atk.hit = true; combo++; hitNow = true;
          const kb = P.knockback * m.power;
          bag.w += 1.5 * kb;
          if (P.hitstop) { stop = Math.round((P.stopMs * (atk.move === 'heavy' ? P.heavyMul : 1)) / (1000 * STEP)); stopTotal = stop; }
          stopsLog.push(stop); if (stopsLog.length > 6) stopsLog.shift();
          if (P.flash) flashF = atk.move === 'heavy' ? 4 : 2;
          if (P.screenShake) shakeT = atk.move === 'heavy' ? 0.22 : 0.1;
          const hx = atk.x + m.reach, hy = b.y + 10;
          if (P.spark) sparks.push({ x: hx, y: hy, life: 1, big: atk.move === 'heavy', rot: simT * 7 });
          nums.push({ x: b.x, y: b.y - 40, v: m.dmg, life: 1 });
        }
      }
      if (atk.f >= m.wind + m.active + m.rec) { atk.move = null; if (queue) { startMove(queue); queue = null; } }
    }
    function stepBag() {
      bag.w += -Math.sin(bag.th) * 30 * STEP;   // 진자: g/L = 30
      bag.w *= Math.exp(-2.2 * STEP);
      bag.th += bag.w * STEP;
      bag.th = U.clamp(bag.th, -0.2, 1.3);
    }

    function frame(input) {
      if (input) startMove(input);
      hitNow = false;
      let frozen = false;
      if (stop > 0) {
        stop--; frozen = true;
        if (!P.freezeAttacker) stepAttacker();
      } else { stepAttacker(); stepBag(); }
      simT += STEP;
      if (flashF > 0) flashF--;
      shakeT = Math.max(0, shakeT - STEP);
      for (const s of sparks) s.life -= frozen ? STEP * 0.6 : STEP * 3;
      sparks = sparks.filter((s) => s.life > 0);
      for (const n of nums) { n.life -= STEP * 1.2; n.y -= 30 * STEP; }
      nums = nums.filter((n) => n.life > 0);
      timeline.push(hitNow ? 1 : frozen ? 2 : 0);
      if (timeline.length > 120) timeline.shift();
    }

    function demoInput() {
      if (demoWait > 0) { demoWait--; return null; }
      const m = DEMO[demoIdx % DEMO.length]; demoIdx++;
      demoWait = m === 'heavy' ? 30 : m === 'light' ? 14 : 22;
      if (demoIdx % DEMO.length === 0) demoWait = 50;
      return m;
    }

    return {
      update(dt) {
        const kb = ctx.input;
        let manual = HEAVY.some(kb.pressed) ? 'heavy' : LIGHT.some(kb.pressed) ? 'light' : null;
        idle = manual || [...LIGHT, ...HEAVY].some(kb.key) ? 0 : idle + dt;
        const demo = P.demo && idle > 2.5;
        acc += dt;
        while (acc >= STEP) {
          acc -= STEP;
          let inp = null;
          if (demo) { if (!stop || !P.hitstop) inp = demoInput(); }
          else { inp = manual; manual = null; }
          frame(inp);
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const sc = Math.min(W / WW, H / WH), ox = (W - WW * sc) / 2, oy = (H - WH * sc) / 2;
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        if (shakeT > 0) { const k = shakeT * 30; g.translate(Math.sin(simT * 190) * k, Math.cos(simT * 150) * k * 0.6); }
        D.rect(g, -20, GROUND, WW + 40, WH - GROUND + 20, '#252a33');
        D.line(g, -20, GROUND, WW + 20, GROUND, '#4a5260', 2);
        D.rect(g, PIV.x - 60, PIV.y - 8, 120, 8, '#3a414d');
        // 샌드백
        const b = bagPos();
        let bx = b.x, by = b.y;
        if (stop > 0 && P.shakeVictim) bx += (stop % 2 ? 1 : -1) * (3 + 3 * (stop / Math.max(1, stopTotal)));
        D.line(g, PIV.x, PIV.y, bx, by, '#8a8f99', 2);
        g.save(); g.translate(bx, by); g.rotate(-bag.th);
        const white = flashF > 0;
        D.rect(g, -26, 0, 52, 110, white ? '#ffffff' : '#a0522d', white ? null : '#6b3a20', 2);
        if (!white) { D.rect(g, -26, 18, 52, 6, '#6b3a20'); D.rect(g, -26, 86, 52, 6, '#6b3a20'); }
        g.restore();
        // 공격자
        const ax = atk.x, ay = GROUND;
        let ext = 0, lean = 0;
        if (atk.move) {
          const m = MOVES[atk.move];
          if (atk.f <= m.wind) { ext = -0.25 * (atk.f / m.wind); lean = -4 * (atk.f / m.wind); }
          else if (atk.f <= m.wind + m.active) { ext = 1; lean = atk.move === 'heavy' ? 10 : 5; }
          else { const r = (atk.f - m.wind - m.active) / m.rec; ext = 1 - U.ease.inOutQuad(r); lean = (atk.move === 'heavy' ? 10 : 5) * (1 - r); }
        }
        const reach = atk.move ? MOVES[atk.move].reach : 50;
        D.rect(g, ax - 18 + lean, ay - 80, 36, 54, col);
        D.rect(g, ax - 14, ay - 26, 10, 26, col); D.rect(g, ax + 4, ay - 26, 10, 26, col);
        D.circle(g, ax + lean, ay - 96, 15, col);
        D.circle(g, ax + lean + 6, ay - 99, 3, '#14161a');
        const armLen = 22 + (reach - 22) * Math.max(0, ext);
        const shY = ay - 70;
        D.line(g, ax + lean + 10, shY, ax + lean + 10 + armLen, shY + 6, col, 9);
        D.circle(g, ax + lean + 10 + armLen, shY + 6, atk.move === 'heavy' ? 10 : 8, '#fff2', col, 3);
        // 이펙트
        for (const s of sparks) {
          const r = (s.big ? 46 : 28) * (1.3 - s.life * 0.6), n = s.big ? 10 : 7;
          const pts = [];
          for (let i = 0; i < n * 2; i++) { const a = s.rot + (i / (n * 2)) * U.TAU, rr = i % 2 ? r * 0.4 : r; pts.push({ x: s.x + Math.cos(a) * rr, y: s.y + Math.sin(a) * rr }); }
          g.globalAlpha = Math.min(1, s.life * 1.5);
          D.poly(g, pts, s.big ? '#fff3b0' : '#ffffff', C.warn, 2);
          g.globalAlpha = 1;
        }
        for (const n of nums) D.text(g, String(n.v), n.x, n.y, { size: 18, color: `rgba(255,220,120,${n.life})`, align: 'center' });
        g.restore();
        // 타임라인 (흔들림 없음)
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        const cw = (WW - 24) / 120;
        D.text(g, GTL.L('프레임 타임라인 (최근 2초, 1칸 = 1/60초)', 'Frame timeline (last 2 s, 1 cell = 1/60 s)'), 12, WH - 44, { size: 10, color: C.dim });
        for (let i = 0; i < timeline.length; i++) {
          const v = timeline[i];
          D.rect(g, 12 + i * cw, WH - 30, Math.max(1, cw - 1), 16, v === 2 ? col : v === 1 ? '#ffffff' : 'rgba(255,255,255,0.12)');
        }
        if (stop > 0) D.text(g, GTL.L(`정지 ${stop}f`, `Stop ${stop}f`), WW - 12, 12, { size: 16, color: col, align: 'right' });
        if (P.demo && idle <= 2.5) D.text(g, GTL.L('수동 조작 중', 'Manual control'), 12, 12, { size: 11, color: C.warn });
        g.restore();
        ctx.stat(GTL.L('최근 정지(프레임)', 'Recent stops (frames)'), stopsLog.length ? stopsLog.join(', ') : '-');
        ctx.stat(GTL.L('명중 수', 'Hits'), combo);
        ctx.stat(GTL.L('타임라인 중 정지 비율', 'Frozen share of timeline'), ((timeline.filter((v) => v === 2).length / Math.max(1, timeline.length)) * 100).toFixed(0) + ' %');
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
