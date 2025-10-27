# WorldLayer – Pickup System

## Overview
- Quản lý item rơi trong trận: Energy, Weapon Crate, Gadget, Score Bonus.
- Điều khiển spawn, magnet behavior, lifetime, effect áp dụng khi nhặt.

## Base Class `Pickup`
```
class Pickup extends Phaser.GameObjects.Sprite {
  type: PickupType
  lifetime: number
  magnetRange: number
  magnetStrength: number
  onCollect(player: PlayerAgent): void
}
```

### Properties
| Property | Description |
|----------|-------------|
| `type` | `'energy'|'weapon'|'gadget'|'score'` |
| `lifetime` | thời gian tồn tại (ms). Expire → fade out, destroy. |
| `magnetRange` | phạm vi hút, scale by difficulty. |
| `magnetStrength` | tốc độ hút. |
| `spawnSource` | enemy, objective, crate. |
| `effectConfig` | config specific (energy amount, weapon type). |

### Methods
- `update(delta, player)` – check distance to player; nếu trong `magnetRange` → move toward player.
- `onCollect(player)` – apply effect, emit events, destroy.
- `destroyPickup()` – clean up.

## Pickup Types
1. **EnergyPickup**
   - Effect: `player.heal(amount)` (increase light radius).
   - Config: `amount = 10` base, difficulty modifies.
   - Visual: small glowing orb, color teal.

2. **WeaponCrate**
   - Effect: `player.weaponManager.switchWeapon(randomWeapon)`.
   - Optionally show UI preview (weapon name).
   - Visual: crate with blinking light.

3. **GadgetDrop**
   - Adds gadget to inventory (smoke, EMP). If inventory full → convert to score.
   - Visual: hexagon chip.

4. **ScoreBonus**
   - Adds raw score/credits.
   - Visual: credit token.

## PickupManager
- Tracks active pickups (array).
- `spawnEnergy(position, amount)` etc.
- Uses pooling for performance.
- For weapon crate: ensure not spawn same weapon as active (call `weaponService.getAlternative`).

## Spawn Rules
- Enemy death: chance to drop energy (50%), crate (10%), gadget (5%).
- Objective completion: guaranteed crate/gadget.
- Time-based spawn: if player low light (<20%) spawn pity energy near.

## Magnet Behavior
```
if (distance < magnetRange) {
  const lerpFactor = mapLinear(distance / magnetRange, 0, 1, magnetStrengthHigh, magnetStrengthLow)
  position.x += (player.x - position.x) * lerpFactor
  position.y += (player.y - position.y) * lerpFactor
}
```
- On mobile reduce magnet strength if causing jitter.

## Events
- `PickupEvents.COLLECTED` { type, amount, source }
- `PickupEvents.SPAWNED` { type, position }
- `PickupEvents.EXPIRED` { type }

## HUD Integration
- On collect: show toast (e.g., “Weapon: Scattershot”).
- Update gadgets panel, weapon panel.

## Testing
- Lifetime expiration removes pickup.
- Magnet works near walls (no stuck).
- Weapon crate ensures new weapon or skip.
- Gadget: handle inventory full (convert to score).
- Score bonus increases scoreboard.
