import Phaser from 'phaser';

import { LightingAdapter, LightingAdapterFactory } from '@core/adapters/lighting/LightingAdapter';
import { LightingConfig } from '@core/adapters/lighting/types';

export class LightingSystem {
  private scene: Phaser.Scene;
  private adapter: LightingAdapter;

  constructor(scene: Phaser.Scene, config?: LightingConfig) {
    this.scene = scene;
    this.adapter = LightingAdapterFactory.create('renderTexture', scene, config);
  }

  registerPlayerLight(gameObject: Phaser.GameObjects.GameObject, options?: any): string {
    return this.adapter.registerLight(gameObject, options);
  }

  registerStaticLight(config: any): string {
    return this.adapter.registerStaticLight(config);
  }

  update(delta: number): void {
    this.adapter.update(delta);
  }

  isPointInShadow(point: Phaser.Math.Vector2): boolean {
    return this.adapter.isPointInShadow(point);
  }

  destroy(): void {
    this.adapter.destroy();
  }
}
