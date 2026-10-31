// L-시스템 식물: 결정론적 vs 확률적(stochastic) 규칙, 각도 지터, 바람
const PRESETS = {
  a: { label: 'ABOP 1.24a: F→F[+F]F[-F]F', axiom: 'F', angle: 25.7, n: 5, rules: { F: ['F[+F]F[-F]F', 'F[+F]F', 'F[-F]F'] } },
  b: { label: 'ABOP 1.24b: F→F[+F]F[-F][F]', axiom: 'F', angle: 20, n: 5, rules: { F: ['F[+F]F[-F][F]', 'F[+F]F[F]', 'F[-F]F[F]'] } },
  c: { label: 'ABOP 1.24c: 덤불 F→FF-[-F+F+F]+[+F-F-F]', axiom: 'F', angle: 22.5, n: 4, rules: { F: ['FF-[-F+F+F]+[+F-F-F]', 'FF+[+F-F-F]-[-F+F+F]', 'FF-[-F+F]+[+F-F-F]'] } },
  d: { label: 'ABOP 1.24d: X→F[+X]F[-X]+X', axiom: 'X', angle: 20, n: 7, rules: { X: ['F[+X]F[-X]+X', 'F[-X]F[+X]-X', 'F[+X]F-X'], F: ['FF'] } },
  e: { label: 'ABOP 1.24e: X→F[+X][-X]FX', axiom: 'X', angle: 25.7, n: 7, rules: { X: ['F[+X][-X]FX', 'F[-X]FX', 'F[+X]FX'], F: ['FF'] } },
  f: { label: 'ABOP 1.24f: X→F-[[X]+X]+F[+FX]-X', axiom: 'X', angle: 22.5, n: 5, rules: { X: ['F-[[X]+X]+F[+FX]-X', 'F+[[X]-X]-F[-FX]+X', 'F-[[X]+X]+FX'], F: ['FF'] } },
};
const MAX_LEN = 200000;

