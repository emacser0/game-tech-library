// 세이브 데이터 버전 관리: 버전 없는 직렬화 vs 버전 번호 + 단계별 마이그레이션
GTL.register({
  id: 'save-versioning',
  title: '세이브 데이터 버전 관리 & 마이그레이션',
  summary: '업데이트로 세이브 형식이 바뀌면 현재 형식만 읽는 코드는 구버전 세이브에서 오류를 내거나 값을 잃음. 세이브에 버전 번호를 넣고 v1→v2→v3처럼 한 단계씩 변환하면 어느 버전의 세이브든 그대로 불러옴.',
  views: { a: '현재 형식만 읽기', b: '버전 + 마이그레이션' },
  controls: '세이브 슬롯을 클릭하면 오른쪽에 원본 데이터와 불러온 결과가 나옴. 자동 데모가 슬롯을 차례로 보여 줌.',
  info: `
    <p><b>세이브 데이터 버전 관리</b>는 저장 파일에 형식 버전을 함께 적고, 불러올 때 버전에 맞게 변환하는 방법.</p>
    <p>업데이트마다 세이브 형식이 바뀜. 예:</p>
    <ul>
      <li>v2: <code>hp</code>를 <code>stats.hp</code>로 옮기고 인벤토리 추가.</li>
      <li>v3: 금화를 <code>wallet</code>으로 옮기고 보석 추가. 인벤토리를 개수 묶음으로 바꿈.</li>
      <li>v4: 이름을 <code>profile</code>로 옮기고 인벤토리를 사전 형태로 바꿈.</li>
    </ul>
    <p>현재 형식만 읽으면 구버전 세이브에서 없는 필드를 읽다가 오류가 남(로드 실패). 기본값으로 메우는 방식은 오류는 없지만 옮겨 간 필드를 못 찾아서 금화나 아이템이 조용히 사라짐. 이쪽이 더 위험함.</p>
    <p>마이그레이션 방식:</p>
    <ul>
      <li>저장할 때 항상 <code>version</code>을 적음. 버전 필드가 없으면 v1로 봄.</li>
      <li>변환 함수는 바로 다음 버전으로만 바꿈(v1→v2, v2→v3, ...). 새 버전을 낼 때 함수 하나만 추가하면 됨.</li>
      <li>불러올 때 현재 버전이 될 때까지 차례로 적용한 뒤, 현재 형식 읽기 코드는 하나만 유지함.</li>
    </ul>
    <p>단점: 변환 함수를 지우지 않고 계속 유지하고 테스트해야 함. 구버전 세이브 표본을 테스트 데이터로 보관해 두는 것이 좋음. 새 버전 세이브를 구버전 게임이 읽는 경우(하위 호환)는 따로 막아야 함.</p>`,
  // 도식: 버전 사슬 v1→v2→v3→v4. 세이브는 자기 버전에서 시작해 한 단계씩 변환. A는 v1을 현재 형식으로 바로 읽음
  diagram: (L) => {
    const vs = [
      ['v1', L('hp, gold, name', 'hp, gold, name')],
      ['v2', L('hp를 stats.hp로', 'hp to stats.hp')],
      ['v3', L('금화를 wallet으로', 'gold to wallet')],
      ['v4', L('이름을 profile로', 'name to profile')],
    ];
    const boxes = vs.map(([v, d], i) => {
      const x = 20 + i * 130;
      return `<path d="M${x + 50},28 L${x + 50},46" class="d-dim" marker-end="url(#arrD)"/>
      <text x="${x + 50}" y="22" text-anchor="middle" class="t-small t-dim">${L('세이브 ' + v, v + ' save')}</text>
      <rect x="${x}" y="50" width="100" height="34" rx="4" class="${i === 3 ? 'd-b' : 'd-line'}"/>
      <text x="${x + 50}" y="71" text-anchor="middle" class="t-mono">${v}${i === 3 ? L(' (현재)', ' (current)') : ''}</text>
      <text x="${x + 50}" y="100" text-anchor="middle" class="t-small t-dim">${d}</text>`;
    }).join('');
    const steps = [0, 1, 2].map((i) => `<path d="M${122 + i * 130},67 L${148 + i * 130},67" class="d-b" marker-end="url(#arrB)"/>`).join('');
    return `<svg viewBox="0 0 540 198" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="arrB" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="arrA" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
      <marker id="arrD" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    </defs>
    ${boxes}
    ${steps}
    <rect x="410" y="140" width="100" height="26" rx="4" class="f-dim"/>
    <text x="460" y="157" text-anchor="middle" class="t-small">${L('현재 형식 읽기', 'Current reader')}</text>
    <path d="M500,84 L500,138" class="d-b" marker-end="url(#arrB)"/>
    <path d="M60,106 Q70,172 406,153" class="d-a" stroke-dasharray="4 3" marker-end="url(#arrA)"/>
    <text x="140" y="134" class="t-small t-a">${L('A: v1을 바로 읽음, 필드 없음, 값 손실', 'A: reads v1 directly, fields missing, data lost')}</text>
    <text x="20" y="190" class="t-small t-b">${L('B: version 필드로 시작 단계를 정하고 한 단계씩 변환', 'B: the version field picks the first step, then convert one step at a time')}</text>
  </svg>`;
  },
  look: [
    '처음 화면에서 A는 현재 버전(v4)이 아닌 슬롯이 모두 "실패"(빨강). B는 모든 슬롯이 "성공"(초록).',
    'A의 읽기 방식을 "기본값으로 메우기"로 바꾸면 실패는 사라지지만 구버전 슬롯이 "손실"(노랑)이 됨. 오른쪽 결과에서 금화, 아이템, 이름이 기본값으로 바뀐 것이 보임.',
    '"현재 게임 버전"을 2로 낮추면 구버전 세이브 종류가 줄어서 A의 실패도 줄어듦. 버전이 오를수록 버전 관리 없이 버티기 어려움.',
    'B에서 v1 슬롯을 클릭하면 마이그레이션 단계 v1→v2→v3→v4가 차례로 강조됨.',
  ],
  refs: [
    { type: 'book', title: 'Designing Data-Intensive Applications, 4장 Encoding and Evolution (Martin Kleppmann)', year: 2017, note: '상위 호환, 하위 호환과 스키마 진화.' },
    { type: 'article', title: 'Protocol Buffers - Updating A Message Type', url: 'https://protobuf.dev/programming-guides/proto3/#updating', note: '필드 번호를 유지해 형식을 바꾸는 규칙.' },
    { type: 'engine', title: 'Unreal Engine - Custom Versions (FCustomVersion)', note: '직렬화 코드에서 버전 번호를 확인해 구버전 에셋과 세이브를 읽는 방식.' },
  ],
  params: [
    { key: 'gameVer', label: '현재 게임 버전', type: 'int', min: 2, max: 4, default: 4, shared: true, reset: true, group: '장면' },
    { key: 'slots', label: '세이브 슬롯 수', type: 'int', min: 4, max: 15, default: 12, shared: true, reset: true },
    { key: 'auto', label: '자동 데모', type: 'bool', default: true, shared: true },
    { key: 'mode', label: '읽기 방식', type: 'select', group: '불러오기', options: [
      { value: 'naive', label: '현재 형식만 읽기' },
      { value: 'defaults', label: '기본값으로 메우기 (버전 없음)' },
      { value: 'migrate', label: '버전 + 마이그레이션' },
    ], a: 'naive', b: 'migrate' },
    { key: 'regen', label: '새 세이브 만들기', type: 'button', buttonLabel: '새 세이브 만들기' },
  ],
  en: {
    title: 'Save Data Versioning & Migration',
    summary: 'When an update changes the save format, code that reads only the current format fails on old saves or loses values. Put a version number in the save and convert one step at a time (v1→v2→v3). Then any save version loads as it was.',
    views: { a: 'Read current format only', b: 'Version + migration' },
    controls: 'Click a save slot to see its raw data and the load result on the right. The auto demo shows the slots one by one.',
    info: `
    <p><b>Save data versioning</b> writes the format version into the save file. When loading, it converts the data to match that version.</p>
    <p>The save format changes with each update. Example:</p>
    <ul>
      <li>v2: move <code>hp</code> to <code>stats.hp</code> and add an inventory.</li>
      <li>v3: move gold into <code>wallet</code> and add gems. Change the inventory to counted stacks.</li>
      <li>v4: move the name into <code>profile</code> and change the inventory to a dictionary.</li>
    </ul>
    <p>If you read only the current format, an old save hits missing fields and throws an error (load failure). Filling in defaults avoids errors. But it cannot find fields that moved, so gold or items silently disappear. This is more dangerous.</p>
    <p>Migration method:</p>
    <ul>
      <li>Always write <code>version</code> when saving. If there is no version field, treat it as v1.</li>
      <li>Each conversion function only goes to the next version (v1→v2, v2→v3, ...). For a new version, you add just one function.</li>
      <li>When loading, apply them in order until you reach the current version. Then you keep only one reader for the current format.</li>
    </ul>
    <p>Downside: you must keep and test the conversion functions forever. Keep sample old saves as test data. You must also block old game versions from reading new saves (forward compatibility) separately.</p>`,
    look: [
      'On the first screen, every A slot that is not the current version (v4) shows "Failed" (red). Every B slot shows "OK" (green).',
      'Switch A\'s read mode to "Fill in defaults". Failures go away, but old slots show "Lost" (yellow). The result on the right shows gold, items, and name replaced by defaults.',
      'Lower "Current game version" to 2. There are fewer old save types, so A fails less. The higher the version, the harder it is to get by without versioning.',
      'In B, click a v1 slot. The migration steps v1→v2→v3→v4 light up in order.',
    ],
    refs: [
      { title: 'Designing Data-Intensive Applications, Chapter 4 Encoding and Evolution (Martin Kleppmann)', note: 'Forward and backward compatibility, and schema evolution.' },
      'Rules for changing a format while keeping field numbers.',
      'Serialization code checks a version number to read old assets and saves.',
    ],
    params: {
      gameVer: { label: 'Current game version', group: 'Scene' },
      slots: 'Save slot count',
      auto: 'Auto demo',
      mode: { label: 'Read mode', group: 'Loading', options: { naive: 'Read current format only', defaults: 'Fill in defaults (no version)', migrate: 'Version + migration' } },
      regen: { label: 'New saves', buttonLabel: 'New saves' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const NAMES = GTL.L(['미나', '도윤', 'Alex', '서연', 'Kai', '하준', 'Lena', '지호'], ['Mina', 'Doyun', 'Alex', 'Seoyeon', 'Kai', 'Hajun', 'Lena', 'Jiho']);
    const ITEMS = ['sword', 'potion', 'shield', 'key', 'bow'];
    const MAPS = ['town', 'forest', 'cave'];
    const FIELDS = ['name', 'hp', 'maxHp', 'gold', 'gems', 'x', 'y', 'map', 'items'];

    // 버전별 저장 코드 (그 버전의 게임이 쓰던 형식)
    const countIds = (arr) => { const m = {}; for (const id of arr) m[id] = (m[id] || 0) + 1; return Object.keys(m).sort().map((id) => ({ id, n: m[id] })); };
    const WRITE = {
      1: (p) => ({ name: p.name, hp: p.hp, gold: p.gold, x: p.x, y: p.y }),
      2: (p) => ({ version: 2, name: p.name, stats: { hp: p.hp, maxHp: p.maxHp }, gold: p.gold, pos: { x: p.x, y: p.y }, inventory: p.items.flatMap((i) => Array(i.n).fill(i.id)) }),
      3: (p) => ({ version: 3, name: p.name, stats: { hp: p.hp, maxHp: p.maxHp }, wallet: { gold: p.gold, gems: p.gems }, pos: { x: p.x, y: p.y, map: p.map }, inventory: p.items.map((i) => ({ id: i.id, n: i.n })) }),
      4: (p) => ({ version: 4, profile: { name: p.name }, stats: { hp: p.hp, maxHp: p.maxHp }, wallet: { gold: p.gold, gems: p.gems }, pos: { x: p.x, y: p.y, map: p.map }, items: Object.fromEntries(p.items.map((i) => [i.id, i.n])) }),
    };
    // 현재 형식 읽기 코드 (엄격): 필드가 없으면 오류
    const READ = {
      2: (d) => ({ name: d.name, hp: d.stats.hp, maxHp: d.stats.maxHp, gold: d.gold, gems: 0, x: d.pos.x, y: d.pos.y, map: 'town', items: countIds(d.inventory) }),
      3: (d) => ({ name: d.name, hp: d.stats.hp, maxHp: d.stats.maxHp, gold: d.wallet.gold, gems: d.wallet.gems, x: d.pos.x, y: d.pos.y, map: d.pos.map, items: d.inventory.map((i) => ({ id: i.id, n: i.n })) }),
      4: (d) => ({ name: d.profile.name, hp: d.stats.hp, maxHp: d.stats.maxHp, gold: d.wallet.gold, gems: d.wallet.gems, x: d.pos.x, y: d.pos.y, map: d.pos.map, items: Object.keys(d.items).sort().map((id) => ({ id, n: d.items[id] })) }),
    };
    // 기본값으로 메우기: 현재 형식 경로만 찾고 없으면 기본값
    const LENIENT = {
      2: (d) => ({ name: d.name ?? GTL.L('플레이어', 'Player'), hp: d.stats?.hp ?? 100, maxHp: d.stats?.maxHp ?? 100, gold: d.gold ?? 0, gems: 0, x: d.pos?.x ?? 0, y: d.pos?.y ?? 0, map: 'town', items: countIds(Array.isArray(d.inventory) ? d.inventory : []) }),
      3: (d) => ({ name: d.name ?? GTL.L('플레이어', 'Player'), hp: d.stats?.hp ?? 100, maxHp: d.stats?.maxHp ?? 100, gold: d.wallet?.gold ?? 0, gems: d.wallet?.gems ?? 0, x: d.pos?.x ?? 0, y: d.pos?.y ?? 0, map: d.pos?.map ?? 'town', items: Array.isArray(d.inventory) ? d.inventory.filter((i) => i && i.id).map((i) => ({ id: i.id, n: i.n ?? 1 })) : [] }),
      4: (d) => ({ name: d.profile?.name ?? GTL.L('플레이어', 'Player'), hp: d.stats?.hp ?? 100, maxHp: d.stats?.maxHp ?? 100, gold: d.wallet?.gold ?? 0, gems: d.wallet?.gems ?? 0, x: d.pos?.x ?? 0, y: d.pos?.y ?? 0, map: d.pos?.map ?? 'town', items: d.items && !Array.isArray(d.items) ? Object.keys(d.items).sort().map((id) => ({ id, n: d.items[id] })) : [] }),
    };
    // 마이그레이션: 바로 다음 버전으로만 변환
    const MIGRATE = {
      1: (d) => ({ version: 2, name: d.name, stats: { hp: d.hp, maxHp: 100 }, gold: d.gold, pos: { x: d.x, y: d.y }, inventory: [] }),
      2: (d) => ({ version: 3, name: d.name, stats: { ...d.stats }, wallet: { gold: d.gold, gems: 0 }, pos: { ...d.pos, map: 'town' }, inventory: countIds(d.inventory) }),
      3: (d) => ({ version: 4, profile: { name: d.name }, stats: { ...d.stats }, wallet: { ...d.wallet }, pos: { ...d.pos }, items: Object.fromEntries(d.inventory.map((i) => [i.id, i.n])) }),
    };

    let saves, selected, autoT, steps, loadMs;
    function makeProfile(r, ver) {
      const p = { name: r.pick(NAMES), hp: r.int(10, 100), maxHp: 100, gold: r.int(1, 999), gems: r.int(0, 40), x: r.int(0, 300), y: r.int(0, 200), map: r.pick(MAPS), items: [] };
      const nItems = r.int(1, 3), picks = r.shuffle(ITEMS.slice()).slice(0, nItems).sort();
      const counts = picks.map((id) => r.int(1, 5));
      // 그 버전에 없던 정보는 그 버전 게임에서 생길 수 없음. 마이그레이션 기본값과 같게 둠
      if (ver < 2) { p.maxHp = 100; } else p.items = picks.map((id, k) => ({ id, n: counts[k] }));
      if (ver < 3) { p.gems = 0; p.map = 'town'; }
      return p;
    }
    function generate() {
      const r = ctx.rng;
      saves = [];
      for (let i = 0; i < P.slots; i++) {
        const ver = 1 + Math.floor(r.next() * P.gameVer);
        const truth = makeProfile(r, ver);
        saves.push({ ver, truth, raw: JSON.stringify(WRITE[ver](truth)) });
      }
      selected = 0; autoT = 0;
    }
    ctx.rng = U.rng(ctx.seed);
    generate();

    function load(s) {
      const cur = P.gameVer;
      const out = { status: 'ok', diff: [], chain: [], error: '', loaded: null };
      try {
        let d = JSON.parse(s.raw);
        if (P.mode === 'naive') out.loaded = READ[cur](d);
        else if (P.mode === 'defaults') out.loaded = LENIENT[cur](d);
        else {
          let v = d.version ?? 1;
          out.chain.push(v);
          if (v > cur) throw new Error(GTL.L(`v${v} 세이브는 v${cur} 게임에서 읽을 수 없음`, `A v${v} save cannot be read by a v${cur} game`));
          while (v < cur) { d = MIGRATE[v](d); v++; out.chain.push(v); steps++; }
          out.loaded = READ[cur](d);
        }
        for (const f of FIELDS) {
          const a = f === 'items' ? JSON.stringify(out.loaded.items) : out.loaded[f], b = f === 'items' ? JSON.stringify(s.truth.items) : s.truth[f];
          if (a !== b) out.diff.push(f);
        }
        if (out.diff.length) out.status = 'loss';
      } catch (e) { out.status = 'fail'; out.error = (e && e.name ? e.name + ': ' : '') + (e && e.message ? e.message : String(e)); }
      return out;
    }

    function cardRects() {
      const W = ctx.width, H = ctx.height;
      const areaW = W * 0.5, cols = 3, rowsN = Math.ceil(saves.length / cols);
      const cw = (areaW - 16) / cols - 6, ch = Math.min(52, (H - 50) / rowsN - 6);
      return saves.map((_, i) => ({ x: 10 + (i % cols) * (cw + 6), y: 32 + Math.floor(i / cols) * (ch + 6), w: cw, h: ch }));
    }
    function wrapChars(str, n) { const out = []; for (let i = 0; i < str.length; i += n) out.push(str.slice(i, i + n)); return out; }

    return {
      update(dt) {
        if (P.auto) { autoT += dt; if (autoT > 1.6) { autoT = 0; selected = (selected + 1) % saves.length; } }
      },
      onPointer(type, m) {
        if (type !== 'down') return;
        cardRects().forEach((r, i) => { if (m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h) { selected = i; autoT = -3; } });
      },
      onAction(key) { if (key === 'regen') generate(); },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        steps = 0;
        const t0 = ctx.now();
        const results = saves.map(load);
        loadMs = ctx.now() - t0;
        D.text(g, GTL.L(`현재 게임 v${P.gameVer}, 세이브 ${saves.length}개`, `Current game v${P.gameVer}, ${saves.length} saves`), 10, 10, { size: 12, color: col });
        const SC = { ok: C.good, loss: C.warn, fail: C.bad }, SL = GTL.L({ ok: '성공', loss: '손실', fail: '실패' }, { ok: 'OK', loss: 'Lost', fail: 'Failed' });
        const rects = cardRects();
        let ok = 0, loss = 0, fail = 0;
        results.forEach((res, i) => {
          const r = rects[i], s = saves[i];
          if (res.status === 'ok') ok++; else if (res.status === 'loss') loss++; else fail++;
          D.rect(g, r.x, r.y, r.w, r.h, '#1f2530', i === selected ? '#fff' : SC[res.status], i === selected ? 2 : 1);
          D.rect(g, r.x, r.y, 4, r.h, SC[res.status]);
          D.text(g, GTL.L(`슬롯 ${i + 1}`, `Slot ${i + 1}`), r.x + 10, r.y + 5, { size: 11, color: '#fff' });
          D.text(g, `v${s.ver}`, r.x + r.w - 6, r.y + 5, { size: 11, color: s.ver === P.gameVer ? C.dim : C.accent, align: 'right' });
          D.text(g, SL[res.status], r.x + 10, r.y + r.h - 16, { size: 11, color: SC[res.status] });
        });

        // 선택한 슬롯 상세
        const dx = W * 0.5 + 6, dw = W - dx - 8;
        const s = saves[selected], res = results[selected];
        let y = 10;
        D.text(g, GTL.L(`슬롯 ${selected + 1} 원본 (v${s.ver})`, `Slot ${selected + 1} raw (v${s.ver})`), dx, y, { size: 11, color: C.dim }); y += 16;
        const cpl = Math.max(10, Math.floor(dw / 6.2));
        for (const ln of wrapChars(s.raw, cpl).slice(0, 5)) { D.text(g, ln, dx, y, { size: 10, color: '#9fb3c8' }); y += 12; }
        y += 6;
        if (P.mode === 'migrate') {
          D.text(g, GTL.L('마이그레이션', 'Migration'), dx, y, { size: 11, color: C.dim }); y += 16;
          let x = dx;
          for (let v = 1; v <= P.gameVer; v++) {
            const used = res.chain.includes(v);
            D.rect(g, x, y, 28, 18, used ? col : '#232a35', used ? '#fff' : 'rgba(255,255,255,0.2)', 1);
            D.text(g, `v${v}`, x + 14, y + 9, { size: 10, color: used ? '#111' : C.dim, align: 'center', baseline: 'middle' });
            if (v < P.gameVer) D.arrow(g, x + 30, y + 9, x + 44, y + 9, used && res.chain.includes(v + 1) ? '#fff' : 'rgba(255,255,255,0.2)', 1.5, 5);
            x += 46;
          }
          y += 28;
        }
        D.text(g, GTL.L(`불러온 결과: ${SL[res.status]}`, `Load result: ${SL[res.status]}`), dx, y, { size: 12, color: SC[res.status] }); y += 18;
        if (res.status === 'fail') {
          for (const ln of wrapChars(res.error, cpl).slice(0, 3)) { D.text(g, ln, dx, y, { size: 10, color: C.bad }); y += 13; }
          D.text(g, GTL.L('진행 상황을 불러오지 못함', 'Could not load progress'), dx, y + 4, { size: 11, color: C.bad });
        } else {
          for (const f of FIELDS) {
            if (y > H - 14) break;
            const v = f === 'items' ? res.loaded.items.map((i) => `${i.id}×${i.n}`).join(' ') || GTL.L('(없음)', '(none)') : String(res.loaded[f]);
            const bad = res.diff.includes(f);
            const truth = f === 'items' ? s.truth.items.map((i) => `${i.id}×${i.n}`).join(' ') || GTL.L('(없음)', '(none)') : String(s.truth[f]);
            D.text(g, `${f}: ${v}${bad ? GTL.L(`  (원래 ${truth})`, `  (was ${truth})`) : ''}`.slice(0, cpl + 6), dx, y, { size: 10, color: bad ? C.warn : C.text }); y += 13;
          }
        }

        ctx.stat(GTL.L('성공 / 손실 / 실패', 'OK / lost / failed'), `${ok} / ${loss} / ${fail}`);
        ctx.stat(GTL.L('잃어버린 필드 수 (전체)', 'Lost fields (total)'), results.reduce((n, r) => n + (r.status === 'loss' ? r.diff.length : 0), 0));
        ctx.stat(GTL.L('마이그레이션 단계 실행', 'Migration steps run'), steps);
        ctx.stat(GTL.L('전체 불러오기 시간', 'Total load time'), loadMs.toFixed(2) + ' ms');
      },
    };
  },
});
