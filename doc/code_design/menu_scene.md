# MenuScene Design

## 1. Responsibility
- Load dữ liệu meta (stage list, agent unlocks, leaderboard snapshot).
- Render UI navigation (Start menu → Stage/Mode/Difficulty, Agents, Arsenal, Options).
- Chuyển scene sang `ContractScene` với cấu hình người chơi chọn.
- Đồng bộ với `gameStore` (MobX) để phản ánh state menu/pause.

## 2. Scene Layer Tree
```
MenuScene
 ├─ BackgroundLayer (Phaser.Container)
 │   ├─ BackgroundImage (UI_MENU_BG)
 │   └─ AnimatedDecor (optional particles)
 ├─ ContentLayer
 │   ├─ Logo & Title
 │   ├─ NavigationPanel (main buttons)
 │   ├─ StageSelectPanel (conditionally visible)
 │   ├─ DifficultyToggle
 │   ├─ ModeToggle
 │   ├─ ObjectivePreview
 │   └─ Footer (version, credits)
 ├─ OverlayLayer
 │   ├─ Tooltip
 │   ├─ ModalDialog (Options, Credits)
 │   └─ Toast (unlock notifications)
 └─ InputLayer
     ├─ FocusIndicator (keyboard/controller nav)
     └─ GestureHandlers (mobile swipe)
```

## 3. Main Components & Logic
### 3.1 NavigationPanel
- Buttons: `Play`, `Agents`, `Arsenal`, `Leaderboard`, `Options`, `Quit` (desktop).
- Events:
  - `onPlaySelected` → show `StageSelectPanel`.
  - `onAgentsSelected` → open Agents modal.
  - `onOptionsSelected` → open Options modal.
- Keyboard mapping: arrow keys to change focus, Enter to trigger, Esc to close sub panel.

### 3.2 StageSelectPanel
- Renders carousel of stage cards (`StageCardComponent`).
- Data source: `stageService.getStages()`.
- Event flows:
  - `StageCardComponent.onFocus(stageId)` → update preview.
  - `StageCardComponent.onSelect(stageId)` → commit selection.
  - `DifficultyToggle.onChange(level)`.
  - `ModeToggle.onChange(mode)`.
- When user hits `Play`, emit `MenuSceneEvents.START_CONTRACT` with payload `{ stageId, difficulty, mode }`.

### 3.3 Agents Modal
- Grid of agent cards, state locked/unlocked.
- `AgentCard` actions: show stats, set active agent, preview ability.
- Sync with `agentStore.activeAgent`.

### 3.4 Arsenal Modal
- List weapons + mods, show upgrade tree.
- `WeaponCard.onInspect` → open detail.
- `UpgradeButton.onClick` → send command to inventory service (if currency enough).

### 3.5 Options Modal
- Tabs: Audio, Controls, Graphics.
- Bindings to `preferencesStore` (MobX) by using `autorun`. Each toggle/slider writes back to store.

### 3.6 Leaderboard Modal
- Fetch asynchronous (REST/Firestore). Show spinner while loading.
- Support pagination.

### 3.7 Input Handling
- `InputManager` abstract with methods: `setFocus`, `moveFocus(dir)`, `confirm`, `cancel`.
- Mobile: gestures (swipe left/right for stage carousel, tap for selection), big confirm button.

### 3.8 Scene Transition
- When `START_CONTRACT` event fired:
  1. Disable input.
  2. Play transition animation (fade).
  3. Call `scene.start('ContractScene', payload)`.

### 3.9 Data Flow Diagram (text)
```
StageSelectPanel → emits selection → MenuScene updates internal state
MenuScene on Play → pushes {stageId, difficulty, mode, agentId} to ContractScene
Agent selection changes update MobX store → HUD uses store when loading ContractScene
```

## 4. Update Cycle
- `create()` → build UI tree, subscribe MobX stores.
- `update(time, delta)`:
  - handle animated background (particles, parallax).
  - update focus indicator position.
  - play idle animation for logo/stage card.

## 5. Future Extensions
- Add Quick Resume tile (last played contract).
- Seasonal event banner (Overlay layer).
- Cross-scene notifications (e.g., new unlock) via `NotificationService`.
