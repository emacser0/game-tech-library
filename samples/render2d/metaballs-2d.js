// 2D 메타볼: 원마다 거리 함수를 더한 스칼라장에서 임계값 등고선을 그림 vs 원을 따로 그림
GTL.register({
  id: 'metaballs-2d',
  title: '2D 메타볼 (임계값 필드)',
  summary: '원을 따로 그리면 두 원이 닿아도 경계가 꺾인 채로 겹침. 원마다 영향 함수를 더한 장(field)에서 임계값을 넘는 곳을 칠하면 가까워질수록 부드럽게 늘어나 합쳐짐. 슬라임, 용암, 액체 UI에 씀.',
  renderer: 'webgl',
  views: { a: '원 따로 그리기', b: '메타볼 (합산 필드)' },
  controls: '마우스: 첫 번째 볼 이동',
  info: `
    <p><b>메타볼(Metaball)</b>은 점마다 영향 함수 f(d)를 정하고, 모든 점의 영향을 더한 값 F(p)가 임계값 T 이상인 곳을 안쪽으로 보는 방식. Jim Blinn(1982)의 "blobby" 모델에서 시작됨.</p>
    <ul>
    <li><b>원 따로 그리기</b>: F = max(f). 합치지 않아서 두 원이 닿아도 경계가 꺾임.</li>
    <li><b>역제곱</b>: f = r² / d². 계산이 간단하지만 영향이 무한히 멀리 미침. 그래서 픽셀마다 모든 볼을 더해야 함.</li>
    <li><b>Wyvill 다항식</b>: f = (1 - d²/R²)³, d &lt; R. 반경 R 밖에서 정확히 0. 균일 그리드로 주변 볼만 더하면 개수가 많아도 빠름.</li>
    </ul>
    <p>픽셀 셰이더가 F를 직접 계산하면 해상도와 상관없이 경계가 매끄러움. CPU에서는 마칭 스퀘어(Marching Squares)로 등고선을 뽑아 다각형으로 그리기도 함.</p>
    <p>단점: 볼 수 N에 비례해 픽셀 비용이 늘어남. 임계값을 낮추면 멀리 있는 볼끼리도 다리처럼 이어짐.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 176" xmlns="http://www.w3.org/2000/svg">
    <line x1="20" y1="130" x2="340" y2="130" class="d-dim"/>
    ${[130, 220].map((c) => `<polyline points="${Array.from({ length: 65 }, (_, i) => { const x = 20 + i * 5, d = Math.abs(x - c), f = d < 80 ? Math.pow(1 - d * d / 6400, 3) : 0; return `${x},${130 - f * 60}`; }).join(' ')}" class="d-dim"/>`).join('')}
    <polyline points="${Array.from({ length: 65 }, (_, i) => { const x = 20 + i * 5, f = (c) => { const d = Math.abs(x - c); return d < 80 ? Math.pow(1 - d * d / 6400, 3) : 0; }; return `${x},${130 - Math.max(f(130), f(220)) * 60}`; }).join(' ')}" class="d-a" stroke-dasharray="5 3"/>
    <polyline points="${Array.from({ length: 65 }, (_, i) => { const x = 20 + i * 5, f = (c) => { const d = Math.abs(x - c); return d < 80 ? Math.pow(1 - d * d / 6400, 3) : 0; }; return `${x},${130 - (f(130) + f(220)) * 60}`; }).join(' ')}" class="d-b"/>
    <line x1="20" y1="100" x2="340" y2="100" class="d-accent"/>
    <text x="344" y="104" class="t-small t-mono">T</text>
    <circle cx="130" cy="130" r="3" class="f-accent"/><circle cx="220" cy="130" r="3" class="f-accent"/>
    <rect x="94" y="140" width="72" height="7" class="f-a"/><rect x="184" y="140" width="72" height="7" class="f-a"/>
    <rect x="94" y="151" width="162" height="7" class="f-b"/>
    <text x="20" y="147" class="t-small t-a">${L('A 안쪽', 'A inside')}</text>
    <text x="20" y="158" class="t-small t-b">${L('B 안쪽', 'B inside')}</text>
    <text x="20" y="16" class="t-small">${L('볼 2개의 영향 f(d)와 임계값 T', 'Two balls: influence f(d) and threshold T')}</text>
    <text x="20" y="172" class="t-small t-dim">${L('가운데는 f 각각 T 미만, 합은 T 이상이라 B만 이어짐', 'In the middle each f is below T, but the sum is above T, so only B joins')}</text>
    <text x="372" y="30" class="t-small t-a">${L('A: F = max(f)', 'A: F = max(f)')}</text>
    <text x="372" y="46" class="t-small t-b">${L('B: F = f의 합', 'B: F = sum of f')}</text>
    <text x="372" y="62" class="t-small t-dim">${L('회색: 볼 하나의 f', 'Gray: f of one ball')}</text>
    <text x="372" y="92" class="t-small">${L('역제곱 r^2 / d^2', 'Inverse square r^2 / d^2')}</text>
    <text x="372" y="106" class="t-small t-dim">${L('영향이 끝없이 퍼짐', 'reaches forever')}</text>
    <text x="372" y="126" class="t-small">${L('Wyvill (1 - d^2/R^2)^3', 'Wyvill (1 - d^2/R^2)^3')}</text>
    <text x="372" y="140" class="t-small t-dim">${L('R 밖에서 정확히 0', 'exactly 0 outside R')}</text>
  </svg>`,
  look: [
    'A와 B에서 두 볼이 가까워질 때를 보면 A는 원이 그냥 겹침. B는 닿기 전부터 다리가 생기며 하나로 합쳐짐.',
    'B의 "임계값"을 0.4로 낮추면 멀리 있는 볼까지 이어짐. 2 이상으로 올리면 볼이 작아지고 잘 안 합쳐짐.',
    '"디버그 보기"를 "필드 값"으로 바꾸면 F의 등고선이 보임. 역제곱은 화면 끝까지 값이 남음.',
    'B의 함수를 "Wyvill"로 바꾸면 "픽셀당 기여 볼 수"가 볼 수보다 훨씬 작아짐. 거리 제한 함수의 장점임.',
  ],
  refs: [
    { type: 'paper', title: 'A Generalization of Algebraic Surface Drawing (James F. Blinn)', year: 1982, note: 'ACM Transactions on Graphics 1(3). 가우시안 영향 함수로 만든 blobby 모델.' },
    { type: 'paper', title: 'Data Structure for Soft Objects (Geoff Wyvill, Craig McPheeters, Brian Wyvill)', year: 1986, note: 'The Visual Computer 2(4). 반경 밖에서 0이 되는 다항식 영향 함수와 공간 분할.' },
    { type: 'article', title: 'Metaballs and Marching Squares (Jamie Wong)', year: 2014, url: 'http://jamie-wong.com/2014/08/19/metaballs-and-marching-squares/', note: '2D 메타볼 필드와 등고선 추출을 단계별로 설명' },
  ],
  params: [
    { key: 'method', label: '영향 함수', type: 'select', group: '필드', options: [
      { value: 0, label: '원 따로 그리기 (max)' },
      { value: 1, label: '역제곱 합 (r²/d²)' },
      { value: 2, label: 'Wyvill 다항식 합 (반경 제한)' },
    ], a: 0, b: 1 },
    { key: 'thr', label: '임계값', type: 'range', min: 0.3, max: 3, step: 0.05, default: 1, when: (p) => p.method > 0 },
    { key: 'debug', label: '디버그 보기', type: 'select', options: [
      { value: 0, label: '최종' },
      { value: 1, label: '필드 값 (등고선)' },
    ], default: 0 },
    { key: 'count', label: '볼 수', type: 'int', min: 2, max: 32, default: 10, shared: true, reset: true, group: '장면' },
    { key: 'speed', label: '이동 속도', type: 'range', min: 0, max: 3, step: 0.1, default: 1, shared: true },
  ],
  en: {
    title: '2D Metaballs (Threshold Field)',
    summary: 'If you draw each circle on its own, the edge stays sharp where two circles touch. If you add an influence function per circle into a field and fill where it passes a threshold, the circles stretch and merge smoothly as they get close. Used for slime, lava, and liquid UI.',
    views: { a: 'Separate circles', b: 'Metaballs (summed field)' },
    controls: 'Mouse: move the first ball',
    info: `
    <p><b>Metaballs</b> give each point an influence function f(d). The sum of all influences, F(p), is inside where it is at or above a threshold T. The idea starts with the "blobby" model of Jim Blinn (1982).</p>
    <ul>
    <li><b>Separate circles</b>: F = max(f). Nothing is added, so the edge stays sharp where two circles touch.</li>
    <li><b>Inverse square</b>: f = r² / d². It is simple, but the influence reaches infinitely far. So each pixel must add every ball.</li>
    <li><b>Wyvill polynomial</b>: f = (1 - d²/R²)³, d &lt; R. It is exactly 0 outside radius R. If you add only nearby balls through a uniform grid, it stays fast even with many balls.</li>
    </ul>
    <p>When a pixel shader computes F directly, the edge is smooth at any resolution. On the CPU, you can also extract the contour with Marching Squares and draw it as polygons.</p>
    <p>Downside: pixel cost grows with the ball count N. A low threshold connects even distant balls with bridges.</p>`,
    look: [
    'Watch two balls get close in A and B. In A the circles just overlap. In B a bridge forms before they touch, and they merge into one.',
    'Lower B\'s "Threshold" to 0.4. Even distant balls connect. Raise it to 2 or more. The balls shrink and rarely merge.',
    'Set "Debug view" to "Field value". You see the contours of F. With inverse square, values remain all the way to the screen edge.',
    'Set B\'s function to "Wyvill". "Contributing balls per pixel" becomes much smaller than the ball count. This is the benefit of a distance-limited function.',
    ],
    refs: [
    'ACM Transactions on Graphics 1(3). The blobby model built from Gaussian influence functions.',
    'The Visual Computer 2(4). A polynomial influence function that is 0 outside a radius, plus space partitioning.',
    'Explains 2D metaball fields and contour extraction step by step.',
    ],
    params: {
    method: { label: 'Influence function', group: 'Field', options: { 0: 'Separate circles (max)', 1: 'Inverse square sum (r²/d²)', 2: 'Wyvill polynomial sum (limited radius)' } },
    thr: 'Threshold',
    debug: { label: 'Debug view', options: { 0: 'Final', 1: 'Field value (contours)' } },
    count: { label: 'Ball count', group: 'Scene' },
    speed: 'Move speed',
    },
  },

  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, P = ctx.params;
    const MAX = 32;
    const VS = U.gl.QUAD_VS;
    const FS = `precision highp float; varying vec2 v_uv;
uniform vec2 u_res; uniform vec3 u_ball[${MAX}]; uniform vec3 u_col[${MAX}];
uniform float u_count; uniform float u_method; uniform float u_thr; uniform float u_debug;
void main(){
  vec2 p = vec2(v_uv.x * u_res.x, (1.0 - v_uv.y) * u_res.y);
  float F = 0.0;
  vec3 cw = vec3(0.0); float wsum = 0.0;
  for (int i = 0; i < ${MAX}; i++) {
    if (float(i) >= u_count) break;
    vec3 b = u_ball[i];
    vec2 d = p - b.xy;
    float d2 = dot(d, d);
    float f;
    if (u_method < 1.5) {
      f = (b.z * b.z) / max(d2, 1e-3);
    } else {
      float R2 = 4.0 * b.z * b.z;
      float k = max(1.0 - d2 / R2, 0.0);
      f = k * k * k / 0.421875;
    }
    if (u_method < 0.5) F = max(F, f); else F += f;
    cw += u_col[i] * f; wsum += f;
  }
  float T = u_method < 0.5 ? 1.0 : u_thr;
  vec3 base = wsum > 0.0 ? cw / wsum : vec3(0.0);
  vec3 bg = vec3(0.07, 0.08, 0.1) + 0.03 * step(0.5, fract((p.x + p.y) / 40.0));
  if (u_debug > 0.5) {
    float v = F / T;
    float lv = log2(max(v, 1e-4)) * 2.0;
    float iso = smoothstep(0.85, 1.0, abs(fract(lv) - 0.5) * 2.0);
    vec3 heat = mix(vec3(0.05, 0.1, 0.3), vec3(1.0, 0.6, 0.2), clamp(v, 0.0, 1.0));
    vec3 c = mix(heat * (1.0 - 0.5 * iso), vec3(1.0), 1.0 - smoothstep(0.0, 0.03, abs(v - 1.0)));
    gl_FragColor = vec4(c, 1.0);
    return;
  }
  float e = smoothstep(T * 0.96, T * 1.04, F);
  float rim = smoothstep(T * 1.0, T * 1.6, F);
  vec3 fill = base * (0.55 + 0.45 * rim) + vec3(0.25) * (1.0 - rim) * e;
  gl_FragColor = vec4(mix(bg, fill, e), 1.0);
}`;
    const prog = U.gl.program(gl, VS, FS);
    const quad = U.gl.quad(gl);
    const rng = ctx.rng;
    const PAL = ['#4fc3f7', '#ff7a59', '#7ee787', '#f2cc60', '#d2a8ff', '#ff6b9a'].map(U.hexToRgb01);
    const balls = [];
    for (let i = 0; i < P.count; i++) {
      balls.push({ x: rng.range(0.15, 0.85), y: rng.range(0.15, 0.85), vx: rng.range(-0.12, 0.12), vy: rng.range(-0.12, 0.12), r: rng.range(0.035, 0.075), c: PAL[i % PAL.length] });
    }
    const bu = new Float32Array(MAX * 3), cu = new Float32Array(MAX * 3);

    return {
      update(dt) {
        const m = ctx.input.mouse, W = ctx.width, H = ctx.height, s = Math.min(W, H);
        for (let i = 0; i < balls.length; i++) {
          const b = balls[i];
          if (i === 0 && m.inside) { b.x = m.x / W; b.y = m.y / H; continue; }
          b.x += b.vx * dt * P.speed * (s / W); b.y += b.vy * dt * P.speed * (s / H);
          if (b.x < 0.05 || b.x > 0.95) { b.vx *= -1; b.x = U.clamp(b.x, 0.05, 0.95); }
          if (b.y < 0.05 || b.y > 0.95) { b.vy *= -1; b.y = U.clamp(b.y, 0.05, 0.95); }
        }
      },
      render() {
        const pw = ctx.pixelWidth, ph = ctx.pixelHeight, s = Math.min(pw, ph);
        gl.viewport(0, 0, pw, ph);
        gl.disable(gl.BLEND);
        balls.forEach((b, i) => {
          bu[i * 3] = b.x * pw; bu[i * 3 + 1] = b.y * ph; bu[i * 3 + 2] = b.r * s;
          cu[i * 3] = b.c[0]; cu[i * 3 + 1] = b.c[1]; cu[i * 3 + 2] = b.c[2];
        });
        prog.use();
        gl.uniform2f(prog.u('u_res'), pw, ph);
        gl.uniform3fv(prog.u('u_ball'), bu);
        gl.uniform3fv(prog.u('u_col'), cu);
        gl.uniform1f(prog.u('u_count'), balls.length);
        gl.uniform1f(prog.u('u_method'), P.method);
        gl.uniform1f(prog.u('u_thr'), P.thr);
        gl.uniform1f(prog.u('u_debug'), P.debug);
        quad.draw(prog);

        // 거친 격자에서 "의미 있는 기여"를 하는 볼 수를 셈 (역제곱은 0이 되지 않으므로 전부)
        const GX = 32, GY = 20;
        let contrib = 0;
        for (let gy = 0; gy < GY; gy++) for (let gx = 0; gx < GX; gx++) {
          const x = ((gx + 0.5) / GX) * pw, y = ((gy + 0.5) / GY) * ph;
          for (const b of balls) {
            if (P.method !== 2) { contrib++; continue; }
            const dx = x - b.x * pw, dy = y - b.y * ph, R = 2 * b.r * s;
            if (dx * dx + dy * dy < R * R) contrib++;
          }
        }
        const evals = pw * ph * balls.length;
        ctx.stat(GTL.L('볼 수', 'Ball count'), balls.length);
        ctx.stat(GTL.L('픽셀당 기여 볼 수 (평균)', 'Contributing balls per pixel (avg)'), (contrib / (GX * GY)).toFixed(1));
        ctx.stat(GTL.L('필드 계산/프레임', 'Field evals/frame'), `${(evals / 1e6).toFixed(1)} M`);
      },
    };
  },
});
