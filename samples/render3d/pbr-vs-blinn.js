// PBR (Cook-Torrance GGX) vs Blinn-Phong: 거칠기 × 금속성 구 격자
GTL.register({
  id: 'pbr-vs-blinn',
  title: 'PBR (Cook-Torrance GGX) vs Blinn-Phong',
  summary: '같은 거칠기와 금속성 값을 두 BRDF에 넣어 비교. Blinn-Phong은 거친 면이 너무 밝고 매끈한 면은 흐림. GGX는 전 범위에서 일관됨.',
  renderer: 'webgl',
  views: { a: 'Blinn-Phong (비정규화)', b: 'Cook-Torrance GGX' },
  controls: '마우스 드래그: 카메라 회전, 휠: 줌',
  info: `
    <p><b>BRDF</b>는 빛이 표면에서 어느 방향으로 얼마나 반사되는지 정하는 함수. 구 격자의 가로축은 <b>거칠기(roughness)</b> 0→1, 세로축은 <b>금속성(metallic)</b> 0(아래)→1(위). 두 뷰 모두 같은 F0(유전체 0.04, 금속은 albedo)와 같은 광원을 씀.</p>
    <p><b>Cook-Torrance</b> 미세면 BRDF: <code>D * G * F / (4 * dot(N,L) * dot(N,V))</code></p>
    <ul>
      <li><b>D</b>(GGX/Trowbridge-Reitz): 미세면 법선 분포. 꼬리가 길어 하이라이트 주변이 은은하게 번짐.</li>
      <li><b>G</b>(Smith-Schlick): 미세면끼리 서로 가리는 정도</li>
      <li><b>F</b>(Schlick 근사): 프레넬. 스치는 각도에서 반사가 강해짐.</li>
    </ul>
    <p>D는 정규화되어 있음. 그래서 거칠수록 하이라이트가 넓어지는 만큼 <b>어두워짐</b>(에너지 보존).</p>
    <p>전통적 Blinn-Phong은 <code>pow(dot(N,H), s)</code>에 고정 계수만 곱함. 그래서 지수가 커지면 하이라이트가 작아지고 <b>총 반사량도 줄어듦</b>. 정규화 계수 <code>(s+8)/(8π)</code>를 곱하면 에너지 보존에 가까워짐. 단, 프레넬과 가림 항은 여전히 없음.</p>
    <p>구현 메모:</p>
    <ul>
      <li>거칠기→지수 변환: <code>s = 2/α² − 2</code> (α = roughness²)</li>
      <li>환경광: 절차적 하늘을 거칠기에 따라 흐리게 한 근사</li>
      <li>GGX 쪽 스펙큘러 환경광: Karis의 모바일용 EnvBRDF 근사(split-sum의 해석적 피팅)로 가중</li>
    </ul>`,
  // 도식: 거칠기별 하이라이트 로브. 비정규화 Blinn-Phong과 정규화된 GGX의 에너지 차이
  diagram: (L) => `<svg viewBox="0 0 540 188" xmlns="http://www.w3.org/2000/svg">
    <line x1="20" y1="130" x2="250" y2="130" class="d-dim"/>
    <line x1="290" y1="130" x2="520" y2="130" class="d-dim"/>
    <polyline points="35.0,130.0 38.3,130.0 41.7,130.0 45.0,130.0 48.3,130.0 51.7,130.0 55.0,130.0 58.3,130.0 61.7,130.0 65.0,130.0 68.3,130.0 71.7,130.0 75.0,130.0 78.3,130.0 81.7,130.0 85.0,130.0 88.3,129.9 91.7,129.8 95.0,129.6 98.3,129.0 101.7,127.7 105.0,125.3 108.3,121.1 111.7,114.4 115.0,104.8 118.3,92.1 121.7,77.2 125.0,61.7 128.3,47.9 131.7,38.4 135.0,35.0 138.3,38.4 141.7,47.9 145.0,61.7 148.3,77.2 151.7,92.1 155.0,104.8 158.3,114.4 161.7,121.1 165.0,125.3 168.3,127.7 171.7,129.0 175.0,129.6 178.3,129.8 181.7,129.9 185.0,130.0 188.3,130.0 191.7,130.0 195.0,130.0 198.3,130.0 201.7,130.0 205.0,130.0 208.3,130.0 211.7,130.0 215.0,130.0 218.3,130.0 221.7,130.0 225.0,130.0 228.3,130.0 231.7,130.0 235.0,130.0" class="d-a"/>
    <polyline points="35.0,130.0 38.3,130.0 41.7,130.0 45.0,130.0 48.3,130.0 51.7,130.0 55.0,130.0 58.3,129.9 61.7,129.9 65.0,129.7 68.3,129.5 71.7,129.2 75.0,128.6 78.3,127.8 81.7,126.5 85.0,124.7 88.3,122.1 91.7,118.8 95.0,114.4 98.3,109.1 101.7,102.6 105.0,95.2 108.3,86.9 111.7,78.0 115.0,68.9 118.3,60.1 121.7,51.9 125.0,44.9 128.3,39.5 131.7,36.2 135.0,35.0 138.3,36.2 141.7,39.5 145.0,44.9 148.3,51.9 151.7,60.1 155.0,68.9 158.3,78.0 161.7,86.9 165.0,95.2 168.3,102.6 171.7,109.1 175.0,114.4 178.3,118.8 181.7,122.1 185.0,124.7 188.3,126.5 191.7,127.8 195.0,128.6 198.3,129.2 201.7,129.5 205.0,129.7 208.3,129.9 211.7,129.9 215.0,130.0 218.3,130.0 221.7,130.0 225.0,130.0 228.3,130.0 231.7,130.0 235.0,130.0" class="d-a" stroke-dasharray="6 3"/>
    <polyline points="35.0,128.5 38.3,127.9 41.7,127.1 45.0,126.1 48.3,124.8 51.7,123.3 55.0,121.5 58.3,119.3 61.7,116.8 65.0,114.0 68.3,110.8 71.7,107.3 75.0,103.4 78.3,99.2 81.7,94.7 85.0,89.9 88.3,85.0 91.7,79.9 95.0,74.8 98.3,69.6 101.7,64.6 105.0,59.7 108.3,55.0 111.7,50.7 115.0,46.8 118.3,43.3 121.7,40.4 125.0,38.1 128.3,36.4 131.7,35.3 135.0,35.0 138.3,35.3 141.7,36.4 145.0,38.1 148.3,40.4 151.7,43.3 155.0,46.8 158.3,50.7 161.7,55.0 165.0,59.7 168.3,64.6 171.7,69.6 175.0,74.8 178.3,79.9 181.7,85.0 185.0,89.9 188.3,94.7 191.7,99.2 195.0,103.4 198.3,107.3 201.7,110.8 205.0,114.0 208.3,116.8 211.7,119.3 215.0,121.5 218.3,123.3 221.7,124.8 225.0,126.1 228.3,127.1 231.7,127.9 235.0,128.5" class="d-a" stroke-dasharray="2 3"/>
    <polyline points="305.0,130.0 308.3,130.0 311.7,130.0 315.0,130.0 318.3,130.0 321.7,130.0 325.0,130.0 328.3,130.0 331.7,130.0 335.0,130.0 338.3,130.0 341.7,130.0 345.0,130.0 348.3,130.0 351.7,130.0 355.0,130.0 358.3,129.9 361.7,129.8 365.0,129.6 368.3,128.9 371.7,127.6 375.0,125.1 378.3,120.7 381.7,113.6 385.0,103.4 388.3,90.1 391.7,74.4 395.0,58.1 398.3,43.6 401.7,33.6 405.0,30.0 408.3,33.6 411.7,43.6 415.0,58.1 418.3,74.4 421.7,90.1 425.0,103.4 428.3,113.6 431.7,120.7 435.0,125.1 438.3,127.6 441.7,128.9 445.0,129.6 448.3,129.8 451.7,129.9 455.0,130.0 458.3,130.0 461.7,130.0 465.0,130.0 468.3,130.0 471.7,130.0 475.0,130.0 478.3,130.0 481.7,130.0 485.0,130.0 488.3,130.0 491.7,130.0 495.0,130.0 498.3,130.0 501.7,130.0 505.0,130.0" class="d-b"/>
    <polyline points="305.0,130.0 308.3,130.0 311.7,130.0 315.0,130.0 318.3,130.0 321.7,130.0 325.0,130.0 328.3,130.0 331.7,129.9 335.0,129.9 338.3,129.8 341.7,129.6 345.0,129.4 348.3,129.0 351.7,128.5 355.0,127.7 358.3,126.6 361.7,125.1 365.0,123.3 368.3,120.9 371.7,118.1 375.0,114.9 378.3,111.3 381.7,107.5 385.0,103.5 388.3,99.7 391.7,96.1 395.0,93.1 398.3,90.8 401.7,89.3 405.0,88.8 408.3,89.3 411.7,90.8 415.0,93.1 418.3,96.1 421.7,99.7 425.0,103.5 428.3,107.5 431.7,111.3 435.0,114.9 438.3,118.1 441.7,120.9 445.0,123.3 448.3,125.1 451.7,126.6 455.0,127.7 458.3,128.5 461.7,129.0 465.0,129.4 468.3,129.6 471.7,129.8 475.0,129.9 478.3,129.9 481.7,130.0 485.0,130.0 488.3,130.0 491.7,130.0 495.0,130.0 498.3,130.0 501.7,130.0 505.0,130.0" class="d-b" stroke-dasharray="6 3"/>
    <polyline points="305.0,129.7 308.3,129.5 311.7,129.4 315.0,129.2 318.3,128.9 321.7,128.5 325.0,128.2 328.3,127.7 331.7,127.1 335.0,126.5 338.3,125.8 341.7,125.1 345.0,124.2 348.3,123.3 351.7,122.3 355.0,121.3 358.3,120.2 361.7,119.1 365.0,118.0 368.3,116.9 371.7,115.8 375.0,114.8 378.3,113.8 381.7,112.8 385.0,112.0 388.3,111.2 391.7,110.6 395.0,110.1 398.3,109.7 401.7,109.5 405.0,109.4 408.3,109.5 411.7,109.7 415.0,110.1 418.3,110.6 421.7,111.2 425.0,112.0 428.3,112.8 431.7,113.8 435.0,114.8 438.3,115.8 441.7,116.9 445.0,118.0 448.3,119.1 451.7,120.2 455.0,121.3 458.3,122.3 461.7,123.3 465.0,124.2 468.3,125.1 471.7,125.8 475.0,126.5 478.3,127.1 481.7,127.7 485.0,128.2 488.3,128.5 491.7,128.9 495.0,129.2 498.3,129.4 501.7,129.5 505.0,129.7" class="d-b" stroke-dasharray="2 3"/>
    <text x="20" y="14" class="t-a">${L('Blinn-Phong: 높이 고정', 'Blinn-Phong: fixed height')}</text>
    <text x="290" y="14" class="t-b">${L('GGX: 정규화, 면적 보존', 'GGX: normalized, same area')}</text>
    <text x="20" y="164" class="t-small t-dim">${L('실선 매끈, 점선 거침', 'solid smooth, dotted rough')}</text>
    <text x="20" y="180" class="t-small">${L('날카로울수록 총 반사량이 줄어듦', 'Sharper lobes reflect less in total')}</text>
    <text x="290" y="164" class="t-small t-dim">${L('실선 매끈, 점선 거침', 'solid smooth, dotted rough')}</text>
    <text x="290" y="180" class="t-small">${L('넓게 퍼질수록 낮아짐 (에너지 보존)', 'Wider lobes get lower (energy kept)')}</text>
    <text x="135" y="144" text-anchor="middle" class="t-small t-dim">${L('반사 방향과의 각도', 'angle from mirror direction')}</text>
    <text x="405" y="144" text-anchor="middle" class="t-small t-dim">${L('반사 방향과의 각도', 'angle from mirror direction')}</text>
  </svg>`,
  look: [
    'A의 오른쪽 위(거친 금속) 구를 보면 하이라이트가 구 전체로 퍼진 채 너무 밝음. 왼쪽(매끈한) 구의 하이라이트는 작고 흐림.',
    'B의 같은 줄을 보면 매끈할수록 작고 강렬함. 거칠수록 퍼지면서 어두워짐.',
    '카메라를 낮춰 구의 가장자리를 보면 B만 프레넬로 테두리가 밝아짐',
    'A에서 "Blinn 정규화"를 켜면 왼쪽(매끈한) 구의 하이라이트가 훨씬 밝아져 B에 가까워짐',
    '"환경광"을 끄면 금속 구(위쪽 줄)가 거의 검게 됨. 금속은 디퓨즈가 없어 반사로만 보이기 때문.',
  ],
  refs: [
    { type: 'paper', title: 'A Reflectance Model for Computer Graphics (Cook & Torrance)', url: 'https://dl.acm.org/doi/10.1145/357290.357293', year: 1982, note: 'ACM Transactions on Graphics. 미세면 BRDF.' },
    { type: 'paper', title: 'Microfacet Models for Refraction through Rough Surfaces (Walter, Marschner, Li, Torrance)', year: 2007, note: 'EGSR 2007. GGX 분포 도입.' },
    { type: 'talk', title: 'Real Shading in Unreal Engine 4 (Brian Karis)', url: 'https://blog.selfshadow.com/publications/s2013-shading-course/', year: 2013, note: 'SIGGRAPH 2013 Physically Based Shading course. roughness², Schlick-GGX k, split-sum.' },
    { type: 'talk', title: 'Physically-Based Shading at Disney (Brent Burley)', url: 'https://blog.selfshadow.com/publications/s2012-shading-course/', year: 2012, note: 'SIGGRAPH 2012 course. baseColor/metallic/roughness 파라미터화.' },
    { type: 'article', title: 'Physically Based Shading on Mobile (Brian Karis, Epic Games)', url: 'https://www.unrealengine.com/en-US/blog/physically-based-shading-on-mobile', year: 2014, note: 'EnvBRDFApprox 근사식' },
    { type: 'paper', title: 'An Inexpensive BRDF Model for Physically-based Rendering (Christophe Schlick)', year: 1994, note: 'Computer Graphics Forum. 프레넬 근사.' },
    { type: 'article', title: 'LearnOpenGL: PBR Theory', url: 'https://learnopengl.com/PBR/Theory' },
  ],
  params: [
    { key: 'brdf', label: 'BRDF', type: 'select', group: '셰이딩', options: [
      { value: 'blinn', label: 'Blinn-Phong' },
      { value: 'ggx', label: 'Cook-Torrance GGX' },
    ], a: 'blinn', b: 'ggx' },
    { key: 'normBlinn', label: 'Blinn 정규화 (s+8)/8π', type: 'bool', default: false, when: (p) => p.brdf === 'blinn' },
    { key: 'env', label: '환경광 (하늘 반사)', type: 'bool', default: true },
    { key: 'lightInt', label: '광원 세기', type: 'range', min: 0, max: 10, step: 0.1, default: 4 },
    { key: 'exposure', label: '노출', type: 'range', min: 0.2, max: 4, step: 0.05, default: 1 },
    { key: 'albedo', label: '기본색 (albedo)', type: 'color', default: '#d0603c', shared: true, group: '장면' },
    { key: 'showSky', label: '배경 하늘 표시', type: 'bool', default: true, shared: true },
    { key: 'autoRotate', label: '자동 회전', type: 'bool', default: false, shared: true },
  ],
  en: {
    title: 'PBR (Cook-Torrance GGX) vs Blinn-Phong',
    summary: 'Feed the same roughness and metallic values into two BRDFs. Blinn-Phong makes rough surfaces too bright and smooth ones dim. GGX stays consistent across the whole range.',
    views: { a: 'Blinn-Phong (unnormalized)', b: 'Cook-Torrance GGX' },
    controls: 'Mouse drag: rotate camera. Wheel: zoom.',
    info: `
    <p>A <b>BRDF</b> is a function that says how much light a surface reflects in each direction. In the sphere grid, the horizontal axis is <b>roughness</b> 0 to 1, and the vertical axis is <b>metallic</b> 0 (bottom) to 1 (top). Both views use the same F0 (0.04 for dielectrics, albedo for metals) and the same lights.</p>
    <p>The <b>Cook-Torrance</b> microfacet BRDF: <code>D * G * F / (4 * dot(N,L) * dot(N,V))</code>.</p>
    <ul>
      <li><b>D</b> (GGX/Trowbridge-Reitz): the distribution of microfacet normals. Its long tail gives a soft glow around the highlight.</li>
      <li><b>G</b> (Smith-Schlick): how much microfacets hide each other.</li>
      <li><b>F</b> (Schlick approximation): Fresnel. Reflection gets stronger at grazing angles.</li>
    </ul>
    <p>D is normalized. So as roughness widens the highlight, the highlight gets <b>darker</b> by the same amount (energy conservation).</p>
    <p>Classic Blinn-Phong only multiplies <code>pow(dot(N,H), s)</code> by a fixed factor. So a larger exponent makes the highlight smaller and <b>also lowers total reflection</b>. Multiplying by the normalization factor <code>(s+8)/(8π)</code> brings it close to energy conservation. But it still has no Fresnel or shadowing term.</p>
    <p>Implementation notes:</p>
    <ul>
      <li>Roughness to exponent: <code>s = 2/α² − 2</code> (α = roughness²).</li>
      <li>Ambient light: an approximation that blurs a procedural sky by roughness.</li>
      <li>GGX specular ambient: weighted by Karis's mobile EnvBRDF approximation (an analytic fit of split-sum).</li>
    </ul>`,
    look: [
      'In A, look at the top right spheres (rough metal). The highlight spreads over the whole sphere and is too bright. The highlight on the left (smooth) spheres is small and dim.',
      'Look at the same row in B. Smoother spheres have small, intense highlights. Rougher ones spread out and get darker.',
      'Lower the camera and look at the sphere edges. Only B gets bright rims from Fresnel.',
      'In A, turn on "Blinn normalization". The highlights on the left (smooth) spheres get much brighter and look closer to B.',
      'Turn off "Ambient light". The metal spheres (top rows) turn almost black. Metals have no diffuse, so you only see their reflections.',
    ],
    refs: ['ACM Transactions on Graphics. Microfacet BRDF.', 'EGSR 2007. Introduced the GGX distribution.', 'SIGGRAPH 2013 Physically Based Shading course. roughness², Schlick-GGX k, split-sum.', 'SIGGRAPH 2012 course. The baseColor/metallic/roughness parameterization.', 'The EnvBRDFApprox formula.', 'Computer Graphics Forum. Fresnel approximation.', null],
    params: {
      brdf: { label: 'BRDF', group: 'Shading' },
      normBlinn: 'Blinn normalization (s+8)/8π',
      env: 'Ambient light (sky reflection)',
      lightInt: 'Light intensity',
      exposure: 'Exposure',
      albedo: { label: 'Base color (albedo)', group: 'Scene' },
      showSky: 'Show sky background',
      autoRotate: 'Auto rotate',
    },
  },
  setup(ctx) {
    const U = GTL.util, gl = ctx.gl, M = U.mat4, P = ctx.params;
    const sphere = U.geometry.upload(gl, U.geometry.sphere(0.42, 48, 24));
    const quad = U.gl.quad(gl);
    const N = 5;

    const SKY = `
      uniform vec3 u_sunDir;
      vec3 skyCol(vec3 d, float r) {
        vec3 top = vec3(0.22, 0.42, 0.85), hor = vec3(0.75, 0.82, 0.9), gnd = vec3(0.16, 0.14, 0.12);
        float w = mix(0.02, 0.9, r);
        vec3 sky = mix(hor, top, smoothstep(0.0, 0.6 + w, d.y));
        vec3 c = mix(gnd, sky, smoothstep(-0.5 * w - 0.01, 0.5 * w + 0.01, d.y));
        float sp = mix(1500.0, 3.0, r);
        float s = pow(max(dot(d, u_sunDir), 0.0), sp) * mix(40.0, 0.6, sqrt(r));
        return c + vec3(1.0, 0.9, 0.7) * s;
      }
      vec3 tonemap(vec3 c) {
        c = (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14);
        return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));
      }`;

    const vs = `
      attribute vec3 a_position; attribute vec3 a_normal;
      uniform mat4 u_vp; uniform mat4 u_world;
      varying vec3 v_pos; varying vec3 v_n;
      void main(){
        vec4 wp = u_world * vec4(a_position, 1.0);
        v_pos = wp.xyz; v_n = a_normal;
        gl_Position = u_vp * wp;
      }`;
    const fs = `
      precision highp float;
      const float PI = 3.14159265;
      uniform vec3 u_eye; uniform vec3 u_albedo; uniform float u_rough; uniform float u_metal;
      uniform float u_ggx; uniform float u_norm; uniform float u_env; uniform float u_lightInt; uniform float u_exposure;
      uniform vec3 u_l0; uniform vec3 u_l1;
      varying vec3 v_pos; varying vec3 v_n;
      ${SKY}
      float D_GGX(float NoH, float a) { float a2 = a * a; float d = NoH * NoH * (a2 - 1.0) + 1.0; return a2 / (PI * d * d); }
      float G1(float x, float k) { return x / (x * (1.0 - k) + k); }
      vec3 F_Schlick(vec3 F0, float VoH) { return F0 + (1.0 - F0) * pow(1.0 - VoH, 5.0); }
      vec3 envBRDF(vec3 F0, float r, float NoV) {
        vec4 c0 = vec4(-1.0, -0.0275, -0.572, 0.022);
        vec4 c1 = vec4(1.0, 0.0425, 1.04, -0.04);
        vec4 rr = r * c0 + c1;
        float a004 = min(rr.x * rr.x, exp2(-9.28 * NoV)) * rr.x + rr.y;
        vec2 AB = vec2(-1.04, 1.04) * a004 + rr.zw;
        return F0 * AB.x + AB.y;
      }
      vec3 direct(vec3 N, vec3 V, vec3 L, vec3 radiance, vec3 F0, vec3 diff) {
        vec3 H = normalize(L + V);
        float NoL = max(dot(N, L), 0.0), NoV = max(dot(N, V), 1e-4), NoH = max(dot(N, H), 0.0), VoH = max(dot(V, H), 0.0);
        if (NoL <= 0.0) return vec3(0.0);
        float a = u_rough * u_rough;
        vec3 spec;
        vec3 kd = vec3(1.0);
        if (u_ggx > 0.5) {
          float k = (u_rough + 1.0) * (u_rough + 1.0) / 8.0;
          vec3 F = F_Schlick(F0, VoH);
          spec = D_GGX(NoH, a) * G1(NoL, k) * G1(NoV, k) * F / (4.0 * NoL * NoV + 1e-4);
          kd = 1.0 - F;
        } else {
          float s = clamp(2.0 / max(a * a, 1e-4) - 2.0, 1.0, 4096.0);
          float nrm = u_norm > 0.5 ? (s + 8.0) / (8.0 * PI) : 1.0;
          spec = F0 * pow(NoH, s) * nrm;
        }
        return (kd * diff / PI + spec) * radiance * NoL;
      }
      void main(){
        vec3 N = normalize(v_n);
        vec3 V = normalize(u_eye - v_pos);
        vec3 F0 = mix(vec3(0.04), u_albedo, u_metal);
        vec3 diff = u_albedo * (1.0 - u_metal);
        vec3 c = direct(N, V, normalize(u_l0), vec3(1.0, 0.95, 0.88) * u_lightInt, F0, diff)
               + direct(N, V, normalize(u_l1), vec3(0.5, 0.6, 0.9) * u_lightInt * 0.35, F0, diff);
        if (u_env > 0.5) {
          float NoV = max(dot(N, V), 1e-4);
          vec3 R = reflect(-V, N);
          vec3 irr = skyCol(N, 1.0) * 0.6;
          vec3 pre = skyCol(R, u_rough) * 0.6;
          vec3 ks = u_ggx > 0.5 ? envBRDF(F0, u_rough, NoV) : F0;
          vec3 kd = u_ggx > 0.5 ? (1.0 - ks) : vec3(1.0);
          c += kd * diff * irr + pre * ks;
        } else {
          c += diff * 0.02;
        }
        gl_FragColor = vec4(tonemap(c * u_exposure), 1.0);
      }`;
    const prog = U.gl.program(gl, vs, fs);
    const skyProg = U.gl.program(gl, `
      attribute vec2 a_pos; varying vec2 v_ndc;
      void main(){ v_ndc = a_pos; gl_Position = vec4(a_pos, 0.999, 1.0); }`, `
      precision highp float;
      uniform mat4 u_invVP; uniform vec3 u_eye; uniform float u_exposure;
      varying vec2 v_ndc;
      ${SKY}
      void main(){
        vec4 p = u_invVP * vec4(v_ndc, 1.0, 1.0);
        vec3 d = normalize(p.xyz / p.w - u_eye);
        gl_FragColor = vec4(tonemap(skyCol(d, 0.0) * 0.6 * u_exposure), 1.0);
      }`);

    const cam = { yaw: 0, pitch: 0.12, dist: 8.2, drag: false, lx: 0, ly: 0 };
    const sun = (() => { const v = [0.4, 0.7, 0.6], l = Math.hypot(...v); return v.map((x) => x / l); })();

    return {
      update(dt) {
        if (P.autoRotate && !cam.drag) cam.yaw += dt * 0.2;
        if (ctx.input.mouse.wheel) cam.dist = U.clamp(cam.dist * Math.pow(1.12, ctx.input.mouse.wheel), 3, 20);
      },
      onPointer(type, m) {
        if (type === 'down') { cam.drag = true; cam.lx = m.x; cam.ly = m.y; }
        else if (type === 'up' || type === 'leave') cam.drag = false;
        else if (type === 'move' && cam.drag) {
          cam.yaw -= (m.x - cam.lx) * 0.008; cam.pitch = U.clamp(cam.pitch + (m.y - cam.ly) * 0.008, -1.3, 1.3);
          cam.lx = m.x; cam.ly = m.y;
        }
      },
      render() {
        gl.viewport(0, 0, ctx.pixelWidth, ctx.pixelHeight);
        gl.clearColor(0.05, 0.05, 0.06, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const proj = M.perspective(U.rad(45), ctx.width / ctx.height, 0.1, 100);
        const eye = M.orbitEye([0, 0, 0], cam.yaw, cam.pitch, cam.dist);
        const vp = M.multiply(proj, M.lookAt(eye, [0, 0, 0]));

        if (P.showSky) {
          gl.disable(gl.DEPTH_TEST);
          skyProg.use();
          gl.uniformMatrix4fv(skyProg.u('u_invVP'), false, M.invert(vp));
          gl.uniform3fv(skyProg.u('u_eye'), eye);
          gl.uniform3fv(skyProg.u('u_sunDir'), sun);
          gl.uniform1f(skyProg.u('u_exposure'), P.exposure);
          quad.draw(skyProg);
        }

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        prog.use();
        gl.uniformMatrix4fv(prog.u('u_vp'), false, vp);
        gl.uniform3fv(prog.u('u_eye'), eye);
        gl.uniform3fv(prog.u('u_albedo'), U.hexToRgb01(P.albedo).map((c) => Math.pow(c, 2.2)));
        gl.uniform1f(prog.u('u_ggx'), P.brdf === 'ggx' ? 1 : 0);
        gl.uniform1f(prog.u('u_norm'), P.normBlinn ? 1 : 0);
        gl.uniform1f(prog.u('u_env'), P.env ? 1 : 0);
        gl.uniform1f(prog.u('u_lightInt'), P.lightInt);
        gl.uniform1f(prog.u('u_exposure'), P.exposure);
        gl.uniform3fv(prog.u('u_sunDir'), sun);
        gl.uniform3fv(prog.u('u_l0'), sun);
        gl.uniform3fv(prog.u('u_l1'), [-0.7, 0.2, 0.5]);
        for (let j = 0; j < N; j++) {
          for (let i = 0; i < N; i++) {
            const rough = U.lerp(0.05, 1, i / (N - 1)), metal = j / (N - 1);
            gl.uniformMatrix4fv(prog.u('u_world'), false, M.translation((i - (N - 1) / 2) * 1.05, (j - (N - 1) / 2) * 1.05, 0));
            gl.uniform1f(prog.u('u_rough'), rough);
            gl.uniform1f(prog.u('u_metal'), metal);
            sphere.draw(prog);
          }
        }
        ctx.stat('BRDF', P.brdf === 'ggx' ? 'GGX, Smith, Schlick' : P.normBlinn ? GTL.L('Blinn-Phong (정규화)', 'Blinn-Phong (normalized)') : 'Blinn-Phong');
        ctx.stat(GTL.L('가로', 'Horizontal'), GTL.L('거칠기 0.05 → 1', 'Roughness 0.05 → 1'));
        ctx.stat(GTL.L('세로', 'Vertical'), GTL.L('금속성 0 (아래) → 1 (위)', 'Metallic 0 (bottom) → 1 (top)'));
      },
    };
  },
});
