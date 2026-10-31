// 수력 침식(물방울 방식): 물방울이 경사를 따라 흐르며 흙을 깎고 쌓음. 침식 전 vs 후, 브러시 유무
GTL.register({
  id: 'hydraulic-erosion',
  title: '수력 침식 (물방울 방식)',
  summary: '노이즈 지형 vs 물방울 수만 개로 침식한 지형 비교. 노이즈만으로는 언덕이 둥글고 골짜기가 없음. 침식을 거치면 산비탈에 물길이 파이고, 깎인 흙이 아래에 쌓여 평평한 퇴적 지대가 생김.',
  views: { a: '침식 전', b: '물방울 침식' },
  controls: '조작 없음. 물방울은 매 프레임 조금씩 처리됨.',
  info: `
    <p><b>수력 침식(Hydraulic Erosion)</b>: 비가 산을 깎아 골짜기를 만드는 과정을 흉내 냄. 노이즈 지형의 "둥근 언덕" 느낌을 없애는 대표 후처리.</p>
    <p><b>물방울 방식</b>: 물방울 하나를 무작위 위치에 떨어뜨려 수십 걸음 움직임.</p>
    <ol>
      <li>현재 위치의 높이와 경사를 양선형 보간으로 구함.</li>
      <li>방향 = 이전 방향 × 관성 + 내리막 방향 × (1 - 관성). 한 칸 이동.</li>
      <li>운반 용량 = 내려간 높이 × 속도 × 물 양 × 용량 계수.</li>
      <li>흙이 용량보다 적으면 바닥을 깎아 흙을 실음. 많거나 오르막이면 흙을 내려놓음.</li>
      <li>속도를 낙차로 갱신하고 물을 조금 증발시킴.</li>
    </ol>
    <p><b>침식 브러시</b>: 깎는 양을 반지름 안의 여러 칸에 나눠 깎음. 브러시 없이 한 점만 깎으면 좁고 깊은 구멍과 뾰족한 가시가 생김.</p>
    <p>어려운 점: 계수 6~7개가 서로 얽혀 결과가 민감함. 지형 높이 단위, 격자 크기를 바꾸면 다시 맞춰야 함. 깎는 양을 낙차 이하로 제한하지 않으면 높이가 진동하며 터짐.</p>`,
  // 도식: 비탈을 내려가는 물방울이 급경사에서 깎고 평지에서 쌓는 과정, 한 점 침식 vs 브러시 침식
  diagram: (L) => `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr-he" class="m-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <path d="M10,40 L80,50 L150,74 L220,108 L280,140 L360,145" class="d-dim" stroke-dasharray="4 3"/>
    <path d="M10,40 L80,52 L150,82 L220,118 L280,140 L360,145" class="d-line"/>
    <path d="M290,141 Q310,132 330,143" class="f-accent"/>
    ${[[30, 34, 90, 40], [90, 40, 150, 64], [150, 64, 210, 96], [210, 96, 262, 122], [262, 122, 320, 130]].map(([x1, y1, x2, y2]) =>
      `<line x1="${x1}" y1="${y1}" x2="${x2 - 6}" y2="${y2 - 2}" class="d-b" marker-end="url(#arr-he)"/><circle cx="${x1}" cy="${y1}" r="3.5" class="f-b"/>`).join('')}
    <text x="50" y="134" class="t-small">${L('급경사: 바닥을 깎아 흙을 실음', 'steep: erode, pick up soil')}</text>
    <text x="226" y="168" class="t-small">${L('평지: 흙을 내려놓음', 'flat: drop soil')}</text>
    <text x="10" y="18" class="t-small t-dim">${L('점선 = 침식 전 지면, 파란 점 = 물방울 걸음', 'dashed = ground before, blue dots = droplet steps')}</text>
    <text x="10" y="190" class="t-mono t-small">capacity = drop * speed * water * k</text>
    <line x1="376" y1="10" x2="376" y2="190" class="d-dim"/>
    <text x="390" y="24" class="t-a t-small">${L('브러시 없음: 한 점만 깎음', 'No brush: one point')}</text>
    <path d="M390,50 L450,50 L456,88 L462,50 L530,50" class="d-a"/>
    <text x="390" y="104" class="t-small t-dim">${L('좁고 깊은 구멍, 가시', 'narrow pits, spikes')}</text>
    <text x="390" y="130" class="t-b t-small">${L('브러시: 반경 안에 나눠 깎음', 'Brush: spread over a radius')}</text>
    <path d="M390,150 L420,150 Q456,176 492,150 L530,150" class="d-b"/>
    <text x="390" y="186" class="t-small t-dim">${L('넓고 매끄러운 골짜기', 'wide, smooth valley')}</text>
  </svg>`,
  look: [
    'B의 물방울이 늘수록 산비탈에 가지 모양 골짜기가 파임. A는 매끈한 언덕 그대로임.',
    '표시를 "침식/퇴적 지도"로 바꾸면 빨간(깎인 곳) 물길과 파란(쌓인 곳) 평지가 보임.',
    'B의 침식 브러시를 끄면 "뾰족한 구덩이" 수가 크게 늘어남. 음영에 점 같은 잡티가 생김.',
    '관성을 0.3까지 올리면 물방울이 곧게 흘러 골짜기가 길고 곧아짐. 0이면 굽이가 많아짐.',
    '증발률을 올리면 물방울이 빨리 말라 짧은 물길만 생김.',
  ],
  refs: [
    { type: 'paper', title: 'Hans Theobald Beyer: Implementation of a method for hydraulic erosion (학사 논문, TU München)', year: 2015, note: '물방울 기반 침식의 단계별 식과 계수.' },
    { type: 'talk', title: 'Sebastian Lague: Coding Adventure: Hydraulic Erosion', year: 2019, note: '물방울 방식, 침식 브러시를 보여 주는 영상과 공개 코드.' },
    { type: 'paper', title: 'F. K. Musgrave, C. E. Kolb, R. S. Mace: The synthesis and rendering of eroded fractal terrains', year: 1989, note: 'SIGGRAPH 1989. 프랙털 지형에 수력, 열 침식을 적용한 초기 연구.' },
    { type: 'paper', title: 'X. Mei, P. Decaudin, B.-G. Hu: Fast Hydraulic Erosion Simulation and Visualization on GPU', year: 2007, note: 'Pacific Graphics 2007. 격자 물 흐름(파이프 모델) 방식. 물방울 방식의 대안.' },
  ],
  params: [
    { key: 'droplets', label: '물방울 수', type: 'int', min: 0, max: 150000, step: 1000, a: 0, b: 30000, group: '침식' },
    { key: 'brush', label: '침식 브러시', type: 'bool', default: true, reset: true, help: '끄면 한 점에서만 깎음.' },
    { key: 'radius', label: '브러시 반지름 (칸)', type: 'int', min: 1, max: 5, default: 3, reset: true, when: (p) => p.brush },
    { key: 'inertia', label: '관성', type: 'range', min: 0, max: 0.5, step: 0.01, default: 0.05, reset: true },
    { key: 'capacity', label: '운반 용량 계수', type: 'range', min: 1, max: 10, step: 0.5, default: 4, reset: true },
    { key: 'erode', label: '침식 속도', type: 'range', min: 0.05, max: 0.9, step: 0.05, default: 0.3, reset: true },
    { key: 'deposit', label: '퇴적 속도', type: 'range', min: 0.05, max: 0.9, step: 0.05, default: 0.3, reset: true },
    { key: 'evaporate', label: '증발률', type: 'range', min: 0.005, max: 0.1, step: 0.005, default: 0.01, reset: true },
    { key: 'res', label: '격자 가로 칸 수', type: 'int', min: 96, max: 200, default: 160, shared: true, reset: true, group: '표시' },
    { key: 'view', label: '표시', type: 'select', shared: true, options: [
      { value: 'shade', label: '음영 지형' },
      { value: 'diff', label: '침식/퇴적 지도' },
    ], default: 'shade' },
    { key: 'paths', label: '최근 물방울 경로', type: 'bool', default: true, shared: true },
    { key: 'restart', label: '다시 시작', type: 'button', buttonLabel: '침식 다시 시작' },
  ],
  en: {
    title: 'Hydraulic Erosion (Droplet Method)',
    summary: 'Noise terrain vs terrain eroded by tens of thousands of droplets. Noise alone gives round hills and no valleys. After erosion, water channels cut into the slopes, and the removed soil piles up below into flat deposit areas.',
    views: { a: 'Before erosion', b: 'Droplet erosion' },
    controls: 'No input. Droplets are processed a little each frame.',
    info: `
    <p><b>Hydraulic erosion</b> mimics how rain wears down mountains and cuts valleys. It is the standard cleanup step to remove the "round hill" look of noise terrain.</p>
    <p><b>Droplet method</b>: drop one droplet at a random position and move it for a few dozen steps.</p>
    <ol>
      <li>Get the height and slope at the current position with bilinear interpolation.</li>
      <li>Direction = previous direction × inertia + downhill direction × (1 - inertia). Move one cell.</li>
      <li>Carry capacity = height drop × speed × water × capacity factor.</li>
      <li>If the droplet carries less soil than its capacity, it cuts the ground and picks up soil. If it carries more, or goes uphill, it drops soil.</li>
      <li>Update speed from the height drop and evaporate a little water.</li>
    </ol>
    <p><b>Erosion brush</b>: spreads the cut over several cells within a radius. Without a brush, cutting a single point makes narrow, deep holes and sharp spikes.</p>
    <p>Hard part: 6~7 factors interact, so the result is sensitive. If you change the height unit or grid size, you must tune again. If you do not limit the cut to the height drop, heights oscillate and blow up.</p>`,
    look: [
      'As B\'s droplet count grows, branching valleys cut into the slopes. A stays as smooth hills.',
      'Switch the view to "Erosion/deposit map". You see red channels (cut) and blue flats (deposit).',
      'Turn off B\'s erosion brush. The "Sharp pits" count rises a lot. Dot-like specks appear in the shading.',
      'Raise inertia to 0.3. Droplets flow straight, so valleys get long and straight. At 0 they wind more.',
      'Raise the evaporation rate. Droplets dry fast, so only short channels form.',
    ],
    refs: [{ title: 'Hans Theobald Beyer: Implementation of a method for hydraulic erosion (bachelor\'s thesis, TU München)', note: 'Step-by-step formulas and factors for droplet-based erosion.' }, 'A video and open code that show the droplet method and erosion brush.', 'SIGGRAPH 1989. Early work that applied hydraulic and thermal erosion to fractal terrain.', 'Pacific Graphics 2007. A grid water flow (pipe model) method. An alternative to droplets.'],
    params: {
      droplets: { label: 'Droplets', group: 'Erosion' },
      brush: { label: 'Erosion brush', help: 'When off, cuts at a single point only.' },
      radius: 'Brush radius (cells)',
      inertia: 'Inertia',
      capacity: 'Carry capacity factor',
      erode: 'Erosion speed',
      deposit: 'Deposit speed',
      evaporate: 'Evaporation rate',
      res: { label: 'Grid width (cells)', group: 'Display' },
      view: { label: 'View', options: { shade: 'Shaded terrain', diff: 'Erosion/deposit map' } },
      paths: 'Recent droplet paths',
      restart: { label: 'Restart', buttonLabel: 'Restart erosion' },
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const W0 = ctx.width, H0 = ctx.height;
    const gw = P.res, gh = Math.max(40, Math.round(P.res * H0 / W0));
    const n = gw * gh;
    const N = U.noise(ctx.seed * 71 + 9);
    const orig = new Float32Array(n), hm = new Float32Array(n);
    {
      const s = 3 / gw;
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
        const v = N.fbm2(x * s, y * s, { octaves: 5, gain: 0.45 });
        orig[y * gw + x] = Math.pow(U.clamp(0.5 + v * 0.75, 0, 1), 1.3);
      }
    }
    let hMin = Infinity, hMax = -Infinity;
    for (let i = 0; i < n; i++) { if (orig[i] < hMin) hMin = orig[i]; if (orig[i] > hMax) hMax = orig[i]; }
    // 브러시: 반지름 안의 칸 오프셋과 가중치 (max(0, r - d) 정규화)
    const brushes = new Array(n);
    function brushAt(cx, cy) {
      const i = cy * gw + cx;
      if (brushes[i]) return brushes[i];
      const r = P.brush ? P.radius : 0, idx = [], w = [];
      let sum = 0;
      if (r === 0) { idx.push(i); w.push(1); sum = 1; }
      else for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx, y = cy + dy, d = Math.hypot(dx, dy);
        if (x < 0 || y < 0 || x >= gw || y >= gh || d > r) continue;
        const ww = 1 - d / r; if (ww <= 0) continue;
        idx.push(y * gw + x); w.push(ww); sum += ww;
      }
      for (let k = 0; k < w.length; k++) w[k] /= sum;
      return (brushes[i] = { idx, w });
    }

    let rng, done, eroded, deposited, recent, cv = null, cg = null, img = null, dirty = true, workMs = 0;
    function restart() {
      hm.set(orig);
      rng = U.rng(ctx.seed * 433 + 1);
      done = 0; eroded = 0; deposited = 0; recent = []; dirty = true;
    }
    restart();

    // 양선형 높이와 경사
    function sample(x, y) {
      const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, i = iy * gw + ix;
      const a = hm[i], b = hm[i + 1], c = hm[i + gw], d = hm[i + gw + 1];
      return {
        h: a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy,
        gx: (b - a) * (1 - fy) + (d - c) * fy,
        gy: (c - a) * (1 - fx) + (d - b) * fx,
      };
    }

    const MAX_LIFE = 30, MIN_CAP = 0.01, GRAVITY = 4;
    function droplet(record) {
      let x = rng.range(0, gw - 1.001), y = rng.range(0, gh - 1.001);
      let dx = 0, dy = 0, speed = 1, water = 1, sed = 0;
      const path = record ? [[x, y]] : null;
      for (let life = 0; life < MAX_LIFE; life++) {
        const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
        const s = sample(x, y);
        dx = dx * P.inertia - s.gx * (1 - P.inertia);
        dy = dy * P.inertia - s.gy * (1 - P.inertia);
        const len = Math.hypot(dx, dy);
        if (len < 1e-9) break;
        dx /= len; dy /= len;
        x += dx; y += dy;
        if (x < 0 || y < 0 || x >= gw - 1 || y >= gh - 1) break;
        if (path) path.push([x, y]);
        const dh = sample(x, y).h - s.h;
        const cap = Math.max(-dh * speed * water * P.capacity, MIN_CAP);
        const i = iy * gw + ix;
        if (sed > cap || dh > 0) {
          // 오르막이면 낙차만큼만 채움 (넘치게 쌓으면 진동함)
          const amt = dh > 0 ? Math.min(dh, sed) : (sed - cap) * P.deposit;
          sed -= amt; deposited += amt;
          hm[i] += amt * (1 - fx) * (1 - fy); hm[i + 1] += amt * fx * (1 - fy);
          hm[i + gw] += amt * (1 - fx) * fy; hm[i + gw + 1] += amt * fx * fy;
        } else {
          // 깎는 양은 낙차를 넘지 않게 제한
          const amt = Math.min((cap - sed) * P.erode, -dh);
          const br = brushAt(ix, iy);
          for (let k = 0; k < br.idx.length; k++) {
            const j = br.idx[k], want = amt * br.w[k];
            const take = hm[j] < want ? hm[j] : want;
            hm[j] -= take; sed += take; eroded += take;
          }
        }
        speed = Math.sqrt(Math.max(0, speed * speed - dh * GRAVITY));
        water *= 1 - P.evaporate;
      }
      if (path) { recent.push(path); if (recent.length > 40) recent.shift(); }
    }

    function slopeStats() {
      let sum = 0, spikes = 0;
      for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
        const i = y * gw + x, v = hm[i];
        const gx = hm[i + 1] - hm[i - 1], gy = hm[i + gw] - hm[i - gw];
        sum += Math.hypot(gx, gy) * 0.5;
        let lo = true;
        for (let dy = -1; dy <= 1 && lo; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && hm[i + dy * gw + dx] <= v + 0.002) { lo = false; break; }
        if (lo) spikes++;
      }
      return { slope: sum / ((gw - 2) * (gh - 2)), spikes };
    }
    let st = slopeStats();

    function paint() {
      if (!cv) { cv = ctx.createCanvas(gw, gh); cg = cv.getContext('2d'); img = cg.createImageData(gw, gh); }
      const d = img.data;
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
        const i = y * gw + x, o = i * 4, v = hm[i];
        let r, g, b;
        if (P.view === 'diff') {
          const k = U.clamp((v - orig[i]) * 15, -1, 1);
          const base = 40 + v * 90;
          if (k < 0) { r = base - k * 200; g = base * (1 + k * 0.5); b = base * (1 + k * 0.5); }
          else { r = base * (1 - k * 0.5); g = base + k * 60; b = base + k * 200; }
        } else {
          // 높이 구간별 색 (낮은 곳 초록 → 중간 갈색 → 높은 곳 회색)
          const t = U.clamp((v - hMin) / (hMax - hMin), 0, 1);
          if (t < 0.45) { const k = t / 0.45; r = 70 + 40 * k; g = 120 + 10 * k; b = 55 + 10 * k; }
          else if (t < 0.75) { const k = (t - 0.45) / 0.3; r = 110 + 30 * k; g = 130 - 25 * k; b = 65 + 20 * k; }
          else { const k = (t - 0.75) / 0.25; r = 140 + 80 * k; g = 105 + 115 * k; b = 85 + 140 * k; }
          const xm = Math.max(0, x - 1), xp = Math.min(gw - 1, x + 1), ym = Math.max(0, y - 1), yp = Math.min(gh - 1, y + 1);
          const gx = (hm[y * gw + xp] - hm[y * gw + xm]) * 30, gy = (hm[yp * gw + x] - hm[ym * gw + x]) * 30;
          // 왼쪽 위 빛 (램버트)
          const nl = (gx * 0.6 + gy * 0.6 + 1) / Math.sqrt(gx * gx + gy * gy + 1);
          const sh = U.clamp(0.35 + nl * 0.75, 0.2, 1.4);
          r *= sh; g *= sh; b *= sh;
        }
        d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
      }
      cg.putImageData(img, 0, 0);
    }

    let lastView = '';
    return {
      update() {
        if (P.droplets < done) { restart(); }
        if (done >= P.droplets) { workMs = 0; return; }
        const t0 = ctx.now();
        // 프레임당 약 8ms만 사용
        while (done < P.droplets && ctx.now() - t0 < 8) {
          for (let k = 0; k < 40 && done < P.droplets; k++) { droplet(k === 0 && done % 400 < 40); done++; }
        }
        workMs = ctx.now() - t0;
        dirty = true;
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height;
        if (dirty || P.view !== lastView) {
          paint();
          if (dirty) st = slopeStats();
          dirty = false; lastView = P.view;
        }
        const T = Math.min(W / gw, H / gh), ox = (W - gw * T) / 2, oy = (H - gh * T) / 2;
        g.imageSmoothingEnabled = true;
        g.drawImage(cv, ox, oy, gw * T, gh * T);
        const col = ctx.side === 'a' ? C.a : C.b;
        if (P.paths && recent.length) {
          g.globalAlpha = 0.8;
          for (const p of recent) {
            g.beginPath();
            p.forEach(([x, y], i) => (i ? g.lineTo(ox + x * T, oy + y * T) : g.moveTo(ox + x * T, oy + y * T)));
            g.strokeStyle = col; g.lineWidth = 1; g.stroke();
          }
          g.globalAlpha = 1;
        }
        if (P.droplets > 0) {
          const f = done / P.droplets;
          g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(8, 8, 120, 6);
          g.fillStyle = col; g.fillRect(8, 8, 120 * f, 6);
        }
        ctx.stat(GTL.L('처리한 물방울', 'Droplets done'), `${done} / ${P.droplets}`);
        ctx.stat(GTL.L('깎인 흙 (높이 합)', 'Soil cut (height sum)'), eroded.toFixed(2));
        ctx.stat(GTL.L('쌓인 흙 (높이 합)', 'Soil deposited (height sum)'), deposited.toFixed(2));
        ctx.stat(GTL.L('평균 경사', 'Mean slope'), (st.slope * 1000).toFixed(2) + ' ‰');
        ctx.stat(GTL.L('뾰족한 구덩이', 'Sharp pits'), st.spikes);
        ctx.stat(GTL.L('침식 계산 / 프레임', 'Erosion time / frame'), workMs.toFixed(1) + ' ms');
      },
      onAction(key) { if (key === 'restart') restart(); },
    };
  },
});
