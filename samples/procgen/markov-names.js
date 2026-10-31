// 이름 생성: 무작위 글자 vs 음절 조합 vs 글자 단위 마르코프 체인(n-gram 차수)
GTL.register({
  id: 'markov-names',
  title: '마르코프 체인 이름 생성 (n-gram 차수)',
  summary: '무작위 음절 조합 vs 마르코프 체인 비교. 음절 조합은 발음은 되지만 어느 지역 이름인지 느낌이 없음. 마르코프 체인은 학습한 지명의 글자 흐름을 따라 그럴듯한 새 이름을 만듦. 차수가 너무 높으면 원본을 그대로 복사.',
  views: { a: '무작위 음절', b: '마르코프 (2차)' },
  controls: '조작 없음. 새 이름이 계속 위에 추가됨.',
  info: `
    <p><b>음절 조합</b>: 자음 묶음, 모음, 받침 목록에서 하나씩 골라 이어 붙임. Elite(1984)의 행성 이름처럼 데이터가 작음.
    발음은 되지만 학습 데이터의 분위기를 따르지 않음.</p>
    <p><b>마르코프 체인(Markov chain)</b>: 학습 이름에서 "앞 n글자 뒤에 어떤 글자가 몇 번 왔는지" 세어 표로 만듦.
    생성할 때는 시작 표시 <code>^</code>에서 출발해, 직전 n글자를 보고 다음 글자를 빈도에 비례해 뽑음. 끝 표시 <code>$</code>가 나오면 멈춤.
    n을 <b>차수</b>라고 함.</p>
    <ul>
      <li>1차: 글자 쌍만 기억. 짧고 엉뚱한 조합이 많음.</li>
      <li>2차: 학습 데이터의 말투가 살아남. 새 이름이 대부분.</li>
      <li>3차 이상: 갈림길이 거의 없어 원본 이름을 그대로 내보내는 비율이 급격히 늘어남</li>
    </ul>
    <p>적절한 차수는 학습 데이터 크기에 따라 다름. 여기처럼 이름이 70개 정도면 2차가 알맞음. 수천 개면 3~4차도 새 이름을 많이 만듦.</p>
    <p>실제 게임에서는 원본과 같은 이름, 너무 짧거나 긴 이름을 걸러냄. 낮은 차수로 되돌아가는 백오프(back-off)로 다양성을 보충하기도 함.</p>`,
  // 도식: 학습 이름에서 만든 2차 전이 표와 표를 따라 한 글자씩 뽑는 생성 과정
  diagram: (L) => `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr-mk" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="16" class="t-dim t-small">${L('학습 이름', 'Training names')}</text>
    ${['kara', 'karin', 'marin', 'mira'].map((n, i) => `<text x="10" y="${36 + i * 16}" class="t-mono">${n}</text>`).join('')}
    <text x="110" y="16" class="t-dim t-small">${L('표: 앞 2글자 → 다음 글자 횟수', 'Last 2 letters → next (count)')}</text>
    ${[['^^', 'k:2  m:2'], ['ma', 'r:1'], ['ar', 'a:1  i:2'], ['ra', '$:2'], ['ri', 'n:2']].map(([c, n], i) =>
      `<text x="110" y="${36 + i * 15}" class="t-mono t-small">${c}  →  ${n}</text>`).join('')}
    <line x1="280" y1="8" x2="280" y2="104" class="d-dim"/>
    <text x="294" y="20" class="t-a">${L('A 음절 조합', 'A syllable mix')}</text>
    <text x="294" y="40" class="t-mono">k + a + r + o</text>
    <text x="294" y="58" class="t-small t-dim">${L('목록에서 무작위로 이어 붙임', 'joins random parts from lists')}</text>
    <text x="294" y="72" class="t-small t-dim">${L('학습 데이터의 분위기와 무관', 'ignores the feel of the training data')}</text>
    <text x="10" y="126" class="t-b">${L('B 생성: 직전 2글자를 보고 횟수에 비례해 뽑음', 'B generate: look at the last 2 letters, pick by count')}</text>
    ${['^', 'm', 'a', 'r', 'a', '$'].map((c, i) => `<rect x="${10 + i * 44}" y="136" width="28" height="24" rx="3" class="${i === 0 || i === 5 ? 'f-dim' : 'f-b'}"/><text x="${24 + i * 44}" y="152" text-anchor="middle" class="t-mono">${c}</text>` +
      (i < 5 ? `<line x1="${39 + i * 44}" y1="148" x2="${53 + i * 44}" y2="148" class="d-accent" marker-end="url(#arr-mk)"/>` : '')).join('')}
    <text x="270" y="152" class="t-mono">= mara</text>
    <text x="330" y="152" class="t-small t-b">${L('학습에 없는 새 이름', 'a new name, not in training')}</text>
    <text x="10" y="180" class="t-small t-dim">${L('차수가 낮으면 엉뚱한 조합, 높으면 원본 복사가 늘어남', 'Low order gives odd mixes. High order copies the training names')}</text>
  </svg>`,
  look: [
    'B의 이름은 영국 지명처럼 -ford, -ton, -ster로 끝나는 경우가 많음. A는 학습 데이터와 상관없는 소리가 섞임.',
    '"3글자 조각 일치율"을 비교하면 A는 낮고 B는 100%. B의 모든 3글자 조각이 학습 데이터에 있음.',
    'B의 차수를 3, 4로 올리면 "원본 복제 비율"이 50%, 90%로 늘어남. 흐린 글자가 원본과 같은 이름.',
    'B의 차수를 1로 내리면 이름이 엉망이 되고 길이도 들쭉날쭉해짐',
    '학습 데이터를 일본 지명으로 바꾸면 B는 -ka, -shi, -yama 같은 흐름을 따름. A는 그대로임.',
  ],
  refs: [
    { type: 'paper', title: 'C. E. Shannon: A Mathematical Theory of Communication', year: 1948, note: '글자 n-gram 근사로 영어처럼 보이는 문자열을 만드는 예시' },
    { type: 'article', title: 'RogueBasin: Names from a high order Markov Process and a simplified Katz back-off scheme', note: '로그라이크 이름 생성에 고차 마르코프 체인과 백오프를 쓰는 방법' },
    { type: 'game', title: 'Elite (David Braben, Ian Bell, 1984)', year: 1984, note: '두 글자 조각을 이어 붙여 행성 이름을 만든 사례' },
  ],
  params: [
    { key: 'method', label: '생성 방식', type: 'select', group: '생성', options: [
      { value: 'letters', label: '무작위 글자' },
      { value: 'syllable', label: '무작위 음절 조합' },
      { value: 'markov', label: '마르코프 체인' },
    ], a: 'syllable', b: 'markov' },
    { key: 'order', label: '차수 (앞 글자 수)', type: 'int', min: 1, max: 6, default: 2, when: (p) => p.method === 'markov' },
    { key: 'filter', label: '원본과 같은 이름 거르기', type: 'bool', default: false, when: (p) => p.method === 'markov' },
    { key: 'corpus', label: '학습 데이터', type: 'select', shared: true, options: [
      { value: 'uk', label: '영국 도시 이름' },
      { value: 'jp', label: '일본 도시 이름 (로마자)' },
    ], default: 'uk' },
    { key: 'rate', label: '이름/초', type: 'range', min: 0.5, max: 20, step: 0.5, default: 3, shared: true, group: '표시' },
    { key: 'showProb', label: '다음 글자 확률 표시', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Markov Chain Name Generation (n-gram Order)',
    summary: 'Random syllable building vs Markov chains. Syllable building gives names you can say, but with no feel of a region. A Markov chain follows the letter flow of the place names it learned and makes believable new names. If the order is too high, it copies the originals as they are.',
    views: { a: 'Random syllables', b: 'Markov (order 2)' },
    controls: 'No input. New names keep appearing at the top.',
    info: `
    <p><b>Syllable building</b>: pick one item each from lists of consonant groups, vowels, and endings, and join them. The data is small, like planet names in Elite (1984).
    You can say the names, but they do not follow the mood of any training data.</p>
    <p>A <b>Markov chain</b> counts "which letter came after the previous n letters, and how often" in the training names, and builds a table.
    To generate, start from the start mark <code>^</code>, look at the last n letters, and draw the next letter in proportion to its count. Stop at the end mark <code>$</code>.
    n is called the <b>order</b>.</p>
    <ul>
      <li>Order 1: remembers only letter pairs. Many short, odd combinations.</li>
      <li>Order 2: the style of the training data comes through. Most names are new.</li>
      <li>Order 3 or more: there are almost no branch points, so the share of names copied straight from the originals rises sharply.</li>
    </ul>
    <p>The right order depends on the size of the training data. With about 70 names, as here, order 2 fits. With thousands, order 3~4 still makes many new names.</p>
    <p>Real games filter out names that match the originals or are too short or long. Some also add variety with back-off, which falls back to a lower order.</p>`,
    look: [
      'B\'s names often end in -ford, -ton, or -ster, like British place names. A mixes in sounds unrelated to the training data.',
      'Compare "3-letter chunk match rate". A is low and B is 100%. Every 3-letter chunk in B exists in the training data.',
      'Raise B\'s order to 3 and 4. "Copy rate" grows to 50% and 90%. Faded names are the same as an original.',
      'Lower B\'s order to 1. The names fall apart and their length varies a lot.',
      'Switch the training data to Japanese place names. B follows flows like -ka, -shi, -yama. A stays the same.',
    ],
    refs: ['An example of making English-like strings with letter n-gram approximations.', 'How to use high-order Markov chains and back-off to make names in roguelikes.', 'An example that built planet names by joining two-letter chunks.'],
    params: {
      method: { label: 'Generation method', group: 'Generation', options: { letters: 'Random letters', syllable: 'Random syllables', markov: 'Markov chain' } },
      order: 'Order (previous letters)',
      filter: 'Filter names that match originals',
      corpus: { label: 'Training data', options: { uk: 'UK town names', jp: 'Japanese town names (romaji)' } },
      rate: { label: 'Names/s', group: 'Display' },
      showProb: 'Show next letter chances',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const CORPUS = {
      uk: 'ashford barnsley bedford birmingham blackburn bolton bradford brighton bristol burnley cambridge canterbury carlisle chelmsford chester colchester coventry darlington derby doncaster dorchester dover durham exeter gloucester guildford halifax hartlepool hereford huddersfield ipswich kendal lancaster leicester lincoln liverpool luton maidstone manchester middlesbrough newcastle northampton norwich nottingham oldham oxford plymouth portsmouth preston reading rochdale salford salisbury sheffield shrewsbury southampton stafford stockport sunderland swindon taunton telford wakefield warrington watford wigan winchester wolverhampton worcester yeovil york',
      jp: 'sapporo hakodate asahikawa aomori morioka sendai akita yamagata fukushima mito utsunomiya maebashi saitama chiba yokohama kawasaki niigata toyama kanazawa fukui kofu nagano gifu shizuoka hamamatsu nagoya toyota otsu kyoto osaka sakai kobe himeji nara wakayama tottori matsue okayama kurashiki hiroshima fukuyama yamaguchi shimonoseki tokushima takamatsu matsuyama kochi fukuoka kitakyushu kurume saga nagasaki sasebo kumamoto oita beppu miyazaki kagoshima naha kushiro obihiro hachinohe iwaki koriyama takasaki kashiwa funabashi hachioji fujisawa odawara nagaoka takaoka matsumoto numazu okazaki toyohashi yokkaichi akashi kakogawa imabari uwajima miyakonojo kanoya',
    };
    const ONSET = ['b', 'd', 'f', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'z', 'br', 'st', 'th', 'ch', 'sh', 'gr', 'kr', 'dr', ''];
    const VOWEL = ['a', 'e', 'i', 'o', 'u', 'ou', 'ea', 'ai', 'y'];
    const CODA = ['', '', '', 'n', 'r', 'l', 's', 'm', 't', 'd', 'ck', 'x', 'rn'];
    const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

    let key = '', words = [], wordSet = null, tri = null, model = null, names = [], acc = 0, rng = null, info = {};

    function buildModel(order) {
      const m = new Map();
      for (const w of words) {
        const s = '^'.repeat(order) + w + '$';
        for (let i = order; i < s.length; i++) {
          const ctxs = s.slice(i - order, i);
          let t = m.get(ctxs); if (!t) { t = new Map(); m.set(ctxs, t); }
          t.set(s[i], (t.get(s[i]) || 0) + 1);
        }
      }
      // 누적 분포로 바꿔 둠
      const out = new Map();
      for (const [c, t] of m) {
        let total = 0; const chars = [], cum = [];
        for (const [ch, n] of t) { total += n; chars.push(ch); cum.push(total); }
        out.set(c, { chars, cum, total, counts: t });
      }
      return out;
    }

    // 이름 하나 생성. steps에는 마르코프 단계별 후보 분포를 기록
    function genOne(r, steps) {
      const meth = P.method;
      if (meth === 'letters') {
        const n = r.int(4, 9); let s = '';
        for (let i = 0; i < n; i++) s += LETTERS[r.int(0, 25)];
        return { name: s };
      }
      if (meth === 'syllable') {
        const n = r.int(2, 3), parts = [];
        for (let i = 0; i < n; i++) parts.push(r.pick(ONSET) + r.pick(VOWEL) + (i === n - 1 || r.chance(0.35) ? r.pick(CODA) : ''));
        return { name: parts.join(''), parts };
      }
      const o = P.order;
      let last = '?';
      for (let attempt = 0; attempt < 30; attempt++) {
        let s = '^'.repeat(o), ok = true;
        if (steps) steps.length = 0;
        for (let i = 0; i < 18; i++) {
          const st = model.get(s.slice(s.length - o));
          if (!st) { ok = false; break; }
          const x = r.next() * st.total;
          let k = 0; while (st.cum[k] <= x) k++;
          const ch = st.chars[k];
          if (steps) steps.push({ st, ch });
          if (ch === '$') break;
          s += ch;
        }
        const name = s.slice(o);
        if (!ok || name.length < 3 || name.length > 14) continue;
        last = name;
        if (P.filter && wordSet.has(name)) continue;
        return { name };
      }
      return { name: last };
    }

    function rebuild() {
      words = CORPUS[P.corpus].split(' ');
      wordSet = new Set(words);
      tri = new Set();
      for (const w of words) { const s = '^' + w + '$'; for (let i = 0; i + 3 <= s.length; i++) tri.add(s.slice(i, i + 3)); }
      model = P.method === 'markov' ? buildModel(P.order) : null;
      // 오프라인 측정: 2000개 생성
      const r = U.rng(ctx.seed * 31 + 7);
      let copies = 0, triHit = 0, triAll = 0, len = 0;
      const uniq = new Set();
      const M = 2000;
      for (let i = 0; i < M; i++) {
        const { name } = genOne(r, null);
        if (wordSet.has(name)) copies++;
        uniq.add(name); len += name.length;
        const s = '^' + name + '$';
        for (let j = 0; j + 3 <= s.length; j++) { triAll++; if (tri.has(s.slice(j, j + 3))) triHit++; }
      }
      let cl = 0; for (const w of words) cl += w.length;
      info = { copies: (copies / M) * 100, tri: (triHit / triAll) * 100, uniq: (uniq.size / M) * 100, len: len / M, corpusLen: cl / words.length, states: model ? model.size : 0 };
      rng = U.rng(ctx.seed * 17 + 3);
      names = [];
      for (let i = 0; i < 12; i++) push();
    }

    function push() {
      const steps = [];
      const g = genOne(rng, steps);
      g.steps = steps.slice(0, 8);
      g.copy = wordSet.has(g.name);
      names.unshift(g);
      if (names.length > 40) names.pop();
    }

    function ensure() {
      const k = [P.method, P.order, P.filter, P.corpus].join('|');
      if (k !== key) { rebuild(); key = k; }
    }
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    return {
      update(dt) {
        ensure();
        acc += dt * P.rate;
        while (acc >= 1) { acc -= 1; push(); }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        ensure();
        const col = ctx.side === 'a' ? C.a : C.b;
        const probH = P.showProb ? 150 : 0;
        // 이름 목록 (2열)
        const top = 12, rowH = 20, colW = (W - 24) / 2;
        const rows = Math.max(1, Math.floor((H - top - probH - 10) / rowH));
        for (let i = 0; i < Math.min(names.length, rows * 2); i++) {
          const n = names[i], cx = 12 + Math.floor(i / rows) * colW, cy = top + (i % rows) * rowH;
          const fresh = i === 0;
          let label = cap(n.name);
          if (n.parts && fresh) label = n.parts.map(cap).join('-');
          D.text(g, label, cx, cy, { size: fresh ? 15 : 13, color: n.copy ? C.dim : fresh ? col : C.text, font: 'monospace' });
          if (n.copy) D.text(g, GTL.L('원본', 'original'), cx + label.length * 8.5 + 6, cy + 2, { size: 9, color: C.dim });
        }
        // 마지막 이름의 단계별 다음 글자 확률
        if (P.showProb) {
          const y0 = H - probH;
          g.fillStyle = 'rgba(10,12,16,0.85)'; g.fillRect(0, y0, W, probH);
          const last = names[0];
          if (P.method === 'markov' && last && last.steps && last.steps.length) {
            D.text(g, GTL.L(`"${cap(last.name)}"를 만든 단계 (앞 ${P.order}글자 → 다음 글자 후보 상위 4개)`, `Steps that built "${cap(last.name)}" (previous ${P.order} letters → top 4 next letter candidates)`), 10, y0 + 6, { size: 10, color: C.dim });
            const steps = last.steps, sw = (W - 20) / Math.min(8, steps.length);
            steps.forEach((s, i) => {
              const x = 10 + i * sw;
              const entries = [...s.st.counts].sort((p, q) => q[1] - p[1]).slice(0, 4);
              const ctxStr = ('^'.repeat(P.order) + last.name + '$').slice(i, i + P.order);
              D.text(g, ctxStr, x, y0 + 24, { size: 11, color: C.text, font: 'monospace' });
              entries.forEach(([ch, n], j) => {
                const p = n / s.st.total, by = y0 + 44 + j * 24;
                g.fillStyle = ch === s.ch ? col : 'rgba(255,255,255,0.18)';
                g.fillRect(x, by + 12, Math.max(2, (sw - 10) * p), 6);
                D.text(g, `${ch === '$' ? GTL.L('끝', 'end') : ch} ${(p * 100).toFixed(0)}%`, x, by, { size: 10, color: ch === s.ch ? col : C.dim, font: 'monospace' });
              });
              if (s.st.chars.length === 1) D.text(g, GTL.L('후보 1개', '1 candidate'), x, y0 + probH - 14, { size: 9, color: C.warn });
            });
          } else if (P.method === 'syllable' && last && last.parts) {
            D.text(g, GTL.L('음절 = 자음 묶음 + 모음 + 받침(선택). 학습 데이터를 보지 않음', 'Syllable = consonant group + vowel + ending (optional). Ignores the training data'), 10, y0 + 6, { size: 10, color: C.dim });
            D.text(g, last.parts.map((p) => `[${p}]`).join(' + ') + ' = ' + cap(last.name), 10, y0 + 30, { size: 14, color: col, font: 'monospace' });
          } else {
            D.text(g, GTL.L('글자 26개 중 무작위로 골라 이어 붙임', 'Picks from 26 letters at random and joins them'), 10, y0 + 6, { size: 10, color: C.dim });
          }
        }
        ctx.stat(GTL.L('원본 복제 비율', 'Copy rate'), info.copies.toFixed(1) + ' %');
        ctx.stat(GTL.L('3글자 조각 일치율', '3-letter chunk match rate'), info.tri.toFixed(1) + ' %');
        ctx.stat(GTL.L('고유 이름 비율 (2000개 중)', 'Unique name rate (of 2000)'), info.uniq.toFixed(1) + ' %');
        ctx.stat(GTL.L('평균 길이 (원본)', 'Mean length (originals)'), `${info.len.toFixed(1)} (${info.corpusLen.toFixed(1)})`);
        if (P.method === 'markov') ctx.stat(GTL.L('문맥 상태 수', 'Context states'), info.states);
      },
    };
  },
});
