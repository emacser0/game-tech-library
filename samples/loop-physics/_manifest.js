// 카테고리 매니페스트. 샘플을 추가하면 samples 배열에 한 줄 추가함.
// { id, level(1 입문, 2 초급, 3 중급, 4 고급), title, tags: [...], added: 'YYYY-MM-DD' }, 파일은 samples/loop-physics/<id>.js
GTL.category({
  id: 'loop-physics',
  title: '게임 루프 & 물리',
  en: 'Game Loop & Physics',
  icon: '⏱',
  order: 1,
  samples: [
    { id: 'fixed-timestep', level: 2, title: '고정 타임스텝 & 렌더 보간', en: 'Fixed Timestep & Render Interpolation', tags: ['game loop', 'timestep', 'interpolation', 'determinism'], added: '2026-10-31' },
    { id: 'physics-integrators', level: 3, title: '수치 적분기 비교 (Euler, Verlet, RK4)', en: 'Numerical Integrators (Euler, Verlet, RK4)', tags: ['integrator', 'euler', 'verlet', 'rk4', 'symplectic', 'energy'], added: '2026-10-31' },
    { id: 'ccd-tunneling', level: 3, title: '터널링 & 연속 충돌 감지 (CCD)', en: 'Tunneling & Continuous Collision Detection (CCD)', tags: ['ccd', 'tunneling', 'toi', 'swept', 'collision'], added: '2026-10-31' },
    { id: 'physics-substepping', level: 2, title: '서브스텝 & 강성 스프링 안정성', en: 'Substepping & Stiff Spring Stability', tags: ['substepping', 'stiffness', 'stability', 'spring', 'chain'], added: '2026-10-31' },
    { id: 'spring-damper', level: 2, title: '감쇠 스프링 & 임계 감쇠 (SmoothDamp)', en: 'Damped Spring & Critical Damping (SmoothDamp)', tags: ['spring', 'damping', 'smoothdamp', 'lerp', 'camera follow'], added: '2026-10-31' },
    { id: 'pbd-cloth', level: 3, title: 'Verlet 천 & 제약 반복 횟수 (PBD)', en: 'Verlet Cloth & Constraint Iterations (PBD)', tags: ['verlet', 'cloth', 'pbd', 'constraints', 'iterations', 'tearing'], added: '2026-10-31' },
    { id: 'material-combine', level: 2, title: '반발 & 마찰 결합 모드 (Combine Mode)', en: 'Restitution & Friction Combine Modes', tags: ['restitution', 'friction', 'physics material', 'combine mode'], added: '2026-10-31' },
    { id: 'stacking-solver', level: 4, title: '상자 쌓기 & 솔버 반복 / Warm Starting', en: 'Box Stacking & Solver Iterations / Warm Starting', tags: ['sequential impulses', 'solver', 'warm starting', 'stacking', 'baumgarte'], added: '2026-10-31' },
    { id: 'framerate-independent-damping', level: 1, title: '프레임레이트 독립 감쇠 (lerp vs damp)', en: 'Frame-Rate Independent Damping (lerp vs damp)', tags: ['lerp', 'damping', 'delta time', 'frame rate', 'smoothing'], added: '2026-10-31' },
    { id: 'sleeping-islands', level: 4, title: '슬립 & 시뮬레이션 아일랜드', en: 'Sleeping & Simulation Islands', tags: ['sleeping', 'islands', 'optimization', 'broadphase', 'rigid body'], added: '2026-10-31' },
    { id: 'fixed-point-determinism', level: 4, title: '결정론: 부동소수점 vs 고정소수점', en: 'Determinism: Floating Point vs Fixed Point', tags: ['determinism', 'fixed point', 'floating point', 'lockstep', 'chaos'], added: '2026-10-31' },
    { id: 'jump-arc-design', level: 1, title: '점프 파라미터 설계 (높이, 정점 시간 역산)', en: 'Jump Parameter Design (Solve from Height and Apex Time)', tags: ['jump', 'gravity', 'apex', 'platformer', 'tuning'], added: '2026-11-01' },
    { id: 'time-scale-slowmo', level: 2, title: '타임 스케일 & 슬로모션', en: 'Time Scale & Slow Motion', tags: ['time scale', 'slow motion', 'bullet time', 'fixed timestep', 'interpolation'], added: '2026-11-01' },
    { id: 'xpbd-compliance', level: 4, title: 'XPBD vs PBD: 반복 횟수와 강성', en: 'XPBD vs PBD: Iterations and Stiffness', tags: ['xpbd', 'pbd', 'compliance', 'constraints', 'iterations', 'stiffness'], added: '2026-11-01' },
    { id: 'soft-step-solver', level: 4, title: '소프트 스텝 & 소프트 제약 (Box2D v3)', en: 'Soft Step & Soft Constraints (Box2D v3)', tags: ['soft step', 'soft constraints', 'substepping', 'baumgarte', 'box2d', 'mass ratio'], added: '2026-11-01' },
    { id: 'buoyancy-drag', level: 2, title: '부력 & 항력 (잠긴 부피 비례)', en: 'Buoyancy & Drag (Submerged Volume)', tags: ['buoyancy', 'drag', 'water', 'archimedes', 'damping'], added: '2026-11-01' },
    { id: 'contact-impulse-response', level: 2, title: '충돌 응답: 위치 보정 vs 임펄스', en: 'Collision Response: Position Fix vs Impulse', tags: ['collision response', 'impulse', 'restitution', 'momentum', 'penetration'], added: '2026-11-01' },
    { id: 'pd-joint-drive', level: 3, title: 'PD 관절 드라이브 (Physical Animation, Slerp Drive)', en: 'PD Joint Drive (Physical Animation, Slerp Drive)', tags: ['unreal', 'unity', 'physical animation', 'pd controller', 'joint drive', 'ragdoll', 'hit reaction'], added: '2026-11-01' },
  ],
});
