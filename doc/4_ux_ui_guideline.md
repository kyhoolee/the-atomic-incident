# UX/UI Guideline — The Atomic Incident

## 1. Triết lý UX
- Ưu tiên phản hồi tức thời (visual + audio) cho mỗi hành động.
- Hạn chế clutter, tập trung vào vùng trung tâm ánh sáng.
- Accessibility: color contrast, hỗ trợ color-blind, điều chỉnh brightness/shadow opacity.

## 2. HUD Layout
- Sơ đồ vị trí (top-right score/combo, bottom-right ammo, bottom-left dash, center wave text).
- Kích thước, padding, anchor cho từng thành phần.
- Responsive rules (scale theo độ phân giải).

## 3. Menu Flow
- State diagram: Start Menu → Options → Instructions → Play → Pause → Game Over.
- Wireflow cho mỗi màn (nút, keyboard shortcut, hover state).

## 4. Visual Style Guide
- Palette chính (background, highlight, enemy tint).
- Iconography, border radius, drop shadow.
- Transition animation (fade, tween scale) & duration chuẩn.

## 5. Typography
- Heading kiểu, body text, số liệu HUD (font size, weight, spacing).
- Quy ước viết hoa, localization placeholder (nếu đa ngữ).

## 6. Input & Control Mapping
- Bảng mapping PC (WASD, Mouse, Space, P) + controller (nếu có kế hoạch).
- Remapping support? Focus navigation trong menu.

## 7. Feedback & States
- Damage feedback, pickup highlight, weapon change animation, pause overlay.
- Error state (font load fail, audio mute) và messaging.

## 8. Accessibility Checklist
- Audio sliders, mute toggle, subtitle/tooltip? (nếu applicable).
- Các tuỳ chọn: reduce FX, colorblind theme, auto-aim toggle (nếu sponsor request).

## 9. Tài liệu tham chiếu
- Link mockup (Figma/Miro), prototype video, user testing note.

## 10. Wireframe Textual Mockup — Mobile Landscape HUD

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  [Mini-map/Radar (semi-transparent circle, top-left)]                      │
│    • Enemy arrows + goal marker                                           │
│                                                                            │
│  [Score & Combo Stack (top-right)]                                         │
│    SCORE: 0123456                                                          │
│    COMBO: x3.4                                                             │
│                                                                            │
│  [Objective Panel (top-center)]                                            │
│    CONTRACT: "Eliminate Target"                                           │
│    Subtasks:                                                               │
│      ▷ Locate hideout                                                      │
│      ▷ Disable alarm                                                       │
│                                                                            │
│  [Alert Meter (below objective, spanning width)]                           │
│    STEALTH ◀───────■────────▶ ALERT                                        │
│                                                                            │
│                                                                            │
│                           (Gameplay view / camera center)                  │
│                         • Dynamic lighting circle                         │
│                         • Enemies emerging from dark                       │
│                                                                            │
│                                                                            │
│  [Left HUD Column]                                                         │
│    Agent portrait + health/light bar                                       │
│    Ability cooldown icon (Ghost, Oracle, etc.)                             │
│    Gadget slot icons (smoke, EMP)                                          │
│                                                                            │
│  [Right HUD Column]                                                        │
│    Weapon icon + ammo bar                                                  │
│    Weapon name text                                                        │
│    Dash cooldown bar                                                       │
│                                                                            │
│  [Bottom Left Corner]                                                      │
│    Virtual Joystick (movement)                                             │
│      ◯ base circle                                                         │
│      ● thumb position                                                      │
│                                                                            │
│  [Bottom Right Corner]                                                     │
│    Virtual Joystick (aim/shoot)                                            │
│      ◯ base circle with trigger overlay                                    │
│      ▣ Fire button / auto-fire toggle                                      │
│                                                                            │
│  [Bottom Center]                                                           │
│    Quick buttons (dash, ability, gadget) arranged horizontally             │
│      [Dash]  [Ability]  [Gadget]                                           │
│                                                                            │
│  [Pause/Menu Button] (top-left corner overlay)                             │
│    ≡ icon                                                                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Layer Breakdown
- **Gameplay Layer:** world rendering, lighting circle, enemies, pickups.
- **HUD Base Layer:** score/combo, objective tracker, alert meter.
- **Agent Panel:** portrait, light/health bar, ability cooldowns.
- **Weapon Panel:** weapon icon, ammo, dash bar.
- **Controls Layer:** dual joysticks, quick buttons, pause icon.
- **Overlay Layer:** pop-up messages, combo toast, wave indicator, damage vignette.

