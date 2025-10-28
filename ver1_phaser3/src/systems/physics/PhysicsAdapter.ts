import Phaser from 'phaser';

export class PhysicsAdapter {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // TODO: later swap with Matter or SAT adapter per design
  }

  addPlayerBody(gameObject: Phaser.GameObjects.GameObject): Phaser.Physics.Arcade.Body | undefined {
    this.scene.physics.add.existing(gameObject);
    return (gameObject.body as Phaser.Physics.Arcade.Body) ?? undefined;
  }

  update(_delta: number): void {
    // For Arcade physics, Phaser handles update internally.
    // Hook for SAT/Matter integration later.
  }
}
