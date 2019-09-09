import BaseWeapon from "./base-weapon";
import Projectile from "./projectile/";
import WEAPON_TYPES from "./weapon-types";

/**
 * Loại đạn bouncung với wall - tốc độ đi hơi chậm 
 */
export default class BouncingShot extends BaseWeapon {
  constructor(game, parentGroup, player, enemies) {
    //constructor(game, parentGroup, player, enemies, weaponType, totalAmmo, cooldownTime, reloadTime) 
    // Các hằng số cấu hình của loại đạn Bouncing 
    let totalAmmo = 24;
    let cooldownTime = 300;
    let reloadTime = 1000;
    let damage = 25;
    let speed = 320;

    super(game, parentGroup, player, enemies, WEAPON_TYPES.BOUNCING, totalAmmo, cooldownTime, reloadTime);
    this._damage = damage;
    this._speed = speed;
    this._difficultyModifier = this.game.globals.difficultyModifier;

    this._fireSound = game.globals.soundManager.add("fx/bubble-bouncing-projectile");
  }

  /**
   * 
   * @param {Góc bắn đạn} angle 
   */
  fire(angle) {
    if (this.isAbleToAttack()) {
      // Độ khó của game lên cao thì tốc độ đạn bắn càng nhanh 
      const speed = this._difficultyModifier.getSpeedMultiplier() * this._speed;
      // Tạo ra viên đạn 
      this._createProjectile(angle, 24, speed);
      // Giảm số lượng đạn đi 1 - do vừa bắn mất 1 viên 
      this.incrementAmmo(-1);
      // Nếu sau đó vẫn còn đạn 
      if (this.getAmmo() > 0) {
        // Bật tiếng bắn đạn 
        this._fireSound.play();
        // Start cooldown cho lần bắn tiếp theo 
        this._startCooldown(this._cooldownTime);
      }
    }
  }

  /**
   * 
   * @param {góc bắn} angle 
   * @param {khoảng cách vị trí bắn với player} playerDistance 
   * @param {tốc độ bắn } speed 
   */
  _createProjectile(angle, playerDistance, speed) {
    // Player hiện tại 
    const player = this._player;
    // Vị trí bắn - tính từ vị trí của player và khoảng cách bắn, góc bắn 
    const x = player.x + playerDistance * Math.cos(angle);
    const y = player.y + playerDistance * Math.sin(angle);
    // Tạo ra viên đạn kiểu bouncing 
    Projectile.makeBouncing(this.game, x, y, this, player, this._damage, angle, speed);
  }
}
