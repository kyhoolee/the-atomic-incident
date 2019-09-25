import Enemy from "./enemy";
import { shuffleArray, weightedPick } from "../../helpers/utilities";
import spawnBattalionWave from "./spawner/spawn-battalion-wave";
import Wave from "../waves/wave";
import logger from "../../helpers/logger";

/**
 * Class hỗ trợ - tăng giảm các giá trị trong khoảng min-max 
 * Chắc dùng để điều chỉnh chỉ số nào đó của Enemy 
 */
class IncrementableValue {
  constructor(min, max, increment) {
    this.min = min;
    this.max = max;
    this.increment = increment;
    this.value = this.min;
  }

  getValue() {
    return this.value;
  }

  incrementValue() {
    this.setValue(this.value + this.increment);
  }

  setValue(newValue) {
    if (newValue > this.max) newValue = this.max;
    if (newValue < this.min) newValue = this.min;
    this.value = newValue;
  }

  resetValue() {
    this.value = this.min;
  }
}

// Testing modification: add the type here & define how to spawn it in _spawnWavelet. The spawner
// will cycle through the types from last key through first when spawning.

/**
 * Các loại enemy - đã comment bên phần enemy-info 
 */
const { ENEMY_TYPES } = require("../enemies/enemy-info");
const COMPOSITIONS = [
  {
    type: ENEMY_TYPES.FOLLOWING,
    number: new IncrementableValue(3, 10, 1),
    weight: 1,
    name: "Following Wave"
  },
  {
    type: ENEMY_TYPES.DASHING,
    number: new IncrementableValue(2, 5, 0.75),
    weight: 1,
    name: "Dashing Wave"
  },
  {
    type: ENEMY_TYPES.PROJECTILE,
    number: new IncrementableValue(1, 4, 0.75),
    weight: 1,
    name: "Projectile Wave"
  },
  {
    type: ENEMY_TYPES.DIVIDING,
    number: new IncrementableValue(1, 3, 0.5),
    weight: 1,
    name: "Dividing Wave"
  }
];
const incrementCompositions = () => COMPOSITIONS.forEach(elem => elem.number.incrementValue());
const resetCompositions = () => COMPOSITIONS.forEach(elem => elem.number.resetValue());

/**
 * Class có vai trò đều đặn generate ra enemy 
 */
