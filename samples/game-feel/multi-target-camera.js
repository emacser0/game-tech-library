// 다중 대상 카메라: 여러 플레이어를 한 화면에 담도록 중심과 줌을 정함 (대전 액션 게임 스타일)
GTL.register({
  id: 'multi-target-camera',
  title: '다중 대상 카메라 프레이밍',
  summary: '여러 플레이어의 평균 위치만 따라가면 멀리 간 플레이어가 화면 밖으로 나감. 경계 상자에 여백을 더해 줌을 정하고, 줌 아웃은 빠르게, 줌 인은 천천히 하면 모두를 담으면서 화면이 덜 출렁임.',
  views: { a: '평균 위치 + 고정 줌', b: '경계 상자 맞춤 + 감쇠' },
  controls: '←→↑↓ / WASD 1P 이동 (키를 누르면 자동 데모가 잠시 멈춤)',
  info: `
    <p><b>다중 대상 프레이밍(Multi-Target Framing)</b>: 여러 대상이 모두 화면에 들어오게 카메라 위치와 줌을 정하는 방법.
    로컬 대전 게임(대난투 스매시브라더스 시리즈 등)이나 협동 게임에서 씀.</p>
    <ol>
      <li>대상들의 경계 상자(AABB)를 구함</li>
      <li>상자에 여백(padding)을 더함. 가장자리에 붙은 대상도 주변 상황이 보이게 함.</li>
      <li>상자가 화면에 들어가는 줌을 고름: <code>zoom = min(화면 너비 / 상자 너비, 화면 높이 / 상자 높이)</code></li>
      <li>줌을 최소, 최대 범위로 제한. 너무 가까우면 답답하고, 너무 멀면 캐릭터가 점처럼 작아짐.</li>
      <li>중심과 줌을 감쇠로 부드럽게 옮김. 줌은 로그 공간에서 보간하면 확대, 축소 속도가 고르게 느껴짐.</li>
    </ol>
    <p>줌 아웃은 빠르게 해야 대상이 화면 밖으로 나가지 않음. 줌 인은 천천히 해야 화면이 출렁이지 않음.
    대상이 순간 이동(부활 등)하면 감쇠 없는 맞춤은 화면이 한 프레임에 튐.</p>
    <p>최대 줌 아웃 범위를 넘을 만큼 흩어지면 맞춤 방식도 대상을 놓침. 그래서 화면 가장자리에 위치 표시(화살표)를 함께 씀.</p>`,
  // 도식: 평균 위치 + 고정 줌 화면 vs 경계 상자에 여백을 더해 맞춘 화면
  diagram: (L) => `<svg viewBox="0 0 540 194" xmlns="http://www.w3.org/2000/svg">
    <text x="135" y="14" text-anchor="middle" class="t-a">${L('A: 평균 위치 + 고정 줌', 'A: average + fixed zoom')}</text>
    <text x="405" y="14" text-anchor="middle" class="t-b">${L('B: 경계 상자 맞춤', 'B: fit bounding box')}</text>
    <rect x="70" y="60" width="130" height="80" class="d-a"/>
    <path d="M129,100 L141,100 M135,94 L135,106" class="d-accent"/><text x="135" y="118" text-anchor="middle" class="t-small">${L('평균 위치', 'average')}</text>
    <circle cx="75" cy="100" r="5" class="f-dim"/><circle cx="110" cy="80" r="5" class="f-dim"/><circle cx="220" cy="120" r="5" class="f-bad"/>
    <text x="222" y="140" text-anchor="middle" class="t-small">${L('화면 밖', 'off screen')}</text>
    <rect x="345" y="80" width="145" height="40" class="d-dim" stroke-dasharray="3 3"/>
    <rect x="330" y="46" width="175" height="108" class="d-b"/>
    <circle cx="345" cy="100" r="5" class="f-dim"/><circle cx="380" cy="80" r="5" class="f-dim"/><circle cx="490" cy="120" r="5" class="f-dim"/>
    <text x="417" y="74" text-anchor="middle" class="t-small t-dim">${L('경계 상자', 'bounds')}</text>
    <text x="417" y="148" text-anchor="middle" class="t-small">${L('+ 여백, 화면 비율로 확장', '+ padding, fit to aspect')}</text>
    <text x="270" y="174" text-anchor="middle" class="t-small t-mono">zoom = min(W / ${L('상자 너비', 'box width')}, H / ${L('상자 높이', 'box height')})</text>
    <text x="270" y="189" text-anchor="middle" class="t-small t-dim">${L('줌 아웃은 빠르게, 줌 인은 천천히 감쇠', 'Damp zoom out fast and zoom in slowly')}</text>
  </svg>`,
  look: [
    '대상들이 흩어지는 구간에서 A는 "화면 밖 대상"이 1~2로 올라감. B는 줌 아웃으로 대부분 0을 유지.',
    '약 7초마다 대상 하나가 가운데로 부활. B의 방식을 "경계 상자 맞춤 (감쇠 없음)"으로 바꾸면 그 순간 화면이 튀고 "프레임당 최대 화면 변화"가 몇 배로 커짐.',
    'B의 "최대 보이는 너비"를 900으로 낮추면 크게 흩어질 때 B도 대상을 놓침. 가장자리 화살표가 위치를 알려 줌.',
    '여백을 0으로 줄이면 대상이 화면 테두리에 딱 붙어 다음 움직임이 보이지 않음',
  ],
  refs: [
    { type: 'game', title: 'Super Smash Bros. 시리즈 (Nintendo, HAL Laboratory, Sora Ltd.)', note: '모든 파이터를 담도록 자동으로 줌 인, 줌 아웃하는 카메라. 화면 밖 파이터는 가장자리 표시로 보여 줌.' },
    { type: 'engine', title: 'Unity Cinemachine - Target Group Camera (CinemachineTargetGroup, Group Framing)', note: '여러 대상의 경계를 화면 비율에 맞추는 프레이밍' },
    { type: 'talk', title: 'Math for Game Programmers: Juicing Your Cameras With Math (Squirrel Eiserloh)', year: 2016, note: 'GDC 2016. 카메라 감쇠, 보간 수학.' },
  ],
  params: [
    { key: 'mode', label: '프레이밍 방식', type: 'select', group: '카메라', options: [
      { value: 'avg', label: '평균 위치 + 고정 줌' },
      { value: 'fit', label: '경계 상자 맞춤 (감쇠 없음)' },
      { value: 'smooth', label: '경계 상자 맞춤 + 감쇠' },
    ], a: 'avg', b: 'smooth' },
    { key: 'fixedW', label: '고정 줌 보이는 너비', type: 'int', min: 400, max: 1400, default: 760, when: (p) => p.mode === 'avg' },
    { key: 'pad', label: '여백 (월드 px)', type: 'int', min: 0, max: 300, default: 110, when: (p) => p.mode !== 'avg' },
    { key: 'minW', label: '최소 보이는 너비', type: 'int', min: 300, max: 900, default: 520, when: (p) => p.mode !== 'avg' },
    { key: 'maxW', label: '최대 보이는 너비', type: 'int', min: 600, max: 2200, default: 1700, when: (p) => p.mode !== 'avg' },
    { key: 'zoomIn', label: '줌 인 감쇠 시간 (s)', type: 'range', min: 0.05, max: 2, step: 0.05, default: 0.9, when: (p) => p.mode === 'smooth' },
    { key: 'zoomOut', label: '줌 아웃 감쇠 시간 (s)', type: 'range', min: 0.05, max: 2, step: 0.05, default: 0.35, when: (p) => p.mode === 'smooth' },
    { key: 'arrows', label: '화면 밖 위치 표시', type: 'bool', default: true },
    { key: 'debug', label: '경계 상자 표시', type: 'bool', default: true },
    { key: 'demo', label: '자동 데모', type: 'bool', default: true, shared: true, group: '장면' },
    { key: 'restart', label: '처음부터', type: 'button', buttonLabel: '다시 시작' },
  ],
  en: {
    title: 'Multi-Target Camera Framing',
    summary: 'If you follow only the average position of several players, a player who goes far leaves the screen. Set the zoom from a bounding box plus padding, zoom out fast, and zoom in slowly. Then everyone stays on screen and the view bobs less.',
    views: { a: 'Average position + fixed zoom', b: 'Bounding box fit + damping' },
    controls: '←→↑↓ / WASD to move player 1 (pressing a key pauses the auto demo for a moment)',
    info: `
    <p><b>Multi-target framing</b> sets the camera position and zoom so that every target fits on screen.
    Local versus games (such as the Super Smash Bros. series) and co-op games use it.</p>
    <ol>
      <li>Find the bounding box (AABB) of the targets.</li>
      <li>Add padding to the box. Even a target at the edge then shows what is around it.</li>
      <li>Pick a zoom that fits the box on screen: <code>zoom = min(screen width / box width, screen height / box height)</code>.</li>
      <li>Clamp the zoom to a min and max range. Too close feels cramped. Too far makes characters as small as dots.</li>
      <li>Move the center and zoom smoothly with damping. If you interpolate zoom in log space, zooming in and out feels equally fast.</li>
    </ol>
    <p>Zoom out fast so targets do not leave the screen. Zoom in slowly so the view does not bob.
    When a target teleports (for example on respawn), a fit without damping makes the view jump in one frame.</p>
    <p>If targets spread past the max zoom out range, the fit method also loses them. So you also show position markers (arrows) at the screen edge.</p>`,
    look: [
      'When the targets spread out, A\'s "Targets off screen" goes up to 1 or 2. B zooms out and stays at 0 most of the time.',
      'About every 7 seconds a target respawns in the middle. Change B\'s mode to "Bounding box fit (no damping)". The view jumps at that moment, and "Max view change per frame" grows several times.',
      'Lower B\'s "Max visible width" to 900. When targets spread far, B also loses them. The edge arrows show where they are.',
      'Reduce the padding to 0. Targets stick to the screen border, and you cannot see where they will move next.',
    ],
    refs: [
      { title: 'Super Smash Bros. series (Nintendo, HAL Laboratory, Sora Ltd.)', note: 'A camera that zooms in and out on its own to fit all fighters. Fighters off screen are shown with edge markers.' },
      'Framing that fits the bounds of several targets to the screen ratio.',
      'GDC 2016. The math of camera damping and interpolation.',
    ],
    params: {
      mode: { label: 'Framing mode', group: 'Camera', options: { avg: 'Average position + fixed zoom', fit: 'Bounding box fit (no damping)', smooth: 'Bounding box fit + damping' } },
      fixedW: 'Fixed zoom visible width',
      pad: 'Padding (world px)',
      minW: 'Min visible width',
      maxW: 'Max visible width',
      zoomIn: 'Zoom in damping time (s)',
      zoomOut: 'Zoom out damping time (s)',
      arrows: 'Show off screen markers',
      debug: 'Show bounding box',
      demo: { label: 'Auto demo', group: 'Scene' },
      restart: { label: 'Start over', buttonLabel: 'Restart' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const WORLD_W = 2200, WORLD_H = 1200, STEP = 1 / 120, SPEED = 280, R = 16;
    const col = ctx.side === 'a' ? C.a : C.b;
    const KEYS = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'] };
    const ALL = [...KEYS.left, ...KEYS.right, ...KEYS.up, ...KEYS.down];
    const TCOL = ['#4fc3f7', '#ff7a59', '#66d17a', '#ffcb6b'];
    const rng = U.rng(ctx.seed + 21);
    // 대상별 리사주 경로 (시드 고정이라 두 뷰가 같음)
    const paths = Array.from({ length: 4 }, (_, i) => ({
      ax: rng.range(380, 620), ay: rng.range(180, 300),
      wx: rng.range(0.35, 0.6), wy: rng.range(0.5, 0.9),
      px: rng.range(0, U.TAU), py: rng.range(0, U.TAU),
      dir: i % 2 ? 1 : -1,
    }));
    const platforms = Array.from({ length: 9 }, () => ({ x: rng.range(200, WORLD_W - 400), y: rng.range(300, WORLD_H - 150), w: rng.range(120, 300) }));
    const CX = WORLD_W / 2, CY = WORLD_H / 2;

    let t, acc, idle, targets, cam, offT, totT, zoomSpeedHist, lastLog, respawnFx, p1, prevCam;
    function pathPos(i, time) {
      const q = paths[i];
      // 흩어짐 정도: 천천히 커졌다 작아짐
      const spread = 0.35 + 0.75 * (0.5 + 0.5 * Math.sin(time * 0.3 + i * 0.4));
      return {
        x: U.clamp(CX + q.dir * q.ax * spread * Math.sin(q.wx * time + q.px), 60, WORLD_W - 60),
        y: U.clamp(CY + q.ay * spread * 1.4 * Math.sin(q.wy * time + q.py), 60, WORLD_H - 60),
      };
    }
    function init() {
      t = 0; acc = 0; idle = 99; offT = 0; totT = 0; zoomSpeedHist = []; respawnFx = [];
      targets = [0, 1, 2, 3].map((i) => ({ ...pathPos(i, 0), off: { x: 0, y: 0 }, offV: 0 }));
      p1 = { x: targets[0].x, y: targets[0].y };
      const f = frame();
      cam = { x: f.x, y: f.y, w: f.w };
      lastLog = Math.log(cam.w); prevCam = { x: cam.x, y: cam.y };
    }

    // 목표 프레이밍 계산: 중심과 보이는 너비(월드 px)
    function frame() {
      const W = ctx.width, H = ctx.height, aspect = H / W;
      if (P.mode === 'avg') {
        let sx = 0, sy = 0;
        for (const q of targets) { sx += q.x; sy += q.y; }
        return { x: sx / targets.length, y: sy / targets.length, w: P.fixedW };
      }
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const q of targets) { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); }
      const bw = x1 - x0 + 2 * (P.pad + R), bh = y1 - y0 + 2 * (P.pad + R);
      // 화면 비율을 고려해 상자 전체가 들어가는 너비
      const w = U.clamp(Math.max(bw, bh / aspect), P.minW, Math.max(P.minW, P.maxW));
      return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w, box: { x0, y0, x1, y1 } };
    }

    init();

    function step(manual, auto) {
      t += STEP;
      for (let i = 0; i < 4; i++) {
        const tg = targets[i];
        let pos;
        if (i === 0 && !auto) {
          const dx = (manual.right ? 1 : 0) - (manual.left ? 1 : 0), dy = (manual.down ? 1 : 0) - (manual.up ? 1 : 0);
          const n = U.v2.norm({ x: dx, y: dy });
          p1.x = U.clamp(p1.x + n.x * SPEED * STEP, 40, WORLD_W - 40);
          p1.y = U.clamp(p1.y + n.y * SPEED * STEP, 40, WORLD_H - 40);
          pos = p1;
        } else {
          pos = pathPos(i, t);
          if (i === 0) { p1.x = U.damp(p1.x, pos.x, 4, STEP); p1.y = U.damp(p1.y, pos.y, 4, STEP); pos = p1; }
        }
        // 부활: 7초마다 대상 하나(1P 제외)가 가운데 위쪽으로 순간 이동한 뒤 경로로 돌아감
        tg.offV = Math.max(0, tg.offV - STEP / 1.6);
        tg.x = U.lerp(pos.x, CX, tg.offV);
        tg.y = U.lerp(pos.y, 180, tg.offV);
      }
      const k = Math.floor(t / 7), prevK = Math.floor((t - STEP) / 7);
      if (k !== prevK) {
        const i = 1 + (k % 3);
        targets[i].offV = 1;
        targets[i].x = CX; targets[i].y = 180;
        respawnFx.push({ x: CX, y: 180, age: 0 });
      }
      for (const f of respawnFx) f.age += STEP;
      while (respawnFx.length && respawnFx[0].age > 1) respawnFx.shift();
    }

    function updateCam(dt) {
      const f = frame();
      if (P.mode === 'smooth') {
        const ts = 0.4;
        cam.x = U.damp(cam.x, f.x, 3 / ts, dt);
        cam.y = U.damp(cam.y, f.y, 3 / ts, dt);
        // 줌은 로그 공간에서 감쇠. 줌 아웃(너비 증가)은 빠르게, 줌 인은 천천히
        const st = f.w > cam.w ? P.zoomOut : P.zoomIn;
        cam.w = Math.exp(U.damp(Math.log(cam.w), Math.log(f.w), 3 / Math.max(0.02, st), dt));
      } else if (P.mode === 'avg') {
        cam.x = U.damp(cam.x, f.x, 8, dt); cam.y = U.damp(cam.y, f.y, 8, dt); cam.w = f.w;
      } else { cam.x = f.x; cam.y = f.y; cam.w = f.w; }
      // 한 프레임 동안 화면이 바뀐 정도: 중심 이동(보이는 너비 대비) + 줌 변화(로그)
      const lw = Math.log(cam.w);
      zoomSpeedHist.push(Math.max(Math.abs(cam.x - prevCam.x), Math.abs(cam.y - prevCam.y)) / cam.w + Math.abs(lw - lastLog));
      lastLog = lw; prevCam = { x: cam.x, y: cam.y };
      if (zoomSpeedHist.length > 480) zoomSpeedHist.shift();
    }

    function view() {
      const W = ctx.width, H = ctx.height, z = W / cam.w;
      return { W, H, z, toS: (x, y) => ({ x: (x - cam.x) * z + W / 2, y: (y - cam.y) * z + H / 2 }) };
    }

    function offscreenCount() {
      const v = view();
      let n = 0;
      for (const q of targets) { const s = v.toS(q.x, q.y); if (s.x < -R * v.z || s.x > v.W + R * v.z || s.y < -R * v.z || s.y > v.H + R * v.z) n++; }
      return n;
    }

    return {
      update(dt) {
        const kb = ctx.input;
        const manual = { left: KEYS.left.some(kb.key), right: KEYS.right.some(kb.key), up: KEYS.up.some(kb.key), down: KEYS.down.some(kb.key) };
        idle = ALL.some(kb.key) ? 0 : idle + dt;
        const auto = P.demo && idle > 2.5;
        acc += dt;
        while (acc >= STEP) { acc -= STEP; step(manual, auto); }
        updateCam(dt);
        const n = offscreenCount();
        totT += dt; if (n > 0) offT += dt;
      },
      render() {
        const g = ctx.g, v = view(), z = v.z;
        g.save(); g.translate(v.W / 2, v.H / 2); g.scale(z, z); g.translate(-cam.x, -cam.y);
        D.rect(g, 0, 0, WORLD_W, WORLD_H, '#181b22');
        D.grid(g, WORLD_W, WORLD_H, 100, 'rgba(255,255,255,0.05)');
        D.rect(g, 0, 0, WORLD_W, WORLD_H, null, '#3a4150', 3 / z);
        for (const pl of platforms) D.rect(g, pl.x, pl.y, pl.w, 14, '#2c3240');
        for (const f of respawnFx) D.circle(g, f.x, f.y, 20 + f.age * 120, null, `rgba(255,255,255,${0.6 * (1 - f.age)})`, 3 / z);
        const fr = frame();
        if (P.debug && fr.box) {
          g.setLineDash([10 / z, 8 / z]);
          D.rect(g, fr.box.x0 - R, fr.box.y0 - R, fr.box.x1 - fr.box.x0 + 2 * R, fr.box.y1 - fr.box.y0 + 2 * R, null, 'rgba(255,255,255,0.5)', 1.5 / z);
          g.setLineDash([]);
          const pr = P.pad + R;
          D.rect(g, fr.box.x0 - pr, fr.box.y0 - pr, fr.box.x1 - fr.box.x0 + 2 * pr, fr.box.y1 - fr.box.y0 + 2 * pr, null, 'rgba(102,209,122,0.45)', 1.5 / z);
        }
        targets.forEach((q, i) => {
          D.circle(g, q.x, q.y, R, TCOL[i], '#fff', 2 / z);
          D.text(g, `${i + 1}P`, q.x, q.y - R - 22, { size: 18, color: TCOL[i], align: 'center' });
        });
        g.restore();
        // 화면 밖 위치 표시
        if (P.arrows) {
          targets.forEach((q, i) => {
            const s = v.toS(q.x, q.y), m = 18;
            if (s.x >= 0 && s.x <= v.W && s.y >= 0 && s.y <= v.H) return;
            const ex = U.clamp(s.x, m, v.W - m), ey = U.clamp(s.y, m, v.H - m);
            const a = Math.atan2(s.y - ey, s.x - ex);
            D.circle(g, ex, ey, 11, 'rgba(0,0,0,0.6)', TCOL[i], 2);
            D.text(g, `${i + 1}`, ex, ey - 6, { size: 11, color: TCOL[i], align: 'center' });
            D.arrow(g, ex + Math.cos(a) * 11, ey + Math.sin(a) * 11, ex + Math.cos(a) * 20, ey + Math.sin(a) * 20, TCOL[i], 2, 6);
          });
        }
        // 미니맵
        const mw = Math.min(180, v.W * 0.32), ms = mw / WORLD_W, mh = WORLD_H * ms, mx = v.W - mw - 10, my = v.H - mh - 10;
        D.rect(g, mx, my, mw, mh, 'rgba(0,0,0,0.55)', '#3a4150', 1);
        const vh = v.H / z;
        D.rect(g, mx + (cam.x - cam.w / 2) * ms, my + (cam.y - vh / 2) * ms, cam.w * ms, vh * ms, null, col, 1.5);
        targets.forEach((q, i) => D.circle(g, mx + q.x * ms, my + q.y * ms, 2.5, TCOL[i]));
        if (P.demo && idle <= 2.5) D.text(g, GTL.L('수동 조작 중', 'Manual control'), v.W - 12, 12, { size: 11, color: C.warn, align: 'right' });
        const zs = zoomSpeedHist.length ? Math.max(...zoomSpeedHist) : 0;
        ctx.stat(GTL.L('화면 밖 대상', 'Targets off screen'), `${offscreenCount()}`);
        ctx.stat(GTL.L('누가 화면 밖에 있던 시간', 'Time anyone was off screen'), totT ? `${((offT / totT) * 100).toFixed(0)}%` : '-');
        ctx.stat(GTL.L('보이는 너비', 'Visible width'), GTL.L(`${cam.w.toFixed(0)} 월드 px`, `${cam.w.toFixed(0)} world px`));
        ctx.stat(GTL.L('프레임당 최대 화면 변화 (최근 8초)', 'Max view change per frame (last 8 s)'), `${(zs * 100).toFixed(1)}%`);
      },
      onAction(key) { if (key === 'restart') init(); },
    };
  },
});
