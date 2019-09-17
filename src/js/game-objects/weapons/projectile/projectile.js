import {
  CollisionLogic,
  ExplodingCollisionLogic,
  PiercingCollisionLogic,
  BouncingCollisionLogic
} from "./collision-logic";

/**
 * Đây là đối tượng projectile - nghĩa là đạn 
 * @class Projectile
 */
export default class Projectile extends Phaser.Sprite {
  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game. - tham chiếu tới đối tượng game chính 
   * @param {number} x - X coordinate in world position. - vị trí của đạn 
   * @param {number} y - Y coordinate in world position. - vị trí của đạn 
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile. - group của viên đạn 
   * @param {Player} player - Reference to Player. - tham chiếu tới player 
   * @param {number} damage - Damage value. - giá trị damage 
   * @param {number} angle - Angle in radians. - góc bắn 
   * @param {number} speed - Speed. - tốc độ đạn 
   * @static - tạo ra viên đạn rocket 
   */
  static makeRocket(game, x, y, parent, player, damage, angle, speed) {
    const key = "assets"; // Key trong khai báo các hình ảnh sprite
    const frame = "weapons/rocket_15"; // Tên tham chiếu tới hình ảnh của viên đạn rocket 
    // Parent của viên đạn chính là vũ khí - không rõ có sự liên hệ cần thiết 
    const bullet = new Projectile(game, x, y, key, frame, parent, player, angle, speed);
    // Viên đạn khởi tạo logic ExplodingCollision khi va chạm 
    bullet.init(new ExplodingCollisionLogic(bullet, damage));
    if (bullet.game) { // Nếu viên đạn tồn tại trong game 
      // Thiết lập các thông số vật lý cho đối tượng body trong sprite của viên đạn 
      // Chỉ mỗi rocket có thiết lập đặc biệt về tốc độ - gia tốc - tốc độ giới hạn 
      // Vận tốc x,y
      bullet.body.velocity.setTo(Math.cos(angle) * speed / 10, Math.sin(angle) * speed / 10);
      // Gia tốc x,y - do viên rocket thì đi ngày càng nhanh - ban đầu start rất chậm 
      bullet.body.acceleration.setTo(Math.cos(angle) * 1000, Math.sin(angle) * 1000);
      // Tốc độ giới hạn - chỉ tăng tốc đến mức nhất định 
      bullet.body.setMaxSpeed(speed);
    }
    return bullet;
  }

  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @param {Player} player - Reference to Player.
   * @param {number} damage - Damage value.
   * @param {number} angle - Angle in radians.
   * @param {number} speed - Speed.
   * @static
   */
  static makeFlame(game, x, y, parent, player, damage, angle, speed, maxAge, color) {
    const key = "assets";
    const frame = "weapons/flame";
    const bullet = new Projectile(game, x, y, key, frame, parent, player, angle, speed);
    bullet.tint = color;
    bullet._setDeathTimer(maxAge);
    // Flames get a randomized drag to slow the bullets over time.
    // Logic chuyển động vật lý là logic drag overtime - khác với logic vật lý của các viên đạn khác 
    //In Arcade Physics friction is how much of one object's movement (0–100%) is transmitted to a second object that's riding it. Drag is acceleration (px/s²) against an object's velocity.
    bullet.body.setDrag(game.rnd.realInRange(0.5, 0.99));
    // Nghĩa là các viên đạn lửa chuyển động ngày càng chậm - nhưng random giữa các viên 

    // Đan lửa đi theo logic va chạm là PiercingCollision 
    bullet.init(new PiercingCollisionLogic(bullet, damage));
    return bullet;
  }

  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @param {Player} player - Reference to Player.
   * @param {number} damage - Damage value.
   * @param {number} angle - Angle in radians.
   * @param {number} speed - Speed.
   * @static
   */
  static makePiercing(game, x, y, parent, player, damage, angle, speed) {
    const key = "assets";
    const frame = "weapons/machine_gun_15";
    const bullet = new Projectile(game, x, y, key, frame, parent, player, angle, speed);
    // Đạn piercing không có logic gì đặc biệt 
    // Đi theo logic va chạm là PiercingCollision 
    bullet.init(new PiercingCollisionLogic(bullet, damage));
    return bullet;
  }

  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @param {Player} player - Reference to Player.
   * @param {number} damage - Damage value.
   * @param {number} angle - Angle in radians.
   * @param {number} speed - Speed.
   * @static
   */
  static makeBouncing(game, x, y, parent, player, damage, angle, speed) {
    const key = "assets";
    const frame = "weapons/bouncing";
    const bullet = new Projectile(game, x, y, key, frame, parent, player, angle, speed);
    bullet.body.setBounce(1);
    bullet.init(new BouncingCollisionLogic(bullet, damage));
    return bullet;
  }

  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @param {Player} player - Reference to Player.
   * @param {number} damage - Damage value.
   * @param {number} angle - Angle in radians.
   * @param {number} speed - Speed.
   * @static đạn nhỏ của súng hơi - nghĩa của từ slug
   */
  static makeSlug(game, x, y, parent, player, damage, angle, speed) {
    const key = "assets";
    const frame = "weapons/slug";
    // Viên đạn cơ bản không có logic vật lý + logic va chạm gì đặc biệt - đi theo logic default
    return this.makeBullet(game, key, frame, x, y, parent, player, damage, angle, speed);
  }

  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @param {Player} player - Reference to Player.
   * @param {number} damage - Damage value.
   * @param {number} angle - Angle in radians.
   * @param {number} speed - Speed.
   * @static
   */
  static makeScatterShot(game, x, y, parent, player, damage, angle, speed) {
    const key = "assets";
    const frame = "weapons/shotgun_15";
    // Viên đạn tỏa chùm cũng không có logic va chạm + logic vật lý gì đặc biệt 
    return this.makeBullet(game, key, frame, x, y, parent, player, damage, angle, speed);
  }

  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @param {Player} player - Reference to Player.
   * @param {number} damage - Damage value.
   * @param {number} angle - Angle in radians.
   * @param {number} speed - Speed.
   * @static
   */
  static makeHomingShot(game, x, y, parent, player, damage, angle, speed) {
    const key = "assets";
    const frame = "weapons/tracking_15";
    // Viên đạn đuổi cũng không có logic gì đặc biệt - về vật lý + va chạm - việc điều hướng đuổi do logic bắn đạn tạo ra 
    // Không nằm ở logic của viên đạn 
    return this.makeBullet(game, key, frame, x, y, parent, player, damage, angle, speed);
  }

  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {string} key - Key for sprite in asset sheet.
   * @param {string} frame - Frame for sprite in asset sheet.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @param {Player} player - Reference to Player.
   * @param {number} damage - Damage value.
   * @param {number} angle - Angle in radians.
   * @param {number} speed - Speed.
   * @static - hàm khởi tạo viên đạn cơ bản - và logic va chạm cơ bản 
   */
  static makeBullet(game, key, frame, x, y, parent, player, damage, angle, speed) {
    const bullet = new Projectile(game, x, y, key, frame, parent, player, angle, speed);
    bullet.init(new CollisionLogic(bullet, damage));
    return bullet;
  }

  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {string} key - Key for sprite in asset sheet.
   * @param {string} frame - Frame for sprite in asset sheet.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @param {Player} player - Reference to Player.
   * @param {number} damage - Damage value.
   * @param {number} angle - Angle in radians.
   * @param {number} speed - Speed.
   * @constructor - Hàm khởi tạo của projectile 
   */
  constructor(game, x, y, key, frame, parent, player, angle, speed) {
    // Gọi hàm khởi tạo của Sprite 
    super(game, x, y, key, frame);
    /**
    * The anchor sets the origin point of the texture.
    * The default (0, 0) is the top left.
    * (0.5, 0.5) is the center.
    * (1, 1) is the bottom right.
    * anchor: Phaser.Point;
    * You can modify the default values in PIXI.Sprite.defaultAnchor.
    */
    this.anchor.set(0.5);

    // Đưa viên đạn vào với parent 
    parent.add(this);

    // player 
    this._player = player;
    // danh sách enemies - để làm 1 số logic về va chạm hay truy đuổi 
    this._enemies = game.globals.groups.enemies;
    // danh sách wall - để làm logic va chạm 
    this._wallLayer = game.globals.mapManager.wallLayer;
    // xoay hình ảnh viên đạn - do ảnh gốc là -PI/2 nên phải cộng thêm về gốc 0
    this.rotation = angle + Math.PI / 2;

    this.deathTimer;

    /**
      this.game.physics.sat = {
      add: this.factory,
      world: this.world
    };
     */
    game.physics.sat.add
      .gameObject(this)
      .setCircle(this.width / 2)
      .setVelocity(speed * Math.cos(angle), speed * Math.sin(angle));
  }

