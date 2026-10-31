// 이징 함수 비교: 시간과 거리가 같아도 진행 곡선에 따라 움직임의 "느낌"이 달라짐.
GTL.register({
  id: 'easing-functions',
  title: '이징 함수 (Easing Functions)',
  summary: '시작 값, 끝 값, 시간이 같아도 진행률 곡선 f(t)에 따라 속도감과 무게감이 달라짐. 선형 보간과 이징 곡선을 위치, 크기, 투명도, 회전에 함께 적용해 비교.',
  views: { a: 'Linear', b: 'Out Cubic' },
  controls: '조작 없음. 자동으로 왕복함. "다시 재생"을 누르면 처음부터 재생.',
  info: `
    <p><b>이징 함수</b>는 시간 진행률을 값 진행률로 바꾸는 곡선 <code>f</code>.
    트윈(tween, 두 값 사이를 시간에 따라 채우는 애니메이션)은 <code>value = lerp(from, to, f(t))</code>로 계산함.
    <code>t</code>는 경과 시간 / 지속 시간(0→1).</p>
    <p>필요한 이유: <code>f(t) = t</code>(Linear)는 시작과 끝에서 속도가 갑자기 바뀜. 그래서 기계적으로 보임.</p>
    <ul>
      <li><b>Out</b>: 빠르게 출발해 감속하며 도착. UI 등장처럼 빠른 반응이 필요할 때 씀.</li>
      <li><b>In</b>: 천천히 출발해 가속. 퇴장에 씀.</li>
      <li><b>InOut</b>: 시작과 끝을 모두 부드럽게 함.</li>
      <li><b>Back</b>: 목표를 살짝 넘었다가 돌아옴(overshoot).</li>
      <li><b>Elastic</b>, <b>Bounce</b>: 스프링과 튕김을 흉내 냄.</li>
    </ul>
    <p>왼쪽 그래프의 기울기가 속도. 아래 점열은 같은 시간 간격으로 찍은 위치. <b>점 간격이 넓을수록 빠른 구간</b>.</p>`,
  diagram: (L) => {
    const xs = (f) => [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => 130 + 380 * f(i / 8));
    const tx = xs((t) => t), ax = xs((t) => t), bx = xs((t) => 1 - (1 - t) ** 3);
    return `<svg viewBox="0 0 540 170" xmlns="http://www.w3.org/2000/svg">
    <text x="4" y="30">${L('시간 t', 'Time t')}</text>
    <text x="4" y="44" class="t-dim t-small">${L('같은 간격', 'equal steps')}</text>
    <line x1="130" y1="32" x2="510" y2="32" class="d-dim"/>
    ${tx.map((x) => `<line x1="${x}" y1="26" x2="${x}" y2="38" class="d-line"/>`).join('')}
    ${tx.map((x, i) => `<line x1="${x}" y1="40" x2="${ax[i]}" y2="74" class="d-dim"/><line x1="${x}" y1="40" x2="${bx[i]}" y2="122" class="d-dim" stroke-dasharray="2 3"/>`).join('')}
    <text x="4" y="84" class="t-a">${L('A: Linear', 'A: Linear')}</text>
    <text x="4" y="98" class="t-dim t-small">f(t) = t</text>
    <line x1="130" y1="80" x2="510" y2="80" class="d-dim"/>
    ${ax.map((x) => `<circle cx="${x}" cy="80" r="4" class="f-a"/>`).join('')}
    <text x="4" y="132" class="t-b">${L('B: Out Cubic', 'B: Out Cubic')}</text>
    <text x="4" y="146" class="t-dim t-small">1 - (1 - t)³</text>
    <line x1="130" y1="128" x2="510" y2="128" class="d-dim"/>
    ${bx.map((x) => `<circle cx="${x}" cy="128" r="4" class="f-b"/>`).join('')}
    <text x="190" y="146" text-anchor="middle" class="t-small t-b">${L('넓은 간격: 빠른 출발', 'wide gaps: fast start')}</text>
    <text x="508" y="146" text-anchor="end" class="t-small t-b">${L('촘촘함: 감속 도착', 'dense: slow arrival')}</text>
    <text x="4" y="166" class="t-small t-dim">${L('같은 시간 간격을 f(t)로 휘어 위치로 바꿈. 점 간격이 곧 속도', 'f(t) bends equal time steps into positions. The dot gap is the speed')}</text>
  </svg>`;
  },
  look: [
    '아래 점열을 A와 B에서 비교하면 Linear는 간격이 균일하고 Out Cubic은 앞쪽이 넓고 끝이 촘촘함.',
    'B를 outBack이나 outElastic으로 바꾸면 곡선이 1을 넘음. 크기(scale)가 목표보다 커졌다가 돌아옴.',
    '등장에 Out 계열을 쓰면 처음부터 빠르게 움직여 체감 지연이 줄어듦. 그래서 In 계열은 퇴장에 씀.',
    '속도 그래프(점선)를 보면 Linear는 시작과 끝에서 값이 수직으로 끊김. InOut 계열은 0에서 시작해 0으로 끝남.',
  ],
  refs: [
    { type: 'book', title: "Robert Penner's Easing Functions", url: 'http://robertpenner.com/easing/', year: 2001, note: '"Programming Macromedia Flash MX" 7장. 게임과 웹에서 쓰는 이징 함수 이름의 원조.' },
    { type: 'article', title: 'Easing Functions Cheat Sheet (easings.net)', url: 'https://easings.net/', note: '각 함수의 그래프와 수식.' },
    { type: 'engine', title: 'Unity - AnimationCurve', url: 'https://docs.unity3d.com/ScriptReference/AnimationCurve.html', note: '엔진에서는 곡선 에셋으로 이징을 직접 편집하기도 함.' },
    { type: 'engine', title: 'Godot - Tween (TransitionType / EaseType)', url: 'https://docs.godotengine.org/en/stable/classes/class_tween.html' },
  ],
  params: [
    { key: 'ease', label: '이징 함수', type: 'select', group: '이징', options: [
      'linear', 'inQuad', 'outQuad', 'inOutQuad', 'inCubic', 'outCubic', 'inOutCubic', 'inQuart', 'outQuart', 'inOutQuart',
      'inSine', 'outSine', 'inOutSine', 'inExpo', 'outExpo', 'inOutExpo', 'inBack', 'outBack', 'inOutBack',
      'inElastic', 'outElastic', 'inBounce', 'outBounce', 'smoothstep', 'smootherstep',
    ].map((v) => ({ value: v, label: v })), a: 'linear', b: 'outCubic' },
    { key: 'duration', label: '지속 시간 (초)', type: 'range', min: 0.2, max: 3, step: 0.05, default: 1.2, shared: true, group: '재생' },
    { key: 'hold', label: '끝 대기 (초)', type: 'range', min: 0, max: 2, step: 0.05, default: 0.5, shared: true },
    { key: 'pingpong', label: '왕복 (돌아올 때 같은 곡선)', type: 'bool', default: true, shared: true, help: '끄면 매번 처음부터 다시 재생' },
    { key: 'ticks', label: '시간 간격 점 개수', type: 'int', min: 4, max: 40, default: 16, shared: true },
    { key: 'replay', label: '다시 재생', type: 'button' },
  ],
  en: {
    title: 'Easing Functions',
    summary: 'With the same start value, end value, and duration, the progress curve f(t) changes how fast and how heavy a motion feels. Compare linear interpolation and easing curves on position, size, opacity, and rotation.',
    controls: 'No input. The motion plays back and forth on its own. Press "Replay" to start from the beginning.',
    info: `
    <p>An <b>easing function</b> is a curve <code>f</code> that turns time progress into value progress.
    A tween (an animation that fills in between two values over time) computes <code>value = lerp(from, to, f(t))</code>.
    <code>t</code> is elapsed time / duration (0 to 1).</p>
    <p>Why you need it: with <code>f(t) = t</code> (Linear), speed changes suddenly at the start and the end. So it looks mechanical.</p>
    <ul>
      <li><b>Out</b>: starts fast and slows down to arrive. Use it when you need a quick response, such as UI appearing.</li>
      <li><b>In</b>: starts slow and speeds up. Use it for exits.</li>
      <li><b>InOut</b>: smooths both the start and the end.</li>
      <li><b>Back</b>: goes slightly past the target and comes back (overshoot).</li>
      <li><b>Elastic</b>, <b>Bounce</b>: imitate springs and bounces.</li>
    </ul>
    <p>The slope of the graph on the left is the speed. The dots below are positions taken at equal time steps. <b>Wider gaps mean faster parts</b>.</p>`,
    look: [
      'Compare the dots below in A and B. Linear has even gaps. Out Cubic has wide gaps at the front and dense dots at the end.',
      'Change B to outBack or outElastic. The curve goes above 1. The size (scale) grows past the target and comes back.',
      'Out curves on entrances move fast from the start, so the motion feels less delayed. That is why In curves are used for exits.',
      'Look at the speed graph (dashed line). For Linear, the value jumps straight up and down at the start and the end. InOut curves start at 0 and end at 0.',
    ],
    refs: [
      '"Programming Macromedia Flash MX", chapter 7. The origin of the easing function names used in games and on the web.',
      'Graphs and formulas for each function.',
      'Engines also let you edit easing directly as a curve asset.',
      null,
    ],
    params: {
      ease: { label: 'Easing function', group: 'Easing' },
      duration: { label: 'Duration (s)', group: 'Playback' },
      hold: 'Hold at end (s)',
      pingpong: { label: 'Ping-pong (same curve on the way back)', help: 'When off, it replays from the start every time' },
      ticks: 'Time step dot count',
      replay: 'Replay',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const extra = {
      smoothstep: (t) => t * t * (3 - 2 * t),
      smootherstep: (t) => t * t * t * (t * (t * 6 - 15) + 10),
    };
    const fn = () => U.ease[P.ease] || extra[P.ease] || U.ease.linear;
    let clock = 0;

    // 현재 재생 상태 → { t: 0..1 진행률, dir: +1/-1 }
    function phase() {
      const d = P.duration, h = P.hold, cycle = d + h;
      if (P.pingpong) {
        const c2 = clock % (cycle * 2);
        if (c2 < cycle) return { t: Math.min(1, c2 / d), dir: 1 };
        return { t: Math.min(1, (c2 - cycle) / d), dir: -1 };
      }
      return { t: Math.min(1, (clock % cycle) / d), dir: 1 };
    }

    return {
      update(dt) { clock += dt; },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height, f = fn();
        const col = ctx.side === 'a' ? C.a : C.b;
        const { t, dir } = phase();
        const v = dir > 0 ? f(t) : 1 - f(t);  // 역재생: 같은 곡선으로 1→0

        // ── 곡선 그래프 ──
        const gs = Math.min(W * 0.42, H * 0.55);
        const gx = 30, gy = 30, gw = gs, gh = gs * 0.8;
        const lo = -0.35, hi = 1.35; // overshoot 표시 여유
        const py = (val) => gy + gh - ((val - lo) / (hi - lo)) * gh;
        D.rect(g, gx, gy, gw, gh, 'rgba(0,0,0,0.3)', C.grid);
        D.line(g, gx, py(0), gx + gw, py(0), C.dim, 1);
        D.line(g, gx, py(1), gx + gw, py(1), C.dim, 1);
        D.text(g, '0', gx - 12, py(0) - 6, { size: 10, color: C.dim });
        D.text(g, '1', gx - 12, py(1) - 6, { size: 10, color: C.dim });
        // 속도(미분): 점선, 정규화
        const N = 120, vals = [], vel = [];
        for (let i = 0; i <= N; i++) vals.push(f(i / N));
        for (let i = 0; i <= N; i++) {
          const a = vals[Math.max(0, i - 1)], b = vals[Math.min(N, i + 1)];
          vel.push((b - a) / ((Math.min(N, i + 1) - Math.max(0, i - 1)) / N));
        }
        const vmax = Math.max(1e-6, ...vel.map(Math.abs));
        g.setLineDash([3, 4]);
        g.beginPath();
        vel.forEach((s, i) => {
          const x = gx + (i / N) * gw, y = gy + gh - (0.5 + 0.5 * (s / vmax)) * gh * 0.9 - gh * 0.05;
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        });
        g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1; g.stroke();
        g.setLineDash([]);
        g.beginPath();
        vals.forEach((val, i) => { const x = gx + (i / N) * gw; i ? g.lineTo(x, py(val)) : g.moveTo(x, py(val)); });
        g.strokeStyle = col; g.lineWidth = 2.5; g.stroke();
        const tx = gx + t * gw;
        D.line(g, tx, gy, tx, gy + gh, 'rgba(255,255,255,0.25)', 1);
        D.circle(g, tx, py(f(t)), 5, '#fff');
        D.text(g, `${P.ease}   t=${t.toFixed(2)}  f(t)=${f(t).toFixed(3)}`, gx, gy - 18, { size: 11, color: col });
        D.text(g, GTL.L('실선: 값   점선: 속도(정규화)', 'Solid: value   Dashed: speed (normalized)'), gx, gy + gh + 4, { size: 10, color: C.dim });

        // ── 오브젝트 데모 (오른쪽) ──
        const rx = gx + gw + 40, rw = W - rx - 30;
        if (rw > 60) {
          const cy1 = gy + gh * 0.2, cy2 = gy + gh * 0.55, cy3 = gy + gh * 0.88;
          // 크기
          const s = U.lerp(0.25, 1, v);
          D.rect(g, rx + rw * 0.2 - 28 * s, cy1 - 28 * s, 56 * s, 56 * s, col);
          D.rect(g, rx + rw * 0.2 - 28, cy1 - 28, 56, 56, null, C.dim);
          D.text(g, GTL.L('크기', 'Size'), rx + rw * 0.2, cy1 + 34, { size: 10, color: C.dim, align: 'center' });
          // 투명도
          D.circle(g, rx + rw * 0.6, cy1, 28, `rgba(255,255,255,${U.clamp(v, 0, 1)})`, C.dim);
          D.text(g, GTL.L('투명도', 'Opacity'), rx + rw * 0.6, cy1 + 34, { size: 10, color: C.dim, align: 'center' });
          // 회전
          const ang = v * Math.PI;
          g.save(); g.translate(rx + rw * 0.4, cy2); g.rotate(ang);
          D.rect(g, -30, -6, 60, 12, col); D.circle(g, 30, 0, 5, '#fff');
          g.restore();
          D.text(g, GTL.L('회전 0→180°', 'Rotation 0→180°'), rx + rw * 0.4, cy2 + 34, { size: 10, color: C.dim, align: 'center' });
          // 세로 위치 (낙하)
          const by = U.lerp(cy3 + 10, cy2 - 30, v);
          D.circle(g, rx + rw * 0.85, by, 10, col);
          D.line(g, rx + rw * 0.85 - 15, cy3 + 22, rx + rw * 0.85 + 15, cy3 + 22, C.dim, 1);
        }

        // ── 수평 이동 + 같은 시간 간격 점열 ──
        const lx0 = 40, lx1 = W - 40, ly = H - 70;
        D.line(g, lx0, ly, lx1, ly, C.grid, 2);
        D.line(g, lx0, ly - 14, lx0, ly + 14, C.dim, 1);
        D.line(g, lx1, ly - 14, lx1, ly + 14, C.dim, 1);
        for (let i = 0; i <= P.ticks; i++) {
          const x = U.lerp(lx0, lx1, f(i / P.ticks));
          D.circle(g, x, ly + 26, 3, 'rgba(255,255,255,0.55)');
        }
        D.text(g, GTL.L('같은 시간 간격으로 찍은 위치 (간격 = 속도)', 'Positions at equal time steps (gap = speed)'), lx0, ly + 36, { size: 10, color: C.dim });
        D.circle(g, U.lerp(lx0, lx1, v), ly, 13, col, '#fff', 1.5);

        // 측정값: 최대 overshoot, 최대 속도 (선형 대비)
        const peak = Math.max(...vals), trough = Math.min(...vals);
        ctx.stat(GTL.L('최대 속도 (Linear=1)', 'Max speed (Linear=1)'), (vmax).toFixed(2) + '×');
        ctx.stat(GTL.L('목표 초과 (overshoot)', 'Overshoot'), peak > 1.0001 || trough < -0.0001 ? `${((Math.max(peak - 1, -trough)) * 100).toFixed(1)} %` : GTL.L('없음', 'None'));
        ctx.stat(GTL.L('시작 속도 / 끝 속도', 'Start speed / end speed'), vel[0].toFixed(2) + ' / ' + vel[N].toFixed(2));
      },
      onAction(key) { if (key === 'replay') clock = 0; },
    };
  },
});
