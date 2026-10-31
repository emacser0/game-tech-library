// 카테고리 매니페스트. 샘플을 추가하면 samples 배열에 한 줄 추가.
// { id, level(1 입문, 2 초급, 3 중급, 4 고급), title, tags: [...], added: 'YYYY-MM-DD' }, 파일은 samples/ui-systems/<id>.js
GTL.category({
  id: 'ui-systems',
  title: 'UI & 게임 시스템',
  en: 'UI & Game Systems',
  icon: '🧩',
  order: 11,
  samples: [
    { id: 'nine-slice', level: 1, title: '9-슬라이스 스케일링', en: '9-Slice Scaling', tags: ['9-slice', '9-patch', 'UI panel', 'sprite'], added: '2026-11-01' },
    { id: 'anchor-safe-area', level: 1, title: '앵커 & 세이프 에어리어', en: 'Anchors & Safe Area', tags: ['anchor', 'safe area', 'notch', 'aspect ratio', 'layout'], added: '2026-11-01' },
    { id: 'text-overflow', level: 1, title: '텍스트 넘침 처리: 번역 문자열과 자동 축소', en: 'Text Overflow: Translated Strings and Auto Size', tags: ['localization', 'text wrap', 'auto size', 'pseudo-localization'], added: '2026-11-01' },
    { id: 'list-virtualization', level: 2, title: '목록 가상화: 1만 개 항목 스크롤', en: 'List Virtualization: Scrolling 10,000 Items', tags: ['virtualization', 'scroll view', 'binary search', 'UI performance'], added: '2026-11-01' },
    { id: 'command-undo', level: 2, title: '커맨드 패턴: 실행 취소, 다시 실행, 리플레이', en: 'Command Pattern: Undo, Redo, Replay', tags: ['command pattern', 'undo', 'redo', 'replay'], added: '2026-11-01' },
    { id: 'event-queue', level: 2, title: '이벤트 큐: 즉시 호출 vs 지연 처리', en: 'Event Queue: Immediate Call vs Deferred', tags: ['event queue', 'observer', 'reentrancy', 'deferred'], added: '2026-11-01' },
    { id: 'hfsm-pushdown', level: 3, title: '계층형 상태 기계 & 상태 스택 vs 평면 FSM', en: 'Hierarchical State Machine & State Stack vs Flat FSM', tags: ['HFSM', 'pushdown automata', 'state machine', 'pause menu'], added: '2026-11-01' },
    { id: 'save-versioning', level: 3, title: '세이브 데이터 버전 관리 & 마이그레이션', en: 'Save Data Versioning & Migration', tags: ['save data', 'serialization', 'schema migration', 'versioning'], added: '2026-11-01' },
    { id: 'canvas-dirty-rebuild', level: 2, title: '캔버스 다시 만들기와 하위 캔버스 분리 (uGUI Canvas, UMG Invalidation)', en: 'Canvas Rebuild and Sub-Canvas Split (uGUI Canvas, UMG Invalidation)', tags: ['unity', 'unreal', 'uGUI', 'UMG', 'canvas rebuild', 'dirty flag', 'UI performance'], added: '2026-11-01' },
    { id: 'attribute-modifiers', level: 2, title: '능력치 수정자 집계 (Unreal GAS Attribute, Gameplay Effect)', en: 'Attribute Modifier Aggregation (Unreal GAS Attribute, Gameplay Effect)', tags: ['unreal', 'GAS', 'gameplay ability system', 'attribute', 'modifier', 'buff', 'stat'], added: '2026-11-01' },
  ],
});
