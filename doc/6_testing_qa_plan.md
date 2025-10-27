# Testing & QA Plan — The Atomic Incident

## 1. Mục tiêu QA
- Đảm bảo gameplay ổn định 60 FPS, không crash, không soft-lock.
- Xác minh cơ chế ánh sáng/va chạm chính xác, không phát sinh exploit.

## 2. Phạm vi kiểm thử
- Unit tests (logic core: movement, weapon ammo, difficulty).
- Integration tests (scene flow, lighting + navmesh, pickups).
- UX tests (menu navigation, settings persistence).
- Performance profiling (wave cao nhất, particle spam).

## 3. Công cụ & Hạ tầng
- Unit: Vitest/Jest + ts-node.
- Integration/UI: Playwright/Cypress hoặc Phaser headless harness.
- Performance: Chrome profiler, WebPageTest, custom FPS logger.
- Bug tracking: Jira/Linear/GitHub Issues (quy định template).

## 4. Test Case Library
- Danh sách test case mẫu (ID, mô tả, bước thực hiện, expected result).
- Ma trận combo (vũ khí × enemy × map).

## 5. Automation Strategy
- CI pipeline chạy unit + lint + integration smoke.
- Screenshot diff cho HUD/lighting (nếu khả thi).

## 6. Manual QA Checklist
- Trước build nội bộ: check âm thanh, lighting, HUD, pause/resume, analytics event.
- Regression list trước release.

## 7. Performance Budget
- FPS tối thiểu, draw call limit, memory usage.
- Bản build profiling + metric auto log.

## 8. Bug Lifecycle
- Severity/priority definition, SLA fix, quy trình verify.
- Retest & regression tagging.

## 9. Playtest & Feedback
- Lịch playtest nội bộ, survey câu hỏi.
- Cách record session, thu thập heatmap (nếu implement).

## 10. Tài liệu liên quan
- Link tới build pipeline, analytics spec, risk register.
