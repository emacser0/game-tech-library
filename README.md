# Game Tech Library

게임 개발 기법을 **A, B 두 뷰에서 동시에 실행**해 비교하는 인터랙티브 샘플 모음.

- 두 뷰는 같은 시드와 같은 키보드 입력을 받음. 기본값은 A가 기법 미사용, B가 기법 사용.
- 파라미터 표에서 A 열과 B 열을 따로 바꿀 수 있음. 켜기 vs 끄기, 방식 X vs 방식 Y, 값 0.2 vs 0.8 모두 비교 가능.
- 뷰마다 측정값(검사 횟수, 오차 등)과 프레임 비용 그래프(⏱ ms)를 표시
- 샘플마다 설명, 동작 원리 도식, 관찰 포인트, 참고자료(논문, 엔진 문서, 게임 사례, 발표)가 있음
- 비교 대상이 없는 기법은 뷰 하나로 보여줌
- Unreal, Unity의 실제 기능을 단순화한 샘플은 태그 `unreal`, `unity`로 검색 가능
- 샘플마다 구현 난이도(입문, 초급, 중급, 고급)가 있음. 사이드바에서 "주제별"과 "난이도별" 묶음을 바꿀 수 있음. 주제별 목록도 카테고리 안에서 쉬운 것부터 정렬됨.
- 한국어와 영어 지원. 사이드바 위의 "한국어 / English" 버튼으로 바꿈. 처음에는 브라우저 언어를 따름.

## 실행

빌드 과정 없음. 브라우저로 `index.html`을 열면 됨.

로컬 서버로 열면 더 안정적임:

```bash
python -m http.server 8765
# http://127.0.0.1:8765/
```

단축키:
- `P`: 일시정지
- `.`: 한 프레임 진행
- `R`: 리셋
- `/`: 검색

## 구조

```
index.html              앱 화면 (카테고리 매니페스트를 불러옴)
core/util.js            공용 헬퍼 (수학, 난수, 노이즈, 2D 그리기, WebGL, mat4, 지오메트리)
core/runtime.js         샘플 등록과 로딩, 파라미터, View(A/B 인스턴스 실행기)
core/ui.js              사이드바, 파라미터 표, 설명 패널, 메인 루프, 셀프테스트
samples/<카테고리>/     _manifest.js와 샘플 파일 (샘플 1개 = 파일 1개)
tools/smoke.js          Node 스모크 테스트 (모의 Canvas, 모의 WebGL)
tools/lint-text.js      문구 규칙 검사
docs/AUTHORING.md       샘플 작성 규격과 문구 규칙. 샘플을 추가하기 전에 읽을 것
docs/BACKLOG.md         추가할 기법 목록
docs/SOURCES.md         지속 업데이트를 위해 주기적으로 확인하는 소스
docs/RESEARCH_LOG.md    조사 기록
docs/CHANGELOG.md       변경 기록
.claude/skills/update-library/  최신 연구, 엔진 업데이트, 게임 사례를 반영하는 Claude Code 스킬
```

## 검증

```bash
node tools/smoke.js              # 전체
node tools/smoke.js render3d     # 카테고리 하나
node tools/smoke.js fixed-timestep
node tools/smoke.js --en         # 영어 모드. 영어 문구 누락과 화면에 남은 한글 검사
node tools/lint-text.js          # 문구 규칙 검사
```

스모크 테스트는 모의 컨텍스트를 쓰므로 GLSL 컴파일은 검증하지 못함.
GLSL까지 검증하려면 브라우저에서 `index.html#selftest`를 열 것. 실제 WebGL로 모든 샘플을 기본값과 무작위 파라미터로 실행하고 결과를 보여줌.

## 지속 업데이트

Claude Code에서 `/update-library`를 실행하면 아래 순서로 진행됨.

1. 조사: `docs/SOURCES.md`의 학회, 엔진 릴리스 노트, GDC, 기술 블로그에서 마지막 조사일 이후 자료를 찾음
2. 백로그 정리: A/B로 보여줄 수 있는 후보를 우선순위와 함께 `docs/BACKLOG.md`에 추가
3. 구현: 상위 항목을 샘플로 만듦. 엔진 업데이트 소식은 관련 샘플의 참고자료에 추가.
4. 검증: 스모크 테스트, 문구 검사, 셀프테스트 실행
5. 기록: `RESEARCH_LOG.md`와 `CHANGELOG.md`에 남김

인자 예시:
- `/update-library rendering`: 렌더링 분야만 조사
- `/update-library research-only`: 조사만 하고 구현하지 않음
- `/update-library implement 3`: 백로그에서 3개 구현

새 샘플에는 30일 동안 사이드바에 `NEW` 배지가 붙음. 갱신된 샘플에는 `UPD` 배지가 붙음.
사이드바의 "최근 추가만" 필터로 모아 볼 수 있음.
