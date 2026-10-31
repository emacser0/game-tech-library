// 픽셀 아트 이동/카메라: 서브픽셀 위치를 어떻게 화면에 옮길 것인가 (블러 / 정수 스냅 / 스냅 + 서브픽셀 오프셋)
GTL.register({
  id: 'pixel-snap-camera',
  title: '픽셀 스냅 vs 서브픽셀 카메라',
  summary: '저해상도 픽셀 아트에서 느린 이동을 그대로 그리면 흐려짐. 정수로 스냅하면 카메라가 한 텍셀(여러 화면 픽셀)씩 뚝뚝 끊김. 버퍼는 정수 좌표로 그리고, 남은 소수부만 확대 단계에서 화면 픽셀 단위로 밀면 선명함과 부드러움을 모두 얻음.',
  views: { a: '정수 스냅', b: '스냅 + 서브픽셀 오프셋' },
  controls: '조작 없음. 캐릭터가 천천히 원을 그리며 이동하고 카메라가 따라감.',
  pixelRatio: 1,
  info: `
    <p>픽셀 아트 게임은 보통 320×180 같은 저해상도 버퍼에 그린 뒤 정수 배율로 확대함. 텍셀(texel)은 이 버퍼의 픽셀 하나. 그런데 게임 로직의 위치와 카메라 좌표는 실수.</p>
    <ul>
      <li><b>보간 그리기</b>: 실수 좌표에 그대로 그림(이중선형 샘플링). 텍셀이 번지고, 움직일 때마다 <b>흐려졌다 선명해졌다</b> 반짝임.</li>
      <li><b>정수 스냅</b>: 모든 위치를 반올림함. 선명하지만 카메라가 <b>한 텍셀(배율만큼의 화면 픽셀)</b> 단위로만 움직임. 느린 스크롤이 계단처럼 끊김.
        또 <code>round(player) − round(camera)</code>와 <code>round(player − camera)</code>는 값이 다름. 그래서 카메라가 부드럽게 따라올 때 캐릭터가 1텍셀씩 <b>떨림</b>.</li>
      <li><b>스냅 + 서브픽셀 오프셋</b>: 버퍼를 1텍셀 여유 있게 만듦. 카메라 정수부 기준으로 정수 좌표에 그림. 확대 출력할 때 카메라 소수부 × 배율만큼 <b>화면 픽셀 단위로 밂</b>.
        텍셀은 선명하고 스크롤은 화면 해상도로 부드러움.</li>
    </ul>`,
  diagram: (L) => {
    const texels = (x0, y, cls) => [0, 1, 2, 3].map((i) => `<rect x="${x0 + i * 30}" y="${y}" width="30" height="26" class="f-dim"/><rect x="${x0 + i * 30 + 1}" y="${y + 1}" width="28" height="24" class="${cls}" fill="none"/>`).join('');
    const ruler = (y) => Array.from({ length: 29 }, (_, i) => `<line x1="${14 + i * 5}" y1="${y}" x2="${14 + i * 5}" y2="${y + (i % 6 === 2 ? 6 : 3)}" class="d-dim"/>`).join('');
    const step = (q) => Array.from({ length: 121 }, (_, i) => {
      const t = i / 120, pos = q(18 * t);
      return `${(290 + 240 * t).toFixed(1)},${(150 - pos * 5.5).toFixed(1)}`;
    }).join(' L');
    return `<svg viewBox="0 0 540 186" xmlns="http://www.w3.org/2000/svg">
    <text x="4" y="18">${L('카메라 x = 10.4 텍셀, 배율 6', 'Camera x = 10.4 texels, scale 6')}</text>
    <line x1="24" y1="30" x2="24" y2="140" class="d-accent" stroke-dasharray="3 3"/>
    <text x="4" y="54" class="t-a">A</text>
    ${texels(24, 36, 'd-a')}${ruler(64)}
    <text x="160" y="46" class="t-small t-mono">round(10.4) = 10</text>
    <text x="160" y="60" class="t-small t-a">${L('출력 오프셋 0 px', 'output offset 0 px')}</text>
    <text x="4" y="112" class="t-b">B</text>
    ${texels(14, 94, 'd-b')}${ruler(122)}
    <text x="160" y="104" class="t-small t-mono">floor(10.4) = 10</text>
    <text x="160" y="118" class="t-small t-b">${L('출력 오프셋 -0.4 × 6 ≈ -2 px', 'output offset -0.4 × 6 ≈ -2 px')}</text>
    <text x="4" y="150" class="t-small t-dim">${L('눈금: 화면 픽셀, 1 텍셀 = 6 px', 'Ticks: screen pixels, 1 texel = 6 px')}</text>
    <text x="4" y="164" class="t-small t-dim">${L('A는 텍셀 경계에만 정렬. B는 버퍼를 통째로 화면 픽셀 단위로 밂', 'A aligns only to texel edges. B shifts the whole buffer by screen pixels')}</text>
    <text x="290" y="18">${L('배경의 화면 위치 (시간 →)', 'Background screen position (time →)')}</text>
    <line x1="290" y1="150" x2="530" y2="150" class="d-dim"/><line x1="290" y1="30" x2="290" y2="150" class="d-dim"/>
    <path d="M${step((p) => p)}" class="d-dim" stroke-dasharray="2 3"/>
    <path d="M${step((p) => Math.round(p / 6) * 6)}" class="d-a"/>
    <path d="M${step((p) => Math.round(p))}" class="d-b"/>
    <text x="300" y="44" class="t-small t-dim">${L('점선: 실제 카메라', 'dashed: real camera')}</text>
    <text x="300" y="58" class="t-small t-a">${L('A: 6 px 계단', 'A: 6 px steps')}</text>
    <text x="300" y="72" class="t-small t-b">${L('B: 1 px 단위', 'B: 1 px steps')}</text>
  </svg>`;
  },
  look: [
    '배율 6, 이동 속도 8 정도로 두면 A는 배경이 6px씩 툭툭 끊기며 스크롤됨. B는 같은 선명함으로 부드럽게 흐름.',
    'A에서 카메라 추종 λ를 낮추면 캐릭터가 배경에 대해 1텍셀씩 앞뒤로 떨림.',
    '그리기 방식을 "보간 그리기"로 바꾸면 정지 화면은 비슷하지만 움직이는 동안 타일 경계가 번지고 반짝임.',
    '"카메라 프레임 이동량" 값을 보면 스냅은 0 또는 배율의 배수. 서브픽셀 오프셋은 작고 고른 값.',
  ],
  refs: [
    { type: 'engine', title: 'Unity - 2D Pixel Perfect (Pixel Perfect Camera)', note: 'Upscale Render Texture, Pixel Snapping, Crop Frame 옵션.' },
    { type: 'engine', title: 'Godot - 2D 스냅 설정 (snap_2d_transforms_to_pixel / snap_2d_vertices_to_pixel)', url: 'https://docs.godotengine.org/en/stable/classes/class_projectsettings.html', note: 'Project Settings → rendering/2d/snap.' },
    { type: 'game', title: 'Celeste (Maddy Makes Games)', year: 2018, note: '320×180 저해상도 렌더와 정수 배율 확대의 대표 사례.' },
  ],
  params: [
    { key: 'mode', label: '그리기 방식', type: 'select', group: '스냅', options: [
      { value: 'blur', label: '보간 그리기 (실수 좌표 + 이중선형)' },
      { value: 'snap', label: '정수 스냅' },
      { value: 'subpixel', label: '스냅 + 서브픽셀 카메라 오프셋' },
    ], a: 'snap', b: 'subpixel' },
    { key: 'scale', label: '픽셀 배율', type: 'int', min: 2, max: 10, default: 6, shared: true, group: '장면' },
    { key: 'speed', label: '이동 속도 (텍셀/초)', type: 'range', min: 1, max: 80, step: 0.5, default: 8, shared: true },
    { key: 'follow', label: '카메라 추종 λ', type: 'range', min: 0.5, max: 30, step: 0.5, default: 3, shared: true, help: '높을수록 캐릭터에 딱 붙음' },
  ],
  en: {
    title: 'Pixel Snap vs Subpixel Camera',
    summary: 'In low-resolution pixel art, slow motion drawn as is looks blurry. Snapping to integers makes the camera jump one texel (several screen pixels) at a time. Draw the buffer at integer coordinates, then shift only the leftover fraction in screen pixels when you upscale. You get both sharpness and smoothness.',
    views: { a: 'Integer snap', b: 'Snap + subpixel offset' },
    controls: 'No input. The character moves slowly in a circle and the camera follows.',
    info: `
    <p>Pixel art games usually draw to a low-resolution buffer such as 320×180, then upscale it by an integer factor. A texel is one pixel of this buffer. But game logic positions and camera coordinates are real numbers.</p>
    <ul>
      <li><b>Filtered drawing</b>: draws at the real coordinates as is (bilinear sampling). Texels smear, and the picture <b>flickers between blurry and sharp</b> as things move.</li>
      <li><b>Integer snap</b>: rounds every position. It is sharp, but the camera moves only in steps of <b>one texel (the scale factor in screen pixels)</b>. Slow scrolling moves in stairs.
        Also, <code>round(player) − round(camera)</code> and <code>round(player − camera)</code> give different values. So the character <b>jitters</b> by 1 texel when the camera follows smoothly.</li>
      <li><b>Snap + subpixel offset</b>: makes the buffer 1 texel larger. It draws at integer coordinates based on the integer part of the camera. On upscale, it <b>shifts the output in screen pixels</b> by the camera's fraction × scale.
        Texels stay sharp and scrolling is smooth at screen resolution.</li>
    </ul>`,
    look: [
      'Set the scale to 6 and the move speed to about 8. In A, the background scrolls in 6px jerks. B scrolls smoothly and stays just as sharp.',
      'In A, lower the camera follow λ. The character jitters back and forth by 1 texel against the background.',
      'Change the draw mode to "Filtered drawing". A still frame looks similar, but during movement the tile edges smear and flicker.',
      'Check the "Camera move per frame" value. With snapping it is 0 or a multiple of the scale. With the subpixel offset, it is small and even.',
    ],
    refs: [
      'Upscale Render Texture, Pixel Snapping, and Crop Frame options.',
      { title: 'Godot - 2D snap settings (snap_2d_transforms_to_pixel / snap_2d_vertices_to_pixel)', note: 'Project Settings → rendering/2d/snap.' },
      'A well-known example of a 320×180 low-resolution render with integer upscaling.',
    ],
    params: {
      mode: { label: 'Draw mode', group: 'Snap', options: { blur: 'Filtered drawing (real coords + bilinear)', snap: 'Integer snap', subpixel: 'Snap + subpixel camera offset' } },
      scale: { label: 'Pixel scale', group: 'Scene' },
      speed: 'Move speed (texels/s)',
      follow: { label: 'Camera follow λ', help: 'Higher values stick closer to the character' },
    },
  },

  setup(ctx) {
    const U = GTL.util, C = U.colors, P = ctx.params;
    const T = 16, MAP = 48;
    const noise = U.noise(ctx.seed);
    // 타일 스프라이트 생성
    function tile(base, dots, seed) {
      const c = ctx.createCanvas(T, T), g = c.getContext('2d'), r = U.rng(seed);
      g.fillStyle = base; g.fillRect(0, 0, T, T);
      for (let i = 0; i < 18; i++) { g.fillStyle = r.pick(dots); g.fillRect(r.int(0, T - 1), r.int(0, T - 1), 1, 1); }
      return c;
    }
    const grass = [tile('#2f6b3a', ['#3d8a49', '#285c31', '#4b9c55'], 11), tile('#2f6b3a', ['#3d8a49', '#285c31'], 12)];
    const stone = (() => {
      const c = ctx.createCanvas(T, T), g = c.getContext('2d');
      g.fillStyle = '#6b6457'; g.fillRect(0, 0, T, T);
      g.fillStyle = '#4f493f';
      g.fillRect(0, 7, T, 1); g.fillRect(0, 15, T, 1); g.fillRect(7, 0, 1, 7); g.fillRect(3, 8, 1, 7); g.fillRect(12, 8, 1, 7);
      g.fillStyle = '#8a8272'; g.fillRect(1, 1, 5, 1); g.fillRect(9, 1, 5, 1); g.fillRect(5, 9, 6, 1);
      return c;
    })();
    const water = tile('#2a4f80', ['#3b6aa8', '#4a7cc0'], 13);
    const tree = (() => {
      const c = ctx.createCanvas(12, 16), g = c.getContext('2d');
      g.fillStyle = '#5a3a1e'; g.fillRect(5, 10, 2, 6);
      g.fillStyle = '#1d4d27'; g.fillRect(2, 2, 8, 9); g.fillRect(1, 4, 10, 5); g.fillRect(4, 0, 4, 2);
      g.fillStyle = '#2f7a3c'; g.fillRect(3, 3, 3, 3); g.fillRect(7, 5, 2, 2);
      return c;
    })();
    const hero = [0, 1].map((f) => {
      const c = ctx.createCanvas(8, 11), g = c.getContext('2d');
      g.fillStyle = '#ffd7a8'; g.fillRect(2, 0, 4, 4);
      g.fillStyle = '#000'; g.fillRect(3, 1, 1, 1); g.fillRect(5, 1, 1, 1);
      g.fillStyle = ctx.side === 'a' ? C.a : C.b; g.fillRect(1, 4, 6, 4);
      g.fillStyle = '#3a3f4b';
      if (f === 0) { g.fillRect(2, 8, 1, 3); g.fillRect(5, 8, 1, 3); } else { g.fillRect(1, 8, 1, 3); g.fillRect(6, 8, 1, 2); }
      return c;
    });
    const map = [];
    for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
      const n = noise.fbm2(x * 0.09, y * 0.09, { octaves: 3 });
      map.push(n < -0.22 ? 2 : n > 0.25 ? 1 : 0);
    }
    const trees = [];
    for (let i = 0; i < 70; i++) {
      const x = ctx.rng.range(0, MAP * T), y = ctx.rng.range(0, MAP * T);
      if (map[Math.floor(y / T) * MAP + Math.floor(x / T)] === 0) trees.push({ x: Math.round(x), y: Math.round(y) });
    }
    trees.sort((a, b) => a.y - b.y);

    const center = { x: (MAP * T) / 2, y: (MAP * T) / 2 }, R = 150;
    let ang = 0, player = { x: center.x + R, y: center.y }, cam = null, lastOff = null, frameMove = 0, recent = [], animT = 0;
    let buf = null, bg = null;

    function viewTexels() { return { w: Math.ceil(ctx.width / P.scale), h: Math.ceil(ctx.height / P.scale) }; }
    // 카메라 → 버퍼 원점(월드 텍셀) + 업스케일 출력 오프셋(화면 px)
    function offsets(c, mode, S) {
      if (mode === 'blur') return { ox: c.x, oy: c.y, dx: 0, dy: 0 };
      if (mode === 'snap') return { ox: Math.round(c.x), oy: Math.round(c.y), dx: 0, dy: 0 };
      const ox = Math.floor(c.x), oy = Math.floor(c.y);
      return { ox, oy, dx: Math.round(-(c.x - ox) * S), dy: Math.round(-(c.y - oy) * S) };
    }
    function ensureBuffer(w, h) {
      if (!buf || buf.width !== w || buf.height !== h) { buf = ctx.createCanvas(w, h); bg = buf.getContext('2d'); }
    }

    return {
      update(dt) {
        ang += (P.speed / R) * dt;
        player = { x: center.x + Math.cos(ang) * R, y: center.y + Math.sin(ang) * R * 0.7 };
        animT += dt;
        const v = viewTexels(), want = { x: player.x - v.w / 2, y: player.y - v.h / 2 };
        if (!cam) cam = want;
        cam = { x: U.damp(cam.x, want.x, P.follow, dt), y: U.damp(cam.y, want.y, P.follow, dt) };
        // 배경이 화면에서 이번 프레임에 움직인 양 (px)
        const o = offsets(cam, P.mode, P.scale);
        const off = { x: -o.ox * P.scale + o.dx, y: -o.oy * P.scale + o.dy };
        if (lastOff) frameMove = Math.hypot(off.x - lastOff.x, off.y - lastOff.y);
        lastOff = off;
        recent.push(frameMove); if (recent.length > 60) recent.shift();
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height, S = P.scale, mode = P.mode;
        const v = viewTexels();
        const c = cam || { x: player.x - v.w / 2, y: player.y - v.h / 2 };
        ensureBuffer(v.w + 2, v.h + 2);
        bg.setTransform(1, 0, 0, 1, 0, 0);
        bg.imageSmoothingEnabled = mode === 'blur';
        bg.fillStyle = '#000'; bg.fillRect(0, 0, buf.width, buf.height);
        // 버퍼 원점(월드 좌표)
        const { ox, oy, dx, dy } = offsets(c, mode, S);
        const place = (wx, wy) => (mode === 'blur' ? { x: wx - ox, y: wy - oy } : { x: Math.round(wx) - ox, y: Math.round(wy) - oy });
        const tx0 = Math.max(0, Math.floor(ox / T)), ty0 = Math.max(0, Math.floor(oy / T));
        const tx1 = Math.min(MAP - 1, Math.floor((ox + buf.width) / T)), ty1 = Math.min(MAP - 1, Math.floor((oy + buf.height) / T));
        for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
          const k = map[ty * MAP + tx];
          const img = k === 1 ? stone : k === 2 ? water : grass[(tx * 7 + ty * 13) % 2];
          const p = place(tx * T, ty * T);
          bg.drawImage(img, p.x, p.y);
        }
        let heroDrawn = false;
        const drawHero = () => {
          const p = place(player.x - 4, player.y - 11);
          bg.drawImage(hero[Math.floor(animT * 6) % 2], p.x, p.y);
          heroDrawn = true;
        };
        for (const t of trees) {
          if (!heroDrawn && t.y > player.y) drawHero();
          if (t.x + 12 < ox || t.x - 12 > ox + buf.width || t.y + 16 < oy || t.y - 16 > oy + buf.height) continue;
          const p = place(t.x - 6, t.y - 16);
          bg.drawImage(tree, p.x, p.y);
        }
        if (!heroDrawn) drawHero();
        // 확대 출력 (nearest)
        g.imageSmoothingEnabled = false;
        g.drawImage(buf, dx, dy, buf.width * S, buf.height * S);
        g.imageSmoothingEnabled = true;

        const moving = recent.filter((m) => m > 0.01);
        ctx.stat(GTL.L('카메라 프레임 이동량 (최근 1초)', 'Camera move per frame (last 1 s)'), moving.length ? GTL.L(`최소 ${Math.min(...moving).toFixed(1)} / 최대 ${Math.max(...moving).toFixed(1)} px`, `min ${Math.min(...moving).toFixed(1)} / max ${Math.max(...moving).toFixed(1)} px`) : '0 px');
        ctx.stat(GTL.L('움직인 프레임 비율', 'Frames with movement'), recent.length ? ((moving.length / recent.length) * 100).toFixed(0) + ' %' : '-');
        ctx.stat(GTL.L('스크롤 최소 단위', 'Smallest scroll step'), mode === 'snap' ? GTL.L(`${S} px (1텍셀)`, `${S} px (1 texel)`) : mode === 'subpixel' ? '1 px' : GTL.L('연속 (흐림)', 'Continuous (blurry)'));
        U.draw.text(g, mode === 'blur' ? GTL.L('보간 그리기', 'Filtered drawing') : mode === 'snap' ? GTL.L('정수 스냅', 'Integer snap') : GTL.L('스냅 + 서브픽셀 오프셋', 'Snap + subpixel offset'), 8, 8, { size: 12, color: '#fff' });
      },
    };
  },
});
