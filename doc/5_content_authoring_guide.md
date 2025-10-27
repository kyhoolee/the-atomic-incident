# Content Authoring Guide — Tilemap & Data Workflow

## 1. Công cụ & Thiết lập
- Phiên bản Tiled khuyến nghị, plugin cần cài (phaser export, navmesh helper).
- Thư mục lưu dự án art, chuẩn export (JSON, embedded tileset hay external).

## 2. Cấu trúc Tilemap
- Layer bắt buộc: `bg`, `walls`, `decor`, `collision-debug`.
- Object layer:
  - `player-spawn`: toạ độ spawn.
  - `pickups`: vùng spawn energy/weapon.
  - `navmesh-shrunken`: polygon cho navmesh.
- Quy ước grid size, origin (Tiled dùng top-left).

## 3. Quy trình tạo map mới
1. Duplicate template `.tmx`.
2. Vẽ layout, đánh dấu walls (remember collision flag).
3. Vẽ navmesh polygon shrink sẵn.
4. Đặt spawn/ pickup objects theo naming rule.
5. Export JSON (Phaser 3 friendly).

## 4. Cấu hình Wave & Enemy
- File config `.json` hoặc `.ts`: format example { waveId, compositions, spawnDelay }.
- Cách thêm enemy mới (type, speed, health, components).

## 5. Weapon & Pickup Data
- Bảng config `weapon-config.ts`: ammo, cooldown, projectile type.
- Hướng dẫn thêm pickup variant (texture key, effect).

## 6. Kiểm tra & Validation
- Checklist sau khi build map: navmesh không bị hở, pickup không trùng player, tile collision ok.
- Script validate (lint map, visualize navmesh) nếu có.

## 7. Handover Cho Dev
- Tên file, vị trí lưu trong repo (`src/resources/tilemaps`).
- Update changelog + thông báo team gameplay.

## 8. Câu hỏi thường gặp
- Cách chỉnh radius navmesh?
- Làm sao test map mới nhanh trong game? (Dev command line, debug menu).
