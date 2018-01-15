const PICKUP_RANGE = 50;

export default class EnergyPickup extends Phaser.Sprite {
  constructor(game, x, y, parentGroup, player, energyValue, durationSeconds = 10) {
    super(game, x, y, "assets", "pickups/energy-pickup");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._player = player;
    this._energyValue = energyValue;
    this._durationMs = durationSeconds * 1000;
    this._timer = game.time.create(false);
    this._timer.start();

    this._pickupSound = game.globals.soundManager.add("fire-whoosh-1");

    // Configure physics
    game.physics.arcade.enable(this);
    this.satBody = game.globals.plugins.satBody.addBoxBody(this);
  }

  getEnergy() {
    return this._energyValue;
  }

  update() {
    // If pickup time has expired, set up a tween to begin blinking before destroying pickup
    if (this._durationMs - this._timer.ms < 0 && !this._tween) {
      this._tween = this.game.make
        .tween(this)
        .to({ alpha: 0.25 }, 300, "Quad.easeInOut", true, 0, 5, true);
      this._tween.onComplete.add(() => this.destroy());
    }

    const dist = this.position.distance(this._player.position);
    if (this.position.distance(this._player.position) < PICKUP_RANGE) {
      // Move pickup towards player slowly when far and quickly when close
      const lerpFactor = Phaser.Math.mapLinear(dist / PICKUP_RANGE, 0, 1, 0.5, 0);
      this.position.setTo(
        (1 - lerpFactor) * this.position.x + lerpFactor * this._player.position.x,
        (1 - lerpFactor) * this.position.y + lerpFactor * this._player.position.y
      );
    }
  }

  pickUp() {
    this._pickupSound.play();
    this.destroy();
  }

  destroy(...args) {
    this._timer.destroy();
    if (this._tween) this._tween.manager.remove(this._tween);
    super.destroy(...args);
  }
}