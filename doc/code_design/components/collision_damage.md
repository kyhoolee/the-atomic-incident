# Collision & Damage Handling Architecture

## Overview
- Trung tâm xử lý va chạm, tính damage, gởi sự kiện cho player/enemy/projectile.
- Tách khỏi engine vật lý để dễ chỉnh.

## Key Modules
1. `PhysicsAdapter` – phát hiện va chạm, chuyển tiếp data.
2. `CollisionResolver` – logic game-specific trên từng pair.
3. `DamageSystem` – áp dụng damage, shield, effect.
4. `StatusEffectSystem` – quản lý trạng thái (burn, slow).

## Data Structures
- `CollisionEvent { a, b, normal, impactVelocity }`.
- Entities implement `Damageable` interface:
```ts
interface Damageable {
  takeDamage(amount: number, source?: DamageSource): void;
  applyStatus?(status: StatusEffect): void;
  isAlive(): boolean;
}
```
- `DamageSource` enum: projectile, melee, explosion, environmental.

## CollisionResolver Flow
```
function handleCollision(event: CollisionEvent) {
  const pair = normalize(event.a, event.b)
  switch (pair) {
    case ('player', 'enemyProjectile'):
      damageSystem.applyDamage(player, projectile.damage, { source: projectile })
      projectileManager.handleCollision(projectile, player)
      break
    case ('player', 'enemy'):
      // contact damage (if enemy has melee)
      damageSystem.applyDamage(player, enemy.enemyData.contactDamage, { source: enemy })
      break
    case ('playerProjectile', 'enemy'):
      damageSystem.applyDamage(enemy, projectile.damage, { source: projectile })
      projectileManager.handleCollision(projectile, enemy)
      break
    case ('projectile', 'wall'):
      projectileManager.handleCollision(projectile, 'wall')
      break
    case ('player', 'pickup'):
      pickup.onCollect(player)
      break
    // add more cases (gadget, hazards)
  }
}
```

## DamageSystem
- Responsibilities:
  - Apply modifiers (difficulty, ability buff).
  - Check shield, armor, resistances.
  - Emit analytics events.

### API
```
applyDamage(target: Damageable, amount: number, context?: DamageContext)
applyAoE(center, radius, falloffFn, filterFn)
```
- `DamageContext`: { source, critical?, statusEffects?, knockback? }

### Process Steps
1. `preDamageHooks` (e.g., agent passive reduce damage).
2. `calculateDamage`: amount * modifiers.
3. `target.takeDamage(finalDamage, source)`.
4. Apply status `target.applyStatus(status)` if provided.
5. Emit `DamageEvent` → HUD, audio, analytics.

## StatusEffectSystem
- Maintains map `entityId -> ActiveEffect[]`.
- Each effect `{ type, magnitude, duration, tickInterval, onTick }`.
- Update each frame: decrement duration, trigger `onTick`.
- Typical effects: Burn, Slow, Stun, ArmorBreak.

## AoE Handling
- `applyAoE` loops through entities, check distance, apply damage * falloff.
- To optimize, use spatial partition (quadtree) from physics adapter.

## Knockback
- If context includes `knockbackVector`, call `physicsAdapter.applyImpulse(target.body, vector)`.

## Explosion Example
```
DamageSystem.applyAoE(projectile.position, config.radius, falloffLinear, entity => entity instanceof Enemy)
```
- `falloffLinear(distance)` returns multiplier 1 → 0.

## Testing Checklist
- Player hit by projectile reduces health + combo reset.
- Shield absorb > damage (no negative).
- AoE apply to multiple enemies, unaffected by walls? (depending design).
- Status effects stack rules (burn stack limited, slow not stacking). 
- Ensure no double damage when collision event fires multiple times (use cooldown or track hits).

## Performance Notes
- Debounce collisions using `collisionCooldown` per pair (e.g., 50ms) to avoid repeated hits inside same frame.
- Use `DamageQueue` to process heavy AoE on next frame if spike.

