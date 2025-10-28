import Phaser from 'phaser';

import { ContractSceneKey, MenuSceneKey } from './sceneKeys';
import { MenuView } from '@ui/menu/MenuView';
import { MenuSelection } from '@core/state/menuState';


export class MenuScene extends Phaser.Scene {
  private menuView?: MenuView;
  private selection: MenuSelection = {
    stageId: 'neon-district',
    difficulty: 'rookie',
    mode: 'contract',
    agentId: 'operative'
  };

  constructor() {
    super(MenuSceneKey);
  }

  create(): void {
    console.log('[MenuScene] create() with selection', this.selection);
    this.buildView();
  }

  private buildView(): void {
    this.menuView = new MenuView(this, this.selection, {
      onPlay: (selection) => this.startContract(selection),
      onOptions: () => this.showOptions(),
      onAgents: () => this.showAgents(),
      onArsenal: () => this.showArsenal()
    });
  }

  private startContract(selection: MenuSelection): void {
    console.log('[MenuScene] startContract', selection);
    this.selection = selection;
    this.scene.start(ContractSceneKey, selection);
  }

  private showOptions(): void {
    // TODO: open options modal (overlay layer)
  }

  private showAgents(): void {
    // TODO: open agents modal
  }

  private showArsenal(): void {
    // TODO: open arsenal modal
  }
}
