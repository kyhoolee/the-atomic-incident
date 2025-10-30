import Phaser from 'phaser';
import { ContractSceneKey, GameOverSceneKey } from './sceneKeys';
import { LightingSystem } from '@systems/lighting/LightingSystem';
import { PhysicsAdapter } from '@systems/physics/PhysicsAdapter';
import { DamageSystem } from '@systems/damage/DamageSystem';
import { StatusEffectSystem } from '@systems/status/StatusEffectSystem';
import { EnemySpawner } from '@systems/spawn/EnemySpawner';
import { PlayerAgent } from '@gameplay/player/PlayerAgent';
import { InputAdapter } from '@core/input/InputAdapter';
import { defaultActionConfigs, INPUT_ACTIONS } from '@core/input/defaultMappings';
export class ContractScene extends Phaser.Scene {
    lightingSystem;
    physicsAdapter;
    damageSystem;
    statusSystem;
    enemySpawner;
    playerAgent;
    inputAdapter = new InputAdapter();
    contractConfig;
    constructor() {
        super(ContractSceneKey);
    }
    init(data) {
        this.contractConfig = data;
    }
    create() {
        console.log('[ContractScene] create()', this.contractConfig);
        this.initSystems();
        this.createWorld();
        this.setupInput();
        this.createPlayer();
        this.createHUD();
        this.enemySpawner.scheduleInitialWave();
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.inputAdapter.destroy());
    }
    initSystems() {
        console.log('[ContractScene] initSystems');
        this.physicsAdapter = new PhysicsAdapter(this);
        this.statusSystem = new StatusEffectSystem();
        this.damageSystem = new DamageSystem(this.statusSystem);
        this.lightingSystem = new LightingSystem(this);
        this.enemySpawner = new EnemySpawner(this, {
            stageId: this.contractConfig?.stageId ?? 'neon-district'
        });
    }
    createWorld() {
        console.log('[ContractScene] createWorld placeholder');
        // TODO: load tilemap, set up layers, register occluders for lightingSystem, collisions for physicsAdapter
    }
    createPlayer() {
        console.log('[ContractScene] createPlayer');
        this.playerAgent = new PlayerAgent(this, this.damageSystem, this.statusSystem, this.physicsAdapter, this.lightingSystem, {
            agentId: this.contractConfig?.agentId ?? 'operative'
        });
        this.add.existing(this.playerAgent);
    }
    createHUD() {
        console.log('[ContractScene] createHUD placeholder');
        // TODO: instantiate HUD layer according to design document
    }
    setupInput() {
        console.log('[ContractScene] setupInput');
        this.inputAdapter.init(this);
        for (const [action, config] of Object.entries(defaultActionConfigs)) {
            this.inputAdapter.registerAction(action, config);
        }
        this.inputAdapter.on(INPUT_ACTIONS.MOVE, (state) => {
            if (state.type === 'analog' && state.magnitude > 0) {
                // console.log('[Input] MOVE', state.raw.x, state.raw.y);
            }
        });
        this.inputAdapter.on(INPUT_ACTIONS.FIRE, (state) => {
            if (state.type === 'digital' && state.justPressed) {
                console.log('[Input] FIRE just pressed');
            }
        });
    }
    update(time, delta) {
        // console.log('[ContractScene] update', time, delta); // comment to avoid spam
        const dt = delta;
        this.physicsAdapter.update(dt);
        this.inputAdapter.update(dt);
        this.playerAgent.update(dt);
        this.enemySpawner.update(dt);
        this.lightingSystem.update(dt);
        this.statusSystem.update(dt);
    }
    endContract(victory) {
        this.scene.start(GameOverSceneKey, { victory });
    }
    shutdown() {
        this.inputAdapter.destroy();
    }
}
