# 샘플 작성 가이드

샘플을 추가하는 사람과 에이전트가 따르는 기준 문서.
참조 구현:
- Canvas2D: `samples/loop-physics/fixed-timestep.js`
- WebGL: `samples/render3d/texture-filtering.js`

## 원칙

1. **A/B 비교가 핵심.** 모든 샘플은 A, B 두 뷰에서 동시에 실행됨.
   - 기본값: A는 기법 미사용(또는 단순한 방식), B는 기법 사용(또는 개선된 방식)
   - 파라미터의 `a`, `b` 기본값을 다르게 지정. 첫 화면에서 차이가 바로 보여야 함.
2. **같은 조건.** 두 뷰는 같은 시드(`ctx.seed`, `ctx.rng`)와 같은 키보드 입력을 받음. 입력 동기화가 켜져 있으면 마우스 입력도 같음.
   - 무작위 장면은 반드시 `ctx.rng`나 `ctx.random()`으로 생성. 그래야 A와 B의 장면이 같음.
   - `Math.random()` 사용 금지
3. **비교하기 쉬운 파라미터.** 기법 종류는 select, 켜기/끄기는 bool, 수치는 range나 int로 노출.
   - 오브젝트 개수, 장면 종류처럼 두 뷰가 같아야 하는 값은 `shared: true`
4. **측정값 표시.** 차이를 숫자로도 보여줌. 예: `ctx.stat('충돌 검사 수', n)`.
   - 프레임 비용(⏱)은 프레임워크가 자동으로 측정
5. **시각적 설명.** 그리드, 벡터, 궤적, 영역 같은 디버그 표시로 차이의 이유를 보여줌. 텍스트는 짧게.
6. **외부 에셋 금지.** 이미지, 폰트, 사운드 파일과 외부 라이브러리를 쓰지 않음.
   - 텍스처와 스프라이트는 코드로 생성(`ctx.createCanvas`)
   - 이유: `file://`에서 바로 열려야 하고, WebGL 텍스처의 CORS 문제를 피해야 함
7. **참고자료 필수.** `refs`에는 실제로 있는 논문, 엔진 문서, 게임 사례, 발표만 넣음. 지어내지 않음.
   - URL이 확실하지 않으면 `url`을 빼고 제목만 씀
8. **문구는 아래 "문구 규칙"을 따름**
9. **억지 비교 금지.** 켜고 끄거나 방식을 바꿔 비교할 대상이 없는 기법(시각화, 인터랙티브 설명)은 `single: true`로 뷰 하나만 씀.
   - 파라미터 표는 열 하나, 레이아웃과 입력 동기화 버튼은 숨김. `views`는 생략 가능.
   - 비교가 의미 있으면 A/B를 씀. 판단 기준: "B를 보고 A와 다른 점을 한 문장으로 말할 수 있는가".

## 문구 규칙 (ISO 24495-1 쉬운 언어)

독자는 게임 개발 기법을 배우는 사람. 독자가 필요한 정보를 바로 찾고, 한 번에 이해하고, 바로 실험해 볼 수 있게 씀.

### 문장 끝
- "-합니다", "-입니다", "-였습니다", "-한다", "-이다"로 끝내지 않음 <!-- lint-ignore -->
- 명사로 끝내도 자연스러우면 명사로 끝냄. 굳이 "-함", "-없음"을 붙이지 않음
- 명사형이 어색한 동사만 "-됨", "-짐", "-음", "-였음", "-일어남" 형태로 끝냄

| 쓰지 않음 | 씀 |
|---|---|
| 결과가 프레임레이트에 따라 달라집니다. | 결과가 프레임레이트에 따라 달라짐 | <!-- lint-ignore -->
| 이 방식이 더 빠르다. | 이 방식이 더 빠름 | <!-- lint-ignore -->
| 물리를 고정 간격으로 진행함. | 물리를 고정 간격으로 진행 | <!-- lint-ignore -->
| 샘플 71개를 추가함. | 샘플 71개 추가 | <!-- lint-ignore -->
| 원인은 적분 오차였습니다. | 원인은 적분 오차였음 | <!-- lint-ignore -->

