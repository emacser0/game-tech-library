# 변경 기록

`/update-library`를 실행하거나 샘플을 직접 추가할 때 맨 위에 섹션 추가.

## 2026-11-01: 문구 정비 (온점, 명사 종결), 단일 뷰 검토

- 문장이 하나인 항목 끝의 불필요한 온점 1,145개 삭제. `node tools/lint-text.js`가 검사하고 `--fix`로 자동 삭제
- 명사로 끝내도 자연스러운 문장은 명사로 끝냄 (예: "진행함" → "진행"). 약 600곳
- 모든 샘플의 A/B 필요성 검토. `cellular-caves`를 단일 뷰로 바꿈 (A가 B 생성 과정의 첫 프레임과 같았음)
- 규칙: `docs/AUTHORING.md`의 "문장 끝", "온점"

## 2026-11-01: Unreal, Unity 기법, 도식, 단일 뷰

- Unreal, Unity 기법 샘플 24개 추가 (전체 202개). 태그 `unreal`, `unity`로 검색 가능.
  - 게임 루프 & 물리: PD 관절 드라이브 [중급]
  - 충돌, 공간 분할, 최적화: 레이어 충돌 매트릭스 [입문], 월드 파티션 스트리밍 [초급], HZB 오클루전 컬링 [중급], ECS 아키타입 청크 [중급]
  - 조작감 & 카메라: 입력 트리거 & 모디파이어 [입문], 스프링 암 카메라 충돌 [초급]
  - 보간 & 애니메이션: 2D 블렌드 스페이스 [중급], 지면 발 IK [초급], 모션 워핑 [중급], 애니메이션 커브 압축 [중급]
  - AI & 길찾기: 내비메시 카빙 [중급], 환경 쿼리(EQS) [초급]
  - 절차적 생성: PCG 포인트 파이프라인 [초급]
  - 2D 렌더링: GPU 파티클 [중급], 가상 텍스처링 [고급]
  - 3D 렌더링: 화면 크기 기준 LOD [초급], 박스 투영 큐브맵 [초급], SH 라이트 프로브 [중급]
  - 네트워크: 넷 휴면 [초급], 벡터, 회전 양자화 [초급]
  - 오디오: 잔향 영역 [초급]
  - UI & 게임 시스템: 캔버스 다시 만들기 분리 [초급], 능력치 수정자 집계(GAS) [초급]
- 설명 패널에 도식 추가. 기존 샘플 177개(1개 제외)와 새 샘플 모두에 동작 원리 SVG 도식.
  - 제외: `fsm-vs-behavior-tree` (뷰가 이미 상태 그래프와 트리를 그림)
  - 작성 규칙: `docs/AUTHORING.md`의 "도식 (diagram)"
- 단일 뷰 모드 `single: true`. 비교 대상이 없는 기법은 A/B를 억지로 만들지 않음 (`docs/AUTHORING.md` 원칙 9).
- 백로그 3개 완료: SH 라이트 프로브, GPU 파티클, ECS 아키타입

## 2026-11-01: 영어 지원, 정렬

- 한국어와 영어 지원. 사이드바 위 "한국어 / English" 버튼으로 전환. 선택은 브라우저에 저장됨.
  - 앱 화면 문구, 난이도 이름, 오류 메시지를 두 언어로 작성
  - 샘플 178개 모두에 영어 제목, 설명, 관찰 포인트, 파라미터 이름, 화면 글자를 추가
  - 작성 규칙: `docs/AUTHORING.md`의 "영어 문구 (en)". 검사: `node tools/smoke.js --en`.
- 주제별 목록도 카테고리 안에서 난이도 순(입문 → 고급)으로 정렬

## 2026-11-01: 샘플 추가, 구현 난이도

- 샘플 71개 추가 (전체 178개). 새 카테고리 2개: 오디오, UI & 게임 시스템.
- 모든 샘플에 구현 난이도(입문, 초급, 중급, 고급) 지정. 기준은 `docs/AUTHORING.md`의 "구현 난이도".
- 사이드바에서 "주제별"과 "난이도별" 묶음을 바꿀 수 있음. 샘플 상단에 난이도 표시.
- 백로그 항목 11개 구현 (`docs/BACKLOG.md`에 done 표시)
- 셀프테스트 결과 화면이 다른 샘플을 가리던 문제 수정

