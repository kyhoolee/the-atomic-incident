import Phaser from 'phaser';

import { LoadSceneKey, BootSceneKey } from './sceneKeys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(BootSceneKey);
  }

  preload(): void {
    console.log('[BootScene] preload()');
    // Placeholder for loading minimal assets (logos, loading bar)
  }

  create(): void {
    console.log('[BootScene] create() -> start LoadScene');
    this.scale.scaleMode = Phaser.Scale.FIT;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;

    this.scene.start(LoadSceneKey);
  }
}
