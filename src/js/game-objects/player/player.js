import MovementController from "./movement-controller";
import Controller from "../../helpers/controller.js";
import { checkSatOverlapWithGroup } from "../../helpers/sprite-utilities.js";
import EnergyPickup from "../pickups/energy-pickup";
import PlayerLight from "./player-light";
import Compass from "./compass";
import { MENU_STATE_NAMES } from "../../menu";
import { gameStore } from "../../game-data/observable-stores";
import WeaponManager from "../weapons/weapon-manager";
import SmokeTrail from "./smoke-trail";
import { registerGameOver } from "../../analytics";

const ANIM = {
  MOVE: "MOVE",
  ATTACK: "ATTACK",
  HIT: "HIT",
  DEATH: "DEATH"
};

export default class Player extends Phaser.Sprite {
  /**
* Sprites are the lifeblood of your game, used for nearly everything visual.
* 
* At its most basic a Sprite consists of a set of coordinates and a texture that is rendered to the canvas.
* They also contain additional properties allowing for physics motion (via Sprite.body), input handling (via Sprite.input),
* events (via Sprite.events), animation (via Sprite.animations), camera culling and more. Please see the Examples for use cases.
* 
* @param game A reference to the currently running game.
* @param x The x coordinate (in world space) to position the Sprite at.
* @param y The y coordinate (in world space) to position the Sprite at.
* @param key This is the image or texture used by the Sprite during rendering. It can be a string which is a reference to the Cache entry, or an instance of a RenderTexture or PIXI.Texture. If this argument is omitted, the sprite will receive {@link Phaser.Cache.DEFAULT the default texture} (as if you had passed '__default'), but its `key` will remain empty.
* @param frame If this Sprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a string or numeric index.
*/
  constructor(game, x, y, parentGroup) {
    /**
     * Tạo sprites với hình ảnh từ việc chỉ định key - image và frame - là thành phần trong image sprite-sheet 
     * Tham khảo ví dụ https://phaser.io/examples/v2/animation/local-json-object 
     * Ở đây assets được load ở load-state.js 
     * // Images
    const atlasPath = `resources/atlases`;
    this.load.atlasJSONHash("assets", `${atlasPath}/assets.png`, `${atlasPath}/assets.json`);
     */
    super(game, x, y, "assets", "player/move");
    this.anchor.set(0.5);
    parentGroup.add(this);

    /**
    * Signals are what Phaser uses to handle events and event dispatching.
    * You can listen for a Signal by binding a callback / function to it.
    * This is done by using either `Signal.add` or `Signal.addOnce`.
    * For example you can listen for a touch or click event from the Input Manager by using its `onDown` Signal:
    * `game.input.onDown.add(function() { ... });`
    * Rather than inline your function, you can pass a reference:
    * `game.input.onDown.add(clicked, this);`
    * `function clicked () { ... }`
    * In this case the second argument (`this`) is the context in which your function should be called.
    * Now every time the InputManager dispatches the `onDown` signal (or event), your function will be called.
    * Multiple callbacks can be bound to the same signal.
    * They're ordered first by their `priority` arguments and then by the order in which they were added.
    * If a callback calls {@link Phaser.Signal#halt halt} or returns `false`, any remaining callbacks are skipped.
    * Very often a Signal will send arguments to your function.
    * This is specific to the Signal itself.
    * If you're unsure then check the documentation, or failing that simply do:
    * `Signal.add(function() { console.log(arguments); })`
    * and it will log all of the arguments your function received from the Signal.
    * Sprites have lots of default signals you can listen to in their Events class, such as:
    * `sprite.events.onKilled`
    * Which is called automatically whenever the Sprite is killed.
    * There are lots of other events, see the Events component for a list.
    * As well as listening to pre-defined Signals you can also create your own:
    * `var mySignal = new Phaser.Signal();`
    * This creates a new Signal. You can bind a callback to it:
    * `mySignal.add(myCallback, this);`
    * and then finally when ready you can dispatch the Signal:
    * `mySignal.dispatch(your arguments);`
    * And your callback will be invoked. See the dispatch method for more details.
    */
    this.onDamage = new Phaser.Signal();
    this.onHealthChange = new Phaser.Signal();

    this._compass = new Compass(game, parentGroup, this.width * 0.6);
    this._compass.visible = false;

    this.isDead = false;
    this._isTakingDamage = false;
    this._isDashing = false;

    this._timer = this.game.time.create(false);
    this._timer.start();

    // Shorthand
    const globals = this.game.globals;
    this._enemies = globals.groups.enemies;
    this._pickups = globals.groups.pickups;
    this._postProcessor = globals.postProcessor;
    this._mapManager = globals.mapManager;

    this.weaponManager = new WeaponManager(game, parentGroup, this, this._enemies);

    // Configure player physics
    const points = [[18, 7], [30, 27], [5, 27]].map(p => ({
      x: p[0] - this.width / 2,
      y: p[1] - this.height / 2
    }));
    game.physics.sat.add.gameObject(this).setPolygon(points);
    this.body.collisionAffectsVelocity = false;
    game.physics.sat.add.collider(this, this.game.globals.mapManager.wallLayer);
    this.game.physics.sat.add.overlap(this, this._enemies, {
      onCollide: this._onCollideWithEnemy,
      context: this
    });
    this.game.physics.sat.add.overlap(this, this._pickups, {
      onCollide: this._onCollideWithPickup,
      context: this
    });

    // Lighting for player
    this._playerLight = new PlayerLight(game, this, {
      startRadius: 330,
      minRadius: 175,
      shrinkSpeed: 0
    });

    // Controls
    this._movementController = new MovementController(this);
    this._attackControls = new Controller(this.game.input);
    this._attackControls.addMouseDownControl("attack", Phaser.Pointer.LEFT_BUTTON);

    // Animations
    /**
    * Really handy function for when you are creating arrays of animation data 
    * but it's using frame names and not numbers.
    * For example imagine you've got 30 frames named: 'explosion_0001-large' to 'explosion_0030-large'
    * You could use this function to generate those by doing: 
    * Phaser.Animation.generateFrameNames('explosion_', 1, 30, '-large', 4);
    * 
    * @param prefix The start of the filename. If the filename was 'explosion_0001-large' the prefix would be 'explosion_'.
    * @param start The number to start sequentially counting from. If your frames are named 'explosion_0001' to 'explosion_0034' the start is 1.
    * @param stop The number to count to. If your frames are named 'explosion_0001' to 'explosion_0034' the stop value is 34.
    * @param suffix The end of the filename. If the filename was 'explosion_0001-large' the suffix would be '-large'. - Default: ''
    * @param zeroPad The number of zeros to pad the min and max values with. 
    * If your frames are named 'explosion_0001' to 'explosion_0034' then the zeroPad is 4.
    * @return An array of framenames.
    * static generateFrameNames(
    *   prefix: string, 
    *   start: number, 
    *   stop: number, 
    *   suffix?: string, 
    *   zeroPad?: number): string[];

    */

    const hitFrames = Phaser.Animation.generateFrameNames(`player/hit-flash_`, 0, 29, "", 2);
    const deathFrames = Phaser.Animation.generateFrameNames(`player/death_`, 0, 15, "", 2);

    /**
    * Adds a new animation under the given key. Optionally set the frames, frame rate and loop.
    * Animations added in this way are played back with the play function.
    * 
    * @param name The unique (within this Sprite) name for the animation, i.e. "run", "fire", "walk".
    * @param frames An array of numbers/strings that correspond to the frames to add to this animation and in which order. e.g. [1, 2, 3] or ['run0', 'run1', run2]). If null then all frames will be used.
    * @param frameRate The speed at which the animation should play. The speed is given in frames per second. - Default: 60
    * @param loop Whether or not the animation is looped or just plays once.
    * @param useNumericIndex Are the given frames using numeric indexes (default) or strings? - Default: true
    * @return The Animation object that was created.
    * add(
    *   name: string, 
    *   frames?: number[] | string[], 
    *   frameRate?: number, 
    *   loop?: boolean, 
    *   useNumericIndex?: boolean): Phaser.Animation;
    
    */

    this.animations.add(ANIM.MOVE, ["player/move"], 0, true);
    this.animations.add(ANIM.HIT, hitFrames, 60, false);
    this.animations.add(ANIM.DEATH, deathFrames, 64, false).onComplete.add(() => {
      if (this._gameOverFxComplete) {
        this.onGameOver();
        this.destroy();
      } else {
        this._gameOverFxComplete = true;
      }
    });

    // Player Sound 
    /**
     * // Sound manager
    // Manager.2. Sound-manager - quản lý âm thanh trong game 
    globals.soundManager = new SoundEffectManager(this.game);
    --> được khai báo trong play-state
     */
    this._hitSound = this.game.globals.soundManager.add("fx/player-hit", 0.03);
    this._deathSound = this.game.globals.soundManager.add("fx/player-death", 0.03);
    this._deathSound.onStop.add(() => {
      if (this._gameOverFxComplete) {
        this.onGameOver();
        this.destroy();
      } else {
        this._gameOverFxComplete = true;
      }
    }, this);

    this._gameOverFxComplete = false;

    this._velocity = new Phaser.Point(0, 0);

    this._trail = new SmokeTrail(game, globals.groups.background);
    this._trail.setRate(25);
  }