### 게임 루프 & 물리 (6)
- `jump-arc-design` [입문]: 점프 파라미터 설계 (높이, 정점 시간 역산)
- `time-scale-slowmo` [초급]: 타임 스케일 & 슬로모션
- `xpbd-compliance` [고급]: XPBD vs PBD: 반복 횟수와 강성
- `soft-step-solver` [고급]: 소프트 스텝 & 소프트 제약 (Box2D v3)
- `buoyancy-drag` [초급]: 부력 & 항력 (잠긴 부피 비례)
- `contact-impulse-response` [초급]: 충돌 응답: 위치 보정 vs 임펄스

### 충돌, 공간 분할, 최적화 (6)
- `circle-separation` [입문]: 원 vs 원 충돌: 겹침 판정 vs 밀어내기
- `point-in-polygon` [초급]: 점-다각형 포함 판정: 교차 수 vs 와인딩 넘버
- `collide-and-slide` [초급]: 원 vs 선분 이동: 충돌 시 멈춤 vs 미끄러짐 (collide and slide)
- `loose-quadtree` [중급]: 느슨한 쿼드트리: 경계에 걸친 오브젝트
- `character-slopes-steps` [중급]: 캐릭터 컨트롤러: 경사 한계, 계단 오르기, 지면 붙이기
- `dynamic-aabb-tree` [고급]: 동적 AABB 트리: fat AABB 증분 갱신 vs 매 프레임 재구축

### 조작감 & 카메라 (6)
- `stick-deadzone` [입문]: 아날로그 스틱 데드존
- `input-latency` [입문]: 입력 지연 체감 (프레임 지연)
- `dash-iframes` [입문]: 대시 & 잔상 & 대시 무적
- `wall-jump` [초급]: 벽 점프 & 벽 미끄러짐
- `multi-target-camera` [초급]: 다중 대상 카메라 프레이밍
- `combo-buffer` [중급]: 콤보 입력 버퍼 & 캔슬 윈도우

### 보간 & 애니메이션 (6)
- `flipbook-framerate` [입문]: 애니메이션 프레임레이트: 매 프레임 vs 2프레임마다 (on twos)
- `root-motion` [초급]: 루트 모션 vs 인플레이스 + 코드 이동
- `look-at-spine` [초급]: 룩앳: 머리만 회전 vs 척추 분산 + 각도 제한
- `ribbon-trail` [초급]: 궤적 효과: 점 찍기 vs 연속 리본
- `additive-layers` [중급]: 애디티브 레이어 vs 덮어쓰기 레이어
- `motion-matching` [고급]: 모션 매칭 vs 상태 머신 블렌딩

### AI & 길찾기 (6)
- `patrol-waypoints` [입문]: 순찰: 무작위 이동 vs 웨이포인트 순찰
- `last-known-position` [초급]: 감각 기억: 마지막으로 본 위치 추적
- `fsm-vs-behavior-tree` [중급]: 유한 상태 기계 (FSM) vs 행동 트리 (BT)
- `formation-movement` [중급]: 대형 이동: 각자 이동 vs 슬롯 기반 대형
- `hpa-star` [고급]: 계층적 길찾기: HPA* vs A*
- `navmesh-funnel` [고급]: 내비메시 경로: 폴리곤 중심 vs 퍼널 알고리즘

### 절차적 생성 (6)
- `drop-pity` [입문]: 드롭 확률 보정: 독립 확률 vs 셔플 백 vs 천장
- `perlin-worms` [초급]: 펄린 웜 (Perlin Worms) 동굴 vs 노이즈 임계값
- `markov-names` [초급]: 마르코프 체인 이름 생성 (n-gram 차수)
- `river-flow` [중급]: 강 생성: 흐름 누적 vs 노이즈 강
- `hydraulic-erosion` [고급]: 수력 침식 (물방울 방식)
- `lock-key-dungeon` [고급]: 열쇠-자물쇠 던전: 무작위 배치 vs 미션 우선 생성

### 2D 렌더링 & 셰이더 (7)
- `parallax-layers` [입문]: 패럴랙스 스크롤링 (깊이별 다중 레이어)
- `hit-flash-outline` [입문]: 피격 플래시 & 스프라이트 외곽선 셰이더
- `dissolve-shader` [입문]: 디졸브 셰이더 (노이즈 임계값 + 가장자리 발광)
- `heat-distortion` [초급]: 열기 왜곡 & 굴절 (UV 오프셋 노이즈)
- `metaballs-2d` [초급]: 2D 메타볼 (임계값 필드)
- `fsr-upscale` [중급]: 공간 업스케일링 (Bilinear vs 에지 적응 + 샤프닝)
- `jfa-2d-gi` [고급]: 2D 전역 조명 (Jump Flood 거리장 + 레이 마칭)

