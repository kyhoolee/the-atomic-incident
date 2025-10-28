# Implementation Checklist (Phaser 3 Rewrite)

Thứ tự ưu tiên cho phần nền (support) trước khi build gameplay chi tiết.

1. **Hạ tầng chung**
   - Event/Signal wrapper nếu cần.
   - InputAdapter cho keyboard/mouse + mobile.
   - Loader stage/tilemap và config type (StageConfig, MenuSelection).

2. **Physics & Collision Layer**
   - Hoàn thiện `PhysicsAdapter` (tạm Arcade nhưng tách abstraction).
   - `CollisionResolver` + pipeline damage/gadget/knockback.

3. **Damage & Status Core**
   - `DamageSystem` xử lý shield/critical, hook `StatusEffectSystem`.
   - `StatusEffectSystem` + catalog effect (burn, slow, stealth...).

4. **Lighting System**
   - Adapter render texture + occlusion, `isPointInShadow`.
   - Debug overlay, prototype benchmark (1/3/5 light + nhiều enemy).

5. **Spawn/Navmesh Services**
   - `NavMeshService` load polygon từ tilemap.
  - `EnemySpawner` + Alert hooks, scheduler.

6. **Projectile/Weapon Framework**
   - `ProjectileManager`, behavior strategy (linear, bounce, homing, rocket...).
  - Weapon interface cho player/enemy, effect pipeline.

7. **Alert/Gadget/Combo Subsystems**
   - (Tuỳ mức ưu tiên) – chuẩn bị API cho sau này.

8. **HUD Base Services**
   - Binding `gameStore` / preferences cho UI (score, alert meter, radar).

Sau mỗi module nên dựng scene test riêng (lighting test, physics test, projectile test...) để verify trực quan trước khi tích hợp vào `ContractScene`.
