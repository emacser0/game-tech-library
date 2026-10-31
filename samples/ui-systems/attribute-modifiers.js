// 능력치 수정자: 값을 직접 바꾸기 vs 기본값에서 다시 집계 (Unreal GAS Attribute Aggregator)
GTL.register({
  id: 'attribute-modifiers',
  title: '능력치 수정자 집계 (Unreal GAS Attribute, Gameplay Effect)',
  summary: '버프를 받을 때마다 공격력 값을 직접 곱하고 더하면 순서에 따라 결과가 달라지고, 버프를 지워도 원래 값으로 돌아오지 않음. 기본값과 효과 목록을 따로 두고 매번 다시 계산하면 순서와 상관없이 같은 값이 나오고 제거도 정확함.',
  views: { a: '값 직접 바꾸기', b: '기본값에서 다시 집계' },
  controls: '버튼으로 버프와 디버프를 넣고 지움. 자동 진행을 켜 두면 같은 순서의 효과가 두 뷰에 들어감.',
  info: `
    <p><b>능력치 수정자</b>(attribute modifier)는 버프, 디버프, 장비가 공격력 같은 능력치를 바꾸는 규칙. Unreal의 Gameplay Ability System(GAS)은 이를 Gameplay Effect의 Modifier로 표현.</p>
    <p>값을 직접 바꾸는 방식의 문제:</p>
    <ul>
      <li><b>순서 의존</b>: +10 다음 +20%와, +20% 다음 +10은 결과가 다름</li>
      <li><b>잘못된 제거</b>: +10을 지울 때 10을 빼면, 그 사이 곱해진 배율만큼의 차이가 남음</li>
      <li><b>오차 누적</b>: 정수로 저장하면 곱하고 나눌 때마다 반올림 오차가 쌓임. 모든 효과를 지워도 기본값으로 돌아오지 않음.</li>
      <li>고정(Override) 효과를 지우면 이전 값을 알 수 없음</li>
    </ul>
    <p>GAS의 방식: 능력치가 <b>기본값</b>(BaseValue)과 <b>현재 값</b>(CurrentValue)을 따로 가짐</p>
    <ul>
      <li>영구 변화(레벨 업, 즉시 효과)는 기본값을 바꿈</li>
      <li>지속 효과는 기본값을 바꾸지 않고 수정자 목록에만 들어감</li>
      <li>목록이 바뀔 때마다 집계기(aggregator)가 현재 값을 다시 계산: <code>(기본값 + 더하기 합) × (1 + 배율 보너스 합) ÷ (1 + 나누기 보너스 합)</code>. 고정 효과가 있으면 마지막 고정 값이 이김.</li>
      <li>배율은 서로 곱하지 않고 보너스를 더함. +20%와 -50%는 1 + 0.2 - 0.5 = 0.7배.</li>
      <li>같은 효과를 다시 받으면 스택(stacking) 규칙에 따라 중첩 수만 늘리거나 시간을 갱신</li>
    </ul>
    <p>단점: 값을 읽을 때마다 계산하면 비싸서, 목록이 바뀔 때만 다시 계산하고 저장해 둠. 배율끼리 곱하는 방식을 원하면 따로 규칙을 정해야 함.</p>`,
  // 도식: 집계 공식 파이프라인 + 직접 바꾸기의 같은 예시
  diagram: (L) => {
    const box = (x, y, w, t1, t2, cls) => `<rect x="${x}" y="${y}" width="${w}" height="36" rx="4" class="${cls}"/><text x="${x + w / 2}" y="${y + 15}" text-anchor="middle" class="t-small">${t1}</text><text x="${x + w / 2}" y="${y + 29}" text-anchor="middle" class="t-small t-mono">${t2}</text>`;
    const arr = (x1, x2, y, m) => `<path d="M${x1},${y} L${x2},${y}" class="d-${m}" marker-end="url(#arr${m === 'a' ? 'A' : 'B'})"/>`;
    const bx = [6, 98, 190, 300, 410];
    return `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="arrA" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    </defs>
    <text x="6" y="16" class="t-b">${L('B: 효과 목록에서 매번 다시 계산', 'B: recompute from the effect list')}</text>
    ${box(bx[0], 26, 80, L('기본값', 'Base'), '100', 'f-dim')}
    ${box(bx[1], 26, 80, L('+ 더하기 합', '+ sum of Add'), '+10 = 110', 'f-dim')}
    ${box(bx[2], 26, 98, L('× (1 + 배율 합)', '× (1 + sum bonus)'), '× 0.7 = 77', 'f-dim')}
    ${box(bx[3], 26, 98, L('÷ (1 + 나누기 합)', '÷ (1 + sum div)'), '÷ 1 = 77', 'f-dim')}
    ${box(bx[4], 26, 120, L('고정 효과 있으면 대체', 'Override wins if any'), L('현재 값 77', 'Current 77'), 'd-b')}
    ${arr(86, 96, 44, 'b')}${arr(178, 188, 44, 'b')}${arr(288, 298, 44, 'b')}${arr(398, 408, 44, 'b')}
    <text x="6" y="78" class="t-small t-dim">${L('효과: +10, +20%, -50%. 배율 보너스는 더함: 1 + 0.2 - 0.5 = 0.7', 'Effects: +10, +20%, -50%. Bonuses add up: 1 + 0.2 - 0.5 = 0.7')}</text>
    <text x="6" y="92" class="t-small t-b">${L('+10 제거: 목록에서 빼고 다시 계산, 100 × 0.7 = 70', 'Remove +10: drop it and recompute, 100 × 0.7 = 70')}</text>
    <text x="6" y="118" class="t-a">${L('A: 받은 순서대로 값을 직접 바꿈', 'A: change the value in the order received')}</text>
    ${box(6, 128, 70, L('값', 'value'), '100', 'f-dim')}
    ${box(90, 128, 70, '+10', '110', 'f-dim')}
    ${box(174, 128, 70, '×1.2', '132', 'f-dim')}
    ${box(258, 128, 70, '×0.5', '66', 'f-dim')}
    ${box(342, 128, 80, L('+10 제거', 'remove +10'), '-10 = 56', 'd-a')}
    ${arr(76, 88, 146, 'a')}${arr(160, 172, 146, 'a')}${arr(244, 256, 146, 'a')}${arr(328, 340, 146, 'a')}
    <text x="430" y="142" class="t-small t-a">${L('70이어야 함', 'should be 70')}</text>
    <text x="430" y="156" class="t-small t-a">${L('순서에 따라 바뀜', 'order dependent')}</text>
    <text x="6" y="186" class="t-small t-dim">${L('제거는 역연산(빼기, 나누기). 그 사이에 곱한 배율과 반올림 오차가 남음', 'Removal applies the inverse op. Multipliers applied in between and rounding errors stay')}</text>
  </svg>`;
  },
  look: [
    '자동 진행을 보면 A의 주황 선이 B의 값(점선)에서 점점 벗어남. B는 같은 효과 목록이면 항상 같은 값.',
    '"모든 효과 제거"를 누르면 B는 정확히 기본값으로 돌아옴. A는 기본값과 다른 값에 머묾.',
    '"+10 공격력", "+20% 공격력"을 넣고 "가장 오래된 효과 제거"를 누르면 A는 132에서 10만 뺀 122가 됨. B는 120으로 정확히 돌아옴.',
    '"50으로 고정"을 넣었다가 지우면 A는 기본값으로 초기화되어 다른 버프가 사라짐. B는 남은 버프가 그대로 적용됨.',
    'A의 "정수로 저장"을 끄면 반올림 오차는 사라지지만 순서 문제와 잘못된 제거는 그대로 남음',
    '"레벨 업"은 기본값을 바꿈. B에서는 레벨 업으로 오른 5에도 배율이 적용됨.',
  ],
  refs: [
    { type: 'engine', title: 'Unreal Engine - Gameplay Attributes and Attribute Sets', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/gameplay-attributes-and-attribute-sets-for-the-gameplay-ability-system-in-unreal-engine', note: '능력치는 기본값(BaseValue)과 현재 값(CurrentValue)을 따로 가짐' },
    { type: 'engine', title: 'Unreal Engine - Gameplay Effects', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/gameplay-effects-for-the-gameplay-ability-system-in-unreal-engine', note: 'Modifier와 Stacking 규칙' },
    { type: 'code', title: 'Unreal Engine source - GameplayEffectAggregator.h (FAggregatorModChannel::EvaluateWithBase)', note: '((Base + Additive) × Multiplicative) ÷ Division, Override는 마지막 값. 소스 접근은 Epic 계정 연결 필요.' },
  ],
  params: [
    { key: 'mode', label: '계산 방식', type: 'select', group: '방식', options: [
      { value: 'mutate', label: '값 직접 바꾸기' },
      { value: 'aggregate', label: '기본값에서 다시 집계' },
    ], a: 'mutate', b: 'aggregate' },
    { key: 'intStore', label: '정수로 저장', type: 'bool', default: true, when: (p) => p.mode === 'mutate', help: '연산마다 반올림해서 저장' },
    { key: 'stackLimit', label: '+20% 버프 최대 중첩', type: 'int', min: 1, max: 5, default: 3, shared: true, group: '효과' },
    { key: 'auto', label: '자동 진행', type: 'bool', default: true, shared: true, help: '같은 순서의 효과를 두 뷰에 넣고 지움' },
    { key: 'addFlat', label: '+10 공격력', type: 'button', help: 'Add 수정자' },
    { key: 'addPct', label: '+20% 공격력', type: 'button', help: 'Multiply 수정자 1.2. 같은 효과는 중첩 수가 늘어남' },
    { key: 'debuff', label: '-50% 약화', type: 'button', help: 'Multiply 수정자 0.5' },
    { key: 'curse', label: '÷2 저주', type: 'button', help: 'Divide 수정자 2' },
    { key: 'fix', label: '50으로 고정', type: 'button', help: 'Override 수정자 50' },
    { key: 'levelUp', label: '레벨 업 (기본값 +5)', type: 'button', help: '즉시 효과. 기본값을 바꿈' },
    { key: 'removeOld', label: '가장 오래된 효과 제거', type: 'button' },
    { key: 'clearAll', label: '모든 효과 제거', type: 'button' },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Attribute Modifier Aggregation (Unreal GAS Attribute, Gameplay Effect)',
    summary: 'If you multiply and add the attack value directly for every buff, the result depends on the order, and removing a buff does not bring the old value back. Keep the base value and the effect list apart and recompute each time, and you get the same value in any order and exact removal.',
    views: { a: 'Change value directly', b: 'Recompute from base' },
    controls: 'Use the buttons to add and remove buffs and debuffs. With auto play on, both views get the same effects in the same order.',
    info: `
    <p>An <b>attribute modifier</b> is a rule by which a buff, debuff, or item changes a stat such as attack. Unreal's Gameplay Ability System (GAS) expresses it as a Modifier on a Gameplay Effect.</p>
    <p>Problems with changing the value directly:</p>
    <ul>
      <li><b>Order dependence</b>: +10 then +20% gives a different result than +20% then +10.</li>
      <li><b>Wrong removal</b>: removing +10 by subtracting 10 leaves the part that was multiplied in between.</li>
      <li><b>Drift</b>: if you store an integer, every multiply and divide adds rounding error. Even after removing every effect, you do not get the base value back.</li>
      <li>Removing an Override effect cannot know the old value.</li>
    </ul>
    <p>How GAS does it: an attribute keeps a <b>base value</b> (BaseValue) and a <b>current value</b> (CurrentValue).</p>
    <ul>
      <li>Permanent changes (level up, instant effects) change the base value.</li>
      <li>Duration effects do not touch the base value. They only join the modifier list.</li>
      <li>Each time the list changes, the aggregator recomputes the current value: <code>(base + sum of adds) × (1 + sum of multiplier bonuses) ÷ (1 + sum of divide bonuses)</code>. If there is an Override, the last one wins.</li>
      <li>Multipliers do not multiply each other. Their bonuses add up. +20% and -50% give 1 + 0.2 - 0.5 = 0.7.</li>
      <li>Applying the same effect again follows its stacking rule: it only raises the stack count or refreshes the duration.</li>
    </ul>
    <p>Downside: computing on every read is costly, so recompute only when the list changes and cache the result. If you want multipliers to compound, you need a separate rule.</p>`,
    look: [
      'Watch auto play. A\'s orange line drifts away from B\'s value (dashed). B always gives the same value for the same effect list.',
      'Press "Remove all effects". B returns exactly to the base value. A stays at a different value.',
      'Add "+10 attack" and "+20% attack", then press "Remove oldest effect". A just subtracts 10 from 132 and gets 122. B returns exactly to 120.',
      'Add "Fix at 50" and then remove it. A resets to the base value and loses the other buffs. B keeps applying the remaining buffs.',
      'Turn off A\'s "Store as integer". Rounding drift goes away, but the order problem and wrong removal stay.',
      '"Level up" changes the base value. In B, the 5 gained from leveling up is also multiplied.',
    ],
    refs: [
      'An attribute keeps a base value (BaseValue) and a current value (CurrentValue).',
      'Modifier and Stacking rules.',
      '((Base + Additive) × Multiplicative) ÷ Division, and the last Override wins. Source access needs a linked Epic account.',
    ],
    params: {
      mode: { label: 'Calculation', group: 'Method', options: { mutate: 'Change value directly', aggregate: 'Recompute from base' } },
      intStore: { label: 'Store as integer', help: 'Round and store after every operation' },
      stackLimit: { label: '+20% buff max stacks', group: 'Effects' },
      auto: { label: 'Auto play', help: 'Adds and removes the same effects in both views in the same order' },
      addFlat: { label: '+10 attack', help: 'Add modifier' },
      addPct: { label: '+20% attack', help: 'Multiply modifier 1.2. Reapplying raises the stack count' },
      debuff: { label: '-50% weaken', help: 'Multiply modifier 0.5' },
      curse: { label: '÷2 curse', help: 'Divide modifier 2' },
      fix: { label: 'Fix at 50', help: 'Override modifier 50' },
      levelUp: { label: 'Level up (base +5)', help: 'Instant effect. Changes the base value' },
      removeOld: 'Remove oldest effect',
      clearAll: 'Remove all effects',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const BASE0 = 100, HIST = 300, SAMPLE = 0.05;
    const KIND = {
      addFlat: { op: 'add', mag: 10, name: () => '+10', label: 'Add' },
      addPct: { op: 'mul', mag: 1.2, name: () => '+20%', label: 'Multiply', stack: true },
      debuff: { op: 'mul', mag: 0.5, name: () => '-50%', label: 'Multiply' },
      curse: { op: 'div', mag: 2, name: () => '÷2', label: 'Divide' },
      fix: { op: 'override', mag: 50, name: () => '=50', label: 'Override' },
    };
    let base, naive, effects, nextId, hist, histRef, marks, sampleT, autoT, autoN, clears, log;

    function init() {
      ctx.rng = U.rng(ctx.seed);
      base = BASE0; naive = BASE0; effects = []; nextId = 1;
      hist = []; histRef = []; marks = []; sampleT = 0; autoT = 0.6; autoN = 0; clears = 0; log = [];
    }
    init();

    // B: 기본값과 효과 목록에서 현재 값을 다시 계산 (GAS 집계기와 같은 순서)
    function aggregate() {
      let add = 0, mul = 1, div = 1, ov = null;
      for (const e of effects) {
        const k = KIND[e.kind];
        if (k.op === 'add') add += k.mag * e.stacks;
        else if (k.op === 'mul') mul += (k.mag - 1) * e.stacks;
        else if (k.op === 'div') div += (k.mag - 1) * e.stacks;
        else ov = k.mag;                       // 마지막 고정 값이 이김
      }
      const value = ov !== null ? ov : ((base + add) * Math.max(0, mul)) / Math.max(1e-6, div);
      return { add, mul, div, ov, value };
    }

    // A: 받은 연산을 그대로 값에 적용. 제거는 역연산
    function naiveOp(op, mag, removing) {
      const before = naive;
      if (op === 'add') naive += removing ? -mag : mag;
      else if (op === 'mul') naive = removing ? naive / mag : naive * mag;
      else if (op === 'div') naive = removing ? naive * mag : naive / mag;
      else if (op === 'override') naive = removing ? base : mag; // 이전 값을 몰라서 기본값으로 되돌림
      else if (op === 'base') naive += mag;
      if (P.intStore) naive = Math.round(naive);
      return before;
    }
    function pushLog(text) { log.push(text); if (log.length > 6) log.shift(); marks.push(hist.length); }

    function apply(kind) {
      const k = KIND[kind];
      const before = naive;
      if (k.stack) {
        const ex = effects.find((e) => e.kind === kind);
        if (ex) {
          if (ex.stacks >= P.stackLimit) { pushLog(GTL.L(`${k.name()} 최대 중첩, 시간만 갱신`, `${k.name()} at max stacks, duration refreshed`)); return; }
          ex.stacks++; naiveOp(k.op, k.mag, false);
          pushLog(`${k.name()} ×${ex.stacks}   A: ${fmt(before)} → ${fmt(naive)}`);
          return;
        }
      }
      effects.push({ id: nextId++, kind, stacks: 1 });
      naiveOp(k.op, k.mag, false);
      pushLog(GTL.L(`${k.name()} 추가`, `add ${k.name()}`) + `   A: ${fmt(before)} → ${fmt(naive)}`);
    }
    function remove(idx) {
      const e = effects[idx];
      if (!e) return;
      const k = KIND[e.kind], before = naive;
      for (let i = 0; i < e.stacks; i++) naiveOp(k.op, k.mag, true);
      effects.splice(idx, 1);
      pushLog(GTL.L(`${k.name()} 제거`, `remove ${k.name()}`) + `   A: ${fmt(before)} → ${fmt(naive)}`);
    }
    function levelUp() {
      const before = naive;
      base += 5; naiveOp('base', 5, false);
      pushLog(GTL.L('레벨 업, 기본값 +5', 'level up, base +5') + `   A: ${fmt(before)} → ${fmt(naive)}`);
    }
    function clearAll() {
      while (effects.length) remove(effects.length - 1);
      clears++;
    }
    const fmt = (v) => (Math.abs(v - Math.round(v)) < 0.005 ? String(Math.round(v)) : v.toFixed(2));

    // 자동 진행: 시드 난수로 효과를 넣고 지움. 14번마다 전부 지우고, 세 번째 전체 제거 뒤에는 처음부터
    function autoStep() {
      const r = ctx.rng;
      autoN++;
      if (autoN % 14 === 0) {
        if (clears >= 2) { init(); autoN = 1; return; }
        clearAll(); return;
      }
      if (effects.length >= 4 || (effects.length && r.chance(0.3))) { remove(r.int(0, effects.length - 1)); return; }
      const roll = r.next();
      if (roll < 0.3) apply('addFlat');
      else if (roll < 0.55) apply('addPct');
      else if (roll < 0.72) apply('debuff');
      else if (roll < 0.84) apply('curse');
      else if (roll < 0.93) apply('fix');
      else levelUp();
    }

    return {
      update(dt) {
        if (P.auto) { autoT -= dt; if (autoT <= 0) { autoT = 0.9; autoStep(); } }
        sampleT += dt;
        while (sampleT >= SAMPLE) {
          sampleT -= SAMPLE;
          hist.push(naive); histRef.push(aggregate().value);
          if (hist.length > HIST) { hist.shift(); histRef.shift(); marks = marks.map((m) => m - 1).filter((m) => m >= 0); }
        }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const isA = P.mode === 'mutate';
        const col = isA ? C.a : C.b;
        const agg = aggregate();
        const mine = isA ? naive : agg.value;

        // 위: 현재 값
        D.text(g, GTL.L('공격력 현재 값', 'Attack, current value'), 12, 10, { size: 12, color: C.dim });
        D.text(g, fmt(mine), 12, 26, { size: 30, color: col, font: 'bold 30px sans-serif' });
        D.text(g, GTL.L(`기본값 ${base}`, `Base ${base}`), 130, 30, { size: 13, color: C.text });
        if (isA) {
          const diff = naive - agg.value;
          D.text(g, GTL.L(`집계 결과 ${fmt(agg.value)}, 차이 ${diff >= 0 ? '+' : ''}${fmt(diff)}`, `Aggregated ${fmt(agg.value)}, diff ${diff >= 0 ? '+' : ''}${fmt(diff)}`), 130, 48, { size: 12, color: Math.abs(diff) > 0.005 ? C.bad : C.good });
        } else {
          D.text(g, GTL.L('효과 목록이 같으면 항상 같은 값', 'Same effect list, same value'), 130, 48, { size: 12, color: C.good });
        }

        // 가운데: 값 기록 그래프
        const gx = 40, gy = 70, gw = W - 52, gh = Math.max(60, H * 0.42 - 20);
        let lo = Math.min(BASE0, ...hist, ...histRef), hi = Math.max(BASE0, ...hist, ...histRef);
        if (hi - lo < 20) { const m = (hi + lo) / 2; lo = m - 10; hi = m + 10; }
        lo -= (hi - lo) * 0.08; hi += (hi - lo) * 0.08;
        const Y = (v) => gy + gh - ((v - lo) / (hi - lo)) * gh;
        const X = (i) => gx + (i / (HIST - 1)) * gw;
        D.rect(g, gx, gy, gw, gh, '#171b22', '#2a303b', 1);
        for (const v of [lo + (hi - lo) * 0.1, (lo + hi) / 2, hi - (hi - lo) * 0.1]) {
          D.line(g, gx, Y(v), gx + gw, Y(v), '#252b35', 1);
          D.text(g, v.toFixed(0), gx - 4, Y(v) - 6, { size: 10, color: C.dim, align: 'right' });
        }
        g.setLineDash([3, 4]); D.line(g, gx, Y(base), gx + gw, Y(base), C.dim, 1); g.setLineDash([]);
        for (const m of marks) D.line(g, X(m), gy, X(m), gy + gh, 'rgba(255,255,255,0.08)', 1);
        const path = (arr, color, lw, dash) => {
          if (arr.length < 2) return;
          if (dash) g.setLineDash(dash);
          g.strokeStyle = color; g.lineWidth = lw; g.beginPath();
          arr.forEach((v, i) => (i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v))));
          g.stroke(); g.setLineDash([]);
        };
        if (isA) { path(histRef, C.b, 1.5, [5, 4]); path(hist, C.a, 2); }
        else path(histRef, C.b, 2);
        D.text(g, isA ? GTL.L('주황: A 값, 파란 점선: 집계 결과', 'Orange: A value, blue dashed: aggregated') : GTL.L('파랑: 집계 결과', 'Blue: aggregated'), gx + 6, gy + 4, { size: 10, color: C.dim });

        // 아래: 효과 목록과 계산
        let y = gy + gh + 14;
        D.text(g, GTL.L(`활성 효과 (${effects.length})`, `Active effects (${effects.length})`), 12, y, { size: 12, color: C.text });
        effects.forEach((e, i) => {
          const k = KIND[e.kind];
          const x = 12 + (i % 4) * Math.min(120, (W - 24) / 4), yy = y + 18 + Math.floor(i / 4) * 22;
          D.rect(g, x, yy, Math.min(112, (W - 24) / 4 - 8), 18, '#222833', col, 1);
          D.text(g, `#${e.id} ${k.name()}${e.stacks > 1 ? ' ×' + e.stacks : ''} ${k.label}`, x + 5, yy + 3, { size: 10, color: C.text });
        });
        if (!effects.length) D.text(g, GTL.L('없음', 'none'), 12, y + 20, { size: 11, color: C.dim });
        y += 18 + Math.max(1, Math.ceil(effects.length / 4)) * 22 + 4;
        if (isA) {
          D.text(g, GTL.L('A가 실제로 한 연산 (최근)', 'Operations A actually did (recent)'), 12, y, { size: 11, color: C.dim });
          log.slice().reverse().forEach((s, i) => { if (y + 16 + i * 14 < H - 8) D.text(g, s, 12, y + 16 + i * 14, { size: 11, color: i ? C.dim : C.text, font: '11px monospace' }); });
        } else {
          const ovTxt = agg.ov !== null ? GTL.L(`  고정 ${agg.ov} 적용`, `  override ${agg.ov} applies`) : '';
          D.text(g, GTL.L('집계 계산', 'Aggregation'), 12, y, { size: 11, color: C.dim });
          D.text(g, `(${base} + ${fmt(agg.add)}) × ${agg.mul.toFixed(2)} ÷ ${agg.div.toFixed(2)} = ${fmt(((base + agg.add) * Math.max(0, agg.mul)) / agg.div)}${ovTxt}`, 12, y + 16, { size: 12, color: C.b, font: '12px monospace' });
          D.text(g, GTL.L('더하기 합, 1 + 배율 보너스 합, 1 + 나누기 보너스 합', 'sum of adds, 1 + sum of bonuses, 1 + sum of divides'), 12, y + 34, { size: 10, color: C.dim });
        }

        ctx.stat(GTL.L('현재 값', 'Current value'), fmt(mine));
        ctx.stat(GTL.L('집계 결과와 차이', 'Diff from aggregated'), fmt(mine - agg.value));
        ctx.stat(GTL.L('활성 효과 수', 'Active effects'), effects.length);
      },
      onAction(key) {
        if (KIND[key]) apply(key);
        else if (key === 'levelUp') levelUp();
        else if (key === 'removeOld') remove(0);
        else if (key === 'clearAll') clearAll();
        else if (key === 'restart') init();
      },
    };
  },
});
