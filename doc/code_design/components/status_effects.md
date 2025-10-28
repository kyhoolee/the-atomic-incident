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

## Extended Details
### Effect Context & Resistance
- `EffectContext` ghi lại `sourceId`, `ownerType`, `abilityId`, `projectileId`, giúp analytics và combo logic.
- Entity có thể định nghĩa `getEffectResistance(tag: string): number` trả về multiplier 0..1 (0 = miễn nhiễm).
  - Ví dụ Juggernaut: `resist.fire = 0.5`, `resist.emp = 0` (miễn nhiễm EMP).
  - Khi apply effect: `duration *= resistance`, `magnitude *= resistance`; nếu 0 -> skip apply.
- Cho phép define immunity list: `entity.hasEffectImmunity(effectId)`.

### Stack Hooks & Refresh Rule
- `StatusEffect` optional `onStack(entity, stacks, context)` để xử lý khi stack tăng (play FX, update HUD).
- `refreshOnApply = false` cho effect như bleed (không reset khi reapply).
- Giới hạn `maxStacks`; log warning nếu vượt để tránh exploit.

### Cleanse/Purge API
```ts
statusEffectSystem.cleanse(entity, eff => eff.type === 'debuff')
statusEffectSystem.purge(entity, ['fire', 'poison']) // remove effect có tag tương ứng
```
- Một số effect gắn tag `persistent` -> không remove bằng cleanse thường.

### Event Broadcasting
- `StatusEvent.APPLIED` `{ entityId, effectId, stacks }`.
- `StatusEvent.EXPIRED` `{ entityId, effectId }`.
- `StatusEvent.STACK_CHANGED` `{ entityId, effectId, stacks }`.
- HUD subscribe để hiện icon/buff list; throttle sự kiện để tránh spam (đặc biệt burn tick).

### Performance Considerations
- Tick scheduling: effect có `tickInterval` > 0 có thể đưa vào scheduler riêng (update mỗi interval) thay vì mỗi frame.
- Giới hạn max effect trên entity (ví dụ 8). Nếu vượt, có thể bỏ effect lâu nhất (LRU) hoặc từ chối apply mới.
- Sử dụng object pool cho `ActiveEffect` để hạn chế GC khi add/remove liên tục.

### Testing Matrix
| Scenario | Expectation |
|----------|-------------|
| Apply Burn 4 lần | Stack cap = 3, damage = base * 3 |
| Cleanse Debuff | Remove burn/slow, giữ shield |
| Enemy immune EMP | Không bị disable, log event "immune" |
| Stealth active | AlertSystem bỏ qua player 2s, Lighting revert đúng |
| Taunt | Enemy retarget player, hết thời gian -> quay lại logic cũ |
