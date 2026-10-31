---
name: update-library
description: Game Tech Library에 최신 연구, 엔진 업데이트, 게임 사례를 반영. 새 논문, 엔진 릴리스, GDC 발표를 조사해 백로그에 정리하고, 우선순위가 높은 항목을 A/B 비교 샘플로 구현하거나 기존 샘플의 참고자료를 보강. "라이브러리 업데이트", "새 기술 찾아서 추가", "최신 논문 반영" 같은 요청에 사용.
---

# Game Tech Library 업데이트 루틴

인자(선택):
- 주제나 카테고리 (예: `rendering`, `netcode`, `Unreal 5.7`)
- `research-only`: 조사만 하고 구현하지 않음
- `implement N`: 백로그에서 N개 구현

인자가 없으면: 조사, 백로그 갱신, 상위 2개 구현, 검증, 기록 순서로 진행.

## 0. 준비
1. 다음 문서를 읽음:
   - `docs/AUTHORING.md`: 샘플 규격과 문구 규칙
   - `docs/SOURCES.md`: 조사 대상
   - `docs/BACKLOG.md`
   - `docs/RESEARCH_LOG.md`
2. `RESEARCH_LOG.md`에서 마지막 조사 날짜를 확인. 그 이후에 나온 자료를 먼저 찾음.
3. 현재 샘플 목록은 `samples/*/_manifest.js`에서 확인 (중복 방지)

## 1. 조사 (WebSearch, WebFetch)
`docs/SOURCES.md`의 항목별로 마지막 조사 이후 나온 자료를 찾음. 검색 여러 개를 한 번에 병렬로 보냄.
- **논문, 학회**: SIGGRAPH, SIGGRAPH Asia, HPG, EGSR, I3D, JCGT, Advances in Real-Time Rendering 코스, AIIDE, MIG
- **엔진 업데이트**: Unreal, Unity, Godot, Bevy의 릴리스 노트와 로드맵. 새 기능 중 켜고 끄며 비교할 수 있는 것
- **게임 사례**: GDC Vault 발표, 개발 블로그, 포스트모템, Digital Foundry 기술 분석
- **커뮤니티 1차 자료**: Red Blob Games, Inigo Quilez, Gaffer on Games, GPUOpen, NVIDIA, AMD, Intel 개발자 블로그

후보마다 두 가지를 판단:
- **A/B로 보여줄 수 있는가?** 브라우저(Canvas2D, WebGL1, WebGL2)에서 단순화해 "기법 없음 vs 있음" 또는 "방식 X vs Y"로 비교할 수 있는지 확인.
  - 불가능하면(하드웨어 레이트레이싱 등) 기존 샘플의 참고자료로만 추가
  - 또는 핵심 아이디어를 2D로 줄인 버전을 검토
- **출처가 실제로 있는가?** URL을 직접 열어 제목과 연도를 확인한 것만 기록. 추측으로 만든 링크 금지.

## 2. 백로그 갱신 (`docs/BACKLOG.md`)
표에 후보를 추가하거나 갱신: 제목, 카테고리, 출처(링크), A/B 비교 아이디어, 우선순위(P1~P3), 상태.

우선순위 기준(높은 순):
1. 업계 영향력 (여러 엔진이나 게임이 채택)
2. 시각적 차이가 분명함
3. 구현이 쉬움

엔진 업데이트가 기존 샘플과 관련되면 "참고자료 보강" 항목으로 넣음.
예: Godot 4.4 물리 보간 → `fixed-timestep` 샘플의 refs에 추가.

## 3. 구현
`research-only`가 아니면 백로그 상위 항목을 구현 (기본 2개, 참고자료 보강은 전부).
- `docs/AUTHORING.md`의 규격과 문구 규칙을 그대로 따름. 참조 구현을 먼저 읽음.
- 매니페스트 항목에 `level`(1 입문 ~ 4 고급)을 지정. 기준은 `docs/AUTHORING.md`의 "구현 난이도".
- 영어 문구도 함께 작성: 매니페스트의 `en`, 정의의 `en` 블록, 코드 안 문구의 `GTL.L('한국어', 'English')`. 기준은 `docs/AUTHORING.md`의 "영어 문구 (en)".
- 매니페스트의 `added`는 오늘 날짜. 기존 샘플을 크게 고치면 매니페스트 항목에 `updated: 'YYYY-MM-DD'` 추가.
- 참고자료 보강: 해당 샘플의 `refs` 배열에 항목 추가 (type: paper, engine, game, talk, article)
- 새 카테고리: `samples/<cat>/_manifest.js`를 만들고 `index.html`에 script 한 줄 추가
- 여러 카테고리를 함께 구현할 때는 카테고리별로 서브에이전트에 나눠 맡겨도 됨. 각자 자기 폴더만 수정.

## 4. 검증
1. `node tools/smoke.js`와 `node tools/smoke.js --en`: 모두 ✓, 새 경고 0개
2. `node tools/lint-text.js`: "위반 없음"
3. WebGL 샘플을 추가했다면 브라우저에서 `index.html#selftest`로 셰이더 컴파일까지 확인
   - `python -m http.server 8765` 실행 후 `http://127.0.0.1:8765/#selftest` 열기
   - 결과는 `window.__selftest`에 있음
4. 새 샘플을 직접 열어 기본 A/B 상태에서 차이가 바로 보이는지 스크린샷으로 확인

## 5. 기록
- `docs/RESEARCH_LOG.md` 맨 위에 오늘 날짜 섹션 추가: 조사한 소스, 찾은 후보, 채택하거나 보류한 이유
- `docs/CHANGELOG.md` 맨 위에 추가: 새로 추가하거나 바꾼 샘플과 참고자료
- `docs/BACKLOG.md`에서 구현한 항목의 상태를 `done (YYYY-MM-DD)`로 변경
- git 저장소라면 변경을 커밋 하나로 묶을 준비만 함. 커밋과 푸시는 사용자가 요청할 때만 함.
  - 예외: 스케줄 실행처럼 사용자가 커밋을 미리 허락한 경우. 이때는 `update/YYYY-MM-DD` 브랜치에 커밋.

## 6. 보고
사용자에게 다음을 알림:
- 새 샘플 목록 (샘플마다 한 줄 설명)
- 보강한 참고자료
- 백로그의 다음 후보 상위 5개
- 검증 결과
