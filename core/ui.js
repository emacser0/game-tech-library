// GTL UI: 사이드바, A/B 뷰, 파라미터 표, 설명 패널, 메인 루프, 셀프테스트.
(function () {
  const GTL = window.GTL, U = GTL.util, L = GTL.L;
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(k));
    return e;
  };
  const store = {
    get(k, d) { try { const v = localStorage.getItem('gtl.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('gtl.' + k, JSON.stringify(v)); } catch { /* 무시 */ } },
  };
  const NEW_DAYS = 30;
  const recent = (d) => d && (Date.now() - Date.parse(d)) / 864e5 <= NEW_DAYS;
  const isNew = (s) => recent(s.added) || recent(s.updated);
  const badge = (s) => recent(s.added) ? el('span', { class: 'badge' }, 'NEW') : recent(s.updated) ? el('span', { class: 'badge upd' }, 'UPD') : null;

  const state = {
    def: null,
    views: { a: null, b: null },
    params: { a: {}, b: {} },
    paused: false,
    stepOnce: false,
    speed: store.get('speed', 1),
    layout: store.get('layout', 'h'),
    mirror: store.get('mirror', true),
    groupBy: store.get('groupBy', 'topic'),
    seed: 1,
    keyboard: GTL.createKeyboard(),
    loadToken: 0,
  };
  const viewEls = { a: $('.view[data-side="a"]'), b: $('.view[data-side="b"]') };
  // 실행할 뷰. single: true인 샘플은 비교 없이 A 뷰 하나만 씀
  const sides = () => (state.def && state.def.single ? ['a'] : ['a', 'b']);
  const stage = $('#stage');

  // ───────────────────────── 언어 ─────────────────────────
  // index.html의 고정 문구는 data-en(글자), data-en-title(툴팁), data-en-ph(placeholder)에 영어를 둠.
  document.documentElement.lang = GTL.lang;
  if (GTL.lang === 'en') {
    document.querySelectorAll('[data-en]').forEach((e) => { e.textContent = e.dataset.en; });
    document.querySelectorAll('[data-en-title]').forEach((e) => { e.title = e.dataset.enTitle; });
    document.querySelectorAll('[data-en-ph]').forEach((e) => { e.placeholder = e.dataset.enPh; });
  }
  document.querySelectorAll('#lang-switch button').forEach((b) => {
    b.classList.toggle('active', b.dataset.lang === GTL.lang);
    b.onclick = () => { if (b.dataset.lang !== GTL.lang) { store.set('lang', b.dataset.lang); location.reload(); } };
  });

  // ───────────────────────── 사이드바 ─────────────────────────
  const levelChip = (s) => {
    const l = GTL.level(s.level);
    return l ? el('span', { class: 'lv lv' + l.id, title: `${L('구현 난이도', 'Difficulty')}: ${l.label}. ${l.desc}` }, l.label) : null;
  };
  const catOf = (s) => GTL.categories.find((c) => c.id === s.category);

  // 사이드바 묶음 기준: 'topic'(주제별) 또는 'level'(난이도별)
  function navGroups() {
    if (state.groupBy === 'level') {
      const all = GTL.allEntries();
      const groups = GTL.LEVELS.map((l) => ({ key: 'lv:' + l.id, title: l.label, level: l.id, hint: l.desc, samples: all.filter((s) => s.level === l.id) }));
      const none = all.filter((s) => !GTL.level(s.level));
      if (none.length) groups.push({ key: 'lv:none', title: L('난이도 미지정', 'No difficulty'), samples: none });
      return groups;
    }
    // 주제별에서도 쉬운 것부터. 같은 난이도 안에서는 매니페스트 순서 유지(안정 정렬)
    const rank = (s) => (GTL.level(s.level) ? s.level : 99);
    return GTL.categories.map((c) => ({
      key: 'cat:' + c.id, title: (c.icon ? c.icon + ' ' : '') + c.title,
      samples: c.samples.slice().sort((a, b) => rank(a) - rank(b)),
    }));
  }

  function buildNav() {
    const nav = $('#nav');
    const q = $('#search').value.trim().toLowerCase();
    const onlyNew = $('#only-new').checked;
    const collapsed = store.get('collapsed', {});
    nav.innerHTML = '';
    for (const grp of navGroups()) {
      const items = grp.samples.filter((s) => {
        if (onlyNew && !isNew(s)) return false;
        if (!q) return true;
        const lv = GTL.level(s.level);
        return [s.id, s.title, s.titleKo, lv ? lv.label : '', ...(s.tags || [])].join(' ').toLowerCase().includes(q);
      });
      if (!items.length && (q || onlyNew)) continue;
      const box = el('div', { class: 'cat' + (collapsed[grp.key] && !q ? ' collapsed' : '') });
      const head = el('div', { class: 'cat-head', title: grp.hint || '', onclick: () => {
        box.classList.toggle('collapsed');
        const c = store.get('collapsed', {}); c[grp.key] = box.classList.contains('collapsed'); store.set('collapsed', c);
      } }, grp.level ? el('span', { class: 'lv lv' + grp.level + ' lv-head' }, grp.title) : el('span', {}, grp.title), el('span', { class: 'count' }, String(items.length)));
      const list = el('div', { class: 'cat-items' });
      for (const s of items) {
        const c = catOf(s);
        const prefix = state.groupBy === 'level' && c && c.icon ? el('span', { class: 'item-icon', title: c.title }, c.icon) : null;
        list.append(el('a', { href: '#' + s.id, 'data-id': s.id, class: state.def && state.def.id === s.id ? 'current' : '' },
          el('span', { class: 'item-title' }, prefix, s.title),
          el('span', { class: 'item-tags' }, state.groupBy === 'level' ? null : levelChip(s), badge(s))));
      }
      box.append(head, list);
      nav.append(box);
    }
    $('#sample-count').textContent = L(`카테고리 ${GTL.categories.length}개, 샘플 ${GTL.allEntries().length}개`, `${GTL.categories.length} categories, ${GTL.allEntries().length} samples`);
    document.querySelectorAll('#group-by button').forEach((b) => b.classList.toggle('active', b.dataset.group === state.groupBy));
  }
  $('#search').addEventListener('input', buildNav);
  $('#only-new').addEventListener('change', buildNav);
  document.querySelectorAll('#group-by button').forEach((b) => (b.onclick = () => {
    state.groupBy = b.dataset.group; store.set('groupBy', state.groupBy); buildNav(); b.blur();
    if (!state.def) showHome();
  }));

  function markCurrent() {
    document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('current', !!state.def && a.dataset.id === state.def.id));
  }

  // ───────────────────────── 홈 ─────────────────────────
  const levelList = () => GTL.LEVELS.map((l) => `<li><span class="lv lv${l.id}">${l.label}</span> ${l.desc}</li>`).join('');
  function showHome() {
    teardown();
    state.def = null;
    stage.classList.add('home');
    stage.classList.remove('single');
    document.body.classList.remove('single');
    $('#crumb').textContent = '';
    $('#title').textContent = 'Game Tech Library';
    $('#summary').textContent = L('게임 개발 기법을 A, B 두 뷰에서 동시에 실행해 비교', 'Run game dev techniques side by side in two views, A and B, and compare');
    $('#params').innerHTML = `<div class="no-params">${L('왼쪽 목록에서 샘플 선택', 'Pick a sample from the list on the left')}</div>`;
    $('#info').innerHTML = L(`
      <h3>사용법</h3>
      <ul>
        <li>모든 샘플은 <b style="color:var(--a)">A</b>, <b style="color:var(--b)">B</b> 두 뷰에서 동시에 실행됨. 두 뷰는 같은 시드와 같은 입력을 받음.</li>
        <li>파라미터 표에서 A 열과 B 열의 값을 따로 바꿔 차이를 비교. A와 B의 값이 다른 칸은 보라색으로 표시됨.</li>
        <li>키보드 입력은 두 뷰에 동시에 전달됨. "입력 동기화"가 켜져 있으면 마우스 입력도 같은 상대 위치로 두 뷰에 전달됨.</li>
        <li>단축키: <code>P</code> 일시정지, <code>.</code> 한 프레임 진행, <code>R</code> 리셋, <code>/</code> 검색</li>
        <li>뷰 왼쪽 아래의 ⏱ 값은 그 뷰의 프레임 처리 시간(update와 render, ms). 최적화 기법을 비교할 때 참고.</li>
      </ul>
      <h3>구현 난이도</h3>
      <p>실제 게임에 이 기법을 넣는 난이도. 사이드바 위의 "난이도별"을 누르면 난이도로 묶어서 보여줌.</p>
      <ul>${levelList()}</ul>`, `
      <h3>How to use</h3>
      <ul>
        <li>Every sample runs in two views at once, <b style="color:var(--a)">A</b> and <b style="color:var(--b)">B</b>. Both views get the same seed and the same input.</li>
        <li>Change the A column and the B column in the parameter table to compare. Cells where A and B differ are shown in purple.</li>
        <li>Keyboard input goes to both views. When "Sync input" is on, mouse input also goes to both views at the same relative position.</li>
        <li>Shortcuts: <code>P</code> pause, <code>.</code> step one frame, <code>R</code> reset, <code>/</code> search</li>
        <li>The ⏱ value at the bottom left of a view is its frame time (update and render, in ms). Use it when you compare optimizations.</li>
      </ul>
      <h3>Difficulty</h3>
      <p>How hard it is to put this technique into a real game. Click "By difficulty" at the top of the sidebar to group samples by difficulty.</p>
      <ul>${levelList()}</ul>`);
    const home = $('#home');
    const recent = GTL.allEntries().filter((s) => s.added).sort((a, b) => b.added.localeCompare(a.added)).slice(0, 8);
    home.innerHTML = '';
    home.append(el('h2', {}, 'Game Tech Library'),
      el('p', {}, L('기법을 켠 상태와 끈 상태, 또는 방식 X와 방식 Y를 나란히 실행해 눈으로 비교하는 샘플 모음. 샘플마다 참고자료(논문, 엔진 문서, 게임 사례)가 있음.',
        'Samples that run a technique on and off, or method X and method Y, side by side so you can see the difference. Each sample lists references (papers, engine docs, game case studies).')));
    const grid = el('div', { class: 'home-grid' });
    if (recent.length) {
      grid.append(el('div', { class: 'home-card' }, el('h3', {}, L('최근 추가', 'Recently added'), el('span', {}, '')),
        recent.map((s) => el('a', { href: '#' + s.id }, `${s.added}  ${s.title}`))));
    }
    for (const g of navGroups()) {
      grid.append(el('div', { class: 'home-card' }, el('h3', {}, g.title, el('span', {}, String(g.samples.length))),
        g.hint ? el('div', { class: 'card-hint' }, g.hint) : null,
        g.samples.map((s) => el('a', { href: '#' + s.id }, s.title))));
    }
    home.append(grid);
    markCurrent();
  }

  // ───────────────────────── 샘플 로딩 ─────────────────────────
  async function openSample(id) {
    const token = ++state.loadToken;
    let def;
    try { def = await GTL.load(id); } catch (e) {
      if (token !== state.loadToken) return;
      teardown();
      stage.classList.remove('home');
      $('#title').textContent = id;
      for (const s of ['a', 'b']) showError(s, e);
      return;
    }
    if (token !== state.loadToken) return;
    teardown();
    state.def = def;
    stage.classList.remove('home');
    stage.classList.toggle('single', !!def.single);
    document.body.classList.toggle('single', !!def.single);
    const entry = GTL.findEntry(id);
    const cat = GTL.categories.find((c) => c.id === (entry && entry.category));
    const lv = entry && GTL.level(entry.level);
    $('#crumb').innerHTML = '';
    $('#crumb').append(cat ? cat.title : '', lv ? el('span', { class: 'lv lv' + lv.id, title: lv.desc }, L('난이도 ', 'Difficulty: ') + lv.label) : '');
    $('#title').textContent = def.title || (entry && entry.title) || id;
    $('#summary').textContent = def.summary || '';
    document.title = `${$('#title').textContent} | Game Tech Library`;
    state.params.a = GTL.defaultParams(def, 'a');
    state.params.b = GTL.defaultParams(def, 'b');
    for (const s of ['a', 'b']) viewEls[s].querySelector('.name').textContent = def.views[s];
    buildParams();
    buildInfo(def, entry);
    startViews();
    markCurrent();
  }

  function teardown() {
    for (const s of ['a', 'b']) {
      if (state.views[s]) state.views[s].dispose();
      state.views[s] = null;
      const v = viewEls[s];
      v.querySelector('.canvas-host').innerHTML = '';
      v.querySelector('.view-stats').textContent = '';
      v.classList.remove('has-error');
    }
  }

  function viewSize(s) {
    const r = viewEls[s].getBoundingClientRect();
    return { w: Math.max(1, Math.floor(r.width)), h: Math.max(1, Math.floor(r.height)) };
  }

  function startViews() {
    state.keyboard.clear();
    for (const s of sides()) startView(s);
  }

  function startView(s) {
    if (state.views[s]) state.views[s].dispose();
    const host = viewEls[s].querySelector('.canvas-host');
    host.innerHTML = '';
    viewEls[s].classList.remove('has-error');
    let { w, h } = viewSize(s);
    if (w < 4 || h < 4) { const o = viewSize(s === 'a' ? 'b' : 'a'); w = o.w; h = o.h; } // 숨겨진 뷰도 반대편 크기로 실행
    const v = new GTL.View(state.def, s, {
      params: state.params[s], keyboard: state.keyboard, seed: state.seed,
      width: w, height: h, dpr: Math.min(window.devicePixelRatio || 1, 2),
      onCanvas: (c) => { host.innerHTML = ''; host.append(c); },
    });
    state.views[s] = v;
    v.start();
    if (v.error) showError(s, v.error);
  }

  function showError(s, e) {
    const v = viewEls[s];
    v.classList.add('has-error');
    v.querySelector('.view-error').textContent = '⚠ ' + (e && (e.stack || e.message) || e);
    console.error(`[GTL ${s.toUpperCase()}]`, e);
  }
  GTL.onViewError = (view, e) => { if (state.views[view.side] === view) showError(view.side, e); };

  // ───────────────────────── 파라미터 테이블 ─────────────────────────
  function fmt(v, p) {
    if (typeof v !== 'number') return String(v);
    const step = p.step || 0.01;
    const dec = Math.max(0, Math.min(4, Math.ceil(-Math.log10(step) - 1e-9)));
    return v.toFixed(dec);
  }

  function makeControl(p, sides) {
    // sides: ['a'] | ['b'] | ['a','b'] (shared)
    const get = () => state.params[sides[0]][p.key];
    const set = (val) => {
      let needReset = false;
      for (const s of sides) {
        state.params[s][p.key] = val;
        if (state.views[s] && state.views[s].param(p.key, val)) needReset = true;
      }
      if (needReset) startViews();
      else if (state.paused) for (const s of sides) state.views[s] && state.views[s].render();
      refreshParamStates();
    };
    const box = el('div', { class: 'pctl' });
    if (p.type === 'bool') {
      const c = el('input', { type: 'checkbox' }); c.checked = !!get();
      c.addEventListener('change', () => { set(c.checked); c.blur(); });
      box.append(c, el('span', { class: 'ref-note' }, ''));
      box._sync = () => { c.checked = !!get(); };
    } else if (p.type === 'select') {
      const sel = el('select', {}, p.options.map((o) => el('option', { value: String(o.value) }, o.label)));
      sel.value = String(get());
      sel.addEventListener('change', () => {
        const o = p.options.find((o) => String(o.value) === sel.value);
        set(o ? o.value : sel.value); sel.blur();
      });
      box.append(sel);
      box._sync = () => { sel.value = String(get()); };
    } else if (p.type === 'color') {
      const c = el('input', { type: 'color' }); c.value = get();
      c.addEventListener('input', () => set(c.value));
      box.append(c);
      box._sync = () => { c.value = get(); };
    } else if (p.type === 'button') {
      box.append(el('button', { onclick: (e) => { for (const s of sides) state.views[s] && state.views[s].action(p.key); e.target.blur(); } }, p.buttonLabel || p.label));
      box._sync = () => {};
    } else { // range | int
      const r = el('input', { type: 'range', min: p.min, max: p.max, step: p.step });
      const n = el('input', { type: 'number', class: 'num', min: p.min, max: p.max, step: p.step });
      const show = () => { r.value = get(); n.value = fmt(get(), p); };
      show();
      r.addEventListener('input', () => { set(p.type === 'int' ? Math.round(+r.value) : +r.value); n.value = fmt(get(), p); });
      n.addEventListener('change', () => {
        let v = +n.value; if (!isFinite(v)) v = p.default;
        v = U.clamp(v, p.min, p.max); if (p.type === 'int') v = Math.round(v);
        set(v); show();
      });
      box.append(r, n);
      box._sync = show;
    }
    return box;
  }

  let paramRows = [];
  function buildParams() {
    const host = $('#params');
    host.innerHTML = '';
    paramRows = [];
    const def = state.def;
    if (!def.params.length) { host.innerHTML = `<div class="no-params">${L('조정할 파라미터 없음', 'No parameters')}</div>`; return; }
    const table = el('table', { class: 'ptable' });
    table.append(def.single
      ? el('tr', {}, el('th', {}, ''), el('th', { colspan: 2 }, L('값', 'Value')))
      : el('tr', {}, el('th', {}, ''), el('th', { class: 'side-a' }, 'A: ' + def.views.a), el('th', { class: 'side-b' }, 'B: ' + def.views.b)));
    let group = null;
    for (const p of def.params) {
      if (p.group && p.group !== group) {
        group = p.group;
        table.append(el('tr', { class: 'group' }, el('td', { colspan: 3 }, p.group)));
      }
      const name = el('td', { class: 'pname', title: p.help || p.label }, p.label, p.help ? el('small', {}, p.help) : null);
      const row = el('tr', {}, name);
      const shared = p.shared || p.type === 'button' || def.single;
      if (shared) {
        const td = el('td', { colspan: 2 }, makeControl(p, sides()));
        row.append(td);
        paramRows.push({ p, cells: { ab: td } });
      } else {
        const ta = el('td', {}, makeControl(p, ['a'])), tb = el('td', {}, makeControl(p, ['b']));
        row.append(ta, tb);
        paramRows.push({ p, cells: { a: ta, b: tb } });
      }
      table.append(row);
    }
    host.append(table);
    refreshParamStates();
  }

  function refreshParamStates() {
    for (const { p, cells } of paramRows) {
      if (cells.a) {
        const differs = state.params.a[p.key] !== state.params.b[p.key];
        cells.a.classList.toggle('differs', differs);
        cells.b.classList.toggle('differs', differs);
        if (p.when) {
          cells.a.classList.toggle('inactive', !safeWhen(p, state.params.a));
          cells.b.classList.toggle('inactive', !safeWhen(p, state.params.b));
        }
      } else if (p.when) {
        cells.ab.classList.toggle('inactive', !safeWhen(p, state.params.a) && (state.def.single || !safeWhen(p, state.params.b)));
      }
    }
  }
  const safeWhen = (p, params) => { try { return !!p.when(params); } catch { return true; } };

  function syncControls() {
    document.querySelectorAll('#params .pctl').forEach((c) => c._sync && c._sync());
    refreshParamStates();
  }

  function copyParams(from, to) {
    if (!state.def) return;
    for (const p of state.def.params) if (!p.shared && p.type !== 'button') state.params[to][p.key] = state.params[from][p.key];
    syncControls();
    startViews();
  }
  $('#copy-ab').onclick = () => copyParams('a', 'b');
  $('#copy-ba').onclick = () => copyParams('b', 'a');
  $('#defaults').onclick = () => {
    if (!state.def) return;
    for (const s of ['a', 'b']) {
      const d = GTL.defaultParams(state.def, s);
      for (const k of Object.keys(state.params[s])) delete state.params[s][k];
      Object.assign(state.params[s], d);
    }
    syncControls();
    startViews();
  };

  // ───────────────────────── 설명 패널 ─────────────────────────
  const REF_LABEL = L({ paper: '논문', engine: '엔진', game: '게임 사례', talk: '발표', article: '글', book: '서적', code: '코드' },
    { paper: 'Paper', engine: 'Engine', game: 'Game', talk: 'Talk', article: 'Article', book: 'Book', code: 'Code' });
  function buildInfo(def, entry) {
    const info = $('#info');
    info.innerHTML = '';
    if (def.controls) info.append(el('h3', {}, L('조작', 'Controls')), el('div', { class: 'controls-hint' }, def.controls));
    if (def.info) info.append(el('h3', {}, L('설명', 'About')), el('div', { html: def.info }));
    const diagrams = GTL.diagrams(def);
    if (diagrams.length) info.append(el('h3', {}, L('도식', 'Diagram')), ...diagrams.map((svg) => el('div', { class: 'diagram', html: svg })));
    if (def.look && def.look.length) info.append(el('h3', {}, L('관찰 포인트', 'What to look for')), el('ul', {}, def.look.map((t) => el('li', { html: t }))));
    if (def.refs.length) {
      info.append(el('h3', {}, L('참고자료', 'References')), el('ul', { class: 'refs' }, def.refs.map((r) => el('li', {},
        el('span', { class: 'ref-type ' + (r.type || '') }, REF_LABEL[r.type] || r.type || L('자료', 'Source')),
        r.url ? el('a', { href: r.url, target: '_blank', rel: 'noopener' }, r.title) : r.title,
        r.year ? ` (${r.year})` : '',
        r.note ? el('div', { class: 'ref-note' }, r.note) : null))));
    }
    const tags = (entry && entry.tags) || def.tags || [];
    if (tags.length || (entry && entry.added)) {
      info.append(el('div', { class: 'tags' }, tags.map((t) => el('span', { class: 'tag' }, '#' + t)),
        entry && entry.added ? el('span', { class: 'tag' }, L('추가 ', 'Added ') + entry.added) : null,
        entry && entry.updated ? el('span', { class: 'tag' }, L('갱신 ', 'Updated ') + entry.updated) : null));
    }
  }

  // ───────────────────────── 툴바 ─────────────────────────
  function setPaused(p) { state.paused = p; $('#btn-pause').textContent = p ? '▶' : '⏸'; $('#btn-pause').classList.toggle('active', p); }
  $('#btn-pause').onclick = (e) => { setPaused(!state.paused); e.currentTarget.blur(); };
  $('#btn-step').onclick = (e) => { setPaused(true); state.stepOnce = true; e.currentTarget.blur(); };
  $('#btn-reset').onclick = (e) => { if (state.def) startViews(); e.currentTarget.blur(); };
  $('#speed').value = String(state.speed);
  $('#speed').onchange = (e) => { state.speed = +e.target.value; store.set('speed', state.speed); e.target.blur(); };
  $('#mirror').checked = state.mirror;
  $('#mirror').onchange = (e) => { state.mirror = e.target.checked; store.set('mirror', state.mirror); e.target.blur(); };
  function setLayout(l) {
    state.layout = l; store.set('layout', l);
    stage.classList.remove('layout-h', 'layout-v', 'layout-a', 'layout-b');
    stage.classList.add('layout-' + l);
    document.querySelectorAll('#layout button').forEach((b) => b.classList.toggle('active', b.dataset.layout === l));
  }
  document.querySelectorAll('#layout button').forEach((b) => (b.onclick = () => { setLayout(b.dataset.layout); b.blur(); }));
  setLayout(state.layout);

  // 하단 패널 높이 조절
  (() => {
    const root = document.documentElement;
    root.style.setProperty('--bottom-h', store.get('bottomH', 300) + 'px');
    let dragging = false;
    $('#splitter').addEventListener('pointerdown', (e) => { dragging = true; e.target.setPointerCapture(e.pointerId); });
    $('#splitter').addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const h = U.clamp(window.innerHeight - e.clientY, 120, window.innerHeight - 220);
      root.style.setProperty('--bottom-h', h + 'px');
    });
    $('#splitter').addEventListener('pointerup', () => {
      dragging = false;
      store.set('bottomH', parseInt(getComputedStyle(root).getPropertyValue('--bottom-h')));
    });
  })();

  // ───────────────────────── 입력 ─────────────────────────
  const GAME_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);
  const isTyping = (t) => t && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && /^(text|search|number)$/.test(t.type)));
  window.addEventListener('keydown', (e) => {
    if (isTyping(e.target)) { if (e.key === 'Escape') e.target.blur(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'Slash') { e.preventDefault(); $('#search').focus(); return; }
    if (e.code === 'KeyP') { setPaused(!state.paused); return; }
    if (e.code === 'Period') { setPaused(true); state.stepOnce = true; return; }
    if (e.code === 'KeyR' && state.def) { startViews(); return; }
    if (!state.def) return;
    if (GAME_KEYS.has(e.code)) { e.preventDefault(); if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); }
    if (!e.repeat) state.keyboard.keydown(e.code);
  });
  window.addEventListener('keyup', (e) => state.keyboard.keyup(e.code));
  window.addEventListener('blur', () => state.keyboard.clear());

  function pointerTargets(side) { return state.mirror ? ['a', 'b'] : [side]; }
  for (const side of ['a', 'b']) {
    const vEl = viewEls[side];
    const rel = (e) => {
      const r = vEl.getBoundingClientRect();
      return { u: (e.clientX - r.left) / r.width, v: (e.clientY - r.top) / r.height };
    };
    const apply = (type, e) => {
      const { u, v } = rel(e);
      for (const s of pointerTargets(side)) {
        const view = state.views[s];
        if (!view) continue;
        const m = view.mouse;
        m.x = u * view.width; m.y = v * view.height;
        if (type === 'down') { m.down = true; m.pressed = true; m.button = e.button; }
        if (type === 'up') { m.down = false; m.released = true; }
        if (type === 'enter') m.inside = true;
        if (type === 'leave') m.inside = false;
        if (type === 'wheel') m.wheel += Math.sign(e.deltaY);
        view.pointer(type, e);
        if (state.paused) view.render();
      }
    };
    vEl.addEventListener('pointerdown', (e) => {
      if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
      vEl.setPointerCapture(e.pointerId); apply('down', e);
    });
    vEl.addEventListener('pointermove', (e) => apply('move', e));
    vEl.addEventListener('pointerup', (e) => apply('up', e));
    vEl.addEventListener('pointercancel', (e) => apply('up', e));
    vEl.addEventListener('pointerenter', (e) => { vEl.classList.add('hot'); apply('enter', e); });
    vEl.addEventListener('pointerleave', (e) => { vEl.classList.remove('hot'); apply('leave', e); });
    vEl.addEventListener('wheel', (e) => { if (state.def) { e.preventDefault(); apply('wheel', e); } }, { passive: false });
    vEl.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // 크기 변경
  const ro = new ResizeObserver(() => {
    for (const s of ['a', 'b']) {
      const v = state.views[s];
      if (!v) continue;
      const { w, h } = viewSize(s);
      if (w < 4 || h < 4) continue;
      if (w !== v.width || h !== v.height) v.resize(w, h, Math.min(window.devicePixelRatio || 1, 2));
    }
  });
  ro.observe(viewEls.a); ro.observe(viewEls.b);

  // ───────────────────────── 메인 루프 ─────────────────────────
  let last = performance.now(), statTimer = 0;
  const spark = {};
  function frame(now) {
    requestAnimationFrame(frame);
    const realDt = Math.min(0.25, (now - last) / 1000);
    last = now;
    if (!state.def) return;
    let dt = 0;
    if (!state.paused) dt = Math.min(realDt, 0.1) * state.speed;
    else if (state.stepOnce) { dt = (1 / 60) * state.speed; state.stepOnce = false; }
    if (dt > 0) {
      for (const s of ['a', 'b']) state.views[s] && state.views[s].tick(dt, state.paused ? dt : realDt);
      state.keyboard.endFrame();
    }
    statTimer += realDt;
    if (statTimer > 0.2) { statTimer = 0; drawStats(); }
  }
  function drawStats() {
    for (const s of ['a', 'b']) {
      const v = state.views[s];
      const box = viewEls[s].querySelector('.view-stats');
      if (!v || v.error) { box.textContent = ''; continue; }
      const lines = [];
      for (const [k, val] of v.stats) lines.push(`${k}: ${typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(2)) : val}`);
      lines.push(`⏱ ${v.cost.toFixed(2)} ms`);
      box.textContent = lines.join('\n');
      let c = spark[s];
      if (!c) { c = spark[s] = document.createElement('canvas'); c.width = 120; c.height = 22; }
      box.append(c);
      const g = c.getContext('2d');
      g.clearRect(0, 0, 120, 22);
      U.draw.plot(g, v.costHistory, 0, 0, 120, 22, { min: 0, color: s === 'a' ? U.colors.a : U.colors.b, background: 'rgba(255,255,255,0.04)' });
    }
  }
  requestAnimationFrame(frame);

  // ───────────────────────── 라우팅 ─────────────────────────
  function route() {
    const id = decodeURIComponent(location.hash.slice(1));
    const old = document.getElementById('selftest');
    if (old) old.remove(); // 셀프테스트 결과 화면이 다른 샘플을 가리지 않게 제거
    if (id === 'selftest') return runSelfTest();
    if (!id) return showHome();
    openSample(id);
  }
  window.addEventListener('hashchange', route);

  // ───────────────────────── 셀프테스트 (#selftest) ─────────────────────────
  // 모든 샘플을 기본값과 무작위 파라미터로 실행해 예외와 셰이더 오류를 수집.
  async function runSelfTest() {
    teardown(); state.def = null;
    const box = el('div', { id: 'selftest' }, el('h2', {}, 'Self test'));
    stage.append(box);
    const results = [];
    const kb = GTL.createKeyboard();
    for (const entry of GTL.allEntries()) {
      const line = el('div', {}, entry.id + ' … ');
      box.append(line);
      const errs = [];
      try {
        const def = await GTL.load(entry.id);
        const rng = U.rng(7);
        const runs = [['default', (s) => GTL.defaultParams(def, s)], ['random1', (s) => randomParams(def, s, rng)], ['random2', (s) => randomParams(def, s, rng)]];
        for (const [label, mk] of runs) {
          for (const s of def.single ? ['a'] : ['a', 'b']) {
            const v = new GTL.View(def, s, { params: mk(s), keyboard: kb, seed: 1, width: 360, height: 240, dpr: 1 });
            v.start();
            for (let i = 0; i < 40 && !v.error; i++) {
              if (i % 10 === 0) kb.keydown(['Space', 'ArrowRight', 'ArrowLeft', 'KeyZ'][(i / 10) % 4]);
              v.mouse.x = 50 + i * 4; v.mouse.y = 60 + i * 2; v.mouse.down = i % 15 < 5; v.mouse.pressed = i % 15 === 0;
              v.tick(1 / 60, 1 / 60);
              kb.endFrame();
              if (i % 10 === 5) kb.clear();
            }
            for (const p of def.params) if (p.type === 'button' && !v.error) v.action(p.key);
            if (!v.error) v.tick(1 / 60, 1 / 60);
            if (v.error) errs.push(`[${label}/${s}] ${v.error.message}`);
            v.dispose();
          }
        }
      } catch (e) { errs.push(e.message); }
      results.push({ id: entry.id, ok: !errs.length, errs });
      line.innerHTML = '';
      line.append(entry.id + ' ', el('span', { class: errs.length ? 'fail' : 'ok' }, errs.length ? 'FAIL' : 'OK'));
      if (errs.length) line.append(el('pre', {}, errs.join('\n')));
      await new Promise((r) => setTimeout(r, 0));
    }
    const failed = results.filter((r) => !r.ok);
    box.insertBefore(el('h3', {}, `${results.length - failed.length}/${results.length} ${L('통과', 'passed')}`), box.children[1]);
    window.__selftest = results;
    console.log('[GTL selftest]', JSON.stringify({ total: results.length, failed }));
  }
  function randomParams(def, side, rng) {
    const o = GTL.defaultParams(def, side);
    for (const p of def.params) {
      if (p.type === 'range') o[p.key] = rng.range(p.min, p.max);
      else if (p.type === 'int') o[p.key] = rng.int(p.min, p.max);
      else if (p.type === 'bool') o[p.key] = rng.chance(0.5);
      else if (p.type === 'select') o[p.key] = rng.pick(p.options).value;
    }
    return o;
  }

  // ───────────────────────── 시작 ─────────────────────────
  buildNav();
  route();
})();
