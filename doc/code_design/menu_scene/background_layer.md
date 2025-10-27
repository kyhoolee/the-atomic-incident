# MenuScene – BackgroundLayer Detail

## Purpose
- Thiết lập bối cảnh thị giác cho toàn bộ menu, giữ nhịp ánh sáng neon và motion nhẹ để gợi cảm giác "sát thủ thành thị".
- Không chứa logic tương tác; chỉ render hình nền, hiệu ứng ánh sáng, particle nhẹ.

## Components
1. **BackgroundImage** (`Phaser.GameObjects.Image`)
   - Texture: `UI_MENU_BG` (2048x1152), scale theo kích thước màn.
   - Anchor: center. Khi máy có tỉ lệ khác 16:9 → crop hoặc letterbox.

2. **ParallaxPlanes** (`Phaser.GameObjects.TileSprite` hoặc `Image`)
   - Layer 1: silhouette của skyline (scroll speed 0.1).
   - Layer 2: đường neon / traffic (scroll speed 0.2).
   - Update trong `MenuScene.update` để tạo chuyển động hậu cảnh.

3. **AmbientLightOverlay** (`Phaser.GameObjects.Graphics` + shader optional)
   - Gradient radial giả ánh đèn neon.
   - Tùy chỉnh opacity dựa trên `preferencesStore.shadowOpacity`.

4. **ParticleSystem** (`Phaser.GameObjects.Particles.ParticleEmitterManager`)
   - Mưa nhẹ/ bụi dơ lơ lửng: emit rate thấp, additive blend.
   - Off trên mobile low-end (check performance flag).

## Update Logic
- `update(delta)`:
  - Scroll parallax x += speed * delta.
  - Particle manager run automatically.
  - Fade-in/out background khi chuyển scene (Alpha tween trong 250 ms).

## Performance Considerations
- Texture reuse trong atlas UI để giảm draw call.
- Parallax layer disable nếu FPS < 40 (MenuScene check `perfService.shouldSimplify()`).
- Particle count clamp 50.

## Extension Hooks
- Seasonal skin: swap `UI_MENU_BG` + palette.
- Dynamic event banner: overlay additional sprites trong layer này.
