import Phaser from 'phaser';

import { InputAdapter } from '@core/input/InputAdapter';
import { defaultActionConfigs, INPUT_ACTIONS } from '@core/input/defaultMappings';

export const TouchPadDebugSceneKey = 'TouchPadDebugScene';

class VirtualJoystick extends Phaser.GameObjects.Container {
  public readonly radius: number;
  private base: Phaser.GameObjects.Graphics;
  private handle: Phaser.GameObjects.Graphics;
  private pointerId: number | null = null;
  private vector = new Phaser.Math.Vector2();

  constructor(scene: Phaser.Scene, x: number, y: number, radius = 110) {
    super(scene, x, y);
    this.radius = radius;

    this.base = scene.add.graphics();
    this.base.lineStyle(4, 0x2ecc71, 0.7).strokeCircle(0, 0, radius);

    this.handle = scene.add.graphics();
    this.handle.fillStyle(0x2ecc71, 0.5).fillCircle(0, 0, radius * 0.35);

    this.add([this.base, this.handle]);
    this.setSize(radius * 2, radius * 2);
    this.setInteractive(new Phaser.Geom.Circle(0, 0, radius), Phaser.Geom.Circle.Contains);

    scene.add.existing(this);
  }

  getVector(): Phaser.Math.Vector2 {
    return this.vector.clone();
  }

  attachPointer(pointer: Phaser.Input.Pointer): void {
    if (this.pointerId !== null) return;
    this.pointerId = pointer.id;
    this.updateFromPointer(pointer);
  }

  updatePointer(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return;
    this.updateFromPointer(pointer);
  }

  releasePointer(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return;
    this.pointerId = null;
    this.vector.set(0, 0);
    this.handle.setPosition(0, 0);
  }

  private updateFromPointer(pointer: Phaser.Input.Pointer): void {
    const local = new Phaser.Math.Vector2(pointer.x - this.x, pointer.y - this.y);
    const length = Phaser.Math.Clamp(local.length(), 0, this.radius);
    const angle = local.angle();
    console.debug('[VirtualJoystick] update', this.pointerId, pointer.id, 'local', local.x.toFixed(1), local.y.toFixed(1), 'length', length.toFixed(1));
    this.handle.setPosition(Math.cos(angle) * length, Math.sin(angle) * length);

    this.vector.set(Math.cos(angle), Math.sin(angle));
    if (length < this.radius * 0.2) {
      this.vector.set(0, 0);
    }
  }
}

export class TouchPadDebugScene extends Phaser.Scene {
  private inputAdapter = new InputAdapter();
  private leftPad!: VirtualJoystick;
  private rightPad!: VirtualJoystick;
  private infoText!: Phaser.GameObjects.Text;
  private aimCrosshair!: Phaser.GameObjects.Graphics;
  private moveVector = new Phaser.Math.Vector2();
  private aimVector = new Phaser.Math.Vector2();

  constructor() {
    super(TouchPadDebugSceneKey);
  }

  create(): void {
    // đảm bảo hỗ trợ ít nhất 2 pointer (dual stick)
    this.input.addPointer(2);
    this.add.text(24, 20, 'TouchPad Debug Scene', { color: '#ffcc66', fontSize: '32px' });

    const padding = 150;
    this.leftPad = new VirtualJoystick(this, padding, this.scale.height - padding);
    this.rightPad = new VirtualJoystick(this, this.scale.width - padding, this.scale.height - padding);

    this.infoText = this.add.text(24, 70, '', {
      color: '#ffffff',
      fontFamily: 'monospace',
      fontSize: '18px'
    });

    this.aimCrosshair = this.add.graphics();

    this.setupInput();
    this.setupTouchListeners();
  }

  private setupInput(): void {
    const configs = {
      ...defaultActionConfigs,
      [INPUT_ACTIONS.MOVE]: { type: 'analog', deadzone: 0.15 },
      [INPUT_ACTIONS.AIM]: { type: 'analog', deadzone: 0.05 },
      [INPUT_ACTIONS.FIRE]: { type: 'digital' }
    } as const;

    this.inputAdapter.init(this);
    for (const [action, cfg] of Object.entries(configs)) {
      this.inputAdapter.registerAction(action, cfg);
    }

    this.inputAdapter.on(INPUT_ACTIONS.MOVE, (state) => {
      if (state.type === 'analog') this.moveVector.copy(state.vector);
    });
    this.inputAdapter.on(INPUT_ACTIONS.AIM, (state) => {
      if (state.type === 'analog') this.aimVector.copy(state.vector);
    });
    this.inputAdapter.on(INPUT_ACTIONS.FIRE, (state) => {
      if (state.type === 'digital' && state.justPressed) {
        console.log('[TouchPadDebug] FIRE tapped');
      }
    });
  }

  private setupTouchListeners(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      console.debug('[TouchPadDebug] pointerdown', pointer.id, pointer.x, pointer.y);
      if (this.leftPad.getBounds().contains(pointer.x, pointer.y)) {
        this.leftPad.attachPointer(pointer);
        this.inputAdapter.setAnalog(INPUT_ACTIONS.MOVE, this.leftPad.getVector());
      } else if (this.rightPad.getBounds().contains(pointer.x, pointer.y)) {
        this.rightPad.attachPointer(pointer);
        this.inputAdapter.setAnalog(INPUT_ACTIONS.AIM, this.rightPad.getVector());
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      console.debug('[TouchPadDebug] pointermove', pointer.id, pointer.x, pointer.y);
      this.leftPad.updatePointer(pointer);
      this.rightPad.updatePointer(pointer);
      const moveVec = this.leftPad.getVector();
      const aimVec = this.rightPad.getVector();
      console.debug('[TouchPadDebug] moveVec', moveVec.x.toFixed(2), moveVec.y.toFixed(2), 'aimVec', aimVec.x.toFixed(2), aimVec.y.toFixed(2));
      this.inputAdapter.setAnalog(INPUT_ACTIONS.MOVE, moveVec);
      this.inputAdapter.setAnalog(INPUT_ACTIONS.AIM, aimVec);
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      console.debug('[TouchPadDebug] pointerup', pointer.id, pointer.x, pointer.y);
      this.leftPad.releasePointer(pointer);
      this.rightPad.releasePointer(pointer);
      this.inputAdapter.setAnalog(INPUT_ACTIONS.MOVE, this.leftPad.getVector());
      this.inputAdapter.setAnalog(INPUT_ACTIONS.AIM, this.rightPad.getVector());
    });
  }


  update(_: number, delta: number): void {
    this.inputAdapter.update(delta);

    this.infoText.setText([
      `MOVE vector: (${this.moveVector.x.toFixed(2)}, ${this.moveVector.y.toFixed(2)})`,
      `AIM vector: (${this.aimVector.x.toFixed(2)}, ${this.aimVector.y.toFixed(2)})`
    ]);

    this.drawAimCrosshair();
  }

  private drawAimCrosshair(): void {
    this.aimCrosshair.clear();
    if (this.aimVector.lengthSq() === 0) return;
    const center = new Phaser.Math.Vector2(this.scale.width / 2, this.scale.height / 2);
    const target = center.clone().add(this.aimVector.clone().scale(160));
    this.aimCrosshair.lineStyle(2, 0xffcc66, 1);
    this.aimCrosshair.strokeCircle(target.x, target.y, 12);
    this.aimCrosshair.lineBetween(target.x - 16, target.y, target.x + 16, target.y);
    this.aimCrosshair.lineBetween(target.x, target.y - 16, target.x, target.y + 16);
  }
}
