// 룩앳(Look At): 머리만 회전 vs 척추, 목, 머리에 회전을 나눠 주고 각도와 속도를 제한.
GTL.register({
  id: 'look-at-spine',
  title: '룩앳: 머리만 회전 vs 척추 분산 + 각도 제한',
  summary: '목표를 바라보게 할 때 머리 관절만 돌리면 목이 비정상적으로 꺾이고, 목표가 뒤로 넘어가면 머리가 한 프레임에 반대로 뒤집힘. 척추부터 머리까지 회전을 나누고 각도와 회전 속도를 제한하면 자연스러워짐.',
  views: { a: '머리만, 제한 없음', b: '척추 분산 + 제한' },
  controls: '마우스를 뷰 위에 올리면 목표가 마우스를 따라감. 마우스가 밖에 있으면 목표가 자동으로 캐릭터 주위를 돎.',
  info: `
    <p><b>룩앳(Look At)</b>은 재생 중인 애니메이션 위에 회전을 더해 캐릭터가 목표를 바라보게 하는 절차적 애니메이션. 총구 방향을 맞추는 <b>에임 오프셋(Aim Offset)</b>도 같은 문제를 다룸.</p>
    <p>머리 관절만 돌리면 쉽지만 문제가 셋 있음.</p>
    <ul>
      <li>목 한 곳에 회전이 몰려 꺾임이 보임.</li>
      <li>목표가 뒤로 가면 회전이 180°를 넘어 반대쪽으로 뒤집힘.</li>
      <li>목표가 순간 이동하면 머리도 한 프레임에 돌아감.</li>
    </ul>
    <p>해결: 회전을 척추, 가슴, 목, 머리에 가중치로 나눔(Unity <code>SetLookAtWeight</code>의 body, head 가중치와 같은 생각). 전체 각도를 제한하고, 회전 속도에 상한을 둠.</p>
    <p>단점: 가중치와 제한값은 캐릭터마다 손으로 맞춰야 함. 제한 밖의 목표를 어떻게 처리할지(멈춤, 정면 복귀)도 정해야 함.</p>`,
  // 도식: 같은 목표 각도(70°)를 머리 하나가 받는 A vs 척추, 가슴, 목, 머리에 나눈 B. 아래는 목표 각도 축에서 A의 뒤집힘과 B의 제한 범위
  diagram: (L) => {
    const theta = -70, SEG = [26, 26, 12];
    const fig = (px, py, w, cls) => {
      const rot = w.map((k) => k * theta * Math.PI / 180), pts = [[px, py]];
      let a = -Math.PI / 2, x = px, y = py;
      for (let i = 0; i < 3; i++) { a += rot[i]; x += Math.cos(a) * SEG[i]; y += Math.sin(a) * SEG[i]; pts.push([x, y]); }
      const hc = [x + Math.cos(a) * 11, y + Math.sin(a) * 11], hA = theta * Math.PI / 180;
      const f = (n) => n.toFixed(1);
      let s = pts.slice(0, 3).map((p, i) => `<line x1="${f(p[0])}" y1="${f(p[1])}" x2="${f(pts[i + 1][0])}" y2="${f(pts[i + 1][1])}" class="${cls}" stroke-width="${i === 2 ? 3 : 5}"/>`).join('');
      s += w.map((k, i) => { const p = pts[Math.min(i, 3)], deg = Math.abs(k * theta); return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(2.5 + deg * 0.12)}" class="${deg > 60 ? 'f-bad' : 'f-accent'}"/>`; }).join('');
      s += `<circle cx="${f(hc[0])}" cy="${f(hc[1])}" r="10" class="${cls}"/>`;
      s += `<line x1="${f(hc[0])}" y1="${f(hc[1])}" x2="${f(hc[0] + Math.cos(hA) * 62)}" y2="${f(hc[1] + Math.sin(hA) * 62)}" class="d-dim" stroke-dasharray="3 3"/>`;
      s += `<circle cx="${f(hc[0] + Math.cos(hA) * 66)}" cy="${f(hc[1] + Math.sin(hA) * 66)}" r="5" class="d-accent"/>`;
      return s;
    };
    const ax = (deg) => (270 + deg * 210 / 180).toFixed(1);
    return `<svg viewBox="0 0 540 224" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arrL" class="m-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    ${fig(120, 142, [0, 0, 0, 1], 'd-a')}
    ${fig(390, 142, [0.2, 0.3, 0.2, 0.3], 'd-b')}
    <text x="120" y="160" text-anchor="middle" class="t-small t-a">${L('A: 머리 관절 혼자 70°', 'A: head joint alone, 70°')}</text>
    <text x="390" y="160" text-anchor="middle" class="t-small t-b">${L('B: 척추 14°, 가슴 21°, 목 14°, 머리 21°', 'B: spine 14°, chest 21°, neck 14°, head 21°')}</text>
    <rect x="${ax(-110)}" y="183" width="${(220 * 210 / 180).toFixed(1)}" height="10" class="f-b" opacity="0.25"/>
    <line x1="${ax(-180)}" y1="188" x2="${ax(180)}" y2="188" class="d-dim"/>
    ${[-180, -110, 0, 110, 180].map((d) => `<line x1="${ax(d)}" y1="184" x2="${ax(d)}" y2="192" class="d-dim"/><text x="${ax(d)}" y="203" text-anchor="middle" class="t-small t-mono t-dim">${d}°</text>`).join('')}
    <path d="M${ax(172)},182 Q270,158 ${ax(-172)},182" class="d-a" marker-end="url(#arrL)"/>
    <text x="20" y="219" class="t-small t-a">${L('A: 목표가 뒤로 180°를 넘으면 한 프레임에 반대로 뒤집힘', 'A: when the target passes 180° behind, it flips in one frame')}</text>
    <text x="520" y="219" text-anchor="end" class="t-small t-b">${L('B: ±최대 각도에서 멈춤', 'B: stops at ±max angle')}</text>
  </svg>`;
  },
  look: [
    '목표가 캐릭터 뒤로 넘어갈 때 A의 머리가 한 프레임에 반대로 뒤집힘. "최대 머리 회전" 값이 360° 가까이 나옴. B는 제한 각도에서 멈춤.',
    '"목 꺾임" 값을 비교하면 목표가 뒤에 있을 때 A는 150° 이상, B는 60° 아래에 머묾.',
    'B의 "회전 분산"을 "머리만"으로 바꾸면 각도 제한이 있어도 목만 꺾여 부자연스러움.',
    'B의 "범위 밖이면 정면 복귀"를 켜면 뒤쪽 목표를 포기하고 정면을 봄. 경비병 AI처럼 보임.',
  ],
  refs: [
    { type: 'engine', title: 'Unity Scripting API - Animator.SetLookAtWeight', url: 'https://docs.unity3d.com/ScriptReference/Animator.SetLookAtWeight.html', note: 'bodyWeight, headWeight, eyesWeight, clampWeight로 회전을 몸과 머리에 나눔.' },
    { type: 'engine', title: 'Unreal Engine - Aim Offset', note: '조준 방향(yaw, pitch)에 따라 애디티브 포즈를 섞는 블렌드 스페이스.' },
    { type: 'engine', title: 'Unreal Engine - Look At (Animation Blueprint node)', note: 'Look At Clamp로 최대 각도를 제한.' },
  ],
  params: [
    { key: 'dist', label: '회전 분산', type: 'select', group: '룩앳', options: [
      { value: 'head', label: '머리만' },
      { value: 'spine', label: '척추, 가슴, 목, 머리 분산' },
    ], a: 'head', b: 'spine' },
    { key: 'limit', label: '각도 제한', type: 'bool', a: false, b: true },
    { key: 'maxAngle', label: '최대 각도 (°)', type: 'range', min: 30, max: 170, step: 1, default: 110, when: (p) => p.limit },
    { key: 'returnOut', label: '범위 밖이면 정면 복귀', type: 'bool', default: false, when: (p) => p.limit },
    { key: 'turnSpeed', label: '최대 회전 속도 (°/s, 0은 즉시)', type: 'range', min: 0, max: 720, step: 10, a: 0, b: 300 },
    { key: 'orbit', label: '자동 목표 속도', type: 'range', min: 0.1, max: 2, step: 0.05, default: 0.6, shared: true, group: '장면' },
  ],
  en: {
    title: 'Look At: Head Only vs Spread Over Spine + Angle Limit',
    summary: 'If you turn only the head joint to face a target, the neck bends unnaturally. When the target moves behind, the head flips the other way in one frame. Spread the rotation from the spine to the head, and limit the angle and turn speed, and it looks natural.',
    views: { a: 'Head only, no limit', b: 'Spread over spine + limit' },
    controls: 'Move the mouse over the view and the target follows it. When the mouse is outside, the target circles the character on its own.',
    info: `
    <p><b>Look At</b> is procedural animation that adds rotation on top of the playing animation so the character faces a target. An <b>Aim Offset</b>, which points a gun, deals with the same problem.</p>
    <p>Turning only the head joint is easy, but it has three problems.</p>
    <ul>
      <li>All the rotation piles up in the neck, so you see a sharp bend.</li>
      <li>When the target goes behind, the rotation passes 180° and flips to the other side.</li>
      <li>When the target teleports, the head turns in one frame too.</li>
    </ul>
    <p>The fix: split the rotation over the spine, chest, neck, and head with weights (the same idea as the body and head weights in Unity <code>SetLookAtWeight</code>). Limit the total angle, and cap the turn speed.</p>
    <p>Downside: you must tune the weights and limits by hand for each character. You also need to decide what to do with targets outside the limit (stop, or return to the front).</p>`,
    look: [
      'When the target passes behind the character, A\'s head flips the other way in one frame. The "Max head turn" value gets close to 360°. B stops at the limit angle.',
      'Compare the "Neck bend" values. With the target behind, A goes past 150°, while B stays under 60°.',
      'Change B\'s "Rotation spread" to "Head only". Even with the angle limit, only the neck bends, and it looks unnatural.',
      'Turn on B\'s "Face front when out of range". It gives up on targets behind it and looks forward. It looks like guard AI.',
    ],
    refs: [
      'bodyWeight, headWeight, eyesWeight, and clampWeight split the rotation between the body and the head.',
      'A blend space that mixes additive poses by aim direction (yaw, pitch).',
      'Look At Clamp limits the max angle.',
    ],
    params: {
      dist: { label: 'Rotation spread', group: 'Look at', options: { head: 'Head only', spine: 'Spread over spine, chest, neck, head' } },
      limit: 'Angle limit',
      maxAngle: 'Max angle (°)',
      returnOut: 'Face front when out of range',
      turnSpeed: 'Max turn speed (°/s, 0 is instant)',
      orbit: { label: 'Auto target speed', group: 'Scene' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const SEG = [34, 34, 16];                     // 척추, 가슴, 목 길이
    const W_SPINE = [0.2, 0.3, 0.2, 0.3];       // 척추, 가슴, 목, 머리
    const W_HEAD = [0, 0, 0, 1];
    let cur = [0, 0, 0, 0], tgt = { x: 0, y: 0 }, autoT = 0, prevHead = 0, maxFlip = 0, flipHist = [];
    const layout = () => ({ px: ctx.width * 0.45, py: ctx.height * 0.62 });

    function chain(rot) {
      const { px, py } = layout();
      const pts = [{ x: px, y: py }];
      let a = -Math.PI / 2, x = px, y = py;
      for (let i = 0; i < 3; i++) { a += rot[i]; x += Math.cos(a) * SEG[i]; y += Math.sin(a) * SEG[i]; pts.push({ x, y }); }
      const headA = rot[0] + rot[1] + rot[2] + rot[3];  // 정면(오른쪽) 기준 머리 방향
      const hc = { x: x + Math.cos(a) * 14, y: y + Math.sin(a) * 14 };
      return { pts, hc, headA, neckBend: rot[2] + rot[3] };
    }

    return {
      update(dt) {
        const m = ctx.input.mouse, { px, py } = layout();
        autoT += dt * P.orbit;
        if (m.inside) tgt = { x: m.x, y: m.y };
        else tgt = { x: px + Math.cos(autoT) * 190, y: py - 90 + Math.sin(autoT * 1.7) * 90 };
        // 쉬는 자세의 머리 중심에서 본 목표 방향 (오른쪽이 0)
        const rest = chain([0, 0, 0, 0]).hc;
        let theta = Math.atan2(tgt.y - rest.y, tgt.x - rest.x);
        let out = false;
        if (P.limit) {
          const lim = U.rad(P.maxAngle);
          if (Math.abs(theta) > lim) { out = true; theta = P.returnOut ? 0 : U.clamp(theta, -lim, lim); }
        }
        const w = P.dist === 'spine' ? W_SPINE : W_HEAD;
        const step = U.rad(P.turnSpeed) * dt;
        for (let i = 0; i < 4; i++) {
          const want = w[i] * theta;
          cur[i] = P.turnSpeed <= 0 ? want : U.approach(cur[i], want, step * Math.max(w[i], 0.05) / Math.max(...w));
        }
        const c = chain(cur);
        const flip = Math.abs(c.headA - prevHead);
        prevHead = c.headA;
        flipHist.push(flip); if (flipHist.length > 240) flipHist.shift();
        maxFlip = Math.max(...flipHist);
        this.out = out;
      },
      render() {
        const g = ctx.g, Wd = ctx.width, H = ctx.height, col = ctx.side === 'a' ? C.a : C.b;
        const { px, py } = layout();
        D.grid(g, Wd, H, 40);
        D.line(g, 0, py + 92, Wd, py + 92, C.dim, 2);
        const c = chain(cur);
        // 허용 범위 부채꼴
        if (P.limit) {
          const lim = U.rad(P.maxAngle);
          g.beginPath(); g.moveTo(c.hc.x, c.hc.y); g.arc(c.hc.x, c.hc.y, 70, -lim, lim); g.closePath();
          g.fillStyle = 'rgba(102,209,122,0.08)'; g.fill();
        }
        // 다리, 엉덩이
        D.line(g, px, py, px - 8, py + 46, 'rgba(255,255,255,0.35)', 5); D.line(g, px - 8, py + 46, px - 4, py + 92, 'rgba(255,255,255,0.35)', 5);
        D.line(g, px, py, px + 8, py + 46, col, 5); D.line(g, px + 8, py + 46, px + 6, py + 92, col, 5);
        // 척추 사슬. 관절 원 크기로 회전량 표시
        for (let i = 0; i < 3; i++) D.line(g, c.pts[i].x, c.pts[i].y, c.pts[i + 1].x, c.pts[i + 1].y, col, i === 2 ? 4 : 7);
        for (let i = 0; i < 4; i++) {
          const p = i < 3 ? c.pts[i] : c.pts[3];
          const r = 3 + Math.abs(U.deg(cur[i])) * 0.12;
          D.circle(g, p.x, p.y, r, Math.abs(U.deg(cur[i])) > 60 ? C.bad : C.warn);
        }
        // 팔 (가슴에서)
        const sh = c.pts[2];
        D.line(g, sh.x, sh.y, sh.x + 14, sh.y + 30, col, 4); D.line(g, sh.x + 14, sh.y + 30, sh.x + 30, sh.y + 40, col, 4);
        // 머리와 시선
        D.circle(g, c.hc.x, c.hc.y, 14, '#20242c', col, 3);
        const eye = { x: c.hc.x + Math.cos(c.headA) * 8, y: c.hc.y + Math.sin(c.headA) * 8 };
        D.circle(g, eye.x, eye.y, 3, '#fff');
        const dl = Math.hypot(tgt.x - c.hc.x, tgt.y - c.hc.y);
        D.line(g, c.hc.x, c.hc.y, c.hc.x + Math.cos(c.headA) * dl, c.hc.y + Math.sin(c.headA) * dl, 'rgba(255,255,255,0.4)', 1);
        D.line(g, c.hc.x, c.hc.y, tgt.x, tgt.y, 'rgba(255,203,107,0.25)', 1);
        D.circle(g, tgt.x, tgt.y, 8, null, this.out ? C.bad : C.warn, 2);
        D.plot(g, flipHist.map(U.deg), 12, H - 70, Wd - 24, 56, { min: 0, max: 30, color: col, label: GTL.L('머리 방향 변화 (°/프레임)', 'Head direction change (°/frame)') });
        const err = Math.abs(U.angleDiff(c.headA, Math.atan2(tgt.y - c.hc.y, tgt.x - c.hc.x)));
        ctx.stat(GTL.L('목 꺾임 (목 + 머리)', 'Neck bend (neck + head)'), Math.abs(U.deg(c.neckBend)).toFixed(0) + '°');
        ctx.stat(GTL.L('시선 오차', 'Gaze error'), U.deg(err).toFixed(0) + '°');
        ctx.stat(GTL.L('최대 머리 회전 (4초)', 'Max head turn (4 s)'), U.deg(maxFlip).toFixed(1) + GTL.L('° / 프레임', '° / frame'));
      },
    };
  },
});
