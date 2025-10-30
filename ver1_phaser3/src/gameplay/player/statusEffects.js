export const StatusEffectCatalog = {
    burn: {
        createInstance: () => ({
            update: () => {
                // TODO: apply DoT via DamageSystem integration
                return true; // placeholder immediate expiry
            },
            refresh: () => { }
        })
    },
    slow: {
        createInstance: () => ({
            update: () => true,
            refresh: () => { }
        })
    },
    stealth: {
        createInstance: () => ({
            update: () => true,
            refresh: () => { }
        })
    }
};
