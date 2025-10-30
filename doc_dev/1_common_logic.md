# Common Infrastructure Specification

## 1. Event / Signal Wrapper (optional but recommended)
- **Mục tiêu:** thống nhất cơ chế phát / lắng nghe sự kiện giữa các module (scene, systems, UI) mà không phụ thuộc trực tiếp vào `Phaser.Signal` hay EventEmitter cụ thể.
- **Đề xuất implementation:**
  - `EventBus` class nhỏ gọn dựa trên `Phaser.Events.EventEmitter` hoặc `mitt`.
  - API chính:
    ```ts
    interface EventBus {
      emit<T>(event: string, payload?: T): void;
      on<T>(event: string, handler: (payload: T) => void, context?: any): () => void;
      once<T>(event: string, handler: (payload: T) => void, context?: any): void;
      off<T>(event: string, handler: (payload: T) => void, context?: any): void;
    }
    ```
  - Nên export singleton cho các hệ thống chung (`gameEvents`) và có thể tạo instance riêng trong scene.
  - Tài liệu mapping các event key: `GameEvents.Player.Damage`, `GameEvents.Spawn.WaveStarted`...
  - Dễ dàng thay backend (ví dụ dùng MobX, RxJS) mà không refactor gameplay.

## 2. InputAdapter
- **Mục tiêu:** hợp nhất input từ keyboard, mouse, gamepad, mobile touch vào một luồng control rõ ràng.
- **Kiến trúc:**
  - `InputAdapter` quản lý đăng ký “actions” (move, aim, fire, dash…).
  - Cho phép binding nhiều nguồn input vào cùng action.
  - Phát sự kiện / callback mỗi frame (`update(delta)`).
- **API gợi ý:**
  ```ts
  interface InputAdapter {
    init(scene: Phaser.Scene): void;
    registerAction(action: InputAction, config: ActionConfig): void;
    on(action: InputAction, handler: (state: ActionState) => void): void;
    update(delta: number): void;
    destroy(): void;
  }
  ```
- **ActionState:**
  - `digital` (pressed/released)
  - `analog` (vector for movement/aim)
  - `pointer` (position, pointer events)
- **Desktop bindings:**
  - Movement: WASD / arrow keys → vector2.
  - Aim: mouse position relative to camera.
  - Fire: LMB hold; alt fire (RMB) reserved.
  - Dash/Ability/Gadget: keyboard (Space/Q/E) + controller buttons.
- **Mobile bindings:**
  - Left virtual joystick (movement), right joystick (aim + fire).
  - On-screen buttons (dash, ability, gadget, pause).
  - Gesture helper (swipe stage select, tap HUD).
- **Implementation Tips:**
  - Tách `DeviceInputSource` (KeyboardSource, PointerSource, GamepadSource, TouchSource).
  - `InputAdapter` hợp nhất state, ưu tiên analog > digital (nếu cả controller và keyboard dùng cùng lúc).
  - Cung cấp API để UI đọc state (cho highlight active button). 

## 3. Loader Stage / Tilemap & Config Types
- **Mục tiêu:** load tilemap, navmesh, thông tin stage một cách data-driven.

### 3.1 Stage Config
- Định nghĩa `StageConfig` cho từng map:
  ```ts
  interface StageConfig {
    id: string;
    displayName: string;
    tilemapKey: string;
    tilesetKey: string;
    tilemapUrl: string;
    navmeshKey?: string;
    spawnPoints: {
      player: Phaser.Math.Vector2;
      pickups?: Phaser.Math.Vector2[];
      scripted?: Record<string, Phaser.Math.Vector2>;
    };
    lightingProfile: string;
    enemyWaveConfig: string; // key file JSON
    description?: string;
    tags?: string[]; // stealth-heavy, verticality...
  }
  ```
- Lưu danh sách stage trong `src/config/stages.ts` hoặc file JSON → import thành data.

### 3.2 MenuSelection & Runtime Data
- Đã có `MenuSelection`, cần bổ sung meta (ví dụ chosen gadget loadout) nếu cần.
- Stage loader lấy `MenuSelection.stageId` → StageConfig.

### 3.3 Loader Pipeline trong ContractScene
- `StageLoader` service chịu trách nhiệm:
  1. Preload asset: tilemap JSON, tileset PNG, navmesh JSON.
  2. Khi `ContractScene.createWorld()` gọi: parse tilemap, tạo layers (`bg`, `decor`, `wall`).
  3. Thiết lập collision bằng `PhysicsAdapter`.
  4. Gửi walls polygon cho `LightingSystem` và path polygon cho `NavMeshService`.
  5. Cung cấp convenience method `StageLoader.getSpawnPoint('player')`.
- Hỗ trợ caching: load asset 1 lần, reuse giữa các contract.

### 3.4 File Organization
- `src/config/stages.ts` – danh sách StageConfig (import asset path via `new URL('../assets/...', import.meta.url)` trong Vite).
- `src/gameplay/world/StageLoader.ts` – class xử lý load + build tilemap.
- Tilemap/tileset đặt ở `public/assets/tilemaps/` hoặc `src/assets/` depending Vite config.

### 3.5 Testing
- Viết scene thử `StagePreviewScene` load stage config, vẽ tilemap + navmesh overlay.
- Kiểm tra spawn point, collisions, lighting occluder.

## 4. Deliverables
- `src/core/events/EventBus.ts`
- `src/core/input/InputAdapter.ts` + sources + action definitions
- `src/config/stages.ts` + sample stage config
- `src/gameplay/world/StageLoader.ts`
- Scaffolding test scene(s) và unit test tối thiểu cho InputAdapter logic (optional).

Sau khi hoàn thành, có thể tiến lên bước 2 (Physics & Collision) với nền Input/Stage sẵn sàng.