export default class EnemySpawner {
  /**
   * Factory for scheduling and creating enemy groups.
   *
   * @constructor
   * @param {Phaser.Game} game  - Phaser Game instance.
   * @param {Player} player     - Player instance.
   */
  constructor(game, player) {
    // 1. đối tượng game 
    this.game = game;
    // 2. đối tượng player 
    this._player = player;
    // 3. đối tượng quản lý map 
    this._mapManager = game.globals.mapManager;
    // 4. đối tượng group-enemy 
    this._enemies = game.globals.groups.enemies;
    // 5. đối tượng điều chỉnh độ khó 
    this._difficultyModifier = game.globals.difficultyModifier;

    // 6.1. Số lượng đợt công kích của enemy thường
    this._numNormalWavelets = new IncrementableValue(1, 30, 1);
    // 6.2. Số lượng đợt công kích của enemy đặc biệt 
    this._numSpecialWavelets = new IncrementableValue(1, 10, 1);

    // 7.1. Số lượng đợt công kích đã tạo ra 
    this._numWavesSpawned = 0;
    // 7.2. Khoảng thời gian giữa 2 đợt công kích 
    this._waveInterval = 5000;
    // 7.3. Khoảng thời gian giữa 2 đợt công kích nhỏ 
    this._waveletInterval = 1750;
    // 7.4. Số đợt công kích còn lại 
    this._remainingWavelets = 0;

    // 8. Bộ timer để lập lịch việc sinh ra các đợt công kích của enemy 
    /**
    * Reference to the core game clock.
    * time: Phaser.Time;
    * This is the core internal game clock.
    * It manages the elapsed time and calculation of elapsed values, 
    * used for game object motion and tweens,
    * and also handles the standard Timer pool.
    * To create a general timed event, 
    * use the master {@link Phaser.Timer} accessible through {@link Phaser.Time.events events}.
    * There are different *types* of time in Phaser:
    * - ***Game time*** always runs at the speed of time in real life.
    *   Unlike wall-clock time, *game time stops when Phaser is paused*.
    *   Game time is used for {@link Phaser.Timer timer events}.
    * - ***Physics time*** represents the amount of time given to physics calculations.
    *
    * Creates a new stand-alone Phaser.Timer object.
    * @param autoDestroy A Timer that is set to automatically destroy itself will do so 
    * after all of its events have been dispatched (assuming no looping events). - Default: true
    * @return The Timer object that was created.
    create(autoDestroy?: boolean): Phaser.Timer;
    */
    /**
    * A Timer is a way to create and manage {@link Phaser.TimerEvent timer events} 
    * that wait for a specific duration and then run a callback.
    * Many different timer events, with individual delays, can be added to the same Timer.
    * 
    * All Timer delays are in milliseconds (there are 1000 ms in 1 second); 
    * so a delay value of 250 represents a quarter of a second.
    * 
    * Timers are based on real life time, adjusted for game pause durations.
    * That is, *timer events are based on elapsed {@link Phaser.Time game time}
    * * and do *not* take physics time or slow motion into account.
    */
    this._timer = this.game.time.create(false);
    this._timer.start();

    /**
    * Adds a new Event to this Timer.
    * 
    * The event will fire after the given amount of `delay` in milliseconds has passed, 
    * once the Timer has started running.
    * The delay is in relation to when the Timer starts, not the time it was added. 
    * If the Timer is already running the delay will be calculated based on the timers current time.
    * 
    * Make sure to call {@link Phaser.Timer#start start} after adding all of the Events you require 
    * for this Timer.
    * 
    * @param delay The number of milliseconds, in {@link Phaser.Time game time}, 
    * before the timer event occurs.
    * @param callback The callback that will be called when the timer event occurs.
    * @param callbackContext The context in which the callback will be called.
    * @param args Additional arguments that will be supplied to the callback.
    * @return The Phaser.TimerEvent object that was created.
    * add(delay: number, callback: Function, callbackContext?: any, ...args: any[]): Phaser.TimerEvent;
    */

    this._timer.add(500, this._scheduleNextWave, this);

    /**
    * Signals are what Phaser uses to handle events and event dispatching.
    * You can listen for a Signal by binding a callback / function to it.
    * This is done by using either `Signal.add` or `Signal.addOnce`.
    * 
    * For example you can listen for a touch or click event from the Input Manager
    * by using its `onDown` Signal:
    * 
    * `game.input.onDown.add(function() { ... });`
    * 
    * Rather than inline your function, you can pass a reference:
    * 
    * `game.input.onDown.add(clicked, this);`
    * `function clicked () { ... }`
    * 
    * In this case the second argument (`this`) is the context in which your function should be called.
    * 
    * Now every time the InputManager dispatches the `onDown` signal (or event), your function
    * will be called.
    * 
    * Multiple callbacks can be bound to the same signal.
    * They're ordered first by their `priority` arguments and then by the order in which they were added.
    * If a callback calls {@link Phaser.Signal#halt halt} or returns `false`, any remaining callbacks are skipped.
    * 
    * Very often a Signal will send arguments to your function.
    * This is specific to the Signal itself.
    * If you're unsure then check the documentation, or failing that simply do:
    * 
    * `Signal.add(function() { console.log(arguments); })`
    * 
    * and it will log all of the arguments your function received from the Signal.
    * 
    * Sprites have lots of default signals you can listen to in their Events class, such as:
    * 
    * `sprite.events.onKilled`
    * 
    * Which is called automatically whenever the Sprite is killed.
    * There are lots of other events, see the Events component for a list.
    * 
    * As well as listening to pre-defined Signals you can also create your own:
    * 
    * `var mySignal = new Phaser.Signal();`
    * 
    * This creates a new Signal. You can bind a callback to it:
    * 
    * `mySignal.add(myCallback, this);`
    * 
    * and then finally when ready you can dispatch the Signal:
    * 
    * `mySignal.dispatch(your arguments);`
    * 
    * And your callback will be invoked. See the dispatch method for more details.
    */
    this.onWaveSpawn = new Phaser.Signal();

    // If the last enemy in a wave has been killed, schedule the next wave.
    this._enemies.onEnemyKilled.add(() => {
      if (this._remainingWavelets <= 0 && this._enemies.numberEnemiesAlive() === 0) {
        this._scheduleNextWave();
      }
    });

    resetCompositions();
  }

