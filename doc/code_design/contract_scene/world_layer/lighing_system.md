# WorldLayer – LightingSystem

## Overview
- Bao bọc `LightingAdapter` để quản lý ánh sáng động (player light, static lamp, special effects).
- Cung cấp API cho gameplay (kiểm tra điểm trong bóng, cập nhật radius, toggle debug).

## Components
1. **LightingAdapter**
   - Cài đặt cụ thể (RenderTexture, Phaser Lights, Hybrid). Inject qua `AdapterFactory`.
2. **LightRegistry**
   - Lưu danh sách light handle (player, static, effect). Map: `id -> LightHandle`.
3. **ShadowOccluderData**
   - Walls (from tilemap), dynamic blockers (e.g., shield). Gửi cho adapter.

## API
```
class LightingSystem {
  init(config: LightingConfig): void
  registerPlayerLight(playerAgent: PlayerAgent): LightId
  registerStaticLight(lightConfig: StaticLightConfig): LightId
  updatePlayerLight(lightId, radius, position): void
  toggleLight(id, enabled): void
  isPointInShadow(point: Phaser.Math.Vector2): boolean
  update(delta): void
  destroy(): void
}
```

### LightingConfig
- `width`, `height`
- `walls`: polygon/segment list
- `shadowOpacity`
- `debugEnabled`

### StaticLightConfig
- `position`
- `radius`
- `color`
- `intensity`

## Flow
1. On scene create: `lightingSystem.init({ width: camera.width, height: camera.height, walls: mapWalls })`.
2. Register player light: track PlayerAgent, update each frame.
3. Register static lamps from stage data.
4. Optionally register effect lights (explosion, ability).
5. In `update(delta)`: call `adapter.update(delta)`.
6. `isPointInShadow(point)`: delegate to adapter.

## Special Cases
- **Stealth Ability:** temporarily reduce shadow opacity or switch to alternative shader.
- **Explosion / EMP:** spawn temporary light with radius/time; schedule removal.
- **Power Cut Event:** toggle certain static lights off.

## Debugging
- Methods `enableDebug()`, `disableDebug()`.
- Draw rays on DebugLayer.

## Performance Handling
- Limit dynamic light count (player + up to 2 effect). For more, degrade (e.g., disable effect lights).
- On low-end device, allow fallback to simple radius (no occlusion) – use adapter `SimpleLighting`.

## Testing Checklist
- Player light follows agent; radius change matches health.
- `isPointInShadow` matches visual (validate with sample points).
- Static lights interact with walls (occlusion correct).
- Explosion light appear/disappear smoothly.
- Toggle debug works, no memory leak.