## 11. Menu & Stage Navigation

### 11.1 Menu Structure Overview
```
Start Menu
  ├─ Play
  │   ├─ Stage Select
  │   │    ├─ Stage Card (Neon District — default)
  │   │    ├─ Stage Card (Harbor) [Locked]
  │   │    └─ Stage Card (High-Rise) [Locked]
  │   ├─ Difficulty Select (per stage)
  │   │    ├─ Rookie
  │   │    ├─ Professional
  │   │    └─ Legend
  │   └─ Mode Select
  │        ├─ Contract (Objective-based)
  │        └─ Endless (Survive waves)
  ├─ Agents (unlock roster)
  ├─ Arsenal (weapon mods)
  ├─ Leaderboard
  ├─ Options
  └─ Credits
```

### 11.2 Stage Select Wireframe (Text)
```
┌───────────────────────────────────────────────┐
│ [Title] SELECT CONTRACT LOCATION              │
│                                               │
│ [Horizontal Carousel]                         │
│  ┌───────────────┐  ┌───────────────┐         │
│  │ STAGE CARD    │  │ STAGE CARD    │         │
│  │ Neon District │  │ Harbor        │         │
│  │ Difficulty    │  │ Locked 💼     │         │
│  │ Info snippet  │  │ Req: level X  │         │
│  └───────────────┘  └───────────────┘         │
│                                               │
│ [Difficulty Toggle]                           │
│  Rookie ○  Professional ●  Legend ○           │
│                                               │
│ [Mode Toggle]                                 │
│  Contract ●   Endless ○                       │
│                                               │
│ [Objective Preview Panel]                     │
│  - Primary target: ...                        │
│  - Secondary tasks: ...                       │
│  - Reward: XP, Credits                        │
│                                               │
│ [Play Button]  [Back]                         │
└───────────────────────────────────────────────┘
```

### 11.3 Mode Definitions
- **Contract Mode:**
  - Chuỗi mục tiêu xác định (eliminate, hack, destroy).
  - Điểm số dựa trên thời gian + combo + bonus stealth.
  - Unlock agent/stage dựa trên hoàn thành milestone.
- **Endless Mode:**
  - Wave vô hạn, difficulty tăng dần mỗi 3 phút.
  - Leaderboard theo thời gian sống / tổng điểm.
  - Drop energy/weapon tăng tốc độ xuất hiện.

### 11.4 Difficulty Multipliers
| Difficulty | Enemy HP | Enemy Speed | Detection Threshold | Reward Multiplier |
|------------|----------|-------------|---------------------|-------------------|
| Rookie | 0.8x | 0.9x | High (dễ stealth) | 1.0 |
| Professional | 1.0x | 1.0x | Medium | 1.3 |
| Legend | 1.3x | 1.15x | Thấp (dễ bị phát hiện) | 1.6 |

### 11.5 Stage Progression Plan
- MVP: chỉ có Neon District (Contract + Endless). UI hiển thị các stage khác dạng "Coming Soon".
- Khi cập nhật stage mới: thêm `Stage Card` với thumbnail, mô tả đặc trưng (layout, enemy đặc biệt).
- Stage card hiển thị tag "Stealth-heavy", "High Verticality"… để người chơi hiểu gameplay khác gì.

### 11.6 Menu Interaction Notes
- Navigation: arrow keys / joystick để chuyển card; Enter/Space/Confirm để chọn; Esc/Back để quay lại.
- Mobile: swipe carousel, tap toggle, confirm button lớn.
- Hover state highlight + sound cue ngắn.
- Tắt/ẩn các mode/độ khó chưa unlock, hiển thị tooltip yêu cầu.

