// 피격 플래시와 스프라이트 외곽선: 프래그먼트 셰이더 한 개로 색 섞기 + 주변 알파 검사
GTL.register({
  id: 'hit-flash-outline',
  title: '피격 플래시 & 스프라이트 외곽선 셰이더',
  summary: '맞은 스프라이트를 잠깐 흰색으로 바꾸고, 투명 픽셀 주변의 알파를 검사해 외곽선을 그림. 같은 스프라이트 데이터로 피격 피드백과 배경 대비 가독성을 얻음. 곱하기 틴트로는 흰색 플래시가 불가능함.',
  renderer: 'webgl',
  views: { a: '곱하기 틴트, 외곽선 없음', b: '흰색 섞기 + 8방향 외곽선' },
  controls: '스프라이트 클릭: 피격',
  info: `
    <p><b>피격 플래시(Hit Flash)</b>는 맞은 순간 스프라이트를 1~3프레임 단색으로 바꾸는 피드백. 플레이어가 공격이 들어갔는지 바로 알게 됨.</p>
    <ul>
    <li><b>곱하기 틴트</b>: <code>color * tint</code>. 흰색을 곱하면 원래 색 그대로라서 밝게 만들 수 없음. 흔한 실수임.</li>
    <li><b>흰색 섞기</b>: <code>mix(color, flashColor, t)</code>. t = 1이면 완전히 흰색. 알파는 유지해서 실루엣이 남음.</li>
    <li><b>깜빡임</b>: 몇 프레임마다 그리기를 건너뜀. 셰이더가 필요 없지만 무적 시간 표시와 헷갈리기 쉬움.</li>
    </ul>
    <p><b>외곽선(Outline)</b>은 투명 픽셀에서 주변 텍셀의 알파를 읽음. 주변에 불투명 픽셀이 있으면 외곽선 색으로 칠함.</p>
    <ul>
    <li>4방향(마름모)은 대각선 모서리가 비어 보임. 8방향(정사각형)은 모서리까지 채움.</li>
    <li>두께가 w면 픽셀마다 최대 (2w+1)² 번 텍스처를 읽음.</li>
    <li>스프라이트 둘레에 투명 여백이 w 텍셀 이상 있어야 함. 없으면 외곽선이 잘림.</li>
    </ul>`,
  diagram: (L) => `<svg viewBox="0 0 540 172" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="14">${L('피격 플래시 색 계산', 'Hit flash color math')}</text>
    <rect x="20" y="28" width="26" height="26" class="f-good"/>
    <text x="58" y="46" text-anchor="middle">x</text>
    <rect x="70" y="28" width="26" height="26" class="d-line"/><text x="83" y="45" text-anchor="middle" class="t-small">${L('흰', 'W')}</text>
    <text x="108" y="46" text-anchor="middle">=</text>
    <rect x="120" y="28" width="26" height="26" class="f-good"/>
    <text x="20" y="72" class="t-small t-a">${L('A: 곱하기 틴트, 그대로임', 'A: multiply, no change')}</text>
    <text x="20" y="104" class="t-mono t-small">mix(</text>
    <rect x="48" y="86" width="26" height="26" class="f-good"/>
    <text x="78" y="104" class="t-small">,</text>
    <rect x="86" y="86" width="26" height="26" class="d-line"/><text x="99" y="103" text-anchor="middle" class="t-small">${L('흰', 'W')}</text>
    <text x="116" y="104" class="t-mono t-small">, 1) =</text>
    <rect x="156" y="86" width="26" height="26" class="d-line"/><text x="169" y="103" text-anchor="middle" class="t-small">${L('흰', 'W')}</text>
    <text x="20" y="130" class="t-small t-b">${L('B: 흰색 섞기, 알파 유지', 'B: mix to white, alpha kept')}</text>
    <text x="300" y="14" class="t-a">${L('A: 4방향 검사', 'A: 4-way check')}</text>
    <text x="420" y="14" class="t-b">${L('B: 8방향 검사', 'B: 8-way check')}</text>
    ${[300, 420].map((gx, k) => `${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="${gx + i * 16}" y1="24" x2="${gx + i * 16}" y2="104" class="d-dim"/><line x1="${gx}" y1="${24 + i * 16}" x2="${gx + 80}" y2="${24 + i * 16}" class="d-dim"/>`).join('')}
    <rect x="${gx}" y="56" width="48" height="48" class="f-good" opacity="0.6"/>
    <rect x="${gx + 48}" y="40" width="16" height="16" class="${k ? 'f-b' : 'd-a'}" ${k ? '' : 'fill="none" stroke-dasharray="3 2"'}/>
    ${(k ? [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]] : [[0, -1], [-1, 0], [1, 0], [0, 1]]).map(([dx, dy]) => `<circle cx="${gx + 56 + dx * 16}" cy="${48 + dy * 16}" r="2.5" class="${dx === -1 && dy === 1 ? 'f-accent' : 'f-dim'}"/>`).join('')}`).join('')}
    <text x="300" y="122" class="t-small">${L('대각선 모서리를 놓침', 'Misses the corner')}</text>
    <text x="420" y="122" class="t-small">${L('모서리까지 채움', 'Fills the corner too')}</text>
    <text x="300" y="136" class="t-small t-dim">${L('점 = 알파를 읽는 이웃', 'dots = neighbors read')}</text>
    <text x="10" y="164" class="t-small t-dim">${L('외곽선: 투명 픽셀이 이웃 알파를 읽고, 불투명 이웃이 있으면 외곽선 색으로 칠함', 'Outline: a clear pixel reads neighbor alpha and is painted if any neighbor is opaque')}</text>
  </svg>`,
  look: [
    'A와 B에서 몬스터가 맞을 때를 비교하면 A는 색이 변하지 않음. B는 한순간 하얗게 빛남.',
    'A의 "플래시 색"을 빨강으로 바꾸면 곱하기 틴트도 보이지만 어둡게 변할 뿐 밝아지지 않음.',
    'B의 "외곽선 모양"을 "4방향"으로 바꾸고 두께를 2 이상으로 올리면 대각선 모서리가 깎여 보임.',
    '외곽선을 끄면 녹색 몬스터가 수풀 배경에 묻힘. 켜면 실루엣이 바로 구분됨.',
  ],
  refs: [
    { type: 'engine', title: 'Godot Engine: CanvasItem shaders', url: 'https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/canvas_item_shader.html', note: 'TEXTURE_PIXEL_SIZE로 주변 텍셀을 읽어 외곽선을 만드는 방식에 필요한 내장 값.' },
    { type: 'talk', title: 'Juice it or lose it (Martin Jonasson, Petri Purho)', year: 2012, note: '피격 플래시 같은 작은 피드백이 손맛을 얼마나 바꾸는지 보여준 발표.' },
    { type: 'game', title: 'Hollow Knight (Team Cherry)', year: 2017, note: '적이 맞으면 흰색으로 번쩍이는 피격 플래시의 대표 사례.' },
  ],
  params: [
    { key: 'flashMode', label: '플래시 방식', type: 'select', group: '피격 플래시', options: [
      { value: 0, label: '없음' },
      { value: 1, label: '곱하기 틴트 (color * tint)' },
      { value: 2, label: '색 섞기 (mix)' },
      { value: 3, label: '깜빡임 (그리기 생략)' },
    ], a: 1, b: 2 },
    { key: 'flashColor', label: '플래시 색', type: 'color', default: '#ffffff', when: (p) => p.flashMode === 1 || p.flashMode === 2 },
    { key: 'flashDur', label: '플래시 길이 (초)', type: 'range', min: 0.03, max: 0.5, step: 0.01, default: 0.12 },
    { key: 'outline', label: '외곽선 모양', type: 'select', group: '외곽선', options: [
      { value: 0, label: '없음' },
      { value: 1, label: '4방향 (마름모)' },
      { value: 2, label: '8방향 (정사각형)' },
    ], a: 0, b: 2 },
    { key: 'outlineW', label: '외곽선 두께 (텍셀)', type: 'int', min: 1, max: 3, default: 1, when: (p) => p.outline > 0 },
    { key: 'outlineColor', label: '외곽선 색', type: 'color', default: '#101018', when: (p) => p.outline > 0 },
    { key: 'autoHit', label: '자동 피격 간격 (초)', type: 'range', min: 0.2, max: 3, step: 0.1, default: 0.7, shared: true, group: '장면' },
    { key: 'scale', label: '스프라이트 배율', type: 'int', min: 2, max: 8, default: 5, shared: true },
  ],
  en: {
    title: 'Hit Flash & Sprite Outline Shader',
    summary: 'Turn a hit sprite white for a moment, and draw an outline by checking the alpha around transparent pixels. The same sprite data gives you hit feedback and better contrast against the background. A multiply tint cannot make a white flash.',
    views: { a: 'Multiply tint, no outline', b: 'White mix + 8-way outline' },
    controls: 'Click a sprite: hit it',
    info: `
    <p>A <b>hit flash</b> is feedback that turns a sprite a solid color for 1~3 frames when it is hit. The player knows right away that the attack landed.</p>
    <ul>
    <li><b>Multiply tint</b>: <code>color * tint</code>. Multiplying by white keeps the original color, so it cannot make the sprite brighter. This is a common mistake.</li>
    <li><b>White mix</b>: <code>mix(color, flashColor, t)</code>. At t = 1 it is fully white. Alpha stays the same, so the silhouette remains.</li>
    <li><b>Blinking</b>: skip drawing every few frames. It needs no shader, but it is easy to confuse with the invincibility indicator.</li>
    </ul>
    <p>An <b>outline</b> reads the alpha of nearby texels at each transparent pixel. If an opaque pixel is nearby, it paints the outline color.</p>
    <ul>
    <li>4-way (diamond) leaves the diagonal corners empty. 8-way (square) fills the corners too.</li>
    <li>With thickness w, each pixel reads the texture up to (2w+1)² times.</li>
    <li>The sprite needs a transparent margin of at least w texels around it. Without it, the outline gets cut off.</li>
    </ul>`,
    look: [
      'Compare A and B when a monster is hit. In A, the color does not change. In B, it flashes white for a moment.',
      'Set "Flash color" in A to red. Now the multiply tint shows, but it only gets darker, never brighter.',
      'Set "Outline shape" in B to "4-way" and raise the thickness to 2 or more. The diagonal corners look cut off.',
      'Turn off the outline. The green monster blends into the grass background. Turn it on and the silhouette stands out at once.',
    ],
    refs: [
      'Built-in values you need to read nearby texels with TEXTURE_PIXEL_SIZE and build an outline.',
      'A talk that shows how much small feedback like a hit flash changes game feel.',
      'A well-known example of a hit flash: enemies flash white when hit.',
    ],
    params: {
      flashMode: { label: 'Flash mode', group: 'Hit flash', options: { 0: 'None', 1: 'Multiply tint (color * tint)', 2: 'Color mix (mix)', 3: 'Blink (skip drawing)' } },
      flashColor: 'Flash color',
      flashDur: 'Flash length (s)',
      outline: { label: 'Outline shape', group: 'Outline', options: { 0: 'None', 1: '4-way (diamond)', 2: '8-way (square)' } },
      outlineW: 'Outline thickness (texels)',
      outlineColor: 'Outline color',
      autoHit: { label: 'Auto hit interval (s)', group: 'Scene' },
      scale: 'Sprite scale',
    },
  },

  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, P = ctx.params;
    const S = 16, PAD = 4, TS = S + PAD * 2;
    // 16x16 픽셀아트 3종 (문자 = 팔레트 색)
    const ARTS = [
      { pal: { k: '#1d3b1f', g: '#3fa34d', l: '#7fdc6a', w: '#ffffff', e: '#10161a' }, rows: [
        '................', '................', '................', '......kkkk......', '....kkggggkk....', '...kgglllgggk...',
        '..kgglllggggk...', '..kgglwegwegk...', '.kggggeegeeggk..', '.kgggggggggggk..', '.kgggggggggggk..', '.kggggkkkkgggk..',
        'kgggggggggggggk.', 'kgggggggggggggk.', '.kkkkkkkkkkkkk..', '................'] },
      { pal: { k: '#2a1036', p: '#8b4bd6', l: '#c79bff', r: '#ff5050', w: '#ffffff' }, rows: [
        '................', '................', 'k..............k', 'kk....k..k....kk', 'kpk..kpkkpk..kpk', 'kppk.kppppk.kppk',
        'kpppkpprrppkpppk', '.kppppprprpppppk', '..kpppppppppppk.', '...kppwppwpppk..', '....kpppppppk...', '.....kpkkkpk....',
        '......k...k.....', '................', '................', '................'] },
      { pal: { k: '#3a1a10', r: '#d8442e', o: '#ff8a5a', w: '#f4ead2', s: '#c9b48a', e: '#1a1010' }, rows: [
        '................', '.....kkkkkk.....', '...kkrrrrrrkk...', '..krrwwrrrwwrk..', '.krrwwrrrrwwrrk.', '.krrrrrrrrrrrrk.',
        'krrrwwrrrrwwrrrk', 'krrrwwrrrrwwrrrk', 'kkkkkkkkkkkkkkkk', '....kwwwwwwk....', '....kwekwekw....', '....kwwwwwwk....',
        '....kswwwwsk....', '....kssssssk....', '.....kkkkkk.....', '................'] },
    ];
    const tex = ARTS.map((art) => {
      const cv = ctx.createCanvas(TS, TS), g = cv.getContext('2d');
      g.clearRect(0, 0, TS, TS);
      art.rows.forEach((row, y) => { for (let x = 0; x < S; x++) { const c = art.pal[row[x]]; if (c) { g.fillStyle = c; g.fillRect(PAD + x, PAD + y, 1, 1); } } });
      return U.gl.texture(gl, cv, { filter: 'nearest' });
    });
    // 수풀 배경 (외곽선이 없으면 녹색 몬스터가 묻히도록 녹색 계열)
    const BG = 256, bgc = ctx.createCanvas(BG, BG), bg = bgc.getContext('2d');
    const nz = U.noise(ctx.seed + 3);
    const img = bg.createImageData(BG, BG);
    for (let y = 0; y < BG; y++) for (let x = 0; x < BG; x++) {
      const v = nz.fbm2(x / 22, y / 22, { octaves: 4 }) * 0.5 + 0.5, d = nz.value2(x / 3, y / 3);
      const o = (y * BG + x) * 4;
      img.data[o] = 30 + v * 50 + d * 20; img.data[o + 1] = 70 + v * 110 + d * 40; img.data[o + 2] = 30 + v * 40; img.data[o + 3] = 255;
    }
    bg.putImageData(img, 0, 0);
    const bgTex = U.gl.texture(gl, bgc, { filter: 'nearest', wrap: 'repeat' });

    const VS = `attribute vec2 a_pos; varying vec2 v_uv;
uniform vec2 u_center; uniform vec2 u_half; uniform vec2 u_res;
void main(){
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  vec2 p = u_center + a_pos * u_half * vec2(1.0, -1.0);
  gl_Position = vec4(p / u_res * 2.0 - 1.0, 0.0, 1.0) * vec4(1.0, -1.0, 1.0, 1.0);
}`;
    const BG_FS = `precision mediump float; varying vec2 v_uv;
uniform sampler2D u_tex; uniform vec2 u_rep;
void main(){ gl_FragColor = vec4(texture2D(u_tex, v_uv * u_rep).rgb, 1.0); }`;
    const FS = `precision mediump float; varying vec2 v_uv;
uniform sampler2D u_tex; uniform vec2 u_texel;
uniform float u_flash; uniform float u_mode; uniform vec3 u_fcol;
uniform float u_outline; uniform float u_ow; uniform vec3 u_ocol;
void main(){
  vec4 c = texture2D(u_tex, v_uv);
  if (u_mode > 0.5 && u_mode < 1.5) c.rgb *= mix(vec3(1.0), u_fcol, u_flash);
  else if (u_mode > 1.5 && u_mode < 2.5) c.rgb = mix(c.rgb, u_fcol, u_flash);
  if (u_outline > 0.5 && c.a < 0.5) {
    float a = 0.0;
    for (int y = -3; y <= 3; y++) {
      for (int x = -3; x <= 3; x++) {
        vec2 o = vec2(float(x), float(y));
        float d = u_outline < 1.5 ? abs(o.x) + abs(o.y) : max(abs(o.x), abs(o.y));
        if (d > 0.0 && d <= u_ow) a = max(a, texture2D(u_tex, v_uv + o * u_texel).a);
      }
    }
    if (a > 0.5) {
      float f = (u_mode > 1.5 && u_mode < 2.5) ? u_flash : 0.0;
      c = vec4(mix(u_ocol, u_fcol, f), 1.0);
    }
  }
  if (c.a < 0.01) discard;
  gl_FragColor = c;
}`;
    const prog = U.gl.program(gl, VS, FS), bgProg = U.gl.program(gl, VS, BG_FS);
    const quad = U.gl.quad(gl);

    // 몬스터 배치 (두 뷰가 같은 시드)
    const rng = ctx.rng;
    const mobs = [];
    for (let i = 0; i < 9; i++) mobs.push({ kind: i % 3, ph: rng.range(0, U.TAU), hitT: -1, kx: 0 });
    const order = []; for (let i = 0; i < 64; i++) order.push(rng.int(0, mobs.length - 1));
    let t = 0, nextHit = 0.3, hitIdx = 0, hits = 0;
    const layout = () => {
      const W = ctx.width, H = ctx.height, half = (TS * P.scale) / 2;
      return mobs.map((m, i) => {
        const cx = W * (0.2 + 0.3 * (i % 3)), cy = H * (0.22 + 0.28 * Math.floor(i / 3));
        return { x: cx + m.kx, y: cy + Math.sin(t * 2 + m.ph) * 4, half };
      });
    };
    const hit = (m) => { m.hitT = 0; m.kx = 8; hits++; };

    return {
      update(dt) {
        t += dt;
        if (t >= nextHit) { hit(mobs[order[hitIdx++ % order.length]]); nextHit = t + P.autoHit; }
        const ms = ctx.input.mouse;
        if (ms.pressed && ms.inside) {
          layout().forEach((r, i) => { if (Math.abs(ms.x - r.x) < r.half * 0.7 && Math.abs(ms.y - r.y) < r.half * 0.7) hit(mobs[i]); });
        }
        for (const m of mobs) { if (m.hitT >= 0) m.hitT += dt; m.kx = U.damp(m.kx, 0, 18, dt); }
      },
      render() {
        const pw = ctx.pixelWidth, ph = ctx.pixelHeight, pr = ctx.pixelRatio;
        gl.viewport(0, 0, pw, ph);
        gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.BLEND);
        bgProg.use();
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, bgTex);
        gl.uniform1i(bgProg.u('u_tex'), 0);
        gl.uniform2f(bgProg.u('u_res'), pw, ph);
        gl.uniform2f(bgProg.u('u_center'), pw / 2, ph / 2);
        gl.uniform2f(bgProg.u('u_half'), pw / 2, ph / 2);
        gl.uniform2f(bgProg.u('u_rep'), ctx.width / (BG * P.scale * 0.5), ctx.height / (BG * P.scale * 0.5));
        quad.draw(bgProg);

        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        prog.use();
        gl.uniform1i(prog.u('u_tex'), 0);
        gl.uniform2f(prog.u('u_res'), pw, ph);
        gl.uniform2f(prog.u('u_texel'), 1 / TS, 1 / TS);
        const fc = U.hexToRgb01(P.flashColor), oc = U.hexToRgb01(P.outlineColor);
        gl.uniform3f(prog.u('u_fcol'), fc[0], fc[1], fc[2]);
        gl.uniform3f(prog.u('u_ocol'), oc[0], oc[1], oc[2]);
        gl.uniform1f(prog.u('u_mode'), P.flashMode);
        gl.uniform1f(prog.u('u_outline'), P.outline);
        gl.uniform1f(prog.u('u_ow'), P.outlineW);
        let flashing = 0, drawn = 0;
        layout().forEach((r, i) => {
          const m = mobs[i];
          const on = m.hitT >= 0 && m.hitT < P.flashDur;
          // 처음 60%는 꽉 찬 플래시, 나머지는 빠르게 사라짐
          const f = on ? U.clamp((1 - m.hitT / P.flashDur) / 0.4, 0, 1) : 0;
          if (on) flashing++;
          if (on && P.flashMode === 3 && Math.floor(m.hitT / 0.04) % 2 === 0) return;
          gl.bindTexture(gl.TEXTURE_2D, tex[m.kind]);
          gl.uniform1f(prog.u('u_flash'), P.flashMode === 3 ? 0 : f);
          gl.uniform2f(prog.u('u_center'), Math.round(r.x * pr), Math.round(r.y * pr));
          gl.uniform2f(prog.u('u_half'), r.half * pr, r.half * pr);
          quad.draw(prog);
          drawn++;
        });
        gl.disable(gl.BLEND);
        const w = P.outlineW;
        const taps = P.outline === 0 ? 0 : P.outline === 1 ? 2 * w * (w + 1) : (2 * w + 1) * (2 * w + 1) - 1;
        ctx.stat(GTL.L('플래시 중인 스프라이트', 'Flashing sprites'), flashing);
        ctx.stat(GTL.L('그린 스프라이트', 'Sprites drawn'), `${drawn} / ${mobs.length}`);
        ctx.stat(GTL.L('외곽선 텍스처 읽기/투명 픽셀', 'Outline texture reads/transparent pixel'), taps);
        ctx.stat(GTL.L('누적 피격', 'Total hits'), hits);
      },
    };
  },
});
