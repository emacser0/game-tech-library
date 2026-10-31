// 점프 파라미터 설계: 중력, 초기 속도 직접 지정 vs 높이, 정점 시간으로 역산
GTL.register({
  id: 'jump-arc-design',
  title: '점프 파라미터 설계 (높이, 정점 시간 역산)',
  summary: '중력과 초기 속도를 직접 고르면 하나만 바꿔도 점프 높이가 바뀜. 높이 H와 정점 시간 T를 정하고 g = 2H/T², v0 = 2H/T로 역산하면 느낌(속도)을 바꿔도 높이가 그대로임.',
  views: { a: 'g, v0 직접 지정', b: 'H, T에서 역산' },
  controls: '조작 없음. 캐릭터가 자동으로 점프를 반복함.',
  info: `
    <p><b>점프 파라미터 역산</b>은 디자이너가 원하는 결과(높이, 시간)를 먼저 정하고 물리 값(중력, 초기 속도)을 계산하는 방법.</p>
    <p>중력 <code>g</code>와 초기 속도 <code>v0</code>를 직접 고르면 결과가 두 값에 함께 묶임.</p>
    <ul>
      <li>최고 높이 <code>H = v0² / (2g)</code></li>
      <li>정점 도달 시간 <code>T = v0 / g</code></li>
    </ul>
    <p>그래서 "점프를 더 빠르게" 하려고 중력을 올리면 높이도 같이 줄어듦. 레벨의 발판 높이와 맞추려면 두 값을 번갈아 다시 맞춰야 함.</p>
    <p>역산 방식은 위 식을 뒤집음.</p>
    <ul>
      <li><code>g = 2H / T²</code></li>
      <li><code>v0 = 2H / T</code></li>
      <li>수평 거리 D와 이동 속도 vx로 정할 수도 있음. <code>T = D / (2vx)</code></li>
    </ul>
    <p>높이는 레벨 디자인이, 정점 시간은 조작감이 정함. 두 값이 서로 영향을 주지 않음.</p>
    <p>주의: 위 식은 연속 시간 기준. 이 샘플은 등가속도 정확해 <code>y += v*dt + ½a*dt²</code>로 적분해서 측정값이 식과 맞음. 흔한 <code>v += a*dt; y += v*dt</code>는 <code>v0*dt/2</code>만큼 낮게 뜸.</p>
    <p>단점: 중력이 점프마다 달라 보일 수 있음. 다른 물체와 같은 중력을 써야 하면 캐릭터 전용 중력으로 분리해야 함.</p>
    <p>흐린 곡선 3개는 민감도. A는 v0를 고정하고 g를 ×0.75, ×1, ×1.25로 바꾼 궤적. B는 H를 고정하고 T를 같은 비율로 바꾼 궤적.</p>`,
  // 도식: 점프 포물선의 H와 T. A는 g, v0가 입력이고 H, T가 결과. B는 H, T가 입력이고 g, v0를 역산
  diagram: (L) => `<svg viewBox="0 0 540 180" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr-ja" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <line x1="10" y1="150" x2="250" y2="150" class="d-dim"/>
    <path d="M20,150 Q130,-70 240,150" class="d-line"/>
    <path d="M130,150 L130,42" class="d-accent" marker-start="url(#arr-ja)" marker-end="url(#arr-ja)"/>
    <text x="136" y="100" class="t-mono">H</text>
    <path d="M20,164 L130,164" class="d-accent" marker-start="url(#arr-ja)" marker-end="url(#arr-ja)"/>
    <text x="75" y="160" text-anchor="middle" class="t-mono">T</text>
    <text x="10" y="30" class="t-small t-dim">${L('정점 높이 H, 정점 시간 T', 'Apex height H, time to apex T')}</text>
    <text x="280" y="22" class="t-a">${L('A: g, v0를 직접 고름', 'A: pick g and v0')}</text>
    <rect x="280" y="32" width="70" height="22" class="f-dim"/><text x="315" y="47" text-anchor="middle" class="t-mono">g, v0</text>
    <path d="M354,43 L376,43" class="d-line" marker-end="url(#arr-ja)"/>
    <text x="382" y="40" class="t-small t-mono">H = v0² / (2g)</text>
    <text x="382" y="53" class="t-small t-mono">T = v0 / g</text>
    <text x="280" y="72" class="t-small t-dim">${L('g만 올려도 H가 같이 줄어듦', 'Raising g also lowers H')}</text>
    <text x="280" y="102" class="t-b">${L('B: H, T를 정하고 역산', 'B: set H and T, solve')}</text>
    <rect x="280" y="112" width="70" height="22" class="f-dim"/><text x="315" y="127" text-anchor="middle" class="t-mono">H, T</text>
    <path d="M354,123 L376,123" class="d-line" marker-end="url(#arr-ja)"/>
    <text x="382" y="120" class="t-small t-mono">g = 2H / T²</text>
    <text x="382" y="133" class="t-small t-mono">v0 = 2H / T</text>
    <text x="280" y="152" class="t-small t-dim">${L('T만 바꾸면 느낌만 바뀌고 H는 그대로', 'Changing T changes the feel, H stays')}</text>
  </svg>`,
  look: [
    '시작하면 A는 최고 높이 127px로 초록 목표선(150px)에 못 닿음. B는 170px로 넘음.',
    'A의 중력을 3000으로 올려 점프를 빠르게 하면 최고 높이가 101px로 더 줄어듦. 민감도 곡선 3개의 높이도 제각각임.',
    'B의 정점 시간을 0.25초로 줄이면 점프가 빨라지지만 높이는 170px 그대로임. 민감도 곡선 3개가 같은 높이에서 꺾임.',
    '목표 높이를 바꾸고 B의 높이 H만 그 값보다 조금 크게 맞추면 바로 통과함. A는 g와 v0를 함께 다시 찾아야 함.',
  ],
  refs: [
    { type: 'talk', title: 'Math for Game Programmers: Building a Better Jump (Kyle Pittman, GDC 2016)', year: 2016, note: '높이와 수평 거리에서 v0와 g를 역산하는 식.' },
    { type: 'article', title: 'Integration Basics (Glenn Fiedler)', url: 'https://gafferongames.com/post/integration_basics/', year: 2004, note: '적분 방식에 따른 오차.' },
    { type: 'book', title: 'Game Programming Patterns - Game Loop (Robert Nystrom)', url: 'https://gameprogrammingpatterns.com/game-loop.html', year: 2014 },
  ],
  params: [
    { key: 'mode', label: '설계 방식', type: 'select', group: '점프', options: [
      { value: 'direct', label: '중력 g, 초기 속도 v0 직접 지정' },
      { value: 'derived', label: '높이 H, 정점 시간 T에서 역산' },
    ], a: 'direct', b: 'derived', default: 'direct' },
    { key: 'g', label: '중력 g (px/s²)', type: 'range', min: 500, max: 6000, step: 50, default: 2400, when: (p) => p.mode === 'direct' },
    { key: 'v0', label: '초기 속도 v0 (px/s)', type: 'range', min: 200, max: 1500, step: 10, default: 780, when: (p) => p.mode === 'direct' },
    { key: 'H', label: '높이 H (px)', type: 'range', min: 30, max: 300, step: 5, default: 170, when: (p) => p.mode === 'derived' },
    { key: 'T', label: '정점 시간 T (초)', type: 'range', min: 0.15, max: 0.8, step: 0.01, default: 0.38, when: (p) => p.mode === 'derived' },
    { key: 'target', label: '목표 높이 (px)', type: 'range', min: 40, max: 280, step: 5, default: 150, shared: true, group: '장면' },
    { key: 'vx', label: '수평 속도 (px/s)', type: 'range', min: 50, max: 400, step: 10, default: 200, shared: true },
    { key: 'fan', label: '민감도 곡선', type: 'bool', default: true, shared: true, help: 'A는 g를, B는 T를 ×0.75, ×1, ×1.25로 바꾼 궤적' },
  ],
  en: {
    title: 'Jump Parameter Design (Solve from Height and Apex Time)',
    summary: 'If you pick gravity and initial speed directly, changing one also changes the jump height. Set height H and apex time T, then solve g = 2H/T² and v0 = 2H/T. Now you can change the feel (speed) and the height stays the same.',
    views: { a: 'Set g, v0 directly', b: 'Solve from H, T' },
    controls: 'No input. The character jumps on its own.',
    info: `
    <p><b>Solving jump parameters</b> means the designer first sets the result they want (height, time). Then you compute the physics values (gravity, initial speed).</p>
    <p>If you pick gravity <code>g</code> and initial speed <code>v0</code> directly, the result depends on both values together.</p>
    <ul>
      <li>Peak height <code>H = v0² / (2g)</code></li>
      <li>Time to apex <code>T = v0 / g</code></li>
    </ul>
    <p>So if you raise gravity to make the jump "faster", the height drops too. To match the platform heights in a level, you must keep adjusting both values in turn.</p>
    <p>The solved approach flips these formulas.</p>
    <ul>
      <li><code>g = 2H / T²</code></li>
      <li><code>v0 = 2H / T</code></li>
      <li>You can also set it from horizontal distance D and move speed vx: <code>T = D / (2vx)</code></li>
    </ul>
    <p>Level design sets the height, and game feel sets the apex time. The two values do not affect each other.</p>
    <p>Note: these formulas assume continuous time. This sample integrates with the exact constant-acceleration solution <code>y += v*dt + ½a*dt²</code>, so the measured values match the formulas. The common <code>v += a*dt; y += v*dt</code> jumps lower by <code>v0*dt/2</code>.</p>
    <p>Downside: gravity can look different for each jump. If the character must share gravity with other objects, give the character its own gravity.</p>
    <p>The 3 faint curves show sensitivity. In A, v0 stays fixed and g changes by ×0.75, ×1, ×1.25. In B, H stays fixed and T changes by the same ratios.</p>`,
    look: [
      'At the start, A peaks at 127 px and misses the green target line (150 px). B reaches 170 px and clears it.',
      'Raise A\'s gravity to 3000 to make the jump faster. The peak height drops further, to 101 px. The 3 sensitivity curves all reach different heights.',
      'Lower B\'s apex time to 0.25 s. The jump gets faster, but the height stays at 170 px. The 3 sensitivity curves turn at the same height.',
      'Change the target height, then set only B\'s height H a little above it. B clears it right away. A needs a new search for both g and v0.',
    ],
    refs: ['Formulas that solve v0 and g from height and horizontal distance.', 'Error from different integration methods.', null],
    params: {
      mode: { label: 'Design method', group: 'Jump', options: { direct: 'Set gravity g, initial speed v0 directly', derived: 'Solve from height H, apex time T' } },
      g: 'Gravity g (px/s²)',
      v0: 'Initial speed v0 (px/s)',
      H: 'Height H (px)',
      T: 'Apex time T (s)',
      target: { label: 'Target height (px)', group: 'Scene' },
      vx: 'Horizontal speed (px/s)',
      fan: { label: 'Sensitivity curves', help: 'Paths with g (A) or T (B) scaled by ×0.75, ×1, ×1.25' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const LW = 600, LH = 400, GROUND = 370, X0 = 40, BW = 18, BH = 26;
    let x, y, vy, t, air, peak, peakT, lastPeak = null, lastPeakT = null, lastAir = null, wait, trail;

    // 현재 뷰 설정에서 g, v0 계산
    const jumpParams = () => {
      if (P.mode === 'derived') return { g: (2 * P.H) / (P.T * P.T), v0: (2 * P.H) / P.T };
      return { g: P.g, v0: P.v0 };
    };
    const start = () => {
      const jp = jumpParams();
      x = X0; y = 0; vy = jp.v0; t = 0; air = true; peak = 0; peakT = 0; wait = 0; trail = [];
    };
    start();

    return {
      update(dt) {
        if (!air) {
          wait -= dt;
          if (wait <= 0) start();
          return;
        }
        const { g } = jumpParams();
        // 등가속도 정확해 (위쪽이 +y)
        y += vy * dt - 0.5 * g * dt * dt;
        vy -= g * dt;
        x += P.vx * dt;
        t += dt;
        if (y > peak) { peak = y; peakT = t; }
        trail.push({ x, y: Math.max(0, y) });
        if (y <= 0) {
          y = 0; air = false; wait = 0.5;
          lastPeak = peak; lastPeakT = peakT; lastAir = t;
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const s = Math.min(W / LW, H / LH), ox = (W - LW * s) / 2, oy = (H - LH * s) / 2;
        const col = ctx.side === 'a' ? C.a : C.b;
        const jp = jumpParams();
        g.save(); g.translate(ox, oy); g.scale(s, s);
        D.grid(g, LW, LH, 40);
        D.rect(g, 0, GROUND, LW, LH - GROUND, '#2a2f3a');
        // 목표 높이선
        const ty = GROUND - P.target;
        g.setLineDash([6, 5]);
        D.line(g, 0, ty, LW, ty, C.good, 1.5);
        g.setLineDash([]);
        D.text(g, GTL.L(`목표 ${P.target.toFixed(0)}px`, `Target ${P.target.toFixed(0)}px`),LW - 6, ty - 15, { size: 11, color: C.good, align: 'right' });
        // 민감도 곡선
        const arc = (gg, v0, color, lw) => {
          const tAir = (2 * v0) / gg, pts = [];
          for (let i = 0; i <= 40; i++) {
            const tt = (tAir * i) / 40;
            pts.push({ x: X0 + BW / 2 + P.vx * tt, y: GROUND - (v0 * tt - 0.5 * gg * tt * tt) });
          }
          D.poly(g, pts, null, color, lw, false);
          const ta = v0 / gg, hx = X0 + BW / 2 + P.vx * ta, hy = GROUND - (v0 * v0) / (2 * gg);
          D.circle(g, hx, hy, 3, color);
        };
        if (P.fan) {
          for (const f of [0.75, 1.25]) {
            if (P.mode === 'derived') { const T2 = P.T * f; arc((2 * P.H) / (T2 * T2), (2 * P.H) / T2, 'rgba(255,255,255,0.25)', 1); }
            else arc(P.g * f, P.v0, 'rgba(255,255,255,0.25)', 1);
          }
        }
        arc(jp.g, jp.v0, 'rgba(255,255,255,0.55)', 1.5);
        // 실제 궤적
        if (trail.length > 1) D.poly(g, trail.map((p) => ({ x: p.x + BW / 2, y: GROUND - p.y })), null, col, 2.5, false);
        // 최고점 표시
        if (peak > 0) {
          const py = GROUND - peak;
          D.line(g, X0 - 20, py, X0 + BW + 20, py, peak >= P.target ? C.good : C.bad, 1.5);
        }
        // 캐릭터
        D.rect(g, x, GROUND - y - BH, BW, BH, col);
        D.rect(g, x + BW - 7, GROUND - y - BH + 6, 4, 4, '#14161a');
        // 높이 눈금
        for (let h = 0; h <= 300; h += 50) {
          D.line(g, 0, GROUND - h, 8, GROUND - h, C.dim, 1);
          D.text(g, String(h), 11, GROUND - h - 6, { size: 9, color: C.dim });
        }
        const formulaH = (jp.v0 * jp.v0) / (2 * jp.g);
        D.text(g, `H = v0²/2g = ${formulaH.toFixed(0)}px   T = v0/g = ${(jp.v0 / jp.g).toFixed(2)}s`, 30, 12, { size: 12, color: C.text });
        g.restore();
        const shownPeak = air ? peak : lastPeak;
        ctx.stat(GTL.L('중력 g', 'Gravity g'), jp.g.toFixed(0) + ' px/s²');
        ctx.stat(GTL.L('초기 속도 v0', 'Initial speed v0'), jp.v0.toFixed(0) + ' px/s');
        ctx.stat(GTL.L('측정 최고 높이', 'Measured peak height'), shownPeak === null ? GTL.L('측정 중', 'Measuring') : shownPeak.toFixed(1) + ' px');
        ctx.stat(GTL.L('공식 높이 v0²/2g', 'Formula height v0²/2g'), formulaH.toFixed(1) + ' px');
        ctx.stat(GTL.L('정점 도달 시간', 'Time to apex'), lastPeakT === null ? (jp.v0 / jp.g * 1000).toFixed(0) + GTL.L(' ms (공식)', ' ms (formula)') : (lastPeakT * 1000).toFixed(0) + ' ms');
        ctx.stat(GTL.L('체공 시간', 'Air time'), lastAir === null ? GTL.L('측정 중', 'Measuring') : (lastAir * 1000).toFixed(0) + ' ms');
        ctx.stat(GTL.L('목표 높이 통과', 'Clears target height'), formulaH >= P.target ? GTL.L('성공', 'Yes') : GTL.L(`실패 (${(P.target - formulaH).toFixed(0)}px 부족)`, `No (${(P.target - formulaH).toFixed(0)}px short)`));
      },
    };
  },
});
