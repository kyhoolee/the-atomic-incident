import BaseWeapon from "./base-weapon";
import Projectile from "./projectile/";
import WEAPON_TYPES from "./weapon-types";

/**
 * Đạn bắn từng viên một - có vai trò xuyên giáp 
 */
export default class PiercingShot extends BaseWeapon {
  constructor(game, parentGroup, player, enemies) {
    let totalAmmo = 24;
    let cooldownTime = 300;
    let reloadTime = 1000;
    let damage = 46;
    let speed = 32;
    super(game, parentGroup, player, enemies, WEAPON_TYPES.PIERCING_SHOT, totalAmmo, cooldownTime, reloadTime);
    this._damage = damage;
    this._speed = speed;
    this._difficultyModifier = this.game.globals.difficultyModifier;

    this._fireSound = game.globals.soundManager.add("fx/piercing-shot", null, 0.2);
  }

  /**
   * Hàm gọi việc bắn đạn của loại vũ khí PiercingShot
   * @param {góc bắn đạn} angle 
   */
  fire(angle) {
    if (this.isAbleToAttack()) {
      const speed = this._difficultyModifier.getSpeedMultiplier() * this._speed;
      this._createProjectile(angle, 24, speed);
      this.incrementAmmo(-1);
      if (this.getAmmo() > 0) {
        this._fireSound.play();
        this._startCooldown(this._cooldownTime);
      }
    }
  }

  /**
   * Hàm tạo ra viên đạn khi bắn 
   * @param {góc bắn} angle 
   * @param {khoảng cách với player} playerDistance 
   * @param {tốc độ viên đạn} speed 
   */
  _createProjectile(angle, playerDistance, speed) {
    const player = this._player;
    const x = player.x + playerDistance * Math.cos(angle);
    const y = player.y + playerDistance * Math.sin(angle);
    const p = Projectile.makePiercing(this.game, x, y, this, player, this._damage, angle, speed);
    // p.scale.setTo(0.8, 1.2);
  }
}