  /**
   * Initialize the logic and ensure the projectile isn't inside a wall to start
   * 
   * @param {any} logic
   * @memberof Projectile
   */
  init(logic) {
    this.collisionLogic = logic;
    if (this.game.physics.sat.world.collide(this, this._wallLayer)) this.destroy();
  }

  update() {
    this.collisionLogic.onBeforeCollisions();

    this.game.physics.sat.world.collide(this, this._wallLayer, {
      onCollide: () => {
        if (this.game) this.collisionLogic.onCollideWithWall();
      }
    });

    if (!this.game) return;

    this.game.physics.sat.world.overlap(this, this._enemies, {
      onCollide: (_, enemy) => {
        if (this.game) this.collisionLogic.onCollideWithEnemy(enemy);
      }
    });

    if (!this.game) return;

    this.collisionLogic.onAfterCollisions();

    // If the bullet isn't moving, destroy it.
    if (this.body && this.body.velocity.getMagnitude() <= 0) {
      this.destroy();
    }
  }

  postUpdate(...args) {
    super.postUpdate(...args); // Update arcade physics

    // If bullet is in shadow, or has travelled beyond the radius it was allowed, destroy it.
    if (this._player._playerLight.isPointInShadow(this.position)) this.destroy();
  }

  _setDeathTimer(maxAge) {
    this.deathTimer = setTimeout(() => {
      this.destroy();
    }, maxAge);
  }

  /**
   * Cleanup functions for this Sprite.
   */
  destroy() {
    if (this.deathTimer) {
      clearTimeout(this.deathTimer);
    }
    super.destroy();
  }
}
