# ContractScene – WorldLayer Detail

## Purpose
- Chứa tất cả game object động: player, enemy, projectile, pickup, FX, lighting mask.
- Tổ chức theo group để quản lý update, collision, render order.

## Structure
```
WorldLayer
 ├─ LightingMaskContainer
 │   └─ LightingAdapter (render texture / pipeline)
 ├─ PlayerGroup
 │   └─ PlayerAgent (sprite + controllers)
 ├─ EnemyGroup
 │   ├─ Enemy (var types)
 │   └─ DeathParticles
 ├─ AllyGroup (future co-op / NPC)
 ├─ ProjectileGroup_Player
 ├─ ProjectileGroup_Enemy
 ├─ PickupGroup
 ├─ FXGroup (temporary effects)
 └─ DecalGroup (blood splatter, bullet holes)
```

## Component Details
### 1. LightingMaskContainer
- Depth slightly above top of world objects but below HUD.
- Holds render texture updated each frame (`LightingAdapter.update`).
- Receives walls data from BackgroundLayer.

### 2. PlayerGroup
- Contains `PlayerAgent` sprite plus attachments:
  - `PlayerLight` (light radius handle) not visible but updates lighting.
  - `EngineTrailEmitter` (SmokeTrail).
  - `GadgetEffect` (if active e.g., shield bubble).
- `PlayerAgent` interacts with physics adapter for collisions.

### 3. EnemyGroup
- Spawns via `EnemySpawner`.
- Each `Enemy` has child components (health bar maybe in overlay).
- On death: spawn `DeathParticles`, drop `EnergyPickup` (added to PickupGroup).

### 4. Projectile Groups
- Player vs Enemy separate for collision filtering.
- Each projectile registers with physics for movement & collision.
- Use object pool for reuse.

### 5. PickupGroup
- Items: `EnergyPickup`, `WeaponCrate`, `GadgetDrop`.
- Update: magnet behavior, lifetime countdown.

### 6. FXGroup
- Contains ephemeral effects (muzzle flash, impact burst, EMP wave).
- Usually auto destroy after animation.

### 7. DecalGroup
- Bullet holes, blood splatter (sprites with low alpha, depth on floor).
- Limit count to avoid overdraw.

## Update Flow
```
WorldLayer.update(delta):
  physicsAdapter.update(delta)
  playerAgent.update(delta)
  enemyGroup.children.each(update)
  projectileGroups.update(delta)
  pickupGroup.update(delta)
  fxGroup.update(delta)
  lightingSystem.update(delta)
```
- Order: physics → AI → projectiles → pickups → lighting (ensures positions final before occlusion).

## Event Hooks
- `PlayerAgent.onDamage` → spawn FX in FXGroup, update HUD.
- `Enemy.onDeath` → create pickups in PickupGroup.
- `Projectile.onCollide` → spawn decal/FX.

## Performance
- Use `Phaser.Structs.List` iteration for groups.
- Cap projectile count (pool size) to avoid free-floating objects.
- Lighting: limit number of dynamic lights (player + optional static). If more needed, implement LOD.

## Extension Points
- Co-op: add `PlayerGroup2` under same LightingMask.
- Cinematics: attach `CameraFocusTarget` to group.
