import Phaser from 'phaser';
export const InputDebugSceneV3Key = 'InputDebugSceneV3';
export class InputDebugSceneV3 extends Phaser.Scene {
    joyStick;
    joyText;
    touchText;
    pointerLog = [];
    pointerDownHandler;
    pointerMoveHandler;
    pointerUpHandler;
    pointerUpOutsideHandler;
    constructor() {
        super({ key: InputDebugSceneV3Key });
    }
    preload() {
        this.load.plugin('rexvirtualjoystickplugin', 'plugins/rexvirtualjoystickplugin.min.js', true);
    }
    create() {
        var _a;
        (_a = this.input.mouse) === null || _a === void 0 ? void 0 : _a.disableContextMenu();
        this.input.addPointer(2);
        const plugin = this.plugins.get('rexvirtualjoystickplugin');
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
        this.joyStick.on('pointerdown', (pointer) => {
            this.appendPointerLog(`joy pointerdown id=${pointer.id} touch=${pointer.wasTouch}`);
        });
        this.joyStick.on('pointerup', (pointer) => {
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
    dumpJoyStickState() {
        if (!this.joyStick || !this.joyText)
            return;
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
    registerPointerDebug() {
        const logEvent = (phase, pointer) => {
            this.appendPointerLog(`${phase}: id=${pointer.id} (${pointer.x.toFixed(0)},${pointer.y.toFixed(0)}) touch=${pointer.wasTouch}`);
        };
        this.pointerDownHandler = (pointer) => logEvent('down', pointer);
        this.pointerMoveHandler = (pointer) => {
            if (pointer.isDown) {
                logEvent('move', pointer);
            }
        };
        this.pointerUpHandler = (pointer) => logEvent('up', pointer);
        this.pointerUpOutsideHandler = (pointer) => logEvent('up(out)', pointer);
        this.input.on('pointerdown', this.pointerDownHandler);
        this.input.on('pointermove', this.pointerMoveHandler);
        this.input.on('pointerup', this.pointerUpHandler);
        this.input.on('pointerupoutside', this.pointerUpOutsideHandler);
    }
    shutdown() {
        var _a, _b;
        (_a = this.joyStick) === null || _a === void 0 ? void 0 : _a.off('update', this.dumpJoyStickState, this);
        (_b = this.joyStick) === null || _b === void 0 ? void 0 : _b.destroy();
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
    appendPointerLog(entry) {
        this.pointerLog.unshift(entry);
        if (this.pointerLog.length > 8) {
            this.pointerLog.pop();
        }
        this.touchText === null || this.touchText === void 0 ? void 0 : this.touchText.setText(['Pointer events:', ...this.pointerLog]);
    }
}
