# WorldLayer – EnemySpawner

## Overview
- Điều phối việc sinh enemy theo wave, objective, alert level.
- Hỗ trợ spawn script cho contract (story) và endless mode.

## Responsibilities
- Theo dõi thời gian, queue wave event.
- Chọn loại enemy dựa vào stage, difficulty, alert.
- Tìm vị trí spawn hợp lệ (navmesh).
- Emit event cho sự kiện spawn (HUD, audio, analytics).

## Core Structure
```
class EnemySpawner {
  constructor(scene, enemyFactory, navMeshService, difficultyModifier)
  init(config: SpawnerConfig)
  scheduleWave(waveDefinition)
  spawnEnemy(type, position, extraConfig?)
  update(delta)
  clear()
}
```

### SpawnerConfig
- `stageId`
- `baseSpawnInterval`
- `waveDefinitions` (list of `WaveDefinition`)
- `reinfDefinition` for alert triggered waves
- `maxEnemiesActive`

### WaveDefinition
```
{
  id: string,
  delay: number,
  composition: { type: EnemyType, count: number }[],
  spawnMode: 'cluster'|'spread'|'scripted',
  spawnRadius?: number,
  script?: ScriptedEvent[],
}
```

## Update Loop
```
update(delta) {
  timer += delta
  while (queue.peek() && queue.peek().time <= timer) {
    const wave = queue.pop()
    spawnWave(wave)
  }
  // Optionally check objective triggers
}
```

## SpawnWave Logic
```
function spawnWave(def) {
  for each composition:
    for i in [1..count]
      const spawnPos = pickSpawnPosition(def.spawnMode)
      const enemy = enemyFactory.create(type, spawnPos)
      applyDifficulty(enemy)
      enemyGroup.add(enemy)
  emit WaveSpawn event (for HUD)
}
```

### pickSpawnPosition(mode)
- `cluster`: spawn around player radius ± random angle.
- `spread`: choose random navmesh polygon far from player.
- `scripted`: use predefined coordinates from stage.
- Validate position via `navMeshService.isLocationInNavMesh` & `mapManager.isLocationEmpty`.

## Alert Integration
- `AlertSystem` emits `AlertEvent.LEVEL_CHANGE(level)`.
- When `level >= threshold` → schedule reinforcement wave (`reinfDefinition`).
- For "Legend" difficulty, reduce delay between reinforcement.

## Endless Mode
- Start with baseline wave composition.
- Each cycle increases `DifficultyModifier` and adds new enemy types.
- Control spawn interval via formula: `interval = baseInterval * pow(0.95, waveIndex)`.

## Scripted Events
- For contract scenarios: `ScriptedEvent`s such as spawn boss when objective step reached.
- Format: `trigger: 'objectiveCompleted', objectiveId`, `actions: spawn enemy, play VO`.

## Events
- `onWaveScheduled` `{ waveId, time }`.
- `onWaveSpawned` `{ waveId, enemyCount }`.
- `onEnemySpawned` `{ enemyType, position }`.
- `onEnemyKilled` forwarded from `EnemyGroup`.

## Performance Considerations
- Cap active enemy (if more than `maxEnemiesActive`, delay further spawn).
- Use pool in `enemyFactory`.
- Avoid spawn all at same frame → use jitter (spawn per 50ms).

## Testing Checklist
- Schedule -> spawn at correct time.
- Alert triggered wave occurs when expected.
- Position valid (not stuck in walls).
- Endless scaling (verify interval & composition growth).
- Scripted event triggers exactly once.
