# ContractScene – HUDLayer Detail

## Purpose
- UI cố định (fixedToCamera) hiển thị trạng thái trận đấu: điểm, combo, mục tiêu, alert, agent info, weapon info, radar, điều khiển mobile.

## Structure
```
HUDLayer (Container fixed to camera)
 ├─ ScoreComboPanel
 ├─ ObjectivePanel
 ├─ AlertMeter
 ├─ AgentPanel
 ├─ WeaponPanel
 ├─ GadgetPanel
 ├─ RadarMiniMap
 ├─ ToastQueue
 ├─ TimerPanel (optional for sabotage/defense)
 └─ MobileControls (only on mobile)
```

## Component Details
### 1. ScoreComboPanel
- Elements: Score text, combo multiplier, high-score indicator.
- Data source: `gameStore.score`, `comboManager.combo`.
- Animation: when combo increases → scale bounce; when high score → toast.

### 2. ObjectivePanel
- Show active objectives + progress.
- Format: bullet list, icons for status (incomplete, complete, failed).
- Updates from `ObjectiveSystem.onProgressUpdate`.

### 3. AlertMeter
- Horizontal bar representing stealth → alert.
- Data from `AlertSystem.alertLevel` (0..1).
- Colors: green (low), yellow (mid), red (high). Tween smooth.

### 4. AgentPanel
- Portrait sprite, health/light bar, ability cooldown indicator.
- `light bar` updates from `PlayerLight.getLightRemaining()`.
- Ability icons show cooldown overlay (fill, grey). Support multiple abilities if agent advanced.

### 5. WeaponPanel
- Weapon icon, ammo bar, text `current ammo / max`.
- Dash cooldown bar located here.
- When weapon change → update icon & play little animation.

### 6. GadgetPanel
- Slots for gadgets (smoke, EMP). Each slot shows count/cooldown.
- Click/tap to use on desktop? default bound to key (Q/E). On mobile button clickable.

### 7. RadarMiniMap
- Circular radar, displays enemy dots outside light, weapon pickup, objective direction.
- Implementation: `RenderTexture` or custom draw using `Graphics`.
- Provide toggle in Options to disable for challenge mode.

### 8. ToastQueue
- Same component reuse with menu (maybe shared service).
- Display short messages (combo milestone, warning, pickup).

### 9. TimerPanel (optional)
- For defenses/hacks: show countdown with progress circle.
- When active, panel slides in near center top.

### 10. MobileControls
- Contains virtual joystick (movement) & aim/shoot overlay.
- Buttons: Dash, Ability, Gadget. Large enough for thumb.
- Manage transparency 0.65.

## Layout Guidelines
- Score/combo top-right; objective top-center; alert meter below objective.
- Agent panel top-left; weapon panel bottom-right; gadget bottom-center.
- Mobile: reposition to avoid overlapping control sticks.

## Update Flow
- `HUDLayer.update(delta)` listens to events rather than polling (prefer reactive). For components needing timers (cooldown), update directly.
- On pause: dim HUD (alpha 0.5) but keep info visible.

## Accessibility
- Font size adjustable via options (small/medium/large). Recalculate layout.
- Colorblind mode: offer alternative palette for alert meter (blue/orange).
- Provide vibration cues (mobile) via plugin when alert high.

## Performance
- Reduce redraw by grouping static text into `BitmapText` or caching.
- Radar update at 10 FPS (throttle) to avoid heavy draw.

## Testing
- UI regression screenshot tests (desktop + mobile layout).
- Unit tests for panel updates (simulate events, assert text). Use stub store.
