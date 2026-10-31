// 톤 매핑: HDR 값을 [0,1] 디스플레이로, Clamp / Reinhard / Reinhard 확장 / 휘도 Reinhard / Hable / ACES 근사
GTL.register({
  id: 'tonemap-operators',
  title: '톤 매핑 연산자 (Clamp, Reinhard, Filmic, ACES)',
  summary: 'HDR 장면의 밝기는 0.01부터 수십까지 퍼져 있음. 1에서 그냥 자르면 하이라이트가 하얗게 날아가고 색이 틀어짐. 톤 매핑 곡선은 하이라이트를 부드럽게 눌러 디테일과 색을 남김.',
  renderer: 'webgl',
  views: { a: 'Clamp (톤 매핑 없음)', b: 'ACES 근사 (Narkowicz)' },
  info: `
    <p>조명 계산 결과는 실제 빛의 양이라 상한 없음 (해 = 수십, 실내 = 0.1). 디스플레이는 0~1만 표현.</p>
    <p>그래서 세 단계를 거침. <b>노출(Exposure)</b>로 장면 밝기를 맞추고, <b>톤 매핑 곡선</b>으로 압축하고, 마지막에 sRGB로 인코딩.</p>
    <ul>
    <li><b>Clamp</b>: 1 이상을 잘라냄. 하이라이트 디테일이 사라짐. 채널마다 따로 잘려서 색상이 노랑이나 청록으로 틀어짐.</li>
    <li><b>Reinhard</b> <code>x/(1+x)</code> (2002): 1에 절대 도달하지 않아 화면 전체가 물 빠진 느낌. 확장형은 흰점 L<sub>white</sub>에서 1이 됨.</li>
    <li><b>휘도 Reinhard</b>: 휘도에만 곡선을 적용하고 색 비율은 유지. 색은 지켜지지만, 아주 밝은 색이 흰색으로 "탈색"되지 않아 부자연스러울 수 있음.</li>
    <li><b>Hable (Uncharted 2 Filmic)</b>: 필름 특성처럼 어두운 영역에 토(toe), 밝은 영역에 숄더(shoulder)가 있는 S자 곡선</li>
    <li><b>ACES 근사</b> (Narkowicz): ACES RRT+ODT를 유리함수 하나로 피팅한 곡선. 대비가 강하고 밝은 색은 자연스럽게 흰색으로 탈색.</li>
    </ul>
    <p>오른쪽 아래 그래프는 현재 곡선 (입력 0~8, 노출 적용 후). 점선은 Clamp.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 172" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <line x1="40" y1="140" x2="320" y2="140" class="d-dim"/><line x1="40" y1="140" x2="40" y2="20" class="d-dim"/>
    <line x1="40" y1="40" x2="320" y2="40" class="d-dim" stroke-dasharray="2 3"/>
    <text x="34" y="44" text-anchor="end" class="t-small t-mono">1</text><text x="34" y="144" text-anchor="end" class="t-small t-mono">0</text>
    ${[1, 2, 4, 8].map((v) => `<text x="${40 + v * 35}" y="153" text-anchor="middle" class="t-small t-mono">${v}</text>`).join('')}
    <polyline points="${Array.from({ length: 81 }, (_, i) => { const x = i / 10; return `${40 + x * 35},${140 - Math.min(x, 1) * 100}`; }).join(' ')}" class="d-a"/>
    <polyline points="${Array.from({ length: 81 }, (_, i) => { const x = i / 10; return `${40 + x * 35},${140 - x / (1 + x) * 100}`; }).join(' ')}" class="d-dim" stroke-dasharray="4 3"/>
    <polyline points="${Array.from({ length: 81 }, (_, i) => { const x = i / 10, y = Math.min(1, Math.max(0, (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14))); return `${40 + x * 35},${140 - y * 100}`; }).join(' ')}" class="d-b"/>
    <text x="180" y="168" text-anchor="middle" class="t-small t-dim">${L('입력 (노출 적용 후 HDR 값)', 'Input (HDR value after exposure)')}</text>
    <text x="96" y="34" class="t-small t-a">${L('Clamp: 1 이상 잘림', 'Clamp: cut at 1')}</text>
    <text x="230" y="76" class="t-small t-dim">Reinhard x/(1+x)</text>
    <text x="250" y="34" class="t-small t-b">${L('ACES 근사', 'ACES fit')}</text>
    <text x="350" y="22">${L('처리 순서', 'Order')}</text>
    ${[[L('HDR 조명 값', 'HDR light value'), 30], [L('x 노출', 'x exposure'), 62], [L('톤 매핑 곡선', 'Tone curve'), 94], [L('sRGB 인코딩', 'sRGB encode'), 126]].map(([t, y], i) => `<rect x="350" y="${y}" width="140" height="22" rx="3" class="f-dim"/><text x="420" y="${y + 15}" text-anchor="middle" class="t-small">${t}</text>${i < 3 ? `<path d="M420,${y + 22} L420,${y + 30}" class="d-accent" marker-end="url(#arr)"/>` : ''}`).join('')}
    <text x="350" y="164" class="t-small t-dim">${L('곡선이 0~무한을 0~1로 압축', 'The curve squeezes 0~inf into 0~1')}</text>
  </svg>`,
  look: [
    'A와 B의 해, 가로등 주변, 위쪽 HDR 램프 오른쪽 절반을 비교하면 A는 평평한 흰색 덩어리이고 B는 단계가 살아 있음',
    '아래쪽 컬러 램프(파랑, 빨강, 초록, 오른쪽으로 갈수록 2배씩 밝아짐)를 보면 Clamp는 색이 그대로 포화됨. ACES와 Hable은 점점 흰색으로 탈색됨 (실제 카메라나 눈과 비슷).',
    'B를 Reinhard로 바꾸면 하이라이트는 남지만 전체가 회색빛으로 뜸. 확장형으로 바꾸고 흰점(Lwhite)을 조정하면 차이가 보임.',
    '노출을 ±2EV 움직이면 각 곡선이 어두운 장면과 밝은 장면에서 얼마나 견디는지 보임',
  ],
  refs: [
    { type: 'paper', title: 'Photographic Tone Reproduction for Digital Images (Reinhard, Stark, Shirley, Ferwerda)', url: 'https://dl.acm.org/doi/10.1145/566654.566575', year: 2002, note: 'SIGGRAPH 2002. x/(1+x)와 흰점 확장식.' },
    { type: 'article', title: 'ACES Filmic Tone Mapping Curve (Krzysztof Narkowicz)', url: 'https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/', year: 2016, note: '유리함수 근사 a=2.51, b=0.03, c=2.43, d=0.59, e=0.14' },
    { type: 'talk', title: 'Uncharted 2: HDR Lighting (John Hable)', year: 2010, note: 'GDC 2010. Filmic 곡선 A=0.15 B=0.50 C=0.10 D=0.20 E=0.02 F=0.30, W=11.2.' },
    { type: 'engine', title: 'Unreal Engine: Color Grading and the Filmic Tonemapper', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/color-grading-and-the-filmic-tonemapper-in-unreal-engine' },
  ],
  params: [
    { key: 'op', label: '연산자', type: 'select', group: '톤 매핑', options: [
      { value: 0, label: 'Clamp (없음)' },
      { value: 1, label: 'Reinhard x/(1+x)' },
      { value: 2, label: 'Reinhard 확장 (흰점)' },
      { value: 3, label: 'Reinhard (휘도만)' },
      { value: 4, label: 'Hable / Uncharted 2' },
      { value: 5, label: 'ACES 근사 (Narkowicz)' },
    ], a: 0, b: 5 },
    { key: 'exposure', label: '노출 (EV)', type: 'range', min: -4, max: 4, step: 0.1, default: 0 },
    { key: 'white', label: '흰점 Lwhite', type: 'range', min: 1, max: 20, step: 0.1, default: 6, when: (p) => p.op === 2 || p.op === 3 },
    { key: 'sunI', label: '해 밝기', type: 'range', min: 1, max: 100, step: 1, default: 40, group: '장면', shared: true },
    { key: 'animate', label: '해 움직임', type: 'bool', default: true, shared: true },
    { key: 'showCurve', label: '곡선 그래프', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Tone Mapping Operators (Clamp, Reinhard, Filmic, ACES)',
    summary: 'Brightness in an HDR scene spreads from 0.01 to tens. If you simply cut at 1, highlights blow out to white and colors shift. A tone mapping curve gently compresses highlights and keeps detail and color.',
    views: { a: 'Clamp (no tone mapping)', b: 'ACES approx. (Narkowicz)' },
    info: `
    <p>Lighting results are real amounts of light, so they have no upper limit (sun = tens, indoors = 0.1). A display shows only 0 to 1.</p>
    <p>So there are three steps. <b>Exposure</b> sets the scene brightness, a <b>tone mapping curve</b> compresses it, and sRGB encoding comes last.</p>
    <ul>
    <li><b>Clamp</b>: cuts everything above 1. Highlight detail is lost. Each channel is cut separately, so hues shift to yellow or cyan.</li>
    <li><b>Reinhard</b> <code>x/(1+x)</code> (2002): never reaches 1, so the whole image looks washed out. The extended form reaches 1 at the white point L<sub>white</sub>.</li>
    <li><b>Luminance Reinhard</b>: applies the curve only to luminance and keeps color ratios. Color is kept, but very bright colors do not "desaturate" to white, which can look unnatural.</li>
    <li><b>Hable (Uncharted 2 Filmic)</b>: an S-curve like film, with a toe in dark areas and a shoulder in bright areas.</li>
    <li><b>ACES approx.</b> (Narkowicz): a single rational function fitted to the ACES RRT+ODT. Contrast is strong, and bright colors desaturate to white naturally.</li>
    </ul>
    <p>The graph at the bottom right shows the current curve (input 0 to 8, after exposure). The dotted line is Clamp.</p>`,
    look: [
      'Compare the sun, the area around the street lights, and the right half of the HDR ramp at the top. A shows flat white blobs. B keeps the steps.',
      'Look at the color lamps at the bottom (blue, red, green, each twice as bright as the one to its left). Clamp keeps the colors saturated. ACES and Hable fade to white (like a real camera or eye).',
      'Switch B to Reinhard. Highlights stay, but the whole image looks grayish. Switch to the extended form and adjust the white point (Lwhite) to see the difference.',
      'Move exposure by ±2EV. You can see how well each curve holds up in dark and bright scenes.',
    ],
    refs: [
      'SIGGRAPH 2002. x/(1+x) and the white point extension.',
      'Rational function approximation a=2.51, b=0.03, c=2.43, d=0.59, e=0.14.',
      'GDC 2010. Filmic curve A=0.15 B=0.50 C=0.10 D=0.20 E=0.02 F=0.30, W=11.2.',
      null,
    ],
    params: {
      op: { label: 'Operator', group: 'Tone mapping', options: {
        0: 'Clamp (none)', 2: 'Reinhard extended (white point)', 3: 'Reinhard (luminance only)', 5: 'ACES approx. (Narkowicz)',
      } },
      exposure: 'Exposure (EV)',
      white: 'White point Lwhite',
      sunI: { label: 'Sun brightness', group: 'Scene' },
      animate: 'Sun movement',
      showCurve: 'Curve graph',
    },
  },

  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, P = ctx.params;
    const fs = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      uniform vec2 u_res; uniform float u_time; uniform float u_op; uniform float u_exp;
      uniform float u_white; uniform float u_sun; uniform float u_curve;
      varying vec2 v_uv;

      float lum(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
      vec3 hableF(vec3 x){
        float A = 0.15, B = 0.50, C = 0.10, D = 0.20, E = 0.02, F = 0.30;
        return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
      }
      vec3 tonemap(vec3 c){
        if (u_op < 0.5) return clamp(c, 0.0, 1.0);
        if (u_op < 1.5) return c / (1.0 + c);
        if (u_op < 2.5) return clamp(c * (1.0 + c / (u_white * u_white)) / (1.0 + c), 0.0, 1.0);
        if (u_op < 3.5) {
          float L = lum(c);
          float Ld = L * (1.0 + L / (u_white * u_white)) / (1.0 + L);
          return clamp(c * (Ld / max(L, 1e-5)), 0.0, 1.0);
        }
        if (u_op < 4.5) return clamp(hableF(c * 2.0) / hableF(vec3(11.2)), 0.0, 1.0);
        return clamp((c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14), 0.0, 1.0);
      }
      vec3 srgb(vec3 c){
        c = clamp(c, 0.0, 1.0);
        return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
      }
      float fall(float r, float d){ return 1.0 - smoothstep(0.0, r, d); }

      // HDR scene, linear radiance
      vec3 scene(vec2 q, float asp, float px){
        vec3 col;
        // HDR ramp: 2^-4 .. 2^6
        if (q.y > 0.9) {
          float st = mix(-4.0, 6.0, q.x / asp);
          float L = exp2(st);
          col = q.y > 0.95 ? vec3(L) : vec3(1.0, 0.45, 0.1) * L;
          if (abs(fract(st + 0.5) - 0.5) * (asp * 0.1 / px) < 0.75 && q.y < 0.915) col = vec3(0.0);
          return col;
        }
        if (q.y > 0.89) return vec3(0.0);
        // sky + sun
        vec2 sunP = vec2(asp * (0.62 + 0.15 * sin(u_time * 0.2)), 0.66 + 0.08 * cos(u_time * 0.2));
        float hz = 0.36;
        float sy = clamp((q.y - hz) / (0.89 - hz), 0.0, 1.0);
        col = mix(vec3(2.6, 1.7, 1.0), vec3(0.35, 0.6, 1.3), sqrt(sy));
        float ds = length(q - sunP);
        col += vec3(1.0, 0.85, 0.65) * u_sun * fall(0.045, ds);
        col += vec3(1.0, 0.7, 0.4) * u_sun * 0.06 * exp(-ds * 14.0);
        // clouds lit by sun
        float cl = sin(q.x * 9.0 + 1.3) * 0.02 + 0.74;
        if (abs(q.y - cl) < 0.025 + 0.015 * sin(q.x * 23.0)) col = mix(col, vec3(3.5, 2.6, 2.0) * (0.6 + 0.6 * exp(-abs(q.x - sunP.x) * 3.0)), 0.85);
        if (q.y < hz) {
          // ground
          col = vec3(0.05, 0.045, 0.04) * (0.5 + q.y / hz);
          // color checker strip lit by sun (radiance ~3)
          if (q.y > 0.27 && q.y < 0.33 && q.x / asp > 0.04 && q.x / asp < 0.62) {
            float k = floor((q.x / asp - 0.04) / 0.58 * 6.0);
            vec3 alb = vec3(0.45, 0.31, 0.24);
            if (k == 1.0) alb = vec3(0.75, 0.58, 0.5);
            if (k == 2.0) alb = vec3(0.35, 0.42, 0.6);
            if (k == 3.0) alb = vec3(0.3, 0.4, 0.2);
            if (k == 4.0) alb = vec3(0.18);
            if (k == 5.0) alb = vec3(0.9);
            col = alb * 3.0;
          }
          // saturated lamps: 8 per row, intensity doubles
          for (int r = 0; r < 3; r++) {
            float fr = float(r);
            vec3 lc = r == 0 ? vec3(0.08, 0.2, 1.0) : (r == 1 ? vec3(1.0, 0.06, 0.04) : vec3(0.1, 1.0, 0.15));
            float ly = 0.06 + fr * 0.07;
            for (int i = 0; i < 8; i++) {
              float fi = float(i);
              vec2 c = vec2(asp * (0.05 + fi * 0.075), ly);
              float d = length(q - c);
              float I = exp2(fi - 1.0);
              col += lc * I * (fall(0.018, d) + 0.004 / (d * d + 0.0004) * 0.05);
            }
          }
        }
        return col;
      }

      void main(){
        float asp = u_res.x / u_res.y;
        float px = 1.0 / u_res.y;
        vec2 q = vec2(v_uv.x * asp, v_uv.y);
        float e = exp2(u_exp);
        vec3 c = srgb(tonemap(scene(q, asp, px) * e));
        // curve inset
        if (u_curve > 0.5) {
          vec2 lo = vec2(asp * 0.66, 0.03), hi = vec2(asp * 0.98, 0.33);
          if (q.x > lo.x && q.x < hi.x && q.y > lo.y && q.y < hi.y) {
            vec2 g = (q - lo) / (hi - lo);
            float x = g.x * 8.0;
            vec3 bg = vec3(0.05, 0.055, 0.07);
            if (fract(x) < 0.02) bg = vec3(0.12);
            if (abs(g.y - 0.5) < 0.004 || abs(g.y - 1.0) < 0.008) bg = vec3(0.14);
            float dy = (hi.y - lo.y) / px;
            float yc = tonemap(vec3(x)).r;
            float yl = clamp(x, 0.0, 1.0);
            float dx = 8.0 / ((hi.x - lo.x) / px);
            float slope = abs(tonemap(vec3(x + dx)).r - yc) * dy;
            float dc = abs(g.y - yc) * dy / sqrt(1.0 + slope * slope);
            float dl = abs(g.y - yl) * dy;
            bg = mix(bg, vec3(0.5), fall(1.0, dl) * step(0.5, fract(x * 6.0)));
            bg = mix(bg, vec3(1.0, 0.8, 0.3), fall(1.6, dc));
            c = bg;
          }
        }
        gl_FragColor = vec4(c, 1.0);
      }`;
    const prog = U.gl.program(gl, U.gl.QUAD_VS, fs);
    const quad = U.gl.quad(gl);
    let t = 0;
    const names = ['Clamp', 'Reinhard', GTL.L('Reinhard 확장', 'Reinhard extended'), GTL.L('Reinhard 휘도', 'Reinhard luminance'), 'Hable Filmic', GTL.L('ACES 근사', 'ACES approx.')];
    // CPU 버전 (stat용): 해 원반 중심 값이 몇으로 매핑되는지
    const tmCPU = (x) => {
      const op = +P.op, w2 = P.white * P.white;
      if (op === 0) return Math.min(1, x);
      if (op === 1) return x / (1 + x);
      if (op === 2 || op === 3) return Math.min(1, x * (1 + x / w2) / (1 + x));
      if (op === 4) { const f = (v) => ((v * (0.15 * v + 0.05) + 0.004) / (v * (0.15 * v + 0.5) + 0.06)) - 0.02 / 0.3; return Math.min(1, f(x * 2) / f(11.2)); }
      return U.clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0, 1);
    };
    return {
      update(dt) { if (P.animate) t += dt; },
      render() {
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        prog.use();
        gl.uniform2f(prog.u('u_res'), ctx.pixelWidth, ctx.pixelHeight);
        gl.uniform1f(prog.u('u_time'), t);
        gl.uniform1f(prog.u('u_op'), +P.op);
        gl.uniform1f(prog.u('u_exp'), P.exposure);
        gl.uniform1f(prog.u('u_white'), P.white);
        gl.uniform1f(prog.u('u_sun'), P.sunI);
        gl.uniform1f(prog.u('u_curve'), P.showCurve ? 1 : 0);
        quad.draw(prog);
        const e = Math.pow(2, P.exposure);
        ctx.stat(GTL.L('연산자', 'Operator'), names[+P.op]);
        ctx.stat(GTL.L('회색 0.18 → 출력', 'Gray 0.18 → output'), tmCPU(0.18 * e).toFixed(3));
        ctx.stat(GTL.L('밝기 4.0 → 출력', 'Brightness 4.0 → output'), tmCPU(4 * e).toFixed(3));
        ctx.stat(GTL.L('1.0에 도달하는 입력', 'Input that reaches 1.0'), (() => { for (let x = 0.5; x < 1000; x *= 1.05) if (tmCPU(x * e) >= 0.999) return (x).toFixed(1); return GTL.L('도달 안 함', 'Never'); })());
      },
    };
  },
});
