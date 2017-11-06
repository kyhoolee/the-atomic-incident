import Enemy from "./enemy";
import { shuffleArray } from "../../helpers/utilities";

const ENEMY_TYPES = {
  SMALL: "SMALL",
  BIG: "BIG",
  GREEN_CELL: "GREEN CELL",
  PURPLE_CELL: "PURPLE CELL",
  TEAL_CELL: "TEAL CELL",
  AMOEBA: "AMOEBA",
  BACTERIA: "BACTERIA",
  BEETLE: "BEETLE",
  GORILLA: "GORILLA",
  SNAIL: "SNAIL",
  TURTLE: "TURTLE"
};
const COMPOSITIONS = [
  { [ENEMY_TYPES.SMALL]: 4, [ENEMY_TYPES.BIG]: 0, name: "all small" },
  { [ENEMY_TYPES.SMALL]: 2, [ENEMY_TYPES.BIG]: 1, name: "big + small" }
];
const TEST_COMPOSITION = {
  [ENEMY_TYPES.GREEN_CELL]: 1,
  [ENEMY_TYPES.PURPLE_CELL]: 1,
  [ENEMY_TYPES.TEAL_CELL]: 1,
  [ENEMY_TYPES.AMOEBA]: 1,
  [ENEMY_TYPES.BACTERIA]: 1,
  [ENEMY_TYPES.BEETLE]: 1,
  [ENEMY_TYPES.GORILLA]: 1,
  [ENEMY_TYPES.SNAIL]: 1,
  [ENEMY_TYPES.TURTLE]: 1,
  name: "test"
};

export default class EnemySpawner {
  constructor(game, player) {
    this.game = game;
    this._player = player;
    this._mapManager = game.globals.mapManager;
    this._enemies = game.globals.groups.enemies;

    this._waveDifficulty = 1;
    this._waveInterval = 5000;
    this._waveletInterval = 750;

    this._timer = this.game.time.create(false);
    this._timer.start();
    this._timer.add(500, this._spawnWave, this);
  }

  _spawnWavelet(enemyOrder, angleSpan = Math.PI / 5) {
    // Determine the wave positioning
    const radius = this._player.getLightRadius() - 25;
    const spawnAngle = this._player.getVelocity().isZero()
      ? this.game.rnd.realInRange(0, 2 * Math.PI)
      : new Phaser.Point(0, 0).angle(this._player.getVelocity());

    // Spawn in an arc
    const step = angleSpan / enemyOrder.length;
    const startAngle = spawnAngle - angleSpan / 2;
    for (const [i, enemyType] of enemyOrder.entries()) {
      const enemyAngle = startAngle + step * i;
      const pos = this._player.position
        .clone()
        .add(radius * Math.cos(enemyAngle), radius * Math.sin(enemyAngle));
      if (!this._mapManager.isLocationEmpty(pos.x, pos.y)) continue;
      if (enemyType === ENEMY_TYPES.SMALL) Enemy.MakeTestEnemy(this.game, pos, this._enemies);
      else if (enemyType === ENEMY_TYPES.BIG) Enemy.MakeBig(this.game, pos, this._enemies);
      else if (enemyType === ENEMY_TYPES.GREEN_CELL)
        Enemy.MakeTestEnemy(this.game, "enemies/green-cell", pos, this._enemies);
      else if (enemyType === ENEMY_TYPES.PURPLE_CELL)
        Enemy.MakeTestEnemy(this.game, "enemies/purple-cell", pos, this._enemies);
      else if (enemyType === ENEMY_TYPES.TEAL_CELL)
        Enemy.MakeTestEnemy(this.game, "enemies/teal-cell", pos, this._enemies);
      else if (enemyType === ENEMY_TYPES.AMOEBA)
        Enemy.MakeTestEnemy(this.game, "enemies/amoeba_50", pos, this._enemies);
      else if (enemyType === ENEMY_TYPES.BACTERIA)
        Enemy.MakeTestEnemy(this.game, "enemies/bacteria_50", pos, this._enemies);
      else if (enemyType === ENEMY_TYPES.BEETLE)
        Enemy.MakeTestEnemy(this.game, "enemies/beetle_50", pos, this._enemies);
      else if (enemyType === ENEMY_TYPES.GORILLA)
        Enemy.MakeTestEnemy(this.game, "enemies/gorilla_50", pos, this._enemies);
      else if (enemyType === ENEMY_TYPES.SNAIL)
        Enemy.MakeTestEnemy(this.game, "enemies/snail_50", pos, this._enemies);
      else if (enemyType === ENEMY_TYPES.TURTLE)
        Enemy.MakeTestEnemy(this.game, "enemies/turtle_50", pos, this._enemies);
    }
  }

  _generateEnemyOrder(composition) {
    const enemies = [];
    for (const [typeName, numType] of Object.entries(composition)) {
      enemies.push(...Array(numType).fill(typeName));
    }
    shuffleArray(enemies);
    return enemies;
  }

  _spawnWave() {
    const numWavelets = Math.floor(this._waveDifficulty);

    for (let i = 0; i < numWavelets; i++) {
      // const comp = this.game.rnd.pick(COMPOSITIONS);
      const comp = TEST_COMPOSITION;
      const order = this._generateEnemyOrder(comp);
      this._timer.add(this._waveletInterval * i, () => this._spawnWavelet(order));
    }

    const nextWaveDelay = this._waveletInterval * numWavelets + this._waveInterval;
    this._timer.add(nextWaveDelay, this._spawnWave, this);
    this._waveDifficulty += 1 / 3;
  }
}
