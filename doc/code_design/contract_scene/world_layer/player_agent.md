# WorldLayer – PlayerAgent

## Overview
- Đại diện cho sát thủ điều khiển bởi người chơi.
- Extends `Phaser.GameObjects.Sprite` (hoặc `Container` nếu chứa nhiều child).
- Bao gồm các controller phụ: `MovementController`, `WeaponManager`, `AbilityController`, `ComboManager`, `GadgetInventory`.

## Properties
| Thuộc tính | Kiểu | Mô tả |
|-----------|------|-------|
| `movementController` | `MovementController` | Quản lý tốc độ, gia tốc, dash, slide. |
| `weaponManager` | `WeaponManager` | Điều phối vũ khí hiện tại, ammo, cooldown. |
| `abilityController` | `AbilityController` | Xử lý kỹ năng đặc biệt (slide, parry, stealth). |
| `playerLight` | `PlayerLight` | Cập nhật radius ánh sáng. |
| `comboManager` | `ComboManager` | Theo dõi combo kill. |
| `gadgetInventory` | `GadgetInventory` | Item phụ trợ: smoke, EMP. |
| `health` | `number` | Tương đương % ánh sáng (0–100). |
| `shield` | `number` | (Optional) absorb damage trước health. |
| `state` | `'alive' | 'downed' | 'dead'` | Trạng thái sống. |
| `agentData` | `AgentConfig` | Thông tin agent (speed multiplier, ability list). |

## Methods
- `init(config: AgentInitConfig)` – setup sprite, controllers, stats.
- `update(delta: number)` – update controllers (movement, ability).
- `handleInput(input: PlayerInput)` – route input events.
- `takeDamage(amount: number, source?: Enemy)` – giảm health, update light, fire events.
- `heal(amount: number)` – tăng health/light.
- `switchWeapon(type: WeaponType)` – delegate to `weaponManager`.
- `activateAbility(id: AbilityId)` – call `abilityController.useAbility`.
- `useGadget(slot: number)` – gắn gadget effect.
- `onDeath()` – trigger death animation, disable input, notify Objective/HUD.
- `getLightRemaining(): number` – convenience cho HUD.

## Events (Signals)
| Event | Payload | Trigger |
|-------|---------|---------|
| `onDamage` | `{ amount, health }` | khi nhận sát thương |
| `onHeal` | `{ amount, health }` | khi hồi máu/ánh sáng |
| `onDeath` | `{ cause }` | khi health <= 0 |
| `onAbilityUsed` | `{ abilityId }` | ability kích hoạt |
| `onWeaponChanged` | `{ weaponType }` | đổi súng |
| `onComboChange` | `{ comboValue }` | combo tăng/giảm |
| `onGadgetUsed` | `{ gadgetId }` | sử dụng gadget |

## Input Handling
- `InputAdapter` gửi sự kiện
  - `moveDirection (Vector2)` → `movementController.setDirection`.
  - `aimAngle (radians)` → rotate sprite, orient `weaponManager`.
  - `fire (boolean)` → `weaponManager.fire(angle)`.
  - `dash` → `movementController.dash()`.
  - `ability` → `abilityController.useAbility(...)`.
  - `gadget` → `gadgetInventory.use(slot)`.

## Interaction with Systems
- **PhysicsAdapter**: `physicsAdapter.addPlayer(playerAgent, options)` trả về handle. MovementController apply forces qua adapter.
- **LightingAdapter**: `playerLight` update radius + position.
- **ObjectiveSystem**: player events (collect item, reach area) notify objective.
- **HUDLayer**: subscribe to onDamage, onAbilityUsed, etc.
- **AudioEngine**: play SFX (dash, hit, ability) via `soundManager`.

## Ability Examples
- **Slide**: MovementController reduce collider height, speed boost short time.
- **Parry**: AbilityController set state, register projectile intercept callback (reflect bullet).
- **Stealth**: Player sprite alpha tween, disable enemy detection (set flag in AlertSystem), modify lighting radius (maybe reduce to simulate ghost).

## Damage Handling Logic (Pseudo)
```
function takeDamage(amount, source) {
  if (state !== 'alive') return
  let remaining = amount
  if (shield > 0) {
    const used = Math.min(shield, remaining)
    shield -= used
    remaining -= used
  }
  if (remaining > 0) {
    health = Math.max(0, health - remaining)
    playerLight.incrementRadius(-remaining * LIGHT_PER_HP)
    comboManager.reset()
    emit('onDamage', { amount, health })
    if (health === 0) onDeath()
  }
}
```

## Data Dependencies
- `AgentConfig`: base speed, dash cooldown, ability list, passive modifiers.
- `WeaponConfig`: for default weapon per agent.
- `AbilityConfig`: cooldown, duration, effects.

## Testing Checklist
- Movement: ensure dash obeys cooldown, ability not conflicting.
- Damage: shield > health, health to zero triggers death once.
- Weapon switch: update HUD, old weapon ammo stored.
- Gadget: using reduces inventory, effect ends correctly.
- Event: listeners triggered exactly once per event.

