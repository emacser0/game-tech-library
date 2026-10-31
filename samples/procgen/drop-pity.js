// 드롭 확률 보정: 독립 확률 vs PRD vs 셔플 백 vs 천장(pity). 실패 연속 길이 분포를 히스토그램으로 비교
GTL.register({
  id: 'drop-pity',
  title: '드롭 확률 보정: 독립 확률 vs 셔플 백 vs 천장',
  summary: '평균 드롭률이 같은 네 방식의 "연속 실패 길이" 분포 비교. 독립 확률은 운 나쁜 플레이어가 수십 번 연속 실패함. 셔플 백, PRD, 천장은 평균은 지키면서 최악의 경우를 잘라냄.',
  views: { a: '독립 확률', b: '셔플 백' },
  controls: '조작 없음. "기록 지우기"로 처음부터 다시 셈.',
  info: `
    <p><b>문제</b>: 드롭률 10%를 매번 독립으로 굴리면 평균은 10번에 한 번임.
    하지만 드롭 사이 간격의 약 4%는 30번 넘게 연속 실패함. 플레이어는 이를 "버그"나 "조작"으로 느낌.</p>
    <p>보정 방식:</p>
    <ul>
      <li><b>독립 확률</b>: 매번 <code>rng() &lt; p</code>. 실패 연속 길이는 기하 분포. 꼬리가 길게 늘어짐.</li>
      <li><b>PRD(의사 난수 분포)</b>: N번째 시도 확률을 <code>C × N</code>으로 올림. 성공하면 N을 1로 되돌림. 평균이 p가 되도록 C를 미리 계산함. Warcraft III, Dota 2의 치명타와 회피 확률이 이 방식.</li>
      <li><b>셔플 백(Shuffle Bag)</b>: 성공 k개와 실패 n-k개를 주머니에 넣고 섞어서 하나씩 꺼냄. 다 꺼내면 다시 채움. 최악의 실패 연속이 2(n-k)회로 제한됨. 테트리스의 7-bag 방식과 같은 원리.</li>
      <li><b>천장(Pity Timer)</b>: 독립 확률로 굴리다가 정해진 횟수만큼 실패하면 다음은 무조건 성공. 가챠 게임의 천장 시스템.</li>
    </ul>
    <p>단점: 셔플 백은 "곧 나온다"를 플레이어가 예측할 수 있음. 천장은 실제 드롭률을 올리므로 기본 확률을 낮춰서 맞춰야 함.</p>`,
  // 도식: 20번 시도 타임라인. 독립 확률의 긴 실패 연속 vs 셔플 백의 주머니 단위 보장 vs 천장의 강제 성공
  diagram: (L) => {
    const row = (y, wins, cls, extra = {}) => Array.from({ length: 20 }, (_, i) =>
      `<rect x="${120 + i * 20}" y="${y}" width="18" height="18" rx="2" class="${extra[i] || (wins.includes(i) ? cls : 'f-dim')}"/>`).join('');
    return `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
    <text x="120" y="12" class="t-small t-dim">${L('시도 20번, 드롭률 10% (칸 1개 = 1번 시도)', '20 tries at a 10% drop rate (1 box = 1 try)')}</text>
    <text x="4" y="34" class="t-a">${L('독립 확률', 'Independent')}</text>
    ${row(22, [1, 17], 'f-a')}
    <path d="M162,44 L162,49 L456,49 L456,44" class="d-bad"/>
    <text x="309" y="61" text-anchor="middle" class="t-small">${L('15번 연속 실패 (꼬리가 김)', '15 misses in a row (long tail)')}</text>
    <text x="4" y="92" class="t-b">${L('셔플 백', 'Shuffle bag')}</text>
    <text x="4" y="104" class="t-small t-dim">${L('10개 중 성공 1개', '1 win per 10')}</text>
    ${row(80, [6, 12], 'f-b')}
    <line x1="119" y1="74" x2="119" y2="104" class="d-accent"/><line x1="319" y1="74" x2="319" y2="104" class="d-accent"/><line x1="519" y1="74" x2="519" y2="104" class="d-accent"/>
    <text x="219" y="114" text-anchor="middle" class="t-small t-dim">${L('주머니 1', 'bag 1')}</text>
    <text x="419" y="114" text-anchor="middle" class="t-small t-dim">${L('주머니 2', 'bag 2')}</text>
    <text x="4" y="146" class="t-dim">${L('천장 (10회)', 'Pity (10)')}</text>
    ${row(134, [2], 'f-dim', { 2: 'f-accent', 13: 'f-good' })}
    <path d="M180,156 L180,161 L378,161 L378,156" class="d-dim"/>
    <text x="279" y="173" text-anchor="middle" class="t-small t-dim">${L('10번 실패', '10 misses')}</text>
    <text x="410" y="173" class="t-small">${L('다음은 강제 성공', 'next one is forced')}</text>
    <text x="4" y="184" class="t-small t-dim">${L('셔플 백의 최악 실패 연속은 2(n-k) = 18번', 'Worst shuffle bag streak: 2(n-k) = 18')}</text>
  </svg>`;
  },
  look: [
    'A의 막대 꼬리를 보면 독립 확률은 평균의 3~4배까지 실패가 이어짐. B(셔플 백)는 막대가 일정 길이에서 끊김.',
    '두 뷰의 "실제 드롭률"을 비교하면 거의 같음. 평균은 같고 분포 모양만 다름.',
    'B를 천장으로 바꾸고 천장을 15회로 낮추면 실제 드롭률이 목표보다 올라감.',
    'B를 PRD로 바꾸면 0~2회 실패(연속 당첨)가 크게 줄고 막대가 평균 근처에 몰림.',
    '백 크기 배수를 5로 올리면 셔플 백 분포가 독립 확률 곡선에 가까워짐.',
  ],
  refs: [
    { type: 'article', title: 'TetrisWiki: Random Generator (7-bag)', url: 'https://tetris.wiki/Random_Generator', note: '테트로미노 7개를 섞어 한 번씩 내보내는 셔플 백 방식.' },
    { type: 'game', title: 'Warcraft III / Dota 2: Pseudo-random distribution (PRD)', note: '치명타, 회피 같은 확률 효과에 P(N) = C × N 방식 사용.' },
    { type: 'talk', title: 'Sid Meier: The Psychology of Game Design (Everything You Know Is Wrong), GDC 2010', year: 2010, note: '플레이어가 확률을 실제와 다르게 체감하는 문제와 보정 사례.' },
  ],
  params: [
    { key: 'method', label: '방식', type: 'select', group: '드롭', options: [
      { value: 'independent', label: '독립 확률' },
      { value: 'prd', label: 'PRD (확률 점증)' },
      { value: 'bag', label: '셔플 백' },
      { value: 'pity', label: '천장 (Pity Timer)' },
    ], a: 'independent', b: 'bag' },
    { key: 'rate', label: '목표 드롭률 (%)', type: 'range', min: 2, max: 50, step: 1, default: 10, shared: true, reset: true },
    { key: 'bagMul', label: '백 크기 배수', type: 'int', min: 1, max: 5, default: 1, help: '백 크기 = 배수 × (100 / 드롭률). 클수록 독립 확률에 가까워짐.', when: (p) => p.method === 'bag' },
    { key: 'pity', label: '천장 (회)', type: 'int', min: 2, max: 80, default: 20, help: '이 횟수만큼 연속 실패하면 다음은 무조건 성공.', when: (p) => p.method === 'pity' },
    { key: 'speed', label: '시행/초', type: 'range', min: 10, max: 5000, step: 10, default: 800, shared: true, group: '시뮬레이션' },
    { key: 'theory', label: '독립 확률 이론 곡선', type: 'bool', default: true, shared: true },
    { key: 'clear', label: '기록 지우기', type: 'button', buttonLabel: '기록 지우기' },
  ],
  en: {
    title: 'Drop Rate Correction: Independent vs Shuffle Bag vs Pity',
    summary: 'Four methods with the same average drop rate, compared by the distribution of "failure streak length". With independent rolls, an unlucky player fails dozens of times in a row. Shuffle bag, PRD, and pity keep the average but cut off the worst case.',
    views: { a: 'Independent', b: 'Shuffle bag' },
    controls: 'No input. Press "Clear history" to count again from the start.',
    info: `
    <p><b>Problem</b>: if you roll a 10% drop rate independently each time, the average is once in 10 tries.
    But about 4% of the gaps between drops are more than 30 failures in a row. Players feel this as a "bug" or "rigged".</p>
    <p>Correction methods:</p>
    <ul>
      <li><b>Independent</b>: <code>rng() &lt; p</code> every time. Failure streak length follows a geometric distribution. The tail is long.</li>
      <li><b>PRD (pseudo-random distribution)</b>: raises the chance of the Nth try to <code>C × N</code>. On a success, N goes back to 1. C is computed in advance so the average is p. Critical hit and evasion chances in Warcraft III and Dota 2 work this way.</li>
      <li><b>Shuffle bag</b>: put k successes and n-k failures in a bag, shuffle, and draw one at a time. When the bag is empty, refill it. The worst failure streak is limited to 2(n-k). This is the same idea as the 7-bag in Tetris.</li>
      <li><b>Pity timer</b>: roll independently, but after a set number of failures, the next roll always succeeds. This is the pity system in gacha games.</li>
    </ul>
    <p>Downsides: with a shuffle bag, players can predict that a drop is "coming soon". Pity raises the real drop rate, so you must lower the base chance to match.</p>`,
    look: [
      'Look at the tail of A\'s bars. Independent rolls keep failing up to 3~4 times the average. B (shuffle bag) bars stop at a set length.',
      'Compare the "Actual drop rate" of the two views. They are almost the same. The average matches, and only the shape of the distribution differs.',
      'Switch B to pity and lower the pity to 15. The actual drop rate goes above the target.',
      'Switch B to PRD. Streaks of 0~2 failures (back-to-back wins) drop a lot, and bars gather near the average.',
      'Raise the bag size multiplier to 5. The shuffle bag distribution gets close to the independent curve.',
    ],
    refs: ['A shuffle bag that mixes the 7 tetrominoes and deals each once.', 'Uses P(N) = C × N for chance effects like critical hits and evasion.', 'How players feel chance differently from reality, with examples of corrections.'],
    params: {
      method: { label: 'Method', group: 'Drops', options: { independent: 'Independent', prd: 'PRD (rising chance)', bag: 'Shuffle bag', pity: 'Pity timer' } },
      rate: 'Target drop rate (%)',
      bagMul: { label: 'Bag size multiplier', help: 'Bag size = multiplier × (100 / drop rate). Larger is closer to independent.' },
      pity: { label: 'Pity (tries)', help: 'After this many failures in a row, the next try always succeeds.' },
      speed: { label: 'Tries/s', group: 'Simulation' },
      theory: 'Independent theory curve',
      clear: { label: 'Clear history', buttonLabel: 'Clear history' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const MAXS = 2000;
    let rng, hist, rolls, drops, streak, maxStreak, sumStreak, recent, acc;
    let bag = [], bagKey = '', prdN = 1, prdC = 0, prdKey = -1;

    function clear() {
      rng = U.rng(ctx.seed * 7919 + 13);
      hist = new Uint32Array(MAXS + 1);
      rolls = drops = streak = maxStreak = sumStreak = acc = 0;
      recent = [];
      bag = []; bagKey = ''; prdN = 1;
    }
    clear();

    // PRD 상수 C: P(N) = min(1, C × N)의 평균 성공률이 p가 되도록 이분 탐색
    function prdRate(c) {
      let e = 0, surv = 1;
      for (let n = 1; n < 10000 && surv > 1e-12; n++) {
        const pn = Math.min(1, c * n);
        e += n * surv * pn; surv *= 1 - pn;
        if (pn >= 1) break;
      }
      return 1 / e;
    }
    function prdConst(p) {
      let lo = 0, hi = p;
      for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (prdRate(m) < p) lo = m; else hi = m; }
      return (lo + hi) / 2;
    }

    function roll() {
      const p = P.rate / 100;
      switch (P.method) {
        case 'prd': {
          if (prdKey !== P.rate) { prdC = prdConst(p); prdKey = P.rate; }
          const hit = rng.next() < Math.min(1, prdC * prdN);
          prdN = hit ? 1 : prdN + 1;
          return hit;
        }
        case 'bag': {
          const n = Math.max(2, Math.round(P.bagMul * 100 / P.rate)), k = Math.max(1, Math.round(n * p));
          const key = n + '|' + k;
          if (key !== bagKey || bag.length === 0) {
            bagKey = key; bag = [];
            for (let i = 0; i < n; i++) bag.push(i < k);
            rng.shuffle(bag);
          }
          return bag.pop();
        }
        case 'pity':
          if (streak >= P.pity) return true;
          return rng.next() < p;
        default:
          return rng.next() < p;
      }
    }

    function step() {
      const hit = roll();
      rolls++;
      if (hit) {
        drops++; hist[Math.min(MAXS, streak)]++; sumStreak += streak; streak = 0;
      } else {
        streak++; if (streak > maxStreak) maxStreak = streak;
      }
      recent.push(hit); if (recent.length > 400) recent.shift();
    }

    function percentile(q) {
      if (!drops) return 0;
      const target = drops * q;
      let c = 0;
      for (let i = 0; i <= MAXS; i++) { c += hist[i]; if (c >= target) return i; }
      return MAXS;
    }

    return {
      update(dt) {
        acc += P.speed * dt;
        let n = Math.floor(acc); acc -= n;
        n = Math.min(n, 20000);
        for (let i = 0; i < n; i++) step();
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        const p = P.rate / 100;
        // 막대 구간: 0 ~ 독립 확률에서 0.2%만 남는 길이
        const bins = Math.min(160, Math.ceil(Math.log(0.002) / Math.log(1 - p)) + 1);
        const x0 = 44, y0 = 30, pw = W - x0 - 14, ph = H - y0 - 110;
        const bw = pw / (bins + 1);
        let over = 0; for (let i = bins; i <= MAXS; i++) over += hist[i];
        let ymax = p * 1.25;
        for (let i = 0; i < bins; i++) if (drops) ymax = Math.max(ymax, hist[i] / drops);
        ymax = Math.max(ymax, drops ? over / drops : 0) * 1.08;
        // 축과 격자
        g.fillStyle = 'rgba(255,255,255,0.03)'; g.fillRect(x0, y0, pw, ph);
        for (let k = 0; k <= 4; k++) {
          const y = y0 + ph - (k / 4) * ph;
          D.line(g, x0, y, x0 + pw, y, C.grid, 1);
          D.text(g, ((ymax * k / 4) * 100).toFixed(1) + '%', x0 - 4, y, { size: 9, color: C.dim, align: 'right', baseline: 'middle' });
        }
        const mean = 1 / p - 1;
        const mx = x0 + (mean + 0.5) * bw;
        D.line(g, mx, y0, mx, y0 + ph, 'rgba(255,255,255,0.35)', 1);
        D.text(g, GTL.L('평균', 'Mean'), mx + 3, y0 + 2, { size: 9, color: C.dim });
        // 막대
        for (let i = 0; i < bins; i++) {
          const f = drops ? hist[i] / drops : 0;
          const h = (f / ymax) * ph;
          g.fillStyle = col; g.fillRect(x0 + i * bw + 0.5, y0 + ph - h, Math.max(1, bw - 1), h);
        }
        const fo = drops ? over / drops : 0;
        g.fillStyle = C.bad; g.fillRect(x0 + bins * bw + 0.5, y0 + ph - (fo / ymax) * ph, Math.max(1, bw - 1), (fo / ymax) * ph);
        // 독립 확률 이론값 (기하 분포)
        if (P.theory) {
          g.beginPath();
          for (let i = 0; i < bins; i++) {
            const f = p * Math.pow(1 - p, i);
            const x = x0 + (i + 0.5) * bw, y = y0 + ph - (f / ymax) * ph;
            i ? g.lineTo(x, y) : g.moveTo(x, y);
          }
          g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1.5; g.setLineDash([4, 3]); g.stroke(); g.setLineDash([]);
        }
        for (let i = 0; i <= bins; i += Math.max(1, Math.round(bins / 8))) D.text(g, String(i), x0 + (i + 0.5) * bw, y0 + ph + 4, { size: 9, color: C.dim, align: 'center' });
        D.text(g, bins + '+', x0 + (bins + 0.5) * bw, y0 + ph + 4, { size: 9, color: C.bad, align: 'center' });
        D.text(g, GTL.L('드롭 전 연속 실패 횟수 (막대 = 비율', 'Failures in a row before a drop (bars = share') + (P.theory ? GTL.L(', 점선 = 독립 확률 이론값)', ', dashed = independent theory)') : ')'), x0, 10, { size: 11, color: C.text });
        // 최근 시행 띠
        const sy = H - 62, cw = Math.max(2, (W - 28) / 200);
        D.text(g, GTL.L('최근 200회 (밝은 칸 = 드롭)', 'Last 200 tries (bright cell = drop)'), 14, sy - 14, { size: 10, color: C.dim });
        const r = recent.slice(-200);
        for (let i = 0; i < r.length; i++) {
          g.fillStyle = r[i] ? col : 'rgba(255,255,255,0.08)';
          g.fillRect(14 + i * cw, sy, Math.max(1, cw - 0.5), 14);
        }
        // 현재 실패 연속 게이지
        const gw = W - 28;
        g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(14, sy + 22, gw, 8);
        g.fillStyle = streak > mean * 3 ? C.bad : col; g.fillRect(14, sy + 22, Math.min(1, streak / bins) * gw, 8);
        D.text(g, GTL.L(`현재 연속 실패 ${streak}회`, `Current failure streak: ${streak}`), 14, sy + 33, { size: 10, color: C.dim });

        ctx.stat(GTL.L('시행 수', 'Tries'), rolls);
        ctx.stat(GTL.L('실제 드롭률', 'Actual drop rate'), drops ? ((drops / rolls) * 100).toFixed(2) + ' %' : '-');
        ctx.stat(GTL.L('평균 연속 실패', 'Mean failure streak'), drops ? (sumStreak / drops).toFixed(2) : '-');
        ctx.stat(GTL.L('최장 연속 실패', 'Longest failure streak'), maxStreak);
        ctx.stat(GTL.L('상위 1% 연속 실패', 'Top 1% failure streak'), percentile(0.99));
        if (P.method === 'prd') ctx.stat(GTL.L('PRD 상수 C', 'PRD constant C'), (prdC * 100).toFixed(3) + ' %');
        if (P.method === 'bag') ctx.stat(GTL.L('백 구성 (드롭/전체)', 'Bag contents (drops/total)'), bagKey.split('|').reverse().join(' / '));
      },
      onAction(key) { if (key === 'clear') clear(); },
    };
  },
});