  /**
   * 
   */
  _getDifficultyFraction() {
    return Phaser.Math.mapLinear(this._numWavesSpawned, 0, 20, 0, 1);
  }

  /**
   * Find a position for the next wavelet, choose the next enemy type,
   * spawn a wavelet, and schedule the next wavelet.
   *
   * @param {*} enemyOrder
   * @param {number} spawnDelay - Time delay between wavelets (in ms).
   */
  _spawnWavelet(enemyOrder, spawnDelay = 50) {
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
      logger.warn("No valid spawn point found");
      return;
    }

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
        logger.warn("Unable to place enemy near spawn point");
        continue;
      }

      if (enemyType in ENEMY_TYPES) {
        this.spawnWithDelay(i * spawnDelay, enemyType, enemyPosition);
      } else {
        logger.warn(`Unknown enemy type: ${enemyType}`);
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
   * Lập lịch cho đợt công kích tiếp theo 
   */
  _scheduleNextWave() {
    // Tăng số lượng đợt công kích đã tạo ra 
    this._numWavesSpawned++;
    // Thông báo event đợt công kích diễn ra 
    this.onWaveSpawn.dispatch(this._numWavesSpawned);

    // Nếu đợt công kích lần này là bội số của 4 thì đây là một đợt công kích động biệt 
    if (this._numWavesSpawned % 4 === 0) {
      // If the next wave difficulty is an multiple of 5, it is a special wave.
      this._timer.add(this._waveInterval, this._spawnSpecialWave, this);
    } else {
      // Hoặc không thì là một đợt công kích bình thường 
      // Otherwise, it is a normal wave.
      this._timer.add(this._waveInterval, this._spawnWave, this);
    }

    incrementCompositions();
    this._difficultyModifier.setDifficultyByFraction(this._getDifficultyFraction());
  }

  /**
   * Generate and spawn a wave of enemies, and increment the difficulty.
   * Sinh ra một đợt công kích và tăng độ khó 
   */
  _spawnWave() {
    // Số lượng đợt công kích con = số lượng đợt công kích con bình thường 
    const numWavelets = Math.floor(this._numNormalWavelets.getValue());
    // Số lượng đợt công kích con còn lại 
    this._remainingWavelets = numWavelets;

    // Với mỗi đợt công kích con 
    for (let i = 0; i < numWavelets; i++) {
      // Chọn ra ngẫu nhiên theo trọng số 1 loại enemy 
      const comp = weightedPick(COMPOSITIONS);
      // Lấy ra số lượng enemy 
      const num = Math.floor(comp.number.getValue());
      // Tạo ra 1 array toàn enemy cùng loại trên 
      const enemies = Array(num).fill(comp.type);
      // Lập lịch sinh ra loại đợt công kích con với array enemy trên 
      this._timer.add(this._waveletInterval * i, () => this._spawnWavelet(enemies));
    }
    // Tăng số lượng đợt công kích con lên 
    this._numNormalWavelets.incrementValue();
  }

  /**
   * Generate and spawn a special 'boss' wave, and increment the difficulty.
   * Sinh ra 1 đợt công kích đặc biêt - sinh ra các con boss - các loại enemy đặc biệt cần có súng xuyên giáp 
   */
  _spawnSpecialWave() {
    // Số lượng đợt công kích con chính là số lượng enemy của đợt công kích 
    const numWavelets = Math.floor(this._numSpecialWavelets.getValue());
    this._remainingWavelets = numWavelets;

    for (let i = 0; i < numWavelets; i++) {
      // Mỗi lần sinh ra enemy thì giảm số lượng remainingWavelets
      this._timer.add(this._waveletInterval * i, () => {
        spawnBattalionWave(this._player, this._mapManager, this._enemies);
        this._remainingWavelets--;
      });
    }

    // Sau mỗi lần sinh 1 đợt công kích con thì tăng giá trị lên - nghĩa là càng về sau thì số lượng enemy tăng lên 
    this._numSpecialWavelets.incrementValue();
  }

  destroy() {
    this.onWaveSpawn.dispose();
  }
}
