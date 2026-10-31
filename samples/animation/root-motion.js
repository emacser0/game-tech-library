// 루트 모션 vs 인플레이스 + 코드 이동. 클립의 이동 속도가 일정하지 않으면 코드 이동은 발이 미끄러짐.
GTL.register({
  id: 'root-motion',
  title: '루트 모션 vs 인플레이스 + 코드 이동',
  summary: '제자리(in-place) 클립을 코드가 일정 속도로 옮기면 클립의 걸음 속도와 어긋나 발이 미끄러짐. 루트 모션은 클립에 기록된 이동량을 그대로 써서 디딘 발이 땅에 고정됨.',
  views: { a: '인플레이스 + 코드 이동', b: '루트 모션' },
  controls: '조작 없음. 캐릭터가 오른쪽으로 계속 걷고, 카메라가 따라감.',
  info: `
    <p><b>루트 모션(Root Motion)</b>은 애니메이션 클립의 루트 본 이동량을 캐릭터 이동에 쓰는 방식. 매 프레임 이번 프레임의 루트 변화량(delta)을 꺼내 캐릭터에 더함.</p>
    <p><b>인플레이스(in-place)</b> 클립은 제자리에서 걷고, 이동은 코드가 <code>x += speed * dt</code>로 처리함.
    실제 걸음은 속도가 일정하지 않음. 발을 디딜 때 느려지고 밀어낼 때 빨라짐. 그래서 일정한 코드 속도와 어긋나 발이 미끄러짐(foot sliding).</p>
    <p>"재생 속도 맞춤"은 클립 평균 속도에 맞춰 재생 속도를 바꾸는 흔한 보정. 평균은 맞지만 한 걸음 안의 속도 변화는 남음.</p>
    <p>루트 모션의 단점: 이동이 클립에 묶여 입력 반응이 둔해짐. 물리, 네트워크 예측과 맞추기도 어려움. 그래서 이동은 코드로 하고 발은 IK로 보정하는 게임도 많음.</p>`,
  // 도식: 한 주기 동안 클립 루트 속도(걸음마다 출렁임) vs 코드의 일정 속도. 두 속도의 차이만큼 디딘 발이 미끄러짐
  diagram: (L) => {
    const x0 = 40, w = 400, base = 125, s = 50, vary = 0.55, mul = 1.15;
    const N = 80, clip = Array.from({ length: N + 1 }, (_, i) => [x0 + (i / N) * w, base - s * (1 + vary * Math.cos(4 * Math.PI * i / N))]);
    const line = clip.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const yc = base - s * mul;
    const gap = `${x0},${yc} ${line} ${x0 + w},${yc}`;
    return `<svg viewBox="0 0 540 206" xmlns="http://www.w3.org/2000/svg">
    <line x1="${x0}" y1="16" x2="${x0}" y2="${base}" class="d-dim"/><line x1="${x0}" y1="${base}" x2="${x0 + w}" y2="${base}" class="d-dim"/>
    <text x="${x0 + 4}" y="16" class="t-small t-dim">${L('이동 속도', 'move speed')}</text>
    <text x="${x0 + w}" y="${base + 13}" text-anchor="end" class="t-small t-dim">${L('한 주기 (두 걸음)', 'one cycle (two steps)')}</text>
    <polygon points="${gap}" class="f-a" opacity="0.2"/>
    <line x1="${x0}" y1="${base - s}" x2="${x0 + w}" y2="${base - s}" class="d-dim" stroke-dasharray="4 3"/>
    <polyline points="${line}" class="d-b"/>
    <line x1="${x0}" y1="${yc}" x2="${x0 + w}" y2="${yc}" class="d-a"/>
    <text x="${x0 + w + 6}" y="${yc - 2}" class="t-small t-a">${L('코드 속도', 'code speed')}</text>
    <text x="${x0 + w + 6}" y="${base - s + 10}" class="t-small t-dim">${L('클립 평균', 'clip average')}</text>
    <text x="${x0 + w + 6}" y="${base - s * (1 + vary) - 2}" class="t-small t-b">${L('클립 루트 속도', 'clip root speed')}</text>
    <text x="${x0 + w * 0.25}" y="${base - s * (1 - vary) + 14}" text-anchor="middle" class="t-small t-dim">${L('디딤 순간 느려짐', 'slower as the foot lands')}</text>
    <line x1="20" y1="152" x2="40" y2="152" class="d-a"/>
    <text x="48" y="156" class="t-mono t-a">${L('A: x += speed * dt (일정)', 'A: x += speed * dt (constant)')}</text>
    <line x1="20" y1="170" x2="40" y2="170" class="d-b"/>
    <text x="48" y="174" class="t-mono t-b">${L('B: x += R(p1) − R(p0) (클립 기록)', 'B: x += R(p1) − R(p0) (from the clip)')}</text>
    <text x="20" y="196" class="t-small t-dim">${L('색칠한 차이만큼 디딘 발이 미끄러짐. 재생 속도 맞춤은 평균만 맞춤', 'The shaded gap is how far the planted foot slides. Rate matching fixes only the average')}</text>
  </svg>`;
  },
  look: [
    'A의 노란 디딤 발 표시를 보면 땅 위에서 앞뒤로 미끄러짐. B는 디딘 자리에 멈춰 있음.',
    'A를 "재생 속도 맞춤"으로 바꿔도 미끄러짐이 거의 그대로임. 평균 속도만 맞고 한 걸음 안의 출렁임은 남기 때문. "속도 변화 폭"을 0으로 낮추면 그때 0이 됨.',
    'A의 "목표 이동 속도"를 1.0배에서 멀리 옮기면 미끄러짐이 커짐. 0.7배 아래에서는 발이 앞으로 밀려 문워크처럼 보임.',
    '아래 그래프를 보면 B의 이동 속도는 걸음마다 출렁이고 A는 평평함. 발 밀림 그래프는 반대로 A만 출렁임.',
  ],
  refs: [
    { type: 'engine', title: 'Unity Manual - Root Motion: how it works', url: 'https://docs.unity3d.com/Manual/RootMotion.html', note: 'Body Transform, Root Transform, Apply Root Motion.' },
    { type: 'engine', title: 'Unreal Engine - Root Motion', note: 'Root Motion Mode, Root Motion from Montages Only.' },
    { type: 'article', title: 'Code vs Data Driven Displacement (Daniel Holden)', year: 2021, note: '코드 이동과 데이터(루트 모션) 이동의 장단점 비교.' },
  ],
  params: [
    { key: 'mode', label: '이동 방식', type: 'select', group: '이동', options: [
      { value: 'code', label: '인플레이스 + 코드 이동' },
      { value: 'match', label: '인플레이스 + 재생 속도 맞춤' },
      { value: 'root', label: '루트 모션' },
    ], a: 'code', b: 'root' },
    { key: 'codeMul', label: '목표 이동 속도 (클립 평균 대비)', type: 'range', min: 0.5, max: 1.5, step: 0.01, default: 1.15, when: (p) => p.mode !== 'root', help: '코드가 캐릭터를 옮기는 속도. 재생 속도 맞춤 모드는 클립 재생 속도도 이 배율로 바꿈' },
    { key: 'vary', label: '속도 변화 폭', type: 'range', min: 0, max: 0.8, step: 0.01, default: 0.55, shared: true, group: '클립', help: '한 걸음 안에서 루트 속도가 평균 대비 얼마나 출렁이는지' },
    { key: 'stride', label: '보폭 (px)', type: 'range', min: 40, max: 110, step: 1, default: 80, shared: true },
    { key: 'period', label: '주기 (초, 두 걸음)', type: 'range', min: 0.6, max: 2, step: 0.01, default: 1.1, shared: true },
  ],
  en: {
    title: 'Root Motion vs In-Place + Code Movement',
    summary: 'If code moves an in-place clip at a constant speed, it does not match the clip\'s walking speed, so the feet slide. Root motion uses the movement recorded in the clip as is, so the planted foot stays fixed on the ground.',
    views: { a: 'In-place + code movement', b: 'Root motion' },
    controls: 'No input. The character keeps walking to the right, and the camera follows.',
    info: `
    <p><b>Root motion</b> uses the root bone movement of an animation clip to move the character. Every frame, it takes the root change (delta) for that frame and adds it to the character.</p>
    <p>An <b>in-place</b> clip walks on the spot, and code handles movement with <code>x += speed * dt</code>.
    Real steps do not have a constant speed. They slow down when the foot lands and speed up when it pushes off. So they do not match the constant code speed, and the feet slide (foot sliding).</p>
    <p>"Match playback rate" is a common fix that changes the playback rate to match the clip's average speed. The average matches, but the speed changes within one step remain.</p>
    <p>Downsides of root motion: movement is tied to the clip, so input response feels slow. It is also hard to match with physics and network prediction. That is why many games move the character in code and fix the feet with IK.</p>`,
    look: [
      'Look at A\'s yellow planted foot markers. They slide back and forth on the ground. In B, they stay where they land.',
      'Switch A to "Match playback rate". The sliding stays almost the same, because only the average speed matches and the wobble within one step remains. It reaches 0 only when you lower "Speed variation" to 0.',
      'Move A\'s "Target move speed" far from 1.0×. Sliding grows. Below 0.7×, the feet get pushed forward and it looks like a moonwalk.',
      'Look at the graphs below. B\'s move speed wobbles with each step, and A\'s is flat. The foot slide graph is the opposite: only A wobbles.',
    ],
    refs: [
      'Body Transform, Root Transform, Apply Root Motion.',
      'Root Motion Mode, Root Motion from Montages Only.',
      'Compares the pros and cons of code-driven movement and data-driven (root motion) movement.',
    ],
    params: {
      mode: { label: 'Movement method', group: 'Movement', options: { code: 'In-place + code movement', match: 'In-place + match playback rate', root: 'Root motion' } },
      codeMul: { label: 'Target move speed (vs clip average)', help: 'The speed at which code moves the character. In match playback rate mode, the clip playback rate also changes by this factor' },
      vary: { label: 'Speed variation', group: 'Clip', help: 'How much the root speed wobbles around its average within one step' },
      stride: 'Stride (px)',
      period: 'Period (s, two steps)',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const TAU = U.TAU, UL = 48, LL = 48, HIP = 90;
    let animT = 0, worldX = 0, prev = null, slideHist = [], speedHist = [], slideSum = 0, slideTime = 0, plants = [];

    // 클립의 루트 곡선 R(p), p는 0~1. 한 걸음(반 주기)마다 속도가 출렁임. 평균 이동 = 2 * stride / 주기
    const R = (p) => 2 * P.stride * (p + (P.vary * Math.sin(2 * TAU * p)) / (2 * TAU));
    // 발 위치(루트 기준). 디딤 구간에서는 월드 고정이 되도록 루트 이동만큼 정확히 뒤로 감.
    function foot(p, off) {
      const q = (p + off) % 1, S = P.stride;
      if (q < 0.5) {
        const p0 = (1 + p - q) % 1; // 이 디딤 시작 시점의 p
        let dr = R(p0 + q) - R(p0);
        return { x: S / 2 - dr, y: 0, stance: true };
      }
      const s = U.smoothstep(0.5, 1, q);
      return { x: U.lerp(-S / 2, S / 2, s), y: -Math.sin((q - 0.5) * 2 * Math.PI) * 20, stance: false };
    }
    function ik(h, f) {
      const dx = f.x - h.x, dy = f.y - h.y, d = Math.min(Math.hypot(dx, dy), UL + LL - 0.01);
      const a = Math.atan2(dy, dx), c = Math.acos(U.clamp((UL * UL + d * d - LL * LL) / (2 * UL * d), -1, 1));
      return { x: h.x + Math.cos(a - c) * UL, y: h.y + Math.sin(a - c) * UL };
    }
    const avgSpeed = () => (2 * P.stride) / P.period;

    return {
      update(dt) {
        const p0 = (animT / P.period) % 1;
        // 재생 속도 맞춤: 클립 평균 속도가 목표 이동 속도와 같아지도록 재생 속도를 바꿈
        const rate = P.mode === 'match' ? P.codeMul : 1;
        animT += dt * rate;
        const p1 = (animT / P.period) % 1;
        let move;
        if (P.mode === 'root') {
          let d = R(p1) - R(p0);
          if (p1 < p0) d += R(1) - R(0);
          move = d;
        } else move = avgSpeed() * P.codeMul * dt;
        worldX += move;
        speedHist.push(move / dt); if (speedHist.length > 200) speedHist.shift();
        // 디딘 발 월드 위치
        const fl = foot(p1, 0), fr = foot(p1, 0.5);
        const st = fl.stance ? 'l' : 'r', fx = worldX + (st === 'l' ? fl.x : fr.x);
        let s = 0;
        if (prev && prev.st === st) s = fx - prev.x;
        else plants.push(fx);
        if (plants.length > 12) plants.shift();
        prev = { st, x: fx };
        slideHist.push(s / dt); if (slideHist.length > 200) slideHist.shift();
        slideSum += Math.abs(s); slideTime += dt;
        if (slideTime > 3) { slideSum *= 0.5; slideTime *= 0.5; }
        this.p = p1;
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height, col = ctx.side === 'a' ? C.a : C.b;
        const gy = H * 0.6, cam = worldX - W * 0.4, p = this.p || 0;
        D.line(g, 0, gy, W, gy, C.dim, 2);
        for (let x = -(((cam % 40) + 40) % 40); x < W; x += 40) D.line(g, x, gy + 2, x - 10, gy + 12, 'rgba(255,255,255,0.15)', 1);
        // 디딤 시작 자리 표시
        for (const px of plants) D.line(g, px - cam, gy - 3, px - cam, gy + 6, 'rgba(255,203,107,0.4)', 2);
        const ox = worldX - cam, bob = Math.abs(Math.cos(p * 2 * TAU)) * 4;
        const hip = { x: ox, y: gy - HIP + bob };
        for (const [f, c] of [[foot(p, 0.5), 'rgba(255,255,255,0.35)'], [foot(p, 0), col]]) {
          const ft = { x: ox + f.x, y: gy + f.y }, k = ik(hip, ft);
          D.line(g, hip.x, hip.y, k.x, k.y, c, 5); D.line(g, k.x, k.y, ft.x, ft.y, c, 5);
          if (f.stance) D.circle(g, ft.x, ft.y, 5, C.warn);
        }
        const neck = { x: hip.x + 8, y: hip.y - 64 };
        D.line(g, hip.x, hip.y, neck.x, neck.y, col, 6);
        const arm = Math.sin(p * TAU) * 0.5;
        D.line(g, neck.x, neck.y + 4, neck.x + Math.sin(arm) * 34, neck.y + 4 + Math.cos(arm) * 34, col, 5);
        D.circle(g, neck.x + 3, neck.y - 16, 13, '#20242c', col, 3);
        const avg = avgSpeed();
        D.plot(g, speedHist, 12, H - 150, W - 24, 60, { min: 0, max: avg * 2, color: col, label: GTL.L('캐릭터 이동 속도 (px/s)', 'Character move speed (px/s)') });
        D.plot(g, slideHist, 12, H - 80, W - 24, 60, { min: -avg, max: avg, color: C.warn, label: GTL.L('디딘 발 월드 속도 (px/s, 0이면 고정)', 'Planted foot world speed (px/s, 0 means fixed)') });
        ctx.stat(GTL.L('평균 발 미끄러짐', 'Average foot slide'), (slideSum / Math.max(1e-6, slideTime)).toFixed(1) + ' px/s');
        ctx.stat(GTL.L('클립 평균 속도', 'Clip average speed'), avg.toFixed(0) + ' px/s');
        ctx.stat(GTL.L('이동 속도 범위', 'Move speed range'), Math.min(...speedHist).toFixed(0) + ' ~ ' + Math.max(...speedHist).toFixed(0) + ' px/s');
      },
    };
  },
});
