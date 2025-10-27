# MenuScene – ContentLayer Detail

## Purpose
- Chứa toàn bộ UI tương tác chính của menu (logo, navigation, stage selection, mode/difficulty toggle, preview hợp đồng).
- Layout responsive, chuyển đổi giữa các panel bằng animation.

## Structure
```
ContentLayer (Phaser.GameObjects.Container)
 ├─ LogoTitle
 ├─ NavigationPanel
 ├─ StageSelectPanel (hidden by default)
 ├─ DifficultyToggle
 ├─ ModeToggle
 ├─ ObjectivePreviewPanel
 └─ FooterInfo
```

## Components & Behavior
### 1. LogoTitle
- `Phaser.GameObjects.Text` (font "Johnyokonysm"), glow effect.
- Idle animation: scale tween 1.0 ↔ 1.05 trong 4s (yoyo).
- Tắt animation khi menu vào subpanel để tránh phân tâm.

### 2. NavigationPanel
- Container chứa danh sách button (`UIButton` instances).
- Layout: vertical stack, spacing 16px.
- Button states: default, hover, active, disabled.
- Keyboard focus: `NavigationPanel.setFocus(index)` updates highlight.
- Emits event `NavigationPanelEvent.SELECT(option)`.

### 3. StageSelectPanel
- Xuất hiện khi user chọn Play.
- `Carousel` component chứa `StageCard` (prefab). StageCard hiển thị thumbnail, tag (stealth/verticality), lock state.
- Swipe support: `Carousel` lắng nghe gesture từ `InputLayer`.
- Keyboard: left/right arrows.
- Methods:
  - `setStages(stageList)`.
  - `focusStage(stageId)`.
  - `getSelectedStage()`.

### 4. DifficultyToggle
- `ToggleGroup` với 3 button: Rookie/Professional/Legend.
- Tương thích controller: left/right để đổi.
- Emits `DifficultyToggleEvent.CHANGE(level)`.

### 5. ModeToggle
- Switch Contract vs Endless; hiển thị tooltip cho mode chưa unlock.
- Update ObjectivePreview (Contract show mission detail, Endless show wave info).

### 6. ObjectivePreviewPanel
- Container hiển thị danh sách bullet `Phaser.GameObjects.Text`.
- Data binding: `objectiveService.getPreview(stageId, mode, difficulty)`.
- Show reward icons (XP, credits) bằng sprite.

### 7. FooterInfo
- Text hiển thị version, build timestamp, tip random.
- Link out (if clickable) -> open overlay confirmation.

## Animation Flow
- Khi `NavigationPanel` → Play: fade-out nav buttons (0.2s), slide-in StageSelect panel từ phải.
- Khi user Back: reverse animation.
- Stage change: StageCard scale bounce (1.05 → 1.0).

## State Management
- Local state object
```
{
  selectedStageId: string,
  difficulty: 'rookie'|'professional'|'legend',
  mode: 'contract'|'endless'
}
```
- Sync với MobX `menuStore` (optional) để remember selection.

## Responsiveness
- Breakpoint 1280px: Panel shift to single column (logo top center, nav below).
- Mobile: use larger button, StageSelect full screen modal.

## Testing Notes
- Unit test `StageSelectPanel` for focus wrap-around.
- Snapshot test Layout with Figma baseline.
