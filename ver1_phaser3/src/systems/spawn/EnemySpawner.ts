import Phaser from 'phaser';

interface EnemySpawnerConfig {
  stageId: string;
}

export class EnemySpawner {
  private scene: Phaser.Scene;
  private config: EnemySpawnerConfig;
  private spawnTimer = 0;
  private readonly waveInterval = 15000;

  constructor(scene: Phaser.Scene, config: EnemySpawnerConfig) {
    this.scene = scene;
    this.config = config;
  }

  scheduleInitialWave(): void {
    this.spawnTimer = 0;
  }

  update(delta: number): void {
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.waveInterval) {
      this.spawnTimer = 0;
      this.spawnWave();
    }
  }

  private spawnWave(): void {
    // TODO: integrate with navmesh + enemy factory per design doc
    // Placeholder: add simple enemy indicator
    console.debug(`[EnemySpawner] spawn wave for stage ${this.config.stageId}`);
  }
}
