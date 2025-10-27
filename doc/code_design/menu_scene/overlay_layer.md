# MenuScene – OverlayLayer Detail

## Purpose
- Hiển thị UI tạm thời: tooltip, modal, toast, backdrop blur khi panel bật.
- Quản lý focus stack khi overlay xuất hiện (prevent interaction background).

## Structure
```
OverlayLayer
 ├─ Backdrop (optional)
 ├─ TooltipManager
 ├─ ModalManager
 └─ ToastQueue
```

## Components
### 1. Backdrop
- `Phaser.GameObjects.Rectangle` full screen, fill #000, alpha 0.45.
- Khi bất kỳ modal mở → tween alpha từ 0 → 0.45 trong 120ms.
- Click/tap backdrop = close modal (nếu modal allow dismiss).

### 2. TooltipManager
- API:
```
showTooltip({ text, position, anchor, timeout })
hideTooltip(id)
```
- Render `Phaser.GameObjects.Container` với background blur, arrow small.
- Follows cursor/focus item.

### 3. ModalManager
- Manages stack of modals (Options, Agents, Arsenal, Leaderboard).
- Each modal = `Phaser.GameObjects.Container` + `ModalFrame` sprite.
- Focus trapping: on open, InputAdapter route to modal only.
- Keyboard: Esc/Back to close top modal.
- Animations: scale from 0.9 → 1.0, fade in 150ms.

### 4. ToastQueue
- Display top-right (desktop) hoặc top-center (mobile) messages.
- Queue item structure: `{ iconKey?, text, duration, type }`.
- Transition: slide from top, stay `duration` (default 2.5s), fade out.
- Sample use: “Unlocked Ghost Operative”, “New Weapon Mod available”.

## Event Handling
- `OverlayLayer` listen to `MenuSceneEvents.SHOW_MODAL`, `HIDE_MODAL`, `SHOW_TOOLTIP`, `HIDE_TOOLTIP`, `PUSH_TOAST`.
- Maintains overlay state for analytics (modal usage).

## Accessibility
- Ensure modals accessible: focus first interactive element, support keyboard on `Tab` cycling.
- Tooltip text accessible via alternative description (for screen reader integration future).

## Testing Checklist
- Open Options modal → background buttons disabled.
- Toast autopops after duration.
- Tooltip removable when target lost focus.
- Multiple modals not allowed (ModalManager stack size ≥1). If multi-level required → push new, auto pause previous.
