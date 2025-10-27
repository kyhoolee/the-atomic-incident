# ContractScene (Main Game) Design

## 1. Responsibility
- Quản lý gameplay core: spawn enemy, điều khiển player, xử lý objective, HUD, lighting, audio.
- Đồng bộ với `gameStore` (state pause, score), `preferencesStore` (volume, shadow opacity).
- Khi contract hoàn thành/thất bại → chuyển sang GameOverScene hoặc StageSummary.

## 2. Scene Layer Tree
```
ContractScene
 ├─ BackgroundLayer (MapGroup)
 │   ├─ TilemapLayer: bg
 │   ├─ TilemapLayer: mid/decor
 │   └─ StaticProps (non-colliding)
 ├─ WorldLayer
 │   ├─ LightingMask (RenderTexture / adapter)
 │   ├─ EnemyGroup (Phaser.Group)
 │   ├─ PickupGroup
 │   ├─ ProjectileGroup_Player
 │   ├─ ProjectileGroup_Enemy
 │   ├─ PlayerGroup (player + attached components)
 │   └─ FXGroup (particles)
 ├─ OverlayLayer
 │   ├─ ObjectiveMarkers (icons, arrows)
 │   ├─ AlertConeIndicators
 │   └─ WarningText (alarm, new wave)
 ├─ HUDLayer (fixedToCamera)
 │   ├─ ScoreComboPanel
 │   ├─ ObjectivePanel
 │   ├─ AlertMeter
 │   ├─ AgentPanel (portrait, light bar, ability cooldown)
 │   ├─ WeaponPanel (ammo, dash bar)
 │   ├─ GadgetPanel (buttons)
 │   ├─ RadarMiniMap
 │   ├─ ToastQueue (combo, new weapon)
 │   └─ PauseButton / TouchControls (mobile)
 └─ DebugLayer (toggleable)
     ├─ HitboxGraphics
     ├─ NavMeshDebug
     └─ LightingDebug
```

## 3. Key Game Objects & Logic
### 3.1 Player (class `PlayerAgent`)
- Composition: `Phaser.GameObjects.Sprite` + `MovementController` + `WeaponManager` + `AbilityController`.
- Handles events:
  - `InputAdapter.onMoveDirection` → update movement.
  - `InputAdapter.onAim` → rotate sprite, aim weapon.
  - `InputAdapter.onFire` → `WeaponManager.fire(angle)`.
  - `InputAdapter.onDash` → `MovementController.dash()`.
  - Ability triggers (slide, parry, stealth) via `AbilityController`.
- Emits signals:
  - `onDamage`, `onDeath`, `onWeaponChange`, `onAbilityUsed`.
- Interactions:
  - `PhysicsAdapter` bodies for collision.
  - `LightingAdapter` to update player light radius.

### 3.2 EnemyGroup & Enemy Entities
- `EnemyGroup` manages lifecycle; listens to `EnemySpawner` events.
- Each `Enemy` has components:
  - `TargetingComponent.update()` → pathfinding, separation.
  - `AttackComponent` (dash/projectile/melee).
  - `DetectionComponent` → interacts with alert meter, sets enemy state.
- Enemy events:
  - `onSpawn`, `onDeath`, `onAlert`, `onHit`.
- Stats scaling via `DifficultyModifier`.

### 3.3 EnemySpawner
- Maintains schedule queue: normal waves, reinforcement, boss.
- Input: `ObjectiveSystem` (requests spawn type), `AlertSystem`.
- Output: spawn enemy type, position (via navmesh, spawn markers), optionally play spawn animation.

### 3.4 ObjectiveSystem
- Implements interface `IObjective` (mission-specific). Examples:
  - `AssassinationObjective`: track target health, spawn guards when alarm triggered.
  - `SabotageObjective`: require planting charges, defend until timer.
  - `ExtractionObjective`: move to exit zone; spawn obstacles.
- Emits `onProgressUpdate`, `onCompleted`, `onFailed`.

### 3.5 AlertSystem
- Tracks stealth vs alert level.
- Input: enemy detection events, player actions (gunfire, alarm triggers).
- Output: modifies `DifficultyModifier`, triggers reinforcement wave, updates HUD meter.

### 3.6 PickupManager
- Spawns energy, weapon crate, gadget drop.
- `Pickup.onCollect(player)` → apply effect (light radius, weapon switch, gadget inventory).

### 3.7 Projectile Systems
- Player projectiles (slug, scattershot, etc.) in `ProjectileGroup_Player`.
- Enemy projectiles in `ProjectileGroup_Enemy`.
- `ProjectileBehavior` defines movement: linear, bounce, homing.
- Collision resolution via `PhysicsAdapter` → call `CollisionResolver` (apply damage, spawn FX).

### 3.8 LightingSystem
- Wrapper around `LightingAdapter`.
- For each light (player, static lamps) maintain handle.
- Update order: before render – compute occlusion; after physics – update positions.
- Provide API `isPointVisible(point)` for radar/objective markers.

### 3.9 HUD Components
- `ScoreComboPanel` listens to `gameStore.score`, `comboManager` events.
- `AgentPanel` reads `playerAgent` state (light radius, ability cooldown).
- `AlertMeter` subscribes `AlertSystem`.
- `RadarMiniMap` renders icons for enemies outside light.
- `ToastQueue` displays text (weapon pickup, high score). Auto fade.
- Mobile: `TouchController` overlay (joystick, ability buttons), propagate events to `InputAdapter`.

### 3.10 Pause & GameOver Logic
- `PauseSystem.toggle()` → freeze physics, pause timers, show pause menu.
- On objective complete/fail → show `StageSummaryPanel` (score, rating, rewards), button to Continue/Retry.

## 4. Update Cycle
```
update(time, delta):
  InputAdapter.poll()
  if gameStore.isPaused → return
  MovementController.update(delta)
  AbilityController.update(delta)
  EnemyGroup.update(delta)
  ProjectileManager.update(delta)
  ObjectiveSystem.update(delta)
  AlertSystem.update(delta)
  LightingSystem.update(delta)
  FXGroup.update(delta)
  HUDLayer.update(delta)
```
- Scene `preUpdate`: align camera to player, update parallax.
- Scene `postUpdate`: finalize lighting render, HUD, debug overlays.

## 5. Event Flow Examples
- **Player shoots:** Input → WeaponManager.fire → create projectile → Physics collisions apply damage → Score increments → HUD update.
- **Enemy detects player:** DetectionComponent triggers AlertSystem → HUD alert meter rises → EnemySpawner schedule reinforcement.
- **Objective complete:** ObjectiveSystem emits completed → Pause gameplay → StageSummary panel → on confirm `scene.start('MenuScene', summaryData)`.

## 6. Subsystems
- `ComboManager`: track kill streak, decay on timeout/damage.
- `GadgetInventory`: manage player gadgets, cooldown.
- `AnalyticsTracker`: hook events (contract start, objective complete, death cause).

## 7. Debug Tools
- `DebugOverlay` toggled by dev key (`U`): show navmesh, light rays, physics bodies.
- `BenchmarkOverlay`: display FPS, CPU/GPU times, active count of enemies/projectiles.

## 8. Future Extensions
- Co-op support: instantiate 2nd player group with shared HUD modifications.
- Dynamic weather/lighting (rain, flickering lights).
- Replay capture (record events for highlight).
