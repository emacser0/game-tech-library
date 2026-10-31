// 앵커 & 세이프 에어리어: 고정 좌표 배치 vs 앵커 기반 배치
GTL.register({
  id: 'anchor-safe-area',
  title: '앵커 & 세이프 에어리어',
  summary: '16:9 화면 기준 좌표로 UI를 고정하면 다른 화면 비율에서 요소가 잘리거나 가운데로 몰림. 앵커와 세이프 에어리어를 쓰면 화면 비율과 노치에 맞춰 요소가 제자리를 찾음.',
  views: { a: '고정 좌표', b: '앵커 + 세이프 에어리어' },
  controls: '뷰 안에서 마우스를 누른 채 좌우로 움직이면 화면 비율이 바뀜. 손을 떼면 자동 순환으로 돌아감.',
  info: `
    <p><b>앵커</b>(anchor)는 UI 요소를 화면의 어느 지점에 붙일지 정하는 값. 예: 미니맵은 오른쪽 위(1, 0), 조이스틱은 왼쪽 아래(0, 1).</p>
    <p><b>세이프 에어리어</b>(safe area)는 노치, 둥근 모서리, 홈 표시줄에 가리지 않는 영역. 휴대폰 OS가 화면마다 알려 줌.</p>
    <p>고정 좌표 방식의 문제:</p>
    <ul>
      <li>1280×720 기준 좌표에 배율만 곱하면 4:3에서 오른쪽 요소가 화면 밖으로 나감</li>
      <li>21:9에서는 오른쪽 요소가 가운데 쪽에 떠 있음</li>
      <li>노치가 있는 휴대폰에서 체력바와 버튼이 노치에 가려짐</li>
    </ul>
    <p>앵커 방식: 요소 위치 = 기준 사각형의 앵커 지점 + 오프셋 × 배율. 기준 사각형은 화면 전체 대신 세이프 에어리어를 씀.
    배경과 게임 화면은 화면 전체에 그리고, 조작 UI만 세이프 에어리어 안에 둠.</p>
    <p>단점: 요소마다 앵커를 정해야 함. 아주 넓거나 좁은 비율에서는 요소끼리 겹칠 수 있어서 비율별 레이아웃이나 최소 간격 검사가 따로 필요.</p>`,
  // 도식: 16:9 기준 좌표를 배율만 곱해 21:9 화면에 놓은 위치(A) vs 세이프 에어리어 앵커 위치(B)
  diagram: (L) => `<svg viewBox="0 0 540 180" xmlns="http://www.w3.org/2000/svg">
    <text x="95" y="24" text-anchor="middle">${L('기준 화면 16:9', 'Reference 16:9')}</text>
    <rect x="20" y="36" width="150" height="84" class="d-line"/>
    <rect x="24" y="42" width="36" height="6" class="f-dim"/>
    <rect x="144" y="40" width="22" height="16" class="f-dim"/>
    <text x="166" y="68" text-anchor="end" class="t-small t-dim">${L('미니맵', 'minimap')}</text>
    <text x="42" y="60" text-anchor="middle" class="t-small t-dim">${L('체력바', 'health')}</text>
    <text x="370" y="20" text-anchor="middle">${L('21:9 화면 + 노치', '21:9 screen + notch')}</text>
    <rect x="220" y="30" width="300" height="100" class="d-line"/>
    <rect x="240" y="34" width="260" height="92" class="d-dim" stroke-dasharray="4 3"/>
    <text x="496" y="122" text-anchor="end" class="t-small t-dim">${L('세이프 에어리어', 'safe area')}</text>
    <rect x="226" y="40" width="44" height="7" class="f-a"/>
    <rect x="244" y="56" width="44" height="7" class="f-b"/>
    <rect x="220" y="34" width="14" height="52" rx="5" class="f-dim"/>
    <text x="227" y="100" text-anchor="middle" class="t-small t-dim">${L('노치', 'notch')}</text>
    <text x="294" y="47" class="t-small t-a">${L('A: 노치에 가림', 'A: under notch')}</text>
    <rect x="370" y="38" width="26" height="19" class="f-a" opacity="0.8"/>
    <text x="383" y="72" text-anchor="middle" class="t-small t-a">${L('A: 가운데 쪽에 뜸', 'A: floats inward')}</text>
    <rect x="474" y="38" width="26" height="19" class="f-b" opacity="0.8"/>
    <text x="487" y="72" text-anchor="middle" class="t-small t-b">${L('B: 오른쪽 앵커', 'B: right anchor')}</text>
    <text x="4" y="150" class="t-small t-a">${L('A: 위치 = 기준 좌표 × 배율 (화면 비율, 노치 무시)', 'A: position = reference coords × scale (ignores aspect and notch)')}</text>
    <text x="4" y="168" class="t-small t-b">${L('B: 위치 = 세이프 에어리어의 앵커 지점 + 오프셋 × 배율', 'B: position = anchor point of the safe area + offset × scale')}</text>
  </svg>`,
  look: [
    '자동 순환 중 4:3이 되면 A의 미니맵과 스킬 버튼이 화면 오른쪽 밖으로 잘림(빨간 테두리). B는 오른쪽 가장자리에 붙어 있음.',
    '21:9가 되면 A의 오른쪽 요소가 화면 가운데 쪽에 떠 있음. B는 가장자리를 따라감.',
    '"노치 + 홈 표시줄"을 켠 상태에서 A의 체력바와 조이스틱이 노치나 홈 표시줄 영역(빗금)과 겹침. B의 방식을 "앵커만"으로 바꾸면 B도 노치와 겹침.',
  ],
  refs: [
    { type: 'engine', title: 'Unity UI - Basic Layout (Rect Transform, Anchors)', url: 'https://docs.unity3d.com/Packages/com.unity.ugui@1.0/manual/UIBasicLayout.html' },
    { type: 'engine', title: 'Unity Scripting API - Screen.safeArea', url: 'https://docs.unity3d.com/ScriptReference/Screen-safeArea.html' },
    { type: 'engine', title: 'Godot - Size and anchors', url: 'https://docs.godotengine.org/en/stable/tutorials/ui/size_and_anchors.html' },
    { type: 'article', title: 'Apple Human Interface Guidelines - Layout', url: 'https://developer.apple.com/design/human-interface-guidelines/layout', note: '세이프 에어리어와 노치 주변 배치 기준' },
    { type: 'article', title: 'MDN - env() (safe-area-inset-*)', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/env', note: '웹에서 세이프 에어리어 여백을 읽는 방법' },
  ],
  params: [
    { key: 'aspect', label: '화면 비율', type: 'select', group: '화면', shared: true, options: [
      { value: 1.3333, label: '4:3 (태블릿)' },
      { value: 1.6, label: '16:10' },
      { value: 1.7778, label: '16:9 (기준)' },
      { value: 2.1667, label: '19.5:9 (휴대폰)' },
      { value: 2.3333, label: '21:9 (울트라와이드)' },
    ], default: 2.1667 },
    { key: 'cycle', label: '비율 자동 순환', type: 'bool', default: true, shared: true },
    { key: 'notch', label: '노치 + 홈 표시줄', type: 'bool', default: true, shared: true },
    { key: 'mode', label: '배치 방식', type: 'select', group: '레이아웃', options: [
      { value: 'fixed', label: '고정 좌표 (1280×720 기준)' },
      { value: 'anchor', label: '앵커만 (화면 전체 기준)' },
      { value: 'safe', label: '앵커 + 세이프 에어리어' },
    ], a: 'fixed', b: 'safe' },
    { key: 'showAnchors', label: '앵커 지점 표시', type: 'bool', default: true },
  ],
  en: {
    title: 'Anchors & Safe Area',
    summary: 'If you pin UI to coordinates made for a 16:9 screen, elements get cut off or drift to the center on other aspect ratios. With anchors and a safe area, elements find their place for any aspect ratio and notch.',
    views: { a: 'Fixed coordinates', b: 'Anchors + safe area' },
    controls: 'Hold the mouse button in a view and move left or right to change the aspect ratio. Release it to go back to auto cycle.',
    info: `
    <p>An <b>anchor</b> tells which point of the screen a UI element sticks to. Example: the minimap uses top right (1, 0), the joystick uses bottom left (0, 1).</p>
    <p>The <b>safe area</b> is the part of the screen that the notch, round corners, and home indicator do not cover. The phone OS reports it for each screen.</p>
    <p>Problems with fixed coordinates:</p>
    <ul>
      <li>If you only scale 1280×720 coordinates, right side elements go off screen at 4:3.</li>
      <li>At 21:9, right side elements float toward the center.</li>
      <li>On phones with a notch, the health bar and buttons hide behind the notch.</li>
    </ul>
    <p>Anchor method: element position = anchor point of the reference rect + offset × scale. The reference rect is the safe area, not the full screen.
    Draw the background and game view on the full screen. Keep only the control UI inside the safe area.</p>
    <p>Downside: you must set an anchor for each element. On very wide or narrow ratios, elements can overlap. You then need per-ratio layouts or a minimum spacing check.</p>`,
    look: [
      'Wait for 4:3 during auto cycle. A\'s minimap and skill button get cut off past the right edge (red outline). B stays stuck to the right edge.',
      'At 21:9, A\'s right side elements float toward the center. B follows the edge.',
      'With "Notch + home indicator" on, A\'s health bar and joystick overlap the notch or home indicator area (hatched). Switch B\'s mode to "Anchors only" and B overlaps the notch too.',
    ],
    refs: [
      null,
      null,
      null,
      'Guidelines for the safe area and layout around the notch.',
      'How to read safe area insets on the web.',
    ],
    params: {
      aspect: { label: 'Aspect ratio', group: 'Screen', options: { '1.3333': '4:3 (tablet)', '1.7778': '16:9 (reference)', '2.1667': '19.5:9 (phone)', '2.3333': '21:9 (ultrawide)' } },
      cycle: 'Auto cycle ratio',
      notch: 'Notch + home indicator',
      mode: { label: 'Layout mode', group: 'Layout', options: { fixed: 'Fixed coordinates (1280×720)', anchor: 'Anchors only (full screen)', safe: 'Anchors + safe area' } },
      showAnchors: 'Show anchor points',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const DW = 1280, DH = 720; // 기준 해상도
    const ASPECTS = [1.3333, 1.6, 1.7778, 2.1667, 2.3333];
    // 요소: 기준 해상도에서의 위치(x,y,w,h)와 앵커(ax, ay)
    const ELEMS = [
      { name: GTL.L('체력바', 'Health'), x: 24, y: 20, w: 300, h: 36, ax: 0, ay: 0, color: '#ff5370' },
      { name: GTL.L('점수', 'Score'), x: 540, y: 20, w: 200, h: 44, ax: 0.5, ay: 0, color: '#ffcb6b' },
      { name: GTL.L('미니맵', 'Minimap'), x: 1056, y: 20, w: 200, h: 200, ax: 1, ay: 0, color: '#66d17a' },
      { name: GTL.L('조이스틱', 'Joystick'), x: 40, y: 500, w: 180, h: 180, ax: 0, ay: 1, color: '#c792ea' },
      { name: GTL.L('스킬', 'Skill'), x: 1000, y: 540, w: 120, h: 120, ax: 1, ay: 1, color: '#4fc3f7' },
      { name: GTL.L('공격', 'Attack'), x: 1140, y: 480, w: 120, h: 120, ax: 1, ay: 1, color: '#f78c6c' },
      { name: GTL.L('대화창', 'Dialog'), x: 340, y: 560, w: 600, h: 120, ax: 0.5, ay: 1, color: '#89ddff' },
    ];
    let t = 0, aspect = P.aspect, mouseAspect = null;

    return {
      update(dt) {
        t += dt;
        const m = ctx.input.mouse;
        if (m.down && m.inside) mouseAspect = U.remap(U.clamp(m.x / ctx.width, 0, 1), 0, 1, 1.3, 2.4);
        else mouseAspect = null;
        if (mouseAspect) aspect = mouseAspect;
        else if (P.cycle) aspect = ASPECTS[Math.floor(t / 2.2) % ASPECTS.length];
        else aspect = Number(P.aspect);
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        // 시뮬레이션 화면을 뷰 안에 맞춤
        const maxW = W - 24, maxH = H - 56;
        let sw = maxW, sh = sw / aspect;
        if (sh > maxH) { sh = maxH; sw = sh * aspect; }
        const sx = (W - sw) / 2, sy = 30;
        const s = sh / DH; // 높이 기준 배율
        // 세이프 에어리어 (가로 휴대폰: 좌우 노치 여백, 아래 홈 표시줄)
        const inset = P.notch ? { l: 0.06 * sh, r: 0.06 * sh, t: 0, b: 0.05 * sh } : { l: 0, r: 0, t: 0, b: 0 };
        const safe = { x: sx + inset.l, y: sy + inset.t, w: sw - inset.l - inset.r, h: sh - inset.t - inset.b };

        // 게임 화면 배경 (화면 전체)
        D.rect(g, sx, sy, sw, sh, '#1f2a36');
        for (let i = 0; i < 9; i++) D.circle(g, sx + sw * (0.1 + i * 0.1), sy + sh * 0.55 + Math.sin(i * 1.7) * sh * 0.12, sh * 0.05, 'rgba(102,209,122,0.18)');
        // 노치와 홈 표시줄
        if (P.notch) {
          g.save(); g.beginPath(); g.rect(sx, sy, inset.l, sh); g.rect(sx + sw - inset.r, sy, inset.r, sh); g.rect(sx, sy + sh - inset.b, sw, inset.b); g.clip();
          g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1; g.beginPath();
          for (let k = -sh; k < sw; k += 8) { g.moveTo(sx + k, sy + sh); g.lineTo(sx + k + sh, sy); }
          g.stroke(); g.restore();
          D.rect(g, sx, sy + sh * 0.3, inset.l * 0.55, sh * 0.4, '#000');
          D.rect(g, sx + sw * 0.35, sy + sh - inset.b * 0.55, sw * 0.3, 3, 'rgba(255,255,255,0.6)');
          g.setLineDash([4, 4]); D.rect(g, safe.x, safe.y, safe.w, safe.h, null, 'rgba(102,209,122,0.6)', 1); g.setLineDash([]);
        }

        let clipped = 0, unsafe = 0, maxGap = 0;
        for (const e of ELEMS) {
          let x, y;
          const w = e.w * s, h = e.h * s;
          if (P.mode === 'fixed') { x = sx + e.x * s; y = sy + e.y * s; }
          else {
            const R = P.mode === 'safe' ? safe : { x: sx, y: sy, w: sw, h: sh };
            // 기준 해상도에서 앵커 지점까지의 오프셋을 그대로 유지
            const offX = e.x - e.ax * DW, offY = e.y - e.ay * DH;
            x = R.x + e.ax * R.w + offX * s; y = R.y + e.ay * R.h + offY * s;
            if (ctx.params.showAnchors) {
              const axp = R.x + e.ax * R.w, ayp = R.y + e.ay * R.h;
              D.line(g, axp, ayp, x + e.ax * w, y + e.ay * h, 'rgba(255,255,255,0.35)', 1);
              D.circle(g, axp, ayp, 3, '#fff');
            }
          }
          const out = x < sx - 0.5 || y < sy - 0.5 || x + w > sx + sw + 0.5 || y + h > sy + sh + 0.5;
          const inUnsafe = P.notch && (x < safe.x - 0.5 || x + w > safe.x + safe.w + 0.5 || y + h > safe.y + safe.h + 0.5);
          if (out) clipped++; else if (inUnsafe) unsafe++;
          // 가장자리 요소가 가장자리에서 얼마나 떨어졌는지 (기준 해상도 px)
          // 세이프 방식은 세이프 에어리어 가장자리 기준
          const right = P.mode === 'safe' ? safe.x + safe.w : sx + sw;
          if (e.ax === 1) maxGap = Math.max(maxGap, Math.abs((right - (x + w)) / s - (DW - e.x - e.w)));
          g.save(); g.beginPath(); g.rect(sx, sy, sw, sh); g.clip();
          D.rect(g, x, y, w, h, e.color + '55', e.color, 1.5);
          D.text(g, e.name, x + w / 2, y + h / 2, { size: Math.max(9, 13 * s * 1.6), color: '#fff', align: 'center', baseline: 'middle' });
          g.restore();
          if (out || inUnsafe) D.rect(g, x - 2, y - 2, w + 4, h + 4, null, C.bad, 2);
        }
        D.rect(g, sx, sy, sw, sh, null, 'rgba(255,255,255,0.5)', 1);
        const ratioName = aspect < 1.45 ? '4:3' : aspect < 1.7 ? '16:10' : aspect < 1.9 ? '16:9' : aspect < 2.25 ? '19.5:9' : '21:9';
        D.text(g, GTL.L(`화면 비율 ${aspect.toFixed(2)} (${ratioName})`, `Aspect ratio ${aspect.toFixed(2)} (${ratioName})`), 12, 8, { size: 12, color: col });

        ctx.stat(GTL.L('화면 밖으로 잘린 요소', 'Elements cut off screen'), `${clipped} / ${ELEMS.length}`);
        ctx.stat(GTL.L('노치, 홈 표시줄과 겹친 요소', 'Elements over notch or home indicator'), P.notch ? unsafe : '-');
        ctx.stat(GTL.L('오른쪽 요소의 여백 오차 (기준 px)', 'Right element margin error (ref px)'), maxGap.toFixed(0));
      },
    };
  },
});
