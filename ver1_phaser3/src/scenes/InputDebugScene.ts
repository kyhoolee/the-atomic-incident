import Phaser from 'phaser';

export const InputDebugSceneKey = 'InputDebugScene';

export class InputDebugScene extends Phaser.Scene {
  private joystick?: RexVirtualJoystick;
  private infoText!: Phaser.GameObjects.Text;

  constructor() {
    super(InputDebugSceneKey);
  }

  preload(): void {
    this.load.plugin(
      'rexvirtualjoystickplugin',
      'plugins/rexvirtualjoystickplugin.min.js',
      true
    );
  }

  create(): void {
    this.add.text(20, 20, 'Virtual Joystick Demo', { color: '#66ffcc', fontSize: '28px' });

    this.infoText = this.add.text(20, 70, 'Loading joystick...', {
      color: '#ffffff',
      fontFamily: 'monospace',
      fontSize: '18px'
    });

    const plugin = this.plugins.get('rexvirtualjoystickplugin') as RexVirtualJoystickPlugin | undefined;
    if (!plugin) {
      console.warn('[InputDebugScene] rexvirtualjoystickplugin missing');
      this.infoText.setText('Joystick plugin missing');
      return;
    }

    const base = this.add.circle(0, 0, 100, 0x888888, 0.85);
    const thumb = this.add.circle(0, 0, 50, 0xcccccc, 0.9);

    this.joystick = plugin.add(this, {
      x: 160,
      y: this.cameras.main.height - 160,
      radius: 120,
      base,
      thumb
    });

    this.joystick.on('update', this.dumpJoystickState, this);
    this.dumpJoystickState();
  }

  private dumpJoystickState(): void {
    if (!this.joystick) return;

    const cursorKeys = this.joystick.createCursorKeys();
    const activeKeys = Object.keys(cursorKeys)
      .filter((name) => cursorKeys[name].isDown)
      .join(' ');

    const lines = [
      `Key down: ${activeKeys || 'none'}`,
      `Force: ${this.joystick.force.toFixed(2)}`,
      `Angle: ${this.joystick.angle.toFixed(2)}`,
      '',
      'Timestamp:'
    ];

    for (const name in cursorKeys) {
      const key = cursorKeys[name];
      lines.push(`${name}: duration=${(key.duration / 1000).toFixed(3)}s`);
    }

    this.infoText.setText(lines);
  }

  shutdown(): void {
    this.joystick?.off('update', this.dumpJoystickState, this);
    this.joystick?.destroy();
    this.joystick = undefined;
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
}

interface RexVirtualJoystick extends Phaser.Events.EventEmitter {
  force: number;
  forceX: number;
  forceY: number;
  angle: number;
  createCursorKeys(): Record<string, Phaser.Input.Keyboard.Key & { isDown: boolean; duration: number }>;
  destroy(): void;
}
