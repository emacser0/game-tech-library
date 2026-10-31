// 마칭 스퀘어: 스칼라 필드 → 등치선/영역. 블록 / 중점 / 선형 보간, 안장점(saddle) 처리
GTL.register({
  id: 'marching-squares',
  title: '마칭 스퀘어 (등치선 추출)',
  summary: '중점 vs 선형 보간 비교. 둘 다 격자 꼭짓점 값으로 경계선을 만듦. 변 위 교차점을 선형 보간하면 거친 격자에서도 매끄러운 윤곽이 나옴.',
  views: { a: '중점 (보간 없음)', b: '선형 보간' },
  controls: '조작 없음. 메타볼이 저절로 움직임.',
  info: `
    <p><b>마칭 스퀘어</b>: 격자 꼭짓점에서 샘플한 값(스칼라 필드)으로 경계선(등치선)을 그리는 방법.
    3D 버전은 마칭 큐브(Lorensen & Cline 1987).</p>
    <p>쓰임: 2D 지형 파괴(Worms류), 안개나 영역 경계, 메타볼 UI, 등고선 지도</p>
    <p>동작 원리:</p>
    <ul>
      <li>칸마다 네 꼭짓점이 임계값보다 큰지(안) 작은지(밖) 확인</li>
      <li>결과를 4비트로 묶어 <b>16가지 경우</b> 중 하나를 고름</li>
      <li>미리 정한 표에 따라 선분을 0~2개 그림</li>
    </ul>
    <p>선분 끝점 위치:</p>
    <ul>
      <li><b>중점</b>: 변의 가운데에 둠. 윤곽이 45° 계단 모양이 됨.</li>
      <li><b>선형 보간</b>: 두 꼭짓점 값 a, b로 <code>t = (iso − a) / (b − a)</code>를 구해 그 위치에 둠. 같은 격자에서 훨씬 정확한 곡선이 나옴.</li>
    </ul>
    <p>단점: 대각선 꼭짓점만 안쪽인 <b>안장점(5, 10번)</b>은 두 가지로 이을 수 있어 모호함.
    칸 중심값(네 꼭짓점 평균)으로 정하면 메타볼이 합쳐지고 갈라지는 순간이 자연스러움.</p>`,
  // 도식: 한 칸의 네 꼭짓점 값, 4비트 경우 번호, 중점 vs 선형 보간 선분, 안장점
  diagram: (L) => `<svg viewBox="0 0 540 196" xmlns="http://www.w3.org/2000/svg">
    <rect x="60" y="30" width="120" height="120" class="f-dim"/>
    <line x1="120" y1="30" x2="120" y2="150" class="d-a" stroke-dasharray="5 3"/>
    <line x1="128.6" y1="30" x2="84" y2="150" class="d-b"/>
    <circle cx="60" cy="30" r="6" class="f-accent"/><circle cx="180" cy="30" r="6" class="f-dim"/>
    <circle cx="180" cy="150" r="6" class="f-dim"/><circle cx="60" cy="150" r="6" class="f-accent"/>
    <text x="52" y="22" text-anchor="end" class="t-mono">0.9</text><text x="188" y="22" class="t-mono">0.2</text>
    <text x="188" y="164" class="t-mono">0.1</text><text x="52" y="164" text-anchor="end" class="t-mono">0.6</text>
    <text x="10" y="182" class="t-a t-small">${L('A 중점: 변의 가운데', 'A midpoint: center of edge')}</text>
    <text x="10" y="194" class="t-b t-small">${L('B 선형 보간: 값 비율 위치', 'B linear interp: by value ratio')}</text>
    <text x="226" y="30">${L('1. 꼭짓점 값 ≥ iso(0.5)면 안 (색칠한 점)', '1. Corner value ≥ iso (0.5) is inside')}</text>
    <text x="226" y="50">${L('2. 4비트로 묶음: 1001 = 9번 경우', '2. Pack into 4 bits: 1001 = case 9')}</text>
    <text x="226" y="70">${L('3. 16가지 표에서 선분 고름', '3. Look up the segment (16 cases)')}</text>
    <text x="226" y="94" class="t-mono">t = (iso - a) / (b - a)</text>
    <text x="226" y="110" class="t-mono t-small">${L('위 변', 'top')}: (0.5 - 0.9) / (0.2 - 0.9) = 0.57</text>
    <rect x="232" y="130" width="40" height="40" class="f-dim"/><circle cx="232" cy="130" r="4" class="f-accent"/><circle cx="272" cy="170" r="4" class="f-accent"/>
    <path d="M252,130 L232,150 M272,150 L252,170" class="d-line"/>
    <rect x="292" y="130" width="40" height="40" class="f-dim"/><circle cx="292" cy="130" r="4" class="f-accent"/><circle cx="332" cy="170" r="4" class="f-accent"/>
    <path d="M312,130 L332,150 M292,150 L312,170" class="d-line"/>
    <text x="346" y="146">${L('안장점 (5, 10번)', 'Saddle cases (5, 10)')}</text>
    <text x="346" y="162" class="t-small t-dim">${L('칸 중심값으로 연결 방식 결정', 'cell center value picks the link')}</text>
  </svg>`,
  look: [
    'A와 B를 흰 정답 윤곽(고해상도)과 비교하면 A(중점)는 45° 계단 모양으로 어긋나고 B는 거의 붙어 있음. "평균 오차" 수치에서도 차이가 보임.',
    '격자 크기를 40px로 키우면 차이가 크게 벌어짐. 8px로 줄이면 A도 괜찮아 보이지만 칸 수(비용)가 25배로 늘어남.',
    '방식을 "블록"으로 바꾸면 샘플점 하나가 한 칸을 통째로 채움. 가장 단순한 방식이며 마인크래프트식 복셀 경계와 같음.',
    '"케이스 번호 표시"를 켜고 메타볼이 붙었다 떨어질 때 5, 10번 칸을 보면 됨. "안장점 중심값 판정"을 끄면 그 순간 연결이 어색하게 끊김.',
  ],
  refs: [
    { type: 'paper', title: 'Marching Cubes: A High Resolution 3D Surface Construction Algorithm (Lorensen & Cline, SIGGRAPH 1987)', url: 'https://dl.acm.org/doi/10.1145/37402.37422', year: 1987 },
    { type: 'article', title: 'Jamie Wong: Metaballs and Marching Squares', url: 'https://jamie-wong.com/2014/08/19/metaballs-and-marching-squares/', year: 2014, note: '선형 보간과 안장점 처리를 그림으로 설명' },
    { type: 'article', title: 'Wikipedia: Marching squares', url: 'https://en.wikipedia.org/wiki/Marching_squares', note: '16가지 케이스 표와 안장점 판정' },
    { type: 'article', title: 'Sebastian Lague: Coding Adventure: Marching Cubes', note: 'Unity로 마칭 큐브 지형을 만드는 영상 시리즈' },
  ],
  params: [
    { key: 'method', label: '윤곽 방식', type: 'select', group: '추출', options: [
      { value: 'blocky', label: '블록 (샘플점 = 칸)' },
      { value: 'mid', label: '마칭 스퀘어 (중점)' },
      { value: 'lerp', label: '마칭 스퀘어 (선형 보간)' },
    ], a: 'mid', b: 'lerp' },
    { key: 'saddle', label: '안장점 중심값 판정', type: 'bool', default: true, when: (p) => p.method !== 'blocky' },
    { key: 'cell', label: '격자 크기 (px)', type: 'int', min: 6, max: 60, default: 28, shared: true },
    { key: 'iso', label: '임계값 (iso)', type: 'range', min: 0.4, max: 2.5, step: 0.01, default: 1, shared: true },
    { key: 'field', label: '스칼라 필드', type: 'select', group: '장면', options: [
      { value: 'meta', label: '메타볼' },
      { value: 'noise', label: '노이즈 (지형 파괴/동굴)' },
    ], default: 'meta', shared: true },
    { key: 'balls', label: '메타볼 수', type: 'int', min: 1, max: 12, default: 6, shared: true, when: (p) => p.field === 'meta' },
    { key: 'fill', label: '내부 채우기', type: 'bool', default: true, shared: true, group: '표시' },
    { key: 'ref', label: '정답 윤곽 (고해상도)', type: 'bool', default: true, shared: true },
    { key: 'samples', label: '샘플점 표시', type: 'bool', default: true, shared: true },
    { key: 'cases', label: '케이스 번호 표시', type: 'bool', default: false, shared: true },
    { key: 'move', label: '움직임', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Marching Squares (Isoline Extraction)',
    summary: 'Midpoint vs linear interpolation. Both build the border line from grid corner values. Interpolating the crossing point along each edge gives a smooth outline even on a coarse grid.',
    views: { a: 'Midpoint (no interpolation)', b: 'Linear interpolation' },
    controls: 'No input. The metaballs move on their own.',
    info: `
    <p><b>Marching squares</b> draws border lines (isolines) from values sampled at grid corners (a scalar field).
    The 3D version is marching cubes (Lorensen & Cline 1987).</p>
    <p>Uses: 2D terrain destruction (like Worms), fog or region borders, metaball UI, contour maps.</p>
    <p>How it works:</p>
    <ul>
      <li>For each cell, check whether each of the four corners is above (inside) or below (outside) the threshold.</li>
      <li>Pack the result into 4 bits to pick one of <b>16 cases</b>.</li>
      <li>Draw 0~2 line segments from a fixed table.</li>
    </ul>
    <p>Where segment end points go:</p>
    <ul>
      <li><b>Midpoint</b>: at the middle of the edge. The outline becomes a 45° staircase.</li>
      <li><b>Linear interpolation</b>: compute <code>t = (iso − a) / (b − a)</code> from the two corner values a and b, and place it there. The same grid gives a far more accurate curve.</li>
    </ul>
    <p>Downside: <b>saddle points (cases 5 and 10)</b>, where only diagonal corners are inside, can be joined two ways, so they are ambiguous.
    Decide by the cell center value (mean of the four corners), and metaballs merge and split naturally.</p>`,
    look: [
      'Compare A and B with the white reference outline (high resolution). A (midpoint) is off in a 45° staircase. B almost matches. The "Mean error" value also shows the gap.',
      'Raise the grid size to 40px. The gap grows wide. Lower it to 8px and A also looks fine, but the cell count (cost) grows 25 times.',
      'Switch the method to "Blocky". One sample point fills a whole cell. This is the simplest method and matches Minecraft-style voxel borders.',
      'Turn on "Show case numbers" and watch cells 5 and 10 as metaballs join and split. Turn off "Saddle center test" and the link breaks awkwardly at that moment.',
    ],
    refs: [null, 'Explains linear interpolation and saddle handling with pictures.', 'The table of 16 cases and the saddle test.', 'A video series that builds marching cubes terrain in Unity.'],
    params: {
      method: { label: 'Outline method', group: 'Extraction', options: { blocky: 'Blocky (sample point = cell)', mid: 'Marching squares (midpoint)', lerp: 'Marching squares (linear interpolation)' } },
      saddle: 'Saddle center test',
      cell: 'Grid size (px)',
      iso: 'Threshold (iso)',
      field: { label: 'Scalar field', group: 'Scene', options: { meta: 'Metaballs', noise: 'Noise (terrain destruction/caves)' } },
      balls: 'Metaballs',
      fill: { label: 'Fill inside', group: 'Display' },
      ref: 'Reference outline (high resolution)',
      samples: 'Show sample points',
      cases: 'Show case numbers',
      move: 'Motion',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const N = U.noise(ctx.seed);
    const rng = U.rng(ctx.seed * 53 + 9);
    const balls = Array.from({ length: 12 }, () => ({
      ax: rng.range(0.15, 0.4), ay: rng.range(0.15, 0.4), fx: rng.range(0.15, 0.5), fy: rng.range(0.15, 0.5),
      px: rng.range(0, U.TAU), py: rng.range(0, U.TAU), r: rng.range(0.07, 0.13),
    }));
    let t = 0;
    let bx = new Float64Array(12), by = new Float64Array(12), br = new Float64Array(12);

    function prepare(W, H) {
      const s = Math.min(W, H);
      for (let i = 0; i < 12; i++) {
        const b = balls[i];
        bx[i] = W * (0.5 + b.ax * Math.sin(t * b.fx + b.px));
        by[i] = H * (0.5 + b.ay * Math.sin(t * b.fy + b.py));
        br[i] = (b.r * s) ** 2;
      }
    }
    function f(x, y) {
      if (P.field === 'noise') {
        const s = 1 / 120;
        return 1 + 1.6 * (N.perlin3(x * s, y * s, t * 0.15) + 0.5 * N.perlin3(x * s * 2, y * s * 2, t * 0.15 + 3));
      }
      let v = 0;
      for (let i = 0; i < P.balls; i++) { const dx = x - bx[i], dy = y - by[i]; v += br[i] / (dx * dx + dy * dy + 1e-3); }
      return v;
    }

    // 케이스 → 선분(변 쌍). 변: 0=위 1=오른쪽 2=아래 3=왼쪽
    const SEG = [[], [[3, 2]], [[2, 1]], [[3, 1]], [[0, 1]], null, [[0, 2]], [[3, 0]], [[3, 0]], [[0, 2]], null, [[0, 1]], [[3, 1]], [[2, 1]], [[3, 2]], []];

    // 한 번의 격자 추출: 선분 배열 + (선택) 채우기 경로
    function extract(cs, W, H, mode, saddleFix, wantFill, g) {
      const cols = Math.ceil(W / cs), rows = Math.ceil(H / cs), iso = P.iso;
      const vals = new Float64Array((cols + 1) * (rows + 1));
      for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) vals[j * (cols + 1) + i] = f(i * cs, j * cs);
      const segs = [];
      const casesOut = [];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const a = vals[j * (cols + 1) + i], b = vals[j * (cols + 1) + i + 1];
        const c = vals[(j + 1) * (cols + 1) + i + 1], d = vals[(j + 1) * (cols + 1) + i];
        const idx = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0);
        if (casesOut) casesOut.push(idx);
        if (idx === 0) continue;
        const x0 = i * cs, y0 = j * cs;
        const tt = (p, q) => (mode === 'lerp' ? U.clamp((iso - p) / (q - p), 0, 1) : 0.5);
        const E = [
          [x0 + tt(a, b) * cs, y0], [x0 + cs, y0 + tt(b, c) * cs],
          [x0 + tt(d, c) * cs, y0 + cs], [x0, y0 + tt(a, d) * cs],
        ];
        let list = SEG[idx];
        let centerIn = false;
        if (!list) {
          centerIn = saddleFix ? (a + b + c + d) / 4 > iso : false;
          // 5: TR,BL 안 / 10: TL,BR 안
          if (idx === 5) list = centerIn ? [[3, 0], [2, 1]] : [[0, 1], [3, 2]];
          else list = centerIn ? [[0, 1], [3, 2]] : [[3, 0], [2, 1]];
        }
        for (const [e1, e2] of list) segs.push(E[e1][0], E[e1][1], E[e2][0], E[e2][1]);
        if (wantFill) {
          // 꼭짓점과 교차점을 시계방향으로 순회해 내부 다각형 구성
          const corner = [[x0, y0, a], [x0 + cs, y0, b], [x0 + cs, y0 + cs, c], [x0, y0 + cs, d]];
          const poly = (ids) => { g.moveTo(ids[0][0], ids[0][1]); for (let k = 1; k < ids.length; k++) g.lineTo(ids[k][0], ids[k][1]); g.closePath(); };
          if ((idx === 5 || idx === 10) && !centerIn) {
            if (idx === 5) { poly([E[0], corner[1], E[1]]); poly([E[2], corner[3], E[3]]); }
            else { poly([corner[0], E[0], E[3]]); poly([E[1], corner[2], E[2]]); }
          } else {
            const pts = [];
            for (let k = 0; k < 4; k++) {
              if (corner[k][2] > iso) pts.push(corner[k]);
              const n = (k + 1) % 4;
              if ((corner[k][2] > iso) !== (corner[n][2] > iso)) pts.push(E[k]);
            }
            if (pts.length >= 3) poly(pts);
          }
        }
      }
      return { segs, cols, rows, vals, cases: casesOut };
    }

    return {
      update(dt) { if (P.move) t += dt; },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height, cs = P.cell, iso = P.iso;
        prepare(W, H);
        const col = ctx.side === 'a' ? C.a : C.b;
        const t0 = ctx.now();
        let res = null;
        if (P.method === 'blocky') {
          const cols = Math.ceil(W / cs), rows = Math.ceil(H / cs);
          g.beginPath();
          let cnt = 0;
          for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) if (f(i * cs, j * cs) > iso) { g.rect(i * cs - cs / 2, j * cs - cs / 2, cs, cs); cnt++; }
          g.fillStyle = P.fill ? 'rgba(102,209,122,0.45)' : 'rgba(0,0,0,0)'; g.fill();
          g.strokeStyle = col; g.lineWidth = 1; g.stroke();
          res = { cols, rows };
        } else {
          g.beginPath();
          res = extract(cs, W, H, P.method, P.saddle, P.fill, g);
          if (P.fill) { g.fillStyle = 'rgba(102,209,122,0.45)'; g.fill(); }
          g.beginPath();
          const s = res.segs;
          for (let k = 0; k < s.length; k += 4) { g.moveTo(s[k], s[k + 1]); g.lineTo(s[k + 2], s[k + 3]); }
          g.strokeStyle = col; g.lineWidth = 2.5; g.stroke();
        }
        const ms = ctx.now() - t0;
        D.grid(g, W, H, cs, 'rgba(255,255,255,0.07)');
        // 정답 윤곽: 4px 격자 + 보간
        if (P.ref) {
          const r = extract(4, W, H, 'lerp', true, false, null), s = r.segs;
          g.beginPath();
          for (let k = 0; k < s.length; k += 4) { g.moveTo(s[k], s[k + 1]); g.lineTo(s[k + 2], s[k + 3]); }
          g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1; g.stroke();
        }
        if (P.samples && cs >= 10) {
          for (let j = 0; j <= res.rows; j++) for (let i = 0; i <= res.cols; i++) {
            const v = res.vals ? res.vals[j * (res.cols + 1) + i] : f(i * cs, j * cs);
            D.circle(g, i * cs, j * cs, 2, v > iso ? C.good : 'rgba(255,255,255,0.25)');
          }
        }
        if (P.cases && res.cases && cs >= 22) {
          for (let j = 0; j < res.rows; j++) for (let i = 0; i < res.cols; i++) {
            const c = res.cases[j * res.cols + i];
            if (c === 0 || c === 15) continue;
            D.text(g, String(c), i * cs + cs / 2, j * cs + cs / 2, { size: 10, color: c === 5 || c === 10 ? C.warn : C.dim, align: 'center', baseline: 'middle' });
          }
        }
        // 오차: 선분 끝점에서 |f − iso| / |∇f| (거리 근사)
        if (res.segs) {
          let err = 0, n = 0;
          const s = res.segs, h = 0.5;
          for (let k = 0; k < s.length && n < 600; k += 2, n++) {
            const x = s[k], y = s[k + 1], v = f(x, y);
            const gx = (f(x + h, y) - f(x - h, y)) / (2 * h), gy = (f(x, y + h) - f(x, y - h)) / (2 * h);
            err += Math.min(cs, Math.abs(v - iso) / Math.max(1e-6, Math.hypot(gx, gy)));
          }
          ctx.stat(GTL.L('평균 오차 (정답 윤곽까지)', 'Mean error (to reference outline)'), n ? (err / n).toFixed(2) + ' px' : '-');
          ctx.stat(GTL.L('선분 수', 'Line segments'), s.length / 4);
        } else ctx.stat(GTL.L('평균 오차 (정답 윤곽까지)', 'Mean error (to reference outline)'), GTL.L('블록: 최대 ±', 'Blocky: up to ±') + (cs / 2).toFixed(0) + ' px');
        ctx.stat(GTL.L('칸 수', 'Cells'), res.cols * res.rows);
        ctx.stat(GTL.L('추출 시간', 'Extraction time'), ms.toFixed(2) + ' ms');
      },
    };
  },
});
