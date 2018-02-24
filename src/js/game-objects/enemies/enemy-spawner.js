import Enemy from "./enemy";
import { shuffleArray, weightedPick } from "../../helpers/utilities";
import spawnBattalionWave from "./spawner/spawn-battalion-wave";

// Testing modification: add the type here & define how to spawn it in _spawnWavelet. The spawner
// will cycle through the types from last key through first when spawning.
const { ENEMY_TYPES } = require("../enemies/enemy-info");
const COMPOSITIONS = [
  {
    enemies: { [ENEMY_TYPES.BACTERIA]: 3 },
    weight: 1,
    name: "Bacteria Wave"
  },
  {
    enemies: { [ENEMY_TYPES.WORM]: 3 },
    weight: 2,
    name: "Worm Wave"
  },
  {
    enemies: { [ENEMY_TYPES.BEETLE]: 3 },
    weight: 1,
    name: "Beetle Wave"
  },
  {
    enemies: { [ENEMY_TYPES.VIRUS]: 2 },
    weight: 2,
    name: "Virus Wave"
  },
  {
    enemies: { [ENEMY_TYPES.PARTICLE_TANK]: 3 },
    weight: 1,
    name: "Particle Tank Wave"
  },
  {
    enemies: { [ENEMY_TYPES.AMOEBA]: 1 },
    weight: 1,
    name: "Amoeba Wave"
  }
];

export default class EnemySpawner {
  /**
   * Factory for scheduling and creating enemy groups.
   *
   * @constructor
   * @param {Phaser.Game} game  - Phaser Game instance.
   * @param {Player} player     - Player instance.
   */
  constructor(game, player) {
    this.game = game;
    this._player = player;
    this._mapManager = game.globals.mapManager;
    this._enemies = game.globals.groups.enemies;

    this._waveDifficulty = 1;
    this._waveDifficultyIncrement = 1 / 3;
    this._waveInterval = 5000;
    this._waveletInterval = 750;
    this._remainingWavelets = 0;

    this._timer = this.game.time.create(false);
    this._timer.start();
    this._timer.add(500, this._spawnWave, this);

    // If the last enemy in a wave has been killed, schedule the next wave.
    this._enemies.onEnemyKilled.add(() => {
      if (this._remainingWavelets <= 0 && this._enemies.numberEnemiesAlive() === 0) {
        this._scheduleNextWave();
      }
    });

    // this._spawnSound = this.game.globals.soundManager.add("chiptone/enemy-spawn");
  }

  /**
   * Find a position for the next wavelet, choose the next enemy type,
   * spawn a wavelet, and schedule the next wavelet.
   *
   * @param {*} enemyOrder
   * @param {number} spawnDelay - Time delay between wavelets (in ms).
   */
  _spawnWavelet(enemyOrder, spawnDelay = 250) {
    // Determine the wave positioning
    const radius = this._player.getLightRadius() - 25;

    // Attempt to place in the direction the player is moving
    let spawnAngle = this._player.getVelocity().isZero()
      ? this.game.rnd.realInRange(0, 2 * Math.PI)
      : new Phaser.Point(0, 0).angle(this._player.getVelocity());
    let spawnPosition = this._player.position
      .clone()
      .add(radius * Math.cos(spawnAngle), radius * Math.sin(spawnAngle));

    // Fallback: pick a random angle
    let attempts = 0;
    while (!this._mapManager.isLocationInNavMesh(spawnPosition.x, spawnPosition.y)) {
      spawnAngle = this.game.rnd.realInRange(0, 2 * Math.PI);
      spawnPosition = this._player.position
        .clone()
        .add(radius * Math.cos(spawnAngle), radius * Math.sin(spawnAngle));
      attempts++;
    }
    if (attempts >= 25) {
      console.warn("No valid spawn point found");
      return;
    }

    // Play the enemy spawn sound.
    // this._spawnSound.play();

    // Spawn in cluster around spawn point
    const spawnRadius = 50;
    for (const [i, enemyType] of enemyOrder.entries()) {
      let enemyPosition;
      let attempts = 0;

      // Attempt to find a spawn point nearby the cluster center point
      do {
        const angle = this.game.rnd.realInRange(0, 2 * Math.PI);
        enemyPosition = spawnPosition
          .clone()
          .add(spawnRadius * Math.cos(angle), spawnRadius * Math.sin(angle));
        attempts++;
      } while (
        !this._mapManager.isLocationInNavMesh(enemyPosition.x, enemyPosition.y) &&
        attempts < 25
      );

      if (attempts >= 25) {
        console.warn("Unable to place enemy near spawn point");
        continue;
      }

      if (enemyType in ENEMY_TYPES) {
        this.spawnWithDelay(i * spawnDelay, enemyType, enemyPosition);
      } else {
        console.warn(`Unknown enemy type: ${enemyType}`);
      }
    }

    // Decrease number of remaining wavelets.
    this._remainingWavelets--;
  }

  /**
   * Spawn an enemy
   *
   * @param {number} delay          - Time to wait before spawning the enemy (in ms).
   * @param {ENEMY_TYPES} enemyType - Enemy type to spawn.
   * @param {Phaser.Point} position - World location to spawn the enemy at.
   */
  spawnWithDelay(delay, enemyType, position) {
    this._timer.add(delay, () => {
      Enemy.SpawnWithIndicator(this.game, enemyType, position, this._enemies, 3000);
    });
  }

  /**
   *
   * @param {*} composition
   */
  _generateEnemyOrder(composition) {
    const enemies = [];
    for (const [typeName, numType] of Object.entries(composition.enemies)) {
      enemies.push(...Array(numType).fill(typeName));
    }
    shuffleArray(enemies);
    return enemies;
  }

  /**
   * Schedule the next wave
   */
  _scheduleNextWave() {
    if (this._waveDifficulty % 2 === 0) {
      // If the next wave difficulty is an multiple of 5, it is a special wave.
      this._timer.add(this._waveInterval, this._spawnSpecialWave, this);
    } else {
      // Otherwise, it is a normal wave.
      this._timer.add(this._waveInterval, this._spawnWave, this);
    }
  }

  /**
   * Generate and spawn a wave of enemies, and increment the difficulty.
   */
  _spawnWave() {
    const numWavelets = Math.floor(this._waveDifficulty);
    this._remainingWavelets = numWavelets;

    for (let i = 0; i < numWavelets; i++) {
      const comp = weightedPick(COMPOSITIONS);
      const order = this._generateEnemyOrder(comp);
      this._timer.add(this._waveletInterval * i, () => this._spawnWavelet(order));
    }

    this._waveDifficulty += this._waveDifficultyIncrement;
  }

  /**
   * Generate and spawn a special 'boss' wave, and increment the difficulty.
   */
  _spawnSpecialWave() {
    console.log("a very special wave!");

    spawnBattalionWave(this._player, this._mapManager, this._enemies);

    const numWavelets = Math.floor(this._waveDifficulty);
    this._remainingWavelets = numWavelets;

    // for (let i = 0; i < numWavelets; i++) {
    //   const comp = weightedPick(COMPOSITIONS);
    //   const order = this._generateEnemyOrder(comp);
    //   this._timer.add(this._waveletInterval * i / 4, () => this._spawnWavelet(order));
    // }

    this._waveDifficulty += this._waveDifficultyIncrement;
  }
}
