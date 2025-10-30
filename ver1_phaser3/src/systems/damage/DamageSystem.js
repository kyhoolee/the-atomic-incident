export class DamageSystem {
    effectSystem;
    constructor(effectSystem) {
        this.effectSystem = effectSystem;
    }
    applyDamage(target, amount, context) {
        if (!target.isAlive())
            return;
        target.takeDamage(amount, context);
        if (context?.statusEffects && this.effectSystem && isStatusEntity(target)) {
            for (const effectId of context.statusEffects) {
                this.effectSystem.queueApply(target, effectId, { sourceId: context.source });
            }
        }
    }
}
function isStatusEntity(entity) {
    return typeof entity.id === 'string';
}