GTL.register({
  id: 'lsystem-plants',
  title: 'L-시스템 식물 (결정론적 vs 확률적)',
  summary: '결정론적 vs 확률적 L-시스템 비교. 규칙이 하나뿐이면 모든 개체가 복제품이 됨. 확률적 규칙과 각도 지터를 넣으면 같은 종의 서로 다른 개체가 됨.',
  views: { a: '결정론적 L-시스템', b: '확률적 L-시스템' },
  controls: '조작 없음. "다시 생성"을 누르면 새 시드로 만듦.',
  info: `
    <p><b>L-시스템</b>(Lindenmayer, 1968): 문자열 다시쓰기 규칙으로 식물 모양을 만드는 방식.
    공리(axiom, 시작 문자열)에서 출발함. 매 반복마다 모든 기호를 규칙에 따라 <i>동시에</i> 바꿈.
    예: <code>F → F[+F]F[-F]F</code>.</p>
    <p>결과 문자열은 거북이 그래픽 명령으로 해석함:</p>
    <ul>
      <li><code>F</code>: 앞으로 가며 선 그리기</li>
      <li><code>+ −</code>: 회전</li>
      <li><code>[ ]</code>: 상태 저장, 복원(가지)</li>
      <li><code>X</code> 같은 그리지 않는 기호: 성장점 역할</li>
    </ul>
    <p><b>확률적 L-시스템</b>: 한 기호에 규칙을 여러 개 두고 확률로 고름(ABOP 1.7절).
    분기 패턴 같은 구조적 특징은 유지됨. 그러면서 개체마다 모양이 달라짐.
    여기에 회전각, 길이 지터를 더하면 숲 전체가 복사, 붙여넣기처럼 보이는 문제를 피함.</p>
    <p>단점: 반복할수록 문자열 길이가 지수적으로 늘어남. 그래서 실제 게임에서는 결과를 메쉬로 굽거나, SpeedTree 같은 별도 규칙 기반 도구를 씀.</p>`,
  // 도식: 다시쓰기 규칙 한 번 적용, 거북이 해석, 결정론적 vs 확률적 규칙으로 자란 식물
  diagram: (L) => {
    const turtle = (str, x, y, len, ang) => {
      let px = x, py = y, a = -90, d = '';
      const st = [];
      for (const c of str) {
        if (c === 'F') { const nx = px + Math.cos(a * Math.PI / 180) * len, ny = py + Math.sin(a * Math.PI / 180) * len; d += `M${px.toFixed(1)},${py.toFixed(1)} L${nx.toFixed(1)},${ny.toFixed(1)} `; px = nx; py = ny; }
        else if (c === '+') a -= ang; else if (c === '-') a += ang;
        else if (c === '[') st.push([px, py, a]); else if (c === ']') [px, py, a] = st.pop();
      }
      return d;
    };
    const R = ['F[+F]F[-F]F', 'F[+F]F', 'F[-F]F'];
    const grow = (picks) => { let i = 0; return [...R[0]].map((c) => (c === 'F' ? R[picks[i++ % picks.length]] : c)).join(''); };
    const det = grow([0]);
    const sto = [grow([1, 0, 2, 0, 1]), grow([2, 2, 0, 1, 0]), grow([0, 1, 1, 2, 2])];
    return `<svg viewBox="0 0 540 206" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="22" class="t-mono">F  →  F[+F]F[-F]F</text>
    <text x="10" y="38" class="t-small t-dim">${L('모든 기호를 규칙으로 동시에 바꿈', 'Replace every symbol at once')}</text>
    <path d="${turtle(R[0], 230, 72, 16, 26)}" class="d-line"/>
    <text x="300" y="30" class="t-small">${L('F: 앞으로 가며 선 그리기', 'F: move forward and draw')}</text>
    <text x="300" y="44" class="t-small">${L('+ -: 회전', '+ -: turn')}</text>
    <text x="300" y="58" class="t-small">${L('[ ]: 상태 저장, 복원 (가지)', '[ ]: save, restore state (branch)')}</text>
    <line x1="270" y1="84" x2="270" y2="200" class="d-dim"/>
    <text x="10" y="100" class="t-a">${L('결정론적: 규칙 1개', 'Deterministic: 1 rule')}</text>
    ${[60, 135, 210].map((x) => `<path d="${turtle(det, x, 182, 6, 26)}" class="d-a"/>`).join('')}
    <text x="10" y="198" class="t-small t-dim">${L('모든 개체가 같은 모양', 'Every plant has the same shape')}</text>
    <text x="280" y="100" class="t-b">${L('확률적: 규칙 3개 중 하나를 뽑음', 'Stochastic: pick 1 of 3 rules')}</text>
    <text x="280" y="114" class="t-mono t-small">F → F[+F]F[-F]F | F[+F]F | F[-F]F</text>
    ${sto.map((s, i) => `<path d="${turtle(s, 330 + i * 75, 182, 6, 26)}" class="d-b"/>`).join('')}
    <text x="280" y="198" class="t-small t-dim">${L('구조는 같고 개체마다 모양이 다름', 'Same structure, each plant differs')}</text>
  </svg>`;
  },
  look: [
    'A와 B를 비교하면 A의 식물은 모두 똑같음(같은 규칙, 같은 각도). B는 같은 "종"이지만 가지 배치와 높이가 개체마다 다름.',
    'A에서 "각도 지터"만 올려도 꽤 달라 보임. 반대로 "확률적 규칙"만 켜고 지터를 0으로 두면 분기 구조만 달라짐.',
    '반복 횟수를 1씩 올리면 문자열 길이 수치가 몇 배씩 커짐(ABOP 1.24a는 매번 약 5배).',
    '"바람"을 켜면 가지가 깊이에 비례해 흔들림. 끝가지일수록 많이 움직임.',
  ],
  refs: [
    { type: 'book', title: 'The Algorithmic Beauty of Plants (Prusinkiewicz & Lindenmayer, 1990)', url: 'http://algorithmicbotany.org/papers/#abop', year: 1990, note: '그림 1.24 프리셋의 첫 규칙과 확률적 L-시스템(1.24a 변형은 그림 1.27)의 출처. 나머지 프리셋의 대체 규칙은 이 샘플이 만든 변형.' },
    { type: 'paper', title: 'Mathematical models for cellular interactions in development (Aristid Lindenmayer, J. Theoretical Biology 1968)', year: 1968, note: 'L-시스템 원 논문.' },
    { type: 'engine', title: 'SpeedTree', note: '게임, 영화용 절차적 식생 도구. 규칙 기반 생성에 아티스트 편집을 더함.' },
  ],
  params: [
    { key: 'preset', label: '식물 규칙', type: 'select', group: 'L-시스템', options: Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label })), default: 'd', shared: true },
    { key: 'iters', label: '반복 횟수 (0=프리셋 기본)', type: 'int', min: 0, max: 8, default: 0, shared: true },
    { key: 'stochastic', label: '확률적 규칙', type: 'bool', a: false, b: true, help: '기호마다 여러 규칙 중 하나를 무작위로 고름.' },
    { key: 'jitter', label: '각도 지터 (±°)', type: 'range', min: 0, max: 20, step: 0.5, a: 0, b: 7 },
    { key: 'angleOfs', label: '각도 오프셋 (°)', type: 'range', min: -12, max: 12, step: 0.5, default: 0 },
    { key: 'count', label: '개체 수', type: 'int', min: 1, max: 7, default: 4, shared: true, group: '장면' },
    { key: 'wind', label: '바람', type: 'bool', default: false, shared: true },
    { key: 'grow', label: '자라는 애니메이션', type: 'bool', default: true, shared: true },
    { key: 'regen', label: '다시 생성', type: 'button', buttonLabel: '다시 생성 (새 시드)' },
  ],
  en: {
    title: 'L-System Plants (Deterministic vs Stochastic)',
    summary: 'Deterministic vs stochastic L-systems. With only one rule, every plant is a copy. Add stochastic rules and angle jitter, and you get different plants of the same species.',
    views: { a: 'Deterministic L-system', b: 'Stochastic L-system' },
    controls: 'No input. Press "Regenerate" to build with a new seed.',
    info: `
    <p>An <b>L-system</b> (Lindenmayer, 1968) builds plant shapes with string rewriting rules.
    It starts from an axiom (the start string). Each pass replaces every symbol by its rule <i>at the same time</i>.
    Example: <code>F → F[+F]F[-F]F</code>.</p>
    <p>The result string is read as turtle graphics commands:</p>
    <ul>
      <li><code>F</code>: move forward and draw a line</li>
      <li><code>+ −</code>: turn</li>
      <li><code>[ ]</code>: save and restore state (branch)</li>
      <li>Symbols that do not draw, like <code>X</code>: act as growth points</li>
    </ul>
    <p><b>Stochastic L-systems</b> give one symbol several rules and pick one by chance (ABOP section 1.7).
    Structural traits like the branching pattern stay the same. At the same time, each plant gets its own shape.
    Add turn angle and length jitter, and the whole forest no longer looks copy-pasted.</p>
    <p>Downside: the string length grows exponentially with each pass. So real games bake the result into a mesh, or use a separate rule-based tool like SpeedTree.</p>`,
    look: [
      'Compare A and B. All plants in A are identical (same rule, same angle). B shows the same "species", but branch layout and height differ for each plant.',
      'In A, raise only "Angle jitter". The plants already look quite different. The other way, turn on only "Stochastic rules" with jitter at 0, and only the branching structure changes.',
      'Raise the passes by 1. The string length grows several times (ABOP 1.24a grows about 5 times each pass).',
      'Turn on "Wind". Branches sway in proportion to depth. Outer branches move the most.',
    ],
    refs: ['Source of the first rule in each Figure 1.24 preset and of stochastic L-systems (the 1.24a variant is Figure 1.27). The other alternate rules are variants made for this sample.', 'The original L-system paper.', 'A procedural vegetation tool for games and film. It adds artist editing on top of rule-based generation.'],
    params: {
      preset: { label: 'Plant rule', group: 'L-system', options: { c: 'ABOP 1.24c: bush F→FF-[-F+F+F]+[+F-F-F]' } },
      iters: 'Passes (0 = preset default)',
      stochastic: { label: 'Stochastic rules', help: 'Picks one of several rules at random for each symbol.' },
      jitter: 'Angle jitter (±°)',
      angleOfs: 'Angle offset (°)',
      count: { label: 'Plants', group: 'Scene' },
      wind: 'Wind',
      grow: 'Growth animation',
      regen: { label: 'Regenerate', buttonLabel: 'Regenerate (new seed)' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    let regen = 0, key = '', plants = [], genMs = 0, growT = 0, segTotal = 0;

    function expand(pr, iters, rng, stochastic) {
      let s = pr.axiom;
      for (let i = 0; i < iters; i++) {
        let out = '';
        for (let k = 0; k < s.length; k++) {
          const c = s[k], r = pr.rules[c];
          out += r ? (stochastic && r.length > 1 ? r[Math.floor(rng.next() * r.length)] : r[0]) : c;
          if (out.length > MAX_LEN) break;
        }
        s = out;
        if (s.length > MAX_LEN) break;
      }
      return s;
    }
    // 거북이 해석: 세그먼트 [x1,y1,x2,y2,depth] (y는 위쪽이 −)
    function turtle(str, angle, jitters, sway) {
      const segs = [];
      let x = 0, y = 0, a = -Math.PI / 2, depth = 0, ji = 0;
      const stack = [];
      const rad = (angle * Math.PI) / 180;
      for (let k = 0; k < str.length; k++) {
        const c = str[k];
        if (c === 'F') {
          const aa = a + sway * depth;
          const nx = x + Math.cos(aa), ny = y + Math.sin(aa);
          segs.push(x, y, nx, ny, depth);
          x = nx; y = ny;
        } else if (c === '+' || c === '-') {
          const j = jitters[ji++ % jitters.length];
          a += (c === '+' ? 1 : -1) * rad + j;
        } else if (c === '[') { stack.push(x, y, a, depth); depth++; }
        else if (c === ']') { depth = stack.pop(); a = stack.pop(); y = stack.pop(); x = stack.pop(); }
      }
      return new Float32Array(segs);
    }

    function generate() {
      const t0 = ctx.now();
      const pr = PRESETS[P.preset] || PRESETS.d;
      const iters = P.iters > 0 ? P.iters : pr.n;
      plants = [];
      segTotal = 0;
      for (let i = 0; i < P.count; i++) {
        // 결정론적이면 모든 개체가 같은 rng 상태 → 완전히 같은 식물
        const rng = U.rng(ctx.seed * 811 + regen * 4421 + (P.stochastic || P.jitter > 0 ? i * 97 : 0) + 7);
        const str = expand(pr, iters, rng, P.stochastic);
        const jit = new Float32Array(512);
        for (let k = 0; k < jit.length; k++) jit[k] = ((rng.next() * 2 - 1) * P.jitter * Math.PI) / 180;
        const segs = turtle(str, pr.angle + P.angleOfs, jit, 0);
        let minX = 0, maxX = 0, minY = 0;
        for (let k = 0; k < segs.length; k += 5) { minX = Math.min(minX, segs[k + 2]); maxX = Math.max(maxX, segs[k + 2]); minY = Math.min(minY, segs[k + 3]); }
        plants.push({ str, jit, segs, minX, maxX, minY, angle: pr.angle + P.angleOfs });
        segTotal += segs.length / 5;
      }
      genMs = ctx.now() - t0;
      growT = P.grow ? 0 : 1;
    }

    return {
      update(dt) { if (growT < 1) growT = Math.min(1, growT + dt / 3); },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const k = [P.preset, P.iters, P.stochastic, P.jitter, P.angleOfs, P.count, regen].join('|');
        if (k !== key) { generate(); key = k; }
        const ground = H - 24;
        D.rect(g, 0, ground, W, H - ground, '#2a2418');
        const slot = W / P.count;
        // 공통 스케일: 가장 큰 개체가 칸 너비와 높이에 맞도록
        let maxH = 1, maxW = 1;
        for (const p of plants) { maxH = Math.max(maxH, -p.minY); maxW = Math.max(maxW, p.maxX - p.minX); }
        const sc = Math.min((ground - 30) / maxH, (slot * 0.95) / maxW);
        const col = ctx.side === 'a' ? C.a : C.b;
        const t = growT < 1 ? U.ease.outCubic(growT) : 1;
        plants.forEach((p, i) => {
          const segs = P.wind ? turtle(p.str, p.angle, p.jit, Math.sin(ctx.time * 1.7 + i * 0.9) * 0.025) : p.segs;
          const cx = slot * (i + 0.5) - ((p.minX + p.maxX) / 2) * sc;
          const n = Math.floor((segs.length / 5) * t);
          // 깊이별 경로로 묶어 그리기 (깊을수록 가늘고 녹색)
          const maxD = 9;
          for (let d = 0; d <= maxD; d++) {
            g.beginPath();
            let any = false;
            for (let s = 0; s < n; s++) {
              const o = s * 5, sd = Math.min(maxD, segs[o + 4]);
              if (sd !== d) continue;
              g.moveTo(cx + segs[o] * sc, ground + segs[o + 1] * sc);
              g.lineTo(cx + segs[o + 2] * sc, ground + segs[o + 3] * sc);
              any = true;
            }
            if (!any) continue;
            const f = d / maxD;
            g.strokeStyle = U.rgb(110 - 60 * f, 80 + 100 * f, 50 + 20 * f);
            g.lineWidth = Math.max(0.6, 3.2 - d * 0.45);
            g.stroke();
          }
        });
        D.text(g, P.stochastic || P.jitter > 0 ? GTL.L('개체마다 다른 시드', 'A different seed for each plant') : GTL.L('모든 개체가 같은 규칙, 같은 결과', 'Same rule and same result for every plant'), 8, 8, { color: col });
        const avgLen = plants.reduce((a, p) => a + p.str.length, 0) / Math.max(1, plants.length);
        ctx.stat(GTL.L('문자열 길이 (평균)', 'String length (mean)'), Math.round(avgLen).toLocaleString());
        ctx.stat(GTL.L('선분 수 (전체)', 'Line segments (total)'), segTotal.toLocaleString());
        ctx.stat(GTL.L('생성 시간', 'Build time'), genMs.toFixed(1) + ' ms');
        if (avgLen >= MAX_LEN) ctx.stat(GTL.L('경고', 'Warning'), GTL.L(`길이 상한 ${MAX_LEN} 도달로 잘림. 반복 횟수를 줄이면 해결됨.`, `Cut off at the length limit of ${MAX_LEN}. Use fewer passes to fix this.`));
      },
      onAction(key) { if (key === 'regen') regen++; },
    };
  },
});
