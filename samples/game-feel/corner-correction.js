// 코너 보정: 머리/발이 모서리를 몇 픽셀 스쳤을 때 막지 않고 옆(위)으로 밀어주기
GTL.register({
  id: 'corner-correction',
  title: '코너 보정 (Corner Correction)',
  summary: '천장 틈으로 점프했는데 머리가 모서리를 2~3픽셀 스쳐 "쿵" 떨어지면 플레이어는 게임이 틀렸다고 느낌. 몇 픽셀 이내로 걸렸다면 캐릭터를 살짝 밀어 통과시킴.',
  views: { a: '보정 없음', b: '코너 보정 + 가장자리 보정' },
  controls: '←→ / A D 이동, Space / Z / ↑ / W 점프 (키를 누르면 자동 데모가 잠시 멈춤)',
  info: `
    <p>AABB(축 정렬 박스) 충돌은 정확하지만 냉정함. 플레이어 눈에는 틈을 통과한 점프여도, 박스 모서리가 천장 끝과 몇 픽셀 겹치면
    상승 속도가 0이 되어 떨어짐(<b>bonk</b>).</p>
    <p><b>코너 보정</b>: 상승 중 천장과 겹치면 좌우로 1..N 픽셀씩 옮겨 봄. 비어 있는 위치가 있으면 그곳으로 밀고 상승을 유지함.</p>
    <pre>if (vy &lt; 0 &amp;&amp; hitCeiling)
  for (i = 1..N) for (s of [-1, +1])
    if (free(x + s*i, y)) { x += s*i; return; }   // 통과
vy = 0;                                            // 진짜 부딪힘</pre>
    <p><b>가장자리(ledge) 보정</b>: 공중에서 수평으로 벽에 막혔을 때 적용함. 벽 윗면이 발보다 N픽셀 이내로 아래에 있으면 캐릭터를 위로 올려 발판에 세움.
    Celeste는 상승 코너 보정 4px과 대시 중 가장자리 보정을 함께 씀(320×180 해상도 기준).</p>
    <p>색 띠는 보정이 일어나는 "용서 구간". 이 구간 안에서 스치면 밀려서 통과하고, 밖이면 부딪힘.
    단점: 범위가 너무 크면 벽을 뚫고 순간이동하는 것처럼 보임.</p>`,
  // 도식: 코너 보정(천장 모서리를 스치면 옆으로 밀기)과 가장자리 보정(턱에 걸리면 위로 올리기)
  diagram: (L) => `<svg viewBox="0 0 540 166" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="12">${L('코너 보정 (상승 중)', 'Corner correction (rising)')}</text>
    <rect x="10" y="30" width="100" height="20" class="f-dim"/><rect x="170" y="30" width="90" height="20" class="f-dim"/>
    <text x="60" y="44" text-anchor="middle" class="t-small t-dim">${L('천장', 'ceiling')}</text>
    <rect x="102" y="50" width="8" height="5" class="f-accent" opacity="0.6"/>
    <rect x="100" y="52" width="30" height="40" class="d-a"/>
    <circle cx="110" cy="50" r="3" class="f-bad"/>
    <rect x="112" y="18" width="30" height="40" class="d-b" stroke-dasharray="4 3"/>
    <path d="M115,74 L126,44" class="d-b" marker-end="url(#arr)"/>
    <text x="10" y="116" class="t-a">${L('A: 쿵, 상승 멈춤', 'A: bonk, rise stops')}</text>
    <text x="10" y="132" class="t-b">${L('B: 옆으로 밀어 통과', 'B: nudged sideways, passes')}</text>
    <text x="10" y="154" class="t-small t-dim">${L('겹침이 N px 이내면 x를 옮겨 봄', 'If the overlap is within N px, try shifting x')}</text>
    <line x1="275" y1="6" x2="275" y2="160" class="d-dim"/>
    <text x="290" y="12">${L('가장자리 보정 (수평 이동)', 'Ledge correction (moving sideways)')}</text>
    <rect x="420" y="90" width="110" height="70" class="f-dim"/>
    <rect x="414" y="90" width="6" height="8" class="f-accent" opacity="0.6"/>
    <rect x="390" y="56" width="30" height="40" class="d-a"/>
    <rect x="430" y="48" width="30" height="40" class="d-b" stroke-dasharray="4 3"/>
    <path d="M405,76 L440,70" class="d-b" marker-end="url(#arr)"/>
    <text x="290" y="116" class="t-a">${L('A: 벽에 막힘', 'A: blocked by wall')}</text>
    <text x="290" y="132" class="t-b">${L('B: 턱 위로 올림', 'B: lifted onto ledge')}</text>
    <text x="290" y="154" class="t-small t-dim">${L('발이 턱보다 N px 이내로 아래', 'Feet within N px below the top')}</text>
  </svg>`,
  look: [
    '자동 데모를 켜 두면 세 틈에서 머리가 모서리에 각각 3 / 6 / 11px 걸리게 점프함. 마지막에는 낮은 턱에 발이 몇 px 걸리게 뜀.',
    'A를 보면 모두 "쿵"(✗) 하고 떨어짐. B는 3px, 6px에서 화살표 방향으로 밀려 통과하고, 11px은 보정 범위(8px) 밖이라 여전히 부딪힘.',
    'B의 보정 픽셀을 16으로 올리면 셋 다 통과함. 너무 크면 벽 속으로 순간이동하는 것처럼 보여서 보통 캐릭터 폭의 1/4 정도를 씀.',
    '"가장자리 보정"만 끄면 마지막 턱에서 캐릭터가 벽에 붙은 채 미끄러져 떨어짐.',
  ],
  refs: [
    { type: 'code', title: 'Celeste - Player.cs (UpwardCornerCorrection, DashCornerCorrection)', url: 'https://github.com/NoelFB/Celeste', year: 2018, note: 'OnCollideV/OnCollideH에서 1..4px 옮겨 보고 비어 있으면 통과시킴.' },
    { type: 'article', title: 'Celeste & Forgiveness (Maddy Thorson)', year: 2020, note: '코너 보정을 포함한 "보이지 않는 도움" 목록.' },
    { type: 'talk', title: 'Why Does Celeste Feel So Good to Play? (Game Maker\'s Toolkit)', year: 2019 },
  ],
  params: [
    { key: 'corner', label: '코너 보정 (상승 중 천장)', type: 'bool', a: false, b: true, group: '기법' },
    { key: 'cornerPx', label: '코너 보정 최대 (px)', type: 'int', min: 1, max: 16, default: 8, when: (p) => p.corner },
    { key: 'ledge', label: '가장자리 보정 (수평 이동 중 턱)', type: 'bool', a: false, b: true },
    { key: 'ledgePx', label: '가장자리 보정 최대 (px)', type: 'int', min: 1, max: 16, default: 8, when: (p) => p.ledge },
    { key: 'showZones', label: '용서 구간 표시', type: 'bool', default: true },
    { key: 'demo', label: '자동 데모', type: 'bool', default: true, shared: true, group: '장면' },
    { key: 'restart', label: '처음부터', type: 'button', buttonLabel: '다시 시작' },
  ],
  en: {
    title: 'Corner Correction',
    summary: 'You jump through a gap in the ceiling, but your head clips the corner by 2 to 3 pixels and you "bonk" and fall. The player feels the game got it wrong. If the overlap is only a few pixels, nudge the character so it gets through.',
    views: { a: 'No correction', b: 'Corner + ledge correction' },
    controls: '←→ / A D to move, Space / Z / ↑ / W to jump (pressing a key pauses the auto demo for a moment)',
    info: `
    <p>AABB (axis aligned box) collision is exact but unforgiving. To the player the jump went through the gap. But if the box corner overlaps the ceiling edge by a few pixels,
    the rising speed drops to 0 and the character falls (<b>bonk</b>).</p>
    <p><b>Corner correction</b>: when you hit the ceiling while rising, try moving 1..N pixels left and right. If a free spot exists, push the character there and keep rising.</p>
    <pre>if (vy &lt; 0 &amp;&amp; hitCeiling)
  for (i = 1..N) for (s of [-1, +1])
    if (free(x + s*i, y)) { x += s*i; return; }   // pass through
vy = 0;                                            // real hit</pre>
    <p><b>Ledge correction</b>: this applies when a wall blocks you sideways in the air. If the top of the wall is less than N pixels below your feet, lift the character onto the ledge.
    Celeste uses 4px upward corner correction plus ledge correction during dashes (at 320×180 resolution).</p>
    <p>The colored bands are the "forgiveness zones" where correction happens. A clip inside a zone gets pushed through. A clip outside it hits.
    Downside: if the range is too large, it looks like the character teleports through walls.</p>`,
    look: [
      'With the auto demo on, the character jumps at three gaps so the head clips the corner by 3 / 6 / 11px. Last, it jumps so the feet clip a low ledge by a few px.',
      'In A every jump "bonks" (✗) and falls. In B the 3px and 6px jumps get pushed in the arrow direction and pass. 11px is outside the correction range (8px), so it still hits.',
      'Raise B\'s correction pixels to 16 and all three pass. Too much looks like teleporting into the wall, so people usually use about 1/4 of the character width.',
      'Turn off only "Ledge correction". At the last ledge the character sticks to the wall, slides down, and falls.',
    ],
    refs: [
      'OnCollideV/OnCollideH try moving 1..4px and let the character through if the spot is free.',
      'A list of "invisible help", including corner correction.',
      null,
    ],
    params: {
      corner: { label: 'Corner correction (ceiling while rising)', group: 'Technique' },
      cornerPx: 'Max corner correction (px)',
      ledge: 'Ledge correction (ledge while moving sideways)',
      ledgePx: 'Max ledge correction (px)',
      showZones: 'Show forgiveness zones',
      demo: { label: 'Auto demo', group: 'Scene' },
      restart: { label: 'Start over', buttonLabel: 'Restart' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 640, WH = 360, STEP = 1 / 120;
    const GRAV = 2000, JUMP_V = 820, HOP_V = 420, RUN = 200, PW = 18, PH = 24, FLOOR = 300;
    const CEIL_Y = 150, CEIL_H = 20, LEDGE_X = 560, LEDGE_Y = 262;
    const col = ctx.side === 'a' ? C.a : C.b;
    const KEYS = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], jump: ['Space', 'KeyZ', 'ArrowUp', 'KeyW'] };
    const ALL = [...KEYS.left, ...KEYS.right, ...KEYS.jump];

    const solids = [
      { x: -40, y: FLOOR, w: 720, h: 100 },
      { x: -40, y: 0, w: 40, h: FLOOR }, { x: WW, y: 0, w: 40, h: FLOOR },
      { x: 0, y: CEIL_Y, w: 140, h: CEIL_H }, { x: 180, y: CEIL_Y, w: 140, h: CEIL_H },
      { x: 360, y: CEIL_Y, w: 140, h: CEIL_H }, { x: 540, y: CEIL_Y, w: 100, h: CEIL_H },
      { x: LEDGE_X, y: LEDGE_Y, w: 80, h: FLOOR - LEDGE_Y },
    ];
    // 데모 스테이션: 틈 오른쪽 모서리 x(rx)에 머리가 clip px 걸리도록
    const STATIONS = [
      { kind: 'gap', rx: 180, clip: 3 }, { kind: 'gap', rx: 360, clip: 6 }, { kind: 'gap', rx: 540, clip: 11 },
      { kind: 'ledge' },
    ];
    const gapCorners = [140, 180, 320, 360, 500, 540];

    let p, acc, idle, pendingPress, prevDemoJump, demoState, endTimer, stats, nudges, results, lastVerdict, station;
    const overlapAt = (x, y, s) => x < s.x + s.w && x + PW > s.x && y < s.y + s.h && y + PH > s.y;
    const free = (x, y) => !solids.some((s) => overlapAt(x, y, s));

    function resetEpisode(manual) {
      const st = STATIONS[station];
      let x = 40;
      if (!manual) x = st.kind === 'gap' ? st.rx - PW + st.clip : 400;
      p = { x, y: FLOOR - PH, vx: 0, vy: 0, grounded: true, jumped: false, airT: 0 };
      demoState = { t: 0, holdT: 0, jumpedOnce: false };
      prevDemoJump = false; pendingPress = false; endTimer = -1;
    }
    function init() {
      acc = 0; idle = 99; station = 0; stats = { ok: 0, bonk: 0, fix: 0, lastFix: 0 };
      nudges = []; results = STATIONS.map(() => []); lastVerdict = '-';
      resetEpisode(false);
    }
    init();

    function demoInput() {
      const st = STATIONS[station];
      demoState.t += STEP;
      let jump = false, right = false;
      if (st.kind === 'gap') {
        if (!demoState.jumpedOnce && demoState.t > 0.25) { demoState.jumpedOnce = true; demoState.holdT = 0.45; }
        if (p.y + PH < CEIL_Y - 2) right = true;
      } else {
        right = endTimer < 0;
        if (!demoState.jumpedOnce && p.grounded && p.x >= LEDGE_X - PW - 63) { demoState.jumpedOnce = true; demoState.holdT = 0.05; }
      }
      if (demoState.holdT > 0) { demoState.holdT -= STEP; jump = true; }
      const pressed = jump && !prevDemoJump;
      prevDemoJump = jump;
      return { left: false, right, jump, jumpPressed: pressed, hop: st.kind === 'ledge' };
    }

    function finish(ok, msg) {
      if (endTimer >= 0) return;
      endTimer = 0.7; lastVerdict = msg;
      if (ok) stats.ok++;
      const r = results[station]; r.push(ok); if (r.length > 5) r.shift();
    }

    function step(inp, demo) {
      const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      p.vx = U.approach(p.vx, dir * RUN, (p.grounded ? 3000 : 2400) * STEP);
      if (inp.jumpPressed && p.grounded) { p.vy = -(inp.hop ? HOP_V : JUMP_V); p.grounded = false; p.jumped = true; }
      if (!inp.jump && p.vy < 0 && !inp.hop) p.vy += GRAV * 2 * STEP;
      p.vy = Math.min(p.vy + GRAV * STEP, 900);
      // X 이동 (+ 가장자리 보정)
      p.x += p.vx * STEP;
      for (const s of solids) if (overlapAt(p.x, p.y, s)) {
        const lift = p.y + PH - s.y;
        if (P.ledge && !p.grounded && p.vx !== 0 && lift > 0 && lift <= P.ledgePx && free(p.x, s.y - PH)) {
          nudges.push({ x: p.x + PW / 2, y: p.y + PH, dx: 0, dy: -lift, life: 1.2 });
          p.y = s.y - PH; p.vy = Math.min(p.vy, 0);
          stats.fix++; stats.lastFix = lift;
          continue;
        }
        p.x = p.vx > 0 ? s.x - PW : s.x + s.w; p.vx = 0;
      }
      // Y 이동 (+ 코너 보정)
      p.y += p.vy * STEP;
      p.grounded = false;
      for (const s of solids) if (overlapAt(p.x, p.y, s)) {
        if (p.vy < 0 && P.corner) {
          let done = false;
          for (let i = 1; i <= P.cornerPx && !done; i++) {
            for (const sg of [-1, 1]) {
              if (free(p.x + sg * i, p.y)) {
                nudges.push({ x: p.x + PW / 2, y: p.y, dx: sg * i, dy: 0, life: 1.2 });
                p.x += sg * i; stats.fix++; stats.lastFix = i; done = true; break;
              }
            }
          }
          if (done) continue;
        }
        if (p.vy > 0) { p.y = s.y - PH; p.grounded = true; }
        else {
          p.y = s.y + s.h;
          if (demo) lastVerdict = GTL.L('✗ 쿵! 모서리에 머리를 박음', '✗ Bonk! Head hit the corner');
          stats.bonk++;
          nudges.push({ x: p.x + PW / 2, y: p.y, bonk: true, life: 1.2 });
        }
        p.vy = 0;
      }
      if (!p.grounded) p.airT += STEP;
      for (const n of nudges) n.life -= STEP;
      while (nudges.length && nudges[0].life <= 0) nudges.shift();
      if (!demo) return;
      // 에피소드 판정
      const st = STATIONS[station];
      if (endTimer < 0 && p.jumped && p.grounded && p.airT > 0.05) {
        if (st.kind === 'gap') {
          if (p.y + PH <= CEIL_Y + 1) finish(true, GTL.L('✓ 틈 통과', '✓ Passed the gap'));
          else finish(false, lastVerdict[0] === '✗' ? lastVerdict : GTL.L('✗ 실패', '✗ Failed'));
        } else {
          if (Math.abs(p.y + PH - LEDGE_Y) < 1) finish(true, GTL.L('✓ 턱 위로 올라섬', '✓ Stepped up onto the ledge'));
          else finish(false, GTL.L('✗ 턱에 걸려 미끄러짐', '✗ Caught on the ledge and slid down'));
        }
      } else if (endTimer >= 0) {
        endTimer -= STEP;
        if (endTimer <= 0) { station = (station + 1) % STATIONS.length; resetEpisode(false); }
      }
      if (p.grounded) p.airT = 0;
    }

    return {
      update(dt) {
        const kb = ctx.input;
        const manual = { left: KEYS.left.some(kb.key), right: KEYS.right.some(kb.key), jump: KEYS.jump.some(kb.key), jumpPressed: KEYS.jump.some(kb.pressed) };
        const touched = ALL.some(kb.key) || manual.jumpPressed;
        const wasDemo = P.demo && idle > 2.5;
        idle = touched ? 0 : idle + dt;
        const demo = P.demo && idle > 2.5;
        if (demo && !wasDemo) { station = 0; resetEpisode(false); }
        if (!demo && wasDemo) resetEpisode(true);
        if (!demo && manual.jumpPressed) pendingPress = true;
        acc += dt;
        while (acc >= STEP) {
          acc -= STEP;
          let inp;
          if (demo) inp = demoInput();
          else { inp = { ...manual, jumpPressed: pendingPress }; pendingPress = false; }
          step(inp, demo);
          if (p.grounded) p.airT = 0;
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const sc = Math.min(W / WW, H / WH), ox = (W - WW * sc) / 2, oy = (H - WH * sc) / 2;
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        D.grid(g, WW, WH, 40);
        for (const s of solids) {
          D.rect(g, s.x, s.y, s.w, s.h, '#2a2f38');
          D.rect(g, s.x, s.y, s.w, 2, '#4a5260');
        }
        // 용서 구간
        if (P.showZones) {
          g.globalAlpha = 0.45;
          if (P.corner) for (const cx of gapCorners) {
            const left = [140, 320, 500].includes(cx); // 틈의 왼쪽 모서리 = 블록 오른쪽 끝
            D.rect(g, left ? cx - P.cornerPx : cx, CEIL_Y + CEIL_H - 3, P.cornerPx, 6, col);
          }
          if (P.ledge) D.rect(g, LEDGE_X - 3, LEDGE_Y, 6, P.ledgePx, col);
          g.globalAlpha = 1;
        }
        // 스테이션 결과
        STATIONS.forEach((st, i) => {
          const x = st.kind === 'gap' ? st.rx - 20 : LEDGE_X + 40;
          const y = st.kind === 'gap' ? CEIL_Y - 30 : LEDGE_Y + 12;
          D.text(g, st.kind === 'gap' ? `${st.clip}px` : GTL.L('턱', 'Ledge'), x, y, { size: 10, align: 'center', color: i === station && P.demo && idle > 2.5 ? C.text : C.dim });
          const r = results[i];
          D.text(g, r.map((ok) => (ok ? '✓' : '✗')).join(''), x, y + 12, { size: 10, align: 'center', color: r.length && r[r.length - 1] ? C.good : C.bad });
        });
        // 보정/충돌 표시
        for (const n of nudges) {
          g.globalAlpha = U.clamp(n.life, 0, 1);
          if (n.bonk) {
            D.text(g, GTL.L('쿵!', 'Bonk!'), n.x, n.y + 2, { size: 13, color: C.bad, align: 'center' });
          } else {
            const len = 18;
            const ex = n.x + Math.sign(n.dx) * len, ey = n.y + Math.sign(n.dy) * len;
            D.arrow(g, n.x, n.y, ex, ey, C.good, 2, 6);
            D.text(g, `${Math.abs(n.dx || n.dy).toFixed(0)}px`, ex + (n.dx ? Math.sign(n.dx) * 4 : 6), ey - 6, { size: 10, color: C.good, align: n.dx < 0 ? 'right' : 'left' });
          }
          g.globalAlpha = 1;
        }
        D.rect(g, p.x, p.y, PW, PH, col);
        D.rect(g, p.x + (p.vx >= 0 ? 11 : 3), p.y + 6, 4, 4, '#14161a');
        D.text(g, lastVerdict, 12, 12, { size: 13, color: lastVerdict[0] === '✗' ? C.bad : lastVerdict[0] === '✓' ? C.good : C.dim });
        if (P.demo && idle <= 2.5) D.text(g, GTL.L('수동 조작 중', 'Manual control'), WW - 12, 12, { size: 11, color: C.warn, align: 'right' });
        g.restore();
        ctx.stat(GTL.L('성공 / 쿵(bonk)', 'Success / bonk'), `${stats.ok} / ${stats.bonk}`);
        ctx.stat(GTL.L('보정 횟수', 'Corrections'), `${stats.fix}${stats.fix ? GTL.L(` (마지막 ${stats.lastFix.toFixed(1)}px)`, ` (last ${stats.lastFix.toFixed(1)}px)`) : ''}`);
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
