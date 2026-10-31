// 카테고리 매니페스트. 샘플을 추가하면 samples 배열에 한 줄 추가.
// { id, level(1 입문, 2 초급, 3 중급, 4 고급), title, tags: [...], added: 'YYYY-MM-DD' }, 파일은 samples/audio/<id>.js
GTL.category({
  id: 'audio',
  title: '오디오',
  en: 'Audio',
  icon: '🔊',
  order: 10,
  samples: [
    { id: 'distance-attenuation', level: 1, title: '거리 감쇠 곡선 (Rolloff)', en: 'Distance Attenuation Curves (Rolloff)', tags: ['3d audio', 'attenuation', 'rolloff', 'distance'], added: '2026-11-01' },
    { id: 'sound-variation', level: 1, title: '반복 피로 줄이기 (랜덤화 & 변형 풀)', en: 'Reducing Repetition Fatigue (Randomization & Variation Pools)', tags: ['variation', 'randomization', 'round robin', 'shuffle'], added: '2026-11-01' },
    { id: 'ducking', level: 1, title: '덕킹 (Ducking)', en: 'Ducking', tags: ['mixing', 'ducking', 'sidechain', 'dialogue'], added: '2026-11-01' },
    { id: 'doppler', level: 2, title: '도플러 효과 (Doppler)', en: 'Doppler Effect', tags: ['3d audio', 'doppler', 'pitch', 'velocity'], added: '2026-11-01' },
    { id: 'voice-limit', level: 2, title: '보이스 제한 & 가상화', en: 'Voice Limits & Virtualization', tags: ['voice management', 'priority', 'virtual voice', 'mixing'], added: '2026-11-01' },
    { id: 'reverb-zones', level: 2, title: '잔향 영역 (Unity Reverb Zone, Unreal Audio Volume)', en: 'Reverb Zones (Unity Reverb Zone, Unreal Audio Volume)', tags: ['unity', 'unreal', 'reverb', 'reverb zone', 'audio volume', 'lowpass', 'convolver'], added: '2026-11-01' },
    { id: 'occlusion', level: 3, title: '차폐 (Occlusion) 레이캐스트', en: 'Occlusion Raycasts', tags: ['3d audio', 'occlusion', 'raycast', 'lowpass'], added: '2026-11-01' },
    { id: 'audio-scheduling', level: 3, title: '오디오 스케줄링 (Lookahead)', en: 'Audio Scheduling (Lookahead)', tags: ['timing', 'scheduling', 'lookahead', 'web audio'], added: '2026-11-01' },
  ],
});
