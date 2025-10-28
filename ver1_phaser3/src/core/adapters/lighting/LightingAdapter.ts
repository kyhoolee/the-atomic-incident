import Phaser from 'phaser';

import { LightingConfig, LightRegistrationOptions } from './types';

export interface LightingAdapter {
  registerLight(gameObject: Phaser.GameObjects.GameObject, options?: LightRegistrationOptions): string;
  registerStaticLight(config: LightRegistrationOptions): string;
  update(delta: number): void;
  isPointInShadow(point: Phaser.Math.Vector2): boolean;
  destroy(): void;
}

class RenderTextureLightingAdapter implements LightingAdapter {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, _config?: LightingConfig) {
    this.scene = scene;
    // TODO: initialize render texture based lighting per design document
  }

  registerLight(_gameObject: Phaser.GameObjects.GameObject, _options?: LightRegistrationOptions): string {
    // TODO: implement actual registration; returning placeholder id for now
    return Phaser.Utils.String.UUID();
  }

  registerStaticLight(_config: LightRegistrationOptions): string {
    return Phaser.Utils.String.UUID();
  }

  update(_delta: number): void {
    // TODO: update occlusion & light rendering
  }

  isPointInShadow(_point: Phaser.Math.Vector2): boolean {
    return false;
  }

  destroy(): void {
    // TODO: cleanup resources
  }
}

export class LightingAdapterFactory {
  static create(type: 'renderTexture' | 'phaserLights' | 'simple', scene: Phaser.Scene, config?: LightingConfig): LightingAdapter {
    switch (type) {
      case 'renderTexture':
      default:
        return new RenderTextureLightingAdapter(scene, config);
    }
  }
}
