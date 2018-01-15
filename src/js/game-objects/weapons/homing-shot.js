import BaseWeapon from "./base-weapon";
import Projectile from "./projectile/";
import WEAPON_TYPES from "./weapon-types";

export default class HomingShot extends BaseWeapon {
  constructor(game, parentGroup, player, enemies) {
    super(game, parentGroup, player, enemies, WEAPON_TYPES.HOMING_SHOT, 35, 200, 1500);
    this._damage = 28;
    this._speed = 180;

    this._fireSound = game.globals.soundManager.add("missile");
    this._reloadSound = game.globals.soundManager.add("chiptone/reload");
  }

  fire(angle) {
    if (this.isAbleToAttack()) {
      const closestEnemy = this._getClosestEnemy();
      const offset = 20 * Math.PI / 180;
      const targetAcquisitionDelay = 260; // ms
      const p1 = this._createProjectile(angle - offset, 24, this._speed);
      p1._target = closestEnemy;
      p1._targetAcquisitionDelayTime = this.game.time.now + targetAcquisitionDelay;
      const p2 = this._createProjectile(angle, 24, this._speed);
      p2._target = closestEnemy;
      p2._targetAcquisitionDelayTime = this.game.time.now + targetAcquisitionDelay;
      const p3 = this._createProjectile(angle + offset, 24, this._speed);
      p3._target = closestEnemy;
      p3._targetAcquisitionDelayTime = this.game.time.now + targetAcquisitionDelay;
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

  update() {
    const maxRotation = 2 * Math.PI * this.game.time.physicsElapsed; // 360 deg/s
    const offset = Math.PI / 2; // Graphic is 90 degrees rotated from what Phaser expects
    for (const projectile of this.children) {
      // Skip projectiles without a target or with a destroyed target,
      // and delay target acquisition (for effect).
      if (
        !projectile._target ||
        !projectile._target.game ||
        projectile._targetAcquisitionDelayTime > this.game.time.now
      ) {
        continue;
      }
      // Update rotation to point towards target
      const targetRotation = projectile.position.angle(projectile._target.position) + offset;
      const angleDelta = this.game.math.wrapAngle(targetRotation - projectile.rotation, true);
      const rotation = Math.min(Math.abs(angleDelta), maxRotation);
      if (angleDelta > 0) projectile.rotation += rotation;
      else projectile.rotation -= rotation;
      // Update velocity to match heading
      projectile.body.velocity.x = Math.cos(projectile.rotation - offset) * this._speed;
      projectile.body.velocity.y = Math.sin(projectile.rotation - offset) * this._speed;
    }
    super.update();
  }

  _getClosestEnemy(target) {
    let closestEnemy = null;
    let closestDistance = Number.MAX_VALUE;
    const r = this._player._playerLight.getRadius();
    const light = this._player._playerLight;
    if (!target || !light.isPointInLight(target.position)) {
      target = this._player;
    }
    for (const enemy of this._enemies.children) {
      const d = target.position.distance(enemy.position);
      if (d <= r && d < closestDistance) {
        closestDistance = d;
        closestEnemy = enemy;
      }
    }
    return closestEnemy;
  }

  _createProjectile(angle, playerDistance, speed) {
    const player = this._player;
    const x = player.x + playerDistance * Math.cos(angle);
    const y = player.y + playerDistance * Math.sin(angle);
    const p = Projectile.makeHomingShot(this.game, x, y, this, player, this._damage, angle, speed);
    return p;
  }
}