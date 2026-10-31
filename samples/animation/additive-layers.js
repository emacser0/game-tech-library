// 애니메이션 레이어: 덮어쓰기(override) vs 애디티브(additive). 숨쉬기, 피격 반응을 기본 동작 위에 얹음.
GTL.register({
  id: 'additive-layers',
  title: '애디티브 레이어 vs 덮어쓰기 레이어',
  summary: '숨쉬기와 피격 반응을 덮어쓰기 레이어로 얹으면 그 가중치만큼 기본 동작(걷기)이 지워짐. 애디티브 레이어는 기준 포즈와의 차이만 더해서 걷기와 반응이 함께 보임.',
  views: { a: '덮어쓰기 (override)', b: '애디티브 (additive)' },
  controls: 'Space 피격 반응 재생 (두 뷰 공통). 누르지 않으면 2초마다 자동으로 맞음.',
  info: `
    <p>애니메이션 레이어는 기본 동작 위에 다른 클립을 겹치는 기능. 레이어마다 가중치와 본 마스크(적용할 관절 목록)가 있음.</p>
    <p><b>덮어쓰기(override)</b>: <code>pose = lerp(base, layer, w)</code>. 레이어 클립의 포즈 자체로 바꿈. 피격 클립이 서 있는 자세로 만들어졌다면, 걷는 중에 맞아도 다리가 서 있는 자세로 끌려감.</p>
    <p><b>애디티브(additive)</b>: 레이어 클립에서 <b>기준 포즈(reference pose)</b>를 뺀 차이만 저장. 그리고 <code>pose = base + w * (layer - ref)</code>로 더함.
    그래서 숨쉬기 하나를 걷기, 웅크리기, 대기 어디에나 얹을 수 있음.</p>
    <p>실제 엔진은 회전을 쿼터니언으로 다룸. 차이는 <code>inverse(ref) * layer</code>, 적용은 곱셈. 여기서는 2D 관절 각도라 덧셈으로 충분함.</p>
    <p>단점: 차이를 더하므로 기본 포즈가 기준 포즈와 많이 다르면 관절이 한계를 넘을 수 있음. 웅크린 자세에 상체 젖힘을 더하는 경우처럼.</p>`,
  // 도식: 관절 두 개(허벅지, 몸통)의 각도로 본 합성. 덮어쓰기는 피격 클립 값으로 바뀌어 걸음이 사라짐. 애디티브는 기준 포즈와의 차이만 더해 걸음이 남음
  diagram: (L) => {
    const cols = [
      { x: 140, h: L('걷기 (기본)', 'Walk (base)'), cls: 'd-line', t: '', thigh: 25, torso: 5 },
      { x: 225, h: L('기준 포즈', 'Ref pose'), cls: 'd-dim', t: 't-dim', thigh: 2, torso: 2 },
      { x: 310, h: L('피격 클립', 'Hit clip'), cls: 'd-line', t: '', thigh: 2, torso: -40 },
      { x: 405, h: L('A 덮어쓰기', 'A override'), cls: 'd-a', t: 't-a', thigh: 2, torso: -40 },
      { x: 490, h: L('B 애디티브', 'B additive'), cls: 'd-b', t: 't-b', thigh: 25, torso: -37 },
    ];
    const r = (d) => d * Math.PI / 180, f = (n) => n.toFixed(1);
    const cells = cols.map((c) => `
      <text x="${c.x}" y="18" text-anchor="middle" class="t-small ${c.t}">${c.h}</text>
      <circle cx="${c.x}" cy="36" r="3" class="f-dim"/>
      <line x1="${c.x}" y1="36" x2="${f(c.x + Math.sin(r(c.thigh)) * 30)}" y2="${f(36 + Math.cos(r(c.thigh)) * 30)}" class="${c.cls}" stroke-width="3"/>
      <text x="${c.x}" y="82" text-anchor="middle" class="t-small t-mono ${c.t}">${c.thigh}°</text>
      <circle cx="${c.x}" cy="128" r="3" class="f-dim"/>
      <line x1="${c.x}" y1="128" x2="${f(c.x + Math.sin(r(c.torso)) * 30)}" y2="${f(128 - Math.cos(r(c.torso)) * 30)}" class="${c.cls}" stroke-width="3"/>
      <text x="${c.x}" y="146" text-anchor="middle" class="t-small t-mono ${c.t}">${c.torso}°</text>`).join('');
    return `<svg viewBox="0 0 540 214" xmlns="http://www.w3.org/2000/svg">
    <text x="6" y="52">${L('허벅지', 'Thigh')}</text>
    <text x="6" y="118">${L('몸통', 'Torso')}</text>
    <line x1="362" y1="8" x2="362" y2="150" class="d-dim" stroke-dasharray="3 3"/>
    ${cells}
    <text x="6" y="172" class="t-mono t-a">A: pose = lerp(base, layer, w)</text>
    <text x="6" y="188" class="t-mono t-b">B: pose = base + w * (layer − ref)</text>
    <text x="270" y="172" class="t-small t-dim">${L('w = 1이면 허벅지 2°, 걸음 사라짐', 'At w = 1 the thigh is 2°, the step is lost')}</text>
    <text x="270" y="188" class="t-small t-dim">${L('25 + (2 − 2) = 25°, 걸음 유지', '25 + (2 − 2) = 25°, the step stays')}</text>
    <text x="6" y="208" class="t-small t-dim">${L('피격 클립은 서 있는 기준 포즈 위에서 만듦. 차이는 몸통 −42°뿐', 'The hit clip was made on the standing ref pose. Its only difference is torso −42°')}</text>
  </svg>`;
  },
  look: [
    'A를 보면 걷는 중에도 팔이 거의 흔들리지 않음. 숨쉬기 레이어가 상체를 대기 자세로 덮어씀. B는 팔을 흔들며 숨도 쉼.',
    '맞는 순간 A는 다리가 서 있는 자세로 끌려가 미끄러짐. B는 걸음을 유지한 채 상체만 젖혀짐.',
    '"하체 차이" 값을 보면 피격 중 A는 수십 도, B는 몇 도. 희미한 흰 실루엣이 기본 동작 포즈.',
    '기본 동작을 "웅크려 걷기"로 바꾸면 A는 피격 때 몸을 펴 버림. B는 웅크린 채 젖혀짐.',
    'B의 "피격 가중치"를 2 가까이 올리면 차이가 두 배로 더해져 관절이 과하게 꺾임',
  ],
  refs: [
    { type: 'engine', title: 'Unity Manual - Animation Layers', url: 'https://docs.unity3d.com/Manual/AnimationLayers.html', note: 'Override와 Additive 블렌딩, Avatar Mask로 본 마스크 지정' },
    { type: 'engine', title: 'Unreal Engine - Additive Animations', note: 'Additive Anim Type, Base Pose Type(Reference Pose), Apply Additive 노드' },
    { type: 'book', title: 'Game Engine Architecture (Jason Gregory) - Additive Blending', note: '차이 클립(difference clip)을 만들고 더하는 방법과 한계' },
  ],
  params: [
    { key: 'mode', label: '레이어 합성', type: 'select', group: '레이어', options: [
      { value: 'override', label: '덮어쓰기 (override)' },
      { value: 'additive', label: '애디티브 (additive)' },
    ], a: 'override', b: 'additive' },
    { key: 'breath', label: '숨쉬기 레이어', type: 'bool', default: true },
    { key: 'breathW', label: '숨쉬기 가중치', type: 'range', min: 0, max: 2, step: 0.05, default: 1, when: (p) => p.breath },
    { key: 'hitW', label: '피격 가중치', type: 'range', min: 0, max: 2, step: 0.05, default: 1 },
    { key: 'hitMask', label: '피격 본 마스크', type: 'select', options: [
      { value: 'full', label: '전신' },
      { value: 'upper', label: '상체만' },
    ], default: 'full' },
    { key: 'base', label: '기본 동작', type: 'select', shared: true, group: '장면', options: [
      { value: 'walk', label: '걷기' },
      { value: 'crouch', label: '웅크려 걷기' },
      { value: 'idle', label: '대기' },
    ], default: 'walk' },
    { key: 'auto', label: '자동 피격', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Additive Layers vs Override Layers',
    summary: 'If you put breathing and hit reactions on an override layer, the layer weight erases that much of the base motion (walking). An additive layer adds only the difference from a reference pose, so you see the walk and the reaction together.',
    views: { a: 'Override', b: 'Additive' },
    controls: 'Space plays the hit reaction (in both views). If you do not press it, a hit plays every 2 seconds.',
    info: `
    <p>Animation layers stack other clips on top of a base motion. Each layer has a weight and a bone mask (the list of joints it affects).</p>
    <p><b>Override</b>: <code>pose = lerp(base, layer, w)</code>. It replaces the pose with the layer clip's pose. If the hit clip was made in a standing pose, a hit during a walk pulls the legs into a standing pose.</p>
    <p><b>Additive</b>: the layer clip stores only its difference from a <b>reference pose</b>. It is added with <code>pose = base + w * (layer - ref)</code>.
    So one breathing clip works on top of walking, crouching, or idle.</p>
    <p>Real engines handle rotations as quaternions. The difference is <code>inverse(ref) * layer</code>, and you apply it by multiplying. Here the joints are 2D angles, so addition is enough.</p>
    <p>Downside: because it adds a difference, joints can go past their limits when the base pose is far from the reference pose. One example is adding an upper body lean to a crouch.</p>`,
    look: [
      'Look at A. The arms barely swing during the walk, because the breathing layer overwrites the upper body with the idle pose. B swings its arms and breathes.',
      'On a hit, A\'s legs get pulled into a standing pose and slide. B keeps walking and only the upper body leans back.',
      'Check the "Lower body difference" value. During a hit, A shows tens of degrees and B only a few. The faint white silhouette is the base motion pose.',
      'Change the base motion to "Crouch walk". On a hit, A straightens up. B leans back while it stays crouched.',
      'Raise B\'s "Hit weight" close to 2. The difference is added twice, so the joints bend too far.',
    ],
    refs: [
      'Override and Additive blending. Avatar Mask sets the bone mask.',
      'Additive Anim Type, Base Pose Type (Reference Pose), and the Apply Additive node.',
      'How to build and add a difference clip, and its limits.',
    ],
    params: {
      mode: { label: 'Layer blending', group: 'Layers', options: { override: 'Override', additive: 'Additive' } },
      breath: 'Breathing layer',
      breathW: 'Breathing weight',
      hitW: 'Hit weight',
      hitMask: { label: 'Hit bone mask', options: { full: 'Full body', upper: 'Upper body only' } },
      base: { label: 'Base motion', group: 'Scene', options: { walk: 'Walk', crouch: 'Crouch walk', idle: 'Idle' } },
      auto: 'Auto hit',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const TAU = U.TAU, sin = Math.sin, cos = Math.cos;
    const KEYS = ['thighL', 'kneeL', 'thighR', 'kneeR', 'armL', 'elbowL', 'armR', 'elbowR', 'torso', 'head'];
    const LOWER = ['thighL', 'kneeL', 'thighR', 'kneeR'];
    const UPPER = ['armL', 'elbowL', 'armR', 'elbowR', 'torso', 'head'];
    const REF = { thighL: 0.04, kneeL: 0.08, thighR: -0.04, kneeR: 0.08, armL: 0.06, elbowL: 0.25, armR: -0.06, elbowR: 0.2, torso: 0.03, head: 0 };
    const BASE = {
      idle: { speed: 0, pose: () => ({ ...REF }) },
      walk: { speed: 90, period: 1.05, pose: (p) => {
        const s = sin(p * TAU);
        return { thighL: 0.45 * s, kneeL: 0.05 + 0.7 * Math.max(0, cos(p * TAU)), thighR: -0.45 * s, kneeR: 0.05 + 0.7 * Math.max(0, -cos(p * TAU)),
          armL: -0.4 * s, elbowL: 0.4, armR: 0.4 * s, elbowR: 0.4, torso: 0.08, head: 0 };
      } },
      crouch: { speed: 50, period: 1.3, pose: (p) => {
        const s = sin(p * TAU);
        return { thighL: 0.95 + 0.35 * s, kneeL: 1.7 + 0.4 * Math.max(0, cos(p * TAU)), thighR: 0.95 - 0.35 * s, kneeR: 1.7 + 0.4 * Math.max(0, -cos(p * TAU)),
          armL: 0.6 - 0.2 * s, elbowL: 1.0, armR: 0.6 + 0.2 * s, elbowR: 1.0, torso: 0.6, head: -0.4 };
      } },
    };
    // 레이어 클립. 둘 다 REF(서 있는 자세) 위에서 만든 전신 포즈.
    const breathClip = (t) => { const b = sin(t * TAU / 3.2); return { ...REF, torso: REF.torso - 0.05 * b, head: 0.05 * b, armL: REF.armL + 0.06 * b, armR: REF.armR - 0.06 * b, elbowL: REF.elbowL + 0.08 * b, elbowR: REF.elbowR + 0.08 * b }; };
    const HIT_LEN = 0.7;
    const hitClip = (t) => {
      const k = t < 0.08 ? t / 0.08 : Math.exp(-(t - 0.08) * 5.5) * cos((t - 0.08) * 9);
      return { ...REF, torso: REF.torso - 0.75 * k, head: -0.6 * k, armL: REF.armL - 0.9 * k, elbowL: REF.elbowL + 0.8 * k, armR: REF.armR + 1.1 * k, elbowR: REF.elbowR + 0.5 * k, kneeL: REF.kneeL + 0.15 * k, kneeR: REF.kneeR + 0.15 * k };
    };
    let t = 0, hitT = -1, autoTimer = 1.0, scroll = 0, lowerHist = [], armHist = [], base = null, final = null, torsoHist = [], baseTorsoHist = [];

    function apply(pose, layer, w, keys) {
      for (const k of keys) {
        if (P.mode === 'override') pose[k] = U.lerp(pose[k], layer[k], U.clamp(w, 0, 1));
        else pose[k] += w * (layer[k] - REF[k]);
      }
    }

    return {
      update(dt) {
        t += dt;
        if (ctx.input.pressed('Space')) { hitT = 0; autoTimer = 3; }
        if (P.auto) { autoTimer -= dt; if (autoTimer <= 0) { hitT = 0; autoTimer = 2; } }
        if (hitT >= 0) { hitT += dt; if (hitT > HIT_LEN) hitT = -1; }
        const B = BASE[P.base];
        scroll += B.speed * dt;
        base = B.pose(B.period ? (t / B.period) % 1 : 0);
        const pose = { ...base };
        if (P.breath) apply(pose, breathClip(t), P.breathW, UPPER);
        if (hitT >= 0) {
          // 레이어 가중치는 들어올 때와 나갈 때 0.1초씩 페이드
          const env = Math.min(1, hitT / 0.05, (HIT_LEN - hitT) / 0.1);
          apply(pose, hitClip(hitT), P.hitW * env, P.hitMask === 'full' ? KEYS : UPPER);
        }
        final = pose;
        let ld = 0; for (const k of LOWER) ld = Math.max(ld, Math.abs(final[k] - base[k]));
        lowerHist.push(ld); if (lowerHist.length > 150) lowerHist.shift();
        if (hitT < 0) { armHist.push(final.armL); if (armHist.length > 150) armHist.shift(); }
        torsoHist.push(final.torso); baseTorsoHist.push(base.torso);
        if (torsoHist.length > 240) { torsoHist.shift(); baseTorsoHist.shift(); }
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height, col = ctx.side === 'a' ? C.a : C.b;
        const gy = H - 130, ox = W * 0.45;
        D.line(g, 0, gy, W, gy, C.dim, 2);
        for (let x = -((scroll % 40) + 40); x < W + 40; x += 40) D.line(g, x, gy + 2, x - 10, gy + 12, 'rgba(255,255,255,0.15)', 1);
        if (!final) return;
        const UL = 46, LL = 44, TL = 62, UA = 34, FA = 32, HR = 13;
        const dn = (a, l) => ({ x: sin(a) * l, y: cos(a) * l });
        const fig = (pz, color, lw, alpha) => {
          const leg = (th, kn) => { const k = dn(th, UL), f = dn(th - kn, LL); return [k, { x: k.x + f.x, y: k.y + f.y }]; };
          const L = leg(pz.thighL, pz.kneeL), R = leg(pz.thighR, pz.kneeR);
          const neck = { x: sin(pz.torso) * TL, y: -cos(pz.torso) * TL };
          const arm = (a, e) => { const el = dn(a + pz.torso * 0.5, UA), h = dn(a + pz.torso * 0.5 + e, FA); return [{ x: neck.x + el.x, y: neck.y + el.y }, { x: neck.x + el.x + h.x, y: neck.y + el.y + h.y }]; };
          const AL = arm(pz.armL, pz.elbowL), AR = arm(pz.armR, pz.elbowR);
          const ha = pz.torso + pz.head, head = { x: neck.x + sin(ha) * (HR + 3), y: neck.y - cos(ha) * (HR + 3) };
          const oy = gy - Math.max(L[1].y, R[1].y);
          const T = (p) => [ox + p.x, oy + p.y];
          const seg = (a, b, c, w) => { const A = T(a), Bp = T(b); D.line(g, A[0], A[1], Bp[0], Bp[1], c, w); };
          const far = alpha < 1 ? color : 'rgba(255,255,255,0.35)';
          g.globalAlpha = alpha;
          const O = { x: 0, y: 0 };
          seg(neck, AL[0], far, lw); seg(AL[0], AL[1], far, lw);
          seg(O, L[0], far, lw); seg(L[0], L[1], far, lw);
          seg(O, neck, color, lw + 1);
          seg(O, R[0], color, lw); seg(R[0], R[1], color, lw);
          seg(neck, AR[0], color, lw); seg(AR[0], AR[1], color, lw);
          const hp = T(head); D.circle(g, hp[0], hp[1], HR, alpha < 1 ? null : '#20242c', color, lw * 0.6);
          g.globalAlpha = 1;
        };
        fig(base, '#ffffff', 2, 0.22);
        fig(final, hitT >= 0 ? C.bad : col, 5, 1);
        D.plot(g, baseTorsoHist, 12, H - 100, W - 24, 80, { min: -1.2, max: 1.2, color: 'rgba(255,255,255,0.4)', label: GTL.L('몸통 각도: 흰색 기본 동작, 색 최종 결과', 'Torso angle: white is base motion, color is final result') });
        D.plot(g, torsoHist, 12, H - 100, W - 24, 80, { min: -1.2, max: 1.2, color: col, background: false });
        const lowerMax = Math.max(...lowerHist);
        const armRange = armHist.length ? Math.max(...armHist) - Math.min(...armHist) : 0;
        ctx.stat(GTL.L('하체 차이 (기본 동작 대비, 2.5초 최대)', 'Lower body difference (vs base motion, 2.5 s max)'), U.deg(lowerMax).toFixed(1) + '°');
        ctx.stat(GTL.L('팔 흔들기 폭 (피격 제외)', 'Arm swing range (hits excluded)'), U.deg(armRange).toFixed(0) + '°');
        ctx.stat(GTL.L('피격 레이어', 'Hit layer'), hitT >= 0 ? GTL.L(`재생 중 ${(hitT * 1000).toFixed(0)} ms`, `Playing ${(hitT * 1000).toFixed(0)} ms`) : GTL.L('대기', 'Idle'));
      },
    };
  },
});
