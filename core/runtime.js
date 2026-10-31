// GTL runtime: 샘플 등록과 로딩, 파라미터 정규화, View(샘플 인스턴스 실행기).
// DOM UI(core/ui.js)와 분리되어 있어 Node 스모크 테스트(tools/smoke.js)에서도 그대로 쓰임.
(function (root) {
  const GTL = (root.GTL = root.GTL || {});
  const U = GTL.util;

  // ───────────────────────── 언어 ─────────────────────────
  // 'ko' 또는 'en'. 저장된 선택이 없으면 브라우저 언어를 따름. 바꾸면 페이지를 다시 불러옴(core/ui.js).
  GTL.LANGS = [{ id: 'ko', label: '한국어' }, { id: 'en', label: 'English' }];
  GTL.lang = GTL.lang || (() => {
    try { const v = JSON.parse(localStorage.getItem('gtl.lang')); if (v === 'ko' || v === 'en') return v; } catch { /* 무시 */ }
    try { return /^ko/i.test(navigator.language) ? 'ko' : 'en'; } catch { return 'ko'; }
  })();
  // 문자열 고르기: GTL.L('한국어', 'English'). 영어 문구가 없으면 한국어를 씀.
  GTL.L = (ko, en) => (GTL.lang === 'en' && en != null ? en : ko);
  const L = GTL.L;

  // 플랫폼 추상화: 브라우저 기본값. 테스트 환경에서 덮어씀.
  GTL.platform = GTL.platform || {
    createCanvas(w = 300, h = 150) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      return c;
    },
    loadScript(src) {
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = () => reject(new Error(L('스크립트 로드 실패: ', 'Failed to load script: ') + src + L('. 매니페스트의 파일 이름을 확인할 것', '. Check the file name in the manifest')));
        document.head.appendChild(s);
      });
    },
    now: () => performance.now(),
  };

  // ───────────────────────── 카테고리 & 매니페스트 ─────────────────────────
  // samples/<cat>/_manifest.js 에서 호출:
  // GTL.category({ id, title, en, order, icon, samples: [{ id, title, en, file, tags, added }] })
  // en: 영어 제목. 영어 모드에서 title 대신 쓰고, 원래 제목은 titleKo에 남겨 검색에 씀.
  GTL.categories = GTL.categories || [];
  GTL.category = function (cat) {
    const base = cat.base || `samples/${cat.id}/`;
    cat.titleKo = cat.title; cat.title = L(cat.title, cat.en);
    cat.samples = (cat.samples || []).map((s) => ({ ...s, titleKo: s.title, title: L(s.title, s.en), category: cat.id, path: base + (s.file || s.id + '.js') }));
    GTL.categories = GTL.categories.filter((c) => c.id !== cat.id);
    GTL.categories.push(cat);
    GTL.categories.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  };
  // 구현 난이도. 샘플 코드가 아니라 실제 게임에 이 기법을 넣는 난이도 기준 (docs/AUTHORING.md 참고)
  GTL.LEVELS = [
    { id: 1, label: L('입문', 'Intro'), desc: L('상태 변수 몇 개와 조건문으로 구현. 수학은 lerp 수준', 'A few state variables and if statements. Math is at the lerp level') },
    { id: 2, label: L('초급', 'Basic'), desc: L('벡터 수학과 배열, 그리드 같은 기본 자료구조', 'Vector math and basic data structures such as arrays and grids') },
    { id: 3, label: L('중급', 'Intermediate'), desc: L('알려진 알고리즘이나 다중 패스 셰이더. 경계 사례 처리 필요', 'Known algorithms or multi-pass shaders. Edge cases need care') },
    { id: 4, label: L('고급', 'Advanced'), desc: L('수치 안정성, 시스템 간 동기화, 정밀도 문제. 튜닝과 디버깅이 어려움', 'Numerical stability, sync between systems, precision issues. Hard to tune and debug') },
  ];
  GTL.level = (n) => GTL.LEVELS.find((l) => l.id === n) || null;

  GTL.findEntry = (id) => {
    for (const c of GTL.categories) for (const s of c.samples) if (s.id === id) return s;
    return null;
  };
  GTL.allEntries = () => GTL.categories.flatMap((c) => c.samples);

  // ───────────────────────── 샘플 정의 ─────────────────────────
  GTL.defs = GTL.defs || {};
  const pending = {};

  GTL.register = function (def) {
    if (!def || !def.id) throw new Error(L('GTL.register: id 없음. 정의에 id를 추가할 것', 'GTL.register: no id. Add an id to the definition'));
    if (typeof def.setup !== 'function') throw new Error(`GTL.register(${def.id}): ` + L('setup(ctx) 함수 없음. 정의에 setup을 추가할 것', 'no setup(ctx) function. Add setup to the definition'));
    def.renderer = def.renderer || '2d';
    def.views = { a: 'A', b: 'B', ...(def.views || {}) };
    def.params = (def.params || []).map(normalizeParam);
    def.refs = def.refs || [];
    localize(def);
    GTL.defs[def.id] = def;
    if (pending[def.id]) { pending[def.id].resolve(def); delete pending[def.id]; }
    return def;
  };

  GTL.load = function (id) {
    if (GTL.defs[id]) return Promise.resolve(GTL.defs[id]);
    const entry = GTL.findEntry(id);
    if (!entry) return Promise.reject(new Error(L('알 수 없는 샘플: ', 'Unknown sample: ') + id));
    if (pending[id]) return pending[id].promise;
    let resolve, reject;
    const p = new Promise((res, rej) => { resolve = res; reject = rej; });
    pending[id] = { promise: p, resolve, reject };
    GTL.platform.loadScript(entry.path).then(() => {
      if (pending[id]) { pending[id].reject(new Error(L(`${entry.path}에서 GTL.register({id:'${id}'}) 호출 없음. 매니페스트 id와 파일의 id가 같은지 확인할 것`, `${entry.path} did not call GTL.register({id:'${id}'}). Check that the manifest id matches the id in the file`))); delete pending[id]; }
    }, (e) => { if (pending[id]) { pending[id].reject(e); delete pending[id]; } });
    return p;
  };

  // 영어 모드에서 def.en의 문구로 바꿔 끼움. 형식은 docs/AUTHORING.md의 "영어 문구" 참고.
  //   en: { title, summary, controls, info, look: [...], views: { a, b },
  //         refs: ['note', ...],                       // 인덱스가 같은 refs의 note. null이면 그대로
  //         params: { key: 'label' | { label, help, group, buttonLabel, options: { value: 'label' } } } }
  function localize(def) {
    const en = def.en;
    if (GTL.lang !== 'en' || !en) return;
    for (const k of ['title', 'summary', 'controls', 'info']) if (en[k] != null) def[k] = en[k];
    if (en.look) def.look = en.look;
    if (en.views) def.views = { ...def.views, ...en.views };
    if (en.refs) def.refs = def.refs.map((r, i) => {
      const t = en.refs[i];
      return t == null ? r : typeof t === 'string' ? { ...r, note: t } : { ...r, ...t };
    });
    if (en.params) for (const p of def.params) {
      const t = en.params[p.key];
      if (t == null) continue;
      if (typeof t === 'string') { p.label = t; continue; }
      for (const k of ['label', 'help', 'group', 'buttonLabel']) if (t[k] != null) p[k] = t[k];
      if (t.options && p.options) p.options = p.options.map((o) => (t.options[o.value] != null ? { ...o, label: t.options[o.value] } : o));
    }
  }

  // 설명 패널의 도식. def.diagram은 SVG 문자열, (L) => SVG 문자열, 또는 그 배열.
  // L은 GTL.L. 라벨을 L('한국어', 'English')로 써서 두 언어를 한곳에 둠.
  GTL.diagrams = function (def) {
    const list = def.diagram == null ? [] : Array.isArray(def.diagram) ? def.diagram : [def.diagram];
    return list.map((d) => (typeof d === 'function' ? d(L) : d)).filter(Boolean);
  };

  function normalizeParam(p) {
    const q = { ...p };
    if (!q.key) throw new Error(L('param에 key 없음. 모든 파라미터에 key를 지정할 것', 'A param has no key. Give every param a key'));
    q.label = q.label || q.key;
    q.type = q.type || (typeof q.default === 'boolean' ? 'bool' : q.options ? 'select' : 'range');
    if (q.type === 'select') {
      q.options = (q.options || []).map((o) => (typeof o === 'object' ? o : { value: o, label: String(o) }));
      if (q.default === undefined && q.options.length) q.default = q.options[0].value;
    }
    if (q.type === 'range' || q.type === 'int') {
      q.min = q.min ?? 0; q.max = q.max ?? 1;
      q.step = q.step ?? (q.type === 'int' ? 1 : (q.max - q.min) / 100);
      if (q.default === undefined) q.default = q.min;
    }
    if (q.type === 'bool' && q.default === undefined) q.default = false;
    if (q.type === 'color' && q.default === undefined) q.default = '#ffffff';
    return q;
  }

  // 정의로부터 한 쪽 뷰('a'|'b')의 초기 파라미터 객체 생성
  GTL.defaultParams = function (def, side) {
    const o = {};
    for (const p of def.params) {
      if (p.type === 'button') continue;
      o[p.key] = p.shared ? p.default : p[side] !== undefined ? p[side] : p.default;
    }
    return o;
  };

  // ───────────────────────── 입력 ─────────────────────────
  // 키보드는 두 뷰가 공유(같은 입력으로 동시에 비교), 마우스는 뷰별 로컬 좌표.
  GTL.createKeyboard = function () {
    const down = new Set(), pressed = new Set(), released = new Set();
    return {
      down, pressed, released,
      keydown(code) { if (!down.has(code)) pressed.add(code); down.add(code); },
      keyup(code) { if (down.has(code)) released.add(code); down.delete(code); },
      endFrame() { pressed.clear(); released.clear(); },
      clear() { down.clear(); pressed.clear(); released.clear(); },
    };
  };
  function createMouse() {
    return { x: 0, y: 0, down: false, button: 0, inside: false, pressed: false, released: false, wheel: 0 };
  }

  // ───────────────────────── View ─────────────────────────
  // 한쪽(A 또는 B) 샘플 인스턴스를 소유하고 실행.
  class View {
    constructor(def, side, opts) {
      this.def = def;
      this.side = side;
      this.params = opts.params;           // 라이브 파라미터 객체 (UI가 직접 수정)
      this.keyboard = opts.keyboard;
      this.seed = opts.seed ?? 1;
      this.width = opts.width || 480;
      this.height = opts.height || 360;
      this.dpr = opts.dpr || 1;
      this.onCanvas = opts.onCanvas || (() => {});
      this.mouse = createMouse();
      this.error = null;
      this.stats = new Map();
      this.cost = 0;                       // 최근 update+render 소요(ms), 지수평균
      this.costHistory = [];
      this.inst = null;
      this.canvas = null;
    }

    start() {
      this.dispose();
      this.error = null;
      this.stats.clear();
      this.costHistory = [];
      const def = this.def;
      const canvas = GTL.platform.createCanvas(1, 1);
      this.canvas = canvas;
      this.onCanvas(canvas);
      const pr = def.pixelRatio === undefined ? this.dpr : def.pixelRatio;
      this.pr = pr;
      canvas.width = Math.max(1, Math.round(this.width * pr));
      canvas.height = Math.max(1, Math.round(this.height * pr));

      let g = null, gl = null;
      try {
        if (def.renderer === '2d') {
          g = canvas.getContext('2d', def.contextAttributes ? def.contextAttributes(this.params) : undefined);
        } else {
          const attrs = { antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: false, ...(def.contextAttributes ? def.contextAttributes(this.params) : {}) };
          gl = canvas.getContext(def.renderer === 'webgl2' ? 'webgl2' : 'webgl', attrs);
          if (!gl) throw new Error(def.renderer + L(' 컨텍스트 생성 실패. 브라우저가 이 기능을 지원하는지 확인할 것', ' context creation failed. Check that your browser supports it'));
        }
      } catch (e) { this.fail(e); return; }

      const self = this;
      const kb = this.keyboard;
      const ctx = (this.ctx = {
        side: this.side,
        def,
        canvas, g, gl,
        width: this.width, height: this.height,
        pixelWidth: canvas.width, pixelHeight: canvas.height, pixelRatio: pr,
        params: this.params,
        time: 0, frame: 0, dt: 0,
        seed: this.seed,
        rng: U.rng(this.seed),
        random: null,
        input: {
          mouse: this.mouse,
          key: (code) => kb.down.has(code),
          pressed: (code) => kb.pressed.has(code),
          released: (code) => kb.released.has(code),
          keys: kb.down,
        },
        // 뷰 좌하단 오버레이에 표시할 측정값. 매 프레임 갱신 가능.
        stat(label, value) { self.stats.set(label, value); },
        clearStats() { self.stats.clear(); },
        createCanvas: (w, h) => GTL.platform.createCanvas(w, h),
        now: () => GTL.platform.now(),
      });
      ctx.random = ctx.rng.next;

      try {
        this.inst = def.setup(ctx) || {};
      } catch (e) { this.fail(e); return; }
      this.render();
    }

    resize(w, h, dpr) {
      this.width = w; this.height = h; if (dpr) this.dpr = dpr;
      if (!this.canvas || !this.ctx) return;
      const pr = this.def.pixelRatio === undefined ? this.dpr : this.def.pixelRatio;
      this.pr = pr;
      this.canvas.width = Math.max(1, Math.round(w * pr));
      this.canvas.height = Math.max(1, Math.round(h * pr));
      Object.assign(this.ctx, { width: w, height: h, pixelWidth: this.canvas.width, pixelHeight: this.canvas.height, pixelRatio: pr });
      if (this.error) return;
      try { this.inst.resize && this.inst.resize(w, h); } catch (e) { this.fail(e); return; }
      this.render();
    }

    tick(dt, realDt) {
      if (this.error || !this.inst) return;
      const ctx = this.ctx;
      ctx.dt = dt; ctx.realDt = realDt ?? dt;
      const t0 = GTL.platform.now();
      try {
        if (this.inst.update) this.inst.update(dt);
        ctx.time += dt; ctx.frame++;
        this._render();
      } catch (e) { this.fail(e); return; }
      this.measure(GTL.platform.now() - t0);
      this.mouse.pressed = this.mouse.released = false;
      this.mouse.wheel = 0;
    }

    // 일시정지 중에도 파라미터 변경 결과를 보여주기 위한 렌더 전용 호출
    render() {
      if (this.error || !this.inst) return;
      try { this._render(); } catch (e) { this.fail(e); }
    }

    _render() {
      const ctx = this.ctx, g = ctx.g;
      if (g) {
        g.setTransform(this.pr, 0, 0, this.pr, 0, 0);
        if (this.def.autoClear !== false) { g.fillStyle = this.def.background || U.colors.bg; g.fillRect(0, 0, ctx.width, ctx.height); }
      }
      if (this.inst.render) this.inst.render();
    }

    measure(ms) {
      this.cost = this.cost ? this.cost * 0.9 + ms * 0.1 : ms;
      this.costHistory.push(ms);
      if (this.costHistory.length > 120) this.costHistory.shift();
    }

    param(key, value) {
      // UI가 이미 this.params[key]를 갱신한 뒤 호출. reset이 필요하면 true 반환.
      const p = this.def.params.find((q) => q.key === key);
      if (this.error) return !!(p && p.reset);
      if (p && p.reset) return true;
      try { this.inst && this.inst.onParam && this.inst.onParam(key, value); } catch (e) { this.fail(e); }
      return false;
    }

    action(key) {
      if (this.error || !this.inst) return;
      try { this.inst.onAction && this.inst.onAction(key); } catch (e) { this.fail(e); }
    }

    pointer(type, e) {
      if (this.error || !this.inst) return;
      try { this.inst.onPointer && this.inst.onPointer(type, this.mouse, e); } catch (err) { this.fail(err); }
    }

    fail(e) {
      this.error = e instanceof Error ? e : new Error(String(e));
      if (GTL.onViewError) GTL.onViewError(this, this.error);
    }

    dispose() {
      if (this.inst && this.inst.dispose) { try { this.inst.dispose(); } catch (e) { /* 무시 */ } }
      if (this.ctx && this.ctx.gl) {
        const ext = this.ctx.gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      }
      this.inst = null;
      this.ctx = null;
    }
  }
  GTL.View = View;
})(typeof window !== 'undefined' ? window : globalThis);
