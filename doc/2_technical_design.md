# Technical Design Document — The Atomic Incident (Phaser 3)

## 1. Mục tiêu kỹ thuật
- Yêu cầu hiệu năng (FPS mục tiêu ≥ 60 trên desktop, ≥ 45 trên mobile), hỗ trợ Canvas/WebGL fallback, bundle < 5 MB trước gzip.
- Tiêu chí chất lượng: code modular, dễ plug-in công nghệ mới, coverage tối thiểu 60% cho core logic, CI lint/test bắt buộc.

## 2. Kiến trúc tổng thể
- Scene graph: `BootScene` → `LoadScene` → `MenuScene` → `ContractScene` (Play) → `GameOverScene`.
- Module chính: `GameLoop`, `MobX Stores`, `LightingSystem`, `EnemyAI`, `ObjectiveSystem`, `HUDLayer`, `AudioEngine`, `InputAdapter`.
- Communication guideline: sự kiện bọc trong `EventBus` (Phaser Events) + MobX autorun cho sync preferences; Scene inject service qua constructor parameter hoặc singleton registry.

## 3. Hệ thống Gameplay Core
### 3.1 Player Controller
- `InputAdapter` hợp nhất keyboard/mouse + mobile joysticks.
- `MovementController` xử lý gia tốc, drag, dash; expose API `applyAbilityModifier` để agent class cắm kỹ năng (slide, roll...).
- `WeaponManager` sử dụng interface `IWeapon` (fire, isAbleToAttack, fillAmmo), `ProjectileFactory` pooling theo type.

### 3.2 Enemy Framework
- Entity `Enemy` implement component pattern (`IEnemyComponent.update/destroy`).
- `NavMeshService` trừu tượng hóa thư viện navmesh (phaser-navmesh hoặc custom).
- `DifficultyModifier` phát tín hiệu (Phaser.Signal/MobX) cho các component subscribe.

### 3.3 Wave & Objective
- `WaveScheduler` quản lý spawn queue, binding contract objective.
- `ObjectiveSystem` interface `IObjective` (init, update, isCompleted, onFail).
- Alert/stealth meter hook vào `EnemySpawner` và `LightingSystem` (để spawn reinforcement).

## 4. Lighting & Rendering Pipeline
### 4.1 Interfaces & Adapter Pattern
Để dễ thử nghiệm nhiều giải pháp, định nghĩa interface chung:
```ts
interface LightingAdapter {
  init(config: LightingConfig): void;
  addLight(options: LightOptions): LightHandle;
  removeLight(handle: LightHandle): void;
  setShadowOpacity(value: number): void;
  isPointInShadow(worldPoint: Phaser.Point): boolean;
  update(delta: number): void;
  destroy(): void;
}
```
- `LightingConfig`: thông số chung (canvas size, walls, debug mode).
- `LightHandle`: ID để update position, radius.
- `LightAdapterFactory` nhận tham số `"renderTexture" | "phaserLights" | "thirdParty"` để tạo adapter tương ứng.

### 4.2 Candidate Solutions
| Adapter ID | Mô tả | Ưu | Nhược | KPI cần đo |
|------------|-------|----|-------|-----------|
| renderTexture | RenderTexture + shader mask custom | Toàn quyền kiểm soát bóng | Tốn CPU khi nhiều ray | FPS, CPU time, GC |
| phaserLights | Phaser 3 built-in Light2D + occluder | Tích hợp sẵn WebGL | Khó đáp ứng che tường tùy biến | FPS, draw calls |
| hybrid | mix renderTexture (for occlusion) + built-in post-processing | Cân bằng | Phức tạp | FPS, GPU frame time |

Sử dụng `LightingBenchmarkScene` load 0/25/50/100 enemy + 1/3/5 lights → log khuynh hướng FPS.

