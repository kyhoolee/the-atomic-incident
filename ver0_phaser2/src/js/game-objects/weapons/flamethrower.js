import BaseWeapon from "./base-weapon";
import Projectile from "./projectile/";
import WEAPON_TYPES from "./weapon-types";

/**
 * kiểu bắn đạn lửa - mở rộng từ base-weapon
 */
export default class Flamethrower extends BaseWeapon {
  constructor(game, parentGroup, player, enemies) {
    //constructor(game, parentGroup, player, enemies, weaponType, totalAmmo, cooldownTime, reloadTime) 
    let totalAmmo = 124;
    let cooldownTime = 40;
    let reloadTime = 2800;
    let damage = 14;
    let speed = 320;

    super(game, parentGroup, player, enemies, WEAPON_TYPES.FLAMETHROWER, totalAmmo, cooldownTime, reloadTime);
    this._damage = damage;
    this._speed = speed;
    this._difficultyModifier = this.game.globals.difficultyModifier;

    this._fireSound = game.globals.soundManager.add("fx/fire-whoosh-2", null, 0.5);
  }

  /**
   * 
   * @param {góc bắn} angle 
   */
  fire(angle) {
    // Nếu có thể tấn công và còn đạn 
    if (this.isAbleToAttack() && this.getAmmo() > 0) {
      // Tốc độ bắn được nhân theo độ khó hiên jtaij 
      const speed = this._difficultyModifier.getSpeedMultiplier() * this._speed;
      // Tạo ra viên đạn với góc, khoảng cách, tốc độ
      this._createProjectile(angle, 24, speed);
      // Trừ đi 1 viên đạn vừa bắn 
      this.incrementAmmo(-1);
      // Tạo âm thanh 
      this._fireSound.play();
      // Bắt đầu cooldown 
      this._startCooldown(this._cooldownTime);
    }
  }

  /**
   * Create a flame sprite with customized properties.
   *
   * @param {number} angle
   * @param {number} playerDistance
   * @param {number} speed
   */
  _createProjectile(angle, playerDistance, speed) {
    const player = this._player;
    const x = player.x + playerDistance * Math.cos(angle);
    const y = player.y + playerDistance * Math.sin(angle);

    // Randomize the properties of each flame.
    // Điều chỉnh góc bắn 
    angle += this.game.rnd.integerInRange(0, 45) * (Math.PI / 180) * this.game.rnd.sign();
    // Điều chỉnh tốc độ 
    speed += this.game.rnd.integerInRange(0, 36) * this.game.rnd.sign();
    // Điều chỉnh thời gian sống 
    const maxAge = this.game.rnd.integerInRange(520, 640);
    // Điều chỉnh màu sắc 
    const r = this.game.rnd.integerInRange(200, 255);
    const color = Phaser.Color.getColor(r, r, r);

    // Create the projectile.
    const { game, _damage } = this;
    // Tạo ra viên đạn lửa - bản chất là liên tục nhiều viên đạn có đường đi bị lệch random 1 chút 
    const p = Projectile.makeFlame(game, x, y, this, player, _damage, angle, speed, maxAge, color);
    if (p.body) {
      p.body.angularVelocity = this.game.rnd.sign() * this.game.rnd.integerInRange(5, 8);

      // Sprite body won't follow this scaling yet, so make the change in scale small.
      this.game.make
        .tween(p.scale)
        .to({ x: 0.75, y: 0.75 }, maxAge, Phaser.Easing.Elastic.InOut, true);
    }
  }
}
