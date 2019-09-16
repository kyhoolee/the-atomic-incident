import BaseWeapon from "./base-weapon";
import Projectile from "./projectile/";
import WEAPON_TYPES from "./weapon-types";

/**
 * Vũ khí bắn đạn rocket 
 */
export default class RocketLauncher extends BaseWeapon {
  constructor(game, parentGroup, player, enemies) {
    let totalAmmo = 8;
    let cooldownTime = 1000;
    let reloadTime = 3000;
    let damage = 200;
    let speed = 320;

    super(game, parentGroup, player, enemies, WEAPON_TYPES.ROCKET_LAUNCHER, totalAmmo, cooldownTime, reloadTime);
    this._damage = damage;
    this._speed = speed;

    this._fireSound = game.globals.soundManager.add("fx/missile", null, 0.4);

    this._difficultyModifier = this.game.globals.difficultyModifier;
  }

  /**
   * 
   * @param {góc bắn} angle 
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
   * 
   * @param {góc bắn} angle 
   * @param {khoảng cách đến player} playerDistance 
   * @param {tốc độ đạn} speed 
   */
  _createProjectile(angle, playerDistance, speed) {
    const player = this._player;
    const x = player.x + playerDistance * Math.cos(angle);
    const y = player.y + playerDistance * Math.sin(angle);
    Projectile.makeRocket(this.game, x, y, this, player, this._damage, angle, speed);
  }
}
