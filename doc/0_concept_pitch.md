# Concept Pitch — The Atomic Incident (Phaser 3)

## 1. Bối cảnh & Cảm hứng
- Không khí neo-noir đậm chất John Wick: những vòng lặp săn đuổi, những khúc cua bất ngờ, ánh đèn neon phản chiếu lên nền bê tông ướt, và nhịp súng nổ dồn dập như một bản nhạc techno.
- Game tái hiện cảm giác “gun-fu” liên tục: trượt qua góc hẹp, khóa mục tiêu, tận dụng điểm mù kẻ địch, lăn khỏi tầm nhìn camera rồi phản kích.
- Âm thanh và nhạc nền brutal, heavy beat; mỗi khẩu súng đều gằn lực, tiếng vỏ đạn rơi lanh canh, tiếng thở hổn hển dưới mặt nạ chống độc.

## 2. Đối tượng người chơi
- Những người mê bảng xếp hạng sát thủ, thích cảm giác leo hạng "High Table" bằng kỹ năng và thời gian phản xạ.
- Fan của Contra, Metal Slug, Hotline Miami, roguelite twin-stick; muốn một phiên bản modern, cinematic hơn.
- Thiết bị: desktop (chuột + phím) và mobile (dual virtual joystick: một cho di chuyển, một cho aim/shoot). Hệ điều khiển phải linh hoạt, remap nhanh.

## 3. USP (Unique Selling Points)
- **Dynamic light & blind spot combat**: ánh sáng là tài nguyên sống còn, mở ra/khóa lại tầm nhìn, tạo khoảnh khắc chớp nhoáng đúng chất sát thủ đột kích.
- **Hitman objectives in arcade pace**: mỗi vòng là một hợp đồng riêng (ám sát, phá hủy, đánh cắp, đào tẩu, sinh tồn), kết hợp AI nav-mesh thông minh.
- **Gun ballet**: kho vũ khí đa dạng từ shotgun xòe, rocket nổ, đến đạn homing; combo chain giúp người chơi cảm giác “gun a lot of gun” không nghỉ.
- Khác biệt với twin-stick truyền thống nhờ cơ chế ánh sáng & điểm mù, thay đổi hoàn toàn cách đọc map và chọn góc tiếp cận.

## 4. Pillars (Trụ cột thiết kế)
1. **Light & Blind Spots** — Kiểm soát ánh sáng để dụ, bẫy, hoặc lẩn tránh; game thưởng cho việc đọc điểm mù của cả ta và địch.
2. **Weapon Playground** — Vũ khí/thủ thuật phong phú, combo liên hoàn, cảm giác “brutal but precise”.
3. **Assassin Scenarios** — Chuỗi nhiệm vụ sát thủ dồn dập: target list, pháo hoa, hack, thu thập intel, trốn thoát; mỗi nhiệm vụ thêm một layer vào vòng chơi.
4. **Specialist Operatives** — Dàn sát thủ mở khóa dần với kỹ năng ác chiến: lộn/trườn, đột kích, vô hiệu điểm mù tạm thời, tàng hình chớp nhoáng.

## 5. Scope sơ bộ
- MVP: 1 map xéo góc neon-city với 3 tuyến nhiệm vụ (ám sát mục tiêu, phá hủy server, đào tẩu); 6–7 loại enemy (tháp canh, guard, drone) và kho vũ khí hiện tại.
- Leaderboard toàn cầu theo thời gian hoàn thành hợp đồng + điểm combo; ghi lại highlight (gif) để share.
- Session mục tiêu: 8–12 phút/vòng; meta progression nhẹ (unlock skin, weapon mod) sau mỗi hợp đồng.
- Lộ trình mở rộng: thêm map (bến cảng, rooftop, safehouse), thêm loại mission, boss, gadget (smoke, EMP), tùy biến build (talent tree ngắn).
- Assassin roster roadmap:
  - Giai đoạn 1: Operative cơ bản với dash, slide.
  - Giai đoạn 2: Agent parkour (lộn/trườn, nhảy qua cover), chuyên gia cận chiến.
  - Giai đoạn 3: Ghost operative với tàng hình ngắn hạn, radar 360° (no blind spot) trong thời gian hạn chế.

## 6. Kế hoạch cao cấp
- **Pre-production (2–3 tuần):** Prototype lighting & nav-mesh trên Phaser 3, chốt camera/feel di chuyển, xác định pipeline asset.
- **Vertical Slice (4–6 tuần):** Dựng map đầu, 3 loại enemy chủ lực, 3 weapon core, một contract chơi được end-to-end, nhạc/FX tạm ổn.
- **Production (liên tục):** Thêm content (mission, enemy, weapon), tinh chỉnh AI & difficulty, hoàn thiện UI, nâng cấp animation/sound, chuẩn hóa build đa nền tảng.
- **Polish & Launch (2–3 tuần):** QA toàn diện (desktop + mobile), tối ưu performance, thêm analytics, marketing teaser, phát hành beta + thu feedback.
- **Post-launch:** Chu kỳ cập nhật đưa thêm assassin class mới, mở nhiệm vụ đặc biệt, sự kiện leaderboard.
