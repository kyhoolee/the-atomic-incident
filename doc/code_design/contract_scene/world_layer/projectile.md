# WorldLayer – Projectile System

## Overview
- Quản lý toàn bộ projectiles của player & enemy.
- Tối ưu sử dụng object pool, tách logic chuyển động & collision khỏi sprite.

## Core Classes
1. `Projectile` (base class)
2. `ProjectileBehavior` (interface/strategy)
3. `ProjectilePool`
4. `ProjectileManager`

## Projectile Base Class
```
class Projectile extends Phaser.GameObjects.Sprite {
  owner: 'player' | 'enemy'
  damage: number
  speed: number
  lifetime: number
  behavior: ProjectileBehavior
  bodyHandle: PhysicsBodyHandle
  isActive: boolean
}
```

### Properties
| Property | Description |
|----------|-------------|
| `owner` | ai bắn (player/enemy). |
| `damage` | giá trị gây sát thương. |
| `speed` | tốc độ gốc. |
| `direction` | vector hướng bắn. |
| `lifetime` | thời gian tồn tại (ms). |
| `behavior` | strategy (linear, bounce, homing, flame). |
| `effects` | optional (burn DoT, stun). |
| `lightAffinity` | destroy if leave light (player projectile). |

### Methods
- `fire(position, direction, config)` – kích hoạt projectile.
- `update(delta)` – delegate to `behavior.update`.
- `handleCollision(target)` – apply damage, trigger effects, destroy.
- `destroyProjectile()` – return to pool, remove physics.

## ProjectileBehavior Interface
```
interface ProjectileBehavior {
  init(projectile: Projectile, config?: any): void
  update(projectile: Projectile, delta: number): void
  onCollision?(projectile: Projectile, target: any): void
}
```

### Behavior Types
- **LinearBehavior**: Straight line, destroy on collision or lifetime.
- **BounceBehavior**: Uses physics bounce, limit bounce count.
- **HomingBehavior**: Adjust direction toward target (closest enemy). Steering limited by `turnRate`.
- **RocketBehavior**: Acceleration over time, explosion on collision.
- **FlameBehavior**: Short lifespan, random drift, continuous damage zone.
- **ShrapnelBehavior**: Splits into multiple projectiles on lifetime expiry.

## ProjectileManager
- Maintains two pools (player, enemy).
- API:
```
spawnProjectile(owner, type, position, direction, config)
update(delta)
handleCollision(projectile, target)
clear()
```
- Interacts with `PhysicsAdapter` to register bodies.
- Uses `CollisionResolver` to check collision with enemy/player/walls.

## Events
- `onProjectileSpawn` (for analytics, sound).
- `onProjectileDestroy`.
- `onProjectileHit` (emits damage info, effect applied).

## Damage Resolution
```
ProjectileManager.handleCollision(projectile, collider) {
  if (projectile.owner === 'player' && collider instanceof Enemy) {
    collider.takeDamage(projectile.damage, projectile)
  } else if (projectile.owner === 'enemy' && collider instanceof PlayerAgent) {
    playerAgent.takeDamage(projectile.damage, collider)
  }
  if (projectile.behavior.onCollision)
    projectile.behavior.onCollision(projectile, collider)
  spawnHitEffect(projectile.position, projectile.owner)
  projectile.destroyProjectile()
}
```

## Light Interaction
- Player projectile: check `LightingAdapter.isPointInShadow(position)` each update; if true → fade out & destroy.
- Enemy projectile: optional (if ability to shoot through shadows).

## Pooling Strategy
- Pre-create ~50 projectiles per type (configurable).
- On spawn: reuse existing inactive projectile; if none, create new up to max.
- On destroy: reset properties, set visible=false, return to pool.

## Testing Checklist
- Fire rate respect cooldown, multiple projectiles spawn concurrently.
- Bounce: check maximum rebounds, energy loss.
- Homing: target reacquired if current destroyed; obey turnRate.
- Rocket: explosion damage apply to multiple enemies.
- Flame: check DoT application, lifetime.
- Light: projectile leaving light destroyed.
- Performance: 100 projectiles on screen maintain FPS.
