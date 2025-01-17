import BaseWeapon from "./base-weapon";
import Projectile from "./projectile/";
import WEAPON_TYPES from "./weapon-types";

/**
 * Vũ khí bắn đạn tỏa chùm 
 * Tất cả các bản implementation chi tiết của từng loại vũ khí 
 * được extend từ BaseWeapon - cung cấp các pattern + logic chung của tất cả các loại weapon
 */
export default class Scattershot extends BaseWeapon {
  constructor(game, parentGroup, player, enemies) {
    super(game, parentGroup, player, enemies, WEAPON_TYPES.SCATTERSHOT, 16, 480, 1800);
    this._damage = 24;

    this._fireSound = game.globals.soundManager.add("fx/multishot", null, 0.4);

    this._difficultyModifier = this.game.globals.difficultyModifier;
  }

  fire(angle) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
      // Find trajectory
      const pelletNum = this.game.rnd.integerInRange(14, 20);

      // randomize the trajectory of every bulconst in the shotgun blast
      /**
       * Logic của đạn tỏa chùm - tạo ra chùm viên đạn 
       */
      const multiplier = this._difficultyModifier.getSpeedMultiplier();
      for (let i = 0; i < pelletNum; i++) {
        const mod = this.game.rnd.integerInRange(0, 30) * (Math.PI / 180) * this.game.rnd.sign();
        const rndAngle = angle + mod;
        const speed = multiplier * this.game.rnd.integerInRange(350, 400);
        this._createProjectile(rndAngle, 18, speed);
      }

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
   * @param {tốc độ bắn} speed 
   */
  _createProjectile(angle, playerDistance, speed) {
    const player = this._player;
    const x = player.x + playerDistance * Math.cos(angle);
    const y = player.y + playerDistance * Math.sin(angle);
    //makeScatterShot(game, x, y, parent, player, damage, angle, speed)
    const p = Projectile.makeScatterShot(this.game, x, y, this, player, this._damage, angle, speed);
    p.scale.setTo(0.64, 0.64);
  }
}
