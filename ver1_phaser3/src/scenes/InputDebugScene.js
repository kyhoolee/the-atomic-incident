import Phaser from 'phaser';
import { InputAdapter } from '@core/input/InputAdapter';
import { defaultActionConfigs, INPUT_ACTIONS } from '@core/input/defaultMappings';
export const InputDebugSceneKey = 'InputDebugScene';
export class InputDebugScene extends Phaser.Scene {
    inputAdapter = new InputAdapter();
    infoText;
    pointerCrosshair;
    moveVector = new Phaser.Math.Vector2();
    joystickVector = new Phaser.Math.Vector2();
    digitalStates = {};
    joystick;
    joystickInfoText;
    constructor() {
        super(InputDebugSceneKey);
    }
    preload() {
        this.load.plugin('rexvirtualjoystickplugin', 'plugins/rexvirtualjoystickplugin.min.js', true);
    }
    create() {
        this.add.text(20, 20, 'Input Debug Scene', { color: '#66ffcc', fontSize: '28px' });
        this.infoText = this.add.text(20, 60, '', {
            color: '#ffffff',
            fontFamily: 'monospace',
            fontSize: '18px'
        });
        this.pointerCrosshair = this.add.graphics();
        this.setupInput();
        this.createVirtualJoystick();
    }
    setupInput() {
        this.inputAdapter.init(this);
        for (const [action, config] of Object.entries(defaultActionConfigs)) {
            this.inputAdapter.registerAction(action, config);
        }
        this.inputAdapter.on(INPUT_ACTIONS.MOVE, (state) => {
            if (state.type === 'analog') {
                this.moveVector.copy(state.raw);
            }
        });
        const digitalActions = [INPUT_ACTIONS.FIRE, INPUT_ACTIONS.DASH, INPUT_ACTIONS.ABILITY, INPUT_ACTIONS.GADGET, INPUT_ACTIONS.PAUSE];
        digitalActions.forEach((action) => {
            this.inputAdapter.on(action, (state) => {
                if (state.type === 'digital') {
                    const status = state.justPressed
                        ? 'justPressed'
                        : state.justReleased
                            ? 'justReleased'
                            : state.pressed
                                ? 'pressed'
                                : 'idle';
                    this.digitalStates[action] = status;
                    if (state.justPressed) {
                        console.log(`[InputDebugScene] ${action} just pressed`);
                    }
                }
            });
        });
        this.inputAdapter.on(INPUT_ACTIONS.AIM, (state) => {
            if (state.type === 'pointer') {
                this.drawPointer(state.world);
            }
        });
    }
    drawPointer(world) {
        this.pointerCrosshair.clear();
        this.pointerCrosshair.lineStyle(2, 0x66ffcc, 1);
        this.pointerCrosshair.strokeCircle(world.x, world.y, 12);
        this.pointerCrosshair.lineBetween(world.x - 16, world.y, world.x + 16, world.y);
        this.pointerCrosshair.lineBetween(world.x, world.y - 16, world.x, world.y + 16);
    }
    createVirtualJoystick() {
        const plugin = this.plugins.get('rexvirtualjoystickplugin');
        if (!plugin) {
            console.warn('[InputDebugScene] rexvirtualjoystickplugin missing');
            return;
        }
        const base = this.add.circle(0, 0, 110, 0x3a3a3a, 0.35);
        const thumb = this.add.circle(0, 0, 55, 0x9ad8ff, 0.55);
        this.joystick = plugin.add(this, {
            x: 120,
            y: this.cameras.main.height - 140,
            radius: 110,
            base,
            thumb
        });
        this.joystick.on('update', this.handleJoystickUpdate, this);
        this.joystickInfoText = this.add
            .text(20, this.cameras.main.height - 220, '', {
            color: '#a3ffb5',
            fontFamily: 'monospace',
            fontSize: '16px'
        })
            .setOrigin(0, 0);
        this.handleJoystickUpdate();
    }
    handleJoystickUpdate() {
        if (!this.joystick)
            return;
        this.joystickVector.set(this.joystick.forceX, this.joystick.forceY);
        if (this.joystickVector.lengthSq() <= 0.0001) {
            this.inputAdapter.setAnalog(INPUT_ACTIONS.MOVE, null);
        }
        else {
            this.inputAdapter.setAnalog(INPUT_ACTIONS.MOVE, this.joystickVector);
        }
        if (this.joystickInfoText) {
            this.joystickInfoText.setText([
                'Virtual joystick',
                `force: ${this.joystick.force.toFixed(2)}`,
                `angle: ${this.joystick.angle.toFixed(2)}`,
                `vector: (${this.joystick.forceX.toFixed(2)}, ${this.joystick.forceY.toFixed(2)})`
            ]);
        }
    }
    update(_time, delta) {
        this.inputAdapter.update(delta);
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const digitalStatus = Object.entries(this.digitalStates)
            .map(([action, status]) => `${action}: ${status ?? 'idle'}`)
            .join(' | ');
        const info = [
            `MOVE raw: (${this.moveVector.x.toFixed(2)}, ${this.moveVector.y.toFixed(2)})`,
            `POINTER screen: (${pointer.x.toFixed(0)}, ${pointer.y.toFixed(0)})`,
            `POINTER world: (${worldPoint.x.toFixed(0)}, ${worldPoint.y.toFixed(0)})`,
            `Buttons: Fire[SPACE], Dash[SHIFT], Ability[Q], Gadget[E], Pause[ESC]`,
            `Digital state: ${digitalStatus}`
        ];
        this.infoText.setText(info);
    }
    shutdown() {
        if (this.joystick) {
            this.joystick.off('update', this.handleJoystickUpdate, this);
            this.joystick.destroy();
            this.joystick = undefined;
        }
        this.joystickInfoText?.destroy();
        this.joystickInfoText = undefined;
        this.inputAdapter.setAnalog(INPUT_ACTIONS.MOVE, null);
        this.inputAdapter.destroy();
    }
}
