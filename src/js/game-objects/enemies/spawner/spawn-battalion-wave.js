import Enemy from "../enemy";
import logger from "../../../helpers/logger";

const { ENEMY_TYPES } = require("../../enemies/enemy-info");
const { TANK, PROJECTILE } = ENEMY_TYPES;

/*
    Tank (T) and Virus (V) in this formation around the player (p):

                T1
                    V1
    P           T2
                    V2
                T3
*/

// Reusable point objects
const tank2Pos = new Phaser.Point();
const tank1Pos = new Phaser.Point();
const tank3Pos = new Phaser.Point();
const virus1Pos = new Phaser.Point();
const virus2Pos = new Phaser.Point();

/**
 * Sinh ra một đội hình enemy có vị trí tương ứng theo player 
 * Do suy nghĩ rằng đội hình enemy này gây khó khăn cho user nhiều hơn việc sinh ngẫu nhiên vị trí thông thường 
 * @param {player} player 
 * @param {bản đồ} mapManager 
 * @param {group của enemy} enemyGroup 
 * @param {số lần thử sinh enemy} maxAttempts 
 */
export default function spawnBattalionWave(player, mapManager, enemyGroup, maxAttempts = 50) {
  const game = player.game;
  const dist = player.getLightRadius() - 25;
  const playerX = player.position.x;
  const playerY = player.position.y;

  let validSpawnFound = false;
  let attempts = 0;
  while (!validSpawnFound && attempts < maxAttempts) {
    attempts++;

    let angle = game.rnd.realInRange(0, 2 * Math.PI);
    if (attempts === 1 && !player.getVelocity().isZero()) {
      // Attempt to place in the direction the player is moving
      angle = new Phaser.Point(0, 0).angle(player.getVelocity());
    }

    tank1Pos
      .set(dist - 20, -50)
      .rotate(0, 0, angle)
      .add(playerX, playerY);
    if (!mapManager.isLocationInNavMesh(tank1Pos.x, tank1Pos.y)) continue;

    tank2Pos
      .set(dist, 0)
      .rotate(0, 0, angle)
      .add(playerX, playerY);
    if (!mapManager.isLocationInNavMesh(tank2Pos.x, tank2Pos.y)) continue;

    tank3Pos
      .set(dist - 20, 50)
      .rotate(0, 0, angle)
      .add(playerX, playerY);
    if (!mapManager.isLocationInNavMesh(tank3Pos.x, tank3Pos.y)) continue;

    virus1Pos
      .set(dist + 50, -25)
      .rotate(0, 0, angle)
      .add(playerX, playerY);
    if (!mapManager.isLocationInNavMesh(virus1Pos.x, virus1Pos.y)) continue;

    virus2Pos
      .set(dist + 50, 25)
      .rotate(0, 0, angle)
      .add(playerX, playerY);
    if (!mapManager.isLocationInNavMesh(virus2Pos.x, virus2Pos.y)) continue;

    validSpawnFound = true;
  }

  if (!validSpawnFound) {
    logger.warn("No valid spawn point found");
    return;
  }

  Enemy.SpawnWithIndicator(game, TANK, tank1Pos, enemyGroup, 3000);
  Enemy.SpawnWithIndicator(game, TANK, tank2Pos, enemyGroup, 3000);
  Enemy.SpawnWithIndicator(game, TANK, tank3Pos, enemyGroup, 3000);
  Enemy.SpawnWithIndicator(game, PROJECTILE, virus1Pos, enemyGroup, 3000);
  Enemy.SpawnWithIndicator(game, PROJECTILE, virus2Pos, enemyGroup, 3000);
}
