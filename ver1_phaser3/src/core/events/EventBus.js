import Phaser from 'phaser';
/**
 * Thin wrapper around Phaser.EventEmitter to provide a consistent event bus API.
 */
export class EventBus {
    emitter;
    constructor(emitter) {
        this.emitter = emitter ?? new Phaser.Events.EventEmitter();
    }
    emit(event, payload) {
        this.emitter.emit(event, payload);
    }
    on(event, handler, context) {
        this.emitter.on(event, handler, context);
        return () => this.off(event, handler, context);
    }
    once(event, handler, context) {
        this.emitter.once(event, handler, context);
    }
    off(event, handler, context) {
        this.emitter.off(event, handler, context, false);
    }
    removeAll(event) {
        if (event) {
            this.emitter.removeAllListeners(event);
        }
        else {
            this.emitter.removeAllListeners();
        }
    }
    destroy() {
        this.removeAll();
    }
}
/**
 * Global event bus for cross-system communication.
 */
export const gameEvents = new EventBus();
/**
 * Helper to create scoped event bus instances (e.g., per scene).
 */
export const createEventBus = () => new EventBus();
