import { LightingAdapterFactory } from '@core/adapters/lighting/LightingAdapter';
export class LightingSystem {
    scene;
    adapter;
    constructor(scene, config) {
        this.scene = scene;
        this.adapter = LightingAdapterFactory.create('renderTexture', scene, config);
    }
    registerPlayerLight(gameObject, options) {
        return this.adapter.registerLight(gameObject, options);
    }
    registerStaticLight(config) {
        return this.adapter.registerStaticLight(config);
    }
    update(delta) {
        this.adapter.update(delta);
    }
    isPointInShadow(point) {
        return this.adapter.isPointInShadow(point);
    }
    destroy() {
        this.adapter.destroy();
    }
}
