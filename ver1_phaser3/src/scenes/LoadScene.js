import Phaser from 'phaser';
import { MenuSceneKey } from './sceneKeys';
export const LoadSceneKey = 'LoadScene';
export class LoadScene extends Phaser.Scene {
    loadingText;
    constructor() {
        super(LoadSceneKey);
    }
    preload() {
        console.log('[LoadScene] preload()');
        this.loadingText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Loading...', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
        // TODO: load assets when pipeline ready (sprites, audio, fonts)
    }
    create() {
        console.log('[LoadScene] create() -> start MenuScene');
        this.scene.start(MenuSceneKey);
    }
}
