import Phaser from 'phaser';

import { MenuSceneKey } from './sceneKeys';

export const GameOverSceneKey = 'GameOverScene';

interface GameOverData {
  victory: boolean;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(GameOverSceneKey);
  }

  create(data: GameOverData): void {
    const { width, height } = this.scale;
    const message = data?.victory ? 'CONTRACT COMPLETE' : 'CONTRACT FAILED';

    this.add.text(width / 2, height * 0.4, message, {
      fontFamily: 'Montserrat',
      fontSize: '42px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const prompt = this.add.text(width / 2, height * 0.55, 'Tap or Click to return to HQ', {
      fontFamily: 'Montserrat',
      fontSize: '24px',
      color: '#66ffcc'
    }).setOrigin(0.5);

    prompt.setInteractive({ useHandCursor: true }).on('pointerup', () => {
      this.scene.start(MenuSceneKey);
    });

    this.input.keyboard?.once('keydown', () => {
      this.scene.start(MenuSceneKey);
    });
  }
}
