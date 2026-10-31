// 넉백 & 무적 프레임: 접촉 피해가 매 프레임 들어가는 문제를 해결
GTL.register({
  id: 'knockback-iframes',
  title: '넉백 & 무적 프레임',
  summary: '적과 겹친 동안 매 프레임 피해를 주면 체력이 순식간에 녹음. 피격 후 잠깐의 무적(i-frame)과 넉백으로 "한 번 맞음"을 분명히 하고, 깜빡임과 플래시로 상태를 보여 줌.',
  views: { a: '넉백, 무적 없음', b: '넉백 + 무적 1초 + 깜빡임' },
  controls: '←→↑↓ / WASD 이동 (키를 누르면 자동 데모가 잠시 멈춤)',
  info: `
    <p>충돌 판정은 매 프레임 일어남. 아무 처리 없이 <code>if (overlap) hp -= dmg</code>를 쓰면
    적과 0.3초만 겹쳐도 60fps에서 18번 맞음. 피해량이 <b>접촉 시간과 프레임레이트</b>에 좌우되고, 플레이어는 무엇에 몇 번 맞았는지 알 수 없음.</p>
    <ul>
      <li><b>무적 프레임(invincibility frames)</b>: 피격 후 일정 시간 추가 피해를 무시. 고전 액션 게임(메가맨 등)부터 써 온 표준 해법.</li>
      <li><b>넉백</b>: 위험원 반대 방향으로 밀어냄. 겹친 상태를 빨리 풀고, 맞았다는 사실을 몸으로 전달. 짧은 <b>경직(hitstun)</b> 동안은 입력을 무시.</li>
      <li><b>깜빡임</b>: 무적 상태를 알려 주는 시각 신호. <b>히트 플래시</b>는 피격 순간을 강조.</li>
    </ul>
    <p>단점: 무적 시간이 너무 길면 위험원을 무시하고 돌파하는 전략이 생김. 게임 템포에 맞게 조절해야 함.</p>`,
  // 도식: 겹친 시간과 피해 판정 타임라인. A는 매 프레임 피해, B는 1회 피해 뒤 무적 구간
  diagram: (L) => `<svg viewBox="0 0 540 160" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <rect x="110" y="5" width="16" height="9" class="f-dim"/>
    <text x="130" y="13" class="t-small">${L('적과 겹친 시간', 'overlap with enemy')}</text>
    <line x1="260" y1="4" x2="260" y2="14" class="d-bad"/>
    <text x="266" y="13" class="t-small">${L('피해 판정', 'damage applied')}</text>
    <text x="4" y="40" class="t-a">A</text>
    <text x="4" y="52" class="t-small t-dim">${L('무적 없음', 'no i-frames')}</text>
    <rect x="144" y="30" width="102" height="10" class="f-dim"/>
    ${Array.from({ length: 18 }, (_, i) => `<line x1="${(144 + i * 5.68).toFixed(1)}" y1="44" x2="${(144 + i * 5.68).toFixed(1)}" y2="54" class="d-bad" stroke-width="1.2"/>`).join('')}
    <text x="256" y="53" class="t-small t-a">${L('0.3초 동안 피해 18회 (60fps)', '18 hits in 0.3 s (60fps)')}</text>
    <text x="4" y="88" class="t-b">B</text>
    <text x="4" y="100" class="t-small t-dim">${L('무적 + 넉백', 'with i-frames')}</text>
    <rect x="144" y="78" width="17" height="10" class="f-dim"/>
    <line x1="144" y1="92" x2="144" y2="102" class="d-bad"/>
    ${Array.from({ length: 19 }, (_, i) => `<rect x="${150 + i * 18}" y="93" width="11" height="8" class="f-b"/>`).join('')}
    <path d="M166,83 L206,83" class="d-accent" marker-end="url(#arr)"/>
    <text x="212" y="86" class="t-small">${L('넉백으로 겹침이 풀림', 'knockback ends the overlap')}</text>
    <text x="150" y="114" class="t-small t-b">${L('무적 1초 (깜빡임), 추가 피해 무시', 'i-frames 1 s (blinking), extra damage ignored')}</text>
    <line x1="110" y1="124" x2="520" y2="124" class="d-dim"/>
    ${[[110, '0'], [280.5, '0.5s'], [451, '1s']].map(([x, t]) => `<line x1="${x}" y1="121" x2="${x}" y2="127" class="d-dim"/><text x="${x}" y="137" text-anchor="middle" class="t-small t-mono t-dim">${t}</text>`).join('')}
    <text x="4" y="154" class="t-small t-dim">${L('B는 접촉 시간, 프레임레이트와 상관없이 1회만 맞음', 'B takes exactly one hit, whatever the contact time or frame rate')}</text>
  </svg>`,
  look: [
    '자동 데모를 켜 두면 두 뷰가 같은 경로로 적과 가시밭을 지나감. A는 접촉 한 번에 수십 번 피해를 받아 금방 사망.',
    '"접촉 1회당 피해" 통계를 보면 A는 접촉 시간에 비례하고, B는 항상 1회분',
    'B에서 넉백만 0으로 두면 무적 시간 동안 가시밭을 그대로 통과. 무적이 끝나는 순간 다시 맞음.',
    'B에서 무적 시간을 0으로 두고 넉백만 남기면 적에게 연속으로 튕기며 핀볼처럼 맞음',
  ],
  refs: [
    { type: 'game', title: 'Mega Man (Capcom)', year: 1987, note: '피격 시 넉백 + 깜빡이는 무적 시간의 고전적 사례' },
    { type: 'book', title: 'Game Feel: A Game Designer\'s Guide to Virtual Sensation (Steve Swink)', year: 2008 },
    { type: 'talk', title: 'The Art of Screenshake (Jan Willem Nijman, Vlambeer)', year: 2013, note: 'INDIGO 2013. 넉백, 피격 피드백 등 타격감 기법.' },
  ],
  params: [
    { key: 'iframes', label: '무적 시간 (ms)', type: 'range', min: 0, max: 2000, step: 50, a: 0, b: 1000, group: '기법', help: '0이면 겹친 동안 매 프레임 피해' },
    { key: 'knock', label: '넉백 세기 (px/s)', type: 'range', min: 0, max: 700, step: 10, a: 0, b: 340 },
    { key: 'stun', label: '경직 (ms)', type: 'range', min: 0, max: 400, step: 10, default: 150, when: (p) => p.knock > 0, help: '넉백 중 입력 무시 시간' },
    { key: 'blink', label: '무적 깜빡임', type: 'bool', a: false, b: true },
    { key: 'flash', label: '히트 플래시', type: 'bool', a: false, b: true },
    { key: 'dmg', label: '피해량 (1회)', type: 'int', min: 1, max: 25, default: 5, shared: true, group: '장면' },
    { key: 'demo', label: '자동 데모', type: 'bool', default: true, shared: true },
    { key: 'restart', label: '처음부터', type: 'button', buttonLabel: '다시 시작' },
  ],
  en: {
    title: 'Knockback & Invincibility Frames',
    summary: 'If you deal damage every frame while overlapping an enemy, health melts in an instant. A short invincibility (i-frame) and knockback after a hit make "one hit" clear. Blinking and a flash show the state.',
    views: { a: 'No knockback, no i-frames', b: 'Knockback + 1 s i-frames + blink' },
    controls: '←→↑↓ / WASD to move (pressing a key pauses the auto demo for a moment)',
    info: `
    <p>Collision checks run every frame. If you just write <code>if (overlap) hp -= dmg</code>,
    overlapping an enemy for only 0.3 s means 18 hits at 60fps. Damage then depends on <b>contact time and frame rate</b>, and the player cannot tell what hit them or how many times.</p>
    <ul>
      <li><b>Invincibility frames</b>: ignore further damage for a set time after a hit. This is the standard fix, used since classic action games (Mega Man and others).</li>
      <li><b>Knockback</b>: push the player away from the danger. It ends the overlap quickly and makes the hit felt. During a short <b>hitstun</b>, input is ignored.</li>
      <li><b>Blinking</b>: a visual signal for the invincible state. A <b>hit flash</b> stresses the moment of the hit.</li>
    </ul>
    <p>Downside: if invincibility lasts too long, players can ignore danger and push through. Tune it to the pace of the game.</p>`,
    look: [
      'With the auto demo on, both views take the same path through an enemy and a spike field. A takes dozens of hits per contact and dies quickly.',
      'Look at the "Damage per contact" stat. In A it grows with contact time. In B it is always one hit.',
      'In B, set only knockback to 0. The player walks right through the spikes during the i-frames, and gets hit again the moment they end.',
      'In B, set the i-frame time to 0 and keep only knockback. The player bounces off the enemy again and again, like a pinball.',
    ],
    refs: [
      'A classic example of knockback plus blinking invincibility on a hit.',
      null,
      'INDIGO 2013. Impact techniques such as knockback and hit feedback.',
    ],
    params: {
      iframes: { label: 'Invincibility time (ms)', group: 'Technique', help: 'At 0, damage every frame while overlapping' },
      knock: 'Knockback strength (px/s)',
      stun: { label: 'Hitstun (ms)', help: 'Time input is ignored during knockback' },
      blink: 'Invincibility blink',
      flash: 'Hit flash',
      dmg: { label: 'Damage (per hit)', group: 'Scene' },
      demo: 'Auto demo',
      restart: { label: 'Start over', buttonLabel: 'Restart' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WW = 640, WH = 360, STEP = 1 / 60, PR = 12, ER = 15, SPEED = 150;
    const col = ctx.side === 'a' ? C.a : C.b;
    const MOVE = { l: ['ArrowLeft', 'KeyA'], r: ['ArrowRight', 'KeyD'], u: ['ArrowUp', 'KeyW'], d: ['ArrowDown', 'KeyS'] };
    const ALL = [...MOVE.l, ...MOVE.r, ...MOVE.u, ...MOVE.d];
    const SPIKES = { x: 290, y: 240, w: 100, h: 60 };
    const WAYPOINTS = [[80, 70], [560, 70], [560, 200], [460, 230], [340, 270], [200, 300], [80, 300], [200, 180]];

    let pl, t, acc, idle, wp, invuln, stun, flash, kv, contacts, hits, totalDmg, deaths, wasTouching, nums, hpHist, deathFlash;
    function init() {
      t = 0; acc = 0; idle = 99; wp = 0;
      pl = { x: 80, y: 300, hp: 100 };
      invuln = 0; stun = 0; flash = 0; kv = { x: 0, y: 0 };
      contacts = 0; hits = 0; totalDmg = 0; deaths = 0; wasTouching = false; nums = []; hpHist = []; deathFlash = 0;
    }
    init();

    const enemies = () => [
      { x: 320 + 210 * Math.sin(t * 0.9), y: 70 },
      { x: 200, y: 190 + 110 * Math.sin(t * 1.3 + 1) },
      { x: 470 + 70 * Math.cos(t * 1.6), y: 225 + 70 * Math.sin(t * 1.6) },
    ];

    function demoDir() {
      const [tx, ty] = WAYPOINTS[wp];
      const dx = tx - pl.x, dy = ty - pl.y, d = Math.hypot(dx, dy);
      if (d < 14) { wp = (wp + 1) % WAYPOINTS.length; return { x: 0, y: 0 }; }
      return { x: dx / d, y: dy / d };
    }

    function hazardHit() {
      // 가장 가까운 위험원과 밀어낼 방향
      let src = null;
      for (const e of enemies()) if (Math.hypot(e.x - pl.x, e.y - pl.y) < PR + ER) src = e;
      const cx = U.clamp(pl.x, SPIKES.x, SPIKES.x + SPIKES.w), cy = U.clamp(pl.y, SPIKES.y, SPIKES.y + SPIKES.h);
      if (!src && Math.hypot(cx - pl.x, cy - pl.y) < PR) src = { x: SPIKES.x + SPIKES.w / 2, y: SPIKES.y + SPIKES.h / 2 };
      return src;
    }

    function step(inDir) {
      t += STEP;
      let dir = inDir;
      if (stun > 0) { stun -= STEP; dir = { x: 0, y: 0 }; }
      const len = Math.hypot(dir.x, dir.y) || 1;
      pl.x += ((dir.x / len) * SPEED + kv.x) * STEP;
      pl.y += ((dir.y / len) * SPEED + kv.y) * STEP;
      const k = Math.exp(-7 * STEP); kv.x *= k; kv.y *= k;
      pl.x = U.clamp(pl.x, PR + 6, WW - PR - 6); pl.y = U.clamp(pl.y, PR + 6, WH - PR - 6);
      invuln = Math.max(0, invuln - STEP);
      flash = Math.max(0, flash - STEP);
      deathFlash = Math.max(0, deathFlash - STEP);
      const src = hazardHit();
      if (src && !wasTouching) contacts++;
      wasTouching = !!src;
      if (src && invuln <= 0) {
        pl.hp -= P.dmg; hits++; totalDmg += P.dmg;
        invuln = P.iframes / 1000;
        if (P.flash) flash = 0.09;
        if (P.knock > 0) {
          let ax = pl.x - src.x, ay = pl.y - src.y;
          const l = Math.hypot(ax, ay) || 1;
          kv = { x: (ax / l) * P.knock, y: (ay / l) * P.knock };
          stun = P.stun / 1000;
        }
        nums.push({ x: pl.x + (hits % 5) * 3 - 6, y: pl.y - 18, v: P.dmg, life: 0.8 });
        if (nums.length > 40) nums.shift();
        if (pl.hp <= 0) { deaths++; pl.hp = 100; deathFlash = 0.4; }
      }
      for (const n of nums) { n.life -= STEP; n.y -= 40 * STEP; }
      nums = nums.filter((n) => n.life > 0);
      hpHist.push(pl.hp);
      if (hpHist.length > 300) hpHist.shift();
    }

    return {
      update(dt) {
        const kb = ctx.input;
        const md = { x: (MOVE.r.some(kb.key) ? 1 : 0) - (MOVE.l.some(kb.key) ? 1 : 0), y: (MOVE.d.some(kb.key) ? 1 : 0) - (MOVE.u.some(kb.key) ? 1 : 0) };
        idle = ALL.some(kb.key) ? 0 : idle + dt;
        const demo = P.demo && idle > 2.5;
        acc += dt;
        while (acc >= STEP) { acc -= STEP; step(demo ? demoDir() : md); }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const sc = Math.min(W / WW, H / WH), ox = (W - WW * sc) / 2, oy = (H - WH * sc) / 2;
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        D.grid(g, WW, WH, 40);
        D.rect(g, 3, 3, WW - 6, WH - 6, null, '#3a414d', 3);
        // 가시밭
        D.rect(g, SPIKES.x, SPIKES.y, SPIKES.w, SPIKES.h, 'rgba(255,83,112,0.12)', C.bad, 1);
        for (let x = SPIKES.x + 6; x < SPIKES.x + SPIKES.w; x += 14) for (let y = SPIKES.y + 10; y < SPIKES.y + SPIKES.h; y += 16) {
          D.poly(g, [{ x: x - 5, y: y + 5 }, { x: x + 5, y: y + 5 }, { x, y: y - 6 }], 'rgba(255,83,112,0.6)');
        }
        // 데모 경로
        if (P.demo && idle > 2.5) {
          g.setLineDash([3, 6]);
          D.poly(g, WAYPOINTS.map(([x, y]) => ({ x, y })), null, 'rgba(255,255,255,0.12)', 1, true);
          g.setLineDash([]);
        }
        for (const e of enemies()) {
          D.rect(g, e.x - ER, e.y - ER, ER * 2, ER * 2, '#8b3a4a', C.bad, 2);
          D.rect(g, e.x - 7, e.y - 4, 4, 4, '#fff'); D.rect(g, e.x + 3, e.y - 4, 4, 4, '#fff');
        }
        // 플레이어
        let alpha = 1;
        if (invuln > 0 && P.blink) alpha = Math.floor(invuln / 0.06) % 2 ? 0.25 : 1;
        g.globalAlpha = alpha;
        D.circle(g, pl.x, pl.y, PR, flash > 0 ? '#ffffff' : col, '#fff', 1.5);
        g.globalAlpha = 1;
        if (invuln > 0 && P.iframes > 0) {
          g.beginPath(); g.arc(pl.x, pl.y, PR + 6, -Math.PI / 2, -Math.PI / 2 + U.TAU * (invuln / (P.iframes / 1000)));
          g.strokeStyle = C.good; g.lineWidth = 2; g.stroke();
        }
        if (Math.hypot(kv.x, kv.y) > 20) D.arrow(g, pl.x, pl.y, pl.x + kv.x * 0.15, pl.y + kv.y * 0.15, C.warn, 2);
        for (const n of nums) D.text(g, '-' + n.v, n.x, n.y, { size: 12, color: `rgba(255,120,140,${Math.min(1, n.life * 2)})`, align: 'center' });
        // HUD
        D.rect(g, 12, 12, 160, 12, 'rgba(0,0,0,0.5)');
        D.rect(g, 12, 12, 1.6 * Math.max(0, pl.hp), 12, pl.hp > 30 ? C.good : C.bad);
        D.text(g, `HP ${Math.max(0, pl.hp)}`, 178, 12, { size: 11 });
        D.plot(g, hpHist, 12, 30, 160, 30, { min: 0, max: 100, color: col, label: GTL.L('HP (5초)', 'HP (5 s)') });
        if (deathFlash > 0) D.text(g, GTL.L('사망!', 'Dead!'), WW / 2, WH / 2 - 20, { size: 30, color: `rgba(255,83,112,${deathFlash / 0.4})`, align: 'center' });
        if (P.demo && idle <= 2.5) D.text(g, GTL.L('수동 조작 중', 'Manual control'), WW - 12, 12, { size: 11, color: C.warn, align: 'right' });
        g.restore();
        ctx.stat(GTL.L('피격 횟수 / 접촉 횟수', 'Hits / contacts'), `${hits} / ${contacts}`);
        ctx.stat(GTL.L('접촉 1회당 피해', 'Damage per contact'), contacts ? (totalDmg / contacts).toFixed(1) : '-');
        ctx.stat(GTL.L('사망', 'Deaths'), deaths);
        ctx.stat(GTL.L('무적 남음', 'Invincibility left'), invuln > 0 ? (invuln * 1000).toFixed(0) + ' ms' : '-');
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
