import { satSpriteVsTilemap } from "../../helpers/sprite-utilities";

/**
 * Class về loại đạn của enemy 
 * @class Projectile
 */
export default class EnemyProjectile extends Phaser.Sprite {
  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @param {Player} player - Reference to Player.
   * @param {number} damage - Damage value.
   * @param {number} angle - Angle in radians.
   * @param {number} speed - Speed.
   * @constructor
   */
  constructor(game, x, y, parent, player, angle, speed) {
    // gọi hàm tạo của Sprite 
    /**
    * @param game A reference to the currently running game.
    * @param x The x coordinate (in world space) to position the Sprite at.
    * @param y The y coordinate (in world space) to position the Sprite at.
    * @param key This is the image or texture used by the Sprite during rendering. It can be a string which is a reference to the Cache entry, or an instance of a RenderTexture or PIXI.Texture. If this argument is omitted, the sprite will receive {@link Phaser.Cache.DEFAULT the default texture} (as if you had passed '__default'), but its `key` will remain empty.
    * @param frame If this Sprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a string or numeric index.
     */
    super(game, x, y, "assets", "enemies/shooting/bullet");
    // Đưa anchor về giữa 
    this.anchor.set(0.5);
    parent.add(this);

    // player 
    this._player = player;
    // group enemy
    this._enemies = game.globals.groups.enemies;
    // tường 
    this._wallLayer = this.game.globals.mapManager.wallLayer;
    // xoay hình ảnh đi 90 độ 
    this.rotation = angle + Math.PI / 2;

    // Đưa viên đạn vào thế giới physics - là 1 hình tròn - khởi tạo vận tốc theo speed + angle 
    game.physics.sat.add
      .gameObject(this)
      .setCircle(this.width / 2)
      .setVelocity(speed * Math.cos(angle), speed * Math.sin(angle));

    // quan tâm đến việc va chamjvowis tường 
    game.physics.sat.add.overlap(this, this._wallLayer, {
      onCollide: this.onCollideWithWall,
      context: this
    });

    // quan tâm tới việc va chạm với player 
    game.physics.sat.add.overlap(this, this._player, {
      onCollide: this.onCollideWithPlayer,
      context: this
    });
  }

  /**
   * Va chạm với tường thì biến mất 
   */
  onCollideWithWall() {
    this.destroy();
  }

  /**
   * Va chạm với player thì player bị trừ damage và viên đạn biến mất 
   */
  onCollideWithPlayer() {
    this._player.takeDamage();
    this.destroy();
  }
}
