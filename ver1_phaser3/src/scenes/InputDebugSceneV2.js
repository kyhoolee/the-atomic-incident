import Phaser from 'phaser';
export const InputDebugSceneV2Key = 'InputDebugSceneV2';
export class InputDebugSceneV2 extends Phaser.Scene {
    joyStick;
    text;
    constructor() {
        super({ key: InputDebugSceneV2Key });
    }
    preload() {
        this.load.plugin('rexvirtualjoystickplugin', 'plugins/rexvirtualjoystickplugin.min.js', true);
    }
    create() {
        const plugin = this.plugins.get('rexvirtualjoystickplugin');
        if (!plugin) {
            console.warn('[InputDebugSceneV2] rexvirtualjoystickplugin missing');
            return;
        }
        this.joyStick = plugin
            .add(this, {
            x: 400,
            y: 300,
            radius: 100,
            base: this.add.circle(0, 0, 100, 0x888888),
            thumb: this.add.circle(0, 0, 50, 0xcccccc)
        })
            .on('update', this.dumpJoyStickState, this);
        this.text = this.add.text(0, 0, '');
        this.dumpJoyStickState();
    }
    dumpJoyStickState() {
        if (!this.joyStick || !this.text)
            return;
        const cursorKeys = this.joyStick.createCursorKeys();
        let s = 'Key down: ';
        for (const name in cursorKeys) {
            if (cursorKeys[name].isDown) {
                s += `${name} `;
            }
        }
        s += `\nForce: ${Math.floor(this.joyStick.force * 100) / 100}`;
        s += `\nAngle: ${Math.floor(this.joyStick.angle * 100) / 100}\n`;
        s += '\nTimestamp:\n';
        for (const name in cursorKeys) {
            const key = cursorKeys[name];
            s += `${name}: duration=${key.duration / 1000}\n`;
        }
        this.text.setText(s);
    }
}