### 온점
- 문장이 하나인 항목(목록 항목, 표 칸, 라벨, 도움말, 뷰 이름, 관찰 포인트, 한 문장 문단, 주석)은 끝에 온점을 찍지 않음
- 문장이 둘 이상이면 문장 사이를 구분하려고 모든 문장 끝에 찍음
- `node tools/lint-text.js`가 검사하고, `--fix`로 자동으로 지움
- 영어 문구는 영어 문법대로 온점을 찍음

### 문장과 단어
- 한 문장에 한 가지 내용. 문장은 짧게(40자 안팎 권장).
- 주어가 분명한 능동형. "~되어진다" 같은 이중 피동 금지.
- 익숙한 말을 먼저 씀. 전문 용어는 처음 나올 때 짧게 풀이.
- 영어 용어는 처음 한 번만 괄호로 병기. 예: "코요테 타임(Coyote Time)".
- 군더더기 삭제: "기본적으로", "사실상", "매우", "~하는 것이다", "~라고 할 수 있다"
- 같은 대상은 같은 이름으로 부름. 예: "뷰"와 "화면"을 섞어 쓰지 않음.

### 구조
- 셋 이상 나열하면 목록으로 씀
- `info`: 짧은 문단 2~3개 또는 목록. 순서는 "무엇인가 → 왜 필요한가 → 어떻게 동작하는가 → 단점".
- `look`(관찰 포인트): 행동으로 시작해서 결과로 끝냄
  예: "호스트 FPS를 15 이하로 낮추면 A의 점프 높이가 매번 달라짐."
- `summary`: 한두 문장. 무엇을 비교하는지와 핵심 결론.

### 문장부호
- 엠 대시(—)와 가운뎃점(·, ㆍ, ・) 사용 금지. 코드 주석도 포함. <!-- lint-ignore -->
- 나열은 쉼표, 대비는 "vs", 범위는 "~", 구분은 쉼표나 괄호를 씀
- 고유명사의 en 대시(–)는 하이픈(-)으로 씀. 예: Floyd-Steinberg. <!-- lint-ignore -->

### UI 라벨
- 파라미터 이름, 그룹 이름, 측정값 이름은 명사구. 예: "물리 주기 (Hz)", "충돌 검사 수".
- 버튼은 동작을 나타내는 명사. 예: "다시 시작", "기본값 복원".
- 오류 메시지는 무엇이 잘못됐는지와 해결 방법을 함께 씀

## 영어 문구 (en)

앱은 한국어와 영어를 지원. 사이드바 위의 "한국어 / English" 버튼으로 바꿈. 모든 샘플은 두 언어 문구를 모두 가져야 함.

### 어디에 쓰는가
1. **매니페스트**: 카테고리와 샘플 항목에 `en: 'English title'`
2. **정의의 문구**: 정의에 `en` 블록을 둠. 한국어 필드는 그대로 두고, 영어 모드에서만 덮어씀.
   ```js
   en: {
     title: 'Fixed Timestep & Render Interpolation',  // 매니페스트의 en과 같게
     summary: '...', controls: '...', info: `<p>...</p>`,
     look: ['...', '...'],                       // 한국어 look과 같은 개수
     views: { a: 'Variable dt', b: 'Fixed step + interp' },
     refs: ['note for refs[0]', null, '...'],    // refs와 같은 순서의 note. note가 없으면 null
     params: {
       hostFps: { label: 'Host FPS', help: '...', group: 'Frame simulation' },
       mode: { label: 'Loop mode', options: { variable: 'Variable dt', fixed: 'Fixed step' } },
       restart: 'Restart',                       // label만 바꿀 때는 문자열
     },
   },
   ```
   - `group`은 한국어에서 group이 있는 파라미터에만 씀
   - select의 `options`는 value를 키로 씀. label이 이미 영어인 옵션은 생략 가능.