### 4.3 Post-processing
- Interface tương tự `PostProcessingAdapter` (`applyDamageEffect`, `setHealth`, `update`). Cho phép thử WebGL pipeline vs Canvas.

## 5. Physics & Collision
### 5.1 Adapter Interface
```ts
interface PhysicsAdapter {
  init(scene: Phaser.Scene, config: PhysicsConfig): void;
  addPlayer(entity: GameObject): PhysicsBodyHandle;
  addEnemy(entity: GameObject, options: BodyOptions): PhysicsBodyHandle;
  addProjectile(entity: GameObject, options: BodyOptions): PhysicsBodyHandle;
  addTilemapCollision(layer: Phaser.Tilemaps.StaticTilemapLayer): void;
  update(delta: number): void;
  debugDraw(graphics: Phaser.GameObjects.Graphics): void;
  destroy(): void;
}
```
- Cài đặt candidate: `MatterAdapter`, `SATAdapter` (dựa trên sat.js custom), `ArcadeHybrid`.
- `PhysicsBenchmarkHarness` spawn số lượng entity tăng dần, đo collision cost, tính chính xác (penetration max).

### 5.2 Collision Strategy
- Dùng `CollisionResolver` tách logic onHit/onOverlap → không phụ thuộc engine.
- `HitboxDebugger` cho phép hiển thị toggle.

## 6. Data & Config
- Cấu hình runtime trong `config/` (TypeScript `.ts` export const) để hỗ trợ intellisense.
- `WeaponConfig`, `EnemyConfig`, `AgentConfig`, `ObjectiveConfig`.
- `PreferenceStore` MobX sync localStorage.

## 7. Asset Loading Pipeline
- `AssetManifest` (JSON) liệt kê key, path, type.
- `FontLoader` fallback: FontFaceObserver cho desktop, DynamicFont loader cho mobile nếu cần.
- Versioning: hash file name, script update service worker (nếu build progressive web app).

## 8. Tooling & Code Standards
- Build: Vite + TypeScript 5, ESLint (airbnb extend), Prettier, Husky pre-commit.
- Docs generator: typedoc cho core module.
- Git flow: trunk-based hoặc GitHub flow + Conventional Commits.

## 9. Testing Chi tiết
- Unit: Vitest + `happy-dom` mô phỏng; mock `LightingAdapter` và `PhysicsAdapter`.
- Integration: Playwright (desktop), Appium (mobile) → test input adapter.
- Performance automation: script `npm run bench` chạy `LightingBenchmarkScene` + Puppeteer log FPS.

## 10. Rủi ro & Quyết định treo
- Lighting pipeline final decision pending benchmark.
- Physics engine selection pending spike.
- Mobile control feel: cần test sớm.
- Asset streaming (lazy load) hay preload toàn bộ?

## 11. Benchmark Harness Design
Định nghĩa khung benchmark để so sánh adapter:
```ts
interface BenchmarkScenario {
  name: string;
  setup(scene: Phaser.Scene, adapters: AdapterSuite): Promise<void>;
  run(durationMs: number): Promise<BenchmarkResult>;
}

interface AdapterSuite {
  lighting: LightingAdapter;
  physics: PhysicsAdapter;
  postProcessing: PostProcessingAdapter;
}

interface BenchmarkResult {
  avgFps: number;
  minFps: number;
  maxFps: number;
  cpuTimeMs: number;
  gpuTimeMs?: number;
}
```
- `BenchmarkRunner` chạy lần lượt các scenario (idle, 25 enemy, 50 enemy + projectiles, 100 enemy + explosions).
- Xuất JSON/CSV để so sánh.

## 12. Implementation Notes
- Adapter pattern giúp thay thế công nghệ mà không chạm gameplay logic.
- Khi spike xong, cập nhật `AdapterFactory` để lock lựa chọn, nhưng giữ interface cho tương lai.
- Log instrumentation: dùng `performance.now()`, WebGL debug extension để ghi GPU time nếu khả thi.

