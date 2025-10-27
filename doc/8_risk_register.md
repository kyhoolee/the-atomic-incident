# Risk Register & Spike Log — The Atomic Incident

| ID | Risk / Spike | Mô tả | Phân loại | Xác suất | Ảnh hưởng | Mitigation | Chủ sở hữu | Trạng thái |
|----|--------------|-------|-----------|----------|-----------|------------|------------|-----------|
| R1 | Lighting Pipeline | Khả năng không đạt FPS khi render occlusion real-time | Technical | Medium | High | Prototype shader, fallback Canvas | TBD | Open |
| R2 | Physics Migration | Matter.js không đáp ứng polygon complex | Technical | Low | High | Spike SAT.js integration, measure performance | TBD | Open |
| R3 | Asset Scope Creep | Yêu cầu art vượt timeline | Production | Medium | Medium | Lock asset list, checkpoint approval | TBD | Open |

## Ghi chú Spike
- **S1 – Lighting Prototype:** Mục tiêu, POC kết quả, link repo.
- **S2 – Navmesh trên Phaser 3:** Kịch bản test, issue gặp.

## Quy trình cập nhật
1. Thêm risk mới → đánh số → mô tả & mitigation rõ.
2. Review mỗi sprint, cập nhật trạng thái (Open, Mitigating, Resolved).
3. Khi Spike hoàn tất, chuyển insight vào Technical Design Doc.

## Liên kết hữu ích
- `doc/2_technical_design.md`
- `doc/6_testing_qa_plan.md`