3. **코드 안의 문구**: 캔버스에 그리는 글자, `ctx.stat` 이름, 상태 메시지는 `GTL.L('한국어', 'English')`로 감쌈
   - 예: `ctx.stat(GTL.L('충돌 검사 수', 'Collision checks'), n)`
   - 코드 주석과 GLSL은 바꾸지 않음

### 영어 문체 (plain English, ISO 24495-1)
- 짧은 문장, 능동형, 현재형. 한 문장에 한 가지 내용.
- 흔한 단어를 씀. 업계 표준 용어(dt, LOD, mipmap 등)는 그대로 씀.
- 한국어처럼 명사로 끝낼 필요 없음. 완전한 문장으로 씀. UI 라벨은 짧은 명사구(Title Case 아님, 첫 글자만 대문자).
- 엠 대시(—), en 대시(–), 가운뎃점(·) 사용 금지. 쉼표, 괄호, 콜론을 씀. <!-- lint-ignore -->
- `look`은 한국어와 같게 "행동 → 결과" 순서. 예: "Lower host FPS below 15. A's jump height changes every time."
- 영어 모드에서 한글이 하나도 보이지 않아야 함. `node tools/smoke.js --en`이 남은 한글을 경고함.
  - 예외: 한글 자체가 시연 데이터인 샘플(다국어 텍스트 배치 등)은 정의에 `demoHangul: true`를 넣음. 이때 캔버스 한글 경고만 꺼짐.

## 도식 (diagram)

설명 패널에 "도식" 제목으로 표시됨. 동작 원리를 그림으로 보여줘서 이해를 도움.
- 넣는 경우: 자료구조, 타임라인, 기하, 파이프라인, 상태 기계, 곡선, 메모리 배치, 패킷 흐름
- 넣지 않는 경우: 라이브 뷰가 이미 같은 내용을 보여줄 때. 장식용 그림 금지.
- 형식: ``diagram: (L) => `<svg viewBox="0 0 540 H">...</svg>` ``. H는 120~220. 배열로 2개까지 가능.
- 글자: 모두 `${L('한국어', 'English')}`로 씀. 문구 규칙과 영어 문체를 그대로 따름.
- 색: `css/style.css`의 "설명 도식" 클래스만 씀. 기법 미사용(A)은 주황, 기법 사용(B)은 파랑으로 뷰와 맞춤.
- 화살표: `<marker id="arr" class="m-accent">` (참조: `samples/loop-physics/fixed-timestep.js`)
- 글자가 viewBox 밖으로 넘치지 않게 두 언어 모두 확인

## 구현 난이도 (level)

매니페스트 항목마다 `level`(1~4)을 지정. 샘플 코드가 아니라 **실제 게임에 이 기법을 넣는 난이도** 기준.

| level | 이름 | 기준 | 예 |
|---|---|---|---|
| 1 | 입문 | 상태 변수 몇 개와 조건문. 수학은 lerp 수준. 수십 줄 | 코요테 타임, 이징, 안개 |
| 2 | 초급 | 벡터 수학, 배열이나 그리드 같은 기본 자료구조 | 균일 그리드, 조향 행동, 카메라 추적 |
| 3 | 중급 | 알려진 알고리즘이나 다중 패스 셰이더. 경계 사례 처리 필요 | A*, SAT, 섀도 매핑, 엔티티 보간 |
| 4 | 고급 | 수치 안정성, 시스템 간 동기화, 정밀도 문제. 튜닝과 디버깅이 어려움 | GJK/EPA, 롤백 넷코드, SSAO, WFC |