### 3D 렌더링 (7)
- `vertex-wind-sway` [입문]: 버텍스 셰이더 바람 흔들림 (풀, 나무)
- `triplanar-mapping` [초급]: 트라이플래너 매핑 vs UV 매핑
- `cubemap-reflection` [초급]: 큐브맵 환경 반사 & 거칠기별 밉
- `projected-decals` [중급]: 데칼: 겹친 평면 vs 박스 투영
- `taa` [고급]: TAA (시간적 안티에일리어싱)
- `cascaded-shadow-maps` [고급]: 캐스케이드 섀도 맵 (CSM)
- `clustered-light-culling` [고급]: 타일드 & 클러스터드 라이트 컬링

### 네트워크 & 멀티플레이 (6)
- `ping-display` [입문]: 핑 표시 (순간 RTT vs 평균 vs 지터)
- `event-vs-state` [초급]: 이벤트 복제 vs 상태 복제
- `reliability-ack` [중급]: 신뢰성 계층 (Ack 비트필드 + 재전송)
- `clock-sync` [중급]: 시계 동기화 (NTP 방식)
- `priority-accumulator` [중급]: 우선순위 누적기 (Priority Accumulator)
- `lockstep-checksum` [고급]: 락스텝 디싱크 감지 (체크섬)

### 오디오 (7)
- `distance-attenuation` [입문]: 거리 감쇠 곡선 (Rolloff)
- `sound-variation` [입문]: 반복 피로 줄이기 (랜덤화 & 변형 풀)
- `ducking` [입문]: 덕킹 (Ducking)
- `doppler` [초급]: 도플러 효과 (Doppler)
- `voice-limit` [초급]: 보이스 제한 & 가상화
- `occlusion` [중급]: 차폐 (Occlusion) 레이캐스트
- `audio-scheduling` [중급]: 오디오 스케줄링 (Lookahead)

### UI & 게임 시스템 (8)
- `nine-slice` [입문]: 9-슬라이스 스케일링
- `anchor-safe-area` [입문]: 앵커 & 세이프 에어리어
- `text-overflow` [입문]: 텍스트 넘침 처리: 번역 문자열과 자동 축소
- `list-virtualization` [초급]: 목록 가상화: 1만 개 항목 스크롤
- `command-undo` [초급]: 커맨드 패턴: 실행 취소, 다시 실행, 리플레이
- `event-queue` [초급]: 이벤트 큐: 즉시 호출 vs 지연 처리
- `hfsm-pushdown` [중급]: 계층형 상태 기계 & 상태 스택 vs 평면 FSM
- `save-versioning` [중급]: 세이브 데이터 버전 관리 & 마이그레이션

## 2026-11-01: 문구 정비

- 모든 문구를 ISO 24495-1 쉬운 언어 기준으로 다시 씀 (UI, 샘플 설명, 문서, 주석)
- 문장 끝을 명사형("-함", "-됨", "-음")으로 통일. 엠 대시와 가운뎃점 제거.
- `docs/AUTHORING.md`에 "문구 규칙" 추가. 규칙 검사 도구 `tools/lint-text.js` 추가.
- `core/util.js`의 토러스 삼각형 감김 방향을 CCW로 수정

## 2026-10-31: 초기 버전

프레임워크(A/B 비교 뷰, 파라미터 표, 측정값 오버레이, 셀프테스트, 스모크 테스트)와 9개 카테고리 107개 샘플.

### 게임 루프 & 물리 (11)
- `fixed-timestep`: 고정 타임스텝 & 렌더 보간
- `physics-integrators`: 수치 적분기 비교 (Euler, Verlet, RK4)
- `ccd-tunneling`: 터널링 & 연속 충돌 감지 (CCD)
- `physics-substepping`: 서브스텝 & 강성 스프링 안정성
- `spring-damper`: 감쇠 스프링 & 임계 감쇠 (SmoothDamp)
- `pbd-cloth`: Verlet 천 & 제약 반복 횟수 (PBD)
- `material-combine`: 반발 & 마찰 결합 모드 (Combine Mode)
- `stacking-solver`: 상자 쌓기 & 솔버 반복 / Warm Starting
- `framerate-independent-damping`: 프레임레이트 독립 감쇠 (lerp vs damp)
- `sleeping-islands`: 슬립 & 시뮬레이션 아일랜드
- `fixed-point-determinism`: 결정론: 부동소수점 vs 고정소수점

