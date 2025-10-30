export class EnemySpawner {
    scene;
    config;
    spawnTimer = 0;
    waveInterval = 15000;
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
    }
    scheduleInitialWave() {
        this.spawnTimer = 0;
    }
    update(delta) {
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.waveInterval) {
            this.spawnTimer = 0;
            this.spawnWave();
        }
    }
    spawnWave() {
        // TODO: integrate with navmesh + enemy factory per design doc
        // Placeholder: add simple enemy indicator
        console.debug(`[EnemySpawner] spawn wave for stage ${this.config.stageId}`);
    }
}
