const DEFAULT_MAX_LOG_COLLIDERS = 200;

function createOrGetWindowDebug() {
  if (typeof window === "undefined") return null;
  window.__TAI_DEBUG__ = window.__TAI_DEBUG__ || {};
  window.__TAI_DEBUG__.static = window.__TAI_DEBUG__.static || {};
  return window.__TAI_DEBUG__.static;
}

export default class StaticDebugger {
  constructor(game, mapManager, groups) {
    this.game = game;
    this.mapManager = mapManager;
    this.groups = groups;
    this.enabled = false;
    this.lastSummary = null;
    this.graphics = game.add.graphics(0, 0, groups.debug || groups.foreground);
    this.graphics.visible = false;
    this.graphics.fixedToCamera = false;

    this.navMeshGraphics = game.add.graphics(0, 0, groups.debug || groups.foreground);
    this.navMeshGraphics.visible = false;
    this.navMeshGraphics.fixedToCamera = false;

    this.consoleSnapshot = createOrGetWindowDebug();

    this.log(
      "StaticDebugger initialised. Press 'U' (default binding) to toggle overlay & console snapshot."
    );
  }

  log(...args) {
    // eslint-disable-next-line no-console
    console.log("[StaticDebugger]", ...args);
  }

  toggle() {
    this.enabled = !this.enabled;

    const { wallLayer, navMesh } = this.mapManager;

    if (wallLayer && typeof wallLayer.debug !== "undefined") {
      wallLayer.debug = this.enabled;
    }

    this.graphics.visible = this.enabled;
    this.navMeshGraphics.visible = this.enabled && !!navMesh;

    if (this.enabled) {
      this.drawStaticLayers();
      this.drawObjectLayers();
      this.drawNavMesh();
      this.emitSnapshot();
    } else {
      this.graphics.clear();
      this.navMeshGraphics.clear();
      if (navMesh && navMesh.disableDebug) navMesh.disableDebug();
      if (this.consoleSnapshot) this.consoleSnapshot.snapshot = null;
    }
  }

  drawStaticLayers() {
    const { wallLayer } = this.mapManager;
    if (!wallLayer || !wallLayer.layer) return;

    const data = wallLayer.layer.data || [];
    const colliders = [];

    this.graphics.clear();
    this.graphics.lineStyle(1, 0xff5555, 0.6);
    this.graphics.beginFill(0xff5555, 0.15);

    for (let y = 0; y < data.length; y++) {
      const row = data[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        const tile = row[x];
        if (tile && tile.collides) {
          colliders.push({
            tileX: tile.x,
            tileY: tile.y,
            worldX: tile.worldX,
            worldY: tile.worldY,
            width: tile.width,
            height: tile.height
          });
          this.graphics.drawRect(tile.worldX, tile.worldY, tile.width, tile.height);
        }
      }
    }

    this.graphics.endFill();

    this.lastSummary = this.lastSummary || {};
    this.lastSummary.colliders = {
      count: colliders.length,
      sample: colliders.slice(0, DEFAULT_MAX_LOG_COLLIDERS)
    };
  }

  drawObjectLayers() {
    const { tilemap } = this.mapManager;
    if (!tilemap || !tilemap.objects) return;

    this.graphics.lineStyle(1, 0x55ff55, 0.9);
    Object.keys(tilemap.objects).forEach(layerName => {
      const entries = tilemap.objects[layerName];
      entries.forEach(obj => {
        const width = obj.width || 8;
        const height = obj.height || 8;
        const x = obj.x;
        const y = obj.height ? obj.y - obj.height : obj.y;
        this.graphics.drawRect(x, y, width, height);
      });
    });

    this.lastSummary.objects = Object.keys(tilemap.objects).reduce((acc, key) => {
      acc[key] = tilemap.objects[key].length;
      return acc;
    }, {});
  }

  drawNavMesh() {
    const navMesh = this.mapManager.navMesh;
    if (!navMesh || !navMesh.enableDebug) return;

    const graphics = this.navMeshGraphics;
    navMesh.enableDebug(graphics);
    graphics.clear();
    navMesh.debugDrawMesh({ drawNeighbors: false, drawBounds: false, drawPortals: true });

    if (typeof navMesh.navMesh !== "undefined" && typeof navMesh.navMesh.getPolygons === "function") {
      const polys = navMesh.navMesh.getPolygons();
      this.lastSummary = this.lastSummary || {};
      this.lastSummary.navMesh = {
        polygons: polys ? polys.length : 0
      };
    }
  }

  emitSnapshot() {
    const { tilemap, walls } = this.mapManager;
    const snapshot = {
      tilemap: {
        key: tilemap.key,
        width: tilemap.width,
        height: tilemap.height,
        tileWidth: tilemap.tileWidth,
        tileHeight: tilemap.tileHeight,
        widthInPixels: tilemap.widthInPixels,
        heightInPixels: tilemap.heightInPixels
      },
      colliders: this.lastSummary && this.lastSummary.colliders,
      objects: this.lastSummary && this.lastSummary.objects,
      navMesh: this.lastSummary && this.lastSummary.navMesh,
      walls: walls ? walls.length : 0
    };

    if (this.consoleSnapshot) this.consoleSnapshot.snapshot = snapshot;

    console.groupCollapsed("[StaticDebugger] Snapshot");
    console.table({
      tilemap: `${snapshot.tilemap.width}x${snapshot.tilemap.height} tiles (${snapshot.tilemap.widthInPixels}x${snapshot.tilemap.heightInPixels}px)`,
      tileSize: `${snapshot.tilemap.tileWidth}x${snapshot.tilemap.tileHeight}`,
      colliders: snapshot.colliders ? snapshot.colliders.count : 0,
      walls: snapshot.walls,
      navMeshPolygons: snapshot.navMesh ? snapshot.navMesh.polygons : undefined,
      objectLayers: snapshot.objects
    });
    if (snapshot.colliders && snapshot.colliders.sample.length) {
      console.table(snapshot.colliders.sample.slice(0, 10));
    }
    console.groupEnd();
  }

  destroy() {
    if (this.graphics) this.graphics.destroy();
    if (this.navMeshGraphics) this.navMeshGraphics.destroy();
    const { navMesh } = this.mapManager;
    if (navMesh && navMesh.disableDebug) navMesh.disableDebug();
    if (this.consoleSnapshot) this.consoleSnapshot.snapshot = null;
  }
}
