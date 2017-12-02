import BaseWeapon from "./base-weapon";
import Projectile from "./projectile";
import WEAPON_TYPES from "./weapon-types";

export default class Scattershot extends BaseWeapon {
  constructor(game, parentGroup, player, enemies) {
    super(game, parentGroup, player, enemies, WEAPON_TYPES.SCATTERSHOT, 5, 480, 1800);
    this._damage = 20;

    this._fireSound = game.globals.soundManager.add("chiptone/shotgun-fire");
    this._fireSound.playMultiple = true;
    this._reloadSound = game.globals.soundManager.add("chiptone/reload");
    this._reloadSound.playMultiple = true;
  }

  fire(angle) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
      // Find trajectory
      const pelletNum = this.game.rnd.integerInRange(14, 20);

      // randomize the trajectory of every bulconst in the shotgun blast
      for (let i = 0; i < pelletNum; i++) {
        const mod = this.game.rnd.integerInRange(0, 30) * (Math.PI / 180) * this.game.rnd.sign();
        const rndAngle = angle + mod;
        const speed = this.game.rnd.integerInRange(350, 400);
        this._createProjectile(rndAngle, 18, speed);
      }

      this.incrementAmmo(-1);
      if (this.getAmmo() > 0) {
        this._fireSound.play();
        this._startCooldown(this._cooldownTime);
      } else {
        this._reloadSound.play();
        this._reload();
      }
    }
  }

  _createProjectile(angle, playerDistance, speed) {
    const player = this._player;
    const x = player.x + playerDistance * Math.cos(angle);
    const y = player.y + playerDistance * Math.sin(angle);
    const p = Projectile.makeScatterShot(this.game, x, y, this, player, this._damage, angle, speed);
    p.scale.setTo(0.64, 0.64);
  }
}
