// 카테고리 매니페스트. 샘플을 추가하면 samples 배열에 한 줄 추가.
// { id, level(1 입문, 2 초급, 3 중급, 4 고급), title, tags: [...], added: 'YYYY-MM-DD' }. 파일은 samples/network/<id>.js
GTL.category({
  id: 'network',
  title: '네트워크 & 멀티플레이',
  en: 'Networking & Multiplayer',
  icon: '📡',
  order: 9,
  samples: [
    { id: 'client-prediction', level: 3, title: '클라이언트 측 예측 (Client-side Prediction)', en: 'Client-side Prediction', tags: ['prediction', 'latency', 'authoritative server', 'input'], added: '2026-10-31' },
    { id: 'server-reconciliation', level: 3, title: '서버 재조정 (Server Reconciliation)', en: 'Server Reconciliation', tags: ['reconciliation', 'prediction', 'rubber-banding', 'smoothing'], added: '2026-10-31' },
    { id: 'entity-interpolation', level: 3, title: '엔티티 보간 (Entity Interpolation)', en: 'Entity Interpolation', tags: ['interpolation', 'snapshot', 'render delay', 'jitter'], added: '2026-10-31' },
    { id: 'dead-reckoning', level: 3, title: '데드 레커닝 / 외삽 (Dead Reckoning)', en: 'Dead Reckoning (Extrapolation)', tags: ['dead reckoning', 'extrapolation', 'smoothing', 'DIS'], added: '2026-10-31' },
    { id: 'lag-compensation', level: 4, title: '랙 보상 (Lag Compensation)', en: 'Lag Compensation', tags: ['lag compensation', 'rewind', 'hitscan', 'favor the shooter'], added: '2026-10-31' },
    { id: 'tick-send-rate', level: 2, title: '틱레이트 & 전송률 (Tick / Send Rate)', en: 'Tick Rate & Send Rate', tags: ['tickrate', 'update rate', 'bandwidth', 'interpolation'], added: '2026-10-31' },
    { id: 'jitter-buffer', level: 3, title: '지터 버퍼 (Jitter Buffer)', en: 'Jitter Buffer', tags: ['jitter', 'playout buffer', 'latency', 'RTP'], added: '2026-10-31' },
    { id: 'delta-compression', level: 3, title: '델타 압축 & 양자화', en: 'Delta Compression & Quantization', tags: ['delta compression', 'quantization', 'bandwidth', 'snapshot'], added: '2026-10-31' },
    { id: 'rollback-netcode', level: 4, title: '롤백 넷코드 vs 딜레이 기반 (GGPO)', en: 'Rollback Netcode vs Delay-based (GGPO)', tags: ['rollback', 'GGPO', 'lockstep', 'input delay', 'fighting game'], added: '2026-10-31' },
    { id: 'interest-management', level: 3, title: '관심 영역 관리 (AOI)', en: 'Interest Management (AOI)', tags: ['interest management', 'AOI', 'relevancy', 'bandwidth', 'MMO'], added: '2026-10-31' },
    { id: 'ping-display', level: 1, title: '핑 표시 (순간 RTT vs 평균 vs 지터)', en: 'Ping Display (Instant RTT vs Average vs Jitter)', tags: ['ping', 'RTT', 'EWMA', 'jitter', 'HUD'], added: '2026-11-01' },
    { id: 'event-vs-state', level: 2, title: '이벤트 복제 vs 상태 복제', en: 'Event Replication vs State Replication', tags: ['replication', 'event', 'state sync', 'packet loss', 'RPC'], added: '2026-11-01' },
    { id: 'reliability-ack', level: 3, title: '신뢰성 계층 (Ack 비트필드 + 재전송)', en: 'Reliability Layer (Ack Bitfield + Resend)', tags: ['reliability', 'ack', 'UDP', 'retransmission', 'ordering'], added: '2026-11-01' },
    { id: 'clock-sync', level: 3, title: '시계 동기화 (NTP 방식)', en: 'Clock Sync (NTP Style)', tags: ['clock sync', 'NTP', 'RTT', 'server time', 'drift'], added: '2026-11-01' },
    { id: 'priority-accumulator', level: 3, title: '우선순위 누적기 (Priority Accumulator)', en: 'Priority Accumulator', tags: ['priority', 'bandwidth', 'state sync', 'round robin', 'MTU'], added: '2026-11-01' },
    { id: 'lockstep-checksum', level: 4, title: '락스텝 디싱크 감지 (체크섬)', en: 'Lockstep Desync Detection (Checksum)', tags: ['lockstep', 'determinism', 'desync', 'checksum', 'RTS', 'floating point'], added: '2026-11-01' },
    { id: 'net-dormancy', level: 2, title: '넷 휴면 & 업데이트 빈도 (Unreal Net Dormancy)', en: 'Net Dormancy & Update Frequency (Unreal)', tags: ['unreal', 'dormancy', 'replication', 'NetUpdateFrequency', 'server CPU', 'bandwidth'], added: '2026-11-01' },
    { id: 'net-quantize', level: 2, title: '벡터, 회전 양자화 (Unreal NetQuantize)', en: 'Vector & Rotation Quantization (Unreal NetQuantize)', tags: ['unreal', 'quantization', 'NetQuantize', 'rotator', 'bandwidth', 'precision'], added: '2026-11-01' },
  ],
});