애매하면 "처음 구현하는 사람이 버그 없이 완성하기까지 걸리는 시간"으로 판단:
입문은 1시간 이내, 초급은 하루 이내, 중급은 며칠, 고급은 1주 이상.

## 오디오 샘플 주의점

- `AudioContext`는 사용자가 "소리 켜기" 버튼(button 파라미터)을 누를 때 만듦. 자동 재생 금지.
- 소리를 켜지 않아도 시각화(파형, 감쇠 곡선, 거리 표시 등)만으로 차이가 보여야 함
- `typeof AudioContext === 'undefined'`이면 시각화만 동작. `dispose()`에서 `audioCtx.close()`.
- 두 뷰가 동시에 소리를 내면 비교가 어려움. 소리는 마우스가 올라간 뷰만 내거나, 뷰별 "소리" bool로 켬.
- 음원 파일 금지. 오실레이터나 코드로 만든 버퍼(노이즈, 합성음)만 사용.

## 파일 구성

- 샘플 파일: `samples/<category>/<id>.js`. 파일 하나에서 `GTL.register({...})`를 한 번 호출.
- 매니페스트: `samples/<category>/_manifest.js`의 `samples` 배열에 한 줄 추가
  `{ id: 'my-sample', level: 2, title: '제목', tags: ['tag1', 'tag2'], added: 'YYYY-MM-DD' }`
- 기존 샘플을 크게 고치면 매니페스트 항목에 `updated: 'YYYY-MM-DD'` 추가
- id: 전체에서 유일한 kebab-case
- 매니페스트의 `title`과 샘플 파일의 `title`은 같게 유지
- 새 카테고리: 매니페스트 파일을 만들고 `index.html`에 `<script>` 한 줄 추가

## 정의 스키마

```js
GTL.register({
  id: 'my-sample',                 // 매니페스트 id와 같음
  title: '제목',
  summary: '한두 문장 요약 (상단에 표시)',
  renderer: '2d',                  // '2d'(기본), 'webgl', 'webgl2'
  views: { a: '미사용', b: '사용' }, // 뷰 라벨
  single: false,                   // true면 비교 없이 뷰 하나 (원칙 9)
  controls: '←→ 이동, Space 점프', // 조작법 (없으면 생략)
  info: `<p>HTML 설명. 원리, 장단점.</p>`,
  diagram: (L) => `<svg viewBox="0 0 540 160">...</svg>`, // 설명 도식 (아래 "도식" 참고, 선택)
  look: ['관찰 포인트 1 (어떤 파라미터를 바꾸면 무엇이 보이는지)', '...'],
  refs: [
    { type: 'paper' | 'engine' | 'game' | 'talk' | 'article' | 'book' | 'code', title, url?, year?, note? },
  ],
  params: [ /* 아래 참고 */ ],
  // 선택:
  pixelRatio: 1,                   // 기본은 devicePixelRatio(최대 2). 픽셀아트 등은 1
  autoClear: true,                 // 2d: 매 프레임 배경색으로 지움 (기본 true)
  background: '#14161a',
  contextAttributes: (params) => ({ antialias: params.msaa }), // 컨텍스트 생성 옵션 (해당 param은 reset: true)
  setup(ctx) { ...; return instance; },
});
```

### 파라미터

| 필드 | 설명 |
|---|---|
| `key` | 필수. `ctx.params[key]`로 읽음 |
| `label`, `help` | 표시 이름, 짧은 설명 |
| `type` | `'bool'`, `'range'`, `'int'`, `'select'`, `'color'`, `'button'` |
| `default` | 기본값. `a`, `b`로 뷰별 기본값을 덮어씀 |
| `min`, `max`, `step` | range, int용 |
| `options` | select용. `['x','y']` 또는 `[{ value, label }]`. value는 문자열이나 숫자 |
| `shared: true` | 컨트롤 하나로 두 뷰에 같은 값 적용 (장면 설정용) |
| `reset: true` | 값이 바뀌면 두 뷰를 처음부터 다시 시작 (setup에서만 읽는 값, 개수, 맵 크기 등) |
| `group` | 표의 묶음 제목 |
| `when: (p) => bool` | 해당 뷰에서 의미 없는 파라미터를 흐리게 표시 |
| `buttonLabel` | button 라벨. button은 두 뷰의 `instance.onAction(key)`를 호출 |

