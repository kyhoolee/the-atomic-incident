export type StatusEffectId = 'burn' | 'slow' | 'stealth';

export interface StatusEffectInstance {
  update(delta: number): boolean; // returns true when expired
  refresh(context?: { sourceId?: string }): void;
}

export interface StatusEffectDefinition {
  createInstance(entity: { id: string }, context?: { sourceId?: string }): StatusEffectInstance;
}

export const StatusEffectCatalog: Record<StatusEffectId, StatusEffectDefinition> = {
  burn: {
    createInstance: () => ({
      update: () => {
        // TODO: apply DoT via DamageSystem integration
        return true; // placeholder immediate expiry
      },
      refresh: () => {}
    })
  },
  slow: {
    createInstance: () => ({
      update: () => true,
      refresh: () => {}
    })
  },
  stealth: {
    createInstance: () => ({
      update: () => true,
      refresh: () => {}
    })
  }
};
