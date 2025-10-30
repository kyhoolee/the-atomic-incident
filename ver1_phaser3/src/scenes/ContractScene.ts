import Phaser from 'phaser';

import { ContractSceneKey, GameOverSceneKey } from './sceneKeys';
import { LightingSystem } from '@systems/lighting/LightingSystem';
import { PhysicsAdapter } from '@systems/physics/PhysicsAdapter';
import { DamageSystem } from '@systems/damage/DamageSystem';
import { StatusEffectSystem } from '@systems/status/StatusEffectSystem';
import { EnemySpawner } from '@systems/spawn/EnemySpawner';
import { PlayerAgent } from '@gameplay/player/PlayerAgent';
import { MenuSelection } from '@core/state/menuState';
import { InputAdapter } from '@core/input/InputAdapter';
import { defaultActionConfigs, INPUT_ACTIONS } from '@core/input/defaultMappings';

export class ContractScene extends Phaser.Scene {
  private lightingSystem!: LightingSystem;
  private physicsAdapter!: PhysicsAdapter;
  private damageSystem!: DamageSystem;
  private statusSystem!: StatusEffectSystem;
  private enemySpawner!: EnemySpawner;
  private playerAgent!: PlayerAgent;
  private inputAdapter = new InputAdapter();

  private contractConfig?: MenuSelection;

  constructor() {
    super(ContractSceneKey);
  }

  init(data: MenuSelection): void {
    this.contractConfig = data;
  }

  create(): void {
    console.log('[ContractScene] create()', this.contractConfig);
    this.initSystems();
    this.createWorld();
    this.setupInput();
    this.createPlayer();
    this.createHUD();

    this.enemySpawner.scheduleInitialWave();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.inputAdapter.destroy());
  }

  private initSystems(): void {
    console.log('[ContractScene] initSystems');
    this.physicsAdapter = new PhysicsAdapter(this);
    this.statusSystem = new StatusEffectSystem();
    this.damageSystem = new DamageSystem(this.statusSystem);
    this.lightingSystem = new LightingSystem(this);
    this.enemySpawner = new EnemySpawner(this, {
      stageId: this.contractConfig?.stageId ?? 'neon-district'
    });
  }

  private createWorld(): void {
    console.log('[ContractScene] createWorld placeholder');
    // TODO: load tilemap, set up layers, register occluders for lightingSystem, collisions for physicsAdapter
  }

  private createPlayer(): void {
    console.log('[ContractScene] createPlayer');
    this.playerAgent = new PlayerAgent(this, this.damageSystem, this.statusSystem, this.physicsAdapter, this.lightingSystem, {
      agentId: this.contractConfig?.agentId ?? 'operative'
    });
    this.add.existing(this.playerAgent);
  }

  private createHUD(): void {
    console.log('[ContractScene] createHUD placeholder');
    // TODO: instantiate HUD layer according to design document
  }

  private setupInput(): void {
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

  update(time: number, delta: number): void {
    // console.log('[ContractScene] update', time, delta); // comment to avoid spam

    const dt = delta;

    this.physicsAdapter.update(dt);
    this.inputAdapter.update(dt);
    this.playerAgent.update(dt);
    this.enemySpawner.update(dt);
    this.lightingSystem.update(dt);
    this.statusSystem.update(dt);
  }

  private endContract(victory: boolean): void {
    this.scene.start(GameOverSceneKey, { victory });
  }

  shutdown(): void {
    this.inputAdapter.destroy();
  }
}
