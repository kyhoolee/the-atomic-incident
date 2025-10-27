# Core Enemy Components Library

## Overview
Bộ trait/component reuse cho tất cả kẻ địch. Mỗi component implement interface `EnemyComponent` với lifecycle `init`, `update`, `handleEvent`, `destroy`. Có thể mix nhiều component để tạo ra hành vi phức tạp.

## Interface
```ts
interface EnemyComponent {
  init(enemy: Enemy): void;
  update(enemy: Enemy, delta: number): void;
  handleEvent?(enemy: Enemy, event: EnemyEvent): void;
  destroy(): void;
}
```

## Component Catalogue

### 1. TargetingComponent
- **Purpose:** Di chuyển enemy về phía player hoặc waypoint.
- **Dependencies:** `NavMeshService`, `PhysicsAdapter`, `DifficultyModifier`.
- **Config:**
  - `speed`: base movement speed (units/s).
  - `visionRadius`: khoảng cách phát hiện player.
  - `separationRadius`: tránh đồng minh.
- **Update Flow:**
  1. Query player position.
  2. Nếu player ngoài vision → idle/patrol.
  3. Ngược lại, tìm đường qua navmesh; velocity = mix path vector + separation vector.
  4. Apply to physics body.

### 2. PatrolComponent
- **Purpose:** Di chuyển tuần tra theo waypoint khi chưa alert.
- **Config:**
  - `patrolPoints: Phaser.Math.Vector2[]`.
  - `pauseDuration` between points.
- **Logic:** follow path circular, can be interrupted by `EnemyEvent.ALERT`.

### 3. DashAttackComponent
- **Purpose:** Charge tốc độ cao vào player.
- **States:** `FOLLOWING → CHARGE_UP → DASHING → RECOVER`.
- **Parameters:** `chargeTime`, `dashSpeed`, `dashDuration`, `cooldown`.
- **Events:**
  - `handleEvent(ALERT_HIGH)` -> trigger charge.
  - `handleEvent(TAKE_DAMAGE)` -> optionally cancel charge.
- **Collision:** On hitting player/wall call `CollisionResolver.enemyDashImpact`.

### 4. ProjectileAttackComponent
- **Purpose:** Bắn đạn từ khoảng cách xa.
- **Config:**
  - `fireRate` (shots/min), `burstCount`, `burstInterval`.
  - `projectileType` (homing, laser...).
- **Logic:** use `ProjectileManager.spawnProjectile` when timer ready and player visible.

### 5. DetectionComponent
- **Purpose:** Xác định trạng thái alert/stealth.
- **Inputs:** player position, lighting, noise events.
- **Outputs:** emits `EnemyEvent.ALERT_LEVEL_CHANGE(level)` → feed AlertSystem.
- **Config:** `fovAngle`, `fovRange`, `lightSensitivity`.
- **Extra:** handshake với OverlayLayer để vẽ cone nếu debug.

### 6. SplitOnDeathComponent
- **Purpose:** Khi chết spawn enemy nhỏ hơn.
- **Config:** `spawnType`, `countRange`, `spawnOffset`.
- **Logic:** On `EnemyEvent.DEAD` → call `enemySpawner.spawnEnemy`.

### 7. BossDashComponent (Juggernaut)
- **Purpose:** Hành vi boss phức tạp: dash + stun + enraged.
- **States:** `FOLLOWING`, `CHARGING`, `DASHING`, `STUNNED`, `ENRAGED`.
- **Special:** Phản ứng khi trúng EMP (enter stunned). After stun -> enraged (speed up).

### 8. ShieldComponent
- **Purpose:** Bảo vệ enemy từ hướng cụ thể.
- **Config:** `arcAngle`, `durability`.
- **Logic:** Blocks projectile within angle; degrade durability; on break emit event (play animation).

### 9. DroneHoverComponent
- **Purpose:** Cho enemy bay (drone).
- **Logic:** Bobbing motion, height adjustments, cast spotlight (lighting integration).

### 10. AbilityHooksComponent
- **Purpose:** Hook dynamic ability (ex: EMP immunity, stealth detection).
- **Use:** pass `AbilityEffectEvent` from player to enemy.

## Event Enumeration
```
type EnemyEvent =
  | { type: 'SPAWNED' }
  | { type: 'ALERT_LEVEL_CHANGE'; level: number }
  | { type: 'TAKE_DAMAGE'; amount: number; source: any }
  | { type: 'TARGET_LOST' }
  | { type: 'KNOCKBACK'; vector: Phaser.Math.Vector2 }
  | { type: 'EMP_HIT' }
  | { type: 'DEAD' };
```

## Component Composition Examples
- **Sentry Drone:** `TargetingComponent (hover) + DetectionComponent (high sensitivity) + ProjectileAttackComponent (laser)`.
- **Shield Guard:** `TargetingComponent + ShieldComponent + MeleeAttackComponent` (noted to implement) + DetectionComponent (medium range).
- **Dividing Slime:** `TargetingComponent + SplitOnDeathComponent + DetectionComponent (low range)`.
- **Boss Juggernaut:** `TargetingComponent + BossDashComponent + ShieldComponent (rear) + AbilityHooksComponent`.

## Testing Guidelines
- Unit test each component in isolation with stub `Enemy`.
- Integration test combos (dash + detection) to avoid conflicting states.
- Ensure components unsubscribed/destroyed properly on enemy death to prevent leaks.
