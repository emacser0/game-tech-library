// 텍스트 넘침 처리: 고정 크기 한 줄 vs 줄바꿈 + 자동 축소 (번역 문자열 길이 변화)
GTL.register({
  id: 'text-overflow',
  title: '텍스트 넘침 처리: 번역 문자열과 자동 축소',
  summary: '한국어나 영어에 맞춘 버튼에 독일어, 러시아어 번역을 넣으면 글자가 버튼 밖으로 넘침. 줄바꿈과 자동 축소를 쓰면 같은 버튼 크기에서도 모든 문자열이 안에 들어감.',
  views: { a: '고정 크기 한 줄', b: '줄바꿈 + 자동 축소' },
  demoHangul: true,                // 한국어 버튼 문구가 시연 데이터. 영어 모드에서도 그대로 그림
  controls: '조작 없음. 언어가 자동으로 바뀜. 자동 순환을 끄면 언어를 직접 고름.',
  info: `
    <p><b>텍스트 넘침</b>은 문자열이 UI 상자보다 길어서 밖으로 삐져나오거나 잘리는 문제. 현지화(localization)에서 가장 흔한 버그.</p>
    <p>번역하면 길이가 달라짐. 영어 기준으로 독일어, 러시아어, 핀란드어는 짧은 문구에서 길이가 크게 늘어남. 독일어는 띄어쓰기 없는 합성어가 많아서 줄바꿈도 어려움.</p>
    <p>처리 방식:</p>
    <ul>
      <li><b>말줄임</b>: 넘치는 부분을 "…"로 자름. 간단하지만 뜻이 사라질 수 있음.</li>
      <li><b>줄바꿈</b>: 단어 단위로 줄을 나눔. 단어 하나가 너무 길면 글자 단위로 나눔.</li>
      <li><b>자동 축소</b>(auto size, best fit): 줄바꿈한 결과가 상자에 들어갈 때까지 글자 크기를 줄임. 이분 탐색으로 가장 큰 크기를 찾음.</li>
      <li><b>의사 지역화</b>(pseudo-localization): 번역 전에 글자를 악센트 문자로 바꾸고 길이를 약 40% 늘린 가짜 문자열로 미리 검사함.</li>
    </ul>
    <p>단점: 자동 축소는 글자 크기 측정(<code>measureText</code>)을 여러 번 호출함. 문자열이나 상자 크기가 바뀔 때만 다시 계산하고 결과를 저장해 둬야 함. 너무 작아진 글자는 읽기 어려우므로 최소 크기를 정해 둠.</p>`,
  // 도식: 한 줄 고정 크기(넘침) vs 줄바꿈 + 자동 축소, 아래는 자동 축소 계산 순서
  diagram: (L) => `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="20" y="18" class="t-a">${L('A: 한 줄, 고정 크기', 'A: one line, fixed size')}</text>
    <rect x="20" y="26" width="130" height="36" rx="4" class="d-a"/>
    <text x="28" y="48" class="t-mono">Einstellungsmenü öffnen</text>
    <text x="20" y="76" class="t-small t-a">${L('상자 밖으로 넘침', 'Spills out of the box')}</text>
    <text x="250" y="18" class="t-b">${L('B: 줄바꿈 + 자동 축소', 'B: wrap + auto size')}</text>
    <rect x="250" y="26" width="130" height="36" rx="4" class="d-b"/>
    <text x="315" y="41" text-anchor="middle" class="t-small t-mono">Einstellungsmenü</text>
    <text x="315" y="54" text-anchor="middle" class="t-small t-mono">öffnen</text>
    <text x="250" y="76" class="t-small t-b">${L('같은 상자 안에 들어감', 'Fits in the same box')}</text>
    <rect x="10" y="118" width="96" height="30" rx="4" class="f-dim"/>
    <text x="58" y="137" text-anchor="middle" class="t-small">${L('단어 단위 줄바꿈', 'Wrap by word')}</text>
    <rect x="140" y="118" width="100" height="30" rx="4" class="f-dim"/>
    <text x="190" y="137" text-anchor="middle" class="t-small">${L('상자에 들어가나?', 'Fits the box?')}</text>
    <rect x="280" y="118" width="110" height="30" rx="4" class="f-dim"/>
    <text x="335" y="137" text-anchor="middle" class="t-small">${L('글자 크기 이분 탐색', 'Binary search size')}</text>
    <rect x="430" y="118" width="100" height="30" rx="4" class="f-dim"/>
    <text x="480" y="137" text-anchor="middle" class="t-small">${L('결과 저장', 'Cache result')}</text>
    <path d="M106,133 L138,133" class="d-accent" marker-end="url(#arr)"/>
    <path d="M240,133 L278,133" class="d-accent" marker-end="url(#arr)"/>
    <text x="259" y="127" text-anchor="middle" class="t-small t-dim">${L('넘침', 'no')}</text>
    <path d="M335,148 Q335,176 200,176 Q58,176 58,150" class="d-accent" marker-end="url(#arr)"/>
    <text x="200" y="190" text-anchor="middle" class="t-small t-dim">${L('더 작은 크기로 다시 줄바꿈', 'Wrap again at a smaller size')}</text>
    <path d="M190,118 Q190,96 330,96 Q480,96 480,116" class="d-accent" marker-end="url(#arr)"/>
    <text x="330" y="91" text-anchor="middle" class="t-small t-dim">${L('들어감: 가장 큰 크기 확정', 'fits: largest size found')}</text>
    <text x="420" y="168" class="t-small t-dim">${L('문자열이나 상자가', 'Recompute only when')}</text>
    <text x="420" y="181" class="t-small t-dim">${L('바뀔 때만 다시 계산', 'text or box changes')}</text>
  </svg>`,
  look: [
    '처음 화면(독일어)에서 A의 "Speichern und beenden", "Sprachchat-Einstellungen"이 버튼 밖으로 넘침(빨간 테두리). B는 줄을 나누거나 글자를 줄여서 안에 들어감.',
    '자동 순환을 끄고 언어를 "의사 지역화"로 고르면 A에서 넘치는 버튼 수가 가장 많음. 번역 전에 넘침을 찾는 용도.',
    'B의 "최소 글자 크기"를 16으로 올리면 축소할 수 없어서 마지막 줄이 말줄임으로 잘림.',
    '버튼 너비를 260으로 늘리면 A의 넘침이 줄어듦. 대신 한국어에서는 버튼이 텅 빈 것처럼 보임.',
  ],
  refs: [
    { type: 'article', title: 'W3C Internationalization - Text size in translation', url: 'https://www.w3.org/International/articles/article-text-size.en', note: '원문 길이별 번역 후 길이 증가 비율.' },
    { type: 'engine', title: 'Godot - Label (autowrap_mode, text_overrun_behavior)', url: 'https://docs.godotengine.org/en/stable/classes/class_label.html' },
    { type: 'engine', title: 'TextMeshPro - Auto Size 옵션', note: 'Unity TextMeshPro 컴포넌트의 최소, 최대 글자 크기 사이 자동 맞춤.' },
    { type: 'article', title: 'MDN - text-overflow', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/text-overflow', note: '웹 CSS의 말줄임 처리.' },
  ],
  params: [
    { key: 'lang', label: '언어', type: 'select', group: '장면', shared: true, options: [
      { value: 'ko', label: '한국어' },
      { value: 'en', label: '영어' },
      { value: 'de', label: '독일어' },
      { value: 'ru', label: '러시아어' },
      { value: 'pseudo', label: '의사 지역화 (영어 +40%)' },
    ], default: 'de' },
    { key: 'cycle', label: '언어 자동 순환', type: 'bool', default: true, shared: true },
    { key: 'boxW', label: '버튼 너비 (px)', type: 'int', min: 100, max: 260, default: 150, shared: true },
    { key: 'boxH', label: '버튼 높이 (px)', type: 'int', min: 30, max: 80, default: 46, shared: true },
    { key: 'base', label: '기본 글자 크기', type: 'int', min: 10, max: 24, default: 16, shared: true },
    { key: 'mode', label: '넘침 처리', type: 'select', group: '텍스트', options: [
      { value: 'fixed', label: '고정 크기 한 줄 (처리 없음)' },
      { value: 'ellipsis', label: '말줄임 (…)' },
      { value: 'wrap', label: '줄바꿈' },
      { value: 'fit', label: '줄바꿈 + 자동 축소' },
    ], a: 'fixed', b: 'fit' },
    { key: 'minFont', label: '최소 글자 크기', type: 'int', min: 6, max: 16, default: 9, when: (p) => p.mode === 'fit' },
  ],
  en: {
    title: 'Text Overflow: Translated Strings and Auto Size',
    summary: 'Buttons sized for Korean or English overflow when you put German or Russian text in them. With line wrapping and auto size, every string fits in the same button size.',
    views: { a: 'Fixed size, one line', b: 'Wrap + auto size' },
    controls: 'No input. The language changes on its own. Turn off auto cycle to pick a language yourself.',
    info: `
    <p><b>Text overflow</b> happens when a string is longer than its UI box, so it spills out or gets cut. It is the most common bug in localization.</p>
    <p>Translation changes length. Compared with English, short phrases in German, Russian, and Finnish get much longer. German has many compound words without spaces, so wrapping is also hard.</p>
    <p>Ways to handle it:</p>
    <ul>
      <li><b>Ellipsis</b>: cut the overflow and show "…". It is simple, but the meaning can get lost.</li>
      <li><b>Wrapping</b>: break lines at word boundaries. If one word is too long, break it by characters.</li>
      <li><b>Auto size</b> (best fit): shrink the font until the wrapped text fits the box. A binary search finds the largest size.</li>
      <li><b>Pseudo-localization</b>: before translation, test with fake strings. They swap letters for accented ones and are about 40% longer.</li>
    </ul>
    <p>Downside: auto size calls text measurement (<code>measureText</code>) many times. Recompute only when the string or box size changes, and cache the result. Very small text is hard to read, so set a minimum size.</p>`,
    look: [
      'On the first screen (German), A\'s "Speichern und beenden" and "Sprachchat-Einstellungen" spill out of their buttons (red outline). B wraps lines or shrinks the text so it fits.',
      'Turn off auto cycle and pick "Pseudo-localization". A has the most overflowing buttons. This is how you find overflow before translation.',
      'Raise B\'s "Min font size" to 16. B cannot shrink, so the last line gets cut with an ellipsis.',
      'Widen the buttons to 260. A overflows less. But in Korean, the buttons look almost empty.',
    ],
    refs: [
      'How much text grows after translation, by source length.',
      null,
      { title: 'TextMeshPro - Auto Size option', note: 'The Unity TextMeshPro component fits text between a min and max font size.' },
      'Ellipsis handling in web CSS.',
    ],
    params: {
      lang: { label: 'Language', group: 'Scene', options: { ko: 'Korean', en: 'English', de: 'German', ru: 'Russian', pseudo: 'Pseudo-localization (English +40%)' } },
      cycle: 'Auto cycle language',
      boxW: 'Button width (px)',
      boxH: 'Button height (px)',
      base: 'Base font size',
      mode: { label: 'Overflow handling', group: 'Text', options: { fixed: 'Fixed size, one line (none)', ellipsis: 'Ellipsis (…)', wrap: 'Wrap', fit: 'Wrap + auto size' } },
      minFont: 'Min font size',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const TEXT = {
      ko: ['게임 시작', '설정', '인벤토리', '저장하고 종료', '음성 채팅 설정', '일일 보상 받기'],
      en: ['Start Game', 'Settings', 'Inventory', 'Save and Quit', 'Voice Chat Settings', 'Claim Daily Reward'],
      de: ['Spiel starten', 'Einstellungen', 'Inventar', 'Speichern und beenden', 'Sprachchat-Einstellungen', 'Tägliche Belohnung abholen'],
      ru: ['Начать игру', 'Настройки', 'Инвентарь', 'Сохранить и выйти', 'Настройки голосового чата', 'Получить ежедневную награду'],
    };
    // 의사 지역화: 악센트 문자로 바꾸고 길이를 약 40% 늘림
    const ACC = { a: 'å', c: 'ç', e: 'é', g: 'ĝ', i: 'î', n: 'ñ', o: 'ö', s: 'š', t: 'ţ', u: 'ü', y: 'ý', S: 'Š', C: 'Ç', A: 'Å', V: 'Ṽ', I: 'Î', G: 'Ĝ' };
    TEXT.pseudo = TEXT.en.map((s) => '[' + [...s].map((ch) => ACC[ch] || ch).join('') + ' ' + '~'.repeat(Math.ceil(s.length * 0.4)) + ']');
    const CYCLE = ['de', 'ru', 'pseudo', 'en', 'ko'];
    const FONT = (size) => `${size}px system-ui, "Segoe UI", sans-serif`;
    const PAD = 8;

    let t = 0, lang = P.lang, cacheKey = '', layout = [], measureCalls = 0, layoutMs = 0;
    const g0 = ctx.g;
    const measure = (s) => { measureCalls++; return g0.measureText(s).width; };

    // 단어 단위 줄바꿈. 단어가 maxW보다 길면 글자 단위로 나눔
    function wrap(str, size, maxW) {
      g0.font = FONT(size);
      const words = str.split(' ');
      const lines = [];
      let cur = '';
      for (const w0 of words) {
        let w = w0;
        const tryLine = cur ? cur + ' ' + w : w;
        if (measure(tryLine) <= maxW) { cur = tryLine; continue; }
        if (cur) { lines.push(cur); cur = ''; }
        while (measure(w) > maxW && w.length > 1) {
          let k = w.length - 1;
          while (k > 1 && measure(w.slice(0, k)) > maxW) k--;
          lines.push(w.slice(0, k)); w = w.slice(k);
        }
        cur = w;
      }
      if (cur) lines.push(cur);
      return lines;
    }
    function ellipsize(str, size, maxW) {
      g0.font = FONT(size);
      if (measure(str) <= maxW) return { text: str, cut: false };
      let lo = 0, hi = str.length;
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (measure(str.slice(0, mid) + '…') <= maxW) lo = mid; else hi = mid - 1; }
      return { text: str.slice(0, lo) + '…', cut: true };
    }

    function relayout() {
      const t0 = ctx.now();
      measureCalls = 0;
      const maxW = P.boxW - PAD * 2, maxH = P.boxH - 4;
      layout = TEXT[lang].map((str) => {
        const base = P.base;
        if (P.mode === 'fixed') {
          g0.font = FONT(base);
          const w = measure(str);
          return { lines: [str], size: base, over: w > maxW, cut: false, width: w };
        }
        if (P.mode === 'ellipsis') {
          const e = ellipsize(str, base, maxW);
          return { lines: [e.text], size: base, over: false, cut: e.cut };
        }
        if (P.mode === 'wrap') {
          const lines = wrap(str, base, maxW);
          return { lines, size: base, over: lines.length * base * 1.2 > maxH, cut: false };
        }
        // 자동 축소: 줄바꿈 결과가 들어가는 가장 큰 정수 크기를 이분 탐색
        const fits = (sz) => wrap(str, sz, maxW).length * sz * 1.2 <= maxH;
        let lo = P.minFont, hi = Math.max(P.minFont, base);
        if (!fits(lo)) {
          // 최소 크기에서도 넘침: 들어가는 줄까지만 남기고 마지막 줄을 말줄임
          const lines = wrap(str, lo, maxW);
          const maxLines = Math.max(1, Math.floor(maxH / (lo * 1.2)));
          const keep = lines.slice(0, maxLines);
          const rest = lines.slice(maxLines - 1).join(' ');
          keep[maxLines - 1] = ellipsize(rest, lo, maxW).text;
          return { lines: keep, size: lo, over: false, cut: true };
        }
        while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (fits(mid)) lo = mid; else hi = mid - 1; }
        return { lines: wrap(str, lo, maxW), size: lo, over: false, cut: false };
      });
      layoutMs = ctx.now() - t0;
    }

    return {
      update(dt) {
        t += dt;
        lang = P.cycle ? CYCLE[Math.floor(t / 2.5) % CYCLE.length] : P.lang;
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        const key = [lang, P.mode, P.boxW, P.boxH, P.base, P.minFont].join('|');
        if (key !== cacheKey) { cacheKey = key; relayout(); }
        const label = GTL.L({ ko: '한국어', en: '영어', de: '독일어', ru: '러시아어', pseudo: '의사 지역화' }, { ko: 'Korean', en: 'English', de: 'German', ru: 'Russian', pseudo: 'Pseudo-localization' })[lang];
        D.text(g, GTL.L(`언어: ${label}`, `Language: ${label}`), 12, 10, { size: 13, color: col });

        const cols = Math.max(1, Math.min(2, Math.floor((W - 24) / (P.boxW + 60))));
        const gapX = Math.max(60, (W - cols * P.boxW) / (cols + 1)), gapY = 18;
        let over = 0, cut = 0, minSize = Infinity;
        layout.forEach((L, i) => {
          const cx = i % cols, cy = Math.floor(i / cols);
          const x = gapX + cx * (P.boxW + gapX), y = 40 + cy * (P.boxH + gapY);
          // 버튼 배경 (9-슬라이스 대신 둥근 사각형)
          g.beginPath();
          if (g.roundRect) g.roundRect(x, y, P.boxW, P.boxH, 8); else g.rect(x, y, P.boxW, P.boxH);
          g.fillStyle = '#2b3448'; g.fill(); g.strokeStyle = '#5a6a8a'; g.lineWidth = 1.5; g.stroke();
          const lh = L.size * 1.2;
          const top = y + P.boxH / 2 - (L.lines.length * lh) / 2;
          L.lines.forEach((ln, k) => {
            D.text(g, ln, x + P.boxW / 2, top + k * lh + lh / 2, { font: FONT(L.size), color: '#fff', align: 'center', baseline: 'middle' });
          });
          if (L.over) {
            over++;
            const ow = L.width ? Math.max(P.boxW, L.width + PAD * 2) : P.boxW;
            const oh = Math.max(P.boxH, L.lines.length * lh + 4);
            D.rect(g, x + P.boxW / 2 - ow / 2 - 1, y + P.boxH / 2 - oh / 2 - 1, ow + 2, oh + 2, null, C.bad, 2);
          }
          if (L.cut) cut++;
          if (L.size !== P.base) D.text(g, `${L.size}px`, x + P.boxW + 4, y + 2, { size: 10, color: C.warn });
          minSize = Math.min(minSize, L.size);
        });

        ctx.stat(GTL.L('넘친 버튼', 'Overflowing buttons'), `${over} / ${layout.length}`);
        ctx.stat(GTL.L('말줄임으로 잘린 버튼', 'Buttons cut by ellipsis'), cut);
        ctx.stat(GTL.L('가장 작은 글자 크기', 'Smallest font size'), minSize + ' px');
        ctx.stat(GTL.L('measureText 호출 (마지막 배치)', 'measureText calls (last layout)'), measureCalls);
        ctx.stat(GTL.L('배치 계산 시간', 'Layout time'), layoutMs.toFixed(2) + ' ms');
      },
    };
  },
});
