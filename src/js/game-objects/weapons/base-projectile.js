module.exports = BaseProjectile;

var SpriteUtils = require("../../helpers/sprite-utilities.js");
var Fire = require("./fire.js");

BaseProjectile.prototype = Object.create(Phaser.Sprite.prototype);

// options is an object containing some optional settings for the
// base projectile class
// - isDestructible - bool
// - rotateOnSetup - bool
// - canBounce - bool
// - hiddenOnSetup
// - canBurn - bool
// - decayRate - range (0 - 1.0)
// - grow - bool // ok seriously i'm not sure about this one...
function BaseProjectile(game, x, y, key, frame, parentGroup, player, damage,
    angle, speed, range, options) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._player = player;
    this._enemies = game.globals.groups.enemies;
    this._damage = damage;
    this._speed = speed;
    this._range = range;
    this._initialPos = this.position.clone();
    this._remove = false; // check if BaseProjectile should be removed?

    // projectile options
    if (options !== undefined && options.isDestructible !== undefined)
        this._isDestructable = options.isDestructible;
    else this._isDestructable = true;
    if (options !== undefined && options.rotateOnSetup !== undefined)
        this._rotateOnSetup = options.rotateOnSetup;
    else this._rotateOnSetup = true;
    if (options !== undefined && options.canBounce !== undefined)
        this._canBounce = options.canBounce;
    else this._canBounce = true;
    if (options !== undefined && options.hiddenOnSetup !== undefined)
        this._hiddenOnSetup = options.hiddenOnSetup;
    else this._hiddenOnSetup = false;
    if (options !== undefined && options.canBurn !== undefined)
        this._canBurn = options.canBurn;
    else this._canBurn = false;
    if (options !== undefined && options.decayRate !== undefined)
        this._decayRate = options.decayRate;
    else this._decayRate = 1.0;
    if (options !== undefined && options.grow !== undefined)
        this._grow = options.grow;
    else this._grow = false;

    // If rotateOnSetup option is true, rotate projectile to face in the
    // right direction. Sprites are saved facing up (90 degrees), so we
    // need to offset the angle
    if (this._rotateOnSetup)
        this.rotation = angle + (Math.PI / 2); // Radians
    else
        this.rotation = angle;
    // If hiddenOnSetup option is true, hide the object
    if (this._hiddenOnSetup)
        this.visible = false;
    
    // If grow, the bullet grows from size 0 to 100
    if (this._grow) {
        this.scale.setTo(0.25, 0.25);
    }

    this.game.physics.arcade.enable(this);
    this.game.physics.arcade.velocityFromAngle(angle * 180 / Math.PI, 
        this._speed, this.body.velocity);

    this.satBody = this.game.globals.plugins.satBody.addBoxBody(this);
}

BaseProjectile.prototype.update = function() {
    // Collisions with the tilemap
    this.game.physics.arcade.collide(this, this.game.globals.tileMapLayer,
        this._onCollideWithMap);

    // If a decate rate was set, apply it to the velocity.
    if (this._decayRate) {
        this.body.velocity.x = this.body.velocity.x * this._decayRate;
        this.body.velocity.y = this.body.velocity.y * this._decayRate;
    }

    // If the grow flag was set, increase the scale of the projectile every frame.
    // This might be a hack, but if it applicable elsewhere we can figure
    // something more generic out.
    if (this._grow) {
        var x = this.scale.x * 1.0264;
        var y = this.scale.y * 1.0264;
        this.scale.setTo(x, y);
    }

    // If the projectile can burn, check each tile for a fire.
    // If one exists, ignore the tile and keep moving.  If there is no fire,
    // destroy the projectile and create a fire.
    if (this._canBurn && this.checkTileMapLocation(this.position.x,
        this.position.y)) {
        // this isn't working yet...
    }
}

BaseProjectile.prototype.postUpdate = function () {
    // Update arcade physics
    Phaser.Sprite.prototype.postUpdate.apply(this, arguments);
    // Check overlapd
    SpriteUtils.checkOverlapWithGroup(this, this._enemies, 
        this._onCollideWithEnemy, this);
    // If projectile has collided with an enemy, or is out of range, remove it
    if ((this.position.distance(this._initialPos) >
        this._range) || (this._isDestructable && this._remove)) {
        this.destroy();
    }
};

BaseProjectile.prototype.destroy = function () {
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};

BaseProjectile.prototype._onCollideWithMap = function (self, map) {
    if (self._isDestructable) {
        self._remove = true;
    }
};

BaseProjectile.prototype._onCollideWithEnemy = function (self, enemy) {
    var isKilled = enemy.takeDamage(this._damage);
    if (isKilled) this._player.incrementCombo(1);
    if (self._isDestructable) {
        self._remove = true;
    }
};

BaseProjectile.prototype.checkTileMapLocation = function(x, y) {
    var checkTile = this.game.globals.tileMap.getTileWorldXY(x, y, 36, 36,
        this.game.globals.tileMapLayer);

    if (checkTile === null || checkTile === undefined) return true;
    else return false;
}