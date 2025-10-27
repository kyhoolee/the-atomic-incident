# Asset Bible — The Atomic Incident

## 1. Tổng quan asset
- Danh mục chính: Tileset, Agents, Enemies, HUD, FX, Audio, Fonts, Shaders, UI/UX.
- Bảng trạng thái mẫu:
  - Cột: ID | Tên | Nhóm | Trạng thái (Concept/WIP/Review/Final) | Ưu tiên | Owner | Ghi chú.
  - Cập nhật hàng tuần để team art/dev sync.

## 2. Sprite & Animation Detail
### 2.1 Agents (Player Characters)
| Asset ID | File | Frame Size | Frame Count | Animations | FPS | Anchor | Ghi chú |
|----------|------|------------|-------------|------------|-----|--------|---------|
| AGT_BASE_MOVE | `agents/operative_move.png` | 64x64 | 8 | move | 12 | (0.5,0.5) | Default operative |
| AGT_BASE_DASH | `agents/operative_dash.png` | 64x64 | 6 | dash | 24 | (0.5,0.5) | Motion blur frames |
| AGT_BASE_SLIDE | `agents/operative_slide.png` | 64x64 | 6 | slide | 18 | (0.5,0.6) | Hitbox thấp |
| AGT_RONIN_PARRY | `agents/ronin_parry.png` | 64x64 | 10 | parry | 20 | (0.5,0.5) | Hiệu ứng spark |
| AGT_PARKOUR_VAULT | `agents/parkour_vault.png` | 80x80 | 12 | vault | 18 | (0.5,0.6) | Chuyển frame theo hướng |
| AGT_GHOST_STEALTH | `agents/ghost_stealth.png` | 64x64 | 8 | stealth | 12 | (0.5,0.5) | Alpha fade |
| AGT_ORACLE_SCAN | `agents/oracle_scan.png` | 64x64 | 6 | scan pulse | 14 | (0.5,0.5) | Overlay pulse |

### 2.2 Weapons & Projectiles
| Asset ID | File | Description | Notes |
|----------|------|-------------|-------|
| WPN_SCATTERSHOT | `weapons/scattershot.png` | Sprite gun | Tint theo agent |
| PRJ_SCATTER | `projectiles/scatter.png` | Pellets 12 frame | Random rotate |
| PRJ_PIERCING | `projectiles/piercing.png` | Bullet trail | Additive blend |
| PRJ_BOUNCING | `projectiles/bounce.png` | Bubble | Bounce animation |
| PRJ_HOMING | `projectiles/homing.png` | Triangular shard | Glow, rotation |
| PRJ_ROCKET | `projectiles/rocket.png` | Missile | Smoke trail attach |
| PRJ_FLAME | `projectiles/flame.png` | Flame sprite sheet | Palette vary |
| FX_EXPLOSION | `fx/explosion.png` | 16 frame explosion | FPS 24 |

### 2.3 Enemies
| Asset ID | File | Animations | Frame | Notes |
|----------|------|------------|-------|-------|
| ENM_GUARD_MOVE | `enemies/guard_move.png` | move/hit/death | 16 | Shield overlay |
| ENM_SENTRY_DRONE | `enemies/sentry.png` | hover, alert | 12 | Rotor animation |
| ENM_SNIPER | `enemies/sniper.png` | aim, fire, relocate | 10 | Laser pointer |
| ENM_JUGGERNAUT | `enemies/juggernaut.png` | walk, charge, death | 16 | EMP charge-up |
| ENM_DIVIDING | `enemies/dividing.png` | move/split | 12 | Slime effect |
| ENM_DRONE_PROJECTILE | `enemies/drone_bullet.png` | bullet | 4 | Blink red |

### 2.4 HUD & UI
| Asset ID | File | Usage |
|----------|------|-------|
| HUD_SCORE_PANEL | `hud/score_panel.png` | Score/combo background |
| HUD_AMMO_BAR | `hud/ammo_bar.png` | Ammo bar interior/outline |
| HUD_LIGHT_BAR | `hud/light_bar.png` | Light/health |
| HUD_ABILITY_ICON_SET | `hud/ability_icons.png` | Slide/parry/stealth icons |
| HUD_ALERT_METER | `hud/alert_meter.png` | Stealth → Alert bar |
| HUD_OBJECTIVE_PANEL | `hud/objective_panel.png` | Contract info |
| HUD_RADAR_BG | `hud/radar_bg.png` | Radar background |

### 2.5 UI / Menu
| Asset ID | File | Description |
|----------|------|-------------|
| UI_MENU_BG | `ui/menu_bg.png` | Start menu background |
| UI_BUTTON_PRIMARY | `ui/button_primary.png` | Buttons | Multiple states |
| UI_AGENT_CARD | `ui/agent_card.png` | Unlock screen |
| UI_WEAPON_CARD | `ui/weapon_card.png` | Arsenal screen |
| UI_DIALOG_BOX | `ui/dialog_box.png` | Pop-up |

## 3. Tilemap & Level Art
- Tileset `tiles/neon_city.tsx` — 16x16 tile, palette neon, layer mapping: `bg`, `mid`, `decor`, `walls`.
- Collision flag: tile property `collide=true`.
- Object layers: `player_spawn`, `pickup_zone`, `navmesh_shrunken`, `camera_anchor`.
- Export guideline: Tiled 1.10, JSON external tileset.

