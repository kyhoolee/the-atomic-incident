import Phaser from 'phaser';
export class PlayerAgent extends Phaser.GameObjects.Sprite {
    damageSystem;
    statusSystem;
    physicsAdapter;
    lightingSystem;
    health = 100;
    id;
    constructor(scene, damageSystem, statusSystem, physicsAdapter, lightingSystem, config) {
        super(scene, scene.scale.width / 2, scene.scale.height / 2, 'player-placeholder');
        this.damageSystem = damageSystem;
        this.statusSystem = statusSystem;
        this.physicsAdapter = physicsAdapter;
        this.lightingSystem = lightingSystem;
        this.id = `player-${config.agentId}`;
        this.setTexturePlaceholder();
        console.log('[PlayerAgent] created', this.id);
        this.physicsAdapter.addPlayerBody(this);
        this.lightingSystem.registerPlayerLight(this);
    }
    setTexturePlaceholder() {
        const gfx = this.scene.add.graphics();
        gfx.fillStyle(0x66ffcc, 1);
        gfx.fillCircle(0, 0, 20);
        const textureKey = `player-${Phaser.Math.RND.uuid()}`;
        gfx.generateTexture(textureKey, 40, 40);
        gfx.destroy();
        this.setTexture(textureKey);
        this.setOrigin(0.5);
    }
    update(_delta) {
        // console.log('[PlayerAgent] update'); // optional debug log
        // TODO: integrate MovementController, WeaponManager, AbilityController
    }
    takeDamage(amount, _context) {
        this.health = Math.max(0, this.health - amount);
        if (this.health === 0) {
            console.log('[PlayerAgent] death');
            this.emit('agent:death');
        }
        else {
            console.log('[PlayerAgent] damage', amount, 'remaining', this.health);
            this.emit('agent:damage', { amount, health: this.health });
        }
    }
    isAlive() {
        return this.health > 0;
    }
}
