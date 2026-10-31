// 감쇠 스프링 / 임계 감쇠(SmoothDamp) vs 나이브 lerp 추적
GTL.register({
  id: 'spring-damper',
  title: '감쇠 스프링 & 임계 감쇠 (SmoothDamp)',
  summary: 'x = lerp(x, target, k)는 목표가 바뀌는 순간 속도가 끊기며 튐. 감쇠 스프링은 속도를 상태로 가져 가속도가 유한함. 감쇠비 ζ=1(임계 감쇠)이면 오버슈트 없이 가장 빨리 수렴함.',
  views: { a: '프레임 lerp', b: '임계 감쇠 스프링' },
  controls: '추적 대상을 "마우스"로 고르면 마우스를 따라감.',
  info: `
    <p><b>감쇠 스프링</b>은 카메라, UI, 조준점이 목표를 부드럽게 따라가게 하는 방법. 속도를 상태로 가지고 스프링 힘으로 움직임.</p>
    <p>흔히 쓰는 <code>x += (target - x)*k</code>는 <b>위치만 상태로 가진 1차 필터</b>. 두 가지 문제가 있음.</p>
    <ul>
      <li>목표가 순간 이동하면 그 프레임에 속도가 0에서 <code>k*거리/dt</code>로 바로 뜀. 카메라가 "툭" 끊기는 느낌(가속도 스파이크).</li>
      <li>끝에서 지수적으로 느려져 멈추기까지 오래 걸림.</li>
    </ul>
    <p>감쇠 스프링 <code>a = ω²(target - x) - 2ζω*v</code>는 위치와 속도가 모두 연속임. 감쇠비 <code>ζ</code>에 따라 움직임이 달라짐.</p>
    <ul>
      <li>ζ &lt; 1: 목표를 지나쳤다가 출렁임(오버슈트).</li>
      <li>ζ &gt; 1: 굼뜸.</li>
      <li><b>ζ = 1 (임계 감쇠)</b>: 오버슈트 없이 가장 빨리 수렴.</li>
    </ul>
    <p>이 샘플은 언제나 안정한 <b>암시적 Euler</b>(implicit Euler)로 적분함. Unity의 <code>Mathf.SmoothDamp</code>는 Game Programming Gems 4의 임계 감쇠 스프링 근사(지수 함수의 다항 근사)를 씀.</p>
    <p>단점: lerp보다 파라미터(진동수, 감쇠비)가 하나 더 많고, 속도 상태를 따로 저장해야 함.</p>`,
  // 도식: 목표가 0에서 1로 순간 이동했을 때의 응답. lerp는 첫 프레임에 속도가 튐. 임계 감쇠 스프링은 속도 0에서 출발
  diagram: (L) => {
    const X = (t) => (50 + t * 280).toFixed(1), Y = (v) => (150 - v * 100).toFixed(1);
    const path = (fn) => { let d = ''; for (let i = 0; i <= 80; i++) { const t = i / 80; d += (i ? ' L' : 'M') + X(t) + ',' + Y(fn(t)); } return d; };
    const w = 2 * Math.PI * 1.5, z = 0.3, wd = w * Math.sqrt(1 - z * z);
    const lerp = (t) => 1 - Math.pow(0.88, Math.floor(t * 60));
    const crit = (t) => 1 - (1 + w * t) * Math.exp(-w * t);
    const under = (t) => 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
    return `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
    <line x1="50" y1="150" x2="335" y2="150" class="d-dim"/><line x1="50" y1="150" x2="50" y2="10" class="d-dim"/>
    <line x1="50" y1="50" x2="335" y2="50" class="d-good" stroke-dasharray="4 3"/>
    <text x="44" y="53" text-anchor="end" class="t-small">${L('목표', 'target')}</text>
    <text x="44" y="153" text-anchor="end" class="t-small t-mono">0</text>
    <text x="330" y="166" text-anchor="end" class="t-small t-mono">1 s</text>
    <path d="${path(under)}" class="d-dim" stroke-dasharray="4 3"/>
    <path d="${path(lerp)}" class="d-a"/>
    <path d="${path(crit)}" class="d-b"/>
    <text x="360" y="30" class="t-a">${L('A: 프레임 lerp', 'A: per-frame lerp')}</text>
    <text x="360" y="44" class="t-small t-dim">${L('첫 프레임에 속도가 0에서 튐', 'speed jumps from 0 at once')}</text>
    <text x="360" y="72" class="t-b">${L('B: 임계 감쇠 (ζ = 1)', 'B: critical (ζ = 1)')}</text>
    <text x="360" y="86" class="t-small t-dim">${L('속도 0에서 부드럽게 출발', 'starts smoothly from 0 speed')}</text>
    <text x="360" y="114">${L('ζ = 0.3 (점선)', 'ζ = 0.3 (dashed)')}</text>
    <text x="360" y="128" class="t-small t-dim">${L('목표를 지나쳤다가 출렁임', 'overshoots, then wobbles')}</text>
    <text x="360" y="166" class="t-small t-mono">a = ω²(target - x) - 2ζω v</text>
    <text x="50" y="180" class="t-small t-dim">${L('목표가 0에서 1로 순간 이동한 뒤의 위치', 'Position after the target jumps from 0 to 1')}</text>
  </svg>`;
  },
  look: [
    'A와 B의 "최대 가속도"를 비교하면 A가 몇 배 큼. 점프 순간 A의 속도가 0에서 최대로 바로 뜀(아래 속도 그래프의 수직 상승). 스프링은 속도가 서서히 오름.',
    'B의 감쇠비 ζ를 0.3으로 내리면 목표를 지나쳐 출렁임(오버슈트 %). 2로 올리면 느려짐(정착 시간 증가). 1이 최적.',
    'A를 SmoothDamp로 바꾸면 B(ζ=1)와 거의 같은 곡선이 나옴. 둘 다 임계 감쇠 스프링이기 때문.',
    '추적 대상을 "원 궤도"로 바꾸면 lerp와 스프링 모두 뒤처짐(lag)이 생김. 스프링은 진동수를 높여야 따라잡음.',
  ],
  refs: [
    { type: 'engine', title: 'Unity - Mathf.SmoothDamp', url: 'https://docs.unity3d.com/ScriptReference/Mathf.SmoothDamp.html' },
    { type: 'book', title: 'Critically Damped Ease-In/Ease-Out Smoothing (Thomas Lowe)', year: 2004, note: 'Game Programming Gems 4. SmoothDamp의 원전.' },
    { type: 'article', title: "Spring-It-On: The Game Developer's Spring-Roll-Call (Daniel Holden)", url: 'https://theorangeduck.com/page/spring-roll-call', year: 2021, note: '감쇠 스프링의 해석해와 half-life 파라미터화.' },
    { type: 'article', title: 'Damped Springs (Ryan Juckett)', note: '감쇠비와 각진동수로 정의한 스프링을 dt와 관계없이 푸는 해석해.' },
  ],
  params: [
    { key: 'method', label: '추적 방식', type: 'select', group: '추적', options: [
      { value: 'lerp', label: '프레임 lerp: x += (t-x)*k' },
      { value: 'spring', label: '감쇠 스프링 (ω, ζ)' },
      { value: 'smoothdamp', label: 'SmoothDamp (Unity)' },
    ], a: 'lerp', b: 'spring' },
    { key: 'k', label: 'lerp 계수 k (프레임당)', type: 'range', min: 0.01, max: 0.6, step: 0.01, default: 0.12, when: (p) => p.method === 'lerp' },
    { key: 'freq', label: '진동수 f (Hz)', type: 'range', min: 0.2, max: 6, step: 0.05, default: 1.5, when: (p) => p.method === 'spring', help: 'ω = 2πf' },
    { key: 'zeta', label: '감쇠비 ζ', type: 'range', min: 0, max: 3, step: 0.05, default: 1, when: (p) => p.method === 'spring', help: '1 = 임계 감쇠' },
    { key: 'smoothTime', label: 'smoothTime (s)', type: 'range', min: 0.03, max: 1, step: 0.01, default: 0.2, when: (p) => p.method === 'smoothdamp' },
    { key: 'target', label: '추적 대상', type: 'select', group: '장면', options: [
      { value: 'jump', label: '순간 이동 (계단 입력)' },
      { value: 'orbit', label: '원 궤도' },
      { value: 'mouse', label: '마우스' },
    ], default: 'jump', shared: true, reset: true },
  ],
  en: {
    title: 'Damped Spring & Critical Damping (SmoothDamp)',
    summary: 'x = lerp(x, target, k) jerks when the target changes, because the velocity jumps. A damped spring keeps velocity as state, so acceleration stays finite. With damping ratio ζ=1 (critical damping), it settles fastest with no overshoot.',
    views: { a: 'Per-frame lerp', b: 'Critically damped spring' },
    controls: 'Set the follow target to "Mouse" to follow the mouse.',
    info: `
    <p>A <b>damped spring</b> makes cameras, UI, and crosshairs follow a target smoothly. It keeps velocity as state and moves by spring force.</p>
    <p>The common <code>x += (target - x)*k</code> is a <b>first-order filter that keeps only position as state</b>. It has two problems.</p>
    <ul>
      <li>When the target teleports, the velocity jumps from 0 to <code>k*distance/dt</code> in that frame. The camera feels like it "snaps" (an acceleration spike).</li>
      <li>It slows down exponentially near the end, so it takes a long time to stop.</li>
    </ul>
    <p>In the damped spring <code>a = ω²(target - x) - 2ζω*v</code>, both position and velocity are continuous. The motion depends on the damping ratio <code>ζ</code>.</p>
    <ul>
      <li>ζ &lt; 1: passes the target and wobbles (overshoot).</li>
      <li>ζ &gt; 1: sluggish.</li>
      <li><b>ζ = 1 (critical damping)</b>: settles fastest with no overshoot.</li>
    </ul>
    <p>This sample integrates with <b>implicit Euler</b>, which is always stable. Unity's <code>Mathf.SmoothDamp</code> uses the critically damped spring approximation from Game Programming Gems 4 (a polynomial approximation of the exponential).</p>
    <p>Downside: it has one more parameter than lerp (frequency and damping ratio), and you must store the velocity state.</p>`,
    look: [
      'Compare "Max acceleration" of A and B. A is several times larger. At each jump, A\'s speed goes from 0 to max at once (a vertical rise in the speed graph below). The spring\'s speed rises gradually.',
      'Lower B\'s damping ratio ζ to 0.3. It passes the target and wobbles (overshoot %). Raise it to 2 and it gets slow (longer settle time). 1 is best.',
      'Switch A to SmoothDamp. It gives almost the same curve as B (ζ=1), because both are critically damped springs.',
      'Set the follow target to "Circle orbit". Both lerp and spring lag behind. The spring needs a higher frequency to keep up.',
    ],
    refs: [
      null,
      'Game Programming Gems 4. The original source of SmoothDamp.',
      'Closed-form solutions of damped springs and half-life parameterization.',
      'A closed-form solution, independent of dt, for springs defined by damping ratio and angular frequency.',
    ],
    params: {
      method: { label: 'Follow method', group: 'Follow', options: { lerp: 'Per-frame lerp: x += (t-x)*k', spring: 'Damped spring (ω, ζ)' } },
      k: 'Lerp factor k (per frame)',
      freq: 'Frequency f (Hz)',
      zeta: { label: 'Damping ratio ζ', help: '1 = critical damping' },
      target: { label: 'Follow target', group: 'Scene', options: { jump: 'Teleport (step input)', orbit: 'Circle orbit', mouse: 'Mouse' } },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const LW = 600, LH = 300;
    const HIST = 240;
    let tgt = { x: 150, y: 150 }, pos = { x: 150, y: 150 }, vel = { x: 0, y: 0 };
    let t = 0, nextJump = 0.5, jumpT = 0, jStart = null, jDist = 0, jDir = null, overshoot = 0, lastOutside = 0;
    let prevV = { x: 0, y: 0 };
    const histX = [], histT = [], histV = [], accHist = [];
    ctx.rng = U.rng(ctx.seed);
    let mouseL = null;

    function follow(dt) {
      const m = P.method;
      if (m === 'lerp') {
        const nx = pos.x + (tgt.x - pos.x) * P.k, ny = pos.y + (tgt.y - pos.y) * P.k;
        vel = { x: (nx - pos.x) / dt, y: (ny - pos.y) / dt };
        pos = { x: nx, y: ny };
      } else if (m === 'spring') {
        // 암시적 Euler: v1 = (v0 - dt*ω²(x0 - t)) / (1 + 2ζω*dt + ω²dt²); x1 = x0 + v1*dt
        const w = U.TAU * P.freq, kk = w * w, c = 2 * P.zeta * w, den = 1 + c * dt + kk * dt * dt;
        for (const a of ['x', 'y']) {
          vel[a] = (vel[a] - dt * kk * (pos[a] - tgt[a])) / den;
          pos[a] += vel[a] * dt;
        }
      } else {
        // Unity SmoothDamp (Game Programming Gems 4)
        const st = Math.max(0.0001, P.smoothTime), om = 2 / st, x = om * dt;
        const e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
        for (const a of ['x', 'y']) {
          const change = pos[a] - tgt[a];
          const temp = (vel[a] + om * change) * dt;
          vel[a] = (vel[a] - om * temp) * e;
          pos[a] = tgt[a] + (change + temp) * e;
        }
      }
    }

    return {
      update(dt) {
        if (dt <= 0) return;
        t += dt;
        if (P.target === 'jump') {
          if (t >= nextJump) {
            const nt = { x: ctx.rng.range(60, LW - 60), y: ctx.rng.range(50, LH - 50) };
            jStart = { ...pos }; jDist = Math.hypot(nt.x - pos.x, nt.y - pos.y) || 1;
            jDir = { x: (nt.x - pos.x) / jDist, y: (nt.y - pos.y) / jDist };
            tgt = nt; jumpT = t; overshoot = 0; lastOutside = t;
            nextJump = t + 1.8;
          }
        } else if (P.target === 'orbit') {
          const a = t * 1.6;
          tgt = { x: LW / 2 + Math.cos(a) * 200, y: LH / 2 + Math.sin(a) * 100 };
        } else if (mouseL) tgt = { ...mouseL };
        follow(dt);
        const acc = Math.hypot(vel.x - prevV.x, vel.y - prevV.y) / dt;
        prevV = { ...vel };
        accHist.push(acc); if (accHist.length > 120) accHist.shift();
        if (jDir) {
          const p = (pos.x - jStart.x) * jDir.x + (pos.y - jStart.y) * jDir.y;
          overshoot = Math.max(overshoot, (p - jDist) / jDist);
          if (Math.hypot(pos.x - tgt.x, pos.y - tgt.y) > jDist * 0.02) lastOutside = t;
        }
        histX.push(pos.x); histT.push(tgt.x); histV.push(Math.hypot(vel.x, vel.y));
        if (histX.length > HIST) { histX.shift(); histT.shift(); histV.shift(); }
      },
      onPointer(type, m) {
        const s = Math.min(ctx.width / LW, (ctx.height * 0.6) / LH), ox = (ctx.width - LW * s) / 2;
        mouseL = { x: U.clamp((m.x - ox) / s, 0, LW), y: U.clamp((m.y - 6) / s, 0, LH) };
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        const s = Math.min(W / LW, (H * 0.6) / LH), ox = (W - LW * s) / 2, oy = 6;
        g.save(); g.translate(ox, oy); g.scale(s, s);
        D.rect(g, 0, 0, LW, LH, 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.08)');
        D.grid(g, LW, LH, 30);
        // 목표
        D.line(g, tgt.x - 12, tgt.y, tgt.x + 12, tgt.y, C.good, 2);
        D.line(g, tgt.x, tgt.y - 12, tgt.x, tgt.y + 12, C.good, 2);
        D.circle(g, tgt.x, tgt.y, 16, null, 'rgba(102,209,122,0.5)', 1.5);
        D.line(g, pos.x, pos.y, tgt.x, tgt.y, 'rgba(255,255,255,0.12)', 1);
        D.circle(g, pos.x, pos.y, 10, col);
        D.arrow(g, pos.x, pos.y, pos.x + vel.x * 0.08, pos.y + vel.y * 0.08, 'rgba(255,255,255,0.8)', 1.5, 6);
        g.restore();
        // 그래프: x(t) & 속도
        const gx = 10, gw = W - 20, gh1 = (H - LH * s - 30) * 0.55, gy1 = oy + LH * s + 10, gy2 = gy1 + gh1 + 6, gh2 = H - gy2 - 6;
        if (gh1 > 20) {
          D.plot(g, histT.length > 1 ? histT : [0, 0], gx, gy1, gw, gh1, { min: 0, max: LW, color: 'rgba(102,209,122,0.6)', label: GTL.L('x 위치 (초록: 목표)', 'x position (green: target)') });
          D.plot(g, histX.length > 1 ? histX : [0, 0], gx, gy1, gw, gh1, { min: 0, max: LW, color: col, background: false, lineWidth: 2 });
        }
        if (gh2 > 16) {
          let vmax = 400; for (const v of histV) vmax = Math.max(vmax, v);
          D.plot(g, histV.length > 1 ? histV : [0, 0], gx, gy2, gw, gh2, { min: 0, max: vmax, color: col, label: GTL.L(`속력 (최대 ${vmax.toFixed(0)} px/s)`, `Speed (max ${vmax.toFixed(0)} px/s)`) });
        }
        let amax = 0; for (const a of accHist) amax = Math.max(amax, a);
        ctx.stat(GTL.L('최대 가속도 (2초)', 'Max acceleration (2 s)'), amax.toFixed(0) + ' px/s²');
        if (P.target === 'jump' && jDir) {
          ctx.stat(GTL.L('오버슈트', 'Overshoot'), (Math.max(0, overshoot) * 100).toFixed(1) + ' %');
          ctx.stat(GTL.L('2% 정착 시간', '2% settle time'), (lastOutside - jumpT).toFixed(2) + ' s');
        } else { ctx.stat(GTL.L('오버슈트', 'Overshoot'), '-'); ctx.stat(GTL.L('2% 정착 시간', '2% settle time'), '-'); }
        ctx.stat(GTL.L('목표까지 거리', 'Distance to target'), Math.hypot(pos.x - tgt.x, pos.y - tgt.y).toFixed(1) + ' px');
      },
    };
  },
});
