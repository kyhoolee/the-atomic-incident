export class PhysicsAdapter {
    scene;
    constructor(scene) {
        this.scene = scene;
        // TODO: later swap with Matter or SAT adapter per design
    }
    addPlayerBody(gameObject) {
        this.scene.physics.add.existing(gameObject);
        return gameObject.body ?? undefined;
    }
    update(_delta) {
        // For Arcade physics, Phaser handles update internally.
        // Hook for SAT/Matter integration later.
    }
}