  update() {
    if (this.isDead) return;

    this._playerLight.update();
    this._movementController.update();
    this._attackControls.update();

    // Update the rotation of the player based on the 
    /**
    * Adds the given x and y values to this Point.
    * 
    * @param x The value to add to Point.x.
    * @param y The value to add to Point.y.
    * @return This Point object. Useful for chaining method calls.
    * static add(a: Phaser.Point, b: Phaser.Point, out?: Phaser.Point): Phaser.Point;
    * Tính ra vị trí của con trỏ chuột tương đối so với vị trí của game-camera - từ đó tính ra vị trí thật của con trỏ chuột trong game
    * Để từ đó so sánh với vị trí của player và tính ra góc xoay cho player 
    */
    let mousePos = Phaser.Point.add(this.game.camera.position, this.game.input.activePointer);
    if (this._movementController._fixedAngle) {
      this.rotation = this._movementController._fixedAngle + Math.PI / 2;
    } else {
      /**
        * Returns the angle between this Point object and another object with public x and y properties.
        * 
        * @param a The object to get the angle from this Point to.
        * @param asDegrees Return a value in radians (false) or degrees (true)?
        * @return The angle, where this Point is the vertex. Within [-pi, pi] or [-180deg, 180deg].
        */
      //static angle(a: Phaser.Point, b: Phaser.Point): number;
      this.rotation = this.position.angle(mousePos) + Math.PI / 2;
    }

    // Shoot.
    if (this._attackControls.isControlActive("attack")) {
      this.weaponManager.fire(this.position.angle(mousePos));
    }

    // "Engine" position trail
    // Tạo ra hiệu ứng cho phần động cơ của player - khi di chuyển thì sẽ nhả ra khói phía sau 
    const mc = this._movementController;
    const angleToEngine = this.rotation + Math.PI / 2;
    const offset = 10 * this.scale.x;
    const enginePosition = this.position
      .clone()
      .add(Math.cos(angleToEngine) * offset, Math.sin(angleToEngine) * offset);
    let newRate = mc.isDashing() ? 300 : mc.getSpeedFraction() * 30;
    this._trail.setEmitPosition(enginePosition.x, enginePosition.y);
    this._trail.setRate(newRate);



    const health = this._playerLight.getLightRemaining();
    this._postProcessor.onHealthUpdate(health);
  }

