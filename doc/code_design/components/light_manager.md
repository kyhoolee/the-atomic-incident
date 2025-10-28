# Lighting Manager Internals

## Purpose
- Cung cấp abstraction cấp cao hơn cho LightingSystem, quản lý profile ánh sáng theo stage/ability, xử lý chuyển đổi adapter, giám sát hiệu năng.

## Architecture
```
LightManager
 ├─ LightingSystem (adapter implementation)
 ├─ LightProfileRegistry
 ├─ PerformanceMonitor
 └─ EventBridge (subscribe gameplay events)
```

## Light Profiles
- Định nghĩa preset cho các tình huống khác nhau.
```
interface LightProfile {
  id: string
  shadowOpacity: number
  brightnessCurve: (healthPct: number) => number
  staticLights: StaticLightConfig[]
  effectLights: { trigger: string; config: EffectLightConfig }[]
}
```
- Ví dụ profile:
  - `default_neon`: opacity 0.9, static lamp, effect: explosion.
  - `power_cut`: opacity 1.0, static lights off.
  - `stealth_mode`: opacity 0.7, radius clamp.

## Event Integration
- Subscribes to:
  - `AgentEvent.ABILITY_STEALTH_START/END` → switch profile `stealth_mode`.
  - `ObjectiveEvent.POWER_NODE_DESTROYED` → toggle static light.
  - `AlertEvent.LEVEL_CHANGE` → adjust shadow opacity (higher alert = brighter due to alarm lights?).

## APIhttps://docs.google.com/spreadsheets/d/1PS4PKmE2pfFgQP_hNLhI4OaWahx2aPIUp-Z_MixKj1w/edit?gid=1310218157#gid=1310218157
```
class LightManager {
  init(config: LightingConfig, profileId: string)
  setProfile(id: string)
  registerDynamicLight(id: string, config: DynamicLightConfig)
  updateDynamicLight(id, updates)
  removeDynamicLight(id)
  update(delta)
  getLightingSystem(): LightingSystem
}
```
- `DynamicLightConfig`: { position, radius, color, lifetime?, flicker? }.
- Example dynamic light: muzzle flash (short lifetime 0.1s), explosion (0.3s), EMP (radius grows).

## Performance Monitor
- Hooks `LightingSystem` to record time per update.
- If average > threshold → degrade: reduce ray samples, disable effect lights.
- Expose metrics to DebugLayer.

## Adapter Switching
- Provide method `switchAdapter(type: 'renderTexture'|'phaserLights'|'simple')`.
- Steps:
  1. Save current lights definitions.
  2. Destroy old adapter.
  3. Init new adapter with same config.
  4. Re-register lights.
- Useful cho benchmark hoặc fallback low-end.

## Testing
- Profile switch transitions smoothly (no flicker).
- Effect lights auto remove after lifetime.
- Performance degrade kicks in at set threshold.
- Adapter switch maintains light handles.