### 충돌, 공간 분할, 최적화 (12)
- `broadphase-grid`: 브로드페이즈: 전수 검사 vs 균일 그리드 / 공간 해시
- `quadtree`: 쿼드트리: 적응형 공간 분할과 범위 질의
- `sweep-and-prune`: Sweep and Prune: 정렬 축과 시간적 일관성
- `bounding-volumes`: 경계 볼륨: 원, AABB, OBB, 볼록 껍질
- `sat`: 분리축 정리 (SAT) & 최소 이동 벡터
- `gjk-minkowski`: 민코프스키 차 & GJK / EPA
- `raycast-dda`: 그리드 레이캐스트: DDA vs 고정 간격 샘플링
- `tilemap-resolution`: 타일맵 충돌 해결: 축 분리와 모서리 걸림
- `object-pooling`: 오브젝트 풀링 & GC 스파이크
- `view-culling`: 뷰(프러스텀) 컬링: 화면 밖은 그리지 않기
- `update-lod`: 시간 분할 & 업데이트 LOD
- `soa-vs-aos`: SoA vs AoS: 파티클 업데이트의 메모리 배치

### 조작감 & 카메라 (12)
- `coyote-time`: 코요테 타임 (Coyote Time)
- `jump-buffer`: 점프 버퍼링 (Jump Buffering)
- `variable-jump`: 가변 점프 & 중력 비대칭
- `accel-curves`: 가속, 감속 곡선 & 공중 제어
- `corner-correction`: 코너 보정 (Corner Correction)
- `screen-shake`: 화면 흔들림: 트라우마 & 펄린 노이즈
- `hit-stop`: 히트스톱 & 히트 플래시
- `squash-stretch`: 스쿼시 & 스트레치
- `knockback-iframes`: 넉백 & 무적 프레임
- `camera-follow`: 카메라 추적 방식
- `aim-assist`: 에임 어시스트 (마찰 & 자석)
- `juice`: 주스: Juice it or lose it

### 보간 & 애니메이션 (12)
- `easing-functions`: 이징 함수 (Easing Functions)
- `angle-interpolation`: 각도 보간: 최단 경로 (lerpAngle)
- `spline-curves`: 스플라인: Catmull-Rom α, Bézier, B-spline
- `arc-length`: 등속 이동: 호 길이 재매개화
- `ik-fabrik-ccd`: 역운동학 IK: FABRIK vs CCD
- `procedural-walk`: 절차적 보행 (Procedural Walk)
- `second-order-dynamics`: 2차 동역학으로 성격 있는 추종
- `pose-crossfade`: 애니메이션 크로스페이드 블렌딩
- `pixel-snap-camera`: 픽셀 스냅 vs 서브픽셀 카메라
- `quaternion-slerp`: 회전 보간: 오일러 lerp vs 쿼터니언 slerp
- `animation-principles`: 애니메이션 원칙: 예비 동작, 스쿼시 & 스트레치, 후속 동작
- `lerp-smoothing`: lerp 스무딩과 프레임레이트 독립성

### AI & 길찾기 (11)
- `pathfinding-algorithms`: 길찾기 알고리즘: BFS, Dijkstra, Greedy, A*
- `astar-heuristics`: A* 휴리스틱, 가중치(ε), 동점 처리
- `jump-point-search`: Jump Point Search (JPS) vs A*
- `path-smoothing`: 경로 스무딩: String Pulling, Theta*
- `flow-field`: 플로우 필드 (Flow Field) vs 유닛별 A*
- `steering-behaviors`: 조향 행동: Seek, Arrive, Pursue, Wander
- `boids`: 보이드 (Boids): 분리, 정렬, 응집
- `local-avoidance`: 로컬 회피: 반발력 vs RVO
- `vision-stealth`: 시야 판정 & 잠입 감지 게이지
- `influence-map`: 영향력 맵 (Influence Map): 스탬프 vs 전파
- `utility-ai`: 의사결정: 우선순위 FSM vs Utility AI

