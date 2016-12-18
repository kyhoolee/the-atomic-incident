module.exports = DesctructableLight;

var utils = require("../helpers/utilities.js");

// Prototype chain - inherits from Sprite
DesctructableLight.prototype = Object.create(Phaser.Sprite.prototype);

function DesctructableLight(game, x, y, parentGroup, radius, color, health) {
    Phaser.Sprite.call(this, game, x, y, "assets", "light/light");
    this.anchor.set(0.5);
    parentGroup.add(this);
    var c = Phaser.Color.valueToColor(color);
    this.tint = Phaser.Color.getColor(c.r, c.g, c.b);

    this._lighting = game.globals.plugins.lighting;

    this.originalRadius = this.radius = radius;
    this.originalHealth = this.health = utils.default(health, 100);
    this._healthRechargeRate = 3; // Health per second
    this._rechargeDelay = 0.5; // Delay after taking damage before recharging
    this._timeSinceDamage = 0;
    this.light = this._lighting.addLight(new Phaser.Point(x, y), radius, color);

    game.physics.arcade.enable(this);
    this.body.immovable = true;
    var diameter = 0.9 * this.width; // Fudge factor - body smaller than sprite
    this.body.setCircle(diameter / 2, (this.width - diameter) / 2, 
        (this.height - diameter) / 2);
}

DesctructableLight.prototype.takeDamage = function (amount) {
    this.health -= amount;
    if (this.health <= 0) {
        this.health = 0;
        this.destroy();
    }
    this._timeSinceDamage = 0;
}

DesctructableLight.prototype.update = function () {
    // Update the health
    var elapsed = this.game.time.physicsElapsed
    this._timeSinceDamage += elapsed;
    if (this._timeSinceDamage > this._rechargeDelay) {
        this.health += this._healthRechargeRate * elapsed;
        if (this.health > this.originalHealth) {
            this.health = this.originalHealth;
        }
    }
    // Update the radius based on the health
    this.radius = (this.health / this.originalHealth) * this.originalRadius;
    this.light.radius = this.radius;
};

DesctructableLight.prototype.destroy = function () {
    this.light.destroy();
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};