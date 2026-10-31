// 모션 워핑: 정해진 거리로 만든 공격 클립의 루트 모션을 워프 구간 안에서 늘리고 돌려 타격 프레임을 목표에 맞춤
GTL.register({
  id: 'motion-warping',
  title: '모션 워핑 (Unreal Motion Warping)',
  summary: '돌진 공격 클립은 정해진 거리만큼만 이동하게 만들어짐. 루트 모션을 그대로 쓰면 적이 멀거나 가까울 때 타격 프레임이 빗나감. 모션 워핑은 워프 구간 안의 루트 모션을 늘리고 돌려 타격 프레임이 목표 지점에 정확히 닿게 함.',
  views: { a: '루트 모션 그대로', b: '모션 워핑' },
  controls: '조작 없음. 캐릭터가 적을 향해 돌진 공격을 반복. 위에서 내려다본 장면.',
  info: `
    <p><b>모션 워핑(Motion Warping)</b>은 애니메이션의 루트 모션을 실행 중에 고쳐 정해진 목표(warp target)에 도달하게 하는 기법. Unreal의 Motion Warping 플러그인이 대표적. Unity의 Target Matching(<code>Animator.MatchTarget</code>)도 같은 목적.</p>
    <p>애니메이터는 돌진 공격, 뛰어넘기 같은 클립을 한 가지 거리로 만듦. 실제 게임에서 적과 장애물의 거리는 매번 다름. 루트 모션을 그대로 쓰면 타격 프레임(contact frame)에 캐릭터가 목표 앞에서 멈추거나 지나침.</p>
    <p>동작 원리:</p>
    <ul>
      <li>클립 타임라인에 <b>워프 구간</b>을 표시 (Unreal에서는 Motion Warping 노티파이 스테이트). 구간 끝을 타격 프레임에 맞춤.</li>
      <li>게임 코드가 매 공격마다 워프 목표(위치, 회전)를 등록</li>
      <li>구간 안에서 매 프레임 "구간 끝까지 남은 원래 루트 이동"과 "목표까지 남은 거리"를 비교. 두 벡터를 맞추는 배율과 회전으로 이번 프레임 이동량을 고침. Unreal의 Skew Warp도 남은 이동을 목표에 맞춰 변형하는 방식.</li>
      <li>회전 워핑은 남은 구간 시간 동안 캐릭터 방향을 목표 쪽으로 나눠 돌림</li>
      <li>구간 밖의 루트 모션은 원래 그대로 씀. 그래서 예비 동작과 마무리 동작의 느낌이 유지됨.</li>
    </ul>
    <p>단점: 목표가 원래 거리와 너무 다르면 발이 크게 미끄러짐. 그래서 워핑 배율 한도를 두거나 거리별로 클립을 여러 개 만들어 고름.</p>`,
  // 도식: 타임라인 위의 워프 구간과 그 안에서만 늘어난 루트 이동 거리
  diagram: (L) => `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
    <line x1="60" y1="150" x2="520" y2="150" class="d-dim"/>
    <line x1="60" y1="150" x2="60" y2="16" class="d-dim"/>
    <text x="56" y="20" text-anchor="end" class="t-small t-dim">${L('이동', 'dist')}</text>
    <text x="520" y="164" text-anchor="end" class="t-small t-dim">${L('클립 시간', 'clip time')}</text>
    <rect x="130" y="16" width="160" height="134" class="f-accent" opacity="0.15"/>
    <text x="210" y="178" text-anchor="middle" class="t-small">${L('워프 구간', 'warp window')}</text>
    <line x1="130" y1="168" x2="290" y2="168" class="d-accent"/>
    <line x1="290" y1="12" x2="290" y2="170" class="d-good" stroke-dasharray="4 3"/>
    <text x="294" y="190" class="t-small">${L('타격 프레임 = 구간 끝', 'contact frame = window end')}</text>
    <path d="M60,150 C90,152 110,148 130,142 C180,128 240,100 290,92 C340,86 400,84 520,84" class="d-a"/>
    <path d="M60,150 C90,152 110,148 130,142 C180,110 240,50 290,36 C340,30 400,28 520,28" class="d-b"/>
    <line x1="60" y1="92" x2="290" y2="92" class="d-a" stroke-dasharray="2 3" opacity="0.6"/>
    <line x1="60" y1="36" x2="290" y2="36" class="d-b" stroke-dasharray="2 3" opacity="0.6"/>
    <text x="64" y="88" class="t-small t-a">${L('클립의 원래 거리', 'authored distance')}</text>
    <text x="64" y="32" class="t-small t-b">${L('목표까지 거리', 'distance to target')}</text>
    <text x="330" y="116" class="t-small t-a">${L('A: 원래 루트 모션', 'A: authored root motion')}</text>
    <text x="330" y="56" class="t-small t-b">${L('B: 구간 안 이동만 늘림', 'B: only window motion scaled')}</text>
    <text x="330" y="140" class="t-small t-dim">${L('배율 = 남은 목표 거리 / 남은 원래 거리', 'scale = target left / authored left')}</text>
  </svg>`,
  look: [
    'A는 적이 멀 때 타격 프레임에서 빈 공간을 벰(빨간 호). B는 거리가 달라도 항상 목표 지점에서 벰(초록 호).',
    '"목표 각도"를 40도 이상으로 올리고 B의 "회전 워핑"을 끄면 위치는 맞지만 엉뚱한 방향을 벰. 켜면 몸이 적을 향함.',
    'B의 "워프 구간 끝"을 타격 프레임(초록 세로선)보다 뒤로 밀면 타격 순간에 아직 목표에 못 미침. 구간 끝이 타격 프레임과 같아야 함.',
    '"목표 거리"를 원래 거리(180)로, "목표 각도"와 "공격마다 목표 흔들기"를 0으로 두면 A와 B가 같음. 거리를 멀리 둘수록 B의 이동 속도 그래프가 구간 안에서만 커짐.',
  ],
  refs: [
    { type: 'engine', title: 'Unreal Engine - Motion Warping', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/motion-warping-in-unreal-engine', note: 'Motion Warping 컴포넌트, 노티파이 스테이트, Skew Warp, 워프 목표 등록' },
    { type: 'engine', title: 'Unity Manual - Target Matching', url: 'https://docs.unity3d.com/Manual/TargetMatching.html', note: 'Animator.MatchTarget으로 정해진 구간에서 신체 부위를 목표 위치에 맞춤' },
    { type: 'engine', title: 'Unreal Engine - Root Motion', note: '모션 워핑이 고치는 대상인 루트 모션의 동작 방식' },
  ],
  params: [
    { key: 'warp', label: '모션 워핑', type: 'bool', group: '워핑', a: false, b: true, default: false },
    { key: 'wStart', label: '워프 구간 시작', type: 'range', min: 0, max: 0.6, step: 0.01, default: 0.12, when: (p) => p.warp, help: '클립 시간 비율 (0~1)' },
    { key: 'wEnd', label: '워프 구간 끝', type: 'range', min: 0.2, max: 0.9, step: 0.01, default: 0.5, when: (p) => p.warp, help: '타격 프레임(0.5)과 같게 두는 것이 기본' },
    { key: 'warpT', label: '위치 워핑', type: 'bool', default: true, when: (p) => p.warp },
    { key: 'warpR', label: '회전 워핑', type: 'bool', default: true, when: (p) => p.warp, help: '구간 동안 캐릭터 방향을 목표 쪽으로 돌림' },
    { key: 'dist', label: '목표 거리 (px)', type: 'range', min: 80, max: 360, step: 1, default: 290, shared: true, group: '목표', help: '클립의 원래 돌진 거리는 180' },
    { key: 'angle', label: '목표 각도 (도)', type: 'range', min: -60, max: 60, step: 1, default: 20, shared: true },
    { key: 'jitter', label: '공격마다 목표 흔들기', type: 'range', min: 0, max: 1, step: 0.01, default: 0.4, shared: true, help: '매 공격마다 거리와 각도를 무작위로 바꿈 (두 뷰 같음)' },
  ],
  en: {
    title: 'Motion Warping (Unreal Motion Warping)',
    summary: 'A lunge attack clip is made to travel one fixed distance. With plain root motion, the contact frame misses when the enemy is farther or closer. Motion warping stretches and turns the root motion inside a warp window, so the contact frame lands exactly on the target.',
    views: { a: 'Plain root motion', b: 'Motion warping' },
    controls: 'No input. The character repeats a lunge attack toward the enemy. Top-down view.',
    info: `
    <p><b>Motion warping</b> changes an animation's root motion at runtime so it reaches a given target (warp target). Unreal's Motion Warping plugin is the best known example. Unity's Target Matching (<code>Animator.MatchTarget</code>) has the same goal.</p>
    <p>Animators make clips like lunge attacks and vaults for one distance. In a real game, enemies and obstacles are at a different distance every time. With plain root motion, the character stops short of the target or overshoots it at the contact frame.</p>
    <p>How it works:</p>
    <ul>
      <li>Mark a <b>warp window</b> on the clip timeline (a Motion Warping notify state in Unreal). Its end sits on the contact frame.</li>
      <li>Game code registers the warp target (location, rotation) for every attack.</li>
      <li>Inside the window, every frame compares "authored root motion left until the window end" with "distance left to the target". The scale and rotation that match these two vectors change this frame's motion. Unreal's Skew Warp also reshapes the remaining motion to fit the target.</li>
      <li>Rotation warping turns the character toward the target, spread over the remaining window time.</li>
      <li>Root motion outside the window stays as authored, so the anticipation and follow-through keep their feel.</li>
    </ul>
    <p>Downside: if the target is very far from the authored distance, the feet slide a lot. So games cap the warp scale or pick from several clips made for different distances.</p>`,
    look: [
      'When the enemy is far, A slashes empty air at the contact frame (red arc). B always slashes at the target point, whatever the distance (green arc).',
      'Raise "Target angle" above 40 degrees and turn off "Rotation warp" in B. The position is right, but the slash goes the wrong way. Turn it on and the body faces the enemy.',
      'Move B\'s "Warp window end" past the contact frame (green vertical line). At the moment of contact the character has not reached the target yet. The window end must match the contact frame.',
      'Set "Target distance" to the authored distance (180), and "Target angle" and "Target shake per attack" to 0. A and B are the same. The farther you set the distance, the more B\'s speed graph grows, only inside the window.',
    ],
    refs: [
      'Motion Warping component, notify state, Skew Warp, registering warp targets.',
      'Animator.MatchTarget moves a body part to a target position during a given time range.',
      'How root motion works, which is what motion warping modifies.',
    ],
    params: {
      warp: { label: 'Motion warping', group: 'Warping' },
      wStart: { label: 'Warp window start', help: 'Fraction of clip time (0~1)' },
      wEnd: { label: 'Warp window end', help: 'Keep it equal to the contact frame (0.5) by default' },
      warpT: 'Translation warp',
      warpR: { label: 'Rotation warp', help: 'Turn the character toward the target during the window' },
      dist: { label: 'Target distance (px)', group: 'Target', help: 'The authored lunge distance of the clip is 180' },
      angle: 'Target angle (deg)',
      jitter: { label: 'Target shake per attack', help: 'Changes distance and angle at random on every attack (same in both views)' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const CLIP_T = 1.4, CONTACT = 0.5, D0 = 180, REACH = 34, IDLE = 0.5, HOLD = 0.7;
    // 클립의 루트 전진 거리 (로컬 x). 예비 동작으로 살짝 물러난 뒤 돌진, 타격 후 조금 더 밀려 나감
    function authX(u) {
      if (u < 0.12) return -8 * U.ease.inOutSine(u / 0.12);
      if (u < CONTACT) return U.lerp(-8, D0, U.ease.inOutCubic((u - 0.12) / (CONTACT - 0.12)));
      if (u < 0.75) return D0 + 26 * U.ease.outCubic((u - CONTACT) / 0.25);
      return D0 + 26;
    }
    let state, t, pos, yaw, trail, lastTrail, tgt, enemy, contact, hits, tries, errHist, speedHist, prevU;

    function newAttack() {
      const j = P.jitter;
      const d = U.clamp(P.dist + (ctx.rng.range(0, 1) * 2 - 1) * 80 * j, 60, 400);
      const a = U.rad(P.angle + (ctx.rng.range(0, 1) * 2 - 1) * 25 * j);
      enemy = { x: Math.cos(a) * (d + REACH), y: Math.sin(a) * (d + REACH) };
      tgt = { x: Math.cos(a) * d, y: Math.sin(a) * d, yaw: a };
      pos = { x: 0, y: 0 }; yaw = 0; t = 0; state = 'idle'; prevU = 0;
      if (trail && trail.length) lastTrail = trail;
      trail = [{ ...pos }]; contact = null; speedHist = [];
    }
    const init = () => {
      ctx.rng = U.rng(ctx.seed);
      trail = null; lastTrail = []; hits = 0; tries = 0; errHist = [];
      newAttack();
    };
    init();

    function stepClip(u0, u1, dt) {
      // 원래 루트 모션의 이번 프레임 이동 (로컬 x만)
      const dLocal = authX(u1) - authX(u0);
      let dx = Math.cos(yaw) * dLocal, dy = Math.sin(yaw) * dLocal;
      const inWin = P.warp && u0 >= P.wStart - 1e-9 && u0 < P.wEnd;
      if (inWin) {
        const left = P.wEnd - u0;
        if (P.warpR) {
          // 남은 구간 시간에 비례해 방향을 목표 쪽으로 나눠 돌림
          const f = Math.min(1, (u1 - u0) / left);
          yaw += U.angleDiff(yaw, tgt.yaw) * f;
          dx = Math.cos(yaw) * dLocal; dy = Math.sin(yaw) * dLocal;
        }
        if (P.warpT) {
          const uE = Math.min(P.wEnd, u1);
          const remA = authX(P.wEnd) - authX(u0); // 구간 끝까지 남은 원래 이동 (로컬)
          const rx = Math.cos(yaw) * remA, ry = Math.sin(yaw) * remA;
          const wx = tgt.x - pos.x, wy = tgt.y - pos.y;
          const rl = Math.hypot(rx, ry);
          if (rl > 1e-3) {
            // 남은 원래 이동 벡터를 목표까지의 벡터로 보내는 배율 + 회전을 이번 이동에 적용
            const s = Math.hypot(wx, wy) / rl, rot = Math.atan2(wy, wx) - Math.atan2(ry, rx);
            const part = authX(uE) - authX(u0), px = Math.cos(yaw) * part, py = Math.sin(yaw) * part;
            const c = Math.cos(rot) * s, sn = Math.sin(rot) * s;
            let ox = px * c - py * sn, oy = px * sn + py * c;
            // 구간 끝을 넘는 나머지는 원래대로
            const rest = dLocal - part;
            ox += Math.cos(yaw) * rest; oy += Math.sin(yaw) * rest;
            dx = ox; dy = oy;
          }
        }
      }
      pos.x += dx; pos.y += dy;
      speedHist.push({ u: u1, v: Math.hypot(dx, dy) / dt });
    }

    return {
      update(dt) {
        t += dt;
        if (state === 'idle' && t >= IDLE) { state = 'clip'; t = 0; tries++; }
        else if (state === 'clip') {
          const u = Math.min(1, t / CLIP_T);
          stepClip(prevU, u, dt);
          if (prevU < CONTACT && u >= CONTACT) {
            const err = Math.hypot(pos.x - tgt.x, pos.y - tgt.y);
            const toE = Math.atan2(enemy.y - pos.y, enemy.x - pos.x), dE = Math.hypot(enemy.x - pos.x, enemy.y - pos.y);
            const face = Math.abs(U.deg(U.angleDiff(yaw, toE)));
            const hit = face < 30 && dE < REACH + 22 && dE > 8;
            contact = { x: pos.x, y: pos.y, yaw, err, face, hit, t: 0 };
            if (hit) hits++;
            errHist.push(err); if (errHist.length > 20) errHist.shift();
          }
          prevU = u;
          trail.push({ ...pos });
          if (u >= 1) { state = 'hold'; t = 0; }
        } else if (state === 'hold' && t >= HOLD) newAttack();
        if (contact) contact.t += dt;
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height, col = ctx.side === 'a' ? C.a : C.b;
        const tlH = 64, k = Math.min(1.2, (W * 0.8) / 470, (H - tlH - 40) / 360);
        const ox = W * 0.1, oy = (H - tlH) * 0.5;
        const S = (p) => ({ x: ox + p.x * k, y: oy + p.y * k });
        D.grid(g, W, H - tlH, 40);
        // 원래 경로 (시작 방향 그대로)
        const a0 = S({ x: authX(0.12), y: 0 }), a1 = S({ x: D0 + 26, y: 0 });
        g.setLineDash([5, 5]); D.line(g, a0.x, a0.y, a1.x, a1.y, 'rgba(255,255,255,0.35)', 1.5); g.setLineDash([]);
        const ac = S({ x: D0, y: 0 });
        D.circle(g, ac.x, ac.y, 4, null, 'rgba(255,255,255,0.5)', 1.5);
        D.text(g, GTL.L('원래 타격 지점', 'Authored contact'), ac.x - 30, ac.y + 10, { size: 10, color: C.dim });
        // 적과 워프 목표
        const e = S(enemy), tg = S(tgt);
        D.circle(g, e.x, e.y, 16, 'rgba(255,83,112,0.25)', C.bad, 2);
        D.text(g, GTL.L('적', 'Enemy'), e.x + 20, e.y - 6, { size: 11, color: C.bad });
        D.line(g, tg.x - 6, tg.y - 6, tg.x + 6, tg.y + 6, C.accent, 2); D.line(g, tg.x - 6, tg.y + 6, tg.x + 6, tg.y - 6, C.accent, 2);
        if (P.warp) D.text(g, GTL.L('워프 목표', 'Warp target'), tg.x - 20, tg.y + 12, { size: 10, color: C.accent });
        // 경로
        if (lastTrail.length > 1) D.poly(g, lastTrail.map(S), null, 'rgba(255,255,255,0.15)', 1.5, false);
        if (trail.length > 1) D.poly(g, trail.map(S), null, col, 2, false);
        // 타격 호
        if (contact && contact.t < 1.6) {
          const c = S(contact), r = (REACH + 22) * k, al = 1 - contact.t / 1.6;
          g.globalAlpha = Math.max(0.15, al);
          g.beginPath(); g.moveTo(c.x, c.y); g.arc(c.x, c.y, r, contact.yaw - 0.5, contact.yaw + 0.5); g.closePath();
          g.fillStyle = contact.hit ? 'rgba(102,209,122,0.35)' : 'rgba(255,83,112,0.35)'; g.fill();
          g.globalAlpha = 1;
        }
        // 캐릭터
        const p = S(pos);
        D.circle(g, p.x, p.y, 13, '#20242c', col, 3);
        D.line(g, p.x, p.y, p.x + Math.cos(yaw) * 22, p.y + Math.sin(yaw) * 22, col, 3);

        // 타임라인: 클립 시간, 워프 구간, 타격 프레임, 이동 속도
        const tx = 12, tw = W - 24, ty = H - tlH + 4, th = tlH - 12;
        D.rect(g, tx, ty, tw, th, 'rgba(0,0,0,0.35)');
        if (P.warp) D.rect(g, tx + P.wStart * tw, ty, (P.wEnd - P.wStart) * tw, th, 'rgba(199,146,234,0.18)');
        // 원래 속도 곡선
        const N = 80, vmax = 900;
        g.beginPath();
        for (let i = 0; i <= N; i++) {
          const u = i / N, v = ((authX(Math.min(1, u + 0.005)) - authX(Math.max(0, u - 0.005))) / (0.01 * CLIP_T));
          const x = tx + u * tw, y = ty + th - U.clamp(Math.abs(v) / vmax, 0, 1) * (th - 12);
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1; g.stroke();
        if (speedHist.length > 1) {
          g.beginPath();
          speedHist.forEach((s, i) => { const x = tx + s.u * tw, y = ty + th - U.clamp(s.v / vmax, 0, 1) * (th - 12); i ? g.lineTo(x, y) : g.moveTo(x, y); });
          g.strokeStyle = col; g.lineWidth = 1.5; g.stroke();
        }
        const cxl = tx + CONTACT * tw;
        D.line(g, cxl, ty, cxl, ty + th, C.good, 1.5);
        if (state === 'clip') { const px = tx + Math.min(1, t / CLIP_T) * tw; D.line(g, px, ty, px, ty + th, '#ffffff', 1); }
        D.text(g, GTL.L('클립 타임라인: 루트 이동 속도 (흰색 원래, 색 실제), 보라 워프 구간, 초록 타격 프레임', 'Clip timeline: root speed (white authored, color actual), purple warp window, green contact'), tx + 4, ty + 2, { size: 10, color: C.dim });

        const avgErr = errHist.length ? errHist.reduce((a, b) => a + b, 0) / errHist.length : 0;
        ctx.stat(GTL.L('타격 순간 목표 오차', 'Contact error'), contact ? contact.err.toFixed(1) + ' px' : '-');
        ctx.stat(GTL.L('타격 순간 방향 오차', 'Facing error at contact'), contact ? contact.face.toFixed(0) + '°' : '-');
        ctx.stat(GTL.L('평균 목표 오차', 'Average contact error'), avgErr.toFixed(1) + ' px');
        ctx.stat(GTL.L('명중', 'Hits'), hits + ' / ' + tries);
      },
    };
  },
});
