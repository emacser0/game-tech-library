// 커맨드 패턴: 직접 실행 vs 커맨드 객체 (실행 취소, 다시 실행, 리플레이)
GTL.register({
  id: 'command-undo',
  title: '커맨드 패턴: 실행 취소, 다시 실행, 리플레이',
  summary: '입력을 받자마자 데이터를 바꾸면 되돌릴 방법 없음. 동작을 커맨드 객체로 만들어 기록하면 실행 취소, 다시 실행, 리플레이가 됨. 바뀐 칸만 저장해서 전체 스냅숏보다 메모리가 훨씬 적음.',
  views: { a: '직접 실행', b: '커맨드 객체' },
  controls: '드래그로 타일 칠하기, Shift + 클릭으로 영역 채우기. Z 실행 취소, X 다시 실행. 자동 데모가 칠하기와 실행 취소를 반복.',
  info: `
    <p><b>커맨드 패턴</b>(Command)은 "무엇을 할지"를 객체로 만드는 방법. 객체에 <code>execute()</code>와 <code>undo()</code>를 둠.</p>
    <p>직접 실행은 입력 처리 코드가 데이터를 바로 바꿈. 바꾸기 전 값이 남지 않아서 되돌릴 수 없음.</p>
    <p>커맨드 방식의 동작:</p>
    <ul>
      <li>칠하기 커맨드는 바뀐 칸의 번호, 이전 값, 새 값만 저장</li>
      <li>실행 취소: 커맨드를 실행 취소 스택에서 꺼내 <code>undo()</code>를 호출하고 다시 실행 스택에 넣음</li>
      <li>새 동작을 하면 다시 실행 스택을 비움</li>
      <li>리플레이: 처음 상태에서 커맨드를 순서대로 다시 실행. 결정적(deterministic)이면 같은 결과가 나옴.</li>
      <li>같은 커맨드 기록을 네트워크로 보내거나 AI 입력으로 쓸 수도 있음</li>
    </ul>
    <p>비교용 <b>스냅숏</b> 방식은 동작마다 전체 맵을 복사. 구현은 쉽지만 메모리가 맵 크기 × 기록 수만큼 늘어남. 커맨드는 바뀐 칸 수에 비례하므로, 넓은 영역 채우기처럼 많은 칸을 바꾸는 동작에서는 차이가 줄어듦.</p>
    <p>단점: 모든 상태 변경이 커맨드를 거쳐야 함. 한 군데라도 직접 바꾸면 실행 취소 결과가 어긋남. 무작위나 시간에 의존하는 동작은 결과를 커맨드에 저장해야 리플레이가 같아짐.</p>`,
  // 도식: 실행 취소 스택과 다시 실행 스택 사이의 커맨드 이동, 아래는 스냅숏 vs 커맨드 메모리
  diagram: (L) => `<svg viewBox="0 0 540 206" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <rect x="10" y="96" width="90" height="28" rx="4" class="f-dim"/>
    <text x="55" y="114" text-anchor="middle" class="t-small">${L('새 동작', 'New action')}</text>
    <path d="M100,110 L148,110" class="d-accent" marker-end="url(#arr)"/>
    <text x="124" y="104" text-anchor="middle" class="t-small t-mono">execute</text>
    <text x="205" y="30" text-anchor="middle">${L('실행 취소 스택', 'Undo stack')}</text>
    <path d="M150,40 L150,130 L260,130 L260,40" class="d-dim"/>
    <rect x="156" y="102" width="98" height="24" class="f-b" opacity="0.35"/><text x="205" y="118" text-anchor="middle" class="t-small">${L('칠하기 #1', 'Paint #1')}</text>
    <rect x="156" y="76" width="98" height="24" class="f-b" opacity="0.35"/><text x="205" y="92" text-anchor="middle" class="t-small">${L('채우기 #2', 'Fill #2')}</text>
    <rect x="156" y="50" width="98" height="24" class="f-b" opacity="0.6"/><text x="205" y="66" text-anchor="middle" class="t-small">${L('칠하기 #3', 'Paint #3')}</text>
    <text x="365" y="30" text-anchor="middle">${L('다시 실행 스택', 'Redo stack')}</text>
    <path d="M310,40 L310,130 L420,130 L420,40" class="d-dim"/>
    <rect x="316" y="102" width="98" height="24" class="f-dim"/><text x="365" y="118" text-anchor="middle" class="t-small">${L('칠하기 #4', 'Paint #4')}</text>
    <path d="M256,58 Q290,44 314,86" class="d-accent" marker-end="url(#arr)"/>
    <text x="285" y="38" text-anchor="middle" class="t-small t-mono">Z: undo()</text>
    <path d="M314,118 Q285,140 258,70" class="d-accent" marker-end="url(#arr)"/>
    <text x="285" y="150" text-anchor="middle" class="t-small t-mono">X: execute()</text>
    <text x="434" y="56" class="t-small">${L('커맨드에 저장:', 'Stored in a command:')}</text>
    <text x="434" y="70" class="t-small t-dim">${L('바뀐 칸 번호', 'changed cell index')}</text>
    <text x="434" y="84" class="t-small t-dim">${L('이전 값, 새 값', 'old value, new value')}</text>
    <text x="434" y="110" class="t-small">${L('새 동작은 다시', 'A new action clears')}</text>
    <text x="434" y="124" class="t-small">${L('실행 스택을 비움', 'the redo stack')}</text>
    <text x="10" y="172" class="t-small">${L('스냅숏', 'Snapshot')}</text>
    <rect x="80" y="163" width="440" height="11" class="f-a"/>
    <text x="10" y="192" class="t-small">${L('커맨드', 'Command')}</text>
    <rect x="80" y="183" width="36" height="11" class="f-b"/>
    <text x="124" y="192" class="t-small t-dim">${L('메모리: 맵 전체 × 기록 수 vs 바뀐 칸 수', 'Memory: whole map × history vs changed cells only')}</text>
  </svg>`,
  look: [
    '자동 데모에서 "실행 취소"가 나올 때 B는 방금 칠한 칸이 원래대로 돌아감(흰 테두리). A는 "실행 취소 불가"만 뜨고 그대로임.',
    'B의 방식을 "스냅숏"으로 바꾸면 실행 취소는 되지만 "기록 메모리"가 커맨드 방식보다 4배 이상 큼. 맵 크기를 64로 키우면 차이가 더 벌어짐.',
    '"리플레이" 버튼을 누르면 B는 빈 맵에서 기록된 커맨드를 하나씩 다시 실행해서 같은 그림을 만듦',
    '직접 드래그로 칠한 뒤 Z를 누르면 두 뷰의 차이가 바로 보임. 입력은 두 뷰에 똑같이 들어감.',
  ],
  refs: [
    { type: 'book', title: 'Game Programming Patterns - Command (Robert Nystrom)', url: 'https://gameprogrammingpatterns.com/command.html', year: 2014, note: '입력 처리, 실행 취소, 리플레이 예제' },
    { type: 'book', title: 'Design Patterns: Elements of Reusable Object-Oriented Software (Gamma, Helm, Johnson, Vlissides)', year: 1994, note: 'Command 패턴의 원전' },
    { type: 'engine', title: 'Unity Scripting API - Undo', url: 'https://docs.unity3d.com/ScriptReference/Undo.html', note: '에디터의 실행 취소 기록 API' },
  ],
  params: [
    { key: 'mode', label: '실행 방식', type: 'select', group: '방식', options: [
      { value: 'direct', label: '직접 실행 (기록 없음)' },
      { value: 'snapshot', label: '스냅숏 (맵 전체 복사)' },
      { value: 'command', label: '커맨드 객체 (바뀐 칸만)' },
    ], a: 'direct', b: 'command', reset: true },
    { key: 'auto', label: '자동 데모', type: 'bool', default: true, shared: true, group: '장면' },
    { key: 'grid', label: '맵 크기 (가로 칸)', type: 'int', min: 16, max: 64, default: 48, shared: true, reset: true },
    { key: 'undo', label: '실행 취소 (Z)', type: 'button', buttonLabel: '실행 취소' },
    { key: 'redo', label: '다시 실행 (X)', type: 'button', buttonLabel: '다시 실행' },
    { key: 'replay', label: '리플레이', type: 'button', buttonLabel: '리플레이' },
  ],

  en: {
    title: 'Command Pattern: Undo, Redo, Replay',
    summary: 'If you change data as soon as input arrives, there is no way back. Turn each action into a command object and record it. You then get undo, redo, and replay. Storing only the changed cells uses far less memory than full snapshots.',
    views: { a: 'Direct edit', b: 'Command objects' },
    controls: 'Drag to paint tiles. Shift + click to flood fill. Z to undo, X to redo. The auto demo keeps painting and undoing.',
    info: `
    <p>The <b>command pattern</b> turns "what to do" into an object. The object has <code>execute()</code> and <code>undo()</code>.</p>
    <p>With direct edits, input code changes the data right away. The old value is gone, so you cannot undo.</p>
    <p>How commands work:</p>
    <ul>
      <li>A paint command stores only the changed cell indices, the old values, and the new values.</li>
      <li>Undo: pop a command from the undo stack, call <code>undo()</code>, and push it onto the redo stack.</li>
      <li>A new action clears the redo stack.</li>
      <li>Replay: start from the initial state and run the commands again in order. If they are deterministic, you get the same result.</li>
      <li>You can also send the same command log over the network or use it as AI input.</li>
    </ul>
    <p>For comparison, the <b>snapshot</b> method copies the whole map on every action. It is easy to build, but memory grows by map size × history length. Commands grow with the number of changed cells. So the gap shrinks for actions that change many cells, like a large flood fill.</p>
    <p>Downside: every state change must go through a command. If even one place edits data directly, undo results drift. Actions that depend on randomness or time must store their result in the command, or replay will differ.</p>`,
    look: [
      'When the auto demo does "Undo", B puts the cells it just painted back (white outline). A only shows "Cannot undo" and stays the same.',
      'Switch B\'s mode to "Snapshot". Undo still works, but "History memory" is over 4 times larger than with commands. Raise the map size to 64 and the gap grows.',
      'Press the "Replay" button. B runs the recorded commands one by one on an empty map and builds the same picture.',
      'Paint by dragging, then press Z. You see the difference between the views right away. Both views get the same input.',
    ],
    refs: [
      'Examples of input handling, undo, and replay.',
      'The original source of the Command pattern.',
      'The editor API for undo history.',
    ],
    params: {
      mode: { label: 'Edit mode', group: 'Method', options: { direct: 'Direct edit (no history)', snapshot: 'Snapshot (copy whole map)', command: 'Command objects (changed cells only)' } },
      auto: { label: 'Auto demo', group: 'Scene' },
      grid: 'Map size (columns)',
      undo: { label: 'Undo (Z)', buttonLabel: 'Undo' },
      redo: { label: 'Redo (X)', buttonLabel: 'Redo' },
      replay: { label: 'Replay', buttonLabel: 'Replay' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const PALETTE = ['#1a1f27', '#66d17a', '#4fc3f7', '#ffcb6b', '#ff7a59', '#c792ea'];
    const MAX_HISTORY = 200, CMD_OVERHEAD = 48, BYTES_PER_CELL = 4; // 칸 번호 2바이트 + 이전 값 + 새 값
    let cols, rows, tiles, initial, undoStack, redoStack, current, failCount, flashFail, flashCells, flashT;
    let t, stepTimer, step, replay, lastChanged, colorIdx, layoutCache;

    function init() {
      ctx.rng = U.rng(ctx.seed);
      cols = P.grid; rows = Math.round(cols * 0.55);
      tiles = new Uint8Array(cols * rows);
      for (let x = 0; x < cols; x++) tiles[(rows - 1) * cols + x] = 1; // 바닥
      initial = tiles.slice();
      undoStack = []; redoStack = []; current = null;
      failCount = 0; flashFail = 0; flashCells = null; flashT = 0;
      t = 0; stepTimer = 0.6; step = 0; replay = null; lastChanged = 0; colorIdx = 2;
    }
    init();

    // 동작 시작: 스냅숏은 바꾸기 전 맵을 복사, 커맨드는 빈 커맨드 객체 생성
    function begin(name) {
      if (replay) return;
      current = { name, cells: [], before: [], after: [], snap: P.mode === 'snapshot' ? tiles.slice() : null };
    }
    function setCell(i, v) {
      if (!current || tiles[i] === v) return;
      if (P.mode === 'command') { current.cells.push(i); current.before.push(tiles[i]); current.after.push(v); }
      else current.cells.push(i);
      tiles[i] = v;
    }
    function end() {
      if (!current) return;
      const c = current; current = null;
      if (!c.cells.length) return;
      lastChanged = c.cells.length;
      if (P.mode === 'direct') return; // 기록하지 않음
      const entry = P.mode === 'command'
        ? { name: c.name, cells: Uint16Array.from(c.cells), before: Uint8Array.from(c.before), after: Uint8Array.from(c.after) }
        : { name: c.name, n: c.cells.length, snap: c.snap };
      undoStack.push(entry); redoStack.length = 0;
      if (undoStack.length > MAX_HISTORY) {
        const old = undoStack.shift();
        // 가장 오래된 커맨드를 버릴 때 리플레이 시작 상태에 결과를 합쳐 둠
        if (old.after) for (let k = 0; k < old.cells.length; k++) initial[old.cells[k]] = old.after[k];
      }
    }
    function apply(cmd, values) { for (let k = 0; k < cmd.cells.length; k++) tiles[cmd.cells[k]] = values[k]; }

    function undo() {
      if (replay) return;
      if (P.mode === 'direct' || !undoStack.length) { if (P.mode === 'direct') { failCount++; flashFail = 0.8; } return; }
      const e = undoStack.pop();
      if (P.mode === 'command') { apply(e, e.before); flash(e.cells); }
      else { const now = tiles.slice(); flash(diff(now, e.snap)); tiles.set(e.snap); e.snap = now; }
      redoStack.push(e);
    }
    function redo() {
      if (replay) return;
      if (P.mode === 'direct' || !redoStack.length) { if (P.mode === 'direct') { failCount++; flashFail = 0.8; } return; }
      const e = redoStack.pop();
      if (P.mode === 'command') { apply(e, e.after); flash(e.cells); }
      else { const now = tiles.slice(); flash(diff(now, e.snap)); tiles.set(e.snap); e.snap = now; }
      undoStack.push(e);
    }
    function diff(a, b) { const out = []; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) out.push(i); return out; }
    function flash(cells) { flashCells = cells; flashT = 0.6; }
    function startReplay() {
      if (P.mode === 'direct') { failCount++; flashFail = 0.8; return; }
      if (P.mode === 'command') { tiles.set(initial); replay = { i: 0, timer: 0, list: undoStack.slice() }; }
      else {
        // 스냅숏: 각 동작 직전의 맵을 순서대로 보여 주고 마지막에 현재 맵으로 돌아옴
        replay = { i: 0, timer: 0, list: undoStack.slice(), final: tiles.slice() };
        if (replay.list.length) tiles.set(replay.list[0].snap);
      }
    }

    // 맵 편집 동작 (자동 데모와 마우스가 같은 함수를 씀)
    function strokeLine(x0, y0, x1, y1, v) {
      begin(GTL.L('칠하기', 'Paint'));
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let k = 0; k <= n; k++) {
        const x = Math.round(U.lerp(x0, x1, k / n)), y = Math.round(U.lerp(y0, y1, k / n));
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < cols && yy < rows) setCell(yy * cols + xx, v);
        }
      }
      end();
    }
    function floodFill(x, y, v) {
      begin(GTL.L('채우기', 'Fill'));
      const from = tiles[y * cols + x];
      if (from !== v) {
        const stack = [y * cols + x];
        const seen = new Uint8Array(cols * rows);
        while (stack.length) {
          const i = stack.pop();
          if (seen[i] || tiles[i] !== from) continue;
          seen[i] = 1; setCell(i, v);
          const cx = i % cols, cy = (i / cols) | 0;
          if (cx > 0) stack.push(i - 1); if (cx < cols - 1) stack.push(i + 1);
          if (cy > 0) stack.push(i - cols); if (cy < rows - 1) stack.push(i + cols);
        }
      }
      end();
    }

    function demoStep() {
      if (current) return; // 마우스로 칠하는 중이면 건너뜀
      const r = ctx.rng;
      const PLAN = ['stroke', 'stroke', 'fill', 'undo', 'undo', 'redo', 'stroke', 'fill', 'undo', 'stroke'];
      const kind = PLAN[step % PLAN.length];
      // 무작위 값은 동작 종류와 관계없이 항상 같은 개수만큼 뽑음. 그래야 두 뷰가 같은 순서를 유지
      const x0 = r.int(0, cols - 1), y0 = r.int(0, rows - 2), x1 = r.int(0, cols - 1), y1 = r.int(0, rows - 2), v = r.int(1, PALETTE.length - 1);
      if (kind === 'stroke') strokeLine(x0, y0, x1, y1, v);
      else if (kind === 'fill') floodFill(x0, y0, v);
      else if (kind === 'undo') undo();
      else redo();
      step++;
      if (step % 30 === 0) startReplay();
    }

    function layout() {
      const W = ctx.width, H = ctx.height;
      const areaW = W * 0.68 - 16, areaH = H - 50;
      const cs = Math.max(2, Math.floor(Math.min(areaW / cols, areaH / rows)));
      return { cs, ox: 10, oy: 34 };
    }
    function cellAt(m) {
      const L = layout();
      const x = Math.floor((m.x - L.ox) / L.cs), y = Math.floor((m.y - L.oy) / L.cs);
      return x >= 0 && y >= 0 && x < cols && y < rows ? { x, y } : null;
    }
    let lastCell = null;

    return {
      update(dt) {
        t += dt;
        flashFail = Math.max(0, flashFail - dt); flashT = Math.max(0, flashT - dt);
        const kb = ctx.input;
        if (kb.pressed('KeyZ')) undo();
        if (kb.pressed('KeyX')) redo();
        if (replay) {
          replay.timer -= dt;
          if (replay.timer <= 0) {
            replay.timer = 0.12;
            if (replay.i < replay.list.length) {
              const e = replay.list[replay.i++];
              if (P.mode === 'command') { apply(e, e.after); flash(e.cells); }
              else tiles.set(replay.i < replay.list.length ? replay.list[replay.i].snap : replay.final);
            } else replay = null;
          }
          return;
        }
        if (P.auto) {
          stepTimer -= dt;
          if (stepTimer <= 0) { stepTimer = 0.7; demoStep(); }
        }
      },
      onPointer(type, m) {
        if (replay) return;
        const c = cellAt(m);
        const shift = ctx.input.key('ShiftLeft') || ctx.input.key('ShiftRight');
        if (type === 'down' && c) {
          colorIdx = 1 + (colorIdx % (PALETTE.length - 1));
          if (shift) { floodFill(c.x, c.y, colorIdx); return; }
          begin(GTL.L('칠하기', 'Paint')); setCell(c.y * cols + c.x, colorIdx); lastCell = c;
        } else if (type === 'move' && current && m.down && c && lastCell) {
          const n = Math.max(Math.abs(c.x - lastCell.x), Math.abs(c.y - lastCell.y), 1);
          for (let k = 0; k <= n; k++) {
            const x = Math.round(U.lerp(lastCell.x, c.x, k / n)), y = Math.round(U.lerp(lastCell.y, c.y, k / n));
            setCell(y * cols + x, colorIdx);
          }
          lastCell = c;
        } else if (type === 'up' || type === 'leave') { end(); lastCell = null; }
      },
      onAction(key) {
        if (key === 'undo') undo();
        else if (key === 'redo') redo();
        else if (key === 'replay') startReplay();
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        const L = layout(), cs = L.cs;
        D.rect(g, L.ox - 1, L.oy - 1, cols * cs + 2, rows * cs + 2, null, 'rgba(255,255,255,0.25)', 1);
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const v = tiles[y * cols + x];
          if (v) D.rect(g, L.ox + x * cs, L.oy + y * cs, cs, cs, PALETTE[v]);
        }
        if (flashT > 0 && flashCells) {
          g.globalAlpha = flashT / 0.6;
          for (const i of flashCells) D.rect(g, L.ox + (i % cols) * cs + 0.5, L.oy + ((i / cols) | 0) * cs + 0.5, cs - 1, cs - 1, null, '#fff', 1.5);
          g.globalAlpha = 1;
        }
        if (flashFail > 0) D.text(g, GTL.L('실행 취소 불가 (기록 없음)', 'Cannot undo (no history)'), L.ox + cols * cs / 2, L.oy + rows * cs / 2, { size: 16, color: C.bad, align: 'center', baseline: 'middle' });
        if (replay) D.text(g, GTL.L(`리플레이 ${replay.i} / ${replay.list.length}`, `Replay ${replay.i} / ${replay.list.length}`), L.ox + 4, L.oy + 4, { size: 13, color: C.warn });
        D.text(g, GTL.L({ direct: '직접 실행', snapshot: '스냅숏', command: '커맨드' }, { direct: 'Direct edit', snapshot: 'Snapshot', command: 'Command' })[P.mode], 10, 10, { size: 13, color: col });

        // 기록 목록
        const hx = L.ox + cols * cs + 14, hw = W - hx - 8;
        if (hw > 60) {
          D.text(g, GTL.L('기록', 'History'), hx, 10, { size: 12, color: C.dim });
          if (P.mode === 'direct') D.text(g, GTL.L('(저장 안 함)', '(not saved)'), hx, 30, { size: 11, color: C.dim });
          const rowsMax = Math.floor((H - 60) / 16);
          const showU = undoStack.slice(-Math.max(1, rowsMax - Math.min(redoStack.length, 4)));
          let y = 30;
          for (let k = 0; k < showU.length; k++) {
            const e = showU[k], n = e.cells ? e.cells.length : e.n;
            D.text(g, GTL.L(`${e.name} ${n}칸`, `${e.name} ${n} cells`), hx, y, { size: 11, color: k === showU.length - 1 ? col : C.text }); y += 16;
          }
          for (let k = redoStack.length - 1; k >= Math.max(0, redoStack.length - 4); k--) {
            const e = redoStack[k], n = e.cells ? e.cells.length : e.n;
            D.text(g, GTL.L(`${e.name} ${n}칸 (취소됨)`, `${e.name} ${n} cells (undone)`), hx, y, { size: 11, color: C.dim }); y += 16;
          }
        }

        let bytes = 0;
        for (const e of undoStack.concat(redoStack)) bytes += P.mode === 'command' ? CMD_OVERHEAD + e.cells.length * BYTES_PER_CELL : CMD_OVERHEAD + e.snap.length;
        ctx.stat(GTL.L('실행 취소 / 다시 실행 기록', 'Undo / redo history'), P.mode === 'direct' ? GTL.L('없음', 'None') : `${undoStack.length} / ${redoStack.length}`);
        ctx.stat(GTL.L('기록 메모리', 'History memory'), P.mode === 'direct' ? '0 B' : bytes >= 1024 ? (bytes / 1024).toFixed(1) + ' KB' : bytes + ' B');
        ctx.stat(GTL.L('실행 취소 실패 횟수', 'Failed undos'), failCount);
        ctx.stat(GTL.L('마지막 동작이 바꾼 칸', 'Cells changed by last action'), lastChanged);
      },
    };
  },
});
