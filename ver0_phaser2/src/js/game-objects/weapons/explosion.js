const prefix = "weapons/explosion/";

/**
 * Đối tượng vụ nổ - tác động đến enemy - trừ damage càng lớn nếu càng gần trung tâm vụ nổ 
 */
export default class Explosion extends Phaser.Sprite {
  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {string} key - Key for sprite in asset sheet.
   * @param {string} frame - Frame for sprite in asset sheet.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @constructor
   */
  constructor(game, x, y, parent, damage) {
    super(game, x, y, "assets", `${prefix}00`);
    this.anchor.set(0.5);
    parent.add(this);

    // Giá trị damage 
    this.damage = damage;

    // Danh sách enemy - lấy từ game 
    this.enemies = game.globals.groups.enemies;

    // Animation của vụ nổ 
    const frames = Phaser.Animation.generateFrameNames(prefix, 0, 17, "", 2);
    this.animations.add("explode", frames, 24, false).onComplete.add(() => this.destroy());
    this.animations.play("explode");

    // Sound của vụ nổ 
    this._explosionSound = game.globals.soundManager.add("fx/rocket-explosion", null, 0.7);
    this._explosionSound.play();

    // Tính chất physics của vụ nổ 
    // Là một gameObject có bán kính khởi tạo là 0
    game.physics.sat.add.gameObject(this).setCircle(0);
    // Đưa collider-Check và physics-world khi có va chạm với enemy thì gọi thực hiện logic 
    game.physics.sat.add.overlap(this, this.enemies, {
      onCollide: (_, enemy) => this.onCollideWithEnemy(enemy)
    });

    // Thực hiện 1 tween biến đổi - thay đổi radius từ 0 đến lớn dần
    // Biến đổi trên cả radius hiển thị và radius vật lý 
    const tweenTarget = { radius: 0 };
    this.tween = game.tweens
      .create(tweenTarget)
      .to({ radius: this.width / 2 }, 10 / 24 * 1000)
      .onUpdateCallback(() => this.body.setCircle(tweenTarget.radius))
      .start();

    this.alpha = 0.9;
    this.enemiesDamaged = [];

    // Vụ nổ diễn ra thì tạo hiệu ứng shake camera 
    this.game.camera.shake(0.005, 250);
  }

  /**
   * Logic được gọi khi enemy bị va chạm 
   * @param {enemy bị va chạm} enemy 
   */
  onCollideWithEnemy(enemy) {
    if (!this.enemiesDamaged.includes(enemy)) {
      const d = this.position.distance(enemy.position);
      // MH: this is scaling by distance to center of enemy, that's not exactly what we want, but
      // close enough for now.
      // Vụ nổ càng gần center của enemy thì damage càng lớn 
      const scaledDamage = Phaser.Math.mapLinear(d, 0, this.width / 2, this.damage, 0);
      enemy.takeDamage(scaledDamage, this);
      this.enemiesDamaged.push(enemy);
    }
  }

  destroy(...args) {
    this.game.tweens.remove(this.tween);
    super.destroy(...args);
  }
}
