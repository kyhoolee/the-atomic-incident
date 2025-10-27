# ContractScene – DebugLayer Detail

## Purpose
- Công cụ hỗ trợ dev QA: visualize physics, navmesh, lighting, benchmark metrics.
- Toggle qua phím (ví dụ `U` hoặc dev console).

## Components
1. **HitboxGraphics**
   - Draw physics body outlines (player, enemy, projectiles) bằng `Phaser.GameObjects.Graphics`.
   - Color code: player = cyan, enemy = red, projectile = yellow.
   - Update per frame -> only if debug mode on.

2. **NavMeshDebug**
   - Render triangles/polygons navmesh, neighbor connections.
   - Provided by `navMeshService.enableDebug(graphics)`.

3. **LightingDebug**
   - Show light rays/points used for occlusion.
   - When multiple lights, allow cycle (press `L`).

4. **BenchmarkPanel**
   - Text overlay top-left hiển thị: FPS avg/min, CPU time, GPU time (nếu có), entity counts.
   - Option to export log (press `B`).

5. **EventLogConsole** (optional)
   - Scrollable text for recent events (enemy spawn, objective update).

## Activation Flow
- `DebugSystem.toggle()` → set `debugEnabled` flag.
- When enabled → create graphics if not exist, add to scene.
- When disabled → clear graphics, set visible false to avoid CPU usage.

## Integration
- `PhysicsAdapter` exposes debug draw function to render shapes.
- `LightingAdapter` provides debug points.
- `EnemySpawner` can output spawn points to EventLog.

## Usage Notes
- Not shipped in production: behind dev build flag.
- If need runtime toggle for players (e.g., accessibility), create sanitized version.