`reset`이 없는 파라미터는 **매 프레임 `ctx.params`에서 읽어** 바로 반영되게 함. 캐시가 필요하면 `onParam(key, value)`에서 갱신.

## ctx (setup 인자)

| 필드 | 설명 |
|---|---|
| `g` | CanvasRenderingContext2D (renderer '2d'). 프레임워크가 매 프레임 DPR 배율 transform을 설정해 둠. **CSS 픽셀 좌표**로 그리면 됨. `setTransform`을 직접 쓰면 `ctx.pixelRatio`를 곱함 |
| `gl` | WebGL 컨텍스트. `gl.viewport(0,0,ctx.pixelWidth,ctx.pixelHeight)`를 직접 호출 |
| `width`, `height` | 뷰 크기(CSS px). 크기가 바뀌면 갱신됨. 매 프레임 읽을 것 |
| `pixelWidth`, `pixelHeight`, `pixelRatio` | 실제 캔버스 버퍼 크기 |
| `params` | 이 뷰의 파라미터 (실시간 반영) |
| `side` | `'a'` 또는 `'b'` |
| `dt`, `realDt`, `time`, `frame` | `dt`는 속도 배율을 적용하고 0.1초로 제한한 값 |
| `seed`, `rng`, `random()` | 시드 난수. `rng.range(a,b)`, `rng.int(a,b)`, `rng.pick(arr)`, `rng.gauss()`, `rng.shuffle(arr)`. 리셋 때 같은 결과를 내려면 `ctx.rng = GTL.util.rng(ctx.seed)` |
| `input.key(code)`, `pressed(code)`, `released(code)` | 키보드 (KeyboardEvent.code: `'Space'`, `'ArrowLeft'`, `'KeyZ'` 등). 두 뷰가 공유 |
| `input.mouse` | `{ x, y, down, pressed, released, inside, wheel, button }`. 뷰 기준 CSS px |
| `stat(label, value)` | 뷰 왼쪽 아래 오버레이에 표시 |
| `createCanvas(w, h)` | 오프스크린 캔버스 |
| `now()` | 고해상도 시간(ms). 알고리즘 비용 측정용 |

**예약 키**: `P`(일시정지), `R`(리셋), `.`(한 프레임), `/`(검색). 샘플에서 쓰지 않음.

## 인스턴스 (setup 반환값, 모두 선택)

```js
{
  update(dt) {},                   // 일시정지 중에는 호출 안 됨
  render() {},                     // 일시정지 중에도 파라미터가 바뀌면 호출됨. 여기서 상태를 바꾸지 않음
  resize(w, h) {},
  onParam(key, value) {},
  onAction(key) {},                // button 파라미터
  onPointer(type, mouse, event) {},// type: 'down', 'up', 'move', 'enter', 'leave', 'wheel'
  dispose() {},
}
```

## GTL.util (core/util.js, 수정 금지)