  getHealth() {
    return this._playerLight.getLightRemaining();
  }

  getLightRadius() {
    return this._playerLight.getRadius();
  }

  getVelocity() {
    return this.body ? this.body.velocity : new Phaser.Point(0, 0);
  }

  postUpdate(...args) {
    // Update components after the player
    this._playerLight.centerOnPlayer();
    this._compass.repositionAt(this.position, this.rotation);

    super.postUpdate(...args);
  }

  takeDamage() {
    // If player is already taking damage, nothing else to do
    if (this._isTakingDamage || this.isDead) return;

    this._postProcessor.onPlayerDamage();
    this.game.globals.audioProcessor.runLowPassFilter(500);

    this._playerLight.incrementRadius(-50);
    this.onHealthChange.dispatch(this.getHealth());

    if (this._playerLight.getLightRemaining() <= 0) {
      // If the player has died, play the death sound/animation.
      // The onGameOver callback will be called once the sound/animation has completed.
      this._deathSound.play();
      this.animations.play(ANIM.DEATH);
      this.isDead = true;
      this.body.destroy();
      this.weaponManager.destroy();
    } else {
      this._hitSound.play();
      this._isTakingDamage = true;
      // this._movementController.startBoost();

      this.animations.play(ANIM.HIT).onComplete.addOnce(() => {
        this._isTakingDamage = false;
        // this._movementController.stopBoost();
        this.animations.play(ANIM.MOVE);
      });
    }

    this.onDamage.dispatch();
  }

  onGameOver() {
    // If the player has died, reset the camera, show the Game Over menu, and pause the game.
    this.game.camera.reset(); // Kill camera shake to prevent restarting with partial shake
    gameStore.setMenuState(MENU_STATE_NAMES.GAME_OVER);
    gameStore.updateHighScore();
    registerGameOver(gameStore.score);
    // TODO(rex): Player death animation and something interactive, instead of just pausing the game...
    gameStore.pause();
  }

  setInvulnerability(invulnerableState) {
    this._invulnerable = invulnerableState;
    this.alpha = invulnerableState ? 0.25 : 1;
  }

  _onCollideWithEnemy(self, enemy) {
    if (!this._invulnerable && !this._isTakingDamage) {
      this.takeDamage();
    }
  }

  _onCollideWithPickup(self, pickup) {
    if (pickup instanceof EnergyPickup) {
      this._playerLight.incrementRadius(pickup.getEnergy());
      this.onHealthChange.dispatch(this.getHealth());
    }
    pickup.pickUp();
  }

  destroy(...args) {
    this.onDamage.dispose();
    this._timer.destroy();
    this.game.tweens.removeFrom(this);
    this._compass.destroy();
    super.destroy(...args);
  }
}
