// 애니메이션 전환: 즉시 전환(pop) vs 크로스페이드 블렌딩 (+ 위상 동기화, 고정 포즈 블렌드)
GTL.register({
  id: 'pose-crossfade',
  title: '애니메이션 크로스페이드 블렌딩',
  summary: '상태가 바뀔 때 새 클립으로 즉시 바꾸면 관절이 한 프레임에 순간 이동(pop). 크로스페이드(두 클립을 함께 재생하며 가중치를 옮김)와 걷기↔달리기 위상 동기화로 부드럽게 전환.',
  views: { a: '즉시 전환', b: '크로스페이드 0.3초' },
  controls: '1 대기, 2 걷기, 3 달리기, 4 웅크리기 (두 뷰 공통). 키를 누르지 않으면 상태가 자동으로 바뀜.',
  info: `
    <p>애니메이션 상태 머신이 <code>Idle → Run</code>으로 바뀌면, 새 클립의 첫 프레임 자세는 이전 자세와 전혀 다름.
    <b>즉시 전환</b>하면 모든 관절이 한 프레임 안에 튐. 눈에 띄는 <b>팝(pop)</b>이 생김.</p>
    <p><b>크로스페이드</b>는 전환 시간 동안 두 클립을 모두 평가. 그리고 <code>pose = lerp(from, to, w)</code>로 섞음. 실제 엔진은 관절 회전을 쿼터니언 slerp나 nlerp로 섞음.</p>
    <p>걷기↔달리기처럼 주기 동작끼리 섞을 때는 두 클립의 <b>정규화 위상</b>(주기 안에서의 진행률 0~1)을 맞춰야 함(<b>sync, 위상 동기화</b>).
    맞추지 않으면 왼발과 오른발이 엇갈림. 다리가 꼬이거나 무릎이 오그라듦.</p>
    <p><b>고정 포즈 블렌드(frozen)</b>는 이전 클립을 전환 순간의 자세로 멈춘 채 섞음. 클립 1개만 평가해 비용이 쌈.
    Gears of War의 <b>Inertialization</b>은 여기서 더 나아가 이전 자세와의 차이를 감쇠시키는 방식.</p>`,
  diagram: (L) => {
    const sm = (u) => u * u * (3 - 2 * u);
    const ramp = (top, bot, up) => Array.from({ length: 21 }, (_, i) => {
      const w = sm(i / 20), v = up ? w : 1 - w;
      return `${(250 + i * 5).toFixed(0)},${(bot - (bot - top) * v).toFixed(1)}`;
    }).join(' ');
    return `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <line x1="250" y1="14" x2="250" y2="166" class="d-accent" stroke-dasharray="4 3"/>
    <text x="246" y="12" text-anchor="end" class="t-small">${L('상태 변경 (Idle → Run)', 'state change (Idle → Run)')}</text>
    <line x1="350" y1="74" x2="350" y2="166" class="d-dim" stroke-dasharray="2 3"/>
    <text x="300" y="70" text-anchor="middle" class="t-small t-dim">${L('전환 시간', 'blend time')}</text>
    <text x="4" y="40" class="t-a">${L('A 가중치', 'A weights')}</text>
    <polyline points="110,26 250,26 250,56 520,56" class="d-dim"/>
    <polyline points="110,56 250,56 250,26 520,26" class="d-a"/>
    <text x="114" y="22" class="t-small t-dim">Idle w</text><text x="516" y="22" text-anchor="end" class="t-small t-a">Run w</text>
    <text x="4" y="98" class="t-b">${L('B 가중치', 'B weights')}</text>
    <polyline points="110,84 250,84 ${ramp(84, 114, false)} 520,114" class="d-dim"/>
    <polyline points="110,114 250,114 ${ramp(84, 114, true)} 520,84" class="d-b"/>
    <text x="114" y="80" class="t-small t-dim">Idle w</text><text x="516" y="80" text-anchor="end" class="t-small t-b">Run w</text>
    <text x="4" y="150">${L('관절 각도', 'Joint angle')}</text>
    <text x="4" y="164" class="t-small t-dim">${L('결과 포즈', 'output pose')}</text>
    <polyline points="110,158 250,158 250,132 520,132" class="d-a"/>
    <polyline points="110,158 250,158 ${ramp(132, 158, true)} 520,132" class="d-b"/>
    <text x="262" y="126" class="t-small t-a">${L('A: 한 프레임에 점프 (pop)', 'A: jumps in one frame (pop)')}</text>
    <text x="358" y="150" class="t-small t-b">${L('B: 부드럽게 이어짐', 'B: smooth')}</text>
    <text x="4" y="190" class="t-small t-dim">${L('pose = lerp(Idle 포즈, Run 포즈, w). 전환 시간 동안 두 클립을 함께 평가', 'pose = lerp(Idle pose, Run pose, w). Both clips are evaluated during the blend')}</text>
  </svg>`;
  },
  look: [
    '아래 그래프(오른쪽 허벅지 각도)를 보면 A는 전환마다 수직으로 끊기고 B는 매끄럽게 이어짐',
    '"최대 관절 점프" 값을 비교하면 즉시 전환은 프레임당 수십 도, 크로스페이드는 프레임당 몇 도',
    'B의 "보행 위상 동기화"를 끄고 2(걷기)와 3(달리기)을 번갈아 누르면 섞이는 동안 다리가 엇갈려 허우적댐',
    '전환 시간을 1초 이상으로 늘리면 반응이 둔해짐. 게임에서는 보통 0.1~0.3초.',
  ],
  refs: [
    { type: 'engine', title: 'Unity Manual - Animation transitions', url: 'https://docs.unity3d.com/Manual/class-Transition.html', note: 'Transition Duration, Exit Time, Interruption Source.' },
    { type: 'engine', title: 'Unreal Engine - Animation Sync Groups', note: '길이가 다른 보행 클립의 위상을 맞춰 블렌드' },
    { type: 'talk', title: 'Inertialization: High-Performance Animation Transitions in Gears of War (David Bollo)', year: 2018, note: 'GDC 2018. 크로스페이드 대신 포즈 차이를 감쇠시키는 전환.' },
    { type: 'book', title: 'Game Engine Architecture (Jason Gregory) - Animation Blending', note: 'LERP 블렌딩, 크로스페이드 종류(smooth, frozen), 위상 동기화' },
  ],
  params: [
    { key: 'mode', label: '전환 방식', type: 'select', group: '전환', options: [
      { value: 'snap', label: '즉시 전환' },
      { value: 'cross', label: '크로스페이드' },
      { value: 'frozen', label: '고정 포즈 블렌드 (frozen)' },
    ], a: 'snap', b: 'cross' },
    { key: 'blend', label: '전환 시간 (초)', type: 'range', min: 0.02, max: 1.5, step: 0.01, default: 0.3, when: (p) => p.mode !== 'snap' },
    { key: 'curve', label: '가중치 곡선', type: 'select', options: [
      { value: 'linear', label: '선형' },
      { value: 'smooth', label: 'smoothstep' },
    ], default: 'smooth', when: (p) => p.mode !== 'snap' },
    { key: 'sync', label: '보행 위상 동기화', type: 'bool', default: true, help: '걷기↔달리기 전환 때 새 클립을 이전 클립과 같은 정규화 위상에서 시작' },
    { key: 'ghosts', label: '레이어 포즈 표시', type: 'bool', default: true },
    { key: 'auto', label: '자동 상태 변경', type: 'bool', default: true, shared: true, group: '장면' },
    { key: 'interval', label: '자동 변경 간격 (초)', type: 'range', min: 0.3, max: 4, step: 0.1, default: 1.6, shared: true },
  ],
  en: {
    title: 'Animation Crossfade Blending',
    summary: 'If you switch to the new clip at once when the state changes, the joints teleport in one frame (pop). A crossfade (play both clips and shift the weight over) plus walk↔run phase sync makes the transition smooth.',
    views: { a: 'Instant switch', b: 'Crossfade 0.3 s' },
    controls: '1 idle, 2 walk, 3 run, 4 crouch (in both views). If you press no key, the state changes on its own.',
    info: `
    <p>When the animation state machine goes from <code>Idle → Run</code>, the first frame of the new clip looks nothing like the previous pose.
    With an <b>instant switch</b>, every joint jumps within one frame. You see an obvious <b>pop</b>.</p>
    <p>A <b>crossfade</b> evaluates both clips during the transition time. It mixes them with <code>pose = lerp(from, to, w)</code>. Real engines mix joint rotations with quaternion slerp or nlerp.</p>
    <p>When you mix cyclic motions such as walk↔run, you must match the <b>normalized phase</b> (progress within the cycle, 0~1) of both clips (<b>sync, phase sync</b>).
    If you do not, the left and right feet fall out of step. The legs tangle or the knees fold up.</p>
    <p>A <b>frozen pose blend</b> freezes the previous clip at the pose from the moment of the switch and mixes from there. It evaluates only one clip, so it is cheap.
    <b>Inertialization</b> in Gears of War goes further: it fades out the difference from the previous pose.</p>`,
    look: [
      'Look at the graph below (right thigh angle). A breaks vertically at each transition. B connects smoothly.',
      'Compare the "Max joint jump" values. An instant switch gives tens of degrees per frame. A crossfade gives a few degrees per frame.',
      'Turn off B\'s "Gait phase sync" and press 2 (walk) and 3 (run) in turn. During the blend, the legs fall out of step and flail.',
      'Raise the transition time to 1 second or more. The response feels sluggish. Games usually use 0.1~0.3 seconds.',
    ],
    refs: [
      'Transition Duration, Exit Time, Interruption Source.',
      'Matches the phase of walk clips with different lengths before blending.',
      'GDC 2018. A transition that fades out the pose difference instead of crossfading.',
      'LERP blending, crossfade types (smooth, frozen), and phase sync.',
    ],
    params: {
      mode: { label: 'Transition method', group: 'Transition', options: { snap: 'Instant switch', cross: 'Crossfade', frozen: 'Frozen pose blend' } },
      blend: 'Transition time (s)',
      curve: { label: 'Weight curve', options: { linear: 'Linear' } },
      sync: { label: 'Gait phase sync', help: 'On walk↔run transitions, start the new clip at the same normalized phase as the previous clip' },
      ghosts: 'Show layer poses',
      auto: { label: 'Auto state change', group: 'Scene' },
      interval: 'Auto change interval (s)',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const TAU = U.TAU, sin = Math.sin, cos = Math.cos;
    const KEYS = ['thighL', 'kneeL', 'thighR', 'kneeR', 'armL', 'elbowL', 'armR', 'elbowR', 'torso', 'head', 'lift'];
    // 각도 기준: 다리/팔은 "아래 방향"에서 앞(+)으로, 무릎은 뒤로 굽힘(+), 팔꿈치는 앞으로 굽힘(+), 몸통은 앞으로 기울기(+)
    const ANIMS = {
      idle: { label: GTL.L('대기', 'Idle'), period: 3.0, speed: 0, pose: (p) => {
        const b = sin(p * TAU);
        return { thighL: 0.06, kneeL: 0.1, thighR: -0.06, kneeR: 0.08, armL: 0.08 + b * 0.03, elbowL: 0.25, armR: -0.06 - b * 0.03, elbowR: 0.2, torso: 0.02 + b * 0.02, head: -0.02, lift: b * 1.5 };
      } },
      walk: { label: GTL.L('걷기', 'Walk'), period: 1.05, speed: 90, gait: true, pose: (p) => {
        const s = sin(p * TAU), s2 = sin(p * TAU + Math.PI);
        return { thighL: 0.45 * s, kneeL: 0.05 + 0.7 * Math.max(0, cos(p * TAU)), thighR: 0.45 * s2, kneeR: 0.05 + 0.7 * Math.max(0, -cos(p * TAU)),
          armL: -0.35 * s, elbowL: 0.35, armR: -0.35 * s2, elbowR: 0.35, torso: 0.06, head: 0, lift: Math.abs(cos(p * TAU)) * 3 };
      } },
      run: { label: GTL.L('달리기', 'Run'), period: 0.62, speed: 240, gait: true, pose: (p) => {
        const s = sin(p * TAU), s2 = -s;
        return { thighL: 0.85 * s, kneeL: 0.3 + 1.3 * Math.max(0, cos(p * TAU)), thighR: 0.85 * s2, kneeR: 0.3 + 1.3 * Math.max(0, -cos(p * TAU)),
          armL: -0.8 * s, elbowL: 1.5, armR: 0.8 * s, elbowR: 1.5, torso: 0.28, head: -0.12, lift: 6 + Math.abs(cos(p * TAU)) * 10 };
      } },
      crouch: { label: GTL.L('웅크리기', 'Crouch'), period: 2.0, speed: 0, pose: (p) => {
        const b = sin(p * TAU);
        return { thighL: 1.25, kneeL: 2.3, thighR: 1.0, kneeR: 2.1, armL: 0.9 + b * 0.05, elbowL: 0.8, armR: 0.6, elbowR: 0.9, torso: 0.55, head: -0.35, lift: 0 };
      } },
    };
    const ORDER = ['idle', 'walk', 'run', 'crouch'];
    let layers, fade, current, autoTimer, scroll, hist, jumpHist, prevPose, maxJump;
    function init() {
      layers = [{ anim: 'idle', time: 0, w: 1, w0: 1, frozen: false }];
      fade = null; current = 'idle'; autoTimer = P.interval; scroll = 0; hist = []; jumpHist = []; prevPose = null; maxJump = 0;
    }
    init();
    const phaseOf = (l) => (l.time / ANIMS[l.anim].period) % 1;

    function transition(to) {
      if (to === current) return;
      const top = layers[layers.length - 1];
      let start = 0;
      if (P.sync && ANIMS[to].gait && ANIMS[top.anim].gait) start = phaseOf(top) * ANIMS[to].period;
      if (P.mode === 'snap') {
        layers = [{ anim: to, time: start, w: 1, w0: 1, frozen: false }];
        fade = null;
      } else {
        layers.forEach((l) => { l.w0 = l.w; if (P.mode === 'frozen') l.frozen = true; });
        layers.push({ anim: to, time: start, w: 0, w0: 0, frozen: false });
        if (layers.length > 6) layers.shift();
        fade = { t: 0 };
      }
      current = to;
    }

    function evalPose() {
      const out = {}; KEYS.forEach((k) => (out[k] = 0));
      let sum = 0;
      for (const l of layers) {
        if (l.w <= 0) continue;
        const pz = ANIMS[l.anim].pose(phaseOf(l));
        KEYS.forEach((k) => (out[k] += pz[k] * l.w));
        sum += l.w;
      }
      if (sum > 0) KEYS.forEach((k) => (out[k] /= sum));
      return out;
    }

    // FK: 포즈 → 관절 위치 (hip 기준, 아래가 +y)
    const UL = 46, LL = 44, TL = 62, UA = 34, FA = 32, HR = 13;
    const dirDown = (a, l) => ({ x: sin(a) * l, y: cos(a) * l });
    function fk(pz) {
      const H = { x: 0, y: 0 };
      const leg = (th, kn) => { const k = dirDown(th, UL); const f = dirDown(th - kn, LL); return { knee: k, foot: { x: k.x + f.x, y: k.y + f.y } }; };
      const L = leg(pz.thighL, pz.kneeL), R = leg(pz.thighR, pz.kneeR);
      const neck = { x: sin(pz.torso) * TL, y: -cos(pz.torso) * TL };
      const sh = { x: neck.x * 0.92, y: neck.y * 0.92 };
      const arm = (a, e) => { const el = dirDown(a, UA); const h = dirDown(a + e, FA); return { elbow: { x: sh.x + el.x, y: sh.y + el.y }, hand: { x: sh.x + el.x + h.x, y: sh.y + el.y + h.y } }; };
      const AL = arm(pz.armL, pz.elbowL), AR = arm(pz.armR, pz.elbowR);
      const ha = pz.torso + pz.head;
      const head = { x: neck.x + sin(ha) * (HR + 3), y: neck.y - cos(ha) * (HR + 3) };
      const ground = Math.max(L.foot.y, R.foot.y);
      return { H, L, R, neck, sh, AL, AR, head, ground };
    }

    function drawFigure(g, pz, ox, gy, color, lw, alpha) {
      const s = fk(pz), oy = gy - s.ground - pz.lift;
      const T = (p) => ({ x: ox + p.x, y: oy + p.y });
      g.globalAlpha = alpha;
      const seg = (a, b, c, w) => { const A = T(a), B = T(b); D.line(g, A.x, A.y, B.x, B.y, c, w); };
      const far = 'rgba(255,255,255,0.35)';
      seg(s.sh, s.AL.elbow, far, lw); seg(s.AL.elbow, s.AL.hand, far, lw);
      seg(s.H, s.L.knee, far, lw); seg(s.L.knee, s.L.foot, far, lw);
      seg(s.H, s.neck, color, lw + 1);
      seg(s.H, s.R.knee, color, lw); seg(s.R.knee, s.R.foot, color, lw);
      seg(s.sh, s.AR.elbow, color, lw); seg(s.AR.elbow, s.AR.hand, color, lw);
      const h = T(s.head);
      D.circle(g, h.x, h.y, HR, alpha < 1 ? null : '#20242c', color, lw * 0.6);
      g.globalAlpha = 1;
    }

    return {
      update(dt) {
        const keyMap = { Digit1: 'idle', Digit2: 'walk', Digit3: 'run', Digit4: 'crouch' };
        let manual = false;
        for (const k in keyMap) if (ctx.input.pressed(k)) { transition(keyMap[k]); manual = true; autoTimer = P.interval * 2; }
        if (P.auto && !manual) {
          autoTimer -= dt;
          if (autoTimer <= 0) {
            autoTimer = P.interval;
            const options = ORDER.filter((a) => a !== current);
            transition(options[Math.floor(ctx.random() * options.length)]);
          }
        }
        if (fade) {
          fade.t = Math.min(1, fade.t + dt / P.blend);
          const e = P.curve === 'smooth' ? U.smoothstep(0, 1, fade.t) : fade.t;
          const n = layers.length - 1;
          layers.forEach((l, i) => { l.w = i === n ? e : l.w0 * (1 - e); });
          if (fade.t >= 1) { layers = [layers[n]]; layers[0].w = 1; fade = null; }
        }
        layers.forEach((l) => { if (!l.frozen) l.time += dt; });
        // 지면 스크롤 속도도 가중 평균
        let sp = 0, sum = 0;
        layers.forEach((l) => { sp += ANIMS[l.anim].speed * l.w; sum += l.w; });
        scroll += (sum > 0 ? sp / sum : 0) * dt;
        const pz = evalPose();
        hist.push(pz.thighR); if (hist.length > 240) hist.shift();
        if (prevPose) {
          let j = 0;
          for (const k of KEYS) if (k !== 'lift') j = Math.max(j, Math.abs(pz[k] - prevPose[k]));
          jumpHist.push(j); if (jumpHist.length > 180) jumpHist.shift();
          maxJump = Math.max(...jumpHist);
        }
        prevPose = pz;
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        const gy = H - 120, ox = W * 0.42;
        // 지면
        D.line(g, 0, gy, W, gy, C.dim, 2);
        for (let x = -((scroll % 40) + 40); x < W + 40; x += 40) D.line(g, x, gy + 2, x - 10, gy + 12, 'rgba(255,255,255,0.15)', 1);
        if (P.ghosts && layers.length > 1) {
          layers.forEach((l) => drawFigure(g, ANIMS[l.anim].pose(phaseOf(l)), ox, gy, '#ffffff', 2, 0.18));
        }
        drawFigure(g, evalPose(), ox, gy, col, 5, 1);
        // 레이어 가중치 막대
        let y = 12;
        D.text(g, GTL.L('레이어 가중치', 'Layer weights'), 12, y, { size: 11, color: C.dim }); y += 18;
        for (const name of ORDER) {
          const w = layers.filter((l) => l.anim === name).reduce((a, l) => a + l.w, 0);
          D.rect(g, 12, y, 120, 10, 'rgba(255,255,255,0.06)');
          D.rect(g, 12, y, 120 * w, 10, name === current ? col : C.dim);
          D.text(g, `${ANIMS[name].label} ${w.toFixed(2)}`, 140, y - 1, { size: 10, color: name === current ? C.text : C.dim });
          y += 16;
        }
        // 관절 각도 그래프
        D.plot(g, hist, 12, H - 92, W - 24, 70, { min: -1.2, max: 1.4, color: col, label: GTL.L('오른쪽 허벅지 각도 (최근 4초)', 'Right thigh angle (last 4 s)') });
        ctx.stat(GTL.L('현재 상태', 'Current state'), ANIMS[current].label + (fade ? GTL.L(` → 블렌드 ${(fade.t * 100).toFixed(0)}%`, ` → blend ${(fade.t * 100).toFixed(0)}%`) : ''));
        ctx.stat(GTL.L('최대 관절 점프 (3초)', 'Max joint jump (3 s)'), U.deg(maxJump).toFixed(1) + GTL.L('° / 프레임', '° / frame'));
        ctx.stat(GTL.L('평가 클립 수', 'Clips evaluated'), layers.filter((l) => !l.frozen).length);
      },
      onParam(key) { if (key === 'mode' && P.mode === 'snap') { layers = [layers[layers.length - 1]]; layers[0].w = 1; fade = null; } },
    };
  },
});