### 절차적 생성 (12)
- `noise-types`: 노이즈 종류 (White, Value, Perlin, Simplex, Worley)
- `fbm-terrain`: fBm 옥타브 지형 (Ridged / Billow)
- `domain-warp`: 도메인 워핑 (Domain Warping)
- `poisson-disk`: 포아송 디스크 샘플링 (Bridson): 나무 배치
- `cellular-caves`: 셀룰러 오토마타 동굴
- `bsp-dungeon`: BSP 던전 vs 랜덤 방 배치
- `drunkard-walk`: 드렁커드 워크 (Random Walk) 동굴
- `wfc-tiled`: 웨이브 펑션 콜랩스 (Tiled WFC)
- `voronoi-lloyd`: 보로노이 & 로이드 완화 (Lloyd Relaxation)
- `lsystem-plants`: L-시스템 식물 (결정론적 vs 확률적)
- `marching-squares`: 마칭 스퀘어 (등치선 추출)
- `chunk-seeds`: 시드 & 결정론: 청크 해시 시드 vs 순차 RNG

### 2D 렌더링 & 셰이더 (13)
- `dither-patterns`: 디더링 (Ordered, Blue Noise, 오차 확산)
- `palette-cycling`: 팔레트 LUT, 컬러 사이클링, 팔레트 스왑
- `linear-space-blending`: 감마 보정 블렌딩 (sRGB vs 선형 공간)
- `premultiplied-alpha`: 프리멀티플라이드 알파 vs 스트레이트 알파
- `normal-mapped-sprites`: 2D 노멀맵 라이팅
- `visibility-polygon`: 2D 시야 다각형 (끝점 레이캐스팅)
- `bloom-mip-chain`: 블룸 (Threshold + 다운샘플 체인)
- `blur-kernels`: 블러 커널 비교 (Box, Gaussian, Kawase, Dual)
- `tonemap-operators`: 톤 매핑 연산자 (Clamp, Reinhard, Filmic, ACES)
- `pixel-perfect-scaling`: 픽셀 퍼펙트 스케일링 (정수 배율, Sharp Bilinear)
- `sdf-shapes`: SDF 렌더링 (거리장 텍스처)
- `sprite-batching`: 스프라이트 배칭 & 드로우 콜
- `crt-postfx`: CRT 포스트 프로세스

### 3D 렌더링 (14)
- `texture-filtering`: 텍스처 필터링 & 밉맵
- `shading-models`: 셰이딩 모델 (Flat, Gouraud, Phong, Blinn-Phong)
- `pbr-vs-blinn`: PBR (Cook-Torrance GGX) vs Blinn-Phong
- `normal-mapping`: 노멀 매핑 & 패럴랙스 매핑
- `shadow-mapping`: 섀도 매핑 (Hard, PCF, PCSS)
- `gamma-tonemapping`: 선형 워크플로 & 톤매핑
- `toon-outline`: 툰 셰이딩 & 인버티드 헐 아웃라인
- `fresnel-rim`: 프레넬 반사 & 림 라이트
- `fog`: 안개 (Linear, Exp, Exp², 높이 안개)
- `frustum-culling-lod`: 프러스텀 컬링 & LOD
- `depth-precision`: 깊이 정밀도 & Z-파이팅 (Reversed-Z, 로그 깊이)
- `overdraw`: 오버드로 줄이기 (백페이스 컬링, 정렬, Z-프리패스)
- `instancing`: 인스턴싱 vs 개별 드로우 콜
- `ssao`: SSAO (스크린 스페이스 앰비언트 오클루전)

### 네트워크 & 멀티플레이 (10)
- `client-prediction`: 클라이언트 측 예측 (Client-side Prediction)
- `server-reconciliation`: 서버 재조정 (Server Reconciliation)
- `entity-interpolation`: 엔티티 보간 (Entity Interpolation)
- `dead-reckoning`: 데드 레커닝 / 외삽 (Dead Reckoning)
- `lag-compensation`: 랙 보상 (Lag Compensation)
- `tick-send-rate`: 틱레이트 & 전송률 (Tick / Send Rate)
- `jitter-buffer`: 지터 버퍼 (Jitter Buffer)
- `delta-compression`: 델타 압축 & 양자화
- `rollback-netcode`: 롤백 넷코드 vs 딜레이 기반 (GGPO)
- `interest-management`: 관심 영역 관리 (AOI)
