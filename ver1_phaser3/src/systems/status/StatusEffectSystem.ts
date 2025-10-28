import { StatusEffectCatalog, StatusEffectId, StatusEffectInstance } from '@gameplay/player/statusEffects';

export interface StatusEntity {
  id: string;
  isAlive(): boolean;
}

export interface EffectContext {
  sourceId?: string;
}

export class StatusEffectSystem {
  private active = new Map<string, Map<StatusEffectId, StatusEffectInstance>>();

  queueApply(entity: StatusEntity, effectId: StatusEffectId, context?: EffectContext): void {
    const effect = StatusEffectCatalog[effectId];
    if (!effect) return;

    if (!this.active.has(entity.id)) {
      this.active.set(entity.id, new Map());
    }

    const entityEffects = this.active.get(entity.id)!;
    const existing = entityEffects.get(effectId);

    if (existing) {
      existing.refresh(context);
    } else {
      const instance = effect.createInstance(entity, context);
      entityEffects.set(effectId, instance);
    }
  }

  update(delta: number): void {
    for (const [entityId, effects] of this.active.entries()) {
      for (const [effectId, instance] of effects.entries()) {
        if (instance.update(delta)) {
          effects.delete(effectId);
        }
      }
      if (effects.size === 0) {
        this.active.delete(entityId);
      }
    }
  }
}
