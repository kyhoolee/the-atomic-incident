# WorldLayer – Enemy Entity

## Overview
- Kẻ địch trong game: sprite + component-based behaviors (Targeting, Attack, Detection, Health).
- Thực thi enum `EnemyType` (following, dashing, projectile, sentry drone, juggernaut...).

## Core Structure
```
class Enemy extends Phaser.GameObjects.Sprite {
  components: EnemyComponent[]
  health: number
  shield: number
  state: 'idle'|'patrol'|'alert'|'attack'|'dead'
  enemyData: EnemyConfig
  target: PlayerAgent | null
}
```

## Properties
| Property | Type | Description |
|----------|------|-------------|
| `components` | `IEnemyComponent[]` | List of attached behaviors. |
| `health` | `number` | Current HP, scaled by difficulty. |
| `shield` | `number` | Optional (for tank). |
| `state` | `EnemyState` | Behavior state machine. |
| `enemyData` | `EnemyConfig` | Base stats (speed, vision, attack). |
| `targeting` | `TargetingComponent` | Navigate using navmesh. |
| `attack` | `AttackComponent` | Attack logic (dash, projectile). |
| `detection` | `DetectionComponent` | Manage stealth detection, FOV. |
| `splitOnDeath` | `SplitOnDeathComponent?` | For dividing type. |
| `lootTable` | `DropConfig` | For pickup drop. |
| `reward` | `{ score: number, energy: number }` | Bonus to player.

## Methods
- `initialize(config: EnemyConfig)` – set sprite, components, stats.
- `update(delta)` – iterate components: `component.update(this, delta)`.
- `takeDamage(amount, source)` – reduce health/shield, emit events, death logic.
- `applyStatus(effect)` – slow, stun, etc.
- `setTarget(player)` – set `target` & inform components.
- `onDeath()` – emit `EnemyGroup.onEnemyKilled`, spawn pickups, remove body.
- `destroy()` – cleanup components, remove from group.

## Component Interfaces
```
interface EnemyComponent {
  init(enemy: Enemy): void
  update(enemy: Enemy, delta: number): void
  handleEvent?(enemy: Enemy, event: EnemyEvent): void
  destroy(): void
}
```
Examples:
- `TargetingComponent`: pathfind, separation.
- `DashAttackComponent`: charge attack states.
- `ProjectileAttackComponent`: firing schedule.
- `DetectionComponent`: check if player in light/FOV.
- `SplitOnDeathComponent`: spawn smaller enemies.
- `BossDashComponent`: state machine for juggernaut.

## Events
| Event | Payload | Description |
|-------|---------|-------------|
| `onSpawn` | `{ enemyId }` | Fired when spawn. |
| `onAlert` | `{ level }` | When detection increases. |
| `onAttack` | `{ attackType }` | Attack triggered. |
| `onDamage` | `{ amount, health }` | Damage taken. |
| `onDeath` | `{ enemyId, drop }` | Death event, includes drop type. |

## State Machine Example (Dash Attack)
```
States: Patrol → ChargeUp → Dashing → Recover
Transitions:
  Patrol -> ChargeUp when player in light for > 250ms
  ChargeUp -> Dashing after charge timer (1s)
  Dashing -> Recover after duration or collision
  Recover -> Patrol after cooldown
```

## Interaction with Systems
- `EnemySpawner`: instantiates enemy and adds to group.
- `AlertSystem`: detection component notify alert level → may spawn reinforcement.
- `ObjectiveSystem`: kills may count toward objective.
- `LightingSystem`: detection uses `isPointInShadow` to modify visibility.
- `PhysicsAdapter`: manage collisions with player/projectile/walls.

## Difficulty Scaling
- Apply multipliers from `DifficultyModifier` at spawn:
  - `health *= modifier.getHealthMultiplier()`.
  - `attack.cooldown /= modifier.getSpeedMultiplier()`.
  - `detection.threshold` adjust.

## Drop Logic
- On death: roll `lootTable` (weighted). Example:
  - 50% energy, 10% weapon crate (if timer > 30s), 5% gadget, else nothing.

## Testing Checklist
- Damage/resist check: shield intercept.
- Attack component triggers with correct cadence.
- State transitions (charge/dash) respect timers, can be interrupted.
- Detection: stealth ability toggles detection properly.
- Drop: ensure drop spawns at random offset.
- Despawn: cleanup components, body removed from physics.
