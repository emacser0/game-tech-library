// 애니메이션 12원칙 중 게임에서 자주 쓰는 다섯 가지: 예비 동작, 찌그러짐과 늘어남, 호, 천천히 시작과 끝, 후속 동작과 overshoot
GTL.register({
  id: 'animation-principles',
  title: '애니메이션 원칙: 예비 동작, 스쿼시 & 스트레치, 후속 동작',
  summary: '같은 점프를 같은 타이밍으로 재생해도 애니메이션 원칙을 더하면 무게감과 생동감이 생김. 예비 동작(anticipation), 찌그러짐과 늘어남(squash & stretch), 호(arc), 천천히 시작과 끝(slow in/out), 후속 동작(follow-through)과 overshoot를 비교.',
  views: { a: '원칙 미적용', b: '원칙 적용' },
  controls: '조작 없음. 캐릭터가 두 발판 사이를 반복해서 점프. 두 뷰의 타이밍은 같음.',
  info: `
    <p>디즈니 애니메이터들이 정리한 <b>12가지 원칙</b>은 게임의 캐릭터와 UI 애니메이션에도 그대로 적용됨. 이 샘플은 그중 다섯 가지를 스위치로 하나씩 켜고 끔.</p>
    <ul>
      <li><b>예비 동작 (Anticipation)</b>: 점프 전에 반대 방향으로 웅크림. "곧 움직임"을 알려 줌. 게임에서는 적의 공격 예고(telegraph) 역할도 함.</li>
      <li><b>찌그러짐과 늘어남 (Squash &amp; Stretch)</b>: 빠르게 움직일 때 늘어나고 부딪칠 때 찌그러짐. 핵심은 <b>부피 보존</b>(sx × sy = 1).</li>
      <li><b>호 (Arcs)</b>: 생물은 직선이 아닌 곡선 궤적으로 움직임</li>
      <li><b>천천히 시작과 끝 (Slow In &amp; Slow Out)</b>: 출발과 도착 근처에서 감속. 정점에서 머무는 시간(hang time)이 생김.</li>
      <li><b>후속 동작 (Follow-Through) &amp; Overshoot</b>: 몸이 멈춰도 더듬이 같은 느슨한 부분은 늦게 따라오며 흔들림. 착지 찌그러짐은 목표를 지나쳤다가 돌아옴.</li>
    </ul>
    <p>점열(onion skin)은 같은 시간 간격으로 찍은 위치. 간격은 속도, 모양은 궤적을 나타냄.</p>`,
  // 도식: 한 번의 점프 구간(대기, 예비 동작, 공중, 착지)과 같은 시간 간격으로 찍은 위치. A는 직선 등속, B는 호와 감속, 형태 변화
  diagram: (L) => {
    const seg = [[L('대기', 'Hold'), 0.45], [L('예비 동작', 'Anticipation'), 0.3], [L('공중', 'Airborne'), 0.6], [L('착지', 'Landing'), 0.55]];
    let x = 20;
    const bars = seg.map(([name, d], i) => {
      const w = (d / 1.9) * 500, s = `<rect x="${x}" y="14" width="${w.toFixed(1)}" height="20" class="${i === 2 ? 'f-accent' : 'f-dim'}" opacity="${i === 2 ? 0.35 : 1}"/><text x="${(x + w / 2).toFixed(1)}" y="28" text-anchor="middle" class="t-small">${name}</text>`;
      x += w; return s;
    }).join('');
    const ioSine = (u) => -(Math.cos(Math.PI * u) - 1) / 2;
    const N = 8, us = Array.from({ length: N + 1 }, (_, i) => i / N);
    const a0 = [40, 178], a1 = [235, 138], b0 = [305, 178], b1 = [500, 138];
    const ptsA = us.map((u) => [a0[0] + (a1[0] - a0[0]) * u, a0[1] + (a1[1] - a0[1]) * u]);
    const ptsB = us.map((u) => {
      const w = u + (ioSine(u) - u) * 0.7, wx = u + (w - u) * 0.4;
      return [b0[0] + (b1[0] - b0[0]) * wx, b0[1] + (b1[1] - b0[1]) * w - 4 * 70 * w * (1 - w)];
    });
    const dots = (pts, cls) => pts.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${(p[1] - 10).toFixed(1)}" r="2.5" class="${cls}"/>`).join('');
    const mid = ptsB[4], prevB = ptsB[3], ang = (Math.atan2(mid[1] - prevB[1], mid[0] - prevB[0]) * 180 / Math.PI).toFixed(1);
    return `<svg viewBox="0 0 540 222" xmlns="http://www.w3.org/2000/svg">
    ${bars}
    <text x="20" y="48" class="t-small t-dim">${L('한 번의 점프 1.9초, 두 뷰의 구간 길이는 같음', 'One jump is 1.9 s. Both views use the same phase lengths')}</text>
    <line x1="15" y1="${a0[1]}" x2="70" y2="${a0[1]}" class="d-line"/><line x1="205" y1="${a1[1]}" x2="255" y2="${a1[1]}" class="d-line"/>
    <line x1="280" y1="${b0[1]}" x2="335" y2="${b0[1]}" class="d-line"/><line x1="470" y1="${b1[1]}" x2="525" y2="${b1[1]}" class="d-line"/>
    ${dots(ptsA, 'f-a')}${dots(ptsB, 'f-b')}
    <circle cx="${a0[0]}" cy="${a0[1] - 10}" r="10" class="f-a" opacity="0.6"/><circle cx="${ptsA[4][0]}" cy="${ptsA[4][1] - 10}" r="10" class="f-a" opacity="0.6"/><circle cx="${a1[0]}" cy="${a1[1] - 10}" r="10" class="f-a" opacity="0.6"/>
    <ellipse cx="${b0[0]}" cy="${b0[1] - 6}" rx="14" ry="6" class="f-b" opacity="0.6"/>
    <ellipse cx="${mid[0].toFixed(1)}" cy="${(mid[1] - 10).toFixed(1)}" rx="14" ry="7" class="f-b" opacity="0.6" transform="rotate(${ang} ${mid[0].toFixed(1)} ${(mid[1] - 10).toFixed(1)})"/>
    <ellipse cx="${b1[0]}" cy="${b1[1] - 6}" rx="14" ry="6" class="f-b" opacity="0.6"/>
    <text x="${b0[0]}" y="${b0[1] + 14}" text-anchor="middle" class="t-small t-dim">${L('웅크림', 'crouch')}</text>
    <text x="${(mid[0] + 18).toFixed(1)}" y="${(mid[1] - 22).toFixed(1)}" class="t-small t-dim">${L('늘어남', 'stretch')}</text>
    <text x="${b1[0]}" y="${b1[1] + 14}" text-anchor="middle" class="t-small t-dim">${L('찌그러짐', 'squash')}</text>
    <text x="135" y="210" text-anchor="middle" class="t-small t-a">${L('A: 직선, 등속, 형태 고정', 'A: straight line, constant speed, fixed shape')}</text>
    <text x="402" y="210" text-anchor="middle" class="t-small t-b">${L('B: 호, 양 끝 감속, sx × sy = 1', 'B: arc, slow in/out, sx × sy = 1')}</text>
  </svg>`;
  },
  look: [
    'A를 보면 직선 궤적, 등속, 형태 변화 없음. 미끄러지는 상자처럼 무게 없음. B는 같은 시간에 같은 거리를 가지만 훨씬 생동감 있음.',
    'B에서 원칙을 하나씩 끄면 무엇이 "무게감"(스쿼시, 예비 동작)을 만들고 무엇이 "유기적 느낌"(호, 후속 동작)을 만드는지 구분됨',
    '과장 정도를 2로 올리면 카툰 느낌, 0.3으로 내리면 사실적인 느낌이 됨',
    '후속 동작을 켜면 착지 후에도 더듬이가 잠시 흔들림(오버랩 동작)',
  ],
  refs: [
    { type: 'book', title: 'The Illusion of Life: Disney Animation (Frank Thomas & Ollie Johnston)', year: 1981, note: '12가지 애니메이션 원칙의 원전' },
    { type: 'paper', title: 'Principles of Traditional Animation Applied to 3D Computer Animation (John Lasseter)', year: 1987, note: 'SIGGRAPH \'87. 원칙을 CG 애니메이션에 적용.' },
    { type: 'article', title: 'Twelve basic principles of animation (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation' },
    { type: 'talk', title: 'Juice it or lose it (Martin Jonasson & Petri Purho)', year: 2012, note: '스쿼시, 트윈, overshoot 같은 작은 애니메이션이 게임 느낌에 주는 효과' },
  ],
  params: [
    { key: 'anticipation', label: '예비 동작', type: 'bool', a: false, b: true, group: '원칙' },
    { key: 'squash', label: '찌그러짐과 늘어남', type: 'bool', a: false, b: true },
    { key: 'arc', label: '호 (포물선 궤적)', type: 'bool', a: false, b: true },
    { key: 'slowInOut', label: '천천히 시작과 끝', type: 'bool', a: false, b: true },
    { key: 'follow', label: '후속 동작 & overshoot', type: 'bool', a: false, b: true },
    { key: 'amount', label: '과장 정도', type: 'range', min: 0, max: 2, step: 0.05, default: 1 },
    { key: 'onion', label: '어니언 스킨 (궤적 점)', type: 'bool', default: true, shared: true, group: '표시' },
    { key: 'speed', label: '재생 속도', type: 'range', min: 0.1, max: 2, step: 0.05, default: 1, shared: true },
  ],
  en: {
    title: 'Animation Principles: Anticipation, Squash & Stretch, Follow-Through',
    summary: 'The same jump with the same timing gains weight and life when you add animation principles. Compare anticipation, squash & stretch, arcs, slow in/out, and follow-through with overshoot.',
    views: { a: 'No principles', b: 'Principles on' },
    controls: 'No input. The character keeps jumping between two platforms. Both views use the same timing.',
    info: `
    <p>The <b>12 principles</b> written down by Disney animators apply directly to game characters and UI animation. This sample has a switch for five of them.</p>
    <ul>
      <li><b>Anticipation</b>: the character crouches the other way before the jump. It says "I am about to move". In games it also works as an enemy attack warning (telegraph).</li>
      <li><b>Squash &amp; Stretch</b>: the shape stretches when it moves fast and squashes on impact. The key is <b>keeping the volume</b> (sx × sy = 1).</li>
      <li><b>Arcs</b>: living things move along curves, not straight lines.</li>
      <li><b>Slow In &amp; Slow Out</b>: motion slows down near the start and the end. This creates hang time at the top.</li>
      <li><b>Follow-Through &amp; Overshoot</b>: when the body stops, loose parts such as antennae lag behind and wobble. The landing squash goes past its target and comes back.</li>
    </ul>
    <p>The dots (onion skin) are positions taken at equal time steps. The spacing shows speed, and the shape shows the path.</p>`,
    look: [
      'Look at A: a straight path, constant speed, no change in shape. It has no weight, like a sliding box. B covers the same distance in the same time but looks far more alive.',
      'In B, turn the principles off one by one. You can tell which ones create "weight" (squash, anticipation) and which create an "organic feel" (arcs, follow-through).',
      'Raise the exaggeration to 2 for a cartoon look. Lower it to 0.3 for a realistic look.',
      'Turn on follow-through. The antennae keep wobbling for a moment after landing (overlapping action).',
    ],
    refs: [
      'The original source of the 12 animation principles.',
      'SIGGRAPH \'87. Applies the principles to CG animation.',
      null,
      'How small animations such as squash, tweens, and overshoot change game feel.',
    ],
    params: {
      anticipation: { label: 'Anticipation', group: 'Principles' },
      squash: 'Squash & stretch',
      arc: 'Arcs (parabolic path)',
      slowInOut: 'Slow in & slow out',
      follow: 'Follow-through & overshoot',
      amount: 'Exaggeration',
      onion: { label: 'Onion skin (path dots)', group: 'Display' },
      speed: 'Playback speed',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params, V = U.v2;
    const HOLD = 0.45, ANT = 0.3, AIR = 0.6, LAND = 0.55, HOP = HOLD + ANT + AIR + LAND;
    const RAD = 24;
    let clock = 0;
    const pads = () => {
      const W = ctx.width, H = ctx.height;
      return [{ x: W * 0.2, y: H * 0.78 }, { x: W * 0.8, y: H * 0.55 }];
    };
    // 공중 구간 위치 (u: 0..1)
    function airPos(a, b, u) {
      const w = P.slowInOut ? U.lerp(u, U.ease.inOutSine(u), 0.7) : u;
      if (!P.arc) return V.lerp(a, b, w);
      const h = Math.min(ctx.height * 0.35, 160) * (0.6 + 0.4 * P.amount);
      const x = U.lerp(a.x, b.x, P.slowInOut ? U.lerp(u, w, 0.4) : u);
      const yLin = U.lerp(a.y, b.y, w);
      return { x, y: yLin - 4 * h * w * (1 - w) };
    }
    // 시간 → 포즈 (순수 함수)
    function poseAt(time) {
      const [p0, p1] = pads();
      const k = Math.floor(time / HOP), tt = time - k * HOP;
      const from = k % 2 === 0 ? p0 : p1, to = k % 2 === 0 ? p1 : p0;
      const dir = Math.sign(to.x - from.x);
      const A = P.amount;
      let pos = { ...from }, sx = 1, sy = 1, rot = 0, lean = 0, phase = 'hold';
      if (tt < HOLD) {
        phase = 'hold';
      } else if (tt < HOLD + ANT) {
        phase = 'antic';
        const u = (tt - HOLD) / ANT;
        if (P.anticipation) {
          const e = U.ease.outQuad(Math.min(1, u * 1.3));
          pos = { x: from.x - dir * 8 * A * e, y: from.y };
          lean = -dir * 0.18 * A * e;
          if (P.squash) { sy = 1 - 0.32 * A * e; sx = 1 / Math.max(0.3, sy); }
          else sy = 1 - 0.12 * A * e; // 스쿼시 없이 낮추기만
        }
      } else if (tt < HOLD + ANT + AIR) {
        phase = 'air';
        const u = (tt - HOLD - ANT) / AIR;
        pos = airPos(from, to, u);
        if (P.squash) {
          const q = airPos(from, to, Math.min(1, u + 0.02)), pq = airPos(from, to, Math.max(0, u - 0.02));
          const v = V.sub(q, pq), spd = V.len(v) / 0.04 / Math.max(1, ctx.width);
          const st = 1 + Math.min(0.55, spd * 0.35) * A;
          sx = st; sy = 1 / st; rot = Math.atan2(v.y, v.x);   // 속도 방향으로 늘림 (얼굴은 회전하지 않음)
        }
        lean = P.follow ? dir * 0.12 * A * Math.sin(u * Math.PI) : 0;
      } else {
        phase = 'land';
        const tau = tt - HOLD - ANT - AIR;
        pos = { ...to };
        if (P.squash) {
          const amp = 0.38 * A;
          if (P.follow) sy = 1 - amp * Math.exp(-7 * tau) * Math.cos(tau * 20);
          else sy = 1 - amp * Math.max(0, 1 - tau / 0.12);
          sx = 1 / Math.max(0.3, sy);
        }
      }
      return { pos, sx, sy, rot, lean, phase, dir };
    }

    // 더듬이 (후속 동작용 스프링 상태)
    const antenna = [{ p: null, v: { x: 0, y: 0 } }, { p: null, v: { x: 0, y: 0 } }];
    const anchorOf = (pose, i) => {
      const side = i === 0 ? -1 : 1;
      const top = { x: pose.pos.x, y: pose.pos.y - RAD * 2 * pose.sy };
      const base = { x: top.x + side * 8 * pose.sx, y: top.y + 4 };
      const ang = -Math.PI / 2 + pose.lean + side * 0.35;
      return { base, tip: V.add(base, V.fromAngle(ang, 26)) };
    };

    return {
      update(dt) {
        const sdt = dt * P.speed;
        clock += sdt;
        const pose = poseAt(clock);
        antenna.forEach((a, i) => {
          const { tip } = anchorOf(pose, i);
          if (!a.p || !P.follow) { a.p = { ...tip }; a.v = { x: 0, y: 0 }; return; }
          const k = 260, c = 9;
          const steps = 4, h = sdt / steps;
          for (let s = 0; s < steps; s++) {
            const acc = V.sub(V.scale(V.sub(tip, a.p), k), V.scale(a.v, c));
            a.v = V.add(a.v, V.scale(acc, h));
            a.p = V.add(a.p, V.scale(a.v, h));
          }
        });
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        const [p0, p1] = pads();
        D.grid(g, W, H, 40);
        for (const p of [p0, p1]) { D.rect(g, p.x - 55, p.y, 110, 10, '#3a404c'); D.rect(g, p.x - 55, p.y + 10, 110, H - p.y, 'rgba(255,255,255,0.03)'); }
        // 어니언 스킨: 현재 hop의 공중 구간
        if (P.onion) {
          const k = Math.floor(clock / HOP), base = k * HOP + HOLD + ANT;
          for (let i = 0; i <= 14; i++) {
            const ps = poseAt(base + (i / 14) * AIR * 0.999);
            D.circle(g, ps.pos.x, ps.pos.y - RAD, 3, 'rgba(255,255,255,0.35)');
          }
        }
        const pose = poseAt(clock);
        // 그림자
        const under = Math.abs(pose.pos.x - p0.x) < Math.abs(pose.pos.x - p1.x) ? p0 : p1;
        const shY = pose.phase === 'air' ? under.y : pose.pos.y, shS = pose.phase === 'air' ? 0.5 : pose.sx;
        g.beginPath(); g.ellipse(pose.pos.x, shY, RAD * shS, 4, 0, 0, U.TAU);
        g.fillStyle = 'rgba(0,0,0,0.4)'; g.fill();
        // 더듬이
        antenna.forEach((a, i) => {
          const { base } = anchorOf(pose, i);
          if (!a.p) return;
          const mid = V.lerp(base, a.p, 0.5);
          g.beginPath(); g.moveTo(base.x, base.y); g.quadraticCurveTo(mid.x + (a.p.y - base.y) * 0.1, mid.y, a.p.x, a.p.y);
          g.strokeStyle = col; g.lineWidth = 2.5; g.stroke();
          D.circle(g, a.p.x, a.p.y, 4, C.warn);
        });
        // 몸통: 발바닥 기준 스케일, 공중에선 중심 기준 회전
        g.save();
        if (pose.phase === 'air' && P.squash) {
          g.translate(pose.pos.x, pose.pos.y - RAD); g.rotate(pose.rot); g.scale(pose.sx, pose.sy); g.rotate(-pose.rot); g.translate(0, RAD);
        } else {
          g.translate(pose.pos.x, pose.pos.y); g.rotate(pose.lean); g.scale(pose.sx, pose.sy);
        }
        g.beginPath(); g.ellipse(0, -RAD, RAD, RAD, 0, 0, U.TAU);
        g.fillStyle = col; g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1.5; g.stroke();
        const ex = pose.dir * 7;
        D.circle(g, ex - 6, -RAD - 5, 5, '#fff'); D.circle(g, ex + 8, -RAD - 5, 5, '#fff');
        D.circle(g, ex - 5 + pose.dir * 1.5, -RAD - 5, 2.2, '#000'); D.circle(g, ex + 9 + pose.dir * 1.5, -RAD - 5, 2.2, '#000');
        g.restore();
        const on = ['anticipation', 'squash', 'arc', 'slowInOut', 'follow'].filter((k) => P[k]).length;
        const names = { hold: GTL.L('대기', 'Hold'), antic: GTL.L('예비 동작', 'Anticipation'), air: GTL.L('공중', 'Airborne'), land: GTL.L('착지', 'Landing') };
        ctx.stat(GTL.L('구간', 'Phase'), names[pose.phase]);
        ctx.stat(GTL.L('스케일 sx × sy', 'Scale sx × sy'), `${pose.sx.toFixed(2)} × ${pose.sy.toFixed(2)} = ${(pose.sx * pose.sy).toFixed(2)}`);
        ctx.stat(GTL.L('적용된 원칙', 'Principles on'), `${on} / 5`);
      },
    };
  },
});
