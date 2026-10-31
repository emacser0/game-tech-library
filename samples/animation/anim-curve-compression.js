// 애니메이션 커브 압축: 균일 샘플링 vs 오차 기반 키프레임 감소
GTL.register({
  id: 'anim-curve-compression',
  title: '애니메이션 커브 압축: 키프레임 감소',
  summary: '촘촘한 관절 커브를 N번째 키만 남겨 줄이면 짧은 충격 스파이크를 놓침. 보간 결과가 허용 오차 안에 드는 키만 지우면 같은 키 수로 스파이크를 지키고 최대 오차도 허용 오차 이하로 유지됨.',
  views: { a: '균일 샘플링', b: '키프레임 감소' },
  controls: '조작 없음. 플레이헤드가 클립을 반복 재생하고, 왼쪽 팔이 원본(흰색)과 복원 커브를 함께 따라감.',
  info: `
    <p><b>애니메이션 커브 압축</b>은 매 프레임 샘플된 본 커브에서 키를 줄여 메모리를 아끼는 처리. 캐릭터 하나에 본이 수십~수백 개이고 본마다 회전, 위치 커브가 있어서 압축 없이는 클립 용량이 금방 커짐.</p>
    <p>두 방식:</p>
    <ul>
      <li><b>균일 샘플링(A)</b>: 샘플 주기를 낮춰 N번째 키만 남김. 키 시간이 규칙적이라 값만 저장하면 됨. 대신 값의 변화와 상관없이 키를 고르므로 짧은 스파이크를 건너뜀.</li>
      <li><b>키프레임 감소(B)</b>: 남긴 키 사이를 보간(선형 또는 Hermite)했을 때 원본 샘플이 모두 허용 오차 안에 들면 사이의 키를 지움. 평평한 구간은 키가 거의 없고, 급한 구간에 키가 몰림.</li>
    </ul>
    <p>엔진의 예:</p>
    <ul>
      <li>Unity 모델 임포터의 Anim. Compression을 Keyframe Reduction으로 두면 Rotation Error(도), Position Error, Scale Error(%) 값이 허용 오차 역할.</li>
      <li>Unreal은 애니메이션 시퀀스마다 압축 코덱을 고름. 코덱이 오차 임계값 안에서 키를 줄이거나 정밀도를 낮춤. UE5의 기본 코덱은 ACL(Animation Compression Library) 기반.</li>
    </ul>
    <p>공정한 비교를 위해 A는 기본으로 B와 같은 키 수를 균일하게 배치. B는 키마다 시간 값을 따로 저장하므로 키 하나가 더 큼. "같은 크기" 예산을 고르면 A가 그만큼 키를 더 씀.</p>
    <p>단점: 오차는 커브 하나 기준이라 본 계층을 따라 쌓임. 손끝처럼 루트에서 먼 본은 작은 회전 오차로도 크게 흔들림. 실무 압축기는 그래서 본 위치 오차(가상 정점 오차)로 판단하기도 함.</p>`,
  // 도식: 이웃 키 보간선과 허용 오차 띠. 띠 안의 키는 제거, 띠 밖의 키는 유지
  diagram: (L) => `<svg viewBox="0 0 540 200" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" class="m-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <polygon points="20,130 150,80 150,100 20,150" class="f-dim"/>
    <polygon points="150,80 270,85 270,105 150,100" class="f-dim"/>
    <path d="M20,140 Q85,108 150,90 C180,85 195,30 205,30 C215,30 225,90 270,95" class="d-dim"/>
    <line x1="20" y1="140" x2="150" y2="90" class="d-b" stroke-dasharray="5 3"/>
    <line x1="150" y1="90" x2="270" y2="95" class="d-b" stroke-dasharray="5 3"/>
    <line x1="205" y1="92" x2="205" y2="38" class="d-accent" marker-end="url(#arr)"/>
    <circle cx="20" cy="140" r="5" class="f-b"/><circle cx="150" cy="90" r="5" class="f-b"/><circle cx="270" cy="95" r="5" class="f-b"/>
    <circle cx="85" cy="112" r="5" class="d-dim"/>
    <line x1="80" y1="107" x2="90" y2="117" class="d-bad"/><line x1="90" y1="107" x2="80" y2="117" class="d-bad"/>
    <text x="104" y="82" text-anchor="end" class="t-small">${L('제거 (띠 안)', 'removed (in band)')}</text>
    <circle cx="205" cy="30" r="5" class="f-b"/>
    <text x="197" y="24" text-anchor="end" class="t-small t-b">${L('유지 (띠 밖)', 'kept (outside band)')}</text>
    <text x="230" y="52" class="t-small">${L('차이', 'gap')}</text>
    <text x="160" y="124" class="t-small t-dim">${L('허용 오차 띠', 'tolerance band')}</text>
    <text x="310" y="40">${L('B의 키 감소', 'Key reduction in B')}</text>
    <text x="310" y="62" class="t-small">${L('1. 양옆 키로 가운데 값을 보간', '1. Interpolate from the two neighbors')}</text>
    <text x="310" y="80" class="t-small">${L('2. 원본 값과의 차이 측정', '2. Measure the gap to the source')}</text>
    <text x="310" y="98" class="t-small">${L('3. 허용 오차 안이면 키 제거', '3. Inside tolerance: remove the key')}</text>
    <text x="310" y="116" class="t-small">${L('4. 밖이면 키 유지', '4. Outside tolerance: keep the key')}</text>
    <text x="310" y="140" class="t-small t-dim">${L('평평한 구간은 키가 적고', 'Flat parts need few keys,')}</text>
    <text x="310" y="154" class="t-small t-dim">${L('급한 구간에 키가 몰림', 'fast parts get many keys')}</text>
    <line x1="10" y1="172" x2="30" y2="172" class="d-b" stroke-dasharray="5 3"/>
    <text x="34" y="175" class="t-small">${L('보간선', 'interpolated line')}</text>
    <rect x="140" y="167" width="20" height="10" class="f-dim"/>
    <text x="164" y="175" class="t-small">${L('허용 오차 띠', 'tolerance band')}</text>
    <line x1="270" y1="172" x2="290" y2="172" class="d-dim"/>
    <text x="294" y="175" class="t-small">${L('원본 커브', 'source curve')}</text>
    <circle cx="410" cy="172" r="4" class="f-b"/>
    <text x="418" y="175" class="t-small">${L('남긴 키', 'kept key')}</text>
    <text x="10" y="194" class="t-small t-a">${L('A(균일 샘플링)는 값과 상관없이 N번째 키만 남겨 스파이크를 놓침', 'A (uniform) keeps every Nth key whatever the value, so it can miss a spike')}</text>
  </svg>`,
  look: [
    '첫 화면에서 A의 오차 그래프가 2초 근처 충격 스파이크에서 크게 튐. B는 같은 키 수로 스파이크에 키를 몰아 최대 오차가 허용 오차 이하.',
    '"허용 오차"를 3도 이상으로 올리면 B의 키 수와 크기가 크게 줄어듦. A도 같은 키 수를 쓰므로 스파이크 오차가 더 커짐.',
    'A의 "예산 방식"을 "같은 크기 (B 기준)"로 바꾸면 A가 키를 두 배 씀. 그래도 A의 최대 오차는 B보다 큼.',
    '"보간"을 "Hermite"로 바꾸면 부드러운 스윙 구간의 키가 줄어 B의 키 수가 줄어듦. 키마다 접선을 저장하므로 키 하나의 크기는 커짐.',
  ],
  refs: [
    { type: 'engine', title: 'Unity Manual - Animation tab (Model Import Settings): Anim. Compression', url: 'https://docs.unity3d.com/Manual/class-AnimationClip.html', note: 'Off, Keyframe Reduction, Optimal 중 선택. Rotation Error, Position Error, Scale Error가 허용 오차.' },
    { type: 'engine', title: 'Unreal Engine - Animation Compression', note: '애니메이션 시퀀스마다 압축 코덱과 오차 임계값을 지정' },
    { type: 'code', title: 'Animation Compression Library (ACL)', url: 'https://github.com/nfrechette/acl', note: 'Nicholas Frechette. 가상 정점 오차 기준으로 정밀도를 고르는 압축 라이브러리. UE5의 기본 애니메이션 코덱 기반.' },
    { type: 'article', title: 'Nicholas Frechette - Animation Compression: Table of Contents (blog series)', note: '균일 샘플링, 선형 키 감소, 커브 피팅, 오차 측정 방식을 차례로 비교' },
    { type: 'book', title: 'Game Engine Architecture - Animation Systems (Compression Techniques)', note: 'Jason Gregory. 채널 생략, 양자화, 샘플 주기와 키 감소를 정리.' },
  ],
  params: [
    { key: 'method', label: '압축 방식', type: 'select', group: '압축', options: [
      { value: 'uniform', label: '균일 샘플링' },
      { value: 'reduce', label: '키프레임 감소' },
    ], a: 'uniform', b: 'reduce', default: 'uniform' },
    { key: 'budget', label: '예산 방식', type: 'select', options: [
      { value: 'keys', label: '같은 키 수 (B 기준)' },
      { value: 'bytes', label: '같은 크기 (B 기준)' },
      { value: 'fixed', label: 'N번째 키마다' },
    ], default: 'keys', when: (p) => p.method === 'uniform', help: '균일 샘플링이 쓸 키 수를 정하는 기준. B 기준은 같은 허용 오차로 감소했을 때의 결과' },
    { key: 'everyN', label: 'N (키 간격)', type: 'int', min: 2, max: 30, default: 8, when: (p) => p.method === 'uniform' && p.budget === 'fixed' },
    { key: 'tol', label: '허용 오차 (도)', type: 'range', min: 0.1, max: 6, step: 0.1, default: 1, shared: true, help: '키프레임 감소가 허용하는 최대 각도 오차. A의 예산 계산에도 씀' },
    { key: 'interp', label: '보간', type: 'select', shared: true, options: [
      { value: 'linear', label: '선형' },
      { value: 'hermite', label: 'Hermite' },
    ], default: 'linear', help: '남은 키 사이를 복원하는 방식. Hermite는 키마다 원본 접선을 저장' },
    { key: 'rate', label: '원본 샘플 주기 (Hz)', type: 'select', group: '클립', shared: true, reset: true, options: [
      { value: 30, label: '30' },
      { value: 60, label: '60' },
    ], default: 60 },
    { key: 'speed', label: '재생 속도', type: 'range', min: 0, max: 1.5, step: 0.05, default: 0.5, shared: true },
  ],
  en: {
    title: 'Animation Curve Compression: Keyframe Reduction',
    summary: 'Keeping only every Nth key of a dense joint curve misses short impact spikes. Removing only the keys whose interpolation stays within tolerance keeps the spike with the same key count, and the max error stays below the tolerance.',
    views: { a: 'Uniform sampling', b: 'Keyframe reduction' },
    controls: 'No input. The playhead loops the clip, and the arm on the left follows the source curve (white) and the reconstructed curve together.',
    info: `
    <p><b>Animation curve compression</b> removes keys from bone curves sampled every frame to save memory. A character has tens to hundreds of bones, each with rotation and position curves, so clips grow fast without compression.</p>
    <p>Two methods:</p>
    <ul>
      <li><b>Uniform sampling (A)</b>: lower the sample rate and keep every Nth key. Key times are regular, so only values are stored. But keys are picked without looking at the values, so short spikes get skipped.</li>
      <li><b>Keyframe reduction (B)</b>: if interpolating (linear or Hermite) between kept keys keeps every source sample within tolerance, the keys in between are removed. Flat parts end up with almost no keys, and fast parts get many.</li>
    </ul>
    <p>In engines:</p>
    <ul>
      <li>In the Unity model importer, set Anim. Compression to Keyframe Reduction. Rotation Error (degrees), Position Error and Scale Error (%) act as the tolerance.</li>
      <li>Unreal picks a compression codec per animation sequence. The codec removes keys or lowers precision within an error threshold. The default codec in UE5 is based on ACL (Animation Compression Library).</li>
    </ul>
    <p>For a fair comparison, A spreads the same key count as B uniformly by default. B stores a time value per key, so each of its keys is larger. Pick the "Same size" budget and A gets that many more keys.</p>
    <p>Downsides: the error is per curve, so it adds up along the bone hierarchy. Bones far from the root, like fingertips, shake a lot from small rotation errors. That is why real compressors often measure bone position error (virtual vertex error) instead.</p>`,
    look: [
      'On first load, the error plot of A jumps at the impact spike near 2 seconds. B uses the same key count but puts keys on the spike, so its max error stays below the tolerance.',
      'Raise "Tolerance" to 3 degrees or more. B needs far fewer keys and bytes. A uses the same key count, so its spike error grows even more.',
      'Set the "Budget mode" of A to "Same size (as B)". A now gets twice the keys. Its max error is still larger than B.',
      'Set "Interpolation" to "Hermite". Smooth swings need fewer keys, so B keeps fewer keys. Each key stores a tangent, so each key is larger.',
    ],
    refs: [
      'Choose Off, Keyframe Reduction or Optimal. Rotation Error, Position Error and Scale Error set the tolerance.',
      'Set the compression codec and error threshold per animation sequence.',
      'Nicholas Frechette. A compression library that picks precision by virtual vertex error. The default UE5 animation codec is based on it.',
      'Compares uniform sampling, linear key reduction, curve fitting and error metrics, one post at a time.',
      'Jason Gregory. Covers channel omission, quantization, sample rate and key reduction.',
    ],
    params: {
      method: { label: 'Compression method', group: 'Compression', options: { uniform: 'Uniform sampling', reduce: 'Keyframe reduction' } },
      budget: { label: 'Budget mode', help: 'How uniform sampling picks its key count. "As B" means the result of reduction with the same tolerance', options: { keys: 'Same key count (as B)', bytes: 'Same size (as B)', fixed: 'Every Nth key' } },
      everyN: 'N (key interval)',
      tol: { label: 'Tolerance (deg)', help: 'Max angle error that keyframe reduction allows. Also used for the budget of A' },
      interp: { label: 'Interpolation', help: 'How the curve between kept keys is rebuilt. Hermite stores the source tangent per key', options: { linear: 'Linear' } },
      rate: { label: 'Source sample rate (Hz)', group: 'Clip' },
      speed: 'Playback speed',
    },
  },

  setup(ctx) {
    const U = GTL.util, D = U.draw, C = U.colors, P = ctx.params;
    const LEN = 4; // 클립 길이 (초)
    const TS = 1.97; // 충격 스파이크 시각
    let n, h, src, tan, play, cache = null;

    // 관절 각도 커브(도): 스윙, 정지, 충격 스파이크와 흔들림, 다시 스윙
    function curve(t) {
      const swing1 = 30 * Math.sin(U.TAU * 0.8 * t) + 5;
      const hold = -10;
      const swing2 = 22 * Math.sin(U.TAU * 0.55 * (t - 2.45)) + 12;
      const s1 = U.smoothstep(1.0, 1.3, t), s2 = U.smoothstep(2.25, 2.7, t);
      let v = U.lerp(U.lerp(swing1, hold, s1), swing2, s2);
      v += 58 * Math.exp(-(((t - TS) / 0.032) ** 2));
      if (t > TS) v += 9 * Math.exp(-(t - TS) * 5) * Math.sin(28 * (t - TS));
      return v;
    }
    const init = () => {
      ctx.rng = U.rng(ctx.seed);
      const rate = Number(P.rate) || 60;
      h = 1 / rate; n = Math.round(LEN * rate) + 1;
      src = new Float64Array(n);
      for (let i = 0; i < n; i++) src[i] = curve(i * h) + ctx.rng.gauss() * 0.08; // 캡처 잡음
      // 원본 접선 (도/초). 잡음을 줄이려고 두 칸 떨어진 샘플로 계산
      tan = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        const a = Math.max(0, i - 2), b = Math.min(n - 1, i + 2);
        tan[i] = (src[b] - src[a]) / ((b - a) * h);
      }
      play = 0; cache = null;
    };
    init();

    // 키 i와 j 사이 샘플 k의 복원 값
    function segVal(i, j, tt, hermite) {
      const t0 = i * h, dtk = (j - i) * h, u = (tt - t0) / dtk;
      if (!hermite) return src[i] + (src[j] - src[i]) * u;
      const u2 = u * u, u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * src[i] + (u3 - 2 * u2 + u) * dtk * tan[i] + (-2 * u3 + 3 * u2) * src[j] + (u3 - u2) * dtk * tan[j];
    }
    function fits(i, j, tol, hermite) {
      for (let k = i + 1; k < j; k++) if (Math.abs(segVal(i, j, k * h, hermite) - src[k]) > tol) return false;
      return true;
    }
    // 키프레임 감소: 남긴 키에서 출발해 사이 샘플이 모두 허용 오차 안인 동안 다음 키를 멀리 밀어냄
    function reduce(tol, hermite) {
      const keys = [0];
      let i = 0;
      while (i < n - 1) {
        let best = i + 1;
        for (let j = i + 2; j < n; j++) { if (fits(i, j, tol, hermite)) best = j; else break; }
        keys.push(best); i = best;
      }
      return keys;
    }
    function uniform(count) {
      const K = U.clamp(Math.round(count), 2, n), keys = [];
      for (let q = 0; q < K; q++) keys.push(Math.round((q * (n - 1)) / (K - 1)));
      return keys;
    }
    function uniformEvery(N) {
      const keys = [];
      for (let k = 0; k < n - 1; k += N) keys.push(k);
      keys.push(n - 1);
      return keys;
    }
    // 키당 바이트: 값 4 (+ 시간 4, 감소 방식) (+ 접선 4, Hermite)
    const keyBytes = (method, hermite) => 4 + (method === 'reduce' ? 4 : 0) + (hermite ? 4 : 0);

    function ensure() {
      const sig = [P.method, P.budget, P.everyN, P.tol, P.interp].join('|');
      if (cache && cache.sig === sig) return cache;
      const hermite = P.interp === 'hermite';
      let keys;
      if (P.method === 'reduce') keys = reduce(P.tol, hermite);
      else if (P.budget === 'fixed') keys = uniformEvery(Math.max(2, P.everyN | 0));
      else {
        const kb = reduce(P.tol, hermite).length;
        keys = uniform(P.budget === 'bytes' ? (kb * keyBytes('reduce', hermite)) / keyBytes('uniform', hermite) : kb);
      }
      const rec = new Float64Array(n), err = new Float64Array(n);
      let maxE = 0, sq = 0, over = 0, s = 0;
      for (let k = 0; k < n; k++) {
        while (s < keys.length - 2 && keys[s + 1] <= k) s++;
        rec[k] = k === keys[s] ? src[k] : segVal(keys[s], keys[s + 1], k * h, hermite);
        err[k] = rec[k] - src[k];
        const e = Math.abs(err[k]);
        if (e > maxE) maxE = e;
        sq += e * e;
        if (e > P.tol + 1e-9) over++;
      }
      cache = { sig, keys, rec, err, maxE, rms: Math.sqrt(sq / n), over, hermite, bytes: keys.length * keyBytes(P.method, hermite) };
      return cache;
    }
    // 연속 시간 t의 원본(선형 보간)과 복원 값
    function evalAt(t, c) {
      const f = U.clamp(t / h, 0, n - 1), k = Math.min(n - 2, Math.floor(f)), u = f - k;
      const sv = src[k] + (src[k + 1] - src[k]) * u;
      let s = 0;
      while (s < c.keys.length - 2 && c.keys[s + 1] <= f) s++;
      return { sv, rv: segVal(c.keys[s], c.keys[s + 1], t, c.hermite) };
    }

    return {
      update(dt) {
        play = (play + dt * P.speed) % LEN;
        ensure();
      },
      render() {
        const g = ctx.g, W = ctx.width, H = ctx.height, col = ctx.side === 'a' ? C.a : C.b;
        const c = ensure();
        const lw = W >= 440 ? 120 : 0;
        const x0 = lw + 12, x1 = W - 12, top = 30, bottom = H - 84;
        const ch = Math.max(60, (bottom - top) * 0.66), ey0 = top + ch + 26, eh = Math.max(30, bottom - ey0);
        let lo = Infinity, hi = -Infinity;
        for (let k = 0; k < n; k++) { if (src[k] < lo) lo = src[k]; if (src[k] > hi) hi = src[k]; }
        lo -= 6; hi += 6;
        const X = (t) => x0 + (t / LEN) * (x1 - x0);
        const Y = (v) => top + ch - ((v - lo) / (hi - lo)) * ch;

        // 커브 패널
        g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x0, top, x1 - x0, ch);
        D.text(g, GTL.L(`관절 각도 (도), 원본 ${n} 샘플`, `Joint angle (deg), ${n} source samples`), x0 + 4, top - 16, { size: 11, color: C.dim });
        // 1초 눈금
        for (let s = 1; s < LEN; s++) D.line(g, X(s), top, X(s), top + ch, 'rgba(255,255,255,0.06)', 1);
        const src2 = [], rec2 = [];
        for (let k = 0; k < n; k++) { src2.push({ x: X(k * h), y: Y(src[k]) }); rec2.push({ x: X(k * h), y: Y(c.rec[k]) }); }
        D.poly(g, src2, null, 'rgba(255,255,255,0.55)', 1, false);
        D.poly(g, rec2, null, col, 2, false);
        for (const k of c.keys) D.circle(g, X(k * h), Y(src[k]), 3, col, '#14161a', 1);
        // 범례
        const lgY = top + 6;
        D.line(g, x1 - 168, lgY + 5, x1 - 154, lgY + 5, 'rgba(255,255,255,0.55)', 1);
        D.text(g, GTL.L('원본', 'Source'), x1 - 150, lgY, { size: 10, color: C.dim });
        D.line(g, x1 - 106, lgY + 5, x1 - 92, lgY + 5, col, 2);
        D.text(g, GTL.L('복원', 'Rebuilt'), x1 - 88, lgY, { size: 10, color: C.dim });
        D.circle(g, x1 - 40, lgY + 5, 3, col);
        D.text(g, GTL.L('키', 'Keys'), x1 - 33, lgY, { size: 10, color: C.dim });

        // 오차 패널
        const R = Math.max(4, P.tol * 4);
        const EY = (e) => ey0 + eh / 2 - (U.clamp(e, -R, R) / R) * (eh / 2);
        g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x0, ey0, x1 - x0, eh);
        D.text(g, GTL.L(`오차 (복원 - 원본, 도), 범위 ±${R.toFixed(1)}`, `Error (rebuilt - source, deg), range ±${R.toFixed(1)}`), x0 + 4, ey0 - 15, { size: 10, color: C.dim });
        D.line(g, x0, EY(0), x1, EY(0), 'rgba(255,255,255,0.25)', 1);
        g.setLineDash([4, 3]);
        D.line(g, x0, EY(P.tol), x1, EY(P.tol), C.accent, 1);
        D.line(g, x0, EY(-P.tol), x1, EY(-P.tol), C.accent, 1);
        g.setLineDash([]);
        const ep = [];
        for (let k = 0; k < n; k++) ep.push({ x: X(k * h), y: EY(c.err[k]) });
        D.poly(g, ep, null, col, 1.5, false);
        for (let k = 0; k < n; k++) if (Math.abs(c.err[k]) > R) D.circle(g, X(k * h), EY(c.err[k]), 2.5, C.bad);

        // 플레이헤드
        const px = X(play);
        D.line(g, px, top, px, ey0 + eh, 'rgba(255,255,255,0.5)', 1);
        const ev = evalAt(play, c);

        // 팔: 위팔 고정, 아래팔 각도 = 커브 값
        if (lw) {
          const sx = 34, sy = top + 26, ex = sx + 40, ey = sy + 34, L2 = 58;
          D.text(g, GTL.L('팔꿈치 각도', 'Elbow angle'), 8, top - 16, { size: 10, color: C.dim });
          D.line(g, sx, sy, ex, ey, 'rgba(255,255,255,0.7)', 6);
          D.circle(g, sx, sy, 6, '#20242c', 'rgba(255,255,255,0.7)', 2);
          const arm = (v, cc, w) => {
            const a = U.rad(70 - v);
            D.line(g, ex, ey, ex + Math.cos(a) * L2, ey + Math.sin(a) * L2, cc, w);
            D.circle(g, ex + Math.cos(a) * L2, ey + Math.sin(a) * L2, 5, cc);
          };
          arm(ev.sv, 'rgba(255,255,255,0.55)', 5);
          arm(ev.rv, col, 3);
          D.circle(g, ex, ey, 4, '#20242c', col, 2);
          D.text(g, GTL.L(`차이 ${Math.abs(ev.rv - ev.sv).toFixed(1)}도`, `Gap ${Math.abs(ev.rv - ev.sv).toFixed(1)} deg`), 8, sy + 110, { size: 10, color: col });
        }

        const srcBytes = n * 4;
        ctx.stat(GTL.L('키 수', 'Key count'), `${c.keys.length} / ${n}`);
        ctx.stat(GTL.L('크기', 'Size'), `${c.bytes} B (${((100 * c.bytes) / srcBytes).toFixed(0)}%)`);
        ctx.stat(GTL.L('최대 오차', 'Max error'), c.maxE.toFixed(2) + GTL.L('도', ' deg'));
        ctx.stat(GTL.L('RMS 오차', 'RMS error'), c.rms.toFixed(2) + GTL.L('도', ' deg'));
        ctx.stat(GTL.L('허용 오차 초과 샘플', 'Samples over tolerance'), c.over);
      },
    };
  },
});
