// 부력 & 항력: 중심점 판정 고정 부력 vs 잠긴 부피 비례 부력 + 항력
GTL.register({
  id: 'buoyancy-drag',
  title: '부력 & 항력 (잠긴 부피 비례)',
  summary: '중심점이 물에 들어가면 고정된 힘을 주는 부력은 밀도와 상관없이 모든 상자가 절반만 잠긴 채 끝없이 출렁임. 잠긴 부피에 비례하는 부력과 항력을 쓰면 밀도만큼 잠기고 멈춤.',
  views: { a: '중심점 판정, 항력 없음', b: '잠긴 부피 비례 + 항력' },
  controls: '마우스 클릭: 상자를 잡아 들어 올린 뒤 놓기',
  info: `
    <p><b>부력</b>은 물체가 밀어낸 물의 무게만큼 위로 받는 힘(아르키메데스 원리). <code>F = ρ물 * g * V잠김</code>.</p>
    <p>흔한 단순 구현: 물체 중심이 수면 아래면 일정한 힘을 줌.</p>
    <ul>
      <li>중심이 수면을 지날 때마다 힘이 켜졌다 꺼짐. 출렁임이 멈추지 않음.</li>
      <li>평형점이 늘 "중심 = 수면"이라 가벼운 나무와 무거운 얼음이 똑같이 절반만 잠김.</li>
    </ul>
    <p>잠긴 부피(2D에서는 면적)에 비례시키면 힘이 깊이에 따라 연속으로 변함. 밀도 <code>ρ</code>인 물체는 부피의 <code>ρ / ρ물</code>만 잠기고 평형을 이룸.</p>
    <p>부력만 있으면 스프링처럼 끝없이 진동함. 물의 저항인 <b>항력(Drag)</b>이 에너지를 빼야 멈춤.</p>
    <ul>
      <li>선형 항력 <code>F = -c * v</code>: 느린 속도, 점성이 큰 액체.</li>
      <li>이차 항력 <code>F = -½ ρ Cd A v|v|</code>: 빠른 속도의 물, 공기. 빠를수록 크게 막음.</li>
      <li>둘 다 잠긴 비율을 곱해야 물 밖에서는 항력이 사라짐.</li>
    </ul>
    <p>단점: 실제 게임에서는 회전과 잠긴 모양을 계산해야 함. 보통 물체를 여러 점이나 삼각형으로 나눠 각각 부력을 줌.</p>
    <p>상자 안 초록 점선은 이론 수면 위치(밀도 비율). 수면이 이 선에 맞으면 정답.</p>`,
  // 도식: 잠긴 깊이에 따른 부력. A는 계단(평형이 늘 h/2), B는 비례(평형이 밀도 비율)
  diagram: (L) => `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <line x1="60" y1="160" x2="300" y2="160" class="d-line"/><line x1="60" y1="160" x2="60" y2="22" class="d-line"/>
    <text x="66" y="22" class="t-small">${L('부력 F', 'Buoyancy F')}</text>
    <text x="300" y="186" text-anchor="end" class="t-small">${L('잠긴 깊이', 'Submerged depth')}</text>
    <text x="60" y="174" text-anchor="middle" class="t-small t-mono">0</text>
    <text x="180" y="174" text-anchor="middle" class="t-small t-mono">h/2</text>
    <text x="300" y="174" text-anchor="middle" class="t-small t-mono">h</text>
    <line x1="60" y1="130" x2="300" y2="130" class="d-dim" stroke-dasharray="4 3"/>
    <line x1="60" y1="70" x2="300" y2="70" class="d-dim" stroke-dasharray="4 3"/>
    <text x="54" y="133" text-anchor="end" class="t-small t-dim">${L('나무', 'wood')}</text>
    <text x="54" y="73" text-anchor="end" class="t-small t-dim">${L('얼음', 'ice')}</text>
    <text x="66" y="186" class="t-small t-dim">${L('점선: 물체 무게', 'dashes: object weight')}</text>
    <path d="M60,160 L180,160 L180,48 L300,48" class="d-a"/>
    <path d="M60,160 L300,40" class="d-b"/>
    <circle cx="180" cy="130" r="4" class="f-a"/><circle cx="180" cy="70" r="4" class="f-a"/>
    <circle cx="120" cy="130" r="4" class="f-b"/><circle cx="240" cy="70" r="4" class="f-b"/>
    <line x1="330" y1="34" x2="350" y2="34" class="d-a"/>
    <text x="356" y="31" class="t-small">${L('A: 중심이 잠기면 일정한 힘', 'A: fixed force once center sinks')}</text>
    <text x="356" y="44" class="t-small t-dim">${L('무게선과 h/2에서 만남', 'meets every weight line at h/2')}</text>
    <line x1="330" y1="74" x2="350" y2="74" class="d-b"/>
    <text x="356" y="71" class="t-small">${L('B: 잠긴 부피에 비례', 'B: grows with submerged volume')}</text>
    <text x="356" y="84" class="t-small t-dim">${L('평형 깊이 = ρ / ρ물 × h', 'balance depth = ρ / ρwater × h')}</text>
    <circle cx="340" cy="114" r="4" class="f-dim"/>
    <text x="356" y="111" class="t-small">${L('점 = 힘과 무게가 같은 평형점', 'dot = balance (force = weight)')}</text>
    <text x="356" y="124" class="t-small t-dim">${L('부력만 있으면 이 점 주위로 진동', 'buoyancy alone swings around it')}</text>
    <text x="330" y="152" class="t-small">${L('항력 F = -c v × 잠긴 비율', 'Drag F = -c v × submerged ratio')}</text>
    <text x="330" y="165" class="t-small t-dim">${L('에너지를 빼서 출렁임을 멈춤', 'removes energy and stops the bobbing')}</text>
  </svg>`,
  look: [
    'A는 상자 4개가 밀도와 상관없이 중심 근처까지만 잠긴 채 계속 출렁임. B는 밀도 0.25, 0.5, 0.75 상자가 초록 점선까지 잠기고 출렁임이 빠르게 잦아듦. 10초 뒤 평균 상하 속도는 A 약 170px/s, B 약 10px/s.',
    'B의 항력을 "없음"으로 바꾸면 평형 위치는 맞지만 출렁임이 멈추지 않음. "선형"으로 바꾸면 느린 출렁임까지 더 빨리 멈춤. 이차 항력은 속도가 작을수록 약해지기 때문.',
    'A의 부력 방식만 "잠긴 부피 비례"로 바꾸면 상자마다 초록 점선을 중심으로 흔들림. 항력이 없어 흔들림이 줄지 않음.',
    '파도를 켜면 B의 상자가 수면을 따라 부드럽게 오르내림. A는 중심이 수면을 넘나들 때마다 힘이 끊겨 덜컥거림.',
  ],
  refs: [
    { type: 'book', title: 'Game Physics Engine Development (Ian Millington)', year: 2007, note: '부력 힘 생성기, 항력 힘 생성기 구현.' },
    { type: 'article', title: 'Water interaction model for boats in video games (Jacques Kerner)', year: 2015, note: 'Gamasutra. 메시를 삼각형으로 나눠 잠긴 부분마다 부력과 항력을 계산.' },
    { type: 'article', title: 'Drag equation', url: 'https://en.wikipedia.org/wiki/Drag_equation', note: '이차 항력 식 F = ½ρ v² Cd A.' },
  ],
  params: [
    { key: 'buoy', label: '부력 방식', type: 'select', group: '부력', options: [
      { value: 'center', label: '중심점 판정, 고정 힘' },
      { value: 'volume', label: '잠긴 부피 비례' },
    ], a: 'center', b: 'volume', default: 'center' },
    { key: 'drag', label: '항력', type: 'select', options: [
      { value: 'none', label: '없음' },
      { value: 'linear', label: '선형 (-c v)' },
      { value: 'quad', label: '이차 (-k v|v|)' },
    ], a: 'none', b: 'quad', default: 'none' },
    { key: 'dragK', label: '항력 계수', type: 'range', min: 0, max: 3, step: 0.05, default: 2, when: (p) => p.drag !== 'none' },
    { key: 'waves', label: '파도', type: 'bool', default: false, shared: true, group: '장면' },
    { key: 'waveAmp', label: '파도 높이 (px)', type: 'range', min: 0, max: 40, step: 1, default: 14, shared: true, when: (p) => p.waves },
    { key: 'drop', label: '다시 떨어뜨리기', type: 'button' },
  ],
  en: {
    title: 'Buoyancy & Drag (Submerged Volume)',
    summary: 'A fixed buoyant force that turns on when the center is under water leaves every box half submerged and bobbing forever, whatever its density. Buoyancy proportional to submerged volume, plus drag, sinks each box by its density and lets it settle.',
    views: { a: 'Center test, no drag', b: 'Submerged volume + drag' },
    controls: 'Mouse click: grab a box, lift it, then let go',
    info: `
    <p><b>Buoyancy</b> is the upward force equal to the weight of the water a body pushes aside (Archimedes\' principle). <code>F = ρwater * g * Vsubmerged</code>.</p>
    <p>A common simple version: apply a constant force when the body center is below the surface.</p>
    <ul>
      <li>The force switches on and off each time the center crosses the surface. The bobbing never stops.</li>
      <li>The balance point is always "center = surface", so light wood and heavy ice both sink exactly halfway.</li>
    </ul>
    <p>Make the force proportional to submerged volume (area in 2D) and it changes smoothly with depth. A body with density <code>ρ</code> sinks only <code>ρ / ρwater</code> of its volume and reaches balance.</p>
    <p>Buoyancy alone oscillates forever like a spring. <b>Drag</b>, the resistance of water, must remove energy for it to stop.</p>
    <ul>
      <li>Linear drag <code>F = -c * v</code>: slow speeds, thick liquids.</li>
      <li>Quadratic drag <code>F = -½ ρ Cd A v|v|</code>: fast water and air. The faster it moves, the harder drag pushes back.</li>
      <li>Multiply both by the submerged ratio, so drag disappears out of the water.</li>
    </ul>
    <p>Downside: a real game must handle rotation and the submerged shape. Usually you split the body into points or triangles and apply buoyancy to each.</p>
    <p>The green dashed line in each box is the ideal waterline (density ratio). The answer is right when the surface meets this line.</p>`,
    look: [
      'In A, all 4 boxes sink only to about their center, whatever their density, and keep bobbing. In B, the boxes with density 0.25, 0.5, and 0.75 sink to the green dashed line and settle fast. After 10 s, the average vertical speed is about 170 px/s in A and about 10 px/s in B.',
      'Set B\'s drag to "None". The balance point is right, but the bobbing never stops. Set it to "Linear" and even slow bobbing stops sooner, because quadratic drag gets weaker at low speed.',
      'Change only A\'s buoyancy to "Submerged volume". Each box swings around its green dashed line. With no drag, the swing does not fade.',
      'Turn on waves. B\'s boxes rise and fall smoothly with the surface. A jerks, because its force cuts out each time the center crosses the surface.',
    ],
    refs: [
      'Buoyancy and drag force generators.',
      'Gamasutra. Splits the mesh into triangles and computes buoyancy and drag for each submerged part.',
      'Quadratic drag formula F = ½ρ v² Cd A.',
    ],
    params: {
      buoy: { label: 'Buoyancy method', group: 'Buoyancy', options: { center: 'Center test, fixed force', volume: 'Submerged volume' } },
      drag: { label: 'Drag', options: { none: 'None', linear: 'Linear (-c v)', quad: 'Quadratic (-k v|v|)' } },
      dragK: 'Drag coefficient',
      waves: { label: 'Waves', group: 'Scene' },
      waveAmp: 'Wave height (px)',
      drop: 'Drop again',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const LW = 600, LH = 400, WL = 200, FLOOR = 380, G = 600, BW = 56, BH = 56, H = 1 / 120;
    const DENS = [0.25, 0.5, 0.75, 1.25];
    const XS = [100, 233, 366, 500];
    let boxes, acc, t, grabbed = -1, mouseL = null;
    const drop = () => {
      boxes = DENS.map((rho, i) => ({ rho, x: XS[i], y: 40 + ctx.rng.range(0, 30), vy: 0, sub: 0, hist: [], fb: 0, fd: 0 }));
      acc = 0; t = 0;
    };
    drop();
    const surface = (x) => (P.waves ? WL + P.waveAmp * Math.sin(x * 0.02 - t * 2.2) : WL);

    function step(h) {
      t += h;
      for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i];
        if (i === grabbed) { b.vy = 0; continue; }
        const m = b.rho * BW * BH;          // 물 밀도 1 기준 질량
        const top = b.y - BH / 2, bottom = b.y + BH / 2, sy = surface(b.x);
        const depth = U.clamp(bottom - sy, 0, BH);
        b.sub = depth / BH;
        let fb;
        if (P.buoy === 'center') fb = b.y > sy ? BW * BH * G : 0;
        else fb = depth * BW * G;
        // 항력: 잠긴 비율만큼 적용. 수면이 움직이면 물에 대한 상대 속도를 씀
        const vRel = b.vy - (P.waves ? P.waveAmp * -2.2 * Math.cos(b.x * 0.02 - t * 2.2) : 0);
        let fd = 0;
        const frac = P.buoy === 'center' ? (b.y > sy ? 1 : 0) : b.sub;
        if (P.drag === 'linear') fd = -P.dragK * 40 * BW * vRel * frac;
        else if (P.drag === 'quad') fd = -P.dragK * 0.5 * BW * vRel * Math.abs(vRel) * frac;
        b.fb = fb; b.fd = fd;
        // 이차 항력이 한 스텝에 속도를 뒤집지 않도록 제한
        let a = G - fb / m + fd / m;
        if (fd !== 0 && Math.abs((fd / m) * h) > Math.abs(vRel)) a = G - fb / m - vRel / h;
        b.vy += a * h;
        b.y += b.vy * h;
        if (b.y + BH / 2 > FLOOR) { b.y = FLOOR - BH / 2; if (b.vy > 0) b.vy = -b.vy * 0.2; }
        if (top < -200) b.y = -200 + BH / 2;
      }
    }

    const toLocal = (m) => {
      const s = Math.min(ctx.width / LW, ctx.height / LH), ox = (ctx.width - LW * s) / 2, oy = (ctx.height - LH * s) / 2;
      return { x: (m.x - ox) / s, y: (m.y - oy) / s };
    };

    return {
      update(dt) {
        acc += dt;
        let guard = 0;
        while (acc >= H && guard++ < 30) { step(H); acc -= H; }
        if (guard >= 30) acc = 0;
        if (grabbed >= 0 && mouseL) boxes[grabbed].y = U.clamp(mouseL.y, 20, FLOOR - BH / 2);
        for (const b of boxes) {
          b.hist.push({ sub: b.sub, v: Math.abs(b.vy) });
          if (b.hist.length > 120) b.hist.shift();
        }
      },
      onPointer(type, m) {
        mouseL = toLocal(m);
        if (type === 'down') {
          grabbed = boxes.findIndex((b) => Math.abs(mouseL.x - b.x) < BW / 2 + 6 && Math.abs(mouseL.y - b.y) < BH / 2 + 6);
        } else if (type === 'up' || type === 'leave') grabbed = -1;
      },
      render() {
        const g = ctx.g, W = ctx.width, Hh = ctx.height;
        const s = Math.min(W / LW, Hh / LH), ox = (W - LW * s) / 2, oy = (Hh - LH * s) / 2;
        const col = ctx.side === 'a' ? C.a : C.b;
        g.save(); g.translate(ox, oy); g.scale(s, s);
        D.grid(g, LW, LH, 40);
        // 물
        const pts = [];
        for (let x = 0; x <= LW; x += 10) pts.push({ x, y: surface(x) });
        pts.push({ x: LW, y: FLOOR }, { x: 0, y: FLOOR });
        D.poly(g, pts, 'rgba(60,140,220,0.22)', null);
        D.poly(g, pts.slice(0, -2), null, 'rgba(120,190,255,0.8)', 1.5, false);
        D.rect(g, 0, FLOOR, LW, LH - FLOOR, '#2a2f3a');
        for (const b of boxes) {
          const l = b.x - BW / 2, tp = b.y - BH / 2;
          const alpha = 0.35 + b.rho * 0.45;
          D.rect(g, l, tp, BW, BH, U.rgb(...U.hexToRgb(col), Math.min(1, alpha)), '#fff', 1);
          // 이론 수면선
          if (b.rho < 1) {
            const ly = tp + BH * (1 - b.rho);
            g.setLineDash([4, 3]);
            D.line(g, l - 4, ly, l + BW + 4, ly, C.good, 1.5);
            g.setLineDash([]);
          }
          D.text(g, `ρ ${b.rho}`, b.x, tp + 4, { size: 11, align: 'center', color: '#fff' });
          // 힘 화살표
          const m = b.rho * BW * BH, sc = 0.05;
          D.arrow(g, b.x + 14, b.y, b.x + 14, b.y + G * sc * 1, C.dim, 1.5, 5);
          if (b.fb > 0) D.arrow(g, b.x - 14, b.y, b.x - 14, b.y - (b.fb / m) * sc, C.good, 2, 6);
          if (Math.abs(b.fd) > m * 5) D.arrow(g, b.x, b.y, b.x, b.y + (b.fd / m) * sc, C.warn, 1.5, 5);
        }
        g.restore();
        const avgSub = boxes.map((b) => b.hist.reduce((s2, h) => s2 + h.sub, 0) / Math.max(1, b.hist.length));
        const avgV = boxes.slice(0, 3).reduce((s2, b) => s2 + b.hist.reduce((q, h) => q + h.v, 0) / Math.max(1, b.hist.length), 0) / 3;
        ctx.stat(GTL.L('잠긴 비율 (최근 1초 평균)', 'Submerged ratio (last 1 s avg)'), avgSub.map((v) => (v * 100).toFixed(0) + '%').join(' / '));
        ctx.stat(GTL.L('이론 잠긴 비율', 'Ideal submerged ratio'), '25% / 50% / 75% / 100%');
        ctx.stat(GTL.L('평균 상하 속도 (뜨는 상자 3개)', 'Avg vertical speed (3 floating boxes)'), avgV.toFixed(1) + ' px/s');
        ctx.stat(GTL.L('이론과 차이 (뜨는 상자 평균)', 'Error vs ideal (floating box avg)'), ((avgSub.slice(0, 3).reduce((q, v, i) => q + Math.abs(v - DENS[i]), 0) / 3) * 100).toFixed(1) + ' %p');
      },
      onAction(key) { if (key === 'drop') drop(); },
    };
  },
});
