# ContractScene – BackgroundLayer Detail

## Purpose
- Render tilemap và props tĩnh của stage.
- Chuẩn bị dữ liệu collision cho physics/navmesh.

## Components
1. **Tilemap Loader**
   - Load map JSON (`neon_district.json`).
   - Create layers:
     - `bgLayer`: decorative floor, parallax.
     - `midLayer`: props (furniture) không collision.
     - `wallLayer`: collidable tiles.
   - Set depth: bgLayer < midLayer < world objects.

2. **StaticProps Group**
   - `Phaser.GameObjects.Container` chứa sprite tĩnh (bảng hiệu, đèn, smoke emitter).
   - Some props may have animated shader (e.g., neon flicker).

3. **NavMesh Visualization (optional)**
   - Only in debug: draw polygons of navmesh using `Graphics`.

## Initialization Steps
```
const map = this.make.tilemap({ key: stage.tilemapKey })
const tileset = map.addTilesetImage('tiles', stage.tilesetKey)
bgLayer = map.createLayer('bg', tileset)
midLayer = map.createLayer('mid', tileset)
wallLayer = map.createLayer('walls', tileset)
wallLayer.setCollisionByProperty({ collide: true })
physicsAdapter.addTilemapCollision(wallLayer)
navMeshService.load(map.objects['navmesh-shrunken'])
```

## Update Cycle
- Most elements static → no per-frame update.
- Optional: animate ambient props (billboards) via timeline.
- Manage dynamic lighting anchors (static lamp positions) → register to `LightingSystem` once.

## Performance
- Use `setPipeline` minimal, disable depth sort for static layers.
- Precompute tinted variants to avoid runtime tint cost.

## Extension
- Stage-specific environmental hazards: add extra layer (e.g., laser grid) toggled by objective.
- Weather effect: overlay `RainParticle` anchored to BackgroundLayer.
