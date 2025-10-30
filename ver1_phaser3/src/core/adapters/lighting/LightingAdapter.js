import Phaser from 'phaser';
class RenderTextureLightingAdapter {
    scene;
    constructor(scene, _config) {
        this.scene = scene;
        // TODO: initialize render texture based lighting per design document
    }
    registerLight(_gameObject, _options) {
        // TODO: implement actual registration; returning placeholder id for now
        return Phaser.Utils.String.UUID();
    }
    registerStaticLight(_config) {
        return Phaser.Utils.String.UUID();
    }
    update(_delta) {
        // TODO: update occlusion & light rendering
    }
    isPointInShadow(_point) {
        return false;
    }
    destroy() {
        // TODO: cleanup resources
    }
}
export class LightingAdapterFactory {
    static create(type, scene, config) {
        switch (type) {
            case 'renderTexture':
            default:
                return new RenderTextureLightingAdapter(scene, config);
        }
    }
}
