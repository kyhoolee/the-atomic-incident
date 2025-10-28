import phaserTiledHull from "phaser-tiled-hull/src/library"; // Allows us to babelify ourselves
import NavMeshPlugin from "phaser2-navmesh/dist/phaser2-navmesh-plugin";

/**
 * A class parsing a map and exposing a navmesh, tilemap, wall layer and array of walls for the rest
 * of the game to use.
 *
 * The map must:
 * 1) Use a common set of tileset images: Image name: "tiles", Phaser key: "tiles"
 * 2) Use two Tiled layers called: "bg" and "walls"
 * 3) Have a navmesh named "navmesh-shrunken"
 *
 * @class MapManager
 */
export default class MapManager {
  /**
   * Creates an instance of MapManager.
   *
   * @param {Phaser.Game} game
   * @param {string} tilemapKey Key for the Tiled tilemap in Phaser's cache
   * @param {Phaser.Group} bgGroup Group to which to add the background Tiled layers
   * @param {Phaser.Group} fgGroup Group to which to add the foreground Tiled layers
   *
   * @memberOf MapManager
   */
  constructor(game, tilemapKey, bgGroup, fgGroup) {
    this.game = game;
    this._navMeshPlugin = game.plugins.add(NavMeshPlugin);

    // Load the map from the Phaser cache
    const tilemap = game.add.tilemap(tilemapKey);

    // Set up the tilesets. First parameter is name of tileset in Tiled and
    // second paramter is name of tileset image in Phaser's cache
    const wallTileset = tilemap.addTilesetImage("tiles", "tiles");

    // Create the background and wall layers
    const layerWidth = tilemap.widthInPixels;
    const layerHeight = tilemap.heightInPixels;
    tilemap.createLayer("bg", layerWidth, layerHeight, bgGroup);
    const wallLayer = tilemap.createLayer("walls", layerWidth, layerHeight, fgGroup);

    // Set up collisions in wall layer
    tilemap.setCollisionBetween(
      wallTileset.firstgid,
      wallTileset.firstgid + wallTileset.total,
      true,
      wallLayer
    );

    this.tilemap = tilemap;
    this.wallLayer = wallLayer;
    this.walls = this._calculateWalls(wallLayer);
    this.navMesh = this._navMeshPlugin.buildMeshFromTiled(
      "walls-mesh",
      tilemap.objects["navmesh-shrunken"],
      12.5
    );
  }

  /**
   * Parses the "pickup" object layer from the tilemap and returns an array of points
   *
   * @returns {Phaser.Point[]}
   * @memberof MapManager
   */
  getPickupLocations() {
    const pickups = this.tilemap.objects["pickups"] || [];
    return pickups.map(
      pickup => new Phaser.Point(pickup.x + pickup.width / 2, pickup.y + pickup.height / 2)
    );
  }

  /**
   * Check if the position (in world, pixel coordinates) in the tilemap is empty. This specifically
   * checks the wall layer, where all the colliding tiles are.
   *
   * @param {number} x Pixel coordinates
   * @param {number} y Pixel coordinates
   * @returns {boolean}
   * @memberof MapManager
   */
  isLocationEmpty(x, y) {
    const map = this.tilemap;
    const checkTile = map.getTileWorldXY(x, y, map.tileWidth, map.tileHeight, this.wallLayer, true);
    // Null is returned for invalid locations
    if (checkTile === null) return false;
    // Index of -1 is an empty tile
    if (checkTile.index === -1) return true;
    else return false;
  }

  /**
   * Check if the position (in tile coordinates) in the tilemap is empty. This specifically
   * checks the wall layer, where all the colliding tiles are.
   *
   * @param {number} x Tile location
   * @param {number} y Tile location
   * @returns {boolean}
   * @memberof MapManager
   */
  isTileEmpty(tileX, tileY) {
    const map = this.tilemap;
    const checkTile = map.getTile(tileX, tileY, this.wallLayer, true);
    // Null is returned for invalid locations
    if (checkTile === null) return false;
    // Index of -1 is an empty tile
    if (checkTile.index === -1) return true;
    else return false;
  }

  isLocationInNavMesh(x, y) {
    const map = this.tilemap;
    // Check if the tile is occupied
    const checkTile = map.getTileWorldXY(x, y, map.tileWidth, map.tileHeight, this.wallLayer);
    if (checkTile !== null) return false;
    // Check if the location is inside the navmesh
    const meshRects = map.objects["navmesh-shrunken"] || [];
    for (const r of meshRects) {
      if (!r.rectangle) continue;
      if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) return true;
    }
    return false;
  }

  /**
   * Calculate an array of walls for lighting calculations
   *
   * @param {Phaser.TilemapLayer} tilemapWallLayer
   * @memberof MapManager
   */
  _calculateWalls(tilemapWallLayer) {
    const hulls = phaserTiledHull(tilemapWallLayer, { checkCollide: true });
    const walls = [];
    for (const wallCluster of hulls) {
      for (const wall of wallCluster) {
        walls.push(wall);
      }
    }
    return walls;
  }
}
