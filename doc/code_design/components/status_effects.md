# Status & Ability Effect System

## Overview
- Quản lý mọi hiệu ứng tạm thời áp dụng lên entity (burn, slow, stun, shield, invisibility).
- Kết hợp với `DamageSystem`, `AbilityController`, `ProjectileBehavior`.

## Core Concepts
```
interface StatusEffect {
  id: string
  type: 'buff'|'debuff'
  duration: number
  tickInterval?: number
  magnitude: number | Vector
  stacks?: boolean
  maxStacks?: number
  onApply(entity): void
  onTick?(entity): void
  onExpire(entity): void
}
```
- Stored as `ActiveEffect { effect: StatusEffect, remaining: number, stacks: number }`.

## System API
```
class StatusEffectSystem {
  apply(entity, effect: StatusEffect): void
  remove(entity, effectId: string): void
  hasEffect(entity, effectId: string): boolean
  update(delta): void
}
```

## Effect Catalogue
- **Burn**: damage per tick, stack limited (max 3).
- **Slow**: modify movement speed via multiplier.
- **Stun**: disable movement/attack for duration.
- **Shield**: add temporary shield value; when exhausted remove effect.
- **Invisibility**: set flag for `DetectionComponent`, reduce lighting radius.
- **EMPDisable**: disable enemy abilities, reduce weapon cooldown.

## Integration Points
- `DamageSystem.applyDamage` may attach Burn/Slow.
- `AbilityController` (player) triggers invisibility/shield.
- `EnemyComponent` may add effects (gas cloud -> slow).

## Update Logic
```
for each (entityEffects of entity) {
  effect.remaining -= delta
  if (effect.tickInterval && effect.tickTimer <= 0) {
    effect.onTick(entity)
    reset tickTimer
  }
  if (effect.remaining <= 0) {
    effect.onExpire(entity)
    remove effect
  }
}
```

## Handling Stacks
- If `effect.stacks` true:
  - On apply, if already present and not reached `maxStacks`, increment stack count, optionally refresh duration.
  - Each stack may add magnitude (e.g., burn damage = base * stacks).

## Data Definition Example
```ts
const Effects = {
  burn: {
    id: 'burn', type: 'debuff', duration: 3000, tickInterval: 500,
    onApply(entity) { playFX('burn_start', entity.position) },
    onTick(entity) { damageSystem.applyDamage(entity, 5, { source: 'status_burn' }) },
    onExpire(entity) { playFX('burn_end', entity.position) }
  },
  stealth: {
    id: 'stealth', type: 'buff', duration: 2000,
    onApply(entity) { entity.setAlpha(0.4); alertSystem.setPlayerVisible(false) },
    onExpire(entity) { entity.setAlpha(1); alertSystem.setPlayerVisible(true) }
  }
}
```

## Testing Checklist
- Effects expire correctly; tick frequency accurate.
- Stacking burn: verify damage scaling.
- Slow interacts with difficulty (not exceed min speed).
- Stun prevents ability usage.
- Shield effect removed when health restored? (decide design).

## Performance
- Use map keyed by entity id -> effect list.
- For large number of entities, update at lower frequency (e.g., tick per 50ms timeslice) to avoid per-frame heavy.
