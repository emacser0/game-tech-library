// 목록 가상화: 전체 항목 그리기 vs 보이는 항목만 그리기
GTL.register({
  id: 'list-virtualization',
  title: '목록 가상화: 1만 개 항목 스크롤',
  summary: '인벤토리나 친구 목록의 항목 1만 개를 전부 배치하고 그리면 프레임 비용이 항목 수에 비례해서 늘어남. 가상화는 화면에 보이는 십여 개만 그려서 목록 길이와 관계없이 비용이 일정함.',
  views: { a: '전체 그리기', b: '가상화' },
  controls: '마우스 휠로 스크롤. 오른쪽 스크롤바를 드래그해도 됨. 자동 스크롤은 무작위 위치로 점프함.',
  info: `
    <p><b>목록 가상화</b>(list virtualization)는 긴 목록에서 화면에 보이는 항목만 만들고 그리는 방법. 화면 밖 항목은 위치만 계산하고 건너뜀.</p>
    <p>필요한 이유: 항목 하나에 배경, 아이콘, 글자 두 줄, 게이지가 있으면 그리기 호출이 7번. 1만 개면 7만 번. 대부분은 화면 밖이라 보이지도 않음.</p>
    <p>동작 원리:</p>
    <ul>
      <li>높이가 모두 같으면 첫 항목 = <code>floor(스크롤 / 항목 높이)</code>. 계산 한 번으로 끝남.</li>
      <li>높이가 다르면 시작 위치의 누적합 배열을 미리 만들고 이분 탐색으로 첫 항목을 찾음. 비교는 약 log2(n)번.</li>
      <li>화면 아래 끝을 넘을 때까지 이어서 그림. 위아래로 몇 개 더 그려 두면(overscan) 빠른 스크롤에서 빈칸이 덜 보임.</li>
      <li>엔진 UI에서는 화면에 보이는 수만큼만 항목 위젯을 만들고, 스크롤할 때 내용만 바꿔 재사용함.</li>
    </ul>
    <p>단점: 항목 높이를 미리 알아야 함. 내용에 따라 높이가 바뀌면 누적합을 다시 계산해야 함. 화면 밖 항목에 포커스나 애니메이션 상태를 두기 어려움.</p>`,
  // 도식: 긴 목록과 화면 창, 보이는 항목 + overscan만 그림. 누적합 배열 이분 탐색으로 첫 항목을 찾음
  diagram: (L) => {
    const hs = [10, 10, 16, 10, 12, 10, 18, 10, 10, 14, 10, 10, 10];
    const off = [0]; hs.forEach((h) => off.push(off[off.length - 1] + h));
    const top = 14, vy0 = 56, vy1 = 112, sc = vy0 - top; // 화면 창은 목록 좌표 42~98
    const items = hs.map((h, i) => {
      const y = top + off[i], vis = y + h > vy0 && y < vy1;
      const over = !vis && (y + h > vy0 - 12 && y < vy1 + 12);
      return `<rect x="30" y="${y}" width="90" height="${h - 1}" class="${vis ? 'f-b' : 'f-dim'}"${over ? ' opacity="0.45"' : ''}/>`;
    }).join('');
    const cells = off.slice(0, 8).map((v, i) => `<rect x="${200 + i * 40}" y="44" width="38" height="20" class="f-dim"/><text x="${219 + i * 40}" y="58" text-anchor="middle" class="t-small t-mono">${v}</text>`).join('');
    return `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    ${items}
    <rect x="24" y="${vy0}" width="102" height="${vy1 - vy0}" class="d-accent"/>
    <text x="130" y="${vy0 + 12}" class="t-small">${L('화면', 'view')}</text>
    <path d="M14,${top} L14,${vy0}" class="d-accent" marker-start="url(#arr)" marker-end="url(#arr)"/>
    <text x="4" y="${top - 4}" class="t-small t-mono">scroll=${sc}</text>
    <text x="130" y="${vy1 + 10}" class="t-small t-dim">overscan</text>
    <text x="30" y="178" class="t-small t-a">${L('A: 1만 개 모두 그림', 'A: draws all 10,000')}</text>
    <text x="30" y="191" class="t-small t-b">${L('B: 화면 + overscan만', 'B: view + overscan only')}</text>
    <text x="200" y="34" class="t-small">${L('시작 위치 누적합 offsets[i]', 'Prefix sum of start positions, offsets[i]')}</text>
    ${cells}
    <text x="219" y="78" text-anchor="middle" class="t-small t-mono">lo</text>
    <text x="379" y="78" text-anchor="middle" class="t-small t-mono">mid</text>
    <text x="499" y="78" text-anchor="middle" class="t-small t-mono">hi</text>
    <text x="200" y="104" class="t-small">${L('offsets[mid] ≤ scroll이면 lo = mid, 아니면 hi = mid - 1', 'If offsets[mid] ≤ scroll, lo = mid. Else hi = mid - 1')}</text>
    <text x="200" y="120" class="t-small t-dim">${L('비교 약 log2(n)번. 1만 개면 약 14번', 'About log2(n) comparisons, about 14 for 10,000')}</text>
    <text x="200" y="146" class="t-small">${L('높이가 모두 같으면', 'If all heights are equal')}</text>
    <text x="200" y="160" class="t-small t-mono">first = floor(scroll / h)</text>
    <text x="200" y="178" class="t-small t-dim">${L('첫 항목부터 화면 아래 끝을 넘을 때까지 그림', 'Draw from the first item until past the bottom of the view')}</text>
  </svg>`;
  },
  look: [
    'A의 프레임 비용(⏱)과 "목록 처리 시간"이 B보다 훨씬 큼. B의 "그린 항목 수"는 십여 개에서 변하지 않음.',
    '"항목 수"를 1000에서 20000으로 바꾸면 A의 비용은 함께 커지고 B는 거의 그대로.',
    '"가변 높이"를 켜면 B의 "첫 항목 찾기 비교 횟수"가 약 14번(log2 10000)이 됨. A는 매 프레임 1만 개의 위치를 더함.',
    'B의 overscan을 0으로 하면 그린 항목 수가 최소가 됨. 실제 엔진에서는 빠른 스크롤 중 빈칸을 줄이려고 2~3개를 더 둠.',
  ],
  refs: [
    { type: 'engine', title: 'Unity UI Toolkit - ListView', url: 'https://docs.unity3d.com/Manual/UIE-uxml-element-ListView.html', note: '보이는 항목만 만들고 makeItem, bindItem으로 재사용.' },
    { type: 'engine', title: 'Android Developers - Create dynamic lists with RecyclerView', url: 'https://developer.android.com/develop/ui/views/layout/recyclerview' },
    { type: 'code', title: 'react-window (Brian Vaughn)', url: 'https://github.com/bvaughn/react-window', note: '고정 높이와 가변 높이 목록 가상화 라이브러리.' },
  ],
  params: [
    { key: 'count', label: '항목 수', type: 'int', min: 1000, max: 20000, step: 1000, default: 10000, shared: true, reset: true, group: '목록' },
    { key: 'varHeight', label: '가변 높이', type: 'bool', default: false, shared: true, reset: true, help: '설명이 있는 항목은 더 높음' },
    { key: 'auto', label: '자동 스크롤', type: 'bool', default: true, shared: true },
    { key: 'mode', label: '그리기 방식', type: 'select', group: '방식', options: [
      { value: 'all', label: '전체 그리기' },
      { value: 'virtual', label: '가상화 (보이는 항목만)' },
    ], a: 'all', b: 'virtual' },
    { key: 'overscan', label: 'overscan (위아래 추가 항목)', type: 'int', min: 0, max: 10, default: 2, when: (p) => p.mode === 'virtual' },
  ],
  en: {
    title: 'List Virtualization: Scrolling 10,000 Items',
    summary: 'If you lay out and draw all 10,000 items of an inventory or friend list, frame cost grows with the item count. Virtualization draws only the dozen or so items on screen, so the cost stays flat at any list length.',
    views: { a: 'Draw all', b: 'Virtualized' },
    controls: 'Scroll with the mouse wheel. You can also drag the scrollbar on the right. Auto scroll jumps to random positions.',
    info: `
    <p><b>List virtualization</b> creates and draws only the items you can see in a long list. Items off screen only get a position, then are skipped.</p>
    <p>Why you need it: if one item has a background, an icon, two lines of text, and a gauge, it takes 7 draw calls. 10,000 items take 70,000 calls. Most of them are off screen and never seen.</p>
    <p>How it works:</p>
    <ul>
      <li>If all items have the same height, first item = <code>floor(scroll / item height)</code>. One calculation is enough.</li>
      <li>If heights differ, build a prefix sum array of start positions ahead of time. Find the first item with a binary search. It takes about log2(n) comparisons.</li>
      <li>Keep drawing until you pass the bottom of the view. Drawing a few extra items above and below (overscan) shows fewer gaps during fast scrolling.</li>
      <li>Engine UIs create only as many item widgets as fit on screen. When you scroll, they reuse the widgets and only change their content.</li>
    </ul>
    <p>Downside: you must know item heights ahead of time. If height depends on content, you must rebuild the prefix sums. Keeping focus or animation state on off screen items is hard.</p>`,
    look: [
      'A\'s frame cost (⏱) and "List time" are much larger than B\'s. B\'s "Items drawn" stays at about a dozen.',
      'Change "Item count" from 1000 to 20000. A\'s cost grows with it. B stays almost the same.',
      'Turn on "Variable height". B\'s "First item search comparisons" becomes about 14 (log2 10000). A adds up 10,000 positions every frame.',
      'Set B\'s overscan to 0. Items drawn drops to the minimum. Real engines keep 2~3 extra items to reduce gaps during fast scrolling.',
    ],
    refs: [
      'Creates only the visible items and reuses them with makeItem and bindItem.',
      null,
      'A list virtualization library for fixed and variable height lists.',
    ],
    params: {
      count: { label: 'Item count', group: 'List' },
      varHeight: { label: 'Variable height', help: 'Items with a description are taller' },
      auto: 'Auto scroll',
      mode: { label: 'Draw mode', group: 'Method', options: { all: 'Draw all', virtual: 'Virtualized (visible items only)' } },
      overscan: 'overscan (extra items above and below)',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const BASE_H = 40;
    const RARITY = ['#9aa3b2', '#66d17a', '#4fc3f7', '#c792ea', '#ffcb6b'];
    const NAMES = GTL.L(['검', '방패', '물약', '두루마리', '반지', '활', '지팡이', '갑옷', '보석', '열쇠'], ['Sword', 'Shield', 'Potion', 'Scroll', 'Ring', 'Bow', 'Staff', 'Armor', 'Gem', 'Key']);
    let n, heights, offsets, rarity, lvl, desc, scroll, target, t, jumpTimer, dragBar, total;
    let drawn, calls, compares, listMs = 0;

    function init() {
      ctx.rng = U.rng(ctx.seed);
      const r = ctx.rng;
      n = P.count;
      heights = new Float32Array(n); offsets = new Float64Array(n + 1);
      rarity = new Uint8Array(n); lvl = new Uint8Array(n); desc = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        rarity[i] = Math.min(4, Math.floor(r.next() ** 2.2 * 5));
        lvl[i] = r.int(1, 99);
        desc[i] = P.varHeight && r.chance(0.35) ? 1 : 0;
        heights[i] = BASE_H + (desc[i] ? r.int(14, 40) : 0);
        offsets[i + 1] = offsets[i] + heights[i];
      }
      total = offsets[n];
      scroll = 0; target = 0; t = 0; jumpTimer = 1.5; dragBar = false;
    }
    init();

    // 누적합 배열에서 y가 들어 있는 항목을 이분 탐색
    function findFirst(y) {
      let lo = 0, hi = n - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        compares++;
        if (offsets[mid] <= y) lo = mid; else hi = mid - 1;
      }
      return lo;
    }

    function drawItem(g, i, x, y, w) {
      const h = heights[i];
      D.rect(g, x, y, w, h - 2, i % 2 ? '#1d222b' : '#222833');
      D.circle(g, x + 20, y + 19, 12, RARITY[rarity[i]]);
      D.text(g, `${NAMES[i % NAMES.length]} #${i}`, x + 40, y + 6, { size: 12, color: '#fff' });
      D.text(g, desc[i] ? GTL.L(`Lv ${lvl[i]}  설명이 있는 긴 항목`, `Lv ${lvl[i]}  Long item with a description`) : `Lv ${lvl[i]}`, x + 40, y + 22, { size: 10, color: C.dim });
      D.rect(g, x + w - 90, y + 16, 70, 6, '#333a46');
      D.rect(g, x + w - 90, y + 16, 70 * (lvl[i] / 99), 6, RARITY[rarity[i]]);
      calls += 6;
    }

    return {
      update(dt) {
        t += dt;
        const m = ctx.input.mouse;
        const H = ctx.height, viewH = H - 60, maxScroll = Math.max(0, total - viewH);
        const barX = ctx.width - 22;
        if (m.pressed && m.inside && m.x >= barX - 6) dragBar = true;
        if (!m.down) dragBar = false;
        if (dragBar) { target = U.clamp((m.y - 40) / viewH, 0, 1) * maxScroll; scroll = target; jumpTimer = 3; }
        if (m.inside && m.wheel) { target = U.clamp(target + m.wheel * 160, 0, maxScroll); jumpTimer = 3; }
        if (P.auto) {
          jumpTimer -= dt;
          if (jumpTimer <= 0) { jumpTimer = 2.5; target = ctx.rng.range(0, maxScroll); }
        }
        scroll = U.clamp(U.damp(scroll, target, 6, dt), 0, maxScroll);
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        const lx = 12, ly = 40, lw = W - 48, lh = H - 60;
        drawn = 0; calls = 0; compares = 0;
        const t0 = ctx.now();
        g.save(); g.beginPath(); g.rect(lx, ly, lw, lh); g.clip();
        if (P.mode === 'all') {
          // 순진한 방식: 매 프레임 모든 항목의 위치를 다시 더하고 전부 그림. 화면 밖은 캔버스가 잘라낼 뿐
          let y = ly - scroll;
          for (let i = 0; i < n; i++) { drawItem(g, i, lx, y, lw); y += heights[i]; drawn++; }
        } else {
          let first;
          if (P.varHeight) first = findFirst(scroll);
          else { first = Math.floor(scroll / BASE_H); compares = 1; }
          first = Math.max(0, first - P.overscan);
          let extra = 0;
          for (let i = first; i < n; i++) {
            const y = ly + offsets[i] - scroll;
            if (y > ly + lh) { if (extra++ >= P.overscan) break; }
            drawItem(g, i, lx, y, lw); drawn++;
          }
        }
        g.restore();
        listMs = listMs ? listMs * 0.9 + (ctx.now() - t0) * 0.1 : ctx.now() - t0;
        D.rect(g, lx, ly, lw, lh, null, 'rgba(255,255,255,0.25)', 1);

        // 스크롤바
        const bx = W - 22, viewFrac = Math.min(1, lh / total);
        const maxScroll = Math.max(1, total - lh);
        D.rect(g, bx, ly, 10, lh, '#1d222b');
        D.rect(g, bx, ly + (scroll / maxScroll) * lh * (1 - viewFrac), 10, Math.max(8, lh * viewFrac), col);

        const firstVis = P.varHeight ? (() => { const c = compares; const f = findFirst(scroll); compares = c; return f; })() : Math.floor(scroll / BASE_H);
        D.text(g, GTL.L(`항목 ${n.toLocaleString()}개, 맨 위 #${firstVis}`, `${n.toLocaleString()} items, top #${firstVis}`), 12, 12, { size: 13, color: col });

        ctx.stat(GTL.L('그린 항목 수', 'Items drawn'), drawn.toLocaleString());
        ctx.stat(GTL.L('그리기 호출 수', 'Draw calls'), calls.toLocaleString());
        ctx.stat(GTL.L('목록 처리 시간', 'List time'), listMs.toFixed(2) + ' ms');
        ctx.stat(GTL.L('첫 항목 찾기 비교 횟수', 'First item search comparisons'), P.mode === 'all' ? GTL.L('- (전체 순회)', '- (full scan)') : compares);
      },
    };
  },
});
