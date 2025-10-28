import { StatusEffectSystem } from '@systems/status/StatusEffectSystem';

export interface DamageContext {
  source?: string;
  critical?: boolean;
  statusEffects?: string[];
}

export interface Damageable {
  takeDamage(amount: number, context?: DamageContext): void;
  isAlive(): boolean;
}

export class DamageSystem {
  private effectSystem?: StatusEffectSystem;

  constructor(effectSystem?: StatusEffectSystem) {
    this.effectSystem = effectSystem;
  }

  applyDamage(target: Damageable, amount: number, context?: DamageContext): void {
    if (!target.isAlive()) return;
    target.takeDamage(amount, context);

    if (context?.statusEffects && this.effectSystem && isStatusEntity(target)) {
      for (const effectId of context.statusEffects) {
        this.effectSystem.queueApply(target, effectId, { sourceId: context.source });
      }
    }
  }
}

function isStatusEntity(entity: Damageable): entity is Damageable & { id: string } {
  return typeof (entity as any).id === 'string';
}