- 수학: `clamp, lerp, invLerp, remap, smoothstep, damp(a,b,lambda,dt), approach, wrap, angleDiff, lerpAngle, rad, deg, TAU`
- 벡터: `v2(x,y)`, `v2.add/sub/scale/dot/cross/len/lenSq/dist/distSq/norm/perp/rotate/lerp/fromAngle/angle/limit` (새 객체 반환)
- 난수, 노이즈: `rng(seed)`, `noise(seed) → { perlin2, perlin3, value2, fbm2(x,y,{octaves,lacunarity,gain,fn}), hash2 }`
- 이징: `ease.linear, inQuad, outQuad, inOutQuad, inCubic, outCubic, inOutCubic, inQuart, outQuart, inOutQuart, inSine, outSine, inOutSine, inExpo, outExpo, inOutExpo, inBack, outBack, inOutBack, inElastic, outElastic, inBounce, outBounce`
- 색: `hsl(h,s,l,a)`, `rgb(r,g,b,a)`, `hexToRgb`, `hexToRgb01`, `colors.{bg,grid,text,dim,a,b,good,bad,warn,accent,series[]}`
  - A 뷰 강조색 `colors.a`(주황), B 뷰 `colors.b`(하늘색). `ctx.side`로 골라 쓰면 통일감이 생김.
- 2D 그리기 `draw`: `clear, circle(g,x,y,r,fill,stroke,lw), rect, line, poly(g,pts,fill,stroke,lw,closed), arrow, grid(g,w,h,step,color,ox,oy), text(g,str,x,y,{size,color,align,baseline,font}), plot(g,values,x,y,w,h,{min,max,color,label})`
- WebGL `gl`:
  - `program(gl,vs,fs) → { program, use(), u(name), a(name) }` (컴파일에 실패하면 로그와 함께 throw)
  - `buffer, attrib(gl,prog,name,buf,size), texture(gl,src,{filter,mipmap,wrap}), textureParams`
  - `framebuffer(gl,w,h,{depth,filter,float}) → {fb,tex,bind(),dispose()}`
  - `quad(gl).draw(prog)` + `QUAD_VS` (attribute `a_pos`, varying `v_uv`)
- `mat4`: `create, multiply(a,b), mul(...), perspective, ortho, lookAt, translation, scaling, rotationX/Y/Z, invert, transpose, normalMatrix(→mat3), transformPoint, orbitEye(target,yaw,pitch,dist)`
- `geometry`: `cube, sphere, plane(size,div,uvScale), torus` → `upload(gl, geo).draw(prog)` (attribute `a_position, a_normal, a_uv`). 모두 CCW 감김.

## WebGL 주의점

- WebGL1 셰이더는 GLSL ES 1.0 (`attribute/varying/texture2D/gl_FragColor`). `renderer: 'webgl2'`면 `#version 300 es`.
- 뷰마다 GL 컨텍스트가 따로 있음. 리소스는 setup에서 생성. 해제는 프레임워크가 컨텍스트를 버리며 처리.
- 확장(`EXT_texture_filter_anisotropic` 등)이 없을 수 있음. null을 확인하고 stat에 "미지원" 표시.
- 프레임워크는 2D만 자동으로 지움. WebGL은 `gl.clear`를 직접 호출.
- 셰이더 문자열에는 ASCII만 씀

## 성능

- 파라미터 최대값에서도 일반 PC에서 30fps 이상이 목표. 개수 파라미터의 max는 현실적으로.
- 최적화 기법 샘플에서 A(단순한 방식)는 일부러 느려도 됨. 브라우저가 멈추면 안 됨.
- 매 프레임 화면 전체 `getImageData`/`putImageData`는 피함. 저해상도 오프스크린 캔버스에 그린 뒤 `drawImage`로 확대.

## 검증 (필수)

```bash
node tools/smoke.js <category-id>        # 모의 Canvas/WebGL로 런타임 예외와 정의 검사
node tools/smoke.js --en <category-id>   # 영어 모드. en 블록 누락과 화면에 남은 한글 검사
```
모두 ✓이고 경고가 0개가 될 때까지 고침.
모의 환경에서는 셰이더를 컴파일하지 않음. GLSL은 특히 꼼꼼히 확인:
- 실수 리터럴은 `1.0`처럼 씀
- 타입 일치
- 쓰지 않는 uniform의 location은 null일 수 있음
- WebGL1의 반복문 상한은 상수

브라우저 검증: `python -m http.server` 실행 후 `index.html#selftest` 열기.
