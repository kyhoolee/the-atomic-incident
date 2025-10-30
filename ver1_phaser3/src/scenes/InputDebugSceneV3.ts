import Phaser from 'phaser';

export const InputDebugSceneV3Key = 'InputDebugSceneV3';

export class InputDebugSceneV3 extends Phaser.Scene {
  private joyStick?: RexVirtualJoystick;
  private joyText?: Phaser.GameObjects.Text;
  private touchText?: Phaser.GameObjects.Text;
  private pointerLog: string[] = [];
  private pointerDownHandler?: (pointer: Phaser.Input.Pointer) => void;
  private pointerMoveHandler?: (pointer: Phaser.Input.Pointer) => void;
  private pointerUpHandler?: (pointer: Phaser.Input.Pointer) => void;
  private pointerUpOutsideHandler?: (pointer: Phaser.Input.Pointer) => void;

  constructor() {
    super({ key: InputDebugSceneV3Key });
  }

  preload(): void {
    this.load.plugin(
      'rexvirtualjoystickplugin',
      'plugins/rexvirtualjoystickplugin.min.js',
      true
    );
  }

  create(): void {
    this.input.mouse?.disableContextMenu();
    this.input.addPointer(2); // allow multi-touch testing

    const plugin = this.plugins.get('rexvirtualjoystickplugin') as RexVirtualJoystickPlugin | undefined;
    if (!plugin) {
      console.warn('[InputDebugSceneV3] rexvirtualjoystickplugin missing');
      return;
    }

    this.joyStick = plugin
      .add(this, {
        x: 400,
        y: 300,
        radius: 120,
        base: this.add.circle(0, 0, 120, 0x4a9855, 0.4),
        thumb: this.add.circle(0, 0, 55, 0xa7ffbe, 0.85),
        enable: true,
        dir: '8dir'
      })
      .on('update', this.dumpJoyStickState, this);

    this.joyStick.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.appendPointerLog(`joy pointerdown id=${pointer.id} touch=${pointer.wasTouch}`);
    });
    this.joyStick.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.appendPointerLog(`joy pointerup id=${pointer.id} touch=${pointer.wasTouch}`);
    });

    this.joyText = this.add.text(20, 20, '', {
      color: '#ffffff',
      fontFamily: 'monospace',
      fontSize: '18px'
    });

    this.touchText = this.add.text(20, 160, 'Pointer events:', {
      color: '#66ffcc',
      fontFamily: 'monospace',
      fontSize: '16px'
    });

    this.dumpJoyStickState();
    this.registerPointerDebug();
  }

  private dumpJoyStickState(): void {
    if (!this.joyStick || !this.joyText) return;

    const cursorKeys = this.joyStick.createCursorKeys();
    const pressed = Object.keys(cursorKeys)
      .filter((name) => cursorKeys[name].isDown)
      .join(' ');

    const lines = [
      'Virtual joystick (touch ready)',
      `Pressed: ${pressed || 'none'}`,
      `Force: ${Math.floor(this.joyStick.force * 100) / 100}`,
      `Angle: ${Math.floor(this.joyStick.angle * 100) / 100}`
    ];

    this.joyText.setText(lines);
  }

  private registerPointerDebug(): void {
    const logEvent = (phase: string, pointer: Phaser.Input.Pointer) => {
      this.appendPointerLog(
        `${phase}: id=${pointer.id} (${pointer.x.toFixed(0)},${pointer.y.toFixed(0)}) touch=${pointer.wasTouch}`
      );
    };

    this.pointerDownHandler = (pointer: Phaser.Input.Pointer) => logEvent('down', pointer);
    this.pointerMoveHandler = (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        logEvent('move', pointer);
      }
    };
    this.pointerUpHandler = (pointer: Phaser.Input.Pointer) => logEvent('up', pointer);
    this.pointerUpOutsideHandler = (pointer: Phaser.Input.Pointer) => logEvent('up(out)', pointer);

    this.input.on('pointerdown', this.pointerDownHandler);
    this.input.on('pointermove', this.pointerMoveHandler);
    this.input.on('pointerup', this.pointerUpHandler);
    this.input.on('pointerupoutside', this.pointerUpOutsideHandler);
  }

  shutdown(): void {
    this.joyStick?.off('update', this.dumpJoyStickState, this);
    this.joyStick?.destroy();
    this.joyStick = undefined;
    this.pointerLog = [];
    if (this.pointerDownHandler) {
      this.input.off('pointerdown', this.pointerDownHandler);
      this.pointerDownHandler = undefined;
    }
    if (this.pointerMoveHandler) {
      this.input.off('pointermove', this.pointerMoveHandler);
      this.pointerMoveHandler = undefined;
    }
    if (this.pointerUpHandler) {
      this.input.off('pointerup', this.pointerUpHandler);
      this.pointerUpHandler = undefined;
    }
    if (this.pointerUpOutsideHandler) {
      this.input.off('pointerupoutside', this.pointerUpOutsideHandler);
      this.pointerUpOutsideHandler = undefined;
    }
  }

  private appendPointerLog(entry: string): void {
    this.pointerLog.unshift(entry);
    if (this.pointerLog.length > 8) {
      this.pointerLog.pop();
    }
    this.touchText?.setText(['Pointer events:', ...this.pointerLog]);
  }
}

interface RexVirtualJoystickPlugin extends Phaser.Plugins.BasePlugin {
  add(scene: Phaser.Scene, config: RexVirtualJoystickConfig): RexVirtualJoystick;
}

interface RexVirtualJoystickConfig {
  x: number;
  y: number;
  radius: number;
  base: Phaser.GameObjects.GameObject;
  thumb: Phaser.GameObjects.GameObject;
  enable?: boolean;
  dir?: 'up&down' | 'left&right' | '4dir' | '8dir';
}

interface RexVirtualJoystick extends Phaser.Events.EventEmitter {
  force: number;
  angle: number;
  createCursorKeys(): Record<string, Phaser.Input.Keyboard.Key & { isDown: boolean; duration: number }>;
  destroy(): void;
}
