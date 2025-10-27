# MenuScene – InputLayer Detail

## Purpose
- Lớp nhận và chuyển tiếp input từ keyboard/mouse, controller, mobile touch.
- Cung cấp abstraction thống nhất (`InputAdapter`) cho MenuScene và các component.

## Components
1. **FocusIndicator**
   - `Phaser.GameObjects.Rectangle` hoặc `Image` highlight quanh button/card được chọn.
   - Position update bởi `InputAdapter.setFocus(targetBounds)`.
   - Animation: tween scale 1.0 ↔ 1.05, glow shader optional.

2. **InputAdapter**
   - API chính:
```
registerNavigable(id, bounds, callbacks)
unregisterNavigable(id)
moveFocus(direction)
confirm()
cancel()
handlePointer(pointerEvent)
handleGesture(gestureEvent)
```
   - Direction mapping: Up/Down/Left/Right.
   - `confirm` trigger callback `onConfirm` của item đang focus.
   - `cancel` = Back/Close.

3. **TouchControls** (mobile only)
   - Full-screen invisible rectangles capture swipe left/right (stage carousel), swipe up/down (scroll list), tap (confirm).
   - Virtual buttons cho `Back` và `Confirm` (nút lớn ở góc dưới).

4. **Controller Support**
   - Map gamepad axes/triggers → `moveFocus/confirm/cancel`.
   - Deadzone 0.25.

## Event Flow
- Keyboard arrow key → `InputAdapter.moveFocus('left')` → find next item (wrap-around) → update focus indicator.
- Mouse move over button → highlight (hover) but không thay focus trừ khi click (PC). Optionally set `followHover` true.
- Touch swipe → StageSelectPanel `Carousel.next/prev`.
- On Confirm → `NavigationPanel` or `StageSelectPanel` handles logic, may show modal (OverlayLayer).

## Focus Graph
- Maintain adjacency map: each navigable item knows neighbors (up/down/left/right). Allows custom focus order (non-grid layout).
- When StageSelect active: focus subset (stage cards, toggles, play/back).

## Accessibility
- Provide `skipNavigation()` option (auto highlight default "Play") for quick start.
- Hold `Tab` to cycle focus sequentially for keyboard accessibility.

## Testing
- Unit test focus movement, ensure no infinite loop.
- Simulate controller input using stub gamepad.
- Touch: ensure swipe threshold 30px to avoid accidental change.
