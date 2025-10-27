# Projectile Behaviors & Effect Scripts

## Overview
Các script điều khiển quỹ đạo, phân tách, hiệu ứng của từng loại đạn. Mỗi behavior implement interface `ProjectileBehavior` và có thể kết hợp với effect module (DoT, Knockback, Status).

## Behavior Interface
```ts
interface ProjectileBehavior {
  init(projectile: Projectile, config?: any): void;
  update(projectile: Projectile, delta: number): void;
  onCollision?(projectile: Projectile, target: Collider): void;
  onLifetimeEnd?(projectile: Projectile): void;
}
```

## Behavior Catalogue

### 1. LinearBehavior
- **Config:** `speed`, `gravity`, `maxDistance`.
- **Update:** move along direction, apply gravity if set.
- **Collision:** destroy on first hit.

### 2. ScatterShotBehavior
- **Purpose:** shotgun pellet.
- **Init:** randomize direction within spread angle.
- **Update:** same as linear; handles pellet scale shrink.
- **Collision:** no special.

### 3. BouncingBehavior
- **Config:** `bounceCount`, `elasticity`.
- **Update:** rely on physics body bounce; track remaining bounce.
- **Collision:** if hit wall, reduce `bounceCount`; when zero → destroy.
- **Extra:** play SFX on bounce.

### 4. HomingBehavior
- **Config:** `turnRate`, `targetAcquisitionDelay`, `targetRadius`.
- **Update:**
  - After delay, find nearest enemy within radius (or maintain previous target).
  - Adjust direction by `turnRate * delta` toward target.
  - Update velocity accordingly.
- **Collision:** if target destroyed, search new.

### 5. RocketBehavior
- **Config:** `accel`, `maxSpeed`, `explosionRadius`, `explosionDamageFalloff`.
- **Update:** increase speed until max.
- **Collision:** spawn `ExplosionEffect` (AoE damage) + camera shake.

### 6. FlameBehavior
- **Config:** `maxAge`, `driftRange`, `dotDamage`.
- **Update:** random jitter per frame, shrink alpha.
- **Collision:** On contact apply DoT status (burn) -> handled by `StatusEffectSystem`.

### 7. ShrapnelBehavior
- **Purpose:** grenade splitting.
- **Config:** `splitCount`, `splitAngleSpread`.
- **onLifetimeEnd:** spawn new projectiles (pellets) with `LinearBehavior`.

### 8. TetherBehavior (future gadget)
- **Config:** `ropeLength`, `pullStrength`.
- **Collision:** attaches to target; apply force pulling them toward player.

### 9. PiercingBeamBehavior
- **Purpose:** laser (continuous beam).
- **Implementation:** different – uses `Graphics` line + raycast.
- **Update:** keep beam active for duration; sample collisions along line each frame.

## Effect Modules
Effect script gắn vào projectile để áp dụng status.

### Effect Interface
```ts
interface ProjectileEffect {
  apply(target: Damageable, context: EffectContext): void;
}
```

- **DamageEffect:** apply raw damage.
- **BurnEffect:** damage over time (register with `StatusEffectSystem`).
- **SlowEffect:** reduce movement speed for duration.
- **ArmorPierceEffect:** bypass shield (percentage).
- **EMPDisruptEffect:** disable gadget/ability for enemies.

## Scripting Examples
```ts
const rocket = projectileManager.spawnProjectile('player', 'rocket', position, direction, {
  behavior: 'rocket',
  effects: [DamageEffect(200), ExplosionEffect({ radius: 120, falloff: linear })]
})
```

```ts
const scatter = projectileManager.spawnProjectile('player', 'scatter', position, direction, {
  pellets: 16,
  behavior: 'scatter',
  spread: 30,
  effects: [DamageEffect(24)]
})
```

## Collision Hooks
- `onCollision` may spawn decal (bullet hole), impact FX.
- For bounce: differentiate between wall vs enemy.
- For Homing: if hitting non-target (shield) check ricochet or stop.

## Benchmark Notes
- Behavior update should be lightweight (no heavy math inside loops). Use vector pools.
- limit target acquisition frequency (e.g., every 100ms).

## Testing Checklist
- Linear: verify distance cap, gravity.
- Bounce: ensure bounce count decrement; no stuck loops.
- Homing: reacquire target, respect turnRate.
- Rocket: explosion hits multiple enemy, damage falloff correct.
- Flame: DoT stack clamp.
- Shrapnel: spawn correct number of pellets, avoid recursive explosion.
