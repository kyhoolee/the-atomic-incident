# ContractScene – OverlayLayer Detail

## Purpose
- Render các UI phụ trợ nằm trên world nhưng dưới HUD: marker mục tiêu, cảnh báo, vùng phát hiện, highlight stealth.

## Components
1. **ObjectiveMarkers**
   - Arrow/indicator để chỉ hướng mục tiêu (khi off-screen).
   - Update mỗi frame: position = world position → convert to screen coordinate via camera.
   - Use `Phaser.GameObjects.Image` + text label.
   - Hide khi mục tiêu trong ánh sáng hoặc trong camera view.

2. **AlertConeIndicators**
   - Visualize enemy FOV (cone shape) khi player bật HUD debug hoặc ability Oracle.
   - `Phaser.GameObjects.Graphics` draw arc, alpha 0.3.
   - Bind to enemy detection component.

3. **AreaHighlights**
   - Zones for planting device, extraction point.
   - Animated circle (pulse). Controlled by ObjectiveSystem.

4. **WarningText / Callouts**
   - `Phaser.GameObjects.Text` center top.
   - Examples: “ALARM TRIGGERED”, “REINFORCEMENT INCOMING”.
   - Show with timeline (fade in/out).

5. **StealthOverlay (optional)**
   - Vignette or tinted overlay when player in stealth mode.
   - Affects entire screen but sits under HUD.

## Update Logic
- `OverlayLayer.update(delta)` fetch data from ObjectiveSystem, AlertSystem, Enemy states.
- For markers: clamp positions to screen bounds (with margin). If off-screen, show arrow at edge pointing direction.
- For warning text: manage queue to avoid overlap.

## Performance Considerations
- Limit number of active markers (one per active objective/target).
- Pre-create graphics objects, reuse instead of create/destroy each frame.
- Turn off FOV visualization in release build (unless ability used).

## Integration
- `ObjectiveSystem` emits event `ObjectiveEvent.UPDATE_MARKER`.
- `EnemyDetectionComponent` emits `DetectionEvent.STATE_CHANGE` to toggle FOV.
- `AlertSystem` triggers `OverlayEvent.WARNING` for text.

## Extensions
- Add minimap overlay highlight aligning with marker positions.
- In multiplayer: differentiate player markers by color.
