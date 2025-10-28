import Phaser from 'phaser';

import { MenuSceneKey } from './sceneKeys';

export const LoadSceneKey = 'LoadScene';

export class LoadScene extends Phaser.Scene {
  private loadingText?: Phaser.GameObjects.Text;

  constructor() {
    super(LoadSceneKey);
  }

  preload(): void {
    console.log('[LoadScene] preload()');
    this.loadingText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // TODO: load assets when pipeline ready (sprites, audio, fonts)
  }

  create(): void {
    console.log('[LoadScene] create() -> start MenuScene');
    this.scene.start(MenuSceneKey);
  }
}