## 4. FX & Particles
| FX ID | Texture | Param preset |
|-------|---------|--------------|
| FX_SMOKE_TRAIL | `fx/smoke.png` | lifespan 500ms, alpha 0.7→0.2, emit rate dynamic |
| FX_DASH_TRAIL | `fx/dash_trail.png` | stretch sprite, additive |
| FX_PARRY_SPARK | `fx/parry.png` | burst 10 particles, 200ms |
| FX_STEALTH_SHIMMER | `fx/shimmer.png` | radial gradient, loop |
| FX_EMP_WAVE | `fx/emp.png` | radial expand 0.2s, color #00ffff |

## 5. Audio Library
- **Music**: `audio/music_hate_bay.mp3` (120 BPM), `audio/music_high_tension.mp3` (140 BPM) — loop point 0 → 96s.
- **SFX Table**
| Key | Type | Length | Notes |
|-----|------|--------|-------|
| `fx/shotgun_fire` | weapon | 0.6s | Layered low + mid |
| `fx/piercing_fire` | weapon | 0.4s | Metallic ping |
| `fx/bounce_impact` | weapon | 0.5s | Wet impact |
| `fx/rocket_launch` | weapon | 1.1s | Bass-heavy |
| `fx/rocket_explosion` | weapon | 1.2s | Wide stereo |
| `fx/dash` | ability | 0.3s | Whoosh |
| `fx/stealth_on` | ability | 0.7s | Reverse reverb |
| `fx/parry` | ability | 0.4s | Metallic clink |
| `fx/alarm_trigger` | UI | 1.0s | Siren |
| `fx/timer_tick` | UI | 0.2s | Contract clock |
| `fx/enemy_detect` | enemy | 0.5s | Drone chirp |
| `fx/emp_blast` | fx | 0.8s | Sub bass |

- Chuẩn loudness: SFX -12 LUFS, Music -14 LUFS; export 48kHz, 16-bit.

## 6. Fonts & Typography
- `Montserrat` (Regular/Bold), license SIL; dùng cho HUD và menu.
- `Johnyokonysm` (Display), cho logo/tựa đề.
- Fallback: `Arial`, `sans-serif`.
- Preload: FontFaceObserver desktop, dynamic load mobile.

## 7. Shader & Post-processing
| Shader ID | File | Uniform | Mô tả |
|-----------|------|---------|-------|
| SHD_GRAYSCALE | `shaders/grayscale.frag` | `u_intensity` | damage tint |
| SHD_VIGNETTE | `shaders/vignette.frag` | `u_radius`, `u_opacity` | low health |
| SHD_RGB_SPLIT | `shaders/rgb_split.frag` | `u_displacement`, `u_time` | combo/fear |
| SHD_STEALTH | `shaders/stealth.frag` | `u_alphaMask` | ghost operative |
| SHD_EMP_DISTORT | `shaders/emp.frag` | `u_waveStrength` | EMP effect |

## 8. UI/UX Asset Spec
- Icon pack vector (SVG) cho ability, objective; export PNG @2x, @3x.
- Layout templates (Figma link) kèm slice naming.

## 9. Version Control & Naming
- Rule: `category_object_variant_v##_ext` (vd `agent_oper_torso_v02.png`).
- Mọi asset update qua branch riêng, PR include changelog (`docs/asset_changelog.md`).
- Texture atlas generation: TexturePacker preset `ta_incident.json` (max size 2048, trim, padding 2).

## 10. Checklist bàn giao
- Sprite sheet: PNG 8-bit, premultiplied alpha off, background transparent.
- Animation: frame index JSON (TexturePacker) hoặc `.aseprite` source.
- Audio: WAV master 48kHz + MP3 320kbps + fallback OGG.
- Shader: GLSL + doc comment (uniform, usage).
- UI: Figma frame annotated, export slice.
- QA: preview screenshot, confirm in-engine test (Phaser preview scene).


## 11. Phân nhóm asset theo chức năng
1. **Game Object Sprite Sheets**
   - Đối tượng động (agents, enemies, boss, pickup) luôn đi kèm sprite sheet đầy đủ cho các trạng thái: idle/move/dash/hit/death.
   - Chuẩn naming: `go_<tên-object>_<action>.png`. Mỗi sheet đi kèm meta JSON mô tả frame order.
   - Animation logic tối đa sử dụng easing từ code, không render baked tween (trừ trường hợp đặc biệt như stealth shimmer).

2. **Projectile Sprite List**
   - Mỗi loại đạn chỉ cần sprite đơn lẻ hoặc clip ngắn; hiệu ứng quỹ đạo/chùm/zoom sẽ do code (`ProjectileBehavior`) điều khiển.
   - Ví dụ: `projectiles/slug.png`, `projectiles/homing.png`. Các effect như trail, glow dùng particle/tint.
   - Quy tắc: sprite trung tính (không glow quá mạnh), code sẽ tint theo weapon/agent.

3. **Tileset – Static Background**
   - Tileset tĩnh phục vụ layout map (`tiles/bg_*`).
   - Gồm category: sàn, tường, cửa, vật trang trí không tương tác.
   - Tile property: `layer=bg` để editor/engine phân tách.

4. **Tileset – Overlay & HUD**
   - Tileset chuyên cho thông tin (health, weapon, score) và decor dynamic (screen hologram, signage).
   - Naming: `tiles/overlay_hud.tsx`, `tiles/overlay_decor.tsx`.
   - Layer recommended: `hud_overlay` (luôn trên player ánh sáng) hoặc `world_overlay` (chịu ảnh hưởng ánh sáng).

5. **Asset Dependency Matrix**
   - Bảng mapping game object → asset cần: ví dụ Agent Ronin cần sprite sheet `AGT_RONIN_*`, icon `HUD_ABILITY_RONIN`, SFX `fx/parry`, shader optional `SHD_STEALTH`.
   - Giúp kiểm soát khi thêm agent/kẻ địch mới.
