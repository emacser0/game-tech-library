// 감마 보정 블렌딩: sRGB 값 그대로 섞기 vs 선형 공간에서 섞기
GTL.register({
  id: 'linear-space-blending',
  title: '감마 보정 블렌딩 (sRGB vs 선형 공간)',
  summary: '화면에 저장된 sRGB 값은 빛의 양에 비례하지 않음. 이 값을 그대로 더하고 섞으면 그라디언트가 탁해지고, 조명 겹침, 반투명, 블러가 어둡게 틀어짐.',
  renderer: 'webgl',
  views: { a: 'sRGB 값 그대로 연산', b: '선형 공간에서 연산' },
  info: `
    <p>모니터에 보내는 8비트 값은 <b>감마 인코딩(sRGB, 대략 x^(1/2.2))</b>된 값. 사람 눈의 밝기 민감도에 맞춘 것임.
    그래서 값 128은 빛의 양으로 255의 50%가 아니라 약 <b>21%</b>임.</p>
    <p>빛 덧셈, 알파 블렌딩, 필터링(블러, 축소), 그라디언트 보간은 모두 <b>실제 빛의 양</b>을 다루는 연산. 따라서
    <code>decode(sRGB) → 연산 → encode</code> 순서로 처리해야 함. 엔진에서는 sRGB 텍스처 포맷(<code>SRGB8_ALPHA8</code>)과 sRGB 렌더 타겟이
    샘플링과 블렌딩 때 이 변환을 하드웨어로 처리.</p>
    <p>화면은 네 패널로 나뉨</p>
    <ul>
    <li><b>①</b> 그라디언트 보간</li>
    <li><b>②</b> 겹치는 컬러 조명</li>
    <li><b>③</b> 1px 체커 vs 50% 블렌드, 안티에일리어싱 선</li>
    <li><b>④</b> 작은 밝은 점들의 블러</li>
    </ul>`,
  diagram: (L) => `<svg viewBox="0 0 540 176" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <line x1="40" y1="140" x2="230" y2="140" class="d-dim"/><line x1="40" y1="140" x2="40" y2="22" class="d-dim"/>
    <polyline points="${Array.from({ length: 31 }, (_, i) => { const x = i / 30; return `${40 + x * 180},${140 - Math.pow(x, 2.2) * 110}`; }).join(' ')}" class="d-line"/>
    <line x1="130" y1="140" x2="130" y2="116" class="d-a" stroke-dasharray="3 2"/><line x1="40" y1="116" x2="130" y2="116" class="d-a" stroke-dasharray="3 2"/>
    <circle cx="130" cy="116" r="3.5" class="f-a"/>
    <line x1="171" y1="140" x2="171" y2="85" class="d-b" stroke-dasharray="3 2"/><line x1="40" y1="85" x2="171" y2="85" class="d-b" stroke-dasharray="3 2"/>
    <circle cx="171" cy="85" r="3.5" class="f-b"/>
    <text x="34" y="119" text-anchor="end" class="t-small t-a">21%</text><text x="34" y="88" text-anchor="end" class="t-small t-b">50%</text>
    <text x="130" y="152" text-anchor="middle" class="t-small t-a">128</text><text x="171" y="152" text-anchor="middle" class="t-small t-b">186</text>
    <text x="135" y="168" text-anchor="middle" class="t-small t-dim">${L('저장 값 (sRGB 0~255)', 'Stored value (sRGB 0~255)')}</text>
    <text x="44" y="18" class="t-small t-dim">${L('빛의 양 = 값^2.2', 'Light = value^2.2')}</text>
    <text x="260" y="22" class="t-a">${L('A: 검정과 흰색을 sRGB 값으로 평균', 'A: average black and white as sRGB')}</text>
    <text x="260" y="40" class="t-small t-mono">(0 + 255) / 2 = 128</text>
    <text x="260" y="54" class="t-small">${L('빛은 21%뿐: 너무 어두움', 'Only 21% light: too dark')}</text>
    <text x="260" y="84" class="t-b">${L('B: 선형 공간에서 평균', 'B: average in linear space')}</text>
    <rect x="260" y="94" width="66" height="26" rx="3" class="f-dim"/><text x="293" y="111" text-anchor="middle" class="t-small">decode</text>
    <path d="M326,107 L346,107" class="d-accent" marker-end="url(#arr)"/>
    <rect x="348" y="94" width="86" height="26" rx="3" class="f-dim"/><text x="391" y="111" text-anchor="middle" class="t-small t-mono">(0 + 1) / 2</text>
    <path d="M434,107 L454,107" class="d-accent" marker-end="url(#arr)"/>
    <rect x="456" y="94" width="66" height="26" rx="3" class="f-dim"/><text x="489" y="111" text-anchor="middle" class="t-small">encode</text>
    <text x="260" y="138" class="t-small">${L('빛 50% = 저장 값 186', '50% light = stored value 186')}</text>
    <text x="260" y="156" class="t-small t-dim">${L('블렌딩, 필터링, 조명 덧셈 모두 같은 원리', 'Blending, filtering and lighting work the same way')}</text>
  </svg>`,
  look: [
    '① 빨강→초록 그라디언트의 가운데를 보면 A는 칙칙한 갈색, B는 밝은 노랑임',
    '③ 화면에서 조금 떨어져 보면 1px 흑백 체커(왼쪽)와 밝기가 같은 쪽은 B의 50% 블렌드(가운데)임. A는 확연히 어두움.',
    '③ 회전하는 가는 선을 보면 A는 각도에 따라 굵기가 출렁여 "로프"처럼 보임. 안티에일리어싱 커버리지가 비선형으로 표시되기 때문.',
    '④ 블러 반경을 키우면 A의 별빛은 거의 사라지고 회색으로 죽음. B는 빛의 총량이 그대로 남음.',
    '"전달 함수"를 pow 2.2 근사로 바꿔도 결과는 거의 같음. 중요한 것은 연산 공간임.',
  ],
  refs: [
    { type: 'book', title: 'GPU Gems 3, Ch.24: The Importance of Being Linear (Larry Gritz, Eugene d\'Eon)', url: 'https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-24-importance-being-linear', year: 2007 },
    { type: 'paper', title: 'IEC 61966-2-1: Default RGB colour space - sRGB', year: 1999, note: 'sRGB 전달 함수(선형 구간 + 2.4 지수)의 정의' },
    { type: 'talk', title: 'Uncharted 2: HDR Lighting (John Hable)', year: 2010, note: 'GDC 2010. 선형 공간 조명과 감마의 중요성을 설명한 고전 발표.' },
    { type: 'engine', title: 'Unity: Linear or gamma workflow', url: 'https://docs.unity3d.com/Manual/LinearRendering-LinearOrGammaWorkflow.html' },
  ],
  params: [
    { key: 'space', label: '연산 공간', type: 'select', group: '블렌딩', options: [
      { value: 'srgb', label: 'sRGB 값 그대로 (감마 공간)' },
      { value: 'linear', label: '선형 공간 (decode → 연산 → encode)' },
    ], a: 'srgb', b: 'linear' },
    { key: 'curve', label: '전달 함수', type: 'select', options: [
      { value: 'exact', label: 'sRGB 정확식' },
      { value: 'pow', label: 'pow 2.2 근사' },
    ], default: 'exact', when: (p) => p.space === 'linear' },
    { key: 'lightI', label: '조명 세기', type: 'range', min: 0.2, max: 2, step: 0.01, default: 0.9, group: '장면', shared: true },
    { key: 'blur', label: '블러 반경 (px)', type: 'range', min: 0, max: 14, step: 0.5, default: 6, shared: true },
    { key: 'animate', label: '움직임', type: 'bool', default: true, shared: true },
  ],
  en: {
    title: 'Gamma-Correct Blending (sRGB vs Linear Space)',
    summary: 'sRGB values stored on screen are not proportional to the amount of light. If you add and mix them as they are, gradients get muddy, and overlapping lights, transparency, and blur turn too dark.',
    views: { a: 'Math on raw sRGB values', b: 'Math in linear space' },
    info: `
    <p>The 8-bit values sent to a monitor are <b>gamma encoded (sRGB, about x^(1/2.2))</b>. This matches how sensitive human eyes are to brightness.
    So the value 128 is not 50% of the light of 255. It is about <b>21%</b>.</p>
    <p>Adding light, alpha blending, filtering (blur, downscaling), and gradient interpolation all work on the <b>real amount of light</b>. So you must
    process in the order <code>decode(sRGB) → math → encode</code>. In engines, sRGB texture formats (<code>SRGB8_ALPHA8</code>) and sRGB render targets
    do this conversion in hardware during sampling and blending.</p>
    <p>The screen has four panels.</p>
    <ul>
    <li><b>①</b> Gradient interpolation</li>
    <li><b>②</b> Overlapping colored lights</li>
    <li><b>③</b> 1px checker vs 50% blend, anti-aliased line</li>
    <li><b>④</b> Blur of small bright dots</li>
    </ul>`,
    look: [
      '① Look at the middle of the red to green gradient. A is a dull brown. B is a bright yellow.',
      '③ Step back a little from the screen. The side that matches the brightness of the 1px black and white checker (left) is B\'s 50% blend (middle). A is clearly darker.',
      '③ Look at the thin rotating line. In A, its width wobbles with the angle and it looks like a "rope". This is because anti-aliasing coverage is shown nonlinearly.',
      '④ Raise the blur radius. In A, the starlight almost vanishes and turns gray. In B, the total amount of light stays the same.',
      'Switching "Transfer function" to the pow 2.2 approximation gives almost the same result. What matters is the space you do the math in.',
    ],
    refs: [
      null,
      'Defines the sRGB transfer function (linear segment + 2.4 exponent).',
      'GDC 2010. A classic talk on linear space lighting and why gamma matters.',
      null,
    ],
    params: {
      space: { label: 'Math space', group: 'Blending', options: { srgb: 'Raw sRGB values (gamma space)', linear: 'Linear space (decode → math → encode)' } },
      curve: { label: 'Transfer function', options: { exact: 'Exact sRGB formula', pow: 'pow 2.2 approximation' } },
      lightI: { label: 'Light intensity', group: 'Scene' },
      blur: 'Blur radius (px)',
      animate: 'Motion',
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
      uniform vec2 u_res; uniform float u_time; uniform float u_linear; uniform float u_exact;
      uniform float u_light; uniform float u_blur; uniform sampler2D u_label;
      varying vec2 v_uv;

      vec3 dec(vec3 c){
        if (u_exact > 0.5) return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
        return pow(c, vec3(2.2));
      }
      vec3 enc(vec3 c){
        c = clamp(c, 0.0, 1.0);
        if (u_exact > 0.5) return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
        return pow(c, vec3(1.0 / 2.2));
      }
      vec3 toWork(vec3 c){ return u_linear > 0.5 ? dec(c) : c; }
      vec3 toScreen(vec3 c){ return u_linear > 0.5 ? enc(c) : clamp(c, 0.0, 1.0); }

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

      vec3 panelGradient(vec2 q){
        float t = clamp((q.x - 0.06) / 0.88, 0.0, 1.0);
        float band = floor(q.y * 4.0);
        vec3 a = vec3(1.0, 0.0, 0.0), b = vec3(0.0, 1.0, 0.0);
        if (band == 2.0) { a = vec3(0.0, 0.2, 1.0); b = vec3(1.0, 0.85, 0.0); }
        if (band == 1.0) { a = vec3(0.0); b = vec3(1.0); }
        if (band == 0.0) { a = vec3(1.0, 0.0, 1.0); b = vec3(0.0, 1.0, 0.6); }
        if (q.x < 0.06 || q.x > 0.94 || fract(q.y * 4.0) < 0.12) return vec3(0.08);
        return toScreen(mix(toWork(a), toWork(b), t));
      }
      vec3 panelLights(vec2 q, vec2 px){
        vec3 acc = toWork(vec3(0.12, 0.12, 0.14));
        vec3 cols[3];
        cols[0] = vec3(1.0, 0.15, 0.1); cols[1] = vec3(0.15, 1.0, 0.2); cols[2] = vec3(0.2, 0.35, 1.0);
        for (int i = 0; i < 3; i++) {
          float fi = float(i);
          float a = u_time * 0.4 + fi * 2.094;
          vec2 c = vec2(0.5, 0.5) + vec2(cos(a), sin(a)) * 0.16;
          float d = length((q - c) * vec2(px.x / px.y, 1.0));
          float att = u_light / (1.0 + d * d * 60.0);
          acc += toWork(cols[i]) * att;
        }
        return toScreen(acc);
      }
      vec3 panelCoverage(vec2 q, vec2 fc){
        if (q.x < 0.3) {
          float ch = mod(floor(fc.x) + floor(fc.y), 2.0);
          return vec3(ch);
        }
        if (q.x < 0.36) return vec3(0.08);
        if (q.x < 0.62) {
          return toScreen(mix(toWork(vec3(0.0)), toWork(vec3(1.0)), 0.5));
        }
        if (q.x < 0.66) return vec3(0.08);
        vec2 c = vec2(0.83, 0.5);
        vec2 p = (q - c) * u_res * vec2(0.5, 0.5);
        float cov = 0.0;
        for (int i = 0; i < 6; i++) {
          float a = u_time * 0.15 + float(i) * 0.5236;
          vec2 dir = vec2(cos(a), sin(a));
          float dist = abs(dot(p, vec2(-dir.y, dir.x)));
          cov = max(cov, clamp(1.0 - dist / 0.75, 0.0, 1.0) * step(length(p), u_res.y * 0.2));
        }
        vec3 bg = vec3(0.05, 0.07, 0.15);
        return toScreen(mix(toWork(bg), toWork(vec3(1.0, 0.95, 0.8)), cov));
      }
      vec3 stars(vec2 p){
        vec2 cell = floor(p / 18.0);
        float h = hash(cell);
        vec2 c = (cell + vec2(0.2) + 0.6 * vec2(hash(cell + 3.1), hash(cell + 7.7))) * 18.0;
        float on = step(0.45, h) * step(length(p - c), 1.6);
        vec3 col = mix(vec3(1.0, 0.8, 0.4), vec3(0.5, 0.8, 1.0), hash(cell + 1.3));
        return mix(vec3(0.02, 0.02, 0.05), col, on);
      }
      vec3 panelBlur(vec2 px){
        vec3 acc = vec3(0.0); float wsum = 0.0;
        for (int y = -4; y <= 4; y++) for (int x = -4; x <= 4; x++) {
          vec2 o = vec2(float(x), float(y)) * (u_blur / 4.0);
          float w = exp(-dot(vec2(float(x), float(y)), vec2(float(x), float(y))) / 8.0);
          acc += toWork(stars(px + o)) * w; wsum += w;
        }
        return toScreen(acc / wsum);
      }

      void main(){
        vec2 uv = v_uv;
        vec2 fc = gl_FragCoord.xy;
        vec2 half_ = u_res * 0.5;
        vec2 q = fract(uv * 2.0);
        vec3 c;
        if (uv.y >= 0.5) c = uv.x < 0.5 ? panelGradient(q) : panelLights(q, half_);
        else c = uv.x < 0.5 ? panelCoverage(q, fc) : panelBlur(fc + vec2(u_time * 6.0, 0.0));
        vec2 e = abs(uv - 0.5) * u_res;
        if (min(e.x, e.y) < 1.5) c = vec3(0.0);
        vec4 lab = texture2D(u_label, vec2(uv.x, 1.0 - uv.y));
        c = mix(c, lab.rgb, lab.a);
        gl_FragColor = vec4(c, 1.0);
      }`;
    const prog = U.gl.program(gl, U.gl.QUAD_VS, fs);
    const quad = U.gl.quad(gl);
    let labelTex = null, lw = 0, lh = 0, t = 0;

    function buildLabels() {
      lw = ctx.pixelWidth; lh = ctx.pixelHeight;
      const cv = ctx.createCanvas(lw, lh), g = cv.getContext('2d'), s = ctx.pixelRatio;
      g.clearRect(0, 0, lw, lh);
      g.font = `bold ${12 * s}px sans-serif`;
      g.textBaseline = 'top';
      const lab = (str, x, y) => { g.fillStyle = 'rgba(0,0,0,0.75)'; g.fillRect(x - 3 * s, y - 2 * s, g.measureText(str).width + 6 * s, 16 * s); g.fillStyle = '#ffffff'; g.fillText(str, x, y); };
      lab(GTL.L('① 그라디언트 보간', '① Gradient interpolation'), 6 * s, 6 * s);
      lab(GTL.L('② 조명 덧셈', '② Light addition'), lw / 2 + 6 * s, 6 * s);
      lab(GTL.L('③ 1px 체커 | 50% 블렌드 | AA 선', '③ 1px checker | 50% blend | AA line'), 6 * s, lh / 2 + 6 * s);
      lab(GTL.L('④ 블러 (밝은 점)', '④ Blur (bright dots)'), lw / 2 + 6 * s, lh / 2 + 6 * s);
      if (labelTex) gl.deleteTexture(labelTex);
      labelTex = U.gl.texture(gl, cv);
    }

    return {
      update(dt) { if (P.animate) t += dt; },
      render() {
        if (!labelTex || lw !== ctx.pixelWidth || lh !== ctx.pixelHeight) buildLabels();
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        prog.use();
        gl.uniform2f(prog.u('u_res'), ctx.pixelWidth, ctx.pixelHeight);
        gl.uniform1f(prog.u('u_time'), t);
        gl.uniform1f(prog.u('u_linear'), P.space === 'linear' ? 1 : 0);
        gl.uniform1f(prog.u('u_exact'), P.curve === 'exact' ? 1 : 0);
        gl.uniform1f(prog.u('u_light'), P.lightI);
        gl.uniform1f(prog.u('u_blur'), P.blur * ctx.pixelRatio);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, labelTex);
        gl.uniform1i(prog.u('u_label'), 0);
        quad.draw(prog);
        const half = P.space === 'linear' ? Math.round((P.curve === 'exact' ? 0.7354 : 0.7297) * 255) : 128;
        ctx.stat(GTL.L('50% 블렌드 결과값', '50% blend result'), `${half} / 255`);
        ctx.stat(GTL.L('128의 실제 빛 양', 'Real light amount of 128'), '≈ 21.6%');
      },
    };
  },
});
