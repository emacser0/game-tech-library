# 백로그

다음에 추가할 샘플 후보. `/update-library`가 조사 결과를 여기에 쌓고, 상위 항목부터 구현.

우선순위:
- **P1**: 업계 표준이고 시각적 차이가 분명함
- **P2**: 유용하지만 단순화가 필요함
- **P3**: 참고용이거나 난이도가 높음

| 제목 | 카테고리 | 출처 | A/B 비교 아이디어 | 우선 | 상태 |
|---|---|---|---|---|---|
| TAA (Temporal Anti-Aliasing) | render3d | Karis, "High Quality Temporal Supersampling", SIGGRAPH 2014 Advances | 없음 vs TAA(지터+히스토리 블렌드+이웃 클램핑); 고스팅 시각화 | P1 | done (2026-11-01, `taa`) |
| 업스케일링: 바이리니어 vs 공간 업스케일(FSR1 EASU/RCAS 유사) | render2d | AMD GPUOpen FidelityFX Super Resolution 1 | 저해상도 렌더 → 업스케일 품질 비교, 렌더 스케일 파라미터 | P1 | done (2026-11-01, `fsr-upscale`) |
| 캐스케이드 섀도 맵 (CSM) | render3d | Microsoft "Cascaded Shadow Maps" (Windows Dev Center), Engel ShaderX5 | 단일 섀도맵 vs 캐스케이드, 분할 방식(log/uniform/PSSM λ) | P1 | done (2026-11-01, `cascaded-shadow-maps`) |
| 클러스터드/타일드 라이트 컬링 | render3d | Olsson et al., "Clustered Deferred and Forward Shading", HPG 2012 | 라이트 수백 개: 전부 계산 vs 타일별 리스트, 히트맵 | P1 | done (2026-11-01, `clustered-light-culling`) |
| 구면 조화(SH) 라이트 프로브 | render3d | Ramamoorthi & Hanrahan, "An Efficient Representation for Irradiance Environment Maps", SIGGRAPH 2001 | 앰비언트 상수 vs SH L1/L2 프로브 보간 | P2 | done (2026-11-01, `sh-light-probes`) |
| 모션 매칭 (Motion Matching) | animation | Clavet, "Motion Matching and The Road to Next-Gen Animation", GDC 2016 (Ubisoft); Unreal 5.4+ Pose Search | 상태머신 블렌딩 vs 2D 단순화 모션 매칭(궤적 특징 검색) | P2 | done (2026-11-01, `motion-matching`) |
| 계층적 길찾기 HPA* | ai | Botea, Müller, Schaeffer, "Near Optimal Hierarchical Path-Finding", 2004 | A* vs HPA* 탐색 노드 수, 클러스터 크기 | P1 | done (2026-11-01, `hpa-star`) |
| 내비메시 + 퍼널 알고리즘 | ai | Mikko Mononen, Recast & Detour; "Simple Stupid Funnel Algorithm" (2010) | 폴리곤 중심 경로 vs 퍼널 경로 | P1 | done (2026-11-01, `navmesh-funnel`) |
| 몬테카를로 트리 탐색 (MCTS) | ai | Browne et al., "A Survey of Monte Carlo Tree Search Methods", 2012 | 미니맥스 깊이 제한 vs MCTS 반복 횟수 (간단한 보드게임) | P3 | todo |
| Box2D v3 Soft Step 솔버 | loop-physics | Erin Catto, "Solver2D" 블로그 (box2d.org, 2024) | PGS vs soft step (sub-stepping + relax): 스택 안정성 | P2 | done (2026-11-01, `soft-step-solver`) |
| XPBD (Extended Position Based Dynamics) | loop-physics | Macklin, Müller, Chentanez, "XPBD", MIG 2016 | PBD(반복 수 의존 강성) vs XPBD(compliance) | P1 | done (2026-11-01, `xpbd-compliance`) |
| 래그돌 & 액티브 래그돌 블렌드 | animation | Euphoria (NaturalMotion), GDC 발표들 | 즉시 래그돌 전환 vs 포즈 매칭 블렌드 | P3 | todo |
| 오디오: 거리 감쇠 곡선 & 도플러 | (신규) audio | Unity AudioSource rolloff, FMOD 문서 | linear vs logarithmic rolloff, 도플러 on/off (WebAudio) | P2 | done (2026-11-01, `distance-attenuation, doppler`) |
| 9-슬라이스 스케일링 | (신규) ui | Unity Sprite Editor 9-slicing 문서 | 단순 스케일 vs 9-slice (모서리 왜곡) | P2 | done (2026-11-01, `nine-slice`) |
| GPU 파티클 (트랜스폼 피드백/텍스처 상태) | render2d | Unity VFX Graph, UE Niagara 문서 | CPU 업데이트 vs GPU 시뮬레이션 (개수, ms) | P2 | done (2026-11-01, `gpu-particles`) |
| Screen-space reflections | render3d | McGuire & Mara, "Efficient GPU Screen-Space Ray Tracing", JCGT 2014 | 반사 없음 vs SSR, 스텝 수/두께 | P3 | todo |
| 블루 노이즈 & 시간적 누적 | render2d | Heitz & Belcour, "Distributing Monte Carlo Errors as a Blue Noise in Screen Space", 2019 | 화이트 노이즈 vs 블루 노이즈 샘플링 | P2 | todo |
| ECS / 아키타입 메모리 레이아웃 | collision | Unity DOTS Entities 문서, Bevy ECS | 객체 지향 업데이트 vs 아키타입 청크 순회 ms | P2 | done (2026-11-01, `ecs-archetype`) |
