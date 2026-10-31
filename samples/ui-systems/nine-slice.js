// 9-슬라이스 스케일링: 단순 확대 vs 모서리 고정 9분할
GTL.register({
  id: 'nine-slice',
  title: '9-슬라이스 스케일링',
  summary: 'UI 패널 이미지를 통째로 늘리면 모서리와 테두리가 찌그러짐. 9-슬라이스는 이미지를 9칸으로 나눠 모서리는 그대로 두고 가운데만 늘림.',
  views: { a: '단순 확대', b: '9-슬라이스' },
  controls: '뷰 안에서 드래그하면 큰 패널의 오른쪽 아래 모서리가 따라옴. 자동 크기 변화를 끄면 드래그한 크기가 유지됨.',
  info: `
    <p><b>9-슬라이스</b>(9-slice, 9-patch)는 작은 테두리 이미지 하나로 여러 크기의 패널을 그리는 방법</p>
    <p>이미지 하나를 패널마다 그대로 늘리면 문제가 생김</p>
    <ul>
      <li>모서리의 둥근 곡선과 장식이 타원으로 찌그러짐</li>
      <li>테두리 두께가 패널 크기에 따라 달라짐</li>
      <li>크기별로 이미지를 따로 만들면 메모리와 작업량이 늘어남</li>
    </ul>
    <p>동작 원리: 원본을 가로 3칸, 세로 3칸으로 나눔</p>
    <ul>
      <li>네 모서리: 원본 크기 그대로 그림</li>
      <li>위아래 테두리: 가로로만 늘림. 좌우 테두리: 세로로만 늘림.</li>
      <li>가운데: 남은 영역을 채우도록 양방향으로 늘림</li>
      <li>테두리 반복 방식은 늘리는 대신 무늬를 반복해서 붙임. 줄무늬나 사슬 같은 테두리에 맞음.</li>
    </ul>
    <p>단점: 그리기 호출이 1번에서 9번으로 늘어남. 패널이 모서리 두 개보다 작아지면 모서리를 줄여야 함. 엔진은 보통 9칸을 메시 하나로 묶어 호출 수 문제를 없앰.</p>`,
  // 도식: 원본 9칸, 통째로 늘린 패널(모서리 찌그러짐), 9-슬라이스 패널(모서리 고정)
  diagram: (L) => `<svg viewBox="0 0 540 172" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <text x="60" y="22" text-anchor="middle">${L('원본 (9칸)', 'Source (9 cells)')}</text>
    <rect x="20" y="40" width="80" height="80" rx="12" class="d-line"/>
    <line x1="36" y1="40" x2="36" y2="120" class="d-dim" stroke-dasharray="3 2"/><line x1="84" y1="40" x2="84" y2="120" class="d-dim" stroke-dasharray="3 2"/>
    <line x1="20" y1="56" x2="100" y2="56" class="d-dim" stroke-dasharray="3 2"/><line x1="20" y1="104" x2="100" y2="104" class="d-dim" stroke-dasharray="3 2"/>
    <path d="M106,80 L132,80" class="d-accent" marker-end="url(#arr)"/>
    <text x="230" y="22" text-anchor="middle" class="t-a">${L('A: 통째로 늘림', 'A: stretch whole')}</text>
    <rect x="140" y="30" width="180" height="100" rx="27" ry="15" class="d-a"/>
    <text x="230" y="84" text-anchor="middle" class="t-small t-dim">${L('가로 2.25배, 세로 1.25배', 'x 2.25, y 1.25')}</text>
    <text x="230" y="148" text-anchor="middle" class="t-small t-a">${L('모서리 곡선이 타원으로 찌그러짐', 'Corner curves become ovals')}</text>
    <text x="440" y="22" text-anchor="middle" class="t-b">${L('B: 9-슬라이스', 'B: 9-slice')}</text>
    <rect x="350" y="30" width="16" height="16" class="f-b" opacity="0.35"/><rect x="514" y="30" width="16" height="16" class="f-b" opacity="0.35"/>
    <rect x="350" y="114" width="16" height="16" class="f-b" opacity="0.35"/><rect x="514" y="114" width="16" height="16" class="f-b" opacity="0.35"/>
    <rect x="350" y="30" width="180" height="100" rx="12" class="d-b"/>
    <line x1="366" y1="30" x2="366" y2="130" class="d-dim" stroke-dasharray="3 2"/><line x1="514" y1="30" x2="514" y2="130" class="d-dim" stroke-dasharray="3 2"/>
    <line x1="350" y1="46" x2="530" y2="46" class="d-dim" stroke-dasharray="3 2"/><line x1="350" y1="114" x2="530" y2="114" class="d-dim" stroke-dasharray="3 2"/>
    <path d="M384,38 L496,38" class="d-accent" marker-start="url(#arr)" marker-end="url(#arr)"/>
    <path d="M358,58 L358,102" class="d-accent" marker-start="url(#arr)" marker-end="url(#arr)"/>
    <text x="440" y="84" text-anchor="middle" class="t-small">${L('가운데: 양방향', 'Center: both ways')}</text>
    <text x="440" y="148" text-anchor="middle" class="t-small t-b">${L('모서리 고정, 나머지만 늘림', 'Corners fixed, rest stretches')}</text>
    <text x="4" y="168" class="t-small t-dim">${L('모서리 칸은 원본 크기 그대로, 테두리 칸은 한 방향, 가운데 칸은 두 방향으로 늘림', 'Corner cells keep their size, edge cells stretch one way, the center stretches both ways')}</text>
  </svg>`,
  look: [
    '처음 화면에서 A의 리벳(모서리 원)이 넓은 패널에서는 가로 타원, 좁고 긴 패널에서는 세로 타원이 됨. B는 모든 패널에서 원 모양 유지.',
    'B의 "슬라이스 테두리"를 4px로 줄이면 모서리 장식이 가운데 칸에 들어가서 B도 찌그러짐. 테두리 값은 장식 크기 이상이어야 함.',
    'B의 방식을 "테두리 반복"으로 바꾸면 테두리 줄무늬 간격이 패널 크기와 관계없이 일정해짐. 대신 그리기 호출 수가 늘어남.',
    '자동 크기 변화를 끄고 큰 패널을 아주 작게 드래그하면 9-슬라이스의 모서리가 패널 크기에 맞춰 줄어듦',
  ],
  refs: [
    { type: 'engine', title: 'Unity Manual - 9-slicing', url: 'https://docs.unity3d.com/Manual/9SliceSprites.html', note: 'Sprite Editor에서 테두리를 지정하고 Draw Mode를 Sliced 또는 Tiled로 설정' },
    { type: 'engine', title: 'Godot - NinePatchRect', url: 'https://docs.godotengine.org/en/stable/classes/class_ninepatchrect.html', note: 'axis_stretch_horizontal 값으로 늘리기와 반복을 고름' },
    { type: 'engine', title: 'Android Developers - Create resizable bitmaps (9-Patch files)', url: 'https://developer.android.com/studio/write/draw9patch' },
    { type: 'article', title: 'MDN - border-image', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/border-image', note: '웹 CSS의 9-슬라이스. stretch, repeat, round 옵션.' },
  ],
  params: [
    { key: 'mode', label: '그리기 방식', type: 'select', group: '패널', options: [
      { value: 'stretch', label: '단순 확대' },
      { value: 'slice', label: '9-슬라이스 (늘리기)' },
      { value: 'tile', label: '9-슬라이스 (테두리 반복)' },
    ], a: 'stretch', b: 'slice' },
    { key: 'border', label: '슬라이스 테두리 (px)', type: 'int', min: 4, max: 30, default: 22, when: (p) => p.mode !== 'stretch', help: '원본 64px 이미지에서 모서리로 볼 두께' },
    { key: 'auto', label: '자동 크기 변화', type: 'bool', default: true, shared: true, group: '장면' },
    { key: 'guides', label: '분할선 표시', type: 'bool', default: true },
  ],
  en: {
    title: '9-Slice Scaling',
    summary: 'If you stretch a whole UI panel image, its corners and border get squashed. 9-slice cuts the image into 9 cells. It keeps the corners as they are and stretches only the middle.',
    views: { a: 'Plain stretch', b: '9-slice' },
    controls: 'Drag inside a view. The bottom right corner of the big panel follows the mouse. Turn off auto resize to keep the size you dragged.',
    info: `
    <p><b>9-slice</b> (9-patch) is a way to draw panels of many sizes from one small border image.</p>
    <p>If you stretch one image to fit each panel, you get problems.</p>
    <ul>
      <li>Round corners and decorations squash into ovals.</li>
      <li>Border thickness changes with panel size.</li>
      <li>Making a separate image for each size costs more memory and work.</li>
    </ul>
    <p>How it works: cut the source into 3 columns and 3 rows.</p>
    <ul>
      <li>Four corners: draw at their original size.</li>
      <li>Top and bottom edges: stretch only horizontally. Left and right edges: stretch only vertically.</li>
      <li>Center: stretch both ways to fill the rest.</li>
      <li>Tiled border mode repeats the pattern instead of stretching it. It suits borders like stripes or chains.</li>
    </ul>
    <p>Downside: draw calls go from 1 to 9. If a panel gets smaller than two corners, you must shrink the corners. Engines usually merge the 9 cells into one mesh to remove the draw call cost.</p>`,
    look: [
      'Look at the first screen. In A, the rivets (corner circles) become wide ovals on the wide panel and tall ovals on the narrow, tall panel. In B, they stay round on every panel.',
      'Lower B\'s "Slice border" to 4px. The corner decoration falls into the center cell, so B squashes too. The border value must be at least the size of the decoration.',
      'Switch B\'s mode to "Tiled border". The border stripes keep the same spacing at any panel size. The cost is more draw calls.',
      'Turn off auto resize and drag the big panel very small. The 9-slice corners shrink to fit the panel.',
    ],
    refs: [
      'Set the border in the Sprite Editor, then set Draw Mode to Sliced or Tiled.',
      'Use axis_stretch_horizontal to choose between stretch and tile.',
      null,
      'The 9-slice of web CSS. It has stretch, repeat, and round options.',
    ],
    params: {
      mode: { label: 'Draw mode', group: 'Panel', options: { stretch: 'Plain stretch', slice: '9-slice (stretch)', tile: '9-slice (tiled border)' } },
      border: { label: 'Slice border (px)', help: 'How thick the corners are in the 64px source image' },
      auto: { label: 'Auto resize', group: 'Scene' },
      guides: 'Show slice lines',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const S = 64; // 원본 이미지 크기

    // 원본 패널 이미지를 코드로 생성
    const src = ctx.createCanvas(S, S);
    const sg = src.getContext('2d');
    (function paint() {
      const r = 14;
      const path = (x, y, w, h, rr) => {
        sg.beginPath();
        sg.moveTo(x + rr, y); sg.lineTo(x + w - rr, y); sg.arcTo(x + w, y, x + w, y + rr, rr);
        sg.lineTo(x + w, y + h - rr); sg.arcTo(x + w, y + h, x + w - rr, y + h, rr);
        sg.lineTo(x + rr, y + h); sg.arcTo(x, y + h, x, y + h - rr, rr);
        sg.lineTo(x, y + rr); sg.arcTo(x, y, x + rr, y, rr); sg.closePath();
      };
      path(1, 1, S - 2, S - 2, r);
      sg.fillStyle = '#6b4a1f'; sg.fill();
      path(5, 5, S - 10, S - 10, r - 4);
      sg.fillStyle = '#e0b354'; sg.fill();
      // 테두리 줄무늬 (반복 방식에서 차이가 보이는 무늬)
      sg.fillStyle = '#9c7428';
      for (let i = 20; i < S - 20; i += 6) { sg.fillRect(i, 6, 3, 4); sg.fillRect(i, S - 10, 3, 4); sg.fillRect(6, i, 4, 3); sg.fillRect(S - 10, i, 4, 3); }
      path(11, 11, S - 22, S - 22, r - 8);
      sg.fillStyle = '#2b3448'; sg.fill();
      // 모서리 리벳 (원이 찌그러지는지 확인용)
      for (const [x, y] of [[11, 11], [S - 11, 11], [11, S - 11], [S - 11, S - 11]]) {
        sg.beginPath(); sg.arc(x, y, 6, 0, Math.PI * 2); sg.fillStyle = '#f5f0e0'; sg.fill();
        sg.beginPath(); sg.arc(x, y, 3, 0, Math.PI * 2); sg.fillStyle = '#6b4a1f'; sg.fill();
      }
    })();

    let drag = null, t = 0, calls = 0;

    // 9-슬라이스 그리기. 반환값: drawImage 호출 수
    function drawPanel(g, x, y, w, h) {
      if (w < 2 || h < 2) return 0;
      if (P.mode === 'stretch') { g.drawImage(src, 0, 0, S, S, x, y, w, h); return 1; }
      const b = P.border;
      const d = Math.min(b, w / 2, h / 2); // 화면에 그릴 모서리 크기 (패널이 작으면 줄임)
      const sx = [0, b, S - b, S], dx = [x, x + d, x + w - d, x + w];
      const sy = [0, b, S - b, S], dy = [y, y + d, y + h - d, y + h];
      let n = 0;
      for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 3; i++) {
          const sw = sx[i + 1] - sx[i], sh = sy[j + 1] - sy[j];
          const dw = dx[i + 1] - dx[i], dh = dy[j + 1] - dy[j];
          if (dw <= 0 || dh <= 0) continue;
          const edgeH = i === 1 && j !== 1, edgeV = j === 1 && i !== 1;
          if (P.mode === 'tile' && (edgeH || edgeV)) {
            // 테두리 반복: 원본 조각 크기로 이어 붙이고 마지막 조각은 잘라 붙임
            const step = edgeH ? sw * (d / b) : sh * (d / b);
            const len = edgeH ? dw : dh;
            for (let o = 0; o < len - 0.01; o += step) {
              const part = Math.min(step, len - o) / step;
              if (edgeH) g.drawImage(src, sx[i], sy[j], sw * part, sh, dx[i] + o, dy[j], step * part, dh);
              else g.drawImage(src, sx[i], sy[j], sw, sh * part, dx[i], dy[j] + o, dw, step * part);
              n++;
            }
          } else { g.drawImage(src, sx[i], sy[j], sw, sh, dx[i], dy[j], dw, dh); n++; }
        }
      }
      if (P.guides) {
        g.setLineDash([3, 3]);
        for (const xx of [dx[1], dx[2]]) D.line(g, xx, y, xx, y + h, 'rgba(255,83,112,0.7)', 1);
        for (const yy of [dy[1], dy[2]]) D.line(g, x, yy, x + w, yy, 'rgba(255,83,112,0.7)', 1);
        g.setLineDash([]);
      }
      return n;
    }

    return {
      update(dt) {
        t += dt;
        const m = ctx.input.mouse;
        if (m.down && m.inside) drag = { x: m.x, y: m.y };
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        const col = ctx.side === 'a' ? C.a : C.b;
        g.imageSmoothingEnabled = true;
        D.grid(g, W, H, 32);
        calls = 0;
        // 원본 이미지 (2배 확대)
        const ox = 12, oy = 26, z = 2;
        D.text(g, GTL.L(`원본 ${S}×${S}px`, `Source ${S}×${S}px`), ox, 8, { size: 11, color: C.dim });
        g.imageSmoothingEnabled = false;
        g.drawImage(src, ox, oy, S * z, S * z);
        g.imageSmoothingEnabled = true;
        if (P.mode !== 'stretch' && P.guides) {
          const b = P.border * z;
          g.setLineDash([3, 3]);
          for (const v of [b, S * z - b]) { D.line(g, ox + v, oy, ox + v, oy + S * z, C.bad, 1); D.line(g, ox, oy + v, ox + S * z, oy + v, C.bad, 1); }
          g.setLineDash([]);
        }

        // 큰 패널: 자동 크기 변화 또는 드래그
        const px = 160, py = 26;
        let pw, ph;
        if (P.auto && !(ctx.input.mouse.down && ctx.input.mouse.inside)) {
          pw = U.lerp(70, W - px - 16, 0.5 + 0.5 * Math.sin(t * 0.9));
          ph = U.lerp(50, H * 0.55 - py, 0.5 + 0.5 * Math.sin(t * 0.63 + 1.3));
        } else if (drag) { pw = drag.x - px; ph = drag.y - py; }
        else { pw = W - px - 16; ph = H * 0.4; }
        pw = U.clamp(pw, 10, W - px - 8); ph = U.clamp(ph, 10, H - py - 110);
        calls += drawPanel(g, px, py, pw, ph);
        D.text(g, `${pw.toFixed(0)}×${ph.toFixed(0)}`, px + pw / 2, py + ph / 2, { size: 12, color: '#fff', align: 'center', baseline: 'middle' });

        // 고정 크기 패널 3개: 넓은 버튼, 좁고 긴 바, 원본 크기
        const by = H - 92;
        const fixed = [[12, by, Math.min(260, W * 0.42), 46, GTL.L('넓은 버튼', 'Wide button')], [Math.min(290, W * 0.47), by - 34, 40, 120, ''], [Math.min(350, W * 0.57), by, S, S, GTL.L('원본 크기', 'Source size')]];
        for (const [x, y, w, h, label] of fixed) {
          calls += drawPanel(g, x, y, w, h);
          if (label) D.text(g, label, x + w / 2, y + h / 2, { size: 12, color: '#fff', align: 'center', baseline: 'middle' });
        }

        // 측정값: 모서리가 원본 대비 몇 배로 그려졌는지
        let cx, cy;
        if (P.mode === 'stretch') { cx = pw / S; cy = ph / S; }
        else { const d = Math.min(P.border, pw / 2, ph / 2); cx = cy = d / P.border; }
        const distort = Math.max(cx, cy) / Math.max(1e-6, Math.min(cx, cy));
        D.text(g, P.mode === 'stretch' ? GTL.L('모서리도 같이 늘어남', 'Corners stretch too') : GTL.L('모서리 크기 고정', 'Corner size fixed'), W - 12, H - 22, { size: 12, color: col, align: 'right' });
        ctx.stat(GTL.L('큰 패널 모서리 배율 (가로, 세로)', 'Big panel corner scale (x, y)'), `${cx.toFixed(2)}, ${cy.toFixed(2)}`);
        ctx.stat(GTL.L('모서리 찌그러짐 (가로/세로 비)', 'Corner distortion (x/y ratio)'), distort.toFixed(2) + (distort > 1.05 ? GTL.L(' (왜곡)', ' (distorted)') : ''));
        ctx.stat(GTL.L('drawImage 호출 수 (패널 4개)', 'drawImage calls (4 panels)'), calls);
      },
    };
  },
});
