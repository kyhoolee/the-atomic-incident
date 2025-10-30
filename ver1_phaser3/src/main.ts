import Phaser from 'phaser';

import { GAME_WIDTH, GAME_HEIGHT, GAME_CONTAINER_ID, GAME_TITLE } from '@config/gameConfig';
import { BootScene } from '@scenes/BootScene';
import { LoadScene } from '@scenes/LoadScene';
import { MenuScene } from '@scenes/MenuScene';
import { ContractScene } from '@scenes/ContractScene';
import { GameOverScene } from '@scenes/GameOverScene';
import { InputDebugScene } from '@scenes/InputDebugScene';
import { InputDebugSceneV2 } from '@scenes/InputDebugSceneV2';
import { InputDebugSceneV3 } from '@scenes/InputDebugSceneV3';
import { TouchPadDebugScene } from '@scenes/TouchPadDebugScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: GAME_CONTAINER_ID,
  title: GAME_TITLE,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: false,
  backgroundColor: '#080A10',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  input: {
    activePointers: 3,
    topOnly: false
  },
  scene: [
    BootScene,
    LoadScene,
    MenuScene,
    ContractScene,
    GameOverScene,
    InputDebugScene,
    InputDebugSceneV2,
    InputDebugSceneV3,
    TouchPadDebugScene
  ]
};

export class TheAtomicIncidentGame extends Phaser.Game {
  constructor() {
    super(config);
  }
}

window.addEventListener('load', () => {
  // eslint-disable-next-line no-new
  console.log('[Bootstrap] Creating game instance');
  new TheAtomicIncidentGame();
});
