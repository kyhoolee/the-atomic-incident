import Phaser from 'phaser';
import { MenuSelection } from '@core/state/menuState';

export interface MenuViewCallbacks {
  onPlay: (selection: MenuSelection) => void;
  onOptions: () => void;
  onAgents: () => void;
  onArsenal: () => void;
}

export class MenuView {
  private scene: Phaser.Scene;
  private selection: MenuSelection;
  private callbacks: MenuViewCallbacks;

  constructor(scene: Phaser.Scene, selection: MenuSelection, callbacks: MenuViewCallbacks) {
    this.scene = scene;
    this.selection = selection;
    this.callbacks = callbacks;

    this.build();
  }

  private build(): void {
    const { width, height } = this.scene.scale;

    const title = this.scene.add.text(width / 2, height * 0.2, 'THE ATOMIC INCIDENT', {
      fontFamily: 'Montserrat',
      fontSize: '48px',
      color: '#ffffff'
    });
    title.setOrigin(0.5);

    const playButton = this.scene.add.text(width / 2, height * 0.45, '[ PLAY ]', {
      fontFamily: 'Montserrat',
      fontSize: '32px',
      color: '#66ffcc'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playButton.on('pointerup', () => this.callbacks.onPlay(this.selection));

    // TODO: replace placeholder text buttons with UI components defined in design doc.

    const optionsButton = this.scene.add.text(width / 2, height * 0.55, 'Options', {
      fontFamily: 'Montserrat',
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    optionsButton.on('pointerup', () => this.callbacks.onOptions());
  }

  // Future: functions to update selection when user changes stage/difficulty/mode.
}
