// 패럴랙스 스크롤링: 배경 전체를 한 장으로 움직임 vs 깊이별 레이어를 다른 속도로 움직임
GTL.register({
  id: 'parallax-layers',
  title: '패럴랙스 스크롤링 (깊이별 다중 레이어)',
  summary: '배경 전체를 카메라와 같은 속도로 움직이면 벽에 붙은 그림처럼 납작해 보임. 레이어마다 깊이에 반비례하는 속도로 움직이면 2D 화면에 거리감이 생김.',
  renderer: '2d',
  views: { a: '단일 레이어', b: '깊이별 다중 레이어' },
  controls: '←→ 카메라 이동 (자동 스크롤을 끄면)',
  info: `
    <p><b>패럴랙스 스크롤링(Parallax Scrolling)</b>은 먼 배경을 느리게, 가까운 전경을 빠르게 움직이는 기법. 기차 창밖에서 먼 산이 천천히 지나가는 것과 같은 원리임.</p>
    <p>레이어마다 깊이 z를 정하고 화면 위치를 <code>x_screen = x_world - camX * f</code>로 계산함. 원근 투영에서는 <code>f = 1 / z</code>이고, 지면(z = 1)은 카메라와 같은 속도로 움직임.</p>
    <ul>
    <li><b>단일 레이어</b>: 모든 레이어가 f = 1. 그림 한 장을 미는 것과 같아서 깊이 단서가 없음.</li>
    <li><b>다중 레이어</b>: 레이어마다 f가 다름. 움직임 자체가 깊이 단서(운동 시차)가 됨.</li>
    <li><b>대기 원근</b>: 먼 레이어일수록 하늘색에 가깝게 칠함. 멈춘 화면에서도 깊이가 보임.</li>
    </ul>
    <p>단점: 레이어가 많으면 겹쳐 그리는 픽셀(오버드로)이 늘어남. f가 1보다 큰 전경은 시야를 가리기 쉬워서 얇고 드물게 배치함.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 176" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
    <marker id="arrb" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="10" y="14">${L('위에서 본 장면', 'Scene seen from above')}</text>
    ${[[8, 30], [4, 58], [2, 86], [1, 114]].map(([z, y]) => `<line x1="20" y1="${y}" x2="250" y2="${y}" class="d-line" opacity="${0.35 + 0.65 / z}"/><text x="258" y="${y + 4}" class="t-small t-mono">z=${z}, f=1/${z}</text>`).join('')}
    <polygon points="70,150 60,166 80,166" class="f-accent"/>
    <path d="M90,158 L150,158" class="d-accent" marker-end="url(#arr)"/>
    <text x="156" y="162" class="t-small">${L('카메라 이동 camX', 'camera moves camX')}</text>
    <text x="370" y="14" class="t-b">${L('B: 화면 이동량', 'B: screen shift')}</text>
    ${[[8, 30], [4, 58], [2, 86], [1, 114]].map(([z, y]) => `<path d="M370,${y} L${370 + 150 / z},${y}" class="d-b" marker-end="url(#arrb)"/>`).join('')}
    <text x="370" y="138" class="t-small t-mono">x_screen = x - camX * f</text>
    <text x="370" y="152" class="t-small t-dim">${L('멀수록 느림 = 깊이 단서', 'Farther is slower = depth cue')}</text>
    <text x="370" y="168" class="t-small t-a">${L('A: 모든 레이어 f = 1', 'A: every layer has f = 1')}</text>
  </svg>`,
  look: [
    'A와 B를 나란히 보면 A는 산과 나무가 한 덩어리로 흘러감. B는 먼 산이 거의 멈춰 있고 앞쪽 풀이 빠르게 지나감.',
    'B의 "레이어 수"를 2로 줄이면 깊이감이 약해짐. 6으로 올리면 산맥 사이에 거리가 생김.',
    '"속도 공식"을 "선형"으로 바꾸면 먼 레이어도 꽤 빠르게 움직여서 원근이 어색해짐.',
    '"속도 표시"를 켜면 화면 오른쪽에 레이어별 배율 f와 실제 이동 속도가 나옴.',
  ],
  refs: [
    { type: 'game', title: 'Moon Patrol (Irem)', year: 1982, note: '아케이드 게임에서 다층 패럴랙스 배경을 쓴 초기 사례로 자주 언급됨.' },
    { type: 'game', title: 'Sonic the Hedgehog (Sega)', year: 1991, note: '메가 드라이브의 라인 스크롤로 배경을 여러 속도로 움직임.' },
    { type: 'engine', title: 'Godot Engine: ParallaxBackground / ParallaxLayer (motion_scale)', url: 'https://docs.godotengine.org/en/stable/classes/class_parallaxlayer.html', note: 'motion_scale이 이 샘플의 배율 f에 해당함.' },
  ],
  params: [
    { key: 'mode', label: '방식', type: 'select', group: '패럴랙스', options: [
      { value: 'single', label: '단일 레이어 (모두 f = 1)' },
      { value: 'multi', label: '깊이별 다중 레이어' },
    ], a: 'single', b: 'multi' },
    { key: 'layers', label: '레이어 수', type: 'int', min: 2, max: 6, default: 6, when: (p) => p.mode === 'multi' },
    { key: 'formula', label: '속도 공식', type: 'select', options: [
      { value: 'persp', label: '원근 (f = 1 / z)' },
      { value: 'linear', label: '선형 (f = 1 - 0.05 (z - 1))' },
    ], default: 'persp', when: (p) => p.mode === 'multi' },
    { key: 'fog', label: '대기 원근 (먼 레이어 흐리게)', type: 'bool', default: true },
    { key: 'guide', label: '속도 표시', type: 'bool', default: false },
    { key: 'auto', label: '자동 스크롤', type: 'bool', default: true, shared: true, group: '카메라' },
    { key: 'speed', label: '카메라 속도 (px/s)', type: 'range', min: 20, max: 600, step: 10, default: 180, shared: true },
  ],
  en: {
    title: 'Parallax Scrolling (Layers by Depth)',
    summary: 'If the whole background moves at the camera speed, it looks flat, like a picture on a wall. If each layer moves at a speed inversely related to its depth, the 2D screen gets a sense of distance.',
    views: { a: 'Single layer', b: 'Layers by depth' },
    controls: '←→ move the camera (when auto scroll is off)',
    info: `
    <p><b>Parallax scrolling</b> moves the far background slowly and the near foreground fast. It works like distant mountains that pass slowly outside a train window.</p>
    <p>Each layer has a depth z, and its screen position is <code>x_screen = x_world - camX * f</code>. With perspective projection <code>f = 1 / z</code>, and the ground (z = 1) moves at the camera speed.</p>
    <ul>
    <li><b>Single layer</b>: every layer has f = 1. It is like pushing one picture, so there is no depth cue.</li>
    <li><b>Multiple layers</b>: each layer has a different f. The motion itself becomes a depth cue (motion parallax).</li>
    <li><b>Aerial perspective</b>: farther layers are painted closer to the sky color. You see depth even on a still screen.</li>
    </ul>
    <p>Downside: many layers mean more pixels drawn on top of each other (overdraw). A foreground with f above 1 easily blocks the view, so keep it thin and sparse.</p>`,
    look: [
    'Watch A and B side by side. In A the mountains and trees flow as one piece. In B the far mountains barely move and the grass in front passes quickly.',
    'Lower B\'s "Layer count" to 2. The sense of depth gets weaker. Raise it to 6. Distance appears between the mountain ranges.',
    'Set "Speed formula" to "Linear". Far layers also move fairly fast, and the perspective looks wrong.',
    'Turn on "Show speeds". The right side of the screen shows each layer\'s factor f and its real speed.',
    ],
    refs: [
    'Often named as an early arcade game with a multi-layer parallax background.',
    'Uses the Mega Drive line scroll to move the background at several speeds.',
    'motion_scale matches the factor f in this sample.',
    ],
    params: {
    mode: { label: 'Method', group: 'Parallax', options: { single: 'Single layer (all f = 1)', multi: 'Layers by depth' } },
    layers: 'Layer count',
    formula: { label: 'Speed formula', options: { persp: 'Perspective (f = 1 / z)', linear: 'Linear (f = 1 - 0.05 (z - 1))' } },
    fog: 'Aerial perspective (fade far layers)',
    guide: 'Show speeds',
    auto: { label: 'Auto scroll', group: 'Camera' },
    speed: 'Camera speed (px/s)',
    },
  },

  setup(ctx) {
    const U = GTL.util, P = ctx.params, g = ctx.g;
    const rng = ctx.rng;
    // 레이어 정의: 깊이 z, 기준 높이(화면 비율), 색. 0번이 가장 멂.
    const DEF = [
      { z: 16, base: 0.42, amp: 0.10, col: [92, 104, 150], kind: 'ridge' },
      { z: 8, base: 0.52, amp: 0.09, col: [70, 82, 124], kind: 'ridge' },
      { z: 4, base: 0.62, amp: 0.07, col: [52, 76, 86], kind: 'hill' },
      { z: 2, base: 0.70, amp: 0.05, col: [36, 64, 52], kind: 'trees' },
      { z: 1, base: 0.80, amp: 0.015, col: [44, 40, 34], kind: 'ground' },
      { z: 0.6, base: 0.93, amp: 0.02, col: [16, 30, 20], kind: 'grass' },
    ];
    // 주기 함수(정수 주파수의 사인 합)로 끝없이 이어지는 지형 프로필을 만듦
    const PERIOD = 4096;
    for (const L of DEF) {
      L.waves = [];
      for (let k = 0; k < 5; k++) {
        const fq = [2, 5, 9, 17, 31][k] * (L.kind === 'ridge' ? 1 : 2);
        L.waves.push({ w: (U.TAU * fq) / PERIOD, ph: rng.range(0, U.TAU), a: 1 / (k + 1.2) });
      }
    }
    const SKY_TOP = [24, 30, 64], SKY_BOT = [168, 160, 190];
    const stars = [];
    for (let i = 0; i < 70; i++) stars.push({ x: rng.range(0, 1), y: rng.range(0, 0.35), r: rng.range(0.5, 1.5) });
    const ihash = (i, s) => { let h = (i * 374761393 + s * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; h ^= h >>> 16; return (h >>> 0) / 4294967296; };
    let camX = 0, t = 0;

    const profile = (L, wx) => { let s = 0; for (const w of L.waves) s += Math.sin(wx * w.w + w.ph) * w.a; return s / 2.2; };
    const factor = (L) => {
      if (P.mode === 'single') return 1;
      // 선형: 깊이에 비례해 조금씩 줄어듦. 먼 레이어가 너무 빠르게 움직임
      if (P.formula === 'linear') return 1 - 0.05 * (L.z - 1);
      return 1 / L.z;
    };
    const fogCol = (c, L) => {
      if (!P.fog) return c;
      const k = U.clamp(Math.log2(L.z) / 4.5, 0, 0.85);
      return [U.lerp(c[0], SKY_BOT[0], k), U.lerp(c[1], SKY_BOT[1], k), U.lerp(c[2], SKY_BOT[2], k)];
    };
    const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

    function activeLayers() {
      if (P.mode === 'single') return DEF.map((L, i) => i);
      // 레이어 수가 적으면 먼 쪽부터 생략 (지면 4번은 항상 남김)
      const n = P.layers;
      const order = [4, 3, 0, 5, 2, 1].slice(0, n);
      return order.sort((a, b) => a - b);
    }

    return {
      update(dt) {
        t += dt;
        if (P.auto) camX += P.speed * dt;
        else {
          if (ctx.input.key('ArrowRight') || ctx.input.key('KeyD')) camX += P.speed * dt;
          if (ctx.input.key('ArrowLeft') || ctx.input.key('KeyA')) camX -= P.speed * dt;
        }
      },
      render() {
        const W = ctx.width, H = ctx.height;
        const sky = g.createLinearGradient(0, 0, 0, H * 0.8);
        sky.addColorStop(0, css(SKY_TOP)); sky.addColorStop(1, css(SKY_BOT));
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        // 별과 달은 무한히 먼 곳 (f = 0). 단일 레이어에서는 f = 1
        const fs = P.mode === 'single' ? 1 : 0;
        g.fillStyle = 'rgba(255,255,240,0.8)';
        for (const s of stars) {
          const x = U.wrap(s.x * W * 2 - camX * fs, 0, W * 2);
          if (x < W) g.fillRect(x, s.y * H, s.r, s.r);
        }
        const mx = U.wrap(W * 0.75 - camX * fs, -60, W + 60);
        U.draw.circle(g, mx, H * 0.16, 18, 'rgba(250,240,210,0.9)');

        const used = activeLayers();
        const guides = [];
        for (const i of used) {
          const L = DEF[i];
          const f = factor(L);
          const off = camX * f;
          const by = H * L.base, amp = H * L.amp;
          const col = css(fogCol(L.col, L));
          guides.push({ i, f, y: by, col });
          if (L.kind === 'trees') {
            g.fillStyle = col;
            g.beginPath(); g.moveTo(0, H);
            for (let x = 0; x <= W + 8; x += 8) g.lineTo(x, by + profile(L, x + off) * amp + 14);
            g.lineTo(W, H); g.closePath(); g.fill();
            const SP = 34, i0 = Math.floor((off - 40) / SP), i1 = Math.ceil((off + W + 40) / SP);
            for (let k = i0; k <= i1; k++) {
              if (ihash(k, 3) < 0.35) continue;
              const wx = k * SP + ihash(k, 5) * SP * 0.8, sx = wx - off;
              const th = 30 + ihash(k, 7) * 46, base = by + profile(L, wx) * amp + 16;
              g.beginPath(); g.moveTo(sx, base - th); g.lineTo(sx + th * 0.28, base); g.lineTo(sx - th * 0.28, base); g.closePath(); g.fill();
            }
          } else if (L.kind === 'ground') {
            g.fillStyle = col; g.fillRect(0, by, W, H - by);
            // 지면 줄무늬: 카메라와 같은 속도라는 기준선
            g.fillStyle = 'rgba(255,255,255,0.08)';
            const SP = 48, o = U.wrap(off, 0, SP);
            for (let x = -o; x < W; x += SP) g.fillRect(x, by + 4, 24, 3);
          } else if (L.kind === 'grass') {
            g.fillStyle = col;
            const SP = 9, i0 = Math.floor(off / SP) - 2, i1 = Math.ceil((off + W) / SP) + 2;
            for (let k = i0; k <= i1; k++) {
              if (ihash(k, 11) < 0.55) continue;
              const sx = k * SP - off, hh = 14 + ihash(k, 13) * 34;
              g.beginPath(); g.moveTo(sx - 4, H); g.lineTo(sx + ihash(k, 17) * 8 - 2, H - hh); g.lineTo(sx + 4, H); g.closePath(); g.fill();
            }
          } else {
            g.fillStyle = col;
            g.beginPath(); g.moveTo(0, H);
            for (let x = 0; x <= W + 6; x += 6) g.lineTo(x, by + profile(L, x + off) * amp * (L.kind === 'ridge' ? 1.6 : 1));
            g.lineTo(W, H); g.closePath(); g.fill();
            if (L.kind === 'ridge' && i === 0) {
              // 먼 산꼭대기의 눈
              g.fillStyle = css(fogCol([220, 225, 240], L), 0.5);
              for (let x = 0; x <= W; x += 6) { const y = by + profile(L, x + off) * amp * 1.6; if (y < by - amp * 0.7) g.fillRect(x, y, 6, 3); }
            }
          }
          if (L.kind === 'ground') {
            // 주인공: 지면 위에서 달림 (화면 고정, 카메라가 따라감)
            const px = W * 0.35, py = by - 2, ph = t * 10;
            const c = ctx.side === 'a' ? U.colors.a : U.colors.b;
            g.fillStyle = c; g.fillRect(px - 6, py - 26, 12, 16);
            U.draw.circle(g, px, py - 31, 6, c);
            g.strokeStyle = c; g.lineWidth = 3;
            g.beginPath(); g.moveTo(px, py - 10); g.lineTo(px + Math.sin(ph) * 7, py); g.moveTo(px, py - 10); g.lineTo(px - Math.sin(ph) * 7, py); g.stroke();
          }
        }

        if (P.guide) {
          g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(W - 168, 8, 160, 18 + guides.length * 16);
          U.draw.text(g, GTL.L('레이어  f   속도(px/s)', 'Layer  f   speed(px/s)'), W - 160, 14, { size: 11, color: U.colors.text });
          guides.slice().reverse().forEach((gd, k) => {
            const y = 30 + k * 16;
            g.fillStyle = gd.col; g.fillRect(W - 160, y + 2, 10, 10);
            const v = P.speed * gd.f;
            U.draw.text(g, `z=${DEF[gd.i].z}`, W - 146, y, { size: 11, color: U.colors.text });
            U.draw.text(g, gd.f.toFixed(2), W - 98, y, { size: 11, color: U.colors.text });
            U.draw.text(g, v.toFixed(0), W - 60, y, { size: 11, color: U.colors.text });
          });
        }
        const fsAll = guides.map((gd) => gd.f);
        ctx.stat(GTL.L('그린 레이어 수', 'Layers drawn'), guides.length);
        ctx.stat(GTL.L('서로 다른 속도 수', 'Distinct speeds'), new Set(fsAll.map((f) => f.toFixed(3))).size);
        ctx.stat(GTL.L('먼 산 / 전경 속도 비', 'Far mountain / foreground speed ratio'), `${(Math.min(...fsAll) / Math.max(...fsAll)).toFixed(2)}`);
      },
    };
  },
});
