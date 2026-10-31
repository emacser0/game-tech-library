// 카메라 충돌 회피: 고정 길이 암 vs 구체 스윕으로 짧아지는 암 (Spring Arm, Cinemachine Deoccluder)
GTL.register({
  id: 'spring-arm-camera',
  title: '카메라 충돌 회피 (Spring Arm, Deoccluder)',
  summary: '3인칭 카메라를 고정 길이 암 끝에 두면 벽 옆에서 카메라가 벽 속에 들어가거나 기둥이 캐릭터를 가림. 피벗에서 카메라 쪽으로 구체를 쓸어(스윕) 맞은 지점까지 암을 줄이면 시야가 항상 열림.',
  views: { a: '고정 길이 암', b: '구체 스윕 + 짧아지는 암' },
  controls: 'WASD / 방향키 캐릭터 이동 (키를 누르면 자동 이동이 잠시 멈춤)',
  info: `
    <p><b>스프링 암(Spring Arm)</b>: 피벗(캐릭터)에서 뒤쪽으로 뻗은 막대 끝에 카메라를 다는 구성. Unreal의 <code>SpringArmComponent</code>가 대표 예.
    이 샘플은 위에서 내려다본 2D 장면. 암은 캐릭터 진행 방향 뒤, 조금 옆으로 뻗음.</p>
    <p>암 길이가 고정이면(A) 벽 가까이에서 카메라가 벽 속으로 들어감. 벽과 캐릭터 사이에 기둥이 있으면 시야가 막힘.</p>
    <p>동작 원리(B):</p>
    <ul>
      <li>피벗에서 원하는 카메라 위치까지 반지름 r인 구체를 쓸어 봄(스윕, Sphere Sweep). Unreal에서는 <b>Probe Size</b>와 <b>Probe Channel</b>로 정함.</li>
      <li>무엇에 맞으면 암 길이를 맞은 거리로 줄임. 구체 반지름만큼 벽에서 떨어지므로 카메라 근평면이 벽을 뚫지 않음.</li>
      <li>장애물이 사라지면 암이 원래 길이로 돌아감. 당길 때는 빠르게, 돌아갈 때는 천천히 하면 화면이 덜 출렁임. Cinemachine Deoccluder의 Damping When Occluded와 Damping이 이 두 값.</li>
      <li><b>카메라 랙(Camera Lag)</b>: 원하는 위치가 피벗을 늦게 따라감. 스윕은 실제 피벗에서 시작하므로 랙이 있어도 벽을 뚫지 않음.</li>
    </ul>
    <p>단점: 좁은 곳에서 암이 갑자기 짧아지면 화면이 확 다가옴. 얇은 기둥이 지나갈 때마다 암이 튀므로 작은 물체는 Probe Channel에서 빼는 경우가 많음.</p>`,
  diagram: [(L) => `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <rect x="16" y="30" width="54" height="134" class="f-dim"/>
    <text x="43" y="24" text-anchor="middle" class="t-small t-dim">${L('벽', 'wall')}</text>
    <path d="M240,62 L100,62" class="d-accent" marker-end="url(#arr)"/>
    <text x="96" y="54" class="t-small">${L('스윕: 피벗에서 원하는 위치로', 'Sweep: from pivot to desired spot')}</text>
    ${[222, 192, 162, 132, 102].map((x) => `<circle cx="${x}" cy="100" r="12" class="d-dim" stroke-dasharray="3 2"/>`).join('')}
    <line x1="82" y1="100" x2="42" y2="100" class="d-a" stroke-dasharray="4 3"/>
    <circle cx="42" cy="100" r="12" class="d-a" stroke-dasharray="4 3"/>
    <line x1="252" y1="100" x2="82" y2="100" class="d-b"/>
    <circle cx="82" cy="100" r="12" class="d-b"/><circle cx="82" cy="100" r="3" class="f-b"/>
    <circle cx="70" cy="100" r="3.5" class="f-accent"/>
    <text x="76" y="128" class="t-small">${L('히트', 'hit')}</text>
    <circle cx="262" cy="100" r="10" class="f-dim"/><circle cx="262" cy="100" r="2.5" class="f-accent"/>
    <text x="262" y="126" text-anchor="middle" class="t-small">${L('피벗', 'pivot')}</text>
    <text x="150" y="82" text-anchor="middle" class="t-small t-dim">${L('프로브 구체 (반지름 r)', 'probe sphere (radius r)')}</text>
    <text x="110" y="146" class="t-b">${L('B: 짧아진 암', 'B: shortened arm')}</text>
    <text x="16" y="186" class="t-a">${L('A: 고정 길이, 카메라가 벽 속', 'A: fixed length, camera inside wall')}</text>
    <line x1="300" y1="20" x2="300" y2="190" class="d-dim"/>
    <text x="316" y="22" class="t-small t-dim">${L('암 길이', 'arm length')}</text>
    <line x1="316" y1="160" x2="530" y2="160" class="d-dim"/>
    <line x1="316" y1="30" x2="316" y2="160" class="d-dim"/>
    <text x="528" y="176" text-anchor="end" class="t-small t-dim">${L('시간', 'time')}</text>
    <line x1="316" y1="44" x2="530" y2="44" class="d-a" stroke-dasharray="5 3"/>
    <text x="528" y="38" text-anchor="end" class="t-small t-a">${L('원하는 길이', 'desired length')}</text>
    <rect x="380" y="34" width="70" height="128" class="f-dim" opacity="0.5"/>
    <text x="415" y="152" text-anchor="middle" class="t-small t-dim">${L('벽 근처', 'near wall')}</text>
    <path d="M316,44 L380,44 L382,112 L450,112 C470,112 490,50 528,46" class="d-b"/>
    <text x="386" y="104" class="t-small t-b">${L('당김: 빠름', 'pull in: fast')}</text>
    <text x="456" y="92" class="t-small t-b">${L('복귀: 천천히', 'return: slow')}</text>
  </svg>`],
  look: [
    '자동 이동으로 벽 옆을 지나갈 때 A의 카메라가 빨갛게 변함(벽 속). B는 같은 지점에서 암이 짧아져 벽 앞에 멈춤.',
    '기둥이 캐릭터와 카메라 사이에 오면 A는 시야선이 빨강(가림)으로 바뀜. "시야 가림 비율"을 비교하면 B는 0%에 가까움.',
    '아래 그래프에서 B의 실제 길이는 맞으면 바로 떨어지고 천천히 올라감. "복귀 시간"을 0으로 낮추면 기둥을 지날 때마다 길이가 톱니처럼 튐.',
    'B의 "당김 시간"을 0.3초로 올리면 줄어드는 동안 카메라가 잠깐 벽 속에 들어감. 당길 때 감쇠를 짧게 두는 이유.',
    '"프로브 반지름"을 2로 낮추면 카메라가 벽에 거의 붙어 B의 "카메라 벽 속 비율"이 다시 올라감. 프로브가 카메라(근평면)보다 작으면 벽을 뚫는다는 뜻.',
  ],
  refs: [
    { type: 'engine', title: 'Unreal Engine - Using Spring Arm Components', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/using-spring-arm-components-in-unreal-engine', note: '암 길이, 충돌 검사, 카메라 랙 설정 방법.' },
    { type: 'engine', title: 'Unreal Engine API - USpringArmComponent', note: 'TargetArmLength, ProbeSize, ProbeChannel, bDoCollisionTest, bEnableCameraLag, CameraLagSpeed.' },
    { type: 'engine', title: 'Unity Cinemachine - Cinemachine Deoccluder', url: 'https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/CinemachineDeoccluder.html', note: 'Cinemachine 3에서 Collider가 이름을 바꾼 확장. Camera Radius, Damping, Damping When Occluded.' },
    { type: 'engine', title: 'Unity Cinemachine - Third Person Follow (Camera Collisions)', note: 'Damping Into Collision, Damping From Collision으로 당김과 복귀 속도를 따로 정함.' },
    { type: 'engine', title: 'Unity - Physics.SphereCast', url: 'https://docs.unity3d.com/ScriptReference/Physics.SphereCast.html', note: '직접 구현할 때 쓰는 구체 스윕 API.' },
  ],
  params: [
    { key: 'mode', label: '암 방식', type: 'select', group: '기법', options: [
      { value: 'fixed', label: '고정 길이' },
      { value: 'sweep', label: '구체 스윕' },
    ], a: 'fixed', b: 'sweep' },
    { key: 'probe', label: '프로브 반지름', type: 'range', min: 2, max: 30, step: 1, default: 12, when: (p) => p.mode === 'sweep', help: '스윕하는 구체의 반지름 (Probe Size)' },
    { key: 'pullIn', label: '당김 시간 (초)', type: 'range', min: 0, max: 0.4, step: 0.01, default: 0, when: (p) => p.mode === 'sweep', help: '암이 짧아질 때의 감쇠. 0이면 바로 줄어듦' },
    { key: 'returnT', label: '복귀 시간 (초)', type: 'range', min: 0, max: 1.5, step: 0.01, default: 0.45, when: (p) => p.mode === 'sweep', help: '장애물이 사라진 뒤 원래 길이로 돌아가는 감쇠' },
    { key: 'lag', label: '카메라 랙', type: 'bool', group: '카메라 랙', a: false, b: true, help: '원하는 위치가 피벗을 늦게 따라감' },
    { key: 'lagSpeed', label: '랙 속도', type: 'range', min: 1, max: 20, step: 0.5, default: 8, when: (p) => p.lag, help: '클수록 빨리 따라감 (CameraLagSpeed)' },
    { key: 'armLen', label: '암 길이', type: 'int', min: 60, max: 220, default: 150, shared: true, group: '장면' },
    { key: 'armYaw', label: '암 옆 각도 (°)', type: 'int', min: 0, max: 70, default: 25, shared: true, help: '진행 방향 바로 뒤에서 옆으로 돌린 각도' },
    { key: 'speed', label: '이동 속도 (px/s)', type: 'int', min: 50, max: 220, default: 110, shared: true },
    { key: 'auto', label: '자동 이동', type: 'bool', default: true, shared: true },
    { key: 'restart', label: '다시 시작', type: 'button' },
  ],
  en: {
    title: 'Camera Collision (Spring Arm, Deoccluder)',
    summary: 'If a third person camera sits at the end of a fixed length arm, it goes into walls or a pillar hides the character. Sweep a sphere from the pivot toward the camera and shorten the arm to the hit point. Then the view stays open.',
    views: { a: 'Fixed length arm', b: 'Sphere sweep + shorter arm' },
    controls: 'WASD / arrow keys to move the character (pressing a key pauses auto move for a moment)',
    info: `
    <p>A <b>spring arm</b> holds the camera at the end of a stick that reaches back from a pivot (the character). Unreal's <code>SpringArmComponent</code> is the common example.
    This sample is a 2D top-down scene. The arm reaches behind the character's direction of travel, a little to the side.</p>
    <p>With a fixed arm length (A), the camera goes into walls when you walk close to them. If a pillar is between the wall and the character, the view is blocked.</p>
    <p>How it works (B):</p>
    <ul>
      <li>Sweep a sphere of radius r from the pivot to the desired camera spot (Sphere Sweep). In Unreal, <b>Probe Size</b> and <b>Probe Channel</b> set this.</li>
      <li>If the sphere hits something, shorten the arm to the hit distance. The camera stays one radius away from the wall, so its near plane does not cut through.</li>
      <li>When the obstacle is gone, the arm returns to full length. Pull in fast and return slowly, and the picture shakes less. In Cinemachine Deoccluder these are Damping When Occluded and Damping.</li>
      <li><b>Camera lag</b>: the desired spot follows the pivot late. The sweep starts from the real pivot, so the camera does not go through walls even with lag.</li>
    </ul>
    <p>Downside: in tight spaces the arm gets short at once and the view jumps closer. Thin pillars make the arm pop each time they pass, so small objects are often left out of the probe channel.</p>`,
    look: [
      'When auto move passes a wall, A\'s camera turns red (inside the wall). At the same spot, B\'s arm gets shorter and stops in front of the wall.',
      'When a pillar comes between character and camera, A\'s sight line turns red (blocked). Compare "Sight blocked ratio": B stays near 0%.',
      'In the graph below, B\'s actual length drops at once on a hit and rises slowly. Set "Return time" to 0, and the length jumps like a saw at every pillar.',
      'Raise B\'s "Pull-in time" to 0.3 s. The camera goes into the wall for a moment while the arm shrinks. This is why pull-in damping stays short.',
      'Lower "Probe radius" to 2. The camera almost touches the wall, and "Camera in wall ratio" in B goes up again. A probe smaller than the camera (near plane) lets it cut through walls.',
    ],
    refs: ['How to set arm length, collision test, and camera lag.', null, 'The extension that Cinemachine 3 renamed from Collider. Camera Radius, Damping, Damping When Occluded.', 'Damping Into Collision and Damping From Collision set pull-in and return speed on their own.', 'The sphere sweep API you use when you build this yourself.'],
    params: {
      mode: { label: 'Arm method', group: 'Technique', options: { fixed: 'Fixed length', sweep: 'Sphere sweep' } },
      probe: { label: 'Probe radius', help: 'Radius of the swept sphere (Probe Size)' },
      pullIn: { label: 'Pull-in time (s)', help: 'Damping when the arm gets shorter. 0 means it shrinks at once' },
      returnT: { label: 'Return time (s)', help: 'Damping back to full length after the obstacle is gone' },
      lag: { label: 'Camera lag', group: 'Camera lag', help: 'The desired spot follows the pivot late' },
      lagSpeed: { label: 'Lag speed', help: 'Higher follows faster (CameraLagSpeed)' },
      armLen: { label: 'Arm length', group: 'Scene' },
      armYaw: { label: 'Arm side angle (°)', help: 'Angle turned to the side from straight behind the direction of travel' },
      speed: 'Move speed (px/s)',
      auto: 'Auto move',
      restart: 'Restart',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors;
    const P = ctx.params;
    const WW = 640, WH = 400, CR = 10, CAM_R = 4, HIST = 6;
    const PATH = [{ x: 100, y: 95 }, { x: 540, y: 95 }, { x: 540, y: 305 }, { x: 100, y: 305 }];

    let rects, circles, ch, yaw, wp, lagO, curLen, hist, clipT, blockT, totalT, idle, simT;
    const init = () => {
      ctx.rng = U.rng(ctx.seed);
      rects = [
        { x: 0, y: 0, w: WW, h: 16 }, { x: 0, y: WH - 16, w: WW, h: 16 }, { x: 0, y: 0, w: 16, h: WH }, { x: WW - 16, y: 0, w: 16, h: WH },
        { x: 230, y: 150, w: 180, h: 100 },          // 가운데 블록
        { x: 300, y: 16, w: 24, h: 48 },             // 위 벽 돌출
        { x: 300, y: WH - 64, w: 24, h: 48 },        // 아래 벽 돌출
      ];
      // 통로마다 기둥 2개. 경로에서 32~46px 떨어진 곳
      circles = [];
      const segs = [
        { ax: 'x', a: 130, b: 510, line: 95, lo: 16, hi: 150 },
        { ax: 'y', a: 125, b: 275, line: 540, lo: 410, hi: WW - 16 },
        { ax: 'x', a: 130, b: 510, line: 305, lo: 250, hi: WH - 16 },
        { ax: 'y', a: 125, b: 275, line: 100, lo: 16, hi: 230 },
      ];
      for (const s of segs) {
        for (let k = 0; k < 2; k++) {
          for (let tries = 0; tries < 20; tries++) {
            const along = ctx.rng.range(s.a, s.b);
            if (s.ax === 'x' && along > 270 && along < 355) continue;
            const r = ctx.rng.range(10, 16);
            const off = ctx.rng.range(30, 44) * (ctx.rng.range(0, 1) < 0.5 ? -1 : 1);
            const across = s.line + off;
            if (across - r < s.lo + 4 || across + r > s.hi - 4) continue;
            const c = s.ax === 'x' ? { x: along, y: across, r } : { x: across, y: along, r };
            if (circles.some((o) => Math.hypot(o.x - c.x, o.y - c.y) < o.r + c.r + 50)) continue;
            circles.push(c); break;
          }
        }
      }
      ch = { x: PATH[0].x, y: PATH[0].y };
      yaw = 0; wp = 1;
      lagO = { x: ch.x, y: ch.y };
      curLen = P.armLen;
      hist = []; clipT = 0; blockT = 0; totalT = 0; idle = 99; simT = 0;
    };
    init();

    // 원 하나와 장애물 겹침
    const overlap = (x, y, r) => {
      for (const b of rects) {
        const dx = Math.max(b.x - x, 0, x - (b.x + b.w)), dy = Math.max(b.y - y, 0, y - (b.y + b.h));
        if (dx * dx + dy * dy < r * r) return true;
      }
      for (const c of circles) if (Math.hypot(c.x - x, c.y - y) < c.r + r) return true;
      return false;
    };
    // 원 스윕: p에서 n 방향으로 maxD까지. 처음 겹치는 거리 반환
    const sweep = (px, py, nx, ny, maxD, r) => {
      if (overlap(px, py, r)) return 0;
      const stepL = 2;
      for (let d = stepL; d < maxD + stepL; d += stepL) {
        const dd = Math.min(d, maxD);
        if (overlap(px + nx * dd, py + ny * dd, r)) {
          let lo = d - stepL, hi = dd;
          for (let i = 0; i < 8; i++) { const m = (lo + hi) / 2; if (overlap(px + nx * m, py + ny * m, r)) hi = m; else lo = m; }
          return lo;
        }
        if (dd >= maxD) break;
      }
      return maxD;
    };
    const pushOut = (p) => {
      for (const b of rects) {
        const qx = U.clamp(p.x, b.x, b.x + b.w), qy = U.clamp(p.y, b.y, b.y + b.h);
        const dx = p.x - qx, dy = p.y - qy, d = Math.hypot(dx, dy);
        if (d < CR && d > 1e-6) { p.x = qx + (dx / d) * CR; p.y = qy + (dy / d) * CR; }
      }
      for (const c of circles) {
        const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy);
        if (d < c.r + CR && d > 1e-6) { p.x = c.x + (dx / d) * (c.r + CR); p.y = c.y + (dy / d) * (c.r + CR); }
      }
    };

    let st = null;   // 마지막 계산 결과 (render용)
    function step(dt) {
      simT += dt;
      const I = ctx.input;
      let mx = 0, my = 0;
      if (I.key('KeyD') || I.key('ArrowRight')) mx += 1;
      if (I.key('KeyA') || I.key('ArrowLeft')) mx -= 1;
      if (I.key('KeyS') || I.key('ArrowDown')) my += 1;
      if (I.key('KeyW') || I.key('ArrowUp')) my -= 1;
      const manual = mx !== 0 || my !== 0;
      if (manual) idle = 0; else idle += dt;
      let vx = 0, vy = 0;
      if (manual) { const l = Math.hypot(mx, my); vx = mx / l; vy = my / l; }
      else if (P.auto && idle > 2.5) {
        if (idle - dt <= 2.5) {                // 자동 이동 재개: 가장 가까운 지점부터
          let best = 0, bd = Infinity;
          PATH.forEach((q, i) => { const d = Math.hypot(q.x - ch.x, q.y - ch.y); if (d < bd) { bd = d; best = i; } });
          wp = best;
        }
        const q = PATH[wp], dx = q.x - ch.x, dy = q.y - ch.y, d = Math.hypot(dx, dy);
        if (d < 4) wp = (wp + 1) % PATH.length;
        else { vx = dx / d; vy = dy / d; }
      }
      ch.x += vx * P.speed * dt; ch.y += vy * P.speed * dt;
      pushOut(ch);
      if (vx || vy) yaw = U.lerpAngle(yaw, Math.atan2(vy, vx), 1 - Math.exp(-5 * dt));

      // 원하는 카메라 위치: (랙 적용된) 피벗 + 암 방향 * 길이
      if (P.lag) { const k = U.clamp(dt * P.lagSpeed, 0, 1); lagO.x += (ch.x - lagO.x) * k; lagO.y += (ch.y - lagO.y) * k; }
      else { lagO.x = ch.x; lagO.y = ch.y; }
      const ang = yaw + Math.PI + U.rad(P.armYaw);
      const dsx = lagO.x + Math.cos(ang) * P.armLen, dsy = lagO.y + Math.sin(ang) * P.armLen;
      // 스윕은 실제 피벗에서 원하는 위치까지
      let ddx = dsx - ch.x, ddy = dsy - ch.y;
      const full = Math.max(1e-3, Math.hypot(ddx, ddy));
      const nx = ddx / full, ny = ddy / full;
      let hitD = full, cam;
      if (P.mode === 'sweep') {
        hitD = sweep(ch.x, ch.y, nx, ny, full, P.probe);
        if (curLen > full) curLen = full;
        const tau = hitD < curLen ? P.pullIn : P.returnT;
        curLen = tau <= 0 ? hitD : curLen + (hitD - curLen) * (1 - Math.exp(-dt / tau));
        cam = { x: ch.x + nx * curLen, y: ch.y + ny * curLen };
      } else {
        curLen = full;
        cam = { x: dsx, y: dsy };
      }
      const clipped = overlap(cam.x, cam.y, CAM_R);
      const cl = Math.hypot(cam.x - ch.x, cam.y - ch.y);
      const blocked = !clipped && cl > 1 && sweep(cam.x, cam.y, (ch.x - cam.x) / cl, (ch.y - cam.y) / cl, Math.max(0, cl - CR - 1), 0.5) < cl - CR - 1.5;
      totalT += dt; if (clipped) clipT += dt; if (blocked) blockT += dt;
      hist.push({ t: simT, des: full, hit: hitD, act: cl, bad: clipped || blocked });
      while (hist.length && hist[0].t < simT - HIST) hist.shift();
      st = { cam, clipped, blocked, nx, ny, full, hitD, dsx, dsy, manual: idle < 2.5 };
    }
    step(0);

    return {
      update(dt) { step(dt); },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        const GH = 78;
        const s = Math.max(0.1, Math.min((W - 16) / WW, (H - GH - 28) / WH));
        const ox = (W - WW * s) / 2, oy = 8;
        const X = (x) => ox + x * s, Y = (y) => oy + y * s;

        // 장면
        for (const b of rects) D.rect(g, X(b.x), Y(b.y), b.w * s, b.h * s, '#2a2f38', '#3a414d', 1);
        for (const c of circles) D.circle(g, X(c.x), Y(c.y), c.r * s, '#2a2f38', '#4a5260', 1);
        g.setLineDash([2, 6]);
        D.poly(g, PATH.map((q) => ({ x: X(q.x), y: Y(q.y) })), null, 'rgba(255,255,255,0.08)', 1, true);
        g.setLineDash([]);

        const S = st, cam = S.cam;
        // 원하는 위치 (점선)
        g.setLineDash([4, 3]);
        D.line(g, X(cam.x), Y(cam.y), X(S.dsx), Y(S.dsy), C.dim, 1);
        D.circle(g, X(S.dsx), Y(S.dsy), (P.mode === 'sweep' ? P.probe : CAM_R) * s, null, C.dim, 1);
        g.setLineDash([]);
        // 스윕 구체 (B)
        if (P.mode === 'sweep') {
          const n = Math.max(2, Math.floor(S.hitD / Math.max(8, P.probe * 1.4)));
          for (let i = 1; i <= n; i++) {
            const d = (S.hitD * i) / n;
            D.circle(g, X(ch.x + S.nx * d), Y(ch.y + S.ny * d), P.probe * s, null, 'rgba(255,255,255,0.12)', 1);
          }
          if (S.hitD < S.full - 0.5) {
            const hx = ch.x + S.nx * (S.hitD + P.probe), hy = ch.y + S.ny * (S.hitD + P.probe);
            const hs = 4;
            D.line(g, X(hx) - hs, Y(hy) - hs, X(hx) + hs, Y(hy) + hs, C.accent, 2);
            D.line(g, X(hx) + hs, Y(hy) - hs, X(hx) - hs, Y(hy) + hs, C.accent, 2);
            D.circle(g, X(ch.x + S.nx * S.hitD), Y(ch.y + S.ny * S.hitD), P.probe * s, null, C.accent, 1.2);
          }
        }
        // 시야 원뿔 (카메라에서 캐릭터 쪽)
        const va = Math.atan2(ch.y - cam.y, ch.x - cam.x), vlen = Math.hypot(ch.x - cam.x, ch.y - cam.y) + 40, fov = 0.42;
        D.poly(g, [
          { x: X(cam.x), y: Y(cam.y) },
          { x: X(cam.x + Math.cos(va - fov) * vlen), y: Y(cam.y + Math.sin(va - fov) * vlen) },
          { x: X(cam.x + Math.cos(va + fov) * vlen), y: Y(cam.y + Math.sin(va + fov) * vlen) },
        ], S.clipped || S.blocked ? 'rgba(255,83,112,0.08)' : 'rgba(255,255,255,0.05)', null);
        // 암 (피벗에서 카메라까지)
        D.line(g, X(ch.x), Y(ch.y), X(cam.x), Y(cam.y), S.blocked ? C.bad : col, 2);
        // 캐릭터와 진행 방향
        D.circle(g, X(ch.x), Y(ch.y), CR * s, col);
        D.line(g, X(ch.x), Y(ch.y), X(ch.x + Math.cos(yaw) * CR * 1.8), Y(ch.y + Math.sin(yaw) * CR * 1.8), C.text, 2);
        // 카메라
        D.circle(g, X(cam.x), Y(cam.y), Math.max(3, CAM_R * s * 1.3), S.clipped ? C.bad : C.text, col, 2);
        if (S.clipped) D.text(g, GTL.L('벽 속', 'in wall'), X(cam.x) + 8, Y(cam.y) - 14, { size: 10, color: C.bad });
        else if (S.blocked) D.text(g, GTL.L('시야 가림', 'blocked'), X(cam.x) + 8, Y(cam.y) - 14, { size: 10, color: C.bad });

        // 그래프: 원하는 길이, 스윕 히트 거리, 실제 길이
        const gx = Math.min(W * 0.4, 210), gw = W - gx - 10, gy = H - GH - 6, gh = GH;
        if (gw > 40) {
          D.rect(g, gx, gy, gw, gh, 'rgba(0,0,0,0.35)');
          const maxL = 230;
          const px = (tt) => gx + ((tt - (simT - HIST)) / HIST) * gw;
          const py = (v) => gy + gh - 4 - (U.clamp(v, 0, maxL) / maxL) * (gh - 18);
          const series = (key, color, lw, dash) => {
            if (hist.length < 2) return;
            if (dash) g.setLineDash(dash);
            g.beginPath();
            hist.forEach((h, i) => (i ? g.lineTo(px(h.t), py(h[key])) : g.moveTo(px(h.t), py(h[key]))));
            g.strokeStyle = color; g.lineWidth = lw; g.stroke();
            g.setLineDash([]);
          };
          for (const h of hist) if (h.bad) D.rect(g, px(h.t), gy + 1, Math.max(1, gw / (HIST * 60)) + 0.5, 5, C.bad);
          series('des', C.dim, 1, [4, 3]);
          if (P.mode === 'sweep') series('hit', C.warn, 1);
          series('act', col, 2);
          D.text(g, GTL.L('암 길이: ', 'Arm length: ') + GTL.L('원하는(점선)', 'desired (dashed)') + (P.mode === 'sweep' ? GTL.L(', 히트(노랑)', ', hit (yellow)') : '') + GTL.L(', 실제', ', actual'), gx + 4, gy + 7, { size: 9, color: C.dim });
        }

        ctx.stat(GTL.L('카메라 벽 속 비율', 'Camera in wall ratio'), (totalT ? (clipT / totalT) * 100 : 0).toFixed(1) + ' %');
        ctx.stat(GTL.L('시야 가림 비율', 'Sight blocked ratio'), (totalT ? (blockT / totalT) * 100 : 0).toFixed(1) + ' %');
        ctx.stat(GTL.L('암 길이 (실제 / 원하는)', 'Arm length (actual / desired)'), Math.hypot(cam.x - ch.x, cam.y - ch.y).toFixed(0) + ' / ' + S.full.toFixed(0));
        if (S.manual) ctx.stat(GTL.L('조작', 'Control'), GTL.L('키보드', 'Keyboard'));
      },
      onAction(key) { if (key === 'restart') { init(); step(0); } },
    };
  },
});
